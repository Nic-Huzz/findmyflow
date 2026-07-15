import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64) throw new Error('No image provided')

    const mediaType = mimeType || 'image/jpeg'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Extract all book titles, podcast names, YouTube channel names, documentary titles, or course names visible in this image.

This could be:
- A photo of a bookshelf or stack of books
- A screenshot of a Goodreads list, Kindle library, or book app
- A screenshot of saved/subscribed podcasts (Spotify, Apple Podcasts, etc.)
- A screenshot of YouTube subscriptions or watch history
- A screenshot of courses (Udemy, Masterclass, etc.)

For each item found, provide the title and type.

Respond ONLY as JSON:
{"items": [{"title": "Book or Podcast Title", "type": "book|podcast|youtube|documentary|course"}]}

If you can't identify any titles, respond: {"items": []}
Do not guess or make up titles. Only extract what you can clearly read.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic error: ${response.status} ${errText}`)
    }

    const aiData = await response.json()
    const text = aiData.content?.[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in AI response')

    const parsed = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('extract-curiosities-from-image error:', err)
    return new Response(JSON.stringify({ error: err.message, items: [] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
