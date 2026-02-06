# Sales Playbook — Implementation Reference

Built Feb 2026. Based on Alex Hormozi's frameworks from "$100M Offers" and "My Best Sales Advice From Selling $100's of Millions" (Ep 757).

---

## Overview

Seven sales frameworks integrated across deal cards, modals, dashboard nudges, and a library reference page. Design principle: frameworks surface **where the work happens** — not hidden in a separate study page.

### Framework Placement

| Framework | Primary Surface | Secondary |
|-----------|----------------|-----------|
| Three Distortions | Smart button drawer on deal cards (pitched/follow_up) + replaces flat loss reasons in DealOutcomeModal | Library accordion |
| CLOSER | Pre-call prep drawer on deal cards (booked/showed) + personalized saved script | Library reference |
| Nine Things | 2 nudges in Phase 1: Kill Zombies, Ask Again | Library page (all 9) |
| Conviction & Tonality | Mindset section in pre-call prep drawer | Library cards |
| Three Things | Banner in pre-call prep drawer | Library cards |
| Sell the Vacation | CLOSER step "S" detail | — |
| Case Study | Track tab motivation card | — |

---

## Smart Button on Deal Cards

One button in the deal detail modal that changes label based on deal stage:

- **booked / showed** → "Prep" → Opens pre-call prep drawer (CLOSER + Three Things + Conviction)
- **pitched / follow_up** → "Objection?" → Opens Three Distortions drawer with log option

Implemented in `Sales.jsx` lines 623-633.

---

## Files Created (8)

### 1. `src/data/salesPlaybook.js` (644 lines)

All 7 frameworks as structured JavaScript data. 10 named exports:

| Export | Type | Description |
|--------|------|-------------|
| `THREE_DISTORTIONS` | Object | 3 layers → 8 categories → 21 strategies, each with shortScript, fullScript, keywords |
| `CLOSER_FRAMEWORK` | Object | 6 steps (C-L-O-S-E-R) with guidance, templateText, crossLinks |
| `NINE_THINGS` | Array | 9 habits, 3 marked `isPhase1: true` with nudge triggers |
| `CONVICTION_TONALITY` | Array | 4 mindset cards with icon, title, description |
| `THREE_THINGS_ON_CALL` | Object | Questions, Restatements, Anecdotal Stories with colors |
| `SELL_THE_VACATION` | Object | Title, description, guidance |
| `CASE_STUDY_DATA` | Object | Before/after metrics (show rate, close rate, cash, units) |
| `KEY_PRINCIPLES` | Array | 10 core sales principles |
| `LOSS_REASON_MIGRATION_MAP` | Object | Maps old flat reasons → new `layer/category` format |
| `DISTORTION_REASON_LABELS` | Object | Human-readable labels for all 8 distortion categories |

**Three Distortions structure:**

```
Layer 1: CIRCUMSTANCES (id: 'circumstances')
├── Time Macro (time_macro) → When-Then Fallacy, Start When Busy
├── Time Micro (time_micro) → Phone Time Story
├── Price (price) → "A Lot Is GOOD", Value Comparison, Money or Time?
└── Fit (fit) → New Identity, Change the Change, Unicorn Close

Layer 2: OTHERS (id: 'others')
└── Authority (authority) → Support Not Permission

Layer 3: SELF (id: 'self')
├── Past Frame (avoidance_past) → Not a Fast Decision, Struggled to Decide, Cost of Inaction, Don't Let It Burn Twice
├── Present Frame (avoidance_present) → Rocking Chair, 3 Decision Questions, Guarantees, Definition of Decision
└── Future Frame (avoidance_future) → Magnifying Pain, Consider the Options, Urgency/Direction

BONUS: "The Reason IS the Reason"
```

**Category ID format:** `layer/category` (e.g., `circumstances/price`, `self/avoidance_present`)

---

### 2. `src/lib/crm/objectionService.js`

CRUD + analytics for `objection_logs` table.

| Function | Params | Returns |
|----------|--------|---------|
| `logObjection(userId, data)` | data: `{ deal_id, layer, category, strategy_used, outcome, notes }` | `{ data, error }` |
| `fetchObjectionLogs(userId, options)` | options: `{ deal_id?, layer?, limit? }` | `{ data: [], error }` |
| `getObjectionStats(userId)` | — | `{ totalLogs, byLayer, byCategory, strategyEffectiveness, topObjections }` or `null` |
| `deleteObjectionLog(logId, userId)` | — | `{ error }` |

