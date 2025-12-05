# Flow Tracker & 7-Day Challenge Integration Updates

## Overview
This document outlines the updates made to integrate the Flow Tracker with the 7-Day Challenge, creating a seamless flow for users to log their flow entries directly from challenge quests.

---

## 1. Flow Tracker - Create Project Modal Enhancement

### Location
`/Users/nichurrell/Findmyflow/src/pages/FlowTracker.jsx`

### Changes
Added a second option to the "Create Project" modal that appears when users have no projects.

**Before:**
- Only option: Manually create a project

**After:**
- Option 1: Manually create a project (enter project name)
- **OR** divider
- Option 2: "Complete Flow Finder" button
  - Navigates to `/nikigai/skills`
  - Includes helper text: "Completing the Flow Finder will help you discover your ideal project"

### User Flow
1. User visits `/flow-tracker` with no projects
2. Modal appears with two options
3. User can either:
   - Create a project manually by entering a name
   - Click "Complete Flow Finder" to start the Nikigai flows (which automatically create a project when completed)

---

## 2. Challenge Tracker Quests - Flow Compass Integration

### Location
`/Users/nichurrell/Findmyflow/public/challengeQuestsUpdate.json`

### Changes
Updated the two Tracker category quests to use Flow Compass input instead of plain text.

#### Quest 1: Daily Flow Update
```json
{
  "id": "recognise_flow_update",
  "category": "Tracker",
  "type": "Daily",
  "name": "Daily Flow Update",
  "description": "Log how things flowed for you today using the Flow Compass",
  "points": 4,
  "inputType": "flow_compass",  // Changed from "text"
}
```

#### Quest 2: Weekly Flow Update
```json
{
  "id": "recognise_weekly_flow_update",
  "category": "Tracker",
  "type": "Weekly",
  "name": "Weekly Flow Update",
  "description": "Log how things flowed for you this week using the Flow Compass",
  "points": 25,
  "inputType": "flow_compass",  // Changed from "text"
}
```

### Impact
- Users now see the interactive Flow Compass interface (excited/tired + ease/resistance buttons)
- Submissions automatically create entries in the `flow_entries` table
- Entries appear on the `/flow-tracker` page in project cards and timeline
- Users still earn quest points (4 for daily, 25 for weekly)

---

## 3. Flow Compass Input - Project Check & Redirect

### Location
`/Users/nichurrell/Findmyflow/src/components/FlowCompassInput.jsx`

### Changes
Added logic to check if user has a project before showing the Flow Compass interface.

#### New Imports
```javascript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
```

#### Project Check Logic
```javascript
const [hasProject, setHasProject] = useState(null) // null = loading, true/false = result

useEffect(() => {
  const checkProject = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (error) throw error

      setHasProject(data && data.length > 0)
    } catch (error) {
      console.error('Error checking project:', error)
      setHasProject(false)
    }
  }

  checkProject()
}, [user])
```

#### Conditional Rendering

**State 1: Loading**
```javascript
if (hasProject === null) {
  return <div>Loading...</div>
}
```

**State 2: No Project (Redirect)**
```javascript
if (hasProject === false) {
  return (
    <div>
      <p>To track your flow, you need to set up your Flow Tracker first.</p>
      <button onClick={() => navigate('/flow-tracker')}>
        Start Your Flow Compass →
      </button>
    </div>
  )
}
```

**State 3: Has Project (Normal Flow Compass)**
- Shows the standard Flow Compass interface with direction selection

---

## Complete User Journey

### Scenario 1: User with No Project
1. User is on 7-Day Challenge page
2. User clicks on "Daily Flow Update" or "Weekly Flow Update" quest in the Tracker tab
3. FlowCompassInput component checks for projects
4. No project found → Shows message and "Start Your Flow Compass →" button
5. User clicks button → Redirects to `/flow-tracker`
6. Modal appears with two options:
   - Create project manually
   - Complete Flow Finder (Nikigai)
7. User chooses an option and creates their project
8. User returns to challenge and can now complete flow quests

### Scenario 2: User with Existing Project
1. User is on 7-Day Challenge page
2. User clicks on "Daily Flow Update" or "Weekly Flow Update" quest in the Tracker tab
3. FlowCompassInput component checks for projects
4. Project found → Shows Flow Compass interface
5. User selects direction (North/East/South/West)
6. User adds context and reasoning
7. Quest completion triggers:
   - Creates entry in `quest_completions` table
   - Creates entry in `flow_entries` table
   - Awards quest points
   - Entry appears on `/flow-tracker` page

### Scenario 3: User Completes Nikigai Flow
1. User has no project
2. User completes all 4 Nikigai flows (Skills, Problems, Persona, Integration)
3. Integration flow creates a project automatically with name: `{skillLabel} for {personaLabel}`
4. Project now exists in `user_projects` table
5. User can complete Flow Tracker quests without additional setup

---

## Database Tables Involved

### `user_projects`
- Stores user's flow tracking projects
- Created either manually or via Nikigai Integration flow
- Fields: `id`, `user_id`, `name`, `description`, `status`, `created_at`

### `flow_entries`
- Stores all flow compass entries
- Created when users complete Flow Compass quests
- Fields: `id`, `user_id`, `project_id`, `direction`, `internal_state`, `external_state`, `activity_description`, `reasoning`, `challenge_instance_id`, `logged_at`, `activity_date`

### `quest_completions`
- Stores quest completion records
- Links to `challenge_instance_id`
- Fields: `id`, `user_id`, `challenge_instance_id`, `quest_id`, `quest_category`, `quest_type`, `points_earned`, `reflection_text`, `completed_at`

---

## Benefits

1. **Seamless Integration**: Challenge quests now directly feed into the Flow Tracker system
2. **Clear Onboarding**: Users are guided to set up their Flow Tracker before they can log flow entries
3. **Multiple Entry Points**: Users can create projects via manual creation or Nikigai flows
4. **Automatic Data Flow**: Quest completions automatically appear on the Flow Tracker page
5. **Consistent Experience**: Same Flow Compass interface used across challenge and flow tracker

---

## Testing Checklist

- [ ] User with no project sees redirect button on flow compass quests
- [ ] Redirect button navigates to `/flow-tracker`
- [ ] Create project modal shows both options (manual + Flow Finder)
- [ ] "Complete Flow Finder" button navigates to `/nikigai/skills`
- [ ] Manual project creation works and allows flow quest completion
- [ ] Nikigai flow completion creates project automatically
- [ ] Flow compass quest completion creates entry in `flow_entries` table
- [ ] Flow entries appear on `/flow-tracker` page after quest completion
- [ ] Quest points are awarded correctly (4 for daily, 25 for weekly)
- [ ] User with existing project can complete flow quests immediately

---

## Future Enhancements

1. **Project Selection**: Allow users to select which project to log flow entry to (currently uses `default_project_id` or first project)
2. **Flow History in Challenge**: Show user's flow history within the challenge interface
3. **Streak Tracking**: Track consecutive days of flow logging in challenges
4. **Flow Insights**: Display flow patterns and insights from challenge entries on Flow Tracker page
5. **Bulk Flow Entry**: Allow users to log multiple flow entries at once for weekly quests
