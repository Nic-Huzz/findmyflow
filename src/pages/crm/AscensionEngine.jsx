/**
 * Ascension Engine - Customer Journey & Value Ladder Dashboard
 * Visualizes customer movement through offer stack
 * Manages ascension triggers and continuity tracking
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  VALUE_LADDER_RUNGS,
  fetchUserValueLadder,
  fetchCustomerAscensions,
  getValueLadderStats,
  fetchAscensionTriggers,
  createDefaultTriggers,
  updateAscensionTrigger,
  fetchPendingAscensionTasks,
  completeAscensionTask,
  fetchContinuityCustomers,
  getRetentionStats,
  updateContinuityStatus,
} from '../../lib/crm/ascensionService'
import './AscensionEngine.css'

export default function AscensionEngine() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ladder') // 'ladder', 'customers', 'triggers', 'retention'

  // Data states
  const [ladderStats, setLadderStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [triggers, setTriggers] = useState([])
  const [ascensionTasks, setAscensionTasks] = useState([])
  const [continuityCustomers, setContinuityCustomers] = useState([])
  const [retentionStats, setRetentionStats] = useState(null)

  // Custom value ladder from challenge data
  const [userLadder, setUserLadder] = useState(null)
  const [ladderCompleteness, setLadderCompleteness] = useState(0)

  // UI states
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [editingTrigger, setEditingTrigger] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [statsResult, customersResult, triggersResult, tasksResult, continuityResult, retentionResult, ladderResult] = await Promise.all([
        getValueLadderStats(user.id),
        fetchCustomerAscensions(user.id, { limit: 50 }),
        fetchAscensionTriggers(user.id),
        fetchPendingAscensionTasks(user.id),
        fetchContinuityCustomers(user.id),
        getRetentionStats(user.id),
        fetchUserValueLadder(user.id),
      ])

      setLadderStats(statsResult)
      setCustomers(customersResult.data || [])
      setTriggers(triggersResult.data || [])
      setAscensionTasks(tasksResult.data || [])
      setContinuityCustomers(continuityResult.data || [])
      setRetentionStats(retentionResult)
      setUserLadder(ladderResult.ladder)
      setLadderCompleteness(ladderResult.completeness)

      // Create default triggers if none exist
      if (triggersResult.data?.length === 0) {
        await createDefaultTriggers(user.id)
        const { data: newTriggers } = await fetchAscensionTriggers(user.id)
        setTriggers(newTriggers || [])
      }
    } catch (err) {
      console.error('Error loading ascension data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleTaskComplete(taskId, outcome) {
    await completeAscensionTask(taskId, outcome)
    setAscensionTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function handleTriggerUpdate(triggerId, updates) {
    await updateAscensionTrigger(triggerId, updates)
    setTriggers(prev => prev.map(t => t.id === triggerId ? { ...t, ...updates } : t))
    setEditingTrigger(null)
  }

  async function handleChurnCustomer(dealId, reason) {
    await updateContinuityStatus(dealId, 'churned', reason)
    loadData() // Reload all data
  }

  if (loading) {
    return (
      <div className="ascension-engine">
        <div className="ae-toolbar">
          <button className="ae-toolbar-back" onClick={() => navigate('/crm/nurture')}>←</button>
          <h2 className="ae-toolbar-title">Ascension Engine</h2>
        </div>
        <div className="ae-loading">
          <div className="ae-spinner"></div>
          <p>Loading Ascension Engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ascension-engine">
      {/* Top Toolbar */}
      <div className="ae-toolbar">
        <button className="ae-toolbar-back" onClick={() => navigate('/crm/nurture')}>
          ←
        </button>
        <h2 className="ae-toolbar-title">Ascension Engine</h2>
      </div>

      {/* Dark Hero Stats Card */}
      <div className="ae-hero">
        <div className="ae-hero-stats">
          <div className="ae-hero-stat">
            <span className="ae-hero-value">{customers.length}</span>
            <span className="ae-hero-label">Customers</span>
          </div>
          <div className="ae-hero-divider"></div>
          <div className="ae-hero-stat">
            <span className="ae-hero-value gold">${ladderStats?.totalLTV?.toLocaleString() || 0}</span>
            <span className="ae-hero-label">Total LTV</span>
          </div>
          <div className="ae-hero-divider"></div>
          <div className="ae-hero-stat">
            <span className="ae-hero-value">{ascensionTasks.length}</span>
            <span className="ae-hero-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Pending Ascension Tasks */}
      {ascensionTasks.length > 0 && (
        <div className="ae-tasks-banner">
          <div className="tasks-header">
            <span className="tasks-icon">🎯</span>
            <span className="tasks-title">{ascensionTasks.length} Ascension Task{ascensionTasks.length > 1 ? 's' : ''} Due</span>
          </div>
          <div className="tasks-list">
            {ascensionTasks.slice(0, 3).map(task => (
              <div key={task.id} className={`task-item ${task.task_type}`}>
                <div className="task-info">
                  <span className="task-type-badge">{task.task_type}</span>
                  <span className="task-title">{task.title}</span>
                </div>
                <div className="task-actions">
                  <button
                    className="task-btn complete"
                    onClick={() => handleTaskComplete(task.id, 'completed')}
                  >
                    Done
                  </button>
                  <button
                    className="task-btn dismiss"
                    onClick={() => handleTaskComplete(task.id, 'dismissed')}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="ae-tabs">
        <button
          className={`ae-tab ${activeTab === 'ladder' ? 'active' : ''}`}
          onClick={() => setActiveTab('ladder')}
        >
          Value Ladder
        </button>
        <button
          className={`ae-tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers ({customers.length})
        </button>
        <button
          className={`ae-tab ${activeTab === 'retention' ? 'active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          Retention
        </button>
        <button
          className={`ae-tab ${activeTab === 'triggers' ? 'active' : ''}`}
          onClick={() => setActiveTab('triggers')}
        >
          Triggers
        </button>
      </nav>

      {/* Tab Content */}
      <div className="ae-content">
        {activeTab === 'ladder' && (
          <ValueLadderView
            stats={ladderStats}
            customers={customers}
            userLadder={userLadder}
            completeness={ladderCompleteness}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            ladder={userLadder || VALUE_LADDER_RUNGS}
          />
        )}

        {activeTab === 'retention' && (
          <RetentionView
            stats={retentionStats}
            customers={continuityCustomers}
            onChurn={handleChurnCustomer}
          />
        )}

        {activeTab === 'triggers' && (
          <TriggersView
            triggers={triggers}
            editingTrigger={editingTrigger}
            onEdit={setEditingTrigger}
            onUpdate={handleTriggerUpdate}
          />
        )}
      </div>
    </div>
  )
}

// ============================================
// VALUE LADDER VIEW
// ============================================
function ValueLadderView({ stats, customers, userLadder, completeness }) {
  // Use custom ladder if available, otherwise default
  const ladder = userLadder || VALUE_LADDER_RUNGS

  return (
    <div className="value-ladder-view">
      {/* Ladder Completeness Banner */}
      {completeness < 100 && (
        <div className="ladder-completeness-banner">
          <div className="completeness-bar">
            <div className="completeness-fill" style={{ width: `${completeness}%` }}></div>
          </div>
          <span className="completeness-text">
            Value Ladder {completeness}% defined
            {completeness < 50 && ' — Complete Offer Stack Builder to see your offers here'}
          </span>
        </div>
      )}

      <div className="ladder-visual">
        <div className="ladder-section-header">
          <div className="ladder-section-icon">🪜</div>
          <span className="ladder-section-eyebrow">Your Value Ladder</span>
        </div>
        <div className="ladder-rungs">
          {[...ladder].reverse().map((rung, index) => {
            const rungStats = stats?.byRung?.[rung.id] || { count: 0, totalValue: 0 }
            const prevRung = ladder[ladder.length - index]
            const ascensionRate = prevRung && stats
              ? stats.ascensionRates?.[`${prevRung.id}_to_${rung.id}`]
              : null
            const hasCustomData = rung.customLabel || rung.price > 0

            return (
              <div
                key={rung.id}
                className={`ladder-rung ${hasCustomData ? 'has-data' : ''}`}
                style={{ '--rung-color': rung.color }}
              >
                <div className="rung-card">
                  <div className="rung-card-top">
                    <span className="rung-icon">{rung.icon}</span>
                    <div className="rung-info">
                      <span className="rung-label">
                        {rung.customLabel || rung.label}
                      </span>
                      {rung.customLabel && (
                        <span className="rung-type">{rung.label}</span>
                      )}
                    </div>
                    <div className="rung-numbers">
                      {rung.price > 0 && (
                        <span className="rung-price">
                          ${rung.price.toLocaleString()}{rung.isRecurring ? '/mo' : ''}
                        </span>
                      )}
                      {stats && rungStats.totalValue > 0 && (
                        <span className="rung-value">${rungStats.totalValue.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  {(stats || hasCustomData) && (
                    <div className="rung-card-bottom">
                      {stats && (
                        <span className="rung-count">
                          {rungStats.count} customer{rungStats.count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {hasCustomData && (
                        <div className="rung-badges">
                          {rung.guarantee && <span className="detail-badge">🛡️ {rung.guarantee}</span>}
                          {rung.bonuses > 0 && <span className="detail-badge">🎁 {rung.bonuses} bonuses</span>}
                          {rung.magnetType && <span className="detail-badge">📋 {rung.magnetType}</span>}
                        </div>
                      )}
                      {ascensionRate !== null && ascensionRate > 0 && (
                        <span className="ascension-rate">↑ {ascensionRate}%</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Metrics - only show if we have stats */}
      {stats ? (
        <div className="ladder-metrics">
          <div className="metric-card">
            <span className="metric-icon">💰</span>
            <div className="metric-content">
              <span className="metric-value">${stats.totalLTV.toLocaleString()}</span>
              <span className="metric-label">Total Customer Value</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon">👥</span>
            <div className="metric-content">
              <span className="metric-value">{stats.totalCustomers}</span>
              <span className="metric-label">Total Customers</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon">📈</span>
            <div className="metric-content">
              <span className="metric-value">
                ${stats.totalCustomers > 0 ? Math.round(stats.totalLTV / stats.totalCustomers).toLocaleString() : 0}
              </span>
              <span className="metric-label">Avg. Customer Value</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="ae-empty-hint">
          <span className="hint-icon">💡</span>
          <p>Close deals to see customer data on your value ladder</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// CUSTOMERS VIEW
// ============================================
function CustomersView({ customers, selectedCustomer, onSelectCustomer, ladder }) {
  const [filter, setFilter] = useState('all')

  const filteredCustomers = filter === 'all'
    ? customers
    : customers.filter(c => c.current_rung === filter)

  const getRung = (rungId) => ladder.find(r => r.id === rungId) || { label: rungId, color: '#6b7280' }

  return (
    <div className="customers-view">
      <div className="customers-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({customers.length})
        </button>
        {ladder.map(rung => {
          const count = customers.filter(c => c.current_rung === rung.id).length
          if (count === 0) return null
          return (
            <button
              key={rung.id}
              className={`filter-btn ${filter === rung.id ? 'active' : ''}`}
              onClick={() => setFilter(rung.id)}
              style={{ '--filter-color': rung.color }}
            >
              {rung.icon} {rung.customLabel || rung.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="customers-grid">
        <div className="customers-list">
          {filteredCustomers.map(customer => {
            const rung = getRung(customer.current_rung)
            return (
              <div
                key={customer.id}
                className={`customer-card ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                onClick={() => onSelectCustomer(customer)}
              >
                <div className="customer-main">
                  <span className="customer-name">{customer.customer_name}</span>
                  <span className="customer-ltv">${customer.lifetime_value?.toLocaleString() || 0}</span>
                </div>
                <div className="customer-meta">
                  <span className="customer-rung" style={{ background: rung.color }}>
                    {rung.customLabel || rung.label}
                  </span>
                  <span className="customer-purchases">
                    {customer.total_purchases || 0} purchase{customer.total_purchases !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )
          })}
          {filteredCustomers.length === 0 && (
            <div className="no-customers">No customers in this category</div>
          )}
        </div>

        {selectedCustomer && (
          <CustomerJourney customer={selectedCustomer} onClose={() => onSelectCustomer(null)} ladder={ladder} />
        )}
      </div>
    </div>
  )
}

function CustomerJourney({ customer, onClose, ladder }) {
  const history = customer.ascension_history || []

  const getRung = (rungId) => ladder.find(r => r.id === rungId) || { label: rungId, color: '#6b7280' }

  return (
    <div className="customer-journey">
      <div className="journey-header">
        <h3>{customer.customer_name}</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="journey-stats">
        <div className="journey-stat">
          <span className="stat-value">${customer.lifetime_value?.toLocaleString() || 0}</span>
          <span className="stat-label">Lifetime Value</span>
        </div>
        <div className="journey-stat">
          <span className="stat-value">{customer.total_purchases || 0}</span>
          <span className="stat-label">Purchases</span>
        </div>
      </div>

      <div className="journey-timeline">
        <h4>Journey Timeline</h4>
        {history.length === 0 ? (
          <p className="no-history">No journey history yet</p>
        ) : (
          <div className="timeline-events">
            {history.map((event, index) => {
              const rung = getRung(event.rung)
              return (
                <div key={index} className="timeline-event">
                  <span className="event-dot" style={{ background: rung.color }}></span>
                  <div className="event-content">
                    <span className="event-rung">{rung.customLabel || rung.label}</span>
                    <span className="event-value">${event.value?.toLocaleString() || 0}</span>
                    <span className="event-date">{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// RETENTION VIEW
// ============================================
function RetentionView({ stats, customers, onChurn }) {
  const [showChurnModal, setShowChurnModal] = useState(null)

  // Hide bottom toolbar when modal is open
  useEffect(() => {
    if (showChurnModal) {
      document.body.classList.add('modal-active')
    } else {
      document.body.classList.remove('modal-active')
    }
    return () => document.body.classList.remove('modal-active')
  }, [showChurnModal])

  const churnReasons = [
    'Price too high',
    'Not using enough',
    'Found alternative',
    'No longer need it',
    'Poor experience',
    'Other',
  ]

  return (
    <div className="retention-view">
      {stats && (
        <div className="retention-stats">
          <div className="retention-stat mrr">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <span className="stat-value">${stats.mrr.toLocaleString()}</span>
              <span className="stat-label">Monthly Recurring Revenue</span>
            </div>
          </div>
          <div className="retention-stat">
            <span className="stat-icon">🟢</span>
            <div className="stat-content">
              <span className="stat-value">{stats.active}</span>
              <span className="stat-label">Active Subscribers</span>
            </div>
          </div>
          <div className="retention-stat">
            <span className="stat-icon">🟡</span>
            <div className="stat-content">
              <span className="stat-value">{stats.atRisk}</span>
              <span className="stat-label">At Risk</span>
            </div>
          </div>
          <div className="retention-stat">
            <span className="stat-icon">🔴</span>
            <div className="stat-content">
              <span className="stat-value">{stats.churnRate}%</span>
              <span className="stat-label">Churn Rate</span>
            </div>
          </div>
          <div className="retention-stat">
            <span className="stat-icon">📅</span>
            <div className="stat-content">
              <span className="stat-value">{stats.avgTenure} mo</span>
              <span className="stat-label">Avg. Tenure</span>
            </div>
          </div>
        </div>
      )}

      <div className="continuity-list">
        <h3>Continuity Customers</h3>
        {customers.length === 0 ? (
          <div className="no-customers">
            <p>No continuity customers yet</p>
            <p className="hint">When you close a subscription deal, they'll show up here.</p>
          </div>
        ) : (
          <div className="continuity-customers">
            {customers.map(customer => {
              const tenure = customer.continuity_start_date
                ? Math.floor((Date.now() - new Date(customer.continuity_start_date)) / (1000 * 60 * 60 * 24 * 30))
                : 0
              const statusColors = {
                active: '#10b981',
                at_risk: '#f59e0b',
                churned: '#ef4444',
                paused: '#6b7280',
              }

              return (
                <div key={customer.id} className={`continuity-customer ${customer.continuity_status}`}>
                  <div className="customer-status-dot" style={{ background: statusColors[customer.continuity_status] }}></div>
                  <div className="customer-info">
                    <span className="customer-name">{customer.contact_name}</span>
                    <span className="customer-value">${customer.monthly_value?.toLocaleString() || customer.value?.toLocaleString()}/mo</span>
                  </div>
                  <div className="customer-tenure">
                    {tenure} month{tenure !== 1 ? 's' : ''}
                  </div>
                  {customer.continuity_status === 'active' && (
                    <button
                      className="churn-btn"
                      onClick={() => setShowChurnModal(customer)}
                    >
                      Mark Churned
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Churn Modal */}
      {showChurnModal && (
        <div className="modal-overlay" onClick={() => setShowChurnModal(null)}>
          <div className="churn-modal" onClick={e => e.stopPropagation()}>
            <h3>Why did {showChurnModal.contact_name} churn?</h3>
            <div className="churn-reasons">
              {churnReasons.map(reason => (
                <button
                  key={reason}
                  className="churn-reason-btn"
                  onClick={() => {
                    onChurn(showChurnModal.id, reason)
                    setShowChurnModal(null)
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button className="cancel-btn" onClick={() => setShowChurnModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// TRIGGERS VIEW
// ============================================
function TriggersView({ triggers, editingTrigger, onEdit, onUpdate }) {
  return (
    <div className="triggers-view">
      <div className="triggers-header">
        <h3>Ascension Triggers</h3>
        <p className="triggers-description">
          Configure when to automatically create tasks for moving customers up your value ladder.
        </p>
      </div>

      <div className="triggers-list">
        {triggers.map(trigger => (
          <div key={trigger.id} className={`trigger-card ${trigger.is_active ? 'active' : 'inactive'}`}>
            <div className="trigger-main">
              <div className="trigger-flow">
                <span className="trigger-from">{trigger.from_rung}</span>
                <span className="trigger-arrow">→</span>
                <span className="trigger-to">{trigger.to_rung}</span>
              </div>
              <span className="trigger-name">{trigger.trigger_name}</span>
            </div>

            <div className="trigger-timing">
              {trigger.trigger_timing === 'immediate' ? (
                <span className="timing-badge immediate">Immediate</span>
              ) : (
                <span className="timing-badge delayed">{trigger.days_after} days after</span>
              )}
            </div>

            <div className="trigger-actions">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={trigger.is_active}
                  onChange={(e) => onUpdate(trigger.id, { is_active: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
              <button className="edit-btn" onClick={() => onEdit(trigger)}>Edit</button>
            </div>

            {editingTrigger?.id === trigger.id && (
              <div className="trigger-edit">
                <div className="edit-field">
                  <label>Days After (0 = immediate)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingTrigger.days_after}
                    onChange={(e) => onEdit({ ...editingTrigger, days_after: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="edit-field">
                  <label>Task Title</label>
                  <input
                    type="text"
                    value={editingTrigger.task_title}
                    onChange={(e) => onEdit({ ...editingTrigger, task_title: e.target.value })}
                  />
                </div>
                <div className="edit-actions">
                  <button
                    className="save-btn"
                    onClick={() => onUpdate(trigger.id, {
                      days_after: editingTrigger.days_after,
                      trigger_timing: editingTrigger.days_after === 0 ? 'immediate' : 'days_after',
                      task_title: editingTrigger.task_title,
                    })}
                  >
                    Save
                  </button>
                  <button className="cancel-btn" onClick={() => onEdit(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
