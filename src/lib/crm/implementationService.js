/**
 * Implementation Service - Offer Implementation Tracker
 * Handles creating, fetching, and managing offer implementations
 * Part of Sales Tower Tier 2
 */
import { supabase } from '../supabaseClient'
import { getOfferChecklist, calculateChecklistProgress } from '../implementationChecklists'

// Status display info
export const IMPLEMENTATION_STATUS = {
  not_started: { label: 'Not Started', color: '#6b7280' },
  in_progress: { label: 'In Progress', color: '#6366f1' },
  completed: { label: 'Completed', color: '#22c55e' }
}

// Category display info
export const CATEGORY_INFO = {
  attraction: { label: 'Attraction', icon: '🧲', color: '#8b5cf6' },
  upsell: { label: 'Upsell', icon: '⬆️', color: '#22c55e' },
  downsell: { label: 'Downsell', icon: '⬇️', color: '#f59e0b' },
  continuity: { label: 'Continuity', icon: '🔄', color: '#3b82f6' }
}

// Map category to flow type for checklist loading
export const CATEGORY_TO_FLOW_TYPE = {
  attraction: 'attraction_offer',
  upsell: 'upsell_flow',
  downsell: 'downsell_flow',
  continuity: 'continuity_flow'
}

/**
 * Fetch all implementations for a user
 * @param {string} userId - User ID
 * @param {string} projectId - Optional project ID to filter by
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchImplementations(userId, projectId = null) {
  let query = supabase
    .from('offer_implementations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching implementations:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch implementations grouped by category
 * @param {string} userId - User ID
 * @param {string} projectId - Optional project ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchImplementationsByCategory(userId, projectId = null) {
  const { data, error } = await fetchImplementations(userId, projectId)

  if (error) {
    return { data: null, error }
  }

  const grouped = {
    attraction: [],
    upsell: [],
    downsell: [],
    continuity: []
  }

  data?.forEach(impl => {
    if (grouped[impl.category]) {
      grouped[impl.category].push(impl)
    }
  })

  return { data: grouped, error: null }
}

/**
 * Fetch a single implementation by ID
 * @param {string} implementationId - Implementation ID
 * @param {string} userId - User ID (for RLS verification)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchImplementation(implementationId, userId) {
  const { data, error } = await supabase
    .from('offer_implementations')
    .select('*')
    .eq('id', implementationId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching implementation:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Check if an implementation already exists for this offer type + project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {string} offerType - Offer type (e.g., 'classic_upsell')
 * @returns {Promise<{exists: boolean, implementation: Object|null, error: Error|null}>}
 */
export async function checkExistingImplementation(userId, projectId, offerType) {
  const { data, error } = await supabase
    .from('offer_implementations')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('offer_type', offerType)
    .maybeSingle()

  if (error) {
    console.error('Error checking existing implementation:', error)
    return { exists: false, implementation: null, error }
  }

  return {
    exists: !!data,
    implementation: data,
    error: null
  }
}

/**
 * Create a new implementation
 * @param {string} userId - User ID
 * @param {Object} implData - Implementation data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createImplementation(userId, implData) {
  const { projectId, offerType, category, flowAssessmentId } = implData

  // Get the checklist to calculate total tasks
  const flowType = CATEGORY_TO_FLOW_TYPE[category]
  const checklist = await getOfferChecklist(flowType, offerType)

  let totalTasks = 0
  if (checklist?.implementation_checklist) {
    totalTasks = checklist.implementation_checklist.reduce(
      (sum, phase) => sum + (phase.tasks?.length || 0),
      0
    )
  }

  const { data, error } = await supabase
    .from('offer_implementations')
    .insert({
      user_id: userId,
      project_id: projectId,
      offer_type: offerType,
      category: category,
      flow_assessment_id: flowAssessmentId || null,
      status: 'not_started',
      completed_tasks: [],
      current_phase: 0,
      total_tasks: totalTasks,
      started_at: null,
      completed_at: null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating implementation:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Toggle a task's completion status
 * @param {string} implementationId - Implementation ID
 * @param {string} userId - User ID
 * @param {number} phaseIndex - Phase index (0-based)
 * @param {number} taskIndex - Task index within phase (0-based)
 * @returns {Promise<{data: Object|null, phaseCompleted: boolean, allCompleted: boolean, error: Error|null}>}
 */
