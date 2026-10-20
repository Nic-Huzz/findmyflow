# Zone Cal Radar — Progress Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an 8-spoke self-report radar to the Progress Tab that shows the user their aliveness journey shape, names their diagnosis, and points to the one spoke to work on next. 21-day check-in cadence.

**Architecture:** Self-report every 21 days via inline check-in (reuses tier-card UX from lead magnet). Snapshots stored in `zone_cal_snapshots`. ZoneCalSection component renders radar + diagnosis + CTA on Progress Tab. All dimension/diagnosis logic already exists in `zoneCalDimensions.js`. Radar rendering already exists in `GenericRadar.jsx`.

**Tech Stack:** React 18, Supabase (PostgreSQL + RLS), existing GenericRadar SVG component

**Spec:** `docs/specs/zone-cal-progress-tab-spec.md`

## Global Constraints

- Light theme throughout. Never dark backgrounds. Match `#f5f5f0` or white. Brand purple `#5e17eb` / gold `#E9A23B` for accents.
- CSS scoped to parent class (`.zcs-` prefix for section, `.zcc-` prefix for check-in). Never bare selectors.
- No em dashes in user-facing copy.
- User-facing copy readable by a 12-year-old.
- Fixed bottom buttons: `left: 50%; transform: translateX(-50%); max-width: 480px; padding-bottom: env(safe-area-inset-bottom)`.
- Import dimensions from `src/data/zoneCalDimensions.js`, never redefine inline.
- `src/styles/flow-base.css` for shared flow styles before inventing.

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260926100000_zone_cal_snapshots.sql`

**Interfaces:**
- Consumes: nothing
- Produces: `zone_cal_snapshots` table accessible via Supabase client with RLS

- [ ] **Step 1: Create the migration file**

```sql
-- Zone Cal Snapshots: 21-day self-report check-in history
create table zone_cal_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  scores jsonb not null,
  diagnosis text not null,
  source text not null default 'in_app',
  created_at timestamptz default now()
);

-- RLS
alter table zone_cal_snapshots enable row level security;
create policy "Users read own snapshots"
  on zone_cal_snapshots for select using (auth.uid() = user_id);
create policy "Users insert own snapshots"
  on zone_cal_snapshots for insert with check (auth.uid() = user_id);

-- Index for fetching latest + history
create index idx_zonecal_user_date on zone_cal_snapshots(user_id, created_at desc);
```

- [ ] **Step 2: Apply migration to Supabase**

Run the Supabase MCP `apply_migration` tool with:
- name: `zone_cal_snapshots`
- SQL from step 1
- project_id: `qlwfcfypnoptsocdpxuv`

- [ ] **Step 3: Verify table exists**

Run via Supabase MCP `execute_sql`:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'zone_cal_snapshots' ORDER BY ordinal_position;
```

Expected: 5 columns (id, user_id, scores, diagnosis, source, created_at).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260926100000_zone_cal_snapshots.sql
git commit -m "feat: add zone_cal_snapshots table for 21-day self-report check-ins"
```

---

### Task 2: ZoneCalCheckin Component

The inline 8-question check-in flow. Extracted from `src/flows/ZoneCalRadar.jsx` (the lead magnet) but without hook screen, email gate, calculating animation, or share button. Shows previous answer as context label, not pre-selected.

**Files:**
- Create: `src/components/ZoneCalCheckin.jsx`
- Create: `src/components/ZoneCalCheckin.css`

**Interfaces:**
- Consumes: `ZONE_CAL_DIMENSIONS` from `src/data/zoneCalDimensions.js`
- Produces: `<ZoneCalCheckin previousScores={obj|null} onComplete={(scores) => void} onClose={() => void} />`

- [ ] **Step 1: Create ZoneCalCheckin.jsx**

This is extracted from `src/flows/ZoneCalRadar.jsx` lines 54-268. Strip: hook stage, email_gate stage, calculating stage, results stage, UTM params, funnel tracker, localStorage persistence, email submit handler, share handler. Keep: tier-card question UX, progress dots, phase label, back button, auto-advance on tap.

Add: `previousScores` prop for context labels, `onComplete` callback, close button.

```jsx
import { useState, useCallback, useRef } from 'react'
import { ZONE_CAL_DIMENSIONS } from '../data/zoneCalDimensions'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ZoneCalCheckin.css'

