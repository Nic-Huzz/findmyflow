# Scale Gamification: Full Implementation Plan

**Date:** 2026-07-18
**Current Score:** 140 (Weak)
**Target Score:** 475+ (Strong-Exceptional)
**Reference:** `docs/research/octalysis-scale-gamification-recommendations.md`
**Easy tier spec:** `docs/superpowers/plans/2026-07-16-scale-gamification-easy-tier.md`

---

## What's Already Built (from Interior Scoreboard sprints)

The `feature/interior-scoreboard-sprint2` branch has 12 commits ahead of main. Key overlaps with our gamification plan:

| Built (on branch, not merged) | Overlaps with | Status |
|---|---|---|
| Sprint 0: quest_id on groan_challenges + FK | Foundation for skill tracking | ✅ Done, merged to main |
| Sprint 1: Timeframe tags on quest_tasks (week/month/quarter) | M11 quarterly planning (partial) | Built, not merged |
| Sprint 1: Identity statement library (dropdown on completion modal) | E4 celebrations (identity collection) | Built, not merged |
| Sprint 2: Mirror page (`/mirror`) with cluster resonance ratings | Clarity score (CD2 progress) | Built, not merged |
| Sprint 2: Clarity score (average resonance) | CD2 accomplishment metric | Built, not merged |
| Sprint 3: Quest skill auto-tagging (`skill_tags[]` on quests) | Monopoly finder branch scoring | Built, not merged |
| Sprint 4: Cluster re-generation after 5 challenges | CD7 curiosity (mirror evolves) | Built, not merged |
| Sprint 5: Courage counter on Courage tab | E4 celebrations (visible count) | Built, not merged |
| Sprint 5: Per-completion guidance layer | H2 Zarlo triggers (conceptual overlap) | Built, not merged |
| Sprint 6: Skill tree background (`user_skill_progress` table) | Spider graph skill axis (future) | Built, not merged |
| Sprint 6: Curiosity cluster skills/problems extension | Monopoly finder data enrichment | Built, not merged |
| MirrorPage.jsx (269 CSS + 368 JSX lines) | New surface for Clarity | Built, not merged |

**Key implication:** Sprint 1's identity statement library and Sprint 2's Clarity score are CD2/CD4 features we were planning to build. They're already done. We should merge the interior-scoreboard branch before starting gamification work, or we'll duplicate effort.

---

## Pre-Work: Merge Interior Scoreboard (1 day)

Before any gamification sprint, merge `feature/interior-scoreboard-sprint2` into `light-portal`:

1. Review 12 commits for conflicts with recent Scale/Stripe work
2. Resolve any conflicts (CreatorHomeV2, JourneyTab, AppRouter likely touched by both)
3. Test both consumer + creator builds
4. Push to light-portal

This gives us: identity statements, Clarity score, Mirror page, quest skill tags, courage counter, skill tree background. All for free.

**Risk (revised after verification):** Sprint2 branch does NOT modify `CreatorHomeV2.jsx` directly. Changes are in consumer app components (JourneyTab, LevelTab, QuestBoardCard, PlayListTab, LifeMapFlow) + new MirrorPage. `AppRouter.jsx` has 6 new lines (Mirror route). Conflict risk is **lower than initially estimated**. Budget 0.5 day, not 1-2 days.

---

## Phase 1: Foundation + Easy Tier (10 days)

### Sprint G1: Foundation (0.5 days)
**New file:** `src/lib/creatorGamification.js`
- Single localStorage JSON object for all gamification state
- Celebration queue with 3-second cooldown
- `getGamificationState()` / `updateGamificationState()` helpers

**New state:** `creatorXP` in CreatorHomeV2 (separate from consumer `movementXP`)
- Computed client-side from: playbook stages (25 ea), experiences created (10 ea), events run (15 ea), 3% notes (5 ea), 80%+ fill events (20 ea)

**Dependencies:** None
**Spec:** Easy tier doc, Architecture Decisions #1-3

### Sprint G2: Celebrations + XP Display (1.5 days)
**Wire `useCelebrations` to 14 milestones** (defer 4 that need future features)
- Confetti + Huzz-voiced toast per milestone
- Celebration queue prevents rapid-fire
- localStorage guard prevents re-firing on refresh

