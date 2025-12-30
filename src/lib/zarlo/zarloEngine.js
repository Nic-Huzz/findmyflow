/**
 * Zarlo Engine
 *
 * Core routing logic and state management for Zarlo.
 * Handles intake, accountability, and routing decisions.
 */

import { supabase } from '../supabaseClient'
import { getPageContent, getChallengeTabContent, ROUTING_OPTIONS, SOUTH_MODE } from './zarloPageContent'

// ============================================
// INTAKE FLOW
// ============================================

export const INTAKE_STRUGGLES = [
  {
    id: 'visibility',
    label: "I know what I want but can't get visible",
    followUp: {
      question: 'When you think about being more visible — posting content, reaching out, putting yourself out there — what comes up?',
      options: [
        { id: 'judged', label: 'Fear of being judged' },
        { id: 'not_ready', label: "Feeling like I'm not ready yet" },
        { id: 'fail_publicly', label: "Worried I'll fail publicly" },
        { id: 'procrastinate', label: "I just procrastinate and don't know why" }
      ]
    },
    reframe: `Here's the sneaky truth: that's not a courage problem — it's a safety problem.

Your nervous system has learned that being visible isn't safe. Maybe from a past experience where you put yourself out there and got hurt. So now it pulls you back every time you try to expand.

The good news? We can find exactly where your "safe edge" is — and start expanding it.`,
    route: '/nervous-system',
    cta: 'Ready to map your nervous system?'
  },
  {
    id: 'starting_stopping',
    label: 'I keep starting and stopping',
    followUp: {
      question: "Classic self-sabotage pattern. When you're about to make progress, what typically happens?",
      options: [
        { id: 'distracted', label: 'I get distracted by something else' },
        { id: 'doubt', label: 'I start doubting if it\'s the right thing' },
        { id: 'overwhelmed', label: 'I feel overwhelmed and shut down' },
        { id: 'bored', label: 'I lose interest and move on' }
      ]
    },
    reframe: `Classic self-sabotage. And here's what most people miss:

It's not a discipline problem. It's a safety problem.

Your nervous system is pulling you back because some part of you believes that success isn't safe. Maybe you'll outgrow people you love. Maybe you'll be exposed. Maybe you'll lose something important.

Let's find out what your system is actually protecting you from.`,
    route: '/nervous-system',
    cta: 'Ready to discover your safety contracts?'
  },
  {
    id: 'unclear',
    label: "I don't know what I should be building",
    followUp: {
      question: "When you imagine finally having clarity on what to build, what's the first feeling that comes up?",
      options: [
        { id: 'relief', label: 'Relief — I could finally move forward' },
        { id: 'pressure', label: 'Pressure — then I\'d have to actually do it' },
        { id: 'fear', label: 'Fear — what if I pick wrong?' },
        { id: 'excitement', label: 'Excitement — I\'ve been waiting for this' }
      ]
    },
    reframe: `Not knowing what to build can feel paralyzing. But here's what I've noticed:

Sometimes "I don't know" is actually "I'm afraid to commit."

Let's take the pressure off. Instead of figuring out your life's purpose, let's just explore what you're naturally good at, what problems you actually care about solving, and who you'd love to help.

The clarity often comes through action, not thinking.`,
    route: '/nikigai/skills',
    cta: 'Ready to discover your natural flow?'
  },
  {
    id: 'burnout',
    label: "I'm burnt out and need to heal first",
    followUp: {
      question: "Burnout is real. What feels most true right now?",
      options: [
        { id: 'exhausted', label: "I'm exhausted and need rest" },
        { id: 'lost', label: "I've lost touch with what I want" },
        { id: 'stuck', label: "I know what to do but can't make myself do it" },
        { id: 'ready', label: "I'm recovering and ready for gentle steps" }
      ]
    },
    reframe: `I hear you. Burnout isn't just tiredness — it's your system telling you something's been off for too long.

Here's what we're going to do differently:

Instead of pushing through, we're going to work WITH your nervous system. Gentle actions. Small wins. Rebuilding trust with yourself.

You don't have to earn rest. You don't have to be productive to be worthy. Let's just start where you are.`,
    route: '/7-day-challenge',
    routeParams: '?mode=gentle',
    cta: 'Ready to take it slow?'
  },
  {
    id: 'existing_project',
    label: "I have an existing project but I'm stuck",
    followUp: {
      question: "You've built something but it's not moving. Where does it feel most stuck?",
      options: [
        { id: 'sales', label: "I can't get people to buy" },
        { id: 'visibility', label: "I can't get enough visibility" },
        { id: 'clarity', label: "I'm not sure if it's the right offer" },
        { id: 'motivation', label: "I've lost motivation to work on it" }
      ]
    },
    reframe: `Got it — you've already built something but you're hitting a wall.

That's actually a great place to be. You have real experience to work with.

Let's capture what you've built, identify where you're hitting resistance, and find out what's really blocking the next level.

Often the block isn't strategic — it's nervous system.`,
    route: '/existing-project',
    cta: 'Ready to capture your project?'
  }
]

