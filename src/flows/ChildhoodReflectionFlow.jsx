/**
 * ChildhoodReflectionFlow.jsx
 *
 * Stage 1 of the Essence Journey: "Remember who you were as a kid."
 * Duplicated from LifeMapFlow structure, stripped to childhood only,
 * with kid-targeted experience game added.
 *
 * Steps: Skills → Struggles → Heroes → Kid Experiences → Summary
 */
import { useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './ChildhoodReflectionFlow.css'

const STEPS = ['skills', 'struggles', 'heroes', 'experiences', 'summary']

const QUESTIONS = {
  skills: {
    label: 'What did you love doing as a kid?',
    hint: 'What were you naturally good at? What did you gravitate toward?',
    placeholders: [
      'e.g. Building Lego, climbing trees...',
      'e.g. Drawing, making up games...',
    ],
  },
  struggles: {
    label: 'What was hard? What did you worry about?',
    hint: 'Challenges, things that made you feel different',
    placeholders: [
      'e.g. Moving schools, feeling like the odd one out...',
      'e.g. Parents fighting, being teased...',
    ],
  },
  heroes: {
    label: 'Who did you look up to?',
    hint: 'Characters, people, anyone you wanted to be like',
    placeholders: [
      'e.g. Spider-Man, a teacher, an older cousin...',
      'e.g. A cartoon character, a sports star...',
    ],
  },
}

const KID_EXPERIENCES = [
  'Climbing trees',
  'Drawing',
  'Dancing in the living room',
  'Making up games',
  'Building forts',
  'Dress-ups / costumes',
  'Playing in water',
  'Running around outside',
  'Singing',
  'Making things',
  'Playing pretend',
  'Performing for family',
  'Wrestling / rough play',
  'Exploring the neighbourhood',
  'Telling stories',
  'Playing with animals',
  'Team sports',
  'Hiding and seeking',
  'Making a mess',
  'Collecting things',
]

export default function ChildhoodReflectionFlow({ onComplete } = {}) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Text inputs: { skills: ['', ''], struggles: ['', ''], heroes: ['', ''] }
  const [responses, setResponses] = useState({
    skills: ['', ''],
    struggles: ['', ''],
    heroes: ['', ''],
  })

  // Experience ratings: { 'Climbing trees': 'loved' | 'liked' | null }
  const [expRatings, setExpRatings] = useState({})

  const currentStep = STEPS[step]

  const updateResponse = useCallback((category, index, value) => {
    setResponses(prev => {
      const updated = { ...prev }
      updated[category] = [...prev[category]]
      updated[category][index] = value
      return updated
    })
  }, [])

  const addInput = useCallback((category) => {
    setResponses(prev => ({
      ...prev,
      [category]: [...prev[category], ''],
    }))
  }, [])

  const removeInput = useCallback((category, index) => {
    setResponses(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }))
  }, [])

  const cycleExpRating = useCallback((exp) => {
    setExpRatings(prev => {
      const current = prev[exp]
      const next = current === 'loved' ? 'liked' : current === 'liked' ? null : 'loved'
      return { ...prev, [exp]: next }
    })
  }, [])

  const canAdvance = () => {
    if (currentStep === 'experiences') {
      return Object.values(expRatings).some(r => r)
    }
    if (currentStep === 'summary') return true
    const vals = responses[currentStep]
    return vals && vals.some(v => v.trim())
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)

    const data = {
      skills: responses.skills.filter(s => s.trim()),
      struggles: responses.struggles.filter(s => s.trim()),
      heroes: responses.heroes.filter(s => s.trim()),
      experiences: Object.entries(expRatings)
        .filter(([, rating]) => rating)
        .map(([name, rating]) => ({ name, rating })),
    }

    // Save to Supabase if authenticated
    if (user?.id) {
      try {
        await supabase.from('life_map_data').upsert({
          user_id: user.id,
          period: 'childhood',
          data: data,
          source: 'childhood_reflection_flow',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,period' })
      } catch (err) {
        console.warn('Childhood reflection save error:', err)
      }
    }

    setSaving(false)
    if (onComplete) onComplete(data)
  }

  // --- Render ---

  const renderTextStep = (category) => {
    const q = QUESTIONS[category]
    return (
      <div className="crf-container">
        <h2>{q.label}</h2>
        <p className="crf-hint">{q.hint}</p>
        <div className="crf-input-list">
          {responses[category].map((val, i) => (
            <div key={i} className="crf-input-row">
              <input
                type="text"
                value={val}
                onChange={(e) => updateResponse(category, i, e.target.value)}
                placeholder={q.placeholders[i] || 'Enter another...'}
              />
              {responses[category].length > 2 && (
                <button className="crf-remove-btn" onClick={() => removeInput(category, i)}>x</button>
              )}
            </div>
          ))}
        </div>
        {responses[category].length < 5 && (
          <button className="crf-add-more" onClick={() => addInput(category)}>+ Add more</button>
        )}
      </div>
    )
  }

  const renderExperiences = () => (
    <div className="crf-container">
      <h2>Which of these lit you up?</h2>
      <p className="crf-hint">Tap to cycle: loved it / liked it / skip</p>
      <div className="crf-exp-grid">
        {KID_EXPERIENCES.map(exp => (
          <div
            key={exp}
            className={`crf-exp-card ${expRatings[exp] || ''}`}
            onClick={() => cycleExpRating(exp)}
          >
            {exp}
            {expRatings[exp] === 'loved' && <span> &#10084;</span>}
            {expRatings[exp] === 'liked' && <span> &#9734;</span>}
          </div>
        ))}
      </div>
    </div>
  )

  const renderSummary = () => {
    const skills = responses.skills.filter(s => s.trim())
    const struggles = responses.struggles.filter(s => s.trim())
    const heroes = responses.heroes.filter(s => s.trim())
    const lovedExps = Object.entries(expRatings).filter(([, r]) => r === 'loved').map(([n]) => n)
    const likedExps = Object.entries(expRatings).filter(([, r]) => r === 'liked').map(([n]) => n)

    return (
      <div className="crf-container">
        <h2>This is who you were</h2>
        <p className="crf-hint">Before anyone told you to stop.</p>

        {skills.length > 0 && (
          <div className="crf-summary-card">
            <h3>You loved</h3>
            <div className="crf-summary-tags">
              {skills.map((s, i) => <span key={i} className="crf-summary-tag">{s}</span>)}
            </div>
          </div>
        )}

        {lovedExps.length > 0 && (
          <div className="crf-summary-card">
            <h3>You lit up doing</h3>
            <div className="crf-summary-tags">
              {lovedExps.map((e, i) => <span key={i} className="crf-summary-tag">{e}</span>)}
            </div>
          </div>
        )}

        {heroes.length > 0 && (
          <div className="crf-summary-card">
            <h3>You looked up to</h3>
            <div className="crf-summary-tags">
              {heroes.map((h, i) => <span key={i} className="crf-summary-tag">{h}</span>)}
            </div>
          </div>
        )}

        {struggles.length > 0 && (
          <div className="crf-summary-card">
            <h3>What was hard</h3>
            <div className="crf-summary-tags">
              {struggles.map((s, i) => <span key={i} className="crf-summary-tag">{s}</span>)}
            </div>
          </div>
        )}

        {likedExps.length > 0 && (
          <div className="crf-summary-card">
            <h3>Also enjoyed</h3>
            <div className="crf-summary-tags">
              {likedExps.map((e, i) => <span key={i} className="crf-summary-tag">{e}</span>)}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="crf">
      {/* Progress dots */}
      <div className="crf-progress">
        {STEPS.map((s, i) => (
          <div key={s} className={`crf-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
        ))}
      </div>

      {/* Current step */}
      {currentStep === 'skills' && renderTextStep('skills')}
      {currentStep === 'struggles' && renderTextStep('struggles')}
      {currentStep === 'heroes' && renderTextStep('heroes')}
      {currentStep === 'experiences' && renderExperiences()}
      {currentStep === 'summary' && renderSummary()}

      {/* Navigation */}
      <div className="crf-nav">
        {step > 0 && (
          <button className="crf-back" onClick={() => setStep(s => s - 1)}>Back</button>
        )}
        {currentStep !== 'summary' ? (
          <button
            className="crf-next"
            disabled={!canAdvance()}
            onClick={() => setStep(s => s + 1)}
          >
            Next
          </button>
        ) : (
          <button
            className="crf-next"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Complete'}
          </button>
        )}
      </div>
    </div>
  )
}
