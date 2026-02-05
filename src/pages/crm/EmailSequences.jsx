/**
 * Email Sequences - Automated Nurture Campaigns
 * Create and manage email sequences with individual email steps
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { usePromptGenerator } from '../../components/crm/PromptGenerator'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import './EmailSequences.css'

const SEQUENCE_TYPES = [
  { id: 'welcome', label: 'Welcome Series', icon: '👋', description: 'Onboard new subscribers' },
  { id: 'nurture', label: 'Nurture', icon: '💜', description: 'Build trust over time' },
  { id: 'launch', label: 'Launch', icon: '🚀', description: 'Product/offer launch' },
  { id: 'reengagement', label: 'Re-engagement', icon: '🔄', description: 'Win back cold leads' },
  { id: 'post_purchase', label: 'Post-Purchase', icon: '⭐', description: 'Delight customers' },
]

const STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft', color: '#6b7280' },
  { id: 'active', label: 'Active', color: '#10b981' },
  { id: 'paused', label: 'Paused', color: '#f59e0b' },
  { id: 'completed', label: 'Completed', color: '#8b5cf6' },
]

/**
 * Get the default prompt template based on sequence type
 */
function getPromptTemplate(sequenceType) {
  if (sequenceType === 'launch') return 'launchSequence'
  return 'nurtureSequence'
}

