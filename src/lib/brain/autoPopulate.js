/**
 * autoPopulate.js — Brain auto-populate hooks
 *
 * Each function is called after a flow saves its data to its source table.
 * They extract the relevant fields and write them to the brain via updateBrainFields.
 *
 * These are fire-and-forget: they log errors but don't block the flow.
 * The brain building itself silently is the goal.
 *
 * Usage (in a flow's save handler, after the main insert/upsert):
 *   import { onScopeMapComplete } from '../lib/brain/autoPopulate'
 *   await onScopeMapComplete(userId, result.stage)
 */

import { updateBrainFields } from './brainService'

function safe(fn) {
  return async (...args) => {
    try { await fn(...args) }
    catch (err) { console.error(`[CreatorBrain] auto-populate error:`, err) }
  }
}

// ─── Scope Map ───────────────────────────────────────────────────────────────

export const onScopeMapComplete = safe(async (userId, stage) => {
  await updateBrainFields(userId, {
    'identity.scope_position': {
      value: stage,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'scope_map_flow',
      evidence: `Selected "${stage}" in Scope Map diagnostic`,
    },
  })
})

// ─── Essence Mirror ──────────────────────────────────────────────────────────

export const onEssenceMirrorComplete = safe(async (userId, { primaryArchetype, secondaryArchetype, heroName, avatarUrl }) => {
  const fields = {}

  if (primaryArchetype) {
    fields['identity.essence_archetype'] = {
      value: primaryArchetype,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'essence_mirror_flow',
      evidence: 'Primary archetype from Essence Mirror',
    }
  }
  if (secondaryArchetype) {
    fields['identity.secondary_archetype'] = {
      value: secondaryArchetype,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'essence_mirror_flow',
      evidence: 'Secondary archetype from Essence Mirror blend',
    }
  }
  if (heroName) {
    fields['identity.hero_name'] = {
      value: heroName,
      confidence: 'confirmed',
      source: 'user',
      sourceIdentifier: 'essence_mirror_flow',
      evidence: 'User-chosen hero name',
    }
  }
  if (avatarUrl) {
    fields['identity.hero_avatar_url'] = {
      value: avatarUrl,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'essence_mirror_flow',
      evidence: 'Generated Pixar avatar from Essence Mirror',
    }
  }

  if (Object.keys(fields).length > 0) {
    await updateBrainFields(userId, fields)
  }
})

// ─── Experience Creator Matching ─────────────────────────────────────────────

export const onCreatorMatchingComplete = safe(async (userId, { dominantArchetype, selectedCreators, productSuite }) => {
  const fields = {}

  if (dominantArchetype) {
    fields['identity.creator_archetype'] = {
      value: dominantArchetype,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'experience_creator_flow',
      evidence: `Matched to "${dominantArchetype}" archetype`,
    }
  }
  if (selectedCreators?.length) {
    fields['identity.north_stars'] = {
      value: selectedCreators,
      confidence: 'confirmed',
      source: 'user',
      sourceIdentifier: 'experience_creator_flow',
      evidence: `Selected ${selectedCreators.length} north star creators`,
    }
  }
  if (productSuite) {
    fields['identity.product_suite'] = {
      value: productSuite,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'experience_creator_flow',
      evidence: 'Product suite from archetype matching',
    }
  }

  if (Object.keys(fields).length > 0) {
    await updateBrainFields(userId, fields)
  }
})

// ─── Play Profile (Founder DNA) ──────────────────────────────────────────────

export const onPlayProfileComplete = safe(async (userId, { dnaCode, archetype, matchedFounder, sliders }) => {
  const fields = {}

  if (dnaCode) {
    fields['inner_game.dna_code'] = {
      value: dnaCode,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'play_profile_quiz',
      evidence: 'DNA code from Play Profile quiz',
    }
  }
  if (matchedFounder) {
    fields['inner_game.matched_creator'] = {
      value: matchedFounder,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'play_profile_quiz',
      evidence: `Matched to ${matchedFounder} via 5D Euclidean distance`,
    }
  }
  if (sliders?.workRhythm !== undefined) {
    fields['inner_game.work_rhythm'] = {
      value: sliders.workRhythm > 0.5 ? 'Sprints' : 'Marathon',
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'play_profile_quiz',
      evidence: `Work rhythm slider: ${sliders.workRhythm}`,
    }
  }
  if (sliders?.fuelType !== undefined) {
    fields['inner_game.fuel_type'] = {
      value: sliders.fuelType > 0.5 ? 'Purpose' : 'Fire',
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'play_profile_quiz',
      evidence: `Fuel type slider: ${sliders.fuelType}`,
    }
  }

  if (Object.keys(fields).length > 0) {
    await updateBrainFields(userId, fields)
  }
})

// ─── Remarkable Flow ─────────────────────────────────────────────────────────

