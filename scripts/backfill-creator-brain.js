#!/usr/bin/env node
/**
 * backfill-creator-brain.js
 *
 * One-time script to populate creator_brain for existing users.
 * Reads from all source tables and writes to creator_brain using the same
 * merge logic as the auto-populate hooks.
 *
 * Run after applying the 20260608000000_creator_brain.sql migration.
 *
 * Usage:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/backfill-creator-brain.js
 *
 * Or with a service role key for full access:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/backfill-creator-brain.js
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(url, key)

// ─── Inline merge logic (avoid ESM import issues with Vite modules) ─────────

function proposedField(value, { confidence = 'high', source = 'flow', sourceIdentifier = null, evidence = null } = {}) {
  return { value, confidence, state: 'proposed', has_conflict: false, source, source_identifier: sourceIdentifier, evidence, updated_at: new Date().toISOString(), conflicts: [] }
}

// ─── Markdown regeneration (simplified for backfill) ─────────────────────────

const DOMAIN_LABELS = { identity: 'Identity', offer: 'Offer', audience: 'Audience', voice: 'Voice', inner_game: 'Inner Game', performance: 'Performance' }
const DOMAINS = Object.keys(DOMAIN_LABELS)

function regenerateMarkdown(facts) {
  const result = {}
  for (const domain of DOMAINS) {
    const domainFacts = Object.entries(facts).filter(([k]) => k.startsWith(domain + '.'))
    if (domainFacts.length === 0) { result[`${domain}_md`] = ''; continue }
    const lines = [`# ${DOMAIN_LABELS[domain]}`, '']
    for (const [key, field] of domainFacts) {
      if (!field || field.state === 'empty' || field.value === null || field.value === undefined) continue
      const label = key.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const val = Array.isArray(field.value) ? field.value.join(', ') : typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value)
      lines.push(`**${label}:** ${val}`, '')
    }
    result[`${domain}_md`] = lines.join('\n').trim()
  }
  return result
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function backfill() {
  console.log('Starting Creator Brain backfill...\n')

  // Get all users who have completed at least one flow
  const { data: users } = await supabase.from('user_stage_progress').select('user_id')
  if (!users?.length) { console.log('No users found.'); return }

  const userIds = [...new Set(users.map(u => u.user_id))]
  console.log(`Found ${userIds.length} users to backfill.\n`)

  let success = 0, skipped = 0

  for (const userId of userIds) {
    const facts = {}

    // ── Scope Map
    const { data: scope } = await supabase.from('scope_map_results').select('stage').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (scope?.stage) facts['identity.scope_position'] = proposedField(scope.stage, { sourceIdentifier: 'backfill' })

    // ── Essence Mirror
    const { data: essence } = await supabase.from('lead_flow_profiles').select('essence_archetype, custom_essence_name, custom_essence_image').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (essence?.essence_archetype) facts['identity.essence_archetype'] = proposedField(essence.essence_archetype, { sourceIdentifier: 'backfill' })
    if (essence?.custom_essence_name) facts['identity.hero_name'] = proposedField(essence.custom_essence_name, { source: 'user', sourceIdentifier: 'backfill' })
    if (essence?.custom_essence_image) facts['identity.hero_avatar_url'] = proposedField(essence.custom_essence_image, { sourceIdentifier: 'backfill' })

    // ── Experience Creator Matching
    const { data: selection } = await supabase.from('experience_creator_selections').select('dominant_archetype, selected_creators, product_suite').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (selection?.dominant_archetype) facts['identity.creator_archetype'] = proposedField(selection.dominant_archetype, { sourceIdentifier: 'backfill' })
    if (selection?.selected_creators?.length) facts['identity.north_stars'] = proposedField(selection.selected_creators, { source: 'user', sourceIdentifier: 'backfill' })
    if (selection?.product_suite) facts['identity.product_suite'] = proposedField(selection.product_suite, { sourceIdentifier: 'backfill' })

    // ── Play Profile
    const { data: dna } = await supabase.from('founder_dna_results').select('dna_code, archetype, matched_founder, slider_values').eq('user_id', userId).order('completed_at', { ascending: false }).limit(1).maybeSingle()
    if (dna?.dna_code) facts['inner_game.dna_code'] = proposedField(dna.dna_code, { sourceIdentifier: 'backfill' })
    if (dna?.matched_founder) facts['inner_game.matched_creator'] = proposedField(dna.matched_founder, { sourceIdentifier: 'backfill' })
    if (dna?.slider_values?.workRhythm !== undefined) facts['inner_game.work_rhythm'] = proposedField(dna.slider_values.workRhythm > 0.5 ? 'Sprints' : 'Marathon', { sourceIdentifier: 'backfill' })
    if (dna?.slider_values?.fuelType !== undefined) facts['inner_game.fuel_type'] = proposedField(dna.slider_values.fuelType > 0.5 ? 'Purpose' : 'Fire', { sourceIdentifier: 'backfill' })

    // ── Remarkable Angle
    const { data: remarkable } = await supabase.from('remarkable_angles').select('rule_identified, combination_insight, extreme_action_plan, ai_rule_statement, ai_tribe_statement').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (remarkable?.rule_identified) facts['identity.rule_break'] = proposedField(remarkable.rule_identified, { sourceIdentifier: 'backfill' })
    if (remarkable?.combination_insight) facts['identity.unexpected_combo'] = proposedField(remarkable.combination_insight, { sourceIdentifier: 'backfill' })
    if (remarkable?.extreme_action_plan) facts['identity.extreme_action'] = proposedField(remarkable.extreme_action_plan, { sourceIdentifier: 'backfill' })
    if (remarkable?.ai_rule_statement) facts['identity.ai_rule_statement'] = proposedField(remarkable.ai_rule_statement, { source: 'ai_inferred', confidence: 'medium', sourceIdentifier: 'backfill' })
    if (remarkable?.ai_tribe_statement) facts['identity.ai_tribe_statement'] = proposedField(remarkable.ai_tribe_statement, { source: 'ai_inferred', confidence: 'medium', sourceIdentifier: 'backfill' })

    // ── Nervous System
    const { data: ns } = await supabase.from('nervous_system_responses').select('nervous_system_impact_limit, nervous_system_income_limit, archetype').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (ns?.nervous_system_impact_limit) facts['inner_game.visibility_ceiling'] = proposedField(ns.nervous_system_impact_limit, { sourceIdentifier: 'backfill' })
    if (ns?.nervous_system_income_limit) facts['inner_game.income_ceiling'] = proposedField(ns.nervous_system_income_limit, { sourceIdentifier: 'backfill' })
    if (ns?.archetype) facts['inner_game.ns_archetype'] = proposedField(ns.archetype, { sourceIdentifier: 'backfill' })

    // ── Pay Rent
    const { data: stage } = await supabase.from('user_stage_progress').select('pay_rent_model, current_journey_level').eq('user_id', userId).maybeSingle()
    if (stage?.pay_rent_model) facts['offer.pay_rent_model'] = proposedField(stage.pay_rent_model, { source: 'user', sourceIdentifier: 'backfill' })
    if (stage?.current_journey_level !== null && stage?.current_journey_level !== undefined) facts['inner_game.journey_level'] = proposedField(stage.current_journey_level, { sourceIdentifier: 'backfill' })

    // ── Creator Assessment
    const { data: assess } = await supabase.from('creator_assessments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (assess) {
      for (const layer of ['attraction', 'core', 'continuity']) {
        if (assess[`${layer}_detail`]) facts[`offer.${layer}_product`] = proposedField(assess[`${layer}_detail`], { sourceIdentifier: 'backfill' })
        if (assess[`${layer}_status`]) facts[`offer.${layer}_status`] = proposedField(assess[`${layer}_status`], { sourceIdentifier: 'backfill' })
      }
    }

    // ── Skills & Problems
    const { data: skills } = await supabase.from('nikigai_clusters').select('cluster_label, is_favourite').eq('user_id', userId).eq('cluster_type', 'skills').eq('cluster_stage', 'final')
    const { data: problems } = await supabase.from('nikigai_clusters').select('cluster_label, is_favourite').eq('user_id', userId).eq('cluster_type', 'problems').eq('cluster_stage', 'final')
    if (skills?.length) {
      const hasFavs = skills.some(s => s.is_favourite)
      const skillLabels = hasFavs ? skills.filter(s => s.is_favourite).map(s => s.cluster_label) : skills.map(s => s.cluster_label)
      facts['identity.skills'] = proposedField(skillLabels, { sourceIdentifier: 'backfill' })
    }
    if (problems?.length) {
      const hasFavs = problems.some(p => p.is_favourite)
      const problemLabels = hasFavs ? problems.filter(p => p.is_favourite).map(p => p.cluster_label) : problems.map(p => p.cluster_label)
      facts['identity.problems'] = proposedField(problemLabels, { sourceIdentifier: 'backfill' })
    }

    // ── Wound Map & Belief Rewire (completion checks)
    const { data: wound } = await supabase.from('quest_completions').select('id').eq('user_id', userId).eq('quest_id', 'wound_map').limit(1).maybeSingle()
    if (wound) facts['inner_game.wound_completed'] = proposedField(true, { sourceIdentifier: 'backfill' })

    const { data: belief } = await supabase.from('healing_compass_responses').select('id').eq('user_id', userId).eq('flow_version', 2).limit(1).maybeSingle()
    if (belief) facts['inner_game.belief_rewire_done'] = proposedField(true, { sourceIdentifier: 'backfill' })

    // ── Skip if no data
    if (Object.keys(facts).length === 0) {
      skipped++
      continue
    }

    // ── Write brain
    const markdown = regenerateMarkdown(facts)
    const { error } = await supabase.from('creator_brain').upsert({
      user_id: userId,
      facts,
      ...markdown,
    }, { onConflict: 'user_id' })

    if (error) {
      console.error(`  ✗ ${userId}: ${error.message}`)
    } else {
      success++
      console.log(`  ✓ ${userId}: ${Object.keys(facts).length} fields`)
    }
  }

  console.log(`\nDone. ${success} brains created, ${skipped} users skipped (no data).`)
}

backfill().catch(err => { console.error('Backfill failed:', err); process.exit(1) })
