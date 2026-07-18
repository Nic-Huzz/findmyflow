# Interior Scoreboard — Data Gaps & Unwired Signals

*Created: July 2026. Status: Identified during design session. Not yet fixed.*

These gaps were found when auditing how every user action feeds the two consumer metrics (Capacity + Clarity) and whether anything is missing for measuring + encouraging self-actualisation.

## Context

The app's thesis: **Capacity (Y axis) × Clarity (X axis) = Self-Actualisation diagonal.**
- Capacity = expanding what feels safe (action/safety, measured by Capacity Score 0-100)
- Clarity = knowing what path to pursue (self-knowledge, measured by cluster resonance %)

Both rising together = the Sprouter diagonal. The app should measure BOTH, detect which ZONE the user is in, and encourage diagonal movement.

Related specs:
- `docs/features/interior-scoreboard-spec.md` — full metric definitions
- `docs/features/interior-scoreboard-implementation-plan.md` — sprint plan
- `docs/features/monopoly-engine-spec.md` — taxonomy, 299 dataset
- Obsidian: `Frameworks/Collect Connect Your Flow.md`

---

## Gap 1: Weekly Review Data is Orphaned

### What exists
Users complete a weekly review with 7+ questions. Rich signals about identity shifts, fear responses, and consistency. Saved to `weekly_reviews` table. Huzz has 5 completed reviews.

### What's orphaned

| Question | Signal type | Should feed | Currently feeds |
|---|---|---|---|
| Q4: "Did you behave out of alignment because of fear?" | Fear/NS activation | **Capacity** (fear = safety contraction) | Nothing |
| Q5: "Did you stay consistent on the boring thing?" | Consistency/discipline | **Capacity** (consistency = sustained safety) | Nothing |
| Q8: "This week the old me would have ___. Instead, I ___." | Identity shift | **Clarity** (narrative revision = self-knowledge deepening) | Nothing |
| Q1: "Was the right move the easy move?" | Environment alignment | **Clarity** (environment matches your path) | Nothing |
| Q3: "What did you ship or experiment with?" | Action taken | **Capacity** (evidence of action) | Nothing |

### Data available
```sql
SELECT environment, identity_did, identity_text, compounding_did, 
       compounding_text, learning_text, attention_hours, narrative_revision
FROM weekly_reviews
WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4';
```
5 records. All fields populated. None feed Capacity or Clarity scores.

### Suggested fix
During Sprint 5 (guidance layer), wire weekly review signals:
- Q4 `identity_did = true` → Capacity adjustment (fear event = -1 to safety sub-score, or surface as Zone of Excellence warning)
- Q5 `compounding_did = true` → Capacity boost (consistency = safety sustained)
- Q8 `narrative_revision` → Clarity evidence (identity statement equivalent, add to Identity Statement Library)
- Q1 `environment = 'yes'` → Clarity signal (environment aligned)

Effort: Low. The data exists. Just needs wiring to the scoring hooks.

---

## Gap 2: No Zone Detection from the Two Numbers

### What's missing
The app has BOTH Capacity and Clarity scores but doesn't NAME which zone the user is in based on their combination. This is the most important missing piece for encouragement.

### The four zones (from Zone Calibration framework)

```
                    HIGH CAPACITY
                        │
     Misguided Zone     │     SELF-ACTUALISATION
     (doing without     │     (both rising together)
      knowing)          │     
                        │
   ─────────────────────┼──────────────────────
                        │
     Unfulfilment       │     Head Full of Dreams
     (neither)          │     (knowing without doing)
                        │
                    LOW CAPACITY

   LOW CLARITY ─────────────── HIGH CLARITY
```

| Zone | Capacity | Clarity | What the app should say |
|---|---|---|---|
| **Self-Actualisation** | High (>60) | High (>70%) | "Your safety and self-knowledge are rising together. You're on the diagonal." |
| **Head Full of Dreams** | Low (<40) | High (>70%) | "You know who you are but you're not moving toward it. What's one small step this week?" |
| **Misguided Zone** | High (>60) | Low (<50%) | "You're taking lots of action but it might not be aimed at the right thing. Try the Life Map." |
| **Unfulfilment** | Low (<40) | Low (<50%) | "You're at the start. That's okay. Begin with one practice and one curiosity." |
| **The Diagonal** | Both rising | Both rising | Celebrate. "Both went up this week. You're on the path." |

