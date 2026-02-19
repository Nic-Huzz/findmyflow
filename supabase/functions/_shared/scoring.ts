// supabase/functions/_shared/scoring.ts
// Shared scoring engine — single source of truth for agent-submit and mcp-server.
// Also used by src/lib/scoring.js (web app) — keep logic in sync.

export interface OfferScore {
  offer: any
  totalScore: number
  maxPossibleScore: number
  confidence: number
  isDisqualified: boolean
  disqualificationReasons: string[]
}

export function calculateOfferScores(
  userAnswers: Record<string, string | { value: string; label?: string }>,
  offersData: any[]
): OfferScore[] {
  if (!offersData) return []

  const scores = offersData.map((offer) => {
    let totalScore = 0
    const maxPossibleScore = offer.max_possible_score || 30

    Object.entries(userAnswers).forEach(([questionId, answer]) => {
      const normalizedQuestionId = questionId.replace(/^q(\d+)/, 'Q$1')
      const weights = offer.scoring_weights?.[normalizedQuestionId]
      const answerValue = typeof answer === 'string' ? answer : answer.value
      if (weights && weights[answerValue] !== undefined) {
        totalScore += weights[answerValue]
      }
    })

    let isDisqualified = false
    const disqualificationReasons: string[] = []
    const disqualifiers =
      offer.hard_disqualifiers || offer.eligibility_rules?.hard_disqualifiers || []
    if (disqualifiers.length > 0) {
      disqualifiers.forEach((rule: any) => {
        const fieldName = rule.field.toLowerCase()
        const matchingKey = Object.keys(userAnswers).find((key) =>
          key.endsWith('_' + fieldName)
        )
        const fieldAnswer = matchingKey ? userAnswers[matchingKey] : null
        const fieldValue = fieldAnswer
          ? typeof fieldAnswer === 'string'
            ? fieldAnswer
            : fieldAnswer.value
          : null
        if (fieldValue && rule.disallowed.includes(fieldValue)) {
          isDisqualified = true
          disqualificationReasons.push(
            rule.reason || `Disqualified due to ${rule.field}`
          )
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
      disqualificationReasons,
    }
  })

  return scores.sort((a, b) => {
    if (a.isDisqualified && !b.isDisqualified) return 1
    if (!a.isDisqualified && b.isDisqualified) return -1
    return b.totalScore - a.totalScore
  })
}
