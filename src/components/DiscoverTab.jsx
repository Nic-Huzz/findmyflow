/**
 * DiscoverTab.jsx — Phase 1 "What lights me up?" tab
 *
 * Contains: Essence Mirror status, Life Map entry, Dome entry/viz,
 * "Experience to try this week" picker, and "Ready to go deeper?" bridge CTA.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight } from '../lib/haptics'
import { isCoreNode } from '../lib/experienceDomeConfig'
import DomeRadar from './DomeRadar'
import './DiscoverTab.css'

const WEEK_KEY = 'weekly_experience_focus_'

function getWeekKey() {
  return WEEK_KEY + getWeekStartLocal()
}

export default function DiscoverTab({ userId, onUnlockTab }) {
  const navigate = useNavigate()
  const [essenceDone, setEssenceDone] = useState(false)
  const [lifeMapDone, setLifeMapDone] = useState(false)
  const [domeCount, setDomeCount] = useState(0)
  const [domeRatings, setDomeRatings] = useState({})
  const [domeChecked, setDomeChecked] = useState({})
  const [unratedNodes, setUnratedNodes] = useState([])
  const [weeklyExp, setWeeklyExp] = useState(null) // localStorage: { nodeId, picked }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    // Load weekly experience from localStorage
    const stored = localStorage.getItem(getWeekKey())
    if (stored) {
      try { setWeeklyExp(JSON.parse(stored)) } catch {}
    }

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
    ]).then(([essenceRes, lifeMapRes, domeRes]) => {
      setEssenceDone(!!essenceRes.data?.essence_mirror_completed)
      setLifeMapDone((lifeMapRes.count || 0) > 0)

      const ratings = {}
      const checked = {}
      let coreCount = 0
      ;(domeRes.data || []).forEach(r => {
        if (r.ns_state) ratings[r.node_id] = r.ns_state
        checked[r.node_id] = true
        if (isCoreNode(r.node_id)) coreCount++
      })
      setDomeRatings(ratings)
      setDomeChecked(checked)
      setDomeCount(coreCount)

      // Build list of unrated nodes for "experience to try" picker
      // We'd need the full dome config to know ALL nodes, but for now
      // show nodes that have been checked but not rated with NS state
      const unrated = (domeRes.data || []).filter(r => !r.ns_state).map(r => r.node_id)
      setUnratedNodes(unrated)

      setLoading(false)
    }).catch(err => {
      console.error('DiscoverTab load error:', err)
      setLoading(false)
    })
  }, [userId])

  const pickExperience = (nodeId) => {
    const data = { nodeId, picked: true }
    localStorage.setItem(getWeekKey(), JSON.stringify(data))
    setWeeklyExp(data)
    hapticLight()
  }

  if (loading) return <div className="dt-loading">Loading...</div>

  return (
    <div className="discover-tab">
      {/* Experience to try this week — top of tab, same pattern as WeeklyFocus */}
      {domeCount > 0 && (
        <div className="dt-weekly-card">
          <div className="dt-weekly-header">
            <span className="dt-weekly-label">Experience to try this week</span>
            {weeklyExp && (
              <button className="dt-weekly-change" onClick={() => { setWeeklyExp(null); localStorage.removeItem(getWeekKey()) }}>
                Change
              </button>
            )}
          </div>
          {weeklyExp ? (
            <div className="dt-weekly-focus">
              <div className="dt-weekly-focus-text">{weeklyExp.nodeId.replace(/_/g, ' ')}</div>
              <button className="dt-weekly-done" onClick={() => navigate('/experience-game')}>
                Rate it
              </button>
            </div>
          ) : (
            <>
              <p className="dt-weekly-hint">Pick something you haven't tried yet.</p>
              <button className="dt-weekly-cta" onClick={() => navigate('/experience-game')}>
                Browse experiences →
              </button>
            </>
          )}
        </div>
      )}

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

      {/* Weekly experience section moved to top of tab */}

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
