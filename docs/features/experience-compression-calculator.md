# Experience Compression Calculator

*Spec: July 2026. Status: Design final, ready to build.*

## What We're Building

A 5-minute interactive tool in the Creator Portal that helps experience creators spot where the next rule break in their branch is likely to happen. It walks them through the Rule Break Probability formula from the Rule Break Tree thesis, translates each variable into plain-language questions, and produces a shareable "Rule Break Opportunity Score" with specific predictions.

This is the diagnostic companion to Remarkable Results. Where Remarkable Results asks "what IS your rule break?", the Compression Calculator asks "where is the NEXT rule break waiting to happen in your field?"

## Why It Matters

Most creators don't know whether they're sitting on a goldmine or polishing a rock. The formula variables (Assumption Age, Experience Compression, Outsider Proximity, Adjacent Branch Unlock, Reversion Pressure) are powerful predictive tools, but they're academic in raw form. This tool makes them visceral by asking questions like "How long has everyone in your field believed this is just how it works?" instead of "Rate the Assumption Age."

The output connects directly to the creator's existing Remarkable Results and Scale Score data, creating a full picture: what's your rule break, how ready is it to scale, and how ripe is the field for what you're doing.

---

## User Flow

### Screen 0: Welcome (1 screen)

**What it shows:**
- Title: "Where's the next rule break in your field?"
- Subtitle: "Every industry has a rope stretched tight. This calculator helps you see how tight yours is, and where it's about to snap."
- If the user has a `remarkable_angles` record with a `branch` value, show: "We know you work on the [Branch] branch. Let's dig deeper."
- CTA: "Start" (primary-button)

**What happens next:** If branch is pre-filled from remarkable_angles, skip to Screen 2. Otherwise, go to Screen 1.

### Screen 1: Branch Picker (1 screen)

**What it shows:**
- Title: "Which branch does your work live on?"
- Subtitle: "Pick the one that feels most like home. If you're not sure, pick the one your customers would say."
- 12 primal branch cards in a 2-column grid, each showing:
  - Branch icon (reuse PRIMALS from ruleBreakTreeData.js)
  - Branch label
  - Felt description (e.g., "Going somewhere I couldn't reach")
- Below the primals grid, a secondary section: "Get more specific" showing sub-branches for the selected primal (from PRIMAL_INDUSTRIES). Only appears after a primal is tapped.

**What the user does:** Taps a primal branch, then optionally taps a sub-branch for specificity.

**What happens next:** Screen 2.

### Screen 2: Assumption Age (1 screen)

**What it shows:**
- Variable label: "1 of 5"
- Title: "How long has everyone in your field believed 'this is just how it works'?"
- Helper text: "Think about the ONE thing everyone accepts without questioning. The older the assumption, the bigger the opportunity when someone challenges it."
- If branch is Healing, example: "For decades, the assumption in therapy was that you have to talk about your problems to heal them."
- Scoring: 5 tappable options (not a slider, to match existing patterns):

| Value | Label |
|-------|-------|
| 2 | "A few years. It's a pretty new way of doing things." |
| 4 | "About a decade. People have settled into this pattern." |
| 6 | "A generation. 'This is how it's always been done.'" |
| 8 | "Multiple generations. Nobody alive remembers it being different." |
| 10 | "Centuries. It's so old people think it's a law of nature." |

- Bonus prompt (text input, optional): "What's the assumption?" (feeds into AI output)

**What happens next:** Screen 3.

### Screen 3: Experience Compression (1 screen)

**What it shows:**
- Variable label: "2 of 5"
- Title: "How much better could the experience actually be?"
- Helper text: "Imagine the gap between what people are getting right now and what they secretly know is possible. Like being stuck in the shallow end when you can see the deep end."
- 5 tappable options:

| Value | Label |
|-------|-------|
| 2 | "Not much. People are pretty satisfied with how things work." |
| 4 | "Some room. People complain but don't expect better." |
| 6 | "Real gap. People can feel something's missing but can't name it." |
| 8 | "Big gap. People are frustrated and actively looking for alternatives." |
| 10 | "Massive. The experience is so broken that people have given up expecting better." |

