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
Return ONLY valid JSON with this exact structure (no extra text before or after):
{"message": "Your conversational response here", "clusters": null}

When asked to generate clusters, use:
{"message": "Your response", "clusters": [{"label": "Cluster Name", "items": ["item1", "item2"], "insight": "Brief insight"}]}

IMPORTANT: Return ONLY the JSON object, nothing else. No markdown code blocks, no explanation.

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
      clusterSources,
      clusterType
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

    // Call Claude API
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
    const extractedText = claudeData.content[0].text

    // Parse JSON response
    let result
    try {
      // Try to find a valid JSON object in the response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        result = JSON.parse(extractedText)
      }

      // Ensure message exists
      if (!result.message) {
        result.message = extractedText
      }

      // Clean up message - remove any trailing JSON that Claude might have included
      if (result.message) {
        // Remove any JSON-like content at the end of the message
        result.message = result.message
          .replace(/",?\s*"clusters"\s*:\s*\[[\s\S]*\]\s*\}?\s*$/g, '')
          .replace(/\s*,?\s*"clusters"\s*:\s*\[[\s\S]*$/g, '')
          .trim()
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', extractedText)
      // Fall back to cleaning up the raw text
      result = {
        message: extractedText,
        clusters: null
      }
    }

    // Always clean up the message to remove any JSON artifacts
    if (result.message) {
      result.message = result.message
        // Remove opening JSON wrapper
        .replace(/^\s*\{\s*"message"\s*:\s*"/i, '')
        // Remove closing JSON wrapper
        .replace(/"\s*\}\s*$/g, '')
        // Remove clusters JSON at end
        .replace(/",?\s*"clusters"\s*:\s*\[[\s\S]*\]\s*\}?\s*$/g, '')
        .replace(/",?\s*"clusters"\s*:\s*null\s*\}?\s*$/g, '')
        // Clean up escaped quotes
        .replace(/\\"/g, '"')
        // Clean up escaped newlines
        .replace(/\\n/g, '\n')
        .trim()
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
