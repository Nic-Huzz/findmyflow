/**
 * regenerateMarkdown.js — Generate markdown from brain sidecar
 *
 * Converts the facts JSONB sidecar into 6 human-readable markdown files.
 * These markdown strings are what AI features consume (Zarlo, Content Generator, L3 ops).
 *
 * Rules:
 * - Skip fields with state "empty"
 * - Group by section within each domain
 * - Include metadata footer (state, confidence, source) for transparency
 * - Arrays render as comma-separated or bulleted lists
 * - Objects render as key: value pairs
 */

import { DOMAINS, getFieldsForDomain, getSectionsForDomain, DOMAIN_LABELS } from './canonicalFields'

// ─── Value Formatters ────────────────────────────────────────────────────────

function formatValue(value, type) {
  if (value === null || value === undefined) return '_not set_'

  if (type === 'array') {
    if (!Array.isArray(value)) return String(value)
    if (value.length === 0) return '_none_'
    // If items are simple strings, comma-separate. Otherwise bullet list.
    if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return value.join(', ')
    }
    return value.map(v => `- ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')
  }

  if (type === 'object') {
    if (typeof value !== 'object') return String(value)
    return Object.entries(value)
      .map(([k, v]) => `- **${k}**: ${v}`)
      .join('\n')
  }

  if (type === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (type === 'number') {
    return String(value)
  }

  return String(value)
}

// stateEmoji removed — was dead code and used an em dash (violates project rule)

function metadataLine(field) {
  const parts = []
  if (field.state && field.state !== 'empty') parts.push(field.state)
  if (field.confidence) parts.push(field.confidence)
  if (field.source) parts.push(`via ${field.source}`)
  if (field.has_conflict) parts.push('\u26a0 conflict')
  return parts.length > 0 ? `_${parts.join(' \u00b7 ')}_` : ''
}

// ─── Domain Markdown Generator ───────────────────────────────────────────────

function generateDomainMarkdown(domain, facts) {
  const fields = getFieldsForDomain(domain)
  const sections = getSectionsForDomain(domain)
  const domainLabel = DOMAIN_LABELS[domain] || domain

  // Check if any fields have data before generating
  const hasAnyData = fields.some(f => {
    const fact = facts[f.key]
    return fact && fact.state !== 'empty' && fact.value !== null && fact.value !== undefined
  })
  if (!hasAnyData) return ''

  const lines = [`# ${domainLabel}`, '']

  for (const section of sections) {
    const sectionFields = fields.filter(f => f.section === section)
    const activeFields = sectionFields.filter(f => {
      const fact = facts[f.key]
      return fact && fact.state !== 'empty' && fact.value !== null && fact.value !== undefined
    })

    if (activeFields.length === 0) continue

    lines.push(`## ${section}`, '')

    for (const fieldDef of activeFields) {
      const fact = facts[fieldDef.key]
      const formatted = formatValue(fact.value, fieldDef.type)
      const meta = metadataLine(fact)

      // Multi-line values (arrays, objects) get their own block
      if (formatted.includes('\n')) {
        lines.push(`**${fieldDef.label}:**`)
        lines.push(formatted)
        if (meta) lines.push(meta)
        lines.push('')
      } else {
        lines.push(`**${fieldDef.label}:** ${formatted}`)
        if (meta) lines.push(meta)
        lines.push('')
      }
    }
  }

  return lines.join('\n').trim()
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Regenerate all 6 markdown files from the facts sidecar.
 *
 * @param {object} facts - The brain sidecar { "domain.key" → BrainField }
 * @returns {object} - { identity_md, offer_md, audience_md, voice_md, inner_game_md, performance_md }
 */
export function regenerateAllMarkdown(facts) {
  const result = {}
  for (const domain of DOMAINS) {
    result[`${domain}_md`] = generateDomainMarkdown(domain, facts)
  }
  return result
}

/**
 * Regenerate markdown for a single domain.
 *
 * @param {string} domain - Domain name (e.g., 'identity')
 * @param {object} facts - The brain sidecar
 * @returns {string} - Markdown string for that domain
 */
export function regenerateDomainMarkdown(domain, facts) {
  return generateDomainMarkdown(domain, facts)
}

/**
 * Generate a combined context string for AI prompt injection.
 * Includes all non-empty domains, separated by horizontal rules.
 *
 * @param {object} facts - The brain sidecar
 * @param {string[]} domains - Which domains to include (default: all)
 * @returns {string} - Combined markdown for AI consumption
 */
export function generateContextPrompt(facts, domains = DOMAINS) {
  return domains
    .map(d => generateDomainMarkdown(d, facts))
    .filter(md => md !== '') // skip empty domains
    .join('\n\n---\n\n')
}
