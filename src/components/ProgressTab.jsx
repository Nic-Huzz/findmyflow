/**
 * ProgressTab.jsx — "How far have I come?" reporting tab
 *
 * Shows: Hero journey stage (with movie refs + next step),
 * Zone Matrix (X/Y graph), stats, expansion dimensions.
 * Skills collected in background but hidden from UI.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ProgressTab.css'

// Hero stage names (Campbell) + movie refs + next step guidance
const HERO_STAGES = [
  { stage: 0, name: 'Call to Adventure', refs: ['Ariel seeing the surface world for the first time.', 'Peter Parker getting bitten by the spider.', 'Neo seeing the Matrix for the first time.'], next: 'Start exploring the Discover tab to begin your journey.' },
  { stage: 1, name: 'Call to Adventure', refs: ['Ariel seeing the surface world for the first time.', 'Peter Parker getting bitten by the spider.', 'Neo seeing the Matrix for the first time.'], next: 'Start exploring the Discover tab to begin your journey.' },
  { stage: 2, name: 'Call to Adventure', refs: ['Ariel seeing the surface world for the first time.', 'Peter Parker getting bitten by the spider.', 'Neo seeing the Matrix for the first time.'], next: 'Complete the Experience Dome. Discover what lights you up.' },
  { stage: 3, name: 'Refusal of the Call', refs: ['Simba running away to the jungle.', 'Miles Morales saying "I can\'t do this."', 'Frodo saying "I wish the ring had never come to me."'], next: 'Create your hero avatar. Go to the Essence Mirror.' },
  { stage: 4, name: 'Meeting the Mentor', refs: ['Aladdin meeting the Genie.', 'Tony Stark building the first suit in the cave.', 'Luke meeting Yoda on Dagobah.'], next: 'Complete a courage challenge. Any feeling counts.' },
  { stage: 5, name: 'Crossing the Threshold', refs: ['Jasmine and Aladdin on the magic carpet for the first time.', 'Spider-Man\'s first swing through New York.', 'Neo dodging bullets for the first time.'], next: 'Focus your courage challenges on one life path. Go deeper.' },
  { stage: 6, name: 'Tests, Allies, Enemies', refs: ['Mulan training with the army.', 'The Avengers learning to fight together.', 'Rocky running up the stairs.'], next: 'After a courage challenge, tap "Feeling stuck?" to start a healing flow.' },
  { stage: 7, name: 'Approach to the Inmost Cave', refs: ['Simba returning to the Pride Lands to face Scar.', 'Doctor Strange facing Dormammu.', 'Luke entering the cave on Dagobah.'], next: 'Keep stretching your expansion dimensions. Push into the ones you avoid.' },
  { stage: 8, name: 'The Ordeal', refs: ['Mufasa\'s death breaking Simba open.', 'Tony Stark snapping the Infinity Gauntlet.', 'Neo dying and coming back as The One.'], next: 'You\'re in the deep work. Complete healing flows and keep showing up.' },
  { stage: 9, name: 'Reward', refs: ['Simba taking his place on Pride Rock.', 'Thor finally becoming worthy.', 'Frodo holding the ring at Mount Doom.'], next: 'Reflect on how far you\'ve come. Your Flow Statement is forming.' },
  { stage: 10, name: 'The Road Back', refs: ['Woody choosing to leave Andy.', 'Spider-Man returning to Queens.', 'Bilbo writing his book.'], next: 'You\'re ready to share what you\'ve learned. Consider the Scale Portal.' },
  { stage: 11, name: 'Resurrection', refs: ['Simba defeating Scar.', 'Tony Stark saying "I am Iron Man."', 'Neo stopping bullets with his hand.'], next: 'Build your offer. Who do you serve? What problem do you solve?' },
  { stage: 12, name: 'Return with the Elixir', refs: ['Simba standing on Pride Rock as king.', 'The Avengers saving the universe.', 'Frodo sailing to the Undying Lands.'], next: 'Your first graduate. Someone\'s life shifted because you showed up.' },
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
  const [dimensionCounts, setDimensionCounts] = useState({})
  const [totalCourage, setTotalCourage] = useState(0)
  const [totalRP, setTotalRP] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    Promise.all([
      supabase.from('user_stage_progress')
        .select('current_journey_level')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('groan_challenges')
        .select('id, expansion_dimensions', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase.from('user_lifetime_scores')
        .select('lifetime_total_score')
        .eq('user_id', userId)
        .is('project_id', null)
        .maybeSingle(),
    ]).then(([stageRes, courageRes, rpRes]) => {
      setHeroStage(stageRes.data?.current_journey_level || 0)
      setTotalCourage(courageRes.count || 0)
      setTotalRP(rpRes.data?.lifetime_total_score || 0)

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

    // Zone Matrix
    let mounted = true
    import('../lib/scoreUtilities').then(async (m) => {
      const result = await m.calculateZoneMatrix(userId)
      if (!mounted) return
      setMatrixData(result)
    }).catch(err => console.warn('Matrix load error:', err))

    return () => { mounted = false }
  }, [userId])

  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]
  const totalDimUsage = Object.values(dimensionCounts).reduce((s, c) => s + c, 0)

  if (loading) return <div className="pt-loading">Loading...</div>

  // Zone matrix dot position
  const dotX = matrixData ? (matrixData.hasLifePaths ? 80 : matrixData.hasLifeMap || matrixData.hasDome ? 50 : 15) : 15
  const dotY = matrixData?.hasCourageThisWeek ? 80 : 15

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
        {stageInfo.refs && (
          <div className="pt-hero-refs">
            <span className="pt-hero-refs-label">Think:</span>
            {stageInfo.refs.map((ref, i) => (
              <span key={i} className="pt-hero-ref">{ref}</span>
            ))}
          </div>
        )}
        {stageInfo.next && (
          <div className="pt-hero-next">
            <span className="pt-hero-next-label">Next step</span>
            <span className="pt-hero-next-text">{stageInfo.next}</span>
          </div>
        )}
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
      </div>

      {/* Zone Matrix — X/Y graph */}
      {matrixData && (
        <div className="pt-section">
          <div className="pt-section-title">Last 7 days</div>
          <div className="pt-matrix-grid">
            <div className="pt-matrix-label pt-matrix-y-high">Aligned action</div>
            <div className="pt-matrix-label pt-matrix-y-low">Low action</div>
            <div className="pt-matrix-label pt-matrix-x-high">High clarity</div>
            <div className="pt-matrix-quadrant pt-q-tl">Misguided Zone</div>
            <div className="pt-matrix-quadrant pt-q-tr">Self-Actualisation</div>
            <div className="pt-matrix-quadrant pt-q-bl">Unfulfilment</div>
            <div className="pt-matrix-quadrant pt-q-br">Head Full of Dreams</div>
            <div className="pt-matrix-dot" style={{ left: `${dotX}%`, bottom: `${dotY}%` }} />
          </div>
          <div className="pt-matrix-zone">{matrixData.zone}</div>
        </div>
      )}

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
    </div>
  )
}
