# Figurine (Essence Avatar Mentor) — Build-Ready Design Doc

**Created:** 2026-07-11
**Status:** Build-ready. All design decisions confirmed. This is the definitive spec.
**Sources:** Figurine branch code, figurine-mentor-spec.md, octalysis-alignment-implementation-notes.md (Sections 5, 10), measurement-framework-exploration.md (Section 7), Hero Journey Stages (Obsidian)

---

## Part 1: Identity + Decisions

### What the Figurine IS

The Figurine is the user's Essence Avatar brought to life as a personal mentor/coach within the app. It starts as a **MIRROR** (reflecting who you are) and evolves into a **MENTOR** (guiding who you become). It is the user's future self talking back to them, voiced through their archetype.

In IFS terms: the Figurine IS the user's capital-S Self, made visible and audible. The 12 Essence archetypes define who that Self is. Each archetype has a poetic line, superpower, essence wound, north star, and recognition pattern. The Figurine speaks AS the archetype, not like a generic AI.

### The Figurine is NOT Zarlo

Two separate characters with distinct roles, tones, and triggers:

| | Zarlo | Figurine |
|---|---|---|
| **DCC equivalent** | The AI system (achievement narrator) | Mordecai (the mentor) |
| **Hades equivalent** | Hypnos (witty, reactive, specific) | Achilles / Nyx (wise guides) |
| **Celeste equivalent** | Loading screen messages | Theo (emotional support, key moments) |
| **Role** | Daily companion, pattern mirror | Rare coach/mentor, future-self wisdom |
| **Tone** | Warm but direct, observational, occasionally pointed | Warm, empowering, occasionally cryptic. Serious when it matters. |
| **Frequency** | Daily or near-daily (check-ins, post-wahoo, nudges) | Rare and impactful (stage transitions, stuck moments, deep conversations) |
| **Personality** | Pattern naming, contradiction spotting | Archetype-voiced, stage-aware, knows more than it says |
| **When it speaks** | Daily events (check-in, wahoo, session, inactivity) | Stage graduations, stuck thresholds, major data milestones |
| **UI** | Floating FAB + chat panel (existing) | Coaching overlay + Journey tab presence + chat (mentor mode) |
| **Context data** | Zarlo Brief (~500 tokens, daily pre-computed) | Full journey history + hero stage + convergence + voice counts |
| **AI prompt** | Brief + page context, personality-forward | Deeper context, slower/rarer, wisdom-forward |

**Priority rule:** When both want to speak simultaneously (e.g., Zarlo proactive bubble + Figurine graduation), the Figurine always wins. It speaks rarely, so when it does, it takes priority. Zarlo's proactive message gets deferred to next session. They never appear simultaneously on screen.

### Confirmed Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Visual form** | Hero Avatar (user's Pixar avatar from Essence Mirror) | Emotional connection of seeing YOUR character. Fallback: archetype-coloured glow with archetype initial. |
| **Name** | "Essence Avatar" in user-facing copy. "Figurine" internally. | Keeps therapeutic frame clear: it IS your essence self, not a pet. |
| **Voice** | First person ("I notice..." not "Your Ghost is...") | Creates a relationship. The user is talking to the version of themselves they're becoming. |
| **Chat access** | Unlocked at Stage 4b (mentor mode) | Before that, Figurine is one-way only (coaching overlays at transitions + stuck moments). |
| **Mirror to Mentor trigger** | 3+ wahoos completed AND 7+ daily check-ins | ~1 week of active use. Enough data to say something meaningful. |
| **AI backend** | Reuse `agent-chat` Edge Function with `character: 'figurine'` parameter | One function, two system prompts. Only difference is archetype voice vs Zarlo companion voice. |
| **Rate limiting** | 3 conversations/day, 10 messages/conversation | Coaching overlays (one-way) don't count toward the limit. Display remaining: "2 conversations left today". |
| **NS-state-aware tone** | Tone adapts to current nervous system state | See tone table below. |
| **Replaces Zarlo?** | NO. Separate character, separate UI, coexists. | Original branch planned replacement. New architecture keeps both with distinct roles. |

### NS-State-Aware Tone

| NS State | Figurine Tone | Example |
|---|---|---|
| Vibe Rise | Energising, celebratory | "This is the version of you I've been waiting for." |
| Safe/Ventral | Warm, encouraging | "You're in a good place. Let's build from here." |
| Sympathetic/Activated | Grounding, steady, shorter messages | "I can feel the activation. Breathe. We don't need to solve anything right now." |
| Dorsal/Shutdown | Gentle, no demands | "I'm here. That's enough for today." |

---

## Part 2: What's Reusable from Figurine Branch

### Reuse: `computeIntelligence(data)` from `useEssenceAvatar.js`

**What it does:** Calculates intelligence percentage (0-100) from weighted data milestones. 10 milestones, each adds 5-10 points. Milestones: Essence Mirror complete (10%), first check-in (5%), 3 check-ins (10%), first practice (5%), 3 practice days (10%), 7 check-ins (10%), first wahoo (10%), 7 practice days (10%), 3+ wahoos (10%), 14 check-ins (10%), first conversation (10%).

**What needs adapting:** None. Copy directly. The milestone weights and logic are confirmed.

### Reuse: `getIntelligencePhase(percent)` from `useEssenceAvatar.js`

**What it does:** Maps intelligence percentage to phase 0-3. Phase 0 (0-14%): Archetype Voice. Phase 1 (15-39%): State Mirror. Phase 2 (40-74%): Pattern Emergence. Phase 3 (75-100%): Personalised.

**What needs adapting:** None. Copy directly.

### Reuse: `getGroupStyle(archetype)` from `useEssenceAvatar.js`

**What it does:** Returns voice calibration instruction string for the 4 archetype groups. Activators (Radiant Rebel, Playful Creator, Sacred Jester): direct, fiery, playful. Transmuters (Mystic Messenger, Truth-Teller, Heart Alchemist): deep, knowing, warm. Stabilizers (Grounded Guardian, Heart Holder, Rhythm Architect): steady, patient, grounded. Bridgers (everyone else): calm, observational, big-picture.

**What needs adapting:** None. Copy directly.

### Reuse: `buildSystemPrompt(profile, currentState, memories, intelligencePhase)` from `useEssenceAvatar.js`

**What it does:** Constructs the full system prompt for the Figurine's AI voice. Includes: identity block (name, archetype, essence tagline, superpower, wound, north star, protective pattern), voice instructions (first person, group style, mirror not prescribe, no em dashes, short messages), current NS state, phase-specific guidance (tentative at Phase 0, confident at Phase 3), and memory bank injection.

