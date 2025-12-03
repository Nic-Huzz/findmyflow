// Flow Analysis Edge Function
// Analyzes flow entries and generates AI-powered insights

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { userId, projectId = null, analysisPeriod = 'weekly' } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate period dates
    const periodEnd = new Date()
    const periodStart = new Date()

    switch (analysisPeriod) {
      case 'weekly':
        periodStart.setDate(periodEnd.getDate() - 7)
        break
      case 'monthly':
        periodStart.setMonth(periodEnd.getMonth() - 1)
        break
      case 'all_time':
        periodStart.setFullYear(2024, 0, 1) // Jan 1, 2024
        break
      default:
        periodStart.setDate(periodEnd.getDate() - 7)
    }

    const periodStartStr = periodStart.toISOString().split('T')[0]
    const periodEndStr = periodEnd.toISOString().split('T')[0]

    console.log('📊 Analyzing flow entries:', {
      userId,
      projectId,
      analysisPeriod,
      periodStart: periodStartStr,
      periodEnd: periodEndStr
    })

    // Fetch flow entries for the period
    let query = supabase
      .from('flow_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', periodStartStr)
      .lte('activity_date', periodEndStr)
      .order('logged_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: entries, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching entries:', fetchError)
      throw fetchError
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No flow entries found for this period',
          entries_count: 0
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Found ${entries.length} flow entries`)

    // Calculate direction distribution
    const distribution: Record<string, number> = { north: 0, east: 0, south: 0, west: 0 }
    entries.forEach(entry => {
      if (distribution[entry.direction] !== undefined) {
        distribution[entry.direction]++
      }
    })

    // Calculate dominant direction
    const dominantDirection = Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])[0][0]

    // Calculate consistency score (0-1)
    const maxCount = Math.max(...Object.values(distribution))
    const consistencyScore = maxCount / entries.length

    console.log('📈 Calculated metrics:', {
      distribution,
      dominantDirection,
      consistencyScore: consistencyScore.toFixed(2)
    })

    // Prepare reasoning text for AI analysis
    const reasoningTexts = entries.map(entry => ({
      date: entry.activity_date,
      direction: entry.direction,
      activity: entry.activity_description || 'Not specified',
      reasoning: entry.reasoning,
      internal: entry.internal_state,
      external: entry.external_state
    }))

    // Use Claude Haiku to analyze patterns
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const systemPrompt = `You are a flow pattern analyst helping users understand their work patterns and energy flows.

TASK: Analyze flow entries and generate actionable insights.

FLOW COMPASS DIRECTIONS:
- North (excited + ease): Full flow state - keep going
- East (excited + resistance): Pivot needed - love it but something's not working
- South (tired + resistance): Rest or stop - not the right path
- West (tired + ease): New opportunity - explore what appeared

ANALYSIS FOCUS:
1. **Reasoning Clusters**: Group similar themes from reasoning text
   - Look for recurring activities, emotions, blockers, wins
   - Name clusters clearly (e.g., "Client Calls", "Deep Work", "Admin Tasks")
   - Each cluster should have: label, items (array of entry references), insight

2. **Key Patterns**: Identify behavioral patterns
   - Time of day patterns
   - Activity type patterns
   - Transition patterns (what leads to what)
   - Energy patterns (when excited vs tired)

3. **Recommendations**: Actionable suggestions based on patterns
   - What to do more of (North activities)
   - What to pivot (East activities)
   - What to rest from (South activities)
   - What new opportunities to explore (West activities)

OUTPUT: Return structured JSON with reasoning_clusters, key_patterns, and recommendations arrays.`

    const userPrompt = `Analyze these ${entries.length} flow entries from ${periodStartStr} to ${periodEndStr}:

DISTRIBUTION:
- North (excited + ease): ${distribution.north} entries (${((distribution.north/entries.length)*100).toFixed(0)}%)
- East (excited + resistance): ${distribution.east} entries (${((distribution.east/entries.length)*100).toFixed(0)}%)
- South (tired + resistance): ${distribution.south} entries (${((distribution.south/entries.length)*100).toFixed(0)}%)
- West (tired + ease): ${distribution.west} entries (${((distribution.west/entries.length)*100).toFixed(0)}%)

ENTRIES:
${JSON.stringify(reasoningTexts, null, 2)}

Generate insights with reasoning_clusters, key_patterns, and recommendations.`

    console.log('🤖 Calling Claude Haiku for analysis...')

    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }],
      tools: [{
        name: 'save_flow_analysis',
        description: 'Save the flow pattern analysis results',
        input_schema: {
          type: 'object',
          properties: {
            reasoning_clusters: {
              type: 'array',
              description: 'Semantic clusters of reasoning themes',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string', description: 'Cluster name' },
                  items: {
                    type: 'array',
                    description: 'Array of entry dates that belong to this cluster',
                    items: { type: 'string' }
                  },
                  insight: { type: 'string', description: 'What this cluster reveals' }
                },
                required: ['label', 'items', 'insight']
              }
            },
            key_patterns: {
              type: 'array',
              description: 'Key behavioral patterns identified',
              items: {
                type: 'object',
                properties: {
                  pattern: { type: 'string', description: 'Pattern description' },
                  evidence: { type: 'string', description: 'What supports this pattern' },
                  impact: { type: 'string', description: 'What this means for the user' }
                },
                required: ['pattern', 'evidence', 'impact']
              }
            },
            recommendations: {
              type: 'array',
              description: 'Actionable recommendations',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string', description: 'What to do' },
                  reason: { type: 'string', description: 'Why this will help' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                },
                required: ['action', 'reason', 'priority']
              }
            },
            summary_text: {
              type: 'string',
              description: 'Human-readable summary of the analysis (2-3 sentences)'
            }
          },
          required: ['reasoning_clusters', 'key_patterns', 'recommendations', 'summary_text']
        }
      }]
    })

    console.log('✅ Claude response received')

    // Extract tool use from response
    const toolUse = completion.content.find((block: any) => block.type === 'tool_use')

    if (!toolUse || toolUse.name !== 'save_flow_analysis') {
      console.error('No valid tool use in Claude response')
      throw new Error('AI did not return structured analysis')
    }

    const analysis = toolUse.input

    // Save to flow_patterns table
    const { data: pattern, error: saveError } = await supabase
      .from('flow_patterns')
      .upsert({
        user_id: userId,
        project_id: projectId,
        analysis_period: analysisPeriod,
        period_start: periodStartStr,
        period_end: periodEndStr,
        dominant_direction: dominantDirection,
        direction_distribution: distribution,
        consistency_score: consistencyScore,
        reasoning_clusters: analysis.reasoning_clusters,
        key_patterns: analysis.key_patterns,
        recommendations: analysis.recommendations,
        summary_text: analysis.summary_text,
        generated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,project_id,analysis_period,period_start'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving pattern:', saveError)
      throw saveError
    }

    console.log('✅ Pattern saved:', pattern.id)

    return new Response(
      JSON.stringify({
        success: true,
        pattern_id: pattern.id,
        entries_analyzed: entries.length,
        distribution,
        dominant_direction: dominantDirection,
        consistency_score: consistencyScore,
        insights: analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in flow-analyze:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
