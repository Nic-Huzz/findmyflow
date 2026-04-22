// Supabase Edge Function: Experience Blueprint AI
// Powers the Shift Architecture blueprint flow with 3 actions:
//   1. suggest_experiences — from placemakes, suggest experience concepts
//   2. suggest_encoding — suggest target protective pattern + prediction
//   3. generate_arc — pre-fill the 6 Shift Architecture phases

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Protective Patterns ────────────────────────────────────────────────────

const PROTECTIVE_PATTERNS: Record<string, { name: string; prediction: string; description: string }> = {
  ghost: {
    name: 'The Ghost',
    prediction: 'If I am seen, I will be rejected',
    description: 'Disappears, hides, stays invisible. Being seen feels dangerous.',
  },
  performer: {
    name: 'The Performer',
    prediction: 'If I stop achieving, I will not be valued',
    description: 'Achieves, impresses, always ON. Earns love through what they do.',
  },
  controller: {
    name: 'The Controller',
    prediction: 'If I let go, everything will fall apart',
    description: 'Grips, manages, can\'t delegate. White-knuckles through life.',
  },
  perfectionist: {
    name: 'The Perfectionist',
    prediction: 'If I make a mistake, it will be catastrophic',
    description: 'Prepares, polishes, waits. Nothing is ever ready.',
  },
  people_pleaser: {
    name: 'The People Pleaser',
    prediction: 'If I say no, I will be abandoned',
    description: 'Says yes when they mean no. Abandons self to keep others happy.',
  },
}

// ─── Shift Architecture Phases ──────────────────────────────────────────────

const ARC_PHASE_GUIDANCE = [
  {
    id: 'safety',
    name: 'Safety + Connection',
    facilitatorGuide: `Build the container. Your participants need to feel safe BEFORE you take them anywhere deep.
Tools: movement (walking, shaking), eye contact exercises, music with presence, "why are you here?" prompts.
Goal: Ventral vagal activation. Co-regulation. Below the neck before anything cognitive.
Reference: The intro walk in the Rewiring Beliefs workshop (5 stages of movement from freeze-breaking to state embodiment).`,
  },
  {
    id: 'activation',
    name: 'Activation',
    facilitatorGuide: `Surface the emotional learning. The encoding must be FELT, not discussed intellectually.
Tools: Guided body scan, somatic tracking ("where do you feel it?"), sentence completion ("I have to [pattern] because if I don't..."), age regression ("how old does that voice feel?").
Critical: "I don't want you to think about the answer. I want you to FEEL it." The body must be engaged, not just the mind.
Watch for: protector showing up as analysis, calm narration, or going blank. Name it gently if detected.`,
  },
  {
    id: 'mismatch',
    name: 'Mismatch',
    facilitatorGuide: `THIS IS THE DESIGN HEART. While the old learning is live, the participant has an experience that contradicts what the encoding predicts.
The mismatch must be:
- FELT, not just understood (experiential, not cognitive)
- From THEIR life (counter-evidence they access through body memory, not your reassurance)
- Simultaneous with the activation (juxtaposition: "On one hand [old learning]. On the other hand [new experience]. What happens when you hold both?")
Tools: Counter-evidence memory access, physical step forward (completing the frozen action), group witnessing.
The prediction error is what destabilizes the encoding. Too little = nothing changes. Too much = system shuts down. Titrate.`,
  },
  {
    id: 'discharge',
    name: 'Discharge',
    facilitatorGuide: `The body has been holding frozen fight/flight energy. Now it needs to complete.
Tools: Connected breathwork (in through mouth, out through mouth, no pause), shaking (soft knees, loose arms), sound (sigh, groan, growl), movement.
Signs of discharge: trembling, spontaneous deep breaths, relief tears (different from activation tears), heat/tingling, yawning, stomach gurgling.
DO NOT rush this. DO NOT narrate it. Just hold the space. "Whatever your body needs to do right now is welcome."`,
  },
  {
    id: 'integration',
    name: 'Integration',
    facilitatorGuide: `The encoding is updating. Now anchor the new truth.
Tools: Inner child visualization (see younger self, approach them, hold them, tell them what they needed to hear), new truth declaration ("say it again, to yourself, to the child, to both of you"), self-holding (hand on chest, arms wrapped).
The message the participant gives their inner child IS the new encoding. "That's not just for them. That's for YOU."
Then: witnessing circle. "Healing that stays hidden stays small. Healing that's witnessed becomes real."`,
  },
  {
    id: 'verification',
    name: 'Verification',
    facilitatorGuide: `Check whether the shift actually happened. Don't assume.
Tools: Re-check the original trigger ("think about that stuck situation from the beginning. Notice what happens in your body NOW"). Before/after tension score (1-10).
Signs of reconsolidation: "It feels lighter", "The fear is smaller", "I feel like I could actually do it now", "I can't find the old feeling."
Close with: grounding (feet on floor, name 3 things you see), water, gentle re-entry. Set a repetition challenge for the next 48 hours within the reconsolidation window.`,
  },
]

