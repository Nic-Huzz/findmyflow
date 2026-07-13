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

export default function PlayListTab({
  userId,
  currentVisibilityLayer = 'screen',
  onQuestComplete,
  onRefreshPoints,
  wahooCount = 0,
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
            return (
              <div key={pick.id || pick.reference_id} className="plt-item-row">
                <span className="plt-item-check"></span>
                <div className="plt-item-body">
                  <div className="plt-item-name">{pick.display_name}</div>
                  <div className="plt-item-meta">{pick._source_label || 'Courage'}</div>
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
      {/* Active Wahoos */}
      {activeChallenges.length > 0 && renderActiveWahoos()}

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
    </div>
  )
}
