/**
 * shiftDetection.js
 *
 * Detects emotional shifts on a quest by comparing early vs recent
 * wahoo classifications. Used to enrich Zarlo's proactive observations
 * (Dispenza evolution loop: New Behaviours → visible New Emotions).
 *
 * Created: 2026-07-24
 */

import { supabase } from './supabaseClient'

// Nervous system hierarchy: lower = more protective, higher = more expressed
const SHIFT_RANK = { shutdown: 0, anxious: 1, peace: 2, vibe: 3 }

const MIN_CLASSIFICATIONS = 3

/**
 * Detect whether a user's emotional response to challenges on a quest
 * has shifted over time. Compares the first classification vs the most
 * recent, requiring at least 3 completed challenges.
 *
 * @param {string} userId
 * @param {string} questId - UUID of the quest to analyse
 * @param {string} [questLabel] - optional, avoids an extra DB call if provided
 * @returns {Promise<{from: string, to: string, questLabel: string, challengeCount: number, direction: string} | null>}
 */
export async function detectShift(userId, questId, questLabel = null) {
  if (!userId || !questId) return null

  try {
    // 1. Get courage challenge IDs linked to this quest (cap at 50 to avoid URL length issues with .in())
    const { data: tasks } = await supabase
      .from('quest_tasks')
      .select('groan_challenge_id')
      .eq('quest_id', questId)
      .eq('user_id', userId)
      .not('groan_challenge_id', 'is', null)
      .limit(50)

    const challengeIds = (tasks || []).map(t => t.groan_challenge_id).filter(Boolean)
    if (challengeIds.length < MIN_CLASSIFICATIONS) return null

    // 2. Get completions ordered chronologically
    const questCompletionIds = challengeIds.map(id => `play_list_challenge_${id}`)
    const { data: completions } = await supabase
      .from('quest_completions')
      .select('quest_id, reflection_text, created_at')
      .eq('user_id', userId)
      .in('quest_id', questCompletionIds)
      .order('created_at', { ascending: true })

    // 3. Extract classifications
    const classifications = (completions || [])
      .map(row => {
        try {
          const parsed = JSON.parse(row.reflection_text)
          return parsed?.wahoo_classification
        } catch { return null }
      })
      .filter(c => c && SHIFT_RANK[c] !== undefined)

    if (classifications.length < MIN_CLASSIFICATIONS) return null

    // 4. Compare first vs most recent classification
    const fromState = classifications[0]
    const toState = classifications[classifications.length - 1]

    if (!fromState || !toState || fromState === toState) return null

    const direction = SHIFT_RANK[toState] > SHIFT_RANK[fromState] ? 'positive'
      : SHIFT_RANK[toState] < SHIFT_RANK[fromState] ? 'negative' : 'lateral'

    // v1: only report positive shifts (growth)
    if (direction !== 'positive') return null

    // 5. Resolve quest label if not provided
    if (!questLabel) {
      const { data: quest } = await supabase
        .from('quests')
        .select('label')
        .eq('id', questId)
        .maybeSingle()
      questLabel = quest?.label || 'this path'
    }

    return {
      from: fromState,
      to: toState,
      questLabel,
      challengeCount: classifications.length,
      direction,
    }
  } catch (err) {
    console.warn('Shift detection error:', err)
    return null
  }
}
