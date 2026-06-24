# Phase 3 Integration Guide

## Components Created

All the necessary files have been created. Now you need to integrate them into Challenge.jsx.

## Step 1: Add Imports to Challenge.jsx

At the top of `src/Challenge.jsx`, add these imports:

```javascript
import ConversationLogInput from './components/ConversationLogInput'
import MilestoneInput from './components/MilestoneInput'
import {
  handleConversationLogCompletion,
  handleMilestoneCompletion,
  handleStreakUpdate,
  getUserStageProgress
} from './lib/questCompletionHelpers'
import { initializeUserStageProgress } from './lib/graduationChecker'
```

## Step 2: Add State for Stage Progress

In the state declarations section (around line 20-40), add:

```javascript
const [stageProgress, setStageProgress] = useState(null)
```

## Step 3: Load Stage Progress

In the `useEffect` that loads user data (around line 56-64), add a call to load stage progress:

```javascript
useEffect(() => {
  if (user) {
    loadUserProgress()
    loadLeaderboard()
    loadUserData()
    checkNervousSystemComplete()
    checkHealingCompassComplete()
    loadStageProgress() // ADD THIS LINE
  }
}, [user])
```

Then add the function to load stage progress:

```javascript
const loadStageProgress = async () => {
  if (!user?.id) return

  try {
    const progress = await getUserStageProgress(user.id)
    setStageProgress(progress)

    // If no stage progress exists and user has a persona, initialize it
    if (!progress && userData?.persona) {
      const result = await initializeUserStageProgress(user.id, userData.persona)
      if (result.success) {
        setStageProgress(result.data)
      }
    }
  } catch (error) {
    console.error('Error loading stage progress:', error)
  }
}
```

## Step 4: Update handleQuestComplete Function

Replace the existing `handleQuestComplete` function (starts around line 628) with this enhanced version:

