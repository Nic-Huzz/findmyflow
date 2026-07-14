import { useState } from 'react'
import { useSkills } from '../../hooks/useSkills'
import './SkillsDisplay.css'

const SKILL_ORDER = ['presence', 'courage', 'depth', 'recovery', 'curiosity']
const MAX_LEVEL = 5

export default function SkillsDisplay({ userId }) {
  const { skills, loading } = useSkills(userId)
  const [expanded, setExpanded] = useState(null)

  if (loading || !skills) return null

  return (
    <div className="sk-section">
      <h3 className="sk-title">Your Skills</h3>
      <div className="sk-grid">
        {SKILL_ORDER.map(key => {
          const s = skills[key]
          const isExpanded = expanded === key

          return (
            <div key={key} className="sk-row" onClick={() => setExpanded(isExpanded ? null : key)}>
              <div className="sk-row-main">
                <span className="sk-name">{s.label}</span>
                <div className="sk-dots">
                  {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                    <span
                      key={i}
                      className={`sk-dot ${i < s.level ? 'sk-dot-filled' : ''}`}
                    />
                  ))}
                </div>
                <span className="sk-level">{s.level > 0 ? `L${s.level}` : '--'}</span>
              </div>

              {isExpanded && (
                <div className="sk-detail">
                  <span className="sk-detail-explainer">{s.explainer}</span>
                  <span className="sk-detail-count">{s.count} {s.unit}</span>
                  {s.nextThreshold ? (
                    <span className="sk-detail-next">
                      {s.nextThreshold - s.count} more to L{s.level + 1}
                    </span>
                  ) : (
                    <span className="sk-detail-max">Max level reached</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
