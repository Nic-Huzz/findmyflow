# Follow-Up Tasks - Flow Academy V1

**Date:** January 5, 2025
**Status:** CRM Tower + $100M Offer Builder built, refinements needed
**Priority:** Complete these before V1 launch

---

## Summary of What's Built

### $100M Offer Builder ✅ COMPLETE
Location: `/src/flows/OfferBuilder100M/`
- All 8 steps implemented
- Welcome, Steps 1A-8, Success screens
- Needs: Theme alignment check, route integration

### CRM Tower ✅ COMPLETE
Location: `/src/pages/crm/`
- Dashboard, Marketing, Sales, Analytics
- Services layer in `/src/lib/crm/`
- Database tables created

### Hormozi Features ⚠️ PARTIAL
- PTUF Calculator ✅ (Price To Unit Formula - keep this)
- LTV Calculator ✅
- CAC Tracker ✅
- Sales Scripts ⚠️ (general frameworks, not 15 specific scripts)
- Smart Alerts ✅

---

## Follow-Up Tasks

### Task 1: Lead Scoring (Pain/Trust/Urgency/Fit)

**Priority:** HIGH
**Effort:** 1-2 days

**What:** Add PTUF lead scoring to deals (separate from the pricing calculator)

**Database Changes:**
```sql
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS
  pain_score INTEGER CHECK (pain_score BETWEEN 1 AND 10),
  pain_notes TEXT,
  trust_score INTEGER CHECK (trust_score BETWEEN 1 AND 10),
  trust_notes TEXT,
  urgency_score INTEGER CHECK (urgency_score BETWEEN 1 AND 10),
  urgency_notes TEXT,
  fit_score INTEGER CHECK (fit_score BETWEEN 1 AND 10),
  fit_notes TEXT;

-- Add computed columns
ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS
  lead_total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(pain_score, 0) + COALESCE(trust_score, 0) +
    COALESCE(urgency_score, 0) + COALESCE(fit_score, 0)
  ) STORED;

ALTER TABLE sales_deals ADD COLUMN IF NOT EXISTS
  lead_temperature VARCHAR(10) GENERATED ALWAYS AS (
    CASE
      WHEN (COALESCE(pain_score,0) + COALESCE(trust_score,0) +
            COALESCE(urgency_score,0) + COALESCE(fit_score,0)) >= 32 THEN 'hot'
      WHEN (COALESCE(pain_score,0) + COALESCE(trust_score,0) +
            COALESCE(urgency_score,0) + COALESCE(fit_score,0)) >= 24 THEN 'warm'
      ELSE 'cold'
    END
  ) STORED;
```

**UI Changes:**

1. **LeadScoreSliders.jsx** component:
```jsx
// In deal modal, add 4 sliders:
- Pain (1-10): "How bad is their problem?"
- Trust (1-10): "Do they believe you can help?"
- Urgency (1-10): "How fast do they need it?"
- Fit (1-10): "Are they your ideal customer?"
// Each with optional notes field
```

2. **LeadScoreBadge.jsx** component:
```jsx
// Color-coded badge for deal cards:
- HOT (32-40): Red/orange badge 🔥
- WARM (24-31): Yellow badge 🌤️
- COLD (0-23): Blue badge ❄️
```

3. **Update CRMSales.jsx:**
- Add LeadScoreSliders to deal modal
- Add LeadScoreBadge to deal cards
- Add "Sort by Score" option

**Files to create:**
```
src/components/crm/
├── LeadScoreSliders.jsx
├── LeadScoreSliders.css
├── LeadScoreBadge.jsx
└── LeadScoreBadge.css
```

---

### Task 2: 15 Hormozi Scripts + Database

**Priority:** HIGH
**Effort:** 1-2 days

**What:** Create database table with the specific 15 Hormozi objection-handling scripts from the spec, add usage tracking.