**`getObjectionStats` return shape:**
- `totalLogs`: number
- `byLayer`: `{ circumstances: n, others: n, self: n }`
- `byCategory`: `{ time_macro: n, price: n, ... }`
- `strategyEffectiveness`: sorted array of `{ strategy, total, overcameCount, successRate }`
- `topObjections`: top 5 `[category, count]` pairs

---

### 3. `src/lib/crm/closerScriptService.js`

Manages personalized CLOSER scripts with AI enhancement.

| Function | Description |
|----------|-------------|
| `fetchCloserScript(userId)` | Gets saved script from `user_closer_scripts` (uses `.maybeSingle()`) |
| `saveCloserScript(userId, steps)` | Upserts steps JSON to DB (onConflict: user_id) |
| `generateDefaultScript(userId)` | Creates template script pre-filled from `getContentContext()` data (persona, offer, guarantee) |
| `buildCloserStepPrompt(stepLetter, currentText, context)` | Builds AI prompt for per-step script enhancement |

**Script steps format:** `{ C: "...", L: "...", O: "...", S: "...", E: "...", R: "..." }`

---

### 4. `src/components/crm/PlaybookDrawer.jsx`

Smart slide-up drawer with two modes:

**PrepMode** (booked/showed deals):
- Three Things banner (colored badges)
- Conviction & Tonality cards (4 mindset principles)
- CLOSER checklist with user's personalized script
- Each step expandable with guidance + script + copy button

**ObjectionMode** (pitched/follow_up deals):
- Keyword search across all strategies
- Three Distortions tree (layer → category → strategy)
- Each strategy: shortScript visible, fullScript on expand, copy button, "Log" button
- Bonus section: "The Reason IS the Reason"
- Inline log form: outcome buttons (overcame/partially/failed/unknown) + notes

**Props:** `{ deal, userId, mode?, onClose, onObjectionLogged }`

---

### 5. `src/components/crm/PlaybookDrawer.css`

