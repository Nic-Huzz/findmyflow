# Zone Calibration Framework — Integration Analysis
*How the 8-graph system maps onto FindMyFlow's existing game layer*

---

## What's Already Built That Aligns

The codebase has strong foundations that the framework maps directly onto:

| Framework Concept | Already Built | Gap |
|---|---|---|
| 5 Protective Archetypes | `protectiveProfiles.js` — same 5 archetypes with Polyvagal states | None, exact match |
| 4 R's (Recognise/Release/Rewire/Reconnect) | Quest types in `challengeQuestsUpdate.json` | Quests exist but aren't mapped to specific graphs |
| Zone scoring (fear x excitement) | Groan Matrix essence zone scoring | Scores a single challenge, not a life domain |
| Nervous system assessment | 80 Safety Contracts as FEAR TESTS across 8 wound types | Tests wound-specific, not graph-specific |
| Diagnostic flow | Play Profile quiz + Tension Layer assessment | Tension layers are 4 stages (Discover/Regulate/Reveal/Value), not 8 graphs |
| Game levels | 10-stage system (0 to 8) | Stages map to business progression, not psychological progression |
| Zarlo context | `zarloEngine.js` routes to flows based on 5 struggle types | Doesn't know which graph/wall the user is on |
| Flow Compass (N/E/S/W) | Energy tracking with Excited/Tired x Ease/Resistance | Tracks state but doesn't connect to graph progression |
| Splinter visualisation | Healing Compass captures shape, size, colour, texture, movement, location | Somatic data captured but not linked to graph thresholds |
| Essence/Protective voice quests | Daily check-ins tracked per stage | Voice data exists but isn't mapped to overactivation vs underactivation walls |

---

## The Key Integration Opportunity

The framework introduces **8 graphs as game levels** with a "first NO = where you start" gateway diagnostic. This is a **parallel progression system** to the existing business stages, not a replacement.

- **Business stages (0-8)**: What you're building externally
- **Zone levels (1-8)**: What you're calibrating internally

The two interlock. You can't sustainably progress through business stages if your zone calibration is off. The framework literally explains *why* users get stuck at certain business stages.

### How the Two Systems Map

| Zone Level | Graph | Business Stage It Unblocks |
|---|---|---|
| Level 1 | Enough Sweet Spot | Stage 0 (Flow Finder) — permission to begin |
| Level 2 | Vulnerability Sweet Spot | Stage 0.5 (Play-List) — safety to be visible |
| Level 3 | Sprouter Sweet Spot | Stage 0.9 (Setup) — direction from self-knowledge |
| Level 4 | Growth Sweet Spot | Stages 1-3 (Validation/Product/Testing) — calibrated challenge |
| Level 5 | Execution Sweet Spot | Stages 4-5 (Money Models/Offers) — sustainable output |
| Level 6 | Passion-Risk Matrix | Stage 6 (Campaign) — fuel for bold moves |
| Level 7 | Flow Sweet Spot | Stage 7 (Launch) — aligned action |
| Level 8 | Play Sweet Spot | Stage 8 (Tracking) — integration, the proof |

---

## Recommended Implementation Strategy

### Phase 1: The Diagnostic (Highest Impact, Lowest Effort)

**The Gateway Questions flow** — 8 binary yes/no questions that locate the user's threshold graph. This is the "nail the diagnostic" strategic priority from the framework doc itself.

**Where it lives:**
- New flow at `/zone-calibration` or integrated into Play Profile as a new mode (`?mode=zone`)
- Could also replace the current Tension Layer assessment since it serves the same purpose with more depth

**Mechanic:**
- Sequential yes/no questions. First NO = their current level. Fast, 2-minute flow.
- Binary format is deliberate. The doc is explicit: yes/no forces the nervous system to answer before the analytical brain negotiates. No sliders, no scales.

**The 8 Gateway Questions (from the framework):**

```
1. Can you start without self-criticism paralysing you?
   NO → Enough Sweet Spot (Level 1)

2. Can you be honest with yourself without shutting down?
   NO → Vulnerability Sweet Spot (Level 2)

3. Do you know what you genuinely value and want?
   NO → Sprouter Sweet Spot (Level 3)

4. Can you take on challenge without collapsing or overshooting?
   NO → Growth Sweet Spot (Level 4)

5. Can you sustain movement without burning out or stalling?
   NO → Execution Sweet Spot (Level 5)

6. Do you feel genuinely inspired by what you're moving toward?
   NO → Passion-Risk Matrix (Level 6)

7. Does your daily life feel aligned with who you actually are?
   NO → Flow Sweet Spot (Level 7)

8. Do you experience genuine play — free, present, unselfconscious?
   NO → Play Sweet Spot (Level 8)
```

**Data model:**
- New `zone_calibration_results` table: `user_id`, `threshold_graph` (1-8), `wall_side` (overactivation/underactivation), `polyvagal_state` (sympathetic/dorsal), `assessed_at`
- Links to existing `user_stage_progress` for cross-referencing business stage with zone level

