/**
 * PlayListTab.jsx
 *
 * Play-List tab for the 7-Day Challenge page.
 *
 * States:
 *   1. No playskills and no active challenges → WahooDiscoveryFlow (first-visit)
 *   2. Otherwise → Active Wahoos + WahooCreator (free text + bucket list) + WahooInspiration
 *
 * Active Wahoos come from priority_weekly_picks.
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

  // Healing data for inline display
  const [healingByChallenge, setHealingByChallenge] = useState({})

  // Standalone healing flow state
  const [blockingText, setBlockingText] = useState('')
  const [showBlockingQuestPicker, setShowBlockingQuestPicker] = useState(false)
  const [blockingQuestId, setBlockingQuestId] = useState(null)
  const [blockingTaskId, setBlockingTaskId] = useState(null)
  const [showBlockingHealingModal, setShowBlockingHealingModal] = useState(false)

  useEffect(() => {
    if (showWahooModal) {
      document.body.classList.add('modal-active')
      return () => document.body.classList.remove('modal-active')
    }
  }, [showWahooModal])
  const [allTimeWahoos, setAllTimeWahoos] = useState(0)
  const [identityStatements, setIdentityStatements] = useState([])
  const [showIdentity, setShowIdentity] = useState(false)

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
      supabase
        .from('groan_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      fetchBucketListWahoos(),
      supabase
        .from('quest_completions')
        .select('reflection_text')
        .eq('user_id', userId)
        .eq('quest_category', 'Groans')
        .not('reflection_text', 'is', null),
    ]).then(([, , { count }, , identityRes]) => {
      setAllTimeWahoos(count || 0)
      // Parse identity statements from reflection_text JSON
      const stmtCounts = {}
      ;(identityRes?.data || []).forEach(row => {
        try {
          const parsed = JSON.parse(row.reflection_text)
          if (parsed.identity_statement) {
            const s = parsed.identity_statement.trim().toLowerCase()
            if (s) stmtCounts[s] = (stmtCounts[s] || 0) + 1
          }
        } catch {}
      })
      setIdentityStatements(
        Object.entries(stmtCounts)
          .map(([text, ct]) => ({ text, count: ct }))
          .sort((a, b) => b.count - a.count)
      )
      setLoading(false)
    }).catch(err => {
      console.error('PlayListTab fetch error:', err)
      setLoading(false)
    })
  }, [userId])

  const fetchActiveChallenges = async () => {
    // Fetch all picks (not just current week) — wahoos persist until completed
    const { data } = await supabase
      .from('priority_weekly_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('pick_type', 'groan')
      .order('week_start_date', { ascending: false })

    if (data) {
      // Deduplicate by reference_id (keep most recent pick)
      const seen = new Set()
      const unique = data.filter(pick => {
        if (seen.has(pick.reference_id)) return false
        seen.add(pick.reference_id)
        return true
      })
      // Enrich with source label + quest name
      const enriched = await Promise.all(unique.map(async pick => {
        const [{ data: challenge }, { data: questTask }] = await Promise.all([
          supabase.from('groan_challenges').select('source_label, status').eq('id', pick.reference_id).single(),
          supabase.from('quest_tasks').select('quest_id').eq('groan_challenge_id', pick.reference_id).limit(1).maybeSingle(),
        ])
        let questName = null
        if (questTask?.quest_id) {
          const { data: quest } = await supabase.from('quests').select('label').eq('id', questTask.quest_id).single()
          questName = quest?.label
        }
        return { ...pick, _source_label: questName || challenge?.source_label, _status: challenge?.status }
      }))
      setActiveChallenges(enriched.filter(e => e._status !== 'completed'))
    }
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
      .select('groan_challenge_id, id, healing_intentions!quest_task_id(id, pattern, fear_text, origin_text, healing_stage, outcome, protective_voice, quest_task_id)')
      .in('groan_challenge_id', challengeIds)
      .not('groan_challenge_id', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(qt => {
          const intentions = qt.healing_intentions || []
          const active = intentions.find(h => !h.outcome)
          if (active && qt.groan_challenge_id) {
            map[qt.groan_challenge_id] = { ...active, questTaskId: qt.id }
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

                  return (
                    <div key={pick.id || pick.reference_id} className="plt-item-row">
                      <span className="plt-item-check"></span>
                      <div className="plt-item-body">
                        <div className="plt-item-name">{pick.display_name}</div>

                        {hasActiveHealing && healing.protective_voice && (
                          <div
                            className="plt-healing-inline"
                            onClick={() => {
                              setBlockingTaskId(healing.questTaskId)
                              setBlockingText(pick.display_name)
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
      {/* Courage counter + identity statements */}
      {allTimeWahoos > 0 && (
        <div className="plt-counter-card">
          <button className="plt-counter-header" onClick={() => setShowIdentity(!showIdentity)}>
            <div className="plt-counter-number">{allTimeWahoos}</div>
            <div className="plt-counter-info">
              <div className="plt-counter-title">courage challenges completed</div>
              {identityStatements.length > 0 && (
                <div className="plt-counter-top">
                  Top: "I am someone who {identityStatements[0].text}" ({'\u00D7'}{identityStatements[0].count})
                </div>
              )}
            </div>
            <span className="plt-counter-chevron">{showIdentity ? '▲' : '▼'}</span>
          </button>
          {showIdentity && identityStatements.length > 0 && (
            <div className="plt-identity-list">
              {identityStatements.map((s, i) => (
                <div key={i} className="plt-identity-row">
                  <span className="plt-identity-text">I am someone who {s.text}</span>
                  <span className="plt-identity-badge">{'\u00D7'}{s.count}</span>
                </div>
              ))}
            </div>
          )}
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
          onComplete={() => {
            setShowBlockingHealingModal(false)
            setBlockingText('')
            setBlockingTaskId(null)
            setBlockingQuestId(null)
            fetchActiveChallenges()
            onRefreshPoints?.()
          }}
          onClose={() => {
            setShowBlockingHealingModal(false)
            setBlockingText('')
            setBlockingTaskId(null)
          }}
        />
      )}
    </div>
  )
}
