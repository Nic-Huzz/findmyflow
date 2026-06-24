# Test Checklist — March 2026 Changes

> Covers: 15 committed changes + all unstaged/untracked changes
> Migrations: All 3 applied (`20260303000000`, `20260303100000`, `20260304000000`)

---

## 1. Bottom Toolbar: Compass → Business

- [ ] Bottom nav shows 4 items: Home, Let's Play, **Business**, Profile
- [ ] Tapping "Business" navigates to `/business`
- [ ] Business tab highlights as active when on `/business`
- [ ] `/flow-compass` still works via direct URL (just no longer in nav)

---

## 2. /business Page (New)

### First Visit (No Project)
- [ ] Shows Business Setup flow (Stage 0.9)
- [ ] Business Setup has 2 steps: Name/Description → Stage Selection
- [ ] Stage selection shows 7 options with plain language descriptions
- [ ] "Create Project & Start" disabled until a stage is selected
- [ ] Project creates with correct `current_stage` (not always 1)

### With Existing Project
- [ ] Hero section shows project name + active stage + progress ring
- [ ] Stage dots show completed stages with checkmarks, current stage highlighted
- [ ] Clicking a stage dot switches the quest list view
- [ ] "Up Next" card shows first incomplete quest for current stage
- [ ] Quest list renders full QuestCards (not simple rows)
- [ ] Completing a quest: success alert with points, quest shows completed
- [ ] Completing same quest again today: duplicate alert
- [ ] Flow-type quests: "Start Quest" links to flow route
- [ ] Non-flow quests: button scrolls to quest list
- [ ] Paid quests show locked state when no subscription
- [ ] Project selector overlay works (switch between projects)
- [ ] Zarlo AI has context for `/business` page
- [ ] Links in quest descriptions navigate correctly (no blank screens)
- [ ] Switching stages rapidly when some stages have 0 quests: shows "No quests" message
- [ ] Progress ring doesn't break with 0% or 100% values
- [ ] Empty text input → validation alert ("Please enter your reflection")
- [ ] Empty dropdown → validation alert ("Please select an option")
- [ ] No console errors during stage switching or quest completion

### Cross-Page Sync
- [ ] Complete a quest on /business → go to /7-day-challenge → same quest shows completed

---

## 3. Challenge Page: Business → Priority Tab

### Tab Navigation
- [ ] 4th category tab reads "Priority" (not "Business")
- [ ] URL `?tab=business` redirects to Priority tab (backward compat)
- [ ] URL `?tab=quests` redirects to Priority tab (backward compat)
- [ ] Business quests no longer appear anywhere in Challenge page

### Priority Tab — State 1: Assessment
- [ ] First visit with no tension scores: shows PriorityMiniAssessment
- [ ] 4 questions load from `tension-assessment.json`
- [ ] If JSON fails to load: spinner doesn't hang forever (check console)
- [ ] Selecting an option for each question works
- [ ] "See My Priority" button disabled until all 4 answered
- [ ] Submit saves scores to `user_stage_progress` and transitions to Picker
- [ ] Double-clicking "See My Priority" doesn't fire two saves

### Priority Tab — State 2: Week Picker
- [ ] Shows PriorityLayerCard with layer emoji, name, description
- [ ] Shows PriorityWeekPicker with 4 sections (Groan, Play Profile, Daily Healing, Weekly Healing)
- [ ] Recommended sections have gold accent + "Recommended" badge
- [ ] Max selection limits enforced (Groan: 3, Play Profile: 1, Daily: 2, Weekly: 1)
- [ ] "Confirm My Week" disabled until at least 1 pick selected
- [ ] Confirming saves picks to `priority_weekly_picks` table
- [ ] Groan section with 0 challenges: shows "No challenges yet" + link
- [ ] Play Profile section with no active DNA session: shows "No active challenge" + link
- [ ] DNA counter displays correctly (not stuck at "0/1" when selected)
- [ ] Navigating away from picker mid-selection and returning: selections are lost (expected)

