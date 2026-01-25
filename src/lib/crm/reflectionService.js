// src/lib/crm/reflectionService.js
// Service layer for weekly reflections and flow tracking

import { supabase } from '../supabaseClient'
import { getWeekStart, getPlanningWeekStart } from './weeklyPlanningService'

// ============================================
// FLOW DIRECTION MAPPING
// ============================================

/**
 * Map two-factor inputs to flow direction
 */
export function getFlowDirection(internal, external) {
  if (internal === 'excited' && external === 'great') return 'north'
  if (internal === 'excited' && external === 'resistance') return 'east'
  if (internal === 'tired' && external === 'great') return 'west'
  if (internal === 'tired' && external === 'resistance') return 'south'
  return null
}

/**
 * Flow direction metadata
 */
export const FLOW_DIRECTIONS = {
  north: {
    id: 'north',
    label: 'Flow',
    emoji: '🟢',
    color: '#22c55e',
    description: "You're in flow!",
    internal: 'excited',
    external: 'great'
  },
  east: {
    id: 'east',
    label: 'Redirect',
    emoji: '🔵',
    color: '#3b82f6',
    description: 'Excited but facing resistance',
    internal: 'excited',
    external: 'resistance'
  },
  south: {
    id: 'south',
    label: 'Rest',
    emoji: '🔴',
    color: '#ef4444',
    description: 'Time to rest and recharge',
    internal: 'tired',
    external: 'resistance'
  },
  west: {
    id: 'west',
    label: 'Honour',
    emoji: '🟡',
    color: '#eab308',
    description: 'Ease but low energy - honour your pace',
    internal: 'tired',
    external: 'great'
  }
}

// ============================================
// REFLECTION QUESTIONS
// ============================================

/**
 * Get the appropriate reflection question based on scores
 */
export function getReflectionQuestion(scores) {
  // First week - no previous data
  if (scores.execution === null && scores.conversion === null) {
    return {
      type: 'first_week',
      question: "Welcome! What's your #1 focus this week?"
    }
  }

  // Execution-based questions take priority
  if (scores.execution !== null) {
    if (scores.execution === 100) {
      return {
        type: 'execution_perfect',
        question: 'Perfect execution! What made this week different?'
      }
    }
    if (scores.execution < 100) {
      return {
        type: 'execution_incomplete',
        question: `You hit ${scores.execution}% execution - what stopped 100%?`
      }
    }
  }

  // Improvement-based questions
  if (scores.improvement !== null) {
    if (scores.improvement > 0) {
      return {
        type: 'improved',
        question: `Your funnel improved +${scores.improvement}% - what change made the difference?`
      }
    }
    if (scores.improvement < 0) {
      return {
        type: 'declined',
        question: `Your funnel dipped ${scores.improvement}% - what do you think happened?`
      }
    }
    return {
      type: 'steady',
      question: "Steady funnel this week. What's one thing to test next?"
    }
  }

  // Fallback
  return {
    type: 'first_week',
    question: "What's your main focus for this week?"
  }
}

// ============================================
// REFLECTION CRUD
// ============================================

/**
 * Save weekly reflection
 */
export async function saveReflection(userId, reflectionData) {
  // Use last week's Monday for reflection (we're reflecting on LAST week)
  const lastWeekStart = getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

  const direction = getFlowDirection(
    reflectionData.flowInternal,
    reflectionData.flowExternal
  )

  const { data, error } = await supabase
    .from('crm_weekly_reflections')
    .upsert({
      user_id: userId,
      week_start: lastWeekStart,
      execution_score: reflectionData.executionScore,
      conversion_score: reflectionData.conversionScore,
      improvement_score: reflectionData.improvementScore,
      reflection_type: reflectionData.reflectionType,
      reflection_text: reflectionData.reflectionText,
      flow_internal: reflectionData.flowInternal,
      flow_external: reflectionData.flowExternal,
      flow_direction: direction
    }, {
      onConflict: 'user_id,week_start'
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving reflection:', error)
    return null
  }

  // Also save to flow_entries for historical tracking
  await saveFlowEntry(userId, reflectionData.flowInternal, reflectionData.flowExternal)

  return data
}

/**
 * Get reflection for a specific week
 */
export async function getReflection(userId, weekStart) {
  const { data, error } = await supabase
    .from('crm_weekly_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching reflection:', error)
  }

  return data
}

/**
 * Get all reflections for pattern analysis
 */
export async function getReflectionHistory(userId, limit = 12) {
  const { data, error } = await supabase
    .from('crm_weekly_reflections')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching reflection history:', error)
    return []
  }

  return data || []
}

// ============================================
// FLOW ENTRY (for historical tracking)
// ============================================

/**
 * Save flow entry to flow_entries table
 */
async function saveFlowEntry(userId, internal, external) {
  const direction = getFlowDirection(internal, external)

  // Map to the flow_entries table format
  const internalState = internal === 'excited' ? 'Excited' : 'Tired'
  const externalState = external === 'great' ? 'Great' : 'Facing Resistance'
  const directionMap = {
    north: 'North',
    east: 'East',
    south: 'South',
    west: 'West'
  }

  const { error } = await supabase
    .from('flow_entries')
    .insert({
      user_id: userId,
      direction: directionMap[direction],
      internal_state: internalState,
      external_state: externalState,
      headline: 'Weekly planning check-in',
      entry_type: 'weekly_planning'
    })

  if (error) {
    console.error('Error saving flow entry:', error)
  }
}

/**
 * Get recent flow entries for pattern display
 */
export async function getRecentFlowEntries(userId, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data, error } = await supabase
    .from('flow_entries')
    .select('direction, internal_state, external_state, created_at')
    .eq('user_id', userId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching flow entries:', error)
    return []
  }

  return data || []
}

/**
 * Analyze flow patterns (for AI insights)
 */
export function analyzeFlowPatterns(entries) {
  if (!entries || entries.length === 0) return null

  const directionCounts = { North: 0, East: 0, South: 0, West: 0 }
  entries.forEach(e => {
    if (e.direction && directionCounts[e.direction] !== undefined) {
      directionCounts[e.direction]++
    }
  })

  const total = entries.length
  const dominant = Object.entries(directionCounts)
    .sort(([, a], [, b]) => b - a)[0]

  return {
    total,
    directionCounts,
    dominantDirection: dominant[0],
    dominantPercent: Math.round((dominant[1] / total) * 100)
  }
}
