---
type: feature-spec
status: ready-to-build
created: 2026-09-05
---

# Aftertaste — Essence Alignment Filter

## Summary

One-question addition to the post-courage completion flow that captures whether an experience is aligned with the user's essence. Separate from NS state (which captures the during-experience), and separate from growth edge data (which the dome dimensions already track).

## Grounding

Based on the Groan Zone thesis (`/Users/nichuzz/Downloads/groan-zone-thesis.md`), section 1b — "The Aftertaste Test":
- Groan tells you something is at stake. The aftertaste tells you whether it was yours.
- Appetite = domain claim present (essence-aligned)
- Relief = baseline only, nothing gained (not aligned)
- The thesis argues for two timepoints: immediate read (safe vs failure zone) and week-later read (mine vs created). This spec implements both.

MasterMind Council review (2026-09-05) refined the model:
- "Do I want to do that again?" measures essence alignment
- "Do I need to recover?" measures growth edge / capacity (already captured by dome dimensions + NS state)
- Only the essence question is needed as a new addition

## Part 1: Aftertaste Step (Post-Completion)

### Position in flow

After `wahoo_check` (step 2 — "How were you feeling during?"), before `gap_check`.

Current flow: state_checkin → wahoo_check → **[NEW: aftertaste]** → gap_check → expectation → cross_pollination → three_percent → life_fuel → share

### Trigger

Shows for ALL NS states (Vibe Rise, Fun, Stressful, Bored). Not conditional.

### Screen

```
Title: "Do you want to do that again?"

Three options (single-select, one tap):

🔥 Yes
   
🤔 Not sure

😶 No
```

No per-option response copy. Just capture and continue. Don't prescribe meaning — let the pattern reveal itself over time.

### Data model

New column on `quest_completions`:
- `aftertaste` text — values: `yes` | `not_sure` | `no`

### Routing

No alternate routing. All three options continue to `gap_check` or `expectation` as normal. The aftertaste is data capture only — never used for immediate routing or messaging.

### Pattern detection (future, not V1)

After 3+ completions on the same quest with consistent `no` aftertaste, Zarlo can surface: "You've done 4 courage challenges on this path and each time you didn't want to do it again. Is this path actually yours?"

After 3+ completions with consistent `yes`, reinforce: "This keeps lighting you up. That's your essence talking."

`not_sure` responses get resolved by the second clock (Part 2).

## Part 2: Second Clock (Weekly Review)

### Position

Inside the existing Weekly Review flow (`WeeklyReview.jsx`), which triggers Sunday/Monday.

### Trigger

Only shows if the user completed courage challenges that week AND any of them had an aftertaste of `not_sure`.

### Screen

```
Title: "A week on..."

For each `not_sure` challenge completed that week:

"You did [challenge title] and weren't sure if you wanted to do it again. 
A week later — has that changed?"

Three options:
🔥 Yes, I want to
😶 No, it's faded
🤷 Still not sure
```

### Data model

New column on `quest_completions`:
- `aftertaste_week_later` text — values: `yes` | `no` | `still_not_sure`

### Logic

- `yes` after a week = revealed appetite (essence-aligned, the novelty wore off and the want survived)
- `no` after a week = created appetite that decayed (not essence-aligned)
- `still_not_sure` = needs more exposure. No action.

### Weekly Review integration

Add as a new section AFTER question 1 ("Old me would have ___, instead I ___"). Question 1 creates the reflective frame that primes honest assessment. Putting the second clock before any reflection is too cold. Keep it lightweight — if there are no `not_sure` challenges from the past week, this section doesn't show at all.

## What this does NOT do

- Does NOT route users to healing based on a single response
- Does NOT label anything as "trauma" or "inherited claim"
- Does NOT replace the NS state check — these are independent measurements
- Does NOT capture growth edge/recovery data — the dome dimensions + NS state already do this
- Does NOT add friction to Vibe Rise or Fun completions — same one-tap question regardless of state

## Implementation notes

- Step name in GroanCompletionModal: `'aftertaste'`
- Add to step flow string: `'state_checkin' | 'wahoo_check' | 'aftertaste' | 'gap_check' | ...`
- Migration needed: `ALTER TABLE quest_completions ADD COLUMN aftertaste text; ALTER TABLE quest_completions ADD COLUMN aftertaste_week_later text;`
- WeeklyReview.jsx: query `quest_completions` for current week where `aftertaste = 'not_sure'` and `aftertaste_week_later IS NULL`
