/**
 * Subscription Service
 *
 * Checks user payment status and determines quest access.
 * Works with user_subscriptions table populated by Stripe webhook.
 */
import { supabase } from './supabaseClient'

// Quest IDs that are free without payment (in addition to all isExplainer quests)
const FREE_QUEST_IDS = [
  'attraction_offer_assessment'
]

/**
 * Check if a quest requires payment
 * @param {object} quest - Quest object from challengeQuestsUpdate.json
 * @returns {boolean} - true if quest requires active subscription
 */
export function isPaidQuest(quest) {
  if (!quest) return false
  // Non-Business quests are always free
  if (quest.category !== 'Business') return false
  // Flow Finder (stage 0) quests are always free
  if (quest.stage_required === 0) return false
  // Explainer quests are always free
  if (quest.isExplainer) return false
  // Specific whitelisted quests are free
  if (FREE_QUEST_IDS.includes(quest.id)) return false
  // Everything else in Business stages 1-7 requires payment
  return quest.stage_required >= 1 && quest.stage_required <= 7
}

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

/**
 * Create a Stripe Checkout Session via edge function
 * @param {string} userId
 * @returns {Promise<string>} - Checkout URL to redirect to
 */
export async function createCheckoutSession(userId) {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        return_url: window.location.href
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create checkout session')
  }

  const { url } = await response.json()
  return url
}
