// Analyze Validation Responses Edge Function
// Analyzes validation survey responses and generates AI-powered insights per question

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FlowResponse {
  step_id: string
  question_text: string
  answer_type: string
  answer_value: any
  answered_at: string
}

interface FlowData {
  flowName: string
  placeholders: {
    problemArea?: string
    solutionConcept?: string
    audienceDescription?: string
  }
  responses: FlowResponse[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, flows } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!flows || flows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No flows provided for analysis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📊 Analyzing validation responses for user:', userId)
    console.log(`📝 Processing ${flows.length} flows`)

    // Count total responses across all flows
    let totalResponses = 0
    flows.forEach((flow: FlowData) => {
      totalResponses += flow.responses.length
    })

    console.log(`✅ Total responses to analyze: ${totalResponses}`)

    // Organize responses by question/step
    const responsesByQuestion: Record<string, {
      question: string
      type: string
      answers: any[]
    }> = {}

    flows.forEach((flow: FlowData) => {
      flow.responses.forEach((resp: FlowResponse) => {
        // Skip intro/navigation steps without real data
        if (!resp.answer_value || resp.step_id.startsWith('0.')) return

        const key = resp.step_id
        if (!responsesByQuestion[key]) {
          // Clean up question text - remove markdown and placeholders
          let cleanQuestion = resp.question_text || ''
          cleanQuestion = cleanQuestion.replace(/\*\*([^*]+)\*\*/g, '$1')
          cleanQuestion = cleanQuestion.replace(/\{\{[^}]+\}\}/g, '[topic]')
          cleanQuestion = cleanQuestion.split('\n')[0] // First line only

          responsesByQuestion[key] = {
            question: cleanQuestion.substring(0, 100),
            type: resp.answer_type,
            answers: []
          }
        }
        responsesByQuestion[key].answers.push(resp.answer_value)
      })
    })

    console.log(`📈 Organized into ${Object.keys(responsesByQuestion).length} questions`)

    // Build context from placeholders
    const context = flows[0]?.placeholders || {}

    // Initialize Anthropic
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const systemPrompt = `You are an expert at analyzing customer validation survey data to extract actionable insights for entrepreneurs.

CONTEXT:
The user is validating a business idea related to:
- Problem: ${context.problemArea || 'helping people solve a problem'}
- Solution: ${context.solutionConcept || 'a service or product'}
- Audience: ${context.audienceDescription || 'potential customers'}

TASK: Analyze the survey responses and extract insights that will help shape their offer, messaging, and positioning.

FOCUS ON:
1. Pain Points - What problems keep coming up? What language do they use?
2. Dream Outcomes - What do people really want? What does success look like?
3. Objections - What's stopping them from buying or trying solutions?
4. Pricing Signals - Willingness to pay, money already spent, budget constraints
5. Language Patterns - Key phrases and words the audience actually uses
6. Question-by-Question Analysis - Summary of each question's responses

OUTPUT: Return structured analysis that an entrepreneur can act on immediately.`

    const userPrompt = `Analyze these validation survey responses and provide insights:

QUESTIONS AND RESPONSES:
${Object.entries(responsesByQuestion).map(([stepId, data]) => {
  const answerList = data.answers.map((a, i) => {
    if (typeof a === 'object') {
      return `  ${i + 1}. ${JSON.stringify(a)}`
    }
    return `  ${i + 1}. "${a}"`
  }).join('\n')
  return `
Q (${stepId}): ${data.question}
Type: ${data.type}
Responses (${data.answers.length}):
${answerList}`
}).join('\n---\n')}

Generate comprehensive insights from these ${totalResponses} responses.`

    console.log('🤖 Calling Claude for analysis...')

    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }],
      tools: [{
        name: 'save_validation_analysis',
        description: 'Save the validation response analysis results',
        input_schema: {
          type: 'object',
          properties: {
            key_insights: {
              type: 'array',
              description: 'Top 3-5 key insights from the data',
              items: { type: 'string' }
            },
            pain_points: {
              type: 'array',
              description: 'Main pain points identified',
              items: { type: 'string' }
            },
            dream_outcomes: {
              type: 'array',
              description: 'What customers want to achieve',
              items: { type: 'string' }
            },
            objections: {
              type: 'array',
              description: 'Common objections or hesitations',
              items: { type: 'string' }
            },
            pricing_signals: {
              type: 'string',
              description: 'Summary of pricing-related insights'
            },
            language_patterns: {
              type: 'array',
              description: 'Key phrases and words to use in messaging',
              items: { type: 'string' }
            },
            question_analysis: {
              type: 'array',
              description: 'Analysis of each question',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  summary: { type: 'string', description: 'Summary of responses' },
                  notable_quotes: {
                    type: 'array',
                    description: 'Notable quotes from responses (up to 2)',
                    items: { type: 'string' }
                  }
                },
                required: ['question', 'summary']
              }
            },
            summary: {
              type: 'string',
              description: 'Overall summary and recommended next steps (2-3 sentences)'
            }
          },
          required: ['key_insights', 'pain_points', 'dream_outcomes', 'objections', 'pricing_signals', 'language_patterns', 'question_analysis', 'summary']
        }
      }]
    })

    console.log('✅ Claude response received')

    // Extract tool use from response
    const toolUse = completion.content.find((block: any) => block.type === 'tool_use')

    if (!toolUse || toolUse.name !== 'save_validation_analysis') {
      console.error('No valid tool use in Claude response')
      throw new Error('AI did not return structured analysis')
    }

    const analysis = toolUse.input

    // Save to validation_analysis table
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('validation_analysis')
      .insert({
        user_id: userId,
        total_responses: totalResponses,
        flows_analyzed: flows.length,
        key_insights: analysis.key_insights,
        pain_points: analysis.pain_points,
        dream_outcomes: analysis.dream_outcomes,
        objections: analysis.objections,
        pricing_signals: analysis.pricing_signals,
        language_patterns: analysis.language_patterns,
        question_analysis: analysis.question_analysis,
        summary: analysis.summary,
        context_problem: context.problemArea,
        context_solution: context.solutionConcept,
        context_audience: context.audienceDescription
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving analysis:', saveError)
      throw saveError
    }

    console.log('✅ Analysis saved:', savedAnalysis.id)

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-validation-responses:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
