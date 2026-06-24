# Priority Tab Completions + Business Page + Mobile Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inline completion for Play-list/DNA challenges in Priority tab, restyle /business page to v2 mockup with collapsible rows, add recommendation sorting, and add mobile guided picker for Play-list tab.

**Architecture:** 5 independent features built sequentially. Feature 1 creates a standalone `GroanCompletionModal` reusable across Priority tab and potentially mobile picker. Feature 3 keeps QuestCard for non-flow quests (they need specialized input components) but wraps them in a collapsible v2-style row header. Feature 5 adds `MobilePlaylistPicker` that does its own edge function calls + DB saves (can't reuse `handleGenerateChallenge` from Challenge.jsx since it doesn't return DB record IDs).

**Tech Stack:** React 18, Supabase, existing groan/DNA services, CSS media queries.

**Key code references:**
- Groan completion flow: `src/Challenge.jsx:1248-1351`
- `completeGroanChallenge()`: `src/lib/crm/groanChallengeService.js:171-197`
- `createGroanChallenge()`: `src/lib/crm/groanChallengeService.js:99-144` (returns `{ data, error }` where data has `id`)
- `handleGenerateChallenge()`: `src/Challenge.jsx:991-1077` (calls edge function + saves internally, returns edge function data WITHOUT db id)
- `ChallengeRating` onRate callback shape: `{ voice_type, voice_reflection, internal_state, external_state, compass_direction }` (from `src/components/PlayProfile/ChallengeRating.jsx:134-140`)
- Business quest input types: flow(38), text(13), milestone(5), progress_dropdown(5), dropdown(4), offer_checklist(4), grand_slam_dropdown(3), response_counter(2), conversation_log(2), validation_responses(2), + 4 more

---

### Task 1: Create GroanCompletionModal Component

**Files:**
- Create: `src/components/GroanCompletionModal.jsx`
- Create: `src/components/GroanCompletionModal.css`

**Step 1: Create the modal component**

3-step modal: reflection (scary/wahoo + 3% + text) -> voices (essence/protective) -> compass (N/E/S/W). Self-contained DB writes. Handles already-completed challenges gracefully.

