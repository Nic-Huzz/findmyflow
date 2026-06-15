# Agent Tree: Action Map

**Date:** 2026-06-15
**Purpose:** Every leaf node from the tree.html capability map, mapped to a specific agent action with traffic light status. This is the case-by-case reference for what an agent can do today, what needs a connection, and what needs building.

**Traffic lights:**
- **GREEN** = Agent can do this now (brain data + existing edge function/service)
- **YELLOW** = Needs a Composio connection or small integration, then agent can do it
- **RED** = Needs new development (new edge function, new flow, or new Composio tool)

---

## Make More Money

### Phase 1: Package Your Offer

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Value Stack Builder | **GREEN** | `offer.*` (attraction/core/continuity products + statuses) | Agent reads offer data, identifies gaps ("you have attraction but no continuity"), proposes next flow | Brain wired. Offer flows exist. Agent just needs decision logic. |
| Pricing & Guarantee | **GREEN** | `offer.core_price`, `offer.income_target`, `offer.clients_needed` | Agent reads PTUF data, flags if pricing doesn't support income target | Brain wired. PTUF calculator exists. |

### Phase 2: Choose Your Hook

| Node | Agent Status | What's needed |
|------|-------------|---------------|
| Win Your Money Back | **RED** | Hook scorer flow not built. Agent can't recommend hooks yet. Need: guided flow that scores 6 Hormozi hooks against creator's offer, then generates hook copy. |
| Decoy Offer | **RED** | Same |
| Pay Less Now | **RED** | Same |
| Buy X Get Y Free | **RED** | Same |
| Giveaway | **RED** | Same |
| Free With Consumption | **RED** | Same |

**To turn GREEN:** Build a hook scorer flow (or let the agent score hooks directly using brain offer data + Sales Playbook frameworks). Could be an agent action rather than a UI flow: agent reads `offer.*` + `identity.creator_archetype`, runs scoring logic, proposes "Your best hook is X because Y" in approval queue.

### Phase 3: Pick Your Channels — Content Creation

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Instagram Posts | **GREEN → YELLOW** | `voice.*`, `offer.*`, `identity.*` | Content Agent drafts post using brain context + Content Generator edge function | GREEN to draft. YELLOW to publish (needs Composio Instagram connect per creator). |
| LinkedIn Posts | **GREEN → YELLOW** | Same | Same draft flow, different platform template | GREEN to draft. YELLOW to publish (needs Composio LinkedIn connect). |
| Blog / SEO | **GREEN** | `voice.*`, `offer.*`, `identity.remarkable_angle` | Content Agent drafts long-form from brain context | Content Generator supports blog format. No external publish needed (user copies). |
| Newsletter | **YELLOW** | `voice.*`, `audience.*` | Agent drafts newsletter, sends via email edge function | Edge function `process-scheduled-newsletters` exists but needs Resend/Sendgrid key connected. |

### Phase 3: Pick Your Channels — Outreach

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Email (Warm Outreach) | **YELLOW** | `audience.top_fans`, `voice.*` | Follow-up Agent drafts personal emails to warm contacts | Gmail MCP exists. Needs Composio Gmail OAuth per creator. Edge function for sending exists. |
| Cold Email | **RED** | `audience.icp_*`, `offer.*` | Agent generates cold outreach sequence | No cold email system. Needs: prospect list source + email sending + sequence logic. Low priority for experience creators. |
| LinkedIn DMs | **RED** | `audience.*`, `voice.*` | Agent drafts LinkedIn DMs | No LinkedIn DM integration. Composio has LinkedIn tools but DM automation is against ToS. |
| Meta Ads | **RED** | — | — | No ad management system. Out of scope for v1. |
| Google Ads | **RED** | — | — | Same. |

### Phase 4: Create & Send

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Campaign Plan | **GREEN** | All 6 brain domains | Fill-the-Room Agent generates reverse-timeline campaign based on experience date + fill rate + brain context | Brain wired. Milestone template logic designed (agent-action-layer-spec.md section 5). Needs: decision engine implementation. |
| Draft & Review | **GREEN** | `voice.*`, `offer.*`, `identity.*` | Content Agent generates drafts, writes to approval queue | Content Generator edge function exists. Approval queue table needed. |
| Send & Track | **YELLOW** | `performance.*` | Agent executes approved items via Composio + tracks results back to brain | Needs: Composio connections (Instagram publish, Gmail send) + `executeAction()` function + metrics pull back to brain. |

