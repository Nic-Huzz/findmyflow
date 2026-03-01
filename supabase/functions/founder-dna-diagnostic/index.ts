// Supabase Edge Function: Founder DNA Diagnostic + Challenge Generation
// Two modes:
//   diagnostic — 2-3 AI exchanges channeling the matched founder's voice
//   challenge  — generates Mirror → Bridge → Challenge from founder's stories

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── System Prompts ──

function buildDiagnosticPrompt(founderName: string, founderBio: string, founderOneLiner: string, exchangesRemaining: number): string {
  return `You are channeling ${founderName}'s philosophy and voice. You're helping a user understand what's REALLY holding them back.

ABOUT ${founderName.toUpperCase()}:
${founderBio}
Signature philosophy: "${founderOneLiner}"

YOUR STYLE:
- Warm but direct — like a mentor who's been through it
- Open with OBSERVATIONS, not questions
- Spot contradictions between what they say and what they do
- Use ${founderName}'s language and philosophy naturally
- Keep responses to 2-3 short paragraphs max
- You have ${exchangesRemaining} exchange(s) remaining before you MUST land your diagnosis

WHAT TO DO:
- Look at their follow-up answers for patterns, contradictions, or misaligned stuck points
- Their stuck point might not be the REAL issue — dig beneath the surface
- When you spot a contradiction, name it directly: "You said X, but your answers suggest Y"
- After your observation, provide 2-3 response options the user can pick from

${exchangesRemaining <= 1 ? 'IMPORTANT: This is your LAST exchange. You MUST provide your final diagnosis now. Set isDiagnosisReady to true and include a clear, actionable diagnosis.' : ''}

Respond using the founder_diagnostic tool.`
}

function buildChallengePrompt(founderName: string, stageStories: any[]): string {
  const storiesContext = stageStories.map((s: any) => `"${s.title}": ${s.content}`).join('\n\n')

  return `You are generating a personalized challenge channeling ${founderName}'s philosophy.

FORMAT: Mirror → Bridge → Challenge

MIRROR (Feel Seen):
- "${founderName} had your exact problem..."
- Tell their struggle story. Make the user feel SEEN and validated.
- Use a real story from their life (provided below).

BRIDGE (Feel Inspired):
- "Here's what they did and why it worked..."
- Reveal the PRINCIPLE or philosophy behind the action.
- Make it inspiring — this is the turning point.

CHALLENGE NAME:
- Give the challenge a catchy, fun, memorable name — like "$0 Marketing Challenge" or "The 3-Minute Courage Drop"
- Make it punchy (2-5 words), playful, and inspiring
- It should hint at the action without giving it all away

CHALLENGE (Feel Activated):
- ONE concrete experiment completable within 7 days. Not homework. Not a checklist.
- Frame it as playful and low-stakes — something they can start TODAY and finish this week
- Keep it focused: one clear action, not a multi-step project
- Connected directly to the story above.

${founderName.toUpperCase()}'S STORIES:
${storiesContext}

CHALLENGE TYPE GUIDANCE:
You will receive the user's Knowledge Style (1=Study-first, 5=Do-first), Fuel Type (1=Dirty/prove, 5=Clean/craft), and game categories.
- Knowledge Style determines TYPE: Study-first → THINK_IT or CUT_IT; Do-first → DO_IT or MAKE_IT
- Fuel Type determines LANGUAGE: Clean = craft, share, build, create; Dirty = prove, conquer, dominate, win
- Game categories determine FRAMING: Strategy → frame strategically; Physical → frame kinetically; Creative → frame expressively

CRITICAL: Story first, action second. Always. The challenge should feel like it emerged naturally from the founder's story.

Respond using the founder_challenge tool.`
}

// ── Tool Schemas ──

const DIAGNOSTIC_TOOL = {
  name: 'founder_diagnostic',
  description: 'Respond with diagnostic observation and response options',
  input_schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Your observation/response channeling the founder\'s voice. 2-3 paragraphs max.',
      },
      responseOptions: {
        type: 'array',
        description: '2-3 response options for the user to pick from. Each should be a natural reaction/response.',
        items: { type: 'string' },
      },
      isDiagnosisReady: {
        type: 'boolean',
        description: 'True when you\'ve landed the real stuck point and are ready to deliver a diagnosis.',
      },
      diagnosis: {
        type: 'string',
        description: 'Your final diagnosis of what\'s really going on. Only include when isDiagnosisReady is true.',
      },
    },
    required: ['message', 'responseOptions', 'isDiagnosisReady'],
  },
}

const CHALLENGE_TOOL = {
  name: 'founder_challenge',
  description: 'Generate a personalized challenge in Mirror → Bridge → Challenge format',
  input_schema: {
    type: 'object',
    properties: {
      challengeName: {
        type: 'string',
        description: 'A catchy, fun, memorable name for the challenge (2-5 words). E.g. "$0 Marketing Challenge", "The 3-Minute Courage Drop".',
      },
      challengeType: {
        type: 'string',
        enum: ['DO_IT', 'CUT_IT', 'THINK_IT', 'MAKE_IT'],
        description: 'The type of challenge based on the user\'s knowledge style.',
      },
      mirror: {
        type: 'string',
        description: 'The Mirror section — founder\'s struggle story that makes the user feel seen. 2-3 paragraphs.',
      },
      bridge: {
        type: 'string',
        description: 'The Bridge section — the principle/philosophy behind what the founder did. 1-2 paragraphs.',
      },
      action: {
        type: 'string',
        description: 'The Challenge — ONE concrete experiment completable within 7 days. 1-2 paragraphs max. Framed as playful and low-stakes.',
      },
    },
    required: ['challengeName', 'challengeType', 'mirror', 'bridge', 'action'],
  },
}