export async function toggleTaskCompletion(implementationId, userId, phaseIndex, taskIndex) {
  // First, fetch current implementation
  const { data: current, error: fetchError } = await fetchImplementation(implementationId, userId)

  if (fetchError || !current) {
    return { data: null, phaseCompleted: false, allCompleted: false, error: fetchError }
  }

  const completedTasks = [...(current.completed_tasks || [])]
  const taskKey = { phase: phaseIndex, taskIndex: taskIndex }

  // Check if task is already completed
  const existingIndex = completedTasks.findIndex(
    t => t.phase === phaseIndex && t.taskIndex === taskIndex
  )

  if (existingIndex >= 0) {
    // Remove task (uncomplete it)
    completedTasks.splice(existingIndex, 1)
  } else {
    // Add task (complete it)
    completedTasks.push(taskKey)
  }

  // Determine new status
  const completedCount = completedTasks.length
  const totalTasks = current.total_tasks
  let newStatus = current.status
  let completedAt = current.completed_at
  let startedAt = current.started_at

  if (completedCount === 0) {
    newStatus = 'not_started'
    startedAt = null
    completedAt = null
  } else if (completedCount >= totalTasks) {
    newStatus = 'completed'
    completedAt = new Date().toISOString()
    if (!startedAt) startedAt = completedAt
  } else {
    newStatus = 'in_progress'
    if (!startedAt) startedAt = new Date().toISOString()
    completedAt = null
  }

  // Determine current phase (highest phase with incomplete tasks)
  let currentPhase = 0
  if (completedTasks.length > 0) {
    const phases = completedTasks.map(t => t.phase)
    currentPhase = Math.max(...phases)
  }

  // Update the implementation
  const { data, error } = await supabase
    .from('offer_implementations')
    .update({
      completed_tasks: completedTasks,
      status: newStatus,
      current_phase: currentPhase,
      started_at: startedAt,
      completed_at: completedAt
    })
    .eq('id', implementationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating task completion:', error)
    return { data: null, phaseCompleted: false, allCompleted: false, error }
  }

  // Check if a phase was just completed (for celebration)
  const phaseCompleted = await checkPhaseCompletion(data, phaseIndex)
  const allCompleted = newStatus === 'completed'

  return { data, phaseCompleted, allCompleted, error: null }
}

/**
 * Check if a specific phase is fully completed
 * @param {Object} implementation - Implementation data
 * @param {number} phaseIndex - Phase to check
 * @returns {Promise<boolean>}
 */
async function checkPhaseCompletion(implementation, phaseIndex) {
  const flowType = CATEGORY_TO_FLOW_TYPE[implementation.category]
  const checklist = await getOfferChecklist(flowType, implementation.offer_type)

  if (!checklist?.implementation_checklist?.[phaseIndex]) {
    return false
  }

  const phaseTasks = checklist.implementation_checklist[phaseIndex].tasks || []
  const completedTasks = implementation.completed_tasks || []

  // Check if all tasks in this phase are completed
  const phaseTasksCompleted = phaseTasks.every((_, taskIndex) =>
    completedTasks.some(t => t.phase === phaseIndex && t.taskIndex === taskIndex)
  )

  return phaseTasksCompleted
}

/**
 * Update implementation status directly
 * @param {string} implementationId - Implementation ID
 * @param {string} userId - User ID
 * @param {string} status - New status
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateImplementationStatus(implementationId, userId, status) {
  const updates = { status }

  if (status === 'in_progress' && !updates.started_at) {
    updates.started_at = new Date().toISOString()
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('offer_implementations')
    .update(updates)
    .eq('id', implementationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating implementation status:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Delete an implementation
 * @param {string} implementationId - Implementation ID
 * @param {string} userId - User ID
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteImplementation(implementationId, userId) {
  const { error } = await supabase
    .from('offer_implementations')
    .delete()
    .eq('id', implementationId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting implementation:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Get implementation progress with checklist data
 * @param {Object} implementation - Implementation record
 * @returns {Promise<Object>} Progress data with checklist
 */
export async function getImplementationWithProgress(implementation) {
  const flowType = CATEGORY_TO_FLOW_TYPE[implementation.category]
  const checklist = await getOfferChecklist(flowType, implementation.offer_type)

  const progress = calculateChecklistProgress(
    implementation.completed_tasks || [],
    checklist?.implementation_checklist || []
  )

  // Calculate per-phase progress
  const phaseProgress = []
  if (checklist?.implementation_checklist) {
    checklist.implementation_checklist.forEach((phase, phaseIndex) => {
      const phaseTasks = phase.tasks || []
      const completedInPhase = (implementation.completed_tasks || []).filter(
        t => t.phase === phaseIndex
      ).length

      phaseProgress.push({
        phase: phase.phase,
        phaseIndex,
        completed: completedInPhase,
        total: phaseTasks.length,
        percentage: phaseTasks.length > 0
          ? Math.round((completedInPhase / phaseTasks.length) * 100)
          : 0,
        isComplete: completedInPhase >= phaseTasks.length
      })
    })
  }

  return {
    ...implementation,
    checklist,
    progress,
    phaseProgress
  }
}