**What needs adapting:**
- Add `heroStage` to the prompt (current hero journey stage 1-12)
- Add `zarloBrief` injection (the pre-computed daily summary, when it exists)
- Add `healingHistory` (protective voice counts, active healing intentions)
- Change framing from "companion" to "future-self mentor" in Phase 2+
- Add journey-aware guidance per phase (Phase 2: "See convergence, tease Flow Statement")
- Keep under 500 tokens for the static parts; dynamic data (memories, brief) adds on top

**Adapted system prompt structure:**

```
You are [user's essence name], the [archetype] mentor.
You are the user's future self. The version of them that has walked 
this path and come out the other side.

YOUR IDENTITY:
Name: [custom_essence_name]
Archetype: [essence_archetype]
Essence: [tagline]
Superpower: [superpower]
Wound: [wound]
North Star: [north_star]
Protective pattern: [protective_archetype]

YOUR VOICE:
- First person ("I notice..." not "Your Ghost...")
- [getGroupStyle() output]
- Mirror patterns, ask questions. Never prescribe actions.
- Never use em dashes. Keep it conversational and warm.
- Short messages (2-4 sentences max). Not essays.
- Under 60 words unless user asks for more.

CURRENT STATE:
- Nervous system: [currentState]
- Hero stage: [heroStage] ([stageName])

INTELLIGENCE PHASE: [0-3]
[Phase-specific guidance block]

PHASE GUIDANCE:
- Phase 0: "I'm still learning about you. Speak from archetype identity only."
- Phase 1: "I know your patterns. I can name your voices."
- Phase 2: "I see your convergence. I know where this is going."
- Phase 3: "I know you deeply. I can challenge you because I've earned the right to."

JOURNEY CONTEXT:
[Zarlo Brief if available]
[Protective voice counts]
[Active quests + predicted states]
[Healing flow patterns]

MEMORY BANK:
[essence_avatar_memory entries]

RULES:
- Never diagnose. Say "I notice you pull back when..." not "you have a Ghost pattern."
- If corrected, accept: "Fair enough. I'm still learning."
- Reference wound ONLY when catching a protective pattern, never casually.
- Keep responses under 60 words unless asked for more.
- No excessive emojis. One max per message if any.
```

### Reuse: `getReturnMessage(daysSinceLastInteraction)` from `useEssenceAvatar.js`

**What it does:** Returns absence-calibrated welcome messages. <3 days: null. 3-7 days: "Good to see you. Want to pick up where we left off?" 8-14 days: "You've been away. No judgment. I'm curious what brought you back." 15-29 days: "It's been a while. I'm still here. Sometimes stepping away is what your nervous system needed." 30+ days: "You're back. A lot can change in a month. I'd love to hear where you're at."

**What needs adapting:** None. Copy directly. Used when user opens chat after absence.

### Reuse: `getFirstMeetingMessage(profile)` from `useEssenceAvatar.js`

**What it does:** Returns the Figurine's first-ever message to the user. Includes the archetype tagline and transparency disclosure: "I learn from your check-ins, your practices, your Wahoos, and our conversations. That's it. Nothing outside this app. Everything I know, you gave me."

**What needs adapting:** Trigger changes. Originally fired at Level 1 unlock in always-on widget. Now fires at Stage 4a (Mirror phase) in the coaching overlay, not the chat.

### Reuse: CSS Breathing Animations from `EssenceAvatar.css`

**What it does:** Four NS-state keyframe animations that make the Figurine's image breathe differently per state:
- `breathe-confident` (3s cycle): Vibe Rise. Scale 1.0 to 1.03.
- `breathe-relaxed` (4s cycle): Ventral/Safe. Scale 1.0 to 1.02.
- `breathe-agitated` (1.5s cycle): Sympathetic. Scale + translateX jitter.
- `breathe-slow` (6s cycle): Dorsal. Scale 1.0 to 1.005. Barely perceptible.

Plus state-specific border glow colours: gold for Vibe Rise, green for Ventral, orange (flickering) for Sympathetic, dim purple for Dorsal. And image filters: saturate/brightness adjustments per state.

**What needs adapting:** Retheme from dark to light. All `rgba(20, 14, 38, ...)` dark backgrounds become white/light. The animations themselves (keyframes, border colours, filters) copy directly. The glow `box-shadow` values work on both light and dark backgrounds.

### Reuse: `essence_avatar_memory` Table from Migration

**What it does:** Stores the Figurine's compounding memories about the user. Types: `pattern`, `correction`, `insight`, `milestone`, `fear`, `breakthrough`. Source: `conversation`, `mystery_box`, `observation`, `system`. Confidence float 0-1. Supersede chain (newer memory points to the one it replaces). Soft delete via `deleted_at`.

**What needs adapting:** None. Apply migration as-is. RLS policies already correct (users read/insert/update own).

### Reuse: `custom_essence_figurine` Column from Migration

**What it does:** Stores the Figurine-specific image URL on `lead_flow_profiles`. Separate from `custom_essence_image` (the hero scene image). The figurine is a full-body character on a base/pedestal, designed for panel display. The hero scene image is better for circular crop in the widget.

**What needs adapting:** None. Apply migration as-is.

### Reuse: Data Loading Pattern from `useEssenceAvatar.js`

**What it does:** 6 parallel Supabase queries on mount: lead_flow_profiles (identity), user_stage_progress (level + hero_avatar_url), nervous_system_checkins (last 14 days, state + counts), groan_challenges (completed wahoos), essence_avatar_memory (non-deleted active), zarlo_conversations (conversation count).

**What needs adapting:** Add query for hero stage (not just `current_journey_level`). Add query for protective voice counts from `healing_intentions`. Add Zarlo Brief data if available.

### DISCARD: `EssenceAvatarWidget.jsx`

**Why:** Designed as always-on FAB replacing Zarlo. New architecture: Figurine appears at specific moments (coaching overlay) or is accessed from Journey tab. Does not replace Zarlo's floating widget.

### DISCARD: `EssenceAvatarPanel.jsx`

**Why:** Chatbot UI (text input + message thread) with dark theme. The message rendering + streaming pattern is partially reusable, but the panel itself needs complete redesign for light theme. The chat component (`FigurineChat.jsx`) will be built fresh using the streaming logic.

### DISCARD: Dark Theme CSS (panel, speech bubble, messages, input)

