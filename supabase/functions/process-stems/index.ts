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

Your job is to produce a FELT recognition of who this person was as a kid. Not a clinical assessment. A mirror that makes them think "yes, that was me."

Return ONLY valid JSON (no markdown, no explanation):

{
  "energy": "One or two words describing their overall childhood energy (e.g. 'electric', 'quietly intense', 'wildly curious', 'gentle but fierce')",
  "patterns": [
    {
      "label": "Short pattern label, 3-5 words, starts with 'You' + past tense verb (e.g. 'You built entire worlds', 'You performed for everyone', 'You moved constantly')",
      "evidence": "Key phrases from their actual words that show this pattern"
    }
  ],
  "mirror": "3-4 sentences written in second person, each separated by \\n\\n so they display as separate paragraphs. First sentence starts with 'The kid in you was [energy].' Middle sentences describe what they did using their own words. Last sentence is what they couldn't NOT do. Written to land emotionally, not clinically."
}

Rules:
- Extract exactly 3 patterns. Not 2, not 4. Three.
- Pattern labels must be vivid and specific, not generic. Not 'creativity' but 'You built entire worlds'.
- The mirror paragraph should feel like someone who KNOWS them is describing them, using their actual words.
- The energy should be 1-2 words maximum that capture the kid's vibe.
- Use their actual spoken words as evidence wherever possible.
- NEVER use em dashes (—). Use periods, commas, or restructure the sentence instead.`
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

The participant identified "${selectedExpression}" as their most charged essence from childhood.
They confirmed "${confirmedPrediction}" as their dominant fear/prediction.

LAYER 2 — Struggles + Prediction:
${layer2Lines}

LAYER 3 — Source:
${layer3Lines}

Extract the suppression story AND map it to the wound framework below.

WOUND STAGES (pick the one that best matches WHERE the suppression was installed):

| Stage | Period | Sympathetic (fight) | Ventral (safe) | Dorsal (freeze) |
| You Arrive | Infancy | Overwhelmed Child (chaotic but present caregiver) | Secure Base (attuned + safe) | Invisible Child (safe but unseen) |
| You Learn What Works | Childhood | Rejected Self (expression costs connection) | Unconditional Belonging (authentic = loved) | Adapted Self (love only for edited version) |
| School Installs the OS | Adolescence | The Rebel (fights back, labelled difficult) | Grounded Student (navigates without disappearing) | Good Student (conforms, gets praised, loses self) |
| Your Friend Group Decides | Teens | The Chameleon (popular but lost) | Found Their Tribe (accepted as they are) | The Withdrawn (authentic but isolated) |

NERVOUS SYSTEM ARCHETYPES:
- Sympathetic (fight/flight): responses about fighting back, being reactive, hypervigilance
- Dorsal (freeze/withdraw): responses about shutting down, hiding, going quiet, conforming, people-pleasing
- Ventral (safe/connected): responses about staying grounded, navigating safely (rare in suppression context)

Return ONLY valid JSON:

{
  "prediction": "The dominant prediction in one sentence",
  "sourceEvent": {
    "who": "The person involved",
    "what": "What happened",
    "approximateAge": "Best guess at age"
  },
  "rule": "The rule they made (e.g. 'To stay safe, I stopped being loud')",
  "protectivePattern": "One of: Ghost, Perfectionist, People Pleaser, Controller, Auto-Pilot",
  "woundStage": "One of: You Arrive, You Learn What Works, School Installs the OS, Your Friend Group Decides",
  "woundScene": "The specific scene name (e.g. The Good Student, The Chameleon, The Adapted Self)",
  "nsArchetype": "One of: sympathetic, dorsal, ventral",
  "nsLabel": "One of: Fight / Flight, Freeze / Withdraw, Safe & Connected",
  "thread": "Full connection in second person. Format: 'You loved [X]. You learned that [Y] was dangerous when [source]. Your suppression was installed at [wound stage]. You became [wound scene]. Your nervous system learned to [ns response]. The rule you made: [their exact words].'",
  "predictions": ["prediction option 1", "prediction option 2", "prediction option 3"]
}

Rules:
- The thread should feel like an insight, not a diagnosis
- Use their actual words wherever possible
- The wound stage should match WHERE the event happened (home = first two stages, school = third, friends = fourth)
- The NS archetype should match HOW they responded (fought back = sympathetic, shut down/conformed = dorsal)
- predictions array is for the selection bridge before layer 3
- NEVER use em dashes (—). Use periods, commas, or restructure the sentence instead.`
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
    "choice": { "score": 1-5, "insight": "One sentence about your choice/freedom state, written in second person (you/your)" },
    "connection": { "score": 1-5, "insight": "One sentence about your connection state, written in second person" },
    "growth": { "score": 1-5, "insight": "One sentence about your growth/engagement state, written in second person" },
    "meaning": { "score": 1-5, "insight": "One sentence about your meaning/alignment state, written in second person" },
    "safety": { "score": 1-5, "insight": "One sentence about your safety/visibility state, written in second person" }
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

