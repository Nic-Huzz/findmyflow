/**
 * JourneyZones.jsx
 *
 * Zone Assessments horizontal scroll strip + detail modal.
 * Shows all 8 levels with completion status and SweetSpotGraph.
 *
 * Created: 2026-07-11
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import SweetSpotGraph from '../level/SweetSpotGraph'
import { LEVEL_CONFIG } from '../level/LevelConfig'
import './JourneyZones.css'

export default function JourneyZones({ userId }) {
  const [allLevelProgress, setAllLevelProgress] = useState({})
  const [zoneModalLevel, setZoneModalLevel] = useState(null)

  useEffect(() => {
    if (!userId) return
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
  }, [userId])

  return (
    <>
      <div className="jz-section">
        <h3 className="jz-title">Zone Assessments</h3>
        <div className="jz-strip">
          {Object.entries(LEVEL_CONFIG).filter(([n]) => parseInt(n) >= 1 && parseInt(n) <= 8).map(([num, lvl]) => {
            const n = parseInt(num)
            const progress = allLevelProgress[n]
            const hasZone = !!progress?.zone_diagnosis_zone
            return (
              <button key={n} className={`jz-card ${hasZone ? 'completed' : ''}`}
                onClick={() => setZoneModalLevel(n)}>
                <div className="jz-label">{lvl.name}</div>
                {hasZone && <div className="jz-check">✅</div>}
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
          <div className="jz-overlay" onClick={() => setZoneModalLevel(null)}>
            <div className="jz-modal" onClick={e => e.stopPropagation()}>
              <button className="jz-modal-close" onClick={() => setZoneModalLevel(null)}>✕</button>
              <h2 className="jz-modal-title">{lvl.name}</h2>
              <p className="jz-modal-question">{lvl.question}</p>

              {lvl.graph && lvl.zones && (
                <div style={{ margin: '0 0 14px' }}>
                  <SweetSpotGraph title={lvl.graph} yAxis={lvl.yAxis} xAxis={lvl.xAxis} zones={lvl.zones} />
                </div>
              )}

              {progress?.zone_diagnosis_zone ? (
                <div className="jz-modal-result">
                  <div className="jz-modal-result-label">Your zone:</div>
                  <div className="jz-modal-result-name">{lvl.zones?.[progress.zone_diagnosis_zone]?.name}</div>
                </div>
              ) : null}

              <a href={`/zone-diagnosis/${zoneModalLevel}?returnTo=/7-day-challenge`}
                className="jz-modal-cta" style={{ textDecoration: 'none' }}>
                {progress?.zone_diagnosis_zone ? 'Retake Zone Diagnosis' : 'Start Zone Diagnosis'} →
              </a>

              {lvl.zones?.[progress?.zone_diagnosis_zone]?.boss && (
                <div className="jz-modal-boss">
                  <span className="jz-modal-boss-name">{lvl.zones[progress.zone_diagnosis_zone].boss}</span>
                </div>
              )}

              {lvl.essenceQuestion && (
                <p className="jz-modal-question">{lvl.essenceQuestion}</p>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}
