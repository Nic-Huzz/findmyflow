/**
 * observationEngine.js — Intelligence Observations pattern detection
 *
 * Pure functions that take user data and return observation card props or null.
 * Each detector returns { id, type, icon, badge, title, body, action?, resolutionKey }
 *
 * Priority: Pattern > Compass > Milestone > Prompt
 * Within tier: most recently triggered first.
 * Queue: all triggered cards ranked, top 3 shown.
 */

import { getDimensionById, getNumericTier } from '../data/domeDimensions'

// ── Type weights for priority sorting ──
const TYPE_PRIORITY = { pattern: 1, compass: 2, milestone: 3, prompt: 4 }

const BADGE_LABELS = {
  pattern: 'Pattern Spotted',
  compass: 'Compass',
  milestone: 'Milestone',
  prompt: 'Unlock',
}

const BORDER_COLORS = {
  pattern: '#5e17eb',
  compass: 'linear-gradient(135deg, #5e17eb, #7c3aed)',
  milestone: '#22c55e',
  prompt: '#f59e0b',
}

// ── Voice display names ──
const VOICE_NAMES = {
  ghost: 'Ghost',
  perfectionist: 'Perfectionist',
  controller: 'Controller',
  people_pleaser: 'People Pleaser',
  auto_pilot: 'Auto-Pilot',
}

const VOICE_ICONS = {
  ghost: '👻',
  perfectionist: '🎯',
  controller: '🧱',
  people_pleaser: '🪞',
  auto_pilot: '🤖',
}

// ── Helper: parse reflection_text safely ──
function parseReflection(c) {
  try {
    return typeof c.reflection_text === 'string'
      ? JSON.parse(c.reflection_text)
      : c.reflection_text
  } catch { return null }
}

// ═══════════════════════════════════════════════════════════
// PHASE 1 PATTERNS
// ═══════════════════════════════════════════════════════════

// DETECTOR: Expectation Trend
export function detectExpectationTrend(completions) {
  const withExpectation = (completions || [])
    .map(c => parseReflection(c)?.expectation_result || null)
    .filter(Boolean)

  if (withExpectation.length < 10) {
    if (withExpectation.length >= 7) {
      const remaining = 10 - withExpectation.length
      return {
        id: 'near_expectation_trend',
        type: 'prompt',
        icon: '🔮',
        badge: BADGE_LABELS.prompt,
        title: 'Almost there',
        body: `${remaining} more challenge${remaining === 1 ? '' : 's'} with the "how did it go?" check and we can show you your expectation trend.`,
        triggeredAt: Date.now(),
        resolutionKey: 'expectation_trend',
      }
    }
    return null
  }

  const recent = withExpectation.slice(-10)
  const betterCount = recent.filter(r => r === 'better').length
  const pct = Math.round((betterCount / recent.length) * 100)

  if (pct < 70) return null

  return {
    id: `expectation_trend_${pct}`,
    type: 'pattern',
    icon: '🔮',
    badge: BADGE_LABELS.pattern,
    title: 'The voice is wrong most of the time',
    body: `Almost all your challenges went better than you thought they would (${pct}%). The fear voice overestimates, every time.`,
    triggeredAt: Date.now(),
    resolutionKey: 'expectation_trend',
  }
}

