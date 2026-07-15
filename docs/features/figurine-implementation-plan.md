# Figurine Implementation Plan

**Created:** 2026-07-13
**Branch:** `light-portal`
**Depends on:** Sprints 1-4 + Social V1 shipped. Figurine branch code available via `git show Figurine:path`.
**Design doc:** `docs/features/figurine-design-doc.md` (982 lines)
**Spec:** `docs/features/figurine-mentor-spec.md`

---

## Summary

10 steps across 4 phases. ~10-12 days total.

| Phase | Steps | What | Effort |
|---|---|---|---|
| 1: Foundation | 1-3 | Migration, hook, overlay component | 3-4 days |
| 2: Chat | 4-5 | Chat component, system prompt | 2-3 days |
| 3: Integration | 6-8 | Journey tab presence, graduation wiring, stuck wiring | 2-3 days |
| 4: Polish | 9-10 | Mirror→Mentor transition, cryptic hooks | 1-2 days |

---

## Confirmed Decisions

- **Visual:** Hero avatar (user's Pixar image from `user_stage_progress.hero_avatar_url`)
- **Positioning:** Bottom-RIGHT FAB (Zarlo stays bottom-LEFT)
- **Chat unlock:** Stage 4b (3+ wahoos AND 7+ daily check-ins)
- **AI backend:** Existing `agent-chat` Edge Function — accepts `systemPrompt` directly, no modification needed
- **Chat conflict:** `activeChat` state (`null | 'zarlo' | 'figurine'`), opening one closes the other
- **Rate limit:** 3 conversations/day, 10 messages/conversation
- **Journey tab:** Figurine presence BELOW the stage card
- **Priority:** Figurine always wins over Zarlo when both want to speak

---

## Phase 1: Foundation (Steps 1-3)

### Step 1: Apply Migration

**Apply via Supabase SQL (not db push — migration history is out of sync):**

```sql
-- From Figurine branch: supabase/migrations/20260619_essence_avatar.sql

ALTER TABLE lead_flow_profiles
  ADD COLUMN IF NOT EXISTS custom_essence_figurine TEXT;

CREATE TABLE IF NOT EXISTS essence_avatar_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'pattern', 'correction', 'insight', 'milestone', 'fear', 'breakthrough', 'conversation'
  )),
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'conversation' CHECK (source IN (
    'conversation', 'mystery_box', 'observation', 'system'
  )),
  confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  superseded_by UUID REFERENCES essence_avatar_memory(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_memory_user ON essence_avatar_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_memory_active ON essence_avatar_memory(user_id, memory_type)
  WHERE deleted_at IS NULL AND superseded_by IS NULL;

ALTER TABLE essence_avatar_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memories" ON essence_avatar_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own memories" ON essence_avatar_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own memories" ON essence_avatar_memory
  FOR UPDATE USING (auth.uid() = user_id);
```

Note: added `'conversation'` to memory_type CHECK constraint (not in original branch migration).

Also save the migration file locally:

**Create:** `supabase/migrations/20260713000002_essence_avatar_memory.sql` with the SQL above.

---

### Step 2: Create `useFigurine` Hook

**Create:** `src/hooks/useFigurine.js`

This hook combines reusable logic from the Figurine branch (`git show Figurine:src/hooks/useEssenceAvatar.js`) with new integrations (hero stage, Zarlo Brief, mentor unlock detection).

```javascript
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── Reuse from Figurine branch ─────────────────────────────────────────

// Copy these functions EXACTLY from git show Figurine:src/hooks/useEssenceAvatar.js:
// - computeIntelligence(data) → returns 0-100
// - getIntelligencePhase(percent) → returns 0-3
// - getGroupStyle(archetype) → returns voice instruction string
// - getReturnMessage(daysSinceLastInteraction) → returns string or null
// - PHASE_NAMES array
// - getNextMilestoneHint(data)

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
- Never use clinical language. Speak as a warm, empowering coach.
- Never shame. Never judge. Never rush.
- Reference specific data from the Brief when relevant.
- If they ask about their patterns, name what you see.
- If they ask about next steps, reference what their hero stage graduation requires.
- Keep responses 2-4 sentences for chat. 1-2 sentences for coaching overlays.
- You are NOT Zarlo. Zarlo is their daily companion. You are their mentor. You speak rarely but with weight.`
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
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullText += parsed.delta.text
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
```

**Key adaptations from branch:**
- Adds `heroStage` and `brief` to the system prompt (branch didn't have these)
- Adds NS-state tone adaptation (branch had it in CSS only, now in prompt too)
- Adds `isMirrorMode` check (branch had `hasSomethingToSay` hardcoded false)
- Adds rate limiting (3/day, 10 messages/conversation)
- Saves conversation summaries to `essence_avatar_memory` (branch stored in React state only)
- Uses existing `agent-chat` Edge Function with `systemPrompt` parameter (no new function needed)

---

### Step 3: Create `FigurineOverlay` Component

**Create:** `src/components/Figurine/FigurineOverlay.jsx`
**Create:** `src/components/Figurine/FigurineOverlay.css`

One-way coaching moment. Appears at stage transitions, stuck moments, return-after-absence.

```jsx
import { useState, useEffect } from 'react'
import './FigurineOverlay.css'

/**
 * FigurineOverlay — one-way coaching moment from the Figurine mentor.
 * Shows avatar image + message. User acknowledges. No conversation.
 * Like Celeste's Theo: appears, says something important, leaves.
 *
 * Props:
 *  - avatarUrl: string (hero avatar image)
 *  - message: string (Figurine's coaching copy)
 *  - emoji: string (stage-specific icon)
 *  - onDismiss: () => void
 *  - autoDismiss: number (ms, default 10000)
 */
export default function FigurineOverlay({ avatarUrl, message, emoji, onDismiss, autoDismiss = 10000 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, autoDismiss)
    return () => clearTimeout(timer)
  }, [autoDismiss, onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div className={`fo-overlay ${visible ? 'fo-visible' : ''}`}>
      <div className="fo-card" onClick={e => e.stopPropagation()}>
        {avatarUrl && (
          <div className="fo-avatar-container">
            <img src={avatarUrl} alt="" className="fo-avatar" />
          </div>
        )}
        {emoji && <span className="fo-emoji">{emoji}</span>}
        <p className="fo-message">{message}</p>
        <button className="fo-dismiss" onClick={handleDismiss}>Continue</button>
      </div>
    </div>
  )
}
```

**CSS (`FigurineOverlay.css`):**

```css
/* FigurineOverlay — one-way coaching moment, .fo- prefix */

