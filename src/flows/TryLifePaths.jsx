import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import LifePathMap from '../components/LifePathMap/LifePathMap'
import { STATES, STATE_META, stateY } from '../components/LifePathMap/lifePaths'
import { supabase } from '../lib/supabaseClient'
import PublicEmailGate from '../components/PublicEmailGate'
import './TryLifePaths.css'

const STEPS = {
  HOOK: 'hook',
  CURRENT: 'current',
  ENTER: 'enter',
  TAG: 'tag',
  SPRING: 'spring',
  TAG_NEW: 'tag_new',
  EMAIL: 'email',
  REVEAL: 'reveal',
  WAHOOS: 'wahoos',
  BRIDGE: 'bridge',
}

const STEP_ORDER = Object.values(STEPS)
let nextId = 1

export default function TryLifePaths() {
  const [step, setStep] = useState(STEPS.HOOK)
  const [currentCareer, setCurrentCareer] = useState(null)
  const [careers, setCareers] = useState([])
  const [safety, setSafety] = useState(0)
  const [input, setInput] = useState('')
  const [tagTotal, setTagTotal] = useState(0)
  const [springReady, setSpringReady] = useState(false)
  const [showPunchline, setShowPunchline] = useState(false)
  const [showPunchline2, setShowPunchline2] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [selectedWahooId, setSelectedWahooId] = useState(null)
  const [wahooSteps, setWahooSteps] = useState({})
  const [wahooInput, setWahooInput] = useState('')
  const inputRef = useRef(null)
  const wahooInputRef = useRef(null)

  const taggedCareers = careers.filter(c => c.predictedState)
  const careersToTag = useMemo(() => {
    if (step === STEPS.TAG) return careers.filter(c => !c.enteredInSpring && !c.predictedState)
    if (step === STEPS.TAG_NEW) return careers.filter(c => c.enteredInSpring && !c.predictedState)
    return []
  }, [careers, step])
  const currentTagCareer = careersToTag[0] || null
  const stepIndex = STEP_ORDER.indexOf(step)
  const taggedSoFar = tagTotal - careersToTag.length
  const enteredCount = careers.filter(c => !c.enteredInSpring).length

  // ── Effects ──
  useEffect(() => {
    if (step === STEPS.CURRENT || step === STEPS.ENTER) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [step])

  useEffect(() => {
    if (step === STEPS.SPRING && springReady) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [step, springReady])

  useEffect(() => {
    if (step === STEPS.SPRING) {
      setSpringReady(false)
      const t = setTimeout(() => setSpringReady(true), 1500)
      return () => clearTimeout(t)
    }
  }, [step])

  useEffect(() => {
    if (selectedWahooId && step === STEPS.WAHOOS) {
      setTimeout(() => wahooInputRef.current?.focus(), 200)
    }
  }, [selectedWahooId, step])

  useEffect(() => {
    if (step === STEPS.REVEAL) {
      setShowPunchline(false)
      setShowPunchline2(false)
      setShowContinue(false)
      const t1 = setTimeout(() => setShowPunchline(true), 1500)
      const t2 = setTimeout(() => setShowPunchline2(true), 4000)
      const t3 = setTimeout(() => setShowContinue(true), 6000)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [step])

  // ── Save ──
  const saveSession = useCallback(async (overrides = {}) => {
    const name = overrides.client_name || clientName
    const email = overrides.client_email || clientEmail
    if (!name?.trim()) return
    const data = {
      client_name: name.trim(),
      client_email: email?.trim() || null,
      current_career: currentCareer?.label || null,
      current_state: currentCareer?.state || null,
      careers: careers.map(c => ({
        id: c.id, label: c.label, predictedState: c.predictedState, enteredInSpring: c.enteredInSpring,
      })),
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
    } catch (e) { console.error('Save error:', e) }
  }, [clientName, clientEmail, currentCareer, careers, wahooSteps, safety, step, sessionId])

  const saveRef = useRef(saveSession)
  saveRef.current = saveSession

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
      else if (step === STEPS.TAG_NEW) setStep(STEPS.EMAIL)
    }
  }, [currentTagCareer, careersToTag.length, step])

  const removeCareer = useCallback((id) => {
    setCareers(prev => prev.filter(c => c.id !== id))
  }, [])

  const handleEmailSubmit = useCallback((email, name) => {
    setClientName(name)
    setClientEmail(email)
    saveRef.current({ client_name: name, client_email: email, step: 'reveal' })
    setStep(STEPS.REVEAL)
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

  // Map careers
  const mapCareers = useMemo(() => {
    const visible = careers.filter(c => {
      if (c.predictedState) return true
      if ((step === STEPS.SPRING || step === STEPS.TAG_NEW) && c.enteredInSpring) return true
      return false
    })
    if (currentCareer?.state) {
      visible.push({
        id: 'current', label: currentCareer.label, predictedState: currentCareer.state,
        livedState: null, realistic: true, animateIn: false, isCurrent: true,
      })
    }
    return visible
  }, [careers, step, currentCareer])

  const trunkY = currentCareer?.state ? stateY(currentCareer.state) : undefined

  // Progress dots
  const renderDots = () => (
    <div className="lps-progress">
      {STEP_ORDER.map((s, i) => (
        <div key={s} className={`lps-dot ${i <= stepIndex ? 'active' : ''} ${i === stepIndex ? 'current' : ''}`} />
      ))}
    </div>
  )

  // ── HOOK ──
  if (step === STEPS.HOOK) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-purple" onClick={() => setStep(STEPS.CURRENT)}>
          {renderDots()}
          <div className="lps-heading">
            What if the career you dream about isn't out of reach?
          </div>
          <div className="lps-subtext">
            It's just outside your cone of safety.
          </div>
          <div className="lps-tap-hint">Tap to continue</div>
        </div>
      </div>
    )
  }

  // ── CURRENT ──
  if (step === STEPS.CURRENT) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-white">
          {renderDots()}
          {!currentCareer ? (
            <>
              <div className="lps-heading" style={{ color: '#1a1a2e' }}>What do you currently do?</div>
              <div className="lps-input-row">
                <input ref={inputRef} className="lps-input" type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { setCurrentCareer({ label: input.trim(), state: null }); setInput('') } }}
                  placeholder="e.g. Marketing manager..." />
                <button className="lps-input-submit"
                  onClick={() => { if (input.trim()) { setCurrentCareer({ label: input.trim(), state: null }); setInput('') } }}
                  disabled={!input.trim()}>→</button>
              </div>
            </>
          ) : !currentCareer.state ? (
            <>
              <div className="lps-heading" style={{ color: '#1a1a2e' }}>{currentCareer.label}</div>
              <div className="lps-subtext" style={{ color: '#666' }}>How does it make you feel?</div>
              <div className="lps-tag-buttons">
                {STATES.map(s => {
                  const m = STATE_META[s]
                  return (
                    <button key={s} className="lps-tag-btn" style={{ borderColor: m.color, color: m.color }}
                      onClick={() => setCurrentCareer(prev => ({ ...prev, state: s }))}>
                      <span className="lps-tag-emoji">{m.emoji}</span>
                      <span className="lps-tag-label">{m.label}</span>
                      <span className="lps-tag-felt">{m.felt}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="lps-heading" style={{ color: '#1a1a2e' }}>{currentCareer.label}</div>
              <div className="lps-subtext" style={{ color: '#666' }}>
                Currently feeling: {STATE_META[currentCareer.state]?.emoji} {STATE_META[currentCareer.state]?.label}
              </div>
              <button className="lps-btn-gold" onClick={() => setStep(STEPS.ENTER)}>
                What else is available? →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── ENTER ──
  if (step === STEPS.ENTER) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-white">
          {renderDots()}
          <div className="lps-heading" style={{ color: '#1a1a2e' }}>
            What are all the career options available to you?
          </div>
          <div className="lps-input-row">
            <input ref={inputRef} className="lps-input" type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && input.trim()) addCareer(input)
                else if (e.key === 'Backspace' && input === '' && careers.length > 0) removeCareer(careers[careers.length - 1].id)
              }}
              placeholder="Type a career..." />
            <button className="lps-input-submit" onClick={() => { if (input.trim()) addCareer(input) }}
              disabled={!input.trim()}>Add</button>
          </div>
          {careers.length > 0 && (
            <div className="lps-career-list">
              {careers.filter(c => !c.enteredInSpring).map((c, i) => (
                <div key={c.id} className="lps-career-item">
                  <span className="lps-career-num">{i + 1}.</span>
                  <span className="lps-career-name">{c.label}</span>
                  <span className="lps-career-remove" onClick={() => removeCareer(c.id)}>✕</span>
                </div>
              ))}
            </div>
          )}
          {careers.length > 0 && (
            <button className="lps-btn-gold" style={{ marginTop: 16 }}
              onClick={() => { setTagTotal(careers.filter(c => !c.enteredInSpring && !c.predictedState).length); setStep(STEPS.TAG) }}>
              That's all I can think of →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── TAG / TAG_NEW ──
  if ((step === STEPS.TAG || step === STEPS.TAG_NEW) && currentTagCareer) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-purple">
          {renderDots()}
          <div className="lps-heading">{currentTagCareer.label}</div>
          <div className="lps-subtext">When you picture doing this every day, what does your body do?</div>
          <div className="lps-tag-buttons">
            {STATES.map(s => {
              const m = STATE_META[s]
              return (
                <button key={s} className="lps-tag-btn" style={{ borderColor: m.color, color: m.color }}
                  onClick={() => tagCareer(s)}>
                  <span className="lps-tag-emoji">{m.emoji}</span>
                  <span className="lps-tag-label">{m.label}</span>
                  <span className="lps-tag-felt">{m.felt}</span>
                </button>
              )
            })}
          </div>
          <div className="lps-counter">{taggedSoFar + 1} of {tagTotal}</div>
        </div>
      </div>
    )
  }

  // ── SPRING ──
  if (step === STEPS.SPRING) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-white">
          {renderDots()}
          <div className="lps-heading" style={{ color: '#1a1a2e' }}>
            Out of every career that exists...
            <br />only {enteredCount === 1 ? 'that one' : `these ${enteredCount}`}?
          </div>
          {springReady && (
            <>
              <div className="lps-input-row">
                <input ref={inputRef} className="lps-input" type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && input.trim()) addCareer(input, true)
                    else if (e.key === 'Backspace' && input === '') {
                      const list = careers.filter(c => c.enteredInSpring)
                      if (list.length > 0) removeCareer(list[list.length - 1].id)
                    }
                  }}
                  placeholder="Actually, also..." />
                <button className="lps-input-submit" onClick={() => { if (input.trim()) addCareer(input, true) }}
                  disabled={!input.trim()}>Add</button>
              </div>
              {careers.some(c => c.enteredInSpring) && (
                <div className="lps-career-list">
                  {careers.filter(c => c.enteredInSpring).map((c, i) => (
                    <div key={c.id} className="lps-career-item">
                      <span className="lps-career-num">{i + 1}.</span>
                      <span className="lps-career-name">{c.label}</span>
                      <span className="lps-career-remove" onClick={() => removeCareer(c.id)}>✕</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="lps-btn-gold" style={{ marginTop: 16 }}
                onClick={() => {
                  const spring = careers.filter(c => c.enteredInSpring)
                  if (spring.length === 0) { setStep(STEPS.EMAIL) }
                  else { setTagTotal(spring.filter(c => !c.predictedState).length); setStep(STEPS.TAG_NEW) }
                }}>
                {careers.some(c => c.enteredInSpring) ? "That's all of them →" : "Skip, no more →"}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── EMAIL GATE (before reveal) ──
  if (step === STEPS.EMAIL) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-purple" style={{ minHeight: '100dvh' }}>
          {renderDots()}
          <PublicEmailGate
            flowType="life_paths"
            onEmailSubmit={handleEmailSubmit}
            title="See your life path map"
            subtitle="Enter your details to reveal your personalized career map"
          />
        </div>
      </div>
    )
  }

  // ── REVEAL (hard cut to dark, the payoff) ──
  if (step === STEPS.REVEAL) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-dark" style={{ justifyContent: 'flex-start', paddingTop: 40 }}>
          {renderDots()}
          <div className="lps-reveal-map">
            <LifePathMap
              careers={mapCareers}
              safety={safety}
              walkProgress={0}
              theme="dark"
              showZoneLabels={taggedCareers.length >= 2}
              trunkY={trunkY}
            />
          </div>
          <div className={`lps-reveal-punchline ${showPunchline ? 'visible' : ''}`}>
            <p>We don't rise to the level of our ambitions.</p>
            <p>We fall to the level that feels safe.</p>
          </div>
          <div className={`lps-reveal-sub ${showPunchline2 ? 'visible' : ''}`}>
            Your current safety response is where you are now.<br />
            Want help raising that level to the height of your ambitions?
          </div>
          {showContinue && (
            <button className="lps-btn-gold" onClick={() => setStep(STEPS.WAHOOS)}>
              Yes, show me how →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── WAHOOS ──
  if (step === STEPS.WAHOOS) {
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-dark" style={{ justifyContent: 'flex-start', paddingTop: 40, alignItems: 'stretch' }}>
          {renderDots()}
          <div className="lps-reveal-map" style={{ height: '30vh' }}>
            <LifePathMap careers={mapCareers} safety={safety} walkProgress={0} theme="dark"
              showZoneLabels={false} trunkY={trunkY} highlightId={selectedWahooId} />
          </div>
          <div style={{ padding: '0 24px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
            <div className="lps-subtext" style={{ color: '#c4b5fd', textAlign: 'left', opacity: 1, marginBottom: 12 }}>
              Which career path pulls you most?
            </div>
            <div className="lps-career-list" style={{ marginTop: 0 }}>
              {careers.filter(c => c.predictedState).map(c => (
                <div key={c.id}
                  className={`lps-career-item ${selectedWahooId === c.id ? 'lps-career-active' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedWahooId(c.id)}>
                  <span className="lps-career-name">{c.label}</span>
                </div>
              ))}
            </div>

            {selectedWahooId && (
              <>
                <div className="lps-subtext" style={{ color: '#a78bfa', textAlign: 'left', opacity: 0.7, marginTop: 16, marginBottom: 8, fontSize: 13 }}>
                  If we broke down living the "{careers.find(c => c.id === selectedWahooId)?.label}" life path into tiny steps, what are they?
                </div>
                {(wahooSteps[selectedWahooId] || []).map((ws, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14, color: '#e0e0e0' }}>
                    <span style={{ opacity: 0.3 }}>{i + 1}.</span>
                    <span>{ws.text}</span>
                  </div>
                ))}
                <div className="lps-input-row" style={{ marginTop: 8 }}>
                  <input ref={wahooInputRef} className="lps-input" type="text" value={wahooInput}
                    style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}
                    onChange={e => setWahooInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addWahooStep()}
                    placeholder="One small step..." />
                  <button className="lps-input-submit" onClick={addWahooStep}
                    disabled={!wahooInput.trim()}>Add</button>
                </div>
              </>
            )}

            <button className="lps-btn-gold" style={{ width: '100%', marginTop: 20 }}
              onClick={() => { saveRef.current({ step: 'complete' }); setStep(STEPS.BRIDGE) }}>
              Save & see my next step →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── BRIDGE ──
  if (step === STEPS.BRIDGE) {
    const topCareer = careers.find(c => c.id === selectedWahooId)
    const firstStep = (wahooSteps[selectedWahooId] || [])[0]
    return (
      <div className="lps-flow">
        <div className="lps-screen lps-screen-dark" style={{ justifyContent: 'flex-start', paddingTop: 40 }}>
          {renderDots()}
          <div className="lps-reveal-map" style={{ height: '30vh' }}>
            <LifePathMap careers={mapCareers} safety={safety} walkProgress={0} theme="dark"
              showZoneLabels={false} trunkY={trunkY} />
          </div>
          <div className="lps-heading" style={{ color: '#c4b5fd', fontSize: 22 }}>
            Your map is saved, {clientName}.
          </div>
          {topCareer && firstStep && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: '#a78bfa', fontSize: 13, opacity: 0.6, marginBottom: 4 }}>
                Your first step toward "{topCareer.label}":
              </div>
              <div style={{ color: '#E9A23B', fontSize: 18, fontWeight: 500 }}>
                {firstStep.text}
              </div>
            </div>
          )}
          <div className="lps-bridge">
            <div className="lps-bridge-text">
              This map is one moment in time.
              Vibe Rise tracks your cone expanding week by week.
            </div>
            <a href="/get-started" style={{ textDecoration: 'none' }}>
              <button className="lps-btn-gold" style={{ width: '100%' }}>
                Start my 7-day challenge →
              </button>
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
