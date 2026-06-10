/**
 * brainService.js — Creator Brain read/write service
 *
 * The main API surface for the Creator Brain. Every AI feature calls this.
 *
 * Two core functions:
 *   getCreatorBrain(userId)  — Read the full brain (facts + markdown)
 *   updateBrainFields(userId, fields) — Write fields with merge logic
 *
 * The brain auto-creates on first write (no explicit "create brain" step).
 */

import { supabase } from '../supabaseClient'
import { mergeBatch } from './mergeBrain'
import { regenerateAllMarkdown, generateContextPrompt } from './regenerateMarkdown'
import { DOMAINS, CANONICAL_FIELDS } from './canonicalFields'

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Get the full creator brain.
 *
 * @param {string} userId
 * @returns {Promise<{ facts, markdown, contextPrompt, exists }>}
 *   - facts: the raw sidecar { "domain.key" → BrainField }
 *   - markdown: { identity_md, offer_md, audience_md, voice_md, inner_game_md, performance_md }
 *   - contextPrompt: combined markdown string for AI prompt injection
 *   - exists: whether the brain row existed
 */
export async function getCreatorBrain(userId) {
  const { data, error } = await supabase
    .from('creator_brain')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('getCreatorBrain error:', error)
    return { facts: {}, markdown: emptyMarkdown(), contextPrompt: '', exists: false }
  }

  if (!data) {
    return { facts: {}, markdown: emptyMarkdown(), contextPrompt: '', exists: false }
  }

  const facts = data.facts || {}

  // If facts exist but markdown columns are empty (e.g., after backfill),
  // regenerate and persist in the background
  const markdownEmpty = !data.identity_md && !data.offer_md && !data.inner_game_md
  const hasFacts = Object.keys(facts).length > 0

  if (markdownEmpty && hasFacts) {
    const freshMarkdown = regenerateAllMarkdown(facts)
    // Fire-and-forget: update stored markdown without blocking the read
    supabase
      .from('creator_brain')
      .update(freshMarkdown)
      .eq('user_id', userId)
      .then(({ error: mdErr }) => { if (mdErr) console.error('Markdown regen error:', mdErr) })

    return {
      facts,
      markdown: freshMarkdown,
      contextPrompt: generateContextPrompt(facts),
      exists: true,
    }
  }

  return {
    facts,
    markdown: {
      identity_md: data.identity_md || '',
      offer_md: data.offer_md || '',
      audience_md: data.audience_md || '',
      voice_md: data.voice_md || '',
      inner_game_md: data.inner_game_md || '',
      performance_md: data.performance_md || '',
    },
    contextPrompt: generateContextPrompt(facts),
    exists: true,
  }
}

/**
 * Get brain context for specific domains only (lighter read for targeted AI features).
 *
 * @param {string} userId
 * @param {string[]} domains - e.g., ['voice', 'offer', 'audience']
 * @returns {Promise<string>} - Combined markdown for those domains
 */
export async function getBrainContext(userId, domains) {
  const { data } = await supabase
    .from('creator_brain')
    .select('facts')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data?.facts) return ''
  return generateContextPrompt(data.facts, domains)
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Update one or more brain fields with merge logic.
 * Auto-creates the brain row if it doesn't exist.
 * Uses optimistic retry to mitigate read-then-write race conditions.
 *
 * @param {string} userId
 * @param {object} fields - { "domain.key": { value, confidence?, source?, sourceIdentifier?, evidence? } }
 * @returns {Promise<{ diff, error }>}
 *
 * Example:
 *   await updateBrainFields(userId, {
 *     'identity.scope_position': { value: 'stream', confidence: 'high', source: 'flow', evidence: 'Selected in Scope Map' },
 *     'identity.creator_archetype': { value: 'workshop', confidence: 'high', source: 'flow' },
 *   })
 */
