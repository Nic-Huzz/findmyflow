# Belief Frequency Research: Context & Decisions

> Handoff document for future agents. Covers the research, decisions, and current state of the belief frequency mapping system in Vibe Rise.

## What This Is

We researched whether beliefs can be mapped to David Hawkins' Map of Consciousness (1-1000 logarithmic scale) and to polyvagal nervous system states. The answer: yes, with caveats. The result is an enriched version of the existing 80 safety contracts in `src/data/nervousSystemBeliefs.js`, documented in `docs/belief-frequency-map.md`.

## The Research (May 2026)

### What's scientifically supported

1. **Emotions have measurable electromagnetic signatures.** HeartMath Institute (500+ peer-reviewed studies). A 2025 Nature Scientific Reports study (1.8M sessions) confirmed specific HRV coherence frequencies tied to emotional states.
2. **Beliefs alter gene expression.** Epigenetics is mainstream. Beliefs -> perceptions -> chemical signals -> gene expression (Lipton, though his extrapolations are contested).
3. **Neuropeptides carry emotional information with electrical charge.** Candace Pert's receptor research (peer-reviewed, foundational to psychoneuroimmunology). Emotions literally modify cells' electromagnetic frequency through receptor binding.
4. **Core beliefs cluster around specific emotional states.** CBT (Beck) and Schema Therapy (Young, 2003) have decades of clinical evidence. Beck's three categories: helplessness, unlovability, worthlessness.
5. **Nervous system state determines which beliefs feel "true."** Polyvagal Theory (Porges). In dorsal vagal shutdown, the brain cannot access beliefs about safety and love. This is the strongest bridge to Vibe Rise's existing 4-state model.

### What's NOT scientifically supported

1. **Specific Hz frequencies for beliefs.** No peer-reviewed research assigns Hertz values to emotions or beliefs. "528 Hz = love" etc. has no scientific basis.
2. **Hawkins' exact numerical calibrations.** His numbers come from muscle testing (applied kinesiology), which fails double-blind validation. An NIH-cited study found AK "fails as a reliable diagnostic tool."
3. **Practitioner consistency.** Different Hawkins practitioners report widely varying numbers for the same subject.

### What we CAN defensibly claim in the app

