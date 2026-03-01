/**
 * PlayListTab.jsx
 *
 * First-class tab for the 7-Day Challenge page with sub-tabs:
 *   Flow Finder — quest cards (skills, problems, persona, integration)
 *   Play-list  — Skills-only Groan Matrix
 *
 * Created: 2026-02-26
 * Part of Play-list tab restructure
 */

import { useMemo, useState } from 'react'
import QuestCard from './QuestCard'
import GroanMatrix from './GroanMatrix'
import PlayProfileDashboard from './PlayProfile/PlayProfileDashboard'

// Flow Finder quest groupings for the sub-tab
const FLOW_FINDER_GROUPS = [
  { label: 'Quick Capture', icon: '⚡', ids: ['mind_space_extraction'], noFilter: true },
  { label: 'Skills', icon: '🎯', ids: ['play_list_finder', 'flow_finder_skills'] },
  { label: 'Problems', icon: '🔍', ids: ['flow_finder_problems'] },
  { label: 'Personas', icon: '👥', ids: ['persona_identifier', 'flow_finder_persona'] },
]

// Quests rendered as header buttons instead of quest cards
const EXPLAINER_IDS = new Set(['flow_finder_explainer'])

export default function PlayListTab({
  userId,
  activeSubTab = 'flow-finder',
  flowFinderQuests,
  flowFinderComplete,
  completions,
  onQuestComplete,
  onMatrixCellClick,
  onGenerateChallenge,
  groanMatrixKey,
  layerLockStatus,
  userArchetypes,
  // QuestCard props
  questInputs,
  onInputChange,
  completingQuestId,
  expandedLearnMore,
  onToggleLearnMore,
  showLockedTooltip,
  onToggleLockedTooltip,
  renderDescription,
  navigate,
  selectedProject,
  progress,
  projectStage,
  justCompletedQuestId,
  isQuestCompletedToday,
  isQuestLocked,
  getRequiredQuestName,
  getDailyStreak,
  getDayLabels,
  isQuestPlanned,
  getPlannedDay,
}) {
  const [flowFinderFilter, setFlowFinderFilter] = useState('all')

  // Compute Flow Finder progress from completed quests
  const flowFinderProgress = useMemo(() => {
    if (!flowFinderQuests || flowFinderQuests.length === 0) return null
    const allIds = new Set(flowFinderQuests.map(q => q.id))
    const totalPoints = flowFinderQuests.reduce((sum, q) => sum + (q.points || 0), 0)
    const completedPoints = flowFinderQuests.reduce((sum, q) => {
      // Check if quest is completed (any completion, not just today)
      const isCompleted = completions?.some(c => c.quest_id === q.id)
      return sum + (isCompleted ? (q.points || 0) : 0)
    }, 0)
    return { currentPoints: completedPoints, totalPoints }
  }, [flowFinderQuests, completions])

  const renderQuestCard = (quest) => {
    const completed = isQuestCompletedToday(quest.id, quest)
    const locked = isQuestLocked ? isQuestLocked(quest) : false

    return (
      <QuestCard
        key={quest.id}
        quest={quest}
        completed={completed}
        isCompleting={completingQuestId === quest.id}
        locked={locked}
        lockedPrerequisite={locked && getRequiredQuestName ? getRequiredQuestName(quest.requires_quest, quest.id) : null}
        showStreak={quest.frequency === 'daily'}
        streak={getDailyStreak(quest.id)}
        dayLabels={getDayLabels()}
        questInput={questInputs[quest.id]}
        onInputChange={onInputChange}
        onComplete={onQuestComplete}
        expandedLearnMore={expandedLearnMore}
        onToggleLearnMore={onToggleLearnMore}
        showLockedTooltip={showLockedTooltip}
        onToggleLockedTooltip={(id) => onToggleLockedTooltip(showLockedTooltip === id ? null : id)}
        renderDescription={renderDescription}
        completedBadgeText={quest.frequency === 'daily' ? 'Completed Today' : 'Completed'}
        navigate={navigate}
        selectedProject={selectedProject}
        progress={progress}
        projectStage={projectStage}
        justCompleted={justCompletedQuestId === quest.id}
        isPlanned={isQuestPlanned ? isQuestPlanned(quest.id) : false}
        plannedDay={getPlannedDay ? getPlannedDay(quest.id) : null}
        userId={userId}
        userArchetypes={userArchetypes}
      />
    )
  }

  return (
    <div className="playlist-tab">
      {/* ── Flow Finder sub-tab ── */}
      {/* Matches Healing layout: artifact card → heading + explainer → filter chips → subsection groups */}
      {activeSubTab === 'flow-finder' && flowFinderQuests && flowFinderQuests.length > 0 && (() => {
        const groupedIds = new Set(FLOW_FINDER_GROUPS.flatMap(g => g.ids))
        const ungrouped = flowFinderQuests.filter(q => !groupedIds.has(q.id) && !EXPLAINER_IDS.has(q.id))

        let visibleGroups = FLOW_FINDER_GROUPS
        let showUngrouped = true
        if (flowFinderFilter !== 'all') {
          visibleGroups = FLOW_FINDER_GROUPS.filter(g => g.label === flowFinderFilter || g.noFilter)
          showUngrouped = false
        }

        return (
          <>
            {/* 1. Artifact progress card (same position as Healing's) */}
            {flowFinderProgress && (
              <div className={`artifact-progress ${flowFinderProgress.currentPoints >= flowFinderProgress.totalPoints ? 'unlocked' : ''}`}>
                <div className="artifact-header">
                  <h3>🧭 Flow Finder</h3>
                  <p className="artifact-description">Discover your skills, problems, and personas to unlock your unique flow.</p>
                </div>
                {flowFinderProgress.currentPoints < flowFinderProgress.totalPoints ? (
                  <div className="artifact-bars">
                    <div className="progress-bar-container">
                      <div className="progress-bar-label">
                        <span>🧭 Progress</span>
                        <span>{flowFinderProgress.currentPoints}/{flowFinderProgress.totalPoints}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill daily"
                          style={{ width: `${Math.min((flowFinderProgress.currentPoints / flowFinderProgress.totalPoints) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="artifact-unlocked-message">
                    Flow Formula Unlocked! You've mapped your unique flow.
                  </div>
                )}
              </div>
            )}

            {/* 2. Section heading with Explainer (matches "Healing" h2) */}
            <div className="quest-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 className="section-title" style={{ margin: 0 }}>Flow Finder</h2>
                <a
                  href="/flow-finder-explainer"
                  className="groan-matrix-explainer-btn"
                  style={{ background: 'linear-gradient(135deg, #5e17eb 0%, #7c3aed 100%)' }}
                >
                  Explainer
                </a>
              </div>

              {/* 3. Filter chips (matches Healing's rtype-filters position) */}
              <div className="rtype-filters">
                <button
                  className={`filter-chip ${flowFinderFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setFlowFinderFilter('all')}
                >
                  All
                </button>
                {FLOW_FINDER_GROUPS.filter(g => !g.noFilter).map(group => (
                  <button
                    key={group.label}
                    className={`filter-chip ${flowFinderFilter === group.label ? 'active' : ''}`}
                    onClick={() => setFlowFinderFilter(flowFinderFilter === group.label ? 'all' : group.label)}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              {/* 4. Quest subsections (matches Healing's subsection-title style) */}
              {visibleGroups.map(group => {
                const quests = group.ids
                  .map(id => flowFinderQuests.find(q => q.id === id))
                  .filter(Boolean)
                if (quests.length === 0) return null
                return (
                  <div key={group.label} className="quest-subsection">
                    <h3 className="subsection-title">{group.label}</h3>
                    <div className="quest-grid stagger-children-fast">
                      {quests.map(quest => renderQuestCard(quest))}
                    </div>
                  </div>
                )
              })}
              {showUngrouped && ungrouped.length > 0 && (
                <div className="quest-subsection">
                  <h3 className="subsection-title">More</h3>
                  <div className="quest-grid stagger-children-fast">
                    {ungrouped.map(quest => renderQuestCard(quest))}
                  </div>
                </div>
              )}
            </div>
          </>
        )
      })()}

      {/* ── Play-list sub-tab: Courage Matrix ── */}
      {activeSubTab === 'playlist' && (
        <div className="quest-section">
          <GroanMatrix
            key={groanMatrixKey}
            userId={userId}
            onCellClick={onMatrixCellClick}
            onGenerateChallenge={onGenerateChallenge}
            layerLockStatus={layerLockStatus}
            flowFinderComplete={flowFinderComplete}
            sourceTypes={['skill']}
          />
        </div>
      )}

      {/* ── Play Profile sub-tab ── */}
      {activeSubTab === 'play-profile' && (
        <PlayProfileDashboard userId={userId} />
      )}
    </div>
  )
}
