/**
 * EssenceIdentify.jsx — /essence-identify
 * Public essence archetype quiz using vote-accumulation method.
 * Flow: Name → 4 quiz steps → Email → Reveal
 */
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { essenceProfiles } from '../data/essenceProfiles'
import './EssenceIdentify.css'

// --- Quiz Data (8 archetypes from get-started path) ---

const VIBE_OPTIONS = [
  { emoji: '\u{1F4A5}', label: 'The spark that shakes things up', archetype: 'Radiant Rebel' },
  { emoji: '\u{1F3A8}', label: 'The creator who brings joy to life', archetype: 'Playful Creator' },
  { emoji: '\u{1F3B2}', label: 'The one who disrupts with humor', archetype: 'Sacred Jester' },
  { emoji: '\u{1F525}', label: 'The alchemist who transforms pain into gold', archetype: 'Wild Alchemist' },
  { emoji: '\u{1F493}', label: 'The steady heartbeat that helps everyone breathe', archetype: 'Heart Holder' },
  { emoji: '\u{1F309}', label: 'The connector who bridges worlds', archetype: 'Cosmic Connector' },
  { emoji: '\u{1F9ED}', label: 'The compass in chaos who leads with care', archetype: 'Compassionate Leader' },
  { emoji: '\u{1F3AD}', label: "The truth-teller who reveals what others won't", archetype: 'Truth-Teller' },
]

const WOUND_OPTIONS = [
  { emoji: '\u{1F6A8}', label: "I thought being bold would inspire others, but it made me the target. So I started filtering how I showed up.", archetype: 'Radiant Rebel' },
  { emoji: '\u{1F388}', label: "I thought my energy made things better, until it got called annoying. So I stopped being playful and started being 'normal'.", archetype: 'Playful Creator' },
  { emoji: '\u{1F0CF}', label: "I thought being weird was welcome, until it made people uncomfortable. So I learned to hide my truth behind humor.", archetype: 'Sacred Jester' },
  { emoji: '\u{1F30A}', label: "I thought my feelings mattered, until they were called 'too much'. So I stopped sharing and held it all alone.", archetype: 'Wild Alchemist' },
  { emoji: '\u{1FAA2}', label: "I thought caring for others was my gift, until they said I was babying people. So I learned to keep my care to myself.", archetype: 'Heart Holder' },
  { emoji: '\u{1F300}', label: "I thought my way of connecting things was magic, until they said it was confusing. So I made myself smaller to fit in.", archetype: 'Cosmic Connector' },
  { emoji: '\u{1FA79}', label: "I thought holding everyone together would keep the peace, but no one noticed when I was breaking. So I became the glue and lost my shape.", archetype: 'Compassionate Leader' },
  { emoji: '\u{1F56F}\u{FE0F}', label: "I thought saying the truth helped, until it made people leave. So I learned to stay quiet even when it hurt.", archetype: 'Truth-Teller' },
]

const CHILD_OPTIONS = [
  { emoji: '\u{1F6A6}', label: "I liked to challenge rules, not to be bad, but because I wanted to do what I want, not what others told me to do.", archetype: 'Radiant Rebel' },
  { emoji: '\u{1FA81}', label: "I liked games and making things fun. Joy was my way of connecting.", archetype: 'Playful Creator' },
  { emoji: '\u{1F3AD}', label: "I liked to stir the pot, with jokes, pranks, or wild ideas.", archetype: 'Sacred Jester' },
  { emoji: '\u{1F3A8}', label: "I liked to turn what I felt into art, drama, or stories.", archetype: 'Wild Alchemist' },
  { emoji: '\u{1F6E1}\u{FE0F}', label: "I wanted to be the safe place, the friend who made everyone feel okay to be themselves.", archetype: 'Heart Holder' },
  { emoji: '\u{1F9EC}', label: "I liked to connect the dots between weird things, magic, science, stories, symbols.", archetype: 'Cosmic Connector' },
  { emoji: '\u{1F3A4}', label: "I liked to make sure no one got left out. I'd give up my turn, cheer the loudest, or carry everyone's feelings.", archetype: 'Compassionate Leader' },
  { emoji: '\u{1F9F1}', label: "I'd point out when something didn't make sense, rules, lies, unfairness. I couldn't ignore it.", archetype: 'Truth-Teller' },
]

