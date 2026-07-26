# Octalysis Alignment — Implementation Notes

**Created:** 2026-07-12
**Purpose:** Data changes, AI surfacing logic, and commentary for the 5 strong Octalysis alignments. These notes are for the implementing agent to reference alongside the measurement framework.

---

## 1. "Story Requires Failure" — Protective Voice Counting ✅ IMPLEMENTED (Jul 2026)

### Implementation Status

**DONE.** Voice counting is live. Gate changed from "5 of same voice" to "5 total identifications (any voice)".

**Data sources (both counted):**
- `healing_intentions.protective_voice` — from healing flows on courage challenges
- `nervous_system_checkins.protective_voice` — from NS check-ins

**Stage 6→7 gate:** `heroStageChecker.js` counts total voices across both tables. `totalVoiceCount >= 5` triggers graduation. No longer requires a single dominant voice.

**UI (JourneyTab.jsx, stage 6 "Next Step" card):** Shows ALL identified voices as rows (icon + name + count) with a total progress bar toward 5. Copy: "Your protective voices — X/5". Each voice gets its own row: 👻 Ghost ×6, 🎯 Perfectionist ×3, 🧱 Controller ×2.

**Solidarity query:** Checks all identified voices via `.in()` instead of just the dominant one.

**HealingFlowModal now sets `outcome: 'completed'`** when the flow finishes, so the healing badge in the Courage tab transitions from "Continue healing flow →" (green) to "Review healing flow →" (purple). Tapping the review badge reopens the modal with all answers pre-filled via `existingData` prop.

### How AI Surfaces It + Creates Commentary

**Three tiers of Zarlo engagement based on TOTAL voice count (any voice):**

**Tier 1: First recognition (total = 1-2)**
No special commentary. Zarlo stays observational:
- "You named the Ghost in that healing flow. Worth noticing."

**Tier 2: Pattern emerging (total = 3-4)**
Zarlo shifts from observational to curious. Opens a loop:
- Total 3: "Three protective voices identified now. You're starting to see the patterns."
- Total 4: "Four voices named. One more and the picture becomes clear."

**Tier 3: Graduation trigger (total = 5)**
Stage 6→7 fires. This is a DCC "boss reveal" moment. The JourneyTab shows all identified voices with a full progress bar.
- CTA: "This is the work that needs a human, not an app." → Calendly booking for Stage 8.

**Note (Jul 2026 change):** Gate is total count, not single-voice dominant. A user who identifies Ghost ×2, Perfectionist ×2, Controller ×1 = 5 total = graduates. This better reflects real human patterns where multiple voices operate.

**What the AI needs in its context window:**
```
Protective voice counts: {ghost: 1, perfectionist: 5, controller: 2}
Dominant voice: Perfectionist (5 occurrences)
First identified: 2026-04-12
Most recent: 2026-07-08
Hero stage: 6 (eligible for graduation to 7)
Related healing intentions: [list of the 5 healing flows where Perfectionist appeared]
```

**Commentary style:** The AI should NOT use clinical language. Not "Your dominant protective mechanism is perfectionism." Instead: "The Perfectionist keeps showing up. It's the voice that says 'not yet, not ready, not good enough.' You've heard it five times now. That's not a coincidence. That's a pattern with a name."

---

## 2. L0-L4 Depth Scale

Existing plan covers this. No additional notes needed.

---

## 3. Flow Statement / Double-Dash — Full Spec

Stage 8 = Celeste Chapter 6 (acceptance of root trauma). Stage 9 = the double-dash (Flow Statement = new capacity).

### 3.1 FORMAT

One raw sentence. Not a template, not a paragraph. The shortest possible expression of the merge point. Something you could say to a stranger in 10 seconds and they'd feel it.

**Not:** "I help burned-out professionals discover their purpose through breathwork, gathering design, and nervous system regulation to create transformational experiences."

**Yes:** "I create spaces where people feel safe enough to fall apart."

The raw version is UNPOLISHED. It might be grammatically imperfect. It might be a fragment. That's the point. It came from the gut, not from a copywriting exercise. The polishing happens later in Stage 10 (PositioningSummary refines it into positioning).

### 3.2 INPUTS

The AI needs these data points to surface the convergence signal:

| Data | Table | What it reveals |
|---|---|---|
| Active life paths + predicted states | `quests` | Which curiosities are alive and in which NS state |
| Cross-pollination events | `quest_cross_pollination` | Which paths are feeding each other |
| Wahoo patterns across quests | `groan_challenges` + `quest_tasks` | What types of courage keep appearing across different paths |
| Healing flow patterns | `healing_intentions` | What fears connect across quests (same root pattern in multiple paths) |
| Essence archetype | `user_stage_progress` | The identity lens through which the merge should be framed |
| Post-Stage 8 self-report | Post-session self-report | What shifted, what feels different |
| Curiosity clusters | `curiosity_clusters` | Original content consumption that started each branch |
| Career alignment | Career alignment data | What was unfed before, what's fed now |

**The key signal:** Two or more life paths that share the same healing pattern, the same wahoo types, or the same cross-pollination events. The THREAD that runs through seemingly separate curiosities.

### 3.3 AI-FIRST (but user writes the sentence)

AI proposes the thread. User names the statement. The AI doesn't write the Flow Statement. It POINTS at the convergence and asks: "Do you see it?"

**Step 1: AI surfaces the signal**
"Your breathwork path and your gathering path keep crossing. The wahoos you chose for both are about the same thing: creating containers where people let go. Your healing work traced both back to the same fear: not being safe enough to be seen. These aren't two paths. They're one."

**Step 2: AI offers a prompt, not a statement**
"If you had to say what connects everything you care about, in one sentence, what would it be?"

**Step 3: User writes**
[free text input]

**Step 4: AI reflects back (not edits)**
"You said: 'I create spaces where people feel safe enough to fall apart.' That's your Flow Statement. Does it feel true?"

**Step 5: User confirms or rewrites**
[Confirm] or [Try again]

The AI never writes the sentence FOR them. It creates the conditions where the sentence EMERGES from them. The user should feel authorship, not editing.

### 3.4 EXAMPLES

| Person | Curiosities | Merge thread | Flow Statement |
|---|---|---|---|
| **A** Breathwork Facilitator | Breathwork, gathering design, psychology | Creating safe containers for emotional release | "I create spaces where people feel safe enough to fall apart." |
| **B** Corporate Escapee → Dance Teacher | Dance, somatic healing, entrepreneurship | Using the body to bypass the mind's defences | "I help people feel things they've been thinking about for too long." |
| **C** Tech Worker Who Coaches | Coding, psychology, teaching | Making complex things simple so people stop feeling stupid | "I translate complicated worlds so nobody has to feel lost." |
| **D** Burnt-Out Nurse → Nature Therapy | Nature, ancestral living, NS regulation | Returning to what our bodies already know | "I remind people their body already knows how to heal." |
| **E** Former Athlete → Retreats | Fitness, cold exposure, community, meditation | Physical challenge as doorway to emotional transformation | "I use the body to break open what the mind can't reach." |

None mention a target audience, a price, a method name, or a business model. Those come in Stage 10. The Flow Statement is IDENTITY, not POSITIONING.

