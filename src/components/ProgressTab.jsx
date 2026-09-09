/**
 * ProgressTab.jsx — Narrative redesign
 *
 * Three-section story: WHERE YOU ARE → THE EVIDENCE → THE JOURNEY
 * Progressive disclosure based on data availability.
 * Connective tissue bridges between every section.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import PerQuestRadar from './PerQuestRadar'
import HealingFlowModal from './HealingFlowModal'
import { getVoiceDisplay, buildPatternMessage } from '../lib/voicePatternDetector'
import { getDimensionById, getNumericTier } from '../data/domeDimensions'
import { ESSENCE_ARCHETYPES } from '../data/essenceArchetypes'
import { getWeekStartLocal } from '../lib/dateUtils'
import './ProgressTab.css'

// ── Hero Stages with quadrant coordinates ──
// Path: top-left (Burnout) → bottom-right (Stuck) → top-right (Self-Actualisation)
// Stage 4 is the deepest point, stage 5 starts the climb
export const HERO_STAGES = [
  // →2: First NS check-in
  { stage: 0,  name: 'Waking Up',            x: 65,  y: 42,  desc: 'You feel something needs to change.',
    refs: ['Ariel seeing the surface world for the first time.', 'Neo seeing the Matrix for the first time.'],
    nextAction: 'Do your first check-in', nextRoute: '/7-day-challenge' },
  { stage: 1,  name: 'Waking Up',            x: 65,  y: 42,  desc: 'You feel something needs to change.',
    refs: ['Ariel seeing the surface world for the first time.', 'Neo seeing the Matrix for the first time.'],
    nextAction: 'Do your first check-in', nextRoute: '/7-day-challenge' },
  // 2→3: 10+ experience dome ticks
  { stage: 2,  name: 'Exploring',             x: 95,  y: 72,  desc: 'You\'re looking at what lights you up.',
    refs: ['Peter Parker getting bitten by the spider.', 'Neo taking the red pill.'],
    nextAction: 'Play the Experience Game', nextRoute: '/experience-game' },
  // 3→4: Essence Mirror + avatar
  { stage: 3,  name: 'Discovering Yourself',   x: 135, y: 115, desc: 'You\'re learning who you really are.',
    refs: ['Simba running away to the jungle.', 'Miles Morales saying "I can\'t do this."'],
    nextAction: 'Discover your essence', nextRoute: '/essence-mirror' },
  // 4→5: 1+ quest created
  { stage: 4,  name: 'Choosing a Direction',   x: 185, y: 210, desc: 'You can see the path, but haven\'t stepped on it.',
    refs: ['Aladdin meeting the Genie.', 'Luke meeting Yoda on Dagobah.'],
    nextAction: 'Choose your paths', nextRoute: '/choose-quests' },
  // 5→6: 5+ courage challenges completed
  { stage: 5,  name: 'Finding Your Way',       x: 215, y: 200, desc: 'You start building what matters to you.',
    refs: ['Spider-Man\'s first swing through New York.', 'Neo dodging bullets for the first time.'],
    nextAction: 'Complete 5 courage challenges', nextRoute: '/7-day-challenge' },
  // 6→7: First healing flow started
  { stage: 6,  name: 'Facing Resistance',      x: 240, y: 180, desc: 'The voices that held you back show up.',
    refs: ['Mulan training with the army.', 'Rocky running up the stairs.'],
    nextAction: 'Explore a protective voice', nextRoute: '/7-day-challenge' },
  // 7→8: 3+ healing outcomes + 20+ courage completed
  { stage: 7,  name: 'Going Deeper',           x: 260, y: 165, desc: 'You\'re working through what\'s underneath.',
    refs: ['Simba returning to the Pride Lands.', 'Luke entering the cave on Dagobah.'],
    nextAction: 'Complete 3 healing flows and 20 challenges', nextRoute: '/7-day-challenge' },
  // 8→9: First income > 0
  { stage: 8,  name: 'The Breakthrough',        x: 280, y: 130, desc: 'Something clicks. You feel different.',
    refs: ['Neo dying and coming back as The One.', 'Tony Stark snapping the Infinity Gauntlet.'],
    nextAction: 'Report your first income', nextRoute: '/7-day-challenge' },
  // 9→10: 3+ months with income > 0
  { stage: 9,  name: 'First Reward',           x: 300, y: 100, desc: 'You\'re earning from what you love.',
    refs: ['Simba taking his place on Pride Rock.', 'Thor finally becoming worthy.'],
    nextAction: 'Earn income 3 months in a row', nextRoute: '/7-day-challenge' },
  // 10→11: Income >= expenses target
  { stage: 10, name: 'Building Momentum',      x: 318, y: 78,  desc: 'It\'s working and you keep going.',
    refs: ['Woody choosing to leave Andy.', 'Bilbo writing his book.'],
    nextAction: 'Cover your monthly expenses', nextRoute: '/7-day-challenge' },
  // 11→12: Self-declared (deferred)
  { stage: 11, name: 'Proving It\'s Real',     x: 335, y: 58,  desc: 'This isn\'t luck. It\'s you.',
    refs: ['Simba defeating Scar.', 'Tony Stark saying "I am Iron Man."'],
    nextAction: null, nextRoute: null },
  { stage: 12, name: 'Doing What You Love',    x: 350, y: 40,  desc: 'Your life is yours.',
    refs: ['Simba standing on Pride Rock as king.', 'Frodo sailing to the Undying Lands.'],
    nextAction: null, nextRoute: null },
]

// Build smooth bezier SVG path through points
function buildJourneyPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + (curr.x - prev.x) * 0.5
    const cpy1 = prev.y
    const cpx2 = curr.x - (curr.x - prev.x) * 0.5
    const cpy2 = curr.y
    d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
  }
  return d
}

// Stages 1-12 for path rendering (skip index 0 duplicate)
const JOURNEY_POINTS = HERO_STAGES.filter(s => s.stage >= 1)

// ── NS state mapping (internal → user-facing) ──
const NS_LABELS = {
  vibe_rise: { emoji: '🔥', label: 'Vibe Rise', key: 'vibe_rise' },
  ventral: { emoji: '🔥', label: 'Vibe Rise', key: 'vibe_rise' },
  fun: { emoji: '😊', label: 'Fun', key: 'fun' },
  pressure: { emoji: '😰', label: 'Stressful', key: 'pressure' },
  sympathetic: { emoji: '😰', label: 'Stressful', key: 'pressure' },
  growth_edge: { emoji: '😰', label: 'Stressful', key: 'pressure' },
  bored: { emoji: '😐', label: 'Bored', key: 'bored' },
  uninterested: { emoji: '😐', label: 'Bored', key: 'bored' },
  dorsal: { emoji: '😐', label: 'Bored', key: 'bored' },
}

function getNsDisplay(state) {
  return NS_LABELS[state] || { emoji: '😊', label: 'Fun', key: 'fun' }
}


// ── Smart CTA definitions ──
const SETUP_CHECKS = [
  { key: 'dome', title: 'What lights you up?', sub: 'Tick experiences you love.', route: '/experience-game', ctaText: 'Play the Experience Game', icon: '🎮' },
  { key: 'essence', title: 'Who are you really?', sub: 'Find out in 3 minutes.', route: '/essence-mirror', ctaText: 'Start the Essence Mirror', icon: '✨' },
  { key: 'paths', title: 'Choose your paths', sub: 'Turn experiences into life paths.', route: '/choose-quests', ctaText: 'Choose your paths', icon: '🗺️' },
  { key: 'current_job', title: 'Where are you now?', sub: 'Map your current work.', route: '/add-current-job', ctaText: 'Map your current work', icon: '🧭' },
]

// Checklist items for onboarding
const SETUP_CHECKLIST = [
  { key: 'dome', label: 'Play the Experience Game', sub: 'Find what lights you up' },
  { key: 'essence', label: 'Discover your essence', sub: 'Meet who you really are' },
  { key: 'paths', label: 'Choose your paths', sub: 'Pick what you want to pursue' },
  { key: 'current_job', label: 'Map your current work', sub: 'See what\'s missing' },
]

export default function ProgressTab({ userId }) {
  const navigate = useNavigate()
  const [heroStage, setHeroStage] = useState(0)
  const [matrixData, setMatrixData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStages, setShowStages] = useState(false)

  // Data availability flags
  const [hasEssence, setHasEssence] = useState(false)
  const [hasDome, setHasDome] = useState(false)
  const [hasCurrentJob, setHasCurrentJob] = useState(false)
  const [hasPaths, setHasPaths] = useState(false)

  // Essence data
  const [essenceData, setEssenceData] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)

  // Fuel data

  // Voice data
  const [voiceData, setVoiceData] = useState(null)
  const [unhealedPattern, setUnhealedPattern] = useState(null) // { voice, dimensions, count, message }
  const [showHealing, setShowHealing] = useState(false)

  // Evidence feed
  const [evidenceFeed, setEvidenceFeed] = useState([])
  const [trajectoryData, setTrajectoryData] = useState(null)

  // Income data (stage 8+)
  const [incomeData, setIncomeData] = useState(null)

  // Quest names lookup
  const [questNames, setQuestNames] = useState({})

  useEffect(() => {
    if (!userId) return
    let mounted = true

    async function loadAllData() {
      try {
        const weekStart = getWeekStartLocal()

        // Parallel batch 1: All the checks + core data
        const [
          stageRes,
          essenceRes,
          currentJobRes,
          pathRes,
          questsRes,
          groanRes,
          completionsRes,
          challengeVoicesRes,
          reviewVoicesRes,
          monthlyGroanRes,
          stageProgressRes,
        ] = await Promise.all([
          // Hero stage
          supabase.from('user_stage_progress')
            .select('current_journey_level, hero_avatar_url')
            .eq('user_id', userId).maybeSingle(),
          // Essence check
          supabase.from('lead_flow_profiles')
            .select('essence_archetype, custom_essence_name, custom_essence_fields')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1),
          // Current job check
          supabase.from('quests')
            .select('id, label, life_fuel_baseline, current_dimensions')
            .eq('user_id', userId)
            .eq('is_current_job', true)
            .limit(1),
          // Paths check (non-current-job active quests)
          supabase.from('quests')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'active')
            .neq('is_current_job', true),
          // All active quests (for name lookup)
          supabase.from('quests')
            .select('id, label')
            .eq('user_id', userId)
            .eq('status', 'active'),
          // This week's completed courage challenges
          supabase.from('groan_challenges')
            .select('id, title, dimension_values, expansion_dimensions, quest_id, completed_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .not('dimension_values', 'is', null)
            .gte('completed_at', weekStart + 'T00:00:00')
            .order('completed_at', { ascending: false }),
          // Life fuel from quest_completions
          supabase.from('quest_completions')
            .select('reflection_text')
            .eq('user_id', userId)
            .eq('quest_category', 'Groans')
            .not('reflection_text', 'is', null),
          // Voice data: from challenges
          supabase.from('groan_challenges')
            .select('predicted_voice, gap_voice, completed_at, expansion_dimensions')
            .eq('user_id', userId)
            .eq('status', 'completed'),
          // Voice data: from weekly reviews
          supabase.from('weekly_reviews')
            .select('identity_did, identity_text, created_at')
            .eq('user_id', userId)
            .eq('identity_did', true),
          // Monthly courage count (last 30 days for trajectory)
          supabase.from('groan_challenges')
            .select('id, dimension_values', { count: 'exact' })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .not('dimension_values', 'is', null)
            .gte('completed_at', new Date(Date.now() - 30 * 86400000).toISOString()),
          // Income data (for stage 8+)
          supabase.from('income_self_reports')
            .select('amount_cents, currency, source, month_year')
            .eq('user_id', userId)
            .order('month_year', { ascending: false })
            .limit(1),
        ])

        if (!mounted) return

        // Process hero stage
        setHeroStage(stageRes.data?.current_journey_level || 0)
        setAvatarUrl(stageRes.data?.hero_avatar_url || null)

        // Process essence
        const essenceProfile = essenceRes.data?.[0]
        if (essenceProfile) {
          setHasEssence(true)
          const name = essenceProfile.custom_essence_name || essenceProfile.essence_archetype
          const fields = essenceProfile.custom_essence_fields || {}
          const archetype = ESSENCE_ARCHETYPES.find(a => a.name === name || a.id === name)
          setEssenceData({
            name: name || archetype?.name,
            superpower: fields.superpower || archetype?.superpower,
            vision: fields.vision_in_action || archetype?.vision_in_action,
            image: archetype?.image,
          })
        }

        // Process dome check (from matrixData later, but also check here)
        // matrixData is loaded separately via import

        // Process current job (only counts as done if dimensions are set)
        const currentJobQuest = currentJobRes.data?.[0]
        if (currentJobQuest?.current_dimensions && Object.keys(currentJobQuest.current_dimensions).length > 0) {
          setHasCurrentJob(true)
        }

        // Process paths
        const pathsExist = (pathRes.count || 0) > 0
        setHasPaths(pathsExist)

        // Quest names lookup
        const namesMap = {}
        questsRes.data?.forEach(q => { namesMap[q.id] = q.label })
        setQuestNames(namesMap)

        // Process NS checkins for evidence feed
        const groanIds = (groanRes.data || []).map(g => g.id)
        let nsMap = {}
        if (groanIds.length > 0) {
          const { data: checkins } = await supabase.from('nervous_system_checkins')
            .select('source_challenge_id, after_state')
            .in('source_challenge_id', groanIds)
            .not('after_state', 'is', null)
          if (checkins) {
            checkins.forEach(c => { nsMap[c.source_challenge_id] = c.after_state })
          }
        }

        // Build evidence feed
        const feed = (groanRes.data || []).map(g => {
          const nsState = nsMap[g.id]
          const nsDisplay = nsState ? getNsDisplay(nsState) : null

          // Calculate dimension growth chips
          const growthChips = []
          if (g.dimension_values) {
            Object.entries(g.dimension_values).forEach(([dimId, value]) => {
              const dim = getDimensionById(dimId)
              if (!dim) return
              let level
              if (dim.type === 'numeric') {
                level = getNumericTier(dimId, value)
              } else {
                level = value
              }
              if (level > 0) {
                growthChips.push({
                  dimId,
                  icon: dim.icon,
                  label: dim.label,
                  level,
                })
              }
            })
          }

          return {
            id: g.id,
            title: g.title,
            questId: g.quest_id,
            nsState: nsDisplay?.key || 'fun',
            nsEmoji: nsDisplay?.emoji || '😊',
            nsLabel: nsDisplay?.label || 'Fun',
            growthChips,
            completedAt: g.completed_at,
          }
        })
        setEvidenceFeed(feed)

        // Process voice data
        const voiceCounts = {}
        const voiceDims = {}
        const now = new Date()
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

        // From challenge voices (predicted_voice from creation + gap_voice from completion)
        ;(challengeVoicesRes.data || []).forEach(row => {
          const monthKey = row.completed_at ? row.completed_at.substring(0, 7) : thisMonth
          // Count each unique voice per challenge (deduplicate if same voice on both)
          const voices = new Set()
          if (row.predicted_voice) voices.add(row.predicted_voice)
          if (row.gap_voice) voices.add(row.gap_voice)
          voices.forEach(voice => {
            if (!voiceCounts[voice]) voiceCounts[voice] = {}
            voiceCounts[voice][monthKey] = (voiceCounts[voice][monthKey] || 0) + 1

            // Track co-occurring dimensions
            if (row.expansion_dimensions) {
              if (!voiceDims[voice]) voiceDims[voice] = {}
              const dims = Array.isArray(row.expansion_dimensions) ? row.expansion_dimensions : []
              dims.forEach(d => {
                voiceDims[voice][d] = (voiceDims[voice][d] || 0) + 1
              })
            }
          })
        })

        // From weekly review voices
        ;(reviewVoicesRes.data || []).forEach(row => {
          if (!row.identity_text) return
          const voice = row.identity_text.split(':')[0]?.trim()
          if (!voice) return
          const monthKey = row.created_at ? row.created_at.substring(0, 7) : thisMonth
          if (!voiceCounts[voice]) voiceCounts[voice] = {}
          voiceCounts[voice][monthKey] = (voiceCounts[voice][monthKey] || 0) + 1
        })

        // Find dominant voice
        const voiceEntries = Object.entries(voiceCounts)
        if (voiceEntries.length > 0) {
          const dominantVoice = voiceEntries.reduce((best, [voice, months]) => {
            const total = Object.values(months).reduce((s, c) => s + c, 0)
            return total > best.total ? { voice, months, total } : best
          }, { voice: null, months: {}, total: 0 })

          if (dominantVoice.voice) {
            const thisMonthCount = dominantVoice.months[thisMonth] || 0
            const lastMonthCount = dominantVoice.months[lastMonthKey] || 0
            const peakCount = Math.max(...Object.values(dominantVoice.months))

            // Find top co-occurring dimension
            const dims = voiceDims[dominantVoice.voice] || {}
            const topDim = Object.entries(dims).sort((a, b) => b[1] - a[1])[0]
            const topDimInfo = topDim ? getDimensionById(topDim[0]) : null

            setVoiceData({
              voice: dominantVoice.voice,
              thisMonth: thisMonthCount,
              lastMonth: lastMonthCount,
              peak: peakCount,
              maxDots: Math.max(thisMonthCount, lastMonthCount, 6),
              topDimension: topDimInfo?.label || null,
              isDecreasing: thisMonthCount < lastMonthCount,
              dropPercent: lastMonthCount > 0
                ? Math.round(((lastMonthCount - thisMonthCount) / lastMonthCount) * 100)
                : 0,
            })
          }
        }

        // Trajectory data
        const weekGroanCount = (groanRes.data || []).length
        const weekDims = new Set()
        ;(groanRes.data || []).forEach(g => {
          if (g.dimension_values) Object.keys(g.dimension_values).forEach(d => weekDims.add(d))
        })
        const monthGroanCount = monthlyGroanRes.count || 0
        const monthDims = new Set()
        ;(monthlyGroanRes.data || []).forEach(g => {
          if (g.dimension_values) Object.keys(g.dimension_values).forEach(d => monthDims.add(d))
        })
        setTrajectoryData({
          weekChallenges: weekGroanCount,
          weekDims: weekDims.size,
          monthChallenges: monthGroanCount,
          monthDims: monthDims.size,
        })

        // Income
        if ((stageRes.data?.current_journey_level || 0) >= 8 && stageProgressRes.data?.[0]) {
          const inc = stageProgressRes.data[0]
          setIncomeData({
            amount: inc.amount_cents / 100,
            currency: inc.currency || 'USD',
            source: inc.source,
            monthYear: inc.month_year,
          })
        }

        // Check for unhealed voice patterns (shown but not explored)
        const { data: shownPatterns } = await supabase
          .from('voice_pattern_prompts')
          .select('voice, primary_dimensions, challenge_count, healing_started')
          .eq('user_id', userId)
          .order('shown_at', { ascending: false })
          .limit(1)

        if (shownPatterns?.[0] && !shownPatterns[0].healing_started) {
          const p = shownPatterns[0]
          const display = getVoiceDisplay(p.voice)
          setUnhealedPattern({
            voice: p.voice,
            dimensions: p.primary_dimensions || [],
            count: p.challenge_count || 3,
            message: buildPatternMessage(p.voice, p.primary_dimensions || []),
            icon: display.icon,
            name: display.name,
          })
        }

      } catch (err) {
        console.error('ProgressTab load error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAllData()

    // Zone Matrix (loaded via dynamic import as before)
    import('../lib/scoreUtilities').then(async (m) => {
      const result = await m.calculateZoneMatrix(userId)
      if (!mounted) return
      setMatrixData(result)
      setHasDome(result.hasDome)
    }).catch(err => console.warn('Matrix load error:', err))

    return () => { mounted = false }
  }, [userId])

  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]

  // Setup completion map
  const setupComplete = useMemo(() => ({
    dome: hasDome,
    essence: hasEssence,
    current_job: hasCurrentJob,
    paths: hasPaths,
  }), [hasDome, hasEssence, hasCurrentJob, hasPaths])

  // Are all 4 setup steps done?
  const allSetupDone = setupComplete.dome && setupComplete.essence && setupComplete.current_job && setupComplete.paths

  // Smart CTA: first missing item
  const nextCta = useMemo(() => {
    for (const check of SETUP_CHECKS) {
      if (!setupComplete[check.key]) return check
    }
    return null // All done
  }, [setupComplete])

  // Fuel feedback state (A-D)
  // Voice bridge text
  const voiceBridge = useMemo(() => {
    if (!voiceData) return null
    if (voiceData.dropPercent >= 50) return 'your Ghost is getting quieter.'
    if (voiceData.isDecreasing) return 'what\'s still getting in the way?'
    return 'what\'s getting in the way?'
  }, [voiceData])

  if (loading) return <div className="pt-loading">Loading...</div>

  return (
    <div className="progress-tab">

      {/* ═══ HERO CARD ═══ */}
      <div className="pt-hero">
        <div className="pt-stage-row">
          <div className="pt-stage-label">Stage {heroStage} of 12</div>
          <button className="pt-stages-toggle" onClick={() => setShowStages(!showStages)}>
            {showStages ? 'Hide map' : 'See your journey'} {showStages ? '▴' : '▾'}
          </button>
        </div>
        <div className="pt-stage-name">{stageInfo.name}</div>

        <div className="pt-journey-bar">
          <div className="pt-journey-fill" style={{ width: `${Math.max(Math.min((heroStage / 12) * 100, 100), 4)}%` }} />
        </div>
        <div className="pt-journey-endpoints">
          <span>The Crack</span>
          <span>Doing What You Love</span>
        </div>

        {stageInfo.desc && (
          <div className="pt-stage-desc">{stageInfo.desc}</div>
        )}

        {/* Think refs */}
        {stageInfo.refs && (
          <div className="pt-think">
            <div className="pt-think-label">Think:</div>
            {stageInfo.refs.map((ref, i) => (
              <div key={i} className="pt-think-ref">{ref}</div>
            ))}
          </div>
        )}

        {/* Next action CTA */}
        {stageInfo.nextAction && (
          <button className="pt-next-action" onClick={() => navigate(stageInfo.nextRoute)}>
            Next step: {stageInfo.nextAction} <span>→</span>
          </button>
        )}

        {/* ═══ Expandable Journey Quadrant Map ═══ */}
        {showStages && (
          <div className="pt-journey-expand">
            <div className="pt-journey-map">
              <svg viewBox="0 0 380 300" className="pt-journey-svg">
                <defs>
                  <radialGradient id="ptBurnoutGlow" cx="12%" cy="12%" r="40%">
                    <stop offset="0%" stopColor="rgba(239,68,68,0.08)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <radialGradient id="ptStuckGlow" cx="82%" cy="85%" r="35%">
                    <stop offset="0%" stopColor="rgba(147,130,220,0.06)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <radialGradient id="ptDestGlow" cx="88%" cy="12%" r="40%">
                    <stop offset="0%" stopColor="rgba(233,162,59,0.10)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <linearGradient id="ptPathDone" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <stop offset="100%" stopColor="#E9A23B" />
                  </linearGradient>
                  <linearGradient id="ptLifeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                    <stop offset="100%" stopColor="rgba(239,68,68,0.2)" />
                  </linearGradient>
                  <filter id="ptGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Zone glows */}
                <rect x="0" y="0" width="380" height="300" fill="url(#ptBurnoutGlow)" />
                <rect x="0" y="0" width="380" height="300" fill="url(#ptStuckGlow)" />
                <rect x="0" y="0" width="380" height="300" fill="url(#ptDestGlow)" />

                {/* Axis labels */}
                <text x="200" y="294" textAnchor="middle" fontSize="7" fontWeight="700"
                  fill="rgba(255,255,255,0.15)" letterSpacing="1.5">KNOWING YOURSELF →</text>
                <text x="8" y="150" textAnchor="middle" fontSize="7" fontWeight="700"
                  fill="rgba(255,255,255,0.15)" letterSpacing="1.5"
                  transform="rotate(-90, 8, 150)">TAKING ACTION →</text>

                {/* Life so far */}
                <path
                  d="M 55 265 C 50 220, 48 160, 52 110 C 56 75, 60 55, 65 42"
                  fill="none" stroke="url(#ptLifeGrad)" strokeWidth="2.5"
                  strokeLinecap="round" strokeDasharray="4 6"
                />
                <circle cx="55" cy="265" r="3" fill="rgba(255,255,255,0.10)" />
                <circle cx="53" cy="230" r="2" fill="rgba(255,255,255,0.07)" />
                <circle cx="51" cy="195" r="2" fill="rgba(255,255,255,0.07)" />
                <circle cx="50" cy="160" r="2" fill="rgba(255,255,255,0.07)" />
                <circle cx="51" cy="125" r="2" fill="rgba(255,255,255,0.08)" />
                <circle cx="55" cy="90" r="2.5" fill="rgba(239,68,68,0.18)" />
                <circle cx="60" cy="60" r="2.5" fill="rgba(239,68,68,0.22)" />
                <polygon points="65,42 60,50 70,50" fill="rgba(239,68,68,0.22)" />
                <text x="30" y="170" fontSize="8" fontWeight="700" fill="rgba(255,255,255,0.13)"
                  transform="rotate(-85, 30, 170)" textAnchor="middle">YOUR LIFE SO FAR</text>

                {/* Full path (faint dashed) */}
                <path d={buildJourneyPath(JOURNEY_POINTS)} fill="none"
                  stroke="rgba(255,255,255,0.06)" strokeWidth="3"
                  strokeLinecap="round" strokeDasharray="6 8" />

                {/* Active path (gold) */}
                <path d={buildJourneyPath(JOURNEY_POINTS.filter(s => s.stage <= heroStage))}
                  fill="none" stroke="url(#ptPathDone)" strokeWidth="3.5" strokeLinecap="round" />

                {/* Stage dots */}
                {JOURNEY_POINTS.map(s => {
                  const done = s.stage < heroStage
                  const current = s.stage === heroStage
                  const showNum = done || current || s.stage <= heroStage + 2
                  return (
                    <g key={s.stage}>
                      {current && (
                        <circle cx={s.x} cy={s.y} r="14" fill="none"
                          stroke="rgba(233,162,59,0.2)" strokeWidth="2">
                          <animate attributeName="r" values="14;18;14" dur="2.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0.2;1" dur="2.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={s.x} cy={s.y}
                        r={current ? 7 : done ? 4.5 : 3.5}
                        fill={done ? '#E9A23B' : current ? '#E9A23B' : 'rgba(255,255,255,0.12)'}
                        opacity={done ? 0.7 : 1}
                        filter={current ? 'url(#ptGlow)' : undefined}
                      />
                      {showNum && (
                        <text x={s.x} y={s.y - (current ? 16 : 11)}
                          textAnchor="middle" fontSize={current ? 10 : 8} fontWeight="700"
                          fill={current ? '#E9A23B' : done ? 'rgba(233,162,59,0.45)' : 'rgba(255,255,255,0.12)'}>
                          {s.stage}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>

              {/* Zone figures */}
              <div className="pt-zone-fig pt-zone-start">
                <span className="pt-zone-emoji">🌱</span>
                <div className="pt-zone-label">Starting Out</div>
              </div>
              <div className="pt-zone-fig pt-zone-burnout">
                <span className="pt-zone-emoji">🏃‍♂️</span>
                <div className="pt-zone-label">Burnout</div>
                <div className="pt-zone-sub">Busy but lost</div>
              </div>
              <div className="pt-zone-fig pt-zone-stuck">
                <span className="pt-zone-emoji">🤔</span>
                <div className="pt-zone-label">Stuck</div>
                <div className="pt-zone-sub">Aware but can't start</div>
              </div>
              <div className="pt-zone-fig pt-zone-dest">
                <span className="pt-zone-emoji">🎉</span>
                <div className="pt-zone-label">Doing What<br/>You Love</div>
              </div>
            </div>

            <div className="pt-journey-legend">
              <span className="pt-legend-item"><span className="pt-legend-dot pt-legend-life" /> Life so far</span>
              <span className="pt-legend-item"><span className="pt-legend-dot pt-legend-done" /> Done</span>
              <span className="pt-legend-item"><span className="pt-legend-dot pt-legend-now" /> You</span>
              <span className="pt-legend-item"><span className="pt-legend-dot pt-legend-next" /> Next</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ ESSENCE CARD ═══ */}
      {hasEssence && essenceData && (
        <>
          <div className="pt-bridge"><span className="pt-bridge-text">you are...</span></div>
          <div className="pt-essence-card">
            <img
              className="pt-essence-avatar"
              src={avatarUrl || essenceData.image || '/images/essence/radiant-rebel.png'}
              alt={essenceData.name || 'Your essence'}
            />
            <div className="pt-essence-name">The {essenceData.name}</div>
            {essenceData.superpower && (
              <div className="pt-essence-superpower">"{essenceData.superpower}"</div>
            )}
            {essenceData.vision && (
              <div className="pt-essence-vision">{essenceData.vision}</div>
            )}
          </div>
        </>
      )}

      {/* ═══ VOICE SECTION ═══ */}
      {voiceData && (
        <>
          <div className="pt-bridge"><span className="pt-bridge-text">{voiceBridge}</span></div>
          <div className="pt-voice-card">
            <div className="pt-voice-icon">👻</div>
            <div className="pt-voice-content">
              <div className="pt-voice-name">Your Ghost</div>
              <div className="pt-voice-stat">
                {voiceData.thisMonth === 0
                  ? <>Hasn't shown up this month.</>
                  : voiceData.thisMonth === 1
                    ? <>Only showed up <strong>once</strong> this month.</>
                    : <>Shows up most when <strong>{voiceData.topDimension || 'pushing your comfort zone'}</strong> is involved.</>
                }
              </div>
              <div className="pt-voice-dots">
                <div className="pt-voice-dots-row">
                  <span className="pt-voice-dots-label">Last month</span>
                  {Array.from({ length: voiceData.maxDots }).map((_, i) => (
                    <span key={i} className={`pt-voice-dot ${i < voiceData.lastMonth ? 'filled' : 'empty'}`} />
                  ))}
                </div>
                <div className="pt-voice-dots-row">
                  <span className="pt-voice-dots-label">This month</span>
                  {Array.from({ length: voiceData.maxDots }).map((_, i) => (
                    <span key={i} className={`pt-voice-dot ${i < voiceData.thisMonth ? 'filled' : 'empty'}`} />
                  ))}
                </div>
              </div>
              {voiceData.isDecreasing && (
                <div className="pt-voice-trend">
                  {voiceData.dropPercent >= 50
                    ? `Down ${voiceData.dropPercent}% ↓`
                    : 'It\'s getting quieter ↓'
                  }
                </div>
              )}
              {!voiceData.isDecreasing && voiceData.thisMonth > 0 && (
                <div className="pt-voice-trend up">Still showing up</div>
              )}

              {/* Unhealed pattern CTA */}
              {unhealedPattern && (
                <button
                  className="pt-voice-explore"
                  onClick={async () => {
                    setShowHealing(true)
                    // Mark as started so CTA doesn't persist
                    await supabase.from('voice_pattern_prompts')
                      .update({ healing_started: true })
                      .eq('user_id', userId)
                      .eq('voice', unhealedPattern.voice)
                  }}
                >
                  {unhealedPattern.icon} Explore why {unhealedPattern.name} keeps showing up →
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Healing modal for pattern exploration */}
      {showHealing && unhealedPattern && (
        <HealingFlowModal
          taskText={`Pattern: ${unhealedPattern.name} on ${unhealedPattern.dimensions.join(', ')}`}
          userId={userId}
          questTaskId={null}
          existingData={{ pattern: unhealedPattern.voice }}
          onComplete={() => setShowHealing(false)}
          onClose={() => setShowHealing(false)}
        />
      )}

      {/* ═══ EVIDENCE SECTION ═══ */}
      {allSetupDone && (
        <>
          <div className="pt-bridge">
            <span className="pt-bridge-text">
              {evidenceFeed.length > 0 ? 'but this week you fought back.' : 'this week...'}
            </span>
          </div>

          {evidenceFeed.length > 0 ? (
            <>
              <div className="pt-section-header">
                <div className="pt-section-icon">⚡</div>
                <div className="pt-section-label">This Week</div>
                <div className="pt-section-meta">{evidenceFeed.length} challenge{evidenceFeed.length !== 1 ? 's' : ''}</div>
              </div>

              {evidenceFeed.map(item => (
                <div key={item.id} className="pt-evidence-card" data-state={item.nsState}>
                  {item.questId && questNames[item.questId] && (
                    <div className="pt-evidence-quest">{questNames[item.questId]}</div>
                  )}
                  <div className="pt-evidence-title">{item.title}</div>
                  <div className="pt-evidence-chips">
                    {item.growthChips.map(chip => (
                      <span key={chip.dimId} className="pt-chip-growth">
                        {chip.icon} {chip.label} <span className="pt-chip-growth-arrow">→</span> {chip.level}
                      </span>
                    ))}
                    <span className="pt-chip-state" data-state={item.nsState}>
                      {item.nsEmoji} {item.nsLabel}
                    </span>
                  </div>
                </div>
              ))}

              {/* Trajectory summary */}
              {trajectoryData && (
                <div className="pt-evidence-summary">
                  Your comfort zone grew in <strong>{trajectoryData.weekDims} dimension{trajectoryData.weekDims !== 1 ? 's' : ''}</strong> this week.
                  <div className="pt-trajectory-line">
                    This week: <strong>{trajectoryData.weekChallenges} challenge{trajectoryData.weekChallenges !== 1 ? 's' : ''}, {trajectoryData.weekDims} dimension{trajectoryData.weekDims !== 1 ? 's' : ''} grew</strong>.{' '}
                    Last month: {trajectoryData.monthChallenges} challenge{trajectoryData.monthChallenges !== 1 ? 's' : ''}, {trajectoryData.monthDims} dimension{trajectoryData.monthDims !== 1 ? 's' : ''} grew.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="pt-cta-card">
              <div className="pt-cta-card-icon">⚡</div>
              <div className="pt-cta-card-title">Nothing brave yet this week</div>
              <div className="pt-cta-card-sub">Your progress shows up here when you complete a courage challenge. Each one grows your comfort zone.</div>
              <button className="pt-cta pt-cta-purple" onClick={() => navigate('/7-day-challenge')}>
                Add a courage challenge <span>→</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══ INCOME CARD (Stage 8+) ═══ */}
      {heroStage >= 8 && incomeData && essenceData && (
        <>
          <div className="pt-bridge">
            <span className="pt-bridge-text">the {essenceData.name} is earning from what they love.</span>
          </div>
          <div className="pt-income-card">
            <div className="pt-income-label">Income This Month</div>
            <div className="pt-income-amount">
              {incomeData.currency === 'USD' ? '$' : incomeData.currency === 'IDR' ? 'Rp ' : ''}{incomeData.amount.toLocaleString()}
            </div>
            {incomeData.source && (
              <div className="pt-income-source">{incomeData.source}</div>
            )}
          </div>
        </>
      )}

      {/* ═══ SMART CTA ═══ */}
      {nextCta && allSetupDone === false && (
        <>
          <div className="pt-bridge">
            <span className="pt-bridge-text">
              {!hasDome ? 'let\'s find out what lights you up.' : !hasEssence ? 'now, who are you really?' : !hasPaths ? 'ready to find your path?' : 'now let\'s see what your current life looks like.'}
            </span>
          </div>
          <div className="pt-cta-card">
            <div className="pt-cta-card-icon">{nextCta.icon}</div>
            <div className="pt-cta-card-title">{nextCta.title}</div>
            <div className="pt-cta-card-sub">{nextCta.sub}</div>
            <button className="pt-cta" onClick={() => navigate(nextCta.route)}>
              {nextCta.ctaText} <span>→</span>
            </button>
          </div>
        </>
      )}

      {/* ═══ JOURNEY SECTION ═══ */}
      {hasPaths && (
        <>
          <div className="pt-bridge"><span className="pt-bridge-text">here's how far you've come.</span></div>
          <div className="pt-section-header">
            <div className="pt-section-icon">🗺️</div>
            <div className="pt-section-label">Your Paths</div>
          </div>
          <PerQuestRadar userId={userId} />
        </>
      )}

      {/* ═══ SETUP CHECKLIST (during onboarding) ═══ */}
      {!allSetupDone && (
        <>
          <div className="pt-bridge"><span className="pt-bridge-text">your setup so far.</span></div>
          <div className="pt-checklist">
            <div className="pt-checklist-title">Your Setup</div>
            {SETUP_CHECKLIST.map((item, idx) => {
              const done = setupComplete[item.key]
              const isNext = !done && SETUP_CHECKLIST.slice(0, idx).every(prev => setupComplete[prev.key])
              const locked = !done && !isNext
              return (
                <div
                  key={item.key}
                  className="pt-check-item"
                  onClick={() => {
                    if (isNext) {
                      const cta = SETUP_CHECKS.find(c => c.key === item.key)
                      if (cta) navigate(cta.route)
                    }
                  }}
                  style={{ cursor: isNext ? 'pointer' : 'default' }}
                >
                  <div className={`pt-check-dot ${done ? 'done' : isNext ? 'next' : 'locked'}`}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div className="pt-check-text">
                    <div className={`pt-check-name ${done ? 'done' : isNext ? 'next' : 'locked'}`}>{item.label}</div>
                    {!done && <div className="pt-check-sub">{item.sub}</div>}
                  </div>
                  {isNext && <div className="pt-check-arrow">›</div>}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ═══ ALL-DONE CTA ═══ */}
      {allSetupDone && !nextCta && (
        <>
          <div className="pt-bridge"><span className="pt-bridge-text">next step</span></div>
          <button className="pt-cta" onClick={() => navigate('/7-day-challenge')}>
            Add a courage challenge <span>→</span>
          </button>
        </>
      )}

    </div>
  )
}
