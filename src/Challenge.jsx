import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { sanitizeText } from './lib/sanitize'
import { trackGroanCompleted } from './lib/analytics'
import confetti from 'canvas-confetti'
import { triggerSideCannons, MicroToast } from './components/Celebrations'
import LevelUpModal from './components/Celebrations/LevelUpModal'
import { useCelebrations } from './hooks/useCelebrations'
import { getLevelNumber } from './lib/crm/statsService'
import WeeklyRecapCard from './components/WeeklyRecapCard'
import GraduationModal from './components/GraduationModal'
import NotificationPrompt from './components/NotificationPrompt'
import PortalExplainer from './components/PortalExplainer'
import ChallengeProjectSelector from './components/ChallengeProjectSelector'
import ChallengeHeader from './components/ChallengeHeader'
import ChallengeOnboarding from './components/ChallengeOnboarding'
// TensionGate moved to Level 0 quest
import './components/ChallengeFilters.css' // R-type chips + frequency tabs styles (used inline now)
import './components/ChallengeStageTabs.css' // stage-tab pills for Healing/Play-list/Level sub-tabs
import QuestCard from './components/QuestCard'
import PlayListTab from './components/PlayListTab'
import PriorityTab from './components/PriorityTab'
import CompassCheckin from './components/CompassCheckin'
import NervousSystemCheckin from './components/NervousSystemCheckin'
import { needsArchetype } from './lib/nervousSystemConstants'
import GroansSummary from './components/GroansSummary'
import HealingSummary from './components/HealingSummary'
import HealingCompletionModal from './components/HealingCompletionModal'
import GroanMatrix from './components/GroanMatrix'
import PostActionModal, { POST_ACTION_MILESTONE_IDS } from './components/PostActionModal'
import PreActionModal, { PRE_ACTION_MILESTONE_IDS } from './components/PreActionModal'
import { createGroanChallenge, createSkillProblemChallenge, acceptGroanChallenge, completeGroanChallenge, fetchFlowFinderData } from './lib/crm'
import { useChallengeData } from './hooks/useChallengeData'
import { useLeagueData } from './hooks/useLeagueData'
import { useMatchupData } from './hooks/useMatchupData'
import { GROAN_VISIBILITY_LAYERS, getLayerLockStatus } from './lib/stageConfig'
import { getScoringCategory } from './lib/scoringCategories'
import ContentChallenges from './components/ContentChallenges'
import WhatsAppErrorButton from './components/WhatsAppErrorButton'
import SplinterCheckin from './components/SplinterCheckin'
import ChallengeIntro from './components/ChallengeIntro'
import DailyCheckin from './components/DailyCheckin'
import LevelTab from './components/level/LevelTab'
import { getLevelConfig } from './components/level/LevelConfig'
import { getWeekStartLocal } from './lib/dateUtils'
// CreatorHome moved to standalone /create route
import { preloadChallengeFlows } from './lib/preloadRoutes'
import { useSubscription } from './hooks/useSubscription'
import { isPaidQuest, createCheckoutSession } from './lib/subscriptionService'
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
    healingSubTab,
    setHealingSubTab,
    bonusSubTab,
    setBonusSubTab,
    playlistSubTab,
    setPlaylistSubTab,
    userArchetypes,
    getWeekStart,
    getWeekLabel,
    isQuestPlanned,
    getPlannedDay,
    categories,
    lockedCategories,
    BONUS_PERCENTAGE,
    loadStageProgress,
    showGroupSelectionModal,
    handlePlaySolo,
    handleCreateGroup,
    handleJoinGroup,
    handleProjectSelected,
    handleCloseExplainer,
    handleOpenExplainer,
    getQuestCompletions,
    isQuestCompletedToday,
    isQuestLocked,
    isQuestEverCompleted,
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
    checkAndGraduateProject,
    lifetimeScores
  } = useChallengeData()

  // First-visit story intro (persisted in DB)
  const [showIntro, setShowIntro] = useState(false)
  const [introChecked, setIntroChecked] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_stage_progress')
      .select('has_seen_challenge_intro')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.has_seen_challenge_intro) {
          setShowIntro(true)
        }
        setIntroChecked(true)
      })
  }, [user?.id])

  // Daily nervous system check-in (proactive, once per day)
  const [showDailyCheckin, setShowDailyCheckin] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    // Use local date to avoid timezone issues (e.g. Bali UTC+8)
    const now = new Date()
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    supabase
      .from('nervous_system_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('checkin_type', 'daily')
      .gte('created_at', todayLocal)
      .limit(1)
      .then(({ data }) => {
        if (!data?.length) setShowDailyCheckin(true)
      })
  }, [user?.id])

  // Subscription status for payment gating
  const { hasSubscription } = useSubscription()

  // Celebrations (level-up modal)
  const { showLevelUp, celebrateLevelUp, closeLevelUp } = useCelebrations()

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

  // Healing modal quest (compact row → popup completion)
  const [healingModalQuest, setHealingModalQuest] = useState(null)

  // Wahoo count this week (challenges completed with scary >= 7 AND wahoo >= 7)
  const [wahooCountThisWeek, setWahooCountThisWeek] = useState(0)

  // Dynamic level detection
  const [currentJourneyLevel, setCurrentJourneyLevel] = useState(0)
  const [viewingLevel, setViewingLevel] = useState(null)
  const [unlockedTabs, setUnlockedTabs] = useState(new Set(['Level']))
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const level = data?.current_journey_level || 0
        setCurrentJourneyLevel(level)
        // Pre-unlock tabs based on DB state for Level 0
        if (level === 0) {
          // Unlock Play-list if topic identifier completed
          supabase.from('nikigai_clusters')
            .select('id').eq('user_id', user.id).eq('step_id', 'identify_topics').limit(1)
            .then(({ data: d }) => {
              if (d?.length > 0) setUnlockedTabs(prev => new Set([...prev, 'Play-list']))
            })
          // Unlock Healing if any healing quest completed
          supabase.from('quest_completions')
            .select('id').eq('user_id', user.id).eq('quest_category', 'Healing').limit(1)
            .then(({ data: d }) => {
              if (d?.length > 0) setUnlockedTabs(prev => new Set([...prev, 'Healing']))
            })
        }
      })
  }, [user?.id])

  // Wahoo count: completed challenges this week with user-reported high scary + wahoo
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('groan_challenges')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('scary_score', 7)
      .gte('wahoo_score', 7)
      .gte('completed_at', getWeekStartLocal())
      .then(({ data }) => {
        setWahooCountThisWeek(data?.length || 0)
      })
  }, [user?.id, progress]) // re-fetch when progress changes (quest completed)

  // Tabs unlock after first "Plan Your Week" is confirmed
  const [hasEverPlannedWeek, setHasEverPlannedWeek] = useState(false)
  const [weekPlanVersion, setWeekPlanVersion] = useState(0)
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('priority_weekly_picks')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => setHasEverPlannedWeek(data && data.length > 0))
  }, [user?.id, completions, weekPlanVersion])

  // (Tab locking removed — all tabs accessible)

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
  const [groanReflection, setGroanReflection] = useState({ beforeState: null, afterState: null, protectiveArchetype: null, reflection: '', didThreePercent: null })
  const [groanMatrixKey, setGroanMatrixKey] = useState(0) // Used to force matrix refresh
  const [customChallengeText, setCustomChallengeText] = useState('')
  const [threePercentText, setThreePercentText] = useState('')
  const [groanCellContext, setGroanCellContext] = useState(null) // Cell data when opening popup without a challenge

  // Play-list: problem/persona mapping for skills-only matrix
  const [mappedProblemId, setMappedProblemId] = useState('')
  const [mappedPersonaId, setMappedPersonaId] = useState('')
  const [customProblem, setCustomProblem] = useState('')
  const [customPersona, setCustomPersona] = useState('')
  const [flowFinderData, setFlowFinderData] = useState(null)

  // Hide bottom toolbar when any modal is open
  useEffect(() => {
    if (healingModalQuest || selectedGroanChallenge || groanCellContext) {
      document.body.classList.add('modal-active')
      return () => document.body.classList.remove('modal-active')
    }
  }, [healingModalQuest, selectedGroanChallenge, groanCellContext])

  // Load Flow Finder data for Play-list problem/persona mapping
  useEffect(() => {
    if (activeCategory === 'Play-list' && user?.id && !flowFinderData) {
      fetchFlowFinderData(user.id).then(result => {
        if (result?.data) setFlowFinderData(result.data)
      })
    }
  }, [activeCategory, user?.id])

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

  // Redirect to Stripe checkout for subscription upgrade
  const handleUpgrade = async () => {
    try {
      const url = await createCheckoutSession(user.id)
      window.location.href = url
    } catch (err) {
      console.error('Failed to create checkout session:', err)
    }
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

  // Pre-launch lock: only Flow Finder quests can be submitted
  const PRELAUNCH_LOCKED = false

  // Main quest completion handler
  const handleQuestComplete = async (quest, specialData = null, event = null) => {
    // Pre-launch guard: block all non-Flow Finder submissions
    if (PRELAUNCH_LOCKED && quest.type !== 'Flow Finder') return

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
      // Skip text validation when specialData is structured (e.g. ReconnectQuestInput passes an object)
      if (quest.inputType === 'text' && typeof inputValue === 'string' && (!inputValue || inputValue.trim() === '')) {
        alert('Please enter your reflection before completing this quest.')
        return
      }
      if (quest.inputType === 'text' && !inputValue) {
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
      } else if ((quest.inputType === 'text' || quest.inputType === 'dropdown') && inputValue && typeof inputValue === 'string') {
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
          progress.id,
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

        // Track analytics
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        trackGroanCompleted({
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

      // Guard: non-Healing/Voices quests require an active challenge instance
      const isUserLevelCategory = quest.category === 'Healing' || quest.category === 'Voices'
      if (!isUserLevelCategory && !progress?.challenge_instance_id) {
        alert('No active challenge found. Please start a challenge first.')
        return
      }

      // Create quest completion record
      const completionData = {
        user_id: user.id,
        challenge_instance_id: progress?.challenge_instance_id || null,
        quest_id: quest.id,
        quest_category: quest.category,
        quest_type: quest.type,
        points_earned: quest.points,
        challenge_day: progress?.current_day || 0,
        project_id: selectedProject?.id || null,
        stage: quest.stage_required || null
      }

      // Make Healing and Voices completions user-level (not tied to a challenge instance)
      if (quest.category === 'Healing') {
        completionData.challenge_instance_id = null
        completionData.project_id = null
        completionData.challenge_day = 0  // NOT NULL constraint requires a value

        // Track healing day for current level progress (non-blocking)
        const today = new Date().toISOString().slice(0, 10)
        supabase
          .from('user_level_progress')
          .select('healing_day_dates')
          .eq('user_id', user.id)
          .eq('current_level', currentJourneyLevel)
          .maybeSingle()
          .then(({ data }) => {
            const dates = data?.healing_day_dates || []
            if (dates.includes(today)) return
            const updated = [...dates, today]
            supabase.from('user_level_progress')
              .upsert(
                { user_id: user.id, current_level: currentJourneyLevel, healing_day_dates: updated },
                { onConflict: 'user_id,current_level' }
              )
              .then(() => {})
          })
      } else if (quest.category === 'Voices') {
        completionData.challenge_instance_id = null
        completionData.challenge_day = 0  // NOT NULL constraint requires a value
        // Keep project_id so we know which project the voice reflection came from
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
      } else if (quest.inputType === 'rating' || quest.inputType === 'referral') {
        // Rating/referral quests store data in questInputs as objects (specialData is null)
        completionData.reflection_text = safeStringify(inputValue)
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
      if (isUserLevelCategory) {
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
        // Check for level-up before refreshing scores (closure has old value)
        const oldXP = lifetimeScores?.lifetime_total_score || 0
        const newXP = oldXP + quest.points
        const oldLevel = getLevelNumber(oldXP)
        const newLevel = getLevelNumber(newXP)

        // Refresh user's scores from new tables
        await loadUserScores()

        // Trigger level-up celebration if level changed
        if (newLevel > oldLevel) {
          setTimeout(() => celebrateLevelUp(newLevel), 800)
        }
      } catch (scoreError) {
        console.error('Error updating scores:', scoreError)
        // Non-fatal - continue with quest completion
      }

      // Calculate points (used by challenge_progress update and artifact check)
      const rType = quest.type?.toLowerCase()
      const frequencyKey = quest.frequency === 'weekly' ? 'weekly' : 'daily'
      const newTotalPoints = (progress?.total_points || 0) + quest.points

      // Track fresh progress for tab bonus check (avoids stale closure after setProgress)
      let updatedProgress = progress

      // User-level quests (Healing, Voices) skip challenge_progress and project updates.
      // Their scoring is handled entirely by increment_scores RPC above.
      if (!isUserLevelCategory) {
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
          if (progressError.code === 'PGRST116') {
            alert('This challenge is no longer active. Please refresh the page.')
          } else {
            alert('Error updating progress. Please try again.')
          }
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
          .eq('challenge_instance_id', progress?.challenge_instance_id),
        supabase
          .from('quest_completions')
          .select('*')
          .eq('user_id', user.id)
          .is('challenge_instance_id', null)
          .or(`project_id.is.null,project_id.eq.${selectedProject?.id || '00000000-0000-0000-0000-000000000000'}`)
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

      let successMessage = `Quest complete! +${quest.points} RP`

      if (quest.counts_toward_graduation) {
        successMessage += '\nProgress toward graduation!'
      }

      if (artifactUnlocked && categoryArtifact) {
        successMessage = `Quest complete! +${quest.points} RP\n\nYou unlocked the ${categoryArtifact.name}!`
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

      // Splinter Check-in archived — was triggered after Release healing quests

      // Check for tab completion bonus (skip for user-level categories — bonus writes to challenge_progress)
      // Use freshCompletions + updatedProgress to avoid stale closure values
      if (!isUserLevelCategory) {
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
            visibilityLayer: cellData.visibilityLayer,
            // Include Play-list problem/persona context for richer AI generation
            ...(cellData.mappedProblemLabel && { mappedProblemLabel: cellData.mappedProblemLabel }),
            ...(cellData.mappedPersonaLabel && { mappedPersonaLabel: cellData.mappedPersonaLabel }),
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
    // Normalize: ensure visibilityLayer is always a string ID
    // handleCellClick passes `layer` (object), empty-cell button passes `visibilityLayer` (string)
    const normalized = {
      ...cellData,
      visibilityLayer: cellData.visibilityLayer || cellData.layer?.id || cellData.challenge?.visibility_layer,
      sourceId: cellData.sourceId || cellData.sourceItem?.id,
      sourceLabel: cellData.sourceLabel || cellData.sourceItem?.cluster_label,
      sourceInsight: cellData.sourceInsight || cellData.sourceItem?.insight,
    }
    if (normalized.challenge) {
      setSelectedGroanChallenge(normalized.challenge)
      setGroanCellContext(normalized)
    } else {
      // No challenge yet — open popup with cell context for creating one
      setSelectedGroanChallenge(null)
      setGroanCellContext(normalized)
    }
  }

  // Build enriched cell context with Play-list mapping data
  // On Play-list, keeps sourceType as 'skill' so it maps back to the skills matrix,
  // but includes problem/persona as supplementary context for AI generation.
  const getEnrichedCellContext = () => {
    if (!groanCellContext) return null
    // When on Play-list and user has mapped a problem, enrich with problem/persona context
    // but keep sourceType as 'skill' so the challenge appears on the skills matrix
    if (activeCategory === 'Play-list' && groanCellContext.sourceType === 'skill' && mappedProblemId && mappedProblemId !== 'not_specified') {
      const problem = mappedProblemId === 'custom'
        ? { id: null, label: customProblem || 'Custom problem' }
        : flowFinderData?.problems?.find(p => p.id === mappedProblemId)
      const persona = mappedPersonaId === 'custom'
        ? { id: null, label: customPersona || 'Custom persona' }
        : mappedPersonaId && mappedPersonaId !== 'not_specified'
          ? flowFinderData?.personas?.find(p => p.id === mappedPersonaId)
          : null
      return {
        ...groanCellContext,
        // Keep sourceType as 'skill' — the matrix is skills-only
        mappedProblemLabel: problem?.cluster_label || problem?.label || customProblem,
        mappedPersonaLabel: persona?.cluster_label || persona?.label || null,
      }
    }
    return groanCellContext
  }

  // Generate challenge via AI from within the popup
  const handleGenerateFromPopup = async () => {
    if (!groanCellContext) return
    setGroanChallengeLoading(true)
    try {
      const enrichedContext = getEnrichedCellContext()
      const result = await handleGenerateChallenge(enrichedContext)
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
          // Append 3% improvement text if provided
          if (threePercentText.trim() && newChallenges[0]) {
            const updatedDesc = `${newChallenges[0].description}\n3% improvement: ${threePercentText.trim()}`
            await supabase
              .from('groan_challenges')
              .update({ description: updatedDesc })
              .eq('id', newChallenges[0].id)
            setSelectedGroanChallenge(prev => ({ ...prev, description: updatedDesc }))
          }
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
        const ctx = getEnrichedCellContext() || groanCellContext
        // Build description with problem/persona context if mapped
        let description = `Custom challenge: ${customChallengeText.trim()}`
        if (threePercentText.trim()) {
          description += `\n3% improvement: ${threePercentText.trim()}`
        }
        if (ctx.mappedProblemLabel) {
          description += `\nProblem: ${ctx.mappedProblemLabel}`
        }
        if (ctx.mappedPersonaLabel) {
          description += `\nPersona: ${ctx.mappedPersonaLabel}`
        }
        // Always create as standard challenge (keeps sourceType for matrix lookup)
        const saveResult = await createGroanChallenge({
          userId: user.id,
          title: customChallengeText.trim(),
          description,
          visibilityLayer: ctx.visibilityLayer,
          sourceType: ctx.sourceType,
          sourceId: ctx.sourceId,
          sourceLabel: ctx.sourceLabel,
          scaryScore: 5,
          wahooScore: 5,
        })
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
    setGroanReflection({ beforeState: null, afterState: null, protectiveArchetype: null, reflection: '', didThreePercent: null })
    setGroanReflectionStep(true)
  }

  // Handle final completion with reflection data
  const handleCompleteGroanChallenge = async () => {
    if (!selectedGroanChallenge) return
    setGroanChallengeLoading(true)
    try {
      // Build reflection text with 3% improvement data
      let reflectionText = groanReflection.reflection || ''
      if (groanReflection.didThreePercent !== null) {
        reflectionText += `${reflectionText ? '\n' : ''}3% improvement: ${groanReflection.didThreePercent ? 'Yes' : 'No'}`
      }
      const { error } = await completeGroanChallenge(selectedGroanChallenge.id, {
        reflectionText,
        scaryScoreAfter: null,
        wahooScoreAfter: null
      })
      if (error) throw error

      // Award points: insert quest_completions record for the Groans category
      // quest_id includes challenge ID so the unique index allows multiple completions
      const PLAY_LIST_POINTS = 7
      const questId = `play_list_challenge_${selectedGroanChallenge.id}`
      const { error: questError } = await supabase
        .from('quest_completions')
        .insert({
          user_id: user.id,
          challenge_instance_id: progress?.challenge_instance_id || null,
          quest_id: questId,
          quest_category: 'Groans',
          quest_type: 'Rewire',
          points_earned: PLAY_LIST_POINTS,
          challenge_day: progress?.current_day || 0,
          project_id: selectedProject?.id || null,
          reflection_text: JSON.stringify({
            challenge_id: selectedGroanChallenge.id,
            source_label: selectedGroanChallenge.source_label,
            visibility_layer: selectedGroanChallenge.visibility_layer,
            before_state: groanReflection.beforeState,
            after_state: groanReflection.afterState,
            protective_archetype: groanReflection.protectiveArchetype,
            reflection: groanReflection.reflection
          })
        })
      if (questError) {
        console.warn('Error awarding play-list points:', questError)
      } else {
        // Update local completions state so points reflect immediately
        setCompletions(prev => [...prev, {
          user_id: user.id,
          quest_id: questId,
          quest_category: 'Groans',
          quest_type: 'Rewire',
          points_earned: PLAY_LIST_POINTS,
          completed_at: new Date().toISOString()
        }])
      }

      // Insert nervous system check-in
      try {
        await supabase.from('nervous_system_checkins').insert({
          user_id: user.id,
          before_state: groanReflection.beforeState,
          after_state: groanReflection.afterState,
          protective_archetype: groanReflection.protectiveArchetype,
          checkin_type: 'playlist',
          source_quest_id: questId,
          source_challenge_id: selectedGroanChallenge.id,
        })
      } catch (e) {
        console.warn('NS check-in insert error:', e)
      }

      // Remove from priority_weekly_picks so it no longer shows as active
      try {
        await supabase
          .from('priority_weekly_picks')
          .delete()
          .eq('user_id', user.id)
          .eq('pick_type', 'groan')
          .eq('reference_id', selectedGroanChallenge.id)
      } catch (e) {
        console.warn('Error removing weekly pick:', e)
      }

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

  // Handle compass check-in after Play-list challenge completion
  // handleCompassAfterGroan removed — compass step replaced by NS check-in

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
    setThreePercentText('')
    // Reset Play-list mapping state
    setMappedProblemId('')
    setMappedPersonaId('')
    setCustomProblem('')
    setCustomPersona('')
  }

  // Compute which visibility layers are locked based on progress
  const layerLockStatus = getLayerLockStatus(
    flowFinderComplete,
    selectedProject?.current_stage ?? 0
  )

  // Extract all Flow Finder quests for the Play-list > Flow Finder sub-tab
  // Include flow_finder_skills despite being archived (shown under Skills group)
  const flowFinderQuests = (challengeData?.quests || []).filter(q =>
    q.type === 'Flow Finder' && (!q.archived || q.id === 'flow_finder_skills')
  )

  // Filter quests by the active category tab (exclude archived quests)
  let filteredQuests = challengeData?.quests?.filter(q => {
    if (q.archived) return false
    // Play-list tab handles its own content via PlayListTab component
    if (activeCategory === 'Play-list') return false
    return q.category === activeCategory
  }) || []

  // Sort: explainer quests first, groan quests last
  filteredQuests.sort((a, b) => {
    if (a.isExplainer && !b.isExplainer) return -1
    if (!a.isExplainer && b.isExplainer) return 1
    const aIsGroan = a.type === 'groan'
    const bIsGroan = b.type === 'groan'
    if (aIsGroan && !bIsGroan) return 1
    if (!aIsGroan && bIsGroan) return -1
    return 0
  })

  // Apply R-type and frequency filters for Healing tab
  let displayQuests = filteredQuests
  if (activeCategory === 'Healing') {
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

  if (showIntro) {
    return <ChallengeIntro userId={user?.id} onComplete={() => setShowIntro(false)} />
  }

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
  const artifactProgress = getArtifactProgress(activeCategory, null)

  // ============================================
  // Render: Main Challenge View
  // ============================================

  return (
    <div className="challenge-container content-enter">
      {showExplainer && <PortalExplainer onClose={handleCloseExplainer} />}
      {showDailyCheckin && <DailyCheckin userId={user?.id} onComplete={() => setShowDailyCheckin(false)} />}
      <NotificationPrompt />
      <ChallengeHeader
        navigate={navigate}
        settingsMenuRef={settingsMenuRef}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        handleOpenExplainer={handleOpenExplainer}
        onLeaderboardClick={() => navigate('/league')}
        streakDays={getConsecutiveStreakDays()}
        weeklyPoints={currentWeeklyPoints}
        matchupData={matchupData}
        categoryScores={categoryScores}
        matchupLoading={matchupLoading}
        totalXP={progress?.total_points || 0}
        currentJourneyLevel={currentJourneyLevel}
        wahooCount={wahooCountThisWeek}
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

      {/* ARCHIVED: Fantasy League nudge — re-enable when league is active
      {leagueExists && !isOnTeam && (
        <Link to="/league" className="league-nudge-banner" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'linear-gradient(135deg, rgba(94,23,235,0.06), rgba(233,162,59,0.06))',
          border: '1px solid rgba(94,23,235,0.12)',
          borderRadius: '14px', padding: '12px 16px',
          marginBottom: '12px', textDecoration: 'none', color: '#5e17eb',
          fontSize: '14px', fontWeight: 700, transition: 'all 0.2s',
        }}>
          🏆 Fantasy League is live! Join now →
        </Link>
      )}
      */}

      <div className="challenge-tabs stagger-children">
        {categories.map(category => {
          const isComingSoon = lockedCategories?.has(category)
          const isLocked = isComingSoon || ((currentJourneyLevel ?? 0) === 0 && !unlockedTabs.has(category))
          return (
            <button
              key={category}
              className={`challenge-tab ${activeCategory === category ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => !isLocked && setActiveCategory(category)}
              disabled={isLocked}
              title={isComingSoon ? 'Coming soon' : isLocked ? 'Complete Level onboarding to unlock' : undefined}
            >
              {category}
              {isComingSoon ? <span className="lock-icon" style={{ fontSize: '0.7em', opacity: 0.6 }}>Soon</span> : isLocked && <span className="lock-icon">🔒</span>}
            </button>
          )
        })}
      </div>

      {/* Frequency tabs for Healing */}
      {activeCategory === 'Healing' && (
        <div className="stage-tabs-wrapper">
          <div className="stage-tabs-container healing-frequency-tabs">
            <div className="stage-tabs">
              {[
                { id: 'daily', label: 'Daily', icon: '☀️', color: '#5e17eb' },
                { id: 'weekly', label: 'Weekly', icon: '📅', color: '#7c3aed' },
                { id: 'explainer', label: 'Explainers', icon: '📖', color: '#c27aed' },
                { id: 'map', label: 'Map', icon: '🧠', color: '#9333ea', route: '/nervous-system-map' }
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
                    onClick={() => tab.route ? navigate(tab.route) : setActiveFrequencyFilter(tab.id)}
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
            onBack={() => setActiveCategory('Play-list')}
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
        {/* Artifact Progress — hidden on Play-list tab */}
        {artifactProgress && activeCategory !== 'Play-list' && (() => {
          const stageConfig = null

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
            : stageConfig ? stageConfig.description
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
                    return <p className="tab-bonus-text earned">+{tabStatus.bonusPoints} RP bonus earned!</p>
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



        {/* Stage-style sub-tabs for Play-list: Flow Finder | Play-list | Play Profile */}
        {/* Flow Finder sub-tabs archived — skills revealed through levels */}

        {/* Play-list Tab — Flow Finder + Courage Matrix + Voice Logging */}
        {activeCategory === 'Play-list' && (
          <PlayListTab
            userId={user?.id}
            currentVisibilityLayer={getLevelConfig(currentJourneyLevel)?.visibilityLayer || 'screen'}
            onQuestComplete={handleQuestComplete}
            onRefreshPoints={loadStageProgress}
          />
        )}

        {/* Healing Quests */}
        {activeCategory === 'Healing' && displayQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Healing</h2>
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
            {['Recognise', 'Release', 'Rewire', 'Reconnect', 'Rest'].filter(rType =>
              activeRTypeFilter === 'All' || activeRTypeFilter === rType
            ).map(rType => {
              const rTypeQuests = displayQuests
                .filter(q => q.type === rType)
                .sort((a, b) => {
                  if (a.frequency === 'daily' && b.frequency !== 'daily') return -1
                  if (a.frequency !== 'daily' && b.frequency === 'daily') return 1
                  return 0
                })
              if (rTypeQuests.length === 0) return null

              return (
                <div key={rType} className="quest-subsection healing-rows">
                  <h3 className="subsection-title">{rType}</h3>
                  <div className="healing-row-list">
                    {rTypeQuests.filter(quest => quest.id !== 'release_daily_challenge').map(quest => {
                      const completed = isQuestCompletedToday(quest.id, quest)
                      const isCompleting = completingQuestId === quest.id
                      const streak = quest.frequency === 'daily' ? getDailyStreak(quest.id) : null
                      const dayLabels = quest.frequency === 'daily' ? getDayLabels() : null

                      return (
                        <div key={quest.id} className={`ht-item-row ${completed ? 'done' : ''}`}>
                          <span className={`ht-item-check ${completed ? 'done' : ''}`}>
                            {completed ? '✓' : ''}
                          </span>
                          <div className="ht-item-body">
                            <div className="ht-item-name">{quest.name}</div>
                            <div className="ht-item-meta">
                              <span className="ht-item-type">{quest.type}</span>
                              <span className="ht-item-sep">·</span>
                              <span className="ht-pts">{quest.points}pts</span>
                            </div>
                            {streak && dayLabels && (
                              <div className="ht-streak-dots">
                                {dayLabels.map((day, i) => (
                                  <div key={i} className="ht-streak-day">
                                    <span className={`ht-streak-dot ${streak[i] ? 'filled' : ''}`} />
                                    <span className="ht-streak-label">{day}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {completed && quest.flow_route && quest.frequency === 'explainer' ? (
                            <a
                              href={`${quest.flow_route}?returnTo=/7-day-challenge`}
                              className="ht-item-action reread-action"
                              style={{ textDecoration: 'none', textAlign: 'center' }}
                            >
                              Read Again
                            </a>
                          ) : completed && quest.flow_route ? (
                            <a
                              href={`${quest.flow_route}?returnTo=/7-day-challenge`}
                              className="ht-item-action reread-action"
                              style={{ textDecoration: 'none', textAlign: 'center' }}
                            >
                              View Results
                            </a>
                          ) : completed ? (
                            <span className="ht-item-action done-action">Done</span>
                          ) : (
                            <button
                              className="ht-item-action"
                              disabled={isCompleting}
                              onClick={() => setHealingModalQuest(quest)}
                            >
                              {isCompleting ? '...' : 'Complete'}
                            </button>
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

        {/* Level Tab */}
        {activeCategory === 'Level' && (
          <LevelTab currentLevel={viewingLevel ?? currentJourneyLevel ?? 0} maxUnlockedLevel={currentJourneyLevel ?? 0} userId={user?.id} onLevelChange={setViewingLevel} onNavigateTab={(tab) => {
            setUnlockedTabs(prev => new Set([...prev, tab]))
            setActiveCategory(tab)
          }} onGraduate={(newLevel) => {
            setCurrentJourneyLevel(newLevel)
            setViewingLevel(newLevel)
          }} />
        )}

        {/* Bonus Sub-Tabs: Tasks | Content */}
        {activeCategory === 'Bonus' && (
          <div className="stage-tabs-wrapper">
            <div className="stage-tabs-container">
              <div className="stage-tabs" style={{ justifyContent: 'center' }}>
                {[
                  { key: 'tasks', icon: '✅', label: 'Tasks', color: '#5e17eb' },
                  { key: 'content', icon: '📝', label: 'Content', color: '#E9A23B' },
                ].map(tab => {
                  const isActive = bonusSubTab === tab.key
                  const activeStyles = isActive ? {
                    background: tab.color,
                    borderColor: tab.color,
                    color: 'white'
                  } : {}
                  return (
                    <button
                      key={tab.key}
                      className={`stage-tab available ${isActive ? 'active' : ''}`}
                      onClick={() => setBonusSubTab(tab.key)}
                      style={{ '--stage-color': tab.color, ...activeStyles }}
                    >
                      <span className="tab-icon">{tab.icon}</span>
                      <span className="tab-label">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bonus Quests — Tasks sub-tab */}
        {activeCategory === 'Bonus' && bonusSubTab === 'tasks' && filteredQuests.length > 0 && (
          <div className="quest-section healing-rows">
            <h2 className="section-title">Bonus Quests</h2>
            <div className="healing-row-list">
              {filteredQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                const isCompleting = completingQuestId === quest.id
                const isFlow = quest.inputType === 'flow'

                return (
                  <div key={quest.id} className={`ht-item-row ${completed ? 'done' : ''}`}>
                    <span className={`ht-item-check ${completed ? 'done' : ''}`}>
                      {completed ? '✓' : ''}
                    </span>
                    <div className="ht-item-body">
                      <div className="ht-item-name">{quest.name}</div>
                      <div className="ht-item-meta">
                        <span className="ht-item-type">Bonus</span>
                        <span className="ht-item-sep">·</span>
                        <span className="ht-pts">{quest.points}pts</span>
                      </div>
                    </div>
                    {completed ? (
                      <span className="ht-item-action done-action">Done</span>
                    ) : isFlow && quest.flow_route ? (
                      <a
                        href={`${quest.flow_route}?returnTo=/7-day-challenge`}
                        className="ht-item-action"
                        style={{ textDecoration: 'none', textAlign: 'center' }}
                      >
                        Start →
                      </a>
                    ) : (
                      <button
                        className="ht-item-action"
                        disabled={isCompleting}
                        onClick={() => setHealingModalQuest(quest)}
                      >
                        {isCompleting ? '...' : 'Complete'}
                      </button>
                    )}
                  </div>
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

        {/* Tracker tab removed — content moved to Play-list tab and /me page */}
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
                {selectedGroanChallenge && (() => {
                  const desc = selectedGroanChallenge.description || ''
                  const lines = desc.split('\n')
                  const mainText = lines[0] || ''
                  const metaLines = lines.slice(1).filter(l => l.trim())
                  return (
                    <div className="groan-modal-description">
                      <p className="groan-desc-main">{mainText}</p>
                      {metaLines.length > 0 && (
                        <div className="groan-desc-meta">
                          {metaLines.map((line, i) => {
                            const colonIdx = line.indexOf(':')
                            if (colonIdx > 0) {
                              const label = line.slice(0, colonIdx).trim()
                              const value = line.slice(colonIdx + 1).trim()
                              return (
                                <div key={i} className="groan-desc-meta-row">
                                  <span className="groan-desc-meta-label">{label}</span>
                                  <span className="groan-desc-meta-value">{value}</span>
                                </div>
                              )
                            }
                            return <p key={i} className="groan-desc-main">{line}</p>
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}

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

                {/* Play-list: Required problem/persona mapping for skills-only matrix */}
                {activeCategory === 'Play-list' && !selectedGroanChallenge && groanCellContext?.sourceType === 'skill' && groanCellContext?.visibilityLayer && (
                  <div className="groan-mapping-step">
                    <label className="groan-custom-label">Which problem does this skill address?</label>
                    <select
                      className="groan-mapping-select"
                      value={mappedProblemId}
                      onChange={(e) => setMappedProblemId(e.target.value)}
                    >
                      <option value="not_specified">Not specified</option>
                      {flowFinderData?.problems?.map(p => (
                        <option key={p.id} value={p.id}>{p.cluster_label}</option>
                      ))}
                      <option value="custom">Enter custom...</option>
                    </select>
                    {mappedProblemId === 'custom' && (
                      <input
                        className="groan-custom-input"
                        type="text"
                        placeholder="Describe the problem..."
                        value={customProblem}
                        onChange={(e) => setCustomProblem(e.target.value)}
                      />
                    )}

                    <label className="groan-custom-label" style={{ marginTop: '0.75rem' }}>Who is this for?</label>
                    <select
                      className="groan-mapping-select"
                      value={mappedPersonaId}
                      onChange={(e) => setMappedPersonaId(e.target.value)}
                    >
                      <option value="not_specified">Not specified</option>
                      {flowFinderData?.personas?.map(p => (
                        <option key={p.id} value={p.id}>{p.cluster_label}</option>
                      ))}
                      <option value="custom">Enter custom...</option>
                    </select>
                    {mappedPersonaId === 'custom' && (
                      <input
                        className="groan-custom-input"
                        type="text"
                        placeholder="Describe the persona..."
                        value={customPersona}
                        onChange={(e) => setCustomPersona(e.target.value)}
                      />
                    )}
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
                    <label className="groan-custom-label">How can you make this 3% better?</label>
                    <input
                      type="text"
                      className="groan-custom-input"
                      placeholder="Type your 3% improvement..."
                      value={threePercentText}
                      onChange={(e) => setThreePercentText(e.target.value)}
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
                    <>
                      <div className="groan-completed-badge">
                        ✅ Challenge Completed
                      </div>
                      <button
                        className="groan-btn groan-btn-new-challenge"
                        onClick={() => {
                          // Clear current challenge to show new challenge form for same cell
                          setSelectedGroanChallenge(null)
                          setCustomChallengeText('')
                          setThreePercentText('')
                        }}
                      >
                        🎯 New Challenge
                      </button>
                    </>
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
                  <NervousSystemCheckin
                    mode="both"
                    beforeState={groanReflection.beforeState}
                    afterState={groanReflection.afterState}
                    onBeforeChange={(v) => setGroanReflection(prev => ({
                      ...prev, beforeState: v,
                      protectiveArchetype: needsArchetype(v, prev.afterState) ? prev.protectiveArchetype : null,
                    }))}
                    onAfterChange={(v) => setGroanReflection(prev => ({
                      ...prev, afterState: v,
                      protectiveArchetype: needsArchetype(prev.beforeState, v) ? prev.protectiveArchetype : null,
                    }))}
                    protectiveArchetype={groanReflection.protectiveArchetype}
                    onArchetypeChange={(v) => setGroanReflection(prev => ({ ...prev, protectiveArchetype: v }))}
                    hideButton
                  />

                  {/* 3% improvement toggle — only show if the challenge had a 3% item */}
                  {selectedGroanChallenge?.description?.includes('3% improvement:') && (() => {
                    const match = selectedGroanChallenge.description.match(/3% improvement:\s*(.+?)(?:\n|$)/)
                    const improvementText = match?.[1]?.trim()
                    return (
                    <div className="groan-three-percent-toggle">
                      <label className="groan-three-percent-label">Did you implement your 3% improvement?</label>
                      {improvementText && (
                        <div className="groan-three-percent-quote">"{improvementText}"</div>
                      )}
                      <div className="groan-toggle-buttons">
                        <button
                          className={`groan-toggle-btn ${groanReflection.didThreePercent === true ? 'active yes' : ''}`}
                          onClick={() => setGroanReflection(prev => ({ ...prev, didThreePercent: true }))}
                        >
                          Yes
                        </button>
                        <button
                          className={`groan-toggle-btn ${groanReflection.didThreePercent === false ? 'active no' : ''}`}
                          onClick={() => setGroanReflection(prev => ({ ...prev, didThreePercent: false }))}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    )
                  })()}

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
                    disabled={groanChallengeLoading || !groanReflection.beforeState || !groanReflection.afterState || (needsArchetype(groanReflection.beforeState, groanReflection.afterState) && !groanReflection.protectiveArchetype)}
                  >
                    {groanChallengeLoading ? 'Saving...' : 'Complete Challenge'}
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
          projectId={selectedProject?.id || null}
          challengeInstanceId={progress?.id || null}
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

      {/* Level-up celebration modal */}
      {showLevelUp && (
        <LevelUpModal level={showLevelUp} onClose={closeLevelUp} />
      )}

      {/* Healing completion modal (compact row design) */}
      {healingModalQuest && (
        <HealingCompletionModal
          quest={healingModalQuest}
          userId={user?.id}
          onComplete={(quest, textInput) => {
            const inputValue = quest.inputType === 'checkbox' ? 'completed' : textInput
            handleQuestComplete(quest, inputValue)
          }}
          onClose={() => setHealingModalQuest(null)}
        />
      )}
      </div>
    </div>
  )
}

export default Challenge
