# /create Portal: Next Evolution

**Date:** 2026-06-08
**Status:** Strategic direction. Do not build until existing brain + hooks are stable.
**Depends on:** Creator Brain (L2) fully wired, migration applied, backfill run.

---

## Two pillars

### 1. Customer Acquisition as a Game

The Vibe Rise challenge gamifies personal growth (RP, streaks, capacity score). Apply the same mechanics to "fill the room."

**How it works:**

- Creator adds an experience with a date and capacity (e.g., breathwork circle, 12 spots, June 28)
- System generates a **Fill Score** (0-100%) based on spots filled vs capacity
- Reverse countdown unlocks daily "plays" (post this, email that, DM this person)
- Each completed play earns RP, moves the Fill Score
- Real metrics feed back in: Instagram reach via Composio, contacts added, RSVPs confirmed
- The brain adjusts intensity based on inner game state ("your capacity is low this week, here's 1 high-impact play instead of 5")

**Key milestones in the countdown:**

| Days out | System does |
|----------|------------|
| 21 days | Generate campaign plan, first social posts drafted |
| 14 days | Email past attendees, DM top fans |
| 7 days | Urgency push ("X spots left"), reminder sequence |
| 3 days | Final push, confirm logistics checklist |
| 1 day | Reminder email to confirmed attendees |
| Day of | "You've got this" message, prep checklist |
| Day after | Thank-you email, feedback request, 3% reflection prompt |

**Gamification layer:**

- Fill Score displayed prominently (like Capacity Score on Level tab)
- RP earned per completed play
- Streak for completing daily plays
- "Room Full" celebration when 100% capacity hit (confetti, level-up animation)
- Historical fill rates tracked in Performance domain of brain
- Leaderboard potential: creators competing on fill rates (Fantasy League evolution)

**The reframe:** The creator isn't "doing marketing." They're playing a game to fill the room. The platform does the thinking. They do the approving.

---

### 2. Agents That Actually Do the Work

The brain (L2) knows what to do. Composio knows how to reach the outside world. Agents connect the two.

**Agent roster:**

| Agent | What it does | Composio integration | Brain domains used |
|-------|-------------|---------------------|-------------------|
| **Content Agent** | Drafts social posts from brain context, publishes via approval queue | Instagram (publish) | voice, offer, identity |
| **Follow-up Agent** | Identifies contacts needing outreach, drafts personalized messages | Gmail (draft/send) | audience, voice, performance |
| **Metrics Agent** | Pulls Instagram insights daily, writes to brain | Instagram (read) | performance, voice |
| **Fill-the-Room Agent** | Generates full campaign for upcoming experience, manages countdown | Instagram + Gmail | all 6 domains |
| **Post-Event Agent** | Sends thank-you, requests feedback, triggers 3% reflection | Gmail | audience, performance |
| **Re-engagement Agent** | Finds dormant fans, drafts invite to next event | Gmail | audience, voice |

**Progressive trust model:**

1. **Level 1 (default):** Agent drafts, creator approves everything
2. **Level 2 (earned):** Agent auto-publishes content if creator approved 10+ similar items without edits
3. **Level 3 (full trust):** Agent acts autonomously for routine tasks (metrics pull, follow-up emails), creator reviews weekly digest

Trust level is per-agent, per-creator. Stored in brain or a separate trust table.

**Approval Queue:**

Extend the existing Content Queue pattern (`/crm/content-queue`) to handle all agent outputs:
- Social posts (from Content Agent)
- Email drafts (from Follow-up Agent, Post-Event Agent)
- Campaign plans (from Fill-the-Room Agent)
- DM drafts (from Re-engagement Agent)

Single inbox: "Here's what your AI team prepared. Approve / edit / skip."

---

## Composio integration plan

**Already connected:** Instagram (`@_huzz`, active)

**Per-creator OAuth flow:**
1. Creator taps "Connect Instagram" in Growth tab or Settings
2. Vibe Rise generates a Composio Connect Link (white-labeled)
3. Creator authorizes on Instagram's OAuth screen
4. Token stored in Composio, linked to their Vibe Rise user ID
5. Metrics Agent begins daily pulls, writing to brain

**Cost model (Composio):**
- Free tier: 20K tool calls/mo (~130 creators with daily pulls)
- $29/mo tier: 200K calls (~1,300 creators)
- $229/mo tier: 2M calls (~13,000 creators)
- Scales with revenue. Not a concern until significant user base.

**Future integrations (same Composio pattern):**
- Gmail (follow-up automation, email sequences)
- Google Calendar / Cal.com (booking sync)
- Stripe (revenue tracking -> brain performance domain)
- TikTok, YouTube (additional content channels)

---

## How it connects to the 5 layers

```
L5  Platform / Ecosystem     — Leaderboard across creators, playbook marketplace
L4  The Build Layer           — Landing page generator uses brain + Composio
L3  Autonomous Operations     — THIS IS THE UNLOCK. Agents + approval queue.
L2  Business Context Engine   — Creator Brain (built, wiring up)
L1  Franchise Playbook        — Fill-the-room playbook per experience type
```

The two pillars (gamified acquisition + working agents) are both L3. Everything before this (L1 playbooks, L2 brain) was building the foundation. L3 is where the product goes from "tool I use" to "employee that helps me."

---

## Build sequence (when ready)

1. **Composio Connect Link** - Let creators connect their Instagram
2. **Metrics Agent** - Daily pull of follower count + post performance -> brain
3. **Fill Score** - Display on Experience Pipeline when experience has a date
4. **Content Agent** - Auto-draft posts for upcoming experience from brain context
5. **Approval Queue v2** - Extend Content Queue to handle all agent outputs
6. **Fill-the-Room Agent** - Full campaign generation with countdown milestones
7. **Follow-up Agent** - Post-event and re-engagement automation
8. **Progressive Trust** - Track approval patterns, offer autonomy upgrades

---

## Reference docs

- `docs/create-portal-5-layer-architecture.md` - Full 5-layer spec with brain architecture
- `docs/create-portal-automation-analysis.md` - Tree.html capability mapping
- `docs/creator-brain-gaps-from-claude-portal.md` - Fields to add later
- `docs/vibe-rise-ecosystem-architecture.md` - Master ecosystem design
