import { supabase } from './supabaseClient'
import { cacheBustUrl } from './fetchJson'
import { syncScoreToLeaderboard } from './scoringCategories'

/**
 * Auto-completes a challenge quest when a flow is completed
 *
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.flowId - Flow identifier (e.g., 'healing_compass', 'nikigai')
 * @param {number} params.pointsEarned - Points for completing the quest
 * @returns {Promise<Object>} Result object with success status
 */
export async function completeFlowQuest({ userId, flowId, pointsEarned, projectId = null }) {
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
      // Still record the flow completion (for future challenges)
      const { error: flowError } = await supabase
        .from('flow_completions')
        .insert([{
          user_id: userId,
          flow_id: flowId,
          challenge_instance_id: null  // Not part of a challenge
        }])

      if (flowError) {
        console.error('Error recording flow completion (no active challenge):', flowError)
        // Non-fatal - just log, don't fail
      }

      return {
        success: false,
        reason: 'no_active_challenge',
        message: 'Flow completed successfully, but not linked to any active challenge'
      }
    }

    // 2. Load quest configuration
    const questsResponse = await fetch(cacheBustUrl('/challengeQuestsUpdate.json'))
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
      return {
        success: false,
        reason: 'no_matching_quest',
        message: `No quest found with flow_id: ${flowId}`
      }
    }

    // 3. Check if quest already completed (by user + quest + project, matching DB unique index)
    let dupQuery = supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('quest_id', matchingQuest.id)
    if (projectId) {
      dupQuery = dupQuery.eq('project_id', projectId)
    } else {
      dupQuery = dupQuery.is('project_id', null)
    }
    const { data: existingCompletion } = await dupQuery.limit(1).maybeSingle()

    if (existingCompletion) {
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
        challenge_day: activeChallenge.current_day || 0,
        project_id: projectId || null
      }])

    if (completionError) {
      // 23505 = unique constraint violation — quest already completed, not an error
      if (completionError.code === '23505') {
        return { success: false, reason: 'already_completed', message: 'Quest already completed' }
      }
      console.error('Error creating quest completion:', completionError)
      return { success: false, error: completionError.message }
    }

    // 5. Update challenge_progress points
    // R-type is now in matchingQuest.type (Recognise, Release, Rewire, Reconnect)
    // Frequency is in matchingQuest.frequency (daily, weekly, anytime)
    const rType = matchingQuest.type?.toLowerCase()
    const frequency = matchingQuest.frequency || 'daily'
    const frequencyKey = frequency === 'weekly' ? 'weekly' : 'daily'

    // Only these R-types have dedicated points columns in challenge_progress
    const rTypesWithColumns = ['recognise', 'release', 'rewire', 'reconnect']
    const hasPointsColumn = rTypesWithColumns.includes(rType)

    const updateData = {
      total_points: (activeChallenge.total_points || 0) + pointsEarned,
      last_active_date: new Date().toISOString()
    }

    // Add R-type-specific points for Recognise/Release/Rewire/Reconnect quests
    if (hasPointsColumn) {
      const pointsField = `${rType}_${frequencyKey}_points`
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

    // 5b. Sync to leaderboard scoring system (non-blocking)
    syncScoreToLeaderboard(supabase, {
      userId,
      questCategory: matchingQuest.category,
      points: pointsEarned,
      projectId: projectId || null,
      source: `flow_quest:${flowId}`
    }).catch(err => {
      console.warn('Leaderboard sync failed (non-blocking):', err)
    })

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