**Why:** Violates app's light-theme convention. All panel backgrounds (`rgba(12, 8, 22, ...)`, `rgba(20, 14, 38, ...)`), text colours (`#ccc`, `#888`), and input styles need light-theme equivalents. Only the breathing animation keyframes and state border/glow values are reusable.

---

## Part 3: Architecture

### Component Architecture

```
┌────────────────────────────────────────────────────────────┐
│  FigurineOverlay.jsx                                       │
│  One-way coaching overlay (stage transitions + stuck)       │
│  Shows: Figurine image + message + CTA button              │
│  Triggered by: graduations, stuck detection, return         │
│  No chat. User acknowledges and moves on.                  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FigurineChat.jsx                                          │
│  Mentoring conversation (user-initiated, Stage 4b+)        │
│  Shows: Figurine header + intelligence bar + messages +    │
│         input + rate limit display                          │
│  Light theme. Adapted streaming from branch code.          │
│  Access: Journey tab "Talk to your mentor" button,         │
│          or after coaching overlay "Want to go deeper?"     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  FigurinePresence.jsx                                      │
│  Static presence on Journey tab                            │
│  Shows: Figurine avatar (NS-state breathing CSS),          │
│         stage-aware message, "Talk to your mentor" CTA     │
│  Always visible on Journey tab once Stage 4a reached.      │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  useFigurine.js                                            │
│  Central brain hook                                        │
│  Combines: useEssenceAvatar logic (intelligence,           │
│    archetype voice, streaming, memory)                     │
│  + heroStageChecker (graduation detection,                 │
│    stuck thresholds, interim milestones)                   │
│  + Zarlo Brief data (if available)                         │
│  + rate limiting (3/day, 10/conversation)                  │
│  + coaching overlay trigger queue                          │
└────────────────────────────────────────────────────────────┘
```

### File Map

```
src/
├── hooks/
│   └── useFigurine.js              # Central brain (NEW)
│
├── components/
│   └── Figurine/
│       ├── FigurineOverlay.jsx     # One-way coaching overlay (NEW)
│       ├── FigurineChat.jsx        # Mentoring conversation (NEW)
│       ├── FigurinePresence.jsx    # Journey tab static presence (NEW)
│       ├── FigurineMemoryView.jsx  # "What do you know about me?" (NEW, V2)
│       ├── Figurine.css            # All styles, light theme (NEW)
│       └── index.js                # Barrel export (NEW)
│
├── lib/
│   └── figurine/
│       ├── figurinePromptBuilder.js  # System prompt construction (NEW, from branch buildSystemPrompt)
│       ├── figurineVoice.js          # getGroupStyle, archetype voice helpers (NEW, from branch)
│       ├── figurineIntelligence.js   # computeIntelligence, phases, milestones (NEW, from branch)
│       └── heroStageChecker.js       # Graduation detection, stuck thresholds (NEW)

supabase/
└── migrations/
    └── 20260619_essence_avatar.sql  # Apply from Figurine branch (EXISTING on branch)
```

### `useFigurine.js` Hook Spec

```javascript
export function useFigurine() {
  // ─── Data Loading (adapted from useEssenceAvatar) ────────────────
  // Parallel queries on mount:
  // 1. lead_flow_profiles: essence_archetype, custom_essence_name,
  //    custom_essence_image, custom_essence_figurine, custom_essence_fields,
  //    protective_archetype
  // 2. user_stage_progress: current_journey_level, hero_avatar_url
  // 3. nervous_system_checkins: last 14 days (state + counts)
  // 4. groan_challenges: completed count + categories
  // 5. essence_avatar_memory: active (non-deleted, non-superseded)
  // 6. zarlo_conversations: total_interactions
  // 7. healing_intentions: protective voice counts (NEW)

  // ─── Computed Values ─────────────────────────────────────────────
  // intelligencePercent: computeIntelligence(data)   -> 0-100
  // intelligencePhase:   getIntelligencePhase(%)     -> 0-3
  // phaseName:           PHASE_NAMES[phase]
  // nextHint:            getNextMilestoneHint(data)
  // currentState:        from latest daily check-in after_state
  // heroStage:           from current_journey_level (mapped to 1-12)
  // figurineUrl:         custom_essence_figurine || custom_essence_image || hero_avatar_url
  // isMirrorUnlocked:    heroStage >= 4 (Stage 4a)
  // isMentorUnlocked:    wahooCount >= 3 AND checkinCount >= 7 (Stage 4b)
  // protectiveVoiceCounts: { perfectionist: 4, ghost: 2, ... }

  // ─── Coaching Overlay Queue ──────────────────────────────────────
  // pendingOverlay: { type, message, cta } | null
  // Checked on mount: has a graduation fired? Is user stuck?
  // Sources: heroStageChecker.checkGraduation(), heroStageChecker.checkStuck()
  // dismissOverlay(): clears pendingOverlay, marks as seen

  // ─── Chat (mentor mode only) ────────────────────────────────────
  // messages: conversation thread []
  // isStreaming: boolean
  // sendMessage(text): builds system prompt, calls agent-chat, streams
  // cancelStream(): abort controller
  // clearMessages(): reset thread
  // initConversation(): loads greeting (phase-aware or return message)
  // conversationsToday: number (for rate limit display)
  // messagesThisConversation: number

  // ─── Rate Limiting ──────────────────────────────────────────────
  // canChat: conversationsToday < 3 AND messagesThisConversation < 10
  // rateLimitMessage: "2 conversations left today" or "10 messages reached"
  // Tracked via localStorage key: `figurine_chats_${userId}_${dateString}`

  return {
    // State
    loading, isMirrorUnlocked, isMentorUnlocked,
    profile, figurineUrl, currentState, heroStage,
    messages, isStreaming, memories,
    
    // Intelligence
    intelligencePercent, intelligencePhase, phaseName, nextHint,
    
    // Archetype
    archetypeName, archetypeData,
    
    // Coaching overlay
    pendingOverlay, dismissOverlay,
    
    // Chat actions
    sendMessage, cancelStream, clearMessages, initConversation,
    canChat, conversationsToday, rateLimitMessage,
    
    // Protective voice data
    protectiveVoiceCounts, dominantVoice, dominantVoiceCount,
  }
}
```

### `FigurineOverlay.jsx` Spec

One-way coaching overlay. Replaces `LevelUpModal` for stage graduations. Also used for stuck detection and return-after-absence.