```jsx
// src/components/GroanCompletionModal.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { completeGroanChallenge } from '../lib/crm/groanChallengeService'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
import CompassCheckin from './CompassCheckin'
import confetti from 'canvas-confetti'
import './GroanCompletionModal.css'

const PLAY_LIST_POINTS = 7

export default function GroanCompletionModal({ challenge, userId, onComplete, onClose }) {
  const [step, setStep] = useState('reflection') // 'reflection' | 'voices' | 'compass'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Reflection state
  const [scaryScore, setScaryScore] = useState(5)
  const [wahooScore, setWahooScore] = useState(5)
  const [didThreePercent, setDidThreePercent] = useState(null)
  const [reflection, setReflection] = useState('')

  // Voices state
  const [essenceShowedUp, setEssenceShowedUp] = useState(null)
  const [essenceHow, setEssenceHow] = useState('')
  const [protectiveShowedUp, setProtectiveShowedUp] = useState(null)
  const [protectiveHow, setProtectiveHow] = useState('')

  // Guard: if challenge is already completed, show message
  if (challenge?.status === 'completed') {
    return (
      <div className="gcm-overlay" onClick={onClose}>
        <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="gcm-close" onClick={onClose}>&times;</button>
          <h2 className="gcm-title">Already Completed</h2>
          <p className="gcm-subtitle">This challenge has already been completed.</p>
          <button className="gcm-gold-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const handleCompleteReflection = async () => {
    setSaving(true)
    setError(null)
    try {
      // 1. Mark groan challenge as completed
      let reflectionText = reflection
      if (didThreePercent !== null) {
        reflectionText += `${reflectionText ? '\n' : ''}3% improvement: ${didThreePercent ? 'Yes' : 'No'}`
      }
      const { error: groanError } = await completeGroanChallenge(challenge.id, {
        reflectionText,
        scaryScoreAfter: scaryScore,
        wahooScoreAfter: wahooScore,
      })
      if (groanError) throw groanError

      // 2. Insert quest_completions record
      const questId = `play_list_challenge_${challenge.id}`
      const { error: questError } = await supabase.from('quest_completions').insert({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: questId,
        quest_category: 'Groans',
        quest_type: 'Rewire',
        points_earned: PLAY_LIST_POINTS,
        challenge_day: 0,
        project_id: null,
        reflection_text: JSON.stringify({
          challenge_id: challenge.id,
          source_label: challenge.source_label,
          visibility_layer: challenge.visibility_layer,
          scary_score: scaryScore,
          wahoo_score: wahooScore,
          reflection,
        }),
      })
      if (questError) console.warn('Quest completion insert error:', questError)

      // 3. Update scores
      try {
        await supabase.rpc('increment_scores', {
          p_user_id: userId,
          p_project_id: null,
          p_category: getScoringCategory('Groans'),
          p_points: PLAY_LIST_POINTS,
          p_week_start: getWeekStartLocal(),
        })
      } catch (e) {
        console.warn('Score increment error:', e)
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      setStep('voices')
    } catch (err) {
      console.error('Error completing challenge:', err)
      setError('Failed to complete challenge. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleVoicesContinue = async () => {
    const voiceEntries = []
    if (essenceShowedUp !== null) {
      voiceEntries.push({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: 'playlist_essence_voice',
        quest_category: 'Voices',
        quest_type: 'recognise',
        points_earned: 3,
        challenge_day: 0,
        project_id: null,
        reflection_text: JSON.stringify({
          showed_up: essenceShowedUp,
          how: essenceHow || null,
          from_challenge: challenge.id,
        }),
      })
    }
    if (protectiveShowedUp !== null) {
      voiceEntries.push({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: 'playlist_protective_voice',
        quest_category: 'Voices',
        quest_type: 'recognise',
        points_earned: 3,
        challenge_day: 0,
        project_id: null,
        reflection_text: JSON.stringify({
          showed_up: protectiveShowedUp,
          how: protectiveHow || null,
          from_challenge: challenge.id,
        }),
      })
    }
    if (voiceEntries.length > 0) {
      const { error } = await supabase.from('quest_completions').insert(voiceEntries)
      if (error) console.warn('Error saving voice data:', error)
    }
    setStep('compass')
  }

  const handleCompassComplete = async (compassData) => {
    try {
      await supabase.from('flow_entries').insert({
        user_id: userId,
        direction: compassData.direction,
        internal_state: compassData.internalState,
        external_state: compassData.externalState,
        note: compassData.note || null,
        project_id: null,
      })
    } catch (err) {
      console.warn('Error saving compass:', err)
    }
    onComplete?.()
    onClose()
  }

  const threePercentMatch = challenge?.description?.match(/3% improvement:\s*(.+?)(?:\n|$)/)
  const threePercentText = threePercentMatch?.[1]?.trim()
  const hasThreePercent = challenge?.description?.includes('3% improvement:')

  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={onClose}>&times;</button>

        {step === 'reflection' && (
          <>
            <h2 className="gcm-title">I Did It!</h2>
            <p className="gcm-subtitle">{challenge.title || challenge.source_label}</p>

            <div className="gcm-form">
              <div className="gcm-slider-group">
                <label>How scary was it? <span className="gcm-score">{scaryScore}/10</span></label>
                <input type="range" min="1" max="10" value={scaryScore}
                  onChange={(e) => setScaryScore(parseInt(e.target.value))} />
              </div>

              <div className="gcm-slider-group">
                <label>How exciting was it? <span className="gcm-score">{wahooScore}/10</span></label>
                <input type="range" min="1" max="10" value={wahooScore}
                  onChange={(e) => setWahooScore(parseInt(e.target.value))} />
              </div>

              {hasThreePercent && (
                <div className="gcm-three-percent">
                  <label>Did you implement your 3% improvement?</label>
                  {threePercentText && <div className="gcm-quote">"{threePercentText}"</div>}
                  <div className="gcm-toggle-row">
                    <button className={`gcm-toggle ${didThreePercent === true ? 'active yes' : ''}`}
                      onClick={() => setDidThreePercent(true)}>Yes</button>
                    <button className={`gcm-toggle ${didThreePercent === false ? 'active no' : ''}`}
                      onClick={() => setDidThreePercent(false)}>No</button>
                  </div>
                </div>
              )}

              <div className="gcm-textarea-group">
                <label>Quick reflection (optional)</label>
                <textarea placeholder="What did you learn? How do you feel?"
                  value={reflection} onChange={(e) => setReflection(e.target.value)} rows={3} />
              </div>
            </div>

            {error && <p className="gcm-error">{error}</p>}

            <button className="gcm-gold-btn" onClick={handleCompleteReflection} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Challenge'}
            </button>
          </>
        )}

        {step === 'voices' && (
          <>
            <h2 className="gcm-title">Voice Check-in</h2>

            <div className="gcm-form">
              <div className="gcm-voice-group">
                <label>Did your Essence voice show up?</label>
                <div className="gcm-toggle-row">
                  <button className={`gcm-toggle ${essenceShowedUp === true ? 'active yes' : ''}`}
                    onClick={() => setEssenceShowedUp(true)}>Yes</button>
                  <button className={`gcm-toggle ${essenceShowedUp === false ? 'active no' : ''}`}
                    onClick={() => { setEssenceShowedUp(false); setEssenceHow('') }}>No</button>
                </div>
                {essenceShowedUp && (
                  <textarea placeholder="How did your Essence show up?"
                    value={essenceHow} onChange={(e) => setEssenceHow(e.target.value)} rows={2} />
                )}
              </div>

              <div className="gcm-voice-group">
                <label>Did your Protective voice show up?</label>
                <div className="gcm-toggle-row">
                  <button className={`gcm-toggle ${protectiveShowedUp === true ? 'active yes' : ''}`}
                    onClick={() => setProtectiveShowedUp(true)}>Yes</button>
                  <button className={`gcm-toggle ${protectiveShowedUp === false ? 'active no' : ''}`}
                    onClick={() => { setProtectiveShowedUp(false); setProtectiveHow('') }}>No</button>
                </div>
                {protectiveShowedUp && (
                  <textarea placeholder="How did your Protective voice try to hold you back?"
                    value={protectiveHow} onChange={(e) => setProtectiveHow(e.target.value)} rows={2} />
                )}
              </div>
            </div>

            <button className="gcm-gold-btn" onClick={handleVoicesContinue}>Continue</button>
            <button className="gcm-skip-btn" onClick={() => setStep('compass')}>Skip</button>
          </>
        )}

        {step === 'compass' && (
          <CompassCheckin
            onComplete={handleCompassComplete}
            onSkip={() => { onComplete?.(); onClose() }}
            challengeTitle={challenge.title || challenge.source_label}
          />
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create the modal CSS**

```css
/* src/components/GroanCompletionModal.css — scoped under .gcm- prefix */

