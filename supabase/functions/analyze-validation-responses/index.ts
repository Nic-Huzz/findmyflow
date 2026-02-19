// Analyze Validation Responses Edge Function
// Analyzes validation survey responses and generates AI-powered insights with:
// - Sentiment badges
// - Response segmentation
// - Actionable to-dos
// - Competitor analysis
// - Validation Score
// - Voice of Customer database entries
//
// Uses 2 parallel Claude calls for speed (core insights + advanced analysis)

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

    // Build the shared data prompt (used by both calls)
    const dataPrompt = `QUESTIONS AND RESPONSES:
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
}).join('\n---\n')}`

    const sharedContext = `CONTEXT:
- Problem: ${context.problemArea || 'helping people solve a problem'}
- Solution: ${context.solutionConcept || 'a service or product'}
- Audience: ${context.audienceDescription || 'potential customers'}
- Total respondents: ${totalResponses}`

    console.log('🤖 Calling Claude (2 parallel calls)...')

    // CALL 1: Core Insights (key findings, pain points, language, summary, score)
    const coreCall = anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      temperature: 0.5,
      system: `You are an expert at analyzing customer validation survey data for entrepreneurs. Extract key insights with badges and a validation score.

${sharedContext}

BADGE SYSTEM for each insight:
- "opportunity": HIGH-VALUE ACTION ITEM (50%+ mention OR intense emotion)
- "gold": STEAL THIS LANGUAGE (vivid, memorable customer words)
- "pattern": VALIDATED BY MULTIPLE (3+ respondents)
- null: No special badge

Be concise and practical. Focus on the most important findings.`,
      messages: [{ role: 'user', content: `Analyze these validation responses:\n\n${dataPrompt}\n\nExtract core insights, pain points, dream outcomes, objections, pricing signals, language patterns, and a validation score.` }],
      tools: [{
        name: 'save_core_analysis',
        description: 'Save the core validation analysis',
        input_schema: {
          type: 'object',
          properties: {
            key_insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
                },
                required: ['text']
              }
            },
            pain_points: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
                },
                required: ['text']
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
                required: ['text']
              }
            },
            objections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
                },
                required: ['text']
              }
            },
            pricing_signals: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
              },
              required: ['text']
            },
            language_patterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  badge: { type: ['string', 'null'], enum: ['opportunity', 'gold', 'pattern', null] }
                },
                required: ['text']
              }
            },
            summary: { type: 'string' },
            validation_score: {
              type: 'object',
              properties: {
                overall: { type: 'number' },
                components: {
                  type: 'object',
                  properties: {
                    interest: { type: 'object', properties: { score: { type: 'number' }, reason: { type: 'string' } } },
                    urgency: { type: 'object', properties: { score: { type: 'number' }, reason: { type: 'string' } } },
                    budget: { type: 'object', properties: { score: { type: 'number' }, reason: { type: 'string' } } },
                    fit: { type: 'object', properties: { score: { type: 'number' }, reason: { type: 'string' } } }
                  }
                },
                recommendation: { type: 'string' },
                confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
              }
            }
          },
          required: ['key_insights', 'pain_points', 'dream_outcomes', 'objections', 'pricing_signals', 'language_patterns', 'summary', 'validation_score']
        }
      }]
    })

    // CALL 2: Advanced Analysis (segmentation, actions, competitors, question analysis, VoC)
    const advancedCall = anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      temperature: 0.5,
      system: `You are an expert at analyzing customer validation survey data for entrepreneurs. Generate strategic analysis: respondent segmentation, actionable tasks, competitor insights, and voice-of-customer quotes.

${sharedContext}

Be concise and practical. Focus on actionable output.`,
      messages: [{ role: 'user', content: `Analyze these validation responses for strategic insights:\n\n${dataPrompt}\n\nGenerate: question-by-question analysis, respondent segmentation, suggested actions, competitor analysis, and voice-of-customer quotes.` }],
      tools: [{
        name: 'save_advanced_analysis',
        description: 'Save the advanced strategic analysis',
        input_schema: {
          type: 'object',
          properties: {
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
            suggested_actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  source: { type: 'string' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  category: { type: 'string', enum: ['messaging', 'pricing', 'product', 'marketing', 'objection_handling'] }
                },
                required: ['action', 'priority', 'category']
              }
            },
            competitor_analysis: {
              type: 'object',
              properties: {
                alternatives_mentioned: { type: 'array', items: { type: 'string' } },
                why_they_failed: { type: 'array', items: { type: 'string' } },
                gaps_to_fill: { type: 'array', items: { type: 'string' } },
                positioning_opportunity: { type: 'string' }
              }
            },
            voice_of_customer: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  quote: { type: 'string' },
                  category: { type: 'string', enum: ['pain_point', 'dream_outcome', 'objection', 'language', 'competitor', 'pricing'] },
                  emotion: { type: 'string' },
                  intensity: { type: 'number' },
                  keywords: { type: 'array', items: { type: 'string' } }
                },
                required: ['quote', 'category']
              }
            }
          },
          required: ['question_analysis', 'segmentation', 'suggested_actions', 'competitor_analysis', 'voice_of_customer']
        }
      }]
    })

    // Run both calls in parallel
    const [coreResult, advancedResult] = await Promise.all([coreCall, advancedCall])

    console.log('✅ Both Claude calls completed')

    // Extract tool use results
    const coreToolUse = coreResult.content.find((block: any) => block.type === 'tool_use')
    const advancedToolUse = advancedResult.content.find((block: any) => block.type === 'tool_use')

    if (!coreToolUse) {
      console.error('No tool use in core analysis response')
      throw new Error('AI did not return core analysis')
    }

    const core = coreToolUse.input
    const advanced = advancedToolUse?.input || {}

    // Handle pricing_signals backward compatibility
    let pricingSignalsValue = core.pricing_signals
    if (typeof pricingSignalsValue === 'string') {
      pricingSignalsValue = { text: pricingSignalsValue, badge: null }
    }

    // Save to validation_analysis table (merged from both calls)
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('validation_analysis')
      .insert({
        user_id: userId,
        analysis_number: analysisNumber,
        total_responses: totalResponses,
        flows_analyzed: flows.length,
        response_snapshot: responseSnapshot,
        // Core analysis fields
        key_insights: core.key_insights,
        pain_points: core.pain_points,
        dream_outcomes: core.dream_outcomes,
        objections: core.objections,
        pricing_signals: pricingSignalsValue,
        language_patterns: core.language_patterns,
        summary: core.summary,
        validation_score: core.validation_score,
        // Context
        context_problem: context.problemArea,
        context_solution: context.solutionConcept,
        context_audience: context.audienceDescription,
        // Advanced analysis fields
        question_analysis: advanced.question_analysis || [],
        segmentation: advanced.segmentation || null,
        suggested_actions: advanced.suggested_actions || [],
        competitor_analysis: advanced.competitor_analysis || null
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving analysis:', saveError)
      throw saveError
    }

    console.log(`✅ Analysis #${analysisNumber} saved:`, savedAnalysis.id)

    // Save Voice of Customer entries
    const vocData = advanced.voice_of_customer
    if (vocData && vocData.length > 0) {
      const vocEntries = vocData.map((voc: any) => ({
        user_id: userId,
        analysis_id: savedAnalysis.id,
        quote: voc.quote,
        category: voc.category,
        emotion: voc.emotion || null,
        intensity: voc.intensity || 5,
        keywords: voc.keywords || [],
        respondent_segment: null
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
        vocEntriesCount: vocData?.length || 0
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
