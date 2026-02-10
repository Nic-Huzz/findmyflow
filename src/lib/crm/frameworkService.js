/**
 * Framework Service
 * Auto-tracking CRM action frameworks for the Execute page
 */
import { supabase } from '../supabaseClient'
import { getToday, getWeekStart } from '../executeHelpers'

// ============================================
// FRAMEWORK DEFINITIONS
// ============================================

export const FRAMEWORKS = [
  {
    key: 'dm-prospects',
    title: 'DM prospects',
    phase: 'launch',
    defaultTarget: 5,
    defaultCycle: 'daily',
    points: 15,
    source: {
      table: 'crm_warm_leads',
      statusField: 'status',
      statusValue: 'reached_out',
      dateField: 'status_entered_at',
    },
  },
  {
    key: 'post-content',
    title: 'Post content',
    phase: 'launch',
    defaultTarget: 1,
    defaultCycle: 'daily',
    points: 15,
    source: {
      table: 'content_history',
      statusField: 'status',
      statusValue: 'posted',
      dateField: 'posted_at',
    },
  },
  {
    key: 'create-content',
    title: 'Create content',
    phase: 'build',
    defaultTarget: 1,
    defaultCycle: 'daily',
    points: 10,
    source: {
      table: 'content_history',
      statusField: 'status',
      statusValue: 'draft',
      dateField: 'created_at',
    },
  },
  {
    key: 'move-deals',
    title: 'Move deals forward',
    phase: 'launch',
    defaultTarget: 2,
    defaultCycle: 'weekly',
    points: 15,
    source: {
      table: 'sales_deals',
      statusField: 'status',
      statusValue: null, // special: count any non-lead/non-lost deal updated in period
      dateField: 'updated_at',
    },
  },
  {
    key: 'ascension-tasks',
    title: 'Complete ascension tasks',
    phase: 'deliver',
    defaultTarget: 2,
    defaultCycle: 'weekly',
    points: 10,
    source: {
      table: 'ascension_tasks',
      statusField: 'status',
      statusValue: 'completed',
      dateField: 'completed_at',
    },
  },
  {
    key: 'log-improvement',
    title: 'Log improvement outcome',
    phase: 'recap',
    defaultTarget: 1,
    defaultCycle: 'weekly',
    points: 5,
    source: {
      table: 'improvements',
      statusField: 'outcome_logged',
      statusValue: true,
      dateField: 'updated_at',
    },
  },
]

// ============================================
// WHITELISTED QUERY MAP (security)
// ============================================

const QUERY_BUILDERS = {
  crm_warm_leads: (userId, fw, since) =>
    supabase
      .from('crm_warm_leads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq(fw.source.statusField, fw.source.statusValue)
      .gte(fw.source.dateField, since),

  content_history: (userId, fw, since) =>
    supabase
      .from('content_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq(fw.source.statusField, fw.source.statusValue)
      .gte(fw.source.dateField, since),

  sales_deals: (userId, _fw, since) =>
    supabase
      .from('sales_deals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('status', 'in', '("lead","lost")')
      .gte('updated_at', since),

  ascension_tasks: (userId, fw, since) =>
    supabase
      .from('ascension_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq(fw.source.statusField, fw.source.statusValue)
      .gte(fw.source.dateField, since),

  improvements: (userId, _fw, since) =>
    supabase
      .from('improvements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('outcome_logged', true)
      .gte('updated_at', since),
}

// ============================================
// PERIOD HELPERS
// ============================================

export function getPeriodStart(cycle) {
  return cycle === 'daily' ? getToday() : getWeekStart()
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get active frameworks merged with user preferences
 */
export async function getActiveFrameworks(userId) {
  let prefs = {}

  try {
    const { data } = await supabase
      .from('user_crm_stats')
      .select('framework_preferences')
      .eq('user_id', userId)
      .single()

    prefs = data?.framework_preferences || {}
  } catch {
    // No prefs row yet — use defaults
  }

  return FRAMEWORKS
    .map(fw => {
      const userPref = prefs[fw.key] || {}
      return {
        ...fw,
        target: userPref.target ?? fw.defaultTarget,
        cycle: userPref.cycle ?? fw.defaultCycle,
        active: userPref.active !== false, // default active
      }
    })
    .filter(fw => fw.active)
}

/**
 * Get live progress for a single framework
 */
export async function getFrameworkProgress(userId, framework) {
  const since = getPeriodStart(framework.cycle)
  const queryBuilder = QUERY_BUILDERS[framework.source.table]

  if (!queryBuilder) {
    return { current: 0, target: framework.target, isComplete: false }
  }

  try {
    const { count, error } = await queryBuilder(userId, framework, since)

    if (error) {
      console.warn(`Framework progress query error for ${framework.key}:`, error.message)
      return { current: 0, target: framework.target, isComplete: false }
    }

    const current = count || 0
    return {
      current,
      target: framework.target,
      isComplete: current >= framework.target,
    }
  } catch (err) {
    console.warn(`Framework progress error for ${framework.key}:`, err)
    return { current: 0, target: framework.target, isComplete: false }
  }
}

/**
 * Get progress for all active frameworks in parallel
 */
export async function getAllFrameworkProgress(userId, frameworks) {
  const results = await Promise.all(
    frameworks.map(async (fw) => {
      const progress = await getFrameworkProgress(userId, fw)
      return [fw.key, progress]
    })
  )

  return Object.fromEntries(results)
}

/**
 * Check if a framework was already awarded this period
 */
export async function isFrameworkAwardedThisPeriod(userId, frameworkKey, periodStart) {
  const { count, error } = await supabase
    .from('execute_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('framework_key', frameworkKey)
    .gte('scheduled_date', periodStart)
    .eq('completed', true)

  if (error) {
    console.warn('Error checking framework award:', error.message)
    return true // Assume awarded to prevent duplicates
  }

  return (count || 0) > 0
}

/**
 * Award framework completion (insert completed execute_task row)
 * Returns the created task if newly awarded, null if already awarded
 */
export async function awardFrameworkCompletion(userId, frameworkKey, framework) {
  const periodStart = getPeriodStart(framework.cycle)

  const alreadyAwarded = await isFrameworkAwardedThisPeriod(userId, frameworkKey, periodStart)
  if (alreadyAwarded) return null

  const { data, error } = await supabase
    .from('execute_tasks')
    .insert({
      user_id: userId,
      framework_key: frameworkKey,
      title: framework.title,
      phase: framework.phase,
      points: framework.points,
      target_count: framework.target,
      is_framework: true,
      scheduled_date: periodStart,
      completed: true,
      completed_at: new Date().toISOString(),
      project_id: null,
    })
    .select()
    .single()

  if (error) {
    console.warn('Error awarding framework completion:', error.message)
    return null
  }

  return data
}

/**
 * Save user framework preferences
 */
export async function saveFrameworkPreferences(userId, preferences) {
  const { error } = await supabase
    .from('user_crm_stats')
    .update({ framework_preferences: preferences })
    .eq('user_id', userId)

  if (error) {
    console.error('Error saving framework preferences:', error)
  }
}
