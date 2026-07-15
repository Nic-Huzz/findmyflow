# Session Handoff: League Reach + Journey Perf + Onboarding (2026-07-13)

## What was done

### League Reach Scoring (shipped, commit 88541a2)
- League categories restructured: Tune/Wahoos/Healing -> Tune/Courage/Reach
- Healing merged into Courage category (dbFilter: ['Groans', 'Healing', 'Daily', 'Weekly'])
- New Reach category scored from `league_content_submissions` (6 tasks, 3 auto-approved)
- CONTENT_POINT_VALUES: dropped 3 tasks (carousel_highlights, customise_hero, share_hero_profile), updated labels (Play-List Proof -> Courage Proof, Offer in the Wild -> Flow in the Wild), added `autoApprove` and `crossPostToFeed` flags
- Content submission keys NOT renamed in DB (avoids breaking existing rows)
- `submitContent` in leagueService.js: auto-approves in-app tasks (status='approved' on insert)
- `calculateTeamScores` + `calculateUserCategoryScores`: content points now wired to `reach` key
- Edge function `score-league-matchups`: mirrored all client-side changes
- ChallengeHeader: pills now show Tune/Courage/Reach with correct colors
- `useMatchupData`: accepts `contentSubmissions`, computes reach locally from approved submissions
- ContentChallenges.jsx rewritten: quest_task_picker for Accountability Post, cross-posting to community feed via static import, dead template cases removed
- PlayListTab: Reach section at bottom of Courage tab (league-only, via `leagueData` prop)
- Challenge.jsx: passes leagueData to PlayListTab with all required props verified
- WeekMatchups.jsx: mock data updated to new category keys
- LeagueGuide.jsx: CATEGORY_DESCRIPTIONS updated to tune/courage/reach
- CommunityFeed.jsx: added reach_share and accountability event icons
- Files: leagueConfig.js, leagueScoring.js, leagueService.js, score-league-matchups/index.ts, ChallengeHeader.jsx, useMatchupData.js, ContentChallenges.jsx, PlayListTab.jsx, Challenge.jsx, Challenge.css, WeekMatchups.jsx, LeagueGuide.jsx, CommunityFeed.jsx

### Scary Score Cleanup (shipped, same commit)
- Removed all dead scary_score/wahoo_score references across 10 files
- DB columns kept (dropping them = migration for zero benefit)
- Files: groanChallengeService.js, GroanCompletionModal.jsx, GroanMatrix.jsx, FeedCard.jsx, playlistFeedService.js, checklistChallengeService.js, StrikeDesignFlow.jsx, LibraryOfAnswers.jsx, analytics.js, crm/index.js

### Journey Tab Performance (shipped, commit 5b794f6)
- Flattened 9 sequential DB queries into 2 parallel batches (8 queries in batch 1, 3 in batch 2)
- Moved `auth.getUser()` and orphan detection queries into batch 1 (were sequential)
- Archived JourneyZones component (Zone Assessments horizontal strip)
- JourneyTimeline: accepts `userEmail` prop from parent, skips duplicate `auth.getUser()` call
- Added `active` flag for cleanup on unmount

### Onboarding Restructure (shipped, same commit)
- Tab unlock: Journey + Tune unlocked by default. Quests locked until Life Paths mapped. Courage locked until first wahoo.
- JourneyOnboarding: added "Explore Your Quests" step (shows green "Unlocked" badge after Life Paths)
- Sequence: Curiosity Map -> Life Map -> Life Paths -> Explore Your Quests (unlocks tab) -> Hero Avatar -> First Courage Challenge (unlocks tab)
- Challenge.jsx: tab unlock logic checks `life_path_sessions` for Quests unlock alongside existing wahoo check for Courage

### ChallengeIntro Hero Journey (shipped, same commit)
- 3-slide overlay rewritten: "Something cracked." / "That's not a breakdown. That's your origin story." / "Your journey starts with self-knowledge."
- Removed old nervous system tier-stack visual from slide 3
- CTA button: "Begin Your Journey" (was "Let's Go")

## Decisions made

### Content type keys preserved
`playlist_proof` and `offer_in_wild` stay as DB keys in `league_content_submissions.content_type`. Only display labels updated. No migration needed.

### Auto-approve for in-app tasks
Comment & Engage, Accountability Post, and Shout Out a Player insert with `status: 'approved'` directly. No admin review needed for in-app actions.

### Zone Assessments archived
JourneyZones removed from JourneyTab render. File kept. Re-enable when redesigned.

### Tab unlock order
Journey is always unlocked (onboarding lives here). Quests unlocks when life paths exist. Courage unlocks when first wahoo/play-skill exists. This replaces the old setup where Quests + Tune were default and everything else required progression.

## In progress / next steps

### 1. WahooDiscoveryFlow wiring (NEXT TASK)
WahooDiscoveryFlow still shows for first-visit users. The inspiration content (3 category pages with examples: Creation/Connection/Appearance) is valuable. But the save step uses old category-based creation. Next agent should wire it so picking a wahoo opens the WahooCreator modal (quest link + depth + visibility) before saving. Discovery = inspiration, WahooCreator = capture.

### 2. Edge function deployment
Edge function `score-league-matchups` committed but NOT deployed. Deploy after runtime testing:
```bash
npx supabase functions deploy score-league-matchups --project-ref qlwfcfypnoptsocdpxuv
```

### 3. Runtime testing
60+ commits on `light-portal`. Key risks to verify in browser:
- Healing inline FK join (`healing_intentions!quest_task_id`) in PlayListTab
- Quest_task_picker Supabase query in ContentChallenges (inner join syntax)
- Tab unlock/lock behavior for new users (Journey + Tune unlocked, Quests + Courage locked)
- JourneyOnboarding "Getting Started" sequence renders correctly
- ChallengeIntro 3-slide overlay displays correctly
- Reach section only visible for league members on Courage tab
- Auto-approved submissions update the Reach pill immediately

### 4. Wahoo -> Courage language rename
User-facing copy should say "courage challenge" not "wahoo." Internal code stays. Not yet implemented across all surfaces.

## Gotchas

1. **`life_path_sessions` uses `client_email` not `user_id`.** Every query against this table needs the user's email from `supabase.auth.getUser()`. JourneyTab now caches this in `userEmail` state and passes to JourneyTimeline.

2. **Historical matchup data uses old keys.** `fantasy_matchups.category_results` JSON from previous weeks contains `play_list` and `healing` keys. New matchups use `tune`, `courage`, `reach`. Display code reads dynamically, so old results still render correctly.

3. **`increment_scores` RPC calls in EssenceMirrorFlow and IdentifyTopicsFlow still use `p_category: 'play_list'`.** These are one-time RP bonuses for onboarding completions. They contribute to total RP but won't map to any league category. Not broken, just won't count toward league Courage. Separate concern.

4. **`heroStageChecker` only advances ONE stage per page load.** Users who should jump 4 stages need 4 page loads. The backfill edge function handles bulk advancement but the client-side checker is intentionally conservative.