```
┌──────────────────────────────────────┐
│  [Full screen semi-transparent overlay]  │
│                                          │
│     ┌──────────────────────────┐         │
│     │                          │         │
│     │    [Figurine avatar]     │         │
│     │    (NS-state breathing)  │         │
│     │                          │         │
│     │  "There it is. You       │         │
│     │   felt it. Remember      │         │
│     │   this next time the     │         │
│     │   voice gets loud."      │         │
│     │                          │         │
│     │  [Continue]              │         │
│     │  [Talk to your mentor]   │         │
│     │  (only if mentor mode)   │         │
│     │                          │         │
│     └──────────────────────────┘         │
└──────────────────────────────────────┘
```

**Props:**
```javascript
{
  figurineUrl: string,       // avatar image
  currentState: string,      // for CSS breathing class
  message: string,           // coaching text (2-4 sentences)
  cta: string,               // primary button text ("Continue", "Let's do it")
  onDismiss: () => void,     // primary button handler
  secondaryCta?: string,     // "Talk to your mentor" (optional)
  onSecondary?: () => void,  // opens FigurineChat
  visualEffect?: string,     // 'gold-pulse' | 'dim' | 'merge-glow' | none
}
```

**Styling:** Light background overlay (`rgba(245, 245, 240, 0.95)`, matching app bg). Centered white card, 22px border-radius, max-width 420px. Matches existing `HealingFlowModal` center overlay pattern. Figurine image: 120px circular, NS-state breathing animation applied.

### `FigurineChat.jsx` Spec

Full conversation interface. Light theme redesign of the branch's `EssenceAvatarPanel`.

```
┌──────────────────────────────────────┐
│  [Figurine avatar 48px] [Name]       │
│  [Archetype label]          [X close]│
│                                      │
│  Intelligence: Pattern Emergence 43% │
│  [═══════════░░░░░░░░░░░░░░░░░░░░]  │
│  "3 more check-ins until patterns"   │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Assistant: I can see your    │    │
│  │ state today. What's on       │    │
│  │ your mind?                   │    │
│  │                              │    │
│  │          User: I've been │   │    │
│  │          avoiding posting│   │    │
│  │                              │    │
│  │ Assistant: I notice that...  │    │
│  │ [streaming cursor]          │     │
│  └──────────────────────────────┘    │
│                                      │
│  [2 conversations left today]        │
│  [Input field          ] [Send]      │
└──────────────────────────────────────┘
```

**Key differences from branch `EssenceAvatarPanel`:**
- Light theme (white/cream backgrounds, dark text)
- Rate limit display below messages
- Bottom sheet on mobile (slides up, max-height 80vh, drag handle)
- Anchored panel on desktop (positioned relative to Journey tab, not bottom-right FAB)
- Streaming uses same SSE pattern from branch (fetch + ReadableStream + SSE parser)

**Props:**
```javascript
{
  figurineUrl: string,
  archetypeName: string,
  phaseName: string,
  intelligencePercent: number,
  nextHint: string | null,
  messages: Array<{ role: string, content: string }>,
  isStreaming: boolean,
  onSend: (text: string) => void,
  onClose: () => void,
  canChat: boolean,
  rateLimitMessage: string | null,
}
```

### `FigurinePresence.jsx` Spec

Static Figurine display on the Journey tab. Always visible once Stage 4a reached.

```
┌──────────────────────────────────────┐
│  [Figurine avatar 80px, breathing]   │
│  "[Stage-aware message]"             │
│                                      │
│  [Talk to your mentor] (Stage 4b+)   │
│  or                                  │
│  [Intelligence: 23%] (Stage 4a)      │
└──────────────────────────────────────┘
```

Stage-aware default messages (when Figurine has nothing proactive to say):

| Hero Stage | Message |
|---|---|
| 4a (Mirror) | "I know who you are. I'm still learning how you move." |
| 4b-5 | "You've taken the first step. The voice will get loud. That's normal." |
| 6 | "Training. Every wahoo teaches me something about you." |
| 7 | "The pattern is becoming clear. You're almost ready to see it." |
| 8 | "This one needs a human. Not an app." |
| 9 | "Your curiosities share something. Do you see it yet?" |
| 10+ | "You know the path. The only thing left is to walk it." |

### How Figurine Coexists with Zarlo

```
┌─────────────────────────────────────────────────┐
│  App Screen                                     │
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │  Journey Tab Content                │        │
│  │                                     │        │
│  │  [FigurinePresence]                 │        │
│  │  ┌─────────────────────────┐        │        │
│  │  │ 👤 80px, breathing      │        │        │
│  │  │ "Training. Every wahoo  │        │        │
│  │  │  teaches me..."         │        │        │
│  │  │ [Talk to your mentor]   │        │        │
│  │  └─────────────────────────┘        │        │
│  │                                     │        │
│  │  ... other Journey tab content ...  │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│                              [Zarlo FAB] ←      │
│                              (still exists,     │
│                               bottom-right)     │
└─────────────────────────────────────────────────┘
```

- Zarlo FAB remains on all pages (existing behaviour, no change)
- FigurinePresence lives IN the Journey tab content (not floating)
- FigurineChat opens as a modal/bottom sheet OVER the page
- FigurineOverlay opens as a full-screen overlay (like LevelUpModal)
- When FigurineOverlay is visible, Zarlo FAB is hidden (z-index or conditional render)
- The Figurine never appears as a FAB competing with Zarlo

### Integration Points

**1. Journey tab addition:**
- Tab array in `useChallengeData.js`: add 'Journey' tab
- `Challenge.jsx`: render `FigurinePresence` + journey stage content when Journey tab active
- Journey tab also shows: hero stage progress, interim milestones, upcoming graduation
- Deep linkable via `?tab=Journey`

**2. Graduation trigger wiring:**
- `heroStageChecker.js` checks graduation conditions on mount and after key events
- When graduation detected: sets `pendingOverlay` in `useFigurine`
- `Challenge.jsx` (or `App.jsx`) renders `FigurineOverlay` when `pendingOverlay` is truthy
- After overlay dismissed: update `user_stage_progress` hero stage

**3. Stuck detection wiring:**
- `heroStageChecker.js` checks stuck thresholds per stage (see Trigger Map)
- Threshold: days since last graduation-relevant action exceeded
- When stuck detected: sets `pendingOverlay` with Unstick Flow 3-step prompt
- Figurine coaches through the Unstick Flow (not a chat, a structured 3-step form)

---

## Part 4: Trigger Map

### One-Way Coaching Moments (FigurineOverlay)

