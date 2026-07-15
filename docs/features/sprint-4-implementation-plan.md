# Sprint 4: Implementation Plan

**Created:** 2026-07-13
**Branch:** `light-portal`
**Depends on:** Sprint 3 (committed `2ad2644`), Zarlo Brief running 2+ weeks
**Spec doc:** `docs/features/octalysis-alignment-implementation-notes.md` (Sections 5, 6, 7, 9)

---

## What's Been Built (Sprints 1-3)

| Sprint | What | Status |
|---|---|---|
| 1A | Post-wahoo per-state responses + RP differentiation | ✅ Shipped |
| 1B | Daily check-in +2 RP | ✅ Shipped |
| 1C | Protective voice counting + Zarlo proactive bubble | ✅ Shipped |
| 2A | Zarlo Brief Edge Function + migration + cron | ✅ Deployed |
| 2B | Brief → zarloEngine + system prompt injection | ✅ Shipped |
| 2C | Journey tab shell | ✅ Shipped |
| 2D | Stage 6→7 interim milestones (voice dots) | ✅ Shipped |
| 3A | Hero stage graduation triggers (heroStageChecker) | ✅ Shipped |
| 3B | Graduation celebrations (6 stages) | ✅ Shipped |
| 3C | Insight Drops V1 (4 types, Common + Uncommon) | ✅ Shipped |
| 3D | Proactive Zarlo (2 Brief-based triggers) | ✅ Shipped |
| — | Dead code removal (Challenge.jsx -1581 lines) | ✅ Shipped |

## What Remains (from Octalysis spec)

| Item | Spec Section | Status | Depends On |
|---|---|---|---|
| Figurine Unstick Flow | Section 9, Gap 2 | Not built | Figurine visual design |
| Social V1 (Kudos, counters, solidarity) | Section 9, Gap 3 | Not built | Design session |
| Expanded proactive triggers (contradictions, day-of-week, visibility gaps) | Section 6 | Not built | 4+ weeks of Brief data |
| Backfill existing users to correct hero stages | Sprint 3 plan | Not built | Sprint 3A deployed |
| Insight Drops Rare/Legendary tier | Section 9, Gap 6 | Not built | Figurine for Legendary delivery |
| Self-Knowledge Skills V2 | Section 9, Gap 6 | Not built | 30+ days of Brief data |
| L0-L4 Depth Scale | Section 2 | Existing plan | Schema + wahoo creation changes |
| Visibility × Depth Mismatch Detection | Section 4 | Spec'd | L0-L4 built |
| Session Bridge | Section 9, Gap 7 | Notes only | Nothing exists yet |
| Flow Statement (Stage 9) | Section 3 | Full spec | Users reaching Stage 8+ |

---

## Sprint 4: What to Build

Sprint 4 focuses on three things that are NOW unblocked by Sprint 3:

| Item | What It Does | Effort | Why Now |
|---|---|---|---|
| **4A** Backfill hero stages | Edge Function to advance existing users to correct stages | 1 day | Sprint 3A checker exists but existing users are all at Stage 0 |
| **4B** Stuck detection + Unstick Flow | Journey tab shows stuck state + 3-step modal creates wahoo | 2-3 days | Journey tab exists, Brief computes stuck days |

**Total: 3-4 days**

**Removed from Sprint 4:**
- Expanded proactive triggers (contradictions, day-of-week, visibility gaps) — most Briefs still have null pattern data. Move to Sprint 5 when >50% have non-null data.
- Social V1 (Kudos, counters) — needs dedicated design session. Move to Sprint 5+.

---

## 4A: Backfill Hero Stages

### Create: `supabase/functions/backfill-hero-stages/index.ts`

