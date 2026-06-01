/**
 * HealingIntentionCard — Compact header card for the Healing tab
 *
 * States:
 *   1. No intention this week → CTA to set one
 *   2. Active intention → shows splinter viz + intention text + day dots + check-in CTA
 *   3. Checked in → shows before/after comparison + reflection
 *
 * CSS prefix: hic-
 */

import SplinterVisualization from './SplinterVisualization'
import './HealingIntention.css'

export default function HealingIntentionCard({ intention, dayOfWeek = 1, weeklyPoints = 0, onSetIntention, onCheckIn }) {

  // State 1: No intention
  if (!intention) {
    return (
      <div className="hic-card">
        <div className="hic-header">
          <span className="hic-header-icon">💜</span>
          <div className="hic-header-text">
            <span className="hic-header-title">Weekly Healing Focus</span>
            <span className="hic-header-sub">Building your safety</span>
          </div>
        </div>
        <p className="hic-empty-text">Set this week's intention to orient your healing quests.</p>
        <button className="hic-primary-btn" onClick={onSetIntention}>
          Set intention <span>→</span>
        </button>
      </div>
    )
  }

  const startProps = {
    shape: intention.start_shape,
    color: intention.start_color,
    location: intention.start_location,
    size: 'medium',
    texture: 'rough',
    movement: 'pulsing',
  }

  // State 3: Checked in
  if (intention.checked_in_at) {
    const endProps = {
      shape: intention.end_shape,
      color: intention.end_color,
      location: intention.end_location,
      size: 'medium',
      texture: 'rough',
      movement: 'pulsing',
    }

    return (
      <div className="hic-card">
        <div className="hic-header">
          <span className="hic-header-icon">✅</span>
          <div className="hic-header-text">
            <span className="hic-header-title">Weekly Check-in Complete</span>
            <span className="hic-header-sub">Building your safety</span>
          </div>
        </div>
        <div className="hic-comparison">
          <div className="hic-compare-col">
            <div className="hic-viz-frame">
              <SplinterVisualization {...startProps} movement="still" compact />
            </div>
            <span className="hic-compare-meta">Before · {intention.start_intensity}/10</span>
          </div>
          <span className="hic-compare-arrow">→</span>
          <div className="hic-compare-col">
            <div className="hic-viz-frame">
              <SplinterVisualization {...endProps} compact animate />
            </div>
            <span className="hic-compare-meta">After · {intention.end_intensity}/10</span>
          </div>
        </div>
        <div className="hic-quote">"{intention.intention_text}"</div>
        {intention.end_reflection && (
          <div className="hic-reflection">"{intention.end_reflection}"</div>
        )}
      </div>
    )
  }

  // State 2: Active intention
  return (
    <div className="hic-card">
      <div className="hic-header">
        <div className="hic-viz-badge">
          <SplinterVisualization {...startProps} compact animate />
        </div>
        <div className="hic-header-text">
          <span className="hic-header-title">Building Your Safety</span>
          <span className="hic-header-sub">This week's focus</span>
        </div>
        <div className="hic-weekly-points">{weeklyPoints}<span>RP</span></div>
      </div>
      <div className="hic-quote">"{intention.intention_text}"</div>
      <div className="hic-progress-row">
        <div className="hic-day-track">
          {[1,2,3,4,5,6,7].map(d => (
            <div key={d} className={`hic-day-pip ${d <= dayOfWeek ? 'filled' : ''}`} />
          ))}
        </div>
        <span className="hic-day-label">Day {dayOfWeek} of 7</span>
      </div>
      <div className="hic-actions">
        <button className="hic-primary-btn" onClick={onCheckIn}>
          Check in <span>→</span>
        </button>
        <button className="hic-ghost-btn" onClick={onSetIntention}>
          Reset
        </button>
      </div>
    </div>
  )
}
