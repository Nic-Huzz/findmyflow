# Weekly Planning System - Implementation Plan

## Overview

Transform the 7-day challenge from a discrete "start/stop" experience into an **auto-rolling weekly rhythm** with intentional planning each week.

### Key Changes
1. Sunday = intention setting for upcoming week
2. Monday = auto-restart, "Week of [Date]" format
3. Weekly planning flow with conditional questions
4. Weekly Groan as focal storytelling moment (Nic's story)
5. Bottom toolbar navigation (Home, Challenge, Compass, Library)

### Design Decisions (Confirmed)
- **Mid-week changes**: Users can toggle quests ON or OFF mid-week
- **Week type**: Cosmetic/expectation setting (informs future AI co-founder)
- **Morning routine**: Each exercise independently tracked
- **Sunday prompt**: Both push notification + in-app banner
- **Skipped week**: Show planning for current week (no guilt about past)
- **First-time users**: See planning after persona selection, before quests
- **Migration**: Force planning flow on next login (no active challenges to override)

---

## 1. Weekly Planning Flow

### Trigger
- **Sunday**: Prompt appears "Plan your upcoming week"
- **Monday**: If not planned, show planning flow before challenge content
- **First-time users**: Show after initial onboarding

### Flow Screens

#### Screen 1: Week Type Selection
```
"What kind of week is this?"

[🔥 Push Week]     - Go all in, stretch your edges
[🌊 Flow Week]     - Balanced, sustainable rhythm
[🌙 Rest Week]     - Lighter load, focus on reconnect
[🎯 Launch Week]   - Heavy business focus
```

**Data captured:** `week_type` (push | flow | rest | launch)

---

#### Screen 2: Foundation Check (Conditional)
*Only shows if NS or Healing Compass incomplete*

```
"Before we plan..."

Nervous System + Healing Compass are foundational flows
that unlock your personalized healing journey.

They reveal WHY your protective voice shows up and
give you tools to release what's blocking you.

[🧠 Do Nervous System Now] → navigates to /nervous-system
[📅 I'll do it this week]  → continues, adds reminder
[Skip for now]             → continues
```

**Logic:**
- Check `nervous_system_responses` table for user
- Check `healing_compass_responses` table for user

---

#### Screen 3: Morning Reconnect Builder
```
"Pick your morning reconnection routine:"

□ 🧘 Meditation (5 pts)
□ 🌬️ Breathwork (5 pts)
□ 💃 Rise & Vibe Dance (3 pts)
□ 🙏 Daily Prayer (4 pts)
□ ✨ Self-Identified Activity (3 pts)

[Continue]
```

**Data captured:** `morning_routine: string[]` (array of quest IDs)

**Smart defaults:**
- If returning user, pre-check last week's selections
- If Rest Week, suggest lighter options
- If Push Week, suggest full routine

---

#### Screen 4: Weekly Groan (FOCAL POINT)

**Carousel storytelling moment - 5 slides:**

*Slide 1:*
```
"The Weekly Groan"

This is the thing that changed everything for me.

[→ Swipe]
```

*Slide 2:*
```
In March 2020, I had my awakening.

I realized I'd never find fulfilment in what
I thought was my dream job.

Over the next year, I built a vision:
Working for myself. Living anywhere. Purposeful work.

[→]
```

*Slide 3:*
```
But by 2023—three years later—I was still
in the same job I knew was wrong.

Why?

Because we don't rise to the level of our ambitions.
We fall to the level of what feels safe.

[→]
```

*Slide 4:*
```
Fed up, I challenged myself:
One thing that terrified me. Every week. For a year.

Week 5: Moved to Bali
Week 12: Quit my job
Week 16: Funding my life hosting silent discos
         on beaches in Thailand

In 6 months, 3 years of dreams became reality.

[→]
```

*Slide 5:*
```
How?

By completing these "groans" and retraining my
nervous system around what felt safe.

Now it's your turn.

"What's YOUR groan this week?"
[Text input - What will you do?]

"Which day?"
[Day picker: Mon|Tue|Wed|Thu|Fri|Sat|Sun]

[Continue]
```

**Data captured:**
- `weekly_groan_description: string`
- `weekly_groan_day: string` (day of week)

**Future enhancement:** Add video from Nic (replace slides 2-4 with video)

---

#### Screen 5: Conditional Weekly Commitments

**5a: Healing Priority**
```
"Is healing a priority this week?"

[Yes, I have space] → Expands:

  "What's your Big Release practice?"
  [Dropdown: Extended breathwork | Shaking |
   Cold exposure | Journaling | Movement | Other]

  "Which day?"
  [Day picker]

[No space this week] → Skips, no guilt
```

**Data captured (if yes):**
- `big_release_practice: string`
- `big_release_day: string`

---

**5b: 3% Improvement (Conditional)**
```
"Are you delivering your offering this week?"

[Yes] → Expands:

  "What's your 3% improvement?"
  [Text input - What will you make 3% better?]

[No] → Skips
```

**Data captured (if yes):**
- `three_percent_improvement: string`

---

#### Screen 6: Week Plan Summary
```
"Your Week Plan"

┌────────────────────────────────────────┐
│ Week of January 6                      │
│ Type: 🔥 Push Week                     │
├────────────────────────────────────────┤
│ 🌅 Morning Routine                     │
│    Meditation + Breathwork             │
├────────────────────────────────────────┤
│ 🎯 Weekly Groan (Thursday)             │
│    "Post a video sharing my story"     │
├────────────────────────────────────────┤
│ 🌊 Big Release (Saturday)              │
│    Extended breathwork                 │
├────────────────────────────────────────┤
│ 📈 3% Improvement                      │
│    "Simplify my landing page headline" │
└────────────────────────────────────────┘

[Start Week →]
```

---

## 2. Database Schema Changes

### New Table: `weekly_plans`
```sql
CREATE TABLE weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  week_type TEXT CHECK (week_type IN ('push', 'flow', 'rest', 'launch')),
  morning_routine TEXT[], -- Array of quest IDs
  weekly_groan_description TEXT,
  weekly_groan_day TEXT,
  weekly_groan_completed BOOLEAN DEFAULT FALSE,
  big_release_practice TEXT,
  big_release_day TEXT,
  three_percent_improvement TEXT,
  foundation_reminder BOOLEAN DEFAULT FALSE, -- If they said "I'll do it this week"
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, week_start)
);
```

### Modify: `challenge_progress`
- Change `current_day` concept to `week_start_date`
- Add `week_label` computed field ("Week of Jan 6")

---

## 3. Auto-Rolling Logic

### Monday Reset
```javascript
// On app load or midnight Monday
if (isMonday() && !hasPlannedThisWeek(user)) {
  // Show planning flow
}

// Reset weekly quest completions
// Keep cumulative points
// Start fresh week tracking
```

### Sunday Prompt
```javascript
// On Sunday, show prompt
if (isSunday() && !hasPlannedNextWeek(user)) {
  showNotification("Plan your week ahead!")
  // Or show in-app prompt
}
```

---

## 4. UI Changes

### Challenge Page Header
**Before:**
```
Day 3 of 7 | 145 points
```

**After:**
```
Week of Jan 6 | 🔥 Push Week
145 pts this week | 892 pts total
```

### Week Plan Card
Show compact version of their plan at top of challenge page:
```
┌─────────────────────────────────┐
│ Your Focus This Week            │
│ 🎯 Groan: Post video (Thu)      │
│ 🌊 Release: Breathwork (Sat)    │
│ [Edit Plan]                     │
└─────────────────────────────────┘
```

---

## 5. Bottom Toolbar Navigation

### Component: `BottomToolbar.jsx`
```
┌─────────┬─────────┬─────────┬──────────┐
│  🏠     │  🎯     │  🧭     │   📚     │
│  Home   │Challenge│ Compass │ Library  │
└─────────┴─────────┴─────────┴──────────┘
```

### Routes
| Icon | Label | Route | Component |
|------|-------|-------|-----------|
| 🏠 | Home | `/me` | App.jsx (Dashboard) |
| 🎯 | Challenge | `/7-day-challenge` | Challenge.jsx |
| 🧭 | Compass | `/flow-compass` | FlowCompassPage.jsx |
| 📚 | Library | `/library` | LibraryOfAnswers.jsx |

### Why Library over Profile?
- More unique to FindMyFlow
- Profile/Settings accessible via header icon or within Library
- "Home → Challenge → Compass → Library" tells a story:
  *See yourself → Take action → Track energy → Review insights*

### Styling
- Fixed to bottom
- 60px height
- Active state highlight
- Hide on scroll down, show on scroll up (optional)
- Safe area padding for iPhone notch

---

## 6. Implementation Phases

### Phase 1: Foundation (Do First)
- [ ] Create `weekly_plans` table migration
- [ ] Build `BottomToolbar.jsx` component
- [ ] Add toolbar to app layout
- [ ] Update routes if needed

### Phase 2: Weekly Planning Flow
- [ ] Create `WeeklyPlanningFlow.jsx` component
- [ ] Screen 1: Week type selection
- [ ] Screen 2: Foundation check (conditional)
- [ ] Screen 3: Morning routine builder
- [ ] Screen 4: Weekly groan carousel
- [ ] Screen 5a: Healing priority (conditional)
- [ ] Screen 5b: 3% improvement (conditional)
- [ ] Screen 6: Summary + confirmation

### Phase 3: Auto-Rolling Logic
- [ ] Monday reset logic
- [ ] Sunday planning prompt
- [ ] Update challenge header (Week of X)
- [ ] Add week plan summary card

### Phase 4: Integration
- [ ] Connect planning data to quest filtering
- [ ] Highlight planned quests in challenge view
- [ ] Add push notifications for groan day / release day
- [ ] Edit plan functionality

### Phase 5: Polish
- [ ] Groan storytelling carousel animations
- [ ] Week type theming (colors/icons)
- [ ] Onboarding for existing users
- [ ] Analytics tracking

---

## 7. Future Enhancements

- [ ] **Video from Nic** for groan storytelling (replace slide 3-4)
- [ ] **Streak tracking** per week type (e.g., "3 Push Weeks in a row!")
- [ ] **Week reflection** on Sunday before planning next week
- [ ] **Smart suggestions** based on past completions
- [ ] **Group sync** - groups plan together on Sunday

---

## 8. Files to Create/Modify

### New Files
- `src/components/BottomToolbar.jsx`
- `src/components/BottomToolbar.css`
- `src/components/WeeklyPlanningFlow.jsx`
- `src/components/WeeklyPlanningFlow.css`
- `src/components/GroanStorytelling.jsx` (carousel)
- `supabase/migrations/YYYYMMDD_weekly_plans.sql`

### Modified Files
- `src/AppRouter.jsx` - Add toolbar to layout
- `src/Challenge.jsx` - Week header, plan card, auto-roll logic
- `src/hooks/useChallengeData.js` - Fetch/save weekly plans
- `src/App.jsx` - Possibly restructure for toolbar

---

## 9. Open Questions

1. **Edit mid-week?** Can users change their plan after Monday?
2. **Missed groan?** What happens if they don't do their groan on the planned day?
3. **Notifications?** Push notification on groan day morning?
4. **First week?** Special onboarding for brand new users?

---

## 10. Success Metrics

- % of users completing weekly planning
- Weekly groan completion rate
- Morning routine consistency
- User retention week-over-week
- Qualitative: User feedback on intentionality
