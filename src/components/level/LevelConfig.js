/**
 * LevelConfig.js
 *
 * Config data for the 8-level Journey Progression System.
 * Each level defines a sweet-spot graph, zone diagnosis,
 * deep-dive healing flow, boss fight, and milestone.
 *
 * Created: 2026-03-27
 */

export const LEVEL_CONFIG = {
  0: {
    name: 'Getting Set Up',
    question: 'What does your aliveness look like?',
    graph: null,
    yAxis: null,
    xAxis: null,
    visibilityLayer: null,
    deepDive: {
      id: 'life_paths',
      name: 'Map Your Life Paths',
      route: '/life-paths',
      narrative: 'See which life paths are open to you right now.',
      icon: '🗺️',
    },
    extraQuests: [
      {
        id: 'hero_avatar',
        name: 'Create Your Hero Avatar',
        route: '/essence-mirror',
        narrative: 'Define who you are.',
        icon: '🦸',
      },
      {
        id: 'find_wahoos',
        name: 'Unlock Your Wahoos',
        route: null,
        narrative: 'Open your Wahoo space and name what would light you up.',
        icon: '🔥',
        navigateTo: 'Wahoo',
        lockedUntil: 'life_paths',
      },
      {
        id: 'healing_task',
        name: 'Healing Task',
        route: null,
        narrative: 'Complete your first healing quest.',
        icon: '💚',
        navigateTo: 'Healing',
        lockedUntil: 'life_paths',
      },
      {
        id: 'wound_map',
        name: 'Map Your Origin Story',
        route: '/wound-map?returnTo=/7-day-challenge',
        narrative: 'What happened before you arrived here?',
        icon: '🗺️',
      },
    ],
    milestone: null,
    zones: null,
    essenceQuestion: null,
    courageCount: 0,
    tuneDaysRequired: 1,
  },
  1: {
    name: 'Identity',
    question: 'Who am I really?',
    graph: 'Identity Sweet Spot',
    yAxis: 'Authenticity',
    xAxis: 'Belonging',
    visibilityLayer: 'screen',
    deepDive: {
      id: 'life_map',
      name: 'Life Map',
      route: '/life-map',
      narrative: 'Your life story holds the answers.',
    },
    extraQuests: [],
    milestone: {
      text: 'Express who you are where someone can see it',
      type: 'identity',
    },
    zones: {
      topLeft: {
        name: 'Outcast Zone',
        description: 'Fully authentic but excluded',
        boss: 'Fear of losing belonging',
        image: '/images/levels/identity1.png',
      },
      diagonal: {
        name: 'Identity Sweet Spot',
        description: 'Authentic and accepted as yourself',
        image: '/images/levels/identity2.png',
      },
      bottomRight: {
        name: 'Chameleon Zone',
        description: 'Belonging but self-erased',
        boss: 'Controller / People Pleaser',
        image: '/images/levels/identity3.png',
      },
    },
    essenceQuestion: 'Who were you before the world told you who to be?',
    courageCount: 1,
    tuneDaysRequired: 2,
  },
  2: {
    name: 'Vulnerability',
    question: 'Can I be honest about what I need?',
    graph: 'Vulnerability Sweet Spot',
    yAxis: 'Shared',
    xAxis: 'Readiness',
    visibilityLayer: 'live',
    deepDive: {
      id: 'healing_compass',
      name: 'Healing Compass',
      route: '/healing-compass',
      narrative: 'What does safety look like for you?',
    },
    extraQuests: [],
    milestone: {
      text: 'Share with 2 vibe tribe support pillars',
      type: 'vulnerability',
    },
    zones: {
      topLeft: { name: 'Burden Zone', description: 'Oversharing without calibration', boss: 'Controller / Ghost (oversharing)' },
      diagonal: { name: 'Vulnerability Sweet Spot', description: 'What you share matches how ready the relationship is' },
      bottomRight: { name: 'Shallow Zone', description: 'Walls up even when it is safe', boss: 'Perfectionist / Auto-Pilot' },
    },
    essenceQuestion: 'What does your essence actually need?',
    courageCount: 1,
    tuneDaysRequired: 3,
  },
  3: {
    name: 'Direction',
    question: 'What do I build and who do I build it for?',
    graph: 'Direction Sweet Spot',
    yAxis: 'Essence Expressed',
    xAxis: 'Service of Others',
    visibilityLayer: 'live',
    deepDive: {
      id: 'career_clarity',
      name: 'Career Clarity Quiz',
      route: '/career-clarity',
      narrative: 'Should you stay, pivot, or build?',
      icon: '🧭',
    },
    extraQuests: [
      {
        id: 'people_matching',
        name: 'People Who Built This',
        route: '/people',
        narrative: 'See who already built what you\'re dreaming of.',
        icon: '🌍',
      },
    ],
    milestone: {
      text: 'Help one person with your essence this week',
      type: 'direction',
    },
    zones: {
      topLeft: { name: 'Martyr Zone', description: 'Essence absent from service', boss: 'Controller (serving without self)' },
      diagonal: { name: 'Direction Sweet Spot (Nikigai)', description: 'Essence expressed in service' },
      bottomRight: { name: 'Navel-Gazer Zone', description: 'Self-focused, no service', boss: 'Perfectionist / Auto-Pilot (self-absorbed)' },
    },
    essenceQuestion: 'What code is blocking your essence from moving?',
    courageCount: 2,
    tuneDaysRequired: 4,
  },
  4: {
    name: 'Enough',
    question: 'Do I have permission to move?',
    graph: 'Enough Sweet Spot',
    yAxis: 'Effort',
    xAxis: 'Quality',
    visibilityLayer: 'money',
    deepDive: {
      id: 'matrix_codes',
      name: 'Matrix Codes',
      route: '/matrix-code-deep-dive',
      narrative: 'What permission are you missing?',
    },
    milestone: {
      text: 'Ask for what you\'re worth without apologising',
      type: 'enough',
    },
    zones: {
      topLeft: { name: 'Over-Efforting Zone', description: 'High effort, never finish', boss: 'Controller / Ghost (never finish)' },
      diagonal: { name: 'Good Enough Sweet Spot', description: 'Ship, learn, iterate' },
      bottomRight: { name: 'Procrastinator Zone', description: 'Quality bar too high to start', boss: 'Perfectionist / Auto-Pilot (never start)' },
    },
    essenceQuestion: 'What code is blocking your essence from moving?',
    courageCount: 2,
    tuneDaysRequired: 5,
  },
  5: {
    name: 'Growth',
    question: 'What is my real edge?',
    graph: 'Growth Sweet Spot',
    yAxis: 'Challenge',
    xAxis: 'Ability',
    visibilityLayer: 'vulnerable',
    deepDive: {
      id: 'nervous_system',
      name: 'Map Nervous System Boundaries',
      route: '/nervous-system',
      narrative: 'Where does your nervous system say stop?',
    },
    milestone: {
      text: 'How can you make it 3% better?',
      type: 'growth',
    },
    zones: {
      topLeft: { name: 'Failure Zone', description: 'Challenge exceeds ability', boss: 'Controller / Ghost (overshoot)' },
      diagonal: { name: 'Groan Zone', description: 'Challenge matches ability. Growth happens here.' },
      bottomRight: { name: 'Safe Zone', description: 'Ability exceeds challenge. Growth stagnates.', boss: 'Perfectionist / Auto-Pilot (comfort zone)' },
    },
    essenceQuestion: 'Where does your nervous system stop your essence from expanding?',
    courageCount: 3,
    tuneDaysRequired: 6,
  },
  6: {
    name: 'Execution',
    question: 'Can I sustain movement?',
    graph: 'Execution Sweet Spot',
    yAxis: 'Output',
    xAxis: 'Emotional Wellbeing',
    visibilityLayer: 'authority',
    deepDive: {
      id: 'limiting_belief_rewire',
      name: 'Limiting Belief Rewire',
      route: '/limiting-belief-rewire',
      narrative: 'What belief makes you burn out or stall?',
    },
    milestone: {
      text: 'Sustain your output for 2 weeks without burning out',
      type: 'execution',
    },
    zones: {
      topLeft: { name: 'Ruthless Discipline', description: 'High output, low wellbeing. Burnout.', boss: 'Controller / Ghost (burnout)' },
      diagonal: { name: 'Living Zone', description: 'Output matches emotional resource. Sustainable.' },
      bottomRight: { name: 'Rely on Motivation', description: 'Wellbeing present but output low. Waiting.', boss: 'Perfectionist / Auto-Pilot (stall)' },
    },
    essenceQuestion: 'What belief makes your essence burn out or stall?',
    courageCount: 3,
    tuneDaysRequired: 7,
  },
  7: {
    name: 'Passion-Risk',
    question: 'What do I actually care about enough to risk?',
    graph: 'Passion-Risk Matrix',
    yAxis: 'Risk',
    xAxis: 'Passion',
    visibilityLayer: null, // all layers
    deepDive: {
      id: 'passion_excavation',
      name: 'Passion Excavation',
      route: null, // NEW, not built yet
      narrative: 'What would you risk everything for?',
    },
    milestone: {
      text: 'Turn down something safe because it doesn\'t light you up',
      type: 'passion',
    },
    zones: {
      topLeft: { name: 'Reckless Zone', description: 'High risk, low passion. Ego-driven.', boss: 'Controller / Ghost (ego risk)' },
      diagonal: { name: 'Project Sweet Spot', description: 'Risk scales with passion. Courageous not reckless.' },
      bottomRight: { name: 'Secure Zone', description: 'High passion potential, insufficient inspiration', boss: 'Perfectionist / Auto-Pilot (uninspired)' },
    },
    essenceQuestion: 'What does your essence actually care about enough to risk it?',
    courageCount: 3,
    tuneDaysRequired: 8,
  },
  8: {
    name: 'Play',
    question: 'Can I experience genuine play?',
    graph: 'Play Sweet Spot',
    yAxis: 'Freedom',
    xAxis: 'Safety',
    visibilityLayer: null,
    deepDive: null, // endgame, no deep dive
    milestone: {
      text: 'Experience genuine play without performing it',
      type: 'play',
    },
    zones: {
      topLeft: { name: 'Reckless Zone', description: 'Performing liberation', boss: null },
      diagonal: { name: 'Play Sweet Spot', description: 'Safety and freedom simultaneously' },
      bottomRight: { name: 'Caged Zone', description: 'Comfortable captivity', boss: null },
    },
    essenceQuestion: 'Are you free?',
    courageCount: null, // ongoing
    tuneDaysRequired: 9,
  },
}