**Display creatorXP + level in hero section**
- Level badge pill + XP bar toward next level
- 5 levels: Dreamer(0), Builder(50), Launcher(150), Scaler(400), Movement Maker(1000)

**Files:** `CreatorHomeV2.jsx`, `CreatorHomeV2.css`
**Dependencies:** Sprint G1
**Spec:** Easy tier doc, E4 + E5

### Sprint G3: Identity + Origin (1 day)
**Movement Maker identity** woven throughout:
- CreatorLogin.jsx: "Welcome, Movement Maker"
- CreatorHomeV2 hero: "Welcome back, [name/Movement Maker]"
- Welcome email in stripe-webhook (redeploy needed)
- Download popup title

**Origin story overlay** on first portal visit:
- Full-screen card, brand purple, gold CTA
- "The world is going to be a better place thanks to you and your work."
- Skip if `?welcome=scale` present (payment redirect already welcomed)
- Shows once, stored in gamification state

**Files:** `CreatorLogin.jsx`, `CreatorHomeV2.jsx`, `BottomToolbar.jsx`, `stripe-webhook/index.ts`
**Dependencies:** Sprint G1
**Spec:** Easy tier doc, E1 + E2

### Sprint G4: Launch Pads (3 days)
**Per-section contextual guidance cards:**

Identity tab ("Your launch pad"):
- Discover your essence → `/essence-mirror`
- Find your North Stars → `/experience-creators`
- Complete your positioning → scroll to section
- Find your rule break → `/create/remarkable`

Experiences tab ("Your next steps"):
- Create your first experience → `/create/experience/new`
- Set up your first pipeline → click experience
- Run your first event → click upcoming

Growth tab ("Start tracking"):
- Connect Instagram → OAuth
- Run your first experience → Experiences tab
- Log your first 3% improvement → past experience

**New component:** `src/components/CreatorHome/SectionLaunchPad.jsx`
**Files:** `CreatorHomeV2.jsx`, new CSS
**Dependencies:** Sprint G2 (references level)
**Spec:** Easy tier doc, E6

### Sprint G5: Urgency + Nudges + Badge (2 days)
**Event countdown colours** (E8): amber 14d, red 7d, pulse 3d. Experiences tab. "X tasks incomplete" when <50% readiness.

**Pipeline staleness nudge** (E9): daily inline card when event 7+ days out with zero pipeline items done. "Your [event] is in [X] days and your audience doesn't know about it yet."

**Days since last event** (E10): Growth tab. "It's been [X] days since your last experience." Hides when event upcoming.

**Founding member badge** (E11): gold "FOUNDING" pill in hero. RPC check + manual whitelist for test accounts.

**Value-framed locked copy** (E7): Playbook stepper descriptions rewritten for value not scarcity.

**Low attendance reframe** (E14): encouraging copy below attendee count when <50% capacity.

**Files:** `CreatorHomeV2.jsx`, `CreatorHomeV2.css`, new RPC function
**Dependencies:** None (can run parallel with G4)

---

## Phase 2: Monopoly Finder (2 days)

### Sprint G6: Branch Profile on Creator Portal (2 days)
**Mount BranchInsightCard on CreatorHomeV2** (Identity tab, above BlowUpBrandCard):
- Branch chart (horizontal bars by cluster count from `curiosity_clusters`)
- Gap insight (curiosity branches vs quest branches)
- Rarity check (skills x problems vs 299 profiles)
- Frontier card with "Is this what you're breaking?" prompt

**Conditional:** only shows if user has curiosity map data. If no curiosity data exists, show a CTA card instead: "Complete your Curiosity Map to discover your Personal Monopoly" with a button to `/curiosity-map`. This makes the empty state USEFUL (drives action) rather than just blank.

**Existing code (verified):**
- `src/hooks/useBranchScoring.js` — exists on current branch ✅
- `src/components/BranchInsightCard.jsx` + `.css` — exists ✅
- `src/components/CreatorPositionCard.jsx` — also exists (may overlap, check which to use)
- `public/data/spiralDynamicsMatrix.json` — exists ✅
- Already mounted in `RemarkableFlow.jsx` — may need to lift to CreatorHomeV2 as a second mount point

**Files:** `CreatorHomeV2.jsx`, branch scoring hook, BranchInsightCard component
**Dependencies:** Interior scoreboard merge (quest skill tags feed branch scoring)
**Spec:** `docs/features/personal-monopoly-finder.md`, Sprints 0-2

