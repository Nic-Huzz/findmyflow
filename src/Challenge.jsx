import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { sanitizeText } from './lib/sanitize'
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
import { useChallengeData } from './hooks/useChallengeData'
import { normalizePersona } from './data/personaProfiles'
import { convertLegacyStage } from './lib/stageConfig'
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
    nervousSystemComplete,
    healingCompassComplete,
    pastParallelStory,
    selectedProject,
    setSelectedProject,
    activeStageTab,
    setActiveStageTab,
    projectStage,
    setProjectStage,
    categories,
    BONUS_PERCENTAGE,
    loadStageProgress,
    showGroupSelectionModal,
    handlePlaySolo,
    handleCreateGroup,
    handleJoinGroup,
    handleProjectSelected,
    handleRestartChallenge,
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
    handleConversationLogCompletion,
    handleMilestoneCompletion,
    handleFlowCompassCompletion,
    handleGroanReflectionCompletion,
    handleStreakUpdate,
    checkAndGraduateProject
  } = useChallengeData()

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

      if (quest.inputType === 'text' || quest.inputType === 'dropdown') {
        completionData.reflection_text = sanitizedReflection
      } else if (quest.inputType === 'conversation_log' || quest.inputType === 'milestone' || quest.inputType === 'flow_compass') {
        completionData.reflection_text = JSON.stringify(specialData)
      } else if (quest.type === 'groan' && specialData) {
        completionData.reflection_text = specialData.groan_task || JSON.stringify(specialData)
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

      // Update project points if a project is selected
      if (selectedProject?.id) {
        const { error: projectError } = await supabase
          .from('user_projects')
          .update({
            total_points: (selectedProject.total_points || 0) + quest.points
          })
          .eq('id', selectedProject.id)

        if (projectError) {
          console.error('Error updating project points:', projectError)
        } else {
          setSelectedProject(prev => ({
            ...prev,
            total_points: (prev?.total_points || 0) + quest.points
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

  // Filter quests by the active category tab
  let filteredQuests = challengeData?.quests?.filter(q => q.category === activeCategory) || []

  // Filter by persona and stage for Flow Finder quests
  if (activeCategory === 'Flow Finder') {
    const userPersonaNormalized = normalizePersona(userData?.persona)

    filteredQuests = filteredQuests.filter(quest => {
      if (quest.persona_specific && userPersonaNormalized) {
        const normalizedQuestPersonas = quest.persona_specific.map(p => normalizePersona(p))
        if (!normalizedQuestPersonas.includes(userPersonaNormalized)) {
          return false
        }
      }

      if (quest.stage_required) {
        const viewingStage = activeStageTab || selectedProject?.current_stage ||
          (typeof stageProgress?.current_stage === 'number'
            ? stageProgress.current_stage
            : convertLegacyStage(stageProgress?.current_stage))

        if (quest.stage_required !== viewingStage) {
          return false
        }
      }

      return true
    })
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
        <div className="challenge-loading">Loading your challenge...</div>
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
        handleRestartChallenge={handleRestartChallenge}
        onLeaderboardClick={() => setActiveCategory('Leaderboard')}
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

      {/* Stage tabs for Flow Finder when project is selected */}
      {activeCategory === 'Flow Finder' && selectedProject && (
        <div className="stage-tabs-wrapper">
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
          />
        </div>
      )}

      {/* Filter chips for Groans and Healing tabs */}
      {(activeCategory === 'Groans' || activeCategory === 'Healing') && (
        <ChallengeFilters
          activeCategory={activeCategory}
          activeFrequencyFilter={activeFrequencyFilter}
          setActiveFrequencyFilter={setActiveFrequencyFilter}
          activeRTypeFilter={activeRTypeFilter}
          setActiveRTypeFilter={setActiveRTypeFilter}
        />
      )}

      <div className="challenge-content">
        {/* Leaderboard */}
        {activeCategory === 'Leaderboard' && (
          <ChallengeLeaderboard
            leaderboard={leaderboard}
            leaderboardView={leaderboardView}
            setLeaderboardView={setLeaderboardView}
            groupCode={groupCode}
            currentDay={progress.current_day}
          />
        )}

        {/* Quest Content - only show if not on Leaderboard tab */}
        {activeCategory !== 'Leaderboard' && (
          <>
        {/* Artifact Progress */}
        {artifactProgress && (
          <div className={`artifact-progress ${artifactProgress.unlocked ? 'unlocked' : ''}`}>
            <div className="artifact-header">
              <h3>{artifactProgress.unlocked ? 'Complete' : 'Locked'} {artifactProgress.name}</h3>
              <p className="artifact-description">{artifactProgress.description}</p>
            </div>

            {!artifactProgress.unlocked && (
              <div className="artifact-bars">
                {(activeCategory === 'Groans' || activeCategory === 'Healing') && artifactProgress.rCategories ? (
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
        {activeCategory === 'Groans' && displayQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Groans</h2>
            {['Recognise', 'Rewire', 'Reconnect', 'challenge'].filter(rType =>
              activeRTypeFilter === 'All' || activeRTypeFilter === rType
            ).map(rType => {
              const rTypeQuests = displayQuests.filter(q => q.type === rType)
              if (rTypeQuests.length === 0) return null

              return (
                <div key={rType} className="quest-subsection">
                  <h3 className="subsection-title">{rType}</h3>
                  <div className="quest-grid">
                    {rTypeQuests.map(quest => {
                      const completed = isQuestCompletedToday(quest.id, quest)
                      const isDayZeroLocked = progress.current_day === 0
                      const isReleaseDailyChallenge = quest.id === 'release_daily_challenge'

                      return (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          completed={completed}
                          isDayZeroLocked={isDayZeroLocked}
                          showStreak={true}
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
                          dailyReleaseContent={isReleaseDailyChallenge && getDailyReleaseChallenge() ? renderDailyReleaseChallenge() : null}
                          completedBadgeText="Completed Today"
                          navigate={navigate}
                          specialLockCheck={isReleaseDailyChallenge && !healingCompassComplete}
                          specialLockMessage="Complete Healing Compass to Unlock"
                          lockedMessage={'Complete the "Healing Compass" weekly quest to unlock daily release challenges'}
                          selectedProject={selectedProject}
                          progress={progress}
                          projectStage={projectStage}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Healing Quests */}
        {activeCategory === 'Healing' && displayQuests.length > 0 && (
          <div className="quest-section">
            <h2 className="section-title">Healing</h2>
            {['Recognise', 'Release'].filter(rType =>
              activeRTypeFilter === 'All' || activeRTypeFilter === rType
            ).map(rType => {
              const rTypeQuests = displayQuests.filter(q => q.type === rType)
              if (rTypeQuests.length === 0) return null

              return (
                <div key={rType} className="quest-subsection">
                  <h3 className="subsection-title">{rType}</h3>
                  <div className="quest-grid">
                    {rTypeQuests.map(quest => {
                      const completed = isQuestCompletedToday(quest.id, quest)
                      const isHealingCompass = quest.id === 'recognise_healing_compass'

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
                          specialLockCheck={isHealingCompass && !nervousSystemComplete}
                          specialLockMessage="Locked"
                          lockedMessage={'Complete the "Map the Boundaries of Your Nervous System" challenge above to unlock'}
                          selectedProject={selectedProject}
                          progress={progress}
                          projectStage={projectStage}
                        />
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
                    />
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
