/**
 * CreatorHomeV2.jsx — /create
 *
 * Dark-themed Creator Portal with 3 tabs:
 *   Identity — Creator Card (holographic, shareable)
 *   Experiences — Upcoming + create + past with 3% chain
 *   Growth — KPIs, 3% chain, top fans, trajectory
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { useExperienceList, daysUntil } from '../../hooks/useExperienceData'
import { fetchCreatorChallenges } from '../../lib/checklistChallengeService'
import { ESSENCE_ARCHETYPES } from '../../data/essenceArchetypes'
import { hapticLight } from '../../lib/haptics'
import useReachScore from '../../hooks/useReachScore'
import CreatorPositionCard from '../CreatorPositionCard'
import BlowUpBrandCard from './BlowUpBrandCard'
import FillNextEvent from './FillNextEvent'
import CreatorShareCard from './CreatorShareCard'
import { fetchTicketsSold } from '../../hooks/useExperiencePipeline'
import { lazy, Suspense } from 'react'
import ExperienceLibrary from './ExperienceLibrary'
import ExperiencePipeline from '../pipeline/ExperiencePipeline'
import { PlayProfileContentRec } from './PlayProfileRecs'
import PastExperienceStats from '../pipeline/PastExperienceStats'
import InstagramConnect from '../pipeline/InstagramConnect'
import BrandPulseCard from '../pipeline/BrandPulseCard'
import ContentIntel from '../pipeline/ContentIntel'
import RootReachCard from '../pipeline/RootReachCard'
import CreatorRadarChart from './CreatorRadarChart'
import CreatorCelebrations from './CreatorCelebrations'
import SectionLaunchPad from './SectionLaunchPad'
import InsightDrop from '../InsightDrop'
import { useCreatorInsightDrops } from '../../hooks/useCreatorInsightDrops'
import ZarloWidget from '../Zarlo/ZarloWidget'
import ZarloProactiveBubble from '../Zarlo/ZarloProactiveBubble'
import { useCreatorZarloTriggers } from '../../hooks/useCreatorZarloTriggers'
import { computeCreatorXP, getCreatorLevel, getNextLevel, getGamificationState, updateGamificationState, getUnlockedAchievements, updateBuildingStreak, HIDDEN_ACHIEVEMENTS } from '../../lib/creatorGamification'
const AIPortal = lazy(() => import('../portal/AIPortal'))
import './CreatorHomeV2.css'

// ─── Constants ─────────────────────────────────────────────────────────────

const SCOPE_FOCUS = {
  stream: 'Get specific. Pick one problem.',
  lake: 'Pick one experience. Run it this month.',
  waterfall: 'Build evidence. Stay specific.',
  river: 'Earned breadth. Build the platform.',
}

const ARCHETYPE_LABELS = {
  workshop: 'Workshop Creator',
  performance: 'Live Events Creator',
  cohort: 'Cohort Creator',
  books_media: 'Content Creator',
  facilitation: 'Facilitator',
  retreats: 'Retreat Creator',
}

const PAY_RENT_LABELS = {
  day_job_side_project: 'Day Job + Side Project',
  one_on_one_service: '1:1 Service',
  free_events_paid_elsewhere: 'Free Events, Paid Elsewhere',
  small_group_paid: 'Small Group Paid Events',
  institutional_salary: 'Institutional Salary',
}

function parseRuleBreak(ruleIdentified) {
  if (!ruleIdentified) return null
  const parts = ruleIdentified.split('|').map(s => s.trim())
  const extract = (prefix) => {
    const part = parts.find(p => p.startsWith(prefix))
    return part ? part.replace(prefix, '').trim() : ''
  }
  return {
    project: extract('Project:'),
    problem: extract('Problem:'),
    assumption: extract('Assumption:'),
    twoWorlds: extract('Two worlds:'),
    different: extract('Different:') || extract('Without it:'),
    experience: extract('Experience:'),
    oneLiner: extract('One-liner:'),
    score: extract('Score:'),
    // Legacy compat
    current: extract('Assumption:') || extract('Current:'),
    mine: extract('Different:') || extract('Without it:') || extract('Mine:'),
  }
}

function countdownLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null || d < 0) return null
  const text = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d} days`
  const urgency = d <= 2 ? 'pulse' : d <= 6 ? 'red' : d <= 13 ? 'amber' : ''
  return { text, urgency }
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CreatorHomeV2({ defaultTab = 'identity' }) {
  const { user } = useAuth()
  const userId = user?.id
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [identitySubTab, setIdentitySubTab] = useState('playbook')
  const [showSkillsExpanded, setShowSkillsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedExperienceId, setSelectedExperienceId] = useState(null)
  const [showShareCard, setShowShareCard] = useState(false)
  const [showAllPast, setShowAllPast] = useState(false)
  const [igRefreshKey, setIgRefreshKey] = useState(0)
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron

  // Creator detail modal
  const [creatorDetail, setCreatorDetail] = useState(null)
  const [creatorDataCache, setCreatorDataCache] = useState(null)

  const loadCreatorData = useCallback(async () => {
    if (creatorDataCache) return creatorDataCache
    try {
      const [timelines, growth, revenue] = await Promise.all([
        fetch('/data/creatorGrowthTimelines.json').then(r => r.json()),
        fetch('/data/experienceCreatorGrowthStrategies.json').then(r => r.json()),
        fetch('/data/creatorEarlyRevenueModels.json').then(r => r.json()),
      ])
      const cache = { timelines: timelines.creators || timelines, growth: growth.creators || growth, revenue: Array.isArray(revenue.creators || revenue) ? Object.fromEntries((revenue.creators || revenue).map(c => [c.name, c])) : revenue.creators || revenue }
      setCreatorDataCache(cache)
      return cache
    } catch { return null }
  }, [creatorDataCache])

  const handleCreatorTap = async (name) => {
    const data = await loadCreatorData()
    // Also get DNA profile data (bio, oneLiner, blowUpMoment)
    let dnaProfile = null
    try {
      const dnaRes = await fetch('/data/experienceCreatorDNA.json')
      const dnaData = await dnaRes.json()
      dnaProfile = (dnaData.profiles || []).find(p => p.name === name) || null
    } catch {}
    setCreatorDetail({
      name,
      timeline: data?.timelines[name] || null,
      growth: data?.growth[name] || null,
      revenue: data?.revenue[name] || null,
      dna: dnaProfile,
    })
  }

  // Data
  const [scopeResult, setScopeResult] = useState(null)
  const [creatorSelection, setCreatorSelection] = useState(null)
  const [dnaResult, setDnaResult] = useState(null)
  const [assessment, setAssessment] = useState(null)
  const [payRentModel, setPayRentModel] = useState(null)
  const [remarkableAngle, setRemarkableAngle] = useState(null)
  const [blowUpReadiness, setBlowUpReadiness] = useState(null)
  const [hasReach, setHasReach] = useState(false)
  const [hasGrowth, setHasGrowth] = useState(false)
  const [hasScaleScore, setHasScaleScore] = useState(false)
  const [reachDetail, setReachDetail] = useState(null)
  const [growthDetail, setGrowthDetail] = useState(null)
  const [scaleDetail, setScaleDetail] = useState(null)
  // hasPositioningStatement removed — CreatorPositionCard handles its own state
  const [essenceAvatar, setEssenceAvatar] = useState(null)
  const [essenceName, setEssenceName] = useState(null)
  const [userSkills, setUserSkills] = useState([])
  const [userProblems, setUserProblems] = useState([])
  const [topFans, setTopFans] = useState([])
  const [movementXP, setMovementXP] = useState(0)
  const [creatorXP, setCreatorXP] = useState(0)
  const [scaleScoreValue, setScaleScoreValue] = useState(null)
  const [maxTicketPrice, setMaxTicketPrice] = useState(null)
  const [isFoundingMember, setIsFoundingMember] = useState(false)
  const [instagramConnected, setInstagramConnected] = useState(false)
  const [repeatAttendeeCount, setRepeatAttendeeCount] = useState(0)
  const [buildingStreak, setBuildingStreak] = useState({ current: 0, best: 0 })
  const [streakMilestone, setStreakMilestone] = useState(null)
  const [achievementCount, setAchievementCount] = useState(0)

  // Inner Game data
  const [nervousSystemData, setNervousSystemData] = useState(null)
  const [woundMapData, setWoundMapData] = useState(null)
  const [limitingBeliefData, setLimitingBeliefData] = useState(null)

  const { experiences, loading: expLoading } = useExperienceList()
  const { reach: reachScore } = useReachScore(userId)

  const upcoming = experiences.filter(e => e.status === 'upcoming')
  const past = experiences
    .filter(e => e.status === 'completed' || e.status === 'archived')
    .sort((a, b) => new Date(b.experience_date || b.updated_at || 0) - new Date(a.experience_date || a.updated_at || 0))

  const [dashboardKPIs, setDashboardKPIs] = useState({ totalAttendees: 0, repeatRate: 0 })
  const [checklistCounts, setChecklistCounts] = useState({})
  const [ticketCounts, setTicketCounts] = useState({})
  const [activePlays, setActivePlays] = useState([])
  const [bridgeCount, setBridgeCount] = useState({ total: 0, contacted: 0 })

  // ── Load all data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    loadData()
    fetchCreatorChallenges(userId, null).then(({ data }) => setActivePlays(data || []))
    supabase.from('crm_contacts').select('outreach_status').eq('user_id', userId).contains('tags', ['bridge']).then(({ data }) => {
      const contacts = data || []
      setBridgeCount({ total: contacts.length, contacted: contacts.filter(c => c.outreach_status && c.outreach_status !== 'to_contact').length })
    })
  }, [userId])

  // KPIs computed inside loadData from the same attendeeRows fetch

  // Fetch checklist progress for upcoming experiences
  const upcomingIds = upcoming.map(e => e.id).join(',')
  useEffect(() => {
    if (!upcomingIds || !userId) return
    const ids = upcomingIds.split(',')
    ;(async () => {
      const { data } = await supabase
        .from('experience_checklist_items')
        .select('experience_id, section, completed')
        .eq('user_id', userId)
        .in('experience_id', ids)
      if (!data) return
      const counts = {}
      data.forEach(item => {
        if (!counts[item.experience_id]) counts[item.experience_id] = {}
        if (!counts[item.experience_id][item.section]) counts[item.experience_id][item.section] = { total: 0, done: 0 }
        counts[item.experience_id][item.section].total++
        if (item.completed) counts[item.experience_id][item.section].done++
      })
      setChecklistCounts(counts)
    })()
  }, [upcomingIds, userId])

  // Fetch tickets sold for upcoming experiences (spots bars).
  // selectedExperienceId in deps so counts refresh after metrics are entered in the pipeline.
  useEffect(() => {
    if (!upcomingIds || !userId || selectedExperienceId) return
    fetchTicketsSold(userId, upcomingIds.split(',')).then(setTicketCounts)
  }, [upcomingIds, userId, selectedExperienceId])

  async function loadData() {
    setLoading(true)
    try {
      const [
        { data: scope },
        { data: selection },
        { data: dna },
        { data: assess },
        { data: stageProgress },
        { data: remarkData },
        { data: attendeeRows },
        { data: essenceProfile },
        { data: xpData },
        { data: skillsData },
        { data: problemsData },
        { data: nsData },
        { data: wmData },
        { data: lbData },
        { data: readinessData },
        { data: reachData },
        { data: growthData },
        { data: scaleScoreData },
      ] = await Promise.all([
        supabase.from('scope_map_results').select('stage').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('experience_creator_selections').select('dominant_archetype, product_suite, selected_creators').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('founder_dna_results').select('dna_code, archetype, matched_founder').eq('user_id', userId).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('creator_assessments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('user_stage_progress').select('pay_rent_model, current_journey_level, hero_avatar_url').eq('user_id', userId).maybeSingle(),
        supabase.from('remarkable_angles').select('id, wound_problem, assumption, rule_identified, combination_insight, different, experience, extreme_action_plan, project_name, score_unique, score_share, score_simple, ai_rule_statement, ai_remarkable_bio, ai_tribe_statement, branch, score_ancestral, score_body').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('contact_experiences').select('contact_id, experience_id').eq('user_id', userId),
        supabase.from('lead_flow_profiles').select('essence_archetype, custom_essence_image, custom_essence_name, positioning_statement').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('quest_completions').select('points_earned').eq('user_id', userId).eq('quest_category', 'Movement'),
        supabase.from('nikigai_clusters').select('cluster_label, is_favourite').eq('user_id', userId).eq('cluster_type', 'skills').eq('cluster_stage', 'final'),
        supabase.from('nikigai_clusters').select('cluster_label, is_favourite').eq('user_id', userId).eq('cluster_type', 'problems').eq('cluster_stage', 'final'),
        supabase.from('nervous_system_responses').select('nervous_system_impact_limit, nervous_system_income_limit, archetype').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('journey_onboarding_selections').select('id').eq('user_id', userId).then(({ data, error }) => ({ data: data?.length >= 4 ? { id: 'complete' } : null, error })),
        supabase.from('healing_compass_responses').select('id, created_at').eq('user_id', userId).eq('flow_version', 2).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('blow_up_readiness').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('narrative_builders').select('id, vehicle_type, vehicle_desc, identity_label, cosign_targets, tribal_language').eq('user_id', userId).limit(1).maybeSingle(),
        supabase.from('access_architectures').select('id, price_score, time_score, friction_score, cognitive_score, identity_score, weakest_barrier, designed_first_step').eq('user_id', userId).limit(1).maybeSingle(),
        supabase.from('scale_diagnostics').select('id, branch, total_score, phase_classification, score_body, score_culture, score_identity, score_access, gate_passed').eq('user_id', userId).limit(1).maybeSingle(),
      ])

      setScopeResult(scope || null)
      setCreatorSelection(selection || null)
      setDnaResult(dna || null)
      setAssessment(assess || null)
      setPayRentModel(stageProgress?.pay_rent_model || null)
      setRemarkableAngle(remarkData || null)
      setMovementXP((xpData || []).reduce((sum, r) => sum + (r.points_earned || 0), 0))
      setNervousSystemData(nsData || null)
      setWoundMapData(wmData || null)
      setLimitingBeliefData(lbData || null)
      setBlowUpReadiness(readinessData || null)
      setHasReach(!!reachData?.id)
      setHasGrowth(!!growthData?.id)
      setHasScaleScore(!!scaleScoreData?.id)
      setReachDetail(reachData || null)
      setGrowthDetail(growthData || null)
      setScaleDetail(scaleScoreData || null)
      const allSkills = (skillsData || []).map(s => ({ label: s.cluster_label, fav: s.is_favourite }))
      const allProblems = (problemsData || []).map(p => ({ label: p.cluster_label, fav: p.is_favourite }))
      const hasFavSkills = allSkills.some(s => s.fav)
      const hasFavProblems = allProblems.some(p => p.fav)
      setUserSkills(hasFavSkills ? allSkills.filter(s => s.fav).map(s => s.label) : allSkills.map(s => s.label))
      setUserProblems(hasFavProblems ? allProblems.filter(p => p.fav).map(p => p.label) : allProblems.map(p => p.label))

      // positioning_statement check removed — CreatorPositionCard handles its own state

      // Essence avatar + name
      if (essenceProfile?.essence_archetype) {
        const arch = ESSENCE_ARCHETYPES.find(a => a.name === essenceProfile.essence_archetype)
        if (arch) {
          setEssenceAvatar(essenceProfile.custom_essence_image || stageProgress?.hero_avatar_url || arch.image)
          setEssenceName(essenceProfile.custom_essence_name || arch.name)
        }
      }

      // Scale Score value (not just boolean)
      setScaleScoreValue(scaleScoreData?.total_score ?? null)

      // KPIs + Top fans — compute FIRST so creatorXP uses fresh values
      let localTotalAttendees = 0
      let localRepeatRate = 0
      let localRepeats = 0
      if (attendeeRows?.length) {
        const counts = {}
        attendeeRows.forEach(a => { if (a.contact_id) counts[a.contact_id] = (counts[a.contact_id] || 0) + 1 })
        localTotalAttendees = Object.keys(counts).length
        localRepeats = Object.values(counts).filter(c => c >= 2).length
        localRepeatRate = localTotalAttendees > 0 ? Math.round((localRepeats / localTotalAttendees) * 100) : 0

        const repeatIds = Object.entries(counts).filter(([, c]) => c >= 2).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id, count]) => ({ id, count }))
        if (repeatIds.length) {
          const { data: contacts } = await supabase.from('crm_contacts').select('id, name, email').in('id', repeatIds.map(r => r.id))
          setTopFans(repeatIds.map(r => {
            const c = contacts?.find(x => x.id === r.id)
            return { id: r.id, name: c?.name || c?.email || 'Unknown', count: r.count }
          }).filter(f => f.name !== 'Unknown'))
        }
      }
      setDashboardKPIs({ totalAttendees: localTotalAttendees, repeatRate: localRepeatRate })
      setRepeatAttendeeCount(localRepeats)

      // creatorXP and maxTicketPrice moved to useEffect — see below

      // Instagram connection check
      const { data: igIntegration } = await supabase.from('user_integrations').select('id').eq('user_id', userId).eq('platform', 'instagram').eq('status', 'active').maybeSingle()
      setInstagramConnected(!!igIntegration)

      // Founding member check (first 50 by created_at, with stripe_customer_id or manual whitelist)
      const FOUNDING_WHITELIST = ['ebe69854-2ebd-4236-a437-3a362f5e1af4', 'c649fc45-f040-4e48-8f8e-48f4a1285f58', 'cc03bd6e-c40f-4941-8d1a-bc8c502d22d4']
      if (FOUNDING_WHITELIST.includes(userId)) {
        setIsFoundingMember(true)
      } else {
        const { count } = await supabase.from('user_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('plan_type', 'creator')
          .eq('status', 'active')
          .not('stripe_customer_id', 'is', null)
          .lte('created_at', (await supabase.from('user_subscriptions').select('created_at').eq('user_id', userId).eq('plan_type', 'creator').maybeSingle()).data?.created_at || '1970-01-01')
        setIsFoundingMember((count ?? 999) < 50)
      }

      // Building streak — check if creator had activity this week
      const threePercentNotes = past.filter(e => e.three_percent_note).length
      const hasActivityThisWeek = (
        experiences.length > 0 || !!remarkData?.id || !!reachData?.id ||
        !!growthData?.id || !!scaleScoreData?.id || threePercentNotes > 0
      )
      const streakResult = updateBuildingStreak(hasActivityThisWeek)
      setBuildingStreak({ current: streakResult.current, best: streakResult.best })
      if (streakResult.milestone) setStreakMilestone(streakResult.milestone)

      // Achievement count for trophy display
      setAchievementCount(getUnlockedAchievements().length)
    } catch (err) {
      console.error('CreatorHomeV2 load error:', err)
    } finally {
      setLoading(false)
    }
  }


  // ── Creator XP + Max Ticket Price (depends on experiences loading) ────
  useEffect(() => {
    if (loading || expLoading) return
    const threePercentNotes = past.filter(e => e.three_percent_note).length
    setCreatorXP(computeCreatorXP({
      hasRemarkableResults: !!remarkableAngle,
      hasReach,
      hasGrowth,
      hasScaleScore,
      hasPositioning: false, // CreatorPositionCard manages its own state
      pastEventCount: past.length,
      threePercentCount: threePercentNotes,
      filledEventCount: 0,
      repeatRate: dashboardKPIs.repeatRate,
      totalAttendees: dashboardKPIs.totalAttendees,
    }))
    const prices = experiences.map(e => e.ticket_price).filter(p => p != null && p > 0)
    setMaxTicketPrice(prices.length > 0 ? Math.max(...prices) : null)
  }, [loading, expLoading, past, experiences, remarkableAngle, hasReach, hasGrowth, hasScaleScore, dashboardKPIs])

  // ── Derived ────────────────────────────────────────────────────────────
  const archetype = creatorSelection?.dominant_archetype || null
  const archetypeLabel = ARCHETYPE_LABELS[archetype] || 'Creator'
  const scopeFocus = SCOPE_FOCUS[scopeResult?.stage] || null
  // parseRuleBreak kept for legacy compat but no longer used in display
  // const ruleBreak = parseRuleBreak(remarkableAngle?.rule_identified)
  const selectedCreators = creatorSelection?.selected_creators || []

  const threePercentChain = past
    .filter(e => e.three_percent_note)
    .map((e, i) => ({ num: past.filter(x => x.three_percent_note).length - i, note: e.three_percent_note, name: e.name, date: e.experience_date, attendees: e.attendee_count }))

  // Creator Insight Drops (G16) — template-based, 1 per session
  const { insight: creatorInsight, dismissInsight: dismissCreatorInsight } = useCreatorInsightDrops({
    hasRemarkableResults: !!remarkableAngle,
    hasReach,
    hasGrowth,
    hasScaleScore,
    scaleScoreValue,
    remarkableAngle,
    threePercentNotes: threePercentChain,
    branchScoring: null, // Not available at this level — type 1 insight skipped
    dnaProfiles: [], // Loaded lazily in CreatorPositionCard, pass empty for now
  })

  // Zarlo for Creators (G15) — proactive triggers
  const nearestUpcoming = upcoming[0] || null
  const nearestAttractDone = nearestUpcoming ? (checklistCounts[nearestUpcoming.id]?.marketing?.done || 0) : 0
  const daysSinceLastActivity = past.length > 0
    ? Math.floor((Date.now() - new Date(past[0].experience_date || past[0].updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const { message: zarloMessage, dismiss: dismissZarlo } = useCreatorZarloTriggers({
    nearestEvent: nearestUpcoming ? { name: nearestUpcoming.name, daysUntil: daysUntil(nearestUpcoming.experience_date) || 99, attractItemsDone: nearestAttractDone } : null,
    pipelineReadiness: nearestUpcoming ? (nearestAttractDone > 0 ? Math.min(100, nearestAttractDone * 20) : 0) : 0,
    daysSinceActivity: daysSinceLastActivity,
    threePercentCount: threePercentChain.length,
    hasSoldOut: false, // TODO: compute from capacity vs attendees
    hasScaleScore,
    quarterlyPlansEmpty: getGamificationState().quarterlyPlannerDismissed !== `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
    hasRemarkableResults: !!remarkableAngle,
    nextLaunchPadItem: !remarkableAngle ? 'finding your rule break' : !hasReach ? 'Remarkable Reach' : !hasGrowth ? 'Remarkable Growth' : 'your next experience',
  })
  const [zarloChat, setZarloChat] = useState(null)
  const [originDismissed, setOriginDismissed] = useState(false)

  // ── Gate ────────────────────────────────────────────────────────────────
  // Only redirect if data has fully loaded AND no selection exists.
  // Skip if we just arrived (loading still true) to avoid race condition
  // where the flow saves data but the fetch hasn't picked it up yet.
  const [gateChecked, setGateChecked] = useState(false)
  useEffect(() => {
    if (!loading && !expLoading && userId) {
      if (!creatorSelection && gateChecked) {
        navigate('/experience-creators', { replace: true })
      }
      setGateChecked(true)
    }
  }, [loading, expLoading, creatorSelection, userId, navigate, gateChecked])

  if (loading || expLoading) {
    return <div className="ch2"><div className="ch2-loading"><div className="ch2-spinner" /></div></div>
  }
  if (!creatorSelection) {
    return <div className="ch2"><div className="ch2-loading"><div className="ch2-spinner" /></div></div>
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="ch2">

      {/* Hero — sits above the content area, flush to edges */}
      {activeTab === 'identity' && (
        <div className="ch2-id-hero">
          <button
            className="ch2-hero-share"
            title="Share your card"
            onClick={() => { hapticLight(); setShowShareCard(true) }}
          >⤴</button>
          <div className="ch2-id-hero-main">
            {essenceAvatar ? (
              <div className="ch2-id-avatar">
                <img src={essenceAvatar} alt="" onError={e => { e.target.style.display = 'none' }} />
              </div>
            ) : (
              <div className="ch2-id-avatar-empty" onClick={() => { hapticLight(); navigate('/essence-mirror?returnTo=/create') }} style={{ cursor: 'pointer' }}>
                Discover<br />Your<br />Essence →
              </div>
            )}
            <div>
              <div className="ch2-id-type">{archetypeLabel}</div>
              <div className="ch2-id-name">{essenceName || 'Your Identity'}</div>
              {scopeFocus ? (
                <div className="ch2-id-focus">🎯 {scopeFocus}</div>
              ) : !essenceName && (
                <div className="ch2-id-focus">✨ Let&apos;s find out who you are</div>
              )}
            </div>
          </div>
          <div className="ch2-hero-progress">
            {/* Creator XP + Level */}
            <div className="ch2-xp-row">
              <span className="ch2-xp-level">⚡ {getCreatorLevel(creatorXP).name}</span>
              <span className="ch2-xp-bar-wrap">
                <span
                  className="ch2-xp-bar-fill"
                  style={{ width: `${getNextLevel(creatorXP) ? Math.min(100, (creatorXP / getNextLevel(creatorXP).threshold) * 100) : 100}%` }}
                />
              </span>
              <span className="ch2-xp-text">
                {getNextLevel(creatorXP) ? `${creatorXP} / ${getNextLevel(creatorXP).threshold} XP` : `${creatorXP} XP`}
              </span>
            </div>
            {/* Streak + Founding + Trophies row */}
            {(buildingStreak.current > 0 || achievementCount > 0 || isFoundingMember) && (
              <div className="ch2-streak-row">
                {isFoundingMember && <span className="ch2-founding-badge">FOUNDING</span>}
                {buildingStreak.current > 0 && (
                  <span className="ch2-streak-pill">
                    🔥 {buildingStreak.current}w streak
                  </span>
                )}
                {achievementCount > 0 && (
                  <span className="ch2-trophy-pill">
                    🏆 {achievementCount} / {HIDDEN_ACHIEVEMENTS.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ch2-content">
        {/* ═══ IDENTITY TAB ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'identity' ? ' active' : ''}`}>

          <SectionLaunchPad title="Your launch pad" items={[
            { label: 'Discover your essence', done: !!essenceAvatar, route: '/essence-mirror' },
            { label: 'Find your North Stars', done: !!creatorSelection, route: '/experience-creators' },
            { label: 'Find your rule break', done: !!remarkableAngle, route: '/create/remarkable' },
          ]} />

          <div className="ch2-id-card">
            <div className="ch2-id-inner">

              {/* Who You Are */}
              <div className="ch2-id-section">
                <div className="ch2-card-header">
                  <div className="ch2-card-header-left">
                    <span className="ch2-card-icon">🧬</span>
                    <span className="ch2-label" style={{ margin: 0 }}>Who You Are</span>
                  </div>
                  {userSkills.length === 0 && userProblems.length === 0 && (
                    <span className="ch2-start-badge">Start here</span>
                  )}
                </div>

                {(userSkills.length > 0 || userProblems.length > 0) ? (
                  <>
                    <p className="ch2-card-sub">Pulled from your Life Map and Essence Mirror.</p>

                    {userSkills.length > 0 && (
                      <>
                        <div className="ch2-section-label">Your Skills</div>
                        <div className="ch2-skills">
                          <span className="ch2-skill">{userSkills[0]}</span>
                          {userSkills.length > 1 && !showSkillsExpanded && (
                            <span className="ch2-see-more" onClick={() => setShowSkillsExpanded(true)}>+{userSkills.length - 1} more</span>
                          )}
                          {showSkillsExpanded && userSkills.slice(1).map(s => <span key={s} className="ch2-skill">{s}</span>)}
                          {showSkillsExpanded && (
                            <span className="ch2-see-more" onClick={() => setShowSkillsExpanded(false)}>show less</span>
                          )}
                        </div>
                      </>
                    )}

                    {userProblems.length > 0 && (
                      <>
                        <div className="ch2-section-label" style={{ marginTop: 14 }}>Problems You Solve</div>
                        <div className="ch2-skills">
                          <span className="ch2-skill ch2-skill-gold">{userProblems[0]}</span>
                          {userProblems.length > 1 && !showSkillsExpanded && (
                            <span className="ch2-see-more" onClick={() => setShowSkillsExpanded(true)}>+{userProblems.length - 1} more</span>
                          )}
                          {showSkillsExpanded && userProblems.slice(1).map(p => <span key={p} className="ch2-skill ch2-skill-gold">{p}</span>)}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="ch2-card-sub">Three quick flows fill this in. Most people finish in one sitting.</p>
                    <div className="ch2-biz-row" style={{ cursor: 'pointer' }} onClick={() => { hapticLight(); navigate('/life-map?returnTo=/create') }}>
                      <div className="ch2-biz-icon">🗺️</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Your Skills + Problems</div>
                        <div className="ch2-biz-val">Complete your Life Map to discover these</div>
                      </div>
                      <div className="ch2-row-chevron">›</div>
                    </div>
                    <div className="ch2-biz-row" style={{ cursor: 'pointer' }} onClick={() => { hapticLight(); navigate('/curiosity-map') }}>
                      <div className="ch2-biz-icon">🔍</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Your Industry Branches</div>
                        <div className="ch2-biz-val">Map your curiosities to see your frontier</div>
                      </div>
                      <div className="ch2-row-chevron">›</div>
                    </div>
                  </>
                )}

                {selectedCreators.length > 0 ? (
                  <>
                    <div className="ch2-section-label" style={{ marginTop: 14 }}>North Stars</div>
                    <div className="ch2-stars">
                      {selectedCreators.slice(0, 5).map(name => {
                        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                        return (
                          <div key={name} className="ch2-star" onClick={() => handleCreatorTap(name)} style={{ cursor: 'pointer' }}>
                            <div className="ch2-star-img">
                              <img src={`/images/creators/${slug}.png`} alt="" onError={e => { e.target.style.display = 'none' }} />
                            </div>
                            <div className="ch2-star-name">{name}</div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="ch2-biz-row" style={{ cursor: 'pointer' }} onClick={() => { hapticLight(); navigate('/experience-creators') }}>
                    <div className="ch2-biz-icon">⭐</div>
                    <div className="ch2-biz-info">
                      <div className="ch2-biz-label">North Stars</div>
                      <div className="ch2-biz-val">Meet the creators who work like you</div>
                    </div>
                    <div className="ch2-row-chevron">›</div>
                  </div>
                )}
              </div>

              {/* Sub-tabs: Playbook only (Inner Game locked for now) */}
              <div className="ch2-subtabs">
                <button className={`ch2-subtab${identitySubTab === 'playbook' ? ' active' : ''}`} onClick={() => setIdentitySubTab('playbook')}>Playbook</button>
                <button className="ch2-subtab" style={{ opacity: 0.35, cursor: 'not-allowed' }} disabled>Inner Game 🔒</button>
              </div>

              {/* ═══ PLAYBOOK SUB-TAB ═══ */}
              {identitySubTab === 'playbook' && <>

              {/* Position card — data from /curiosity-map, /life-map, /life-paths, active quests */}
              <CreatorPositionCard
                userId={userId}
                essenceName={essenceName}
                skills={userSkills}
                problems={userProblems}
                remarkableAngle={remarkableAngle}
                onCreatorTap={handleCreatorTap}
              />

              <BlowUpBrandCard
                remarkableAngle={remarkableAngle}
                hasReach={hasReach}
                hasGrowth={hasGrowth}
                hasScaleScore={hasScaleScore}
                reachDetail={reachDetail}
                growthDetail={growthDetail}
                scaleDetail={scaleDetail}
                blowUpReadiness={blowUpReadiness}
                navigate={navigate}
              />

              <div className="ch2-id-divider" />

              {/* Your Model */}
              {(payRentModel || assessment) ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Your Model</div>
                  {payRentModel && (
                    <div className="ch2-biz-row">
                      <div className="ch2-biz-icon">💼</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Pay Rent</div>
                        <div className="ch2-biz-val">{PAY_RENT_LABELS[payRentModel] || payRentModel}</div>
                      </div>
                      <div className="ch2-biz-status ch2-st-done">✓</div>
                    </div>
                  )}
                  {assessment && ['attraction', 'core', 'continuity'].map(layer => {
                    const detail = assessment[`${layer}_detail`]
                    const status = assessment[`${layer}_status`]
                    const colors = { attraction: '#8b5cf6', core: '#E9A23B', continuity: '#3b82f6' }
                    return (
                      <div key={layer} className="ch2-biz-row">
                        <div className="ch2-biz-dot" style={{ background: colors[layer] }} />
                        <div className="ch2-biz-info">
                          <div className="ch2-biz-label">{layer}</div>
                          <div className="ch2-biz-val">{detail || 'Not set yet'}</div>
                        </div>
                        <div className={`ch2-biz-status ${status === 'have' ? 'ch2-st-done' : status === 'inconsistent' ? 'ch2-st-wip' : 'ch2-st-todo'}`}>
                          {status === 'have' ? '✓' : status === 'inconsistent' ? '~' : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/create/pay-rent')}>
                    <div className="ch2-locked-title">Your Model</div>
                    <div className="ch2-locked-sub">How do you pay rent? What's your attraction / core / continuity?</div>
                    <div className="ch2-locked-cta">Build Your Model →</div>
                  </div>
                </div>
              )}

              {/* ═══ ACTIONS ═══ */}
              <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                <div className="ch2-label">Actions</div>
                <div className="ch2-actions-grid">
                  {remarkableAngle && (
                    <div className="ch2-action-card" onClick={() => navigate('/create/plays')}>
                      <div className="ch2-action-icon">⚡</div>
                      <div className="ch2-action-info">
                        <div className="ch2-action-title">Create</div>
                        <div className="ch2-action-sub">Design a Lightning Strike that makes your movement impossible to ignore</div>
                      </div>
                      {activePlays.filter(p => p.challenge_source === 'strike').length > 0 && (
                        <div className="ch2-action-count">{activePlays.filter(p => p.challenge_source === 'strike').length} active</div>
                      )}
                      <div className="ch2-action-arrow">›</div>
                    </div>
                  )}
                  <div className="ch2-action-card" onClick={() => navigate('/create/bridge')}>
                    <div className="ch2-action-icon">🌉</div>
                    <div className="ch2-action-info">
                      <div className="ch2-action-title">Bridge</div>
                      <div className="ch2-action-sub">
                        {remarkableAngle
                          ? 'Find 5 people slightly ahead of you and build mutual value'
                          : 'Find 5 people slightly ahead of you and build mutual value. You can start this today.'}
                      </div>
                    </div>
                    {bridgeCount.total > 0 && (
                      <div className="ch2-action-count">{bridgeCount.contacted} of {bridgeCount.total}</div>
                    )}
                    <div className="ch2-action-arrow">›</div>
                  </div>
                  {!remarkableAngle && (
                    <div className="ch2-action-card ch2-action-locked">
                      <div className="ch2-action-icon">⚡</div>
                      <div className="ch2-action-info">
                        <div className="ch2-action-title">Create 🔒</div>
                        <div className="ch2-action-sub">Unlocks with your rule break</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              </>}

              {/* ═══ INNER GAME SUB-TAB ═══ */}
              {identitySubTab === 'inner-game' && <>

              {/* Play Profile */}
              {dnaResult ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Play Profile</div>
                  <div className="ch2-biz-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/play-profile')}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #5e17eb, #E9A23B)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700 }}>
                      {getInitials(dnaResult.matched_founder)}
                    </div>
                    <div className="ch2-biz-info">
                      <div className="ch2-biz-label">You work like</div>
                      <div className="ch2-biz-val">{dnaResult.matched_founder || dnaResult.archetype}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#adb5bd', fontWeight: 600 }}>See more ›</div>
                  </div>
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/play-profile')}>
                    <div className="ch2-locked-title">Play Profile</div>
                    <div className="ch2-locked-sub">How are you wired? Marathon or sprints? Fire or purpose?</div>
                    <div className="ch2-locked-cta">Take the Quiz →</div>
                  </div>
                </div>
              )}

              <div className="ch2-id-divider" />

              {/* Know Your Ceiling (Nervous System) */}
              {nervousSystemData ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Know Your Ceiling</div>
                  {nervousSystemData.nervous_system_impact_limit && (
                    <div className="ch2-biz-row">
                      <div className="ch2-biz-icon">👁️</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Visibility Limit</div>
                        <div className="ch2-biz-val">{nervousSystemData.nervous_system_impact_limit}</div>
                      </div>
                    </div>
                  )}
                  {nervousSystemData.nervous_system_income_limit && (
                    <div className="ch2-biz-row">
                      <div className="ch2-biz-icon">💰</div>
                      <div className="ch2-biz-info">
                        <div className="ch2-biz-label">Income Limit</div>
                        <div className="ch2-biz-val">{nervousSystemData.nervous_system_income_limit}</div>
                      </div>
                    </div>
                  )}
                  <button className="ch2-btn-outline" onClick={() => navigate('/nervous-system')} style={{ marginTop: 8, fontSize: 11, padding: '8px 14px' }}>
                    Retake →
                  </button>
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/nervous-system')}>
                    <div className="ch2-locked-title">Know Your Ceiling</div>
                    <div className="ch2-locked-sub">What are your current visibility and income limits? Where does your nervous system cap you?</div>
                    <div className="ch2-locked-cta">Map Your Limits →</div>
                  </div>
                </div>
              )}

              <div className="ch2-id-divider" />

              {/* Wound Map */}
              {woundMapData ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Wound Map</div>
                  <div className="ch2-biz-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/wound-map')}>
                    <div className="ch2-biz-icon">🗺️</div>
                    <div className="ch2-biz-info">
                      <div className="ch2-biz-label">Origin Story</div>
                      <div className="ch2-biz-val">Completed</div>
                    </div>
                    <div className="ch2-biz-status ch2-st-done">✓</div>
                  </div>
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/wound-map')}>
                    <div className="ch2-locked-title">Wound Map</div>
                    <div className="ch2-locked-sub">The story behind the work. Your wound often IS your remarkable angle.</div>
                    <div className="ch2-locked-cta">Map Your Story →</div>
                  </div>
                </div>
              )}

              <div className="ch2-id-divider" />

              {/* Limiting Beliefs */}
              {limitingBeliefData ? (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-label">Limiting Beliefs</div>
                  <div className="ch2-biz-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/limiting-belief-rewire')}>
                    <div className="ch2-biz-icon">🔓</div>
                    <div className="ch2-biz-info">
                      <div className="ch2-biz-label">Belief Rewire</div>
                      <div className="ch2-biz-val">Completed</div>
                    </div>
                    <div className="ch2-biz-status ch2-st-done">✓</div>
                  </div>
                </div>
              ) : (
                <div className="ch2-id-section" style={{ paddingTop: 14 }}>
                  <div className="ch2-locked" onClick={() => navigate('/limiting-belief-rewire')}>
                    <div className="ch2-locked-title">Limiting Beliefs</div>
                    <div className="ch2-locked-sub">"I'm not ready." "I can't charge that." Rewire the beliefs blocking your next level.</div>
                    <div className="ch2-locked-cta">Start Rewiring →</div>
                  </div>
                </div>
              )}

              </>}

              <div className="ch2-id-footer">
                <div className="ch2-id-brand">VIBE RISE</div>
                <div className="ch2-id-brand">viberise.nichuzz.com</div>
              </div>
            </div>
          </div>

          {/* Edit button */}
          <button className="ch2-btn-outline" onClick={() => setActiveTab('edit-identity')} style={{ marginTop: 4 }}>
            Edit Identity
          </button>
        </div>

        {/* ═══ EXPERIENCES TAB ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'experiences' ? ' active' : ''}`}>

          {!selectedExperienceId && (
            <SectionLaunchPad title="Your next steps" items={[
              { label: 'Create your first experience', done: experiences.length > 0, route: '/create/experience/new' },
              { label: 'Set up your first pipeline', done: Object.keys(checklistCounts).length > 0, action: () => experiences[0] && setSelectedExperienceId(experiences[0].id) },
              { label: 'Run your first event', done: past.length > 0, action: () => upcoming[0] && setSelectedExperienceId(upcoming[0].id) },
            ]} />
          )}

          {/* PlayProfileEventRec archived — see CLAUDE.md Archived Features */}
          {/* QuarterlyPlanner archived — see CLAUDE.md Archived Features */}

          {/* ── Growth Line Pipeline or Past Stats (when experience selected) ── */}
          {selectedExperienceId ? (
            past.some(e => e.id === selectedExperienceId) ? (
              <PastExperienceStats
                experienceId={selectedExperienceId}
                onBack={() => setSelectedExperienceId(null)}
              />
            ) : (
              <ExperiencePipeline
                experienceId={selectedExperienceId}
                onBack={() => setSelectedExperienceId(null)}
              />
            )
          ) : (
          <>
          {/* Fill this event — nearest upcoming (staleness nudge integrated) */}
          {upcoming.length > 0 && (() => {
            const exp = upcoming[0]
            const d = daysUntil(exp.experience_date)
            const cl = checklistCounts[exp.id] || {}
            const totalDone = Object.values(cl).reduce((sum, s) => sum + (s.done || 0), 0)
            const stale = d >= 7 && totalDone === 0
            return (
              <FillNextEvent
                experience={exp}
                onOpen={(id) => setSelectedExperienceId(id)}
                isStale={stale}
              />
            )
          })()}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <div className="ch2-label" style={{ marginBottom: 10, marginTop: 4 }}>Upcoming</div>
              {upcoming.map(exp => {
                const cd = countdownLabel(exp.experience_date)
                const cl = checklistCounts[exp.id] || {}
                const marketingItems = cl.marketing || { total: 0, done: 0 }
                const orgItems = cl.organisation || { total: 0, done: 0 }
                // Mini pipeline dot statuses
                const mPct = marketingItems.total > 0 ? marketingItems.done / marketingItems.total * 100 : 0
                const oPct = orgItems.total > 0 ? orgItems.done / orgItems.total * 100 : 0
                // Spots bar (only when capacity is set)
                const tickets = ticketCounts[exp.id] ?? 0
                const hasCapacity = exp.capacity != null && exp.capacity > 0
                const fillPct = hasCapacity ? Math.min(100, Math.round(tickets / exp.capacity * 100)) : null
                const spotsLow = hasCapacity && fillPct < 50

                return (
                  <div key={exp.id} className="ch2-exp-card" onClick={() => setSelectedExperienceId(exp.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="ch2-exp-name">{exp.name}</div>
                        <div className="ch2-exp-meta">
                          {exp.experience_type?.replace(/_/g, ' ') || 'Experience'}
                          {exp.experience_date && ` · ${new Date(exp.experience_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                          {cd && <span className={`ch2-exp-countdown ${cd.urgency ? `ch2-countdown-${cd.urgency}` : ''}`}>{cd.text}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div
                          style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); hapticLight(); navigate(`/create/experience/${exp.id}`) }}
                        >Edit</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#5e17eb' }}>Open →</div>
                      </div>
                    </div>
                    {/* Spots bar */}
                    {hasCapacity && (
                      <div className="ch2-exp-spots">
                        <div className="ch2-exp-spots-bar">
                          <div className={`ch2-exp-spots-fill${spotsLow ? ' low' : ''}`} style={{ width: `${fillPct}%` }} />
                        </div>
                        <span className={`ch2-exp-spots-label${spotsLow ? ' low' : ''}`}>{tickets} / {exp.capacity} spots</span>
                      </div>
                    )}
                    {/* Mini pipeline dots */}
                    <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: mPct >= 60 ? '#22c55e' : mPct >= 20 ? '#eab308' : '#e9ecef' }} title="Attract" />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e9ecef' }} title="Capture" />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e9ecef' }} title="Convert" />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: oPct >= 60 ? '#22c55e' : oPct >= 20 ? '#eab308' : '#e9ecef' }} title="Deliver" />
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e9ecef' }} title="Grow" />
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Empty state for no upcoming */}
          {upcoming.length === 0 && (
            <div className="ch2-card">
              <div className="ch2-empty">
                <div className="ch2-empty-icon">🎪</div>
                <div className="ch2-empty-title">No upcoming experiences</div>
                <div className="ch2-empty-sub">Create your next experience to get a checklist that fills the room.</div>
              </div>
            </div>
          )}

          {/* Experience Library */}
          <ExperienceLibrary onCreateFromTemplate={(t) => navigate(`/create/experience/new?templateId=${t.id}&type=${t.experience_type}`)} />

          {/* Create New */}
          <div className="ch2-create-options">
            <div className="ch2-create-opt" onClick={() => navigate('/create/inspiration')}>
              <div className="ch2-create-icon">✨</div>
              <div className="ch2-create-label">Find Inspiration</div>
              <div className="ch2-create-sub">From creators you admire</div>
            </div>
            <div className="ch2-create-opt" onClick={() => navigate('/create/experience/new')}>
              <div className="ch2-create-icon">➕</div>
              <div className="ch2-create-label">New Experience</div>
              <div className="ch2-create-sub">I know what I want</div>
            </div>
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div className="ch2-card">
              <div className="ch2-label">Past Experiences</div>
              {past.slice(0, showAllPast ? past.length : 3).map(exp => (
                <div key={exp.id} className="ch2-past-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedExperienceId(exp.id)}>
                  <div className="ch2-past-dot" />
                  <div className="ch2-past-info">
                    <div className="ch2-past-name">{exp.name}</div>
                    <div className="ch2-past-meta">
                      {exp.experience_date && new Date(exp.experience_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {exp.experience_type && ` · ${exp.experience_type.replace(/_/g, ' ')}`}
                    </div>
                  </div>
                  {exp.three_percent_note && (
                    <div className="ch2-past-3pct">3%: {exp.three_percent_note.length > 30 ? exp.three_percent_note.slice(0, 30) + '...' : exp.three_percent_note}</div>
                  )}
                </div>
              ))}
              {past.length > 3 && !showAllPast && (
                <button className="ch2-see-more" onClick={() => setShowAllPast(true)}>
                  See all {past.length} experiences
                </button>
              )}
            </div>
          )}
          </>
          )}
        </div>

        {/* ═══ GROWTH TAB ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'growth' ? ' active' : ''}`}>

          <SectionLaunchPad title="Start tracking" items={[
            { label: 'Connect Instagram', done: instagramConnected, action: () => document.querySelector('.ig-connect-btn')?.click() },
            { label: 'Run your first experience', done: past.length > 0, route: '/create/experience/new' },
            { label: 'Complete a Reach · This Week task', done: reachScore >= 1 },
          ]} />

          {/* Creator Momentum */}
          <RootReachCard />

          {/* Instagram Integration */}
          <InstagramConnect onRefresh={() => setIgRefreshKey(k => k + 1)} />
          <BrandPulseCard />
          <ContentIntel refreshKey={igRefreshKey} />

          {/* KPIs */}
          <div className="ch2-kpi-grid">
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{dashboardKPIs.totalAttendees ?? '—'}</div>
              <div className="ch2-kpi-label">Total Attendees</div>
            </div>
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{`${dashboardKPIs.repeatRate ?? 0}%`}</div>
              <div className="ch2-kpi-label">Repeat Rate</div>
            </div>
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{past.length}</div>
              <div className="ch2-kpi-label">Experiences Run</div>
            </div>
            <div className="ch2-kpi">
              <div className="ch2-kpi-val">{upcoming.length}</div>
              <div className="ch2-kpi-label">Upcoming</div>
            </div>
          </div>

          {/* Days since last event — gentle mirror */}
          {past.length > 0 && upcoming.length === 0 && (() => {
            const lastDate = new Date(past[0].experience_date)
            const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
            if (daysSince < 7) return null
            return (
              <div className="ch2-days-since">
                It's been {daysSince} days since your last experience. Your top fans are waiting.
              </div>
            )
          })()}

          {/* Low attendance reframe — NOTE: attendee_count is not a column on experiences table.
              This will not render until attendee_count is computed and attached to past events
              (e.g., from experience_attendees COUNT). Harmlessly dormant until then. */}
          {past.length > 0 && past[0].attendee_count != null && past[0].capacity > 0 && past[0].attendee_count < past[0].capacity * 0.5 && (
            <div className="ch2-low-attendance">
              {past[0].attendee_count <= 5
                ? "Every movement starts with a handful. Wim Hof's first ice bath had 3 people."
                : past[0].attendee_count <= 15
                ? "That's a room full of people who chose to be there. That matters."
                : "More than most creators get in their first year. Keep running events."}
            </div>
          )}

          {/* 3% Chain */}
          {threePercentChain.length > 0 && (
            <div className="ch2-card">
              <div className="ch2-label">3% Improvement Chain</div>
              <div style={{ fontSize: 11, color: '#adb5bd', marginBottom: 10 }}>Each experience builds on the last.</div>
              {threePercentChain.map((item, i) => (
                <div key={i} className="ch2-chain-item">
                  <div className="ch2-chain-dot">{item.num}</div>
                  <div>
                    <div className="ch2-chain-exp">{item.name}</div>
                    <div className="ch2-chain-note">"{item.note}"</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Fans */}
          {topFans.length > 0 && (
            <div className="ch2-card">
              <div className="ch2-label">Your Top Fans</div>
              <div style={{ fontSize: 10, color: '#adb5bd', marginBottom: 8 }}>People who keep coming back.</div>
              {topFans.map(fan => (
                <div key={fan.id} className="ch2-fan-row">
                  <div className="ch2-fan-avatar">{getInitials(fan.name)}</div>
                  <div className="ch2-fan-name">{fan.name}</div>
                  <div className="ch2-fan-count">{fan.count} experiences</div>
                </div>
              ))}
            </div>
          )}

          {/* Spider Graph — Your Shape */}
          <CreatorRadarChart data={{
            impact: dashboardKPIs.totalAttendees || 0,
            consistency: past.length,
            retention: dashboardKPIs.repeatRate || 0,
            brand: scaleScoreValue,
            price: maxTicketPrice,
            reach: null, // TODO: wire Instagram views when BrandPulse data is lifted
          }} />

          {/* Play Profile Content Recommendations */}
          {dnaResult?.dna_code && (
            <PlayProfileContentRec dnaResult={dnaResult} onNavigate={navigate} />
          )}

          {/* Trajectory */}
          {scopeResult?.stage && (
            <div className="ch2-trajectory">
              <div className="ch2-traj-label">Your Focus</div>
              <div className="ch2-traj-title">{scopeResult.stage.charAt(0).toUpperCase() + scopeResult.stage.slice(1)}</div>
              <div className="ch2-traj-desc">{SCOPE_FOCUS[scopeResult.stage]}</div>
              <button className="ch2-btn-outline" style={{ marginTop: 10 }} onClick={() => navigate('/scope-map')}>Retake Diagnostic →</button>
            </div>
          )}

          {/* Empty state */}
          {past.length === 0 && topFans.length === 0 && (
            <div className="ch2-card">
              <div className="ch2-empty">
                <div className="ch2-empty-icon">📊</div>
                <div className="ch2-empty-title">No data yet</div>
                <div className="ch2-empty-sub">Run your first experience to start tracking your growth.</div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ EDIT IDENTITY PANEL ═══ */}
        <div className={`ch2-tab-panel${activeTab === 'edit-identity' ? ' active' : ''}`}>
          <div className="ch2-label" style={{ marginBottom: 12 }}>Edit Your Identity</div>
          <div className="ch2-label" style={{ marginBottom: 4, marginTop: 8, color: 'var(--gold)' }}>Playbook</div>
          {[
            { label: 'Your Skills', sub: 'Retake Play-Skills flow', path: '/play-skills-identifier' },
            { label: 'North Stars', sub: 'Redo Experience Creator Matching', path: '/experience-creators' },
            { label: 'Your Position', sub: 'Retake Scope Map diagnostic', path: '/scope-map' },
            { label: 'Remarkable Results', sub: 'Redo the rule break flow', path: '/create/remarkable' },
            { label: 'Pay Rent', sub: 'Explore how creators pay rent', path: '/create/pay-rent' },
            { label: 'Scale Income', sub: 'Redo attraction / core / continuity', path: '/create/scale-income' },
          ].map(item => (
            <div key={item.path} className="ch2-biz-row" style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => navigate(item.path)}>
              <div className="ch2-biz-info">
                <div className="ch2-biz-val">{item.label}</div>
                <div className="ch2-biz-label">{item.sub}</div>
              </div>
              <div style={{ fontSize: 11, color: '#adb5bd', fontWeight: 600 }}>→</div>
            </div>
          ))}
          <div className="ch2-label" style={{ marginBottom: 4, marginTop: 14, color: 'var(--purple)' }}>Inner Game</div>
          {[
            { label: 'Play Profile', sub: 'Retake the DNA quiz', path: '/play-profile?mode=retake' },
            { label: 'Know Your Ceiling', sub: 'Map visibility + income limits', path: '/nervous-system' },
            { label: 'Wound Map', sub: 'The story behind the work', path: '/wound-map' },
            { label: 'Limiting Beliefs', sub: 'Rewire what blocks you', path: '/limiting-belief-rewire' },
          ].map(item => (
            <div key={item.path} className="ch2-biz-row" style={{ cursor: 'pointer', marginBottom: 6 }} onClick={() => navigate(item.path)}>
              <div className="ch2-biz-info">
                <div className="ch2-biz-val">{item.label}</div>
                <div className="ch2-biz-label">{item.sub}</div>
              </div>
              <div style={{ fontSize: 11, color: '#adb5bd', fontWeight: 600 }}>→</div>
            </div>
          ))}
          <button className="ch2-btn-outline" onClick={() => setActiveTab('identity')} style={{ marginTop: 8 }}>
            ← Back to Identity
          </button>
        </div>

        {/* ═══ AI PORTAL TAB (desktop-only) ═══ */}
        {isElectron && (
          <div className={`ch2-tab-panel${activeTab === 'ai-portal' ? ' active' : ''}`}>
            <Suspense fallback={<div style={{ padding: 20, color: '#6c757d' }}>Loading AI Portal...</div>}>
              <AIPortal />
            </Suspense>
          </div>
        )}
      </div>

      {/* Creator Detail Modal */}
      {creatorDetail && (
        <div className="ch2-creator-overlay" onClick={() => setCreatorDetail(null)}>
          <div className="ch2-creator-modal" onClick={e => e.stopPropagation()}>
            <button className="ch2-creator-close" onClick={() => setCreatorDetail(null)}>×</button>
            <div className="ch2-creator-header">
              <img
                className="ch2-creator-avatar"
                src={`/images/creators/${creatorDetail.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}.png`}
                alt=""
                onError={e => { e.target.style.display = 'none' }}
              />
              <h2 className="ch2-creator-name">{creatorDetail.name}</h2>
              {creatorDetail.dna?.oneLiner && (
                <p className="ch2-creator-oneliner">"{creatorDetail.dna.oneLiner}"</p>
              )}
            </div>

            {creatorDetail.dna?.bio && (
              <div className="ch2-creator-section">
                <p className="ch2-creator-text">{creatorDetail.dna.bio}</p>
              </div>
            )}

            {creatorDetail.dna?.blowUpMoment && (
              <div className="ch2-creator-section">
                <div className="ch2-creator-section-label">⚡ Blow-up moment ({creatorDetail.dna.blowUpYear})</div>
                <p className="ch2-creator-text">{creatorDetail.dna.blowUpMoment}</p>
                {creatorDetail.dna.blowUpContext && (
                  <p className="ch2-creator-text" style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Before: {creatorDetail.dna.blowUpContext}</p>
                )}
              </div>
            )}

            {creatorDetail.timeline && (
              <div className="ch2-creator-section">
                <div className="ch2-creator-stat">
                  <span className="ch2-creator-stat-num">{creatorDetail.timeline.trust_years}</span>
                  <span className="ch2-creator-stat-label">years before breakthrough</span>
                </div>
                <p className="ch2-creator-text">{creatorDetail.timeline.inflection}</p>
              </div>
            )}

            {creatorDetail.revenue && (
              <div className="ch2-creator-section">
                <div className="ch2-creator-section-label">How they paid rent</div>
                <p className="ch2-creator-text">{creatorDetail.revenue.early_revenue_description}</p>
              </div>
            )}

            {creatorDetail.growth && (
              <>
                <div className="ch2-creator-section">
                  <div className="ch2-creator-section-label">How they started</div>
                  <p className="ch2-creator-text">{creatorDetail.growth.early_growth}</p>
                </div>
                <div className="ch2-creator-section">
                  <div className="ch2-creator-section-label">How they blew up</div>
                  <p className="ch2-creator-text">{creatorDetail.growth.scaling_move}</p>
                </div>
                {creatorDetail.growth.remarkable_thing && (
                  <div className="ch2-creator-section">
                    <div className="ch2-creator-section-label">What made them remarkable</div>
                    <p className="ch2-creator-text ch2-creator-remarkable">{creatorDetail.growth.remarkable_thing}</p>
                  </div>
                )}
              </>
            )}

            {!creatorDetail.timeline && !creatorDetail.growth && !creatorDetail.revenue && (
              <p className="ch2-creator-text" style={{ textAlign: 'center', opacity: 0.5 }}>Detailed data coming soon for this creator.</p>
            )}
          </div>
        </div>
      )}

      {/* Creator Card share modal */}
      {showShareCard && (
        <CreatorShareCard
          essenceName={essenceName}
          archetypeLabel={archetypeLabel}
          ruleBreak={remarkableAngle?.ai_rule_statement || null}
          avatarUrl={essenceAvatar || null}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Creator Insight Drop (max 1 per session) */}
      {creatorInsight && <InsightDrop insight={creatorInsight} onDismiss={dismissCreatorInsight} />}

      {/* Milestone + achievement + spider celebrations */}
      <CreatorCelebrations
        data={{
          hasRemarkableResults: !!remarkableAngle,
          hasReach,
          hasGrowth,
          hasScaleScore,
          hasPositioning: false, // CreatorPositionCard manages its own state
          experienceCount: experiences.length,
          pastEventCount: past.length,
          hasSoldOut: false, // TODO: compute from capacity vs attendees
          totalAttendees: dashboardKPIs.totalAttendees || 0,
          repeatRate: dashboardKPIs.repeatRate || 0,
          repeatAttendeeCount,
          threePercentCount: threePercentChain.length,
          instagramConnected,
          hasWoundMap: !!woundMapData,
          streakMilestone,
        }}
        spiderData={{
          impact: dashboardKPIs.totalAttendees || 0,
          consistency: past.length,
          retention: dashboardKPIs.repeatRate || 0,
          brand: scaleScoreValue,
          price: maxTicketPrice,
          reach: null, // TODO: wire Instagram views
        }}
      />

      {/* Zarlo for Creators (G15) — gated on Remarkable Results */}
      {!!remarkableAngle && (
        <>
          {zarloMessage && zarloChat !== 'zarlo' && (
            <ZarloProactiveBubble
              message={zarloMessage}
              onTap={() => setZarloChat('zarlo')}
              onDismiss={dismissZarlo}
            />
          )}
          <ZarloWidget activeChat={zarloChat} setActiveChat={setZarloChat} />
        </>
      )}

      {/* Origin story overlay — first visit only, skip if payment redirect */}
      {!loading && !originDismissed && !getGamificationState().origin_seen && !new URLSearchParams(window.location.search).has('welcome') && (
        <div className="ch2-origin-overlay">
          <div className="ch2-origin-card">
            <h2 className="ch2-origin-title">The world is going to be a better place thanks to you and your work.</h2>
            <p className="ch2-origin-sub">We're here to help you create that change.</p>
            <button className="ch2-origin-cta" onClick={() => { updateGamificationState({ origin_seen: true }); setOriginDismissed(true) }}>
              Let's go &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