---

## Phase 3: Medium Tier (15 days)

### Sprint G7: Sequential Score Reveal (2 days)
After an event's date passes, the FIRST VIEW of that past event shows results one metric at a time with animated delays (800ms stagger): attendees → satisfaction → repeat rate → revenue. Each metric slides in with a count-up animation.

**Decision (confirmed):** Option A — auto-trigger on first view. No manual "close out" button. Events become past when `experience_date < now()`. Reveal tracked in gamification state (`revealedEvents: { [expId]: true }`). Second view shows all metrics immediately (no re-animation).

**Implementation:**
- New component: `src/components/CreatorHome/ExperienceResultsReveal.jsx`
- Trigger: Inside `PastExperienceStats.jsx` (already renders when user taps a past event). Check gamification state on mount. If not revealed, show sequential animation. Mark revealed on completion.
- Data sources (already available in PastExperienceStats): `contact_experiences` count (attendees), no satisfaction column exists (use placeholder or skip), repeat count from contact frequency, `ticket_price * attendees` (revenue estimate)
- Animation: CSS `@keyframes` with `animation-delay` per metric. Gold count-up number, fade-in label below.
- On animation complete: fire confetti if any metric is a personal best (compare against gamification state `bestMetrics`).

**Files:** New `ExperienceResultsReveal.jsx` + `.css`, modify `PastExperienceStats.jsx` to conditionally render it
**Dependencies:** None

### Sprint G8: Building Streak (2 days)
Weekly cadence. Growth tasks count: experience created, pipeline task, 3% note, content posted. Forgiving (1 miss allowed). Display on hero section or Growth tab.
**Files:** `CreatorHomeV2.jsx`, `creatorGamification.js`
**Dependencies:** Sprint G1

### Sprint G9: Alternative Positionings (2 days)
Modify `generate-positioning` edge function to return 3 framings. Show as cards user picks from. "Show me 3 more" replaces "Regenerate."
**Files:** `PositioningSummary.jsx`, `generate-positioning/index.ts`
**Dependencies:** None

### Sprint G10: Dynamic Share Card (2 days)
Custom SVG of essence avatar. Border upgrades by level (bronze→gold→holographic). Manual "Refresh card" tap. Playbook completion badges on card.
**Files:** `CreatorShareCard` component in `CreatorHomeV2.jsx`
**Dependencies:** Sprint G2 (needs level system)

### Sprint G11: Hidden Achievements (1 day)
8 secret milestones. Pop when triggered. Nobody knows they exist.
Polymath, Cult Leader, Sold Out, Chain Reactor, Origin Story, Night Owl, Full Stack, Century.
**Files:** `creatorGamification.js` (trigger checks), `CreatorHomeV2.jsx` (display)
**Dependencies:** Sprint G1

### Sprint G12: Quarterly Experience Planning (2 days)
"What experiences are you running this quarter?" in Experiences tab. Select from library or create new. Optionally set dates. Appears in Upcoming. End of quarter: review planned vs actual.
**Files:** `CreatorHomeV2.jsx` (Experiences tab), new `QuarterlyPlanner.jsx` component
**Dependencies:** None
**Note:** Interior Scoreboard Sprint 1 already added timeframe tags (week/month/quarter) to quest_tasks. This is the creator portal equivalent.

### Sprint G13: Creator Portfolio on Growth (2 days)
Single "Your Journey" section on Growth tab showing everything built: experiences (with counts), playbook stages (with dates), positioning (framed), rule break, Scale Score, level badge, lifetime attendees.
**Files:** `CreatorHomeV2.jsx` (Growth tab), new `CreatorPortfolio.jsx`
**Dependencies:** Sprint G2 (needs level + XP data)

### Sprint G14: Community Feed (2 days)
3 auto-post event types: playbook completion, experience created, event sold out. Feed page accessible from Growth tab or nav. One-tap kudos reactions.
**Files:** New `CreatorFeed.jsx`, new `creator_feed_events` table (needs migration)
**Dependencies:** Sprint G1
**Migration needed:** `CREATE TABLE creator_feed_events (id uuid PK, user_id uuid FK, event_type text, event_data jsonb, created_at timestamptz)` + RLS policies
**Note:** Consumer app `PlaylistFeed.jsx` is a pattern reference but needs new event types. Don't directly port.