One-time Edge Function. Reuses the graduation check logic.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch all users with stage progress
  const { data: users } = await supabase
    .from('user_stage_progress')
    .select('user_id, current_journey_level')

  let graduated = 0
  let errors = 0
  const MAX_ITERATIONS = 20

  for (const { user_id } of (users || [])) {
    try {
      let iterations = 0
      let advanced = true

      while (advanced && iterations < MAX_ITERATIONS) {
        iterations++
        // Inline graduation logic (same as heroStageChecker.js but server-side)
        const result = await checkAndAdvance(supabase, user_id)
        advanced = result !== null
        if (advanced) graduated++
      }
    } catch (e) {
      errors++
      console.error(`Backfill failed for ${user_id}:`, e)
    }
  }

  return new Response(
    JSON.stringify({ processed: users?.length || 0, graduated, errors }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})

async function checkAndAdvance(supabase, userId) {
  // Same logic as heroStageChecker.js but using service role client
  // (copy the 6 graduation condition checks)
  // Returns { from, to } or null
}
```

**Deploy + invoke once.** No cron needed — this is a one-time operation.

### Testing
- [ ] Invoke: `curl -X POST .../functions/v1/backfill-hero-stages -H "Authorization: Bearer [KEY]"`
- [ ] Check results: `SELECT current_journey_level, COUNT(*) FROM user_stage_progress GROUP BY 1`
- [ ] Verify distribution makes sense (most users at Stage 2-4, some at 5-6)

---

## 4B: Expanded Proactive Triggers

### Prerequisites

The Zarlo Brief needs 2+ weeks of daily generation. Check:
```sql
SELECT COUNT(*) FROM zarlo_briefs WHERE brief->'patterns'->'day_of_week' IS NOT NULL;
SELECT COUNT(*) FROM zarlo_briefs WHERE brief->'contradictions' != '[]'::jsonb AND brief->'contradictions' IS NOT NULL;
```

If most Briefs still have null patterns, defer this to Sprint 5.

### File: `src/components/Zarlo/ZarloWidget.jsx`

Add 3 triggers to `checkProactiveInsights`, AFTER the existing 2 (voice readiness + streak approaching):

```javascript
// 3. Contradiction: self-report doesn't match behaviour
if (!message && brief.contradictions?.length > 0) {
  const contradiction = brief.contradictions[0]
  const key = `zarlo_contradiction_${contradiction.slice(0, 20).replace(/\s/g, '_')}`
  if (!localStorage.getItem(key)) {
    if (contradiction.includes('Safe but Pressure')) {
      message = "You've been checking in as Safe, but your wahoos keep coming back Pressure. Both can be true. Which one matters more right now?"
    } else if (contradiction.includes('Healing declining')) {
      message = "Your healing tab visits are dropping, but the protective voice count is rising. Something's being avoided."
    }
    if (message) localStorage.setItem(key, 'true')
  }
}

// 4. Day-of-week pattern (only shown ON the relevant day)
if (!message && brief.patterns?.day_of_week) {
  const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const todayName = dayNames[new Date().getDay()]
  const todayPattern = brief.patterns.day_of_week[todayName]
  if (todayPattern) {
    const key = `zarlo_daypattern_${todayName}`
    if (!localStorage.getItem(key)) {
      const state = Object.keys(todayPattern)[0]?.replace('_pct', '')
      if (state === 'sympathetic' || state === 'dorsal') {
        const dayLabel = todayName.charAt(0).toUpperCase() + todayName.slice(1)
        message = `${dayLabel}s tend to be ${state === 'sympathetic' ? 'Activated' : 'Shutdown'} for you. What happens on ${dayLabel}s?`
        localStorage.setItem(key, 'true')
      }
    }
  }
}

