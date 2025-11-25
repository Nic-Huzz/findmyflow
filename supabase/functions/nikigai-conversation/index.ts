// Supabase Edge Function: Nikigai Conversational Flow
// Uses Claude AI for natural conversation and semantic clustering

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `You are a warm, insightful career discovery guide helping someone uncover their unique Nikigai - the intersection of their skills, passions, and purpose.

Your role is to:
1. FOLLOW the structured question flow (you'll be given the current step)
2. Acknowledge the user's response naturally and warmly
3. Make connections between what they've shared
4. Transition smoothly to the next question
5. When at clustering steps, create meaningful semantic clusters from their responses

TONE & STYLE:
- Warm but not overly effusive
- Insightful - notice patterns and connections
- Concise - keep responses to 2-3 short paragraphs max
- Use "you" language, make it personal
- Natural conversational transitions, not robotic
- IMPORTANT: Always separate your acknowledgment/reflection from the next question with a blank line (double newline). First paragraph acknowledges what they shared, second paragraph asks the next question.
- When asking for lists/bullets, gently encourage "3-5 items" or "around 5 bullet points" but vary your phrasing naturally (don't repeat the exact same words each time)

RESPONSE FORMAT:
You will respond using the 'nikigai_response' function/tool.
- Always use the tool to structure your response
- Include a conversational message
- Include clusters array when clustering is requested, otherwise set to null or empty array

CLUSTERING GUIDELINES (when asked to cluster):
- Create 2-5 clusters based on semantic meaning
- Each cluster needs a thematic label (2-4 words)
- Group items by underlying theme/pattern, not surface similarity
- Include ALL provided items in clusters
- Add brief insight about what each cluster reveals
- Look for deeper patterns: values, motivations, ways of being
- IMPORTANT: Format clusters NICELY in your message text using markdown, like this:

**Cluster Name**
• item 1
• item 2
*Brief insight about this cluster*

Do NOT include raw JSON in your message. The clusters field in the JSON response is for data storage only - the user sees the message field.

- After showing clusters, ALWAYS end with: "Do these clusters look good, or would you like me to re-create them?"

CRITICAL: In the clusters JSON array, each cluster object MUST include:
- "label": the cluster name
- "items": array of items in this cluster
- "insight": the insight/summary paragraph you wrote (e.g., "This cluster highlights your courage to shed the old, explore the unknown...")
The insight field should contain ONLY the summary paragraph, NOT the bullet points.

ROLE CLUSTERING (when target is "roles"):
- Create role recommendations based on the person's skills and experiences
- Each cluster is a JOB ROLE or CAREER PATH they would thrive in
- Name them as actual job titles or role archetypes (e.g., "Creative Director", "Product Strategist", "Community Builder")
- For each role include: what the role does, why they'd excel at it based on their skills
- Focus on roles that combine their natural talents with things they love doing

PERSONA CLUSTERING (when target is "persona"):
- Create personas representing FORMER VERSIONS of this person
- Each persona should be a specific life stage or struggle they went through
- Name them descriptively (e.g., "The Overwhelmed New Entrepreneur", "The Creative Kid Who Felt Unseen")
- For each persona include: who they are, what they're struggling with, and what they need
- These are the people this user is most qualified to help

INTEGRATION/MISSION (when generating integration or mission):
- Combine skills, problems, and persona into a cohesive picture
- Generate market opportunity seeds (coaching, courses, content, products)
- Create mission statement format: "I help [persona] [solve problem] using [skills]"`

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
    console.log('📥 Received request:', JSON.stringify(body, null, 2).substring(0, 500))

    const {
      currentStep,
      userResponse,
      conversationHistory,
      allResponses,
      shouldCluster,
      shouldGenerate,
      clusterSources,
      clusterType,
      generateType,
      clusterData
    } = body

    if (!currentStep || !userResponse) {
      throw new Error('Missing required fields: currentStep or userResponse')
    }

    // Build the conversation context
    let userPrompt = ''

    // Add conversation history context
    if (conversationHistory && conversationHistory.length > 0) {
      userPrompt += 'Previous conversation:\n'
      conversationHistory.slice(-6).forEach((msg: any) => {
        userPrompt += `${msg.isAI ? 'You' : 'User'}: ${msg.text}\n\n`
      })
    }

    // Add current step info
    userPrompt += `\n---\nCURRENT STEP: ${currentStep.id}\n`
    userPrompt += `QUESTION ASKED: ${currentStep.assistant_prompt}\n`
    userPrompt += `USER'S RESPONSE: ${userResponse}\n\n`

    // If we need to cluster
    if (shouldCluster && allResponses) {
      userPrompt += `\n---\nCLUSTERING TASK:\n`
      userPrompt += `Create ${clusterType || 'skill'} clusters from these user responses:\n\n`

      // Get items from specified sources
      const items: string[] = []
      allResponses.forEach((resp: any) => {
        if (clusterSources.some((source: string) => resp.store_as === source || source.includes('*'))) {
          // Extract bullet points from response
          const bullets = resp.response_raw.split(/[\n•\-\*]/)
            .map((b: string) => b.trim())
            .filter((b: string) => b.length > 0)
          items.push(...bullets)
        }
      })

      userPrompt += `Items to cluster:\n${items.map((item, i) => `${i+1}. ${item}`).join('\n')}\n\n`
      userPrompt += `Create semantic clusters and acknowledge the user's latest response. Show them the clusters in your message.\n`
    } else if (shouldGenerate && generateType === 'integration_summary') {
      // Integration summary - fetch and display saved clusters from database
      userPrompt += `\n---\nINTEGRATION SUMMARY TASK:\n`
      userPrompt += `The user has completed their Skills, Problems, and Persona discovery flows.\n\n`

      // Extract user_id from allResponses
      const userId = allResponses && allResponses.length > 0 ? allResponses[0].user_id : null

      if (userId && clusterData) {
        userPrompt += `Here are the user's finalized clusters from the database:\n\n`

        // Add saved clusters to prompt
        if (clusterData.skills) {
          userPrompt += `**SKILLS CLUSTERS:**\n`
          clusterData.skills.forEach((cluster: any) => {
            userPrompt += `- **${cluster.cluster_label}**: ${JSON.stringify(cluster.items || [])}\n`
          })
          userPrompt += '\n'
        }

        if (clusterData.problems) {
          userPrompt += `**PROBLEMS CLUSTERS:**\n`
          clusterData.problems.forEach((cluster: any) => {
            userPrompt += `- **${cluster.cluster_label}**: ${JSON.stringify(cluster.items || [])}\n`
          })
          userPrompt += '\n'
        }

        if (clusterData.persona) {
          userPrompt += `**PERSONA CLUSTERS:**\n`
          clusterData.persona.forEach((cluster: any) => {
            userPrompt += `- **${cluster.cluster_label}**: ${JSON.stringify(cluster.items || [])}\n`
          })
          userPrompt += '\n'
        }

        userPrompt += `Your task:\n`
        userPrompt += `Display these clusters in a clear, organized format.\n`
        userPrompt += `For each cluster type (Skills, Problems, Personas):\n`
        userPrompt += `- Show the cluster label in bold\n`
        userPrompt += `- List 2-3 key items from each cluster\n`
        userPrompt += `- Use clean markdown formatting\n`
        userPrompt += `- Keep it concise and scannable\n`
        userPrompt += `- End with a brief, warm transition to the next step\n`
      } else {
        userPrompt += `NOTE: No saved clusters found. Let the user know there was an issue loading their clusters.\n`
      }
    } else {
      // Normal conversation - get next step
      const nextStep = currentStep.nextStep
      if (nextStep) {
        userPrompt += `\nNEXT STEP: ${nextStep.id}\n`
        userPrompt += `NEXT QUESTION: ${nextStep.assistant_prompt}\n\n`
        userPrompt += `Generate a conversational response that:\n`
        userPrompt += `1. Acknowledges what the user shared (briefly)\n`
        userPrompt += `2. Notes any interesting patterns or connections\n`
        userPrompt += `3. Transitions naturally to the next question\n`
      } else {
        userPrompt += `\nThis is the final step. Generate a brief acknowledgment of what they shared.\n`
      }
    }

    console.log('📝 Sending to Claude:', userPrompt.substring(0, 500) + '...')

    // Define the response tool/function
    const tools = [{
      name: "nikigai_response",
      description: "Respond to the user with a conversational message and optional clusters",
      input_schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Your warm, conversational response to the user. Use markdown formatting for emphasis."
          },
          clusters: {
            type: "array",
            description: "Array of clusters (only include when clustering is requested)",
            items: {
              type: "object",
              properties: {
                label: {
                  type: "string",
                  description: "Thematic label for the cluster (2-4 words)"
                },
                items: {
                  type: "array",
                  description: "Items/bullet points in this cluster",
                  items: { type: "string" }
                },
                insight: {
                  type: "string",
                  description: "Brief insight about what this cluster reveals (1-2 sentences)"
                }
              },
              required: ["label", "items", "insight"]
            }
          }
        },
        required: ["message"]
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
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: tools,
        tool_choice: { type: "tool", name: "nikigai_response" },
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      throw new Error(`Claude API error ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()

    // Extract tool use response - much cleaner with function calling!
    const toolUse = claudeData.content.find((block: any) => block.type === 'tool_use')

    if (!toolUse || toolUse.name !== 'nikigai_response') {
      throw new Error('Expected nikigai_response tool use in Claude response')
    }

    // Extract structured data directly - no parsing needed!
    const result = {
      message: toolUse.input.message || '',
      clusters: toolUse.input.clusters || null
    }

    return new Response(
      JSON.stringify({
        message: result.message,
        clusters: result.clusters || null,
        model: 'claude-3-haiku-20240307'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in nikigai-conversation:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        message: "I apologize, but I encountered an error processing your response. Let's continue - please share your thoughts again."
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
