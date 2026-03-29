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

import { useState } from 'react'
import { getLevelConfig } from './LevelConfig'
import SweetSpotGraph from './SweetSpotGraph'
import ZoneDiagnosis from './ZoneDiagnosis'
import DeepDiveCard from './DeepDiveCard'
import BossFightCard from './BossFightCard'
import MilestoneCard from './MilestoneCard'
import ProgressBars from './ProgressBars'
import './LevelTab.css'

export default function LevelTab({ currentLevel = 1 }) {
  const config = getLevelConfig(currentLevel)

  // Placeholder state — Phase 5 will wire to DB
  const [selectedZone, setSelectedZone] = useState(null)
  const boss =
    selectedZone && selectedZone !== 'diagonal'
      ? config.zones[selectedZone]?.boss
      : null

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

      {/* Zone Diagnosis */}
      <ZoneDiagnosis
        zones={config.zones}
        onSelect={setSelectedZone}
        selectedZone={selectedZone}
      />

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