// DETECTOR: Voice × Dimension Cluster
export function detectVoiceDimensionCluster(challenges) {
  const completed = (challenges || []).filter(c =>
    c.status === 'completed' && c.gap_voice && c.dimension_values
  )

  if (completed.length < 3) return null

  const thirtyDaysAgo = Date.now() - 30 * 86400000
  const recent = completed.filter(c => {
    const ts = c.completed_at ? new Date(c.completed_at).getTime() : 0
    return ts >= thirtyDaysAgo
  })

  if (recent.length < 3) return null

  const clusters = {}
  recent.forEach(c => {
    const voice = c.gap_voice
    Object.keys(c.dimension_values || {}).forEach(dimId => {
      const key = `${voice}_${dimId}`
      if (!clusters[key]) clusters[key] = { voice, dimId, count: 0 }
      clusters[key].count++
    })
  })

  const sorted = Object.values(clusters)
    .filter(c => c.count >= 3)
    .sort((a, b) => b.count - a.count)

  if (sorted.length === 0) {
    const nearPattern = Object.values(clusters)
      .filter(c => c.count === 2)
      .sort((a, b) => b.count - a.count)[0]

    if (nearPattern) {
      const dim = getDimensionById(nearPattern.dimId)
      const voiceName = VOICE_NAMES[nearPattern.voice] || nearPattern.voice
      return {
        id: `near_voice_dim_${nearPattern.voice}_${nearPattern.dimId}`,
        type: 'prompt',
        icon: VOICE_ICONS[nearPattern.voice] || '🔍',
        badge: BADGE_LABELS.prompt,
        title: 'Pattern forming',
        body: `Your ${voiceName} appeared on ${dim?.label || nearPattern.dimId} twice. One more and we can spot a pattern.`,
        triggeredAt: Date.now(),
        resolutionKey: `voice_dim_${nearPattern.voice}_${nearPattern.dimId}`,
      }
    }
    return null
  }

  const top = sorted[0]
  const dim = getDimensionById(top.dimId)
  const voiceName = VOICE_NAMES[top.voice] || top.voice
  const voiceIcon = VOICE_ICONS[top.voice] || '🔍'

  return {
    id: `voice_dim_${top.voice}_${top.dimId}_${top.count}`,
    type: 'pattern',
    icon: voiceIcon,
    badge: BADGE_LABELS.pattern,
    title: `${voiceName} on ${dim?.label || top.dimId}`,
    body: `Your ${voiceName} keeps showing up on ${dim?.label || top.dimId} (${top.count} times this month). Something about expanding here is activating that voice.`,
    action: {
      label: 'Ask Zarlo about this',
      zarloContext: `The user's ${voiceName} voice keeps appearing when they push their ${dim?.label || top.dimId} dimension. It's happened ${top.count} times in the last 30 days. Help them explore what's behind this pattern.`,
    },
    triggeredAt: Date.now(),
    resolutionKey: `voice_dim_${top.voice}_${top.dimId}`,
  }
}

