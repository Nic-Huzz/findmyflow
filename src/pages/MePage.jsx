/**
 * MePage.jsx — /me page
 *
 * Modern mobile-first page with 4 sections:
 * 1. Hero Identity (avatar, name, XP, streak, level)
 * 2. Flow Journey (horizontal river with milestones, stats, narrative)
 * 3. Today's Quest (progress dots, next quest CTA)
 * 4. Hero Profile (essence, protective, voice tracker)
 *
 * First-time users see empty states with encouraging prompts.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useHeroProfile } from '../hooks/useHeroProfile'
import { getLevel, getLevelNumber, getLevelProgress, getLevelMaxXP } from '../lib/crm/statsService'
import { getStageDisplayName } from '../lib/stageConfig'
import { getLevelConfig, HEALING_DAYS_REQUIRED } from '../components/level/LevelConfig'
import { ONBOARDING_QUEST_IDS } from '../hooks/usePriorityTab'
import { useReveal } from '../hooks/useReveal'
import VibeColorPicker from '../components/VibeColorPicker'
import HorizontalFlowRiver from '../components/HorizontalFlowRiver'
// HomeFirstTime archived — replaced by /essence-mirror redirect
import SeeYourFlow from '../components/SeeYourFlow'
import { hasPendingJourneyData, persistJourneyOnboarding, hasPendingPlaySkillsData, persistPlaySkillsOnboarding } from '../lib/journeyOnboarding'
import './MePage.css'

// Stat ring circumference for r=22
export default function MePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Main data hook
  const {
    archetypes,
    projects,
    totalXP,
    groanChallenges,
    voiceTracker,
    loading: heroLoading,
    refresh: refreshHero,
  } = useHeroProfile(user?.id, user?.email)

  // First-visit welcome card — persisted in Supabase
  const [showWelcome, setShowWelcome] = useState(false)
  const [essenceMirrorDone, setEssenceMirrorDone] = useState(true) // default true to avoid flash
  useEffect(() => {
    if (!user?.id) return
    supabase.from('user_stage_progress')
      .select('welcome_dismissed, essence_mirror_completed')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.welcome_dismissed) setShowWelcome(true)
        setEssenceMirrorDone(!!data?.essence_mirror_completed)
      })
  }, [user?.id])
  const dismissWelcome = async () => {
    setShowWelcome(false)
    if (user?.id) {
      await supabase.from('user_stage_progress').upsert({
        user_id: user.id,
        welcome_dismissed: true,
      }, { onConflict: 'user_id' })
    }
  }

  // Inline state
  const [stageProgress, setStageProgress] = useState(undefined) // undefined = not loaded, null = no row
  const [flowEntries, setFlowEntries] = useState([])
  const [questData, setQuestData] = useState([])
  const [questCompletions, setQuestCompletions] = useState([])
  const [stageGraduations, setStageGraduations] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [hasAcceptedChallenge, setHasAcceptedChallenge] = useState(false)
  const [hasCustomPhoto, setHasCustomPhoto] = useState(false)
  const [showInlineMapper, setShowInlineMapper] = useState(null) // null = not determined yet
  const [dbLevelProgress, setDbLevelProgress] = useState(null)
  const [currentJourneyLevel, setCurrentJourneyLevel] = useState(0)
  const projectMenuRef = useRef(null)

  const primaryProject = selectedProject || projects?.[0] || null

  // Close project dropdown on outside click
  useEffect(() => {
    if (!projectMenuOpen) return
    function handleClick(e) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target)) {
        setProjectMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [projectMenuOpen])

  // Fetch stage progress (for first-time gate) — extracted as useCallback so it can be re-called after onboarding
  const fetchStageProgress = useCallback(async () => {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('user_stage_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) {
      // On error, assume onboarded to avoid trapping existing users in onboarding
      console.error('Error fetching stage progress:', error)
      setStageProgress({ onboarding_v2_completed: true })
      return
    }
    setStageProgress(data ?? null)
  }, [user?.id])

  useEffect(() => { fetchStageProgress() }, [fetchStageProgress])

  // Fetch journey level first
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setCurrentJourneyLevel(data?.current_journey_level || 0)
      })
  }, [user?.id])

  // Then fetch level progress using resolved journey level
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_level_progress')
      .select('zone_selected, deep_dive_completed, boss_fight_completed, milestone_completed, healing_day_dates, courage_challenge_ids')
      .eq('user_id', user.id)
      .eq('level', currentJourneyLevel)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDbLevelProgress(data)
      })
  }, [user?.id, currentJourneyLevel])

  // Persist journey onboarding data after first login
  useEffect(() => {
    if (!user?.id) return
    if (!hasPendingJourneyData()) return

    persistJourneyOnboarding(user.id)
      .then(result => {
        if (result.success) {
          console.log('Journey onboarding persisted, pattern:', result.pattern?.dominant)
        }
      })
      .catch(err => console.warn('Failed to persist journey onboarding:', err))
  }, [user?.id])

  // Persist play-skills onboarding data after login/signup
  useEffect(() => {
    if (!user?.id) return
    if (!hasPendingPlaySkillsData()) return

    persistPlaySkillsOnboarding(user.id)
      .then(result => {
        if (result.success) {
          console.log('Play-skills onboarding persisted, count:', result.count)
        }
      })
      .catch(err => console.warn('Failed to persist play-skills onboarding:', err))
  }, [user?.id])

  // After onboarding completes, refresh state in-place instead of full page reload
  const refreshAfterOnboarding = useCallback(async () => {
    try {
      await Promise.all([fetchStageProgress(), refreshHero()])
    } catch (err) {
      console.error('Error refreshing after onboarding:', err)
    }
  }, [fetchStageProgress, refreshHero])

  // Fetch quest completions (used for quest progress + river direction)
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('quest_completions')
      .select('quest_id, completed_at, reflection_text, project_id')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .then(({ data }) => {
        setQuestCompletions(data || [])
      })
  }, [user?.id])

  // Check if user has ever accepted a groan challenge (onboarding step 8)
  // + check if user has uploaded a custom archetype photo (onboarding step 1)
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('groan_challenges')
      .select('id')
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null)
      .limit(1)
      .then(({ data }) => {
        setHasAcceptedChallenge(data && data.length > 0)
      })
    // Check custom photo: try user_id first, fall back to email
    // Use limit(1) + array access instead of maybeSingle() to handle duplicate rows
    supabase
      .from('lead_flow_profiles')
      .select('custom_essence_image')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setHasCustomPhoto(!!(data[0].custom_essence_image))
        } else if (user.email) {
          supabase
            .from('lead_flow_profiles')
            .select('custom_essence_image')
            .ilike('email', user.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(({ data: emailData }) => {
              setHasCustomPhoto(!!(emailData?.[0]?.custom_essence_image))
            })
        }
      })
  }, [user?.id])

  // Fetch flow entries + stage graduations for river
  useEffect(() => {
    if (!user?.id || !primaryProject?.id) { setFlowEntries([]); setStageGraduations([]); setShowInlineMapper(false); return }
    Promise.all([
      supabase
        .from('flow_entries')
        .select('id, direction, logged_at, activity_description, reasoning')
        .eq('user_id', user.id)
        .eq('project_id', primaryProject.id)
        .order('logged_at', { ascending: true })
        .limit(30),
      supabase
        .from('stage_graduation_history')
        .select('id, from_stage, to_stage, graduated_at')
        .eq('user_id', user.id)
        .eq('project_id', primaryProject.id)
        .order('graduated_at', { ascending: true }),
    ]).then(([flowResult, stageResult]) => {
      const entries = flowResult.data || []
      setFlowEntries(entries)
      setStageGraduations(stageResult.data || [])
      // Show inline mapper if: no entries yet, OR mapping is in progress (mid-refresh)
      const completedKey = `journey_mapping_completed_${user.id}_${primaryProject.id}`
      const mappingCompleted = localStorage.getItem(completedKey) === 'true'
      setShowInlineMapper(entries.length === 0 || !mappingCompleted)
    })
  }, [user?.id, primaryProject?.id])

  // Re-fetch flow entries (called by SeeYourFlow after each step)
  const refreshFlowEntries = async () => {
    if (!user?.id || !primaryProject?.id) return
    const { data } = await supabase
      .from('flow_entries')
      .select('id, direction, logged_at, activity_description, reasoning')
      .eq('user_id', user.id)
      .eq('project_id', primaryProject.id)
      .order('logged_at', { ascending: true })
      .limit(30)
    setFlowEntries(data || [])
  }

  // Load quest definitions
  useEffect(() => {
    fetch('/challengeQuestsUpdate.json')
      .then(r => r.json())
      .then(d => setQuestData(d.quests || []))
      .catch(() => {})
  }, [])

  // Derived: quest completions filtered to current project (user-level ones included)
  const projectQuestCompletions = useMemo(
    () => questCompletions.filter(qc =>
      qc.project_id === primaryProject?.id || qc.project_id === null
    ),
    [questCompletions, primaryProject?.id]
  )

  // Derived: quest progress
  const projectStage = primaryProject?.stage ?? 1
  const stageQuests = useMemo(
    () => questData.filter(q => q.stage_required === projectStage),
    [questData, projectStage]
  )
  const completedQuestIds = useMemo(
    () => new Set(projectQuestCompletions.map(c => c.quest_id)),
    [projectQuestCompletions]
  )
  const doneCount = stageQuests.filter(q => completedQuestIds.has(q.id)).length
  const nextQuest = stageQuests.find(q => !completedQuestIds.has(q.id))

  // Derived: 7-step onboarding progress
  const ONBOARDING_STEPS = [
    { name: 'Create Your Character', desc: 'Every player needs an avatar. Upload your photo to bring your archetype to life.', route: null },
    { name: 'Mind Space', desc: 'Extract your skills, problems, and people from an AI conversation.', route: '/mind-space' },
    { name: 'What is Healing?', desc: 'Understand what healing really means and why emotional splinters keep us stuck.', route: '/what-is-healing-explainer' },
    { name: 'Healing Compass', desc: 'Identify the wound causing your protective voice to protect you.', route: '/healing-compass' },
    { name: 'Play-List Finder', desc: 'Discover your skills through play, role models, and what feels fun.', route: '/play-list-finder' },
    { name: 'Check Alignment', desc: 'Confirm you feel aligned with your discovered skills, problems, and personas.', route: null },
    { name: 'Set Play-list Task', desc: 'Accept your first courage challenge from the Play-list Matrix.', route: null },
  ]

  const onboardingStatus = useMemo(() => {
    // Step 1: create your character (upload archetype photo)
    const step1 = hasCustomPhoto
    // Steps 2-6: quest completion check (mind_space, matrix_codes, healing_explainer, healing_compass, play_list_finder)
    const allCompletedIds = new Set(questCompletions.map(c => c.quest_id))
    const questSteps = ONBOARDING_QUEST_IDS.map(id => allCompletedIds.has(id))
    // Step 6: alignment check (localStorage)
    const alignSkills = typeof window !== 'undefined' && localStorage.getItem('priority_align_skills') === 'true'
    const alignProblems = typeof window !== 'undefined' && localStorage.getItem('priority_align_problems') === 'true'
    const alignPersona = typeof window !== 'undefined' && localStorage.getItem('priority_align_persona') === 'true'
    const step7 = alignSkills && alignProblems && alignPersona
    // Step 7: check if any groan challenge has been accepted
    const step7b = hasAcceptedChallenge
    return [step1, ...questSteps, step7, step7b]
  }, [questCompletions, hasAcceptedChallenge, hasCustomPhoto])

  // Steps 2-8 determine completion (step 1 photo is a recurring bonus, never blocks)
  const onboardingComplete = onboardingStatus.slice(1).every(Boolean)
  const onboardingStepIndex = onboardingStatus.findIndex(done => !done)
  const onboardingDoneCount = onboardingStatus.filter(Boolean).length
  const currentOnboardingStep = onboardingStepIndex >= 0 ? ONBOARDING_STEPS[onboardingStepIndex] : null

  // Derived: level info
  const level = getLevel(totalXP)
  const levelNum = getLevelNumber(totalXP)
  const levelProgress = getLevelProgress(totalXP)
  const levelMax = getLevelMaxXP(totalXP)
  const isMaxLevel = levelNum === 6 // Vibe Legend

  // Derived: protective pattern tag (e.g., "Freeze + sympathetic blend")

  // Derived: voice tracker
  const essencePct = voiceTracker?.essencePercentage ?? 50
  const protectivePct = voiceTracker ? (100 - essencePct) : 50
  const hasVoiceData = voiceTracker?.totalVoiceMoments > 0

  const voiceStatusText = useMemo(() => {
    if (!hasVoiceData) return 'Complete voice quests in the 7-Day Challenge to start tracking'
    const total = voiceTracker.totalVoiceMoments
    const essenceCount = voiceTracker.essenceCount || 0
    if (essencePct >= 60) return `Essence leads — ${essenceCount} of ${total} voice moments`
    if (essencePct >= 40) return `Balanced — ${essenceCount} of ${total} voice moments`
    return `Protective leads — ${total - essenceCount} of ${total} voice moments`
  }, [hasVoiceData, essencePct, voiceTracker])

  // Narrative generation
  const narrativeText = useMemo(() => {
    if (flowEntries.length === 0) return null
    const dirs = { north: 0, east: 0, south: 0, west: 0 }
    flowEntries.forEach(e => { if (dirs[e.direction] !== undefined) dirs[e.direction]++ })
    const dominant = Object.entries(dirs).sort((a, b) => b[1] - a[1])[0]
    const labels = { north: 'Flow', east: 'Redirect', south: 'Rest', west: 'Honour' }
    const label = labels[dominant[0]]

    if (dominant[0] === 'north') {
      return `Your river is <strong>running strong</strong> — mostly in ${label}. You're ${flowEntries.length > 5 ? 'building momentum' : 'off to a great start'}.`
    }
    if (dominant[0] === 'south') {
      return `Your recent pattern shows <strong>${label}</strong> energy. Be gentle — rest is part of the journey, not a detour.`
    }
    return `Your recent pattern shows <strong>${label}</strong> energy. Every direction teaches you something.`
  }, [flowEntries])

  // Merged timeline: compass entries + quest milestones + groan milestones + stage graduations
  const timelineEntries = useMemo(() => {
    const timeline = flowEntries.map(e => ({
      ...e,
      type: 'compass',
      date: e.logged_at,
    }))
    // Deduplicate quest completions by quest_id (user-level + project-level can both exist)
    const seenQuestIds = new Set()
    projectQuestCompletions.forEach(qc => {
      if (!qc.completed_at) return
      if (seenQuestIds.has(qc.quest_id)) return
      seenQuestIds.add(qc.quest_id)
      const quest = questData.find(q => q.id === qc.quest_id)
      if (!quest) return
      // Extract flow_direction from reflection_text JSON if present
      let flowDirection = null
      if (qc.reflection_text) {
        try {
          const parsed = typeof qc.reflection_text === 'string'
            ? JSON.parse(qc.reflection_text)
            : qc.reflection_text
          flowDirection = parsed.flow_direction || null
        } catch { /* not JSON */ }
      }
      timeline.push({
        id: `quest-${qc.quest_id}`,
        type: 'quest',
        date: qc.completed_at,
        completed_at: qc.completed_at,
        quest_name: quest.name,
        quest_description: quest.description,
        points: quest.points,
        direction: flowDirection,
      })
    })
    groanChallenges
      .filter(g => g.status === 'completed' && g.completed_at)
      .forEach(g => {
        timeline.push({
          id: `groan-${g.id}`,
          type: 'groan',
          date: g.completed_at,
          completed_at: g.completed_at,
          title: g.title,
          description: g.description,
          essence_zone: g.essence_zone,
          visibility_layer: g.visibility_layer,
        })
      })
    stageGraduations.forEach(sg => {
      timeline.push({
        id: `stage-${sg.id}`,
        type: 'stage',
        date: sg.graduated_at,
        from_stage: sg.from_stage,
        to_stage: sg.to_stage,
        stage_name: `Stage ${sg.to_stage} — ${getStageDisplayName(sg.to_stage)}`,
      })
    })
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date))
    return timeline
  }, [flowEntries, projectQuestCompletions, questData, groanChallenges, stageGraduations])

  // Scroll-reveal refs for below-the-fold sections
  const journeyRevealRef = useReveal()
  const questRevealRef = useReveal()

  // First-time onboarding gate — redirect to Essence Mirror flow
  useEffect(() => {
    if (stageProgress !== undefined && (stageProgress === null || !stageProgress.onboarding_v2_completed)) {
      navigate('/essence-mirror?returnTo=/me', { replace: true })
    }
  }, [stageProgress, navigate])

  if (stageProgress !== undefined && (stageProgress === null || !stageProgress.onboarding_v2_completed)) {
    return null
  }

  // Loading (wait for both hero data AND stageProgress to resolve)
  if (heroLoading || stageProgress === undefined) {
    return (
      <div className="me-page">
        <div className="app-loading-spinner">
          <div className="app-spinner-ring" />
        </div>
      </div>
    )
  }

  // Safety net: user completed onboarding but has no archetype profile
  // (e.g. signed up via AuthGate bypass instead of /get-started)
  if (!archetypes?.essence) {
    return (
      <div className="me-page content-enter">
        <div className="me-hero" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
          <h1 className="hero-name">One more step</h1>
          <p className="hero-tagline" style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
            Discover your Essence Archetype to unlock your full hero profile
          </p>
          <a href="/get-started" className="primary-button" style={{ textDecoration: 'none' }}>
            Discover Your Archetype
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="me-page content-enter">
      {/* ============================================================
         SECTION 1: HERO IDENTITY
         ============================================================ */}
      <section className="hero-section">
        <div className="hero-top-bar">
          <div className="brand">FindMyFlow</div>
          <div className="hero-top-right">
            <VibeColorPicker />
            <div className="xp-pill">
              <span>⚡</span>
              <span>{totalXP} XP</span>
            </div>
          </div>
        </div>

        <div className="hero-avatar-container flow-scale-in">
          <div className="avatar-ring-bg" />
          <div className="avatar-ring-inner">
            {archetypes?.essence?.image ? (
              <img src={archetypes.essence.image} alt={archetypes?.essence?.name || 'Essence'} />
            ) : (
              '✨'
            )}
          </div>
        </div>

        <h1 className="hero-name">{archetypes?.essence?.name || 'Hero'}</h1>
        <p className="hero-tagline">{archetypes?.essence?.visionInAction || 'Discovering your flow'}</p>

        <div className="xp-progress">
          <div className="xp-labels">
            <span>Level {currentJourneyLevel}: {getLevelConfig(currentJourneyLevel).name}</span>
            <span>{isMaxLevel ? `${totalXP} XP ✦` : `${totalXP} / ${levelMax} XP`}</span>
          </div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
      </section>

      {/* Welcome card — first visit only, or essence-mirror CTA for returning users */}
      {showWelcome && (
        <section className="welcome-banner">
          <div className="welcome-banner-inner">
            {!essenceMirrorDone ? (
              <>
                <div className="welcome-banner-icon">✨</div>
                <h2 className="welcome-banner-title">Discover your essence</h2>
                <p className="welcome-banner-text">
                  Find out which archetype drives you. It takes 5 minutes and changes how you see yourself.
                </p>
                <button className="welcome-banner-cta" onClick={() => navigate('/essence-mirror?returnTo=/me')}>
                  Start Essence Mirror <span>→</span>
                </button>
              </>
            ) : (
              <>
                <div className="welcome-banner-icon">🏠</div>
                <h2 className="welcome-banner-title">Welcome to your home base</h2>
                <p className="welcome-banner-text">
                  This is where your whole journey lives. Your flow river, quests, hero profile, and progress. Come back here anytime to see how far you've come.
                </p>
                <button className="welcome-banner-cta" onClick={dismissWelcome}>
                  Got it, let's go <span>→</span>
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* ARCHIVED: Fantasy League promo — re-enable when league is active
      <section className="league-promo-section">
        <a href="/league" className="league-promo-card">
          <span className="league-promo-icon">🏆</span>
          <div className="league-promo-text">
            <span className="league-promo-title">Sign Up for Fantasy</span>
            <span className="league-promo-sub">Compete with friends in the Fantasy League</span>
          </div>
          <span className="league-promo-arrow">→</span>
        </a>
      </section>
      */}

      {/* ============================================================
         SECTION 2: CURRENT LEVEL / TODAY'S QUEST
         ============================================================ */}
      <section className="quest-section reveal-fade-up" ref={questRevealRef}>
        <div className="quest-banner">
          {!onboardingComplete && currentOnboardingStep ? (
            <>
              <div className="quest-eyebrow">
                <span className="quest-label">Your Next Step</span>
                <span className="quest-day-badge">
                  Step {onboardingStepIndex + 1} of 8
                </span>
              </div>
              <h2 className="quest-title">
                {currentOnboardingStep.name}
              </h2>
              <p className="quest-subtitle">
                {currentOnboardingStep.desc}
              </p>
              <div className="quest-dots">
                {ONBOARDING_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`dot ${onboardingStatus[i] ? 'done' : ''} ${i === onboardingStepIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
              <div className="quest-progress-label">
                {onboardingDoneCount} of 8 steps complete
              </div>
              {currentOnboardingStep.route ? (
                <a
                  href={`${currentOnboardingStep.route}?returnTo=/me`}
                  className="quest-cta"
                  style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
                >
                  Start {currentOnboardingStep.name} <span>→</span>
                </a>
              ) : (
                <button className="quest-cta" onClick={() => navigate('/7-day-challenge')}>
                  Continue in Challenge <span>→</span>
                </button>
              )}
            </>
          ) : !archetypes?.essence?.name || archetypes?.essence?.name === 'Unknown' ? (
            <>
              <div className="quest-eyebrow">
                <span className="quest-label">Level {currentJourneyLevel}: {getLevelConfig(currentJourneyLevel).name}</span>
              </div>
              <h2 className="quest-title">Discover Your Essence</h2>
              <p className="quest-subtitle">
                Your shadows are the parts of you that were suppressed. Let's find who you really are.
              </p>
              <a
                href="/essence-mirror?returnTo=/me"
                className="quest-cta"
                style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
              >
                Start Essence Mirror <span>→</span>
              </a>
            </>
          ) : (
            <>
              <div className="quest-eyebrow">
                <span className="quest-label">Current Level</span>
              </div>
              {(() => {
                const lvlConfig = getLevelConfig(currentJourneyLevel)
                const healingDays = dbLevelProgress?.healing_day_dates?.length || 0
                const healingTarget = lvlConfig.healingDaysRequired || HEALING_DAYS_REQUIRED
                const healingPct = Math.min(100, Math.round((healingDays / healingTarget) * 100))
                const courageTarget = lvlConfig.courageCount || 0
                const courageDone = dbLevelProgress?.courage_challenge_ids?.length || 0
                const couragePct = courageTarget > 0 ? Math.min(100, Math.round((courageDone / courageTarget) * 100)) : 0
                return <>
                  <h2 className="quest-title">Level {currentJourneyLevel}: {lvlConfig.name}</h2>
                  <p className="quest-subtitle">{lvlConfig.question}</p>
                  <div className="me-level-bars">
                    <div className="me-level-bar-row">
                      <span className="me-level-bar-label">Healing Days</span>
                      <div className="me-level-bar-track"><div className="me-level-bar-fill" style={{ width: `${healingPct}%` }} /></div>
                    </div>
                    {courageTarget > 0 && (
                      <div className="me-level-bar-row">
                        <span className="me-level-bar-label">Courage</span>
                        <div className="me-level-bar-track"><div className="me-level-bar-fill" style={{ width: `${couragePct}%` }} /></div>
                      </div>
                    )}
                  </div>
                </>
              })()}
              <button className="quest-cta" onClick={() => navigate('/7-day-challenge')}>
                Go to Level Tab <span>→</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* ============================================================
         SECTION 3: YOUR FLOW JOURNEY
         ============================================================ */}
      <section className="journey-section reveal-fade-up" ref={journeyRevealRef}>
        <div className="flow-journey">
          <div className="fj-top">
            <div className="fj-header">
              <div className="fj-header-icon">🌊</div>
              <span className="fj-title">Your Flow Journey</span>
            </div>

            <p className="fj-sub">
              {timelineEntries.length > 0
                ? 'Swipe to explore your river — compass entries and milestones show your journey.'
                : 'Log your first compass check-in to start building your river.'
              }
            </p>
          </div>

          {timelineEntries.length === 0 && (
            <div style={{ padding: '0 0 8px' }}>
              <div style={{ height: 160, position: 'relative', padding: '0 24px' }}>
                <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                  <path className="ghost-river-glow"
                    d="M 40,80 Q 80,40 120,70 Q 160,100 200,60 Q 240,25 280,70 Q 320,110 360,60" />
                  <path className="ghost-river-path"
                    d="M 40,80 Q 80,40 120,70 Q 160,100 200,60 Q 240,25 280,70 Q 320,110 360,60" />
                  <circle cx="40" cy="80" r="8" fill="#5e17eb" stroke="white" strokeWidth="2" />
                  <text x="40" y="80" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="7" fontWeight="800">🚩</text>
                  <text x="40" y="102" textAnchor="middle" fill="#adb5bd" fontSize="8" fontWeight="700">Start</text>
                </svg>
              </div>
            </div>
          )}

          {timelineEntries.length > 0 && (
            <>
              <HorizontalFlowRiver
                projectId={primaryProject?.id}
                entries={timelineEntries}
              />
              <p className="fj-scroll-hint">← Swipe to explore your flow →</p>
            </>
          )}

          {narrativeText && (
            <div className="fj-narrative">
              <p dangerouslySetInnerHTML={{ __html: narrativeText }} />
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
         SECTION 4: HERO PROFILE
         ============================================================ */}
      <section className="hero-profile-section">
        <div className="hero-profile-card" onClick={() => navigate('/archetypes/essence')}>
          <div className="hp-top">
            <div className="hp-avatar">
              <div className="hp-avatar-inner">🎭</div>
            </div>
            <div className="hp-identity">
              <div className="hp-name">Your Hero Profile</div>
              <div className="hp-tagline">
                {archetypes?.essence?.name || 'Your Essence'}
              </div>
            </div>
            <span className="hp-chevron">›</span>
          </div>

          {/* Voice tracker */}
          <div className={`hp-voice-tracker ${!hasVoiceData ? 'hp-vt-empty' : ''}`}>
            <div className="hp-vt-labels">
              <span className="hp-vt-label essence">
                ✨ <span className="hp-vt-pct">{hasVoiceData ? `${essencePct}%` : '--%'}</span> Essence
              </span>
              <span className="hp-vt-label protective">
                Protective <span className="hp-vt-pct">{hasVoiceData ? `${protectivePct}%` : '--%'}</span> 🛡️
              </span>
            </div>
            <div className="hp-vt-bar">
              <div className="hp-vt-fill-essence" style={{ width: hasVoiceData ? `${essencePct}%` : '0%' }} />
              <div className="hp-vt-fill-protective" style={{ width: hasVoiceData ? `${protectivePct}%` : '0%' }} />
            </div>
            <div className="hp-vt-status">{voiceStatusText}</div>
          </div>

          <div className="hp-divider" />

          {/* Essence */}
          <div className="hp-essence">
            <div className="hp-essence-photo">
              <div className="hp-essence-photo-ring" />
              <div className="hp-essence-photo-img">
                {archetypes?.essence?.image ? (
                  <img src={archetypes.essence.image} alt={archetypes.essence.name} />
                ) : '✨'}
              </div>
            </div>
            <div className="hp-essence-info">
              <div className="hp-essence-name">{archetypes?.essence?.name || 'Your Essence'}</div>
              <div className="hp-essence-desc">{archetypes?.essence?.tagline || ''}</div>
            </div>
          </div>

          <div className="hp-full-link">
            View Essence Profile <span>→</span>
          </div>
        </div>
      </section>
    </div>
  )
}
