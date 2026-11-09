/**
 * Aliveness Engine — pure functions for check-in due logic, deficiency detection,
 * and challenge suggestions.
 *
 * Zero React / Supabase dependencies. All functions take plain objects and return results.
 * Task 2 (AlivenessCheckin component) and Task 3 (ProgressTab wiring) import from here.
 */

import { VIBE_RISE_DIMENSIONS } from '../data/vibeRiseDimensions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHECKIN_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

// ---------------------------------------------------------------------------
// Check-in due logic
// ---------------------------------------------------------------------------

/**
 * Given all snapshots for one quest (sorted created_at desc),
 * return the aliveness state.
 *
 * @param {Array<{ snapshot_type: string, scores: Object, created_at: string }>} snapshots
 * @returns {{ due: boolean, baseline: Object|null, latest: Object|null, previous: Object|null, lastSnapshotAt: string|null, daysSinceLast: number|null }}
 */
export function getQuestAlivenessState(snapshots) {
  if (!snapshots?.length) {
    return {
      due: false,
      baseline: null,
      latest: null,
      previous: null,
      lastSnapshotAt: null,
      daysSinceLast: null,
    }
  }

  const baseline = snapshots.find(s => s.snapshot_type === 'baseline')
  const checkins = snapshots.filter(s => s.snapshot_type === 'checkin')
  const latest = checkins[0] || baseline
  const previous = checkins[1] || (checkins[0] ? baseline : null)

  if (!baseline) {
    return {
      due: false,
      baseline: null,
      latest: null,
      previous: null,
      lastSnapshotAt: null,
      daysSinceLast: null,
    }
  }

  const lastDate = new Date(latest.created_at)
  const now = new Date()
  const msElapsed = now - lastDate
  const daysSinceLast = Math.floor(msElapsed / (24 * 60 * 60 * 1000))
  const due = msElapsed >= CHECKIN_INTERVAL_MS

  return {
    due,
    baseline: baseline.scores,
    latest: checkins[0]?.scores || null,
    previous: previous?.scores || null,
    lastSnapshotAt: latest.created_at,
    daysSinceLast,
  }
}

/**
 * Given quests and all snapshots grouped by quest_id,
 * return quests that are due for a check-in, oldest-due first.
 *
 * @param {Array<{ id: string }>} quests
 * @param {Object.<string, Array>} snapshotsByQuest
 * @returns {Array<{ quest: Object, state: Object, lastSnapshotAt: string }>}
 */
export function getCheckinDueQuests(quests, snapshotsByQuest) {
  return quests
    .map(q => {
      const state = getQuestAlivenessState(snapshotsByQuest[q.id] || [])
      return state.due ? { quest: q, state, lastSnapshotAt: state.lastSnapshotAt } : null
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.lastSnapshotAt) - new Date(b.lastSnapshotAt))
}

// ---------------------------------------------------------------------------
// Deficiency detection
// ---------------------------------------------------------------------------

/**
 * Given all snapshots for one quest (sorted created_at desc),
 * return array of deficient dimensions.
 *
 * Deficient = dropped 2+ from baseline, OR stayed <= 2 for 2+ consecutive check-ins.
 *
 * @param {Array<{ snapshot_type: string, scores: Object, created_at: string }>} snapshots
 * @returns {Array<{ dimensionId: string, reason: 'dropped' | 'flat' }>}
 */
export function detectDeficiencies(snapshots) {
  const baseline = snapshots.find(s => s.snapshot_type === 'baseline')
  const checkins = snapshots.filter(s => s.snapshot_type === 'checkin')
  if (!baseline || checkins.length < 2) return []

  const deficiencies = []
  const latest = checkins[0].scores
  const previous = checkins[1].scores

  VIBE_RISE_DIMENSIONS.forEach(dim => {
    const baseVal = baseline.scores[dim.id] || 0
    const latestVal = latest[dim.id] || 0
    const prevVal = previous[dim.id] || 0

    // Dropped 2+ from baseline
    if (baseVal - latestVal >= 2) {
      deficiencies.push({ dimensionId: dim.id, reason: 'dropped' })
      return
    }

    // Stayed <= 2 for 2+ consecutive check-ins
    if (latestVal <= 2 && prevVal <= 2) {
      deficiencies.push({ dimensionId: dim.id, reason: 'flat' })
    }
  })

  return deficiencies
}

// ---------------------------------------------------------------------------
// Adaptive headline
// ---------------------------------------------------------------------------

/**
 * Given baseline, previous, and current scores, return a contextual headline string.
 * previous may be null (first check-in).
 *
 * @param {Object|null} baseline - dimension scores at baseline
 * @param {Object|null} previous - dimension scores at previous check-in
 * @param {Object|null} current  - dimension scores at current check-in
 * @returns {string}
 */
export function getAdaptiveHeadline(baseline, previous, current) {
  if (!baseline || !current) return ''

  const dims = VIBE_RISE_DIMENSIONS.map(d => d.id)
  const vsBase = dims.reduce((sum, id) => sum + ((current[id] || 0) - (baseline[id] || 0)), 0)

  if (!previous) {
    // First check-in, compare to baseline only
    if (vsBase > 2) return "You're more alive than when you started."
    if (vsBase < -2) return "Something shifted. Let's look at what."
    return 'Holding steady. Pick one dimension and push it.'
  }

  const vsPrev = dims.reduce((sum, id) => sum + ((current[id] || 0) - (previous[id] || 0)), 0)

  if (vsBase > 2 && vsPrev > 0) return "You're more alive than when you started, and still climbing."
  if (vsBase > 2 && vsPrev <= 0) return "You've come a long way. Time to push a new edge."
  if (vsPrev < -2) return "Something shifted recently. Let's look at what."
  return 'Holding steady. Pick one dimension and push it.'
}

// ---------------------------------------------------------------------------
// Challenge suggestions + dome dimension mapping
// ---------------------------------------------------------------------------

const CHALLENGE_SUGGESTIONS = {
  permission: {
    text: 'Tell someone new what you are working on',
    label: 'Do something where acceptance is the edge',
  },
  safety: {
    text: 'Share something you have made with someone whose opinion matters',
    label: 'Do something where being seen is the stretch',
  },
  connection: {
    text: 'Invite someone who does this to collaborate or just talk',
    label: 'Do something with another person in this domain',
  },
  engagement: {
    text: 'Spend 30 minutes on your path doing only the parts that light you up',
    label: 'Check: still energised by the process, or just grinding?',
  },
  alignment: {
    text: 'Describe your path to a stranger. Does the description excite you?',
    label: 'Check: does this still feel like you?',
  },
}

/** Maps Vibe Rise dimension IDs to the Dome of Safety dimension IDs they relate to. */
const VIBE_RISE_TO_DOME = {
  permission: ['stakes', 'context'],
  safety: ['vulnerability', 'identity'],
  connection: ['people'],
  engagement: ['rarity', 'business_commitment'],
  alignment: ['identity'],
}

/**
 * Get a courage challenge suggestion for a deficient Vibe Rise dimension.
 *
 * @param {string} dimensionId
 * @returns {{ text: string, label: string } | null}
 */
export function getSuggestion(dimensionId) {
  return CHALLENGE_SUGGESTIONS[dimensionId] || null
}

/**
 * Map a Vibe Rise dimension to the Dome of Safety dimension IDs it relates to.
 *
 * @param {string} dimensionId
 * @returns {string[]}
 */
export function vibeRiseToDomeDims(dimensionId) {
  return VIBE_RISE_TO_DOME[dimensionId] || []
}
