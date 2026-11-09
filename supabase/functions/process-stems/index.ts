/**
 * Edge Function: process-stems
 * Processes voice stem transcripts through Claude to extract structured data.
 * Stage 1: essence themes, skills, heroes
 * Stage 2: prediction, source event, protective pattern, full thread
 * Stage 3: 5-dimension aliveness scores
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const client = new Anthropic()

function buildStage1Prompt(transcripts: any[]): string {
  const stemLines = transcripts.map(t =>
    `"${t.stemText}"\nResponse: ${t.transcript || '(no response)'}`
  ).join('\n\n')

  return `You are analyzing rapid spoken sentence completions from a self-discovery exercise about childhood.

Each stem was completed vocally 6-8 times in 30 seconds. The responses are raw, unfiltered, and may be fragmented.

${stemLines}

Extract the following and return ONLY valid JSON (no markdown, no explanation):

{
  "essenceThemes": [
    { "label": "short theme label (2-4 words)", "evidence": "key phrases from transcripts that support this" }
  ],
  "skills": ["skill1", "skill2"],
  "heroes": ["hero1", "hero2"],
  "summary": "One sentence: who this person was as a kid, written in second person ('You were...')"
}

Rules:
- Extract 3-4 essence themes maximum
- Theme labels should be vivid and specific, not generic (not "creativity" but "building imaginary worlds")
- Skills are activities they naturally gravitated toward
- Heroes can be real people, fictional characters, or archetypes
- The summary should feel like a mirror, not a clinical assessment`
}

function buildStage2Prompt(transcripts: any[], selectedExpression: string, confirmedPrediction: string): string {
  const layer2 = transcripts.filter(t => t.stemId.startsWith('s2a_'))
  const layer3 = transcripts.filter(t => t.stemId.startsWith('s2b_'))

  const layer2Lines = layer2.map(t =>
    `"${t.stemText}"\nResponse: ${t.transcript || '(no response)'}`
  ).join('\n\n')

  const layer3Lines = layer3.map(t =>
    `"${t.stemText}"\nResponse: ${t.transcript || '(no response)'}`
  ).join('\n\n')

  return `You are analyzing rapid spoken sentence completions about suppressed expression.

The participant identified "${selectedExpression}" as their most charged essence theme from childhood.
They confirmed "${confirmedPrediction}" as their dominant fear/prediction.

LAYER 2 — Struggles + Prediction:
${layer2Lines}

LAYER 3 — Source:
${layer3Lines}

Extract the following and return ONLY valid JSON:

{
  "prediction": "The dominant prediction in one sentence (e.g., 'If I express myself, people will reject me')",
  "sourceEvent": {
    "who": "The person involved",
    "what": "What happened",
    "approximateAge": "Best guess at age when this happened"
  },
  "rule": "The rule they made (e.g., 'To stay safe, I stopped being loud')",
  "protectivePattern": "One of: Ghost, Perfectionist, People Pleaser, Controller, Auto-Pilot",
  "thread": "Full connection in second person: 'You loved [X]. You learned that [Y] was dangerous because [Z]. So you started [rule]. That pattern is still running.'",
  "predictions": ["prediction option 1", "prediction option 2", "prediction option 3"]
}

Rules:
- The "predictions" array is used BEFORE layer 3 — it's the 2-3 options the participant chose from
- The thread should feel like an insight, not a diagnosis
- Use their actual words where possible
- protectivePattern: Ghost = disappears/hides, Perfectionist = over-prepares, People Pleaser = prioritises others, Controller = needs certainty, Auto-Pilot = goes through motions`
}

function buildStage3Prompt(transcripts: any[]): string {
  const stemLines = transcripts.map(t =>
    `[${t.dimension?.toUpperCase() || 'UNKNOWN'}] "${t.stemText}"\nResponse: ${t.transcript || '(no response)'}`
  ).join('\n\n')

  return `You are analyzing rapid spoken sentence completions about someone's current life state.

Each dimension has two stems. Score each dimension 1-5 based on what the participant actually said.

${stemLines}

Return ONLY valid JSON:

{
  "dimensions": {
    "choice": { "score": 1-5, "insight": "One sentence about their choice/freedom state" },
    "connection": { "score": 1-5, "insight": "One sentence about their connection state" },
    "growth": { "score": 1-5, "insight": "One sentence about their growth/engagement state" },
    "meaning": { "score": 1-5, "insight": "One sentence about their meaning/alignment state" },
    "safety": { "score": 1-5, "insight": "One sentence about their safety/visibility state" }
  },
  "lowestDimension": "the dimension with the lowest score",
  "overallInsight": "One sentence connecting the lowest dimension to suppression"
}

Scoring guide:
- Choice: 1 = trapped/obligated, 5 = free/self-directed
- Connection: 1 = invisible/alone, 5 = seen/held by others
- Growth: 1 = stagnant/draining, 5 = energised/stretching
- Meaning: 1 = pointless/performing someone else's life, 5 = aligned/rippling outward
- Safety: 1 = hiding/masking core self, 5 = free to be fully seen

Use their actual words as evidence. The insight should mirror, not diagnose.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stage, transcripts, selectedExpression, confirmedPrediction } = await req.json()

    let prompt: string
    switch (stage) {
      case 1:
        prompt = buildStage1Prompt(transcripts)
        break
      case 2:
        prompt = buildStage2Prompt(transcripts, selectedExpression || '', confirmedPrediction || '')
        break
      case 3:
        prompt = buildStage3Prompt(transcripts)
        break
      default:
        return new Response(
          JSON.stringify({ error: `Invalid stage: ${stage}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
    // Extract JSON — handle potential markdown code block wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', text)
      return new Response(
        JSON.stringify({ error: 'AI did not return valid JSON', raw: text }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = JSON.parse(jsonMatch[0])
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Process-stems error:', err)
    return new Response(
      JSON.stringify({ error: 'Processing failed', detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