### Priority Tab — State 3: Quest List
- [ ] Shows layer card + progress bar + grouped quest sections
- [ ] Groan challenge links navigate correctly
- [ ] Play Profile link navigates correctly
- [ ] Healing quests render as full QuestCards
- [ ] Daily healing QuestCards show streak dots (M-T-W-T-F-S-S)
- [ ] Can complete a healing quest inline on Priority tab
- [ ] Completed quest shows completion badge
- [ ] "Edit Week" deletes picks and returns to Picker
- [ ] "Reassess" returns to Assessment
- [ ] Complete a quest on Healing tab → return to Priority → shows completed

### Priority Tab — Edge Cases
- [ ] New week (Monday rollover): shows picker again (no picks for new week)
- [ ] User with tension scores but zero available groans/DNA: empty states show correctly
- [ ] Rapid tab switching doesn't cause errors
- [ ] Invalid/unknown priority_layer value: card doesn't render blank gap

---

## 4. Onboarding: Tension Layer Flow (New Users)

- [ ] New user sees Welcome screen: "Four quick questions..."
- [ ] Progress dots show 4 steps (not 3)
- [ ] Q1-Q4 each show options — tapping an option advances to next question
- [ ] Q4 submission saves tension scores + priority_layer to `user_stage_progress`
- [ ] Priority Reveal screen shows: layer emoji, river element, description, recommended feature
- [ ] Gold CTA navigates to `/mind-space`
- [ ] "I'll do this later" skip works
- [ ] LocalStorage saves progress mid-flow (refresh preserves position)
- [ ] Returning users (with existing persona) are NOT shown the tension flow

---

## 5. MindSpace: New Steps 4-7

### Step 4: Ambition Question
- [ ] Shows 3 options: find aligned career, build something, still exploring
- [ ] Selection saves `ambition` to `user_stage_progress`
- [ ] "Find aligned career" → skips to Step 6
- [ ] "Build something" → goes to Step 5
- [ ] "Still exploring" → skips to Step 6
- [ ] Returning users with ambition already set → skip to Step 6

### Step 5: Existing Business (build_own only)
- [ ] Shows "Do you already have a business?" Yes/No
- [ ] Selection saves `has_existing_business`
- [ ] Both options proceed to Step 6

### Step 6: Alignment Sliders
- [ ] 3 sliders always show (even with 0 starred items)
- [ ] "No alignment" appears as first option on each slider
- [ ] Heading varies by path (build_own vs find_job vs exploring)
- [ ] Project name field shown only for `build_own` path
- [ ] No project name field for find_job or exploring paths
- [ ] "Continue" disabled until project name filled (build_own only)
- [ ] "Continue" enabled immediately for non-build_own paths (even with all sliders on "No alignment")
- [ ] Back button routes to Step 5 (build_own) or Step 4 (others)
- [ ] Submitting with all sliders on "No alignment" → DB: cluster_label = "No alignment"

### Step 6: Cluster Label Variations
- [ ] Skill only selected → label is just the skill name
- [ ] Skill + persona → "Skill Name helping Persona Name"
- [ ] Skill + problem → "Skill Name with Problem Name"
- [ ] All three selected → "Skill Name helping Persona Name with Problem Name"

### Step 7: Stage Selection (build_own + existing biz only)
- [ ] Shows 7 stage options
- [ ] Selecting a stage and confirming updates `user_projects.current_stage`
- [ ] Proceeds to Step 8 (completion)
- [ ] build_own + "No, starting fresh" (Step 5) → Step 7 is SKIPPED (goes Step 6 → Step 8)
- [ ] build_own + "Yes, existing business" (Step 5) → Step 7 IS shown

### Step 8: Completion
- [ ] Shows completion screen
- [ ] "Start Again" resets all state (ambition, biz, stage, sliders)
- [ ] After retake: sliders reset to "No alignment" (not carrying old values)
- [ ] After retake: ambition question (Step 4) appears again

### Zarlo Context
- [ ] Zarlo widget shows relevant FAQ/prompts on Steps 4-7

### MindSpace — Returning User
- [ ] Complete Steps 1-3 again → skips Step 4 → goes straight to Step 6
- [ ] Sliders default to "No alignment" on return
- [ ] Can complete normally through to Step 8

