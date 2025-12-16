import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { supabase } from './lib/supabaseClient'
import { sanitizeText } from './lib/sanitize'
import { sendNotification } from './lib/notifications'
import NotificationPrompt from './components/NotificationPrompt'
import PortalExplainer from './components/PortalExplainer'
import ConversationLogInput from './components/ConversationLogInput'
import MilestoneInput from './components/MilestoneInput'
import FlowCompassInput from './components/FlowCompassInput'
import {
  handleConversationLogCompletion,
  handleMilestoneCompletion,
  handleFlowCompassCompletion,
  handleStreakUpdate,
  getUserStageProgress
} from './lib/questCompletionHelpers'
import { checkStreakBreak } from './lib/streakTracking'
import { initializeUserStageProgress } from './lib/graduationChecker'
import { normalizePersona } from './data/personaProfiles'
import './Challenge.css'

function Challenge() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Flow Finder')
  const [challengeData, setData] = useState(null)
  const [dailyReleaseChallenges, setDailyReleaseChallenges] = useState(null)
  const [progress, setProgress] = useState(null)
  const [completions, setCompletions] = useState([])
  const [questInputs, setQuestInputs] = useState({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showGroupSelection, setShowGroupSelection] = useState(false)
  const [groupMode, setGroupMode] = useState(null) // 'create', 'join', or null for solo
  const [groupCode, setGroupCode] = useState('')
  const [groupCodeInput, setGroupCodeInput] = useState('')
  const [groupData, setGroupData] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardView, setLeaderboardView] = useState('weekly') // 'weekly' or 'alltime'
  const [userRank, setUserRank] = useState(null)
  const [userData, setUserData] = useState(null)
  const [stageProgress, setStageProgress] = useState(null) // Track user's stage progress for graduation
  const [expandedLearnMore, setExpandedLearnMore] = useState({}) // Track which quest's learn more is expanded
  const [nervousSystemComplete, setNervousSystemComplete] = useState(false) // Track if nervous system flow is complete
  const [healingCompassComplete, setHealingCompassComplete] = useState(false) // Track if healing compass flow is complete
  const [pastParallelStory, setPastParallelStory] = useState(null) // Store past_parallel_story from healing compass
  const [showLockedTooltip, setShowLockedTooltip] = useState(null) // Track which quest's locked tooltip is showing
  const [showSettingsMenu, setShowSettingsMenu] = useState(false) // Track settings dropdown menu visibility
  const [showExplainer, setShowExplainer] = useState(false) // Track portal explainer visibility
  const settingsMenuRef = useRef(null) // Ref for clicking outside to close menu

  const categories = ['Flow Finder', 'Daily', 'Weekly', 'Tracker', 'Bonus']

  useEffect(() => {
    loadChallengeData()
  }, [])

  // Check if user has seen explainer and show on first visit
  useEffect(() => {
    if (progress && !showOnboarding) {
      const hasSeenExplainer = localStorage.getItem('hasSeenPortalExplainer')
      if (!hasSeenExplainer) {
        setShowExplainer(true)
      }
    }
  }, [progress, showOnboarding])

  // Helper function to render quest descriptions with markdown links
  const renderDescription = (description) => {
    if (!description) return null

    // Match markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(description)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(description.slice(lastIndex, match.index))
      }
      // Add the link
      parts.push(
        <Link key={match.index} to={match[2]} className="quest-inline-link">
          {match[1]}
        </Link>
      )
      lastIndex = match.index + match[0].length
    }

    // Add remaining text after the last link
    if (lastIndex < description.length) {
      parts.push(description.slice(lastIndex))
    }

    return parts.length > 0 ? parts : description
  }

  useEffect(() => {
    if (user) {
      loadUserProgress()
      loadLeaderboard()
      loadUserData()
      checkNervousSystemComplete()
      checkHealingCompassComplete()
      loadStageProgress()
    }
  }, [user])

  const checkNervousSystemComplete = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('nervous_system_responses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (!error && data && data.length > 0) {
        setNervousSystemComplete(true)
      } else {
        setNervousSystemComplete(false)
      }
    } catch (error) {
      console.error('Error checking nervous system completion:', error)
      setNervousSystemComplete(false)
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

  const loadUserData = async () => {
    if (!user?.email) return

    try {
      // Use ilike for case-insensitive email matching
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        setUserData(data[0])
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
      // Note: Initialization logic moved to separate useEffect to avoid race condition
    } catch (error) {
      console.error('Error loading stage progress:', error)
    }
  }

  // Initialize user stage progress when userData is available but stageProgress is not
  // This fixes the race condition where loadStageProgress ran before userData was loaded
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

  useEffect(() => {
    if (user && progress) {
      loadLeaderboard()
      loadGroupInfo()
    }
  }, [leaderboardView, progress])

  // Close settings menu when clicking outside
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

  // Set up real-time subscription for leaderboard updates
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

  const loadChallengeData = async () => {
    try {
      const response = await fetch('/challengeQuestsUpdate.json')
      const data = await response.json()
      setData(data)

      // Load daily release challenges
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

      // Load active challenge progress only
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
        // No active challenge - show onboarding
        setShowOnboarding(true)
        setLoading(false)
        return
      }

      setProgress(progressData)

      // Check if streak should be broken (user missed 2+ days)
      const streakResult = await checkStreakBreak(user.id, progressData.challenge_instance_id)
      if (streakResult.streak_broken) {
        console.log('⚠️ Streak was broken - reset to 0')
        // Reload progress to get updated streak_days
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
      // Use calendar days instead of 24-hour periods
      const lastActive = new Date(progressData.last_active_date)
      const now = new Date()

      // Reset time to midnight for proper day comparison
      const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const daysSinceLastActive = Math.floor((today - lastActiveDay) / (1000 * 60 * 60 * 24))

      console.log('Day counter check:', {
        lastActiveDate: progressData.last_active_date,
        lastActiveDay: lastActiveDay.toISOString(),
        today: today.toISOString(),
        daysSinceLastActive,
        currentDay: progressData.current_day
      })

      if (daysSinceLastActive >= 1 && progressData.current_day < 7) {
        console.log('Advancing day from', progressData.current_day, 'to', Math.min(progressData.current_day + daysSinceLastActive, 7))
        await advanceDay(progressData, daysSinceLastActive)
      }

      // Load quest completions for this challenge instance
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

    console.log('Advancing from day', currentProgress.current_day, 'to day', newDay)

    const { data, error} = await supabase
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
      console.log('Day advanced successfully:', data)
      setProgress(data)

      // Send notification about new day
      if (newDay > currentProgress.current_day && newDay <= 7) {
        await sendNotification(user.id, {
          title: `Day ${newDay} Unlocked! 🎉`,
          body: 'Your new daily quests are ready to complete',
          url: '/7-day-challenge',
          tag: `day-${newDay}`
        })
      }
    }
  }

  const showGroupSelectionModal = () => {
    setShowOnboarding(false)
    setShowGroupSelection(true)
  }

  const handlePlaySolo = () => {
    setGroupMode(null)
    setShowGroupSelection(false)
    startChallenge(null)
  }

  const handleCreateGroup = async () => {
    try {
      // Call Supabase function to generate unique code
      const { data, error } = await supabase.rpc('generate_group_code')

      if (error) throw error

      const newCode = data

      // Create group
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

      // Start challenge with group_id
      await startChallenge(groupData.id)

      // Add user to participants
      await supabase
        .from('challenge_participants')
        .insert([{
          group_id: groupData.id,
          user_id: user.id
        }])

      setShowGroupSelection(false)

      // Show success message with group code
      alert(`🎉 Group created successfully!\n\nYour group code is: ${newCode}\n\nShare this code with friends to invite them to your challenge group. You can also find this code on the Leaderboard page.`)

      // TODO: Send email with group code (requires email service setup)
      // For now, the code is displayed in the alert and on the leaderboard
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
      // Find group by code
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

      // Start challenge with group_id
      await startChallenge(groupData.id)

      // Add user to participants
      await supabase
        .from('challenge_participants')
        .insert([{
          group_id: groupData.id,
          user_id: user.id
        }])

      setShowGroupSelection(false)
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Error joining group. Please try again.')
    }
  }

  const handleCloseExplainer = () => {
    setShowExplainer(false)
    localStorage.setItem('hasSeenPortalExplainer', 'true')
  }

  const handleOpenExplainer = () => {
    setShowExplainer(true)
  }

  const handleRestartChallenge = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to start a new 7-day challenge? Your current progress will be archived and you\'ll start fresh on Day 1.'
    )

    if (!confirmed) return

    try {
      // Archive current challenge by setting status to 'completed'
      await supabase
        .from('challenge_progress')
        .update({ status: 'completed' })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Start new challenge (reuse same group if user was in one)
      await startChallenge(progress.group_id || null)

      // Reload user progress
      await loadUserProgress()

      alert('🎉 New challenge started! Welcome to Day 1.')
    } catch (error) {
      console.error('Error restarting challenge:', error)
      alert('Error starting new challenge. Please try again.')
    }
  }

  const startChallenge = async (groupId = null) => {
    try {
      // First, abandon any active challenges for this user
      await supabase.rpc('abandon_active_challenges', { p_user_id: user.id })

      // Get session_id from lead_flow_profiles (use ilike for case-insensitive email matching)
      const { data: profileData } = await supabase
        .from('lead_flow_profiles')
        .select('session_id')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const sessionId = profileData?.session_id || `session_${Date.now()}`

      // Get user's current persona and stage
      let userPersona = stageProgress?.persona
      let userStage = stageProgress?.current_stage

      // If not in state, fetch from database
      if (!userPersona || !userStage) {
        const { data: currentStageProgress } = await supabase
          .from('user_stage_progress')
          .select('persona, current_stage')
          .eq('user_id', user.id)
          .maybeSingle()

        userPersona = currentStageProgress?.persona || 'vibe_seeker'
        userStage = currentStageProgress?.current_stage || 'clarity'
      }

      // Generate new challenge instance ID
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

  const loadLeaderboard = async () => {
    try {
      if (!user) return

      // Build the query for challenge_progress
      let challengeQuery = supabase
        .from('challenge_progress')
        .select('*')
        .eq('status', 'active')  // Only show active challenges
        .order('total_points', { ascending: false })

      // If user has a group, filter by group members
      if (progress && progress.group_id) {
        challengeQuery = challengeQuery.eq('group_id', progress.group_id)
      } else if (leaderboardView === 'weekly' && progress) {
        // Filter by weekly cohort if in weekly view (for non-group users)
        const startDate = new Date(progress.challenge_start_date)
        const weekStart = new Date(startDate)
        weekStart.setDate(weekStart.getDate() - ((startDate.getDay() + 6) % 7)) // Start of week (Monday)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        challengeQuery = challengeQuery
          .gte('challenge_start_date', weekStart.toISOString())
          .lt('challenge_start_date', weekEnd.toISOString())
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

      // Get all session_ids to fetch profiles
      const sessionIds = challengeData.map(entry => entry.session_id).filter(Boolean)

      // Fetch user names from lead_flow_profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('lead_flow_profiles')
        .select('session_id, user_name, email')
        .in('session_id', sessionIds)

      if (profilesError) {
        console.error('Error loading profiles:', profilesError)
      }

      // Create a map of session_id to user_name
      const profileMap = {}
      if (profilesData) {
        profilesData.forEach(profile => {
          profileMap[profile.session_id] = profile.user_name
        })
      }

      // Process leaderboard data
      const leaderboardData = challengeData.map((entry, index) => {
        const userName = profileMap[entry.session_id] || 'Anonymous'
        const firstName = userName.split(' ')[0] // First name only

        return {
          rank: index + 1,
          userId: entry.user_id,
          name: firstName,
          totalPoints: entry.total_points || 0,
          currentDay: entry.current_day,
          isCurrentUser: entry.user_id === user.id
        }
      })

      setLeaderboard(leaderboardData)

      // Set current user's rank
      const userEntry = leaderboardData.find(entry => entry.isCurrentUser)
      setUserRank(userEntry?.rank || null)

    } catch (error) {
      console.error('Error in loadLeaderboard:', error)
    }
  }

  const isQuestCompletedToday = (questId, quest) => {
    const today = new Date().setHours(0, 0, 0, 0)

    if (quest.type === 'daily') {
      return completions.some(c => {
        const completedDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
        return c.quest_id === questId && completedDate === today
      })
    } else {
      // Weekly and anytime quests
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

  // Check if a quest has ever been completed (used for sequential unlocking)
  const isQuestEverCompleted = (questId) => {
    return completions.some(c => c.quest_id === questId)
  }

  // Check if a quest is locked due to requires_quest not being completed
  const isQuestLocked = (quest) => {
    if (!quest.requires_quest) return false
    return !isQuestEverCompleted(quest.requires_quest)
  }

  // Get the name of the required quest for display
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

  const handleQuestComplete = async (quest, specialData = null) => {
    const inputValue = specialData || questInputs[quest.id]

    // Validate input based on type
    if (quest.inputType === 'text' && (!inputValue || inputValue.trim() === '')) {
      alert('Please enter your reflection before completing this quest.')
      return
    }

    if (quest.inputType === 'conversation_log' && !specialData) {
      alert('Please fill out the conversation details.')
      return
    }

    if (quest.inputType === 'milestone' && !specialData) {
      alert('Please describe what you accomplished.')
      return
    }

    if (quest.inputType === 'flow_compass' && !specialData) {
      alert('Please select your flow direction and describe what happened.')
      return
    }

    if (quest.inputType === 'dropdown' && (!inputValue || inputValue.trim() === '')) {
      alert('Please select an option before completing this quest.')
      return
    }

    // Sanitize reflection text for text and dropdown inputs
    const sanitizedReflection = ((quest.inputType === 'text' || quest.inputType === 'dropdown') && inputValue)
      ? sanitizeText(inputValue)
      : null

    try {
      // Handle special quest types BEFORE creating quest completion
      if (quest.inputType === 'conversation_log') {
        const result = await handleConversationLogCompletion(
          user.id,
          progress.challenge_instance_id,
          specialData,
          stageProgress
        )

        if (!result.success) {
          alert(`Error logging conversation: ${result.error}`)
          return
        }

        // Reload stage progress to update conversation count
        await loadStageProgress()
      }

      if (quest.inputType === 'milestone') {
        const result = await handleMilestoneCompletion(
          user.id,
          specialData,
          stageProgress,
          userData?.persona
        )

        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed this milestone!')
          } else {
            alert(`Error saving milestone: ${result.error}`)
          }
          return
        }

        // Reload stage progress
        await loadStageProgress()
      }

      if (quest.inputType === 'flow_compass') {
        const result = await handleFlowCompassCompletion(
          user.id,
          progress.challenge_instance_id,
          specialData,
          stageProgress?.default_project_id
        )

        if (!result.success) {
          alert(`Error logging flow: ${result.error}`)
          return
        }

        console.log('✅ Flow entry logged from quest:', result.entryId)
      }

      // Handle checkbox quests that have a milestone_type (Bug Fix: save milestone for checkbox inputs)
      if (quest.inputType === 'checkbox' && quest.milestone_type) {
        const milestoneData = {
          milestone_type: quest.milestone_type,
          evidence_text: 'Completed via checkbox'
        }

        const result = await handleMilestoneCompletion(
          user.id,
          milestoneData,
          stageProgress,
          userData?.persona
        )

        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed this milestone!')
            return
          } else {
            alert(`Error saving milestone: ${result.error}`)
            return
          }
        }

        // Reload stage progress
        await loadStageProgress()
      }

      // Create quest completion record
      const completionData = {
        user_id: user.id,
        challenge_instance_id: progress.challenge_instance_id,
        quest_id: quest.id,
        quest_category: quest.category,
        quest_type: quest.type,
        points_earned: quest.points,
        challenge_day: progress.current_day
      }

      // Add reflection_text for text/dropdown inputs, or structured data for special types
      if (quest.inputType === 'text' || quest.inputType === 'dropdown') {
        completionData.reflection_text = sanitizedReflection
      } else if (quest.inputType === 'conversation_log' || quest.inputType === 'milestone' || quest.inputType === 'flow_compass') {
        completionData.reflection_text = JSON.stringify(specialData)
      }

      // Check for duplicate completions
      // For milestone quests, check if EVER completed (one-time only)
      // For regular quests, check if completed TODAY (daily limit)
      const todayDate = new Date().toISOString().split('T')[0]
      let duplicateQuery = supabase
        .from('quest_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_instance_id', progress.challenge_instance_id)
        .eq('quest_id', quest.id)

      // Milestone quests can only be completed once ever
      if (!quest.milestone_type) {
        duplicateQuery = duplicateQuery
          .gte('completed_at', `${todayDate}T00:00:00.000Z`)
          .lte('completed_at', `${todayDate}T23:59:59.999Z`)
      }

      const { data: existingCompletion } = await duplicateQuery.maybeSingle()

      if (existingCompletion) {
        const message = quest.milestone_type
          ? 'You have already completed this milestone!'
          : 'You have already completed this quest today!'
        alert(message)
        return
      }

      const { error: completionError } = await supabase
        .from('quest_completions')
        .insert([completionData])

      if (completionError) {
        console.error('Error completing quest:', completionError)
        alert('Error completing quest. Please try again.')
        return
      }

      // Update streak
      await handleStreakUpdate(user.id, progress.challenge_instance_id)

      // Calculate new points
      const categoryLower = quest.category.toLowerCase()
      const typeKey = quest.type === 'daily' ? 'daily' : 'weekly'

      // Only these categories have dedicated points columns in challenge_progress
      const categoriesWithColumns = ['recognise', 'release', 'rewire', 'reconnect']
      const hasPointsColumn = categoriesWithColumns.includes(categoryLower)

      const newTotalPoints = (progress.total_points || 0) + quest.points

      // Update progress
      const updateData = {
        total_points: newTotalPoints,
        last_active_date: new Date().toISOString()
      }

      // Add category-specific points for Recognise/Release/Rewire/Reconnect quests
      if (hasPointsColumn) {
        const pointsField = `${categoryLower}_${typeKey}_points`
        updateData[pointsField] = (progress[pointsField] || 0) + quest.points
      }

      const { data: updatedProgress, error: progressError } = await supabase
        .from('challenge_progress')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('challenge_instance_id', progress.challenge_instance_id)
        .eq('status', 'active')
        .select()
        .single()

      if (progressError) {
        console.error('Error updating progress:', progressError)
        alert('Error updating progress. Please try again.')
        return
      }

      setProgress(updatedProgress)

      // Reload completions for this challenge instance
      const { data: newCompletions } = await supabase
        .from('quest_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_instance_id', progress.challenge_instance_id)

      setCompletions(newCompletions || [])

      // Clear input
      setQuestInputs(prev => ({ ...prev, [quest.id]: '' }))

      // Check for artifact unlock (reusing categoryLower and typeKey from above)
      const categoryArtifact = challengeData?.artifacts?.find(a => a.category === quest.category)
      const artifactUnlocked = categoryArtifact && checkArtifactUnlock(quest.category, newTotalPoints, typeKey)

      // Show success message
      let successMessage = `✅ Quest complete! +${quest.points} points`

      if (quest.counts_toward_graduation) {
        successMessage += '\n✨ Progress toward graduation!'
      }

      if (artifactUnlocked && categoryArtifact) {
        successMessage = `🎉 Quest complete! +${quest.points} points\n\n✨ You unlocked the ${categoryArtifact.name}!`
      }

      alert(successMessage)

      // Check for tab completion bonus (after showing quest complete message)
      // We need to recalculate with the new completions
      setTimeout(async () => {
        const tabStatus = getTabCompletionStatus(quest.category)
        if (tabStatus.isComplete && !tabStatus.bonusAwarded && tabStatus.bonusPoints > 0) {
          await awardTabCompletionBonus(quest.category, tabStatus.bonusPoints)
        }
      }, 500)
    } catch (error) {
      console.error('Error in handleQuestComplete:', error)
      alert('Error completing quest. Please try again.')
    }
  }

  const checkArtifactUnlock = (category, newPoints, typeKey) => {
    if (!challengeData) return false

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return false

    const categoryLower = category.toLowerCase()
    const dailyPoints = typeKey === 'daily' ? newPoints : (progress[`${categoryLower}_daily_points`] || 0)
    const weeklyPoints = typeKey === 'weekly' ? newPoints : (progress[`${categoryLower}_weekly_points`] || 0)

    return dailyPoints >= artifact.dailyPointsRequired && weeklyPoints >= artifact.weeklyPointsRequired
  }

  // Helper to get valid quest IDs for current persona/stage
  const getValidQuestIds = (category) => {
    if (!challengeData?.quests) return []

    // normalizePersona imported from './data/personaProfiles'
    const userPersonaNormalized = normalizePersona(userData?.persona)

    return challengeData.quests
      .filter(quest => {
        // Must match category
        if (quest.category !== category) return false

        // Filter by persona
        if (quest.persona_specific && userPersonaNormalized) {
          const normalizedQuestPersonas = quest.persona_specific.map(p => normalizePersona(p))
          if (!normalizedQuestPersonas.includes(userPersonaNormalized)) {
            return false
          }
        }

        // Filter by stage
        if (quest.stage_required && stageProgress?.current_stage) {
          if (quest.stage_required !== stageProgress.current_stage) {
            return false
          }
        }

        return true
      })
      .map(q => q.id)
  }

  const getCategoryPoints = (category) => {
    if (!progress) return { daily: 0, weekly: 0, total: 0 }

    // Categories that have dedicated columns in challenge_progress table
    const categoriesWithColumns = ['recognise', 'release', 'rewire', 'reconnect']
    const categoryLower = category.toLowerCase()

    if (categoriesWithColumns.includes(categoryLower)) {
      // Use database columns for these categories
      const daily = progress[`${categoryLower}_daily_points`] || 0
      const weekly = progress[`${categoryLower}_weekly_points`] || 0
      return { daily, weekly, total: daily + weekly }
    }

    // Get valid quest IDs for current persona/stage
    const validQuestIds = getValidQuestIds(category)

    // Filter completions to only include valid quests for current persona/stage
    const categoryCompletions = completions.filter(c =>
      c.quest_category === category && validQuestIds.includes(c.quest_id)
    )
    const total = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

    // For Daily/Weekly categories, also break down by type
    if (category === 'Daily' || category === 'Weekly') {
      const dailyPoints = categoryCompletions
        .filter(c => c.quest_type?.toLowerCase() === 'daily' || category === 'Daily')
        .reduce((sum, c) => sum + (c.points_earned || 0), 0)
      const weeklyPoints = categoryCompletions
        .filter(c => c.quest_type?.toLowerCase() === 'weekly' || category === 'Weekly')
        .reduce((sum, c) => sum + (c.points_earned || 0), 0)
      return { daily: dailyPoints, weekly: weeklyPoints, total }
    }

    return { daily: 0, weekly: 0, total }
  }

  const getPointsToday = (category) => {
    if (!completions || completions.length === 0) return 0

    const today = new Date().setHours(0, 0, 0, 0)

    // Get valid quest IDs for current persona/stage
    const validQuestIds = getValidQuestIds(category)

    // Filter completions for this category that were completed today, only for valid quests
    const todayCompletions = completions.filter(c => {
      const completionDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
      return c.quest_category === category &&
        completionDate === today &&
        validQuestIds.includes(c.quest_id)
    })

    // Sum up the points
    return todayCompletions.reduce((sum, completion) => sum + (completion.points_earned || 0), 0)
  }

  // Tab Completion Bonus System
  const BONUS_PERCENTAGE = 5 // 5% bonus for completing all quests in a tab

  const getTabCompletionStatus = (category) => {
    if (!challengeData || !completions) {
      return { totalQuests: 0, completedQuests: 0, isComplete: false, bonusPoints: 0, percentage: 0 }
    }

    // Get valid quest IDs for current persona/stage (applies to all categories)
    const validQuestIds = getValidQuestIds(category)

    // Get quests that are valid for this persona/stage
    const categoryQuests = challengeData.quests.filter(q => validQuestIds.includes(q.id))

    const totalQuests = categoryQuests.length
    if (totalQuests === 0) {
      return { totalQuests: 0, completedQuests: 0, isComplete: false, bonusPoints: 0, percentage: 0 }
    }

    // Count completed quests (any completion, not just today)
    const completedQuestIds = new Set(completions.map(c => c.quest_id))
    const completedQuests = categoryQuests.filter(q => completedQuestIds.has(q.id)).length

    // Calculate total possible points for this category
    const totalPossiblePoints = categoryQuests.reduce((sum, q) => sum + (q.points || 0), 0)

    // Calculate bonus points (15% of total category points)
    const bonusPoints = Math.round(totalPossiblePoints * (BONUS_PERCENTAGE / 100))

    const isComplete = completedQuests >= totalQuests
    const percentage = Math.round((completedQuests / totalQuests) * 100)

    // Check if bonus was already awarded (stored in progress)
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

  // Award tab completion bonus
  const awardTabCompletionBonus = async (category, bonusPoints) => {
    if (!progress || !user) return

    const bonusKey = `${category.toLowerCase().replace(/\s+/g, '_')}_bonus_awarded`

    // Check if already awarded
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

      // Show celebration message
      alert(`🎉 Tab Complete! +${bonusPoints} bonus points (${BONUS_PERCENTAGE}% boost)\n\nYou've completed all quests in ${category}!`)
    } catch (error) {
      console.error('Error in awardTabCompletionBonus:', error)
    }
  }

  const getArtifactProgress = (category) => {
    if (!challengeData) return null

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return null

    const unlocked = progress?.[`${artifact.id}_unlocked`] || false

    // Get valid quest IDs for current persona/stage
    const validQuestIds = getValidQuestIds(category)

    // For Daily and Weekly artifacts with R categories
    if ((category === 'Daily' || category === 'Weekly') && artifact.rCategories) {
      const rCategoriesWithProgress = {}

      // Calculate points for each R category, filtered by persona/stage
      Object.entries(artifact.rCategories).forEach(([rType, rData]) => {
        // Get completions for this category and R type, only for valid quests
        const rCompletions = completions.filter(c =>
          c.quest_category === category &&
          c.quest_type === rType &&
          validQuestIds.includes(c.quest_id)
        )
        const currentPoints = rCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

        rCategoriesWithProgress[rType] = {
          ...rData,
          currentPoints
        }
      })

      return {
        ...artifact,
        rCategories: rCategoriesWithProgress,
        unlocked
      }
    }

    // For Flow Finder: Calculate pointsRequired dynamically based on filtered quests (100% completion)
    if (category === 'Flow Finder') {
      // Get filtered quests using validQuestIds
      const flowFinderQuests = challengeData.quests.filter(q => validQuestIds.includes(q.id))

      // Calculate total possible points from filtered quests (100% completion)
      const dynamicPointsRequired = flowFinderQuests.reduce((sum, q) => sum + (q.points || 0), 0)

      // Filter completions to only include valid quests for current persona/stage
      const categoryCompletions = completions.filter(c =>
        c.quest_category === category && validQuestIds.includes(c.quest_id)
      )
      const currentPoints = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

      return {
        ...artifact,
        currentPoints,
        pointsRequired: dynamicPointsRequired || artifact.pointsRequired, // Use dynamic or fallback to JSON value
        unlocked
      }
    }

    // For Tracker and Bonus artifacts - filter by valid quests
    const categoryCompletions = completions.filter(c =>
      c.quest_category === category && validQuestIds.includes(c.quest_id)
    )
    const currentPoints = categoryCompletions.reduce((sum, c) => sum + (c.points_earned || 0), 0)

    return {
      ...artifact,
      currentPoints,
      unlocked
    }
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

  // Get the daily release challenge for the current day
  const getDailyReleaseChallenge = () => {
    if (!dailyReleaseChallenges || !progress) return null

    const currentDay = progress.current_day
    if (currentDay === 0 || currentDay > 7) return null

    return dailyReleaseChallenges[currentDay.toString()]
  }

  // Render the daily release challenge content
  const renderDailyReleaseChallenge = () => {
    const challenge = getDailyReleaseChallenge()
    if (!challenge) return null

    // Replace {{past_event_details}} with actual data from healing compass
    const replacePlaceholder = (text) => {
      if (!text) return text
      const storyText = pastParallelStory || 'the past event from your Healing Compass'
      return text.replace(/\{\{past_event_details\}\}/g, storyText)
    }

    return (
      <div className="daily-release-challenge">
        <h4>{challenge.title}</h4>
        <p className="challenge-description">{challenge.description}</p>

        {challenge.videoUrl && (
          <div className="challenge-video">
            <a href={challenge.videoUrl} target="_blank" rel="noopener noreferrer" className="video-link">
              📺 Watch Guided Meditation
            </a>
          </div>
        )}

        <div className="challenge-instructions">
          {challenge.instructions.map((instruction, index) => (
            <p key={index} dangerouslySetInnerHTML={{ __html: replacePlaceholder(instruction) }} />
          ))}
        </div>
      </div>
    )
  }

  const getDailyStreak = (questId) => {
    if (!progress) return [false, false, false, false, false, false, false]

    const challengeStart = new Date(progress.challenge_start_date)
    challengeStart.setHours(0, 0, 0, 0)

    // Get all completions for this quest
    const questCompletions = completions.filter(c => c.quest_id === questId)

    // Create array for 7 days [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const streak = [false, false, false, false, false, false, false]

    questCompletions.forEach(completion => {
      const completionDate = new Date(completion.completed_at)
      completionDate.setHours(0, 0, 0, 0)

      // Calculate which day of the challenge this was (0-6)
      const daysSinceStart = Math.floor((completionDate - challengeStart) / (1000 * 60 * 60 * 24))

      if (daysSinceStart >= 0 && daysSinceStart < 7) {
        streak[daysSinceStart] = true
      }
    })

    return streak
  }

  const getDayLabels = () => {
    if (!progress) return ['M', 'T', 'W', 'T', 'F', 'S', 'S']

    const challengeStart = new Date(progress.challenge_start_date)
    const dayOfWeek = challengeStart.getDay() // 0 = Sunday, 1 = Monday, etc.
    const allDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] // Sunday to Saturday

    // Create array starting from the challenge start day
    const labels = []
    for (let i = 0; i < 7; i++) {
      labels.push(allDayLabels[(dayOfWeek + i) % 7])
    }

    return labels
  }

  // Filter quests by the active category tab
  let filteredQuests = challengeData?.quests.filter(q => q.category === activeCategory) || []

  // Filter by persona and stage for Flow Finder quests
  if (activeCategory === 'Flow Finder') {
    // normalizePersona imported from './data/personaProfiles'
    const userPersonaNormalized = normalizePersona(userData?.persona)

    console.log('🔍 Flow Finder Filtering Debug:', {
      totalQuests: filteredQuests.length,
      userPersona: userData?.persona,
      userPersonaNormalized,
      userStage: stageProgress?.current_stage,
      hasUserData: !!userData,
      hasStageProgress: !!stageProgress
    })

    filteredQuests = filteredQuests.filter(quest => {
      // Filter by persona
      if (quest.persona_specific && userPersonaNormalized) {
        const normalizedQuestPersonas = quest.persona_specific.map(p => normalizePersona(p))
        if (!normalizedQuestPersonas.includes(userPersonaNormalized)) {
          console.log(`❌ Filtered out: ${quest.name} (persona mismatch: ${quest.persona_specific} vs ${userData.persona})`)
          return false
        }
      }

      // Filter by stage
      if (quest.stage_required && stageProgress?.current_stage) {
        if (quest.stage_required !== stageProgress.current_stage) {
          console.log(`❌ Filtered out: ${quest.name} (stage mismatch: ${quest.stage_required} vs ${stageProgress.current_stage})`)
          return false
        }
      }

      console.log(`✅ Keeping: ${quest.name}`)
      return true
    })

    console.log('✅ Final Flow Finder quests:', filteredQuests.length)
  }

  // For Daily and Weekly tabs, group quests by type (the 4 R's)
  // For Flow Finder, quests are already in the right category
  // For Bonus and Tracker, show all quests in that category
  const questsByType = {}
  if (activeCategory === 'Daily' || activeCategory === 'Weekly') {
    // Group by the 4 R's framework
    const rTypes = ['Recognise', 'Release', 'Rewire', 'Reconnect']
    rTypes.forEach(type => {
      questsByType[type] = filteredQuests.filter(q => q.type === type)
    })
  } else if (activeCategory === 'Flow Finder') {
    // Group by persona or show all
    questsByType['all'] = filteredQuests
  } else if (activeCategory === 'Bonus' || activeCategory === 'Tracker') {
    questsByType['all'] = filteredQuests
  }

  // For backward compatibility with existing code structure
  const dailyQuests = activeCategory === 'Daily' ? filteredQuests : []
  const weeklyQuests = activeCategory === 'Weekly' ? filteredQuests : []
  const bonusQuests = activeCategory === 'Bonus' ? filteredQuests : []

  if (showOnboarding) {
    return (
      <div className="challenge-container">
        <div className="challenge-onboarding">
          <div className="onboarding-content">
            <h1>🚀 Ready to Find Your Flow?</h1>
            <p className="onboarding-intro">
            You got the job. Made some money. Experienced the ladder.
            </p>
            <p className="onboarding-intro">
            But somewhere along the way, you realised: This isn't it.
            </p>
            <p className="onboarding-intro">
            You had your awakening...Now what?
            </p>
            <p className="onboarding-intro">
              You know there's something more— you've felt it.
            </p>
            <p className="onboarding-intro">
              Moments of aliveness. Impact. Flow.
            </p>
            <p className="onboarding-intro">
              But you don't know how to get from where you are to where you sense you could be.
            </p>
            <p className="onboarding-intro">
              That's what Find My Flow is for.
            </p>
            <p className="onboarding-intro">
              Over the next 7 days you'll complete quests across four categories to help you re-find your flow and amplify your impact:
            </p>

            <div className="onboarding-categories">
              <div className="onboarding-category">
                <h3>🔍 Recognise</h3>
                <p>Build awareness of what's blocking your flow and what your flow is</p>
              </div>
              <div className="onboarding-category">
                <h3>🕊️ Release</h3>
                <p>Let go of traumas blocking your flow</p>
              </div>
              <div className="onboarding-category">
                <h3>⚡ Rewire</h3>
                <p>Act in alignment with your flow</p>
              </div>
              <div className="onboarding-category">
                <h3>🌊 Reconnect</h3>
                <p>Live from your essence and find your flow</p>
              </div>
            </div>

            <button className="start-challenge-btn" onClick={showGroupSelectionModal}>
              Start My 7-Day Journey
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showGroupSelection) {
    return (
      <div className="challenge-container">
        <div className="challenge-onboarding">
          <div className="onboarding-content">
            <h1>🎯 Choose Your Challenge Mode</h1>
            <p className="onboarding-intro">
              Play solo or create/join a group to compete with friends and family!
            </p>

            <div className="group-selection-buttons">
              <button className="group-mode-btn solo" onClick={handlePlaySolo}>
                <div className="mode-icon">🎯</div>
                <h3>Play Solo</h3>
                <p>Complete the challenge on your own</p>
              </button>

              <button className="group-mode-btn create" onClick={handleCreateGroup}>
                <div className="mode-icon">👥</div>
                <h3>Create Group</h3>
                <p>Start a new group and invite others</p>
              </button>

              <div className="group-mode-btn join">
                <div className="mode-icon">🔗</div>
                <h3>Join Group</h3>
                <p>Enter a group code to join</p>
                <input
                  type="text"
                  className="group-code-input"
                  placeholder="Enter 6-digit code"
                  value={groupCodeInput}
                  onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <button className="join-group-btn" onClick={handleJoinGroup}>
                  Join Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="challenge-container">
        <div className="challenge-loading">Loading your challenge...</div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="challenge-container">
        <div className="challenge-error">
          <p>Unable to load challenge progress. Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const categoryPoints = getCategoryPoints(activeCategory)
  const artifactProgress = getArtifactProgress(activeCategory)

  return (
    <div className="challenge-container">
      {showExplainer && <PortalExplainer onClose={handleCloseExplainer} />}
      <NotificationPrompt />
      <header className="challenge-header">
        <h1>Gamify Your Ambitions</h1>

        <div className="challenge-points">
          <div className="total-points clickable" onClick={() => setActiveCategory('Leaderboard')}>
            <span className="points-label">Total Points</span>
            <span className="points-value">{progress.total_points || 0}</span>
            {userRank && (
              <>
                <span className="points-separator">•</span>
                <span className="points-label">Your Rank</span>
                <span className="points-value">#{userRank}</span>
              </>
            )}
          </div>
        </div>

        <div className="challenge-header-top">
          <div className="challenge-header-badges">
            <div className="challenge-day">
              Day {progress.current_day}/7
              {progress.current_day === 7 && (
                <span className="challenge-complete-badge">
                  <span className="complete-text">Complete!</span> 🎉
                </span>
              )}
            </div>
            {userData?.essence_archetype && (
              <div
                className="challenge-day archetype-badge"
                title="View your archetypes"
                onClick={() => navigate('/archetypes')}
                style={{ cursor: 'pointer' }}
              >
                ✨ Archetypes
              </div>
            )}
            <div className="settings-menu-container" ref={settingsMenuRef}>
              <button
                className="challenge-day settings-badge"
                title="Settings"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              >
                ⚙️
              </button>
              {showSettingsMenu && (
                <div className="settings-dropdown">
                  <button
                    className="settings-menu-item"
                    onClick={() => {
                      navigate('/me')
                      setShowSettingsMenu(false)
                    }}
                  >
                    🏠 Home
                  </button>
                  <button
                    className="settings-menu-item"
                    onClick={() => {
                      handleOpenExplainer()
                      setShowSettingsMenu(false)
                    }}
                  >
                    📖 Explainer
                  </button>
                  <button
                    className="settings-menu-item"
                    onClick={() => {
                      navigate('/settings/notifications')
                      setShowSettingsMenu(false)
                    }}
                  >
                    🔔 Notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {progress.current_day === 7 && (
          <button className="restart-challenge-btn" onClick={handleRestartChallenge}>
            Start New 7-Day Challenge
          </button>
        )}
      </header>

      <div className="challenge-tabs">
        {categories.map(category => (
          <button
            key={category}
            className={`challenge-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="challenge-content">
        {/* Leaderboard - show if activeCategory is Leaderboard even though not in tabs */}
        {activeCategory === 'Leaderboard' && (
          <div className="leaderboard-section">
            <div className="leaderboard-header">
              <h2 className="section-title">🏆 Leaderboard</h2>
              <div className="leaderboard-toggle">
                <button
                  className={`toggle-btn ${leaderboardView === 'weekly' ? 'active' : ''}`}
                  onClick={() => setLeaderboardView('weekly')}
                >
                  This Week
                </button>
                <button
                  className={`toggle-btn ${leaderboardView === 'alltime' ? 'active' : ''}`}
                  onClick={() => setLeaderboardView('alltime')}
                >
                  All Time
                </button>
              </div>
            </div>

            {groupCode && progress.current_day === 0 && (
              <div className="group-code-display">
                <div className="group-code-info">
                  Group Code: <strong>{groupCode}</strong>
                </div>
                <button
                  className="whatsapp-share-btn"
                  onClick={() => {
                    const message = `Join my 7-Day Find My Flow Challenge! Use code: ${groupCode}`
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                >
                  <svg className="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Share group code via WhatsApp
                </button>
              </div>
            )}

            <div className="leaderboard-list">
              {leaderboard.length === 0 && (
                <div className="leaderboard-empty">
                  <p>No participants yet. Be the first to complete a quest!</p>
                </div>
              )}

              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`leaderboard-entry ${entry.isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className="leaderboard-rank">
                    {entry.rank === 1 && '🥇'}
                    {entry.rank === 2 && '🥈'}
                    {entry.rank === 3 && '🥉'}
                    {entry.rank > 3 && `#${entry.rank}`}
                  </div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">
                      {entry.name}
                      {entry.isCurrentUser && <span className="you-badge">You</span>}
                    </div>
                    <div className="leaderboard-meta">Day {entry.currentDay}/7</div>
                  </div>
                  <div className="leaderboard-points">
                    {entry.totalPoints} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quest Content - only show if not on Leaderboard tab */}
        {activeCategory !== 'Leaderboard' && (
          <>
        {/* Artifact Progress */}
        {artifactProgress && (
          <div className={`artifact-progress ${artifactProgress.unlocked ? 'unlocked' : ''}`}>
            <div className="artifact-header">
              <h3>{artifactProgress.unlocked ? '✅' : '🔒'} {artifactProgress.name}</h3>
              <p className="artifact-description">{artifactProgress.description}</p>
            </div>

            {!artifactProgress.unlocked && (
              <div className="artifact-bars">
                {/* For Daily and Weekly: Show 4 R's sliders */}
                {(activeCategory === 'Daily' || activeCategory === 'Weekly') && artifactProgress.rCategories ? (
                  <>
                    {Object.entries(artifactProgress.rCategories).map(([rType, rData]) => (
                      <div key={rType} className="progress-bar-container">
                        <div className="progress-bar-label">
                          <span>{rType}</span>
                          <span>{rData.currentPoints}/{rData.pointsRequired}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min((rData.currentPoints / rData.pointsRequired) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  /* For Flow Finder and Tracker: Show simple progress */
                  <div className="progress-bar-container">
                    <div className="progress-bar-label">
                      <span>Progress</span>
                      <span>{artifactProgress.currentPoints || 0}/{artifactProgress.pointsRequired}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(((artifactProgress.currentPoints || 0) / artifactProgress.pointsRequired) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {/* Tab Completion Bonus Text */}
                {(() => {
                  const tabStatus = getTabCompletionStatus(activeCategory)
                  if (tabStatus.totalQuests === 0) return null
                  if (tabStatus.bonusAwarded) {
                    return <p className="tab-bonus-text earned">+{tabStatus.bonusPoints} pts bonus earned!</p>
                  }
                  return <p className="tab-bonus-text">Complete To Receive {BONUS_PERCENTAGE}% Point Boost</p>
                })()}
              </div>
            )}

            {artifactProgress.unlocked && (
              <div className="artifact-unlocked-message">
                🎉 Artifact Unlocked! You've completed this category.
              </div>
            )}
          </div>
        )}

        {/* Category Points Summary */}
        <div className="category-points-summary">
          <div className="category-point-item total">
            <span>Category Total</span>
            <span className="point-value">{categoryPoints.total}</span>
          </div>
          <div className="category-point-item">
            <span>Points Today</span>
            <span className="point-value">{getPointsToday(activeCategory)}</span>
          </div>
          <button
            className="category-point-item leaderboard-button"
            onClick={() => setActiveCategory('Leaderboard')}
          >
            <span className="leaderboard-button-label">Leaderboard</span>
            <span className="leaderboard-button-value">🏆</span>
          </button>
        </div>

        {/* Quests for current category */}
        {activeCategory === 'Daily' && filteredQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Daily Quests</h2>
            {['Recognise', 'Release', 'Rewire', 'Reconnect'].map(rType => {
              const rTypeQuests = filteredQuests.filter(q => q.type === rType)
              if (rTypeQuests.length === 0) return null

              return (
                <div key={rType} className="quest-subsection">
                  <h3 className="subsection-title">{rType}</h3>
                  <div className="quest-grid">
                    {rTypeQuests.map(quest => {
                      const completed = isQuestCompletedToday(quest.id, quest)
                      const streak = getDailyStreak(quest.id)
                      const dayLabels = getDayLabels()
                      const isDailyQuestLocked = progress.current_day === 0

                      return (
                        <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''} ${isDailyQuestLocked ? 'locked' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>

                    {/* Daily Streak Bubbles */}
                    <div className="daily-streak">
                      {dayLabels.map((label, index) => (
                        <div
                          key={index}
                          className={`streak-bubble ${streak[index] ? 'completed' : ''}`}
                          title={`Day ${index + 1}`}
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    <p className="quest-description">{renderDescription(quest.description)}</p>

                    {/* Special handling for daily release challenge */}
                    {quest.id === 'release_daily_challenge' && !completed && !isDailyQuestLocked && getDailyReleaseChallenge() && (
                      <div className="learn-more-section">
                        <button
                          className="learn-more-toggle"
                          onClick={() => toggleLearnMore(quest.id)}
                        >
                          <span>Today's Challenge</span>
                          <svg
                            className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {expandedLearnMore[quest.id] && (
                          <div className="learn-more-content">
                            {renderDailyReleaseChallenge()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Regular learn more for other quests */}
                    {quest.id !== 'release_daily_challenge' && quest.learnMore && !completed && !isDailyQuestLocked && (
                      <div className="learn-more-section">
                        <button
                          className="learn-more-toggle"
                          onClick={() => toggleLearnMore(quest.id)}
                        >
                          <span>Learn More</span>
                          <svg
                            className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {expandedLearnMore[quest.id] && (
                          <div className="learn-more-content">
                            {quest.learnMore}
                          </div>
                        )}
                      </div>
                    )}

                    {isDailyQuestLocked && (
                      <div className="quest-locked-message">
                        🔒 Unlocked on Day 1 (Tomorrow)
                      </div>
                    )}

                    {!completed && !isDailyQuestLocked && (
                      <div className="quest-input-area">
                        {quest.status === 'coming_soon' ? (
                          <button className="quest-flow-btn coming-soon" disabled>
                            Coming Soon
                          </button>
                        ) : quest.id === 'release_daily_challenge' && !healingCompassComplete ? (
                          <div className="quest-locked-container">
                            <textarea
                              className="quest-textarea"
                              placeholder={quest.placeholder}
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                              rows={3}
                              disabled
                            />
                            <button
                              className="quest-complete-btn locked"
                              disabled
                            >
                              Complete Healing Compass to Unlock
                              <span
                                className="locked-info-icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  setShowLockedTooltip(showLockedTooltip === quest.id ? null : quest.id)
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  setShowLockedTooltip(showLockedTooltip === quest.id ? null : quest.id)
                                }}
                              >
                                ⓘ
                              </span>
                            </button>
                            {showLockedTooltip === quest.id && (
                              <div className="locked-tooltip">
                                Complete the "Healing Compass" weekly quest to unlock daily release challenges
                              </div>
                            )}
                          </div>
                        ) : quest.inputType === 'flow' ? (
                          <Link to={quest.flow_route} className="quest-flow-btn">
                            {quest.id === 'recognise_nervous_system'
                              ? 'Start Mapping My Nervous System →'
                              : `Start ${quest.name} →`}
                          </Link>
                        ) : quest.inputType === 'text' ? (
                          <>
                            <textarea
                              className="quest-textarea"
                              placeholder={quest.placeholder}
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                              rows={3}
                            />
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : quest.inputType === 'conversation_log' ? (
                          <ConversationLogInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'milestone' ? (
                          <MilestoneInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'flow_compass' ? (
                          <FlowCompassInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'dropdown' ? (
                          <>
                            <select
                              className="quest-dropdown"
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            >
                              <option value="">Select an option...</option>
                              {quest.options?.map(opt => (
                                <option key={opt.value} value={opt.label}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="quest-checkbox-area">
                              <label className="quest-checkbox-label">
                                {quest.actionLink ? (
                                  <Link to={quest.actionLink} className="quest-inline-link">
                                    {quest.actionLinkText || 'View'}
                                  </Link>
                                ) : (
                                  'Mark as complete'
                                )}
                              </label>
                            </div>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {completed && (
                      <div className="quest-completed-section">
                        <div className="quest-completed-badge">
                          ✅ Completed Today
                        </div>
                        {quest.flow_route && (
                          <button
                            className="view-results-btn"
                            onClick={() => navigate(`${quest.flow_route}?results=true`)}
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )}

        {/* Weekly Quests */}
        {activeCategory === 'Weekly' && filteredQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Weekly Quests</h2>
            {['Recognise', 'Release', 'Rewire', 'Reconnect'].map(rType => {
              const rTypeQuests = filteredQuests.filter(q => q.type === rType)
              if (rTypeQuests.length === 0) return null

              return (
                <div key={rType} className="quest-subsection">
                  <h3 className="subsection-title">{rType}</h3>
                  <div className="quest-grid">
                    {rTypeQuests.map(quest => {
                      const completed = isQuestCompletedToday(quest.id, quest)
                      return (
                        <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>
                    <p className="quest-description">{renderDescription(quest.description)}</p>

                    {quest.learnMore && !completed && (
                      <div className="learn-more-section">
                        <button
                          className="learn-more-toggle"
                          onClick={() => toggleLearnMore(quest.id)}
                        >
                          <span>Learn More</span>
                          <svg
                            className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {expandedLearnMore[quest.id] && (
                          <div className="learn-more-content">
                            {quest.learnMore}
                          </div>
                        )}
                      </div>
                    )}

                    {!completed && (
                      <div className="quest-input-area">
                        {quest.status === 'coming_soon' ? (
                          <button className="quest-flow-btn coming-soon" disabled>
                            Coming Soon
                          </button>
                        ) : quest.id === 'recognise_healing_compass' && !nervousSystemComplete ? (
                          <div className="quest-locked-container">
                            <button
                              className="quest-flow-btn locked"
                              disabled
                            >
                              Locked
                              <span
                                className="locked-info-icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  setShowLockedTooltip(showLockedTooltip === quest.id ? null : quest.id)
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  setShowLockedTooltip(showLockedTooltip === quest.id ? null : quest.id)
                                }}
                              >
                                ⓘ
                              </span>
                            </button>
                            {showLockedTooltip === quest.id && (
                              <div className="locked-tooltip">
                                Complete the "Map the Boundaries of Your Nervous System" challenge above to unlock
                              </div>
                            )}
                          </div>
                        ) : quest.inputType === 'flow' ? (
                          <Link to={quest.flow_route} className="quest-flow-btn">
                            {quest.id === 'recognise_nervous_system'
                              ? 'Start Mapping My Nervous System →'
                              : `Start ${quest.name} →`}
                          </Link>
                        ) : quest.inputType === 'text' ? (
                          <>
                            <textarea
                              className="quest-textarea"
                              placeholder={quest.placeholder}
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                              rows={3}
                            />
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : quest.inputType === 'conversation_log' ? (
                          <ConversationLogInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'milestone' ? (
                          <MilestoneInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'flow_compass' ? (
                          <FlowCompassInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'dropdown' ? (
                          <>
                            <select
                              className="quest-dropdown"
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            >
                              <option value="">Select an option...</option>
                              {quest.options?.map(opt => (
                                <option key={opt.value} value={opt.label}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="quest-checkbox-area">
                              <label className="quest-checkbox-label">
                                {quest.actionLink ? (
                                  <Link to={quest.actionLink} className="quest-inline-link">
                                    {quest.actionLinkText || 'View'}
                                  </Link>
                                ) : (
                                  'Mark as complete'
                                )}
                              </label>
                            </div>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {completed && (
                      <div className="quest-completed-section">
                        <div className="quest-completed-badge">
                          ✅ Completed
                        </div>
                        {quest.flow_route && (
                          <button
                            className="view-results-btn"
                            onClick={() => navigate(`${quest.flow_route}?results=true`)}
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )}

        {/* Flow Finder Quests */}
        {activeCategory === 'Flow Finder' && filteredQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Flow Finder Quests</h2>
            <div className="quest-grid">
              {filteredQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                const locked = isQuestLocked(quest)
                return (
                  <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''} ${locked ? 'locked' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{locked ? '🔒 ' : ''}{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>

                    {/* Daily Streak Bubbles for quests with maxPerDay */}
                    {quest.maxPerDay && (
                      <div className="daily-streak">
                        {getDayLabels().map((label, index) => {
                          const streak = getDailyStreak(quest.id)
                          return (
                            <div
                              key={index}
                              className={`streak-bubble ${streak[index] ? 'completed' : ''}`}
                              title={`Day ${index + 1}`}
                            >
                              {label}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <p className="quest-description">{renderDescription(quest.description)}</p>

                    {quest.learnMore && !completed && (
                      <div className="learn-more-section">
                        <button
                          className="learn-more-toggle"
                          onClick={() => toggleLearnMore(quest.id)}
                        >
                          <span>Learn More</span>
                          <svg
                            className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {expandedLearnMore[quest.id] && (
                          <div className="learn-more-content">
                            {quest.learnMore}
                          </div>
                        )}
                      </div>
                    )}

                    {!completed && !locked && (
                      <div className="quest-input-area">
                        {quest.status === 'coming_soon' ? (
                          <button className="quest-flow-btn coming-soon" disabled>
                            Coming Soon
                          </button>
                        ) : quest.inputType === 'flow' ? (
                          <Link to={quest.flow_route} className="quest-flow-btn">
                            Start {quest.name} →
                          </Link>
                        ) : quest.inputType === 'text' ? (
                          <>
                            <textarea
                              className="quest-textarea"
                              placeholder={quest.placeholder}
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                              rows={3}
                            />
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : quest.inputType === 'conversation_log' ? (
                          <ConversationLogInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'milestone' ? (
                          <MilestoneInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'flow_compass' ? (
                          <FlowCompassInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'dropdown' ? (
                          <>
                            <select
                              className="quest-dropdown"
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            >
                              <option value="">Select an option...</option>
                              {quest.options?.map(opt => (
                                <option key={opt.value} value={opt.label}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="quest-checkbox-area">
                              <label className="quest-checkbox-label">
                                {quest.actionLink ? (
                                  <Link to={quest.actionLink} className="quest-inline-link">
                                    {quest.actionLinkText || 'View'}
                                  </Link>
                                ) : (
                                  'Mark as complete'
                                )}
                              </label>
                            </div>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {!completed && locked && (
                      <div className="quest-locked-message">
                        🔒 Complete "{getRequiredQuestName(quest.requires_quest)}" first to unlock
                      </div>
                    )}

                    {quest.counts_toward_graduation && !completed && quest.inputType !== 'conversation_log' && (
                      <p className="graduation-note">✨ Counts toward stage graduation</p>
                    )}

                    {completed && (
                      <div className="quest-completed-section">
                        <div className="quest-completed-badge">
                          ✅ Completed
                        </div>
                        {quest.flow_route && (
                          <button
                            className="view-results-btn"
                            onClick={() => navigate(`${quest.flow_route}?results=true`)}
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bonus Quests - only show if we're on the Bonus tab */}
        {activeCategory === 'Bonus' && filteredQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Bonus Quests</h2>
            <div className="quest-grid">
              {filteredQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                return (
                  <div key={quest.id} className={`quest-card bonus ${completed ? 'completed' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>
                    <p className="quest-description">{renderDescription(quest.description)}</p>

                    {quest.learnMore && !completed && (
                      <div className="learn-more-section">
                        <button
                          className="learn-more-toggle"
                          onClick={() => toggleLearnMore(quest.id)}
                        >
                          <span>Learn More</span>
                          <svg
                            className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {expandedLearnMore[quest.id] && (
                          <div className="learn-more-content">
                            {quest.learnMore}
                          </div>
                        )}
                      </div>
                    )}

                    {!completed && (
                      <div className="quest-input-area">
                        {quest.status === 'coming_soon' ? (
                          <button className="quest-flow-btn coming-soon" disabled>
                            Coming Soon
                          </button>
                        ) : quest.inputType === 'flow' ? (
                          <Link to={quest.flow_route} className="quest-flow-btn">
                            {quest.id === 'recognise_nervous_system'
                              ? 'Start Mapping My Nervous System →'
                              : `Start ${quest.name} →`}
                          </Link>
                        ) : quest.inputType === 'text' ? (
                          <>
                            <textarea
                              className="quest-textarea"
                              placeholder={quest.placeholder}
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                              rows={3}
                            />
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : quest.inputType === 'conversation_log' ? (
                          <ConversationLogInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'milestone' ? (
                          <MilestoneInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'flow_compass' ? (
                          <FlowCompassInput
                            quest={quest}
                            onComplete={(quest, data) => handleQuestComplete(quest, data)}
                          />
                        ) : quest.inputType === 'dropdown' ? (
                          <>
                            <select
                              className="quest-dropdown"
                              value={questInputs[quest.id] || ''}
                              onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                            >
                              <option value="">Select an option...</option>
                              {quest.options?.map(opt => (
                                <option key={opt.value} value={opt.label}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="quest-checkbox-area">
                              <label className="quest-checkbox-label">
                                {quest.actionLink ? (
                                  <Link to={quest.actionLink} className="quest-inline-link">
                                    {quest.actionLinkText || 'View'}
                                  </Link>
                                ) : (
                                  'Mark as complete'
                                )}
                              </label>
                            </div>
                            <button
                              className="quest-complete-btn"
                              onClick={() => handleQuestComplete(quest)}
                            >
                              Complete Quest
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {completed && (
                      <div className="quest-completed-section">
                        <div className="quest-completed-badge">
                          ✅ Completed
                        </div>
                        {quest.flow_route && (
                          <button
                            className="view-results-btn"
                            onClick={() => navigate(`${quest.flow_route}?results=true`)}
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tracker Quests */}
        {activeCategory === 'Tracker' && (
          <div className="quest-section">
            <h2 className="section-title">Flow Compass</h2>
            {filteredQuests.length === 0 ? (
              <div className="empty-category">
                <p>Track your flow activities here.</p>
              </div>
            ) : (
              <div className="quest-grid">
                {filteredQuests.map(quest => {
                  const completed = isQuestCompletedToday(quest.id, quest)
                  const streak = getDailyStreak(quest.id)
                  const dayLabels = getDayLabels()

                  return (
                    <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''}`}>
                      <div className="quest-header">
                        <h3 className="quest-name">{quest.name}</h3>
                        <span className="quest-points">+{quest.points} pts</span>
                      </div>

                      {/* Daily Streak Bubbles for daily tracker */}
                      {quest.type === 'Daily' && (
                        <div className="daily-streak">
                          {dayLabels.map((label, index) => (
                            <div
                              key={index}
                              className={`streak-bubble ${streak[index] ? 'completed' : ''}`}
                              title={`Day ${index + 1}`}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="quest-description">{renderDescription(quest.description)}</p>

                      {quest.learnMore && !completed && (
                        <div className="learn-more-section">
                          <button
                            className="learn-more-toggle"
                            onClick={() => toggleLearnMore(quest.id)}
                          >
                            <span>Learn More</span>
                            <svg
                              className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M4 6L8 10L12 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          {expandedLearnMore[quest.id] && (
                            <div className="learn-more-content">
                              {quest.learnMore}
                            </div>
                          )}
                        </div>
                      )}

                      {!completed && (
                        <div className="quest-input-area">
                          {quest.inputType === 'flow_compass' ? (
                            <FlowCompassInput
                              quest={quest}
                              onComplete={(quest, data) => handleQuestComplete(quest, data)}
                            />
                          ) : quest.inputType === 'dropdown' ? (
                            <>
                              <select
                                className="quest-dropdown"
                                value={questInputs[quest.id] || ''}
                                onChange={(e) => setQuestInputs(prev => ({ ...prev, [quest.id]: e.target.value }))}
                              >
                                <option value="">Select an option...</option>
                                {quest.options?.map(opt => (
                                  <option key={opt.value} value={opt.label}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="quest-complete-btn"
                                onClick={() => handleQuestComplete(quest)}
                              >
                                Complete Quest
                              </button>
                            </>
                          ) : quest.status === 'coming_soon' ? (
                            <button className="quest-flow-btn coming-soon" disabled>
                              Coming Soon
                            </button>
                          ) : (
                            <>
                              <div className="quest-checkbox-area">
                                <label className="quest-checkbox-label">
                                  Mark as complete
                                </label>
                              </div>
                              <button
                                className="quest-complete-btn"
                                onClick={() => handleQuestComplete(quest)}
                              >
                                Complete Quest
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {completed && (
                        <div className="quest-completed-section">
                          <div className="quest-completed-badge">
                            ✅ Completed {quest.type === 'Daily' ? 'Today' : ''}
                          </div>
                          {quest.flow_route && (
                            <button
                              className="view-results-btn"
                              onClick={() => navigate(`${quest.flow_route}?results=true`)}
                            >
                              View Results
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </>
      )}
      </div>
    </div>
  )
}

export default Challenge
