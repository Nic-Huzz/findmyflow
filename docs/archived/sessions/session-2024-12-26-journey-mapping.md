# Session Summary: Journey Mapping & Flow Compass Updates
**Date:** December 26, 2024

---

## Overview

This session focused on transforming the "See Your Flow" component from a simple 2-question reflection into a comprehensive multi-step journey mapping experience. We also unified the styling across Flow Compass pages and fixed various CSS issues.

---

## What Was Built

### 1. SeeYourFlow Multi-Step Journey Mapping

**Location:** `src/components/SeeYourFlow.jsx`

A complete rewrite of the SeeYourFlow component with two modes:

#### First-Time User Flow (5 Steps)

| Step | Question | What It Creates |
|------|----------|-----------------|
| 1. Current State | Two-factor: "Are you feeling excited?" + "How is the business flowing?" | Flow entry with current date, direction based on answers |
| 2. Journey Start | "When did you start this project?" (month/year picker) | Flow entry backdated to selected month, auto-tagged as North (Flow) |
| 3. Highlights | "What were your top 3 highlights, moments of magic or serendipity?" | Up to 3 flow entries, all tagged as North (green) |
| 4. Challenges | "What were your top 3 biggest challenges, curve balls or moments things didn't go to plan?" | Up to 3 flow entries, direction based on feeling (East or South) |
| 5. Summary | Celebration with stats | Shows total moments captured + journey span |

#### Returning User Mode (Check-in)

After completing journey mapping, the component transforms into a simple check-in form:
- Two-factor questions (Excited/Tired + Great/Facing resistance)
- **Headline** field
- **Comment** field (optional)
- **Date option**: "Most Recent" or "Choose Date" with month picker
- Live river updates on submit

#### Key Features
- Progress dots showing current step
- Direction preview badge (Flow/Redirect/Rest/Honour)
- Confetti celebration on completion
- Live FlowMapRiver updates after each step
- **Progress saved to localStorage** - Users can navigate away and return to continue where they left off

#### LocalStorage Progress Saving

Progress is automatically saved after each step so users can resume if they navigate away.

**Storage Keys:**
- `journey_mapping_{userId}_{projectId}` - Stores current step and all journeyData
- `journey_mapping_completed_{userId}_{projectId}` - Boolean flag set to `'true'` when mapping is finished

**How it works:**
1. On mount, checks for saved progress in localStorage
2. If found, restores `currentStep` and `journeyData` state
3. After each step/data change, saves progress to localStorage
4. On "Done" click, sets completed flag and clears progress data

**Console logging for debugging:**
- `🗺️ No saved progress, starting fresh` - First visit
- `🗺️ Saving journey progress: { step, hasData }` - After each save
- `🗺️ Restoring journey progress: { step, data }` - When resuming
- `🗺️ Journey mapping already completed` - Returning user in check-in mode

---

### 2. FlowMapRiver Empty State Update

**Location:** `src/components/FlowMapRiver.jsx`

Changed the empty state from a button to informational text:

**Before:**
```
🧭
No flow entries yet
[Log Your First Entry] (button)
```

**After:**
```
🧭
Complete 'Map Your Journey' Below
↓ (bouncing arrow)
```

This encourages users to use the SeeYourFlow component below it instead of navigating away.

---

### 3. FlowCompassPage Quick Log Redesign

**Location:** `src/pages/FlowCompassPage.jsx`

Updated the Quick Log section to match SeeYourFlow styling:

#### New Features Added:
- Purple gradient background (matching SeeYourFlow)
- Emoji option buttons (🔥 Excited / 😴 Tired + ✨ Great / 🧗 Facing resistance)
- Direction preview badge
- **Headline** field (stored in `activity_description`)
- **Comment** field (stored in `reasoning`)
- **Date option**: "Most Recent" or "Choose Date" with month picker
- Gold "Log Flow" button

---

### 4. FlowCompassInput Label Updates

**Location:** `src/components/FlowCompassInput.jsx`

