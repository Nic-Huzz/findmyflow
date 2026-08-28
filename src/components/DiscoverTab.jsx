/**
 * DiscoverTab.jsx — Phase 1 "What lights me up?" tab
 *
 * Contains: Essence Mirror status, Life Map entry, Dome entry/viz,
 * and the "Ready to go deeper?" Phase 1→2 bridge CTA.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DomeRadar from './DomeRadar'
import './DiscoverTab.css'

export default function DiscoverTab({ userId, onUnlockTab }) {
  const navigate = useNavigate()
  const [essenceDone, setEssenceDone] = useState(false)
  const [lifeMapDone, setLifeMapDone] = useState(false)
  const [domeCount, setDomeCount] = useState(0)
  const [hasQuests, setHasQuests] = useState(false)
  const [domeRatings, setDomeRatings] = useState({})
  const [domeChecked, setDomeChecked] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    Promise.all([
      supabase.from('user_stage_progress')
        .select('essence_mirror_completed')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('nikigai_clusters')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase.from('experience_dome_ratings')
        .select('node_id, ns_state')
        .eq('user_id', userId),
      supabase.from('quests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('status', 'active'),
    ]).then(([essenceRes, lifeMapRes, domeRes, questsRes]) => {
      setEssenceDone(!!essenceRes.data?.essence_mirror_completed)
      setLifeMapDone((lifeMapRes.count || 0) > 0)

      // Build dome data maps
      const ratings = {}
      const checked = {}
      ;(domeRes.data || []).forEach(r => {
        if (r.ns_state) ratings[r.node_id] = r.ns_state
        checked[r.node_id] = true
      })
      setDomeRatings(ratings)
      setDomeChecked(checked)
      setDomeCount(Object.keys(checked).length)

      setHasQuests((questsRes.count || 0) > 0)
      setLoading(false)
    }).catch(err => {
      console.error('DiscoverTab load error:', err)
      setLoading(false)
    })
  }, [userId])

  if (loading) return <div className="dt-loading">Loading...</div>

  return (
    <div className="discover-tab">
      {/* Step 1: Essence Mirror */}
      <button className="dt-card" onClick={() => navigate('/essence-mirror')}>
        <div className="dt-card-header">
          <span className="dt-card-icon">{essenceDone ? '✅' : '✨'}</span>
          <span className="dt-card-title">{essenceDone ? 'Your Essence' : 'Discover Your Essence'}</span>
        </div>
        <p className="dt-card-desc">
          {essenceDone
            ? 'Revisit your archetype and hero avatar.'
            : 'Who are you at your core? Your spawn point in the game.'}
        </p>
        <span className="dt-card-arrow">→</span>
      </button>

      {/* Step 2: Life Map */}
      <button className="dt-card" onClick={() => navigate('/life-map')}>
        <div className="dt-card-header">
          <span className="dt-card-icon">{lifeMapDone ? '✅' : '🗺'}</span>
          <span className="dt-card-title">{lifeMapDone ? 'Your Life Map' : 'Map Your Life Story'}</span>
        </div>
        <p className="dt-card-desc">
          {lifeMapDone
            ? 'Revisit your life chapters and clusters.'
            : 'What experiences have you already had? Tell your story.'}
        </p>
        <span className="dt-card-arrow">→</span>
      </button>

      {/* Step 3: Experience Dome */}
      <button className="dt-card" onClick={() => navigate('/experience-game')}>
        <div className="dt-card-header">
          <span className="dt-card-icon">🎮</span>
          <span className="dt-card-title">Experience Dome</span>
          {domeCount > 0 && <span className="dt-card-badge">{domeCount} rated</span>}
        </div>
        <p className="dt-card-desc">
          What experiences light you up? Rate them with your nervous system.
        </p>
        <span className="dt-card-arrow">→</span>
      </button>

      {/* Dome Radar (mini viz when data exists) */}
      {domeCount > 0 && (
        <div className="dt-dome-viz">
          <DomeRadar checked={domeChecked} ratings={domeRatings} size={260} showLabels={true} />
        </div>
      )}

      {/* Phase 1→2 Bridge CTA */}
      <button
        className="dt-bridge-cta"
        onClick={() => {
          onUnlockTab?.('Quests')
          navigate('/life-paths')
        }}
      >
        <div className="dt-bridge-text">
          <span className="dt-bridge-title">Ready to go deeper on a life path?</span>
          <span className="dt-bridge-sub">Choose which experiences to pursue as quests.</span>
        </div>
        <span className="dt-bridge-arrow">→</span>
      </button>
    </div>
  )
}
