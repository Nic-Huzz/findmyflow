/**
 * SectionLaunchPad — contextual guidance card per tab.
 *
 * Shows actionable next steps based on what's incomplete.
 * Framed as "Your launch pad" (not "Setup checklist").
 * Auto-hides when all items are complete.
 */
import { useNavigate } from 'react-router-dom'
import { hapticLight } from '../../lib/haptics'
import './SectionLaunchPad.css'

export default function SectionLaunchPad({ title, items }) {
  const navigate = useNavigate()
  const incomplete = items.filter(i => !i.done)
  const complete = items.filter(i => i.done)

  // Hide when all complete
  if (incomplete.length === 0) return null

  return (
    <div className="slp-card">
      <div className="slp-header">
        <span className="slp-title">{title}</span>
        <span className="slp-progress">{complete.length} of {items.length}</span>
      </div>
      <div className="slp-items">
        {items.map((item, i) => (
          <div
            key={i}
            className={`slp-item ${item.done ? 'slp-item-done' : ''}`}
            onClick={() => {
              if (item.done) return
              hapticLight()
              if (item.action) { item.action() }
              else if (item.route) { navigate(item.route) }
            }}
          >
            <span className="slp-check">{item.done ? '✓' : '→'}</span>
            <span className="slp-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
