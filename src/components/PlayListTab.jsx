/**
 * PlayListTab.jsx
 *
 * Play-List tab for the 7-Day Challenge page.
 *
 * States:
 *   1. No playskills → "Find Your Flow First" CTA → /get-started
 *   2. Has playskills, no topics → "Identify Play-List Topics" CTA → /identify-topics
 *   3. Has playskills AND topics → Category cards grid
 *      Tap card → opens MobilePlaylistPicker modal (Topic → Role → Playskill → Challenge → Day)
 *
 * Also shows Active Challenges section (from priority_weekly_picks).
 */

import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { findSkillSegment } from '../lib/wheelTaxonomy'
import GroanCompletionModal from './GroanCompletionModal'
import MobilePlaylistPicker from './MobilePlaylistPicker'

export default function PlayListTab({
  userId,
  onQuestComplete,
}) {
  const navigate = useNavigate()
  const [playskills, setPlayskills] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChallenges, setActiveChallenges] = useState([])
  const [completingChallenge, setCompletingChallenge] = useState(null)
  const [loadingChallengeId, setLoadingChallengeId] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null) // opens picker modal

  // Fetch playskills + topics + active challenges
  useEffect(() => {
    if (!userId) return

    Promise.all([
      supabase
        .from('nikigai_clusters')
        .select('id, cluster_label, cluster_type, items, step_id')
        .eq('user_id', userId)
        .in('cluster_type', ['skills', 'problems'])
        .in('step_id', ['get_started', 'identify_topics']),
      fetchActiveChallenges(),
    ]).then(([{ data }]) => {
      if (data) {
        setPlayskills(data.filter(d => d.cluster_type === 'skills' && d.step_id === 'get_started'))
        setTopics(data.filter(d => d.cluster_type === 'problems' && d.step_id === 'identify_topics'))
      }
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

  // Group playskills by category
  const categories = useMemo(() => {
    const grouped = {}
    playskills.forEach(ps => {
      const catId = ps.items?.[0]?.category
      if (!catId) return
      if (!grouped[catId]) grouped[catId] = { id: catId, playskills: [] }
      grouped[catId].playskills.push(ps)
    })
    return Object.values(grouped)
  }, [playskills])

  // ─── Active Challenges renderer (used in states 2 + 3) ─────────────────────

  function renderActiveChallenges() {
    return (
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
                  <div className="plt-item-meta">{pick._source_label || 'Play-List Task'}</div>
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
    )
  }

  if (loading) {
    return <div className="playlist-tab"><div className="loading-state"><div className="spinner" /></div></div>
  }

  // ─── State 1: No playskills ───────────────────────────────────────────────

  if (playskills.length === 0) {
    return (
      <div className="playlist-tab">
        <div className="plt-section-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧭</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Find Your Flow First</h3>
          <p style={{ color: '#9a9daa', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
            Discover your unique play-skills to unlock personalised challenges.
          </p>
          <button
            className="mpp-gold-btn"
            onClick={() => navigate('/get-started')}
            style={{ width: '100%' }}
          >
            Get Started →
          </button>
        </div>
      </div>
    )
  }

  // ─── State 2: Has playskills, no topics ───────────────────────────────────

  if (topics.length === 0) {
    return (
      <div className="playlist-tab">
        {/* Active challenges still show */}
        {activeChallenges.length > 0 && renderActiveChallenges()}

        <div className="plt-section-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Identify Play-List Topics</h3>
          <p style={{ color: '#9a9daa', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
            Find the problems and topics you care about to create meaningful challenges.
          </p>
          <button
            className="mpp-gold-btn"
            onClick={() => navigate('/identify-topics')}
            style={{ width: '100%' }}
          >
            Identify Topics →
          </button>
        </div>

        {/* Show category cards as preview (non-tappable) */}
        <div className="plt-categories-grid">
          {categories.map(cat => {
            const seg = findSkillSegment(cat.id)
            return (
              <div key={cat.id} className="plt-category-card plt-category-locked">
                <div className="plt-cat-icon">{seg?.icon}</div>
                <div className="plt-cat-name">{seg?.displayName || cat.id}</div>
                <div className="plt-cat-count">{cat.playskills.length} play-skills</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── State 3: Has playskills AND topics ───────────────────────────────────

  return (
    <div className="playlist-tab">
      {/* Active challenges */}
      {activeChallenges.length > 0 && renderActiveChallenges()}

      {/* Category cards */}
      <div className="plt-categories-grid">
        {categories.map(cat => {
          const seg = findSkillSegment(cat.id)
          const matchedTopicCount = topics.filter(t => {
            const mp = t.items?.[0]?.matchedPlayskills || []
            return mp.some(ps => (seg?.placemakes || []).includes(ps))
          }).length

          return (
            <button
              key={cat.id}
              className="plt-category-card"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div className="plt-cat-icon">{seg?.icon}</div>
              <div className="plt-cat-name">{seg?.displayName || cat.id}</div>
              <div className="plt-cat-count">{matchedTopicCount} topics</div>
            </button>
          )
        })}
      </div>

      {/* Redo topics link */}
      <button
        className="plt-redo-link"
        onClick={() => navigate('/identify-topics')}
      >
        Re-identify topics
      </button>

      {/* Picker modal */}
      {selectedCategory && (
        <div className="plt-modal-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="plt-modal-content" onClick={e => e.stopPropagation()}>
            <button className="plt-modal-close" onClick={() => setSelectedCategory(null)}>&times;</button>
            <MobilePlaylistPicker
              userId={userId}
              categoryId={selectedCategory}
              onChallengeAccepted={() => {
                fetchActiveChallenges()
              }}
              onClose={() => setSelectedCategory(null)}
            />
          </div>
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
          }}
          onClose={() => setCompletingChallenge(null)}
        />
      )}
    </div>
  )
}
