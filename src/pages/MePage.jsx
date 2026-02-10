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

import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useHeroProfile } from '../hooks/useHeroProfile'
import { getLevel, getLevelNumber, getLevelProgress, getLevelMaxXP } from '../lib/crm/statsService'
import { getStageDisplayName } from '../lib/stageConfig'
import VibeColorPicker from '../components/VibeColorPicker'
import HorizontalFlowRiver from '../components/HorizontalFlowRiver'
import { protectiveProfiles } from '../data/protectiveProfiles'
import HomeFirstTime from '../components/HomeFirstTime'
import './MePage.css'

// Stat ring circumference for r=22
const RING_CIRCUMFERENCE = 2 * Math.PI * 22 // ~138.23

function StatRing({ value, label, color, percentage }) {
  const dashoffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * (percentage / 100))
  return (
    <div className="fj-stat">
      <div className="fj-stat-ring">
        <svg viewBox="0 0 52 52">
          <circle className="fj-ring-bg" cx="26" cy="26" r="22" />
          <circle
            className="fj-ring-fill"
            cx="26" cy="26" r="22"
            style={{
              stroke: color,
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset: dashoffset,
            }}
          />
        </svg>
        <div className="fj-stat-val">{value}</div>
      </div>
      <div className="fj-stat-label">{label}</div>
    </div>
  )
}

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

  // Inline state
  const [stageProgress, setStageProgress] = useState(undefined) // undefined = not loaded, null = no row
  const [streakCount, setStreakCount] = useState(0)
  const [flowEntries, setFlowEntries] = useState([])
  const [questData, setQuestData] = useState([])
  const [questCompletions, setQuestCompletions] = useState([])
  const [stageGraduations, setStageGraduations] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
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

  // Fetch stage progress (for first-time gate)
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_stage_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          // On error, assume onboarded to avoid trapping existing users in onboarding
          console.error('Error fetching stage progress:', error)
          setStageProgress({ onboarding_v2_completed: true })
          return
        }
        setStageProgress(data ?? null)
      })
  }, [user?.id])

  // Fetch quest completions (used for streak + quest progress + river direction)
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('quest_completions')
      .select('quest_id, completed_at, reflection_text, project_id')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setStreakCount(0)
          setQuestCompletions([])
          return
        }
        setQuestCompletions(data)
        // Calculate streak from the same data
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const uniqueDays = new Set(
          data.map(d => {
            const dt = new Date(d.completed_at)
            dt.setHours(0, 0, 0, 0)
            return dt.getTime()
          })
        )
        let streak = 0
        let checkDate = new Date(today)
        while (uniqueDays.has(checkDate.getTime())) {
          streak++
          checkDate.setDate(checkDate.getDate() - 1)
        }
        setStreakCount(streak)
      })
  }, [user?.id])

  // Fetch flow entries + stage graduations for river
  useEffect(() => {
    if (!user?.id || !primaryProject?.id) { setFlowEntries([]); setStageGraduations([]); return }
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
      setFlowEntries(flowResult.data || [])
      setStageGraduations(stageResult.data || [])
    })
  }, [user?.id, primaryProject?.id])

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
  const projectStage = primaryProject?.stage || 1
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

  // Derived: level info
  const level = getLevel(totalXP)
  const levelNum = getLevelNumber(totalXP)
  const levelProgress = getLevelProgress(totalXP)
  const levelMax = getLevelMaxXP(totalXP)
  const isMaxLevel = levelNum === 6 // Vibe Legend

  // Derived: flow stats
  const northCount = flowEntries.filter(e => e.direction === 'north').length
  const flowPercentage = flowEntries.length > 0 ? Math.round((northCount / flowEntries.length) * 100) : 0
  const groanCompleted = groanChallenges.filter(g => g.status === 'completed').length
  const groanTotal = groanChallenges.length

  // Derived: first-time detection
  const isFirstTime = totalXP === 0 && streakCount === 0

  // Derived: protective pattern tag (e.g., "Freeze + sympathetic blend")
  const protectivePattern = useMemo(() => {
    if (!archetypes?.protective?.name) return null
    const profile = protectiveProfiles[archetypes.protective.name]
    return profile?.nervousSystemPattern?.pattern || null
  }, [archetypes?.protective?.name])

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
    projectQuestCompletions.forEach(qc => {
      if (!qc.completed_at) return
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

  // First-time onboarding gate — check BEFORE hero loading to avoid unnecessary waits
  if (stageProgress !== undefined && (stageProgress === null || !stageProgress.onboarding_v2_completed)) {
    return <HomeFirstTime />
  }

  // Loading (wait for both hero data AND stageProgress to resolve)
  if (heroLoading || stageProgress === undefined) {
    return (
      <div className="me-page">
        <div className="me-loading">
          <div className="me-loading-inner">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <div>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="me-page">
      {/* ============================================================
         SECTION 1: HERO IDENTITY
         ============================================================ */}
      <section className="hero-section">
        <div className="hero-top-bar">
          <div className="brand">FindMyFlow</div>
          <div className="xp-pill">
            <span>⚡</span>
            <span>{totalXP} XP</span>
          </div>
        </div>

        {/* VibeColorPicker in top-right (already position:fixed via its own CSS) */}
        <VibeColorPicker />

        <div className="hero-avatar-container">
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

        <div className="hero-badges">
          <div className={`badge streak ${isFirstTime ? 'empty' : ''}`}>
            <span>🔥</span>
            <span>{streakCount} Day Streak</span>
          </div>
          <div className="badge level">
            <span>{level.emoji}</span>
            <span>{level.name}</span>
          </div>
        </div>

        <div className="xp-progress">
          <div className="xp-labels">
            <span>Lv {levelNum} — {level.name}</span>
            <span>{isMaxLevel ? `${totalXP} XP ✦` : `${totalXP} / ${levelMax} XP`}</span>
          </div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
      </section>

      {/* ============================================================
         SECTION 2: YOUR FLOW JOURNEY
         ============================================================ */}
      <section className="journey-section">
        <div className="flow-journey">
          <div className="fj-top">
            <div className="fj-header">
              <div className="fj-header-icon">🌊</div>
              <span className="fj-title">Your Flow Journey</span>
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
              <div className="fj-project-select" ref={projectMenuRef}>
                <button
                  className={`fj-project-btn ${projectMenuOpen ? 'open' : ''}`}
                  onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                >
                  <span className="proj-emoji">🎯</span>
                  <span>{primaryProject?.name || 'My Project'}</span>
                  {projects.length > 1 && (
                    <span className="proj-chevron">▾</span>
                  )}
                </button>
                {projects.length > 1 && (
                  <div className={`fj-project-dropdown ${projectMenuOpen ? 'open' : ''}`}>
                    {projects.map(p => (
                      <div
                        key={p.id}
                        className={`fj-project-option ${p.id === primaryProject?.id ? 'active' : ''}`}
                        onClick={() => { setSelectedProject(p); setProjectMenuOpen(false) }}
                      >
                        <span>🎯</span>
                        {p.name}
                        <span className="opt-stage">Stage {p.stage}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="fj-sub">
              {timelineEntries.length > 0
                ? 'Swipe to explore your river — compass entries and milestones show your journey.'
                : 'Log your first compass check-in to start building your river.'
              }
            </p>
          </div>

          {/* Ghost river for first-time */}
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

          {/* Real river */}
          {timelineEntries.length > 0 && (
            <>
              <HorizontalFlowRiver
                projectId={primaryProject?.id}
                entries={timelineEntries}
              />
              <p className="fj-scroll-hint">← Swipe to explore your flow →</p>
            </>
          )}

          {/* Legend */}
          <div className="fj-legend-group">
            <div className="fj-legend-row">
              <span className="fj-legend-label">Compass</span>
              <div className="fj-legend-item"><div className="fj-legend-dot" style={{ background: '#10b981' }} /> Flow</div>
              <div className="fj-legend-item"><div className="fj-legend-dot" style={{ background: '#3b82f6' }} /> Redirect</div>
              <div className="fj-legend-item"><div className="fj-legend-dot" style={{ background: '#fbbf24' }} /> Honour</div>
              <div className="fj-legend-item"><div className="fj-legend-dot stuck" style={{ background: '#ef4444' }} /> Rest</div>
            </div>
            <div className="fj-legend-row">
              <span className="fj-legend-label">Challenge</span>
              <div className="fj-legend-item"><span className="fj-legend-icon">⚡</span> Quest</div>
              <div className="fj-legend-item"><span className="fj-legend-icon">🦁</span> Groan</div>
              <div className="fj-legend-item"><span className="fj-legend-icon">📊</span> Stage</div>
            </div>
          </div>

          {/* Stats rings */}
          <div className="fj-stats">
            <StatRing
              value={streakCount}
              label="Streak"
              color="#E67E22"
              percentage={Math.min(100, (streakCount / 30) * 100)}
            />
            <StatRing
              value={`${flowPercentage}%`}
              label="Flow"
              color="#10b981"
              percentage={flowPercentage}
            />
            <StatRing
              value={groanTotal > 0 ? `${groanCompleted}/${groanTotal}` : '0/0'}
              label="Courage"
              color="#E9A23B"
              percentage={groanTotal > 0 ? (groanCompleted / groanTotal) * 100 : 0}
            />
            <StatRing
              value={projectStage}
              label="Stage"
              color="#5e17eb"
              percentage={(projectStage / 8) * 100}
            />
          </div>

          {/* Narrative */}
          <div className={`fj-narrative ${!narrativeText ? 'fj-narrative-empty' : ''}`}>
            {narrativeText ? (
              <p dangerouslySetInnerHTML={{ __html: narrativeText }} />
            ) : (
              <p>Complete your first compass check-in to see your story unfold here</p>
            )}
          </div>

          <button className="fj-link" onClick={() => navigate('/flow-compass')}>
            Open Flow Compass <span>→</span>
          </button>
        </div>
      </section>

      {/* ============================================================
         SECTION 3: TODAY'S QUEST
         ============================================================ */}
      <section className="quest-section">
        <div className="quest-banner">
          <div className="quest-eyebrow">
            <span className="quest-label">Today's Quest</span>
            <span className="quest-day-badge">
              Stage {projectStage} — {getStageDisplayName(projectStage)}
            </span>
          </div>
          <h2 className="quest-title">
            {doneCount === 0 ? 'Begin Your Flow Journey' : (nextQuest?.name || 'All Quests Complete!')}
          </h2>
          <p className="quest-subtitle">
            {doneCount === 0
              ? 'Complete your first quest to start building momentum'
              : (nextQuest?.description || 'You\'ve completed every quest for this stage')
            }
          </p>
          <div className="quest-dots">
            {stageQuests.map((q, i) => (
              <div
                key={q.id}
                className={`dot ${completedQuestIds.has(q.id) ? 'done' : ''} ${i === doneCount ? 'active' : ''}`}
              />
            ))}
            {stageQuests.length === 0 && (
              // Fallback: show 7 empty dots
              Array.from({ length: 7 }).map((_, i) => <div key={i} className="dot" />)
            )}
          </div>
          <div className="quest-progress-label">
            {doneCount} of {stageQuests.length || 7} challenges complete
          </div>
          <button className="quest-cta" onClick={() => navigate('/7-day-challenge')}>
            {doneCount === 0 ? 'Start Your First Quest' : 'Continue Quest'} <span>→</span>
          </button>
        </div>
      </section>

      {/* ============================================================
         SECTION 4: HERO PROFILE
         ============================================================ */}
      <section className="hero-profile-section">
        <div className="hero-profile-card" onClick={() => navigate('/hero-profile')}>
          <div className="hp-top">
            <div className="hp-avatar">
              <div className="hp-avatar-inner">🎭</div>
            </div>
            <div className="hp-identity">
              <div className="hp-name">Your Hero Profile</div>
              <div className="hp-tagline">
                {archetypes?.essence?.name || 'Essence'} + {archetypes?.protective?.name ? `The ${archetypes.protective.name}` : 'Protective'}
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

          <div className="hp-superpower">
            <span className="hp-superpower-bolt">⚡</span>
            <p className="hp-superpower-text">
              <strong>Superpower:</strong> {archetypes?.essence?.superpower || 'Discover your superpower through the archetype quiz'}
            </p>
          </div>

          <div className="hp-divider" />

          {/* Protective */}
          <div className="hp-protective">
            <div className="hp-protective-diagram">
              <svg viewBox="0 0 56 56">
                <circle className="attempt-circle attempt-1" cx="28" cy="28" r="25" />
                <circle className="attempt-circle attempt-2" cx="28" cy="28" r="20" />
                <circle className="attempt-circle attempt-3" cx="28" cy="28" r="15" />
              </svg>
              <div className="hp-protective-pct">{hasVoiceData ? `${protectivePct}%` : '--%'}</div>
            </div>
            <div className="hp-protective-info">
              <div className="hp-protective-name">
                {archetypes?.protective?.name ? `The ${archetypes.protective.name}` : 'Your Protective Voice'}
              </div>
              {protectivePattern && (
                <div className="hp-protective-tag">{protectivePattern}</div>
              )}
              <div className="hp-protective-desc">
                {archetypes?.protective?.summary || 'Complete the archetype quiz to discover your protective pattern'}
              </div>
            </div>
          </div>

          {archetypes?.protective?.coreNarrative && (
            <div className="hp-belief">
              <span className="hp-belief-icon">🔇</span>
              <p className="hp-belief-text">
                <strong>It whispers:</strong> "{archetypes.protective.coreNarrative}"
              </p>
            </div>
          )}

          <div className="hp-full-link">
            View full Hero Profile <span>→</span>
          </div>
        </div>
      </section>
    </div>
  )
}
