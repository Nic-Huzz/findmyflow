/**
 * Email Personalization Utilities
 *
 * Handles personalization token extraction and email subject line generation.
 *
 * NOTE: All email copy templates need review before going live.
 */

// ============================================
// SUBJECT LINE TEMPLATES (NEEDS REVIEW)
// ============================================

export const SUBJECT_TEMPLATES = {
  // Money Model Sequence
  money_model: {
    day_0: "{{name}}, your {{offer_type}} strategy is ready",
    day_1: "The hidden reason {{offer_type}} feels hard (it's not what you think)",
    day_3: "How {{offer_type}} creators are earning {{income_range}} without burnout",
    day_5: "{{name}}, the missing piece in your {{offer_type}} strategy",
    day_7: "Your personalized roadmap is waiting, {{name}}"
  },

  // Nervous System Sequence
  nervous_system: {
    day_0: "{{name}}, your {{archetype}} pattern revealed",
    day_1: "Why knowing your pattern isn't enough (and what to do instead)",
    day_3: "How {{archetype}}s break through their {{edge_type}} edge",
    day_5: "The business strategy that matches your nervous system",
    day_7: "Ready to expand beyond {{edge_earning}}/year, {{name}}?"
  }
}

// ============================================
// TOKEN EXTRACTION
// ============================================

/**
 * Extract personalization tokens from Money Model flow
 */
export function extractMoneyModelTokens(email, flowType, answers, recommendedOffer) {
  // Try to extract name from email (before @)
  const emailName = email?.split('@')[0] || ''
  const formattedName = emailName
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  // Map flow type to friendly name
  const offerTypeMap = {
    'attraction_offer': 'Attraction Offer',
    'upsell': 'Upsell',
    'downsell': 'Downsell',
    'continuity': 'Continuity',
    'leads_strategy': 'Lead Generation',
    'lead_magnet': 'Lead Magnet'
  }

  // Extract key strengths from answers
  const strengths = []
  if (answers) {
    Object.entries(answers).forEach(([key, value]) => {
      if (value?.label && (key.includes('strength') || key.includes('best'))) {
        strengths.push(value.label)
      }
    })
  }

  return {
    name: formattedName || 'there',
    email: email,
    offer_type: offerTypeMap[flowType] || flowType,
    recommended_offer: recommendedOffer?.offer?.name || 'your offer',
    confidence: recommendedOffer?.confidence
      ? Math.round(recommendedOffer.confidence * 100)
      : null,
    key_strengths: strengths.slice(0, 3),
    income_range: '$5K-20K/month', // Default, could be dynamic
    flow_completed_at: new Date().toISOString()
  }
}

/**
 * Extract personalization tokens from Nervous System flow
 */
export function extractNervousSystemTokens(email, responses, reflection) {
  // Try to extract name from email
  const emailName = email?.split('@')[0] || ''
  const formattedName = emailName
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  // Format edges
  const formatMoney = (num) => {
    if (!num) return '$100K'
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
    return `$${num}`
  }

  const formatPeople = (num) => {
    if (!num) return '1,000'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }

  // Determine which edge is more limiting
  const visibilityGap = responses?.impact_goal
    ? (parseInt(responses.impact_goal.replace(/[^0-9]/g, '')) - (responses.being_seen_edge || 0))
    : 0
  const earningGap = responses?.income_goal
    ? (parseInt(responses.income_goal.replace(/[^0-9]/g, '')) - (responses.earning_edge || 0))
    : 0

  const edgeType = visibilityGap > earningGap ? 'visibility' : 'earning'

  // Get active safety contracts
  const activeContracts = responses?.contracts_tested
    ? Object.entries(responses.contracts_tested)
        .filter(([_, response]) => response === 'yes')
        .map(([contract]) => contract)
    : []

  return {
    name: formattedName || 'there',
    email: email,
    archetype: reflection?.archetype_name || 'Protective Pattern',
    archetype_description: reflection?.archetype_description || '',
    edge_visibility: formatPeople(responses?.being_seen_edge),
    edge_earning: formatMoney(responses?.earning_edge),
    edge_type: edgeType,
    core_fear: reflection?.core_fear || '',
    active_contracts: activeContracts.slice(0, 3),
    impact_goal: responses?.impact_goal || '',
    income_goal: responses?.income_goal || '',
    flow_completed_at: new Date().toISOString()
  }
}

// ============================================
// SUBJECT LINE GENERATION
// ============================================

/**
 * Generate personalized email subject line
 * @param {string} sequenceType - 'money_model' or 'nervous_system'
 * @param {string} emailKey - 'day_0', 'day_1', etc.
 * @param {object} tokens - Personalization tokens
 */
export function generateEmailSubject(sequenceType, emailKey, tokens) {
  const template = SUBJECT_TEMPLATES[sequenceType]?.[emailKey]
  if (!template) return 'Your FindMyFlow results'

  // Replace tokens in template
  let subject = template
  Object.entries(tokens).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    if (typeof value === 'string') {
      subject = subject.replace(new RegExp(placeholder, 'g'), value)
    }
  })

  // Clean up any unreplaced tokens
  subject = subject.replace(/\{\{[^}]+\}\}/g, '')

  return subject
}

/**
 * Generate all subject lines for a sequence (for preview/review)
 */
export function generateAllSubjectLines(sequenceType, tokens) {
  const templates = SUBJECT_TEMPLATES[sequenceType]
  if (!templates) return {}

  const subjects = {}
  Object.keys(templates).forEach(emailKey => {
    subjects[emailKey] = generateEmailSubject(sequenceType, emailKey, tokens)
  })

  return subjects
}
