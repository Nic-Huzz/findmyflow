// src/lib/passionChallengeEngine.js

import { supabase } from './supabaseClient'
import { EXPERIENCE_REVENUE_MODELS } from '../data/experienceRevenueModels'
import { DOME_DIMENSIONS, getNumericTier } from '../data/domeDimensions'
import { MONEY_MODEL_LADDER } from '../data/moneyModelLadder'
import { EXPERIENCE_PRICING } from '../data/experiencePricing'

const CACHE_PREFIX = 'passion_rec_'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ── Strike types (exported for manual mode UI) ─────────────────────

export const STRIKE_TYPES = [
  { id: 'fight', label: 'Challenge the Norm', desc: 'Take a position. Say what nobody is saying.' },
  { id: 'stunt', label: 'Make Them Look Twice', desc: 'Do something unexpected that makes people go "wait, what?"' },
  { id: 'functional', label: 'Let Them Feel It', desc: 'Prove it works by doing it live. Let people experience the result.' },
  { id: 'culture_creating', label: 'Start a Ritual', desc: 'Create something repeatable that people identify with and spread.' },
]

// ── Revenue pattern ────────────────────────────────────────────────

const TAG_TO_PATTERN = {
  session_fees: 'practitioner', project_fees: 'project', ticket_sales: 'events',
  product_sales: 'product', wage: 'wage', coaching_packages: 'practitioner',
  ad_sponsorship: 'practitioner', membership: 'practitioner',
  venue_revenue: 'events', commission: 'events', returns_capital: 'wage',
}

