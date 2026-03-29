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
import { getLevelConfig } from './LevelConfig'
import SweetSpotGraph from './SweetSpotGraph'
import DeepDiveCard from './DeepDiveCard'
import BossFightCard from './BossFightCard'
import MilestoneCard from './MilestoneCard'
import ProgressBars from './ProgressBars'
import './LevelTab.css'

export default function LevelTab({ currentLevel = 1, userId = null }) {
  const config = getLevelConfig(currentLevel)

  // DB-backed zone state (reads from user_level_progress if available)
  const [selectedZone, setSelectedZone] = useState(null)
  const [boss, setBoss] = useState(null)
  const [zoneLoaded, setZoneLoaded] = useState(false)

  useEffect(() => {
    if (!userId) {
      setZoneLoaded(true)
      return
    }
    import('../../lib/supabaseClient').then(({ supabase }) => {
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
    })
  }, [userId, currentLevel])

  const levelQuests = [
    { label: 'Zone Diagnosis', done: !!selectedZone },
    { label: config.deepDive?.name || 'Deep Dive', done: false },
    { label: 'Boss Fight', done: false },
    { label: 'Milestone', done: false },
  ]
  const questsCompleted = levelQuests.filter(q => q.done).length

  return (
    <div className="level-tab">
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

      {/* Sweet Spot Graph */}
      <SweetSpotGraph
        title={config.graph}
        yAxis={config.yAxis}
        xAxis={config.xAxis}
        zones={config.zones}
      />

      {/* Zone Diagnosis — links to flow */}
      <div className="level-zone-diagnosis">
        <h3 className="level-section-title">Where are you on this graph?</h3>
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
      </div>

      {/* Deep Dive */}
      <DeepDiveCard deepDive={config.deepDive} isCompleted={false} />

      {/* Boss Fight */}
      {boss && <BossFightCard boss={boss} isCompleted={false} />}

      {/* Milestone */}
      <MilestoneCard milestone={config.milestone} isCompleted={false} />

      {/* Progress Bars */}
      <ProgressBars
        levelQuests={levelQuests}
        courageCount={config.courageCount}
        courageDone={0}
        healingDaysDone={0}
        questsCompleted={questsCompleted}
      />
    </div>
  )
}
