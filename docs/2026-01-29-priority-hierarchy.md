# FindMyFlow Priority Hierarchy & Test Milestones
**Date:** 2026-01-29
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

## What's Actually BUILT (from CLAUDE.md + git status)

### Core Platform ✅
- 10-Stage System (Flow Finder → Tracking)
- 34 flow components
- 7-Day Challenge with quest cards, filters, leaderboard
- Zarlo AI widget
- Flow Compass (N/E/S/W)
- Groan Matrix (5 visibility layers)
- Weekly Planning (4-phase cycle)

### CRM ✅
- 3 towers (Attract, Nurture, Tools)
- 33 pages, 37 components
- Content Generator + Planning
- Weekly Planning Session

### Money Model ✅
- 6 flows using MoneyModelFlowBase
- Grand Slam Offer Builder
- Funnel Calculator (Stage 8)

### Onboarding ✅
- QuickCapture (5-step)
- HomeFirstTime flow
- SeeYourFlow journey mapping

---

## What's In Progress (Recent 2 Days Focus)

| Doc | Focus | Status |
|-----|-------|--------|
| `landing-page-analysis-2025-01-27.md` | Story-driven landing page restructure | Planned, not implemented |
| `hero-journey-game-design.md` | Ready Player One narrative layer | Design doc complete |
| `income-calculator-and-ecosystem-plan.md` | Public income calculator + ecosystem model | Design doc complete |
| `founder-journey-discovery.md` | Nic's 5-year journey as teachable content | Research captured |

---

## What's NOT Built (From follow-up-tasks.md)

### V1 Launch Blockers (Tasks 1-6)
- [x] Lead Scoring (PTUF sliders) ✅ Built - LeadScoreSliders.jsx
- [x] 15 Hormozi Scripts in database ✅ Built - scripts lib
- [x] Scripts Modal on deal cards ✅ Built - ScriptsModal.jsx with smart suggestions
- [ ] Theme alignment (dark→light?)
- [ ] Offer Builder v2 route integration
- [ ] Integration testing

### High Priority Post-Launch (Tasks 7-16)
- Workshop lead magnet question flow
- Zarlo "Ask Experts" section
- "How Hard Are You to Replace?" module
- Building in Public Fantasy League
- Play Profile
- Shadow Work in Healing
- Memory Reconsolidation

---

## THE HIERARCHY: 5 Testable Milestones

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
| User knows what to do next | ❓ Unclear | Test with users |

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

## PRIORITY ORDER: What To Build Now

### TIER 1: Landing Page & Onboarding (Milestone 1)
**Why:** Can't test anything if strangers bounce.

| Task | Effort | Impact |
|------|--------|--------|
| Implement story-driven landing page structure | 1-2 days | HIGH |
| Add founder journey content (earthquake, core insight) | 0.5 day | HIGH |
| Add post-Flow Finder CTA guidance | 0.5 day | HIGH |

### TIER 2: User Testing Infrastructure
**Why:** You need feedback loops, not more features.

| Task | Effort | Impact |
|------|--------|--------|
| Create testing checklist for Milestone 1 | 2 hours | HIGH |
| Recruit 5 testers (Sam, Flynn, Josh, etc.) | 1 day | HIGH |
| Set up feedback collection (form/Notion/Zarlo?) | 0.5 day | MEDIUM |

### TIER 3: CRM Polish (Milestone 4)
**Why:** You mentioned CRM update as priority in your task list.