### 3.5 HOW IT'S DIFFERENT

| | Flow Statement | Mission Statement | Ikigai | Positioning Statement |
|---|---|---|---|---|
| **Answers** | "What's the thread through everything I am?" | "What do I exist to do?" | "Where do passion/skill/need/pay overlap?" | "Who do I serve and how?" |
| **Tone** | Raw, personal, felt | Formal, organisational | Analytical, diagrammatic | Marketing, audience-facing |
| **Created by** | Discovery (emerged from journey data) | Decision (decided in a meeting) | Analysis (filled in a Venn diagram) | Craft (copywritten for an audience) |
| **Changes?** | Rarely. It's WHO YOU ARE. | Updates with strategy | Recalculated as inputs change | Refines as market understanding grows |
| **Feeling** | "Of course. This was always true." | "This is what we do." | "This is where things overlap." | "This is how I explain myself." |
| **Stage** | 9 (the reward) | 10+ (business building) | 3-4 (analysis) | 10 (aligned action) |

**The key difference:** The Flow Statement is PRE-BUSINESS. It's not about who you serve or how you charge. It's about what you ARE when your curiosities merge. The business comes FROM it, not the other way around.

Ikigai asks "where do these circles overlap?" and produces an intersection.
The Flow Statement asks "what were these circles always pointing at?" and produces a revelation.

### 3.6 WHAT MAKES IT FEEL LIKE A REVELATION

**A. The data was always there.** The AI doesn't generate the connection. It REVEALS what was already visible in the data.

**B. The reconsolidation cleared the view.** Stage 8 removed the protective voice keeping the paths separate. Without the block, the merge becomes obvious.

**C. The user speaks it before understanding it.** The prompt often produces a sentence the user surprises THEMSELVES with. The AI reflects back: "You just said it. Did you hear yourself?"

**D. The app changes after (the double-dash).** Once confirmed:
- Quest recommendations shift from Repair to Build
- Zarlo's tone becomes more direct (co-founder, not therapist)
- New sections unlock (Scale Portal bridge)
- The figurine evolves visually
- The Flow Map shows the merge point glowing

**E. It can't be rushed.** You can't write a Flow Statement at Stage 3. You don't have the data. You haven't done the healing. The merge hasn't appeared. It only works AFTER Stage 8 because the block had to dissolve first.

### 3.7 Convergence Animation

When the Flow Statement is confirmed (Stage 9):
- Life path lines on the Quest Path Map visually merge
- The merge point glows or pulses
- The Flow Statement text appears at the merge point
- Feels like a reveal, not a creation. "It was always there. Now you can see it."

---

## 4. Visibility × Depth Mismatch Detection — Notes

### Data Changes Needed (after L0-L4 is built)

**Add depth to wahoo/groan data:**
```sql
-- Option: add depth_level to quests (one depth per life path)
ALTER TABLE quests 
  ADD COLUMN IF NOT EXISTS depth_level TEXT 
  CHECK (depth_level IN ('education', 'testing', 'practising', 'charging', 'teaching'));
```

**Mismatch detection query:**
```sql
-- Find mismatches per quest
SELECT 
  q.id,
  q.title,
  q.depth_level,
  array_agg(DISTINCT gc.wahoo_category) as visibility_layers_attempted,
  -- What's missing?
  ARRAY['screen','live','money','vulnerable','authority'] 
    - array_agg(DISTINCT gc.wahoo_category) as visibility_gaps
FROM quests q
LEFT JOIN groan_challenges gc ON gc.quest_id = q.id AND gc.status = 'completed'
WHERE q.user_id = $1
GROUP BY q.id, q.title, q.depth_level;
```

**Mismatch → Protective Voice mapping (for Zarlo context):**
```
IF depth >= 'practising' AND 'live' NOT IN visibility_layers:
  → Ghost pattern ("deep practice but invisible to others")
  
IF depth = 'testing' AND 'authority' IN visibility_layers:
  → Performer pattern ("claiming expertise without depth")
  
IF depth >= 'practising' AND 'money' NOT IN visibility_layers:
  → People Pleaser pattern ("skilled but can't charge")

IF depth = 'education' AND no visibility layers completed:
  → Controller pattern ("consuming but never acting")

IF depth >= 'testing' AND 'vulnerable' NOT IN visibility_layers:
  → Perfectionist pattern ("doing it publicly but never imperfectly")
```

**Surfacing:** Zarlo uses this as context, not as a displayed diagnostic. The user sees simplified progress per quest ("L2 Practising. Screen ✓ Live ✓ Money ○ Vulnerable ○ Authority ○"). Zarlo sees the pattern and nudges accordingly.

---

## 5. Zarlo vs. Figurine — Two Roles, Not One

### The Question

Should Zarlo be like DCC's snarky AI commentary? Or should it be the mentor?

### The Answer: It's Two Characters

Reading Section 7 of the measurement framework alongside the Octalysis research, the architecture is clear:

| | Figurine (Essence Avatar) | Zarlo |
|---|---|---|
| **DCC equivalent** | Mordecai (the mentor) | The AI system (achievement narrator) |
| **Hades equivalent** | Achilles / Nyx (wise guides) | Hypnos (witty, reactive, specific) |
| **Celeste equivalent** | Theo (emotional support, key moments) | The loading screen messages ("Be proud of your death count") |
| **Role** | Deep, stage-aware, speaks at TRANSITIONS | Frequent, reactive, speaks in the DAILY LOOP |
| **Personality** | Future-self wisdom. Serious when it matters. Cryptic hooks. | Warm, slightly cheeky, observational, occasionally challenges. |
| **When it speaks** | Stage graduations, stuck thresholds, major revelations | Daily check-ins, post-wahoo, post-session, pattern nudges |
| **Tone** | "Your curiosities share something. Do you see it yet?" | "Three Sympathetic check-ins this week. The Perfectionist is busy." |
| **Trust progression** | Mirror (Stage 4a) → Mentor (Stage 4b onwards) | Always present, deepens through accumulated context |
| **Frequency** | Rare and impactful (monthly?) | Daily or near-daily |

### How This Maps to DCC Specifically

DCC has THREE voice layers, not one:

1. **The AI System** (achievement narrator) — snarky, unpredictable, personality-driven. Every achievement has a punchline. This is **Zarlo's daily voice.** Quick, reactive, surprising. The user LOOKS FORWARD to what it'll say next.

2. **Mordecai** (the mentor) — wise, cryptic, drops heavy truths at key moments. "It's not worth it, not until floor 12." This is **the Figurine's voice.** Rare, weighted, stage-aware. When it speaks, you listen.

3. **Donut** (the companion) — argues, pushes back, has her own agenda, creates social dynamic. This is something Vibe Rise doesn't have as a separate character, but elements of Donut's pushback should live in **Zarlo's "challenge mode"** (Partial Alignment #6).

### Zarlo's Personality Spec (DCC AI-Inspired)

Zarlo should NOT be snarky in the DCC sense. DCC's AI is irreverent because it's an alien entertainment system that doesn't care if you live. That tone would be harmful in a wellness app.