// ─── Prompts ────────────────────────────────────────────────────────────────

const SUGGEST_EXPERIENCES_PROMPT = `You are helping an aspiring experience creator design their first transformational experience.

They have discovered their "play-skills" — the things that genuinely light them up, that feel like play not work. These are identity-level action statements, not generic skills.

THEIR PLAY-SKILLS:
{{placemakes}}

Your task: Suggest 3 experience concepts that use these play-skills to create genuine transformation for others. Each experience should be:
1. Something they could run in the next 2-4 weeks (not a 6-month course)
2. Anchored in their specific play-skills (not generic "wellness workshop")
3. Framed around the SHIFT it creates, not the activities it includes
4. Realistic for someone running their first or early experiences (not a 200-person event)

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "name": "Short, evocative name (3-7 words)",
      "description": "1-2 sentences describing the shift participants walk away with. Not what happens IN the experience, but what changes AFTER it."
    }
  ]
}`

const SUGGEST_ENCODING_PROMPT = `You are helping an experience creator identify which protective pattern their experience needs to target.

THE EXPERIENCE:
Name: "{{experienceName}}"
Description: "{{experienceDescription}}"
Creator's play-skills: {{placemakes}}

THE 5 PROTECTIVE PATTERNS:
{{patterns}}

Your task: Based on the type of experience and the transformation it promises, which protective pattern is the participant MOST likely carrying that prevents them from receiving the shift?

Think about who would sign up for this experience and what's stopping them from already having the transformation it offers.

Return ONLY valid JSON:
{
  "pattern": "ghost|performer|controller|perfectionist|people_pleaser",
  "prediction": "If I [specific action], [specific feared outcome]",
  "reasoning": "1-2 sentences explaining why this pattern fits"
}`

const GENERATE_ARC_PROMPT = `You are a Shift Architecture expert helping an experience creator design a reconsolidation container.

Shift Architecture is a framework for designing experiences that intentionally create the 3 neurological conditions for memory reconsolidation:
1. REACTIVATION — the old emotional learning must be felt in the body
2. MISMATCH — while activated, the person has an experience contradicting the encoding's prediction
3. REPETITION — the mismatch happens within the reconsolidation window (~5 hours)

THE EXPERIENCE:
Name: "{{experienceName}}"
Description: "{{experienceDescription}}"
Creator's play-skills: {{placemakes}}

TARGET ENCODING:
Pattern: {{patternName}} — {{patternDescription}}
Prediction to contradict: "{{targetPrediction}}"

THE 6 PHASES (fixed structure, you fill in the content):
{{phaseGuidance}}

Your task: For each of the 6 phases, write specific facilitation content tailored to THIS experience, THIS encoding, and THIS creator's play-skills. The content should be:
1. Specific enough to follow (not "do a body scan" but "guide participants through a 3-minute body scan focusing on the chest and throat where {{patternName}} patterns typically hold tension")
2. Connected to the creator's play-skills (if they're a dancer, use movement; if they're a storyteller, use narrative)
3. Appropriate for a group setting (not 1:1 therapy)
4. Safe and ethical (titration, consent, opt-out options)

For the Mismatch phase specifically:
- Design the moment where the prediction "{{targetPrediction}}" is contradicted
- The mismatch must be EXPERIENTIAL, not cognitive (felt in the body, not just understood)
- Include a specific somatic tool suggestion

Return ONLY valid JSON:
{
  "phases": [
    {
      "content": "Specific facilitation content for this phase (3-5 sentences)",
      "somaticTool": "Primary somatic tool for this phase (e.g., 'connected breathwork', 'movement walking', 'guided visualization')"
    }
  ]
}

Return exactly 6 phases in order: Safety, Activation, Mismatch, Discharge, Integration, Verification.`

