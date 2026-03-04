# Implementation Plan: Tension Layer Onboarding

> Reference doc for replacing the 3 onboarding questions with 4 tension layer questions and moving the old business questions to the Setup tab.

## Why

The current onboarding asks 3 business-focused questions (employment status, wealth ladder, goal) that assume every user is building a business. As FindMyFlow broadens its audience, these don't fit the opening experience. The 4 tension layer questions (from `docs/2026-03-02-tension-layers-framework.md`) identify where in the "river" the user's flow is stuck — a universal self-identification that works for anyone. The old business questions move to the Setup tab where they're contextually relevant.

### Why 4 layers, not 5

The original framework had a 5th layer "Create" (Action) but it was removed because:
- Visibility and action are the same moment — every groan challenge IS an action
- When someone "can't take action," the real block is always one of the other 4 layers
- There is no scenario where action is blocked but all four others are resolved
- Inaction is always a symptom, never the root cause

---

## What Changes

### Onboarding (HomeFirstTime.jsx) — NEW 4 Questions

Replace Q1-Q3 with:

**Q1 — Discover**: "When it comes to knowing your direction..."
- "I have no idea what my thing is" (0)
- "I have a sense but it's fuzzy" (1)
- "I know my skills but not how they fit together" (2)
- "I'm clear on what I do and who I help" (3)

**Q2 — Regulate**: "When you imagine going all-in on your path..."
- "My body tightens up — I feel panic or shutdown" (0)
- "I get anxious but can push through sometimes" (1)
- "I notice the fear but it doesn't stop me as much" (2)
- "I feel grounded — I can sit with discomfort" (3)

**Q3 — Reveal**: "When it comes to being seen for your work..."
- "I hide — almost nobody knows what I'm working on" (0)
- "I share sometimes but hold back the real stuff" (1)
- "I'm visible online but struggle with deeper exposure" (2)
- "I put myself out there regularly, even when it's scary" (3)

**Q4 — Value**: "When it comes to being paid for what you do..."
- "I can't imagine charging — it feels wrong" (0)
- "I've charged but always feel like I should charge less" (1)
- "I charge but struggle to raise prices or expand" (2)
- "I know my value and price accordingly" (3)

After Q4: Simple priority layer reveal card (gold-highlighted, shows river element name + emoji + one-line description). Then → Mind Space → /me (same as current).

### Business Setup (BusinessSetup.jsx) — OLD 3 Questions Added

The Setup tab becomes a 6-step flow:
1. **BQ1** — "Where are you in your flow journey?" (employment status — from current Q1)
2. **BQ2** — "What have you created so far?" (wealth ladder — from current Q2)
3. **BQ3** — "What would help you find your flow?" (goal — from current Q3, with greyed-out options)
4. **Project Name** + Description (existing)
5. **Stage Selection** (existing)
6. **Product Identification** (existing)

BQ3 derives persona via `derivePersonaFromWealthLadder()` and saves to `user_stage_progress`. Everyone still sees the Setup tab (including vibe seekers).

---

## Database Migration

**Create:** `supabase/migrations/20260303000000_tension_layers.sql`

```sql
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_discover INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_regulate INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_reveal INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_value INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS priority_layer TEXT;
```

No data migration. Existing users have `onboarding_v2_completed = true` and won't re-onboard. New columns stay NULL for them.

---

## Files to Modify

| File | What Changes |
|------|-------------|
| `supabase/migrations/20260303000000_tension_layers.sql` | **Create** — new columns |
| `public/tension-assessment.json` | **Create** — 4 question definitions with scores |
| `public/persona-assessment.json` | **Keep unchanged** — BusinessSetup uses it |
| `src/lib/onboardingV2.js` | **Add** `computePriorityLayer()`, `TENSION_LAYER_DISPLAY` — keep all existing exports |
| `src/components/HomeFirstTime.jsx` | **Rewrite** — 4 tension questions + simple reveal card |
| `src/components/HomeFirstTime.css` | **Add** priority badge/card styles — reuse existing patterns |
| `src/components/BusinessSetup.jsx` | **Add** old Q1-Q3 as first 3 steps before project creation |
| `src/components/BusinessSetup.css` | **Add** question/option styles scoped under `.business-setup` |
| `src/lib/zarlo/zarloPageContent.js` | **Add** PAGE_CONTENT entries for tension screens |

