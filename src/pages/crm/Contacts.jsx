/**
 * Contacts - CRM Contact Management
 * Manage leads and customers with tagging, notes, and lifecycle stages
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { createDeal, scheduleFollowUp } from '../../lib/crm/dealService'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import './Contacts.css'

const LIFECYCLE_STAGES = [
  { id: 'lead', label: 'Lead', color: '#6b7280', icon: '🎯' },
  { id: 'opportunity', label: 'Opportunity', color: '#8b5cf6', icon: '💼' },
  { id: 'customer', label: 'Customer', color: '#10b981', icon: '⭐' },
  { id: 'evangelist', label: 'Evangelist', color: '#f59e0b', icon: '🔥' },
]

const SOURCES = [
  { id: 'Content', label: 'Content', icon: '📝' },
  { id: 'Warm Outreach', label: 'Warm Outreach', icon: '🤝' },
  { id: 'Cold Outreach', label: 'Cold Outreach', icon: '📧' },
  { id: 'Paid Ads', label: 'Paid Ads', icon: '📣' },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function Contacts() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [prefillData, setPrefillData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  // Hide bottom toolbar when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.classList.add('modal-active')
    } else {
      document.body.classList.remove('modal-active')
    }
    return () => document.body.classList.remove('modal-active')
  }, [showAddModal])

  // Load contacts
  const loadContacts = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadContacts()
    }
  }, [user?.id, loadContacts])

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !searchQuery ||
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.social_handle?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStage = filterStage === 'all' || contact.lifecycle_stage === filterStage

      return matchesSearch && matchesStage
    })
  }, [contacts, searchQuery, filterStage])

  // Stats
  const stats = useMemo(() => {
    const total = contacts.length
    const byStage = LIFECYCLE_STAGES.reduce((acc, stage) => {
      acc[stage.id] = contacts.filter(c => c.lifecycle_stage === stage.id).length
      return acc
    }, {})
    const thisWeek = contacts.filter(c => {
      const created = new Date(c.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created >= weekAgo
    }).length

    return { total, byStage, thisWeek }
  }, [contacts])

  // Handlers
  const handleAddContact = () => {
    setEditingContact(null)
    setPrefillData(null)
    setShowAddModal(true)
    setShowAddMenu(false)
    hapticLight()
  }

  const handleScreenshotAnalysis = () => {
    setShowAddMenu(false)
    hapticLight()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      setAnalyzing(true)
      try {
        // Convert to base64
        const reader = new FileReader()
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.readAsDataURL(file)
        })

        const { data, error } = await supabase.functions.invoke('analyze-leads-screenshot', {
          body: { imageBase64: base64, mimeType: file.type }
        })

        if (error) throw error

        if (data?.success && data.leads?.length > 0) {
          const lead = data.leads[0]
          setPrefillData({
            name: lead.name?.replace(/^@/, '') || '',
            email: lead.email || '',
            phone: lead.phone || '',
            social_handle: lead.handle || '',
            notes: lead.message_preview || '',
            source: lead.platform === 'Instagram' || lead.platform === 'LinkedIn'
              ? 'Content' : 'Warm Outreach',
          })
          setEditingContact(null)
          setShowAddModal(true)
        } else {
          alert('No contacts found in screenshot. Try a clearer image.')
        }
      } catch (err) {
        console.error('Screenshot analysis error:', err)
        alert('Failed to analyze screenshot. Please try again.')
      } finally {
        setAnalyzing(false)
      }
    }
    input.click()
  }

  const handleEditContact = (contact) => {
    setEditingContact(contact)
    setShowAddModal(true)
    hapticLight()
  }

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', user.id)

      if (error) throw error
      setContacts(contacts.filter(c => c.id !== contactId))
      hapticMedium()
    } catch (err) {
      console.error('Error deleting contact:', err)
    }
  }

  if (loading) {
    return (
      <div className="contacts-container">
        <div className="contacts-loading">
          <div className="contacts-spinner" />
          <p>Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadContacts}>
      <div className="contacts-container">
        {/* Top Toolbar */}
        <div className="contacts-toolbar">
          <button className="contacts-back-btn" onClick={() => navigate('/crm/nurture')}>
            ←
          </button>
          <h2 className="contacts-toolbar-title">Contacts</h2>
        </div>

        {/* Actions Card */}
        <div className="contacts-actions-card">
          <div className="search-row">
            <input
              type="text"
              className="contacts-search"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="add-btn-wrapper">
              <button
                className="contacts-add-btn"
                onClick={() => { setShowAddMenu(!showAddMenu); hapticLight() }}
              >
                + Add
              </button>
              {showAddMenu && (
                <>
                  <div className="add-menu-backdrop" onClick={() => setShowAddMenu(false)} />
                  <div className="add-menu">
                    <button className="add-menu-item" onClick={handleAddContact}>
                      <span className="add-menu-icon">👤</span>
                      <span>Single Contact</span>
                    </button>
                    <button className="add-menu-item" onClick={() => { setShowAddMenu(false); navigate('/crm/import') }}>
                      <span className="add-menu-icon">📄</span>
                      <span>CSV Upload</span>
                    </button>
                    <button className="add-menu-item" onClick={handleScreenshotAnalysis}>
                      <span className="add-menu-icon">📸</span>
                      <span>Screenshot Analysis</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Screenshot analyzing overlay */}
        {analyzing && (
          <div className="analyzing-overlay">
            <div className="contacts-spinner" />
            <p>Analyzing screenshot...</p>
          </div>
        )}

        {/* Stage Filters */}
        <div className="contacts-filters">
          <button
            className={`filter-chip ${filterStage === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStage('all')}
          >
            All ({stats.total})
          </button>
          {LIFECYCLE_STAGES.map(stage => (
            <button
              key={stage.id}
              className={`filter-chip ${filterStage === stage.id ? 'active' : ''}`}
              onClick={() => setFilterStage(stage.id)}
              style={{ '--chip-color': stage.color }}
            >
              {stage.icon} {stage.label} ({stats.byStage[stage.id] || 0})
            </button>
          ))}
        </div>

        {/* Contacts List */}
        <div className="contacts-list-card">
          {filteredContacts.length === 0 ? (
            <div className="contacts-empty">
              {searchQuery || filterStage !== 'all' ? (
                <p>No contacts match your filters</p>
              ) : (
                <div className="contacts-empty-rich">
                  <div className="empty-icon">👥</div>
                  <h3>Let's build your network</h3>
                  <p>Track the people in your world — from first touch to loyal customer</p>
                  <button className="empty-add-btn" onClick={handleAddContact}>
                    Add Your First Contact
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="contacts-list">
              {filteredContacts.map((contact, idx) => {
                const stage = LIFECYCLE_STAGES.find(s => s.id === contact.lifecycle_stage) || LIFECYCLE_STAGES[0]
                const recency = timeAgo(contact.updated_at)
                return (
                  <div
                    key={contact.id}
                    className="contact-item"
                    style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
                    onClick={() => handleEditContact(contact)}
                  >
                    <div className="contact-avatar" style={{ backgroundColor: stage.color }}>
                      {contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{contact.name}</span>
                      <span className="contact-email">{contact.email || contact.social_handle || 'No email'}</span>
                      {contact.company && (
                        <span className="contact-company">{contact.company}</span>
                      )}
                    </div>
                    <div className="contact-meta">
                      <span className="contact-stage" style={{ backgroundColor: stage.color }}>
                        {stage.icon} {stage.label}
                      </span>
                      {recency && <span className="contact-recency">{recency}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <ContactModal
            contact={editingContact}
            prefill={prefillData}
            userId={user.id}
            onClose={() => {
              setShowAddModal(false)
              setEditingContact(null)
            }}
            onSave={(savedContact) => {
              if (editingContact) {
                setContacts(contacts.map(c => c.id === savedContact.id ? savedContact : c))
              } else {
                setContacts([savedContact, ...contacts])
              }
              setShowAddModal(false)
              setEditingContact(null)
            }}
            onDelete={handleDeleteContact}
          />
        )}
      </div>
    </PullToRefresh>
  )
}

/**
 * Contact Add/Edit Modal
 */
function ContactModal({ contact, prefill, userId, onClose, onSave, onDelete }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: contact?.name || prefill?.name || '',
    email: contact?.email || prefill?.email || '',
    phone: contact?.phone || prefill?.phone || '',
    company: contact?.company || '',
    social_handle: contact?.social_handle || prefill?.social_handle || '',
    lifecycle_stage: contact?.lifecycle_stage || 'lead',
    source: contact?.source || prefill?.source || 'Content',
    tags: contact?.tags || [],
    notes: contact?.notes || prefill?.notes || '',
  })
  const [tagInput, setTagInput] = useState('')

  // Deal creation toggle (only for new contacts)
  const [alsoDeal, setAlsoDeal] = useState(false)
  const [projects, setProjects] = useState([])
  const [dealProject, setDealProject] = useState('')
  const [dealValue, setDealValue] = useState(497)
  const [dealFollowUp, setDealFollowUp] = useState('')

  useEffect(() => {
    if (alsoDeal && projects.length === 0) {
      supabase
        .from('user_projects')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data?.length) {
            setProjects(data)
            setDealProject(data[0].id)
          }
        })
    }
  }, [alsoDeal, userId, projects.length])

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      if (contact?.id) {
        // Update
        const { data, error } = await supabase
          .from('crm_contacts')
          .update({
            name: form.name.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            company: form.company.trim() || null,
            social_handle: form.social_handle.trim() || null,
            lifecycle_stage: form.lifecycle_stage,
            source: form.source,
            tags: form.tags,
            notes: form.notes.trim() || null,
          })
          .eq('id', contact.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        onSave(data)
      } else {
        // Create
        const { data, error } = await supabase
          .from('crm_contacts')
          .insert({
            user_id: userId,
            name: form.name.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            company: form.company.trim() || null,
            social_handle: form.social_handle.trim() || null,
            lifecycle_stage: form.lifecycle_stage,
            source: form.source,
            tags: form.tags,
            notes: form.notes.trim() || null,
          })
          .select()
          .single()

        if (error) throw error

        // Also create a deal if toggled on
        if (alsoDeal && dealProject) {
          const project = projects.find(p => p.id === dealProject)
          const dealName = `${form.name.trim()} - ${project?.name || 'Project'}`
          const { data: newDeal } = await createDeal(userId, {
            project_id: dealProject,
            contact_name: dealName,
            contact_email: form.email.trim() || null,
            source: form.source,
            product_type: project?.name || 'Project',
            value: dealValue || 0,
            status: 'lead',
          })

          // Schedule follow-up if date set
          if (newDeal?.id && dealFollowUp) {
            await scheduleFollowUp(newDeal.id, userId, dealFollowUp)
          }
        }

        onSave(data)
      }
      hapticMedium()
    } catch (err) {
      console.error('Error saving contact:', err)
      alert('Failed to save contact. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div className="contact-modal" onClick={e => e.stopPropagation()}>
        <header className="contact-modal-header">
          <h2>{contact ? 'Edit Contact' : 'Add Contact'}</h2>
          <button className="contact-modal-close" onClick={onClose}>×</button>
        </header>

        {contact && (
          <div className="contact-modal-context">
            <span>Added {timeAgo(contact.created_at)}</span>
            <span className="context-dot">·</span>
            <span>Updated {timeAgo(contact.updated_at)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="contact-modal-form">
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
                placeholder="+1 555 123 4567"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>
            <div className="form-group">
              <label>Social Handle</label>
              <input
                type="text"
                value={form.social_handle}
                onChange={e => setForm({ ...form, social_handle: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Stage</label>
              <select
                value={form.lifecycle_stage}
                onChange={e => setForm({ ...form, lifecycle_stage: e.target.value })}
              >
                {LIFECYCLE_STAGES.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.icon} {stage.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Source</label>
              <select
                value={form.source}
                onChange={e => setForm({ ...form, source: e.target.value })}
              >
                {SOURCES.map(source => (
                  <option key={source.id} value={source.id}>{source.icon} {source.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-input-container">
              <div className="tags-display">
                {form.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <div className="tag-input-row">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <button type="button" className="tag-add-btn" onClick={handleAddTag}>
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this contact..."
              rows={3}
            />
          </div>

          {/* Deal creation toggle - only for new contacts */}
          {!contact && (
            <div className="deal-toggle-section">
              <label className="toggle-row">
                <span className="toggle-label">Also create a deal?</span>
                <input
                  type="checkbox"
                  checked={alsoDeal}
                  onChange={e => setAlsoDeal(e.target.checked)}
                  className="toggle-checkbox"
                />
                <span className="toggle-switch" />
              </label>

              {alsoDeal && (
                <div className="deal-fields">
                  <div className="form-group">
                    <label>Project</label>
                    {projects.length > 0 ? (
                      <select
                        value={dealProject}
                        onChange={e => setDealProject(e.target.value)}
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="deal-no-projects">No projects found. Create one first.</p>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Value ($)</label>
                      <input
                        type="number"
                        value={dealValue}
                        onChange={e => setDealValue(Number(e.target.value))}
                        min="0"
                        placeholder="497"
                      />
                    </div>
                    <div className="form-group">
                      <label>Follow-up Date</label>
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
            </div>
          )}

          <div className="modal-actions">
            {contact && (
              <button
                type="button"
                className="btn-delete"
                onClick={() => {
                  onDelete(contact.id)
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
                {saving ? 'Saving...' : (contact ? 'Save' : 'Add Contact')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
