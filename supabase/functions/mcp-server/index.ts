// supabase/functions/mcp-server/index.ts
// MCP server for FindMyFlow — implements MCP Streamable HTTP (JSON-RPC 2.0) directly.
// No SDK dependency. Each request is fully independent (stateless).

import { FLOW_CONFIG, VALID_FLOW_IDS } from '../_shared/flowConfig.ts'
import { calculateOfferScores } from '../_shared/scoring.ts'
import { authenticateRequest, corsHeaders, type AuthResult } from '../_shared/auth.ts'

// --- Constants ---
const MCP_PROTOCOL_VERSION = '2025-03-26'
const SERVER_INFO = { name: 'findmyflow', version: '1.1.0' }
const SITE_URL = Deno.env.get('SITE_URL') || 'https://findmyflow.nichuzz.com'

// Quest catalog URL — served as static JSON from the app
const QUEST_CATALOG_URL = `${SITE_URL}/challengeQuestsUpdate.json`

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

// --- JSON-RPC helpers ---

function jsonRpcResponse(id: number | string, result: any): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function jsonRpcError(id: number | string | null, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function textResult(data: any): any {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

function errorResult(message: string): any {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true }
}

// JSON-RPC error codes
const PARSE_ERROR = -32700
const INVALID_REQUEST = -32600
const METHOD_NOT_FOUND = -32601
const INVALID_PARAMS = -32602
const INTERNAL_ERROR = -32603

// --- Scoring category mapping (mirrors src/lib/scoringCategories.js) ---

const SCORING_CATEGORIES: Record<string, string> = {
  'Business': 'business',
  'Flow Finder': 'business',
  'Bonus': 'business',
  'Healing': 'healing',
  'Tracker': 'healing',
  'Daily': 'healing',
  'Weekly': 'healing',
  'Groans': 'courage',
  'Voices': 'courage',
}

// --- Tool definitions (for tools/list response) ---

const TOOL_DEFINITIONS = [
  {
    name: 'list_flows',
    description: 'List all available FindMyFlow business assessments (Money Model flows). Returns flow IDs, names, descriptions, and question counts.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_flow_questions',
    description: 'Get the 10 questions and answer options for a specific assessment flow. Use this to guide the user through the assessment conversationally.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        flow_id: {
          type: 'string',
          description: 'The assessment flow ID',
          enum: VALID_FLOW_IDS,
        },
      },
      required: ['flow_id'],
    },
  },
  {
    name: 'submit_assessment',
    description: 'Submit answers for a business assessment. Scores the answers, saves results to the user\'s account, and returns the recommended offer/strategy with confidence score.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        flow_id: {
          type: 'string',
          description: 'The assessment flow ID',
          enum: VALID_FLOW_IDS,
        },
        answers: {
          type: 'object',
          description: 'Object mapping question IDs to answer values. Must contain exactly 10 entries.',
          additionalProperties: { type: 'string' },
        },
        reasoning: {
          type: 'string',
          description: 'Optional: agent reasoning or notes about the assessment',
        },
      },
      required: ['flow_id', 'answers'],
    },
  },
  {
    name: 'get_user_context',
    description: 'Get a complete snapshot of the user: projects with stages, persona, lifetime/weekly scores, Flow Finder discoveries (skills, problems, personas), completed assessment results, and recent quest completions. Call this first to understand who the user is before guiding them.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_quests',
    description: 'List available Business quests the user can complete at their current stage. Returns quest ID, name, description, input type, options, points, and completion status. Use stage parameter to see quests for a different stage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        stage: {
          type: 'number',
          description: 'Stage number (0-8). Defaults to the user\'s current project stage. Stage 0 = Flow Finder, 1 = Validation, 2 = Product, 3 = Testing, 4 = Money Models, 5 = Offer Creation, 6 = Campaign, 7 = Launch, 8 = Tracking.',
        },
        include_completed: {
          type: 'boolean',
          description: 'Include quests the user has already completed. Defaults to false.',
        },
      },
      required: [],
    },
  },
  {
    name: 'complete_quest',
    description: 'Complete a Business quest on behalf of the user. Accepts the quest ID and the user\'s response (text, selection value, or structured data depending on input type). Awards points and updates scores.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        quest_id: {
          type: 'string',
          description: 'The quest ID from list_quests.',
        },
        response: {
          type: 'string',
          description: 'The user\'s response. For text: free text. For multi_select: comma-separated values. For milestone/checkbox/offer_checklist: "done". For flow: "completed" (use submit_assessment first). For progress_dropdown: an option value (e.g. "completed_crm"). For launch_review: JSON with win, key_learning, surprise, do_differently, overall_satisfaction (1-10). For response_counter: "done" (server verifies actual count). For validation_responses: "analyze" (server gathers data and runs AI analysis).',
        },
        project_id: {
          type: 'string',
          description: 'Optional project ID for project-specific quests. If omitted, uses the user\'s first active project.',
        },
      },
      required: ['quest_id', 'response'],
    },
  },
]