```javascript
const handleQuestComplete = async (quest, specialData = null) => {
  const inputValue = specialData || questInputs[quest.id]

  // Validate input based on type
  if (quest.inputType === 'text' && (!inputValue || inputValue.trim() === '')) {
    alert('Please enter your reflection before completing this quest.')
    return
  }

  if (quest.inputType === 'conversation_log' && !specialData) {
    alert('Please fill out the conversation details.')
    return
  }

  if (quest.inputType === 'milestone' && !specialData) {
    alert('Please describe what you accomplished.')
    return
  }

  // Sanitize reflection text for text inputs
  const sanitizedReflection = (quest.inputType === 'text' && inputValue)
    ? sanitizeText(inputValue)
    : null

  try {
    // Handle special quest types BEFORE creating quest completion
    if (quest.inputType === 'conversation_log') {
      const result = await handleConversationLogCompletion(
        user.id,
        progress.challenge_instance_id,
        specialData,
        stageProgress
      )

      if (!result.success) {
        alert(`Error logging conversation: ${result.error}`)
        return
      }

      // Reload stage progress to update conversation count
      await loadStageProgress()
    }

    if (quest.inputType === 'milestone') {
      const result = await handleMilestoneCompletion(
        user.id,
        specialData,
        stageProgress,
        userData?.persona
      )

      if (!result.success) {
        if (result.alreadyCompleted) {
          alert('You have already completed this milestone!')
        } else {
          alert(`Error saving milestone: ${result.error}`)
        }
        return
      }

      // Reload stage progress
      await loadStageProgress()
    }

    // Create quest completion record
    const completionData = {
      user_id: user.id,
      challenge_instance_id: progress.challenge_instance_id,
      quest_id: quest.id,
      quest_category: quest.category,
      quest_type: quest.type,
      points_earned: quest.points,
      challenge_day: progress.current_day
    }

    // Add reflection_text for text inputs, or structured data for special types
    if (quest.inputType === 'text') {
      completionData.reflection_text = sanitizedReflection
    } else if (quest.inputType === 'conversation_log' || quest.inputType === 'milestone') {
      completionData.reflection_text = JSON.stringify(specialData)
    }

    const { error: completionError } = await supabase
      .from('quest_completions')
      .insert([completionData])

    if (completionError) {
      console.error('Error completing quest:', completionError)
      alert('Error completing quest. Please try again.')
      return
    }

    // Update streak
    await handleStreakUpdate(user.id, progress.challenge_instance_id)

    // Calculate new points
    const categoryLower = quest.category.toLowerCase()
    const typeKey = quest.type === 'daily' ? 'daily' : 'weekly'

    // Handle Bonus category specially (no bonus_*_points columns in DB)
    const isBonus = quest.category === 'Bonus'
    const pointsField = isBonus ? null : `${categoryLower}_${typeKey}_points`

    const newCategoryPoints = isBonus ? 0 : (progress[pointsField] || 0) + quest.points
    const newTotalPoints = (progress.total_points || 0) + quest.points

    // Check artifact unlock conditions (not applicable for Bonus)
    const artifacts = challengeData?.artifacts || []
    const categoryArtifact = artifacts.find(a => a.category === quest.category)
    const artifactUnlocked = categoryArtifact ? checkArtifactUnlock(quest.category, newCategoryPoints, typeKey) : false

    // Update progress
    const updateData = {
      total_points: newTotalPoints,
      last_active_date: new Date().toISOString()
    }

    // Only add category points field if not Bonus
    if (!isBonus && pointsField) {
      updateData[pointsField] = newCategoryPoints
    }

    if (artifactUnlocked && categoryArtifact) {
      const artifactKey = `${categoryArtifact.id}_unlocked`
      updateData[artifactKey] = true
    }

    const { data: updatedProgress, error: progressError } = await supabase
      .from('challenge_progress')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('challenge_instance_id', progress.challenge_instance_id)
      .eq('status', 'active')
      .select()
      .single()

    if (progressError) {
      console.error('Error updating progress:', progressError)
      alert('Error updating progress. Please try again.')
      return
    }

    setProgress(updatedProgress)

    // Reload completions for this challenge instance
    const { data: newCompletions } = await supabase
      .from('quest_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_instance_id', progress.challenge_instance_id)

    setCompletions(newCompletions || [])

    // Clear input
    setQuestInputs(prev => ({ ...prev, [quest.id]: '' }))

    // Show success message
    let successMessage = `✅ Quest complete! +${quest.points} points`

    if (quest.counts_toward_graduation) {
      successMessage += '\n✨ Progress toward graduation!'
    }

    if (artifactUnlocked) {
      successMessage = `🎉 Quest complete! +${quest.points} points\n\n✨ You unlocked the ${categoryArtifact.name}!`
    }

    alert(successMessage)
  } catch (error) {
    console.error('Error in handleQuestComplete:', error)
    alert('Error completing quest. Please try again.')
  }
}
```

## Step 5: Add Quest Input Rendering

In the JSX rendering section where quests are displayed, find where the input fields are rendered and add cases for the new input types. Look for the quest rendering loop (around line 1400-1700) and update it:

```javascript
{/* Existing text input */}
{quest.inputType === 'text' && (
  <textarea
    value={questInputs[quest.id] || ''}
    onChange={(e) => setQuestInputs({ ...questInputs, [quest.id]: e.target.value })}
    placeholder={quest.placeholder || 'Share your reflection...'}
  />
)}

{/* Existing checkbox input */}
{quest.inputType === 'checkbox' && (
  <button onClick={() => handleQuestComplete(quest)}>
    Complete
  </button>
)}

{/* NEW: Conversation log input */}
{quest.inputType === 'conversation_log' && (
  <ConversationLogInput
    quest={quest}
    onComplete={(quest, data) => handleQuestComplete(quest, data)}
  />
)}

{/* NEW: Milestone input */}
{quest.inputType === 'milestone' && (
  <MilestoneInput
    quest={quest}
    onComplete={(quest, data) => handleQuestComplete(quest, data)}
  />
)}
```

## Step 6: Test the Integration

1. Start your dev server: `npm run dev`
2. Navigate to the 7-day challenge page
3. Test conversation log quests
4. Test milestone quests
5. Check the database to ensure data is being saved correctly
6. Navigate to your profile to see the stage progress card

## Verification Checklist

- [ ] Conversation logs save to `conversation_logs` table
- [ ] Conversation counter increments in `user_stage_progress`
- [ ] Milestones save to `milestone_completions` table
- [ ] Streaks update correctly
- [ ] Stage progress card shows on profile
- [ ] Graduation modal appears when eligible
- [ ] Edge function deploys successfully