### What needs building
- Zone detection function: takes Capacity Score + Clarity % → returns zone name
- Display zone on Journey tab (below the two numbers)
- Diagonal celebration: when both metrics rise in the same week, trigger confetti / Zarlo message / mystery box
- Zone-specific nudges: each zone has a different "what to do next" suggestion

### Where in sprint plan
Sprint 5 (guidance layer). The zone detection is the foundation the guidance sits on. Without it, the guidance has no basis for what to suggest.

Effort: Medium. Detection logic is simple (threshold checks). Display + nudges need UX design.

---

## Gap 3: Cross-Pollination Doesn't Feed Clarity

### What exists
When a user completes a courage challenge, they can tag "did this also feed another quest?" This creates a record in `quest_cross_pollination` (source_quest_id, target_quest_id, groan_challenge_id).

Huzz has 3 cross-pollination links across his quests.

### Why it matters for Clarity
Cross-pollination = paths feeding each other = convergence = self-knowledge deepening. If your Dance Facilitator quest and your Vibe Rise quest keep feeding each other, that's a signal your paths are converging toward one thing. That IS Clarity sharpening.

### What's not wired
The cross-pollination count exists but doesn't contribute to the Clarity score. It's tracked data that goes nowhere.

### Suggested fix
Add cross-pollination as a Clarity sub-signal:
- More cross-pollination links = higher convergence component
- Could weight by: unique quest pairs (3 links between same 2 quests = 1 signal, not 3)
- Display: on Journey tab or Mirror page, show which quests feed each other

Simple calculation:
```
convergence_bonus = min(unique_cross_pollination_pairs / total_active_quests, 1.0)
// 3 unique pairs across 3 quests = 1.0 (fully converged)
// 1 unique pair across 5 quests = 0.2 (mostly separate)
```

This convergence_bonus could contribute to Clarity as a multiplier or additive component alongside cluster resonance.

### Where in sprint plan
Sprint 4 or 5. Needs quest skill tags (Sprint 3) to be meaningful — cross-pollination between quests tagged with the SAME skills is a stronger convergence signal than between unrelated quests.

Effort: Low. Data exists. Just needs a calculation + inclusion in Clarity formula.

---

## Additional Signals to Consider

### Protective voice patterns (not a gap, but an opportunity)
`healing_intentions.protective_voice` tracks which voice (controller, ghost, people-pleaser, auto-pilot, perfectionist) appears in each healing flow. If the same voice appears 5+ times, that's a significant pattern. Currently counted for hero stage graduation (Stage 7) but not surfaced to the user as insight.

Could show on Journey tab: "The Controller has shown up in 6 of your healing flows. This is your dominant protective pattern."

### Experience check-in predictions (minor gap)
Tune tab has experience check-ins where users predict outcomes and close them. The prediction accuracy (did they calibrate well?) is tracked but doesn't feed anything. Low priority — the signal is weak compared to wahoo classification.

### "Lit me up" consistency across sources (opportunity)
When curiosity inputs, to-do completions, AND courage challenges all show "lit me up" for the same skill tag — that's a triple-confirmed signal. Stronger than any single source. Could weight Clarity contribution by confirmation count:
- 1 source confirms = base signal
- 2 sources confirm = 1.5x
- 3 sources confirm = 2x

This rewards users who engage with all parts of the app, not just one tab.

---

## Summary for Reviewing Agent

| Gap | Priority | Effort | Sprint | Impact on self-actualisation measurement |
|---|---|---|---|---|
| Weekly review data orphaned | High | Low | Sprint 5 | 5 questions worth of identity/fear/consistency data going to waste |
| No zone detection | High | Medium | Sprint 5 | The TWO numbers exist but don't tell the user WHERE they are or WHAT to do |
| Cross-pollination unwired | Medium | Low | Sprint 4-5 | Convergence signal exists but doesn't feed Clarity |
| Protective voice patterns | Low | Low | Future | Insight opportunity, not a scoring gap |
| Experience check-in predictions | Low | Low | Future | Weak signal, low priority |
| "Lit me up" multi-source confirmation | Low | Medium | Future | Optimization, not essential |
