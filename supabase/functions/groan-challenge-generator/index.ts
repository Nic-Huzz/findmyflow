// Supabase Edge Function: Groan Challenge Generator
// Uses Claude AI to generate personalized courage challenges based on
// Flow Finder data (skills, problems, personas) and visibility layers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Visibility layer definitions for prompt context
const VISIBILITY_LAYERS = {
  screen: {
    label: 'SCREEN',
    icon: '📱',
    fear: 'Being seen online',
    description: 'Behind a screen - sharing content, posting, creating online presence'
  },
  live: {
    label: 'LIVE',
    icon: '⚡',
    fear: 'Real-time judgment',
    description: 'Face-to-face or live video - real-time interaction without editing'
  },
  money: {
    label: 'MONEY',
    icon: '💰',
    fear: '"Am I worth it?"',
    description: 'Asking for money - pricing, selling, stating your value'
  },
  vulnerable: {
    label: 'VULNERABLE',
    icon: '💗',
    fear: 'Rejected for real self',
    description: 'Deep vulnerability - sharing authentic struggles, imperfections, real story'
  },
  authority: {
    label: 'AUTHORITY',
    icon: '👑',
    fear: 'Imposter syndrome',
    description: 'Claiming expertise - positioning as leader, expert, authority in your space'
  }
}

// Archetype voice descriptions for personalized language
const ESSENCE_ARCHETYPES = {
  radiant_rebel: 'Bold, passionate energy that challenges norms and inspires change',
  gentle_sage: 'Calm, wise presence that guides with patience and depth',
  creative_alchemist: 'Innovative spirit that transforms ideas into magic',
  sacred_connector: 'Heart-centered energy that brings people together',
  grounded_guardian: 'Stable, protective force that creates safety and structure',
  electric_activator: 'High-energy catalyst that sparks action and momentum',
  mystical_dreamer: 'Intuitive visionary that sees possibilities others miss'
}

const PROTECTIVE_ARCHETYPES: Record<string, string> = {
  controller: 'Manages everything, controls outcomes and image, can\'t let go or rest',
  ghost: 'Withdraws, avoids sharing, leaves before things get intense',
  perfectionist: 'Delays due to fear of imperfection, gas and brake at the same time',
  auto_pilot: 'Goes through the motions, checked out, numb to desire',
  people_pleaser: 'Seeks approval, struggles to set boundaries, over-gives',
  // Legacy alias
  performer: 'Manages everything, controls outcomes and image, can\'t let go or rest',
}

const CHALLENGE_GENERATION_PROMPT = `
You are a courage coach helping someone grow past their comfort zone through personalized challenges.

Your task: Generate ONE specific, actionable challenge that combines a user's unique strength/focus with a particular visibility fear.

CONTEXT:
- Source type: {{sourceType}} (skill, problem they solve, or persona they serve)
- Source label: "{{sourceLabel}}"
- Source insight: "{{sourceInsight}}"
- Visibility layer: {{visibilityLayer}} - {{layerDescription}}
- Core fear at this layer: "{{layerFear}}"

{{archetypeContext}}

CHALLENGE REQUIREMENTS:
1. Be SPECIFIC - not generic advice, but a concrete action they can take THIS WEEK
2. Connect their unique {{sourceType}} to the {{visibilityLayer}} layer
3. Push them just past comfort without being overwhelming
4. Be completable in a single action (not an ongoing commitment)
5. Include a clear "done" state - they'll know when they've completed it

GOOD CHALLENGES:
- "Post a 30-second video sharing ONE mistake you made while [solving problem X] and what you learned"
- "DM 3 people who match your [persona type] and offer a free 15-minute call"
- "Quote your full price for [skill] to the next prospect without discounting or apologizing"

BAD CHALLENGES:
- "Be more visible online" (too vague)
- "Build an audience" (ongoing, not one action)
- "Overcome your fear" (not actionable)

TONE:
- Direct and encouraging, not preachy
- Acknowledge the fear without dwelling on it
- Focus on the exciting possibility on the other side

Return ONLY valid JSON (no markdown):
{
  "title": "Short, punchy title (3-6 words)",
  "description": "2-3 sentences explaining the specific challenge",
  "scaryScore": 7,
  "wahooScore": 8,
  "completionCriteria": "What counts as 'done'",
  "whyThisMatters": "Brief connection to their growth edge",
  "alternativeVersion": "Slightly easier version if this feels too much"
}

The scaryScore (1-10) represents how fear-inducing this typically is.
The wahooScore (1-10) represents how exciting/energizing this could be.
High scary + high wahoo = essence zone (this IS their authentic self trying to emerge).
`

