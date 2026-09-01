/**
 * directionEngine.js — Data utilities for the Phase 2→3 Direction Bridge
 *
 * Assembles user data for the direction cards:
 * - Top skills (from courage challenge XP)
 * - Problem profile (from Life Map clusters, grouped by taxonomy)
 * - Dome fuel (top Vibe Rise branches)
 * - Direction status (which cards are completed)
 * - Era responses (Life Map raw data by life period)
 */

import { supabase } from './supabaseClient'
import { findSkillSegment } from './wheelTaxonomy'
import { VIRTUAL_EXPERIENCE_NODES } from './experienceDomeConfig'

// ── Top skills by XP ──────────────────────────────────────────────────────────

export async function getTopSkills(userId, limit = 3) {
  const { data } = await supabase
    .from('user_skill_progress')
    .select('skill_id, xp, level')
    .eq('user_id', userId)
    .order('xp', { ascending: false })
    .limit(limit)

  if (!data?.length) return []

  return data.map(row => {
    const seg = findSkillSegment(row.skill_id)
    return {
      id: row.skill_id,
      xp: row.xp,
      level: row.level,
      displayName: seg?.displayName || row.skill_id,
      tagline: seg?.tagline || '',
    }
  })
}

// ── Problem profile (grouped by taxonomy category) ────────────────────────────

export async function getProblemProfile(userId) {
  const { data } = await supabase
    .from('nikigai_clusters')
    .select('id, cluster_label, problem_tags, resonance_state')
    .eq('user_id', userId)
    .eq('cluster_type', 'problems')
    .not('problem_tags', 'is', null)
    .is('is_removed', null)

  if (!data?.length) return []

  // Group by first problem_tag, count frequency
  const counts = {}
  for (const row of data) {
    const tags = row.problem_tags || []
    for (const tag of tags) {
      if (!tag) continue
      if (!counts[tag]) counts[tag] = { id: tag, count: 0, clusters: [] }
      counts[tag].count++
      counts[tag].clusters.push({
        id: row.id,
        label: row.cluster_label,
        resonance_state: row.resonance_state,
      })
    }
  }

  // Sort by frequency, descending
  return Object.values(counts).sort((a, b) => b.count - a.count)
}

// ── Dome fuel (top Vibe Rise primal branches) ─────────────────────────────────

// Inline mapping: node_id prefix → primal branch
// Derived from ruleBreakTreeData.js INDUSTRIES but simplified for this use case
const PREFIX_TO_PRIMAL = {
  'cars': 'Movement',
  'move': 'Movement', 'sub-endurance': 'Movement', 'sub-strength': 'Movement',
  'sub-flexibility': 'Movement', 'sub-temperature': 'Movement', 'sub-outdoor': 'Movement',
  'sub-dance': 'Movement',
  'food': 'Nourishment', 'sub-ancestral': 'Nourishment', 'sub-ferment': 'Nourishment',
  'sub-fasting': 'Nourishment', 'sub-industrial': 'Nourishment', 'sub-personal': 'Nourishment',
  'sub-regen': 'Nourishment',
  'play': 'Play', 'sub-board': 'Play', 'sub-sport': 'Play', 'sub-digital': 'Play',
  'sub-chance': 'Play', 'sub-toy': 'Play', 'sub-free': 'Play',
  'bonds': 'Bonds', 'comms': 'Bonds', 'exchange': 'Bonds', 'intimacy': 'Bonds',
  'sub-ritual': 'Bonds', 'sub-communal': 'Bonds', 'sub-ordeal': 'Bonds',
  'sub-coaching': 'Bonds', 'sub-couples': 'Bonds',
  'media': 'Story', 'sub-oral': 'Story', 'sub-written': 'Story', 'sub-audio': 'Story',
  'sub-video': 'Story', 'sub-immersive': 'Story', 'sub-creator': 'Story',
  'fashion': 'Status', 'sub-fashion': 'Status', 'sub-beauty': 'Status',
  'sub-luxury': 'Status', 'sub-counter': 'Status', 'sub-craft': 'Status',
  'property': 'Shelter', 'sub-arch': 'Shelter', 'sub-urban': 'Shelter',
  'sub-alt': 'Shelter', 'sub-indoor': 'Shelter', 'sub-proptech': 'Shelter',
  'sub-sacred': 'Shelter',
  'energy': 'Fire', 'sub-combustion': 'Fire', 'sub-grid': 'Fire',
  'sub-renewable': 'Fire', 'sub-light': 'Fire',
  'med': 'Healing', 'medicine': 'Healing', 'sub-traditional': 'Healing',
  'sub-psychedelic': 'Healing', 'sub-somatic': 'Healing', 'sub-mindbody': 'Healing',
  'sub-mental': 'Healing', 'sub-energy': 'Healing',
  'tech': 'Tools', 'ai': 'Tools',
  'defense': 'Threat', 'sub-weapons': 'Threat', 'sub-insurance': 'Threat',
  'sub-safety': 'Threat', 'sub-resilience': 'Threat', 'sub-surveillance': 'Threat',
  'sub-cyber': 'Threat',
  'sleep': 'Sleep', 'sub-dream': 'Sleep', 'sub-medicine': 'Sleep',
  'sub-circadian': 'Sleep', 'sub-tech': 'Sleep', 'sub-rest': 'Sleep',
  'sub-states': 'Sleep',
}