export const onRemarkableComplete = safe(async (userId, { ruleIdentified, combinationInsight, extremeAction, aiRuleStatement, aiTribeStatement }) => {
  const fields = {}

  if (ruleIdentified) {
    fields['identity.rule_break'] = {
      value: ruleIdentified,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'remarkable_flow',
      evidence: 'Rule break from Remarkable Flow',
    }
  }
  if (combinationInsight) {
    fields['identity.unexpected_combo'] = {
      value: combinationInsight,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'remarkable_flow',
      evidence: 'Two-worlds combination insight',
    }
  }
  if (extremeAction) {
    fields['identity.extreme_action'] = {
      value: extremeAction,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'remarkable_flow',
      evidence: 'Compression / extreme action plan',
    }
  }
  if (aiRuleStatement) {
    fields['identity.ai_rule_statement'] = {
      value: aiRuleStatement,
      confidence: 'medium',
      source: 'ai_inferred',
      sourceIdentifier: 'remarkable_flow',
      evidence: 'AI-generated rule statement',
    }
  }
  if (aiTribeStatement) {
    fields['identity.ai_tribe_statement'] = {
      value: aiTribeStatement,
      confidence: 'medium',
      source: 'ai_inferred',
      sourceIdentifier: 'remarkable_flow',
      evidence: 'AI-generated tribe statement',
    }
  }

  if (Object.keys(fields).length > 0) {
    await updateBrainFields(userId, fields)
  }
})

// ─── Nervous System Flow ─────────────────────────────────────────────────────

export const onNervousSystemComplete = safe(async (userId, { impactLimit, incomeLimit, archetype }) => {
  const fields = {}

  if (impactLimit) {
    fields['inner_game.visibility_ceiling'] = {
      value: impactLimit,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'nervous_system_flow',
      evidence: 'Visibility ceiling from NS assessment',
    }
  }
  if (incomeLimit) {
    fields['inner_game.income_ceiling'] = {
      value: incomeLimit,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'nervous_system_flow',
      evidence: 'Income ceiling from NS assessment',
    }
  }
  if (archetype) {
    fields['inner_game.ns_archetype'] = {
      value: archetype,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'nervous_system_flow',
      evidence: 'NS archetype from assessment reflection',
    }
  }

  if (Object.keys(fields).length > 0) {
    await updateBrainFields(userId, fields)
  }
})

// ─── Pay Rent Flow ───────────────────────────────────────────────────────────

export const onPayRentComplete = safe(async (userId, model) => {
  await updateBrainFields(userId, {
    'offer.pay_rent_model': {
      value: model,
      confidence: 'confirmed',
      source: 'user',
      sourceIdentifier: 'pay_rent_flow',
      evidence: 'User selected pay rent model',
    },
  })
})

// ─── Scale Income / Creator Assessment ───────────────────────────────────────

export const onCreatorAssessmentComplete = safe(async (userId, assessment) => {
  const fields = {}

  for (const layer of ['attraction', 'core', 'continuity']) {
    const detail = assessment[`${layer}_detail`]
    const status = assessment[`${layer}_status`]
    if (detail) {
      fields[`offer.${layer}_product`] = {
        value: detail,
        confidence: 'high',
        source: 'flow',
        sourceIdentifier: 'scale_income_flow',
        evidence: `${layer} product from Scale Income assessment`,
      }
    }
    if (status) {
      fields[`offer.${layer}_status`] = {
        value: status,
        confidence: 'high',
        source: 'flow',
        sourceIdentifier: 'scale_income_flow',
        evidence: `${layer} status: ${status}`,
      }
    }
  }

  if (Object.keys(fields).length > 0) {
    await updateBrainFields(userId, fields)
  }
})

// ─── Life Map (Skills & Problems) ────────────────────────────────────────────

export const onLifeMapComplete = safe(async (userId, { skills, problems }) => {
  const fields = {}

  if (skills?.length) {
    fields['identity.skills'] = {
      value: skills,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'life_map_flow',
      evidence: `${skills.length} skills from Life Map`,
    }
  }
  if (problems?.length) {
    fields['identity.problems'] = {
      value: problems,
      confidence: 'high',
      source: 'flow',
      sourceIdentifier: 'life_map_flow',
      evidence: `${problems.length} problems from Life Map`,
    }
  }

  if (Object.keys(fields).length > 0) {
    await updateBrainFields(userId, fields)
  }
})

// ─── Wound Map ───────────────────────────────────────────────────────────────

export const onWoundMapComplete = safe(async (userId) => {
  await updateBrainFields(userId, {
    'inner_game.wound_completed': {
      value: true,
      confidence: 'confirmed',
      source: 'flow',
      sourceIdentifier: 'wound_map',
      evidence: 'Wound map quest completed',
    },
  })
})

// ─── Limiting Belief Rewire ──────────────────────────────────────────────────

export const onBeliefRewireComplete = safe(async (userId) => {
  await updateBrainFields(userId, {
    'inner_game.belief_rewire_done': {
      value: true,
      confidence: 'confirmed',
      source: 'flow',
      sourceIdentifier: 'limiting_belief_rewire',
      evidence: 'Limiting belief rewire completed',
    },
  })
})

// ─── Journey Level Update ────────────────────────────────────────────────────

export const onJourneyLevelChange = safe(async (userId, level) => {
  await updateBrainFields(userId, {
    'inner_game.journey_level': {
      value: level,
      confidence: 'confirmed',
      source: 'flow',
      sourceIdentifier: 'journey_system',
      evidence: `Advanced to level ${level}`,
    },
  })
})