**Database Tables:**
```sql
-- Scripts table
CREATE TABLE IF NOT EXISTS sales_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  script_name TEXT NOT NULL,
  objection TEXT NOT NULL,
  script_text TEXT NOT NULL,
  when_to_use TEXT,
  follow_up_if_a TEXT,
  follow_up_if_b TEXT,
  success_rate_benchmark DECIMAL(5,2),
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS script_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  deal_id UUID REFERENCES sales_deals(id),
  script_id UUID REFERENCES sales_scripts(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  objection_heard TEXT,
  outcome VARCHAR(20), -- 'worked', 'didnt_work', 'in_progress'
  deal_closed BOOLEAN,
  notes TEXT
);

-- RLS
ALTER TABLE sales_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scripts are readable by all authenticated users" ON sales_scripts
  FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE script_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own script usage" ON script_usage_log
  FOR ALL USING (auth.uid() = user_id);
```

**Seed the 15 Scripts:**
(Full script text is in `/view/crm-v1-spec-v2.md` lines 86-428)

| # | Category | Objection |
|---|----------|-----------|
| 1 | TIME | "I need to think about it" |
| 2 | TIME | "I need to talk to my spouse" |
| 3 | PRICE | "It's too expensive" |
| 4 | PRICE | "I can't afford it" |
| 5 | PRICE | "I need to save up first" |
| 6 | AUTHORITY | "I need to do more research" |
| 7 | AUTHORITY | "I've tried this before" |
| 8 | SELF_DOUBT | "I don't think I can do this" |
| 9 | SELF_DOUBT | "What if it doesn't work for me?" |
| 10 | TIMING | "This isn't the right time" |
| 11 | TIMING | "I'm too busy right now" |
| 12 | COMPARISON | "I found something cheaper" |
| 13 | COMMITMENT | "What if I want to cancel?" |
| 14 | COMMITMENT | "I need to see results first" |
| 15 | FINAL | "Let me sleep on it" |

---

### Task 3: Scripts Modal on Deal Cards

**Priority:** HIGH
**Effort:** 1 day

**What:** Add a "Scripts" button to deal cards that opens a modal with categorized scripts.

**UI Flow:**
```
Deal Card → Click "💬 Scripts" button
    ↓
Scripts Modal opens
    ↓
Select category (Time, Price, Authority, etc.)
    ↓
View script with:
  - When to use
  - The script text
  - Follow-up options (If A / If B)
  - Success rate benchmark
    ↓
Click "Mark as Used" → Log to script_usage_log
    ↓
Track outcome later (worked/didn't work/in progress)
```

**Files to create:**
```
src/components/crm/
├── ScriptsModal.jsx        # Main modal with category selection
├── ScriptsModal.css
├── ScriptDisplay.jsx       # Single script view
└── ScriptDisplay.css
```

**Update CRMSales.jsx:**
- Add "Scripts" button to deal cards
- Wire up modal

**Service function:**
```javascript
// In src/lib/crm/scriptsService.js
export async function fetchScripts()
export async function logScriptUsage(userId, dealId, scriptId, objectionHeard)
export async function updateScriptOutcome(usageId, outcome, dealClosed)
export async function getScriptEffectiveness(userId) // For analytics
```

---

### Task 4: Update CRM Theme to Match FindMyFlow

**Priority:** MEDIUM
**Effort:** 0.5 day

**What:** The CRM currently uses a dark theme. FindMyFlow uses a light theme with purple/gold accents. Align them.

**FindMyFlow Theme (from index.css):**
```css
:root {
  --purple: #5e17eb;
  --gold: #ffdd27;
  --white: #ffffff;
  --warm-gray: #f8f9fa;
  --soft-gray: #e9ecef;
  --text-gray: #495057;
  --border-gray: #dee2e6;
}
```

**CRM Current Theme (dark):**
```css
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
```

**Action:** Update all CRM CSS files to use FindMyFlow's light theme:
- `/src/pages/crm/CRMDashboard.css`
- `/src/pages/crm/CRMMarketing.css`
- `/src/pages/crm/CRMSales.css`
- `/src/pages/crm/CRMAnalytics.css`
- `/src/pages/crm/PTUFCalculator.css`
- `/src/pages/crm/LTVCalculator.css`
- `/src/pages/crm/CACTracker.css`
- `/src/pages/crm/SalesScripts.css`
- `/src/pages/crm/SmartAlerts.css`

**Or:** If dark theme is intentional (CRM = "work mode"), keep it but ask user to confirm.

---

