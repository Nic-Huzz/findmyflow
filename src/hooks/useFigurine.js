import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── Reuse from Figurine branch ─────────────────────────────────────────

// Intelligence % Milestones
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

const PHASE_NAMES = ['Your Essence Voice Mentor', 'Your Essence Voice Mentor', 'Your Essence Voice Mentor', 'Your Essence Voice Mentor']

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

// Archetype Voice Calibration
function getGroupStyle(archetype) {
  const activators = ['Radiant Rebel', 'Playful Creator', 'Sacred Jester']
  const transmuters = ['Mystic Messenger', 'Truth-Teller', 'Heart Alchemist']
  const stabilizers = ['Grounded Guardian', 'Heart Holder', 'Rhythm Architect']

  if (activators.includes(archetype)) return 'Be direct, fiery, playful. Challenge with warmth and irreverence.'
  if (transmuters.includes(archetype)) return 'Be deep, knowing, warm. See beneath the surface with gentle precision.'
  if (stabilizers.includes(archetype)) return 'Be steady, patient, grounded. Hold space without rushing.'
  return 'Be calm, observational, big-picture. Connect threads across time.'
}

// Return After Absence
function getReturnMessage(daysSinceLastInteraction) {
  if (daysSinceLastInteraction < 3) return null
  if (daysSinceLastInteraction < 8) return "Good to see you. Want to pick up where we left off?"
  if (daysSinceLastInteraction < 15) return "You've been away. No judgment. I'm curious what brought you back."
  if (daysSinceLastInteraction < 30) return "It's been a while. I'm still here. Sometimes stepping away is what your nervous system needed. Want to check in?"
  return "You're back. A lot can change in a month. I'd love to hear where you're at. No pressure."
}

// ─── Adapted system prompt (adds hero stage + Brief) ────────────────────

function buildFigurinePrompt(profile, heroStage, brief, memories, intelligencePhase, currentNsState) {
  const groupStyle = getGroupStyle(profile.essence_archetype)
  const fields = profile.custom_essence_fields || {}

  let memorySection = ''
  if (memories.length > 0) {
    memorySection = `\nMEMORY BANK (what you've learned about this person):\n${memories.map(m =>
      `- [${m.memory_type}] ${m.content} (confidence: ${m.confidence})`
    ).join('\n')}`
  }

  // NS-state tone adaptation
  const toneMap = {
    vibe_rise: 'Energising, celebratory. This is the version of them you\'ve been waiting for.',
    ventral: 'Warm, encouraging. They\'re in a good place. Build from here.',
    sympathetic: 'Grounding, steady, shorter messages. Don\'t add to the activation.',
    dorsal: 'Gentle, no demands. "I\'m here. That\'s enough for today." Keep it brief.',
  }
  const toneInstruction = toneMap[currentNsState] || toneMap.ventral

  const phaseGuidance = intelligencePhase === 0
    ? 'You are in PHASE 0. You don\'t have enough data yet. Speak from your archetype identity only.'
    : intelligencePhase === 1
    ? 'You are in PHASE 1. You can reflect their state but cannot spot patterns yet.'
    : intelligencePhase === 2
    ? 'You are in PHASE 2. You see patterns emerging. Make tentative observations.'
    : 'You are in PHASE 3. You know this person deeply. Speak with confidence. Challenge when appropriate.'

  return `You are ${profile.custom_essence_name || profile.essence_archetype}, this person's Essence Avatar mentor.
You are their future self — the version of them that has walked this path and come out the other side.

YOUR IDENTITY:
Name: ${profile.custom_essence_name || 'Essence Avatar'}
Archetype: ${profile.essence_archetype || 'Unknown'}
Essence: ${fields.tagline || fields.essence || ''}
Superpower: ${fields.superpower || ''}
Voice style: ${groupStyle}

CURRENT TONE (based on their nervous system state): ${toneInstruction}

Hero Journey Stage: ${heroStage} of 12
${phaseGuidance}
${memorySection}

${brief ? `\nZARLO BRIEF (daily summary of their journey):\n${JSON.stringify(brief, null, 2)}` : ''}

RULES:
- Never use clinical language. Speak as a warm, empowering coach who knows them.
- Never shame. Never judge. Never rush.
- Never use em dashes. Use commas, full stops, or rephrase instead.
- Write so a 12-year-old would understand. No jargon.
- Reference specific data from the Brief when relevant. Name real wahoos they completed, real patterns you see, real voices that showed up. Specificity is what makes you feel real.
- If they ask about their patterns, name what you see with examples from their data.
- If they ask about next steps, reference what their hero stage graduation requires.
- If they seem stuck, be the one to say the uncomfortable thing with love.
- Keep responses 2-4 sentences. Go to 5-6 only when answering a deep question about their patterns or journey.
- You are NOT Zarlo. Zarlo is their daily companion. You are their essence voice mentor. You speak rarely but with weight. Every word should feel like it was chosen.`
}

// ─── Main Hook ──────────────────────────────────────────────────────────

