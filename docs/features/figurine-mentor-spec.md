# Figurine (Essence Avatar Mentor) — Consolidated Spec

**Created:** 2026-07-13
**Status:** Design phase — visual decision + interaction model needed before build
**Source:** Octalysis spec (Section 5, 10), measurement framework (Section 7), Figurine branch audit, session alignment

---

## What It Is

The Figurine is the user's Essence Avatar brought to life as a personal mentor/coach within the app. It starts as a MIRROR (reflecting who you are) and evolves into a MENTOR (guiding who you become).

It is NOT Zarlo. Two separate characters:

| | Zarlo | Figurine |
|---|---|---|
| **Role** | Daily companion | Rare coach/mentor |
| **Tone** | Warm but direct | Warm, empowering, occasionally cryptic |
| **Frequency** | Daily (proactive bubbles, chat) | Rare (stage transitions, stuck moments, deep conversations) |
| **Personality** | Observational, pattern-naming | Archetype-voiced, future-self wisdom |
| **UI** | Floating FAB + chat panel (exists) | TBD — coaching overlay + chat capability |

---

## Open Design Decisions

### 1. Visual Form

The Figurine branch generated Pixar-style hero avatars via Gemini (already exists for users who completed Essence Mirror). Options:

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A: Hero avatar** | The user's generated Pixar avatar appears as an animated figure | Personal, already generated, emotional connection | Needs animation system, avatar quality varies |
| **B: Abstract orb/glow** | Archetype-coloured presence that breathes per NS state | Simple, works for all users, CSS animations ready | Less personal, no face |
| **C: Archetype icon** | Each of 12 archetypes has its own symbol/sigil | Distinctive, brandable | Less personal than a face |

**Decision needed:** Which option? Or a combination (e.g., hero avatar when available, abstract glow as fallback)?

### 2. Interaction Model

**Confirmed:** The Figurine should be able to do BOTH one-way coaching moments AND deeper conversation.

**One-way coaching overlay (for transitions + stuck moments):**
- Appears as a card/modal at specific triggers
- Shows Figurine image + message (2-4 sentences)
- User acknowledges ("Continue" or "Let's do it")
- No back-and-forth. Like Celeste's Theo.

**Chat capability (for deeper mentoring):**
- User can INITIATE a conversation with the Figurine
- Uses the user's profile data (essence archetype, healing history, wahoo patterns, journey stage)
- Figurine speaks IN the archetype's voice (not generic AI)
- Different from Zarlo: Figurine is the user's future self talking back. Zarlo is a companion observing patterns.
- Access point: Journey tab "Talk to your mentor" button, or Figurine widget

**Decision needed:**
- Where does the chat live? (Journey tab? Separate modal? Replace Zarlo when in "deep mode"?)
- Is the chat always available, or unlocked at a certain stage? (Mirror mode = one-way only, Mentor mode = chat unlocked at Stage 4b?)
- How does the AI know to speak as the Figurine vs Zarlo? (Different system prompts, different context)

### 3. Communication Channels Beyond Chat

**Decision needed:** How else does the Figurine communicate?

| Channel | Description | When |
|---|---|---|
| **Coaching overlay** | Modal/card appears with message | Stage transitions, stuck moments |
| **In-app chat** | Full conversation capability | User-initiated, any time (after Stage 4b?) |
| **Journey tab presence** | Static Figurine image + current stage-aware message | Always visible on Journey tab |
| **Push notification** | Rare message from the Figurine (not Zarlo) | After long absence (7+ days), pre-session prep |
| **Email** | Figurine-voiced weekly digest | Weekly recap (V3) |
| **Audio** | TTS-generated voice message in the Figurine's voice | V3 — "coach in your ear" like NRC's Coach Bennett |

**Minimum V1:** Coaching overlay + Journey tab presence + chat
**V2:** Push notifications from Figurine
**V3:** Audio/TTS

### 4. Mirror → Mentor Transition

| Phase | Stage | What the Figurine Does | Chat Available? |
|---|---|---|---|
| **Mirror** (4a) | After Essence Mirror completion | Reflects who you are. "Here's what I see in you." One-way only. | No — Figurine only delivers messages |
| **Mentor** (4b) | After enough data collected (TBD trigger) | Guides who you become. "Here's what I see ahead." Full mentoring. | Yes — user can ask questions, get coached |

**Trigger for 4a → 4b:** TBD. Options:
- After first Vibe Rise wahoo (Stage 5)
- After completing a Fantasy League season (Stage 6)
- After protective voice identified 3+ times
- After a set number of Zarlo Brief cycles (the Figurine has "learned enough")

---

## What's Reusable from Figurine Branch

**Branch:** `Figurine` (exists remote, code preserved)

