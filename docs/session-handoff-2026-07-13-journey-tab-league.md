# Session Handoff: Journey Tab + League Scoring (2026-07-13)

## What was done

### Tab Restructure (shipped)
- Tabs reordered: Journey / Quests / Tune / Courage. Default = Tune.
- Healing tab removed, merged into Courage. All `?tab=healing` URLs redirect to Courage.
- Dead state vars removed (`activeRTypeFilter`, `activeFrequencyFilter`), "Healing Tab" labels → "Courage Tab".
- Files: `useChallengeData.js`, `Challenge.jsx`, `LevelTab.jsx`, `ZarloChat.jsx`, `zarloPageContent.js`, `ShadowWorkFlow.jsx`, `HealingCompass.jsx`

### WahooCreator Cleanup (shipped)
- New flow: free text → quest link (compulsory) → depth L0-L4 → visibility multi-select → submit.
- Categories (Appearance/Creation/Connection) archived.
- `depth_level` + `visibility_layers` columns added to `groan_challenges` (migration applied).
- `groanChallengeService.js` updated with new params.
- PlayListTab: category bubbles removed, bucket list fetch refactored.
- Files: `WahooCreator.jsx`, `WahooCreator.css`, `groanChallengeService.js`, `PlayListTab.jsx`

### Courage Tab Healing Merge (shipped)
- Inline healing intentions on wahoo cards (green cards with pattern/voice/origin).
- "What's blocking you?" standalone input with QuestSelector → HealingFlowModal.
- Files: `PlayListTab.jsx`, `Challenge.css`

### Journey Tab (shipped)
- **JourneyTimeline** sub-component: completed stages with dates + checkmarks, gradient connector, pulse on current. Collapsible via "Your Hero's Journey ▾" button.
- **Stage card**: unified with movie references ("Think: Mulan training with the army"), next step, voice progress dots (merged, no duplication). Purple→gold gradient top border.
- **Life paths summary**: coloured left borders per NS state, depth badges, "View Flow Map" button opens QuestPathMap with real data.
- **JourneyOnboarding**: moved from Quests tab. Sequential locking (Curiosity Map → Life Map → Life Paths → Hero Avatar).
- **JourneyZones**: moved from Quests tab. Horizontal scroll strip + modal with SweetSpotGraph.
- **JourneyCompleted**: moved from Quests tab. Compact checkmark rows.
- **OrphanWahooLinker**: bottom sheet popup for linking orphaned wahoos to quests. Tap wahoo → QuestSelector → creates quest_task.
- **Design polish**: state-based tinting on life paths, timeline checkmarks, gold "Next step" box.
- Files: `JourneyTab.jsx`, `JourneyTab.css`, `src/components/journey/` (6 new files), `LevelTab.jsx` (sections removed)

