/**
 * Daily Priorities Component
 * "Here's what to do today" - AI-recommended actions based on pipeline data
 * Enhanced with one-click actions and smarter "why" context
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFollowUpsDue,
  getStaleDeals,
  getUpcomingMeetings,
  fetchDeals,
  STAGE_INFO,
  scheduleFollowUp,
  fetchPendingAscensionTasks,
  completeAscensionTask,
  dismissAscensionTask,
  rescheduleAscensionTask,
} from '../../lib/crm'
import ActivityLogModal from './ActivityLogModal'
import ScriptsModal from './ScriptsModal'
import TaskSkipCapture from './TaskSkipCapture'
import './DailyPriorities.css'

export default function DailyPriorities({ userId }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [priorities, setPriorities] = useState({
    followUps: [],
    staleDeals: [],
    veryStaleDeals: [],
    upcomingMeetings: [],
    highValueDeals: [],
    ascensionTasks: [],
  })
  const [expanded, setExpanded] = useState(true)
  const [activityModalDeal, setActivityModalDeal] = useState(null)
  const [scriptsModalDeal, setScriptsModalDeal] = useState(null)
  const [skipCaptureTask, setSkipCaptureTask] = useState(null)

  useEffect(() => {
    if (userId) {
      loadPriorities()
    }
  }, [userId])

  async function loadPriorities() {
    setLoading(true)
    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Fetch all priority data in parallel
      const [followUpsResult, staleResult, meetingsResult, dealsResult, ascensionResult] = await Promise.all([
        getFollowUpsDue(userId, tomorrow), // Due today or overdue
        getStaleDeals(userId, 7),
        getUpcomingMeetings(userId, 3), // Next 3 days
        fetchDeals(userId),
        fetchPendingAscensionTasks(userId),
      ])

      // Separate stale (7+ days) from very stale (14+ days)
      const staleDeals = staleResult.data?.filter(d => {
        const days = Math.floor((Date.now() - new Date(d.updated_at)) / (1000 * 60 * 60 * 24))
        return days >= 7 && days < 14
      }) || []

      const veryStaleDeals = staleResult.data?.filter(d => {
        const days = Math.floor((Date.now() - new Date(d.updated_at)) / (1000 * 60 * 60 * 24))
        return days >= 14
      }) || []

      // Find high-value deals in active stages
      const highValueDeals = (dealsResult.data || [])
        .filter(d =>
          !['won', 'lost'].includes(d.status) &&
          d.value >= 1000 &&
          !staleResult.data?.find(s => s.id === d.id) // Not already in stale
        )
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)

      setPriorities({
        followUps: followUpsResult.data || [],
        staleDeals,
        veryStaleDeals,
        upcomingMeetings: meetingsResult.data || [],
        highValueDeals,
        ascensionTasks: ascensionResult.data || [],
      })
    } catch (err) {
      console.error('Error loading priorities:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleActivityLogged(activity) {
    // Reload priorities after activity logged
    loadPriorities()
  }

  async function handleQuickSchedule(deal, daysFromNow) {
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + daysFromNow)
    await scheduleFollowUp(deal.id, userId, followUpDate)
    loadPriorities()
  }

  async function handleAscensionComplete(taskId) {
    await completeAscensionTask(taskId)
    loadPriorities()
  }

  function handleAscensionDismiss(task) {
    // Show skip capture modal to understand why
    setSkipCaptureTask({
      id: task.id,
      title: task.title,
      description: task.description,
      type: 'ascension_task'
    })
  }

  async function handleSkipSubmit(skipData) {
    // Actually dismiss the task after capturing the reason
    if (skipCaptureTask?.id) {
      await dismissAscensionTask(skipCaptureTask.id)
    }
    loadPriorities()
  }

  async function handleReschedule({ taskId, newDate, taskType }) {
    // Reschedule the ascension task to the new date
    if (taskId && taskType === 'ascension_task') {
      await rescheduleAscensionTask(taskId, newDate)
    }
    loadPriorities()
  }

  const totalActions =
    priorities.followUps.length +
    priorities.staleDeals.length +
    priorities.veryStaleDeals.length +
    priorities.upcomingMeetings.length +
    priorities.ascensionTasks.length

  const urgentCount = priorities.veryStaleDeals.length +
    priorities.followUps.filter(f => {
      const due = new Date(f.next_follow_up_date)
      return due < new Date()
    }).length

  if (loading) {
    return (
      <div className="daily-priorities loading">
        <div className="dp-spinner"></div>
      </div>
    )
  }

  // If no actions needed, show success state
  if (totalActions === 0) {
    return (
      <div className="daily-priorities all-clear">
        <div className="dp-header">
          <span className="dp-icon">&#10003;</span>
          <h3>You're All Caught Up!</h3>
        </div>
        <p className="dp-message">Nothing urgent — nice work! Keep the momentum going.</p>
        <button className="dp-action-btn" onClick={() => navigate('/crm/sales')}>
          View Pipeline
        </button>
      </div>
    )
  }

  return (
    <div className={`daily-priorities ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="dp-header" onClick={() => setExpanded(!expanded)}>
        <div className="dp-title-row">
          <span className="dp-icon">&#128203;</span>
          <h3>Today's Priorities</h3>
          {urgentCount > 0 && (
            <span className="dp-urgent-badge">{urgentCount} urgent</span>
          )}
        </div>
        <div className="dp-summary">
          <span className="dp-count">{totalActions} actions</span>
          <span className="dp-expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="dp-content">
          {/* Very Stale Deals (14+ days) - URGENT */}
          {priorities.veryStaleDeals.length > 0 && (
            <div className="dp-section urgent">
              <div className="dp-section-header">
                <span className="section-icon">⚠️</span>
                <span className="section-title">Urgent: Deals Going Cold</span>
                <span className="section-count">{priorities.veryStaleDeals.length}</span>
              </div>
              <div className="dp-items">
                {priorities.veryStaleDeals.slice(0, 3).map(deal => (
                  <DealItem
                    key={deal.id}
                    deal={deal}
                    type="very-stale"
                    userId={userId}
                    onLogActivity={() => setActivityModalDeal(deal)}
                    onQuickSchedule={(days) => handleQuickSchedule(deal, days)}
                    onShowScripts={() => setScriptsModalDeal(deal)}
                    onViewPipeline={() => navigate('/crm/sales')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups Due */}
          {priorities.followUps.length > 0 && (
            <div className="dp-section follow-ups">
              <div className="dp-section-header">
                <span className="section-icon">📞</span>
                <span className="section-title">Follow-ups Due</span>
                <span className="section-count">{priorities.followUps.length}</span>
              </div>
              <div className="dp-items">
                {priorities.followUps.slice(0, 3).map(deal => (
                  <DealItem
                    key={deal.id}
                    deal={deal}
                    type="follow-up"
                    userId={userId}
                    onLogActivity={() => setActivityModalDeal(deal)}
                    onQuickSchedule={(days) => handleQuickSchedule(deal, days)}
                    onShowScripts={() => setScriptsModalDeal(deal)}
                    onViewPipeline={() => navigate('/crm/sales')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Meetings */}
          {priorities.upcomingMeetings.length > 0 && (
            <div className="dp-section meetings">
              <div className="dp-section-header">
                <span className="section-icon">📅</span>
                <span className="section-title">Upcoming Meetings</span>
                <span className="section-count">{priorities.upcomingMeetings.length}</span>
              </div>
              <div className="dp-items">
                {priorities.upcomingMeetings.slice(0, 3).map(deal => (
                  <DealItem
                    key={deal.id}
                    deal={deal}
                    type="meeting"
                    userId={userId}
                    onLogActivity={() => setActivityModalDeal(deal)}
                    onQuickSchedule={(days) => handleQuickSchedule(deal, days)}
                    onShowScripts={() => setScriptsModalDeal(deal)}
                    onViewPipeline={() => navigate('/crm/sales')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stale Deals (7-14 days) */}
          {priorities.staleDeals.length > 0 && (
            <div className="dp-section stale">
              <div className="dp-section-header">
                <span className="section-icon">⏳</span>
                <span className="section-title">Needs Attention (7+ days)</span>
                <span className="section-count">{priorities.staleDeals.length}</span>
              </div>
              <div className="dp-items">
                {priorities.staleDeals.slice(0, 3).map(deal => (
                  <DealItem
                    key={deal.id}
                    deal={deal}
                    type="stale"
                    userId={userId}
                    onLogActivity={() => setActivityModalDeal(deal)}
                    onQuickSchedule={(days) => handleQuickSchedule(deal, days)}
                    onShowScripts={() => setScriptsModalDeal(deal)}
                    onViewPipeline={() => navigate('/crm/sales')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* High Value Opportunities */}
          {priorities.highValueDeals.length > 0 && (
            <div className="dp-section high-value">
              <div className="dp-section-header">
                <span className="section-icon">💰</span>
                <span className="section-title">High-Value Opportunities</span>
                <span className="section-count">{priorities.highValueDeals.length}</span>
              </div>
              <div className="dp-items">
                {priorities.highValueDeals.map(deal => (
                  <DealItem
                    key={deal.id}
                    deal={deal}
                    type="high-value"
                    userId={userId}
                    onLogActivity={() => setActivityModalDeal(deal)}
                    onQuickSchedule={(days) => handleQuickSchedule(deal, days)}
                    onShowScripts={() => setScriptsModalDeal(deal)}
                    onViewPipeline={() => navigate('/crm/sales')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ascension Tasks - Upsell/Downsell/Continuity Opportunities */}
          {priorities.ascensionTasks.length > 0 && (
            <div className="dp-section ascension">
              <div className="dp-section-header">
                <span className="section-icon">🚀</span>
                <span className="section-title">Growth Opportunities</span>
                <span className="section-count">{priorities.ascensionTasks.length}</span>
              </div>
              <div className="dp-items">
                {priorities.ascensionTasks.slice(0, 5).map(task => (
                  <AscensionTaskItem
                    key={task.id}
                    task={task}
                    onComplete={() => handleAscensionComplete(task.id)}
                    onDismiss={() => handleAscensionDismiss(task)}
                    onViewAscension={() => navigate('/crm/ascension')}
                  />
                ))}
              </div>
              {priorities.ascensionTasks.length > 5 && (
                <button className="dp-see-more" onClick={() => navigate('/crm/ascension')}>
                  See all {priorities.ascensionTasks.length} opportunities →
                </button>
              )}
            </div>
          )}

          <button className="dp-view-all" onClick={() => navigate('/crm/sales')}>
            View Full Pipeline →
          </button>
        </div>
      )}

      {/* Activity Log Modal */}
      {activityModalDeal && (
        <ActivityLogModal
          deal={activityModalDeal}
          userId={userId}
          onClose={() => setActivityModalDeal(null)}
          onActivityLogged={handleActivityLogged}
        />
      )}

      {/* Scripts Modal */}
      {scriptsModalDeal && (
        <ScriptsModal
          deal={scriptsModalDeal}
          userId={userId}
          onClose={() => setScriptsModalDeal(null)}
          onScriptUsed={() => {}}
        />
      )}

      {/* Task Skip Capture Modal */}
      {skipCaptureTask && (
        <TaskSkipCapture
          isOpen={true}
          onClose={() => setSkipCaptureTask(null)}
          onSubmit={handleSkipSubmit}
          onReschedule={handleReschedule}
          task={skipCaptureTask}
          userId={userId}
        />
      )}
    </div>
  )
}

function DealItem({ deal, type, userId, onLogActivity, onQuickSchedule, onShowScripts, onViewPipeline }) {
  const [showActions, setShowActions] = useState(false)
  const stageInfo = STAGE_INFO[deal.status] || {}

  // Extract AI talking points from notes
  const talkingPoints = extractTalkingPoints(deal)

  // Calculate days since update
  const daysSince = Math.floor((Date.now() - new Date(deal.updated_at)) / (1000 * 60 * 60 * 24))

  // Calculate days since last contact
  const daysSinceContact = deal.last_contact_date
    ? Math.floor((Date.now() - new Date(deal.last_contact_date)) / (1000 * 60 * 60 * 24))
    : null

  // Format meeting date if applicable
  const meetingDate = deal.meeting_scheduled_at
    ? new Date(deal.meeting_scheduled_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : null

  // Format follow-up date
  const followUpDate = deal.next_follow_up_date
    ? new Date(deal.next_follow_up_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : null

  const isOverdue = deal.next_follow_up_date && new Date(deal.next_follow_up_date) < new Date()

  // Generate "why" context based on type
  function getWhyContext() {
    if (type === 'very-stale') {
      if (daysSinceContact !== null) {
        return `Last contact ${daysSinceContact}d ago • No activity for ${daysSince}d`
      }
      return `No activity for ${daysSince} days - deal may be going cold`
    }
    if (type === 'stale') {
      if (daysSinceContact !== null) {
        return `Last contact ${daysSinceContact}d ago`
      }
      return `No updates for ${daysSince} days`
    }
    if (type === 'follow-up') {
      if (isOverdue) {
        const overdueDays = Math.floor((Date.now() - new Date(deal.next_follow_up_date)) / (1000 * 60 * 60 * 24))
        return `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`
      }
      return `Scheduled for ${followUpDate}`
    }
    if (type === 'meeting') {
      return `Meeting: ${meetingDate}`
    }
    if (type === 'high-value') {
      return `${stageInfo.label} stage • ${deal.contact_count || 0} contacts made`
    }
    return null
  }

  // Get action hint based on type and deal state
  function getActionHint() {
    if (type === 'very-stale') {
      return 'Re-engage now or mark as lost'
    }
    if (type === 'stale') {
      return 'Send a quick check-in message'
    }
    if (type === 'follow-up') {
      return isOverdue ? 'Complete this follow-up today' : 'Mark complete after contact'
    }
    if (type === 'meeting') {
      return 'Confirm attendance and prepare'
    }
    if (type === 'high-value') {
      return 'Prioritize moving forward'
    }
    return ''
  }

  return (
    <div
      className={`dp-item ${type} ${showActions ? 'actions-visible' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="dp-item-main">
        <span className="dp-item-name">{deal.contact_name}</span>
        <span className="dp-item-value">${deal.value?.toLocaleString()}</span>
      </div>

      {/* Why Context - the reason this is a priority */}
      <div className="dp-item-why">
        {getWhyContext()}
      </div>

      <div className="dp-item-meta">
        <span
          className="dp-item-stage"
          style={{ background: stageInfo.color || '#6b7280' }}
        >
          {stageInfo.label || deal.status}
        </span>
        {type === 'very-stale' && (
          <span className="dp-item-tag urgent">{daysSince}d inactive</span>
        )}
        {type === 'stale' && (
          <span className="dp-item-tag warning">{daysSince}d inactive</span>
        )}
        {type === 'follow-up' && (
          <span className={`dp-item-tag ${isOverdue ? 'overdue' : ''}`}>
            {isOverdue ? 'Overdue' : 'Due'}
          </span>
        )}
        {type === 'meeting' && (
          <span className="dp-item-tag meeting">Scheduled</span>
        )}
        {type === 'high-value' && deal.product_type && (
          <span className="dp-item-tag high-value">{deal.product_type}</span>
        )}
      </div>

      {/* Action hint */}
      <div className="dp-item-action-hint">
        {getActionHint()}
      </div>

      {/* AI Talking Points */}
      {talkingPoints && (
        <div className="dp-item-talking-point">
          <span className="talking-point-icon">💡</span>
          <span className="talking-point-text">{talkingPoints}</span>
        </div>
      )}

      {/* One-Click Actions */}
      <div className={`dp-item-actions ${showActions ? 'visible' : ''}`}>
        <button
          className="dp-quick-btn log"
          onClick={(e) => { e.stopPropagation(); onLogActivity() }}
          title="Log Activity"
        >
          📝 Log
        </button>
        <button
          className="dp-quick-btn script"
          onClick={(e) => { e.stopPropagation(); onShowScripts() }}
          title="View Scripts"
        >
          📜 Script
        </button>
        <button
          className="dp-quick-btn schedule"
          onClick={(e) => { e.stopPropagation(); onQuickSchedule(3) }}
          title="Schedule follow-up in 3 days"
        >
          📅 +3d
        </button>
        <button
          className="dp-quick-btn view"
          onClick={(e) => { e.stopPropagation(); onViewPipeline() }}
          title="View in Pipeline"
        >
          👁️
        </button>
      </div>
    </div>
  )
}

// Ascension Task Item Component
function AscensionTaskItem({ task, onComplete, onDismiss, onViewAscension }) {
  const [showActions, setShowActions] = useState(false)

  // Icon based on task type
  const typeIcons = {
    upsell: '🚀',
    downsell: '💰',
    continuity: '🔄',
    winback: '🔙',
  }
  const icon = typeIcons[task.task_type] || '📋'

  // Color based on task type
  const typeColors = {
    upsell: 'var(--color-purple, #8b5cf6)',
    downsell: 'var(--color-amber, #f59e0b)',
    continuity: 'var(--color-pink, #ec4899)',
    winback: 'var(--color-blue, #3b82f6)',
  }
  const color = typeColors[task.task_type] || '#6b7280'

  // Format due date
  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div
      className={`dp-item ascension-task ${task.task_type} ${showActions ? 'actions-visible' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="dp-item-main">
        <span className="dp-item-name">
          <span className="ascension-type-icon">{icon}</span>
          {task.customer_name}
        </span>
        <span className="dp-item-type-badge" style={{ background: color }}>
          {task.task_type}
        </span>
      </div>

      <div className="dp-item-why">{task.title}</div>

      {task.description && (
        <div className="dp-item-action-hint">{task.description}</div>
      )}

      <div className="dp-item-meta">
        {dueDate && (
          <span className={`dp-item-tag ${isOverdue ? 'overdue' : ''}`}>
            {isOverdue ? 'Overdue' : `Due ${dueDate}`}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className={`dp-item-actions ${showActions ? 'visible' : ''}`}>
        <button
          className="dp-quick-btn complete"
          onClick={(e) => { e.stopPropagation(); onComplete() }}
          title="Mark Complete"
        >
          ✓ Done
        </button>
        <button
          className="dp-quick-btn dismiss"
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          title="Dismiss"
        >
          ✕ Skip
        </button>
        <button
          className="dp-quick-btn view"
          onClick={(e) => { e.stopPropagation(); onViewAscension() }}
          title="View in Ascension Engine"
        >
          👁️
        </button>
      </div>
    </div>
  )
}

// Helper function to extract talking points from deal notes
function extractTalkingPoints(deal) {
  const notes = deal.notes || ''
  if (!notes) return null

  // Look for key patterns in notes
  const patterns = [
    // Budget/price mentions
    { regex: /budget|price|expensive|cost|afford/i, hint: 'Budget was mentioned - address value first' },
    // Timeline mentions
    { regex: /timeline|deadline|urgent|asap|soon/i, hint: 'Has timeline urgency - leverage it' },
    // Competition mentions
    { regex: /competitor|alternative|comparing|other option/i, hint: 'Comparing options - differentiate' },
    // Concerns/objections
    { regex: /concern|worry|unsure|hesitant|think about/i, hint: 'Has concerns - address directly' },
    // Interest signals
    { regex: /interested|excited|love|perfect|exactly/i, hint: 'Showed interest - move forward' },
    // Questions asked
    { regex: /how does|what if|can you|is it possible/i, hint: 'Had questions - ensure answered' },
    // Pain points
    { regex: /struggling|frustrated|problem|challenge|pain/i, hint: 'Has pain point - emphasize solution' },
  ]

  // Check notes for patterns
  for (const { regex, hint } of patterns) {
    if (regex.test(notes)) {
      return hint
    }
  }

  // Check for key points in notes (look for bullet points or numbered lists)
  const keyPointMatch = notes.match(/[•\-\*]\s*(.{10,60})/m) || notes.match(/\d\.\s*(.{10,60})/m)
  if (keyPointMatch) {
    return `Key point: "${keyPointMatch[1].trim()}"`
  }

  // If notes exist but no patterns, show summary
  if (notes.length > 20) {
    const firstLine = notes.split('\n')[0].trim()
    if (firstLine.length > 10) {
      return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine
    }
  }

  return null
}
