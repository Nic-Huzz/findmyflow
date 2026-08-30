/**
 * Life Fuel — Four Channels of Aliveness
 *
 * Meta-tracker spanning the entire journey (Phase 1 + 2 + 3).
 * The channel isn't in the experience. It's in the context.
 *
 * Data collection: four checkboxes after every courage challenge.
 * Visualization: diamond radar chart, each axis = % of total experiences
 * where that channel was ticked.
 *
 * Lead magnet: /try/aliveness (quiz version for strangers)
 * In-app: checkboxes build the diamond over time from real data
 */

// ── The Four Channels ──
export const LIFE_FUEL_CHANNELS = {
  choice: {
    id: 'choice',
    name: 'Choice',
    emoji: '🔓',
    category: 'Survive',
    color: '#60a5fa',
    checkbox: 'I did this because I wanted to',
  },
  connection: {
    id: 'connection',
    name: 'Connection',
    emoji: '🤝',
    category: 'Survive',
    color: '#f472b6',
    checkbox: 'I connected with someone and it made the experience better',
  },
  mastery: {
    id: 'mastery',
    name: 'Mastery',
    emoji: '📈',
    category: 'Thrive',
    color: '#34d399',
    checkbox: 'I used or grew a skill I love',
  },
  meaning: {
    id: 'meaning',
    name: 'Meaning',
    emoji: '✨',
    category: 'Thrive',
    color: '#fbbf24',
    checkbox: 'This served something I care about',
  },
}

export const CHANNEL_IDS = ['choice', 'connection', 'mastery', 'meaning']

/**
 * Calculate Life Fuel percentages from courage challenge data.
 *
 * @param {Array<{choice: boolean, connection: boolean, mastery: boolean, meaning: boolean}>} entries
 *   Each entry represents one courage challenge's channel checkboxes.
 * @returns {{ choice: number, connection: number, mastery: number, meaning: number }}
 *   Percentages (0-100) for each channel.
 */
export function calculateLifeFuel(entries) {
  if (!entries.length) return { choice: 0, connection: 0, mastery: 0, meaning: 0 }

  const total = entries.length
  return {
    choice: Math.round((entries.filter(e => e.choice).length / total) * 100),
    connection: Math.round((entries.filter(e => e.connection).length / total) * 100),
    mastery: Math.round((entries.filter(e => e.mastery).length / total) * 100),
    meaning: Math.round((entries.filter(e => e.meaning).length / total) * 100),
  }
}