// Experience-specific overrides (from DomeRadar.jsx)
const PRIMAL_OVERRIDES = {
  'sub-safety-1400b': 'Movement',  // Martial arts
  'sub-safety-1993': 'Movement',   // BJJ/MMA
  'sub-craft-1880': 'Story',       // Art
  'sub-temperature-2019': 'Healing', // Sauna
  'sub-communal-2017': 'Shelter',  // Living abroad
}

// Build lookup for virtual experience nodes (exp-*)
const VIRTUAL_PRIMAL = {}
;(VIRTUAL_EXPERIENCE_NODES || []).forEach(n => {
  if (n.id && n.primal) VIRTUAL_PRIMAL[n.id] = n.primal.charAt(0).toUpperCase() + n.primal.slice(1)
})

function getNodePrimal(nodeId) {
  if (PRIMAL_OVERRIDES[nodeId]) return PRIMAL_OVERRIDES[nodeId]
  if (VIRTUAL_PRIMAL[nodeId]) return VIRTUAL_PRIMAL[nodeId]

  // Try increasingly shorter prefixes: "sub-dance-1900" → "sub-dance" → "sub"
  const parts = nodeId.split('-')
  for (let i = parts.length; i >= 1; i--) {
    const prefix = parts.slice(0, i).join('-')
    if (PREFIX_TO_PRIMAL[prefix]) return PREFIX_TO_PRIMAL[prefix]
  }

  // Fallback: first segment
  return PREFIX_TO_PRIMAL[parts[0]] || null
}

export async function getDomeFuel(userId, limit = 3) {
  const { data } = await supabase
    .from('experience_dome_ratings')
    .select('node_id, ns_state')
    .eq('user_id', userId)
    .in('ns_state', ['vibe_rise', 'fun'])

  if (!data?.length) return []

  // Group by primal branch, count Vibe Rise (weight 2) + Fun (weight 1)
  const branchScores = {}
  for (const { node_id, ns_state } of data) {
    const primal = getNodePrimal(node_id)
    if (!primal) continue
    if (!branchScores[primal]) branchScores[primal] = 0
    branchScores[primal] += ns_state === 'vibe_rise' ? 2 : 1
  }

  return Object.entries(branchScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([branch, score]) => ({ branch, score }))
}

// ── Direction status (which cards are completed) ──────────────────────────────

export async function getDirectionStatus(userId) {
  const [{ data: reveals }, { data: income }] = await Promise.all([
    supabase
      .from('direction_reveals')
      .select('reveal_type, reveal_data, viewed_at')
      .eq('user_id', userId),
    supabase
      .from('income_self_reports')
      .select('id, amount_cents')
      .eq('user_id', userId)
      .gt('amount_cents', 0)
      .limit(1),
  ])

  const revealMap = {}
  ;(reveals || []).forEach(r => { revealMap[r.reveal_type] = r })

  return {
    lifeMapReview: !!revealMap.life_map_review,
    problemMotivation: !!revealMap.problem_motivation,
    multiplication: !!revealMap.multiplication,
    firstIncome: (income?.length || 0) > 0,
    problemSelections: revealMap.problem_motivation?.reveal_data?.selected || [],
    multiplicationData: revealMap.multiplication?.reveal_data || null,
  }
}

// ── Era responses (Life Map raw data) ─────────────────────────────────────────

const ERA_ORDER = [
  { key: 'childhood', label: 'Childhood' },
  { key: 'teens', label: 'Teens' },
  { key: 'young_adult', label: 'Young Adult' },
  { key: 'career', label: 'Career' },
  { key: 'now', label: 'Now' },
]

export async function getEraResponses(userId) {
  const { data } = await supabase
    .from('flow_sessions')
    .select('response_data')
    .eq('user_id', userId)
    .eq('flow_type', 'life_map')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.response_data?.responses) return null

  const responses = data.response_data.responses
  return ERA_ORDER.map(era => ({
    key: era.key,
    label: era.label,
    skills: responses[`${era.key}_skills`] || [],
    problems: responses[`${era.key}_problems`] || [],
    personas: responses[`${era.key}_personas`] || [],
  })).filter(era => era.skills.length || era.problems.length || era.personas.length)
}
