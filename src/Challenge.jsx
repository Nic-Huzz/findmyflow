import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { sanitizeText } from './lib/sanitize'
import { trackGroanCompleted } from './lib/analytics'
import confetti from 'canvas-confetti'
import { triggerSideCannons, MicroToast } from './components/Celebrations'
import LevelUpModal from './components/Celebrations/LevelUpModal'
import { useCelebrations } from './hooks/useCelebrations'
import { getLevel, getLevelNumber } from './lib/crm/statsService'
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
import TuneTab from './components/TuneTab'
import './components/TuneTab.css'
import PriorityTab from './components/PriorityTab'
import CompassCheckin from './components/CompassCheckin'
import GroansSummary from './components/GroansSummary'
import HealingSummary from './components/HealingSummary'
import HealingCompletionModal from './components/HealingCompletionModal'
import PostActionModal, { POST_ACTION_MILESTONE_IDS } from './components/PostActionModal'
import PreActionModal, { PRE_ACTION_MILESTONE_IDS } from './components/PreActionModal'
import { useChallengeData } from './hooks/useChallengeData'
import { useLeagueData } from './hooks/useLeagueData'
import { useMatchupData } from './hooks/useMatchupData'
import { getScoringCategory } from './lib/scoringCategories'
// ContentChallenges archived — moves to Fantasy League when reactivated
import WhatsAppErrorButton from './components/WhatsAppErrorButton'
import SplinterCheckin from './components/SplinterCheckin'
import HealingIntentionCard from './components/HealingIntentionCard'
import HealingIntentionSetter from './components/HealingIntentionSetter'
import HealingIntentionCheckin from './components/HealingIntentionCheckin'
import ChallengeIntro from './components/ChallengeIntro'
import DailyCheckin from './components/DailyCheckin'
import WeeklyReview from './components/WeeklyReview'
import LevelTab from './components/level/LevelTab'
import JourneyTab from './components/JourneyTab'
import { getLevelConfig } from './components/level/LevelConfig'
import { getWeekStartLocal } from './lib/dateUtils'
// CreatorHome moved to standalone /create route
import { checkHeroGraduation } from './lib/heroStageChecker'
import { postFeedEvent } from './lib/communityFeed'
import { preloadChallengeFlows } from './lib/preloadRoutes'
import { useInsightDrops } from './hooks/useInsightDrops'
import InsightDrop from './components/InsightDrop'
import FigurineFAB from './components/Figurine/FigurineFAB'
import FigurineOverlay from './components/Figurine/FigurineOverlay'
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
    reloadCompletions,
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

  // Chat conflict management (Figurine vs Zarlo)
  const [activeChat, setActiveChat] = useState(null)

  // Figurine: Mirror→Mentor transition moment (Step 9)
  const [showMentorTransition, setShowMentorTransition] = useState(false)
  const [mentorTransitionAvatar, setMentorTransitionAvatar] = useState(null)

  // Figurine: Monthly cryptic hook (Step 10)
  const [crypticHook, setCrypticHook] = useState(null)

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

  // Daily nervous system check-in (3x per day: first login, 1pm, 6pm)
  const [showDailyCheckin, setShowDailyCheckin] = useState(false)
  const [capacityRefresh, setCapacityRefresh] = useState(0)

  // Weekly Review state
  const [weeklyReviewNeeded, setWeeklyReviewNeeded] = useState(false)
  const [weeklyReviewDismissed, setWeeklyReviewDismissed] = useState(false)
  const [showWeeklyReview, setShowWeeklyReview] = useState(false)
  const [reviewWeekStart, setReviewWeekStart] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    const now = new Date()
    const hour = now.getHours()

    // Determine current window start: midnight, 1pm, or 6pm
    const windowStart = new Date(now)
    if (hour >= 18) {
      windowStart.setHours(18, 0, 0, 0)
    } else if (hour >= 13) {
      windowStart.setHours(13, 0, 0, 0)
    } else {
      windowStart.setHours(0, 0, 0, 0)
    }

    supabase
      .from('nervous_system_checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('checkin_type', 'daily')
      .gte('created_at', windowStart.toISOString())
      .limit(1)
      .then(({ data }) => {
        if (!data?.length) setShowDailyCheckin(true)
      })
  }, [user?.id])

  // Weekly Review trigger (Sunday or Monday)
  useEffect(() => {
    if (!user?.id) return
    const day = new Date().getDay()
    if (day !== 0 && day !== 1) return // only Sun/Mon
    // Sunday: review this week. Monday: review last week.
    const reviewWeek = day === 0 ? getWeekStartLocal() : getWeekStartLocal(new Date(), -1)
    setReviewWeekStart(reviewWeek)
    supabase
      .from('weekly_reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', reviewWeek)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setWeeklyReviewNeeded(true)
      })
  }, [user?.id])

  // Step 9: Mirror→Mentor transition moment (fires once when user crosses threshold)
  useEffect(() => {
    if (localStorage.getItem('figurine_mentor_transition_shown')) return
    if (!user?.id) return
    Promise.all([
      supabase.from('quest_completions').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('quest_category', 'Groans'),
      supabase.from('nervous_system_checkins').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('checkin_type', 'daily'),
      supabase.from('user_stage_progress').select('essence_mirror_completed, hero_avatar_url')
        .eq('user_id', user.id).maybeSingle(),
    ]).then(([wahoos, checkins, stage]) => {
      if (wahoos.count >= 3 && checkins.count >= 7 && stage.data?.essence_mirror_completed) {
        if (!localStorage.getItem('figurine_mentor_transition_shown')) {
          setShowMentorTransition(true)
          setMentorTransitionAvatar(stage.data?.hero_avatar_url)
          localStorage.setItem('figurine_mentor_transition_shown', 'true')
        }
      }
    })
  }, [user?.id])

  // Step 10: Monthly cryptic hook from Figurine
  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7) // "2026-07"
    if (localStorage.getItem(`figurine_cryptic_${month}`)) return
    if (!user?.id) return

    supabase.from('user_stage_progress')
      .select('current_journey_level, hero_avatar_url')
      .eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data || data.current_journey_level < 4) return // Only for Stage 4+

        const hooks = [
          "There's something connecting your paths. You're not ready to see it yet.",
          "The voice you keep fighting? It's trying to protect something real.",
          "What if the thing you're avoiding is the thing you're meant to do?",
          "You're closer than you think. But not to what you expect.",
          "The pattern will break. Not because you forced it. Because you outgrew it.",
        ]
        const hookIndex = parseInt(month.replace('-', '')) % hooks.length

        setCrypticHook({ message: hooks[hookIndex], avatarUrl: data.hero_avatar_url })
        localStorage.setItem(`figurine_cryptic_${month}`, 'true')
      })
  }, [user?.id])

  // Celebrations (level-up modal)
  const { showLevelUp, levelUpKey, celebrateLevelUp, celebrateStageGraduation, closeLevelUp } = useCelebrations()

  // Insight Drops (self-knowledge cards, max 1 per session)
  const { insight, dismissInsight } = useInsightDrops(user?.id)

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
  // Healing info pop-up (quest description)
  const [healingInfoQuest, setHealingInfoQuest] = useState(null)

  // Wahoo count: all completed challenges this week
  const [wahooCountThisWeek, setWahooCountThisWeek] = useState(0)

  // Dynamic level detection + hero stage graduation
  const [currentJourneyLevel, setCurrentJourneyLevel] = useState(0)
  const [viewingLevel, setViewingLevel] = useState(null)
  const [unlockedTabs, setUnlockedTabs] = useState(new Set(['Quests', 'Tune']))

  // Post-action trigger: bumped by completion handlers to re-check graduation immediately
  const [stageCheckTrigger, setStageCheckTrigger] = useState(0)
  const recheckStage = useCallback(() => setStageCheckTrigger(n => n + 1), [])

  useEffect(() => {
    if (!user?.id) return

    const loadStageAndCheckGraduation = async () => {
      // 1. Check for graduation FIRST (may update the stage in DB)
      const graduation = await checkHeroGraduation(user.id)

      // 2. Load current stage (may have just been updated by graduation check)
      const { data } = await supabase
        .from('user_stage_progress')
        .select('current_journey_level')
        .eq('user_id', user.id)
        .maybeSingle()

      const level = data?.current_journey_level || 0
      setCurrentJourneyLevel(level)

      // 3. Celebrate graduation if detected
      if (graduation) {
        const lastKnown = parseInt(localStorage.getItem('last_hero_stage') || '0')
        localStorage.setItem('last_hero_stage', String(graduation.to))

        // Only celebrate if user has visited before (not first load ever)
        if (lastKnown > 0) {
          celebrateStageGraduation(graduation.from, graduation.to, {
            essenceName: graduation.stageData?.essence_name,
            voiceName: graduation.dominantVoice,
            avatarUrl: graduation.stageData?.hero_avatar_url,
            useFigurineOverlay: graduation.to >= 4,
          })
        }
      } else {
        const lastKnown = parseInt(localStorage.getItem('last_hero_stage') || '0')
        if (lastKnown === 0 && level > 0) {
          localStorage.setItem('last_hero_stage', String(level))
        }
      }

      // 4. PRESERVE ALL EXISTING TAB UNLOCK LOGIC
      // Pre-unlock tabs based on DB state for Level 0
      if (level === 0) {
        // Unlock Courage tab if wahoos identified (discovery flow / quick-add)
        // or legacy play-skills picked (PlaySkillPicker, pre-2026-06)
        Promise.all([
          supabase.from('groan_challenges')
            .select('id').eq('user_id', user.id).not('wahoo_category', 'is', null).limit(1),
          supabase.from('nikigai_clusters')
            .select('id').eq('user_id', user.id).eq('cluster_type', 'skills').eq('step_id', 'get_started').limit(1),
        ]).then(([wahoos, skills]) => {
          if (wahoos.data?.length > 0 || skills.data?.length > 0) {
            setUnlockedTabs(prev => new Set([...prev, 'Courage']))
          }
        })
      }
    }

    loadStageAndCheckGraduation()
  }, [user?.id, stageCheckTrigger])

  // Wahoo count: all completed challenges this week
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('groan_challenges')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
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

  // State for POST-ACTION modal (3% reflection after completing milestones)
  const [postActionQuest, setPostActionQuest] = useState(null)
  const [splinterCheckinData, setSplinterCheckinData] = useState(null)
  const [healingIntention, setHealingIntention] = useState(null)
  const [healingIntentionLoaded, setHealingIntentionLoaded] = useState(false)
  const [lifePathStuckPoints, setLifePathStuckPoints] = useState([])
  const [showIntentionSetter, setShowIntentionSetter] = useState(false)
  const [showIntentionCheckin, setShowIntentionCheckin] = useState(false)

  // State for PRE-ACTION modal (resistance capture before starting milestones)
  const [preActionQuest, setPreActionQuest] = useState(null)
  const [preActionPendingData, setPreActionPendingData] = useState(null)

  // Hide bottom toolbar when any modal is open
  useEffect(() => {
    if (healingModalQuest) {
      document.body.classList.add('modal-active')
      return () => document.body.classList.remove('modal-active')
    }
  }, [healingModalQuest])

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
      const isUserLevelCategory = quest.category === 'Healing' || quest.category === 'Voices' || quest.category === 'Tune'
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

        // Track weekly healing quest for current level progress (non-blocking)
        if (currentJourneyLevel > 0 && quest.frequency === 'weekly') {
          supabase
            .from('user_level_progress')
            .select('healing_quest_ids')
            .eq('user_id', user.id)
            .eq('current_level', currentJourneyLevel)
            .maybeSingle()
            .then(({ data }) => {
              const existing = data?.healing_quest_ids || []
              if (!existing.includes(quest.id)) {
                supabase.from('user_level_progress')
                  .upsert(
                    { user_id: user.id, current_level: currentJourneyLevel, healing_quest_ids: [...existing, quest.id] },
                    { onConflict: 'user_id,current_level' }
                  )
                  .then(() => {})
              }
            })
        }
      } else if (quest.category === 'Tune') {
        completionData.challenge_instance_id = null
        completionData.project_id = null
        completionData.challenge_day = 0  // NOT NULL constraint requires a value

        // Track tune day for current level progress (non-blocking)
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
      const hasStructuredData = (structuredDataTypes.includes(quest.type?.toLowerCase()) || quest.inputType === 'rewire_quest') && specialData

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

      // Save structured data to response_data JSONB column for quests that need it
      if (hasStructuredData && typeof specialData === 'object') {
        completionData.response_data = specialData
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
        // Read fresh XP from DB after increment to detect level-up reliably
        const { data: freshScores } = await supabase
          .from('user_lifetime_scores')
          .select('lifetime_total_score')
          .eq('user_id', user.id)
          .is('project_id', null)
          .maybeSingle()
        const freshXP = freshScores?.lifetime_total_score || 0
        const priorXP = freshXP - quest.points
        if (getLevelNumber(freshXP) > getLevelNumber(priorXP)) {
          const newLevel = getLevel(freshXP)
          setTimeout(() => celebrateLevelUp(newLevel), 800)
          postFeedEvent(user.id, 'level_up', `Reached ${newLevel?.name || 'a new level'}`)
        }

        // Refresh user's scores from new tables
        await loadUserScores()
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
        const streakResult = await handleStreakUpdate(user.id, progress.challenge_instance_id)

        // Auto-post streak milestones to community feed
        if (streakResult?.streak_incremented && streakResult.streak_days) {
          const STREAK_MILESTONES = [7, 14, 30, 60, 100]
          const days = streakResult.streak_days
          if (STREAK_MILESTONES.includes(days)) {
            postFeedEvent(user.id, 'streak_milestone', `${days} day streak`, `${days} days in a row`)
          }
        }

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

      // Re-check hero stage graduation after any quest completion
      recheckStage()

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

  // Fetch healing intention for current week
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('weekly_healing_intentions')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', getWeekStartLocal())
      .maybeSingle()
      .then(({ data }) => {
        setHealingIntention(data || null)
        setHealingIntentionLoaded(true)
      })
    // Load stuck points from life path session for healing intention suggestions
    if (user?.email) {
      supabase
        .from('life_path_sessions')
        .select('stuck_points')
        .eq('client_email', user.email)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.stuck_points) setLifePathStuckPoints(data.stuck_points)
        })
    }
  }, [user?.id, user?.email])

  // Extract all Flow Finder quests for the Play-list > Flow Finder sub-tab
  // Include flow_finder_skills despite being archived (shown under Skills group)
  const flowFinderQuests = (challengeData?.quests || []).filter(q =>
    q.type === 'Flow Finder' && (!q.archived || q.id === 'flow_finder_skills')
  )

  // Filter quests by the active category tab (exclude archived quests)
  let filteredQuests = challengeData?.quests?.filter(q => {
    if (q.archived) return false
    // Play-list and Tune tabs handle their own content via standalone components
    if (activeCategory === 'Courage') return false
    if (activeCategory === 'Tune') return false
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

  // Apply search filter
  let displayQuests = filteredQuests
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

  // Note: Level, Tune, and Play-list tabs work without progress (self-contained).
  // Only Healing tab needs progress for quest tracking. Don't block the whole page.

  const categoryPoints = getCategoryPoints(activeCategory)
  const artifactProgress = getArtifactProgress(activeCategory, null)

  // ============================================
  // Render: Main Challenge View
  // ============================================

  return (
    <div className="challenge-container content-enter">
      {showExplainer && <PortalExplainer onClose={handleCloseExplainer} />}
      {showDailyCheckin && <DailyCheckin userId={user?.id} onComplete={() => { setShowDailyCheckin(false); setCapacityRefresh(n => n + 1); recheckStage() }} />}
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
        totalXP={lifetimeScores?.lifetime_total_score || 0}
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

      {showWeeklyReview && reviewWeekStart && (
        <WeeklyReview
          userId={user.id}
          weekStart={reviewWeekStart}
          onComplete={() => { setShowWeeklyReview(false); setWeeklyReviewNeeded(false) }}
          onClose={() => setShowWeeklyReview(false)}
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

      {/* Healing tab — new per-task intentions only, no legacy cards */}

      <div className="challenge-content">
        {/* Weekly Review CTA */}
        {weeklyReviewNeeded && !weeklyReviewDismissed && !showWeeklyReview && (
          <div className="wr-cta-card" onClick={() => setShowWeeklyReview(true)}>
            <div className="wr-cta-left">
              <span className="wr-cta-icon">⚡</span>
              <div className="wr-cta-text">
                <span className="wr-cta-title">Weekly Review</span>
                <span className="wr-cta-sub">60s audit · +15 RP</span>
              </div>
            </div>
            <div className="wr-cta-right">
              <span className="wr-cta-arrow">→</span>
              <button className="wr-cta-dismiss" onClick={e => { e.stopPropagation(); setWeeklyReviewDismissed(true) }}>&times;</button>
            </div>
          </div>
        )}

        {/* Groans Summary */}
        {activeCategory === 'GroansSummary' && (
          <GroansSummary
            onBack={() => setActiveCategory('Courage')}
            progress={progress}
            completions={completions}
          />
        )}

        {/* Healing Summary */}
        {activeCategory === 'HealingSummary' && (
          <HealingSummary
            onBack={() => setActiveCategory('Courage')}
            progress={progress}
          />
        )}

        {/* Quest Content - only show if not on Summary tabs */}
        {activeCategory !== 'GroansSummary' && activeCategory !== 'HealingSummary' && (
          <>
        {/* Artifact Progress — hidden on Courage tab */}
        {artifactProgress && activeCategory !== 'Courage' && (() => {
          const artifactName = artifactProgress.name
          const artifactDesc = artifactProgress.description
          return (
          <div className={`artifact-progress ${artifactProgress.unlocked ? 'unlocked' : ''}`}>
            <div className="artifact-header">
              <h3>{artifactProgress.unlocked ? '✅' : ''} {artifactName}</h3>
              <p className="artifact-description">{artifactDesc}</p>
            </div>

            {!artifactProgress.unlocked && (
              <div className="artifact-bars">
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
                Artifact Unlocked! You&apos;ve completed this category.
              </div>
            )}
          </div>
          )
        })()}



        {/* Stage-style sub-tabs for Play-list: Flow Finder | Play-list | Play Profile */}
        {/* Flow Finder sub-tabs archived — skills revealed through levels */}

        {/* Tune Tab — Daily maintenance deposits */}
        {activeCategory === 'Tune' && (
          <TuneTab
            userId={user?.id}
            onQuestComplete={handleQuestComplete}
            onRefreshPoints={() => { loadStageProgress(); loadUserScores(); reloadCompletions() }}
            onLevelUp={(level) => celebrateLevelUp(level)}
          />
        )}

        {/* Play-list Tab — Wahoo challenges */}
        {activeCategory === 'Courage' && (
          <PlayListTab
            userId={user?.id}
            currentVisibilityLayer={getLevelConfig(currentJourneyLevel)?.visibilityLayer || 'screen'}
            onQuestComplete={handleQuestComplete}
            onRefreshPoints={() => { loadStageProgress(); loadUserScores(); reloadCompletions() }}
            wahooCount={wahooCountThisWeek}
          />
        )}

        {/* Journey Tab — hero stage, voice progress, thresholds */}
        {activeCategory === 'Journey' && (
          <JourneyTab userId={user?.id} />
        )}

        {/* Level Tab */}
        {activeCategory === 'Quests' && (
          <LevelTab currentLevel={viewingLevel ?? currentJourneyLevel ?? 0} maxUnlockedLevel={currentJourneyLevel ?? 0} userId={user?.id} capacityRefresh={capacityRefresh} onLevelChange={setViewingLevel} onNavigateTab={(tab) => {
            setUnlockedTabs(prev => new Set([...prev, tab]))
            setActiveCategory(tab)
          }} onGraduate={(newLevel) => {
            setCurrentJourneyLevel(newLevel)
            setViewingLevel(newLevel)
          }} />
        )}

        {/* Bonus tab archived — exercises move to Fantasy League when reactivated */}

        {/* Tracker tab removed — content moved to Play-list tab and /me page */}
      </>
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

      {/* Level-up / graduation celebration modal */}
      {showLevelUp && showLevelUp.useFigurineOverlay && (
        <FigurineOverlay
          avatarUrl={showLevelUp.avatarUrl}
          message={showLevelUp.name}
          emoji={showLevelUp.emoji}
          onDismiss={closeLevelUp}
        />
      )}
      {showLevelUp && !showLevelUp.useFigurineOverlay && (
        <LevelUpModal key={levelUpKey} level={showLevelUp} onClose={closeLevelUp} />
      )}

      {/* Healing quest info pop-up */}
      {healingInfoQuest && (
        <div className="tt-info-overlay" onClick={() => setHealingInfoQuest(null)}>
          <div className="tt-info-modal" onClick={e => e.stopPropagation()}>
            <div className="tt-info-modal-name">{healingInfoQuest.id === 'rewire_behavior_change' && userArchetypes.essence ? `Embody Your Essence: ${userArchetypes.essence}` : healingInfoQuest.name}</div>
            <div className="tt-info-modal-desc">{healingInfoQuest.description}</div>
            <button className="tt-info-modal-close" onClick={() => setHealingInfoQuest(null)}>Got it</button>
          </div>
        </div>
      )}

      {/* Healing completion modal (compact row design) */}
      {healingModalQuest && (
        <HealingCompletionModal
          quest={healingModalQuest}
          userId={user?.id}
          weeklyFocus={healingIntention?.intention_text}
          onComplete={async (quest, textInput) => {
            const inputValue = quest.inputType === 'checkbox' ? 'completed' : textInput
            await handleQuestComplete(quest, inputValue)
            recheckStage()
          }}
          onClose={() => setHealingModalQuest(null)}
        />
      )}

      {/* Healing Intention Setter Modal */}
      {showIntentionSetter && (
        <HealingIntentionSetter
          userId={user?.id}
          stuckPoints={lifePathStuckPoints}
          onSave={(data) => {
            setHealingIntention(data)
            setShowIntentionSetter(false)
          }}
          onClose={() => setShowIntentionSetter(false)}
        />
      )}

      {/* Healing Intention Check-in Modal */}
      {showIntentionCheckin && healingIntention && (
        <HealingIntentionCheckin
          intention={healingIntention}
          onSave={(data) => {
            setHealingIntention(data)
            setShowIntentionCheckin(false)
          }}
          onClose={() => setShowIntentionCheckin(false)}
        />
      )}

      {/* Insight Drop (self-knowledge card, max 1 per session) */}
      {insight && <InsightDrop insight={insight} onDismiss={dismissInsight} />}

      {/* Figurine FAB (bottom-left, chat conflict managed) */}
      <FigurineFAB activeChat={activeChat} setActiveChat={setActiveChat} />

      {/* Figurine: Mirror→Mentor transition overlay (Step 9) */}
      {showMentorTransition && (
        <FigurineOverlay
          avatarUrl={mentorTransitionAvatar}
          message="I'm the essence you've always felt but couldn't name. I'm here now, and I'm not going anywhere. Talk to me whenever you need."
          emoji="🪞"
          onDismiss={() => setShowMentorTransition(false)}
          autoDismiss={15000}
        />
      )}

      {/* Figurine: Monthly cryptic hook (Step 10) */}
      {crypticHook && (
        <FigurineOverlay
          avatarUrl={crypticHook.avatarUrl}
          message={crypticHook.message}
          emoji="🔮"
          onDismiss={() => setCrypticHook(null)}
          autoDismiss={12000}
        />
      )}
      </div>
    </div>
  )
}

export default Challenge