- Bonus prompt (text input, optional): "What's the gap? What should the experience feel like vs. what it actually feels like?"

**What happens next:** Screen 4.

### Screen 4: Outsider Proximity (1 screen)

**What it shows:**
- Variable label: "3 of 5"
- Title: "Are you seeing patterns from a different world?"
- Helper text: "The biggest breaks come from people who learned something in one field and applied it somewhere else. Are you bringing a fresh perspective from outside this branch?"
- 5 tappable options:

| Value | Label |
|-------|-------|
| 2 | "I'm a lifelong insider. I've always worked in this field." |
| 4 | "Mostly insider, but I've dabbled in other things." |
| 6 | "I split my time between this field and something different." |
| 8 | "I came from a completely different field and I keep seeing patterns the insiders miss." |
| 10 | "I'm from a different branch entirely. I see the rope because I've seen similar ropes cut before." |

- If user scored 6+, follow-up: "Which other branch taught you the pattern you're applying here?" (secondary branch picker, single tap, optional)

**What happens next:** Screen 5.

### Screen 5: Adjacent Branch Unlock (1 screen)

**What it shows:**
- Variable label: "4 of 5"
- Title: "Has something just become possible that wasn't before?"
- Helper text: "New technology, a cultural shift, a regulation change, a breakthrough in a neighbouring field. Something that just cracked open the door."
- 5 tappable options:

| Value | Label |
|-------|-------|
| 2 | "Not really. The tools and technology haven't changed much." |
| 4 | "A little. There are some new tools but nothing game-changing." |
| 6 | "Yes. A recent development made something new possible." |
| 8 | "Definitely. A big shift just happened and most people haven't caught on yet." |
| 10 | "A whole new capability just appeared. The old way is about to look embarrassing." |

- Bonus prompt (text input, optional): "What changed? What just became possible?"

**What happens next:** Screen 6.

### Screen 6: Reversion Pressure (1 screen, conditional)

**What it shows:**
- Variable label: "5 of 5"
- Title: "Has your industry drifted away from what it was supposed to be about?"
- Helper text: "Phase 3 breaks happen when an industry optimised so hard for speed, scale, or profit that it forgot what the experience was supposed to feel like. Farm-to-table was a reversion. Vinyl records were a reversion. Is your field ready for a snap-back?"
- This screen only appears if the user's Assumption Age score is 6+ AND Experience Compression is 6+ (high Reversion Pressure conditions). Otherwise, Reversion Pressure defaults to 1 (not a factor) and skips to Results.
- 3 sub-questions, each with 3 options:

**Sub-question A: Baseline Drift**
"How far has the experience drifted from what humans actually need?"
| Value | Label |
|-------|-------|
| 1 | "Not far. The experience is still close to what works for humans." |
| 2 | "Noticeably. Convenience replaced quality somewhere along the way." |
| 3 | "Completely. It barely resembles what the experience used to be." |

**Sub-question B: Measurement Accessibility**
"Can people see how far it's drifted? Do tools exist to measure it?"
| Value | Label |
|-------|-------|
| 1 | "No. People can't really see what they're missing." |
| 2 | "Starting to. New data or tools are making the gap visible." |
| 3 | "Yes. People can see the numbers and they're alarmed." |

**Sub-question C: Cultural Readiness**
"Is the culture ready to care about this gap?"
| Value | Label |
|-------|-------|
| 1 | "Not yet. People see the current way as progress, not a problem." |
| 2 | "Getting there. A growing group sees the issue." |
| 3 | "Yes. There's already a cultural movement demanding change." |

Reversion Pressure = Drift x Measurement x Cultural Readiness (max 27).

**What happens next:** Loading screen (1-2 seconds with spinner), then Results.

### Screen 7: Results (1 screen)

**What it shows:**

