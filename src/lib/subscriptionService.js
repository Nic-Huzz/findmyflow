/**
 * Subscription Service
 *
 * Checks user subscription status and determines quest access.
 * Works with user_subscriptions table populated by Stripe webhook or access codes.
 *
 * Payment link flow: user pays before signing up. Webhook stores in pending_subscriptions.
 * On first login, claimPendingSubscription() promotes the pending row to user_subscriptions.
 */
import { supabase } from './supabaseClient'

/**
 * Check if user has an active subscription.
 * On first check, also attempts to claim any pending subscription by email.
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

  if (error) return { active: false, plan: null, expires: null }

  // If no subscription found, try claiming a pending one via edge function
  if (!data) {
    const claimed = await claimPendingSubscription()
    if (claimed) return { active: true, plan: claimed.plan, expires: null }
    return { active: false, plan: null, expires: null }
  }

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

/**
 * Claim a pending subscription via edge function (service role).
 * The edge function matches by the authenticated user's email,
 * so the client never touches pending_subscriptions or upserts user_subscriptions directly.
 */
async function claimPendingSubscription() {
  try {
    const { data, error } = await supabase.functions.invoke('claim-subscription')
    if (error || !data?.claimed) return null
    return { plan: data.plan }
  } catch {
    return null
  }
}
