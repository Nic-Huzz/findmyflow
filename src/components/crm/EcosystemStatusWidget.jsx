/**
 * Ecosystem Status Widget - Dashboard card showing flywheel progress
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEcosystemSummary } from '../../lib/crm/ecosystemService'
import { hapticLight } from '../../lib/haptics'
import './EcosystemStatusWidget.css'

export default function EcosystemStatusWidget({ userId }) {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!userId) return
    getEcosystemSummary(userId).then(setSummary)
  }, [userId])

  if (!summary) return null

  return (
    <div
      className="eco-widget"
      onClick={() => { hapticLight(); navigate('/crm/tools/systems') }}
    >
      <div className="eco-widget-header">
        <h3 className="eco-widget-title">⚙️ Business Systems</h3>
        <span className="eco-widget-pct">{summary.overallPercent}%</span>
      </div>

      <div className="eco-widget-phases">
        {summary.phases.map(phase => (
          <div key={phase.id} className="eco-widget-phase">
            <div className="eco-widget-phase-label">
              <span>{phase.icon}</span>
              <span>{phase.name}</span>
              <span className="eco-widget-phase-count">
                {phase.completed}/{phase.total}
              </span>
            </div>
            <div className="eco-widget-mini-bar">
              <div
                className="eco-widget-mini-fill"
                style={{ width: `${phase.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <span className="eco-widget-cta">Complete setup in Tools →</span>
    </div>
  )
}
