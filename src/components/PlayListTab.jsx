/**
 * PlayListTab.jsx
 *
 * Play-List tab for the 7-Day Challenge page.
 *
 * States:
 *   All users see the same UI: active wahoos + WahooCreator + inspiration
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
// WahooDiscoveryFlow removed — all users use the same WahooCreator flow
import WahooInspiration from './WahooInspiration'
import HealingFlowModal from './HealingFlowModal'
import QuestSelector from './QuestSelector'
import ContentChallenges from './ContentChallenges'
import { fetchFeed } from '../lib/communityFeed'

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

  // Community Courage — recent feed items
  const [communityItems, setCommunityItems] = useState([])
  const [communityNames, setCommunityNames] = useState({})

  useEffect(() => {
    fetchFeed(0, 3).then(async ({ data }) => {
      const items = data || []
      setCommunityItems(items)
      if (!items.length) return
      const userIds = [...new Set(items.map(i => i.user_id))]
      const { data: profiles } = await supabase
        .from('lead_flow_profiles')
        .select('user_id, custom_essence_name, essence_archetype')
        .in('user_id', userIds)
      const names = {}
      profiles?.forEach(p => {
        names[p.user_id] = p.custom_essence_name || p.essence_archetype || null
      })
      setCommunityNames(names)
    }).catch(() => {})
  }, [])

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
    ]).then(([, , { count }]) => {
      setAllTimeWahoos(count || 0)
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
      // Enrich with source label from groan_challenges
      const enriched = await Promise.all(unique.map(async pick => {
        const { data: challenge } = await supabase
          .from('groan_challenges')
          .select('source_label, status')
          .eq('id', pick.reference_id)
          .single()
        return { ...pick, _source_label: challenge?.source_label, _status: challenge?.status }
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
            <span className="plt-section-title">Active Wahoos</span>
          </div>
          <span className="plt-section-count">{activeChallenges.length}</span>
        </div>
        <div className="plt-section-items">
          {activeChallenges.map(pick => {
            const isLoading = loadingChallengeId === pick.reference_id
            const healing = healingByChallenge[pick.reference_id]
            const hasActiveHealing = healing && !healing.outcome && healing.healing_stage

            return (
              <div key={pick.id || pick.reference_id} className="plt-item-row">
                <span className="plt-item-check"></span>
                <div className="plt-item-body">
                  <div className="plt-item-name">{pick.display_name}</div>
                  <div className="plt-item-meta">{pick._source_label || 'Courage'}</div>

                  {hasActiveHealing && (
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
                        {healing.pattern && (
                          <div className="plt-healing-pattern">"{healing.pattern}"</div>
                        )}
                        {healing.protective_voice && (
                          <div className="plt-healing-voice">
                            {healing.protective_voice.charAt(0).toUpperCase() + healing.protective_voice.slice(1).replace(/_/g, ' ')}
                          </div>
                        )}
                        {healing.origin_text && (
                          <div className="plt-healing-origin">{healing.origin_text}</div>
                        )}
                        <div className="plt-healing-cta">
                          {healing.healing_stage === 'in_progress' ? 'Continue healing flow →' : 'View →'}
                        </div>
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
      </div>
    )
  }

  if (loading) {
    return <div className="playlist-tab"><div className="loading-state"><div className="spinner" /></div></div>
  }

  // ─── Main render (same for first visit and returning users) ─────────────────

  return (
    <div className="playlist-tab">
      {/* Active Wahoos */}
      {activeChallenges.length > 0 && renderActiveWahoos()}

      {/* What's blocking you? — standalone healing entry */}
      <div className="plt-blocking-input">
        <div className="plt-blocking-row">
          <span className="plt-blocking-icon">💚</span>
          <input
            className="plt-blocking-field"
            type="text"
            value={blockingText}
            onChange={e => {
              setBlockingText(e.target.value)
              if (showBlockingQuestPicker) setShowBlockingQuestPicker(false)
            }}
            placeholder="What's blocking you right now?"
            onKeyDown={e => {
              if (e.key === 'Enter' && blockingText.trim()) setShowBlockingQuestPicker(true)
            }}
          />
          {blockingText.trim() && !showBlockingQuestPicker && (
            <button className="plt-blocking-go" onClick={() => setShowBlockingQuestPicker(true)}>
              Explore
            </button>
          )}
        </div>
        {showBlockingQuestPicker && (
          <div style={{ marginTop: 8 }}>
            <QuestSelector
              userId={userId}
              value={blockingQuestId}
              onChange={async (questId) => {
                if (!questId || !blockingText.trim()) return
                setBlockingQuestId(questId)
                const { data: task } = await supabase.from('quest_tasks').insert({
                  quest_id: questId,
                  user_id: userId,
                  text: blockingText.trim(),
                  is_courage_challenge: true,
                  sort_order: 0,
                }).select('id').single()
                if (task) {
                  setBlockingTaskId(task.id)
                  setShowBlockingHealingModal(true)
                  setShowBlockingQuestPicker(false)
                } else {
                  setBlockingQuestId(null)
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Add a Wahoo button */}
      <button
        className="wc-add-btn"
        onClick={() => setShowWahooModal(true)}
      >
        + Add a Wahoo
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
              onWahooAccepted={() => {
                fetchActiveChallenges()
                fetchBucketListWahoos()
                onRefreshPoints?.()
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

      {/* Need inspiration? — play-skills + Ikigai Mix (+ future pillar gaps) */}
      <WahooInspiration
        userId={userId}
        categories={categoryIds}
        currentVisibilityLayer={currentVisibilityLayer}
        onWahooAccepted={() => {
          fetchActiveChallenges()
          fetchBucketListWahoos()
          onRefreshPoints?.()
        }}
        onWahooSaved={fetchBucketListWahoos}
        onPlaySkillsUpdated={fetchPlayskills}
      />

      {/* Reach section — only if in active league */}
      {leagueData?.league?.status === 'active' && leagueData?.isOnTeam && (
        <div className="plt-reach-section">
          <div className="plt-reach-header">
            <span className="plt-reach-icon">📣</span>
            <span className="plt-reach-title">Reach</span>
            <span className="plt-reach-subtitle">Share your journey to earn league points</span>
          </div>
          <ContentChallenges
            leagueId={leagueData.league.id}
            userId={userId}
            teamId={leagueData.userTeam?.id}
            weekNumber={leagueData.getCurrentWeek?.()}
            leagueStatus={leagueData.league.status}
            isOnTeam={leagueData.isOnTeam}
            teams={leagueData.teams}
            contentSubmissions={leagueData.contentSubmissions}
            onSubmitted={leagueData.onContentSubmitted}
            standings={leagueData.standings}
            userTeam={leagueData.userTeam}
            userData={leagueData.userData}
          />
        </div>
      )}

      {/* Community Courage — recent shared wahoos */}
      {communityItems.length > 0 && (
        <div className="plt-community">
          <h3 className="plt-community-title">Community Courage</h3>
          {communityItems.map(item => (
            <div key={item.id} className="plt-community-card">
              <span className="plt-community-name">{communityNames[item.user_id] || 'Someone'}</span>
              <span className="plt-community-text">{item.title}</span>
            </div>
          ))}
          <button className="plt-community-more" onClick={() => navigate('/community')}>
            See all →
          </button>
        </div>
      )}

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
