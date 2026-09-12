---
title: Intelligence Observations - Progress Tab
tags: [intelligence, insights, patterns, progress-tab, data-surfacing]
created: 2026-09-12
status: ready-for-agent
---

# Intelligence Observations — Progress Tab

> **The problem:** The app captures a goldmine of data per courage challenge, weekly review, and path definition. Almost none of it is surfaced back as intelligence. Users generate rich signals — prediction accuracy, life fuel trends, voice patterns, cross-pollination, NS state shifts — and never see what their data reveals.
>
> **The solution:** An "Observations" section on the Progress tab showing pattern-matched insight cards from real user data. Not AI-generated prose — data-driven observations triggered by thresholds, shown as dismissible cards.
>
> **The principle:** Surface, don't score. These are observations, not grades. The user decides what to do about them.

---

## Where It Goes

**Progress Tab** (`src/components/ProgressTab.jsx`) current order:
```
1. Hero Card (stage + journey map)
2. Essence Card
3. Voice Section (dominant voice + month-over-month)
4. Evidence Section (this week's challenges)
5. Per-Quest Radar (journey section)
6. Income Card (stage 8+)
7. Setup Checklist / Smart CTA
```

Add Observations between Essence and Voice:
```
1. Hero Card
2. Essence Card
3. ─── OBSERVATIONS (NEW) ───
4. Voice Section
5. Evidence Section
6. Per-Quest Radar
7. Income Card
8. Setup Checklist / Smart CTA
```

**Why here:** After identity context (Hero + Essence), before the detail sections. The observations are the "so what?" layer between "who you are" and "what you did this week."

---

## Data Sources — What's Captured But Not Surfaced

All of this data already exists in the database. Nothing needs to be newly captured.

### Per courage challenge (groan_challenges + quest_completions)

| Data Point | Table.Column | Currently Surfaced? |
|---|---|---|
| Predicted difficulty (1-5) | `groan_challenges.predicted_difficulty` | Only in gap_check step of completion modal |
| Pre-action difficulty (1-5) | `groan_challenges.preaction_difficulty` | Only in gap_check step |
| Experienced difficulty (1-5) | `groan_challenges.experienced_difficulty` | Only in gap_check step |
| Gap voice (which voice showed up) | `groan_challenges.gap_voice` | Voice pattern detector (3+ threshold) |
| Dimension values (which dims + levels) | `groan_challenges.dimension_values` | ProgressTab trajectory count only |
| Predicted voice | `groan_challenges.predicted_voice` | Never surfaced as pattern |
| Wahoo classification (vibe_rise/fun/stressful/bored) | `quest_completions.reflection_text` → `wahoo_classification` | Shift detection (Zarlo only, not UI) |
| Identity statement | `quest_completions.reflection_text` → `identity_statement` | Shown as dropdown for reuse, never analyzed |
| Voice objection text | `quest_completions.reflection_text` → `voice_objection` | Never surfaced |
| Aftertaste (yes/not_sure/no) | `quest_completions.aftertaste` | Aftertaste second clock in weekly review |
| Aftertaste week later | `quest_completions.aftertaste_week_later` | Never aggregated |
| Expectation result (better/expected/worse) | `quest_completions.reflection_text` → `expectation_result` | Never surfaced |
| 3% reflection text | `quest_completions.reflection_text` → `reflection` | Never surfaced |
| Life fuel channels (choice/conn/mastery/meaning) | `quest_completions.reflection_text` → `life_fuel` | Never surfaced as patterns |
| Cross-pollination (which other quests fed) | `quest_cross_pollination` table | Never surfaced |

### Per weekly review

| Data Point | Table.Column | Currently Surfaced? |
|---|---|---|
| Voice won this week? (yes/no) | `weekly_reviews.identity_did` | Feeds voice section count |
| Which voice + what happened | `weekly_reviews.identity_text` | Never analyzed |
| Essence honour reflection | `weekly_reviews.compounding_text` | Never surfaced |
| Path fuel per quest (choice/conn/mastery/meaning) | `path_fuel_reviews` | Never surfaced as trends |
| Income per quest | `income_self_reports` | Income card (stage 8+ only) |

### Per NS checkin

| Data Point | Table.Column | Currently Surfaced? |
|---|---|---|
| Before state (ventral/sympathetic/dorsal) | `nervous_system_checkins.before_state` | Never aggregated |
| After state | `nervous_system_checkins.after_state` | Feeds dome growth calculation |

### From lead magnets (siloed)

| Data Point | Table.Column | Currently Surfaced? |
|---|---|---|
| Ambition Radar dream text | `lead_captures.scores` → `dream_text` | Never — completely siloed from logged-in app |
| Ambition Radar dream dimensions | `lead_captures.scores` → `dream_dimensions` | Never — separate from quest `dream_dimensions` |
| Ambition Radar precursor level | `lead_captures.scores` → `precursor` | Never |

