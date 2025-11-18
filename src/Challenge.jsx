import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { supabase } from './lib/supabaseClient'
import { sanitizeText } from './lib/sanitize'
import './Challenge.css'

function Challenge() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Recognise')
  const [challengeData, setData] = useState(null)
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
  const [expandedLearnMore, setExpandedLearnMore] = useState({}) // Track which quest's learn more is expanded

  const categories = ['Recognise', 'Release', 'Rewire', 'Reconnect', 'Bonus']

  useEffect(() => {
    loadChallengeData()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserProgress()
      loadLeaderboard()
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user?.email) return

    try {
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        setUserData(data[0])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  useEffect(() => {
    if (user && progress) {
      loadLeaderboard()
      loadGroupInfo()
    }
  }, [leaderboardView, progress])

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
      const response = await fetch('/challengeQuests.json')
      const data = await response.json()
      setData(data)
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

      // Get session_id from lead_flow_profiles
      const { data: profileData } = await supabase
        .from('lead_flow_profiles')
        .select('session_id')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const sessionId = profileData?.session_id || `session_${Date.now()}`

      // Generate new challenge instance ID
      const challengeInstanceId = crypto.randomUUID()

      const insertData = {
        user_id: user.id,
        session_id: sessionId,
        challenge_instance_id: challengeInstanceId,
        current_day: 0,
        status: 'active',
        challenge_start_date: new Date().toISOString(),
        last_active_date: new Date().toISOString()
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

  const toggleLearnMore = (questId) => {
    setExpandedLearnMore(prev => ({
      ...prev,
      [questId]: !prev[questId]
    }))
  }

  const handleQuestComplete = async (quest) => {
    const inputValue = questInputs[quest.id]

    // Validate input
    if (quest.inputType === 'text' && (!inputValue || inputValue.trim() === '')) {
      alert('Please enter your reflection before completing this quest.')
      return
    }

    // Sanitize reflection text
    const sanitizedReflection = inputValue ? sanitizeText(inputValue) : null

    try {
      // Create quest completion
      const { error: completionError } = await supabase
        .from('quest_completions')
        .insert([{
          user_id: user.id,
          challenge_instance_id: progress.challenge_instance_id,
          quest_id: quest.id,
          quest_category: quest.category,
          quest_type: quest.type,
          points_earned: quest.points,
          reflection_text: sanitizedReflection,
          challenge_day: progress.current_day
        }])

      if (completionError) {
        console.error('Error completing quest:', completionError)
        alert('Error completing quest. Please try again.')
        return
      }

      // Calculate new points
      const categoryLower = quest.category.toLowerCase()
      const typeKey = quest.type === 'daily' ? 'daily' : 'weekly'

      // Handle Bonus category specially (no bonus_*_points columns in DB)
      const isBonus = quest.category === 'Bonus'
      const pointsField = isBonus ? null : `${categoryLower}_${typeKey}_points`

      const newCategoryPoints = isBonus ? 0 : (progress[pointsField] || 0) + quest.points
      const newTotalPoints = (progress.total_points || 0) + quest.points

      // Check artifact unlock conditions (not applicable for Bonus)
      const artifacts = challengeData?.artifacts || []
      const categoryArtifact = artifacts.find(a => a.category === quest.category)
      const artifactUnlocked = categoryArtifact ? checkArtifactUnlock(quest.category, newCategoryPoints, typeKey) : false

      // Update progress
      const updateData = {
        total_points: newTotalPoints,
        last_active_date: new Date().toISOString()
      }

      // Only add category points field if not Bonus
      if (!isBonus && pointsField) {
        updateData[pointsField] = newCategoryPoints
      }

      if (artifactUnlocked && categoryArtifact) {
        const artifactKey = `${categoryArtifact.id}_unlocked`
        updateData[artifactKey] = true
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

      // Show success message
      if (artifactUnlocked) {
        alert(`🎉 Quest complete! +${quest.points} points\n\n✨ You unlocked the ${categoryArtifact.name}!`)
      } else {
        alert(`✅ Quest complete! +${quest.points} points`)
      }
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

  const getCategoryPoints = (category) => {
    if (!progress) return { daily: 0, weekly: 0, total: 0 }

    const categoryLower = category.toLowerCase()
    const daily = progress[`${categoryLower}_daily_points`] || 0
    const weekly = progress[`${categoryLower}_weekly_points`] || 0

    return { daily, weekly, total: daily + weekly }
  }

  const getPointsToday = (category) => {
    if (!completions || completions.length === 0) return 0

    const today = new Date().setHours(0, 0, 0, 0)

    // Filter completions for this category that were completed today
    const todayCompletions = completions.filter(c => {
      const completionDate = new Date(c.completed_at).setHours(0, 0, 0, 0)
      return c.quest_category === category && completionDate === today
    })

    // Sum up the points
    return todayCompletions.reduce((sum, completion) => sum + (completion.points_earned || 0), 0)
  }

  const getArtifactProgress = (category) => {
    if (!challengeData) return null

    const artifact = challengeData.artifacts.find(a => a.category === category)
    if (!artifact) return null

    const points = getCategoryPoints(category)
    const unlocked = progress?.[`${artifact.id}_unlocked`] || false

    return {
      ...artifact,
      currentDaily: points.daily,
      currentWeekly: points.weekly,
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

  const filteredQuests = challengeData?.quests.filter(q => q.category === activeCategory) || []
  const dailyQuests = filteredQuests.filter(q => q.type === 'daily')
  const weeklyQuests = filteredQuests.filter(q => q.type === 'weekly')
  const bonusQuests = challengeData?.quests.filter(q => q.category === 'Bonus') || []

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
      <header className="challenge-header">
        <div className="challenge-header-top">
          <h1>Gamify Your Ambitions</h1>
          <div className="challenge-header-badges">
            <div className="challenge-day">
              Day {progress.current_day}/7
              {progress.current_day === 7 && (
                <span className="challenge-complete-badge">Complete! 🎉</span>
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
          </div>
        </div>

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

            {groupCode && (
              <div className="group-code-display">
                Group Code: <strong>{groupCode}</strong>
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
              <h3>{artifactProgress.unlocked ? getArtifactEmoji(activeCategory) : '🔒'} {artifactProgress.name}</h3>
              <p className="artifact-description">{artifactProgress.description}</p>
            </div>

            {!artifactProgress.unlocked && (
              <div className="artifact-bars">
                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Daily Points</span>
                    <span>{artifactProgress.currentDaily}/{artifactProgress.dailyPointsRequired}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill daily"
                      style={{ width: `${Math.min((artifactProgress.currentDaily / artifactProgress.dailyPointsRequired) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Weekly Points</span>
                    <span>{artifactProgress.currentWeekly}/{artifactProgress.weeklyPointsRequired}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill weekly"
                      style={{ width: `${Math.min((artifactProgress.currentWeekly / artifactProgress.weeklyPointsRequired) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
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

        {/* Daily Quests */}
        {dailyQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Daily Quests</h2>
            <div className="quest-grid">
              {dailyQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                const streak = getDailyStreak(quest.id)
                const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

                return (
                  <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''}`}>
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

                    <p className="quest-description">{quest.description}</p>

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
                      <div className="quest-completed-badge">
                        ✅ Completed Today
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Weekly Quests */}
        {weeklyQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Weekly Quests</h2>
            <div className="quest-grid">
              {weeklyQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                return (
                  <div key={quest.id} className={`quest-card ${completed ? 'completed' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>
                    <p className="quest-description">{quest.description}</p>

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
                      <div className="quest-completed-badge">
                        ✅ Completed
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bonus Quests - only show if we're on the Bonus tab */}
        {activeCategory === 'Bonus' && bonusQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Bonus Quests</h2>
            <div className="quest-grid">
              {bonusQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                return (
                  <div key={quest.id} className={`quest-card bonus ${completed ? 'completed' : ''}`}>
                    <div className="quest-header">
                      <h3 className="quest-name">{quest.name}</h3>
                      <span className="quest-points">+{quest.points} pts</span>
                    </div>
                    <p className="quest-description">{quest.description}</p>

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
                      <div className="quest-completed-badge">
                        ✅ Completed
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}

export default Challenge
