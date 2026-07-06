/**
 * LifePathFlow — Logged-in user life path exercise.
 * Route: /life-paths (AuthGate)
 *
 * Flow: CURRENT → ENTER → TAG → SPRING → TAG_NEW → READING → MAP → STUCK → STUCK_SPRING → WAHOOS → COMPLETE
 * Saves progress after every step. Returning users resume where they left off.
 * Wahoos created from stuck points appear in the wahoo tab via groan_challenges.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import LifePathMap from '../components/LifePathMap/LifePathMap'
import { STATES, STATE_META, STUCK_REASONS, stateColor, stateY } from '../components/LifePathMap/lifePaths'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import './FacilitateLifePaths.css'

const STEPS = {
  INTRO: 'intro',
  CURRENT: 'current',
  ENTER: 'enter',
  TAG: 'tag',
  SPRING: 'spring',
  TAG_NEW: 'tag_new',
  READING: 'reading',
  MAP: 'map',
  STUCK: 'stuck',
  STUCK_SPRING: 'stuck_spring',
  WAHOOS: 'wahoos',
  COMPLETE: 'complete',
}

const STEP_ORDER = Object.values(STEPS)
let nextId = 1
let spNextId = 1

export default function LifePathFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(null) // null until session loaded
  const [loading, setLoading] = useState(true)
  const [introSlide, setIntroSlide] = useState(0)
  const [introFading, setIntroFading] = useState(false)
  const [currentCareer, setCurrentCareer] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [careers, setCareers] = useState([])
  const [safety, setSafety] = useState(0)
  const [input, setInput] = useState('')
  const [tagTotal, setTagTotal] = useState(0)
  const [showPunchline, setShowPunchline] = useState(false)
  const [showPunchline2, setShowPunchline2] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [pulseActive, setPulseActive] = useState(false)
  const [highlightId, setHighlightId] = useState(null)
  const [selectedWahooId, setSelectedWahooId] = useState(null)
  const [wahooSteps, setWahooSteps] = useState({})
  const [wahooInput, setWahooInput] = useState('')
  const [springReady, setSpringReady] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [stuckPoints, setStuckPoints] = useState([])
  const [stuckInput, setStuckInput] = useState('')
  const [activeReasonId, setActiveReasonId] = useState(null) // which stuck point is showing reason selector
  const inputRef = useRef(null)
  const wahooInputRef = useRef(null)
  const stuckInputRef = useRef(null)
  const reasonTimerRef = useRef(null)

  // Derived
  const taggedCareers = careers.filter(c => c.predictedState)
  const careersToTag = useMemo(() => {
    if (step === STEPS.TAG) return careers.filter(c => !c.enteredInSpring && !c.predictedState)
    if (step === STEPS.TAG_NEW) return careers.filter(c => c.enteredInSpring && !c.predictedState)
    return []
  }, [careers, step])
  const currentTagCareer = careersToTag[0] || null
  const stepIndex = STEP_ORDER.indexOf(step)
  const hasGapPattern = taggedCareers.length >= 2
  const taggedSoFar = tagTotal - careersToTag.length
  const enteredCount = careers.filter(c => !c.enteredInSpring).length
  const springPromptText = `Out of every career that exists... only ${enteredCount === 1 ? 'that one' : `these ${enteredCount}`}?`

  // Stuck points for the selected career
  const careerStuckPoints = useMemo(
    () => stuckPoints.filter(sp => sp.careerId === selectedWahooId),
    [stuckPoints, selectedWahooId]
  )
  const stuckPointsNotInWahoos = useMemo(
    () => careerStuckPoints.filter(sp => !sp.addedToWahoos),
    [careerStuckPoints]
  )

  // ── Session loading ──
  useEffect(() => {
    if (!user?.email) { setStep(STEPS.INTRO); setLoading(false); return }
    supabase
      .from('life_path_sessions')
      .select('*')
      .eq('client_email', user.email)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSessionId(data.id)
          setCurrentCareer(data.current_career ? { label: data.current_career, state: data.current_state } : null)
          setCareers((data.careers || []).map(c => ({ ...c, livedState: null, animateIn: false })))
          setStuckPoints(data.stuck_points || [])
          setWahooSteps(data.wahoo_steps || {})
          setSafety(data.safety || 0)
          // Resume at saved step, or MAP if completed (so they can explore another career)
          const savedStep = data.step === 'complete' ? STEPS.MAP : (STEPS[data.step?.toUpperCase()] || data.step)
          setStep(STEP_ORDER.includes(savedStep) ? savedStep : STEPS.MAP)
          // Restore tagTotal if resuming mid-TAG
          const restoredCareers = data.careers || []
          if (savedStep === 'tag') {
            setTagTotal(restoredCareers.filter(c => !c.enteredInSpring).length)
          } else if (savedStep === 'tag_new') {
            setTagTotal(restoredCareers.filter(c => c.enteredInSpring).length)
          }
          // Ensure IDs don't collide
          const maxId = Math.max(0, ...(data.careers || []).map(c => parseInt(c.id?.replace('c', '') || '0')))
          nextId = maxId + 1
          const maxSpId = Math.max(0, ...(data.stuck_points || []).map(sp => parseInt(sp.id?.replace('sp', '') || '0')))
          spNextId = maxSpId + 1
        } else {
          setStep(STEPS.INTRO)
        }
        setLoading(false)
      })
  }, [user?.email])

  // ── Effects ──
  useEffect(() => {
    if (step === STEPS.CURRENT || step === STEPS.ENTER) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (step === STEPS.STUCK || step === STEPS.STUCK_SPRING) {
      setTimeout(() => stuckInputRef.current?.focus(), 100)
    }
  }, [step])

  useEffect(() => {
    if (step === STEPS.SPRING && springReady) setTimeout(() => inputRef.current?.focus(), 100)
  }, [step, springReady])

  useEffect(() => {
    if (step === STEPS.SPRING) {
      setSpringReady(false)
      const t = setTimeout(() => setSpringReady(true), 2000)
      return () => clearTimeout(t)
    }
  }, [step])

  useEffect(() => {
    if (step === STEPS.READING) {
      setShowPunchline(false); setShowPunchline2(false); setShowContinue(false)
      const t1 = setTimeout(() => setShowPunchline(true), 1500)
      const t2 = setTimeout(() => setShowPunchline2(true), 4000)
      const t3 = setTimeout(() => setShowContinue(true), 7000)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    } else { setShowPunchline(false); setShowPunchline2(false); setShowContinue(false) }
  }, [step])

  useEffect(() => { setHighlightId(currentTagCareer?.id || null) }, [currentTagCareer])

  // Cleanup reason timer on unmount
  useEffect(() => { return () => clearTimeout(reasonTimerRef.current) }, [])

  useEffect(() => {
    if (selectedWahooId && step === STEPS.WAHOOS) setTimeout(() => wahooInputRef.current?.focus(), 200)
  }, [selectedWahooId, step])

  // ── Save ──
  const saveSession = useCallback(async (overrides = {}) => {
    if (!user?.id) return
    const data = {
      client_name: user.email || user.id,
      client_email: user.email || null,
      current_career: currentCareer?.label || null,
      current_state: currentCareer?.state || null,
      careers: careers.map(c => ({ id: c.id, label: c.label, predictedState: c.predictedState, enteredInSpring: c.enteredInSpring })),
      stuck_points: stuckPoints,
      wahoo_steps: wahooSteps,
      safety,
      step: overrides.step || step,
      updated_at: new Date().toISOString(),
    }
    try {
      if (sessionId) {
        const { error } = await supabase.from('life_path_sessions').update(data).eq('id', sessionId)
        if (error) console.error('Life path update error:', error)
      } else {
        const { data: rows, error } = await supabase.from('life_path_sessions').insert(data).select('id')
        if (error) console.error('Life path insert error:', error)
        else if (rows?.[0]?.id) setSessionId(rows[0].id)
      }
    } catch (e) { console.error('Life path save error:', e) }
  }, [user, currentCareer, careers, stuckPoints, wahooSteps, safety, step, sessionId])

  const saveRef = useRef(saveSession)
  saveRef.current = saveSession

  const wahooCount = Object.values(wahooSteps).reduce((sum, arr) => sum + arr.length, 0)
  const stuckCount = stuckPoints.length
  useEffect(() => {
    if (!user?.id || !step || step === STEPS.INTRO || step === STEPS.CURRENT || loading) return
    const timer = setTimeout(() => saveRef.current(), 500)
    return () => clearTimeout(timer)
  }, [step, taggedCareers.length, safety, wahooCount, stuckCount, user, loading])

  // ── Actions ──
  const addCareer = useCallback((label, fromSpring = false) => {
    if (!label.trim()) return
    setCareers(prev => [...prev, {
      id: 'c' + nextId++, label: label.trim(), predictedState: null, livedState: null,
      realistic: false, enteredInSpring: fromSpring, animateIn: fromSpring,
    }])
    setInput('')
  }, [])

  const tagCareer = useCallback((stateKey) => {
    if (!currentTagCareer) return
    setCareers(prev => prev.map(c =>
      c.id === currentTagCareer.id ? { ...c, predictedState: stateKey, animateIn: false } : c
    ))
    if (careersToTag.length <= 1) {
      if (step === STEPS.TAG) setStep(STEPS.SPRING)
      else if (step === STEPS.TAG_NEW) setStep(STEPS.READING)
    }
  }, [currentTagCareer, careersToTag.length, step])

  const removeCareer = useCallback((id) => { setCareers(prev => prev.filter(c => c.id !== id)) }, [])

  const advanceFromEnter = useCallback(() => {
    if (careers.length === 0) return
    setTagTotal(careers.filter(c => !c.enteredInSpring && !c.predictedState).length)
    setStep(STEPS.TAG)
  }, [careers])

  const advanceFromSpring = useCallback(() => {
    const spring = careers.filter(c => c.enteredInSpring === true)
    if (spring.length === 0) setStep(STEPS.READING)
    else { setTagTotal(spring.filter(c => !c.predictedState).length); setStep(STEPS.TAG_NEW) }
  }, [careers])

  // ── Stuck point actions ──
  const addStuckPoint = useCallback((fromSpring = false) => {
    if (!stuckInput.trim() || !selectedWahooId) return
    const newSp = {
      id: 'sp' + spNextId++,
      careerId: selectedWahooId,
      text: stuckInput.trim(),
      reason: null,
      reasonLabel: null,
      reasonEmoji: null,
      fromSpring,
      addedToWahoos: false,
    }
    setStuckPoints(prev => [...prev, newSp])
    setStuckInput('')
    setActiveReasonId(newSp.id)
    setTimeout(() => stuckInputRef.current?.focus(), 50)
  }, [stuckInput, selectedWahooId])

  const setStuckReason = useCallback((spId, reason) => {
    setStuckPoints(prev => prev.map(sp =>
      sp.id === spId ? { ...sp, reason: reason.id, reasonLabel: reason.label, reasonEmoji: reason.emoji } : sp
    ))
    setActiveReasonId(null)
    clearTimeout(reasonTimerRef.current)
  }, [])

  const removeStuckPoint = useCallback((spId) => {
    setStuckPoints(prev => prev.filter(sp => sp.id !== spId))
  }, [])

  const moveStuckToWahoo = useCallback((spId) => {
    const sp = stuckPoints.find(s => s.id === spId)
    if (!sp || !selectedWahooId) return
    setStuckPoints(prev => prev.map(s => s.id === spId ? { ...s, addedToWahoos: true } : s))
    setWahooSteps(prev => ({
      ...prev,
      [selectedWahooId]: [...(prev[selectedWahooId] || []), { text: sp.text, done: false, fromStuckPoint: spId }],
    }))
  }, [stuckPoints, selectedWahooId])

  // ── Wahoo actions ──
  const addWahooStep = useCallback(() => {
    if (!wahooInput.trim() || !selectedWahooId) return
    setWahooSteps(prev => ({
      ...prev,
      [selectedWahooId]: [...(prev[selectedWahooId] || []), { text: wahooInput.trim(), done: false }],
    }))
    setWahooInput('')
    setTimeout(() => wahooInputRef.current?.focus(), 50)
  }, [wahooInput, selectedWahooId])

  const toggleWahooStep = useCallback((careerId, stepIdx) => {
    const wasDone = (wahooSteps[careerId] || [])[stepIdx]?.done
    const totalSteps = (wahooSteps[careerId] || []).length || 1
    setWahooSteps(prev => {
      const steps = [...(prev[careerId] || [])]
      steps[stepIdx] = { ...steps[stepIdx], done: !steps[stepIdx].done }
      return { ...prev, [careerId]: steps }
    })
    if (!wasDone) {
      setPulseActive(true)
      setTimeout(() => setPulseActive(false), 700)
      setTimeout(() => setSafety(s => Math.min(s + 1 / totalSteps, 1)), 300)
    }
  }, [wahooSteps])

  const removeWahooStep = useCallback((careerId, stepIdx) => {
    const ws = (wahooSteps[careerId] || [])[stepIdx]
    // If it came from a stuck point, mark it as not added
    if (ws?.fromStuckPoint) {
      setStuckPoints(prev => prev.map(sp => sp.id === ws.fromStuckPoint ? { ...sp, addedToWahoos: false } : sp))
    }
    setWahooSteps(prev => {
      const steps = [...(prev[careerId] || [])]
      steps.splice(stepIdx, 1)
      return { ...prev, [careerId]: steps }
    })
  }, [wahooSteps])

  // ── Save wahoos to groan_challenges ──
  const saveWahoosToGroan = useCallback(async () => {
    if (!user?.id || !selectedWahooId) return []
    const career = careers.find(c => c.id === selectedWahooId)
    const steps = wahooSteps[selectedWahooId] || []
    const savedEntries = [] // { idx, groanId }
    for (let i = 0; i < steps.length; i++) {
      const ws = steps[i]
      if (ws.savedToGroan) continue
      try {
        const sp = ws.fromStuckPoint ? stuckPoints.find(s => s.id === ws.fromStuckPoint) : null
        const { data: dbRecord } = await createGroanChallenge({
          userId: user.id,
          title: ws.text,
          description: `Life path: ${career?.label || 'Unknown'}${sp?.reasonLabel ? `. Blocked by: ${sp.reasonLabel}` : ''}`,
          visibilityLayer: 'screen',
          sourceType: 'life_path',
          sourceLabel: career?.label || 'Life Path',
          scaryScore: 5,
          wahooScore: 5,
          wahooCategory: null,
        })
        if (dbRecord) {
          await acceptGroanChallenge(dbRecord.id)
          await supabase.from('priority_weekly_picks').upsert({
            user_id: user.id,
            week_start_date: getWeekStartLocal(),
            pick_type: 'groan',
            reference_id: dbRecord.id,
            display_name: ws.text,
          }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
          savedEntries.push({ idx: i, groanId: dbRecord.id })
        }
      } catch (e) { console.error('Groan challenge save error:', e) }
    }
    // Mark saved via proper setState — store groan ID for quest_task linking
    if (savedEntries.length > 0) {
      setWahooSteps(prev => {
        const updated = { ...prev }
        const arr = [...(updated[selectedWahooId] || [])]
        savedEntries.forEach(({ idx, groanId }) => { arr[idx] = { ...arr[idx], savedToGroan: groanId } })
        updated[selectedWahooId] = arr
        return updated
      })
    }
    return savedEntries
  }, [user, selectedWahooId, careers, wahooSteps, stuckPoints])

  // ── Map careers ──
  const mapCareers = useMemo(() => {
    const visible = careers.filter(c => {
      if (c.predictedState) return true
      if ((step === STEPS.SPRING || step === STEPS.TAG_NEW) && c.enteredInSpring) return true
      return false
    })
    if (currentCareer?.state) {
      visible.push({ id: 'current', label: currentCareer.label, predictedState: currentCareer.state,
        livedState: null, realistic: true, animateIn: false, isCurrent: true })
    }
    return visible
  }, [careers, step, currentCareer])

  const isReading = step === STEPS.READING
  const isTagStep = step === STEPS.TAG || step === STEPS.TAG_NEW
  const trunkY = currentCareer?.state ? stateY(currentCareer.state) : undefined

  if (loading) return <div className="flp-page dark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ opacity: 0.3 }}>Loading...</div></div>

  return (
    <div className={`flp-page ${theme} ${isReading ? 'flp-reading-mode' : ''}`}>
      <div className="flp-map-area">
        <div className="flp-map-header">
          <div className="flp-map-header-left">
            <span className="flp-title">Life Path States</span>
            <div className="flp-step-dots">
              {STEP_ORDER.map((s, i) => (
                <div key={s} className={`flp-step-dot ${i <= stepIndex ? 'active' : ''} ${i === stepIndex ? 'current' : ''}`} />
              ))}
            </div>
          </div>
          <div className="flp-map-header-left">
            <button className="flp-theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <div className="flp-map-svg">
          <LifePathMap careers={mapCareers} safety={safety} walkProgress={0} theme={theme}
            pulseActive={pulseActive} showZoneLabels={taggedCareers.length >= 2}
            highlightId={highlightId} trunkY={trunkY} />
        </div>
        {/* Desktop-only map overlays */}
        <div className="flp-desktop-only">
          {step === STEPS.CURRENT && !currentCareer && (
            <div className="flp-prompt-overlay"><div className="flp-prompt-text">What do you currently do?</div></div>
          )}
          {step === STEPS.ENTER && (
            <div className={`flp-prompt-overlay ${careers.length > 0 ? 'flp-prompt-compact' : ''}`}>
              <div className="flp-prompt-text">What are all the career options available to you?</div>
            </div>
          )}
          {step === STEPS.SPRING && (
            <div className={`flp-prompt-overlay ${springReady ? 'flp-prompt-compact' : ''}`}>
              <div className="flp-prompt-text">{springPromptText}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Panel ── */}
      <div className="flp-panel">
        <div className="flp-panel-inner">

          {/* INTRO */}
          {step === STEPS.INTRO && (
            <div className="flp-tag-screen" style={{ gap: 0 }}>
              {introSlide === 0 && (
                <div style={{ animation: 'flpFadeIn 0.5s ease', textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto 20px', overflow: 'hidden', borderRadius: 12 }}>
                    <img src="/images/life-map.png" alt="Life paths" style={{ width: '100%', height: 'auto', display: 'block' }}
                      onLoad={e => { e.target.style.clipPath = 'inset(0 50% 0 0)' }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 8px' }}>
                    There are tons of paths you could take in life.
                  </div>
                  <div style={{ fontSize: 15, opacity: 0.5, lineHeight: 1.5, maxWidth: 300, margin: '0 auto 20px' }}>
                    This is what yours looks like so far.
                  </div>
                  <button className="flp-advance-btn" onClick={() => {
                    setIntroFading(true)
                    setTimeout(() => { setIntroSlide(1); setIntroFading(false) }, 300)
                  }}>
                    What about the future? →
                  </button>
                </div>
              )}
              {introSlide === 1 && (
                <div style={{ animation: 'flpFadeIn 0.5s ease', textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto 20px', borderRadius: 12, overflow: 'hidden' }}>
                    <img src="/images/life-map.png" alt="Life paths" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.5, maxWidth: 320, margin: '0 auto 8px' }}>
                    These are all the paths still open to you.
                  </div>
                  <div style={{ fontSize: 15, opacity: 0.5, lineHeight: 1.5, maxWidth: 300, margin: '0 auto 20px' }}>
                    Want to find out which one you're on right now?
                  </div>
                  <button className="flp-advance-btn" onClick={() => setStep(STEPS.CURRENT)}>
                    Yeah, show me →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CURRENT */}
          {step === STEPS.CURRENT && (
            <div className="flp-tag-screen">
              {!currentCareer ? (
                <>
                  <div className="flp-tag-prompt">What do you currently do?</div>
                  <div className="flp-input-row">
                    <input ref={inputRef} className="flp-input" type="text" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { setCurrentCareer({ label: input.trim(), state: null }); setInput('') } }}
                      placeholder="e.g. Marketing manager..." />
                    <button className="flp-input-submit" onClick={() => { if (input.trim()) { setCurrentCareer({ label: input.trim(), state: null }); setInput('') } }}
                      disabled={!input.trim()}>→</button>
                  </div>
                </>
              ) : !currentCareer.state ? (
                <>
                  <div className="flp-tag-career-name">{currentCareer.label}</div>
                  <div className="flp-tag-prompt">And how does it make you feel?</div>
                  <div className="flp-tag-buttons">
                    {STATES.map((s, i) => { const m = STATE_META[s]; return (
                      <button key={s} className="flp-tag-btn" style={{ borderColor: m.color, color: m.color }}
                        onClick={() => setCurrentCareer(prev => ({ ...prev, state: s }))}>
                        <span className="flp-tag-key">{i + 1}</span><span className="flp-tag-btn-emoji">{m.emoji}</span>
                        <span className="flp-tag-btn-label">{m.label}</span><span className="flp-tag-btn-felt">{m.felt}</span>
                      </button>) })}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, opacity: 0.4, letterSpacing: '0.5px', marginBottom: 12 }}>{currentCareer.label}</div>
                  <div style={{ fontSize: 13, opacity: 0.45, marginBottom: 8 }}>Your body has four modes.</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[...STATES].reverse().map(s => {
                      const m = STATE_META[s]
                      const isActive = s === currentCareer.state
                      return (
                        <div key={s} style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: isActive ? 600 : 400,
                          background: isActive ? `${m.color}20` : 'rgba(255,255,255,0.04)',
                          color: isActive ? m.color : 'rgba(255,255,255,0.25)',
                          border: isActive ? `1px solid ${m.color}40` : '1px solid transparent',
                        }}>
                          {m.emoji} {m.label}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.5, lineHeight: 1.7, maxWidth: 300, textAlign: 'center', marginBottom: 20 }}>
                    <p style={{ margin: '0 0 8px' }}>The one you spend the most time in decides which life paths feel possible.</p>
                    <p style={{ margin: 0 }}>Right now, you're walking the <span style={{ color: STATE_META[currentCareer.state]?.color, opacity: 1 }}>{STATE_META[currentCareer.state]?.label}</span> path.</p>
                  </div>
                  <button className="flp-advance-btn" onClick={() => setStep(STEPS.ENTER)}>What else is out there? →</button>
                </>
              )}
            </div>
          )}

          {/* ENTER */}
          {step === STEPS.ENTER && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">What are all the career options available to you?</div>
              <div className="flp-input-row">
                <input ref={inputRef} className="flp-input" type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && input.trim()) addCareer(input); else if (e.key === 'Backspace' && input === '' && careers.length > 0) removeCareer(careers[careers.length - 1].id) }}
                  placeholder="Type a career..." />
                <button className="flp-input-submit" onClick={() => { if (input.trim()) addCareer(input) }} disabled={!input.trim()}>Add</button>
              </div>
            </div>
          )}

          {/* SPRING */}
          {step === STEPS.SPRING && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">{springPromptText}</div>
              {springReady && (
                <>
                  <div style={{ fontSize: 13, opacity: 0.4, fontStyle: 'italic', marginBottom: 8 }}>
                    Hint: Also think about experiences you love or would love to have.
                  </div>
                  <div className="flp-input-row">
                    <input ref={inputRef} className="flp-input" type="text" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && input.trim()) addCareer(input, true); else if (e.key === 'Backspace' && input === '') { const l = careers.filter(c => c.enteredInSpring); if (l.length > 0) removeCareer(l[l.length - 1].id) } }}
                      placeholder="Actually, also..." />
                    <button className="flp-input-submit" onClick={() => { if (input.trim()) addCareer(input, true) }} disabled={!input.trim()}>Add</button>
                  </div>
                  {!careers.some(c => c.enteredInSpring) && (
                    <button className="flp-advance-btn" onClick={advanceFromSpring} style={{ alignSelf: 'center', marginTop: 8, opacity: 0.6 }}>Skip, no more →</button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Career lists */}
          {step === STEPS.ENTER && careers.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="flp-career-list-display">
                {careers.filter(c => !c.enteredInSpring).map((c, i) => (
                  <div key={c.id} className="flp-career-list-item">
                    <span className="flp-career-list-num">{i + 1}.</span>
                    <span className="flp-career-list-name">{c.label}</span>
                    <span className="flp-pill-remove" onClick={() => removeCareer(c.id)}>✕</span>
                  </div>
                ))}
                <button className="flp-advance-btn" onClick={advanceFromEnter} style={{ alignSelf: 'center', marginTop: 12 }}>That's all I can think of →</button>
              </div>
            </div>
          )}
          {step === STEPS.SPRING && springReady && careers.some(c => c.enteredInSpring) && (
            <div style={{ marginBottom: 16 }}>
              <div className="flp-career-list-display">
                {careers.filter(c => c.enteredInSpring).map((c, i) => (
                  <div key={c.id} className="flp-career-list-item">
                    <span className="flp-career-list-num">{i + 1}.</span><span className="flp-career-list-name">{c.label}</span>
                    <span className="flp-pill-remove" onClick={() => removeCareer(c.id)}>✕</span>
                  </div>
                ))}
                <button className="flp-advance-btn" onClick={advanceFromSpring} style={{ alignSelf: 'center', marginTop: 8 }}>That's all of them →</button>
              </div>
            </div>
          )}

          {/* READING */}
          {isReading && (
            <div className="flp-reading-panel">
              {hasGapPattern && (
                <>
                  <div className={`flp-punchline ${showPunchline ? 'visible' : ''}`}>
                    <p>We don't rise to the level of our ambitions.</p><p>We fall to the level that feels emotionally safe.</p>
                  </div>
                  <div className={`flp-punchline flp-punchline-2 ${showPunchline2 ? 'visible' : ''}`}>
                    <p style={{ margin: '0 0 12px' }}>The cone of light on your map is where you feel safe right now.</p>
                    <p style={{ margin: 0 }}>Want help expanding it to reach the height of your ambitions?</p>
                  </div>
                </>
              )}
              {showContinue && (
                <button className="flp-advance-btn" onClick={() => setStep(STEPS.MAP)} style={{ marginTop: 16 }}>Continue →</button>
              )}
            </div>
          )}

          {/* TAG / TAG_NEW */}
          {isTagStep && currentTagCareer && (
            <div className="flp-tag-screen" key={currentTagCareer.id}>
              <div className="flp-tag-career-name">{currentTagCareer.label}</div>
              <div className="flp-tag-prompt">When you picture doing this every day, what does your body do?</div>
              <div className="flp-tag-buttons">
                {STATES.map((s, i) => { const m = STATE_META[s]; return (
                  <button key={s} className="flp-tag-btn" style={{ borderColor: m.color, color: m.color }} onClick={() => tagCareer(s)}>
                    <span className="flp-tag-key">{i + 1}</span><span className="flp-tag-btn-emoji">{m.emoji}</span>
                    <span className="flp-tag-btn-label">{m.label}</span><span className="flp-tag-btn-felt">{m.felt}</span>
                  </button>) })}
              </div>
              <div style={{ fontSize: 12, opacity: 0.3, marginTop: 4 }}>{taggedSoFar + 1} of {tagTotal}</div>
            </div>
          )}

          {/* ── MAP: pick a career ── */}
          {step === STEPS.MAP && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">Which career path pulls you most?</div>
              <div className="flp-wahoo-career-list">
                {careers.filter(c => c.predictedState).map(c => {
                  const spCount = stuckPoints.filter(sp => sp.careerId === c.id).length
                  const wsCount = (wahooSteps[c.id] || []).length
                  return (
                    <div key={c.id} className={`flp-wahoo-career ${selectedWahooId === c.id ? 'active' : ''}`}
                      onClick={() => { setSelectedWahooId(c.id); setHighlightId(c.id) }}>
                      <div className="flp-wahoo-dot" style={{ background: stateColor(c.predictedState) }} />
                      <span style={{ flex: 1 }}>{c.label}</span>
                      {(spCount > 0 || wsCount > 0) && (
                        <span style={{ fontSize: 11, opacity: 0.35 }}>{spCount > 0 ? `${spCount} blocks` : ''}{spCount > 0 && wsCount > 0 ? ', ' : ''}{wsCount > 0 ? `${wsCount} steps` : ''}</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {selectedWahooId && (
                <button className="flp-advance-btn" onClick={() => setStep(STEPS.STUCK)} style={{ marginTop: 12 }}>
                  Break it down →
                </button>
              )}
            </div>
          )}

          {/* ── STUCK: what have you been avoiding? ── */}
          {step === STEPS.STUCK && selectedWahooId && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">
                What have you wanted to do to get closer to "{careers.find(c => c.id === selectedWahooId)?.label}" but haven't yet?
              </div>
              <div className="flp-input-row">
                <input ref={stuckInputRef} className="flp-input" type="text" value={stuckInput}
                  onChange={e => { setStuckInput(e.target.value); if (e.target.value) { setActiveReasonId(null); clearTimeout(reasonTimerRef.current) } }}
                  onKeyDown={e => { if (e.key === 'Enter' && stuckInput.trim()) addStuckPoint(false) }}
                  placeholder="Something you've been putting off..." />
                <button className="flp-input-submit" onClick={() => addStuckPoint(false)} disabled={!stuckInput.trim()}>Add</button>
              </div>
              <div className="flp-career-list-display" style={{ marginTop: 8 }}>
                {careerStuckPoints.filter(sp => !sp.fromSpring).map(sp => (
                  <div key={sp.id}>
                    <div className="flp-career-list-item">
                      <span className="flp-career-list-name">{sp.text}</span>
                      {sp.reason && <span style={{ fontSize: 12, opacity: 0.5 }}>{sp.reasonEmoji} {sp.reasonLabel}</span>}
                      <span className="flp-pill-remove" onClick={() => removeStuckPoint(sp.id)}>✕</span>
                    </div>
                    {activeReasonId === sp.id && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '4px 8px 8px', animation: 'flpFadeIn 0.3s ease' }}>
                        {STUCK_REASONS.map(r => (
                          <button key={r.id} onClick={() => setStuckReason(sp.id, r)}
                            style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                              color: 'inherit', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.6, transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.6}>
                            {r.emoji} {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {careerStuckPoints.filter(sp => !sp.fromSpring).length > 0 && (
                <button className="flp-advance-btn" onClick={() => setStep(STEPS.STUCK_SPRING)} style={{ marginTop: 12 }}>
                  That's all I can think of →
                </button>
              )}
            </div>
          )}

          {/* ── STUCK_SPRING: push for more ── */}
          {step === STEPS.STUCK_SPRING && selectedWahooId && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">
                Is that really all? What are all the moments you felt inspired to do something but didn't end up actually doing it?
              </div>
              <div className="flp-input-row">
                <input ref={stuckInputRef} className="flp-input" type="text" value={stuckInput}
                  onChange={e => { setStuckInput(e.target.value); if (e.target.value) { setActiveReasonId(null); clearTimeout(reasonTimerRef.current) } }}
                  onKeyDown={e => { if (e.key === 'Enter' && stuckInput.trim()) addStuckPoint(true) }}
                  placeholder="Actually, also..." />
                <button className="flp-input-submit" onClick={() => addStuckPoint(true)} disabled={!stuckInput.trim()}>Add</button>
              </div>
              <div className="flp-career-list-display" style={{ marginTop: 8 }}>
                {careerStuckPoints.filter(sp => sp.fromSpring).map(sp => (
                  <div key={sp.id}>
                    <div className="flp-career-list-item">
                      <span className="flp-career-list-name">{sp.text}</span>
                      {sp.reason && <span style={{ fontSize: 12, opacity: 0.5 }}>{sp.reasonEmoji} {sp.reasonLabel}</span>}
                      <span className="flp-pill-remove" onClick={() => removeStuckPoint(sp.id)}>✕</span>
                    </div>
                    {activeReasonId === sp.id && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '4px 8px 8px', animation: 'flpFadeIn 0.3s ease' }}>
                        {STUCK_REASONS.map(r => (
                          <button key={r.id} onClick={() => setStuckReason(sp.id, r)}
                            style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                              color: 'inherit', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: 0.6, transition: 'opacity 0.15s' }}
                            onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.6}>
                            {r.emoji} {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button className="flp-advance-btn" onClick={() => setStep(STEPS.WAHOOS)} style={{ marginTop: 12 }}>
                {careerStuckPoints.filter(sp => sp.fromSpring).length > 0 ? "That's everything →" : "Skip, no more →"}
              </button>
            </div>
          )}

          {/* ── WAHOOS with stuck point bubbles ── */}
          {step === STEPS.WAHOOS && selectedWahooId && (
            <>
              <div className="flp-panel-step-prompt" style={{ fontSize: 14, marginBottom: 4 }}>
                If we broke down living the "{careers.find(c => c.id === selectedWahooId)?.label}" life path into tiny steps, what are they?
              </div>

              {/* Stuck point bubbles */}
              {stuckPointsNotInWahoos.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Things you've been putting off</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {stuckPointsNotInWahoos.map(sp => (
                      <button key={sp.id} onClick={() => moveStuckToWahoo(sp.id)}
                        style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(233,162,59,0.3)', background: 'rgba(233,162,59,0.08)',
                          color: '#E9A23B', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {sp.text} {sp.reasonEmoji || ''}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.25, marginTop: 4 }}>↑ Tap to add as a step</div>
                </div>
              )}

              {/* Wahoo steps list */}
              <div className="flp-wahoo-steps">
                {(wahooSteps[selectedWahooId] || []).map((ws, i) => (
                  <div key={i} className="flp-wahoo-step">
                    <button className={`flp-wahoo-check ${ws.done ? 'done' : ''}`} onClick={() => toggleWahooStep(selectedWahooId, i)}>
                      {ws.done ? '✓' : ''}
                    </button>
                    <span className={`flp-wahoo-step-text ${ws.done ? 'done' : ''}`}>{ws.text}</span>
                    <span className="flp-pill-remove" onClick={() => removeWahooStep(selectedWahooId, i)}>✕</span>
                  </div>
                ))}
              </div>

              <div className="flp-input-row" style={{ marginTop: 12 }}>
                <input ref={wahooInputRef} className="flp-input flp-input-sm" type="text" value={wahooInput}
                  onChange={e => setWahooInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWahooStep()}
                  placeholder="One small step..." />
                <button className="flp-input-submit" onClick={addWahooStep} disabled={!wahooInput.trim()}>Add</button>
              </div>

              <button className="flp-advance-btn" style={{ width: '100%', marginTop: 16 }}
                onClick={async () => {
                  const saved = await saveWahoosToGroan()
                  // Build groan ID lookup from returned entries (avoids stale closure)
                  const groanIdByIdx = {}
                  saved.forEach(({ idx, groanId }) => { groanIdByIdx[idx] = groanId })
                  // Create quest if one doesn't exist for this career
                  if (user?.id && selectedWahooId) {
                    const career = careers.find(c => c.id === selectedWahooId)
                    if (career) {
                      const { data: existing } = await supabase.from('quests')
                        .select('id').eq('user_id', user.id).eq('career_id', selectedWahooId).limit(1)
                      let questId = existing?.[0]?.id
                      if (!questId) {
                        const { data: newQuest } = await supabase.from('quests').insert({
                          user_id: user.id, label: career.label, career_id: selectedWahooId,
                          predicted_state: career.predictedState, status: 'active',
                        }).select('id').single()
                        questId = newQuest?.id
                      }
                      if (questId) {
                        // Get existing task texts to prevent duplicates
                        const { data: existingTasks } = await supabase.from('quest_tasks')
                          .select('text').eq('quest_id', questId)
                        const existingTexts = new Set((existingTasks || []).map(t => t.text.toLowerCase()))
                        const steps = wahooSteps[selectedWahooId] || []
                        const newTasks = steps.filter(ws => !existingTexts.has(ws.text.toLowerCase()))
                        if (newTasks.length > 0) {
                          await supabase.from('quest_tasks').insert(newTasks.map((ws, i) => {
                            // Use groan ID from returned entries (fresh), fall back to state (for previously saved)
                            const origIdx = steps.indexOf(ws)
                            const groanId = groanIdByIdx[origIdx] || ((typeof ws.savedToGroan === 'string') ? ws.savedToGroan : null)
                            return {
                              quest_id: questId, user_id: user.id, text: ws.text,
                              is_courage_challenge: !!groanId || !!ws.savedToGroan,
                              groan_challenge_id: groanId,
                              stuck_point_id: ws.fromStuckPoint || null,
                              sort_order: (existingTasks?.length || 0) + i,
                            }
                          }))
                        }
                      }
                    }
                  }
                  setTimeout(() => { saveRef.current({ step: 'complete' }); setStep(STEPS.COMPLETE) }, 200)
                }}>
                Save & finish →
              </button>
            </>
          )}

          {/* COMPLETE */}
          {step === STEPS.COMPLETE && (
            <div className="flp-reading-panel">
              <div className="flp-punchline visible"><p>Your life path map is saved.</p></div>
              <div style={{ fontSize: 14, opacity: 0.5, lineHeight: 1.6, maxWidth: 320, textAlign: 'center', marginTop: 8 }}>
                <p style={{ margin: '0 0 10px' }}>This app is designed to help you unlock the life paths above where you are now.</p>
                <p style={{ margin: 0 }}>Your wahoos expand what feels possible. Your healing work removes what's been holding you back.</p>
              </div>
              <button className="flp-advance-btn" onClick={() => navigate('/7-day-challenge')} style={{ marginTop: 16 }}>
                Back to challenge →
              </button>
              <button className="flp-advance-btn" onClick={() => setStep(STEPS.MAP)} style={{ marginTop: 8, opacity: 0.5, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'inherit' }}>
                Explore another career path
              </button>
            </div>
          )}

          {/* Cancel for input steps */}
          {(step === STEPS.ENTER || step === STEPS.SPRING) && (
            <div style={{ marginTop: 'auto' }}>
              <button className="flp-reset-btn" onClick={() => navigate('/7-day-challenge')}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
