# Essence Avatar Implementation Plan

*Gun-to-head, best-possible plan. Every file, every change, every order of operation.*

Design docs: `docs/living-essence-avatar.md`, `docs/mystery-box-game-design.md`
Mockup: `public/essence-avatar-mockup.html`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│  EssenceAvatarWidget.jsx (replaces ZarloWidget)         │
│  ├── Floating figurine (3 states: idle/speaking/panel)  │
│  ├── CSS state effects (glow, particles, breathing)     │
│  └── Speech bubble on pattern detection                 │
│       │                                                 │
│       ├── EssenceAvatarPanel.jsx (replaces ZarloChat)   │
│       │   ├── Figurine header + intelligence bar        │
│       │   ├── Message thread (streaming via SSE)        │
│       │   └── Input + send                              │
│       │                                                 │
│       └── useEssenceAvatar.js (brain)                   │
│           ├── Reads: lead_flow_profiles (identity)      │
│           ├── Reads: nervous_system_checkins (state)    │
│           ├── Reads: groan_challenges (wahoos)          │
│           ├── Reads: experience_checkins (calibration)  │
│           ├── Reads: essence_avatar_memory (memories)   │
│           ├── Computes: intelligence phase + %          │
│           ├── Detects: patterns + protective voices     │
│           ├── Builds: system prompt (archetype-voiced)  │
│           └── Calls: agent-chat edge function (stream)  │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: MVP (Archetype Voice + State Mirror)

**Goal**: Figurine on screen, alive, tappable, archetype-voiced AI conversations. No pattern detection yet.

### Step 1.1: Database Migration

**File**: `supabase/migrations/20260619_essence_avatar.sql`

```sql
-- Figurine image storage
ALTER TABLE lead_flow_profiles
  ADD COLUMN IF NOT EXISTS custom_essence_figurine TEXT;

-- Avatar memory (for Phase 2, create table now)
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

CREATE INDEX idx_avatar_memory_user ON essence_avatar_memory(user_id);
CREATE INDEX idx_avatar_memory_type ON essence_avatar_memory(user_id, memory_type);

-- RLS
ALTER TABLE essence_avatar_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memories" ON essence_avatar_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own memories" ON essence_avatar_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own memories" ON essence_avatar_memory
  FOR UPDATE USING (auth.uid() = user_id);
```

### Step 1.2: Figurine Generation (Background)

**Modify**: `src/flows/EssenceMirrorFlow.jsx`

After the existing hero avatar generation succeeds (~line 840), fire a second non-blocking Gemini call:

```javascript
// After: setAvatarGenerated(data.url)
// Add: fire figurine generation in background (non-blocking)
generateFigurine(base64, primary, secondary, user.id)
```

**New function** in same file (or extract to `src/lib/figurineGenerator.js`):

```javascript
async function generateFigurine(photoBase64, primary, secondary, userId) {
  try {
    const figurinePrompt = `Transform this person into a premium collectible figurine/toy.
Keep the EXACT same character, face, outfit, and style. Render as a small collectible
figurine standing on a small circular metallic purple-gold gradient base/pedestal.
The figurine should look like a high-end collectible toy. Pure white background,
no environment, no scene. Full body visible head to toe.

Their essence: "${primary?.name}" - ${primary?.poetic_line}
Their superpower: ${primary?.superpower}

Maintain Pixar 3D animation quality. Square composition.
No text or words anywhere in the image.`

    const { data } = await supabase.functions.invoke('generate-avatar-gemini', {
      body: { photo_base64: photoBase64, photo_mime: 'image/jpeg', prompt: figurinePrompt }
    })

    if (data?.url) {
      await supabase.from('lead_flow_profiles')
        .update({ custom_essence_figurine: data.url })
        .eq('user_id', userId)
    }
  } catch (err) {
    console.warn('Figurine generation failed (non-blocking):', err)
  }
}
```

### Step 1.3: useEssenceAvatar Hook (Brain)

**New file**: `src/hooks/useEssenceAvatar.js`