Use the participant's actual words as evidence. Write ALL insights in second person (you/your), never third person (they/their). The insight should mirror, not diagnose.
NEVER use em dashes (—). Use periods, commas, or restructure the sentence instead.`
}

function buildStage4Prompt(transcripts, context) {
  const stemLines = transcripts.map(t =>
    `"${t.stemText}"\nResponse: ${t.transcript || '(no response)'}`
  ).join('\n\n')
  const priorContext = `
PRIOR STAGES CONTEXT:
- Stage 1 (childhood essence): ${context.stage1Mirror || 'not available'}
- Stage 2 (suppression): Selected expression: "${context.selectedExpression || ''}". Prediction: "${context.confirmedPrediction || ''}". Wound scene: ${context.woundScene || 'unknown'}. NS archetype: ${context.nsLabel || 'unknown'}.
- Stage 3 (consequences): Lowest dimension: ${context.lowestDimension || 'unknown'}.`
  const archetypeList = `
AVAILABLE ARCHETYPES (pick the best match):
1. Radiant Rebel - Disruptive truth-teller with heart
2. Playful Creator - Joy, innovation, curiosity-led action
3. Sacred Jester - Disruption through play, heart-led absurdity
4. Mystic Messenger - Deep intuition, spiritual transmission
5. Truth-Teller - Raw honesty, cuts through pretence
6. Heart Alchemist - Transforms pain into gold, emotional depth
7. Grounded Guardian - Steady presence, protective strength
8. Heart Holder - Deep empathy, holds space for others
9. Rhythm Architect - Builds systems, creates flow and order
10. Wise Sage - Pattern recognition, teaches through experience
11. Cosmic Connector - Links people, ideas, worlds
12. Compassionate Leader - Leads through care, quiet authority`
  return `You are analyzing rapid spoken sentence completions about someone's true identity beneath their protective patterns.

${stemLines}

${priorContext}

${archetypeList}

Based on their spoken responses AND all prior stage context, identify their essence archetype. The archetype should feel like a RECOGNITION, not a label. When they read it, they should think "that IS me."

Return ONLY valid JSON:

{
  "primaryArchetype": {
    "id": "the archetype id in snake_case (e.g. radiant_rebel)",
    "name": "The archetype name (e.g. Radiant Rebel)",
    "essence": "The archetype one-line essence description"
  },
  "secondaryArchetype": {
    "id": "second strongest match id",
    "name": "Second strongest match name"
  },
  "essenceBlend": "2-3 sentences blending primary + secondary in second person. How these two energies show up together in THIS person, using their actual spoken words as evidence. Not generic.",
  "mirrorReveal": "3-4 sentence reveal written to land emotionally. Starts with their childhood (Stage 1), moves through what was suppressed (Stage 2), and arrives at who they are now. Ends with a line that makes them feel SEEN. Use their actual words."
}

Rules:
- The mirrorReveal is the emotional climax of the entire journey. Make it count.
- Reference their specific words from ALL stages, not just Stage 4.
- The archetype match should be based on energy and patterns, not surface-level keyword matching.
- The essenceBlend should feel like a description of a real person, not a horoscope.
- primaryArchetype.id must be one of: radiant_rebel, playful_creator, sacred_jester, mystic_messenger, truth_teller, heart_alchemist, grounded_guardian, heart_holder, rhythm_architect, wise_sage, cosmic_connector, compassionate_leader
- NEVER use em dashes (—). Use periods, commas, or restructure the sentence instead.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { stage, transcripts } = body

    // Input validation
    if (!Array.isArray(transcripts) || transcripts.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid transcripts: must be an array of max 50 items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (![1, 2, 3, 4].includes(stage)) {
      return new Response(
        JSON.stringify({ error: 'Invalid stage: must be 1, 2, 3, or 4' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    // Sanitize string inputs (prevent prompt injection of objects/arrays)
    const selectedExpression = typeof body.selectedExpression === 'string' ? body.selectedExpression.slice(0, 200) : ''
    const confirmedPrediction = typeof body.confirmedPrediction === 'string' ? body.confirmedPrediction.slice(0, 200) : ''

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
      case 4: {
        const s1m = typeof body.stage1Mirror === 'string' ? body.stage1Mirror.slice(0, 500) : ''
        const ws = typeof body.woundScene === 'string' ? body.woundScene.slice(0, 100) : ''
        const nl = typeof body.nsLabel === 'string' ? body.nsLabel.slice(0, 50) : ''
        const ld = typeof body.lowestDimension === 'string' ? body.lowestDimension.slice(0, 50) : ''
        prompt = buildStage4Prompt(transcripts, {
          selectedExpression: selectedExpression || '',
          confirmedPrediction: confirmedPrediction || '',
          stage1Mirror: s1m,
          woundScene: ws,
          nsLabel: nl,
          lowestDimension: ld,
        })
        break
      }
      default:
        return new Response(
          JSON.stringify({ error: `Invalid stage: ${stage}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const message = await client.messages.create({
      model: stage === 4 ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001',
      max_tokens: stage === 4 ? 1500 : 1024,
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
