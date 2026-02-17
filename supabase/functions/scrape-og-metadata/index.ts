import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * oEmbed endpoints for major social platforms.
 * These return JSON with title, thumbnail_url, author_name, etc.
 */
const OEMBED_ENDPOINTS: Record<string, string> = {
  'youtube.com': 'https://www.youtube.com/oembed?format=json&url=',
  'youtu.be': 'https://www.youtube.com/oembed?format=json&url=',
  'tiktok.com': 'https://www.tiktok.com/oembed?url=',
  'twitter.com': 'https://publish.twitter.com/oembed?url=',
  'x.com': 'https://publish.twitter.com/oembed?url=',
  'instagram.com': 'https://graph.facebook.com/v18.0/instagram_oembed?url=',
  'facebook.com': 'https://graph.facebook.com/v18.0/oembed_post?url=',
  'vimeo.com': 'https://vimeo.com/api/oembed.json?url=',
  'linkedin.com': '', // LinkedIn has no public oEmbed — fall back to HTML scrape
}

/**
 * Detect which platform a URL belongs to.
 * Returns the matching domain key or null.
 */
function detectPlatform(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').replace(/^m\./, '')
    for (const domain of Object.keys(OEMBED_ENDPOINTS)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return domain
      }
    }
  } catch { /* invalid URL */ }
  return null
}

/**
 * Try oEmbed first, then fall back to HTML <meta> scraping.
 */
async function scrapeMetadata(url: string): Promise<{
  title: string | null
  image: string | null
  description: string | null
}> {
  const platform = detectPlatform(url)

  // --- oEmbed attempt ---
  if (platform && OEMBED_ENDPOINTS[platform]) {
    try {
      let oembedUrl = OEMBED_ENDPOINTS[platform] + encodeURIComponent(url)

      // Instagram/Facebook oEmbed needs an access token
      if (platform === 'instagram.com' || platform === 'facebook.com') {
        const fbAppId = Deno.env.get('FB_APP_ID')
        const fbAppSecret = Deno.env.get('FB_APP_SECRET')
        if (fbAppId && fbAppSecret) {
          oembedUrl += `&access_token=${fbAppId}|${fbAppSecret}`
        } else {
          // No FB credentials — skip oEmbed, fall through to HTML scrape
          console.log(`⚠️ No FB credentials for ${platform}, falling back to HTML scrape`)
          return await scrapeHtmlMeta(url)
        }
      }

      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'FindMyFlow/1.0' },
        signal: AbortSignal.timeout(8000),
      })

      if (res.ok) {
        const data = await res.json()
        return {
          title: data.title || data.author_name || null,
          image: data.thumbnail_url || null,
          description: data.author_name
            ? `by ${data.author_name}${data.provider_name ? ' on ' + data.provider_name : ''}`
            : data.provider_name || null,
        }
      }
      console.log(`oEmbed returned ${res.status} for ${platform}, falling back to HTML`)
    } catch (err) {
      console.log(`oEmbed failed for ${platform}: ${err}`)
    }
  }

  // --- HTML meta tag fallback ---
  return await scrapeHtmlMeta(url)
}

/**
 * Fetch the HTML page and extract og:title, og:image, og:description.
 * Also checks twitter:* meta tags as fallback.
 */
async function scrapeHtmlMeta(url: string): Promise<{
  title: string | null
  image: string | null
  description: string | null
}> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FindMyFlow/1.0; +https://findmyflow.nichuzz.com)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.log(`HTML fetch returned ${res.status} for ${url}`)
      return { title: null, image: null, description: null }
    }

    // Only read first 50KB to avoid huge pages
    const reader = res.body?.getReader()
    if (!reader) return { title: null, image: null, description: null }

    let html = ''
    const decoder = new TextDecoder()
    let bytesRead = 0
    const MAX_BYTES = 50_000

    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
      bytesRead += value.length
    }
    reader.cancel()

    const extract = (property: string): string | null => {
      // Match <meta property="og:title" content="..." /> or <meta name="twitter:title" content="..." />
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
      ]
      for (const re of patterns) {
        const match = html.match(re)
        if (match?.[1]) return decodeHtmlEntities(match[1])
      }
      return null
    }

    const title = extract('og:title') || extract('twitter:title') || extractHtmlTitle(html)
    const image = extract('og:image') || extract('twitter:image')
    const description = extract('og:description') || extract('twitter:description')

    return { title, image, description }
  } catch (err) {
    console.log(`HTML scrape failed for ${url}: ${err}`)
    return { title: null, image: null, description: null }
  }
}

function extractHtmlTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1]?.trim() || null
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { submissionId } = await req.json()
    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: 'submissionId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the submission's link_url
    const { data: submission, error: fetchError } = await supabaseClient
      .from('league_content_submissions')
      .select('id, link_url, content_type')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Skip player-picker submissions (link_url is JSON, not a URL)
    if (submission.content_type === 'comment_engage') {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'player_picker' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!submission.link_url) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_url' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Scraping OG metadata for: ${submission.link_url}`)
    const metadata = await scrapeMetadata(submission.link_url)

    // Only update if we got at least a title or image
    if (metadata.title || metadata.image) {
      const { error: updateError } = await supabaseClient
        .from('league_content_submissions')
        .update({
          og_title: metadata.title,
          og_image: metadata.image,
          og_description: metadata.description,
        })
        .eq('id', submissionId)

      if (updateError) {
        console.error('Error updating OG metadata:', updateError)
        throw updateError
      }

      console.log(`✅ Saved OG metadata: title="${metadata.title}", image=${!!metadata.image}`)
    } else {
      console.log('⚠️ No metadata found, skipping update')
    }

    return new Response(
      JSON.stringify({ success: true, metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in scrape-og-metadata:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