---

## Observation Card Types

### Type 1: Pattern Cards
Triggered by 3+ data points showing a recurring pattern. The most valuable type.

| ID | Pattern | Data Query | Trigger | Card Text |
|---|---|---|---|---|
| `voice_dimension_cluster` | Same voice appearing on same dimension repeatedly | `groan_challenges` grouped by `gap_voice` + `dimension_values` keys | Voice X appeared on dimension Y 3+ times in 30 days | "Your [Voice] keeps showing up on [Dimension]. [Count] times this month. Something about [dimension description] is activating your [voice description]." |
| `prediction_accuracy` | Predicted vs experienced difficulty trend | `groan_challenges` — avg `abs(predicted_difficulty - experienced_difficulty)` over rolling 10 challenges | Average gap decreased below 1.0 (or crossed a threshold) | "Your prediction accuracy crossed [X]%. You predicted [avg predicted], experienced [avg experienced]. You're learning to read your body." |
| `expectation_trend` | % of challenges that went better than expected | `quest_completions.reflection_text` → `expectation_result` counts | 70%+ "better" over last 10 challenges | "[X]% of your challenges went better than expected. The voice is wrong most of the time." |
| `fuel_drought` | A life fuel channel missing from a specific path for 3+ weeks | `path_fuel_reviews` per quest, per fuel, weekly | A fuel has been false for 3+ consecutive weekly reviews on same quest | "[Fuel] has been missing from your [quest name] path for [X] weeks. Is this path still feeding you?" |
| `fuel_per_challenge` | One fuel channel dominates or is absent across challenges | `quest_completions.reflection_text` → `life_fuel` aggregated | One fuel appears 80%+ or 0% across last 10 challenges | "[X]% of your challenges involved [Fuel]. [Other fuel] hasn't fired in [Y] challenges." |
| `ns_baseline_shift` | Before-state distribution shifting over time | `nervous_system_checkins.before_state` first 10 vs last 10 | Sympathetic % dropped 20+ points | "You started [X]% of your early challenges in fight-or-flight. Now [Y]%. Your baseline is shifting." |
| `aftertaste_second_clock` | % of "not sure" challenges that became "yes" after a week | `quest_completions` where `aftertaste = 'not_sure'` and `aftertaste_week_later` exists | 10+ second-clock data points | "[X]% of your 'not sure' challenges became 'yes' after a week. Trust the aftertaste — your body knows before your mind does." |
| `identity_evolution` | Words appearing in identity statements changing over time | `quest_completions.reflection_text` → `identity_statement` — simple word frequency | A word appears in 3+ recent statements that didn't appear in first 5 | "Your last [X] identity statements mention '[word].' That word didn't appear in your first 5. Something is shifting." |
| `cross_pollination_convergence` | One quest consistently feeding another | `quest_cross_pollination` grouped by source/target quest | Same source→target pair appears 4+ times | "[Quest A] fed [Quest B] in [X] of your last [Y] challenges. These might be converging." |
| `voice_frequency_shift` | A voice appearing less over time | `groan_challenges.gap_voice` monthly counts | Voice count dropped 50%+ month-over-month | "Your [Voice] appeared [X] times last month. This month: [Y]. Something you're doing is working." |
| `wahoo_shift` | Emotional classification shifting on a quest | `quest_completions.reflection_text` → `wahoo_classification` first 5 vs last 5 on same quest | Shifted from majority stressful/bored to majority fun/vibe_rise | "Your first challenges on [quest] felt [old state]. Your recent ones feel [new state]. The path is opening up." |

### Type 2: Milestone Cards
Triggered by crossing a threshold. Celebratory but informative.

| ID | Milestone | Trigger | Card Text |
|---|---|---|---|
| `dimension_level_up` | A dome dimension reached a new level | Dimension level increased (computed from challenge dimension_values + NS after_state) | "You've reached level [X] on [Dimension]. You started at level [Y]. [Count] challenges got you here." |
| `challenge_count` | Challenge count milestones | 10, 25, 50, 100 completed challenges | "[X] courage challenges completed. You're building a case study." |
| `quest_streak` | Consecutive weeks with a challenge on a quest | 4, 8, 12 week streaks | "[X] weeks in a row on [quest]. Consistency is the compound interest of courage." |
| `prediction_milestone` | Prediction accuracy crossed a threshold | Average gap < 1.5, < 1.0, < 0.5 | "Your prediction gap is below [X]. You predicted [predicted], experienced [actual]. Your self-awareness is sharp." |

### Type 3: Prompt Cards ("do X more to learn about")
Shown when the user is CLOSE to unlocking a pattern but doesn't have enough data yet.

