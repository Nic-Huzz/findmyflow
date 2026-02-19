// supabase/functions/mcp-server/index.ts
// MCP server for FindMyFlow — implements MCP Streamable HTTP (JSON-RPC 2.0) directly.
// No SDK dependency. Each request is fully independent (stateless).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { FLOW_CONFIG, VALID_FLOW_IDS } from '../_shared/flowConfig.ts'
import { calculateOfferScores } from '../_shared/scoring.ts'
import { authenticateRequest, corsHeaders, type AuthResult } from '../_shared/auth.ts'

// --- Constants ---
const MCP_PROTOCOL_VERSION = '2025-03-26'
const SERVER_INFO = { name: 'findmyflow', version: '1.0.0' }
const SITE_URL = Deno.env.get('SITE_URL') || 'https://findmyflow.nichuzz.com'

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

// JSON-RPC error codes
const PARSE_ERROR = -32700
const INVALID_REQUEST = -32600
const METHOD_NOT_FOUND = -32601
const INVALID_PARAMS = -32602
const INTERNAL_ERROR = -32603

// --- Tool definitions (for tools/list response) ---

const TOOL_DEFINITIONS = [
  {
    name: 'list_flows',
    description: 'List all available FindMyFlow business assessments. Returns flow IDs, names, descriptions, and question counts.',
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
          description: 'Object mapping question IDs to answer values. Must contain exactly 10 entries. Example: {"q1_business_model": "coaching_consulting", "q2_price_point": "mid_ticket_500_2000", ...}',
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
]

// --- Tool handlers ---

async function handleListFlows(): Promise<any> {
  const flows = VALID_FLOW_IDS.map((id) => ({
    id,
    name: FLOW_CONFIG[id].name,
    description: FLOW_CONFIG[id].description,
    question_count: 10,
  }))
  return {
    content: [{ type: 'text', text: JSON.stringify(flows, null, 2) }],
  }
}

async function handleGetFlowQuestions(args: any): Promise<any> {
  const { flow_id } = args
  if (!flow_id || !VALID_FLOW_IDS.includes(flow_id)) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Invalid flow_id. Must be one of: ${VALID_FLOW_IDS.join(', ')}` }) }],
      isError: true,
    }
  }

  const config = FLOW_CONFIG[flow_id]
  const questionsUrl = `${SITE_URL}${encodePath(config.questionsPath)}`
  const resp = await fetch(questionsUrl)
  if (!resp.ok) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Failed to load questions for ${flow_id}` }) }],
      isError: true,
    }
  }

  const questionsData = await resp.json()
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
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
      }, null, 2),
    }],
  }
}

async function handleSubmitAssessment(
  args: any,
  auth: AuthResult
): Promise<any> {
  const { flow_id, answers, reasoning } = args

  // Validate flow_id
  if (!flow_id || !VALID_FLOW_IDS.includes(flow_id)) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Invalid flow_id. Must be one of: ${VALID_FLOW_IDS.join(', ')}` }) }],
      isError: true,
    }
  }

  // Validate answers count
  if (!answers || typeof answers !== 'object') {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'answers must be an object mapping question IDs to answer values' }) }],
      isError: true,
    }
  }
  const answerKeys = Object.keys(answers)
  if (answerKeys.length !== 10) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `answers must contain exactly 10 question responses, got ${answerKeys.length}` }) }],
      isError: true,
    }
  }

  // Check permissions
  const allowedFlows = auth.permissions?.flows || VALID_FLOW_IDS
  if (!allowedFlows.includes(flow_id)) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `API key does not have permission for flow: ${flow_id}` }) }],
      isError: true,
    }
  }

  const config = FLOW_CONFIG[flow_id]

  // Fetch offers JSON for scoring
  const offersUrl = `${SITE_URL}${encodePath(config.offersPath)}`
  const offersResp = await fetch(offersUrl)
  if (!offersResp.ok) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Failed to load scoring data for ${flow_id}` }) }],
      isError: true,
    }
  }
  const offersData = await offersResp.json()

  // Run scoring engine
  const scores = calculateOfferScores(answers, offersData)
  const topOffer = scores.find((s) => !s.isDisqualified) || scores[0]

  if (!topOffer) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Scoring produced no results. Check your answers.' }) }],
      isError: true,
    }
  }

  // Get user info for the insert
  const { data: userData } = await auth.supabase.auth.admin.getUserById(auth.userId)
  const user = userData?.user

  // Build and execute insert
  const sessionId = crypto.randomUUID()
  const columns = config.dbColumns

  const insertData: Record<string, any> = {
    session_id: sessionId,
    user_id: auth.userId,
    user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agent User',
    email: user?.email || null,
    responses: answers,
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
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Failed to save assessment results' }) }],
      isError: true,
    }
  }

  // Return success with scored results
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
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
      }, null, 2),
    }],
  }
}

// --- MCP protocol router ---

async function handleMcpRequest(body: any, auth: AuthResult): Promise<Response> {
  const { jsonrpc, id, method, params } = body

  // Validate JSON-RPC envelope
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
      // Client acknowledgment — no response needed for notifications
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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST (MCP Streamable HTTP transport)
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. MCP uses POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Authenticate via API key
  const authResult = await authenticateRequest(req)
  if (authResult instanceof Response) return authResult

  // Parse JSON-RPC body
  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonRpcError(null, PARSE_ERROR, 'Invalid JSON')
  }

  // Handle single request (batch support not needed for MVP)
  try {
    return await handleMcpRequest(body, authResult)
  } catch (err) {
    console.error('MCP handler error:', err)
    return jsonRpcError(body?.id ?? null, INTERNAL_ERROR, 'Internal server error')
  }
})
