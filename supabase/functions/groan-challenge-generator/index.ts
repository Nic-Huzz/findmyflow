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

const PROTECTIVE_ARCHETYPES = {
  ghost: 'Tends to disappear, avoid visibility, stay hidden',
  people_pleaser: 'Seeks approval, struggles to set boundaries, over-gives',
  perfectionist: 'Delays due to fear of imperfection, over-prepares',
  performer: 'Shows a polished mask, fears authentic vulnerability',
  controller: 'Micromanages, struggles to delegate or trust'
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
    const {
      sourceType,
      sourceLabel,
      sourceInsight,
      visibilityLayer,
      essenceArchetype,
      protectiveArchetype,
      useArchetypeLanguage = false,
      previousChallengesTitles = [],
      skipFeedback = null
    } = await req.json()

    // Validate required fields
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

    // Get visibility layer details
    const layer = VISIBILITY_LAYERS[visibilityLayer as keyof typeof VISIBILITY_LAYERS]
    if (!layer) {
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

    // Build the prompt
    const prompt = CHALLENGE_GENERATION_PROMPT
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

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
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

    // Ensure proper structure and clamp scores
    const response = {
      title: result.title || 'Courage Challenge',
      description: result.description || '',
      scaryScore: Math.min(10, Math.max(1, result.scaryScore || 5)),
      wahooScore: Math.min(10, Math.max(1, result.wahooScore || 5)),
      completionCriteria: result.completionCriteria || 'Complete the action described',
      whyThisMatters: result.whyThisMatters || '',
      alternativeVersion: result.alternativeVersion || null,
      // Include metadata
      sourceType,
      sourceLabel,
      visibilityLayer,
      generatedAt: new Date().toISOString(),
      model: 'claude-3-5-sonnet-20241022'
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
