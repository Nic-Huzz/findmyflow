# Pay The Bills — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Pay The Bills" bridge job section to the Paths tab, with a 3-way fork in the current job flow and a "Find a Bridge" flow for users who need to find interim work.

**Architecture:** Three changes: (1) modify CurrentJobFlow's fork from 2-way to 3-way with different step sequences per choice, (2) add PayTheBillsSection component to LevelTab below flow paths, (3) create FindBridgeFlow for discovering bridge jobs from Fun-rated dome experiences. Data changes are 3 new columns on `quests` table.

**Tech Stack:** React 18, Supabase (PostgreSQL), existing experiencePricing.js data, existing flow CSS patterns.

**Spec:** `docs/specs/2026-09-26-pay-the-bills-spec.md`

## Global Constraints

- Light theme throughout (`#f5f5f0` background, white cards). Never dark backgrounds.
- CSS scoped to parent class (`.ptb-section .ptb-card { }` not `.ptb-card { }`)
- Fixed bottom buttons: `left: 50%; transform: translateX(-50%); max-width: 480px; padding-bottom: env(safe-area-inset-bottom)`
- Writing: no em dashes, 12-year-old readable, no jargon
- Import dimensions from `src/data/domeDimensions.js`, never redefine inline
- Use `src/styles/flow-base.css` patterns before inventing new ones

---

### Task 1: Database Migration — Add Bridge Job Columns

**Files:**
- Create: `supabase/migrations/20260926100001_pay_the_bills_columns.sql`

**Interfaces:**
- Consumes: nothing
- Produces: `quests.is_bridge_job` (boolean), `quests.job_relationship` (text), `quests.bridge_status` (text) — used by all subsequent tasks

- [ ] **Step 1: Write the migration file**

```sql
-- Pay The Bills: bridge job tracking columns on quests
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_bridge_job boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS job_relationship text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS bridge_status text;

COMMENT ON COLUMN quests.is_bridge_job IS 'True if this quest is a bridge job (paying bills while flow grows)';
COMMENT ON COLUMN quests.job_relationship IS 'grow_this | pay_bills | keen_to_quit | bridge_found';
COMMENT ON COLUMN quests.bridge_status IS 'active | searching | completed | null';
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase db push` or apply via Supabase dashboard.

- [ ] **Step 3: Verify columns exist**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quests'
AND column_name IN ('is_bridge_job', 'job_relationship', 'bridge_status');
```

Expected: 3 rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260926100001_pay_the_bills_columns.sql
git commit -m "feat: add bridge job columns to quests table"
```

---

### Task 2: Bridge Job Utility Functions

**Files:**
- Create: `src/lib/bridgeJobUtils.js`

**Interfaces:**
- Consumes: `EXPERIENCE_PRICING` from `src/data/experiencePricing.js`, dome ratings from Supabase `experience_dome_ratings`
- Produces:
  - `parseEmployedRate(rateStr: string) → { min: number, max: number } | null` — parses "$25-35/hr" into numbers
  - `estimateMonthly(rateStr: string, hoursPerMonth?: number) → { low: number, high: number } | null` — monthly estimate
  - `getViableBridgeExperiences(funExperiences: Array<{nodeId, label}>) → Array<{label, employed, perSession, monthlyEstimate, confidencePct, bucket}>` — filters and ranks Fun experiences by bridge viability
  - `isEmployedViable(employedStr: string) → boolean` — returns false for N/A, Rare, Gig-based
  - `MONEY_TIER_5_THRESHOLD` constant = 5 (maps to $1K+ in domeDimensions)

- [ ] **Step 1: Create the utility file**

