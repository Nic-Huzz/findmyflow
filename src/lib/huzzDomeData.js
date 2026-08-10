// Huzz's personal dome state ratings for experience nodes.
// Empty by default — populated from Supabase in production.
// HUZZ_DOME_STATES seeds the local state in RuleBreakTree until
// the Supabase hook replaces it (see comment in RuleBreakTree.jsx line 79).
export const HUZZ_DOME_STATES = {}

// Returns a summary count of rated nodes by category.
export function getHuzzDomeStats(states) {
  const ids = Object.keys(states)
  return {
    safe: ids.filter(id => states[id] === 'vibe_rise' || states[id] === 'fun').length,
    growing: ids.filter(id => states[id] === 'pressure' || states[id] === 'growth_edge').length,
    unexplored: ids.filter(id => !states[id] || states[id] === 'bored').length,
  }
}
