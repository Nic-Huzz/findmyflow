// Analyze Validation Responses Edge Function
// Analyzes validation survey responses and generates AI-powered insights with:
// - Sentiment badges
// - Response segmentation
// - Actionable to-dos
// - Competitor analysis
// - Validation Score
// - Voice of Customer database entries

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
  flowId: string
  placeholders: {
    problemArea?: string
    solutionConcept?: string
    audienceDescription?: string
  }
  responses: FlowResponse[]
}

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📊 Analyzing validation responses for user:', userId)

    // Get existing analysis count for versioning
    const { count: existingCount } = await supabase
      .from('validation_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const analysisNumber = (existingCount || 0) + 1

    // Count total responses and build snapshot
    let totalResponses = 0
    const responseSnapshot: Record<string, number> = {}

    flows.forEach((flow: FlowData) => {
      const flowResponseCount = flow.responses.length
      totalResponses += flowResponseCount
      if (flow.flowId) {
        responseSnapshot[flow.flowId] = flowResponseCount
      }
    })

    console.log(`✅ Total responses: ${totalResponses}, Analysis #${analysisNumber}`)

    // Organize responses by question
    const responsesByQuestion: Record<string, {
      question: string
      type: string
      answers: any[]
    }> = {}

    flows.forEach((flow: FlowData) => {
      flow.responses.forEach((resp: FlowResponse) => {
        if (!resp.answer_value || resp.step_id.startsWith('0.')) return

        const key = resp.step_id
        if (!responsesByQuestion[key]) {
          let cleanQuestion = resp.question_text || ''
          cleanQuestion = cleanQuestion.replace(/\*\*([^*]+)\*\*/g, '$1')
          cleanQuestion = cleanQuestion.replace(/\{\{[^}]+\}\}/g, '[topic]')
          cleanQuestion = cleanQuestion.split('\n')[0]

          responsesByQuestion[key] = {
            question: cleanQuestion.substring(0, 100),
            type: resp.answer_type,
            answers: []
          }
        }
        responsesByQuestion[key].answers.push(resp.answer_value)
      })
    })

    const context = flows[0]?.placeholders || {}

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const systemPrompt = `You are an expert at analyzing customer validation survey data to extract actionable insights for entrepreneurs.

CONTEXT:
- Problem: ${context.problemArea || 'helping people solve a problem'}
- Solution: ${context.solutionConcept || 'a service or product'}
- Audience: ${context.audienceDescription || 'potential customers'}
- Total respondents: ${totalResponses}

YOUR TASK: Perform a comprehensive analysis that includes:

1. BADGE SYSTEM for each insight:
   - "opportunity" (🎯): HIGH-VALUE ACTION ITEM (50%+ mention OR intense emotion)
   - "gold" (✨): STEAL THIS LANGUAGE (vivid, memorable customer words)
   - "pattern" (📊): VALIDATED BY MULTIPLE (3+ respondents)
   - null: No special badge

2. RESPONSE SEGMENTATION - Categorize respondents into:
   - "high_intent": Strong pain, willing to pay, urgency
   - "budget_conscious": Interested but price-sensitive
   - "solution_seekers": Actively looking for solutions

3. ACTIONABLE TO-DOS - Generate specific tasks from insights:
   - Each action should be concrete and implementable
   - Include source (what insight triggered this)
   - Prioritize: high, medium, low
   - Categories: messaging, pricing, product, marketing, objection_handling

4. COMPETITOR ANALYSIS - Extract from responses:
   - What alternatives have they tried?
   - Why did those fail?
   - What gaps can you fill?
   - Positioning opportunity

5. VALIDATION SCORE (0-100) with components:
   - Interest (0-100): Response engagement, detail in answers
   - Urgency (0-100): Pain intensity, time sensitivity
   - Budget (0-100): Willingness to pay, price signals
   - Fit (0-100): Alignment with your offer
   - Overall score + recommendation

6. VOICE OF CUSTOMER entries - Extract quotable phrases:
   - Exact customer language to use in copy
   - Categorize: pain_point, dream_outcome, objection, language, competitor, pricing
   - Rate emotion and intensity (1-10)
   - Extract keywords for searchability`

    const userPrompt = `Analyze these validation survey responses comprehensively:

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

Generate comprehensive analysis with all components. Be thorough but practical.`

    console.log('🤖 Calling Claude for comprehensive analysis...')

    const completion = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [{
        name: 'save_comprehensive_analysis',
        description: 'Save the comprehensive validation analysis with all components',
        input_schema: {
          type: 'object',
          properties: {
            // Original fields with badges
            key_insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
                },
                required: ['text', 'badge']
              }
            },
            pain_points: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] },
                  frequency: { type: 'number' }
                },
                required: ['text', 'badge']
              }
            },
            dream_outcomes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
                },
                required: ['text', 'badge']
              }
            },
            objections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] },
                  frequency: { type: 'number' }
                },
                required: ['text', 'badge']
              }
            },
            pricing_signals: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
              },
              required: ['text', 'badge']
            },
            language_patterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
                },
                required: ['text', 'badge']
              }
            },
            question_analysis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  summary: { type: 'string' },
                  notable_quotes: { type: 'array', items: { type: 'string' } }
                },
                required: ['question', 'summary']
              }
            },
            summary: { type: 'string' },

            // NEW: Response Segmentation
            segmentation: {
              type: 'object',
              properties: {
                high_intent: {
                  type: 'object',
                  properties: {
                    count: { type: 'number' },
                    characteristics: { type: 'array', items: { type: 'string' } },
                    pain_points: { type: 'array', items: { type: 'string' } },
                    dream_outcomes: { type: 'array', items: { type: 'string' } }
                  }
                },
                budget_conscious: {
                  type: 'object',
                  properties: {
                    count: { type: 'number' },
                    characteristics: { type: 'array', items: { type: 'string' } },
                    objections: { type: 'array', items: { type: 'string' } },
                    price_sensitivity: { type: 'string' }
                  }
                },
                solution_seekers: {
                  type: 'object',
                  properties: {
                    count: { type: 'number' },
                    characteristics: { type: 'array', items: { type: 'string' } },
                    what_theyve_tried: { type: 'array', items: { type: 'string' } },
                    ideal_solution: { type: 'string' }
                  }
                }
              }
            },

            // NEW: Actionable To-Dos
            suggested_actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string', description: 'Specific actionable task' },
                  source: { type: 'string', description: 'What insight triggered this' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  category: { type: 'string', enum: ['messaging', 'pricing', 'product', 'marketing', 'objection_handling'] }
                },
                required: ['action', 'source', 'priority', 'category']
              }
            },

            // NEW: Competitor Analysis
            competitor_analysis: {
              type: 'object',
              properties: {
                alternatives_mentioned: { type: 'array', items: { type: 'string' } },
                why_they_failed: { type: 'array', items: { type: 'string' } },
                gaps_to_fill: { type: 'array', items: { type: 'string' } },
                positioning_opportunity: { type: 'string' }
              }
            },

            // NEW: Validation Score
            validation_score: {
              type: 'object',
              properties: {
                overall: { type: 'number', minimum: 0, maximum: 100 },
                components: {
                  type: 'object',
                  properties: {
                    interest: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        reason: { type: 'string' }
                      }
                    },
                    urgency: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        reason: { type: 'string' }
                      }
                    },
                    budget: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        reason: { type: 'string' }
                      }
                    },
                    fit: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        reason: { type: 'string' }
                      }
                    }
                  }
                },
                recommendation: { type: 'string' },
                confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
              }
            },

            // NEW: Voice of Customer entries
            voice_of_customer: {
              type: 'array',
              description: 'Quotable customer language for copy/messaging',
              items: {
                type: 'object',
                properties: {
                  quote: { type: 'string', description: 'Exact customer words' },
                  category: { type: 'string', enum: ['pain_point', 'dream_outcome', 'objection', 'language', 'competitor', 'pricing'] },
                  emotion: { type: 'string', description: 'Dominant emotion (frustrated, hopeful, confused, excited, skeptical)' },
                  intensity: { type: 'number', minimum: 1, maximum: 10 },
                  keywords: { type: 'array', items: { type: 'string' } }
                },
                required: ['quote', 'category', 'emotion', 'intensity', 'keywords']
              }
            }
          },
          required: ['key_insights', 'pain_points', 'dream_outcomes', 'objections', 'pricing_signals', 'language_patterns', 'question_analysis', 'summary', 'segmentation', 'suggested_actions', 'competitor_analysis', 'validation_score', 'voice_of_customer']
        }
      }]
    })

    console.log('✅ Claude response received')

    const toolUse = completion.content.find((block: any) => block.type === 'tool_use')

    if (!toolUse || toolUse.name !== 'save_comprehensive_analysis') {
      console.error('No valid tool use in Claude response')
      throw new Error('AI did not return structured analysis')
    }

    const analysis = toolUse.input

    // Handle pricing_signals backward compatibility
    let pricingSignalsValue = analysis.pricing_signals
    if (typeof pricingSignalsValue === 'string') {
      pricingSignalsValue = { text: pricingSignalsValue, badge: null }
    }

    // Save to validation_analysis table
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('validation_analysis')
      .insert({
        user_id: userId,
        analysis_number: analysisNumber,
        total_responses: totalResponses,
        flows_analyzed: flows.length,
        response_snapshot: responseSnapshot,
        key_insights: analysis.key_insights,
        pain_points: analysis.pain_points,
        dream_outcomes: analysis.dream_outcomes,
        objections: analysis.objections,
        pricing_signals: pricingSignalsValue,
        language_patterns: analysis.language_patterns,
        question_analysis: analysis.question_analysis,
        summary: analysis.summary,
        context_problem: context.problemArea,
        context_solution: context.solutionConcept,
        context_audience: context.audienceDescription,
        // New fields
        segmentation: analysis.segmentation,
        suggested_actions: analysis.suggested_actions,
        competitor_analysis: analysis.competitor_analysis,
        validation_score: analysis.validation_score
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving analysis:', saveError)
      throw saveError
    }

    console.log(`✅ Analysis #${analysisNumber} saved:`, savedAnalysis.id)

    // Save Voice of Customer entries
    if (analysis.voice_of_customer && analysis.voice_of_customer.length > 0) {
      const vocEntries = analysis.voice_of_customer.map((voc: any) => ({
        user_id: userId,
        analysis_id: savedAnalysis.id,
        quote: voc.quote,
        category: voc.category,
        emotion: voc.emotion,
        intensity: voc.intensity,
        keywords: voc.keywords,
        respondent_segment: null // Could be enhanced later
      }))

      const { error: vocError } = await supabase
        .from('voice_of_customer')
        .insert(vocEntries)

      if (vocError) {
        console.error('Error saving VoC entries:', vocError)
        // Don't throw - VoC is supplementary
      } else {
        console.log(`✅ Saved ${vocEntries.length} Voice of Customer entries`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
        analysisNumber,
        vocEntriesCount: analysis.voice_of_customer?.length || 0
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
