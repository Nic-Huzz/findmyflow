// _shared/taxonomy.ts
// Wheel taxonomy data for MCP server validation and display.
// Source of truth: src/lib/wheelTaxonomy.js + src/lib/skillProgress.js

export const VALID_SKILL_IDS = [
  'storytelling', 'teaching', 'coaching', 'performing', 'creating',
  'building', 'designing', 'leading', 'connecting', 'speaking_up',
] as const

export type SkillId = typeof VALID_SKILL_IDS[number]

export const SKILL_DISPLAY_NAMES: Record<string, string> = {
  storytelling: 'Storytelling',
  teaching: 'Teaching',
  coaching: 'Coaching',
  performing: 'Performing',
  creating: 'Creating',
  building: 'Building',
  designing: 'Designing',
  leading: 'Leading',
  connecting: 'Connecting',
  speaking_up: 'Speaking Up',
}

export const VALID_BRANCH_IDS = [
  'healing', 'movement', 'bonds', 'story', 'tools',
  'status', 'nourishment', 'shelter', 'fire', 'threat',
] as const

export const VALID_PROTECTIVE_VOICES = [
  'controller', 'ghost', 'perfectionist', 'auto_pilot', 'people_pleaser',
] as const

// Skill level thresholds (mirrors src/lib/skillProgress.js)
export const SKILL_XP_THRESHOLDS = { L1: 3, L2: 8, L3: 15, L4: 25 }

export function getSkillLevel(xp: number): { level: number; name: string } {
  if (xp >= 25) return { level: 4, name: 'teaching' }
  if (xp >= 15) return { level: 3, name: 'charging' }
  if (xp >= 8) return { level: 2, name: 'practising' }
  if (xp >= 3) return { level: 1, name: 'testing' }
  return { level: 0, name: 'education' }
}

// RP level thresholds (mirrors Challenge.jsx / CLAUDE.md)
const RP_LEVELS = [
  { threshold: 5750, name: 'Movement Maker' },
  { threshold: 2750, name: 'Flow Finder' },
  { threshold: 1250, name: 'Vibe Rise' },
  { threshold: 500, name: 'Strong Foundation' },
  { threshold: 100, name: 'Habit Builder' },
  { threshold: 0, name: 'Getting Started' },
]

export function getRPLevel(total: number): string {
  return RP_LEVELS.find(l => total >= l.threshold)?.name || 'Getting Started'
}

// User-facing state → internal DB names
export const STATE_TO_WAHOO: Record<string, string> = {
  vibe_rise: 'vibe',
  fun: 'peace',
  stress: 'anxious',
  boring: 'shutdown',
}

export const STATE_TO_TASK_SIGNAL: Record<string, string> = {
  vibe_rise: 'lit_me_up',
  fun: 'lit_me_up',
  stress: 'was_okay',
  boring: 'bored',
}

// States that earn skill XP + behavioral evidence (courage-level moments)
export const COURAGE_STATES = ['vibe_rise', 'stress'] as const

export const VALID_STATES = ['vibe_rise', 'fun', 'stress', 'boring'] as const
