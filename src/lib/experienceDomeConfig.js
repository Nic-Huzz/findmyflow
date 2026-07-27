import { industryNodes, INDUSTRIES } from './ruleBreakTreeData'

// Branches that represent lived human experience (shown in Experience Dome mode)
// Excludes industrial/infrastructure branches (cars, tech, AI, energy grid, defense, property)
const EXPERIENTIAL_BRANCHES = new Set([
  'healing', 'med-traditional', 'med-psychedelic', 'med-somatic', 'med-mindbody', 'med-mental', 'med-energy',
  'medicine',
  'play', 'play-board', 'play-sport', 'play-digital', 'play-chance', 'play-toy', 'play-free',
  'bonds', 'bonds-ritual', 'bonds-communal', 'bonds-ordeal', 'bonds-coaching', 'bonds-couples',
  'intimacy',
  'story', 'story-oral', 'story-written', 'story-audio', 'story-video', 'story-immersive', 'story-creator',
  'media',
  'food', 'food-ancestral', 'food-ferment', 'food-fasting', 'food-personal', 'food-industrial', 'food-regen',
  'sleep', 'sleep-dream', 'sleep-medicine', 'sleep-circadian', 'sleep-tech', 'sleep-rest', 'sleep-states',
  'shelter-sacred',
  'status-fashion', 'status-beauty', 'status-digital', 'status-counter', 'status-craft',
  'fire-ritual', 'fire-personal', 'fire-light',
])

const nodeIndex = {}
industryNodes.forEach(n => { nodeIndex[n.id] = n })

export function isExperiential(nodeId) {
  const node = nodeIndex[nodeId]
  if (!node) return false
  return EXPERIENTIAL_BRANCHES.has(node.branch)
}

// Core nodes = branches that are not sub-branches (shown in condensed dome view)
export function isCoreNode(nodeId) {
  const node = nodeIndex[nodeId]
  if (!node) return false
  const ind = INDUSTRIES[node.branch]
  return ind != null && !ind.subBranch
}

export function getExperienceLabel(nodeId, defaultLabel) {
  return (defaultLabel || '').replace(/\n/g, ' ')
}

// Deterministic pseudo-random NS state assignment based on node ID
const NS_STATE_OPTIONS = ['vibe_rise', 'fun', 'pressure', null, null]

export function generateDemoStates(expIds) {
  const result = {}
  expIds.forEach(id => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) & 0xfffffff
    }
    const state = NS_STATE_OPTIONS[hash % NS_STATE_OPTIONS.length]
    if (state) result[id] = state
  })
  return result
}

// Color config for each NS state — matches dome legend CSS in RuleBreakTree.css
export const NS_COLORS = {
  vibe_rise: { color: '#7c3aed', glow: 0.8, pulse: true },
  fun:       { color: 'rgba(124,58,237,0.5)', glow: 0.5, pulse: false },
  pressure:  { color: '#E9A23B', glow: 0.4, pulse: false },
}