| ID | What they're close to | Trigger | Card Text |
|---|---|---|---|
| `near_prediction_insight` | Prediction accuracy trend | 7-9 challenges with gap data (need 10) | "[X] more challenges with the difficulty check and we can show you your prediction trend." |
| `near_fuel_pattern` | Life fuel pattern per quest | 5-7 path fuel reviews on a quest (need 8) | "Rate your path fuels [X] more weeks and we'll show you which channel is trending." |
| `near_voice_pattern` | Voice pattern on a dimension | Voice appeared on same dimension 2 times (need 3) | "Your [Voice] appeared on [Dimension] twice. One more and we can spot a pattern." |
| `near_convergence` | Cross-pollination convergence | Same source→target pair 2-3 times (need 4) | "[Quest A] has fed [Quest B] [X] times. A few more and we'll know if they're converging." |
| `near_aftertaste_insight` | Aftertaste second clock trend | 6-9 second-clock data points (need 10) | "[X] more 'not sure' follow-ups and we can show you your aftertaste accuracy." |

### Type 4: Compass Cards (from Aliveness Compass)
These connect to the Vibe Rise Aliveness Compass spec (`vibe-rise-aliveness-compass-spec.md`).

| ID | What it surfaces | Trigger | Card Text |
|---|---|---|---|
| `aliveness_deficiency` | A Vibe Rise dimension flat or dropping | Bi-weekly check-in shows dimension <= 2 for 2+ check-ins, or dropped 2+ from baseline | "Your [dimension] has been flat for [X] weeks. Your [quest] path is the one that grows [dimension]. Consider: [challenge suggestion]." |
| `armour_warning` | Dome growing but aliveness flat | Dome expanded (new challenge completions with NS growth) but Vibe Rise Radar flat or down over 2+ check-ins | "Your dome grew in [X] dimensions this month. Your aliveness check-in dropped. You might be pushing through instead of opening up." |
| `aliveness_growth` | A dimension grew significantly | Vibe Rise dimension increased 2+ from baseline | "Your [dimension] went from [baseline] to [current] since you started [quest]. The path is working." |

---

## Observation Card Component

### Props
```
{
  type: 'pattern' | 'milestone' | 'prompt' | 'compass',
  id: string,           // unique observation ID for dismissal tracking
  icon: string,         // emoji
  badge: string,        // "Pattern Spotted" | "Milestone" | "Unlock" | "Compass"
  title: string,        // one-line headline
  body: string,         // 1-2 sentence description
  action?: {            // optional CTA
    label: string,      // "Explore this" | "Ask Zarlo" | "Do a challenge"
    route?: string,     // in-app route
    handler?: () => void
  },
  dismissible: boolean, // true for all types
}
```

### Behaviour
- Cards are dismissible. Dismissed cards saved to `user_dismissed_observations` (user_id, observation_id, dismissed_at).
- Maximum 3 cards shown at once (most recent/relevant first).
- Cards have a subtle entrance animation (fade-in, not distracting).
- Pattern cards get a purple left border. Milestone cards get green. Prompt cards get amber. Compass cards get the Vibe Rise purple gradient.
- If no observations have been triggered yet, show nothing (no empty state — the section simply doesn't appear until there's something to show).

### Priority ordering (when more than 3 available)
1. Compass cards (aliveness deficiency, armour warning) — most actionable
2. Pattern cards — most insightful
3. Milestone cards — most motivating
4. Prompt cards — least urgent but build toward future insights

---

## Pattern Detection Engine

### Architecture

Create `src/lib/observationEngine.js` — a function that:
1. Takes user_id and their quest/challenge data (already loaded by `useChallengeData` hook)
2. Runs each pattern detector
3. Filters out dismissed observations
4. Returns top 3 sorted by priority

### Data loading approach

Most data is already loaded by `useChallengeData.js` (the hook that powers the Challenge page). The observation engine should receive this data as input, NOT make its own Supabase queries. This keeps it fast and avoids duplicate fetches.

**Data already available from useChallengeData:**
- All quests with dome dimensions
- All groan_challenges with predicted/experienced difficulty, gap_voice, dimension_values
- All quest_completions with reflection_text JSON, aftertaste
- NS checkins
- Weekly reviews
- Path fuel reviews

**Data that may need additional loading:**
- `quest_cross_pollination` (not currently loaded by useChallengeData — check)
- `user_dismissed_observations` (new table)
- `quest_aliveness_snapshots` (from Aliveness Compass, if built)
- `lead_captures` where source = 'ambition-radar' (for Ambition Radar data claim)

### Pattern detector structure

Each detector is a pure function:
```js
function detectPredictionAccuracy(challenges) {
  // Filter to challenges with both predicted and experienced difficulty
  // Calculate rolling average gap over last 10
  // If threshold crossed, return observation card props
  // If near threshold, return prompt card props
  // If neither, return null
}
```

