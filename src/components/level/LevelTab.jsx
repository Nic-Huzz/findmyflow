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

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/AuthProvider'
import confetti from 'canvas-confetti'
import { getLevelConfig, LEVEL_CONFIG } from './LevelConfig'
import DeepDiveCard from './DeepDiveCard'
import BossFightCard from './BossFightCard'
import MilestoneCard from './MilestoneCard'
import MilestoneCommitModal from './MilestoneCommitModal'
import MilestoneReflectModal from './MilestoneReflectModal'
import ProgressBars from './ProgressBars'
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
        .select('id')
        .eq('client_email', user.email)
        .limit(1)
        .then(({ data }) => { if (data?.length > 0) setHasLifePaths(true) })
    }
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
                  onClick={() => onNavigateTab?.('Wahoo')}
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


      {/* Graduation overlay */}
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

      {showJourney && (
        <JourneyGraphPopup
          isOpen={showJourney}
          onClose={() => setShowJourney(false)}
          currentLevel={currentLevel}
        />
      )}
    </div>
  )
}