```javascript
/**
 * bridgeJobUtils.js — Earning estimate parsing and bridge job filtering
 *
 * Used by FindBridgeFlow and PayTheBillsSection to surface
 * financially viable bridge job options from dome experiences.
 */
import { EXPERIENCE_PRICING } from '../data/experiencePricing'

// Money dimension tier 5 = $1K+/month (from domeDimensions.js tiers: [0, 100, 250, 500, 1000, 2500, ...])
// getDimTiers() maps tiers[i] to value i+1, so $1,000 = value 5
export const MONEY_TIER_5_THRESHOLD = 5

/**
 * Check if an employed rate string is viable for a bridge job.
 * Filters out N/A, Rare, Gig-based — these aren't employable paths.
 */
export function isEmployedViable(employedStr) {
  if (!employedStr) return false
  const lower = employedStr.toLowerCase()
  return !lower.includes('n/a') && !lower.includes('rare') && !lower.includes('gig-based')
}

/**
 * Parse "$25-35/hr" or "$25-35/hr (description)" → { min, max }
 * Returns null if unparseable.
 */
export function parseEmployedRate(rateStr) {
  if (!rateStr || !isEmployedViable(rateStr)) return null
  // Extract the first dollar range pattern: $XX-YY or $XX
  const match = rateStr.match(/\$(\d+)(?:-(\d+))?/)
  if (!match) return null
  const min = parseInt(match[1], 10)
  const max = match[2] ? parseInt(match[2], 10) : min
  return { min, max }
}

/**
 * Estimate monthly income from an employed rate string.
 * Default 160 hrs/month (40hr weeks).
 */
export function estimateMonthly(rateStr, hoursPerMonth = 160) {
  const parsed = parseEmployedRate(rateStr)
  if (!parsed) return null
  return {
    low: parsed.min * hoursPerMonth,
    high: parsed.max * hoursPerMonth,
  }
}

/**
 * Format a monthly estimate as a readable string.
 * e.g. { low: 4000, high: 5600 } → "~$4,000-5,600/month"
 */
export function formatMonthly(estimate) {
  if (!estimate) return ''
  const fmt = (n) => n.toLocaleString('en-US')
  if (estimate.low === estimate.high) return `~$${fmt(estimate.low)}/month`
  return `~$${fmt(estimate.low)}-${fmt(estimate.high)}/month`
}

/**
 * Given an array of Fun-rated dome experiences (with labels),
 * cross-reference with EXPERIENCE_PRICING and return viable bridge options.
 *
 * @param {Array<{nodeId: string, label: string}>} funExperiences
 * @returns {Array<{label, employed, perSession, monthlyEstimate, confidencePct, bucket, parsedRate}>}
 *   Sorted by max hourly rate descending (highest earning first).
 */
export function getViableBridgeExperiences(funExperiences) {
  const results = []

  for (const exp of funExperiences) {
    const pricing = EXPERIENCE_PRICING[exp.label]
    if (!pricing) continue
    if (pricing.confidencePct < 50) continue
    if (!isEmployedViable(pricing.employed)) continue

    const parsedRate = parseEmployedRate(pricing.employed)
    if (!parsedRate) continue

    results.push({
      label: exp.label,
      nodeId: exp.nodeId,
      employed: pricing.employed,
      perSession: pricing.per_session,
      monthlyEstimate: estimateMonthly(pricing.employed),
      confidencePct: pricing.confidencePct,
      bucket: pricing.bucket,
      parsedRate,
    })
  }

  // Sort by max hourly rate descending
  results.sort((a, b) => b.parsedRate.max - a.parsedRate.max)
  return results
}

/**
 * Get ALL viable bridge experiences (not just user-rated ones).
 * Used as fallback when user has zero Fun-rated experiences with viable rates.
 *
 * @returns {Array} Same shape as getViableBridgeExperiences output.
 */
export function getAllViableBridgeExperiences() {
  const allExperiences = Object.entries(EXPERIENCE_PRICING).map(([label]) => ({
    label,
    nodeId: null,
  }))
  return getViableBridgeExperiences(allExperiences)
}
```

- [ ] **Step 2: Verify it works with a quick smoke test**

Open browser console on dev server and run:
```javascript
import('/src/lib/bridgeJobUtils.js').then(m => {
  console.log('Parse $25-35/hr:', m.parseEmployedRate('$25-35/hr'))
  console.log('Monthly:', m.estimateMonthly('$25-35/hr'))
  console.log('Format:', m.formatMonthly(m.estimateMonthly('$25-35/hr')))
  console.log('Viable N/A:', m.isEmployedViable('N/A'))
  console.log('Viable $25:', m.isEmployedViable('$25-35/hr'))
  console.log('All viable count:', m.getAllViableBridgeExperiences().length)
})
```

Expected: Parse returns `{min:25, max:35}`, monthly returns `{low:4000, high:5600}`, format returns `"~$4,000-5,600/month"`, N/A returns false, $25 returns true, all viable count > 50.

- [ ] **Step 3: Commit**

```bash
git add src/lib/bridgeJobUtils.js
git commit -m "feat: add bridge job utility functions for earning estimates"
```

---

### Task 3: CurrentJobFlow — 3-Way Fork

**Files:**
- Modify: `src/flows/CurrentJobFlow.jsx` (lines 266-296 fork step, lines 108-168 save handlers)

**Interfaces:**
- Consumes: `MONEY_TIER_5_THRESHOLD` from `src/lib/bridgeJobUtils.js`
- Produces: quests saved with `job_relationship` and `is_bridge_job` columns populated

- [ ] **Step 1: Add the import**

At the top of `CurrentJobFlow.jsx`, after existing imports (line 23), add:

```javascript
import { MONEY_TIER_5_THRESHOLD } from '../lib/bridgeJobUtils'
```

- [ ] **Step 2: Add "pay bills" path state**

After `const [dimStep, setDimStep] = useState('current')` (line 77), the existing state is sufficient. No new state needed — the fork choice is tracked via `job_relationship` on the quest.

- [ ] **Step 3: Update handleSaveNameFuel to include job_relationship**

In `handleSaveNameFuel` (line 108), update the insert to include `job_relationship`. This will be set properly after the fork, but we need to save the quest first. No change needed here — `job_relationship` is set during the fork save step.

- [ ] **Step 4: Add handleSavePayBillsPath handler**

After `handleSaveNoPath` (line 168), add a new handler for the "pay bills" fork:

```javascript
// Save as bridge job (PAY BILLS path) — current dimensions only, no dream
const handleSavePayBillsPath = async () => {
  if (!savedQuestId || saving) return
  setSaving(true)
  try {
    await supabase.from('quests').update({
      is_bridge_job: true,
      job_relationship: 'pay_bills',
      bridge_status: 'active',
      current_dimensions: currentDimensions,
    }).eq('id', savedQuestId)
    hapticSuccess()
    navigate('/choose-quests')
  } catch (err) {
    console.error('Error saving pay bills path:', err)
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 5: Update handleSaveYesPath to set job_relationship**

In `handleSaveYesPath` (line 132), add `job_relationship: 'grow_this'` to the update:

```javascript
const handleSaveYesPath = async () => {
  if (!savedQuestId || saving) return
  setSaving(true)
  try {
    await supabase.from('quests').update({
      current_dimensions: currentDimensions,
      dream_dimensions: dreamDimensions,
      format_picks: [...selectedIds],
      job_relationship: 'grow_this',
    }).eq('id', savedQuestId)
    hapticSuccess()
    navigate('/7-day-challenge')
  } catch (err) {
    console.error('Error saving yes path:', err)
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 6: Update handleSaveNoPath to set job_relationship**

In `handleSaveNoPath` (line 151), add `job_relationship: 'keen_to_quit'` to the update:

```javascript
const handleSaveNoPath = async (fuelsOverride) => {
  setSaving(true)
  const fuels = fuelsOverride || idealFuel
  try {
    if (savedQuestId) {
      await supabase.from('quests').update({
        path_fuels: CHANNEL_IDS.filter(id => fuels[id]),
        status: 'reference',
        job_relationship: 'keen_to_quit',
      }).eq('id', savedQuestId)
    }
    hapticSuccess()
    setStep('no_summary')
  } catch (err) {
    console.error('Error saving ideal:', err)
  } finally {
    setSaving(false)
  }
}
```

- [ ] **Step 7: Replace the 2-way fork UI with 3-way**

Replace the fork step JSX (lines 266-296) with:

```jsx
{/* ═══ STEP 3: Fork ═══ */}
{step === 'fork' && (
  <div className="cjf-done">
    <div className="cjf-done-icon">🧭</div>
    <h2>What's your relationship with {jobTitle}?</h2>
    <p>This helps us figure out what role it plays in your life.</p>
    <div className="cjf-direction-options">
      <button
        className="cjf-direction-btn"
        onClick={() => { hapticLight(); setStep('experiences') }}
      >
        <span className="cjf-direction-emoji">🔥</span>
        <span className="cjf-direction-text">Yes, grow this</span>
        <span className="cjf-direction-sub">This is my flow. I want to build my life around it.</span>
      </button>
      <button
        className="cjf-direction-btn"
        onClick={() => {
          hapticLight()
          // Go to current dimensions only (no experiences, no dream)
          const defaults = {}
          DOME_DIMENSIONS.forEach(d => { defaults[d.id] = 1 })
          setCurrentDimensions(prev => Object.keys(prev).length ? prev : defaults)
          setStep('pay_bills_dimensions')
        }}
      >
        <span className="cjf-direction-emoji">💰</span>
        <span className="cjf-direction-text">Happy for it to pay the bills</span>
        <span className="cjf-direction-sub">It's not my calling, but it works for now.</span>
      </button>
      <button
        className="cjf-direction-btn"
        disabled={saving}
        onClick={() => {
          if (saving) return
          hapticLight()
          handleSaveNoPath({ choice: true, connection: true, mastery: true, meaning: true })
        }}
      >
        <span className="cjf-direction-emoji">🌱</span>
        <span className="cjf-direction-text">No, keen to quit</span>
        <span className="cjf-direction-sub">I want to move on from this.</span>
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 8: Add the pay_bills_dimensions step**

After the existing `{step === 'dimensions' && (...)}` block (before the NO PATH summary), add:

```jsx
{/* ═══ PAY BILLS PATH: Current Dimensions Only ═══ */}
{step === 'pay_bills_dimensions' && (
  <>
    <button className="cjf-back" onClick={() => setStep('fork')}>&larr; Back</button>
    <div className="cjf-header">
      <div className="cjf-step-label">Where you are now</div>
      <h2>Where is {jobTitle} right now?</h2>
      <p>Just a quick snapshot so we know where things stand.</p>
    </div>

    {DOME_DIMENSIONS.map(dim => {
      const tiers = getDimTiers(dim)
      const selectedLevel = currentDimensions[dim.id]
      const selectedDesc = selectedLevel && dim.type === 'qualitative'
        ? dim.levels.find(l => l.level === selectedLevel)?.description
        : null

      return (
        <div key={dim.id} className="cjf-dim-section">
          <div className="cjf-dim-label">
            {dim.icon} {CURRENT_QUESTIONS[dim.id]}
          </div>
          <div className="cjf-dim-options">
            {tiers.map(t => (
              <button
                key={t.value}
                className={`cjf-dim-pill ${currentDimensions[dim.id] === t.value ? 'selected' : ''}`}
                onClick={() => {
                  hapticLight()
                  setCurrentDimensions(prev => ({ ...prev, [dim.id]: t.value }))
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {selectedDesc && <div className="cjf-dim-desc">{selectedDesc}</div>}
        </div>
      )
    })}

    <div className="cjf-fixed">
      <button
        onClick={handleSavePayBillsPath}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Done'}
      </button>
    </div>
  </>
)}
```

- [ ] **Step 9: Test all three fork paths manually**

1. Navigate to `/add-current-job`
2. Enter a job title, select fuels, proceed to fork
3. Verify three buttons appear with correct text
4. Test "Yes, grow this" → should go to experiences → dimensions → dream → save
5. Test "Happy for it to pay the bills" → should go to dimensions only → save with `is_bridge_job: true`, `job_relationship: 'pay_bills'` → navigate to `/choose-quests`
6. Test "No, keen to quit" → should save with `status: 'reference'`, `job_relationship: 'keen_to_quit'` → show summary

Check Supabase: verify `is_bridge_job`, `job_relationship`, and `bridge_status` columns are populated correctly for each path.

- [ ] **Step 10: Commit**

```bash
git add src/flows/CurrentJobFlow.jsx
git commit -m "feat: 3-way fork in current job flow (grow/pay-bills/quit)"
```

---

### Task 4: PayTheBillsSection Component

**Files:**
- Create: `src/components/PayTheBillsSection.jsx`
- Create: `src/components/PayTheBillsSection.css`

**Interfaces:**
- Consumes: `quests` array (from LevelTab parent), `userId` (string), `onUpdate` callback
- Produces: renders the Pay The Bills section with correct state (fulfilled / needs-filling / graduated), calls `onUpdate` when bridge job changes

- [ ] **Step 1: Create the CSS file**

```css
/* PayTheBillsSection.css */

.ptb-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.ptb-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ptb-header-icon {
  font-size: 16px;
}

.ptb-header-title {
  font-size: 14px;
  font-weight: 700;
  color: rgba(0,0,0,0.5);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Bridge card (fulfilled state) */
.ptb-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(0,0,0,0.06);
  background: white;
  cursor: pointer;
  transition: all 0.15s;
}

.ptb-card:active {
  transform: scale(0.98);
}

.ptb-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ptb-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.ptb-card-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.ptb-card-status.active {
  background: rgba(16,185,129,0.1);
  color: #10b981;
}

.ptb-card-status.searching {
  background: rgba(233,162,59,0.1);
  color: #E9A23B;
}

/* Searching state — dashed border */
.ptb-card.searching {
  border-style: dashed;
  border-color: rgba(233,162,59,0.3);
}

.ptb-card-searching-label {
  font-size: 11px;
  color: rgba(0,0,0,0.35);
  margin-top: 2px;
}

/* Expanded details */
.ptb-card-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.ptb-card-earning {
  font-size: 13px;
  color: rgba(0,0,0,0.5);
  margin-bottom: 12px;
}

.ptb-graduate-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(94,23,235,0.2);
  background: rgba(94,23,235,0.04);
  color: #5e17eb;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 8px;
}

.ptb-graduate-btn:active {
  transform: scale(0.98);
  background: rgba(94,23,235,0.08);
}

.ptb-got-job-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(16,185,129,0.2);
  background: rgba(16,185,129,0.04);
  color: #10b981;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 8px;
}

.ptb-remove-btn {
  width: 100%;
  padding: 10px;
  border: none;
  background: none;
  color: rgba(0,0,0,0.3);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}

/* Empty state (needs filling) */
.ptb-empty {
  padding: 20px 16px;
  border-radius: 14px;
  border: 1.5px dashed rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.01);
  text-align: center;
}

.ptb-empty-text {
  font-size: 14px;
  color: rgba(0,0,0,0.5);
  margin-bottom: 14px;
  line-height: 1.5;
}

.ptb-empty-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ptb-empty-btn {
  padding: 12px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(0,0,0,0.08);
  background: white;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ptb-empty-btn:active {
  transform: scale(0.98);
}

.ptb-empty-btn-emoji {
  font-size: 18px;
}

/* Graduated celebration */
.ptb-graduated {
  padding: 20px 16px;
  border-radius: 14px;
  background: rgba(94,23,235,0.04);
  border: 1.5px solid rgba(94,23,235,0.1);
  text-align: center;
}

.ptb-graduated-text {
  font-size: 15px;
  font-weight: 600;
  color: #5e17eb;
}

.ptb-graduated-dismiss {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 13px;
  color: rgba(0,0,0,0.3);
  font-family: inherit;
  cursor: pointer;
}
```

- [ ] **Step 2: Create the component**

```jsx
/**
 * PayTheBillsSection.jsx
 *
 * Renders the "Pay The Bills" bridge job section on the Paths tab.
 * States: fulfilled (has bridge), needs-filling (prompt), graduated (flow pays).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { MONEY_TIER_5_THRESHOLD } from '../lib/bridgeJobUtils'
import confetti from 'canvas-confetti'
import './PayTheBillsSection.css'

export default function PayTheBillsSection({ quests, userId, onUpdate }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [graduating, setGraduating] = useState(false)
  const [graduated, setGraduated] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Find relevant quests
  const bridgeQuest = quests.find(q => q.is_bridge_job && q.status === 'active' && q.bridge_status !== 'completed')
  const currentJobQuest = quests.find(q => q.is_current_job && q.status !== 'reference')
  const referenceQuest = quests.find(q => q.is_current_job && q.status === 'reference')
  const hasCompletedCurrentJobFlow = quests.some(q => q.is_current_job)

  // Determine section state
  // State 3: Auto-fulfilled — "grow this" + money >= $1K
  if (currentJobQuest?.job_relationship === 'grow_this') {
    const moneyTier = currentJobQuest.current_dimensions?.money
    if (moneyTier >= MONEY_TIER_5_THRESHOLD) return null // Section hidden
  }

  // Don't show if current job flow not completed
  if (!hasCompletedCurrentJobFlow) return null

  // State 4: Graduated
  if (graduated) {
    return (
      <div className="ptb-section">
        <div className="ptb-header">
          <span className="ptb-header-icon">💰</span>
          <span className="ptb-header-title">Pay The Bills</span>
        </div>
        <div className="ptb-graduated">
          <div className="ptb-graduated-text">Your flow is paying the bills now</div>
          <button className="ptb-graduated-dismiss" onClick={() => setGraduated('dismissed')}>
            Nice, got it
          </button>
        </div>
      </div>
    )
  }
  if (graduated === 'dismissed') return null

  // Graduate handler
  const handleGraduate = async () => {
    if (graduating || !bridgeQuest) return
    setGraduating(true)
    try {
      await supabase.from('quests').update({
        bridge_status: 'completed',
        status: 'completed',
      }).eq('id', bridgeQuest.id)
      hapticSuccess()
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      setGraduated(true)
      onUpdate?.()
    } catch (err) {
      console.error('Error graduating bridge:', err)
    } finally {
      setGraduating(false)
    }
  }

  // "Got the job" handler (searching → active)
  const handleGotJob = async () => {
    if (updatingStatus || !bridgeQuest) return
    setUpdatingStatus(true)
    try {
      await supabase.from('quests').update({
        bridge_status: 'active',
        is_current_job: true,
      }).eq('id', bridgeQuest.id)
      hapticSuccess()
      onUpdate?.()
    } catch (err) {
      console.error('Error updating bridge status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Remove bridge handler
  const handleRemove = async () => {
    if (!bridgeQuest) return
    await supabase.from('quests').update({
      status: 'closed',
      bridge_status: null,
    }).eq('id', bridgeQuest.id)
    onUpdate?.()
  }

  // State 1: Fulfilled — bridge quest exists
  if (bridgeQuest) {
    const isSearching = bridgeQuest.bridge_status === 'searching'
    return (
      <div className="ptb-section">
        <div className="ptb-header">
          <span className="ptb-header-icon">💰</span>
          <span className="ptb-header-title">Pay The Bills</span>
        </div>
        <div
          className={`ptb-card ${isSearching ? 'searching' : ''}`}
          onClick={() => { hapticLight(); setExpanded(!expanded) }}
        >
          <div className="ptb-card-header">
            <div>
              <div className="ptb-card-title">{bridgeQuest.label}</div>
              {isSearching && (
                <div className="ptb-card-searching-label">Looking for this</div>
              )}
            </div>
            <span className={`ptb-card-status ${isSearching ? 'searching' : 'active'}`}>
              {isSearching ? 'Searching' : 'Active'}
            </span>
          </div>

          {expanded && (
            <div className="ptb-card-details" onClick={e => e.stopPropagation()}>
              {isSearching ? (
                <button className="ptb-got-job-btn" onClick={handleGotJob} disabled={updatingStatus}>
                  {updatingStatus ? 'Updating...' : 'Got the job?'}
                </button>
              ) : (
                <button className="ptb-graduate-btn" onClick={handleGraduate} disabled={graduating}>
                  {graduating ? 'Celebrating...' : 'My flow covers my bills now'}
                </button>
              )}
              <button className="ptb-remove-btn" onClick={handleRemove}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // State 2: Needs filling
  // Determine messaging based on context
  const isFlowUnderpaying = currentJobQuest?.job_relationship === 'grow_this'
    && (currentJobQuest.current_dimensions?.money || 0) < MONEY_TIER_5_THRESHOLD
  const promptText = isFlowUnderpaying
    ? "Your flow doesn't cover expenses yet. What else is keeping the lights on?"
    : "What's keeping the lights on while you grow your flow?"

  return (
    <div className="ptb-section">
      <div className="ptb-header">
        <span className="ptb-header-icon">💰</span>
        <span className="ptb-header-title">Pay The Bills</span>
      </div>
      <div className="ptb-empty">
        <div className="ptb-empty-text">{promptText}</div>
        <div className="ptb-empty-actions">
          <button className="ptb-empty-btn" onClick={() => { hapticLight(); navigate('/add-current-job') }}>
            <span className="ptb-empty-btn-emoji">💼</span>
            <span>{isFlowUnderpaying ? 'I have another job or gig' : 'I have a job or gig'}</span>
          </button>
          <button className="ptb-empty-btn" onClick={() => { hapticLight(); navigate('/find-bridge') }}>
            <span className="ptb-empty-btn-emoji">🔍</span>
            <span>I need to find something</span>
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test the component renders correctly**

This will be testable once wired into LevelTab (Task 6). For now, verify the file has no syntax errors:

Run: `npm run dev` — check console for import errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PayTheBillsSection.jsx src/components/PayTheBillsSection.css
git commit -m "feat: add PayTheBillsSection component with all states"
```

---

### Task 5: FindBridgeFlow

**Files:**
- Create: `src/flows/FindBridgeFlow.jsx`
- Create: `src/flows/FindBridgeFlow.css`
- Modify: `src/AppRouter.jsx` — add route

**Interfaces:**
- Consumes: `getViableBridgeExperiences`, `getAllViableBridgeExperiences`, `formatMonthly` from `src/lib/bridgeJobUtils.js`; `useDomeData` hook from `src/hooks/useDomeData.js`; `getDomeExperiencesForBridge` from `src/lib/domeSummary.js`
- Produces: creates quest with `is_bridge_job: true`, `job_relationship: 'bridge_found'`, `bridge_status: 'active' | 'searching'`

- [ ] **Step 1: Create the CSS file**

```css
/* FindBridgeFlow.css — /find-bridge */

.fbf { min-height: 100dvh; background: #f5f5f0; color: #1a1a2e; }
.fbf-container { max-width: 480px; margin: 0 auto; padding: 20px 20px 120px; }

.fbf-header { text-align: center; margin-bottom: 20px; }
.fbf-header h2 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
.fbf-header p { font-size: 13px; color: rgba(0,0,0,0.4); line-height: 1.5; }

.fbf-back {
  background: none; border: none; padding: 8px 0; margin-bottom: 8px;
  font-size: 15px; color: rgba(0,0,0,0.4); cursor: pointer; font-family: inherit;
}

/* Experience cards — ranked list */
.fbf-list { display: flex; flex-direction: column; gap: 8px; }

.fbf-exp-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(0,0,0,0.06);
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.fbf-exp-card:active { transform: scale(0.98); }
.fbf-exp-card.selected { border-color: #E9A23B; background: rgba(233,162,59,0.04); }
.fbf-exp-card.top-pick { border-color: rgba(94,23,235,0.2); }

.fbf-exp-name { font-size: 15px; font-weight: 600; margin-bottom: 6px; }

.fbf-exp-rates {
  display: flex; gap: 16px; flex-wrap: wrap;
}
.fbf-exp-rate {
  font-size: 12px; color: rgba(0,0,0,0.5);
}
.fbf-exp-rate-label {
  font-weight: 600; color: rgba(0,0,0,0.35);
  text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em;
}
.fbf-exp-rate-value { margin-top: 1px; }

.fbf-exp-monthly {
  font-size: 12px; color: #5e17eb; font-weight: 600; margin-top: 6px;
}

.fbf-top-label {
  font-size: 10px; font-weight: 700; color: #5e17eb;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 4px;
}

/* Name input step */
.fbf-input {
  width: 100%; padding: 14px 16px;
  border: 1.5px solid rgba(0,0,0,0.08); border-radius: 14px;
  background: white; font-size: 16px; font-family: inherit;
  color: #1a1a2e; box-sizing: border-box;
}
.fbf-input:focus { outline: none; border-color: #5e17eb; }

.fbf-earning-context {
  font-size: 13px; color: rgba(0,0,0,0.4); margin-top: 8px; text-align: center;
}

/* Status choice */
.fbf-status-options { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.fbf-status-btn {
  padding: 14px 16px; border-radius: 14px;
  border: 1.5px solid rgba(0,0,0,0.08); background: white;
  font-size: 15px; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: all 0.15s; text-align: left;
  display: flex; align-items: center; gap: 12px; color: #1a1a2e;
}
.fbf-status-btn:active { transform: scale(0.98); }

/* Empty state */
.fbf-empty { text-align: center; padding: 24px 0; }
.fbf-empty p { font-size: 14px; color: rgba(0,0,0,0.4); margin-bottom: 16px; }
.fbf-empty-actions { display: flex; flex-direction: column; gap: 8px; }

/* Fixed bottom */
.fbf-fixed {
  position: fixed; bottom: 0;
  left: 50%; transform: translateX(-50%);
  max-width: 480px; width: 100%;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  background: linear-gradient(transparent, #f5f5f0 20%);
}
.fbf-fixed button {
  width: 100%; padding: 16px;
  border-radius: 14px; border: none;
  background: #5e17eb; color: white;
  font-size: 16px; font-weight: 700;
  font-family: inherit; cursor: pointer;
}
.fbf-fixed button:disabled {
  opacity: 0.4; cursor: not-allowed;
}
```

- [ ] **Step 2: Create the flow component**

```jsx
/**
 * FindBridgeFlow.jsx — /find-bridge
 *
 * Helps users find a bridge job from their Fun-rated dome experiences.
 * Steps: pick experience → name job → have it or searching → save.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { useDomeData } from '../hooks/useDomeData'
import { getDomeExperiencesForBridge } from '../lib/domeSummary'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import {
  getViableBridgeExperiences,
  getAllViableBridgeExperiences,
  formatMonthly,
} from '../lib/bridgeJobUtils'
import './FindBridgeFlow.css'

export default function FindBridgeFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)

  const [step, setStep] = useState('loading') // loading | pick | name | status | empty
  const [experiences, setExperiences] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState(null)
  const [jobTitle, setJobTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  // Process dome data once loaded
  useEffect(() => {
    if (domeLoading) return
    if (!domeStates || Object.keys(domeStates).length === 0) {
      setStep('empty')
      return
    }

    // getDomeExperiencesForBridge returns { fun: [{id, label, primal}], vibeRise: [...] }
    const { fun } = getDomeExperiencesForBridge(domeStates)

    if (fun.length === 0) {
      setStep('empty')
      return
    }

    // Map {id, label} → {nodeId, label} for bridgeJobUtils
    const funExps = fun.map(f => ({ nodeId: f.id, label: f.label }))
    const viable = getViableBridgeExperiences(funExps)

    if (viable.length === 0) {
      setStep('empty')
      return
    }

    setExperiences(viable)
    setStep('pick')
  }, [domeStates, domeLoading])

  // Save bridge quest
  const handleSave = async (bridgeStatus) => {
    if (saving || !jobTitle.trim()) return
    setSaving(true)
    try {
      await supabase.from('quests').insert({
        user_id: user.id,
        label: jobTitle.trim(),
        is_bridge_job: true,
        is_current_job: bridgeStatus === 'active',
        status: 'active',
        predicted_state: 'fun',
        job_relationship: 'bridge_found',
        bridge_status: bridgeStatus,
      })
      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving bridge quest:', err)
    } finally {
      setSaving(false)
    }
  }

  // Save free-text bridge (no experience selection)
  const handleSaveFreeText = async () => {
    if (saving || !jobTitle.trim()) return
    setSaving(true)
    try {
      await supabase.from('quests').insert({
        user_id: user.id,
        label: jobTitle.trim(),
        is_bridge_job: true,
        is_current_job: false,
        status: 'active',
        predicted_state: 'fun',
        job_relationship: 'bridge_found',
        bridge_status: 'searching',
      })
      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving bridge quest:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fbf">
      <div className="fbf-container">

        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.3)' }}>
            Loading your experiences...
          </div>
        )}

        {/* ═══ STEP 1: Pick Experience ═══ */}
        {step === 'pick' && (
          <>
            <button className="fbf-back" onClick={() => navigate(-1)}>&larr; Back</button>
            <div className="fbf-header">
              <h2>These are things you enjoy that could pay the bills</h2>
              <p>Sorted by earning potential. Pick one that could work as a bridge while your flow grows.</p>
            </div>

            <div className="fbf-list">
              {(showAll ? getAllViableBridgeExperiences() : experiences).map((exp, i) => (
                <div key={exp.label}>
                  {i === 0 && !showAll && <div className="fbf-top-label">Top pick</div>}
                  <div
                    className={`fbf-exp-card ${selected?.label === exp.label ? 'selected' : ''} ${i === 0 && !showAll ? 'top-pick' : ''}`}
                    onClick={() => { hapticLight(); setSelected(exp) }}
                  >
                    <div className="fbf-exp-name">{exp.label}</div>
                    <div className="fbf-exp-rates">
                      <div className="fbf-exp-rate">
                        <div className="fbf-exp-rate-label">Employed</div>
                        <div className="fbf-exp-rate-value">{exp.employed}</div>
                      </div>
                      <div className="fbf-exp-rate">
                        <div className="fbf-exp-rate-label">Freelance</div>
                        <div className="fbf-exp-rate-value">{exp.perSession}</div>
                      </div>
                    </div>
                    {exp.monthlyEstimate && (
                      <div className="fbf-exp-monthly">{formatMonthly(exp.monthlyEstimate)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="fbf-fixed">
              <button
                disabled={!selected}
                onClick={() => {
                  hapticLight()
                  setJobTitle(selected.label)
                  setStep('name')
                }}
              >
                Pick this one
              </button>
            </div>
          </>
        )}

        {/* ═══ STEP 2: Name Your Bridge ═══ */}
        {step === 'name' && (
          <>
            <button className="fbf-back" onClick={() => setStep('pick')}>&larr; Back</button>
            <div className="fbf-header">
              <h2>What would you call this job?</h2>
              <p>Make it specific. "Design job at an agency" is better than "Graphic Design".</p>
            </div>

            <input
              className="fbf-input"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder={`e.g. ${selected?.label} job`}
              autoFocus
            />

            {selected?.monthlyEstimate && (
              <div className="fbf-earning-context">
                {selected.employed} employed {formatMonthly(selected.monthlyEstimate)}
              </div>
            )}

            <div className="fbf-fixed">
              <button
                disabled={!jobTitle.trim()}
                onClick={() => { hapticLight(); setStep('status') }}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ═══ STEP 3: Have It or Searching ═══ */}
        {step === 'status' && (
          <>
            <button className="fbf-back" onClick={() => setStep('name')}>&larr; Back</button>
            <div className="fbf-header">
              <h2>Do you have this already?</h2>
              <p>"{jobTitle}"</p>
            </div>

            <div className="fbf-status-options">
              <button className="fbf-status-btn" onClick={() => handleSave('active')} disabled={saving}>
                <span>✅</span>
                <span>I have this</span>
              </button>
              <button className="fbf-status-btn" onClick={() => handleSave('searching')} disabled={saving}>
                <span>🔍</span>
                <span>I need to find this</span>
              </button>
            </div>
          </>
        )}

        {/* ═══ EMPTY STATE: No viable Fun experiences ═══ */}
        {step === 'empty' && (
          <>
            <button className="fbf-back" onClick={() => navigate(-1)}>&larr; Back</button>
            <div className="fbf-header">
              <h2>Let's find something</h2>
              <p>None of your fun experiences have clear employed paths right now. But there are other options.</p>
            </div>

            <div className="fbf-empty">
              <div className="fbf-empty-actions">
                <button className="fbf-status-btn" onClick={() => { hapticLight(); setStep('free_text') }}>
                  <span>💼</span>
                  <span>I know what I can do</span>
                </button>
                <button className="fbf-status-btn" onClick={() => {
                  hapticLight()
                  setExperiences(getAllViableBridgeExperiences())
                  setShowAll(true)
                  setStep('pick')
                }}>
                  <span>📋</span>
                  <span>Show me options</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ═══ FREE TEXT: Type your own bridge ═══ */}
        {step === 'free_text' && (
          <>
            <button className="fbf-back" onClick={() => setStep('empty')}>&larr; Back</button>
            <div className="fbf-header">
              <h2>What could you do to pay the bills?</h2>
              <p>Name a job or gig you could get while your flow grows.</p>
            </div>

            <input
              className="fbf-input"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Freelance web design"
              autoFocus
            />

            <div className="fbf-fixed">
              <button
                disabled={!jobTitle.trim() || saving}
                onClick={handleSaveFreeText}
              >
                {saving ? 'Saving...' : 'Add as my bridge'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify useDomeData hook export**

Run: `grep -n 'export.*useDomeData' src/hooks/useDomeData.js`

Expected: named export `useDomeData`. Returns `{ domeStates, loading, setNodeState }` where `domeStates` = `{ [nodeId]: nsState }`.

Also verify `getDomeExperiencesForBridge` exists:

Run: `grep -n 'export.*getDomeExperiencesForBridge' src/lib/domeSummary.js`

Expected: returns `{ vibeRise: [{id, label, primal}], fun: [{id, label, primal}] }`.

- [ ] **Step 4: Add route to AppRouter**

In `src/AppRouter.jsx`, near the `/add-current-job` route (line 771), add:

```jsx
<Route path="/find-bridge" element={<AuthGate><Suspense fallback={<LoadingSpinner />}><FindBridgeFlow /></Suspense></AuthGate>} />
```

And add the lazy import at the top with the other flow imports (near line 207 where `CurrentJobFlow` is). Use `lazyRetry` to match the existing pattern:

```javascript
const FindBridgeFlow = lazyRetry(() => import('./flows/FindBridgeFlow'))
```

- [ ] **Step 5: Test the full flow**

1. Navigate to `/find-bridge`
2. Verify Fun-rated experiences load and display with rates
3. Verify top pick is highlighted
4. Select an experience → "Pick this one"
5. Name screen: verify pre-filled, edit, proceed
6. Status screen: test "I have this" (creates active bridge) and "I need to find this" (creates searching bridge)
7. Verify quest created in Supabase with correct fields

- [ ] **Step 6: Test empty state**

If needed, temporarily clear dome ratings or use a user with no Fun ratings. Verify:
- "I know what I can do" → free text input → saves
- "Show me options" → shows all experiences (not just user-rated)

- [ ] **Step 7: Commit**

```bash
git add src/flows/FindBridgeFlow.jsx src/flows/FindBridgeFlow.css src/AppRouter.jsx
git commit -m "feat: add FindBridgeFlow for discovering bridge jobs"
```

---

### Task 6: Wire PayTheBillsSection into LevelTab

**Files:**
- Modify: `src/components/level/LevelTab.jsx` (lines 496-595 quest-section area)

**Interfaces:**
- Consumes: `PayTheBillsSection` component, existing `quests` state from LevelTab
- Produces: renders the section below flow paths

- [ ] **Step 1: Add the import**

At the top of `LevelTab.jsx`, after the existing component imports (around line 31), add:

```javascript
import PayTheBillsSection from '../PayTheBillsSection'
```

- [ ] **Step 2: Render PayTheBillsSection after the quest-section**

After the closing `</div>` of the `quest-section` div (line 595, after `{/* Zone Matrix moved to Progress tab */}`), and before the `{/* Struggle Pills */}` comment (line 597), add:

```jsx
{/* Pay The Bills — bridge job section */}
<PayTheBillsSection
  quests={quests}
  userId={userId}
  onUpdate={loadQuests}
/>
```

- [ ] **Step 3: Update quest filtering to exclude bridge jobs from flow paths**

In the quest rendering loop (line 515), update the filter to also exclude bridge jobs so they don't appear in both sections:

Change:
```javascript
{quests.filter(q => q.status === 'active' && q.label !== 'Healing Work').sort(...)
```

To:
```javascript
{quests.filter(q => q.status === 'active' && q.label !== 'Healing Work' && !q.is_bridge_job).sort(...)
```

- [ ] **Step 4: Test the integration**

1. Open `/7-day-challenge` on Paths tab
2. Complete the current job flow with "Happy for it to pay the bills" → verify bridge card appears in Pay The Bills section
3. Complete the current job flow with "Yes, grow this" + money < $1K → verify empty state appears with adjusted messaging
4. Complete the current job flow with "Yes, grow this" + money = $1K+ → verify section is hidden
5. Complete the current job flow with "No, keen to quit" → verify empty state appears
6. Use Find Bridge flow to create a bridge → verify card appears
7. Tap card → expand → test "My flow covers my bills now" → verify confetti + graduation
8. Verify bridge quests don't appear in the main "Your Paths" section

- [ ] **Step 5: Commit**

```bash
git add src/components/level/LevelTab.jsx
git commit -m "feat: wire PayTheBillsSection into Paths tab"
```

---

### Task 7: End-to-End Testing & Polish

**Files:**
- Possibly modify: any file from Tasks 3-6 for bug fixes

**Interfaces:**
- Consumes: all previous tasks
- Produces: verified, working feature

- [ ] **Step 1: Test complete user journey — "Happy for it to pay the bills"**

1. Clear test user's current job quest (or use fresh user)
2. Navigate to `/add-current-job`
3. Enter job title "Marketing Manager"
4. Select life fuels
5. Choose "Happy for it to pay the bills"
6. Rate current dimensions
7. Verify saves with `is_bridge_job: true`, `job_relationship: 'pay_bills'`, `bridge_status: 'active'`
8. Navigates to `/choose-quests`
9. After choosing quests, go to Paths tab
10. Verify "Marketing Manager" appears in Pay The Bills section (not in flow paths)
11. Tap card → expand → "My flow covers my bills now" → confetti

- [ ] **Step 2: Test complete user journey — "No, keen to quit" → Find Bridge**

1. Navigate to `/add-current-job` (different job or reset)
2. Choose "No, keen to quit"
3. Go to Paths tab → verify Pay The Bills shows empty state
4. Tap "I need to find something" → `/find-bridge`
5. Pick experience → name it → "I need to find this"
6. Back on Paths tab → verify bridge card shows with "Searching" status
7. Tap card → "Got the job?" → verify status changes to "Active"

- [ ] **Step 3: Test edge case — "Yes, grow this" + low money**

1. Navigate to `/add-current-job`
2. Choose "Yes, grow this"
3. Set money dimension to tier 2 ($10-50)
4. Complete flow
5. Go to Paths tab → verify quest appears in flow paths AND Pay The Bills empty state shows
6. Verify messaging says "Your flow doesn't cover expenses yet..."

- [ ] **Step 4: Test edge case — "Yes, grow this" + high money**

1. Navigate to `/add-current-job`
2. Choose "Yes, grow this"
3. Set money dimension to tier 5 ($1K+)
4. Complete flow
5. Go to Paths tab → verify quest appears in flow paths and Pay The Bills section is HIDDEN

- [ ] **Step 5: Verify build passes**

Run: `npm run build`

Expected: clean build, no errors.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish Pay The Bills feature after end-to-end testing"
```
