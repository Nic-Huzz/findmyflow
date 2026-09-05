/**
 * voicePatternDetector.js — Detects recurring voice-dimension patterns from gap data
 *
 * When the same gap_voice appears on 3+ challenges with overlapping dimensions,
 * triggers a pattern-discovered popup. One-time per voice (tracked in voice_pattern_prompts).
 *
 * Used by: GroanCompletionModal (after gap_check), LevelTab (on mount)
 */

import { supabase } from './supabaseClient'

/**
 * Check if a new voice-dimension pattern has emerged that hasn't been shown yet.
 *
 * @param {string} userId
 * @returns {Promise<{ voice: string, dimensions: string[], count: number } | null>}
 */
export async function detectNewPattern(userId) {
  if (!userId) return null

  try {
    // 1. Get all completed challenges with gap_voice
    const { data: challenges } = await supabase
      .from('groan_challenges')
      .select('gap_voice, dimension_values')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('gap_voice', 'is', null)
      .not('dimension_values', 'is', null)

    if (!challenges?.length) return null

    // 2. Group by voice, collect dimension co-occurrences
    const voiceGroups = {}
    for (const c of challenges) {
      const voice = c.gap_voice
      if (!voiceGroups[voice]) voiceGroups[voice] = { count: 0, dimCounts: {} }
      voiceGroups[voice].count++
      for (const dim of Object.keys(c.dimension_values)) {
        voiceGroups[voice].dimCounts[dim] = (voiceGroups[voice].dimCounts[dim] || 0) + 1
      }
    }

    // 3. Find voices with 3+ occurrences
    const candidates = Object.entries(voiceGroups)
      .filter(([, g]) => g.count >= 3)
      .map(([voice, g]) => {
        // Primary dimensions = dimensions that appear on 60%+ of this voice's challenges
        const threshold = g.count * 0.6
        const primaryDims = Object.entries(g.dimCounts)
          .filter(([, count]) => count >= threshold)
          .sort((a, b) => b[1] - a[1])
          .map(([dim]) => dim)
        return { voice, dimensions: primaryDims, count: g.count }
      })
      .filter(c => c.dimensions.length > 0)

    if (!candidates.length) return null

    // 4. Check which patterns have already been shown
    const { data: shown } = await supabase
      .from('voice_pattern_prompts')
      .select('voice')
      .eq('user_id', userId)

    const shownVoices = new Set((shown || []).map(s => s.voice))
    const newPattern = candidates.find(c => !shownVoices.has(c.voice))

    return newPattern || null
  } catch (err) {
    console.warn('Voice pattern detection error:', err)
    return null
  }
}

/**
 * Mark a pattern as shown (prevents re-prompting).
 */
export async function markPatternShown(userId, voice, dimensions) {
  try {
    await supabase.from('voice_pattern_prompts').upsert({
      user_id: userId,
      voice,
      primary_dimensions: dimensions,
      shown_at: new Date().toISOString(),
    }, { onConflict: 'user_id,voice' })
  } catch (e) {
    console.warn('Mark pattern shown error:', e)
  }
}

/**
 * Get the healing response for a pattern (if user already completed it).
 */
export async function getPatternHealing(userId, voice) {
  try {
    const { data } = await supabase
      .from('pattern_healing_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('voice', voice)
      .maybeSingle()
    return data
  } catch (e) {
    return null
  }
}

const VOICE_DISPLAY = {
  ghost: { name: 'Ghost', icon: '👻' },
  perfectionist: { name: 'Perfectionist', icon: '🎯' },
  'people-pleaser': { name: 'People Pleaser', icon: '🪞' },
  controller: { name: 'Controller', icon: '🎮' },
  'auto-pilot': { name: 'Auto-Pilot', icon: '🛋️' },
}

/**
 * Get display metadata for a voice.
 */
export function getVoiceDisplay(voiceId) {
  return VOICE_DISPLAY[voiceId] || { name: voiceId, icon: '❓' }
}

const DIM_LABELS = {
  people: 'People', money: 'Money', vulnerability: 'Vulnerability',
  stakes: 'Stakes', rarity: 'Rarity', identity: 'Identity',
  context: 'Context', business_commitment: 'Business',
}

/**
 * Build the pattern popup message.
 * e.g. "Ghost has shown up every time you push Vulnerability. Want to explore what's behind it?"
 */
export function buildPatternMessage(voice, dimensions) {
  const v = getVoiceDisplay(voice)
  const dimLabels = dimensions.map(d => DIM_LABELS[d] || d).slice(0, 2).join(' and ')
  return `${v.icon} ${v.name} has shown up every time you push ${dimLabels}. Want to explore what's behind it?`
}