export const TUNE_DAYS_REQUIRED = 7

export function getLevelConfig(level) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1]
  let extraQuests = [...(config.extraQuests || [])]

  // Auto-add playlist challenge quest for levels 1+ that have courageCount
  if (level > 0 && config.courageCount > 0 && !extraQuests.find(q => q.id === 'playlist_challenge')) {
    extraQuests.push({
      id: 'playlist_challenge',
      name: config.courageCount === 1 && level === 1 ? 'Your First Wahoo' : 'Wahoo Challenges',
      route: null,
      narrative: config.courageCount === 1 && level === 1
        ? 'Complete your first Wahoo.'
        : `Complete ${config.courageCount} Wahoo${config.courageCount > 1 ? 's' : ''}.`,
      icon: '🔥',
      navigateTo: 'Wahoo',
    })
  }

  // Auto-add weekly healing quest requirement for levels 1+ that have courageCount
  if (level > 0 && config.courageCount > 0 && !extraQuests.find(q => q.id === 'healing_challenge')) {
    extraQuests.push({
      id: 'healing_challenge',
      name: 'Weekly Healing Task',
      route: null,
      narrative: config.courageCount === 1
        ? 'Complete 1 weekly healing quest.'
        : `Complete ${config.courageCount} weekly healing quests.`,
      icon: '💜',
      navigateTo: 'Healing',
    })
  }

  if (level > 0 && config.courageCount > 0) {
    return { ...config, extraQuests }
  }
  return config
}