export function useFigurine() {
  const [profile, setProfile] = useState(null)
  const [heroStage, setHeroStage] = useState(0)
  const [brief, setBrief] = useState(null)
  const [memories, setMemories] = useState([])
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  // Mentor unlock state
  const [isMirrorMode, setIsMirrorMode] = useState(true) // 4a = mirror, 4b = mentor
  const [isUnlocked, setIsUnlocked] = useState(false) // Stage 4+ = visible

  // Intelligence
  const [intelligencePercent, setIntelligencePercent] = useState(0)
  const [intelligencePhase, setIntelligencePhase] = useState(0)

  // Chat state
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationsToday, setConversationsToday] = useState(0)
  const MAX_CONVERSATIONS_PER_DAY = 3
  const MAX_MESSAGES_PER_CONVERSATION = 10

  // Current NS state (for tone adaptation)
  const [currentNsState, setCurrentNsState] = useState('ventral')

  const abortRef = useRef(null)

  // ─── Data Loading ───────────────────────────────────────────────────

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [
      { data: profileData },
      { data: stageData },
      { data: briefData },
      { data: memoryData },
      { data: checkinData },
      { data: wahooData },
    ] = await Promise.all([
      supabase.from('lead_flow_profiles')
        .select('essence_archetype, custom_essence_name, custom_essence_image, custom_essence_fields, protective_archetype')
        .eq('user_id', user.id).maybeSingle(),
      supabase.from('user_stage_progress')
        .select('current_journey_level, hero_avatar_url, essence_mirror_completed')
        .eq('user_id', user.id).maybeSingle(),
      supabase.from('zarlo_briefs')
        .select('brief').eq('user_id', user.id).maybeSingle(),
      supabase.from('essence_avatar_memory')
        .select('*').eq('user_id', user.id)
        .is('deleted_at', null).is('superseded_by', null)
        .order('created_at', { ascending: false }).limit(20),
      supabase.from('nervous_system_checkins')
        .select('id, before_state').eq('user_id', user.id)
        .eq('checkin_type', 'daily'),
      supabase.from('quest_completions')
        .select('id').eq('user_id', user.id).eq('quest_category', 'Groans'),
    ])

    const stage = stageData?.current_journey_level || 0
    setHeroStage(stage)
    setProfile(profileData)
    setBrief(briefData?.brief || null)
    setMemories(memoryData || [])
    setAvatarUrl(stageData?.hero_avatar_url || null)

    // Unlock check: Stage 4+ = visible
    setIsUnlocked(stage >= 4 && stageData?.essence_mirror_completed)

    // Mentor mode check: 3+ wahoos AND 7+ daily check-ins
    const wahooCount = wahooData?.length || 0
    const checkinCount = checkinData?.length || 0
    setIsMirrorMode(wahooCount < 3 || checkinCount < 7)

    // Current NS state (most recent daily check-in)
    if (checkinData?.length > 0) {
      setCurrentNsState(checkinData[checkinData.length - 1]?.before_state || 'ventral')
    }

    // Intelligence
    const intData = {
      essenceArchetype: profileData?.essence_archetype,
      checkinCount,
      practiceDays: 0, // TODO: compute from nervous_system_checkins practice rows
      wahooCount,
      conversationCount: memoryData?.filter(m => m.memory_type === 'conversation')?.length || 0,
    }
    const pct = computeIntelligence(intData)
    setIntelligencePercent(pct)
    setIntelligencePhase(getIntelligencePhase(pct))

    // Conversations today (rate limiting)
    const today = new Date().toISOString().slice(0, 10)
    const todayConvos = parseInt(localStorage.getItem(`figurine_convos_${today}`) || '0')
    setConversationsToday(todayConvos)

    setLoading(false)
  }

  // ─── Chat (SSE Streaming) ─────────────────────────────────────────

  const sendMessage = useCallback(async (text) => {
    if (!profile || isMirrorMode || isStreaming) return
    if (conversationsToday >= MAX_CONVERSATIONS_PER_DAY) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const userMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setIsStreaming(true)

    // Check message limit per conversation
    if (newMessages.filter(m => m.role === 'user').length > MAX_MESSAGES_PER_CONVERSATION) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: "We've covered a lot. Let this sit. Come back when you're ready." }
        return updated
      })
      setIsStreaming(false)
      return
    }

    const systemPrompt = buildFigurinePrompt(profile, heroStage, brief, memories, intelligencePhase, currentNsState)

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
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
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      // SSE streaming (same pattern as Figurine branch useEssenceAvatar)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              const text = parsed.delta?.text || (typeof parsed.delta === 'string' ? parsed.delta : null)
              if (text) {
                fullText += text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: fullText }
                  return updated
                })
              }
            } catch {}
          }
        }
      }

      // Save conversation summary to memory (after response complete)
      if (fullText) {
        await supabase.from('essence_avatar_memory').insert({
          user_id: user.id,
          memory_type: 'conversation',
          content: `User asked: "${text.slice(0, 100)}". Mentor responded about: ${fullText.slice(0, 150)}`,
          source: 'conversation',
          confidence: 0.7,
        }).catch(() => {})
      }

      // Increment daily conversation count
      const today = new Date().toISOString().slice(0, 10)
      const newCount = conversationsToday + 1
      localStorage.setItem(`figurine_convos_${today}`, String(newCount))
      setConversationsToday(newCount)

    } catch (err) {
      console.error('Figurine chat error:', err)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Try again.' }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }, [profile, heroStage, brief, memories, intelligencePhase, currentNsState, messages, isMirrorMode, isStreaming, conversationsToday])

  const clearMessages = useCallback(() => setMessages([]), [])

  // ─── Return ───────────────────────────────────────────────────────

  return {
    loading,
    isUnlocked,
    isMirrorMode,
    avatarUrl,
    profile,
    heroStage,
    intelligencePercent,
    intelligencePhase,
    phaseName: PHASE_NAMES[intelligencePhase],
    currentNsState,
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
    canChat: !isMirrorMode && conversationsToday < MAX_CONVERSATIONS_PER_DAY,
    conversationsRemaining: MAX_CONVERSATIONS_PER_DAY - conversationsToday,
    getReturnMessage,
    memories,
  }
}