// DETECTOR: NS Baseline Shift
export function detectNsBaselineShift(nsCheckins) {
  const withBefore = (nsCheckins || []).filter(c => c.before_state)

  if (withBefore.length < 20) return null

  const sorted = [...withBefore].sort((a, b) =>
    new Date(a.created_at) - new Date(b.created_at)
  )

  const first10 = sorted.slice(0, 10)
  const last10 = sorted.slice(-10)

  const sympatheticPctEarly = Math.round(
    (first10.filter(c => c.before_state === 'sympathetic').length / first10.length) * 100
  )
  const sympatheticPctRecent = Math.round(
    (last10.filter(c => c.before_state === 'sympathetic').length / last10.length) * 100
  )

  const drop = sympatheticPctEarly - sympatheticPctRecent

  if (drop < 20) return null

  let earlyDesc, recentDesc
  if (sympatheticPctEarly >= 70) earlyDesc = 'most challenges in fight-or-flight'
  else if (sympatheticPctEarly >= 50) earlyDesc = 'more than half your challenges in fight-or-flight'
  else earlyDesc = 'many challenges in fight-or-flight'

  if (sympatheticPctRecent <= 30) recentDesc = 'rarely start there now'
  else if (sympatheticPctRecent <= 50) recentDesc = "it's closer to half-and-half"
  else recentDesc = "it's starting to shift"

  return {
    id: `ns_baseline_${sympatheticPctEarly}_${sympatheticPctRecent}`,
    type: 'pattern',
    icon: '🧘',
    badge: BADGE_LABELS.pattern,
    title: 'Your baseline is shifting',
    body: `You used to start ${earlyDesc} (${sympatheticPctEarly}%). Now ${recentDesc} (${sympatheticPctRecent}%). Your nervous system is recalibrating.`,
    action: {
      label: 'Ask Zarlo about this',
      zarloContext: `The user's nervous system baseline has shifted. They used to start ${sympatheticPctEarly}% of challenges in fight-or-flight, now it's ${sympatheticPctRecent}%. Help them reflect on what's changed in their approach.`,
    },
    triggeredAt: Date.now(),
    resolutionKey: 'ns_baseline_shift',
  }
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: MILESTONES + PROMPTS
// ═══════════════════════════════════════════════════════════

// DETECTOR: Challenge Count Milestones
export function detectChallengeCount(challenges) {
  const completed = (challenges || []).filter(c => c.status === 'completed')
  const count = completed.length

  const thresholds = [100, 50, 25, 10]
  for (const t of thresholds) {
    if (count >= t) {
      return {
        id: `challenge_count_${t}`,
        type: 'milestone',
        icon: '🏔️',
        badge: BADGE_LABELS.milestone,
        title: `${count} courage challenges done`,
        body: "You're building a case study in what courage looks like for you.",
        triggeredAt: Date.now(),
        resolutionKey: `challenge_count_${t}`,
      }
    }
  }
  return null
}

// DETECTOR: Quest Streak (consecutive weeks with a challenge on same quest)
export function detectQuestStreak(challenges, questNames) {
  const completed = (challenges || []).filter(c =>
    c.status === 'completed' && c.quest_id && c.completed_at
  )

  if (completed.length < 4) return null

  // Get the Monday of the ISO week for a given date
  function getWeekMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  // Group by quest, collect unique week-Mondays
  const byQuest = {}
  completed.forEach(c => {
    if (!byQuest[c.quest_id]) byQuest[c.quest_id] = new Set()
    byQuest[c.quest_id].add(getWeekMonday(c.completed_at))
  })

  const WEEK_MS = 7 * 86400000
  let bestStreak = 0
  let bestQuestId = null

  Object.entries(byQuest).forEach(([questId, weekSet]) => {
    const mondays = [...weekSet].sort((a, b) => b - a) // most recent first
    let streak = 1
    for (let i = 1; i < mondays.length; i++) {
      const diff = mondays[i - 1] - mondays[i]
      if (diff === WEEK_MS) streak++
      else break
    }
    if (streak > bestStreak) {
      bestStreak = streak
      bestQuestId = questId
    }
  })

  const thresholds = [12, 8, 4]
  for (const t of thresholds) {
    if (bestStreak >= t) {
      const name = questNames?.[bestQuestId] || 'your quest'
      return {
        id: `quest_streak_${bestQuestId}_${t}`,
        type: 'milestone',
        icon: '🔥',
        badge: BADGE_LABELS.milestone,
        title: `${bestStreak} weeks in a row`,
        body: `${bestStreak} weeks in a row on ${name}. Consistency is the compound interest of courage.`,
        triggeredAt: Date.now(),
        resolutionKey: `quest_streak_${bestQuestId}_${t}`,
      }
    }
  }
  return null
}

// DETECTOR: Dimension Level Up
export function detectDimensionLevelUp(challenges, nsCheckins) {
  const completed = (challenges || []).filter(c =>
    c.status === 'completed' && c.dimension_values
  )

  if (completed.length < 2) return null

  // Build NS after_state map by challenge id
  const nsMap = {}
  ;(nsCheckins || []).forEach(c => {
    if (c.source_challenge_id && c.after_state) {
      nsMap[c.source_challenge_id] = c.after_state
    }
  })

  // Track max level per dimension (only if NS after_state was vibe_rise or ventral)
  const maxLevels = {}
  const challengeCounts = {}
  completed.forEach(c => {
    const afterState = nsMap[c.id]
    const grew = afterState === 'vibe_rise' || afterState === 'ventral'
    if (!grew) return

    Object.entries(c.dimension_values).forEach(([dimId, value]) => {
      const dim = getDimensionById(dimId)
      if (!dim) return
      const level = dim.type === 'numeric' ? getNumericTier(dimId, value) : value
      if (!maxLevels[dimId] || level > maxLevels[dimId]) {
        maxLevels[dimId] = level
      }
      challengeCounts[dimId] = (challengeCounts[dimId] || 0) + 1
    })
  })

  // Find highest level achieved
  const best = Object.entries(maxLevels)
    .filter(([, level]) => level >= 2)
    .sort((a, b) => b[1] - a[1])[0]

  if (!best) return null

  const [dimId, level] = best
  const dim = getDimensionById(dimId)
  const count = challengeCounts[dimId] || 0

  return {
    id: `dim_level_${dimId}_${level}`,
    type: 'milestone',
    icon: dim?.icon || '📈',
    badge: BADGE_LABELS.milestone,
    title: `Level ${level} on ${dim?.label || dimId}`,
    body: `You've reached level ${level} on ${dim?.label || dimId}. ${count} challenge${count === 1 ? '' : 's'} got you here.`,
    triggeredAt: Date.now(),
    resolutionKey: `dim_level_${dimId}_${level}`,
  }
}

// DETECTOR: Prediction Milestone
export function detectPredictionMilestone(challenges) {
  const withBoth = (challenges || []).filter(c =>
    c.status === 'completed' &&
    c.predicted_difficulty != null &&
    c.experienced_difficulty != null
  )

  if (withBoth.length < 10) {
    // Prompt card
    if (withBoth.length >= 7) {
      const remaining = 10 - withBoth.length
      return {
        id: 'near_prediction_insight',
        type: 'prompt',
        icon: '🎯',
        badge: BADGE_LABELS.prompt,
        title: 'Prediction trend forming',
        body: `${remaining} more challenge${remaining === 1 ? '' : 's'} with the difficulty check and we can show you your prediction trend.`,
        triggeredAt: Date.now(),
        resolutionKey: 'prediction_milestone',
      }
    }
    return null
  }

  const recent = withBoth.slice(-10)
  const avgGap = recent.reduce((sum, c) =>
    sum + Math.abs(c.predicted_difficulty - c.experienced_difficulty), 0
  ) / recent.length

  const thresholds = [
    { max: 0.5, desc: 'razor sharp' },
    { max: 1.0, desc: 'getting sharp' },
    { max: 1.5, desc: 'improving' },
  ]

  for (const t of thresholds) {
    if (avgGap <= t.max) {
      return {
        id: `prediction_milestone_${t.max}`,
        type: 'milestone',
        icon: '🎯',
        badge: BADGE_LABELS.milestone,
        title: `Your predictions are ${t.desc}`,
        body: `Your prediction gap is under ${t.max} now. You're reading your body better than your voice reads you.`,
        triggeredAt: Date.now(),
        resolutionKey: `prediction_milestone_${t.max}`,
      }
    }
  }
  return null
}

// ═══════════════════════════════════════════════════════════
// PHASE 3: FUEL + CONVERGENCE + IDENTITY PATTERNS
// ═══════════════════════════════════════════════════════════

// DETECTOR: Fuel Drought (path fuel missing for 3+ weeks)
export function detectFuelDrought(pathFuelReviews, questNames) {
  if (!pathFuelReviews?.length) return null

  const FUELS = ['choice', 'connection', 'mastery', 'meaning']

  // Group by quest_id + fuel, count consecutive false weeks (most recent first)
  const byQuest = {}
  pathFuelReviews.forEach(r => {
    if (!byQuest[r.quest_id]) byQuest[r.quest_id] = {}
    const weekKey = r.week_of || r.created_at?.substring(0, 10)
    if (!byQuest[r.quest_id][weekKey]) byQuest[r.quest_id][weekKey] = {}
    FUELS.forEach(f => {
      if (r[f] !== undefined) byQuest[r.quest_id][weekKey][f] = r[f]
    })
  })

  let worstDrought = null
  let worstWeeks = 0

  Object.entries(byQuest).forEach(([questId, weeks]) => {
    const sortedWeeks = Object.keys(weeks).sort().reverse()
    FUELS.forEach(fuel => {
      let consecutive = 0
      for (const w of sortedWeeks) {
        if (weeks[w][fuel] === false) consecutive++
        else break
      }
      if (consecutive >= 3 && consecutive > worstWeeks) {
        worstWeeks = consecutive
        worstDrought = { questId, fuel, weeks: consecutive }
      }
    })
  })

  if (!worstDrought) return null

  const fuelLabel = worstDrought.fuel.charAt(0).toUpperCase() + worstDrought.fuel.slice(1)
  const questName = questNames?.[worstDrought.questId] || 'your path'

  return {
    id: `fuel_drought_${worstDrought.questId}_${worstDrought.fuel}`,
    type: 'pattern',
    icon: '🏜️',
    badge: BADGE_LABELS.pattern,
    title: `${fuelLabel} has gone quiet`,
    body: `${fuelLabel} hasn't shown up on your ${questName} path in ${worstDrought.weeks} weeks. Is this path still feeding you?`,
    action: {
      label: 'Ask Zarlo about this',
      zarloContext: `The user's ${questName} path hasn't lit up their ${fuelLabel} fuel in ${worstDrought.weeks} weeks. Help them explore whether this path still aligns with what feeds them, or if they need to adjust their approach.`,
    },
    triggeredAt: Date.now(),
    resolutionKey: `fuel_drought_${worstDrought.questId}_${worstDrought.fuel}`,
  }
}

// DETECTOR: Fuel Per Challenge (one fuel dominates or is absent)
export function detectFuelPerChallenge(completions) {
  const fuels = { choice: 0, connection: 0, mastery: 0, meaning: 0 }
  let total = 0

  ;(completions || []).forEach(c => {
    const rt = parseReflection(c)
    if (!rt?.life_fuel) return
    total++
    Object.entries(rt.life_fuel).forEach(([f, v]) => {
      if (v && fuels[f] !== undefined) fuels[f]++
    })
  })

  if (total < 10) return null

  const recent = (completions || []).slice(-10)
  const recentFuels = { choice: 0, connection: 0, mastery: 0, meaning: 0 }
  let recentTotal = 0
  recent.forEach(c => {
    const rt = parseReflection(c)
    if (!rt?.life_fuel) return
    recentTotal++
    Object.entries(rt.life_fuel).forEach(([f, v]) => {
      if (v && recentFuels[f] !== undefined) recentFuels[f]++
    })
  })

  if (recentTotal < 8) return null

  // Check for dominant fuel (80%+)
  const dominant = Object.entries(recentFuels)
    .filter(([, count]) => count / recentTotal >= 0.8)
    .sort((a, b) => b[1] - a[1])[0]

  // Check for absent fuel (0 in last 10)
  const absent = Object.entries(recentFuels)
    .filter(([, count]) => count === 0)[0]

  if (dominant && absent) {
    const domLabel = dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1)
    const absLabel = absent[0].charAt(0).toUpperCase() + absent[0].slice(1)
    const pct = Math.round((dominant[1] / recentTotal) * 100)
    return {
      id: `fuel_pattern_${dominant[0]}_${absent[0]}`,
      type: 'pattern',
      icon: '⛽',
      badge: BADGE_LABELS.pattern,
      title: `${domLabel} is doing all the work`,
      body: `Nearly all your challenges light up ${domLabel} (${pct}%). ${absLabel} hasn't fired in ${recentTotal} challenges.`,
      triggeredAt: Date.now(),
      resolutionKey: `fuel_pattern_${dominant[0]}_${absent[0]}`,
    }
  }
  if (dominant) {
    const domLabel = dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1)
    const pct = Math.round((dominant[1] / recentTotal) * 100)
    return {
      id: `fuel_dominant_${dominant[0]}`,
      type: 'pattern',
      icon: '⛽',
      badge: BADGE_LABELS.pattern,
      title: `${domLabel} is your engine`,
      body: `Nearly all your challenges light up ${domLabel} (${pct}%). That's your primary fuel right now.`,
      triggeredAt: Date.now(),
      resolutionKey: `fuel_dominant_${dominant[0]}`,
    }
  }
  return null
}

