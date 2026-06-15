# Agent Action Layer Spec

**Date:** 2026-06-15
**Status:** Design spec. Ready for implementation when Creator Brain is stable.
**Depends on:** Creator Brain wired + tested, existing agent infrastructure (AgentsContext, MCP server, edge functions)

---

## What exists today

| Component | What it can do | What it can't do |
|-----------|---------------|-----------------|
| Agent Chat (Zarlo/Perry) | Discuss strategy, give advice, manage task lists | Take action, create content, send anything |
| MCP Server | List flows, submit assessments, get user context, complete quests | Create content, manage contacts, trigger campaigns |
| Content Generator | Generate social posts from context | Auto-trigger, post to platforms, queue without UI |
| Email Functions | Send notifications, process sequences, newsletters | Trigger on their own (no cron), draft from brain context |
| Portal Tasks | Track action items per pipeline node | Execute the action, no agent writes to them |
| Creator Brain | Full creator context (93 fields, 6 domains) | Not yet consumed by agents (only tested via console) |

---

## Architecture: Three layers

```
┌─────────────────────────────────────────────────────┐
│  1. TRIGGERS (what causes an agent to wake up)      │
│     - Event countdown milestone hit                  │
│     - Daily cron (morning digest)                    │
│     - CRM state change (new contact, deal closed)    │
│     - Experience marked complete                     │
│     - User opens approval queue                      │
│     - Manual: user asks agent in chat                │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  2. AGENT DECISIONS (brain context → action plan)    │
│     - Read creator brain (getCreatorBrain)           │
│     - Evaluate what needs doing                      │
│     - Generate action proposals                      │
│     - Write proposals to approval_queue table        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  3. EXECUTION (approved proposals → real actions)    │
│     - Content → Composio Instagram publish           │
│     - Email → edge function send                     │
│     - DM → Composio Gmail draft                      │
│     - Metrics → Composio Instagram read → brain      │
│     - Internal → update brain, create tasks, etc.    │
└─────────────────────────────────────────────────────┘
```

---

## 1. Triggers

### Event-driven triggers (fire automatically)

| Trigger | When | Agent | Action |
|---------|------|-------|--------|
| `experience.countdown` | Experience date minus 21/14/7/3/1 days | Fill-the-Room | Generate campaign tasks for this milestone |
| `experience.completed` | Experience status → completed | Post-Event | Draft thank-you, feedback request, 3% prompt |
| `contact.dormant` | Contact attended 2+ events, no contact in 30+ days | Re-engagement | Draft personal invite to next event |
| `daily.morning` | 8am local time (cron) | Metrics | Pull Instagram insights, update brain |
| `weekly.digest` | Monday morning (cron) | All | Compile weekly summary for approval queue |

### User-initiated triggers

| Trigger | When | Agent |
|---------|------|-------|
| `chat.request` | User asks in Agent Portal chat | Zarlo/Perry (existing) |
| `queue.open` | User opens approval queue | All (refresh pending proposals) |
| `manual.generate` | User taps "Generate campaign" on an experience | Fill-the-Room |

### Implementation

Triggers need a dispatcher. Two options:

**Option A: Supabase cron + edge function** (simpler, server-side)
- One edge function `agent-dispatcher` runs on cron (every hour or every morning)
- Reads all users' upcoming experiences, contact states, brain data
- Generates proposals and writes to `approval_queue` table
- User sees proposals next time they open the app

**Option B: Client-side on page load** (simpler to build first)
- When user opens `/create`, check for pending triggers
- Run agent logic client-side using brain data
- Write proposals to `approval_queue`
- No cron needed, but only fires when user is active

**Recommendation:** Start with Option B (client-side) for v1. Move to Option A when cron is set up.

---

## 2. Agent Actions (the API surface)

Each action is a function an agent can call. They all write to the `approval_queue` table, not execute directly.

### Content actions

| Action | Input | Output | Execution |
|--------|-------|--------|-----------|
| `draft_social_post` | brain context + content type + platform | Post copy + image prompt | Composio Instagram publish |
| `draft_email` | brain context + recipient + purpose | Subject + body + recipient | Edge function email send |
| `draft_dm` | brain context + contact + message type | Message text + contact | Composio Gmail/Instagram DM |
| `draft_campaign` | brain context + experience + timeline | Multi-day plan with assets | Creates multiple draft_ proposals |

### Data actions