Updated field labels for consistency:
- "What were you doing?" → **"Headline"**
- "What happened? Why this direction?" → **"Comment"**

---

### 5. CSS Fixes & Updates

#### Files Modified:

| File | Changes |
|------|---------|
| `src/components/SeeYourFlow.css` | Complete rewrite with purple gradient, progress dots, entry cards, month picker styling |
| `src/components/FlowMapRiver.css` | Updated empty state with bouncing arrow, removed button styles |
| `src/pages/FlowCompassPage.css` | Added `.quick-log.flow-style` section with SeeYourFlow-matching styles |

---

## Two-Factor Flow Model

The app uses a consistent two-factor model for determining flow direction:

| Internal State | External State | Direction | Color | Meaning |
|----------------|----------------|-----------|-------|---------|
| Excited | Great (Ease) | North | Green | Flow - everything aligned |
| Excited | Facing Resistance | East | Orange | Redirect - energy but obstacles |
| Tired | Great (Ease) | West | Blue | Honour - rest while things are good |
| Tired | Facing Resistance | South | Red | Rest - need to recharge |

**Emoji Mapping:**
- 🔥 Excited
- 😴 Tired
- ✨ Great
- 🧗 Facing Resistance

---

## Database Usage

All journey entries use the existing `flow_entries` table:

```sql
flow_entries:
  - user_id
  - project_id
  - direction (north/east/south/west)
  - internal_state (excited/tired)
  - external_state (ease/resistance)
  - activity_description (Headline / "Journey: Current state" / "Highlight: ..." / "Challenge: ...")
  - reasoning (Comment / reflection text)
  - logged_at (timestamp - can be backdated)
```

**Journey entries are identified by:**
- `activity_description LIKE 'Journey:%'` - Current state and Start
- `activity_description LIKE 'Highlight:%'` - Highlight moments
- `activity_description LIKE 'Challenge:%'` - Challenge moments

---

## First-Time User Onboarding Flows

When users first land on `/me` without completing onboarding, they're shown the `HomeFirstTime` component which guides them through persona assessment and project setup.

### Flow Architecture

**Location:** `src/components/HomeFirstTime.jsx`

The onboarding is triggered when `user_stage_progress.onboarding_completed === false`.

```
Profile.jsx checks onboarding_completed
    ↓ (if false)
HomeFirstTime.jsx
    ↓
Persona Questions (3 screens)
    ↓
Persona Reveal
    ↓
Branching based on persona:
  • Vibe Seeker → Flow Finder Explainer → /nikigai/skills
  • Vibe Riser/Movement Maker → Project Type Choice
      ├── "Start Fresh" → Flow Finder Explainer → /nikigai/skills
      └── "Existing Project" → ExistingProjectFlow
```

### Screen Flow

| Screen | Purpose | Next Screen |
|--------|---------|-------------|
| ARCHETYPE_REVEAL | Welcome + "3 quick questions" intro | PERSONA_Q1 |
| PERSONA_Q1 | First persona question | PERSONA_Q2 |
| PERSONA_Q2 | Second persona question | PERSONA_Q3 |
| PERSONA_Q3 | Third persona question | PERSONA_REVEAL |
| PERSONA_REVEAL | Shows assigned persona with badge | Branches by persona |
| VIBE_SEEKER_EXPLAINER | Flow Finder intro (5 min timer) | /nikigai/skills |
| PROJECT_TYPE | "Do you have an existing project?" | NEW_PROJECT_EXPLAINER or EXISTING_PROJECT |
| NEW_PROJECT_EXPLAINER | Flow Finder intro for non-seekers | /nikigai/skills |
| EXISTING_PROJECT | Full ExistingProjectFlow component | /me |

### Persona Assessment Logic

Loaded from `/public/persona-assessment.json`

**Three Personas:**
- **Vibe Seeker** - Exploring, finding clarity
- **Vibe Riser** - Building first product
- **Movement Maker** - Scaling a business

Each question option maps to a persona. Final persona = majority vote (3/3 = high confidence, 2/3 = medium, 1/3 = low).

