/**
 * ProgressTab.jsx — "How far have I come?" reporting tab
 *
 * Shows: Hero journey stage (with movie refs + next step),
 * Zone Matrix (X/Y graph), stats, expansion dimensions.
 * Skills collected in background but hidden from UI.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { LIFE_FUEL_CHANNELS, calculateLifeFuel } from '../data/channelMapping'
import './ProgressTab.css'

// Hero stage names (Campbell) + movie refs + next step guidance
// Triggers: see docs/features/experience-dome-full-system-reference.md
const HERO_STAGES = [
  { stage: 0, name: 'Call to Adventure', refs: ['Ariel seeing the surface world for the first time.', 'Peter Parker getting bitten by the spider.', 'Neo seeing the Matrix for the first time.'], nextTitle: 'Explore the Experience Dome', nextHow: 'Go to the Discover tab and tap "Experience Dome". Tick experiences that light you up.', route: '/7-day-challenge' },
  { stage: 1, name: 'Call to Adventure', refs: ['Ariel seeing the surface world for the first time.', 'Peter Parker getting bitten by the spider.', 'Neo seeing the Matrix for the first time.'], nextTitle: 'Explore the Experience Dome', nextHow: 'Go to the Discover tab and tap "Experience Dome". Tick experiences that light you up.', route: '/7-day-challenge' },
  { stage: 2, name: 'Call to Adventure', refs: ['Ariel seeing the surface world for the first time.', 'Peter Parker getting bitten by the spider.', 'Neo seeing the Matrix for the first time.'], nextTitle: 'Tick 10 experiences in the Dome', nextHow: 'Open the Experience Dome on the Discover tab. Rate how each experience makes you feel.', route: '/7-day-challenge' },
  { stage: 3, name: 'Refusal of the Call', refs: ['Simba running away to the jungle.', 'Miles Morales saying "I can\'t do this."', 'Frodo saying "I wish the ring had never come to me."'], nextTitle: 'Complete the Essence Mirror', nextHow: 'On the Discover tab, tap "Essence Mirror". Swipe through 12 cards, pick what resonates, and meet your archetype.', route: '/essence-mirror' },
  { stage: 4, name: 'Meeting the Mentor', refs: ['Aladdin meeting the Genie.', 'Tony Stark building the first suit in the cave.', 'Luke meeting Yoda on Dagobah.'], nextTitle: 'Choose your life paths', nextHow: 'Tap "Ready to go deeper?" on the Discover tab. Pick experiences you want to pursue and they become quests.', route: '/choose-quests' },
  { stage: 5, name: 'Crossing the Threshold', refs: ['Jasmine and Aladdin on the magic carpet for the first time.', 'Spider-Man\'s first swing through New York.', 'Neo dodging bullets for the first time.'], nextTitle: 'Complete 5 courage challenges', nextHow: 'On the Quests tab, open a quest card. Tap the checkbox on any courage challenge (⚡), do the brave thing, then check it off.', route: '/7-day-challenge' },
  { stage: 6, name: 'Tests, Allies, Enemies', refs: ['Mulan training with the army.', 'The Avengers learning to fight together.', 'Rocky running up the stairs.'], nextTitle: 'Start your first healing flow', nextHow: 'On the Quests tab, tap the ⚡ icon on any undone courage challenge. Walk through all 7 steps to understand what\'s really blocking you.', route: '/7-day-challenge' },
  { stage: 7, name: 'Approach to the Inmost Cave', refs: ['Simba returning to the Pride Lands to face Scar.', 'Doctor Strange facing Dormammu.', 'Luke entering the cave on Dagobah.'], nextTitle: 'Complete 3 healing flows', nextHow: 'After completing a courage challenge, tap "Dive deeper" to explore why the protective voice you identified exists. Complete all 7 steps, then answer "Did the positive outcome happen?"', route: '/7-day-challenge' },
  { stage: 8, name: 'The Ordeal', refs: ['Mufasa\'s death breaking Simba open.', 'Tony Stark snapping the Infinity Gauntlet.', 'Neo dying and coming back as The One.'], nextTitle: 'Start the Scale Portal', nextHow: 'You\'ve done the deep work. Go to the Scale Portal and start the "Blow Up Your Brand" flow or take the Scale Score diagnostic.', route: '/create' },
  { stage: 9, name: 'Reward', refs: ['Simba taking his place on Pride Rock.', 'Thor finally becoming worthy.', 'Frodo holding the ring at Mount Doom.'], nextTitle: 'Build your offer', nextHow: 'You\'re starting to monetise. Use the Scale Portal to build your offer and find your first customers.', route: '/create' },
  { stage: 10, name: 'The Road Back', refs: ['Woody choosing to leave Andy.', 'Spider-Man returning to Queens.', 'Bilbo writing his book.'], nextTitle: 'Grow consistent income', nextHow: 'Revenue is starting to flow. Keep showing up, refining your offer, and serving your people.' },
  { stage: 11, name: 'Resurrection', refs: ['Simba defeating Scar.', 'Tony Stark saying "I am Iron Man."', 'Neo stopping bullets with his hand.'], nextTitle: 'Cover your living expenses', nextHow: 'Your new life design sustains you. The old career is optional now.' },
  { stage: 12, name: 'Return with the Elixir', refs: ['Simba standing on Pride Rock as king.', 'The Avengers saving the universe.', 'Frodo sailing to the Undying Lands.'], nextTitle: 'You\'re free', nextHow: 'Earning from play, choosing where you live, working with who you want.' },
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
  const navigate = useNavigate()
  const [heroStage, setHeroStage] = useState(0)
  const [matrixData, setMatrixData] = useState(null)
  const [dimensionCounts, setDimensionCounts] = useState({})
  const [totalCourage, setTotalCourage] = useState(0)
  const [totalRP, setTotalRP] = useState(0)
  const [lifeFuel, setLifeFuel] = useState(null)
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

    // Life Fuel — parse from quest_completions reflection_text
    supabase.from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .not('reflection_text', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!mounted || !data) return
        const entries = data.map(row => {
          try {
            const parsed = JSON.parse(row.reflection_text)
            return parsed?.life_fuel || null
          } catch { return null }
        }).filter(Boolean)
        if (entries.length > 0) setLifeFuel(calculateLifeFuel(entries))
      }).catch(() => {})

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
        {stageInfo.nextTitle && (
          <div
            className={`pt-hero-next ${stageInfo.route ? 'pt-hero-next-tappable' : ''}`}
            onClick={() => stageInfo.route && navigate(stageInfo.route)}
          >
            <span className="pt-hero-next-label">Next step</span>
            <span className="pt-hero-next-title">{stageInfo.nextTitle}</span>
            <span className="pt-hero-next-how">{stageInfo.nextHow}</span>
            {stageInfo.route && <span className="pt-hero-next-arrow">Go ›</span>}
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

      {/* Life Fuel Diamond */}
      {lifeFuel && (
        <div className="pt-section">
          <div className="pt-section-title">Life Fuel</div>
          <div className="pt-fuel-diamond">
            <svg viewBox="0 0 200 200" className="pt-fuel-svg">
              {/* Grid lines */}
              {[25, 50, 75, 100].map(pct => {
                const s = pct / 100
                return (
                  <polygon key={pct}
                    points={`100,${100 - 80 * s} ${100 + 80 * s},100 100,${100 + 80 * s} ${100 - 80 * s},100`}
                    fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1"
                  />
                )
              })}
              {/* Axis lines */}
              <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              {/* Data shape */}
              <polygon
                points={`100,${100 - (lifeFuel.mastery / 100) * 80} ${100 + (lifeFuel.meaning / 100) * 80},100 100,${100 + (lifeFuel.connection / 100) * 80} ${100 - (lifeFuel.choice / 100) * 80},100`}
                fill="url(#fuelGradient)" fillOpacity="0.2"
                stroke="url(#fuelGradient)" strokeWidth="2"
              />
              {/* Dots at data points */}
              <circle cx="100" cy={100 - (lifeFuel.mastery / 100) * 80} r="4" fill={LIFE_FUEL_CHANNELS.mastery.color} />
              <circle cx={100 + (lifeFuel.meaning / 100) * 80} cy="100" r="4" fill={LIFE_FUEL_CHANNELS.meaning.color} />
              <circle cx="100" cy={100 + (lifeFuel.connection / 100) * 80} r="4" fill={LIFE_FUEL_CHANNELS.connection.color} />
              <circle cx={100 - (lifeFuel.choice / 100) * 80} cy="100" r="4" fill={LIFE_FUEL_CHANNELS.choice.color} />
              <defs>
                <linearGradient id="fuelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5e17eb" />
                  <stop offset="100%" stopColor="#E9A23B" />
                </linearGradient>
              </defs>
            </svg>
            {/* Labels */}
            <div className="pt-fuel-label pt-fuel-top">{LIFE_FUEL_CHANNELS.mastery.emoji} Mastery <span>{lifeFuel.mastery}%</span></div>
            <div className="pt-fuel-label pt-fuel-right">{LIFE_FUEL_CHANNELS.meaning.emoji} Meaning <span>{lifeFuel.meaning}%</span></div>
            <div className="pt-fuel-label pt-fuel-bottom">{LIFE_FUEL_CHANNELS.connection.emoji} Connection <span>{lifeFuel.connection}%</span></div>
            <div className="pt-fuel-label pt-fuel-left">{LIFE_FUEL_CHANNELS.choice.emoji} Choice <span>{lifeFuel.choice}%</span></div>
          </div>
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
