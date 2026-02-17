/**
 * HealingCompass V2 — Needs-based assessment with splinter visualization
 *
 * 12-step standalone flow (prerequisite for Nervous System):
 *   1. Intro — The 4 Human Needs (survive vs thrive)
 *   2. The Craving — emotional charge priming
 *   3-6. Individual need scripts + spotlight scroll + emotional charge rating
 *   6b. Results — ranked needs with tie-breaker
 *   7. Your Action — what would change everything
 *   8. Protective Pattern — which protector shows up
 *   9. The Recap — confrontation + "what does life look like?"
 *   10. The Splinter Explanation — pattern reframe + emotional splinter reveal
 *   11. Body scan — describe splinter across 6 properties
 *   12. See your splinter + Save & Continue
 *   Complete — FlowFeedback + Start Healing Quests CTA
 *
 * Saves to healing_compass_responses with flow_version: 2
 * Backward-compatible: ?results=true still loads v1 or v2 data
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import SplinterVisualization, { BODY_LOCATIONS } from '../components/SplinterVisualization'
import './NervousSystemHealingCompass.css'

// ============================================
// Constants
// ============================================

const NEEDS = [
  {
    key: 'life_design', label: 'Life Design', subtitle: 'Autonomy — freedom to choose', emoji: '🧭',
    emphasisLines: [3, 4, 5, 9, 11, 16],
    script: [
      "Imagine you're stuck in a life you didn't choose.",
      "A job you don't want. A routine that drains you. A path that was never yours.",
      "But you can't leave. Because the bills are real. The responsibilities are real.",
      "You're trapped. Not by chains — by circumstances.",
      "And the worst part?",
      "You KNOW there's more. You can feel it.",
      "Another version of your life. Another path. The one you were actually made for.",
      "You can see it. You just can't reach it.",
      "Part of you wants to break free. To bet on yourself. To feel ALIVE again.",
      "But another part whispers: 'What if it all falls apart? What if you leap and there's nothing there?'",
      "So you stay frozen. Craving adventure but terrified of the fall.",
      "Wanting to scream. But swallowing it down.",
      "Watching life pass by in grey while the colourful version of you waits somewhere you can't reach.",
      "So you reach for something. Anything. To feel alive for a moment.",
      "The scroll. The shop. The gamble. The late-night rabbit hole.",
      "A hit of novelty. A taste of excitement. A few seconds where you feel like you have a choice.",
      "But then it fades. And you're back in the grey. Needing more.",
    ],
  },
  {
    key: 'connection', label: 'Connection', subtitle: 'Relatedness — bonds with others', emoji: '🤝',
    emphasisLines: [2, 7, 9, 11, 13, 18],
    script: [
      "Imagine you're in a room full of people.",
      "Everyone is laughing. Talking. Connected.",
      "And you're there... but you're not IN it.",
      "You're on the outside looking in. Watching connection happen around you. But not to you.",
      "So you adapt. You shape-shift. You become what you think they want.",
      "You laugh at the right moments. Say the right things. Wear the right mask.",
      "And sometimes it works. They let you in.",
      "But here's the thing you fear most...",
      "If they really knew you — the unfiltered, unedited, real you...",
      "They wouldn't stay.",
      "So you keep performing. Keep shape-shifting. Keep earning love you never fully trust.",
      "Surrounded by people. Still completely alone.",
      "Because no one actually KNOWS you. And you're starting to wonder...",
      "Maybe you're just not lovable. Maybe this is as close as you get.",
      "So you reach for something that feels like connection. Even if it's not real.",
      "The scroll through social media. The likes. The comments. Someone saw you, even if just for a second.",
      "The text to someone you know you shouldn't text. The sweetness that fills the hole for a moment.",
      "The saying yes when you mean no — because at least they'll stay if you're useful.",
      "But none of it fills you. Because counterfeit connection can't touch the real ache.",
    ],
  },
  {
    key: 'mastery', label: 'Mastery', subtitle: 'Competence — ability to grow', emoji: '🎯',
    emphasisLines: [2, 7, 8, 10, 11, 17],
    script: [
      "Imagine you're giving everything you have.",
      "Your best effort. Your full attention. Showing up every single day.",
      "And it's not working.",
      "You look around and see others gliding past you. Making it look easy. Getting results you can't seem to crack.",
      "You're running at full speed... and somehow still falling behind.",
      "And the worst part isn't the failure.",
      "It's the question you can't escape:",
      "'What's wrong with me?'",
      "Not your strategy. Not your approach. YOU.",
      "That deep suspicion that everyone else got something you didn't.",
      "That you're fundamentally missing whatever it takes.",
      "And no one else seems to be struggling like this. Just you.",
      "Alone in that gap between how hard you're trying and what you have to show for it.",
      "So you do the only thing you know. You push harder.",
      "Work longer. Sleep less. One more revision. One more attempt.",
      "Maybe another coffee. Something to keep you sharp. Keep you going.",
      "Because if you just work hard ENOUGH, maybe you'll finally close the gap.",
      "But the gap never closes. And the exhaustion just builds.",
    ],
  },
  {
    key: 'meaning', label: 'Meaning', subtitle: 'Purpose — mattering beyond yourself', emoji: '💫',
    emphasisLines: [2, 7, 8, 11, 13, 15, 20],
    script: [
      "Imagine waking up tomorrow and doing all the things.",
      "The tasks. The work. The motions.",
      "But none of it matters to you.",
      "You're productive. You're busy. You're getting things done.",
      "But there's no fire. No pull. No reason that makes your chest burn.",
      "You look at what you're building and feel... nothing.",
      "And that question starts creeping in. The one you try not to ask:",
      "'What's the point?'",
      "Not sad. Not angry. Just... empty.",
      "You watch others light up about their work. Their mission. Their thing.",
      "And you wonder what that feels like. To care that much. To be pulled by something bigger than yourself.",
      "But you? You're just... here.",
      "Going through days that blur into weeks that blur into years.",
      "No legacy. No dent in the universe. Nothing that screams 'I WAS HERE AND IT MATTERED.'",
      "And underneath all of it, a quiet terror:",
      "What if this is it? What if you never find the thing that makes it all mean something?",
      "You feel an empty pit where purpose should be.",
      "So you fill it. With whatever makes the emptiness quiet.",
      "The drink that softens the edges. The episode that eats another night. The scroll into oblivion.",
      "Not because it feels good. Because feeling nothing is better than feeling this.",
      "But tomorrow the pit is still there. Waiting. Unchanged.",
    ],
  },
]

const PATTERNS = [
  { key: 'ghost', label: 'The Ghost', emoji: '👻', description: 'You disappear. Pull back. Go quiet. If they can\'t see you, they can\'t hurt you.' },
  { key: 'performer', label: 'The Performer', emoji: '🎭', description: 'You become what others need. Shapeshifting to earn love and avoid rejection.' },
  { key: 'controller', label: 'The Controller', emoji: '🎮', description: 'You grip tight. Micromanage. If everything is under control, nothing can go wrong.' },
  { key: 'perfectionist', label: 'The Perfectionist', emoji: '✨', description: 'Nothing is ever ready. You polish endlessly because imperfect means vulnerable.' },
  { key: 'people_pleaser', label: 'The People Pleaser', emoji: '🙏', description: 'You say yes to everything. Put everyone first. Your needs always come last.' },
]

const SHAPES = [
  { key: 'spike', label: 'Spike', emoji: '🔺' },
  { key: 'knot', label: 'Knot', emoji: '🪢' },
  { key: 'weight', label: 'Weight', emoji: '🧱' },
  { key: 'wall', label: 'Wall', emoji: '🧊' },
  { key: 'void', label: 'Void', emoji: '🕳️' },
  { key: 'cloud', label: 'Cloud', emoji: '☁️' },
  { key: 'flame', label: 'Flame', emoji: '🔥' },
  { key: 'ball', label: 'Ball', emoji: '⚫' },
]

const SIZES = [
  { key: 'tiny', label: 'Tiny' },
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
  { key: 'massive', label: 'Massive' },
]

const COLORS = [
  { key: '#ef4444', label: 'Red' },
  { key: '#f97316', label: 'Orange' },
  { key: '#eab308', label: 'Yellow' },
  { key: '#22c55e', label: 'Green' },
  { key: '#3b82f6', label: 'Blue' },
  { key: '#8b5cf6', label: 'Purple' },
  { key: '#1f2937', label: 'Black' },
  { key: '#9ca3af', label: 'Grey' },
]

const TEXTURES = [
  { key: 'rough', label: 'Rough' },
  { key: 'smooth', label: 'Smooth' },
  { key: 'burning', label: 'Burning' },
  { key: 'cold', label: 'Cold' },
  { key: 'sharp', label: 'Sharp' },
  { key: 'heavy', label: 'Heavy' },
  { key: 'tight', label: 'Tight' },
]

const MOVEMENTS = [
  { key: 'still', label: 'Still' },
  { key: 'pulsing', label: 'Pulsing' },
  { key: 'spinning', label: 'Spinning' },
  { key: 'expanding', label: 'Expanding' },
  { key: 'contracting', label: 'Contracting' },
  { key: 'vibrating', label: 'Vibrating' },
]

const BODY_ZONES = [
  { key: 'head', label: 'Head' },
  { key: 'throat', label: 'Throat' },
  { key: 'chest', label: 'Chest' },
  { key: 'stomach', label: 'Stomach' },
  { key: 'hips', label: 'Hips' },
  { key: 'left_arm', label: 'Left Arm' },
  { key: 'right_arm', label: 'Right Arm' },
  { key: 'thighs', label: 'Thighs' },
]

// Screen flow
const SCREEN_ORDER = [
  'loading', 'time_check', 'step1_intro', 'step2_craving',
  'step3_life_design', 'step4_connection', 'step5_mastery', 'step6_meaning',
  'step6b_results', 'step7_action', 'step8_pattern', 'step9_recap',
  'step9b_stuck', 'step10_body_scan', 'step11_splinter', 'complete'
]

// Spotlight scroll — dims all lines, lights 2-3 near viewport center, gold for emphasis
function SpotlightScript({ lines, emphasisLines = [] }) {
  const containerRef = useRef(null)
  const [spotlightIdx, setSpotlightIdx] = useState(0)

  useEffect(() => {
    // Reset scroll to top when a new slide mounts
    window.scrollTo(0, 0)
    setSpotlightIdx(0)

    const handleScroll = () => {
      const container = containerRef.current
      if (!container) return
      const els = container.querySelectorAll('[data-spotlight]')
      if (!els.length) return

      // Bias target higher when near top of page so first line is always lit
      const scrollProgress = Math.min(window.scrollY / 200, 1)
      const viewportCenter = window.innerHeight * (0.15 + 0.3 * scrollProgress)
      let closest = 0
      let minDist = Infinity

      els.forEach((el, i) => {
        const rect = el.getBoundingClientRect()
        const center = rect.top + rect.height / 2
        const dist = Math.abs(center - viewportCenter)
        if (dist < minDist) {
          minDist = dist
          closest = i
        }
      })

      setSpotlightIdx(closest)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lines.length])

  const nearEnd = spotlightIdx >= lines.length - 2

  return (
    <div ref={containerRef} className="hc-script-container hc-spotlight-mode">
      {lines.map((line, i) => {
        const distance = Math.abs(i - spotlightIdx)
        const isLit = distance <= 1
        const isEmphasis = emphasisLines.includes(i)
        return (
          <p
            key={i}
            data-spotlight
            className={`hc-spotlight-line${isLit ? ' spotlight' : ''}${isLit && isEmphasis ? ' emphasis' : ''}`}
          >
            {line}
          </p>
        )
      })}
      <p
        data-spotlight
        className={`hc-spotlight-prompt${nearEnd ? ' spotlight' : ''}`}
      >
        Notice what happens in your body right now.
      </p>
      <div className={`hc-scroll-nudge${nearEnd ? ' hidden' : ''}`}>
        <span>scroll</span>
        <div className="hc-scroll-arrow" />
      </div>
    </div>
  )
}

export default function HealingCompass() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [currentScreen, setCurrentScreen] = useState('loading')
  const [viewingResults, setViewingResults] = useState(false)
  const [saving, setSaving] = useState(false)

  // V2 responses
  const [needRatings, setNeedRatings] = useState({
    life_design: null,
    connection: null,
    mastery: null,
    meaning: null,
  })
  const [primaryNeed, setPrimaryNeed] = useState(null)
  const [showTieBreaker, setShowTieBreaker] = useState(false)
  const [tiedNeeds, setTiedNeeds] = useState([])
  const [actionText, setActionText] = useState('')
  const [futureText, setFutureText] = useState('')
  const [protectivePattern, setProtectivePattern] = useState(null)

  // Splinter properties
  const [splinter, setSplinter] = useState({
    location: null,
    shape: null,
    size: null,
    color: null,
    texture: null,
    movement: null,
  })

  // Auto-save
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('healing-compass', user?.id)

  // ============================================
  // Screen index for progress dots
  // ============================================

  const totalScreens = 14 // time_check through step11_splinter (excl loading/complete)
  const getScreenIndex = (screen) => {
    const map = {
      time_check: 0, step1_intro: 1, step2_craving: 2,
      step3_life_design: 3, step4_connection: 4, step5_mastery: 5, step6_meaning: 6,
      step6b_results: 7, step7_action: 8, step8_pattern: 9, step9_recap: 10,
      step9b_stuck: 11, step10_body_scan: 12, step11_splinter: 13
    }
    return map[screen] ?? 0
  }
  const currentScreenIndex = getScreenIndex(currentScreen)

  // ============================================
  // Navigation
  // ============================================

  const goBack = (fromScreen) => {
    const idx = SCREEN_ORDER.indexOf(fromScreen)
    if (idx > 1) { // Don't go back past time_check
      setCurrentScreen(SCREEN_ORDER[idx - 1])
    }
  }

  const BackButton = ({ fromScreen }) => (
    <button
      className="ns-hc-back-button"
      onClick={() => goBack(fromScreen)}
      style={{
        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontSize: '14px', padding: '4px 0 2px 0',
        marginTop: '16px', marginBottom: '0', display: 'block', width: '100%', textAlign: 'center'
      }}
    >
      ← Go Back
    </button>
  )

  // ============================================
  // Auto-save: resume / start fresh
  // ============================================

  const handleResumeProgress = () => {
    if (savedProgressData) {
      setCurrentScreen(savedProgressData.currentScreen)
      if (savedProgressData.needRatings) setNeedRatings(savedProgressData.needRatings)
      if (savedProgressData.primaryNeed) setPrimaryNeed(savedProgressData.primaryNeed)
      if (savedProgressData.actionText) setActionText(savedProgressData.actionText)
      if (savedProgressData.futureText) setFutureText(savedProgressData.futureText)
      if (savedProgressData.protectivePattern) setProtectivePattern(savedProgressData.protectivePattern)
      if (savedProgressData.splinter) setSplinter(savedProgressData.splinter)
    }
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }

  const handleStartFresh = () => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
    setCurrentScreen('step1_intro')
  }

  // ============================================
  // Load saved results (?results=true)
  // ============================================

  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        const { data, error } = await supabase
          .from('healing_compass_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          const saved = data[0]

          if (saved.flow_version === 2) {
            // Restore V2 data
            setNeedRatings(saved.need_ratings || {})
            setPrimaryNeed(saved.primary_need)
            setActionText(saved.action_text || '')
            setFutureText(saved.future_text || '')
            setProtectivePattern(saved.protective_pattern)
            setSplinter({
              location: saved.splinter_location,
              shape: saved.splinter_shape,
              size: saved.splinter_size,
              color: saved.splinter_color,
              texture: saved.splinter_texture,
              movement: saved.splinter_movement,
            })
          }

          setViewingResults(true)
          setCurrentScreen('step11_splinter')
        } else {
          setCurrentScreen('time_check')
        }
      } catch (err) {
        console.error('Error loading saved results:', err)
        setCurrentScreen('time_check')
      }
    }
    loadSavedResults()
  }, [searchParams, user])

  // ============================================
  // Check for saved progress on mount
  // ============================================

  useEffect(() => {
    if (user && searchParams.get('results') !== 'true') {
      const saved = loadProgress()
      if (saved && saved.currentScreen && saved.currentScreen !== 'time_check' &&
          saved.currentScreen !== 'complete' && saved.currentScreen !== 'loading') {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
        setCurrentScreen('time_check')
      } else {
        setCurrentScreen('time_check')
      }
    }
  }, [user, loadProgress, searchParams])

  // Auto-save on state changes
  useEffect(() => {
    if (!user || currentScreen === 'time_check' || currentScreen === 'complete' || currentScreen === 'loading') return
    saveProgress({ currentScreen, needRatings, primaryNeed, actionText, futureText, protectivePattern, splinter })
  }, [currentScreen, needRatings, primaryNeed, actionText, futureText, protectivePattern, splinter, user, saveProgress])

  // ============================================
  // Need rating logic
  // ============================================

  const setNeedRating = (needKey, value) => {
    setNeedRatings(prev => ({ ...prev, [needKey]: value }))
  }

  const allNeedsRated = Object.values(needRatings).every(v => v !== null)

  const computePrimaryNeed = () => {
    const maxVal = Math.max(...Object.values(needRatings))
    const tied = Object.entries(needRatings).filter(([, v]) => v === maxVal).map(([k]) => k)

    if (tied.length === 1) {
      setPrimaryNeed(tied[0])
      setShowTieBreaker(false)
    } else {
      setPrimaryNeed(null)
      setTiedNeeds(tied)
      setShowTieBreaker(true)
    }
    setCurrentScreen('step6b_results')
  }

  const resolveTie = (needKey) => {
    setPrimaryNeed(needKey)
  }

  // ============================================
  // Save & Complete
  // ============================================

  const saveAndComplete = async () => {
    if (saving) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('healing_compass_responses')
        .insert({
          user_id: user.id,
          user_name: user.user_metadata?.name || 'Anonymous',
          need_ratings: needRatings,
          primary_need: primaryNeed,
          action_text: actionText,
          future_text: futureText,
          protective_pattern: protectivePattern,
          splinter_location: splinter.location,
          splinter_shape: splinter.shape,
          splinter_size: splinter.size,
          splinter_color: splinter.color,
          splinter_texture: splinter.texture,
          splinter_movement: splinter.movement,
          flow_version: 2,
        })

      if (error) throw error

      await completeFlowQuest({
        userId: user.id,
        flowId: 'healing_compass',
        pointsEarned: 5,
      })

      clearProgress()
      setCurrentScreen('complete')
    } catch (err) {
      console.error('Error saving healing compass:', err)
      alert('Error saving your data. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ============================================
  // Helper: get display name for primary need
  // ============================================

  const getNeedLabel = (key) => NEEDS.find(n => n.key === key)?.label || key
  const getPatternLabel = (key) => PATTERNS.find(p => p.key === key)?.label || key

  // ============================================
  // Helper for resume prompt
  // ============================================

  const getScreenDisplayName = (screen) => {
    const names = {
      step1_intro: 'Step 1 — The 4 Needs',
      step2_craving: 'Step 2 — The Craving',
      step3_life_design: 'Step 3 — Life Design',
      step4_connection: 'Step 4 — Connection',
      step5_mastery: 'Step 5 — Mastery',
      step6_meaning: 'Step 6 — Meaning',
      step7_action: 'Step 7 — Your Action',
      step8_pattern: 'Step 8 — Protective Pattern',
      step9_recap: 'Step 9 — The Recap',
      step9b_stuck: 'Step 10 — The Stuck',
      step10_body_scan: 'Step 11 — Body Scan',
      step11_splinter: 'Step 12 — Your Splinter',
    }
    return names[screen] || screen
  }

  const getTimeSinceSave = () => {
    if (!savedProgressData?.savedAt) return null
    const minutesAgo = Math.floor((Date.now() - savedProgressData.savedAt) / 60000)
    if (minutesAgo < 1) return 'just now'
    if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
    const hoursAgo = Math.floor(minutesAgo / 60)
    return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
  }

  // ============================================
  // Splinter property helpers
  // ============================================

  const updateSplinter = (key, value) => {
    setSplinter(prev => ({ ...prev, [key]: value }))
  }

  const splinterComplete = splinter.location && splinter.shape && splinter.size &&
    splinter.color && splinter.texture && splinter.movement

  // ============================================
  // Screens
  // ============================================

  const renderLoading = () => (
    <div className="ns-hc-container ns-hc-processing-container">
      <div className="ns-hc-spinner"></div>
      <div className="ns-hc-processing-text">Loading...</div>
    </div>
  )

  const renderTimeCheck = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Healing Compass</h1>

      {showResumePrompt && savedProgressData && (
        <div className="ns-hc-resume-prompt">
          <p className="ns-hc-resume-title">Welcome back!</p>
          <p className="ns-hc-resume-info">
            You have saved progress at <strong>{getScreenDisplayName(savedProgressData.currentScreen)}</strong>
            <br />
            <span className="ns-hc-resume-time">Last saved {getTimeSinceSave()}</span>
          </p>
          <div className="ns-hc-resume-actions">
            <button className="ns-hc-primary-button" style={{ margin: 0, maxWidth: '280px' }} onClick={handleResumeProgress}>
              Continue Where I Left Off
            </button>
            <button className="ns-hc-secondary-button" style={{ margin: '12px 0 0 0', maxWidth: '280px' }} onClick={handleStartFresh}>
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {!showResumePrompt && (
        <>
          <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
            <p><span className="time-icon">⏱️</span></p>
            <p><strong>This flow takes about 8-12 minutes</strong></p>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>6 steps to understand what you need, what's stopping you, and where it lives in your body.</p>
            <p>Find a quiet space where you can be present with yourself.</p>
            <p><strong>This is deep self-work — be honest, not perfect.</strong></p>
          </div>

          <button className="primary-button glow-button" onClick={() => setCurrentScreen('step1_intro')}>
            I'm Ready
          </button>
          <button
            className="primary-button"
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none', marginTop: '12px' }}
          >
            Come Back Later
          </button>
        </>
      )}
    </div>
  )

  // ----- Step 1: Intro — The 4 Needs -----
  const renderStep1Intro = () => (
    <div className="ns-hc-container ns-hc-question-container ns-hc-centered">
      <div className="ns-hc-question-number">Step 1 of 12</div>
      <h2 className="ns-hc-question-text">The 4 Human Needs</h2>

      <p className="ns-hc-intro-lead">
        At the most basic level, humans need two things: to <span className="ns-hc-highlight">SURVIVE</span> and to <span className="ns-hc-highlight">THRIVE</span>.
      </p>

      <p className="ns-hc-intro-body">
        Two of these needs are about survival — making sure you're safe and not alone.
        <br />Two of these needs are about thriving — becoming more and mattering.
      </p>

      <div className="hc-needs-table">
        <div className="hc-needs-table-header">
          <div className="hc-needs-table-col">Survive</div>
          <div className="hc-needs-table-col">Thrive</div>
        </div>
        <div className="hc-needs-table-row">
          <div className="hc-needs-table-cell">🧭 Life Design<br /><span className="hc-needs-table-sub">Autonomy — freedom to choose</span></div>
          <div className="hc-needs-table-cell">🎯 Mastery<br /><span className="hc-needs-table-sub">Competence — ability to grow</span></div>
        </div>
        <div className="hc-needs-table-row">
          <div className="hc-needs-table-cell">🤝 Connection<br /><span className="hc-needs-table-sub">Relatedness — bonds with others</span></div>
          <div className="hc-needs-table-cell">💫 Meaning<br /><span className="hc-needs-table-sub">Purpose — mattering beyond yourself</span></div>
        </div>
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('step2_craving')}
        >
          Continue
        </button>
        <BackButton fromScreen="step1_intro" />
      </div>
    </div>
  )

  // ----- Step 2: The Craving -----
  const renderStep2Craving = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-centered-content">
        <div className="ns-hc-question-number">Step 2 of 12</div>

        <div className="ns-hc-intro-kicker">
          <p>One of these needs is subconsciously driving your life. One of them you crave more than others.</p>
          <p><strong>You don't crave what you've always had. You crave what was taken — or never given.</strong></p>
        </div>

        <p className="ns-hc-intro-body" style={{ marginTop: 16 }}>
          As you go through each on the next slides, observe the emotional charge you feel inside.
        </p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('step3_life_design')}
        >
          Continue
        </button>
        <BackButton fromScreen="step2_craving" />
      </div>
    </div>
  )

  // ----- Steps 3-6: Individual Need Scripts + Rating -----
  const NEED_SCREENS = [
    { needIndex: 0, stepNum: 3, screen: 'step3_life_design', nextScreen: 'step4_connection' },
    { needIndex: 1, stepNum: 4, screen: 'step4_connection', nextScreen: 'step5_mastery' },
    { needIndex: 2, stepNum: 5, screen: 'step5_mastery', nextScreen: 'step6_meaning' },
    { needIndex: 3, stepNum: 6, screen: 'step6_meaning', nextScreen: null }, // last one triggers computePrimaryNeed
  ]

  const renderNeedSlide = ({ needIndex, stepNum, screen, nextScreen }) => {
    const need = NEEDS[needIndex]
    const rating = needRatings[need.key]
    const isLast = !nextScreen

    const handleContinue = () => {
      if (isLast) {
        computePrimaryNeed()
      } else {
        setCurrentScreen(nextScreen)
      }
    }

    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Step {stepNum} of 12</div>
        <h2 className="ns-hc-question-text">{need.emoji} {need.label}</h2>
        <p className="ns-hc-question-subtext">{need.subtitle}</p>

        <SpotlightScript lines={need.script} emphasisLines={need.emphasisLines} />

        <div className="hc-charge-rating">
          <p className="hc-charge-label">How much did that hit you?</p>
          <div className="hc-rating-row">
            {[1, 2, 3, 4, 5, 6, 8, 9, 10].map(val => (
              <button
                key={val}
                className={`hc-rating-btn ${rating === val ? 'selected' : ''}`}
                onClick={() => setNeedRating(need.key, val)}
              >
                {val}
              </button>
            ))}
          </div>
          <div className="hc-charge-anchors">
            <span>Nothing</span>
            <span>Deeply</span>
          </div>
        </div>

        <div className="ns-hc-sticky-nav">
          <button
            className="ns-hc-primary-button"
            onClick={handleContinue}
            disabled={!rating}
            style={{ opacity: rating ? 1 : 0.5 }}
          >
            Continue
          </button>
          <BackButton fromScreen={screen} />
        </div>
      </div>
    )
  }

  // ----- Step 6b: Results — show ratings, handle ties -----
  const renderStep6bResults = () => {
    const sorted = [...NEEDS].sort((a, b) => (needRatings[b.key] || 0) - (needRatings[a.key] || 0))
    const maxVal = Math.max(...Object.values(needRatings))
    const hasTie = showTieBreaker

    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Your Emotional Charge</div>
        <h2 className="ns-hc-question-text">Here's what hit you</h2>

        <div className="hc-results-list">
          {sorted.map(need => {
            const val = needRatings[need.key] || 0
            const isTop = val === maxVal
            const isSelected = primaryNeed === need.key
            const isTappable = hasTie && isTop
            return (
              <div
                key={need.key}
                role={isTappable ? 'button' : undefined}
                tabIndex={isTappable ? 0 : undefined}
                className={`hc-results-row${isTop ? ' top' : ''}${isSelected ? ' selected' : ''}${isTappable && !isSelected ? ' tappable' : ''}`}
                onClick={isTappable ? () => resolveTie(need.key) : undefined}
              >
                {isTappable && (
                  <span className={`hc-results-radio${isSelected ? ' checked' : ''}`} />
                )}
                <span className="hc-results-emoji">{need.emoji}</span>
                <div className="hc-results-info">
                  <span className="hc-results-name">{need.label}</span>
                  <div className="hc-results-bar-track">
                    <div
                      className="hc-results-bar-fill"
                      style={{ width: `${val * 10}%` }}
                    />
                  </div>
                </div>
                <span className="hc-results-score">{val}</span>
              </div>
            )
          })}
        </div>

        {hasTie && !primaryNeed && (
          <div className="hc-tiebreaker" style={{ marginTop: 16 }}>
            <p className="hc-tiebreaker-text">
              Two needs hit equally hard at <strong>{maxVal}/10</strong>.<br />
              Tap the one that resonated most.
            </p>
          </div>
        )}

        {primaryNeed && (
          <p className="hc-script-prompt" style={{ marginTop: 24 }}>
            Your primary need is {getNeedLabel(primaryNeed)}.
          </p>
        )}

        <div className="ns-hc-sticky-nav">
          <button
            className="ns-hc-primary-button"
            onClick={() => setCurrentScreen('step7_action')}
            disabled={!primaryNeed}
            style={{ opacity: primaryNeed ? 1 : 0.5 }}
          >
            Continue
          </button>
          <BackButton fromScreen="step6b_results" />
        </div>
      </div>
    )
  }

  // ----- Step 7: The Action -----
  const renderStep7Action = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 7 of 12</div>

      <div className="ns-hc-intro-kicker" style={{ marginTop: 8 }}>
        <p>Now ask yourself...</p>
        <p>To honour this need I have. What <strong>ACTION</strong> do I need to take?</p>
        <p>Not a vague intention. A specific action.</p>
        <p>Something you <strong>KNOW</strong> you should do... but haven't.</p>
      </div>

      <p className="hc-script-prompt" style={{ marginTop: 24, marginBottom: 32 }}>
        What's the action that would change everything... if you actually took it.
      </p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Example: I need to set boundaries with my workload so I can actually pursue what lights me up..."
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
        />
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('step8_pattern')}
          disabled={!actionText.trim()}
          style={{ opacity: actionText.trim() ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="step7_action" />
      </div>
    </div>
  )

  // ----- Step 4: Protective Pattern -----
  const renderStep8Pattern = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 8 of 12</div>

      <div className="ns-hc-intro-kicker" style={{ marginTop: 8 }}>
        <p>Now here's the real question...</p>
        <p>If you <strong>KNOW</strong> what to do... why haven't you done it?</p>
        <p>Something is stopping you. A protective pattern. A way of keeping yourself safe that you learned a long time ago.</p>
      </div>

      <p className="hc-script-prompt" style={{ marginTop: 24, marginBottom: 8 }}>
        Which protector shows up for you?
      </p>

      <div className="ns-hc-contract-list">
        {PATTERNS.map(pattern => (
          <button
            key={pattern.key}
            className={`ns-hc-contract-option ${protectivePattern === pattern.key ? 'selected' : ''}`}
            onClick={() => setProtectivePattern(pattern.key)}
          >
            <span style={{ fontSize: '20px', marginRight: '8px' }}>{pattern.emoji}</span>
            <strong>{pattern.label}</strong>
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{pattern.description}</span>
          </button>
        ))}
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('step9_recap')}
          disabled={!protectivePattern}
          style={{ opacity: protectivePattern ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="step8_pattern" />
      </div>
    </div>
  )

  // ----- Step 5: Recap -----
  const renderStep9Recap = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 9 of 12</div>

      <div className="ns-hc-intro-kicker" style={{ marginTop: 8 }}>
        <p>So let's get this straight.</p>
        <p>You know the need that's running your life. <strong>{getNeedLabel(primaryNeed)}</strong>.</p>
        <p>You know the action that would change everything. <strong>{actionText}</strong>.</p>
        <p>And you know the pattern that keeps stopping you. <strong>{getPatternLabel(protectivePattern)}</strong>.</p>
        <p>You've probably known this for a while. Maybe years.</p>
        <p>So here's my question...</p>
        <p>If nothing changes — if this pattern keeps running you for another 5 years... 10 years...</p>
      </div>

      <p className="hc-script-prompt" style={{ marginTop: 24, marginBottom: 32 }}>
        What does life look like?
      </p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Be honest with yourself..."
          value={futureText}
          onChange={(e) => setFutureText(e.target.value)}
        />
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('step9b_stuck')}
          disabled={!futureText.trim()}
          style={{ opacity: futureText.trim() ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="step9_recap" />
      </div>
    </div>
  )

  // ----- Step 9b: The Splinter Explanation -----
  const renderStep9bStuck = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Step 10 of 12</div>

      <div className="ns-hc-intro-kicker" style={{ marginTop: 8 }}>
        <p>I'm guessing you didn't wake up this morning and think "you know what, today I'm going to be <strong>{getPatternLabel(protectivePattern)}</strong>..."</p>
        <p>No. Something between the time you were that carefree kid and today... something happened that made this pattern feel necessary.</p>
        <p>That pattern isn't a flaw. It's your body's outdated survival strategy.</p>
      </div>

      <p className="hc-script-prompt" style={{ marginTop: 24 }}>
        This is the emotional splinter keeping you stuck in your pursuit of {getNeedLabel(primaryNeed)}.
      </p>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('step10_body_scan')}
        >
          Continue
        </button>
        <BackButton fromScreen="step9b_stuck" />
      </div>
    </div>
  )

  // ----- Step 10: Body Scan (single scrollable page with 6 sections) -----
  const renderStep10BodyScan = () => (
    <div className="ns-hc-container ns-hc-question-container hc-body-scan">
      <div className="ns-hc-question-number">Step 11 of 12</div>
      <h2 className="ns-hc-question-text">Where does it live in your body?</h2>
      <p className="ns-hc-question-subtext">
        Close your eyes for a moment. Think about that emotional charge you felt for {getNeedLabel(primaryNeed)}.
        Take three deep breaths and drop your awareness into your body.
        Where do you feel it? Describe what you sense.
      </p>

      {/* 1. Location */}
      <div className="hc-scan-section">
        <h3 className="hc-scan-label">Location</h3>
        <p className="hc-scan-hint">Tap where you feel it most</p>
        <div className="hc-body-zones">
          <svg viewBox="0 0 300 440" className="hc-body-svg" xmlns="http://www.w3.org/2000/svg">
            {/* Body outline */}
            <g fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
              <ellipse cx="150" cy="45" rx="28" ry="34" />
              <line x1="140" y1="78" x2="140" y2="100" />
              <line x1="160" y1="78" x2="160" y2="100" />
              <path d="M140,100 Q120,100 90,120" />
              <path d="M160,100 Q180,100 210,120" />
              <path d="M90,120 L85,200 Q85,215 100,220" />
              <path d="M210,120 L215,200 Q215,215 200,220" />
              <path d="M100,220 Q100,240 110,260" />
              <path d="M200,220 Q200,240 190,260" />
              <path d="M90,120 Q70,160 65,200 Q62,215 60,230" />
              <path d="M210,120 Q230,160 235,200 Q238,215 240,230" />
              <path d="M110,260 Q115,320 120,380 Q122,400 118,420" />
              <path d="M190,260 Q185,320 180,380 Q178,400 182,420" />
              <path d="M118,420 Q110,430 105,430" />
              <path d="M182,420 Q190,430 195,430" />
            </g>
            {/* Tappable zones */}
            {BODY_ZONES.map(zone => {
              const pos = BODY_LOCATIONS[zone.key]
              if (!pos) return null
              const isSelected = splinter.location === zone.key
              return (
                <g key={zone.key} onClick={() => updateSplinter('location', zone.key)} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={zone.key === 'head' ? 32 : 28}
                    className={`hc-zone-circle ${isSelected ? 'selected' : ''}`}
                  />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="hc-zone-label">
                    {zone.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        {/* Fallback dropdown for small screens */}
        <select
          className="hc-zone-dropdown"
          value={splinter.location || ''}
          onChange={(e) => updateSplinter('location', e.target.value)}
        >
          <option value="" disabled>Or select a location...</option>
          {BODY_ZONES.map(z => <option key={z.key} value={z.key}>{z.label}</option>)}
        </select>
      </div>

      {/* 2. Shape */}
      <div className="hc-scan-section">
        <h3 className="hc-scan-label">Shape</h3>
        <p className="hc-scan-hint">What does it look like?</p>
        <div className="hc-option-grid hc-option-grid--4">
          {SHAPES.map(s => (
            <button
              key={s.key}
              className={`hc-option-btn ${splinter.shape === s.key ? 'selected' : ''}`}
              onClick={() => updateSplinter('shape', s.key)}
            >
              <span className="hc-option-emoji">{s.emoji}</span>
              <span className="hc-option-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Size */}
      <div className="hc-scan-section">
        <h3 className="hc-scan-label">Size</h3>
        <p className="hc-scan-hint">How big does it feel?</p>
        <div className="hc-size-row">
          {SIZES.map(s => (
            <button
              key={s.key}
              className={`hc-size-btn ${splinter.size === s.key ? 'selected' : ''}`}
              onClick={() => updateSplinter('size', s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Color */}
      <div className="hc-scan-section">
        <h3 className="hc-scan-label">Color</h3>
        <p className="hc-scan-hint">If it had a color, what would it be?</p>
        <div className="hc-color-swatches">
          {COLORS.map(c => (
            <button
              key={c.key}
              className={`hc-color-swatch ${splinter.color === c.key ? 'selected' : ''}`}
              onClick={() => updateSplinter('color', c.key)}
              style={{ background: c.key }}
              title={c.label}
            >
              {splinter.color === c.key && <span className="hc-swatch-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Texture */}
      <div className="hc-scan-section">
        <h3 className="hc-scan-label">Texture</h3>
        <p className="hc-scan-hint">What does it feel like to touch?</p>
        <div className="hc-option-grid hc-option-grid--3">
          {TEXTURES.map(t => (
            <button
              key={t.key}
              className={`hc-option-btn ${splinter.texture === t.key ? 'selected' : ''}`}
              onClick={() => updateSplinter('texture', t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Movement */}
      <div className="hc-scan-section">
        <h3 className="hc-scan-label">Movement</h3>
        <p className="hc-scan-hint">Is it still, or does it move?</p>
        <div className="hc-option-grid hc-option-grid--3">
          {MOVEMENTS.map(m => (
            <button
              key={m.key}
              className={`hc-option-btn ${splinter.movement === m.key ? 'selected' : ''}`}
              onClick={() => updateSplinter('movement', m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('step11_splinter')}
          disabled={!splinterComplete}
          style={{ opacity: splinterComplete ? 1 : 0.5 }}
        >
          See My Splinter
        </button>
        <BackButton fromScreen="step10_body_scan" />
      </div>
    </div>
  )

  // ----- Step 7: Your Splinter -----
  const renderStep11Splinter = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">{viewingResults ? 'Your Results' : 'Step 12 of 12'}</div>
      <h2 className="ns-hc-question-text">Your Emotional Splinter</h2>
      <p className="ns-hc-question-subtext">
        This is the part of you that's been protecting you from {getNeedLabel(primaryNeed)?.toLowerCase()}.
        As you complete healing quests, you'll see it transform.
      </p>

      {/* Splinter visualization */}
      <div style={{ margin: '24px 0' }}>
        <SplinterVisualization
          location={splinter.location}
          shape={splinter.shape}
          size={splinter.size}
          color={splinter.color}
          texture={splinter.texture}
          movement={splinter.movement}
          showBody={false}
        />
      </div>

      {/* Location badge */}
      <div className="hc-location-badge">
        <span className="hc-location-dot" style={{ background: splinter.color }} />
        Located in: {BODY_ZONES.find(z => z.key === splinter.location)?.label}
      </div>

      {/* Property summary */}
      <div className="ns-hc-result-box" style={{ marginTop: 16 }}>
        <div className="hc-prop-row"><span className="hc-prop-label">Shape</span><span className="hc-prop-value">{SHAPES.find(s => s.key === splinter.shape)?.label}</span></div>
        <div className="hc-prop-row"><span className="hc-prop-label">Size</span><span className="hc-prop-value">{SIZES.find(s => s.key === splinter.size)?.label}</span></div>
        <div className="hc-prop-row"><span className="hc-prop-label">Color</span><span className="hc-prop-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: splinter.color, display: 'inline-block', border: '1px solid rgba(255,255,255,0.3)' }} />{COLORS.find(c => c.key === splinter.color)?.label}</span></div>
        <div className="hc-prop-row"><span className="hc-prop-label">Texture</span><span className="hc-prop-value">{TEXTURES.find(t => t.key === splinter.texture)?.label}</span></div>
        <div className="hc-prop-row"><span className="hc-prop-label">Movement</span><span className="hc-prop-value">{MOVEMENTS.find(m => m.key === splinter.movement)?.label}</span></div>
      </div>

      <div className="ns-hc-sticky-nav">
        {viewingResults ? (
          <button className="ns-hc-primary-button" onClick={() => navigate('/7-day-challenge')}>
            ← Back to 7-Day Challenge
          </button>
        ) : (
          <button
            className="ns-hc-primary-button"
            onClick={saveAndComplete}
            disabled={saving}
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        )}
        {!viewingResults && <BackButton fromScreen="step11_splinter" />}
      </div>
    </div>
  )

  // ----- Complete -----
  const renderComplete = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <h1 className="ns-hc-welcome-greeting">Splinter Mapped</h1>
      <div className="ns-hc-welcome-message">
        <p>You've identified the emotional splinter that's been driving your <strong>{getPatternLabel(protectivePattern)}</strong> pattern.</p>
        <p>As you complete Healing quests, you'll check in on this splinter and watch it transform over time.</p>
        <p>This is the beginning of real, lasting change.</p>
      </div>

      <FlowFeedback flowType="healing_compass" userId={user?.id} />

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => navigate('/7-day-challenge?tab=healing')}
        >
          Start Healing Quests
        </button>
      </div>
    </div>
  )

  // ============================================
  // Render
  // ============================================

  return (
    <div className="ns-hc-app">
      {/* Progress dots */}
      {currentScreen !== 'loading' && currentScreen !== 'complete' && (
        <div className="ns-hc-progress-container">
          <div className="ns-hc-progress-dots">
            {Array.from({ length: totalScreens }).map((_, index) => (
              <div
                key={index}
                className={`ns-hc-progress-dot ${
                  index < currentScreenIndex ? 'completed' :
                  index === currentScreenIndex ? 'active' : ''
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screen content */}
      {currentScreen === 'loading' && renderLoading()}
      {currentScreen === 'time_check' && renderTimeCheck()}
      {currentScreen === 'step1_intro' && renderStep1Intro()}
      {currentScreen === 'step2_craving' && renderStep2Craving()}
      {NEED_SCREENS.map(ns => (
        currentScreen === ns.screen && <div key={ns.screen} style={{ width: '100%' }}>{renderNeedSlide(ns)}</div>
      ))}
      {currentScreen === 'step6b_results' && renderStep6bResults()}
      {currentScreen === 'step7_action' && renderStep7Action()}
      {currentScreen === 'step8_pattern' && renderStep8Pattern()}
      {currentScreen === 'step9_recap' && renderStep9Recap()}
      {currentScreen === 'step9b_stuck' && renderStep9bStuck()}
      {currentScreen === 'step10_body_scan' && renderStep10BodyScan()}
      {currentScreen === 'step11_splinter' && renderStep11Splinter()}
      {currentScreen === 'complete' && renderComplete()}
    </div>
  )
}
