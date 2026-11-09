import { useState, useEffect } from 'react'
import { VIBE_RISE_DIMENSIONS } from '../data/vibeRiseDimensions'
import GenericRadar from './GenericRadar'
import { supabase } from '../lib/supabaseClient'
import {
  getAdaptiveHeadline,
  detectDeficiencies,
  getSuggestion,
} from '../lib/alivenessEngine'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './AlivenessCheckin.css'

/**
 * AlivenessCheckin — bi-weekly check-in flow for one quest.
 *
 * Phase 1: 5 questions (same button UX as RetroactiveBaselineFlow)
 * Phase 2: triple-layer radar + shift breakdown + deficiency suggestions
 *
 * Props:
 *  userId              — string
 *  quest               — { id, label }
 *  baseline            — { permission: N, ... } score object
 *  previous            — score object | null (null = first ever check-in)
 *  allSnapshots        — full snapshot array from DB, sorted created_at desc
 *  onComplete          — () => void  — user dismissed results
 *  onDismiss           — () => void  — "Not now"
 *  onNavigateChallenge — ({ text, questId }) => void
 */
export default function AlivenessCheckin({
  userId,
  quest,
  baseline,
  previous,
  allSnapshots,
  onComplete,
  onDismiss,
  onNavigateChallenge,
}) {
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [phase, setPhase] = useState('questions') // 'questions' | 'saving' | 'results'

  const dim = VIBE_RISE_DIMENSIONS[step]
  const allDone = Object.keys(scores).length === VIBE_RISE_DIMENSIONS.length

  // Transition to saving phase once all questions answered
  useEffect(() => {
    if (allDone && phase === 'questions') {
      setPhase('saving')
    }
  }, [allDone, phase])

  // Run save when we enter 'saving' phase
  useEffect(() => {
    if (phase !== 'saving') return
    if (saving) return
    doSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  async function doSave() {
    setSaving(true)
    setSaveError(false)
    try {
      const { error } = await supabase.from('quest_aliveness_snapshots').insert({
        user_id: userId,
        quest_id: quest.id,
        snapshot_type: 'checkin',
        scores,
      })
      if (error) throw error
      hapticSuccess()
      setPhase('results')
    } catch (err) {
      console.error('AlivenessCheckin: save failed:', err)
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  // Question phase
  if (phase === 'questions') {
    if (!dim) {
      // All steps answered but phase not updated yet — show nothing while effect fires
      return null
    }
    return (
      <div className="aci-wrap">
        <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{quest.label}</div>
        <div className="aci-dots">
          {VIBE_RISE_DIMENSIONS.map((_, i) => (
            <div key={i} className="aci-dot" style={{
              background: i < step ? '#5e17eb' : i === step ? '#E9A23B' : '#e0ddd8',
            }} />
          ))}
        </div>
        <div className="aci-emoji">{dim.emoji}</div>
        <div className="aci-question">{dim.question}</div>
        <div className="aci-answers">
          {dim.anchors.map((anchor, i) => {
            const score = i + 1
            const selected = scores[dim.id] === score
            return (
              <button
                key={score}
                className={`aci-answer${selected ? ' selected' : ''}`}
                style={{
                  background: selected ? '#5e17eb' : '#f0ede8',
                  color: selected ? '#fff' : '#333',
                }}
                disabled={advancing}
                onClick={() => {
                  if (advancing) return
                  setAdvancing(true)
                  hapticLight()
                  setScores(prev => ({ ...prev, [dim.id]: score }))
                  setTimeout(() => {
                    setStep(prev => prev + 1)
                    setAdvancing(false)
                  }, 300)
                }}
              >
                <span style={{ fontWeight: 700, marginRight: 8 }}>{score}</span>{anchor}
              </button>
            )
          })}
        </div>
        <div className="aci-nav">
          {step > 0 && (
            <button className="aci-back" onClick={() => setStep(prev => prev - 1)}>
              Back
            </button>
          )}
          <button className="aci-dismiss" onClick={onDismiss}>Not now</button>
        </div>
      </div>
    )
  }

  // Saving phase
  if (phase === 'saving') {
    if (saveError) {
      return (
        <div className="aci-wrap">
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>{quest.label}</div>
          <div className="aci-error">
            Something went wrong saving your check-in. Try again?
            <div className="aci-error-actions">
              <button className="aci-retry" onClick={doSave}>Try again</button>
              <button className="aci-cancel" onClick={onDismiss}>Cancel</button>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="aci-wrap" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ color: '#888', fontSize: 14 }}>Saving...</div>
      </div>
    )
  }

  // Results phase
  return (
    <ResultsView
      quest={quest}
      baseline={baseline}
      previous={previous}
      current={scores}
      allSnapshots={allSnapshots}
      onComplete={onComplete}
      onNavigateChallenge={onNavigateChallenge}
    />
  )
}

// ---------------------------------------------------------------------------
// ResultsView — shown after save succeeds
// ---------------------------------------------------------------------------

function ResultsView({ quest, baseline, previous, current, allSnapshots, onComplete, onNavigateChallenge }) {
  // Track which deficiency suggestions the user has dismissed
  const [dismissed, setDismissed] = useState([])

  const headline = getAdaptiveHeadline(baseline, previous, current)

  // Prepend the new checkin so detectDeficiencies sees it as the latest
  const snapshotsWithNew = [
    { snapshot_type: 'checkin', scores: current, created_at: new Date().toISOString() },
    ...(allSnapshots || []),
  ]
  const deficiencies = detectDeficiencies(snapshotsWithNew)

  // Count real prior checkins to decide whether to show "since last" column
  const priorCheckinCount = (allSnapshots || []).filter(s => s.snapshot_type === 'checkin').length
  const showSinceLast = priorCheckinCount >= 1 && previous != null

  // Build shift rows sorted by magnitude of change vs baseline, largest first
  const shifts = VIBE_RISE_DIMENSIONS.map(dim => {
    const baseVal = baseline?.[dim.id] ?? 0
    const prevVal = previous?.[dim.id] ?? null
    const currVal = current[dim.id] ?? 0
    return {
      dim,
      vsBase: currVal - baseVal,
      vsPrev: showSinceLast && prevVal !== null ? currVal - prevVal : null,
    }
  }).sort((a, b) => Math.abs(b.vsBase) - Math.abs(a.vsBase))

  function deltaLabel(n) {
    if (n > 0) return { symbol: `+${n}`, cls: 'up' }
    if (n < 0) return { symbol: `${n}`, cls: 'down' }
    return { symbol: '0', cls: 'flat' }
  }

  return (
    <div className="aci-wrap">
      <div className="aci-results">
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{quest.label}</div>
        <div className="aci-headline">{headline}</div>

        <div className="aci-radar-wrap">
          <GenericRadar
            dimensions={VIBE_RISE_DIMENSIONS}
            scores={current}
            scores2={baseline}
            scores3={previous || undefined}
            maxLevel={5}
            size={240}
            animate
          />
        </div>

        {/* Radar legend */}
        <div className="aci-legend">
          <div className="aci-legend-item">
            <div className="aci-legend-dot" style={{ background: '#5e17eb' }} />
            Now
          </div>
          <div className="aci-legend-item">
            <div className="aci-legend-dot" style={{ background: '#E9A23B' }} />
            Start
          </div>
          {showSinceLast && (
            <div className="aci-legend-item">
              <div className="aci-legend-dot" style={{ background: '#bbb' }} />
              Last check
            </div>
          )}
        </div>

        {/* Shift breakdown */}
        <div className="aci-shifts">
          {shifts.map(({ dim, vsBase, vsPrev }) => {
            const baseD = deltaLabel(vsBase)
            return (
              <div key={dim.id} className="aci-shift-row">
                <span className="aci-shift-name">{dim.emoji} {dim.name}</span>
                <span className={`aci-shift-delta ${baseD.cls}`}>
                  {baseD.symbol} since start
                </span>
                {vsPrev !== null && (() => {
                  const prevD = deltaLabel(vsPrev)
                  return (
                    <span className={`aci-shift-delta ${prevD.cls}`}>
                      {prevD.symbol} since last
                    </span>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* Deficiency suggestions — show up to 2, skip dismissed ones */}
        {deficiencies
          .filter(def => !dismissed.includes(def.dimensionId))
          .slice(0, 2)
          .map(def => {
            const suggestion = getSuggestion(def.dimensionId)
            const dimMeta = VIBE_RISE_DIMENSIONS.find(d => d.id === def.dimensionId)
            if (!suggestion || !dimMeta) return null
            return (
              <div key={def.dimensionId} className="aci-deficiency">
                <div className="aci-def-label">{dimMeta.emoji} Your {dimMeta.name} has been flat</div>
                <div className="aci-def-text">{suggestion.label}</div>
                <div className="aci-def-actions">
                  <button
                    className="aci-def-accept"
                    onClick={() => {
                      hapticLight()
                      onNavigateChallenge?.({ text: suggestion.text, questId: quest.id })
                    }}
                  >
                    Try this challenge
                  </button>
                  <button
                    className="aci-def-skip"
                    onClick={() => setDismissed(prev => [...prev, def.dimensionId])}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )
          })}

        <button className="aci-done" onClick={onComplete}>Done</button>
      </div>
    </div>
  )
}