---

## Phase 4: Hard Tier (15 days)

### Sprint G15: Zarlo for Creator Portal (5 days)
Playful mentor. Unlocks after first playbook stage (Remarkable Results).
Introduction: "You found your rule break. I'm here to help you use it."

**Architecture Decisions (confirmed Jul 18):**

1. **Tab awareness:** NOT required. Triggers are data-based (event approaching, pipeline empty), not UI-based. Bubble appears floating above all tabs.
2. **Data access:** Pass `zarloTriggerData` prop from CreatorHomeV2 to Zarlo widget. CreatorHomeV2 already loads all needed data (upcoming events, checklist counts, past events, 3% chain, quarterly plans). Zero extra Supabase queries.
3. **Frequency capping:** Max 2 bubbles per day, 2-hour cooldown between them. Same as consumer (`checkReactionCooldown()` in zarloEngine.js). Most urgent trigger wins (priority order below).
4. **Bubble action:** Tap opens Zarlo chat with trigger context pre-loaded in system prompt. Same pattern as consumer `ZarloProactiveBubble → onTap → setActiveChat('zarlo')`.

**Context map for `zarloPageContent.js`** (new `/create` entry):
- whatIsThis: "Your Scale portal. Where you turn your rule break into packed experiences."
- whyMatters: "Most creators stall after finding their thing. This is where you stop stalling."
- contextualPrompts: dynamic from trigger data (not static FAQ)

**7 proactive bubble triggers (priority order — highest first):**
1. Event ≤14d out, zero Attract checklist items done → "Your [name] is in [X] days and nobody knows about it. Want help with your first post?"
2. Pipeline 80%+ complete → "Almost ready. What's the last thing?"
3. No portal activity 7+ days → "Been quiet. When you're ready, your next step is [X]." (X = first incomplete launch pad item)
4. 3% improvement logged → "That's [N] in a row. You're compounding."
5. Sold-out event (first time) → "What did you do differently? Write it down before you forget."
6. Scale Score complete → "Here's what high-scoring creators have in common with you."
7. Quarterly planning empty (new quarter) → "New quarter. What are you running?"

**Trigger data shape** (passed as prop from CreatorHomeV2):
```js
const zarloTriggerData = {
  nearestEvent: { name, daysUntil, attractItemsDone, totalItems },
  pipelineReadiness: number, // 0-100
  daysSinceActivity: number,
  threePercentCount: number,
  hasSoldOut: boolean,
  hasScaleScore: boolean,
  quarterlyPlansEmpty: boolean,
  hasRemarkableResults: boolean, // gate: Zarlo only shows after this
}
```

**Implementation steps:**
1. Add `/create` entry to `zarloPageContent.js` (0.5d)
2. Compute `zarloTriggerData` in CreatorHomeV2, pass as prop (0.5d)
3. New `useCreatorZarloTriggers.js` hook: checks priority order, respects cooldown, returns bubble message or null (1d)
4. Mount `ZarloWidget` + `ZarloProactiveBubble` in CreatorHomeV2 (same components, new context) (1d)
5. Wire `generateZarloReaction` with creator-specific action types (pipeline_complete, event_approaching, etc.) (1d)
6. Test all 7 triggers with a seeded account (1d)

**Files:** `zarloPageContent.js`, new `useCreatorZarloTriggers.js`, `CreatorHomeV2.jsx`
**Dependencies:** None (all data sources already built)

### Sprint G16: Creator Insight Drops (2 days)
Template-based, NOT AI-generated. Client-side computation from data already loaded in CreatorHomeV2. No edge function needed. Instant display, no API wait.

**Architecture Decisions (confirmed Jul 18):**

1. **No edge function.** All 5 insight types computed client-side from data already in CreatorHomeV2 state. Two types use hardcoded percentile benchmarks (swap for RPC at 50+ users).
2. **Waterfall priority.** Check insights in order, return first match. Max 1 per session. Same pattern as consumer `useInsightDrops.js`.
3. **Separation from Zarlo.** Insight Drops = template data observations (passive, "we noticed"). Zarlo bubbles = AI-generated conversational invitations (active, "want help?"). Different triggers, different surfaces, no overlap.

**5 insight types (priority order):**