### ExistingProjectFlow Component

**Location:** `src/components/ExistingProjectFlow.jsx`

A 6-step flow for users with existing businesses:

| Step | Question | Data Saved |
|------|----------|------------|
| 1. Name | "What's the name of your project?" | `user_projects.name` |
| 2. Description | "Describe what your project/business does" | `user_projects.description` |
| 3. Skills | "What are your top 3 skills?" | Creates 3 `nikigai_clusters` (type: skills) |
| 4. Problem | "What problem do you solve?" | Creates `nikigai_clusters` (type: problems) |
| 5. Persona | "Who do you help?" | Creates `nikigai_clusters` (type: persona) |
| 6. Stage | "What stage is your business?" | `user_projects.current_stage` |

**Key Features:**
- Creates seed clusters in `nikigai_clusters` table for immediate Flow Map population
- Sets `is_primary = true` on the new project
- Progress dots showing current step
- Back navigation between steps
- Validates inputs before proceeding

### Database Tables Used

| Table | Purpose |
|-------|---------|
| `user_stage_progress` | Stores `persona`, `onboarding_completed` flag |
| `user_projects` | Stores project name, description, stage, is_primary |
| `nikigai_clusters` | Seed clusters from ExistingProjectFlow (skills/problems/persona) |
| `lead_flow_profiles` | Source of essence/protective archetypes |

---

## Files Changed in This Session

### Components
- `src/components/SeeYourFlow.jsx` - Complete rewrite
- `src/components/SeeYourFlow.css` - Complete rewrite
- `src/components/FlowMapRiver.jsx` - Empty state update
- `src/components/FlowMapRiver.css` - Empty state styling
- `src/components/FlowCompassInput.jsx` - Label updates
- `src/components/HomeFirstTime.jsx` - First-time onboarding orchestrator
- `src/components/HomeFirstTime.css` - Onboarding styling
- `src/components/ExistingProjectFlow.jsx` - 6-step project capture flow

### Pages
- `src/pages/FlowCompassPage.jsx` - Quick Log redesign with new fields
- `src/pages/FlowCompassPage.css` - Added flow-style Quick Log section
- `src/Profile.jsx` - Checks onboarding status, renders HomeFirstTime or main dashboard

---

## What Needs Testing

### Priority 1: Journey Mapping Flow
- [ ] First-time user sees "Map Your Journey" and auto-expanded form
- [ ] Step 1: Both questions required, direction preview shows correctly
- [ ] Step 2: Month picker works, entry created with backdated timestamp
- [ ] Step 3: Can add 1-3 highlights with title, month, optional reflection
- [ ] Step 4: Can add 1-3 challenges with title, month, feeling, optional reflection
- [ ] Step 5: Summary shows correct count and journey span
- [ ] Confetti triggers on completion
- [ ] FlowMapRiver updates live after each step
- [ ] After "Done", component becomes check-in mode

### Priority 2: Check-in Mode (Returning Users)
- [ ] Returning user sees "Log Your Flow" (not "Map Your Journey")
- [ ] Two-factor questions work correctly
- [ ] Direction preview updates based on selections
- [ ] Headline field saves to `activity_description`
- [ ] Comment field saves to `reasoning`
- [ ] "Most Recent" logs with current timestamp
- [ ] "Choose Date" shows month picker and backdates entry
- [ ] FlowMapRiver updates after submission
- [ ] Form resets after successful submission

### Priority 3: Flow Compass Page
- [ ] Quick Log section has purple gradient styling
- [ ] Emoji buttons display correctly
- [ ] Direction preview shows after both selections
- [ ] Headline and Comment fields work
- [ ] Date option toggle works
- [ ] Month picker appears when "Choose Date" selected
- [ ] Entry saves with correct data and timestamp
- [ ] Project cards still display correctly below

### Priority 4: Empty States
- [ ] FlowMapRiver shows "Complete 'Map Your Journey' Below" when empty
- [ ] Bouncing arrow animation works
- [ ] No button/link to navigate away

