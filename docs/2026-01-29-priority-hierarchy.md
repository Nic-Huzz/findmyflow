# FindMyFlow Priority Hierarchy & Test Milestones
**Date:** 2026-01-29 (Updated: 2026-02-11)
**Status:** Active Planning Document
**Purpose:** Stop scope creep. Define testable "done" gates.

---

## The Core Problem

You have:
- **30 tasks** in `2025-01-05-follow-up-tasks.md`
- **1326-line** Hero Journey game design doc
- **1375-line** Income Calculator ecosystem plan
- **100+ ideas** in your brain dump
- **No clear "done" threshold**

**The trap:** Continuously building without testing → never validate if it works.

---

## What's BUILT

### Core Platform ✅
- 10-Stage System (Flow Finder → Tracking)
- 34 flow components
- 7-Day Challenge with quest cards, filters, leaderboard
- Challenge layout: sub-tabs below artifact progress, HorizontalFlowRiver in Tracker tab, leaderboard button
- Weekly Planning (4-phase cycle) + skip for new users (auto-skip "Review Last Week" with 0 data)
- Zarlo AI widget (streaming, context-aware)
- Flow Compass (N/E/S/W) — restyled: purple gradient hero, white project cards, gold CTAs, project selector
- Groan Matrix (5 visibility layers, scary/wahoo scoring)
- Push Notifications (timezone-aware, 8am/12pm/6pm scheduling)
- MindSpace (/mind-space) — paste AI conversations for fast-track flow discovery

### User Hub & Identity ✅
- /me page hub: hero cards, HorizontalFlowRiver, stats rings, inline SeeYourFlow mapper (one-time)
- Hero Command Center (/hero-profile): identity triad, project expression cards, play-list progress
- Essence Profile (/archetypes/essence): archetype profile, strengths, shadow, integration
- Animated protective archetype icons
- Library of Answers (/library): three GradientWheel visualizations with lit segment labels
- Discovery Project for Vibe Seekers (stage 0)
- Flow Finder universalized (user-level completions, not project-specific)
- Design system guide (docs/page-component-design-guide.md)

