/**
 * Warm Outreach - Follow Up with Engaged Leads
 * Track and manage warm lead outreach conversations
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { usePromptGenerator } from '../../components/crm/PromptGenerator'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import './WarmOutreach.css'

const OUTREACH_STATUS = [
  { id: 'to_contact', label: 'To Contact', color: '#6b7280', icon: '📋' },
  { id: 'reached_out', label: 'Reached Out', color: '#3b82f6', icon: '📤' },
  { id: 'in_conversation', label: 'In Conversation', color: '#8b5cf6', icon: '💬' },
  { id: 'meeting_booked', label: 'Meeting Booked', color: '#10b981', icon: '📅' },
  { id: 'not_interested', label: 'Not Interested', color: '#ef4444', icon: '❌' },
]

const ENGAGEMENT_BY_SOURCE = {
  'Content': [
    { id: 'liked_post', label: 'Liked Post', icon: '❤️' },
    { id: 'commented', label: 'Commented', icon: '💬' },
    { id: 'lead_magnet', label: 'Downloaded Lead Magnet', icon: '📥' },
    { id: 'webinar', label: 'Webinar Attendee', icon: '🎥' },
  ],
  'Warm Outreach': [
    { id: 'dm', label: 'Sent DM', icon: '📩' },
    { id: 'email_reply', label: 'Email Reply', icon: '📧' },
    { id: 'referral', label: 'Referral', icon: '🤝' },
  ],
  'Cold Outreach': [
    { id: 'cold_dm', label: 'Cold DM', icon: '📩' },
    { id: 'cold_email', label: 'Cold Email', icon: '📧' },
    { id: 'cold_call', label: 'Cold Call', icon: '📞' },
  ],
  'Paid Ads': [
    { id: 'clicked_ad', label: 'Clicked Ad', icon: '🖱️' },
    { id: 'lead_form', label: 'Submitted Form', icon: '📋' },
    { id: 'landing_page', label: 'Landing Page', icon: '🔗' },
  ],
}

const ALL_ENGAGEMENT_TYPES = Object.values(ENGAGEMENT_BY_SOURCE).flat()
const SOURCE_CHANNELS = Object.keys(ENGAGEMENT_BY_SOURCE)

const PLATFORMS = ['Instagram', 'LinkedIn', 'Twitter/X', 'Facebook', 'Email', 'Other']

/**
 * Auto-sync warm lead to crm_contacts (upsert by user_id + name)
 */