---

## Key Implementation Details

### Priority Layer Scoring

```js
function computePriorityLayer(scores) {
  const layers = ['discover', 'regulate', 'reveal', 'value']
  // First: find lowest layer with score 0 or 1
  for (const layer of layers) {
    if (scores[layer] <= 1) return layer
  }
  // All ≥ 2: return the lowest-scored (weakest link)
  return layers.reduce((min, layer) =>
    scores[layer] < scores[min] ? layer : min
  , layers[0])
}
```

### Persona Handling

- Onboarding does NOT set `persona` anymore — only tension scores + priority_layer
- Persona gets set when user completes Business Setup (old Q1-Q3)
- App already defaults to `'vibe_seeker'` everywhere when persona is null (confirmed in useChallengeData.js, questCompletionHelpers.js)

### Onboarding Save (after Q4)

```js
await supabase.from('user_stage_progress').upsert({
  user_id: user.id,
  tension_discover: scores.discover,
  tension_regulate: scores.regulate,
  tension_reveal: scores.reveal,
  tension_value: scores.value,
  priority_layer: computedPriorityLayer,
  onboarding_completed: true,
  onboarding_v2_completed: true,
  current_stage: '0'  // Default — updated in Business Setup
}, { onConflict: 'user_id' })
```

### Business Setup Save (after BQ3)

```js
await supabase.from('user_stage_progress').upsert({
  user_id: userId,
  persona: derivePersonaFromWealthLadder(wealthLadderRung, employmentStatus),
  employment_status: employmentStatus,
  has_side_project: hasSideProject,
  wealth_ladder_rung: wealthLadderRung,
  primary_goal: primaryGoal,
  guidance_emphasis: determineGuidanceEmphasis(wealthLadderRung, primaryGoal)
}, { onConflict: 'user_id' })
```

### CSS Reuse

- Onboarding: Same `HomeFirstTime.css` — option-button classes, progress dots, page transitions, staggered animations. 4 dots instead of 3 (CSS nth-child already supports up to 5).
- BusinessSetup: Same `BusinessSetup.css` namespace — add `.bs-question`, `.bs-option`, `.bs-option-list`, `.bs-step-dots` matching existing `bs-` patterns

### Existing User Safety

- Users with `onboarding_v2_completed = true` never see the new onboarding
- Their `persona`, `wealth_ladder_rung`, etc. remain set from the old flow
- New tension columns stay NULL — no impact on existing functionality

---

## Future Enhancements (Not In This Scope)

- **Visibility edge follow-up**: After Q3, if score ≤ 2, ask which visibility layer is their edge (Screen/Live/Money/Vulnerable/Authority). Feeds Groan Matrix starting point.
- **River visualisation**: Replace simple card reveal with animated vertical river diagram
- **Priority section in 7-Day Challenge**: Top-of-feed card highlighting challenges for their priority layer
- **Tree progress visual**: Animated tree that fills in as user completes challenges across layers
- **Re-assessment**: Periodic or on-demand retake via Play Profile

---

## Verification Checklist

- [ ] New user sees 4 tension questions → priority reveal → Mind Space → /me
- [ ] Existing user does NOT see onboarding again
- [ ] Business tab → Setup stage shows BQ1/BQ2/BQ3 → Project Name → Stage → Products
- [ ] `user_stage_progress` has tension scores + priority_layer after onboarding
- [ ] `user_stage_progress` has persona + wealth_ladder after Business Setup
- [ ] Challenge system works for users who haven't done Business Setup (defaults to vibe_seeker)
- [ ] `npm run build` passes
- [ ] Progress dots show 4 in onboarding
- [ ] Back navigation works in Business Setup steps