// 5. Visibility gap (after 10+ wahoos)
if (!message && brief.patterns?.visibility_layers) {
  const layers = brief.patterns.visibility_layers
  const total = Object.values(layers).reduce((a, b) => a + b, 0)
  if (total >= 10) {
    const gaps = Object.entries(layers).filter(([, count]) => count === 0)
    if (gaps.length > 0 && gaps.length <= 3) {
      const gapName = cap(gaps[0][0])
      const key = `zarlo_visgap_${gaps[0][0]}`
      if (!localStorage.getItem(key)) {
        message = `${total} wahoos completed. None of them ${gapName}. That's not an accident.`
        localStorage.setItem(key, 'true')
      }
    }
  }
}
```

Priority order remains: readiness > streak > contradiction > day-of-week > visibility gap.

### Testing
- [ ] User with "Safe but Pressure" contradiction in Brief: message appears
- [ ] User with day-of-week pattern: message appears ON the correct day only
- [ ] User with 10+ wahoos and 0 in Money: visibility gap message appears
- [ ] Still max 1/day (localStorage guard)

---

## 4C: Social V1 — Kudos + Counters

### What's Reusable (from UI audit)

- `league_content_reactions` table exists with 4 reaction types (🎉 🔥 👏 💜)
- `addReaction` / `removeReaction` in `leagueService.js` — generic, works with any `submission_id`
- `ShareWinStep.jsx` creates posts in `playlist_feed_posts` — shared wahoos are already postable
- `NewsfeedPage.jsx` renders reactions on feed items

### 4C-1: Extend Kudos to Shared Wahoos

The sharing flow already exists (ShareWinStep in GroanCompletionModal). Shared wahoos create `playlist_feed_posts`. The Newsfeed (`/newsfeed`) already shows these with reactions.

**What's missing:** Kudos from the `/7-day-challenge` page itself. When someone shares a wahoo, others in the community should be able to Kudos it without going to the Newsfeed page.

**Simple approach:** Add a "Community" section to the Journey tab showing recent shared wahoos from ALL users (not just league members) with Kudos buttons.

**File: `src/components/JourneyTab.jsx`**

Add a section after the existing stage card + voice dots:

```jsx
{/* Community Wahoos — V1 social */}
<div className="jt-section">
  <h3 className="jt-section-title">Community Courage</h3>
  {recentSharedWahoos.map(post => (
    <div key={post.id} className="jt-community-card">
      <p className="jt-community-text">{post.caption}</p>
      <div className="jt-community-reactions">
        {REACTION_TYPES.map(r => (
          <button key={r.type} onClick={() => toggleReaction(post.id, r.type)}>
            {r.emoji} {post.reactions?.[r.type] || 0}
          </button>
        ))}
      </div>
    </div>
  ))}
  {recentSharedWahoos.length === 0 && (
    <p className="jt-community-empty">No shared wahoos yet. Be the first.</p>
  )}
</div>
```

Query: last 5 shared wahoos from `playlist_feed_posts`, with reaction counts.

### 4C-2: Cumulative Monthly Counter

**File: `src/components/JourneyTab.jsx`**

Add after stage card:

```jsx
{monthlyWahooCount > 0 && (
  <div className="jt-community-stat">
    {monthlyWahooCount} wahoos completed by the community this month. You were part of {userMonthlyCount} of them.
  </div>
)}
```

Query:
```sql
SELECT COUNT(*) FROM quest_completions 
WHERE quest_category = 'Groans' 
AND created_at >= date_trunc('month', now())
```

### Testing
- [ ] Community section shows on Journey tab
- [ ] Kudos buttons work (toggle on/off)
- [ ] Monthly counter shows correct total
- [ ] Empty state when no shared wahoos

---

## 4C: Stuck Detection + Unstick Flow

### What Exists

- Journey tab shows hero stage (Sprint 2C)
- Zarlo Brief computes `thresholds.stage_stuck_days` (Sprint 2A)
- Stuck thresholds per stage defined in spec (Section 9, Gap 2)
- HealingFlowModal pattern (multi-step, auto-save, modal overlay) as reference

### Modify: `src/components/JourneyTab.jsx`

Add state + stuck section after the voice dots:

```jsx
import { useState } from 'react'  // add to existing import
import UnstickFlow from './UnstickFlow'

// Inside component, add state:
const [showUnstickFlow, setShowUnstickFlow] = useState(false)

