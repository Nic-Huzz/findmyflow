/**
 * PayTheBillsSection.jsx
 *
 * Renders the "Pay The Bills" bridge job section on the Paths tab.
 * States: fulfilled (has bridge), needs-filling (prompt), graduated (flow pays).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { MONEY_TIER_5_THRESHOLD } from '../lib/bridgeJobUtils'
import confetti from 'canvas-confetti'
import './PayTheBillsSection.css'

export default function PayTheBillsSection({ quests, userId, onUpdate }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [graduating, setGraduating] = useState(false)
  const [graduated, setGraduated] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Find relevant quests
  const bridgeQuest = quests.find(q => q.is_bridge_job && q.status === 'active' && q.bridge_status !== 'completed')
  const currentJobQuest = quests.find(q => q.is_current_job && q.status !== 'reference' && !q.is_bridge_job)
  const referenceQuest = quests.find(q => q.is_current_job && q.status === 'reference')
  const hasCompletedCurrentJobFlow = quests.some(q => q.is_current_job && !q.is_bridge_job)

  // Determine section state
  // State 3: Auto-fulfilled — "grow this" + money >= $1K
  if (currentJobQuest?.job_relationship === 'grow_this') {
    const moneyTier = currentJobQuest.current_dimensions?.money
    if (moneyTier >= MONEY_TIER_5_THRESHOLD && !bridgeQuest) return null // Section hidden unless bridge still needs managing
  }

  // Don't show if current job flow not completed
  if (!hasCompletedCurrentJobFlow) return null

  // State 4: Graduated
  if (graduated === true) {
    return (
      <div className="ptb-section">
        <div className="ptb-header">
          <span className="ptb-header-icon">💰</span>
          <span className="ptb-header-title">Pay The Bills</span>
        </div>
        <div className="ptb-graduated">
          <div className="ptb-graduated-text">Your flow is paying the bills now</div>
          <button className="ptb-graduated-dismiss" onClick={() => setGraduated('dismissed')}>
            Nice, got it
          </button>
        </div>
      </div>
    )
  }
  if (graduated === 'dismissed') return null

  // Graduate handler
  const handleGraduate = async () => {
    if (graduating || !bridgeQuest) return
    setGraduating(true)
    try {
      await supabase.from('quests').update({
        bridge_status: 'completed',
        status: 'completed',
      }).eq('id', bridgeQuest.id)
      hapticSuccess()
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      setGraduated(true)
      onUpdate?.()
    } catch (err) {
      console.error('Error graduating bridge:', err)
    } finally {
      setGraduating(false)
    }
  }

  // "Got the job" handler (searching → active)
  const handleGotJob = async () => {
    if (updatingStatus || !bridgeQuest) return
    setUpdatingStatus(true)
    try {
      await supabase.from('quests').update({
        bridge_status: 'active',
      }).eq('id', bridgeQuest.id)
      hapticSuccess()
      onUpdate?.()
    } catch (err) {
      console.error('Error updating bridge status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Remove bridge handler
  const handleRemove = async () => {
    if (!bridgeQuest || updatingStatus) return
    setUpdatingStatus(true)
    try {
      await supabase.from('quests').update({
        status: 'closed',
        bridge_status: null,
      }).eq('id', bridgeQuest.id)
      onUpdate?.()
    } catch (err) {
      console.error('Error removing bridge:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // State 1: Fulfilled — bridge quest exists
  if (bridgeQuest) {
    const isSearching = bridgeQuest.bridge_status === 'searching'
    return (
      <div className="ptb-section">
        <div className="ptb-header">
          <span className="ptb-header-icon">💰</span>
          <span className="ptb-header-title">Pay The Bills</span>
        </div>
        <div
          className={`ptb-card ${isSearching ? 'searching' : ''}`}
          onClick={() => { hapticLight(); setExpanded(!expanded) }}
        >
          <div className="ptb-card-header">
            <div>
              <div className="ptb-card-title">{bridgeQuest.label}</div>
              {isSearching && (
                <div className="ptb-card-searching-label">Looking for this</div>
              )}
            </div>
            <span className={`ptb-card-status ${isSearching ? 'searching' : 'active'}`}>
              {isSearching ? 'Searching' : 'Active'}
            </span>
          </div>

          {expanded && (
            <div className="ptb-card-details" onClick={e => e.stopPropagation()}>
              {isSearching ? (
                <button className="ptb-got-job-btn" onClick={handleGotJob} disabled={updatingStatus}>
                  {updatingStatus ? 'Updating...' : 'Got the job?'}
                </button>
              ) : (
                <button className="ptb-graduate-btn" onClick={handleGraduate} disabled={graduating}>
                  {graduating ? 'Celebrating...' : 'My flow covers my bills now'}
                </button>
              )}
              <button className="ptb-remove-btn" onClick={handleRemove} disabled={updatingStatus}>
                {updatingStatus ? 'Removing...' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // State 2: Needs filling
  // Determine messaging based on context
  const isFlowUnderpaying = currentJobQuest?.job_relationship === 'grow_this'
    && (currentJobQuest.current_dimensions?.money || 0) < MONEY_TIER_5_THRESHOLD
  const promptText = isFlowUnderpaying
    ? "Your flow doesn't cover expenses yet. What else is keeping the lights on?"
    : "What's keeping the lights on while you grow your flow?"

  return (
    <div className="ptb-section">
      <div className="ptb-header">
        <span className="ptb-header-icon">💰</span>
        <span className="ptb-header-title">Pay The Bills</span>
      </div>
      <div className="ptb-empty">
        <div className="ptb-empty-text">{promptText}</div>
        <div className="ptb-empty-actions">
          <button className="ptb-empty-btn" onClick={() => { hapticLight(); navigate('/add-current-job') }}>
            <span className="ptb-empty-btn-emoji">💼</span>
            <span>{isFlowUnderpaying ? 'I have another job or gig' : 'I have a job or gig'}</span>
          </button>
          <button className="ptb-empty-btn" onClick={() => { hapticLight(); navigate('/find-bridge') }}>
            <span className="ptb-empty-btn-emoji">🔍</span>
            <span>I need to find something</span>
          </button>
        </div>
      </div>
    </div>
  )
}
