/**
 * WeeklyPlanningFlow.jsx
 *
 * Multi-step flow for weekly intention setting.
 * Replaces discrete 7-day challenge starts with auto-rolling weekly rhythm.
 *
 * Flow Screens:
 * 1. Weekly Review - Flow check-in + project review → Start Week
 *
 * ARCHIVED (until Healing tab is live):
 * - Week Type Selection (push/flow/rest/launch) + project focus
 * - Guidance (signposts based on week type)
 * - Morning Reconnect Builder
 * - Week Plan Summary
 * - Groan Carousel, Conditional Commitments, Group Selection
 *
 * Created: Dec 2024
 * Updated: Jan 2025 - Added weekly review and task recommendations
 * See docs/weekly-planning-system-plan.md
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { trackWeeklyPlanCompleted } from '../lib/analytics'
import { getWeekStartLocal } from '../lib/dateUtils'
import {
  GROAN_VISIBILITY_LAYERS,
  GROAN_SOURCE_TYPES,
  STAGE_CONFIG
} from '../lib/stageConfig'
import {
  fetchFlowFinderData,
  hasCompletedFlowFinder,
  createGroanChallenge
} from '../lib/crm'
import { FLOW_DIRECTIONS, getFlowDirection } from '../lib/crm/reflectionService'
import GroanChallengeCard from './GroanChallengeCard'
import './WeeklyPlanningFlow.css'

// Week types with descriptions
const WEEK_TYPES = [
  {
    id: 'business',
    label: 'Business Week',
    icon: '💼',
    description: 'Focus on business activities',
    color: '#f59e0b'
  },
  {
    id: 'healing',
    label: 'Healing Week',
    icon: '💗',
    description: 'Focus on healing activities',
    color: '#ec4899'
  },
  {
    id: 'rest',
    label: 'Rest Week',
    icon: '🌙',
    description: 'Minimal activities, recharge',
    color: '#8b5cf6'
  },
  {
    id: 'flow',
    label: 'Flow Week',
    icon: '🌊',
    description: 'Follow what sparks curiosity',
    color: '#3b82f6'
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

// Quest categories for weekly prioritization
const QUEST_PRIORITIES = [
  {
    id: 'groans',
    label: 'Groans',
    icon: '😤',
    description: 'Courage challenges that push your edges',
    weekTypes: ['business', 'flow']
  },
  {
    id: 'healing',
    label: 'Healing',
    icon: '💗',
    description: 'Inner work and emotional processing',
    weekTypes: ['healing', 'rest', 'flow']
  },
  {
    id: 'reconnect',
    label: 'Reconnect',
    icon: '🧘',
    description: 'Daily practices to stay grounded',
    weekTypes: ['healing', 'rest', 'flow']
  },
  {
    id: 'business',
    label: 'Business',
    icon: '💼',
    description: 'Stage-specific business milestones',
    weekTypes: ['business']
  },
  {
    id: 'flow_finder',
    label: 'Flow Finder',
    icon: '🎯',
    description: 'Discover your skills, problems & personas',
    weekTypes: ['flow']
  },
  {
    id: 'tracker',
    label: 'Tracker',
    icon: '🧭',
    description: 'Log your flow and track progress',
    weekTypes: ['business', 'flow']
  }
]

function WeeklyPlanningFlow({ onComplete, existingPlan = null }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Current step in the flow
  const [step, setStep] = useState(1)

  // Weekly Review state (NEW)
  const [projects, setProjects] = useState([])
  const [reviewProjectId, setReviewProjectId] = useState(null) // Project being reviewed
  const [focusProjectId, setFocusProjectId] = useState(null) // Project focus for the week
  const [flowState, setFlowState] = useState({ internal: null, external: null })
  const [lastWeekStats, setLastWeekStats] = useState(null)
  const [selectedPriorities, setSelectedPriorities] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Group selection state
  const [groupMode, setGroupMode] = useState(null) // 'solo' | 'create' | 'join'
  const [groupCode, setGroupCode] = useState('')
  const [groupCodeInput, setGroupCodeInput] = useState('')
  const [groupData, setGroupData] = useState(null)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [joiningGroup, setJoiningGroup] = useState(false)
  const [groupError, setGroupError] = useState(null)

  // Foundation reminder (kept for save data)
  const [foundationReminder, setFoundationReminder] = useState(false)

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

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Hide bottom toolbar when this component is mounted
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => {
      document.body.classList.remove('hide-toolbar')
    }
  }, [])

  // Track whether last week stats have been checked
  const [lastWeekChecked, setLastWeekChecked] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadFlowFinderData()
      loadProjects()
      loadLastWeekStats()
      autoJoinTestGroup()
    }
  }, [user])

  // Skip review entirely for new users with no previous challenge data
  useEffect(() => {
    if (!lastWeekChecked || loadingProjects) return
    if (lastWeekStats && lastWeekStats.questCount === 0 && lastWeekStats.totalPoints === 0) {
      // No previous activity — skip straight to the challenge
      if (onComplete) {
        onComplete({})
      } else {
        navigate('/7-day-challenge')
      }
    }
  }, [lastWeekChecked, loadingProjects, lastWeekStats])

  // Auto-join all users to "Test Group" (temporary for launch testing)
  const autoJoinTestGroup = async () => {
    try {
      // Look for existing Test Group
      let { data: testGroup } = await supabase
        .from('challenge_groups')
        .select('*')
        .eq('code', 'TESTGRP1')
        .single()

      // Create if doesn't exist
      if (!testGroup) {
        const { data: newGroup } = await supabase
          .from('challenge_groups')
          .insert([{
            code: 'TESTGRP1',
            created_by: user.id,
            start_date: new Date().toISOString().split('T')[0]
          }])
          .select()
          .single()
        testGroup = newGroup
      }

      if (testGroup) {
        // Add user as participant (upsert to handle existing)
        await supabase
          .from('challenge_participants')
          .upsert([{
            group_id: testGroup.id,
            user_id: user.id
          }], { onConflict: 'group_id,user_id' })

        setGroupMode('join')
        setGroupData(testGroup)
        setGroupCode('TESTGRP1')
      }
    } catch (err) {
      console.error('Error auto-joining test group:', err)
      // Fallback to solo mode if group join fails
      setGroupMode('solo')
    }
  }

  // Load user's projects
  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setProjects(data || [])

      // Auto-select primary project for both review and focus
      const primary = data?.find(p => p.is_primary)
      if (primary) {
        setReviewProjectId(primary.id)
        setFocusProjectId(primary.id)
      } else if (data?.length > 0) {
        setReviewProjectId(data[0].id)
        setFocusProjectId(data[0].id)
      }
    } catch (err) {
      console.error('Error loading projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  // Load last week's stats for the selected project
  const loadLastWeekStats = async () => {
    try {
      // Get last week's date range (Monday to Sunday)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const lastMonday = new Date(now)
      lastMonday.setDate(now.getDate() - daysToLastMonday - 7)
      const lastSunday = new Date(lastMonday)
      lastSunday.setDate(lastMonday.getDate() + 6)
      lastSunday.setHours(23, 59, 59, 999)

      // Get quest completions from last week
      const { data: completions, error } = await supabase
        .from('quest_completions')
        .select('id, quest_id, points_earned')
        .eq('user_id', user.id)
        .gte('completed_at', lastMonday.toISOString())
        .lte('completed_at', lastSunday.toISOString())

      if (error) throw error

      const questCount = completions?.length || 0
      const totalPoints = (completions || []).reduce((sum, c) => sum + (c.points_earned || 0), 0)

      setLastWeekStats({
        totalPoints,
        questCount,
        weekOf: lastMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    } catch (err) {
      console.error('Error loading last week stats:', err)
    } finally {
      setLastWeekChecked(true)
    }
  }

  const loadFlowFinderData = async () => {
    const { completed, missing } = await hasCompletedFlowFinder(user.id)
    setFlowFinderComplete(completed)

    if (completed) {
      const { data } = await fetchFlowFinderData(user.id)
      setFlowFinderData(data)
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

  const getWeekStart = () => getWeekStartLocal()

  // Get week label
  const getWeekLabel = () => {
    const monday = new Date(getWeekStart())
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Single-step flow: Review only (other steps archived until Healing tab is live)
  const getTotalSteps = () => {
    return 1
  }

  // Get actual step number for display (always show from 1)
  const getDisplayStep = () => {
    return step
  }

  // Navigation
  const canContinue = () => {
    // Step 1: Weekly Review - need flow state selected
    if (step === 1) return flowState.internal !== null && flowState.external !== null

    // Step 2: Week Type Selection - need week type selected
    if (step === 2) return weekType !== null

    // Step 3: Guidance - can always continue
    if (step === 3) return true

    // Step 4: Morning routine
    if (step === 4) return morningRoutine.length > 0

    // Step 5: Summary
    return true
  }

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) {
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

      // Get flow direction from reflection
      const flowDirection = flowState.internal && flowState.external
        ? getFlowDirection(flowState.internal, flowState.external)
        : null

      const planData = {
        user_id: user.id,
        week_start: weekStart,
        week_type: weekType,
        focus_project_id: focusProjectId || null,
        selected_priorities: selectedPriorities, // Quest categories selected
        flow_internal: flowState.internal,
        flow_external: flowState.external,
        flow_direction: flowDirection,
        group_id: groupData?.id || null,
        morning_routine: morningRoutine,
        // Groan fields temporarily disabled - will be set via Groans tab
        weekly_groan_description: null,
        weekly_groan_day: null,
        weekly_groan_fears: [],
        weekly_groan_layer: null,
        weekly_groan_completed: false,
        groan_challenge_id: null,
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

      setSaving(false)

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

  // Helper to get stage info
  const getStageInfo = (stageNumber) => {
    return STAGE_CONFIG[stageNumber] || { name: `Stage ${stageNumber}`, icon: '📍', color: '#5e17eb' }
  }

  // Get flow direction info
  const getFlowDirectionInfo = () => {
    if (!flowState.internal || !flowState.external) return null
    const direction = getFlowDirection(flowState.internal, flowState.external)
    return FLOW_DIRECTIONS[direction]
  }

  // Render Step 1: Weekly Review (NEW)
  const renderWeeklyReview = () => {
    const directionInfo = getFlowDirectionInfo()
    const reviewProject = projects.find(p => p.id === reviewProjectId)
    const reviewStageInfo = reviewProject ? getStageInfo(reviewProject.current_stage) : null

    // Calculate days since last week's Monday
    const getDaysSinceWeek = () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      return dayOfWeek === 0 ? 6 : dayOfWeek - 1
    }

    return (
      <div className="planning-step review-step">
        <h2>Review Last Week</h2>
        <p className="step-subtitle">Reflect on how things went before planning ahead</p>

        {/* Project Selector Card */}
        <div className="review-card project-review-card">
          <div className="review-card-header">
            <span className="review-card-icon">📁</span>
            <span className="review-card-title">Project Review</span>
          </div>

          {projects.length > 1 ? (
            <div className="project-selector-wrapper">
              <select
                value={reviewProjectId || ''}
                onChange={(e) => setReviewProjectId(e.target.value)}
                style={{
                  display: 'block',
                  position: 'static',
                  width: '100%',
                  minHeight: '52px',
                  padding: '14px 44px 14px 16px',
                  margin: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  fontFamily: 'inherit',
                  lineHeight: '1.4',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  boxSizing: 'border-box'
                }}
              >
                {projects.map(project => {
                  const stageInfo = getStageInfo(project.current_stage)
                  return (
                    <option key={project.id} value={project.id}>
                      {stageInfo.icon}&nbsp;&nbsp;{project.name} {project.is_primary ? '(Primary)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          ) : reviewProject ? (
            <div className="single-project-display">
              <span className="project-icon">{reviewStageInfo?.icon || '📁'}</span>
              <div className="project-details">
                <span className="project-name">{reviewProject.name}</span>
                <span className="project-stage">{reviewStageInfo?.name}</span>
              </div>
            </div>
          ) : (
            <p className="no-projects">No projects yet</p>
          )}
        </div>

        {/* Last Week Stats Card — only show if there's actual activity */}
        {lastWeekStats && (lastWeekStats.questCount > 0 || lastWeekStats.totalPoints > 0) && (
          <div className="review-card stats-review-card">
            <div className="review-card-header">
              <span className="review-card-icon">📊</span>
              <span className="review-card-title">
                Week of {lastWeekStats.weekOf}
              </span>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{lastWeekStats.totalPoints}</span>
                <span className="stat-label">Points</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{lastWeekStats.questCount}</span>
                <span className="stat-label">Quests</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{getDaysSinceWeek()}</span>
                <span className="stat-label">Days Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Flow Check-In Card - matching existing flow capture pattern */}
        <div className="review-card flow-check-card">
          <div className="review-card-header">
            <span className="review-card-icon">🧭</span>
            <span className="review-card-title">How's your flow right now?</span>
          </div>

          <div className="flow-factor">
            <span className="factor-label">Are you feeling excited?</span>
            <div className="factor-options">
              <button
                type="button"
                className={`factor-btn ${flowState.internal === 'excited' ? 'selected' : ''}`}
                onClick={() => setFlowState(prev => ({ ...prev, internal: 'excited' }))}
              >
                <span className="factor-emoji">🔥</span>
                <span className="factor-text">Excited</span>
              </button>
              <button
                type="button"
                className={`factor-btn ${flowState.internal === 'tired' ? 'selected' : ''}`}
                onClick={() => setFlowState(prev => ({ ...prev, internal: 'tired' }))}
              >
                <span className="factor-emoji">😴</span>
                <span className="factor-text">Tired</span>
              </button>
            </div>
          </div>

          <div className="flow-factor">
            <span className="factor-label">How is the business flowing?</span>
            <div className="factor-options">
              <button
                type="button"
                className={`factor-btn ${flowState.external === 'great' ? 'selected' : ''}`}
                onClick={() => setFlowState(prev => ({ ...prev, external: 'great' }))}
              >
                <span className="factor-emoji">✨</span>
                <span className="factor-text">Great</span>
              </button>
              <button
                type="button"
                className={`factor-btn ${flowState.external === 'resistance' ? 'selected' : ''}`}
                onClick={() => setFlowState(prev => ({ ...prev, external: 'resistance' }))}
              >
                <span className="factor-emoji">🎋</span>
                <span className="factor-text">Facing resistance</span>
              </button>
            </div>
          </div>

          {/* Flow Direction Result */}
          {directionInfo && (
            <div
              className="flow-result"
              style={{ '--direction-color': directionInfo.color }}
            >
              <span className="direction-emoji">{directionInfo.emoji}</span>
              <div className="direction-info">
                <span className="direction-label">{directionInfo.label.toUpperCase()}</span>
                <span className="direction-desc">{directionInfo.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ====================================================================
  // ARCHIVED STEPS — Re-enable when Healing tab is live
  // Steps: Week Type, Guidance, Morning Routine, Groan, Commitments, Summary
  // ====================================================================

  // Toggle priority selection
  const togglePriority = (priorityId) => {
    setSelectedPriorities(prev =>
      prev.includes(priorityId)
        ? prev.filter(id => id !== priorityId)
        : [...prev, priorityId]
    )
  }

  // Get guidance content based on week type
  const getWeekGuidance = () => {
    switch (weekType) {
      case 'business':
        return {
          title: 'Business Week Focus',
          emoji: '💼',
          intro: 'This week, focus on visibility and growth activities.',
          signposts: [
            { icon: '💼', label: 'Business Milestones', desc: 'Complete stage-specific business tasks', tab: 'Business' },
            { icon: '🧭', label: 'Tracker', desc: 'Log your flow to spot patterns', tab: 'Tracker' }
          ],
          tip: 'Balance pushing with reconnection. Even on business weeks, 5 mins of morning grounding helps.'
        }
      case 'healing':
        return {
          title: 'Healing Week Focus',
          emoji: '💗',
          intro: 'This week, prioritize inner work and emotional processing.',
          signposts: [
            { icon: '💗', label: 'Healing', desc: 'Recognise, Release, and process emotions', tab: 'Healing' },
            { icon: '🧘', label: 'Reconnect', desc: 'Daily practices to stay grounded', tab: 'Reconnect' },
            { icon: '🧭', label: 'Tracker', desc: 'Notice how healing affects your flow', tab: 'Tracker' }
          ],
          tip: 'Healing weeks build the foundation for sustainable business growth. Honor what emerges.'
        }
      case 'rest':
        return {
          title: 'Rest Week Focus',
          emoji: '🌙',
          intro: 'This week, minimize and recharge. Less is more.',
          signposts: [
            { icon: '🧘', label: 'Reconnect', desc: 'Light daily practices only', tab: 'Reconnect' },
            { icon: '🧭', label: 'Tracker', desc: 'Log your energy without judgment', tab: 'Tracker' }
          ],
          tip: 'Rest isn\'t lazy—it\'s strategic. Your nervous system needs recovery to sustain growth.'
        }
      case 'flow':
        return {
          title: 'Flow Week Focus',
          emoji: '🌊',
          intro: 'This week, follow curiosity wherever it leads.',
          signposts: [
            { icon: '🎯', label: 'Flow Finder', desc: 'Discover skills, problems & personas', tab: 'Flow Finder' },
            { icon: '😤', label: 'Groans', desc: 'Courage challenges that excite you', tab: 'Groans' },
            { icon: '💗', label: 'Healing', desc: 'Process what arises', tab: 'Healing' },
            { icon: '🧭', label: 'Tracker', desc: 'Track what brings you into flow', tab: 'Tracker' }
          ],
          tip: 'Flow weeks are for exploration. No pressure—just follow what lights you up.'
        }
      default:
        return null
    }
  }

  // Render Step 3: Guidance Page (signposts based on week type)
  const renderGuidanceStep = () => {
    const guidance = getWeekGuidance()
    if (!guidance) return null

    return (
      <div className="planning-step guidance-step">
        <div className="guidance-header">
          <span className="guidance-emoji">{guidance.emoji}</span>
          <h2>{guidance.title}</h2>
        </div>
        <p className="step-subtitle">{guidance.intro}</p>

        <div className="signpost-list">
          <h3 className="signpost-heading">Where to focus in the Challenge:</h3>
          {guidance.signposts.map((signpost, idx) => (
            <div key={idx} className="signpost-card">
              <span className="signpost-icon">{signpost.icon}</span>
              <div className="signpost-content">
                <span className="signpost-label">{signpost.label}</span>
                <span className="signpost-desc">{signpost.desc}</span>
              </div>
              <span className="signpost-arrow">→</span>
            </div>
          ))}
        </div>

        <div className="guidance-tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">{guidance.tip}</span>
        </div>
      </div>
    )
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
  const renderWeekTypeSelection = () => {
    const focusProject = projects.find(p => p.id === focusProjectId)
    const focusStageInfo = focusProject ? getStageInfo(focusProject.current_stage) : null

    return (
      <div className="planning-step week-type-step">
        <h2>What kind of week is this?</h2>
        <p className="step-subtitle">Set your intention for the week ahead</p>

        {/* Project Focus Dropdown */}
        {projects.length > 0 && (
          <div className="project-focus-section">
            <label>Project focus this week:</label>
            <select
              className="project-dropdown"
              value={focusProjectId || ''}
              onChange={(e) => setFocusProjectId(e.target.value)}
              style={{
                display: 'block',
                position: 'static',
                width: '100%',
                minHeight: '52px',
                padding: '14px 44px 14px 16px',
                margin: '0 0 8px 0',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                boxSizing: 'border-box'
              }}
            >
              {projects.map(project => {
                const stageInfo = getStageInfo(project.current_stage)
                return (
                  <option key={project.id} value={project.id}>
                    {stageInfo.icon}&nbsp;&nbsp;{project.name} - {stageInfo.name}
                  </option>
                )
              })}
            </select>
            {focusStageInfo && (
              <p className="focus-stage-hint">
                Currently in {focusStageInfo.name}
              </p>
            )}
          </div>
        )}

        <div className="week-type-grid">
          {WEEK_TYPES.map(type => (
            <button
              key={type.id}
              className={`week-type-card ${weekType === type.id ? 'selected' : ''} ${type.id === 'healing' ? 'disabled' : ''}`}
              onClick={() => type.id !== 'healing' && setWeekType(type.id)}
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
  }

  // Render Step 4: Morning Routine Builder
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
                  onClick={() => navigate('/mind-space')}
                >
                  Complete Mind Space
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

            {/* Action buttons - Write Your Own + Generate */}
            {selectedSourceItem && selectedVisibilityLayer && (
              <div className="groan-action-buttons">
                <button
                  className="write-own-btn"
                  onClick={() => setShowCustomGroan(true)}
                >
                  ✏️ Write Your Own
                </button>
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
              </div>
            )}

            {/* Show toggle back to matrix when in custom mode */}
            {showCustomGroan && (
              <div className="custom-groan-toggle">
                <button
                  className="toggle-custom-btn"
                  onClick={() => setShowCustomGroan(false)}
                >
                  ← Back to Matrix Selection
                </button>
              </div>
            )}

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

  // Render Step: Summary
  const renderSummary = () => {
    const selectedType = WEEK_TYPES.find(t => t.id === weekType)
    const selectedRoutines = MORNING_ROUTINES.filter(r => morningRoutine.includes(r.id))
    const selectedRelease = RELEASE_PRACTICES.find(p => p.id === bigReleasePractice)
    const releaseDayLabel = DAYS.find(d => d.id === bigReleaseDay)?.label
    const focusProject = projects.find(p => p.id === focusProjectId)
    const focusStageInfo = focusProject ? getStageInfo(focusProject.current_stage) : null
    const selectedPriorityDetails = QUEST_PRIORITIES.filter(p => selectedPriorities.includes(p.id))

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
              <span style={{ marginRight: '6px' }}>{selectedType?.icon}</span>
              {selectedType?.label}
            </span>
          </div>

          {/* Project Focus */}
          {focusProject && (
            <div className="summary-section">
              <span className="section-icon">{focusStageInfo?.icon || '📁'}</span>
              <div className="section-content">
                <strong>Project Focus</strong>
                <p>{focusProject.name} - {focusStageInfo?.name}</p>
              </div>
            </div>
          )}

          {/* Selected Priorities */}
          {selectedPriorityDetails.length > 0 && (
            <div className="summary-section summary-priorities">
              <span className="section-icon">🎯</span>
              <div className="section-content">
                <strong>Quest Priorities ({selectedPriorityDetails.length})</strong>
                <div className="summary-priority-chips">
                  {selectedPriorityDetails.map(priority => (
                    <span key={priority.id} className="summary-priority-chip">
                      <span className="chip-icon">{priority.icon}</span>
                      {priority.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="summary-section">
            <span className="section-icon">🌅</span>
            <div className="section-content">
              <strong>Morning Routine</strong>
              <p>{selectedRoutines.map(r => r.label).join(' + ') || 'None selected'}</p>
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

  // Render current step (single-step flow — other steps archived until Healing tab is live)
  const renderStep = () => {
    switch (step) {
      case 1: return renderWeeklyReview()
      default: return null
    }
  }

  // Single step = always the final step
  const isSummaryStep = step === 1

  // Wait for skip-check to resolve before rendering anything visible
  // This prevents the flow check-in from flashing on screen for users who will be auto-skipped
  if (!lastWeekChecked || loadingProjects) {
    return null
  }

  // If no projects and done loading, show empty state prompting Mind Space
  if (projects.length === 0) {
    return (
      <div className="weekly-planning-flow">
        <div className="planning-empty-state">
          <span className="empty-icon">🎯</span>
          <h2>Create Your First Project</h2>
          <p>
            Before planning your week, let's discover what makes you unique.
            Complete the Mind Space to uncover your skills, the problems you solve,
            and who you're meant to serve.
          </p>
          <button
            className="primary-btn"
            onClick={() => navigate('/mind-space')}
          >
            Start Mind Space →
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate('/me')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    )
  }

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

      {/* Step content with navigation */}
      <div className="planning-content">
        {renderStep()}

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
              Continue →
            </button>
          ) : (
            <button
              className="nav-btn complete"
              onClick={handleSave}
              disabled={saving || !flowState.internal || !flowState.external}
            >
              {saving ? 'Saving...' : 'Start Week →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default WeeklyPlanningFlow
