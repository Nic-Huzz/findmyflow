import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import LifePathMap from '../components/LifePathMap/LifePathMap'
import { STATES, STATE_META, stateColor, stateY } from '../components/LifePathMap/lifePaths'
import { supabase } from '../lib/supabaseClient'
import './FacilitateLifePaths.css'

const STEPS = {
  CLIENT: 'client',
  CURRENT: 'current',
  ENTER: 'enter',
  TAG: 'tag',
  SPRING: 'spring',
  TAG_NEW: 'tag_new',
  READING: 'reading',
  WAHOOS: 'wahoos',
  COMPLETE: 'complete',
}

const STEP_ORDER = Object.values(STEPS)
let nextId = 1

export default function FacilitateLifePaths() {
  const [step, setStep] = useState(STEPS.CLIENT)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [currentCareer, setCurrentCareer] = useState(null) // { label, state }
  const [theme, setTheme] = useState('dark')
  const [careers, setCareers] = useState([])
  const [safety, setSafety] = useState(0)
  const [input, setInput] = useState('')
  const [tagTotal, setTagTotal] = useState(0)
  const [panelHidden, setPanelHidden] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showPunchline, setShowPunchline] = useState(false)
  const [showPunchline2, setShowPunchline2] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [pulseActive, setPulseActive] = useState(false)
  const [highlightId, setHighlightId] = useState(null)
  const [selectedWahooId, setSelectedWahooId] = useState(null)
  const [wahooSteps, setWahooSteps] = useState({})
  const [wahooInput, setWahooInput] = useState('')
  const [springReady, setSpringReady] = useState(false)
  const inputRef = useRef(null)
  const wahooInputRef = useRef(null)

  // Derived lists
  const taggedCareers = careers.filter(c => c.predictedState)

  // Careers awaiting tagging: realistic first, then non-realistic
  const careersToTag = useMemo(() => {
    if (step === STEPS.TAG) {
      return careers.filter(c => !c.enteredInSpring && !c.predictedState)
    }
    if (step === STEPS.TAG_NEW) {
      return careers.filter(c => c.enteredInSpring && !c.predictedState)
    }
    return []
  }, [careers, step])

  const currentTagCareer = careersToTag[0] || null

  const stepIndex = STEP_ORDER.indexOf(step)

  // Show punchline when there are careers across different states
  const hasGapPattern = taggedCareers.length >= 2

  // ── Effects ──
  useEffect(() => {
    if (step === STEPS.CLIENT || step === STEPS.CURRENT || step === STEPS.ENTER) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [step])

  // Spring input appears after 2s delay, focus it when it renders
  useEffect(() => {
    if (step === STEPS.SPRING && springReady) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [step, springReady])

  useEffect(() => {
    if (step === STEPS.SPRING) {
      setSpringReady(false)
      const timer = setTimeout(() => setSpringReady(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [step])

  useEffect(() => {
    if (step === STEPS.READING) {
      setPanelHidden(false)
      setShowPunchline(false)
      setShowPunchline2(false)
      setShowContinue(false)
      const punchTimer = setTimeout(() => setShowPunchline(true), 1500)
      const punch2Timer = setTimeout(() => setShowPunchline2(true), 4000)
      const contTimer = setTimeout(() => setShowContinue(true), 7000)
      return () => { clearTimeout(punchTimer); clearTimeout(punch2Timer); clearTimeout(contTimer) }
    } else {
      setShowPunchline(false)
      setShowPunchline2(false)
      setShowContinue(false)
      if (step === STEPS.WAHOOS) setPanelHidden(false)
    }
  }, [step])

  useEffect(() => {
    setHighlightId(currentTagCareer?.id || null)
  }, [currentTagCareer])

  // ── Auto-save to Supabase after each step transition ──
  const saveSession = useCallback(async (overrides = {}) => {
    if (!clientName.trim()) return
    const data = {
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      current_career: currentCareer?.label || null,
      current_state: currentCareer?.state || null,
      careers: careers.map(c => ({
        id: c.id, label: c.label, predictedState: c.predictedState,
        enteredInSpring: c.enteredInSpring,
      })),
      wahoo_steps: wahooSteps,
      safety,
      step,
      updated_at: new Date().toISOString(),
      ...overrides,
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
    } catch (e) {
      console.error('Life path save error:', e)
    }
  }, [clientName, clientEmail, currentCareer, careers, wahooSteps, safety, step, sessionId])

  // Save on meaningful changes (debounced)
  const saveRef = useRef(saveSession)
  saveRef.current = saveSession

  const wahooCount = Object.values(wahooSteps).reduce((sum, arr) => sum + arr.length, 0)
  useEffect(() => {
    if (step === STEPS.CLIENT || !clientName.trim()) return
    const timer = setTimeout(() => saveRef.current(), 500)
    return () => clearTimeout(timer)
  }, [step, taggedCareers.length, safety, wahooCount, clientName])

  // ── Actions ──
  const addCareer = useCallback((label, fromSpring = false) => {
    if (!label.trim()) return
    setCareers(prev => [...prev, {
      id: 'c' + nextId++,
      label: label.trim(),
      predictedState: null,
      livedState: null,
      realistic: false,
      enteredInSpring: fromSpring,
      animateIn: fromSpring,
    }])
    setInput('')
  }, [])

  const tagCareer = useCallback((stateKey) => {
    if (!currentTagCareer) return
    setCareers(prev => prev.map(c =>
      c.id === currentTagCareer.id ? { ...c, predictedState: stateKey, animateIn: false } : c
    ))
    // If this was the last one, advance
    if (careersToTag.length <= 1) {
      if (step === STEPS.TAG) setStep(STEPS.SPRING)
      else if (step === STEPS.TAG_NEW) setStep(STEPS.READING)
    }
  }, [currentTagCareer, careersToTag.length, step])

  const removeCareer = useCallback((id) => {
    setCareers(prev => prev.filter(c => c.id !== id))
  }, [])

  const advanceFromEnter = useCallback(() => {
    if (careers.length === 0) return
    setTagTotal(careers.filter(c => !c.enteredInSpring && !c.predictedState).length)
    setStep(STEPS.TAG)
  }, [careers])

  const advanceFromSpring = useCallback(() => {
    const springCareers = careers.filter(c => c.enteredInSpring === true)
    if (springCareers.length === 0) {
      setStep(STEPS.READING)
    } else {
      setTagTotal(springCareers.filter(c => !c.predictedState).length)
      setStep(STEPS.TAG_NEW)
    }
  }, [careers])

  const advanceFromReading = useCallback(() => {
    setPanelHidden(false)
    setStep(STEPS.WAHOOS)
  }, [])

  const doReset = useCallback(() => {
    // Save final state before resetting
    saveRef.current()
    setCareers([])
    setSafety(0)
    setStep(STEPS.CLIENT)
    setClientName('')
    setClientEmail('')
    setSessionId(null)
    setCurrentCareer(null)
    setTagTotal(0)
    setInput('')
    setPanelHidden(false)
    setShowPunchline(false)
    setShowPunchline2(false)
    setShowContinue(false)
    setSelectedWahooId(null)
    setWahooSteps({})
    setWahooInput('')
    nextId = 1
  }, [])

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

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur()
        return
      }
      if (showShortcuts) { setShowShortcuts(false); return }
      switch (e.key) {
        case '?': setShowShortcuts(true); break
        case 'h': case 'H': setPanelHidden(p => !p); break
        case 'r': case 'R': if (e.shiftKey) doReset(); break
        case 'ArrowRight':
          if (step === STEPS.CURRENT && currentCareer?.state) setStep(STEPS.ENTER)
          else if (step === STEPS.ENTER) advanceFromEnter()
          else if (step === STEPS.SPRING) advanceFromSpring()
          else if (step === STEPS.READING) advanceFromReading()
          break
        case '1': case '2': case '3': case '4':
          if (step === STEPS.CURRENT && currentCareer && !currentCareer.state) {
            const stateKey = STATES[parseInt(e.key) - 1]
            if (stateKey) setCurrentCareer(prev => ({ ...prev, state: stateKey }))
          } else if (step === STEPS.TAG || step === STEPS.TAG_NEW) {
            const stateKey = STATES[parseInt(e.key) - 1]
            if (stateKey) tagCareer(stateKey)
          }
          break
        case 'Escape': setShowShortcuts(false); break
        default: break
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [step, showShortcuts, currentCareer, advanceFromEnter, advanceFromSpring, advanceFromReading, tagCareer, doReset])

  // Map careers: show tagged careers + untagged during spring/tag steps
  // Include a synthetic career for the current career (realistic: true, anchors the cone)
  const mapCareers = useMemo(() => {
    const visible = careers.filter(c => {
      if (c.predictedState) return true
      if ((step === STEPS.SPRING || step === STEPS.TAG_NEW) && c.enteredInSpring) return true
      return false
    })
    // Add a synthetic "anchor" career for cone computation only.
    // This career is realistic: true so the cone forms around the current career's state.
    // It renders as a branch from trunk to its own state Y (which equals trunkY),
    // so it appears as a flat line with a dot — effectively just a marker at the trunk.
    if (currentCareer?.state) {
      visible.push({
        id: 'current',
        label: currentCareer.label,
        predictedState: currentCareer.state,
        livedState: null,
        realistic: true,
        animateIn: false,
        isCurrent: true,
      })
    }
    return visible
  }, [careers, step, currentCareer])

  const isReading = step === STEPS.READING
  const isTagStep = step === STEPS.TAG || step === STEPS.TAG_NEW

  // Trunk Y position: based on current career's state, or default center
  const trunkY = currentCareer?.state ? stateY(currentCareer.state) : undefined

  // Count for tag progress display
  const taggedSoFar = tagTotal - careersToTag.length

  // ── Spring prompt text ──
  const enteredCount = careers.filter(c => !c.enteredInSpring).length
  const springPromptText = `Out of every career that exists... only ${enteredCount === 1 ? 'that one' : `these ${enteredCount}`}?`

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
            <button className="flp-shortcut-btn" onClick={() => setShowShortcuts(true)}>?</button>
            <button className="flp-theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <div className="flp-map-svg">
          <LifePathMap
            careers={mapCareers}
            safety={safety}
            walkProgress={0}
            theme={theme}
            pulseActive={pulseActive}
            showZoneLabels={taggedCareers.length >= 2}
            highlightId={highlightId}
            trunkY={trunkY}
          />
        </div>


        {/* ── Desktop-only map overlays ── */}
        <div className="flp-desktop-only">
          {step === STEPS.CLIENT && (
            <div className="flp-prompt-overlay">
              <div className="flp-prompt-text">Who is this session for?</div>
            </div>
          )}

          {step === STEPS.CURRENT && !currentCareer && (
            <div className="flp-prompt-overlay">
              <div className="flp-prompt-text">What do you currently do?</div>
            </div>
          )}

          {step === STEPS.ENTER && (
            <div className={`flp-prompt-overlay ${careers.length > 0 ? 'flp-prompt-compact' : ''}`}>
              <div className="flp-prompt-text">
                What are all the career options available to you?
              </div>
            </div>
          )}

          {step === STEPS.SPRING && (
            <div className={`flp-prompt-overlay ${springReady ? 'flp-prompt-compact' : ''}`}>
              <div className="flp-prompt-text">
                {springPromptText}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Controls panel ── */}
      <div className={`flp-panel ${panelHidden ? 'hidden' : ''}`}>
        <div className="flp-panel-inner">

          {/* ── CLIENT step ── */}
          {step === STEPS.CLIENT && (
            <div className="flp-tag-screen">
              <div className="flp-tag-prompt">Who is this session for?</div>
              <div className="flp-input-row">
                <input
                  ref={inputRef}
                  className="flp-input"
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && clientName.trim()) {
                      document.getElementById('flp-client-email')?.focus()
                    }
                  }}
                  placeholder="Name..."
                />
              </div>
              <div className="flp-input-row">
                <input
                  id="flp-client-email"
                  className="flp-input"
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && clientName.trim()) setStep(STEPS.CURRENT)
                  }}
                  placeholder="Email (optional)..."
                />
              </div>
              <button
                className="flp-advance-btn"
                onClick={() => setStep(STEPS.CURRENT)}
                disabled={!clientName.trim()}
              >
                Start session →
              </button>
            </div>
          )}

          {/* ── CURRENT step (both mobile + desktop) ── */}
          {step === STEPS.CURRENT && (
            <div className="flp-tag-screen">
              {!currentCareer ? (
                <>
                  <div className="flp-tag-prompt">What do you currently do?</div>
                  <div className="flp-input-row">
                    <input
                      ref={inputRef}
                      className="flp-input"
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && input.trim()) {
                          setCurrentCareer({ label: input.trim(), state: null })
                          setInput('')
                        }
                      }}
                      placeholder="e.g. Marketing manager..."
                    />
                    <button
                      className="flp-input-submit"
                      onClick={() => { if (input.trim()) { setCurrentCareer({ label: input.trim(), state: null }); setInput('') } }}
                      disabled={!input.trim()}
                    >
                      →
                    </button>
                  </div>
                </>
              ) : !currentCareer.state ? (
                <>
                  <div className="flp-tag-career-name">{currentCareer.label}</div>
                  <div className="flp-tag-prompt">And how does it make you feel?</div>
                  <div className="flp-tag-buttons">
                    {STATES.map((s, i) => {
                      const m = STATE_META[s]
                      return (
                        <button
                          key={s}
                          className="flp-tag-btn"
                          style={{ borderColor: m.color, color: m.color }}
                          onClick={() => setCurrentCareer(prev => ({ ...prev, state: s }))}
                        >
                          <span className="flp-tag-key">{i + 1}</span>
                          <span className="flp-tag-btn-emoji">{m.emoji}</span>
                          <span className="flp-tag-btn-label">{m.label}</span>
                          <span className="flp-tag-btn-felt">{m.felt}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="flp-tag-career-name">{currentCareer.label}</div>
                  <div className="flp-current-feeling">
                    Currently feeling: {STATE_META[currentCareer.state]?.emoji} {STATE_META[currentCareer.state]?.label}
                  </div>
                  <button className="flp-advance-btn" onClick={() => setStep(STEPS.ENTER)}>
                    Now let's see what else is available →
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Input steps (all viewports) ── */}
          {step === STEPS.ENTER && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">
                What are all the career options available to you?
              </div>
              <div className="flp-input-row">
                <input
                  ref={inputRef}
                  className="flp-input"
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && input.trim()) addCareer(input)
                    else if (e.key === 'Backspace' && input === '' && careers.length > 0) removeCareer(careers[careers.length - 1].id)
                  }}
                  placeholder="Type a career..."
                />
                <button
                  className="flp-input-submit"
                  onClick={() => { if (input.trim()) addCareer(input) }}
                  disabled={!input.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {step === STEPS.SPRING && (
            <div className="flp-panel-step">
              <div className="flp-panel-step-prompt">
                {springPromptText}
              </div>
              {springReady && (
                <>
                  <div className="flp-input-row">
                    <input
                      ref={inputRef}
                      className="flp-input"
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && input.trim()) addCareer(input, true)
                        else if (e.key === 'Backspace' && input === '') {
                          const springList = careers.filter(c => c.enteredInSpring)
                          if (springList.length > 0) removeCareer(springList[springList.length - 1].id)
                        }
                      }}
                      placeholder="Actually, also..."
                    />
                    <button
                      className="flp-input-submit"
                      onClick={() => { if (input.trim()) addCareer(input, true) }}
                      disabled={!input.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {!careers.some(c => c.enteredInSpring) && (
                    <button className="flp-advance-btn" onClick={advanceFromSpring} style={{ alignSelf: 'center', marginTop: 8, opacity: 0.6 }}>
                      Skip, no more →
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Career list (ENTER + SPRING steps) ── */}
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
                <button className="flp-advance-btn" onClick={advanceFromEnter} style={{ alignSelf: 'center', marginTop: 12 }}>
                  That's all they can think of →
                </button>
              </div>
            </div>
          )}

          {step === STEPS.SPRING && springReady && careers.some(c => c.enteredInSpring) && (
            <div style={{ marginBottom: 16 }}>
              <div className="flp-career-list-display">
                {careers.filter(c => c.enteredInSpring).map((c, i) => (
                  <div key={c.id} className="flp-career-list-item">
                    <span className="flp-career-list-num">{i + 1}.</span>
                    <span className="flp-career-list-name">{c.label}</span>
                    <span className="flp-pill-remove" onClick={() => removeCareer(c.id)}>✕</span>
                  </div>
                ))}
                <button className="flp-advance-btn" onClick={advanceFromSpring} style={{ alignSelf: 'center', marginTop: 8 }}>
                  That's all of them →
                </button>
              </div>
            </div>
          )}

          {/* ── Reading step (punchline in panel) ── */}
          {isReading && (
            <div className="flp-reading-panel">
              {hasGapPattern && (
                <>
                  <div className={`flp-punchline ${showPunchline ? 'visible' : ''}`}>
                    <p>We don't rise to the level of our ambitions.</p>
                    <p>We fall to the level that feels safe.</p>
                  </div>
                  <div className={`flp-punchline flp-punchline-2 ${showPunchline2 ? 'visible' : ''}`}>
                    Your current safety response is where you are now.<br />
                    Want help raising that level to the height of your ambitions?
                  </div>
                </>
              )}
              {showContinue && (
                <button className="flp-advance-btn" onClick={advanceFromReading} style={{ marginTop: 16 }}>
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* ── Tagging steps ── */}
          {isTagStep && currentTagCareer && (
            <div className="flp-tag-screen" key={currentTagCareer.id}>
              <div className="flp-tag-career-name">
                {currentTagCareer.label}
              </div>
              <div className="flp-tag-prompt">
                When you picture doing this every day, what does your body do?
              </div>
              <div className="flp-tag-buttons">
                {STATES.map((s, i) => {
                  const m = STATE_META[s]
                  return (
                    <button
                      key={s}
                      className="flp-tag-btn"
                      style={{ borderColor: m.color, color: m.color }}
                      onClick={() => tagCareer(s)}
                    >
                      <span className="flp-tag-key">{i + 1}</span>
                      <span className="flp-tag-btn-emoji">{m.emoji}</span>
                      <span className="flp-tag-btn-label">{m.label}</span>
                      <span className="flp-tag-btn-felt">{m.felt}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ fontSize: 12, opacity: 0.3, marginTop: 4 }}>
                {taggedSoFar + 1} of {tagTotal}
              </div>
            </div>
          )}

          {/* ── Wahoo step ── */}
          {step === STEPS.WAHOOS && (
            <>
              <div className="flp-panel-step-prompt">Which career path pulls you most?</div>
              <div className="flp-wahoo-career-list">
                {careers.filter(c => c.predictedState).map(c => (
                  <div
                    key={c.id}
                    className={`flp-wahoo-career ${selectedWahooId === c.id ? 'active' : ''}`}
                    onClick={() => { setSelectedWahooId(c.id); setHighlightId(c.id) }}
                  >
                    <div className="flp-wahoo-dot" style={{ background: stateColor(c.predictedState) }} />
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>

              {selectedWahooId && (
                <>
                  <div className="flp-panel-step-prompt" style={{ fontSize: 14, marginBottom: 4 }}>
                    If we broke down living the "{careers.find(c => c.id === selectedWahooId)?.label}" life path into tiny steps, what are they?
                  </div>
                  <div className="flp-wahoo-steps">
                    {(wahooSteps[selectedWahooId] || []).map((ws, i) => (
                      <div key={i} className="flp-wahoo-step">
                        <button
                          className={`flp-wahoo-check ${ws.done ? 'done' : ''}`}
                          onClick={() => toggleWahooStep(selectedWahooId, i)}
                        >
                          {ws.done ? '✓' : ''}
                        </button>
                        <span className={`flp-wahoo-step-text ${ws.done ? 'done' : ''}`}>
                          {ws.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flp-input-row" style={{ marginTop: 12 }}>
                    <input
                      ref={wahooInputRef}
                      className="flp-input flp-input-sm"
                      type="text"
                      value={wahooInput}
                      onChange={e => setWahooInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addWahooStep()}
                      placeholder="One small brave thing..."
                    />
                    <button
                      className="flp-input-submit"
                      onClick={addWahooStep}
                      disabled={!wahooInput.trim()}
                    >
                      Add
                    </button>
                  </div>
                </>
              )}

              <button className="flp-advance-btn" onClick={() => { saveRef.current(); setStep(STEPS.COMPLETE) }} style={{ width: '100%', marginTop: 16 }}>
                Save & finish →
              </button>
              <button className="flp-reset-btn" onClick={doReset}>
                Reset for next participant (Shift+R)
              </button>
            </>
          )}

          {/* ── Complete step ── */}
          {step === STEPS.COMPLETE && (
            <div className="flp-reading-panel">
              <div className="flp-punchline visible">
                <p>Session saved.</p>
              </div>
              <div className="flp-punchline flp-punchline-2 visible">
                {clientName}'s life path map has been saved.
              </div>
              <button className="flp-advance-btn" onClick={doReset} style={{ marginTop: 24 }}>
                New session →
              </button>
            </div>
          )}

          {/* Reset for input steps */}
          {(step === STEPS.ENTER || step === STEPS.SPRING) && (
            <div style={{ marginTop: 'auto' }}>
              <button className="flp-reset-btn" onClick={doReset}>Reset (Shift+R)</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Keyboard shortcuts overlay ── */}
      {showShortcuts && (
        <div className="flp-shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="flp-shortcuts-card" onClick={e => e.stopPropagation()}>
            <h3>Keyboard Shortcuts</h3>
            <div className="flp-shortcut-row"><span>Advance step</span><span className="flp-shortcut-key">→</span></div>
            <div className="flp-shortcut-row"><span>Tag: Vibe Rise</span><span className="flp-shortcut-key">1</span></div>
            <div className="flp-shortcut-row"><span>Tag: Fun</span><span className="flp-shortcut-key">2</span></div>
            <div className="flp-shortcut-row"><span>Tag: Stressful</span><span className="flp-shortcut-key">3</span></div>
            <div className="flp-shortcut-row"><span>Tag: Bored</span><span className="flp-shortcut-key">4</span></div>
            <div className="flp-shortcut-row"><span>Toggle panel</span><span className="flp-shortcut-key">H</span></div>
            <div className="flp-shortcut-row"><span>Reset</span><span className="flp-shortcut-key">Shift+R</span></div>
            <div className="flp-shortcut-row"><span>This overlay</span><span className="flp-shortcut-key">?</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
