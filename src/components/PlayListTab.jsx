/**
 * PlayListTab.jsx
 *
 * New first-class tab for the 7-Day Challenge page.
 * Three sections (no sub-tabs):
 *   1. Flow Finder quest cards (skills, problems, persona, integration)
 *   2. Skills-only Groan Matrix (courage challenges)
 *   3. Voice Logging (essence + protective voice)
 *
 * Created: 2026-02-26
 * Part of Play-list tab restructure
 */

import { useMemo } from 'react'
import QuestCard from './QuestCard'
import GroanMatrix from './GroanMatrix'

// Generic voice quests for Play-list (not stage-specific)
function getPlaylistVoiceQuests(userArchetypes) {
  const essenceName = userArchetypes?.essence || 'Essence'
  const protectiveName = userArchetypes?.protective || 'Protective Voice'

  return [
    {
      id: 'playlist_essence_voice',
      name: `${essenceName} Voice`,
      description: `How did your ${essenceName} show up today? Reflect on moments where your true self emerged.`,
      category: 'Voices',
      type: 'recognise',
      subType: 'essence',
      frequency: 'daily',
      points: 3,
      inputType: 'recognise_quest',
      icon: '✨',
      voiceType: 'essence',
      archetypeName: essenceName,
      stageAction: 'show up in your courage work'
    },
    {
      id: 'playlist_protective_voice',
      name: `${protectiveName} Voice`,
      description: `How did your ${protectiveName} try to hold you back today? Notice the patterns without judgement.`,
      category: 'Voices',
      type: 'recognise',
      subType: 'protective',
      frequency: 'daily',
      points: 3,
      inputType: 'recognise_quest',
      icon: '🛡️',
      voiceType: 'protective',
      archetypeName: protectiveName,
      stageBlock: 'hold you back from your courage work'
    }
  ]
}

export default function PlayListTab({
  userId,
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
  const voiceQuests = useMemo(
    () => getPlaylistVoiceQuests(userArchetypes),
    [userArchetypes?.essence, userArchetypes?.protective]
  )

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
      />
    )
  }

  return (
    <div className="playlist-tab">
      {/* Section 1: Flow Finder Quest Cards */}
      {flowFinderQuests && flowFinderQuests.length > 0 && (
        <div className="quest-section">
          <h2 className="section-title">Flow Finder</h2>
          <div className="quest-grid stagger-children-fast">
            {flowFinderQuests.map(quest => renderQuestCard(quest))}
          </div>
        </div>
      )}

      {/* Section 2: Skills-Only Courage Matrix */}
      <div className="quest-section">
        <h2 className="section-title">Courage Matrix</h2>
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

      {/* Section 3: Voice Logging */}
      <div className="quest-section">
        <h2 className="section-title">Voice Logging</h2>
        <div className="quest-grid stagger-children-fast">
          {voiceQuests.map(quest => renderQuestCard(quest))}
        </div>
      </div>
    </div>
  )
}