Instead, Zarlo's personality should be:

**Warm but honest. Observational but occasionally pointed. Never cruel, sometimes uncomfortable.**

| Situation | DCC AI Would Say | Zarlo Should Say |
|---|---|---|
| User completes first wahoo | "Congratulations. You know how to open doors. Reward: That sense of fulfillment? That's reward enough." | "You did the thing. The voice said don't. You did it anyway. That's the whole game." |
| User breaks streak | "You are so dead." | "The streak resets. The learning doesn't. Come back when you're ready." |
| User avoids healing tab | (achievement for avoiding) | "9 days since you opened the Healing tab. I'm not judging. I'm just noticing." |
| User has 3 Sympathetic check-ins | (sardonic observation) | "Three days of Sympathetic. Something's activating you. Want to name it, or just sit with it?" |
| User completes a Vulnerable wahoo | "Holy crap, dude. That's kinda fucked up." | "That took guts. The Perfectionist is furious right now. Good." |

**The line:** Zarlo can be uncomfortable ("I'm noticing you avoid X") but never shaming ("You failed at X"). Uncomfortable = Celeste's difficulty. Shaming = Duolingo's guilt owl.

### Figurine's Personality Spec (Mordecai-Inspired)

The Figurine speaks RARELY but with WEIGHT. It has the Mordecai quality of knowing more than it says.

| Situation | Figurine Says |
|---|---|
| Stage 3 (stuck browsing) | "I notice you've been browsing but haven't tried anything yet. That's the Refusal. It's supposed to happen." |
| Stage 5 (first Vibe Rise) | "There it is. Remember this. Everything that comes next is about getting back to THIS feeling." |
| Stage 6→7 graduation | "The [voice name]. Five times. You're ready to see what's underneath." |
| Stage 8 (post-reconsolidation) | "That one hurt. But you're still standing. That's the proof." |
| Stage 9 (convergence) | "Your curiosities share something. I've been watching them converge. Do you see it yet?" |
| Stuck for 8+ weeks | "There's something you haven't tried. You're not ready to hear what it is. But you will be." |

**The Mordecai move:** The Figurine should occasionally say something the user doesn't understand YET. An open loop that only makes sense 2-3 stages later. "It's not worth it, not until floor 12" — the user remembers this and suddenly gets it weeks later. That's the hook.

### Implementation Implication

These are TWO SEPARATE systems with different triggers, different context needs, and different UIs:

| | Zarlo | Figurine |
|---|---|---|
| **Trigger** | Daily events (check-in, wahoo, session, inactivity) | Stage transitions, stuck thresholds, major data milestones |
| **UI** | Floating widget, chat interface (existing) | Avatar panel, special modal/overlay (on Figurine branch) |
| **Context** | ALL data via pre-computed Zarlo Brief (see Section 6) | Full journey history + hero stage + depth + convergence |
| **AI prompt** | Zarlo Brief (~500 tokens) + page context, personality-forward | Deeper context, slower/rarer response, wisdom-forward |
| **Data source** | ALL tables via Zarlo Brief (daily pre-computed summary of full history) | `user_stage_progress`, hero stage calculations, cross-pollination, full voice counts |

**Build order:** Zarlo enrichment first (it exists, just needs better context). Figurine later (dedicated session, as noted in measurement framework).

---

---

## 6. Zarlo Utility Definition + Proactive System Spec

**Source:** Hades (Hypnos context-sensitive reactions), DCC (AI commentary personality), Celeste (no shame)
**Files to modify:** `src/lib/zarlo/zarloEngine.js`, new background function for Zarlo Brief

### Zarlo's Purpose (Single Sentence)

**Zarlo sees what you can't see about yourself — patterns in your own data that you're too close to notice — and names them at the moment they become useful.**

Not a therapist. Not a coach. Not an assistant. A **pattern mirror with timing.**

### The 4 Utilities

| Utility | What Zarlo Does | Example |
|---|---|---|
| **1. Pattern Detection** | Sees repeating behaviour across time | "You've checked in as Activated every Wednesday for the last month. What happens on Wednesdays?" |
| **2. Contradiction Naming** | Notices when self-report doesn't match behaviour | "You said Safe today but you skipped the Healing tab for 12 days and your last 3 wahoos were Pressure." |
| **3. Convergence Spotting** | Notices when separate life paths are feeding each other | "Your breathwork quest and coaching quest keep cross-pollinating. Something's connecting them." |
| **4. Readiness Signalling** | Detects when the user is close to a threshold they haven't noticed | "You've identified the Perfectionist 4 times. One more and something becomes clear." |

### Zarlo Gets ALL Data, Not Just Recent

The power of an AI companion is seeing what humans can't: long-term patterns across months. A therapist who only remembers last week isn't useful. Zarlo remembers EVERYTHING and surfaces what's relevant NOW.

**Full data access:**

| Data Source | Table | What Zarlo Gets |
|---|---|---|
| NS check-ins | `nervous_system_checkins` | ALL: state distribution over time, day-of-week patterns, before/after shifts, drain categories |
| Healing work | `healing_intentions` | ALL: protective voice history, pattern/fear/rewire text, completion stages, which quests linked |
| Wahoos | `groan_challenges` | ALL: classifications, visibility layers attempted, categories, completion rates |
| Completions | `quest_completions` | ALL: reflection text (identity statements), expectation results |
| Active quests | `quests` | CURRENT: active life paths, predicted states, depth levels (when built) |
| Weekly reviews | `weekly_reviews` | ALL: multiplier scores over time, environment/network/identity trends |
| User progress | `user_stage_progress` | CURRENT: essence archetype, hero stage, onboarding state |
| Experience check-ins | `experience_checkins` | ALL: pre/post predictions, wahoo conversions |
| Cross-pollination | `quest_cross_pollination` | ALL: which paths feed each other |

### Zarlo Brief (Pre-Computed Summary)

Sending all raw data to Claude every conversation would be expensive and slow. Instead: a background function generates a compressed "Zarlo Brief" daily (or on-demand). This brief goes into Zarlo's system prompt.

**Brief structure (~500 tokens):**

```
ZARLO BRIEF — User [X] — Generated [date]

CURRENT STATE:
- Hero stage: 6 (Training)
- Current streak: 14 days
- Capacity score: 67
- Essence: Radiant Rebel
- Last check-in: Safe (today)

PATTERNS (full history):
- Wednesdays: 78% Activated (vs 34% other days)
- Protective voice distribution: Perfectionist (4), Ghost (2), Controller (1)
- Wahoo classification trend: Pressure increasing (20% month 1 → 35% month 3)
- Visibility layers: Screen (12), Live (3), Money (0), Vulnerable (1), Authority (0)
- Healing tab: visited 2x in last 30 days (down from 8x in first 30 days)

CONVERGENCE:
- Breathwork ↔ Coaching: 3 cross-pollination events
- No other convergence detected

THRESHOLDS APPROACHING:
- Protective voice: Perfectionist at 4/5 (one more = Stage 7 graduation)
- Streak: 14 days (approaching 21-day milestone)

CONTRADICTIONS:
- Reports "Safe" but Pressure wahoos increasing
- Healing tab declining while protective voice count rising
```