const CHARACTER_GROUPS = [
  { archetype: 'Radiant Rebel', characters: ['Deadpool', 'Billie Eilish', 'Katniss Everdeen'] },
  { archetype: 'Playful Creator', characters: ['Spider-Man', 'Robin Williams', 'Willy Wonka'] },
  { archetype: 'Sacred Jester', characters: ['Jim Carrey', 'Star-Lord', 'Jack Sparrow'] },
  { archetype: 'Wild Alchemist', characters: ['Tony Stark', 'David Bowie', 'Elizabeth Gilbert'] },
  { archetype: 'Heart Holder', characters: ['Ted Lasso', 'Uncle Iroh', 'Samwise Gamgee'] },
  { archetype: 'Cosmic Connector', characters: ['Doctor Strange', 'Rick Rubin', 'Gandalf'] },
  { archetype: 'Compassionate Leader', characters: ['Mufasa', 'Captain America', 'Brene Brown'] },
  { archetype: 'Truth-Teller', characters: ['Yoda', 'Ricky Gervais', 'Lady Gaga'] },
]

const STAGES = {
  NAME: 'name',
  VIBE: 'vibe',
  WOUND: 'wound',
  CHILD: 'child',
  CHARACTER: 'character',
  TIEBREAK: 'tiebreak',
  EMAIL: 'email',
  REVEAL: 'reveal',
}

