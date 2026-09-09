# Session Handoff: Dimension Reframe + Onboarding UX (2026-09-09)

## What was done

### Dimension system reframe (comfort zone growth model)
All 8 dome dimensions now measure comfort zone expansion consistently. Four dimensions had structural issues (levels inverted or plateau'd early) and were rewritten:

- **Rarity**: "How much did you stand out?" — Not at all → A bit unusual → Noticeably different → Very rare → I might be the only one
- **Identity**: "How different was this from who you used to be?" — Same old me → A small shift → People would be surprised → I barely recognize myself → Old me wouldn't believe this
- **Vulnerability**: "How visible were you?" — Not visible yet → Behind the scenes → Face on screen → Face in person → Nothing to hide behind
- **Context**: "How far outside your comfort zone were the conditions?" — Not at all → One new thing → Half and half → Mostly unfamiliar → Everything was new

Each dimension has context-specific questions (Start, Dream, Courage) with labels that work as natural answers to all three.

Files updated: `src/data/domeDimensions.js`, `src/lib/currentJobChallenges.js`, `src/flows/CurrentJobFlow.jsx`, `src/flows/PathDefinitionFlow.jsx`, `src/components/WahooCreator.jsx`, `docs/features/dome-of-safety-spec.md`, Obsidian `Frameworks/Dome of Safety.md`

### Stage name unification
All hero stage names now use ProgressTab language (simple, 12-year-old readable) instead of Campbell's Hero's Journey terminology. Updated across 4 files: `src/lib/heroStageChecker.js`, `src/hooks/useCelebrations.js`, `src/components/JourneyTab.jsx`, `src/components/journey/JourneyTimeline.jsx`

### Stage celebration pop-ups
- Added missing celebrations for stages 7→8 through 10→11 (previously only 0→7 existed)
- Added missing `"1-2"` celebration key (stage 1→2 was silently skipped)
- Redesigned graduation modal: avatar with glowing ring, 12 progress dots, staggered reveal animation, gold accent
- Preview at `public/graduation-preview.html`

### Onboarding copy rewrites (Hopkins method)
- Landing slides (PlaySkillsOnboarding): rewritten from brand manifesto to mechanism-first ("What if finding your Ikigai was a game?")
- Challenge intro (ChallengeIntro): cut from 5 slides to 3, orient-then-go
- Experience Game intro: "On the next screen, tick experiences you've tried or love"
- PortalExplainer: moved from blocking modal to dismissible inline card on Discover tab

### /me page + Discover tab
- Replaced Vibe Rise Score (CapacityCard) with StageCard on /me page
- Default tab changed from Tune → Discover for new users
- Discovery tab shows ✅ ticks on completed flows (Essence, Experience Dome, Current Job)
- Bridge CTA shows white+tick when choose-quests done
- Current job completion now requires `current_dimensions` set (not just quest existence)

### Courage challenge creation
- Gap inspiration cards on step 1 showing Now → Next → Dream per dimension
- Dynamic prompts per dimension referencing next tier/level
- "What's the courageous thing?" (was "brave")

### QuestBoardCard
- "Add project" and "Rename project" in three-dot menu (projects = experiences within paths)
- Ghost matchup banner: "You vs Last Week You"

### Per-quest radar
- SVG size increased to 310px so dimension labels don't clip

### Other
- Essence Mirror: back button on first hook slide
- Experience Game: removed unreliable surprise/growth edge/unexplored insights (kept signature only)
- ChooseQuestsFlow: "Which experiences do you want to have" (was "want more of")
- ChallengeOnboarding notifications copy updated to match actual behavior (1 daily nudge + 7-day auto-pause)
- Radar screenshot tool at `public/radar-screenshot-tool.html` (standalone, Dance Events data)

## Decisions made

1. **Rarity/Identity/Vulnerability/Context reframe** — Original scales measured novelty or familiarity which decreased with repetition (dome shrank). New scales measure accumulated comfort zone expansion (dome only grows). Level 1 = "haven't started" for all dimensions.

2. **Stage names: ProgressTab language wins** — "Finding Your Way" over "Crossing the Threshold." The ICP knows Hero's Journey but the simpler names are more motivating as progress markers. Campbell terminology kept only in `ancientWisdom.js` educational content.

3. **Experience Game insights removed** — Surprise ("fun not fulfilling") and growth edge insights were unreliable with branches having 10-20+ experiences. Kept only signature insight (Vibe Rise-based, always accurate).

4. **PortalExplainer killed as modal** — Full-screen blocker between user and app was friction, not value. Replaced with dismissible inline card on Discover tab using same localStorage key.

5. **Projects ≠ Paths** — User clarified paths (quests) and projects (quest_experiences) are different entities. Both manage options now in QuestBoardCard menu.

6. **Current job completion check** — `is_current_job = true` alone isn't sufficient. Must also have `current_dimensions` populated. Prevents half-finished flows from falsely unlocking the bridge CTA.

## In progress / next steps

1. **Notification system is non-functional** — `notification_preferences` table missing `last_seen_at` and `notifications_paused` columns. ChallengeOnboarding (install app + notifications) is dead code (`showOnboarding` never set to true). See notification audit in conversation. Needs: migration for columns, wire `showOnboarding` trigger, verify VAPID keys in edge function secrets.

2. **"Someone" display name bug** — Community feed shows "Someone" for users without `lead_flow_profiles` row. Root cause: PlaySkillsOnboarding saves name to auth metadata but never creates profile row. Fix: create `lead_flow_profiles` row with `user_name` during signup flow.

3. **Radar share feature** — `public/radar-screenshot-tool.html` works standalone. Productize as in-app share button on PerQuestRadar. Memory saved at `project_radar_share_feature.md`.

4. **Dance Events dimension data** — User's quest has `current_dimensions` with people:4, money:6. Dream has people:8 (was missing, now fixed), money:10. "Now" layer is empty (completed challenges have no `dimension_values`). Needs backfill or user needs to redo challenges with dimension tagging.

## Gotchas discovered

1. **Healing Work quest** — Auto-created quest with `is_current_job = false`. Any query checking for non-current-job quests must also `.neq('label', 'Healing Work')` or it false-positives.

2. **CurrentJobFlow saves incrementally** — Step 1 creates the quest immediately (name + life fuels). Dimensions only saved at final step. Half-completed flows leave orphan records.

3. **HERO_STAGES duplication** — ProgressTab exports `HERO_STAGES` with x/y coords for SVG. StageCard imports from ProgressTab. Don't create a separate copy.

4. **PerQuestRadar on Progress tab** — Only shows when ALL 4 setup steps complete (dome + essence + current job + paths) AND user has at least one non-current-job quest.

5. **useCelebrations stage keys** — Must cover all possible `from-to` combinations. `"1-2"` was missing (users could be at stage 0 OR 1 before graduating to 2).

## Recommendations

1. **Fix notification pipeline first** — It's the biggest gap in user retention. One migration + one code change to wire `showOnboarding`. High impact, low effort.

2. **Fix "Someone" display names** — Visible bug that makes the community feed feel broken. One-line fix in PlaySkillsOnboarding to create profile row at signup.

3. **Add CurrentJobFlow resume logic** — Load existing quest data on mount, pre-fill inputs. Prevents duplicate quests and user frustration.

4. **Test graduation pop-ups** — Preview looks great at `/graduation-preview.html` but runtime behavior with real stage transitions is untested. Consider manually triggering a stage change to verify.

5. **Backfill dimension_values on Dance Events challenges** — The "Now" radar layer won't show until completed challenges have dimension data.
