/**
 * PlayListTab.jsx
 *
 * Play-List tab for the 7-Day Challenge page.
 *
 * States:
 *   1. No playskills and no active challenges → WahooDiscoveryFlow (first-visit)
 *   2. Otherwise → Active Wahoos + WahooCreator (free text + bucket list) + WahooInspiration
 *
 * Active Wahoos come from quest_tasks (is_courage_challenge = true).
 * Bucket list wahoos come from groan_challenges with status='generated' and no accepted_at.
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { findSkillSegment } from '../lib/wheelTaxonomy'
import { hapticLight } from '../lib/haptics'
import GroanCompletionModal from './GroanCompletionModal'
import WahooCreator from './WahooCreator'
import WahooDiscoveryFlow from './WahooDiscoveryFlow'
import WahooInspiration from './WahooInspiration'
import HealingFlowModal from './HealingFlowModal'
import QuestSelector from './QuestSelector'

export default function PlayListTab({
  userId,
  currentVisibilityLayer = 'screen',
  onQuestComplete,
  onRefreshPoints,
  wahooCount = 0,
  leagueData = null,
}) {
  const navigate = useNavigate()
  const [playskills, setPlayskills] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [completingChallenge, setCompletingChallenge] = useState(null)
  const [loadingChallengeId, setLoadingChallengeId] = useState(null)
  const [wahooCreatorKey, setWahooCreatorKey] = useState(0)
  const [showWahooModal, setShowWahooModal] = useState(false)
  const [bucketListWahoos, setBucketListWahoos] = useState([])

  // Orphan challenges (groan_challenges without quest_tasks)
  const [orphanChallenges, setOrphanChallenges] = useState([])
  const [orphanQuestPicks, setOrphanQuestPicks] = useState({}) // { challengeId: questId }
  const [assigningOrphan, setAssigningOrphan] = useState(null)

  // Healing data for inline display
  const [healingByChallenge, setHealingByChallenge] = useState({})

  // Standalone healing flow state
  const [blockingText, setBlockingText] = useState('')
  const [showBlockingQuestPicker, setShowBlockingQuestPicker] = useState(false)
  const [blockingQuestId, setBlockingQuestId] = useState(null)
  const [blockingTaskId, setBlockingTaskId] = useState(null)
  const [blockingHealingData, setBlockingHealingData] = useState(null)
  const [showBlockingHealingModal, setShowBlockingHealingModal] = useState(false)

  useEffect(() => {
    if (showWahooModal) {
      document.body.classList.add('modal-active')
      return () => document.body.classList.remove('modal-active')
    }
  }, [showWahooModal])
  const [allTimeWahoos, setAllTimeWahoos] = useState(0)

  // Fetch bucket list wahoos (generated, not yet accepted)
  const fetchBucketListWahoos = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('groan_challenges')
      .select('id, title, challenge_text, status, accepted_at')
      .eq('user_id', userId)
      .eq('status', 'generated')
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setBucketListWahoos(data)
  }, [userId])

  // Fetch playskills (extracted so WahooInspiration's PlaySkillPicker can refresh)
  const fetchPlayskills = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, cluster_type, items, step_id')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
    if (data) setPlayskills(data)
  }, [userId])

  // Fetch playskills + active challenges + bucket list
  useEffect(() => {
    if (!userId) return

    Promise.all([
      fetchPlayskills(),
      fetchActiveChallenges(),
      fetchOrphans(),
      supabase
        .from('groan_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      fetchBucketListWahoos(),
    ]).then(([, , , { count }]) => {
      setAllTimeWahoos(count || 0)
      setLoading(false)
    }).catch(err => {
      console.error('PlayListTab fetch error:', err)
      setLoading(false)
    })
  }, [userId])

  const fetchActiveChallenges = async () => {
    // Source of truth: quest_tasks with is_courage_challenge = true
    const { data: tasks } = await supabase
      .from('quest_tasks')
      .select('id, quest_id, text, groan_challenge_id, done, created_at')
      .eq('user_id', userId)
      .eq('is_courage_challenge', true)
      .eq('done', false)
      .order('created_at', { ascending: false })

    if (!tasks || tasks.length === 0) {
      setActiveChallenges([])
      return
    }

    // Enrich with groan_challenge status + quest label
    const groanIds = tasks.map(t => t.groan_challenge_id).filter(Boolean)
    const questIds = [...new Set(tasks.map(t => t.quest_id).filter(Boolean))]

    const [{ data: challenges }, { data: quests }] = await Promise.all([
      groanIds.length > 0
        ? supabase.from('groan_challenges').select('id, source_label, status').in('id', groanIds)
        : { data: [] },
      questIds.length > 0
        ? supabase.from('quests').select('id, label, status').in('id', questIds)
        : { data: [] },
    ])

    const challengeMap = Object.fromEntries((challenges || []).map(c => [c.id, c]))
    const questMap = Object.fromEntries((quests || []).map(q => [q.id, q]))

    const enriched = tasks.map(task => {
      const challenge = challengeMap[task.groan_challenge_id]
      const quest = questMap[task.quest_id]
      const questClosed = quest?.status === 'closed' || quest?.status === 'completed'
      return {
        // Shape matches what rendering expects (reference_id, display_name, _source_label)
        id: task.id,
        reference_id: task.groan_challenge_id,
        display_name: task.text,
        _source_label: quest?.label || challenge?.source_label || 'Courage',
        _status: challenge?.status,
        _questClosed: questClosed,
      }
    })

    setActiveChallenges(enriched.filter(e => e._status !== 'completed' && !e._questClosed))
  }

  // Detect orphan challenges (groan_challenges with no quest_task)
  const fetchOrphans = async () => {
    const { data: allActive } = await supabase
      .from('groan_challenges')
      .select('id, title, challenge_text, status')
      .eq('user_id', userId)
      .in('status', ['active', 'accepted'])

    if (!allActive || allActive.length === 0) { setOrphanChallenges([]); return }

    const ids = allActive.map(c => c.id)
    const { data: linked } = await supabase
      .from('quest_tasks')
      .select('groan_challenge_id')
      .in('groan_challenge_id', ids)

    const linkedIds = new Set((linked || []).map(t => t.groan_challenge_id))
    setOrphanChallenges(allActive.filter(c => !linkedIds.has(c.id)))
  }

  const handleAssignOrphan = async (challengeId, questId) => {
    if (!questId) return
    setAssigningOrphan(challengeId)
    const challenge = orphanChallenges.find(c => c.id === challengeId)
    await supabase.from('quest_tasks').insert({
      quest_id: questId,
      user_id: userId,
      text: challenge?.title || challenge?.challenge_text || 'Courage challenge',
      is_courage_challenge: true,
      groan_challenge_id: challengeId,
      sort_order: 0,
    })
    setAssigningOrphan(null)
    setOrphanChallenges(prev => prev.filter(c => c.id !== challengeId))
    setOrphanQuestPicks(prev => { const next = { ...prev }; delete next[challengeId]; return next })
    fetchActiveChallenges()
  }

  // Stable key from challenge IDs — re-fetches when actual challenges change, not just count
  const challengeKey = useMemo(() =>
    activeChallenges.map(c => c.reference_id).filter(Boolean).join(','),
    [activeChallenges]
  )

  // Fetch healing intentions linked to active challenges
  useEffect(() => {
    if (!userId || !challengeKey) {
      setHealingByChallenge({})
      return
    }
    const challengeIds = challengeKey.split(',')

    supabase
      .from('quest_tasks')
      .select('groan_challenge_id, id, healing_intentions!quest_task_id(id, pattern, fear_text, origin_text, insight_text, rewire_text, expectation_text, healing_stage, outcome, protective_voice, quest_task_id)')
      .in('groan_challenge_id', challengeIds)
      .not('groan_challenge_id', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(qt => {
          const intentions = qt.healing_intentions || []
          // Prefer active (in-progress) healing, fall back to completed for review
          const active = intentions.find(h => !h.outcome)
          const completed = !active ? intentions.find(h => h.outcome === 'completed') : null
          const best = active || completed
          if (best && qt.groan_challenge_id) {
            map[qt.groan_challenge_id] = { ...best, questTaskId: qt.id }
          }
        })
        setHealingByChallenge(map)
      })
  }, [userId, challengeKey])

  // Extract category ids from playskills
  const categoryIds = useMemo(() => {
    const ids = new Set()
    playskills.forEach(ps => {
      const catId = ps.items?.[0]?.category
      if (catId) ids.add(catId)
    })
    return [...ids]
  }, [playskills])

  // ─── Active Wahoos renderer ─────────────────────────────────────────────────

  function renderActiveWahoos() {
    return (
      <div className="plt-section-card">
        <div className="plt-section-header">
          <div className="plt-section-header-left">
            <span className="plt-section-icon">🔥</span>
            <span className="plt-section-title">Active Courage Challenges</span>
          </div>
          <span className="plt-section-count">{activeChallenges.length}</span>
        </div>
        <div className="plt-section-items">
          {(() => {
            // Group by quest label
            const groups = {}
            activeChallenges.forEach(pick => {
              const label = pick._source_label || 'Courage'
              if (!groups[label]) groups[label] = []
              groups[label].push(pick)
            })

            return Object.entries(groups).map(([label, picks]) => (
              <div key={label} className="plt-quest-group">
                {Object.keys(groups).length > 1 && (
                  <div className="plt-quest-group-label">{label}</div>
                )}
                {picks.map(pick => {
                  const isLoading = loadingChallengeId === pick.reference_id
                  const healing = healingByChallenge[pick.reference_id]
                  const hasActiveHealing = healing && !healing.outcome && healing.healing_stage
                  const hasCompletedHealing = healing && healing.outcome === 'completed' && healing.protective_voice

                  return (
                    <div key={pick.id || pick.reference_id} className="plt-item-row">
                      <span className="plt-item-check"></span>
                      <div className="plt-item-body">
                        <div className="plt-item-name">{pick.display_name}</div>

                        {/* Completed healing — tap to review */}
                        {hasCompletedHealing && (
                          <div
                            className="plt-healing-inline plt-healing-done"
                            onClick={() => {
                              setBlockingTaskId(healing.questTaskId)
                              setBlockingText(pick.display_name)
                              setBlockingHealingData(healing)
                              setShowBlockingHealingModal(true)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="plt-healing-icon">✅</span>
                            <div className="plt-healing-body">
                              <div className="plt-healing-voice">
                                {healing.protective_voice.charAt(0).toUpperCase() + healing.protective_voice.slice(1).replace(/_/g, ' ')}
                              </div>
                              <div className="plt-healing-cta">Review healing flow →</div>
                            </div>
                          </div>
                        )}

                        {/* Active healing — tap to continue */}
                        {hasActiveHealing && healing.protective_voice && (
                          <div
                            className="plt-healing-inline"
                            onClick={() => {
                              setBlockingTaskId(healing.questTaskId)
                              setBlockingText(pick.display_name)
                              setBlockingHealingData(healing)
                              setShowBlockingHealingModal(true)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <span className="plt-healing-icon">💚</span>
                            <div className="plt-healing-body">
                              <div className="plt-healing-voice">
                                {healing.protective_voice.charAt(0).toUpperCase() + healing.protective_voice.slice(1).replace(/_/g, ' ')}
                              </div>
                              <div className="plt-healing-cta">Continue healing flow →</div>
                            </div>
                          </div>
                        )}
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
                        {isLoading ? '...' : 'I Did It!'}
                      </button>
                    </div>
                  )
                })}
              </div>
            ))
          })()}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="playlist-tab"><div className="loading-state"><div className="spinner" /></div></div>
  }

  // ─── State 1: First visit (no playskills, no active challenges) ─────────────

  if (playskills.length === 0 && activeChallenges.length === 0) {
    return (
      <div className="playlist-tab">
        <WahooDiscoveryFlow
          userId={userId}
          currentVisibilityLayer={currentVisibilityLayer}
          onComplete={() => {
            fetchActiveChallenges()
            onRefreshPoints?.()
          }}
        />

        {completingChallenge && (
          <GroanCompletionModal
            challenge={completingChallenge}
            userId={userId}
            onComplete={() => {
              setCompletingChallenge(null)
              fetchActiveChallenges()
              onRefreshPoints?.()
            }}
            onClose={() => setCompletingChallenge(null)}
          />
        )}
      </div>
    )
  }

  // ─── State 2: Has wahoos or playskills → WahooCreator ──────────────────────

  return (
    <div className="playlist-tab">
      {/* Courage counter */}
      {allTimeWahoos > 0 && (
        <div className="plt-counter-card">
          <div className="plt-counter-header">
            <div className="plt-counter-number">{allTimeWahoos}</div>
            <div className="plt-counter-info">
              <div className="plt-counter-title">Courage Challenges completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Orphan banner — old challenges without a quest */}
      {orphanChallenges.length > 0 && (
        <div className="plt-orphan-banner">
          <div className="plt-orphan-header">
            <span>📋</span>
            <span className="plt-orphan-title">
              {orphanChallenges.length} courage challenge{orphanChallenges.length > 1 ? 's need' : ' needs'} a life path
            </span>
          </div>
          {orphanChallenges.map(challenge => (
            <div key={challenge.id} className="plt-orphan-row">
              <div className="plt-orphan-name">{challenge.title || challenge.challenge_text || 'Untitled challenge'}</div>
              <QuestSelector
                userId={userId}
                value={orphanQuestPicks[challenge.id] || null}
                onChange={(questId) => setOrphanQuestPicks(prev => ({ ...prev, [challenge.id]: questId }))}
              />
              <button
                className="plt-orphan-assign"
                disabled={!orphanQuestPicks[challenge.id] || assigningOrphan === challenge.id}
                onClick={() => handleAssignOrphan(challenge.id, orphanQuestPicks[challenge.id])}
              >
                {assigningOrphan === challenge.id ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Wahoos */}
      {activeChallenges.length > 0 && renderActiveWahoos()}

      {/* "What's blocking you?" archived — healing tied to wahoo cards only */}

      {/* Add a courage challenge button */}
      <button
        className="wc-add-btn"
        onClick={() => setShowWahooModal(true)}
      >
        + Add a Courage Challenge
      </button>

      {/* WahooCreator Modal */}
      {showWahooModal && (
        <div className="wc-modal-overlay" onClick={() => { setWahooCreatorKey(k => k + 1); setShowWahooModal(false) }}>
          <div className="wc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="wc-modal-close" onClick={() => { setWahooCreatorKey(k => k + 1); setShowWahooModal(false) }}>&times;</button>
            <WahooCreator
              key={wahooCreatorKey}
              userId={userId}
              bucketList={bucketListWahoos}
              onWahooAccepted={(healingTask) => {
                fetchActiveChallenges()
                fetchBucketListWahoos()
                onRefreshPoints?.()
                if (healingTask?.id) {
                  setBlockingTaskId(healingTask.id)
                  setBlockingText(healingTask.text || '')
                  setShowBlockingHealingModal(true)
                }
              }}
              onClose={() => {
                fetchActiveChallenges()
                fetchBucketListWahoos()
                setWahooCreatorKey(k => k + 1)
                setShowWahooModal(false)
              }}
            />
          </div>
        </div>
      )}

      {/* WahooInspiration archived — play-skills + Ikigai Mix deferred */}

      {/* Community Tasks CTA */}
      <button className="plt-community-cta" onClick={() => navigate('/community?tab=tasks')}>
        <span className="plt-community-cta-glow" />
        <span className="plt-community-cta-inner">
          <span className="plt-community-cta-icon">📣</span>
          <span className="plt-community-cta-text">
            <span className="plt-community-cta-title">Earn Community Points</span>
            <span className="plt-community-cta-sub">Share your journey with the community</span>
          </span>
          <span className="plt-community-cta-badge">⚡ RP</span>
        </span>
      </button>

      {/* Completion modal */}
      {completingChallenge && (
        <GroanCompletionModal
          challenge={completingChallenge}
          userId={userId}
          onComplete={() => {
            setCompletingChallenge(null)
            fetchActiveChallenges()
            onRefreshPoints?.()
          }}
          onClose={() => setCompletingChallenge(null)}
        />
      )}

      {/* Healing flow modal (standalone or resume) */}
      {showBlockingHealingModal && blockingTaskId && (
        <HealingFlowModal
          taskText={blockingText}
          userId={userId}
          questTaskId={blockingTaskId}
          existingData={blockingHealingData}
          onComplete={() => {
            setShowBlockingHealingModal(false)
            setBlockingText('')
            setBlockingTaskId(null)
            setBlockingQuestId(null)
            setBlockingHealingData(null)
            fetchActiveChallenges()
            onRefreshPoints?.()
          }}
          onClose={() => {
            setShowBlockingHealingModal(false)
            setBlockingText('')
            setBlockingTaskId(null)
            setBlockingHealingData(null)
          }}
        />
      )}
    </div>
  )
}