| Action | Input | Output | Execution |
|--------|-------|--------|-----------|
| `pull_instagram_metrics` | Composio connection | Follower count, post performance | Write to brain performance domain |
| `update_brain_field` | field key + value | Updated brain field | Direct brain write (no approval needed) |
| `create_portal_task` | title + description + node_key | Task in portal_tasks | Direct write |

### Analysis actions (no approval needed)

| Action | Input | Output | Execution |
|--------|-------|--------|-----------|
| `analyse_fill_rate` | experience data + contacts | Fill Score + recommendations | Write to brain + return to chat |
| `analyse_content_performance` | content_history + Instagram data | Top content types, best times | Write to brain voice domain |
| `generate_weekly_digest` | all brain domains + CRM data | Summary markdown | Display in approval queue header |

---

## 3. Approval Queue

### New table: `approval_queue`

```sql
create table approval_queue (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  agent_id        text not null,          -- 'content', 'fill_the_room', 'follow_up', etc.
  action_type     text not null,          -- 'draft_social_post', 'draft_email', etc.
  status          text not null default 'pending',  -- pending, approved, edited, skipped, executed, failed
  priority        text default 'normal',  -- urgent, normal, low
  
  -- The proposal
  title           text not null,          -- "Instagram post for June breathwork circle"
  preview         text,                   -- First 200 chars or summary
  payload         jsonb not null,         -- Full action data (post copy, email body, recipient, etc.)
  
  -- Context
  experience_id   uuid,                   -- If tied to an experience
  contact_id      uuid,                   -- If tied to a contact
  trigger_reason  text,                   -- "Experience in 7 days, 5/12 spots filled"
  brain_snapshot  jsonb,                  -- Relevant brain fields used to generate this
  
  -- Resolution
  edited_payload  jsonb,                  -- If user edited before approving
  resolved_at     timestamptz,
  execution_result jsonb,                 -- Response from Composio/edge function after execution
  
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
```

### Approval Queue UI

Lives at `/create/queue` (or as a tab in CreatorHomeV2). Shows:

```
┌─────────────────────────────────────────┐
│ 📬 Your AI Team Prepared 4 Items        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📸 Instagram Post                   │ │
│ │ Content Agent · for June Breathwork │ │
│ │                                     │ │
│ │ "Your nervous system already knows  │ │
│ │  the answer. Come find it..."       │ │
│ │                                     │ │
│ │ [Approve] [Edit] [Skip]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✉️ Email to 23 past attendees       │ │
│ │ Fill-the-Room · 12 days until event │ │
│ │                                     │ │
│ │ Subject: "The circle is back..."    │ │
│ │                                     │ │
│ │ [Approve] [Edit] [Skip]            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Execution after approval

When user taps "Approve":
1. Status → `approved`
2. Execute the action:
   - `draft_social_post` → Call Composio `INSTAGRAM_CREATE_MEDIA` (if connected) or move to Content Queue (existing)
   - `draft_email` → Call email edge function with payload
   - `draft_dm` → Call Composio Gmail draft
3. Status → `executed` (or `failed` with error in `execution_result`)
4. Log to `portal_activity`

---

## 4. Progressive Trust

Stored per-agent, per-creator:

```sql
-- Could be a column on creator_brain or its own table
-- Simple v1: just a JSONB field on creator_brain

