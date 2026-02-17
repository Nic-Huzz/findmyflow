import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { sanitizeText } from './lib/sanitize'
import { trackGroanCompleted } from './lib/analytics'
import confetti from 'canvas-confetti'
import { triggerSideCannons, MicroToast } from './components/Celebrations'
import WeeklyRecapCard from './components/WeeklyRecapCard'
import GraduationModal from './components/GraduationModal'
import NotificationPrompt from './components/NotificationPrompt'
import PortalExplainer from './components/PortalExplainer'
import ChallengeProjectSelector from './components/ChallengeProjectSelector'
import ChallengeStageTabs from './components/ChallengeStageTabs'
import ChallengeHeader from './components/ChallengeHeader'
import ChallengeOnboarding from './components/ChallengeOnboarding'
import './components/ChallengeFilters.css' // R-type chips + frequency tabs styles (used inline now)
import QuestCard from './components/QuestCard'
import HorizontalFlowRiver from './components/HorizontalFlowRiver'
import GroansSummary from './components/GroansSummary'
import HealingSummary from './components/HealingSummary'
import WeeklyPlanningFlow from './components/WeeklyPlanningFlow'
import GroanMatrix from './components/GroanMatrix'
import PostActionModal, { POST_ACTION_MILESTONE_IDS } from './components/PostActionModal'
import PreActionModal, { PRE_ACTION_MILESTONE_IDS } from './components/PreActionModal'
import { createGroanChallenge, createSkillProblemChallenge, acceptGroanChallenge, completeGroanChallenge } from './lib/crm'
import { useChallengeData } from './hooks/useChallengeData'
import { useLeagueData } from './hooks/useLeagueData'
import { useMatchupData } from './hooks/useMatchupData'
import { normalizePersona } from './data/personaProfiles'
import { convertLegacyStage, GROAN_VISIBILITY_LAYERS, getLayerLockStatus, getStageConfig } from './lib/stageConfig'
import { generateVoiceQuestsForStage } from './lib/voiceQuestConfig'
import { getScoringCategory } from './lib/scoringCategories'
import ContentChallenges from './components/ContentChallenges'
import WhatsAppErrorButton from './components/WhatsAppErrorButton'
import SplinterCheckin from './components/SplinterCheckin'
import { preloadChallengeFlows } from './lib/preloadRoutes'
import './Challenge.css'

// Confetti celebration for quest completion
const triggerConfetti = (event) => {
  const rect = event?.target?.getBoundingClientRect()
  const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5
  const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5

  confetti({
    particleCount: 80,
    spread: 60,
    origin: { x, y },
    colors: ['#ff0000', '#ff7700', '#ffdd00', '#00ff00', '#0099ff', '#6633ff', '#ff00ff'],
    ticks: 150,
    gravity: 1.2,
    scalar: 0.9,
    drift: 0
  })
}