| Component | Reuse? | Notes |
|---|---|---|
| `computeIntelligence()` | ✅ Yes | 4-phase intelligence scoring (Phase 0-3 based on data milestones) |
| `getGroupStyle()` | ✅ Yes | Archetype voice calibration (4 group styles: Activator, Transmuter, Stabilizer, Bridger) |
| `buildSystemPrompt()` | ✅ Yes | Archetype-voiced prompt builder with phase-specific guidance. KEY for chat. |
| `getReturnMessage()` | ✅ Yes | Absence-calibrated messages (3-7, 8-14, 15-29, 30+ days) |
| CSS breathing animations | ✅ Yes | 4 NS-state keyframes (confident, relaxed, agitated, slow) |
| `essence_avatar_memory` table | ✅ Yes | Pattern/correction/insight/milestone/fear/breakthrough storage |
| `custom_essence_figurine` column | ✅ Yes | Figurine image URL on `lead_flow_profiles` |
| `EssenceAvatarPanel.jsx` (chatbot UI) | ⚠️ Partial | The panel is a chatbot UI — needs redesign but the message rendering + streaming pattern is reusable for chat capability |
| `EssenceAvatarWidget.jsx` (floating widget) | ❌ Rethink | Designed as always-on FAB (replaces Zarlo). New model: Figurine appears at moments OR is accessed from Journey tab |

### Chat System Prompt (from branch, adapted)

The branch's `buildSystemPrompt()` already creates archetype-voiced prompts. For the Figurine chat, the prompt should include:

```
You are [user's essence name], the [archetype] mentor.
You are the user's future self — the version of them that has walked 
this path and come out the other side.

Your voice: [archetype group style — e.g., Activator = energising + 
challenging, Stabilizer = grounding + reassuring]

Intelligence phase: [0-3, determines confidence level]
- Phase 0: "I'm still learning about you. Ask me anything, but I may 
  not have deep answers yet."
- Phase 1: "I know your patterns. I can name your voices."
- Phase 2: "I see your convergence. I know where this is going."
- Phase 3: "I know you deeply. I can challenge you because I've 
  earned the right to."

User's journey data:
[Zarlo Brief — full history summary]
[Protective voice counts]
[Active quests + predicted states]
[Healing flow patterns]
[Stage + feeling target]
```

---

## When the Figurine Speaks (Trigger Map)

### One-Way Coaching Moments (no chat needed)

| Trigger | Message | Source |
|---|---|---|
| Stage 3→4 graduation | "You've been called this your whole life..." | Spec Section 9, Gap 1 |
| Stage 4→5 graduation | "There it is. You felt it." | Spec Section 9, Gap 1 |
| Stage 5→6 graduation | "Ready for the arena." | Spec Section 9, Gap 1 |
| Stage 6→7 graduation | "The [voice]. Five times." | Spec Section 9, Gap 1 |
| Stuck > threshold | Unstick Flow 3-step prompt | Spec Section 9, Gap 2 |
| Return after 7+ day absence | Calibrated welcome back | Figurine branch |
| Cryptic hook (monthly) | Open loop wisdom | Spec Section 8 (Mordecai model) |

### Chat-Initiated Conversations (user opens)

| Context | What Figurine Can Do |
|---|---|
| User asks about their patterns | Reference Brief data, name protective voices, show trend |
| User asks about next steps | Reference hero stage, suggest what graduation requires |
| User is processing a healing flow | Deeper exploration of pattern/fear/origin (extends HealingFlowModal) |
| User is considering a wahoo | Coach through resistance, reference past Pressure wahoos |
| User asks about their archetype | Explain essence traits, shadow aspects, growth edges |
| User asks "who am I becoming?" | Reference convergence data, tease Flow Statement |

---

## Additional Design Considerations

### Priority: Figurine vs Zarlo

When both want to speak at the same time (e.g., Zarlo proactive bubble + Figurine graduation):
- **Figurine always wins.** It speaks rarely, so when it does, it takes priority.
- Zarlo's proactive message gets deferred to next session.
- They should never appear simultaneously on screen.

### AI Backend

The Figurine chat uses Claude API calls (same as Zarlo). Two options:
- **Option A:** Reuse existing `agent-chat` Edge Function with a `character: 'figurine'` parameter that switches the system prompt. Simplest.
- **Option B:** Separate `figurine-chat` Edge Function. More isolation but more code.