Dark theme drawer (#1a1a2e background). Slide-up animation. Mobile-first with `max-width: 600px`, `max-height: 85vh`. Purple-to-gold gradient on CLOSER letter badges.

---

### 6. `src/pages/crm/SalesPlaybook.jsx`

Library page at `/crm/sales-playbook`. Two tabs:

**Learn Tab** — 7 expandable accordion sections:
1. Three Things on a Call
2. Conviction & Tonality
3. CLOSER Framework (nested expand for each step)
4. Three Distortions (full tree with copy buttons)
5. Nine Things Best Salespeople Do
6. Sell the Vacation
7. 10 Key Principles

**Track Tab:**
- Case Study comparison card (before/after metrics)
- Objection stats from `getObjectionStats()`: summary cards, layer bar charts, top objections list

---

### 7. `src/pages/crm/SalesPlaybook.css`

Dark theme library page styles. All classes prefixed with `sp-`. Includes accordion, cards, bar charts, metrics grid, spinner, empty states.

---

### 8. `supabase/migrations/20260206150000_sales_playbook_tables.sql`

```sql
-- Table: objection_logs
-- Columns: id, user_id, deal_id (FK → sales_deals), layer, category,
--          strategy_used, outcome (check constraint), prospect_response, notes, created_at
-- Indexes: idx_objection_logs_user, idx_objection_logs_category
-- RLS: "Users see own logs"

-- Table: user_closer_scripts
-- Columns: id, user_id (unique), steps (jsonb), created_at, updated_at
-- RLS: "Users see own scripts"

-- Data migration: converts old flat loss reasons to Three Distortions format
-- Only affects deal_outcomes where outcome = 'lost'
-- price → circumstances/price
-- timing → circumstances/time_macro
-- competitor → circumstances/fit
-- no_decision → self/avoidance_present
-- fit → circumstances/fit
-- trust → self/avoidance_past
```

---

## Files Modified (8)

### 1. `src/pages/crm/Sales.jsx`

- Added `PlaybookDrawer` import from `../../components/crm`
- Added `playbookDeal` state
- Added `playbookDeal` to modal-active tracking (hides bottom toolbar)
- Added smart Playbook button in deal detail modal actions (lines 623-633)
- Added `<PlaybookDrawer>` render at bottom of component (lines 697-704)

### 2. `src/components/crm/DealOutcomeModal.jsx`

- Added imports: `THREE_DISTORTIONS`, `DISTORTION_REASON_LABELS`
- Replaced flat `LOSS_REASONS` array with Three Distortions-derived array:
  ```js
  const LOSS_REASONS = THREE_DISTORTIONS.layers.flatMap(layer =>
    layer.categories.map(cat => ({
      id: `${layer.id}/${cat.id}`,
      label: DISTORTION_REASON_LABELS[...].split(' — ')[0] || cat.name,
      description: cat.subtitle || layer.description,
      layer: layer.id,
    }))
  )
  ```
- Updated factor flags for backward compatibility (handles both `'price'` and `'circumstances/price'`)

### 3. `src/pages/crm/ObjectionPatterns.jsx`

- Added import: `DISTORTION_REASON_LABELS`
- Merged into existing `LOSS_REASON_LABELS` object (new format first, legacy fallbacks after)

### 4. `src/components/crm/DailyActions.jsx`

- Added import: `getStaleDeals` from dealService
- Added `salesNudges` state + fetch effect
- **Kill Zombies**: deals stale > 14 days → "Kill the zombie: [name]"
- **Ask Again**: follow_up deals with 2+ days since last contact → "Most sales happen after the 3rd-5th ask"
- Added Sales Coaching section rendering with navigate to `/crm/sales`

### 5. `src/components/crm/DailyActions.css`

- Added `.da-section.da-nudges` background (gold gradient) + border
- Added `.da-nudges .da-section-count` badge color (gold)
- Added `.da-nudge-zombie` border (red), `.da-nudge-ask_again` border (gold)
- Added `.da-nudges .da-section-action` color + hover

### 6. `src/pages/crm/Sales.css`

- Added `.playbook-btn` styles (gold accent, #E9A23B)

### 7. `src/AppRouter.jsx`

- Added lazy import: `const SalesPlaybook = lazyRetry(() => import('./pages/crm/SalesPlaybook'))`
- Added CSS import: `import './pages/crm/SalesPlaybook.css'`
- Added route: `/crm/sales-playbook` wrapped in `AuthGate` + `CRMLayout`

### 8. `src/pages/crm/Nurture.jsx`

- Added tower card: `{ id: 'playbook', icon: '📚', title: 'Sales Playbook', path: '/crm/sales-playbook' }`

### 9. Barrel Exports

- `src/lib/crm/index.js`: Added objectionService (4 functions) + closerScriptService (4 functions)
- `src/components/crm/index.js`: Added `PlaybookDrawer` default export

---

## Database Schema

### `objection_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| user_id | uuid | FK → auth.users, NOT NULL |
| deal_id | uuid | FK → sales_deals, ON DELETE SET NULL |
| layer | text | NOT NULL — 'circumstances', 'others', 'self' |
| category | text | NOT NULL — 'time_macro', 'price', 'authority', etc. |
| strategy_used | text | Nullable — strategy ID used |
| outcome | text | CHECK: 'overcame', 'partially', 'failed', 'unknown' |
| prospect_response | text | Nullable |
| notes | text | Nullable |
| created_at | timestamptz | Default now() |

### `user_closer_scripts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| user_id | uuid | FK → auth.users, UNIQUE |
| steps | jsonb | Default '{}' — `{ C: "...", L: "...", ... }` |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

---

## Loss Reason Format Migration

Old flat format → New Three Distortions format:

| Old Value | New Value |
|-----------|-----------|
| `price` | `circumstances/price` |
| `timing` | `circumstances/time_macro` |
| `competitor` | `circumstances/fit` |
| `no_decision` | `self/avoidance_present` |
| `fit` | `circumstances/fit` |
| `trust` | `self/avoidance_past` |

Both `DealOutcomeModal` and `ObjectionPatterns` handle both formats for backward compatibility.

---

## Phase 2 (Not Yet Built)

- **BAMFAM nudge**: Prompt after logging call outcome ("Did you book the next meeting?")
- **Remaining 6 nudges**: Pull-Up Appointments, Kill Zombies Upfront, Looping, Track Everything, Practice Daily, Show Up Early
- **CLOSER AI enhancement**: Per-step "Enhance with AI" button using `buildCloserStepPrompt()`
- **Full script generation**: "Generate full script" using Claude API
- **Track tab trends**: Charts over time, strategy effectiveness trends
- **Script sharing/export**
