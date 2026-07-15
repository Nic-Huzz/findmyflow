# Session Handoff: Curiosity Ecosystem + Quest Map (Jul 10-12, 2026)

## What was done

### New flows built
- **Curiosity Map** (`src/flows/CuriosityMapFlow.jsx`, `/curiosity-map`) — 4 intro slides (ancient wisdom → curiosities as compass) → content inputs with gamified milestones (3/5/10) → optional episode drill-down → two-step AI clustering (research titles first, then cluster with "I feel seen" naming) → collapsible results. Image upload via Claude Vision for bookshelf/Goodreads screenshots. CSS: `src/flows/CuriosityMapFlow.css`.
- **Career Alignment** (`src/flows/CareerAlignmentFlow.jsx`, `/career-alignment`) — pulls curiosity clusters → career input (job title + 3-5 weekly experiences) → per-cluster "does your work feed this?" Y/N → NS state check (4 states) → alignment score with belief shift message + intent capture. Reuses `CuriosityMapFlow.css`.

### New components
- **BackdatePanel** (`src/components/level/BackdatePanel.jsx`) — "Add pre-app progress to the line?" button → AI-suggested milestones as tappable chips → per-chip month/year picker → saves as `quest_tasks` with `done:true, backdated:true, backdated_date`. Renders inside FocusFooter in QuestPathMap.

### New pages
- **QuestMapPage** (`src/pages/QuestMapPage.jsx`, `/quest-map`) — standalone page for QuestPathMap. Fetches own data (quests, quest_tasks, life_path_sessions). Replaces the popup overlay that was in LevelTab.

### Modified files
- **LevelTab.jsx** — Added `hasCuriosityMap`, `hasCareerAlignment` states + DB checks. Reordered "Your Journey": Curiosity Map → Life Map → Life Paths (sequential locking). Career Alignment added to "What career path is best?" struggle section. "Your Life Paths" button now navigates to `/quest-map` instead of opening popup. Popup rendering removed. Unused import/state cleaned.
- **LifeMapFlow.jsx** — Added curiosity cluster context cards on Young Adult ("Did any of these exist back then?"), Career ("Did your work give you space for these?"), and Now + Future (full cluster list) periods. Fetches `curiosity_clusters` in useEffect.
- **LifeMapFlow.css** — Added `.lm-curiosity-context`, `.lm-curiosity-context-gold`, `.lm-curiosity-cluster-item` styles.
- **LifePathWidgetTest.jsx** — Added SUGGESTIONS step (AI-suggested paths from curiosity + life map data). Added COURAGE_TAG step (tap tasks to flag as courage challenges). Refactored `saveWahoosToGroan` to only create `groan_challenges` for courage-flagged items. Renamed WAHOOS prompt. Added `isCourage: false` to step creation.
- **QuestPathMap.jsx** — Import BackdatePanel. Date positioning uses `backdated_date || created_at` in all 5 places (OverviewSVG + FocusSVG). BackdatePanel rendered at bottom of FocusFooter.
- **AppRouter.jsx** — Added routes: `/curiosity-map`, `/career-alignment`, `/quest-map`. Added lazy imports for CuriosityMapFlow, CareerAlignmentFlow, QuestMapPage.

### Edge functions (all deployed)
- `classify-curiosities` — two-step: research each title → cluster with "I feel seen" naming. Haiku.
- `extract-curiosities-from-image` — Claude Vision reads bookshelf/Goodreads/podcast screenshots → returns titles.
- `suggest-life-paths` — combines curiosity_clusters + nikigai_clusters (skills/problems) → 5-7 named career paths.
- `suggest-milestones` — takes path name → returns 5-8 common milestones for backdating.

### DB migrations applied
- `curiosity_inputs` table (user_id, title, type)
- `curiosity_clusters` table (user_id, cluster_name, branch, description, why, titles, input_count, capacity_level)
- `career_alignments` table (user_id, email, career_title, alive_score, alignment_score, clusters jsonb)
- `quest_tasks` columns: `backdated` (boolean), `backdated_date` (date)
- `scale_diagnostics` columns: score_ancestral, score_format, score_irreplaceable, score_alignment, score_mismatch, score_market, score_rulebreak, branch, total_score, phase_classification
- `narrative_builders` columns: vehicle_type, vehicle_desc

### Obsidian notes created/updated (never overwritten)
- `Product/Curiosity Map Feature.md` — full spec with pipeline ordering, visualization ideas, career alignment refinements
- `Product/Vibe Rise Sessions.md` — session format, fitness×wellness×ambition gap, app bridge
- `Product/Vibe Rise Ecosystem Vision.md` — 3-product stack, AI/human split, macro thesis
- `Insights/The Two Enemies.md` — self-help (clarity trap) + education (specialise trap)
- `Insights/Format Change Is The Rule Break.md` — evolution section added
- `Insights/Five Meta-Patterns From The Tree.md`
- `Thought Notes/Purpose to Experiences Evolution.md`
- `Frameworks/Rule Break Ingredients Framework.md`
- `Frameworks/Phase 3 Modality Map.md` — all 10 branches, 132 cells, digital-as-bridge insight
- `Frameworks/Capacity Spectrum Per Branch.md` + Movement + Healing + Nourishment + Remaining
- `Frameworks/FindMyFlow x Category Pirates.md` — copied with frontmatter
- `Frameworks/MasterMind Branch Prescriptions.md` — 6 features
- Multiple framework notes updated with v2 diagnostic, market size insight, format change connection

