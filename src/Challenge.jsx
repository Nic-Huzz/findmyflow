import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { sanitizeText } from './lib/sanitize'
import { trackGroanCompleted } from './lib/analytics'
import confetti from 'canvas-confetti'
import NotificationPrompt from './components/NotificationPrompt'
import PortalExplainer from './components/PortalExplainer'
import ChallengeProjectSelector from './components/ChallengeProjectSelector'
import ChallengeStageTabs from './components/ChallengeStageTabs'
import ChallengeHeader from './components/ChallengeHeader'
import ChallengeOnboarding from './components/ChallengeOnboarding'
import ChallengeLeaderboard from './components/ChallengeLeaderboard'
import ChallengeFilters from './components/ChallengeFilters'
import QuestCard from './components/QuestCard'
import FlowMapRiver from './components/FlowMapRiver'
import GroansSummary from './components/GroansSummary'
import HealingSummary from './components/HealingSummary'
import WeeklyPlanningFlow from './components/WeeklyPlanningFlow'
import GroanMatrix from './components/GroanMatrix'
import { createGroanChallenge, createSkillProblemChallenge, acceptGroanChallenge, completeGroanChallenge } from './lib/crm'
import { useChallengeData } from './hooks/useChallengeData'
import { normalizePersona } from './data/personaProfiles'
import { convertLegacyStage } from './lib/stageConfig'
import { generateVoiceQuestsForStage } from './lib/voiceQuestConfig'
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
    userRank,
    currentWeeklyPoints,
    nervousSystemComplete,
    safetyContracts,
    healingCompassComplete,
    pastParallelStory,
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
    userArchetypes,
    weeklyPlan,
    showWeeklyPlanning,
    setShowWeeklyPlanning,
    isSunday,
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

  // State for tracking recently completed quest for animation
  const [justCompletedQuestId, setJustCompletedQuestId] = useState(null)

  // Search state for filtering quests
  const [searchQuery, setSearchQuery] = useState('')

  // State for showing hidden (non-planned) reconnect quests
  const [showHiddenReconnect, setShowHiddenReconnect] = useState(false)

  // State for selected groan challenge modal
  const [selectedGroanChallenge, setSelectedGroanChallenge] = useState(null)
  const [groanChallengeLoading, setGroanChallengeLoading] = useState(false)
  const [groanReflectionStep, setGroanReflectionStep] = useState(false)
  const [groanReflection, setGroanReflection] = useState({ scaryScore: 5, wahooScore: 5, reflection: '' })
  const [groanMatrixKey, setGroanMatrixKey] = useState(0) // Used to force matrix refresh

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

    try {
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
      } else if (quest.inputType === 'conversation_log' || quest.inputType === 'milestone' || quest.inputType === 'flow_compass') {
        completionData.reflection_text = safeStringify(specialData)
      } else if (quest.type === 'groan' && specialData) {
        completionData.reflection_text = specialData.groan_task || safeStringify(specialData)
      } else if (hasStructuredData) {
        // Fallback for any other quests with specialized input components
        completionData.reflection_text = safeStringify(specialData)
      }

      // Check for duplicate completions
      const todayDate = new Date().toISOString().split('T')[0]
      let duplicateQuery = supabase
        .from('quest_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_instance_id', progress.challenge_instance_id)
        .eq('quest_id', quest.id)

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

      await handleStreakUpdate(user.id, progress.challenge_instance_id)

      // Calculate new points
      const rType = quest.type?.toLowerCase()
      const frequencyKey = quest.frequency === 'weekly' ? 'weekly' : 'daily'
      const rTypesWithColumns = ['recognise', 'release', 'rewire', 'reconnect']
      const hasPointsColumn = rTypesWithColumns.includes(rType)

      const newTotalPoints = (progress.total_points || 0) + quest.points

      const updateData = {
        total_points: newTotalPoints,
        last_active_date: new Date().toISOString()
      }

      if (hasPointsColumn) {
        const pointsField = `${rType}_${frequencyKey}_points`
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

      // Reload completions
      const { data: newCompletions } = await supabase
        .from('quest_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_instance_id', progress.challenge_instance_id)

      setCompletions(newCompletions || [])
      setQuestInputs(prev => ({ ...prev, [quest.id]: '' }))

      // Check for artifact unlock
      const categoryArtifact = challengeData?.artifacts?.find(a => a.category === quest.category)
      const artifactUnlocked = categoryArtifact && checkArtifactUnlock(quest.category, newTotalPoints, frequencyKey)

      let successMessage = `Quest complete! +${quest.points} points`

      if (quest.counts_toward_graduation) {
        successMessage += '\nProgress toward graduation!'
      }

      if (artifactUnlocked && categoryArtifact) {
        successMessage = `Quest complete! +${quest.points} points\n\nYou unlocked the ${categoryArtifact.name}!`
      }

      triggerConfetti(event)

      // Set just completed for animation, clear after 3 seconds
      setJustCompletedQuestId(quest.id)
      setTimeout(() => setJustCompletedQuestId(null), 3000)

      alert(successMessage)

      // Check for tab completion bonus
      setTimeout(async () => {
        const tabStatus = getTabCompletionStatus(quest.category)
        if (tabStatus.isComplete && !tabStatus.bonusAwarded && tabStatus.bonusPoints > 0) {
          await awardTabCompletionBonus(quest.category, tabStatus.bonusPoints)
        }
      }, 500)

      // Check for project graduation
      if (selectedProject?.id && progress?.challenge_instance_id) {
        try {
          const graduationResult = await checkAndGraduateProject(
            user.id,
            selectedProject.id,
            progress.challenge_instance_id
          )

          if (graduationResult.graduated) {
            const celebration = graduationResult.celebration_message
            setTimeout(() => {
              alert(`${celebration.title}\n\n${celebration.message}\n\n${celebration.next_step}`)
              triggerConfetti()
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

      console.log('Edge function response:', { data, error })

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

  // Handler for matrix cell clicks
  const handleMatrixCellClick = (cellData) => {
    if (cellData.challenge) {
      setSelectedGroanChallenge(cellData.challenge)
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

  // Handle regenerating a challenge (delete and create new)
  const handleRegenerateChallenge = async () => {
    if (!selectedGroanChallenge) return
    setGroanChallengeLoading(true)

    // Store the challenge info before deleting
    const challenge = selectedGroanChallenge
    const isSkillProblem = challenge.skill_cluster_id && challenge.problem_cluster_id

    try {
      // Delete the current challenge
      await supabase
        .from('groan_challenges')
        .delete()
        .eq('id', challenge.id)

      // Close modal temporarily
      setSelectedGroanChallenge(null)

      // Generate a new challenge with the same parameters
      if (isSkillProblem) {
        await handleGenerateChallenge({
          sourceType: 'skill_x_problem',
          skillId: challenge.skill_cluster_id,
          skillLabel: challenge.source_label?.split(' × ')[0] || 'Skill',
          problemId: challenge.problem_cluster_id,
          problemLabel: challenge.source_label?.split(' × ')[1]?.split(' (for ')[0] || 'Problem',
          personaId: challenge.persona_cluster_id || null,
          personaLabel: null
        })
      } else {
        await handleGenerateChallenge({
          sourceType: challenge.source_type,
          sourceId: challenge.source_id,
          sourceLabel: challenge.source_label,
          visibilityLayer: challenge.visibility_layer
        })
      }

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
    setGroanReflectionStep(false)
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

  // Filter quests by the active category tab (exclude archived quests)
  // Special case: When viewing Groans stage in Business, pull from 'Groans' category
  let filteredQuests = challengeData?.quests?.filter(q => {
    if (q.archived) return false
    if (isGroansStage) {
      return q.category === 'Groans'
    }
    return q.category === activeCategory
  }) || []

  // Filter by persona and stage for Business quests
  if (activeCategory === 'Business') {
    const userPersonaNormalized = normalizePersona(userData?.persona)

    // Handle sub-tabs: Tasks vs Voices
    // Note: Groans stage only has Tasks, no Voices sub-tab
    if (businessSubTab === 'voices' && !isGroansStage) {
      // Generate voice quests for the current stage
      filteredQuests = generateVoiceQuestsForStage(viewingStage, userArchetypes)
    } else {
      // Tasks sub-tab: filter regular business quests
      // For Groans stage, show all non-archived Groans quests
      if (!isGroansStage) {
        filteredQuests = filteredQuests.filter(quest => {
          // Exclude stage groan quests - they now appear in Voices sub-tab
          if (quest.type === 'groan' || quest.id?.startsWith('groan_stage')) {
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
  // Render: Onboarding
  // ============================================

  if (showOnboarding) {
    return (
      <ChallengeOnboarding
        screen="welcome"
        onStartChallenge={showGroupSelectionModal}
      />
    )
  }

  // ============================================
  // Render: Group Selection
  // ============================================

  if (showGroupSelection) {
    return (
      <ChallengeOnboarding
        screen="group-selection"
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
        </div>
      </div>
    )
  }

  const categoryPoints = getCategoryPoints(activeCategory)
  const artifactProgress = getArtifactProgress(activeCategory)

  // ============================================
  // Render: Main Challenge View
  // ============================================

  return (
    <div className="challenge-container">
      {showExplainer && <PortalExplainer onClose={handleCloseExplainer} />}
      <NotificationPrompt />
      <ChallengeHeader
        progress={progress}
        userRank={userRank}
        userData={userData}
        navigate={navigate}
        settingsMenuRef={settingsMenuRef}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        handleOpenExplainer={handleOpenExplainer}
        onLeaderboardClick={() => setActiveCategory('Leaderboard')}
        streakDays={getConsecutiveStreakDays()}
        weekLabel={getWeekLabel()}
        weekType={weeklyPlan?.week_type}
        weeklyPlan={weeklyPlan}
        onEditPlan={weeklyPlan ? () => setShowWeeklyPlanning(true) : null}
        weeklyPoints={currentWeeklyPoints}
      />

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
                currentStage={selectedProject.current_stage || 1}
                completedStages={getCompletedStages()}
                activeTab={activeStageTab}
                onTabChange={setActiveStageTab}
                flowFinderComplete={flowFinderComplete}
              />
              {/* Sub-tabs: Tasks | Voices - hidden for Groans stage */}
              {activeStageTab !== 0.5 && (
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
                    Voices
                  </button>
                </div>
              )}
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


      <div className="challenge-content">
        {/* Leaderboard */}
        {activeCategory === 'Leaderboard' && (
          <ChallengeLeaderboard
            leaderboard={leaderboard}
            leaderboardView={leaderboardView}
            setLeaderboardView={setLeaderboardView}
            groupCode={groupCode}
          />
        )}

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

        {/* Quest Content - only show if not on Leaderboard or Summary tabs */}
        {activeCategory !== 'Leaderboard' && activeCategory !== 'GroansSummary' && activeCategory !== 'HealingSummary' && (
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
                {(activeCategory === 'Groans' || activeCategory === 'Healing') && artifactProgress.frequencyCategories ? (
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
                    return <p className="tab-bonus-text earned">+{tabStatus.bonusPoints} pts bonus earned!</p>
                  }
                  return <p className="tab-bonus-text">Complete To Receive {BONUS_PERCENTAGE}% Point Boost</p>
                })()}
              </div>
            )}

            {artifactProgress.unlocked && (
              <div className="artifact-unlocked-message">
                Artifact Unlocked! You've completed this category.
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
          <button
            className="category-point-item summary-card-btn"
            onClick={() => {
              if (activeCategory === 'Groans') setActiveCategory('GroansSummary')
              if (activeCategory === 'Healing') setActiveCategory('HealingSummary')
            }}
            disabled={activeCategory !== 'Groans' && activeCategory !== 'Healing'}
          >
            <span className="summary-button-label">Summary</span>
            <span className="summary-button-value">📊</span>
          </button>
          <button
            className="category-point-item leaderboard-button"
            onClick={() => setActiveCategory('Leaderboard')}
          >
            <span className="leaderboard-button-label">Leaderboard</span>
            <span className="leaderboard-button-value">🏆</span>
          </button>
        </div>

        {/* Groans Tab - Courage Matrix */}
        {activeCategory === 'Groans' && (
          <div className="quest-section">
            <GroanMatrix
              key={groanMatrixKey}
              userId={user?.id}
              onCellClick={handleMatrixCellClick}
              onGenerateChallenge={handleGenerateChallenge}
            />
          </div>
        )}

        {/* Healing Quests */}
        {activeCategory === 'Healing' && displayQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Healing</h2>
            <ChallengeFilters
              activeCategory={activeCategory}
              activeFrequencyFilter={activeFrequencyFilter}
              setActiveFrequencyFilter={setActiveFrequencyFilter}
              activeRTypeFilter={activeRTypeFilter}
              setActiveRTypeFilter={setActiveRTypeFilter}
            />
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
            {['Recognise', 'Release'].filter(rType =>
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
                      const isHealingCompass = quest.id === 'recognise_healing_compass'
                      const isReleaseDailyChallenge = quest.id === 'release_daily_challenge'

                      // Determine lock state and message
                      const isLocked = (isHealingCompass || isReleaseDailyChallenge) && !nervousSystemComplete
                      const lockMessage = isReleaseDailyChallenge
                        ? 'Complete the "Nervous System Calibration" to unlock daily release challenges'
                        : 'Complete the "Map the Boundaries of Your Nervous System" challenge above to unlock'

                      return (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          completed={completed}
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
            />
          </div>
        )}

        {/* Business Quests - Regular stages */}
        {activeCategory === 'Business' && !isGroansStage && filteredQuests.length > 0 && (
          <div className="quest-section">
            <div className="quest-grid">
              {filteredQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)
                const locked = isQuestLocked(quest)

                return (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    completed={completed}
                    locked={locked}
                    lockedPrerequisite={locked ? getRequiredQuestName(quest.requires_quest) : null}
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

        {/* Bonus Quests */}
        {activeCategory === 'Bonus' && filteredQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Bonus Quests</h2>
            <div className="quest-grid">
              {filteredQuests.map(quest => {
                const completed = isQuestCompletedToday(quest.id, quest)

                return (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    completed={completed}
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

                  return (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      completed={completed}
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

            {/* Flow Map River */}
            {selectedProject && (
              <div className="flow-map-section">
                <h2 className="section-title">Your Flow Journey</h2>
                <FlowMapRiver
                  projectId={selectedProject.id}
                  limit={10}
                />
              </div>
            )}
          </div>
        )}
      </>
      )}

      {/* Groan Challenge Detail Modal */}
      {selectedGroanChallenge && (
        <div className="groan-modal-overlay" onClick={closeGroanModal}>
          <div className="groan-modal" onClick={e => e.stopPropagation()}>
            <button className="groan-modal-close" onClick={closeGroanModal}>×</button>

            {!groanReflectionStep ? (
              <>
                {/* Challenge Overview */}
                <div className="groan-modal-header">
                  {selectedGroanChallenge.visibility_layer && (
                    <span className="groan-modal-layer">{selectedGroanChallenge.visibility_layer.toUpperCase()}</span>
                  )}
                  {selectedGroanChallenge.skill_cluster_id && (
                    <span className="groan-modal-layer groan-modal-layer-sp">SKILL × PROBLEM</span>
                  )}
                  <h2>{selectedGroanChallenge.title}</h2>
                </div>

                <p className="groan-modal-description">{selectedGroanChallenge.description}</p>

                {selectedGroanChallenge.source_label && (
                  <div className="groan-modal-source">
                    <span className="source-icon">🎯</span>
                    <span className="source-text">{selectedGroanChallenge.source_label}</span>
                  </div>
                )}

                <div className="groan-modal-actions">
                  {/* Not yet accepted - show Accept + Regenerate */}
                  {!selectedGroanChallenge.accepted_at && selectedGroanChallenge.status !== 'completed' && (
                    <>
                      <button
                        className="groan-btn groan-btn-accept"
                        onClick={handleAcceptGroanChallenge}
                        disabled={groanChallengeLoading}
                      >
                        {groanChallengeLoading ? 'Accepting...' : '💪 Accept Challenge'}
                      </button>
                      <button
                        className="groan-btn groan-btn-regenerate"
                        onClick={handleRegenerateChallenge}
                        disabled={groanChallengeLoading}
                      >
                        {groanChallengeLoading ? '...' : '🔄 Regenerate'}
                      </button>
                    </>
                  )}

                  {/* Accepted - show Complete */}
                  {selectedGroanChallenge.accepted_at && selectedGroanChallenge.status !== 'completed' && (
                    <button
                      className="groan-btn groan-btn-complete"
                      onClick={handleStartCompletion}
                      disabled={groanChallengeLoading}
                    >
                      ✅ I Did It!
                    </button>
                  )}

                  {/* Completed */}
                  {selectedGroanChallenge.status === 'completed' && (
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
      </div>
    </div>
  )
}

export default Challenge