function Challenge() {
  // Get all state and functions from the hook
  const {
    user,
    navigate,
    loading,
    activeCategory,
    setActiveCategory,
    activeRTypeFilter,
    setActiveRTypeFilter,
    activeFrequencyFilter,
    setActiveFrequencyFilter,
    showOnboarding,
    onboardingScreen,
    setOnboardingScreen,
    showGroupSelection,
    showProjectSelector,
    setShowProjectSelector,
    showSettingsMenu,
    setShowSettingsMenu,
    showExplainer,
    showLockedTooltip,
    setShowLockedTooltip,
    expandedLearnMore,
    settingsMenuRef,
    challengeData,
    progress,
    setProgress,
    completions,
    setCompletions,
    questInputs,
    setQuestInputs,
    userData,
    stageProgress,
    groupCode,
    groupCodeInput,
    setGroupCodeInput,
    leaderboard,
    leaderboardView,
    setLeaderboardView,
    currentWeeklyPoints,
    loadUserScores,
    nervousSystemComplete,
    safetyContracts,
    healingCompassComplete,
    pastParallelStory,
    healingCompassId,
    flowFinderComplete,
    validationResponseCounts,
    loadValidationResponseCounts,
    selectedProject,
    setSelectedProject,
    activeStageTab,
    setActiveStageTab,
    projectStage,
    setProjectStage,
    businessSubTab,
    setBusinessSubTab,
    healingSubTab,
    setHealingSubTab,
    bonusSubTab,
    setBonusSubTab,
    userArchetypes,
    weeklyPlan,
    showWeeklyPlanning,
    setShowWeeklyPlanning,
    isSunday,
    getWeekStart,
    getWeekLabel,
    handleWeeklyPlanComplete,
    completeWeeklyGroan,
    isQuestPlanned,
    getPlannedDay,
    categories,
    BONUS_PERCENTAGE,
    loadStageProgress,
    showGroupSelectionModal,
    handlePlaySolo,
    handleCreateGroup,
    handleJoinGroup,
    handleProjectSelected,
    handleCloseExplainer,
    handleOpenExplainer,
    isQuestCompletedToday,
    isQuestLocked,
    getRequiredQuestName,
    toggleLearnMore,
    getCategoryPoints,
    getPointsToday,
    getCompletedStages,
    checkArtifactUnlock,
    getArtifactProgress,
    getTabCompletionStatus,
    awardTabCompletionBonus,
    getDailyStreak,
    getDayLabels,
    getDailyReleaseChallenge,
    getConsecutiveStreakDays,
    handleConversationLogCompletion,
    handleMilestoneCompletion,
    handleFlowCompassCompletion,
    handleGroanReflectionCompletion,
    handleValidationAnalysisCompletion,
    handleStreakUpdate,
    checkAndGraduateProject
  } = useChallengeData()

  // League data for nudge banner + content challenges
  const {
    leagueExists, isOnTeam, league, userTeam, teams, standings,
    getCurrentWeek, getWeekMatchups, fetchLiveTeamScores,
    reloadContent, contentSubmissions
  } = useLeagueData()

  // Fantasy category scores + opponent matchup data for header
  const { categoryScores, matchupData, matchupLoading, flipEvent, clearFlipEvent, recapData } = useMatchupData({
    completions,
    userTeam, league, teams,
    getCurrentWeek, getWeekMatchups, fetchLiveTeamScores,
  })

  // State for tracking recently completed quest for animation
  const [justCompletedQuestId, setJustCompletedQuestId] = useState(null)

  // Guard against double-click on quest completion
  const [completingQuestId, setCompletingQuestId] = useState(null)

  // Search state for filtering quests
  const [searchQuery, setSearchQuery] = useState('')

  // State for showing hidden (non-planned) reconnect quests
  const [showHiddenReconnect, setShowHiddenReconnect] = useState(false)

  // State for selected groan challenge modal
  const [selectedGroanChallenge, setSelectedGroanChallenge] = useState(null)

  // State for POST-ACTION modal (3% reflection after completing milestones)
  const [postActionQuest, setPostActionQuest] = useState(null)
  const [splinterCheckinData, setSplinterCheckinData] = useState(null)

  // State for PRE-ACTION modal (resistance capture before starting milestones)
  const [preActionQuest, setPreActionQuest] = useState(null)
  const [preActionPendingData, setPreActionPendingData] = useState(null)
  const [groanChallengeLoading, setGroanChallengeLoading] = useState(false)
  const [groanReflectionStep, setGroanReflectionStep] = useState(false)
  const [groanReflection, setGroanReflection] = useState({ scaryScore: 5, wahooScore: 5, reflection: '' })
  const [groanMatrixKey, setGroanMatrixKey] = useState(0) // Used to force matrix refresh
  const [customChallengeText, setCustomChallengeText] = useState('')
  const [groanCellContext, setGroanCellContext] = useState(null) // Cell data when opening popup without a challenge

  // Graduation modal state
  const [graduationModal, setGraduationModal] = useState({ isOpen: false, celebration: null })
  const graduationCheckedRef = useRef(false)

  // Check graduation on mount (catches completions from flow navigation)
  useEffect(() => {
    if (!selectedProject?.id || !user?.id || !progress?.challenge_instance_id || graduationCheckedRef.current) return
    graduationCheckedRef.current = true

    const checkGraduation = async () => {
      try {
        const result = await checkAndGraduateProject(
          user.id,
          selectedProject.id,
          progress.challenge_instance_id
        )
        if (result?.graduated) {
          setGraduationModal({
            isOpen: true,
            celebration: result.celebration_message
          })
          triggerSideCannons()
          setSelectedProject(prev => ({
            ...prev,
            current_stage: result.new_stage
          }))
          setProjectStage(result.new_stage)
          setActiveStageTab(result.new_stage)
        }
      } catch (e) {
        console.warn('Graduation check on mount failed:', e)
      }
    }
    checkGraduation()
  }, [selectedProject?.id, user?.id, progress?.challenge_instance_id])

  // Manage hide-bottom-toolbar class via useEffect (not in render path)
  useEffect(() => {
    if (showProjectSelector) {
      document.body.classList.add('hide-bottom-toolbar')
    } else {
      document.body.classList.remove('hide-bottom-toolbar')
    }
    return () => document.body.classList.remove('hide-bottom-toolbar')
  }, [showProjectSelector])

  // Preload flow chunks on idle so "Start" taps are instant
  useEffect(() => { preloadChallengeFlows() }, [])

  // Morning reconnect quest IDs that can be hidden if not planned
  const MORNING_RECONNECT_QUEST_IDS = [
    'reconnect_morning_meditation',
    'reconnect_morning_breathwork',
    'reconnect_morning_dance'
  ]

  // Helper function to render quest descriptions with markdown links
  const renderDescription = (description) => {
    if (!description) return null

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(description)) !== null) {
      if (match.index > lastIndex) {
        parts.push(description.slice(lastIndex, match.index))
      }
      parts.push(
        <Link key={match.index} to={match[2]} className="quest-inline-link">
          {match[1]}
        </Link>
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < description.length) {
      parts.push(description.slice(lastIndex))
    }

    return parts.length > 0 ? parts : description
  }

  // Helper for updating quest inputs
  const handleInputChange = (questId, value) => {
    setQuestInputs(prev => ({ ...prev, [questId]: value }))
  }

  // Render the daily release challenge content
  const renderDailyReleaseChallenge = () => {
    const challenge = getDailyReleaseChallenge()
    if (!challenge) return null

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
              Watch Guided Meditation
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

  // Main quest completion handler
  const handleQuestComplete = async (quest, specialData = null, event = null) => {
    // Guard against double-clicks / rapid submissions
    if (completingQuestId) return
    setCompletingQuestId(quest.id)

    try {
      const inputValue = specialData || questInputs[quest.id]

      // Check for PRE-ACTION milestones - show modal BEFORE completing
      if (PRE_ACTION_MILESTONE_IDS.includes(quest.id) && !preActionPendingData) {
        setPreActionQuest(quest)
        setPreActionPendingData({ quest, specialData, event })
        return // Wait for modal to complete
      }

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

      if (quest.type === 'groan' && !specialData) {
        alert('Please complete the groan reflection form.')
        return
      }

      if (quest.inputType === 'dropdown' && (!inputValue || inputValue.trim() === '')) {
        alert('Please select an option before completing this quest.')
        return
      }

      if (quest.inputType === 'text_with_tags') {
        const textValue = typeof inputValue === 'object' ? inputValue?.text : inputValue
        if (!textValue || textValue.trim() === '') {
          alert('Please enter your response before completing this quest.')
          return
        }
      }

      if (quest.inputType === 'lets_play_review' && !specialData) {
        alert('Please complete the quest form.')
        return
      }

      // Handle text_with_tags input type (has object with text and tags)
      let sanitizedReflection = null
      if (quest.inputType === 'text_with_tags' && inputValue) {
        const textValue = typeof inputValue === 'object' ? inputValue.text : inputValue
        const tags = typeof inputValue === 'object' ? inputValue.tags : []
        sanitizedReflection = JSON.stringify({
          text: sanitizeText(textValue || ''),
          tags: tags || []
        })
      } else if ((quest.inputType === 'text' || quest.inputType === 'dropdown') && inputValue) {
        sanitizedReflection = sanitizeText(inputValue)
      }
      // Handle special quest types BEFORE creating quest completion
      if (quest.inputType === 'conversation_log') {
        const result = await handleConversationLogCompletion(
          user.id,
          progress.challenge_instance_id,
          specialData,
          stageProgress,
          quest,
          selectedProject?.id
        )

        if (!result.success) {
          alert(`Error logging conversation: ${result.error}`)
          return
        }

        await loadStageProgress()
      }

      if (quest.inputType === 'milestone') {
        const result = await handleMilestoneCompletion(
          user.id,
          specialData,
          stageProgress,
          userData?.persona,
          selectedProject?.id
        )

        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed this milestone!')
          } else {
            alert(`Error saving milestone: ${result.error}`)
          }
          return
        }

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
      }

      // Handle validation_responses quests (AI analysis)
      if (quest.inputType === 'validation_responses') {
        const result = await handleValidationAnalysisCompletion(
          user.id,
          specialData,
          stageProgress,
          selectedProject?.id
        )

        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed validation analysis!')
            return
          } else {
            alert(`Error saving validation analysis: ${result.error}`)
            return
          }
        }

        await loadStageProgress()
      }

      // Handle groan type quests
      if (quest.type === 'groan' && specialData) {
        const groanReflectionData = {
          ...specialData,
          project_id: selectedProject?.id || null,
          challenge_instance_id: progress.challenge_instance_id,
          quest_category: quest.category,
          stage: quest.stage_required || projectStage || null
        }

        const result = await handleGroanReflectionCompletion(
          user.id,
          groanReflectionData,
          null
        )

        if (!result.success) {
          alert(`Error saving groan reflection: ${result.error}`)
          return
        }

        // Mark weekly groan as completed in weekly plan
        await completeWeeklyGroan()

        // Track analytics
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        trackGroanCompleted({
          weekType: weeklyPlan?.week_type || 'unknown',
          dayPlanned: weeklyPlan?.weekly_groan_day || 'unknown',
          dayCompleted: today
        })

        if (quest.milestone_type) {
          const milestoneData = {
            milestone_type: quest.milestone_type,
            evidence_text: specialData.groan_task || 'Completed groan challenge'
          }

          const milestoneResult = await handleMilestoneCompletion(
            user.id,
            milestoneData,
            stageProgress,
            userData?.persona,
            selectedProject?.id
          )

          if (!milestoneResult.success && !milestoneResult.alreadyCompleted) {
            console.warn('Failed to save groan milestone:', milestoneResult.error)
          }
        }
      }

      // Handle checkbox quests with milestone_type
      if (quest.inputType === 'checkbox' && quest.milestone_type) {
        const milestoneData = {
          milestone_type: quest.milestone_type,
          evidence_text: 'Completed via checkbox'
        }

        const result = await handleMilestoneCompletion(
          user.id,
          milestoneData,
          stageProgress,
          userData?.persona,
          selectedProject?.id
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

        await loadStageProgress()
      }

      // Handle text quests with milestone_type
      if (quest.inputType === 'text' && quest.milestone_type) {
        const milestoneData = {
          milestone_type: quest.milestone_type,
          evidence_text: sanitizedReflection || 'Completed via text input'
        }

        const result = await handleMilestoneCompletion(
          user.id,
          milestoneData,
          stageProgress,
          userData?.persona,
          selectedProject?.id
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
        challenge_day: progress.current_day,
        project_id: selectedProject?.id || null,
        stage: quest.stage_required || null
      }

      // Make Healing completions user-level (like Flow Finder)
      if (quest.category === 'Healing') {
        completionData.challenge_instance_id = null
        completionData.project_id = null
        completionData.challenge_day = 0  // NOT NULL constraint requires a value
      }

      // Quest types that use specialized input components with structured data
      const structuredDataTypes = ['reconnect', 'recognise', 'rewire', 'release']
      const hasStructuredData = structuredDataTypes.includes(quest.type?.toLowerCase()) && specialData

      // Helper to safely stringify data (avoid double-stringification)
      const safeStringify = (data) => {
        if (typeof data === 'string') return data
        return JSON.stringify(data)
      }

      if (quest.inputType === 'text' || quest.inputType === 'dropdown' || quest.inputType === 'text_with_tags') {
        // For quests with specialized inputs, use the structured specialData
        if (hasStructuredData) {
          completionData.reflection_text = safeStringify(specialData)
        } else {
          completionData.reflection_text = sanitizedReflection
        }
      } else if (quest.inputType === 'lets_play_review') {
        completionData.reflection_text = safeStringify(specialData)
      } else if (quest.inputType === 'conversation_log' || quest.inputType === 'milestone' || quest.inputType === 'flow_compass') {
        completionData.reflection_text = safeStringify(specialData)
      } else if (quest.type === 'groan' && specialData) {
        completionData.reflection_text = specialData.groan_task || safeStringify(specialData)
      } else if (hasStructuredData) {
        // Fallback for any other quests with specialized input components
        completionData.reflection_text = safeStringify(specialData)
      }

      // Check for duplicate completions
      // Use local date for user's timezone consistency
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      let duplicateQuery
      if (quest.category === 'Healing') {
        // User-level: check by user + quest + date (no challenge instance)
        duplicateQuery = supabase
          .from('quest_completions')
          .select('id')
          .eq('user_id', user.id)
          .is('challenge_instance_id', null)
          .eq('quest_id', quest.id)
      } else {
        // Challenge-level: existing behavior
        duplicateQuery = supabase
          .from('quest_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('challenge_instance_id', progress.challenge_instance_id)
          .eq('quest_id', quest.id)
      }

      if (!quest.milestone_type) {
        duplicateQuery = duplicateQuery
          .gte('completed_at', todayStart.toISOString())
          .lte('completed_at', todayEnd.toISOString())
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

      // Update new scoring tables via RPC
      const scoringCategory = getScoringCategory(quest.category)
      try {
        await supabase.rpc('increment_scores', {
          p_user_id: user.id,
          p_project_id: null, // User-level scores (not project-specific)
          p_category: scoringCategory,
          p_points: quest.points,
          p_week_start: getWeekStart() // Pass client's week start for timezone consistency
        })
        // Refresh user's scores from new tables
        await loadUserScores()
      } catch (scoreError) {
        console.error('Error updating scores:', scoreError)
        // Non-fatal - continue with quest completion
      }

      // Calculate points (used by challenge_progress update and artifact check)
      const rType = quest.type?.toLowerCase()
      const frequencyKey = quest.frequency === 'weekly' ? 'weekly' : 'daily'
      const newTotalPoints = (progress.total_points || 0) + quest.points

      // Track fresh progress for tab bonus check (avoids stale closure after setProgress)
      let updatedProgress = progress

      // User-level quests (Healing) skip challenge_progress and project updates.
      // Their scoring is handled entirely by increment_scores RPC above.
      if (quest.category !== 'Healing') {
        await handleStreakUpdate(user.id, progress.challenge_instance_id)

        const rTypesWithColumns = ['recognise', 'release', 'rewire', 'reconnect']
        const hasPointsColumn = rTypesWithColumns.includes(rType)

        const updateData = {
          total_points: newTotalPoints,
          last_active_date: new Date().toISOString()
        }

        if (hasPointsColumn) {
          const pointsField = `${rType}_${frequencyKey}_points`
          updateData[pointsField] = (progress[pointsField] || 0) + quest.points
        }

        const { data: freshProgress, error: progressError } = await supabase
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

        updatedProgress = freshProgress
        setProgress(updatedProgress)

        // Update project points to match challenge total (keeps them in sync)
        if (selectedProject?.id) {
          const { error: projectError } = await supabase
            .from('user_projects')
            .update({
              total_points: newTotalPoints
            })
            .eq('id', selectedProject.id)

          if (projectError) {
            console.error('Error updating project points:', projectError)
          } else {
            setSelectedProject(prev => ({
              ...prev,
              total_points: newTotalPoints
            }))
          }
        }
      }

      // Reload completions - merge challenge-specific + user-level (Flow Finder, Healing)
      const [challengeResult, userLevelResult] = await Promise.all([
        supabase
          .from('quest_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_instance_id', progress.challenge_instance_id),
        supabase
          .from('quest_completions')
          .select('*')
          .eq('user_id', user.id)
          .is('challenge_instance_id', null)
      ])

      // Capture merged completions in local var so tab bonus check uses fresh data
      // (setCompletions doesn't update the closure variable until next render)
      let freshCompletions = completions
      if (challengeResult.error || userLevelResult.error) {
        if (challengeResult.error) console.error('Error reloading challenge completions:', challengeResult.error)
        if (userLevelResult.error) console.error('Error reloading user-level completions:', userLevelResult.error)
        // Don't reset completions on error - keep existing state
      } else {
        freshCompletions = [
          ...(userLevelResult.data || []),
          ...(challengeResult.data || [])
        ]
        setCompletions(freshCompletions)
      }
      setQuestInputs(prev => ({ ...prev, [quest.id]: '' }))

      // Check for artifact unlock
      const categoryArtifact = challengeData?.artifacts?.find(a => a.category === quest.category)
      const artifactUnlocked = categoryArtifact && checkArtifactUnlock(quest.category, newTotalPoints, frequencyKey)

      let successMessage = `Quest complete! +${quest.points} XP`

      if (quest.counts_toward_graduation) {
        successMessage += '\nProgress toward graduation!'
      }

      if (artifactUnlocked && categoryArtifact) {
        successMessage = `Quest complete! +${quest.points} XP\n\nYou unlocked the ${categoryArtifact.name}!`
      }

      triggerConfetti(event)

      // Set just completed for animation, clear after 3 seconds
      setJustCompletedQuestId(quest.id)
      setTimeout(() => setJustCompletedQuestId(null), 3000)

      alert(successMessage)

      // Trigger POST-ACTION modal for specific milestones (3% reflection)
      if (POST_ACTION_MILESTONE_IDS.includes(quest.id)) {
        setPostActionQuest(quest)
      }

      // Trigger Splinter Check-in after non-gateway Healing quest completions
      if (quest.category === 'Healing' && quest.healing_checkin && healingCompassId) {
        loadLatestSplinterState(user.id, healingCompassId).then(splinterState => {
          if (splinterState) {
            setSplinterCheckinData({ ...splinterState, questId: quest.id })
          }
        })
      }

      // Check for tab completion bonus (skip for user-level Healing — bonus writes to challenge_progress)
      // Use freshCompletions + updatedProgress to avoid stale closure values
      if (quest.category !== 'Healing') {
        const tabStatus = getTabCompletionStatus(quest.category, freshCompletions, updatedProgress)
        if (tabStatus.isComplete && !tabStatus.bonusAwarded && tabStatus.bonusPoints > 0) {
          await awardTabCompletionBonus(quest.category, tabStatus.bonusPoints, updatedProgress)
        }
      }

      // Check for project graduation
      if (selectedProject?.id && progress?.challenge_instance_id) {
        try {
          const graduationResult = await checkAndGraduateProject(
            user.id,
            selectedProject.id,
            progress.challenge_instance_id
          )

          if (graduationResult.graduated) {
            setTimeout(() => {
              setGraduationModal({
                isOpen: true,
                celebration: graduationResult.celebration_message
              })
              triggerSideCannons()
            }, 600)

            setSelectedProject(prev => ({
              ...prev,
              current_stage: graduationResult.new_stage
            }))
            setProjectStage(graduationResult.new_stage)
            setActiveStageTab(graduationResult.new_stage)
          }
        } catch (gradError) {
          console.error('Error checking graduation:', gradError)
        }
      }
    } catch (error) {
      console.error('Error in handleQuestComplete:', error)
      alert('Error completing quest. Please try again.')
    } finally {
      setCompletingQuestId(null)
    }
  }

  // Load latest splinter state for check-in modal (checks healing_checkins first, falls back to compass response)
  const loadLatestSplinterState = async (userId, compassId) => {
    try {
      // Check for most recent check-in first
      const { data: checkin } = await supabase
        .from('healing_checkins')
        .select('splinter_location, splinter_shape, splinter_size, splinter_color, splinter_texture, splinter_movement, need_intensity')
        .eq('healing_compass_id', compassId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checkin) {
        return { ...checkin, healingCompassId: compassId }
      }

      // Fall back to original compass response
      const { data: compass } = await supabase
        .from('healing_compass_responses')
        .select('splinter_location, splinter_shape, splinter_size, splinter_color, splinter_texture, splinter_movement, need_ratings, primary_need')
        .eq('id', compassId)
        .maybeSingle()

      if (compass) {
        const primaryRating = compass.need_ratings?.[compass.primary_need]
        return { ...compass, need_intensity: primaryRating || 5, healingCompassId: compassId }
      }
      return null
    } catch (err) {
      console.error('Error loading splinter state:', err)
      return null
    }
  }

  // Handler for generating challenges from the Groan Matrix
  const handleGenerateChallenge = async (cellData) => {
    try {
      // Check if this is a Skill × Problem request
      const isSkillProblem = cellData.sourceType === 'skill_x_problem'

      // Build the request body based on challenge type
      const requestBody = isSkillProblem
        ? {
            sourceType: 'skill_x_problem',
            skillId: cellData.skillId,
            skillLabel: cellData.skillLabel,
            skillInsight: cellData.skillInsight || '',
            problemId: cellData.problemId,
            problemLabel: cellData.problemLabel,
            problemInsight: cellData.problemInsight || '',
            personaId: cellData.personaId || null,
            personaLabel: cellData.personaLabel || null,
            personaInsight: cellData.personaInsight || null
          }
        : {
            sourceType: cellData.sourceType,
            sourceLabel: cellData.sourceLabel,
            sourceInsight: cellData.sourceInsight || '',
            visibilityLayer: cellData.visibilityLayer
          }

      const { data, error } = await supabase.functions.invoke('groan-challenge-generator', {
        body: requestBody
      })

      if (error) {
        console.error('Edge function error details:', error)
        throw error
      }

      if (data?.title) {
        // Save the generated challenge based on type
        if (isSkillProblem) {
          const { error: saveError } = await createSkillProblemChallenge({
            userId: user.id,
            title: data.title,
            description: data.description,
            skillId: cellData.skillId,
            skillLabel: cellData.skillLabel,
            problemId: cellData.problemId,
            problemLabel: cellData.problemLabel,
            personaId: cellData.personaId || null,
            personaLabel: cellData.personaLabel || null,
            scaryScore: data.scaryScore || 5,
            wahooScore: data.wahooScore || 5,
            generationPrompt: data.prompt
          })

          if (saveError) {
            console.error('Error saving skill × problem challenge:', saveError)
          }
        } else {
          // Standard challenge save
          const { error: saveError } = await createGroanChallenge({
            userId: user.id,
            title: data.title,
            description: data.description,
            visibilityLayer: cellData.visibilityLayer,
            sourceType: cellData.sourceType,
            sourceId: cellData.sourceId,
            sourceLabel: cellData.sourceLabel,
            scaryScore: data.scaryScore || 5,
            wahooScore: data.wahooScore || 5,
            generationPrompt: data.prompt
          })

          if (saveError) {
            console.error('Error saving challenge:', saveError)
          }
        }
      }

      return data
    } catch (error) {
      console.error('Error generating challenge:', error)
      alert('Error generating challenge. Please try again.')
      return null
    }
  }

  // Handler for matrix cell clicks — opens popup immediately
  const handleMatrixCellClick = (cellData) => {
    if (cellData.challenge) {
      setSelectedGroanChallenge(cellData.challenge)
      setGroanCellContext(cellData)
    } else {
      // No challenge yet — open popup with cell context for creating one
      setSelectedGroanChallenge(null)
      setGroanCellContext(cellData)
    }
  }

  // Generate challenge via AI from within the popup
  const handleGenerateFromPopup = async () => {
    if (!groanCellContext) return
    setGroanChallengeLoading(true)
    try {
      const result = await handleGenerateChallenge(groanCellContext)
      if (result?.title) {
        // Fetch the newly created challenge from DB
        const { data: newChallenges } = await supabase
          .from('groan_challenges')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        if (newChallenges?.[0]) {
          setSelectedGroanChallenge(newChallenges[0])
        }
        setGroanMatrixKey(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error generating from popup:', err)
    } finally {
      setGroanChallengeLoading(false)
    }
  }

  // Handle saving a custom challenge (user-entered text)
  const handleSaveCustomChallenge = async () => {
    if (!customChallengeText.trim()) return
    if (!selectedGroanChallenge && !groanCellContext) return
    setGroanChallengeLoading(true)
    try {
      if (selectedGroanChallenge) {
        // Update existing challenge with custom text
        const { error } = await supabase
          .from('groan_challenges')
          .update({
            title: customChallengeText.trim(),
            description: `Custom challenge: ${customChallengeText.trim()}`,
          })
          .eq('id', selectedGroanChallenge.id)
        if (error) throw error
        setSelectedGroanChallenge(prev => ({
          ...prev,
          title: customChallengeText.trim(),
          description: `Custom challenge: ${customChallengeText.trim()}`,
        }))
      } else {
        // Create a new challenge from cell context with custom text
        const ctx = groanCellContext
        const isSkillProblem = ctx.sourceType === 'skill_x_problem'
        let saveResult
        if (isSkillProblem) {
          saveResult = await createSkillProblemChallenge({
            userId: user.id,
            title: customChallengeText.trim(),
            description: `Custom challenge: ${customChallengeText.trim()}`,
            skillId: ctx.skillId,
            skillLabel: ctx.skillLabel,
            problemId: ctx.problemId,
            problemLabel: ctx.problemLabel,
            personaId: ctx.personaId || null,
            personaLabel: ctx.personaLabel || null,
            scaryScore: 5,
            wahooScore: 5,
          })
        } else {
          saveResult = await createGroanChallenge({
            userId: user.id,
            title: customChallengeText.trim(),
            description: `Custom challenge: ${customChallengeText.trim()}`,
            visibilityLayer: ctx.visibilityLayer,
            sourceType: ctx.sourceType,
            sourceId: ctx.sourceId,
            sourceLabel: ctx.sourceLabel,
            scaryScore: 5,
            wahooScore: 5,
          })
        }
        if (saveResult?.error) throw saveResult.error
        // Fetch the newly created challenge and auto-accept it
        const { data: newChallenges } = await supabase
          .from('groan_challenges')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        if (newChallenges?.[0]) {
          await acceptGroanChallenge(newChallenges[0].id)
        }
        setGroanMatrixKey(prev => prev + 1)
        // Close modal — challenge is now active on the matrix
        closeGroanModal()
      }
      setCustomChallengeText('')
    } catch (err) {
      console.error('Error saving custom challenge:', err)
    } finally {
      setGroanChallengeLoading(false)
    }
  }

  // Handle accepting a groan challenge
  const handleAcceptGroanChallenge = async () => {
    if (!selectedGroanChallenge) return
    setGroanChallengeLoading(true)
    try {
      const { error } = await acceptGroanChallenge(selectedGroanChallenge.id)
      if (error) throw error
      // Update local state
      setSelectedGroanChallenge(prev => ({ ...prev, accepted_at: new Date().toISOString() }))
    } catch (err) {
      console.error('Error accepting challenge:', err)
    } finally {
      setGroanChallengeLoading(false)
    }
  }

  // Handle completing a groan challenge - show reflection step
  const handleStartCompletion = () => {
    setGroanReflection({ scaryScore: 5, wahooScore: 5, reflection: '' })
    setGroanReflectionStep(true)
  }

  // Handle final completion with reflection data
  const handleCompleteGroanChallenge = async () => {
    if (!selectedGroanChallenge) return
    setGroanChallengeLoading(true)
    try {
      const { error } = await completeGroanChallenge(selectedGroanChallenge.id, {
        reflectionText: groanReflection.reflection,
        scaryScoreAfter: groanReflection.scaryScore,
        wahooScoreAfter: groanReflection.wahooScore
      })
      if (error) throw error
      // Trigger confetti
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      // Reset and close modal, refresh matrix
      setGroanReflectionStep(false)
      setSelectedGroanChallenge(null)
      setGroanMatrixKey(prev => prev + 1)
    } catch (err) {
      console.error('Error completing challenge:', err)
    } finally {
      setGroanChallengeLoading(false)
    }
  }

  // Handle regenerating a challenge (generate new first, then delete old)
  const handleRegenerateChallenge = async () => {
    if (!selectedGroanChallenge) return
    setGroanChallengeLoading(true)

    const challenge = selectedGroanChallenge
    const isSkillProblem = challenge.skill_cluster_id && challenge.problem_cluster_id

    try {
      // Generate the new challenge FIRST — if this fails, old challenge is preserved
      let generateResult
      if (isSkillProblem) {
        generateResult = await handleGenerateChallenge({
          sourceType: 'skill_x_problem',
          skillId: challenge.skill_cluster_id,
          skillLabel: challenge.source_label?.split(' × ')[0] || 'Skill',
          problemId: challenge.problem_cluster_id,
          problemLabel: challenge.source_label?.split(' × ')[1]?.split(' (for ')[0] || 'Problem',
          personaId: challenge.persona_cluster_id || null,
          personaLabel: null
        })
      } else {
        generateResult = await handleGenerateChallenge({
          sourceType: challenge.source_type,
          sourceId: challenge.source_id,
          sourceLabel: challenge.source_label,
          visibilityLayer: challenge.visibility_layer
        })
      }

      // Only delete old challenge if new one was generated successfully
      if (!generateResult) {
        // Generation failed — handleGenerateChallenge already showed an alert
        return
      }

      const { error: deleteError } = await supabase
        .from('groan_challenges')
        .delete()
        .eq('id', challenge.id)

      if (deleteError) {
        console.error('Error deleting old challenge:', deleteError)
      }

      setSelectedGroanChallenge(null)

      // Refresh matrix
      setGroanMatrixKey(prev => prev + 1)
    } catch (err) {
      console.error('Error regenerating challenge:', err)
    } finally {
      setGroanChallengeLoading(false)
    }
  }

  // Close groan modal and reset state
  const closeGroanModal = () => {
    setSelectedGroanChallenge(null)
    setGroanCellContext(null)
    setGroanReflectionStep(false)
    setCustomChallengeText('')
  }

  // Determine the current viewing stage (needed for Business filtering)
  const viewingStage = activeStageTab !== undefined ? activeStageTab : (
    selectedProject?.current_stage ||
    (typeof stageProgress?.current_stage === 'number'
      ? stageProgress.current_stage
      : convertLegacyStage(stageProgress?.current_stage))
  )

  // Check if we're viewing the Groans stage (0.5) in Business tab
  const isGroansStage = activeCategory === 'Business' && viewingStage === 0.5
  const isFlowFinderStage = activeCategory === 'Business' && viewingStage === 0

  // Compute which visibility layers are locked based on progress
  const layerLockStatus = getLayerLockStatus(
    flowFinderComplete,
    selectedProject?.current_stage ?? 0
  )

  // Deep Dive quest IDs for Flow Finder (includes archived flow_finder_skills)
  const DEEP_DIVE_QUEST_IDS = ['flow_finder_skills', 'flow_finder_problems', 'flow_finder_persona', 'flow_finder_integration']

  // Filter quests by the active category tab (exclude archived quests)
  // Special case: When viewing Groans stage in Business, pull from 'Groans' category
  // Special case: Allow archived Deep Dive quests through when on Flow Finder stage
  let filteredQuests = challengeData?.quests?.filter(q => {
    // Allow Deep Dive quests through even if archived (when on Flow Finder)
    if (q.archived && !(isFlowFinderStage && DEEP_DIVE_QUEST_IDS.includes(q.id))) {
      return false
    }
    if (isGroansStage) {
      return q.category === 'Groans'
    }
    return q.category === activeCategory
  }) || []

  // Filter by persona and stage for Business quests
  if (activeCategory === 'Business') {
    const userPersonaNormalized = normalizePersona(userData?.persona)

    // Handle sub-tabs: Tasks vs Voices (or Deep Dive for Flow Finder)
    // Note: Groans stage only has Tasks, no sub-tabs

    if (businessSubTab === 'voices' && !isGroansStage) {
      if (isFlowFinderStage) {
        // Deep Dive: show the original Flow Finder discovery quests
        filteredQuests = filteredQuests.filter(quest =>
          DEEP_DIVE_QUEST_IDS.includes(quest.id)
        )
      } else {
        // Voices: generate voice quests for the current stage
        filteredQuests = generateVoiceQuestsForStage(viewingStage, userArchetypes)
      }
    } else {
      // Tasks sub-tab: filter regular business quests
      // For Groans stage, show all non-archived Groans quests
      if (!isGroansStage) {
        filteredQuests = filteredQuests.filter(quest => {
          // Exclude stage groan quests - they now appear in Voices sub-tab
          if (quest.type === 'groan' || quest.id?.startsWith('groan_stage')) {
            return false
          }

          // For Flow Finder, exclude Deep Dive quests from Tasks tab
          if (isFlowFinderStage && DEEP_DIVE_QUEST_IDS.includes(quest.id)) {
            return false
          }

          if (quest.persona_specific && userPersonaNormalized) {
            const normalizedQuestPersonas = quest.persona_specific.map(p => normalizePersona(p))
            if (!normalizedQuestPersonas.includes(userPersonaNormalized)) {
              return false
            }
          }

          // Check stage_required - use !== undefined since stage 0 is valid
          // Use Number() to ensure both sides are numbers for proper comparison
          if (quest.stage_required !== undefined && quest.stage_required !== null) {
            if (Number(quest.stage_required) !== Number(viewingStage)) {
              return false
            }
          }

          return true
        })
      }
    }
  }

  // Apply R-type and frequency filters for Groans and Healing tabs
  let displayQuests = filteredQuests
  if (activeCategory === 'Groans' || activeCategory === 'Healing') {
    if (activeRTypeFilter !== 'All') {
      displayQuests = displayQuests.filter(q => q.type === activeRTypeFilter)
    }
    if (activeFrequencyFilter !== 'all') {
      displayQuests = displayQuests.filter(q => q.frequency === activeFrequencyFilter)
    }
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    displayQuests = displayQuests.filter(q =>
      q.name?.toLowerCase().includes(query) ||
      q.description?.toLowerCase().includes(query)
    )
  }

  // ============================================
  // Render: Onboarding (welcome, install-app, enable-notifications)
  // ============================================

  if (showOnboarding) {
    return (
      <ChallengeOnboarding
        userId={user?.id}
        screen={onboardingScreen}
        onScreenChange={setOnboardingScreen}
        onStartChallenge={handlePlaySolo}
      />
    )
  }

  // ============================================
  // Render: Group Selection
  // ============================================

  if (showGroupSelection) {
    return (
      <ChallengeOnboarding
        userId={user?.id}
        screen="group-selection"
        onScreenChange={setOnboardingScreen}
        onPlaySolo={handlePlaySolo}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
        groupCodeInput={groupCodeInput}
        onGroupCodeChange={setGroupCodeInput}
      />
    )
  }

  // ============================================
  // Render: Project Selector
  // ============================================

  if (showProjectSelector) {
    return (
      <div className="challenge-container">
        <div className="challenge-onboarding">
          <ChallengeProjectSelector
            onSelect={handleProjectSelected}
            currentProjectId={selectedProject?.id}
          />
        </div>
      </div>
    )
  }

  // ============================================
  // Render: Loading
  // ============================================

  if (loading) {
    return (
      <div className="challenge-container">
        <div className="skeleton-header">
          <div className="skeleton-title shimmer"></div>
          <div className="skeleton-points shimmer"></div>
        </div>
        <div className="skeleton-tabs">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-tab shimmer"></div>
          ))}
        </div>
        <div className="skeleton-cards">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-card-header">
                <div className="skeleton-card-title shimmer"></div>
                <div className="skeleton-card-badge shimmer"></div>
              </div>
              <div className="skeleton-card-desc shimmer"></div>
              <div className="skeleton-card-desc short shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ============================================
  // Render: Weekly Planning Flow
  // ============================================

  if (showWeeklyPlanning) {
    return (
      <WeeklyPlanningFlow
        onComplete={handleWeeklyPlanComplete}
        existingPlan={weeklyPlan}
      />
    )
  }

  // ============================================
  // Render: Error State
  // ============================================

  if (!progress) {
    return (
      <div className="challenge-container">
        <div className="challenge-error">
          <p>Unable to load challenge progress. Please try refreshing the page.</p>
          <div style={{ marginTop: '1rem' }}>
            <WhatsAppErrorButton
              errorMessage="Unable to load challenge progress"
              component="Challenge"
            />
          </div>
        </div>
      </div>
    )
  }

  const categoryPoints = getCategoryPoints(activeCategory)
  const artifactProgress = getArtifactProgress(activeCategory, activeCategory === 'Business' ? activeStageTab : null)

  // ============================================
  // Render: Main Challenge View
  // ============================================

  return (
    <div className="challenge-container content-enter">
      {showExplainer && <PortalExplainer onClose={handleCloseExplainer} />}
      <NotificationPrompt />
      <ChallengeHeader
        navigate={navigate}
        settingsMenuRef={settingsMenuRef}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        handleOpenExplainer={handleOpenExplainer}
        onLeaderboardClick={() => navigate('/league/week')}
        streakDays={getConsecutiveStreakDays()}
        weekType={weeklyPlan?.week_type}
        weeklyPoints={currentWeeklyPoints}
        matchupData={matchupData}
        categoryScores={categoryScores}
        matchupLoading={matchupLoading}
      />

      {/* W/L flip toast */}
      {flipEvent?.type === 'win' && (
        <MicroToast
          message={`You overtook them in ${flipEvent.categories.join(' & ')}!`}
          duration={3000}
          onComplete={clearFlipEvent}
        />
      )}

      {/* Weekly recap card */}
      {recapData && isOnTeam && (
        <WeeklyRecapCard
          lastWeekMatchup={recapData.matchup}
          userTeamId={recapData.userTeamId}
          opponentName={recapData.opponentName}
          currentOpponentName={matchupData?.opponentName}
          currentWeek={getCurrentWeek?.() || 0}
        />
      )}

      {/* Fantasy League nudge — show if league exists and user not on a team */}
      {leagueExists && !isOnTeam && (
        <Link to="/league" className="league-nudge-banner" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'linear-gradient(135deg, rgba(94,23,235,0.06), rgba(233,162,59,0.06))',
          border: '1px solid rgba(94,23,235,0.12)',
          borderRadius: '14px', padding: '12px 16px',
          marginBottom: '12px', textDecoration: 'none', color: '#5e17eb',
          fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
        }}>
          🏆 Fantasy League is live! Join a squad →
        </Link>
      )}

      <div className="challenge-tabs stagger-children">
        {categories.map(category => {
          const isLocked = false // TODO: restore → category === 'Healing' && !healingCompassComplete
          return (
            <button
              key={category}
              className={`challenge-tab ${activeCategory === category ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => !isLocked && setActiveCategory(category)}
              disabled={isLocked}
              title={isLocked ? 'Complete the Healing Compass to unlock' : undefined}
            >
              {category}
              {isLocked && <span className="lock-icon">🔒</span>}
            </button>
          )
        })}
      </div>

      {/* Stage tabs for Business */}
      {activeCategory === 'Business' && (
        <div className="stage-tabs-wrapper">
          {selectedProject ? (
            <>
              <div className="selected-project-info">
                <span className="project-name">{selectedProject.name}</span>
                <button
                  className="change-project-btn"
                  onClick={() => setShowProjectSelector(true)}
                >
                  Change Project
                </button>
              </div>
              <ChallengeStageTabs
                currentStage={selectedProject.current_stage ?? 1}
                completedStages={getCompletedStages()}
                activeTab={activeStageTab}
                onTabChange={setActiveStageTab}
                flowFinderComplete={flowFinderComplete}
              />
            </>
          ) : (
            <div className="no-project-prompt">
              <p>Select a project to see stage-specific quests</p>
              <button
                className="select-project-btn"
                onClick={() => setShowProjectSelector(true)}
              >
                Select Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Frequency tabs for Healing — uses same stage-tab styling as Business */}
      {activeCategory === 'Healing' && (
        <div className="stage-tabs-wrapper">
          <div className="stage-tabs-container healing-frequency-tabs">
            <div className="stage-tabs">
              {[
                { id: 'daily', label: 'Daily', icon: '☀️', color: '#5e17eb' },
                { id: 'weekly', label: 'Weekly', icon: '📅', color: '#7c3aed' },
                { id: 'deepdive', label: 'Deep Dive', icon: '🌊', color: '#9b59b6' },
                { id: 'explainer', label: 'Explainers', icon: '📖', color: '#c27aed' },
                { id: 'all', label: 'All', icon: '📋', color: '#E9A23B' }
              ].map(tab => {
                const isActive = activeFrequencyFilter === tab.id
                const activeStyles = isActive ? {
                  background: tab.color,
                  borderColor: tab.color,
                  color: 'white'
                } : {}
                return (
                  <button
                    key={tab.id}
                    className={`stage-tab available ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveFrequencyFilter(tab.id)}
                    style={{ '--stage-color': tab.color, ...activeStyles }}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="progress-line">
              <div className="progress-fill" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}

      <div className="challenge-content">
        {/* Groans Summary */}
        {activeCategory === 'GroansSummary' && (
          <GroansSummary
            onBack={() => setActiveCategory('Groans')}
            progress={progress}
            completions={completions}
          />
        )}

        {/* Healing Summary */}
        {activeCategory === 'HealingSummary' && (
          <HealingSummary
            onBack={() => setActiveCategory('Healing')}
            progress={progress}
          />
        )}

        {/* Quest Content - only show if not on Summary tabs */}
        {activeCategory !== 'GroansSummary' && activeCategory !== 'HealingSummary' && (
          <>
        {/* Artifact Progress — hidden on Groans/Play tab (both direct and via Business) */}
        {artifactProgress && activeCategory !== 'Groans' && !isGroansStage && (() => {
          const stageConfig = activeCategory === 'Business' && activeStageTab !== undefined ? getStageConfig(activeStageTab) : null

          // Healing: per-frequency title and description
          const healingFreqMeta = {
            daily: { name: '☀️ Daily Healing', desc: 'Small daily practices to build awareness and release tension.' },
            weekly: { name: '📅 Weekly Healing', desc: 'Deeper weekly practices to process patterns and triggers.' },
            deepdive: { name: '🌊 Deep Dive', desc: 'One-time flows to map your nervous system and find the wound.' },
            explainer: { name: '📖 Explainers', desc: 'Understand the foundations of healing, emotional splinters, and the Four R\'s.' },
            all: { name: '🧘 Healing Mastery', desc: 'Your combined healing progress across all practices.' }
          }
          const healingMeta = activeCategory === 'Healing' ? healingFreqMeta[activeFrequencyFilter] : null

          const artifactName = healingMeta ? healingMeta.name
            : stageConfig ? `${stageConfig.icon} ${stageConfig.name}`
            : artifactProgress.name
          const artifactDesc = healingMeta ? healingMeta.desc
            : stageConfig ? (activeStageTab === 0 ? 'Tasks to find your flow in life' : stageConfig.description)
            : artifactProgress.description
          return (
          <div className={`artifact-progress ${artifactProgress.unlocked ? 'unlocked' : ''}`}>
            <div className="artifact-header">
              <h3>{artifactProgress.unlocked ? '✅' : ''} {artifactName}</h3>
              <p className="artifact-description">{artifactDesc}</p>
            </div>

            {!artifactProgress.unlocked && (
              <div className="artifact-bars">
                {activeCategory === 'Healing' && artifactProgress.frequencyCategories ? (
                  (() => {
                    // Show per-tab progress bar based on selected frequency
                    const freqMap = { daily: 'Daily', weekly: 'Weekly', deepdive: 'Deep Dive', explainer: 'Explainer' }
                    const iconMap = { Daily: '☀️', Weekly: '📅', 'Deep Dive': '🌊', Explainer: '📖' }

                    if (activeFrequencyFilter === 'all') {
                      // Combined total across all frequencies
                      const totalCurrent = Object.values(artifactProgress.frequencyCategories)
                        .reduce((sum, f) => sum + (f.currentPoints || 0), 0)
                      const totalRequired = Object.values(artifactProgress.frequencyCategories)
                        .reduce((sum, f) => sum + (f.pointsRequired || 0), 0)
                      return (
                        <div className="progress-bar-container">
                          <div className="progress-bar-label">
                            <span>📋 All Progress</span>
                            <span>{totalCurrent}/{totalRequired}</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min((totalCurrent / totalRequired) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    }

                    const freqKey = freqMap[activeFrequencyFilter]
                    const freqData = freqKey && artifactProgress.frequencyCategories[freqKey]
                    if (!freqData) return null
                    return (
                      <div className="progress-bar-container">
                        <div className="progress-bar-label">
                          <span>{iconMap[freqKey] || '📋'} {freqKey}</span>
                          <span>{freqData.currentPoints}/{freqData.pointsRequired}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${activeFrequencyFilter}`}
                            style={{ width: `${Math.min((freqData.currentPoints / freqData.pointsRequired) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })()
                ) : activeCategory === 'Groans' && artifactProgress.frequencyCategories ? (
                  <>
                    {Object.entries(artifactProgress.frequencyCategories).map(([freqType, freqData]) => (
                      <div key={freqType} className="progress-bar-container">
                        <div className="progress-bar-label">
                          <span>{freqType === 'Daily' ? '☀️' : '📅'} {freqType}</span>
                          <span>{freqData.currentPoints}/{freqData.pointsRequired}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${freqType.toLowerCase()}`}
                            style={{ width: `${Math.min((freqData.currentPoints / freqData.pointsRequired) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
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
                {(() => {
                  const tabStatus = getTabCompletionStatus(activeCategory)
                  if (tabStatus.totalQuests === 0) return null
                  if (tabStatus.bonusAwarded) {
                    return <p className="tab-bonus-text earned">+{tabStatus.bonusPoints} XP bonus earned!</p>
                  }
                  return null
                })()}
              </div>
            )}

            {artifactProgress.unlocked && (
              <div className="artifact-unlocked-message">
                Artifact Unlocked! You've completed this category.
              </div>
            )}
          </div>
          )
        })()}


        {/* Sub-tabs: Tasks | Voices (or Deep Dive for Flow Finder) - only for Business, hidden for Groans stage */}
        {activeCategory === 'Business' && selectedProject && activeStageTab !== 0.5 && (
          <div className="business-sub-tabs">
            <button
              className={`sub-tab ${businessSubTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setBusinessSubTab('tasks')}
            >
              Tasks
            </button>
            <button
              className={`sub-tab ${businessSubTab === 'voices' ? 'active' : ''}`}
              onClick={() => setBusinessSubTab('voices')}
            >
              {activeStageTab === 0 ? 'Deep Dive' : 'Voices'}
            </button>
          </div>
        )}

        {/* Groans Tab - Courage Matrix */}
        {activeCategory === 'Groans' && (
          <div className="quest-section">
            <GroanMatrix
              key={groanMatrixKey}
              userId={user?.id}
              onCellClick={handleMatrixCellClick}
              onGenerateChallenge={handleGenerateChallenge}
              layerLockStatus={layerLockStatus}
              flowFinderComplete={flowFinderComplete}
            />
          </div>
        )}

        {/* Healing Quests */}
        {activeCategory === 'Healing' && displayQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Healing</h2>
            {/* R-type chips only — frequency tabs are above the progress bar */}
            {activeFrequencyFilter !== 'deepdive' && activeFrequencyFilter !== 'explainer' && (
              <div className="rtype-filters">
                {['All', 'Recognise', 'Release', 'Rewire', 'Reconnect'].map(rType => (
                  <button
                    key={rType}
                    className={`filter-chip ${activeRTypeFilter === rType ? 'active' : ''}`}
                    onClick={() => setActiveRTypeFilter(rType)}
                  >
                    {rType}
                  </button>
                ))}
              </div>
            )}
            <div className="quest-search">
              <input
                type="text"
                className="quest-search-input"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="quest-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
            {['Recognise', 'Release', 'Rewire', 'Reconnect'].filter(rType =>
              activeRTypeFilter === 'All' || activeRTypeFilter === rType
            ).map(rType => {
              const rTypeQuests = displayQuests
                .filter(q => q.type === rType)
                .sort((a, b) => {
                  // Daily quests first, weekly second
                  if (a.frequency === 'daily' && b.frequency !== 'daily') return -1
                  if (a.frequency !== 'daily' && b.frequency === 'daily') return 1
                  return 0
                })
              if (rTypeQuests.length === 0) return null

              return (
                <div key={rType} className="quest-subsection">
                  <h3 className="subsection-title">{rType}</h3>
                  <div className="quest-grid">
                    {rTypeQuests.map(quest => {
                      const completed = isQuestCompletedToday(quest.id, quest)
                      const isReleaseDailyChallenge = quest.id === 'release_daily_challenge'

                      // Determine lock state and message
                      const isLocked = isReleaseDailyChallenge && !nervousSystemComplete
                      const lockMessage = 'Complete the "Nervous System Calibration" to unlock daily release challenges'

                      return (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          completed={completed}
                          isCompleting={completingQuestId === quest.id}
                          showStreak={quest.frequency === 'daily'}
                          streak={getDailyStreak(quest.id)}
                          dayLabels={getDayLabels()}
                          questInput={questInputs[quest.id]}
                          onInputChange={handleInputChange}
                          onComplete={handleQuestComplete}
                          expandedLearnMore={expandedLearnMore}
                          onToggleLearnMore={toggleLearnMore}
                          showLockedTooltip={showLockedTooltip}
                          onToggleLockedTooltip={(id) => setShowLockedTooltip(showLockedTooltip === id ? null : id)}
                          renderDescription={renderDescription}
                          completedBadgeText={quest.frequency === 'daily' ? "Completed Today" : "Completed"}
                          navigate={navigate}
                          specialLockCheck={isLocked}
                          specialLockMessage={isReleaseDailyChallenge ? "Complete Nervous System to Unlock" : "Locked"}
                          lockedMessage={lockMessage}
                          safetyContracts={safetyContracts}
                          selectedProject={selectedProject}
                          progress={progress}
                          projectStage={projectStage}
                          justCompleted={justCompletedQuestId === quest.id}
                          isPlanned={isQuestPlanned(quest.id)}
                          plannedDay={getPlannedDay(quest.id)}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Business Quests - Show GroanMatrix when on Groans stage */}
        {activeCategory === 'Business' && isGroansStage && (
          <div className="quest-section">
            <GroanMatrix
              key={`business-${groanMatrixKey}`}
              userId={user?.id}
              onCellClick={handleMatrixCellClick}
              onGenerateChallenge={handleGenerateChallenge}
              layerLockStatus={layerLockStatus}
              flowFinderComplete={flowFinderComplete}
            />
          </div>
        )}

        {/* Business Quests - Regular stages */}
        {activeCategory === 'Business' && !isGroansStage && filteredQuests.length > 0 && (
          <div className="quest-section">
            <div className="quest-grid stagger-children-fast">
              {filteredQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                const locked = isQuestLocked(quest)

                return (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    completed={completed}
                    isCompleting={completingQuestId === quest.id}
                    locked={locked}
                    lockedPrerequisite={locked ? getRequiredQuestName(quest.requires_quest, quest.id) : null}
                    showStreak={!!quest.maxPerDay}
                    streak={getDailyStreak(quest.id)}
                    dayLabels={getDayLabels()}
                    questInput={questInputs[quest.id]}
                    onInputChange={handleInputChange}
                    onComplete={handleQuestComplete}
                    expandedLearnMore={expandedLearnMore}
                    onToggleLearnMore={toggleLearnMore}
                    showLockedTooltip={showLockedTooltip}
                    onToggleLockedTooltip={(id) => setShowLockedTooltip(showLockedTooltip === id ? null : id)}
                    renderDescription={renderDescription}
                    completedBadgeText="Completed"
                    navigate={navigate}
                    selectedProject={selectedProject}
                    progress={progress}
                    projectStage={projectStage}
                    justCompleted={justCompletedQuestId === quest.id}
                    isPlanned={isQuestPlanned(quest.id)}
                    plannedDay={getPlannedDay(quest.id)}
                    validationResponseCounts={validationResponseCounts}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Bonus Sub-Tabs: Tasks | Content */}
        {activeCategory === 'Bonus' && (
          <div className="business-sub-tabs">
            <button
              className={`sub-tab ${bonusSubTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setBonusSubTab('tasks')}
            >
              Tasks
            </button>
            <button
              className={`sub-tab ${bonusSubTab === 'content' ? 'active' : ''}`}
              onClick={() => setBonusSubTab('content')}
            >
              Content
            </button>
          </div>
        )}

        {/* Bonus Quests — Tasks sub-tab */}
        {activeCategory === 'Bonus' && bonusSubTab === 'tasks' && filteredQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Bonus Quests</h2>
            <div className="quest-grid stagger-children-fast">
              {filteredQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)

                return (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    completed={completed}
                    isCompleting={completingQuestId === quest.id}
                    showStreak={false}
                    questInput={questInputs[quest.id]}
                    onInputChange={handleInputChange}
                    onComplete={handleQuestComplete}
                    expandedLearnMore={expandedLearnMore}
                    onToggleLearnMore={toggleLearnMore}
                    showLockedTooltip={showLockedTooltip}
                    onToggleLockedTooltip={(id) => setShowLockedTooltip(showLockedTooltip === id ? null : id)}
                    renderDescription={renderDescription}
                    completedBadgeText="Completed"
                    navigate={navigate}
                    selectedProject={selectedProject}
                    progress={progress}
                    projectStage={projectStage}
                    extraClass="bonus"
                    justCompleted={justCompletedQuestId === quest.id}
                    isPlanned={isQuestPlanned(quest.id)}
                    plannedDay={getPlannedDay(quest.id)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Bonus — Content sub-tab */}
        {activeCategory === 'Bonus' && bonusSubTab === 'content' && (
          <ContentChallenges
            leagueId={league?.id}
            userId={user?.id}
            teamId={userTeam?.id}
            weekNumber={getCurrentWeek?.()}
            leagueStatus={league?.status}
            isOnTeam={isOnTeam}
            teams={teams}
            contentSubmissions={contentSubmissions}
            onSubmitted={reloadContent}
            standings={standings}
            userTeam={userTeam}
            userData={userData}
          />
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
              <div className="quest-grid stagger-children-fast">
                {filteredQuests.map(quest => {
                  const completed = isQuestCompletedToday(quest.id, quest)

                  return (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      completed={completed}
                      isCompleting={completingQuestId === quest.id}
                      showStreak={quest.frequency === 'daily'}
                      streak={getDailyStreak(quest.id)}
                      dayLabels={getDayLabels()}
                      questInput={questInputs[quest.id]}
                      onInputChange={handleInputChange}
                      onComplete={handleQuestComplete}
                      expandedLearnMore={expandedLearnMore}
                      onToggleLearnMore={toggleLearnMore}
                      showLockedTooltip={showLockedTooltip}
                      onToggleLockedTooltip={(id) => setShowLockedTooltip(showLockedTooltip === id ? null : id)}
                      renderDescription={renderDescription}
                      completedBadgeText={quest.frequency === 'daily' ? 'Completed Today' : 'Completed'}
                      navigate={navigate}
                      selectedProject={selectedProject}
                      progress={progress}
                      projectStage={projectStage}
                      justCompleted={justCompletedQuestId === quest.id}
                      isPlanned={isQuestPlanned(quest.id)}
                      plannedDay={getPlannedDay(quest.id)}
                    />
                  )
                })}
              </div>
            )}

            {/* Flow Journey River */}
            {selectedProject && (
              <div className="flow-map-section">
                <h2 className="section-title">Your Flow Journey</h2>
                <p className="flow-journey-hint">Swipe to explore your river — compass entries and milestones show your journey.</p>
                <HorizontalFlowRiver
                  projectId={selectedProject.id}
                  limit={30}
                  showEmpty
                />
                <div className="flow-journey-legend">
                  <div className="fj-legend-row">
                    <span className="fj-legend-label">Compass</span>
                    <div className="fj-legend-item"><div className="fj-legend-dot" style={{ background: '#10b981' }} /> Flow</div>
                    <div className="fj-legend-item"><div className="fj-legend-dot" style={{ background: '#3b82f6' }} /> Redirect</div>
                    <div className="fj-legend-item"><div className="fj-legend-dot" style={{ background: '#fbbf24' }} /> Honour</div>
                    <div className="fj-legend-item"><div className="fj-legend-dot" style={{ background: '#ef4444' }} /> Rest</div>
                  </div>
                  <div className="fj-legend-row">
                    <span className="fj-legend-label">Challenge</span>
                    <div className="fj-legend-item"><span className="fj-legend-icon">⚡</span> Quest</div>
                    <div className="fj-legend-item"><span className="fj-legend-icon">🦁</span> Groan</div>
                    <div className="fj-legend-item"><span className="fj-legend-icon">📊</span> Stage</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </>
      )}

      {/* Groan Challenge Detail Modal */}
      {(selectedGroanChallenge || groanCellContext) && (
        <div className="groan-modal-overlay" onClick={closeGroanModal}>
          <div className="groan-modal" onClick={e => e.stopPropagation()}>
            <button className="groan-modal-close" onClick={closeGroanModal}>×</button>

            {!groanReflectionStep ? (
              <>
                {/* Header with layer badge */}
                <div className="groan-modal-header">
                  {(selectedGroanChallenge?.visibility_layer || groanCellContext?.visibilityLayer) && (
                    <span className="groan-modal-layer">
                      {(selectedGroanChallenge?.visibility_layer || groanCellContext?.visibilityLayer).toUpperCase()}
                    </span>
                  )}
                  {(selectedGroanChallenge?.skill_cluster_id || groanCellContext?.sourceType === 'skill_x_problem') && (
                    <span className="groan-modal-layer groan-modal-layer-sp">SKILL × PROBLEM</span>
                  )}

                  {/* Show challenge title if we have one, otherwise show layer explanation */}
                  {selectedGroanChallenge ? (
                    <h2>{selectedGroanChallenge.title}</h2>
                  ) : (
                    <h2>
                      {(() => {
                        const layerId = groanCellContext?.visibilityLayer
                        const layerInfo = GROAN_VISIBILITY_LAYERS.find(l => l.id === layerId)
                        return layerInfo ? `${layerInfo.icon} ${layerInfo.label} Challenge` : 'New Challenge'
                      })()}
                    </h2>
                  )}
                </div>

                {/* Visibility layer selector for Skill × Problem (no layer pre-set) */}
                {!selectedGroanChallenge && groanCellContext?.sourceType === 'skill_x_problem' && !groanCellContext?.visibilityLayer && (
                  <div className="groan-layer-selector">
                    <label className="groan-custom-label">Choose visibility level:</label>
                    <div className="groan-layer-options">
                      {GROAN_VISIBILITY_LAYERS.map(layer => {
                        const isLocked = layerLockStatus[layer.id]?.locked
                        return (
                          <button
                            key={layer.id}
                            className={`groan-layer-option ${isLocked ? 'locked' : ''}`}
                            disabled={isLocked}
                            onClick={() => setGroanCellContext(prev => ({ ...prev, visibilityLayer: layer.id }))}
                          >
                            <span className="groan-layer-option-icon">{isLocked ? '🔒' : layer.icon}</span>
                            <span className="groan-layer-option-label">{layer.label}</span>
                            {isLocked && <span className="groan-layer-option-lock-msg">{layerLockStatus[layer.id].message}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Layer description when no challenge yet */}
                {!selectedGroanChallenge && groanCellContext?.visibilityLayer && (
                  <p className="groan-modal-description">
                    {(() => {
                      const layerInfo = GROAN_VISIBILITY_LAYERS.find(l => l.id === groanCellContext.visibilityLayer)
                      return layerInfo?.description || ''
                    })()}
                  </p>
                )}

                {/* Challenge description when we have one */}
                {selectedGroanChallenge && (
                  <p className="groan-modal-description">{selectedGroanChallenge.description}</p>
                )}

                {/* Source label — show skill × problem combo */}
                {groanCellContext?.sourceType === 'skill_x_problem' && !selectedGroanChallenge && (
                  <div className="groan-modal-source">
                    <span className="source-icon">⚡</span>
                    <span className="source-text">{groanCellContext.skillLabel} × {groanCellContext.problemLabel}</span>
                  </div>
                )}
                {/* Source label — standard */}
                {groanCellContext?.sourceType !== 'skill_x_problem' && (selectedGroanChallenge?.source_label || groanCellContext?.sourceLabel) && (
                  <div className="groan-modal-source">
                    <span className="source-icon">🎯</span>
                    <span className="source-text">{selectedGroanChallenge?.source_label || groanCellContext?.sourceLabel}</span>
                  </div>
                )}

                {/* Custom challenge input + Generate AI — shown when layer is selected and no challenge or before accepting */}
                {(groanCellContext?.visibilityLayer || selectedGroanChallenge) && (!selectedGroanChallenge || (!selectedGroanChallenge.accepted_at && selectedGroanChallenge.status !== 'completed')) && (
                  <div className="groan-custom-challenge">
                    <label className="groan-custom-label">Enter your own here:</label>
                    <input
                      type="text"
                      className="groan-custom-input"
                      placeholder="Type your own challenge..."
                      value={customChallengeText}
                      onChange={(e) => setCustomChallengeText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && customChallengeText.trim() && handleSaveCustomChallenge()}
                    />
                    {customChallengeText.trim() && (
                      <button
                        className="groan-btn groan-btn-save-custom"
                        onClick={handleSaveCustomChallenge}
                        disabled={groanChallengeLoading}
                      >
                        {groanChallengeLoading ? 'Saving...' : '✏️ Use This Challenge'}
                      </button>
                    )}
                    <button
                      className="groan-btn groan-btn-regenerate"
                      onClick={selectedGroanChallenge ? handleRegenerateChallenge : handleGenerateFromPopup}
                      disabled={groanChallengeLoading}
                    >
                      {groanChallengeLoading ? 'Generating...' : '✨ Generate with AI'}
                    </button>
                  </div>
                )}

                <div className="groan-modal-actions">
                  {/* Accept — only when we have a challenge that's not yet accepted */}
                  {selectedGroanChallenge && !selectedGroanChallenge.accepted_at && selectedGroanChallenge.status !== 'completed' && (
                    <button
                      className="groan-btn groan-btn-accept"
                      onClick={handleAcceptGroanChallenge}
                      disabled={groanChallengeLoading}
                    >
                      {groanChallengeLoading ? 'Accepting...' : '💪 Accept Challenge'}
                    </button>
                  )}

                  {/* Accepted - show Complete + Change */}
                  {selectedGroanChallenge?.accepted_at && selectedGroanChallenge.status !== 'completed' && (
                    <>
                      <button
                        className="groan-btn groan-btn-complete"
                        onClick={handleStartCompletion}
                        disabled={groanChallengeLoading}
                      >
                        ✅ I Did It!
                      </button>
                      <button
                        className="groan-btn groan-btn-change"
                        onClick={() => {
                          setCustomChallengeText(selectedGroanChallenge.title || '')
                          setSelectedGroanChallenge(prev => ({ ...prev, accepted_at: null }))
                        }}
                        disabled={groanChallengeLoading}
                      >
                        🔄 Change Challenge
                      </button>
                    </>
                  )}

                  {/* Completed */}
                  {selectedGroanChallenge?.status === 'completed' && (
                    <div className="groan-completed-badge">
                      ✅ Challenge Completed
                      {selectedGroanChallenge.scary_score_after && (
                        <div className="groan-completed-scores">
                          <span>😰 {selectedGroanChallenge.scary_score_after}/10</span>
                          <span>🎉 {selectedGroanChallenge.wahoo_score_after}/10</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Reflection Step */}
                <div className="groan-modal-header">
                  <span className="groan-modal-layer groan-modal-layer-reflection">REFLECTION</span>
                  <h2>How did it go?</h2>
                </div>

                <div className="groan-reflection-form">
                  <div className="groan-slider-group">
                    <label>
                      <span className="slider-label">😰 How scary was it?</span>
                      <span className="slider-value">{groanReflection.scaryScore}/10</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={groanReflection.scaryScore}
                      onChange={(e) => setGroanReflection(prev => ({ ...prev, scaryScore: parseInt(e.target.value) }))}
                      className="groan-slider"
                    />
                  </div>

                  <div className="groan-slider-group">
                    <label>
                      <span className="slider-label">🎉 How excited/proud do you feel?</span>
                      <span className="slider-value">{groanReflection.wahooScore}/10</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={groanReflection.wahooScore}
                      onChange={(e) => setGroanReflection(prev => ({ ...prev, wahooScore: parseInt(e.target.value) }))}
                      className="groan-slider"
                    />
                  </div>

                  <div className="groan-reflection-text">
                    <label>Quick reflection (optional)</label>
                    <textarea
                      placeholder="What did you learn? How do you feel?"
                      value={groanReflection.reflection}
                      onChange={(e) => setGroanReflection(prev => ({ ...prev, reflection: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="groan-modal-actions">
                  <button
                    className="groan-btn groan-btn-complete"
                    onClick={handleCompleteGroanChallenge}
                    disabled={groanChallengeLoading}
                  >
                    {groanChallengeLoading ? 'Saving...' : '🎉 Complete Challenge'}
                  </button>
                  <button
                    className="groan-btn groan-btn-back"
                    onClick={() => setGroanReflectionStep(false)}
                    disabled={groanChallengeLoading}
                  >
                    ← Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRE-ACTION Modal for resistance capture before starting milestones */}
      {preActionQuest && (
        <PreActionModal
          quest={preActionQuest}
          userId={user?.id}
          onProceed={() => {
            // Clear modal state and proceed with quest completion
            const pending = preActionPendingData
            setPreActionQuest(null)
            setPreActionPendingData(null)
            if (pending) {
              // Re-call handleQuestComplete - preActionPendingData being null will skip the modal check
              handleQuestComplete(pending.quest, pending.specialData, pending.event)
            }
          }}
          onCancel={() => {
            setPreActionQuest(null)
            setPreActionPendingData(null)
          }}
        />
      )}

      {/* POST-ACTION Modal for 3% reflection after milestone completion */}
      {postActionQuest && (
        <PostActionModal
          quest={postActionQuest}
          userId={user?.id}
          onComplete={() => setPostActionQuest(null)}
          onSkip={() => setPostActionQuest(null)}
        />
      )}

      {/* Graduation celebration modal */}
      <GraduationModal
        isOpen={graduationModal.isOpen}
        celebration={graduationModal.celebration}
        onClose={() => setGraduationModal({ isOpen: false, celebration: null })}
      />

      {/* Splinter Check-in modal (after Healing quest completion) */}
      {splinterCheckinData && (
        <SplinterCheckin
          userId={user?.id}
          healingCompassId={splinterCheckinData.healingCompassId}
          previousSplinter={splinterCheckinData}
          onClose={() => setSplinterCheckinData(null)}
        />
      )}
      </div>
    </div>
  )
}

export default Challenge