## Decisions made

1. **Curiosity Map before Life Map.** Light to heavy. Present to past to future. Curiosity data feeds context cards into Life Map. Life Map stays unchanged — just richer inputs.

2. **Career Alignment is a LENS on curiosity data, not a separate feature.** Curiosity Map is the feature. Career Alignment is one view of that data. Other views: experience discovery, cone overlay, merge detection.

3. **Three products, three categories.** Vibe Rise Sessions (CrossFit), Vibe Rise App (Strava), Creator Portal (CRM). Each has own audience and revenue model.

4. **Two enemies.** Self-help (clarity trap) + Education (specialise trap). Bottleneck is safety, not knowledge.

5. **Quest Map gets its own route.** `/quest-map` replaces the popup overlay. Full screen, room for backdate features, proper back button.

6. **Tasks default to to-dos, not courage challenges.** COURAGE_TAG screen is a separate pass: "Which of these scare you?" Courage-flagged items create groan_challenges. Others are quest_tasks only.

7. **Backdated tasks use `backdated_date` for map positioning.** All 5 date references in QuestPathMap use `task.backdated_date || task.created_at`. Backdated tasks don't award RP (direct insert bypasses toggleTask).

8. **Sequential locking in Your Journey.** Curiosity Map → Life Map → Life Paths. Each locked until previous completes. All visible so user sees the full path.

## In progress / next steps

1. **FocusSVG vertical flip** — individual path slides in QuestPathMap render horizontally. Need to flip to vertical matching OverviewSVG. Handoff prompt written for other agent. See `docs/handoff-life-path-map-flip.md`.

2. **Life Paths visual map update** — the `/life-paths` flow (LifePathWidgetTest.jsx) now has a `VerticalLifePathMap` component but the visual needs polish. Other agent is working on this.

3. **AI life path suggestions need testing** — the SUGGESTIONS step in Life Paths calls `suggest-life-paths` edge function. Needs real-world testing to validate suggestion quality.

4. **Backdate panel needs testing** — `suggest-milestones` edge function deployed but untested with real data.

5. **Public lead magnets not built** — `/try/career-alignment` (public version of Career Alignment) and `/try/curiosity-map` (public Curiosity Map) are specced but not coded. Logged-in versions come first.

6. **Life Paths → Quests data flow** — AI-suggested paths from curiosity + life map data are added as careers in the Life Paths flow, then saved as quests at COMPLETE. This full chain needs end-to-end testing.

## Gotchas discovered

1. **Other agent overwrites.** Commits on `light-portal` by other agents can overwrite changes if they commit full files. Our commit `ee96a96` (LevelTab) survived. The COURAGE_TAG changes in LifePathWidgetTest had to be re-applied after another agent's commit. Always verify changes persist after other agents commit.

2. **`classify-curiosities` is two API calls.** Step 1 researches titles, step 2 clusters. Takes 8-12 seconds. Processing text updates at 2s, 5s, 8s intervals. Timeouts are cleared on completion.

3. **Image upload needs compression.** Uses `compressImage()` from `src/lib/screenshotAnalysis.js` (max 1600px, 0.75 quality JPEG) before base64 encoding to avoid edge function size limits.

4. **`quest_tasks.backdated_date` is `date` type, not `timestamptz`.** Stores as `YYYY-MM-01` since we only collect month/year precision.

5. **LevelTab now imports `useNavigate`.** This was added for the `/quest-map` navigation. Previous pattern used DeepDiveCard's `route` prop for navigation.

6. **All 6 commits on `light-portal` haven't been pushed to main yet.** Nothing is deployed to Vercel.

## Recommendations

1. **Test the full user journey end-to-end.** Curiosity Map → Career Alignment → Life Map (with context cards) → Life Paths (with AI suggestions + courage tag) → Quest Map (with backdate). This is the first time all pieces connect.

2. **Merge `light-portal` to main when ready.** 6 commits ahead, 0 behind. Clean merge. But test first.

3. **Build the Career Alignment public lead magnet next.** `/try/career-alignment` is the most shareable diagnostic in the product. "My career alignment: 15%. No wonder Tuesdays feel empty." Needs content inputs step since no curiosity data exists for public users.

4. **Run the first Vibe Rise Session IRL.** Format designed, host deck built, everything in the app supports it. The next step is 15 people in a room.