### CRM ✅
- 3 towers (Attract, Nurture, Tools) — 34 pages, 42 components
- Content Generator + Planning
- Weekly Planning Session
- Business Flywheel System (4 phases, auto-detection, dashboard widget)
- Email Sequences with step editor + copy-to-clipboard + PromptGenerator
- CSV Import Wizard (6-step, Contacts + Deals, auto-mapping, validation)
- Contacts: full overhaul with deal creation, outreach columns (status, platform, priority, temperature)
- Warm Leads fully merged into Contacts (old table deprecated)
- Warm Outreach page = filtered view of contacts with outreach_status
- PromptGenerator in Pages, Email Sequences, Warm Outreach (7 templates)
- Lead capture email notifications via Resend
- Lead Scoring (PTUF sliders) — LeadScoreSliders.jsx
- 15 Hormozi Scripts + ScriptsModal.jsx with smart objection-based suggestions
- DailyActions integration (today's content + stale leads)
- ExecutionReview → WeeklyPlanningFlow merge
- Generated Assets Library
- CRM design overhaul (consistent styling, design guide)
- CRM audit — 7 migrations, bug fixes, pull-to-refresh

### Money Model ✅
- 6 flows using MoneyModelFlowBase + Money Model Guide flow UX
- Grand Slam Offer Builder (redesigned)
- Funnel Calculator (Stage 8)

### Onboarding ✅
- QuickCapture (5-step)
- HomeFirstTime flow (with persona branching)
- ExistingProjectFlow (upsert fix, Q1-Q3 data passthrough)
- SeeYourFlow journey mapping (inline on /me, one-time)

### Landing Page ✅
- Story-driven structure (method loop, compounding graph)
- Founder journey content
- Tab locking for user testing (Play, Healing, Bonus)

### Infrastructure ✅
- Theme/design system established — purple→gold ombre, design guide
- WheelPicker UX (info step + exampleJobs on all 12 segments)
- Skills taxonomy review + proposal doc created
- Quest completion scoring sync fixes
- Archetype image compression (WebP + preload)

---

## 5 Testable Milestones

### 🎯 Milestone 1: "Strangers Can Use It"
**Goal:** The core loop works for a new user with zero hand-holding.
**Test:** 5 strangers complete Flow Finder → get meaningful output → know next step.

| Must Work | Current Status | Action |
|-----------|----------------|--------|
| Landing page communicates value | ✅ Updated 2026-01-30 | Story-driven, method loop, compounding graph |
| Signup works | ✅ Works | - |
| Flow Finder completes | ✅ Works | Test with strangers |
| Mind Space (fast-track) | ✅ Built 2026-01-30 | /mind-space - paste AI conversations |
| First quest assigned | ✅ Works | - |
| Zarlo responds helpfully | ✅ Works | - |
| User knows what to do next | ⚠️ Improved | /me page shows Today's Quest + next stage. Test with users |

**DONE WHEN:** 5/5 testers complete Flow Finder without asking "what now?"

---

### 🎯 Milestone 2: "Users Stay Engaged"
**Goal:** Daily engagement loop works (quests, groans, tracking).
**Test:** 3 users active for 7 consecutive days.

| Must Work | Current Status | Action |
|-----------|----------------|--------|
| Daily quests feel doable | ✅ Works | - |
| Points accumulate visibly | ✅ Works | - |
| Groan challenges generate | ✅ Works | - |
| Streaks motivate | ✅ Works | - |
| Weekly planning guides week | ⚠️ Partial | Polish PhaseSelector UX |
| User returns day 2+ | ❓ Unknown | Test with real users |

**DONE WHEN:** 3/3 testers still active after 7 days without prompting.

---

### 🎯 Milestone 3: "Users Build Offers"
**Goal:** Users can create a sellable offer using the system.
**Test:** 2 users complete Offer Builder with actionable output.

| Must Work | Current Status | Action |
|-----------|----------------|--------|
| Offer Builder flows work | ✅ Works | - |
| Grand Slam Matrix generates | ✅ Works | - |
| Output is usable (not generic) | ⚠️ Depends on input | Improve context feeding |
| User knows pricing | ⚠️ Needs guidance | - |
| User has next action | ❓ Unclear | Add "what to do with this offer" guidance |

**DONE WHEN:** 2/2 testers have an offer they'd actually try to sell.

---

### 🎯 Milestone 4: "CRM Drives Action"
**Goal:** CRM helps users execute (not just plan).
**Test:** 1 user makes a sale using CRM workflow.

| Must Work | Current Status | Action |
|-----------|----------------|--------|
| Content Generator produces usable content | ✅ Works | - |
| Weekly Planning → actions | ✅ Built | DailyActions.jsx shows today's content + leads |
| Lead tracking works | ✅ Built | LeadScoreSliders.jsx with PTUF scoring |
| Sales scripts available | ✅ Built | ScriptsModal.jsx with smart objection-based suggestions |
| Business Flywheel checklist | ✅ Built | BusinessSystems.jsx with 4 phases, auto-detection |
| Email Sequences with steps | ✅ Built | Full CRUD + PromptGenerator |
| CSV Import for bulk data | ✅ Built | 6-step wizard, Contacts + Deals |
| Contacts + Outreach system | ✅ Built | Full overhaul, outreach columns, deal creation |
| User follows up on leads | ❓ Unknown | Test with real user |

**DONE WHEN:** 1 user makes an actual sale using CRM guidance.

---

### 🎯 Milestone 5: "Healing + Business Loop"
**Goal:** The unique value prop works (NS work → business action).
**Test:** 1 user overcomes a block via healing flow → takes business action.

| Must Work | Current Status | Action |
|-----------|----------------|--------|
| Nervous System Flow identifies blocks | ✅ Works | - |
| Blocks connect to Groan challenges | ✅ Works | - |
| Completing groan unlocks action | ⚠️ Partial | Clearer connection |
| User FEELS the shift | ❓ Unknown | Qualitative testing |
| User takes scary action | ❓ Unknown | Track groan → action pipeline |

**DONE WHEN:** 1 user says "I did [scary thing] because of the healing work."

---

## STILL TO BUILD (Priority Order)

### TIER 1: User Testing (Milestone 1)
**Why:** You need feedback loops, not more features.

| Task | Effort | Impact |
|------|--------|--------|
| Create Milestone 1 test script (what to ask, what to observe) | 2 hours | HIGH |
| Recruit 5 testers (Sam, Flynn, Josh, etc.) | 1 day | HIGH |
| Set up feedback collection (form/Notion/Zarlo?) | 0.5 day | MEDIUM |
| Get 3+ testers through Flow Finder | 1 day | HIGH |
| Collect + analyze feedback | 1 day | HIGH |
| Fix what actually breaks | TBD | HIGH |

---

### TIER 2: CRM & Business Polish (Milestone 1 & 4)
**Why:** Remaining polish for first impressions and CRM execution.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **Business Tab** | | | |
| Skills taxonomy: approve changes | Expressing→Performing, Connecting→Gathering, etc. | - | ⬜ Decision needed |
| Skills taxonomy: implement | Update wheelTaxonomy.js | Small | ⬜ After approval |
| Play List Finder: create flow | 4-question flow (role models, no fear, lost in time, groan zone) | Medium | ⬜ Not started |
| Play List Finder: Mind Space integration | Mind Space first → Play List Finder for depth | Small | ⬜ Not started |
| **CRM Remaining** | | | |
| Mindset stage in Business tab | Modules to set users up for success | Medium | ⬜ Not started |
| Runway Calculator | Savings ÷ expenses = weeks of runway | Small | ⬜ Not started |
| Income Bridge Tracker | Track side income vs job income progress | Medium | ⬜ Not started |
| Custom toolbar icons | Replace emoji icons with custom image assets | Small | ⬜ Not started |
| Weekly Plan → DailyActions tighter connection | Improve handoff | HIGH | 🔍 To assess |
| UX polish on existing features | - | MEDIUM | 🔍 To assess |

**See:** `docs/skills-taxonomy-expansion-proposal.md` for full proposal on 4-segment expansion.

**Play List Finder Questions (Proposed):**
1. "Who are people whose work or life makes you think 'I'd love to do that'?" (up to 5 with activity)
2. "If you had zero fear of failure, judgment, or rejection - what would you spend your days doing?"
3. "What activities make you completely lose track of time?"
4. "What activities sound fun but make you nervous just thinking about doing them?" (Groan Zone)

#### Flywheel System Reference

```
ATTRACT (Always Running)     NURTURE (Always Running)
├── Lead magnet              ├── Sales page
├── Content pillars          ├── Pricing
├── Posting schedule         ├── Scripts
├── Platform profiles        ├── Proposal template
└── Welcome sequence         ├── Funnel
                             └── Objection responses

DELIVER (Per Client)         RETAIN (Per Client Lifecycle)
├── Onboarding flow          ├── Testimonial template
├── Program/curriculum       ├── Referral program
├── Client portal            ├── Alumni community
└── Feedback form            └── Re-engagement sequence
```

See `income-calculator-and-ecosystem-plan.md` for full details.

---

### TIER 3: Healing Tab (Milestone 5)
**Why:** The unique value prop - NS work → business action. Currently locked for testing.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **Nervous System Flow Updates** | | | |
| Tangible visibility question | Change from abstract "how many people" to a single event/moment (speaking gig, live video, sales call) | Small | ⬜ Not started |
| Tangible money question | Change from annual income to a single deal amount | Small | ⬜ Not started |
| Update sway tests + binary search | All downstream screens reference new tangible framing | Small | ⬜ Not started |
| Update AI mirror prompt | Edge function prompt needs new context framing | Small | ⬜ Not started |
| **Healing Compass Flows** | | | |
| Rename current flow → "Healing Compass Safety Contracts" | Existing 7-question origin-tracing flow keeps its logic, just gets renamed | Small | ⬜ Not started |
| New: Healing Compass Emotional Needs | New Healing Compass flow (structure TBD) | Medium | ⬜ Not started |
| **New Flows** | | | |
| Matrix Codes flow | New flow (details TBD) | Medium | ⬜ Not started |
| Shadow Work Workshop | New deep-dive workshop flow | Medium | ⬜ Not started |
| **Existing Items** | | | |
| Protective Archetype Identification | Flow to identify user's dominant protective pattern | Medium | ⬜ Not started |
| Archetype Deep Dive Cards | Educational content for each archetype | Small | ⬜ Not started |
| Archetype → Groan Connection | Link identified archetype to courage challenges | Small | ⬜ Not started |
| Memory Reconsolidation | Rewiring traumatic memories safely | Medium | ⬜ Not started |
| Healing Book Assessment | Track books read + accountability | Small | ⬜ Not started |
| **Recognise Tab Enhancements** | | | |
| Essence count question | "How many times did your essence show up today?" | Small | ⬜ Not started |
| Protective count question | "How many times did your protective voice show up today?" | Small | ⬜ Not started |
| Essence vs Protective % graph | Visualize essence:protective ratio over time | Medium | ⬜ Not started |
| **From Founder Journey** | | | |
| Earthquake Inventory | Healing flow for grief of traditional path | Medium | ⬜ Not started |
| Relationship Audit | Reflection on who supports new vs old you | Small | ⬜ Not started |
| **Unlock** | | | |
| Unlock Healing Tab | Remove lock from Challenge.jsx, test all 21+ quests | Small | ⬜ After above items |

**Note:** Healing tab currently locked for user testing.

---

### TIER 4: Groan & Identity System (Milestone 2 & 5)
**Why:** Core to the transformation - building "I do scary things" identity. From founder journey insights.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **Quick Wins** | | | |
| Pre-challenge reframe | Add "You're becoming someone who..." text to Groan modals | Small | ⬜ Not started |
| "What flowed today?" capture | Daily/weekly serendipity tracking prompt | Small | ⬜ Not started |
| **Identity System** | | | |
| Streak as identity | Reframe streak messaging around "I am someone who does scary things" | Small | ⬜ Not started |
| Identity declaration ritual | Milestone moment after X completions - make them claim it | Medium | ⬜ Not started |
| The Comedian Story | Teaching moment - process vs outcome identity (Nic's example) | Small | ⬜ Not started |
| **Groan Improvements** | | | |
| Open-ended Groans | Flexible "do something scary today, you decide what" challenges | Medium | ⬜ Not started |
| Serendipity design | Reduce stage-driven rigidity, allow more flow | Medium | ⬜ Not started |

**Key insight:** "The fear/pain of NOT doing scary things became worse than the pain/fear of DOING the scary thing."

---

### TIER 5: Game Layer (Milestone 2)
**Why:** Hero Journey doc is beautiful but won't help if core loop doesn't retain.

| Task | Effort | Impact |
|------|--------|--------|
| Update copy with hero language (no structural change) | 1 day | MEDIUM |
| Add Nemesis language to protective patterns | 0.5 day | MEDIUM |
| Power meter visualization | 1 day | LOW |

---

### TIER 6: Octalysis Gamification (Milestone 2+)
**Why:** Retention and engagement layer. Once core loop validated, these features keep users coming back and deepen the experience.
**Reference:** `docs/octalysis-future-features.md` (full specs), `docs/octalysis-application-analysis.md` (scoring)

**Current Octalysis Score: 217/800** (Moderate) → **Target: 374** (Strong)

| Drive | Current | Target | Biggest Gap |
|-------|---------|--------|-------------|
| CD1 Epic Meaning | 7 | 8 | Community impact stats, "you're rare" messaging |
| CD2 Accomplishment | 6 | 8 | Milestones, progress bars, Play Deck |
| CD3 Creativity | 5 | 7 | Visual Offer Stack Builder, challenge customization |
| CD4 Ownership | 5 | 7 | Play Deck, badge collections, avatar |
| CD5 Social | 4 | 7 | **Priority** — Courage Pods, Community Feed, Week Recap |
| CD6 Scarcity | 4 | 5 | Streak-at-risk notifications, last mile messaging |
| CD7 Curiosity | 5 | 7 | Easter Egg achievements, Zarlo Curiosity Hooks |
| CD8 Loss | 5 | 5 | Intentional ceiling — wellness app, no anxiety mechanics |

#### Phase 1: Quick Wins
| Task | Drives | Effort | Status |
|------|--------|--------|--------|
| Community Impact Widget | CD1, CD5 | Small | ⬜ Not started |
| Completion Screen Enhancement | CD2 | Small | ⬜ Not started |
| Name Your HQ (CRM onboarding) | CD1, CD4 | Small | ⬜ Not started |
| Post-Flow Finder Rarity Reveal | CD1 | Small | ⬜ Not started |
| Stage Groan reframing | CD1 | Small | ⬜ Not started |
| Progress bars on tower cards | CD2 | Small | ⬜ Not started |

#### Phase 2: Anticipation & Triggers
| Task | Drives | Effort | Status |
|------|--------|--------|--------|
| Zarlo trigger system (Priority 1-3) | CD2, CD6 | Medium | ⬜ Not started |
| "Last mile" messaging throughout app | CD6, CD2 | Small | ⬜ Not started |
| Streak-at-Risk push notifications | CD8, CD6 | Small | ⬜ Not started |
| Deal Stale Warnings (extend Smart Alerts) | CD8 | Small | ⬜ Not started |

#### Phase 3: Milestones & Recognition
| Task | Drives | Effort | Status |
|------|--------|--------|--------|
| Essence-aligned milestones | CD2 | Medium | ⬜ Not started |
| Collections tab | CD4, CD2 | Medium | ⬜ Not started |
| Badge system | CD4, CD2 | Medium | ⬜ Not started |
| Play Deck v1 (Visibility tokens + Breakthrough cards) | CD4, CD3 | Medium | ⬜ Not started |
| Easter Egg Achievements v1 (22 hidden achievements) | CD7 | Medium | ⬜ Not started |

#### Phase 4: Creative & Ownership
| Task | Drives | Effort | Status |
|------|--------|--------|--------|
| Visual Offer Stack Builder | CD3, CD4 | Medium | ⬜ Not started |
| Play Deck v2 (Streak Freeze, Double Points) | CD4, CD8 | Medium | ⬜ Not started |
| Zarlo Curiosity Hooks (pattern + milestone teasers) | CD7 | Medium | ⬜ Not started |
| Avatar upload/customization | CD4 | Small | ⬜ Not started |
| Achievement showcase page | CD4, CD5 | Medium | ⬜ Not started |

#### Phase 5: Community
| Task | Drives | Effort | Status |
|------|--------|--------|--------|
| Courage Pods (3-5 person accountability groups) | CD5 | Medium | ⬜ Not started |
| Community Feed (activity + achievements) | CD5 | Medium | ⬜ Not started |
| Week Recap with Rank Change | CD5, CD8 | Medium | ⬜ Not started |
| Community challenges | CD5, CD1 | Medium | ⬜ Not started |
| Discussion threads | CD5 | Medium | ⬜ Not started |

#### Phase 6: Advanced
| Task | Drives | Effort | Status |
|------|--------|--------|--------|
| Mentorship system | CD5, CD1 | High | ⬜ Not started |
| AI-driven Zarlo personalization | CD1 | High | ⬜ Not started |
| Full social features | CD5 | High | ⬜ Not started |
| Play Deck v3 (proof trophies + photo gallery) | CD4 | Medium | ⬜ Not started |
| Easter Egg Achievements v2 (secret/ultra-hidden) | CD7 | Small | ⬜ Not started |

**Note:** Phases 1-2 can begin alongside Milestone 2 testing. Phases 3+ should wait until retention is validated. See full specs in `docs/octalysis-future-features.md`.

---

## Decision Framework: Should I Build This?

```
┌──────────────────────────────────────────────────────────────────┐
│ NEW IDEA COMES IN                                                 │
│                                                                   │
│ Q1: Does it help achieve Milestone 1-5?                          │
│     YES → Continue                                                │
│     NO → Park it in Ideas Parking Lot                            │
│                                                                   │
│ Q2: Is there a SIMPLER way to test this hypothesis?              │
│     YES → Do the simpler thing first                             │
│     NO → Continue                                                 │
│                                                                   │
│ Q3: Am I building to AVOID testing?                              │
│     YES → Stop. Run existing tests instead.                      │
│     NO → Build it                                                │
│                                                                   │
│ Q4: Will 5 users notice/care about this?                         │
│     YES → Prioritize                                              │
│     NO → Park it                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Ideas Parking Lot

Move exciting-but-premature ideas here instead of building them:

| Idea | Why It's Parked | Revisit When |
|------|-----------------|--------------|
| Fantasy league / team battles | Need users to compete | After Milestone 2 |
| Income Calculator | Marketing tool, not core loop | After Milestone 1 |
| Ready Player One UI | Partially addressed via Hero Command Center (/hero-profile) | After Milestone 2 |
| Physical badges / NFC | Cool but no users | After 100+ active users |
| Clawdbot / AI agent | Nice-to-have automation | After Milestone 4 |
| Workshop lead magnet question flow | Lead magnet creation flow for workshops | After Milestone 3 |
| Zarlo "Ask Experts" section | Expert knowledge integration in Zarlo AI | After Milestone 2 |
| Play Profile | User play/fun identity profile (distinct from Play List Finder) | After Milestone 2 |
| Seasonal events | Need base users first | After Milestone 2 |
| Paid-to-learn marketplace | Future feature | After Milestone 4 |
| "How hard are you to replace" module | After core works | After Milestone 3 |
| Baby photos feature | Fun but not core | After Milestone 2 |
| Curiosity of the day | Engagement extra | After Milestone 2 |
| Feature voting system | Need users first | After Milestone 2 |
| Neural network rename | Low priority rename | When convenient |
| FindMyFlow API + Claude Code MCP | API layer so users can connect their FindMyFlow account to Claude Code (MCP server). Query flow data, quest history, shadow/archetype profiles, groan progress via natural language. Power users could do shadow work, review healing insights, or get Zarlo-style guidance through their terminal. | After Milestone 2 |

---

## Summary

**You have ENOUGH features.** The app is feature-rich.

What you don't have:
- Validation that the core loop works
- Users who stick around
- Evidence the healing→business connection lands

**The next build should be testing infrastructure, not features.**

### Your Testable "Done" States:

| Milestone | Done When |
|-----------|-----------|
| 1 | 5 strangers complete Flow Finder without confusion |
| 2 | 3 users stay active 7 days |
| 3 | 2 users create sellable offers |
| 4 | 1 user makes a sale via CRM |
| 5 | 1 user connects healing work to business action |

**Once you hit Milestone 1, you've earned the right to build more.**

---

*Remember: Building is the easy part. Validating is hard. Stop avoiding the hard part.*
