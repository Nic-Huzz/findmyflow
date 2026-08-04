/**
 * Stats Service - Points & Streak Manager
 * Handles gamification: points, levels, and streaks
 */
import { supabase } from '../supabaseClient'

// Level configuration
export const LEVELS = [
  { min: 0, name: 'Getting Started', emoji: '🌱', description: 'You showed up. That takes more courage than most people realise. Everything starts here.' },
  { min: 100, name: 'Habit Builder', emoji: '🧱', description: 'You are building the daily rituals that rewire your nervous system. Consistency is becoming your superpower.' },
  { min: 500, name: 'Strong Foundation', emoji: '🌿', description: 'Your practices are rooted. Safety is building, expression is growing. The foundation holds.' },
  { min: 1250, name: 'Vibe Rise', emoji: '🔥', description: 'You are in Vibe Rise. Your safety and expression are working together. This is what alignment feels like.' },
  { min: 2750, name: 'Flow Finder', emoji: '⚔️', description: 'You have mastered the daily practice of rising. Your nervous system trusts you. Now you lead by example.' },
  { min: 5750, name: 'Movement Maker', emoji: '👑', description: 'You are the proof that this works. Your rise creates a ripple. Others rise because you did.' },
]

// Get current level based on points
export function getLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) {
      return LEVELS[i]
    }
  }
  return LEVELS[0]
}

// Get progress to next level (0-100 percentage)
export function getLevelProgress(points) {
  const currentLevel = getLevel(points)
  const currentIndex = LEVELS.findIndex(l => l.min === currentLevel.min)

  if (currentIndex === LEVELS.length - 1) {
    return 100
  }

  const nextLevel = LEVELS[currentIndex + 1]
  const pointsInLevel = points - currentLevel.min
  const pointsNeeded = nextLevel.min - currentLevel.min

  return Math.min(100, Math.round((pointsInLevel / pointsNeeded) * 100))
}

// Get points needed for next level
export function getPointsToNextLevel(points) {
  const currentLevel = getLevel(points)
  const currentIndex = LEVELS.findIndex(l => l.min === currentLevel.min)

  if (currentIndex === LEVELS.length - 1) {
    return 0
  }

  return LEVELS[currentIndex + 1].min - points
}

// Get level number (1-indexed) based on points
export function getLevelNumber(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return i + 1
  }
  return 1
}

// Get the max XP for the current level bracket (next level min)
export function getLevelMaxXP(points) {
  const currentLevel = getLevel(points)
  const currentIndex = LEVELS.findIndex(l => l.min === currentLevel.min)
  if (currentIndex === LEVELS.length - 1) return currentLevel.min
  return LEVELS[currentIndex + 1].min
}

// Calculate streak based on last activity
export function calculateStreak(lastActivityDate, currentStreak) {
  if (!lastActivityDate) {
    return { newStreak: 1, streakMaintained: true }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastActive = new Date(lastActivityDate)
  lastActive.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return { newStreak: currentStreak, streakMaintained: true }
  } else if (diffDays === 1) {
    return { newStreak: currentStreak + 1, streakMaintained: true }
  } else {
    return { newStreak: 1, streakMaintained: false }
  }
}

// Fetch user CRM stats
export async function fetchUserStats(userId) {
  const { data, error } = await supabase
    .from('user_crm_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching stats:', error)
    return { data: null, error }
  }

  // If no stats exist, create them
  if (!data) {
    const { data: newStats, error: createError } = await supabase
      .from('user_crm_stats')
      .insert({ user_id: userId })
      .select()
      .single()

    if (createError) {
      console.error('Error creating stats:', createError)
      return { data: null, error: createError }
    }

    return { data: newStats, error: null }
  }

  return { data, error: null }
}

// Add points to user
export async function addPoints(userId, points) {
  const { data: stats } = await fetchUserStats(userId)
  if (!stats) return { error: 'Could not fetch stats' }

  const newTotal = (stats.total_points || 0) + points

  const { data, error } = await supabase
    .from('user_crm_stats')
    .update({
      total_points: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error adding points:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Update streak
export async function updateStreak(userId) {
  const { data: stats } = await fetchUserStats(userId)
  if (!stats) return { error: 'Could not fetch stats' }

  const today = new Date().toISOString().split('T')[0]
  const { newStreak, streakMaintained } = calculateStreak(
    stats.last_activity_date,
    stats.current_streak || 0
  )

  const longestStreak = Math.max(stats.longest_streak || 0, newStreak)

  const { data, error } = await supabase
    .from('user_crm_stats')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating streak:', error)
    return { data: null, error }
  }

  return { data, streakMaintained, error: null }
}

// Update monthly revenue goal
export async function updateRevenueGoal(userId, goal) {
  const { data, error } = await supabase
    .from('user_crm_stats')
    .update({
      monthly_revenue_goal: goal,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating goal:', error)
    return { data: null, error }
  }

  return { data, error: null }
}
