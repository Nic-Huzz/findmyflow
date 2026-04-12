# Wound Stages Migration Plan (v2)

Move the 4-stage wound diagnostic from `JourneyOnboarding.jsx` (Beat 2) into a **Level 0 quest** that scene-sets the entire journey. Archive the Tension Assessment for future use in the business/advanced-user module.

---

## Section 1: Recommendation

**Move the wound map into Level 0 (Getting Set Up) as a new `extraQuest`, not a healing deep dive on a later level.** The wound stages diagnostic is origin-story content: "what happened to you before you arrived here". It belongs at the start of the journey as character creation, not mid-journey as a healing exercise.

The previous plan (v1) recommended Level 5 based on schema alignment (the `sympathetic`/`ventral`/`dorsal` archetypes map to nervous system framing). That analysis was correct at the data level, but wrong at the narrative level. Users arriving at FindMyFlow are at **The Crack** — they already *feel* the wound. The app's job is to give them language for it immediately, then build on that vocabulary across all subsequent levels. Burying the wound map at Level 5 means users spend 4 levels without knowing their attachment archetype, and the protective voices they meet in zone diagnoses (Performer, Controller, Ghost, Perfectionist) lack the origin context that would make those encounters land.

At Level 0 the wound map acts as a **scene-setter**: "Before we start, let's understand what happened." The user leaves Level 0 knowing their hero identity (Essence Mirror), their childhood play pattern (Curiosity Compass), *and* their nervous system origin story (Wound Map). That's the complete character sheet. Every subsequent level then references it.

**Archive the Tension Assessment** — it asks "where are you on the journey right now?" which is most useful for users already mid-journey. New users at The Crack will score 0-1 on most questions, telling them nothing they don't already feel. The tension assessment becomes valuable later as a recalibration tool for the business module / advanced user flow, but that home doesn't exist yet. Park it.

---

## Section 2: Comparison Table

*Retained from v1 for context — Level 0 decision supersedes this analysis.*

| Level | Current Deep Dive | Thematic Fit | Progression Fit | Replace or Coexist | Impl Cost | Notes |
|---|---|---|---|---|---|---|
| **0 Getting Set Up** | Hero Avatar (Essence Mirror) | **9/10** | **10/10** | **Coexist as new extraQuest** | **S-M** | **Character creation: essence + play + origin. Complete trio. No deep dive replacement needed.** |
| 1 Identity | Shadow Work | 6/10 | 4/10 | Coexist only | M | Level 1 is about essence pre-installation. Premature for attachment archaeology. |
| 2 Vulnerability | Healing Compass | 6/10 | 5/10 | Coexist | M | Adjacent (relational wounding) but vulnerability is interpersonal calibration, not attachment archaeology. Too early. |
| 3 Direction | Flow Finder Problems | 2/10 | 2/10 | No | — | Mismatch. Direction is service-oriented. |
| 4 Enough | Matrix Codes | 3/10 | 3/10 | No | — | Mismatch. Enough is shipping/perfectionism. |
| 5 Growth | Nervous System | 10/10 | 6/10 | Possible replacement | M | Schema-perfect but mid-journey timing wastes the origin-story framing. Better: wound map at L0 informs L5's nervous system deep dive downstream. |
| 6 Execution | Limiting Belief Rewire | 5/10 | 6/10 | No | — | Belief-frame, not somatic. |
| 7 Passion-Risk | Passion Excavation (NEW) | 3/10 | 3/10 | No | — | Endgame. |
| 8 Play | none | — | — | No | — | No deep dive. |

---

## Section 3: Migration Spec for Level 0

### Files to create

- **`src/flows/WoundMapFlow.jsx`** — Standalone route component. Lift the `WOUND_STAGES` constant and Beat 2 render block (the `jo-story` branch, ~lines 538-602) from `JourneyOnboarding.jsx`. Structure:
  - State: `storyStageIndex` (0-3), `stageSelections` object, transition state
  - 4 sequential stages, each showing 3 Pixar scene cards
  - Selection auto-advances after 600ms
  - Final step: archetype summary reveal (dominant pattern from selections)
  - Save directly to `journey_onboarding_selections` via Supabase (user is already authed at Level 0, no localStorage dance needed)
  - `returnTo` query param handling (copy pattern from `ZoneDiagnosisFlow.jsx`)
  - Default `returnTo`: `/7-day-challenge`