**Implementation:** Supabase Edge Function or cron job. Runs daily per active user. Stores result in a `zarlo_briefs` table or in-memory cache. Zarlo engine pulls latest brief when generating context.

### Zarlo Tone Rules

**YES (warm-but-direct):**
- "You marked Safe. Your Tune tab tells a different story this week. What's going on?"
- "The Perfectionist showed up again in your healing flow. That's four times. Do you want to look at what's underneath?"
- "You've created 6 Screen wahoos in a row. When's the last time you went Live?"

**NO (too clinical):**
- "Your sympathetic activation frequency has increased 40% this week."

**NO (too guilt-inducing / Duolingo owl):**
- "You haven't done a wahoo in 8 days. Are you giving up?"

**NO (too cautious / current Zarlo):**
- "Welcome back! How can I help you today?"

**The line:** Zarlo can name what it sees. It can ask a direct question. It NEVER judges the answer or implies the user should feel bad.

### Proactive Triggers

Zarlo speaks proactively (in-app bubble on challenge page, NOT push notifications) when it detects something from the 4 utilities.

| Utility | Trigger Condition | Zarlo Says | 
|---|---|---|
| **Pattern** | Day-of-week pattern (3+ weeks same state on same day) | "Wednesdays keep showing up as Activated. What happens on Wednesdays?" |
| **Pattern** | Visibility layer avoidance (0 wahoos in a layer across 10+ total) | "12 wahoos. None of them Money. That's not an accident." |
| **Contradiction** | Self-report contradicts behaviour data | "You said Safe but your Pressure wahoos are increasing. Both can be true. Which one matters more right now?" |
| **Convergence** | 3+ cross-pollination events between same 2 quests | "Your [quest A] and [quest B] keep feeding each other. Something's connecting them." |
| **Readiness** | Within 1 of a graduation threshold | "One more pattern and something becomes clear." |
| **Return** | First interaction after 3+ day absence | "You're back. No judgment. What brought you here today?" |
| **Celebration** | New milestone hit (streak, RP level, wahoo count) | Varies per milestone (DCC-style voice copy) |

**Frequency:** 1 per day maximum. Delivered as a Zarlo bubble in the app. Tap to expand/chat. Not a push notification.

**Selection logic:** If multiple triggers are active on the same day, prioritise: Readiness > Contradiction > Pattern > Convergence > Celebration > Return. The most actionable insight wins.

**Delivery:** In-app only. Zarlo bubbles appear on the challenge/home page. The user can dismiss or tap to engage. Dismissed bubbles don't repeat (mark as seen in `zarlo_briefs` or separate tracking).

---

## 7. "No Wasted Runs" — RP + Interim Milestones Spec

**Source:** Hades (every run yields something), Celeste (be proud of your death count)

### A. Daily Check-In RP

**Current state:** Daily 4-state check-in (DailyCheckin.jsx) inserts to `nervous_system_checkins` but awards NO RP. Zero points for showing up.

**Change:** Award 2 RP for every daily check-in, regardless of state.

| Check-in State | RP |
|---|---|
| Vibe Rise | +2 |
| Safe | +2 |
| Activated | +2 |
| Shutdown | +2 |

All states equal. Showing up IS the work. The data IS the value. No state is "better" or "worse" for RP purposes.

**Implementation:** Add RP award call in `DailyCheckin.jsx` after the `nervous_system_checkins` insert. Use existing RP/scoring infrastructure (`useChallengeData` or `quest_completions` insert).

### B. Interim Milestones (Zarlo + Journey Tab Visual)

**Delivery:** Option 3 — Zarlo mentions progress conversationally AND a visual indicator exists on the new Journey tab.

**Skip:** Stages 2→3 and 3→4 (users move through these quickly, no interim needed).

**Interim milestones for remaining transitions:**

#### Stage 4→5 (Mirror/Mentor → First Vibe Rise)

| Milestone | Trigger | Zarlo | Journey Tab |
|---|---|---|---|
| First wahoo completed (any state) | `groan_challenges` count = 1 | "Your first one. Whatever it felt like, you did it." | ●○○ (1 of ~3 before likely Vibe Rise) |
| 3 wahoos, no Vibe Rise yet | count = 3, none classified 'vibe' | "Three wahoos. None have hit Vibe Rise yet. That's fine. Keep exploring what lights up." | ●●●○ |

Note: "3 wahoos, no Vibe Rise yet" is stated NEUTRALLY (Celeste model), not as failure.

#### Stage 6→7 (Training → Pattern Revealed) — UPDATED Jul 2026

Gate is now **total voice count** (any voice, not single dominant). UI shows all voices as rows.

| Milestone | Trigger | Zarlo | Journey Tab |
|---|---|---|---|
| First voice identified | total = 1 | "You named the [voice]. Worth noticing." | 👻 Ghost ×1 — bar at 20% |
| Two voices | total = 2 | No proactive message (too early) | 👻 Ghost ×1 · 🧱 Controller ×1 — bar at 40% |
| Three voices | total = 3 | "Three voices identified. The patterns are forming." | All voices listed — bar at 60% |
| Four voices | total = 4 | "Four voices named. One more and something becomes clear." | All voices listed — bar at 80% |
| Graduation (total = 5) | total = 5 | Full graduation celebration (see Gap 1 spec) | All voices listed — bar at 100% |

#### Stage 7→8 (Pattern Revealed → Ordeal)

| Milestone | Trigger | Zarlo | Journey Tab |
|---|---|---|---|
| Root trauma named in healing flow | healing flow reaches origin step for dominant voice | "You've named the origin. That took courage." | "Root identified" indicator |
| Session booking available | Stage 7 confirmed | "This one needs a human. Not an app." + Calendly link | "Book session" CTA |
| Session booked | Calendly webhook or manual confirm | "Session booked for [date]. Between now and then, the voice will get louder. That's normal." | "[Date]" shown |

#### Stage 8→9 (Ordeal → Flow Statement)

| Milestone | Trigger | Zarlo | Journey Tab |
|---|---|---|---|
| Post-reconsolidation check-in | Session confirmed complete | "That one hurt. But you're still standing. That's the proof." | "Session complete" ✓ |
| First cross-pollination detected | `quest_cross_pollination` row count = 1 for any pair | "Something interesting. Your [quest A] wahoo fed your [quest B]." | 1 convergence dot |
| 2nd cross-pollination pair | 2+ pairs with cross-pollination | "Two connections now. Your curiosities are starting to talk to each other." | 2 convergence dots |
| AI merge signal ready | Algorithm detects convergence threshold (TBC) | "Your curiosities share something. I can almost see it. Do you see it yet?" | "Convergence detected" glow |

#### Stage 9→10 (Flow Statement → Aligned Action)

| Milestone | Trigger | Zarlo | Journey Tab |
|---|---|---|---|
| Flow Statement written | User confirms statement | "Of course. This was always your path." | Flow Statement displayed |
| Path A/B/C browsed | User views Aligned Action options | "Three doors. All lead forward." | Options visible |
| First concrete action written | User writes first action step | "It's real now. You wrote it down." | Action ✓ |