.gcm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}

.gcm-modal {
  background: white; border-radius: 22px;
  max-width: 420px; width: 100%;
  max-height: 90vh; overflow-y: auto;
  padding: 24px; position: relative;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
}

.gcm-close {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none;
  font-size: 24px; color: #9a9daa; cursor: pointer;
}

.gcm-title { font-size: 22px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px; }
.gcm-subtitle { font-size: 14px; color: #9a9daa; margin-bottom: 20px; }

.gcm-form { display: flex; flex-direction: column; gap: 18px; margin-bottom: 20px; }

.gcm-slider-group label,
.gcm-three-percent label,
.gcm-textarea-group label,
.gcm-voice-group label {
  font-size: 14px; font-weight: 600; color: #1a1a2e;
  display: block; margin-bottom: 6px;
}

.gcm-score { color: #E9A23B; font-weight: 700; }

.gcm-slider-group input[type="range"] { width: 100%; accent-color: #5e17eb; }

.gcm-quote { font-size: 13px; color: #6c757d; font-style: italic; margin-bottom: 8px; }

.gcm-toggle-row { display: flex; gap: 8px; }

.gcm-toggle {
  flex: 1; padding: 10px;
  border: 2px solid #eef0f3; border-radius: 12px;
  font-size: 14px; font-weight: 600;
  background: #f8f8fa; color: #1a1a2e;
  cursor: pointer; transition: all 0.15s;
}

.gcm-toggle.active.yes { background: #d1fae5; border-color: #34d399; color: #059669; }
.gcm-toggle.active.no { background: #fce7f3; border-color: #f472b6; color: #db2777; }

.gcm-form textarea {
  width: 100%; padding: 12px;
  border: 2px solid #eef0f3; border-radius: 14px;
  font-size: 14px; background: #f8f8fa;
  resize: none; box-sizing: border-box;
}

.gcm-form textarea:focus { outline: none; border-color: #5e17eb; background: white; }

.gcm-gold-btn {
  display: block; width: 100%;
  background: linear-gradient(135deg, #E9A23B 0%, #f0b94e 60%, #e6c45a 100%);
  color: #1a1a2e; border: none;
  padding: 16px; border-radius: 14px;
  font-size: 16px; font-weight: 800;
  cursor: pointer; text-align: center;
  box-shadow: 0 4px 18px rgba(233,162,59,0.28);
}

.gcm-gold-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.gcm-skip-btn {
  display: block; width: 100%;
  background: none; border: none;
  color: #9a9daa; font-size: 13px;
  font-weight: 600; cursor: pointer;
  padding: 12px; text-align: center;
}

.gcm-voice-group { display: flex; flex-direction: column; gap: 8px; }

.gcm-error { color: #ef4444; font-size: 14px; text-align: center; margin-bottom: 12px; }
```

**Step 3: Build**

Run: `npm run build 2>&1 | tail -5`
Expected: Succeeds (not imported yet).

**Step 4: Commit**

```bash
git add src/components/GroanCompletionModal.jsx src/components/GroanCompletionModal.css
git commit -m "feat: add standalone GroanCompletionModal component"
```

---

### Task 2: Wire GroanCompletionModal into PriorityTab + Display Name Fix

**Files:**
- Modify: `src/components/PriorityTab.jsx`

**Step 1: Add imports and state**

Add at top:
```jsx
import { useState } from 'react' // ensure useState is imported (already has useMemo)
import { supabase } from '../lib/supabaseClient'
import GroanCompletionModal from './GroanCompletionModal'
```

Add inside component:
```jsx
const [completingChallenge, setCompletingChallenge] = useState(null)
const [loadingChallengeId, setLoadingChallengeId] = useState(null)
```

**Step 2: Replace Play-list rows with Complete button + display name parsing**

Replace lines ~199-212 (the `selectedGroanPicks.map` block). Parse display name from `Skill x LAYER -- Day` to `LAYER: Skill -- Day`:

```jsx
{selectedGroanPicks.map(pick => {
  const formatName = (name) => {
    if (!name) return name
    // Match "Skill x LAYER -- Day" or "Skill x LAYER — Day"
    const match = name.match(/^(.+?)\s*[x\u00d7]\s*(\w+)\s*[—\u2014-]+\s*(.+)$/)
    if (match) return `${match[2].toUpperCase()}: ${match[1].trim()} — ${match[3].trim()}`
    return name
  }
  const isLoading = loadingChallengeId === pick.reference_id

  return (
    <div key={pick.id || pick.reference_id} className="pt-item-row">
      <span className="pt-item-check"></span>
      <div className="pt-item-body">
        <div className="pt-item-name">{formatName(pick.display_name)}</div>
        <div className="pt-item-meta">Play-list Challenge</div>
      </div>
      <button
        className="pt-item-action"
        disabled={isLoading}
        onClick={async () => {
          setLoadingChallengeId(pick.reference_id)
          const { data } = await supabase
            .from('groan_challenges')
            .select('*')
            .eq('id', pick.reference_id)
            .single()
          setLoadingChallengeId(null)
          if (data) setCompletingChallenge(data)
        }}
      >
        {isLoading ? '...' : 'Complete'}
      </button>
    </div>
  )
})}
```

**Step 3: Add modal render before closing `</div>` of each return block**

The component has 4 return paths (loading, assessment, picker, quest_list). Add the modal only to the quest_list return, right before the final `</div>`:

```jsx
{completingChallenge && (
  <GroanCompletionModal
    challenge={completingChallenge}
    userId={userId}
    onComplete={() => {
      setCompletingChallenge(null)
      refreshData()
    }}
    onClose={() => setCompletingChallenge(null)}
  />
)}
```

**Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -5`

**Step 5: Commit**

```bash
git add src/components/PriorityTab.jsx
git commit -m "feat: wire GroanCompletionModal into Priority tab play-list rows with LAYER: name format"
```

---

### Task 3: Play Profile Inline Completion

**Files:**
- Modify: `src/components/PriorityTab.jsx`

**Step 1: Add imports**

```jsx
import ChallengeRating from './PlayProfile/ChallengeRating'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
```

Add state:
```jsx
const [showDnaRating, setShowDnaRating] = useState(false)
```

**Step 2: Replace Play Profile section**

The `ChallengeRating` component's `onRate` callback receives: `{ voice_type, voice_reflection, internal_state, external_state, compass_direction }`. These map directly to `founder_dna_sessions` columns.

Replace the Play Profile section (lines ~217-250):

```jsx
{selectedDnaPick && (
  <div className={`pt-section-card ${recommendations.includes('play_profile') ? 'recommended' : ''}`}>
    <div className="pt-section-header">
      <div className="pt-section-header-left">
        <span className="pt-section-icon">🧬</span>
        <span className="pt-section-title">Play Profile</span>
      </div>
      <span className="pt-section-count">0/1</span>
    </div>
    <div className="pt-section-items">
      {!showDnaRating ? (
        <div className="pt-item-row">
          <span className="pt-item-check"></span>
          <div className="pt-item-body">
            <div className="pt-item-name">{selectedDnaPick.display_name}</div>
            <div className="pt-item-meta">DNA Challenge</div>
          </div>
          <button className="pt-item-action" onClick={() => setShowDnaRating(true)}>
            Complete
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px 18px' }}>
          <ChallengeRating
            founderName={dnaResult?.matched_founder || 'your founder'}
            challengeAction={activeDnaSession?.challenge_name}
            onRate={async (ratingData) => {
              // ratingData = { voice_type, voice_reflection, internal_state, external_state, compass_direction }
              if (activeDnaSession?.id) {
                const { error } = await supabase
                  .from('founder_dna_sessions')
                  .update({
                    status: 'completed',
                    voice_type: ratingData.voice_type,
                    voice_reflection: ratingData.voice_reflection,
                    compass_internal: ratingData.internal_state,
                    compass_external: ratingData.external_state,
                    compass_direction: ratingData.compass_direction,
                    completed_at: new Date().toISOString(),
                  })
                  .eq('id', activeDnaSession.id)
                if (error) console.warn('Error saving DNA rating:', error)
              }

              // Insert quest_completions for 10 XP
              await supabase.from('quest_completions').insert({
                user_id: userId,
                challenge_instance_id: null,
                quest_id: `play_profile_challenge_${activeDnaSession?.id || 'unknown'}`,
                quest_category: 'Groans',
                quest_type: 'play_profile',
                points_earned: 10,
                challenge_day: 0,
                project_id: null,
                reflection_text: JSON.stringify(ratingData),
              })

              try {
                await supabase.rpc('increment_scores', {
                  p_user_id: userId,
                  p_project_id: null,
                  p_category: getScoringCategory('Groans'),
                  p_points: 10,
                  p_week_start: getWeekStartLocal(),
                })
              } catch (e) { console.warn('Score error:', e) }

              setShowDnaRating(false)
              refreshDnaSession()
            }}
            onBack={() => setShowDnaRating(false)}
          />
        </div>
      )}
    </div>
  </div>
)}
```

**Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/PriorityTab.jsx
git commit -m "feat: add inline Play Profile completion with ChallengeRating"
```

---

### Task 4: Business Page Restyle

**Files:**
- Modify: `src/pages/BusinessPage.jsx` (lines ~478-508)
- Modify: `src/pages/BusinessPage.css`

**Approach:** Keep QuestCard for non-flow quests that need specialized inputs (text, milestone, dropdown, conversation_log, etc. — 13+ input types). Replace the flat list rendering with a v2-style row header per quest. When collapsed, show icon + name + type/paid + Start/Done button. When expanded (for non-flow quests), show the full QuestCard content below the row header. Flow quests just navigate on "Start" click.

**Step 1: Restyle the quest list rendering in BusinessPage.jsx**

Replace lines ~478-508:

```jsx
{activeStageTab !== 0.9 && stageQuests.length > 0 && (
  <div className="card bp-quest-list">
    <div className="quest-title">Stage {activeStageTab} Quests</div>
    {stageQuests.map(quest => {
      const completed = isQuestCompleted(quest.id)
      const isFlow = quest.inputType === 'flow'
      const paidQuest = isPaidQuest(quest)
      const paidLocked = paidQuest && !hasSubscription
      const isExpanded = expandedLearnMore[quest.id]

      return (
        <div key={quest.id} className={`q-row-wrap ${completed ? 'done' : ''}`}>
          {/* Row header — always visible */}
          <div className="q-row">
            <div className={`q-icon ${completed ? 'done' : 'todo'}`}>
              {completed ? '✅' : quest.isExplainer ? '📝' : '🎯'}
            </div>
            <div
              className="q-info"
              onClick={() => !isFlow && !completed && toggleLearnMore(quest.id)}
              style={{ cursor: (!isFlow && !completed) ? 'pointer' : 'default' }}
            >
              <div className="q-name">{quest.name}</div>
              <div className="q-sub">
                {quest.isExplainer ? 'Explainer' : quest.type || 'Quest'}
                {' \u00B7 '}
                {paidLocked ? 'Paid' : paidQuest ? 'Included' : 'Free'}
              </div>
            </div>
            {completed ? (
              <span className="q-btn done-btn">Done</span>
            ) : isFlow ? (
              <a
                href={selectedProject?.id
                  ? `${quest.flow_route}?projectId=${selectedProject.id}&returnTo=/business`
                  : `${quest.flow_route}?returnTo=/business`}
                className="q-btn start-btn"
              >
                Start
              </a>
            ) : (
              <button
                className="q-btn start-btn"
                onClick={() => toggleLearnMore(quest.id)}
              >
                {isExpanded ? 'Close' : 'Start'}
              </button>
            )}
          </div>

          {/* Expanded: show full QuestCard for inline input quests */}
          {isExpanded && !completed && !isFlow && (
            <div className="q-expanded">
              <QuestCard
                quest={quest}
                completed={false}
                isCompleting={completingQuestId === quest.id}
                questInput={questInputs[quest.id]}
                onInputChange={handleInputChange}
                onComplete={handleQuestComplete}
                expandedLearnMore={{ [quest.id]: true }}
                onToggleLearnMore={() => {}}
                showLockedTooltip={showLockedTooltip}
                onToggleLockedTooltip={(id) => setShowLockedTooltip(prev => prev === id ? null : id)}
                renderDescription={renderDescription}
                selectedProject={selectedProject}
                progress={null}
                projectStage={activeStageTab}
                userId={user?.id}
                paidLocked={paidLocked}
                justCompleted={justCompletedQuestId === quest.id}
                returnTo="/business"
              />
            </div>
          )}
        </div>
      )
    })}
  </div>
)}
```

**Step 2: Add v2 row CSS to BusinessPage.css**

```css
/* Quest Row v2 design */
.business-page .q-row-wrap {
  border-bottom: 1px solid #f2f3f5;
}
.business-page .q-row-wrap:last-child { border-bottom: none; }

.business-page .q-row {
  display: flex; align-items: center;
  gap: 14px; padding: 15px 0;
}

.business-page .q-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px; flex-shrink: 0;
}
.business-page .q-icon.done { background: #eafaf2; }
.business-page .q-icon.todo { background: #f3f0ff; }

.business-page .q-info { flex: 1; min-width: 0; }
.business-page .q-name { font-size: 15px; font-weight: 700; color: #1a1a2e; }
.business-page .q-row-wrap.done .q-name {
  color: #b8bbc6; text-decoration: line-through; font-style: italic;
}
.business-page .q-sub { font-size: 12px; color: #9a9daa; margin-top: 2px; }

.business-page .q-btn {
  font-size: 13px; font-weight: 700;
  padding: 8px 18px; border-radius: 10px;
  border: none; cursor: pointer; flex-shrink: 0;
  text-decoration: none; text-align: center;
}
.business-page .q-btn.done-btn { background: #f0f1f3; color: #b8bbc6; cursor: default; }
.business-page .q-btn.start-btn {
  background: linear-gradient(135deg, #E9A23B, #f0b94e);
  color: #1a1a2e;
  box-shadow: 0 2px 10px rgba(233,162,59,0.2);
}

/* Expanded quest card area — hide QuestCard's own header since row header is visible */
.business-page .q-expanded {
  padding: 0 0 12px 56px; /* indent past icon width + gap */
}
.business-page .q-expanded .quest-header { display: none; }
.business-page .q-expanded .quest-card {
  box-shadow: none; border: none; padding: 0;
  background: transparent;
}
```

**Step 3: Build and verify**

Run: `npm run build 2>&1 | tail -5`

**Step 4: Manual test**

- Visit `/business`, select a stage with flow + non-flow quests
- Flow quests: "Start" navigates to flow page
- Non-flow quests: "Start" expands to show input area, "Close" collapses
- Completed quests: strikethrough name, grey "Done"

**Step 5: Commit**

```bash
git add src/pages/BusinessPage.jsx src/pages/BusinessPage.css
git commit -m "feat: restyle /business to v2 row design with collapsible QuestCard inputs"
```

---

### Task 5: Priority Layer Recommendation Sorting

**Files:**
- Modify: `src/hooks/usePriorityTab.js`

**Step 1: Add frequency-aware quest ranking per layer**

Replace the `selectedHealingQuests` memo (lines ~85-90) with sorting logic. Rather than hardcoding quest IDs (which is fragile), sort by quest type relevance to the layer:

```jsx
// Quest types most relevant per priority layer
const LAYER_QUEST_TYPES = {
  discover: ['Reconnect', 'Rewire'],   // self-discovery focus
  regulate: ['Reconnect', 'Release'],   // calming + release focus
  reveal: ['Rewire', 'Reconnect'],      // reframing + reconnecting
  value: ['Rewire', 'Release'],         // action-oriented
}

const selectedHealingQuests = useMemo(() => {
  const healingPickIds = weeklyPicks
    .filter(p => p.pick_type === 'daily_healing' || p.pick_type === 'weekly_healing')
    .map(p => p.reference_id)
  const quests = allHealingQuests.filter(q => healingPickIds.includes(q.id))

  // Sort: quest types matching priority layer float to top
  if (priorityLayer && LAYER_QUEST_TYPES[priorityLayer]) {
    const preferredTypes = LAYER_QUEST_TYPES[priorityLayer]
    quests.sort((a, b) => {
      const aIdx = preferredTypes.indexOf(a.type)
      const bIdx = preferredTypes.indexOf(b.type)
      const aRank = aIdx === -1 ? 99 : aIdx
      const bRank = bIdx === -1 ? 99 : bIdx
      return aRank - bRank
    })
  }

  return quests
}, [weeklyPicks, allHealingQuests, priorityLayer])
```

**Step 2: Build and verify**

Run: `npm run build 2>&1 | tail -5`

**Step 3: Commit**

```bash
git add src/hooks/usePriorityTab.js
git commit -m "feat: sort healing quests by priority layer type relevance"
```

---

### Task 6: Mobile Play-list Guided Picker

**Files:**
- Create: `src/components/MobilePlaylistPicker.jsx`
- Create: `src/components/MobilePlaylistPicker.css`
- Modify: `src/components/PlayListTab.jsx`

**Key difference from original plan:** The `handleGenerateChallenge` in Challenge.jsx returns edge function data (title, description) but saves the DB record internally without exposing the record ID. The MobilePlaylistPicker needs the DB record ID to accept the challenge. So it must call the edge function and `createGroanChallenge` directly.

**Step 1: Create MobilePlaylistPicker**

```jsx
// src/components/MobilePlaylistPicker.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { GROAN_VISIBILITY_LAYERS } from '../lib/stageConfig'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import './MobilePlaylistPicker.css'

export default function MobilePlaylistPicker({
  userId,
  onCellClick,
  layerLockStatus,
}) {
  const [step, setStep] = useState('skills') // skills | layer | generate
  const [skills, setSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedLayer, setSelectedLayer] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generatedChallenge, setGeneratedChallenge] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, cluster_type, proficiency, insight')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
      .order('proficiency', { ascending: false })
      .then(({ data }) => {
        const map = new Map()
        for (const item of (data || [])) {
          if (!map.has(item.cluster_label)) map.set(item.cluster_label, item)
        }
        setSkills([...map.values()])
      })
  }, [userId])

  const handleGenerate = async () => {
    if (!selectedSkill || !selectedLayer) return
    setGenerating(true)
    setError(null)
    setGeneratedChallenge(null)
    try {
      // 1. Call edge function directly
      const { data: aiData, error: aiError } = await supabase.functions.invoke('groan-challenge-generator', {
        body: {
          sourceType: 'skill',
          sourceLabel: selectedSkill.cluster_label,
          sourceInsight: selectedSkill.insight || '',
          visibilityLayer: selectedLayer,
        }
      })
      if (aiError) throw aiError
      if (!aiData?.title) throw new Error('No challenge generated')

      // 2. Save to DB (returns record with id)
      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: aiData.title,
        description: aiData.description,
        visibilityLayer: selectedLayer,
        sourceType: 'skill',
        sourceId: selectedSkill.id,
        sourceLabel: selectedSkill.cluster_label,
        scaryScore: aiData.scaryScore || 5,
        wahooScore: aiData.wahooScore || 5,
        generationPrompt: aiData.prompt,
      })
      if (saveError) throw saveError

      setGeneratedChallenge(dbRecord)
    } catch (err) {
      console.error('Error generating challenge:', err)
      setError('Failed to generate challenge. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = async () => {
    if (!generatedChallenge) return
    const { error: acceptError } = await acceptGroanChallenge(generatedChallenge.id)
    if (acceptError) {
      console.warn('Error accepting:', acceptError)
      return
    }
    // Open the existing modal flow via onCellClick
    onCellClick?.({
      sourceType: 'skill',
      sourceId: selectedSkill.id,
      sourceLabel: selectedSkill.cluster_label,
      visibilityLayer: selectedLayer,
      challenge: { ...generatedChallenge, accepted_at: new Date().toISOString() },
    })
    // Reset for next challenge
    setGeneratedChallenge(null)
    setStep('skills')
  }

  if (step === 'skills') {
    return (
      <div className="mpp-container">
        <h3 className="mpp-step-title">Choose a skill to challenge</h3>
        <div className="mpp-list">
          {skills.map(skill => (
            <button key={skill.id} className="mpp-pick-btn"
              onClick={() => { setSelectedSkill(skill); setStep('layer') }}>
              {skill.cluster_label}
            </button>
          ))}
        </div>
        {skills.length === 0 && (
          <p className="mpp-empty">Complete Flow Finder to discover your skills first.</p>
        )}
      </div>
    )
  }

  if (step === 'layer') {
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('skills')}>
          &larr; {selectedSkill?.cluster_label}
        </button>
        <h3 className="mpp-step-title">Choose visibility level</h3>
        <div className="mpp-list">
          {GROAN_VISIBILITY_LAYERS.map(layer => {
            const locked = layerLockStatus?.[layer.id]?.locked
            return (
              <button key={layer.id}
                className={`mpp-pick-btn ${locked ? 'locked' : ''}`}
                disabled={locked}
                onClick={() => {
                  setSelectedLayer(layer.id)
                  setStep('generate')
                }}>
                <span>{locked ? '🔒' : layer.icon} {layer.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Step 3: generate
  return (
    <div className="mpp-container">
      <button className="mpp-back" onClick={() => { setStep('layer'); setGeneratedChallenge(null) }}>
        &larr; Change layer
      </button>
      <h3 className="mpp-step-title">
        {selectedSkill?.cluster_label} &times; {GROAN_VISIBILITY_LAYERS.find(l => l.id === selectedLayer)?.label || selectedLayer}
      </h3>

      {generating && (
        <div className="mpp-generating">
          <div className="spinner" />
          <p>Generating your challenge...</p>
        </div>
      )}

      {!generating && !generatedChallenge && (
        <div className="mpp-generating">
          <button className="mpp-gold-btn" onClick={handleGenerate}>Generate Challenge</button>
          {error && <p className="mpp-error">{error}</p>}
        </div>
      )}

      {!generating && generatedChallenge && (
        <div className="mpp-challenge-card">
          <p className="mpp-challenge-text">{generatedChallenge.title}</p>
          {generatedChallenge.description && (
            <p className="mpp-challenge-desc">{generatedChallenge.description}</p>
          )}
          <button className="mpp-gold-btn" onClick={handleAccept}>Accept Challenge</button>
          <button className="mpp-regen-btn" onClick={handleGenerate}>Generate Another</button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create MobilePlaylistPicker CSS**

```css
/* src/components/MobilePlaylistPicker.css */
.mpp-container { padding: 8px 0; }
.mpp-step-title { font-size: 18px; font-weight: 800; color: #1a1a2e; margin-bottom: 14px; }
.mpp-back { background: none; border: none; color: #5e17eb; font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 0; margin-bottom: 12px; }
.mpp-list { display: flex; flex-direction: column; gap: 8px; }
.mpp-pick-btn { width: 100%; text-align: left; padding: 14px 18px; background: white; border: 2px solid #eef0f3; border-radius: 14px; font-size: 15px; font-weight: 600; color: #1a1a2e; cursor: pointer; transition: all 0.15s; }
.mpp-pick-btn:hover { border-color: #5e17eb; background: #f8f5ff; }
.mpp-pick-btn.locked { opacity: 0.5; cursor: not-allowed; }
.mpp-empty { font-size: 14px; color: #9a9daa; text-align: center; padding: 20px; }
.mpp-generating { text-align: center; padding: 30px 0; }
.mpp-challenge-card { background: white; border-radius: 18px; padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.mpp-challenge-text { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
.mpp-challenge-desc { font-size: 14px; color: #6c757d; line-height: 1.5; margin-bottom: 16px; }
.mpp-gold-btn { display: block; width: 100%; background: linear-gradient(135deg, #E9A23B 0%, #f0b94e 60%); color: #1a1a2e; border: none; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 800; cursor: pointer; }
.mpp-regen-btn { display: block; width: 100%; background: none; border: none; color: #5e17eb; font-size: 13px; font-weight: 600; cursor: pointer; padding: 10px; margin-top: 8px; }
.mpp-error { color: #ef4444; font-size: 14px; margin-top: 12px; }
```

**Step 3: Wire into PlayListTab**

In `src/components/PlayListTab.jsx`, add:

```jsx
import { useState, useEffect, useMemo } from 'react' // add useState, useEffect
import MobilePlaylistPicker from './MobilePlaylistPicker'
```

Inside the component, add mobile detection:
```jsx
const [isMobile, setIsMobile] = useState(
  typeof window !== 'undefined' && window.innerWidth < 768
)
useEffect(() => {
  const handler = () => setIsMobile(window.innerWidth < 768)
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, [])
```

Replace lines ~222-234 (the playlist sub-tab section):
```jsx
{activeSubTab === 'playlist' && (
  <div className="quest-section">
    {isMobile ? (
      <MobilePlaylistPicker
        userId={userId}
        onCellClick={onMatrixCellClick}
        layerLockStatus={layerLockStatus}
      />
    ) : (
      <GroanMatrix
        key={groanMatrixKey}
        userId={userId}
        onCellClick={onMatrixCellClick}
        onGenerateChallenge={onGenerateChallenge}
        layerLockStatus={layerLockStatus}
        flowFinderComplete={flowFinderComplete}
        sourceTypes={['skill']}
      />
    )}
  </div>
)}
```

**Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -5`

**Step 5: Manual test**

- Resize browser to <768px, visit `/7-day-challenge?tab=play-list&sub=playlist`
- Should see skill list, then layer selection, then generate
- Resize >768px -> should see full matrix

**Step 6: Commit**

```bash
git add src/components/MobilePlaylistPicker.jsx src/components/MobilePlaylistPicker.css src/components/PlayListTab.jsx
git commit -m "feat: add mobile guided picker for Play-list tab, keep matrix on desktop"
```

---

### Task 7: Final Build + Push

**Step 1: Full build check**

Run: `npm run build 2>&1 | tail -5`

**Step 2: Push to main**

Run: `git push origin main`
