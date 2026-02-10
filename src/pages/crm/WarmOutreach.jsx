/**
 * Warm Outreach - Follow Up with Engaged Leads
 * Filtered view of crm_contacts where outreach_status IS NOT NULL
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { usePromptGenerator } from '../../components/crm/PromptGenerator'
import { createDeal, scheduleFollowUp, ACTIVE_STAGES, STAGE_INFO } from '../../lib/crm/dealService'
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
    { id: 'poll_response', label: 'Poll Response', icon: '📊' },
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

export default function WarmOutreach() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState([])
  const [deals, setDeals] = useState([])
  const [projects, setProjects] = useState([])
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

  // Load leads (contacts with outreach_status set)
  const loadLeads = useCallback(async () => {
    if (!user?.id) return

    try {
      const [leadsRes, dealsRes, projectsRes] = await Promise.all([
        supabase
          .from('crm_contacts')
          .select('*')
          .eq('user_id', user.id)
          .not('outreach_status', 'is', null)
          .order('priority', { ascending: false, nullsFirst: false })
          .order('updated_at', { ascending: false }),
        supabase
          .from('sales_deals')
          .select('id, contact_id, contact_email, contact_name, project_id, status')
          .eq('user_id', user.id),
        supabase
          .from('user_projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (leadsRes.error) throw leadsRes.error
      setLeads(leadsRes.data || [])
      setDeals(dealsRes.data || [])
      setProjects(projectsRes.data || [])
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
    return leads.filter(l => l.outreach_status === filterStatus)
  }, [leads, filterStatus])

  // Stats
  const stats = useMemo(() => {
    const total = leads.length
    const toContact = leads.filter(l => l.outreach_status === 'to_contact').length
    const inConversation = leads.filter(l => l.outreach_status === 'in_conversation').length
    const booked = leads.filter(l => l.outreach_status === 'meeting_booked').length

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

  const handleRemoveFromOutreach = async (contactId) => {
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .update({
          outreach_status: null,
          priority: null,
          temperature: null,
          engagement_type: null,
          outreach_status_entered_at: null,
        })
        .eq('id', contactId)
        .eq('user_id', user.id)

      if (error) throw error
      setLeads(leads.filter(l => l.id !== contactId))
      hapticMedium()
    } catch (err) {
      console.error('Error removing from outreach:', err)
    }
  }

  const handleDeleteContact = async (contactId) => {
    if (!confirm('This removes the contact entirely (not just from outreach). Are you sure?')) return

    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id)

      if (error) throw error
      setLeads(leads.filter(l => l.id !== contactId))
      hapticMedium()
    } catch (err) {
      console.error('Error deleting contact:', err)
    }
  }

  const handleStatusChange = async (lead, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update({ outreach_status: newStatus, updated_at: new Date().toISOString() })
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
              {status.icon} ({leads.filter(l => l.outreach_status === status.id).length})
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
                const status = OUTREACH_STATUS.find(s => s.id === lead.outreach_status) || OUTREACH_STATUS[0]
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
                        value={lead.outreach_status}
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
            userProjects={projects}
            existingDeals={editingLead
              ? deals.filter(d =>
                  d.contact_id === editingLead.id ||
                  (d.contact_email && editingLead.email &&
                   d.contact_email.toLowerCase() === editingLead.email.toLowerCase())
                )
              : []
            }
            onClose={() => {
              setShowAddModal(false)
              setEditingLead(null)
            }}
            onSave={(savedLead) => {
              loadLeads() // Re-fetch to pick up deal links
              setShowAddModal(false)
              setEditingLead(null)
            }}
            onRemoveFromOutreach={handleRemoveFromOutreach}
            onDeleteContact={handleDeleteContact}
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
function WarmLeadModal({ lead, userId, userProjects = [], existingDeals = [], onClose, onSave, onRemoveFromOutreach, onDeleteContact }) {
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
    handle: lead?.social_handle || '',
    engagement_type: lead?.engagement_type || 'liked_post',
    status: lead?.outreach_status || 'to_contact',
    priority: lead?.priority || 5,
    notes: initialNotes,
  })

  // Project + deal creation
  const [dealProject, setDealProject] = useState('')
  const [dealStage, setDealStage] = useState('lead')
  const [dealFollowUp, setDealFollowUp] = useState('')

  const linkedProjectIds = useMemo(() =>
    new Set(existingDeals.map(d => d.project_id).filter(Boolean)),
    [existingDeals]
  )
  const availableProjects = useMemo(() =>
    userProjects.filter(p => !linkedProjectIds.has(p.id)),
    [userProjects, linkedProjectIds]
  )

  // When source changes, reset engagement_type if current selection isn't in new source
  useEffect(() => {
    const options = ENGAGEMENT_BY_SOURCE[form.source] || []
    if (options.length && !options.find(e => e.id === form.engagement_type)) {
      setForm(prev => ({ ...prev, engagement_type: options[0].id }))
    }
  }, [form.source, form.engagement_type])

  const sourceEngagements = ENGAGEMENT_BY_SOURCE[form.source] || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      const contactFields = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        source: form.source,
        platform: form.platform,
        social_handle: form.handle.trim() || null,
        engagement_type: form.engagement_type,
        outreach_status: form.status,
        priority: parseInt(form.priority),
        notes: form.notes.trim() || null,
      }

      let savedResult
      // Clear stale last_message since notes now contains the merged content
      contactFields.last_message = null
      // Set outreach_status_entered_at on new leads (trigger only fires on UPDATE)
      if (!lead?.id) {
        contactFields.outreach_status_entered_at = new Date().toISOString()
      }

      if (lead?.id) {
        // Editing existing contact
        const { data, error } = await supabase
          .from('crm_contacts')
          .update(contactFields)
          .eq('id', lead.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        savedResult = data
      } else {
        // New lead — case-insensitive check for existing contact by name
        const { data: matches } = await supabase
          .from('crm_contacts')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', form.name.trim())
          .limit(1)

        if (matches?.length > 0) {
          // Update existing contact with outreach fields
          const { data, error } = await supabase
            .from('crm_contacts')
            .update(contactFields)
            .eq('id', matches[0].id)
            .eq('user_id', userId)
            .select()
            .single()

          if (error) throw error
          savedResult = data
        } else {
          // Insert new contact
          const { data, error } = await supabase
            .from('crm_contacts')
            .insert({ user_id: userId, lifecycle_stage: 'lead', ...contactFields })
            .select()
            .single()

          if (error) throw error
          savedResult = data
        }
      }

      // Create a deal if a project was selected
      if (dealProject) {
        const project = availableProjects.find(p => p.id === dealProject)
        const dealName = `${form.name.trim()} - ${project?.name || 'Project'}`
        const stageInfo = STAGE_INFO[dealStage]
        const { data: newDeal } = await createDeal(userId, {
          project_id: dealProject,
          contact_id: savedResult.id,
          contact_name: dealName,
          contact_email: form.email.trim() || null,
          source: form.source,
          product_type: project?.name || 'Project',
          value: 0,
          status: dealStage,
          probability: stageInfo?.probability || 10,
        })

        if (newDeal?.id && dealFollowUp) {
          await scheduleFollowUp(newDeal.id, userId, dealFollowUp)
        }
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

          {/* Project + Deal section */}
          {userProjects.length > 0 && (
            <div className="wo-deal-section">
              {/* Show existing project links when editing */}
              {lead && existingDeals.length > 0 && (
                <div className="wo-existing-projects">
                  <label>Linked Projects</label>
                  <div className="wo-existing-project-list">
                    {existingDeals.map(deal => {
                      const proj = userProjects.find(p => p.id === deal.project_id)
                      const stageInfo = STAGE_INFO[deal.status]
                      return proj ? (
                        <div key={deal.id} className="wo-project-pill">
                          <span className="wo-project-pill-name">{proj.name}</span>
                          <span className="wo-project-pill-stage">{stageInfo?.label || deal.status}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Add new project */}
              {availableProjects.length > 0 && (
                <>
                  <div className="form-group">
                    <label>{lead && existingDeals.length > 0 ? 'Add Another Project' : 'Project'}</label>
                    <select
                      value={dealProject}
                      onChange={e => setDealProject(e.target.value)}
                    >
                      <option value="">No project (lead only)</option>
                      {availableProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {dealProject && (
                    <div className="wo-deal-fields">
                      <p className="wo-deal-fields-hint">A deal will be created for this project</p>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Pipeline Stage</label>
                          <select
                            value={dealStage}
                            onChange={e => setDealStage(e.target.value)}
                          >
                            {ACTIVE_STAGES.map(stage => (
                              <option key={stage} value={stage}>
                                {STAGE_INFO[stage]?.label || stage}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Follow-up</label>
                          <input
                            type="date"
                            value={dealFollowUp}
                            onChange={e => setDealFollowUp(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="modal-actions">
            {lead && (
              <div className="modal-actions-left">
                <button
                  type="button"
                  className="btn-remove-outreach"
                  onClick={() => {
                    onRemoveFromOutreach(lead.id)
                    onClose()
                  }}
                >
                  Remove from Outreach
                </button>
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => {
                    onDeleteContact(lead.id)
                    onClose()
                  }}
                >
                  Delete Contact
                </button>
              </div>
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