---

## 8. Zero Punishment — Post-Wahoo Response Spec ✅ IMPLEMENTED (Jul 2026)

**Source:** Celeste (no punishment on death) + Hades (death gives richer content than winning)
**File:** `src/components/GroanCompletionModal.jsx`

### Status: DONE

All 4 states have per-state copy, RP differentiation, and celebrations. Additional changes since spec:
- **NS question reduced to "Before" only** (mode="before"). The wahoo classification ("How did you feel during?") serves as the during-state. `afterState` derived via WAHOO_TO_NS mapping. No double question.
- **Pressure voice objection** stored in `reflection_text` JSON as `voice_objection` field.
- **Skill XP** uses task-level skill_tags when available, falls back to quest tags for courage challenges only.

### Spec Per State

**Vibe Rise 🔥 (already good, minor addition):**
```
Gold confetti (existing)
"That's the [essenceName] in you." (existing)
Identity statement prompt (existing)
RP: 7 base + 3 identity bonus = 10 total
```

**Fun 😌 (add warmth):**
```
Gentle celebration: soft purple pulse on screen, NO confetti
Copy: "That landed. Good."
Identity statement prompt (same as Vibe Rise)
RP: 7 base
```

**Pressure 😰 (reframe — most important change):**
```
No confetti. Brief screen weight acknowledgment (slight dim, then return).
Copy: "That wasn't easy. The [protective_voice if known, else 'voice in your head'] 
probably told you to stop. You didn't."
RP: 7 base + 3 "edge push" bonus = 10 total

Replace identity statement with protective voice capture:
"What did the voice say before you did it?" (free text, OPTIONAL)
Placeholder: "e.g. you're not ready, people will judge, it won't work"

This text is saved to healing_intentions or a new field on groan_challenges.
It feeds the protective voice counting system (Strong Alignment #1).
Over time Zarlo sees: "Before every Pressure wahoo, the Perfectionist 
says 'you're not ready.' That's 4 times now."
```

**Uninterested 😶 (validate + instant retry):**
```
Neutral. No celebration, no weight. Clean acknowledgment.
Copy: "This one didn't land. That's useful information. 
Not everything that scares you matters to you."
CTA: "Try a different one?" button (links back to wahoo creation/courage tab)
RP: 7 base + 2 "honesty" bonus = 9 total
```

### RP Summary

| State | Base | Bonus | Total | Reasoning |
|---|---|---|---|---|
| Vibe Rise | 7 | +3 (identity) | 10 | Reward the naming |
| Fun | 7 | — | 7 | Clean completion |
| Pressure | 7 | +3 (edge push) | 10 | Pushed past comfort, that costs MORE, earns MORE |
| Uninterested | 7 | +2 (honesty) | 9 | Reporting "didn't land" is brave |

Key insight: Pressure earns the SAME as Vibe Rise. The Hades inversion: the hardest state gives the richest reward. The user should never feel penalised for honest reporting.

### Data Change for Pressure Voice Capture

Add optional field to capture the pre-wahoo protective voice objection:

```sql
-- Option A: Add to groan_challenges (simplest)
ALTER TABLE groan_challenges 
  ADD COLUMN IF NOT EXISTS pre_wahoo_voice_text TEXT;

-- Option B: Add to quest_completions reflection_text JSON
-- Already stores wahoo_classification + identity_statement as JSON
-- Could add voice_objection to the same JSON blob
```

Recommendation: Option B (JSON in existing reflection_text) to avoid schema change. The field is optional and only populated on Pressure responses.

### Implementation Priority

This is the **quickest win with highest impact.** Currently 50% of wahoo outcomes (Pressure + Uninterested) feel like the "wrong" answer. One day of copy changes + RP adjustment immediately changes how those moments FEEL.

---

---

## 9. Gap Specs (Confirmed)

### Gap 1: Graduation Celebrations

Each stage graduation is a FIGURINE moment (rare, weighted). Not Zarlo.