### Hero Stage Checker (shipped)
- All gates 2→7 match confirmed spec:
  - 2→3: `life_path_sessions` exists (was: active quest)
  - 3→4: essence mirror + `hero_avatar_url` (was: essence_archetype which doesn't exist)
  - 4→5: first Vibe Rise wahoo (unchanged)
  - 5→6: life path at `predicted_state='vibe'` + `depth_level IN ('charging','teaching')` (was: 2+ wahoos)
  - 6→7: protective voice 5x from BOTH `nervous_system_checkins` AND `healing_intentions` (was: NS only)
- `protective_voice` column added to `healing_intentions` (migration applied, backfilled from `pattern` field).
- `depth_level` column added to `quests` (migration applied). Auto-bumped from WahooCreator on wahoo creation.
- Backfill edge function deployed + run. All 61 users backdated.
- Fixed: broken column refs (`essence_archetype`/`essence_name` → `hero_avatar_url`/`persona`).
- Stage names updated to Campbell originals everywhere (Ordinary World, Call to Adventure, etc).
- Files: `heroStageChecker.js`, `backfill-hero-stages/index.ts`, `WahooCreator.jsx`, `JourneyTab.jsx`

### Zarlo Voice Fix (shipped)
- `ZarloWidget.jsx` and `zarloEngine.js` now query BOTH tables for protective voice data (was: NS checkins only).

### Octalysis Agent Audit (done)
- Reviewed all Octalysis agent changes against confirmed spec. Only issue found: Zarlo voice counting (fixed above). Everything else aligned.

### Courage Tab Mockup
- `public/mockups/courage-tab-merged.html` — HTML mockup (reference only, not shipped to app).

## Decisions made

### Hero Stage Names — Campbell originals
All user-facing stage names use Campbell's hero's journey: Ordinary World, Call to Adventure, Refusal of the Call, Meeting the Mentor, Crossing the Threshold, Tests Allies Enemies, Approach to the Inmost Cave, The Ordeal, Reward, The Road Back.

### Movie References per Stage
Each stage shows 3 "Think:" references: pre-2012 Disney, superhero, classic. Target audience 25+.

### L0-L4 Depth on Quests
`depth_level` on quests auto-bumps from wahoo depth (high watermark pattern). Used by 5→6 gate.

### Two Characters — Figurine + Zarlo
Figurine = rare, stage transitions, Journey tab. Zarlo = daily, reactive, Courage/Tune. Confirmed by both our session and Octalysis agent.

### League Scoring — Tune + Courage + Reach
Replaces old Tune + Wahoos + Healing. Healing merged into Courage. New "Reach" category from content submissions. Win 2 of 3. Full spec at `docs/features/league-reach-category-spec.md`.

### Orphan Wahoo Linking
One-off popup component for existing users. New users always link at wahoo creation (compulsory quest selector).

## In progress / next steps

### 1. League Reach Scoring (PRIORITY)
Implementation plan at `docs/superpowers/plans/2026-07-13-league-reach-scoring.md`. 4 tasks but plan needs rewrite — rated 80% confidence. Issues:
- Task 4 didn't verify which Challenge.jsx variables exist for passing to PlayListTab
- Accountability Post (multi-select from quest tasks) is a new feature not in ContentChallenges.jsx
- Comment & Engage auto-detection not specified (current implementation is manual player picker)
- `content_type` key renames break existing `league_content_submissions` rows
- Reach shows 0 until auto-scorer runs (bad UX)
- `crossPostToFeed` implementation uses odd dynamic import

**Recommendation:** Rewrite the plan fresh next session. The spec doc (`league-reach-category-spec.md`) is solid. The implementation plan needs the 6 issues above resolved.

### 2. Scary Score Cleanup
Plan ready at `docs/superpowers/plans/2026-07-12-scary-score-cleanup.md`. Self-contained, can run independently. Removes dead `scary_score`/`wahoo_score` references across 8 files. Does NOT drop DB columns.

### 3. Wahoo → Courage Language Rename
User-facing copy should say "courage challenge" not "wahoo." Internal code stays. Not yet implemented.

### 4. Courage Tab Healing Merge Review
The inline healing on wahoo cards uses FK join `healing_intentions!quest_task_id` — untested at runtime. May return empty if Supabase names the FK differently. Degrades gracefully (no crash, just no healing shown).

### 5. Flow Statement UX Design
Stage 9 reward. Raw one-sentence discovery. AI surfaces merge, user names. Design confirmed but no component built. See `docs/features/measurement-framework-exploration.md` section on Flow Statement.

### 6. Figurine/Mentor Design
Agent prompt ready in `docs/features/measurement-framework-exploration.md` section 7. Dedicated session needed.

## Gotchas discovered

1. **`heroStageChecker` only advances ONE stage per page load.** Users who should jump 4 stages need 4 page loads. The backfill edge function handles bulk advancement but the client-side checker is intentionally conservative.

2. **`life_path_sessions` uses `client_email` not `user_id`.** Every query against this table needs the user's email from `supabase.auth.getUser()`. Multiple components now do this independently (heroStageChecker, JourneyTimeline, JourneyOnboarding, JourneyTab).

3. **`useState` after early return breaks React.** We hit this with `showTimeline` in JourneyTab. All `useState` must be declared before any `if (loading) return` guard.

4. **ContentChallenges.jsx is archived but intact.** It's imported nowhere but the file exists with full functionality. Ready to reactivate for the Reach section.

5. **Renaming `CONTENT_POINT_VALUES` keys breaks existing DB rows.** `playlist_proof` → `courage_proof` and `offer_in_wild` → `flow_in_wild` would orphan existing `league_content_submissions.content_type` values. Need a migration or keep old keys.

6. **Other agent's code has bugs we flagged but didn't fix:**
   - `QuestPathMap.jsx` cross-pollination filter reads missing `groan_challenge_id` column
   - `CEODashboard.css` + `CuriosityMapFlow.css` use dark backgrounds (violate light theme)

## Recommendations

1. **Rewrite the league plan first.** The 6 issues above need resolving before execution. Especially: Accountability Post is a new feature, Comment & Engage needs rethinking, and content_type key renames need a migration strategy.

2. **Run the scary score cleanup.** Quick win, independent, reduces dead code.

3. **Test the courage tab in browser.** The healing inline + "What's blocking you?" input + new wahoo creation flow all need runtime verification.

4. **Don't deploy to production yet.** 60+ commits on `light-portal`. Needs thorough runtime testing before merging to main.

5. **The workshop beats doc is ready to test live.** `docs/features/hero-journey-workshop-beats.md` — run the 2-hour structure at your next Bali session.