// In JSX, after voice dots section:
{brief?.thresholds?.stage_stuck_days > 0 && (
  <div className="jt-section jt-stuck-section">
    <span className="jt-stuck-icon">🧭</span>
    <p className="jt-stuck-message">
      {getStuckMessage(heroStage, brief.thresholds.stage_stuck_days)}
    </p>
    {brief.thresholds.stage_stuck_days > 7 && (
      <button className="jt-stuck-cta" onClick={() => setShowUnstickFlow(true)}>
        Let's work through it
      </button>
    )}
  </div>
)}

{showUnstickFlow && (
  <UnstickFlow
    userId={userId}
    heroStage={heroStage}
    onClose={() => setShowUnstickFlow(false)}
    onWahooCreated={() => {
      setShowUnstickFlow(false)
      // Refresh data so voice dots / stage update
      window.location.reload() // Simple V1. Replace with state refresh in V2.
    }}
  />
)}
```

**Stuck messages (outside component, pure function):**

```javascript
function getStuckMessage(stage, days) {
  if (days <= 7) return "You've been here a while. That's not wrong. The journey has its own pace."
  if (stage <= 3) return "There's a step you haven't taken yet. It's simpler than you think."
  if (stage === 4) return "You've done wahoos but none have hit Vibe Rise yet. Let's figure out what lights you up."
  if (stage === 5) return "You hit Vibe Rise once. What stopped you from going back?"
  if (stage === 6) return "Your courage is growing but the pattern underneath hasn't surfaced. Let's dig."
  if (stage === 7) return "You've seen the root. The next step isn't in the app. What's holding you back from booking?"
  return "There's something you haven't tried yet."
}
```

### Add to `src/components/JourneyTab.css`:

```css
.jt-stuck-section {
  border-left: 3px solid #E9A23B;
}

