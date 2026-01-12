// Supabase Edge Function: Analyze Post Metrics Screenshot
// Uses Claude Vision to extract engagement metrics from post performance screenshots

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedMetrics {
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  impressions: number | null
  reach: number | null
  engagement_rate: number | null
  profile_visits: number | null
  follows: number | null
  link_clicks: number | null
  video_views: number | null
  average_watch_time: string | null
  platform: string | null
  post_date: string | null
  content_type: string | null // carousel, reel, static, story
  performance_tier: 'low' | 'average' | 'good' | 'viral' | null
  insights: string[]
  confidence: number
}

async function analyzeMetricsScreenshot(imageBase64: string, mimeType: string): Promise<ExtractedMetrics> {
  const prompt = `You are a social media analytics assistant analyzing a screenshot of post performance metrics from platforms like Instagram Insights, LinkedIn Analytics, Twitter/X Analytics, Facebook Insights, TikTok Analytics, etc.

Extract ALL visible metrics from this image. Be precise with numbers - convert K to thousands (e.g., 1.2K = 1200) and M to millions.

IMPORTANT RULES:
1. Only extract metrics you can clearly see in the image
2. If a metric isn't visible, set it to null
3. For percentage metrics like engagement_rate, extract as decimal (e.g., 5.2% = 5.2)
4. Detect which platform this is from based on the UI design
5. Look for dates or time periods shown
6. Identify content type if visible (carousel, reel, video, static post, story)

Common metrics to look for:
- Likes/Hearts/Reactions
- Comments/Replies
- Shares/Reposts/Retweets
- Saves/Bookmarks
- Impressions (total views)
- Reach (unique accounts)
- Engagement Rate
- Profile Visits from post
- Follows from post
- Link/Website Clicks
- Video Views (for video content)
- Average Watch Time
- Play count

For performance_tier, evaluate based on the metrics:
- "low" = Below average engagement for the platform
- "average" = Typical engagement
- "good" = Above average, solid performance
- "viral" = Exceptional, significantly above normal

Generate 2-4 insights about this post's performance (what worked well, what could improve, patterns noticed).

Return ONLY valid JSON with this exact structure:
{
  "likes": number or null,
  "comments": number or null,
  "shares": number or null,
  "saves": number or null,
  "impressions": number or null,
  "reach": number or null,
  "engagement_rate": number or null (percentage as decimal),
  "profile_visits": number or null,
  "follows": number or null,
  "link_clicks": number or null,
  "video_views": number or null,
  "average_watch_time": "string" or null,
  "platform": "Instagram" | "LinkedIn" | "Twitter" | "Facebook" | "TikTok" | "YouTube" | null,
  "post_date": "YYYY-MM-DD" or null,
  "content_type": "carousel" | "reel" | "video" | "static" | "story" | null,
  "performance_tier": "low" | "average" | "good" | "viral" | null,
  "insights": ["insight 1", "insight 2", ...],
  "confidence": 0.0-1.0
}`

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
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
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
  const text = data.content?.[0]?.text || '{}'

  try {
    // Clean up potential markdown formatting
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedText)
  } catch (e) {
    console.error('JSON parse error:', e, 'Raw text:', text.substring(0, 500))
    return {
      likes: null,
      comments: null,
      shares: null,
      saves: null,
      impressions: null,
      reach: null,
      engagement_rate: null,
      profile_visits: null,
      follows: null,
      link_clicks: null,
      video_views: null,
      average_watch_time: null,
      platform: null,
      post_date: null,
      content_type: null,
      performance_tier: null,
      insights: [`Could not parse metrics from image. Raw response: ${text.substring(0, 100)}`],
      confidence: 0
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { imageBase64, mimeType } = body

    console.log(`📊 analyze-metrics-screenshot invoked`)

    if (!imageBase64) {
      throw new Error('imageBase64 is required')
    }

    if (!mimeType) {
      throw new Error('mimeType is required (e.g., image/jpeg, image/png)')
    }

    // Validate mime type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType}. Supported: ${validMimeTypes.join(', ')}`)
    }

    // Analyze the screenshot
    const metrics = await analyzeMetricsScreenshot(imageBase64, mimeType)

    return new Response(
      JSON.stringify({
        metrics,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in analyze-metrics-screenshot:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
