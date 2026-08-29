/**
 * domeSummary.js — Dome data utilities for the /choose-quests bridge flow.
 *
 * Maps dome ratings to human-readable labels + primals for UI display
 * and formats them for the suggest-life-paths edge function prompt.
 */
import { VIRTUAL_EXPERIENCE_NODES, getExperienceLabel, isCoreNode } from './experienceDomeConfig'
import { INDUSTRIES, industryNodes } from './ruleBreakTreeData'

// Same overrides as DomeRadar + ExperienceGameFlow
const PRIMAL_OVERRIDES = {
  'sub-safety-1400b': 'movement',
  'sub-safety-1993': 'movement',
  'sub-craft-1880': 'story',
  'sub-temperature-2019': 'healing',
  'sub-communal-2017': 'shelter',
}

// Lazy singleton: nodeId → { primal, label }
let _lookup = null
function getNodeLookup() {
  if (_lookup) return _lookup
  _lookup = new Map()
  industryNodes.forEach(n => {
    const ind = INDUSTRIES[n.branch]
    if (!ind) return
    const primal = PRIMAL_OVERRIDES[n.id] || ind.primal
    _lookup.set(n.id, { primal, label: getExperienceLabel(n.id, n.label) })
  })
  VIRTUAL_EXPERIENCE_NODES.forEach(v => {
    const primal = PRIMAL_OVERRIDES[v.id] || v.primal
    _lookup.set(v.id, { primal, label: v.label })
  })
  return _lookup
}

/**
 * Returns core dome experiences grouped by primal for the bridge UI.
 * @param {Object} domeStates - { [nodeId]: nsState }
 * @returns {{ vibeRise: Array, fun: Array }} each item: { id, label, primal }
 */
export function getDomeExperiencesForBridge(domeStates) {
  const lookup = getNodeLookup()
  const vibeRise = []
  const fun = []

  Object.entries(domeStates).forEach(([nodeId, nsState]) => {
    if (!isCoreNode(nodeId)) return
    const info = lookup.get(nodeId)
    if (!info) return
    const item = { id: nodeId, label: info.label, primal: info.primal }
    if (nsState === 'vibe_rise') vibeRise.push(item)
    else if (nsState === 'fun') fun.push(item)
  })

  // Sort by primal then label within each group
  const sort = (a, b) => a.primal.localeCompare(b.primal) || a.label.localeCompare(b.label)
  vibeRise.sort(sort)
  fun.sort(sort)

  return { vibeRise, fun }
}

// Primal display order (common → uncommon)
const PRIMAL_ORDER = ['movement', 'play', 'bonds', 'story', 'nourishment', 'status', 'healing', 'shelter', 'fire', 'sleep']

/**
 * Groups an array of { id, label, primal } items by primal in display order.
 * @returns {Array<{ primal: string, label: string, items: Array }>}
 */
export function groupByPrimal(items) {
  const map = {}
  items.forEach(item => {
    if (!map[item.primal]) map[item.primal] = []
    map[item.primal].push(item)
  })
  return PRIMAL_ORDER
    .filter(p => map[p]?.length)
    .map(p => ({
      primal: p,
      label: p.charAt(0).toUpperCase() + p.slice(1),
      items: map[p],
    }))
}

/**
 * Formats dome data for the suggest-life-paths edge function domeProfile field.
 * @param {string[]} selectedLabels - labels the user picked ("Ecstatic dance", etc.)
 * @param {Object} domeStates - full dome map { [nodeId]: nsState }
 * @param {string|null} essenceArchetype - e.g. "Playful Alchemist"
 * @returns {Object|null} domeProfile payload, or null if no data
 */
export function formatDomeForPrompt(selectedLabels, domeStates, essenceArchetype) {
  if (!domeStates || Object.keys(domeStates).length === 0) return null

  const lookup = getNodeLookup()
  const buckets = { vibe_rise: [], fun: [], pressure: [] }

  Object.entries(domeStates).forEach(([nodeId, nsState]) => {
    if (!isCoreNode(nodeId)) return
    const info = lookup.get(nodeId)
    if (!info) return
    const state = nsState === 'growth_edge' ? 'pressure' : nsState
    if (buckets[state]) buckets[state].push(info.label)
  })

  return {
    selected: selectedLabels,
    vibeRise: buckets.vibe_rise,
    fun: buckets.fun,
    pressure: buckets.pressure,
    essence: essenceArchetype || null,
  }
}
