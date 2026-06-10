/**
 * mergeBrain.js — Creator Brain merge logic
 *
 * Ported from claude-portal's mergeExtraction.ts.
 * Handles reconciliation when new data arrives for a field that already exists.
 *
 * Key rules:
 * - User decisions (confirmed/skipped) are STICKY — never overwritten
 * - When both proposed: confidence > source priority > recency
 * - Conflicts are flagged, not silently dropped
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const CONFIDENCE_RANK = {
  confirmed: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const SOURCE_PRIORITY = {
  user: 6,
  flow: 5,
  ai_inferred: 4,
  document: 3,
  website: 2,
  legacy: 1,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function confidenceRank(c) {
  return CONFIDENCE_RANK[c] || 0
}

function sourcePriority(s) {
  return SOURCE_PRIORITY[s] || 0
}

function now() {
  return new Date().toISOString()
}

// ─── Create a new BrainField ────────────────────────────────────────────────

/**
 * Create a blank BrainField
 */
export function emptyField() {
  return {
    value: null,
    confidence: null,
    state: 'empty',
    has_conflict: false,
    source: null,
    source_identifier: null,
    evidence: null,
    updated_at: now(),
    conflicts: [],
  }
}

/**
 * Create a proposed BrainField from an incoming value
 */
export function proposedField(value, { confidence = 'high', source = 'flow', sourceIdentifier = null, evidence = null } = {}) {
  return {
    value,
    confidence,
    state: 'proposed',
    has_conflict: false,
    source,
    source_identifier: sourceIdentifier,
    evidence,
    updated_at: now(),
    conflicts: [],
  }
}

// ─── Core Merge ──────────────────────────────────────────────────────────────

/**
 * Merge a single incoming value into an existing BrainField.
 *
 * @param {object|null} existing - Current BrainField (null if new)
 * @param {object} incoming - { value, confidence, source, sourceIdentifier, evidence }
 * @returns {{ field: object, action: string }} - Updated field + what happened
 *
 * Actions: 'added' | 'updated' | 'conflict' | 'unchanged' | 'preserved'
 */
export function mergeField(existing, incoming) {
  const incomingField = proposedField(incoming.value, {
    confidence: incoming.confidence || 'high',
    source: incoming.source || 'flow',
    sourceIdentifier: incoming.sourceIdentifier || null,
    evidence: incoming.evidence || null,
  })

  // Case 1: No existing field — add as proposed
  if (!existing || existing.state === 'empty') {
    return { field: incomingField, action: 'added' }
  }

  // Case 2: Existing is confirmed or skipped — sticky, record conflict if different
  if (existing.state === 'confirmed' || existing.state === 'skipped') {
    if (valuesEqual(existing.value, incoming.value)) {
      // Same value — no conflict, just note it matched
      return { field: existing, action: 'preserved' }
    }

    // Different value — record as conflict but don't overwrite
    const conflicts = [...(existing.conflicts || [])]
    conflicts.push({
      detected_at: now(),
      attempted_value: incoming.value,
      attempted_confidence: incoming.confidence || 'high',
      attempted_source: incoming.source || 'flow',
      attempted_evidence: incoming.evidence || null,
    })

    return {
      field: {
        ...existing,
        has_conflict: true,
        conflicts,
      },
      action: 'conflict',
    }
  }

  // Case 3: Existing is proposed — reconcile
  return reconcileProposed(existing, incoming)
}

/**
 * Reconcile two proposed values.
 * Winner: higher confidence > higher source priority > incoming (more recent)
 */
function reconcileProposed(existing, incoming) {
  // If values match, just refresh timestamp
  if (valuesEqual(existing.value, incoming.value)) {
    return {
      field: {
        ...existing,
        updated_at: now(),
        confidence: higherConfidence(existing.confidence, incoming.confidence || 'high'),
      },
      action: 'unchanged',
    }
  }

  const existingConfRank = confidenceRank(existing.confidence)
  const incomingConfRank = confidenceRank(incoming.confidence || 'high')

  // Higher confidence wins
  if (incomingConfRank > existingConfRank) {
    return {
      field: proposedField(incoming.value, {
        confidence: incoming.confidence || 'high',
        source: incoming.source || 'flow',
        sourceIdentifier: incoming.sourceIdentifier || null,
        evidence: incoming.evidence || null,
      }),
      action: 'updated',
    }
  }

  if (existingConfRank > incomingConfRank) {
    return { field: existing, action: 'unchanged' }
  }

  // Confidence tied — compare source priority
  const existingSrcPriority = sourcePriority(existing.source)
  const incomingSrcPriority = sourcePriority(incoming.source || 'flow')

  if (incomingSrcPriority > existingSrcPriority) {
    return {
      field: proposedField(incoming.value, {
        confidence: incoming.confidence || 'high',
        source: incoming.source || 'flow',
        sourceIdentifier: incoming.sourceIdentifier || null,
        evidence: incoming.evidence || null,
      }),
      action: 'updated',
    }
  }

  if (existingSrcPriority > incomingSrcPriority) {
    return { field: existing, action: 'unchanged' }
  }

  // Everything tied — incoming wins (more recent)
  return {
    field: proposedField(incoming.value, {
      confidence: incoming.confidence || 'high',
      source: incoming.source || 'flow',
      sourceIdentifier: incoming.sourceIdentifier || null,
      evidence: incoming.evidence || null,
    }),
    action: 'updated',
  }
}

function higherConfidence(a, b) {
  return confidenceRank(a) >= confidenceRank(b) ? a : b
}

// ─── Batch Merge ─────────────────────────────────────────────────────────────

/**
 * Merge multiple incoming fields into an existing facts sidecar.
 *
 * @param {object} existingFacts - Current sidecar { "domain.key" → BrainField }
 * @param {object} incomingFields - { "domain.key" → { value, confidence?, source?, evidence? } }
 * @returns {{ facts: object, diff: object }} - Updated sidecar + diff summary
 */
export function mergeBatch(existingFacts, incomingFields) {
  const facts = { ...existingFacts }
  const diff = { added: [], updated: [], conflicts: [], unchanged: [], preserved: [], skipped_invalid: [] }

  for (const [key, incoming] of Object.entries(incomingFields)) {
    // Skip null/undefined values
    if (incoming.value === null || incoming.value === undefined) continue

    // Validate key format (must be "domain.field_key")
    if (!key.includes('.') || key.split('.').length < 2) {
      console.warn(`[CreatorBrain] Skipping invalid key: "${key}"`)
      diff.skipped_invalid.push(key)
      continue
    }

    const existing = facts[key] || null
    const { field, action } = mergeField(existing, incoming)
    facts[key] = field
    diff[action].push(key)
  }

  return { facts, diff }
}
