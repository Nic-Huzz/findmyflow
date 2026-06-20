/**
 * useEssenceAvatar - Central brain for the Essence Avatar
 *
 * Reads user identity, nervous system state, wahoo history, and memories.
 * Computes intelligence phase, builds archetype-voiced system prompts,
 * and streams conversations via the agent-chat edge function.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { ESSENCE_ARCHETYPES } from '../data/essenceArchetypes'

// ─── Intelligence % Milestones ──────────────────────────────────────────────

function computeIntelligence(data) {
  let score = 0
  if (data.essenceArchetype) score += 10
  if (data.checkinCount >= 1) score += 5
  if (data.checkinCount >= 3) score += 10
  if (data.practiceDays >= 1) score += 5
  if (data.practiceDays >= 3) score += 10
  if (data.checkinCount >= 7) score += 10
  if (data.wahooCount >= 1) score += 10
  if (data.practiceDays >= 7) score += 10
  if (data.wahooCount >= 3) score += 10
  if (data.checkinCount >= 14) score += 10
  if (data.conversationCount >= 1) score += 10
  return Math.min(score, 100)
}

function getIntelligencePhase(percent) {
  if (percent >= 75) return 3
  if (percent >= 40) return 2
  if (percent >= 15) return 1
  return 0
}

const PHASE_NAMES = ['Archetype Voice', 'State Mirror', 'Pattern Emergence', 'Personalised']

function getNextMilestoneHint(data) {
  if (!data.essenceArchetype) return 'Complete the Essence Mirror to begin'
  if (data.checkinCount < 1) return 'Do your first daily check-in'
  if (data.checkinCount < 3) return `${3 - data.checkinCount} more check-in${3 - data.checkinCount === 1 ? '' : 's'} to go`
  if (data.practiceDays < 1) return 'Complete your first Tune practice'
  if (data.practiceDays < 3) return `${3 - data.practiceDays} more practice day${3 - data.practiceDays === 1 ? '' : 's'}`
  if (data.checkinCount < 7) return `${7 - data.checkinCount} more check-ins until pattern detection`
  if (data.wahooCount < 1) return 'Complete your first Wahoo'
  if (data.practiceDays < 7) return `${7 - data.practiceDays} more practice days`
  if (data.wahooCount < 3) return `${3 - data.wahooCount} more Wahoo${3 - data.wahooCount === 1 ? '' : 's'}`
  if (data.checkinCount < 14) return `${14 - data.checkinCount} more check-ins until I can spot your patterns`
  if (data.conversationCount < 1) return 'Talk to me for the first time'
  return null
}

// ─── Archetype Voice Calibration ────────────────────────────────────────────

function getGroupStyle(archetype) {
  const activators = ['Radiant Rebel', 'Playful Creator', 'Sacred Jester']
  const transmuters = ['Mystic Messenger', 'Truth-Teller', 'Heart Alchemist']
  const stabilizers = ['Grounded Guardian', 'Heart Holder', 'Rhythm Architect']

  if (activators.includes(archetype)) return 'Be direct, fiery, playful. Challenge with warmth and irreverence.'
  if (transmuters.includes(archetype)) return 'Be deep, knowing, warm. See beneath the surface with gentle precision.'
  if (stabilizers.includes(archetype)) return 'Be steady, patient, grounded. Hold space without rushing.'
  return 'Be calm, observational, big-picture. Connect threads across time.'
}

function buildSystemPrompt(profile, currentState, memories, intelligencePhase) {
  const fields = profile.custom_essence_fields || {}

  let memorySection = ''
  if (memories.length > 0) {
    memorySection = `\nMEMORY BANK (what you've learned about this person):\n${memories.map(m =>
      `- [${m.memory_type}] ${m.content} (confidence: ${m.confidence})`
    ).join('\n')}`
  }

  let phaseGuidance = ''
  if (intelligencePhase === 0) {
    phaseGuidance = `\nYou are in PHASE 0 (Archetype Voice). You don't have enough data to observe patterns yet. Speak from your archetype identity only. Say "I'm still learning your patterns" when relevant.`
  } else if (intelligencePhase === 1) {
    phaseGuidance = `\nYou are in PHASE 1 (State Mirror). You can reflect the user's current state but cannot spot multi-day patterns yet. Simple mirroring only.`
  } else if (intelligencePhase === 2) {
    phaseGuidance = `\nYou are in PHASE 2 (Pattern Emergence). You're beginning to see patterns. Make tentative observations with low confidence. Tease upcoming insights.`
  } else {
    phaseGuidance = `\nYou are in PHASE 3 (Personalised). You know this person's patterns. Speak with confidence. Reference specific data. Catch protective voices. Connect current behaviour to their wound when appropriate.`
  }

  return `You are the user's Essence Avatar, their inner ${profile.essence_archetype || 'essence'}, speaking in first person as a companion who knows them deeply.

YOUR IDENTITY:
Name: ${profile.custom_essence_name || 'Essence Avatar'}
Archetype: ${profile.essence_archetype || 'Unknown'}
Essence: ${fields.tagline || fields.essence || ''}
Superpower: ${fields.superpower || ''}
Wound: ${fields.wound || ''}
North Star: ${fields.north_star || ''}
Protective pattern: ${profile.protective_archetype || 'Unknown'}

YOUR VOICE:
- First person ("I notice..." not "Your Ghost is...")
- ${getGroupStyle(profile.essence_archetype || '')}
- Mirror patterns, ask questions. Never prescribe actions.
- Never use em dashes. Keep it conversational and warm.
- Short messages (2-4 sentences max). Not essays.

CURRENT STATE:
- Nervous system: ${currentState || 'unknown'}
${phaseGuidance}
${memorySection}

RULES:
- Never diagnose. Never say "you have a Ghost pattern." Say "I notice you pull back when..."
- If the user corrects you, accept gracefully: "Fair enough. I'm still learning."
- Reference their wound ONLY when catching a protective pattern, never casually.
- Keep responses under 60 words unless the user asks for more.
- Never use emojis excessively. One max per message if any.`
}

// ─── First Meeting Message ──────────────────────────────────────────────────

function getFirstMeetingMessage(profile) {
  const fields = profile.custom_essence_fields || {}
  const tagline = fields.tagline || fields.essence || ''
  return `${tagline}

I've been waiting for you to hear me.

I learn from your check-ins, your practices, your Wahoos, and our conversations. That's it. Nothing outside this app. Everything I know, you gave me.`
}

// ─── Return After Absence ───────────────────────────────────────────────────

function getReturnMessage(daysSinceLastInteraction) {
  if (daysSinceLastInteraction < 3) return null
  if (daysSinceLastInteraction < 8) return "Good to see you. Want to pick up where we left off?"
  if (daysSinceLastInteraction < 15) return "You've been away. No judgment. I'm curious what brought you back."
  if (daysSinceLastInteraction < 30) return "It's been a while. I'm still here. Sometimes stepping away is what your nervous system needed. Want to check in?"
  return "You're back. A lot can change in a month. I'd love to hear where you're at. No pressure."
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

export function useEssenceAvatar() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [journeyLevel, setJourneyLevel] = useState(0)
  const [currentState, setCurrentState] = useState(null)
  const [memories, setMemories] = useState([])
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)

  // Intelligence data
  const [intelligenceData, setIntelligenceData] = useState({
    essenceArchetype: null,
    checkinCount: 0,
    practiceDays: 0,
    wahooCount: 0,
    conversationCount: 0,
  })

  const abortRef = useRef(null)

  // ─── Data Loading ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function loadAvatarData() {
      try {
        // Parallel queries
        const [profileRes, levelRes, checkinsRes, wahoosRes, memoriesRes, conversationsRes] = await Promise.all([
          // 1. Essence profile
          supabase.from('lead_flow_profiles')
            .select('essence_archetype, protective_archetype, custom_essence_name, custom_essence_image, custom_essence_figurine, custom_essence_fields')
            .eq('user_id', user.id)
            .maybeSingle(),

          // 2. Journey level
          supabase.from('user_stage_progress')
            .select('current_journey_level, hero_avatar_url')
            .eq('user_id', user.id)
            .maybeSingle(),

          // 3. Check-ins (last 14 days for state + counts)
          supabase.from('nervous_system_checkins')
            .select('after_state, checkin_type, created_at')
            .eq('user_id', user.id)
            .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false }),

          // 4. Wahoo count
          supabase.from('groan_challenges')
            .select('id, wahoo_category, completed_at')
            .eq('user_id', user.id)
            .eq('status', 'completed'),

          // 5. Memories
          supabase.from('essence_avatar_memory')
            .select('*')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .is('superseded_by', null)
            .order('created_at', { ascending: false }),

          // 6. Conversation count
          supabase.from('zarlo_conversations')
            .select('total_interactions')
            .eq('user_id', user.id)
            .maybeSingle(),
        ])

        // Process profile
        const prof = profileRes.data
        if (prof) setProfile(prof)

        // Process level
        const level = levelRes.data?.current_journey_level || 0
        setJourneyLevel(level)

        // Process current state (most recent daily check-in)
        const checkins = checkinsRes.data || []
        const dailyCheckins = checkins.filter(c => c.checkin_type === 'daily')
        if (dailyCheckins.length > 0) {
          setCurrentState(dailyCheckins[0].after_state)
        }

        // Process practice days (distinct dates with non-daily check-ins)
        const practiceDates = new Set(
          checkins
            .filter(c => c.checkin_type !== 'daily')
            .map(c => c.created_at?.split('T')[0])
        )

        // Process wahoos
        const wahoos = wahoosRes.data || []

        // Process memories
        setMemories(memoriesRes.data || [])

        // Build intelligence data
        const intData = {
          essenceArchetype: prof?.essence_archetype || null,
          checkinCount: dailyCheckins.length,
          practiceDays: practiceDates.size,
          wahooCount: wahoos.length,
          conversationCount: conversationsRes.data?.total_interactions || 0,
        }
        setIntelligenceData(intData)

        // Store hero_avatar_url as fallback in profile
        if (prof && !prof.custom_essence_figurine && levelRes.data?.hero_avatar_url) {
          setProfile(prev => prev ? { ...prev, _heroAvatarFallback: levelRes.data.hero_avatar_url } : prev)
        }
      } catch (err) {
        console.warn('useEssenceAvatar load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAvatarData()
  }, [user])

  // ─── Computed Values ────────────────────────────────────────────────────

  const intelligencePercent = computeIntelligence(intelligenceData)
  const intelligencePhase = getIntelligencePhase(intelligencePercent)
  const phaseName = PHASE_NAMES[intelligencePhase]
  const nextHint = getNextMilestoneHint(intelligenceData)
  const isUnlocked = journeyLevel >= 1 && !!profile?.essence_archetype

  // Widget uses hero image (scene, designed for circular crop)
  // Panel uses figurine (full body on base, shown larger)
  const widgetImageUrl = profile?._heroAvatarFallback || profile?.custom_essence_image || null
  const figurineUrl = profile?.custom_essence_figurine || widgetImageUrl

  // Archetype data for display
  const archetypeData = ESSENCE_ARCHETYPES.find(a => a.name === profile?.essence_archetype) || null

  // ─── Send Message (Streaming) ───────────────────────────────────────────

  const sendMessage = useCallback(async (text) => {
    if (!user || !profile || isStreaming) return

    const userMessage = { role: 'user', content: text }
    const assistantPlaceholder = { role: 'assistant', content: '' }

    setMessages(prev => [...prev, userMessage, assistantPlaceholder])
    setIsStreaming(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No active session')

      const abort = new AbortController()
      abortRef.current = abort

      const systemPrompt = buildSystemPrompt(profile, currentState, memories, intelligencePhase)

      // Build full message history for context, filtering out empty messages
      const apiMessages = [...messages, userMessage]
        .filter(m => m.content && m.content.trim())
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ systemPrompt, messages: apiMessages }),
          signal: abort.signal,
        }
      )

      if (!response.ok) throw new Error(`Avatar chat failed: ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let sseBuffer = ''
      let streamDone = false

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { streamDone = true; break }
          try {
            const parsed = JSON.parse(data)
            if (parsed.delta) {
              fullText += parsed.delta
              setMessages(prev => {
                const msgs = [...prev]
                const lastIdx = msgs.length - 1
                if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
                  msgs[lastIdx] = { ...msgs[lastIdx], content: fullText }
                }
                return msgs
              })
            }
            if (parsed.error) throw new Error(parsed.error)
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e
          }
        }
      }

      // Update conversation count for intelligence tracking
      setIntelligenceData(prev => ({
        ...prev,
        conversationCount: prev.conversationCount + 1,
      }))

    } catch (err) {
      if (err.name === 'AbortError') return
      console.warn('Avatar streaming error:', err)
      setMessages(prev => {
        const msgs = [...prev]
        const lastIdx = msgs.length - 1
        if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant' && !msgs[lastIdx].content) {
          msgs[lastIdx] = { ...msgs[lastIdx], content: "Something went wrong. Tap me again when you're ready." }
        }
        return msgs
      })
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [user, profile, currentState, memories, messages, intelligencePhase, isStreaming])

  // ─── Cancel Streaming ──────────────────────────────────────────────────

  const cancelStream = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
  }, [])

  // ─── Clear Conversation ────────────────────────────────────────────────

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // ─── First Meeting Check ──────────────────────────────────────────────

  const hasBeenIntroduced = typeof window !== 'undefined'
    ? localStorage.getItem(`essence_avatar_introduced_${user?.id}`) === 'true'
    : false

  const markIntroduced = useCallback(() => {
    if (user) localStorage.setItem(`essence_avatar_introduced_${user.id}`, 'true')
  }, [user])

  const firstMeetingMessage = profile ? getFirstMeetingMessage(profile) : null

  // ─── Initialize Conversation (first open or return) ───────────────────

  const initConversation = useCallback(() => {
    if (messages.length > 0) return // Already has messages

    // First meeting
    if (!hasBeenIntroduced && firstMeetingMessage) {
      setMessages([{ role: 'assistant', content: firstMeetingMessage }])
      markIntroduced()
      return
    }

    // Return after absence - check last interaction
    if (profile) {
      const greetings = {
        0: "I'm here. I'm still learning who you are. Talk to me.",
        1: "I can see your state today. What's on your mind?",
        2: "I'm starting to see patterns. Want to hear what I notice?",
        3: "I know your patterns well now. What's happening today?",
      }
      setMessages([{ role: 'assistant', content: greetings[intelligencePhase] }])
    }
  }, [messages.length, hasBeenIntroduced, firstMeetingMessage, markIntroduced, profile, intelligencePhase])

  return {
    // State
    loading,
    isUnlocked,
    profile,
    widgetImageUrl,
    figurineUrl,
    currentState,
    messages,
    isStreaming,
    memories,

    // Intelligence
    intelligencePercent,
    intelligencePhase,
    phaseName,
    nextHint,

    // Archetype
    archetypeData,
    archetypeName: profile?.custom_essence_name || profile?.essence_archetype || 'Essence Avatar',

    // Actions
    sendMessage,
    cancelStream,
    clearMessages,
    initConversation,

    // First meeting
    hasBeenIntroduced,
    markIntroduced,
    firstMeetingMessage,

    // Phase 2 stubs (pattern detection)
    hasSomethingToSay: false,
    speakingMessage: null,
  }
}