| Task | Effort | Impact | Status |
|------|--------|--------|--------|
| Lead Scoring (PTUF sliders) | 1-2 days | HIGH | ✅ Built |
| DailyActions integration | 1 day | MEDIUM | ✅ Built |
| Scripts database + modal | 1-2 days | MEDIUM | ✅ Built |
| **Weekly Planning Merge** | | | |
| ExecutionReview component | Small | HIGH | ✅ Built |
| Integrate into WeeklyPlanningFlow | Small | HIGH | ✅ Built |
| **NEW: Business Flywheel System** | | | |
| Finalize phase checklist items | - | HIGH | 📝 In Review |
| Database tables (ecosystem_system_progress) | Small | HIGH | ⬜ Not started |
| Config files (ecosystemConfig.js, ecosystemService.js) | Small | HIGH | ⬜ Not started |
| BusinessSystems page (Tools tab) | Medium | HIGH | ⬜ Not started |
| EcosystemStatusWidget (Dashboard) | Small | HIGH | ⬜ Not started |
| Auto-activation on contact status change | Small | MEDIUM | ⬜ Not started |
| **NEW: Mindset Stage** | | | |
| Add 'Mindset' stage to Business tab | Modules to set users up for success | Medium | ⬜ Not started |
| **NEW: Financial Security Tools** | | | |
| Runway Calculator | Savings ÷ expenses = weeks of runway | Small | ⬜ Not started |
| Income Bridge Tracker | Track side income vs job income progress | Medium | ⬜ Not started |
| **Polish & Integration** | | | |
| Weekly Plan → DailyActions tighter connection | ? | HIGH | 🔍 To assess |
| UX polish on existing features | ? | MEDIUM | 🔍 To assess |
| Missing pieces from user testing | ? | HIGH | 🔍 To assess |

#### Flywheel System Overview

The Business Flywheel helps users BUILD systems and EXECUTE them consistently:

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

**Dashboard shows:** Phase completion % + "Complete setup in Tools →"
**Tools tab shows:** Full checklist with links to create each item
**Automatic activation:** DELIVER activates when contact → 'active', RETAIN when → 'completed'

See `income-calculator-and-ecosystem-plan.md` for full details + checklist items to review.

### TIER 3.5: Business Tab Updates (Milestone 1)
**Why:** Flow Finder is first experience - skills taxonomy and discovery need to resonate.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| **Skills Taxonomy Expansion** | | | |
| Review taxonomy gaps | Physical/Performing, Hosting, Curating, Protecting | - | ✅ Analyzed |
| Proposal doc | 4 segments to expand (keep 12 total) | - | ✅ Created |
| Approve changes | Expressing→Performing, Connecting→Gathering, etc. | - | ⬜ Decision needed |
| Implement changes | Update wheelTaxonomy.js | Small | ⬜ After approval |
| **WheelPicker UX Improvement** | | | |
| Add info step before proficiency | Show "covers" + "example jobs" | Small | ✅ Built |
| Add exampleJobs to all 12 segments | Help users identify with skills | Small | ✅ Built |
| **Play List Finder Flow** | | | |
| Create 4-question flow | Role models, No fear fantasy, Lost in time, Groan zone | Medium | ⬜ Not started |
| Integrate with Mind Space | Mind Space first → Play List Finder for depth | Small | ⬜ Not started |

**See:** `docs/skills-taxonomy-expansion-proposal.md` for full proposal on 4-segment expansion.

**Play List Finder Questions (Proposed):**
1. "Who are people whose work or life makes you think 'I'd love to do that'?" (up to 5 with activity)
2. "If you had zero fear of failure, judgment, or rejection - what would you spend your days doing?"
3. "What activities make you completely lose track of time?"
4. "What activities sound fun but make you nervous just thinking about doing them?" (Groan Zone)

### TIER 4: Healing Tab Updates (Milestone 5)
**Why:** The unique value prop - NS work → business action. Currently locked for testing.

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| Shadow Work Flow | Deep dive into shadow aspects/parts work | Medium | ⬜ Not started |
| Memory Reconsolidation | Rewiring traumatic memories safely | Medium | ⬜ Not started |
| Update Healing Compass | Improvements to existing flow | Small | ⬜ Not started |
| Update Nervous System Flow | Improvements to existing flow | Small | ⬜ Not started |
| Healing Book Assessment | Track books read + accountability | Small | ⬜ Not started |
| **NEW: Recognise Tab Enhancements** | | | |
| Essence count question | "How many times did your essence show up today?" | Small | ⬜ Not started |
| Protective count question | "How many times did your protective voice show up today?" | Small | ⬜ Not started |
| Essence vs Protective % graph | Add % graph slide to results to visualize essence:protective ratio over time | Medium | ⬜ Not started |
| **NEW: From Founder Journey** | | | |
| Earthquake Inventory | Healing flow for grief of traditional path ("I was lied to") | Medium | ⬜ Not started |
| Relationship Audit | Reflection on who supports new vs old you | Small | ⬜ Not started |
| Purgatory Acknowledgment | One-time card about identity conflict with old relationships | Small | ⬜ Not started |

