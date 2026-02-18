# FindMyFlow Priority Hierarchy & Test Milestones
**Date:** 2026-01-29 (Updated: 2026-02-13)
**Status:** Active Planning Document
**Purpose:** Stop scope creep. Define testable "done" gates.

---

## Next 5 Things (This Sprint)

| # | Task | Status |
|---|------|--------|
| 1 | **Earthquake Quiz** — Build lead magnet at `/try/earthquake` (9 questions, email gate, share cards) | ✅ |
| 2 | **Fantasy League landing page** — Public-facing page for the Fantasy League concept | ✅ |
| 3 | **Healing challenges confirmed** — Validate and lock healing tab quest list | ✅ |
| 4 | **Content templates created** — Finalise content generation templates for CRM | ✅ |
| 5 | **Resend feature working** — Newsletter sending pipeline end-to-end via Resend | ✅ |

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

### TIER 1.5: Bug Fixes + User Acquisition (Milestone 1 & 2)
**Why:** Real bugs in the challenge system will break testers' experience. Acquisition infrastructure needed to get users in the door.

#### Challenge System Bugs (from ClawdBot `research/findmyflow-challenge-audit.md`)

| Bug | Severity | File | Description |
|-----|----------|------|-------------|
| ~~`handleQuestComplete` stale closure~~ | ~~🔴 Critical~~ | Challenge.jsx ~L760 | ✅ Fixed — now passes `freshCompletions` to `getTabCompletionStatus` |
| ~~`getWeekStart()` mutates Date~~ | ~~🔴 Critical~~ | WeeklyPlanningFlow.jsx ~L355 | ✅ Fixed — refactored to `dateUtils.getMondayDate()` which clones input |
| ~~Double-completion race condition~~ | ~~🔴 Critical~~ | Challenge.jsx ~L314 | ✅ Fixed — `completingQuestId` state guards against double-clicks |
| ~~`loadLeaderboard` stale closure~~ | ~~🔴 Critical~~ | useChallengeData.js ~L527 | ✅ Fixed — `progress.group_id` properly accessed in loading chain |
| ~~`advanceDay` no optimistic concurrency~~ | ~~🟡 Medium~~ | useChallengeData.js ~L310 | ✅ Fixed — added `.eq('current_day', ...)` guard + silent PGRST116 return |
| ~~`challenge_progress.update` no-match handling~~ | ~~🟡 Medium~~ | Challenge.jsx ~L668 | ✅ Fixed — PGRST116 check shows "challenge no longer active" message |
| ~~`lastWeekStats` hardcoded points~~ | ~~🟡 Medium~~ | WeeklyPlanningFlow.jsx ~L333 | ✅ Fixed — uses actual `points_earned` column with `.reduce()` sum + Sunday date range fix |
| ~~Loading state race (Promise.all)~~ | ~~🟡 Medium~~ | useChallengeData.js ~L1666 | ✅ Fixed — `.finally()` on full `Promise.all(...)` |
| Missing useEffect dependencies | 🟡 Medium | useChallengeData.js ~L1666 | Investigated — adding `progress` to deps causes excessive reloads. Real-time subscription already handles refresh. Accepted as-is. |
| ~~Realtime subscription leak~~ | ~~🟡 Medium~~ | useChallengeData.js ~L1700 | ✅ Fixed — `supabase.removeChannel(subscription)` replaces `unsubscribe()` |
| ~~ValidationFlows crash on unknown type~~ | ~~🟡 Medium~~ | ValidationFlowsManager.jsx ~L120 | ✅ Fixed — `if (!flowConfig) return` guard added |
| ~~WeeklyPlanning save stuck loading~~ | ~~🟡 Medium~~ | WeeklyPlanningFlow.jsx ~L534 | ✅ Fixed — `setSaving(false)` added on success path before `onComplete` |
| Streak day skip | 🟢 Minor | useChallengeData.js ~L1609 | Investigated — all 5 scenarios return correct values. Structural fragility only. Purely visual (flame icon). Accepted as-is. |

