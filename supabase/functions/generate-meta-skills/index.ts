// Supabase Edge Function: Generate Meta-Skills
// Analyzes clusters to identify higher-level themes and patterns

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const META_SKILLS_PROMPT = `
You are analyzing someone's skill clusters to identify higher-order meta-skills.

META-SKILLS are overarching patterns that appear ACROSS multiple clusters.
Think of them as the "operating system" beneath the specific "apps" (clusters).

EXAMPLES OF GOOD META-SKILLS:
- "Playful Innovation" - turning ideas into experiments, games, creative challenges
- "Energetic Transmission" - shifting group energy, performing, leading, entertaining
- "Systems Thinking" - seeing patterns, building frameworks, connecting dots
- "Embodied Expression" - using the body to communicate, move, create
- "Catalytic Presence" - sparking change in others, facilitating, activating

RULES:
1. Identify 2-3 meta-skills (not more!)
2. Each meta-skill must span at least 2 different clusters
3. Focus on HOW they do things, not WHAT they do
4. Use evocative, resonant language (like the cluster labels)
5. Each meta-skill should feel like a "superpower"

For each meta-skill, provide:
- name: Evocative 2-4 word name
- description: What this meta-skill IS and how it shows up
- supported_by: Which cluster IDs demonstrate this pattern
- rationale: Why you see this pattern across these clusters

Return ONLY valid JSON (no markdown):
{
  "meta_skills": [
    {
      "name": "Meta-Skill Name",
      "description": "Clear description of what this meta-skill represents and how it manifests.",
      "supported_by": ["cluster-id-1", "cluster-id-2"],
      "rationale": "Brief explanation of the pattern you see"
    }
  ]
}
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
    const body = await req.json()
    console.log('📥 Received request body:', JSON.stringify(body).substring(0, 200))

    const { clusters } = body

    if (!clusters || !Array.isArray(clusters) || clusters.length === 0) {
      console.log('⚠️ No clusters provided or invalid format')
      return new Response(
        JSON.stringify({ meta_skills: [] }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    if (clusters.length < 2) {
      console.log('⚠️ Need at least 2 clusters for meta-skills')
      return new Response(
        JSON.stringify({ meta_skills: [] }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Format clusters for Claude
    const clusterSummaries = clusters.map((cluster: any, idx: number) => {
      const items = cluster.items?.map((item: any) => item.text || item).slice(0, 5).join(', ') || 'no items'
      const moreItems = (cluster.items?.length || 0) > 5 ? ` (and ${cluster.items.length - 5} more)` : ''
      const archetypes = cluster.archetypes?.map((a: any) => a.name).join(', ') || 'none'

      return `Cluster ${idx + 1}: "${cluster.label || cluster.displayLabel || 'Unnamed'}"
  Items: ${items}${moreItems}
  Archetypes: ${archetypes}`
    }).join('\n\n')

    console.log('📊 Analyzing clusters for meta-skills...')
    console.log('Cluster count:', clusters.length)

    console.log('📊 Analyzing clusters for meta-skills:', clusterSummaries)

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
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `${META_SKILLS_PROMPT}\n\nClusters to analyze:\n${clusterSummaries}`
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

    // Ensure proper structure
    const response = {
      meta_skills: result.meta_skills || [],
      model: 'claude-3-haiku-20240307'
    }

    console.log('✨ Generated meta-skills:', response.meta_skills.length)

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
    console.error('❌ Error in generate-meta-skills:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        meta_skills: [],
        debug: {
          errorName: error.name,
          errorMessage: error.message
        }
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
