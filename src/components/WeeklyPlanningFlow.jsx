/**
 * WeeklyPlanningFlow.jsx
 *
 * Multi-step flow for weekly intention setting.
 * Replaces discrete 7-day challenge starts with auto-rolling weekly rhythm.
 *
 * Flow Screens:
 * 1. Week Type Selection (push/flow/rest/launch)
 * 2. Foundation Check (conditional - if NS/Healing incomplete)
 * 3. Morning Reconnect Builder
 * 4. Weekly Groan Carousel (Nic's story)
 * 5. Conditional Commitments (Healing Priority + 3% Improvement)
 * 6. Week Plan Summary
 *
 * Created: Dec 2024
 * See docs/weekly-planning-system-plan.md
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { trackWeeklyPlanCompleted } from '../lib/analytics'
import './WeeklyPlanningFlow.css'

// Week types with descriptions
const WEEK_TYPES = [
  {
    id: 'push',
    label: 'Push Week',
    icon: '🔥',
    description: 'Go all in, stretch your edges',
    color: '#ef4444'
  },
  {
    id: 'flow',
    label: 'Flow Week',
    icon: '🌊',
    description: 'Balanced, sustainable rhythm',
    color: '#3b82f6'
  },
  {
    id: 'rest',
    label: 'Rest Week',
    icon: '🌙',
    description: 'Lighter load, focus on reconnect',
    color: '#8b5cf6'
  },
  {
    id: 'launch',
    label: 'Launch Week',
    icon: '🎯',
    description: 'Heavy business focus',
    color: '#f59e0b'
  }
]

// Morning routine options with quest IDs
const MORNING_ROUTINES = [
  { id: 'meditation', label: 'Meditation', icon: '🧘', points: 5 },
  { id: 'breathwork', label: 'Breathwork', icon: '🌬️', points: 5 },
  { id: 'rise_vibe_dance', label: 'Rise & Vibe Dance', icon: '💃', points: 3 },
  { id: 'daily_prayer', label: 'Daily Prayer', icon: '🙏', points: 4 },
  { id: 'self_identified', label: 'Self-Identified Activity', icon: '✨', points: 3 }
]

// Big release practice options
const RELEASE_PRACTICES = [
  { id: 'extended_breathwork', label: 'Extended Breathwork' },
  { id: 'shaking', label: 'Shaking' },
  { id: 'cold_exposure', label: 'Cold Exposure' },
  { id: 'journaling', label: 'Journaling' },
  { id: 'movement', label: 'Movement' },
  { id: 'other', label: 'Other' }
]

// Days of the week
const DAYS = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' }
]

// Fear types (multi-select)
const FEAR_TYPES = [
  { id: 'judged', label: 'Judged', icon: '👁️' },
  { id: 'not_enough', label: 'Not Enough', icon: '🤦' },
  { id: 'might_fail', label: 'Might Fail', icon: '💥' }
]

// Visibility layers (5 layers)
const VISIBILITY_LAYERS = [
  { id: 'screen', label: 'SCREEN', icon: '📱', desc: 'Behind a screen - social media, emails, messages. Safe distance from real interaction.' },
  { id: 'live', label: 'LIVE', icon: '⚡', desc: 'Face-to-face or live video. Real-time visibility with immediate feedback.' },
  { id: 'tribe', label: 'TRIBE', icon: '👥', desc: 'Your inner circle - friends, family, colleagues. People whose opinion matters most.' },
  { id: 'money', label: 'MONEY', icon: '💰', desc: 'Asking for money or selling. Where your worth gets a price tag.' },
  { id: 'heart', label: 'HEART', icon: '💗', desc: 'Deep vulnerability - sharing your true self, dreams, or fears. Maximum exposure.' }
]

// Groan storytelling slides (Nic's story)
const GROAN_SLIDES = [
  {
    title: "The Weekly Groan",
    content: "This is the thing that changed everything for me."
  },
  {
    title: null,
    content: "In March 2020, I had my awakening.\n\nI realized I'd never find fulfilment in what I thought was my dream job.\n\nOver the next year, I built a vision:\nWorking for myself. Living anywhere. Purposeful work."
  },
  {
    title: null,
    content: "But by 2023—three years later—I was still in the same job I knew was wrong.\n\nWhy?\n\nBecause we don't rise to the level of our ambitions.\nWe fall to the level of what feels safe."
  },
  {
    title: null,
    content: "Fed up, I challenged myself:\nOne thing that terrified me. Every week. For a year.\n\nWeek 5: Moved to Bali\nWeek 12: Quit my job\nWeek 16: Funding my life hosting silent discos on beaches in Thailand\n\nIn 6 months, 3 years of dreams became reality."
  },
  {
    title: "Your Turn",
    content: "How?\n\nBy completing these \"groans\" and retraining my nervous system around what felt safe.\n\nNow it's your turn."
  }
]

function WeeklyPlanningFlow({ onComplete, existingPlan = null }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Current step in the flow
  const [step, setStep] = useState(1)

  // Foundation check state
  const [hasNervousSystem, setHasNervousSystem] = useState(null)
  const [hasHealingCompass, setHasHealingCompass] = useState(null)
  const [showFoundationStep, setShowFoundationStep] = useState(false)

  // Form data
  const [weekType, setWeekType] = useState(existingPlan?.week_type || null)
  const [morningRoutine, setMorningRoutine] = useState(existingPlan?.morning_routine || [])
  const [groanSlide, setGroanSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState(null) // 'left' | 'right' | null
  const [touchStart, setTouchStart] = useState(null)
  const [groanDescription, setGroanDescription] = useState(existingPlan?.weekly_groan_description || '')
  const [groanDay, setGroanDay] = useState(existingPlan?.weekly_groan_day || null)
  const [groanFears, setGroanFears] = useState(existingPlan?.weekly_groan_fears || [])
  const [groanLayer, setGroanLayer] = useState(existingPlan?.weekly_groan_layer || null)
  const [healingPriority, setHealingPriority] = useState(existingPlan?.big_release_practice ? true : false)
  const [bigReleasePractice, setBigReleasePractice] = useState(existingPlan?.big_release_practice || null)
  const [bigReleaseDay, setBigReleaseDay] = useState(existingPlan?.big_release_day || null)
  const [delivering, setDelivering] = useState(existingPlan?.three_percent_improvement ? true : false)
  const [threePercentImprovement, setThreePercentImprovement] = useState(existingPlan?.three_percent_improvement || '')
  const [foundationReminder, setFoundationReminder] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Check foundation flows on mount
  useEffect(() => {
    if (user) {
      checkFoundationFlows()
    }
  }, [user])

  const checkFoundationFlows = async () => {
    try {
      // Check nervous system
      const { data: nsData } = await supabase
        .from('nervous_system_responses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      // Check healing compass
      const { data: hcData } = await supabase
        .from('healing_compass_responses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      setHasNervousSystem(!!nsData)
      setHasHealingCompass(!!hcData)
      setShowFoundationStep(!nsData || !hcData)
    } catch (err) {
      console.error('Error checking foundation flows:', err)
      setShowFoundationStep(false)
    }
  }

  // Get Monday of current week
  const getWeekStart = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    const monday = new Date(now.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  // Get week label
  const getWeekLabel = () => {
    const monday = new Date(getWeekStart())
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate total steps (accounting for conditional foundation step)
  const getTotalSteps = () => {
    return showFoundationStep ? 6 : 5
  }

  // Get actual step number for display
  const getDisplayStep = () => {
    if (!showFoundationStep && step > 1) {
      return step - 1
    }
    return step
  }

  // Navigation
  const canContinue = () => {
    // Determine what's actually being rendered at this step
    const isGroanStep = (showFoundationStep && step === 4) || (!showFoundationStep && step === 3)
    const isMorningStep = (showFoundationStep && step === 3) || (!showFoundationStep && step === 2)
    const isConditionalsStep = (showFoundationStep && step === 5) || (!showFoundationStep && step === 4)

    if (step === 1) return weekType !== null

    if (step === 2 && showFoundationStep) return true // Foundation check - can always skip

    if (isMorningStep) return morningRoutine.length > 0

    if (isGroanStep) {
      if (groanSlide < GROAN_SLIDES.length - 1) return true // Can swipe through
      // On last slide, require description, day, fears and layer
      return groanDescription.trim().length > 0 && groanDay !== null && groanFears.length > 0 && groanLayer !== null
    }

    if (isConditionalsStep) return true // All optional

    // Summary or any other step
    return true
  }

  const handleNext = () => {
    // Determine if we're on groan step
    const isGroanStep = (showFoundationStep && step === 4) || (!showFoundationStep && step === 3)

    // Special handling for foundation step - skip step 2 (foundation check)
    if (step === 1 && !showFoundationStep) {
      setStep(2) // Go to morning routine (step 2 when no foundation)
    } else if (isGroanStep && groanSlide < GROAN_SLIDES.length - 1) {
      setSlideDirection('left')
      setGroanSlide(groanSlide + 1) // Just advance slide
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    // Determine if we're on groan step
    const isGroanStep = (showFoundationStep && step === 4) || (!showFoundationStep && step === 3)

    if (isGroanStep && groanSlide > 0) {
      setSlideDirection('right')
      setGroanSlide(groanSlide - 1)
    } else if (step === 2 && !showFoundationStep) {
      setStep(1) // Skip back over foundation (which is step 2 when shown)
    } else {
      setStep(step - 1)
    }
  }

  const toggleMorningRoutine = (routineId) => {
    setMorningRoutine(prev =>
      prev.includes(routineId)
        ? prev.filter(id => id !== routineId)
        : [...prev, routineId]
    )
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      const weekStart = getWeekStart()

      const planData = {
        user_id: user.id,
        week_start: weekStart,
        week_type: weekType,
        morning_routine: morningRoutine,
        weekly_groan_description: groanDescription.trim() || null,
        weekly_groan_day: groanDay,
        weekly_groan_fears: groanFears,
        weekly_groan_layer: groanLayer,
        weekly_groan_completed: false,
        big_release_practice: healingPriority ? bigReleasePractice : null,
        big_release_day: healingPriority ? bigReleaseDay : null,
        three_percent_improvement: delivering ? threePercentImprovement.trim() : null,
        foundation_reminder: foundationReminder,
        updated_at: new Date().toISOString()
      }

      // Upsert (update if exists, insert if not)
      const { error: saveError } = await supabase
        .from('weekly_plans')
        .upsert(planData, {
          onConflict: 'user_id,week_start'
        })

      if (saveError) throw saveError

      // Track analytics
      trackWeeklyPlanCompleted({
        weekType: planData.week_type,
        morningRoutineCount: planData.morning_routine?.length || 0,
        hasGroan: !!planData.weekly_groan_description,
        hasRelease: !!planData.big_release_practice,
        has3Percent: !!planData.three_percent_improvement
      })

      // Call completion handler if provided
      if (onComplete) {
        onComplete(planData)
      } else {
        // Default: navigate to challenge
        navigate('/7-day-challenge')
      }
    } catch (err) {
      console.error('Error saving weekly plan:', err)
      setError('Failed to save your plan. Please try again.')
      setSaving(false)
    }
  }

  // Render Step 1: Week Type Selection
  const renderWeekTypeSelection = () => (
    <div className="planning-step week-type-step">
      <h2>What kind of week is this?</h2>
      <p className="step-subtitle">Set your intention for the week ahead</p>

      <div className="week-type-grid">
        {WEEK_TYPES.map(type => (
          <button
            key={type.id}
            className={`week-type-card ${weekType === type.id ? 'selected' : ''}`}
            onClick={() => setWeekType(type.id)}
            style={{
              '--type-color': type.color,
              borderColor: weekType === type.id ? type.color : undefined
            }}
          >
            <span className="type-icon">{type.icon}</span>
            <span className="type-label">{type.label}</span>
            <span className="type-desc">{type.description}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // Render Step 2: Foundation Check (conditional)
  const renderFoundationCheck = () => (
    <div className="planning-step foundation-step">
      <h2>Before we plan...</h2>

      <div className="foundation-info">
        <p>
          <strong>Nervous System</strong> + <strong>Healing Compass</strong> are foundational flows
          that unlock your personalized healing journey.
        </p>
        <p>
          They reveal <em>WHY</em> your protective voice shows up and
          give you tools to release what's blocking you.
        </p>
      </div>

      <div className="foundation-status">
        <div className={`status-item ${hasNervousSystem ? 'complete' : 'incomplete'}`}>
          <span className="status-icon">{hasNervousSystem ? '✅' : '⭕'}</span>
          <span>Nervous System</span>
        </div>
        <div className={`status-item ${hasHealingCompass ? 'complete' : 'incomplete'}`}>
          <span className="status-icon">{hasHealingCompass ? '✅' : '⭕'}</span>
          <span>Healing Compass</span>
        </div>
      </div>

      <div className="foundation-actions">
        {!hasNervousSystem && (
          <button
            className="foundation-btn primary"
            onClick={() => navigate('/nervous-system')}
          >
            🧠 Do Nervous System Now
          </button>
        )}
        <button
          className="foundation-btn secondary"
          onClick={() => {
            setFoundationReminder(true)
            handleNext()
          }}
        >
          📅 I'll do it this week
        </button>
        <button
          className="foundation-btn skip"
          onClick={handleNext}
        >
          Skip for now
        </button>
      </div>
    </div>
  )

  // Render Step 3: Morning Routine Builder
  const renderMorningRoutine = () => (
    <div className="planning-step routine-step">
      <h2>Pick your morning reconnection routine:</h2>
      <p className="step-subtitle">Select what you'll commit to each morning this week</p>

      <div className="routine-grid">
        {MORNING_ROUTINES.map(routine => (
          <button
            key={routine.id}
            className={`routine-card ${morningRoutine.includes(routine.id) ? 'selected' : ''}`}
            onClick={() => toggleMorningRoutine(routine.id)}
          >
            <span className="routine-icon">{routine.icon}</span>
            <span className="routine-label">{routine.label}</span>
            <span className="routine-points">{routine.points} pts</span>
          </button>
        ))}
      </div>

      {weekType === 'rest' && (
        <p className="week-hint">
          💡 Rest week? Consider a lighter routine with just 1-2 practices.
        </p>
      )}
      {weekType === 'push' && (
        <p className="week-hint">
          💡 Push week! Challenge yourself with a full morning routine.
        </p>
      )}
    </div>
  )

  // Handle carousel swipe gestures
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (touchStart === null) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    // Require at least 50px swipe
    if (Math.abs(diff) > 50) {
      if (diff > 0 && groanSlide < GROAN_SLIDES.length - 1) {
        // Swipe left - go next
        setSlideDirection('left')
        setGroanSlide(prev => prev + 1)
      } else if (diff < 0 && groanSlide > 0) {
        // Swipe right - go back
        setSlideDirection('right')
        setGroanSlide(prev => prev - 1)
      }
    }
    setTouchStart(null)
  }

  const goToSlide = (idx) => {
    if (idx === groanSlide) return
    setSlideDirection(idx > groanSlide ? 'left' : 'right')
    setGroanSlide(idx)
  }

  // Render Step 4: Weekly Groan Carousel
  const renderGroanCarousel = () => {
    const currentSlide = GROAN_SLIDES[groanSlide]
    const isLastSlide = groanSlide === GROAN_SLIDES.length - 1


    return (
      <div className="planning-step groan-step">
        {/* Slide content */}
        <div
          className="groan-carousel"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            key={groanSlide}
            className={`groan-slide ${slideDirection ? `slide-${slideDirection}` : ''}`}
          >
            {currentSlide.title && <h2>{currentSlide.title}</h2>}
            <p className="groan-content">{currentSlide.content}</p>
          </div>

          {/* Swipe hint (only on first few slides) */}
          {groanSlide < 2 && (
            <div className="swipe-hint">
              <span>← Swipe to continue →</span>
            </div>
          )}

          {/* Slide dots */}
          <div className="carousel-dots">
            {GROAN_SLIDES.map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot ${groanSlide === idx ? 'active' : ''}`}
                onClick={() => goToSlide(idx)}
              />
            ))}
          </div>
        </div>

        {/* Groan input (only on last slide) */}
        {isLastSlide && (
          <div className="groan-input-section">
            <label className="groan-label">What's YOUR groan this week?</label>
            <textarea
              className="groan-textarea"
              value={groanDescription}
              onChange={(e) => setGroanDescription(e.target.value)}
              placeholder="What visibility action will you take that terrifies you?"
              rows={3}
            />

            <label className="groan-label">Which day?</label>
            <div className="day-picker">
              {DAYS.map(day => (
                <button
                  key={day.id}
                  className={`day-btn ${groanDay === day.id ? 'selected' : ''}`}
                  onClick={() => setGroanDay(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>

            <label className="groan-label">What fear did it trigger? (select all)</label>
            <div className="fear-picker">
              {FEAR_TYPES.map(fear => (
                <button
                  key={fear.id}
                  className={`fear-btn ${groanFears.includes(fear.id) ? 'selected' : ''}`}
                  onClick={() => {
                    setGroanFears(prev =>
                      prev.includes(fear.id)
                        ? prev.filter(f => f !== fear.id)
                        : [...prev, fear.id]
                    )
                  }}
                >
                  <span className="fear-icon">{fear.icon}</span>
                  <span className="fear-label">{fear.label}</span>
                </button>
              ))}
            </div>

            <label className="groan-label">What layer were you in?</label>
            <div className="layer-picker">
              {VISIBILITY_LAYERS.map(layer => (
                <button
                  key={layer.id}
                  className={`layer-btn ${groanLayer === layer.id ? 'selected' : ''}`}
                  onClick={() => setGroanLayer(layer.id)}
                >
                  <span className="layer-icon">{layer.icon}</span>
                  <span className="layer-label">{layer.label}</span>
                </button>
              ))}
            </div>
            {groanLayer && (
              <div className="layer-explainer">
                <span className="layer-explainer-icon">
                  {VISIBILITY_LAYERS.find(l => l.id === groanLayer)?.icon}
                </span>
                <span className="layer-explainer-text">
                  {VISIBILITY_LAYERS.find(l => l.id === groanLayer)?.desc}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Render Step 5: Conditional Commitments
  const renderConditionalCommitments = () => (
    <div className="planning-step commitments-step">
      {/* Healing Priority */}
      <div className="commitment-section">
        <h3>Is healing a priority this week?</h3>

        <div className="commitment-toggle">
          <button
            className={`toggle-btn ${healingPriority ? 'selected' : ''}`}
            onClick={() => setHealingPriority(true)}
          >
            Yes, I have space
          </button>
          <button
            className={`toggle-btn ${!healingPriority ? 'selected' : ''}`}
            onClick={() => setHealingPriority(false)}
          >
            No space this week
          </button>
        </div>

        {healingPriority && (
          <div className="commitment-details">
            <label>What's your Big Release practice?</label>
            <select
              className="practice-select"
              value={bigReleasePractice || ''}
              onChange={(e) => setBigReleasePractice(e.target.value || null)}
            >
              <option value="">Select a practice...</option>
              {RELEASE_PRACTICES.map(practice => (
                <option key={practice.id} value={practice.id}>
                  {practice.label}
                </option>
              ))}
            </select>

            <label>Which day?</label>
            <div className="day-picker">
              {DAYS.map(day => (
                <button
                  key={day.id}
                  className={`day-btn ${bigReleaseDay === day.id ? 'selected' : ''}`}
                  onClick={() => setBigReleaseDay(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3% Improvement */}
      <div className="commitment-section">
        <h3>Are you delivering your offering this week?</h3>

        <div className="commitment-toggle">
          <button
            className={`toggle-btn ${delivering ? 'selected' : ''}`}
            onClick={() => setDelivering(true)}
          >
            Yes
          </button>
          <button
            className={`toggle-btn ${!delivering ? 'selected' : ''}`}
            onClick={() => setDelivering(false)}
          >
            No
          </button>
        </div>

        {delivering && (
          <div className="commitment-details">
            <label>What's your 3% improvement?</label>
            <textarea
              className="improvement-textarea"
              value={threePercentImprovement}
              onChange={(e) => setThreePercentImprovement(e.target.value)}
              placeholder="What will you make 3% better this week?"
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  )

  // Render Step 6: Summary
  const renderSummary = () => {
    const selectedType = WEEK_TYPES.find(t => t.id === weekType)
    const selectedRoutines = MORNING_ROUTINES.filter(r => morningRoutine.includes(r.id))
    const selectedRelease = RELEASE_PRACTICES.find(p => p.id === bigReleasePractice)
    const groanDayLabel = DAYS.find(d => d.id === groanDay)?.label
    const releaseDayLabel = DAYS.find(d => d.id === bigReleaseDay)?.label

    return (
      <div className="planning-step summary-step">
        <h2>Your Week Plan</h2>

        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-week">Week of {getWeekLabel()}</span>
            <span
              className="summary-type"
              style={{ color: selectedType?.color }}
            >
              {selectedType?.icon} {selectedType?.label}
            </span>
          </div>

          <div className="summary-section">
            <span className="section-icon">🌅</span>
            <div className="section-content">
              <strong>Morning Routine</strong>
              <p>{selectedRoutines.map(r => r.label).join(' + ') || 'None selected'}</p>
            </div>
          </div>

          <div className="summary-section">
            <span className="section-icon">🎯</span>
            <div className="section-content">
              <strong>Weekly Groan ({groanDayLabel || 'TBD'})</strong>
              <p>"{groanDescription || 'Not set'}"</p>
            </div>
          </div>

          {healingPriority && bigReleasePractice && (
            <div className="summary-section">
              <span className="section-icon">🌊</span>
              <div className="section-content">
                <strong>Big Release ({releaseDayLabel || 'TBD'})</strong>
                <p>{selectedRelease?.label}</p>
              </div>
            </div>
          )}

          {delivering && threePercentImprovement && (
            <div className="summary-section">
              <span className="section-icon">📈</span>
              <div className="section-content">
                <strong>3% Improvement</strong>
                <p>"{threePercentImprovement}"</p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>
    )
  }

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1: return renderWeekTypeSelection()
      case 2: return showFoundationStep ? renderFoundationCheck() : renderMorningRoutine()
      case 3: return showFoundationStep ? renderMorningRoutine() : renderGroanCarousel()
      case 4: return showFoundationStep ? renderGroanCarousel() : renderConditionalCommitments()
      case 5: return showFoundationStep ? renderConditionalCommitments() : renderSummary()
      case 6: return renderSummary()
      default: return null
    }
  }

  // Determine if we're on the summary step
  const isSummaryStep = showFoundationStep ? step === 6 : step === 5

  return (
    <div className={`weekly-planning-flow ${weekType ? `week-${weekType}` : ''}`}>
      {/* Progress indicator */}
      <div className="planning-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(step / getTotalSteps()) * 100}%` }}
          />
        </div>
        <span className="progress-text">Step {step} of {getTotalSteps()}</span>
      </div>

      {/* Step content */}
      <div className="planning-content">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="planning-navigation">
        {step > 1 && (
          <button className="nav-btn back" onClick={handleBack}>
            ← Back
          </button>
        )}

        {!isSummaryStep ? (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={!canContinue()}
          >
            {((showFoundationStep && step === 4) || (!showFoundationStep && step === 3)) && groanSlide < GROAN_SLIDES.length - 1 ? 'Next →' : 'Continue →'}
          </button>
        ) : (
          <button
            className="nav-btn complete"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Start Week →'}
          </button>
        )}
      </div>
    </div>
  )
}

export default WeeklyPlanningFlow