// DETECTOR: Cross-Pollination Convergence
export function detectCrossPollination(crossPollination, questNames) {
  if (!crossPollination?.length) return null

  // Group by source→target pair
  const pairs = {}
  crossPollination.forEach(cp => {
    const key = `${cp.source_quest_id}_${cp.target_quest_id}`
    if (!pairs[key]) pairs[key] = { source: cp.source_quest_id, target: cp.target_quest_id, count: 0 }
    pairs[key].count++
  })

  const sorted = Object.values(pairs)
    .filter(p => p.count >= 4)
    .sort((a, b) => b.count - a.count)

  if (sorted.length === 0) {
    // Near-pattern: 2-3 occurrences
    const near = Object.values(pairs)
      .filter(p => p.count >= 2 && p.count <= 3)
      .sort((a, b) => b.count - a.count)[0]

    if (near) {
      const srcName = questNames?.[near.source] || 'one quest'
      const tgtName = questNames?.[near.target] || 'another'
      return {
        id: `near_convergence_${near.source}_${near.target}`,
        type: 'prompt',
        icon: '🔀',
        badge: BADGE_LABELS.prompt,
        title: 'Paths crossing',
        body: `${srcName} has fed ${tgtName} ${near.count} times. A few more and we'll know if they're converging.`,
        triggeredAt: Date.now(),
        resolutionKey: `convergence_${near.source}_${near.target}`,
      }
    }
    return null
  }

  const top = sorted[0]
  const srcName = questNames?.[top.source] || 'One quest'
  const tgtName = questNames?.[top.target] || 'another'

  return {
    id: `convergence_${top.source}_${top.target}_${top.count}`,
    type: 'pattern',
    icon: '🔀',
    badge: BADGE_LABELS.pattern,
    title: 'These paths are converging',
    body: `${srcName} kept feeding ${tgtName} (${top.count} of your recent challenges). These might be converging.`,
    action: {
      label: 'Ask Zarlo about this',
      zarloContext: `The user's "${srcName}" quest keeps feeding into their "${tgtName}" quest (${top.count} times). Help them explore what this convergence means for their direction.`,
    },
    triggeredAt: Date.now(),
    resolutionKey: `convergence_${top.source}_${top.target}`,
  }
}

