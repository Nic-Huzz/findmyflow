// Supabase Edge Function: Voice Analyzer
// Analyzes user inputs to generate a personalized voice profile

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Build the voice analysis prompt
function buildAnalysisPrompt(voiceData: any) {
  const {
    originStory,
    audienceDescription,
    successStory,
    uniqueApproach,
    preferences,
    catchphrases,
    contentSamples
  } = voiceData

  const hasSamples = contentSamples && contentSamples.length > 0 && contentSamples.some((s: string) => s.trim().length > 0)

  let samplesSection = ''
  if (hasSamples) {
    samplesSection = `
ACTUAL CONTENT SAMPLES (analyze these for patterns):
${contentSamples.filter((s: string) => s.trim()).map((s: string, i: number) => `
Sample ${i + 1}:
"${s}"
`).join('\n')}
`
  }

  const prompt = `You are an expert voice analyst and copywriting coach. Analyze the following inputs from a creator to build their unique voice profile.

USER INPUTS:

ORIGIN STORY (how they describe their journey):
"${originStory || 'Not provided'}"

AUDIENCE DESCRIPTION (how they describe their ideal client):
"${audienceDescription || 'Not provided'}"

SUCCESS STORY (how they share wins):
"${successStory || 'Not provided'}"

UNIQUE APPROACH (their contrarian view):
"${uniqueApproach || 'Not provided'}"

STYLE PREFERENCES (sliders 0-100):
- Sentence Length: ${preferences?.sentenceLength || 50} (0=short & punchy, 100=long & flowing)
- Emoji Usage: ${preferences?.emojiUsage || 40} (0=rarely, 100=often)
- Humor Level: ${preferences?.humorLevel || 50} (0=serious, 100=playful)
- Formality: ${preferences?.formalityLevel || 40} (0=casual, 100=professional)
- Vulnerability: ${preferences?.vulnerabilityLevel || 50} (0=private, 100=open)

CATCHPHRASES/SIGNATURE EXPRESSIONS:
${catchphrases && catchphrases.length > 0 ? catchphrases.map((p: string) => `- "${p}"`).join('\n') : 'None provided'}

${samplesSection}

TASK: Create a comprehensive voice profile that captures this person's unique communication style.

Analyze:
1. Their vocabulary patterns (simple vs sophisticated, industry jargon usage)
2. Their sentence structure (short punchy vs flowing, questions vs statements)
3. Their emotional expression (how they show empathy, excitement, frustration)
4. Their storytelling style (detail level, chronological vs thematic)
5. Their hook style (questions, bold statements, stories, statistics)
6. Their call-to-action style (direct vs soft, urgency level)
7. Their authenticity markers (vulnerability, humor, directness)

Return ONLY valid JSON in this exact format:
{
  "voiceType": "A 2-4 word label for their voice style (e.g., 'Warm Challenger', 'Direct Educator', 'Relatable Mentor')",
  "summary": "A 2-3 sentence description of their voice that could be used as writing instructions",
  "traits": ["5-7 adjectives that describe their voice"],
  "patterns": {
    "hookStyle": "How they open content (e.g., 'Questions that create curiosity', 'Bold statements')",
    "sentenceFlow": "Their rhythm (e.g., 'Short, punchy. Then longer explanations.')",
    "emotionalTone": "Their emotional baseline (e.g., 'Warm but direct')",
    "vocabularyLevel": "Simple/Sophisticated/Mixed with industry terms",
    "storytellingStyle": "How they tell stories (e.g., 'Vivid details, chronological')"
  },
  "doAndDont": {
    "do": ["3-5 specific things to DO to sound like them"],
    "dont": ["3-5 specific things to AVOID to maintain authenticity"]
  },
  "sampleOutput": "Write a 2-3 sentence social media hook IN THEIR VOICE about overcoming obstacles"
}

Be specific. Generic advice like "be authentic" is useless. Capture what makes THIS person's voice unique.`

  return prompt
}

// Call Claude to analyze voice
async function analyzeVoice(voiceData: any) {
  const prompt = buildAnalysisPrompt(voiceData)

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
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    // Parse JSON from response (handle markdown code blocks)
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanText)
  } catch (e) {
    console.error('Failed to parse voice analysis:', e, text)
    // Return a fallback profile
    return {
      voiceType: 'Custom Voice',
      summary: 'Your unique voice has been captured based on your inputs.',
      traits: ['authentic', 'conversational', 'engaging'],
      patterns: {
        hookStyle: 'Direct and engaging',
        sentenceFlow: 'Natural rhythm',
        emotionalTone: 'Warm and approachable'
      },
      doAndDont: {
        do: ['Be yourself', 'Use your natural expressions', 'Tell stories'],
        dont: ['Sound corporate', 'Use jargon unnecessarily', 'Be overly formal']
      },
      sampleOutput: 'Ready to create authentic content in your voice.'
    }
  }
}

// Save profile to database
async function saveProfile(userId: string, voiceData: any, analysisResult: any) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  const profileData = {
    user_id: userId,
    voice_type: analysisResult.voiceType,
    voice_summary: analysisResult.summary,
    voice_traits: analysisResult.traits,
    writing_patterns: analysisResult.patterns,
    do_and_dont: analysisResult.doAndDont,
    sample_output: analysisResult.sampleOutput,
    // Store raw input data
    origin_story: voiceData.originStory,
    audience_description: voiceData.audienceDescription,
    success_story: voiceData.successStory,
    unique_approach: voiceData.uniqueApproach,
    // Style preferences
    sentence_length: voiceData.preferences?.sentenceLength || 50,
    emoji_usage: voiceData.preferences?.emojiUsage || 40,
    humor_level: voiceData.preferences?.humorLevel || 50,
    formality_level: voiceData.preferences?.formalityLevel || 40,
    vulnerability_level: voiceData.preferences?.vulnerabilityLevel || 50,
    // Extras
    catchphrases: voiceData.catchphrases || [],
    content_samples: voiceData.contentSamples || [],
    is_template: false,
    updated_at: new Date().toISOString()
  }

  // Upsert - update if exists, insert if not
  const { data, error } = await supabase
    .from('voice_profiles')
    .upsert(profileData, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving voice profile:', error)
    throw error
  }

  return data
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { userId, voiceData } = body

    if (!userId) {
      throw new Error('userId is required')
    }

    if (!voiceData) {
      throw new Error('voiceData is required')
    }

    console.log('Analyzing voice for user:', userId)

    // Step 1: Analyze voice with Claude
    const analysisResult = await analyzeVoice(voiceData)

    // Step 2: Save to database
    const savedProfile = await saveProfile(userId, voiceData, analysisResult)

    // Return the profile
    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          ...savedProfile,
          // Also include the analysis result fields in a normalized format
          voiceType: analysisResult.voiceType,
          summary: analysisResult.summary,
          traits: analysisResult.traits,
          patterns: analysisResult.patterns,
          doAndDont: analysisResult.doAndDont,
          sampleOutput: analysisResult.sampleOutput
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in voice-analyzer:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
