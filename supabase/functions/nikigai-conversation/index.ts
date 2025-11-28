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
- CRITICAL: When clustering is requested (you'll see "CLUSTERING TASK:" in the prompt), you MUST include the clusters in BOTH:
  1. The message field (formatted nicely with markdown)
  2. The clusters array field (structured JSON with label, items, insight for each cluster)
- If no clustering is requested, set clusters to null or empty array

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

ROLE CLUSTERING (when CLUSTER TYPE is "roles"):
- You are creating ROLE RECOMMENDATIONS, not skill clusters
- Each cluster represents a JOB ROLE or CAREER PATH they would thrive in
- Name them as actual job titles or role archetypes (e.g., "Creative Director", "Product Strategist", "Community Builder")
- For each role cluster:
  * Group skills that naturally fit that role
  * Explain what the role does
  * Explain why they'd excel at it based on their skills
- Focus on roles that combine their natural talents with things they love doing
- The items to cluster are SKILLS, but you're grouping them into ROLE clusters

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
      userPrompt += `CLUSTER TYPE: "${clusterType || 'skill'}"\n`
      userPrompt += `Follow the ${clusterType?.toUpperCase() || 'SKILL'} CLUSTERING guidelines from your system prompt.\n\n`

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
      userPrompt += `IMPORTANT: Create semantic clusters and:\n`
      userPrompt += `1. Show them beautifully formatted in your MESSAGE field using markdown\n`
      userPrompt += `2. ALSO include them in the CLUSTERS array field as structured JSON\n`
      userPrompt += `3. Each cluster needs: label, items array, and insight\n`
      userPrompt += `4. End your message with: "Do these clusters look good, or would you like me to re-create them?"\n`
    } else if (shouldGenerate && generateType === 'integration_summary') {
      // Integration summary - fetch and display saved clusters from database
      userPrompt += `\n---\nINTEGRATION SUMMARY TASK:\n`
      userPrompt += `The user has completed their Skills, Problems, and Persona discovery flows.\n\n`

      // Extract user_id from allResponses
      const userId = allResponses && allResponses.length > 0 ? allResponses[0].user_id : null

      if (userId && clusterData) {
        userPrompt += `Here are the user's finalized clusters from the database:\n\n`

        // Add saved clusters to prompt
        // Note: clusterData.skills actually contains role clusters from Skills flow
        if (clusterData.skills && clusterData.skills.length > 0) {
          userPrompt += `**ROLE CLUSTERS (from Skills flow):**\n`
          clusterData.skills.forEach((cluster: any) => {
            userPrompt += `- **${cluster.cluster_label}**: ${JSON.stringify(cluster.items || [])}\n`
          })
          userPrompt += '\n'
        } else {
          userPrompt += `**ROLE CLUSTERS:** None found (user may need to complete Skills Discovery first)\n\n`
        }

        if (clusterData.problems && clusterData.problems.length > 0) {
          userPrompt += `**PROBLEMS CLUSTERS:**\n`
          clusterData.problems.forEach((cluster: any) => {
            userPrompt += `- **${cluster.cluster_label}**: ${JSON.stringify(cluster.items || [])}\n`
          })
          userPrompt += '\n'
        } else {
          userPrompt += `**PROBLEMS CLUSTERS:** None found (user may need to complete Problems Discovery first)\n\n`
        }

        if (clusterData.persona && clusterData.persona.length > 0) {
          userPrompt += `**PERSONA CLUSTERS:**\n`
          clusterData.persona.forEach((cluster: any) => {
            userPrompt += `- **${cluster.cluster_label}**: ${JSON.stringify(cluster.items || [])}\n`
          })
          userPrompt += '\n'
        } else {
          userPrompt += `**PERSONA CLUSTERS:** None found (user may need to complete Persona Discovery first)\n\n`
        }

        userPrompt += `Your task:\n`
        userPrompt += `Display ALL of these clusters exactly as provided.\n`
        userPrompt += `CRITICAL: Show EVERY SINGLE cluster that was provided above.\n`
        userPrompt += `For each cluster type (Roles, Problems, Personas):\n`
        userPrompt += `- Show ALL cluster labels in bold\n`
        userPrompt += `- List ALL items from each cluster (or at minimum the first 3-5 items if there are many)\n`
        userPrompt += `- Use clean markdown formatting with headers for each type\n`
        userPrompt += `- Keep it organized and scannable\n`
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
    // Make clusters required when clustering is requested
    const requiredFields = shouldCluster || shouldGenerate ? ["message", "clusters"] : ["message"]

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
            description: shouldCluster
              ? "REQUIRED: Array of semantic clusters. Each cluster MUST have label, items array, and insight."
              : "Array of clusters (only include when clustering is requested)",
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
        required: requiredFields
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
        max_tokens: shouldCluster || shouldGenerate ? 2048 : 1024, // Increased for clustering
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
