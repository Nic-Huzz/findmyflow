/**
 * CLOSER Script Service
 * Manages personalized CLOSER framework scripts with AI enhancement
 */
import { supabase } from '../supabaseClient'
import { getContentContext } from './contentContext'

export async function fetchCloserScript(userId) {
  const { data, error } = await supabase
    .from('user_closer_scripts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching closer script:', error)
    return { data: null, error }
  }
  return { data, error: null }
}

export async function saveCloserScript(userId, steps) {
  const { data, error } = await supabase
    .from('user_closer_scripts')
    .upsert(
      {
        user_id: userId,
        steps,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error saving closer script:', error)
    return { data: null, error }
  }
  return { data, error: null }
}

export async function generateDefaultScript(userId) {
  const context = await getContentContext(userId)

  const niche = context?.persona?.niche || context?.persona?.ideal_customer || 'business'
  const problem = context?.persona?.core_problem || context?.offer?.problem || 'the challenge you described'
  const dreamOutcome = context?.offer?.dream_outcome || context?.offer?.headline || 'achieving your ideal outcome'
  const guarantee = context?.offer?.guarantee || 'our guarantee'

  return {
    C: `So [Name], tell me — what made you book this call today? What's going on in your ${niche} right now?`,
    L: `So it sounds like you're dealing with ${problem}, and it's been holding you back from where you want to be. Is that right?`,
    O: `Have you tried to solve this before? What did you do? What happened?`,
    S: `Imagine ${dreamOutcome}. What would that mean for you? Paint me the picture — what does your life look like when this is handled?`,
    E: `What concerns do you have about getting started? Let's talk through them.`,
    R: `So just to recap — you said [restate their goals]. We've addressed your concerns. And remember, ${guarantee}. What would you like to do?`,
  }
}

export function buildCloserStepPrompt(stepLetter, currentText, context) {
  const stepDescriptions = {
    C: 'Clarify: Opening the call — ask why they came, discover their situation and motivation',
    L: 'Label: Name their problem — show deep understanding of their pain point',
    O: 'Overview: Explore what they\'ve tried before and why it didn\'t work',
    S: 'Sell the Vacation: Paint the dream outcome (not your process) — vivid, emotional, specific',
    E: 'Explain: Surface and address objections with curiosity, not confrontation',
    R: 'Reinforce: Summarize and help them decide — restate goals, address concerns, close',
  }

  const personaInfo = context?.persona
    ? `Niche: ${context.persona.niche || 'unknown'}
Ideal Customer: ${context.persona.ideal_customer || 'unknown'}
Core Problem: ${context.persona.core_problem || 'unknown'}`
    : 'No persona data available'

  const offerInfo = context?.offer
    ? `Offer: ${context.offer.headline || 'unknown'}
Dream Outcome: ${context.offer.dream_outcome || 'unknown'}
Guarantee: ${context.offer.guarantee || 'none specified'}`
    : 'No offer data available'

  return `You are a sales script coach helping someone write their personalized CLOSER framework script.

STEP: ${stepLetter} — ${stepDescriptions[stepLetter]}

THEIR BUSINESS CONTEXT:
${personaInfo}
${offerInfo}

CURRENT SCRIPT FOR THIS STEP:
${currentText || '(empty)'}

Write an improved, personalized version of this CLOSER step. Make it:
- Conversational and natural (not robotic)
- Specific to their business/niche
- Following the Hormozi CLOSER methodology
- Using questions, restatements, and anecdotal stories (the three things)
- 3-5 sentences max

Return ONLY the script text, no explanation.`
}