| # | Type | Trigger condition | Template | Data source |
|---|---|---|---|---|
| 1 | Monopoly update | Branch confidence changed since last seen | "Your primary branch shifted from {old} to {new}. Confidence: {pct}%" | `useBranchScoring` output (already loaded) |
| 2 | Playbook milestone | Any playbook stage completed + not seen | "Only ~15% of experience creators get this far." | Playbook flags in state. Hardcoded benchmark. |
| 3 | Pattern recognition | 3+ consecutive 3% notes mentioning same theme | "Your last {N} improvements all focused on {theme}. That's your growth edge." | `past.filter(e => e.three_percent_note)` — keyword scan for: marketing, pricing, delivery, community |
| 4 | DNA comparison | Rule break branch matches a known creator | "Your rule break sits in the same branch as {creator}. They went from {before} to {after}." | `remarkable_angles.branch` + `experienceCreatorDNA.json` |
| 5 | Percentile | Scale Score in top/bottom quartile | "Your Scale Score ({score}/15) puts you ahead of ~70% of creators who take the diagnostic." | `scale_diagnostics.total_score`. Hardcoded quartiles: 0-4 bottom, 5-8 mid, 9+ top. |

**Hardcoded benchmarks (v1):**
- "15% get this far" — based on typical SaaS funnel: signup → complete step 1 (~60%) → step 2 (~35%) → step 3 (~20%) → step 4 (~15%)
- Scale Score quartiles: from distribution of existing diagnostics (most score 4-7)
- Swap both for live RPCs when `SELECT COUNT(*) FROM user_subscriptions WHERE plan_type='creator'` >= 50

**localStorage seen-guard:** `insight_creator_seen_{key}` — same pattern as consumer. Each insight fires once ever per device.

**Implementation:**
1. New hook: `src/hooks/useCreatorInsightDrops.js` — waterfall check, returns `{ insight, dismissInsight }` (1d)
2. Mount `<InsightDrop>` in CreatorHomeV2 (same component as consumer, already exists) (0.5d)
3. Wire 5 insight checks with data from CreatorHomeV2 state (0.5d)

**Files:** New `src/hooks/useCreatorInsightDrops.js`, modify `CreatorHomeV2.jsx` (import + mount)
**Dependencies:** None (all data sources already built). Independent of Zarlo.

### Sprint G17: Creator Profile Page (3 days)
Public page at `create.nichuzz.com/creator/[id]`.
Shows: essence avatar, archetype, positioning statement, rule break, Scale Score, branch chart, experience types, North Star creators, level badge, founding badge, spider graph (when built).
No revenue, attendee numbers, pricing, or contact info.

**Files:** New `src/pages/CreatorProfile.jsx`, new route in `AppRouter.jsx`
**Dependencies:** Sprint G2 (level), Sprint G6 (branch chart), Sprint G10 (share card as preview)

---

## Phase 5: Spider Graph (5 days)

### Sprint G18: Spider Graph Component (3 days)
6-axis radar chart: Reach (views), Impact (attendees), Price (ticket), Consistency (experiences run), Retention (repeat rate), Brand (Scale Score).
6 tiers per axis. Purple fill, gold border at current tier.
Displays on Identity tab below hero, on share card (mini), on profile page.

**Data sources (verified against DB schema 2026-07-18):**

| Axis | Table | Column(s) | Computation | Verified |
|---|---|---|---|---|
| Impact | `experience_attendees` | `attended` (boolean) | COUNT WHERE attended=true, sum across experiences | ✅ |
| Consistency | `experiences` | `experience_date` | COUNT WHERE experience_date < now() | ✅ |
| Retention | `experience_attendees` | `contact_id` | Contacts in 2+ experiences / total unique | ✅ (same as Growth tab) |
| Brand | `scale_diagnostics` | `total_score` | Direct read | ✅ |
| Price | `experiences` | `ticket_price` (numeric) | MAX across all experiences | ✅ |
| Reach | `instagram_metrics` | `views` (integer) | SUM or latest row | ✅ but only if Instagram connected |

Show 5 axes without Instagram, 6 when linked. Don't show empty Reach axis.

**Files:** New `CreatorRadarChart.jsx` (SVG), mount on **Growth tab** in `CreatorHomeV2.jsx` (not Identity tab). Share card + profile page mounts deferred to later sprints.
**Dependencies:** Sprint G17 (profile page), Sprint G10 (share card)

