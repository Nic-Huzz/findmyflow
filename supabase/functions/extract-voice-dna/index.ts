// Supabase Edge Function: Extract Voice DNA
// Analyzes existing content to extract voice patterns and create a voice profile

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoiceDNA {
  // Core voice characteristics
  tone_descriptors: string[]           // e.g., ["conversational", "authoritative", "warm"]
  formality_level: number              // 1-10 (1 = very casual, 10 = very formal)
  energy_level: number                 // 1-10 (1 = calm/mellow, 10 = high-energy)

  // Writing patterns
  signature_phrases: string[]          // Phrases they frequently use
  hook_styles: string[]                // How they typically start content
  closing_styles: string[]             // How they typically end content

  // Sentence structure
  avg_sentence_length: 'short' | 'medium' | 'long' | 'varied'
  uses_questions: boolean
  uses_bullet_points: boolean
  uses_emojis: boolean
  emoji_frequency: 'none' | 'minimal' | 'moderate' | 'heavy'

  // Content patterns
  primary_topics: string[]             // Main themes they discuss
  story_driven: boolean                // Do they use personal stories?
  uses_data: boolean                   // Do they cite stats/research?
  uses_analogies: boolean              // Do they explain with comparisons?

  // Voice essence (for prompt building)
  voice_essence: string                // 2-3 sentence summary of their voice
  dos: string[]                        // Things to do when writing in their voice
  donts: string[]                      // Things to avoid

  // Sample content that exemplifies their voice
  best_examples: string[]              // 2-3 excerpts that best represent their style

  confidence: number                   // 0-1 based on content quality/quantity
}

async function extractVoiceDNA(contentSamples: string[]): Promise<VoiceDNA> {
  const combinedContent = contentSamples.join('\n\n---\n\n')

  const prompt = `You are a voice analysis expert. Analyze the following content samples to extract the author's unique voice DNA - their writing style, patterns, and characteristics.

CONTENT SAMPLES:
${combinedContent}

---

Analyze deeply and extract:

1. TONE: What's their overall vibe? (e.g., conversational, authoritative, playful, inspirational, edgy, warm)
2. FORMALITY: How formal/casual are they? (1 = texts with friends, 10 = corporate email)
3. ENERGY: What's their energy level? (1 = zen master, 10 = hypeman)

4. SIGNATURE PHRASES: Any phrases they repeatedly use? ("Here's the thing...", "Real talk:", etc.)
5. HOOKS: How do they typically start content? (Questions? Bold statements? Stories?)
6. CLOSINGS: How do they wrap up? (CTAs? Questions? Mic drops?)

7. SENTENCE STRUCTURE:
   - Average length: short (1-8 words), medium (9-15), long (16+), or varied
   - Do they use questions to engage?
   - Do they use bullet points/lists?
   - Emoji usage: none, minimal, moderate, or heavy

8. CONTENT PATTERNS:
   - Main topics they discuss
   - Do they tell personal stories?
   - Do they cite data/research?
   - Do they use analogies/metaphors?

9. VOICE ESSENCE: Write 2-3 sentences that capture the essence of their voice - as if you're describing to another writer how to sound exactly like them.

10. DOS: 5 specific things to DO when writing in their voice
11. DON'TS: 5 specific things to AVOID when writing in their voice

12. BEST EXAMPLES: Pick 2-3 short excerpts (1-2 sentences each) that best exemplify their unique voice.

Return ONLY valid JSON with this structure:
{
  "tone_descriptors": ["descriptor1", "descriptor2", "descriptor3"],
  "formality_level": 1-10,
  "energy_level": 1-10,
  "signature_phrases": ["phrase1", "phrase2"],
  "hook_styles": ["Question hooks", "Bold statement openers", etc.],
  "closing_styles": ["CTA closings", "Question endings", etc.],
  "avg_sentence_length": "short" | "medium" | "long" | "varied",
  "uses_questions": true/false,
  "uses_bullet_points": true/false,
  "uses_emojis": true/false,
  "emoji_frequency": "none" | "minimal" | "moderate" | "heavy",
  "primary_topics": ["topic1", "topic2"],
  "story_driven": true/false,
  "uses_data": true/false,
  "uses_analogies": true/false,
  "voice_essence": "2-3 sentence description...",
  "dos": ["do1", "do2", "do3", "do4", "do5"],
  "donts": ["dont1", "dont2", "dont3", "dont4", "dont5"],
  "best_examples": ["example1...", "example2..."],
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
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt
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
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedText)
  } catch (e) {
    console.error('JSON parse error:', e, 'Raw text:', text.substring(0, 500))
    throw new Error('Failed to parse voice DNA analysis')
  }
}

// Convert Voice DNA to a format compatible with existing voice_profiles table
function mapToVoiceProfile(dna: VoiceDNA): any {
  // Map formality level to tone
  let tone = 'conversational'
  if (dna.formality_level >= 7) tone = 'professional'
  else if (dna.formality_level >= 5) tone = 'balanced'
  else if (dna.formality_level <= 2) tone = 'casual'

  // Map energy level
  let energyStyle = 'balanced'
  if (dna.energy_level >= 7) energyStyle = 'high-energy'
  else if (dna.energy_level <= 3) energyStyle = 'calm'

  return {
    // Core traits from DNA
    tone,
    energy: energyStyle,
    voice_descriptors: dna.tone_descriptors,

    // Writing style
    sentence_style: dna.avg_sentence_length,
    uses_questions: dna.uses_questions,
    uses_lists: dna.uses_bullet_points,
    emoji_style: dna.emoji_frequency,

    // Patterns
    signature_phrases: dna.signature_phrases,
    hook_preferences: dna.hook_styles,
    closing_preferences: dna.closing_styles,

    // Content approach
    primary_topics: dna.primary_topics,
    uses_stories: dna.story_driven,
    uses_data: dna.uses_data,
    uses_analogies: dna.uses_analogies,

    // Voice essence for prompts
    voice_essence: dna.voice_essence,
    voice_dos: dna.dos,
    voice_donts: dna.donts,
    sample_content: dna.best_examples,

    // Source tracking
    extracted_from: 'voice_dna_import',
    extraction_confidence: dna.confidence
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { contentSamples } = body

    console.log(`🧬 extract-voice-dna invoked with ${contentSamples?.length || 0} samples`)

    if (!contentSamples || !Array.isArray(contentSamples) || contentSamples.length === 0) {
      throw new Error('contentSamples array is required')
    }

    // Filter out empty/short samples
    const validSamples = contentSamples
      .map(s => s.trim())
      .filter(s => s.length >= 50) // At least 50 chars

    if (validSamples.length === 0) {
      throw new Error('No valid content samples provided. Each sample should be at least 50 characters.')
    }

    // Limit to reasonable amount
    const samplesToAnalyze = validSamples.slice(0, 10) // Max 10 samples

    // Extract voice DNA
    const voiceDNA = await extractVoiceDNA(samplesToAnalyze)

    // Map to voice profile format
    const voiceProfile = mapToVoiceProfile(voiceDNA)

    return new Response(
      JSON.stringify({
        voiceDNA,
        voiceProfile,
        samplesAnalyzed: samplesToAnalyze.length,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in extract-voice-dna:', error)
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
