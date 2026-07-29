// supabase/functions/mcp-server/index.ts
// MCP server for Vibe Rise — implements MCP Streamable HTTP (JSON-RPC 2.0) directly.
// No SDK dependency. Each request is fully independent (stateless).

import { FLOW_CONFIG, VALID_FLOW_IDS } from '../_shared/flowConfig.ts'
import { calculateOfferScores } from '../_shared/scoring.ts'
import { authenticateRequest, corsHeaders, type AuthResult } from '../_shared/auth.ts'
import {
  VALID_SKILL_IDS, SKILL_DISPLAY_NAMES, getSkillLevel, getRPLevel,
  STATE_TO_WAHOO, STATE_TO_TASK_SIGNAL, COURAGE_STATES, VALID_STATES,
  VALID_PROTECTIVE_VOICES,
} from '../_shared/taxonomy.ts'
import { getChainHealth, healMissingSkillTags, findMatchingClusters } from '../_shared/chainHealer.ts'

// --- Constants ---
const MCP_PROTOCOL_VERSION = '2025-03-26'
const SERVER_INFO = { name: 'viberise', version: '1.1.0' }
const SITE_URL = Deno.env.get('SITE_URL') || 'https://viberise.nichuzz.com'

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
    description: 'List all available Vibe Rise business assessments (Money Model flows). Returns flow IDs, names, descriptions, and question counts.',
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
  {
    name: 'get_interior_scoreboard',
    description: 'Get the user\'s full self-knowledge state: Clarity/Action scores, zone, skills with XP/levels, active quests with progress, unstarted life paths, context mappings (directory/project → quest), identity statements, and pattern evidence. Call at session start to understand who the user is and guide them. Use mode="full" for deeper evidence data (protective voices, state streaks, drain patterns).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mode: {
          type: 'string',
          description: 'Light mode (default) returns scores, skills, quests, mappings. Full mode adds pattern evidence and chain health.',
          enum: ['light', 'full'],
        },
      },
      required: [],
    },
  },
  {
    name: 'commit_progress',
    description: 'Commit task progress from a Claude session. Creates/completes tasks on quests, awards RP and skill XP, saves identity statements and protective voice evidence, increments behavioral evidence on clusters. Claude should match accomplishments to quests and collect state responses BEFORE calling this. Each entry = one task created and completed. Returns points awarded, level-ups, and notable evidence patterns.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entries: {
          type: 'array',
          description: 'Array of task entries to commit. Max 10 per call.',
          items: {
            type: 'object',
            properties: {
              quest_id: { type: 'string', description: 'Existing quest UUID. Required unless create_quest is provided.' },
              create_quest: {
                type: 'object',
                description: 'Create a new quest instead of using an existing one.',
                properties: {
                  label: { type: 'string' },
                  career_id: { type: 'string', description: 'Life path career ID (e.g. "c3") to link to. Null for new directions.' },
                  predicted_state: { type: 'string', enum: ['vibe_rise', 'fun', 'stress', 'boring'] },
                },
                required: ['label', 'predicted_state'],
              },
              task_text: { type: 'string', description: 'Concise task name, e.g. "Built landing page"' },
              complete_existing_task_id: { type: 'string', description: 'UUID of an existing uncompleted task to mark done instead of creating a new one.' },
              skill_tags: {
                type: 'array', items: { type: 'string' },
                description: 'Skills used (1-3 from: storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up)',
              },
              state: { type: 'string', enum: ['vibe_rise', 'fun', 'stress', 'boring'], description: 'How the user felt while doing this task.' },
              identity_statement: { type: 'string', description: 'For vibe_rise/fun: "I am someone who..." (the verb/action part only)' },
              protective_voice: { type: 'string', enum: ['controller', 'ghost', 'perfectionist', 'auto_pilot', 'people_pleaser'], description: 'For stress state: which voice showed up.' },
              cross_quest_ids: { type: 'array', items: { type: 'string' }, description: 'For vibe_rise: other quest UUIDs this work also fed.' },
            },
            required: ['task_text', 'skill_tags', 'state'],
          },
        },
        set_context_mapping: {
          type: 'object',
          description: 'Save a directory/project → quest mapping for future auto-detection.',
          properties: {
            context_type: { type: 'string', enum: ['claude_code_directory', 'claude_desktop_project'] },
            context_identifier: { type: 'string', description: 'Directory path or project folder name.' },
            quest_id: { type: 'string', description: 'Quest UUID to map to.' },
          },
          required: ['context_type', 'context_identifier', 'quest_id'],
        },
      },
      required: ['entries'],
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

