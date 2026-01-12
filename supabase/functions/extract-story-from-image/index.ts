/**
 * Extract Story from Image Edge Function
 * Uses Claude's vision capabilities to extract stories from screenshots
 * (testimonials, DMs, reviews, etc.)
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
    const { image, userId } = await req.json()

    if (!image || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing image or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const mediaType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg'

    const systemPrompt = `You are an expert at extracting reusable stories and content from screenshots.
Your job is to analyze images of testimonials, DM conversations, reviews, or any text-based screenshots
and extract the meaningful stories that can be repurposed for content creation.

For each story you extract, categorize it into one of these categories:
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

Extract the key story elements and write them in a way that's ready to be used in content.
Focus on the emotional journey, the transformation, or the key insight.

Return your response as a JSON array of stories with this structure:
{
  "stories": [
    {
      "category": "client_win",
      "title": "Short descriptive title (optional)",
      "content": "The extracted story written in a reusable way. Include the key details, emotions, and transformation."
    }
  ]
}

If no meaningful stories can be extracted, return: { "stories": [] }
Only return valid JSON, no other text.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: 'Please analyze this screenshot and extract any reusable stories, testimonials, or insights. Categorize each story appropriately.'
              }
            ]
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

      // Validate categories
      stories = stories.filter((s: any) =>
        s.content &&
        STORY_CATEGORIES.includes(s.category)
      ).map((s: any) => ({
        category: s.category,
        title: s.title || null,
        content: s.content
      }))
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr)
      // Try to extract stories from plain text if JSON parsing fails
      stories = []
    }

    return new Response(
      JSON.stringify({ stories }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error extracting story:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to extract story from image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
