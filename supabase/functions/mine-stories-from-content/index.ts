/**
 * Mine Stories from Content Edge Function
 * Analyzes past content to extract reusable stories, examples, and insights
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STORY_CATEGORIES = [
  'transformation_story',
  'client_win',
  'failure_lesson',
  'origin_story',
  'belief_statement',
  'controversial_take',
  'daily_observation',
  'milestone_moment',
  'gratitude_moment',
  'teaching_moment'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contents, userId } = await req.json()

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid contents array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are an expert content strategist who specializes in extracting reusable story elements from existing content.

Your task is to analyze the provided content pieces and extract standalone stories, examples, and insights that can be repurposed in future content.

Focus on extracting:
1. **Personal stories** - Real experiences that illustrate a point
2. **Client examples** - Success stories, transformations, results
3. **Lessons learned** - Mistakes made and what was learned
4. **Unique perspectives** - Strong opinions or unconventional takes
5. **Memorable moments** - Milestones, celebrations, observations

For each extracted story, categorize it:
- transformation_story: Before/after journeys showing change
- client_win: Client success stories and results
- failure_lesson: Mistakes made and lessons learned
- origin_story: How something started or began
- belief_statement: Strong opinions or principles
- controversial_take: Unpopular but true opinions
- daily_observation: Insights from everyday life
- milestone_moment: Achievements or celebrations
- gratitude_moment: Things to be thankful for
- teaching_moment: Educational insights

Extract the CORE story, removing platform-specific formatting or call-to-actions.
Make each story self-contained and reusable.

Return your response as JSON:
{
  "stories": [
    {
      "category": "transformation_story",
      "title": "Short descriptive title",
      "content": "The extracted story written in a reusable, platform-agnostic way."
    }
  ]
}

Only extract meaningful stories - skip content that's purely promotional or doesn't contain a story element.
If no stories can be extracted, return: { "stories": [] }
Only return valid JSON, no other text.`

    const contentText = contents.map((c, i) => `--- Content ${i + 1} ---\n${c}`).join('\n\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Please analyze the following ${contents.length} content pieces and extract any reusable stories, examples, or insights:\n\n${contentText}`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', errorText)
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const textContent = data.content?.[0]?.text || '{}'

    // Parse the JSON response
    let stories = []
    try {
      const parsed = JSON.parse(textContent)
      stories = parsed.stories || []

      // Validate and clean stories
      stories = stories.filter((s: any) =>
        s.content &&
        s.content.length >= 50 && // Minimum length for a useful story
        STORY_CATEGORIES.includes(s.category)
      ).map((s: any) => ({
        category: s.category,
        title: s.title || null,
        content: s.content.trim()
      }))
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr)
      stories = []
    }

    return new Response(
      JSON.stringify({ stories }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error mining stories:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to mine stories from content' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
