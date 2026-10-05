/**
 * Vibe Rise Aliveness Compass — 5 per-path dimensions
 *
 * Used in: Path Definition baseline (Screen 0), bi-weekly check-ins, ProgressTab radar.
 * The lead magnet (VibeRiseRadar.jsx) uses the same 5 dims with different question wording.
 */

export const VIBE_RISE_DIMENSIONS = [
  {
    id: 'permission',
    name: 'Permission',
    emoji: '🚪',
    question: 'How accepted do you feel doing this?',
    low: 'People around you question this path. You feel like you need to justify it.',
    high: 'Your world supports this. Nobody questions why you do it.',
    anchors: [
      'Not accepted at all',
      'Mostly questioned',
      'Mixed reactions',
      'Mostly accepted',
      'Fully accepted',
    ],
  },
  {
    id: 'safety',
    name: 'Safety',
    emoji: '🛡️',
    question: 'How comfortable do you feel being seen doing this?',
    low: 'You hide this part of yourself. Being watched doing it feels exposing.',
    high: 'You could do this in front of anyone. Being seen feels natural.',
    anchors: [
      'Very uncomfortable being seen',
      'Mostly uncomfortable',
      'Depends on who is watching',
      'Mostly comfortable',
      'Fully comfortable being seen',
    ],
  },
  {
    id: 'connection',
    name: 'Connection',
    emoji: '🤝',
    question: 'How connected do you feel to people who do this?',
    low: 'You do not know anyone in this world. No community, no peers, no mentors.',
    high: 'You have your people. Peers, mentors, a community that gets it.',
    anchors: [
      'No one in this world',
      'A few loose contacts',
      'Some connections',
      'A solid network',
      'Deep community',
    ],
  },
  {
    id: 'engagement',
    name: 'Engagement',
    emoji: '🔥',
    question: 'How energised are you by the activities of this path, not just the outcome?',
    low: 'The process drains you. You tolerate it for the result.',
    high: 'The process itself fuels you. You would do it even if nobody paid you.',
    anchors: [
      'Completely drained by it',
      'Mostly grinding',
      'Some parts energise me',
      'Mostly energised',
      'The process itself fuels me',
    ],
  },
  {
    id: 'alignment',
    name: 'Alignment',
    emoji: '✨',
    question: 'How much does this path feel like the real you?',
    low: 'This feels like someone else\'s life. You are performing, not living.',
    high: 'This is you. When you describe this path, you light up.',
    anchors: [
      'Not me at all',
      'Mostly not me',
      'Parts of it feel like me',
      'Mostly me',
      'This is completely me',
    ],
  },
]

/** Dimension IDs in order */
export const VIBE_RISE_DIM_IDS = VIBE_RISE_DIMENSIONS.map(d => d.id)

/** Lookup by ID */
export function getVibeRiseDimension(id) {
  return VIBE_RISE_DIMENSIONS.find(d => d.id === id)
}
