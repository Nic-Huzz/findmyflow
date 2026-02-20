// Phase 3: Helper functions for special quest completion types
import { supabase } from './supabaseClient';
import { updateStreak } from './streakTracking';
import { normalizePersona } from '../data/personaProfiles';
import { syncScoreToLeaderboard } from './scoringCategories';

/**
 * Handle conversation_log quest completion
 * - Saves to conversation_logs table
 * - Increments conversations_logged counter in user_stage_progress
 * - Creates milestone when milestone_count is reached (e.g., validation_responses_3 after 3 logs)
 */
export const handleConversationLogCompletion = async (userId, challengeInstanceId, conversationData, stageProgress, quest = null, projectId = null) => {
  try {
    const { person_type, conversation_summary, key_insights } = conversationData;

    // Get current stage and persona from user_stage_progress
    let currentStage = 'validation'; // default
    let persona = stageProgress?.persona || 'vibe_riser';
    if (stageProgress?.current_stage) {
      currentStage = stageProgress.current_stage;
    } else {
      // Try to fetch if not provided
      const { data: progress } = await supabase
        .from('user_stage_progress')
        .select('current_stage, persona')
        .eq('user_id', userId)
        .single();

      if (progress) {
        currentStage = progress.current_stage;
        persona = progress.persona;
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
        challenge_instance_id: challengeInstanceId,
        project_id: projectId
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

    let newCount = 1;
    if (fetchError) {
      console.error('Error fetching current progress:', fetchError);
    } else {
      newCount = (currentProgress?.conversations_logged || 0) + 1;
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

    // Check if we should create a milestone (e.g., after 3 conversations)
    if (quest?.milestone_type && quest?.milestone_count) {
      if (newCount >= quest.milestone_count) {
        // Check if milestone already exists
        const { data: existingMilestone } = await supabase
          .from('milestone_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('milestone_id', quest.milestone_type)
          .maybeSingle();

        if (!existingMilestone) {
          // Create the milestone
          const { error: milestoneError } = await supabase
            .from('milestone_completions')
            .insert({
              user_id: userId,
              milestone_id: quest.milestone_type,
              stage: currentStage,
              persona: normalizePersona(persona),
              evidence_text: `Completed ${newCount} conversations`
            });

          if (milestoneError) {
            console.error('Error creating milestone from conversations:', milestoneError);
          }
        }
      }
    }

    return { success: true, conversationCount: newCount };
  } catch (error) {
    console.error('Error in handleConversationLogCompletion:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle milestone quest completion
 * - Saves to milestone_completions table
 */
export const handleMilestoneCompletion = async (userId, milestoneData, stageProgress, persona, projectId = null) => {
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
        evidence_text,
        project_id: projectId
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
 * Sync Flow Finder completion with user-level quest completions
 * - Creates quest completion with challenge_instance_id: null (user-level)
 * - Flow Finder completions persist across all challenges
 * - Syncs points to user-level leaderboard (project_id: null)
 * @param {string} userId - User ID
 * @param {string} flowType - One of: 'skills', 'problems', 'persona', 'integration', 'mind_space', etc.
 */
export const syncFlowFinderWithChallenge = async (userId, flowType) => {
  try {
    // Map flow types to quest IDs (must match public/challengeQuestsUpdate.json)
    const flowToQuestMap = {
      'skills': 'flow_finder_skills',
      'problems': 'flow_finder_problems',
      'persona': 'flow_finder_persona',
      'integration': 'flow_finder_integration',
      'play_list_finder': 'play_list_finder',
      'play_list_explainer': 'play_list_explainer',
      'persona_identifier': 'persona_identifier',
      'flow_finder_explainer': 'flow_finder_explainer',
      'validation_explainer': 'validation_explainer',
      'product_explainer': 'product_explainer',
      'testing_explainer': 'testing_explainer',
      'offer_creation_explainer': 'offer_creation_explainer',
      'campaign_explainer': 'campaign_explainer',
      'launch_explainer': 'launch_explainer',
      'mind_space': 'mind_space_extraction',  // Matches JSON quest ID
      'milestone_read_money_model': 'milestone_read_money_model',  // Money Model Guide explainer
      'product_suite_map': 'product_suite_map',  // Product Suite Map builder
      // Healing explainers
      'what_is_healing_explainer': 'what_is_healing_explainer',
      'emotional_splinter_explainer': 'emotional_splinter_explainer',
      'how_do_we_heal_explainer': 'how_do_we_heal_explainer'
    };

    const questId = flowToQuestMap[flowType];
    if (!questId) {
      console.warn(`Unknown flow type: ${flowType}`);
      return { success: false, error: 'Unknown flow type' };
    }

    // Quests that allow multiple completions
    const repeatableQuests = {
      'play_list_finder': 10
    };

    // Check if quest already completed at user level (challenge_instance_id IS NULL)
    const { data: existingCompletions, error: checkError } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .is('challenge_instance_id', null)
      .eq('quest_id', questId);

    if (checkError) {
      console.error('Error checking existing completion:', checkError);
      return { success: false, error: checkError.message };
    }

    const maxCompletions = repeatableQuests[questId] || 1;
    if (existingCompletions && existingCompletions.length >= maxCompletions) {
      return { success: true, skipped: true, reason: 'Already completed' };
    }

    // Points per quest (must match public/challengeQuestsUpdate.json)
    const questPoints = {
      'flow_finder_skills': 5,
      'flow_finder_problems': 5,
      'flow_finder_persona': 4,
      'flow_finder_integration': 4,
      'flow_finder_explainer': 5,
      'validation_explainer': 5,
      'product_explainer': 5,
      'testing_explainer': 5,
      'offer_creation_explainer': 5,
      'campaign_explainer': 5,
      'launch_explainer': 5,
      'play_list_finder': 7,
      'play_list_explainer': 5,
      'persona_identifier': 10,
      'mind_space_extraction': 10,  // Matches JSON quest ID
      'milestone_read_money_model': 5,  // Money Model Guide explainer
      'product_suite_map': 6,  // Product Suite Map builder
      // Healing explainers
      'what_is_healing_explainer': 5,
      'emotional_splinter_explainer': 5,
      'how_do_we_heal_explainer': 5
    };

    const points = questPoints[questId] || 5;

    // Stage per quest (default 0 for Flow Finder)
    const questStages = {
      'validation_explainer': 1,
      'product_explainer': 2,
      'testing_explainer': 3,
      'product_suite_map': 4,
      'offer_creation_explainer': 5,
      'campaign_explainer': 6,
      'launch_explainer': 7
    };
    const stage = questStages[questId] || 0;

    // Create quest completion at user level (challenge_instance_id: null)
    const { error: completionError } = await supabase
      .from('quest_completions')
      .insert({
        user_id: userId,
        challenge_instance_id: null,  // User-level completion
        quest_id: questId,
        quest_category: 'Business',
        quest_type: 'flow',
        points_earned: points,
        challenge_day: 0,
        reflection_text: `Completed ${flowType} flow`,
        project_id: null,  // User-level, not project-specific
        stage
      });

    if (completionError) {
      console.error('Error creating quest completion:', completionError);
      return { success: false, error: completionError.message };
    }

    // Sync to user-level leaderboard (project_id: null) - non-blocking
    try {
      await syncScoreToLeaderboard(supabase, {
        userId,
        questCategory: 'Business',
        points,
        projectId: null,  // User-level scores
        source: `flow_finder_${flowType}`
      });
    } catch (leaderboardError) {
      // Don't fail the whole operation if leaderboard sync fails
      console.error('Non-critical: Failed to sync to leaderboard:', leaderboardError);
    }

    return { success: true, questId, points };
  } catch (error) {
    console.error('Error in syncFlowFinderWithChallenge:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync Healing explainer completion with the challenge system.
 * Same pattern as syncFlowFinderWithChallenge but uses quest_category: 'Healing'.
 *
 * @param {string} userId
 * @param {string} flowType - One of: 'what_is_healing_explainer', 'emotional_splinter_explainer', 'how_do_we_heal_explainer'
 */
export const syncHealingExplainerWithChallenge = async (userId, flowType) => {
  try {
    const healingExplainerMap = {
      'what_is_healing_explainer': 'what_is_healing_explainer',
      'emotional_splinter_explainer': 'emotional_splinter_explainer',
      'how_do_we_heal_explainer': 'how_do_we_heal_explainer'
    };

    const questId = healingExplainerMap[flowType];
    if (!questId) {
      console.warn(`Unknown healing explainer type: ${flowType}`);
      return { success: false, error: 'Unknown flow type' };
    }

    // Check if already completed at user level
    const { data: existingCompletion, error: checkError } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .is('challenge_instance_id', null)
      .eq('quest_id', questId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing completion:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingCompletion) {
      return { success: true, skipped: true, reason: 'Already completed' };
    }

    const points = 5;

    const { error: completionError } = await supabase
      .from('quest_completions')
      .insert({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: questId,
        quest_category: 'Healing',
        quest_type: 'flow',
        points_earned: points,
        challenge_day: 0,
        reflection_text: `Completed ${flowType}`,
        project_id: null,
        stage: 0
      });

    if (completionError) {
      console.error('Error creating healing explainer completion:', completionError);
      return { success: false, error: completionError.message };
    }

    // Sync to user-level leaderboard - non-blocking
    try {
      await syncScoreToLeaderboard(supabase, {
        userId,
        questCategory: 'Healing',
        points,
        projectId: null,
        source: `healing_${flowType}`
      });
    } catch (leaderboardError) {
      console.error('Non-critical: Failed to sync to leaderboard:', leaderboardError);
    }

    return { success: true, questId, points };
  } catch (error) {
    console.error('Error in syncHealingExplainerWithChallenge:', error);
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

    // Optionally extract tags using AI (non-blocking)
    try {
      await supabase.functions.invoke('flow-extract-tags', {
        body: {
          entryId: newEntry.id,
          reasoning,
          activityDescription: activity_description
        }
      });
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

/**
 * Handle validation responses analysis quest completion
 * - Creates milestone for validation analysis complete
 * - Links to the validation_analysis record
 */
export const handleValidationAnalysisCompletion = async (userId, analysisData, stageProgress, projectId = null) => {
  try {
    const { analysis_id, total_responses, flows_analyzed } = analysisData;

    // Get current stage
    let currentStage = 'validation';
    let persona = stageProgress?.persona || 'vibe_riser';
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
        persona = progress.persona;
      }
    }

    // Check if milestone already exists
    const { data: existingMilestone } = await supabase
      .from('milestone_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('milestone_id', 'validation_analysis_complete')
      .maybeSingle();

    if (existingMilestone) {
      return {
        success: false,
        error: 'You have already completed validation analysis!',
        alreadyCompleted: true
      };
    }

    // Create milestone completion
    const { error: milestoneError } = await supabase
      .from('milestone_completions')
      .insert({
        user_id: userId,
        milestone_id: 'validation_analysis_complete',
        stage: currentStage,
        persona: normalizePersona(persona),
        evidence_text: `Analyzed ${total_responses} responses across ${flows_analyzed} validation flow(s). Analysis ID: ${analysis_id}`,
        project_id: projectId
      });

    if (milestoneError) {
      console.error('Error creating validation analysis milestone:', milestoneError);
      throw milestoneError;
    }

    return { success: true, analysisId: analysis_id };
  } catch (error) {
    console.error('Error in handleValidationAnalysisCompletion:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle groan reflection quest completion
 * - Saves to groan_reflections table
 * - Captures protective archetype, fear type, and flow direction
 * - Used for AI personalization and healing journey tracking
 */
export const handleGroanReflectionCompletion = async (userId, groanData, questCompletionId = null) => {
  try {
    const {
      groan_task,
      protective_archetype,
      fear_type,
      fear_types, // Support both singular and array formats
      flow_direction,
      reflection_note,
      project_id,
      challenge_instance_id,
      quest_category,
      stage
    } = groanData;

    // Handle both fear_type (singular) and fear_types (array) formats
    // Store as comma-separated string if array, or use singular value
    let fearTypeValue = fear_type;
    if (fear_types && Array.isArray(fear_types) && fear_types.length > 0) {
      fearTypeValue = fear_types.join(',');
    }

    // Insert groan reflection
    const { data: newReflection, error: reflectionError } = await supabase
      .from('groan_reflections')
      .insert({
        user_id: userId,
        quest_completion_id: questCompletionId,
        project_id: project_id || null,
        challenge_instance_id: challenge_instance_id || null,
        protective_archetype,
        fear_type: fearTypeValue,
        flow_direction,
        reflection_note: reflection_note || null,
        quest_category: quest_category || 'Groans',
        stage: stage || null,
        groan_task: groan_task || null
      })
      .select()
      .single();

    if (reflectionError) {
      console.error('Error saving groan reflection:', reflectionError);
      throw reflectionError;
    }

    return { success: true, reflectionId: newReflection.id };
  } catch (error) {
    console.error('Error in handleGroanReflectionCompletion:', error);
    return { success: false, error: error.message };
  }
};
