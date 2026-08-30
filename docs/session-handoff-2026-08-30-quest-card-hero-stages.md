# Session Handoff: Quest Card Redesign + Hero Stage Triggers (Aug 29-30 2026)

## What was done

### QuestBoardCard Option A redesign (full rewrite)
- `src/components/QuestBoardCard.jsx` — 729→~400 lines. White card, 20px radius, collapsible experience sections, dimension pills (purple craft / gold scale) fetched from `groan_challenges.expansion_dimensions`.
- `src/components/QuestBoardCard.css` — rewritten to match `public/mockups/quest-card-redesign.html` Option A.
- Removed: add experience form, color picker, timeframe picker, courage checkbox, assign tasks, map unmapped modal, `QUEST_COLOURS` constant.
- Added: `collapsedExps` state (Set), `challengeDims` fetch, three-dot menu for close quest, Escape key dismiss on task input.
- "Feeling stuck?" moved from always-visible per-task link → tapping ⚡ icon opens healing flow directly + single "Feeling stuck with a challenge?" hint below add buttons.
- Fixed `totalCount` bug (was undefined, now `tasks.length`).

### WahooCreator dimension subtitles
- `src/components/WahooCreator.jsx` — added `sub` field to `EXPANSION_DIMENSIONS` with plain-English explainers (e.g. "Doing it for longer", "More people watching or involved").
- `src/components/WahooCreator.css` — new `.wc-dim-text`, `.wc-dim-sub` styles.

### WeeklyFocus polish
- `src/components/level/WeeklyFocus.jsx` — after completing, shows "Pick another" button instead of "Done this week" lock. Users can immediately pick another courage challenge. Monday reset still works via localStorage key rotation.
- `src/components/level/WeeklyFocus.css` — brand-aligned: 20px radius, subtle shadow, gold completion tint, purple→gold gradient CTA, gold counter number.

### LevelTab cleanup
- `src/components/level/LevelTab.jsx` — "I need help with..." struggle pills section commented out (code preserved).

### QuestPathMap: chronological + color picker
- `src/components/level/QuestPathMap.jsx`:
  - Overview SVG: Y-axis changed from L1-L5 depth bands to chronological (earliest at bottom, recent at top).
  - Removed `depth_level` filter: ALL courage challenges now appear (was `.filter(t => t.is_courage_challenge && t.depth_level)`).
  - Added `QuestColourPicker` component on focus slides — saves to `quests.color` in DB, syncs to overview map.
  - `FocusSVG` now uses passed `colour` prop (was using `SAFE_COLOURS[quest.predicted_state]`).
  - Removed dead code: `DEPTH_LEVELS`, `DEPTH_ORDER`, `depthY`, merge depth fetch.
  - `mostAdvancedId` changed from highest depth to most courage challenges.
- `src/components/level/QuestPathMap.css` — new `.qpm-colour-picker`, `.qpm-colour-dot`, `.qpm-colour-swatch` styles.

### Hero stage triggers 2-9
- `src/lib/heroStageChecker.js` — full rewrite. New triggers aligned with Phase 1→2→3 journey:
  - 2: First NS check-in (kept)
  - 3: Dome completed (10+ ticks). Was: Life Paths exercise.
  - 4: Essence Mirror + avatar (kept)
  - 5: Choose Quests (1+ quest). Was: first Vibe Rise wahoo.
  - 6: 5+ courage completed. Was: Vibe Rise + depth L3/L4 (**removed depth_level dependency**).
  - 7: First healing flow started. Was: 5+ protective voices.
  - 8: 3+ healing outcomes + 20+ courage. Was: session with Nic.
  - 9: Scale Portal started (remarkable_angles or scale_diagnostics).
  - 10-12: Deferred (need income tracking).

### Progress tab polish
- `src/components/ProgressTab.jsx` — `HERO_STAGES` array updated: each stage has `nextTitle` (bold headline) + `nextHow` (gray explainer) + `route` (tappable "Go ›" link).
- `src/components/ProgressTab.css` — brand-aligned: gradient accent at top, gold refs block with left border, purple→gold gradient stat numbers, tappable next step card.

### Docs
- `docs/features/experience-dome-full-system-reference.md` — added Hero Journey Stages section (trigger table, financial freedom progression, income tracking design, 10 pending work items).

## Decisions made

1. **L1-L5 depth system removed from visuals** but data still exists in DB. `heroStageChecker` no longer uses it. `QuestMapPage` still fetches it (dead query, flagged for cleanup).
2. **Healing flow completion = "outcome" field filled**, not just "started". 59/60 of user's healing_intentions are pre-seeded pattern-only rows from WahooCreator voice selection, not real completions.
3. **Stages 10-12 deferred** until income tracking is built. Users cap at Stage 9. Design spec for income tracking in the docs.
4. **Stage 8 trigger kept at 3+ healing outcomes** despite user only having 1. It's the Ordeal — should be earned.
5. **Quest colors set per-quest in DB** (`quests.color`), changeable from Quest Map focus slides. QuestBoardCard color picker removed intentionally.
6. **"Feeling stuck?" link removed from per-task display** to reduce clutter. Access via ⚡ icon tap + single hint below add buttons.

## In progress / next steps

Nothing is mid-implementation. All changes committed and pushed to `feature/phase2-restructure`.

The branch has NOT been merged to main. It contains the full Phase 2 restructure (this session + previous agent's work on ExperienceGameFlow, DomeRadar, DiscoverTab, ChooseQuestsFlow).

## Gotchas discovered

1. **59/60 healing_intentions are pre-seeded**, not real completions. Only rows with `fear_text IS NOT NULL` represent actual healing flow engagement. The `outcome` field is only set after the COURAGE CHALLENGE is completed AND the user answers the outcome question.
2. **Quest order in QuestPathMap is non-deterministic** — `QuestMapPage` fetches quests without `ORDER BY`. Color assignment from `QUEST_COLOURS` fallback array depends on query order. Setting `quest.color` in DB is the reliable solution.
3. **Hero stage checker advances ONE stage per Challenge.jsx mount**. A user at Stage 7 who qualifies for Stage 9 needs 2 page loads. Flagged for catch-up mode.
4. **`experience_checkins` count for Stage 3 trigger** — user only has 2 ticks. The Experience Dome was rewritten this session. Verify the new dome flow creates `experience_checkins` rows correctly.
5. **`wc-modal-*` CSS classes** are shared across 4 components (QuestBoardCard, WeeklyFocus, PlayListTab, WahooDiscoveryFlow). Not scoped under `.qbc-` — intentionally global.

## Recommendations

1. **Start Phase 3 with a fresh agent.** This session touched 15+ files. Context is compressed.
2. **Verify dome tick count** — Stage 3 trigger needs 10+ rows in `experience_checkins`. Check the new dome flow creates them.
3. **Add `?tab=Quests` deep-link support** to `Challenge.jsx` so Progress tab "Go ›" links land on the right tab.
4. **Consider hero stage catch-up loop** — advance multiple stages per mount instead of one.
5. **The 1/60 healing flow completion rate** is a product signal. Either the flow is too long (7 steps), the entry point isn't visible enough, or users don't know they need to complete the challenge first to trigger the outcome question.
