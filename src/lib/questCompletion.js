import { supabase } from './supabaseClient'

/**
 * Auto-completes a challenge quest when a flow is completed
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.flowId - Flow identifier (e.g., 'healing_compass', 'nikigai')
 * @param {number} params.pointsEarned - Points for completing the quest
 * @returns {Promise<Object>} Result object with success status
 */
export async function completeFlowQuest({ userId, flowId, pointsEarned }) {
  try {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'Invalid userId: must be a non-empty string' }
    }
    if (!flowId || typeof flowId !== 'string') {
      return { success: false, error: 'Invalid flowId: must be a non-empty string' }
    }
    if (typeof pointsEarned !== 'number' || pointsEarned < 0) {
      return { success: false, error: 'Invalid pointsEarned: must be a non-negative number' }
    }

    console.log('🎯 completeFlowQuest called:', { userId, flowId, pointsEarned })

    // 1. Check if user has an active challenge
    const { data: activeChallenge, error: challengeError } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (challengeError) {
      console.error('Error fetching active challenge:', challengeError)
      return { success: false, error: challengeError.message }
    }

    if (!activeChallenge) {
      console.log('No active challenge - flow completed but not linked to quest')

      // Still record the flow completion (for future challenges)
      await supabase
        .from('flow_completions')
        .insert([{
          user_id: userId,
          flow_id: flowId,
          challenge_instance_id: null  // Not part of a challenge
        }])

      return {
        success: false,
        reason: 'no_active_challenge',
        message: 'Flow completed successfully, but not linked to any active challenge'
      }
    }

    console.log('Active challenge found:', activeChallenge.challenge_instance_id)

    // 2. Load quest configuration
    const questsResponse = await fetch('/challengeQuestsUpdate.json')
    if (!questsResponse.ok) {
      console.error('Failed to fetch quest configuration:', questsResponse.status)
      return { success: false, error: 'Failed to load quest configuration' }
    }

    const questsData = await questsResponse.json()
    if (!questsData?.quests || !Array.isArray(questsData.quests)) {
      console.error('Invalid quest configuration format')
      return { success: false, error: 'Invalid quest configuration format' }
    }

    const matchingQuest = questsData.quests.find(q => q.flow_id === flowId)

    if (!matchingQuest) {
      console.log('No quest matches this flow ID:', flowId)
      return {
        success: false,
        reason: 'no_matching_quest',
        message: `No quest found with flow_id: ${flowId}`
      }
    }

    console.log('Matching quest found:', matchingQuest.id)

    // 3. Check if quest already completed for this challenge instance
    const { data: existingCompletion } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_instance_id', activeChallenge.challenge_instance_id)
      .eq('quest_id', matchingQuest.id)
      .maybeSingle()

    if (existingCompletion) {
      console.log('Quest already completed for this challenge instance')
      return {
        success: false,
        reason: 'already_completed',
        message: 'This quest has already been completed for your current challenge'
      }
    }

    // 4. Create quest completion
    const { error: completionError } = await supabase
      .from('quest_completions')
      .insert([{
        user_id: userId,
        challenge_instance_id: activeChallenge.challenge_instance_id,
        quest_id: matchingQuest.id,
        quest_category: matchingQuest.category,
        quest_type: matchingQuest.type,
        points_earned: pointsEarned,
        challenge_day: activeChallenge.current_day || 0  // Fallback to 0 if undefined
      }])

    if (completionError) {
      console.error('Error creating quest completion:', completionError)
      return { success: false, error: completionError.message }
    }

    console.log('✅ Quest completion created')

    // 5. Update challenge_progress points
    const categoryLower = matchingQuest.category.toLowerCase()
    const typeKey = matchingQuest.type === 'daily' ? 'daily' : 'weekly'

    // Only these categories have dedicated points columns in challenge_progress
    const categoriesWithColumns = ['recognise', 'release', 'rewire', 'reconnect']
    const hasPointsColumn = categoriesWithColumns.includes(categoryLower)

    const updateData = {
      total_points: (activeChallenge.total_points || 0) + pointsEarned,
      last_active_date: new Date().toISOString()
    }

    // Add category-specific points for Recognise/Release/Rewire/Reconnect quests
    if (hasPointsColumn) {
      const pointsField = `${categoryLower}_${typeKey}_points`
      updateData[pointsField] = (activeChallenge[pointsField] || 0) + pointsEarned
    }

    const { error: updateError } = await supabase
      .from('challenge_progress')
      .update(updateData)
      .eq('user_id', userId)
      .eq('challenge_instance_id', activeChallenge.challenge_instance_id)
      .eq('status', 'active')

    if (updateError) {
      console.error('Error updating challenge progress:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log('✅ Challenge progress updated')

    // 6. Record flow completion
    const { error: flowCompletionError } = await supabase
      .from('flow_completions')
      .insert([{
        user_id: userId,
        flow_id: flowId,
        challenge_instance_id: activeChallenge.challenge_instance_id
      }])

    if (flowCompletionError) {
      console.error('Error recording flow completion:', flowCompletionError)
      // Non-fatal - quest still completed successfully
    }

    console.log('✅ Flow completion recorded')

    return {
      success: true,
      pointsEarned,
      questName: matchingQuest.name,
      message: `Quest "${matchingQuest.name}" completed! +${pointsEarned} points`
    }

  } catch (error) {
    console.error('Error in completeFlowQuest:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if a flow has been completed for the current active challenge
 *
 * @param {string} userId - Authenticated user ID
 * @param {string} flowId - Flow identifier
 * @returns {Promise<boolean>} True if completed
 */
export async function isFlowCompleted(userId, flowId) {
  try {
    // Get active challenge
    const { data: activeChallenge } = await supabase
      .from('challenge_progress')
      .select('challenge_instance_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!activeChallenge) {
      return false
    }

    // Check flow completion for this challenge instance
    const { data } = await supabase
      .from('flow_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('flow_id', flowId)
      .eq('challenge_instance_id', activeChallenge.challenge_instance_id)
      .maybeSingle()

    return !!data
  } catch (error) {
    console.error('Error checking flow completion:', error)
    return false
  }
}

/**
 * Check if a user has an active challenge
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<boolean>} True if user has an active challenge
 */
export async function hasActiveChallenge(userId) {
  try {
    if (!userId) return false

    const { data: activeChallenge } = await supabase
      .from('challenge_progress')
      .select('challenge_instance_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    return !!activeChallenge
  } catch (error) {
    console.error('Error checking active challenge:', error)
    return false
  }
}