| Stage | Visual | Copy (Figurine) | Mechanical Change |
|---|---|---|---|
| **3→4** | Archetype colour wash → avatar reveal | "You've been called this your whole life without knowing it. [Archetype]." | Hero Profile unlocks. Essence name appears across app. Zarlo references archetype. |
| **4→5** | Gold pulse, brief confetti | "There it is. You felt it. Remember this next time the voice gets loud." | Vibe Rise state tracked (already exists). Capacity Score gets first data point. |
| **5→6** | Ghost League card slides in | "You're ready for the arena. Time to race yourself." | Ghost League activates (solo: beat last week's you in 2/3 categories). |
| **6→7** | Screen dims to voice colour, silhouette pulses | "The [voice]. Five times. It's been running your show since [origin]. You're ready to face the root." | Healing surfaces root-specific content. Figurine shifts to mentor mode. Calendly CTA appears. |
| **7→8** | Warm, minimal. Gentle glow. No fanfare. | "This one needs a human. Not an app." | Session booked. Figurine sends 1-2 prep messages before session date. |
| **8→9** | Life path lines merge on Quest Path Map, glow at merge | "Your curiosities share something. There it is." | **Double-dash:** App orientation shifts from Repair to Build. Quest recommendations change. Zarlo tone becomes more direct. New Build section unlocks. Visual marker on profile. |
| **9→10** | Three doors visual (A/B/C paths) | "Three doors. All lead forward. None lead back." | Path selected. Scale Portal bridge opens if Path C. Action planning interface appears. |

**Repair → Build shift (Stage 8→9):** Pre-9 the app asks "What's blocking you?" (healing, vulnerability, self-knowledge wahoos). Post-9 the app asks "What are you building?" (creation, monetisation, authority, teaching wahoos). Same courage tab, different emphasis.

### Gap 2: Stuck Mechanics (Figurine-Led)

**The Figurine coaches through stuckness via a 3-step "Unstick Flow":**

1. **Name it:** "What's the thing you've been avoiding? Not the thing you SHOULD do. The thing you keep NOT doing." → Free text
2. **Why:** "If you did that thing, what's the worst that could happen?" → Free text → Figurine: "That's the voice talking. Not you."
3. **Smallest step:** "What's the SMALLEST version you could do this week?" → Free text → Auto-creates a wahoo on courage tab

**Timing per stage (calibrated to expected duration):**

| Stage | Graduation Trigger | Stuck Threshold | Figurine Offer |
|---|---|---|---|
| 4→5 | First wahoo classified as Vibe Rise | 7 days, no Vibe Rise wahoo | "You've done [N] wahoos. None have hit Vibe Rise yet. Let's look at why." |
| 5→6 | 2nd wahoo completed (repetition starts) | 1 week after first Vibe Rise without completing 2nd wahoo | "You hit Vibe Rise once. What stopped you from going back?" |
| 6→7 | Protective voice identified 5x | 1 week without protective voice count increasing | "Your courage is growing but the pattern underneath hasn't surfaced. Let's dig." |
| 7→8 | Root reconsolidation session booked + completed | 1 week without booking session | "You've seen the root. The next step isn't in the app. What's holding you back from booking?" |
| 8→9 | Flow Statement confirmed | 2 weeks post-session without convergence confirmation | "The session happened. Something shifted. But you haven't named what it is yet." |
| 9→10 | Path A/B/C selected + first action | 2 weeks without path selection | "You know the path. The only thing left is to walk it." |

Stages 2→3 and 3→4 are too quick for stuck mechanics.

**Delivery:** Figurine bubble on Journey tab. User can dismiss (no guilt). Reappears at next threshold if still stuck. Tapping opens the 3-step Unstick Flow.

### Gap 3: Social — V1 Priority

**V1 features (work at any scale, build now):**

| Feature | Where It Lives | Exists? | Effort |
|---|---|---|---|
| **One-tap Kudos on shared wahoos** | Newsfeed + shared completion cards | PARTIAL — reactions exist on league content. Extend to wahoo shares. | Low |
| **Cumulative monthly counter** | Challenge page header or Journey tab | NO | Low (one query) |
| **Anonymous solidarity at Stage 7** | Journey tab, Stage 7 milestone | NO | Low (aggregate query) |
| **Ghost League** | `/league` routes | YES — replaces PvP Fantasy League | Solo: race last week's you. `useGhostMatchup` hook, `ghost_weekly_results` + `ghost_streaks` tables, `finalize-ghost-week` edge function. W/L flip celebrations, recap cards, streak tracking. |
| **Session milestones** | In-person facilitation (host announces) | NO tech needed | Zero (facilitation protocol) |

**V2 features (need 100+ users):** "Here Now" counter (needs Supabase Realtime), community activity feed (extend existing Newsfeed), Kudos on daily check-ins.

**V3 features (need infrastructure):** Group wahoos, accountability pods, mentor system, community challenges.

**Privacy principle:** All sharing OPT-IN. Courage scores personal unless shared. Social warmth without surveillance.

### Gap 4: Feeling Targets

Confirmed as-is. Added to each stage graduation as a validation check: did the user HIT the metric AND report the feeling?

### Gap 5: 5×5 Matrix — Confirmed INVISIBLE

Matrix stays behind the scenes. Zarlo uses it via the Zarlo Brief. Users don't see dots, grids, or visibility breakdowns. They get Zarlo saying the right thing at the right time.

### Gap 6: Insight Drops (Vibe Rise "Loot Boxes")

**Core concept:** The AI surfaces patterns from user data as REVEALS, not notifications. Styled as discovery moments the user looks forward to.

**Rarity tiers:**

| Tier | Frequency | Trigger Type | Presentation |
|---|---|---|---|
| **Common** | Every 5-7 days of activity | Category patterns, practice counts, basic streaks | Subtle card slide-up. Purple accent. |
| **Uncommon** | Every 2-3 weeks | Visibility firsts, trend shifts, day-of-week patterns | Brighter card with glow. Gold accent. |
| **Rare** | Monthly or milestone-based | Protective voice at 3+, cross-pollination, root connection, rewire-to-proof link | Full card reveal with animation. "Insight Unlocked" header. |
| **Legendary** | Stage graduation only | Flow Statement convergence, identity language evolution | Figurine delivers it. Screen-level event. Screenshot moment. |

**Data sources for insights:**

| Source | Common Insights | Uncommon/Rare Insights |
|---|---|---|
| `nervous_system_checkins` | "Breathwork is your anchor (18x)" | "Activated every Wednesday — what happens?" |
| `groan_challenges` | "80% of wahoos are Connection" | "12 wahoos, none Money — that's not an accident" |
| `healing_intentions` | — | "Perfectionist 3x — this one has your attention" |
| `quest_completions` | "8 of 12 tasks done on coaching" | "Identity statements shifted from 'safe' to 'brave'" |
| `weekly_reviews` | "Environment is lowest every week" | "Identity score up 3 weeks running" |
| `experience_checkins` | "3 experiences → wahoos" | "You overestimate the fear (predicted Pressure, got Fun)" |
| `quest_cross_pollination` | — | "Breathwork ↔ Coaching converging" |
| `groan_streaks` | "14 days, longest was 21" | "4 rebuilds, each faster than last" |

**V1:** Style existing celebration/notification moments as Insight Drop cards. Same data, better presentation.
**V2:** Full rarity system, "Your Insights" collection on Journey tab, Legendary drops tied to Figurine. Plus Self-Knowledge Skills (see below).

### V2: Self-Knowledge Skills (DCC Skill Upgrades)

In DCC, skills level up based on USE (punch more → Pugilism levels up → punches hit harder). The upgrade changes the EXPERIENCE, not just a number.

**Vibe Rise equivalent:** Skills that level based on submissions/completions. Each level makes the AI smarter FOR YOU.

| Skill | Levels Based On | L1 | L3 | L5 |
|---|---|---|---|---|
| **Self-Awareness** | Daily check-ins (10/25/50/100/200) | Zarlo asks "how are you?" | Zarlo detects day-of-week patterns | Zarlo predicts your state before you check in: "It's Wednesday. You're probably Activated. Am I right?" |
| **Courage** | Wahoos completed (5/15/30/60/100) | App suggests Screen wahoos only | App surfaces Live + Money challenges | App recommends Vulnerable/Authority because you've proven capacity |
| **Pattern Recognition** | Healing flows completed (3/8/15/30/50) | Zarlo names the voice after you identify it | Zarlo spots the voice before you name it | Zarlo predicts which voice will fight a wahoo BEFORE you attempt it: "The Perfectionist is going to resist this one. Ready?" |
| **Resilience** | Streak rebuilds, not length (2/4/7/10/15) | "Streak broken" | "3rd rebuild. Getting faster." | "Recovery speed IS the skill. You bounce back in [N] days now vs [N] days before." |
| **Integration** | Cross-pollination events (2/5/10/20/35) | Paths feel separate | Zarlo notices connections | Zarlo actively suggests: "Your coaching insight applies to breathwork. Try this wahoo." |

**Key design principles:**
- Levels unlock based on NUMBER OF SUBMISSIONS, not quality. Showing up IS the levelling.
- Each level changes what the AI DOES, not just what a badge says. Higher skill = smarter Zarlo = more personalised experience.
- Skill levels are visible on the Journey tab (simple: "Courage L3" with a progress bar to L4).
- Level-ups are delivered as Insight Drops: "Courage Level 3 unlocked. You've completed 30 wahoos. The app can now recommend deeper challenges."
- The Zarlo Brief already tracks the underlying data. Skills are the user-facing LABEL for what the Brief computes.

**V2 Zarlo additional capabilities (unlocked by skill levels):**

| Capability | Unlocked By | What It Does |
|---|---|---|
| **Life path commentary** | Self-Awareness L3+ | Zarlo customises daily messages based on active life paths: "Your coaching path is at L2 but hasn't moved in 2 weeks. Your music path just jumped to L1. Energy is flowing there." |
| **Ranking updates** | Courage L2+ | Zarlo surfaces where you sit relative to others (anonymous): "Your wahoo count this week puts you in the top 20% of active users." / "You've completed more Vulnerable wahoos than 85% of people at your stage." |
| **Journey narration** | Pattern Recognition L3+ | Zarlo narrates your journey like a story: "Month 1: you wouldn't go Live. Month 3: you ran a workshop. That's not a small change." |
| **Predictive nudges** | Self-Awareness L5 | Zarlo anticipates based on patterns: "Tomorrow's Thursday. You usually skip the app on Thursdays. Want to set an intention tonight?" |
| **Path recommendations** | Integration L3+ | Zarlo suggests NEW life paths based on convergence patterns: "People with your breathwork + coaching combo often explore facilitation. Curious?" |

**Build dependency:** Requires Zarlo Brief (Section 6) to be working first. Skills are the presentation layer on top of the Brief's pattern detection.

**Why this isn't flimsy:** The levels change the PRODUCT, not just the interface. A L1 user gets generic Zarlo. A L5 user gets an AI that knows them deeply and can predict, challenge, and connect dots they can't see. The skill IS the relationship depth with the system. You're not grinding for a badge. You're training your AI to understand you.

### Gap 7: Session Bridge — Saved for Later

Current format: Entrepreneur circle + Coldnips beach meetups. Connection (wins/learnings/surprises) + one healing experience + one wahoo experience. Fantasy League as social bridge.

**Future features (dedicated session needed):**
- RSVP system with pre-session courage identification
- Post-session check-in (courage score, reflection, Kudos)
- Session data feeding Journey tab and pattern detection
- Fantasy League opponent introductions
- Session chapter numbering per attendee
- Loyalty tiers (Spark → Flame → Fire → Blaze → Inferno)
- Guest speaker / community member scheduling

---

---

## Sprint 1: Build Guide (exact changes)

### Why These Three First (Prioritisation Rationale)

The single biggest insight from the Octalysis research: **how failure feels determines whether people come back.** Hades proved that "death" can be the most rewarding moment. Celeste proved you don't need punishment to drive engagement. Duolingo proved that fear works for habits but creates anxiety.

Sprint 1 targets the three features that change how FAILURE FEELS in the app. Every user experiences "bad" states (Pressure, Shutdown, streak breaks, missed days) regularly. These three changes transform those moments from "I picked the wrong answer" to "that counts too." This affects every user every day, which is why it comes first.

### Success Metrics

The north star is NOT "more engagement" or "more check-ins." It's: **are users trending toward Vibe Rise state over time?**

| Feature | Leading Indicator | Lagging Indicator |
|---|---|---|
| **Post-wahoo responses** | Pressure/Uninterested reporting rate increases (people stop lying about their state because it's no longer punished) | Ratio of Vibe Rise wahoos to total wahoos increases over 30 days (honest reporting → better self-knowledge → better wahoo selection → more Vibe Rise) |
| **Daily check-in RP** | Check-in completion rate increases (currently no incentive) | Activated/Shutdown check-ins decrease as a % over 60 days (showing up daily → awareness → regulation → safer states) |
| **Voice counting + Zarlo tiers** | Users who reach 3+ voice identifications continue to Stage 7 faster | Stage 7 graduation rate increases (pattern recognition → root identification → reconsolidation booking) |

**The ultimate metric across all features:** % of life paths in Vibe Rise or Fun predicted state, trending up over user lifetime.

### Sprint 1A: Post-Wahoo Responses ✅ DONE

**File:** `src/components/GroanCompletionModal.jsx`

**Change 1: RP differentiation (line 19 + lines 123-129)**

Current:
```javascript
const PLAY_LIST_POINTS = 7  // line 19
```

Change to:
```javascript
// RP per wahoo classification (Hades model: harder states earn MORE)
const WAHOO_RP = {
  vibe: 10,      // 7 base + 3 identity bonus
  peace: 7,      // base
  anxious: 10,   // 7 base + 3 edge-push bonus (Pressure is as brave as Vibe Rise)
  shutdown: 9,   // 7 base + 2 honesty bonus
  // Legacy compat
  wahoo: 10,
  vibe_rise: 7,
  routine: 7,
}
```

Then at line 129, replace `PLAY_LIST_POINTS` with `WAHOO_RP[wahooClassification] || 7` in both the `quest_completions` insert and the `increment_scores` RPC call.

**Change 2: Per-state copy + celebration (lines 255-262 + 337-354)**

At lines 255-261, replace the celebration block:
```javascript
// Current: same confetti for all
// Replace with:
if (wahooClassification === 'vibe' || wahooClassification === 'wahoo') {
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, 
    colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
} else if (wahooClassification === 'peace') {
  // Gentle purple pulse, no confetti
} else if (wahooClassification === 'anxious') {
  // No confetti. Brief dim acknowledgment.
} else {
  // Uninterested: no celebration, clean neutral
}
```

At lines 337-354, replace the identity prompt section per state:

For **Pressure** (`anxious`): replace identity statement with voice capture:
```jsx
{wahooClassification === 'anxious' && (
  <div className="gcm-identity-prompt">
    <div className="gcm-reframe-line">
      That wasn't easy. The {essenceName ? `voice in the ${essenceName}'s head` : 'voice in your head'} 
      probably told you to stop. You didn't.
    </div>
    <label className="gcm-identity-label">What did the voice say before you did it?</label>
    <input className="gcm-identity-input" type="text" value={identityStatement}
      onChange={e => setIdentityStatement(e.target.value)}
      placeholder="e.g. you're not ready, people will judge, it won't work" />
  </div>
)}
```

For **Uninterested** (`shutdown`): show validation + retry CTA:
```jsx
{wahooClassification === 'shutdown' && (
  <div className="gcm-identity-prompt">
    <div className="gcm-reframe-line">
      This one didn't land. That's useful information. 
      Not everything that scares you matters to you.
    </div>
  </div>
)}
```

For **Fun** (`peace`): add warmth line:
```jsx
{wahooClassification === 'peace' && (
  <div className="gcm-identity-prompt">
    <div className="gcm-reframe-line">That landed. Good.</div>
    <label className="gcm-identity-label">Now that I {challenge.title?.toLowerCase()}, I've proven I'm someone who...</label>
    <input className="gcm-identity-input" type="text" value={identityStatement}
      onChange={e => setIdentityStatement(e.target.value)}
      placeholder="e.g. takes risks, shows up, backs themselves" />
  </div>
)}
```

**Change 3: Store Pressure voice text in reflection_text JSON (line 132)**

The `reflection_text` field already stores JSON with `wahoo_classification` and `identity_statement`. Add `voice_objection` for Pressure responses:
```javascript
reflection_text: JSON.stringify({
  // ... existing fields ...
  wahoo_classification: wahooClassification,
  identity_statement: identityStatement || null,
  voice_objection: wahooClassification === 'anxious' ? identityStatement : null,
  // Note: for Pressure, identityStatement field is repurposed as voice_objection
})
```

### Sprint 1B: Daily Check-In RP (half day)

**File:** `src/components/DailyCheckin.jsx`

**Change:** After the `nervous_system_checkins` insert at line 92, add RP award:

```javascript
// Line 92-96: existing insert
await supabase.from('nervous_system_checkins').insert({
  user_id: userId,
  before_state: selectedState,
  checkin_type: 'daily',
})