// DETECTOR: Identity Evolution (new words appearing in identity statements)
export function detectIdentityEvolution(completions) {
  const statements = (completions || [])
    .map(c => parseReflection(c)?.identity_statement)
    .filter(Boolean)

  if (statements.length < 8) return null

  const first5 = statements.slice(0, 5)
  const recent = statements.slice(-5)

  // Simple word frequency (lowercase, 4+ chars, stop words excluded)
  const STOP_WORDS = new Set([
    'that','with','have','this','from','they','when','will','been',
    'more','than','into','like','just','also','know','your','able',
    'here','make','come','good','some','time','them','then','what',
    'about','being','their','which','these','those','would','could',
    'should','there','where','other','every','still','after','before',
    'really','doing','thing','things','myself','feel','want','need',
    'always','never','something','because','very','much','even','each',
  ])
  const wordFreq = (stmts) => {
    const freq = {}
    stmts.forEach(s => {
      s.toLowerCase().split(/\s+/).forEach(w => {
        const clean = w.replace(/[^a-z]/g, '')
        if (clean.length >= 4 && !STOP_WORDS.has(clean)) {
          freq[clean] = (freq[clean] || 0) + 1
        }
      })
    })
    return freq
  }

  const earlyWords = wordFreq(first5)
  const recentWords = wordFreq(recent)

  // Find words appearing 3+ times in recent that didn't appear in first 5
  const newWords = Object.entries(recentWords)
    .filter(([word, count]) => count >= 3 && !earlyWords[word])
    .sort((a, b) => b[1] - a[1])

  if (newWords.length === 0) return null

  const [word, count] = newWords[0]

  return {
    id: `identity_evolution_${word}`,
    type: 'pattern',
    icon: '🦋',
    badge: BADGE_LABELS.pattern,
    title: 'Something is shifting',
    body: `Your last ${recent.length} identity statements mention "${word}." That word didn't appear in your first 5. Something is shifting.`,
    triggeredAt: Date.now(),
    resolutionKey: `identity_evolution_${word}`,
  }
}

