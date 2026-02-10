/**
 * GeneratedAssetsLibrary - View and manage saved AI-generated content
 *
 * Part of Sales Tower Tier 3.
 * Displays all saved assets from the Implementation Coach with filtering,
 * favoriting, and copy functionality.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import BottomToolbar from '../../components/BottomToolbar'
import './GeneratedAssetsLibrary.css'

// Category display names and colors
const CATEGORIES = {
  attraction: { label: 'Attraction', color: '#10b981' },
  upsell: { label: 'Upsell', color: '#8b5cf6' },
  downsell: { label: 'Downsell', color: '#f59e0b' },
  continuity: { label: 'Continuity', color: '#3b82f6' },
}

// Asset type display names
const ASSET_TYPES = {
  headline: 'Headline',
  email: 'Email',
  script: 'Script',
  pricing: 'Pricing',
  pitch: 'Pitch',
  content: 'Content',
}

export default function GeneratedAssetsLibrary({ userId: propUserId }) {
  const { user } = useAuth()
  const userId = propUserId || user?.id
  const navigate = useNavigate()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // UI state
  const [expandedId, setExpandedId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (userId) {
      loadAssets()
    }
  }, [userId])

  async function loadAssets() {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('generated_assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setAssets(data || [])
    } catch (err) {
      console.error('Error loading assets:', err)
      setError('Failed to load your saved content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (assetId, currentValue) => {
    try {
      const { error: updateError } = await supabase
        .from('generated_assets')
        .update({ is_favorite: !currentValue })
        .eq('id', assetId)

      if (updateError) throw updateError

      setAssets(prev =>
        prev.map(a =>
          a.id === assetId ? { ...a, is_favorite: !currentValue } : a
        )
      )
    } catch (err) {
      console.error('Error updating favorite:', err)
    }
  }

  const handleCopy = async (asset) => {
    try {
      await navigator.clipboard.writeText(asset.content)
      setCopiedId(asset.id)
      setTimeout(() => setCopiedId(null), 2000)

      // Update copy count
      await supabase
        .from('generated_assets')
        .update({
          times_copied: (asset.times_copied || 0) + 1,
          last_copied_at: new Date().toISOString(),
        })
        .eq('id', asset.id)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDelete = async (assetId) => {
    if (!window.confirm('Delete this saved content?')) return

    try {
      const { error: deleteError } = await supabase
        .from('generated_assets')
        .delete()
        .eq('id', assetId)

      if (deleteError) throw deleteError

      setAssets(prev => prev.filter(a => a.id !== assetId))
    } catch (err) {
      console.error('Error deleting asset:', err)
    }
  }

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false
    if (typeFilter !== 'all' && asset.asset_type !== typeFilter) return false
    if (showFavoritesOnly && !asset.is_favorite) return false
    return true
  })

  // Get unique types from assets for filter options
  const availableTypes = [...new Set(assets.map(a => a.asset_type))]

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <div className="assets-library">
      {/* Toolbar */}
      <div className="assets-toolbar">
        <button className="assets-toolbar-back" onClick={() => navigate('/crm')}>←</button>
        <h2 className="assets-toolbar-title">Generated Assets</h2>
      </div>

      {/* Filters */}
      <div className="assets-filters">
        <div className="filter-group">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {ASSET_TYPES[type] || type}
              </option>
            ))}
          </select>
        </div>

        <button
          className={`favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          {showFavoritesOnly ? '★ Favorites' : '☆ Favorites'}
        </button>
      </div>

      {/* Content */}
      <div className="assets-content">
        {loading && (
          <div className="assets-loading">
            <div className="assets-spinner"></div>
            <p>Loading your content...</p>
          </div>
        )}

        {error && (
          <div className="assets-error">
            <p>{error}</p>
            <button onClick={loadAssets}>Try Again</button>
          </div>
        )}

        {!loading && !error && filteredAssets.length === 0 && (
          <div className="assets-empty">
            <span className="empty-icon">📝</span>
            <h3>No saved content yet</h3>
            <p>
              {showFavoritesOnly
                ? "You haven't favorited any content yet."
                : "Generate content from the Implementation Tracker and save it here."}
            </p>
            <button onClick={() => navigate('/crm/implementations')}>
              Go to Implementation Tracker
            </button>
          </div>
        )}

        {!loading && !error && filteredAssets.length > 0 && (
          <div className="assets-list">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                className={`asset-card ${expandedId === asset.id ? 'expanded' : ''}`}
              >
                {/* Card Header */}
                <div
                  className="asset-card-header"
                  onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
                >
                  <div className="asset-meta">
                    <span
                      className="category-badge"
                      style={{ background: CATEGORIES[asset.category]?.color + '20', color: CATEGORIES[asset.category]?.color }}
                    >
                      {CATEGORIES[asset.category]?.label || asset.category}
                    </span>
                    <span className="type-badge">
                      {ASSET_TYPES[asset.asset_type] || asset.asset_type}
                    </span>
                  </div>
                  <button
                    className={`favorite-btn ${asset.is_favorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(asset.id, asset.is_favorite)
                    }}
                  >
                    {asset.is_favorite ? '★' : '☆'}
                  </button>
                </div>

                {/* Task Title */}
                <h3 className="asset-title">{asset.task_title}</h3>

                {/* Preview or Full Content */}
                <div className="asset-preview">
                  {expandedId === asset.id ? (
                    <pre className="asset-content-full">{asset.content}</pre>
                  ) : (
                    <p className="asset-content-preview">
                      {asset.content.substring(0, 150)}
                      {asset.content.length > 150 ? '...' : ''}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="asset-card-footer">
                  <span className="asset-date">{formatDate(asset.created_at)}</span>

                  <div className="asset-actions">
                    <button
                      className={`action-btn ${copiedId === asset.id ? 'copied' : ''}`}
                      onClick={() => handleCopy(asset)}
                    >
                      {copiedId === asset.id ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(asset.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Usage Stats (when expanded) */}
                {expandedId === asset.id && asset.times_copied > 0 && (
                  <div className="asset-stats">
                    <span>Copied {asset.times_copied} time{asset.times_copied !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {!loading && assets.length > 0 && (
        <div className="assets-stats-footer">
          <span>{filteredAssets.length} of {assets.length} items</span>
          <span>•</span>
          <span>{assets.filter(a => a.is_favorite).length} favorites</span>
        </div>
      )}

      <BottomToolbar />
    </div>
  )
}
