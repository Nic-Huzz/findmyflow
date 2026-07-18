/**
 * useCreatorInsightDrops — Template-based insight drops for the creator portal.
 *
 * 5 insight types, waterfall priority, 1 per session. All client-side.
 * No edge function needed. Uses data already loaded in CreatorHomeV2.
 *
 * Types (priority order):
 * 1. Monopoly update (branch shift)
 * 2. Playbook milestone (stage completion)
 * 3. Pattern recognition (3% themes)
 * 4. DNA comparison (branch match to known creator)
 * 5. Percentile (Scale Score quartile)
 */
import { useState, useEffect } from 'react'

const SEEN_PREFIX = 'insight_creator_seen_'

function hasSeen(key) {
  return localStorage.getItem(`${SEEN_PREFIX}${key}`) === 'true'
}

function markSeen(key) {
  localStorage.setItem(`${SEEN_PREFIX}${key}`, 'true')
}

/**
 * @param {object} creatorData - Data from CreatorHomeV2 state
 * @param {object} creatorData.branchScoring - Output from useBranchScoring ({ primary, secondary, confidence })
 * @param {object} creatorData.remarkableAngle - From remarkable_angles query
 * @param {boolean} creatorData.hasReach
 * @param {boolean} creatorData.hasGrowth
 * @param {boolean} creatorData.hasScaleScore
 * @param {number} creatorData.scaleScoreValue
 * @param {Array} creatorData.threePercentNotes - Array of { note } objects
 * @param {Array} creatorData.dnaProfiles - From experienceCreatorDNA.json
 */
export function useCreatorInsightDrops(creatorData) {
  const [insight, setInsight] = useState(null)

  useEffect(() => {
    if (!creatorData) return
    const result = checkCreatorInsights(creatorData)
    if (result) setInsight(result)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissInsight = () => {
    if (insight?.key) markSeen(insight.key)
    setInsight(null)
  }

  return { insight, dismissInsight }
}

function checkCreatorInsights(data) {
  // 1. Monopoly update — branch confidence changed
  if (data.branchScoring?.primary && data.branchScoring.confidence > 0) {
    const key = `monopoly_${data.branchScoring.primary.branch}_${Math.floor(data.branchScoring.confidence / 10) * 10}`
    if (!hasSeen(key)) {
      return {
        key,
        rarity: 'uncommon',
        icon: '🗺️',
        title: `${cap(data.branchScoring.primary.branch)} confirmed`,
        body: `Your primary branch is ${cap(data.branchScoring.primary.branch)} at ${data.branchScoring.confidence}% confidence. ${data.branchScoring.secondary ? `Secondary: ${cap(data.branchScoring.secondary.branch)}.` : ''}`,
      }
    }
  }

  // 2. Playbook milestone — stage completion benchmarks
  const stages = [
    { flag: 'hasRemarkableResults', key: 'playbook_results', pct: '40%', label: 'Remarkable Results' },
    { flag: 'hasReach', key: 'playbook_reach', pct: '25%', label: 'Remarkable Reach' },
    { flag: 'hasGrowth', key: 'playbook_growth', pct: '18%', label: 'Remarkable Growth' },
    { flag: 'hasScaleScore', key: 'playbook_score', pct: '15%', label: 'Scale Score' },
  ]
  for (const stage of stages) {
    if (data[stage.flag] && !hasSeen(stage.key)) {
      return {
        key: stage.key,
        rarity: 'common',
        icon: '📊',
        title: `${stage.label} complete`,
        body: `Only about ${stage.pct} of experience creators get this far. You're ahead of most.`,
      }
    }
  }

  // 3. Pattern recognition — 3% improvement theme clustering
  if (data.threePercentNotes?.length >= 3) {
    const themes = detectTheme(data.threePercentNotes)
    if (themes) {
      const key = `pattern_${themes.theme}_${themes.count}`
      if (!hasSeen(key)) {
        return {
          key,
          rarity: 'uncommon',
          icon: '🔍',
          title: `Pattern: ${cap(themes.theme)}`,
          body: `Your last ${themes.count} improvements all touched ${themes.theme}. That's your growth edge right now.`,
        }
      }
    }
  }

  // 4. DNA comparison — rule break branch matches a known creator
  if (data.remarkableAngle?.branch && data.dnaProfiles?.length > 0) {
    const branch = data.remarkableAngle.branch
    const match = data.dnaProfiles.find(p => p.primaryBranch === branch && p.blowUpMoment)
    if (match) {
      const key = `dna_match_${match.name.replace(/\s/g, '_').toLowerCase()}`
      if (!hasSeen(key)) {
        return {
          key,
          rarity: 'uncommon',
          icon: '🧬',
          title: `Same branch as ${match.name}`,
          body: `Your rule break sits in ${cap(branch)}, same as ${match.name}. They went from unknown to "${match.blowUpMoment?.slice(0, 60)}..."`,
        }
      }
    }
  }

  // 5. Percentile — Scale Score quartile
  if (data.scaleScoreValue != null && data.scaleScoreValue > 0) {
    // Hardcoded quartiles based on distribution: 0-4 bottom, 5-8 mid, 9+ top
    let quartileKey = null
    let body = null
    if (data.scaleScoreValue >= 9) {
      quartileKey = 'score_top'
      body = `Your Scale Score (${data.scaleScoreValue}/15) puts you in the top quartile. You're closer to ready than you think.`
    } else if (data.scaleScoreValue >= 5) {
      quartileKey = 'score_mid'
      body = `Your Scale Score (${data.scaleScoreValue}/15) is right in the middle. Most creators score 5-8. The gap is usually one specific thing.`
    }
    if (quartileKey && !hasSeen(quartileKey)) {
      return {
        key: quartileKey,
        rarity: 'common',
        icon: '📈',
        title: 'Scale Score insight',
        body,
      }
    }
  }

  return null
}

/**
 * Simple keyword theme detection in 3% notes.
 * Returns { theme, count } if 3+ notes share a keyword cluster.
 */
function detectTheme(notes) {
  const themes = {
    marketing: ['marketing', 'content', 'post', 'instagram', 'social', 'attract', 'audience', 'reach'],
    pricing: ['price', 'pricing', 'charge', 'ticket', 'revenue', 'money', 'value'],
    delivery: ['delivery', 'flow', 'structure', 'format', 'experience', 'energy', 'music', 'facilitation'],
    community: ['community', 'connection', 'repeat', 'follow-up', 'retention', 'relationship'],
  }

  const themeCounts = {}
  for (const note of notes) {
    const text = (note.note || note.three_percent_note || note || '').toLowerCase()
    for (const [theme, keywords] of Object.entries(themes)) {
      if (keywords.some(k => text.includes(k))) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1
      }
    }
  }

  const top = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]
  if (top && top[1] >= 3) return { theme: top[0], count: top[1] }
  return null
}

function cap(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}