// Prompt for Skill × Problem matrix challenges
const SKILL_PROBLEM_PROMPT = `
You are a courage coach helping someone grow past their comfort zone through personalized challenges.

Your task: Generate ONE specific, actionable challenge that combines a user's SKILL with a PROBLEM they can solve.

CONTEXT:
- Skill: "{{skillLabel}}"
  {{#if skillInsight}}Insight: "{{skillInsight}}"{{/if}}
- Problem: "{{problemLabel}}"
  {{#if problemInsight}}Insight: "{{problemInsight}}"{{/if}}
{{#if personaLabel}}
- Target Audience: "{{personaLabel}}"
  {{#if personaInsight}}Insight: "{{personaInsight}}"{{/if}}
{{/if}}

{{archetypeContext}}

CHALLENGE REQUIREMENTS:
1. Create a challenge that demonstrates using "{{skillLabel}}" to help someone with "{{problemLabel}}"
2. Be SPECIFIC - not generic advice, but a concrete action they can take THIS WEEK
3. The challenge should make them VISIBLE in some way (posting, reaching out, offering help)
4. Push them just past comfort without being overwhelming
5. Be completable in a single action (not an ongoing commitment)
6. Include a clear "done" state - they'll know when they've completed it
{{#if personaLabel}}
7. Tailor the challenge specifically for reaching "{{personaLabel}}"
{{/if}}

GOOD CHALLENGES:
- "Create a quick tip post showing how [skill] solves [problem] and share it in 2 communities where [persona] hangs out"
- "Record a 2-minute Loom video explaining your approach to [problem] using [skill], and send it to 3 people who might benefit"
- "Write a case study format post: 'How I used [skill] to help someone with [problem]' - even if hypothetical, make it specific"

BAD CHALLENGES:
- "Be more helpful online" (too vague)
- "Build an audience" (ongoing, not one action)
- "Share your expertise" (not specific enough)

TONE:
- Direct and encouraging, not preachy
- Frame it as an exciting opportunity to help people with their real skill
- Focus on the value they can provide, not just visibility

Return ONLY valid JSON (no markdown):
{
  "title": "Short, punchy title (3-6 words)",
  "description": "2-3 sentences explaining the specific challenge",
  "scaryScore": 7,
  "wahooScore": 8,
  "completionCriteria": "What counts as 'done'",
  "whyThisMatters": "Brief connection to their growth edge",
  "alternativeVersion": "Slightly easier version if this feels too much"
}

The scaryScore (1-10) represents how fear-inducing this typically is.
The wahooScore (1-10) represents how exciting/energizing this could be.
High scary + high wahoo = essence zone (this IS their authentic self trying to emerge).
`

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Check API key first
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const requestBody = await req.json()

    const {
      sourceType,
      sourceLabel,
      sourceInsight,
      visibilityLayer,
      essenceArchetype,
      protectiveArchetype,
      useArchetypeLanguage = false,
      previousChallengesTitles = [],
      skipFeedback = null,
      // Skill × Problem matrix fields
      skillId,
      skillLabel,
      skillInsight,
      problemId,
      problemLabel,
      problemInsight,
      personaId,
      personaLabel,
      personaInsight
    } = requestBody

    // Check request type
    const isMovementRequest = sourceType === 'movement'
    const isSkillProblemRequest = !isMovementRequest && (sourceType === 'skill_x_problem' || (skillLabel && problemLabel))

    console.log('Received request:', {
      sourceType,
      sourceLabel,
      visibilityLayer,
      isSkillProblemRequest,
      skillLabel,
      problemLabel
    })

    // Validate required fields based on request type
    if (isMovementRequest) {
      // Movement/Strike requests only need movement data
      if (!requestBody.movementData) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: movementData' }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
    } else if (isSkillProblemRequest) {
      if (!skillLabel || !problemLabel) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields for Skill × Problem: skillLabel, problemLabel' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }
    } else {
      if (!sourceType || !sourceLabel || !visibilityLayer) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: sourceType, sourceLabel, visibilityLayer' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      // Validate visibility layer exists (only needed for standard requests)
      if (!VISIBILITY_LAYERS[visibilityLayer as keyof typeof VISIBILITY_LAYERS]) {
        return new Response(
          JSON.stringify({ error: `Invalid visibility layer: ${visibilityLayer}` }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }
    }

    // Build archetype context if enabled
    let archetypeContext = ''
    if (useArchetypeLanguage && (essenceArchetype || protectiveArchetype)) {
      archetypeContext = '\nARCHETYPE CONTEXT (use this to personalize language):\n'
      if (essenceArchetype && ESSENCE_ARCHETYPES[essenceArchetype as keyof typeof ESSENCE_ARCHETYPES]) {
        archetypeContext += `- Essence: ${essenceArchetype} - ${ESSENCE_ARCHETYPES[essenceArchetype as keyof typeof ESSENCE_ARCHETYPES]}\n`
      }
      if (protectiveArchetype && PROTECTIVE_ARCHETYPES[protectiveArchetype as keyof typeof PROTECTIVE_ARCHETYPES]) {
        archetypeContext += `- Protective pattern: ${protectiveArchetype} - ${PROTECTIVE_ARCHETYPES[protectiveArchetype as keyof typeof PROTECTIVE_ARCHETYPES]}\n`
        archetypeContext += `(Design the challenge to gently push against their ${protectiveArchetype} pattern)\n`
      }
    }

    // Build avoidance context if there are previous challenges
    let avoidanceContext = ''
    if (previousChallengesTitles.length > 0) {
      avoidanceContext = `\n\nAVOID DUPLICATES - The user has already seen these challenges:\n${previousChallengesTitles.map((t: string) => `- "${t}"`).join('\n')}\nGenerate something DIFFERENT.\n`
    }

    // Add skip feedback context if provided
    let skipContext = ''
    if (skipFeedback) {
      skipContext = `\n\nPREVIOUS SKIP FEEDBACK: The user skipped a similar challenge because: "${skipFeedback}". Adjust accordingly.\n`
    }

    // Build the prompt based on request type
    let prompt: string
    let useModel = 'claude-haiku-4-5-20251001'

    if (isMovementRequest) {
      // Movement/Strike request — generate 2-3 Strike ideas using Sonnet
      useModel = 'claude-sonnet-4-20250514'
      const md = requestBody.movementData
      const strikeType = requestBody.strikeType || 'any'
      const outcome = requestBody.outcome || 'fill_room'
      const archetype = requestBody.essenceArchetype || ''
      const experienceName = requestBody.experienceName || ''

      prompt = `You generate Lightning Strike ideas for experience creators (workshop/retreat facilitators). A Lightning Strike is a bold, public action designed to make the market come to them.

THE CREATOR'S MOVEMENT:
- Problem they solve: ${md.woundProblem || 'Not specified'}
- Old category (how the world currently solves it): ${md.current || 'Not specified'}
- What's wrong with that: ${md.wrong || 'Not specified'}
- Their solution: ${md.mine || 'Not specified'}
- Movement statement: ${md.ruleStatement || 'Not specified'}
${experienceName ? `- Next experience: "${experienceName}"` : ''}

STRIKE TYPE CHOSEN: ${strikeType}
${strikeType === 'fight' ? '(Name what\'s wrong with the old way publicly. Force the market to pick a side.)' : ''}
${strikeType === 'stunt' ? '(Do something in public that makes people say "wait, what?")' : ''}
${strikeType === 'functional' ? '(Prove the method works in real time. Let people experience the shift.)' : ''}
${strikeType === 'culture_creating' ? '(Create a ritual, phrase, or moment that attendees take home and spread.)' : ''}

OUTCOME GOAL: ${outcome === 'fill_room' ? 'Fill the room for their next experience' : outcome === 'go_public' ? 'Declare their movement publicly for the first time' : 'Cement their position as the leader in this space'}

${archetype ? `ESSENCE ARCHETYPE: ${archetype} (their natural energy and how they show up)` : ''}

Generate exactly 3 Lightning Strike ideas. Each should be:
- Doable within 2 weeks with zero budget
- Specific enough to execute (not vague advice)
- Scary enough to be a real groan (courage challenge)
- Connected to their movement (educates the market about why the old way doesn't work)

Return ONLY valid JSON:
{
  "strikes": [
    { "title": "Short punchy title (3-6 words)", "description": "2-3 sentences explaining what to do", "hook": "One sentence explaining why this would make people talk" }
  ]
}`

      console.log('Generating Strike ideas:', { strikeType, outcome, archetype })
    } else if (isSkillProblemRequest) {
      // Skill × Problem matrix prompt
      prompt = SKILL_PROBLEM_PROMPT
        .replace('{{skillLabel}}', skillLabel)
        .replace(/\{\{#if skillInsight\}\}.*?\{\{\/if\}\}/gs,
          skillInsight ? `Insight: "${skillInsight}"` : '')
        .replace('{{problemLabel}}', problemLabel)
        .replace(/\{\{#if problemInsight\}\}.*?\{\{\/if\}\}/gs,
          problemInsight ? `Insight: "${problemInsight}"` : '')
        .replace(/\{\{#if personaLabel\}\}[\s\S]*?\{\{\/if\}\}/g,
          personaLabel
            ? `- Target Audience: "${personaLabel}"\n  ${personaInsight ? `Insight: "${personaInsight}"` : ''}`
            : '')
        .replace('{{archetypeContext}}', archetypeContext)
        + avoidanceContext
        + skipContext

      console.log('📝 Generating Skill × Problem challenge for:', {
        skillLabel,
        problemLabel,
        personaLabel,
        useArchetypeLanguage
      })
    } else {
      // Standard challenge prompt (visibility layer based)
      const layer = VISIBILITY_LAYERS[visibilityLayer as keyof typeof VISIBILITY_LAYERS]

      prompt = CHALLENGE_GENERATION_PROMPT
        .replace('{{sourceType}}', sourceType)
        .replace('{{sourceLabel}}', sourceLabel)
        .replace('{{sourceInsight}}', sourceInsight || 'No additional insight provided')
        .replace('{{visibilityLayer}}', layer.label)
        .replace('{{layerDescription}}', layer.description)
        .replace('{{layerFear}}', layer.fear)
        .replace('{{archetypeContext}}', archetypeContext)
        + avoidanceContext
        + skipContext

      console.log('📝 Generating groan challenge for:', {
        sourceType,
        sourceLabel,
        visibilityLayer,
        useArchetypeLanguage
      })
    }

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: useModel,
        max_tokens: isMovementRequest ? 1024 : 512,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      throw new Error(`Claude API error ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    const extractedText = claudeData.content[0].text

    // Parse JSON response
    let result
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        result = JSON.parse(extractedText)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', extractedText)
      throw new Error('Invalid JSON response from Claude')
    }

    // Movement requests return array of strikes, not a single challenge
    if (isMovementRequest) {
      const strikes = (result.strikes || [result]).map((s: any) => ({
        title: s.title || 'Lightning Strike',
        description: s.description || '',
        hook: s.hook || '',
      }))
      return new Response(
        JSON.stringify({ strikes, generatedAt: new Date().toISOString(), model: useModel }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Ensure proper structure and clamp scores
    const response: Record<string, any> = {
      title: result.title || 'Courage Challenge',
      description: result.description || '',
      scaryScore: Math.min(10, Math.max(1, result.scaryScore || 5)),
      wahooScore: Math.min(10, Math.max(1, result.wahooScore || 5)),
      completionCriteria: result.completionCriteria || 'Complete the action described',
      whyThisMatters: result.whyThisMatters || '',
      alternativeVersion: result.alternativeVersion || null,
      generatedAt: new Date().toISOString(),
      model: 'claude-haiku-4-5-20251001'
    }

    // Add metadata based on request type
    if (isSkillProblemRequest) {
      response.sourceType = 'skill_x_problem'
      response.skillId = skillId
      response.skillLabel = skillLabel
      response.problemId = problemId
      response.problemLabel = problemLabel
      response.personaId = personaId || null
      response.personaLabel = personaLabel || null
      response.sourceLabel = personaLabel
        ? `${skillLabel} × ${problemLabel} (for ${personaLabel})`
        : `${skillLabel} × ${problemLabel}`
    } else {
      response.sourceType = sourceType
      response.sourceLabel = sourceLabel
      response.visibilityLayer = visibilityLayer
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in groan-challenge-generator:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
