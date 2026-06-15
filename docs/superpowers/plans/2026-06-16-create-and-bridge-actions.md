# Create & Bridge Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Actions" section to the Creator Portal (/create) with two cards (Create + Bridge), add a content capture nudge to the existing StrikeDesignFlow, and build a new Bridge micro-bridge flow.

**Architecture:** Three changes: (1) New "Actions" section in CreatorHomeV2 Identity tab between "Blow Up Brand" and "Your Model" — two tappable cards linking to Create and Bridge flows, (2) Content capture nudge on StrikeDesignFlow's final screen, (3) New BridgeFlow at /create/bridge — 4-screen guided exercise that saves contacts to crm_contacts with `bridge` tag.

**Tech Stack:** React 18, Supabase (crm_contacts table), React Router v7, CSS (dark theme, ch2-/brg- prefixes)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/CreatorHome/CreatorHomeV2.jsx` | Add "Actions" section with Create + Bridge cards |
| Modify | `src/components/CreatorHome/CreatorHomeV2.css` | Styles for Actions section |
| Modify | `src/flows/StrikeDesignFlow.jsx` | Add content capture nudge on QUALITY screen |
| Modify | `src/flows/StrikeDesignFlow.css` | Styles for capture nudge |
| Create | `src/flows/BridgeFlow.jsx` | 4-screen micro-bridge exercise |
| Create | `src/flows/BridgeFlow.css` | Dark theme styles for bridge flow |
| Modify | `src/AppRouter.jsx` | Add /create/bridge route |

No new database tables. Uses existing `crm_contacts` with `tags: ['bridge']`.

---

### Task 1: Actions Section in CreatorHomeV2

**Files:**
- Modify: `src/components/CreatorHome/CreatorHomeV2.jsx` (insert after Readiness card / Blow Up Brand section, before the divider above "Your Model")
- Modify: `src/components/CreatorHome/CreatorHomeV2.css`

- [ ] **Step 1: Add Actions section JSX**

In `CreatorHomeV2.jsx`, find the closing of the readiness card block (the `{blowUpReadiness && (...)}` section) and the `<div className="ch2-id-divider" />` that precedes "Your Model". Insert the Actions section between them. If the readiness card was reverted, insert after the closing of the Blow Up Brand section instead.

Find this pattern (the divider before "Your Model"):
```jsx
              <div className="ch2-id-divider" />

              {/* Your Model */}
```

Insert BEFORE that divider:

```jsx
              {/* ═══ ACTIONS ═══ */}
              <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                <div className="ch2-label">Actions</div>
                <div className="ch2-actions-grid">
                  <div className="ch2-action-card" onClick={() => navigate('/create/plays')}>
                    <div className="ch2-action-icon">⚡</div>
                    <div className="ch2-action-info">
                      <div className="ch2-action-title">Create</div>
                      <div className="ch2-action-sub">Design a Lightning Strike that makes your movement impossible to ignore</div>
                    </div>
                    <div className="ch2-action-arrow">›</div>
                  </div>
                  <div className="ch2-action-card" onClick={() => navigate('/create/bridge')}>
                    <div className="ch2-action-icon">🌉</div>
                    <div className="ch2-action-info">
                      <div className="ch2-action-title">Bridge</div>
                      <div className="ch2-action-sub">Find 5 people slightly ahead of you and build mutual value</div>
                    </div>
                    <div className="ch2-action-arrow">›</div>
                  </div>
                </div>
              </div>

              <div className="ch2-id-divider" />
