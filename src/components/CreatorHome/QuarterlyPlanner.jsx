/**
 * QuarterlyPlanner.jsx — "What experiences are you running this quarter?"
 *
 * Compact planning card for Experiences tab. Users pick from their library
 * or add new experience types, optionally set dates.
 * Stored in localStorage gamification state (no DB needed for v1).
 * At quarter end, shows planned vs actual review.
 *
 * CSS prefix: qp-
 */
import { useState, useEffect } from 'react'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import { getGamificationState, updateGamificationState } from '../../lib/creatorGamification'
import './QuarterlyPlanner.css'

function getCurrentQuarter() {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return `${now.getFullYear()}-Q${q}`
}

function getQuarterLabel(quarterKey) {
  const [year, q] = quarterKey.split('-Q')
  const months = { 1: 'Jan-Mar', 2: 'Apr-Jun', 3: 'Jul-Sep', 4: 'Oct-Dec' }
  return `${months[q]} ${year}`
}

function getQuarterEndDate(quarterKey) {
  const [year, q] = quarterKey.split('-Q').map(Number)
  const endMonth = q * 3 // 3, 6, 9, 12
  return new Date(year, endMonth, 0) // last day of end month
}

export default function QuarterlyPlanner({ experiences = [], pastExperiences = [] }) {
  const quarter = getCurrentQuarter()
  const [plans, setPlans] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const state = getGamificationState()
    const quarterPlans = state.quarterlyPlans?.[quarter] || []
    setPlans(quarterPlans)
    setDismissed(state.quarterlyPlannerDismissed === quarter)
  }, [quarter])

  function savePlans(newPlans) {
    setPlans(newPlans)
    const state = getGamificationState()
    updateGamificationState({
      quarterlyPlans: { ...(state.quarterlyPlans || {}), [quarter]: newPlans }
    })
  }

  function addPlan() {
    if (!newName.trim()) return
    const plan = { id: crypto.randomUUID(), name: newName.trim(), date: newDate || null, completed: false }
    savePlans([...plans, plan])
    setNewName('')
    setNewDate('')
    setShowAdd(false)
    hapticSuccess()
  }

  function removePlan(id) {
    hapticLight()
    savePlans(plans.filter(p => p.id !== id))
  }

  function toggleComplete(id) {
    hapticLight()
    savePlans(plans.map(p => p.id === id ? { ...p, completed: !p.completed } : p))
  }

  function dismiss() {
    setDismissed(true)
    updateGamificationState({ quarterlyPlannerDismissed: quarter })
  }

  // Match plans against actual experiences this quarter
  const quarterStart = new Date()
  quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3, 1)
  quarterStart.setHours(0, 0, 0, 0)
  const actualThisQuarter = [...experiences, ...pastExperiences].filter(e => {
    const d = new Date(e.experience_date || e.created_at)
    return d >= quarterStart
  })

  // Don't show if dismissed and no plans set
  if (dismissed && plans.length === 0) return null

  // Compact mode when plans exist
  const completedCount = plans.filter(p => p.completed).length
  const isQuarterEnding = getQuarterEndDate(quarter) - new Date() < 14 * 24 * 60 * 60 * 1000

  return (
    <div className="qp-card">
      <div className="qp-header">
        <div className="qp-header-left">
          <span className="qp-icon">📅</span>
          <span className="qp-title">This Quarter</span>
          <span className="qp-quarter-label">{getQuarterLabel(quarter)}</span>
        </div>
        {plans.length === 0 && (
          <button className="qp-dismiss" onClick={dismiss}>Later</button>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="qp-empty">
          <p className="qp-prompt">What experiences are you running this quarter?</p>
          <p className="qp-sub">Even a rough plan makes it 3x more likely to happen.</p>
          <button className="qp-add-btn" onClick={() => { hapticLight(); setShowAdd(true) }}>
            + Plan an experience
          </button>
        </div>
      ) : (
        <>
          <div className="qp-progress">
            {completedCount} of {plans.length} planned
            {actualThisQuarter.length > 0 && (
              <span className="qp-actual"> · {actualThisQuarter.length} actually run</span>
            )}
          </div>

          <div className="qp-list">
            {plans.map(plan => (
              <div key={plan.id} className={`qp-item${plan.completed ? ' done' : ''}`}>
                <button className="qp-check" onClick={() => toggleComplete(plan.id)}>
                  {plan.completed ? '✓' : '○'}
                </button>
                <div className="qp-item-info">
                  <span className="qp-item-name">{plan.name}</span>
                  {plan.date && <span className="qp-item-date">{new Date(plan.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                </div>
                <button className="qp-remove" onClick={() => removePlan(plan.id)}>×</button>
              </div>
            ))}
          </div>

          <button className="qp-add-btn qp-add-more" onClick={() => { hapticLight(); setShowAdd(true) }}>
            + Add another
          </button>

          {isQuarterEnding && (
            <div className="qp-review">
              Quarter ending soon. Planned {plans.length}, ran {actualThisQuarter.length}.
              {actualThisQuarter.length >= plans.length ? ' You delivered.' : ' Still time.'}
            </div>
          )}
        </>
      )}

      {showAdd && (
        <div className="qp-add-form">
          <input
            className="qp-input"
            placeholder="Experience name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPlan()}
            autoFocus
          />
          <input
            className="qp-input qp-input-date"
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <div className="qp-add-actions">
            <button className="qp-save-btn" onClick={addPlan} disabled={!newName.trim()}>Add</button>
            <button className="qp-cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
