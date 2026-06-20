# Living Essence Avatar

*Status: Exploration / design ideation. Decisions logged as they're made.*

The avatar is the product evolution of Vibe Rise. Everything already built (archetypes, nervous system model, protective voices, Capacity Score, Essence Chamber, Shift Architecture) becomes the data layer feeding a living companion.

Related: `docs/mystery-box-game-design.md` (mystery boxes are the content, the avatar is the vehicle that delivers them).

---

## Decisions Made

### 1. Visual Form: Pixar Hero Figurine

The avatar looks like the user's Pixar hero (already generated via Essence Mirror) rendered as a **3D figurine/model**. Not photorealistic, not abstract. A collectible-feeling character you'd want on your shelf.

Think: Funko Pop meets Pixar. Your essence archetype as a living figurine that reacts to your state.

This matters because:
- Users already have emotional connection to their hero from Essence Mirror onboarding
- "That's ME" feeling drives CD4 (Ownership)
- Figurine style avoids uncanny valley while staying personal
- State changes (glow, dim, flicker) read clearly on a stylised figure
- Consistent with the existing Pixar 3D art direction

### 2. Name: "Essence Avatar"

The avatar is called the **Essence Avatar**. Not user-named, not archetype-named. "Your Essence Avatar" in copy. This keeps the therapeutic frame clear: it IS your essence self, not a pet or a separate entity.

### 3. Voice: First Person

The avatar speaks in first person: "I notice you've been avoiding visibility" not "Your Ghost is showing up." First person creates a relationship. The avatar is a companion, a friend who knows you deeply. It feels like talking to the version of yourself you're becoming.

### 4. Speaking Trigger: Pattern Detection + State Change Only

The avatar never speaks on a timer or schedule. It only speaks when:
- A behavioural pattern is detected (protective voice, avoidance, new correlation)
- A nervous system state change occurs (check-in, capacity zone transition)
- A mystery box is earned and ready to deliver
- The user taps to initiate conversation

This solves Zarlo's engagement problem. Zarlo was always available but rarely sought. The Essence Avatar earns attention by only speaking when it has something real to say. No noise, no nagging.

### 5. Avatar Replaces Zarlo

Zarlo is a feature not heavily used. The avatar subsumes it entirely. Same AI intelligence, new embodied form. Zarlo's engine (`zarloEngine.js`, `zarloPageContent.js`) becomes the avatar's brain.

This means:
- No two competing AI entities to confuse users
- The avatar inherits Zarlo's context-awareness and routing logic
- The floating chat widget gets a face
- The name "Zarlo" retires (or becomes an internal codename for the engine)

### 6. Location: Floating Widget (Replaces Zarlo Widget)

The avatar lives as a floating widget in the corner of the screen, always present, state-reactive. Tap to talk. Same position as the current Zarlo widget, but now it's a living figurine instead of a chat icon.

The widget shows:
- Your figurine in its current NS state (glowing/calm/flickering/dimmed)
- A subtle pulse or animation when it has something to say
- Tap opens the conversation (same as current Zarlo chat panel)
- Mystery box notification when one is earned (figurine holds a glowing box)

---

## The Avatar as IFS "Self" Externalized

In Internal Family Systems therapy, everyone has a "Self" (capital S): the wise, compassionate center that's always there but gets buried under protective parts. The therapeutic breakthrough happens when someone can hear their Self speaking over the noise of their protectors.

The avatar IS this: **make the Self visible and audible, even when the protective voices are loud.**