.jt-stuck-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.jt-stuck-message {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

.jt-stuck-cta {
  margin-top: 12px;
  background: none;
  border: 1px solid #E9A23B;
  color: #E9A23B;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.jt-stuck-cta:active {
  background: rgba(233, 162, 59, 0.06);
}
```

### Create: `src/components/UnstickFlow.jsx`

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './UnstickFlow.css'

/**
 * UnstickFlow — 3-step guided flow to break through stuckness.
 * Follows HealingFlowModal pattern (multi-step, modal overlay).
 * Step 3 auto-creates a wahoo linked to the user's most recent active quest.
 * 
 * Props:
 *  - userId: string
 *  - heroStage: number (for context-aware copy)
 *  - onClose: () => void
 *  - onWahooCreated: () => void (called after step 3 creates the wahoo)
 */
export default function UnstickFlow({ userId, heroStage, onClose, onWahooCreated }) {
  const [step, setStep] = useState(1)
  const [avoiding, setAvoiding] = useState('')
  const [worstCase, setWorstCase] = useState('')
  const [smallestStep, setSmallestStep] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!smallestStep.trim() || saving) return
    setSaving(true)

    try {
      // Find user's most recent active quest to link the wahoo to
      const { data: quests } = await supabase
        .from('quests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      const questId = quests?.[0]?.id || null

      // Create a groan challenge (wahoo) from the smallest step
      const { data: challenge } = await supabase
        .from('groan_challenges')
        .insert({
          user_id: userId,
          title: smallestStep.trim(),
          description: `Unstick flow: Avoiding "${avoiding.trim()}". Fear: "${worstCase.trim()}". Smallest step: "${smallestStep.trim()}"`,
          status: 'active',
          challenge_source: 'unstick_flow',
          wahoo_category: 'connection', // Default category
        })
        .select('id')
        .single()

      // Link to quest if one exists
      if (questId && challenge?.id) {
        await supabase.from('quest_tasks').insert({
          user_id: userId,
          quest_id: questId,
          label: smallestStep.trim(),
          is_courage_challenge: true,
          groan_challenge_id: challenge.id,
        })
      }

      onWahooCreated?.()
    } catch (e) {
      console.error('UnstickFlow error:', e)
      setSaving(false)
    }
  }

  return (
    <div className="uf-overlay" onClick={onClose}>
      <div className="uf-modal" onClick={e => e.stopPropagation()}>
        <button className="uf-close" onClick={onClose}>&times;</button>

        {/* Step dots */}
        <div className="uf-dots">
          {[1, 2, 3].map(n => (
            <span key={n} className={`uf-dot ${step >= n ? 'uf-dot-filled' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <span className="uf-step-icon">🧭</span>
            <h2 className="uf-title">What's the thing you've been avoiding?</h2>
            <p className="uf-subtitle">Not the thing you should do. The thing you keep not doing.</p>
            <textarea
              className="uf-input"
              value={avoiding}
              onChange={e => setAvoiding(e.target.value)}
              placeholder="e.g. sharing my work publicly, having that conversation, going to a class"
              rows={3}
            />
            <button
              className="uf-btn"
              disabled={!avoiding.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <span className="uf-step-icon">😰</span>
            <h2 className="uf-title">If you did that, what's the worst that could happen?</h2>
            <textarea
              className="uf-input"
              value={worstCase}
              onChange={e => setWorstCase(e.target.value)}
              placeholder="e.g. people would judge me, I'd fail, it wouldn't be good enough"
              rows={3}
            />
            {worstCase.trim() && (
              <p className="uf-reframe">That's the voice talking. Not you.</p>
            )}
            <button
              className="uf-btn"
              disabled={!worstCase.trim()}
              onClick={() => setStep(3)}
            >
              Continue
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <span className="uf-step-icon">🌱</span>
            <h2 className="uf-title">What's the smallest version you could do this week?</h2>
            <p className="uf-subtitle">Not the brave version. The version that barely scares you.</p>
            <textarea
              className="uf-input"
              value={smallestStep}
              onChange={e => setSmallestStep(e.target.value)}
              placeholder="e.g. send one message, attend one class, write one paragraph"
              rows={3}
            />
            <button
              className="uf-btn uf-btn-gold"
              disabled={!smallestStep.trim() || saving}
              onClick={handleSubmit}
            >
              {saving ? 'Creating...' : 'Add to Courage Tab'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

### Create: `src/components/UnstickFlow.css`

```css
/* UnstickFlow — 3-step guided modal, .uf- prefix */

.uf-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
}

.uf-modal {
  background: white;
  border-radius: 22px;
  padding: 28px 24px;
  max-width: 420px;
  width: 100%;
  position: relative;
  animation: uf-pop 0.2s ease;
}

@keyframes uf-pop {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.uf-close {
  position: absolute;
  top: 14px;
  right: 16px;
  background: none;
  border: none;
  font-size: 22px;
  color: #9ca3af;
  cursor: pointer;
}

.uf-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-bottom: 20px;
}

.uf-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
}

.uf-dot-filled {
  background: #5e17eb;
}

.uf-step-icon {
  display: block;
  text-align: center;
  font-size: 32px;
  margin-bottom: 12px;
}

.uf-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin: 0 0 8px;
  line-height: 1.4;
}

.uf-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
  margin: 0 0 16px;
}

.uf-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.95rem;
  resize: none;
  box-sizing: border-box;
  font-family: inherit;
}

.uf-input:focus {
  outline: none;
  border-color: #5e17eb;
}

.uf-reframe {
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #9333ea;
  margin: 12px 0 0;
  font-style: italic;
  animation: uf-fade 0.5s ease;
}

@keyframes uf-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.uf-btn {
  margin-top: 16px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background: #5e17eb;
  color: white;
}

.uf-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.uf-btn-gold {
  background: linear-gradient(135deg, #E9A23B, #f5c55a);
  color: #1f2937;
}
```

### Testing
- [ ] Journey tab shows stuck message when `stage_stuck_days > 0` in Brief
- [ ] CTA only appears when stuck > 7 days (gentle message shows before that)
- [ ] Different message per stage (3, 4, 5, 6, 7)
- [ ] Tapping CTA opens UnstickFlow modal
- [ ] Step 1: text input + continue button (disabled when empty)
- [ ] Step 2: text input + "That's the voice talking" appears after typing
- [ ] Step 3: text input + "Add to Courage Tab" creates a `groan_challenges` row
- [ ] Created wahoo links to most recent active quest via `quest_tasks`
- [ ] Modal closes after submit
- [ ] Progress dots fill as steps advance
- [ ] `challenge_source: 'unstick_flow'` distinguishes from regular wahoos

---

## Build Sequence

```
Day 1: Backfill (4A)
  - Create Edge Function
  - Deploy + invoke once
  - Verify hero stage distribution

Day 2-4: Stuck detection + Unstick Flow (4B)
  - Stuck message on Journey tab (uses Brief data)
  - UnstickFlow modal (3-step, creates wahoo)
  - Wire to Journey tab CTA
  - Test each step + wahoo creation
```

---

## What Sprint 4 Does NOT Build (Sprint 5+)

| Item | Why Later |
|---|---|
| Figurine visual design (avatar, animations) | Needs dedicated design session. Sprint 4D uses a text-based prompt, not a visual Figurine. |
| Insight Drops Rare/Legendary | Needs Figurine delivery for Legendary tier |
| Self-Knowledge Skills V2 | Needs 30+ days of Brief data to be meaningful |
| L0-L4 Depth Scale | Separate feature track (existing plan in measurement framework) |
| Session Bridge | Needs dedicated session (no digital infrastructure yet) |
| Flow Statement (Stage 9) | Needs users reaching Stage 8+ first |
| Expanded graduation celebrations (7→8+) | Needs Calendly integration + Flow Statement UI |

---

## Success Metrics

| Metric | How to Measure |
|---|---|
| Backfill accuracy | Hero stage distribution matches expected user progression |
| Proactive triggers fire | Manual: users with Brief data see contradiction/pattern/gap messages |
| Kudos engagement | Any reactions on shared wahoos within 1 week |
| Monthly counter feels alive | Number > 0 and updates as wahoos complete |
| Stuck users engage with Unstick Flow | Any user opens + completes the 3-step flow |
| Unstick Flow creates wahoos | New groan_challenges appear from Unstick Flow submissions |

**North star:** % of life paths trending toward Vibe Rise state.

---

## Testing Checklist

### 4A: Backfill
- [ ] Edge Function returns `{ processed, graduated, errors }`
- [ ] `SELECT current_journey_level, COUNT(*) FROM user_stage_progress GROUP BY 1` shows realistic distribution
- [ ] No user stuck at Stage 0 who has qualifying data

### 4B: Expanded Proactive
- [ ] Contradiction message for "Safe but Pressure" user
- [ ] Day-of-week pattern on correct day
- [ ] Visibility gap after 10+ wahoos
- [ ] Priority order correct (readiness > streak > contradiction > day > gap)
- [ ] Still max 1/day

### 4C: Social V1
- [ ] Community section visible on Journey tab
- [ ] Kudos toggle works (add/remove reaction)
- [ ] Monthly counter shows correct total
- [ ] Empty state renders cleanly

### 4D: Stuck Detection
- [ ] Stuck message appears when Brief shows stage_stuck_days > 0
- [ ] Message differs per stage
- [ ] Unstick Flow opens on CTA tap
- [ ] 3 steps work: text input → continue → text input → continue → text input → submit
- [ ] Step 3 creates a groan_challenge linked to active quest
- [ ] Modal closes after submit

---

*Depends on: Sprint 3 shipped. Brief running 2+ weeks for 4B.*
*Next: Sprint 5 (Figurine visual design, Insight Drops V2, Self-Knowledge Skills, L0-L4 depth)*