### Sprint G19: Spider Graph Celebrations (2 days)
Wire tier upgrades to celebration queue. Confetti + toast + animated axis extension when any tier threshold crossed. Badge icon updates per tier.
**Files:** `creatorGamification.js`, `CreatorHomeV2.jsx`
**Dependencies:** Sprint G18, Sprint G2 (celebration queue)

---

## Phase 6: Community Operations (0 code days)

These happen in PARALLEL with code sprints, not after:

| What | When to start | Owner |
|---|---|---|
| Accountability pairs (manual matching) | After 4+ Scale users | Nic |
| Group onboarding cohort (Slack/WhatsApp) | After 3+ same-week signups | Nic |
| Monthly Scale call | After 5+ Scale users | Nic |
| Founding badge (first 50) | Already in Sprint G5 | Automated |
| Local Legend crown | After 15+ active users | Automated (Sprint G9 or later) |

---

## Dependencies Map (Impact-First Order)

```
Pre-work: Merge interior-scoreboard branch (1-2d)
    │
    ▼
G1 Foundation: creatorGamification.js + creatorXP (0.5d)
    │
    ▼
┌─── WEEK 1: THE "WOW" TRIFECTA ───────────────────────┐
│                                                        │
│  G6 Monopoly Finder (2d)     G18 Spider Graph (3d)    │
│  "Who you are"               "What you've built"       │
│  Branch chart + gap +        6-axis radar, tier        │
│  frontier + rarity           badges, purple/gold       │
│  → Identity tab              → Growth tab              │
│  (CTA if no curiosity data)  (5 axes, 6 with IG)      │
│                                                        │
│  G2 XP + Level display (1d) — hero section             │
│                                                        │
│  Result: First portal visit shows branch shape,        │
│  spider shape, XP level. "I feel so seen" + "I can     │
│  see my progress." Three identity artifacts on day 1.  │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌─── WEEK 2: CELEBRATE + GUIDE ─────────────────────────┐
│                                                        │
│  G2b Celebrations (1d)       G3 Identity + Origin (1d) │
│  Wire confetti to 14         Movement Maker greeting   │
│  milestones + queue          + origin story overlay     │
│                                                        │
│  G4 Launch Pads (3d)         G5 Urgency + Nudges (2d) │
│  Per-section guidance        Countdown colours,        │
│  cards on each tab           staleness, founding badge  │
│                                                        │
│  Result: Portal feels alive. Guidance shows next       │
│  steps. Existing completions get celebrated. Urgency   │
│  on upcoming events. "The app sees me."                │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌─── WEEK 3: USER TESTING GATE ─────────────────────────┐
│                                                        │
│  STOP. DO NOT PROCEED WITHOUT THIS.                   │
│                                                        │
│  1. Get 3 real Scale users through the portal          │
│  2. Watch them: what do they click? Where do they      │
│     stall? Does the branch chart land? Does the        │
│     spider graph feel meaningful or confusing?          │
│  3. Ask: "What did you notice?" (not "did you like")   │
│  4. Document: what worked, what fell flat, what         │
│     they asked for that we didn't build                │
│                                                        │
│  THEN decide Week 4+ based on what you observed.       │
│  The plan below is the EXPECTED path. Real user        │
│  behavior may redirect it entirely.                    │
└────────────────────────────────────────────────────────┘
    │
    ▼ (if testing confirms the foundation works)

WEEK 4: Medium features (pick 3 based on test results)
  Candidates:
  - G7 Sequential Score Reveal (2d) — if users run events
  - G8 Building Streak (2d) — if users return weekly
  - G9 Alt Positionings (2d) — if positioning feels limiting
  - G11 Hidden Achievements (1d) — always good, low risk
  - G12 Quarterly Planning (2d) — if users want planning
  - G19 Spider Celebrations (2d) — if spider graph landed

WEEK 5: Medium features (remaining)
  - G10 Dynamic Share Card (2d)
  - G13 Portfolio on Growth (2d)
  - G7/E7/remaining from week 4

WEEK 6-7: Hard features
  - G15 Zarlo for creators (break into sub-sprints):
    - 6a: Page context map (2d) — checkpoint: does context load correctly?
    - 6b: Proactive triggers (2d) — checkpoint: do bubbles fire at right moments?
    - 6c: Test + tune (3d) — adjust trigger thresholds based on real usage
  - G16 AI Insight Drops (5d) — needs monopoly + Zarlo context
  - G17 Creator Profile (3d)

WEEK 8+: Community features (ONLY when user count justifies)
  - G14 Community Feed — gate: 5+ active Scale users
  - Accountability pairs — gate: 4+ users (manual)
  - Monthly call — gate: 5+ users
  - Creator league — gate: 20+ users
```