**Score Section:**
- Large score badge: "Rule Break Opportunity Score: [X] / 10"
- Score = normalized formula output (see Scoring Logic below)
- Score color: 1-3 purple (low), 4-6 gold (medium), 7-10 green (high)
- One-line verdict:
  - 1-3: "The rope is loose. The current way of doing things still works for most people."
  - 4-5: "There's tension. People sense something could be better, but nobody's cut the rope yet."
  - 6-7: "The rope is tight. Someone is going to break the rules in your field soon."
  - 8-9: "The rope is about to snap. The only question is who cuts it first."
  - 10: "Maximum compression. This field is screaming for a rule break."

**Variable Breakdown:**
- 5 horizontal bars (Assumption Age, Experience Compression, Outsider Proximity, Adjacent Branch Unlock, Reversion Pressure if applicable)
- Each bar shows the raw score and a one-word descriptor
- Highest-scored variable gets a gold highlight: "Your biggest advantage"
- Lowest-scored variable gets a subtle note: "Worth investigating"

**Phase Classification:**
- Based on the score pattern, classify as Phase 2 or Phase 3 opportunity:
  - Phase 2 (high Adjacent Branch Unlock, moderate Compression): "You're looking at a Phase 2 break. The industry is optimising, and someone from outside can do it better."
  - Phase 3 (high Reversion Pressure, high Compression, high Assumption Age): "You're looking at a Phase 3 reversion. The industry drifted so far from baseline that people are ready to come back to what works."

**Connection to Existing Data:**
- If user has `remarkable_angles` data: "Your rule break (from Remarkable Results) sits on the [branch] branch. This score measures how ready that branch is for someone like you."
- If user has `scale_diagnostics` data: "Combined with your Scale Score of [X], this means: [interpretation]." Interpretations:
  - High compression + high scale score: "Your field is ripe AND your experience is ready to scale. This is rare. Move fast."
  - High compression + low scale score: "The opportunity is huge but your experience needs more work before it can scale. Focus on your Scale Score weaknesses."
  - Low compression + high scale score: "Your experience is polished but the field isn't desperate for change yet. Consider whether you're truly breaking a rule or just doing the old thing better."
  - Low compression + low scale score: "Keep exploring. The field may not be ready, and neither is your experience yet. Go deeper on Remarkable Results."
- If user has `narrative_builders` data: show vehicle type alignment note

**Prediction:**
- AI-generated prediction using the branch, scores, and user's optional text inputs. Edge function call (see Data Connections). Example: "Based on the compression in the Healing branch, the next rule break is likely to come from someone who applies [adjacent branch] patterns to [assumption area]. The 10-year assumption that [user's assumption text] is the tightest rope on your branch right now."

**Actions:**
- "Share" button (screenshot-friendly card with score, branch, verdict)
- "Go to Remarkable Results" (if no remarkable_angles data)
- "Retake" (reset all answers)
- "Back to Portal" (navigate to /create)

---

## Scoring Logic

### Phase 2 Score
```
Phase 2 Raw = (Assumption Age / 10) x (Experience Compression / 10) x (Outsider Proximity / 10) x (Adjacent Branch Unlock / 10)
```

All values normalized to 0-1 range, multiplied together. This produces a 0-1 value where all four factors must be present for a high score.

### Phase 3 Score (when Reversion Pressure screen is shown)
```
Reversion Pressure = (Baseline Drift x Measurement Accessibility x Cultural Readiness) / 27
Phase 3 Raw = Phase 2 Raw x (1 + Reversion Pressure)
```

Reversion Pressure acts as a multiplier. When all three sub-factors are maxed (3x3x3=27), it doubles the Phase 2 score.

### Final Score
```
Final = Phase 3 applies ? Phase 3 Raw : Phase 2 Raw
Displayed Score = Math.round(Final * 10)  // 0-10 scale
Clamp to 1-10 range.
```

### Variable-Level Descriptors

| Raw Value | Descriptor |
|-----------|-----------|
| 1-2 | Low |
| 3-4 | Moderate |
| 5-6 | Notable |
| 7-8 | High |
| 9-10 | Extreme |