### Priority 5: First-Time Onboarding Flow
- [ ] New user with `onboarding_completed = false` sees HomeFirstTime
- [ ] Welcome screen shows user name (from lead_flow_profiles)
- [ ] "Let's Go" navigates to first persona question
- [ ] Progress dots show correctly (3 dots)
- [ ] Each persona question displays options correctly
- [ ] Selecting option auto-advances to next question
- [ ] After Q3, persona is calculated and saved to `user_stage_progress`
- [ ] Persona reveal screen shows correct persona badge and description
- [ ] Vibe Seeker → sees Flow Finder explainer
- [ ] Vibe Riser/Movement Maker → sees "Do you have an existing project?"
- [ ] "I have an existing project" → ExistingProjectFlow
- [ ] "Start fresh" → Flow Finder explainer

### Priority 6: ExistingProjectFlow (6-Step Business Capture)
- [ ] Step 1: Project name input validates (required)
- [ ] Step 2: Description textarea works
- [ ] Step 3: Can add up to 3 skills
- [ ] Step 4: Problem input saves correctly
- [ ] Step 5: Persona (who you help) input works
- [ ] Step 6: Stage selector shows 4 stages
- [ ] Back button navigates to previous step
- [ ] On complete: project saved to `user_projects` with `is_primary = true`
- [ ] On complete: seed clusters saved to `nikigai_clusters`
- [ ] On complete: `onboarding_completed` set to true
- [ ] On complete: redirects to /me with dashboard view

---

## Known Issues / Edge Cases to Check

### Journey Mapping

1. **Month picker range** - Currently shows last 5 years. May need adjustment.

2. **First-time detection** - Uses `flow_entries` with `activity_description LIKE 'Journey:%'`. If user has regular entries but no journey entries, they'll still see journey mapping.

3. **Highlight/Challenge validation** - Currently requires title + month to save. Feeling required for challenges.

4. **Skip behavior** - Skipping highlights/challenges moves to next step without saving empty entries.

5. **Mobile responsiveness** - Test on smaller screens, especially entry cards and month pickers.

6. **localStorage persistence** - Progress is saved to localStorage per user/project. Clearing browser data will reset journey mapping progress (but not affect database entries already created).

### Onboarding Flows

7. **Persona assessment JSON** - Loaded from `/public/persona-assessment.json`. If file is missing or malformed, questions won't load.

8. **Lead profile lookup** - Uses case-insensitive email match (`ilike`). If no `lead_flow_profiles` record exists, archetypes won't display.

9. **Onboarding flag persistence** - `onboarding_completed` in `user_stage_progress` must be explicitly set to `false` for HomeFirstTime to show.

10. **ExistingProjectFlow seed clusters** - Uses `source: 'existing_project_flow'` in `nikigai_clusters`. Ensure this is consistent with FlowMap expectations.

11. **Re-running onboarding** - Currently no way for users to re-do the persona assessment after completion. May need a "Reset Profile" option.

---

## Future Enhancements (Not Done Yet)

### From Todo List
- [ ] Test Challenge - Stage tabs and quest completion
- [ ] Test Money Model and Lead flows

### Potential Improvements
1. **Edit journey entries** - Allow users to modify/delete historical entries
2. **Re-do journey mapping** - Button to restart the 5-step flow
3. **Entry details modal** - Tap on river node to see full entry details
4. **Direction balance stats** - Show % of each direction in summary
5. **Streak tracking** - Track consecutive days of check-ins
6. **Reminder notifications** - Prompt users to check in

---

## Commands for Testing

```bash
# Start dev server
npm run dev

# Server runs at http://localhost:5175/

# Key pages to test:
# - /me (Profile with FlowMapRiver + SeeYourFlow)
# - /flow-compass (Flow Compass page with Quick Log)
```

---

## Related Documentation

- `docs/7-day-challenge-system.md` - Challenge system documentation
- `docs/design-guide.md` - Brand colors and typography
- `CLAUDE.md` - Project overview and patterns
