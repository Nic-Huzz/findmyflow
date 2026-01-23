/**
 * useChallengeData - Custom hook for Challenge component state and data management
 *
 * Extracted from Challenge.jsx to improve maintainability.
 * Handles all state, data loading, and challenge/group management.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { sendNotification } from '../lib/notifications'
import {
  handleConversationLogCompletion,
  handleMilestoneCompletion,
  handleFlowCompassCompletion,
  handleGroanReflectionCompletion,
  handleValidationAnalysisCompletion,
  handleStreakUpdate,
  getUserStageProgress
} from '../lib/questCompletionHelpers'
import { checkStreakBreak } from '../lib/streakTracking'
import { initializeUserStageProgress, checkAndGraduateProject } from '../lib/graduationChecker'
import { normalizePersona } from '../data/personaProfiles'
import { convertLegacyStage, STAGE_CONFIG } from '../lib/stageConfig'
import { generateVoiceQuestsForStage } from '../lib/voiceQuestConfig'

// Map URL tab params to internal category names
const TAB_TO_CATEGORY = {
  'quests': 'Business',
  'business': 'Business',
  'groans': 'Groans',
  'healing': 'Healing',
  'tracker': 'Tracker',
  'bonus': 'Bonus',
  'leaderboard': 'Leaderboard',
  'summary': 'GroansSummary',
  'healing-summary': 'HealingSummary'
}

export function useChallengeData() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get initial category from URL params
  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')?.toLowerCase()
    return TAB_TO_CATEGORY[tabParam] || 'Business'
  }

  // UI State
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(getInitialCategory)
  const [activeRTypeFilter, setActiveRTypeFilter] = useState('All')
  const [activeFrequencyFilter, setActiveFrequencyFilter] = useState('daily')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showGroupSelection, setShowGroupSelection] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showExplainer, setShowExplainer] = useState(false)
  const [showLockedTooltip, setShowLockedTooltip] = useState(null)
  const [expandedLearnMore, setExpandedLearnMore] = useState({})
  const settingsMenuRef = useRef(null)

  // Data State
  const [challengeData, setData] = useState(null)
  const [dailyReleaseChallenges, setDailyReleaseChallenges] = useState(null)
  const [progress, setProgress] = useState(null)
  const [completions, setCompletions] = useState([])
  const [questInputs, setQuestInputs] = useState({})
  const [userData, setUserData] = useState(null)
  const [stageProgress, setStageProgress] = useState(null)

  // Group/Leaderboard State
  const [groupMode, setGroupMode] = useState(null)
  const [groupCode, setGroupCode] = useState('')
  const [groupCodeInput, setGroupCodeInput] = useState('')
  const [groupData, setGroupData] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardView, setLeaderboardView] = useState('weekly')
  const [userRank, setUserRank] = useState(null)

  // Prerequisite State
  const [nervousSystemComplete, setNervousSystemComplete] = useState(false)
  const [safetyContracts, setSafetyContracts] = useState([])
  const [healingCompassComplete, setHealingCompassComplete] = useState(false)
  const [pastParallelStory, setPastParallelStory] = useState(null)
  const [flowFinderComplete, setFlowFinderComplete] = useState(false)

  // Project-Based State
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeStageTab, setActiveStageTab] = useState(1)
  const [projectStage, setProjectStage] = useState(1)

  // Sub-Tab State (for Business and Healing tabs)
  const [businessSubTab, setBusinessSubTab] = useState('tasks') // 'tasks' | 'voices'
  const [healingSubTab, setHealingSubTab] = useState('daily') // 'daily' | 'weekly'

  // User Archetypes (for personalized voice quests)
  const [userArchetypes, setUserArchetypes] = useState({ essence: null, protective: null })

  // Weekly Planning State
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const [showWeeklyPlanning, setShowWeeklyPlanning] = useState(false)
  const [isSunday, setIsSunday] = useState(false)

  // Validation Response Counts (for response_counter quests)
  const [validationResponseCounts, setValidationResponseCounts] = useState({})

  // Sync activeCategory with URL params when they change
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')?.toLowerCase()
    if (tabParam && TAB_TO_CATEGORY[tabParam]) {
      setActiveCategory(TAB_TO_CATEGORY[tabParam])
    }
  }, [location.search])

  // Constants
  const categories = ['Business', 'Healing', 'Tracker', 'Bonus']
  const BONUS_PERCENTAGE = 5

  // ============================================
  // Data Loading Functions
  // ============================================

  const loadChallengeData = async () => {
    try {
      const response = await fetch('/challengeQuestsUpdate.json')
      const data = await response.json()
      setData(data)

      const releaseChallengesResponse = await fetch('/dailyReleaseChallenges.json')
      const releaseChallengesData = await releaseChallengesResponse.json()
      setDailyReleaseChallenges(releaseChallengesData)
    } catch (error) {
      console.error('Error loading challenge data:', error)
    }
  }

  const loadUserProgress = async () => {
    try {
      setLoading(true)

      const { data: progressData, error: progressError } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('challenge_start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error loading progress:', progressError)
      }

      if (!progressData) {
        // Check if user has any previous challenges (returning user)
        const { data: anyPrevious } = await supabase
          .from('challenge_progress')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (anyPrevious) {
          // Returning user - skip onboarding, go straight to project selector
          setShowProjectSelector(true)
        } else {
          // First-time user - show full onboarding
          setShowOnboarding(true)
        }
        setLoading(false)
        return
      }

      setProgress(progressData)

      // Load selected project if challenge has a project_id
      if (progressData.project_id) {
        const { data: projectData, error: projectError } = await supabase
          .from('user_projects')
          .select('*')
          .eq('id', progressData.project_id)
          .single()

        if (!projectError && projectData) {
          setSelectedProject(projectData)
          setProjectStage(projectData.current_stage || 1)
          setActiveStageTab(projectData.current_stage || 1)
        }
      }

      // Check if streak should be broken
      const streakResult = await checkStreakBreak(user.id, progressData.challenge_instance_id)
      if (streakResult.streak_broken) {
        console.log('Streak was broken - reset to 0')
        const { data: updatedProgress } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('challenge_instance_id', progressData.challenge_instance_id)
          .single()
        if (updatedProgress) {
          setProgress(updatedProgress)
        }
      }

      // Check if we need to advance the day
      const lastActive = new Date(progressData.last_active_date)
      const now = new Date()
      const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const daysSinceLastActive = Math.floor((today - lastActiveDay) / (1000 * 60 * 60 * 24))

      if (daysSinceLastActive >= 1 && progressData.current_day < 7) {
        await advanceDay(progressData, daysSinceLastActive)
      }

      // Load quest completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('quest_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_instance_id', progressData.challenge_instance_id)

      if (completionsError) {
        console.error('Error loading completions:', completionsError)
      } else {
        setCompletions(completionsData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error in loadUserProgress:', error)
      setLoading(false)
    }
  }

  const advanceDay = async (currentProgress, daysToAdvance = 1) => {
    const newDay = Math.min(currentProgress.current_day + daysToAdvance, 7)

    const { data, error } = await supabase
      .from('challenge_progress')
      .update({
        current_day: newDay,
        last_active_date: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('challenge_instance_id', currentProgress.challenge_instance_id)
      .select()
      .single()

    if (error) {
      console.error('Error advancing day:', error)
    } else {
      setProgress(data)
      if (newDay > currentProgress.current_day && newDay <= 7) {
        await sendNotification(user.id, {
          title: `Day ${newDay} Unlocked!`,
          body: 'Your new daily quests are ready to complete',
          url: '/7-day-challenge',
          tag: `day-${newDay}`
        })
      }
    }
  }

  const loadUserData = async () => {
    if (!user?.email) return

    try {
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        setUserData(data[0])
        // Extract archetypes for voice quests
        setUserArchetypes({
          essence: data[0].essence_archetype || 'Essence',
          protective: data[0].protective_archetype || 'Protective Voice'
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadStageProgress = async () => {
    if (!user?.id) return

    try {
      const progress = await getUserStageProgress(user.id)
      setStageProgress(progress)
    } catch (error) {
      console.error('Error loading stage progress:', error)
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

  // Get formatted week label
  const getWeekLabel = () => {
    const weekStart = getWeekStart()
    const monday = new Date(weekStart + 'T00:00:00')
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Load weekly plan for current week
  const loadWeeklyPlan = async () => {
    if (!user?.id) return

    try {
      const weekStart = getWeekStart()
      const today = new Date().getDay()
      setIsSunday(today === 0)

      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle()

      if (error) {
        console.error('Error loading weekly plan:', error)
        return
      }

      if (data) {
        setWeeklyPlan(data)
        setShowWeeklyPlanning(false)
      } else {
        // No plan for this week - show planning flow
        setWeeklyPlan(null)
        setShowWeeklyPlanning(true)
      }
    } catch (error) {
      console.error('Error in loadWeeklyPlan:', error)
    }
  }

  // Mark groan as completed
  const completeWeeklyGroan = async () => {
    if (!weeklyPlan?.id) return

    try {
      const { error } = await supabase
        .from('weekly_plans')
        .update({ weekly_groan_completed: true })
        .eq('id', weeklyPlan.id)

      if (!error) {
        setWeeklyPlan(prev => ({ ...prev, weekly_groan_completed: true }))
      }
    } catch (error) {
      console.error('Error completing weekly groan:', error)
    }
  }

  // Handle weekly planning completion
  const handleWeeklyPlanComplete = (planData) => {
    setWeeklyPlan(planData)
    setShowWeeklyPlanning(false)
  }

  // Map weekly plan routine IDs to quest IDs
  const ROUTINE_TO_QUEST_MAP = {
    meditation: 'reconnect_morning_meditation',
    breathwork: 'reconnect_morning_breathwork',
    rise_vibe_dance: 'reconnect_morning_dance',
    daily_prayer: 'reconnect_daily_prayer',
    self_identified: null // Custom activity, no specific quest
  }

  // Check if a quest is part of the weekly plan
  const isQuestPlanned = (questId) => {
    if (!weeklyPlan?.morning_routine) return false

    // Check if quest matches any planned morning routine
    for (const routineId of weeklyPlan.morning_routine) {
      const mappedQuestId = ROUTINE_TO_QUEST_MAP[routineId]
      if (mappedQuestId && mappedQuestId === questId) {
        return true
      }
    }
    return false
  }

  // Get the day a quest is planned for (for groan/release)
  const getPlannedDay = (questId) => {
    if (!weeklyPlan) return null

    // Check if this is related to the weekly groan
    if (questId.includes('groan') && weeklyPlan.weekly_groan_day) {
      return weeklyPlan.weekly_groan_day
    }

    // Check if this is related to release practice
    if (questId.includes('release') && weeklyPlan.big_release_day) {
      return weeklyPlan.big_release_day
    }

    return null
  }

  const loadLeaderboard = async () => {
    try {
      if (!user) return

      // Get current calendar week (Monday to Sunday)
      const now = new Date()
      const day = now.getDay()
      const mondayOffset = day === 0 ? -6 : 1 - day // Adjust for Sunday
      const currentWeekStart = new Date(now)
      currentWeekStart.setDate(now.getDate() + mondayOffset)
      currentWeekStart.setHours(0, 0, 0, 0)
      const currentWeekEnd = new Date(currentWeekStart)
      currentWeekEnd.setDate(currentWeekStart.getDate() + 7)

      // Get all active challenge participants
      let challengeQuery = supabase
        .from('challenge_progress')
        .select('*')
        .eq('status', 'active')

      if (progress && progress.group_id) {
        challengeQuery = challengeQuery.eq('group_id', progress.group_id)
      }

      const { data: challengeData, error: challengeError } = await challengeQuery

      if (challengeError) {
        console.error('Error loading leaderboard:', challengeError)
        return
      }

      if (!challengeData || challengeData.length === 0) {
        setLeaderboard([])
        setUserRank(null)
        return
      }

      // For weekly view, calculate points from quest_completions this week
      let leaderboardData = []

      if (leaderboardView === 'weekly') {
        // Get all quest completions for this week for all active users
        const userIds = challengeData.map(entry => entry.user_id)

        const { data: weeklyCompletions, error: completionsError } = await supabase
          .from('quest_completions')
          .select('user_id, points_earned')
          .in('user_id', userIds)
          .gte('completed_at', currentWeekStart.toISOString())
          .lt('completed_at', currentWeekEnd.toISOString())

        if (completionsError) {
          console.error('Error loading weekly completions:', completionsError)
          return
        }

        // Sum points per user for this week
        const weeklyPointsMap = {}
        if (weeklyCompletions) {
          weeklyCompletions.forEach(completion => {
            weeklyPointsMap[completion.user_id] = (weeklyPointsMap[completion.user_id] || 0) + (completion.points_earned || 0)
          })
        }

        // Build leaderboard with weekly points
        leaderboardData = challengeData.map(entry => ({
          ...entry,
          weeklyPoints: weeklyPointsMap[entry.user_id] || 0
        }))

        // Sort by weekly points
        leaderboardData.sort((a, b) => b.weeklyPoints - a.weeklyPoints)
      } else {
        // All-time view: sort by total_points
        leaderboardData = [...challengeData].sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      }

      const sessionIds = leaderboardData.map(entry => entry.session_id).filter(Boolean)

      const { data: profilesData, error: profilesError } = await supabase
        .from('lead_flow_profiles')
        .select('session_id, user_name, email')
        .in('session_id', sessionIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
      }

      const profileMap = {}
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap[profile.session_id] = profile.user_name
        })
      }

      const formattedLeaderboard = leaderboardData.map((entry, index) => {
        const userName = profileMap[entry.session_id] || 'Anonymous'
        const firstName = userName.split(' ')[0]

        return {
          rank: index + 1,
          userId: entry.user_id,
          name: firstName,
          totalPoints: leaderboardView === 'weekly' ? entry.weeklyPoints : (entry.total_points || 0),
          weeklyPoints: entry.weeklyPoints || 0,
          allTimePoints: entry.total_points || 0,
          isCurrentUser: entry.user_id === user.id
        }
      })

      setLeaderboard(formattedLeaderboard)

      const userEntry = formattedLeaderboard.find(entry => entry.isCurrentUser)
      setUserRank(userEntry?.rank || null)

    } catch (error) {
      console.error('Error in loadLeaderboard:', error)
    }
  }

  const loadGroupInfo = async () => {
    if (!progress || !progress.group_id) return

    try {
      const { data, error } = await supabase
        .from('challenge_groups')
        .select('*')
        .eq('id', progress.group_id)
        .single()

      if (!error && data) {
        setGroupData(data)
        setGroupCode(data.code)
      }
    } catch (error) {
      console.error('Error loading group info:', error)
    }
  }

  const checkNervousSystemComplete = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('nervous_system_responses')
        .select('id, safety_contracts')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        setNervousSystemComplete(true)
        // Store the safety contracts for use in Release quests
        setSafetyContracts(data[0].safety_contracts || [])
      } else {
        setNervousSystemComplete(false)
        setSafetyContracts([])
      }
    } catch (error) {
      console.error('Error checking nervous system completion:', error)
      setNervousSystemComplete(false)
      setSafetyContracts([])
    }
  }

  const checkHealingCompassComplete = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('healing_compass_responses')
        .select('past_parallel_story')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        setHealingCompassComplete(true)
        setPastParallelStory(data[0].past_parallel_story)
      } else {
        setHealingCompassComplete(false)
        setPastParallelStory(null)
      }
    } catch (error) {
      console.error('Error checking healing compass completion:', error)
      setHealingCompassComplete(false)
      setPastParallelStory(null)
    }
  }

  // Check Flow Finder completion (user-level, not project-level)
  const checkFlowFinderComplete = async () => {
    if (!user?.id) return

    try {
      // Check if all 4 Flow Finder flows are complete (user-level, no project_id)
      const flowFinderFlows = ['nikigai_skills', 'nikigai_problems', 'nikigai_persona', 'nikigai_integration']

      const { data, error } = await supabase
        .from('flow_sessions')
        .select('flow_type')
        .eq('user_id', user.id)
        .in('flow_type', flowFinderFlows)

      if (!error && data) {
        const completedFlows = [...new Set(data.map(d => d.flow_type))]
        const allComplete = flowFinderFlows.every(f => completedFlows.includes(f))
        setFlowFinderComplete(allComplete)
      } else {
        setFlowFinderComplete(false)
      }
    } catch (error) {
      console.error('Error checking flow finder completion:', error)
      setFlowFinderComplete(false)
    }
  }

  // Load validation response counts by stage (for response_counter quests)
  const loadValidationResponseCounts = async () => {
    if (!user?.id) return

    try {
      // Get all validation flows created by this user
      const { data: flows, error: flowsError } = await supabase
        .from('validation_flows')
        .select('id, stage')
        .eq('creator_user_id', user.id)

      if (flowsError) {
        console.error('Error loading validation flows:', flowsError)
        return
      }

      if (!flows || flows.length === 0) {
        setValidationResponseCounts({})
        return
      }

      const flowIds = flows.map(f => f.id)

      // Get completed session counts for each flow
      const { data: sessions, error: sessionsError } = await supabase
        .from('validation_sessions')
        .select('flow_id')
        .in('flow_id', flowIds)
        .eq('is_completed', true)

      if (sessionsError) {
        console.error('Error loading validation sessions:', sessionsError)
        return
      }

      // Count sessions by stage
      const counts = {}
      sessions?.forEach(session => {
        const flow = flows.find(f => f.id === session.flow_id)
        if (flow?.stage) {
          counts[flow.stage] = (counts[flow.stage] || 0) + 1
        }
      })

      setValidationResponseCounts(counts)
    } catch (error) {
      console.error('Error in loadValidationResponseCounts:', error)
      setValidationResponseCounts({})
    }
  }

  // ============================================
  // Challenge/Group Management
  // ============================================

  const showGroupSelectionModal = () => {
    setShowOnboarding(false)
    setShowGroupSelection(true)
  }

  const handlePlaySolo = () => {
    setGroupMode(null)
    setShowGroupSelection(false)
    setShowProjectSelector(true)
  }

  const handleCreateGroup = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_group_code')
      if (error) throw error

      const newCode = data

      const { data: groupData, error: groupError } = await supabase
        .from('challenge_groups')
        .insert([{
          code: newCode,
          created_by: user.id,
          start_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (groupError) throw groupError

      setGroupCode(newCode)
      setGroupData(groupData)
      setGroupMode('create')

      await supabase
        .from('challenge_participants')
        .insert([{
          group_id: groupData.id,
          user_id: user.id
        }])

      alert(`Group created successfully!\n\nYour group code is: ${newCode}\n\nShare this code with friends to invite them to your challenge group.`)

      setShowGroupSelection(false)
      setShowProjectSelector(true)
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Error creating group. Please try again.')
    }
  }

  const handleJoinGroup = async () => {
    if (!groupCodeInput || groupCodeInput.trim() === '') {
      alert('Please enter a group code')
      return
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('challenge_groups')
        .select('*')
        .eq('code', groupCodeInput.trim().toUpperCase())
        .single()

      if (groupError || !groupData) {
        alert('Invalid group code. Please check and try again.')
        return
      }

      setGroupData(groupData)
      setGroupCode(groupData.code)
      setGroupMode('join')

      await supabase
        .from('challenge_participants')
        .insert([{
          group_id: groupData.id,
          user_id: user.id
        }])

      setShowGroupSelection(false)
      setShowProjectSelector(true)
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Error joining group. Please try again.')
    }
  }

  const handleProjectSelected = async (project) => {
    setSelectedProject(project)
    setProjectStage(project.current_stage || 1)
    setActiveStageTab(project.current_stage || 1)
    setShowProjectSelector(false)

    await startChallengeWithProject(project, groupData?.id || null)
  }

  const startChallengeWithProject = async (project, groupId = null) => {
    try {
      await supabase.rpc('abandon_active_challenges', { p_user_id: user.id })

      const { data: profileData } = await supabase
        .from('lead_flow_profiles')
        .select('session_id')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const sessionId = profileData?.session_id || `session_${Date.now()}`
      const challengeInstanceId = crypto.randomUUID()

      const insertData = {
        user_id: user.id,
        session_id: sessionId,
        challenge_instance_id: challengeInstanceId,
        current_day: 0,
        status: 'active',
        challenge_start_date: new Date().toISOString(),
        last_active_date: new Date().toISOString(),
        persona: stageProgress?.persona || 'vibe_seeker',
        current_stage: project.current_stage || 1,
        project_id: project.id
      }

      if (groupId) {
        insertData.group_id = groupId
      }

      const { data, error } = await supabase
        .from('challenge_progress')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error starting challenge with project:', error)
        alert('Error starting challenge. Please try again.')
        return
      }

      setProgress(data)
      setShowOnboarding(false)
    } catch (error) {
      console.error('Error in startChallengeWithProject:', error)
      alert('Error starting challenge. Please try again.')
    }
  }

  const startChallenge = async (groupId = null) => {
    try {
      await supabase.rpc('abandon_active_challenges', { p_user_id: user.id })

      const { data: profileData } = await supabase
        .from('lead_flow_profiles')
        .select('session_id')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const sessionId = profileData?.session_id || `session_${Date.now()}`

      let userPersona = stageProgress?.persona
      let userStage = stageProgress?.current_stage

      if (!userPersona || !userStage) {
        const { data: currentStageProgress } = await supabase
          .from('user_stage_progress')
          .select('persona, current_stage')
          .eq('user_id', user.id)
          .maybeSingle()

        userPersona = currentStageProgress?.persona || 'vibe_seeker'
        userStage = currentStageProgress?.current_stage || 'clarity'
      }

      const challengeInstanceId = crypto.randomUUID()

      const insertData = {
        user_id: user.id,
        session_id: sessionId,
        challenge_instance_id: challengeInstanceId,
        current_day: 0,
        status: 'active',
        challenge_start_date: new Date().toISOString(),
        last_active_date: new Date().toISOString(),
        persona: userPersona,
        current_stage: userStage
      }

      if (groupId) {
        insertData.group_id = groupId
      }

      const { data, error } = await supabase
        .from('challenge_progress')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error starting challenge:', error)
        alert('Error starting challenge. Please try again.')
        return
      }

      setProgress(data)
      setShowOnboarding(false)
    } catch (error) {
      console.error('Error in startChallenge:', error)
      alert('Error starting challenge. Please try again.')
    }
  }

  const handleRestartChallenge = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to start a new 7-day challenge? Your current progress will be archived and you\'ll start fresh on Day 1.'
    )

    if (!confirmed) return

    try {
      await supabase
        .from('challenge_progress')
        .update({ status: 'completed' })
        .eq('user_id', user.id)
        .eq('status', 'active')

      setShowProjectSelector(true)
      setProgress(null)
    } catch (error) {
      console.error('Error restarting challenge:', error)
      alert('Error starting new challenge. Please try again.')
    }
  }

  const handleCloseExplainer = () => {
    setShowExplainer(false)
    localStorage.setItem('hasSeenPortalExplainer', 'true')
  }

  const handleOpenExplainer = () => {
    setShowExplainer(true)
  }

  // ============================================
  // Quest Completion Helpers
  // ============================================

  const isQuestCompletedToday = (questId, quest) => {
    const today = new Date().setHours(0, 0, 0, 0)
    const weekStart = new Date(getWeekStart() + 'T00:00:00').getTime()

    // Daily quests: check if completed TODAY only
    if (quest.frequency === 'daily') {
      return completions.some(c => {
        const completedDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
        return c.quest_id === questId && completedDate === today
      })
    } else if (quest.frequency === 'weekly') {
      // Weekly quests: check if completed THIS WEEK (since Monday)
      return completions.some(c => {
        const completedDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
        return c.quest_id === questId && completedDate >= weekStart
      })
    } else {
      // Other quests (one-time, etc.): check completion limits or any completion
      const questCompletions = completions.filter(c => c.quest_id === questId)

      if (quest.maxCompletions) {
        return questCompletions.length >= quest.maxCompletions
      }

      if (quest.maxPerDay) {
        const todayCompletions = questCompletions.filter(c => {
          const completedDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
          return completedDate === today
        })
        return todayCompletions.length >= quest.maxPerDay
      }

      return questCompletions.length > 0
    }
  }

  const isQuestEverCompleted = (questId) => {
    return completions.some(c => c.quest_id === questId)
  }

  const isQuestLocked = (quest) => {
    if (!quest.requires_quest) return false
    return !isQuestEverCompleted(quest.requires_quest)
  }

  const getRequiredQuestName = (questId) => {
    const quest = challengeData?.quests?.find(q => q.id === questId)
    return quest?.name || questId
  }

  const toggleLearnMore = (questId) => {
    setExpandedLearnMore(prev => ({
      ...prev,
      [questId]: !prev[questId]
    }))
  }

  // ============================================
  // Points & Progress Helpers
  // ============================================

  const getValidQuestIds = (category) => {
    if (!challengeData?.quests) return []

    const userPersonaNormalized = normalizePersona(userData?.persona)

    return challengeData.quests
      .filter(quest => {
        // Skip archived quests
        if (quest.archived) return false

        if (quest.category !== category) return false

        if (quest.persona_specific && userPersonaNormalized) {
          const normalizedQuestPersonas = quest.persona_specific.map(p => normalizePersona(p))
          if (!normalizedQuestPersonas.includes(userPersonaNormalized)) {
            return false
          }
        }

        if (quest.stage_required !== undefined && quest.stage_required !== null) {
          const currentStageNum = selectedProject?.current_stage ||
            (typeof stageProgress?.current_stage === 'number'
              ? stageProgress.current_stage
              : convertLegacyStage(stageProgress?.current_stage))

          // Check if this quest's stage is always accessible (like Flow Finder stage 0 or Tracking stage 8)
          const stageConfig = STAGE_CONFIG[quest.stage_required]
          const isAlwaysAccessible = stageConfig?.alwaysAccessible

          // Include quests if stage matches current OR stage is always accessible
          if (!isAlwaysAccessible && Number(quest.stage_required) !== Number(currentStageNum)) {
            return false
          }
        }

        return true
      })
      .map(q => q.id)
  }

  const getCategoryPoints = (category) => {
    if (!progress) return { daily: 0, weekly: 0, total: 0 }

    // Get current week start for filtering
    const weekStart = new Date(getWeekStart() + 'T00:00:00')

    const categoriesWithColumns = ['recognise', 'release', 'rewire', 'reconnect']
    const categoryLower = category.toLowerCase()

    // Note: For categories with stored columns, we'd need to recalculate weekly
    // For now, calculate from completions for all categories

    const validQuestIds = getValidQuestIds(category)

    // Filter completions by category AND current week only
    const categoryCompletions = completions.filter(c => {
      if (c.quest_category !== category || !validQuestIds.includes(c.quest_id)) {
        return false
      }
      // Only count completions from current week
      const completionDate = new Date(c.completed_at)
      return completionDate >= weekStart
    })

    const total = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

    if (category === 'Groans' || category === 'Healing') {
      const getQuestFrequency = (questId) => {
        const quest = challengeData?.quests?.find(q => q.id === questId)
        return quest?.frequency || 'daily'
      }
      const dailyPoints = categoryCompletions
        .filter(c => getQuestFrequency(c.quest_id) === 'daily')
        .reduce((sum, c) => sum + (c.points_earned || 0), 0)
      const weeklyPoints = categoryCompletions
        .filter(c => getQuestFrequency(c.quest_id) === 'weekly')
        .reduce((sum, c) => sum + (c.points_earned || 0), 0)
      return { daily: dailyPoints, weekly: weeklyPoints, total }
    }

    return { daily: 0, weekly: 0, total }
  }

  const getPointsToday = (category) => {
    if (!completions || completions.length === 0) return 0

    const today = new Date().setHours(0, 0, 0, 0)
    const validQuestIds = getValidQuestIds(category)

    const todayCompletions = completions.filter(c => {
      const completionDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
      return c.quest_category === category &&
        completionDate === today &&
        validQuestIds.includes(c.quest_id)
    })

    return todayCompletions.reduce((sum, completion) => sum + (completion.points_earned || 0), 0)
  }

  const getCompletedStages = () => {
    if (!challengeData?.quests || !completions || completions.length === 0) return []

    const completedStages = []

    for (let stageNum = 1; stageNum <= 7; stageNum++) {
      const stageQuests = challengeData.quests.filter(q => q.stage_required === stageNum && !q.archived)

      if (stageQuests.length === 0) continue

      const userPersonaNormalized = normalizePersona(userData?.persona)
      const relevantQuests = stageQuests.filter(quest => {
        if (quest.persona_specific && userPersonaNormalized) {
          const normalizedQuestPersonas = quest.persona_specific.map(p => normalizePersona(p))
          return normalizedQuestPersonas.includes(userPersonaNormalized)
        }
        return true
      })

      if (relevantQuests.length === 0) continue

      const allCompleted = relevantQuests.every(quest =>
        completions.some(c => c.quest_id === quest.id)
      )

      if (allCompleted) {
        completedStages.push(stageNum)
      }
    }

    return completedStages
  }

  const checkArtifactUnlock = (category, newPoints, frequencyKey) => {
    if (!challengeData) return false

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return false

    if (artifact.rCategories && artifact.totalRequired) {
      const categoryCompletions = completions.filter(c => c.quest_category === category)
      const totalCategoryPoints = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)
      return totalCategoryPoints + (frequencyKey ? newPoints : 0) >= artifact.totalRequired
    }

    if (artifact.pointsRequired) {
      const categoryCompletions = completions.filter(c => c.quest_category === category)
      const currentPoints = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)
      return currentPoints + newPoints >= artifact.pointsRequired
    }

    return false
  }

  const getArtifactProgress = (category) => {
    if (!challengeData) return null

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return null

    const unlocked = progress?.[`${artifact.id}_unlocked`] || false
    const validQuestIds = getValidQuestIds(category)

    // Get current week start for filtering
    const weekStart = new Date(getWeekStart() + 'T00:00:00')

    if ((category === 'Groans' || category === 'Healing') && artifact.frequencyCategories) {
      const frequencyCategoriesWithProgress = {}

      // Build a map of quest_id to frequency from the quests data
      const questFrequencyMap = {}
      challengeData.quests.forEach(quest => {
        if (quest.category === category) {
          questFrequencyMap[quest.id] = quest.frequency
        }
      })

      Object.entries(artifact.frequencyCategories).forEach(([freqType, freqData]) => {
        // freqType is 'Daily' or 'Weekly', quest.frequency is 'daily' or 'weekly'
        // Filter by current week only
        const freqCompletions = completions.filter(c => {
          if (c.quest_category !== category || !validQuestIds.includes(c.quest_id)) return false
          if (questFrequencyMap[c.quest_id]?.toLowerCase() !== freqType.toLowerCase()) return false
          // Only count completions from current week
          const completionDate = new Date(c.completed_at)
          return completionDate >= weekStart
        })
        const currentPoints = freqCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

        frequencyCategoriesWithProgress[freqType] = {
          ...freqData,
          currentPoints
        }
      })

      return {
        ...artifact,
        frequencyCategories: frequencyCategoriesWithProgress,
        unlocked
      }
    }

    if (category === 'Business') {
      const flowFinderQuests = challengeData.quests.filter(q => validQuestIds.includes(q.id))
      const dynamicPointsRequired = flowFinderQuests.reduce((sum, q) => sum + (q.points || 0), 0)

      // Filter by current week
      const categoryCompletions = completions.filter(c => {
        if (c.quest_category !== category || !validQuestIds.includes(c.quest_id)) return false
        const completionDate = new Date(c.completed_at)
        return completionDate >= weekStart
      })
      const currentPoints = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

      return {
        ...artifact,
        currentPoints,
        pointsRequired: dynamicPointsRequired || artifact.pointsRequired,
        unlocked
      }
    }

    // Filter by current week
    const categoryCompletions = completions.filter(c => {
      if (c.quest_category !== category || !validQuestIds.includes(c.quest_id)) return false
      const completionDate = new Date(c.completed_at)
      return completionDate >= weekStart
    }
    )
    const currentPoints = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

    return {
      ...artifact,
      currentPoints,
      unlocked
    }
  }

  const getTabCompletionStatus = (category) => {
    if (!challengeData || !completions) {
      return { totalQuests: 0, completedQuests: 0, isComplete: false, bonusPoints: 0, percentage: 0 }
    }

    const validQuestIds = getValidQuestIds(category)
    const categoryQuests = challengeData.quests.filter(q => validQuestIds.includes(q.id))

    const totalQuests = categoryQuests.length
    if (totalQuests === 0) {
      return { totalQuests: 0, completedQuests: 0, isComplete: false, bonusPoints: 0, percentage: 0 }
    }

    const completedQuestIds = new Set(completions.map(c => c.quest_id))
    const completedQuests = categoryQuests.filter(q => completedQuestIds.has(q.id)).length

    const totalPossiblePoints = categoryQuests.reduce((sum, q) => sum + (q.points || 0), 0)
    const bonusPoints = Math.round(totalPossiblePoints * (BONUS_PERCENTAGE / 100))

    const isComplete = completedQuests >= totalQuests
    const percentage = Math.round((completedQuests / totalQuests) * 100)

    const bonusKey = `${category.toLowerCase().replace(/\s+/g, '_')}_bonus_awarded`
    const bonusAwarded = progress?.[bonusKey] || false

    return {
      totalQuests,
      completedQuests,
      isComplete,
      bonusPoints,
      bonusAwarded,
      percentage,
      bonusPercentage: BONUS_PERCENTAGE
    }
  }

  const awardTabCompletionBonus = async (category, bonusPoints) => {
    if (!progress || !user) return

    const bonusKey = `${category.toLowerCase().replace(/\s+/g, '_')}_bonus_awarded`

    if (progress[bonusKey]) return

    try {
      const newTotalPoints = (progress.total_points || 0) + bonusPoints

      const updateData = {
        total_points: newTotalPoints,
        [bonusKey]: true,
        last_active_date: new Date().toISOString()
      }

      const { data: updatedProgress, error } = await supabase
        .from('challenge_progress')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('challenge_instance_id', progress.challenge_instance_id)
        .eq('status', 'active')
        .select()
        .single()

      if (error) {
        console.error('Error awarding tab bonus:', error)
        return
      }

      setProgress(updatedProgress)
      alert(`Tab Complete! +${bonusPoints} bonus points (${BONUS_PERCENTAGE}% boost)\n\nYou've completed all quests in ${category}!`)
    } catch (error) {
      console.error('Error in awardTabCompletionBonus:', error)
    }
  }

  // ============================================
  // Streak & Day Helpers
  // ============================================

  const getDailyStreak = (questId) => {
    // Use current week (Monday to Sunday) for auto-rolling challenge
    const weekStart = new Date(getWeekStart() + 'T00:00:00')
    weekStart.setHours(0, 0, 0, 0)

    const questCompletions = completions.filter(c => c.quest_id === questId)
    const streak = [false, false, false, false, false, false, false]

    questCompletions.forEach(completion => {
      const completionDate = new Date(completion.completed_at)
      completionDate.setHours(0, 0, 0, 0)

      const daysSinceWeekStart = Math.floor((completionDate - weekStart) / (1000 * 60 * 60 * 24))

      // Only show completions from current week (days 0-6)
      if (daysSinceWeekStart >= 0 && daysSinceWeekStart < 7) {
        streak[daysSinceWeekStart] = true
      }
    })

    return streak
  }

  const getDayLabels = () => {
    // Week always starts Monday for auto-rolling challenge
    // Day 0 = Monday, Day 6 = Sunday
    return ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  }

  const getDailyReleaseChallenge = () => {
    if (!dailyReleaseChallenges || !progress) return null

    const currentDay = progress.current_day
    if (currentDay === 0 || currentDay > 7) return null

    return dailyReleaseChallenges[currentDay.toString()]
  }

  const getArtifactEmoji = (category) => {
    const emojiMap = {
      'Recognise': '🗺️',
      'Release': '⚓',
      'Rewire': '🧢',
      'Reconnect': '⛵'
    }
    return emojiMap[category] || '✨'
  }

  // Calculate consecutive days with quest completions (for streak flame)
  const getConsecutiveStreakDays = () => {
    if (!completions || completions.length === 0) return 0

    // Get unique dates of completions (normalized to date only)
    const completionDates = new Set()
    completions.forEach(c => {
      const date = new Date(c.completed_at)
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      completionDates.add(dateKey)
    })

    // Count consecutive days from today backwards
    const today = new Date()
    let streak = 0
    let checkDate = new Date(today)

    for (let i = 0; i < 30; i++) {
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
      if (completionDates.has(dateKey)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (i === 0) {
        // If no completions today, check if yesterday started the streak
        checkDate.setDate(checkDate.getDate() - 1)
        const yesterdayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
        if (completionDates.has(yesterdayKey)) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      } else {
        break
      }
    }

    return streak
  }

  // ============================================
  // useEffect Hooks
  // ============================================

  // Load challenge data on mount
  useEffect(() => {
    loadChallengeData()
  }, [])

  // Load user data when user is available
  useEffect(() => {
    if (user) {
      loadUserProgress()
      loadLeaderboard()
      loadUserData()
      checkNervousSystemComplete()
      checkHealingCompassComplete()
      checkFlowFinderComplete()
      loadStageProgress()
      loadWeeklyPlan()
      loadValidationResponseCounts()
    }
  }, [user])

  // Check explainer visibility
  useEffect(() => {
    if (progress && !showOnboarding) {
      const hasSeenExplainer = localStorage.getItem('hasSeenPortalExplainer')
      if (!hasSeenExplainer) {
        setShowExplainer(true)
      }
    }
  }, [progress, showOnboarding])

  // Initialize stage progress when userData is available
  useEffect(() => {
    const initializeStageIfNeeded = async () => {
      if (!user?.id || !userData?.persona || stageProgress) return

      try {
        const result = await initializeUserStageProgress(user.id, userData.persona)
        if (result.success) {
          setStageProgress(result.data)
        }
      } catch (error) {
        console.error('Error initializing stage progress:', error)
      }
    }

    initializeStageIfNeeded()
  }, [user?.id, userData?.persona, stageProgress])

  // Update leaderboard when view changes
  useEffect(() => {
    if (user && progress) {
      loadLeaderboard()
      loadGroupInfo()
    }
  }, [leaderboardView, progress])

  // Handle click outside settings menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false)
      }
    }

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettingsMenu])

  // Real-time leaderboard subscription
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('challenge_progress_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'challenge_progress' },
        (payload) => {
          console.log('Leaderboard update:', payload)
          loadLeaderboard()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, leaderboardView])

  // ============================================
  // Compute current user's weekly points
  // ============================================
  const currentWeeklyPoints = (() => {
    if (!completions || completions.length === 0) return 0
    const weekStart = new Date(getWeekStart() + 'T00:00:00')
    return completions
      .filter(c => new Date(c.completed_at) >= weekStart)
      .reduce((sum, c) => sum + (c.points_earned || 0), 0)
  })()

  // ============================================
  // Return all state and functions
  // ============================================

  return {
    // Auth & Navigation
    user,
    navigate,

    // UI State
    loading,
    activeCategory,
    setActiveCategory,
    activeRTypeFilter,
    setActiveRTypeFilter,
    activeFrequencyFilter,
    setActiveFrequencyFilter,
    showOnboarding,
    setShowOnboarding,
    showGroupSelection,
    setShowGroupSelection,
    showProjectSelector,
    setShowProjectSelector,
    showSettingsMenu,
    setShowSettingsMenu,
    showExplainer,
    setShowExplainer,
    showLockedTooltip,
    setShowLockedTooltip,
    expandedLearnMore,
    settingsMenuRef,

    // Data
    challengeData,
    dailyReleaseChallenges,
    progress,
    setProgress,
    completions,
    setCompletions,
    questInputs,
    setQuestInputs,
    userData,
    stageProgress,

    // Group/Leaderboard
    groupMode,
    groupCode,
    groupCodeInput,
    setGroupCodeInput,
    groupData,
    leaderboard,
    leaderboardView,
    setLeaderboardView,
    userRank,
    currentWeeklyPoints,

    // Prerequisites
    nervousSystemComplete,
    safetyContracts,
    healingCompassComplete,
    pastParallelStory,
    flowFinderComplete,

    // Validation Response Counts (for response_counter quests)
    validationResponseCounts,
    loadValidationResponseCounts,

    // Project-Based
    selectedProject,
    setSelectedProject,
    activeStageTab,
    setActiveStageTab,
    projectStage,
    setProjectStage,

    // Sub-Tabs (Business and Healing)
    businessSubTab,
    setBusinessSubTab,
    healingSubTab,
    setHealingSubTab,

    // User Archetypes (for personalized voice quests)
    userArchetypes,

    // Weekly Planning
    weeklyPlan,
    setWeeklyPlan,
    showWeeklyPlanning,
    setShowWeeklyPlanning,
    isSunday,
    getWeekLabel,
    loadWeeklyPlan,
    completeWeeklyGroan,
    handleWeeklyPlanComplete,
    isQuestPlanned,
    getPlannedDay,

    // Constants
    categories,
    BONUS_PERCENTAGE,

    // Data Loading
    loadStageProgress,
    loadLeaderboard,

    // Challenge/Group Management
    showGroupSelectionModal,
    handlePlaySolo,
    handleCreateGroup,
    handleJoinGroup,
    handleProjectSelected,
    startChallengeWithProject,
    startChallenge,
    handleRestartChallenge,
    handleCloseExplainer,
    handleOpenExplainer,

    // Quest Helpers
    isQuestCompletedToday,
    isQuestEverCompleted,
    isQuestLocked,
    getRequiredQuestName,
    toggleLearnMore,

    // Points & Progress
    getValidQuestIds,
    getCategoryPoints,
    getPointsToday,
    getCompletedStages,
    checkArtifactUnlock,
    getArtifactProgress,
    getTabCompletionStatus,
    awardTabCompletionBonus,

    // Streak & Day
    getDailyStreak,
    getDayLabels,
    getDailyReleaseChallenge,
    getArtifactEmoji,
    getConsecutiveStreakDays,

    // Quest Completion Handlers (from lib)
    handleConversationLogCompletion,
    handleMilestoneCompletion,
    handleFlowCompassCompletion,
    handleGroanReflectionCompletion,
    handleValidationAnalysisCompletion,
    handleStreakUpdate,
    checkAndGraduateProject
  }
}