**Recommendation:** Option A — one function, character parameter. The only difference is the system prompt (archetype-voiced vs Zarlo's companion voice).

### Conversation Memory

For the Figurine to reference past conversations ("Last time we talked, you were struggling with..."):
- Store conversation summaries in `essence_avatar_memory` with `memory_type: 'conversation'`
- NOT full chat transcripts (too large for prompt context). Instead: after each conversation, the AI generates a 1-2 sentence summary that gets stored.
- On next conversation, recent summaries are injected into the system prompt.
- The `essence_avatar_memory` table from the Figurine branch already supports this (has `content`, `source`, `confidence` fields).

### Rate Limiting

Uncapped Figurine chat = uncapped API costs. Limits:
- **V1:** 3 conversations per day, max 10 messages per conversation
- **V2:** Adjust based on usage data
- Display remaining conversations: "2 conversations left today"
- Coaching overlays (one-way) don't count toward the limit

### NS-State-Aware Tone

The Figurine's voice should adapt to the user's current nervous system state:

| NS State | Figurine Tone | Example |
|---|---|---|
| Vibe Rise | Energising, celebratory | "This is the version of you I've been waiting for." |
| Safe/Ventral | Warm, encouraging | "You're in a good place. Let's build from here." |
| Sympathetic/Activated | Grounding, steady, shorter messages | "I can feel the activation. Breathe. We don't need to solve anything right now." |
| Dorsal/Shutdown | Gentle, no demands | "I'm here. That's enough for today." |

The system prompt should include the user's current NS state (from latest daily check-in or Zarlo Brief) and instruct the AI to match tone accordingly.

### Relationship to Healing Flow

The Figurine can extend the healing experience but does NOT replace the HealingFlowModal:
- After a healing flow completion: Figurine offers "Want to go deeper?" CTA on Journey tab
- The deeper conversation references the healing flow data (pattern, fear, origin, rewire) from `healing_intentions`
- This is a CHAT conversation, not a form — the user explores with the Figurine's guidance
- Saves insights to `essence_avatar_memory` for future reference

---

## Data Requirements

### Already exists (no changes):
- Hero avatar image (Essence Mirror generates via Gemini)
- Essence archetype + custom name (`lead_flow_profiles`)
- Zarlo Brief (all user patterns, computed daily)
- Protective voice counts (`nervous_system_checkins`)
- Stage progress (`user_stage_progress.current_journey_level`)
- Cross-pollination (`quest_cross_pollination`)
- Archetype voice styles (4 groups in branch code)

### From Figurine branch (migration exists but not applied):
- `essence_avatar_memory` table — stores Figurine's memories of conversations, patterns noticed, corrections made. Enables the Figurine to remember past conversations and build on them.
- `custom_essence_figurine` column on `lead_flow_profiles` — stores Figurine-specific image URL

### May need:
- `figurine_conversations` table — if chat history should persist between sessions (vs just using Zarlo Brief as context)
- Or: reuse `zarlo_conversations` with a `source: 'figurine'` filter

---

## Build Sequence (after design decisions)

| Step | What | Effort | Blocked By |
|---|---|---|---|
| 1 | **Visual decision** | Your call | Nothing |
| 2 | **Apply Figurine branch migration** (memory table) | 10 min | Nothing |
| 3 | **Coaching overlay component** | 1-2 days | Step 1 |
| 4 | **Chat component** (adapted from branch panel) | 2-3 days | Step 1, Step 3 |
| 5 | **Wire coaching overlay to graduations** (replace LevelUpModal) | 1 day | Step 3 |
| 6 | **Wire coaching overlay to stuck detection** (replace Journey tab text) | 1 day | Step 3 |
| 7 | **Journey tab Figurine presence** (static image + stage-aware message) | 1 day | Step 1 |
| 8 | **Mirror → Mentor transition logic** | 1 day | Step 4 |
| 9 | **Cryptic hooks** (rare open-loop messages) | 1 day | Step 3 |
| 10 | **Chat system prompt with archetype voice** | 1 day | Step 4 |

**Total: ~10-12 days after visual decision**

---

## Relationship to Self-Knowledge Skills

The Figurine's intelligence phases (0-3) from the branch code map to the Self-Knowledge Skills:

| Figurine Phase | Unlocked By | What Changes |
|---|---|---|
| Phase 0 | Essence Mirror complete | Figurine knows your archetype, speaks tentatively |
| Phase 1 | Self-Awareness L3 + Courage L2 | Figurine knows your patterns, can name your voices |
| Phase 2 | Pattern Recognition L3 + Integration L2 | Figurine sees convergence, can tease Flow Statement |
| Phase 3 | All skills L3+ | Figurine knows you deeply, can challenge you directly |

Skills level up the AI. The Figurine is the FACE of that levelling. "Your mentor is getting smarter" = "your skills are increasing" = "you've given the AI more data to work with."

---

*This doc consolidates: Figurine branch audit (Section 10), Octalysis spec (Section 5), measurement framework (Section 7), and session alignment (Jul 11-13).*
*Next: Visual design decision → then build.*