### Task 5: Test & Integrate $100M Offer Builder v2

**Priority:** HIGH
**Effort:** 0.5 day

**What:** The Offer Builder v2 exists at `/src/flows/OfferBuilder100M/` but needs:
1. Route added to AppRouter.jsx
2. Theme verification (should match FindMyFlow)
3. End-to-end testing

**Check:**
- Is there a route for it already?
- Does it use FindMyFlow's light theme?
- Does data save to `offer_creations` table?
- Does it integrate with FindMyFlow/validation data?

**Route to add (if missing):**
```jsx
// In AppRouter.jsx
import OfferBuilder100M from './flows/OfferBuilder100M'

<Route path="/offer-builder-v2" element={<AuthGate><OfferBuilder100M /></AuthGate>} />
```

**Decision needed:**
- Keep both `/offer-builder` (old) and `/offer-builder-v2` (new)?
- Or replace old with new?

---

### Task 6: Integration Testing

**Priority:** HIGH
**Effort:** 0.5 day

**What:** Test full user journey across modules.

**Test Flows:**

| # | Flow | Expected |
|---|------|----------|
| 1 | FindMyFlow → Offer Builder | Persona data pre-fills suggestions |
| 2 | Validation → Offer Builder | Survey responses enhance dream outcome |
| 3 | Offer Builder → CRM | Products from Money Model appear in deals dropdown |
| 4 | CRM tasks → Gamification | Completing tasks awards points |
| 5 | Deal stages → Gamification | Moving deals awards points |
| 6 | Lead Scoring → Pipeline | Hot/Warm/Cold badges display correctly |
| 7 | Scripts → Usage Log | "Mark as Used" saves to database |

---

## File Structure Summary

**New files to create:**
```
src/components/crm/
├── LeadScoreSliders.jsx
├── LeadScoreSliders.css
├── LeadScoreBadge.jsx
├── LeadScoreBadge.css
├── ScriptsModal.jsx
├── ScriptsModal.css
├── ScriptDisplay.jsx
└── ScriptDisplay.css

src/lib/crm/
└── scriptsService.js

supabase/migrations/
├── 20250105_lead_scoring.sql
└── 20250105_sales_scripts.sql
```

**Files to update:**
```
src/pages/crm/CRMSales.jsx        # Add lead scoring + scripts button
src/pages/crm/*.css               # Theme alignment (if needed)
src/AppRouter.jsx                 # Add offer-builder-v2 route
```

---

## Priority Order

1. **Lead Scoring** - Core CRM differentiator
2. **15 Hormozi Scripts** - Promised feature
3. **Scripts Modal** - UI for scripts
4. **Theme Alignment** - Visual consistency
5. **Offer Builder Integration** - Route + testing
6. **Integration Testing** - Quality assurance

---

## Decisions Made

| Question | Decision |
|----------|----------|
| **Theme** | Switch to **light** FindMyFlow theme |
| **Offer Builder route** | Keep **both** routes until tested (`/offer-builder` + `/offer-builder-v2`) |
| **Existing deals** | Prompt to **score all** existing deals |

---

## Implementation Notes from Decisions

### Light Theme Implementation
Update all CRM CSS files to use:
```css
/* Replace dark backgrounds with: */
background: var(--warm-gray); /* #f8f9fa */
/* Or white cards on gray background */

/* Use purple for accents */
color: var(--purple); /* #5e17eb */

/* Use gold for highlights/CTAs */
background: var(--gold); /* #ffdd27 */
```

### Offer Builder Routes
```jsx
// In AppRouter.jsx - keep both:
<Route path="/offer-builder" element={<AuthGate><OfferBuilderFlow /></AuthGate>} />
<Route path="/offer-builder-v2" element={<AuthGate><OfferBuilder100M /></AuthGate>} />
```

### Score All Existing Deals
When user first visits CRM Sales after Lead Scoring is added:
```jsx
// Check for unscored deals
const unscoredDeals = deals.filter(d => d.pain_score === null)

if (unscoredDeals.length > 0) {
  // Show modal: "You have X deals without lead scores. Score them now?"
  // Option to score one-by-one or skip
}
```

---

*End of follow-up tasks*