const QUIZ_STAGES = [STAGES.VIBE, STAGES.WOUND, STAGES.CHILD, STAGES.CHARACTER]

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function EssenceIdentify() {
  const [stage, setStage] = useState(STAGES.NAME)
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [votes, setVotes] = useState({})
  const [selected, setSelected] = useState([])
  const [tiedArchetypes, setTiedArchetypes] = useState([])
  const [finalArchetype, setFinalArchetype] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confetti, setConfetti] = useState([])

  // Shuffle options once on mount so order varies per session
  const [shuffledVibe] = useState(() => shuffleArray(VIBE_OPTIONS))
  const [shuffledWound] = useState(() => shuffleArray(WOUND_OPTIONS))
  const [shuffledChild] = useState(() => shuffleArray(CHILD_OPTIONS))

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stage])

  // --- Selection logic ---

  const getMaxSelections = () => {
    if (stage === STAGES.VIBE) return 4
    if (stage === STAGES.WOUND || stage === STAGES.CHILD) return 3
    return 1
  }

  const toggleSelection = (index) => {
    const max = getMaxSelections()
    setSelected(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index)
      if (prev.length >= max) return prev
      return [...prev, index]
    })
  }

  const getCurrentOptions = () => {
    if (stage === STAGES.VIBE) return shuffledVibe
    if (stage === STAGES.WOUND) return shuffledWound
    if (stage === STAGES.CHILD) return shuffledChild
    return []
  }

  // --- Vote accumulation ---

  const applyVotes = (options, selectedIndices) => {
    const newVotes = { ...votes }
    selectedIndices.forEach(i => {
      const archetype = options[i].archetype
      newVotes[archetype] = (newVotes[archetype] || 0) + 1
    })
    setVotes(newVotes)
    return newVotes
  }

  // --- Stage advancement ---

  const handleQuizContinue = () => {
    if (selected.length === 0) return
    const options = getCurrentOptions()
    applyVotes(options, selected)
    setSelected([])

    if (stage === STAGES.VIBE) setStage(STAGES.WOUND)
    else if (stage === STAGES.WOUND) setStage(STAGES.CHILD)
    else if (stage === STAGES.CHILD) setStage(STAGES.CHARACTER)
  }

  const handleCharacterPick = (archetype) => {
    const updatedVotes = { ...votes }
    updatedVotes[archetype] = (updatedVotes[archetype] || 0) + 1
    setVotes(updatedVotes)
    resolveArchetype(updatedVotes)
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
        essence_archetype: finalArchetype,
        persona: null,
        protective_archetype: null,
        context: {
          source: 'essence-identify',
          quiz_votes: votes,
        }
      }])

      if (dbError) {
        // If it's a duplicate email, still proceed to reveal
        if (dbError.code === '23505') {
          console.warn('Duplicate email, proceeding to reveal')
        } else {
          console.error('Error saving profile:', dbError)
        }
      }

      // Fire-and-forget notification
      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email: email.toLowerCase(),
          name: userName,
          source: 'Essence Identify Quiz',
          meta: { essence_archetype: finalArchetype }
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

  // --- Reveal data ---

  const getArchetypeData = () => {
    if (!finalArchetype) return null
    return essenceProfiles.essence_archetypes?.find(
      a => a.name?.toLowerCase() === finalArchetype.toLowerCase()
    )
  }

  // --- Progress ---

  const quizStageIndex = QUIZ_STAGES.indexOf(stage)
  const progressPercent = stage === STAGES.NAME ? 0
    : quizStageIndex >= 0 ? ((quizStageIndex + 1) / 6) * 100
    : stage === STAGES.TIEBREAK ? 75
    : stage === STAGES.EMAIL ? 85
    : 100

  // --- Character groups filtered to voted archetypes ---

  const filteredCharacterGroups = useMemo(() => {
    return CHARACTER_GROUPS.filter(g => (votes[g.archetype] || 0) > 0)
  }, [votes])

  // ============ RENDER ============

  // NAME CAPTURE
  if (stage === STAGES.NAME) {
    return (
      <div className="essence-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: '5%' }} /></div>
        <div className="ei-container">
          <h1 className="ei-title">Discover Your Essence</h1>
          <div className="ei-intro animated-text">
            <p>Beneath the masks, the roles, and the expectations, there's a version of you that feels most alive.</p>
            <p>This short quiz will help you find it.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (userName.trim()) setStage(STAGES.VIBE) }} className="ei-form">
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
              Let's Go
            </button>
          </form>
        </div>
      </div>
    )
  }

  // QUIZ STEPS (Vibe, Wound, Child)
  if (stage === STAGES.VIBE || stage === STAGES.WOUND || stage === STAGES.CHILD) {
    const options = getCurrentOptions()
    const max = getMaxSelections()
    const stepConfig = {
      [STAGES.VIBE]: {
        title: `${userName}, when you feel most alive...`,
        subtitle: "What are you naturally being? Choose up to 4 that make something inside you say 'yes'.",
      },
      [STAGES.WOUND]: {
        title: "Which label stings the most?",
        subtitle: "Every essence gets called 'too much'. Read slowly. Choose up to 3 that hit hardest.",
      },
      [STAGES.CHILD]: {
        title: "Before the world told you who to be...",
        subtitle: "What did your inner child crave to do, be, or create? Choose up to 3.",
      },
    }
    const config = stepConfig[stage]

    return (
      <div className="essence-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
        <div className="ei-container ei-quiz">
          <h2 className="ei-question">{config.title}</h2>
          <p className="ei-subtext">{config.subtitle}</p>
          <div className="ei-options">
            {options.map((opt, i) => (
              <button
                key={i}
                className={`ei-option ${selected.includes(i) ? 'selected' : ''} ${selected.length >= max && !selected.includes(i) ? 'dimmed' : ''}`}
                onClick={() => toggleSelection(i)}
              >
                <span className="ei-option-emoji">{opt.emoji}</span>
                <span className="ei-option-text">{opt.label}</span>
                <span className={`ei-checkbox ${selected.includes(i) ? 'checked' : ''}`}>
                  {selected.includes(i) && <span className="ei-checkmark">&#10003;</span>}
                </span>
              </button>
            ))}
          </div>
          <button
            className="ei-button"
            disabled={selected.length === 0}
            onClick={handleQuizContinue}
          >
            Continue ({selected.length}/{max})
          </button>
        </div>
      </div>
    )
  }

  // CHARACTER PICK
  if (stage === STAGES.CHARACTER) {
    return (
      <div className="essence-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
        <div className="ei-container ei-quiz">
          <h2 className="ei-question">One last question, {userName}.</h2>
          <p className="ei-subtext">
            Imagine these characters were cast in a movie about your life purpose. Which group gets the lead role?
          </p>
          <div className="ei-character-groups">
            {filteredCharacterGroups.map((group, i) => (
              <button
                key={group.archetype}
                className="ei-character-group"
                onClick={() => handleCharacterPick(group.archetype)}
              >
                <span className="ei-group-letter">{String.fromCharCode(65 + i)}</span>
                <span className="ei-group-characters">
                  {group.characters.join(' \u2022 ')}
                </span>
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
      <div className="essence-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: '75%' }} /></div>
        <div className="ei-container ei-quiz">
          <h2 className="ei-question">Your essences are calling equally, {userName}.</h2>
          <p className="ei-subtext">Which one resonates deeper right now?</p>
          <div className="ei-options">
            {tiedArchetypes.map(name => {
              const profile = essenceProfiles.essence_archetypes?.find(a => a.name === name)
              return (
                <button
                  key={name}
                  className="ei-option tiebreak"
                  onClick={() => handleTiebreak(name)}
                >
                  <span className="ei-option-text">
                    <em>{profile?.poetic_line || name}</em>
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
      <div className="essence-identify">
        <div className="ei-progress"><div className="ei-progress-fill" style={{ width: '85%' }} /></div>
        <div className="ei-container">
          <h2 className="ei-question">Your essence is ready, {userName}.</h2>
          <p className="ei-subtext">Enter your email to see your full reveal.</p>
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
              {isLoading ? 'Saving...' : 'Reveal My Essence'}
            </button>
          </form>
          {error && <p className="ei-error">{error}</p>}
        </div>
      </div>
    )
  }

  // REVEAL
  if (stage === STAGES.REVEAL) {
    const data = getArchetypeData()
    if (!data) return null

    return (
      <div className="essence-identify reveal-bg">
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
          <div className="ei-reveal-image-wrap">
            <img
              src={`/images/archetypes/lead-magnet-essence/${data.name.toLowerCase().replace(/\s+/g, '-')}.webp`}
              alt={data.name}
              className="ei-reveal-image"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <div className="ei-reveal-badge">Your Essence</div>
          <h1 className="ei-reveal-name">{data.name}</h1>

          <p className="ei-reveal-poetic"><em>{data.poetic_line}</em></p>

          <div className="ei-reveal-section">
            <p className="ei-reveal-intro">You carry a frequency that others feel, even when they can't name it.</p>
            <p className="ei-reveal-highlight">{data.energetic_transmission}</p>
          </div>

          <div className="ei-reveal-section">
            <h3 className="ei-reveal-label">Your Essence</h3>
            <p>{data.essence}</p>
          </div>

          <div className="ei-reveal-section">
            <h3 className="ei-reveal-label">Your Superpower</h3>
            <p>{data.superpower}</p>
          </div>

          <div className="ei-reveal-section">
            <h3 className="ei-reveal-label">Your North Star</h3>
            <p>{data.north_star}</p>
          </div>

          <div className="ei-reveal-section">
            <h3 className="ei-reveal-label">A Vision For Your Future</h3>
            <p className="ei-reveal-vision"><em>{data.poetic_vision}</em></p>
          </div>

          <div className="ei-reveal-section">
            <h3 className="ei-reveal-label">When You Live This Truth Out Loud</h3>
            <p>{data.vision_in_action}</p>
          </div>

          <div className="ei-reveal-characters">
            <h3 className="ei-reveal-label">Others Who Share Your Essence</h3>
            <div className="ei-character-pills">
              {data.characters?.map(c => (
                <span key={c} className="ei-character-pill">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