**Note:** These unlock after Milestone 4 (CRM drives action) - healing tab currently locked for user testing.

---

### TIER 5: Groan & Identity System (Milestone 2 & 5)
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

### TIER 6: Game Layer (Milestone 2)
**Why:** Hero Journey doc is beautiful but won't help if core loop doesn't retain.

| Task | Effort | Impact |
|------|--------|--------|
| Update copy with hero language (no structural change) | 1 day | MEDIUM |
| Add Nemesis language to protective patterns | 0.5 day | MEDIUM |
| Power meter visualization | 1 day | LOW |

---

## WHAT TO DEPRIORITIZE (For Now)

### Park These Ideas (Exciting but not now):
- Fantasy league / team battles → Needs users first
- Income Calculator → Good for marketing, not core loop
- Ready Player One command center → Cool, but premature
- Physical merchandise / NFC badges → Way too early
- Seasonal events → Need base users first
- Clawdbot / AI agent → Nice-to-have
- Paid-to-learn marketplace → Future feature
- "How hard are you to replace" module → After core works

### These Can Wait:
- Baby photos feature
- Curiosity of the day
- Feature voting system
- Neural network rename

---

## YOUR ACTION PLAN: This Week

### ✅ COMPLETED
- [x] Landing page story structure (method loop, compounding graph)
- [x] Mind Space fast-track feature
- [x] Lead Scoring sliders (PTUF)
- [x] Scripts database + modal
- [x] DailyActions integration
- [x] ExecutionReview → WeeklyPlanningFlow merge
- [x] Tab locking for user testing (Play, Healing, Bonus)

### 📝 IN PROGRESS: Flywheel System Planning
- [ ] Review & finalize phase checklist items (see income-calculator-and-ecosystem-plan.md)
  - [ ] ATTRACT items confirmed
  - [ ] NURTURE items confirmed
  - [ ] DELIVER items confirmed
  - [ ] RETAIN items confirmed
- [ ] Decide: required vs optional items per phase
- [ ] Decide: auto-check from existing flows?

### ⬜ NEXT: Flywheel System Build
- [ ] Database migration (ecosystem_system_progress table)
- [ ] Config files (ecosystemConfig.js, ecosystemService.js)
- [ ] BusinessSystems page in Tools tab
- [ ] EcosystemStatusWidget on Dashboard
- [ ] Route + navigation wiring

### ⬜ THEN: User Testing
- [ ] Create Milestone 1 test script (what to ask, what to observe)
- [ ] Message 5 testers with clear ask
- [ ] Set up simple feedback form
- [ ] Get 3+ testers through Flow Finder
- [ ] Collect feedback
- [ ] Identify what actually breaks

---

## Decision Framework: Should I Build This?

```
┌──────────────────────────────────────────────────────────────────┐
│ NEW IDEA COMES IN                                                 │
│                                                                   │
│ Q1: Does it help achieve Milestone 1-5?                          │
│     YES → Continue                                                │
│     NO → Park it in future-features.md                           │
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

## Summary: The Brutal Truth

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

## Ideas Parking Lot

Move exciting-but-premature ideas here instead of building them:

| Idea | Why It's Parked | Revisit When |
|------|-----------------|--------------|
| Fantasy league | Need users to compete | After Milestone 2 |
| Income Calculator | Marketing tool, not core | After Milestone 1 |
| Ready Player One UI | Narrative layer, not functionality | After Milestone 2 |
| Physical badges | Cool but no users | After 100+ active users |
| Clawdbot | Nice-to-have automation | After Milestone 4 |

---

*Remember: Building is the easy part. Validating is hard. Stop avoiding the hard part.*
