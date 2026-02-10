/**
 * Contacts - CRM Contact Management
 * Manage leads and customers with tagging, notes, and lifecycle stages
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { createDeal, scheduleFollowUp, ACTIVE_STAGES, STAGE_INFO } from '../../lib/crm/dealService'
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
  const [deals, setDeals] = useState([])
  const [projects, setProjects] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [prefillData, setPrefillData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
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

  // Load contacts, deals, and projects
  const loadContacts = useCallback(async () => {
    if (!user?.id) return

    try {
      const [contactsRes, dealsRes, projectsRes] = await Promise.all([
        supabase
          .from('crm_contacts')
          .select('*')
          .eq('user_id', user.id)
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

      if (contactsRes.error) throw contactsRes.error
      setContacts(contactsRes.data || [])
      setDeals(dealsRes.data || [])
      setProjects(projectsRes.data || [])
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

  // Map contact ID → project IDs via deals (with email fallback for legacy deals)
  const contactProjectMap = useMemo(() => {
    const byId = {}    // contact UUID → Set of project_ids
    const byEmail = {} // email (lowercase) → Set of project_ids (fallback)
    deals.forEach(deal => {
      if (!deal.project_id) return
      if (deal.contact_id) {
        if (!byId[deal.contact_id]) byId[deal.contact_id] = new Set()
        byId[deal.contact_id].add(deal.project_id)
      }
      if (deal.contact_email) {
        const key = deal.contact_email.toLowerCase()
        if (!byEmail[key]) byEmail[key] = new Set()
        byEmail[key].add(deal.project_id)
      }
    })
    return { byId, byEmail }
  }, [deals])

  // Helper: get project IDs for a contact
  const getProjectsForContact = useCallback((contact) => {
    const fromId = contactProjectMap.byId[contact.id]
    if (fromId?.size) return fromId
    const emailKey = contact.email?.toLowerCase()
    if (emailKey) return contactProjectMap.byEmail[emailKey] || null
    return null
  }, [contactProjectMap])

  // Projects that have at least one linked contact
  const projectsWithContacts = useMemo(() => {
    const projectIds = new Set()
    contacts.forEach(c => {
      const pids = getProjectsForContact(c)
      if (pids) pids.forEach(pid => projectIds.add(pid))
    })
    return projects.filter(p => projectIds.has(p.id))
  }, [contacts, projects, getProjectsForContact])

  // Reset project filter if selected project no longer has contacts
  useEffect(() => {
    if (filterProject !== 'all' && filterProject !== 'no-project') {
      const stillExists = projectsWithContacts.some(p => p.id === filterProject)
      if (!stillExists) setFilterProject('all')
    }
  }, [projectsWithContacts, filterProject])

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !searchQuery ||
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.social_handle?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStage = filterStage === 'all' || contact.lifecycle_stage === filterStage

      let matchesProject = true
      if (filterProject === 'no-project') {
        matchesProject = !getProjectsForContact(contact)
      } else if (filterProject !== 'all') {
        const pids = getProjectsForContact(contact)
        matchesProject = pids?.has(filterProject) || false
      }

      return matchesSearch && matchesStage && matchesProject
    })
  }, [contacts, searchQuery, filterStage, filterProject, getProjectsForContact])

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

        {/* Hero Stats Card */}
        <div className="contacts-hero">
          <div className="contacts-stats-row">
            <div className="contacts-stat">
              <span className="contacts-stat-label">Total</span>
              <span className="contacts-stat-value contacts-stat-white">{stats.total}</span>
            </div>
            <div className="contacts-stat-divider"></div>
            <div className="contacts-stat">
              <span className="contacts-stat-label">This Week</span>
              <span className="contacts-stat-value contacts-stat-gold">+{stats.thisWeek}</span>
            </div>
          </div>
          <div className="contacts-hero-actions">
            <div className="add-btn-wrapper">
              <button
                className="contacts-add-btn"
                onClick={() => { setShowAddMenu(!showAddMenu); hapticLight() }}
              >
                + Add Contact
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
          <div className="contacts-analyzing">
            <div className="contacts-spinner" />
            <p>Analyzing screenshot...</p>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          className="contacts-search"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

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

        {/* Project Filters */}
        {projectsWithContacts.length > 0 && (
          <div className="contacts-filters project-filters">
            <button
              className={`filter-chip ${filterProject === 'all' ? 'active' : ''}`}
              onClick={() => setFilterProject('all')}
              style={{ '--chip-color': '#5e17eb' }}
            >
              All Projects
            </button>
            {projectsWithContacts.map(project => (
              <button
                key={project.id}
                className={`filter-chip ${filterProject === project.id ? 'active' : ''}`}
                onClick={() => setFilterProject(project.id)}
                style={{ '--chip-color': '#E9A23B' }}
              >
                {project.name}
              </button>
            ))}
            <button
              className={`filter-chip ${filterProject === 'no-project' ? 'active' : ''}`}
              onClick={() => setFilterProject('no-project')}
              style={{ '--chip-color': '#6b7280' }}
            >
              No Project
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="contacts-section-header">
          <div className="contacts-section-icon">👥</div>
          <span className="contacts-section-title">
            {filteredContacts.length} Contact{filteredContacts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Contacts List */}
        <div className="contacts-list-card">
          {filteredContacts.length === 0 ? (
            <div className="contacts-empty">
              {searchQuery || filterStage !== 'all' || filterProject !== 'all' ? (
                <p>No contacts match your filters</p>
              ) : (
                <div className="contacts-empty-rich">
                  <div className="empty-icon">👥</div>
                  <h3>Let's build your network</h3>
                  <p>Track the people in your world — from first touch to loyal customer</p>
                  <button className="contacts-gold-cta" onClick={handleAddContact}>
                    Add Your First Contact <span>→</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="contacts-list">
              {filteredContacts.map((contact, idx) => {
                const stage = LIFECYCLE_STAGES.find(s => s.id === contact.lifecycle_stage) || LIFECYCLE_STAGES[0]
                const recency = timeAgo(contact.updated_at)
                const pids = getProjectsForContact(contact)
                const contactProjects = pids
                  ? projects.filter(p => pids.has(p.id))
                  : []
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
                      {contactProjects.length > 0 && (
                        <span className="contact-project-tag">
                          {contactProjects.map(p => p.name).join(', ')}
                        </span>
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
            userProjects={projects}
            existingDeals={editingContact
              ? deals.filter(d =>
                  d.contact_id === editingContact.id ||
                  (d.contact_email && editingContact.email &&
                   d.contact_email.toLowerCase() === editingContact.email.toLowerCase())
                )
              : []
            }
            onClose={() => {
              setShowAddModal(false)
              setEditingContact(null)
            }}
            onSave={(savedContact) => {
              // Always re-fetch to pick up any new deals/project links
              loadContacts()
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
function ContactModal({ contact, prefill, userId, userProjects = [], existingDeals = [], onClose, onSave, onDelete }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: contact?.name || prefill?.name || '',
    email: contact?.email || prefill?.email || '',
    phone: contact?.phone || prefill?.phone || '',
    company: contact?.company || '',
    social_handle: contact?.social_handle || prefill?.social_handle || '',
    lifecycle_stage: contact?.lifecycle_stage || 'lead',
    source: contact?.source || prefill?.source || 'Content',
    engagement_type: contact?.engagement_type || '',
    outreach_status: contact?.outreach_status || '',
    tags: contact?.tags || [],
    notes: contact?.notes || prefill?.notes || '',
  })
  const [tagInput, setTagInput] = useState('')

  // Reset engagement_type when source changes if current selection isn't in new source
  const sourceEngagements = ENGAGEMENT_BY_SOURCE[form.source] || []
  useEffect(() => {
    const options = ENGAGEMENT_BY_SOURCE[form.source] || []
    if (form.engagement_type && options.length && !options.find(e => e.id === form.engagement_type)) {
      setForm(prev => ({ ...prev, engagement_type: '' }))
    }
  }, [form.source, form.engagement_type])

  // Project + deal creation
  const [dealProject, setDealProject] = useState('')
  const [dealStage, setDealStage] = useState('lead')
  const [dealFollowUp, setDealFollowUp] = useState('')

  // Projects already linked via existing deals
  const linkedProjectIds = useMemo(() =>
    new Set(existingDeals.map(d => d.project_id).filter(Boolean)),
    [existingDeals]
  )
  const availableProjects = useMemo(() =>
    userProjects.filter(p => !linkedProjectIds.has(p.id)),
    [userProjects, linkedProjectIds]
  )

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
      let savedData
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
            engagement_type: form.engagement_type || null,
            outreach_status: form.outreach_status || null,
            tags: form.tags,
            notes: form.notes.trim() || null,
          })
          .eq('id', contact.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        savedData = data
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
            engagement_type: form.engagement_type || null,
            outreach_status: form.outreach_status || null,
            outreach_status_entered_at: form.outreach_status ? new Date().toISOString() : null,
            tags: form.tags,
            notes: form.notes.trim() || null,
          })
          .select()
          .single()

        if (error) throw error
        savedData = data
      }

      // Create a deal if a project was selected (works for both add and edit)
      if (dealProject) {
        const project = availableProjects.find(p => p.id === dealProject)
        const dealName = `${form.name.trim()} - ${project?.name || 'Project'}`
        const stageInfo = STAGE_INFO[dealStage]
        const { data: newDeal } = await createDeal(userId, {
          project_id: dealProject,
          contact_id: savedData.id,
          contact_name: dealName,
          contact_email: form.email.trim() || null,
          source: form.source,
          product_type: project?.name || 'Project',
          value: 0,
          status: dealStage,
          probability: stageInfo?.probability || 10,
        })

        // Schedule follow-up if date set
        if (newDeal?.id && dealFollowUp) {
          await scheduleFollowUp(newDeal.id, userId, dealFollowUp)
        }
      }

      onSave(savedData)
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

          {/* Engagement Type (filtered by source) */}
          {sourceEngagements.length > 0 && (
            <div className="form-group">
              <label>How did they engage?</label>
              <div className="contacts-engagement-grid">
                {sourceEngagements.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    className={`contacts-engagement-option ${form.engagement_type === type.id ? 'selected' : ''}`}
                    onClick={() => setForm({ ...form, engagement_type: type.id })}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Outreach Status */}
          <div className="form-group">
            <label>Status</label>
            <select
              value={form.outreach_status}
              onChange={e => setForm({ ...form, outreach_status: e.target.value })}
            >
              <option value="">No outreach status</option>
              {OUTREACH_STATUS.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
              ))}
            </select>
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

          {/* Project + Deal section */}
          {userProjects.length > 0 && (
            <div className="deal-toggle-section">
              {/* Show existing project links when editing */}
              {contact && existingDeals.length > 0 && (
                <div className="existing-projects">
                  <label>Linked Projects</label>
                  <div className="existing-project-list">
                    {existingDeals.map(deal => {
                      const proj = userProjects.find(p => p.id === deal.project_id)
                      const stageInfo = STAGE_INFO[deal.status]
                      return proj ? (
                        <div key={deal.id} className="existing-project-pill">
                          <span className="project-pill-name">{proj.name}</span>
                          <span className="project-pill-stage">{stageInfo?.label || deal.status}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Add new project - show available (unlinked) projects */}
              {availableProjects.length > 0 && (
                <>
                  <div className="form-group">
                    <label>{contact && existingDeals.length > 0 ? 'Add Another Project' : 'Project'}</label>
                    <select
                      value={dealProject}
                      onChange={e => setDealProject(e.target.value)}
                    >
                      <option value="">No project (contact only)</option>
                      {availableProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {dealProject && (
                    <div className="deal-fields">
                      <p className="deal-fields-hint">A deal will be created for this project</p>
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
