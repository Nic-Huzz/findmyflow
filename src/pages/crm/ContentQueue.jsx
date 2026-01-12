/**
 * Content Queue Page
 * Unified queue with tabs: Approval → Scheduled → Posted
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { ApprovalQueue } from '../../components/crm'
import './ContentQueue.css'

// Platform icons
const PLATFORM_ICONS = {
  instagram: '📸',
  linkedin: '💼',
  twitter: '🐦',
  facebook: '👥',
  tiktok: '🎵',
  email: '📧'
}

export default function ContentQueue() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('approval') // 'approval', 'scheduled', 'posted'
  const [scheduledItems, setScheduledItems] = useState([])
  const [postedItems, setPostedItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [counts, setCounts] = useState({ approval: 0, scheduled: 0, posted: 0 })
  const [toast, setToast] = useState(null)

  // Show toast notification
  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  // Copy content with toast confirmation
  function copyContent(text) {
    navigator.clipboard.writeText(text)
    showToast('✓ Copied to clipboard')
  }

  // Load counts for all tabs
  const loadCounts = useCallback(async () => {
    if (!user?.id) return

    const [approvalRes, scheduledRes, postedRes] = await Promise.all([
      supabase.from('content_history').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .or('status.eq.draft,review_status.eq.pending,review_status.eq.needs_edit'),
      supabase.from('content_history').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .eq('review_status', 'approved'),
      supabase.from('content_history').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'posted')
    ])

    setCounts({
      approval: approvalRes.count || 0,
      scheduled: scheduledRes.count || 0,
      posted: postedRes.count || 0
    })
  }, [user?.id])

  // Load scheduled items
  const loadScheduled = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const { data } = await supabase
      .from('content_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .eq('review_status', 'approved')
      .order('scheduled_date', { ascending: true })

    setScheduledItems(data || [])
    setLoading(false)
  }, [user?.id])

  // Load posted items
  const loadPosted = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const { data } = await supabase
      .from('content_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'posted')
      .order('posted_at', { ascending: false })
      .limit(50)

    setPostedItems(data || [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  useEffect(() => {
    if (activeTab === 'scheduled') loadScheduled()
    if (activeTab === 'posted') loadPosted()
  }, [activeTab, loadScheduled, loadPosted])

  // Mark content as posted
  async function markAsPosted(id) {
    const { error } = await supabase
      .from('content_history')
      .update({ status: 'posted', posted_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setScheduledItems(prev => prev.filter(i => i.id !== id))
      loadCounts()
    }
  }

  // Check if item has metrics
  function hasMetrics(item) {
    const data = item.engagement_data
    if (!data || typeof data !== 'object') return false
    return (data.likes > 0 || data.comments > 0 || data.shares > 0 || data.impressions > 0)
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  function truncate(text, max = 150) {
    if (!text || text.length <= max) return text
    return text.substring(0, max) + '...'
  }

  return (
    <div className="cq-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`cq-toast cq-toast-${toast.type || 'success'}`}>
          {toast.message}
        </div>
      )}

      <header className="cq-page-header">
        <button className="cq-back-btn" onClick={() => navigate('/crm/marketing')}>
          ← Back to Marketing
        </button>
        <div className="cq-page-title">
          <h1>Content Queue</h1>
          <p>Manage your content pipeline</p>
        </div>
        <div className="cq-page-actions">
          <button
            className="cq-action-btn"
            onClick={() => navigate('/crm/content-history')}
          >
            📚 All History
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="cq-tabs">
        <button
          className={`cq-tab ${activeTab === 'approval' ? 'active' : ''}`}
          onClick={() => setActiveTab('approval')}
        >
          <span className="cq-tab-icon">📝</span>
          <span className="cq-tab-label">Approval</span>
          {counts.approval > 0 && <span className="cq-tab-badge">{counts.approval}</span>}
        </button>
        <button
          className={`cq-tab ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          <span className="cq-tab-icon">📅</span>
          <span className="cq-tab-label">Scheduled</span>
          {counts.scheduled > 0 && <span className="cq-tab-badge cq-badge-scheduled">{counts.scheduled}</span>}
        </button>
        <button
          className={`cq-tab ${activeTab === 'posted' ? 'active' : ''}`}
          onClick={() => setActiveTab('posted')}
        >
          <span className="cq-tab-icon">✅</span>
          <span className="cq-tab-label">Posted</span>
          {counts.posted > 0 && <span className="cq-tab-badge cq-badge-posted">{counts.posted}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="cq-content">
        {/* Approval Tab */}
        {activeTab === 'approval' && (
          <ApprovalQueue onApprove={() => loadCounts()} />
        )}

        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="cq-scheduled">
            {loading ? (
              <div className="cq-loading">Loading scheduled content...</div>
            ) : scheduledItems.length === 0 ? (
              <div className="cq-empty">
                <div className="cq-empty-icon">📅</div>
                <h3>No scheduled content</h3>
                <p>Approved content will appear here ready for posting</p>
              </div>
            ) : (
              <div className="cq-list">
                {scheduledItems.map(item => (
                  <div key={item.id} className="cq-item">
                    <div className="cq-item-header">
                      <span className="cq-platform">
                        {PLATFORM_ICONS[item.platform]} {item.platform}
                      </span>
                      <span className="cq-date">{formatDate(item.scheduled_date)}</span>
                    </div>
                    <p className="cq-item-content">{truncate(item.content)}</p>
                    <div className="cq-item-actions">
                      <button
                        className="cq-btn cq-btn-copy"
                        onClick={() => copyContent(item.content)}
                      >
                        📋 Copy
                      </button>
                      <button
                        className="cq-btn cq-btn-posted"
                        onClick={() => markAsPosted(item.id)}
                      >
                        ✅ Mark Posted
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Posted Tab */}
        {activeTab === 'posted' && (
          <div className="cq-posted">
            {loading ? (
              <div className="cq-loading">Loading posted content...</div>
            ) : postedItems.length === 0 ? (
              <div className="cq-empty">
                <div className="cq-empty-icon">📊</div>
                <h3>No posted content yet</h3>
                <p>Content you've posted will appear here for tracking</p>
              </div>
            ) : (
              <div className="cq-list">
                {postedItems.map(item => (
                  <div key={item.id} className={`cq-item ${hasMetrics(item) ? 'has-metrics' : 'needs-metrics'}`}>
                    <div className="cq-item-header">
                      <span className="cq-platform">
                        {PLATFORM_ICONS[item.platform]} {item.platform}
                      </span>
                      <span className="cq-date">Posted {formatDate(item.posted_at)}</span>
                      {hasMetrics(item) ? (
                        <span className="cq-metrics-badge cq-metrics-done">📊 Metrics Added</span>
                      ) : (
                        <span className="cq-metrics-badge cq-metrics-pending">⏳ Add Metrics</span>
                      )}
                    </div>
                    <p className="cq-item-content">{truncate(item.content)}</p>
                    {hasMetrics(item) && (
                      <div className="cq-metrics-summary">
                        <span>❤️ {item.engagement_data?.likes || 0}</span>
                        <span>💬 {item.engagement_data?.comments || 0}</span>
                        <span>🔄 {item.engagement_data?.shares || 0}</span>
                        {item.engagement_data?.impressions > 0 && (
                          <span>👁️ {item.engagement_data.impressions}</span>
                        )}
                      </div>
                    )}
                    <div className="cq-item-actions">
                      {!hasMetrics(item) && (
                        <button
                          className="cq-btn cq-btn-metrics"
                          onClick={() => navigate(`/crm/performance?content=${item.id}`)}
                        >
                          📊 Add Metrics
                        </button>
                      )}
                      <button
                        className="cq-btn cq-btn-view"
                        onClick={() => navigate(`/crm/content-history?id=${item.id}`)}
                      >
                        👁️ View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