---

## Timeline (impact-first, with testing gate)

| Week | What | Days | Why this order |
|---|---|---|---|
| 0 | Merge interior-scoreboard + G1 foundation | 2 | Plumbing. Clarity score + identity statements come free. |
| 1 | G6 Monopoly + G18 Spider Graph + G2 XP | 5 | **The "wow" trifecta.** First portal visit shows: who you are (branches), what you've built (spider), your level. Three identity artifacts on day 1. Highest impact features first. |
| 2 | G2b Celebrations + G3 Identity/Origin + G4 Launch Pads + G5 Urgency | 5 | Now that identity artifacts EXIST, celebrate them. Guide next steps. Add urgency to events. |
| 3 | **USER TESTING GATE** | 0 code | 3 real users through the portal. Watch. Ask. Document. This determines everything after. |
| 4-5 | Medium features (chosen by test results) | 5-8 | Pick the 4-5 features that address what testing revealed. Not predetermined. |
| 6-7 | Zarlo (sub-sprinted: context→triggers→tune) + Insight Drops | 10 | The AI companion layer. Only after the static foundation is proven. |
| 8+ | Community features (gated on user count) | varies | Feed at 5+ users. League at 20+. Not before. |

**Weeks 1-2 are fixed.** They deliver the foundation that everything else builds on.
**Week 3 is mandatory.** No skipping the test gate. Building 15 more features without user feedback is framework-chasing, not product-building.
**Weeks 4+ are adaptive.** The plan provides candidates, not a fixed sequence. Real user behavior determines priority.

---

## Why This Order (Not Easy/Medium/Hard)

The old plan organized by DIFFICULTY: easy stuff first, hard stuff last. That optimizes for shipping speed, not user impact.

The new plan organizes by IMPACT: the features that change how the user FEELS about the portal come first, regardless of difficulty.

| Old order (difficulty-first) | New order (impact-first) |
|---|---|
| Week 1: Celebrations + XP (Easy) | Week 1: Monopoly + Spider + XP (Impact) |
| Week 2: Launch pads + Monopoly | Week 2: Celebrations + Guidance + Urgency |
| Week 3: 5 medium features | Week 3: STOP. Test with real users. |
| Weeks 4-7: More features | Weeks 4+: Build what tests reveal |

The key difference: in the old plan, a user who visits the portal in Week 1 sees an XP bar at 0 and nothing else. In the new plan, they see their branch chart, spider graph, and level badge. One creates disappointment. The other creates the "I feel so seen" moment that the consumer app's onboarding was designed around.

---

## What NOT to build yet (decided, logged in recommendations doc)

| Feature | Why deferred | Revisit trigger |
|---|---|---|
| Inner Game unlock chain (M2) | Playbook needs real users | `SELECT COUNT(*) FROM remarkable_angles` >= 10 |
| Combination discovery (M7) | Sample sizes too small | Creator corpus >= 300 profiles |
| AI content feedback (M9) | Needs engagement data | ContentIntel has 50+ analysed reels |
| Template sharing (M12) | Need user base | `SELECT COUNT(*) FROM user_subscriptions WHERE plan_type='creator' AND status='active'` >= 10 |
| Creator league (M13) | Not enough users | Same query >= 20 |
| AI "what if" scenarios (H4) | No comparative data | 20+ creators with 3+ events each |
| Mentor layer (H8) | Need Level 4+ users | 5+ users with creatorXP >= 400 |
| Local Legend (H9) | Not meaningful yet | Active creator count >= 15 |
| Community feed UI (G14) | 1 person posting to themselves is sad | Active creator count >= 5 |

**Community feed trigger note:** Build the auto-post TRIGGERS in Sprint G2 (write events to `creator_feed_events` on every milestone) even though the feed UI won't show until 5+ users. This captures early users' milestones so the feed has content from day 1 when it launches.

**Check these triggers monthly.** Run the queries. When a threshold is crossed, that feature moves to the active build queue.