// --- Existing tool handlers ---

async function handleListFlows(): Promise<any> {
  const flows = VALID_FLOW_IDS.map((id) => ({
    id,
    name: FLOW_CONFIG[id].name,
    description: FLOW_CONFIG[id].description,
    question_count: 10,
  }))
  return textResult(flows)
}

async function handleGetFlowQuestions(args: any): Promise<any> {
  const { flow_id } = args
  if (!flow_id || !VALID_FLOW_IDS.includes(flow_id)) {
    return errorResult(`Invalid flow_id. Must be one of: ${VALID_FLOW_IDS.join(', ')}`)
  }

  const config = FLOW_CONFIG[flow_id]
  const questionsUrl = `${SITE_URL}${encodePath(config.questionsPath)}`
  const resp = await fetch(questionsUrl)
  if (!resp.ok) {
    return errorResult(`Failed to load questions for ${flow_id}`)
  }

  const questionsData = await resp.json()
  return textResult({
    flow_id,
    name: config.name,
    description: config.description,
    questions: questionsData.questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      subtext: q.subtext || null,
      options: q.options.map((o: any) => ({
        label: o.label,
        value: o.value,
        description: o.description || null,
      })),
    })),
  })
}

async function handleSubmitAssessment(
  args: any,
  auth: AuthResult
): Promise<any> {
  const { flow_id, answers, reasoning } = args

  if (!flow_id || !VALID_FLOW_IDS.includes(flow_id)) {
    return errorResult(`Invalid flow_id. Must be one of: ${VALID_FLOW_IDS.join(', ')}`)
  }

  if (!answers || typeof answers !== 'object') {
    return errorResult('answers must be an object mapping question IDs to answer values')
  }
  const answerKeys = Object.keys(answers)
  if (answerKeys.length !== 10) {
    return errorResult(`answers must contain exactly 10 question responses, got ${answerKeys.length}`)
  }

  const allowedFlows = auth.permissions?.flows || VALID_FLOW_IDS
  if (!allowedFlows.includes(flow_id)) {
    return errorResult(`API key does not have permission for flow: ${flow_id}`)
  }

  const config = FLOW_CONFIG[flow_id]

  const normalizedAnswers: Record<string, string> = {}
  for (const [key, val] of Object.entries(answers)) {
    normalizedAnswers[key] =
      typeof val === 'string' ? val : (val as any)?.value ?? String(val)
  }

  const offersUrl = `${SITE_URL}${encodePath(config.offersPath)}`
  const offersResp = await fetch(offersUrl)
  if (!offersResp.ok) {
    return errorResult(`Failed to load scoring data for ${flow_id}`)
  }
  const offersData = await offersResp.json()

  const scores = calculateOfferScores(normalizedAnswers, offersData)
  const topOffer = scores.find((s) => !s.isDisqualified) || scores[0]

  if (!topOffer) {
    return errorResult('Scoring produced no results. Check your answers.')
  }

  const { data: userData } = await auth.supabase.auth.admin.getUserById(auth.userId)
  const user = userData?.user

  const sessionId = crypto.randomUUID()
  const columns = config.dbColumns

  const insertData: Record<string, any> = {
    session_id: sessionId,
    user_id: auth.userId,
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

  const { error: insertError } = await auth.supabase
    .from(config.dbTable)
    .insert([insertData])

  if (insertError) {
    console.error('Insert error:', insertError)
    return errorResult('Failed to save assessment results')
  }

  return textResult({
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
    message: `Assessment saved. Result: ${topOffer.offer.name} (${Math.round(topOffer.confidence * 100)}% confidence).`,
  })
}

// --- New tool handlers ---

async function handleGetUserContext(auth: AuthResult): Promise<any> {
  const userId = auth.userId
  const sb = auth.supabase

  // Run all queries in parallel
  const [
    projectsRes,
    stageProgressRes,
    lifetimeRes,
    weeklyRes,
    clustersRes,
    completionsRes,
    ...assessmentResults
  ] = await Promise.all([
    // Projects
    sb.from('user_projects')
      .select('id, name, current_stage, total_points, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    // Stage progress (persona, onboarding)
    sb.from('user_stage_progress')
      .select('persona, onboarding_v2_completed, current_stage')
      .eq('user_id', userId)
      .single(),

    // Lifetime scores
    sb.from('user_lifetime_scores')
      .select('lifetime_business_score, lifetime_healing_score, lifetime_courage_score, lifetime_total_score')
      .eq('user_id', userId)
      .is('project_id', null)
      .maybeSingle(),

    // This week's scores
    sb.from('challenge_weekly_scores')
      .select('business_score, healing_score, courage_score')
      .eq('user_id', userId)
      .is('project_id', null)
      .order('week_start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Flow Finder clusters (skills, problems, personas)
    sb.from('nikigai_clusters')
      .select('cluster_label, cluster_type')
      .eq('user_id', userId),

    // Recent quest completions
    sb.from('quest_completions')
      .select('quest_id, quest_category, quest_type, points_earned, reflection_text, stage, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(20),

    // All 6 assessment tables — most recent result from each
    ...VALID_FLOW_IDS.map((flowId) => {
      const config = FLOW_CONFIG[flowId]
      const cols = config.dbColumns
      return sb.from(config.dbTable)
        .select(`session_id, ${cols.recommendedName}, confidence_score, total_score, submitted_via, created_at`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    }),
  ])

  // Build Flow Finder summary
  const clusters = clustersRes.data || []
  const skills = clusters.filter((c: any) => c.cluster_type === 'skill' || c.cluster_type === 'skills').map((c: any) => c.cluster_label)
  const problems = clusters.filter((c: any) => c.cluster_type === 'problem' || c.cluster_type === 'problems').map((c: any) => c.cluster_label)
  const personas = clusters.filter((c: any) => c.cluster_type === 'persona' || c.cluster_type === 'personas').map((c: any) => c.cluster_label)

  // Build assessment results summary
  const assessments: Record<string, any> = {}
  VALID_FLOW_IDS.forEach((flowId, i) => {
    const res = assessmentResults[i]
    if (res.data) {
      const cols = FLOW_CONFIG[flowId].dbColumns
      assessments[flowId] = {
        recommendation: res.data[cols.recommendedName],
        confidence: res.data.confidence_score,
        total_score: res.data.total_score,
        submitted_via: res.data.submitted_via,
        completed_at: res.data.created_at,
      }
    }
  })

  return textResult({
    projects: (projectsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      current_stage: p.current_stage,
      total_points: p.total_points,
    })),
    persona: stageProgressRes.data?.persona || null,
    scores: {
      lifetime: lifetimeRes.data || { lifetime_business_score: 0, lifetime_healing_score: 0, lifetime_courage_score: 0, lifetime_total_score: 0 },
      this_week: weeklyRes.data || { business_score: 0, healing_score: 0, courage_score: 0 },
    },
    flow_finder: {
      skills,
      problems,
      personas,
    },
    assessments,
    recent_completions: (completionsRes.data || []).map((c: any) => ({
      quest_id: c.quest_id,
      category: c.quest_category,
      type: c.quest_type,
      points: c.points_earned,
      reflection: c.reflection_text,
      stage: c.stage,
      completed_at: c.completed_at,
    })),
  })
}

async function handleListQuests(args: any, auth: AuthResult): Promise<any> {
  const userId = auth.userId
  const sb = auth.supabase

  // Get user's current stage from their first project (or use provided stage)
  let targetStage = args.stage
  if (targetStage === undefined || targetStage === null) {
    const { data: project } = await sb
      .from('user_projects')
      .select('current_stage')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    targetStage = project?.current_stage ?? 0
  }

  const includeCompleted = args.include_completed === true

  // Fetch quest catalog from the static JSON
  const catalogResp = await fetch(QUEST_CATALOG_URL)
  if (!catalogResp.ok) {
    return errorResult('Failed to load quest catalog')
  }
  const catalog = await catalogResp.json()

  // Filter to Business category, not archived, matching stage
  const businessQuests = (catalog.quests || []).filter((q: any) =>
    q.category === 'Business' &&
    !q.archived &&
    (q.stage_required ?? 0) <= targetStage
  )

  // Get user's completions to check status
  const questIds = businessQuests.map((q: any) => q.id)
  const { data: completions } = await sb
    .from('quest_completions')
    .select('quest_id')
    .eq('user_id', userId)
    .in('quest_id', questIds)

  // Count completions per quest
  const completionCounts: Record<string, number> = {}
  for (const c of (completions || [])) {
    completionCounts[c.quest_id] = (completionCounts[c.quest_id] || 0) + 1
  }

  // Build result
  const quests = businessQuests
    .map((q: any) => {
      const done = completionCounts[q.id] || 0
      const maxCompletions = q.maxCompletions || 1
      const isComplete = done >= maxCompletions

      if (!includeCompleted && isComplete) return null

      return {
        id: q.id,
        name: q.name,
        description: q.description,
        type: q.type,
        stage_required: q.stage_required,
        points: q.points,
        input_type: q.inputType,
        options: q.options || q.selectOptions || null,
        placeholder: q.placeholder || null,
        flow_route: q.flow_route || null,
        is_primary: q.isPrimary || false,
        target_responses: q.target_responses || null,
        points_per_response: q.points_per_response || null,
        review_steps: q.reviewSteps || null,
        flow_stage: q.flow_stage || null,
        completions: done,
        max_completions: maxCompletions,
        is_complete: isComplete,
        requires_quest: q.requires_quest || null,
      }
    })
    .filter(Boolean)

  // Group by type for easy navigation
  const grouped: Record<string, any[]> = {}
  for (const q of quests) {
    const type = q.type || 'Other'
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(q)
  }

  return textResult({
    stage: targetStage,
    total_available: quests.length,
    quests_by_type: grouped,
  })
}

async function handleCompleteQuest(args: any, auth: AuthResult): Promise<any> {
  const { quest_id, response } = args
  const userId = auth.userId
  const sb = auth.supabase

  if (!quest_id) return errorResult('quest_id is required')
  if (!response) return errorResult('response is required')

  // Fetch quest catalog to validate the quest
  const catalogResp = await fetch(QUEST_CATALOG_URL)
  if (!catalogResp.ok) return errorResult('Failed to load quest catalog')
  const catalog = await catalogResp.json()

  const quest = (catalog.quests || []).find((q: any) => q.id === quest_id && !q.archived)
  if (!quest) return errorResult(`Quest not found: ${quest_id}`)
  if (quest.category !== 'Business') return errorResult(`Only Business quests supported. This quest is category: ${quest.category}`)

  // Check maxCompletions
  const maxCompletions = quest.maxCompletions || 1
  const { data: existingCompletions } = await sb
    .from('quest_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('quest_id', quest_id)

  const currentCount = existingCompletions?.length || 0
  if (currentCount >= maxCompletions) {
    return errorResult(`Quest already completed (${currentCount}/${maxCompletions})`)
  }

  // Check prerequisite
  if (quest.requires_quest) {
    const { data: prereq } = await sb
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('quest_id', quest.requires_quest)
      .limit(1)

    if (!prereq || prereq.length === 0) {
      return errorResult(`Prerequisite quest not completed: ${quest.requires_quest}`)
    }
  }

  // Resolve project_id and check stage access
  let projectId = args.project_id || null
  const { data: project } = projectId
    ? await sb.from('user_projects').select('id, current_stage').eq('id', projectId).eq('user_id', userId).single()
    : await sb.from('user_projects').select('id, current_stage').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  projectId = project?.id || null

  // Determine stage and enforce access
  const stage = quest.stage_required ?? 0
  const userStage = project?.current_stage ?? 0
  if (stage > 0 && stage > userStage) {
    return errorResult(`Quest requires stage ${stage} but your project is at stage ${userStage}. Complete earlier quests first.`)
  }

  // Build reflection text and validate based on input type
  let reflectionText = response
  let pointsOverride: number | null = null

  switch (quest.inputType) {
    case 'progress_dropdown': {
      const validValues = (quest.options || []).map((o: any) => o.value)
      if (!validValues.includes(response)) {
        return errorResult(`Invalid value "${response}". Must be one of: ${validValues.join(', ')}`)
      }
      if (!response.startsWith('completed')) {
        return errorResult(`Only completion values accepted (completed_crm or completed_other). "${response}" is a status, not a completion.`)
      }
      reflectionText = JSON.stringify({ progress: response })
      break
    }
    case 'offer_checklist':
    case 'milestone':
    case 'checkbox': {
      reflectionText = `Completed: ${quest.name}`
      break
    }
    case 'response_counter': {
      const flowStage = quest.flow_stage || 'validation'
      const target = quest.target_responses || 3
      const ppr = quest.points_per_response || 8

      // Verify actual response count server-side
      const { data: vFlows } = await sb
        .from('validation_flows')
        .select('response_count')
        .eq('creator_user_id', userId)
        .eq('stage', flowStage)
      const actualCount = (vFlows || []).reduce((sum: number, f: any) => sum + (f.response_count || 0), 0)

      if (actualCount < target) {
        return errorResult(`Need ${target} ${flowStage} responses, you have ${actualCount}. Collect more at /validation-flows.`)
      }

      pointsOverride = actualCount * ppr
      reflectionText = JSON.stringify({ responseCount: actualCount, pointsEarned: pointsOverride })
      break
    }
    case 'launch_review': {
      let parsed: any
      try { parsed = JSON.parse(response) } catch {
        return errorResult('launch_review expects JSON: {"win": "...", "key_learning": "...", "surprise": "...", "do_differently": "...", "overall_satisfaction": 1-10}')
      }
      const required = ['win', 'key_learning', 'surprise', 'do_differently', 'overall_satisfaction']
      const missing = required.filter(f => !parsed[f] && parsed[f] !== 0)
      if (missing.length > 0) {
        return errorResult(`Missing fields: ${missing.join(', ')}`)
      }
      const sat = parsed.overall_satisfaction
      if (typeof sat !== 'number' || sat < 1 || sat > 10) {
        return errorResult('overall_satisfaction must be a number from 1 to 10')
      }
      reflectionText = JSON.stringify(parsed)
      break
    }
    case 'validation_responses': {
      const flowStage = quest.flow_stage || 'validation'

      // 1. Get user's validation flows with responses
      const { data: userFlows } = await sb
        .from('validation_flows')
        .select('id, flow_name, response_count, placeholders, project_id')
        .eq('creator_user_id', userId)
        .eq('stage', flowStage)
        .gt('response_count', 0)

      if (!userFlows || userFlows.length === 0) {
        return errorResult(`No ${flowStage} responses found. Create a form at /validation-flows first.`)
      }

      const totalResponses = userFlows.reduce((s: number, f: any) => s + (f.response_count || 0), 0)
      if (totalResponses < 3) {
        return errorResult(`Need at least 3 responses for analysis, you have ${totalResponses}. Collect more at /validation-flows.`)
      }

      // 2. Gather completed sessions + responses per flow
      const flowsData: any[] = []
      for (const flow of userFlows) {
        const { data: sessions } = await sb
          .from('validation_sessions')
          .select('id')
          .eq('flow_id', flow.id)
          .eq('is_completed', true)

        const sessionIds = (sessions || []).map((s: any) => s.id)
        if (sessionIds.length === 0) continue

        const { data: responses } = await sb
          .from('validation_responses')
          .select('step_id, question_text, answer_type, answer_value, answered_at')
          .in('session_id', sessionIds)

        flowsData.push({
          flowName: flow.flow_name,
          flowId: flow.id,
          placeholders: flow.placeholders || {},
          responses: responses || [],
        })
      }

      if (flowsData.length === 0) {
        return errorResult('No completed responses found to analyze.')
      }

      // 3. Call the analyze-validation-responses edge function
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const analyzeResp = await fetch(`${supabaseUrl}/functions/v1/analyze-validation-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ userId, projectId: projectId, flows: flowsData }),
      })

      if (!analyzeResp.ok) {
        const errText = await analyzeResp.text()
        console.error('Analysis function error:', analyzeResp.status, errText)
        return errorResult('Failed to run validation analysis. Check that responses exist and try again.')
      }

      const analyzeResult = await analyzeResp.json()
      reflectionText = JSON.stringify({
        analysis_id: analyzeResult.analysis?.id,
        total_responses: totalResponses,
        flows_analyzed: flowsData.length,
        analysis_number: analyzeResult.analysisNumber,
      })
      break
    }
    case 'multi_select':
      reflectionText = response
      break
    case 'text':
    case 'flow':
    default:
      reflectionText = response
      break
  }

  // User-level quests (stage 0 Flow Finder) use null challenge_instance_id + null project_id
  const isUserLevel = stage === 0
  const questPoints = pointsOverride ?? quest.points ?? 5

  // Insert completion
  const { error: insertError } = await sb
    .from('quest_completions')
    .insert({
      user_id: userId,
      challenge_instance_id: null,
      quest_id: quest_id,
      quest_category: 'Business',
      quest_type: quest.inputType === 'flow' ? 'flow' : quest.type || 'anytime',
      points_earned: questPoints,
      challenge_day: 0,
      reflection_text: reflectionText,
      project_id: isUserLevel ? null : projectId,
      stage,
    })

  if (insertError) {
    console.error('Quest completion insert error:', insertError)
    return errorResult('Failed to save quest completion')
  }

  // Update scores via RPC (same as the web app)
  const scoringCategory = SCORING_CATEGORIES[quest.category] || 'business'
  const weekStart = getWeekStartDate()

  const { error: rpcError } = await sb.rpc('increment_scores', {
    p_user_id: userId,
    p_project_id: isUserLevel ? null : projectId,
    p_category: scoringCategory,
    p_points: questPoints,
    p_week_start: weekStart,
  })
  if (rpcError) {
    console.error('increment_scores RPC error:', rpcError)
  }

  // Get updated lifetime scores
  const { data: lifetimeScores } = await sb
    .from('user_lifetime_scores')
    .select('lifetime_business_score, lifetime_healing_score, lifetime_courage_score, lifetime_total_score')
    .eq('user_id', userId)
    .is('project_id', null)
    .maybeSingle()

  return textResult({
    success: true,
    quest_id,
    quest_name: quest.name,
    points_earned: questPoints,
    completions: currentCount + 1,
    max_completions: maxCompletions,
    lifetime_scores: lifetimeScores || null,
    message: `Quest "${quest.name}" completed! +${quest.points || 5} points.`,
  })
}

// Helper: get Monday of current week as YYYY-MM-DD (UTC).
// Note: web app uses local timezone (getWeekStartLocal). Edge functions run in UTC.
// This may cause a week boundary mismatch for users near midnight, but the scores
// still land in a valid week row and are summed correctly by the RPC.
function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff))
  return monday.toISOString().split('T')[0]
}

// --- MCP protocol router ---

async function handleMcpRequest(body: any, auth: AuthResult): Promise<Response> {
  const { jsonrpc, id, method, params } = body

  if (jsonrpc !== '2.0') {
    return jsonRpcError(id ?? null, INVALID_REQUEST, 'Expected jsonrpc: "2.0"')
  }

  switch (method) {
    // --- MCP lifecycle ---

    case 'initialize':
      return jsonRpcResponse(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      })

    case 'notifications/initialized':
      return new Response(null, { status: 202, headers: corsHeaders })

    case 'ping':
      return jsonRpcResponse(id, {})

    // --- Tool discovery ---

    case 'tools/list':
      return jsonRpcResponse(id, { tools: TOOL_DEFINITIONS })

    // --- Tool execution ---

    case 'tools/call': {
      const toolName = params?.name
      const toolArgs = params?.arguments || {}

      let result: any
      switch (toolName) {
        case 'list_flows':
          result = await handleListFlows()
          break
        case 'get_flow_questions':
          result = await handleGetFlowQuestions(toolArgs)
          break
        case 'submit_assessment':
          result = await handleSubmitAssessment(toolArgs, auth)
          break
        case 'get_user_context':
          result = await handleGetUserContext(auth)
          break
        case 'list_quests':
          result = await handleListQuests(toolArgs, auth)
          break
        case 'complete_quest':
          result = await handleCompleteQuest(toolArgs, auth)
          break
        default:
          return jsonRpcError(id, INVALID_PARAMS, `Unknown tool: ${toolName}`)
      }

      return jsonRpcResponse(id, result)
    }

    default:
      return jsonRpcError(id, METHOD_NOT_FOUND, `Unknown method: ${method}`)
  }
}

// --- Main handler ---

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. MCP uses POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const authResult = await authenticateRequest(req)
  if (authResult instanceof Response) return authResult

  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonRpcError(null, PARSE_ERROR, 'Invalid JSON')
  }

  try {
    return await handleMcpRequest(body, authResult)
  } catch (err) {
    console.error('MCP handler error:', err)
    return jsonRpcError(body?.id ?? null, INTERNAL_ERROR, 'Internal server error')
  }
})