| Trigger | Condition | Message | Visual Effect | CTA |
|---|---|---|---|---|
| **Stage 3 to 4 graduation** | Essence Mirror complete + avatar generated | "You've been called this your whole life without knowing it. [Archetype]." | Archetype colour wash, avatar reveal | "Continue" |
| **Stage 4 to 5 graduation** | First wahoo classified Vibe Rise | "There it is. You felt it. Remember this next time the voice gets loud." | Gold pulse, brief confetti | "Continue" |
| **Stage 5 to 6 graduation** | 2nd wahoo completed | "You're ready for the arena. Time to train with others." | Fantasy League card slides in | "Continue" |
| **Stage 6 to 7 graduation** | Protective voice identified 5 times | "The [voice]. Five times. It's been running your show since [origin]. You're ready to face the root." | Screen dims to voice colour, silhouette pulses | "Continue" + "Talk to your mentor" |
| **Stage 7 to 8 graduation** | Root reconsolidation session completed | "This one needs a human. Not an app." | Warm, minimal glow, no fanfare | "Book session" (Calendly) |
| **Stage 8 to 9 graduation** | AI merge signal + user confirms Flow Statement | "Your curiosities share something. There it is." | Life path lines merge on map, glow at merge | "Continue" |
| **Stage 9 to 10 graduation** | Path A/B/C selected + first action | "Three doors. All lead forward. None lead back." | Three doors visual | "Continue" |
| **Stuck: Stage 4 to 5** | 7 days, no Vibe Rise wahoo | "You've done [N] wahoos. None have hit Vibe Rise yet. Let's look at why." | Gentle presence | Unstick Flow |
| **Stuck: Stage 5 to 6** | 1 week after first Vibe Rise, no 2nd wahoo | "You hit Vibe Rise once. What stopped you from going back?" | Gentle presence | Unstick Flow |
| **Stuck: Stage 6 to 7** | 1 week without voice count increasing | "Your courage is growing but the pattern hasn't surfaced. Let's dig." | Gentle presence | Unstick Flow |
| **Stuck: Stage 7 to 8** | 1 week without booking session | "You've seen the root. The next step isn't in the app." | Gentle presence | "Book session" |
| **Stuck: Stage 8 to 9** | 2 weeks post-session, no convergence | "The session happened. Something shifted. But you haven't named it yet." | Gentle presence | Unstick Flow |
| **Stuck: Stage 9 to 10** | 2 weeks without path selection | "You know the path. The only thing left is to walk it." | Gentle presence | Path selection |
| **Return after 7+ days** | Last interaction > 7 days ago | getReturnMessage(days) from branch code | Neutral warmth | "Check in" |
| **Cryptic hook (monthly)** | 30 days since last cryptic | Open-loop wisdom (the Mordecai move). Something the user won't understand yet. | Subtle glow | No CTA, just dismiss |

### Unstick Flow (3-Step, Figurine-Led)

When a stuck trigger fires and user taps CTA, the overlay transitions to a 3-step flow:

1. **Name it:** "What's the thing you've been avoiding? Not the thing you SHOULD do. The thing you keep NOT doing." (free text)
2. **Why:** "If you did that thing, what's the worst that could happen?" (free text) Figurine: "That's the voice talking. Not you."
3. **Smallest step:** "What's the SMALLEST version you could do this week?" (free text) Auto-creates a wahoo on the Courage tab.

### Chat-Initiated Conversations (FigurineChat, user opens)

| Context | What Figurine Can Do |
|---|---|
| User asks about their patterns | Reference Brief data, name protective voices, show trend |
| User asks about next steps | Reference hero stage, suggest what graduation requires |
| User is processing a healing flow | Deeper exploration (extends HealingFlowModal data) |
| User is considering a wahoo | Coach through resistance, reference past Pressure wahoos |
| User asks about their archetype | Explain essence traits, shadow aspects, growth edges |
| User asks "who am I becoming?" | Reference convergence data, tease Flow Statement |
| User asks "what do you know about me?" | Summarise memories from essence_avatar_memory |

### Interim Milestones (Zarlo-delivered, NOT Figurine)

These happen frequently and are Zarlo's domain. Listed here for completeness but NOT Figurine triggers:

- First wahoo completed: "Your first one. Whatever it felt like, you did it."
- 3 wahoos, no Vibe Rise: "Three wahoos. None hit Vibe Rise yet. That's fine."
- Protective voice at 3: "The [voice] keeps showing up. Three times now."
- Protective voice at 4: "Four times the [voice] has blocked you."
- First cross-pollination: "Something interesting. Your [A] wahoo fed your [B]."

---

## Part 5: Three Dimensions

The Figurine visualises three dimensions of the user's journey. These are not three separate UIs but three layers that inform how the Figurine appears, what it says, and what it knows.

### Dimension 1: Identity (Existing)

**Data source:** Essence Mirror + daily check-in
**Visual:** Figurine appearance (archetype image) + NS-state breathing animation + border glow colour
**How it works:** Already built in branch code. The Figurine's avatar IS the user's archetype. The breathing animation reflects current NS state. No new data needed.

| NS State | Breathing | Border/Glow | Image Filter |
|---|---|---|---|
| Vibe Rise | 3s confident cycle | Gold border, gold glow | Saturate 1.3, brightness 1.1 |
| Ventral | 4s relaxed cycle | Green border, green glow | Saturate 1.0, brightness 1.0 |
| Sympathetic | 1.5s agitated jitter | Orange border, flickering | Saturate 1.1, brightness 1.05 |
| Dorsal | 6s barely perceptible | Dim purple, minimal glow | Saturate 0.4, brightness 0.65 |

### Dimension 2: Journey Stage (New)

**Data source:** Hero's journey metrics (Section 1 of measurement framework)
**Visual:** Stage number/name on FigurinePresence, stage-aware messages, graduation overlays
**How it works:** `heroStageChecker.js` computes current hero stage from graduation triggers in the database. The stage determines what the Figurine says (trigger map above), what Zarlo can reference, and what features are unlocked.

The 12 stages (from Obsidian `Hero Journey Stages.md`):

