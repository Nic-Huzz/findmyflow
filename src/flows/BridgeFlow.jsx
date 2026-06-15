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
