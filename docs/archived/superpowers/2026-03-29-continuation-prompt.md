# Continuation Prompt — Journey Progression System

> **Paste this into a new Claude Code session to pick up where we left off.**

## Context

We're building the Journey Progression System for FindMyFlow. 4 phases have been built and merged to main. We're now working on refinements.

**Read these files for full context:**
- `docs/superpowers/specs/2026-03-29-journey-progression-system-design.md` — the full spec
- `docs/2026-03-27-journey-story-brainstorm.md` — the brainstorm with all design decisions
- `docs/zone-calibration-framework.md` — the theoretical framework (Zone Calibration)

## What's been built (all on main branch)

### Phase 1: Onboarding ✅
- `src/components/onboarding/JourneyOnboarding.jsx` + `.css` — 4-beat story at `/get-started` (Hook → Story with Pixar scenes → Reframe → Promise with inline signup)
- `src/lib/journeyOnboarding.js` — post-auth persistence to `journey_onboarding_selections` table
- 12 Pixar scene images in `public/images/onboarding/stage*.png`

### Phase 2: Post-Login Tension Questions ✅
- `src/components/HomeFirstTime.jsx` — updated with 3+1 journey-mapped questions (identity, vulnerability, enough, conditional passion)
- 16 Pixar images in `public/images/onboarding/questions/` subfolders
- `public/tension-assessment-v2.json` — question data with image paths
- Redirects to `/me` after completion (not `/mind-space`)

### Phase 3: Portal Restructure ✅
- Priority tab renamed to "Level" in `src/hooks/useChallengeData.js` and `src/Challenge.jsx`
- XP level bar added to `src/components/ChallengeHeader.jsx` (hardcoded Level 1 for now)
- Journey graph popup: `src/components/JourneyGraphPopup.jsx` + `.css`

### Phase 4: Level Template Components ✅ (built, partially wired)
- `src/components/level/LevelConfig.js` — config for all 8 levels
- `src/components/level/LevelTab.jsx` — main template component
- `src/components/level/SweetSpotGraph.jsx` — SVG graph (brand purple #5e17eb bg, gold #E9A23B diagonal)
- `src/components/level/ZoneDiagnosis.jsx` — 3 scene cards for zone pick
- `src/components/level/DeepDiveCard.jsx` — links to healing flows
- `src/components/level/BossFightCard.jsx` — pre/post session verification
- `src/components/level/MilestoneCard.jsx` — diagonal challenge
- `src/components/level/ProgressBars.jsx` — 3 progress bars
- `src/components/level/LevelTab.css` — all styles
- DB migration: `supabase/migrations/20260329000000_level_progress.sql` (NOT yet applied — user needs to run `supabase db push`)

### Database Tables
- `journey_onboarding_selections` — stores onboarding wound stage picks ✅ applied
- `user_level_progress` — tracks level progress (zone, boss, completions, healing days, courage) — NOT YET APPLIED
- `boss_fight_sessions` — pre/post session verification data — NOT YET APPLIED

## What's been done (session 2, 2026-03-29)

### 1. Wire LevelTab into Challenge.jsx ✅
- LevelTab wired with `userId` prop passed from Challenge.jsx
- LevelTab now reads zone diagnosis from `user_level_progress` DB table

### 2. Remove level markers from XP bar ✅
- Removed `.challenge-level-markers` div from ChallengeHeader.jsx
- Removed CSS for `.challenge-level-marker` from Challenge.css

### 3. ZoneDiagnosis refactored into a Flow ✅
- Created `src/flows/ZoneDiagnosisFlow.jsx` + `.css` — 5-step flow (Graph → Explainer → Zone Pick → Protective Voices → Boss Reveal)
- Route: `/zone-diagnosis/:levelNumber` (added to AppRouter.jsx)
- Config-driven from LevelConfig.js
- Protective voices: topLeft (Performer, Controller, People Pleaser), bottomRight (Perfectionist, Ghost)
- Saves to `user_level_progress` table
- LevelTab now links to flow instead of inline ZoneDiagnosis component

### 4. /me Page Updates ✅
- Hero XP bar shows "Level 1: Identity" instead of old level system name
- Quest section: onboarding-incomplete users still see step-by-step progress; post-onboarding users now see Current Level card with level name, question, 3 mini progress bars (Level Quests, Healing Days, Courage), and CTA to Level tab

### 5. SweetSpotGraph restyled ✅
- Viewbox updated to 400x440 (matching brand preview template)
- Title: italic, 24px, 800 weight
- Axes: strokeWidth 5
- Diagonal: strokeWidth 5
- Axis labels: 16px, 800 weight
- Zone labels: 16px, descriptions at 65% opacity
- All dimensions and positions matched to `public/images/sweet-spot-brand-preview.html`

### 6. Image Focal Points ✅
- Scanned all 28 Pixar images, added focalPoint data
- JourneyOnboarding.jsx: 12 scenes with objectPosition
- tension-assessment-v2.json: 16 question options with focalPoint
- HomeFirstTime.jsx: objectPosition applied to option images

### 7. Apply DB Migration ⚠️ STILL NEEDED
User needs to run:
```bash
supabase db push
```
The migration at `supabase/migrations/20260329000000_level_progress.sql` creates `user_level_progress` and `boss_fight_sessions` tables.

## What needs doing NEXT

### Flow Journey River Updates (deferred from item 4)
- Add level graduation + boss defeat markers to river timeline
- Make dots tappable (diary mode)
- These require the DB tables to be applied first

### Wire DB-backed progress to LevelTab + /me page
- Currently LevelTab reads zone from DB but progress bars are hardcoded to 0
- /me page mini progress bars are hardcoded to 0
- Need to read from `user_level_progress` once table is applied

### Dynamic level detection
- Currently hardcoded to Level 1 everywhere (ChallengeHeader, LevelTab, /me page)
- Need to read user's actual current level from `user_level_progress` table

## Key Design Decisions (don't revisit, already agreed)

1. **8 levels:** Identity, Vulnerability, Direction, Enough, Growth, Execution, Passion-Risk, Play (endgame)
2. **3 progress bars per level:** Level Quests (checklist), Healing Days (14 dots), Courage Challenges (scales 1→7 by level)
3. **Boss = protective voice** identified during zone diagnosis. Different users face different bosses at same level.
4. **Boss fight verification:** 3 pre-session questions + 5 post-session questions. Self-set challenge from Q8 = graduation requirement.
5. **Compass check-in** after every play-list challenge (N/E/S/W). Feeds flow journey river diary.
6. **Flow Finder split:** Skills = pre-level (already built). Problems + Personas = Level 3 (Direction).
7. **No 4 R's labels** visible to users.
8. **Tabs:** Level | Play-list | Healing | Bonus
9. **100 Day Challenge** campaign framing.
10. **Graduation:** celebrate → next level story → zone diagnosis → new Boss. Seamless loop.

## Brand Design Tokens
- Purple: `#5e17eb`
- Gold: `#E9A23B`
- Cards: white bg, 16px border-radius, 2px border `#e9ecef`
- Buttons: purple gradient or gold gradient
- Font: system (-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)
- See `docs/page-component-design-guide.md` for full design system
