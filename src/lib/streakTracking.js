// Phase 3: Streak Tracking
// Manages daily challenge streaks and longest streak tracking

/**
 * @fileoverview Streak tracking for 7-day challenges
 *
 * DATABASE SCHEMA REFERENCE (challenge_progress table):
 * This is the authoritative reference for challenge_progress fields.
 *
 * @typedef {Object} ChallengeProgress
 * @property {string} id - UUID primary key
 * @property {string} user_id - FK to auth.users
 * @property {string} challenge_instance_id - Unique ID for this challenge instance
 * @property {string} session_id - Session identifier from lead_flow_profiles
 * @property {string} status - 'active' or 'completed'
 * @property {number} current_day - Current day (0-7), advances on new calendar day
 * @property {string} challenge_start_date - When challenge started (timestamp)
 * @property {string} last_active_date - Last activity timestamp (for day advancement)
 * @property {number} total_points - Sum of all points earned
 * @property {number} streak_days - Current consecutive day streak (resets if 2+ days missed)
 * @property {number} longest_streak - Max streak achieved in this challenge (used for graduation)
 * @property {string} persona - User's persona when challenge started (vibe_seeker, vibe_riser, movement_maker)
 * @property {string} current_stage - User's stage when challenge started (clarity, validation, etc.)
 * @property {string} group_id - Optional FK to challenge_groups
 * @property {number} recognise_daily_points - Points from Recognise daily quests
 * @property {number} release_daily_points - Points from Release daily quests
 * @property {number} rewire_daily_points - Points from Rewire daily quests
 * @property {number} reconnect_daily_points - Points from Reconnect daily quests
 * @property {number} recognise_weekly_points - Points from Recognise weekly quests
 * @property {number} release_weekly_points - Points from Release weekly quests
 * @property {number} rewire_weekly_points - Points from Rewire weekly quests
 * @property {number} reconnect_weekly_points - Points from Reconnect weekly quests
 *
 * IMPORTANT NOTES:
 * - streak_days: Current streak, resets to 0 if user misses 2+ consecutive days
 * - longest_streak: Maximum streak achieved in this challenge, never decreases
 * - Graduation checks use longest_streak (not streak_days)
 * - Each new challenge (after graduation) resets both streak values
 */

import { supabase } from './supabaseClient';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to get yesterday's date in YYYY-MM-DD format
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Check if user completed any challenges today
const hasCompletedChallengeToday = async (userId, challengeInstanceId) => {
  const today = getTodayDate();

  const { data, error } = await supabase
    .from('quest_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('challenge_instance_id', challengeInstanceId)
    .gte('completed_at', `${today}T00:00:00`)
    .lte('completed_at', `${today}T23:59:59`);

  if (error) {
    console.error('Error checking today completions:', error);
    return false;
  }

  return data && data.length > 0;
};

// Update streak when user completes their first challenge of the day
export const updateStreak = async (userId, challengeInstanceId) => {
  try {
    // Check if this is the first completion today
    const { data: todayCompletions, error: completionError } = await supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_instance_id', challengeInstanceId)
      .gte('completed_at', `${getTodayDate()}T00:00:00`)
      .lte('completed_at', `${getTodayDate()}T23:59:59`);

    if (completionError) {
      console.error('Error fetching today completions:', completionError);
      return { success: false, error: completionError.message };
    }

    // Only increment streak if this is the first completion today
    if (todayCompletions.length === 1) {
      // Get current challenge progress
      const { data: currentProgress, error: progressError } = await supabase
        .from('challenge_progress')
        .select('streak_days, longest_streak')
        .eq('challenge_instance_id', challengeInstanceId)
        .maybeSingle();

      if (progressError) {
        console.error('Error fetching challenge progress:', progressError);
        return { success: false, error: progressError.message };
      }

      if (!currentProgress) {
        console.warn('No challenge progress found for id:', challengeInstanceId);
        return { success: false, error: 'Challenge progress not found' };
      }

      const newStreak = (currentProgress.streak_days || 0) + 1;
      const newLongest = Math.max(newStreak, currentProgress.longest_streak || 0);

      // Update streak
      const { error: updateError } = await supabase
        .from('challenge_progress')
        .update({
          streak_days: newStreak,
          longest_streak: newLongest,
          last_active_date: new Date().toISOString()
        })
        .eq('challenge_instance_id', challengeInstanceId);

      if (updateError) {
        console.error('Error updating streak:', updateError);
        return { success: false, error: updateError.message };
      }

      return {
        success: true,
        streak_days: newStreak,
        longest_streak: newLongest,
        streak_incremented: true
      };
    }

    // If not first completion today, just update last_active_date
    const { error: updateError } = await supabase
      .from('challenge_progress')
      .update({
        last_active_date: new Date().toISOString()
      })
      .eq('challenge_instance_id', challengeInstanceId);

    if (updateError) {
      console.error('Error updating last active date:', updateError);
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      streak_incremented: false
    };
  } catch (error) {
    console.error('Error in updateStreak:', error);
    return { success: false, error: error.message };
  }
};

// Check if streak should be broken (call on app load)
export const checkStreakBreak = async (userId, challengeInstanceId) => {
  try {
    // Get challenge progress
    const { data: progress, error: progressError } = await supabase
      .from('challenge_progress')
      .select('last_active_date, streak_days')
      .eq('challenge_instance_id', challengeInstanceId)
      .maybeSingle();

    if (progressError) {
      return { success: false, error: progressError.message };
    }

    if (!progress) {
      return { success: false, error: 'Challenge progress not found' };
    }

    // If no last_active_date or streak is already 0, nothing to do
    if (!progress.last_active_date || progress.streak_days === 0) {
      return { success: true, streak_broken: false };
    }

    // Check if last active date was yesterday (streak continues) or today (already active)
    const lastActiveDate = new Date(progress.last_active_date).toISOString().split('T')[0];
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // If last active was today or yesterday, streak is intact
    if (lastActiveDate === today || lastActiveDate === yesterday) {
      return { success: true, streak_broken: false };
    }

    // Otherwise, streak is broken - reset to 0
    const { error: updateError } = await supabase
      .from('challenge_progress')
      .update({ streak_days: 0 })
      .eq('challenge_instance_id', challengeInstanceId);

    if (updateError) {
      console.error('Error resetting streak:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, streak_broken: true };
  } catch (error) {
    console.error('Error in checkStreakBreak:', error);
    return { success: false, error: error.message };
  }
};

// Get current streak for a user's active challenge
export const getCurrentStreak = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('challenge_progress')
      .select('streak_days, longest_streak, last_active_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting current streak:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: true,
        streak_days: 0,
        longest_streak: 0,
        last_active_date: null
      };
    }

    return {
      success: true,
      streak_days: data?.streak_days || 0,
      longest_streak: data?.longest_streak || 0,
      last_active_date: data?.last_active_date
    };
  } catch (error) {
    console.error('Error in getCurrentStreak:', error);
    return { success: false, error: error.message };
  }
};
