// Phase 3: Helper functions for special quest completion types
import { supabase } from './supabaseClient';
import { updateStreak } from './streakTracking';

/**
 * Handle conversation_log quest completion
 * - Saves to conversation_logs table
 * - Increments conversations_logged counter in user_stage_progress
 */
export const handleConversationLogCompletion = async (userId, challengeInstanceId, conversationData, stageProgress) => {
  try {
    const { person_type, conversation_summary, key_insights } = conversationData;

    // Get current stage from user_stage_progress
    let currentStage = 'validation'; // default
    if (stageProgress?.current_stage) {
      currentStage = stageProgress.current_stage;
    } else {
      // Try to fetch if not provided
      const { data: progress } = await supabase
        .from('user_stage_progress')
        .select('current_stage')
        .eq('user_id', userId)
        .single();

      if (progress) {
        currentStage = progress.current_stage;
      }
    }

    // Insert conversation log
    const { error: logError } = await supabase
      .from('conversation_logs')
      .insert({
        user_id: userId,
        stage: currentStage,
        conversation_summary,
        key_insights,
        person_type,
        challenge_instance_id: challengeInstanceId
      });

    if (logError) {
      console.error('Error saving conversation log:', logError);
      throw logError;
    }

    // Increment conversations_logged counter
    // First fetch current value, then increment
    const { data: currentProgress, error: fetchError } = await supabase
      .from('user_stage_progress')
      .select('conversations_logged')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching current progress:', fetchError);
    } else {
      const newCount = (currentProgress?.conversations_logged || 0) + 1;
      const { error: incrementError } = await supabase
        .from('user_stage_progress')
        .update({
          conversations_logged: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (incrementError) {
        console.error('Error incrementing conversations:', incrementError);
        // Don't throw - log was saved successfully
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in handleConversationLogCompletion:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle milestone quest completion
 * - Saves to milestone_completions table
 */
export const handleMilestoneCompletion = async (userId, milestoneData, stageProgress, persona) => {
  try {
    const { milestone_type, evidence_text } = milestoneData;

    // Get current stage
    let currentStage = 'validation'; // default
    if (stageProgress?.current_stage) {
      currentStage = stageProgress.current_stage;
    } else {
      const { data: progress } = await supabase
        .from('user_stage_progress')
        .select('current_stage, persona')
        .eq('user_id', userId)
        .single();

      if (progress) {
        currentStage = progress.current_stage;
        persona = persona || progress.persona;
      }
    }

    // Insert milestone completion
    const { error: milestoneError } = await supabase
      .from('milestone_completions')
      .insert({
        user_id: userId,
        milestone_id: milestone_type,
        stage: currentStage,
        persona: persona || 'vibe_seeker',
        evidence_text
      });

    if (milestoneError) {
      // Check if it's a unique constraint violation (already completed)
      if (milestoneError.code === '23505') {
        return {
          success: false,
          error: 'You have already completed this milestone!',
          alreadyCompleted: true
        };
      }
      console.error('Error saving milestone:', milestoneError);
      throw milestoneError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in handleMilestoneCompletion:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update streak after quest completion
 */
export const handleStreakUpdate = async (userId, challengeInstanceId) => {
  try {
    const result = await updateStreak(userId, challengeInstanceId);
    return result;
  } catch (error) {
    console.error('Error updating streak:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's current stage progress
 */
export const getUserStageProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_stage_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching stage progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserStageProgress:', error);
    return null;
  }
};

/**
 * Sync Flow Finder completion with 7-day challenge
 * - Checks if user has an active challenge
 * - Creates quest completion if not already completed
 * - Updates challenge progress points
 * @param {string} userId - User ID
 * @param {string} flowType - One of: 'skills', 'problems', 'persona', 'integration'
 */
export const syncFlowFinderWithChallenge = async (userId, flowType) => {
  try {
    // Map flow types to quest IDs
    const flowToQuestMap = {
      'skills': 'flow_finder_skills',
      'problems': 'flow_finder_problems',
      'persona': 'flow_finder_persona',
      'integration': 'flow_finder_integration'
    };

    const questId = flowToQuestMap[flowType];
    if (!questId) {
      console.log(`⚠️ Unknown flow type: ${flowType}`);
      return { success: false, error: 'Unknown flow type' };
    }

    // Check for active challenge
    const { data: activeChallenge, error: challengeError } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('challenge_start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (challengeError) {
      console.error('Error checking for active challenge:', challengeError);
      return { success: false, error: challengeError.message };
    }

    if (!activeChallenge) {
      console.log('ℹ️ No active challenge found - skipping sync');
      return { success: true, skipped: true, reason: 'No active challenge' };
    }

    // Check if quest already completed in this challenge instance
    const { data: existingCompletion, error: checkError } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_instance_id', activeChallenge.challenge_instance_id)
      .eq('quest_id', questId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing completion:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingCompletion) {
      console.log(`ℹ️ Quest ${questId} already completed in this challenge`);
      return { success: true, skipped: true, reason: 'Already completed' };
    }

    // Get quest details from challengeQuestsUpdate.json (we need points)
    // For now, use known point values
    const questPoints = {
      'flow_finder_skills': 40,
      'flow_finder_problems': 40,
      'flow_finder_persona': 30,
      'flow_finder_integration': 30
    };

    const points = questPoints[questId] || 30;

    // Create quest completion
    const { error: completionError } = await supabase
      .from('quest_completions')
      .insert({
        user_id: userId,
        challenge_instance_id: activeChallenge.challenge_instance_id,
        quest_id: questId,
        quest_category: 'Flow Finder',
        quest_type: 'flow',
        points_earned: points,
        challenge_day: activeChallenge.current_day,
        reflection_text: `Completed ${flowType} flow from home page`
      });

    if (completionError) {
      console.error('Error creating quest completion:', completionError);
      return { success: false, error: completionError.message };
    }

    // Update challenge progress total points
    const newTotalPoints = (activeChallenge.total_points || 0) + points;

    const { error: updateError } = await supabase
      .from('challenge_progress')
      .update({
        total_points: newTotalPoints,
        last_active_date: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('challenge_instance_id', activeChallenge.challenge_instance_id);

    if (updateError) {
      console.error('Error updating challenge progress:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Flow Finder quest ${questId} synced with challenge (+${points} pts)`);
    return { success: true, questId, points, newTotalPoints };
  } catch (error) {
    console.error('Error in syncFlowFinderWithChallenge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle flow_compass quest completion
 * - Saves flow entry to flow_entries table
 * - Links to challenge_instance_id
 * - Optionally extracts tags using AI
 */
export const handleFlowCompassCompletion = async (userId, challengeInstanceId, flowData, fallbackProjectId = null) => {
  try {
    const { direction, internal_state, external_state, activity_description, reasoning, project_id } = flowData;

    // Use project_id from flowData, fallback to parameter
    const finalProjectId = project_id || fallbackProjectId;

    if (!finalProjectId) {
      console.error('No project_id provided for flow entry');
      return { success: false, error: 'Please set up your Flow Compass first' };
    }

    // Insert flow entry
    const { data: newEntry, error: entryError } = await supabase
      .from('flow_entries')
      .insert({
        user_id: userId,
        project_id: finalProjectId,
        direction,
        internal_state,
        external_state,
        activity_description: activity_description || null,
        reasoning,
        challenge_instance_id: challengeInstanceId,
        logged_at: new Date().toISOString(),
        activity_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (entryError) {
      console.error('Error saving flow entry:', entryError);
      throw entryError;
    }

    console.log('✅ Flow entry saved:', newEntry.id);

    // Optionally extract tags using AI (non-blocking)
    try {
      await supabase.functions.invoke('flow-extract-tags', {
        body: {
          entryId: newEntry.id,
          reasoning,
          activityDescription: activity_description
        }
      });
      console.log('✅ Tag extraction triggered');
    } catch (tagError) {
      // Don't fail the whole operation if tag extraction fails
      console.warn('Tag extraction failed (non-critical):', tagError);
    }

    return { success: true, entryId: newEntry.id };
  } catch (error) {
    console.error('Error in handleFlowCompassCompletion:', error);
    return { success: false, error: error.message };
  }
};
