# Prediction Error (Gap Measurement) — Feature Spec

> Add this section to `dome-of-safety-spec.md` before "## Data Model" when ready.

## Concept

Fear doesn't reduce through habituation ("do it enough and it fades"). It reduces through **expectancy violation**: the user predicts catastrophe, reality delivers something manageable, and the nervous system's prediction model updates. This is the inhibitory learning model (Craske et al., 2014). The size of the gap between predicted and experienced difficulty predicts how durable the learning is, better than how much fear dropped during the event.

The Dome of Safety measures WHERE you can operate regulated (dimensions). Prediction Error measures HOW MUCH you're learning per rep (gap). They're complementary.

---

## Three Data Points Per Challenge

1. **Planning prediction** (at creation in WahooCreator, write-once): "How does your body feel thinking about this?" — the rational, planning self
2. **Pre-action prediction** (retroactive at completion): "You predicted [X]. Right before you did it, what was your body doing?" — the anticipation self. Acknowledged as memory-contaminated (the user knows the outcome) but captures a different signal: planning-self vs moment-self comparison.
3. **Experienced difficulty** (at completion): "And how was it actually?" — reality.

---

## Body-Based Scale (1-5)

Somatic anchors, not abstract scariness. A racing heart is a racing heart in month 1 and month 12. Mitigates scale drift.

| Level | Label | Description | Icon |
|-------|-------|-------------|------|
| 1 | Relaxed | Nothing changes in my body | 😌 |
| 2 | Alert | I notice something but it's manageable | 👀 |
| 3 | Butterflies | My stomach or chest tightens | 🦋 |
| 4 | Racing | Heart rate up, hard to think straight | 💓 |
| 5 | Frozen | I want to run or shut down | 🥶 |

Defined in `src/data/domeDimensions.js` as `DIFFICULTY_SCALE`.

---

## Two Gaps + One Insight

- **Planning gap**: creation prediction vs experienced. How well does your rational self predict?
- **Anticipation gap**: pre-action prediction vs experienced. How well does your in-the-moment self predict?
- **Amplification insight**: creation prediction vs pre-action prediction. Does your fear build or calm as the event approaches? Some people's anxiety escalates, others settle. This is NS personality data.

### Gap Formula

```
Gap = max(0, predicted - experienced)
```