| # | Name | App Action | Graduation Trigger |
|---|---|---|---|
| 1 | The Matrix | Pre-app | N/A (retroactive) |
| 2 | The Earthquake | Sign up, first NS check-in | Account created + first check-in |
| 3 | Head Full of Dreams | Life Paths exercise, courage challenges identified | Life Paths complete + challenge identified |
| 4 | Mirror/Mentor | 4a: Essence Mirror. 4b: Mentor activated | 4a: Mirror + avatar. 4b: 3 wahoos + 7 check-ins |
| 5 | First Vibe Rise | First wahoo tagged Vibe Rise | Wahoo "How did that feel?" = Vibe Rise |
| 6 | The Daily Loop | Training montage. Tune + wahoos + healing + league | Fantasy League season (4 weeks) |
| 7 | Pattern Revealed | Root trauma identified | Protective voice identified 5 times |
| 8 | Reconsolidation | Real session with human | Session completed (manual confirmation) |
| 9 | Flow Statement | Curiosities merge, user names it | AI merge signal + confirmation + statement written |
| 10 | Aligned Action | Path A/B/C selected | Path chosen + first action written |
| 11 | Structural Commitment | Life restructures | Self-reported structural change |
| 12 | Your First Graduate | Someone transforms because of you | Self-reported / testimonial |

### Dimension 3: Transformation Evidence (New)

**Data source:** Aggregated journey data (wahoo history, healing progress, state trends, cross-pollination)
**Visual:** Not a separate UI element. Embedded in what the Figurine SAYS. The proof lives in the Figurine's words.
**How it works:** The Figurine references specific evidence of transformation in its coaching moments and chat responses:

| Evidence Type | Source | Figurine Uses It As |
|---|---|---|
| State trend over time | `nervous_system_checkins` state values, 3-day moving average | "You arrived in Shutdown. This month, 60% of your days are Ventral or above. That's not nothing." |
| Wahoo classification shift | `quest_completions` wahoo_classification distribution | "Your first 5 wahoos were all Pressure. Your last 5 were Fun and Vibe Rise. Your cone is expanding." |
| Protective voice frequency | `healing_intentions` voice counts | "The Perfectionist used to show up every week. It's been quiet for 12 days. That's new." |
| Cross-pollination events | `quest_cross_pollination` | "Your breathwork and coaching paths are feeding each other. Three times now." |
| Identity statements | `quest_completions` reflection_text JSON | "You said 'I'm someone who shows up.' That was your identity statement after your third wahoo. Do you still believe it?" |
| Streak resilience | `groan_streaks` rebuild count | "This is your 4th rebuild. Each one faster than the last. Recovery speed IS the skill." |

This dimension is NOT a dashboard or score. It's the Figurine's ability to reference concrete evidence. It's what makes the Figurine feel like it truly knows you, not just your archetype label.

---

## Part 6: Build Sequence

### Phase 1: Foundation (3 days)

**Step 1.1: Apply Database Migration** (10 min)
- Apply `20260619_essence_avatar.sql` from Figurine branch
- Adds `custom_essence_figurine` TEXT column to `lead_flow_profiles`
- Creates `essence_avatar_memory` table with RLS
- No breaking changes to existing data

**Step 1.2: Create `src/lib/figurine/` utilities** (2 hours)
- **`figurineIntelligence.js`:** Copy `computeIntelligence()`, `getIntelligencePhase()`, `getNextMilestoneHint()` directly from branch. Add `PHASE_NAMES` constant.
- **`figurineVoice.js`:** Copy `getGroupStyle()`, `getReturnMessage()`, `getFirstMeetingMessage()` directly from branch.
- **`figurinePromptBuilder.js`:** Adapted `buildSystemPrompt()` from branch. Add heroStage, journey context, updated phase guidance for mentor framing.
- **`heroStageChecker.js`:** New. Computes current hero stage from DB data. Returns graduation eligibility, stuck state, and interim milestone progress.

**Step 1.3: Create `src/hooks/useFigurine.js`** (1 day)
- Data loading (7 parallel queries, adapted from branch)
- Intelligence calculation (from figurineIntelligence.js)
- Current state detection (from latest check-in)
- Hero stage computation (from heroStageChecker.js)
- Coaching overlay queue (graduation + stuck detection)
- Chat state management (messages, streaming, rate limiting)
- sendMessage() with SSE streaming (adapted from branch)

**Step 1.4: Create `src/components/Figurine/Figurine.css`** (half day)
- Copy breathing animation keyframes from branch CSS (4 animations)
- Copy NS-state border/glow/filter rules from branch CSS
- Redesign panel styles for light theme
- Overlay styles (matches HealingFlowModal center overlay pattern)
- Presence styles (for Journey tab embed)
- Use app bg (`#f5f5f0`) and brand colours (purple `#5e17eb`, gold `#E9A23B`)
- Scope all selectors under `.figurine-*` prefix

### Phase 2: Components (3 days)

**Step 2.1: Build `FigurineOverlay.jsx`** (1 day)
- Full-screen semi-transparent overlay (light bg)
- Centered card with figurine image (120px, circular, breathing)
- Message text (2-4 sentences)
- Primary CTA button
- Optional secondary CTA ("Talk to your mentor")
- Optional visual effects (gold pulse, dim, merge glow)
- Pop-in animation (matches LevelUpModal)
- Confetti integration via `useCelebrations` for graduation moments

**Step 2.2: Build `FigurineChat.jsx`** (1.5 days)
- Header: figurine thumbnail (48px, circular, breathing) + name + archetype label + close button
- Intelligence bar: thin progress bar with purple-to-gold gradient, phase name, percentage, next milestone hint
- Message thread: scrollable area, auto-scroll on new messages
- Message bubbles: assistant (left-aligned, light purple bg on white) and user (right-aligned, light gold bg)
- Streaming cursor animation on assistant messages while streaming
- Input row: text input + send button (disabled while streaming or rate limited)
- Rate limit display: "2 conversations left today" below messages
- Bottom sheet on mobile (slides up, 80vh max, drag handle, safe area padding)
- Panel on desktop (centered modal, 420px wide, 70vh max)
- Streaming logic: adapted from branch `sendMessage()` (fetch + ReadableStream + SSE parser)

**Step 2.3: Build `FigurinePresence.jsx`** (half day)
- Figurine avatar (80px, circular, NS-state breathing)
- Stage-aware default message (from table above)
- "Talk to your mentor" button (visible only at Stage 4b+, opens FigurineChat)
- Intelligence percentage display (visible at Stage 4a, before mentor unlock)
- Styled as a card within the Journey tab content flow

### Phase 3: Integration (2 days)

**Step 3.1: Add Journey tab** (half day)
- Modify `useChallengeData.js`: add 'Journey' to tab array
- Modify `Challenge.jsx`: render Journey tab content (FigurinePresence + hero stage progress + interim milestones)
- Tab syncs to `?tab=Journey` query param

