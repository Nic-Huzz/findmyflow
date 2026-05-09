import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useBusinessPageData from '../hooks/useBusinessPageData'
import { useSubscription } from '../hooks/useSubscription'
import { isPaidQuest } from '../lib/subscriptionService'
import { supabase } from '../lib/supabaseClient'
import { sanitizeText } from '../lib/sanitize'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
import {
  handleConversationLogCompletion,
  handleMilestoneCompletion,
  handleFlowCompassCompletion,
  handleValidationAnalysisCompletion,
  handleGroanReflectionCompletion
} from '../lib/questCompletionHelpers'
import ChallengeProjectSelector from '../components/ChallengeProjectSelector'
import BusinessSetup from '../components/BusinessSetup'
import QuestCard from '../components/QuestCard'
import PlayProfileDashboard from '../components/PlayProfile/PlayProfileDashboard'
import './BusinessPage.css'

const STAGE_DOTS = [
  { id: 0.9, label: 'Setup' },
  { id: 1, label: 'Validate' },
  { id: 2, label: 'Product' },
  { id: 3, label: 'Test' },
  { id: 4, label: 'Offer' },
  { id: 5, label: 'Campaign' },
  { id: 6, label: 'Launch' },
  { id: 7, label: 'Growth' },
]

export default function BusinessPage() {
  const {
    loading, user, projects, selectedProject, selectProject,
    showProjectSelector, setShowProjectSelector,
    activeStageTab, setActiveStageTab,
    stageQuests, isQuestCompleted, stageCompletedCount,
    stageProgressPct, nextQuest, completedStages,
    currentStageConfig, stageProgress, refreshData
  } = useBusinessPageData()

  const { hasSubscription } = useSubscription()

  const [questInputs, setQuestInputs] = useState({})
  const [expandedLearnMore, setExpandedLearnMore] = useState({})
  const [completingQuestId, setCompletingQuestId] = useState(null)
  const [showLockedTooltip, setShowLockedTooltip] = useState(null)
  const [justCompletedQuestId, setJustCompletedQuestId] = useState(null)
  const [ppExpanded, setPpExpanded] = useState(false)
  const [ppSummary, setPpSummary] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('founder_dna_results')
      .select('matched_founder, archetype')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPpSummary(data)
      })
  }, [user?.id])

  const handleInputChange = (questId, value) => {
    setQuestInputs(prev => ({ ...prev, [questId]: value }))
  }

  const toggleLearnMore = (questId) => {
    setExpandedLearnMore(prev => ({ ...prev, [questId]: !prev[questId] }))
  }

  const renderDescription = (description) => {
    if (!description) return null
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match
    while ((match = linkRegex.exec(description)) !== null) {
      if (match.index > lastIndex) parts.push(description.slice(lastIndex, match.index))
      parts.push(<Link key={match.index} to={match[2]} className="quest-inline-link">{match[1]}</Link>)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < description.length) parts.push(description.slice(lastIndex))
    return parts.length > 0 ? parts : description
  }

  const handleQuestComplete = async (quest, specialData, event) => {
    if (completingQuestId) return
    setCompletingQuestId(quest.id)

    try {
      const inputValue = questInputs[quest.id]

      // Validate based on input type
      if (quest.inputType === 'text' && !specialData) {
        if (!inputValue?.trim()) {
          alert('Please enter your reflection before completing.')
          return
        }
      }
      if (quest.inputType === 'dropdown' && !specialData) {
        if (!inputValue?.trim()) {
          alert('Please select an option before completing.')
          return
        }
      }
      if (quest.inputType === 'text_with_tags' && !specialData) {
        const textVal = typeof inputValue === 'object' ? inputValue.text : inputValue
        if (!textVal?.trim()) {
          alert('Please enter your response.')
          return
        }
      }

      const sanitizedReflection = typeof inputValue === 'string' ? sanitizeText(inputValue) : inputValue

      // Handle special types via existing helpers
      if (quest.inputType === 'conversation_log' && specialData) {
        const result = await handleConversationLogCompletion(
          user.id, null, specialData, stageProgress, quest, selectedProject?.id
        )
        if (!result.success) {
          alert(result.error || 'Failed to save conversation log')
          return
        }
      }

      if (quest.inputType === 'milestone' && specialData) {
        const result = await handleMilestoneCompletion(
          user.id, specialData, stageProgress, stageProgress?.persona, selectedProject?.id
        )
        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed this milestone!')
            return
          }
          alert(result.error || 'Failed to save milestone')
          return
        }
      }

      if (quest.inputType === 'flow_compass' && specialData) {
        const result = await handleFlowCompassCompletion(
          user.id, null, specialData, selectedProject?.id
        )
        if (!result.success) {
          alert(result.error || 'Failed to save flow compass entry')
          return
        }
      }

      if (quest.inputType === 'validation_responses' && specialData) {
        const result = await handleValidationAnalysisCompletion(
          user.id, specialData, stageProgress, selectedProject?.id
        )
        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed validation analysis!')
            return
          }
          alert(result.error || 'Failed to save validation analysis')
          return
        }
      }

      // Handle groan reflection
      if (quest.type === 'groan' && specialData) {
        const groanResult = await handleGroanReflectionCompletion(user.id, {
          ...specialData,
          project_id: selectedProject?.id,
          challenge_instance_id: null,
          quest_category: quest.category,
          stage: quest.stage_required
        })
        if (!groanResult.success) {
          console.warn('Failed to save groan reflection:', groanResult.error)
        }

        if (quest.milestone_type) {
          const milestoneResult = await handleMilestoneCompletion(
            user.id,
            { milestone_type: quest.milestone_type, evidence_text: specialData.groan_task || 'Completed groan challenge' },
            stageProgress, stageProgress?.persona, selectedProject?.id
          )
          if (!milestoneResult.success && !milestoneResult.alreadyCompleted) {
            console.warn('Failed to save groan milestone:', milestoneResult.error)
          }
        }
      }

      // Handle checkbox quests with milestone_type
      if (quest.inputType === 'checkbox' && quest.milestone_type) {
        const result = await handleMilestoneCompletion(
          user.id,
          { milestone_type: quest.milestone_type, evidence_text: 'Completed via checkbox' },
          stageProgress, stageProgress?.persona, selectedProject?.id
        )
        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed this milestone!')
            return
          }
          alert(`Error saving milestone: ${result.error}`)
          return
        }
      }

      // Handle text quests with milestone_type
      if (quest.inputType === 'text' && quest.milestone_type) {
        const result = await handleMilestoneCompletion(
          user.id,
          { milestone_type: quest.milestone_type, evidence_text: sanitizedReflection || 'Completed via text input' },
          stageProgress, stageProgress?.persona, selectedProject?.id
        )
        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed this milestone!')
            return
          }
          alert(`Error saving milestone: ${result.error}`)
          return
        }
      }

      // Handle progress_dropdown quests with milestone_type
      if (quest.inputType === 'progress_dropdown' && quest.milestone_type && specialData) {
        const result = await handleMilestoneCompletion(
          user.id,
          { milestone_type: quest.milestone_type, evidence_text: specialData.progress || 'Completed via progress dropdown' },
          stageProgress, stageProgress?.persona, selectedProject?.id
        )
        if (!result.success) {
          if (result.alreadyCompleted) {
            alert('You have already completed this milestone!')
            return
          }
          alert(`Error saving milestone: ${result.error}`)
          return
        }
      }

      // Build completion data — BusinessPage has NO challenge instance
      const completionData = {
        user_id: user.id,
        challenge_instance_id: null,
        quest_id: quest.id,
        quest_category: quest.category,
        quest_type: quest.type,
        points_earned: quest.points,
        challenge_day: 0,
        project_id: selectedProject?.id || null,
        stage: quest.stage_required || null
      }

      // Set reflection text based on input type
      const safeStringify = (data) => typeof data === 'string' ? data : JSON.stringify(data)
      const structuredDataTypes = ['reconnect', 'recognise', 'rewire', 'release']
      const hasStructuredData = structuredDataTypes.includes(quest.type?.toLowerCase()) && specialData

      if (quest.inputType === 'text' || quest.inputType === 'dropdown' || quest.inputType === 'text_with_tags') {
        completionData.reflection_text = hasStructuredData ? safeStringify(specialData) : sanitizedReflection
      } else if (quest.inputType === 'lets_play_review') {
        completionData.reflection_text = safeStringify(specialData)
      } else if (['conversation_log', 'milestone', 'flow_compass'].includes(quest.inputType)) {
        completionData.reflection_text = safeStringify(specialData)
      } else if (quest.type === 'groan' && specialData) {
        completionData.reflection_text = specialData.groan_task || safeStringify(specialData)
      } else if (quest.inputType === 'rating' || quest.inputType === 'referral') {
        completionData.reflection_text = safeStringify(inputValue)
      } else if (hasStructuredData) {
        completionData.reflection_text = safeStringify(specialData)
      } else if (specialData) {
        // Generic fallback for grand_slam_dropdown, progress_dropdown, response_counter, etc.
        completionData.reflection_text = safeStringify(specialData)
      } else if (inputValue != null && inputValue !== '') {
        // Fallback for multi_select and other types storing data in questInputs
        completionData.reflection_text = safeStringify(inputValue)
      }

      // Duplicate check (user-level: no challenge instance)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      let duplicateQuery = supabase
        .from('quest_completions')
        .select('id')
        .eq('user_id', user.id)
        .is('challenge_instance_id', null)
        .eq('quest_id', quest.id)

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

      // Insert quest completion
      const { error: completionError } = await supabase
        .from('quest_completions')
        .insert([completionData])

      if (completionError) {
        console.error('Error completing quest:', completionError)
        alert('Error completing quest. Please try again.')
        return
      }

      // Update scores via RPC
      const scoringCategory = getScoringCategory(quest.category)
      try {
        await supabase.rpc('increment_scores', {
          p_user_id: user.id,
          p_project_id: null,
          p_category: scoringCategory,
          p_points: quest.points,
          p_week_start: getWeekStartLocal()
        })
      } catch (scoreError) {
        console.error('Error updating scores:', scoreError)
      }

      // Clear input and refresh
      setQuestInputs(prev => ({ ...prev, [quest.id]: '' }))
      setJustCompletedQuestId(quest.id)
      setTimeout(() => setJustCompletedQuestId(null), 3000)

      alert(`Quest complete! +${quest.points} RP`)

      refreshData()
    } catch (error) {
      console.error('Error in handleQuestComplete:', error)
      alert('Error completing quest. Please try again.')
    } finally {
      setCompletingQuestId(null)
    }
  }

  if (loading) {
    return (
      <div className="business-page">
        <div className="bp-loading">
          <div className="bp-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Project selector overlay
  if (showProjectSelector) {
    return (
      <div className="business-page bp-project-selector">
        <ChallengeProjectSelector
          onSelect={(project) => selectProject(project)}
          currentProjectId={selectedProject?.id}
        />
      </div>
    )
  }

  const stageName = currentStageConfig?.name || `Stage ${activeStageTab}`
  const stageDesc = currentStageConfig?.description || ''
  const ringR = 30
  const ringCircumference = 2 * Math.PI * ringR
  const ringOffset = ringCircumference * (1 - stageProgressPct / 100)

  return (
    <div className="business-page">

      {/* 1 — HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1 className="hero-title">
              {activeStageTab === 0.9 ? 'Setup' : `Stage ${activeStageTab}: ${stageName}`}
            </h1>
            <p className="hero-desc">{stageDesc}</p>
            <div className="hero-project-row">
              <div className="hero-project">
                {selectedProject?.name || 'No Project Yet'}
              </div>
              {projects.length > 0 && (
                <button
                  className="hero-switch"
                  onClick={() => setShowProjectSelector(true)}
                >
                  Switch ▾
                </button>
              )}
            </div>
          </div>
          <div className="ring-wrap">
            <svg viewBox="0 0 68 68">
              <circle className="ring-bg" cx="34" cy="34" r={ringR} />
              <circle
                className="ring-val"
                cx="34" cy="34" r={ringR}
                style={{
                  strokeDasharray: ringCircumference,
                  strokeDashoffset: ringOffset
                }}
              />
            </svg>
            <span className="ring-label">{stageProgressPct}%</span>
          </div>
        </div>
      </div>

      {/* 2 — STAGE DOTS */}
      <div className="card stage-card">
        <div className="dots">
          {STAGE_DOTS.map(dot => {
            const isDone = completedStages.includes(dot.id)
            const isCurrent = activeStageTab === dot.id
            const dotClass = isDone ? 'done' : isCurrent ? 'current' : 'locked'
            const itemClass = isDone ? 'done' : isCurrent ? 'current' : ''

            return (
              <div
                key={dot.id}
                className={`dot-item ${itemClass}`}
                onClick={() => setActiveStageTab(dot.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`dot-circle ${dotClass}`}>
                  {isDone ? '✓' : dot.id === 0.9 ? 'S' : dot.id}
                </div>
                <span className="dot-label">{dot.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3 — STAGE 0.9: BUSINESS SETUP */}
      {activeStageTab === 0.9 && (
        <div className="card">
          <BusinessSetup
            userId={user?.id}
            existingProject={selectedProject}
            stageProgress={stageProgress}
            onSetupComplete={(project) => {
              selectProject(project)
              refreshData()
            }}
          />
        </div>
      )}

      {/* 3b — PLAY PROFILE (collapsible) */}
      <div className="card bp-play-profile-card">
        <button className="bp-pp-toggle" onClick={() => setPpExpanded(v => !v)}>
          <div className="bp-pp-toggle-left">
            <span className="bp-pp-icon">🧬</span>
            <div>
              <div className="bp-pp-title">Play Profile</div>
              <div className="bp-pp-subtitle">
                {ppSummary
                  ? `${ppSummary.matched_founder} \u00B7 ${ppSummary.archetype}`
                  : 'Discover your Founder DNA'}
              </div>
            </div>
          </div>
          <span className={`bp-pp-chevron ${ppExpanded ? 'open' : ''}`}>▾</span>
        </button>
        {ppExpanded && (
          <div className="bp-pp-body">
            <PlayProfileDashboard userId={user?.id} />
          </div>
        )}
      </div>

      {/* 3c — SOL CTA (stage 2+) */}
      {activeStageTab >= 2 && (
        <a href="/sol" className="card bp-sol-cta" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>☀️</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>Meet Sol — Your AI Co-Founder</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                Sol handles your business ops via Telegram so you can focus on your craft.
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#5e17eb', fontWeight: 600, fontSize: '14px' }}>→</span>
          </div>
        </a>
      )}

      {/* 4 — UP NEXT CARD (stages 1-7 only, when there's an incomplete quest) */}
      {activeStageTab !== 0.9 && nextQuest && (
        <div className="card next-card">
          <span className="next-eyebrow">Up Next</span>
          <div className="next-name">
            {nextQuest.isExplainer ? '📝' : '🎯'} {nextQuest.name}
          </div>
          <div className="next-meta">
            {nextQuest.isExplainer ? 'Explainer' : nextQuest.type || 'Quest'}
            {' • '}
            {isPaidQuest(nextQuest) ? (hasSubscription ? 'Included' : 'Paid') : 'Free'}
          </div>
          {nextQuest.inputType === 'flow' ? (
            <a
              href={selectedProject?.id
                ? `${nextQuest.flow_route}?projectId=${selectedProject.id}&returnTo=/business`
                : `${nextQuest.flow_route}?returnTo=/business`}
              className="gold-btn"
            >
              Start Quest →
            </a>
          ) : (
            <button
              className="gold-btn"
              onClick={() => document.querySelector('.bp-quest-list')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Quest Below ↓
            </button>
          )}
        </div>
      )}

      {/* 5 — QUEST LIST (stages 1-7) */}
      {activeStageTab !== 0.9 && stageQuests.length > 0 && (
        <div className="card bp-quest-list">
          <div className="quest-title">
            Stage {activeStageTab} Quests
          </div>
          {stageQuests.map(quest => {
            const completed = isQuestCompleted(quest.id)
            const isFlow = quest.inputType === 'flow'
            const paidQuest = isPaidQuest(quest)
            const paidLocked = paidQuest && !hasSubscription
            const isExpanded = expandedLearnMore[quest.id]

            return (
              <div key={quest.id} className={`q-row-wrap ${completed ? 'done' : ''}`}>
                <div className="q-row">
                  <div className={`q-icon ${completed ? 'done' : 'todo'}`}>
                    {completed ? '✅' : quest.isExplainer ? '📝' : '🎯'}
                  </div>
                  <div
                    className="q-info"
                    onClick={() => !isFlow && !completed && toggleLearnMore(quest.id)}
                    style={{ cursor: (!isFlow && !completed) ? 'pointer' : 'default' }}
                  >
                    <div className="q-name">{quest.name}</div>
                    <div className="q-sub">
                      {!isFlow && !completed ? (
                        <span className="q-learn-more">Learn more ↓</span>
                      ) : (
                        <>
                          {quest.isExplainer ? 'Explainer' : quest.type || 'Quest'}
                          {' \u00B7 '}
                          {paidLocked ? 'Paid' : paidQuest ? 'Included' : 'Free'}
                        </>
                      )}
                    </div>
                  </div>
                  {completed ? (
                    <span className="q-btn done-btn">Done</span>
                  ) : isFlow ? (
                    <a
                      href={selectedProject?.id
                        ? `${quest.flow_route}?projectId=${selectedProject.id}&returnTo=/business`
                        : `${quest.flow_route}?returnTo=/business`}
                      className="q-btn start-btn"
                    >
                      Start
                    </a>
                  ) : (
                    <button
                      className="q-btn start-btn"
                      onClick={() => toggleLearnMore(quest.id)}
                    >
                      {isExpanded ? 'Close' : 'Start'}
                    </button>
                  )}
                </div>

                {isExpanded && !completed && !isFlow && (
                  <div className="q-expanded">
                    <QuestCard
                      quest={quest}
                      completed={false}
                      isCompleting={completingQuestId === quest.id}
                      questInput={questInputs[quest.id]}
                      onInputChange={handleInputChange}
                      onComplete={handleQuestComplete}
                      expandedLearnMore={{ [quest.id]: true }}
                      onToggleLearnMore={() => {}}
                      showLockedTooltip={showLockedTooltip}
                      onToggleLockedTooltip={(id) => setShowLockedTooltip(prev => prev === id ? null : id)}
                      renderDescription={renderDescription}
                      selectedProject={selectedProject}
                      progress={null}
                      projectStage={activeStageTab}
                      userId={user?.id}
                      paidLocked={paidLocked}
                      justCompleted={justCompletedQuestId === quest.id}
                      returnTo="/business"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state — stage has no quests */}
      {activeStageTab !== 0.9 && stageQuests.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '14px', color: '#9a9daa' }}>
            No quests for this stage yet.
          </p>
        </div>
      )}

    </div>
  )
}