// ============================================
// ACCOUNTABILITY RESPONSES
// ============================================

export const ACCOUNTABILITY_RESPONSES = {
  completed: {
    message: `Yes! You did the thing. And look — you're still alive. That's how we teach your system that growth is safe.

What do you want to tackle next?`,
    options: [
      { id: 'quests', label: "Show me today's quests", route: '/7-day-challenge' },
      { id: 'commit', label: 'Set my next commitment' },
      { id: 'drained', label: "I'm feeling drained today" }
    ]
  },
  partial: {
    message: `Progress is progress! Even partial counts. What got in the way of finishing?`,
    options: [
      { id: 'time', label: 'Ran out of time' },
      { id: 'resistance', label: 'Hit some resistance' },
      { id: 'pivoted', label: 'Realized I needed to adjust' },
      { id: 'life', label: 'Life happened' }
    ]
  },
  skipped: {
    message: `The groan won today, huh? No shame — let's figure out what happened.

When the time came to do it, what showed up?`,
    options: [
      { id: 'forgot', label: 'I forgot' },
      { id: 'resistance', label: 'I felt resistance and avoided it' },
      { id: 'life', label: 'Life got in the way' },
      { id: 'wrong', label: "I realized it wasn't the right thing" }
    ]
  },
  resistance_followup: {
    message: `That resistance? That's your nervous system doing its job — protecting you from what it perceives as danger.

The commitment might have been too big of a stretch. We want the "groan zone" — uncomfortable but doable.

Want to try a smaller version? Or something different?`,
    options: [
      { id: 'smaller', label: 'Smaller version of the same thing' },
      { id: 'different', label: 'Something different' },
      { id: 'understand', label: 'Help me understand my resistance' }
    ]
  }
}

// ============================================
// CORE ENGINE FUNCTIONS
// ============================================

/**
 * Load or create Zarlo conversation state
 */
export async function loadZarloState(userId) {
  if (!userId) return null

  try {
    const { data, error } = await supabase
      .from('zarlo_conversations')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error loading Zarlo state:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error loading Zarlo state:', err)
    return null
  }
}

/**
 * Save Zarlo conversation state
 */
