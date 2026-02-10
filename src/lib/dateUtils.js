/**
 * Shared date utilities — single source of truth for week boundaries and date formatting.
 *
 * All functions use LOCAL timezone (not UTC) to match the user's perception of "today".
 * This prevents bugs where UTC midnight differs from local midnight (e.g., UTC-8 users
 * at 5pm local time would get "tomorrow" in UTC).
 */

/**
 * Format a Date as YYYY-MM-DD in local timezone (zero-padded).
 * @param {Date} date
 * @returns {string} e.g. "2026-02-10"
 */
export function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 * @returns {string}
 */
export function getTodayLocal() {
  return formatLocalDate(new Date())
}

/**
 * Get yesterday's date as YYYY-MM-DD in local timezone.
 * @returns {string}
 */
export function getYesterdayLocal() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatLocalDate(d)
}

/**
 * Get the Monday of a given week as a Date object (midnight local time).
 * @param {Date} [date=new Date()] - Any date in the target week
 * @param {number} [weekOffset=0] - Shift by N weeks (-1 = last week, 1 = next week)
 * @returns {Date} Monday at 00:00:00.000 local time
 */
export function getMondayDate(date = new Date(), weekOffset = 0) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get the Monday of a given week as a YYYY-MM-DD string (local timezone).
 * @param {Date} [date=new Date()] - Any date in the target week
 * @param {number} [weekOffset=0] - Shift by N weeks
 * @returns {string} e.g. "2026-02-10"
 */
export function getWeekStartLocal(date = new Date(), weekOffset = 0) {
  return formatLocalDate(getMondayDate(date, weekOffset))
}