- "Beliefs carry energy" (Pert's neuropeptide research + HeartMath)
- "Limiting beliefs correlate with specific nervous system states" (Polyvagal + Schema Therapy)
- "Moving from shame-based to love-based beliefs follows a predictable emotional ladder" (converges across Hawkins, Abraham-Hicks, CBT, Schema Therapy)
- "Your nervous system state determines which beliefs feel true" (directly from Porges)

### What we should NOT claim

- Specific Hz frequencies for beliefs
- That Hawkins' exact numbers are "scientifically proven"
- That beliefs literally "vibrate" at measurable electromagnetic frequencies

### Key sources

- HeartMath: heartmath.org/science/, Nature 2025 study (1.8M sessions)
- Polyvagal: PMC article PMC9131189
- Candace Pert: Molecules of Emotion (1997), Wisdom of the Receptors
- Bruce Lipton: Biology of Belief (2005), evaluation at tmg.org.rs
- Hawkins: Map of Consciousness, veritaspub.com
- Abraham-Hicks: 22-level Emotional Guidance Scale (independent convergence with Hawkins)
- Schema Therapy: 18 Early Maladaptive Schemas, 5 domains
- Consciousness Calibrations Database: consciousnesscalibrations.com (30K+ calibrations, post-Hawkins)
- Critique: electricalspirituality.com (Hawkins methodology), NIH AK study (PMC3373872)

---

## The Core Bridge: Polyvagal -> Hawkins -> Vibe Rise

This is the key integration. The app already uses a 4-state NS model with RP scores. Hawkins maps cleanly onto it:

| Vibe Rise State | RP Score | Hawkins Range | Belief Band | Body State |
|----------------|----------|---------------|-------------|------------|
| Dorsal (Shutdown) | -2 | 20-75 | Shame, Guilt, Apathy, Grief | Freeze, dissociate, "I can't" |
| Sympathetic (Fight/Flight) | -1 | 100-175 | Fear, Desire, Anger, Pride | Hypervigilance, control, "I must" |
| Ventral (Safe) | +1 | 200-400 | Courage, Neutrality, Acceptance, Reason | Grounded, open, "I can" |
| Vibe Rise (Flow) | +2 | 500+ | Love, Joy, Peace | Flow state, creation, "I am" |

**The 200 threshold (Courage) is the critical line.** Everything below = contraction/force. Everything above = expansion/power. The sway test measures which side a belief lives on.

---

## What Exists in the Codebase

### Already built and live

1. **Safety Contracts Library** (`src/data/nervousSystemBeliefs.js`): 80 fear-format beliefs across 8 wound types (visibility, belonging, stability, worthiness, safety, impact, abundance, perfection). Currently stored as plain strings with selection logic.

2. **Nervous System Flow** (`/nervous-system`, `src/flows/NervousSystemFlow.jsx`): Live. Teaches sway test calibration via video, runs 5 triage tests (visibility, income binary search, safe pursuing, self-sabotage, feels unsafe), then tests 5-7 selected contracts with YES/NO sway responses. Saves to `nervous_system_responses` table (columns: `safety_contracts`, `belief_test_results`).

3. **Limiting Belief Rewire** (`/limiting-belief-rewire`, `src/flows/LimitingBeliefRewire.jsx`): Live. Reads YES contracts from NS flow, traces to origin via 7 questions (select contract -> impact -> origin memory -> details -> emotions -> insight/splinter framing -> healing options). Saves to `healing_compass_responses` table.

4. **Protective system data**: `src/data/protectiveVoices.js` (5 archetypes with origin, implicit belief, mechanism), `src/data/protectiveProfiles.js` (full depth profiles with NS pattern, somatic expression, discharge pattern), `src/data/woundStages.js` (4 developmental stages).

### Created by this research

5. **Belief Frequency Map** (`docs/belief-frequency-map.md`): All 80 safety contracts enriched with Hawkins level, emotion, NS state, antidote belief, antidote Hawkins level, and antidote NS state. Includes summary statistics, key patterns, and integration notes.

### In the Obsidian vault (read-only context)

- `Concepts/Consciousness Scale and Frequency.md`: Hawkins + Dispenza + Spiral Dynamics synthesis. Notes that the Groan Matrix operates at the Courage (200) threshold.
- `Concepts/Polyvagal Theory.md`: Three NS states mapped to chakra anatomy and Safety x Expression.
- `Concepts/Memory Reconsolidation.md`: Nader 2000, Ecker 2007-2012, van der Kolk 2014. Reactivate -> Mismatch -> New Learning.
- `Frameworks/Belief Graph.md`: 2x2 matrix (Belief x Capability). "Most beliefs running your life have never been tested."
- `Frameworks/Subconscious Shift Method.md`: 6-phase arc, 5 protective patterns, 4 emotional needs.
- `Frameworks/Installation Map.md`: Essence <- Protection <- Wound model.

---

## The Enriched Data: Key Stats & Patterns

From the verified `docs/belief-frequency-map.md`:

### Distribution of 80 safety contracts

| Hawkins Level | Emotion | Count | % |
|--------------|---------|-------|---|
| 20 | Shame | 10 | 12.5% |
| 30 | Guilt | 11 | 13.75% |
| 50 | Apathy | 1 | 1.25% |
| 75 | Grief | 7 | 8.75% |
| 100 | Fear | 43 | 53.75% |
| 125 | Desire | 2 | 2.5% |
| 175 | Pride | 6 | 7.5% |

NS split: 51 Sympathetic (63.75%), 29 Dorsal (36.25%).
Antidotes: 69 Ventral (86.25%), 11 Vibe Rise (13.75%).

### Wound depth ranking (average Hawkins level)

1. Perfection: 52.5 (deepest)
2. Worthiness: 63
3. Belonging: 69
4. Visibility: 86.5
5. Abundance: 88.5
6. Safety: 97.5
7. Impact: 96
8. Stability: 122.5 (shallowest)

### Key patterns

- **Fear (100) dominates** at 54%. Most common frequency blocking the 200 Courage threshold.
- **Shame + Guilt (20-30) = 26%** of contracts. Deepest, hardest to shift. Dorsal shutdown means somatic work required before cognitive reframing.
- **Most antidotes target Ventral (200-400)**, not Vibe Rise (500+). The goal is crossing 200, not leaping to 500.
- **Perfection, Worthiness, Belonging go deepest** (most Dorsal contracts). Stability, Safety, Impact are Sympathetic-dominant. Different healing modalities needed: somatic/breathwork for Dorsal wounds, courage challenges for Sympathetic wounds.
- **6 Pride-level (175) contracts** feel like strength but are protection. Last barrier before Courage. Users resist sway testing these because the belief feels justified.

---

## Confidence Assessment

### High confidence
- The Dorsal vs Sympathetic split (follows mechanically from Hawkins ranges)
- The ordinal ranking (Shame < Guilt < Grief < Fear < Pride)
- The wound depth ordering
- The antidote NS states
- The Polyvagal bridge to the existing 4-state RP system
- The summary statistics (verified by manual count)

### Medium confidence
- Individual Hawkins assignments. ~15 beliefs sit at boundaries (Fear vs Grief, Fear vs Desire). The emotion each belief activates depends on the individual, not just the text. These are best-guess defaults.
- Antidote Hawkins levels. Distinguishing 250 (Neutrality) from 310 (Willingness) from 350 (Acceptance) is inherently fuzzy.

### Low confidence / known limitations
- The same belief fires at different levels in different people. "If I'm fully visible, I'll be judged" is Fear (100) for someone anticipating future threat, but Shame (20) for someone reactivating a past humiliation.
- Hawkins' exact numbers are not empirically derived. The scale is useful as ordinal ranking, not as precise measurement.
- Desire (125) assignments are the softest. Only 2 remain (Impact #6, Abundance #6). Both could be Fear (100).

---

## Future Integration Options (Not Yet Built)

These were discussed but NOT implemented. No code changes were made.

1. **Enrich `nervousSystemBeliefs.js`**: Convert plain string arrays to structured objects with Hawkins level, NS state, emotion, antidote, etc. The data is ready in `docs/belief-frequency-map.md`.

2. **Belief Frequency Score**: Average Hawkins level of a user's active (sway-tested YES) contracts. Stored per user, tracked over time as contracts are cleared. Gives a measurable "consciousness journey."

3. **Antidote delivery**: The antidote beliefs are candidates for a "rewire confirmation" step in the Limiting Belief Rewire flow, or as affirmations in the Tune tab.

4. **Healing modality routing**: Dorsal-dominant wound types (Perfection, Worthiness, Belonging) could route to somatic/breathwork interventions. Sympathetic-dominant wounds (Stability, Safety, Impact) could route to courage challenges (Wahoos).

5. **Supabase table** (`belief_calibrations`): A database of beliefs extensible beyond the current 80, with all enrichment fields. Would allow adding new beliefs without code changes.

---

## Recommendations

### 1. Belief Mapping Engine (Excavator) should inherit this data

The Obsidian vault contains a full build spec for "The Excavator" (`Frameworks/Belief Mapping Engine.md`), a Zarlo-powered conversational engine that discovers hub beliefs via downward-arrow descent. When built, each hub it discovers could carry a Hawkins calibration and NS state from the frequency map. The charge score (0-10) the Excavator already collects is a real-time proxy for belief depth, which is what the Hawkins number represents statically. The two systems complement each other: the frequency map gives static defaults per belief text, the Excavator gives dynamic per-user readings.

### 2. Healing modality routing is the most actionable insight

Right now Wahoo challenges and healing quests treat all wounds the same. But the data shows a clear split:

- **Dorsal wounds** (Perfection avg 52.5, Worthiness 63, Belonging 69): Need the body to move before the mind can engage. Somatic work, breathwork, movement. The person is in shutdown and can't cognitively access what's running them.
- **Sympathetic wounds** (Stability 122.5, Impact 96, Safety 97.5): Need courage challenges (Wahoos). The person CAN think but is trapped in threat response. Action breaks the loop.

If the healing tab ever splits by wound type, this is the fork point. Dorsal wounds route to somatic interventions. Sympathetic wounds route to courage challenges.

### 3. Belief Layer Architecture maps to Hawkins bands

The vault's `Belief Layer Architecture.md` (Huzz original IP) defines 5 Permission Layers. These map cleanly:

| Permission Layer | Hawkins Band |
|-----------------|-------------|
| Permission to try | Courage (200) |
| Permission to fail | Neutrality (250) |
| Permission to succeed | Acceptance (350) |
| Permission to keep succeeding | Reason (400) |
| Permission to succeed effortlessly | Love/Joy (500+) |

The domain-specific challenge tables in that doc (Money, Love, Purpose, Body) could each carry Hawkins calibrations, giving users a "frequency reading" per life domain. Combined with the Belief Frequency Score (average of active contracts), this creates a multi-dimensional consciousness profile.

### 4. Antidotes are ready for the Rewire step

The 80 antidote beliefs in `docs/belief-frequency-map.md` are written and calibrated. They could slot into the Limiting Belief Rewire flow as a "rewire confirmation" screen after the splinter is identified, or surface as daily affirmations in the Tune tab (matched to whichever contracts the user tested YES on). The antidote's Hawkins level tells you how big the jump is: a Shame(20) -> Ventral(350) antidote is a bigger shift than Fear(100) -> Ventral(250). Bigger jumps may need intermediate stepping stones.

---

## Related Docs

- `docs/belief-frequency-map.md`: The enriched 80-belief reference (main deliverable)
- `docs/zone-calibration-framework.md`: The foundational framework for the app (51K, comprehensive)
- `docs/vibe-rise-ecosystem-architecture.md`: Master architecture doc
- `docs/subconscious-shift-method.md`: The method doc for Shift Architecture (healing methodology)
- Obsidian vault `MOC.md` section "Understanding the Healing Science" for Memory Reconsolidation, Polyvagal, Consciousness Scale context