This is the central hook. MVP version:

```javascript
// Data it reads:
// - lead_flow_profiles: essence_archetype, custom_essence_figurine,
//   custom_essence_image, custom_essence_name, custom_essence_fields,
//   protective_archetype
// - user_stage_progress: current_journey_level, hero_avatar_url
// - nervous_system_checkins: latest state (last 14 days)
// - groan_challenges: completed count, categories
// - experience_checkins: count
// - weekly_reviews: count
// - essence_avatar_memory: all non-deleted, non-superseded

// What it computes:
// - currentState: 'vibe_rise' | 'ventral' | 'sympathetic' | 'dorsal'
//   (from most recent daily check-in's after_state)
// - intelligencePhase: 0-3
// - intelligencePercent: 0-100
// - figurineUrl: custom_essence_figurine || hero_avatar_url (fallback)
// - archetypeName, archetypeFields (for system prompt)
// - isUnlocked: current_journey_level >= 1
// - hasSomethingToSay: false (MVP, true in Phase 2)
// - speakingMessage: null (MVP, set in Phase 2)
// - memories: [] (MVP, populated in Phase 2)

// What it exposes:
// - sendMessage(text): calls agent-chat with archetype system prompt
// - messages: conversation thread
// - isStreaming: boolean
// - All computed state above
```

**Intelligence % calculation** (from design doc):

```javascript
function computeIntelligence(data) {
  let score = 0
  if (data.essenceArchetype) score += 10           // Essence Mirror complete
  if (data.checkinCount >= 1) score += 5            // First check-in
  if (data.checkinCount >= 3) score += 10           // 3 check-ins
  if (data.practiceDays >= 1) score += 5            // First practice
  if (data.practiceDays >= 3) score += 10           // 3 practice days
  if (data.checkinCount >= 7) score += 10           // 7 check-ins
  if (data.wahooCount >= 1) score += 10             // First Wahoo
  if (data.practiceDays >= 7) score += 10           // 7 practice days
  if (data.wahooCount >= 3) score += 10             // 3+ Wahoos
  if (data.checkinCount >= 14) score += 10          // 14 check-ins
  if (data.conversationCount >= 1) score += 10      // First conversation
  return score // 0-100
}
```

**System prompt builder** (archetype-voiced):

```javascript
function buildSystemPrompt(profile, currentState, memories, capacityData) {
  return `You are the user's Essence Avatar — their inner ${profile.essence_archetype},
speaking in first person as a companion who knows them deeply.

YOUR IDENTITY:
Name: ${profile.custom_essence_name}
Archetype: ${profile.essence_archetype}
Essence: ${profile.custom_essence_fields?.tagline}
Superpower: ${profile.custom_essence_fields?.superpower}
Wound: ${profile.custom_essence_fields?.wound}
North Star: ${profile.custom_essence_fields?.north_star}
Protective pattern: ${profile.protective_archetype}

YOUR VOICE:
- First person ("I notice..." not "Your Ghost...")
- ${getGroupStyle(profile.essence_archetype)}
- Mirror patterns, ask questions. Never prescribe.
- Never use em dashes. Keep it conversational and warm.
- Short messages (2-4 sentences). Not essays.

CURRENT STATE:
- Nervous system: ${currentState || 'unknown'}
${capacityData ? `- Capacity: Safety ${capacityData.safety}/10, Expression ${capacityData.expression}/10` : ''}

${memories.length > 0 ? `MEMORY BANK (what you've learned about this person):
${memories.map(m => `- [${m.memory_type}] ${m.content} (confidence: ${m.confidence})`).join('\n')}` : ''}

RULES:
- Never diagnose. Never say "you have a Ghost pattern." Say "I notice you pull back when..."
- If the user corrects you, accept gracefully: "Fair enough. I'm still learning."
- Reference their wound ONLY when catching a protective pattern (not casually).
- Keep responses under 60 words unless the user asks for more.`
}
```

**Group style helper**:

