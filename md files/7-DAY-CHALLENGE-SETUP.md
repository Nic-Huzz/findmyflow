# 7-Day Challenge Setup Guide

## Overview
Your 7-Day Challenge feature has been successfully built and integrated into the Find My Flow app! This guide will help you get it running.

## Files Created

### 1. Core Component Files
- **src/Challenge.jsx** - Main challenge component with quest system, tabs, and progress tracking
- **src/Challenge.css** - Styled to match your existing gradient aesthetic (purple to yellow)
- **public/challengeQuests.json** - All quest data organized by category and type

### 2. Database Migration
- **supabase-migration-challenge.sql** - SQL script to create the required tables

### 3. Updated Files
- **src/AppRouter.jsx** - Added `/7-day-challenge` route
- **src/Profile.jsx** - Added "Start 7-Day Challenge" button

## Setup Instructions

### Step 1: Run Database Migration

1. Log into your Supabase dashboard
2. Go to the SQL Editor
3. Open the file `supabase-migration-challenge.sql`
4. Copy the entire SQL content and paste it into the SQL Editor
5. Click "Run" to execute the migration

This will create:
- `challenge_progress` table (tracks user progress, points, artifacts)
- `quest_completions` table (tracks completed quests)
- Proper indexes for performance
- Row Level Security (RLS) policies
- Auto-update triggers

### Step 2: Verify Environment Variables

Make sure your `.env` file has these variables set:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Test the Feature

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/me` (your profile page)

3. Click "Start 7-Day Challenge" button

4. You'll see the onboarding screen - click "Start My 7-Day Journey"

5. Complete a quest to test the points system

## Feature Highlights

### Quest System
- **Daily Quests** (3-5 points) - Reset at midnight
- **Weekly Quests** (15-30 points) - Available all 7 days
- **Bonus Quests** (5-10 points) - Anytime completion
- Text reflections or simple checkboxes
- Automatic point calculation

### Four Categories
1. **Recognise** 🔍 - Build awareness of patterns
2. **Release** 🕊️ - Let go of what doesn't serve
3. **Rewire** ⚡ - Create new behaviors
4. **Reconnect** 🌊 - Anchor into true self

### Artifact System
Users unlock artifacts by earning category-specific points:
- **Essence Boat** (Recognise): 50 weekly + 40 daily = 90 total
- **Captain's Hat** (Release): 30 weekly + 30 daily = 60 total
- **Treasure Map** (Rewire): 60 weekly + 50 daily = 110 total
- **Sailing Sails** (Reconnect): 40 weekly + 50 daily = 90 total

Progress bars show current progress toward unlocking each artifact.

### Day Counter
- Automatically advances each day (up to Day 7)
- Tracks when user was last active
- Daily quests reset at midnight

## Quest Data Structure

The `challengeQuests.json` file contains all quests with:
- `id` - Unique identifier
- `category` - Recognise, Release, Rewire, Reconnect, or Bonus
- `type` - daily, weekly, or anytime
- `name` - Quest title
- `description` - What the user needs to do (you can edit these!)
- `points` - Points awarded
- `inputType` - text or checkbox
- `placeholder` - For text input fields

**Feel free to edit quest descriptions** to better match your vision!

## Database Schema

### challenge_progress table
```
- id (UUID, primary key)
- user_id (UUID, references auth.users)
- session_id (text)
- current_day (integer, 1-7)
- challenge_start_date (timestamp)
- last_active_date (timestamp)
- total_points (integer)
- [category]_daily_points (integer) x4
- [category]_weekly_points (integer) x4
- [artifact]_unlocked (boolean) x4
- created_at, updated_at (timestamps)
```

### quest_completions table
```
- id (UUID, primary key)
- user_id (UUID, references auth.users)
- quest_id (text)
- quest_category (text)
- quest_type (text)
- points_earned (integer)
- reflection_text (text, nullable)
- completed_at (timestamp)
- challenge_day (integer)
- created_at (timestamp)
```

## Styling

The component uses your existing color scheme:
- **Purple gradient** (#5e17eb to #8b5cf6) for headers and buttons
- **Yellow/Gold** (#ffdd27) for bonus quests and artifacts
- **Card-based layout** with 16px border radius
- **Responsive design** - mobile-first approach
- **Smooth animations** on hover and interactions

## Next Steps (Phase 2 - Not Yet Built)

The following features are planned but NOT included in this MVP:
- Photo uploads for quest completions
- Actual artifact unlocking ceremony/animation
- Leaderboard
- Push notifications
- Celebration animations
- Team challenges

## Troubleshooting

### Users can't see the challenge
- Verify they've completed the lead magnet flow
- Check they have an email in the database
- Ensure they're authenticated

### Quests not completing
- Check browser console for errors
- Verify Supabase tables were created
- Check RLS policies are active

### Points not calculating
- Verify quest completion was saved to database
- Check challenge_progress table for updated points
- Look for any JavaScript errors in console

## Testing Checklist

- [ ] Database tables created successfully
- [ ] User can access /7-day-challenge route
- [ ] Onboarding screen displays correctly
- [ ] Challenge initializes on first visit
- [ ] Daily quests can be completed
- [ ] Weekly quests can be completed
- [ ] Bonus quests can be completed
- [ ] Points calculate correctly
- [ ] Progress bars update
- [ ] Day counter advances
- [ ] Tabs switch between categories
- [ ] Mobile responsive design works
- [ ] Artifact progress tracks correctly

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs for database issues
3. Verify all environment variables are set
4. Ensure migration was run successfully

Enjoy your 7-day challenge feature! 🚀
