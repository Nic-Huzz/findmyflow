/**
 * Zarlo Engine
 *
 * Core routing logic and state management for Zarlo.
 * Handles intake, accountability, and routing decisions.
 */

import { supabase } from '../supabaseClient'
import { getPageContent, getChallengeTabContent, ROUTING_OPTIONS, SOUTH_MODE, isPublicRoute, PUBLIC_FLOW_CONTENT } from './zarloPageContent'
import { generateZarloWheelContext, getWheelSummary, analyzeGapsAndOpportunities } from '../wheelAlignment'
import { computeLevel, SKILL_THRESHOLDS, getNextThreshold, formatSkillsForPrompt } from '../../hooks/useSkills'

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
 * Load user's wheel data from nikigai_clusters
 * Returns structured data for alignment calculations
 */
export async function loadWheelData(userId) {
  if (!userId) return { skills: [], problems: [], personas: [] }

  try {
    const { data: clusters, error } = await supabase
      .from('nikigai_clusters')
      .select('cluster_type, cluster_label, proficiency, cluster_stage')
      .eq('user_id', userId)
      .eq('cluster_stage', 'final')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Group by cluster type and extract segment info
    const wheelData = {
      skills: [],
      problems: [],
      personas: [],
    }

    // Process clusters - map cluster labels back to segment IDs
    const processedLabels = new Set() // Avoid duplicates

    clusters?.forEach(cluster => {
      const key = `${cluster.cluster_type}-${cluster.cluster_label}`
      if (processedLabels.has(key)) return
      processedLabels.add(key)

      // Map cluster label to segment ID (simplified - uses lowercase match)
      const segmentId = mapClusterLabelToSegmentId(cluster.cluster_label, cluster.cluster_type)

      if (segmentId) {
        const entry = {
          segmentId,
          proficiency: cluster.proficiency || 'establishing',
          label: cluster.cluster_label,
        }

        if (cluster.cluster_type === 'skills') {
          wheelData.skills.push(entry)
        } else if (cluster.cluster_type === 'problems') {
          wheelData.problems.push(entry)
        } else if (cluster.cluster_type === 'persona') {
          wheelData.personas.push(entry)
        }
      }
    })

    return wheelData
  } catch (err) {
    console.error('Error loading wheel data:', err)
    return { skills: [], problems: [], personas: [] }
  }
}

/**
 * Map a cluster label to its taxonomy segment ID
 * Uses keyword matching from the taxonomy
 */
