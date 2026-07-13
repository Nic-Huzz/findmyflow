import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useInsightDrops(userId) {
  const [insight, setInsight] = useState(null)

  useEffect(() => {
    if (!userId) return
    // Only check once per mount (1 per session)
    checkInsights(userId).then(setInsight)
  }, [userId])

  const dismiss = () => {
    if (insight?.key) localStorage.setItem(`insight_seen_${insight.key}`, 'true')
    setInsight(null)
  }

  return { insight, dismissInsight: dismiss }
}

async function checkInsights(userId) {
  const seen = (key) => localStorage.getItem(`insight_seen_${key}`)

  // Try Brief first for pattern-based insights
  const { data: briefRow } = await supabase
    .from('zarlo_briefs')
    .select('brief')
    .eq('user_id', userId)
    .maybeSingle()

  const brief = briefRow?.brief

  // 1. Common: Visibility layer dominance (needs 5+ wahoos)
  if (brief?.patterns?.visibility_layers) {
    const layers = brief.patterns.visibility_layers
    const total = Object.values(layers).reduce((a, b) => a + b, 0)
    if (total >= 5) {
      const top = Object.entries(layers).sort((a, b) => b[1] - a[1])[0]
      if (top && top[1] / total >= 0.6) {
        const key = `category_${top[0]}`
        if (!seen(key)) {
          return {
            key, rarity: 'common', icon: '🎯',
            title: `Your courage lives in ${cap(top[0])}`,
            body: `${Math.round(top[1] / total * 100)}% of your wahoos are ${cap(top[0])} challenges.`,
          }
        }
      }
    }
  }

  // 2. Common: Streak milestone REACHED (direct query, not Brief — avoids staleness)
  const { data: streakData } = await supabase
    .from('groan_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .maybeSingle()

  const streak = streakData?.current_streak || 0
  for (const m of [7, 14, 21, 30, 60, 100]) {
    if (streak >= m && !seen(`streak_reached_${m}`)) {
      return {
        key: `streak_reached_${m}`, rarity: 'common', icon: '🔥',
        title: `${m} days`,
        body: `${m} days of showing up. Your nervous system is learning something new about you.`,
      }
    }
  }

  // 3. Uncommon: First visibility layer unlocked
  if (brief?.patterns?.visibility_layers) {
    for (const [layer, count] of Object.entries(brief.patterns.visibility_layers)) {
      if (count === 1 && !seen(`first_${layer}`)) {
        return {
          key: `first_${layer}`, rarity: 'uncommon', icon: '✨',
          title: `New territory: ${cap(layer)}`,
          body: `You just went ${cap(layer)} for the first time. The voice didn't want you here.`,
        }
      }
    }
  }

  // 4. Uncommon: Protective voice emerging (count = 3)
  const voice = brief?.patterns?.dominant_voice
  if (voice?.count === 3 && !seen(`voice_emerging_${voice.name}`)) {
    return {
      key: `voice_emerging_${voice.name}`, rarity: 'uncommon', icon: '🔮',
      title: `Voice identified: The ${cap(voice.name)}`,
      body: `The ${cap(voice.name)} is your most frequent block. It shows up when you're about to do something that matters.`,
    }
  }

  return null
}

function cap(str) {
  return str?.charAt(0).toUpperCase() + str?.slice(1).replace(/_/g, ' ')
}
