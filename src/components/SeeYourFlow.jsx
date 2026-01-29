/**
 * SeeYourFlow.jsx
 *
 * Multi-step journey mapping component for first-time users.
 * After completing journey mapping, becomes a simple check-in component.
 *
 * First-time flow:
 * 1. Current State - Two-factor questions (excited/tired + great/resistance)
 * 2. Journey Start - Month/year picker for when project started
 * 3. Highlights - Up to 3 moments of magic/serendipity
 * 4. Challenges - Up to 3 curve balls with feeling
 * 5. Summary - Stats and celebration
 *
 * Returning user: Simple two-factor check-in with headline + comment
 *
 * Created: Dec 2024
 * Updated: Dec 2024 - Multi-step journey mapping
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import confetti from 'canvas-confetti'
import './SeeYourFlow.css'

// Step constants
const STEPS = {
  CURRENT: 'current',
  START: 'start',
  HIGHLIGHTS: 'highlights',
  CHALLENGES: 'challenges',
  SUMMARY: 'summary'
}

// Direction mapping helper
const getDirection = (internal, external) => {
  if (internal === 'excited' && external === 'ease') return 'north'
  if (internal === 'excited' && external === 'resistance') return 'east'
  if (internal === 'tired' && external === 'ease') return 'west'
  if (internal === 'tired' && external === 'resistance') return 'south'
  return 'north'
}

const getDirectionLabel = (direction) => {
  const labels = {
    north: 'Flow',
    east: 'Redirect',
    south: 'Rest',
    west: 'Honour'
  }
  return labels[direction] || 'Flow'
}

const getDirectionColor = (direction) => {
  const colors = {
    north: '#10b981',
    east: '#f59e0b',
    south: '#ef4444',
    west: '#3b82f6'
  }
  return colors[direction] || '#10b981'
}

// Generate month options for picker (last 5 years)
const generateMonthOptions = () => {
  const options = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  for (let year = currentYear; year >= currentYear - 5; year--) {
    const maxMonth = year === currentYear ? currentMonth : 11
    for (let month = maxMonth; month >= 0; month--) {
      const date = new Date(year, month, 1)
      options.push({
        value: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      })
    }
  }

  return options
}

const MONTH_OPTIONS = generateMonthOptions()

// LocalStorage keys for saving progress
const getStorageKey = (userId, projectId) => `journey_mapping_${userId}_${projectId}`
const getCompletedKey = (userId, projectId) => `journey_mapping_completed_${userId}_${projectId}`

function SeeYourFlow({ project, onUpdate, onFlowEntryAdded }) {
  const { user } = useAuth()

  // Check if user has completed journey mapping
  const [hasCompletedMapping, setHasCompletedMapping] = useState(null) // null = loading
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Journey mapping state
  const [currentStep, setCurrentStep] = useState(STEPS.CURRENT)
  const [journeyData, setJourneyData] = useState({
    // Step 1: Current state
    currentInternal: null, // 'excited' or 'tired'
    currentExternal: null, // 'ease' or 'resistance'
    // Step 2: Journey start
    startMonth: null, // '2024-06' format
    // Step 3: Highlights
    highlights: [{ title: '', month: null, reflection: '' }],
    // Step 4: Challenges
    challenges: [{ title: '', month: null, internal: null, reflection: '' }]
  })

  // Check-in mode state (for returning users)
  const [checkInData, setCheckInData] = useState({
    internal: null,
    external: null,
    headline: '',
    comment: '',
    dateOption: 'recent', // 'recent' or 'custom'
    customMonth: null
  })

  // Stats for summary
  const [entriesCreated, setEntriesCreated] = useState(0)
  const [journeySpan, setJourneySpan] = useState('')

  // Reset state when project changes
  useEffect(() => {
    // Reset to loading state when project changes
    setHasCompletedMapping(null)
    setCurrentStep(STEPS.CURRENT)
    setJourneyData({
      currentInternal: null,
      currentExternal: null,
      startMonth: null,
      highlights: [{ title: '', month: null, reflection: '' }],
      challenges: [{ title: '', month: null, internal: null, reflection: '' }]
    })
    setEntriesCreated(0)
    setJourneySpan('')
    setIsExpanded(false) // Collapse when switching projects
    // Reset check-in data too
    setCheckInData({
      internal: null,
      external: null,
      headline: '',
      comment: '',
      dateOption: 'recent',
      customMonth: null
    })
  }, [project?.id])

  // Check if journey mapping has been completed (localStorage + database fallback)
  useEffect(() => {
    const checkMappingStatus = async () => {
      if (!user?.id || !project?.id) {
        setHasCompletedMapping(false)
        return
      }

      // Check localStorage for completion flag
      const completedKey = getCompletedKey(user.id, project.id)
      const isCompleted = localStorage.getItem(completedKey) === 'true'

      if (isCompleted) {
        console.log('🗺️ Journey mapping already completed for project:', project.id)
        setHasCompletedMapping(true)
        return
      }

      // Check database for existing journey entries (fallback for cleared localStorage)
      try {
        const { data: journeyEntries, error } = await supabase
          .from('flow_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('project_id', project.id)
          .like('activity_description', 'Journey:%')
          .limit(1)

        if (!error && journeyEntries && journeyEntries.length > 0) {
          console.log('🗺️ Found existing journey entries in database, marking as complete')
          // Restore localStorage flag for future checks
          localStorage.setItem(completedKey, 'true')
          setHasCompletedMapping(true)
          return
        }
      } catch (err) {
        console.error('Error checking journey entries:', err)
      }

      // Check for saved progress
      const storageKey = getStorageKey(user.id, project.id)
      const savedProgress = localStorage.getItem(storageKey)

      if (savedProgress) {
        try {
          const { step, data } = JSON.parse(savedProgress)
          console.log('🗺️ Restoring journey progress:', { step, data })
          setCurrentStep(step)
          setJourneyData(data)
          setHasCompletedMapping(false)
        } catch (err) {
          console.error('Error parsing saved progress:', err)
          setHasCompletedMapping(false)
        }
      } else {
        console.log('🗺️ No saved progress, starting fresh for project:', project.id)
        setHasCompletedMapping(false)
      }
    }

    checkMappingStatus()
  }, [user?.id, project?.id])

  // Save progress to localStorage whenever step or data changes
  useEffect(() => {
    // Don't save during loading (null), when completed, or at summary step
    if (!user?.id || !project?.id) return
    if (hasCompletedMapping === null || hasCompletedMapping === true) return
    if (currentStep === STEPS.SUMMARY) return

    const storageKey = getStorageKey(user.id, project.id)
    const progressData = {
      step: currentStep,
      data: journeyData
    }
    console.log('🗺️ Saving journey progress:', { step: currentStep, hasData: !!journeyData.currentInternal })
    localStorage.setItem(storageKey, JSON.stringify(progressData))
  }, [currentStep, journeyData, user?.id, project?.id, hasCompletedMapping])

  // Auto-expand for first-time users
  useEffect(() => {
    if (hasCompletedMapping === false) {
      setIsExpanded(true)
    }
  }, [hasCompletedMapping])

  // Convert month string to date (mid-month)
  const getDateFromMonth = (monthStr) => {
    if (!monthStr) return new Date()
    const [year, month] = monthStr.split('-')
    return new Date(parseInt(year), parseInt(month) - 1, 15)
  }

  // Create a flow entry and notify parent
  const createFlowEntry = async (entryData) => {
    if (!user?.id || !project?.id) return false

    try {
      const { error } = await supabase
        .from('flow_entries')
        .insert({
          user_id: user.id,
          project_id: project.id,
          ...entryData
        })

      if (error) throw error

      onFlowEntryAdded?.()
      return true
    } catch (err) {
      console.error('Error creating flow entry:', err)
      return false
    }
  }

  // Handle step completion and create entries
  const handleStepComplete = async () => {
    let entriesCount = 0

    switch (currentStep) {
      case STEPS.CURRENT: {
        const direction = getDirection(journeyData.currentInternal, journeyData.currentExternal)
        await createFlowEntry({
          direction,
          internal_state: journeyData.currentInternal,
          external_state: journeyData.currentExternal,
          activity_description: 'Journey: Current state',
          reasoning: 'Where I am right now',
          logged_at: new Date().toISOString()
        })
        entriesCount = 1
        setCurrentStep(STEPS.START)
        break
      }

      case STEPS.START: {
        await createFlowEntry({
          direction: 'north',
          internal_state: 'excited',
          external_state: 'ease',
          activity_description: 'Journey: Started',
          reasoning: 'The beginning of my journey',
          logged_at: getDateFromMonth(journeyData.startMonth).toISOString()
        })
        entriesCount = 1
        setCurrentStep(STEPS.HIGHLIGHTS)
        break
      }

      case STEPS.HIGHLIGHTS: {
        for (const highlight of journeyData.highlights) {
          if (highlight.title && highlight.month) {
            await createFlowEntry({
              direction: 'north',
              internal_state: 'excited',
              external_state: 'ease',
              activity_description: `Highlight: ${highlight.title}`,
              reasoning: highlight.reflection || 'A moment of magic',
              logged_at: getDateFromMonth(highlight.month).toISOString()
            })
            entriesCount++
          }
        }
        setCurrentStep(STEPS.CHALLENGES)
        break
      }

      case STEPS.CHALLENGES: {
        for (const challenge of journeyData.challenges) {
          if (challenge.title && challenge.month && challenge.internal) {
            const direction = getDirection(challenge.internal, 'resistance')
            await createFlowEntry({
              direction,
              internal_state: challenge.internal,
              external_state: 'resistance',
              activity_description: `Challenge: ${challenge.title}`,
              reasoning: challenge.reflection || 'A difficult moment',
              logged_at: getDateFromMonth(challenge.month).toISOString()
            })
            entriesCount++
          }
        }

        // Calculate stats for summary
        const validHighlights = journeyData.highlights.filter(h => h.title && h.month).length
        const validChallenges = journeyData.challenges.filter(c => c.title && c.month).length
        const total = 2 + validHighlights + validChallenges // current + start + highlights + challenges
        setEntriesCreated(total)

        // Calculate journey span
        if (journeyData.startMonth) {
          const startDate = getDateFromMonth(journeyData.startMonth)
          const now = new Date()
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          setJourneySpan(`${monthNames[startDate.getMonth()]} ${startDate.getFullYear()} → Now`)
        }

        setCurrentStep(STEPS.SUMMARY)

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        break
      }

      default:
        break
    }

    setEntriesCreated(prev => prev + entriesCount)
  }

  // Handle check-in submission (returning users)
  const handleCheckInSubmit = async () => {
    if (!checkInData.internal || !checkInData.external) return

    setIsSaving(true)

    try {
      const direction = getDirection(checkInData.internal, checkInData.external)
      const loggedAt = checkInData.dateOption === 'recent'
        ? new Date().toISOString()
        : getDateFromMonth(checkInData.customMonth).toISOString()

      await createFlowEntry({
        direction,
        internal_state: checkInData.internal,
        external_state: checkInData.external,
        activity_description: checkInData.headline || 'Flow check-in',
        reasoning: checkInData.comment || 'Daily reflection',
        logged_at: loggedAt
      })

      // Reset form
      setCheckInData({
        internal: null,
        external: null,
        headline: '',
        comment: '',
        dateOption: 'recent',
        customMonth: null
      })

      setIsExpanded(false)
    } catch (err) {
      console.error('Error saving check-in:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle completing journey mapping
  const handleMappingComplete = () => {
    if (user?.id && project?.id) {
      // Set completed flag in localStorage
      const completedKey = getCompletedKey(user.id, project.id)
      localStorage.setItem(completedKey, 'true')

      // Clear progress data
      const storageKey = getStorageKey(user.id, project.id)
      localStorage.removeItem(storageKey)
    }

    setHasCompletedMapping(true)
    setIsExpanded(false)
  }

  // Add highlight card
  const addHighlight = () => {
    if (journeyData.highlights.length < 3) {
      setJourneyData(prev => ({
        ...prev,
        highlights: [...prev.highlights, { title: '', month: null, reflection: '' }]
      }))
    }
  }

  // Add challenge card
  const addChallenge = () => {
    if (journeyData.challenges.length < 3) {
      setJourneyData(prev => ({
        ...prev,
        challenges: [...prev.challenges, { title: '', month: null, internal: null, reflection: '' }]
      }))
    }
  }

  // Update highlight
  const updateHighlight = (index, field, value) => {
    setJourneyData(prev => ({
      ...prev,
      highlights: prev.highlights.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      )
    }))
  }

  // Update challenge
  const updateChallenge = (index, field, value) => {
    setJourneyData(prev => ({
      ...prev,
      challenges: prev.challenges.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      )
    }))
  }

  // Check if current step is complete
  const isStepComplete = () => {
    switch (currentStep) {
      case STEPS.CURRENT:
        return journeyData.currentInternal && journeyData.currentExternal
      case STEPS.START:
        return !!journeyData.startMonth
      case STEPS.HIGHLIGHTS:
        return true // Can skip
      case STEPS.CHALLENGES:
        return true // Can skip
      default:
        return false
    }
  }

  // Get current direction for preview
  const getCurrentDirection = () => {
    if (journeyData.currentInternal && journeyData.currentExternal) {
      return getDirection(journeyData.currentInternal, journeyData.currentExternal)
    }
    return null
  }

  // Loading state
  if (hasCompletedMapping === null) {
    return (
      <div className="see-your-flow loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Get step number for progress indicator
  const getStepNumber = () => {
    const stepOrder = [STEPS.CURRENT, STEPS.START, STEPS.HIGHLIGHTS, STEPS.CHALLENGES, STEPS.SUMMARY]
    return stepOrder.indexOf(currentStep) + 1
  }

  return (
    <div className={`see-your-flow ${isExpanded ? 'expanded' : ''}`}>
      {/* Header */}
      <button
        className="flow-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flow-header-left">
          <span className="flow-icon">🌊</span>
          <span className="flow-title">
            {hasCompletedMapping ? "Log Your Flow" : "Map Your Journey"}
          </span>
        </div>
        <div className="flow-header-right">
          <span className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>▾</span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="flow-content">
          {/* JOURNEY MAPPING MODE (First-time users) */}
          {!hasCompletedMapping && (
            <>
              {/* Progress Dots */}
              <div className="progress-dots">
                {[1, 2, 3, 4, 5].map(num => (
                  <div
                    key={num}
                    className={`dot ${getStepNumber() >= num ? 'active' : ''} ${getStepNumber() === num ? 'current' : ''}`}
                  />
                ))}
              </div>

              {/* Step 1: Current State */}
              {currentStep === STEPS.CURRENT && (
                <div className="step-content">
                  <h3 className="step-title">How's your flow right now?</h3>

                  <div className="question-section">
                    <label className="question-label">Are you feeling excited?</label>
                    <div className="two-options">
                      <button
                        className={`option-btn ${journeyData.currentInternal === 'excited' ? 'selected' : ''}`}
                        onClick={() => setJourneyData(prev => ({ ...prev, currentInternal: 'excited' }))}
                      >
                        <span className="option-emoji">🔥</span>
                        <span>Excited</span>
                      </button>
                      <button
                        className={`option-btn ${journeyData.currentInternal === 'tired' ? 'selected' : ''}`}
                        onClick={() => setJourneyData(prev => ({ ...prev, currentInternal: 'tired' }))}
                      >
                        <span className="option-emoji">😴</span>
                        <span>Tired</span>
                      </button>
                    </div>
                  </div>

                  <div className="question-section">
                    <label className="question-label">How is the business flowing?</label>
                    <div className="two-options">
                      <button
                        className={`option-btn ${journeyData.currentExternal === 'ease' ? 'selected' : ''}`}
                        onClick={() => setJourneyData(prev => ({ ...prev, currentExternal: 'ease' }))}
                      >
                        <span className="option-emoji">✨</span>
                        <span>Great</span>
                      </button>
                      <button
                        className={`option-btn ${journeyData.currentExternal === 'resistance' ? 'selected' : ''}`}
                        onClick={() => setJourneyData(prev => ({ ...prev, currentExternal: 'resistance' }))}
                      >
                        <span className="option-emoji">🧗</span>
                        <span>Facing resistance</span>
                      </button>
                    </div>
                  </div>

                  {getCurrentDirection() && (
                    <div className={`direction-preview direction-${getCurrentDirection()}`}>
                      <span className="direction-arrow">→</span>
                      <span>{getDirectionLabel(getCurrentDirection())}</span>
                    </div>
                  )}

                  <button
                    className="next-btn"
                    onClick={handleStepComplete}
                    disabled={!isStepComplete()}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 2: Journey Start */}
              {currentStep === STEPS.START && (
                <div className="step-content">
                  <h3 className="step-title">When did you start this project?</h3>

                  <div className="question-section">
                    <label className="question-label">Select month and year</label>
                    <select
                      className="month-picker"
                      value={journeyData.startMonth || ''}
                      onChange={(e) => setJourneyData(prev => ({ ...prev, startMonth: e.target.value }))}
                    >
                      <option value="">Choose a month...</option>
                      {MONTH_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <p className="step-hint">This will be marked as the start of your journey</p>

                  <button
                    className="next-btn"
                    onClick={handleStepComplete}
                    disabled={!isStepComplete()}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 3: Highlights */}
              {currentStep === STEPS.HIGHLIGHTS && (
                <div className="step-content">
                  <h3 className="step-title">What were your top 3 highlights, moments of magic or serendipity that supported the business?</h3>

                  <div className="cards-container">
                    {journeyData.highlights.map((highlight, index) => (
                      <div key={index} className="entry-card highlight-card">
                        <div className="card-header">
                          <span className="card-number">Highlight {index + 1}</span>
                          <span className="card-emoji">✨</span>
                        </div>

                        <input
                          type="text"
                          className="card-title-input"
                          placeholder="e.g., First paying customer"
                          value={highlight.title}
                          onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                        />

                        <select
                          className="month-picker small"
                          value={highlight.month || ''}
                          onChange={(e) => updateHighlight(index, 'month', e.target.value)}
                        >
                          <option value="">When did this happen?</option>
                          {MONTH_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        <textarea
                          className="card-reflection"
                          placeholder="Reflection (optional)"
                          value={highlight.reflection}
                          onChange={(e) => updateHighlight(index, 'reflection', e.target.value)}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  {journeyData.highlights.length < 3 && (
                    <button className="add-card-btn" onClick={addHighlight}>
                      + Add another highlight
                    </button>
                  )}

                  <div className="step-actions">
                    <button className="skip-btn" onClick={handleStepComplete}>
                      Skip
                    </button>
                    <button
                      className="next-btn"
                      onClick={handleStepComplete}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Challenges */}
              {currentStep === STEPS.CHALLENGES && (
                <div className="step-content">
                  <h3 className="step-title">What were your top 3 biggest challenges, curve balls or moments things didn't go to plan?</h3>

                  <div className="cards-container">
                    {journeyData.challenges.map((challenge, index) => (
                      <div key={index} className="entry-card challenge-card">
                        <div className="card-header">
                          <span className="card-number">Challenge {index + 1}</span>
                          <span className="card-emoji">🧗</span>
                        </div>

                        <input
                          type="text"
                          className="card-title-input"
                          placeholder="e.g., Lost motivation for 2 months"
                          value={challenge.title}
                          onChange={(e) => updateChallenge(index, 'title', e.target.value)}
                        />

                        <select
                          className="month-picker small"
                          value={challenge.month || ''}
                          onChange={(e) => updateChallenge(index, 'month', e.target.value)}
                        >
                          <option value="">When did this happen?</option>
                          {MONTH_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                        <div className="feeling-select">
                          <label>How were you feeling?</label>
                          <div className="two-options small">
                            <button
                              className={`option-btn small ${challenge.internal === 'excited' ? 'selected' : ''}`}
                              onClick={() => updateChallenge(index, 'internal', 'excited')}
                            >
                              🔥 Excited
                            </button>
                            <button
                              className={`option-btn small ${challenge.internal === 'tired' ? 'selected' : ''}`}
                              onClick={() => updateChallenge(index, 'internal', 'tired')}
                            >
                              😴 Tired
                            </button>
                          </div>
                        </div>

                        <textarea
                          className="card-reflection"
                          placeholder="Reflection (optional)"
                          value={challenge.reflection}
                          onChange={(e) => updateChallenge(index, 'reflection', e.target.value)}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>

                  {journeyData.challenges.length < 3 && (
                    <button className="add-card-btn" onClick={addChallenge}>
                      + Add another challenge
                    </button>
                  )}

                  <div className="step-actions">
                    <button className="skip-btn" onClick={handleStepComplete}>
                      Skip
                    </button>
                    <button
                      className="next-btn"
                      onClick={handleStepComplete}
                    >
                      Finish
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Summary */}
              {currentStep === STEPS.SUMMARY && (
                <div className="step-content summary-step">
                  <div className="summary-celebration">
                    <span className="celebration-emoji">🎉</span>
                    <h3 className="summary-title">Your journey is mapped!</h3>
                  </div>

                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-value">{entriesCreated}</span>
                      <span className="stat-label">moments captured</span>
                    </div>
                    {journeySpan && (
                      <div className="stat-item">
                        <span className="stat-value">{journeySpan}</span>
                        <span className="stat-label">your journey so far</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="done-btn"
                    onClick={handleMappingComplete}
                  >
                    Done
                  </button>
                </div>
              )}
            </>
          )}

          {/* CHECK-IN MODE (Returning users) */}
          {hasCompletedMapping && (
            <div className="checkin-content">
              <h3 className="step-title">How's your flow today?</h3>

              <div className="question-section">
                <label className="question-label">Are you feeling excited?</label>
                <div className="two-options">
                  <button
                    className={`option-btn ${checkInData.internal === 'excited' ? 'selected' : ''}`}
                    onClick={() => setCheckInData(prev => ({ ...prev, internal: 'excited' }))}
                  >
                    <span className="option-emoji">🔥</span>
                    <span>Excited</span>
                  </button>
                  <button
                    className={`option-btn ${checkInData.internal === 'tired' ? 'selected' : ''}`}
                    onClick={() => setCheckInData(prev => ({ ...prev, internal: 'tired' }))}
                  >
                    <span className="option-emoji">😴</span>
                    <span>Tired</span>
                  </button>
                </div>
              </div>

              <div className="question-section">
                <label className="question-label">How is the business flowing?</label>
                <div className="two-options">
                  <button
                    className={`option-btn ${checkInData.external === 'ease' ? 'selected' : ''}`}
                    onClick={() => setCheckInData(prev => ({ ...prev, external: 'ease' }))}
                  >
                    <span className="option-emoji">✨</span>
                    <span>Great</span>
                  </button>
                  <button
                    className={`option-btn ${checkInData.external === 'resistance' ? 'selected' : ''}`}
                    onClick={() => setCheckInData(prev => ({ ...prev, external: 'resistance' }))}
                  >
                    <span className="option-emoji">🧗</span>
                    <span>Facing resistance</span>
                  </button>
                </div>
              </div>

              {checkInData.internal && checkInData.external && (
                <div className={`direction-preview direction-${getDirection(checkInData.internal, checkInData.external)}`}>
                  <span className="direction-arrow">→</span>
                  <span>{getDirectionLabel(getDirection(checkInData.internal, checkInData.external))}</span>
                </div>
              )}

              <div className="question-section">
                <label className="question-label">Headline</label>
                <input
                  type="text"
                  className="headline-input"
                  placeholder="e.g., Landed a new client"
                  value={checkInData.headline}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, headline: e.target.value }))}
                />
              </div>

              <div className="question-section">
                <label className="question-label">Comment (optional)</label>
                <textarea
                  className="comment-input"
                  placeholder="Any additional thoughts..."
                  value={checkInData.comment}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, comment: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="question-section">
                <label className="question-label">When</label>
                <div className="date-options">
                  <button
                    className={`date-option ${checkInData.dateOption === 'recent' ? 'selected' : ''}`}
                    onClick={() => setCheckInData(prev => ({ ...prev, dateOption: 'recent' }))}
                  >
                    Most Recent
                  </button>
                  <button
                    className={`date-option ${checkInData.dateOption === 'custom' ? 'selected' : ''}`}
                    onClick={() => setCheckInData(prev => ({ ...prev, dateOption: 'custom' }))}
                  >
                    Choose Date
                  </button>
                </div>

                {checkInData.dateOption === 'custom' && (
                  <select
                    className="month-picker"
                    value={checkInData.customMonth || ''}
                    onChange={(e) => setCheckInData(prev => ({ ...prev, customMonth: e.target.value }))}
                  >
                    <option value="">Select month...</option>
                    {MONTH_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                className="submit-btn"
                onClick={handleCheckInSubmit}
                disabled={!checkInData.internal || !checkInData.external || isSaving || (checkInData.dateOption === 'custom' && !checkInData.customMonth)}
              >
                {isSaving ? 'Logging...' : 'Log Flow'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SeeYourFlow
