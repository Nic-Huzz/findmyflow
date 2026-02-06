/**
 * Contacts - CRM Contact Management
 * Manage leads and customers with tagging, notes, and lifecycle stages
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import './Contacts.css'

const LIFECYCLE_STAGES = [
  { id: 'lead', label: 'Lead', color: '#6b7280', icon: '🎯' },
  { id: 'qualified', label: 'Qualified', color: '#3b82f6', icon: '✓' },
  { id: 'opportunity', label: 'Opportunity', color: '#8b5cf6', icon: '💼' },
  { id: 'customer', label: 'Customer', color: '#10b981', icon: '⭐' },
  { id: 'evangelist', label: 'Evangelist', color: '#f59e0b', icon: '🔥' },
]

const SOURCES = [
  'Organic Social',
  'Paid Ads',
  'Referral',
  'Website',
  'Cold Outreach',
  'Event',
  'Other',
]

export default function Contacts() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('all')

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
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase())

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
    setShowAddModal(true)
    hapticLight()
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

        {/* Header */}
        <header className="contacts-header">
          <div className="contacts-breadcrumb">
            <button onClick={() => navigate('/crm')}>Home</button>
            <span>→</span>
            <button onClick={() => navigate('/crm/nurture')}>Nurture</button>
            <span>→</span>
            <span>Contacts</span>
          </div>
          <h1 className="contacts-title">👥 Contacts</h1>
          <p className="contacts-subtitle">Manage your leads and customers</p>
        </header>

        {/* Stats Card */}
        <div className="contacts-stats-card">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{stats.thisWeek}</span>
              <span className="stat-label">This Week</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">{stats.byStage.customer || 0}</span>
              <span className="stat-label">Customers</span>
            </div>
          </div>
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
            <button className="contacts-add-btn" onClick={handleAddContact}>
              + Add
            </button>
          </div>
        </div>

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
                <>
                  <p>No contacts yet</p>
                  <button className="empty-add-btn" onClick={handleAddContact}>
                    Add Your First Contact
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="contacts-list">
              {filteredContacts.map(contact => {
                const stage = LIFECYCLE_STAGES.find(s => s.id === contact.lifecycle_stage) || LIFECYCLE_STAGES[0]
                return (
                  <div
                    key={contact.id}
                    className="contact-item"
                    onClick={() => handleEditContact(contact)}
                  >
                    <div className="contact-avatar" style={{ backgroundColor: stage.color }}>
                      {contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="contact-info">
                      <span className="contact-name">{contact.name}</span>
                      <span className="contact-email">{contact.email || 'No email'}</span>
                      {contact.company && (
                        <span className="contact-company">{contact.company}</span>
                      )}
                    </div>
                    <div className="contact-meta">
                      <span className="contact-stage" style={{ backgroundColor: stage.color }}>
                        {stage.icon} {stage.label}
                      </span>
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
function ContactModal({ contact, userId, onClose, onSave, onDelete }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    lifecycle_stage: contact?.lifecycle_stage || 'lead',
    source: contact?.source || 'Other',
    tags: contact?.tags || [],
    notes: contact?.notes || '',
  })
  const [tagInput, setTagInput] = useState('')

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
            lifecycle_stage: form.lifecycle_stage,
            source: form.source,
            tags: form.tags,
            notes: form.notes.trim() || null,
          })
          .select()
          .single()

        if (error) throw error
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

          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              placeholder="Acme Inc."
            />
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
                  <option key={source} value={source}>{source}</option>
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
