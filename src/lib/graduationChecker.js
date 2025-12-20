// Phase 3: Graduation Eligibility Checker
// Checks if user meets requirements to graduate to the next stage
//
// Updated Dec 2024: Added project-based graduation check functions
// See docs/2024-12-20-major-refactor-plan.md for architecture details

import { supabase } from './supabaseClient';
import { PERSONA_STAGES, getNextStage, getStageCelebration, getInitialStage, getAllMilestones } from './personaStages';
import { normalizePersona } from '../data/personaProfiles';
import { STAGE_CONFIG, getStageConfig, getGroanChallengeId } from './stageConfig';

// Check if user has completed required flows
const checkFlowsCompleted = async (userId, flowsRequired = []) => {
  if (!flowsRequired || flowsRequired.length === 0) return { allCompleted: true, completedFlows: [] };

  try {
    // Query flow_sessions to check for completed flows
    const { data: completedSessions, error } = await supabase
      .from('flow_sessions')
      .select('flow_type, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('flow_type', flowsRequired);

    // If error, return false gracefully
    if (error) {
      console.warn('Flow check error (flows may not exist yet):', error.message);
      return { allCompleted: false, completedFlows: [] };
    }

    // Get unique flow types that have been completed
    const completedFlowTypes = new Set(completedSessions?.map(s => s.flow_type) || []);

    // Check if all required flows have been completed
    const allCompleted = flowsRequired.every(flow => completedFlowTypes.has(flow));

    console.log('✅ Flow completion check:', {
      required: flowsRequired,
      completed: Array.from(completedFlowTypes),
      allCompleted
    });

    return { allCompleted, completedFlows: Array.from(completedFlowTypes) };
  } catch (error) {
    console.warn('Error checking flows:', error);
    return { allCompleted: false, completedFlows: [] }; // Gracefully fail - flows don't exist yet
  }
};

// Check if user has completed required milestones (combines milestones and milestones_additional)
// Now persona-aware to prevent cross-persona milestone contamination
// Groan Challenge must be completed within the current 7-day challenge
const checkMilestones = async (userId, persona, milestonesRequired = [], milestonesAdditional = []) => {
  const allMilestones = [...milestonesRequired, ...milestonesAdditional];
  if (!allMilestones || allMilestones.length === 0) return true;

  // Get active challenge start date for groan_challenge check
  const { data: activeChallenge } = await supabase
    .from('challenge_progress')
    .select('challenge_start_date')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('challenge_start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const challengeStartDate = activeChallenge?.challenge_start_date;

  // Get all completed milestones for this persona
  const { data: completedMilestones } = await supabase
    .from('milestone_completions')
    .select('milestone_id, created_at')
    .eq('user_id', userId)
    .eq('persona', persona)
    .in('milestone_id', allMilestones);

  // Check each required milestone
  return allMilestones.every(milestone => {
    const completion = completedMilestones?.find(m => m.milestone_id === milestone);
    if (!completion) return false;

    // Groan Challenge must be completed within the current 7-day challenge
    if (milestone === 'groan_challenge_completed' && challengeStartDate) {
      const completedAt = new Date(completion.created_at);
      const challengeStart = new Date(challengeStartDate);
      if (completedAt < challengeStart) {
        console.log('⚠️ Groan challenge was completed before current challenge started');
        return false;
      }
    }

    return true;
  });
};

// Check if user has met challenge streak requirement
// Uses longest_streak from the ACTIVE challenge (current persona/stage)
const checkStreak = async (userId, streakRequired) => {
  if (!streakRequired) return true;

  // Get the active challenge for this user (corresponds to current persona/stage)
  const { data: activeChallenge } = await supabase
    .from('challenge_progress')
    .select('longest_streak')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('challenge_start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Use longest_streak (max ever achieved in this challenge), not current streak_days
  return (activeChallenge?.longest_streak || 0) >= streakRequired;
};

// Main function: Check if user is eligible to graduate
export const checkGraduationEligibility = async (userId) => {
  try {
    // Get user's current persona and stage
    const { data: progress, error: progressError } = await supabase
      .from('user_stage_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError || !progress) {
      return {
        eligible: false,
        error: 'No stage progress found for user',
        checks: {},
        next_stage: null
      };
    }

    const { persona, current_stage, conversations_logged } = progress;

    // Get requirements for current stage
    const requirements = PERSONA_STAGES[persona]?.graduation_requirements?.[current_stage];

    if (!requirements) {
      return {
        eligible: false,
        error: 'Invalid persona or stage',
        checks: {},
        next_stage: null
      };
    }

    // Check all requirements
    const flowsCheck = await checkFlowsCompleted(userId, requirements.flows_required);
    const checks = {
      flows_completed: flowsCheck.allCompleted,
      conversations_logged: conversations_logged >= (requirements.conversations_required || 0),
      milestones_met: await checkMilestones(userId, persona, requirements.milestones, requirements.milestones_additional),
      streak_met: await checkStreak(userId, requirements.challenge_streak)
    };

    // User is eligible if all checks pass
    const eligible = Object.values(checks).every(check => check === true);

    return {
      eligible,
      checks,
      completed_flows: flowsCheck.completedFlows,
      requirements,
      current_stage,
      next_stage: getNextStage(persona, current_stage),
      persona
    };
  } catch (error) {
    console.error('Error checking graduation eligibility:', error);
    return {
      eligible: false,
      error: error.message,
      checks: {},
      next_stage: null
    };
  }
};

// Graduate user to next stage
export const graduateUser = async (userId, fromStage, toStage, persona, reason) => {
  try {
    // Special case: Vibe Seeker graduating from Clarity becomes Vibe Riser
    if (persona === 'vibe_seeker' && fromStage === 'clarity' && toStage === null) {
      return await graduateVibeSeeker(userId, reason);
    }

    // Special case: Vibe Riser graduating from Launch becomes Movement Maker
    if (persona === 'vibe_riser' && fromStage === 'launch' && toStage === null) {
      return await graduateVibeRiser(userId, reason);
    }

    // Record graduation in stage_graduations table
    const { error: graduationError } = await supabase
      .from('stage_graduations')
      .insert({
        user_id: userId,
        persona,
        from_stage: fromStage,
        to_stage: toStage,
        graduation_reason: reason
      });

    if (graduationError) {
      throw new Error(`Failed to record graduation: ${graduationError.message}`);
    }

    // Archive the current active challenge (challenge resets on graduation)
    const { error: archiveError } = await supabase
      .from('challenge_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (archiveError) {
      console.warn('Failed to archive challenge:', archiveError.message);
      // Don't throw - graduation should still proceed
    }

    // Update current stage in user_stage_progress
    const { error: updateError } = await supabase
      .from('user_stage_progress')
      .update({
        current_stage: toStage,
        stage_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update stage progress: ${updateError.message}`);
    }

    // Return celebration data for UI
    const celebration = getStageCelebration(toStage, persona);

    return {
      graduated: true,
      new_stage: toStage,
      celebration_message: celebration
    };
  } catch (error) {
    console.error('Error graduating user:', error);
    return {
      graduated: false,
      error: error.message
    };
  }
};

// Special handler: Graduate Vibe Seeker to Vibe Riser
const graduateVibeSeeker = async (userId, reason) => {
  try {
    // 1. Record graduation from Vibe Seeker
    await supabase.from('stage_graduations').insert({
      user_id: userId,
      persona: 'vibe_seeker',
      from_stage: 'clarity',
      to_stage: null, // No next stage for Vibe Seeker
      graduation_reason: reason
    });

    // 1b. Archive the current active challenge (challenge resets on graduation)
    await supabase
      .from('challenge_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    // 2. Update persona in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ persona: 'vibe_riser' })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update persona: ${profileError.message}`);
    }

    // 3. Get user's email to update lead_flow_profiles
    // Use maybeSingle() to avoid throwing when no profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    // 4. Update lead_flow_profiles table (use ilike for case-insensitive email matching)
    if (profile?.email) {
      const { error: leadFlowError } = await supabase
        .from('lead_flow_profiles')
        .update({ persona: 'vibe_riser' })
        .ilike('email', profile.email);

      if (leadFlowError) {
        console.warn('Failed to update lead_flow_profiles:', leadFlowError.message);
      }
    }

    // 5. Update user_stage_progress to Vibe Riser Validation stage
    const { error: stageError } = await supabase
      .from('user_stage_progress')
      .update({
        persona: 'vibe_riser',
        current_stage: 'validation',
        stage_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (stageError) {
      throw new Error(`Failed to update stage progress: ${stageError.message}`);
    }

    return {
      graduated: true,
      persona_switched: true,
      new_persona: 'vibe_riser',
      new_stage: 'validation',
      celebration_message: {
        title: '🎉 Congratulations, Vibe Riser!',
        message: "You've gained clarity on your unique value. Now it's time to validate your ideas and build something amazing!",
        next_step: 'Welcome to the Validation stage. Let\'s validate your ideas with real people.'
      }
    };
  } catch (error) {
    console.error('Error graduating Vibe Seeker:', error);
    return {
      graduated: false,
      error: error.message
    };
  }
};

// Special handler: Graduate Vibe Riser to Movement Maker
const graduateVibeRiser = async (userId, reason) => {
  try {
    // 1. Record graduation from Vibe Riser
    await supabase.from('stage_graduations').insert({
      user_id: userId,
      persona: 'vibe_riser',
      from_stage: 'launch',
      to_stage: null, // No next stage for Vibe Riser
      graduation_reason: reason
    });

    // 1b. Archive the current active challenge (challenge resets on graduation)
    await supabase
      .from('challenge_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    // 2. Update persona in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ persona: 'movement_maker' })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update persona: ${profileError.message}`);
    }

    // 3. Get user's email to update lead_flow_profiles
    // Use maybeSingle() to avoid throwing when no profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    // 4. Update lead_flow_profiles table (use ilike for case-insensitive email matching)
    if (profile?.email) {
      const { error: leadFlowError } = await supabase
        .from('lead_flow_profiles')
        .update({ persona: 'movement_maker' })
        .ilike('email', profile.email);

      if (leadFlowError) {
        console.warn('Failed to update lead_flow_profiles:', leadFlowError.message);
      }
    }

    // 5. Update user_stage_progress to Movement Maker Ideation stage
    const { error: stageError } = await supabase
      .from('user_stage_progress')
      .update({
        persona: 'movement_maker',
        current_stage: 'ideation',
        stage_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (stageError) {
      throw new Error(`Failed to update stage progress: ${stageError.message}`);
    }

    return {
      graduated: true,
      persona_switched: true,
      new_persona: 'movement_maker',
      new_stage: 'ideation',
      celebration_message: {
        title: '🎉 Congratulations, Movement Maker!',
        message: "You've successfully launched your offer and proven your ability to build and validate. Now it's time to scale your impact!",
        next_step: 'Welcome to the Ideation stage. Let\'s design your complete money model.'
      }
    };
  } catch (error) {
    console.error('Error graduating Vibe Riser:', error);
    return {
      graduated: false,
      error: error.message
    };
  }
};

// normalizePersona is now imported from '../data/personaProfiles'

// Initialize user stage progress (call when user selects persona)
export const initializeUserStageProgress = async (userId, persona) => {
  try {
    // Normalize persona to match database constraint
    const normalizedPersona = normalizePersona(persona);

    if (!normalizedPersona || !['vibe_seeker', 'vibe_riser', 'movement_maker'].includes(normalizedPersona)) {
      throw new Error(`Invalid persona: ${persona}. Must be one of: Vibe Seeker, Vibe Riser, Movement Maker`);
    }

    // Get the initial stage for this persona (different personas start at different stages)
    const initialStage = getInitialStage(normalizedPersona);

    const { data, error } = await supabase
      .from('user_stage_progress')
      .upsert({
        user_id: userId,
        persona: normalizedPersona,
        current_stage: initialStage,
        conversations_logged: 0
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error initializing stage progress:', error);
    return { success: false, error: error.message };
  }
};

// =============================================================================
// PROJECT-BASED GRADUATION CHECK (Dec 2024 Refactor)
// =============================================================================

/**
 * Check if project has completed required flows for a stage
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string[]} flowsRequired - Array of required flow IDs
 */
const checkProjectFlowsCompleted = async (userId, projectId, flowsRequired = []) => {
  if (!flowsRequired || flowsRequired.length === 0) {
    return { allCompleted: true, completedFlows: [] };
  }

  try {
    const { data: completedSessions, error } = await supabase
      .from('flow_sessions')
      .select('flow_type, status')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .in('flow_type', flowsRequired);

    if (error) {
      console.warn('Flow check error:', error.message);
      return { allCompleted: false, completedFlows: [] };
    }

    const completedFlowTypes = new Set(completedSessions?.map(s => s.flow_type) || []);
    const allCompleted = flowsRequired.every(flow => completedFlowTypes.has(flow));

    return { allCompleted, completedFlows: Array.from(completedFlowTypes) };
  } catch (error) {
    console.warn('Error checking project flows:', error);
    return { allCompleted: false, completedFlows: [] };
  }
};

/**
 * Check if project has completed required milestones for a stage
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string[]} milestonesRequired - Array of required milestone IDs
 */
const checkProjectMilestones = async (userId, projectId, milestonesRequired = []) => {
  if (!milestonesRequired || milestonesRequired.length === 0) {
    return { allCompleted: true, completedMilestones: [] };
  }

  try {
    const { data: completedMilestones, error } = await supabase
      .from('milestone_completions')
      .select('milestone_id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .in('milestone_id', milestonesRequired);

    if (error) {
      console.warn('Milestone check error:', error.message);
      return { allCompleted: false, completedMilestones: [] };
    }

    const completedIds = completedMilestones?.map(m => m.milestone_id) || [];
    const allCompleted = milestonesRequired.every(m => completedIds.includes(m));

    return { allCompleted, completedMilestones: completedIds };
  } catch (error) {
    console.warn('Error checking project milestones:', error);
    return { allCompleted: false, completedMilestones: [] };
  }
};

/**
 * Check if stage-specific groan challenge is completed within current challenge
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {number} stageNumber - Current stage number (1-6)
 * @param {string} challengeInstanceId - Current challenge instance ID
 */
const checkStageGroanChallenge = async (userId, projectId, stageNumber, challengeInstanceId) => {
  const groanChallengeId = getGroanChallengeId(stageNumber);

  if (!groanChallengeId) {
    console.warn(`No groan challenge defined for stage ${stageNumber}`);
    return { completed: false, groanChallengeId: null };
  }

  try {
    // Check quest_completions for the stage-specific groan challenge
    const { data, error } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('quest_id', groanChallengeId)
      .eq('challenge_instance_id', challengeInstanceId)
      .limit(1);

    if (error) {
      console.warn('Groan challenge check error:', error.message);
      return { completed: false, groanChallengeId };
    }

    return {
      completed: data && data.length > 0,
      groanChallengeId
    };
  } catch (error) {
    console.warn('Error checking groan challenge:', error);
    return { completed: false, groanChallengeId };
  }
};

/**
 * Check if a project is eligible to graduate to the next stage
 * Called after each quest completion
 *
 * Requirements for graduation (no streak required):
 * - All required flows for the stage completed
 * - All required milestones for the stage completed
 * - Stage-specific groan challenge completed (within current challenge instance)
 *
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string} challengeInstanceId - Current challenge instance ID
 */
export const checkProjectGraduationEligibility = async (userId, projectId, challengeInstanceId) => {
  try {
    // Get project's current stage
    const { data: project, error: projectError } = await supabase
      .from('user_projects')
      .select('id, name, current_stage')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return {
        eligible: false,
        error: 'Project not found',
        checks: {},
        next_stage: null
      };
    }

    const currentStage = project.current_stage || 1;
    const stageConfig = getStageConfig(currentStage);

    if (!stageConfig) {
      return {
        eligible: false,
        error: `Invalid stage: ${currentStage}`,
        checks: {},
        next_stage: null
      };
    }

    // Check all requirements
    const flowsCheck = await checkProjectFlowsCompleted(
      userId,
      projectId,
      stageConfig.requiredFlows
    );

    const milestonesCheck = await checkProjectMilestones(
      userId,
      projectId,
      stageConfig.milestones
    );

    const groanCheck = await checkStageGroanChallenge(
      userId,
      projectId,
      currentStage,
      challengeInstanceId
    );

    const checks = {
      flows_completed: flowsCheck.allCompleted,
      milestones_completed: milestonesCheck.allCompleted,
      groan_challenge_completed: groanCheck.completed
    };

    // All checks must pass
    const eligible = Object.values(checks).every(check => check === true);

    // Calculate next stage (max is 6, stage 7 is "coming soon")
    const nextStage = currentStage < 6 ? currentStage + 1 : null;

    return {
      eligible,
      checks,
      completed_flows: flowsCheck.completedFlows,
      completed_milestones: milestonesCheck.completedMilestones,
      groan_challenge_id: groanCheck.groanChallengeId,
      current_stage: currentStage,
      stage_name: stageConfig.name,
      next_stage: nextStage,
      project_id: projectId,
      project_name: project.name
    };
  } catch (error) {
    console.error('Error checking project graduation eligibility:', error);
    return {
      eligible: false,
      error: error.message,
      checks: {},
      next_stage: null
    };
  }
};

/**
 * Graduate a project to the next stage
 * Updates user_projects.current_stage
 *
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {number} fromStage - Current stage (1-6)
 * @param {number} toStage - Next stage (2-7, or null if at max)
 */
export const graduateProject = async (userId, projectId, fromStage, toStage) => {
  try {
    if (!toStage || toStage > 6) {
      // At max stage (6), stay at current stage
      // Stage 7 is "coming soon" - projects repeat the cycle
      return {
        graduated: false,
        message: 'Project is at maximum stage. Stage 7 coming soon!',
        current_stage: fromStage
      };
    }

    // Record graduation in stage_graduations table
    const { error: graduationError } = await supabase
      .from('stage_graduations')
      .insert({
        user_id: userId,
        project_id: projectId,
        from_stage: fromStage,
        to_stage: toStage,
        graduation_reason: `Project graduated from Stage ${fromStage} to Stage ${toStage}`
      });

    if (graduationError) {
      console.warn('Failed to record graduation:', graduationError.message);
      // Continue anyway - this is just for tracking
    }

    // Update project's current_stage
    const { data: updatedProject, error: updateError } = await supabase
      .from('user_projects')
      .update({
        current_stage: toStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update project stage: ${updateError.message}`);
    }

    const toStageConfig = getStageConfig(toStage);

    return {
      graduated: true,
      from_stage: fromStage,
      new_stage: toStage,
      project_id: projectId,
      celebration_message: {
        title: `🎉 Stage ${toStage} Unlocked!`,
        message: `Congratulations! You've completed Stage ${fromStage} and unlocked ${toStageConfig?.name || `Stage ${toStage}`}!`,
        next_step: toStageConfig?.description || 'Keep building momentum!'
      }
    };
  } catch (error) {
    console.error('Error graduating project:', error);
    return {
      graduated: false,
      error: error.message
    };
  }
};

/**
 * Trigger graduation check and graduate if eligible
 * Call this after quest completion
 *
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string} challengeInstanceId - Current challenge instance ID
 */
export const checkAndGraduateProject = async (userId, projectId, challengeInstanceId) => {
  const eligibility = await checkProjectGraduationEligibility(userId, projectId, challengeInstanceId);

  if (!eligibility.eligible) {
    return {
      graduated: false,
      eligibility
    };
  }

  const result = await graduateProject(
    userId,
    projectId,
    eligibility.current_stage,
    eligibility.next_stage
  );

  return {
    ...result,
    eligibility
  };
};