// ADD AFTER: Award 2 RP for showing up (all states equal)
try {
  await supabase.from('quest_completions').insert({
    user_id: userId,
    quest_id: `daily_checkin_${new Date().toISOString().slice(0, 10)}`,
    quest_category: 'Tune',
    quest_type: 'DailyCheckin',
    points_earned: 2,
    challenge_day: 0,
    project_id: null,
  })
  await supabase.rpc('increment_scores', {
    p_user_id: userId,
    p_project_id: null,
    p_category: 'tune',
    p_points: 2,
    p_week_start: getWeekStartLocal(),
  })
} catch (e) {
  console.warn('Daily checkin RP error:', e)
}
```

**Import needed:** Add `import { getWeekStartLocal } from '../lib/dateUtils'` at top of file.

**Note:** Using date-stamped `quest_id` prevents double-awarding if user somehow triggers check-in twice in a day. The existing `quest_completions` delete-then-insert pattern in `GroanCompletionModal` handles this for wahoos; daily check-ins use the date as natural deduplication.

### Sprint 1C: Protective Voice Counting ✅ DONE (Jul 2026)

**Implemented in:** `heroStageChecker.js` (gate), `JourneyTab.jsx` (UI), `JourneyTab.css` (styles).
Gate: `totalVoiceCount >= 5` (any voice, not single dominant). UI: voice collection with rows + total progress bar. Original spec below for reference:

1. **Query (run in Zarlo context generation or a new utility):**
```javascript
const { data: voiceCounts } = await supabase
  .from('healing_intentions')
  .select('protective_voice')
  .eq('user_id', userId)
  .not('protective_voice', 'is', null)

