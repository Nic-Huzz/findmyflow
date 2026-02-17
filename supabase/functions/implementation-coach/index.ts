/**
 * Supabase Edge Function: Implementation Coach
 *
 * AI-powered task assistance for Sales Tower Tier 3.
 * Generates headlines, emails, scripts, and pricing strategies
 * based on user's business context and voice profile.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Model selection - use Haiku for faster, cheaper generations
const MODELS = {
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-5-20251001'
}

// Task type configurations for token limits
const TASK_CONFIG: Record<string, { maxTokens: number; useHaiku: boolean }> = {
  headline: { maxTokens: 800, useHaiku: true },
  email: { maxTokens: 1500, useHaiku: false },
  script: { maxTokens: 1200, useHaiku: false },
  strategy: { maxTokens: 1500, useHaiku: false },
  pitch: { maxTokens: 1000, useHaiku: false },
}

/**
 * Generate content using Claude API
 */
async function generateContent(
  prompt: string,
  taskType: string = 'headline',
  category: string = 'upsell'
): Promise<{ content: string; model: string; usage: any }> {

  const config = TASK_CONFIG[taskType] || { maxTokens: 1000, useHaiku: true }
  const model = config.useHaiku ? MODELS.haiku : MODELS.sonnet

  console.log(`🤖 Implementation Coach: Generating ${taskType} for ${category} using ${model}`)

  const systemPrompt = `You are an expert marketing strategist and copywriter trained in Alex Hormozi's $100M Offers methodology. You help solopreneurs and coaches create high-converting sales assets.

Your outputs should be:
- Direct and actionable (no fluff)
- Focused on transformation over features
- Using specific numbers and outcomes when possible
- Written in a conversational, authentic tone
- Optimized for the specific task type

Never explain what you're doing - just deliver the content requested.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Anthropic API error:', error)
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    content: data.content?.[0]?.text || '',
    model,
    usage: data.usage
  }
}

/**
 * Generate multiple variations of content
 */
async function generateVariations(
  prompt: string,
  taskType: string,
  count: number = 3
): Promise<{ variations: Array<{ content: string; angle: string }> }> {

  const angles = [
    'Focus on the primary transformation',
    'Lead with urgency and scarcity',
    'Emphasize the emotional benefit'
  ]

  const variations = []

  for (let i = 0; i < Math.min(count, angles.length); i++) {
    const augmentedPrompt = `${prompt}\n\nANGLE: ${angles[i]}`
    const result = await generateContent(augmentedPrompt, taskType)
    variations.push({
      content: result.content,
      angle: angles[i]
    })
  }

  return { variations }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      prompt,
      task_type = 'headline',
      category = 'upsell',
      action = 'generate',
      count = 1
    } = body

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log(`Implementation Coach: action=${action}, task_type=${task_type}, category=${category}`)

    let result

    switch (action) {
      case 'generate':
        const generated = await generateContent(prompt, task_type, category)
        result = {
          content: generated.content,
          task_type,
          category,
          model: generated.model,
          generatedAt: new Date().toISOString()
        }
        break

      case 'variations':
        result = await generateVariations(prompt, task_type, count)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in implementation-coach:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
