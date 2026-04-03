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
import { getLevelConfig, LEVEL_CONFIG } from './LevelConfig'
import DeepDiveCard from './DeepDiveCard'
import BossFightCard from './BossFightCard'
import MilestoneCard from './MilestoneCard'
import ProgressBars from './ProgressBars'
import './LevelTab.css'

export default function LevelTab({ currentLevel = 1, userId = null, onLevelChange = null, onNavigateTab = null }) {
  const config = getLevelConfig(currentLevel)

  // DB-backed zone state (reads from user_level_progress if available)
  const [selectedZone, setSelectedZone] = useState(null)
  const [boss, setBoss] = useState(null)
  const [zoneLoaded, setZoneLoaded] = useState(false)
  const [hasEssenceAvatar, setHasEssenceAvatar] = useState(false)
  const [hasTensionScores, setHasTensionScores] = useState(false)
  const [hasCuriosityCompass, setHasCuriosityCompass] = useState(false)

  useEffect(() => {
    if (!userId) {
      setZoneLoaded(true)
      return
    }
    // Load zone data
    supabase
      .from('user_level_progress')
      .select('zone_selected, boss_name')
      .eq('user_id', userId)
      .eq('level', currentLevel)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSelectedZone(data.zone_selected)
          setBoss(data.boss_name)
        }
        setZoneLoaded(true)
      })
      .catch(() => setZoneLoaded(true))
    // Check if hero avatar already created (from essence mirror)
    supabase
      .from('lead_flow_profiles')
      .select('custom_essence_name, custom_essence_image')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.custom_essence_image) {
          setHasEssenceAvatar(true)
        }
      })
    // Check if tension assessment completed
    supabase
      .from('user_stage_progress')
      .select('tension_discover')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.tension_discover != null) {
          setHasTensionScores(true)
        }
      })
    // Check if curiosity compass completed (has skills from curiosity_compass)
    supabase
      .from('nikigai_clusters')
      .select('id')
      .eq('user_id', userId)
      .eq('source_flow', 'curiosity_compass')
      .limit(1)
      .then(({ data }) => {
        if (data?.length > 0) {
          setHasCuriosityCompass(true)
        }
      })
  }, [userId, currentLevel])

  const levelQuests = [
    ...(config.zones ? [{ label: 'Zone Diagnosis', done: !!selectedZone }] : []),
    ...(config.deepDive ? [{ label: config.deepDive.name, done: false }] : []),
    ...(config.extraQuests || []).map(q => ({
      label: q.name,
      done: q.id === 'hero_avatar' ? hasEssenceAvatar
        : q.id === 'tension_assessment' ? hasTensionScores
        : q.id === 'curiosity_compass' ? hasCuriosityCompass
        : false,
    })),
    ...(boss ? [{ label: 'Boss Fight', done: false }] : []),
    ...(config.milestone ? [{ label: 'Milestone', done: false }] : []),
  ]
  const questsCompleted = levelQuests.filter(q => q.done).length
  const allQuestsDone = levelQuests.length > 0 && questsCompleted === levelQuests.length

  // Auto-graduate to next level when all quests complete
  useEffect(() => {
    if (!allQuestsDone || !userId || currentLevel > 7) return
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
              console.log(`Graduated from Level ${currentLevel} to Level ${currentLevel + 1}`)
            })
        }
      })
  }, [allQuestsDone, userId, currentLevel])

  return (
    <div className="level-tab">
      {/* Level Selector */}
      <div className="level-selector">
        {Object.entries(LEVEL_CONFIG).map(([num, lvl]) => {
          const n = parseInt(num)
          const isCurrent = n === currentLevel
          const isLocked = n > currentLevel
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

      {/* Level Header */}
      <div className="level-header-card">
        <div className="level-header-name">
          Level {currentLevel}: {config.name}
        </div>
        <div className="level-header-question">{config.question}</div>
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
      <DeepDiveCard deepDive={config.deepDive} isCompleted={false} />

      {/* Extra Quests (Level-specific) */}
      {config.extraQuests?.map(quest => {
        const isCompleted =
          quest.id === 'hero_avatar' ? hasEssenceAvatar
          : quest.id === 'tension_assessment' ? hasTensionScores
          : quest.id === 'curiosity_compass' ? hasCuriosityCompass
          : false
        const isLocked = quest.lockedUntil === 'curiosity_compass' && !hasCuriosityCompass
        const questWithRoute = quest.id === 'playlist_challenge' && !isLocked
          ? { ...quest, route: '#playlist' }
          : quest.navigateTo
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
      {boss && <BossFightCard boss={boss} isCompleted={false} />}

      {/* Milestone */}
      <MilestoneCard milestone={config.milestone} isCompleted={false} />

      {/* Progress Bars */}
      <ProgressBars
        levelQuests={levelQuests}
        courageCount={config.courageCount || 0}
        courageDone={0}
        healingDaysDone={0}
        healingDaysRequired={config.healingDaysRequired || 14}
        questsCompleted={questsCompleted}
      />
    </div>
  )
}