```javascript
function getGroupStyle(archetype) {
  const activators = ['Radiant Rebel', 'Playful Creator', 'Sacred Jester']
  const transmuters = ['Mystic Messenger', 'Truth-Teller', 'Heart Alchemist']
  const stabilizers = ['Grounded Guardian', 'Heart Holder', 'Rhythm Architect']
  // Bridgers = everyone else

  if (activators.includes(archetype)) return 'Be direct, fiery, playful. Challenge with warmth.'
  if (transmuters.includes(archetype)) return 'Be deep, knowing, warm. See beneath the surface.'
  if (stabilizers.includes(archetype)) return 'Be steady, patient, grounded. No rush.'
  return 'Be calm, observational, big-picture. Connect threads.'
}
```

**Streaming via agent-chat**:

```javascript
async function sendMessage(text) {
  // Add user message to thread
  // Build system prompt
  // Call agent-chat edge function with SSE
  // Stream response tokens into assistant message
  // On stream complete: save conversation to zarlo_conversations
}
```

Use existing `agent-chat` edge function. It accepts `{ systemPrompt, messages }` and streams SSE. The client-side streaming pattern already exists somewhere in the codebase (if not, it's standard EventSource/fetch with ReadableStream).

### Step 1.4: EssenceAvatarWidget Component

**New file**: `src/components/EssenceAvatar/EssenceAvatarWidget.jsx`

Replaces ZarloWidget. Structure:

```
EssenceAvatarWidget
├── .essence-avatar-widget (position: fixed, bottom-right)
│   ├── .avatar-figurine (circular crop of figurine, CSS state class)
│   │   ├── img (figurine URL from hook)
│   │   └── state effects (via CSS class: --vibe-rise, --ventral, etc.)
│   ├── .avatar-speech-bubble (visible when hasSomethingToSay)
│   │   └── speakingMessage text
│   └── (on tap) → EssenceAvatarPanel
│
├── EssenceAvatarPanel (bottom sheet)
│   ├── Header (figurine + name + archetype)
│   ├── Intelligence bar (phase + %)
│   ├── Messages (streaming thread)
│   └── Input
```

### Step 1.5: EssenceAvatarPanel Component

**New file**: `src/components/EssenceAvatar/EssenceAvatarPanel.jsx`

The conversation interface. Evolves from ZarloChat but with:
- Figurine in header (circular crop, state-reactive)
- Intelligence progress bar below header
- Streaming message display (SSE tokens)
- Archetype-colored message bubbles

### Step 1.6: CSS

**New file**: `src/components/EssenceAvatar/EssenceAvatar.css`

Port the validated CSS from `public/essence-avatar-mockup.html`:
- 4 state classes (`.avatar--vibe-rise`, etc.)
- Breathing animations
- Particle pseudo-elements
- Widget sizing (56px idle → 80px speaking → panel)
- Speech bubble
- Panel styles (header, intelligence bar, messages, input)
- Brand colors (purple→gold gradient)

### Step 1.7: Integration (Replace Zarlo)

**Modify**: `src/AppRouter.jsx`

```diff
- import { ZarloWidget } from './components/Zarlo'
+ import EssenceAvatarWidget from './components/EssenceAvatar/EssenceAvatarWidget'

  function ConditionalZarlo() {
    // ... existing route exclusion logic stays identical ...
-   return <ZarloWidget />
+   return <EssenceAvatarWidget />
  }
```

That's it. One import swap. The route exclusion logic (`ConditionalZarlo`) stays identical.

### Step 1.8: Level 1 Unlock Sequence

**Modify**: `src/components/level/LevelTab.jsx` (or wherever level-up is handled)

When `current_journey_level` transitions from 0 → 1:
1. Existing level-up celebration plays
2. New screen: "Meet Your Essence Avatar"
3. Figurine appears with CSS breathing animation
4. Avatar speaks first words (archetype poetic_line via `custom_essence_fields.tagline`)
5. Brief tutorial overlay: "I'll be here in the corner. Tap me anytime."
6. Dismiss → `EssenceAvatarWidget` appears for the first time

**Check**: `useEssenceAvatar` returns `isUnlocked: false` until level >= 1. The widget renders nothing when unlocked is false.

### Step 1.9: First Meeting Disclosure

On first conversation open (tracked via localStorage flag `essence_avatar_introduced`):

System sends an automatic first message:

> "[Archetype poetic_line]. I've been waiting for you to hear me.
>
> I learn from your check-ins, your practices, your Wahoos, and our conversations. That's it. Nothing outside this app. Everything I know, you gave me."

---

## Phase 2: Pattern Detection + Speaking Triggers

**Goal**: Avatar detects patterns from behavioral data and initiates conversation.

### Step 2.1: Pattern Detection Engine

**New file**: `src/lib/essenceAvatar/patternDetector.js`

Runs after daily check-in submission. Queries last 14 days of data.

**5 detection algorithms:**

```javascript
// 1. Practice Avoidance (→ Ghost/Perfectionist)
// Query: checkin_type counts grouped by type, compare to expected
// Signal: same practice skipped 5+ times while others done
// Confidence: skip_count / total_days

// 2. Time-of-Day State Clustering
// Query: after_state grouped by hour-bucket (morning/afternoon/evening)
// Signal: Sympathetic clusters in a specific time window
// Confidence: cluster_count / total_checkins_in_window

// 3. Wahoo Category Imbalance
// Query: groan_challenges completed, grouped by wahoo_category
// Signal: one category at 0 while others have 3+
// Confidence: 0.7 (fixed, always notable)

// 4. Gateway Practice Detection
// Query: correlate practices done on Vibe Rise days vs non-Vibe Rise days
// Signal: practice X present on 80%+ of Vibe Rise days
// Confidence: correlation_ratio

// 5. State Trend (improving/declining)
// Query: after_state values over last 14 days, mapped to numeric
//   (dorsal=1, sympathetic=2, ventral=3, vibe_rise=4)
// Signal: 3-day moving average trending up or down
// Confidence: trend_strength
```

Each detector returns: `{ detected: bool, type: string, message: string, confidence: float }`

### Step 2.2: Speaking Trigger Integration

**Modify**: `src/hooks/useEssenceAvatar.js`

After daily check-in saves (listen for `nervous_system_checkins` insert):
1. Run all 5 detectors
2. If any returns `detected: true` with `confidence > 0.7`:
   - Set `hasSomethingToSay: true`
   - Set `speakingMessage` to the detection's teaser message
   - Widget transitions from idle (56px) → speaking (80px + bubble)
3. Bubble auto-dismisses after 8 seconds if not tapped
4. If tapped: open panel, avatar delivers full observation as first message

### Step 2.3: Memory Extraction

**New file**: `src/lib/essenceAvatar/memoryExtractor.js`

After conversation panel closes:

```javascript
async function extractMemories(messages, existingMemories, userId) {
  // Call agent-chat (or a dedicated lighter endpoint) with Haiku
  // Prompt: "Extract 0-3 memory entries from this conversation..."
  // Parse JSON response
  // Insert into essence_avatar_memory
}
```

For cost efficiency, use a separate edge function that calls Haiku instead of Sonnet. Or add a `model` param to `agent-chat`.

### Step 2.4: Disagreement Protocol

**In system prompt** (already handled by rules):
- "If the user corrects you, accept gracefully"
- When user says "no" or "that's wrong": save correction memory with confidence 1.0

**In memoryExtractor**: detect correction messages and auto-save with `memory_type: 'correction'`, `confidence: 1.0`.

---

## Phase 3: Polish + Mystery Boxes

### Step 3.1: Return After Absence

**In `useEssenceAvatar`**: check `last_interaction_at` from `zarlo_conversations`. If > 3 days, set a return message based on absence length (from design doc). Avatar starts in ventral (neutral warmth) state.

### Step 3.2: "What Do You Know About Me?" View

**New file**: `src/components/EssenceAvatar/AvatarMemoryView.jsx`

Accessible via:
- User types "what do you know about me?" in chat
- Or settings gear in panel header

Shows all `essence_avatar_memory` entries grouped by type. Each has a "Forget" button (sets `deleted_at`).

### Step 3.3: Mystery Box Delivery

**New file**: `src/components/EssenceAvatar/MysteryBoxReveal.jsx`

When a mystery box is earned (streak milestone, zone transition, etc.):
1. Widget shows figurine holding a glowing box (CSS animation)
2. Tap opens full-screen reveal overlay
3. Box animation → insight card revealed
4. Save insight to `essence_avatar_memory` with `source: 'mystery_box'`
5. Card added to future Play Deck collection

### Step 3.4: Figurine Batch Migration

**Script**: `scripts/generate-figurines.js`

For existing users who already have `custom_essence_image` but no `custom_essence_figurine`:
- Query all users with essence images
- Batch call Gemini with figurine prompt
- Update `lead_flow_profiles.custom_essence_figurine`
- Rate limit: 5/minute to avoid API limits

---

## File Map (All Changes)

### New Files (9)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260619_essence_avatar.sql` | DB migration |
| `src/hooks/useEssenceAvatar.js` | Central brain hook |
| `src/components/EssenceAvatar/EssenceAvatarWidget.jsx` | Floating widget |
| `src/components/EssenceAvatar/EssenceAvatarPanel.jsx` | Conversation panel |
| `src/components/EssenceAvatar/EssenceAvatar.css` | All styles |
| `src/components/EssenceAvatar/index.js` | Barrel export |
| `src/lib/essenceAvatar/patternDetector.js` | Pattern detection (Phase 2) |
| `src/lib/essenceAvatar/memoryExtractor.js` | Memory extraction (Phase 2) |
| `src/components/EssenceAvatar/AvatarMemoryView.jsx` | Memory view (Phase 3) |

### Modified Files (3)

| File | Change |
|------|--------|
| `src/AppRouter.jsx` | Swap `ZarloWidget` import → `EssenceAvatarWidget` (1 line) |
| `src/flows/EssenceMirrorFlow.jsx` | Add background figurine generation call (~15 lines) |
| `src/components/level/LevelTab.jsx` | Add Level 1 unlock sequence |

### Untouched (Kept for Reference)

All existing Zarlo files stay in the codebase initially. They're dead code once the import swaps, but removing them is a separate cleanup PR.

### Edge Functions

| Function | Status | Used For |
|----------|--------|----------|
| `agent-chat` | EXISTS | Streaming conversations (Sonnet) |
| `generate-avatar-gemini` | EXISTS | Figurine generation (same pipeline) |
| `extract-avatar-memory` | NEW (Phase 2) | Memory extraction (Haiku, cheaper) |

---

## Data Flow

### On Page Load
```
useEssenceAvatar()
  ├── Query lead_flow_profiles (archetype, figurine URL, fields)
  ├── Query user_stage_progress (current_journey_level)
  ├── Query nervous_system_checkins (last 14 days, latest state)
  ├── Query groan_challenges (completed count, categories)
  ├── Query experience_checkins (count)
  ├── Query weekly_reviews (count)
  ├── Query essence_avatar_memory (non-deleted, non-superseded)
  ├── Compute: intelligencePercent, intelligencePhase
  ├── Compute: currentState (from latest checkin after_state)
  ├── Compute: figurineUrl (figurine || hero_avatar || null)
  ├── Compute: isUnlocked (level >= 1)
  └── Return all state to widget
```

### On Conversation Send
```
sendMessage(text)
  ├── Append user message to thread
  ├── Build system prompt (archetype + state + memories)
  ├── POST to agent-chat edge function
  ├── Stream SSE tokens into assistant message
  ├── On complete: update zarlo_conversations.last_interaction_at
  └── (Phase 2) On panel close: extractMemories()
```

### On Daily Check-in (Phase 2)
```
After nervous_system_checkins INSERT:
  ├── Run 5 pattern detectors
  ├── If any fires (confidence > 0.7):
  │   ├── hasSomethingToSay = true
  │   ├── speakingMessage = detector.teaser
  │   └── Widget grows 56px → 80px + bubble
  └── If none: widget stays idle
```

---

## Build Sequence

### Day 1: Foundation
1. Run DB migration
2. Build `useEssenceAvatar.js` (data queries + intelligence calculation + system prompt builder)
3. Build `EssenceAvatarWidget.jsx` (figurine display + CSS states + tap handler)
4. Port CSS from mockup to `EssenceAvatar.css`

### Day 2: Conversation
5. Build `EssenceAvatarPanel.jsx` (header + intelligence bar + messages + input)
6. Wire SSE streaming from `agent-chat` edge function
7. Test: tap widget → panel opens → type message → streaming response in archetype voice

### Day 3: Integration + Unlock
8. Swap import in `AppRouter.jsx` (ZarloWidget → EssenceAvatarWidget)
9. Add figurine generation to `EssenceMirrorFlow.jsx`
10. Build Level 1 unlock sequence in `LevelTab.jsx`
11. Add first-meeting disclosure message

### Day 4: State + Polish
12. Wire `currentState` from latest nervous_system_checkin to CSS class
13. Test all 4 state transitions on the widget
14. Test intelligence % progress bar with real data
15. Test unlock flow: new user → Essence Mirror → Level 1 → avatar appears

### Day 5: Edge Cases + QA
16. Fallback: no figurine → circular crop of hero_avatar_url
17. Fallback: no essence_archetype → widget hidden
18. Test on mobile (PWA) and iOS (Capacitor)
19. Test route exclusions (all existing ConditionalZarlo logic)
20. Performance: verify CSS animations don't jank scroll

### Week 2: Phase 2 (Pattern Detection)
21. Build `patternDetector.js` (5 algorithms)
22. Wire speaking triggers in `useEssenceAvatar`
23. Build `memoryExtractor.js` + `extract-avatar-memory` edge function
24. Test: check-in → pattern detected → widget speaks → conversation → memory saved

### Week 3: Phase 3 (Polish)
25. Return-after-absence messages
26. "What do you know about me?" memory view
27. Disagreement protocol refinement
28. Mystery box reveal component (visual only, earning logic separate)
29. Batch figurine migration script for existing users

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gemini figurine generation inconsistent quality | Medium | Fallback to circular crop of hero image. Figurine is enhancement, not requirement. |
| agent-chat streaming breaks on mobile Safari | High | Test early (Day 3). SSE works in WKWebView but test abort/reconnect. Existing edge function is battle-tested. |
| CSS animations cause scroll jank | Medium | Test on low-end device. All animations use `transform` and `opacity` (GPU-accelerated). Kill particles on low-battery if needed. |
| Pattern detection false positives annoy users | Medium | Confidence threshold at 0.7. Disagreement protocol stores corrections. Avatar learns from pushback. |
| System prompt too long → slow/expensive responses | Low | Keep under 500 tokens. Memory bank capped at 50 entries. Prune low-confidence old memories. |
| Level 1 unlock timing (user hasn't generated figurine yet) | Low | Graceful fallback to hero_avatar_url circular crop. Figurine appears when ready. |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avatar unlock rate | 60% of Essence Mirror completers reach L1 | `user_stage_progress.current_journey_level >= 1` |
| Conversation rate | 30% of unlocked users have 1+ conversation in first week | `zarlo_conversations.total_interactions > 0` |
| Return rate | Avatar users 20% higher 7-day retention than pre-avatar | Compare cohorts |
| Pattern detection accuracy | <20% correction rate | `essence_avatar_memory WHERE memory_type = 'correction'` / total patterns |
| Speaking engagement | 50% of speaking triggers result in panel open | Track bubble tap rate |

---

*Created: June 2026*
*Status: Ready to build*
*Estimated: 5 days MVP + 2 weeks full feature*
