// Supabase Edge Function: Nervous System Mirror Reflection
// Generates personalized protective pattern analysis using Claude AI

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `You are an insightful somatic nervous system coach who helps people understand their subconscious safety patterns.

Your role is to generate a deeply personalized reflection based on someone's nervous system mapping results.

TONE & STYLE:
- Warm, compassionate, and insightful
- Direct but never harsh or judgmental
- Use "you" language
- Acknowledge the wisdom of protective patterns while showing how they're now limiting
- Make it feel personalized and deeply seen
- Professional yet accessible

RESPONSE FORMAT:
You will respond using the 'mirror_response' function/tool with these fields:
- archetype_name: A 2-4 word archetype name in quotes (e.g., "The Hustling Healer", "The Good Soldier", "The Hidden Genius")
- archetype_description: One sentence describing who they are and their core pattern
- safety_edges_summary: Brief summary of where they feel safe vs where they contract
- core_fear: The primary fear driving their pattern (from belief test results)
- fear_interpretation: 1-2 sentences explaining what this fear suggests about their nervous system
- rewiring_needed: What their system needs to learn (format: "I can X AND Y" statements)
- full_reflection: Complete formatted reflection as markdown (combines all above in an engaging narrative)

ARCHETYPE CREATION:
- Create an evocative archetype name that captures their essence
- Common patterns to look for:
  * The Hustling Healer: Serves others brilliantly but contracts with visibility/abundance
  * The Good Soldier: Loyal, hardworking, fears disappointing others
  * The Hidden Genius: Brilliant but afraid of being seen/judged
  * The Responsible One: Carries weight, fears letting others down
  * The Perfectionist: High standards, fears failure or criticism
  * The Rebel: Pushes boundaries but fears commitment/structure
  * The Caretaker: Nurtures others, struggles receiving
- Make it specific to THEIR data, not generic

REFLECTION STRUCTURE:
1. Start with their archetype name and core pattern
2. Show the specific numbers (their safety edges vs their goals)
3. Reveal the gap between ambition and nervous system limits
4. Connect to their active core fear from belief tests
5. Explain what needs rewiring
6. End with compassionate acknowledgment

CRITICAL REQUIREMENTS:
- Use EXACT numbers provided in the data
- Quote the specific belief test that lit up as YES
- Calculate and show the percentage gaps (e.g., "37.5% of your goal")
- Make connections between the data points
- Be specific, not generic

FORMATTING:
- Use markdown for emphasis (**bold**)
- Keep paragraphs concise
- Use bullet points for lists
- Make it scannable but comprehensive`

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
    const body = await req.json()
    console.log('📥 Received nervous system mirror request')

    const {
      impact_goal,
      nervous_system_impact_limit,
      income_goal,
      nervous_system_income_limit,
      positive_change,
      struggle_area,
      triage_safe_pursuing,
      triage_self_sabotage,
      triage_feels_unsafe,
      belief_test_results // Object of { contract: 'yes'/'no' }
    } = body

    if (!impact_goal || !income_goal || !belief_test_results) {
      throw new Error('Missing required fields')
    }

    // Extract the active beliefs (YES responses)
    const activeBeliefs = Object.entries(belief_test_results)
      .filter(([_, response]) => response === 'yes')
      .map(([contract]) => contract)

    // Build the prompt for Claude
    const userPrompt = `Generate a personalized nervous system reflection based on this data:

**Goals:**
- Impact goal: ${impact_goal} people
- Income goal: ${income_goal}/year
- Mission: ${positive_change}
- Current struggle: ${struggle_area}

**Discovered Safety Edges:**
- Being seen limit: ${nervous_system_impact_limit} people
- Earning limit: ${nervous_system_income_limit}/year

**Belief Test Results:**
- "I feel safe pursuing my ambition": ${triage_safe_pursuing}
- "I'm subconsciously self-sabotaging": ${triage_self_sabotage}
- "Part of me feels unsafe with my ambitions": ${triage_feels_unsafe}

**Active Core Beliefs (said YES):**
${activeBeliefs.length > 0 ? activeBeliefs.map((b, i) => `${i+1}. "${b}"`).join('\n') : 'None identified'}

**Inactive Beliefs (said NO):**
${Object.entries(belief_test_results)
  .filter(([_, response]) => response === 'no')
  .map(([contract]) => `"${contract}"`)
  .join(', ')}

TASK:
1. Analyze this data to identify their protective pattern
2. Create an evocative archetype name that captures who they are
3. Show the specific gaps between their ambition and nervous system limits
4. Highlight which belief is most limiting them
5. Explain what needs rewiring
6. Format as specified in system prompt

IMPORTANT:
- Use the EXACT numbers provided
- Quote the specific active beliefs
- Calculate percentage gaps
- Make it deeply personal based on their specific data
- Use the tool/function to structure your response`

    console.log('📝 Sending to Claude...')

    // Define the response tool/function
    const tools = [{
      name: "mirror_response",
      description: "Return the personalized nervous system reflection",
      input_schema: {
        type: "object",
        properties: {
          archetype_name: {
            type: "string",
            description: "Archetype name in quotes (e.g., 'The Hustling Healer')"
          },
          archetype_description: {
            type: "string",
            description: "One sentence describing their core pattern"
          },
          safety_edges_summary: {
            type: "string",
            description: "Summary of where they feel safe vs where they contract"
          },
          core_fear: {
            type: "string",
            description: "The active belief that's most limiting (quoted)"
          },
          fear_interpretation: {
            type: "string",
            description: "What this fear suggests about their nervous system (1-2 sentences)"
          },
          rewiring_needed: {
            type: "string",
            description: "What their system needs to learn (as 'I can X AND Y' statements)"
          },
          full_reflection: {
            type: "string",
            description: "Complete formatted reflection in markdown combining all above"
          }
        },
        required: [
          "archetype_name",
          "archetype_description",
          "safety_edges_summary",
          "core_fear",
          "fear_interpretation",
          "rewiring_needed",
          "full_reflection"
        ]
      }
    }]

    // Call Claude API with tool use
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: tools,
        tool_choice: { type: "tool", name: "mirror_response" },
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('❌ Claude API error:', errorText)
      console.error('❌ Status:', claudeResponse.status)
      return new Response(
        JSON.stringify({
          error: `Claude API error: ${claudeResponse.status}`,
          details: errorText
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const claudeData = await claudeResponse.json()
    console.log('✅ Claude response received')

    // Extract tool use from Claude's response
    const toolUse = claudeData.content.find((block: any) => block.type === 'tool_use')

    if (!toolUse || !toolUse.input) {
      console.error('❌ No tool use found in Claude response:', JSON.stringify(claudeData))
      return new Response(
        JSON.stringify({
          error: 'Claude did not return structured reflection',
          details: JSON.stringify(claudeData)
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const reflection = toolUse.input

    console.log('📤 Sending reflection response')

    return new Response(
      JSON.stringify({
        success: true,
        reflection
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