export async function saveZarloState(userId, updates) {
  if (!userId) return null

  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('zarlo_conversations')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('zarlo_conversations')
        .update({
          ...updates,
          last_interaction_at: new Date().toISOString(),
          total_interactions: supabase.sql`total_interactions + 1`
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('zarlo_conversations')
        .insert({
          user_id: userId,
          ...updates,
          total_interactions: 1
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (err) {
    console.error('Error saving Zarlo state:', err)
    return null
  }
}

/**
 * Get user context for routing decisions
 */
export async function getUserContext(userId) {
  if (!userId) return {}

  try {
    const [
      { data: nsData },
      { data: flowFinderData },
      { data: groanData },
      { data: compassData },
      { data: stageData }
    ] = await Promise.all([
      supabase.from('nervous_system_responses').select('id').eq('user_id', userId).limit(1),
      supabase.from('nikigai_clusters').select('id').eq('user_id', userId).limit(1),
      supabase.from('quest_completions').select('id, quest_category').eq('user_id', userId).in('quest_category', ['Recognise', 'Rewire', 'Reconnect']),
      supabase.from('flow_entries').select('direction, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('user_stage_progress').select('*').eq('user_id', userId).single()
    ])

    // Check for South pattern (3+ South in last 5 entries)
    const recentDirections = compassData?.map(c => c.direction) || []
    const southCount = recentDirections.filter(d => d === 'south').length
    const isInSouth = southCount >= 3

    return {
      hasCompletedNS: nsData?.length > 0,
      hasCompletedFlowFinder: flowFinderData?.length > 0,
      groanCount: groanData?.length || 0,
      lastCompassDirection: compassData?.[0]?.direction,
      isInSouth,
      currentStage: stageData?.current_stage || 1,
      persona: stageData?.persona_type
    }
  } catch (err) {
    console.error('Error getting user context:', err)
    return {}
  }
}

/**
 * Determine what Zarlo should show based on state and context
 */
export function determineZarloAction(zarloState, userContext, currentRoute) {
  const {
    hasCompletedNS,
    hasCompletedFlowFinder,
    groanCount,
    isInSouth,
    currentStage
  } = userContext

  const {
    primary_struggle,
    last_commitment,
    commitment_completed,
    last_commitment_date
  } = zarloState || {}

  // Priority 1: South mode override
  if (isInSouth) {
    return {
      mode: 'south',
      greeting: SOUTH_MODE.greeting,
      additionalPrompt: SOUTH_MODE.additionalPrompt
    }
  }

  // Priority 2: Check uncommitted commitment (within last 7 days)
  if (last_commitment && !commitment_completed && last_commitment_date) {
    const daysSinceCommitment = Math.floor(
      (Date.now() - new Date(last_commitment_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceCommitment <= 7) {
      return {
        mode: 'accountability',
        commitment: last_commitment
      }
    }
  }

  // Priority 3: Milestone celebrations
  if (groanCount === 5 || groanCount === 10 || groanCount === 20) {
    return {
      mode: 'milestone',
      groanCount
    }
  }

  // Priority 4: New user intake
  if (!primary_struggle) {
    return {
      mode: 'intake',
      step: 'welcome'
    }
  }

  // Priority 5: Page context mode (default)
  return {
    mode: 'context',
    route: currentRoute
  }
}

/**
 * Get the struggle config by ID
 */
export function getStruggleConfig(struggleId) {
  return INTAKE_STRUGGLES.find(s => s.id === struggleId)
}

/**
 * Generate milestone message based on groan count
 */
export function getMilestoneMessage(groanCount, userContext) {
  const messages = {
    5: {
      title: "5 Groans Complete!",
      message: `Look at you — 5 groans in and still going. Your nervous system is starting to learn that growth doesn't mean death.

I'm noticing some patterns in your data. Want to see what's emerging?`,
      options: [
        { id: 'show_patterns', label: 'Show me the patterns' },
        { id: 'keep_going', label: 'Keep the momentum going' }
      ]
    },
    10: {
      title: "Double Digits!",
      message: `10 groans! You're officially in the "this is becoming a habit" zone. Your comfort zone is literally bigger than it was 10 groans ago.

How are you feeling about the progress?`,
      options: [
        { id: 'great', label: 'Great — what\'s next?' },
        { id: 'struggling', label: 'Honestly, it\'s been hard' },
        { id: 'curious', label: 'Curious about my patterns' }
      ]
    },
    20: {
      title: "20 Groans — You're a Groan Master!",
      message: `20 groans is no joke. You've taught your nervous system something powerful: that you can feel uncomfortable AND survive.

That's the whole game. Everything else is just details.`,
      options: [
        { id: 'celebrate', label: 'Let me celebrate!' },
        { id: 'next_level', label: 'What\'s the next level?' }
      ]
    }
  }

  return messages[groanCount] || null
}

/**
 * Standard prompts shown on every page
 */
export const STANDARD_PROMPTS = [
  { id: 'what_is', label: 'What is this?' },
  { id: 'why_matters', label: 'Why does this matter?' },
  { id: 'something_else', label: 'I want to do something else' }
]

/**
 * Get all prompts for a page (standard + contextual)
 */
export function getPromptsForPage(route, challengeTab = null) {
  let pageContent

  if (route === '/7-day-challenge' && challengeTab) {
    pageContent = getChallengeTabContent(challengeTab)
  } else {
    pageContent = getPageContent(route)
  }

  const contextualPrompts = pageContent.contextualPrompts || []

  // Combine: What is this, Why matters, contextual, something else
  return [
    STANDARD_PROMPTS[0], // What is this?
    STANDARD_PROMPTS[1], // Why does this matter?
    ...contextualPrompts,
    STANDARD_PROMPTS[2]  // I want to do something else
  ]
}

/**
 * Get response for a prompt
 */
export function getPromptResponse(route, promptId, challengeTab = null) {
  let pageContent

  if (route === '/7-day-challenge' && challengeTab) {
    pageContent = getChallengeTabContent(challengeTab)
  } else {
    pageContent = getPageContent(route)
  }

  // Standard prompts
  if (promptId === 'what_is') {
    return pageContent.whatIsThis
  }

  if (promptId === 'why_matters') {
    return pageContent.whyMatters
  }

  if (promptId === 'something_else') {
    return {
      type: 'routing',
      message: 'No problem! What do you want to focus on?',
      options: ROUTING_OPTIONS
    }
  }

  // Contextual FAQ
  if (pageContent.faq && pageContent.faq[promptId]) {
    return pageContent.faq[promptId]
  }

  return "I don't have specific info on that, but I'm here to help. What would you like to know?"
}
