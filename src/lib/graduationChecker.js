// Phase 3: Graduation Eligibility Checker
// Checks if user meets requirements to graduate to the next stage

import { supabase } from './supabaseClient';
import { PERSONA_STAGES, getNextStage, getStageCelebration } from './personaStages';

// Check if user has completed required flows
const checkFlowsCompleted = async (userId, flowsRequired = []) => {
  if (!flowsRequired || flowsRequired.length === 0) return true;

  try {
    // Query nikigai_sessions to check for completed flows
    const { data: completedSessions, error } = await supabase
      .from('nikigai_sessions')
      .select('flow_type, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('flow_type', flowsRequired);

    // If error, return false gracefully
    if (error) {
      console.warn('Flow check error (flows may not exist yet):', error.message);
      return false;
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

    return allCompleted;
  } catch (error) {
    console.warn('Error checking flows:', error);
    return false; // Gracefully fail - flows don't exist yet
  }
};

// Check if user has completed required milestones
const checkMilestones = async (userId, milestonesRequired = []) => {
  if (!milestonesRequired || milestonesRequired.length === 0) return true;

  const { data: completedMilestones } = await supabase
    .from('milestone_completions')
    .select('milestone_id')
    .eq('user_id', userId)
    .in('milestone_id', milestonesRequired);

  const completedMilestoneIds = new Set(completedMilestones?.map(m => m.milestone_id) || []);
  return milestonesRequired.every(milestone => completedMilestoneIds.has(milestone));
};

// Check if user has met challenge streak requirement
const checkStreak = async (userId, streakRequired) => {
  if (!streakRequired) return true;

  const { data: challengeProgress } = await supabase
    .from('challenge_progress')
    .select('streak_days')
    .eq('user_id', userId)
    .order('streak_days', { ascending: false })
    .limit(1)
    .single();

  return challengeProgress?.streak_days >= streakRequired;
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
    const checks = {
      flows_completed: await checkFlowsCompleted(userId, requirements.flows_required),
      conversations_logged: conversations_logged >= (requirements.conversations_required || 0),
      milestones_met: await checkMilestones(userId, requirements.milestones),
      streak_met: await checkStreak(userId, requirements.challenge_streak)
    };

    // User is eligible if all checks pass
    const eligible = Object.values(checks).every(check => check === true);

    return {
      eligible,
      checks,
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

// Helper to normalize persona names
const normalizePersona = (persona) => {
  if (!persona) return null;
  const mapping = {
    'Vibe Seeker': 'vibe_seeker',
    'Vibe Riser': 'vibe_riser',
    'Movement Maker': 'movement_maker'
  };
  return mapping[persona] || persona.toLowerCase().replace(/\s+/g, '_');
};

// Initialize user stage progress (call when user selects persona)
export const initializeUserStageProgress = async (userId, persona) => {
  try {
    // Normalize persona to match database constraint
    const normalizedPersona = normalizePersona(persona);

    if (!normalizedPersona || !['vibe_seeker', 'vibe_riser', 'movement_maker'].includes(normalizedPersona)) {
      throw new Error(`Invalid persona: ${persona}. Must be one of: Vibe Seeker, Vibe Riser, Movement Maker`);
    }

    const { data, error } = await supabase
      .from('user_stage_progress')
      .upsert({
        user_id: userId,
        persona: normalizedPersona,
        current_stage: 'validation',
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
