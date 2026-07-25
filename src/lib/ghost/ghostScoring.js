/**
 * ghostScoring.js — Pure scoring functions for Ghost Self League
 *
 * No side effects, no DB calls. Operates on completions arrays and score objects.
 */
import { FANTASY_CATEGORIES, GHOST_DECAY, GHOST_DECAY_RESET_THRESHOLD } from './ghostConfig'
import { getMondayDate, formatLocalDate } from '../dateUtils'

/**
 * Build day-by-day cumulative scores from quest completions for a given week.
 * Returns an object keyed by ISO date with cumulative {tune, courage, community} values.
 *
 * @param {Array} completions - All quest_completions (hook must pass full array)
 * @param {string} weekStart - YYYY-MM-DD Monday of the target week
 * @param {Array} [contentSubmissions=[]] - ghost_content_submissions for community scoring
 * @returns {Object} e.g. { "2026-07-21": {tune: 12, courage: 0, community: 2}, ... }
 */
export function buildDailyScores(completions, weekStart, contentSubmissions = []) {
  const monday = new Date(weekStart + 'T00:00:00')
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 7)

  // Filter completions to this week
  const weekCompletions = completions.filter(c => {
    const d = new Date(c.completed_at)
    return d >= monday && d < sunday
  })

  // Build per-day raw scores
  const dailyRaw = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    dailyRaw[formatLocalDate(d)] = { tune: 0, courage: 0, community: 0 }
  }

  // Score Tune + Courage from quest completions
  weekCompletions.forEach(c => {
    const day = formatLocalDate(new Date(c.completed_at))
    if (!dailyRaw[day]) return

    if (FANTASY_CATEGORIES.tune.dbFilter.includes(c.quest_category)) {
      dailyRaw[day].tune += (c.points_earned || 0)
    } else if (FANTASY_CATEGORIES.courage.dbFilter.includes(c.quest_category)) {
      dailyRaw[day].courage += (c.points_earned || 0)
    }
  })

  // Score Community from content submissions
  contentSubmissions.forEach(s => {
    const day = formatLocalDate(new Date(s.created_at))
    if (dailyRaw[day]) {
      dailyRaw[day].community += (s.points_value || 0)
    }
  })

  // Convert to cumulative
  const dates = Object.keys(dailyRaw).sort()
  const cumulative = {}
  let runTune = 0, runCourage = 0, runCommunity = 0

  dates.forEach(date => {
    runTune += dailyRaw[date].tune
    runCourage += dailyRaw[date].courage
    runCommunity += dailyRaw[date].community
    cumulative[date] = { tune: runTune, courage: runCourage, community: runCommunity }
  })

  return cumulative
}

/**
 * Get the final totals from a daily scores object (Sunday's cumulative values).
 * @param {Object} dailyScores - Output of buildDailyScores
 * @returns {{ tune: number, courage: number, community: number }}
 */
export function getFinalTotals(dailyScores) {
  const dates = Object.keys(dailyScores).sort()
  if (dates.length === 0) return { tune: 0, courage: 0, community: 0 }
  return dailyScores[dates[dates.length - 1]]
}

/**
 * Get the cumulative scores through a specific date.
 * @param {Object} dailyScores - Output of buildDailyScores
 * @param {string} throughDate - ISO date (YYYY-MM-DD)
 * @returns {{ tune: number, courage: number, community: number }}
 */
export function getScoresThrough(dailyScores, throughDate) {
  const dates = Object.keys(dailyScores).sort().filter(d => d <= throughDate)
  if (dates.length === 0) return { tune: 0, courage: 0, community: 0 }
  return dailyScores[dates[dates.length - 1]]
}

/**
 * Compare two score objects across 3 categories. Returns per-category results and match result.
 * @param {{ tune: number, courage: number, community: number }} current
 * @param {{ tune: number, courage: number, community: number }} ghost
 * @returns {{ categories: Array<{key, current, ghost, winner}>, userWins, ghostWins, ties, result }}
 */
export function compareCategories(current, ghost) {
  const keys = ['tune', 'courage', 'community']
  let userWins = 0, ghostWins = 0, ties = 0

  const categories = keys.map(key => {
    const c = current[key] || 0
    const g = ghost[key] || 0
    let winner = 'tie'
    if (c > g) { winner = 'user'; userWins++ }
    else if (g > c) { winner = 'ghost'; ghostWins++ }
    else { ties++ }
    return { key, current: c, ghost: g, winner }
  })

  let result = 'draw'
  if (userWins >= 2) result = 'win'
  else if (ghostWins >= 2) result = 'loss'

  return { categories, userWins, ghostWins, ties, result }
}

/**
 * Apply decay to ghost daily scores based on consecutive losses.
 * @param {Object} ghostDailyScores - The raw daily scores from last week
 * @param {number} consecutiveLosses - From ghost_streaks.consecutive_losses
 * @returns {Object} Decayed daily scores (or empty object for full reset)
 */
export function applyDecay(ghostDailyScores, consecutiveLosses) {
  if (!consecutiveLosses || consecutiveLosses <= 0) return ghostDailyScores
  if (consecutiveLosses >= GHOST_DECAY_RESET_THRESHOLD) return {}

  const multiplier = GHOST_DECAY[consecutiveLosses] || 1
  const decayed = {}

  for (const [date, scores] of Object.entries(ghostDailyScores)) {
    decayed[date] = {
      tune: Math.round(scores.tune * multiplier),
      courage: Math.round(scores.courage * multiplier),
      community: Math.round(scores.community * multiplier),
    }
  }

  return decayed
}

/**
 * Get the dates array for a week starting from weekStart.
 * @param {string} weekStart - YYYY-MM-DD Monday
 * @returns {string[]} Array of 7 ISO date strings
 */
export function getWeekDates(weekStart) {
  const monday = new Date(weekStart + 'T00:00:00')
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    dates.push(formatLocalDate(d))
  }
  return dates
}
