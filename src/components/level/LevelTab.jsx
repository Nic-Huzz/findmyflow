/**
 * LevelTab.jsx
 *
 * Main template component for rendering any level from config.
 * Composes: SweetSpotGraph, ZoneDiagnosis, DeepDiveCard,
 * BossFightCard, MilestoneCard, ProgressBars.
 *
 * Phase 4: all state is local/placeholder. Phase 5 will wire to DB.
 *
 * Created: 2026-03-27
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/AuthProvider'
import confetti from 'canvas-confetti'
import { getLevelConfig, LEVEL_CONFIG } from './LevelConfig'
import { STATES, STATE_META } from '../LifePathMap/lifePaths'
import QuestBoardCard from '../QuestBoardCard'
import DeepDiveCard from './DeepDiveCard'
import BossFightCard from './BossFightCard'
import MilestoneCard from './MilestoneCard'
import MilestoneCommitModal from './MilestoneCommitModal'
import MilestoneReflectModal from './MilestoneReflectModal'
import ProgressBars from './ProgressBars'
import SweetSpotGraph from './SweetSpotGraph'
import CapacityCard from './CapacityCard'
import JourneyGraphPopup from '../JourneyGraphPopup'
import './LevelTab.css'

export default function LevelTab({ currentLevel = 1, maxUnlockedLevel = null, userId = null, capacityRefresh = 0, onLevelChange = null, onNavigateTab = null, onGraduate = null }) {
  const { user } = useAuth()
  // maxUnlockedLevel is the user's actual journey level from DB. currentLevel is which level they're viewing.
  const unlockedLevel = maxUnlockedLevel ?? currentLevel
  const config = getLevelConfig(currentLevel)

  // DB-backed zone state (reads from user_level_progress if available)
  const [selectedZone, setSelectedZone] = useState(null)
  const [boss, setBoss] = useState(null)
  const [zoneLoaded, setZoneLoaded] = useState(false)
  const [hasEssenceAvatar, setHasEssenceAvatar] = useState(false)
  const [hasLifeMap, setHasLifeMap] = useState(false)
  const [hasCareerClarity, setHasCareerClarity] = useState(false)
  const [showJourney, setShowJourney] = useState(false)
  const [hasPeopleMatching, setHasPeopleMatching] = useState(false)
  const [hasHealingCompass, setHasHealingCompass] = useState(false)
  const [hasPlaylistUpdate, setHasPlaylistUpdate] = useState(false)
  const [hasFlowDeepDive, setHasFlowDeepDive] = useState({}) // generic tracker for flow-based deep dives
  const [hasWoundMap, setHasWoundMap] = useState(false)
  const [hasLifePaths, setHasLifePaths] = useState(false)
  const [lifePathCareers, setLifePathCareers] = useState([]) // careers from life_path_sessions

  // Quest board state
  const [quests, setQuests] = useState([])
  const [questTasks, setQuestTasks] = useState({}) // { questId: [tasks] }
  const [showAddQuest, setShowAddQuest] = useState(false)
  const [addQuestLabel, setAddQuestLabel] = useState('')
  const [addQuestState, setAddQuestState] = useState(null)
  const [addQuestSaving, setAddQuestSaving] = useState(false)
  const [addQuestCareerId, setAddQuestCareerId] = useState(null) // career_id from life paths dropdown
  const [addQuestCustom, setAddQuestCustom] = useState(false) // true = typing new path, false = picked from dropdown
  const [activeStruggle, setActiveStruggle] = useState(null) // which struggle pill is open
  const [allLevelProgress, setAllLevelProgress] = useState({}) // { level: { zone, milestone_completed, ... } }
  const [zoneModalLevel, setZoneModalLevel] = useState(null) // which zone card modal is open
  const [hasCuriosityCompass, setHasCuriosityCompass] = useState(false)
  const [hasHealingCompletion, setHasHealingCompletion] = useState(false)
  const [hasPlaylistCompletion, setHasPlaylistCompletion] = useState(false)
  const [hasPlaySkills, setHasPlaySkills] = useState(false)
  const [hasWahoos, setHasWahoos] = useState(false)
  const [tuneDaysDone, setTuneDaysDone] = useState(0)
  const [courageDone, setCourageDone] = useState(0)
  const [healingDone, setHealingDone] = useState(0)

  // Milestone state
  const [milestoneCommitment, setMilestoneCommitment] = useState(null)
  const [milestoneCompleted, setMilestoneCompleted] = useState(false)
  const [showCommitModal, setShowCommitModal] = useState(false)
  const [showReflectModal, setShowReflectModal] = useState(false)
  const [graduatedTo, setGraduatedTo] = useState(null)

  // Load quests + tasks
  const loadQuests = useCallback(async () => {
    if (!userId) return
    const { data: questData } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
    if (questData) {
      setQuests(questData)
      // Load tasks for all quests
      const questIds = questData.map(q => q.id)
      if (questIds.length > 0) {
        const { data: taskData } = await supabase
          .from('quest_tasks')
          .select('*')
          .in('quest_id', questIds)
          .order('sort_order', { ascending: true })
        if (taskData) {
          const grouped = {}
          taskData.forEach(t => {
            if (!grouped[t.quest_id]) grouped[t.quest_id] = []
            grouped[t.quest_id].push(t)
          })
          setQuestTasks(grouped)
        }
      }
    }
  }, [userId])

  // Add quest
  const handleAddQuest = async () => {
    if (!addQuestLabel.trim() || !addQuestState || addQuestSaving) return
    // Prevent duplicate quest labels
    if (quests.some(q => q.label.toLowerCase() === addQuestLabel.trim().toLowerCase() && q.status === 'active')) return
    setAddQuestSaving(true)
    try {
      const { error } = await supabase.from('quests').insert({
        user_id: userId,
        label: addQuestLabel.trim(),
        career_id: addQuestCareerId || null,
        predicted_state: addQuestState,
        status: 'active',
        sort_order: quests.length,
      })
      if (error) console.error('Add quest error:', error)
      else {
        // Award 2 RP for adding a quest
        await supabase.from('quest_completions').insert({
          user_id: userId,
          quest_id: `quest_created_${Date.now()}`,
          quest_category: 'Quests',
          quest_type: 'Practice',
          points_earned: 2,
          challenge_day: 0,
          project_id: null,
        })
        setAddQuestLabel('')
        setAddQuestState(null)
        setAddQuestCareerId(null)
        setShowAddQuest(false)
        setAddQuestCustom(false)
        loadQuests()
      }
    } catch (e) { console.error('Add quest error:', e) }
    setAddQuestSaving(false)
  }

  useEffect(() => {
    if (!userId) {
      setZoneLoaded(true)
      return
    }
    // Load zone + milestone data
    supabase
      .from('user_level_progress')
      .select('zone_diagnosis_zone, zone_diagnosis_boss, milestone_commitment, milestone_completed')
      .eq('user_id', userId)
      .eq('current_level', currentLevel)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSelectedZone(data.zone_diagnosis_zone)
          setBoss(data.zone_diagnosis_boss)
          setMilestoneCommitment(data.milestone_commitment || null)
          setMilestoneCompleted(data.milestone_completed || false)
        } else {
          setMilestoneCommitment(null)
          setMilestoneCompleted(false)
        }
        setZoneLoaded(true)
      })
      .catch(() => setZoneLoaded(true))
    // Check if hero avatar photo exists (from essence mirror)
    supabase
      .from('lead_flow_profiles')
      .select('custom_essence_image')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]?.custom_essence_image) {
          setHasEssenceAvatar(true)
        }
      })
    // Check if life map completed
    supabase
      .from('flow_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('flow_type', 'life_map')
      .eq('status', 'completed')
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasLifeMap(true)
      })
    // Check if career clarity quiz completed
    supabase
      .from('quiz_results')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasCareerClarity(true)
      })
    // Check if people matching completed (saved favourites in localStorage)
    try {
      const savedPeople = localStorage.getItem('findmyflow_saved_people')
      if (savedPeople && JSON.parse(savedPeople).length > 0) setHasPeopleMatching(true)
    } catch (e) { /* ignore parse errors */ }
    // Check if playlist update completed (has identify_topics rows from life_map source)
    supabase
      .from('nikigai_clusters')
      .select('id')
      .eq('user_id', userId)
      .eq('step_id', 'identify_topics')
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasPlaylistUpdate(true)
      })
    // Check if healing compass completed
    supabase
      .from('healing_compass_responses')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasHealingCompass(true)
      })
    // Check flow-based deep dives (matrix_codes, nervous_system, limiting_belief_rewire)
    supabase
      .from('quest_completions')
      .select('quest_id')
      .eq('user_id', userId)
      .in('quest_id', ['recognise_shadow_work', 'nervous_system_map', 'limiting_belief_rewire'])
      .then(({ data }) => {
        if (data) {
          const completed = {}
          data.forEach(d => { completed[d.quest_id] = true })
          setHasFlowDeepDive(completed)
        }
      })
    // Check if wound map completed (4 stage selections)
    supabase
      .from('journey_onboarding_selections')
      .select('id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data?.length >= 4) {
          setHasWoundMap(true)
        }
      })
    // Check if life paths session exists
    if (user?.email) {
      supabase
        .from('life_path_sessions')
        .select('id, careers, current_career, current_state')
        .eq('client_email', user.email)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setHasLifePaths(true)
            if (data.careers?.length) setLifePathCareers(data.careers)
          }
        })
    }
    // Load quests + tasks
    loadQuests()
    // Load all level progress for zone + milestone scroll strips
    supabase
      .from('user_level_progress')
      .select('current_level, zone_diagnosis_zone, zone_diagnosis_boss, milestone_commitment, milestone_completed')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          const byLevel = {}
          data.forEach(d => { byLevel[d.current_level] = d })
          setAllLevelProgress(byLevel)
        }
      })

    // Check if playskills exist (from /get-started, curiosity compass, or PlaySkillPicker)
    supabase
      .from('nikigai_clusters')
      .select('id, step_id')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
      // No step_id filter — picks up skills from PlaySkillPicker, Life Map, etc.
      .then(({ data }) => {
        if (data?.length > 0) {
          if (data.some(d => d.step_id === 'get_started')) setHasPlaySkills(true)
          if (data.some(d => d.step_id === 'curiosity_compass')) setHasCuriosityCompass(true)
        }
      })
    // Check if wahoos identified (Wahoo Discovery flow or quick-add)
    supabase
      .from('groan_challenges')
      .select('id')
      .eq('user_id', userId)
      .not('wahoo_category', 'is', null)
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasWahoos(true)
      })
    // Check if any healing quest has been completed
    supabase
      .from('quest_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('quest_category', 'Healing')
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) setHasHealingCompletion(true)
      })
    // Load tune day dates + courage challenge progress for current level
    supabase
      .from('user_level_progress')
      .select('healing_day_dates, courage_challenge_ids, healing_quest_ids')
      .eq('user_id', userId)
      .eq('current_level', currentLevel)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.healing_day_dates?.length) {
          setTuneDaysDone(data.healing_day_dates.length)
        }
        if (data?.courage_challenge_ids?.length) {
          setCourageDone(data.courage_challenge_ids.length)
        }
        if (data?.healing_quest_ids?.length) {
          setHealingDone(data.healing_quest_ids.length)
        }
      })
    // Check if topic identifier has been completed (nikigai_clusters with identify_topics)
    supabase
      .from('nikigai_clusters')
      .select('id')
      .eq('user_id', userId)
      .eq('step_id', 'identify_topics')
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) {
          setHasPlaylistCompletion(true)
        }
      })
  }, [userId, currentLevel])

  const levelQuests = [
    ...(config.zones ? [{ label: 'Zone Diagnosis', done: !!selectedZone }] : []),
    ...(config.deepDive ? [{ label: config.deepDive.name, done:
      config.deepDive.id === 'life_paths' ? hasLifePaths
      : config.deepDive.id === 'hero_avatar' ? hasEssenceAvatar
      : config.deepDive.id === 'life_map' ? hasLifeMap
      : config.deepDive.id === 'healing_compass' ? hasHealingCompass
      : config.deepDive.id === 'career_clarity' ? hasCareerClarity
      : hasFlowDeepDive[config.deepDive.id] || false
    }] : []),
    ...(config.extraQuests || []).map(q => ({
      label: q.name,
      done: q.id === 'hero_avatar' ? hasEssenceAvatar
        : q.id === 'wound_map' ? hasWoundMap
        : q.id === 'curiosity_compass' ? hasCuriosityCompass
        : q.id === 'find_wahoos' ? (hasWahoos || hasPlaySkills || hasCuriosityCompass)
        : q.id === 'healing_task' ? hasHealingCompletion
        : q.id === 'playlist_challenge' ? (config.courageCount > 0 ? courageDone >= config.courageCount : hasPlaylistCompletion)
        : q.id === 'healing_challenge' ? (config.courageCount > 0 ? healingDone >= config.courageCount : false)
        : q.id === 'people_matching' ? hasPeopleMatching
        : false,
    })),
    ...(boss ? [{ label: 'Boss Fight', done: false }] : []),
    ...(config.milestone ? [{ label: 'Milestone', done: milestoneCompleted }] : []),
    { label: 'Tune Days', done: tuneDaysDone >= (config.tuneDaysRequired || 14) },
  ]
  const questsCompleted = levelQuests.filter(q => q.done).length
  const allQuestsDone = levelQuests.length > 0 && questsCompleted === levelQuests.length

  // Auto-graduate to next level when all quests complete
  // Guard: wait for zone data to load before evaluating (prevents race condition on level change)
  useEffect(() => {
    if (!allQuestsDone || !userId || currentLevel > 7 || !zoneLoaded) return
    // Extra guard: if level has zones, require selectedZone to be set
    if (config.zones && !selectedZone) return
    // Extra guard: if level has deepDive, ensure it's checked
    if (config.deepDive && levelQuests.find(q => q.label === config.deepDive.name && !q.done)) return

    supabase
      .from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        const dbLevel = data?.current_journey_level || 0
        if (dbLevel === currentLevel) {
          supabase
            .from('user_stage_progress')
            .update({ current_journey_level: currentLevel + 1 })
            .eq('user_id', userId)
            .then(() => {
              const nextLevel = currentLevel + 1
              console.log(`Graduated from Level ${currentLevel} to Level ${nextLevel}`)
              setGraduatedTo(nextLevel)
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
              setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 } }), 300)
              onGraduate?.(nextLevel)
            })
        }
      })
  }, [allQuestsDone, userId, currentLevel, zoneLoaded])

  return (
    <div className="level-tab">

      {/* ══════ QUEST BOARD ══════ */}

      {/* Your Journey — only show if any item is incomplete */}
      {(!hasLifeMap || !hasLifePaths || !hasEssenceAvatar || !(hasWahoos || hasPlaySkills) || !hasHealingCompletion) && (
        <div className="quest-section">
          <div className="quest-section-header">
            <span className="quest-section-icon">📖</span>
            <span className="quest-section-title">Your Journey</span>
          </div>
          {!hasLifeMap && (
            <DeepDiveCard deepDive={{ id: 'life_map', name: 'Life Map', route: '/life-map', narrative: 'Your life story holds the answers.', icon: '📖' }} isCompleted={false} />
          )}
          {!hasLifePaths && (
            <DeepDiveCard deepDive={{ id: 'life_paths', name: 'Map Your Life Paths', route: '/life-paths', narrative: 'See which life paths are open to you right now.', icon: '🗺️' }} isCompleted={false} />
          )}
          {!hasEssenceAvatar && (
            <DeepDiveCard deepDive={{ id: 'hero_avatar', name: 'Create Your Hero Avatar', route: '/essence-mirror', narrative: 'Define who you are.', icon: '🦸' }} isCompleted={false} />
          )}
          {!(hasWahoos || hasPlaySkills) && (
            <DeepDiveCard deepDive={{ id: 'find_wahoos', name: 'Unlock Your Courage Tab', route: '#Courage', narrative: 'Name what would light you up.', icon: '🔥' }} isCompleted={false} onNavigate={onNavigateTab} />
          )}
          {!hasHealingCompletion && (
            <DeepDiveCard deepDive={{ id: 'healing_task', name: 'Unlock Your Healing Tab', route: '#Healing', narrative: 'Complete your first healing quest.', icon: '💚' }} isCompleted={false} onNavigate={onNavigateTab} />
          )}
        </div>
      )}

      {/* Active Quests */}
      <div className="quest-section">
        <div className="quest-section-header">
          <span className="quest-section-icon">⚔️</span>
          <span className="quest-section-title">Active Quests</span>
        </div>
        <p className="quest-section-sub">Life paths you're actively pursuing right now.</p>
        {quests.filter(q => q.status === 'active').length === 0 && (
          <div className="quest-empty">Complete your Life Paths exercise to identify quests, or add one manually.</div>
        )}
        {quests.filter(q => q.status === 'active').map(q => (
          <QuestBoardCard key={q.id} quest={q} tasks={questTasks[q.id] || []} userId={userId} onUpdate={loadQuests} />
        ))}
        {!showAddQuest ? (
          <button className="quest-add-btn" onClick={() => setShowAddQuest(true)}>+ Add Quest</button>
        ) : (
          <div className="quest-add-modal">
            <div className="quest-add-title">What life path are you pursuing?</div>
            {lifePathCareers.length > 0 && !addQuestCustom ? (
              <>
                <select className="quest-add-select"
                  value={addQuestLabel}
                  onChange={e => {
                    const career = lifePathCareers.find(c => c.label === e.target.value)
                    setAddQuestLabel(e.target.value)
                    setAddQuestCareerId(career?.id || null)
                    if (career?.predictedState) setAddQuestState(career.predictedState)
                  }}>
                  <option value="">Select a life path...</option>
                  {lifePathCareers
                    .filter(c => !quests.some(q => q.career_id === c.id && q.status === 'active'))
                    .map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
                <button className="quest-add-other" onClick={() => { setAddQuestCustom(true); setAddQuestLabel(''); setAddQuestState(null); setAddQuestCareerId(null) }}>
                  Or add a new path...
                </button>
              </>
            ) : (
              <>
                <input className="quest-add-input" type="text" value={addQuestLabel}
                  onChange={e => setAddQuestLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addQuestState && handleAddQuest()}
                  placeholder="e.g. Run retreats..." autoFocus />
                {lifePathCareers.length > 0 && (
                  <button className="quest-add-other" onClick={() => { setAddQuestCustom(false); setAddQuestLabel(''); setAddQuestState(null) }}>
                    Pick from life paths...
                  </button>
                )}
                <div className="quest-add-subtitle">What state does it trigger?</div>
                <div className="quest-add-states">
                  {[...STATES].reverse().map(s => {
                    const m = STATE_META[s]
                    const isActive = addQuestState === s
                    return (
                      <button key={s} className={`quest-state-pill ${isActive ? 'active' : ''}`}
                        style={isActive ? { borderColor: m.color, color: m.color, background: `${m.color}10` } : undefined}
                        onClick={() => setAddQuestState(s)}>
                        {m.emoji} {m.label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            <div className="quest-add-actions">
              <button className="quest-add-submit" onClick={handleAddQuest}
                disabled={!addQuestLabel.trim() || !addQuestState || addQuestSaving}>Add Quest</button>
              <button className="quest-add-cancel" onClick={() => { setShowAddQuest(false); setAddQuestLabel(''); setAddQuestState(null); setAddQuestCareerId(null); setAddQuestCustom(false) }}>Cancel</button>
            </div>
          </div>
        )}
        <div className="quest-recommend">We recommend focusing on 1-3 quests at a time</div>
      </div>

      {/* Struggle Pills */}
      <div className="quest-section">
        <div className="quest-section-header">
          <span className="quest-section-icon">🧭</span>
          <span className="quest-section-title">I need help with...</span>
        </div>
        <div className="struggle-pills">
          <button className={`struggle-pill ${activeStruggle === 'direction' ? 'active' : ''}`}
            onClick={() => setActiveStruggle(activeStruggle === 'direction' ? null : 'direction')}>
            🧭 Should I start my own thing?
          </button>
          <button className={`struggle-pill ${activeStruggle === 'fear' ? 'active' : ''}`}
            onClick={() => setActiveStruggle(activeStruggle === 'fear' ? null : 'fear')}>
            😨 What's keeping me stuck?
          </button>
        </div>

        {activeStruggle === 'direction' && (
          <div className="struggle-flows">
            <DeepDiveCard deepDive={{ id: 'career_clarity', name: 'Career Clarity Quiz', route: '/career-clarity', narrative: 'Should you stay, pivot, or build?', icon: '🧭' }} isCompleted={hasCareerClarity} />
          </div>
        )}

        {activeStruggle === 'fear' && (
          <div className="struggle-flows">
            <DeepDiveCard deepDive={{ id: 'wound_map', name: 'Map Your Origin Story', route: '/wound-map?returnTo=/7-day-challenge', narrative: 'What happened before you arrived here?', icon: '🗺️' }} isCompleted={hasWoundMap} />
            <DeepDiveCard deepDive={{ id: 'matrix_codes', name: 'Matrix Codes', route: '/matrix-code-deep-dive', narrative: 'What permission are you missing?', icon: '🔓' }} isCompleted={!!hasFlowDeepDive['recognise_shadow_work']} />
            <DeepDiveCard deepDive={{ id: 'nervous_system', name: 'NS Boundaries', route: '/nervous-system', narrative: 'Where does your nervous system say stop?', icon: '🧠' }} isCompleted={!!hasFlowDeepDive['nervous_system_map']} />
          </div>
        )}
      </div>

      {/* Zone Assessments — horizontal scroll */}
      <div className="quest-section">
        <div className="quest-section-header">
          <span className="quest-section-icon">📊</span>
          <span className="quest-section-title">Zone Assessments</span>
        </div>
        <div className="quest-scroll-strip">
          {Object.entries(LEVEL_CONFIG).filter(([n]) => parseInt(n) >= 1 && parseInt(n) <= 8).map(([num, lvl]) => {
            const n = parseInt(num)
            const progress = allLevelProgress[n]
            const hasZone = !!progress?.zone_diagnosis_zone
            return (
              <button key={n} className={`quest-scroll-card ${hasZone ? 'completed' : ''}`}
                onClick={() => setZoneModalLevel(n)}>
                <div className="quest-scroll-label">{lvl.name}</div>
                {hasZone && <div className="quest-scroll-check">✅</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Zone Modal */}
      {zoneModalLevel && (() => {
        const lvl = LEVEL_CONFIG[zoneModalLevel]
        const progress = allLevelProgress[zoneModalLevel]
        return (
          <div className="quest-modal-overlay" onClick={() => setZoneModalLevel(null)}>
            <div className="quest-modal" onClick={e => e.stopPropagation()}>
              <button className="quest-modal-close" onClick={() => setZoneModalLevel(null)}>✕</button>
              <h2 className="quest-modal-title">{lvl.name}</h2>
              <p className="quest-modal-question">{lvl.question}</p>

              {lvl.graph && lvl.zones && (
                <div style={{ margin: '0 0 14px' }}>
                  <SweetSpotGraph title={lvl.graph} yAxis={lvl.yAxis} xAxis={lvl.xAxis} zones={lvl.zones} />
                </div>
              )}

              {progress?.zone_diagnosis_zone ? (
                <div className="quest-modal-result">
                  <div className="quest-modal-result-label">Your zone:</div>
                  <div className="quest-modal-result-name">{lvl.zones?.[progress.zone_diagnosis_zone]?.name}</div>
                  <div className="quest-modal-result-desc">{lvl.zones?.[progress.zone_diagnosis_zone]?.description}</div>
                </div>
              ) : null}

              <a href={`/zone-diagnosis/${zoneModalLevel}?returnTo=/7-day-challenge`}
                className="quest-modal-cta" style={{ textDecoration: 'none' }}>
                {progress?.zone_diagnosis_zone ? 'Retake Zone Diagnosis' : 'Start Zone Diagnosis'} →
              </a>

              {lvl.zones?.[progress?.zone_diagnosis_zone]?.boss && (
                <div className="quest-modal-boss">
                  <div className="quest-modal-boss-label">Boss Fight:</div>
                  <div className="quest-modal-boss-name">{lvl.zones[progress.zone_diagnosis_zone].boss}</div>
                </div>
              )}

              {lvl.essenceQuestion && (
                <p className="quest-modal-essence">{lvl.essenceQuestion}</p>
              )}
            </div>
          </div>
        )
      })()}

      {/* Completed — Life Map, Life Paths (viewable), closed quests */}
      {(quests.some(q => q.status !== 'active') || hasLifeMap || hasLifePaths) && (
        <div className="quest-section quest-completed-section">
          <div className="quest-section-header">
            <span className="quest-section-icon">✅</span>
            <span className="quest-section-title">Completed</span>
          </div>
          {hasLifeMap && (
            <DeepDiveCard deepDive={{ id: 'life_map', name: 'Life Map', route: '/life-map', narrative: 'Your life story.', icon: '📖' }} isCompleted={true} />
          )}
          {hasLifePaths && (
            <DeepDiveCard deepDive={{ id: 'life_paths', name: 'Map Your Life Paths', route: '/life-paths', narrative: 'See which life paths are open to you right now.', icon: '🗺️' }} isCompleted={true} />
          )}
          {quests.filter(q => q.status !== 'active').map(q => (
            <div key={q.id} className="quest-closed-item">
              <span className="quest-closed-icon">{q.close_reason === 'achieved' ? '🎉' : q.close_reason === 'lost_interest' ? '🤔' : '⏳'}</span>
              <span className="quest-closed-label">{q.label}</span>
              <span className="quest-closed-status">{q.close_reason === 'achieved' ? 'Achieved' : q.close_reason === 'lost_interest' ? 'Lost interest' : 'Paused'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Graduation overlay (must be outside hidden wrapper) */}
      {graduatedTo !== null && (
        <div className="level-graduation-overlay" onClick={() => setGraduatedTo(null)}>
          <div className="level-graduation-card" onClick={e => e.stopPropagation()}>
            <div className="level-graduation-emoji">🎓</div>
            <h2 className="level-graduation-title">Level {graduatedTo} Unlocked!</h2>
            <p className="level-graduation-subtitle">
              You completed Level {graduatedTo - 1}. Time for the next chapter.
            </p>
            <button className="level-graduation-btn" onClick={() => {
              setGraduatedTo(null)
              onLevelChange?.(graduatedTo)
            }}>
              Go to Level {graduatedTo}
            </button>
          </div>
        </div>
      )}

      {/* ══════ OLD LEVEL CONTENT (hidden, kept for backwards compat) ══════ */}
      <div style={{ display: 'none' }}>

      {/* Level Selector */}
      <div className="level-selector">
        {Object.entries(LEVEL_CONFIG).map(([num, lvl]) => {
          const n = parseInt(num)
          const isCurrent = n === currentLevel
          const isLocked = n > unlockedLevel
          return (
            <button
              key={n}
              className={`level-selector-pill ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => !isLocked && onLevelChange?.(n)}
              disabled={isLocked}
            >
              {isLocked ? '🔒' : n}
            </button>
          )
        })}
      </div>

      {/* Capacity Score moved to Tune tab */}

      {/* Level Header */}
      <div className="level-header-card">
        <div className="level-header-name">
          Level {currentLevel}: {config.name}
        </div>
        <div className="level-header-question">{config.question}</div>
        <button className="level-journey-btn" onClick={() => setShowJourney(true)}>🧭 Journey</button>
        {boss && (
          <div className="level-header-boss">
            &#9876;&#65039; Fighting: {boss}
          </div>
        )}
      </div>

      {/* Zone Diagnosis — links to flow (not for Level 0) */}
      {config.zones && <div className="level-zone-diagnosis">
        <h3 className="level-section-title">Where are you on this level?</h3>
        {selectedZone ? (
          <div className="level-zone-result">
            <div className="level-zone-result-name">
              {config.zones[selectedZone]?.name}
            </div>
            <div className="level-zone-result-desc">
              {config.zones[selectedZone]?.description}
            </div>
            <a
              href={`/zone-diagnosis/${currentLevel}?returnTo=/7-day-challenge`}
              className="level-dd-status start"
              style={{ textDecoration: 'none', display: 'inline-block', marginTop: '0.75rem' }}
            >
              Retake
            </a>
          </div>
        ) : (
          <a
            href={`/zone-diagnosis/${currentLevel}?returnTo=/7-day-challenge`}
            className="level-zone-cta"
            style={{ textDecoration: 'none' }}
          >
            Start Zone Diagnosis <span>→</span>
          </a>
        )}
      </div>}

      {/* Deep Dive */}
      <DeepDiveCard deepDive={config.deepDive} isCompleted={config.deepDive?.id === 'life_paths' ? hasLifePaths : config.deepDive?.id === 'hero_avatar' ? hasEssenceAvatar : config.deepDive?.id === 'life_map' ? hasLifeMap : config.deepDive?.id === 'career_clarity' ? hasCareerClarity : config.deepDive?.id === 'healing_compass' ? hasHealingCompass : config.deepDive?.id === 'matrix_codes' ? !!hasFlowDeepDive['recognise_shadow_work'] : config.deepDive?.id === 'nervous_system' ? !!hasFlowDeepDive['nervous_system_map'] : config.deepDive?.id === 'limiting_belief_rewire' ? !!hasFlowDeepDive['limiting_belief_rewire'] : false} />

      {/* Extra Quests (Level-specific) */}
      {config.extraQuests?.map(quest => {
        const isCompleted =
          quest.id === 'life_paths' ? hasLifePaths
          : quest.id === 'hero_avatar' ? hasEssenceAvatar
          : quest.id === 'wound_map' ? hasWoundMap
          : quest.id === 'curiosity_compass' ? hasCuriosityCompass
          : quest.id === 'find_wahoos' ? (hasWahoos || hasPlaySkills || hasCuriosityCompass)
          : quest.id === 'healing_task' ? hasHealingCompletion
          : quest.id === 'playlist_challenge' ? (config.courageCount > 0 ? courageDone >= config.courageCount : hasPlaylistCompletion)
          : quest.id === 'healing_challenge' ? (config.courageCount > 0 ? healingDone >= config.courageCount : false)
          : quest.id === 'people_matching' ? hasPeopleMatching
          : quest.id === 'playlist_update' ? hasPlaylistUpdate
          : false
        const isLocked = (quest.lockedUntil === 'curiosity_compass' && !hasCuriosityCompass) || (quest.lockedUntil === 'life_paths' && !hasLifePaths)

        // Play-List Challenge with dot tracking (levels 1+)
        if (quest.id === 'playlist_challenge' && currentLevel > 0 && config.courageCount > 0) {
          // courageDone loaded from user_level_progress.courage_challenge_ids
          const courageTarget = config.courageCount
          const wahooComplete = courageDone >= courageTarget
          return (
            <div key={quest.id} className={`level-deep-dive ${wahooComplete ? 'completed' : ''}`}>
              <div className="level-dd-icon">{wahooComplete ? '✅' : quest.icon}</div>
              <div className="level-dd-info">
                <div className="level-dd-name">{quest.name}</div>
                <div className="level-dd-narrative">Complete {courageTarget} courage challenge{courageTarget > 1 ? 's' : ''}</div>
                {!wahooComplete && (
                  <div className="level-bar-dots" style={{ marginTop: '0.5rem' }}>
                    {Array.from({ length: courageTarget }).map((_, i) => (
                      <div key={i} className={`level-bar-dot ${i < courageDone ? 'filled' : ''}`} />
                    ))}
                  </div>
                )}
              </div>
              {wahooComplete ? (
                <span className="level-dd-status done">Done</span>
              ) : (
                <button
                  className="level-dd-status start"
                  onClick={() => onNavigateTab?.('Courage')}
                  style={{ cursor: 'pointer' }}
                >
                  {courageDone > 0 ? `${courageDone}/${courageTarget}` : 'Start'}
                </button>
              )}
            </div>
          )
        }

        // Weekly Healing Task with dot tracking (levels 1+)
        if (quest.id === 'healing_challenge' && currentLevel > 0 && config.courageCount > 0) {
          const healingTarget = config.courageCount
          const healingComplete = healingDone >= healingTarget
          return (
            <div key={quest.id} className={`level-deep-dive ${healingComplete ? 'completed' : ''}`}>
              <div className="level-dd-icon">{healingComplete ? '✅' : quest.icon}</div>
              <div className="level-dd-info">
                <div className="level-dd-name">{quest.name}</div>
                <div className="level-dd-narrative">Complete {healingTarget} weekly healing quest{healingTarget > 1 ? 's' : ''}</div>
                {!healingComplete && (
                  <div className="level-bar-dots" style={{ marginTop: '0.5rem' }}>
                    {Array.from({ length: healingTarget }).map((_, i) => (
                      <div key={i} className={`level-bar-dot ${i < healingDone ? 'filled' : ''}`} />
                    ))}
                  </div>
                )}
              </div>
              {healingComplete ? (
                <span className="level-dd-status done">Done</span>
              ) : (
                <button
                  className="level-dd-status start"
                  onClick={() => onNavigateTab?.('Healing')}
                  style={{ cursor: 'pointer' }}
                >
                  {healingDone > 0 ? `${healingDone}/${healingTarget}` : 'Start'}
                </button>
              )}
            </div>
          )
        }

        const questWithRoute = quest.navigateTo
          ? { ...quest, route: `#${quest.navigateTo}` }
          : quest
        return (
          <DeepDiveCard
            key={quest.id}
            deepDive={isLocked ? { ...quest, route: null } : questWithRoute}
            isCompleted={isCompleted}
            onNavigate={onNavigateTab}
          />
        )
      })}

      {/* Boss Fight */}
      {boss && <BossFightCard boss={boss} condition={config.name} zone={selectedZone && config.zones?.[selectedZone]?.name} isCompleted={false} />}

      {/* Milestone */}
      <MilestoneCard
        milestone={config.milestone}
        isCompleted={milestoneCompleted}
        commitment={milestoneCommitment}
        onCommit={() => setShowCommitModal(true)}
        onDidIt={() => setShowReflectModal(true)}
      />

      {/* Milestone Modals */}
      {showCommitModal && config.milestone && (
        <MilestoneCommitModal
          level={currentLevel}
          milestone={config.milestone}
          diagonal={config.zones?.diagonal}
          userId={userId}
          onSave={(text) => setMilestoneCommitment(text)}
          onClose={() => setShowCommitModal(false)}
        />
      )}
      {showReflectModal && config.milestone && (
        <MilestoneReflectModal
          level={currentLevel}
          milestone={config.milestone}
          commitment={milestoneCommitment}
          userId={userId}
          onComplete={() => setMilestoneCompleted(true)}
          onClose={() => setShowReflectModal(false)}
        />
      )}

      {/* Progress Bars */}
      <ProgressBars
        levelQuests={levelQuests}
        courageCount={config.courageCount || 0}
        courageDone={courageDone}
        questsCompleted={questsCompleted}
      />


      {showJourney && (
        <JourneyGraphPopup
          isOpen={showJourney}
          onClose={() => setShowJourney(false)}
          currentLevel={currentLevel}
        />
      )}
      </div>{/* end hidden wrapper */}
    </div>
  )
}