- **`src/flows/WoundMapFlow.css`** — Port wound-stage-specific CSS from `JourneyOnboarding.css` (lines ~462-647). Classes to port:
  - `.jo-story`, `.jo-story-content` → rename to `.wm-story`, `.wm-content`
  - `.jo-stage-progress`, `.jo-stage-dot` (+ `.active`, `.completed`) → `.wm-progress`, `.wm-dot`
  - `.jo-stage-header`, `.jo-stage-label`, `.jo-stage-title`, `.jo-stage-prompt` → `.wm-header`, etc.
  - `.jo-scenes`, `.jo-scene-card` (+ `:hover`, `.selected`, `::after` checkmark) → `.wm-scenes`, `.wm-card`
  - `.jo-scene-image`, `.jo-scene-icon-fallback`, `.jo-scene-pill`, `.jo-scene-name`, `.jo-scene-desc` → `.wm-*`
  - Transition animations for stage navigation
  - Responsive breakpoints (480px, 600px height)

- **`src/data/woundStages.js`** — Extract the `WOUND_STAGES` constant (4 stages × 3 scenes, with `id`, `zone`, `name`, `description`, `archetype`, `color`, `icon`, `image`, `focalPoint` per scene). Importable by the new flow and any future summary/analytics surface.

### Files to modify

- **`src/components/level/LevelConfig.js`** — Add wound map to Level 0 `extraQuests`:
  ```js
  {
    id: 'wound_map',
    name: 'Map Your Origin Story',
    route: '/wound-map?returnTo=/7-day-challenge',
    narrative: 'What happened before you arrived here?',
    icon: '🗺️',
  }
  ```
  Remove `tension_assessment` quest from Level 0 `extraQuests`.

- **`src/AppRouter.jsx`** — Add route: `<Route path="/wound-map" element={<AuthGate><WoundMapFlow /></AuthGate>} />`. Remove `/tension-assessment` route.

- **`src/components/level/LevelTab.jsx`** — Three changes:
  1. Add `hasWoundMap` state + Supabase query: check if `journey_onboarding_selections` rows exist for this user (≥4 rows = complete). This matches the detection-based pattern used by all other Level 0 quests.
  2. Add wound map to the completion detection map: `q.id === 'wound_map' ? hasWoundMap`
  3. Remove `hasTensionScores` state, query, and completion check.
  4. **Note**: Level 0 auto-graduation fires when ALL quests are done. Adding wound map adds one more gate before graduating to Level 1.

### Files to deprecate (after new /get-started ships)

- **`JourneyOnboarding.jsx`**: Delete `WOUND_STAGES` constant, `storyStageIndex` + `stageSelections` state, `handleSceneSelect()`, `handleStoryBack()`, Beat 2 render branch (`BEATS.STORY`), and stage-selection payload in `handleSignUp()`. Leave all other beats (Hook, Reframe, Promise, Signup, Verify) for the /get-started rebuild to handle.
- **`JourneyOnboarding.css`**: Delete all `.jo-story*`, `.jo-stage-*`, `.jo-scene*` rules (~185 lines).
- **`src/lib/journeyOnboarding.js`** (`persistJourneyOnboarding`): Stop writing wound selections from localStorage. Direct DB writes happen in the new flow instead.

### Data flow

- **Table**: Continue using `journey_onboarding_selections` (same schema: `user_id`, `stage_id`, `scene_id`, `zone`, `archetype`). No table change needed.
- **Write path**: `WoundMapFlow.jsx` upserts 4 rows directly on completion (one per stage), using `onConflict: 'user_id,stage_id'`.
- **Read path (completion detection)**: `LevelTab.jsx` queries `journey_onboarding_selections` count for the user. 4 rows = complete.
- **No new columns on `user_level_progress`** — the wound map data stays in its own table, consistent with how other Level 0 quests use domain tables (not `user_level_progress`).

### UI changes

The current wound stages UI is 4 sequential stages with scene cards, auto-advance, and back navigation. This maps cleanly to the level deep dive pattern — `ZoneDiagnosisFlow.jsx` demonstrates multi-step in-route flows with local `step` state, transitions, and `returnTo` redirect. The wound flow needs:

