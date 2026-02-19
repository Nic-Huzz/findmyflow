import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Flow config — mirrors moneyModelConfigs.js
// Maps flow_id → offers URL path, DB table, and column name overrides
const FLOW_CONFIG: Record<string, {
  offersPath: string
  dbTable: string
  dbColumns: { recommendedId: string; recommendedName: string; allScores: string }
}> = {
  attraction_offer: {
    offersPath: '/Money Model/Attraction/offers.json',
    dbTable: 'attraction_offer_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
  },
  upsell_offer: {
    offersPath: '/Money Model/Upsell/offers.json',
    dbTable: 'upsell_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
  },
  downsell_offer: {
    offersPath: '/Money Model/Downsell/offers.json',
    dbTable: 'downsell_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
  },
  continuity_offer: {
    offersPath: '/Money Model/Continuity/offers.json',
    dbTable: 'continuity_assessments',
    dbColumns: { recommendedId: 'recommended_offer_id', recommendedName: 'recommended_offer_name', allScores: 'all_offer_scores' },
  },
  leads_strategy: {
    offersPath: '/leads-strategy-offers.json',
    dbTable: 'leads_assessments',
    dbColumns: { recommendedId: 'recommended_strategy_id', recommendedName: 'recommended_strategy_name', allScores: 'all_strategy_scores' },
  },
  lead_magnet_offer: {
    offersPath: '/lead-magnet-offers.json',
    dbTable: 'lead_magnet_assessments',
    dbColumns: { recommendedId: 'recommended_type_id', recommendedName: 'recommended_type_name', allScores: 'all_type_scores' },
  },
}

const VALID_FLOW_IDS = Object.keys(FLOW_CONFIG)

// --- Scoring engine (port of src/lib/scoring.js) ---
// IMPORTANT: This logic is duplicated from src/lib/scoring.js for Deno compatibility.
// Any changes to the scoring algorithm must be mirrored in both files.

interface OfferScore {
  offer: any
  totalScore: number
  maxPossibleScore: number
  confidence: number
  isDisqualified: boolean
  disqualificationReasons: string[]
}

function calculateOfferScores(
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

// --- Main handler ---

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header. Expected: Bearer <api_key>' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const apiKey = authHeader.replace('Bearer ', '')

    // 2. Validate API key format
    if (!apiKey.startsWith('fmf_k1_') || apiKey.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key format. Keys start with fmf_k1_' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Hash the key and look it up
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: keyRow, error: keyError } = await supabase
      .from('agent_api_keys')
      .select('id, user_id, permissions, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (keyError || !keyRow) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!keyRow.is_active) {
      return new Response(
        JSON.stringify({ error: 'API key has been revoked' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last_used_at (fire-and-forget, log errors)
    supabase
      .from('agent_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRow.id)
      .then(({ error: updateErr }) => {
        if (updateErr) console.warn('last_used_at update failed:', updateErr.message)
      })

    // 4. Parse request body
    const body = await req.json()
    const { flow_id, answers, reasoning } = body

    if (!flow_id || !answers) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: flow_id, answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Validate flow_id
    if (!VALID_FLOW_IDS.includes(flow_id)) {
      return new Response(
        JSON.stringify({
          error: `Invalid flow_id. Must be one of: ${VALID_FLOW_IDS.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Check permissions
    const allowedFlows = keyRow.permissions?.flows || VALID_FLOW_IDS
    if (!allowedFlows.includes(flow_id)) {
      return new Response(
        JSON.stringify({ error: `API key does not have permission for flow: ${flow_id}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Validate answers — each flow has exactly 10 questions
    const answerKeys = Object.keys(answers)
    if (answerKeys.length !== 10) {
      return new Response(
        JSON.stringify({ error: `answers must contain exactly 10 question responses, got ${answerKeys.length}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Fetch offers JSON from the app
    const flowConfig = FLOW_CONFIG[flow_id]
    const siteUrl = Deno.env.get('SITE_URL') || 'https://findmyflow.nichuzz.com'
    const encodedPath = flowConfig.offersPath.split('/').map(encodeURIComponent).join('/')
    const offersUrl = `${siteUrl}${encodedPath}`

    const offersResponse = await fetch(offersUrl)
    if (!offersResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to load scoring data for ${flow_id}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const offersData = await offersResponse.json()

    // 9. Normalize answers — accept both plain strings and { value, label } objects
    const normalizedAnswers: Record<string, string> = {}
    for (const [key, val] of Object.entries(answers)) {
      normalizedAnswers[key] =
        typeof val === 'string' ? val : (val as any)?.value ?? String(val)
    }

    // 10. Run scoring engine
    const scores = calculateOfferScores(normalizedAnswers, offersData)
    const topOffer = scores.find((s) => !s.isDisqualified) || scores[0]

    if (!topOffer) {
      return new Response(
        JSON.stringify({ error: 'Scoring produced no results. Check your answers.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 11. Get user info for the insert
    const { data: userData } = await supabase.auth.admin.getUserById(keyRow.user_id)
    const user = userData?.user

    // 12. Build insert data — mirrors MoneyModelFlowBase.jsx handleSaveResults
    const sessionId = crypto.randomUUID()
    const columns = flowConfig.dbColumns

    const insertData: Record<string, any> = {
      session_id: sessionId,
      user_id: keyRow.user_id,
      user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agent User',
      email: user?.email || null,
      responses: normalizedAnswers,
      [columns.recommendedId]: topOffer.offer.id,
      [columns.recommendedName]: topOffer.offer.name,
      confidence_score: topOffer.confidence,
      total_score: topOffer.totalScore,
      [columns.allScores]: scores.map((s) => ({
        id: s.offer.id,
        name: s.offer.name,
        score: s.totalScore,
        confidence: s.confidence,
        disqualified: s.isDisqualified,
      })),
      submitted_via: 'agent_api',
      agent_reasoning: reasoning || null,
    }

    const { error: insertError } = await supabase
      .from(flowConfig.dbTable)
      .insert([insertData])

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save assessment results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 13. Return scored results
    return new Response(
      JSON.stringify({
        success: true,
        flow_id,
        session_id: sessionId,
        recommendation: {
          id: topOffer.offer.id,
          name: topOffer.offer.name,
          description: topOffer.offer.description,
          confidence: topOffer.confidence,
          total_score: topOffer.totalScore,
          max_possible_score: topOffer.maxPossibleScore,
        },
        all_scores: scores.map((s) => ({
          id: s.offer.id,
          name: s.offer.name,
          score: s.totalScore,
          confidence: s.confidence,
          disqualified: s.isDisqualified,
          disqualification_reasons: s.disqualificationReasons,
        })),
        message: `Assessment saved. Result: ${topOffer.offer.name} (${Math.round(topOffer.confidence * 100)}% confidence). View at https://findmyflow.nichuzz.com`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('agent-submit error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
