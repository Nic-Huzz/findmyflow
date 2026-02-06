/**
 * Pages - Landing & Sales Page Manager
 *
 * Features:
 * - Track landing pages and sales pages
 * - Generate copy via PromptGenerator inline
 * - Monitor conversion metrics
 * - Compact list view design
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { getContentContext } from '../../lib/crm/contentContext'
import { PROMPT_TEMPLATES, checkTemplateReadiness } from '../../lib/crm/promptTemplates'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import '../../components/crm/PageTransition.css'
import './Pages.css'

const PAGE_TYPES = [
  { id: 'landing', label: 'Landing Page', icon: '🎯', promptType: 'landingPage' },
  { id: 'sales', label: 'Sales Page', icon: '💰', promptType: 'salesPage' },
  { id: 'thank_you', label: 'Thank You Page', icon: '🙏', promptType: null },
  { id: 'checkout', label: 'Checkout Page', icon: '🛒', promptType: null },
  { id: 'other', label: 'Other', icon: '📄', promptType: null }
]

const STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft', color: '#6b7280' },
  { id: 'live', label: 'Live', color: '#10b981' },
  { id: 'paused', label: 'Paused', color: '#f59e0b' },
  { id: 'archived', label: 'Archived', color: '#9ca3af' }
]

// Data requirement labels for prompt generation
const DATA_REQUIREMENTS = [
  { key: 'persona', label: 'Persona', path: '/nikigai/persona' },
  { key: 'offer', label: 'Offer', path: '/offer-builder' },
  { key: 'price', label: 'Price', path: '/offer-builder' },
  { key: 'proof', label: 'Proof', path: '/validation-flows' },
  { key: 'guarantee', label: 'Guarantee', path: '/offer-builder' }
]

export default function Pages() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPage, setEditingPage] = useState(null)

  // Prompt generator state
  const [contentContext, setContentContext] = useState(null)
  const [selectedPromptType, setSelectedPromptType] = useState('landingPage')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copied, setCopied] = useState(false)

  // Load pages
  const loadPages = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('crm_pages')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setPages(data || [])
    } catch (err) {
      console.error('Error loading pages:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Load content context for prompt generation
  const loadContentContext = useCallback(async () => {
    if (!user?.id) return
    const context = await getContentContext(user.id)
    setContentContext(context)
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadPages()
      loadContentContext()
    }
  }, [user?.id, loadPages, loadContentContext])

  // Auto-generate prompt when content context is loaded
  useEffect(() => {
    if (contentContext) {
      const template = PROMPT_TEMPLATES[selectedPromptType]
      if (template) {
        const readiness = checkTemplateReadiness(selectedPromptType, contentContext)
        if (readiness.ready) {
          const prompt = template.generator(contentContext)
          setGeneratedPrompt(prompt)
        }
      }
    }
  }, [contentContext, selectedPromptType])

  // Check data availability for prompt
  const getDataAvailability = () => {
    if (!contentContext) return {}

    return {
      persona: !!contentContext.persona?.personaName,
      offer: !!contentContext.offer?.coreProblem,
      price: !!contentContext.offer?.pricing,
      proof: !!contentContext.validation?.totalResponses,
      guarantee: !!contentContext.offer?.guarantee
    }
  }

  // Generate prompt
  const handleGeneratePrompt = () => {
    if (!contentContext) return

    const template = PROMPT_TEMPLATES[selectedPromptType]
    if (!template) return

    const readiness = checkTemplateReadiness(selectedPromptType, contentContext)
    if (readiness.ready) {
      const prompt = template.generator(contentContext)
      setGeneratedPrompt(prompt)
    }
    hapticMedium()
  }

  // Copy prompt to clipboard
  const handleCopyPrompt = async () => {
    if (!generatedPrompt) return

    try {
      await navigator.clipboard.writeText(generatedPrompt)
      setCopied(true)
      hapticMedium()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Handle page actions
  // Toggle body class for bottom toolbar hiding when modal is open
  useEffect(() => {
    if (showAddModal) {
      document.body.classList.add('modal-active')
    } else {
      document.body.classList.remove('modal-active')
    }
    return () => document.body.classList.remove('modal-active')
  }, [showAddModal])

  const handleAddPage = () => {
    setEditingPage(null)
    setShowAddModal(true)
    hapticLight()
  }

  const handleEditPage = (page) => {
    setEditingPage(page)
    setShowAddModal(true)
    hapticLight()
  }

  const handleDeletePage = async (pageId) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    try {
      const { error } = await supabase
        .from('crm_pages')
        .delete()
        .eq('id', pageId)
        .eq('user_id', user.id)

      if (error) throw error
      setPages(pages.filter(p => p.id !== pageId))
      hapticMedium()
    } catch (err) {
      console.error('Error deleting page:', err)
    }
  }

  const dataAvailability = getDataAvailability()
  const readyCount = Object.values(dataAvailability).filter(Boolean).length

  if (loading) {
    return (
      <div className="pages-loading">
        <div className="pages-spinner" />
        <p>Loading pages...</p>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadPages}>
      <div className="pages-container">
        {/* Top Toolbar */}
        <div className="pages-toolbar">
          <button className="pages-back-btn" onClick={() => navigate('/crm/attract')}>
            ←
          </button>
          <h2 className="pages-toolbar-title">Pages</h2>
        </div>

        {/* Header */}
        <header className="pages-header">
          <div className="pages-breadcrumb">
            <button onClick={() => navigate('/crm')}>Home</button>
            <span>→</span>
            <button onClick={() => navigate('/crm/attract')}>Attract</button>
            <span>→</span>
            <span>Pages</span>
          </div>
          <h1 className="pages-title">🌐 Pages</h1>
          <p className="pages-subtitle">Landing pages and sales pages</p>
        </header>

        {/* Your Pages Card */}
        <div className="pages-card-container">
          <div className="pages-card-header">
            <h2>Your Pages</h2>
            <button className="pages-add-btn" onClick={handleAddPage}>
              + Add Page
            </button>
          </div>

          {pages.length === 0 ? (
            <div className="pages-empty-inline">
              <p>No pages yet. Track your landing and sales pages here.</p>
            </div>
          ) : (
            <div className="pages-list">
              {pages.map(page => {
                const status = STATUS_OPTIONS.find(s => s.id === page.status)
                const convRate = page.visitors > 0
                  ? ((page.conversions / page.visitors) * 100).toFixed(1)
                  : '0.0'

                return (
                  <div
                    key={page.id}
                    className="pages-list-item"
                    onClick={() => handleEditPage(page)}
                  >
                    <div className="pages-item-info">
                      <span className="pages-item-name">{page.name}</span>
                      {page.url && (
                        <span className="pages-item-url">
                          {page.url.replace(/^https?:\/\//, '')}
                        </span>
                      )}
                    </div>
                    <div className="pages-item-stats">
                      <div className="pages-item-conversion">
                        <span className="pages-item-conversion-value">{convRate}%</span>
                        <span className="pages-item-conversion-label">Conversion</span>
                      </div>
                      <span
                        className="pages-item-status"
                        style={{ backgroundColor: status?.color }}
                      >
                        {status?.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Generate Page Copy Card */}
        <div className="pages-generate-card">
          <div className="pages-generate-header">
            <h2>🪄 Generate Page Copy</h2>
            <p>We'll use your data to create a personalized prompt:</p>
          </div>

          {/* Data Availability Chips */}
          <div className="pages-data-chips">
            {DATA_REQUIREMENTS.map(req => {
              const available = dataAvailability[req.key]
              return (
                <button
                  key={req.key}
                  className={`pages-data-chip ${available ? 'available' : 'missing'}`}
                  onClick={() => !available && navigate(req.path)}
                >
                  <span className={`chip-icon ${available ? 'check' : ''}`}>
                    {available ? '✓' : '⚠'}
                  </span>
                  {req.label}
                </button>
              )
            })}
          </div>

          {/* AI Ready Indicator */}
          <div className="pages-ai-ready">
            <div className="pages-ai-ready-bar">
              <div
                className="pages-ai-ready-fill"
                style={{ width: `${(readyCount / 5) * 100}%` }}
              />
            </div>
            <span className="pages-ai-ready-text">
              {readyCount >= 3
                ? '✨ Ready to generate'
                : `${readyCount}/3 data points needed`
              }
            </span>
          </div>

          {/* Prompt Preview */}
          <div className="pages-prompt-preview">
            <div className="pages-prompt-content">
              <pre>{generatedPrompt || `Create a high-converting landing page for my offer... TARGET AUDIENCE: ${contentContext?.persona?.ideal_customer || '[Complete Persona flow]'}... OFFER: ${contentContext?.offer?.name || '[Complete Offer Builder]'}...`}</pre>
            </div>
          </div>

          {/* Copy Button */}
          <button
            className="pages-prompt-copy"
            onClick={handleCopyPrompt}
          >
            {copied ? '✓ Copied!' : '📋 Copy Prompt'}
          </button>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <PageModal
            page={editingPage}
            userId={user.id}
            onClose={() => {
              setShowAddModal(false)
              setEditingPage(null)
            }}
            onSave={(savedPage) => {
              if (editingPage) {
                setPages(pages.map(p => p.id === savedPage.id ? savedPage : p))
              } else {
                setPages([savedPage, ...pages])
              }
              setShowAddModal(false)
              setEditingPage(null)
            }}
            onDelete={handleDeletePage}
          />
        )}
      </div>
    </PullToRefresh>
  )
}

/**
 * Page Add/Edit Modal
 */
function PageModal({ page, userId, onClose, onSave, onDelete }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: page?.name || '',
    page_type: page?.page_type || 'landing',
    url: page?.url || '',
    status: page?.status || 'draft',
    visitors: page?.visitors || 0,
    conversions: page?.conversions || 0
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      if (page?.id) {
        // Update
        const { data, error } = await supabase
          .from('crm_pages')
          .update({
            name: form.name.trim(),
            page_type: form.page_type,
            url: form.url.trim() || null,
            status: form.status,
            visitors: parseInt(form.visitors) || 0,
            conversions: parseInt(form.conversions) || 0
          })
          .eq('id', page.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        onSave(data)
      } else {
        // Create
        const { data, error } = await supabase
          .from('crm_pages')
          .insert({
            user_id: userId,
            name: form.name.trim(),
            page_type: form.page_type,
            url: form.url.trim() || null,
            status: form.status,
            visitors: parseInt(form.visitors) || 0,
            conversions: parseInt(form.conversions) || 0
          })
          .select()
          .single()

        if (error) throw error
        onSave(data)
      }
      hapticMedium()
    } catch (err) {
      console.error('Error saving page:', err)
      alert('Failed to save page. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-modal-overlay" onClick={onClose}>
      <div className="page-modal" onClick={e => e.stopPropagation()}>
        <header className="page-modal-header">
          <h2>{page ? 'Edit Page' : 'Add New Page'}</h2>
          <button className="page-modal-close" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="page-modal-form">
          <div className="page-form-group">
            <label>Page Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Lead Magnet Landing Page"
              required
            />
          </div>

          <div className="page-form-group">
            <label>Page Type</label>
            <div className="page-type-grid">
              {PAGE_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`page-type-option ${form.page_type === type.id ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, page_type: type.id })}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="page-form-group">
            <label>URL (optional)</label>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="page-form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="page-form-row">
            <div className="page-form-group">
              <label>Visitors</label>
              <input
                type="number"
                min="0"
                value={form.visitors}
                onChange={e => setForm({ ...form, visitors: e.target.value })}
              />
            </div>
            <div className="page-form-group">
              <label>Conversions</label>
              <input
                type="number"
                min="0"
                value={form.conversions}
                onChange={e => setForm({ ...form, conversions: e.target.value })}
              />
            </div>
          </div>

          <div className="page-modal-actions">
            {page && (
              <button
                type="button"
                className="page-btn-delete"
                onClick={() => {
                  onDelete(page.id)
                  onClose()
                }}
              >
                Delete
              </button>
            )}
            <div className="page-modal-actions-right">
              <button type="button" className="page-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="page-btn-save" disabled={saving}>
                {saving ? 'Saving...' : (page ? 'Save' : 'Add Page')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