.fo-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  opacity: 0;
  transition: opacity 0.3s ease;
  padding: 16px;
}

.fo-overlay.fo-visible {
  opacity: 1;
}

.fo-card {
  background: white;
  border-radius: 24px;
  padding: 32px 24px 24px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  animation: fo-pop 0.3s ease;
}

@keyframes fo-pop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.fo-avatar-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 16px;
  border: 3px solid #E9A23B;
  box-shadow: 0 0 20px rgba(233, 162, 59, 0.2);
}

.fo-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fo-emoji {
  display: block;
  font-size: 32px;
  margin-bottom: 12px;
}

.fo-message {
  font-size: 1rem;
  line-height: 1.6;
  color: #1f2937;
  margin: 0 0 20px;
  font-weight: 500;
}

.fo-dismiss {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #5e17eb, #8b5cf6);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}
```

---

## Phase 2: Chat (Steps 4-5)

### Step 4: Create `FigurineChat` Component

**Create:** `src/components/Figurine/FigurineChat.jsx`
**Create:** `src/components/Figurine/FigurineChat.css`

Full mentoring conversation. Light theme. Adapted from branch's EssenceAvatarPanel pattern but redesigned.

```jsx
import { useState, useRef, useEffect } from 'react'
import './FigurineChat.css'

/**
 * FigurineChat — mentoring conversation with the Figurine.
 * Opens from Journey tab "Talk to your mentor" or Figurine FAB.
 * Light theme. Messages + text input.
 *
 * Props:
 *  - avatarUrl: string
 *  - archetypeName: string
 *  - messages: array of { role, content }
 *  - isStreaming: boolean
 *  - onSend: (text) => void
 *  - onClose: () => void
 *  - canChat: boolean (false if rate limited or mirror mode)
 *  - conversationsRemaining: number
 *  - intelligencePhase: number (0-3)
 *  - phaseName: string
 */
export default function FigurineChat({
  avatarUrl, archetypeName, messages, isStreaming, onSend, onClose,
  canChat, conversationsRemaining, intelligencePhase, phaseName
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isStreaming || !canChat) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="fc-overlay" onClick={onClose}>
      <div className="fc-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="fc-header">
          {avatarUrl && <img src={avatarUrl} alt="" className="fc-header-avatar" />}
          <div className="fc-header-info">
            <span className="fc-header-name">{archetypeName || 'Your Mentor'}</span>
            <span className="fc-header-phase">{phaseName} · {conversationsRemaining} left today</span>
          </div>
          <button className="fc-close" onClick={onClose}>&times;</button>
        </div>

        {/* Messages */}
        <div className="fc-messages">
          {messages.length === 0 && (
            <div className="fc-empty">
              <p>Ask me anything about your journey.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`fc-msg fc-msg-${msg.role}`}>
              {msg.role === 'assistant' && avatarUrl && (
                <img src={avatarUrl} alt="" className="fc-msg-avatar" />
              )}
              <div className="fc-msg-bubble">
                {msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {canChat ? (
          <form className="fc-input-row" onSubmit={handleSubmit}>
            <input
              className="fc-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your mentor..."
              disabled={isStreaming}
            />
            <button className="fc-send" type="submit" disabled={!input.trim() || isStreaming}>
              →
            </button>
          </form>
        ) : (
          <div className="fc-locked">
            {conversationsRemaining <= 0
              ? "You've used all 3 conversations today. Come back tomorrow."
              : "Complete more wahoos and check-ins to unlock mentoring."
            }
          </div>
        )}
      </div>
    </div>
  )
}
```

**CSS (`FigurineChat.css`):** Light theme, `.fc-` prefix. Bottom sheet on mobile (<480px), centered panel on desktop. White background, purple accents. Messages: assistant bubbles left-aligned with small avatar, user bubbles right-aligned purple. Streaming cursor animation on last assistant message. Input row fixed at bottom of panel.

Style details: follow existing ZarloChat patterns but with LIGHT theme (white background, dark text) instead of dark theme.

---

### Step 5: Create Figurine FAB

**Create:** `src/components/Figurine/FigurineFAB.jsx`

The always-visible FAB on bottom-LEFT (mirrors Zarlo's bottom-RIGHT).

```jsx
import { useState } from 'react'
import { useFigurine } from '../../hooks/useFigurine'
import FigurineChat from './FigurineChat'
import './FigurineFAB.css'

export default function FigurineFAB({ activeChat, setActiveChat }) {
  const {
    loading, isUnlocked, isMirrorMode, avatarUrl, profile,
    messages, isStreaming, sendMessage, clearMessages,
    canChat, conversationsRemaining, intelligencePhase, phaseName,
  } = useFigurine()

  if (loading || !isUnlocked) return null

  const isOpen = activeChat === 'figurine'

  const handleToggle = () => {
    if (isOpen) {
      setActiveChat(null)
    } else {
      setActiveChat('figurine')
      if (messages.length === 0 && !isMirrorMode) {
        // Could add a greeting message here
      }
    }
  }

  return (
    <div className="figurine-fab-container">
      {isOpen && !isMirrorMode && (
        <FigurineChat
          avatarUrl={avatarUrl}
          archetypeName={profile?.custom_essence_name || profile?.essence_archetype}
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onClose={() => setActiveChat(null)}
          canChat={canChat}
          conversationsRemaining={conversationsRemaining}
          intelligencePhase={intelligencePhase}
          phaseName={phaseName}
        />
      )}

      <button
        className={`figurine-fab ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close Mentor' : 'Talk to Mentor'}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="figurine-fab-img" />
        ) : (
          <span className="figurine-fab-icon">🪞</span>
        )}
      </button>
    </div>
  )
}
```

**CSS (`FigurineFAB.css`):**
```css
.figurine-fab-container {
  position: fixed;
  bottom: 80px;
  left: 20px;
  z-index: 1000;
}

.figurine-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #E9A23B;
  background: white;
  box-shadow: 0 4px 16px rgba(233, 162, 59, 0.2);
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.figurine-fab:active { transform: scale(0.95); }

.figurine-fab-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.figurine-fab-icon {
  font-size: 24px;
}
```

---

## Phase 3: Integration (Steps 6-8)

### Step 6: Wire into Challenge.jsx

**Modify:** `src/Challenge.jsx`

Add shared `activeChat` state and render both FABs:

```javascript
import FigurineFAB from './components/Figurine/FigurineFAB'

// Inside Challenge function:
const [activeChat, setActiveChat] = useState(null)

// Pass activeChat to Zarlo widget (needs ZarloWidget modified to accept these props):
// When Zarlo opens: setActiveChat('zarlo')
// When Zarlo closes: setActiveChat(null)
// Zarlo should close if activeChat !== 'zarlo' && activeChat !== null

// Render FigurineFAB:
<FigurineFAB activeChat={activeChat} setActiveChat={setActiveChat} />
```

**Modify:** `src/components/Zarlo/ZarloWidget.jsx`

Accept `activeChat` and `setActiveChat` props. When user opens Zarlo, call `setActiveChat('zarlo')`. When user closes, call `setActiveChat(null)`. If `activeChat` changes to something other than 'zarlo', auto-close Zarlo chat.

---

### Step 7: Journey Tab Figurine Presence

**Modify:** `src/components/JourneyTab.jsx`

Add below the stage card, above voice dots:

```jsx
import { useFigurine } from '../hooks/useFigurine'

// Inside component:
const { isUnlocked, isMirrorMode, avatarUrl, profile, phaseName, canChat } = useFigurine()

// In JSX, after stage card:
{isUnlocked && (
  <div className="jt-section jt-figurine-presence">
    {avatarUrl && <img src={avatarUrl} alt="" className="jt-figurine-avatar" />}
    <div className="jt-figurine-info">
      <span className="jt-figurine-name">{profile?.custom_essence_name || profile?.essence_archetype || 'Your Mentor'}</span>
      <span className="jt-figurine-phase">{phaseName}</span>
    </div>
    {!isMirrorMode && canChat && (
      <button className="jt-figurine-chat-btn" onClick={() => setActiveChat('figurine')}>
        Talk to your mentor
      </button>
    )}
    {isMirrorMode && (
      <p className="jt-figurine-mirror-msg">Your mentor is still learning about you.</p>
    )}
  </div>
)}
```

Add CSS to `JourneyTab.css` with `.jt-figurine-*` classes.

---

### Step 8: Wire Graduations to FigurineOverlay

**Modify:** `src/hooks/useCelebrations.js`

In `celebrateStageGraduation`, for users who have unlocked the Figurine (Stage 4+), use FigurineOverlay instead of LevelUpModal. For pre-Stage-4 users, keep LevelUpModal.

This requires passing `avatarUrl` into the celebration. The graduation check in Challenge.jsx already has `stageData` which contains `hero_avatar_url`. Pass it through:

```javascript
// In Challenge.jsx graduation check:
if (graduation) {
  celebrateStageGraduation(graduation.from, graduation.to, {
    essenceName: graduation.stageData?.essence_name,
    voiceName: graduation.dominantVoice,
    avatarUrl: graduation.stageData?.hero_avatar_url, // NEW
    useFigurineOverlay: graduation.to >= 4, // NEW
  })
}
```

In `useCelebrations`, when `useFigurineOverlay` is true, set a different state that renders `FigurineOverlay` instead of `LevelUpModal`.

---

## Phase 4: Polish (Steps 9-10)

### Step 9: Mirror → Mentor Transition Moment

When the user crosses the 4a→4b threshold (3+ wahoos AND 7+ check-ins), the Figurine should deliver a special coaching overlay:

Message: "I've been watching. I know your patterns now. From here, I'm not just showing you who you are. I'm showing you who you become. You can talk to me whenever you need."

This fires once (localStorage guard). After this moment, the chat becomes available and the Journey tab shows "Talk to your mentor."

### Step 10: Cryptic Hooks (Monthly)

Add a monthly proactive message from the Figurine. Not Zarlo-style pattern observations. Figurine-style open loops:

- "There's something connecting your paths. You're not ready to see it yet."
- "The voice you keep fighting? It's trying to protect something real."
- "What if the thing you're avoiding is the thing you're meant to do?"

Check: `localStorage.getItem('figurine_cryptic_' + month)`. One per month. Delivered via FigurineOverlay.

---

## Testing Checklist

### Phase 1
- [ ] `essence_avatar_memory` table exists
- [ ] `useFigurine` hook loads data without errors
- [ ] FigurineOverlay renders with avatar + message + dismiss

### Phase 2
- [ ] FigurineChat renders messages with streaming
- [ ] Rate limiting works (3/day, 10 messages)
- [ ] Conversation summaries saved to memory table
- [ ] FigurineFAB appears bottom-LEFT when user is Stage 4+
- [ ] FigurineFAB hidden for pre-Stage-4 users

### Phase 3
- [ ] Opening Figurine closes Zarlo (and vice versa)
- [ ] Journey tab shows Figurine presence below stage card
- [ ] "Talk to your mentor" opens chat (mentor mode only)
- [ ] Mirror mode shows "still learning" message
- [ ] Graduation overlay uses FigurineOverlay for Stage 4+ users

### Phase 4
- [ ] Mirror→Mentor transition moment fires once
- [ ] Monthly cryptic hook appears via FigurineOverlay
- [ ] All localStorage guards prevent repeat messages

---

*Depends on: All sprints shipped. Figurine branch code available via git show.*
*Build estimate: 10-12 days across 4 phases.*