// --- Interior Scoreboard handler ---

const MINIMUM_ACTIONS = 5

async function handleGetInteriorScoreboard(args: any, auth: AuthResult): Promise<any> {
  const userId = auth.userId
  const sb = auth.supabase
  const mode = args?.mode || 'light'

  // Get user email for life_path_sessions lookup
  const { data: userData } = await sb.auth.admin.getUserById(userId)
  const userEmail = userData?.user?.email || null

  // --- Light mode: 8 parallel queries ---
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    clustersRes,
    courageRes,
    taskSignalRes,
    dailyCheckinRes,
    lifetimeRes,
    skillsRes,
    questsRes,
    contextMappingsRes,
    identityRes,
    lifePathRes,
  ] = await Promise.all([
    // 1. Clarity: clusters with resonance
    sb.from('nikigai_clusters')
      .select('resonance_state, resonance_rating')
      .eq('user_id', userId)
      .in('cluster_type', ['skills', 'problems', 'persona'])
      .is('step_id', null)
      .eq('cluster_stage', 'final')
      .eq('is_removed', false),

    // 2a. Action: courage completions (wahoo classification)
    sb.from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .gte('created_at', sevenDaysAgo)
      .not('reflection_text', 'is', null),

    // 2b. Action: task signals
    sb.from('quest_tasks')
      .select('task_signal')
      .eq('user_id', userId)
      .not('task_signal', 'is', null)
      .gte('completed_at', sevenDaysAgo),

    // 2c. Action: daily check-ins
    sb.from('nervous_system_checkins')
      .select('after_state')
      .eq('user_id', userId)
      .eq('checkin_type', 'daily')
      .gte('created_at', sevenDaysAgo),

    // 3. RP + Level
    sb.from('user_lifetime_scores')
      .select('lifetime_courage_score, lifetime_healing_score, lifetime_business_score, lifetime_total_score')
      .eq('user_id', userId)
      .is('project_id', null)
      .maybeSingle(),

    // 4. Skills
    sb.from('user_skill_progress')
      .select('skill_id, xp, level')
      .eq('user_id', userId),

    // 5. Active quests + tasks
    sb.from('quests')
      .select('id, label, career_id, skill_tags, branch, predicted_state, status, created_at, updated_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),

    // 6. Context mappings
    sb.from('quest_context_mappings')
      .select('context_type, context_identifier, quest_id')
      .eq('user_id', userId),

    // 7. Identity statements (last 100 courage completions)
    sb.from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .not('reflection_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100),

    // 8. Life path sessions
    userEmail
      ? sb.from('life_path_sessions')
          .select('careers')
          .eq('client_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // --- Calculate Clarity Score ---
  const clusters = clustersRes.data || []
  let clarityScore: number | null = null
  if (clusters.length > 0) {
    const aligned = clusters.filter((c: any) => {
      const state = c.resonance_state || (c.resonance_rating >= 4 ? 'vibe_rise' : c.resonance_rating >= 3 ? 'fun' : null)
      return state === 'vibe_rise' || state === 'fun'
    })
    clarityScore = Math.round((aligned.length / clusters.length) * 100)
  }

  // --- Calculate Action Score ---
  let actionAligned = 0
  let actionTotal = 0

  ;(courageRes.data || []).forEach((row: any) => {
    try {
      const parsed = JSON.parse(row.reflection_text)
      if (parsed.wahoo_classification) {
        actionTotal++
        if (['vibe', 'wahoo', 'peace'].includes(parsed.wahoo_classification)) actionAligned++
      }
    } catch {}
  })

  ;(taskSignalRes.data || []).forEach((t: any) => {
    actionTotal++
    if (t.task_signal === 'lit_me_up') actionAligned++
  })

  ;(dailyCheckinRes.data || []).forEach((c: any) => {
    if (!c.after_state) return // skip null states to avoid inflating denominator
    actionTotal++
    if (['vibe_rise', 'ventral'].includes(c.after_state)) actionAligned++
  })

  const actionScore = actionTotal >= MINIMUM_ACTIONS
    ? Math.round((actionAligned / actionTotal) * 100)
    : null

  // --- Zone ---
  let zone: string | null = null
  if (actionScore != null && clarityScore != null) {
    if (actionScore > 60 && clarityScore > 60) zone = 'Self-Actualisation'
    else if (actionScore <= 60 && clarityScore > 60) zone = 'Head Full of Dreams'
    else if (actionScore > 60 && clarityScore <= 60) zone = 'Misguided Zone'
    else zone = 'Unfulfilment'
  }

  // --- RP + Level ---
  const rpTotal = lifetimeRes.data?.lifetime_total_score || 0
  const rpLevel = getRPLevel(rpTotal)

  // --- Skills (fill in all 10, even if user has no progress) ---
  const skillRows = skillsRes.data || []
  const skillMap: Record<string, { xp: number; level: number }> = {}
  skillRows.forEach((s: any) => { skillMap[s.skill_id] = { xp: s.xp || 0, level: s.level || 0 } })

  const skills = VALID_SKILL_IDS.map(id => {
    const s = skillMap[id] || { xp: 0, level: 0 }
    const levelInfo = getSkillLevel(s.xp)
    return {
      id,
      display_name: SKILL_DISPLAY_NAMES[id] || id,
      xp: s.xp,
      level: levelInfo.level,
      level_name: levelInfo.name,
    }
  })

  // --- Active quests with task counts ---
  const questIds = (questsRes.data || []).map((q: any) => q.id)
  let questTasksData: any[] = []
  if (questIds.length > 0) {
    const { data: tasks } = await sb
      .from('quest_tasks')
      .select('quest_id, done, is_courage_challenge, id, text, completed_at')
      .in('quest_id', questIds)
    questTasksData = tasks || []
  }

  const tasksByQuest: Record<string, any[]> = {}
  questTasksData.forEach((t: any) => {
    if (!tasksByQuest[t.quest_id]) tasksByQuest[t.quest_id] = []
    tasksByQuest[t.quest_id].push(t)
  })

  const activeQuests = (questsRes.data || []).map((q: any) => {
    const tasks = tasksByQuest[q.id] || []
    // Use most recent task completion, falling back to quest updated_at
    const completedTasks = tasks.filter((t: any) => t.done && t.completed_at)
    const lastActivity = completedTasks.length > 0
      ? Math.max(...completedTasks.map((t: any) => new Date(t.completed_at).getTime()))
      : (q.updated_at ? new Date(q.updated_at).getTime() : Date.now())
    const daysSince = Math.floor((Date.now() - lastActivity) / 86400000)
    return {
      id: q.id,
      label: q.label,
      career_id: q.career_id,
      skill_tags: q.skill_tags || [],
      branch: q.branch,
      predicted_state: q.predicted_state,
      tasks_total: tasks.length,
      tasks_done: tasks.filter((t: any) => t.done).length,
      courage_total: tasks.filter((t: any) => t.is_courage_challenge).length,
      courage_done: tasks.filter((t: any) => t.is_courage_challenge && t.done).length,
      days_since_activity: daysSince,
      uncompleted_tasks: tasks
        .filter((t: any) => !t.done)
        .slice(0, 20)
        .map((t: any) => ({ id: t.id, text: t.text })),
    }
  })

  // --- Unstarted life paths ---
  const lifePaths = lifePathRes.data?.careers || []
  const existingCareerIds = new Set((questsRes.data || []).map((q: any) => q.career_id).filter(Boolean))
  const unstartedLifePaths = lifePaths
    .filter((c: any) => c.id && !existingCareerIds.has(c.id))
    .map((c: any) => ({
      career_id: c.id,
      label: c.label,
      predicted_state: c.predictedState || null,
    }))

  // --- Context mappings (resolve quest labels) ---
  const mappings = (contextMappingsRes.data || []).map((m: any) => {
    const quest = (questsRes.data || []).find((q: any) => q.id === m.quest_id)
    return {
      context_type: m.context_type,
      context_identifier: m.context_identifier,
      quest_id: m.quest_id,
      quest_label: quest?.label || 'Unknown quest',
    }
  })

  // --- Identity statements ---
  const identityCounts: Record<string, number> = {}
  ;(identityRes.data || []).forEach((row: any) => {
    try {
      const parsed = JSON.parse(row.reflection_text)
      if (parsed.identity_statement) {
        const stmt = parsed.identity_statement.trim()
        identityCounts[stmt] = (identityCounts[stmt] || 0) + 1
      }
    } catch {}
  })
  const identityStatements = Object.entries(identityCounts)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)

  // --- Build response ---
  const result: any = {
    scores: {
      clarity: clarityScore,
      action: actionScore,
      zone,
      rp_total: rpTotal,
      rp_level: rpLevel,
      streak: 0, // TODO: compute from challenge_instances or checkins
    },
    skills,
    active_quests: activeQuests,
    unstarted_life_paths: unstartedLifePaths,
    context_mappings: mappings,
    identity_statements: identityStatements,
  }

  // --- Full mode: additional evidence queries ---
  if (mode === 'full') {
    const [voiceRes, hiVoiceRes, dailyStatesRes, courageSkillRes, drainRes, healingIncompleteRes] = await Promise.all([
      // Protective voice counts from NS checkins
      sb.from('nervous_system_checkins')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),

      // Protective voice counts from healing intentions
      sb.from('healing_intentions')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),

      // Last 14 daily states
      sb.from('nervous_system_checkins')
        .select('created_at, after_state')
        .eq('user_id', userId)
        .eq('checkin_type', 'daily')
        .order('created_at', { ascending: false })
        .limit(14),

      // Courage challenges by skill
      sb.from('groan_challenges')
        .select('status, source_label')
        .eq('user_id', userId)
        .in('status', ['active', 'completed']),

      // Drain frequency
      sb.from('nervous_system_checkins')
        .select('source_quest_id')
        .eq('user_id', userId)
        .eq('checkin_type', 'drain'),

      // Incomplete healing
      sb.from('healing_intentions')
        .select('pattern, quest_task_id')
        .eq('user_id', userId)
        .eq('healing_stage', 'in_progress'),
    ])

    // Protective voice evidence
    const voiceCounts: Record<string, number> = {}
    ;[...(voiceRes.data || []), ...(hiVoiceRes.data || [])].forEach((r: any) => {
      if (r.protective_voice) {
        voiceCounts[r.protective_voice] = (voiceCounts[r.protective_voice] || 0) + 1
      }
    })

    // Daily states + streak
    const dailyStates = (dailyStatesRes.data || []).map((d: any) => ({
      date: d.created_at?.split('T')[0] || '',
      state: d.after_state,
    }))

    let stateStreak: { state: string; days: number } | null = null
    if (dailyStates.length >= 2) {
      const firstState = dailyStates[0].state
      let streakDays = 1
      for (let i = 1; i < dailyStates.length; i++) {
        if (dailyStates[i].state === firstState) streakDays++
        else break
      }
      if (streakDays >= 3) stateStreak = { state: firstState, days: streakDays }
    }

    // Courage by skill (approximate via source_label → quest label matching)
    const courageBySkill: Record<string, { created: number; completed: number }> = {}
    ;(courageSkillRes.data || []).forEach((c: any) => {
      // Group by source_label as proxy for skill area
      const label = c.source_label || 'unknown'
      if (!courageBySkill[label]) courageBySkill[label] = { created: 0, completed: 0 }
      courageBySkill[label].created++
      if (c.status === 'completed') courageBySkill[label].completed++
    })

    // Task signals (overall counts)
    const allTaskSignals = { lit_me_up: 0, was_okay: 0, bored: 0 }
    ;(taskSignalRes.data || []).forEach((t: any) => {
      if (t.task_signal === 'lit_me_up') allTaskSignals.lit_me_up++
      else if (t.task_signal === 'was_okay') allTaskSignals.was_okay++
      else if (t.task_signal === 'bored') allTaskSignals.bored++
    })

    // Drain frequency
    const drainFreq: Record<string, number> = {}
    ;(drainRes.data || []).forEach((d: any) => {
      const cat = d.source_quest_id || 'unknown'
      drainFreq[cat] = (drainFreq[cat] || 0) + 1
    })

    // Stale quests
    const staleQuests = activeQuests
      .filter((q: any) => q.days_since_activity >= 14)
      .map((q: any) => ({ label: q.label, days_inactive: q.days_since_activity }))

    // Incomplete healing
    const healingIncomplete = (healingIncompleteRes.data || []).map((h: any) => ({
      pattern: h.pattern || 'unnamed',
      quest_label: '', // would need a join to get quest label
    }))

    // Chain health
    const chainHealth = await getChainHealth(sb, userId)
    chainHealth.life_paths_without_quests = unstartedLifePaths.length

    result.evidence = {
      protective_voices: voiceCounts,
      voice_skill_contexts: {}, // TODO: requires joining voice → quest → skill_tags
      daily_state_last_14: dailyStates,
      state_streak: stateStreak,
      courage_by_skill: courageBySkill,
      task_signals: allTaskSignals,
      drain_frequency: drainFreq,
      stale_quests: staleQuests,
      healing_incomplete: healingIncomplete,
    }
    result.chain_health = chainHealth
  }

  return textResult(result)
}

// --- Commit Progress handler ---

async function handleCommitProgress(args: any, auth: AuthResult): Promise<any> {
  const userId = auth.userId
  const sb = auth.supabase
  const entries = args?.entries || []
  const weekStart = getWeekStartDate()

  if (!Array.isArray(entries) || entries.length === 0) {
    return errorResult('entries array is required and must not be empty')
  }
  if (entries.length > 10) {
    return errorResult('Maximum 10 entries per commit')
  }

  // Dedup entries by (task_text + quest_id) to prevent double-awarding
  const seen = new Set<string>()
  const dedupedEntries: any[] = []
  for (const entry of entries) {
    const key = `${entry.task_text}::${entry.quest_id || entry.create_quest?.label || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    dedupedEntries.push(entry)
  }

  // --- Pre-read: skill XP before writes (for level-up detection) ---
  const { data: preSkills } = await sb
    .from('user_skill_progress')
    .select('skill_id, xp')
    .eq('user_id', userId)
  const preSkillXP: Record<string, number> = {}
  ;(preSkills || []).forEach((s: any) => { preSkillXP[s.skill_id] = s.xp || 0 })

  // --- Pre-read: RP total (for level-up detection) ---
  const { data: preLifetime } = await sb
    .from('user_lifetime_scores')
    .select('lifetime_total_score')
    .eq('user_id', userId)
    .is('project_id', null)
    .maybeSingle()
  const preRPTotal = preLifetime?.lifetime_total_score || 0

  // --- Process each entry ---
  const synced: any[] = []
  let totalRP = 0
  let totalXP = 0
  let totalClusters = 0
  let chainsHealed = 0

  for (const entry of dedupedEntries) {
    try {
      const result = await processEntry(entry, userId, sb, weekStart)
      synced.push(result)
      totalRP += result.rp_awarded
      totalXP += Object.values(result.xp_awarded || {}).reduce((a: number, b: any) => a + (b as number), 0)
      totalClusters += result.clusters_updated
      if (result.chain_healed) chainsHealed++
    } catch (err: any) {
      synced.push({
        task_text: entry.task_text || 'unknown',
        quest_label: 'error',
        error: err.message || 'Unknown error',
        rp_awarded: 0,
        xp_awarded: null,
        clusters_updated: 0,
      })
    }
  }

  // --- Context mapping (if provided) ---
  let contextMappingSaved = false
  if (args?.set_context_mapping) {
    const cm = args.set_context_mapping
    if (cm.context_type && cm.context_identifier && cm.quest_id) {
      const { error: cmError } = await sb
        .from('quest_context_mappings')
        .upsert({
          user_id: userId,
          quest_id: cm.quest_id,
          context_type: cm.context_type,
          context_identifier: cm.context_identifier,
        }, { onConflict: 'user_id,context_type,context_identifier' })
      if (!cmError) contextMappingSaved = true
    }
  }

  // --- Notable evidence (post-write reads) ---
  const notable: any = {}

  // Skill level-ups
  const { data: postSkills } = await sb
    .from('user_skill_progress')
    .select('skill_id, xp')
    .eq('user_id', userId)
  const skillLevelUps: Array<{ skill: string; new_level: string }> = []
  ;(postSkills || []).forEach((s: any) => {
    const pre = preSkillXP[s.skill_id] || 0
    const post = s.xp || 0
    if (pre !== post) {
      const preLvl = getSkillLevel(pre)
      const postLvl = getSkillLevel(post)
      if (postLvl.level > preLvl.level) {
        skillLevelUps.push({
          skill: SKILL_DISPLAY_NAMES[s.skill_id] || s.skill_id,
          new_level: `L${postLvl.level} ${postLvl.name}`,
        })
      }
    }
  })
  if (skillLevelUps.length > 0) notable.skill_level_ups = skillLevelUps

  // RP level-up
  const { data: postLifetime } = await sb
    .from('user_lifetime_scores')
    .select('lifetime_total_score')
    .eq('user_id', userId)
    .is('project_id', null)
    .maybeSingle()
  const postRPTotal = postLifetime?.lifetime_total_score || 0
  const preLevel = getRPLevel(preRPTotal)
  const postLevel = getRPLevel(postRPTotal)
  if (preLevel !== postLevel) notable.rp_level_up = { new_level: postLevel }

  // Re-gen ready clusters (any just crossed threshold 5)
  const regenEntrySkills = entries
    .filter((e: any) => COURAGE_STATES.includes(e.state))
    .flatMap((e: any) => e.skill_tags || [])
  if (regenEntrySkills.length > 0) {
    const matchingClusters = await findMatchingClusters(sb, userId, regenEntrySkills)
    if (matchingClusters.length > 0) {
      const clusterIds = matchingClusters.map(c => c.id)
      const { data: regenClusters } = await sb
        .from('nikigai_clusters')
        .select('cluster_label, behavioral_evidence')
        .in('id', clusterIds)
        .gte('behavioral_evidence', 5)
      if (regenClusters && regenClusters.length > 0) {
        notable.regen_ready_clusters = regenClusters.map((c: any) => ({
          label: c.cluster_label,
          evidence: c.behavioral_evidence,
        }))
      }
    }
  }

  // Protective voice total (if any stress entries recorded a voice)
  const voiceEntries = entries.filter((e: any) => e.state === 'stress' && e.protective_voice)
  if (voiceEntries.length > 0) {
    const voice = voiceEntries[0].protective_voice
    const { count } = await sb
      .from('nervous_system_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('protective_voice', voice)
    const { count: hiCount } = await sb
      .from('healing_intentions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('protective_voice', voice)
    notable.voice_total = { voice, total_count: (count || 0) + (hiCount || 0) }
  }

  // Days since last lit_me_up
  const { data: lastLit } = await sb
    .from('quest_tasks')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('task_signal', 'lit_me_up')
    .eq('done', true)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastLit?.completed_at) {
    const days = Math.floor((Date.now() - new Date(lastLit.completed_at).getTime()) / 86400000)
    if (days > 3) notable.days_since_lit_me_up = days
  }

  // Action score after
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const [cRes, tRes, dRes] = await Promise.all([
    sb.from('quest_completions').select('reflection_text')
      .eq('user_id', userId).eq('quest_category', 'Groans')
      .gte('created_at', sevenDaysAgo).not('reflection_text', 'is', null),
    sb.from('quest_tasks').select('task_signal')
      .eq('user_id', userId).not('task_signal', 'is', null)
      .gte('completed_at', sevenDaysAgo),
    sb.from('nervous_system_checkins').select('after_state')
      .eq('user_id', userId).eq('checkin_type', 'daily')
      .gte('created_at', sevenDaysAgo),
  ])
  let aAligned = 0, aTotal = 0
  ;(cRes.data || []).forEach((r: any) => {
    try { const p = JSON.parse(r.reflection_text); if (p.wahoo_classification) { aTotal++; if (['vibe','wahoo','peace'].includes(p.wahoo_classification)) aAligned++ } } catch {}
  })
  ;(tRes.data || []).forEach((t: any) => { aTotal++; if (t.task_signal === 'lit_me_up') aAligned++ })
  ;(dRes.data || []).forEach((c: any) => { if (!c.after_state) return; aTotal++; if (['vibe_rise','ventral'].includes(c.after_state)) aAligned++ })
  notable.action_score_after = aTotal >= MINIMUM_ACTIONS ? Math.round((aAligned / aTotal) * 100) : null

  return textResult({
    synced,
    totals: {
      total_rp: totalRP,
      total_xp: totalXP,
      total_clusters_touched: totalClusters,
      chains_healed: chainsHealed,
    },
    notable_evidence: Object.keys(notable).length > 0 ? notable : null,
    context_mapping_saved: contextMappingSaved,
  })
}

// --- Process a single commit entry ---

async function processEntry(
  entry: any, userId: string, sb: any, weekStart: string
): Promise<any> {
  const { task_text, skill_tags, state } = entry

  // Validate required fields
  if (!task_text) throw new Error('task_text is required')
  if (!skill_tags || !Array.isArray(skill_tags) || skill_tags.length === 0) {
    throw new Error('skill_tags must be a non-empty array')
  }
  if (!VALID_STATES.includes(state)) {
    throw new Error(`state must be one of: ${VALID_STATES.join(', ')}`)
  }

  // Validate skill_tags against taxonomy
  const invalidTags = skill_tags.filter((t: string) => !VALID_SKILL_IDS.includes(t as any))
  if (invalidTags.length > 0) {
    throw new Error(`Invalid skill_tags: ${invalidTags.join(', ')}. Valid: ${VALID_SKILL_IDS.join(', ')}`)
  }

  // --- Step 1: Resolve quest ---
  if (entry.quest_id && entry.create_quest) {
    throw new Error('Provide either quest_id or create_quest, not both')
  }

  let questId = entry.quest_id
  let questLabel = ''
  let questSkillTags: string[] = []

  if (entry.create_quest) {
    const cq = entry.create_quest
    const { data: newQuest, error: qErr } = await sb.from('quests').insert({
      user_id: userId,
      label: cq.label,
      career_id: cq.career_id || null,
      predicted_state: STATE_TO_WAHOO[cq.predicted_state] || cq.predicted_state,
      status: 'active',
    }).select('id').single()
    if (qErr) throw new Error(`Failed to create quest: ${qErr.message}`)
    questId = newQuest.id
    questLabel = cq.label

    // Async skill tagging (fire-and-forget, chain healer catches failures later)
    healMissingSkillTags(sb, questId, cq.label).catch(() => {})
  } else if (questId) {
    // Validate existing quest
    const { data: quest, error: qErr } = await sb.from('quests')
      .select('id, label, skill_tags, status')
      .eq('id', questId)
      .eq('user_id', userId)
      .single()
    if (qErr || !quest) throw new Error('Quest not found or does not belong to you')
    if (quest.status !== 'active') throw new Error(`Quest "${quest.label}" is ${quest.status}. Reopen it or pick another quest.`)
    questLabel = quest.label
    questSkillTags = quest.skill_tags || []
  } else {
    throw new Error('Either quest_id or create_quest is required')
  }

  // --- Step 2: Resolve task ---
  let taskId: string
  let rpAwarded = 0
  let chainHealed = false

  if (entry.complete_existing_task_id) {
    // Validate existing task
    const { data: task, error: tErr } = await sb.from('quest_tasks')
      .select('id, done, quest_id')
      .eq('id', entry.complete_existing_task_id)
      .eq('user_id', userId)
      .single()
    if (tErr || !task) throw new Error('Task not found')
    if (task.done) throw new Error('Task already completed')
    if (task.quest_id !== questId) throw new Error('Task does not belong to the specified quest')
    taskId = task.id
    // No creation RP for existing task
  } else {
    // Get max sort_order for this quest
    const { data: maxRow } = await sb.from('quest_tasks')
      .select('sort_order')
      .eq('quest_id', questId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextSort = (maxRow?.sort_order ?? -1) + 1

    // Insert new task
    const { data: newTask, error: tErr } = await sb.from('quest_tasks').insert({
      quest_id: questId,
      user_id: userId,
      text: task_text,
      sort_order: nextSort,
      is_courage_challenge: false,
    }).select('id').single()
    if (tErr) throw new Error(`Failed to create task: ${tErr.message}`)
    taskId = newTask.id

    // 2 RP for task creation
    await sb.rpc('increment_scores', {
      p_user_id: userId, p_project_id: null,
      p_category: 'courage', p_points: 2, p_week_start: weekStart,
    })
    rpAwarded += 2
  }

  // --- Step 3: Complete task ---
  const taskSignal = STATE_TO_TASK_SIGNAL[state] || 'was_okay'
  await sb.from('quest_tasks').update({
    done: true,
    completed_at: new Date().toISOString(),
    task_signal: taskSignal,
  }).eq('id', taskId).eq('user_id', userId)

  // 3 RP for task completion
  await sb.rpc('increment_scores', {
    p_user_id: userId, p_project_id: null,
    p_category: 'courage', p_points: 3, p_week_start: weekStart,
  })
  rpAwarded += 3

  // --- Step 4: State-dependent writes ---
  let identitySaved: string | null = null
  let voiceRecorded: string | null = null

  if (state === 'vibe_rise') {
    // Insert quest_completions with reflection_text JSON (matches GroanCompletionModal format)
    const reflectionJSON = {
      challenge_id: null,
      source_label: questLabel,
      visibility_layer: null,
      before_state: null,
      after_state: null,
      wahoo_classification: STATE_TO_WAHOO[state],
      identity_statement: entry.identity_statement || null,
      voice_objection: null,
      expectation_result: null,
      reflection: null,
      submitted_via: 'mcp',
    }
    await sb.from('quest_completions').insert({
      user_id: userId,
      challenge_instance_id: null,
      quest_id: `mcp_task_${taskId}`,
      quest_category: 'Groans',
      quest_type: 'Rewire',
      points_earned: 0, // RP already awarded via increment_scores
      challenge_day: 0,
      project_id: null,
      reflection_text: JSON.stringify(reflectionJSON),
    })
    identitySaved = entry.identity_statement || null

    // Cross-pollination
    if (entry.cross_quest_ids?.length > 0) {
      const cpRows = entry.cross_quest_ids.map((targetId: string) => ({
        user_id: userId,
        source_quest_id: questId,
        target_quest_id: targetId,
        groan_challenge_id: null,
      }))
      await sb.from('quest_cross_pollination').insert(cpRows).catch(() => {})
    }
  }

  if (state === 'stress' && entry.protective_voice) {
    // Validate voice
    if (VALID_PROTECTIVE_VOICES.includes(entry.protective_voice as any)) {
      await sb.from('nervous_system_checkins').insert({
        user_id: userId,
        after_state: 'sympathetic',
        checkin_type: 'stall',
        protective_voice: entry.protective_voice,
        source_quest_id: questId,
      })
      voiceRecorded = entry.protective_voice
    }
  }

  // --- Step 5: Skill XP + behavioral evidence (courage-level states only) ---
  let xpAwarded: Record<string, number> | null = null
  let clustersUpdated = 0

  if (COURAGE_STATES.includes(state as any)) {
    xpAwarded = {}
    const uniqueSkillTags = [...new Set(skill_tags as string[])]
    for (const skillId of uniqueSkillTags) {
      await sb.rpc('increment_skill_xp', { p_user_id: userId, p_skill_id: skillId })
      xpAwarded[skillId] = 1
    }

    // Behavioral evidence on matching clusters
    const effectiveSkillTags = questSkillTags.length > 0 ? questSkillTags : skill_tags
    const matchingClusters = await findMatchingClusters(sb, userId, effectiveSkillTags)
    for (const cluster of matchingClusters) {
      await sb.rpc('increment_behavioral_evidence', { p_cluster_id: cluster.id })
      clustersUpdated++
    }
  }

  // --- Step 6: Chain healing ---
  if (questId && questSkillTags.length === 0 && !entry.create_quest) {
    // Quest exists but has no skill_tags — heal it
    const healed = await healMissingSkillTags(sb, questId, questLabel)
    if (healed.skill_tags.length > 0) chainHealed = true
  }

  return {
    task_text,
    quest_label: questLabel,
    skill_tags,
    state,
    rp_awarded: rpAwarded,
    xp_awarded: xpAwarded,
    clusters_updated: clustersUpdated,
    identity_saved: identitySaved,
    voice_recorded: voiceRecorded,
    chain_healed: chainHealed,
  }
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
        case 'get_interior_scoreboard':
          result = await handleGetInteriorScoreboard(toolArgs, auth)
          break
        case 'commit_progress':
          result = await handleCommitProgress(toolArgs, auth)
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