function derivePattern(experienceLabels) {
  if (!experienceLabels?.length) return 'generic'
  const counts = {}
  for (const label of experienceLabels) {
    const tags = EXPERIENCE_REVENUE_MODELS[label]
    if (!tags?.length) continue
    const pattern = TAG_TO_PATTERN[tags[0]] || 'generic'
    counts[pattern] = (counts[pattern] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || 'generic'
}

// ── Business stage from dome dimension ─────────────────────────────

const STAGE_MAP = ['hobby', 'hobby', 'first_revenue', 'repeatable', 'full_time', 'team_scale']

function deriveStage(currentDims, actualProgress) {
  const level = Math.max(currentDims?.business_commitment || 0, actualProgress?.business_commitment || 0)
  return STAGE_MAP[Math.min(level, 5)] || 'hobby'
}

// ── Strike type auto-selection ─────────────────────────────────────

async function autoSelectStrikeType(userId, questId) {
  // Avoid repeating the immediately previous type.
  // DB unique constraint = only 1 row per quest. Full rotation is V2.
  const { data: last } = await supabase
    .from('passion_challenge_recs')
    .select('strike_type')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .maybeSingle()

  const allTypes = STRIKE_TYPES.map(t => t.id)
  const lastType = last?.strike_type
  if (lastType) {
    const others = allTypes.filter(t => t !== lastType)
    return others[Math.floor(Math.random() * others.length)]
  }
  return allTypes[Math.floor(Math.random() * allTypes.length)]
}

// ── Money model position ───────────────────────────────────────────
// Maps business stage to ladder index (approximation).
// experiencePricing keys: employed, per_session, group_program, workshop_retreat.
// Ladder IDs beyond group_program don't have domain-specific pricing, falls back
// to generic dealSize from moneyModelLadder.js.

function getMoneyModelPosition(stage, experienceLabels) {
  const stageToIdx = { hobby: 0, first_revenue: 1, repeatable: 2, full_time: 3, team_scale: 4 }
  const currentIdx = stageToIdx[stage] || 0
  const nextIdx = Math.min(currentIdx + 1, MONEY_MODEL_LADDER.length - 1)
  const current = MONEY_MODEL_LADDER[currentIdx]
  const next = MONEY_MODEL_LADDER[nextIdx]

  const firstExp = experienceLabels?.[0]
  const domainPricing = firstExp ? EXPERIENCE_PRICING[firstExp] : null

  return {
    current_tier: current?.label || 'Starting out',
    next_tier: next?.label || current?.label || 'Next level',
    current_deal_size: domainPricing?.[current?.id] || current?.dealSize || '',
    next_deal_size: domainPricing?.[next?.id] || next?.dealSize || '',
  }
}

// ── Actual progress (duplicated from PerQuestRadar, ~15 lines) ─────

async function computeActualProgress(questId) {
  const { data: tasks } = await supabase
    .from('quest_tasks').select('groan_challenge_id')
    .eq('quest_id', questId).eq('is_courage_challenge', true)

  const groanIds = (tasks || []).filter(t => t.groan_challenge_id).map(t => t.groan_challenge_id)
  if (!groanIds.length) return {}

  const { data: challenges } = await supabase
    .from('groan_challenges').select('dimension_values')
    .in('id', groanIds).eq('status', 'completed')

  const progress = {}
  ;(challenges || []).forEach(c => {
    if (!c.dimension_values) return
    for (const [dimId, rawVal] of Object.entries(c.dimension_values)) {
      const dim = DOME_DIMENSIONS.find(d => d.id === dimId)
      if (!dim) continue
      const val = dim.type === 'numeric' && rawVal > dim.maxLevel
        ? getNumericTier(dimId, rawVal) : rawVal
      progress[dimId] = Math.max(progress[dimId] || 0, val)
    }
  })
  return progress
}

// ── Gap computation ────────────────────────────────────────────────

function computeGaps(currentDims, dreamDims, actualProgress) {
  const gaps = {}
  for (const dim of DOME_DIMENSIONS) {
    const start = currentDims?.[dim.id] || 0
    const dream = dreamDims?.[dim.id] || 0
    const actual = Math.max(start, actualProgress[dim.id] || 0)
    const gap = dream - actual
    if (gap > 0) gaps[dim.id] = { current: start, dream, actual, gap }
  }
  return gaps
}

// ── Exported: gap dimensions for manual mode UI ────────────────────
// Accounts for actual progress (completed challenges), not just start dims.

export async function getGapDimensions(questId) {
  const { data: quest } = await supabase.from('quests')
    .select('current_dimensions, dream_dimensions')
    .eq('id', questId).single()
  if (!quest?.current_dimensions || !quest?.dream_dimensions) return []

  const actualProgress = await computeActualProgress(questId)
  const gaps = computeGaps(quest.current_dimensions, quest.dream_dimensions, actualProgress)
  return Object.keys(gaps)
}

// ── localStorage cache ─────────────────────────────────────────────

function cacheKey(questId) { return CACHE_PREFIX + questId }

export function getCached(questId) {
  try {
    const raw = localStorage.getItem(cacheKey(questId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - new Date(parsed.generatedAt).getTime() > TTL_MS) {
      localStorage.removeItem(cacheKey(questId))
      return null
    }
    return parsed.recommendation
  } catch { return null }
}

function saveToCache(questId, recommendation) {
  try {
    localStorage.setItem(cacheKey(questId), JSON.stringify({
      recommendation, generatedAt: new Date().toISOString(),
    }))
  } catch { /* localStorage full or unavailable */ }
}

export function invalidate(questId) {
  try { localStorage.removeItem(cacheKey(questId)) } catch {}
}

// ── DB operations ──────────────────────────────────────────────────

async function saveToDB(userId, questId, recommendation, strikeType, targetDimensions, pattern, stage, mode) {
  await supabase.from('passion_challenge_recs').upsert({
    user_id: userId, quest_id: questId, recommendation,
    strike_type: strikeType, target_dimensions: targetDimensions,
    pattern, stage, mode,
    generated_at: new Date().toISOString(),
    accepted_at: null, dismissed_at: null,
  }, { onConflict: 'user_id,quest_id' })
}

export async function markAccepted(questId, userId) {
  invalidate(questId)
  await supabase.from('passion_challenge_recs')
    .update({ accepted_at: new Date().toISOString() })
    .eq('user_id', userId).eq('quest_id', questId)
}

export async function markDismissed(questId, userId) {
  invalidate(questId)
  await supabase.from('passion_challenge_recs')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('user_id', userId).eq('quest_id', questId)
}

// ── Main generate ──────────────────────────────────────────────────

/**
 * @param {string} questId
 * @param {string} userId
 * @param {{ strikeType: string, dimensions: string[] }} [opts] — manual mode
 * @returns {Promise<{ challenge: string, permission: string, closer: string, stretches: string[] } | null>}
 */
export async function generate(questId, userId, opts) {
  const isManual = opts?.strikeType && opts?.dimensions?.length
  try {
    const [questRes, expRes] = await Promise.all([
      supabase.from('quests')
        .select('label, current_dimensions, dream_dimensions, is_current_job, is_bridge_job, status')
        .eq('id', questId).single(),
      supabase.from('quest_experiences')
        .select('label').eq('quest_id', questId).eq('status', 'active'),
    ])

    const quest = questRes.data
    if (!quest?.current_dimensions || !Object.keys(quest.current_dimensions).length) return null
    if (quest.is_current_job || quest.is_bridge_job || quest.status !== 'active') return null

    const actualProgress = await computeActualProgress(questId)
    const gaps = computeGaps(quest.current_dimensions, quest.dream_dimensions, actualProgress)
    if (!Object.keys(gaps).length) return null

    const experienceLabels = (expRes.data || []).map(e => e.label)
    const pattern = derivePattern(experienceLabels)
    const stage = deriveStage(quest.current_dimensions, actualProgress)

    let strikeType, targetDimensions
    if (isManual) {
      strikeType = opts.strikeType
      targetDimensions = opts.dimensions
    } else {
      strikeType = await autoSelectStrikeType(userId, questId)
      const sorted = Object.entries(gaps).sort((a, b) => b[1].gap - a[1].gap)
      targetDimensions = sorted.slice(0, 2).map(([dim]) => dim)
    }

    const moneyFilter = (quest.dream_dimensions?.money || 0) > 0
    const moneyModelPosition = moneyFilter ? getMoneyModelPosition(stage, experienceLabels) : null

    const { count } = await supabase.from('quest_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('quest_id', questId).eq('is_courage_challenge', true).eq('done', true)

    const { data, error } = await supabase.functions.invoke('generate-passion-challenge', {
      body: {
        strike_type: strikeType, target_dimensions: targetDimensions,
        experience_labels: experienceLabels, revenue_pattern: pattern,
        business_stage: stage, dimension_gaps: gaps,
        completed_count: count || 0, quest_label: quest.label,
        money_filter: moneyFilter, money_model_position: moneyModelPosition,
      },
    })

    if (error || !data?.challenge) {
      console.warn('Passion challenge generation failed:', error || 'empty response')
      return null
    }

    const recommendation = {
      challenge: data.challenge, permission: data.permission,
      closer: data.closer, stretches: data.stretches || [],
    }

    const mode = isManual ? 'manual' : 'auto'
    saveToCache(questId, recommendation)
    saveToDB(userId, questId, recommendation, strikeType, targetDimensions, pattern, stage, mode)
      .catch(err => console.warn('Failed to save passion rec to DB:', err))

    return recommendation
  } catch (err) {
    console.warn('passionChallengeEngine.generate error:', err)
    return null
  }
}
