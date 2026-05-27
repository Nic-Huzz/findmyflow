/**
 * StrikeDesignFlow.jsx — /create/strike
 * 5-step Lightning Strike design flow.
 * Guides creators to design a bold public action connected to their movement.
 * Saves as a groan_challenges row with source_type: 'movement', challenge_source: 'strike'.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess, hapticError } from '../lib/haptics'
import { calculateEssenceZone } from '../lib/stageConfig'
import { ESSENCE_ARCHETYPES } from '../data/essenceArchetypes'
import './StrikeDesignFlow.css'

const STEPS = {
  OUTCOME: 'outcome',
  TYPE: 'type',
  FUEL: 'fuel',
  WRITE: 'write',
  QUALITY: 'quality',
}

const OUTCOMES = [
  { id: 'fill_room', label: 'Fill This Room', desc: 'Your next experience needs attendees. This Wahoo makes the cash register sing.', bestFor: 'You have an upcoming experience and need more signups.', icon: '🎯' },
  { id: 'go_public', label: 'Go Public', desc: 'Nobody outside your attendees knows your movement. Time to declare it.', bestFor: 'Increase awareness about who you are and what you do.', icon: '📢' },
  { id: 'own_it', label: 'Own It', desc: 'You\'re already known. This Wahoo cements your position as the leader.', bestFor: 'You have repeat attendees and want to become the go-to.', icon: '👑' },
]

const STRIKE_TYPES = [
  { id: 'fight', label: 'Challenge the Norm', desc: 'Say what nobody in your field is saying. Make the market pick a side.', tag: 'Builds attention', icon: '🔥' },
  { id: 'stunt', label: 'Make Them Look Twice', desc: 'Do something in public that makes people say "wait, what?"', tag: 'Builds attention', icon: '⚡' },
  { id: 'functional', label: 'Let Them Feel It', desc: 'Prove your method works in real time. Give them a taste of the shift.', tag: 'Builds trust', icon: '💎' },
  { id: 'culture_creating', label: 'Start a Ritual', desc: 'Create something your attendees take home and spread without you.', tag: 'Builds both', icon: '🌀' },
]

// Shared parsing logic — must match CreatorHome's parseMovement
function parseMovement(ruleIdentified) {
  if (!ruleIdentified) return null
  const parts = ruleIdentified.split('|').map(s => s.trim())
  const extract = (prefix) => {
    const part = parts.find(p => p.startsWith(prefix))
    return part ? part.replace(prefix, '').trim() : ''
  }
  const current = extract('Current:')
  const wrong = extract('Wrong:')
  const mine = extract('Mine:')
  if (!current || !wrong || !mine) return null
  return { current, wrong, mine }
}

export default function StrikeDesignFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.OUTCOME)

  // User selections
  const [outcome, setOutcome] = useState(null)
  const [strikeType, setStrikeType] = useState(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState(undefined)
  const [strikeTitle, setStrikeTitle] = useState('')
  const [strikeDescription, setStrikeDescription] = useState('')
  const [selectedExperienceId, setSelectedExperienceId] = useState(null)
  const [scaryScore, setScaryScore] = useState(7)
  const [wahooScore, setWahooScore] = useState(7)
  const [pillarEducate, setPillarEducate] = useState(false)
  const [pillarPosition, setPillarPosition] = useState(false)
  const [pillarConvert, setPillarConvert] = useState(false)
  const [deadlineDate, setDeadlineDate] = useState('')

  // Loaded data
  const [movement, setMovement] = useState(null)
  const [remarkableAngleId, setRemarkableAngleId] = useState(null)
  const [essenceArchetype, setEssenceArchetype] = useState(null)
  const [scopeStage, setScopeStage] = useState(null)
  const [upcomingExperiences, setUpcomingExperiences] = useState([])
  const [loading, setLoading] = useState(true)

  // AI suggestions
  const [suggestions, setSuggestions] = useState([])
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)

  // Save state
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Load all needed data on mount
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      const [remarkRes, scopeRes, archetypeRes, expRes] = await Promise.all([
        supabase.from('remarkable_angles')
          .select('id, wound_problem, rule_identified, ai_rule_statement, ai_tribe_statement')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('scope_map_results')
          .select('stage').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('lead_flow_profiles')
          .select('essence_archetype').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('experiences')
          .select('id, name, experience_date, modalities').eq('user_id', user.id).eq('status', 'upcoming')
          .order('experience_date', { ascending: true }),
      ])

      if (remarkRes.data) {
        const mv = parseMovement(remarkRes.data.rule_identified)
        if (mv) {
          setMovement({
            ...mv,
            woundProblem: remarkRes.data.wound_problem,
            ruleStatement: remarkRes.data.ai_rule_statement,
            tribeStatement: remarkRes.data.ai_tribe_statement,
          })
        }
        setRemarkableAngleId(remarkRes.data.id)
      }
      if (scopeRes.data) setScopeStage(scopeRes.data.stage)
      if (archetypeRes.data?.essence_archetype) {
        const arch = ESSENCE_ARCHETYPES.find(a => a.name === archetypeRes.data.essence_archetype)
        setEssenceArchetype(arch || null)
      }
      setUpcomingExperiences(expRes.data || [])
      if (expRes.data?.length === 1) setSelectedExperienceId(expRes.data[0].id)

      // Default deadline: 2 weeks from now
      const twoWeeks = new Date()
      twoWeeks.setDate(twoWeeks.getDate() + 14)
      setDeadlineDate(twoWeeks.toISOString().split('T')[0])

      setLoading(false)
    })()
  }, [user])

  // Auto-suggest outcome from scope + experience data
  const suggestedOutcome = useMemo(() => {
    if (scopeStage === 'river') return 'own_it'
    if (scopeStage === 'waterfall' && upcomingExperiences.length > 0) return 'fill_room'
    return 'go_public'
  }, [scopeStage, upcomingExperiences])

  // Generate AI Strike suggestions
  const generateSuggestions = async () => {
    if (!movement) return
    setGenerating(true)
    setGenError(null)
    hapticLight()

    try {
      const { data, error } = await supabase.functions.invoke('groan-challenge-generator', {
        body: {
          sourceType: 'movement',
          movementData: {
            woundProblem: movement.woundProblem,
            current: movement.current,
            wrong: movement.wrong,
            mine: movement.mine,
            ruleStatement: movement.ruleStatement,
          },
          strikeType: strikeType,
          outcome: outcome,
          essenceArchetype: essenceArchetype?.name || '',
          essenceSuperpower: essenceArchetype?.superpower || '',
          experienceName: upcomingExperiences.find(e => e.id === selectedExperienceId)?.name || '',
          modalities: upcomingExperiences.find(e => e.id === selectedExperienceId)?.modalities || [],
        },
      })
      if (error) throw error
      setSuggestions(data?.strikes || [])
      hapticSuccess()
    } catch (err) {
      console.error('Strike generation error:', err)
      setGenError('Something went wrong. Try again.')
      hapticError()
    } finally {
      setGenerating(false)
    }
  }

  // Save Strike as challenge
  const saveStrike = async () => {
    if (!user || saving || !strikeTitle.trim()) return
    setSaving(true)
    setSaveError(null)

    try {
      const ez = calculateEssenceZone(scaryScore, wahooScore)
      const { error } = await supabase.from('groan_challenges').insert({
        user_id: user.id,
        challenge_text: strikeTitle.trim(),
        title: strikeTitle.trim(),
        description: strikeDescription || null,
        source_type: 'movement',
        source_value: 'remarkable_angle',
        source_label: movement?.ruleStatement || 'Lightning Strike',
        source_id: remarkableAngleId || null,
        visibility_layer: 'authority',
        scary_score: scaryScore,
        wahoo_score: wahooScore,
        essence_zone: ez.zone,
        essence_insight: ez.insight,
        status: 'active',
        accepted_at: new Date().toISOString(),
        challenge_source: 'strike',
        experience_id: selectedExperienceId || null,
        deadline: deadlineDate ? new Date(`${deadlineDate}T23:59:59`).toISOString() : null,
      })
      if (error) throw error
      hapticSuccess()
      navigate('/create')
    } catch (err) {
      console.error('Strike save error:', err)
      setSaveError('Failed to save. Please try again.')
      hapticError()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="stk"><div className="stk-center"><div className="stk-spinner" /></div></div>
  }

  // Gate: need movement data
  if (!movement) {
    return (
      <div className="stk">
        <div className="stk-container stk-screen stk-centered-screen">
          <h2 className="stk-heading">First, find your movement</h2>
          <p className="stk-prompt">Before designing a Wahoo, you need to know what you stand for.</p>
          <button className="stk-cta" onClick={() => navigate('/create/remarkable')}>Find My Movement</button>
        </div>
      </div>
    )
  }

  // ── STEP 1: OUTCOME ──
  if (step === STEPS.OUTCOME) {
    return (
      <div className="stk">
        <div className="stk-container stk-screen">
          <div className="stk-step-label">Step 1 of 5</div>
          <h2 className="stk-heading">What do you need <span className="stk-gold">right now</span>?</h2>
          <div className="stk-options">
            {OUTCOMES.map(o => (
              <button
                key={o.id}
                className={`stk-option ${outcome === o.id ? 'stk-option-selected' : ''} ${suggestedOutcome === o.id ? 'stk-option-suggested' : ''}`}
                onClick={() => { hapticLight(); setOutcome(o.id) }}
              >
                <span className="stk-option-icon">{o.icon}</span>
                <div>
                  <div className="stk-option-label">{o.label}</div>
                  <div className="stk-option-desc">{o.desc}</div>
                  <div className="stk-option-best">Best for: {o.bestFor}</div>
                </div>
                {suggestedOutcome === o.id && <span className="stk-suggested-badge">suggested</span>}
              </button>
            ))}
          </div>
          <div className="stk-nav">
            <button className="stk-back-btn" onClick={() => navigate('/create')}>Back</button>
            <button className="stk-cta" disabled={!outcome} onClick={() => { hapticLight(); setStep(STEPS.TYPE) }}>
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: TYPE ──
  if (step === STEPS.TYPE) {
    return (
      <div className="stk">
        <div className="stk-container stk-screen">
          <div className="stk-step-label">Step 2 of 5</div>
          <h2 className="stk-heading">Which <span className="stk-gold">excites</span> you most?</h2>
          <div className="stk-options">
            {STRIKE_TYPES.map(t => (
              <button
                key={t.id}
                className={`stk-option ${strikeType === t.id ? 'stk-option-selected' : ''}`}
                onClick={() => { hapticLight(); setStrikeType(t.id) }}
              >
                <span className="stk-option-icon">{t.icon}</span>
                <div>
                  <div className="stk-option-label">{t.label}</div>
                  <div className="stk-option-desc">{t.desc}</div>
                  <span className={`stk-option-tag ${t.tag === 'Builds trust' ? 'stk-tag-trust' : t.tag === 'Builds both' ? 'stk-tag-both' : 'stk-tag-attention'}`}>{t.tag}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="stk-nav">
            <button className="stk-back-btn" onClick={() => setStep(STEPS.OUTCOME)}>Back</button>
            <button className="stk-cta" disabled={!strikeType} onClick={() => { hapticLight(); setStep(STEPS.FUEL); generateSuggestions() }}>
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 3: FUEL ──
  if (step === STEPS.FUEL) {
    return (
      <div className="stk">
        <div className="stk-container stk-screen">
          <div className="stk-step-label">Step 3 of 5</div>
          <h2 className="stk-heading">Your creative <span className="stk-gold">fuel</span></h2>

          {/* Movement */}
          <div className="stk-fuel-card">
            <div className="stk-fuel-label">Your movement</div>
            <div className="stk-fuel-text">{movement.ruleStatement}</div>
          </div>

          {/* Essence archetype */}
          {essenceArchetype && (
            <div className="stk-fuel-card stk-fuel-archetype">
              <div className="stk-fuel-label">Your essence: {essenceArchetype.name}</div>
              <div className="stk-fuel-text">{essenceArchetype.poetic_line}</div>
              <div className="stk-fuel-sub">{essenceArchetype.superpower}</div>
            </div>
          )}

          {/* AI suggestions */}
          <div className="stk-fuel-label" style={{ marginTop: '1rem' }}>Wahoo ideas for you</div>
          {generating ? (
            <div className="stk-generating">
              <div className="stk-spinner" />
              <span>Generating ideas...</span>
            </div>
          ) : genError ? (
            <div className="stk-error">
              <p>{genError}</p>
              <button className="stk-retry" onClick={generateSuggestions}>Try again</button>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="stk-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={`stk-suggestion ${selectedSuggestion === i ? 'stk-suggestion-selected' : ''}`}
                  onClick={() => {
                    hapticLight()
                    if (selectedSuggestion === i) {
                      setSelectedSuggestion(undefined)
                      setStrikeTitle('')
                      setStrikeDescription('')
                    } else {
                      setSelectedSuggestion(i)
                      setStrikeTitle(s.title)
                      setStrikeDescription(s.description)
                    }
                  }}
                >
                  <div className="stk-suggestion-title">{s.title}</div>
                  <div className="stk-suggestion-desc">{s.description}</div>
                  {s.hook && <div className="stk-suggestion-hook">{s.hook}</div>}
                </button>
              ))}
              <button
                className={`stk-suggestion stk-suggestion-custom ${selectedSuggestion === 'custom' ? 'stk-suggestion-selected' : ''}`}
                onClick={() => {
                  hapticLight()
                  setSelectedSuggestion('custom')
                  setStrikeTitle('')
                  setStrikeDescription('')
                }}
              >
                <div className="stk-suggestion-title">Create Your Own</div>
                <div className="stk-suggestion-desc">Write your own Wahoo idea from scratch.</div>
              </button>
            </div>
          ) : null}

          <div className="stk-nav">
            <button className="stk-back-btn" onClick={() => setStep(STEPS.TYPE)}>Back</button>
            <button className="stk-cta" disabled={generating} onClick={() => { hapticLight(); setStep(STEPS.WRITE) }}>
              {generating ? 'Generating...' : typeof selectedSuggestion === 'number' ? 'Use this idea' : 'Write my own'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 4: WRITE ──
  if (step === STEPS.WRITE) {
    return (
      <div className="stk">
        <div className="stk-container stk-screen">
          <div className="stk-step-label">Step 4 of 5</div>
          <h2 className="stk-heading">My Wahoo is:</h2>
          <textarea
            className="stk-textarea"
            value={strikeTitle}
            onChange={(e) => setStrikeTitle(e.target.value)}
            placeholder="One sentence. What are you going to do?"
            rows={3}
            autoFocus
          />
          <textarea
            className="stk-textarea stk-textarea-secondary"
            value={strikeDescription}
            onChange={(e) => setStrikeDescription(e.target.value)}
            placeholder="Optional: more detail on how you'll execute this"
            rows={2}
          />

          {upcomingExperiences.length > 0 && (
            <div className="stk-field">
              <label className="stk-field-label">Connected to experience</label>
              <select
                className="stk-select"
                value={selectedExperienceId || ''}
                onChange={(e) => setSelectedExperienceId(e.target.value || null)}
              >
                <option value="">None</option>
                {upcomingExperiences.map(exp => (
                  <option key={exp.id} value={exp.id}>{exp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="stk-nav">
            <button className="stk-back-btn" onClick={() => setStep(STEPS.FUEL)}>Back</button>
            <button className="stk-cta" disabled={!strikeTitle.trim()} onClick={() => { hapticLight(); setStep(STEPS.QUALITY) }}>
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 5: QUALITY CHECK ──
  if (step === STEPS.QUALITY) {
    const ez = calculateEssenceZone(scaryScore, wahooScore)
    const allPillars = pillarEducate && pillarPosition && pillarConvert

    return (
      <div className="stk">
        <div className="stk-container stk-screen">
          <div className="stk-step-label">Step 5 of 5</div>
          <h2 className="stk-heading">Quality <span className="stk-gold">check</span></h2>

          <div className="stk-strike-preview">
            <div className="stk-strike-preview-title">{strikeTitle}</div>
          </div>

          {/* Scary / Wahoo sliders */}
          <div className="stk-slider-group">
            <label className="stk-slider-label">
              How scary is this? <span className="stk-slider-val">{scaryScore}</span>
            </label>
            <input type="range" min="1" max="10" value={scaryScore} onChange={(e) => setScaryScore(Number(e.target.value))} className="stk-slider" />
          </div>
          <div className="stk-slider-group">
            <label className="stk-slider-label">
              How exciting? <span className="stk-slider-val">{wahooScore}</span>
            </label>
            <input type="range" min="1" max="10" value={wahooScore} onChange={(e) => setWahooScore(Number(e.target.value))} className="stk-slider" />
          </div>

          {/* Essence zone indicator */}
          <div className={`stk-zone stk-zone-${ez.zone}`}>
            {ez.isEssenceZone
              ? 'Essence zone. This is a real Wahoo.'
              : scaryScore < 7 || wahooScore < 7
                ? 'This doesn\'t feel like a Wahoo yet. What would make it scarier or more exciting?'
                : ez.insight
            }
          </div>

          {/* 3-Pillar Check */}
          <div className="stk-pillars">
            <div className="stk-pillar-title">3-Pillar Check</div>
            <label className="stk-pillar">
              <input type="checkbox" checked={pillarEducate} onChange={(e) => setPillarEducate(e.target.checked)} />
              <span>Does this educate about my movement?</span>
            </label>
            <label className="stk-pillar">
              <input type="checkbox" checked={pillarPosition} onChange={(e) => setPillarPosition(e.target.checked)} />
              <span>Does this position me as the leader?</span>
            </label>
            <label className="stk-pillar">
              <input type="checkbox" checked={pillarConvert} onChange={(e) => setPillarConvert(e.target.checked)} />
              <span>Does this connect to my next experience?</span>
            </label>
          </div>

          {/* Deadline */}
          <div className="stk-field">
            <label className="stk-field-label">Deadline</label>
            <input
              type="date"
              className="stk-date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {saveError && <div className="stk-error">{saveError}</div>}

          <div className="stk-nav">
            <button className="stk-back-btn" onClick={() => setStep(STEPS.WRITE)}>Back</button>
            <button
              className="stk-cta"
              disabled={saving || !strikeTitle.trim()}
              onClick={saveStrike}
            >
              {saving ? 'Saving...' : 'Save Wahoo'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
