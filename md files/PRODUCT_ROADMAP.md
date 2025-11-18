# Find My Flow - Product Roadmap

## Features Under Development

### Challenge History & Reflection Library
**Priority:** Medium
**Status:** Planned
**Estimated Effort:** 2-3 days

#### Overview
Create a "Challenge History" or "Reflection Library" feature that allows users to view and reflect on their past 7-day challenges and quest completions.

#### User Story
As a user who has completed multiple 7-day challenges, I want to review my past reflections and see my growth over time, so I can track my personal development journey and see patterns in my growth.

#### Technical Implementation Notes

**Database Architecture (Already in place):**
- `challenge_progress` table stores each challenge instance with unique `challenge_instance_id`
- `quest_completions` table stores all quest answers/reflections linked to `challenge_instance_id`
- Old challenges are marked as `status: 'completed'` when archived
- New challenges get new `challenge_instance_id` - no data conflicts

**Data Queries Available:**
```javascript
// Get all completed challenges for a user
const { data: allChallenges } = await supabase
  .from('challenge_progress')
  .select('*')
  .eq('user_id', user.id)
  .order('challenge_start_date', { ascending: false })

// Get all quest completions across ALL challenges
const { data: allCompletions } = await supabase
  .from('quest_completions')
  .select('*')
  .eq('user_id', user.id)
  .order('completed_at', { ascending: false })

// Get completions for a specific past challenge
const { data: challenge1Completions } = await supabase
  .from('quest_completions')
  .select('*')
  .eq('user_id', user.id)
  .eq('challenge_instance_id', 'specific-uuid-here')
```

#### Proposed Features

1. **Challenge History Timeline**
   - List of all completed 7-day challenges
   - Show: Start date, end date, total points earned, completion percentage
   - Visual timeline showing growth over time

2. **Reflection Library**
   - Searchable/filterable view of all quest reflections
   - Filter by: Challenge instance, quest category (Recognise/Release/Rewire/Reconnect), date range
   - Tag reflections with themes or insights

3. **Growth Analytics**
   - Total challenges completed
   - Total quests completed across all challenges
   - Points progression over time (chart/graph)
   - Most active quest categories
   - Streak tracking (consecutive days/weeks of challenge participation)

4. **Past Challenge Deep Dive**
   - Click into any past challenge to see:
     - All quest completions for that 7-day period
     - Artifacts unlocked
     - Daily reflections
     - Protective vs Essence archetype patterns noted

5. **Export & Share**
   - Export reflections as PDF or text
   - Share specific reflections or insights (opt-in)

#### UI/UX Considerations

- Add "History" or "Library" tab to navigation menu
- Design should feel reflective and contemplative
- Use cards or timeline view for past challenges
- Highlight insights or patterns (e.g., "You completed 3 challenges this quarter!")
- Consider a "This day last challenge" feature to show progress

#### Technical Considerations

**Backend:**
- No database schema changes needed - architecture already supports this
- May need to add indexes on `challenge_instance_id` and `user_id` for query performance
- Consider pagination for users with many challenges

**Frontend:**
- New route: `/challenge-history` or `/reflection-library`
- Reusable components for displaying quest reflections
- Chart library for growth visualization (e.g., Recharts, Chart.js)

**Performance:**
- Cache historical data (doesn't change often)
- Lazy load challenge details (load summary first, details on click)
- Consider implementing infinite scroll for long lists

#### Dependencies
- None - can be built as standalone feature
- Optional: Chart visualization library

#### Success Metrics
- % of users who view their challenge history after completing 2+ challenges
- Time spent in reflection library
- User feedback on value of reviewing past reflections

---

## Backlog

*Add future features here as they're identified*

---

## Completed Features

*Move features here once shipped*