/**
 * ZoneCalCheckin — Inline 8-question self-report check-in.
 *
 * Props:
 *  - previousScores  — { identity: 3, ... } or null (first check-in)
 *  - onComplete      — (scores: { identity: 3, ... }) => void
 *  - onClose         — () => void (cancel/dismiss)
 */
export default function ZoneCalCheckin({ previousScores, onComplete, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const advanceTimer = useRef(null)

  const dim = ZONE_CAL_DIMENSIONS[currentIndex]
  const isRepairPhase = currentIndex <= 3
  const prevLevel = previousScores?.[dim?.id]
  const prevTier = prevLevel
    ? dim.levels.find(l => l.level === prevLevel)
    : null

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const handleTierSelect = useCallback((level) => {
    hapticLight()
    const dimId = ZONE_CAL_DIMENSIONS[currentIndex].id
    const newAnswers = { ...answers, [dimId]: level }
    setAnswers(newAnswers)

    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      if (currentIndex < ZONE_CAL_DIMENSIONS.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // All 8 answered
        hapticSuccess()
        onComplete(newAnswers)
      }
      advanceTimer.current = null
    }, 300)
  }, [currentIndex, answers, onComplete])

  if (!dim) return null

  return (
    <div className="zcc-overlay">
      <div className="zcc-inner">
        {/* Close button */}
        <button className="zcc-close" onClick={onClose}>✕</button>

        {/* Progress dots */}
        <div className="zcc-progress">
          {ZONE_CAL_DIMENSIONS.map((d, i) => (
            <div
              key={d.id}
              className={`zcc-dot ${i <= currentIndex ? 'active' : ''} ${i === currentIndex ? 'current' : ''}`}
            />
          ))}
        </div>

        {/* Phase label */}
        <div className="zcc-phase">
          {isRepairPhase ? 'Inner work' : 'Outer work'} · {currentIndex + 1} of 8
        </div>

        {/* Back button */}
        {currentIndex > 0 && (
          <button className="zcc-back" onClick={goBack}>Back</button>
        )}

        {/* Question */}
        <div className="zcc-emoji">{dim.emoji}</div>
        <h2 className="zcc-title">{dim.name}</h2>
        <p className="zcc-question">{dim.question}</p>

        {/* Previous answer context (not pre-selected) */}
        {prevTier && (
          <div className="zcc-prev-label">
            Last time: Level {prevLevel} — {prevTier.label}
          </div>
        )}

        {/* Tier cards */}
        <div className="zcc-tiers">
          {dim.levels.map(tier => (
            <div
              key={tier.level}
              className={`zcc-tier ${answers[dim.id] === tier.level ? 'selected' : ''}`}
              onClick={() => handleTierSelect(tier.level)}
            >
              <div className="zcc-tier-level">{tier.level}</div>
              <div className="zcc-tier-content">
                <div className="zcc-tier-label">{tier.label}</div>
                <div className="zcc-tier-desc">{tier.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ZoneCalCheckin.css**

Reuse the `.zcr-` patterns from `src/flows/ZoneCalRadar.css` but with `.zcc-` prefix and scoped to the overlay. The overlay is a full-screen modal (same as HealingFlowModal pattern).

```css
/* ── Zone Cal Check-in (inline 8-question flow) ── */

.zcc-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #f5f5f0;
  z-index: 100;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  justify-content: center;
}

.zcc-inner {
  max-width: 480px;
  width: 100%;
  padding: 2rem 1.25rem;
  padding-bottom: calc(2rem + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.zcc-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #999;
  cursor: pointer;
  padding: 8px;
  font-family: inherit;
}

/* Progress dots */
.zcc-progress {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-bottom: 1rem;
}

.zcc-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e0ddd8;
  transition: all 0.3s ease;
}

.zcc-dot.active { background: #5e17eb; }
.zcc-dot.current { transform: scale(1.3); }

/* Phase + back */
.zcc-phase {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin-bottom: 1.5rem;
}

.zcc-back {
  position: absolute;
  top: 2rem;
  left: 1.25rem;
  background: none;
  border: none;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  font-family: inherit;
}

/* Question */
.zcc-emoji { font-size: 2.5rem; margin-bottom: 0.5rem; }

.zcc-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #5e17eb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.zcc-question {
  font-size: 1.15rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1rem;
  line-height: 1.4;
  text-align: center;
}

/* Previous answer context */
.zcc-prev-label {
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 1rem;
  font-style: italic;
}

/* Tier cards (matches lead magnet .zcr-tier) */
.zcc-tiers {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.zcc-tier {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e0ddd8;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.zcc-tier:hover { border-color: #5e17eb; background: #faf9f7; }
.zcc-tier.selected { border-color: #5e17eb; background: rgba(94, 23, 235, 0.06); }

.zcc-tier-level {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0eee9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: #666;
  flex-shrink: 0;
}

.zcc-tier.selected .zcc-tier-level { background: #5e17eb; color: white; }

.zcc-tier-content { flex: 1; min-width: 0; }
.zcc-tier-label { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
.zcc-tier-desc { font-size: 0.82rem; color: #888; line-height: 1.35; }
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/nichuzz/creations/Findmyflow && npm run build
```

Expected: clean build (component not yet imported anywhere).

- [ ] **Step 4: Commit**

```bash
git add src/components/ZoneCalCheckin.jsx src/components/ZoneCalCheckin.css
git commit -m "feat: add ZoneCalCheckin inline 8-question check-in component"
```

---

### Task 3: ZoneCalSection Component + Progress Tab Integration

The container component that renders on the Progress Tab. Handles 3 states (no snapshot, fresh, stale), renders the radar + diagnosis + CTA, manages check-in flow, and does the lead magnet bridge.

**Files:**
- Create: `src/components/ZoneCalSection.jsx`
- Create: `src/components/ZoneCalSection.css`
- Modify: `src/components/ProgressTab.jsx`

**Interfaces:**
- Consumes: `ZoneCalCheckin` from Task 2, `GenericRadar` from `src/components/GenericRadar.jsx`, `ZONE_CAL_DIMENSIONS`, `getDiagnosis`, `getNextSpoke` from `src/data/zoneCalDimensions.js`
- Produces: `<ZoneCalSection userId={string} userEmail={string} hasEssence={boolean} />` rendered inside ProgressTab

- [ ] **Step 1: Create the SPOKE_CTAS data and getChangeNarrative utility at the top of ZoneCalSection.jsx**

```jsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ZONE_CAL_DIMENSIONS, getDiagnosis, getNextSpoke } from '../data/zoneCalDimensions'
import GenericRadar from './GenericRadar'
import ZoneCalCheckin from './ZoneCalCheckin'
import './ZoneCalSection.css'

const SPOKE_CTAS = {
  identity: {
    text: "What's a courage challenge that helps express your essence character?",
    route: '/7-day-challenge',
    tab: 'courage',
  },
  vulnerability: {
    text: 'Create a courage challenge that pushes Vulnerability',
    route: '/7-day-challenge',
    tab: 'courage',
  },
  direction: {
    text: 'Complete courage challenges on your life paths',
    route: '/7-day-challenge',
    tab: 'paths',
  },
  worth: {
    text: "A voice is blocking this. Let's find it",
    action: 'healing_voice_select',
  },
  growth: {
    text: 'Create a courage challenge',
    route: '/7-day-challenge',
    tab: 'courage',
  },
  output: {
    text: 'Set up a weekly practice',
    route: '/7-day-challenge',
    tab: 'tune',
  },
  risk: {
    text: 'Create a courage challenge that pushes Money or Stakes',
    route: '/7-day-challenge',
    tab: 'courage',
  },
  play: {
    text: "Check your aftertaste. Are you doing things you'd do again?",
    route: '/7-day-challenge',
    tab: 'discover',
  },
}

const STALE_DAYS = 21

function getChangeNarrative(oldScores, newScores, oldDiagnosis, newDiagnosis) {
  const changes = ZONE_CAL_DIMENSIONS.map(d => ({
    id: d.id,
    name: d.name,
    delta: (newScores[d.id] || 0) - (oldScores[d.id] || 0),
  })).filter(c => c.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const grew = changes.filter(c => c.delta > 0)
  const dropped = changes.filter(c => c.delta < 0)

  if (oldDiagnosis.id === newDiagnosis.id) {
    if (grew.length) return `${grew[0].name} grew. You're still in the same shape, but it's shifting.`
    return 'Same shape. The 21-day check-in is about noticing, not forcing change.'
  }

  if (grew.length && !dropped.length) return `${grew.map(c => c.name).join(' and ')} moved. Your shape changed.`
  if (grew.length && dropped.length) return `${grew[0].name} grew while ${dropped[0].name} softened. Different shape, different focus.`
  return 'Your shape shifted. New spoke to focus on.'
}
```

- [ ] **Step 2: Write the ZoneCalSection component body**

```jsx
export default function ZoneCalSection({ userId, userEmail, hasEssence }) {
  const navigate = useNavigate()
  const [snapshots, setSnapshots] = useState(null) // [latest, previous] or null
  const [loading, setLoading] = useState(true)
  const [showCheckin, setShowCheckin] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [completionResult, setCompletionResult] = useState(null) // { scores, diagnosis, narrative }
  const [bridgeAttempted, setBridgeAttempted] = useState(false)

  // Load snapshots
  useEffect(() => {
    if (!userId) return
    let mounted = true

    async function load() {
      const { data } = await supabase
        .from('zone_cal_snapshots')
        .select('scores, diagnosis, source, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2)

      if (!mounted) return

      if (data && data.length > 0) {
        setSnapshots(data)
        setLoading(false)
        return
      }

      // No snapshots — try lead magnet bridge
      if (!bridgeAttempted && userEmail) {
        setBridgeAttempted(true)
        const { data: leads } = await supabase
          .from('lead_captures')
          .select('scores, created_at')
          .eq('email', userEmail)
          .eq('source', 'zone-cal-radar')
          .order('created_at', { ascending: false })
          .limit(1)

        if (!mounted) return

        const leadScores = leads?.[0]?.scores?.dimensions
        if (leadScores && Object.keys(leadScores).length === 8) {
          const diagnosis = getDiagnosis(leadScores)
          const { error } = await supabase.from('zone_cal_snapshots').insert({
            user_id: userId,
            scores: leadScores,
            diagnosis: diagnosis.id,
            source: 'lead_magnet',
            created_at: leads[0].created_at,
          })
          if (!error && mounted) {
            // Refetch
            const { data: fresh } = await supabase
              .from('zone_cal_snapshots')
              .select('scores, diagnosis, source, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(2)
            if (mounted) setSnapshots(fresh || [])
          }
        }
      }

      if (mounted) setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [userId, userEmail, bridgeAttempted])

  // Derived state
  const latest = snapshots?.[0] || null
  const previous = snapshots?.[1] || null
  const diagnosis = latest ? getDiagnosis(latest.scores) : null
  const nextSpoke = latest ? getNextSpoke(latest.scores) : null
  const cta = nextSpoke ? SPOKE_CTAS[nextSpoke.id] : null

  const daysOld = latest
    ? Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 86400000)
    : null
  const isStale = daysOld !== null && daysOld >= STALE_DAYS
  const daysUntil = daysOld !== null ? Math.max(0, STALE_DAYS - daysOld) : null

  // Check-in complete handler
  const handleCheckinComplete = async (scores) => {
    const newDiagnosis = getDiagnosis(scores)

    await supabase.from('zone_cal_snapshots').insert({
      user_id: userId,
      scores,
      diagnosis: newDiagnosis.id,
      source: 'in_app',
    })

    // Build completion result for narrative
    if (latest) {
      const oldDiagnosis = getDiagnosis(latest.scores)
      setCompletionResult({
        scores,
        diagnosis: newDiagnosis,
        oldDiagnosis,
        narrative: getChangeNarrative(latest.scores, scores, oldDiagnosis, newDiagnosis),
      })
    } else {
      setCompletionResult({ scores, diagnosis: newDiagnosis, oldDiagnosis: null, narrative: null })
    }

    setShowCheckin(false)

    // Refetch snapshots
    const { data } = await supabase
      .from('zone_cal_snapshots')
      .select('scores, diagnosis, source, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2)
    setSnapshots(data || [])
  }

  // CTA click handler
  const handleCtaClick = () => {
    if (!cta) return
    if (cta.action === 'healing_voice_select') {
      // Dispatch event for healing flow with voice selection
      window.dispatchEvent(new CustomEvent('zonecal:healingVoice', {
        detail: { spoke: 'worth' },
      }))
      return
    }
    if (cta.route) {
      const params = new URLSearchParams()
      if (cta.tab) params.set('tab', cta.tab)
      navigate(`${cta.route}${params.toString() ? '?' + params.toString() : ''}`)
    }
  }

  if (loading) return null
  // Don't show until essence mirror is complete
  if (!hasEssence && !latest) return null

  // ── State 1: No snapshot ──
  if (!latest && !completionResult) {
    return (
      <>
        <div className="pt-bridge"><span className="pt-bridge-text">where are you on the journey?</span></div>
        <div className="zcs-empty-card">
          <div className="zcs-empty-emoji">🧭</div>
          <div className="zcs-empty-title">See your shape</div>
          <div className="zcs-empty-sub">8 questions, 30 seconds. Find out where you are and what to focus on next.</div>
          <button className="primary-button zcs-empty-btn" onClick={() => setShowCheckin(true)}>
            See my shape
          </button>
        </div>
        {showCheckin && (
          <ZoneCalCheckin
            previousScores={null}
            onComplete={handleCheckinComplete}
            onClose={() => setShowCheckin(false)}
          />
        )}
      </>
    )
  }

  // ── Completion result screen (just finished a check-in) ──
  if (completionResult) {
    const cr = completionResult
    const crNextSpoke = getNextSpoke(cr.scores)
    const crCta = crNextSpoke ? SPOKE_CTAS[crNextSpoke.id] : null

    return (
      <>
        <div className="pt-bridge"><span className="pt-bridge-text">your shape</span></div>
        <div className="zcs-card">
          {/* Diagnosis change narrative */}
          {cr.oldDiagnosis && cr.narrative && (
            <div className="zcs-transition">
              <div className="zcs-transition-old">You were in <strong>{cr.oldDiagnosis.name}</strong></div>
              <div className="zcs-transition-arrow">↓</div>
              <div className="zcs-transition-new">Now you're in <strong>{cr.diagnosis.name}</strong></div>
              <div className="zcs-transition-narrative">{cr.narrative}</div>
            </div>
          )}

          {/* First-time result (no previous) */}
          {!cr.oldDiagnosis && (
            <>
              <div className="zcs-diagnosis-name">{cr.diagnosis.name}</div>
              <div className="zcs-diagnosis-headline">{cr.diagnosis.headline}</div>
            </>
          )}

          <GenericRadar
            dimensions={ZONE_CAL_DIMENSIONS}
            scores={cr.scores}
            scores3={latest?.scores || null}
            maxLevel={5}
            size={280}
          />

          {cr.diagnosis.description && (
            <div className="zcs-diagnosis-desc">{cr.diagnosis.description}</div>
          )}

          {crNextSpoke && crCta && (
            <div className="zcs-next-spoke">
              <div className="zcs-spoke-label">Focus on next</div>
              <div className="zcs-spoke-card">
                <span className="zcs-spoke-emoji">{crNextSpoke.emoji}</span>
                <div>
                  <strong>{crNextSpoke.name}</strong>
                  <p>{crCta.text}</p>
                </div>
              </div>
            </div>
          )}

          <button
            className="primary-button zcs-done-btn"
            onClick={() => setCompletionResult(null)}
          >
            Done
          </button>
        </div>
      </>
    )
  }

  // ── States 2 & 3: Snapshot exists ──
  return (
    <>
      <div className="pt-bridge"><span className="pt-bridge-text">your shape</span></div>
      <div className="zcs-card">
        <div className="zcs-diagnosis-name">{diagnosis.name}</div>
        <div className="zcs-diagnosis-headline">{diagnosis.headline}</div>

        <div
          className="zcs-radar-tap"
          onClick={() => setShowBreakdown(!showBreakdown)}
          role="button"
          tabIndex={0}
        >
          <GenericRadar
            dimensions={ZONE_CAL_DIMENSIONS}
            scores={latest.scores}
            scores3={previous?.scores || null}
            maxLevel={5}
            size={280}
          />
        </div>

        {/* Countdown or retake CTA */}
        {isStale ? (
          <button
            className="primary-button zcs-retake-btn"
            onClick={() => setShowCheckin(true)}
          >
            Your shape is {daysOld}+ days old. Retake?
          </button>
        ) : (
          <div className="zcs-countdown">{daysUntil} days until next check-in</div>
        )}

        {/* Dimension breakdown (accordion) */}
        {showBreakdown && (
          <div className="zcs-breakdown">
            {ZONE_CAL_DIMENSIONS.map(dim => {
              const val = latest.scores[dim.id] || 0
              const tier = dim.levels.find(l => l.level === val)
              return (
                <div key={dim.id} className={`zcs-dim-row ${val <= 2 ? 'low' : val >= 4 ? 'high' : ''}`}>
                  <span className="zcs-dim-emoji">{dim.emoji}</span>
                  <div className="zcs-dim-info">
                    <strong>{dim.name}: {val}/5</strong>
                    <span className="zcs-dim-tier">{tier?.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Next spoke CTA */}
        {nextSpoke && cta && (
          <div className="zcs-next-spoke">
            <div className="zcs-spoke-label">Your next spoke</div>
            <div className="zcs-spoke-card" onClick={handleCtaClick} role="button" tabIndex={0}>
              <span className="zcs-spoke-emoji">{nextSpoke.emoji}</span>
              <div>
                <strong>{nextSpoke.name}</strong>
                <p>{cta.text}</p>
              </div>
              <span className="zcs-spoke-arrow">→</span>
            </div>
          </div>
        )}
      </div>

      {showCheckin && (
        <ZoneCalCheckin
          previousScores={latest.scores}
          onComplete={handleCheckinComplete}
          onClose={() => setShowCheckin(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Create ZoneCalSection.css**

```css
/* ── Zone Cal Section (Progress Tab) ── */

/* Empty state card */
.zcs-empty-card {
  background: linear-gradient(135deg, #f8f5ff 0%, #fff8f0 100%);
  border-radius: 16px;
  padding: 24px 20px;
  text-align: center;
  border: 1px solid rgba(94, 23, 235, 0.12);
  margin-bottom: 16px;
}

.zcs-empty-emoji { font-size: 2rem; margin-bottom: 8px; }
.zcs-empty-title { font-size: 1.1rem; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.zcs-empty-sub { font-size: 0.85rem; color: #888; margin-bottom: 16px; line-height: 1.5; }
.zcs-empty-btn { width: 100%; }

/* Main card */
.zcs-card {
  background: white;
  border-radius: 16px;
  padding: 20px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-align: center;
}

/* Diagnosis */
.zcs-diagnosis-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.zcs-diagnosis-headline {
  font-size: 0.9rem;
  color: #5e17eb;
  font-weight: 600;
  margin-bottom: 12px;
}

.zcs-diagnosis-desc {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.5;
  margin: 12px 0 0;
}

/* Radar tap target */
.zcs-radar-tap { cursor: pointer; }

/* Countdown + retake */
.zcs-countdown {
  font-size: 0.8rem;
  color: #999;
  margin: 8px 0 16px;
}

.zcs-retake-btn {
  width: 100%;
  margin: 8px 0 16px;
}

/* Transition narrative */
.zcs-transition {
  margin-bottom: 16px;
  padding: 16px;
  background: #faf9f7;
  border-radius: 12px;
}

.zcs-transition-old {
  font-size: 0.85rem;
  color: #999;
}

.zcs-transition-arrow {
  font-size: 1rem;
  color: #ccc;
  margin: 4px 0;
}

.zcs-transition-new {
  font-size: 1rem;
  color: #5e17eb;
  font-weight: 600;
}

.zcs-transition-narrative {
  font-size: 0.85rem;
  color: #666;
  margin-top: 8px;
  line-height: 1.5;
}

/* Dimension breakdown */
.zcs-breakdown {
  margin-top: 12px;
  text-align: left;
}

.zcs-dim-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  margin-bottom: 4px;
  background: #faf9f7;
}

.zcs-dim-row.low { background: #fef3f2; }
.zcs-dim-row.high { background: #f0fdf4; }

.zcs-dim-emoji { font-size: 1.1rem; flex-shrink: 0; }

.zcs-dim-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zcs-dim-info strong { font-size: 0.85rem; }
.zcs-dim-tier { font-size: 0.75rem; color: #888; }

/* Next spoke CTA */
.zcs-next-spoke {
  text-align: left;
  margin-top: 16px;
}

.zcs-spoke-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  margin-bottom: 8px;
}

.zcs-spoke-card {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(94, 23, 235, 0.06);
  border: 2px solid #5e17eb;
  border-radius: 12px;
  align-items: flex-start;
  cursor: pointer;
  transition: background 0.2s ease;
}

.zcs-spoke-card:hover { background: rgba(94, 23, 235, 0.1); }

.zcs-spoke-emoji { font-size: 1.3rem; flex-shrink: 0; padding-top: 2px; }

.zcs-spoke-card strong {
  display: block;
  font-size: 0.9rem;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.zcs-spoke-card p {
  font-size: 0.82rem;
  color: #666;
  line-height: 1.4;
  margin: 0;
}

.zcs-spoke-arrow {
  margin-left: auto;
  font-size: 1.1rem;
  color: #5e17eb;
  align-self: center;
  flex-shrink: 0;
}

/* Done button (after check-in) */
.zcs-done-btn {
  width: 100%;
  margin-top: 16px;
}
```

- [ ] **Step 4: Wire ZoneCalSection into ProgressTab**

In `src/components/ProgressTab.jsx`:

**4a. Add import.** In `ProgressTab.jsx`, find:

```jsx
import GenericRadar from './GenericRadar'
```

Add directly after it:

```jsx
import ZoneCalSection from './ZoneCalSection'
```

**4b. Add `userEmail` state.** Find this exact block:

```jsx
  // Observations (Intelligence Observations system)
  const [observations, setObservations] = useState([])
```

Add directly after it:

```jsx
  // Zone Cal
  const [userEmail, setUserEmail] = useState(null)
```

**4c. Load `userEmail` in `loadAllData`.** Find this exact block inside the `loadAllData` function:

```jsx
        // Process hero stage
        setHeroStage(stageRes.data?.current_journey_level || 0)
        setAvatarUrl(stageRes.data?.hero_avatar_url || null)
```

Add directly after it:

```jsx
        // Get user email for Zone Cal lead magnet bridge
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (mounted) setUserEmail(authUser?.email || null)
```

**4d. Insert ZoneCalSection in JSX.** Find this exact string in the JSX:

```jsx
      {/* ═══ ESSENCE CARD ═══ */}
      {hasEssence && essenceData && (
```

Add directly BEFORE it:

```jsx
      {/* ═══ ZONE CAL ═══ */}
      <ZoneCalSection userId={userId} userEmail={userEmail} hasEssence={hasEssence} />

```

- [ ] **Step 5: Add Worth CTA healing event listener to ProgressTab**

The Worth CTA dispatches `zonecal:healingVoice`. ProgressTab already has `showHealing` state (line 156), `unhealedPattern` state (line 155), `HealingFlowModal` (line 980), and `getVoiceDisplay` imported (line 15). Find this exact block:

```jsx
  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]

  // ── Observation handlers ──
```

Add directly before `// ── Observation handlers ──`:

```jsx
  // Zone Cal Worth CTA → open healing voice selector
  useEffect(() => {
    const handler = () => {
      if (voiceData?.voice) {
        setUnhealedPattern({
          voice: voiceData.voice,
          name: getVoiceDisplay(voiceData.voice),
          dimensions: ['worth'],
        })
      } else {
        setUnhealedPattern({
          voice: 'perfectionist',
          name: 'The Perfectionist',
          dimensions: ['worth'],
        })
      }
      setShowHealing(true)
    }
    window.addEventListener('zonecal:healingVoice', handler)
    return () => window.removeEventListener('zonecal:healingVoice', handler)
  }, [voiceData])

  // ── Observation handlers ──
```

This replaces the original `// ── Observation handlers ──` comment — don't duplicate it.

- [ ] **Step 6: Build and verify**

```bash
cd /Users/nichuzz/creations/Findmyflow && npm run build
```

Expected: clean build.

- [ ] **Step 7: Commit**

```bash
git add src/components/ZoneCalSection.jsx src/components/ZoneCalSection.css src/components/ProgressTab.jsx
git commit -m "feat: add Zone Cal radar section to Progress Tab with 21-day check-in"
```

---

### Task 4: Final Build Verification + CLAUDE.md Update

**Files:**
- Modify: `CLAUDE.md` (add `zone_cal_snapshots` to DB schema section)

**Interfaces:**
- Consumes: all previous tasks
- Produces: updated project docs

- [ ] **Step 1: Add zone_cal_snapshots to CLAUDE.md DB schema**

Find the `### Other` section in the Database Schema section of `CLAUDE.md`. Add after `user_dismissed_observations`:

```
### Zone Cal
`zone_cal_snapshots` (user_id, scores jsonb, diagnosis text, source text, created_at)
```

- [ ] **Step 2: Full build verification**

```bash
cd /Users/nichuzz/creations/Findmyflow && npm run build
```

- [ ] **Step 3: Verify no convention violations**

Check for:
- No em dashes in user-facing copy in new files
- All CSS selectors scoped to `.zcs-` or `.zcc-` prefix
- No bare `.primary-button` redefinitions
- Dimensions imported from `zoneCalDimensions.js`, not redefined

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add zone_cal_snapshots table to CLAUDE.md schema section"
```
