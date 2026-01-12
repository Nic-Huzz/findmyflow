/**
 * MetricsScreenshotUpload - AI-powered post performance tracking
 * Upload a screenshot of your post analytics and let Claude Vision extract metrics
 */
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { analyzeMetricsScreenshot, uploadMetricsScreenshot, saveContentMetrics, updateStrategyFromScreenshot } from '../../lib/screenshotAnalysis'
import './MetricsScreenshotUpload.css'

const PERFORMANCE_TIERS = {
  viral: { icon: '🚀', label: 'Viral', color: '#10b981' },
  good: { icon: '🔥', label: 'Good', color: '#f59e0b' },
  average: { icon: '📊', label: 'Average', color: '#6b7280' },
  low: { icon: '📉', label: 'Low', color: '#ef4444' }
}

export default function MetricsScreenshotUpload({ userId, onClose, onMetricsSaved, preSelectedContentId }) {
  const [step, setStep] = useState(preSelectedContentId ? 'loading' : 'select') // loading, select, upload, analyzing, review, saving, success, error
  const [contentItems, setContentItems] = useState([])
  const [selectedContent, setSelectedContent] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [editedMetrics, setEditedMetrics] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  // Load user's posted content
  useEffect(() => {
    if (userId) {
      loadContentHistory()
    }
  }, [userId])

  // If preSelectedContentId is provided, auto-select that content
  useEffect(() => {
    if (preSelectedContentId && contentItems.length > 0) {
      const content = contentItems.find(c => c.id === preSelectedContentId)
      if (content) {
        setSelectedContent(content)
        setStep('upload')
      } else {
        // Content not found, show selection
        setStep('select')
      }
    }
  }, [preSelectedContentId, contentItems])

  async function loadContentHistory() {
    if (!userId) {
      console.error('No userId provided to MetricsScreenshotUpload')
      setError('User not authenticated')
      return
    }

    try {
      const { data, error } = await supabase
        .from('content_history')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['posted', 'scheduled', 'draft'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setContentItems(data || [])
    } catch (err) {
      console.error('Error loading content:', err)
      setError('Failed to load content history')
    }
  }

  function handleSelectContent(content) {
    setSelectedContent(content)
    setStep('upload')
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  async function handleAnalyze() {
    if (!selectedFile) return

    setStep('analyzing')
    setError(null)

    try {
      const result = await analyzeMetricsScreenshot(selectedFile)

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      setMetrics(result.metrics)
      setEditedMetrics({ ...result.metrics })
      setStep('review')
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze screenshot')
      setStep('error')
    }
  }

  function handleMetricChange(field, value) {
    setEditedMetrics(prev => ({
      ...prev,
      [field]: value === '' ? null : (typeof prev[field] === 'number' ? parseInt(value) || null : value)
    }))
  }

  async function handleSave() {
    if (!editedMetrics || !selectedContent) return

    setStep('saving')
    setLoading(true)

    try {
      // Upload screenshot
      let screenshotUrl = null
      if (selectedFile) {
        const uploadResult = await uploadMetricsScreenshot(userId, selectedFile, selectedContent.id)
        if (uploadResult) {
          screenshotUrl = uploadResult.url
        }
      }

      // Save metrics to content history
      const success = await saveContentMetrics(selectedContent.id, editedMetrics, screenshotUrl)

      if (!success) {
        throw new Error('Failed to save metrics')
      }

      // Update content strategy with new metrics (for smarter calculations over time)
      await updateStrategyFromScreenshot(userId, editedMetrics)

      setStep('success')
      if (onMetricsSaved) {
        onMetricsSaved(selectedContent.id, editedMetrics)
      }
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save metrics')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  function handleRetry() {
    setStep('upload')
    setError(null)
    setMetrics(null)
    setEditedMetrics(null)
  }

  function handleClear() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setMetrics(null)
    setEditedMetrics(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function formatNumber(num) {
    if (num === null || num === undefined) return '-'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const tier = editedMetrics?.performance_tier ? PERFORMANCE_TIERS[editedMetrics.performance_tier] : null

  return (
    <div className="msu-overlay" onClick={onClose}>
      <div className="msu-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="msu-header">
          <div className="msu-header-title">
            <span className="msu-header-icon">📊</span>
            <h3>Track Post Performance</h3>
          </div>
          <button className="msu-close" onClick={onClose}>×</button>
        </div>

        {/* Loading State (for preSelectedContentId) */}
        {step === 'loading' && (
          <div className="msu-content msu-loading">
            <div className="msu-analyzing-spinner"></div>
            <p>Loading content...</p>
          </div>
        )}

        {/* Step 1: Select Content */}
        {step === 'select' && (
          <div className="msu-content">
            <p className="msu-intro">
              Select a piece of content to track its performance metrics.
            </p>

            {contentItems.length === 0 ? (
              <div className="msu-empty">
                <span className="msu-empty-icon">📝</span>
                <p>No content found. Generate some content first!</p>
              </div>
            ) : (
              <div className="msu-content-list">
                {contentItems.map(item => (
                  <button
                    key={item.id}
                    className={`msu-content-item ${item.engagement_data?.likes ? 'has-metrics' : ''}`}
                    onClick={() => handleSelectContent(item)}
                  >
                    <div className="msu-content-preview">
                      {item.content.substring(0, 80)}...
                    </div>
                    <div className="msu-content-meta">
                      <span className="msu-platform">{item.platform}</span>
                      <span className="msu-type">{item.content_type}</span>
                      <span className="msu-date">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.engagement_data?.likes && (
                        <span className="msu-has-metrics-badge">Has Metrics</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload Screenshot */}
        {step === 'upload' && (
          <div className="msu-content">
            <div className="msu-selected-content">
              <span className="msu-label">Tracking metrics for:</span>
              <div className="msu-selected-preview">
                {selectedContent?.content.substring(0, 100)}...
              </div>
              <button className="msu-change-btn" onClick={() => setStep('select')}>
                Change
              </button>
            </div>

            <div
              className={`msu-upload-zone ${selectedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="msu-preview-container">
                  <img src={previewUrl} alt="Preview" className="msu-preview-image" />
                  <button
                    className="msu-clear-preview"
                    onClick={(e) => { e.stopPropagation(); handleClear() }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="msu-upload-placeholder">
                  <span className="msu-upload-icon">📷</span>
                  <p className="msu-upload-text">Upload analytics screenshot</p>
                  <p className="msu-upload-hint">Instagram Insights, LinkedIn Analytics, etc.</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {error && (
              <div className="msu-error">
                <span className="msu-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="msu-tips">
              <h4>Tips for best results:</h4>
              <ul>
                <li>Screenshot your post's analytics/insights page</li>
                <li>Include as many metrics as possible in the screenshot</li>
                <li>Make sure numbers are clearly visible</li>
              </ul>
            </div>

            <div className="msu-actions">
              <button className="msu-cancel-btn" onClick={() => setStep('select')}>
                Back
              </button>
              <button
                className="msu-analyze-btn"
                onClick={handleAnalyze}
                disabled={!selectedFile}
              >
                Analyze with AI
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Analyzing */}
        {step === 'analyzing' && (
          <div className="msu-content msu-analyzing">
            <div className="msu-analyzing-animation">
              <div className="msu-analyzing-spinner"></div>
              <div className="msu-analyzing-icon">🤖</div>
            </div>
            <h4>Analyzing metrics...</h4>
            <p>Claude is extracting performance data from your screenshot</p>

            {previewUrl && (
              <img src={previewUrl} alt="Analyzing" className="msu-analyzing-preview" />
            )}
          </div>
        )}

        {/* Step 4: Review & Edit Metrics */}
        {step === 'review' && editedMetrics && (
          <div className="msu-content msu-review">
            {/* Confidence & Performance Tier */}
            <div className="msu-review-header">
              {tier && (
                <div className="msu-tier-badge" style={{ background: tier.color }}>
                  <span>{tier.icon}</span>
                  <span>{tier.label} Performance</span>
                </div>
              )}
              <div className="msu-confidence">
                {Math.round((metrics.confidence || 0) * 100)}% confidence
              </div>
            </div>

            {/* Platform Detection */}
            {editedMetrics.platform && (
              <div className="msu-platform-detected">
                Detected: {editedMetrics.platform}
                {editedMetrics.content_type && ` - ${editedMetrics.content_type}`}
              </div>
            )}

            {/* Metrics Grid */}
            <div className="msu-metrics-grid">
              <div className="msu-metric-field">
                <label>Likes</label>
                <input
                  type="number"
                  value={editedMetrics.likes ?? ''}
                  onChange={e => handleMetricChange('likes', e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="msu-metric-field">
                <label>Comments</label>
                <input
                  type="number"
                  value={editedMetrics.comments ?? ''}
                  onChange={e => handleMetricChange('comments', e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="msu-metric-field">
                <label>Shares</label>
                <input
                  type="number"
                  value={editedMetrics.shares ?? ''}
                  onChange={e => handleMetricChange('shares', e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="msu-metric-field">
                <label>Saves</label>
                <input
                  type="number"
                  value={editedMetrics.saves ?? ''}
                  onChange={e => handleMetricChange('saves', e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="msu-metric-field">
                <label>Impressions</label>
                <input
                  type="number"
                  value={editedMetrics.impressions ?? ''}
                  onChange={e => handleMetricChange('impressions', e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="msu-metric-field">
                <label>Reach</label>
                <input
                  type="number"
                  value={editedMetrics.reach ?? ''}
                  onChange={e => handleMetricChange('reach', e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="msu-metric-field">
                <label>Profile Visits</label>
                <input
                  type="number"
                  value={editedMetrics.profile_visits ?? ''}
                  onChange={e => handleMetricChange('profile_visits', e.target.value)}
                  placeholder="-"
                />
              </div>
              <div className="msu-metric-field">
                <label>Follows</label>
                <input
                  type="number"
                  value={editedMetrics.follows ?? ''}
                  onChange={e => handleMetricChange('follows', e.target.value)}
                  placeholder="-"
                />
              </div>
            </div>

            {/* AI Insights */}
            {editedMetrics.insights?.length > 0 && (
              <div className="msu-insights">
                <h4>AI Insights</h4>
                <ul>
                  {editedMetrics.insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="msu-actions">
              <button className="msu-back-btn" onClick={handleRetry}>
                ← Try different image
              </button>
              <button className="msu-save-btn" onClick={handleSave}>
                Save Metrics
              </button>
            </div>
          </div>
        )}

        {/* Saving State */}
        {step === 'saving' && (
          <div className="msu-content msu-saving">
            <div className="msu-saving-spinner"></div>
            <p>Saving metrics...</p>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="msu-content msu-success">
            <div className="msu-success-icon">✓</div>
            <h4>Metrics Saved!</h4>
            <p>Your post performance data has been recorded.</p>
            <p className="msu-success-note">
              The more metrics you track, the smarter your content suggestions become.
            </p>
            <div className="msu-actions">
              <button className="msu-done-btn" onClick={onClose}>
                Done
              </button>
              <button className="msu-another-btn" onClick={() => {
                setStep('select')
                handleClear()
                setSelectedContent(null)
              }}>
                Track Another
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="msu-content msu-error-state">
            <div className="msu-error-icon-large">❌</div>
            <h4>Something went wrong</h4>
            <p className="msu-error-message">{error}</p>
            <div className="msu-actions">
              <button className="msu-retry-btn" onClick={handleRetry}>
                Try Again
              </button>
              <button className="msu-cancel-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
