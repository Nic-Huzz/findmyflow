/**
 * ZarloChat - Main chat interface component
 *
 * Handles:
 * - Page context awareness (what is this page, why it matters)
 * - Intake flow for new users
 * - Accountability check-ins
 * - Commitment setting
 * - Routing to other pages
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import ZarloMessage from './ZarloMessage'
import ZarloQuickReplies from './ZarloQuickReplies'
import {
  loadZarloState,
  saveZarloState,
  getUserContext,
  determineZarloAction,
  getStruggleConfig,
  getMilestoneMessage,
  getPromptsForPage,
  getPromptResponse,
  getPublicFlowGreeting,
  getPublicFlowPrompts,
  determinePublicZarloAction,
  INTAKE_STRUGGLES,
  ACCOUNTABILITY_RESPONSES,
  STANDARD_PROMPTS,
  loadSkills,
  getRecentActions,
  buildZarloPrompt,
  streamZarloResponse
} from '../../lib/zarlo/zarloEngine'
import { getPageContent, getChallengeTabContent, getOnboardingContent, ROUTING_OPTIONS, SOUTH_MODE, isPublicRoute } from '../../lib/zarlo/zarloPageContent'
import { useOnboarding } from '../../context/OnboardingContext'
import { trackEvent } from '../../lib/analytics'
import './Zarlo.css'

// Intake flow steps
const INTAKE_STEPS = ['question', 'followup', 'reframe']

// Time-based greeting
function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Get next best action based on user context (now wheel-aware)
function getNextBestAction(userContext) {
  const { hasCompletedNS, hasCompletedFlowFinder, groanCount, currentStage, wheelSummary, gapAnalysis, experienceCreatorArchetype } = userContext

  // Priority 1: Nervous System Map - the core differentiator
  if (!hasCompletedNS) {
    return {
      message: "You haven't mapped your nervous system yet — that's the unlock that makes everything else work.",
      action: { id: 'ns_map', label: 'Map my nervous system', route: '/nervous-system' }
    }
  }

  // Priority 2: Flow Finder for clarity (now wheel-aware)
  if (!hasCompletedFlowFinder || wheelSummary?.skills === 0) {
    return {
      message: "Ready to discover what you're actually here to build?",
      action: { id: 'flow_finder', label: 'Start Skills Discovery', route: '/nikigai/skills' }
    }
  }

  // Priority 2.5: Problems discovery if skills done but no problems
  if (wheelSummary?.skills > 0 && wheelSummary?.problems === 0) {
    return {
      message: `Your ${wheelSummary.topSkill} skills are mapped! Now let's discover what problems you're passionate about solving.`,
      action: { id: 'problems_finder', label: 'Discover Problems', route: '/nikigai/problems' }
    }
  }

  // Priority 2.6: Persona discovery if skills + problems done but no personas
  if (wheelSummary?.skills > 0 && wheelSummary?.problems > 0 && wheelSummary?.personas === 0) {
    return {
      message: `You know your skills and the problems you care about. Now let's identify WHO you're meant to serve.`,
      action: { id: 'persona_finder', label: 'Discover Your Persona', route: '/nikigai/persona' }
    }
  }

  // Priority 2.7: Show alignment-based opportunity if all three wheels done
  if (wheelSummary?.hasFullAlignment && gapAnalysis?.opportunities?.length > 0) {
    const topOpportunity = gapAnalysis.opportunities[0]
    if (topOpportunity.priority === 'immediate') {
      return {
        message: `🎯 **${topOpportunity.title}** - ${topOpportunity.description}`,
        action: { id: 'opportunity', label: topOpportunity.action || 'Take action', route: '/offer-builder' }
      }
    }
  }

  // Priority 2.8: Address gaps if detected
  if (gapAnalysis?.gaps?.length > 0) {
    const topGap = gapAnalysis.gaps.find(g => g.severity === 'high')
    if (topGap) {
      const gapRoutes = {
        'skill_without_problem': '/nikigai/problems',
        'problem_without_persona': '/nikigai/persona',
        'skill_without_persona': '/nikigai/persona',
      }
      return {
        message: topGap.message,
        action: { id: 'fill_gap', label: topGap.suggestion?.split(':')[0] || 'Fill this gap', route: gapRoutes[topGap.type] || '/7-day-challenge' }
      }
    }
  }

  // Priority 3: First groan if they haven't done any
  if (groanCount === 0) {
    return {
      message: "You've done the inner work. Time to take action. Your first groan awaits.",
      action: { id: 'first_groan', label: 'Do my first groan', route: '/7-day-challenge?tab=groans' }
    }
  }

  // Priority 4: Continue based on stage
  if (currentStage && currentStage < 7) {
    const stageActions = {
      1: { label: 'Continue validation', route: '/7-day-challenge?tab=quests' },
      2: { label: 'Build your offer', route: '/offer-builder' },
      3: { label: 'Test with users', route: '/7-day-challenge?tab=quests' },
      4: { label: 'Design money models', route: '/7-day-challenge?tab=quests' },
      5: { label: 'Build Grand Slam offer', route: '/offer-builder-v2' },
      6: { label: 'Create your campaign', route: '/funnel-builder' }
    }
    return {
      message: null, // No special message, just show the action
      action: { id: 'stage_action', ...stageActions[currentStage] }
    }
  }

  return null
}

function ZarloChat({ onClose, challengeTab = null }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { onboardingScreen } = useOnboarding()
  const messagesEndRef = useRef(null)
  const initializedRef = useRef(false)

  // State
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [currentOptions, setCurrentOptions] = useState([])
  const [zarloState, setZarloState] = useState(null)
  const [userContext, setUserContext] = useState({})
  const [currentMode, setCurrentMode] = useState('context') // context, intake, accountability, routing, south, commitment
  const [intakeStep, setIntakeStep] = useState(0) // 0, 1, 2 for intake progress dots
  const [commitmentText, setCommitmentText] = useState('')
  const [showCommitmentInput, setShowCommitmentInput] = useState(false)

  // V2: AI chat state
  const [freeTextInput, setFreeTextInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [skills, setSkills] = useState(null)
  const [recentActions, setRecentActions] = useState([])
  const [conversationHistory, setConversationHistory] = useState([]) // [{role, content}] for AI context
  const streamingMsgIdRef = useRef(null)
  const abortRef = useRef(null)

  // Current route for page awareness
  const currentRoute = location.pathname

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Keyboard support - Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Initialize Zarlo (only once per mount)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    initializeZarlo()
  }, [])

  // Cleanup: abort any in-flight stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const initializeZarlo = async () => {
    // Check if this is a public route (sales mode)
    if (isPublicRoute(currentRoute)) {
      showPublicSalesMode()
      setLoading(false)
      return
    }

    if (!user?.id) {
      // Show page context without personalization (scripted fallback)
      showPageContextScripted()
      setLoading(false)
      return
    }

    try {
      // Load state, context, skills, and recent actions in parallel
      const [state, context, userSkills, actions] = await Promise.all([
        loadZarloState(user.id),
        getUserContext(user.id),
        loadSkills(user.id),
        getRecentActions(user.id)
      ])

      setZarloState(state)
      setUserContext(context)
      setSkills(userSkills)
      setRecentActions(actions)

      // Determine what to show
      const action = determineZarloAction(state, context, currentRoute)

      // Track Zarlo open
      trackEvent('zarlo_opened', {
        mode: action.mode,
        route: currentRoute
      })

      switch (action.mode) {
        case 'south':
          showSouthMode()
          break
        case 'accountability':
          showAccountabilityCheck(action.commitment)
          break
        case 'milestone':
          showMilestone(action.groanCount)
          break
        case 'intake':
          showIntakeWelcome()
          break
        case 'context':
        default:
          showAIGreeting(context, userSkills, actions)
          break
      }
    } catch (err) {
      console.error('Error initializing Zarlo:', err)
      showPageContextScripted()
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // MESSAGE HELPERS
  // ============================================

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender,
      text,
      timestamp: new Date()
    }])
  }

  const clearMessages = () => {
    setMessages([])
  }

  // ============================================
  // PAGE CONTEXT MODE (V2: AI-powered)
  // ============================================

  /**
   * Get the page context string for AI prompt injection.
   */
  const getPageContextString = () => {
    let pageContent
    if (onboardingScreen) {
      pageContent = getOnboardingContent(onboardingScreen)
    } else if (currentRoute === '/7-day-challenge' && challengeTab) {
      pageContent = getChallengeTabContent(challengeTab)
    } else {
      pageContent = getPageContent(currentRoute)
    }
    return `${pageContent.pageName} (${currentRoute}${challengeTab ? `, ${challengeTab} tab` : ''})`
  }

  /**
   * Scripted fallback (no user, or error). Used for unauthenticated users.
   */
  const showPageContextScripted = () => {
    setCurrentMode('context')
    setShowCommitmentInput(false)

    let pageContent
    if (onboardingScreen) {
      pageContent = getOnboardingContent(onboardingScreen)
    } else if (currentRoute === '/7-day-challenge' && challengeTab) {
      pageContent = getChallengeTabContent(challengeTab)
    } else {
      pageContent = getPageContent(currentRoute)
    }

    const timeGreeting = getTimeGreeting()
    addMessage('zarlo', `${timeGreeting}! You're in **${pageContent.pageName}**`)

    const prompts = getPromptsForPage(currentRoute, challengeTab)
    setCurrentOptions([...prompts, { id: 'report_bug', label: 'Report a bug' }])
  }

  /**
   * AI-powered greeting. Streams the greeting message letter by letter.
   * Quick-replies appear instantly (no wait).
   */
  const showAIGreeting = async (ctx, userSkills, actions) => {
    setCurrentMode('context')
    setShowCommitmentInput(false)

    // Show quick-replies immediately (no waiting for AI)
    const prompts = getPromptsForPage(currentRoute, challengeTab)
    setCurrentOptions([...prompts, { id: 'report_bug', label: 'Report a bug' }])

    // Add a placeholder streaming message
    const msgId = Date.now() + Math.random()
    streamingMsgIdRef.current = msgId
    setMessages([{ id: msgId, sender: 'zarlo', text: '', timestamp: new Date() }])
    setIsStreaming(true)

    try {
      abortRef.current = new AbortController()
      const pageContext = getPageContextString()
      const systemPrompt = buildZarloPrompt(ctx, userSkills, actions, pageContext)
      const greetingPrompt = [{ role: 'user', content: 'Greet me briefly. Reference what I\'ve been up to recently or my current state if you have data. Keep it to 1-2 sentences.' }]

      const fullText = await streamZarloResponse(systemPrompt, greetingPrompt, (textSoFar) => {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, text: textSoFar } : m
        ))
      }, abortRef.current.signal)

      // If stream returned empty, fall back to scripted
      if (!fullText?.trim()) {
        throw new Error('Empty AI response')
      }

      // Store only the greeting response (no synthetic user turn)
      setConversationHistory([
        { role: 'assistant', content: fullText }
      ])
    } catch (err) {
      if (err.name === 'AbortError') return // unmounted, silently exit
      console.error('Zarlo AI greeting error:', err)
      // Fallback to scripted greeting
      const pageContent = getPageContent(currentRoute)
      const timeGreeting = getTimeGreeting()
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, text: `${timeGreeting}! You're in **${pageContent.pageName}**` } : m
      ))
    } finally {
      setIsStreaming(false)
      streamingMsgIdRef.current = null
    }
  }

  /**
   * Send a message to Zarlo AI (free-text or quick-reply prompt).
   * Streams the response.
   */
  const sendAIMessage = async (text) => {
    if (isStreaming || !user?.id) return

    // Add user message
    addMessage('user', text)

    // Add streaming placeholder
    const msgId = Date.now() + Math.random()
    streamingMsgIdRef.current = msgId
    setMessages(prev => [...prev, { id: msgId, sender: 'zarlo', text: '', timestamp: new Date() }])
    setIsStreaming(true)

    // Build messages for AI (include conversation history)
    const aiMessages = [
      ...conversationHistory,
      { role: 'user', content: text }
    ]

    try {
      abortRef.current = new AbortController()
      const pageContext = getPageContextString()
      const systemPrompt = buildZarloPrompt(userContext, skills, recentActions, pageContext)

      const fullText = await streamZarloResponse(systemPrompt, aiMessages, (textSoFar) => {
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, text: textSoFar } : m
        ))
      }, abortRef.current.signal)

      if (!fullText?.trim()) {
        throw new Error('Empty AI response')
      }

      // Update conversation history (keep last 10 turns to stay within token limits)
      setConversationHistory(prev => {
        const updated = [...prev, { role: 'user', content: text }, { role: 'assistant', content: fullText }]
        return updated.slice(-10)
      })

      // Track AI response
      trackEvent('zarlo_ai_response', {
        input_type: 'free_text',
        route: currentRoute
      })
    } catch (err) {
      if (err.name === 'AbortError') return // unmounted, silently exit
      console.error('Zarlo AI response error:', err)
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, text: "Something went wrong. Try again or tap a quick option." } : m
      ))
    } finally {
      setIsStreaming(false)
      streamingMsgIdRef.current = null
    }
  }

  // ============================================
  // PUBLIC SALES MODE (Lead Magnet Flows)
  // ============================================

  const showPublicSalesMode = () => {
    setCurrentMode('public_sales')
    setShowCommitmentInput(false)

    // Track public flow open
    trackEvent('zarlo_public_opened', {
      route: currentRoute
    })

    // Get the sales-focused greeting
    const greeting = getPublicFlowGreeting(currentRoute)
    addMessage('zarlo', greeting)

    // Get sales-focused prompts
    const prompts = getPublicFlowPrompts(currentRoute)
    setCurrentOptions(prompts)
  }

  const handlePublicSalesPrompt = (option) => {
    addMessage('user', option.label)

    // Get response for the prompt
    const response = getPromptResponse(currentRoute, option.id, null)

    // Track public prompt click
    trackEvent('zarlo_public_prompt', {
      prompt_id: option.id,
      route: currentRoute
    })

    setTimeout(() => {
      addMessage('zarlo', response)
      // Show remaining prompts (excluding the one just clicked)
      const prompts = getPublicFlowPrompts(currentRoute)
      setCurrentOptions(prompts.filter(p => p.id !== option.id))
    }, 300)
  }

  // ============================================
  // INTAKE FLOW
  // ============================================

  const showIntakeWelcome = () => {
    setCurrentMode('intake')
    setIntakeStep(0)
    clearMessages()

    addMessage('zarlo', `Hey! I'm Zarlo, your co-founder guide.

I'm not here to give you generic advice. I'm here to help you understand what's actually holding you back — and it's probably not what you think.

Quick question: What's the biggest thing stopping you from building the life and business you want?`)

    setCurrentOptions(INTAKE_STRUGGLES.map(s => ({
      id: s.id,
      label: s.label
    })))
  }

  const handleIntakeStruggleSelect = async (struggle) => {
    addMessage('user', struggle.label)

    const config = getStruggleConfig(struggle.id)
    if (!config) return

    // Track struggle selection
    trackEvent('zarlo_intake_struggle', {
      struggle_id: struggle.id
    })

    // Save primary struggle
    if (user?.id) {
      const newState = await saveZarloState(user.id, {
        primary_struggle: struggle.id,
        current_flow: 'intake',
        current_step: 'followup'
      })
      setZarloState(newState)
    }

    // Move to step 1
    setIntakeStep(1)

    // Show follow-up question
    setTimeout(() => {
      addMessage('zarlo', config.followUp.question)
      setCurrentOptions(config.followUp.options)
    }, 300)
  }

  const handleIntakeFollowUp = async (option) => {
    addMessage('user', option.label)

    const config = getStruggleConfig(zarloState?.primary_struggle || INTAKE_STRUGGLES[0].id)
    if (!config) return

    // Track follow-up selection
    trackEvent('zarlo_intake_followup', {
      struggle_id: zarloState?.primary_struggle,
      followup_id: option.id
    })

    // Save secondary context
    if (user?.id) {
      await saveZarloState(user.id, {
        secondary_context: option.id,
        current_step: 'reframe'
      })
    }

    // Move to step 2
    setIntakeStep(2)

    // Show reframe + CTA
    setTimeout(() => {
      addMessage('zarlo', config.reframe)

      setCurrentOptions([
        { id: 'go', label: config.cta, route: config.route + (config.routeParams || '') },
        { id: 'more', label: 'Tell me more first' }
      ])
    }, 300)
  }

  // ============================================
  // ACCOUNTABILITY MODE
  // ============================================

  const showAccountabilityCheck = (commitment) => {
    setCurrentMode('accountability')
    setShowCommitmentInput(false)
    clearMessages()

    addMessage('zarlo', `Welcome back! You said you'd:

"${commitment}"

Did you do it?`)

    setCurrentOptions([
      { id: 'completed', label: 'Yes, I did it!' },
      { id: 'partial', label: 'Partially' },
      { id: 'skipped', label: "No, I didn't" }
    ])
  }

  const handleAccountabilityResponse = async (response) => {
    addMessage('user', response.label)

    const responseConfig = ACCOUNTABILITY_RESPONSES[response.id]
    if (!responseConfig) return

    // Track accountability response
    trackEvent('zarlo_accountability', {
      outcome: response.id
    })

    // Update commitment status
    if (user?.id) {
      await saveZarloState(user.id, {
        commitment_completed: response.id === 'completed',
        commitment_outcome: response.id,
        // Clear the commitment so it doesn't keep asking
        last_commitment: null,
        last_commitment_date: null
      })
    }

    setTimeout(() => {
      addMessage('zarlo', responseConfig.message)
      setCurrentOptions(responseConfig.options)
    }, 300)
  }

  // ============================================
  // COMMITMENT SETTING
  // ============================================

  const showCommitmentSetting = () => {
    setCurrentMode('commitment')
    setShowCommitmentInput(true)
    setCurrentOptions([])

    addMessage('zarlo', `What's one thing you'll commit to doing before we chat again?

Make it specific enough that you'll know if you did it. The groan zone is good — something that stretches you just a bit.`)
  }

  const handleCommitmentSubmit = async () => {
    if (!commitmentText.trim()) return

    const commitment = commitmentText.trim()
    addMessage('user', commitment)
    setCommitmentText('')
    setShowCommitmentInput(false)

    // Track commitment set
    trackEvent('zarlo_commitment_set', {
      commitment_length: commitment.length
    })

    // Save commitment
    if (user?.id) {
      await saveZarloState(user.id, {
        last_commitment: commitment,
        last_commitment_date: new Date().toISOString(),
        commitment_completed: false,
        commitment_outcome: null
      })
    }

    setTimeout(() => {
      addMessage('zarlo', `Locked in. I'll check in on you next time.

"${commitment}"

Now go make it happen. Your future self is counting on you.`)
      setCurrentOptions([
        { id: 'close', label: 'Got it!' },
        { id: 'quests', label: "Show me today's quests", route: '/7-day-challenge' }
      ])
    }, 300)
  }

  // ============================================
  // VOICE INPUT HANDLER
  // ============================================

  // ============================================
  // SOUTH MODE
  // ============================================

  const showSouthMode = () => {
    setCurrentMode('south')
    setShowCommitmentInput(false)
    clearMessages()

    addMessage('zarlo', SOUTH_MODE.greeting)

    // Get page prompts but add the rest option
    const prompts = getPromptsForPage(currentRoute, challengeTab)
    setCurrentOptions([
      SOUTH_MODE.additionalPrompt,
      ...prompts
    ])
  }

  // ============================================
  // MILESTONE MODE
  // ============================================

  const showMilestone = (groanCount) => {
    setCurrentMode('milestone')
    setShowCommitmentInput(false)
    clearMessages()

    const milestone = getMilestoneMessage(groanCount, userContext)
    if (!milestone) {
      showPageContextScripted()
      return
    }

    // Track milestone
    trackEvent('zarlo_milestone', {
      groan_count: groanCount
    })

    addMessage('zarlo', `🎉 **${milestone.title}**\n\n${milestone.message}`)
    setCurrentOptions(milestone.options)
  }

  // ============================================
  // OPTION HANDLERS
  // ============================================

  const handleOptionSelect = async (option) => {
    // Track prompt click
    trackEvent('zarlo_prompt_click', {
      prompt_id: option.id,
      mode: currentMode,
      route: currentRoute
    })

    // Handle close
    if (option.id === 'close') {
      if (onClose) onClose()
      return
    }

    // Handle commitment setting
    if (option.id === 'commit') {
      showCommitmentSetting()
      return
    }

    // Handle bug report
    if (option.id === 'report_bug') {
      window.open(
        'https://wa.me/61423220241?text=Hey!%20Something%20isn\'t%20working%20properly...',
        '_blank',
        'noopener,noreferrer'
      )
      return
    }

    // Handle navigation
    if (option.route) {
      addMessage('user', option.label)
      setTimeout(() => {
        navigate(option.route)
        if (onClose) onClose()
      }, 300)
      return
    }

    // Handle by current mode
    switch (currentMode) {
      case 'intake':
        // Check if this is a struggle selection or follow-up
        if (INTAKE_STRUGGLES.find(s => s.id === option.id)) {
          handleIntakeStruggleSelect(option)
        } else if (option.id === 'go') {
          // Go to recommended route
          const config = getStruggleConfig(zarloState?.primary_struggle)
          if (config) {
            navigate(config.route + (config.routeParams || ''))
            if (onClose) onClose()
          }
        } else if (option.id === 'more') {
          // User wants more info
          const config = getStruggleConfig(zarloState?.primary_struggle)
          if (config) {
            addMessage('user', option.label)
            setTimeout(() => {
              addMessage('zarlo', `The Nervous System Map is a 10-15 minute flow that uses your body's wisdom to reveal where your "safe edge" really is.

Through a simple sway test (your body literally leans toward or away from statements), we'll discover:
• How many people you feel safe being visible to
• How much money feels safe to earn
• Which "safety contracts" are running in the background

Ready to try it?`)
              setCurrentOptions([
                { id: 'go', label: "Let's do it", route: config.route },
                { id: 'later', label: 'Maybe later' }
              ])
            }, 300)
          }
        } else if (option.id === 'later') {
          addMessage('user', option.label)
          setTimeout(() => {
            addMessage('zarlo', `No rush. When you're ready, just tap on "Nervous System Map" in the challenge. I'll be here.`)
            setCurrentOptions([
              { id: 'quests', label: 'Show me the quests', route: '/7-day-challenge' },
              { id: 'close', label: 'Got it, thanks' }
            ])
          }, 300)
        } else {
          handleIntakeFollowUp(option)
        }
        break

      case 'accountability':
        if (['completed', 'partial', 'skipped'].includes(option.id)) {
          handleAccountabilityResponse(option)
        } else if (option.id === 'resistance') {
          addMessage('user', option.label)
          setTimeout(() => {
            addMessage('zarlo', ACCOUNTABILITY_RESPONSES.resistance_followup.message)
            setCurrentOptions(ACCOUNTABILITY_RESPONSES.resistance_followup.options)
          }, 300)
        } else if (option.id === 'understand') {
          addMessage('user', option.label)
          setTimeout(() => {
            addMessage('zarlo', `Resistance isn't weakness — it's information.

Your nervous system is trying to keep you safe. The question is: safe from what?

Usually it's one of these:
• Fear of being seen (and judged)
• Fear of success (and what changes)
• Fear of failure (and proving something true)

Want to explore what's behind your resistance?`)
            setCurrentOptions([
              { id: 'explore', label: 'Yes, let me explore', route: '/healing-compass' },
              { id: 'smaller', label: 'Just give me something smaller to do' }
            ])
          }, 300)
        } else if (option.id === 'smaller' || option.id === 'different') {
          addMessage('user', option.label)
          setTimeout(() => {
            addMessage('zarlo', `Smart. Here's something smaller that still moves the needle:

**Log one groan moment** — just notice when you feel resistance today and write it down.

That's it. No action required. Just awareness.`)
            setCurrentOptions([
              { id: 'commit_groan', label: "I'll do that", route: '/7-day-challenge?tab=groans' },
              { id: 'commit', label: 'I want to set my own commitment' }
            ])
          }, 300)
        }
        break

      case 'south':
        if (option.id === 'rest') {
          addMessage('user', option.label)
          setTimeout(() => {
            addMessage('zarlo', SOUTH_MODE.restResponse)
            setCurrentOptions([
              { id: 'gentle_release', label: 'Show me a gentle release', route: '/7-day-challenge?tab=courage' },
              { id: 'just_log', label: 'Just log how I feel', route: '/7-day-challenge?tab=tracker' },
              { id: 'close', label: 'Thanks, I\'ll rest' }
            ])
          }, 300)
        } else {
          handleContextPrompt(option)
        }
        break

      case 'routing':
        if (option.route) {
          navigate(option.route)
          if (onClose) onClose()
        }
        break

      case 'commitment':
        // Already handled above
        break

      case 'public_sales':
        handlePublicSalesPrompt(option)
        break

      case 'context':
      default:
        handleContextPrompt(option)
        break
    }
  }

  const handleContextPrompt = (option) => {
    // Handle "something else" specially (stays scripted — routing)
    if (option.id === 'something_else') {
      addMessage('user', option.label)
      setCurrentMode('routing')
      setTimeout(() => {
        addMessage('zarlo', 'No problem! What do you want to focus on?')
        setCurrentOptions(ROUTING_OPTIONS)
      }, 300)
      return
    }

    // V2: Use AI for all context-mode responses
    if (user?.id) {
      sendAIMessage(option.label)
      return
    }

    // Fallback: scripted response for unauthenticated users
    addMessage('user', option.label)
    const response = getPromptResponse(currentRoute, option.id, challengeTab)

    if (typeof response === 'object' && response.type === 'routing') {
      setCurrentMode('routing')
      setTimeout(() => {
        addMessage('zarlo', response.message)
        setCurrentOptions(response.options)
      }, 300)
    } else {
      setTimeout(() => {
        addMessage('zarlo', response)
        const prompts = getPromptsForPage(currentRoute, challengeTab)
        setCurrentOptions(prompts.filter(p => p.id !== option.id))
      }, 300)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  // Progress dots for intake flow
  const renderProgressDots = () => {
    if (currentMode !== 'intake') return null

    return (
      <div className="zarlo-progress">
        {INTAKE_STEPS.map((step, index) => (
          <div
            key={step}
            className={`zarlo-progress-dot ${
              index === intakeStep ? 'active' : index < intakeStep ? 'completed' : ''
            }`}
          />
        ))}
      </div>
    )
  }

  // Commitment input with keyboard support
  const handleCommitmentKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && commitmentText.trim()) {
      e.preventDefault()
      handleCommitmentSubmit()
    }
  }

  const renderCommitmentInput = () => {
    if (!showCommitmentInput) return null

    return (
      <div className="zarlo-commitment-input">
        <textarea
          className="zarlo-commitment-textarea"
          value={commitmentText}
          onChange={(e) => setCommitmentText(e.target.value)}
          onKeyDown={handleCommitmentKeyDown}
          placeholder="e.g., Post one thing on LinkedIn about my expertise"
          rows={3}
          autoFocus
        />
        <button
          className="zarlo-commitment-submit"
          onClick={handleCommitmentSubmit}
          disabled={!commitmentText.trim()}
        >
          Lock it in
        </button>
        <span className="zarlo-commitment-hint">Press ⌘+Enter to submit</span>
      </div>
    )
  }

  // V2: Free-text input for context mode
  const handleFreeTextSubmit = (e) => {
    e.preventDefault()
    if (!freeTextInput.trim() || isStreaming) return
    sendAIMessage(freeTextInput.trim())
    setFreeTextInput('')
  }

  const renderFreeTextInput = () => {
    // Only show in context mode for authenticated users
    if (currentMode !== 'context' || !user?.id) return null
    if (showCommitmentInput) return null

    return (
      <form className="zarlo-free-text" onSubmit={handleFreeTextSubmit}>
        <input
          className="zarlo-free-text-input"
          type="text"
          value={freeTextInput}
          onChange={e => setFreeTextInput(e.target.value)}
          placeholder="Ask Zarlo..."
          disabled={isStreaming}
        />
        <button
          className="zarlo-free-text-send"
          type="submit"
          disabled={!freeTextInput.trim() || isStreaming}
        >
          →
        </button>
      </form>
    )
  }

  if (loading) {
    return (
      <div className="zarlo-chat">
        <div className="zarlo-header">
          <div className="zarlo-header-left">
            <span className="zarlo-avatar">🌞</span>
            <div className="zarlo-header-info">
              <h3>Zarlo</h3>
              <span className="zarlo-subtitle">Your game guide</span>
            </div>
          </div>
          <button className="zarlo-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="zarlo-loading">
          <span className="zarlo-loading-dot"></span>
          <span className="zarlo-loading-dot"></span>
          <span className="zarlo-loading-dot"></span>
        </div>
      </div>
    )
  }

  // Determine subtitle based on mode
  const zarloSubtitle = currentMode === 'public_sales' ? 'Your guide' : 'Your game guide'

  return (
    <div className="zarlo-chat">
      <div className="zarlo-header">
        <div className="zarlo-header-left">
          <span className="zarlo-avatar">🌞</span>
          <div className="zarlo-header-info">
            <h3>Zarlo</h3>
            <span className="zarlo-subtitle">{zarloSubtitle}</span>
          </div>
        </div>
        <div className="zarlo-header-right">
          <a
            className="zarlo-bug-report"
            href="https://wa.me/61423220241?text=Hey!%20Something%20isn't%20working%20properly..."
            target="_blank"
            rel="noopener noreferrer"
            title="Report a bug"
          >
            <span className="zarlo-bug-icon">🐛</span>
            <span className="zarlo-bug-label">Bug?</span>
          </a>
          <button className="zarlo-close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {renderProgressDots()}

      <div className="zarlo-messages">
        {messages.map(msg => (
          <ZarloMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {currentOptions.length > 0 && (
        <ZarloQuickReplies
          options={currentOptions}
          onSelect={handleOptionSelect}
        />
      )}

      {renderCommitmentInput()}
      {renderFreeTextInput()}
    </div>
  )
}

export default ZarloChat
