import { useState, useEffect, useRef } from 'react'
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

export default function ZoneCalSection({ userId, userEmail, hasEssence }) {
  const navigate = useNavigate()
  const [snapshots, setSnapshots] = useState(null) // [latest, previous] or null
  const [loading, setLoading] = useState(true)
  const [showCheckin, setShowCheckin] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [completionResult, setCompletionResult] = useState(null) // { scores, diagnosis, narrative, previousScores }
  const bridgeAttemptedRef = useRef(false)
  const isSubmitting = useRef(false)

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
      if (!bridgeAttemptedRef.current && userEmail) {
        bridgeAttemptedRef.current = true
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
  }, [userId, userEmail])

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
    if (isSubmitting.current) return
    isSubmitting.current = true
    const newDiagnosis = getDiagnosis(scores)

    await supabase.from('zone_cal_snapshots').insert({
      user_id: userId,
      scores,
      diagnosis: newDiagnosis.id,
      source: 'in_app',
    })

    // Build completion result for narrative (capture previousScores before refetch)
    if (latest) {
      const oldDiagnosis = getDiagnosis(latest.scores)
      setCompletionResult({
        scores,
        diagnosis: newDiagnosis,
        oldDiagnosis,
        previousScores: latest.scores,
        narrative: getChangeNarrative(latest.scores, scores, oldDiagnosis, newDiagnosis),
      })
    } else {
      setCompletionResult({ scores, diagnosis: newDiagnosis, oldDiagnosis: null, previousScores: null, narrative: null })
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
    isSubmitting.current = false
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
          {/* Diagnosis change narrative (different diagnosis) */}
          {cr.oldDiagnosis && cr.oldDiagnosis.id !== cr.diagnosis.id && (
            <div className="zcs-transition">
              <div className="zcs-transition-old">You were in <strong>{cr.oldDiagnosis.name}</strong></div>
              <div className="zcs-transition-arrow">↓</div>
              <div className="zcs-transition-new">Now you're in <strong>{cr.diagnosis.name}</strong></div>
              <div className="zcs-diagnosis-headline">{cr.diagnosis.headline}</div>
              <div className="zcs-transition-narrative">{cr.narrative}</div>
            </div>
          )}

          {/* Same diagnosis on retake */}
          {cr.oldDiagnosis && cr.oldDiagnosis.id === cr.diagnosis.id && (
            <>
              <div className="zcs-diagnosis-name">{cr.diagnosis.name}</div>
              <div className="zcs-diagnosis-headline">{cr.diagnosis.headline}</div>
              <div className="zcs-transition-narrative">{cr.narrative}</div>
            </>
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
            scores3={cr.previousScores}
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
