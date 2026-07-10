# PLAN: Ship the Quest Path Map (Life Path Progress Visualization)

**Rank: #1 — highest leverage.** The feature is ~95% built and sitting uncommitted on `main`. It is the visual anchor of the Quests tab (the core retention surface). Finishing it is mostly verification + migration + commit, not new code.

## Goal

Get the Life Path Progress Map live in production: quest paths rendered as SVG with three line states (coloured = courage done + safe, grey = done but not safe, dashed = not done), swipeable overview/focus slides, and the global cone of safety. Full spec: `docs/features/life-path-progress-implementation-plan.md`.

## Current state (verified 2026-07-08)

- `src/components/level/QuestPathMap.jsx` (574 lines) + `QuestPathMap.css` — **built, untracked**
- `src/components/GroanCompletionModal.jsx` — sets `safety_status` at ~line 178 (**uncommitted diff, +66 lines**)
- `src/components/QuestBoardCard.jsx` — intercepts courage completion, clears `safety_status` on un-check at ~line 146 (**uncommitted, +36**)
- `src/components/level/LevelTab.jsx` — imports QuestPathMap ~line 476, modal trigger ~line 796 (**uncommitted, +56**)
- `supabase/migrations/20260708000002_add_quest_task_safety_status.sql` — **written but NOT applied**

## Steps (in order)

1. **Apply the migration first.** `npm run db:push` (or Supabase MCP `apply_migration`). Verify with `select safety_status from quest_tasks limit 1`. The code writes `safety_status` — if the column doesn't exist in prod before the code deploys, every courage completion update fails silently (it's wrapped in try/catch with only a console.warn).
2. **Verify Phase 2A gating** in `LevelTab.jsx` against the plan doc: the `life_path_sessions` query should require `.eq('step', 'complete')` and select `current_state, safety, careers`. If missing, add per plan doc §2A. Existing users with quests but no life paths get a soft prompt, NOT a hard gate.
3. **Manual QA on `npm run dev`:**
   - User with completed life paths + quests: "Your Life Paths" button appears between Your Journey and Active Quests; modal opens; slide 0 shows all paths + cone; swipe to focus slides; dot indicators sync.
   - Complete a courage task from QuestBoardCard → GroanCompletionModal opens (NOT direct toggle) → after "How did that feel?" + expectation check, `quest_tasks.safety_status` is set (`safe` only when classification is vibe/peace AND expectation better/expected).
   - Un-check that task → `safety_status` returns to null and `done` false.
   - User with NO completed life paths: no button, no crash; zero-quest users see the locked card.
4. **Commit and deploy.** Verify you are on `main` intentionally and only stage the quest-path-map files: `QuestPathMap.jsx`, `QuestPathMap.css`, `GroanCompletionModal.jsx`, `QuestBoardCard.jsx`, `LevelTab.jsx`, `LevelTab.css`, the migration, `LifePathMap.jsx/css`, `TryLifePaths.jsx`, and the two docs in `docs/features/`. Do NOT sweep in the unrelated CRM/email/pipeline diffs (`ContentGenerator.jsx`, `EmailSequences.jsx`, `experienceTemplates.js`, `promptTemplates.js`, `ContentIntel.jsx`, `useExperiencePipeline.js`, `pipelineConfig.js`, `MetricInputSheet.jsx`, `analyze-instagram-post`, `AndroidManifest.xml`, `CLAUDE.md`) — those belong to other plans.

## Edge cases a weaker model would miss

- **Migration ordering** (step 1 above): deploy order is column → code, never the reverse.
- **`getPointAtLength()` needs a rendered path.** The hidden reference `<path>` must be in the DOM before the useEffect measures it. If milestones render at (0,0) on first paint, the effect deps are wrong — it must re-run when `quest.id`/`questTasks` change AND after ref attach.
- **Bezier `t` ≠ arc length.** Do not "simplify" to De Casteljau point-at-t. The plan doc explicitly chose `getPointAtLength()` (Resolved Decision #4).
- **Regular (non-courage) done tasks advance the grey line but never the coloured line** (Resolved Decision #2). A quest of 10 regular tasks = full grey, zero colour. That's intentional, not a bug.
- **GroanCompletionModal already syncs `quest_tasks.done`** — QuestBoardCard's toggle must `return` early for courage completions or the update happens twice.
- **Quests with 1 task:** milestone fraction is `0.5`, not `0/0` NaN.
- **iOS Safari scroll-snap:** test swipe on a real device or responsive mode; `scroll-snap-type: x mandatory` plus the app's `overscroll-behavior` fixes can conflict.
- **CSS scoping:** all new CSS must be scoped under the QuestPathMap root class (project convention).

## Acceptance criteria

- [ ] Migration applied; `quest_tasks.safety_status` exists in prod
- [ ] Courage completion via QuestBoardCard routes through GroanCompletionModal and persists correct `safety_status`
- [ ] Un-checking clears `safety_status`
- [ ] Path map renders 3 line states + cone; swipe works; no console errors
- [ ] Users without completed life paths see prompt/locked card, never a crash
- [ ] Committed to main with ONLY the related files; deployed; works on viberise.nichuzz.com