async function syncLeadToContact(userId, leadData) {
  const engagement = ALL_ENGAGEMENT_TYPES.find(e => e.id === leadData.engagement_type)

  const contactFields = {
    user_id: userId,
    name: leadData.name,
    email: leadData.email || null,
    phone: leadData.phone || null,
    company: leadData.company || null,
    social_handle: leadData.handle || null,
    source: leadData.source || 'Content',
    lifecycle_stage: 'lead',
    tags: [leadData.platform, engagement?.label].filter(Boolean),
    notes: leadData.notes || null,
  }

  // Check if contact already exists for this user+name
  const { data: existing } = await supabase
    .from('crm_contacts')
    .select('id')
    .eq('user_id', userId)
    .eq('name', leadData.name)
    .maybeSingle()

  if (existing) {
    // Update existing — don't overwrite lifecycle_stage
    const { id, ...updateFields } = contactFields
    delete updateFields.user_id
    delete updateFields.lifecycle_stage
    const { data, error } = await supabase
      .from('crm_contacts')
      .update(updateFields)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contactFields)
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export default function WarmOutreach() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const promptGenerator = usePromptGenerator()

  // Hide bottom toolbar when any modal is open
  useEffect(() => {
    if (showAddModal || promptGenerator.isOpen) {
      document.body.classList.add('modal-active')
    } else {
      document.body.classList.remove('modal-active')
    }
    return () => document.body.classList.remove('modal-active')
  }, [showAddModal, promptGenerator.isOpen])

  // Load leads
  const loadLeads = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('crm_warm_leads')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (err) {
      console.error('Error loading leads:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadLeads()
    }
  }, [user?.id, loadLeads])

  // Filtered leads
  const filteredLeads = useMemo(() => {
    if (filterStatus === 'all') return leads
    return leads.filter(l => l.status === filterStatus)
  }, [leads, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = leads.length
    const toContact = leads.filter(l => l.status === 'to_contact').length
    const inConversation = leads.filter(l => l.status === 'in_conversation').length
    const booked = leads.filter(l => l.status === 'meeting_booked').length

    return { total, toContact, inConversation, booked }
  }, [leads])

  // Handlers
  const handleAddLead = () => {
    setEditingLead(null)
    setShowAddModal(true)
    hapticLight()
  }

  const handleEditLead = (lead) => {
    setEditingLead(lead)
    setShowAddModal(true)
    hapticLight()
  }

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const { error } = await supabase
        .from('crm_warm_leads')
        .delete()
        .eq('id', leadId)
        .eq('user_id', user.id)

      if (error) throw error
      setLeads(leads.filter(l => l.id !== leadId))
      hapticMedium()
    } catch (err) {
      console.error('Error deleting lead:', err)
    }
  }

  const handleStatusChange = async (lead, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('crm_warm_leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', lead.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setLeads(leads.map(l => l.id === lead.id ? data : l))
      hapticMedium()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  if (loading) {
    return (
      <div className="warm-outreach-container">
        <div className="warm-outreach-loading">
          <div className="warm-outreach-spinner" />
          <p>Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadLeads}>
      <div className="warm-outreach-container">
        {/* Top Toolbar */}
        <div className="warm-outreach-toolbar">
          <button className="wo-back-btn" onClick={() => navigate('/crm/nurture')}>
            ←
          </button>
          <h2 className="wo-toolbar-title">Warm Outreach</h2>
        </div>

        {/* Stats Card */}
        <div className="wo-stats-card">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{stats.toContact}</span>
              <span className="stat-label">To Contact</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{stats.inConversation}</span>
              <span className="stat-label">In Convo</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item highlight">
              <span className="stat-value">{stats.booked}</span>
              <span className="stat-label">Booked</span>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="wo-actions-card">
          <button className="wo-add-btn" onClick={handleAddLead}>
            + Add Warm Lead
          </button>
          <button
            className="wo-generate-btn"
            onClick={() => { promptGenerator.open('warmFollowUp'); hapticLight() }}
          >
            ✨ Generate Follow-up
          </button>
        </div>

        {/* Status Filters */}
        <div className="wo-filters">
          <button
            className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({leads.length})
          </button>
          {OUTREACH_STATUS.slice(0, 4).map(status => (
            <button
              key={status.id}
              className={`filter-chip ${filterStatus === status.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(status.id)}
            >
              {status.icon} ({leads.filter(l => l.status === status.id).length})
            </button>
          ))}
        </div>

        {/* Leads List */}
        <div className="wo-list-card">
          {filteredLeads.length === 0 ? (
            <div className="wo-empty">
              {filterStatus !== 'all' ? (
                <p>No leads with this status</p>
              ) : (
                <>
                  <p>No warm leads yet</p>
                  <p className="wo-empty-hint">Add people who have engaged with your content</p>
                  <button className="wo-empty-btn" onClick={handleAddLead}>
                    Add Your First Lead
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="wo-list">
              {filteredLeads.map(lead => {
                const status = OUTREACH_STATUS.find(s => s.id === lead.status) || OUTREACH_STATUS[0]
                const engagement = ALL_ENGAGEMENT_TYPES.find(e => e.id === lead.engagement_type)

                return (
                  <div
                    key={lead.id}
                    className={`wo-item ${lead.priority >= 8 ? 'high-priority' : ''}`}
                    onClick={() => handleEditLead(lead)}
                  >
                    <div className="wo-item-main">
                      <div className="wo-item-header">
                        <span className="wo-item-name">{lead.name}</span>
                        {lead.priority >= 8 && <span className="wo-priority-badge">🔥 Hot</span>}
                      </div>
                      <div className="wo-item-details">
                        <span className="wo-item-platform">{lead.platform}</span>
                        {engagement && (
                          <>
                            <span>•</span>
                            <span className="wo-item-engagement">{engagement.icon} {engagement.label}</span>
                          </>
                        )}
                      </div>
                      {lead.last_message && (
                        <p className="wo-item-message">{lead.last_message}</p>
                      )}
                    </div>
                    <div className="wo-item-actions">
                      <select
                        className="wo-status-select"
                        value={lead.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleStatusChange(lead, e.target.value)}
                        style={{ borderColor: status.color }}
                      >
                        {OUTREACH_STATUS.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.icon} {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <WarmLeadModal
            lead={editingLead}
            userId={user.id}
            onClose={() => {
              setShowAddModal(false)
              setEditingLead(null)
            }}
            onSave={(savedLead) => {
              if (editingLead) {
                setLeads(leads.map(l => l.id === savedLead.id ? savedLead : l))
              } else {
                setLeads([savedLead, ...leads])
              }
              setShowAddModal(false)
              setEditingLead(null)
            }}
            onDelete={handleDeleteLead}
          />
        )}

        {/* Prompt Generator Modal */}
        <promptGenerator.PromptGeneratorModal />
      </div>
    </PullToRefresh>
  )
}

/**
 * Warm Lead Add/Edit Modal
 */
function WarmLeadModal({ lead, userId, onClose, onSave, onDelete }) {
  const [saving, setSaving] = useState(false)

  // Merge old last_message into notes for existing leads
  const initialNotes = lead
    ? [lead.notes, lead.last_message].filter(Boolean).join('\n')
    : ''

  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    source: lead?.source || 'Content',
    platform: lead?.platform || 'Instagram',
    handle: lead?.handle || '',
    engagement_type: lead?.engagement_type || 'liked_post',
    status: lead?.status || 'to_contact',
    priority: lead?.priority || 5,
    notes: initialNotes,
  })

  // When source changes, reset engagement_type if current selection isn't in new source
  useEffect(() => {
    const options = ENGAGEMENT_BY_SOURCE[form.source] || []
    if (options.length && !options.find(e => e.id === form.engagement_type)) {
      setForm(prev => ({ ...prev, engagement_type: options[0].id }))
    }
  }, [form.source])

  const sourceEngagements = ENGAGEMENT_BY_SOURCE[form.source] || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      const leadFields = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        source: form.source,
        platform: form.platform,
        handle: form.handle.trim() || null,
        engagement_type: form.engagement_type,
        status: form.status,
        priority: parseInt(form.priority),
        notes: form.notes.trim() || null,
      }

      let savedResult
      if (lead?.id) {
        const { data, error } = await supabase
          .from('crm_warm_leads')
          .update(leadFields)
          .eq('id', lead.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        savedResult = data
      } else {
        const { data, error } = await supabase
          .from('crm_warm_leads')
          .insert({ user_id: userId, ...leadFields })
          .select()
          .single()

        if (error) throw error
        savedResult = data
      }

      // Auto-sync to contacts
      try {
        await syncLeadToContact(userId, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          source: form.source,
          platform: form.platform,
          handle: form.handle.trim(),
          engagement_type: form.engagement_type,
          notes: form.notes.trim(),
        })
      } catch (contactErr) {
        console.error('Error syncing contact:', contactErr)
      }

      onSave(savedResult)
      hapticMedium()
    } catch (err) {
      console.error('Error saving lead:', err)
      alert('Failed to save lead. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="wo-modal-overlay" onClick={onClose}>
      <div className="wo-modal" onClick={e => e.stopPropagation()}>
        <header className="wo-modal-header">
          <h2>{lead ? 'Edit Lead' : 'Add Warm Lead'}</h2>
          <button className="wo-modal-close" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="wo-modal-form">
          {/* Name */}
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="John Smith"
              required
            />
          </div>

          {/* Email + Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555 000 0000"
              />
            </div>
          </div>

          {/* Company */}
          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              placeholder="Acme Inc."
            />
          </div>

          {/* Source Channel */}
          <div className="form-group">
            <label>Source Channel</label>
            <div className="wo-source-grid">
              {SOURCE_CHANNELS.map(ch => (
                <button
                  key={ch}
                  type="button"
                  className={`wo-source-btn ${form.source === ch ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, source: ch })}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Engagement Type (filtered by source) */}
          <div className="form-group">
            <label>How did they engage?</label>
            <div className="wo-engagement-grid">
              {sourceEngagements.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`wo-engagement-option ${form.engagement_type === type.id ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, engagement_type: type.id })}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform + Handle */}
          <div className="form-row">
            <div className="form-group">
              <label>Platform</label>
              <select
                value={form.platform}
                onChange={e => setForm({ ...form, platform: e.target.value })}
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Handle/Username</label>
              <input
                type="text"
                value={form.handle}
                onChange={e => setForm({ ...form, handle: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>

          {/* Status + Priority */}
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                {OUTREACH_STATUS.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
              />
              <span className="priority-value">{form.priority} {form.priority >= 8 ? '🔥' : ''}</span>
            </div>
          </div>

          {/* Notes (merged) */}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Context, last message, any details..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            {lead && (
              <button
                type="button"
                className="btn-delete"
                onClick={() => {
                  onDelete(lead.id)
                  onClose()
                }}
              >
                Delete
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Saving...' : (lead ? 'Save' : 'Add Lead')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
