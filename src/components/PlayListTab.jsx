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

import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import QuestCard from './QuestCard'
import GroanMatrix from './GroanMatrix'
import GroanCompletionModal from './GroanCompletionModal'
import MobilePlaylistPicker from './MobilePlaylistPicker'

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
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  )
  const [activeChallenges, setActiveChallenges] = useState([])
  const [completingChallenge, setCompletingChallenge] = useState(null)
  const [loadingChallengeId, setLoadingChallengeId] = useState(null)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Fetch this week's groan picks and enrich with skill label from groan_challenges
  const fetchActiveChallenges = async () => {
    if (!userId) return
    const weekStart = getWeekStartLocal()
    const { data: picks } = await supabase
      .from('priority_weekly_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)
      .eq('pick_type', 'groan')
    if (!picks || picks.length === 0) { setActiveChallenges([]); return }
    // Fetch source_label + status for each challenge, filter out already-completed ones
    const refIds = picks.map(p => p.reference_id).filter(Boolean)
    const { data: challenges } = await supabase
      .from('groan_challenges')
      .select('id, source_label, status')
      .in('id', refIds)
    const challengeMap = Object.fromEntries((challenges || []).map(c => [c.id, c]))
    const activePicks = picks.filter(p => {
      const ch = challengeMap[p.reference_id]
      return ch && ch.status !== 'completed'
    })
    setActiveChallenges(activePicks.map(p => ({ ...p, _source_label: challengeMap[p.reference_id]?.source_label || null })))
  }

  useEffect(() => {
    fetchActiveChallenges()
  }, [userId, groanMatrixKey])

  // Hide bottom toolbar when completion modal is open
  useEffect(() => {
    if (completingChallenge) {
      document.body.classList.add('modal-active')
      return () => document.body.classList.remove('modal-active')
    }
  }, [completingChallenge])

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

  const renderQuestRow = (quest) => {
    const completed = isQuestCompletedToday(quest.id, quest)
    const locked = isQuestLocked ? isQuestLocked(quest) : false

    return (
      <div key={quest.id} className={`ht-item-row ${completed ? 'done' : ''} ${locked ? 'locked' : ''}`}>
        <span className={`ht-item-check ${completed ? 'done' : ''}`}>
          {completed ? '✓' : locked ? '🔒' : ''}
        </span>
        <div className="ht-item-body">
          <div className="ht-item-name">{quest.name}</div>
          <div className="ht-item-meta">
            <span className="ht-item-type">Flow Finder</span>
            <span className="ht-item-sep">·</span>
            <span className="ht-pts">{quest.points}pts</span>
          </div>
        </div>
        {completed && quest.flow_route ? (
          <a
            href={`${quest.flow_route}?returnTo=/7-day-challenge`}
            className="ht-item-action reread-action"
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            View Results
          </a>
        ) : completed ? (
          <span className="ht-item-action done-action">Done</span>
        ) : locked ? (
          <span className="ht-item-action done-action">Locked</span>
        ) : quest.flow_route ? (
          <a
            href={`${quest.flow_route}?returnTo=/7-day-challenge`}
            className="ht-item-action"
            style={{ textDecoration: 'none', textAlign: 'center' }}
          >
            Start →
          </a>
        ) : (
          <button className="ht-item-action" onClick={() => onQuestComplete(quest)}>
            Complete
          </button>
        )}
      </div>
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


              {/* 4. Quest subsections (matches Healing's subsection-title style) */}
              {visibleGroups.map(group => {
                const quests = group.ids
                  .map(id => flowFinderQuests.find(q => q.id === id))
                  .filter(Boolean)
                if (quests.length === 0) return null
                return (
                  <div key={group.label} className="quest-subsection healing-rows">
                    <h3 className="subsection-title">{group.label}</h3>
                    <div className="healing-row-list">
                      {quests.map(quest => renderQuestRow(quest))}
                    </div>
                  </div>
                )
              })}
              {showUngrouped && ungrouped.length > 0 && (
                <div className="quest-subsection healing-rows">
                  <h3 className="subsection-title">More</h3>
                  <div className="healing-row-list">
                    {ungrouped.map(quest => renderQuestRow(quest))}
                  </div>
                </div>
              )}
            </div>
          </>
        )
      })()}

      {/* ── Play-list sub-tab: Active Challenges + Courage Matrix ── */}
      {activeSubTab === 'playlist' && activeChallenges.length > 0 && (
        <div className="plt-section-card">
          <div className="plt-section-header">
            <div className="plt-section-header-left">
              <span className="plt-section-icon">🎯</span>
              <span className="plt-section-title">Active Challenges</span>
            </div>
            <span className="plt-section-count">{activeChallenges.length}</span>
          </div>
          <div className="plt-section-items">
            {activeChallenges.map(pick => {
              const isLoading = loadingChallengeId === pick.reference_id
              return (
                <div key={pick.id || pick.reference_id} className="plt-item-row">
                  <span className="plt-item-check"></span>
                  <div className="plt-item-body">
                    <div className="plt-item-name">{pick.display_name}</div>
                    <div className="plt-item-meta">{pick._source_label || 'Play-list Challenge'}</div>
                  </div>
                  <button
                    className="plt-item-action"
                    disabled={isLoading}
                    onClick={async () => {
                      setLoadingChallengeId(pick.reference_id)
                      const { data } = await supabase
                        .from('groan_challenges')
                        .select('*')
                        .eq('id', pick.reference_id)
                        .single()
                      setLoadingChallengeId(null)
                      if (data) setCompletingChallenge(data)
                    }}
                  >
                    {isLoading ? '...' : 'Complete'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'playlist' && (
        <div className="quest-section">
          {isMobile ? (
            <MobilePlaylistPicker
              userId={userId}
              onChallengeAccepted={fetchActiveChallenges}
              layerLockStatus={layerLockStatus}
            />
          ) : (
            <GroanMatrix
              key={groanMatrixKey}
              userId={userId}
              onCellClick={onMatrixCellClick}
              onGenerateChallenge={onGenerateChallenge}
              layerLockStatus={layerLockStatus}
              flowFinderComplete={flowFinderComplete}
              sourceTypes={['skill']}
            />
          )}
        </div>
      )}

      {completingChallenge && (
        <GroanCompletionModal
          challenge={completingChallenge}
          userId={userId}
          onComplete={() => {
            setCompletingChallenge(null)
            fetchActiveChallenges()
          }}
          onClose={() => setCompletingChallenge(null)}
        />
      )}
    </div>
  )
}
