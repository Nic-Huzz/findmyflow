import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { FLOW_CONFIG, VALID_FLOW_IDS } from '../_shared/flowConfig.ts'
import { calculateOfferScores } from '../_shared/scoring.ts'
import { authenticateRequest, corsHeaders, type AuthResult } from '../_shared/auth.ts'

// --- Main handler ---

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate via shared API key auth
    const authResult = await authenticateRequest(req)
    if (authResult instanceof Response) {
      return authResult
    }

    const { userId, supabase, permissions } = authResult as AuthResult

    // 2. Parse request body
    const body = await req.json()
    const { flow_id, answers, reasoning } = body

    if (!flow_id || !answers) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: flow_id, answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Validate flow_id
    if (!VALID_FLOW_IDS.includes(flow_id)) {
      return new Response(
        JSON.stringify({
          error: `Invalid flow_id. Must be one of: ${VALID_FLOW_IDS.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Check permissions
    const allowedFlows = permissions?.flows || VALID_FLOW_IDS
    if (!allowedFlows.includes(flow_id)) {
      return new Response(
        JSON.stringify({ error: `API key does not have permission for flow: ${flow_id}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Validate answers — each flow has exactly 10 questions
    const answerKeys = Object.keys(answers)
    if (answerKeys.length !== 10) {
      return new Response(
        JSON.stringify({ error: `answers must contain exactly 10 question responses, got ${answerKeys.length}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Fetch offers JSON from the app
    const flowConfig = FLOW_CONFIG[flow_id]
    const siteUrl = Deno.env.get('SITE_URL') || 'https://viberise.nichuzz.com'
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

    // 7. Normalize answers — accept both plain strings and { value, label } objects
    const normalizedAnswers: Record<string, string> = {}
    for (const [key, val] of Object.entries(answers)) {
      normalizedAnswers[key] =
        typeof val === 'string' ? val : (val as any)?.value ?? String(val)
    }

    // 8. Run scoring engine
    const scores = calculateOfferScores(normalizedAnswers, offersData)
    const topOffer = scores.find((s) => !s.isDisqualified) || scores[0]

    if (!topOffer) {
      return new Response(
        JSON.stringify({ error: 'Scoring produced no results. Check your answers.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 9. Get user info for the insert
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const user = userData?.user

    // 10. Build insert data — mirrors MoneyModelFlowBase.jsx handleSaveResults
    const sessionId = crypto.randomUUID()
    const columns = flowConfig.dbColumns

    const insertData: Record<string, any> = {
      session_id: sessionId,
      user_id: userId,
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

    // 11. Return scored results
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
        message: `Assessment saved. Result: ${topOffer.offer.name} (${Math.round(topOffer.confidence * 100)}% confidence). View at https://viberise.nichuzz.com`,
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
