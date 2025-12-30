/**
 * WeekPlanCard.jsx
 *
 * Compact summary of the user's weekly plan displayed on the Challenge page.
 * Shows groan, release practice, and allows editing the plan.
 */

import './WeekPlanCard.css'

// Week type display info
const WEEK_TYPES = {
  push: { label: 'Push Week', icon: '🔥', color: '#ef4444' },
  flow: { label: 'Flow Week', icon: '🌊', color: '#3b82f6' },
  rest: { label: 'Rest Week', icon: '🌙', color: '#8b5cf6' },
  launch: { label: 'Launch Week', icon: '🎯', color: '#f59e0b' }
}

// Day abbreviations
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
}

function WeekPlanCard({ weeklyPlan, weekLabel, onEditPlan, isSunday = false }) {
  if (!weeklyPlan) return null

  const weekType = WEEK_TYPES[weeklyPlan.week_type] || WEEK_TYPES.flow
  const groanDay = DAY_LABELS[weeklyPlan.weekly_groan_day] || ''
  const releaseDay = DAY_LABELS[weeklyPlan.big_release_day] || ''

  return (
    <div className={`week-plan-card ${weeklyPlan.week_type ? `week-${weeklyPlan.week_type}` : ''}`}>
      {/* Sunday planning prompt */}
      {isSunday && (
        <div className="sunday-prompt">
          <span className="prompt-icon">📅</span>
          <span className="prompt-text">Ready to plan next week?</span>
          <button className="plan-next-week-btn" onClick={onEditPlan}>
            Plan Week
          </button>
        </div>
      )}

      {/* Week header */}
      <div className="week-plan-header">
        <span className="week-label">Week of {weekLabel}</span>
        <span className="week-type" style={{ color: weekType.color }}>
          {weekType.icon} {weekType.label}
        </span>
      </div>

      {/* Plan items */}
      <div className="week-plan-items">
        {/* Weekly Groan */}
        {weeklyPlan.weekly_groan_description && (
          <div className={`plan-item ${weeklyPlan.weekly_groan_completed ? 'completed' : ''}`}>
            <span className="item-icon">🎯</span>
            <div className="item-content">
              <span className="item-label">
                Groan {groanDay && `(${groanDay})`}
                {weeklyPlan.weekly_groan_completed && <span className="check-mark">✓</span>}
              </span>
              <span className="item-value">"{weeklyPlan.weekly_groan_description}"</span>
            </div>
          </div>
        )}

        {/* Big Release */}
        {weeklyPlan.big_release_practice && (
          <div className="plan-item">
            <span className="item-icon">🌊</span>
            <div className="item-content">
              <span className="item-label">Release {releaseDay && `(${releaseDay})`}</span>
              <span className="item-value">{weeklyPlan.big_release_practice.replace(/_/g, ' ')}</span>
            </div>
          </div>
        )}

        {/* 3% Improvement */}
        {weeklyPlan.three_percent_improvement && (
          <div className="plan-item">
            <span className="item-icon">📈</span>
            <div className="item-content">
              <span className="item-label">3% Better</span>
              <span className="item-value">"{weeklyPlan.three_percent_improvement}"</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit button */}
      <button className="edit-plan-btn" onClick={onEditPlan}>
        Edit Plan
      </button>
    </div>
  )
}

export default WeekPlanCard