// DETECTOR: Prediction Accuracy (rolling gap trend)
export function detectPredictionAccuracy(challenges) {
  const withBoth = (challenges || []).filter(c =>
    c.status === 'completed' &&
    c.predicted_difficulty != null &&
    c.experienced_difficulty != null
  )

  if (withBoth.length < 10) return null

  const recent = withBoth.slice(-10)
  const gaps = recent.map(c => Math.abs(c.predicted_difficulty - c.experienced_difficulty))
  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length
  const accurateCount = gaps.filter(g => g <= 1).length
  const pct = Math.round((accurateCount / gaps.length) * 100)

  if (pct < 70) return null

  return {
    id: `prediction_accuracy_${pct}`,
    type: 'pattern',
    icon: '🎯',
    badge: BADGE_LABELS.pattern,
    title: 'You know yourself better than you think',
    body: `You predicted within 1 point of reality on ${accurateCount} out of 10 challenges (${pct}%). You're learning to read your body.`,
    triggeredAt: Date.now(),
    resolutionKey: 'prediction_accuracy',
  }
}

// DETECTOR: Voice Frequency Shift (voice dropping month-over-month)
export function detectVoiceFrequencyShift(challenges) {
  const completed = (challenges || []).filter(c =>
    c.status === 'completed' && c.gap_voice && c.completed_at
  )

  if (completed.length < 6) return null

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`

  // Count per voice per month
  const counts = {}
  completed.forEach(c => {
    const month = c.completed_at.substring(0, 7)
    if (!counts[c.gap_voice]) counts[c.gap_voice] = {}
    counts[c.gap_voice][month] = (counts[c.gap_voice][month] || 0) + 1
  })

  // Find voice with biggest drop
  let bestDrop = null
  Object.entries(counts).forEach(([voice, months]) => {
    const prev = months[lastMonth] || 0
    const curr = months[thisMonth] || 0
    if (prev >= 3 && curr <= Math.ceil(prev * 0.5)) {
      const dropPct = Math.round(((prev - curr) / prev) * 100)
      if (!bestDrop || dropPct > bestDrop.dropPct) {
        bestDrop = { voice, prev, curr, dropPct }
      }
    }
  })

  if (!bestDrop) return null

  const voiceName = VOICE_NAMES[bestDrop.voice] || bestDrop.voice
  const voiceIcon = VOICE_ICONS[bestDrop.voice] || '🔍'

  return {
    id: `voice_freq_${bestDrop.voice}_${thisMonth}`,
    type: 'pattern',
    icon: voiceIcon,
    badge: BADGE_LABELS.pattern,
    title: `${voiceName} is quieting down`,
    body: `Your ${voiceName} barely showed up this month (${bestDrop.curr} time${bestDrop.curr === 1 ? '' : 's'}, down from ${bestDrop.prev}). Something you're doing is working.`,
    action: {
      label: 'Ask Zarlo about this',
      zarloContext: `The user's ${voiceName} voice dropped from ${bestDrop.prev} appearances last month to ${bestDrop.curr} this month. Help them reflect on what changed and what they're doing differently.`,
    },
    triggeredAt: Date.now(),
    resolutionKey: `voice_freq_${bestDrop.voice}`,
  }
}