All detectors return either an observation card object or null. The engine collects all non-null results, filters dismissed, sorts by priority, returns top 3.

### New table needed

```sql
create table user_dismissed_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  observation_id text not null,
  dismissed_at timestamptz default now()
);

alter table user_dismissed_observations enable row level security;
create policy "Users manage own dismissals"
  on user_dismissed_observations for all using (auth.uid() = user_id);

create unique index idx_dismissed_user_obs
  on user_dismissed_observations(user_id, observation_id);
```

---

## Integration with Existing Systems

### InsightDrop (existing toast system)
The existing `useInsightDrops` hook and `InsightDrop` component show one-off toast notifications (streak milestones, visibility layer dominance, voice emerging). These are session-scoped and disappear.

**Relationship:** The Observations section is the PERSISTENT version. InsightDrops are "hey, something just happened." Observations are "here's what your data shows over time." They complement, not replace. Some InsightDrop triggers could also create Observation cards (e.g., voice pattern at 3+ threshold currently creates an InsightDrop AND is shown in ProgressTab voice section — it should also create a pattern card in Observations).

### Voice Section (existing on ProgressTab)
The voice section already shows dominant voice with month-over-month dots. The Observations section adds richer voice analysis: voice-dimension clusters, voice frequency shifts, voice objection patterns. The existing voice section stays — Observations adds depth.

### Zarlo (AI chatbot)
Pattern cards could include "Ask Zarlo about this" CTA that passes the observation context to the chatbot for deeper exploration.

---

## Build Phases

### Phase 1: Infrastructure + first 3 patterns (build first)
- [ ] Create `ObservationCard` component
- [ ] Create `observationEngine.js` with detector structure
- [ ] Create `user_dismissed_observations` migration
- [ ] Implement 3 highest-value pattern detectors:
  - `expectation_trend` (% better than expected — simple, motivating, data-rich)
  - `voice_dimension_cluster` (voice on same dimension 3+ times — already partially built in voicePatternDetector)
  - `ns_baseline_shift` (before-state distribution shifting — powerful signal)
- [ ] Integrate into ProgressTab between Essence and Voice sections
- [ ] Dismissal logic (save to DB, filter on load)

### Phase 2: Milestones + prompts (build next)
- [ ] Add milestone detectors (dimension_level_up, challenge_count, quest_streak)
- [ ] Add prompt detectors (near_prediction_insight, near_fuel_pattern, near_voice_pattern)
- [ ] "Do X more" progress indicator on prompt cards

### Phase 3: Fuel + convergence patterns (build later)
- [ ] `fuel_drought` — path fuel trends from weekly reviews
- [ ] `fuel_per_challenge` — life fuel patterns from challenge completions
- [ ] `cross_pollination_convergence` — quest feeding patterns
- [ ] `identity_evolution` — word frequency in identity statements
- [ ] `prediction_accuracy` — rolling prediction gap trend

### Phase 4: Aliveness Compass integration (build after compass)
- [ ] `aliveness_deficiency` — requires quest_aliveness_snapshots table
- [ ] `armour_warning` — requires both dome growth data and aliveness check-in data
- [ ] `aliveness_growth` — positive signal from check-in comparison

---

## What NOT to Build

- **Don't use AI to generate observation text.** Every card's text is a template filled with real numbers. "72% of your challenges went better than expected" — not "It seems like you might be doing well."
- **Don't show observations before the user has enough data.** Use prompt cards to build toward insights, not fake insights from thin data.
- **Don't make observations feel like judgement.** "Your Connection has been missing" not "You're failing at Connection." Surface, don't score.
- **Don't show more than 3 cards.** Information overload kills the signal. Three cards, most important first. The rest exist — they'll surface when the current ones are dismissed or resolved.
- **Don't gamify observations.** No "insight score" or "patterns unlocked: 7/15." The observations serve the user, not the engagement metrics.

---

## Key Files for Build Agent

| File | Why |
|---|---|
| `src/components/ProgressTab.jsx` | Where Observations section gets added |
| `src/hooks/useChallengeData.js` | Data already loaded — feed to observation engine |
| `src/lib/voicePatternDetector.js` | Existing pattern detection — extend or reference |
| `src/hooks/useInsightDrops.js` | Existing insight system — complement, don't replace |
| `src/components/InsightDrop.jsx` | Existing card design — visual reference |
| `src/components/GroanCompletionModal.jsx` | Where challenge completion data is captured |
| `src/components/WeeklyReview.jsx` | Where weekly review data is captured |
| `src/flows/PathDefinitionFlow.jsx` | Where path dome dimensions are set |
| `docs/features/vibe-rise-aliveness-compass-spec.md` | Aliveness Compass spec (Phase 4 depends on this) |
| `docs/features/zone-cal-data-derived-scoring.md` | Related data-surfacing notes |