export default function EmailSequences() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [sequences, setSequences] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSequence, setEditingSequence] = useState(null)
  const [selectedSequence, setSelectedSequence] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const promptGenerator = usePromptGenerator()

  // Load sequences
  const loadSequences = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('crm_email_sequences')
        .select('*, crm_email_steps(count)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setSequences(data || [])
    } catch (err) {
      console.error('Error loading sequences:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadSequences()
    }
  }, [user?.id, loadSequences])

  // Filtered sequences
  const filteredSequences = useMemo(() => {
    if (filterStatus === 'all') return sequences
    return sequences.filter(s => s.status === filterStatus)
  }, [sequences, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = sequences.length
    const active = sequences.filter(s => s.status === 'active').length
    const totalSubscribers = sequences.reduce((sum, s) => sum + (s.subscribers_count || 0), 0)
    const avgOpenRate = sequences.length > 0
      ? (sequences.reduce((sum, s) => sum + (s.open_rate || 0), 0) / sequences.length).toFixed(1)
      : 0

    return { total, active, totalSubscribers, avgOpenRate }
  }, [sequences])

  // Handlers
  const handleAddSequence = () => {
    setEditingSequence(null)
    setShowAddModal(true)
    hapticLight()
  }

  const handleEditSequence = (sequence) => {
    setEditingSequence(sequence)
    setShowAddModal(true)
    hapticLight()
  }

  const handleViewSequence = (sequence) => {
    setSelectedSequence(sequence)
    hapticLight()
  }

  const handleDeleteSequence = async (sequenceId) => {
    if (!confirm('Are you sure you want to delete this sequence?')) return

    try {
      const { error } = await supabase
        .from('crm_email_sequences')
        .delete()
        .eq('id', sequenceId)
        .eq('user_id', user.id)

      if (error) throw error
      setSequences(sequences.filter(s => s.id !== sequenceId))
      setSelectedSequence(null)
      hapticMedium()
    } catch (err) {
      console.error('Error deleting sequence:', err)
    }
  }

  const handleToggleStatus = async (sequence) => {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active'

    try {
      const { data, error } = await supabase
        .from('crm_email_sequences')
        .update({ status: newStatus })
        .eq('id', sequence.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setSequences(sequences.map(s => s.id === sequence.id ? data : s))
      if (selectedSequence?.id === sequence.id) setSelectedSequence(data)
      hapticMedium()
    } catch (err) {
      console.error('Error toggling status:', err)
    }
  }

  if (loading) {
    return (
      <div className="email-sequences-container">
        <div className="email-sequences-loading">
          <div className="email-sequences-spinner" />
          <p>Loading sequences...</p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadSequences}>
      <div className="email-sequences-container">
        {/* Top Toolbar */}
        <div className="email-sequences-toolbar">
          <button className="es-back-btn" onClick={() => navigate('/crm/nurture')}>
            ←
          </button>
          <h2 className="es-toolbar-title">Email Sequences</h2>
        </div>

        {/* Header */}
        <header className="email-sequences-header">
          <div className="es-breadcrumb">
            <button onClick={() => navigate('/crm')}>Home</button>
            <span>→</span>
            <button onClick={() => navigate('/crm/nurture')}>Nurture</button>
            <span>→</span>
            <span>Email Sequences</span>
          </div>
          <h1 className="es-title">✉️ Email Sequences</h1>
          <p className="es-subtitle">Automated nurture campaigns</p>
        </header>

        {/* Stats Card */}
        <div className="es-stats-card">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Sequences</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{stats.avgOpenRate}%</span>
              <span className="stat-label">Avg Open</span>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="es-actions-card">
          <button className="es-add-btn" onClick={handleAddSequence}>
            + Create Sequence
          </button>
        </div>

        {/* Status Filters */}
        <div className="es-filters">
          <button
            className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({sequences.length})
          </button>
          {STATUS_OPTIONS.map(status => (
            <button
              key={status.id}
              className={`filter-chip ${filterStatus === status.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(status.id)}
              style={{ '--chip-color': status.color }}
            >
              {status.label} ({sequences.filter(s => s.status === status.id).length})
            </button>
          ))}
        </div>

        {/* Sequences List */}
        <div className="es-list-card">
          {filteredSequences.length === 0 ? (
            <div className="es-empty">
              {filterStatus !== 'all' ? (
                <p>No sequences with this status</p>
              ) : (
                <>
                  <p>No email sequences yet</p>
                  <p className="es-empty-hint">Create automated email campaigns to nurture your leads</p>
                  <button className="es-empty-btn" onClick={handleAddSequence}>
                    Create Your First Sequence
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="es-list">
              {filteredSequences.map(sequence => {
                const type = SEQUENCE_TYPES.find(t => t.id === sequence.sequence_type) || SEQUENCE_TYPES[1]
                const status = STATUS_OPTIONS.find(s => s.id === sequence.status) || STATUS_OPTIONS[0]

                return (
                  <div
                    key={sequence.id}
                    className="es-item"
                    onClick={() => handleViewSequence(sequence)}
                  >
                    <div className="es-item-icon">{type.icon}</div>
                    <div className="es-item-info">
                      <span className="es-item-name">{sequence.name}</span>
                      <span className="es-item-type">{type.label}</span>
                      <div className="es-item-stats">
                        <span>{sequence.steps_count || 0} emails</span>
                        <span>•</span>
                        <span>{sequence.subscribers_count || 0} subscribers</span>
                      </div>
                    </div>
                    <div className="es-item-meta">
                      <span className="es-item-status" style={{ backgroundColor: status.color }}>
                        {status.label}
                      </span>
                      {sequence.open_rate > 0 && (
                        <span className="es-item-rate">{sequence.open_rate}% open</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sequence Detail Modal */}
        {selectedSequence && (
          <SequenceDetailModal
            sequence={selectedSequence}
            userId={user.id}
            onClose={() => { setSelectedSequence(null); loadSequences() }}
            onEdit={() => {
              handleEditSequence(selectedSequence)
              setSelectedSequence(null)
            }}
            onDelete={() => handleDeleteSequence(selectedSequence.id)}
            onToggleStatus={() => handleToggleStatus(selectedSequence)}
            onGeneratePrompt={() => {
              promptGenerator.open(getPromptTemplate(selectedSequence.sequence_type))
              hapticLight()
            }}
          />
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <SequenceModal
            sequence={editingSequence}
            userId={user.id}
            onClose={() => {
              setShowAddModal(false)
              setEditingSequence(null)
            }}
            onSave={(savedSequence) => {
              if (editingSequence) {
                setSequences(sequences.map(s => s.id === savedSequence.id ? savedSequence : s))
              } else {
                setSequences([savedSequence, ...sequences])
              }
              setShowAddModal(false)
              setEditingSequence(null)
            }}
          />
        )}

        {/* Prompt Generator Modal */}
        <promptGenerator.PromptGeneratorModal />
      </div>
    </PullToRefresh>
  )
}

/**
 * Sequence Detail Modal - with Email Steps & PromptGenerator
 */
function SequenceDetailModal({ sequence, userId, onClose, onEdit, onDelete, onToggleStatus, onGeneratePrompt }) {
  const type = SEQUENCE_TYPES.find(t => t.id === sequence.sequence_type) || SEQUENCE_TYPES[1]
  const status = STATUS_OPTIONS.find(s => s.id === sequence.status) || STATUS_OPTIONS[0]

  const [steps, setSteps] = useState([])
  const [loadingSteps, setLoadingSteps] = useState(true)
  const [showStepForm, setShowStepForm] = useState(false)
  const [editingStep, setEditingStep] = useState(null)
  const [copiedStepId, setCopiedStepId] = useState(null)

  // Load email steps
  useEffect(() => {
    async function loadSteps() {
      try {
        const { data, error } = await supabase
          .from('crm_email_steps')
          .select('*')
          .eq('sequence_id', sequence.id)
          .eq('user_id', userId)
          .order('step_number', { ascending: true })

        if (error) throw error
        setSteps(data || [])
      } catch (err) {
        console.error('Error loading steps:', err)
      } finally {
        setLoadingSteps(false)
      }
    }
    loadSteps()
  }, [sequence.id, userId])

  const handleAddStep = () => {
    setEditingStep(null)
    setShowStepForm(true)
    hapticLight()
  }

  const handleEditStep = (step) => {
    setEditingStep(step)
    setShowStepForm(true)
    hapticLight()
  }

  const handleDeleteStep = async (stepId) => {
    if (!confirm('Delete this email?')) return

    try {
      const { error } = await supabase
        .from('crm_email_steps')
        .delete()
        .eq('id', stepId)
        .eq('user_id', userId)

      if (error) throw error
      const remaining = steps.filter(s => s.id !== stepId)
      setSteps(remaining)

      // Update steps_count on sequence
      await supabase
        .from('crm_email_sequences')
        .update({ steps_count: remaining.length })
        .eq('id', sequence.id)

      hapticMedium()
    } catch (err) {
      console.error('Error deleting step:', err)
    }
  }

  const handleCopyStep = async (step) => {
    const text = `Subject: ${step.subject}${step.body ? `\n\n${step.body}` : ''}`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStepId(step.id)
      hapticLight()
      setTimeout(() => setCopiedStepId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyAll = async () => {
    const text = steps.map(step =>
      `--- Email ${step.step_number} (Day ${step.delay_days}) ---\nSubject: ${step.subject}${step.body ? `\n\n${step.body}` : ''}`
    ).join('\n\n')
    const full = `${sequence.name} - Email Sequence\n\n${text}`
    try {
      await navigator.clipboard.writeText(full)
      setCopiedStepId('all')
      hapticMedium()
      setTimeout(() => setCopiedStepId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleStepSaved = (savedStep) => {
    if (editingStep) {
      setSteps(steps.map(s => s.id === savedStep.id ? savedStep : s))
    } else {
      setSteps([...steps, savedStep].sort((a, b) => a.step_number - b.step_number))
    }
    setShowStepForm(false)
    setEditingStep(null)
  }

  return (
    <div className="es-detail-overlay" onClick={onClose}>
      <div className="es-detail-modal" onClick={e => e.stopPropagation()}>
        <header className="es-detail-header">
          <div className="es-detail-title-row">
            <span className="es-detail-icon">{type.icon}</span>
            <div>
              <h2>{sequence.name}</h2>
              <span className="es-detail-type">{type.label}</span>
            </div>
          </div>
          <button className="es-detail-close" onClick={onClose}>×</button>
        </header>

        <div className="es-detail-content">
          <div className="es-detail-stats">
            <div className="es-stat">
              <span className="es-stat-value">{steps.length}</span>
              <span className="es-stat-label">Emails</span>
            </div>
            <div className="es-stat">
              <span className="es-stat-value">{sequence.subscribers_count || 0}</span>
              <span className="es-stat-label">Subscribers</span>
            </div>
            <div className="es-stat">
              <span className="es-stat-value">{sequence.open_rate || 0}%</span>
              <span className="es-stat-label">Open Rate</span>
            </div>
            <div className="es-stat">
              <span className="es-stat-value">{sequence.click_rate || 0}%</span>
              <span className="es-stat-label">Click Rate</span>
            </div>
          </div>

          {sequence.description && (
            <div className="es-detail-description">
              <h3>Description</h3>
              <p>{sequence.description}</p>
            </div>
          )}

          <div className="es-detail-status">
            <span className="es-detail-status-label">Status:</span>
            <span className="es-detail-status-badge" style={{ backgroundColor: status.color }}>
              {status.label}
            </span>
          </div>

          {/* Email Steps Section */}
          <div className="es-steps-section">
            <div className="es-steps-header">
              <h3>Emails in Sequence</h3>
              <button className="es-steps-add-btn" onClick={handleAddStep}>
                + Add Email
              </button>
            </div>

            {loadingSteps ? (
              <div className="es-steps-loading">Loading emails...</div>
            ) : steps.length === 0 ? (
              <div className="es-steps-empty">
                <p>No emails yet. Add your first email to this sequence.</p>
              </div>
            ) : (
              <div className="es-steps-list">
                {steps.map((step) => (
                  <div key={step.id} className="es-step-item">
                    <div className="es-step-number">
                      <span>Day {step.delay_days}</span>
                    </div>
                    <div className="es-step-content">
                      <span className="es-step-subject">{step.subject}</span>
                      {step.body && (
                        <p className="es-step-preview">
                          {step.body.length > 80 ? step.body.slice(0, 80) + '...' : step.body}
                        </p>
                      )}
                    </div>
                    <div className="es-step-actions">
                      <button
                        className={`es-step-copy-btn ${copiedStepId === step.id ? 'copied' : ''}`}
                        onClick={() => handleCopyStep(step)}
                      >
                        {copiedStepId === step.id ? '✓' : '📋'}
                      </button>
                      <button
                        className="es-step-edit-btn"
                        onClick={() => handleEditStep(step)}
                      >
                        Edit
                      </button>
                      <button
                        className="es-step-delete-btn"
                        onClick={() => handleDeleteStep(step.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy All & Generate Buttons */}
          {steps.length > 0 && (
            <button
              className={`es-copy-all-btn ${copiedStepId === 'all' ? 'copied' : ''}`}
              onClick={handleCopyAll}
            >
              {copiedStepId === 'all' ? '✓ Copied All!' : '📋 Copy All Emails'}
            </button>
          )}
          <button className="es-generate-prompt-btn" onClick={onGeneratePrompt}>
            ✨ Generate Email Copy Prompt
          </button>
        </div>

        <div className="es-detail-actions">
          <button className="es-btn es-btn-delete" onClick={onDelete}>
            Delete
          </button>
          <button
            className={`es-btn ${sequence.status === 'active' ? 'es-btn-pause' : 'es-btn-activate'}`}
            onClick={onToggleStatus}
          >
            {sequence.status === 'active' ? '⏸ Pause' : '▶ Activate'}
          </button>
          <button className="es-btn es-btn-edit" onClick={onEdit}>
            Edit
          </button>
        </div>

        {/* Email Step Form (inline) */}
        {showStepForm && (
          <EmailStepForm
            step={editingStep}
            sequenceId={sequence.id}
            userId={userId}
            nextStepNumber={steps.length + 1}
            onClose={() => { setShowStepForm(false); setEditingStep(null) }}
            onSave={handleStepSaved}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Email Step Add/Edit Form (overlay within detail modal)
 */
function EmailStepForm({ step, sequenceId, userId, nextStepNumber, onClose, onSave }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    subject: step?.subject || '',
    body: step?.body || '',
    delay_days: step?.delay_days || (nextStepNumber === 1 ? 0 : nextStepNumber),
    step_number: step?.step_number || nextStepNumber,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject.trim()) return

    setSaving(true)
    try {
      if (step?.id) {
        const { data, error } = await supabase
          .from('crm_email_steps')
          .update({
            subject: form.subject.trim(),
            body: form.body.trim() || null,
            delay_days: parseInt(form.delay_days) || 0,
            step_number: parseInt(form.step_number) || 1,
          })
          .eq('id', step.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        onSave(data)
      } else {
        const { data, error } = await supabase
          .from('crm_email_steps')
          .insert({
            sequence_id: sequenceId,
            user_id: userId,
            subject: form.subject.trim(),
            body: form.body.trim() || null,
            delay_days: parseInt(form.delay_days) || 0,
            step_number: parseInt(form.step_number) || nextStepNumber,
          })
          .select()
          .single()

        if (error) throw error

        // Update steps_count on the parent sequence
        await supabase
          .from('crm_email_sequences')
          .update({ steps_count: nextStepNumber })
          .eq('id', sequenceId)

        onSave(data)
      }
      hapticMedium()
    } catch (err) {
      console.error('Error saving email step:', err)
      alert('Failed to save email. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="es-step-form-overlay" onClick={onClose}>
      <div className="es-step-form" onClick={e => e.stopPropagation()}>
        <header className="es-step-form-header">
          <h3>{step ? 'Edit Email' : 'Add Email'}</h3>
          <button className="es-detail-close" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="es-step-form-body">
          <div className="form-group">
            <label>Subject Line *</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g., Welcome to the journey!"
              required
              autoFocus
            />
          </div>

          <div className="es-step-form-row">
            <div className="form-group">
              <label>Send Day</label>
              <input
                type="number"
                min="0"
                max="365"
                value={form.delay_days}
                onChange={e => setForm({ ...form, delay_days: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Order</label>
              <input
                type="number"
                min="1"
                max="99"
                value={form.step_number}
                onChange={e => setForm({ ...form, step_number: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Body</label>
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="Write your email content here..."
              rows={6}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : (step ? 'Save' : 'Add Email')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Sequence Add/Edit Modal
 */
function SequenceModal({ sequence, userId, onClose, onSave }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: sequence?.name || '',
    sequence_type: sequence?.sequence_type || 'nurture',
    description: sequence?.description || '',
    status: sequence?.status || 'draft',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      if (sequence?.id) {
        // Update
        const { data, error } = await supabase
          .from('crm_email_sequences')
          .update({
            name: form.name.trim(),
            sequence_type: form.sequence_type,
            description: form.description.trim() || null,
            status: form.status,
          })
          .eq('id', sequence.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        onSave(data)
      } else {
        // Create
        const { data, error } = await supabase
          .from('crm_email_sequences')
          .insert({
            user_id: userId,
            name: form.name.trim(),
            sequence_type: form.sequence_type,
            description: form.description.trim() || null,
            status: form.status,
          })
          .select()
          .single()

        if (error) throw error
        onSave(data)
      }
      hapticMedium()
    } catch (err) {
      console.error('Error saving sequence:', err)
      alert('Failed to save sequence. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="es-modal-overlay" onClick={onClose}>
      <div className="es-modal" onClick={e => e.stopPropagation()}>
        <header className="es-modal-header">
          <h2>{sequence ? 'Edit Sequence' : 'Create Sequence'}</h2>
          <button className="es-modal-close" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="es-modal-form">
          <div className="form-group">
            <label>Sequence Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., 7-Day Welcome Series"
              required
            />
          </div>

          <div className="form-group">
            <label>Sequence Type</label>
            <div className="es-type-grid">
              {SEQUENCE_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`es-type-option ${form.sequence_type === type.id ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, sequence_type: type.id })}
                >
                  <span className="es-type-icon">{type.icon}</span>
                  <span className="es-type-label">{type.label}</span>
                  <span className="es-type-desc">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What is this sequence about?"
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : (sequence ? 'Save Changes' : 'Create Sequence')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
