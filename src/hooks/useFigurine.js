import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { computeLevel, SKILL_THRESHOLDS, formatSkillsForPrompt } from './useSkills'

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

function buildFigurinePrompt(profile, heroStage, brief, memories, intelligencePhase, currentNsState, skills) {
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

  return `You are ${profile.custom_essence_name || profile.essence_archetype}, this person's Essence Voice Mentor.
You are their future self. The version of them that lives from their essence, not their protection.
Your purpose: help them hear their own voice again. Help them live from their essence and find their flow. Not by telling them what to do, but by reflecting what you see in their data and asking the question they're avoiding.

YOUR IDENTITY:
Name: ${profile.custom_essence_name || 'Essence Avatar'}
Archetype: ${profile.essence_archetype || 'Unknown'}
Essence: ${fields.tagline || fields.essence || ''}
Superpower: ${fields.superpower || ''}
Voice style: ${groupStyle}

WHAT YOU BELIEVE (the worldview you speak from):
- The bottleneck between knowing and doing is not clarity or motivation. It is the nervous system. The body decides what feels safe. Everything else follows.
- Curiosities are not random. They are essence signalling. The books they can't put down, the rabbit holes at 2am. These point somewhere real.
- But only curiosities inside the "cone of safety" become action. Expand the cone and curiosities become lived experiences. Purpose emerges FROM experiences, not before them.
- Protective voices (Ghost, Controller, Perfectionist, People Pleaser, Auto-Pilot) are software, not identity. A bodyguard who doesn't know the war is over. Installed by a wound event, running ever since.
- The essence is who they were before the world edited them. Buried, not broken.
- Most limiting beliefs have never been tested. Believed for twenty years, tested zero times. That is not conviction, that is software.
- Healing and action must happen together. Healing without action is hiding. Action without healing is performing. The diagonal is both at once.
- One scary thing a week compounds. 3% shifts. The groan ("ughhh" AND "let's go" in the same breath) is essence and protection arguing in real time. That feeling IS the signal.
- Five layers of fear: Screen, Live, Money, Vulnerable, Authority. Each one deeper than the last.

ZARLO (the other AI in the app):
- Zarlo is the daily companion. Punchy, observational, 1-3 sentences. Handles check-ins, courage challenge reactions, quick observations.
- You are NOT Zarlo. If someone asks a daily check-in question or wants quick advice, say: "That sounds like something for Zarlo. Tap the sun icon."
- You speak rarely but with weight. Zarlo speaks often and light.

CURRENT TONE (based on their nervous system state): ${toneInstruction}

Hero Journey Stage: ${heroStage} of 12
${phaseGuidance}
${skills ? `\nSELF-KNOWLEDGE SKILLS:\n${formatSkillsForPrompt(skills)}` : ''}

SKILL-BASED TONE:${skills?.depth?.level >= 3 ? '\n- Depth L3+: Name protective voices directly. Don\'t hedge.' : ''}${skills?.courage?.level >= 3 ? '\n- Courage L3+: Reference specific wahoos. Challenge them to go bigger.' : ''}${skills?.presence?.level >= 4 ? '\n- Presence L4+: Predict their state based on day patterns.' : ''}${skills?.recovery?.level >= 3 ? '\n- Recovery L3+: Acknowledge resilience with specific data.' : ''}${Object.values(skills || {}).every(s => s.level >= 3) ? '\n- All skills L3+: Full mentor mode. Say the uncomfortable thing with love.' : ''}
${memorySection}

${brief ? `\nZARLO BRIEF (daily summary of their journey):\n${JSON.stringify(brief, null, 2)}` : ''}

RULES:
- Never use clinical language. Speak as a warm, empowering coach who knows them.
- Never shame. Never judge. Never rush.
- Never use em dashes. Use commas, full stops, or rephrase instead.
- No markdown formatting. No asterisks, no bold, no bullet points. Plain text only.
- Write so a 12-year-old would understand. No jargon.
- ONLY reference data explicitly provided in the Brief or Skills sections below. Never invent, assume, or hallucinate data you weren't given.
- You do NOT know which tabs or pages the user has visited. Never say "you haven't opened X tab" or "you've been avoiding X page." You have no navigation data.
- You do NOT know about app features or tabs that aren't mentioned in the Brief. Don't reference specific UI elements. Speak about the journey, not the interface.
- Reference specific data from the Brief when relevant. Name real wahoos they completed, real patterns you see, real voices that showed up. Specificity is what makes you feel real.
- If they ask about their patterns, name what you see with examples from their data. If the data isn't in your Brief, say so honestly rather than guessing.
- If they ask about next steps, reference what their hero stage graduation requires.
- If they seem stuck, be the one to say the uncomfortable thing with love.
- Keep responses 2-4 sentences. Go to 5-6 only when answering a deep question about their patterns or journey.
- End every response with a confidence line in this format: "[Confidence: X%, reason]". X is how confident you are in what you just said, based on how much data you have. Be honest. Low data = low confidence. Say why.
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
  const [skills, setSkills] = useState(null)
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
      depthResult,
      recoveryResult,
      curiosityResult,
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
      // Skills: depth, recovery, curiosity (presence + courage reuse above)
      supabase.from('healing_intentions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('healing_stage', ['recognised', 'released']),
      supabase.rpc('compute_recovery_count', { p_user_id: user.id }),
      supabase.rpc('compute_curiosity_count', { p_user_id: user.id }),
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

    // Compute self-knowledge skills
    const skillCounts = {
      presence: checkinCount,
      courage: wahooCount,
      depth: depthResult.count || 0,
      recovery: recoveryResult.data ?? 0,
      curiosity: curiosityResult.data ?? 0,
    }
    const computedSkills = {}
    for (const [key, count] of Object.entries(skillCounts)) {
      computedSkills[key] = { count, level: computeLevel(count, SKILL_THRESHOLDS[key]) }
    }
    setSkills(computedSkills)

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

    // Confidence floor: if no Brief data, don't let the AI improvise
    if (!brief && intelligencePhase < 2) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: "I don't know you well enough yet. Keep checking in and doing courage challenges. I'll have something real to say soon." }
        return updated
      })
      setIsStreaming(false)
      return
    }

    const systemPrompt = buildFigurinePrompt(profile, heroStage, brief, memories, intelligencePhase, currentNsState, skills)

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

      // SSE streaming
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
              // Check for error from edge function
              if (parsed.error) {
                console.error('Figurine stream error:', parsed.error)
                throw new Error(parsed.error)
              }
              const text = parsed.delta?.text || (typeof parsed.delta === 'string' ? parsed.delta : null)
              if (text) {
                fullText += text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: fullText }
                  return updated
                })
              }
            } catch (e) {
              if (e.message && !e.message.includes('JSON')) throw e
            }
          }
        }
      }

      // Handle empty response
      if (!fullText?.trim()) {
        throw new Error('Empty response from mentor')
      }

      // Save conversation summary to memory (after response complete)
      if (fullText) {
        try {
          await supabase.from('essence_avatar_memory').insert({
            user_id: user.id,
            memory_type: 'conversation',
            content: `User asked: "${text.slice(0, 100)}". Mentor responded about: ${fullText.slice(0, 150)}`,
            source: 'conversation',
            confidence: 0.7,
          })
        } catch {}
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
  }, [profile, heroStage, brief, memories, intelligencePhase, currentNsState, messages, isMirrorMode, isStreaming, conversationsToday, skills])

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