// Count occurrences
const counts = {}
voiceCounts?.forEach(row => {
  counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
})
const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
// dominant = ['perfectionist', 4]
```

2. **Add to Zarlo context in `zarloEngine.js`:** Include `dominant_protective_voice` and `dominant_voice_count` in the context object passed to the system prompt.

3. **Zarlo proactive trigger:** In `ZarloWidget.jsx`, add a `useEffect` that checks voice count on mount:
```javascript
useEffect(() => {
  if (!userId) return
  // Query voice counts
  // If dominant count >= 3 and no previous notification for this threshold:
  //   setHasNotification(true)  // <-- already plumbed, currently unused
  //   setNotificationMessage("The [voice] keeps showing up...")
}, [userId])
```

This uses the `hasNotification` state that the UI audit confirmed is already wired but never set to `true`.

---

## 10. Research Audit Findings (2026-07-12)

### Figurine Branch Audit

**Branch:** `Figurine` (exists remote, reverted from main). 1,600+ lines of docs, working code.

**What's REUSABLE:**
- `computeIntelligence()` — milestone-based intelligence scoring (4 phases over months)
- `getGroupStyle()` — archetype voice calibration (4 group styles)
- `buildSystemPrompt()` — archetype-voiced prompt builder with phase-specific guidance
- `getReturnMessage()` — absence-calibrated return messages (3-7, 8-14, 15-29, 30+ days)
- CSS breathing/glow animations per NS state (4 keyframes: confident 3s, relaxed 4s, agitated 1.5s, slow 6s)
- `essence_avatar_memory` table (pattern/correction/insight/milestone/fear/breakthrough types, confidence scoring, supersede chain)
- Data loading pattern (6 parallel Supabase queries)
- `custom_essence_figurine` column on `lead_flow_profiles`

**What needs REBUILDING (chatbot → coach):**
- `EssenceAvatarPanel.jsx` is a chatbot UI (text input + message thread). The coach should be a ONE-WAY coaching moment overlay, not a conversation.
- `EssenceAvatarWidget.jsx` is an always-on floating widget. The coach should APPEAR only at transitions/stuck moments, not persist.
- Dark theme CSS violates light-theme convention. Needs redesign.
- `hasSomethingToSay` is hardcoded to `false` (Phase 2 pattern detection was never built).
- No stage transition detection. No stuck detection. No Unstick Flow.

**Architecture recommendation:**
- **Reuse:** Intelligence scoring, archetype voice, system prompt builder, memory table, CSS animations, data loading
- **Build new:** Stage transition listener, stuck detector with per-stage thresholds, 3-step Unstick Flow modal, one-way coaching overlay
- **Discard:** Chatbot panel, free-text input, streaming conversation, dark-theme panel, "replaces Zarlo" approach

### UI Pattern Audit

**Celebrations (reuse for Insight Drops + Graduations):**
- `MicroToast` — 7 preset types, add new types for insight drops. Fixed pill at top, slide-in/out, 2.5s.
- `LevelUpModal` — Full-screen dark overlay, pop animation, auto-triggers confetti. Use for stage graduations.
- `useCelebrations` hook — Central orchestrator. Add `celebrateStageGraduation()` and `celebrateInsightDrop()`.
- `FloatingPoints` — Floating "+N RP" that rises and fades. Already works.

**Zarlo Widget (proactive bubbles ready):**
- `hasNotification` state EXISTS but is **never set to true**. The red pulse dot is plumbed and unused. This is the exact hook for proactive Zarlo messages.
- A preview speech bubble above the FAB would need a new element (doesn't exist yet).
- Chat panel is dark theme (`--zarlo-bg: #1a1a2e`) — needs updating for light theme convention.

**Tab Architecture (Journey tab addition):**
- Tabs defined in `useChallengeData.js` line 138: `['Tune', 'Wahoo', 'Healing', 'Level']`
- Adding Journey tab = add to array + conditional render in `Challenge.jsx`
- Tab syncs to URL via `?tab=` query parameter (deep linking works)
- Sub-tabs within tabs use `stage-tabs` pattern (Healing has daily/weekly/explainer)

**Modal Patterns (for Unstick Flow + Graduations):**
- `HealingFlowModal` is the closest reference: 7-step, auto-save on unmount, resume-aware, multi-step via `step` state
- Center overlay: `position: fixed; inset: 0; background: rgba(0,0,0,0.5)`, white card, 22px border-radius, max-width 420px
- Bottom sheet: `QuestTaskSheet` pattern, slides up, drag handle, max-height 75vh

**Social Features (for Kudos extension):**
- 4 reaction types exist: 🎉 Cheer, 🔥 Fire, 👏 Clap, 💜 Heart
- Optimistic UI with revert on failure
- `league_content_reactions` table with unique constraint on (submission_id, user_id, reaction_type)
- Reaction system is GENERIC — can be reused for any content type by passing different `submission_id`
- `ContentCard` pattern (avatar + name + action + media + reactions) is reusable for any social feed

**Scheduled Jobs (for Zarlo Brief):**
- `pg_cron` + edge function pattern already in use (league scoring every 15 min, push notifications 3x daily)
- Pattern: pg_cron calls edge function via `net.http_post()` with service role key
- The Zarlo Brief can use this exact pattern: daily cron generates brief per active user

---

*These notes should be read alongside:*
- *`docs/features/measurement-framework-exploration.md` (the framework)*
- *`docs/research/octalysis-x-measurement-framework-gap-analysis.md` (the gap analysis)*
- *`docs/research/octalysis-daily-engagement-analysis.md` (Duolingo/Hades/Celeste models)*