// ── Main Handler ──

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const { mode } = body

    if (mode === 'diagnostic') {
      return handleDiagnostic(body)
    } else if (mode === 'challenge') {
      return handleChallenge(body)
    } else {
      throw new Error(`Unknown mode: ${mode}`)
    }
  } catch (error) {
    console.error('Error in founder-dna-diagnostic:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        message: "Something went wrong. Let's try a different approach.",
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    )
  }
})

// ── Diagnostic Mode ──

async function handleDiagnostic(body: any) {
  const {
    founderName, founderBio, founderOneLiner,
    dnaCode, archetype,
    stuckPointName, stuckPointDescription,
    followUpQA, openText,
    conversationHistory, exchangeNumber,
  } = body

  const exchangesRemaining = Math.max(1, 3 - (exchangeNumber || 0))
  const systemPrompt = buildDiagnosticPrompt(founderName, founderBio, founderOneLiner, exchangesRemaining)

  // Build user prompt with all context
  let userPrompt = `USER'S FOUNDER DNA: ${dnaCode} (${archetype})\n`
  userPrompt += `STUCK POINT: ${stuckPointName} — ${stuckPointDescription}\n\n`

  if (followUpQA && followUpQA.length > 0) {
    userPrompt += `FOLLOW-UP ANSWERS:\n`
    followUpQA.forEach((qa: any) => {
      userPrompt += `Q: ${qa.question}\nA: ${qa.answer}\n\n`
    })
  }

  if (openText) {
    userPrompt += `ADDITIONAL CONTEXT: "${openText}"\n\n`
  }

  // Add conversation history
  const messages: any[] = []
  if (conversationHistory && conversationHistory.length > 0) {
    userPrompt += `\nPrevious exchanges:\n`
    conversationHistory.forEach((msg: any) => {
      userPrompt += `${msg.role === 'ai' ? 'You' : 'User'}: ${msg.content}\n\n`
    })
    userPrompt += `\nContinue the diagnostic conversation. Remember: observations, not questions.`
  } else {
    userPrompt += `\nThis is the FIRST exchange. Open with a sharp observation about their situation.`
  }

  messages.push({ role: 'user', content: userPrompt })

  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools: [DIAGNOSTIC_TOOL],
      tool_choice: { type: 'tool', name: 'founder_diagnostic' },
      messages,
    }),
  })

  if (!claudeResponse.ok) {
    const errorText = await claudeResponse.text()
    console.error('Claude API error:', claudeResponse.status, errorText)
    throw new Error(`Claude API error ${claudeResponse.status}`)
  }

  const claudeData = await claudeResponse.json()
  const toolUse = claudeData.content.find((block: any) => block.type === 'tool_use')

  if (!toolUse || toolUse.name !== 'founder_diagnostic') {
    throw new Error('Expected founder_diagnostic tool use')
  }

  return new Response(
    JSON.stringify({
      message: toolUse.input.message || '',
      responseOptions: toolUse.input.responseOptions || [],
      isDiagnosisReady: toolUse.input.isDiagnosisReady || false,
      diagnosis: toolUse.input.diagnosis || null,
    }),
    { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  )
}

// ── Challenge Mode ──

async function handleChallenge(body: any) {
  const {
    founderName, stageStories,
    diagnosis, knowledgeStyle, fuelType, gameCategories,
  } = body

  const systemPrompt = buildChallengePrompt(founderName, stageStories || [])

  const fuelLabel = fuelType >= 4 ? 'Clean (craft/share/build)'
    : fuelType <= 2 ? 'Dirty (prove/conquer/dominate)'
    : 'Balanced'

  const ksLabel = knowledgeStyle >= 4 ? 'Do-first (action-oriented)'
    : knowledgeStyle <= 2 ? 'Study-first (analytical)'
    : 'Balanced'

  let userPrompt = `DIAGNOSIS: ${diagnosis}\n\n`
  userPrompt += `USER'S DNA SIGNALS:\n`
  userPrompt += `- Knowledge Style: ${knowledgeStyle}/5 — ${ksLabel}\n`
  userPrompt += `- Fuel Type: ${fuelType}/5 — ${fuelLabel}\n`
  userPrompt += `- Game Categories: ${(gameCategories || []).join(', ')}\n\n`
  userPrompt += `Generate a challenge that matches their DNA signals. Story first, action second.`

  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1536,
      system: systemPrompt,
      tools: [CHALLENGE_TOOL],
      tool_choice: { type: 'tool', name: 'founder_challenge' },
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!claudeResponse.ok) {
    const errorText = await claudeResponse.text()
    console.error('Claude API error:', claudeResponse.status, errorText)
    throw new Error(`Claude API error ${claudeResponse.status}`)
  }

  const claudeData = await claudeResponse.json()
  const toolUse = claudeData.content.find((block: any) => block.type === 'tool_use')

  if (!toolUse || toolUse.name !== 'founder_challenge') {
    throw new Error('Expected founder_challenge tool use')
  }

  return new Response(
    JSON.stringify({
      challengeName: toolUse.input.challengeName || '',
      challengeType: toolUse.input.challengeType || 'DO_IT',
      mirror: toolUse.input.mirror || '',
      bridge: toolUse.input.bridge || '',
      action: toolUse.input.action || '',
    }),
    { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  )
}