**Step 3.2: Wire coaching overlay to app** (half day)
- In `Challenge.jsx` (or higher-level `App.jsx`): check `useFigurine().pendingOverlay`
- When truthy, render `FigurineOverlay` with overlay data
- On dismiss: call `dismissOverlay()`, update hero stage if graduation
- Suppress Zarlo FAB while overlay is visible

**Step 3.3: Wire graduation detection** (half day)
- `heroStageChecker.js` queries graduation triggers on mount
- Compares current hero stage vs computed eligible stage
- If eligible stage > current: sets pendingOverlay with graduation data
- Graduation data includes: message, visual effect, CTA text
- After overlay dismissed: `UPDATE user_stage_progress SET current_journey_level = [new stage]`

**Step 3.4: Wire stuck detection** (half day)
- `heroStageChecker.js` checks stuck thresholds per current stage
- Thresholds defined in trigger map (7 days for most, 14 days for post-session)
- If stuck: sets pendingOverlay with stuck data + Unstick Flow steps
- Unstick Flow: 3 sequential text inputs within FigurineOverlay
- Step 3 auto-creates a wahoo (inserts to `groan_challenges`)

### Phase 4: Chat + Polish (2 days)

**Step 4.1: Wire chat to agent-chat Edge Function** (half day)
- No changes to Edge Function needed (already accepts systemPrompt + messages)
- `useFigurine.sendMessage()` builds system prompt via `figurinePromptBuilder.js`
- Injects: archetype voice, current state, hero stage, memories, phase guidance
- Streams SSE response (same pattern as branch code)

**Step 4.2: Figurine image generation** (half day)
- Modify `src/flows/EssenceMirrorFlow.jsx`: after hero avatar generation succeeds, fire a second non-blocking Gemini call for the figurine version (same `generate-avatar-gemini` function, different prompt requesting collectible figurine on pedestal)
- Save result to `lead_flow_profiles.custom_essence_figurine`
- Graceful fallback: if figurine generation fails, use hero avatar for all displays

**Step 4.3: First meeting sequence** (half day)
- On first coaching overlay (Stage 4a graduation), show first meeting disclosure
- Message: archetype tagline + "I've been waiting for you to hear me." + privacy disclosure
- Track via localStorage: `figurine_introduced_${userId}`
- On subsequent loads: show stage-aware default message instead

**Step 4.4: Edge cases + testing** (half day)
- No figurine image: circular crop of `hero_avatar_url`
- No essence archetype: FigurinePresence hidden, overlay suppressed
- Rate limit hit: input disabled, message displayed, coaching overlays unaffected
- Mobile testing: bottom sheet sizing, safe area insets, scroll behaviour
- Zarlo coexistence: verify Zarlo FAB still works independently

### Phase 5: V2 Enhancements (future, not in initial build)

- **FigurineMemoryView.jsx**: "What do you know about me?" panel showing `essence_avatar_memory` entries grouped by type, with "Forget" button per entry
- **Memory extraction**: After chat panel closes, extract 0-3 memories via Haiku call, store in `essence_avatar_memory`
- **Pattern detection engine**: 5 algorithms (practice avoidance, time-of-day clustering, wahoo category imbalance, gateway practice detection, state trend), runs after daily check-in
- **Push notifications from Figurine**: Rare messages after 7+ day absence
- **Cryptic hooks**: Monthly open-loop wisdom messages that the user won't understand yet
- **Batch figurine migration**: Script to generate figurines for existing users with hero avatars
- **Audio/TTS**: Figurine-voiced audio messages (V3)

### Effort Summary

| Phase | Days | Deliverable |
|---|---|---|
| Phase 1: Foundation | 3 | Hook, utilities, CSS, migration |
| Phase 2: Components | 3 | Overlay, Chat, Presence |
| Phase 3: Integration | 2 | Journey tab, graduation wiring, stuck detection |
| Phase 4: Chat + Polish | 2 | AI chat, figurine generation, first meeting, edge cases |
| **Total V1** | **10 days** | |
| Phase 5: V2 | 5+ | Memory view, pattern detection, push, cryptic hooks |

---

## Part 7: Connection to Self-Knowledge Skills

The Figurine's intelligence phases (0-3) map to the Self-Knowledge Skills system from the Octalysis alignment spec. As the user levels up their skills through usage, the Figurine gets smarter. The Figurine IS the face of the AI levelling up.

### Skill-to-Phase Mapping

| Figurine Phase | Unlocked By | What Changes in Figurine |
|---|---|---|
| **Phase 0: Archetype Voice** | Essence Mirror complete | Figurine knows archetype, speaks tentatively. "I know who you are but not how you move yet." Generic encouragement, no observations. |
| **Phase 1: State Mirror** | Self-Awareness L3 (50+ check-ins) + Courage L2 (15+ wahoos) | Figurine knows patterns, can name protective voices. Reflects current state with day-of-week awareness. "I can see you pull back on Wednesdays." |
| **Phase 2: Pattern Emergence** | Pattern Recognition L3 (15+ healing flows) + Integration L2 (5+ cross-pollination events) | Figurine sees convergence, can tease Flow Statement. Makes tentative observations: "Your paths are starting to talk to each other." |
| **Phase 3: Personalised** | All skills L3+ | Figurine knows user deeply, can challenge directly. References specific data with confidence. Catches protective voices in real time. "The Perfectionist is going to resist this one. Ready?" |

### The Five Self-Knowledge Skills

| Skill | Levels Based On | What It Unlocks in the AI |
|---|---|---|
| **Self-Awareness** | Daily check-ins (10/25/50/100/200) | L1: basic state. L3: day-of-week patterns. L5: Figurine predicts state before check-in. |
| **Courage** | Wahoos completed (5/15/30/60/100) | L1: Screen wahoos only. L3: Live + Money. L5: Vulnerable/Authority recommendations. |
| **Pattern Recognition** | Healing flows completed (3/8/15/30/50) | L1: names voice after user identifies. L3: spots voice before user names it. L5: predicts which voice will fight a wahoo. |
| **Resilience** | Streak rebuilds, not length (2/4/7/10/15) | L3: "3rd rebuild. Getting faster." L5: "Recovery speed IS the skill." |
| **Integration** | Cross-pollination events (2/5/10/20/35) | L1: paths feel separate. L3: connections noticed. L5: actively suggests cross-path wahoos. |

### How This Manifests

