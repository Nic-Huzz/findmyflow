/**
 * useChallengeData - Custom hook for Challenge component state and data management
 *
 * Extracted from Challenge.jsx to improve maintainability.
 * Handles all state, data loading, and challenge/group management.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
import { getScoringCategory, syncScoreToLeaderboard } from '../lib/scoringCategories'
import { logError, showErrorWithSupport } from '../lib/errorSupport'
import { cacheBustUrl } from '../lib/fetchJson'
import { getWeekStartLocal } from '../lib/dateUtils'
import { getEssenceDisplayName } from '../lib/essencePreferences'

// Default community group — all new challenges auto-join this group
const DEFAULT_GROUP_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

// Map URL tab params to internal category names
const TAB_TO_CATEGORY = {
  'play-list': 'Wahoo',
  'playlist': 'Wahoo',
  'wahoo': 'Wahoo',
  'priority': 'Level',
  'level': 'Level',
  'quests': 'Level',         // backward compat
  'business': 'Level',       // backward compat — Business now at /create route
  'create': 'Level',         // backward compat — Create now at /create route
  'groans': 'Wahoo',         // backward compat — Groans absorbed into Wahoo
  'healing': 'Healing',
  'tracker': 'Wahoo',        // backward compat — Tracker tab removed
  'tune': 'Tune',
  'bonus': 'Tune',           // backward compat — Bonus archived, redirects to Tune
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
    return TAB_TO_CATEGORY[tabParam] || 'Level'
  }

  // UI State
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(getInitialCategory)
  const [activeRTypeFilter, setActiveRTypeFilter] = useState('All')
  const [activeFrequencyFilter, setActiveFrequencyFilter] = useState('daily')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingScreen, setOnboardingScreen] = useState('install-app') // 'install-app' | 'enable-notifications'
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

  // New Scoring System State (weekly + lifetime)
  const [weeklyScores, setWeeklyScores] = useState(null) // { business_score, healing_score, courage_score }
  const [lifetimeScores, setLifetimeScores] = useState(null) // { lifetime_business_score, etc. }

  // Prerequisite State
  const [nervousSystemComplete, setNervousSystemComplete] = useState(false)
  const [safetyContracts, setSafetyContracts] = useState([])
  const [healingCompassComplete, setHealingCompassComplete] = useState(false)
  const [pastParallelStory, setPastParallelStory] = useState(null)
  const [healingCompassId, setHealingCompassId] = useState(null)
  const [flowFinderComplete, setFlowFinderComplete] = useState(false)

  // Project-Based State
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeStageTab, setActiveStageTab] = useState(1)
  const [projectStage, setProjectStage] = useState(1)

  // Sub-Tab State (for Healing and Bonus tabs)
  const [healingSubTab, setHealingSubTab] = useState('daily') // 'daily' | 'weekly'
  // bonusSubTab archived — Bonus tab replaced by Tune
  const [playlistSubTab, setPlaylistSubTab] = useState('playlist') // 'flow-finder' | 'playlist' | 'play-profile'

  // User Archetypes (for personalized voice quests)
  const [userArchetypes, setUserArchetypes] = useState({ essence: null, protective: null })

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
  const categories = ['Level', 'Tune', 'Wahoo', 'Healing']
  const lockedCategories = new Set([]) // All tabs unlocked
  const BONUS_PERCENTAGE = 5 // kept for legacy tab completion bonus logic

  // ============================================
  // Data Loading Functions
  // ============================================

  const loadChallengeData = async () => {
    try {
      const [response, releaseChallengesResponse] = await Promise.all([
        fetch(cacheBustUrl('/challengeQuestsUpdate.json')),
        fetch(cacheBustUrl('/dailyReleaseChallenges.json'))
      ])
      const [data, releaseChallengesData] = await Promise.all([
        response.json(),
        releaseChallengesResponse.json()
      ])
      setData(data)
      setDailyReleaseChallenges(releaseChallengesData)
    } catch (error) {
      console.error('Error loading challenge data:', error)
    }
  }

  const loadUserProgress = async () => {
    try {

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
        // Run both queries in parallel - they're independent
        const [userLevelResult, anyPreviousResult] = await Promise.all([
          // Load user-level completions so Flow Finder quests show correct completion state
          supabase
            .from('quest_completions')
            .select('*')
            .eq('user_id', user.id)
            .is('challenge_instance_id', null),
          // Check if user has any previous challenges (returning user)
          supabase
            .from('challenge_progress')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()
        ])

        const { data: userLevelCompletions, error: userLevelError } = userLevelResult
        if (userLevelError) {
          console.error('Error loading user-level completions:', userLevelError)
        } else {
          setCompletions(userLevelCompletions || [])
        }

        const { data: anyPrevious } = anyPreviousResult

        // Detect if running as installed PWA vs browser
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                             window.navigator.standalone === true
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        const isAndroid = /Android/i.test(navigator.userAgent)
        const isMobile = isIOS || isAndroid

        if (anyPrevious) {
          // Returning user — go straight to challenge tabs (Level, Tune, Wahoo work without a project)
          // They can pick a project from settings if needed
          if (isMobile && !isStandalone) {
            setOnboardingScreen('install-app')
            setShowOnboarding(true)
          }
          // Otherwise just load the page with no project selected
        } else {
          // First-time user - show appropriate onboarding screen
          if (isMobile && !isStandalone) {
            // Mobile browser: show install-app screen
            setOnboardingScreen('install-app')
          } else {
            // PWA or desktop: show notifications screen (skip install)
            setOnboardingScreen('enable-notifications')
          }
          setShowOnboarding(true)
        }
        return
      }

      setProgress(progressData)

      // Run project fetch + streak check + instance lookup in parallel (all independent)
      const [projectResult, streakResult, instancesResult] = await Promise.all([
        progressData.project_id
          ? supabase.from('user_projects').select('*').eq('id', progressData.project_id).single()
          : Promise.resolve({ data: null, error: null }),
        checkStreakBreak(user.id, progressData.challenge_instance_id),
        progressData.project_id
          ? supabase.from('challenge_progress').select('challenge_instance_id').eq('user_id', user.id).eq('project_id', progressData.project_id)
          : Promise.resolve({ data: null })
      ])

      // All challenge instance IDs for this project (so completions persist across restarts)
      const projectInstanceIds = (instancesResult.data || []).map(p => p.challenge_instance_id)
      if (projectInstanceIds.length === 0) {
        projectInstanceIds.push(progressData.challenge_instance_id)
      }

      // Apply project data
      const { data: projectData, error: projectError } = projectResult
      if (!projectError && projectData) {
        setSelectedProject(projectData)
        try { localStorage.setItem('fmf_selected_project_id', projectData.id) } catch {}
        setProjectStage(projectData.current_stage ?? 1)
        setActiveStageTab(projectData.current_stage ?? 1)
      }

      // Apply streak result
      if (streakResult.streak_broken) {
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

      // Load both completion sets in parallel
      const [challengeCompletionsResult, userLevelCompletionsResult] = await Promise.all([
        supabase
          .from('quest_completions')
          .select('*')
          .eq('user_id', user.id)
          .in('challenge_instance_id', projectInstanceIds),
        supabase
          .from('quest_completions')
          .select('*')
          .eq('user_id', user.id)
          .is('challenge_instance_id', null)
          .or(`project_id.is.null,project_id.eq.${projectData?.id || '00000000-0000-0000-0000-000000000000'}`)
      ])

      const { data: challengeCompletions, error: completionsError } = challengeCompletionsResult
      if (completionsError) {
        console.error('Error loading challenge completions:', completionsError)
      }

      const { data: userLevelCompletions, error: userLevelError } = userLevelCompletionsResult
      if (userLevelError) {
        console.error('Error loading user-level completions:', userLevelError)
      }

      // Merge completions: user-level + challenge-specific
      setCompletions([
        ...(userLevelCompletions || []),
        ...(challengeCompletions || [])
      ])

    } catch (error) {
      console.error('Error in loadUserProgress:', error)
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
      .eq('current_day', currentProgress.current_day)
      .select()
      .single()

    if (error) {
      // PGRST116 = no rows matched — another tab already advanced the day
      if (error.code === 'PGRST116') return
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
          essence: getEssenceDisplayName(data[0]),
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

  const getWeekStart = () => getWeekStartLocal()

  const getWeekLabel = () => {
    const weekStart = getWeekStart()
    const monday = new Date(weekStart + 'T00:00:00')
    return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Load user's scores from new scoring tables
  const loadUserScores = async () => {
    if (!user?.id) return

    try {
      const weekStart = getWeekStart()

      // Load weekly + lifetime scores in parallel
      const [weeklyResult, lifetimeResult] = await Promise.all([
        supabase
          .from('challenge_weekly_scores')
          .select('business_score, healing_score, courage_score')
          .eq('user_id', user.id)
          .eq('week_start_date', weekStart)
          .is('project_id', null)
          .maybeSingle(),
        supabase
          .from('user_lifetime_scores')
          .select('lifetime_business_score, lifetime_healing_score, lifetime_courage_score, lifetime_total_score')
          .eq('user_id', user.id)
          .is('project_id', null)
          .maybeSingle()
      ])

      const { data: weekly, error: weeklyError } = weeklyResult
      if (weeklyError) {
        console.error('Error loading weekly scores:', weeklyError)
      } else {
        setWeeklyScores(weekly || { business_score: 0, healing_score: 0, courage_score: 0 })
      }

      const { data: lifetime, error: lifetimeError } = lifetimeResult
      if (lifetimeError) {
        console.error('Error loading lifetime scores:', lifetimeError)
      } else {
        setLifetimeScores(lifetime || {
          lifetime_business_score: 0,
          lifetime_healing_score: 0,
          lifetime_courage_score: 0,
          lifetime_total_score: 0
        })
      }
    } catch (error) {
      console.error('Error in loadUserScores:', error)
    }
  }


  // Stubs — old weekly plan helpers (still referenced by QuestCard props downstream)
  const isQuestPlanned = () => false
  const getPlannedDay = () => null

  const loadLeaderboard = async () => {
    try {
      if (!user) return

      const weekStart = getWeekStart()

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

      const userIds = challengeData.map(entry => entry.user_id)
      let leaderboardData = []

      if (leaderboardView === 'weekly') {
        // Use new challenge_weekly_scores table for weekly view
        const { data: weeklyScoresData, error: weeklyError } = await supabase
          .from('challenge_weekly_scores')
          .select('user_id, business_score, healing_score, courage_score')
          .in('user_id', userIds)
          .eq('week_start_date', weekStart)
          .is('project_id', null) // User-level scores

        if (weeklyError) {
          console.error('Error loading weekly scores:', weeklyError)
          return
        }

        // Build map of user_id to total weekly points
        const weeklyPointsMap = {}
        if (weeklyScoresData) {
          weeklyScoresData.forEach(score => {
            weeklyPointsMap[score.user_id] = (score.business_score || 0) + (score.healing_score || 0) + (score.courage_score || 0)
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
        // Use new user_lifetime_scores table for all-time view
        const { data: lifetimeData, error: lifetimeError } = await supabase
          .from('user_lifetime_scores')
          .select('user_id, lifetime_total_score')
          .in('user_id', userIds)
          .is('project_id', null) // User-level scores

        if (lifetimeError) {
          console.error('Error loading lifetime scores:', lifetimeError)
          return
        }

        // Build map of user_id to lifetime total
        const lifetimePointsMap = {}
        if (lifetimeData) {
          lifetimeData.forEach(score => {
            lifetimePointsMap[score.user_id] = score.lifetime_total_score || 0
          })
        }

        // Build leaderboard with lifetime points
        leaderboardData = challengeData.map(entry => ({
          ...entry,
          weeklyPoints: 0,
          allTimePoints: lifetimePointsMap[entry.user_id] || 0
        }))

        // Sort by all-time points
        leaderboardData.sort((a, b) => b.allTimePoints - a.allTimePoints)
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
          totalPoints: leaderboardView === 'weekly' ? entry.weeklyPoints : entry.allTimePoints,
          weeklyPoints: entry.weeklyPoints || 0,
          allTimePoints: entry.allTimePoints || 0,
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
        .select('id, past_parallel_story, flow_version, primary_need, splinter_location')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        const row = data[0]
        // v1: has past_parallel_story | v2: has flow_version=2 + primary_need + splinter_location
        const v1Complete = !!row.past_parallel_story
        const v2Complete = row.flow_version === 2 && !!row.primary_need && !!row.splinter_location
        if (v1Complete || v2Complete) {
          setHealingCompassComplete(true)
          setPastParallelStory(row.past_parallel_story)
          setHealingCompassId(row.id)
        } else {
          setHealingCompassComplete(false)
          setPastParallelStory(null)
          setHealingCompassId(null)
        }
      } else {
        setHealingCompassComplete(false)
        setPastParallelStory(null)
        setHealingCompassId(null)
      }
    } catch (error) {
      console.error('Error checking healing compass completion:', error)
      setHealingCompassComplete(false)
      setPastParallelStory(null)
      setHealingCompassId(null)
    }
  }

  // Check Flow Finder completion (user-level, not project-level)
  // Considers both traditional Flow Finder (4 individual flows) and Mind Space as valid paths
  const checkFlowFinderComplete = async () => {
    if (!user?.id) return

    try {
      const flowFinderFlows = ['nikigai_skills', 'nikigai_problems', 'nikigai_persona', 'nikigai_integration']

      const { data, error } = await supabase
        .from('flow_sessions')
        .select('flow_type, status')
        .eq('user_id', user.id)
        .in('flow_type', [...flowFinderFlows, 'mind_space'])

      if (!error && data) {
        const completedFlows = [...new Set(data.map(d => d.flow_type))]
        // Complete if all 4 traditional flows done OR Mind Space completed
        const traditionalComplete = flowFinderFlows.every(f => completedFlows.includes(f))
        const mindSpaceComplete = data.some(d => d.flow_type === 'mind_space' && d.status === 'completed')
        setFlowFinderComplete(traditionalComplete || mindSpaceComplete)
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
      // Get validation flows created by this user, filtered by selected project
      let flowsQuery = supabase
        .from('validation_flows')
        .select('id, stage')
        .eq('creator_user_id', user.id)

      if (selectedProject?.id) {
        flowsQuery = flowsQuery.eq('project_id', selectedProject.id)
      }

      const { data: flows, error: flowsError } = await flowsQuery

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
    setShowOnboarding(false)
    setShowGroupSelection(false)
    // Skip project selector — Level, Tune, Wahoo, Healing tabs all work without a project.
    // User can create a project later from the Level tab onboarding steps.
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

      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert([{
          group_id: groupData.id,
          user_id: user.id
        }])

      if (participantError) {
        console.error('Error adding participant to group:', participantError)
        // Duplicate entry means already in group - that's OK
        if (participantError.code === '23505') {
          console.log('User already in group - continuing')
        } else {
          // Log error and offer support
          const { offerSupport } = await logError({
            error: participantError,
            component: 'ChallengeGroup',
            action: 'create_group_participant',
            userId: user?.id,
            userEmail: user?.email,
            metadata: { groupCode: newCode }
          })

          const choice = window.confirm(
            'Group created, but there was an issue adding you as a member.\n\n' +
            `Your group code is: ${newCode}\n\n` +
            'Click OK to continue anyway (you can rejoin later with the code)\n' +
            'Click Cancel to get help via WhatsApp'
          )
          if (!choice) {
            offerSupport()
            throw participantError
          }
        }
      }

      alert(`Group created successfully!\n\nYour group code is: ${newCode}\n\nShare this code with friends to invite them to your challenge group.`)

      setShowGroupSelection(false)
      setShowProjectSelector(true)
    } catch (error) {
      console.error('Error creating group:', error)

      // Log and offer support for general errors
      const { offerSupport } = await logError({
        error,
        component: 'ChallengeGroup',
        action: 'create_group',
        userId: user?.id,
        userEmail: user?.email
      })

      const getHelp = window.confirm(
        'Error creating group.\n\n' +
        'Click OK to try again, or Cancel to get help via WhatsApp.'
      )
      if (!getHelp) {
        offerSupport()
      }
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

      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert([{
          group_id: groupData.id,
          user_id: user.id
        }])

      if (participantError) {
        console.error('Error adding participant to group:', participantError)
        // Duplicate entry means already in group - that's fine!
        if (participantError.code === '23505') {
          alert('You\'re already a member of this group! Continuing to challenge setup...')
        } else {
          // Log error and offer support
          const { offerSupport } = await logError({
            error: participantError,
            component: 'ChallengeGroup',
            action: 'join_group_participant',
            userId: user?.id,
            userEmail: user?.email,
            metadata: { groupCode: groupData.code }
          })

          const choice = window.confirm(
            'Unable to join the group right now.\n\n' +
            'Options:\n' +
            '• OK = Start a solo challenge instead\n' +
            '• Cancel = Get help via WhatsApp\n\n' +
            'You can always join a group later.'
          )
          if (choice) {
            setGroupData(null)
            setGroupCode('')
            setGroupMode(null)
          } else {
            offerSupport()
            throw participantError
          }
        }
      }

      setShowGroupSelection(false)
      setShowProjectSelector(true)
    } catch (error) {
      console.error('Error joining group:', error)

      const { offerSupport } = await logError({
        error,
        component: 'ChallengeGroup',
        action: 'join_group',
        userId: user?.id,
        userEmail: user?.email
      })

      const retry = window.confirm(
        'Error joining group.\n\n' +
        'Click OK to try again, or Cancel to get help via WhatsApp.'
      )
      if (!retry) {
        offerSupport()
      }
    }
  }

  const handleProjectSelected = async (project) => {
    setSelectedProject(project)
    // Persist for useProjectId() fallback in flows (e.g. Offer Builder)
    try { localStorage.setItem('fmf_selected_project_id', project.id) } catch {}
    setProjectStage(project.current_stage ?? 1)
    setActiveStageTab(project.current_stage ?? 1)
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
      const effectiveGroupId = groupId || DEFAULT_GROUP_ID

      const insertData = {
        user_id: user.id,
        session_id: sessionId,
        challenge_instance_id: challengeInstanceId,
        current_day: 0,
        status: 'active',
        challenge_start_date: new Date().toISOString(),
        last_active_date: new Date().toISOString(),
        persona: stageProgress?.persona || 'vibe_seeker',
        current_stage: project.current_stage ?? 1,
        project_id: project.id,
        group_id: effectiveGroupId
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

      // Ensure user is a participant in the group
      await supabase
        .from('challenge_participants')
        .upsert({ group_id: effectiveGroupId, user_id: user.id }, { onConflict: 'group_id,user_id' })

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
      const effectiveGroupId = groupId || DEFAULT_GROUP_ID

      const insertData = {
        user_id: user.id,
        session_id: sessionId,
        challenge_instance_id: challengeInstanceId,
        current_day: 0,
        status: 'active',
        challenge_start_date: new Date().toISOString(),
        last_active_date: new Date().toISOString(),
        persona: userPersona,
        current_stage: userStage,
        group_id: effectiveGroupId
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

      // Ensure user is a participant in the group
      await supabase
        .from('challenge_participants')
        .upsert({ group_id: effectiveGroupId, user_id: user.id }, { onConflict: 'group_id,user_id' })

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

  // Filter completions for a quest
  // Note: project scoping is already handled at the query level — challenge
  // completions are loaded by challenge_instance_id (which is per-project),
  // so no additional project_id filter is needed here.
  const getQuestCompletions = (questId) => {
    return completions.filter(c => c.quest_id === questId || c.quest_id.startsWith(questId + '_'))
  }

  const isQuestCompletedToday = (questId, quest) => {
    // Use local date strings for consistent timezone handling
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
    const weekStartStr = getWeekStart() // Already returns YYYY-MM-DD

    const filtered = getQuestCompletions(questId)

    // Daily quests: check if completed TODAY only (local timezone)
    if (quest.frequency === 'daily') {
      return filtered.some(c => {
        const completedDateStr = new Date(c.completed_at).toLocaleDateString('en-CA')
        return completedDateStr === todayStr
      })
    } else if (quest.frequency === 'weekly') {
      // Weekly quests: check if completed THIS WEEK (since Monday)
      return filtered.some(c => {
        const completedDateStr = new Date(c.completed_at).toLocaleDateString('en-CA')
        return completedDateStr >= weekStartStr
      })
    } else {
      if (quest.maxCompletions) {
        return filtered.length >= quest.maxCompletions
      }

      if (quest.maxPerDay) {
        const todayCompletions = filtered.filter(c => {
          const completedDateStr = new Date(c.completed_at).toLocaleDateString('en-CA')
          return completedDateStr === todayStr
        })
        return todayCompletions.length >= quest.maxPerDay
      }

      return filtered.length > 0
    }
  }

  const isQuestEverCompleted = (questId) => {
    return getQuestCompletions(questId).length > 0
  }

  // Check if a parent trial has a pending review/reflection
  const hasPendingTrial = (parentQuestId, pendingPhase) => {
    const filtered = getQuestCompletions(parentQuestId)
    return filtered.some(c => {
      try {
        const data = JSON.parse(c.reflection_text)
        return data.phase === pendingPhase
      } catch {
        return false
      }
    })
  }

  const isQuestLocked = (quest) => {
    // Dynamic lock: review quests need a pending parent trial
    if (quest.id === 'lets_play_review') {
      return !hasPendingTrial('lets_play', 'pending_review')
    }
    if (quest.id === 'self_test_review') {
      return !hasPendingTrial('self_test', 'pending_reflection')
    }

    // Dynamic lock: analysis quest unlocks when 3+ total validation responses
    if (quest.id === 'milestone_validation_responses_analysis') {
      const totalResponses = Object.values(validationResponseCounts).reduce((sum, n) => sum + n, 0)
      return totalResponses < 3
    }

    if (!quest.requires_quest) return false
    return !isQuestEverCompleted(quest.requires_quest)
  }

  const getRequiredQuestName = (questId, forQuestId) => {
    // Dynamic lock names for review quests
    if (forQuestId === 'lets_play_review') return 'Let\'s Play Peer-Trial'
    if (forQuestId === 'self_test_review') return 'Wahoo Self-Trial'

    // Dynamic lock message for analysis quest
    if (forQuestId === 'milestone_validation_responses_analysis') {
      const totalResponses = Object.values(validationResponseCounts).reduce((sum, n) => sum + n, 0)
      return `${totalResponses}/3 validation responses collected`
    }

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

  // Some quest completions use dynamic quest_ids (e.g. play_list_challenge_<uuid>)
  // This matches both exact IDs and prefixed variants
  const matchesValidQuest = (completionQuestId, validIds) => {
    if (validIds.includes(completionQuestId)) return true
    return validIds.some(id => completionQuestId.startsWith(id + '_'))
  }

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
      if (c.quest_category !== category || !matchesValidQuest(c.quest_id, validQuestIds)) {
        return false
      }
      // Only count completions from current week
      const completionDate = new Date(c.completed_at)
      return completionDate >= weekStart
    })

    const total = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

    if (category === 'Groans' || category === 'Healing') {
      const getQuestFrequency = (questId) => {
        const quest = challengeData?.quests?.find(q => q.id === questId || questId.startsWith(q.id + '_'))
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
        matchesValidQuest(c.quest_id, validQuestIds)
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

  const getArtifactProgress = (category, stageFilter = null) => {
    if (!challengeData) return null

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return null

    const unlocked = progress?.[`${artifact.id}_unlocked`] || false
    let validQuestIds = getValidQuestIds(category)

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
        // freqType is 'Daily', 'Weekly', or 'Deep Dive'; quest.frequency is 'daily', 'weekly', or 'deepdive'
        // Normalize: strip spaces so "Deep Dive" → "deepdive" matches quest frequency "deepdive"
        const normalizedFreqType = freqType.toLowerCase().replace(/\s+/g, '')
        const isOneTime = normalizedFreqType === 'deepdive' || normalizedFreqType === 'explainer'

        const freqCompletions = completions.filter(c => {
          if (c.quest_category !== category || !matchesValidQuest(c.quest_id, validQuestIds)) return false
          const baseQuestId = Object.keys(questFrequencyMap).find(id => c.quest_id === id || c.quest_id.startsWith(id + '_'))
          const questFreq = (baseQuestId ? questFrequencyMap[baseQuestId] : null)?.toLowerCase().replace(/\s+/g, '')
          if (questFreq !== normalizedFreqType) return false
          // Deep dive and explainer quests are one-time — count regardless of week
          if (isOneTime) return true
          // Daily/Weekly: only count completions from current week
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

    // Filter by current week
    const categoryCompletions = completions.filter(c => {
      if (c.quest_category !== category || !matchesValidQuest(c.quest_id, validQuestIds)) return false
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

  // Option A fix: Accept optional fresh data to avoid React state timing issues
  // When called without overrides, uses React state (for UI display)
  // When called with overrides, uses fresh DB data (for immediate checks after mutations)
  const getTabCompletionStatus = (category, overrideCompletions = null, overrideProgress = null) => {
    const effectiveCompletions = overrideCompletions || completions
    const effectiveProgress = overrideProgress || progress

    if (!challengeData || !effectiveCompletions) {
      return { totalQuests: 0, completedQuests: 0, isComplete: false, bonusPoints: 0, percentage: 0 }
    }

    const validQuestIds = getValidQuestIds(category)
    const categoryQuests = challengeData.quests.filter(q => validQuestIds.includes(q.id))

    const totalQuests = categoryQuests.length
    if (totalQuests === 0) {
      return { totalQuests: 0, completedQuests: 0, isComplete: false, bonusPoints: 0, percentage: 0 }
    }

    const completedQuests = categoryQuests.filter(q =>
      effectiveCompletions.some(c => c.quest_id === q.id || c.quest_id.startsWith(q.id + '_'))
    ).length

    const totalPossiblePoints = categoryQuests.reduce((sum, q) => sum + (q.points || 0), 0)
    const bonusPoints = Math.round(totalPossiblePoints * (BONUS_PERCENTAGE / 100))

    const isComplete = completedQuests >= totalQuests
    const percentage = Math.round((completedQuests / totalQuests) * 100)

    const bonusKey = `${category.toLowerCase().replace(/\s+/g, '_')}_bonus_awarded`
    const bonusAwarded = effectiveProgress?.[bonusKey] || false

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

  // Accept optional currentProgress to avoid stale state issues when called
  // immediately after setProgress (React state updates are async)
  const awardTabCompletionBonus = async (category, bonusPoints, currentProgress = null) => {
    const effectiveProgress = currentProgress || progress
    if (!effectiveProgress || !user) return

    const bonusKey = `${category.toLowerCase().replace(/\s+/g, '_')}_bonus_awarded`

    if (effectiveProgress[bonusKey]) return

    try {
      const newTotalPoints = (effectiveProgress.total_points || 0) + bonusPoints

      const updateData = {
        total_points: newTotalPoints,
        [bonusKey]: true,
        last_active_date: new Date().toISOString()
      }

      const { data: updatedProgress, error } = await supabase
        .from('challenge_progress')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('challenge_instance_id', effectiveProgress.challenge_instance_id)
        .eq('status', 'active')
        .select()
        .single()

      if (error) {
        console.error('Error awarding tab bonus:', error)
        return
      }

      // Sync to leaderboard (non-blocking)
      syncScoreToLeaderboard(supabase, {
        userId: user.id,
        questCategory: category,
        points: bonusPoints,
        projectId: null,
        source: 'tab_bonus'
      })

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
      'Reconnect': '⛵',
      'Rest': '😴'
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
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      completionDates.add(dateKey)
    })

    // Count consecutive days from today backwards (forgiving: allow 1 day gap)
    const today = new Date()
    let streak = 0
    let missesUsed = 0
    const MAX_MISSES = 1 // forgiving streak: 1 day grace period
    let checkDate = new Date(today)

    for (let i = 0; i < 30; i++) {
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`
      if (completionDates.has(dateKey)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (i === 0) {
        // If no completions today, skip to yesterday (today doesn't count as a miss yet)
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (missesUsed < MAX_MISSES) {
        // Forgiving: skip this gap day, keep checking
        missesUsed++
        checkDate.setDate(checkDate.getDate() - 1)
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
  // All loads run in parallel via Promise.all for fastest possible load
  // Loading stays true until ALL promises resolve (not just loadUserProgress)
  useEffect(() => {
    if (user) {
      setLoading(true)
      Promise.all([
        loadUserProgress(),
        loadLeaderboard(),
        loadUserData(),
        loadUserScores(),
        checkNervousSystemComplete(),
        checkHealingCompassComplete(),
        checkFlowFinderComplete(),
        loadStageProgress(),
        // Note: loadValidationResponseCounts is triggered by selectedProject useEffect below
      ]).finally(() => setLoading(false))
    }
  }, [user])

  // Reload validation response counts when project changes
  useEffect(() => {
    if (user && selectedProject) {
      loadValidationResponseCounts()
    }
  }, [selectedProject?.id])

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

  // Update leaderboard when view toggle changes (not on every progress update)
  useEffect(() => {
    if (user && progress) {
      loadLeaderboard()
      loadGroupInfo()
    }
  }, [leaderboardView])

  // Refresh data when page becomes visible (returning from a flow)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Reload completions and progress to get latest points
        loadUserProgress()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

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

  // Real-time leaderboard subscription - debounce to avoid rapid reloads
  useEffect(() => {
    if (!user) return

    let debounceTimer = null
    const subscription = supabase
      .channel('challenge_progress_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'challenge_progress' },
        () => {
          // Debounce: only reload after 2s of no new events
          clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => loadLeaderboard(), 2000)
        }
      )
      .subscribe()

    return () => {
      clearTimeout(debounceTimer)
      supabase.removeChannel(subscription)
    }
  }, [user, leaderboardView])

  // ============================================
  // Compute current user's weekly points
  // Always calculate from completions since that state is reliably updated
  // after each quest completion. The weeklyScores from RPC may have sync delays.
  // ============================================
  const currentWeeklyPoints = useMemo(() => {
    if (!completions || completions.length === 0) return 0
    const weekStart = new Date(getWeekStart() + 'T00:00:00')
    return completions
      .filter(c => new Date(c.completed_at) >= weekStart)
      .reduce((sum, c) => sum + (c.points_earned || 0), 0)
  }, [completions])

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
    onboardingScreen,
    setOnboardingScreen,
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

    // New Scoring System
    weeklyScores,
    lifetimeScores,
    loadUserScores,

    // Prerequisites
    nervousSystemComplete,
    safetyContracts,
    healingCompassComplete,
    pastParallelStory,
    healingCompassId,
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

    // Sub-Tabs
    healingSubTab,
    setHealingSubTab,
    playlistSubTab,
    setPlaylistSubTab,

    // User Archetypes (for personalized voice quests)
    userArchetypes,

    getWeekStart,
    getWeekLabel,
    isQuestPlanned,
    getPlannedDay,

    // Constants
    categories,
    lockedCategories,
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
    getQuestCompletions,
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