#### User Acquisition Infrastructure

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **Earthquake Quiz** | | | |
| ~~Build Earthquake Quiz~~ | 9-question lead magnet at `/try/earthquake`. Detects Protective Voice, awakening stage, block type. Email gate before full results. | Medium | ✅ Done |
| ~~Wire email capture~~ | Quiz results → `earthquake_quiz_leads` + `public_leads` with tags + `notify-lead-capture` edge function | Small | ✅ Done |
| **Monetisation** | | | |
| Set up Stripe | Even just $10/mo tier to start collecting revenue | Small | ⬜ Not started |
| Pricing gate | Free quiz + 7-day trial → paywall at Day 8 | Medium | ⬜ Not started |
| **AI Discoverability** | | | |
| ~~Add `llms.txt`~~ | AI-readable site description at root domain (like robots.txt for LLMs) | Small | ✅ Done — `llms.txt` + `robots.txt` + `sitemap.xml` |
| ~~Add JSON-LD schema markup~~ | FAQ + WebApplication + Organization + Person schema on landing page | Small | ✅ Done — FAQPage, WebApplication, Organization w/ founder, OG + Twitter meta |
| Create `/methodology` page | Dense, crawlable framework content (5 Voices, Flow Equation, 4 R's) for AI + SEO | Medium | ⬜ Not started |
| **Analytics** | | | |
| Set up web analytics | Vercel Analytics (enabled) or Plausible ($9/mo) | Small | ✅ Vercel done |
| ~~UTM tracking verification~~ | Global UTM capture in `main.jsx` → `sessionStorage`, attached to all funnel events | Small | ✅ Done — needs deploy + live test with `?utm_source=reddit` |
| ~~Conversion goals~~ | 5-event funnel: `quiz_start` → `email_submitted` → `quiz_complete` → `quiz_signup_click` → `account_created`. `events` table created. | Small | ✅ Done — wired in EarthquakeQuiz, EarthquakeResults, AuthProvider |
| **Landing Page Narrative** | | | |
| ~~Change CTA~~ | All 3 CTAs → "Discover What's Blocking You" → `/try/earthquake` | Small | ✅ Done — hero, path card, sticky mobile |
| Protective Voices section | Scroll-stopping "Meet the 5 voices keeping you small" with archetype cards | Medium | ⬜ Specced |
| Caged Creator "Is This You?" upgrade | 10+ courses, Notion tracker, Sunday dread, intellectually isolated | Small | ⬜ Specced |
| Matrix framing hero | "You were born with powers. The Matrix suppressed them." | Small | ⬜ Specced |
| Founder line | "I was the Caged Creator. Now I help other heroes escape." | Small | ⬜ Not started |
| Journey Map visual | Matrix → Awakening → Training → Becoming | Medium | ⬜ Not started |

**See:** ClawdBot repo `findmyflow-implementation/earthquake-quiz-spec.md` for full quiz spec.
**See:** ClawdBot repo `findmyflow-implementation/ai-discoverability.md` for full AI discoverability strategy.
**See:** ClawdBot repo `findmyflow-docs/MARKETING-LAUNCH-PLAN.md` for 30/90 day launch plan.
**See:** ClawdBot repo `findmyflow-docs/storytelling-touchpoints.md` for narrative arc spec.
**See:** ClawdBot repo `findmyflow-docs/landing-page-copy-v1.md` for landing page copy draft.

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
| **Leap Prep Suite** | Runway Calculator + First $1,000 Challenge + Leap Readiness Dashboard | | |
| Runway Calculator | Location-based (8 nomad hotspots × 3 lifestyle tiers), runway health colors, "with side income" projection | Medium | ⬜ Specced |
| First $1,000 Challenge | 30-day structured challenge (4 weeks): Discover Offer → First Client → Deliver & Stack → Scale to $1K. Maps to existing quest system. Completion tiers with badges. | Medium | ⬜ Specced |
| Leap Readiness Dashboard | Weighted % score: Financial Safety (35%), Offer Validation (25%), Nervous System (20%), Support System (10%), Clarity (10%). Pulls from existing data sources. Circular progress ring + dimension bars. | Medium | ⬜ Specced |
| Shareable Leap Artifacts | Share cards for runway result, readiness score, first $1K earned | Small | ⬜ Not started |
| **Implementation Specs (from ClawdBot repo)** | | | |
| Category Tracking | Per-category progress indicators on challenge tab headers. Aggregates `quest_completions` — no new tables needed. | Small | ⬜ Specced |
| Knowledge Score System | Business Core Score + Healing Score — tracks how well AI knows user. Two compact rings on `/me` page. Feeds Zarlo personalisation + CRM actions. New `user_knowledge_scores` + `knowledge_score_events` tables. | Medium | ⬜ Specced |
| Admin Dashboard | User stats, stage distribution, challenge metrics, user list/detail views. Needs `is_admin` column, admin RLS, `/admin/*` routes. | Medium | ⬜ Specced |
| Auto Notifications (behaviour-triggered) | Trigger emails/push from user events (onboarding, streaks, inactivity, graduations, deal stalls). Overlaps with Content Engine Phase 1B — implement together. | Medium | ⬜ Specced |
| Custom toolbar icons | Replace emoji icons with custom image assets | Small | ⬜ Not started |
| Weekly Plan → DailyActions tighter connection | Improve handoff | HIGH | 🔍 To assess |
| UX polish on existing features | - | MEDIUM | 🔍 To assess |
| **CRM Content Engine** | AI-powered content drafting + sending pipeline (4 phases) | | |
| Phase 1A: Newsletter infrastructure | Resend setup, `external_contacts` + `content_drafts` + `newsletter_sends` tables, /draft review page, contact import (program/event/Substack ~350+), Sol drafting workflow | Medium | ⬜ Specced |
| Phase 1A: Voice learning loop | `voice_taste_config` table, correction tracking (tone/word_choice/structure/content/brand), progressive voice refinement from Huzz's edits | Medium | ⬜ Specced |
| Phase 1B: CRM intelligence | Sol reads all FMF user data, auto-triggered emails + push (onboarding, streaks, inactivity, graduations, deal stalls, weekly digest), smart segmentation queries, personalisation variables (30+ tokens) | Large | ⬜ Specced |
| Phase 2: Multi-tenant | `owner_id` on all content engine tables, RLS policies, creator onboarding (voice capture → storybank → brand prefs → audience → first draft test), per-creator Resend domains | Large | ⬜ Specced |
| Phase 3: ClawdBot upsell | Creator gets own AI assistant — auto-triggers, Telegram/WhatsApp alerts, proactive insights, multi-channel content, Stripe billing ($29-79/mo tiers) | Large | ⬜ Specced |

**See:** `docs/skills-taxonomy-expansion-proposal.md` for full proposal on 4-segment expansion.
**See:** ClawdBot repo `findmyflow/implementation/runway-calculator-spec.md` for full Leap Prep spec (Runway Calculator, First $1K Challenge, Leap Readiness Dashboard, Environment Audit, schema additions).
**See:** ClawdBot repo `findmyflow/implementation/crm-content-engine-spec.md` for full Content Engine spec (4 phases, schema, triggers, segmentation, voice learning, creator onboarding, ClawdBot upsell).
**See:** ClawdBot repo `findmyflow-implementation/01-category-tracking.md` for Category Tracking spec (with code).
**See:** ClawdBot repo `findmyflow-implementation/02-knowledge-score.md` for Knowledge Score spec (scoring tables, thresholds, schema).
**See:** ClawdBot repo `findmyflow-implementation/05-admin-dashboard.md` for Admin Dashboard spec.
**See:** ClawdBot repo `findmyflow-implementation/06-auto-notifications.md` for Auto Notifications spec (overlaps with Content Engine Phase 1B).

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
| Tangible visibility question | Changed to 5 Groan Matrix visibility layers + "enter your own" | Small | ✅ Done 2026-02-17 |
| Tangible money question | Changed to single deal amount ($500–$25K+) | Small | ✅ Done 2026-02-17 |
| Update sway tests + binary search | Test 1 simplified to YES/NO, Test 2 reframed to per-deal binary search | Small | ✅ Done 2026-02-17 |
| Update AI mirror prompt | Edge function updated + deployed, markdown rendering on results | Small | ✅ Done 2026-02-17 |
| **Healing Compass Flows** | | | |
| Rename current flow → "Limiting Belief Rewire" | Extracted V2 as `/limiting-belief-rewire`, weekly repeatable, gated behind NS completion, Library of Answers split | Small | ✅ Done 2026-02-17 |
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
| **Environment Audit (Recognised Voices)** | | | |
| Map Your Environment quest | Rate 6 areas (Home, Work, Friends, Social, Routine, Location) — Protective Voice vs Essence | Small | ⬜ Specced |
| Spot the Reinforcers quest | Name 3 things keeping Protective Voice alive | Small | ⬜ Specced |
| Design One Change quest | Pick lowest-scoring area, commit to one shift this week | Small | ⬜ Specced |
| The Permission Test quest | 30 min in your most-yourself place, body awareness reflection | Small | ⬜ Specced |
| **Explainer Quests** | | | |
| Explainer quest system | Short educational quests that teach framework concepts (5 Voices, Flow Equation, 4 R's) before asking users to do the work. Onboards users into language. | Medium | ⬜ Specced |
| **Recognise Tab Enhancements** | | | |
| Essence count question | "How many times did your essence show up today?" | Small | ⬜ Not started |
| Protective count question | "How many times did your protective voice show up today?" | Small | ⬜ Not started |
| Essence vs Protective % graph | Visualize essence:protective ratio over time | Medium | ⬜ Not started |
| **From Founder Journey** | | | |
| Earthquake Inventory | Healing flow for grief of traditional path | Medium | ⬜ Not started |
| Relationship Audit | Reflection on who supports new vs old you | Small | ⬜ Not started |
| **Unlock** | | | |
| Unlock Healing Tab | Remove lock from Challenge.jsx, test all 21+ quests | Small | ⬜ After above items |

**See:** ClawdBot repo `findmyflow-implementation/03-explainer-quests.md` for Explainer Quests spec.
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

### TIER 5: Game Layer + Assessments (Milestone 2)
**Why:** Hero Journey doc is beautiful but won't help if core loop doesn't retain.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **Hero Language** | | | |
| Update copy with hero language | No structural change — quest cards, stage names, Zarlo voice | Small | ⬜ Not started |
| Add Nemesis language to protective patterns | Protective Voice → Nemesis framing | Small | ⬜ Not started |
| Power meter visualization | Visual representation of essence vs protective energy | Small | ⬜ Not started |
| **Narrative Features** | | | |
| The Codex | Hero Journey content system — Part 22 spec + content files already created | Medium | ⬜ Not started |
| Three Keys Gate System | Copper/Jade/Crystal progression milestones — lock content behind earned keys | Medium | ⬜ Not started |
| Time-Relative Flow Map | Temporal visualization of journey — shows how flow/compass data changes over time, not just current state | Medium | ⬜ Specced |
| **Assessments** | | | |
| Founder DNA / Flow Type Assessment | Game-based: pick 3-5 games you love → map to Flow Type (5 dimensions) → Founder DNA sliders (Builder↔Performer, Technical↔Creative, Solo↔Social) → Fuel Awareness (pain vs love). Full game library (~40-60 options). | Medium | ⬜ Specced |

**See:** ClawdBot repo `findmyflow-implementation/04-time-relative-flow-map.md` for Time-Relative Flow Map spec.
**See:** ClawdBot repo `findmyflow-founder-dna-spec.md` for full Founder DNA / Flow Type assessment spec.

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

### TIER 7: Marketing & Growth (Milestone 1+)
**Why:** Features mean nothing without users. These are the distribution channels.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **Newsletter (via Resend)** | | | |
| ~~Set up Resend~~ | ~~Domain verification, API key~~ | ~~Small~~ | ✅ Done |
| Import subscriber list | Program participants + event attendees + Substack (~350+) into `external_contacts` | Small | ⬜ Not started |
| Welcome back email | "I built the thing I wish existed 3 years ago" — re-engage existing subscribers | Small | ⬜ After import |
| **Reddit** | | | |
| Create Reddit account | Personal username (not branded), e.g. `huzz_flow` or `nichuzz` | Small | ⬜ Blocked on Huzz |
| Week 1: Karma building | Pure value comments in r/findapath, r/careerguidance, r/decidingtobebetter — zero FMF mentions | Ongoing | ⬜ After account |
| Week 2: Framework drops | "5 Protective Voices" post in r/DecidingToBeBetter, NS reframe comments | Ongoing | ⬜ After Week 1 |
| Week 3: Soft mentions | Only when someone explicitly asks for a tool/resource | Ongoing | ⬜ After Week 2 |
| Week 4: First link drop | Earthquake Quiz with UTM tracking | Ongoing | ⬜ After Week 3 |
| Live thread tracker | Sol monitors new posts daily, drafts comment strategies | Medium | ⬜ Specced |
| **Blog / Content Hub** | | | |
| "Why 10 Courses Didn't Fix Your Career" | DAM intercept — targets course-buyers searching for solutions | Medium | ⬜ Not started |
| "The 5 Voices Keeping You Stuck" | Framework content — targets self-awareness seekers | Medium | ⬜ Not started |
| "Career Clarity Isn't an Information Problem" | Positioning content — nervous system angle | Medium | ⬜ Not started |
| "The Pathless Path Gave You Language. Here's the System." | DAM intercept — targets Paul Millerd readers | Medium | ⬜ Not started |
| "The Caged Creator: When Success Feels Hollow" | Persona content — targets high-achievers | Medium | ⬜ Not started |
| **Category Design** | | | |
| Lock one-sentence strategy | Define the category FindMyFlow creates | Small | ⬜ Decision needed |
| Name the category | "Alternate Life Path Accelerator" or alternatives | Small | ⬜ Decision needed |
| "School Broke You" manifesto | Lightning Strike content for category creation | Medium | ⬜ Not started |
| **Outreach** | | | |
| Paul Millerd outreach | "The Pathless Path gave you language. FindMyFlow gives you the system." | Small | ⬜ Not started |
| Product Hunt launch | Prep listing, screenshots, copy | Medium | ⬜ Not started |
| Podcast guest pitches | Modern Wisdom, creator-economy pods | Small | ⬜ Not started |

**See:** ClawdBot repo `findmyflow-implementation/reddit-strategy.md` for full Reddit strategy (18 target subreddits across 3 tiers).
**See:** ClawdBot repo `findmyflow-implementation/reddit-thread-tracker.md` for live thread monitoring system.
**See:** ClawdBot repo `research/findmyflow-category-pirates-analysis.md` for Category Pirates framework applied to FMF.

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
| Fantasy league / team battles | Full spec written (ClawdBot repo `findmyflow/fantasy-league-spec.md` + `fantasy-league-content-system.md`). Need users to compete. | After Milestone 2 |
| Income Calculator | Marketing tool, not core loop | After Milestone 1 |
| Ready Player One UI | Partially addressed via Hero Command Center (/hero-profile) | After Milestone 2 |
| Physical badges / NFC | Cool but no users | After 100+ active users |
| Clawdbot / AI agent | Specced as CRM Content Engine (Tier 2) — Phase 3 upsell is post-validation | Phase 1A/1B: Tier 2. Phase 3: After Milestone 4 |
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
| Voice Intelligence (auto-pattern detection) | After N corrections in same category, auto-generate voice rules. Confidence scoring per category. Before/After examples on Voice tab. Concrete correction examples baked into Sol prompts. Needs enough corrections data to be meaningful. | After Approach B (Voice Smart Bridge) validated |
| FindMyFlow API + Claude Code MCP | Full spec written (ClawdBot repo `findmyflow-implementation/07-api-mcp-data-sync.md`). API layer so users can connect their FindMyFlow account to Claude Code (MCP server). Query flow data, quest history, shadow/archetype profiles, groan progress via natural language. | After Milestone 2 |
| AI Quest Generator | Personalised daily quests based on stage + voice + activity. Requires Knowledge Score data. | After Milestone 2 |
| Voice Progress Bar | Visual feedback on inner work progress | After Milestone 2 |

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

---

## ClawdBot Repo Reference Index

All specs and research docs in `Nic-Huzz/ClawdBot` that relate to FindMyFlow:

**Implementation Specs:**
- `findmyflow/implementation/runway-calculator-spec.md` — Leap Prep Suite (Runway Calculator, First $1K Challenge, Leap Readiness Dashboard, Environment Audit)
- `findmyflow/implementation/crm-content-engine-spec.md` — CRM Content Engine (4 phases, schema, voice learning, ClawdBot upsell)
- `findmyflow-implementation/earthquake-quiz-spec.md` — Earthquake Quiz lead magnet (9 questions, email gate, share cards)
- `findmyflow-implementation/ai-discoverability.md` — AI SEO strategy (llms.txt, JSON-LD, /methodology page)
- `findmyflow-implementation/01-category-tracking.md` — Per-category progress indicators
- `findmyflow-implementation/02-knowledge-score.md` — Business + Healing knowledge scores
- `findmyflow-implementation/03-explainer-quests.md` — Educational framework quests
- `findmyflow-implementation/04-time-relative-flow-map.md` — Temporal journey visualization
- `findmyflow-implementation/05-admin-dashboard.md` — Admin panel spec
- `findmyflow-implementation/06-auto-notifications.md` — Behaviour-triggered emails/push
- `findmyflow-implementation/07-api-mcp-data-sync.md` — FindMyFlow API + MCP integration
- `findmyflow-implementation/reddit-strategy.md` — Reddit launch strategy (18 subreddits, 4-week plan)
- `findmyflow-implementation/reddit-thread-tracker.md` — Live thread monitoring system
- `findmyflow-founder-dna-spec.md` — Flow Type + Founder DNA game-based assessment

**Marketing & Content:**
- `findmyflow-docs/ACTIONS.md` — Living action list (tasks, blockers, done items)
- `findmyflow-docs/MARKETING-LAUNCH-PLAN.md` — 30/90 day launch plan with weekly breakdown
- `findmyflow-docs/storytelling-touchpoints.md` — Narrative arc (Landing → Onboarding → First Sign-in → Challenge)
- `findmyflow-docs/landing-page-copy-v1.md` — Full landing page copy draft (Matrix framing)
- `findmyflow/fantasy-league-spec.md` — Fantasy league spec
- `findmyflow/fantasy-league-content-system.md` — Fantasy league content integration

**Research & Analysis:**
- `research/findmyflow-category-pirates-analysis.md` — Category Pirates framework applied to FMF
- `research/findmyflow-challenge-audit.md` — 12+ challenge system bugs with file/line references
- `research/findmyflow-features-plan.md` — Feature plan (Knowledge Score, admin, notifications)
- `content/huzz-storybank.md` — Reusable stories from Substack (origin, splinter, proof stories)
- `content/huzz-voice-analysis.md` — Voice reference for content generation
- `projects/findmyflow/PHILOSOPHY.md` — "Life is a message" philosophy doc
