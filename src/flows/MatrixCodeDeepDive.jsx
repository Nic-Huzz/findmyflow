/**
 * MatrixCodeDeepDive.jsx — /matrix-code-deep-dive
 * In-app authenticated version of the matrix code quiz.
 * Identifies limiting matrix codes + protective archetype.
 * Saves to matrix_code_results table and updates lead_flow_profiles.
 * Flow: Pick fears → Behavior per fear → Reveal
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { MATRIX_CODES, BEHAVIOR_MAP, PROTECTIVE_ARCHETYPES } from '../data/matrixCodeQuiz'
import '../pages/EssenceIdentify.css'
import '../pages/ProtectiveIdentify.css'

const STAGES = {
  FEARS: 'fears',
  BEHAVIOR: 'behavior',
  TIEBREAK: 'tiebreak',
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

export default function MatrixCodeDeepDive() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isResults = searchParams.get('results') === 'true'

  const [stage, setStage] = useState(STAGES.FEARS)
  const [selectedFears, setSelectedFears] = useState([])
  const [shuffledFears] = useState(() => shuffleArray(MATRIX_CODES))

  // Behavior step
  const [currentFearIndex, setCurrentFearIndex] = useState(0)
  const [votes, setVotes] = useState({})
  const [behaviorResponses, setBehaviorResponses] = useState({})

  // Results
  const [tiedArchetypes, setTiedArchetypes] = useState([])
  const [finalArchetype, setFinalArchetype] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [confetti, setConfetti] = useState([])

  // For ?results=true — load previous results
  const [previousResults, setPreviousResults] = useState(null)
  const [loadingResults, setLoadingResults] = useState(isResults)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stage, currentFearIndex])

  // Load previous results if ?results=true
  useEffect(() => {
    if (!isResults || !user?.id) return
    setLoadingResults(true)
    supabase
      .from('matrix_code_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setPreviousResults(data[0])
        }
        setLoadingResults(false)
      })
  }, [isResults, user?.id])

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
      saveAndReveal(tied[0])
    } else {
      setTiedArchetypes(tied)
      setStage(STAGES.TIEBREAK)
    }
  }

  const handleTiebreak = (archetype) => {
    saveAndReveal(archetype)
  }

  // --- Save + reveal ---

  const saveAndReveal = async (archetype) => {
    setFinalArchetype(archetype)
    setIsSaving(true)

    try {
      // Save to matrix_code_results
      await supabase.from('matrix_code_results').insert([{
        user_id: user.id,
        selected_matrix_codes: selectedFears,
        protective_archetype: archetype,
        behavior_responses: behaviorResponses,
        archetype_votes: votes,
      }])

      // Update protective_archetype on lead_flow_profiles (most recent row for this user's email)
      const { data: profile } = await supabase
        .from('lead_flow_profiles')
        .select('id')
        .eq('email', user.email?.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)

      if (profile?.[0]) {
        await supabase
          .from('lead_flow_profiles')
          .update({ protective_archetype: archetype })
          .eq('id', profile[0].id)
      }

      // Complete the quest
      await completeFlowQuest({
        userId: user.id,
        flowId: 'matrix_code_deep_dive',
        pointsEarned: 5,
      })

      generateConfetti()
      setStage(STAGES.REVEAL)
    } catch (err) {
      console.error('Error saving matrix code results:', err)
    } finally {
      setIsSaving(false)
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

  const progressPercent = stage === STAGES.FEARS ? 15
    : stage === STAGES.BEHAVIOR ? 25 + ((currentFearIndex + 1) / Math.max(selectedFears.length, 1)) * 50
    : stage === STAGES.TIEBREAK ? 80
    : 100

  // --- Ranked matrix codes ---

  const rankedMatrixCodes = selectedFears.map(id => MATRIX_CODES.find(m => m.id === id))

  // ============ RENDER ============

  // RESULTS MODE — show previous results
  if (isResults) {
    if (loadingResults) {
      return (
        <div className="essence-identify protective-identify">
          <div className="ei-container" style={{ marginTop: 40 }}>
            <p className="ei-subtext">Loading your results...</p>
          </div>
        </div>
      )
    }

    if (!previousResults) {
      return (
        <div className="essence-identify protective-identify">
          <div className="ei-container" style={{ marginTop: 40 }}>
            <p className="ei-subtext">No results found. Complete the quiz first.</p>
            <button className="ei-button" onClick={() => navigate('/matrix-code-deep-dive')}>
              Take the Quiz
            </button>
          </div>
        </div>
      )
    }

    const prevArchetype = PROTECTIVE_ARCHETYPES[previousResults.protective_archetype]
    const prevCodes = (previousResults.selected_matrix_codes || []).map(id => MATRIX_CODES.find(m => m.id === id)).filter(Boolean)

    return (
      <div className="essence-identify protective-identify reveal-bg">
        <div className="ei-container ei-reveal">
          <h1 className="ei-title" style={{ marginBottom: 8 }}>Your Invisible Blocks</h1>
          <p className="ei-subtext" style={{ marginBottom: 24 }}>These are the beliefs your nervous system built to keep you safe.</p>

          {prevCodes.map((code, i) => (
            <div key={code.id} className="ei-reveal-section pi-matrix-card">
              <div className="pi-matrix-rank">{i + 1}</div>
              <h3 className="pi-matrix-title">{code.title}</h3>
              <p className="pi-matrix-belief"><em>"{code.core_belief}"</em></p>
              <p className="pi-matrix-behavior">{code.surface_behavior}</p>
              <p className="pi-matrix-driver">{code.deep_driver}</p>
            </div>
          ))}

          {prevArchetype && (
            <>
              <div className="pi-archetype-divider">
                <span>How this shows up</span>
              </div>
              <div className="pi-archetype-reveal">
                <div className="ei-reveal-badge" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>Your Protective Pattern</div>
                <h2 className="ei-reveal-name" style={{ WebkitTextFillColor: 'white', background: 'none' }}>{prevArchetype.name}</h2>
                <div className="ei-reveal-section">
                  <h3 className="ei-reveal-label">Core Wound</h3>
                  <p className="ei-reveal-highlight">{prevArchetype.core_wound}</p>
                </div>
                <div className="ei-reveal-section">
                  <h3 className="ei-reveal-label">Safety Contract</h3>
                  <p><em>"{prevArchetype.safety_contract}"</em></p>
                </div>
                <div className="ei-reveal-section">
                  <h3 className="ei-reveal-label">How It Sabotages You</h3>
                  <p>{prevArchetype.sabotage_pattern}</p>
                </div>
                <div className="ei-reveal-section">
                  <h3 className="ei-reveal-label">The Blockage</h3>
                  <p>{prevArchetype.blockage}</p>
                </div>
              </div>
            </>
          )}

          <button className="ei-button" style={{ marginTop: 32 }} onClick={() => navigate('/7-day-challenge')}>
            Back to Challenge
          </button>
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
          <h2 className="ei-question">Which of these feel most true for you?</h2>
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
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: '80%' }} /></div>
        <div className="ei-container ei-quiz">
          <h2 className="ei-question">Your patterns are showing up equally.</h2>
          <p className="ei-subtext">When pressure hits, which one runs the show?</p>
          <div className="ei-options">
            {tiedArchetypes.map(name => {
              const archetype = PROTECTIVE_ARCHETYPES[name]
              return (
                <button
                  key={name}
                  className="ei-option tiebreak"
                  onClick={() => handleTiebreak(name)}
                  disabled={isSaving}
                >
                  <span className="ei-option-text">
                    <em>{archetype?.sabotage_pattern || name}</em>
                  </span>
                </button>
              )
            })}
          </div>
          {isSaving && <p className="ei-subtext">Saving...</p>}
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

          <button className="ei-button" style={{ marginTop: 24 }} onClick={() => navigate('/7-day-challenge')}>
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  return null
}
