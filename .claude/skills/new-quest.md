---
description: Add a new quest to the 7-day Challenge system
agent: Explore
context: fork
---
# Add New Challenge Quest

You are adding a new quest to FindMyFlow's gamified 7-day Challenge system.

## Steps

1. **Understand the system** - Read these files:
   - `src/hooks/useChallengeData.js` - quest definitions and state management
   - `src/components/QuestCard.jsx` - quest rendering logic
   - `src/Challenge.jsx` - main challenge orchestration

2. **Gather quest details** - Ask user for:
   - Quest name and description
   - Stage (1-7, or 0 for all stages)
   - Category: `groans`, `healing`, `flow-finder`, `bonus`, or `tracker`
   - Frequency: `daily`, `weekly`, or `one-time`
   - Points value
   - Input type needed (reflection, simple complete, custom form)

3. **Quest categories explained**:
   - **Groans**: Recognise, Rewire, Reconnect challenges (comfort zone pushing)
   - **Healing**: Recognise, Release challenges (emotional processing)
   - **Flow Finder**: Discovery flows (Skills, Problems, Persona)
   - **Bonus**: Extra credit activities
   - **Tracker**: Flow compass and metrics logging

4. **Add quest definition** to `useChallengeData.js` in the appropriate quest array

5. **If new input type needed**, create component in `src/components/`:
   - Follow pattern of existing inputs (e.g., `GroanReflectionInput.jsx`)
   - Update `QuestCard.jsx` to render the new input type

6. **If quest completion needs special handling**:
   - Update `src/lib/questCompletionHelpers.js`
   - May need new database table (use `/new-migration` skill)

## Quest Definition Pattern
```javascript
{
  id: 'unique-quest-id',
  name: 'Quest Name',
  description: 'What the user needs to do',
  category: 'groans',
  frequency: 'daily',
  points: 10,
  stage: 1, // or 0 for all stages
  inputType: 'reflection', // or 'simple', 'custom', etc.
}
```

## Output
Summarize changes made and any testing steps needed.