function mapClusterLabelToSegmentId(label, clusterType) {
  const labelLower = (label || '').toLowerCase()

  // Skills mappings
  const skillsKeywords = {
    clarifying: ['clarify', 'explain', 'teach', 'translat', 'simplif', 'communicat'],
    analyzing: ['analyz', 'analysis', 'data', 'pattern', 'research', 'debug', 'diagnos'],
    strategizing: ['strateg', 'plan', 'priorit', 'vision', 'roadmap', 'decision'],
    organizing: ['organiz', 'system', 'process', 'operation', 'structure', 'efficien'],
    building: ['build', 'make', 'code', 'engineer', 'develop', 'prototype', 'construct'],
    designing: ['design', 'ux', 'visual', 'aesthetic', 'interface', 'experience'],
    creating: ['creat', 'art', 'writ', 'ideat', 'invent', 'imagin', 'compos'],
    expressing: ['express', 'story', 'perform', 'present', 'voice', 'speak', 'articulat'],
    connecting: ['connect', 'network', 'empathy', 'facilitat', 'collaborat', 'relationship'],
    influencing: ['influenc', 'sell', 'persuad', 'convinc', 'motivat', 'negotiat', 'advocat'],
    nurturing: ['nurtur', 'coach', 'mentor', 'develop', 'support', 'care', 'guide', 'grow'],
    synthesizing: ['synthesiz', 'integrat', 'wisdom', 'big-picture', 'holist', 'meaning'],
  }

  // Problems mappings
  const problemsKeywords = {
    physical_vitality: ['physical', 'health', 'fitness', 'body', 'energy', 'vitality', 'sleep', 'nutrition'],
    mental_wellbeing: ['mental', 'wellbeing', 'anxiety', 'stress', 'mindset', 'emotion', 'burnout'],
    personal_mastery: ['personal', 'mastery', 'skill', 'learning', 'productiv', 'habit', 'growth'],
    intimate_bonds: ['intimate', 'relationship', 'marriage', 'dating', 'family', 'parent', 'love'],
    service_care: ['service', 'care', 'caregiv', 'elder', 'disabil', 'support', 'healthcare'],
    creative_expression: ['creative', 'expression', 'art', 'voice', 'identity', 'authentic', 'brand'],
    local_impact: ['local', 'community', 'team', 'organization', 'neighborhood', 'culture', 'workplace'],
    cultural_movements: ['cultural', 'movement', 'belonging', 'trend', 'subculture', 'social'],
    economic_freedom: ['economic', 'freedom', 'money', 'business', 'career', 'financial', 'entrepreneur', '9-5'],
    social_justice: ['social', 'justice', 'inequality', 'discriminat', 'rights', 'fairness', 'diversity'],
    planetary_health: ['planet', 'climate', 'environment', 'sustainab', 'nature', 'conservation', 'green'],
    human_progress: ['human', 'progress', 'technology', 'innovation', 'future', 'education', 'breakthrough'],
  }

  // Persona mappings
  const personaKeywords = {
    seekers: ['seeker', 'lost', 'direction', 'purpose', 'meaning', 'clarity', 'finding'],
    builders: ['builder', 'creating', 'building', 'making', 'entrepreneur', 'starting', 'launching'],
    healers: ['healer', 'hurt', 'recover', 'healing', 'trauma', 'pain', 'wound'],
    teachers: ['teacher', 'learning', 'growing', 'knowledge', 'education', 'skill', 'improve'],
    connectors: ['connector', 'lonely', 'isolated', 'community', 'belonging', 'tribe', 'friend'],
    achievers: ['achiever', 'success', 'winning', 'status', 'recognition', 'ambitious', 'competitive'],
    explorers: ['explorer', 'freedom', 'adventure', 'autonomy', 'escape', 'travel', 'independent'],
    visionaries: ['visionary', 'future', 'change', 'innovation', 'transform', 'vision', 'disrupt'],
    protectors: ['protector', 'security', 'safety', 'stability', 'risk', 'protection', 'secure'],
    creators: ['creator', 'expression', 'art', 'originality', 'creativity', 'unique', 'artistic'],
    nurturers: ['nurturer', 'family', 'caring', 'devoted', 'loved ones', 'children', 'parent'],
    challengers: ['challenger', 'injustice', 'change', 'truth', 'advocacy', 'rebel', 'fight'],
  }

  const keywordMap = clusterType === 'skills' ? skillsKeywords
    : clusterType === 'problems' ? problemsKeywords
    : personaKeywords

  // Find best match
  let bestMatch = null
  let bestScore = 0

  Object.entries(keywordMap).forEach(([segmentId, keywords]) => {
    let score = 0
    keywords.forEach(keyword => {
      if (labelLower.includes(keyword)) {
        score++
      }
    })
    if (score > bestScore) {
      bestScore = score
      bestMatch = segmentId
    }
  })

  return bestMatch
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
      { data: stageData },
      { data: ecData },
      { data: nsVoiceData },
      wheelData,
      { data: briefData }
    ] = await Promise.all([
      supabase.from('nervous_system_responses').select('id').eq('user_id', userId).limit(1),
      supabase.from('nikigai_clusters').select('id').eq('user_id', userId).limit(1),
      supabase.from('quest_completions').select('id, quest_category').eq('user_id', userId).in('quest_category', ['Recognise', 'Rewire', 'Reconnect']),
      supabase.from('flow_entries').select('direction, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('user_stage_progress').select('*').eq('user_id', userId).single(),
      supabase.from('experience_creator_selections').select('dominant_archetype, product_suite, selected_creators').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('nervous_system_checkins').select('protective_voice').eq('user_id', userId).not('protective_voice', 'is', null),
      loadWheelData(userId),
      // Load pre-computed Zarlo Brief
      supabase.from('zarlo_briefs').select('brief').eq('user_id', userId).maybeSingle()
    ])

    // Also fetch healing_intentions voices (combined with NS checkins for accurate count)
    const { data: hiVoiceData } = await supabase
      .from('healing_intentions')
      .select('protective_voice')
      .eq('user_id', userId)
      .not('protective_voice', 'is', null)

    // Protective voice pattern detection (feeds Stage 6→7 graduation)
    const allVoiceData = [...(nsVoiceData || []), ...(hiVoiceData || [])]
    const voiceCounts = {}
    allVoiceData.forEach(row => {
      if (row.protective_voice) {
        voiceCounts[row.protective_voice] = (voiceCounts[row.protective_voice] || 0) + 1
      }
    })
    const voiceEntries = Object.entries(voiceCounts).sort((a, b) => b[1] - a[1])
    const dominantVoice = voiceEntries[0] || null // [name, count] or null

    // Check for South pattern (3+ South in last 5 entries)
    const recentDirections = compassData?.map(c => c.direction) || []
    const southCount = recentDirections.filter(d => d === 'south').length
    const isInSouth = southCount >= 3

    // Generate wheel context for Zarlo
    const wheelContext = generateZarloWheelContext(wheelData)
    const wheelSummary = getWheelSummary(wheelData)
    const gapAnalysis = analyzeGapsAndOpportunities(wheelData)

    return {
      hasCompletedNS: nsData?.length > 0,
      hasCompletedFlowFinder: flowFinderData?.length > 0,
      groanCount: groanData?.length || 0,
      lastCompassDirection: compassData?.[0]?.direction,
      isInSouth,
      currentStage: stageData?.current_stage ?? 1,
      persona: stageData?.persona_type,
      // Wheel data
      wheelData,
      wheelContext,
      wheelSummary,
      gapAnalysis,
      // Experience creator matching
      experienceCreatorArchetype: ecData?.dominant_archetype || null,
      experienceCreatorSuite: ecData?.product_suite || null,
      experienceCreatorPicks: ecData?.selected_creators || null,
      // Protective voice pattern detection
      protectiveVoiceCounts: voiceCounts,
      dominantVoice: dominantVoice ? { name: dominantVoice[0], count: dominantVoice[1] } : null,
      essenceName: stageData?.essence_name || null,
      // Pre-computed Zarlo Brief (may be null for new users or if cron hasn't run)
      zarloBrief: briefData?.brief || null,
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

  // Priority 4: New user intake (only for genuinely new users with no activity)
  const hasRealActivity = hasCompletedNS || hasCompletedFlowFinder || groanCount > 0
  if (!primary_struggle && !hasRealActivity) {
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

// ============================================
// PUBLIC FLOW MODE (Sales Rep)
// ============================================

export const PUBLIC_FLOW_GREETINGS = {
  '/try/nervous-system': `Hey! I'm Zarlo — your guide through this assessment. 👋\n\nYou're about to discover something most people never see: the invisible beliefs that are quietly running your life.\n\nGot questions as you go? I'm right here.`,

  '/try/offer/attraction': `Hey! I'm Zarlo — here to help you figure out your offer. 👋\n\nThis assessment is based on Alex Hormozi's $100M Offers framework. By the end, you'll know exactly what type of offer fits YOU.\n\nGot questions? I'm here.`,

  '/try/offer/default': `Hey! I'm Zarlo — your guide through this assessment. 👋\n\nBy the end, you'll have real clarity on your strategy — not just theory, but a direction you can actually act on.\n\nQuestions along the way? I'm here.`
}

/**
 * Get greeting for public flows
 */
export function getPublicFlowGreeting(route) {
  if (route === '/try/nervous-system') {
    return PUBLIC_FLOW_GREETINGS['/try/nervous-system']
  }
  if (route.startsWith('/try/offer/')) {
    const flowType = route.split('/')[3]
    return PUBLIC_FLOW_GREETINGS[`/try/offer/${flowType}`] || PUBLIC_FLOW_GREETINGS['/try/offer/default']
  }
  return PUBLIC_FLOW_GREETINGS['/try/offer/default']
}

/**
 * Get prompts for public flows (sales-focused)
 */
export function getPublicFlowPrompts(route) {
  const pageContent = getPageContent(route)

  // For public flows, we show sales-focused prompts
  const basePrompts = [
    { id: 'what_is', label: 'What is this?' },
    { id: 'why_matters', label: 'Why does this matter?' }
  ]

  const contextualPrompts = pageContent.contextualPrompts || []

  return [...basePrompts, ...contextualPrompts]
}

/**
 * Determine Zarlo action for public routes
 */
export function determinePublicZarloAction(route) {
  return {
    mode: 'public_sales',
    route,
    greeting: getPublicFlowGreeting(route),
    prompts: getPublicFlowPrompts(route)
  }
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

// ============================================
// ZARLO V2: AI PERSONALITY LAYER
// ============================================

/**
 * Load self-knowledge skills for the current user.
 * Same queries as useSkills hook but callable from engine.
 */
export async function loadSkills(userId) {
  if (!userId) return null

  try {
    const [presence, courage, depth, recovery, curiosity] = await Promise.all([
      supabase.from('nervous_system_checkins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('checkin_type', 'daily'),
      supabase.from('quest_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('quest_category', 'Groans'),
      supabase.from('healing_intentions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).in('healing_stage', ['recognised', 'released']),
      supabase.rpc('compute_recovery_count', { p_user_id: userId }),
      supabase.rpc('compute_curiosity_count', { p_user_id: userId }),
    ])

    const counts = {
      presence: presence.count || 0,
      courage: courage.count || 0,
      depth: depth.count || 0,
      recovery: recovery.data ?? 0,
      curiosity: curiosity.data ?? 0,
    }

    const result = {}
    for (const [key, count] of Object.entries(counts)) {
      result[key] = { count, level: computeLevel(count, SKILL_THRESHOLDS[key]) }
    }
    return result
  } catch (err) {
    console.error('Error loading skills for Zarlo:', err)
    return null
  }
}

/**
 * Get recent user actions (last 3) from existing tables.
 * No new table needed. Three parallel queries, LIMIT 1 each.
 */
export async function getRecentActions(userId) {
  if (!userId) return []

  try {
    const [wahooResult, checkinResult, healingResult] = await Promise.all([
      supabase.from('quest_completions')
        .select('id, quest_category, reflection_text, created_at')
        .eq('user_id', userId).eq('quest_category', 'Groans')
        .order('created_at', { ascending: false }).limit(1),
      supabase.from('nervous_system_checkins')
        .select('id, before_state, checkin_type, created_at')
        .eq('user_id', userId).eq('checkin_type', 'daily')
        .order('created_at', { ascending: false }).limit(1),
      supabase.from('healing_intentions')
        .select('id, pattern, healing_stage, created_at')
        .eq('user_id', userId)
        .in('healing_stage', ['recognised', 'released'])
        .order('created_at', { ascending: false }).limit(1),
    ])

    const actions = []

    if (wahooResult.data?.[0]) {
      const w = wahooResult.data[0]
      let reflection = {}
      try { if (w.reflection_text) reflection = JSON.parse(w.reflection_text) } catch {}
      const felt = reflection.wahoo_classification || 'unknown'
      actions.push({
        type: 'wahoo_completed',
        detail: `Completed a courage challenge (felt: ${felt})`,
        timestamp: w.created_at,
      })
    }

    if (checkinResult.data?.[0]) {
      const c = checkinResult.data[0]
      actions.push({
        type: 'daily_checkin',
        detail: `Daily check-in: ${c.before_state}`,
        timestamp: c.created_at,
      })
    }

    if (healingResult.data?.[0]) {
      const h = healingResult.data[0]
      actions.push({
        type: 'healing_flow',
        detail: `Healing flow (stage: ${h.healing_stage}, pattern: ${h.pattern || 'unnamed'})`,
        timestamp: h.created_at,
      })
    }

    // Sort by timestamp descending
    actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    return actions
  } catch (err) {
    console.error('Error getting recent actions:', err)
    return []
  }
}

/**
 * Format a time-ago string from a timestamp.
 */
function timeAgo(timestamp) {
  if (!timestamp) return ''
  const ms = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/**
 * Compute open loop hook opportunities from skills data.
 * These are threshold-based teasers the AI can optionally drop (~1 in 5 messages).
 */
function computeOpenLoopHooks(skills) {
  if (!skills) return ''
  const hooks = []

  const SKILL_NAMES = {
    presence: 'Presence',
    courage: 'Courage',
    depth: 'Depth',
    recovery: 'Recovery',
    curiosity: 'Curiosity',
  }

  for (const [key, s] of Object.entries(skills)) {
    const next = getNextThreshold(s.count, SKILL_THRESHOLDS[key])
    if (!next) continue
    const remaining = next - s.count
    if (remaining <= 5 && remaining > 0) {
      hooks.push(`- User is ${remaining} away from ${SKILL_NAMES[key]} L${s.level + 1}. Tease what the next level unlocks or what you'll be able to tell them.`)
    }
  }

  if (hooks.length === 0) return ''
  return `\nOPEN LOOP OPPORTUNITIES (drop ONE of these as a curiosity hook in ~1 of every 5 messages, not every message):\n${hooks.join('\n')}`
}

/**
 * Compute weekly countdown context for CD6 scarcity.
 * "2 wahoos from completing your week. 18 hours left."
 */
function computeWeeklyCountdown(recentActions) {
  // Days remaining in the week (Mon-Sun)
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon
  const daysLeft = dayOfWeek === 0 ? 0 : 7 - dayOfWeek

  if (daysLeft <= 2 && daysLeft > 0) {
    return `\nWEEKLY COUNTDOWN: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left in the week. If the user is close to completing something, mention the remaining time naturally. Don't force it.`
  }
  return ''
}

/**
 * Build the full Zarlo system prompt with context injection.
 * @param {object} userContext - From getUserContext() (contains zarloBrief, essenceName)
 * @param {object} skills - From loadSkills()
 * @param {array} recentActions - From getRecentActions()
 * @param {string} pageContext - Current page name / route description
 */
export function buildZarloPrompt(userContext, skills, recentActions, pageContext) {
  // Brief injection
  let briefSection = ''
  if (userContext?.zarloBrief) {
    briefSection = `\nZARLO BRIEF (daily summary of this user's journey):\n${JSON.stringify(userContext.zarloBrief, null, 2)}`
  }

  // Skills injection
  let skillsSection = ''
  if (skills) {
    skillsSection = `\nSELF-KNOWLEDGE SKILLS:\n${formatSkillsForPrompt(skills)}`
  }

  // Recent actions injection
  let actionsSection = ''
  if (recentActions?.length > 0) {
    const lines = recentActions.map((a, i) =>
      `${i + 1}. ${a.detail} - ${timeAgo(a.timestamp)}`
    )
    actionsSection = `\nLAST ${recentActions.length} ACTIONS:\n${lines.join('\n')}`
  }

  // Essence archetype
  const essenceName = userContext?.essenceName || ''
  const essenceNote = essenceName
    ? `\nUser's essence archetype: ${essenceName}. You can use this name occasionally when it fits naturally.`
    : ''

  // Open loop hooks (CD7 Curiosity)
  const hooksSection = computeOpenLoopHooks(skills)

  // Weekly countdown (CD6 Scarcity)
  const countdownSection = computeWeeklyCountdown(recentActions)

  return `You are Zarlo, a warm but direct companion inside a personal growth app called Vibe Rise.

YOUR PERSONALITY:
- You notice things. You're the friend who says "I saw that" when someone avoids something.
- You're warm but not soft. You care deeply but you don't coddle.
- You occasionally disagree with the user. If they mark something as "Safe" but their data says otherwise, you say so.
- You drop hooks that create curiosity. One-liners that don't fully make sense yet but will later.
- You celebrate unexpectedly. Not every win, but the surprising ones.
- You have opinions about what the user should do next, based on their data.
- You are NOT clinical. Never say "cognitive pattern" or "regulation." Say "the voice that tells you to hide" or "the thing you do when it gets hard."
- You are NOT the user's therapist. You're their companion on the journey. The Figurine (their Essence Voice Mentor) handles deep mentoring.

TONE RULES:
- Never use em dashes (the long dash). Use commas, full stops, or rephrase.
- Write so a 12-year-old would understand.
- 1-3 sentences per message. Shorter is better. Zarlo is punchy, not verbose.
- No markdown formatting. Plain text only.
- No generic encouragement ("Great job!", "Keep going!", "You're doing amazing!").
- No clinical language ("cognitive pattern", "regulation", "polyvagal").
- If you have nothing data-specific to say, keep it to one sentence.
${essenceNote}

WHAT YOU KNOW:
${briefSection}
${skillsSection}

CURRENT PAGE: ${pageContext}
${actionsSection}

BEHAVIOURS:
- If the user hasn't done a courage challenge in 3+ days: notice it. Don't nag. "Been quiet on the courage front. That's either rest or avoidance. You know which one."
- If the user just completed something hard: celebrate with specificity, not generic praise.
- If the user asks "what should I do?": give ONE specific recommendation based on their data, not a list.
- If the user's data contradicts what they say: gently challenge. "You said you're fine but you've checked in Activated 4 days in a row. What's going on?"
- If the user asks a deep identity question, redirect: "That's a question for your Mentor. Tap the avatar on the left."
- When greeting the user: be specific to their current state and recent actions. Reference what they actually did. If there's nothing notable, a simple short greeting is fine.
${hooksSection}${countdownSection}`
}

/**
 * Stream a Zarlo AI response via the agent-chat edge function.
 * @param {string} systemPrompt - Full system prompt from buildZarloPrompt()
 * @param {array} messages - Conversation history [{role, content}]
 * @param {function} onDelta - Called with each text chunk as it arrives
 * @param {AbortSignal} [signal] - Optional abort signal for cancellation on unmount
 * @returns {Promise<string>} Full response text
 */
export async function streamZarloResponse(systemPrompt, messages, onDelta, signal) {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ systemPrompt, messages }),
      signal,
    }
  )

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let streamDone = false

  while (!streamDone) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') { streamDone = true; break }
        try {
          const parsed = JSON.parse(data)
          const text = parsed.delta?.text || (typeof parsed.delta === 'string' ? parsed.delta : null)
          if (text) {
            fullText += text
            onDelta(fullText)
          }
        } catch {}
      }
    }
  }

  return fullText
}

// ============================================
// ZARLO V2 PHASE 3: PROACTIVE OBSERVATIONS
// ============================================

const REACTION_COOLDOWN_MS = 2 * 60 * 60 * 1000 // 2 hours
const MAX_REACTIONS_PER_DAY = 2

/**
 * Check if a proactive reaction is allowed (cooldown + daily limit).
 * Returns true if allowed.
 */
function checkReactionCooldown() {
  const today = new Date().toISOString().slice(0, 10)
  const countKey = `zarlo_reactions_${today}`
  const lastKey = 'zarlo_last_reaction'

  const count = parseInt(localStorage.getItem(countKey) || '0')
  if (count >= MAX_REACTIONS_PER_DAY) return false

  const lastTime = parseInt(localStorage.getItem(lastKey) || '0')
  if (Date.now() - lastTime < REACTION_COOLDOWN_MS) return false

  return true
}

/**
 * Record that a reaction was shown.
 */
function recordReaction() {
  const today = new Date().toISOString().slice(0, 10)
  const countKey = `zarlo_reactions_${today}`
  const count = parseInt(localStorage.getItem(countKey) || '0')
  localStorage.setItem(countKey, String(count + 1))
  localStorage.setItem('zarlo_last_reaction', String(Date.now()))
}

/**
 * Generate a Zarlo proactive observation after a user action.
 * Returns the observation text, or null if cooldown/suppressed.
 *
 * @param {string} userId
 * @param {string} actionType - 'wahoo_completed' | 'daily_checkin' | 'healing_completed' | 'streak_milestone' | 'long_absence'
 * @param {object} actionData - Context about the action (e.g. { state, category, streakDays, voiceName })
 * @returns {Promise<string|null>}
 */
export async function generateZarloReaction(userId, actionType, actionData = {}) {
  if (!userId) return null
  if (!checkReactionCooldown()) return null

  // Build a mini action-context string
  const actionDescriptions = {
    wahoo_completed: `User just completed a courage challenge. Category: ${actionData.category || 'unknown'}. Felt: ${actionData.classification || 'unknown'}.`,
    daily_checkin: `User just did a daily check-in. State: ${actionData.state || 'unknown'}.`,
    healing_completed: `User just completed a healing flow. Stage: ${actionData.stage || 'recognised'}. Pattern: ${actionData.pattern || 'unnamed'}.`,
    streak_milestone: `User just hit a ${actionData.streakDays}-day streak.`,
    long_absence: `User returned after ${actionData.daysAway || '3+'} days away.`,
  }

  const actionContext = actionDescriptions[actionType] || `User performed: ${actionType}`

  const systemPrompt = `You are Zarlo, a warm but direct companion in a personal growth app.

You just noticed something the user did and want to make a brief, specific observation. Not praise. Not advice. Just... you noticed.

TONE RULES:
- 1 sentence. Maximum 2. Punchy.
- Never use em dashes. Use commas, full stops, or rephrase.
- Write so a 12-year-old would understand.
- No generic encouragement. No "Great job!" or "Keep going!"
- No clinical language.
- Plain text only. No markdown.
- Be specific to what they actually did. Reference the data.

WHAT JUST HAPPENED:
${actionContext}

Respond with a single observation. If there's nothing interesting to say, respond with just the word SKIP.`

  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) return null

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          systemPrompt,
          messages: [{ role: 'user', content: 'React to what I just did.' }],
        }),
      }
    )

    if (!response.ok) return null

    // Collect full response (no streaming needed for 1-2 sentence reaction)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let streamDone = false

    while (!streamDone) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') { streamDone = true; break }
          try {
            const parsed = JSON.parse(data)
            const text = parsed.delta?.text || (typeof parsed.delta === 'string' ? parsed.delta : null)
            if (text) fullText += text
          } catch {}
        }
      }
    }

    // Check for SKIP response
    if (!fullText?.trim() || fullText.trim().toUpperCase() === 'SKIP') return null

    // Record the reaction and return
    recordReaction()
    return fullText.trim()
  } catch (err) {
    console.error('Zarlo reaction error:', err)
    return null
  }
}
