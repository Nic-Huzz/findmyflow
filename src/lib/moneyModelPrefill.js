/**
 * moneyModelPrefill.js - Cross-flow answer pre-fill for Money Model assessments
 *
 * When a user completes one Money Model flow (e.g., Attraction Offer), overlapping
 * questions in other flows (e.g., Continuity) are pre-filled from the previous answers.
 *
 * Only unambiguous 1:1 value mappings are included. Ambiguous mappings (bucket
 * boundaries don't align, qualitative↔quantitative) are deliberately excluded.
 */

import { supabase } from './supabaseClient'

// Maps flowType → Supabase table name (must match moneyModelConfigs.js dbTable values)
const FLOW_DB_TABLES = {
  attraction_offer: 'attraction_offer_assessments',
  upsell_offer: 'upsell_assessments',
  downsell_offer: 'downsell_assessments',
  continuity_offer: 'continuity_assessments'
}

/**
 * Each mapping defines a source→target value translation for one question pair.
 * Only HIGH-CONFIDENCE mappings with 1:1 value correspondence are included.
 */
const PREFILL_MAPPINGS = [
  // #1: Attraction tracking → Upsell tracking
  {
    sourceFlow: 'attraction_offer',
    sourceQuestion: 'q5_tracking',
    targetFlow: 'upsell_offer',
    targetQuestion: 'q6_customer_tracking',
    valueMap: {
      can_track_everything: 'full_tracking',
      can_track_some_things: 'partial_tracking',
      tracking_is_difficult: 'minimal_tracking',
      cannot_track_results_at_all: 'no_tracking'
    }
  },
  // #2: Upsell tracking → Attraction tracking (reverse)
  {
    sourceFlow: 'upsell_offer',
    sourceQuestion: 'q6_customer_tracking',
    targetFlow: 'attraction_offer',
    targetQuestion: 'q5_tracking',
    valueMap: {
      full_tracking: 'can_track_everything',
      partial_tracking: 'can_track_some_things',
      minimal_tracking: 'tracking_is_difficult',
      no_tracking: 'cannot_track_results_at_all'
    }
  },
  // #3: Upsell sales channel → Downsell sales process
  {
    sourceFlow: 'upsell_offer',
    sourceQuestion: 'q9_sales_channel',
    targetFlow: 'downsell_offer',
    targetQuestion: 'q9_sales_process',
    valueMap: {
      automated_funnel: 'automated_checkout',
      sales_calls: 'live_sales_calls',
      email_backend: 'email_follow_up',
      hybrid_approach: 'hybrid_both'
    }
  },
  // #4: Downsell sales process → Upsell sales channel (reverse, skip in_person)
  {
    sourceFlow: 'downsell_offer',
    sourceQuestion: 'q9_sales_process',
    targetFlow: 'upsell_offer',
    targetQuestion: 'q9_sales_channel',
    valueMap: {
      automated_checkout: 'automated_funnel',
      live_sales_calls: 'sales_calls',
      email_follow_up: 'email_backend',
      hybrid_both: 'hybrid_approach'
    }
  },
  // #5: Attraction business model → Continuity business model
  {
    sourceFlow: 'attraction_offer',
    sourceQuestion: 'q1_business_model',
    targetFlow: 'continuity_offer',
    targetQuestion: 'q1_business_model',
    valueMap: {
      saas_software: 'saas_software',
      coaching_consulting: 'coaching_consulting',
      digital_product: 'digital_products_content',
      physical_product: 'physical_consumables',
      agency: 'service_based',
      hybrid: 'hybrid_product_service'
    }
  },
  // #6: Continuity business model → Attraction business model (reverse)
  {
    sourceFlow: 'continuity_offer',
    sourceQuestion: 'q1_business_model',
    targetFlow: 'attraction_offer',
    targetQuestion: 'q1_business_model',
    valueMap: {
      saas_software: 'saas_software',
      coaching_consulting: 'coaching_consulting',
      digital_products_content: 'digital_product',
      physical_consumables: 'physical_product',
      service_based: 'agency',
      hybrid_product_service: 'hybrid'
    }
  },
  // #7: Continuity avg transaction → Downsell price point (skip 2000_to_10000)
  {
    sourceFlow: 'continuity_offer',
    sourceQuestion: 'q8_average_transaction_value',
    targetFlow: 'downsell_offer',
    targetQuestion: 'q2_price_point',
    valueMap: {
      under_100: 'under_100',
      '100_to_500': '100_to_500',
      '500_to_2000': '500_to_2000',
      over_10000: 'over_10000'
    }
  },
  // #8: Downsell price point → Continuity avg transaction (skip 2000_to_5000, 5000_to_10000)
  {
    sourceFlow: 'downsell_offer',
    sourceQuestion: 'q2_price_point',
    targetFlow: 'continuity_offer',
    targetQuestion: 'q8_average_transaction_value',
    valueMap: {
      under_100: 'under_100',
      '100_to_500': '100_to_500',
      '500_to_2000': '500_to_2000',
      over_10000: 'over_10000'
    }
  },
  // #9: Downsell cancellation rate → Continuity customer retention (skip dont_track)
  {
    sourceFlow: 'downsell_offer',
    sourceQuestion: 'q7_cancellation_rate',
    targetFlow: 'continuity_offer',
    targetQuestion: 'q7_customer_retention',
    valueMap: {
      under_5_percent: 'high_retention_low_churn',
      '5_to_15_percent': 'moderate_retention',
      '15_to_30_percent': 'high_churn_problem',
      over_30_percent: 'high_churn_problem'
    }
  },
  // #10: Continuity customer retention → Downsell cancellation rate (skip no_repeat_customers, just_starting_no_data)
  {
    sourceFlow: 'continuity_offer',
    sourceQuestion: 'q7_customer_retention',
    targetFlow: 'downsell_offer',
    targetQuestion: 'q7_cancellation_rate',
    valueMap: {
      high_retention_low_churn: 'under_5_percent',
      moderate_retention: '5_to_15_percent',
      high_churn_problem: '15_to_30_percent'
    }
  },
  // #11: Attraction gross margin → Continuity gross margins (only 85%+)
  {
    sourceFlow: 'attraction_offer',
    sourceQuestion: 'q2_gross_margin',
    targetFlow: 'continuity_offer',
    targetQuestion: 'q3_gross_margins',
    valueMap: {
      '85_plus_percent': 'over_70_percent'
    }
  },
  // #12: Attraction repeat purchase → Continuity repurchase frequency (only one-time)
  {
    sourceFlow: 'attraction_offer',
    sourceQuestion: 'q8_repeat_purchase',
    targetFlow: 'continuity_offer',
    targetQuestion: 'q4_repurchase_frequency',
    valueMap: {
      one_time_purchase_only: 'one_time_only'
    }
  }
]

