/**
 * AI helper for Founder DNA diagnostic + challenge generation
 * Wraps supabase.functions.invoke calls to the founder-dna-diagnostic edge function
 */

import { supabase } from './supabaseClient'

/**
 * Run one diagnostic exchange with the AI
 * @returns {{ message: string, responseOptions: string[], isDiagnosisReady: boolean, diagnosis?: string }}
 */
export async function runDiagnosticExchange({
  dnaCode, archetype,
  founderName, founderBio, founderOneLiner,
  stuckPointName, stuckPointDescription,
  followUpQA, openText,
  conversationHistory, exchangeNumber,
}) {
  try {
    const { data, error } = await supabase.functions.invoke('founder-dna-diagnostic', {
      body: {
        mode: 'diagnostic',
        founderName, founderBio, founderOneLiner,
        dnaCode, archetype,
        stuckPointName, stuckPointDescription,
        followUpQA, openText,
        conversationHistory, exchangeNumber,
      },
    })

    if (error) throw error
    if (!data?.message) throw new Error('Invalid response')

    return {
      message: data.message,
      responseOptions: data.responseOptions || [],
      isDiagnosisReady: data.isDiagnosisReady || false,
      diagnosis: data.diagnosis || null,
    }
  } catch (err) {
    console.error('Diagnostic exchange failed:', err)
    // Fallback: skip diagnostic and land immediately
    return {
      message: `Let's cut to the chase. Based on what you've shared about ${stuckPointName.toLowerCase()}, here's what I think is really going on.`,
      responseOptions: [],
      isDiagnosisReady: true,
      diagnosis: `You're working through ${stuckPointName.toLowerCase()} — ${stuckPointDescription}. Let me show you what ${founderName} did when they faced this.`,
    }
  }
}

/**
 * Generate a personalized challenge in Mirror → Bridge → Challenge format
 * @returns {{ challengeType: string, mirror: string, bridge: string, action: string }}
 */
export async function generateChallenge({
  founderName, stageStories,
  diagnosis, knowledgeStyle, fuelType, gameCategories,
}) {
  try {
    const { data, error } = await supabase.functions.invoke('founder-dna-diagnostic', {
      body: {
        mode: 'challenge',
        founderName, stageStories,
        diagnosis, knowledgeStyle, fuelType, gameCategories,
      },
    })

    if (error) throw error
    if (!data?.mirror || !data?.action) throw new Error('Invalid response')

    return {
      challengeName: data.challengeName || '',
      challengeType: data.challengeType || 'DO_IT',
      mirror: data.mirror,
      bridge: data.bridge,
      action: data.action,
    }
  } catch (err) {
    console.error('Challenge generation failed:', err)
    // Fallback: build static challenge from stageStories
    return buildFallbackChallenge(founderName, stageStories, knowledgeStyle)
  }
}

function buildFallbackChallenge(founderName, stageStories, knowledgeStyle) {
  const stories = stageStories || []
  const problemStory = stories.find(s => !s.title.startsWith('Solution:')) || stories[0]
  const solutionStory = stories.find(s => s.title.startsWith('Solution:')) || stories[1]

  const type = knowledgeStyle >= 4 ? 'DO_IT'
    : knowledgeStyle <= 2 ? 'THINK_IT'
    : 'MAKE_IT'

  return {
    challengeName: 'The Breakthrough Challenge',
    challengeType: type,
    mirror: problemStory
      ? `${founderName} faced something remarkably similar. ${problemStory.content}`
      : `${founderName} knows exactly what this feels like. Every founder hits this wall.`,
    bridge: solutionStory
      ? `Here's what they did: ${solutionStory.content}`
      : `${founderName}'s approach was always to act quickly and learn from the result, not to plan endlessly.`,
    action: type === 'DO_IT'
      ? `Today, take ONE small action related to this stuck point. Don't plan it, don't perfect it — just do it and see what happens. ${founderName} would tell you: "The market will teach you faster than any plan."`
      : type === 'THINK_IT'
      ? `Sit with this question for 15 minutes today: "What would ${founderName} cut from my approach?" Write down everything that comes up — the discomfort is the signal.`
      : `Make something small today that shows your idea to one person. ${founderName}'s philosophy: build it, show it, learn from the reaction.`,
  }
}