- Positive gap = action was easier than predicted = learning happened (strong rep)
- Zero = accurate prediction (no surprise, modest learning)
- Negative = harder than expected (clamped to 0, dome doesn't expand from this)

---

## Courage Score vs Gap (Separate Metrics)

These measure different things and are NEVER combined into one formula:

- **Courage Score** = what you did (objective, from dimensions): `sum(level/max per tagged dimension)`, max 8.0
- **Gap** = what you learned (subjective, from prediction error): `max(0, predicted - experienced)`, max 4

A challenge where predicted=3, experienced=3 required the same COURAGE as predicted=5, experienced=2. The user just predicted more accurately in the first case. Don't penalize accurate self-awareness.

---

## What to Celebrate

- **Large gaps** — big surprise = strong rep. "Predicted Racing, experienced Alert. Your nervous system just learned something."
- **Rising entry level** — choosing harder things over time (average predicted_difficulty trending up)
- **Falling anticipation within a fixed tier** — average predicted_difficulty for tier-3 challenges drops over time = capacity growth

## What NOT to Celebrate

- Low predicted difficulty on its own (not brave, just easy)
- Streaks alone
- Completion count alone

---

## Pitfalls to Design Against

### Difficulty drift
Anticipation falls automatically if someone keeps doing the same easy thing. Without tier normalization, the winning strategy is to stop challenging yourself. All anticipation metrics must be scoped to a dimension tier or they're meaningless.

### Scale drift
A user's "Butterflies" in month one might not be their "Butterflies" in month six. Partial mitigation: somatic anchors are more stable than abstract numbers, and the RELATIVE gap (predicted - experienced) stays meaningful even if both drift equally.

### The armour signature (Sprint D)
If `experienced_difficulty` keeps coming in low but `predicted_difficulty` never falls, evidence is arriving but nothing is updating. Usually because the user is dissociating during the action. Surface this pattern (show the two flat lines), don't diagnose it in copy.

### Repetition bias
Identical repeated challenges give the cleanest data but the weakest learning. Variability across context and intensity produces more durable results. Don't let the metric design quietly push users toward repetition because it's easier to chart.

---

## Database Fields

All on `groan_challenges` table (no separate table needed):

```sql
predicted_difficulty   smallint CHECK (BETWEEN 1 AND 5)  -- write-once, set at creation
predicted_at           timestamptz                        -- when prediction was made
preaction_difficulty   smallint CHECK (BETWEEN 1 AND 5)  -- set at completion (retroactive)
experienced_difficulty smallint CHECK (BETWEEN 1 AND 5)  -- set at completion
experienced_at         timestamptz                        -- when experience was recorded
```

Write-once enforced by DB trigger on `predicted_difficulty`:
```sql
CREATE OR REPLACE FUNCTION prevent_prediction_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.predicted_difficulty IS NOT NULL
     AND NEW.predicted_difficulty IS DISTINCT FROM OLD.predicted_difficulty THEN
    RAISE EXCEPTION 'predicted_difficulty is write-once';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Capture Flow

### At creation (WahooCreator, Sprint A1)
After dimension tags + level pickers, on the same consolidated screen:
- "How does your body feel thinking about this?"
- 5 body pills, one tap, captures `predicted_difficulty`
- Write-once: locked after creation

### At completion (GroanCompletionModal, Sprint A2)
New `gap_check` step after existing `wahoo_check` (after after_state is set):
1. "You predicted [Butterflies]. Right before you did it, what was your body doing?" → 5 body pills → `preaction_difficulty`
2. "And how was it actually?" → 5 body pills → `experienced_difficulty`
3. Inline feedback: "Predicted Butterflies, experienced Alert. Strong rep!"
- Only shows for challenges with `predicted_difficulty` (skips legacy)
- All existing completion steps unchanged after this

---

## Gap as Diagnostic: Two Entry Points to Healing

The prediction gap and the existing healing flow are looking at the same underlying system (installed protective patterns) from different angles.

### Positive gap (predicted hard, experienced easy)

Two possible sources:
- **Known conditioning**: A protective voice you're aware of (you picked it in WahooCreator) predicted threat. Reality was fine. The gap confirms the voice was lying. The healing flow already addressed this voice — the positive gap is evidence it's working.
- **No data**: You've never done this, so your NS defaulted to threat. No wound, just no reference point. The gap gives it one.

**Response**: Celebration + reinforcement. "The voice said [X]. Reality said otherwise."

### Negative gap (predicted easy, experienced hard)

Two possible sources:
- **Hidden conditioning**: Something triggered a protective voice you didn't know was there. The dimension where the gap appeared points toward which voice activated.
- **Dissociation at prediction**: You couldn't feel your body when predicting. You said "relaxed" but you were numb, not calm (armour signature).

**Response**: Discovery prompt. "Your body reacted more than you expected. Which voice showed up?"

### The two entry points

| Entry Point | Trigger | When | Purpose |
|-------------|---------|------|---------|
| **Healing Flow** (existing) | "Feeling stuck?" — user can't start | Pre-action | Explore the voice you KNOW about |
| **Post-Gap Discovery** (new) | Negative gap detected at completion | Post-action | Discover a voice you DIDN'T know about |

### Post-Gap Discovery Flow (Sprint D)

When `experienced_difficulty > predicted_difficulty` (negative gap), after the gap_check step:

1. "Your body reacted more than you expected. Which voice showed up?" → show 5 protective voice options (Ghost, Perfectionist, People Pleaser, Controller, Auto-Pilot)
2. Selected voice is saved alongside the gap data
3. This voice becomes a suggested entry point for the healing flow next time: "Last time [dimension] triggered your [voice]. Want to explore that before this challenge?"

This turns the negative gap into a diagnostic tool: the gap REVEALS hidden voices, and the healing flow PROCESSES them. The two systems feed each other.

### Connection to Dome

- Protective voices you're AWARE of → over-predict → positive gap → dome expands (voice was wrong, NS updated)
- Protective voices you're UNAWARE of → under-predict → negative gap → dome doesn't expand → voice discovered → healing flow → next attempt has better prediction → eventually positive gap → dome expands

The healing flow is the mechanism that converts negative gaps into future positive gaps.

### Pattern-Triggered Healing (replaces voluntary "Feeling stuck?")

The existing "Feeling stuck?" prompt has low engagement because it requires the user to self-identify as stuck. Pattern-triggered healing replaces this with evidence-backed popups.

**Trigger:** 3+ challenges with the same `gap_voice` on overlapping dimensions.

**Popup:** "We noticed something. [Voice] has shown up every time you push [Dimension]. Want to explore what's behind it?"
Opens HealingFlowModal with voice pre-selected and dimension context pre-loaded.

**Why this works better:**
- Evidence-backed, not voluntary admission of weakness
- Specific to a dimension, not generic "feeling stuck"
- Only fires when the pattern is statistically real (3+ data points)
- The user said they always skip the voluntary prompt but would engage with a pattern-triggered one

**Data needed:**
- `gap_voice` on `groan_challenges` (already added)
- Query: group completed challenges by gap_voice, check for 3+ occurrences with overlapping dimension_values keys
- One-time popup per voice-dimension pattern (track shown patterns to avoid repeat prompts)

### Values Assist (Healing Flow Step 5)

The healing flow Step 5 asks "What's true now that wasn't true then?" All three test patterns resolved to values:
- Ghost: "I'm conscious of my values and the choices they guide"
- Controller: "I care more about who I'm becoming than FOMO"
- Perfectionist: "I want to believe I'm enough without accolades"

**The dome data already contains the user's values.** Courage challenges reveal values through action. No separate questionnaire needed.

**V1: Values Assist (embedded in Step 5)**

When the user struggles with Step 5 (blank for 15s or taps "I'm stuck"):

1. System pulls dimension frequency from completed challenges
2. Infers values using `inferValues()` from `domeDimensions.js`:
   - High Vulnerability → Authenticity (being seen as you really are)
   - High Rarity → Originality (creating your own path)
   - High People → Connection (impact, being heard)
   - High Money → Building (investing in yourself)
   - High Context → Adventure (expanding your world)
   - High Identity → Becoming (growing into someone new)
   - High Stakes → Commitment (betting on yourself)
   - High Business → Purpose (making it real)
3. Shows top 2-3 inferred values: "Based on what you keep choosing to do despite the fear, it looks like you value: **authenticity, originality, building something meaningful.**"
4. User confirms, adjusts, or adds their own
5. Auto-suggests Step 5 answer: "I value [X] now. That wasn't true when [origin] happened."

Not a new flow. A smart assist reading existing dome data, plus free-text for the user to add what the data doesn't capture.

**V2: Guided values discovery questions (deferred)**

For users with insufficient dome data. Structured questions to identify values from scratch. Design TBD.

---

## Display (Sprint B+D)

### Sprint B: inline on dome view
- Average gap stat shown below dome radar
- Per-challenge: gap shown on challenge cards ("Predicted 🦋 → Experienced 👀")

### Sprint D: trend lines (deferred)
- Two converging lines over time: predicted vs experienced
- The closing gap is the story
- Anticipation trend within dimension tiers
- Armour signature detection and surfacing

---

## Visual Direction (confirmed from mockups)

Hybrid of Draft A + Draft B:
- **Dome**: Draft A radar spider chart (purple fill + gold dashed edge ring)
- **Dimension bars**: Draft B grid layout (icon + label + level/max + purple/gold split bar showing dome vs edge)
- **Challenge cards**: Draft A style (title, dimension pills with values, courage score in gold, NS state transition)
- **Business model unlock**: Draft B card style (gold left border, model name in gold, gap description with bold purple dimension names)