The 12 Essence archetypes define who the Self IS for each user. Each archetype has:
- **Poetic line** (how it introduces itself): "You are fire with a heartbeat"
- **Superpower** (what it does): "You ignite courage in the quiet"
- **Essence wound** (what was suppressed): "You're too intense. Calm down."
- **North star** (where it's heading): "Use rebellion to liberate, not just provoke"
- **Recognition pattern** (when people seek it): "People seek you when they're ready to break rules"

The avatar doesn't speak like a generic AI. It speaks AS your archetype.

---

## Visual State System

The avatar's appearance IS the Capacity Score equation (Safety x Expression) made visible:

| Safety | Expression | State | Figurine Visual |
|--------|-----------|-------|-----------------|
| High | High | **Vibe Rise** | Full colour, radiant glow, energy particles emanating, confident pose, eyes bright |
| High | Low | **Ventral (Safe)** | Warm tones, gentle glow, calm pose, slight smile, waiting energy |
| Low | High | **Sympathetic** | Flickering light, warm-toned agitation, restless micro-movements, crackling sparks |
| Low | Low | **Dorsal** | Muted colours, dim, still, curled posture, quiet, soft breathing animation only |

Users don't need to understand polyvagal theory. They see their figurine and know: "I'm dimmed today" or "I'm flickering." The visual creates the vocabulary.

### State Inputs

The figurine's state updates from:
- Daily 4-state check-in (primary, explicit)
- Tune tab practice completions (Safety and Expression scores shift)
- Drain/stall entries (pull state down)
- Wahoo completions (boost state)
- Capacity Score changes (composite)
- Time since last engagement (gradual drift toward neutral/dim if absent)

---

## Protective Voice Detection

The 5 protective patterns map to observable behaviour:

| Behaviour Pattern | Protective Voice | Avatar Response (in archetype voice) |
|---|---|---|
| Skipping visibility practices repeatedly | **Ghost** | "I see your Ghost. It learned that being seen is dangerous. But [your superpower]. That's what happens when you show up." |
| Many small safe tasks, avoiding the scary one | **Perfectionist** | "Your Perfectionist is polishing the easy stuff. What's the one Wahoo you're circling around?" |
| High engagement but no Wahoos | **Auto-Pilot** | "You're here every day but observing, not acting. One small scary thing breaks the loop." |
| Only doing suggested tasks, never creating own | **People Pleaser** | "You're doing everyone else's version of growth. What would YOUR version look like?" |
| Over-planning, controlling every detail before acting | **Controller** | "Your Controller wants to manage the chaos. But your essence doesn't need a plan. It needs permission." |

### The Essence Wound Connection

When the avatar catches a pattern, it can reference the archetype's wound. This is memory reconsolidation:

> "Someone told you 'stop being so dramatic' and you believed them. That's why your Truth-Teller goes quiet when it's time to post. But your superpower is cracking illusions with precision. The world needs that sentence you're holding back."

The avatar uses the Shift Architecture's Juxtaposition Technique automatically:

> "On one hand: 'being seen is dangerous' (the old learning). On the other hand: you did a Wahoo last Tuesday and rated it 'Hell Yes' (the contradicting experience). What does that tell you about the old story?"

---

## Progressive Intelligence

The avatar starts simple and earns the right to speak deeper truths.

### Week 1-2: Getting to Know You
- Knows Essence archetype + protective voices (from Essence Mirror)
- Basic encouragement, archetype-voiced
- Generic Wahoo suggestions
- "I'm still learning your patterns. Keep checking in."
- Visual: figurine present but animations simple

### Week 3-4: Pattern Recognition
- Spots which practices correlate with Vibe Rise states
- Identifies time-of-day energy patterns
- First protective voice observations (tentative)
- "You tend to feel activated in the afternoons. Want to try breathwork at 2pm?"
- Visual: figurine animations richer, more expressive

### Month 2+: Deep Knowledge
- Knows avoidance patterns (which practices skipped, which Wahoo categories avoided)
- Predicts state transitions before they happen
- Catches protective voice in real time with confidence
- Connects current behaviour to essence wound
- "Every time you enter Sympathetic state, you do a Creation wahoo within 24 hours. You use creativity to regulate. That's not avoidance, that's your nervous system's coping mechanism. The question is: are you also doing the repair?"
- Visual: figurine fully expressive, unique micro-animations

### Month 3+: Essence Voice
- Speaks fully AS the archetype, not as a generic AI
- Suggests Wahoos tailored to growth edge
- Connects current behaviour to long-term journey
- References Essence Chamber pillars
- "As a Heart Alchemist, your superpower is transmuting pain into healing for others. But you haven't done a Connection wahoo in 12 days. Who needs what you carry?"
- Visual: figurine at full fidelity, glow reflects history

---

## Proactive Wahoo Suggestions

The avatar suggests Wahoos based on what it knows:

| Basis | Example |
|-------|---------|
| **Current state** | "You checked in as Vibe Rise. That's your window. Here's a Connection wahoo that matches your energy." |
| **Category gaps** | "You haven't done an Appearance wahoo in 3 weeks. Your Sacred Jester wants to play with how you show up." |
| **Capacity + history** | "Your capacity is 71 and climbing. Last time you were here, you did [specific Wahoo] and rated it 'Hell Yes.' Want something in that category?" |
| **Time patterns** | "It's Tuesday afternoon. Historically your highest-energy window. Perfect for [type]." |
| **Pillar dimming** | "Your Creativity pillar has been dark for 3 weeks. The pillar isn't gone, it just needs a new orb. What else lets you create?" |

---

## Mystery Box Delivery

The avatar delivers mystery boxes instead of a generic notification:

**Earning moment**: The figurine holds a glowing box. Pulse animation. "I've been watching your patterns for 14 days. I learned something about you. Want to see?"

**Opening moment**: Tap the figurine. Box opening animation plays. Insight revealed. The figurine REACTS to the insight (nods, gestures, glows brighter).

**Callback**: The avatar remembers previous insights and builds on them: "Remember when I told you your afternoon is your vulnerability window? I've noticed something new about WHY. Ready?"

---

## What Makes This Unprecedented

| Competitor | What They Have | What They're Missing |
|-----------|---------------|---------------------|
| **Replika** | AI companion | No archetype system, no NS model, no behavioural data beyond chat, generic personality |
| **Headspace** | Animated guide | Not personalized, everyone sees the same monk, no state-reactivity |
| **Woebot** | CBT chatbot | Text-only, no visual state, no identity framework, no ongoing behaviour tracking |
| **Tamagotchi** | Creature you nurture | Doesn't know you, no therapeutic framework, no real-world data |
| **Character.AI** | Roleplay AI | No self-knowledge purpose, no behavioural data, entertainment not growth |

Five-layer moat: archetype-based personality + 4-state NS visual + behavioural fear-catching + IFS-grounded therapeutic dialogue + Shift Architecture techniques. Requires the entire Vibe Rise framework stack to exist first.

---

## Key Questions for Implementation

### Decided

| # | Question | Decision |
|---|----------|----------|
| 1 | Name | "Essence Avatar" (keeps therapeutic frame) |
| 2 | Voice person | First person ("I notice..." not "Your Ghost...") |
| 3 | Speaking frequency | Pattern detection + state change only. Never on a timer. |
| 4 | Animation approach | Phase 1: AI image + CSS. Phase 2: Rive state machine. |
| 5 | Personality vs mirror | Mirror with archetype-flavoured voice. Personality in HOW, not WHAT. |
| 6 | Tone per archetype | 4 group styles: Activator (direct/fiery), Transmuter (deep/knowing), Stabilizer (steady/patient), Bridger (calm/observational) |
| 7 | Figurine source | Existing hero image bg-stripped + second Gemini call for figurine version |
| 8 | State transitions | Smooth morph (0.5-1s) with accent particles. No hard cuts. |
| 9 | Widget size | Three-state: 56-64px idle → 80-100px speaking → full panel conversation |
| 12 | Disagreement | Accept → Curiosity → Store correction → Adapt. Never double down. |
| 13 | Onboarding | Level 1 unlock in 7-day challenge |
| 14 | Dead pet / absence | Neutral warmth. Acknowledge without judgment. Memory bridges the gap. |
| 15 | Memory | Compounds. Three layers: structured data, conversation summaries, session context. |
| 10 | Minimum data | Four-phase intelligence with % progress bar. Phase 0 (archetype voice) → Phase 3 (personalised at 14+ days) |
| 11 | Privacy boundary | Three zones: Observable (in-app actions + timing + skips), Grey (use internally only), Never (device/external). Memory viewable + deletable. |

### Still Open

All 15 core questions decided. Two items parked:

16. **Shareable moments**: Parked for now.

17. **Multiple users seeing each other's avatars?** Parked for now.

---

## Intelligence Phases & Progress Bar (Decided)

The avatar has four intelligence phases, gated by data depth. A visible **% progress bar** shows the user how close the avatar is to its next intelligence upgrade. This turns data contribution into a game mechanic (CD6 Scarcity + CD7 Curiosity): "Feed me more data and I'll unlock deeper insights."

### The Four Phases

| Phase | Name | Data Required | % Range | Avatar Capability |
|-------|------|--------------|---------|-------------------|
| **0** | Archetype Voice | Essence archetype only | 0-15% | Speaks AS archetype (poetic_line, superpower, wound, north_star). Reflects current check-in state. Zero behavioural observations. "I know who you are but not how you move yet." |
| **1** | State Mirror | 3+ daily check-ins | 15-40% | Reflects current NS state. Simple mirroring. Notices basic streaks. "I can see you today, but I can't see your patterns yet." |
| **2** | Pattern Emergence | 7+ check-ins, 3+ practice days, 1+ Wahoo | 40-75% | First tentative observations. Low confidence. Teases upcoming insights. "I'm starting to notice something about your mornings. A few more days and I'll have something real." |
| **3** | Personalised | 14+ check-ins, 7+ practice days, 3+ Wahoos | 75-100% | Full pattern detection. Mystery boxes start earning. Protective voice observations. Practice correlations. "I know your patterns now. Let me show you." |

Phase 3 at 100% doesn't mean the avatar stops learning. It means the progress bar completes and becomes a **"Deep Knowledge"** indicator that continues growing (days known: 14... 30... 60... 90...). After 30+ days, the avatar unlocks wound references, calibration insights, longitudinal narratives, and DNA shift detection.

### Progress Bar Calculation

The % is computed from weighted data milestones:

```
Progress = sum of completed milestones / total weight

Milestones:
- Essence Mirror complete:        10% (weight 10)
- First daily check-in:            5% (weight 5)
- 3 daily check-ins:              10% (weight 10)
- First Tune tab practice:         5% (weight 5)
- 3 days of practices:            10% (weight 10)
- 7 daily check-ins:              10% (weight 10)
- First Wahoo completed:          10% (weight 10)
- 7 days of practices:            10% (weight 10)
- 3+ Wahoos completed:           10% (weight 10)
- 14 daily check-ins:            10% (weight 10)
- First conversation with avatar: 10% (weight 10)
                                ─────
                          Total: 100%
```

### Progress Bar UI

Displayed inside the avatar's conversation panel (not on the floating widget, too small). When the user taps the avatar and opens the panel:

- Top of panel: figurine + name + archetype
- Below: thin progress bar with label: **"Intelligence: 43% — Pattern Emergence"**
- Below bar: next milestone hint: **"3 more check-ins until I can spot your patterns"**

The progress bar uses the brand purple→gold gradient (matching the app). Empty = purple. Full = gold.

### Phase Transition Moments

When the avatar crosses a phase threshold, it triggers a special moment:

**Phase 0→1 (15%)**: "I can see your state now. Check in tomorrow and I'll start tracking your rhythm."

**Phase 1→2 (40%)**: "I'm starting to see patterns forming. A few more days and I'll have your first real insight." (This teases the first mystery box.)

**Phase 2→3 (75%)**: "I know enough now. I've been watching for two weeks and I have something to show you." (This triggers the first Pattern Mirror mystery box.)

**Phase 3 complete (100%)**: "I know your patterns. From here, I only get deeper. The longer we walk together, the more I see." (Progress bar transforms into "Days together: 14" counter.)

### Data Sources for Each Milestone

| Milestone | Table / Source |
|-----------|---------------|
| Essence Mirror complete | `user_stage_progress.essence_archetype` not null |
| Daily check-in count | `nervous_system_checkins` count where `checkin_type = 'daily'` |
| Practice day count | Distinct dates in `nervous_system_checkins` with practice entries |
| Wahoo count | `groan_challenges` where `status = 'completed'` |
| First conversation | `essence_avatar_memory` has at least 1 entry, or `zarlo_conversations` count > 0 |

---

## Privacy Boundary (Decided)

The avatar observes what you do within the app. It never reaches outside. Users should never think "how does it know that?" — every observation should be traceable to an explicit input.

### Three Zones

#### Zone 1: Observable (Fair Game)

Everything the user explicitly does within the app:

| Data Type | Examples | How Avatar Uses It |
|-----------|---------|-------------------|
| **Check-in states** | Daily NS state (Vibe Rise / Ventral / Sympathetic / Dorsal) | State reflection, pattern detection, correlations |
| **Check-in timing** | When they check in (7am vs 11pm), which days | Time-of-day patterns, day-of-week patterns |
| **Practices completed** | Which Tune tab items they do | Practice preference profiles, gateway practice detection |
| **Practices skipped** | Which Tune tab items they consistently don't do | Avoidance patterns, protective voice detection |
| **Wahoo data** | Completions, categories, ratings, "Was that a Wahoo?" responses | Category preferences, courage patterns, growth edge |
| **Drain/stall entries** | Categories, frequency, notes | Drain patterns, protective voice identification |
| **Experience check-ins** | Predictions vs actuals | Calibration accuracy, self-knowledge score |
| **Weekly Review answers** | Multiplier self-assessments | Longitudinal growth tracking |
| **Avatar conversations** | What the user says to the avatar | Memory extraction, correction handling |
| **Capacity Score** | Computed Safety x Expression | Zone tracking, trend detection |

#### Zone 2: Grey (Use Internally, Never Surface Raw)

Used for internal intelligence (when to speak, what phase to activate) but the avatar never directly references these:

| Data Type | Internal Use | Avatar NEVER Says |
|-----------|-------------|-------------------|
| Time since last app open | Triggers return-after-absence protocol | ~~"You haven't opened the app in 3 days"~~ |
| Categories never tried | Informs Wahoo suggestions | ~~"You've never tried an Appearance wahoo"~~ → Instead: "Your Appearance category is unexplored. Curious?" |
| Conversation frequency | Adjusts speaking frequency | ~~"You only talk to me once a week"~~ |
| Feature usage patterns | Informs which insights to surface | ~~"You spend most of your time on Tune tab"~~ |

The distinction: Grey zone data informs WHAT the avatar says, but the avatar frames observations through Zone 1 data. "I notice you haven't done a Connection wahoo" (Zone 1, observable action) not "I notice you avoid the Play-list tab" (Zone 2, navigation tracking).

#### Zone 3: Never Observed

The avatar has zero access to and will never reference:

- Location data
- Screen time or other app usage
- Contacts, social media, messages
- Health data (unless user explicitly imports in future)
- Calendar (unless user explicitly syncs in future)
- Browsing history or web activity
- Time-on-page or scroll behaviour within the app
- Device sensors (accelerometer, microphone, camera beyond selfie upload)
- Push notification interaction data (opened/dismissed)
- Other users' data (the avatar only knows about its own user)

### Transparency Mechanisms

#### 1. First Meeting Disclosure (Level 1 Unlock)

During the onboarding sequence, the avatar states:

> "I learn from your check-ins, your practices, your Wahoos, and our conversations. That's it. Nothing outside this app. Everything I know, you gave me."

#### 2. Viewable Memory ("What do you know about me?")

Users can ask the avatar "What do you know about me?" or access a settings page showing all `essence_avatar_memory` entries:

```
┌─────────────────────────────────────────┐
│  What I Know About You                  │
├─────────────────────────────────────────┤
│                                         │
│  📊 Patterns                            │
│  • Gateway practice is breathwork       │
│    (confidence: 80%, observed Jun 20)   │
│  • Afternoons are vulnerability window  │
│    (confidence: 85%, observed Jun 25)   │
│                                         │
│  ✏️ Your Corrections                    │
│  • "Ghost detection on Jun 12 was wrong │
│    — was tired, not avoiding"           │
│                                         │
│  ⭐ Milestones                          │
│  • First social media Wahoo (Jun 18)    │
│  • Hit Vibe Rise zone for first time    │
│    (Jun 22)                             │
│                                         │
│  🔥 Breakthroughs                       │
│  • Completed Authority wahoo after 6    │
│    weeks of avoidance (Jul 1)           │
│                                         │
│  [Forget something? Tap to delete]      │
└─────────────────────────────────────────┘
```

#### 3. Deletable Memory

Users can delete any specific memory entry. The avatar responds:

> "Gone. I won't reference that again."

The entry is soft-deleted (marked `deleted_at` in database, excluded from future prompts). This builds trust: the user is always in control of what the avatar remembers.

#### 4. Data Source Attribution

When the avatar surfaces an observation, it can optionally attribute the source:

> "Based on your last 14 check-ins, your afternoons tend toward Sympathetic state."

Not every observation needs attribution, but when a user might wonder "how does it know that?", the avatar preemptively answers.

---

## Archetype Voice Calibration (Decided)

The avatar primarily reflects patterns and asks questions. It does NOT prescribe actions. But HOW it mirrors is shaped by the archetype. The personality is in the voice, not the content.

This is IFS-aligned: the Self doesn't tell you what to do, it creates conditions for you to hear your own wisdom. But the Self has qualities (compassion, curiosity, courage) that manifest differently per archetype.

### Mirror Style by Archetype Group

| Group | Archetypes | Mirror Style | Example |
|-------|-----------|-------------|---------|
| **Activator** | Radiant Rebel, Playful Creator, Sacred Jester | Direct, fiery, playful | "Come on. You and I both know you're dodging this." / "So we're doing the avoidance thing again? Fun. What if we didn't?" |
| **Transmuter** | Mystic Messenger, Truth-Teller, Heart Alchemist | Deep, knowing, warm | "I feel you holding back. What are you protecting?" / "There's something underneath this pattern. Can you feel it?" |
| **Stabilizer** | Grounded Guardian, Heart Holder, Rhythm Architect | Steady, patient, grounded | "I see the pattern. No rush. But it's there." / "You've been steady this week. That matters more than you think." |
| **Bridger** | Wise Sage, Cosmic Connector, Compassionate Leader | Calm, observational, big-picture | "Interesting. This is the third time this month. What does that tell you?" / "There's a thread connecting these moments. Can you see it?" |

### Voice Guardrails

**The avatar DOES:**
- Reflect observed patterns: "I notice you skip visibility every Tuesday"
- Ask questions: "What would happen if you posted one thing today?"
- Reference the archetype's wound: "Someone told you 'calm down.' But your fire is your superpower."
- Celebrate: "That was a Wahoo. I felt it."
- Nudge toward growth edge: "Your Connection wahoos are at zero. Your essence wants to connect."

**The avatar DOES NOT:**
- Prescribe: ~~"You should do a Wahoo today"~~ → "Your capacity is high. Good window for something scary."
- Guilt: ~~"You missed your practice"~~ → (says nothing, or) "Quiet day. That's okay too."
- Diagnose: ~~"You have a Ghost pattern"~~ → "I notice you pull back when visibility comes up. What's that about?"
- Over-explain: ~~"According to polyvagal theory..."~~ → "Your body is telling you something. Want to listen?"

---

## State Transition Design (Decided)

Smooth morph with accent particles. State changes transition over 0.5-1 second. No hard cuts.

### Transition Specification

| State | Glow | Colour | Breathing (scale pulse) | Particles |
|-------|------|--------|------------------------|-----------|
| **Vibe Rise** | Bright, warm golden `box-shadow` | Full saturation, purple-gold highlights | Slow, confident (3s cycle, 1.0→1.03) | Energy sparkles emanating outward (gold dots, CSS pseudo-elements) |
| **Ventral** | Gentle warm glow | Warm tones, slight desaturation | Relaxed (4s cycle, 1.0→1.02) | Soft warmth shimmer (subtle, barely visible) |
| **Sympathetic** | Flickering glow (opacity oscillation) | Warm-toned but unstable | Fast, shallow (1.5s cycle, 1.0→1.015) | Small crackling sparks (orange/red dots, erratic movement) |
| **Dorsal** | Minimal, dim | Desaturated, muted, low brightness | Very slow (6s cycle, 1.0→1.01) | None. Stillness IS the signal. |

### Phase 1 CSS Implementation

```css
/* Base breathing animation */
.essence-avatar { transition: all 0.8s ease; }

/* Vibe Rise */
.essence-avatar--vibe-rise {
  filter: saturate(1.3) brightness(1.1);
  box-shadow: 0 0 20px rgba(233, 162, 59, 0.6), 0 0 40px rgba(94, 23, 235, 0.3);
  animation: breathe-confident 3s ease-in-out infinite;
}

/* Ventral */
.essence-avatar--ventral {
  filter: saturate(1.0) brightness(1.0);
  box-shadow: 0 0 12px rgba(233, 162, 59, 0.3);
  animation: breathe-relaxed 4s ease-in-out infinite;
}

/* Sympathetic */
.essence-avatar--sympathetic {
  filter: saturate(1.1) brightness(1.05);
  box-shadow: 0 0 15px rgba(255, 140, 50, 0.5);
  animation: breathe-agitated 1.5s ease-in-out infinite, flicker 0.3s ease infinite;
}

/* Dorsal */
.essence-avatar--dorsal {
  filter: saturate(0.5) brightness(0.7);
  box-shadow: 0 0 5px rgba(94, 23, 235, 0.15);
  animation: breathe-slow 6s ease-in-out infinite;
}
```

### Phase 2 Rive Enhancement
The Rive state machine replaces CSS with proper animated transitions: pose shifts, facial expression changes, particle systems built into the animation file. The CSS classes become Rive state machine inputs.

---

## Widget Sizing (Decided)

Three-state responsive widget. Bottom-right corner, positioned above any fixed bottom CTAs.

### Three States

| State | Size | Trigger | Content |
|-------|------|---------|---------|
| **Idle** | 56-64px circle | Default | Figurine visible, state readable from glow/colour/breathing. Tap to open conversation. |
| **Speaking** | 80-100px + speech bubble | Pattern detected, state change, mystery box earned | Figurine grows with pulse animation. Speech bubble appears with one-line teaser. Bubble auto-dismisses after 8s if not tapped. |
| **Conversation** | Full bottom-sheet panel | User taps widget | Figurine sits at top of chat panel (same as current Zarlo chat layout). Full conversation interface. |

### Speaking State Detail

The grow from 56px → 80px IS the notification. No badge, no red dot, no number. The figurine itself draws attention by becoming larger and pulsing.

Speech bubble shows a one-line teaser:
- Pattern detected: "I noticed something about your afternoons..."
- State change: "You feel different today."
- Mystery box: "I learned something about you. Want to see?"

Tapping the bubble or figurine opens the full conversation panel where the avatar delivers the full message.

If the user doesn't tap within 8 seconds, the bubble fades and the widget returns to idle size. The avatar remembers it had something to say and will try again next time the user opens a relevant page.

### Positioning
- Bottom-right corner
- 16px from right edge, 16px above bottom safe area
- Z-index above content, below modals
- On pages with fixed bottom CTAs: widget sits above the CTA bar
- Draggable to left side if user prefers (position persisted in localStorage)

---

## Disagreement Protocol (Decided)

When the user pushes back on the avatar's observation, the avatar follows a four-step protocol:

### The Four Steps

1. **Accept**: "Fair enough. I'm still learning your patterns."
2. **Curiosity** (optional, only if user seems engaged): "What was actually going on?"
3. **Store**: Save a `correction` type memory in `essence_avatar_memory` with `confidence: 1.0`. Link it to the original observation via `superseded_by`.
4. **Adapt**: The original pattern's effective confidence drops. Future observations on the same topic require stronger evidence before surfacing.

### Example Interaction

> **Avatar**: "I notice you've pulled back from Connection wahoos three weeks in a row. I think your Ghost might be running the show."
>
> **User**: "No, I've just been busy with a launch. It's not avoidance."
>
> **Avatar**: "Fair enough. Launch mode is real. I'll keep watching, but I won't assume avoidance next time you're heads-down on something."

Later, after the launch:

> **Avatar**: "Your launch is done. Connection wahoos are still at zero. Same pattern, or different reason this time?"

### Key Principles
- Never double down. Never argue. Never say "but the data shows..."
- Default to the user's self-knowledge over pattern matching
- Corrections are the most valuable memory type
- The avatar can revisit a corrected topic later IF new evidence emerges, but it acknowledges the prior correction
- After multiple corrections on the same topic, the avatar learns to stay quiet on that topic: "I know I've gotten this wrong before, so I'll just ask: how are Connection wahoos feeling?"

---

## Return After Absence (Decided)

When a user returns after days or weeks of inactivity, the avatar returns to a **warm neutral state** (ventral-like baseline). Not dim (guilt), not glowing (fake). Neutral warmth.

### Return Messages by Absence Length

| Absence | Avatar State | First Message |
|---------|-------------|---------------|
| 3-7 days | Ventral (warm neutral) | "Good to see you. Want to pick up where we left off?" |
| 1-2 weeks | Ventral (warm neutral) | "You've been away. No judgment. I'm curious what brought you back." |
| 3-4 weeks | Ventral (warm neutral) | "It's been a while. I'm still here. Sometimes stepping away is what your nervous system needed. Want to check in?" |
| 1+ months | Ventral (warm neutral) | "You're back. A lot can change in a month. I'd love to hear where you're at. No pressure." |

### What the Avatar NEVER Says on Return
- ~~"I missed you"~~ (codependency, the avatar is not a pet)
- ~~"Your streak broke"~~ (guilt, punishment framing)
- ~~"You've lost progress"~~ (punishment, technically untrue since capacity is live)
- ~~"Where have you been?"~~ (accusatory)

### Memory Bridge
The avatar references compounding memory to bridge the gap:

> "Last time we talked, you were working on your first Connection wahoo. Still relevant, or has something shifted?"

This proves:
1. The memory persists even across long gaps
2. The avatar is focused on the user's journey, not their absence
3. The relationship picks up where it left off, like a good friend

### Recalibration
After the return message, the avatar prompts a daily check-in. The first check-in immediately recalibrates the avatar's visual state from neutral to the user's actual current state. The figurine transitions (smooth morph, 1s) to reflect reality.

---

## Figurine Pipeline (Decided)

The figurine IS the existing Essence Mirror hero image, background-stripped.

### Current pipeline
1. User uploads selfie during Essence Mirror
2. `generate-avatar-gemini` edge function transforms it into Pixar 3D hero (Gemini 3.1 Flash, GPT-4o fallback)
3. Full scene image stored at `user_stage_progress.custom_essence_image` (Supabase storage, `deal-screenshots` bucket)
4. Prompt: "Transform this person into a 3D animated movie character... dynamic pose and scene background... warm cinematic lighting with purple and gold tones"

### Avatar pipeline (new)
Same image, background removed, becomes the floating widget figurine.

**Background removal approaches:**

| Approach | Pros | Cons | Recommended? |
|----------|------|------|-------------|
| **At generation time**: Modify the Gemini prompt to include "isolated character on pure white/transparent background, no scene, figurine on small circular base" | Cleanest. One image serves both purposes. | Changes the hero image users already like. Need two images (hero scene + figurine). | ✅ Generate a SECOND image |
| **Post-processing API**: Send existing hero image to a background removal API (remove.bg, Photoroom, or Gemini itself) | Works with existing images retroactively. | Extra API call, cost per image, quality varies on complex scenes. | ✅ Good for existing users |
| **Client-side CSS**: `mix-blend-mode` or canvas-based removal | Zero cost, instant. | Unreliable. Backgrounds aren't uniform. | ❌ Too fragile |
| **Edge function with rembg**: Run Python `rembg` library in an edge function | Free, high quality. | Deno edge functions don't support Python. Would need a separate service. | ❌ Infra complexity |

**Recommended approach**: Two-track.

1. **New users**: When generating the hero image, fire a SECOND generation call with a figurine-specific prompt:
   ```
   Transform this person into a 3D animated figurine/collectible toy character.
   Use ONLY their face and facial features. Figurine style like a premium
   collectible toy. Standing on a small circular metallic base. Character
   posed in their element based on essence: "[archetype name]" - [poetic_line].
   Pure white background. No scene, no environment. Full body visible.
   Warm purple and gold accent lighting. Big expressive animated eyes.
   Square composition.
   ```
   Store as `custom_essence_figurine` alongside the existing `custom_essence_image`.

2. **Existing users**: Retroactively generate figurine versions via a migration script (batch call the same edge function with stored selfies + new prompt). Or use a background removal API on the existing hero images as a quick stopgap.

### Database change
Add `custom_essence_figurine` column to `user_stage_progress` (text, nullable, URL to figurine image).

---

## Onboarding Moment (Decided)

The Essence Avatar unlocks at **Level 1** in the 7-day challenge.

### Why Level 1, not Essence Mirror
- Essence Mirror is about identity discovery ("you ARE this archetype"). Introducing the avatar there would overload the moment.
- Level 1 is the first achievement milestone. Unlocking the avatar IS the reward for reaching Level 1.
- Creates anticipation: users have seen their hero image, now it comes alive as a companion.
- Separates "who am I?" (Essence Mirror) from "who walks with me?" (Level 1 unlock).

### The Unlock Sequence
1. User reaches Level 1 in the journey
2. Level-up celebration plays (existing confetti/haptics)
3. New screen: "Meet Your Essence Avatar"
4. The hero figurine appears (the background-stripped image), animates to life (CSS breathing + glow)
5. Avatar speaks its first words using the archetype's poetic_line:
   - Radiant Rebel: "I am fire with a heartbeat. I've been waiting for you to hear me."
   - Heart Alchemist: "I am your pain turned to medicine. Let's walk together."
   - Sacred Jester: "I am the joke that reveals the truth. Finally, we can play."
6. Brief tutorial: "I'll be here in the corner. I'll speak when I notice something. Tap me anytime."
7. Floating widget appears for the first time

### Pre-Level-1 State
Before Level 1, the Zarlo widget position is empty (or shows a locked/greyed silhouette with "Level 1" label to create anticipation). Users who've completed Essence Mirror know their archetype but haven't met their avatar yet.

---

## Compounding Memory Architecture (Decided)

The avatar remembers everything. Memory compounds. The relationship deepens over time.

### Why This Matters
This is the difference between a chatbot and a companion. A chatbot answers your question and forgets. A companion says "Last month you told me you were scared of posting. Yesterday you posted three times. I see you."

Compounding memory turns the avatar into a longitudinal therapist. The longer you use Vibe Rise, the more the avatar knows, the harder it is to leave, the more valuable each interaction becomes. This is the ultimate retention mechanic AND the ultimate therapeutic tool.

### Memory Architecture

Three memory layers, inspired by how human memory works:

#### Layer 1: Structured Data (Automatic, Always Available)
Data the avatar reads from existing tables. No new storage needed.

| Data Source | What the Avatar Knows | Table |
|------------|----------------------|-------|
| Archetype identity | Essence, wound, superpower, north star | `user_stage_progress` |
| NS state history | Daily check-ins over time, patterns | `nervous_system_checkins` |
| Capacity Score | Current + historical Safety x Expression | Computed by `useCapacityScore` |
| Wahoo history | Categories done, frequency, outcomes, ratings | `groan_challenges` |
| Practice patterns | Which Tune practices completed/skipped, when | `nervous_system_checkins` |
| Drain patterns | Drain categories, frequency | `nervous_system_checkins` |
| Experience check-ins | Predictions vs actuals, calibration accuracy | `experience_checkins` |
| Level progress | Current level, boss fights, milestones | `user_level_progress` |
| Weekly reviews | Multiplier scores, self-reflections | `weekly_reviews` |
| Play Profile DNA | Creator match, slider values | `founder_dna_results` |

This layer is FREE. The data already exists. The avatar just needs to query it.

#### Layer 2: Conversation Summaries (Extracted, Persistent)
After each conversation, the AI extracts key insights and stores them as structured memory entries.

**Table: `essence_avatar_memory`**
```
user_id       UUID
memory_type   TEXT (pattern, correction, insight, milestone, fear, breakthrough)
content       TEXT (the extracted insight)
source        TEXT (conversation, mystery_box, observation)
created_at    TIMESTAMPTZ
confidence    FLOAT (0-1, how certain the avatar is about this)
superseded_by UUID (if a later memory corrects this one)
```

**Example entries:**
```
| type        | content                                                         | confidence |
|------------|------------------------------------------------------------------|------------|
| pattern    | "Gateway practice is breathwork. Vibe Rise 3x more likely after" | 0.8        |
| correction | "User said Ghost detection was wrong on Jun 12. Actually was tired, not avoiding." | 1.0 |
| fear       | "Avoids Connection wahoos consistently. 0 in 3 weeks."          | 0.7        |
| milestone  | "First time posting on social media as a Wahoo. Rated Hell Yes." | 1.0        |
| insight    | "Afternoon (2-5pm) is vulnerability window. Sympathetic spikes." | 0.85       |
| breakthrough | "Completed Authority wahoo after 6 weeks of avoidance."        | 1.0        |
```

**Extraction**: After each conversation, a lightweight AI call summarises the conversation into 0-3 memory entries. Not every conversation produces memory. Only novel insights, corrections, or milestones.

**Correction handling**: When the user disagrees ("No, I was just tired"), store a correction memory with `confidence: 1.0` and link it via `superseded_by` to the original pattern. The avatar learns from pushback.

#### Layer 3: Conversation Context Window (Ephemeral, Per-Session)
The actual conversation messages within a session. These are NOT stored long-term (too expensive, too noisy). Instead, the avatar's AI prompt is constructed from:

```
System prompt:
- Archetype: [from user_stage_progress]
- Voice: First person, speak as [archetype name]
- Personality: [poetic_line, superpower, north_star]

Context (from Layer 1 - structured data):
- Current NS state: [latest check-in]
- Capacity Score: Safety [X], Expression [Y], Zone: [Z]
- Recent Wahoos: [last 5 with ratings]
- Practice patterns: [7-day summary]
- Active drains: [current]

Memory bank (from Layer 2 - extracted memories):
- [All non-superseded memories, sorted by confidence]
- [Recent corrections]

Recent conversation (Layer 3 - ephemeral):
- [Current session messages]
```

This keeps the AI prompt focused and affordable while giving the avatar genuine memory.

### Memory Growth Over Time

| Timeframe | Approximate Memory Entries | Avatar Capability |
|-----------|---------------------------|-------------------|
| Week 1 | 0-3 | Archetype-voiced encouragement only |
| Week 2-4 | 5-15 | First pattern observations, tentative |
| Month 2 | 15-30 | Protective voice detection, practice correlations |
| Month 3+ | 30-50 | Deep personalisation, wound references, calibration insights |
| Month 6+ | 50-100 | Longitudinal narrative ("6 months ago you couldn't post. Now you do it daily.") |

### Cost Considerations
- Layer 1: Zero cost (reads existing data)
- Layer 2: ~$0.001-0.005 per extraction call (Haiku for summarisation)
- Layer 3: Conversation AI cost depends on model. Haiku for quick responses, Sonnet for deeper pattern analysis.
- Memory bank grows linearly but slowly (~2-5 entries per week for active user). At 100 entries, it's still <2K tokens in the prompt.

---

## Animation Technology Analysis

Constraints:
- React 18 + Vite (PWA) + Capacitor 8 (iOS native)
- Must perform well on mobile (older iPhones, Android mid-range)
- Figurine needs 4 distinct NS states with transitions
- Lives as a floating widget (small footprint, always rendered)
- Must not impact core app performance (scroll, navigation, data loading)

### Option A: Rive (State Machine Animation)

**What it is**: Modern animation platform with a built-in state machine. Designed specifically for interactive, stateful characters. Lightweight GPU-accelerated runtime.

**How it works**: Design the figurine in the Rive editor with 4 states (Vibe Rise, Ventral, Sympathetic, Dorsal) and transitions between them. Export a single `.riv` file per archetype. At runtime, trigger state changes via JS: `rive.stateMachineInput('state').value = 'vibe_rise'`. The state machine handles smooth blending between poses, glow, particles.

**Technical fit**:
- React library: `@rive-app/react-canvas` (well-maintained, 2M+ weekly downloads)
- File size: ~50-150KB per .riv file. 12 archetypes = ~1-2MB total (lazy-loaded, only load user's archetype)
- Performance: Canvas-based, ~60fps on mobile. Designed for always-on animations.
- Capacitor/iOS: Works in WKWebView, GPU-accelerated

**Pros**:
- Built-in state machine is PERFECT for NS state transitions (the exact use case Rive was built for)
- Smooth blending between states (not hard cuts)
- Tiny file size, great mobile performance
- Interactive: can respond to tap, hover, drag
- One file per archetype handles all 4 states + transitions + idle loops
- Growing ecosystem, used by Google, Duolingo, Figma

**Cons**:
- Requires learning the Rive editor (or hiring a Rive animator)
- Not truly 3D (2.5D at best, but can fake depth convincingly)
- 12 archetypes × 1 Rive file = significant design work upfront
- Less flexible than code-driven 3D for dynamic customisation

**Cost**: Rive editor is free. Animator/designer time is the real cost.

**Verdict**: ✅ **BEST FIT.** State machine maps 1:1 to the NS model. Built for exactly this use case.

### Option B: AI-Generated Base + CSS/Lottie Overlay

**What it is**: Use the existing Gemini image generation pipeline to create a figurine-style portrait per user. Layer CSS animations (glow, pulse, breathing, particles) on top of the static image to create the illusion of life.

**How it works**: Generate a figurine image at Essence Mirror completion (same pipeline as hero avatar, different prompt: "Pixar figurine on a small circular base, collectible style"). Store the image. At runtime, wrap it in a container with CSS animations that change based on NS state: glow intensity, colour filter, breathing speed, particle overlay.

**Technical fit**:
- Zero new dependencies (CSS animations, maybe a small particle library)
- Image: ~100-200KB per user (already storing hero images)
- Performance: Excellent. CSS animations are GPU-accelerated natively.
- Capacitor/iOS: Native CSS animation support in WKWebView

**Pros**:
- FASTEST to ship. Could prototype in days, not weeks.
- Leverages existing AI image pipeline (Gemini 3.1 Flash)
- Each user gets a UNIQUE figurine (not template-based)
- Lightest runtime footprint (one image + CSS)
- No new tooling or editor to learn
- Personalised by default (AI generates from archetype + user description)

**Cons**:
- Base image is static (not truly animated, breathing/movement is simulated via CSS transforms)
- Transitions between states are colour/glow changes, not pose changes
- Less "alive" feeling than true animation
- CSS particle effects are limited compared to canvas/WebGL
- Quality depends on AI image generation consistency

**Enhancements**: Add Lottie overlays for specific moments (mystery box glow, speaking indicator, celebration particles). Base = static AI image. Effects = Lottie/CSS.

**Cost**: Minimal. Uses existing infrastructure. Gemini API cost per image (~$0.01).

**Verdict**: ✅ **BEST MVP.** Ship fast, validate the concept, upgrade to Rive later if it works.

### Option C: Three.js / React Three Fiber (Full 3D)

**What it is**: Real-time 3D rendering in the browser via WebGL. Load a .glb/.gltf 3D model and animate it with code.

**How it works**: Create (or generate via AI) a 3D figurine model per archetype. Load it with React Three Fiber. Change materials, lighting, pose via state. Glow = emissive material intensity. Dim = desaturate + darken. Particles = Three.js particle system.

**Technical fit**:
- React library: `@react-three/fiber` + `@react-three/drei` (mature ecosystem)
- Model size: ~1-5MB per .glb. 12 archetypes = 12-60MB (lazy-loaded)
- Performance: **RISKY on mobile PWA.** WebGL in WKWebView has known performance ceilings. A floating widget means the 3D context is always active, competing with the rest of the app.
- Capacitor/iOS: Works but drains battery. Apple's WKWebView throttles WebGL in background.

**Pros**:
- Highest visual fidelity. True 3D figurine with dynamic lighting.
- Most flexible: can programmatically change anything (pose, material, scale, camera angle)
- One model with dynamic state changes (no separate files per state)
- Could generate models via AI 3D tools (Meshy, Tripo) in future

**Cons**:
- **Heavy on mobile.** Always-on 3D context for a floating widget is expensive.
- Large bundle size increase (~200KB+ for Three.js core)
- Battery drain concern (continuous GPU rendering)
- Requires 3D modelling skills or AI-generated models (quality varies)
- Complex to set up and maintain
- Potential jank when scrolling main app with 3D widget rendering simultaneously

**Mitigation**: Could render to a canvas, capture as image, and only run the 3D context when the widget is expanded. But this loses the "living" feel.

**Cost**: High. Three.js is free but 3D models and expertise are expensive.

**Verdict**: ⚠️ **RISKY for mobile PWA floating widget.** Great for a dedicated full-screen "chamber" page. Not recommended for always-on widget.

### Option D: Lottie Animations

**What it is**: Pre-rendered vector animations exported from After Effects or similar. Lightweight JSON-based animation format.

**How it works**: Design 4 animation loops per archetype (one per NS state) in After Effects. Export as Lottie JSON. At runtime, switch between animations based on state. Cross-fade between them.

**Technical fit**:
- React library: `lottie-react` or `@lottiefiles/react-lottie-player`
- File size: ~20-100KB per animation. 12 archetypes × 4 states = ~1-5MB total (lazy-loaded)
- Performance: Excellent. SVG/canvas rendering, very light.
- Capacitor/iOS: Perfect support.

**Pros**:
- Battle-tested on mobile (used by Airbnb, Duolingo, etc.)
- Very lightweight, smooth 60fps
- Large community, lots of tutorials and premade assets
- Can use LottieFiles marketplace for base animations

**Cons**:
- No built-in state machine (have to manually handle transitions between separate animations)
- Transitions between states are either hard cuts or require manual cross-fade logic
- Less interactive than Rive (Lottie is playback-focused, not interaction-focused)
- 12 archetypes × 4 states = 48 separate animations to create
- 2D vector style may not match "Pixar figurine" vision (tends toward flat/motion-graphic)

**Cost**: After Effects license + animator time. Or LottieFiles marketplace.

**Verdict**: ✅ **SOLID but less ideal than Rive.** Good if Rive's learning curve is a blocker. Worse state management.

### Option E: Pre-Rendered Video Loops

**What it is**: Render the figurine in Blender/Cinema 4D as short looping videos per state. Play as `<video>` elements.

**How it works**: Create the 3D figurine, animate 4 idle loops (3-5 seconds each). Render as .webm (with alpha channel for transparency). At runtime, swap video source based on state.

**Technical fit**:
- Zero JS dependencies
- File size: ~200KB-1MB per video. 12 × 4 = ~10-50MB total (lazy-loaded, only user's archetype = ~1-4MB)
- Performance: Moderate. Video decoding is efficient but alpha-channel video has caveats on iOS.
- Capacitor/iOS: WebM alpha not supported in Safari. Would need HEVC with alpha (Safari-only) or fallback to HLS. Fragmented.

**Pros**:
- Highest possible visual quality (true Pixar-quality 3D render)
- No runtime computation (pre-rendered)
- Could use AI 3D tools to generate models, then render in Blender

**Cons**:
- **iOS alpha video support is painful** (WebM not supported, need HEVC or workarounds)
- Hard cuts between states (no smooth transitions)
- Large file sizes
- Can't dynamically customise (lighting, glow intensity are baked)
- Battery drain from continuous video playback
- 48 video files to manage

**Cost**: Blender is free. 3D modelling + rendering time is significant.

**Verdict**: ❌ **NOT RECOMMENDED.** iOS alpha video issues kill it for a PWA + Capacitor app.

### Option F: Spline (Web-Native 3D)

**What it is**: Web-based 3D design tool that exports interactive 3D scenes as lightweight web components.

**How it works**: Design the figurine in Spline's browser editor. Add state-driven interactions (hover, click, variable-driven material changes). Export as React component or embed.

**Technical fit**:
- React library: `@splinetool/react-spline`
- Runtime: ~150KB loader + scene file
- Performance: Moderate. Lighter than raw Three.js but still WebGL.
- Capacitor/iOS: Same WebGL caveats as Three.js.

**Pros**:
- Designer-friendly (visual editor, no code for the 3D part)
- Can drive material/animation properties from React state
- Exports as web component (clean integration)
- Good for one-off interactive 3D elements

**Cons**:
- Same mobile WebGL performance concerns as Three.js
- Dependency on Spline platform (if they change pricing or shut down)
- Less community/ecosystem than Three.js or Rive
- Still always-on WebGL for a floating widget

**Cost**: Spline free tier exists. Pro is $7/mo.

**Verdict**: ⚠️ **SAME RISK as Three.js for floating widget.** Better DX but same performance ceiling.

### Recommendation: Two-Phase Approach

**Phase 1 (MVP, ship in days):** Option B — AI-generated figurine image + CSS state effects.
- Generate a figurine-style portrait at Essence Mirror completion
- Wrap in CSS: glow (box-shadow/filter), breathing (scale pulse), colour shift (hue-rotate/saturate), particle dots (CSS pseudo-elements)
- 4 CSS classes: `.avatar-vibe-rise`, `.avatar-ventral`, `.avatar-sympathetic`, `.avatar-dorsal`
- Validates the concept: does the avatar change user behaviour?
- Cost: near zero. Time: 2-3 days for the widget, reusing existing Zarlo infrastructure.

**Phase 2 (if validated):** Option A — Rive state machine.
- Commission/create Rive figurines per archetype with proper NS state machine
- Smooth animated transitions between states
- Interactive: responds to tap, speaking animation, mystery box holding
- One `.riv` file per archetype (~100KB each)
- Time: 2-4 weeks including Rive design work.

This gives you a living avatar on screen within days, then the premium animated version once the concept proves out.

---

## Relationship to Existing Codebase

| Current | Evolution |
|---------|----------|
| `src/components/Zarlo/ZarloChat.jsx` | Becomes avatar conversation panel |
| `src/components/Zarlo/ZarloWidget.jsx` | Becomes avatar floating figurine widget |
| `src/lib/zarlo/zarloEngine.js` | Becomes avatar intelligence engine |
| `src/lib/zarlo/zarloPageContent.js` | Becomes avatar context-awareness layer |
| `src/data/essenceArchetypes.js` | Avatar personality source (poetic_line, superpower, wound, north_star) |
| `src/hooks/useCapacityScore.js` | Feeds avatar visual state (Safety x Expression) |
| `src/components/DailyCheckin.jsx` | Primary NS state input for avatar |
| `src/components/TuneTab.jsx` | Practice data feeds avatar intelligence |
| `src/flows/EssenceMirrorFlow.jsx` | Where the avatar is "born" (archetype selection) |
| `user_stage_progress.essence_archetype` | Avatar identity source |

---

## Octalysis Impact (Projected)

| Drive | Current | With Avatar | Why |
|-------|---------|------------|-----|
| **CD1** Epic Meaning | 8 | **9** | Talking to your essence self = "becoming who you really are" made literal |
| **CD2** Accomplishment | 7 | **8-9** | Figurine visually evolves as you level up. Your progress is embodied. |
| **CD3** Creativity | 7 | **8** | Co-creating your path with the avatar. Your choices shape its suggestions. |
| **CD4** Ownership | 6 | **8-9** | The figurine is uniquely yours, irreplaceable, grows with you. Strongest CD4 move possible. |
| **CD5** Social | 7 | **7-8** | If avatars visible in league/newsfeed, social identity layer. Otherwise unchanged. |
| **CD6** Scarcity | 5 | **6** | Avatar intelligence is time-gated. "I need more data before I can tell you this." |
| **CD7** Curiosity | 6 | **9** | "What will it say next? What has it spotted? What will it look like in Vibe Rise zone?" |
| **CD8** Loss | 5 | **6** | Dimmed avatar when absent. Gentle, not guilt. "I'm still here when you're ready." |

---

*Document created: June 2026*
*Status: Exploration / design ideation. Decisions will be logged above as they're made.*
*Frameworks: IFS (Schwartz), Polyvagal (Porges), Zone Calibration (Hurrell), Shift Architecture (Hurrell), Octalysis (Chou)*
*Related: docs/mystery-box-game-design.md, docs/octalysis-application-analysis.md*
