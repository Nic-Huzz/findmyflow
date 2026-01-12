/**
 * Content History Page
 * View, filter, and manage all generated content
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchContentHistory,
  updateContentStatus,
  updateContentText,
  deleteContent,
  bulkDeleteContent,
  getContentStats,
  exportToCSV,
  downloadCSV
} from '../../lib/contentHistory'
import { MetricsScreenshotUpload } from '../../components/crm'
import './ContentHistory.css'

// Platform icons
const PLATFORM_ICONS = {
  instagram: '📸',
  linkedin: '💼',
  twitter: '🐦',
  facebook: '👥',
  email: '📧',
  tiktok: '🎵',
  threads: '🧵'
}

// Content type labels
const CONTENT_TYPE_LABELS = {
  transformation_story: 'Transformation Story',
  educational: 'Educational Post',
  pain_agitation: 'Pain Agitation',
  social_proof: 'Social Proof',
  offer_teaser: 'Offer Teaser'
}

// Status badges
const STATUS_BADGES = {
  draft: { label: 'Draft', class: 'ch-status-draft' },
  scheduled: { label: 'Scheduled', class: 'ch-status-scheduled' },
  posted: { label: 'Posted', class: 'ch-status-posted' },
  archived: { label: 'Archived', class: 'ch-status-archived' }
}

export default function ContentHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // State
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState([])
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    contentType: '',
    search: ''
  })
  const [selectedItems, setSelectedItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [showMetricsUpload, setShowMetricsUpload] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [expandedId, setExpandedId] = useState(null)

  // Load data
  useEffect(() => {
    if (user?.id) {
      loadContent()
      loadStats()
    }
  }, [user?.id])

  async function loadContent() {
    setLoading(true)
    const { data } = await fetchContentHistory(user.id, {
      status: filters.status || undefined,
      platform: filters.platform || undefined,
      contentType: filters.contentType || undefined,
      limit: 100
    })
    setContent(data || [])
    setLoading(false)
  }

  async function loadStats() {
    const statsData = await getContentStats(user.id)
    setStats(statsData)
  }

  // Re-fetch when filters change
  useEffect(() => {
    if (user?.id) {
      loadContent()
    }
  }, [filters.status, filters.platform, filters.contentType])

  // Filter content by search
  const filteredContent = useMemo(() => {
    if (!filters.search) return content

    const searchLower = filters.search.toLowerCase()
    return content.filter(item =>
      item.content?.toLowerCase().includes(searchLower) ||
      item.platform?.toLowerCase().includes(searchLower) ||
      item.content_type?.toLowerCase().includes(searchLower)
    )
  }, [content, filters.search])

  // Handlers
  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function toggleSelect(id) {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredContent.map(c => c.id))
    }
  }

  async function handleStatusChange(id, newStatus) {
    const { error } = await updateContentStatus(id, newStatus)
    if (!error) {
      setContent(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
      )
      loadStats()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this content?')) return

    const { error } = await deleteContent(id)
    if (!error) {
      setContent(prev => prev.filter(c => c.id !== id))
      loadStats()
    }
  }

  async function handleBulkDelete() {
    if (selectedItems.length === 0) return
    if (!confirm(`Delete ${selectedItems.length} items?`)) return

    const { error } = await bulkDeleteContent(selectedItems)
    if (!error) {
      setContent(prev => prev.filter(c => !selectedItems.includes(c.id)))
      setSelectedItems([])
      loadStats()
    }
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditText(item.content)
  }

  async function saveEdit() {
    if (!editingId) return

    const { error } = await updateContentText(editingId, editText)
    if (!error) {
      setContent(prev =>
        prev.map(c => c.id === editingId ? { ...c, content: editText } : c)
      )
      setEditingId(null)
      setEditText('')
    }
  }

  function handleExport() {
    const dataToExport = selectedItems.length > 0
      ? content.filter(c => selectedItems.includes(c.id))
      : filteredContent

    const csv = exportToCSV(dataToExport)
    const date = new Date().toISOString().split('T')[0]
    downloadCSV(csv, `content-history-${date}.csv`)
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function truncateText(text, maxLength = 150) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="ch-container">
        <div className="ch-loading">
          <div className="ch-loading-spinner" />
          <p>Loading content history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ch-container">
      {/* Header */}
      <div className="ch-header">
        <div className="ch-header-left">
          <button className="ch-back-btn" onClick={() => navigate('/crm/marketing')}>
            ← Back
          </button>
          <div>
            <h1 className="ch-title">Content History</h1>
            <p className="ch-subtitle">View and manage all your generated content</p>
          </div>
        </div>
        <div className="ch-header-actions">
          <button className="ch-btn ch-btn-secondary" onClick={handleExport}>
            📥 Export CSV
          </button>
          <button className="ch-btn ch-btn-primary" onClick={() => navigate('/crm/marketing')}>
            ✨ Create New
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="ch-stats">
          <div className="ch-stat-card">
            <span className="ch-stat-number">{stats.total}</span>
            <span className="ch-stat-label">Total Content</span>
          </div>
          <div className="ch-stat-card">
            <span className="ch-stat-number">{stats.byStatus.posted || 0}</span>
            <span className="ch-stat-label">Posted</span>
          </div>
          <div className="ch-stat-card">
            <span className="ch-stat-number">{stats.byStatus.scheduled || 0}</span>
            <span className="ch-stat-label">Scheduled</span>
          </div>
          <div className="ch-stat-card">
            <span className="ch-stat-number">{stats.byStatus.draft || 0}</span>
            <span className="ch-stat-label">Drafts</span>
          </div>
          <div className="ch-stat-card ch-stat-engagement">
            <span className="ch-stat-number">{stats.totalEngagement.likes}</span>
            <span className="ch-stat-label">Total Likes</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="ch-filters">
        <div className="ch-filter-row">
          <div className="ch-search-box">
            <span className="ch-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search content..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="ch-search-input"
            />
          </div>

          <select
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
            className="ch-filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="posted">Posted</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={filters.platform}
            onChange={e => handleFilterChange('platform', e.target.value)}
            className="ch-filter-select"
          >
            <option value="">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter/X</option>
            <option value="facebook">Facebook</option>
            <option value="email">Email</option>
          </select>

          <select
            value={filters.contentType}
            onChange={e => handleFilterChange('contentType', e.target.value)}
            className="ch-filter-select"
          >
            <option value="">All Types</option>
            <option value="transformation_story">Transformation Story</option>
            <option value="educational">Educational</option>
            <option value="pain_agitation">Pain Agitation</option>
            <option value="social_proof">Social Proof</option>
            <option value="offer_teaser">Offer Teaser</option>
          </select>
        </div>

        <div className="ch-filter-actions">
          <div className="ch-view-toggle">
            <button
              className={`ch-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ▦
            </button>
            <button
              className={`ch-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>

          {selectedItems.length > 0 && (
            <div className="ch-bulk-actions">
              <span className="ch-selected-count">{selectedItems.length} selected</span>
              <button className="ch-btn ch-btn-danger" onClick={handleBulkDelete}>
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid/List */}
      {filteredContent.length === 0 ? (
        <div className="ch-empty">
          <div className="ch-empty-icon">📝</div>
          <h3>No content found</h3>
          <p>Try adjusting your filters or create new content</p>
          <button className="ch-btn ch-btn-primary" onClick={() => navigate('/crm/marketing')}>
            Create Content
          </button>
        </div>
      ) : (
        <div className={`ch-content-${viewMode}`}>
          {/* Select All (for list view) */}
          {viewMode === 'list' && (
            <div className="ch-list-header">
              <label className="ch-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredContent.length}
                  onChange={toggleSelectAll}
                />
                <span>Select All</span>
              </label>
            </div>
          )}

          {filteredContent.map(item => (
            <div
              key={item.id}
              className={`ch-content-item ${selectedItems.includes(item.id) ? 'selected' : ''}`}
            >
              {/* Selection checkbox */}
              <div className="ch-item-select">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </div>

              {/* Content Header */}
              <div className="ch-item-header">
                <span className="ch-platform-icon">
                  {PLATFORM_ICONS[item.platform] || '📱'}
                </span>
                <span className="ch-platform-name">{item.platform}</span>
                <span className={`ch-status-badge ${STATUS_BADGES[item.status]?.class || ''}`}>
                  {STATUS_BADGES[item.status]?.label || item.status}
                </span>
              </div>

              {/* Content Body */}
              <div className="ch-item-body">
                {editingId === item.id ? (
                  <div className="ch-edit-mode">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="ch-edit-textarea"
                      rows={6}
                    />
                    <div className="ch-edit-actions">
                      <button className="ch-btn ch-btn-small" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button className="ch-btn ch-btn-primary ch-btn-small" onClick={saveEdit}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="ch-item-content">
                    {expandedId === item.id
                      ? item.content
                      : truncateText(item.content)}
                    {item.content?.length > 150 && (
                      <button
                        className="ch-expand-btn"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        {expandedId === item.id ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </p>
                )}
              </div>

              {/* Content Meta */}
              <div className="ch-item-meta">
                <span className="ch-type-tag">
                  {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
                </span>
                <span className="ch-date">{formatDate(item.created_at)}</span>
              </div>

              {/* Engagement Data (if posted) */}
              {item.status === 'posted' && item.engagement_data && (
                <div className="ch-engagement">
                  <span>❤️ {item.engagement_data.likes || 0}</span>
                  <span>💬 {item.engagement_data.comments || 0}</span>
                  <span>🔄 {item.engagement_data.shares || 0}</span>
                  <span>📌 {item.engagement_data.saves || 0}</span>
                  {item.engagement_data.impressions > 0 && (
                    <span>👁️ {item.engagement_data.impressions}</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="ch-item-actions">
                <button
                  className="ch-action-btn"
                  onClick={() => handleCopy(item.content)}
                  title="Copy"
                >
                  📋
                </button>
                <button
                  className="ch-action-btn"
                  onClick={() => startEdit(item)}
                  title="Edit"
                >
                  ✏️
                </button>

                {/* Status dropdown */}
                <select
                  value={item.status}
                  onChange={e => handleStatusChange(item.id, e.target.value)}
                  className="ch-status-select"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="posted">Posted</option>
                  <option value="archived">Archive</option>
                </select>

                {/* Add metrics button for posted content */}
                {item.status === 'posted' && (
                  <button
                    className="ch-action-btn"
                    onClick={() => setShowMetricsUpload(item)}
                    title="Add Metrics"
                  >
                    📊
                  </button>
                )}

                <button
                  className="ch-action-btn ch-action-danger"
                  onClick={() => handleDelete(item.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Upload Modal */}
      {showMetricsUpload && (
        <MetricsScreenshotUpload
          userId={user.id}
          preSelectedContentId={showMetricsUpload.id}
          onClose={() => setShowMetricsUpload(null)}
          onMetricsSaved={() => {
            loadContent()
            loadStats()
          }}
        />
      )}
    </div>
  )
}
