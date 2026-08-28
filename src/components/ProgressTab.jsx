/**
 * ProgressTab.jsx — "How far have I come?" reporting tab
 *
 * Shows: Hero journey stage, Zone Matrix, Capacity Score, streak,
 * skill XP summary, expansion dimensions breakdown.
 *
 * Start as a dumping ground for all reporting, refine later.
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import SweetSpotGraph from './level/SweetSpotGraph'
import CapacityCard from './level/CapacityCard'
import './ProgressTab.css'

// Hero stage names (Campbell)
const HERO_STAGES = [
  { stage: 0, name: 'Ordinary World' },
  { stage: 1, name: 'Ordinary World' },
  { stage: 2, name: 'Call to Adventure' },
  { stage: 3, name: 'Refusal of the Call' },
  { stage: 4, name: 'Meeting the Mentor' },
  { stage: 5, name: 'Crossing the Threshold' },
  { stage: 6, name: 'Tests, Allies, Enemies' },
  { stage: 7, name: 'Approach to the Inmost Cave' },
  { stage: 8, name: 'The Ordeal' },
  { stage: 9, name: 'Reward' },
  { stage: 10, name: 'The Road Back' },
  { stage: 11, name: 'Resurrection' },
  { stage: 12, name: 'Return with the Elixir' },
]

const DIMENSION_META = {
  duration: { label: 'Duration', icon: '⏱' },
  frequency: { label: 'Frequency', icon: '🔁' },
  medium: { label: 'Medium', icon: '📡' },
  people: { label: 'People', icon: '👥' },
  money: { label: 'Money', icon: '💰' },
  location: { label: 'Location', icon: '📍' },
  independence: { label: 'Independence', icon: '🚀' },
}

export default function ProgressTab({ userId }) {
  const [heroStage, setHeroStage] = useState(0)
  const [matrixData, setMatrixData] = useState(null)
  const [skills, setSkills] = useState([])
  const [dimensionCounts, setDimensionCounts] = useState({})
  const [streak, setStreak] = useState(0)
  const [totalCourage, setTotalCourage] = useState(0)
  const [totalRP, setTotalRP] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    Promise.all([
      // Hero stage
      supabase.from('user_stage_progress')
        .select('current_journey_level')
        .eq('user_id', userId).maybeSingle(),
      // Skills
      supabase.from('user_skill_progress')
        .select('skill_id, xp, level')
        .eq('user_id', userId),
      // Courage count
      supabase.from('groan_challenges')
        .select('id, expansion_dimensions', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      // Lifetime RP
      supabase.from('user_lifetime_scores')
        .select('lifetime_total_score')
        .eq('user_id', userId)
        .is('project_id', null)
        .maybeSingle(),
    ]).then(([stageRes, skillsRes, courageRes, rpRes]) => {
      setHeroStage(stageRes.data?.current_journey_level || 0)
      setSkills(skillsRes.data || [])
      setTotalCourage(courageRes.count || 0)
      setTotalRP(rpRes.data?.lifetime_total_score || 0)

      // Count dimension usage across completed challenges
      const dims = {}
      ;(courageRes.data || []).forEach(c => {
        ;(c.expansion_dimensions || []).forEach(d => {
          dims[d] = (dims[d] || 0) + 1
        })
      })
      setDimensionCounts(dims)
      setLoading(false)
    }).catch(err => {
      console.error('ProgressTab load error:', err)
      setLoading(false)
    })

    // Zone Matrix (Action Score + Clarity)
    let mounted = true
    import('../lib/scoreUtilities').then(async (m) => {
      const [actionResult, clarityPct] = await Promise.all([
        m.calculateActionScore(userId),
        m.calculateClarityScore(userId),
      ])
      if (!mounted) return
      const zone = m.getZone(actionResult.score, clarityPct)
      setMatrixData({ actionScore: actionResult.score, clarityPct, zone, total: actionResult.total, aligned: actionResult.aligned })
    }).catch(err => console.warn('Matrix load error:', err))

    return () => { mounted = false }
  }, [userId])

  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]
  const totalDimUsage = Object.values(dimensionCounts).reduce((s, c) => s + c, 0)

  if (loading) return <div className="pt-loading">Loading...</div>

  return (
    <div className="progress-tab">
      {/* Hero Journey Stage */}
      <div className="pt-hero-card">
        <div className="pt-hero-stage">Stage {heroStage}</div>
        <div className="pt-hero-name">{stageInfo.name}</div>
        <div className="pt-hero-bar">
          <div className="pt-hero-fill" style={{ width: `${Math.min((heroStage / 12) * 100, 100)}%` }} />
        </div>
        <div className="pt-hero-endpoints">
          <span>The Crack</span>
          <span>Self-Actualisation</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="pt-stats-row">
        <div className="pt-stat">
          <div className="pt-stat-num">{totalCourage}</div>
          <div className="pt-stat-label">Courage</div>
        </div>
        <div className="pt-stat">
          <div className="pt-stat-num">{totalRP.toLocaleString()}</div>
          <div className="pt-stat-label">RP</div>
        </div>
        <div className="pt-stat">
          <div className="pt-stat-num">{skills.filter(s => s.level > 0).length}</div>
          <div className="pt-stat-label">Skills</div>
        </div>
      </div>

      {/* Zone Matrix */}
      {matrixData && (
        <div className="pt-section">
          <div className="pt-section-title">Zone Matrix</div>
          <div className="pt-matrix-scores">
            <span>Clarity: {matrixData.clarityPct}%</span>
            <span>Action: {matrixData.actionScore}%</span>
            <span className="pt-zone-badge">{matrixData.zone}</span>
          </div>
        </div>
      )}

      {/* Capacity Score */}
      <CapacityCard userId={userId} />

      {/* Expansion Dimensions */}
      {totalDimUsage > 0 && (
        <div className="pt-section">
          <div className="pt-section-title">What you've been stretching</div>
          <div className="pt-dim-grid">
            {Object.entries(DIMENSION_META).map(([id, meta]) => {
              const count = dimensionCounts[id] || 0
              return (
                <div key={id} className={`pt-dim-item ${count > 0 ? 'active' : ''}`}>
                  <span className="pt-dim-icon">{meta.icon}</span>
                  <span className="pt-dim-label">{meta.label}</span>
                  <span className="pt-dim-count">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="pt-section">
          <div className="pt-section-title">Skills</div>
          <div className="pt-skills-grid">
            {skills.filter(s => s.xp > 0).sort((a, b) => b.xp - a.xp).map(s => (
              <div key={s.skill_id} className="pt-skill-item">
                <span className="pt-skill-name">{s.skill_id}</span>
                <span className="pt-skill-level">L{s.level}</span>
                <span className="pt-skill-xp">{s.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
