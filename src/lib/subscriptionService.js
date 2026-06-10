/**
 * Subscription Service
 *
 * Checks user subscription status and determines quest access.
 * Works with user_subscriptions table populated by access codes.
 */
import { supabase } from './supabaseClient'

/**
 * Check if user has an active subscription
 * @param {string} userId
 * @returns {Promise<{active: boolean, plan: string|null, expires: string|null}>}
 */
export async function checkSubscription(userId) {
  if (!userId) return { active: false, plan: null, expires: null }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status, plan_type, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return { active: false, plan: null, expires: null }

  const isActive = data.status === 'active'
  // For subscriptions with an end date, check if still valid
  if (isActive && data.current_period_end) {
    const now = new Date()
    const end = new Date(data.current_period_end)
    if (end < now) return { active: false, plan: data.plan_type, expires: data.current_period_end }
  }

  return {
    active: isActive,
    plan: data.plan_type,
    expires: data.current_period_end
  }
}