/**
 * Get implementation stats for dashboard
 * @param {string} userId - User ID
 * @param {string} projectId - Optional project ID
 * @returns {Promise<Object>} Stats summary
 */
export async function getImplementationStats(userId, projectId = null) {
  const { data, error } = await fetchImplementations(userId, projectId)

  if (error || !data) {
    return {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      byCategory: {},
      currentFocus: null
    }
  }

  const stats = {
    total: data.length,
    notStarted: data.filter(i => i.status === 'not_started').length,
    inProgress: data.filter(i => i.status === 'in_progress').length,
    completed: data.filter(i => i.status === 'completed').length,
    byCategory: {
      attraction: data.filter(i => i.category === 'attraction').length,
      upsell: data.filter(i => i.category === 'upsell').length,
      downsell: data.filter(i => i.category === 'downsell').length,
      continuity: data.filter(i => i.category === 'continuity').length
    },
    // Current focus: most recently updated in_progress implementation
    currentFocus: data.find(i => i.status === 'in_progress') || null
  }

  // If we have a current focus, get its progress
  if (stats.currentFocus) {
    const progress = stats.currentFocus.total_tasks > 0
      ? Math.round(((stats.currentFocus.completed_tasks?.length || 0) / stats.currentFocus.total_tasks) * 100)
      : 0
    stats.currentFocus = {
      ...stats.currentFocus,
      progressPercentage: progress
    }
  }

  return stats
}

/**
 * Check if task is completed
 * @param {Array} completedTasks - Array of completed task objects
 * @param {number} phaseIndex - Phase index
 * @param {number} taskIndex - Task index
 * @returns {boolean}
 */
export function isTaskCompleted(completedTasks, phaseIndex, taskIndex) {
  return (completedTasks || []).some(
    t => t.phase === phaseIndex && t.taskIndex === taskIndex
  )
}

/**
 * Get the next uncompleted tasks across active implementations
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {number} tasksPerImpl - Max tasks to surface per implementation
 * @returns {Promise<Array>} Flat list of next tasks grouped by implementation
 */
export async function getNextImplementationTasks(userId, projectId, tasksPerImpl = 2) {
  const { data: impls } = await supabase
    .from('offer_implementations')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .neq('status', 'completed')
    .order('created_at')

  if (!impls?.length) return []

  const categoryOrder = ['attraction', 'upsell', 'downsell', 'continuity']
  const sorted = [...impls].sort((a, b) =>
    categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
  )

  const results = []

  for (const impl of sorted) {
    const withProgress = await getImplementationWithProgress(impl)
    const checklist = withProgress.checklist?.implementation_checklist || []
    const completedTasks = impl.completed_tasks || []
    const catInfo = CATEGORY_INFO[impl.category]
    let count = 0

    for (let pi = 0; pi < checklist.length && count < tasksPerImpl; pi++) {
      const phase = checklist[pi]
      for (let ti = 0; ti < phase.tasks.length && count < tasksPerImpl; ti++) {
        if (!isTaskCompleted(completedTasks, pi, ti)) {
          results.push({
            implId: impl.id,
            implName: withProgress.checklist?.name || impl.offer_type,
            category: impl.category,
            categoryIcon: catInfo?.icon || '📋',
            phaseName: phase.phase,
            phaseIndex: pi,
            taskIndex: ti,
            title: phase.tasks[ti].task,
            description: phase.tasks[ti].description,
          })
          count++
        }
      }
    }
  }

  return results
}

export default {
  IMPLEMENTATION_STATUS,
  CATEGORY_INFO,
  CATEGORY_TO_FLOW_TYPE,
  fetchImplementations,
  fetchImplementationsByCategory,
  fetchImplementation,
  checkExistingImplementation,
  createImplementation,
  toggleTaskCompletion,
  updateImplementationStatus,
  deleteImplementation,
  getImplementationWithProgress,
  getImplementationStats,
  getNextImplementationTasks,
  isTaskCompleted
}
