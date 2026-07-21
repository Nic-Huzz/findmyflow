# Session Handoff: Dynamic State Lines + Skill Tagging (Jul 18-20 2026)

## What was done

### Dynamic State Lines (QuestPathMap)
- **Prototype** at `public/quest-path-dynamic-state-prototype.html` — compares static vs every-dot vs rolling-average (window=5) using exact component coordinates (420x900 viewBox). Uses Huzz's real wahoo classification data for Breathwork (7 challenges) + Dance/Vibe Rise (27 challenges). Includes merge lines between 3 quests.
- **Code started** in `src/components/level/QuestPathMap.jsx`:
  - New `wahooStates` data fetch — loads wahoo_classification from quest_completions.reflection_text for all courage challenges
  - Per-dot X positioning — each dot gets `stateX(wahooState)` instead of quest's fixed X
  - Dynamic polyline path rendering when wahoo data exists, falls back to vertical line otherwise
  - L0 fix was already applied (line 450 uses OV_BOTTOM)
- **DB backfill**: 36 challenges across Breathwork + Vibe Rise quests now have `wahoo_classification` in their quest_completions.reflection_text (mix of real user data and backfilled). "Seminyak Pop-up" renamed to "DJ'd Seminyak Pop-Up" in groan_challenges.
- **Decision**: Rolling average (Option B, window=5) beats every-dot zigzag at 20+ dots. Current code implements Option A (every dot). Rolling average smoothing NOT yet implemented in component.

### Task-Level Skill Tagging + Alignment Detection
- **Spec** at `docs/features/task-skill-tagging-alignment.md`
- **Migration**: `supabase/migrations/20260718200000_add_skill_tags_to_quest_tasks.sql` — adds `skill_tags text[]` to quest_tasks. Applied to prod.
- **Keyword classifier**: `classifyTaskSkills()` added to `src/lib/questSkillTagger.js` — expanded vocab with past tense, disco, comedy, improv, etc. 10-skill vocabulary matches wheel taxonomy + nikigai clusters.
- **Task tagging wired**: Both `QuestBoardCard.jsx` (regular tasks) and `WahooCreator.jsx` (courage challenges) auto-tag on creation. Regular tasks: keyword match only, no quest fallback. Courage challenges: keyword match → quest skill_tags fallback.
- **XP routing fixed**: `GroanCompletionModal.jsx` now uses task-level skill_tags for XP (falls back to quest tags). `QuestBoardCard.jsx` awards skill XP on regular task completion (only if keyword matched).
- **WahooCreator hint**: Subtitle added below input: `e.g. "Host a breathwork session at a retreat" or "Cold call 10 venue owners"`
- **Skill display on /mirror**: Enhanced from segment bars to XP progress cards (bar + task count + level name). Level names: Beginner → Testing → Practising → Charging → Mastery.
- **Skill pills on QuestBoardCard**: Quest skill_tags shown as purple pills in header.
- **Alignment detection**: New `src/hooks/useAlignment.js` hook — compares nikigai favourite skill clusters vs 30-day completed task skills. Card on /mirror with score bar, insight text, nikigai pills, task skill breakdown (green=match, gold=drift). Threshold: 5+ completed tasks with skill_tags.
- **QA sweep**: 5 bugs found and fixed (unhandled promise, XP inflation via quest fallback on regular tasks, hasDynamicX detection, .single() vs .maybeSingle(), replace('_',' ') missing /g flag).

## Decisions made

1. **Rolling average over zigzag** for QuestPathMap dynamic state lines. With 20+ dots per quest, zigzag is unreadable. Rolling avg (window=5) tells the macro story (admin dip, recovery). Ghost dots still show individual classifications.
2. **Same 10 skills everywhere** — wheel taxonomy, quest tagger, nikigai clusters, and now task tagger all use identical vocabulary: storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up.
3. **No quest fallback for regular task XP** — only courage challenges fall back to quest skill_tags. Prevents "update spreadsheet" on a performing quest from inflating performing XP.
4. **Keyword classifier for v1** — AI classifier deferred. Keyword match handles regular to-dos well (literal text). Courage challenges use quest fallback when keywords miss. 37% keyword match rate on courage challenges is acceptable because the fallback covers the rest.
5. **L0-L4 level names will change** — user flagged that L0-L4 conflicts with depth levels. Currently using Beginner/Testing/Practising/Charging/Mastery but user wants to revisit naming later.
6. **/mirror as skill + alignment home** — not Journey tab, not /me. Fits the existing "Clarity home" concept.
7. **Dropped Fear Challenges** from prototype data — legacy data from 2 years ago, not representative of how new users create courage challenges.
8. **Experience type categories dropped** — original spec had performing/marketing/outreach/admin categories. Replaced by the existing 10-skill system which covers the same ground without inventing new taxonomy.

## In progress / next steps

### Not yet implemented
1. **Rolling average algorithm in QuestPathMap.jsx** — current code renders Option A (every dot at its wahoo X). Need to add window=5 smoothing to the `pathPoints` computation. The prototype HTML has the correct math; the component needs to match.
2. **Existing task backfill** — `classifyTaskSkills()` is wired for new tasks but existing quest_tasks don't have skill_tags yet. Need a one-time SQL script to run the keyword classifier on existing task text and populate skill_tags.
3. **Skill level picker modal** — state exists in LevelTab.jsx but the UI component never renders. Needs wiring.
4. **Milestone celebrations** — `celebrateLevelUp()` exists but isn't called when XP crosses a level threshold in `awardSkillXP()`.

### Edge function not deployed
- `classify-quest-skills` edge function was NOT modified. The keyword classifier is client-side only.

## Gotchas discovered

1. **quest_completions.reflection_text is not always JSON** — some old records contain plain text like "Completed". Any parsing must handle this with try/catch. The wahooStates fetch in QuestPathMap already does this.
2. **Backdated challenges (May 15 batch)** all share the same `completed_at` timestamp. Chronological sorting within depth bands works but produces arbitrary ordering within that batch.
3. **Dance Event Hosts quest has zero quest_tasks** — all dance challenges live under the "Vibe Rise" quest with `source_label: "Dance Event Hosts for 1000s of people"`. The Dance quest exists but is empty.
4. **`hasDynamicX` detection** — originally checked `p.x !== x` which fails when all wahoo states match the predicted state. Fixed to check `p.state != null`.
5. **Keyword classifier misclassifies "Taught myself X" as teaching** — "taught" matches the teaching regex but the user was learning. The expanded regex includes "taught" intentionally because most users will write "taught a workshop" not "taught myself". Edge case documented.

## Recommendations

1. **Implement rolling average in QuestPathMap** — the prototype proves it works. Add a `computeRollingAverage(pathPoints, window=5)` function that maps state values (shutdown=1, anxious=2, peace=3, vibe=4) to X via linear interpolation between state centers. ~30 min.
2. **Backfill existing tasks** — run `classifyTaskSkills()` on all existing quest_tasks via a Node script or SQL function. This populates the skill_tags needed for alignment detection to have enough data.
3. **Test on dev server** — the /mirror skill section and alignment card have not been visually verified. Run `npm run dev` and check `/mirror` with Huzz's account.
4. **Consider AI classifier for courage challenges** — the keyword classifier gets 37% on courage challenges. Quest fallback covers the gap but is imprecise. A lightweight Haiku call per courage challenge (~$0.001) would tag correctly. Not urgent but would improve XP accuracy.
5. **Rename skill levels** — user flagged L0-L4 conflicts with depth levels. Consider: Novice → Explorer → Practitioner → Expert → Master, or similar.