export async function updateBrainFields(userId, fields, _retries = 2) {
  // Read current brain (or empty)
  const { data: existing } = await supabase
    .from('creator_brain')
    .select('facts, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  const currentFacts = existing?.facts || {}
  const readTimestamp = existing?.updated_at || null

  // Merge
  const { facts: updatedFacts, diff } = mergeBatch(currentFacts, fields)

  // Regenerate markdown from updated sidecar
  const markdown = regenerateAllMarkdown(updatedFacts)

  // Upsert
  const row = {
    user_id: userId,
    facts: updatedFacts,
    ...markdown,
  }

  // If row existed, check it hasn't been modified since we read it
  if (readTimestamp) {
    const { data: check } = await supabase
      .from('creator_brain')
      .select('updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (check?.updated_at && check.updated_at !== readTimestamp && _retries > 0) {
      // Row changed between our read and write — retry with fresh data
      console.warn('[CreatorBrain] Stale read detected, retrying merge')
      return updateBrainFields(userId, fields, _retries - 1)
    }
  }

  const { error } = await supabase
    .from('creator_brain')
    .upsert(row, { onConflict: 'user_id' })

  if (error) {
    console.error('updateBrainFields error:', error)
    return { diff: null, error }
  }

  return { diff, error: null }
}

/**
 * Update a single brain field. Convenience wrapper around updateBrainFields.
 *
 * @param {string} userId
 * @param {string} fieldKey - e.g., 'identity.scope_position'
 * @param {object} fieldData - { value, confidence?, source?, sourceIdentifier?, evidence? }
 */
export async function updateBrainField(userId, fieldKey, fieldData) {
  return updateBrainFields(userId, { [fieldKey]: fieldData })
}

/**
 * User confirms a proposed field (Brain Review UI).
 * Sets state to "confirmed", source to "user". Clears conflicts.
 *
 * @param {string} userId
 * @param {string} fieldKey
 * @param {*} value - New value (or existing value if just confirming)
 */
export async function confirmBrainField(userId, fieldKey, value) {
  const { data } = await supabase
    .from('creator_brain')
    .select('facts')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data?.facts) return { error: { message: 'No brain found' } }

  const facts = { ...data.facts }
  const existing = facts[fieldKey]

  facts[fieldKey] = {
    ...(existing || {}),
    value,
    confidence: 'confirmed',
    state: 'confirmed',
    source: 'user',
    has_conflict: false,
    conflicts: [],
    updated_at: new Date().toISOString(),
  }

  const markdown = regenerateAllMarkdown(facts)

  const { error } = await supabase
    .from('creator_brain')
    .upsert({ user_id: userId, facts, ...markdown }, { onConflict: 'user_id' })

  return { error: error || null }
}

/**
 * User skips a proposed field (Brain Review UI).
 * Sets state to "skipped". Preserves value but marks as intentionally ignored.
 *
 * @param {string} userId
 * @param {string} fieldKey
 */
export async function skipBrainField(userId, fieldKey) {
  const { data } = await supabase
    .from('creator_brain')
    .select('facts')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data?.facts) return { error: { message: 'No brain found' } }

  const facts = { ...data.facts }
  const existing = facts[fieldKey]

  facts[fieldKey] = {
    ...(existing || {}),
    state: 'skipped',
    has_conflict: false,
    conflicts: [],
    updated_at: new Date().toISOString(),
  }

  const markdown = regenerateAllMarkdown(facts)

  const { error } = await supabase
    .from('creator_brain')
    .upsert({ user_id: userId, facts, ...markdown }, { onConflict: 'user_id' })

  return { error: error || null }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyMarkdown() {
  const md = {}
  for (const d of DOMAINS) md[`${d}_md`] = ''
  return md
}

/**
 * Get brain stats (field counts by state, domain coverage).
 * Useful for the Brain Review UI and dashboard widgets.
 */
export async function getBrainStats(userId) {
  const { data } = await supabase
    .from('creator_brain')
    .select('facts, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  const totalCanonical = CANONICAL_FIELDS.length

  if (!data?.facts) {
    return { total: 0, confirmed: 0, proposed: 0, skipped: 0, empty: totalCanonical, conflicts: 0, domains: {}, updatedAt: null }
  }

  const facts = data.facts
  let confirmed = 0, proposed = 0, skipped = 0, conflicts = 0
  const domains = {}

  for (const [key, field] of Object.entries(facts)) {
    const domain = key.split('.')[0]
    if (!domains[domain]) domains[domain] = { confirmed: 0, proposed: 0, skipped: 0, total: 0 }
    domains[domain].total++

    if (field.state === 'confirmed') { confirmed++; domains[domain].confirmed++ }
    else if (field.state === 'proposed') { proposed++; domains[domain].proposed++ }
    else if (field.state === 'skipped') { skipped++; domains[domain].skipped++ }

    if (field.has_conflict) conflicts++
  }

  const total = confirmed + proposed + skipped
  const empty = totalCanonical - total

  return { total, confirmed, proposed, skipped, empty, conflicts, domains, updatedAt: data.updated_at }
}
