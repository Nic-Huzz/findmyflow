/**
 * Unified Approval Queue
 * Combined queue for batch + autopilot content with quick actions
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { gatherContentContext } from '../../lib/contentContext'
import { fetchVoiceProfile, buildEnhancedVoiceInstructions, getVoiceFeedbackInsights, saveVoiceFeedback } from '../../lib/voiceProfile'
import { selectStoriesForContent, buildStoryMemoryContext } from '../../lib/storyBank'
import './ApprovalQueue.css'

// Platform icons
const PLATFORM_ICONS = {
  instagram: '📸',
  linkedin: '💼',
  twitter: '🐦',
  facebook: '👥',
  email: '📧'
}

// Content type labels
const CONTENT_TYPE_LABELS = {
  transformation_story: 'Transformation',
  educational: 'Educational',
  pain_agitation: 'Pain Point',
  social_proof: 'Social Proof',
  offer_teaser: 'Offer Teaser'
}

export default function ApprovalQueue({ onApprove, onClose }) {
  const { user } = useAuth()

  // State
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'batch', 'autopilot'
  const [sortBy, setSortBy] = useState('scheduled') // 'scheduled', 'platform', 'type'
  const [expandedId, setExpandedId] = useState(null)
  const [regenerating, setRegenerating] = useState(null)
  const [toast, setToast] = useState(null) // {message, type}
  const [rejectModal, setRejectModal] = useState(null) // item being rejected
  const [rejectReason, setRejectReason] = useState('')

  // Quick rejection reasons for feedback loop
  const REJECT_REASONS = [
    { value: 'too_formal', label: 'Too formal/stiff' },
    { value: 'too_casual', label: 'Too casual' },
    { value: 'off_brand', label: 'Off brand/voice' },
    { value: 'wrong_angle', label: 'Wrong angle/approach' },
    { value: 'too_long', label: 'Too long' },
    { value: 'too_short', label: 'Too short' },
    { value: 'not_relevant', label: 'Not relevant to audience' },
    { value: 'other', label: 'Other' }
  ]

  // Load pending content
  const loadPendingContent = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    // Query for content that is in draft status OR has review_status = 'pending'
    // This handles both legacy content and new unified queue content
    const { data, error } = await supabase
      .from('content_history')
      .select('*')
      .eq('user_id', user.id)
      .or('status.eq.draft,review_status.eq.pending,review_status.eq.needs_edit')
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Error loading queue:', error)
      showToast('Failed to load content queue', 'error')
    } else if (data) {
      setItems(data)
    }

    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadPendingContent()
  }, [loadPendingContent])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items]

    // Filter by source
    if (filter === 'batch') {
      result = result.filter(i => i.source === 'batch')
    } else if (filter === 'autopilot') {
      result = result.filter(i => i.source === 'autopilot')
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'scheduled') {
        const dateA = a.scheduled_date || '9999-12-31'
        const dateB = b.scheduled_date || '9999-12-31'
        return dateA.localeCompare(dateB)
      } else if (sortBy === 'platform') {
        return (a.platform || '').localeCompare(b.platform || '')
      } else if (sortBy === 'type') {
        return (a.content_type || '').localeCompare(b.content_type || '')
      }
      return 0
    })

    return result
  }, [items, filter, sortBy])

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    batch: items.filter(i => i.source === 'batch').length,
    autopilot: items.filter(i => i.source === 'autopilot').length,
    selected: selectedIds.length
  }), [items, selectedIds])

  // Handlers
  function toggleSelect(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredItems.map(i => i.id))
    }
  }

  async function handleApprove(id) {
    const { error } = await supabase
      .from('content_history')
      .update({ status: 'scheduled', review_status: 'approved' })
      .eq('id', id)

    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('Content approved!')
      if (onApprove) onApprove(id)
    } else {
      showToast('Failed to approve', 'error')
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) return

    const { error } = await supabase
      .from('content_history')
      .update({ status: 'scheduled', review_status: 'approved' })
      .in('id', selectedIds)

    if (!error) {
      const count = selectedIds.length
      setItems(prev => prev.filter(i => !selectedIds.includes(i.id)))
      setSelectedIds([])
      showToast(`${count} items approved!`)
      if (onApprove) onApprove(selectedIds)
    } else {
      showToast('Failed to approve', 'error')
    }
  }

  function handleReject(item) {
    // Open rejection modal to capture feedback
    setRejectModal(item)
    setRejectReason('')
  }

  async function confirmReject() {
    if (!rejectModal) return

    const item = rejectModal
    const reason = rejectReason

    // Save voice feedback if reason provided
    if (reason && user?.id) {
      await saveVoiceFeedback(user.id, item.id, reason, {
        contentType: item.content_type,
        platform: item.platform,
        contentSnippet: item.content?.slice(0, 200)
      })
    }

    // Update content status
    const { error } = await supabase
      .from('content_history')
      .update({
        status: 'archived',
        review_status: 'rejected',
        rejection_reason: reason || null
      })
      .eq('id', item.id)

    if (!error) {
      setItems(prev => prev.filter(i => i.id !== item.id))
      showToast(reason ? 'Feedback recorded & content archived' : 'Content archived')
    }

    setRejectModal(null)
    setRejectReason('')
  }

  function quickReject(item) {
    // Quick reject without feedback modal
    handleRejectDirect(item.id)
  }

  async function handleRejectDirect(id) {
    const { error } = await supabase
      .from('content_history')
      .update({ status: 'archived', review_status: 'rejected' })
      .eq('id', id)

    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('Content archived')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this content permanently?')) return

    const { error } = await supabase
      .from('content_history')
      .delete()
      .eq('id', id)

    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditText(item.content)
  }

  async function saveEdit() {
    if (!editingId) return

    const { error } = await supabase
      .from('content_history')
      .update({ content: editText })
      .eq('id', editingId)

    if (!error) {
      setItems(prev =>
        prev.map(i => i.id === editingId ? { ...i, content: editText } : i)
      )
      setEditingId(null)
      setEditText('')
    }
  }

  async function handleRegenerate(item) {
    setRegenerating(item.id)

    try {
      // Gather full context for better regeneration
      const [contentContext, voiceProfile, feedbackInsights, relevantStories] = await Promise.all([
        gatherContentContext(user.id),
        fetchVoiceProfile(user.id),
        getVoiceFeedbackInsights(user.id),
        selectStoriesForContent(user.id, item.content_type)
      ])

      // Build enhanced voice instructions with feedback
      const voiceInstructions = voiceProfile?.data
        ? buildEnhancedVoiceInstructions(voiceProfile.data, feedbackInsights)
        : ''

      // Build story context
      const storyContext = relevantStories?.length > 0
        ? buildStoryMemoryContext(relevantStories, item.content_type)
        : ''

      // Call the content generator with full context
      const { data, error } = await supabase.functions.invoke('content-generator', {
        body: {
          action: 'generate',
          contentType: item.content_type,
          platform: item.platform,
          context: {
            ...contentContext,
            voiceInstructions,
            storyContext,
            feedbackInsights: feedbackInsights?.topIssues || []
          },
          additionalInstructions: `Create a fresh variation. Previous content to avoid repeating: "${item.content?.slice(0, 100)}..."`
        }
      })

      if (!error && data?.content) {
        // Update the content
        await supabase
          .from('content_history')
          .update({ content: data.content, regenerated_at: new Date().toISOString() })
          .eq('id', item.id)

        setItems(prev =>
          prev.map(i => i.id === item.id ? { ...i, content: data.content } : i)
        )
        showToast('Content regenerated!')
      } else if (error) {
        console.error('Regenerate error:', error)
        showToast('Failed to regenerate', 'error')
      }
    } catch (err) {
      console.error('Regenerate error:', err)
      showToast('Failed to regenerate content', 'error')
    } finally {
      setRegenerating(null)
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!')
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Not scheduled'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  function truncate(text, max = 200) {
    if (!text || text.length <= max) return text
    return text.substring(0, max) + '...'
  }

  if (loading) {
    return (
      <div className="aq-container">
        <div className="aq-loading">
          <div className="aq-loading-spinner" />
          <p>Loading pending content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="aq-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`aq-toast aq-toast-${toast.type || 'success'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="aq-header">
        <div className="aq-header-left">
          <h2 className="aq-title">Approval Queue</h2>
          <p className="aq-subtitle">{stats.total} items pending review</p>
        </div>
        {onClose && (
          <button className="aq-close-btn" onClick={onClose}>×</button>
        )}
      </div>

      {/* Stats */}
      <div className="aq-stats">
        <button
          className={`aq-stat-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span className="aq-stat-count">{stats.total}</span>
          <span className="aq-stat-label">All</span>
        </button>
        <button
          className={`aq-stat-btn ${filter === 'batch' ? 'active' : ''}`}
          onClick={() => setFilter('batch')}
        >
          <span className="aq-stat-count">{stats.batch}</span>
          <span className="aq-stat-label">Batch</span>
        </button>
        <button
          className={`aq-stat-btn ${filter === 'autopilot' ? 'active' : ''}`}
          onClick={() => setFilter('autopilot')}
        >
          <span className="aq-stat-count">{stats.autopilot}</span>
          <span className="aq-stat-label">Autopilot</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="aq-toolbar">
        <div className="aq-toolbar-left">
          <label className="aq-checkbox-wrapper">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
              onChange={toggleSelectAll}
            />
            <span>Select All</span>
          </label>

          {stats.selected > 0 && (
            <button className="aq-btn aq-btn-success" onClick={handleBulkApprove}>
              ✓ Approve {stats.selected} Selected
            </button>
          )}
        </div>

        <div className="aq-toolbar-right">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="aq-sort-select"
          >
            <option value="scheduled">Sort by Date</option>
            <option value="platform">Sort by Platform</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="aq-empty">
          <div className="aq-empty-icon">✅</div>
          <h3>All caught up!</h3>
          <p>No content waiting for approval.</p>
        </div>
      ) : (
        /* Content List */
        <div className="aq-list">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`aq-item ${selectedIds.includes(item.id) ? 'selected' : ''}`}
            >
              {/* Selection */}
              <div className="aq-item-select">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </div>

              {/* Main Content */}
              <div className="aq-item-main">
                {/* Header */}
                <div className="aq-item-header">
                  <div className="aq-item-meta">
                    <span className="aq-platform">
                      {PLATFORM_ICONS[item.platform]} {item.platform}
                    </span>
                    <span className="aq-type">
                      {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                    </span>
                    <span className="aq-date">{formatDate(item.scheduled_date)}</span>
                  </div>
                  <span className={`aq-source-badge aq-source-${item.source || 'batch'}`}>
                    {item.source || 'batch'}
                  </span>
                </div>

                {/* Content Body */}
                <div className="aq-item-body">
                  {editingId === item.id ? (
                    <div className="aq-edit-mode">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="aq-edit-textarea"
                        rows={6}
                      />
                      <div className="aq-edit-actions">
                        <button className="aq-btn aq-btn-small" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                        <button className="aq-btn aq-btn-primary aq-btn-small" onClick={saveEdit}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="aq-content-text"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      {expandedId === item.id ? item.content : truncate(item.content)}
                      {item.content?.length > 200 && (
                        <span className="aq-expand-hint">
                          {expandedId === item.id ? ' (click to collapse)' : ' (click to expand)'}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="aq-item-actions">
                  <button
                    className="aq-action-btn aq-action-approve"
                    onClick={() => handleApprove(item.id)}
                    title="Approve"
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="aq-action-btn"
                    onClick={() => startEdit(item)}
                    title="Edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="aq-action-btn"
                    onClick={() => handleRegenerate(item)}
                    disabled={regenerating === item.id}
                    title="Regenerate"
                  >
                    {regenerating === item.id ? '⏳' : '🔄'} Regen
                  </button>
                  <button
                    className="aq-action-btn"
                    onClick={() => copyToClipboard(item.content)}
                    title="Copy"
                  >
                    📋 Copy
                  </button>
                  <button
                    className="aq-action-btn aq-action-reject"
                    onClick={() => handleReject(item)}
                    title="Reject with feedback"
                  >
                    ✗ Reject
                  </button>
                  <button
                    className="aq-action-btn aq-action-delete"
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Feedback Modal */}
      {rejectModal && (
        <div className="aq-modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="aq-modal" onClick={e => e.stopPropagation()}>
            <div className="aq-modal-header">
              <h3>Why are you rejecting this?</h3>
              <button className="aq-modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>

            <div className="aq-modal-body">
              <p className="aq-modal-hint">
                Help the AI learn your preferences (optional but recommended)
              </p>

              <div className="aq-reject-reasons">
                {REJECT_REASONS.map(reason => (
                  <button
                    key={reason.value}
                    className={`aq-reason-btn ${rejectReason === reason.value ? 'selected' : ''}`}
                    onClick={() => setRejectReason(reason.value)}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              <div className="aq-modal-preview">
                <span className="aq-preview-label">Content:</span>
                <p className="aq-preview-text">{truncate(rejectModal.content, 150)}</p>
              </div>
            </div>

            <div className="aq-modal-actions">
              <button
                className="aq-btn"
                onClick={() => setRejectModal(null)}
              >
                Cancel
              </button>
              <button
                className="aq-btn aq-btn-secondary"
                onClick={() => {
                  setRejectReason('')
                  confirmReject()
                }}
              >
                Skip Feedback
              </button>
              <button
                className="aq-btn aq-btn-primary"
                onClick={confirmReject}
                disabled={!rejectReason}
              >
                Submit & Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