// DETECTOR: Wahoo Shift (emotional classification changing on a quest)
export function detectWahooShift(completions, questNames) {
  // Group completions by quest_id
  const byQuest = {}
  ;(completions || []).forEach(c => {
    if (!c.quest_id) return
    const rt = parseReflection(c)
    if (!rt?.wahoo_classification) return
    if (!byQuest[c.quest_id]) byQuest[c.quest_id] = []
    byQuest[c.quest_id].push(rt.wahoo_classification)
  })

  const negativeCats = ['anxious', 'shutdown', 'stressful', 'bored', 'pressure', 'sympathetic', 'dorsal']
  const positiveCats = ['vibe', 'peace', 'fun', 'vibe_rise', 'ventral']

  let best = null
  let bestScore = 0

  for (const [questId, classifications] of Object.entries(byQuest)) {
    if (classifications.length < 10) continue

    const first5 = classifications.slice(0, 5)
    const last5 = classifications.slice(-5)

    const earlyNeg = first5.filter(c => negativeCats.includes(c)).length
    const recentPos = last5.filter(c => positiveCats.includes(c)).length

    if (earlyNeg >= 3 && recentPos >= 3) {
      const score = earlyNeg + recentPos
      if (score > bestScore) {
        bestScore = score
        best = { questId, earlyNeg, recentPos }
      }
    }
  }

  if (!best) return null

  const questName = questNames?.[best.questId] || 'this path'
  const oldState = best.earlyNeg >= 4 ? 'stressful' : 'mixed'
  const newState = best.recentPos >= 4 ? 'fun' : 'lighter'

  return {
    id: `wahoo_shift_${best.questId}`,
    type: 'pattern',
    icon: '🌅',
    badge: BADGE_LABELS.pattern,
    title: `${questName} feels different now`,
    body: `Your first challenges on ${questName} felt ${oldState}. Your recent ones feel ${newState}. The path is opening up.`,
    triggeredAt: Date.now(),
    resolutionKey: `wahoo_shift_${best.questId}`,
  }
}

