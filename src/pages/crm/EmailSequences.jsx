/**
 * Email Sequences - Automated Nurture Campaigns
 * Create and manage email sequences for lead nurturing
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import PullToRefresh from '../../components/crm/PullToRefresh'
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

export default function EmailSequences() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [sequences, setSequences] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSequence, setEditingSequence] = useState(null)
  const [selectedSequence, setSelectedSequence] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

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
            onClose={() => setSelectedSequence(null)}
            onEdit={() => {
              handleEditSequence(selectedSequence)
              setSelectedSequence(null)
            }}
            onDelete={() => handleDeleteSequence(selectedSequence.id)}
            onToggleStatus={() => handleToggleStatus(selectedSequence)}
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
      </div>
    </PullToRefresh>
  )
}

/**
 * Sequence Detail Modal
 */
function SequenceDetailModal({ sequence, onClose, onEdit, onDelete, onToggleStatus }) {
  const type = SEQUENCE_TYPES.find(t => t.id === sequence.sequence_type) || SEQUENCE_TYPES[1]
  const status = STATUS_OPTIONS.find(s => s.id === sequence.status) || STATUS_OPTIONS[0]

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
              <span className="es-stat-value">{sequence.steps_count || 0}</span>
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
