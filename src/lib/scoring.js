/**
 * Shared scoring engine for Money Model assessments.
 *
 * Used by:
 * - MoneyModelFlowBase.jsx (web UI)
 * - agent-submit Edge Function (agent API)
 *
 * Extracted to keep scoring logic in one place.
 */

/**
 * Calculate offer scores from user answers against offer scoring weights.
 *
 * @param {Object} userAnswers - Map of questionId → { value, label } or questionId → string
 * @param {Array} offersData - Array of offer objects with scoring_weights, hard_disqualifiers, etc.
 * @returns {Array} Sorted array of { offer, totalScore, maxPossibleScore, confidence, isDisqualified, disqualificationReasons }
 */
export function calculateOfferScores(userAnswers, offersData) {
  if (!offersData) return []

  const scores = offersData.map(offer => {
    let totalScore = 0
    const maxPossibleScore = offer.max_possible_score || 30

    Object.entries(userAnswers).forEach(([questionId, answer]) => {
      const normalizedQuestionId = questionId.replace(/^q(\d+)/, 'Q$1')
      const weights = offer.scoring_weights?.[normalizedQuestionId]
      // Support both { value } objects and plain string answers
      const answerValue = typeof answer === 'string' ? answer : answer.value
      if (weights && weights[answerValue] !== undefined) {
        totalScore += weights[answerValue]
      }
    })

    let isDisqualified = false
    let disqualificationReasons = []
    const disqualifiers = offer.hard_disqualifiers || offer.eligibility_rules?.hard_disqualifiers || []
    if (disqualifiers.length > 0) {
      disqualifiers.forEach(rule => {
        const fieldName = rule.field.toLowerCase()
        const matchingKey = Object.keys(userAnswers).find(key =>
          key.endsWith('_' + fieldName)
        )
        const fieldAnswer = matchingKey ? userAnswers[matchingKey] : null
        const fieldValue = fieldAnswer
          ? (typeof fieldAnswer === 'string' ? fieldAnswer : fieldAnswer.value)
          : null
        if (fieldValue && rule.disallowed.includes(fieldValue)) {
          isDisqualified = true
          disqualificationReasons.push(rule.reason || `Disqualified due to ${rule.field}`)
        }
      })
    }

    const confidence = totalScore / maxPossibleScore

    return {
      offer,
      totalScore,
      maxPossibleScore,
      confidence,
      isDisqualified,
      disqualificationReasons
    }
  })

  return scores.sort((a, b) => {
    if (a.isDisqualified && !b.isDisqualified) return 1
    if (!a.isDisqualified && b.isDisqualified) return -1
    return b.confidence - a.confidence
  })
}
