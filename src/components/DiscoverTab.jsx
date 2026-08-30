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
import { hapticLight, hapticSuccess } from '../lib/haptics'
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
  const [domeCount, setDomeCount] = useState(0)
  const [domeRatings, setDomeRatings] = useState({})
  const [domeChecked, setDomeChecked] = useState({})
  const [unratedNodes, setUnratedNodes] = useState([])
  const [weeklyExp, setWeeklyExp] = useState(null) // { nodeId, nodeLabel, picked }
  const [activeDomeChallenge, setActiveDomeChallenge] = useState(null) // from groan_challenges
  const [showNsRating, setShowNsRating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [domeExpanded, setDomeExpanded] = useState(false)

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
      supabase.from('experience_dome_ratings')
        .select('node_id, ns_state')
        .eq('user_id', userId),
      supabase.from('groan_challenges')
        .select('id, title, source_value, source_label, status')
        .eq('user_id', userId)
        .eq('challenge_source', 'dome')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1),
    ]).then(([essenceRes, domeRes, domeChallRes]) => {
      // Active dome challenge
      if (domeChallRes.data?.[0]) {
        setActiveDomeChallenge(domeChallRes.data[0])
      }
      setEssenceDone(!!essenceRes.data?.essence_mirror_completed)

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

  const pickExperience = (nodeId, nodeLabel) => {
    const data = { nodeId, nodeLabel: nodeLabel || nodeId, picked: true }
    localStorage.setItem(getWeekKey(), JSON.stringify(data))
    setWeeklyExp(data)
    hapticLight()
  }

  const handleDomeComplete = async (nsState) => {
    if (!activeDomeChallenge || !userId) return
    hapticSuccess()

    const nsMap = { vibe_rise: 10, fun: 7, pressure: 10, bored: 5 }
    const rp = nsMap[nsState] || 0

    // 1. Mark challenge completed
    await supabase.from('groan_challenges')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', activeDomeChallenge.id)

    // 2. Upsert dome rating with NS state
    if (activeDomeChallenge.source_value) {
      await supabase.from('experience_dome_ratings').upsert({
        user_id: userId,
        node_id: activeDomeChallenge.source_value,
        ns_state: nsState,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,node_id' })
    }

    // 3. Insert quest completion for RP
    await supabase.from('quest_completions').insert({
      user_id: userId,
      quest_id: 'dome_challenge_' + activeDomeChallenge.id,
      quest_category: 'Groans',
      quest_type: 'Rewire',
      points_earned: rp,
      reflection_text: JSON.stringify({
        challenge_id: activeDomeChallenge.id,
        ns_state: nsState,
        source: 'dome',
      }),
    })

    // 4. Clear state
    setActiveDomeChallenge(null)
    setShowNsRating(false)
    localStorage.removeItem(getWeekKey())
    setWeeklyExp(null)

    // Update dome count
    setDomeCount(prev => prev + 1)
  }

  if (loading) return <div className="dt-loading">Loading...</div>

  return (
    <div className="discover-tab">
      {/* Experience to try this week */}
      {domeCount > 0 && (
        <div className="dt-weekly-card">
          <div className="dt-weekly-header">
            <span className="dt-weekly-label">Experience to try this week</span>
          </div>
          {(activeDomeChallenge || weeklyExp) ? (
            showNsRating ? (
              <div className="dt-weekly-ns">
                <p className="dt-weekly-ns-prompt">How did it feel?</p>
                <div className="dt-weekly-ns-buttons">
                  {[
                    { id: 'vibe_rise', label: 'Vibe Rise', color: '#E9A23B', icon: '✦' },
                    { id: 'fun', label: 'Fun', color: '#10b981', icon: '○' },
                    { id: 'pressure', label: 'Stressful', color: '#ef4444', icon: '◇' },
                    { id: 'bored', label: 'Bored', color: '#6b7280', icon: '—' },
                  ].map(ns => (
                    <button
                      key={ns.id}
                      className="dt-weekly-ns-btn"
                      style={{ borderColor: ns.color, color: ns.color }}
                      onClick={() => handleDomeComplete(ns.id)}
                    >
                      <span>{ns.icon}</span>
                      <span>{ns.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="dt-weekly-focus">
                <div className="dt-weekly-focus-text">
                  {activeDomeChallenge?.title || weeklyExp?.nodeLabel || weeklyExp?.nodeId}
                </div>
                <div className="dt-weekly-focus-branch">
                  {activeDomeChallenge?.source_label || ''}
                </div>
                <button className="dt-weekly-done" onClick={() => setShowNsRating(true)}>
                  I did it!
                </button>
              </div>
            )
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

      {/* Step 2: Experience Dome */}
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

      {/* Dome Radar (mini viz when data exists) — tap to expand */}
      {domeCount > 0 && (
        <div
          className="dt-dome-viz"
          onClick={() => setDomeExpanded(true)}
          style={{ cursor: 'pointer' }}
          role="button"
          aria-label="Tap to explore your dome"
        >
          <DomeRadar checked={domeChecked} ratings={domeRatings} size={260} showLabels={true} />
          <span className="dt-dome-tap-hint">Tap to explore</span>
        </div>
      )}

      {/* Expanded dome overlay */}
      {domeExpanded && (
        <div className="dt-dome-overlay" onClick={() => setDomeExpanded(false)}>
          <div className="dt-dome-overlay-content" onClick={e => e.stopPropagation()}>
            <DomeRadar
              checked={domeChecked}
              ratings={domeRatings}
              size={Math.min(window.innerWidth - 32, 520)}
              showLabels={true}
              interactive={true}
            />
            <button className="dt-dome-overlay-close" onClick={() => setDomeExpanded(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Weekly experience section moved to top of tab */}

      {/* Phase 1→2 Bridge CTA */}
      {domeCount > 0 && (
        <button
          className="dt-bridge-cta"
          onClick={() => {
            onUnlockTab?.('Quests')
            navigate('/choose-quests')
          }}
        >
          <div className="dt-bridge-text">
            <span className="dt-bridge-title">Ready to go deeper on a life path?</span>
            <span className="dt-bridge-sub">Turn what lights you up into quests you can pursue.</span>
          </div>
          <span className="dt-bridge-arrow">→</span>
        </button>
      )}
    </div>
  )
}
