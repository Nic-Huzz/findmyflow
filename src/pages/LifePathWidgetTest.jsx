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
import { hapticLight } from '../lib/haptics'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import './FacilitateLifePaths.css'

const STEPS = {
  INTRO: 'intro',
  CURRENT: 'current',
  SUGGESTIONS: 'suggestions',
  ENTER: 'enter',
  TAG: 'tag',
  SPRING: 'spring',
  TAG_NEW: 'tag_new',
  READING: 'reading',
  MAP: 'map',
  SELECT_QUESTS: 'select_quests',
  STUCK_ALL: 'stuck_all',
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
  const [theme, setTheme] = useState('light')
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
  const [selectedQuestIds, setSelectedQuestIds] = useState(new Set())
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

  // AI suggestions
  const [suggestedPaths, setSuggestedPaths] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set())

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
          // Resume at saved step, or MAP if completed. Map old step names to new.
          const stepMap = { stuck: 'select_quests', stuck_spring: 'select_quests', wahoos: 'select_quests', courage_tag: 'select_quests' }
          const rawStep = data.step === 'complete' ? STEPS.MAP : (stepMap[data.step] || data.step)
          const savedStep = STEPS[rawStep?.toUpperCase()] || rawStep
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
    if (step === STEPS.STUCK_ALL) {
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

  // Fetch AI suggestions when entering SUGGESTIONS step
  useEffect(() => {
    if (step !== STEPS.SUGGESTIONS || suggestedPaths.length > 0) return
    ;(async () => {
      setSuggestionsLoading(true)
      try {
        // Fetch curiosity clusters + life map skills/problems
        const [{ data: clusters }, { data: skillsData }, { data: problemsData }] = await Promise.all([
          supabase.from('curiosity_clusters').select('cluster_name, branch, why').eq('user_id', user.id),
          supabase.from('nikigai_clusters').select('cluster_label').eq('user_id', user.id).eq('cluster_type', 'skills').eq('cluster_stage', 'final'),
          supabase.from('nikigai_clusters').select('cluster_label').eq('user_id', user.id).eq('cluster_type', 'problems').eq('cluster_stage', 'final'),
        ])

        const hasData = clusters?.length || skillsData?.length || problemsData?.length
        if (!hasData) {
          // No data to suggest from — skip to manual entry
          setStep(STEPS.ENTER)
          setSuggestionsLoading(false)
          return
        }

        const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
          body: {
            curiosityClusters: clusters || [],
            skills: (skillsData || []).map(s => s.cluster_label),
            problems: (problemsData || []).map(p => p.cluster_label),
          },
        })

        if (error) throw error
        if (data?.paths?.length) setSuggestedPaths(data.paths)
      } catch (err) {
        console.error('Path suggestions failed:', err)
        // AI failed — skip to manual entry rather than showing misleading "no data" message
        setStep(STEPS.ENTER)
      }
      setSuggestionsLoading(false)
    })()
  }, [step, suggestedPaths.length, user?.id])

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

  // wahooInputRef focus removed — WAHOOS step no longer exists

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
  // currentStuckCareerId tracks which career section the user is typing in on STUCK_ALL
  const [currentStuckCareerId, setCurrentStuckCareerId] = useState(null)

  const addStuckPoint = useCallback((careerId) => {
    if (!stuckInput.trim() || !careerId) return
    const newSp = {
      id: 'sp' + spNextId++,
      careerId,
      text: stuckInput.trim(),
      reason: null,
      reasonLabel: null,
      reasonEmoji: null,
      fromSpring: false,
      addedToWahoos: false,
    }
    setStuckPoints(prev => [...prev, newSp])
    setStuckInput('')
    setActiveReasonId(newSp.id)
    setTimeout(() => stuckInputRef.current?.focus(), 50)
  }, [stuckInput])

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
      [selectedWahooId]: [...(prev[selectedWahooId] || []), { text: sp.text, done: false, isCourage: false, fromStuckPoint: spId }],
    }))
  }, [stuckPoints, selectedWahooId])

  // ── Wahoo actions ──
  const addWahooStep = useCallback(() => {
    if (!wahooInput.trim() || !selectedWahooId) return
    setWahooSteps(prev => ({
      ...prev,
      [selectedWahooId]: [...(prev[selectedWahooId] || []), { text: wahooInput.trim(), done: false, isCourage: false }],
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
      if (ws.savedToGroan || !ws.isCourage) continue
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

  if (loading) return <div className="flp-page light" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ opacity: 0.3 }}>Loading...</div></div>

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
                  <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', letterSpacing: '0.5px', marginBottom: 12 }}>{currentCareer.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', marginBottom: 8 }}>Your body has four modes.</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[...STATES].reverse().map(s => {
                      const m = STATE_META[s]
                      const isActive = s === currentCareer.state
                      return (
                        <div key={s} style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: isActive ? 600 : 400,
                          background: isActive ? `${m.color}20` : 'rgba(0,0,0,0.04)',
                          color: isActive ? m.color : 'rgba(0,0,0,0.35)',
                          border: isActive ? `1px solid ${m.color}40` : '1px solid rgba(0,0,0,0.08)',
                        }}>
                          {m.emoji} {m.label}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.55)', lineHeight: 1.7, maxWidth: 300, textAlign: 'center', marginBottom: 20 }}>
                    <p style={{ margin: '0 0 8px' }}>The one you spend the most time in decides which life paths feel possible.</p>
                    <p style={{ margin: 0 }}>Right now, you're walking the <span style={{ color: STATE_META[currentCareer.state]?.color }}>{STATE_META[currentCareer.state]?.label}</span> path.</p>
                  </div>
                  <button className="flp-advance-btn" onClick={() => setStep(STEPS.SUGGESTIONS)}>What else is out there? →</button>
                </>
              )}
            </div>
          )}

          {/* SUGGESTIONS */}
          {step === STEPS.SUGGESTIONS && (
            <div className="flp-panel-step">
              {suggestionsLoading ? (
                <>
                  <div className="flp-panel-step-prompt">Finding paths that match your curiosities...</div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                </>
              ) : suggestedPaths.length > 0 ? (
                <>
                  <div className="flp-panel-step-prompt">Based on your curiosities and skills, these paths might light you up.</div>
                  <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', fontStyle: 'italic', marginBottom: 12 }}>Tap any that resonate. You can also add your own on the next screen.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {suggestedPaths.map((path, i) => {
                      const selected = selectedSuggestions.has(i)
                      return (
                        <button key={i} onClick={() => {
                          hapticLight()
                          setSelectedSuggestions(prev => {
                            const next = new Set(prev)
                            if (next.has(i)) { next.delete(i); const match = careers.find(c => c.label === path.name); if (match) removeCareer(match.id) }
                            else { next.add(i); addCareer(path.name) }
                            return next
                          })
                        }} style={{
                          textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                          border: selected ? '2px solid #E9A23B' : '1px solid rgba(0,0,0,0.1)',
                          background: selected ? 'rgba(233,162,59,0.08)' : 'white',
                          transition: 'all 0.2s',
                          color: '#1a1a2e',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16, flexShrink: 0, color: selected ? '#E9A23B' : 'rgba(0,0,0,0.25)' }}>{selected ? '\u2713' : '\u{25CB}'}</span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#E9A23B' : '#1a1a2e' }}>{path.name}</div>
                              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', lineHeight: 1.4, marginTop: 2 }}>{path.description}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <button className="flp-advance-btn" onClick={() => setStep(STEPS.ENTER)}>
                    {selectedSuggestions.size > 0 ? `Continue with ${selectedSuggestions.size} selected →` : 'Skip, I\'ll add my own →'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flp-panel-step-prompt">What are all the career options available to you?</div>
                  <div style={{ fontSize: 13, opacity: 0.4, fontStyle: 'italic', marginBottom: 8 }}>Complete your Curiosity Map and Life Map for personalised suggestions.</div>
                  <button className="flp-advance-btn" onClick={() => setStep(STEPS.ENTER)}>Add paths manually →</button>
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
                    <p style={{ margin: '0 0 12px' }}>The golden cone on your map is where you feel safe right now. Everything outside it feels too risky.</p>
                    <p style={{ margin: 0 }}>Vibe Rise expands what feels possible.</p>
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

          {/* ── MAP / SELECT_QUESTS: multi-select careers to pursue ── */}
          {(step === STEPS.MAP || step === STEPS.SELECT_QUESTS) && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">Which of these do you want to actively pursue?</div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 12 }}>Pick as many as feel right. We recommend 1-3 to start.</div>
              <div className="flp-wahoo-career-list">
                {careers.filter(c => c.predictedState).map(c => {
                  const isSelected = selectedQuestIds.has(c.id)
                  return (
                    <div key={c.id} className={`flp-wahoo-career ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        hapticLight()
                        setSelectedQuestIds(prev => {
                          const next = new Set(prev)
                          if (next.has(c.id)) next.delete(c.id)
                          else next.add(c.id)
                          return next
                        })
                        setHighlightId(c.id)
                      }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{isSelected ? '✓' : '○'}</span>
                      <div className="flp-wahoo-dot" style={{ background: stateColor(c.predictedState) }} />
                      <span style={{ flex: 1 }}>{c.label}</span>
                    </div>
                  )
                })}
              </div>
              {selectedQuestIds.size > 0 && (
                <button className="flp-advance-btn" onClick={() => setStep(STEPS.STUCK_ALL)} style={{ marginTop: 12 }}>
                  Break these down →
                </button>
              )}
            </div>
          )}

          {/* ── STUCK_ALL: one screen, all selected careers ── */}
          {step === STEPS.STUCK_ALL && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">What have you been putting off?</div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 16 }}>For each path, add the things you've wanted to do but haven't yet. These become your courage challenges.</div>

              {careers.filter(c => selectedQuestIds.has(c.id)).map(c => {
                const cStuck = stuckPoints.filter(sp => sp.careerId === c.id)
                return (
                  <div key={c.id} style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div className="flp-wahoo-dot" style={{ background: stateColor(c.predictedState) }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{c.label}</span>
                    </div>

                    {/* Existing stuck points for this career */}
                    {cStuck.map(sp => (
                      <div key={sp.id} className="flp-career-list-item" style={{ background: 'white', borderRadius: 10, marginBottom: 4, padding: '8px 12px' }}>
                        <span className="flp-career-list-name">{sp.text}</span>
                        <span className="flp-pill-remove" onClick={() => removeStuckPoint(sp.id)}>✕</span>
                      </div>
                    ))}

                    {/* Input for this career */}
                    <div className="flp-input-row" style={{ marginTop: 6 }}>
                      <input className="flp-input" type="text"
                        ref={currentStuckCareerId === c.id ? stuckInputRef : undefined}
                        value={currentStuckCareerId === c.id ? stuckInput : ''}
                        onFocus={() => { setCurrentStuckCareerId(c.id); setSelectedWahooId(c.id) }}
                        onChange={e => { setCurrentStuckCareerId(c.id); setSelectedWahooId(c.id); setStuckInput(e.target.value) }}
                        onKeyDown={e => { if (e.key === 'Enter' && stuckInput.trim()) addStuckPoint(c.id) }}
                        placeholder="Something you've been putting off..." />
                      <button className="flp-input-submit" onClick={() => addStuckPoint(c.id)} disabled={currentStuckCareerId !== c.id || !stuckInput.trim()}>Add</button>
                    </div>
                  </div>
                )
              })}

              <button className="flp-advance-btn" style={{ width: '100%', marginTop: 8 }}
                onClick={async () => {
                  if (!user?.id) return
                  // Create quests + courage challenges for all selected careers
                  for (const careerId of selectedQuestIds) {
                    const career = careers.find(c => c.id === careerId)
                    if (!career) continue

                    // Upsert quest
                    const { data: existing } = await supabase.from('quests')
                      .select('id').eq('user_id', user.id).eq('career_id', careerId).limit(1)
                    let questId = existing?.[0]?.id
                    if (!questId) {
                      const { data: newQuest } = await supabase.from('quests').insert({
                        user_id: user.id, label: career.label, career_id: careerId,
                        predicted_state: career.predictedState, status: 'active',
                      }).select('id').single()
                      questId = newQuest?.id
                    }

                    // Create courage challenges from stuck points
                    if (questId) {
                      const careerStuck = stuckPoints.filter(sp => sp.careerId === careerId)
                      for (const sp of careerStuck) {
                        // Check for duplicate
                        const { data: existingGroan } = await supabase.from('groan_challenges')
                          .select('id').eq('user_id', user.id).eq('title', sp.text).limit(1)
                        let groanId = existingGroan?.[0]?.id
                        if (!groanId) {
                          const { data: newGroan } = await supabase.from('groan_challenges').insert({
                            user_id: user.id, title: sp.text, challenge_text: sp.text,
                            status: 'active', source_type: 'skill', challenge_source: 'life_paths',
                            scary_score: 5, wahoo_score: 5,
                            accepted_at: new Date().toISOString(),
                          }).select('id').single()
                          // Also create priority_weekly_pick so it appears on Courage tab
                          if (newGroan?.id) {
                            try {
                              await supabase.from('priority_weekly_picks').upsert({
                                user_id: user.id,
                                week_start_date: getWeekStartLocal(),
                                pick_type: 'groan',
                                reference_id: newGroan.id,
                                display_name: sp.text,
                              }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
                            } catch {}
                          }
                          groanId = newGroan?.id
                        }
                        if (groanId) {
                          // Check for existing task with same text on this quest
                          const { data: existingTask } = await supabase.from('quest_tasks')
                            .select('id').eq('quest_id', questId).eq('text', sp.text).limit(1)
                          if (!existingTask?.length) {
                            try {
                              await supabase.from('quest_tasks').insert({
                                quest_id: questId, user_id: user.id, text: sp.text,
                                is_courage_challenge: true, groan_challenge_id: groanId,
                                sort_order: careerStuck.indexOf(sp),
                              })
                            } catch {}
                          }
                        }
                      }
                    }
                  }
                  saveRef.current({ step: 'complete' })
                  setStep(STEPS.COMPLETE)
                }}>
                Save & finish →
              </button>
            </div>
          )}

          {/* COMPLETE */}
          {step === STEPS.COMPLETE && (
            <div className="flp-reading-panel">
              <div className="flp-punchline visible"><p>Your quests are ready.</p></div>
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: 1.6, maxWidth: 320, textAlign: 'center', marginTop: 8 }}>
                <p style={{ margin: '0 0 10px' }}>Your life paths are now active quests. The things you've been putting off are your courage challenges.</p>
                <p style={{ margin: 0 }}>Head to your Quests tab to see them.</p>
              </div>
              <button className="flp-advance-btn" onClick={() => navigate('/7-day-challenge?tab=Quests')} style={{ marginTop: 16 }}>
                Go to my quests →
              </button>
              <button className="flp-advance-btn" onClick={() => setStep(STEPS.MAP)} style={{ marginTop: 8, opacity: 0.5, background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#1a1a2e' }}>
                Explore the map
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