### Earn More Revenue

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Upsell (4 types) | **GREEN** | `offer.*` | Agent reads offer stack, identifies upsell gaps, suggests Implementation Tracker next steps | Flows exist. Agent needs decision logic only. |
| Downsell (3 types) | **GREEN** | `offer.*` | Same pattern | Same |
| Continuity (6 types) | **GREEN** | `offer.*` | Same pattern | Same |

---

## Save More Time

### Drowning in Admin

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Xero / QuickBooks | **RED** | `performance.monthly_revenue` | Agent syncs expenses, generates P&L | Composio has Xero/QuickBooks tools but OAuth integration not built. Low priority (most creators don't use these). |
| Calendly | **YELLOW** | `offer.experience_types` | When creator creates experience, agent auto-creates booking link + syncs RSVPs back as contacts | Composio has Calendly tools. Needs: OAuth connect + experience creation hook + contact sync logic. |
| Custom Tools | **RED** | — | — | L4 Build Layer. Future. |

### Losing Track of Leads

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| CRM (replaces HubSpot) | **GREEN** | `audience.*` | Native CRM already built. Agent reads contact data for follow-up decisions. | Done. Brain audience domain auto-populates from CRM activity (hook not built yet but designed). |
| Gmail Follow-ups | **YELLOW** | `audience.top_fans`, `audience.warm_leads_count`, `voice.*` | Follow-up Agent identifies contacts needing outreach, drafts email, writes to approval queue | Needs: Composio Gmail OAuth + approval queue + `draft_email` action. |
| Email Sequences | **GREEN** | `voice.*`, `audience.*` | Post-Event Agent triggers existing sequence builder when experience completes | Sequence builder exists. Trigger logic needs wiring (edge function `enroll-email-sequence` exists but no auto-trigger). |

### Don't Know What's Working

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Stripe Analytics | **YELLOW** | `performance.monthly_revenue`, `performance.total_revenue` | Metrics Agent pulls Stripe data, writes to brain performance domain | Composio has Stripe tools. Needs OAuth connect + pull logic + brain write hook. |
| Google Analytics | **RED** | — | — | No integration. Lower priority than Instagram metrics. |
| Dashboard | **GREEN** | All brain domains | Weekly Digest Agent compiles brain data into summary. Dashboard already exists. | CRM Dashboard + Reports + Smart Alerts all exist. Agent adds the "compiled for you" digest layer. |

### Quoting / Invoicing

| Node | Agent Status | Brain fields used | Agent action | What's needed |
|------|-------------|------------------|--------------|---------------|
| Invoice Generator | **RED** | `offer.core_price`, `identity.business_name` | Agent generates invoice from offer data + contact | Needs: invoice template + PDF generation. Could use existing `pdfGenerator.js`. Medium priority for corporate event creators. |
| Square / Invoice Ninja | **RED** | — | — | External payment integrations. Low priority. |

---

## Summary by traffic light

| Status | Count | What it means |
|--------|-------|--------------|
| **GREEN** | 14 | Agent can act now. Needs decision logic + approval queue only. |
| **YELLOW** | 9 | Needs one Composio OAuth connection, then agent can act. |
| **RED** | 11 | Needs new development (new flow, new integration, or out of scope). |

### The GREEN path (what agents can do first, no new integrations)

These 14 nodes can be agent-powered with just the brain + existing edge functions + approval queue:

1. Value Stack gap analysis ("you're missing continuity")
2. Pricing sanity check ("your PTUF says you need 15 clients but you average 8")
3. Instagram post drafting (via Content Generator)
4. LinkedIn post drafting (via Content Generator)
5. Blog/SEO content drafting
6. Campaign plan generation (reverse-timeline from experience date)
7. Draft & review (all content types to approval queue)
8. Upsell gap analysis
9. Downsell gap analysis
10. Continuity gap analysis
11. CRM contact analysis (who needs follow-up)
12. Email sequence triggering (post-event)
13. Dashboard digest (weekly summary from brain)
14. Fill-rate analysis ("you need 12, you have 8, here's what to do")

### The YELLOW path (unlocked per Composio connection)

Each connection unlocks multiple agent actions:

| Connection | Unlocks |
|-----------|---------|
| **Instagram** (Composio) | Auto-publish posts, pull metrics, update brain performance | 
| **Gmail** (Composio) | Send follow-up emails, warm outreach, post-event sequences |
| **Calendly** (Composio) | Auto-create booking links, sync RSVPs to contacts |
| **Stripe** (Composio) | Revenue tracking, brain performance domain auto-update |

### The RED path (park for later)

- Hook scorer flow (build when offer depth is a priority)
- Cold email system (not relevant for most experience creators)
- LinkedIn DMs (ToS issues)
- Ads management (out of scope)
- Accounting integrations (low priority)
- Invoice generator (medium priority, corporate event creators)
- Custom tool builder (L4, future)

---

## Agent delivery: Pipeline nodes, not a separate portal

Agents don't need their own portal. They surface inside the **Experience Pipeline nodes** (Attract → Capture → Convert → Deliver → Grow) and existing task/queue surfaces.

Each pipeline node already has:
- A status indicator (good/warn/empty)
- A readiness percentage
- Checklist items (via `experience_checklist_items`)
- Manual metric input (via `MetricInputSheet`)

Agent actions slot into this:
- **Attract node** → Content Agent drafts + warm outreach list
- **Capture node** → Landing page performance monitoring
- **Convert node** → Email/DM nudges for unconverted signups
- **Deliver node** → Checklist reminders (existing)
- **Grow node** → Post-event sequence + re-engagement

When an agent has proposals ready, the node shows a badge (e.g., "3 drafts ready"). Tapping the node shows the proposals inline. No separate queue page needed for v1.

Sol (the OpenClaw edge function) is parked. The simpler model is: JS decision logic per node + Claude for content generation + Composio for execution. Sol can be revisited if multi-step agent reasoning is needed later.

---

## V1 scope: 4 low-hanging fruit actions

### Action 1: Content drafts (Attract node)

**Trigger:** Experience exists with date in future
**Agent logic:** Read brain (voice, offer, identity) → call Content Generator edge function → write draft to approval queue
**User sees:** Attract node badge "2 posts drafted" → tap → review/approve/edit
**Execution:** Approved post → Content Queue (manual posting for v1, Composio auto-post later)

### Action 2: Warm outreach list (Attract node)

**Trigger:** Experience exists + CRM contacts with 2+ past attendances
**Agent logic:** Read brain (audience.top_fans) + query contact_experiences → generate prioritised list with suggested message snippet per contact
**User sees:** Attract node "5 warm leads to contact" → tap → see list with draft messages
**Execution:** User sends manually (or approve → Composio Gmail later)

### Action 3: Email newsletter draft (Attract node)

**Trigger:** Experience in <21 days + email template exists
**Agent logic:** Read brain (voice, offer, audience) → draft newsletter announcing event → write to approval queue
**User sees:** Attract node "Newsletter draft ready" → tap → review/edit/send
**Execution:** Approved → email edge function sends (needs Resend key connected)

### Action 4: Landing page + checkout performance monitor (Capture node)

**Trigger:** Experience has a landing page URL (from `crm_pages` or experience record)
**Agent logic:** Pull page metrics (if Composio analytics connected) OR read manual metric input → compare conversion rates against benchmarks → if below threshold, generate specific recommendations
**User sees:** Capture node shows "Conversion low (2%). 3 recommendations" → tap → see edits like "Add testimonial above fold", "Reduce form fields", "Strengthen headline with your rule break: [brain.identity.rule_break]"
**Execution:** Recommendations only (user makes changes). Future: L4 Build Layer auto-edits the page.

---

## Recommended first agent case: Content Agent for upcoming experience

**Why this one:**
- All GREEN (brain + Content Generator exist)
- Highest perceived value ("it wrote my Instagram post for me")
- Simplest decision logic (experience has date → draft post)
- Tests the full pipeline: trigger → brain read → draft → approval queue → execute
- No Composio needed for v1 (approved post goes to Content Queue for manual posting)

**The case:**
1. Creator has experience "June Breathwork Circle" in 14 days
2. On page load, Content Agent checks: upcoming experience + milestone hit + no existing proposal
3. Agent reads brain: voice (casual, vulnerable), offer (breathwork, $30, 12 spots), identity (Playful Creator)
4. Agent calls Content Generator edge function with brain context + "Instagram post for upcoming workshop"
5. Agent writes to approval_queue: title, preview, full payload
6. Creator opens queue, sees: "📸 Instagram Post: June Breathwork Circle"
7. Creator taps Approve → post moves to Content Queue
8. (Future: with Composio Instagram connected, Approve → auto-publish)

---

## Reference docs

- `docs/agent-action-layer-spec.md` — Architecture (triggers, approval queue, progressive trust)
- `docs/create-portal-5-layer-architecture.md` — L1-L5 spec + brain
- `docs/create-portal-next-evolution.md` — Strategic direction
- `docs/create-portal-automation-analysis.md` — Original tree mapping
- `src/lib/brain/` — Creator Brain implementation
- `supabase/functions/content-generator/` — Content Generator edge function
- `supabase/functions/agent-chat/` — Agent streaming
- `supabase/functions/mcp-server/` — MCP server (6 tools)
