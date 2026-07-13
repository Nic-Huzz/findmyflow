import { supabase } from './supabaseClient'

/**
 * Earn a mystery box. Uses ON CONFLICT DO NOTHING for one-time triggers.
 * Safe to call multiple times for the same trigger.
 */
export async function earnMysteryBox(userId, triggerType, boxTier, metadata = {}) {
  await supabase
    .from('mystery_boxes')
    .insert({
      user_id: userId,
      trigger_type: triggerType,
      box_tier: boxTier,
      metadata,
    })
    .then(() => {})
    .catch(() => {}) // Silent — dedup constraint or any error
}

/**
 * Open a mystery box. Calls the edge function to generate insight.
 */
export async function openMysteryBox(boxId) {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mystery-insight`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ boxId }),
    }
  )
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/**
 * Fetch user's mystery boxes (earned, optionally filtered).
 */
export async function fetchMysteryBoxes(userId, onlyUnopened = false) {
  let query = supabase
    .from('mystery_boxes')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (onlyUnopened) {
    query = query.is('opened_at', null)
  }

  return query
}

/**
 * Check and award first_wahoo box (call after wahoo completion).
 */
export async function checkFirstWahooBox(userId) {
  const { count } = await supabase
    .from('quest_completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('quest_category', 'Groans')

  if (count === 1) {
    await earnMysteryBox(userId, 'first_wahoo', 'bronze')
  }
}

/**
 * Check and award streak milestone boxes.
 */
export async function checkStreakBox(userId, streakDays) {
  if (streakDays === 7) {
    await earnMysteryBox(userId, 'streak_7', 'bronze')
  } else if (streakDays === 30) {
    await earnMysteryBox(userId, '30_day_streak', 'gold')
  }
}

/**
 * Check and award new wahoo category box.
 * Call after wahoo completion with the visibility layer.
 */
export async function checkNewCategoryBox(userId, visibilityLayer) {
  if (!visibilityLayer) return

  // Count distinct categories the user has completed
  const { data } = await supabase
    .from('quest_completions')
    .select('reflection_text')
    .eq('user_id', userId)
    .eq('quest_category', 'Groans')

  const categories = new Set()
  data?.forEach(row => {
    try {
      const ref = JSON.parse(row.reflection_text || '{}')
      if (ref.visibility_layer) categories.add(ref.visibility_layer)
    } catch {}
  })

  // If this layer is new (the set includes it for the first time via the just-inserted row)
  // and they have more than 1 category, award the box
  if (categories.size >= 2 && categories.has(visibilityLayer)) {
    // Use the layer name as part of trigger to allow one box per new category
    await earnMysteryBox(userId, `new_category_${visibilityLayer}`, 'silver', { category: visibilityLayer })
  }
}

/**
 * Check and award capacity zone transition box.
 * Call when capacity score crosses a zone boundary.
 */
export async function checkZoneTransitionBox(userId, newZone, previousZone) {
  if (!newZone || newZone === previousZone) return
  await earnMysteryBox(userId, `zone_${newZone}`, 'gold', { zone: newZone, from: previousZone })
}