/**
 * Load pre-fill answers from previously completed Money Model flows.
 *
 * @param {string} flowType - The current flow's type (e.g., 'continuity_offer')
 * @param {string} userId - The authenticated user's ID
 * @param {Object} questionsData - The loaded questions JSON with { questions: [...] }
 * @returns {Object} Map of questionId → { value, label } for pre-fillable answers
 */
export async function loadPrefillAnswers(flowType, userId, questionsData) {
  if (!flowType || !userId || !questionsData?.questions) return {}

  // Only prefill for the 4 Money Model flows
  if (!FLOW_DB_TABLES[flowType]) return {}

  // Filter mappings where this flow is the target
  const relevantMappings = PREFILL_MAPPINGS.filter(m => m.targetFlow === flowType)
  if (relevantMappings.length === 0) return {}

  // Group by sourceFlow to batch DB queries
  const bySourceFlow = {}
  for (const mapping of relevantMappings) {
    if (!bySourceFlow[mapping.sourceFlow]) {
      bySourceFlow[mapping.sourceFlow] = []
    }
    bySourceFlow[mapping.sourceFlow].push(mapping)
  }

  const result = {}

  // Query each source flow's most recent assessment
  for (const [sourceFlow, mappings] of Object.entries(bySourceFlow)) {
    const table = FLOW_DB_TABLES[sourceFlow]
    if (!table) continue

    const { data, error } = await supabase
      .from(table)
      .select('responses')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data?.responses) continue

    // Process each mapping from this source flow
    for (const mapping of mappings) {
      // Don't overwrite if we already have a value for this target question
      if (result[mapping.targetQuestion]) continue

      const sourceAnswer = data.responses[mapping.sourceQuestion]?.value
      if (!sourceAnswer) continue

      const mappedValue = mapping.valueMap[sourceAnswer]
      if (!mappedValue) continue

      // Look up the target label from questionsData
      const targetQuestion = questionsData.questions.find(q => q.id === mapping.targetQuestion)
      if (!targetQuestion) continue

      const targetOption = targetQuestion.options.find(o => o.value === mappedValue)
      if (!targetOption) continue

      result[mapping.targetQuestion] = {
        value: mappedValue,
        label: targetOption.label
      }
    }
  }

  return result
}