- Same skeleton (step state machine + slide transitions)
- A closing "your pattern" reveal step summarising the dominant archetype
- Import `flow-base.css` for primary/secondary buttons
- No beat orchestration (parent flow handles that in onboarding; here it's standalone)

### Routing

- Path: `/wound-map` (accepts `?returnTo=` query param)
- LevelTab integration: `DeepDiveCard` / quest card reads `route` from config and renders as a link. Already works for extraQuests.
- `returnTo` default: `/7-day-challenge` (same as curiosity compass)

---

## Section 4: Tension Assessment Archive Plan

### What's being archived

The tension assessment (4 diagnostic questions mapping to Levels 1/2/4/7) is being removed from Level 0 and parked. It will return as a recalibration tool in the business/advanced-user module when that home is built.

### Already done (this session)

- `LevelConfig.js` — `tension_assessment` quest removed from Level 0 `extraQuests`
- `LevelTab.jsx` — `hasTensionScores` state + query removed, replaced with `hasWoundMap`
- `AppRouter.jsx` — `/tension-assessment` route replaced with `/wound-map`

### Still to do

| File | Change needed |
|---|---|
| `TensionAssessmentFlow.jsx` | Delete file (or move to archive/) |
| `TensionGate.jsx` | Delete file (or move to archive/) |
| `PriorityMiniAssessment.jsx` | Delete — recommendation engine removed, no longer used |
| `PriorityLayerCheckin.jsx` | Delete — recommendation engine removed, no longer used |
| `PriorityLayerCard.jsx` | Delete — recommendation engine removed, no longer used |
| `usePriorityTab.js` | Remove tension score imports and `computePriorityLayer()` calls |
| `MePage.jsx` | Remove `computePriorityLayer` / `TENSION_LAYER_DISPLAY` imports |
| `onboardingV2.js` | Remove `computePriorityLayer()` and `TENSION_LAYER_DISPLAY` exports |
| `HomeFirstTime.jsx` | Being archived with /get-started rebuild (separate workstream) |

**No fallback logic needed** — the recommendation engine that consumed tension scores has been removed. Users follow the levels directly.

**DB columns** (`user_stage_progress`): `tension_discover`, `tension_regulate`, `tension_reveal`, `tension_value`, `priority_layer`, `tension_gate_completed` — leave in place. No migration needed. Existing users keep their data.

**JSON files**: `tension-assessment.json`, `tension-assessment-v2.json` — keep in `public/` for future reactivation.

---

## Section 5: Open Questions

1. **Wound map ordering in Level 0**: Should wound map come before or after Curiosity Compass? Before = "understand what happened, then discover what you loved". After = "discover play first, then understand the wounding". Both work narratively. Before feels more like character creation; after feels more like "start with joy".

2. **Should wound map gate other Level 0 quests?** Using `lockedUntil: 'wound_map'` would force users to do it first. Or leave it ungated so users can complete Level 0 quests in any order. The current Level 0 only gates playlist_challenge behind curiosity_compass.

3. **Priority Tab without tension scores**: Defaulting to `'discover'` layer works but means all new users get the same recommendations until we build a replacement signal. Is that acceptable, or should we build an alternative signal (e.g. wound archetype → recommended layer) before archiving?

4. **Archetype summary reveal**: The wound map's closing screen should show the user's dominant nervous system pattern. What does this look like? Options: (a) simple text summary, (b) archetype card matching the Essence Mirror style, (c) visual showing all 4 selections on a timeline. This shapes the component's final step.

5. **Cross-level referencing**: If the wound archetype is set at Level 0, should zone diagnoses (Levels 1-8) reference it? e.g. "As someone with a dorsal pattern, your Ghost Boss at Level 2 may show up as withdrawal." High value but requires zone diagnosis copy to be archetype-aware — potentially large scope.

6. **Healing task dependency**: Level 0 currently has a `healing_task` quest with no completion tracking. Does archiving tension assessment affect the healing task's role, or are they independent?

---

## Section 6: Out of Scope

- The new `/get-started` play-skills onboarding flow (paste journal → AI extract → swipe deck → reveal → signup). Separate workstream.
- Any change to `LevelTab.jsx`'s overall structure, level selector, or progress bar logic.
- The Hook, Reframe, Promise, Signup, and Verify beats of `JourneyOnboarding.jsx`. Owned by the /get-started rebuild.
- Replacing or modifying Healing Compass, Nervous System, Limiting Belief Rewire, Shadow Work, or any other existing deep dive.
- Building the future home for the Tension Assessment in the business/advanced module.
- New analytics or personalisation surfaces driven by the wound archetype (Hero Profile cards, Zarlo prompts, etc.).
- Changes to the level progression system itself (how levels unlock, scoring, graduation logic).
- Redesigning Priority Tab recommendations to use a new signal instead of tension scores.
