/**
 * LifePathWidget — Embeddable life path map for the 7-day-challenge wahoo tab.
 * Shows the map progressively (like facilitator) with inline controls.
 * Users identify their current career, add alternatives, tag states, and define wahoo steps.
 *
 * Props:
 *   userId — for saving to Supabase
 *   onWahooIdentified — callback when wahoo steps are defined (optional)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import LifePathMap from './LifePathMap'
import { STATES, STATE_META, stateY, stateColor } from './lifePaths'
import { supabase } from '../../lib/supabaseClient'

const WIDGET_STEPS = {
  CURRENT: 'current',
  ENTER: 'enter',
  TAG: 'tag',
  MAP: 'map',
  WAHOOS: 'wahoos',
}

let widgetNextId = 1

export default function LifePathWidget({ userId, onWahooIdentified }) {
  const [step, setStep] = useState(WIDGET_STEPS.CURRENT)
  const [currentCareer, setCurrentCareer] = useState(null)
  const [careers, setCareers] = useState([])
  const [suggestions, setSuggestions] = useState([]) // from dome + life map
  const [input, setInput] = useState('')
  const [tagTotal, setTagTotal] = useState(0)
  const [safety, setSafety] = useState(0)
  const [selectedWahooId, setSelectedWahooId] = useState(null)
  const [wahooSteps, setWahooSteps] = useState({})
  const [wahooInput, setWahooInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const inputRef = useRef(null)
  const wahooInputRef = useRef(null)

  const taggedCareers = careers.filter(c => c.predictedState)
  const careersToTag = useMemo(() => {
    if (step === WIDGET_STEPS.TAG) return careers.filter(c => !c.predictedState)
    return []
  }, [careers, step])
  const currentTagCareer = careersToTag[0] || null
  const taggedSoFar = tagTotal - careersToTag.length

  // Fetch Vibe Rise suggestions from dome + Life Map
  useEffect(() => {
    if (!userId) return
    Promise.all([
      // Dome Vibe Rise nodes
      supabase.from('experience_dome_ratings')
        .select('node_id')
        .eq('user_id', userId)
        .eq('ns_state', 'vibe_rise'),
      // Life Map Vibe Rise clusters
      supabase.from('nikigai_clusters')
        .select('label')
        .eq('user_id', userId)
        .eq('resonance_state', 'vibe_rise'),
    ]).then(([domeRes, clusterRes]) => {
      const sug = []
      ;(clusterRes.data || []).forEach(c => {
        if (c.label) sug.push(c.label)
      })
      ;(domeRes.data || []).forEach(d => {
        if (d.node_id) sug.push(d.node_id.replace(/_/g, ' '))
      })
      setSuggestions(sug)
    })
  }, [userId])

  useEffect(() => {
    if (step === WIDGET_STEPS.CURRENT || step === WIDGET_STEPS.ENTER) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [step])

  // Map careers
  const mapCareers = useMemo(() => {
    const visible = careers.filter(c => c.predictedState)
    if (currentCareer?.state) {
      visible.push({
        id: 'current', label: currentCareer.label, predictedState: currentCareer.state,
        livedState: null, realistic: true, animateIn: false, isCurrent: true,
      })
    }
    return visible
  }, [careers, currentCareer])

  const trunkY = currentCareer?.state ? stateY(currentCareer.state) : undefined

  // Save
  const saveSession = useCallback(async () => {
    if (!userId) return
    const data = {
      client_name: userId,
      current_career: currentCareer?.label || null,
      current_state: currentCareer?.state || null,
      careers: careers.map(c => ({
        id: c.id, label: c.label, predictedState: c.predictedState,
      })),
      wahoo_steps: wahooSteps,
      safety,
      step,
      updated_at: new Date().toISOString(),
    }
    try {
      if (sessionId) {
        const { error } = await supabase.from('life_path_sessions').update(data).eq('id', sessionId)
        if (error) console.error('Widget update error:', error)
      } else {
        const { data: rows, error } = await supabase.from('life_path_sessions').insert(data).select('id')
        if (error) console.error('Widget insert error:', error)
        else if (rows?.[0]?.id) setSessionId(rows[0].id)
      }
    } catch (e) { console.error('Widget save error:', e) }
  }, [userId, currentCareer, careers, wahooSteps, safety, step, sessionId])

  const saveRef = useRef(saveSession)
  saveRef.current = saveSession

  // Actions
  const addCareer = useCallback((label) => {
    if (!label.trim()) return
    setCareers(prev => [...prev, {
      id: 'w' + widgetNextId++, label: label.trim(), predictedState: null,
      livedState: null, realistic: false, enteredInSpring: false, animateIn: false,
    }])
    setInput('')
  }, [])

  const tagCareer = useCallback((stateKey) => {
    if (!currentTagCareer) return
    setCareers(prev => prev.map(c =>
      c.id === currentTagCareer.id ? { ...c, predictedState: stateKey } : c
    ))
    if (careersToTag.length <= 1) {
      setStep(WIDGET_STEPS.MAP)
      setTimeout(() => saveRef.current(), 500)
    }
  }, [currentTagCareer, careersToTag.length])

  const addWahooStep = useCallback(() => {
    if (!wahooInput.trim() || !selectedWahooId) return
    setWahooSteps(prev => ({
      ...prev,
      [selectedWahooId]: [...(prev[selectedWahooId] || []), { text: wahooInput.trim(), done: false }],
    }))
    setWahooInput('')
    setTimeout(() => wahooInputRef.current?.focus(), 50)
  }, [wahooInput, selectedWahooId])

  // Shared input style
  const inputStyle = {
    flex: 1, padding: '12px 14px', borderRadius: 10, fontSize: 15,
    fontFamily: 'inherit', outline: 'none', border: '2px solid #252545',
    background: '#1a1a30', color: '#e0e0e0',
  }
  const btnStyle = {
    padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer', border: 'none',
    background: '#5e17eb', color: '#fff', flexShrink: 0,
  }
  const goldBtnStyle = {
    ...btnStyle, background: 'linear-gradient(135deg, #E9A23B, #f0b94e)',
    color: '#1a1a2e', width: '100%', padding: '14px', fontSize: 15, marginTop: 12,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Map (always visible after current career is set) */}
      {currentCareer?.state && (
        <div style={{ height: step === WIDGET_STEPS.CURRENT ? 200 : 280, transition: 'height 0.3s' }}>
          <LifePathMap
            careers={mapCareers}
            safety={safety}
            walkProgress={0}
            theme="dark"
            showZoneLabels={taggedCareers.length >= 2}
            trunkY={trunkY}
            highlightId={selectedWahooId}
          />
        </div>
      )}

      {/* CURRENT */}
      {step === WIDGET_STEPS.CURRENT && (
        <div style={{ padding: '0 4px' }}>
          {!currentCareer ? (
            <>
              <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 8 }}>What do you currently do?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input ref={inputRef} style={inputStyle} type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { setCurrentCareer({ label: input.trim(), state: null }); setInput('') } }}
                  placeholder="e.g. Marketing manager..." />
                <button style={{ ...btnStyle, opacity: !input.trim() ? 0.3 : 1 }}
                  onClick={() => { if (input.trim()) { setCurrentCareer({ label: input.trim(), state: null }); setInput('') } }}
                  disabled={!input.trim()}>→</button>
              </div>
            </>
          ) : !currentCareer.state ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{currentCareer.label}</div>
              <div style={{ fontSize: 14, opacity: 0.5, marginBottom: 12 }}>How does it make you feel?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STATES.map(s => {
                  const m = STATE_META[s]
                  return (
                    <button key={s} onClick={() => setCurrentCareer(prev => ({ ...prev, state: s }))}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '14px 10px', borderRadius: 12, border: `2px solid ${m.color}`, color: m.color,
                        cursor: 'pointer', fontFamily: 'inherit', background: 'transparent' }}>
                      <span style={{ fontSize: 24 }}>{m.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</span>
                      <span style={{ fontSize: 11, opacity: 0.6 }}>{m.felt}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, opacity: 0.5, marginBottom: 8 }}>
                {currentCareer.label}: {STATE_META[currentCareer.state]?.emoji} {STATE_META[currentCareer.state]?.label}
              </div>
              <button style={goldBtnStyle} onClick={() => setStep(WIDGET_STEPS.ENTER)}>
                What other career paths are available? →
              </button>
            </>
          )}
        </div>
      )}

      {/* ENTER */}
      {step === WIDGET_STEPS.ENTER && (
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontSize: 15, opacity: 0.7, marginBottom: 8 }}>What are all the career options available to you?</div>
          {suggestions.length > 0 && careers.length === 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5e17eb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Based on what lights you up
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {suggestions.filter(s => !careers.some(c => c.label.toLowerCase() === s.toLowerCase())).slice(0, 8).map((s, i) => (
                  <button key={i} onClick={() => addCareer(s)}
                    style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(94,23,235,0.15)',
                      background: 'rgba(94,23,235,0.04)', color: '#5e17eb', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit' }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={inputRef} style={inputStyle} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && input.trim()) addCareer(input) }}
              placeholder="Type a career..." />
            <button style={{ ...btnStyle, opacity: !input.trim() ? 0.3 : 1 }}
              onClick={() => { if (input.trim()) addCareer(input) }}
              disabled={!input.trim()}>Add</button>
          </div>
          {careers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {careers.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  borderRadius: 8, background: 'rgba(255,255,255,0.04)', fontSize: 14 }}>
                  <span style={{ opacity: 0.3, fontSize: 12, minWidth: 18 }}>{i + 1}.</span>
                  <span style={{ flex: 1 }}>{c.label}</span>
                </div>
              ))}
            </div>
          )}
          {careers.length > 0 && (
            <button style={goldBtnStyle}
              onClick={() => { setTagTotal(careers.filter(c => !c.predictedState).length); setStep(WIDGET_STEPS.TAG) }}>
              Tag each one →
            </button>
          )}
        </div>
      )}

      {/* TAG */}
      {step === WIDGET_STEPS.TAG && currentTagCareer && (
        <div style={{ padding: '0 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{currentTagCareer.label}</div>
          <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 12 }}>What does your body do when you picture this?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {STATES.map(s => {
              const m = STATE_META[s]
              return (
                <button key={s} onClick={() => tagCareer(s)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '14px 10px', borderRadius: 12, border: `2px solid ${m.color}`, color: m.color,
                    cursor: 'pointer', fontFamily: 'inherit', background: 'transparent' }}>
                  <span style={{ fontSize: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</span>
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 12, opacity: 0.3, marginTop: 6 }}>{taggedSoFar + 1} of {tagTotal}</div>
        </div>
      )}

      {/* MAP + WAHOOS */}
      {(step === WIDGET_STEPS.MAP || step === WIDGET_STEPS.WAHOOS) && (
        <div style={{ padding: '0 4px' }}>
          {step === WIDGET_STEPS.MAP && (
            <>
              <div style={{ fontSize: 15, opacity: 0.7, marginBottom: 8 }}>
                Which career path pulls you most?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {careers.filter(c => c.predictedState).map(c => (
                  <div key={c.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      borderRadius: 10, cursor: 'pointer', fontSize: 14,
                      background: selectedWahooId === c.id ? 'rgba(94,23,235,0.12)' : 'rgba(255,255,255,0.04)' }}
                    onClick={() => setSelectedWahooId(c.id)}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stateColor(c.predictedState) }} />
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
              {selectedWahooId && (
                <button style={goldBtnStyle} onClick={() => setStep(WIDGET_STEPS.WAHOOS)}>
                  Break it down into steps →
                </button>
              )}
            </>
          )}

          {step === WIDGET_STEPS.WAHOOS && (
            <>
              <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
                If we broke down living the "{careers.find(c => c.id === selectedWahooId)?.label}" life path into tiny steps, what are they?
              </div>
              {(wahooSteps[selectedWahooId] || []).map((ws, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14 }}>
                  <span style={{ opacity: 0.3 }}>{i + 1}.</span>
                  <span>{ws.text}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input ref={wahooInputRef} style={{ ...inputStyle, fontSize: 14, padding: '10px 12px' }}
                  type="text" value={wahooInput}
                  onChange={e => setWahooInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWahooStep()}
                  placeholder="One small step..." />
                <button style={{ ...btnStyle, opacity: !wahooInput.trim() ? 0.3 : 1 }}
                  onClick={addWahooStep} disabled={!wahooInput.trim()}>Add</button>
              </div>
              {(wahooSteps[selectedWahooId] || []).length > 0 && (
                <button style={goldBtnStyle}
                  onClick={() => {
                    saveRef.current()
                    if (onWahooIdentified) onWahooIdentified(wahooSteps)
                  }}>
                  Save wahoo steps ✓
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
