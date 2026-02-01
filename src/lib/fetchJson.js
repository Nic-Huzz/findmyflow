/**
 * Fetch JSON with automatic cache-busting
 *
 * Adds a timestamp parameter to prevent browser caching.
 * Use this for all static JSON files that may be updated.
 */

export async function fetchJson(path) {
  const cacheBuster = `?v=${Date.now()}`
  const response = await fetch(`${path}${cacheBuster}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`)
  }
  return response.json()
}

/**
 * Get cache-busted URL for use with fetch()
 * Use when you need the Response object, not just JSON
 */
export function cacheBustUrl(path) {
  return `${path}?v=${Date.now()}`
}

export default fetchJson
