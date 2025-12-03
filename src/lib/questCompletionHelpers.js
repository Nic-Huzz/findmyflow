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
    const { error: incrementError } = await supabase
      .from('user_stage_progress')
      .update({
        conversations_logged: supabase.raw('conversations_logged + 1'),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (incrementError) {
      console.error('Error incrementing conversations:', incrementError);
      // Don't throw - log was saved successfully
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
 * Handle flow_compass quest completion
 * - Saves flow entry to flow_entries table
 * - Links to challenge_instance_id
 * - Optionally extracts tags using AI
 */
export const handleFlowCompassCompletion = async (userId, challengeInstanceId, flowData, projectId = null) => {
  try {
    const { direction, internal_state, external_state, activity_description, reasoning } = flowData;

    // Insert flow entry
    const { data: newEntry, error: entryError } = await supabase
      .from('flow_entries')
      .insert({
        user_id: userId,
        project_id: projectId,
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