### BusinessSetup Ambition Interaction
- [ ] ambition = 'build_own': BusinessSetup shows product identification form
- [ ] ambition = 'find_job' or 'exploring' or null: BusinessSetup auto-skips to "Setup Complete"

---

## 6. /me Page

- [ ] Flow Journey section: no inline SeeYourFlow mapper (removed)
- [ ] First-time user: sees ghost river SVG + "Open Flow Compass" link
- [ ] User with flow entries: sees HorizontalFlowRiver + compass link

---

## 7. Hero Profile Fixes

- [ ] Play-List Mastery shows "X done" counts (not percentages or "Complete")
- [ ] Completed layers show green styling
- [ ] Layers with 0 quests show "0"
- [ ] Rewiring text has no visible `**` markdown characters
- [ ] Voice tracker percentage correctly reflects voice quest completions

---

## 8. Challenge UI Fixes

### Compass Check-in Modal
- [ ] "Skip" button is legible (white text on purple/dark background)
- [ ] Button reads "Save Compass Check-in" (not "Save Energy Check")

### Groan Challenge Description
- [ ] First line renders as main description text
- [ ] Metadata lines (3% improvement, Problem, Persona) render as labeled gold rows
- [ ] "3% improvement" text from description appears as gold-accented quote block
- [ ] Challenges without metadata: just main text, no metadata section
- [ ] Line breaks render correctly in description

---

## 9. /try/play-profile (Lead Magnet)

### Flow
- [ ] `/try/play-profile` loads without auth (incognito)
- [ ] No bottom toolbar or Zarlo widget shown
- [ ] Games screen: pick 3+ games, "Let's Go!" enables
- [ ] Sliders screen: 3 sliders work, "Reveal My DNA" button
- [ ] Back from Sliders returns to Games
- [ ] Email gate: "Your Founder DNA is ready" title
- [ ] Back from Email gate returns to Sliders
- [ ] Enter email → DNA Reveal with animated phases
- [ ] DNA code, archetype, matched founder all display
- [ ] Top 3 founder alternatives: clicking switches displayed founder
- [ ] "Share my DNA" copies text to clipboard
- [ ] Share text includes `/try/play-profile` URL
- [ ] "Go deeper" CTA navigates to `/` (signup)

### Persistence
- [ ] Refresh mid-flow restores progress
- [ ] After email submit, localStorage is cleared
- [ ] Corrupted localStorage (e.g. missing DNA data) resets to Games

### Database
- [ ] `public_leads` row created with `source_flow: 'play_profile'`
- [ ] UTM params stored inside `flow_results` JSON (not top-level columns)
- [ ] Duplicate email uses upsert (no error)

---

## 10. BusinessSetup: Stage Question

- [ ] Business Setup (on /business page) shows 2-step flow
- [ ] Step 1: Project name + description
- [ ] Step 2: 7 stage options (radio style)
- [ ] "Back" returns to Step 1 without losing name
- [ ] "Create Project & Start" saves project with selected stage
- [ ] Step dots show progress (5 dots for full BQ flow: Journey/Creations/Goal/Project/Stage)

---

## Pre-Deploy Requirements

- [x] Migration `20260303000000_tension_layers.sql` applied
- [x] Migration `20260303100000_ambition_columns.sql` applied
- [x] Migration `20260304000000_priority_weekly_picks.sql` applied
- [ ] `public/tension-assessment.json` exists and is deployable
- [ ] `npm run build` passes with no errors

---

## Known Edge Cases

- [ ] Old `?tab=business` bookmarks/PWA shortcuts resolve to Priority tab
- [ ] Users who completed old persona onboarding are NOT re-prompted for tension flow
- [ ] MindSpace returning users (ambition already set) skip Steps 4-5 correctly
- [ ] Priority tab with 0 starred MindSpace items: sliders show "No alignment" (not broken)
- [ ] All users get `persona: 'vibe_seeker'` from new onboarding (downstream logic should use `ambition` instead)
- [ ] Stage update silent failure: if project creation failed earlier, Step 7 stage update is silently skipped
- [ ] Priority picker selections lost on navigation away (no persist until "Confirm")
- [ ] Week rollover: if tab open across Monday midnight, picks show stale until refresh