The user sees: skill levels on the Journey tab (e.g., "Courage L3" with progress bar to L4). Level-ups delivered as Insight Drops: "Courage Level 3 unlocked. You've completed 30 wahoos. The app can now recommend deeper challenges."

The user experiences: the Figurine getting smarter. At Phase 0, it's a warm but generic archetype voice. By Phase 3, it references specific patterns, predicts behaviour, catches protective voices before they speak, and connects dots across life paths. "Your mentor is getting smarter" = "your skills are increasing" = "you've given the AI more data."

The key insight: skill levels don't just change a number on a badge. They change what the Figurine DOES. Higher skills = smarter Figurine = more personalised experience. You're not grinding for points. You're training your AI to understand you.

### Intelligence % vs Skills (Implementation Note)

The branch's `computeIntelligence()` uses milestone-based calculation (14 check-ins = +10%, 3 wahoos = +10%, etc.). The Self-Knowledge Skills use submission counts (50 check-ins = Self-Awareness L3). These are two different granularities of the same concept.

**V1:** Use `computeIntelligence()` as-is from the branch. It's simpler and covers the first few weeks.

**V2:** When Self-Knowledge Skills are built, phase transitions should be gated by skill levels (not just raw data milestones). The intelligence % becomes: sum of skill level progress across all 5 skills. This is a future migration, not a V1 concern.

---

## Appendix A: `heroStageChecker.js` Spec

```javascript
// heroStageChecker.js
// Computes current hero stage and detects graduations/stuck states

export function computeHeroStage(userData) {
  // Returns: { currentStage: 1-12, eligibleStage: 1-12, isStuck: boolean }
  
  // Check graduation triggers in reverse order (highest first)
  // Stage 12: first graduate confirmed
  // Stage 11: structural change confirmed
  // Stage 10: path selected + first action written
  // Stage 9: flow statement written + confirmed
  // Stage 8: reconsolidation session completed
  // Stage 7: protective voice identified 5 times
  // Stage 6: 2nd wahoo completed
  // Stage 5: first wahoo classified Vibe Rise
  // Stage 4: Essence Mirror complete + avatar generated
  // Stage 3: Life Paths complete + courage challenge identified
  // Stage 2: account created + first check-in
  
  // Compare eligibleStage vs stored currentStage
  // If eligible > current: graduation available
}

export function checkStuckState(currentStage, userData) {
  // Returns: { isStuck: boolean, stuckMessage: string, stuckDays: number }
  
  // Per-stage thresholds:
  // Stage 4→5: 7 days, no Vibe Rise wahoo
  // Stage 5→6: 7 days after first Vibe Rise, no 2nd wahoo
  // Stage 6→7: 7 days without voice count increasing
  // Stage 7→8: 7 days without booking session
  // Stage 8→9: 14 days post-session without convergence
  // Stage 9→10: 14 days without path selection
}

export function getInterimMilestones(currentStage, userData) {
  // Returns: array of { milestone, completed, trigger, zarloMessage }
  // For Journey tab display (dots/progress indicators)
  // Not Figurine-delivered, Zarlo-delivered
}
```

### Data Requirements for heroStageChecker

| Stage | Needs | Table |
|---|---|---|
| 2 | First check-in exists | `nervous_system_checkins` |
| 3 | Life Paths complete | `life_path_sessions` |
| 4 | Essence Mirror complete | `lead_flow_profiles.essence_archetype` not null |
| 5 | Wahoo classified Vibe Rise | `quest_completions` where wahoo_classification = 'vibe' |
| 6 | 2nd wahoo | `groan_challenges` completed count >= 2 |
| 7 | Voice count >= 5 | `healing_intentions` protective voice count |
| 8 | Session completed | Manual flag or `user_stage_progress` field (TBD) |
| 9 | Flow Statement written | New field on `user_stage_progress` or `lead_flow_profiles` (TBD) |
| 10 | Path selected | New field (TBD) |
| 11-12 | Self-reported | New fields (TBD) |

Note: Stages 8-12 need new data fields that don't exist yet. These graduations can be manually triggered or gated behind self-report UIs that are built as the user reaches those stages.

## Appendix B: Streaming SSE Pattern (from Branch)

The branch's `sendMessage()` implements SSE streaming via fetch + ReadableStream. This pattern is battle-tested and should be copied directly into `useFigurine.js`:

```javascript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ systemPrompt, messages: apiMessages }),
    signal: abortController.signal,
  }
)

const reader = response.body.getReader()
const decoder = new TextDecoder()
let fullText = ''
let sseBuffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  sseBuffer += decoder.decode(value, { stream: true })
  const lines = sseBuffer.split('\n')
  sseBuffer = lines.pop() // Keep incomplete line in buffer

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const data = line.slice(6).trim()
    if (data === '[DONE]') break
    try {
      const parsed = JSON.parse(data)
      if (parsed.delta) {
        fullText += parsed.delta
        // Update message state with fullText
      }
    } catch (e) { /* ignore JSON parse errors on partial chunks */ }
  }
}
```

No changes needed to the `agent-chat` Edge Function. It already accepts `{ systemPrompt, messages }` and streams SSE with `data: {"delta": "..."}` format.

## Appendix C: Migration SQL (from Figurine Branch, apply as-is)

```sql
-- File: supabase/migrations/20260619_essence_avatar.sql

-- 1. Figurine image column on lead_flow_profiles
ALTER TABLE lead_flow_profiles
  ADD COLUMN IF NOT EXISTS custom_essence_figurine TEXT;

-- 2. Compounding memory table
CREATE TABLE IF NOT EXISTS essence_avatar_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'pattern', 'correction', 'insight', 'milestone', 'fear', 'breakthrough'
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

CREATE INDEX IF NOT EXISTS idx_avatar_memory_user 
  ON essence_avatar_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_memory_active 
  ON essence_avatar_memory(user_id, memory_type)
  WHERE deleted_at IS NULL AND superseded_by IS NULL;

-- 3. RLS
ALTER TABLE essence_avatar_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memories" ON essence_avatar_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own memories" ON essence_avatar_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own memories" ON essence_avatar_memory
  FOR UPDATE USING (auth.uid() = user_id);
```

---

*This document consolidates: Figurine branch code (6 files), figurine-mentor-spec.md, octalysis-alignment-implementation-notes.md (Sections 5 + 10), measurement-framework-exploration.md (Section 7), Hero Journey Stages (Obsidian), and living-essence-avatar.md (Figurine branch design doc).*

*All design decisions are confirmed. An implementing agent should be able to build from this document without asking questions.*
