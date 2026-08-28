# Phase 2 Restructure — Implementation Plan

Source of truth: `docs/features/phase2-restructure.md`

---

## Sprint 1: Quick Wins (Dimensions + Game Language)

**Goal:** Courage challenges feel more intentional. New users get hooked by game framing.

### 1.1 Expansion dimensions on courage challenges
- DB migration: add `expansion_dimensions text[]` to `groan_challenges`
- Values: `duration`, `frequency`, `medium`, `people`, `money`, `location`, `independence`
- Update WahooCreator: replace domain/depth picker with dimension multi-select (7 pill buttons)
- Group as: Craft (Duration, Frequency, Medium, People) | Scale (Money, Location, Independence)
- Update QuestBoardCard inline courage creation: same dimension picker
- Remove domain picker from quest creation flow (LevelTab add quest)
- Done when: creating a courage challenge shows dimension pills, saves to DB

### 1.2 Game language onboarding slides
- 3-5 slides before Essence Mirror: "Rules of Your Game"
- Source: `docs/research/life-as-game-inspiration.md`
- Permission-giving language, zero jargon, 12-year-old readable
- Done when: new user sees game slides → Essence Mirror → challenge tabs

---

## Sprint 2: Progress Tab + Quest Map Fix

**Goal:** Clean separation of action vs reporting. Quest map reflects real progression.

### 2.1 Build Progress tab
- Create `ProgressTab.jsx`
- Move from JourneyTab: hero stage progression, Zone Matrix, Capacity Score
- Add: streak display, skill XP summary
- Hero journey narrative at top, data below
- Start as dumping ground, refine later
- Done when: Progress tab renders with all reporting data

### 2.2 Quest map Y-axis
- Change from L1-L4 domain tiers to date order of courage challenges completed per path
- Earliest at bottom, most recent at top
- X-axis (NS state) unchanged
- Remove L1-L4 tier lines and labels
- Done when: quest map plots by completion date, not domain stage

### 2.3 Tab rename (partial)
- Courage tab → Progress tab (reuse slot, point to ProgressTab)
- Journey tab stays for now (becomes Discover in Sprint 3)
- Done when: 4 tabs are Journey | Quests | Tune | Progress

---

## Sprint 3: Discover Tab + Dome Viz

**Goal:** Phase 1 has a home with a real visualization.

### 3.1 Dome safety visualization
- Polar/radar chart: 12 branches radially, NS state as distance from center
- 56 core nodes on branch axes at NS-state distance
- Hero avatar at center
- Filled area = dome of safety shape
- Data: `experience_dome_ratings` (already exists)
- If viz is complex: ship simple grid/list first, upgrade to radar later
- Done when: user sees their dome shape after rating experiences

### 3.2 Build Discover tab
- Create `DiscoverTab.jsx`
- Contains: Essence Mirror completion card, Life Map card, Dome entry/viz
- "Ready to go deeper?" bridge CTA (persistent, bottom of tab)
- Rename Journey tab → Discover
- Done when: Discover tab renders with dome viz + bridge CTA

### 3.3 Clean up JourneyTab
- Replace with DiscoverTab
- Remove reporting content (moved to Progress in Sprint 2)
- Done when: JourneyTab references removed

---

## Sprint 4: Phase 1→2 Bridge Pipeline

**Goal:** The Phase 1→2 handoff actually works. Dome and Life Map feed quests.

### 4.1 "Ready to go deeper?" bridge CTA
- Design using brand guide (purple→gold)
- On tap → Life Paths questionnaire flow
- Always visible on Discover tab, no gates

### 4.2 Life Paths flow update
- Ingest Vibe Rise data from Life Map clusters AND dome nodes
- Pre-populate: "Based on what lights you up, here are paths worth exploring"
- User confirms, removes, or adds
- Confirmed → creates quests with courage challenges
- Done when: tapping bridge CTA → Life Paths shows suggested paths from dome/Life Map data

### 4.3 Life Map → Dome branch connection
- After Life Map completion, highlight branches on dome
- "You have experience in Movement, Healing, Bonds"
- Branch-level only, no node-level mapping
- Done when: dome shows which branches Life Map already identified

---

## Sprint 5: Onboarding + Cleanup

**Goal:** End-to-end new user flow is coherent. Dead code removed.

### 5.1 Onboarding sequence
- sign up → game slides (Sprint 1) → Essence Mirror → Discover tab
- Discover tab guides: Life Map first → Dome second
- Done when: new user flows through complete sequence

### 5.2 Archive/remove dead code
- Experience Check-in code in TuneTab (dead)
- Domain label constants and pickers (replaced by dimensions)
- 8 business explainer flow routes (keep 3 healing ones)
- Hide Career Clarity for new users (show at hero stage 10+)
- Old JourneyTab if fully replaced

### 5.3 Update CLAUDE.md
- New tab structure (Discover / Quests / Tune / Progress)
- Updated routes and onboarding flow
- Expansion dimensions replacing domains
- Phase 1→2 bridge description

### 5.4 Update three-phase-journey.md
- Sync with implementation decisions
- Remove contradictions with phase2-restructure.md

---

## Dependency Order

```
Sprint 1 (dimensions + slides) ──► Sprint 2 (Progress tab + quest map)
                                          │
                                    Sprint 3 (Discover tab + dome viz)
                                          │
                                    Sprint 4 (bridge pipeline)
                                          │
                                    Sprint 5 (onboarding + cleanup)
```

Sprint 1 is independent, start immediately.
Sprint 2 can start in parallel with Sprint 1.
Sprint 3 depends on Sprint 2 (Progress tab must exist before renaming Journey → Discover).
Sprint 4 depends on Sprint 3 (Discover tab must exist for bridge CTA).
Sprint 5 runs last (needs everything in place).

---

## What's NOT in this plan

- Multiplication Screen (Phase 2→3 bridge) — build when Phase 3 is priority
- Hero journey contextual across tabs — explore after Progress tab is live
- Dome viz polish (animations, icons) — iterate after MVP radar ships
- Discover tab post-bridge evolution — decide after seeing usage
- Progress tab refinement — start as dumping ground, shape with usage data
