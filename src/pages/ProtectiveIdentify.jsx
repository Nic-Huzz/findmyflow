/**
 * ProtectiveIdentify.jsx — /protective-identify
 * Public quiz: identifies limiting matrix codes + protective archetype.
 * Flow: Name → Pick fears → Behavior per fear → Email → Reveal
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MATRIX_CODES, BEHAVIOR_MAP, PROTECTIVE_ARCHETYPES } from '../data/matrixCodeQuiz'
import './EssenceIdentify.css'
import './ProtectiveIdentify.css'

const STAGES = {
  NAME: 'name',
  FEARS: 'fears',
  BEHAVIOR: 'behavior',
  TIEBREAK: 'tiebreak',
  EMAIL: 'email',
  REVEAL: 'reveal',
}

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function ProtectiveIdentify() {
  const [stage, setStage] = useState(STAGES.NAME)
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')

  // Fear selection
  const [selectedFears, setSelectedFears] = useState([])
  const [shuffledFears] = useState(() => shuffleArray(MATRIX_CODES))

  // Behavior step — iterate through each selected fear
  const [currentFearIndex, setCurrentFearIndex] = useState(0)
  const [votes, setVotes] = useState({})
  const [behaviorResponses, setBehaviorResponses] = useState({})

  // Results
  const [tiedArchetypes, setTiedArchetypes] = useState([])
  const [finalArchetype, setFinalArchetype] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stage, currentFearIndex])

  // --- Fear selection ---

  const toggleFear = (id) => {
    setSelectedFears(prev => {
      if (prev.includes(id)) return prev.filter(f => f !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const handleFearsSubmit = () => {
    if (selectedFears.length === 0) return
    setCurrentFearIndex(0)
    setStage(STAGES.BEHAVIOR)
  }

  // --- Behavior per fear ---

  const currentFearId = selectedFears[currentFearIndex]
  const currentBehavior = currentFearId ? BEHAVIOR_MAP[currentFearId] : null

  const handleBehaviorPick = (archetype) => {
    const newVotes = { ...votes }
    newVotes[archetype] = (newVotes[archetype] || 0) + 1
    setVotes(newVotes)

    const newResponses = { ...behaviorResponses }
    newResponses[currentFearId] = archetype
    setBehaviorResponses(newResponses)

    if (currentFearIndex < selectedFears.length - 1) {
      setCurrentFearIndex(currentFearIndex + 1)
    } else {
      resolveArchetype(newVotes)
    }
  }

  const resolveArchetype = (finalVotes) => {
    const maxVote = Math.max(...Object.values(finalVotes))
    const tied = Object.keys(finalVotes).filter(k => finalVotes[k] === maxVote)

    if (tied.length === 1) {
      setFinalArchetype(tied[0])
      setStage(STAGES.EMAIL)
    } else {
      setTiedArchetypes(tied)
      setStage(STAGES.TIEBREAK)
    }
  }

  const handleTiebreak = (archetype) => {
    setFinalArchetype(archetype)
    setStage(STAGES.EMAIL)
  }

  // --- Email + save ---

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || isLoading || !validateEmail(email)) return

    setIsLoading(true)
    setError(null)

    try {
      const sessionId = crypto.randomUUID()
      const { error: dbError } = await supabase.from('lead_flow_profiles').insert([{
        session_id: sessionId,
        user_name: userName,
        email: email.toLowerCase(),
        protective_archetype: finalArchetype,
        essence_archetype: null,
        persona: null,
        context: {
          source: 'protective-identify',
          selected_matrix_codes: selectedFears,
          behavior_responses: behaviorResponses,
          archetype_votes: votes,
        }
      }])

      if (dbError) {
        if (dbError.code === '23505') {
          console.warn('Duplicate email, proceeding to reveal')
        } else {
          console.error('Error saving profile:', dbError)
        }
      }

      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email: email.toLowerCase(),
          name: userName,
          source: 'Protective Identify Quiz',
          meta: { protective_archetype: finalArchetype, matrix_codes: selectedFears }
        }
      }).catch(() => {})

      generateConfetti()
      setStage(STAGES.REVEAL)
    } catch (err) {
      console.error('Email submit error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Confetti ---

  const generateConfetti = () => {
    const colors = ['#5e17eb', '#E9A23B', '#ffdd27', '#9333EA', '#7C3AED', '#f59e0b']
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
    }))
    setConfetti(pieces)
    setTimeout(() => setConfetti([]), 4000)
  }

  // --- Progress ---

  const progressPercent = stage === STAGES.NAME ? 5
    : stage === STAGES.FEARS ? 20
    : stage === STAGES.BEHAVIOR ? 30 + ((currentFearIndex + 1) / Math.max(selectedFears.length, 1)) * 40
    : stage === STAGES.TIEBREAK ? 75
    : stage === STAGES.EMAIL ? 85
    : 100

  // --- Ranked matrix codes for reveal ---

  const rankedMatrixCodes = selectedFears.map(id => MATRIX_CODES.find(m => m.id === id))

  // ============ RENDER ============

  // NAME CAPTURE
  if (stage === STAGES.NAME) {
    return (
      <div className="essence-identify protective-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: '5%' }} /></div>
        <div className="ei-container">
          <h1 className="ei-title">What's Holding You Back?</h1>
          <div className="ei-intro animated-text">
            <p>Your nervous system developed invisible rules to keep you safe. But those same rules are now limiting your growth.</p>
            <p>This short quiz will reveal what's quietly running the show.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (userName.trim()) setStage(STAGES.FEARS) }} className="ei-form">
            <label className="ei-label">What should I call you?</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="ei-input"
              autoFocus
            />
            <button type="submit" className="ei-button" disabled={!userName.trim()}>
              Let's Find Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  // FEAR SELECTION
  if (stage === STAGES.FEARS) {
    return (
      <div className="essence-identify protective-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
        <div className="ei-container ei-quiz">
          <h2 className="ei-question">Which of these feel most true for you, {userName}?</h2>
          <p className="ei-subtext">Choose up to 3 that resonate most right now.</p>
          <div className="ei-options">
            {shuffledFears.map((fear) => (
              <button
                key={fear.id}
                className={`ei-option ${selectedFears.includes(fear.id) ? 'selected' : ''} ${selectedFears.length >= 3 && !selectedFears.includes(fear.id) ? 'dimmed' : ''}`}
                onClick={() => toggleFear(fear.id)}
              >
                <span className="ei-option-text">{fear.label}</span>
                <span className={`ei-checkbox ${selectedFears.includes(fear.id) ? 'checked' : ''}`}>
                  {selectedFears.includes(fear.id) && <span className="ei-checkmark">&#10003;</span>}
                </span>
              </button>
            ))}
          </div>
          <button
            className="ei-button"
            disabled={selectedFears.length === 0}
            onClick={handleFearsSubmit}
          >
            Continue ({selectedFears.length}/3)
          </button>
        </div>
      </div>
    )
  }

  // BEHAVIOR PER FEAR
  if (stage === STAGES.BEHAVIOR && currentBehavior) {
    return (
      <div className="essence-identify protective-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
        <div className="ei-container ei-quiz">
          <div className="pi-fear-badge">{currentFearIndex + 1} of {selectedFears.length}</div>
          <h2 className="ei-question">{currentBehavior.prompt}</h2>
          <p className="ei-subtext">Pick the one that feels most familiar.</p>
          <div className="ei-options">
            {currentBehavior.options.map((opt, i) => (
              <button
                key={i}
                className="ei-option"
                onClick={() => handleBehaviorPick(opt.archetype)}
              >
                <span className="ei-option-emoji">{opt.emoji}</span>
                <span className="ei-option-text">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // TIEBREAKER
  if (stage === STAGES.TIEBREAK) {
    return (
      <div className="essence-identify protective-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: '75%' }} /></div>
        <div className="ei-container ei-quiz">
          <h2 className="ei-question">Your patterns are showing up equally, {userName}.</h2>
          <p className="ei-subtext">When pressure hits, which one runs the show?</p>
          <div className="ei-options">
            {tiedArchetypes.map(name => {
              const archetype = PROTECTIVE_ARCHETYPES[name]
              return (
                <button
                  key={name}
                  className="ei-option tiebreak"
                  onClick={() => handleTiebreak(name)}
                >
                  <span className="ei-option-text">
                    <em>{archetype?.sabotage_pattern || name}</em>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // EMAIL CAPTURE
  if (stage === STAGES.EMAIL) {
    return (
      <div className="essence-identify protective-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: '85%' }} /></div>
        <div className="ei-container">
          <h2 className="ei-question">Your results are ready, {userName}.</h2>
          <p className="ei-subtext">Enter your email to see what's been quietly holding you back.</p>
          <form onSubmit={handleEmailSubmit} className="ei-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="ei-input"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="ei-button glow"
              disabled={isLoading || !validateEmail(email)}
            >
              {isLoading ? 'Saving...' : 'Reveal My Blocks'}
            </button>
          </form>
          {error && <p className="ei-error">{error}</p>}
        </div>
      </div>
    )
  }

  // REVEAL
  if (stage === STAGES.REVEAL) {
    const archetype = PROTECTIVE_ARCHETYPES[finalArchetype]
    if (!archetype) return null

    return (
      <div className="essence-identify protective-identify reveal-bg">
        {confetti.length > 0 && (
          <div className="ei-confetti">
            {confetti.map(p => (
              <div
                key={p.id}
                className="ei-confetti-piece"
                style={{
                  left: `${p.left}%`,
                  backgroundColor: p.color,
                  width: p.size,
                  height: p.size,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          </div>
        )}
        <div className="ei-container ei-reveal">

          {/* PRIMARY: Matrix Codes */}
          <h1 className="ei-title" style={{ marginBottom: 8 }}>Your Invisible Blocks</h1>
          <p className="ei-subtext" style={{ marginBottom: 24 }}>These are the beliefs your nervous system built to keep you safe. They were brilliant survival strategies, but now they're the very things holding you back.</p>

          {rankedMatrixCodes.map((code, i) => (
            <div key={code.id} className="ei-reveal-section pi-matrix-card">
              <div className="pi-matrix-rank">{i + 1}</div>
              <h3 className="pi-matrix-title">{code.title}</h3>
              <p className="pi-matrix-belief"><em>"{code.core_belief}"</em></p>
              <p className="pi-matrix-behavior">{code.surface_behavior}</p>
              <p className="pi-matrix-driver">{code.deep_driver}</p>
            </div>
          ))}

          {/* SECONDARY: Protective Archetype */}
          <div className="pi-archetype-divider">
            <span>How this shows up</span>
          </div>

          <div className="pi-archetype-reveal">
            <div className="ei-reveal-badge" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>Your Protective Pattern</div>
            <h2 className="ei-reveal-name" style={{ WebkitTextFillColor: 'white', background: 'none' }}>{archetype.name}</h2>

            <div className="ei-reveal-section">
              <h3 className="ei-reveal-label">Core Wound</h3>
              <p className="ei-reveal-highlight">{archetype.core_wound}</p>
            </div>

            <div className="ei-reveal-section">
              <h3 className="ei-reveal-label">Safety Contract</h3>
              <p><em>"{archetype.safety_contract}"</em></p>
            </div>

            <div className="ei-reveal-section">
              <h3 className="ei-reveal-label">How It Sabotages You</h3>
              <p>{archetype.sabotage_pattern}</p>
            </div>

            <div className="ei-reveal-section">
              <h3 className="ei-reveal-label">The Blockage</h3>
              <p>{archetype.blockage}</p>
            </div>
          </div>

          <p className="pi-closing">This pattern isn't who you are. It's who your nervous system became to keep you safe. Understanding it is the first step to moving past it.</p>
        </div>
      </div>
    )
  }

  return null
}
