/**
 * Expenses - Project Expense Tracker
 * Track costs by project with monthly views
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import './Expenses.css'

const EXPENSE_TYPES = [
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'operations', label: 'Operations', icon: '⚙️' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'contractors', label: 'Contractors', icon: '👤' },
  { id: 'other', label: 'Other', icon: '📦' },
]

function getMonthLabel(offset) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getMonthDate(offset) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Expenses() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [expenses, setExpenses] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  // Add form state
  const [formType, setFormType] = useState('marketing')
  const [formCategory, setFormCategory] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formRecurring, setFormRecurring] = useState(false)
  const [saving, setSaving] = useState(false)

  const month = getMonthDate(monthOffset)
  const monthLabel = getMonthLabel(monthOffset)

  useEffect(() => {
    if (user?.id) loadProjects()
  }, [user?.id])

  useEffect(() => {
    if (user?.id) loadExpenses()
  }, [user?.id, monthOffset, selectedProjectId])

  async function loadProjects() {
    const { data } = await supabase
      .from('user_projects')
      .select('id, name')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setProjects(data || [])
    if (data?.length > 0 && !formProjectId) {
      setFormProjectId(data[0].id)
    }
  }

  async function loadExpenses() {
    setLoading(true)
    let query = supabase
      .from('project_expenses')
      .select('*, user_projects(name)')
      .eq('user_id', user.id)
      .eq('month', month)
      .order('created_at', { ascending: false })

    if (selectedProjectId !== 'all') {
      query = query.eq('project_id', selectedProjectId)
    }

    const { data } = await query
    setExpenses(data || [])
    setLoading(false)
  }

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const byType = {}
    EXPENSE_TYPES.forEach(t => { byType[t.id] = 0 })
    expenses.forEach(e => {
      byType[e.expense_type] = (byType[e.expense_type] || 0) + (e.amount || 0)
    })
    return { total, byType }
  }, [expenses])

  const groupedExpenses = useMemo(() => {
    const groups = {}
    expenses.forEach(e => {
      const type = e.expense_type || 'other'
      if (!groups[type]) groups[type] = []
      groups[type].push(e)
    })
    return groups
  }, [expenses])

  async function handleSaveExpense() {
    if (!formAmount || !formProjectId) return
    setSaving(true)

    const { error } = await supabase
      .from('project_expenses')
      .insert({
        user_id: user.id,
        project_id: formProjectId,
        expense_type: formType,
        category: formCategory || formType,
        description: formDescription || null,
        amount: parseFloat(formAmount),
        month,
        is_recurring: formRecurring,
      })

    if (!error) {
      setShowAddModal(false)
      setFormCategory('')
      setFormAmount('')
      setFormDescription('')
      setFormRecurring(false)
      loadExpenses()
    }
    setSaving(false)
  }

  async function handleDeleteExpense(id) {
    if (!user?.id || !confirm('Delete this expense?')) return
    await supabase.from('project_expenses').delete().eq('id', id).eq('user_id', user.id)
    loadExpenses()
  }

  if (loading && expenses.length === 0) {
    return (
      <div className="expenses-page">
        <div className="expenses-toolbar">
          <button className="expenses-back" onClick={() => navigate('/crm/tools')}>←</button>
          <h2 className="expenses-toolbar-title">Expenses</h2>
        </div>
        <div className="expenses-loading">
          <div className="expenses-spinner" />
          <p>Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="expenses-page">
      {/* Toolbar */}
      <div className="expenses-toolbar">
        <button className="expenses-back" onClick={() => navigate('/crm/tools')}>←</button>
        <h2 className="expenses-toolbar-title">Expenses</h2>
      </div>

      {/* Month Navigation */}
      <div className="expenses-month-nav">
        <button className="expenses-month-btn" onClick={() => setMonthOffset(prev => prev - 1)}>
          ←
        </button>
        <span className="expenses-month-label">{monthLabel}</span>
        <button
          className="expenses-month-btn"
          onClick={() => setMonthOffset(prev => Math.min(0, prev + 1))}
          disabled={monthOffset >= 0}
        >
          →
        </button>
      </div>

      {/* Project Filter */}
      {projects.length > 1 && (
        <div className="expenses-project-filter">
          <button
            className={`expenses-filter-pill ${selectedProjectId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedProjectId('all')}
          >
            All
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              className={`expenses-filter-pill ${selectedProjectId === p.id ? 'active' : ''}`}
              onClick={() => setSelectedProjectId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Summary Card */}
      <div className="expenses-summary">
        <div className="expenses-summary-total">
          <span className="expenses-summary-value">${summary.total.toLocaleString()}</span>
          <span className="expenses-summary-label">Total Expenses</span>
        </div>
        <div className="expenses-summary-breakdown">
          {EXPENSE_TYPES.filter(t => summary.byType[t.id] > 0).map(t => (
            <div key={t.id} className="expenses-summary-item">
              <span className="expenses-summary-icon">{t.icon}</span>
              <span className="expenses-summary-type">{t.label}</span>
              <span className="expenses-summary-amount">${summary.byType[t.id].toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expense List */}
      {Object.keys(groupedExpenses).length > 0 ? (
        Object.entries(groupedExpenses).map(([type, items]) => {
          const typeInfo = EXPENSE_TYPES.find(t => t.id === type) || { icon: '📦', label: type }
          return (
            <div key={type} className="expenses-group">
              <div className="expenses-group-header">
                <span>{typeInfo.icon} {typeInfo.label}</span>
                <span className="expenses-group-total">
                  ${items.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}
                </span>
              </div>
              {items.map(expense => (
                <div key={expense.id} className="expense-row">
                  <div className="expense-row-info">
                    <span className="expense-row-category">{expense.category}</span>
                    {expense.description && (
                      <span className="expense-row-desc">{expense.description}</span>
                    )}
                    {expense.user_projects?.name && selectedProjectId === 'all' && (
                      <span className="expense-row-project">{expense.user_projects.name}</span>
                    )}
                  </div>
                  <div className="expense-row-right">
                    <span className="expense-row-amount">${expense.amount?.toLocaleString()}</span>
                    {expense.is_recurring && <span className="expense-recurring-badge">recurring</span>}
                    <button
                      className="expense-delete-btn"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        })
      ) : (
        <div className="expenses-empty">
          <p>No expenses logged for {monthLabel}</p>
        </div>
      )}

      {/* Add Expense CTA */}
      <button className="expenses-add-cta" onClick={() => setShowAddModal(true)}>
        + Add Expense
      </button>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="expenses-modal" onClick={e => e.stopPropagation()}>
            <div className="expenses-modal-header">
              <h3>Add Expense</h3>
              <button className="expenses-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {/* Type pills */}
            <div className="expenses-type-pills">
              {EXPENSE_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`expenses-type-pill ${formType === t.id ? 'active' : ''}`}
                  onClick={() => setFormType(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Category */}
            <div className="expenses-field">
              <label>Category</label>
              <input
                type="text"
                placeholder="e.g. Facebook Ads, Hosting"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="expenses-field">
              <label>Amount</label>
              <div className="expenses-amount-wrap">
                <span className="expenses-amount-prefix">$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="expenses-field">
              <label>Description (optional)</label>
              <input
                type="text"
                placeholder="Brief note"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
              />
            </div>

            {/* Project */}
            <div className="expenses-field">
              <label>Project</label>
              <select
                value={formProjectId}
                onChange={e => setFormProjectId(e.target.value)}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Recurring toggle */}
            <div className="expenses-toggle-row">
              <span>Recurring monthly</span>
              <button
                className={`expenses-toggle ${formRecurring ? 'on' : ''}`}
                onClick={() => setFormRecurring(!formRecurring)}
              >
                <span className="expenses-toggle-knob" />
              </button>
            </div>

            <button
              className="expenses-save-btn"
              onClick={handleSaveExpense}
              disabled={!formAmount || !formProjectId || saving}
            >
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