---

## Questions/Inputs Summary

| # | Variable | Plain-Language Question | What It Measures |
|---|----------|----------------------|-----------------|
| 1 | Assumption Age | "How long has everyone in your field believed 'this is just how it works'?" | Age of the unquestioned norm |
| 2 | Experience Compression | "How much better could the experience actually be?" | Gap between current and possible |
| 3 | Outsider Proximity | "Are you seeing patterns from a different world?" | Cross-branch pattern recognition |
| 4 | Adjacent Branch Unlock | "Has something just become possible that wasn't before?" | New capability from neighbouring fields |
| 5a | Baseline Drift | "How far has the experience drifted from what humans actually need?" | Distance from natural baseline |
| 5b | Measurement Accessibility | "Can people see how far it's drifted?" | Visibility of the gap |
| 5c | Cultural Readiness | "Is the culture ready to care about this gap?" | Spiral Dynamics stage readiness |

---

## Data Connections

### Reads From (existing tables)

| Table | Columns Used | Purpose |
|-------|-------------|---------|
| `remarkable_angles` | `branch`, `assumption`, `ai_rule_statement`, `score_ancestral`, `score_body` | Pre-fill branch, enrich predictions, connection narrative |
| `scale_diagnostics` | `total_score`, `phase_classification`, `branch` | Cross-reference with Scale Score for combined interpretation |
| `narrative_builders` | `vehicle_type`, `vehicle_desc` | Vehicle alignment note in results |
| `scope_map_results` | `stage` | Context for predictions (stream/lake/waterfall/river) |

### Writes To (new table)

**Table: `compression_scores`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, default gen_random_uuid() |
| `user_id` | uuid | FK to auth.users, NOT NULL |
| `branch` | text | Selected primal branch ID |
| `sub_branch` | text | Optional sub-branch ID, nullable |
| `assumption_age` | integer | 2-10 |
| `assumption_text` | text | Optional free text, nullable |
| `experience_compression` | integer | 2-10 |
| `compression_text` | text | Optional free text, nullable |
| `outsider_proximity` | integer | 2-10 |
| `outsider_branch` | text | Optional cross-branch ID, nullable |
| `adjacent_unlock` | integer | 2-10 |
| `adjacent_text` | text | Optional free text, nullable |
| `baseline_drift` | integer | 1-3, nullable (only when Reversion screen shown) |
| `measurement_accessibility` | integer | 1-3, nullable |
| `cultural_readiness` | integer | 1-3, nullable |
| `reversion_pressure` | numeric | Computed: drift x measurement x cultural / 27, nullable |
| `phase_classification` | text | 'phase_2' or 'phase_3' |
| `raw_score` | numeric | 0-1 range raw formula output |
| `display_score` | integer | 1-10 displayed score |
| `ai_prediction` | text | AI-generated prediction text, nullable |
| `created_at` | timestamptz | default now() |

**RLS:** Standard user isolation (user_id = auth.uid()).
**Unique constraint:** None. Users can retake and get multiple records (most recent used for display).

### Edge Function: `score-compression` (new)

