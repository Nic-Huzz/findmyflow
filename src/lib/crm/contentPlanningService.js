// src/lib/crm/contentPlanningService.js
// Service layer for CRM Content Planning System

import { supabase } from '../supabaseClient'
import { getPlanningWeekStart, getCurrentWeekPlan } from './weeklyPlanningService'

// ============================================
// PHASE → CONTENT TYPE MAPPING
// ============================================

export const PHASE_CONTENT_TYPES = {
  build: [
    { type: 'behind_the_scenes', label: 'Behind the Scenes', icon: '📸' },
    { type: 'progress_update', label: 'Progress Update', icon: '📈' },
    { type: 'tutorial', label: 'How-To / Tutorial', icon: '🎓' }
  ],
  launch: [
    { type: 'urgency', label: 'Urgency/Scarcity', icon: '⏰' },
    { type: 'testimonial', label: 'Social Proof', icon: '⭐' },
    { type: 'cta', label: 'Call to Action', icon: '📣' },
    { type: 'countdown', label: 'Launch Countdown', icon: '🚀' }
  ],
  deliver: [
    { type: 'case_study', label: 'Case Study', icon: '📊' },
    { type: 'client_win', label: 'Client Win', icon: '🏆' },
    { type: 'process', label: 'Process/Method', icon: '⚙️' }
  ],
  recap: [
    { type: 'learnings', label: 'Lessons Learned', icon: '💡' },
    { type: 'metrics', label: 'Results & Metrics', icon: '📉' },
    { type: 'retrospective', label: 'Retrospective', icon: '🔍' }
  ]
}

/**
 * Get content types for active phases
 */
export function getContentTypesForPhases(phases) {
  const types = []
  phases.forEach(phase => {
    const phaseTypes = PHASE_CONTENT_TYPES[phase] || []
    phaseTypes.forEach(type => {
      types.push({ ...type, phase })
    })
  })
  return types
}

/**
 * Get active phases from weekly plan
 */
export async function getActivePhases(userId) {
  const plan = await getCurrentWeekPlan(userId)
  return plan?.active_phases || []
}

// ============================================
// CONTENT PLAN CRUD
// ============================================

/**
 * Get current week's content plan
 */
export async function getCurrentContentPlan(userId) {
  const weekStart = getPlanningWeekStart()

  const { data, error } = await supabase
    .from('crm_content_plans')
    .select(`
      *,
      items:crm_content_items(*)
    `)
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching content plan:', error)
  }

  // Sort items by sort_order
  if (data?.items) {
    data.items.sort((a, b) => a.sort_order - b.sort_order)
  }

  return data
}

/**
 * Check if content plan exists for current week
 */
export async function hasCurrentContentPlan(userId) {
  const plan = await getCurrentContentPlan(userId)
  return !!plan
}

/**
 * Create a new content plan with items
 */
export async function createContentPlan(userId, items) {
  const weekStart = getPlanningWeekStart()

  // Create the plan
  const { data: plan, error: planError } = await supabase
    .from('crm_content_plans')
    .insert({
      user_id: userId,
      week_start: weekStart
    })
    .select()
    .single()

  if (planError) {
    console.error('Error creating content plan:', planError)
    return null
  }

  // Create the items
  const itemsToInsert = items.map((item, index) => ({
    plan_id: plan.id,
    user_id: userId,
    content_type: item.type,
    phase: item.phase,
    label: item.label,
    icon: item.icon,
    context: item.context,
    sort_order: index,
    status: 'planned'
  }))

  const { error: itemsError } = await supabase
    .from('crm_content_items')
    .insert(itemsToInsert)

  if (itemsError) {
    console.error('Error creating content items:', itemsError)
    // Clean up the plan
    await supabase.from('crm_content_plans').delete().eq('id', plan.id)
    return null
  }

  return getCurrentContentPlan(userId)
}

/**
 * Update content plan (replace all items)
 */
export async function updateContentPlan(userId, planId, items) {
  // Delete existing items
  await supabase
    .from('crm_content_items')
    .delete()
    .eq('plan_id', planId)

  // Insert new items
  const itemsToInsert = items.map((item, index) => ({
    plan_id: planId,
    user_id: userId,
    content_type: item.type,
    phase: item.phase,
    label: item.label,
    icon: item.icon,
    context: item.context,
    sort_order: index,
    status: item.status || 'planned',
    generated_content: item.generated_content,
    generated_at: item.generated_at
  }))

  const { error } = await supabase
    .from('crm_content_items')
    .insert(itemsToInsert)

  if (error) {
    console.error('Error updating content items:', error)
    return null
  }

  // Update plan timestamp
  await supabase
    .from('crm_content_plans')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', planId)

  return getCurrentContentPlan(userId)
}

// ============================================
// CONTENT ITEM OPERATIONS
// ============================================

/**
 * Update a single content item
 */
export async function updateContentItem(itemId, updates) {
  const { data, error } = await supabase
    .from('crm_content_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    console.error('Error updating content item:', error)
    return null
  }

  return data
}

/**
 * Save generated content for an item
 */
export async function saveGeneratedContent(itemId, content) {
  return updateContentItem(itemId, {
    generated_content: content,
    generated_at: new Date().toISOString(),
    status: 'draft'
  })
}

/**
 * Mark item as published
 */
export async function markItemPublished(itemId) {
  return updateContentItem(itemId, {
    status: 'published',
    published_at: new Date().toISOString()
  })
}

/**
 * Reset item to planned (remove draft)
 */
export async function resetItemToPlanned(itemId) {
  return updateContentItem(itemId, {
    status: 'planned',
    generated_content: null,
    generated_at: null
  })
}

/**
 * Update item context
 */
export async function updateItemContext(itemId, context) {
  return updateContentItem(itemId, { context })
}

// ============================================
// STATS & PROGRESS
// ============================================

/**
 * Get content plan progress stats
 */
export function getContentPlanProgress(plan) {
  if (!plan?.items || plan.items.length === 0) {
    return { total: 0, planned: 0, draft: 0, published: 0, percentComplete: 0 }
  }

  const items = plan.items
  const total = items.length
  const planned = items.filter(i => i.status === 'planned').length
  const draft = items.filter(i => i.status === 'draft').length
  const published = items.filter(i => i.status === 'published').length
  const percentComplete = Math.round((published / total) * 100)

  return { total, planned, draft, published, percentComplete }
}

/**
 * Get content items grouped by status
 */
export function getItemsByStatus(plan) {
  if (!plan?.items) return { planned: [], draft: [], published: [] }

  return {
    planned: plan.items.filter(i => i.status === 'planned'),
    draft: plan.items.filter(i => i.status === 'draft'),
    published: plan.items.filter(i => i.status === 'published')
  }
}
