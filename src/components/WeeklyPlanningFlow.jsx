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
 * 6. Group Selection (Solo / Create Group / Join Group)
 * 7. Week Plan Summary
 *
 * Created: Dec 2024
 * See docs/weekly-planning-system-plan.md
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { trackWeeklyPlanCompleted } from '../lib/analytics'
import {
  GROAN_VISIBILITY_LAYERS,
  GROAN_SOURCE_TYPES
} from '../lib/stageConfig'
import {
  fetchFlowFinderData,
  hasCompletedFlowFinder,
  createGroanChallenge
} from '../lib/crm'
import GroanChallengeCard from './GroanChallengeCard'
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

// Visibility layers - now using the 5-layer system from stageConfig
// (GROAN_VISIBILITY_LAYERS is imported from stageConfig.js)

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

  // Group selection state
  const [groupMode, setGroupMode] = useState(null) // 'solo' | 'create' | 'join'
  const [groupCode, setGroupCode] = useState('')
  const [groupCodeInput, setGroupCodeInput] = useState('')
  const [groupData, setGroupData] = useState(null)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [joiningGroup, setJoiningGroup] = useState(false)
  const [groupError, setGroupError] = useState(null)

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

  // New Groan Matrix state
  const [flowFinderData, setFlowFinderData] = useState(null)
  const [flowFinderComplete, setFlowFinderComplete] = useState(null)
  const [selectedSourceType, setSelectedSourceType] = useState('skill')
  const [selectedSourceItem, setSelectedSourceItem] = useState(null)
  const [selectedVisibilityLayer, setSelectedVisibilityLayer] = useState(null)
  const [generatedChallenge, setGeneratedChallenge] = useState(existingPlan?.groan_challenge_id ? null : null)
  const [generatingChallenge, setGeneratingChallenge] = useState(false)
  const [showCustomGroan, setShowCustomGroan] = useState(false)
  const [healingPriority, setHealingPriority] = useState(existingPlan?.big_release_practice ? true : false)
  const [bigReleasePractice, setBigReleasePractice] = useState(existingPlan?.big_release_practice || null)
  const [bigReleaseDay, setBigReleaseDay] = useState(existingPlan?.big_release_day || null)
  const [delivering, setDelivering] = useState(existingPlan?.three_percent_improvement ? true : false)
  const [threePercentImprovement, setThreePercentImprovement] = useState(existingPlan?.three_percent_improvement || '')
  const [foundationReminder, setFoundationReminder] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Check foundation flows and load Flow Finder data on mount
  useEffect(() => {
    if (user) {
      checkFoundationFlows()
      loadFlowFinderData()
    }
  }, [user])

  const loadFlowFinderData = async () => {
    const { completed, missing } = await hasCompletedFlowFinder(user.id)
    setFlowFinderComplete(completed)

    if (completed) {
      const { data } = await fetchFlowFinderData(user.id)
      setFlowFinderData(data)
    }
  }

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

  // Group handling functions
  const handleCreateGroup = async () => {
    if (creatingGroup) return
    setCreatingGroup(true)
    setGroupError(null)

    try {
      // Generate unique group code
      const { data: newCode, error: codeError } = await supabase.rpc('generate_group_code')
      if (codeError) throw codeError

      // Create group record
      const { data: newGroup, error: groupError } = await supabase
        .from('challenge_groups')
        .insert([{
          code: newCode,
          created_by: user.id,
          start_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // Add user as participant
      await supabase
        .from('challenge_participants')
        .insert([{
          group_id: newGroup.id,
          user_id: user.id
        }])

      setGroupCode(newCode)
      setGroupData(newGroup)
      setGroupMode('create')
    } catch (err) {
      console.error('Error creating group:', err)
      setGroupError('Failed to create group. Please try again.')
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleJoinGroup = async () => {
    if (joiningGroup || !groupCodeInput.trim()) return
    setJoiningGroup(true)
    setGroupError(null)

    try {
      // Find group by code
      const { data: foundGroup, error: findError } = await supabase
        .from('challenge_groups')
        .select('*')
        .eq('code', groupCodeInput.trim().toUpperCase())
        .single()

      if (findError || !foundGroup) {
        setGroupError('Invalid group code. Please check and try again.')
        setJoiningGroup(false)
        return
      }

      // Add user as participant (upsert to handle rejoining)
      await supabase
        .from('challenge_participants')
        .upsert([{
          group_id: foundGroup.id,
          user_id: user.id
        }], { onConflict: 'group_id,user_id' })

      setGroupCode(foundGroup.code)
      setGroupData(foundGroup)
      setGroupMode('join')
    } catch (err) {
      console.error('Error joining group:', err)
      setGroupError('Failed to join group. Please try again.')
    } finally {
      setJoiningGroup(false)
    }
  }

  const handlePlaySolo = () => {
    setGroupMode('solo')
    setGroupData(null)
    setGroupCode('')
  }

  const copyGroupCode = () => {
    navigator.clipboard.writeText(groupCode)
    alert('Group code copied to clipboard!')
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
  // Steps: Group(1) + WeekType(2) + Foundation?(3) + Morning(3/4) + Groan(4/5) + Commitments(5/6) + Summary(6/7)
  const getTotalSteps = () => {
    return showFoundationStep ? 7 : 6
  }

  // Get actual step number for display (always show from 1)
  const getDisplayStep = () => {
    return step
  }

  // Navigation
  const canContinue = () => {
    // Step 1 is Week Type Selection
    if (step === 1) return weekType !== null

    // Step 2: Foundation check (if shown) OR Morning routine (if no foundation)
    if (step === 2) {
      if (showFoundationStep) return true // Foundation check - can always skip
      return morningRoutine.length > 0 // Morning routine
    }

    // Step 3: Morning routine (if foundation shown) OR Groan (if no foundation)
    if (step === 3) {
      if (showFoundationStep) return morningRoutine.length > 0
      // Groan step - either generated challenge with day, or custom groan
      if (!flowFinderComplete) {
        if (groanSlide < GROAN_SLIDES.length - 1) return true
        return groanDescription.trim().length > 0 && groanDay !== null && groanLayer !== null
      }
      // Matrix-based: need generated challenge + day, OR custom groan
      if (generatedChallenge && groanDay !== null) return true
      if (showCustomGroan && groanDescription.trim().length > 0 && groanDay !== null && groanLayer !== null) return true
      return false
    }

    // Step 4: Groan (if foundation shown) OR Conditionals (if no foundation)
    if (step === 4) {
      if (showFoundationStep) {
        // Groan step - either generated challenge with day, or custom groan
        if (!flowFinderComplete) {
          if (groanSlide < GROAN_SLIDES.length - 1) return true
          return groanDescription.trim().length > 0 && groanDay !== null && groanLayer !== null
        }
        // Matrix-based: need generated challenge + day, OR custom groan
        if (generatedChallenge && groanDay !== null) return true
        if (showCustomGroan && groanDescription.trim().length > 0 && groanDay !== null && groanLayer !== null) return true
        return false
      }
      return true // Conditionals - all optional
    }

    // Step 5: Conditionals (if foundation shown) OR Group Selection (if no foundation)
    if (step === 5) {
      if (showFoundationStep) return true // Conditionals - all optional
      return groupMode !== null // Group selection
    }

    // Step 6: Group Selection (if foundation shown) OR Summary (if no foundation)
    if (step === 6) {
      if (showFoundationStep) return groupMode !== null // Group selection
      return true // Summary
    }

    // Step 7: Summary (if foundation shown)
    return true
  }

  const handleNext = () => {
    // Determine if we're on groan step (step 4 with foundation, step 3 without)
    const isGroanStep = (showFoundationStep && step === 4) || (!showFoundationStep && step === 3)

    if (isGroanStep && groanSlide < GROAN_SLIDES.length - 1) {
      setSlideDirection('left')
      setGroanSlide(groanSlide + 1) // Just advance slide
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    // Determine if we're on groan step (step 4 with foundation, step 3 without)
    const isGroanStep = (showFoundationStep && step === 4) || (!showFoundationStep && step === 3)

    if (isGroanStep && groanSlide > 0) {
      setSlideDirection('right')
      setGroanSlide(groanSlide - 1)
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
        group_id: groupData?.id || null, // Store group selection
        morning_routine: morningRoutine,
        weekly_groan_description: generatedChallenge?.description || groanDescription.trim() || null,
        weekly_groan_day: groanDay,
        weekly_groan_fears: groanFears,
        weekly_groan_layer: generatedChallenge?.visibility_layer || groanLayer,
        weekly_groan_completed: false,
        groan_challenge_id: generatedChallenge?.id || null, // Link to generated challenge
        big_release_practice: healingPriority ? bigReleasePractice : null,
        big_release_day: healingPriority ? bigReleaseDay : null,
        three_percent_improvement: delivering ? threePercentImprovement.trim() : null,
        foundation_reminder: foundationReminder,
        updated_at: new Date().toISOString()
      }

      // Also update user's challenge_progress with the new group_id
      if (groupMode === 'solo') {
        // Clear group association
        await supabase
          .from('challenge_progress')
          .update({ group_id: null })
          .eq('user_id', user.id)
      } else if (groupData?.id) {
        // Set group association
        await supabase
          .from('challenge_progress')
          .update({ group_id: groupData.id })
          .eq('user_id', user.id)
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

  // Render Step 1: Group Selection
  const renderGroupSelection = () => (
    <div className="planning-step group-step">
      <h2>How do you want to play this week?</h2>
      <p className="step-subtitle">Compete on the leaderboard with friends or go solo</p>

      {/* Mode selection cards */}
      {!groupMode && (
        <div className="group-mode-grid">
          <button
            className="group-mode-card solo"
            onClick={handlePlaySolo}
          >
            <span className="mode-icon">🎯</span>
            <span className="mode-label">Play Solo</span>
            <span className="mode-desc">See everyone on the leaderboard</span>
          </button>

          <button
            className="group-mode-card create"
            onClick={handleCreateGroup}
            disabled={creatingGroup}
          >
            <span className="mode-icon">✨</span>
            <span className="mode-label">{creatingGroup ? 'Creating...' : 'Create a Group'}</span>
            <span className="mode-desc">Start a new group and invite friends</span>
          </button>

          <button
            className="group-mode-card join"
            onClick={() => setGroupMode('joining')}
          >
            <span className="mode-icon">👥</span>
            <span className="mode-label">Join a Group</span>
            <span className="mode-desc">Enter a code from a friend</span>
          </button>
        </div>
      )}

      {/* Join group input */}
      {groupMode === 'joining' && (
        <div className="join-group-section">
          <label>Enter group code:</label>
          <input
            type="text"
            className="group-code-input"
            value={groupCodeInput}
            onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            maxLength={9}
          />
          <div className="join-actions">
            <button
              className="cancel-btn"
              onClick={() => {
                setGroupMode(null)
                setGroupCodeInput('')
                setGroupError(null)
              }}
            >
              Cancel
            </button>
            <button
              className="join-btn"
              onClick={handleJoinGroup}
              disabled={joiningGroup || !groupCodeInput.trim()}
            >
              {joiningGroup ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>
      )}

      {/* Success states */}
      {groupMode === 'solo' && (
        <div className="group-success solo-success">
          <span className="success-icon">🎯</span>
          <h3>Going Solo!</h3>
          <p>You'll see everyone on the leaderboard this week.</p>
          <button className="change-btn" onClick={() => setGroupMode(null)}>
            Change
          </button>
        </div>
      )}

      {groupMode === 'create' && groupCode && (
        <div className="group-success create-success">
          <span className="success-icon">✨</span>
          <h3>Group Created!</h3>
          <p>Share this code with friends:</p>
          <div className="group-code-display">
            <span className="code">{groupCode}</span>
            <button className="copy-btn" onClick={copyGroupCode}>Copy</button>
          </div>
          <button className="change-btn" onClick={() => {
            setGroupMode(null)
            setGroupCode('')
            setGroupData(null)
          }}>
            Start Over
          </button>
        </div>
      )}

      {groupMode === 'join' && (
        <div className="group-success join-success">
          <span className="success-icon">👥</span>
          <h3>Joined Group!</h3>
          <p>You'll compete with your group on the leaderboard.</p>
          <div className="group-code-display">
            <span className="code">{groupCode}</span>
          </div>
          <button className="change-btn" onClick={() => {
            setGroupMode(null)
            setGroupCode('')
            setGroupData(null)
            setGroupCodeInput('')
          }}>
            Leave Group
          </button>
        </div>
      )}

      {groupError && <p className="group-error">{groupError}</p>}
    </div>
  )

  // Render Step 2: Week Type Selection
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

  // Generate a challenge from matrix selection
  const handleGenerateChallenge = async () => {
    if (!selectedSourceItem || !selectedVisibilityLayer) return

    setGeneratingChallenge(true)

    try {
      // Call the edge function to generate a challenge
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/groan-challenge-generator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            sourceType: selectedSourceType,
            sourceLabel: selectedSourceItem.cluster_label,
            sourceInsight: selectedSourceItem.insight,
            visibilityLayer: selectedVisibilityLayer
          })
        }
      )

      const challengeData = await response.json()

      if (challengeData.error) {
        console.error('Challenge generation error:', challengeData.error)
        return
      }

      // Create the challenge in the database
      const { data: savedChallenge } = await createGroanChallenge({
        userId: user.id,
        title: challengeData.title,
        description: challengeData.description,
        visibilityLayer: selectedVisibilityLayer,
        sourceType: selectedSourceType,
        sourceId: selectedSourceItem.id,
        sourceLabel: selectedSourceItem.cluster_label,
        scaryScore: challengeData.scaryScore,
        wahooScore: challengeData.wahooScore,
        generationPrompt: JSON.stringify({
          sourceType: selectedSourceType,
          sourceLabel: selectedSourceItem.cluster_label,
          visibilityLayer: selectedVisibilityLayer
        })
      })

      setGeneratedChallenge({
        ...challengeData,
        id: savedChallenge?.id,
        status: 'generated',
        visibility_layer: selectedVisibilityLayer,
        source_type: selectedSourceType,
        source_label: selectedSourceItem.cluster_label,
        scary_score: challengeData.scaryScore,
        wahoo_score: challengeData.wahooScore,
        completion_criteria: challengeData.completionCriteria,
        why_this_matters: challengeData.whyThisMatters,
        alternative_version: challengeData.alternativeVersion,
        essence_zone: (challengeData.scaryScore >= 7 && challengeData.wahooScore >= 7) ? 'essence' : 'growth',
        essence_insight: (challengeData.scaryScore >= 7 && challengeData.wahooScore >= 7)
          ? 'High fear + high excitement = Essence Zone. This is who you really are trying to emerge.'
          : null
      })

      // Also set the groan description for backwards compatibility
      setGroanDescription(challengeData.description)
      setGroanLayer(selectedVisibilityLayer)
    } catch (err) {
      console.error('Error generating challenge:', err)
    } finally {
      setGeneratingChallenge(false)
    }
  }

  // Get current source items for the selected type
  const getCurrentSourceItems = () => {
    if (!flowFinderData) return []
    switch (selectedSourceType) {
      case 'skill': return flowFinderData.skills || []
      case 'problem': return flowFinderData.problems || []
      case 'persona': return flowFinderData.personas || []
      default: return []
    }
  }

  // Render Step 4: Weekly Groan Matrix Selection
  const renderGroanCarousel = () => {
    const currentSlide = GROAN_SLIDES[groanSlide]
    const isLastSlide = groanSlide === GROAN_SLIDES.length - 1
    const sourceItems = getCurrentSourceItems()

    // If Flow Finder not complete, show the old story carousel + custom input
    if (!flowFinderComplete) {
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
                <span>Swipe to continue</span>
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

              <label className="groan-label">What layer are you pushing into?</label>
              <div className="layer-picker">
                {GROAN_VISIBILITY_LAYERS.map(layer => (
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
                    {GROAN_VISIBILITY_LAYERS.find(l => l.id === groanLayer)?.icon}
                  </span>
                  <span className="layer-explainer-text">
                    {GROAN_VISIBILITY_LAYERS.find(l => l.id === groanLayer)?.description}
                  </span>
                </div>
              )}

              <div className="flow-finder-prompt">
                <p>Want personalized challenges based on your unique skills?</p>
                <button
                  className="flow-finder-btn"
                  onClick={() => navigate('/nikigai/skills')}
                >
                  Complete Flow Finder
                </button>
              </div>
            </div>
          )}
        </div>
      )
    }

    // Flow Finder complete - show mini-matrix
    return (
      <div className="planning-step groan-step groan-matrix-step">
        <h2>Choose Your Courage Challenge</h2>
        <p className="step-subtitle">
          Pick a skill, problem, or persona + a visibility layer to push into
        </p>

        {/* If challenge already generated, show it */}
        {generatedChallenge ? (
          <div className="generated-challenge-section">
            <GroanChallengeCard
              challenge={generatedChallenge}
              showSource={true}
              showAlternative={true}
              compact={false}
            />

            <div className="challenge-actions">
              <button
                className="regenerate-btn"
                onClick={() => {
                  setGeneratedChallenge(null)
                  setSelectedSourceItem(null)
                  setSelectedVisibilityLayer(null)
                }}
              >
                Choose Different Challenge
              </button>

              <label className="groan-label" style={{ marginTop: '1rem' }}>Which day will you do this?</label>
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
            </div>
          </div>
        ) : (
          <>
            {/* Source type tabs */}
            <div className="matrix-source-tabs">
              {[
                { id: 'skill', label: 'Skills', icon: '🎯' },
                { id: 'problem', label: 'Problems', icon: '🔧' },
                { id: 'persona', label: 'Personas', icon: '👥' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`matrix-source-tab ${selectedSourceType === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSourceType(tab.id)
                    setSelectedSourceItem(null)
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Source items */}
            <div className="matrix-source-items">
              <label className="groan-label">Select your {selectedSourceType}:</label>
              <div className="source-item-list">
                {sourceItems.slice(0, 5).map(item => (
                  <button
                    key={item.id}
                    className={`source-item-btn ${selectedSourceItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSourceItem(item)}
                  >
                    {item.cluster_label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility layers */}
            {selectedSourceItem && (
              <div className="matrix-visibility-layers">
                <label className="groan-label">Push into which layer?</label>
                <div className="visibility-layer-grid">
                  {GROAN_VISIBILITY_LAYERS.map(layer => (
                    <button
                      key={layer.id}
                      className={`visibility-layer-btn ${selectedVisibilityLayer === layer.id ? 'selected' : ''}`}
                      style={{
                        '--layer-color': layer.color,
                        borderColor: selectedVisibilityLayer === layer.id ? layer.color : undefined
                      }}
                      onClick={() => setSelectedVisibilityLayer(layer.id)}
                    >
                      <span className="layer-icon">{layer.icon}</span>
                      <span className="layer-label">{layer.label}</span>
                      <span className="layer-fear">{layer.fear}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate button */}
            {selectedSourceItem && selectedVisibilityLayer && (
              <button
                className="generate-challenge-btn"
                onClick={handleGenerateChallenge}
                disabled={generatingChallenge}
              >
                {generatingChallenge ? (
                  <>
                    <span className="generating-spinner" />
                    Generating your challenge...
                  </>
                ) : (
                  <>✨ Generate My Challenge</>
                )}
              </button>
            )}

            {/* Custom groan fallback */}
            <div className="custom-groan-toggle">
              <button
                className="toggle-custom-btn"
                onClick={() => setShowCustomGroan(!showCustomGroan)}
              >
                {showCustomGroan ? 'Use Matrix Selection' : 'Or write your own groan'}
              </button>
            </div>

            {showCustomGroan && (
              <div className="groan-input-section">
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

                <label className="groan-label">What layer?</label>
                <div className="layer-picker">
                  {GROAN_VISIBILITY_LAYERS.map(layer => (
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
              </div>
            )}
          </>
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
      case 5: return showFoundationStep ? renderConditionalCommitments() : renderGroupSelection()
      case 6: return showFoundationStep ? renderGroupSelection() : renderSummary()
      case 7: return renderSummary()
      default: return null
    }
  }

  // Determine if we're on the summary step
  const isSummaryStep = showFoundationStep ? step === 7 : step === 6

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