Takes the user's scores + optional text inputs + branch, returns:
1. Computed scores (raw + display)
2. Phase classification
3. AI prediction paragraph (Haiku, using branch context from ruleBreakTreeData + user's text inputs + any existing remarkable_angles/scale_diagnostics data)

Prompt context should include:
- The branch description and known rule breaks on that branch (from NODES in ruleBreakTreeData.js)
- The user's free-text inputs (assumption, compression gap, adjacent unlock)
- The three-phase model (Phase 1/2/3) for interpretation
- Their remarkable_angles.ai_rule_statement if it exists

---

## React Component Structure

```
src/flows/
  ExperienceCompressionFlow.jsx    — Main flow container (step state machine, data fetch, save)
  ExperienceCompressionFlow.css    — Flow-specific styles

src/components/compression/
  CompressionBranchPicker.jsx      — Branch selection (primals + sub-branches)
  CompressionQuestion.jsx          — Reusable scored-option question component
  CompressionReversionBlock.jsx    — 3-part reversion pressure sub-questions
  CompressionResult.jsx            — Result screen (score, breakdown, predictions, share)

src/lib/
  compressionConfig.js             — Question definitions, score labels, verdict copy, phase logic
```

### ExperienceCompressionFlow.jsx

Pattern: Matches ScopeMapFlow and ScaleDiagnosticFlow. Step state machine with STEPS enum. Fetches existing data on mount (remarkable_angles, scale_diagnostics, narrative_builders). Saves to `compression_scores` on completion. Calls `score-compression` edge function for AI prediction.

### CompressionQuestion.jsx

Reusable component for screens 2-5. Props:
- `stepLabel` (e.g., "1 of 5")
- `title` (question text)
- `helperText` (explanation)
- `options` (array of { value, label })
- `value` (current selection)
- `onChange` (callback)
- `bonusPrompt` (optional text input config)
- `bonusValue` / `onBonusChange` (optional text state)

Renders: title, helper text, tappable option buttons (vertical stack, selected state with purple border), optional text input below, Next button.

### CompressionResult.jsx

The screenshot-worthy output. Uses a contained card layout (white background, purple/gold accents) similar to the CreatorShareCard pattern. Score badge prominent at top. Variable bars below. Phase classification. Data connections section. AI prediction in a styled quote block.

### compressionConfig.js

All question definitions, scoring logic, verdict copy, and phase classification rules. Exported as config object. Keeps the flow component clean and the logic testable.

---

## Route

**Path:** `/create/compression-calculator`

**Navigation entry points:**
1. CreatorHomeV2 Identity tab, inside BlowUpBrandCard or as a standalone card below it
2. Direct link from Scale Score results (when compression is relevant)
3. CreatorPositionCard "Explore your frontier" action

**Suggested placement in CreatorHomeV2:** Add a new card between BlowUpBrandCard and "Your Model" section in the Playbook sub-tab. Card design:

```
[Compression Calculator Card]
Title: "How ripe is your field?"
Subtitle: "See where the next rule break is hiding."
If completed: Show display_score badge + phase classification
If not: Show "Calculate →" CTA
```

---

## Integration with Existing Pipeline

The Compression Calculator sits alongside the Blow Up Brand pipeline (Results, Reach, Growth, Score) but is NOT sequential with it. It's a standalone diagnostic that enriches the pipeline context.

**Data flow:**
```
Remarkable Results (branch) → pre-fills Compression Calculator branch
Compression Calculator (scores) → enriches Scale Score interpretation
Compression Calculator (ai_prediction) → available to Zarlo for coaching context
```

The Compression Calculator does NOT gate or unlock any other flow. It's a "know your terrain" tool, not a prerequisite.

---

## Design Notes

- Light theme throughout (per CLAUDE.md). White cards, purple/gold accents.
- Import `src/styles/flow-base.css` for shared button and layout classes.
- Option buttons should use the existing `.option-btn` + `.option-btn.selected` pattern.
- Progress indicator: "1 of 5" text label (not progress dots, since this is a shorter flow).
- Mobile-first. Single column. No horizontal scrolling.
- Branch picker cards: 2-column grid with branch color accent on left border.
- Result card: constrained to 480px max-width, designed for screenshots.
- Back button on every screen (existing BackButton component or inline).
- Haptic feedback on option selection (hapticLight) and completion (hapticSuccess).

---

## Scope and Timing

**Build estimate:** 1-2 sessions. The flow is straightforward (7 screens, mostly tappable options, one API call). The complexity is in the result screen design and AI prediction quality.

**Dependencies:**
- `compression_scores` table migration
- `score-compression` edge function
- No other features need to ship first

**Not in v1:**
- Historical trend tracking (multiple retakes over time)
- Branch-specific example libraries (could be v2)
- Comparison with other creators on the same branch
- Integration with the Rule Break Tree visualization (could link out to it)