```

- [ ] **Step 2: Add Actions CSS**

In `CreatorHomeV2.css`, find the `/* ═══ READINESS CARD ═══ */` section (or if it was removed, find the section just before `/* ═══ CREATOR DETAIL MODAL ═══ */`). Add BEFORE the creator detail modal section:

```css
/* ═══ ACTIONS ═══ */
.ch2-actions-grid {
  display: flex; flex-direction: column; gap: 8px;
}
.ch2-action-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ch2-action-card:active { background: rgba(255,255,255,0.07); }
.ch2-action-icon { font-size: 20px; flex-shrink: 0; }
.ch2-action-info { flex: 1; }
.ch2-action-title {
  font-size: 14px; font-weight: 800; color: var(--text-bright);
  letter-spacing: -0.2px;
}
.ch2-action-sub {
  font-size: 11px; color: var(--text-secondary);
  margin-top: 2px; line-height: 1.4;
}
.ch2-action-arrow {
  font-size: 18px; color: rgba(255,255,255,0.2);
  font-weight: 300; flex-shrink: 0;
}
@media (hover: hover) and (pointer: fine) {
  .ch2-action-card:hover { background: rgba(255,255,255,0.06); }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ built in Xs` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CreatorHome/CreatorHomeV2.jsx src/components/CreatorHome/CreatorHomeV2.css
git commit -m "feat: add Actions section (Create + Bridge) to Creator Portal Identity tab"
```

---

### Task 2: Content Capture Nudge in StrikeDesignFlow

**Files:**
- Modify: `src/flows/StrikeDesignFlow.jsx` (QUALITY screen, before the nav buttons)
- Modify: `src/flows/StrikeDesignFlow.css`

- [ ] **Step 1: Add capture nudge state**

In `StrikeDesignFlow.jsx`, find the state declarations (around line 57-70). Add after `const [deadlineDate, setDeadlineDate] = useState('')`:

```jsx
const [captureMethod, setCaptureMethod] = useState('')
```

- [ ] **Step 2: Add capture nudge JSX to QUALITY screen**

In the QUALITY step JSX (find `if (step === STEPS.QUALITY)`), insert AFTER the deadline field `<div className="stk-field">...</div>` and BEFORE `{saveError && ...}`:

```jsx
        {/* Content capture nudge */}
        <div className="stk-capture">
          <div className="stk-capture-label">How will you capture this?</div>
          <div className="stk-capture-hint">Post the moment, not a description of it.</div>
          <div className="stk-capture-options">
            {[
              { id: 'film', label: 'Film it', icon: '🎬' },
              { id: 'livestream', label: 'Go live', icon: '📡' },
              { id: 'photo', label: 'Get photos', icon: '📸' },
              { id: 'screenshot', label: 'Screenshot reactions', icon: '💬' },
            ].map(opt => (
              <button
                key={opt.id}
                className={`stk-capture-btn ${captureMethod === opt.id ? 'stk-capture-selected' : ''}`}
                onClick={() => { hapticLight(); setCaptureMethod(opt.id) }}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>
```

- [ ] **Step 3: Save capture method with the strike**

In the `saveStrike` function (find `const saveStrike = async () => {`), find the `.insert({` call and add `capture_method` to the description field so it persists. Find:

```javascript
description: strikeDescription || null,
```

Replace with:

```javascript
description: [strikeDescription, captureMethod ? `Capture: ${captureMethod}` : ''].filter(Boolean).join('\n') || null,
```

This appends the capture method to the existing description field. No schema change needed.

- [ ] **Step 4: Add capture nudge CSS**

In `src/flows/StrikeDesignFlow.css`, find the end of the file and add:

```css
/* Capture nudge */
.stk-capture {
  margin-top: 1rem; padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.stk-capture-label {
  font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.8);
  margin-bottom: 4px;
}
.stk-capture-hint {
  font-size: 11px; color: rgba(255,255,255,0.4);
  margin-bottom: 10px; font-style: italic;
}
.stk-capture-options {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
}
.stk-capture-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
  font-size: 12px; font-weight: 600; font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.stk-capture-btn:active { background: rgba(255,255,255,0.08); }
.stk-capture-selected {
  background: rgba(233,162,59,0.1);
  border-color: rgba(233,162,59,0.3);
  color: #E9A23B;
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ built in Xs` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/flows/StrikeDesignFlow.jsx src/flows/StrikeDesignFlow.css
git commit -m "feat: add content capture nudge to Lightning Strike quality check"
```

---

### Task 3: BridgeFlow Component

**Files:**
- Create: `src/flows/BridgeFlow.jsx`
- Create: `src/flows/BridgeFlow.css`

- [ ] **Step 1: Create BridgeFlow.css**

Create `src/flows/BridgeFlow.css`:

```css
/* BridgeFlow — /create/bridge */
/* Micro-bridge building exercise */
/* CSS prefix: brg- */

.brg {
  min-height: 100vh;
  background: #0a0a12;
  color: #fff;
  -webkit-font-smoothing: antialiased;
}
.brg-container {
  max-width: 480px; margin: 0 auto;
  padding: 24px 20px calc(40px + env(safe-area-inset-bottom, 0px));
}
.brg-screen { animation: brgFadeIn 0.3s ease; }
@keyframes brgFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.brg-step-label {
  font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: rgba(255,255,255,0.35);
  margin-bottom: 12px;
}
.brg-heading {
  font-size: 22px; font-weight: 900; line-height: 1.2;
  letter-spacing: -0.5px; color: #fff; margin: 0 0 8px;
}
.brg-gold { color: #E9A23B; }
.brg-prompt {
  font-size: 14px; color: rgba(255,255,255,0.5);
  line-height: 1.5; margin: 0 0 20px;
}
.brg-principle {
  padding: 14px 16px; border-radius: 12px;
  background: rgba(94,23,235,0.06);
  border: 1px solid rgba(94,23,235,0.12);
  font-size: 13px; color: rgba(255,255,255,0.6);
  line-height: 1.5; margin-bottom: 20px;
  font-style: italic;
}

/* Person card (add/edit) */
.brg-person-card {
  padding: 16px; border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 10px;
}
.brg-person-num {
  font-size: 10px; font-weight: 800; letter-spacing: 1px;
  text-transform: uppercase; color: #E9A23B; margin-bottom: 8px;
}
.brg-input {
  width: 100%; padding: 10px 12px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #fff; font-size: 14px; font-family: inherit;
  margin-bottom: 8px; outline: none;
}
.brg-input:focus { border-color: rgba(233,162,59,0.4); }
.brg-input::placeholder { color: rgba(255,255,255,0.25); }
.brg-input-small { font-size: 13px; padding: 8px 12px; }
.brg-input-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}

/* Value + ask selectors */
.brg-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.brg-option {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer; font-size: 13px; color: rgba(255,255,255,0.6);
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}
.brg-option:active { background: rgba(255,255,255,0.06); }
.brg-option-selected {
  background: rgba(233,162,59,0.08);
  border-color: rgba(233,162,59,0.25);
  color: #E9A23B;
}
.brg-option-icon { font-size: 16px; flex-shrink: 0; }

/* Summary cards */
.brg-summary-card {
  padding: 14px 16px; border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 8px;
}
.brg-summary-name {
  font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 2px;
}
.brg-summary-platform {
  font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 6px;
}
.brg-summary-row {
  font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 4px;
}
.brg-summary-label {
  font-weight: 700; color: rgba(255,255,255,0.35);
  text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;
}

/* Add more button */
.brg-add-btn {
  width: 100%; padding: 12px; border-radius: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit; margin-bottom: 10px;
}
.brg-add-btn:active { background: rgba(255,255,255,0.05); }

/* Navigation */
.brg-nav {
  display: flex; gap: 10px; margin-top: 24px;
}
.brg-back {
  padding: 14px 20px; border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: inherit;
}
.brg-cta {
  flex: 1; padding: 14px; border-radius: 12px;
  background: linear-gradient(135deg, #5e17eb, #7c3aed);
  border: none; color: #fff; font-size: 15px; font-weight: 800;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 4px 16px rgba(94,23,235,0.3);
}
.brg-cta:disabled { opacity: 0.4; cursor: not-allowed; }
.brg-cta:active:not(:disabled) { transform: scale(0.98); }
.brg-error {
  padding: 10px; border-radius: 8px; margin-top: 10px;
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
  color: #ef4444; font-size: 13px; text-align: center;
}
.brg-center {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 60vh; gap: 12px;
}
.brg-spinner {
  width: 28px; height: 28px;
  border: 3px solid rgba(255,255,255,0.06);
  border-top-color: #5e17eb;
  border-radius: 50%;
  animation: brgSpin 0.8s linear infinite;
}
@keyframes brgSpin { to { transform: rotate(360deg); } }
```

- [ ] **Step 2: Create BridgeFlow.jsx**

Create `src/flows/BridgeFlow.jsx`:

```jsx
/**
 * BridgeFlow.jsx — /create/bridge
 * Micro-bridge building exercise.
 * Guides creators to identify 5 people slightly ahead,
 * define value to offer, and plan outreach.
 * Saves to crm_contacts with tags: ['bridge'].
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess, hapticError } from '../lib/haptics'
import './BridgeFlow.css'

const STEPS = {
  INTRO: 'intro',
  ADD_PEOPLE: 'add_people',
  VALUE_AND_ASK: 'value_and_ask',
  SUMMARY: 'summary',
}

const VALUE_OPTIONS = [
  { id: 'share_content', label: 'Share their content with my audience', icon: '📣' },
  { id: 'guest_case_study', label: 'Offer to be a guest or case study', icon: '🎤' },
  { id: 'co_host', label: 'Co-host a free session together', icon: '🤝' },
  { id: 'write_about', label: 'Write about their method and tag them', icon: '✍️' },
  { id: 'attend_event', label: 'Attend their event and give a testimonial', icon: '⭐' },
]

const ASK_OPTIONS = [
  { id: 'podcast_guest', label: 'Go on their podcast', icon: '🎙️' },
  { id: 'co_host_event', label: 'Co-host an event', icon: '🎪' },
  { id: 'endorsement', label: 'Get a quote or endorsement', icon: '💬' },
  { id: 'cross_promote', label: 'Cross-promote to each other\'s audiences', icon: '🔄' },
  { id: 'intro', label: 'Get introduced to someone in their network', icon: '🌐' },
]

const EMPTY_PERSON = { name: '', platform: '', what_they_do: '', value: '', ask: '' }

export default function BridgeFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)
  const [people, setPeople] = useState([{ ...EMPTY_PERSON }])
  const [editingIndex, setEditingIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [remarkableAngle, setRemarkableAngle] = useState(null)

  const setStep = (next) => {
    setStepRaw(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Load remarkable angle for context
  useEffect(() => {
    if (!user) return
    supabase
      .from('remarkable_angles')
      .select('ai_rule_statement, combination_insight, extreme_action_plan')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setRemarkableAngle(data) })
  }, [user])

  const updatePerson = (index, field, value) => {
    setPeople(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const addPerson = () => {
    if (people.length < 10) {
      setPeople(prev => [...prev, { ...EMPTY_PERSON }])
      setEditingIndex(people.length)
    }
  }

  const removePerson = (index) => {
    if (people.length <= 1) return
    setPeople(prev => prev.filter((_, i) => i !== index))
    setEditingIndex(Math.min(editingIndex, people.length - 2))
  }

  const validPeople = people.filter(p => p.name.trim())

  const saveBridges = async () => {
    if (!user || saving || validPeople.length === 0) return
    setSaving(true)
    setError(null)

    try {
      const rows = validPeople.map(p => ({
        user_id: user.id,
        name: p.name.trim(),
        social_handle: p.platform.trim() || null,
        notes: [
          p.what_they_do ? `Does: ${p.what_they_do}` : '',
          p.value ? `Value I can offer: ${VALUE_OPTIONS.find(v => v.id === p.value)?.label || p.value}` : '',
          p.ask ? `My ask: ${ASK_OPTIONS.find(a => a.id === p.ask)?.label || p.ask}` : '',
        ].filter(Boolean).join('\n'),
        tags: ['bridge'],
        lifecycle_stage: 'lead',
        source: 'Warm Outreach',
        outreach_status: 'to_contact',
        outreach_status_entered_at: new Date().toISOString(),
        temperature: 'warm',
      }))

      const { error: insertError } = await supabase.from('crm_contacts').insert(rows)
      if (insertError) throw insertError

      hapticSuccess()
      setStep(STEPS.SUMMARY)
    } catch (err) {
      console.error('Bridge save error:', err)
      setError('Failed to save. Please try again.')
      hapticError()
    } finally {
      setSaving(false)
    }
  }

  // ── SCREEN 1: INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="brg">
        <div className="brg-container brg-screen">
          <div className="brg-step-label">Bridge Building</div>
          <h2 className="brg-heading">Find your 5 <span className="brg-gold">micro-bridges</span></h2>
          <p className="brg-prompt">
            Every creator who blew up had a bridge. But you don't wait for Oprah. You build lateral:
            people slightly ahead, not above. Cross-pollinate, don't pitch.
          </p>

          <div className="brg-principle">
            The bridge's incentive is always self-serving: you fill a gap they can't fill alone.
            Lead with value. The ask comes after.
          </div>

          {remarkableAngle?.ai_rule_statement && (
            <div className="brg-principle" style={{ borderColor: 'rgba(233,162,59,0.15)', background: 'rgba(233,162,59,0.04)' }}>
              Your angle: "{remarkableAngle.ai_rule_statement}"
            </div>
          )}

          <button className="brg-cta" onClick={() => { hapticLight(); setStep(STEPS.ADD_PEOPLE) }}>
            Find my bridges
          </button>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: ADD PEOPLE ──
  if (step === STEPS.ADD_PEOPLE) {
    const current = people[editingIndex] || people[0]

    return (
      <div className="brg">
        <div className="brg-container brg-screen">
          <div className="brg-step-label">Step 1 of 2</div>
          <h2 className="brg-heading">Who's <span className="brg-gold">slightly ahead</span>?</h2>
          <p className="brg-prompt">
            Think of people doing adjacent work. Not competitors. People whose audience would also resonate with your method.
          </p>

          {people.map((person, i) => (
            <div key={i} className="brg-person-card" style={i !== editingIndex ? { opacity: 0.5, cursor: 'pointer' } : {}}
              onClick={() => setEditingIndex(i)}
            >
              <div className="brg-person-num">
                Person {i + 1}
                {people.length > 1 && i === editingIndex && (
                  <span style={{ float: 'right', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}
                    onClick={(e) => { e.stopPropagation(); removePerson(i) }}
                  >✕</span>
                )}
              </div>
              {i === editingIndex ? (
                <>
                  <input
                    className="brg-input"
                    placeholder="Name"
                    value={person.name}
                    onChange={e => updatePerson(i, 'name', e.target.value)}
                    autoFocus
                  />
                  <input
                    className="brg-input brg-input-small"
                    placeholder="Where are they active? (Instagram, YouTube, podcast...)"
                    value={person.platform}
                    onChange={e => updatePerson(i, 'platform', e.target.value)}
                  />
                  <input
                    className="brg-input brg-input-small"
                    placeholder="What do they do? (one line)"
                    value={person.what_they_do}
                    onChange={e => updatePerson(i, 'what_they_do', e.target.value)}
                  />
                </>
              ) : (
                <div style={{ fontSize: 13, color: person.name ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                  {person.name || 'Tap to edit'}
                  {person.platform && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {person.platform}</span>}
                </div>
              )}
            </div>
          ))}

          {people.length < 10 && (
            <button className="brg-add-btn" onClick={() => { hapticLight(); addPerson() }}>
              + Add another person
            </button>
          )}

          <div className="brg-nav">
            <button className="brg-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="brg-cta"
              disabled={validPeople.length === 0}
              onClick={() => { hapticLight(); setEditingIndex(0); setStep(STEPS.VALUE_AND_ASK) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: VALUE & ASK ──
  if (step === STEPS.VALUE_AND_ASK) {
    const current = validPeople[editingIndex] || validPeople[0]
    const currentGlobalIndex = people.indexOf(current)
    const isLast = editingIndex >= validPeople.length - 1

    return (
      <div className="brg">
        <div className="brg-container brg-screen">
          <div className="brg-step-label">Step 2 of 2 · {current.name}</div>
          <h2 className="brg-heading">Value <span className="brg-gold">first</span></h2>
          <p className="brg-prompt">
            What could you offer {current.name} that costs you nothing but helps them?
          </p>

          <div className="brg-options">
            {VALUE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`brg-option ${current.value === opt.id ? 'brg-option-selected' : ''}`}
                onClick={() => { hapticLight(); updatePerson(currentGlobalIndex, 'value', opt.id) }}
              >
                <span className="brg-option-icon">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <p className="brg-prompt" style={{ marginTop: 16 }}>
            If {current.name} said yes to everything, what's the ONE thing that would help you most?
          </p>

          <div className="brg-options">
            {ASK_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`brg-option ${current.ask === opt.id ? 'brg-option-selected' : ''}`}
                onClick={() => { hapticLight(); updatePerson(currentGlobalIndex, 'ask', opt.id) }}
              >
                <span className="brg-option-icon">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {error && <div className="brg-error">{error}</div>}

          <div className="brg-nav">
            <button className="brg-back" onClick={() => {
              if (editingIndex > 0) setEditingIndex(editingIndex - 1)
              else setStep(STEPS.ADD_PEOPLE)
            }}>Back</button>
            <button
              className="brg-cta"
              disabled={!current.value || !current.ask || (isLast && saving)}
              onClick={() => {
                hapticLight()
                if (isLast) {
                  saveBridges()
                } else {
                  setEditingIndex(editingIndex + 1)
                }
              }}
            >
              {isLast ? (saving ? 'Saving...' : 'Save bridges') : `Next: ${validPeople[editingIndex + 1]?.name || 'Next'}`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: SUMMARY ──
  if (step === STEPS.SUMMARY) {
    return (
      <div className="brg">
        <div className="brg-container brg-screen">
          <div className="brg-step-label">Your Bridges</div>
          <h2 className="brg-heading">{validPeople.length} bridge{validPeople.length !== 1 ? 's' : ''} <span className="brg-gold">saved</span></h2>
          <p className="brg-prompt">
            These people are now in your contacts. Lead with value this week. The ask comes after the relationship.
          </p>

          {validPeople.map((person, i) => (
            <div key={i} className="brg-summary-card">
              <div className="brg-summary-name">{person.name}</div>
              {person.platform && <div className="brg-summary-platform">{person.platform}</div>}
              {person.value && (
                <div className="brg-summary-row">
                  <div className="brg-summary-label">Value to offer</div>
                  {VALUE_OPTIONS.find(v => v.id === person.value)?.label}
                </div>
              )}
              {person.ask && (
                <div className="brg-summary-row">
                  <div className="brg-summary-label">The ask</div>
                  {ASK_OPTIONS.find(a => a.id === person.ask)?.label}
                </div>
              )}
            </div>
          ))}

          <button
            className="brg-cta"
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => navigate('/create')}
          >
            Back to Creator Portal
          </button>
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: Will fail because BridgeFlow is not yet imported in AppRouter. That's expected — Task 4 wires it up.

- [ ] **Step 4: Commit**

```bash
git add src/flows/BridgeFlow.jsx src/flows/BridgeFlow.css
git commit -m "feat: add BridgeFlow — micro-bridge building exercise"
```

---

### Task 4: Wire BridgeFlow Route

**Files:**
- Modify: `src/AppRouter.jsx`

- [ ] **Step 1: Add import**

In `AppRouter.jsx`, find the lazy import section (around line 272 where `StrikeDesignFlow` is imported). Add nearby:

```jsx
const BridgeFlow = lazyRetry(() => import('./flows/BridgeFlow'))
```

- [ ] **Step 2: Add route**

Find the `/create/plays` route (around line 1015-1020). Add AFTER it:

```jsx
            <Route path="/create/bridge" element={
              <CreateGate>
                <AuthGate>
                  <BridgeFlow />
                </AuthGate>
              </CreateGate>
            } />
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ built in Xs` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/AppRouter.jsx
git commit -m "feat: wire /create/bridge route"
```

---

### Task 5: Verify End-to-End

- [ ] **Step 1: Verify build passes**

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ built in Xs` with no errors.

- [ ] **Step 2: Manual test checklist**

Test on device or localhost:

1. Navigate to `/create` → Identity tab → Playbook. Confirm "Actions" section appears between "Blow Up Brand" and "Your Model" with Create and Bridge cards.
2. Tap "Create" card → should navigate to `/create/plays` (StrikeDesignFlow).
3. In StrikeDesignFlow, reach Step 5 (Quality). Confirm "How will you capture this?" section appears below the deadline field with 4 options (Film it, Go live, Get photos, Screenshot reactions).
4. Select a capture method and save the strike. Verify it saves without errors.
5. Go back to `/create` → tap "Bridge" card → should navigate to `/create/bridge`.
6. BridgeFlow intro screen should show with principle text and "Find my bridges" CTA.
7. Add 2-3 people with name, platform, what they do.
8. For each person, select a value option and an ask option.
9. Save bridges. Confirm summary screen shows all people.
10. Navigate to CRM contacts (`/crm/contacts` or wherever contacts live). Confirm the bridge contacts appear with tag "bridge", source "Warm Outreach", outreach_status "to_contact".
11. Tap "Back to Creator Portal" on summary → should return to `/create`.

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: end-to-end verification fixes for Create + Bridge actions"
```