// ─── Helper ─────────────────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.content[0]?.text || '{}'
}

function parseJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0])
}

// ─── Handler ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const body = await req.json()
    const { action } = body

    // ── Action 1: Suggest Experiences ──────────────────────────────────

    if (action === 'suggest_experiences') {
      const { placemakes } = body
      if (!placemakes?.length) {
        return new Response(
          JSON.stringify({ error: 'No placemakes provided', suggestions: [] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const prompt = SUGGEST_EXPERIENCES_PROMPT.replace(
        '{{placemakes}}',
        placemakes.map((p: string, i: number) => `${i + 1}. "${p}"`).join('\n')
      )

      const responseText = await callClaude(
        'You suggest transformational experience concepts based on play-skills. Return only valid JSON.',
        prompt
      )

      const parsed = parseJSON(responseText)
      return new Response(
        JSON.stringify({ suggestions: parsed.suggestions || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Action 2: Suggest Encoding ────────────────────────────────────

    if (action === 'suggest_encoding') {
      const { experienceName, experienceDescription, placemakes } = body

      const patternsBlock = Object.entries(PROTECTIVE_PATTERNS)
        .map(([id, p]) => `- ${id}: "${p.name}" — ${p.description} Prediction: "${p.prediction}"`)
        .join('\n')

      const prompt = SUGGEST_ENCODING_PROMPT
        .replace('{{experienceName}}', experienceName || '')
        .replace('{{experienceDescription}}', experienceDescription || '')
        .replace('{{placemakes}}', (placemakes || []).join(', '))
        .replace('{{patterns}}', patternsBlock)

      const responseText = await callClaude(
        'You identify which protective pattern an experience should target. Return only valid JSON.',
        prompt
      )

      const parsed = parseJSON(responseText)

      // Validate pattern ID
      const validPattern = PROTECTIVE_PATTERNS[parsed.pattern] ? parsed.pattern : 'ghost'

      return new Response(
        JSON.stringify({
          pattern: validPattern,
          prediction: parsed.prediction || PROTECTIVE_PATTERNS[validPattern].prediction,
          reasoning: parsed.reasoning || '',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Action 3: Generate Arc ────────────────────────────────────────

    if (action === 'generate_arc') {
      const { experienceName, experienceDescription, targetPattern, targetPrediction, placemakes } = body

      const pattern = PROTECTIVE_PATTERNS[targetPattern] || PROTECTIVE_PATTERNS.ghost

      const phaseGuidanceBlock = ARC_PHASE_GUIDANCE
        .map((p, i) => `Phase ${i + 1}: ${p.name}\nFacilitator guidance: ${p.facilitatorGuide}`)
        .join('\n\n')

      const prompt = GENERATE_ARC_PROMPT
        .replace('{{experienceName}}', experienceName || '')
        .replace('{{experienceDescription}}', experienceDescription || '')
        .replace('{{placemakes}}', (placemakes || []).join(', '))
        .replace(/\{\{patternName\}\}/g, pattern.name)
        .replace(/\{\{patternDescription\}\}/g, pattern.description)
        .replace(/\{\{targetPrediction\}\}/g, targetPrediction || pattern.prediction)
        .replace('{{phaseGuidance}}', phaseGuidanceBlock)

      const responseText = await callClaude(
        'You are a Shift Architecture expert. You design the 6 phases of a reconsolidation container for group experiences. Return only valid JSON with exactly 6 phases.',
        prompt
      )

      const parsed = parseJSON(responseText)

      // Validate we got 6 phases
      const phases = (parsed.phases || []).slice(0, 6)
      while (phases.length < 6) {
        phases.push({ content: '', somaticTool: '' })
      }

      return new Response(
        JSON.stringify({ phases }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Unknown action ────────────────────────────────────────────────

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('experience-blueprint-ai error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