// DETECTOR: Aftertaste Second Clock
export function detectAftertasteSecondClock(completions) {
  const withSecondClock = (completions || []).filter(c =>
    c.aftertaste === 'not_sure' && c.aftertaste_week_later
  )

  if (withSecondClock.length < 10) {
    if (withSecondClock.length >= 6) {
      const remaining = 10 - withSecondClock.length
      return {
        id: 'near_aftertaste_insight',
        type: 'prompt',
        icon: '⏰',
        badge: BADGE_LABELS.prompt,
        title: 'Aftertaste data building',
        body: `${remaining} more "not sure" follow-ups and we can show you your aftertaste accuracy.`,
        triggeredAt: Date.now(),
        resolutionKey: 'aftertaste_second_clock',
      }
    }
    return null
  }

  const yesCount = withSecondClock.filter(c => c.aftertaste_week_later === 'yes').length
  const pct = Math.round((yesCount / withSecondClock.length) * 100)

  if (pct < 50) return null

  return {
    id: `aftertaste_second_clock_${pct}`,
    type: 'pattern',
    icon: '⏰',
    badge: BADGE_LABELS.pattern,
    title: 'Trust the aftertaste',
    body: `Most of your "not sure" challenges became "yes" after a week (${pct}%). Your body knows before your mind does.`,
    triggeredAt: Date.now(),
    resolutionKey: 'aftertaste_second_clock',
  }
}

// ═══════════════════════════════════════════════════════════
// ENGINE: Run all detectors, filter dismissed, return queue
// ═══════════════════════════════════════════════════════════

/**
 * @param {Object} data - User data from ProgressTab queries
 * @param {Array} data.completions - quest_completions rows (with reflection_text, quest_id, aftertaste, aftertaste_week_later)
 * @param {Array} data.challenges - groan_challenges rows (with gap_voice, dimension_values, predicted/experienced_difficulty, quest_id)
 * @param {Array} data.nsCheckins - nervous_system_checkins rows (with before_state, after_state, created_at, source_challenge_id)
 * @param {Array} data.pathFuelReviews - path_fuel_reviews rows
 * @param {Array} data.crossPollination - quest_cross_pollination rows
 * @param {Object} data.questNames - { questId: label } lookup
 * @param {Array} dismissedIds - observation_ids the user has dismissed
 * @returns {Array} Sorted observation cards (full queue, caller shows top 3)
 */
export function runObservationEngine(data, dismissedIds = []) {
  const { completions, challenges, nsCheckins, pathFuelReviews, crossPollination, questNames } = data
  const dismissedSet = new Set(dismissedIds)

  // Run all detectors
  const results = [
    // Phase 1: Core patterns
    detectExpectationTrend(completions),
    detectVoiceDimensionCluster(challenges),
    detectNsBaselineShift(nsCheckins),
    // Phase 2: Milestones + prompts
    detectChallengeCount(challenges),
    detectQuestStreak(challenges, questNames),
    detectDimensionLevelUp(challenges, nsCheckins),
    detectPredictionMilestone(challenges),
    // Phase 3: Fuel + convergence + identity
    detectFuelDrought(pathFuelReviews, questNames),
    detectFuelPerChallenge(completions),
    detectCrossPollination(crossPollination, questNames),
    detectIdentityEvolution(completions),
    detectPredictionAccuracy(challenges),
    detectVoiceFrequencyShift(challenges),
    detectWahooShift(completions, questNames),
    detectAftertasteSecondClock(completions),
  ].filter(Boolean)

  // Filter dismissed: match by resolutionKey (stable), not dynamic id
  const filtered = results.filter(obs => !dismissedSet.has(obs.resolutionKey))

  // Sort: type priority first, then recency within tier
  filtered.sort((a, b) => {
    const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
    if (typeDiff !== 0) return typeDiff
    return (b.triggeredAt || 0) - (a.triggeredAt || 0)
  })

  return filtered
}

export { TYPE_PRIORITY, BADGE_LABELS, BORDER_COLORS }