-- brain.facts['_trust.content_agent'] = {
--   level: 1,
--   approved_count: 0,
--   approved_without_edit: 0,
--   last_auto_ask: null
-- }
```

**Level transitions:**
- Level 1 → 2: After 10 consecutive approvals without edits, system asks "Want me to auto-post similar content next time?"
- Level 2 → 3: After 30 days of auto-execution with no rollbacks, system asks "Want me to handle routine follow-ups too?"
- Any → 1: User can always revoke via settings

---

## 5. Agent Decision Engine

The core logic that turns brain context into action proposals. This is the "intelligence" layer.

### For the Fill-the-Room Agent (most complex)

```javascript
async function fillTheRoomCheck(userId, experienceId) {
  const brain = await getCreatorBrain(userId)
  const experience = await getExperience(experienceId)
  
  const daysUntil = daysBetween(new Date(), experience.date)
  const fillRate = experience.attendee_count / experience.capacity
  const milestone = getMilestone(daysUntil) // 21, 14, 7, 3, 1, 0, -1
  
  if (!milestone) return // No milestone today
  
  // Check what's already been proposed for this milestone
  const existing = await getExistingProposals(userId, experienceId, milestone)
  if (existing.length > 0) return // Already proposed for this milestone
  
  // Read brain for context
  const voice = brain.facts['voice.tone_formality']?.value
  const capacity = brain.facts['inner_game.capacity_score']?.value
  const archetype = brain.facts['identity.creator_archetype']?.value
  
  // Adjust intensity based on inner game
  const intensity = capacity > 60 ? 'full' : capacity > 30 ? 'light' : 'minimal'
  
  // Generate proposals based on milestone + fill rate + intensity
  const proposals = await generateMilestoneProposals({
    milestone, fillRate, intensity, voice, archetype,
    experience, brain,
  })
  
  // Write to approval queue
  for (const proposal of proposals) {
    await insertApprovalItem(userId, proposal)
  }
}
```

### Milestone templates

| Days out | Fill < 50% | Fill 50-80% | Fill > 80% |
|----------|-----------|-------------|-----------|
| 21 | 3 social posts + email to past attendees | 2 social posts | 1 announcement post |
| 14 | Email + 3 posts + DM top fans | 2 posts + email | 1 reminder post |
| 7 | Urgency push (4 posts + email + DMs) | 2 posts + email | Countdown post |
| 3 | Final push (daily posts + personal DMs) | Reminder email | "Almost full" post |
| 1 | "Last chance" post + email | Reminder only | "Sold out" celebration |
| -1 (after) | Thank-you email + feedback + 3% prompt | Same | Same |

Intensity modifier:
- `full`: Execute all items in the template
- `light`: Execute top 2 items only
- `minimal`: Execute 1 item + "your AI team has more ready when you are"

---

## 6. Build sequence

### Phase 1: Foundation (enables everything else)

1. **`approval_queue` table** — Migration + RLS
2. **Approval Queue UI** — New tab in CreatorHomeV2 or standalone page
3. **`executeAction()` function** — Takes an approved queue item, calls the right edge function or Composio endpoint
4. **Wire `getCreatorBrain()` into agent-chat edge function** — So Zarlo/Perry can reference brain context in conversations

### Phase 2: First agent (Content Agent)

5. **Content Agent decision logic** — Reads brain + experience data, proposes social posts
6. **Client-side trigger** — When user opens `/create` with an experience in <21 days, run Content Agent check
7. **Approve → Content Queue** — Approved posts go to existing Content Queue (no Composio yet, manual posting)

### Phase 3: Composio integration

8. **Instagram Connect Link** — OAuth flow per creator
9. **Metrics Agent** — Daily pull (start with cron or on-page-load)
10. **Approve → Auto-post** — Approved posts publish directly via Composio

### Phase 4: Full agent roster

11. **Fill-the-Room Agent** — Milestone-based campaign generation
12. **Follow-up Agent** — Contact re-engagement
13. **Post-Event Agent** — Automated post-event sequence
14. **Progressive Trust** — Track approval patterns, offer autonomy

### Phase 5: Cron + background execution

15. **Supabase cron** — Schedule `agent-dispatcher` to run daily
16. **Push notifications** — "Your AI team has 3 items ready for review"
17. **Weekly digest** — Compiled summary of agent activity + metrics

---

## 7. How it connects to existing infrastructure

| Existing | How agents use it |
|----------|------------------|
| Creator Brain (`getCreatorBrain`) | Every agent reads brain context before generating proposals |
| Content Generator edge function | Content Agent calls this to draft posts (already voice-aware) |
| Email edge functions (scheduled-notifications, process-scheduled-emails) | Follow-up/Post-Event agents trigger these |
| Agent Chat (Zarlo/Perry in Portal) | Chat agents get brain context injected into system prompt |
| MCP Server | External agents can propose actions via API (new tool: `propose_action`) |
| Portal Tasks | Agents can create tasks for the user (lighter than approval queue) |
| Content Queue | Approved social posts flow into existing queue |
| Experience Pipeline | Fill-the-Room agent reads pipeline state, proposes checklist items |

---

## Reference docs

- `docs/create-portal-next-evolution.md` — Strategic direction (gamified acquisition + agents)
- `docs/create-portal-5-layer-architecture.md` — L3 autonomous ops spec + brain architecture
- `docs/create-portal-automation-analysis.md` — Capability mapping from tree.html
- `docs/creator-brain-gaps-from-claude-portal.md` — Brain fields to add later
- `src/lib/brain/` — Creator Brain implementation
- `src/components/portal/` — Existing AI Portal (Electron)
- `src/context/AgentsContext.jsx` — Existing agent chat system
- `supabase/functions/agent-chat/` — Agent streaming edge function
- `supabase/functions/mcp-server/` — MCP server with 6 tools
