/**
 * PlayListTab.jsx
 *
 * Play-List tab for the 7-Day Challenge page.
 *
 * States:
 *   1. No playskills → "Find Your Play-Skills" CTA
 *   2. Has playskills → WahooCreator (two-path: free text or browse categories)
 *
 * Also shows Active Wahoos section (from priority_weekly_picks)
 * and a link to the Wahoo Map (Groan Matrix).
 */

import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { findSkillSegment } from '../lib/wheelTaxonomy'
import GroanCompletionModal from './GroanCompletionModal'
import WahooCreator from './WahooCreator'
import PlaySkillPicker from './PlaySkillPicker'

export default function PlayListTab({
  userId,
  currentVisibilityLayer = 'screen',
  onQuestComplete,
  onRefreshPoints,
}) {
  const navigate = useNavigate()
  const [playskills, setPlayskills] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [completingChallenge, setCompletingChallenge] = useState(null)
  const [loadingChallengeId, setLoadingChallengeId] = useState(null)
  const [showPlaySkillPicker, setShowPlaySkillPicker] = useState(false)
  const [showWahooCreator, setShowWahooCreator] = useState(false)

  // Fetch playskills + active challenges
  useEffect(() => {
    if (!userId) return

    Promise.all([
      supabase
        .from('nikigai_clusters')
        .select('id, cluster_label, cluster_type, items, step_id')
        .eq('user_id', userId)
        .eq('cluster_type', 'skills')
        .eq('step_id', 'get_started'),
      fetchActiveChallenges(),
    ]).then(([{ data }]) => {
      if (data) setPlayskills(data)
      setLoading(false)
    }).catch(err => {
      console.error('PlayListTab fetch error:', err)
      setLoading(false)
    })
  }, [userId])

  const fetchActiveChallenges = async () => {
    const { data } = await supabase
      .from('priority_weekly_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', getWeekStartLocal())
      .eq('pick_type', 'groan')

    if (data) {
      // Enrich with source label from groan_challenges
      const enriched = await Promise.all(data.map(async pick => {
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
                  <div className="plt-item-meta">{pick._source_label || 'Wahoo'}</div>
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

  // ─── State 1: No playskills ───────────────────────────────────────────────

  if (playskills.length === 0) {
    return (
      <div className="playlist-tab">
        {activeChallenges.length > 0 && renderActiveWahoos()}

        <div className="plt-section-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔥</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Find Your Play-Skills First</h3>
          <p style={{ color: '#6c757d', fontSize: '0.85rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
            Pick what lights you up so we can generate Wahoos that fit you.
          </p>
          <button
            className="mpp-gold-btn"
            onClick={() => setShowPlaySkillPicker(true)}
            style={{ width: '100%' }}
          >
            Find My Play-Skills
          </button>
        </div>

        {showPlaySkillPicker && (
          <PlaySkillPicker
            userId={userId}
            onComplete={() => {
              setShowPlaySkillPicker(false)
              // Reload playskills
              supabase
                .from('nikigai_clusters')
                .select('id, cluster_label, cluster_type, items, step_id')
                .eq('user_id', userId)
                .eq('cluster_type', 'skills')
                .eq('step_id', 'get_started')
                .then(({ data }) => {
                  if (data) setPlayskills(data)
                })
            }}
            onClose={() => setShowPlaySkillPicker(false)}
          />
        )}

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

  // ─── State 2: Has playskills → WahooCreator ──────────────────────────────

  return (
    <div className="playlist-tab">
      {/* Active Wahoos */}
      {activeChallenges.length > 0 && renderActiveWahoos()}

      {/* WahooCreator — always visible inline */}
      <WahooCreator
        userId={userId}
        categories={categoryIds}
        currentVisibilityLayer={currentVisibilityLayer}
        onWahooAccepted={() => {
          fetchActiveChallenges()
          onRefreshPoints?.()
        }}
        onClose={() => {
          // WahooCreator auto-closes after success, refresh state
          fetchActiveChallenges()
        }}
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
