/**
 * Nikigai Tag Extraction Service
 *
 * Extracts tags from user responses using Claude API via Supabase Edge Function
 *
 * Reference: docs/nikigai-auto-tagging-schema.md
 * Reference: docs/nikigai-tag-ambiguity-decision-tree.md
 */

import { supabase } from './supabaseClient.js'

/**
 * Extract tags from a user response
 * Calls Supabase Edge Function which proxies to Claude API
 */
export async function extractTags(userResponse, context = {}) {
  if (!userResponse || userResponse.trim().length === 0) {
    return {
      skill_verb: [],
      domain_topic: [],
      value: [],
      emotion: [],
      context: [],
      problem_theme: [],
      persona_hint: []
    }
  }

  try {
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('extract-nikigai-tags', {
      body: {
        response: userResponse,
        context: context
      }
    })

    if (error) {
      console.error('Error calling extract-nikigai-tags function:', error)
      throw error
    }

    return data.tags
  } catch (error) {
    console.error('Tag extraction failed:', error)

    // Fallback to rule-based extraction
    console.warn('Falling back to rule-based tag extraction')
    return ruleBasedTagExtraction(userResponse)
  }
}

/**
 * Fallback: Simple rule-based tag extraction
 * Used when AI extraction fails
 */
function ruleBasedTagExtraction(text) {
  const lowerText = text.toLowerCase()

  // Common skill verbs
  const skillVerbs = [
    'designing', 'building', 'creating', 'teaching', 'writing',
    'analyzing', 'managing', 'leading', 'coaching', 'facilitating',
    'organizing', 'planning', 'developing', 'researching', 'presenting'
  ]

  // Common domains
  const domains = [
    'tech', 'technology', 'education', 'health', 'healthcare',
    'art', 'design', 'business', 'marketing', 'finance',
    'music', 'writing', 'psychology', 'coaching', 'consulting'
  ]

  // Common values
  const values = [
    'growth', 'impact', 'creativity', 'connection', 'authenticity',
    'purpose', 'learning', 'community', 'innovation', 'service'
  ]

  const extracted = {
    skill_verb: skillVerbs.filter(v => lowerText.includes(v)),
    domain_topic: domains.filter(d => lowerText.includes(d)),
    value: values.filter(v => lowerText.includes(v)),
    emotion: [],
    context: [],
    problem_theme: [],
    persona_hint: []
  }

  return extracted
}

/**
 * Extract tags from multiple responses in batch
 */
export async function extractTagsBatch(responses) {
  const results = await Promise.all(
    responses.map(async (response) => {
      const tags = await extractTags(response.response_raw, {
        step_id: response.step_id,
        store_as: response.store_as
      })

      return {
        ...response,
        tags_extracted: tags
      }
    })
  )

  return results
}

/**
 * Validate extracted tags
 * Checks for common mistakes
 */
export function validateTagExtraction(response, extractedTags) {
  const issues = []
  const responseLength = response.length
  const totalTags = Object.values(extractedTags).flat().length

  // Check if extraction is suspiciously sparse
  if (responseLength > 100 && totalTags < 3) {
    issues.push({
      issue: 'sparse_extraction',
      severity: 'high',
      message: 'User provided detailed response but few tags extracted'
    })
  }

  // Check if extraction is suspiciously dense
  if (responseLength < 50 && totalTags > 10) {
    issues.push({
      issue: 'over_extraction',
      severity: 'medium',
      message: 'Short response but many tags extracted'
    })
  }

  // Check for empty extraction
  if (totalTags === 0) {
    issues.push({
      issue: 'no_tags_extracted',
      severity: 'critical',
      message: 'No tags extracted from response'
    })
  }

  // Check for noun forms in skill_verb (should be -ing form)
  const commonValues = ['creativity', 'leadership', 'empathy', 'integrity']
  extractedTags.skill_verb?.forEach(tag => {
    if (commonValues.includes(tag.toLowerCase())) {
      issues.push({
        tag,
        category: 'skill_verb',
        issue: 'value_in_skill_verb',
        severity: 'medium',
        suggestion: `"${tag}" should likely be in 'value' category`
      })
    }
  })

  return {
    isValid: issues.filter(i => i.severity === 'critical').length === 0,
    totalTags,
    issues,
    message: issues.length === 0
      ? `Extracted ${totalTags} tags successfully`
      : `Extraction concerns: ${issues.map(i => i.message).join('; ')}`
  }
}

/**
 * Save extracted tags to Supabase
 */
export async function saveExtractedTags(responseId, tags) {
  const { data, error } = await supabase
    .from('nikigai_responses')
    .update({
      tags_extracted: tags,
      updated_at: new Date().toISOString()
    })
    .eq('id', responseId)
    .select()

  if (error) {
    console.error('Error saving extracted tags:', error)
    throw error
  }

  return data
}

/**
 * Get decision tree prompt for tag extraction
 * This is sent to Claude to help with categorization
 */
export function getDecisionTreePrompt() {
  return `
DECISION RULES FOR TAG CATEGORIZATION:

1. skill_verb — Actions/abilities (use -ing form: designing, teaching, building)
2. domain_topic — Fields/subjects (UX, education, psychology, healthcare)
3. value — Principles/beliefs (integrity, growth, connection, purpose)
4. emotion — Feeling words (joy, fear, excitement, frustration)
5. context — Situations/environments (remote work, team settings, startup)
6. problem_theme — Challenges/pain points (burnout, disconnection, inequality)
7. persona_hint — Specific groups (parents, creatives, mid-career professionals)

KEY DISAMBIGUATION RULES:

- ACTION vs PRINCIPLE: If it describes DOING → skill_verb; if GUIDING PRINCIPLE → value
  Example: "creating" → skill_verb | "creativity" → value

- FEELING vs PROBLEM: If temporary EMOTION → emotion; if recurring CHALLENGE → problem_theme
  Example: "frustrated" → emotion | "workplace frustration" → problem_theme

- TOPIC vs SKILL: If FIELD/SUBJECT → domain_topic; if ACTION → skill_verb
  Example: "design" (field) → domain_topic | "designing" (action) → skill_verb

- WHO vs VALUE: If SPECIFIC GROUP → persona_hint; if GENERAL PRINCIPLE → value
  Example: "parents in transition" → persona_hint | "helping others" → value

EXAMPLES:
- "I love teaching kids coding" → skill_verb: [teaching], domain_topic: [coding, education], persona_hint: [kids]
- "Creativity is important to me" → value: [creativity]
- "I help burned-out professionals find purpose" → persona_hint: [burned-out professionals], problem_theme: [burnout, lack of purpose]
- "Building inclusive team cultures" → skill_verb: [building], value: [inclusion], context: [team settings]

When in doubt, assign to multiple categories if appropriate.
`
}