**Connection to existing systems:**
- Result feeds directly into Zarlo's context so it knows which graph/wall the user is on
- Tension Layer assessment could be deprecated or kept as a "quick check" that maps onto the first 4 gateway questions

---

### Phase 2: Wall Identification (Projection Scenarios)

Once the gateway identifies the threshold graph, **observer/projection scenarios** diagnose which wall (overactivation vs underactivation) the user is pressing against.

**Why this matters:**
- Same graph, different medicine. Overactivation (top-left, Sympathetic) needs discharge + deceleration. Underactivation (bottom-right, Dorsal Vagal) needs gentle titrated activation.
- The wall automatically reveals the Polyvagal state. No separate nervous system assessment needed.

**Format — Observer/Projection (recommended by the doc):**
- User observes a character displaying the pattern
- "Which of these two people bothers you more?" format
- Analytical brain stands down because they think they're judging someone else
- Emotional charge = diagnostic signal

**Where it lives:**
- Zarlo-guided conversational flow after gateway, not a traditional quiz
- Could also be a step within the Play Profile flow

**Per-graph wall identification:**

| Graph | Overactivation Wall (Top-Left) | Underactivation Wall (Bottom-Right) |
|---|---|---|
| Enough | Perfectionist Zone (never finishes) | Procrastinator Zone (never starts) |
| Vulnerability | Burden Zone (overshares) | Shallow Zone (walls up) |
| Sprouter | Misguided Zone (busy but unfulfilled) | Paralysis Zone (knows but can't move) |
| Growth | Failure Zone (overshoots capacity) | Safe Zone (stays comfortable) |
| Execution | Ruthless Discipline (burnout) | Rely on Motivation (stalls) |
| Passion-Risk | Reckless Zone (risk without care) | Secure Zone (dreams stay dreams) |
| Flow | Future Trapped (chasing, never arriving) | Drift Zone (aligned but directionless) |
| Play | Reckless Zone (performing freedom) | Caged Zone (comfortable captivity) |

---

### Phase 3: Zone-Aware Challenge Generation

Once we know the user's threshold graph AND wall side, the **Groan Matrix challenge generation** can be tuned.

**How it connects to existing systems:**

- Challenges generated for the specific graph's domain (e.g., Enough = permission challenges, Vulnerability = sharing challenges)
- Wall side determines challenge intensity:
  - **Sympathetic users** (overactivation wall): discharge challenges, deceleration, stillness practices
  - **Dorsal users** (underactivation wall): gentle activation, small steps, titrated exposure
- Maps perfectly onto existing `scary_score` + `wahoo_score` system
- Could add a `zone_graph` and `wall_side` column to `groan_challenges` for tracking

**Challenge type mapping by graph:**

| Graph | Overactivation Challenges | Underactivation Challenges |
|---|---|---|
| Enough | "Ship something imperfect today" | "Start one thing, 5 minutes only" |
| Vulnerability | "Hold back from sharing for 24hrs" | "Tell one person one real thing" |
| Sprouter | "Cancel one commitment that isn't aligned" | "Take one action from what you know" |
| Growth | "Choose one challenge, say no to two" | "Do the thing you've been avoiding" |
| Execution | "Take a full day off without guilt" | "Produce one thing without waiting to feel ready" |
| Passion-Risk | "Ask why you're doing this before you leap" | "Name what you'd do if nothing could go wrong" |
| Flow | "Release one goal that isn't yours" | "Set one intention for this week" |
| Play | "Do something fun with no audience" | "Do something pointless for 10 minutes" |

---

### Phase 4: Graph Visualisation as Game Map

Replace/augment the `HorizontalFlowRiver` with a **graph-based journey map** showing all 8 levels as the sequence:

```
PERMISSION → SAFETY → KNOWING → CALIBRATION → SUSTAINABILITY → FUEL → ALIGNMENT → INTEGRATION
```

**Per-node display:**
- Locked / Current / Completed state
- Which wall was identified (if assessed)
- The "boss" defeated (Inner Critic, The Wall, The Fog, etc.)
- Power unlocked (Permission, Honest Self-Perception, Direction, etc.)

**Boss and Power table (from the framework):**

| Level | Boss to Defeat | Power Unlocked |
|---|---|---|
| Level 1 | The Inner Critic | Permission — you can begin |
| Level 2 | The Wall | Honest self-perception — you can see clearly |
| Level 3 | The Fog | Direction — you know who you are |
| Level 4 | The Comfort Zone | Calibration — you can grow without breaking |
| Level 5 | The Grind | Sustainability — you can move without burning |
| Level 6 | The Cage | Fuel — you know what you're living for |
| Level 7 | The Grip | Alignment — you move as yourself |
| Level 8 | The Mask | Integration — you are fully here |

**Design notes:**
- Could use the existing purple-to-gold ombre gradient across the 8 levels
- Each completed level could have a "save point" indicator (nervous system capacity that doesn't disappear)
- Regression under stress = revisiting a level, not losing progress (the "respawn mechanic")

---

### Phase 5: Backtrack Logic in Zarlo

The **backtrack table** from the framework is the AI coaching layer that makes the system come alive. When a user is stuck on a later graph, Zarlo can identify the earlier graph that needs attention.

**Backtrack rules (from the framework):**

| If Stuck Here | Backtrack To | Because |
|---|---|---|
| Misguided Zone (Sprouter) | Vulnerability Sweet Spot | Not safe enough to look inward yet |
| Failure Zone (Growth) | Enough Sweet Spot | "More = worthy" belief hasn't resolved |
| Safe Zone (Growth) | Sprouter Sweet Spot | No clarity on what you're actually growing toward |
| Ruthless Discipline (Execution) | Vulnerability Sweet Spot | Stillness means facing yourself, not safe yet |
| Rely on Motivation (Execution) | Passion-Risk Matrix | What genuinely fuels you hasn't been found yet |
| Secure Zone (Passion-Risk) | Sprouter Sweet Spot | What you actually care about hasn't been excavated yet |
| Future Trapped (Flow) | Vulnerability + Enough | Who you are doesn't feel enough without the result |
| Drift Zone (Flow) | Passion-Risk | Aligned but directionless, needs fuel not more self-knowledge |
| Caged Zone (Play) | Vulnerability Sweet Spot | Safety exists but freedom suppressed, walls still up |
| Reckless Zone (Play) | Sprouter Sweet Spot | Freedom without self-knowledge is chaos |

**Implementation in `zarloEngine.js`:**
- Add zone calibration result to Zarlo's context object
- When user reports being stuck, Zarlo checks the backtrack table before routing
- Example: "I notice you're hitting the Failure Zone in Growth. Let's check if your Enough Sweet Spot work is solid first."

---

## What NOT to Do

- **Don't replace the existing 10-stage business system.** The zone levels run alongside it as a parallel internal progression.
- **Don't build all 8 graph visualisations at once.** Start with the diagnostic, then build graph UIs as users reach them.
- **Don't use sliders or scales for the gateway.** Binary yes/no is deliberate. The nervous system answers before the analytical brain negotiates.
- **Don't lead with the deprogramming framing.** The doc is explicit: "Leading with 'we're fighting capitalism' alienates half the audience." The fun is the delivery mechanism for the depth.
- **Don't create a separate nervous system assessment.** The wall identification already reveals the Polyvagal state. The architecture was already doing this work implicitly.

---

## Priority Order

1. **Phase 1: Gateway Diagnostic** — Fast to build, immediately valuable, drives all other phases
2. **Phase 2: Wall Identification** — Completes the diagnostic, unlocks personalised challenge generation
3. **Phase 3: Zone-Aware Challenges** — Makes the Groan Matrix smarter without replacing it
4. **Phase 5: Backtrack Logic in Zarlo** — High leverage, makes Zarlo genuinely therapeutic
5. **Phase 4: Graph Visualisation** — The visual game map, builds on all previous phases

---

## Data Model Additions

### New table: `zone_calibration_results`

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| threshold_graph | int (1-8) | First NO in gateway sequence |
| wall_side | text | 'overactivation' or 'underactivation' |
| polyvagal_state | text | 'sympathetic' or 'dorsal_vagal' |
| gateway_answers | jsonb | All 8 yes/no answers for history |
| projection_scenario_id | text | Which scenario was used for wall identification |
| assessed_at | timestamptz | When the assessment was completed |
| is_reassessment | boolean | Whether this was a repeat assessment |

### Modifications to existing tables

- `groan_challenges`: Add `zone_graph` (int, nullable) and `wall_side` (text, nullable) for zone-aware challenge tracking
- `quest_completions`: Consider adding `zone_graph` to link quest completions to specific graph work
- `zarlo_conversations`: Zarlo context object gains `zone_calibration` field with current threshold/wall data

---

## Connection to Existing Features

| Existing Feature | How Zone Calibration Enhances It |
|---|---|
| **Play Profile** | Zone level becomes part of founder DNA profile. "You're stuck at Level 3 (Knowing)" |
| **Groan Matrix** | Challenges tuned to current graph domain + wall side |
| **Healing Compass** | Splinter work connects to the specific wound environment the gateway reveals |
| **Nervous System Flow** | Safety contracts can be sequenced by graph (earlier graphs first) |
| **Flow Compass** | N/E/S/W readings validate zone progression (more North = higher zone levels) |
| **Fantasy League** | Zone level progression could be a scoring category or badge system |
| **7-Day Challenges** | Daily quests mapped to current graph's 4 R's pathway |
| **Tension Layers** | Gateway questions are a more granular version of the same idea |
| **Voice Check-ins** | Essence/protective tracking validates which wall is active |
| **Zarlo** | Backtrack logic makes Zarlo a genuine therapeutic guide, not just a router |
