import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export const SKILL_THRESHOLDS = {
  presence:  [7, 20, 40, 70, 100],
  courage:   [3, 10, 25, 45, 65],
  depth:     [2, 5, 10, 15, 20],
  recovery:  [2, 5, 10, 18, 30],
  curiosity: [1, 2, 3, 4, 5],
}

const SKILL_LABELS = {
  presence: 'Commitment',
  courage: 'Courage',
  depth: 'Compassion',
  recovery: 'Capacity',
  curiosity: 'Curiosity',
}

const SKILL_UNITS = {
  presence: 'check-ins',
  courage: 'courage challenges',
  depth: 'healing flows',
  recovery: 'recoveries',
  curiosity: 'paths explored',
}

const SKILL_EXPLAINERS = {
  presence: 'How often you show up. Tune tab, daily check-in.',
  courage: 'Challenges you faced. Courage tab.',
  depth: 'Times you went into what blocks you. Healing flow on your quests.',
  recovery: 'Bouncing back after a hard day. Tune tab, drains section.',
  curiosity: 'Life paths you explored. Journey tab.',
}

export function computeLevel(count, thresholds) {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (count >= thresholds[i]) return i + 1
  }
  return 0
}

export function getNextThreshold(count, thresholds) {
  for (let i = 0; i < thresholds.length; i++) {
    if (count < thresholds[i]) return thresholds[i]
  }
  return null // maxed out
}

export function formatSkillsForPrompt(skills) {
  if (!skills) return ''
  return Object.entries(skills).map(([key, s]) => {
    const label = SKILL_LABELS[key]
    const level = s.level > 0 ? `L${s.level}` : '--'
    return `${label}: ${level} (${s.count} ${SKILL_UNITS[key]})`
  }).join('\n')
}

export function useSkills(userId) {
  const [skills, setSkills] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    Promise.all([
      // Presence: daily check-ins
      supabase.from('nervous_system_checkins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('checkin_type', 'daily'),

      // Courage: wahoos completed
      supabase.from('quest_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('quest_category', 'Groans'),

      // Depth: healing flows completed (recognised or released)
      supabase.from('healing_intentions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('healing_stage', ['recognised', 'released']),

      // Recovery: drain→bounce pairs (RPC)
      supabase.rpc('compute_recovery_count', { p_user_id: userId }),

      // Curiosity: quests with completed wahoos (RPC)
      supabase.rpc('compute_curiosity_count', { p_user_id: userId }),
    ]).then(([presence, courage, depth, recovery, curiosity]) => {
      const counts = {
        presence: presence.count || 0,
        courage: courage.count || 0,
        depth: depth.count || 0,
        recovery: recovery.data ?? 0,
        curiosity: curiosity.data ?? 0,
      }

      const result = {}
      for (const [key, count] of Object.entries(counts)) {
        const thresholds = SKILL_THRESHOLDS[key]
        result[key] = {
          count,
          level: computeLevel(count, thresholds),
          nextThreshold: getNextThreshold(count, thresholds),
          label: SKILL_LABELS[key],
          unit: SKILL_UNITS[key],
          explainer: SKILL_EXPLAINERS[key],
        }
      }

      setSkills(result)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  return { skills, loading }
}

export default useSkills
