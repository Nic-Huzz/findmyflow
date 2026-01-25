/**
 * LeadsCapture - AI-powered lead extraction from screenshots
 * Upload DM/comments screenshots, AI extracts leads, user confirms and adds details,
 * contacts are auto-created and tagged to pipeline
 */
import { useState, useRef } from 'react'
import {
  analyzeLeadsScreenshot,
  createContactsFromLeads,
  updateContentWithLeads
} from '../../lib/screenshotAnalysis'
import './LeadsCapture.css'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'facebook', label: 'Facebook', icon: '👥' },
  { id: 'twitter', label: 'X / Twitter', icon: '🐦' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'other', label: 'Other', icon: '📱' }
]

const TEMPERATURE_BADGES = {
  hot: { label: 'Hot', color: '#ef4444', icon: '🔥' },
  warm: { label: 'Warm', color: '#f59e0b', icon: '☀️' },
  cold: { label: 'Cold', color: '#6b7280', icon: '❄️' }
}

export default function LeadsCapture({
  userId,
  contentId = null,
  platform = null,
  onClose,
  onLeadsCaptured
}) {
  const [step, setStep] = useState('upload') // upload, analyzing, review, details, saving, success
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedPlatform, setSelectedPlatform] = useState(platform || null)
  const [extractedLeads, setExtractedLeads] = useState([])
  const [editableLeads, setEditableLeads] = useState([])
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)
  const [createdContacts, setCreatedContacts] = useState([])
  const fileInputRef = useRef(null)

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
      const result = await analyzeLeadsScreenshot(selectedFile, selectedPlatform)

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze screenshot')
      }

      setAnalysisResult(result)
      setExtractedLeads(result.leads || [])

      // Initialize editable leads with extracted data
      setEditableLeads((result.leads || []).map(lead => ({
        ...lead,
        selected: true, // All selected by default
        email: lead.email || '',
        phone: lead.phone || '',
        customNotes: ''
      })))

      if (result.leads?.length > 0) {
        setStep('review')
      } else {
        setError('No leads found in this screenshot. Try a different image with visible DMs or comments.')
        setStep('upload')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze screenshot')
      setStep('upload')
    }
  }

  function handleToggleLead(index) {
    setEditableLeads(prev => prev.map((lead, i) =>
      i === index ? { ...lead, selected: !lead.selected } : lead
    ))
  }

  function handleLeadChange(index, field, value) {
    setEditableLeads(prev => prev.map((lead, i) =>
      i === index ? { ...lead, [field]: value } : lead
    ))
  }

  function handleProceedToDetails() {
    const selectedLeads = editableLeads.filter(l => l.selected)
    if (selectedLeads.length === 0) {
      setError('Please select at least one lead to continue')
      return
    }
    setCurrentLeadIndex(0)
    setStep('details')
  }

  function handleNextLead() {
    const selectedLeads = editableLeads.filter(l => l.selected)
    if (currentLeadIndex < selectedLeads.length - 1) {
      setCurrentLeadIndex(prev => prev + 1)
    } else {
      // All leads reviewed, proceed to save
      handleSaveLeads()
    }
  }

  function handlePrevLead() {
    if (currentLeadIndex > 0) {
      setCurrentLeadIndex(prev => prev - 1)
    }
  }

  async function handleSaveLeads() {
    setStep('saving')
    setError(null)

    try {
      const selectedLeads = editableLeads.filter(l => l.selected)

      const result = await createContactsFromLeads(userId, selectedLeads, contentId)

      if (result.errors.length > 0) {
        console.warn('Some leads had errors:', result.errors)
      }

      setCreatedContacts(result.created)

      // Update content with leads data if contentId provided
      if (contentId && result.created.length > 0) {
        const leadsData = {
          total: result.created.length,
          by_type: selectedLeads.reduce((acc, lead) => {
            const type = lead.engagement_type || 'other'
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {}),
          contacts_created: result.created.length
        }
        await updateContentWithLeads(contentId, leadsData)
      }

      setStep('success')

      if (onLeadsCaptured) {
        onLeadsCaptured(result.created)
      }
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save leads')
      setStep('review')
    }
  }

  function handleRetry() {
    setStep('upload')
    setError(null)
    setExtractedLeads([])
    setEditableLeads([])
    setAnalysisResult(null)
  }

  function handleClear() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const selectedLeads = editableLeads.filter(l => l.selected)
  const currentLead = selectedLeads[currentLeadIndex]

  // Find the original index in editableLeads for the current lead
  const currentLeadOriginalIndex = editableLeads.findIndex(
    l => l.name === currentLead?.name && l.handle === currentLead?.handle
  )

  return (
    <div className="leads-capture-overlay" onClick={onClose}>
      <div className="leads-capture-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="lc-header">
          <div className="lc-header-title">
            <span className="lc-header-icon">🎯</span>
            <h3>Capture Leads</h3>
          </div>
          <button className="lc-close" onClick={onClose}>×</button>
        </div>

        {/* Step 1: Upload Screenshot */}
        {step === 'upload' && (
          <div className="lc-content">
            <p className="lc-intro">
              Upload a screenshot of your DMs, comments, or notifications to extract leads automatically.
            </p>

            {/* Platform Selection */}
            <div className="lc-platforms">
              <label>Platform (optional)</label>
              <div className="lc-platform-grid">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    className={`lc-platform-btn ${selectedPlatform === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlatform(p.id === selectedPlatform ? null : p.id)}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Zone */}
            <div
              className={`lc-upload-zone ${selectedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="lc-preview-container">
                  <img src={previewUrl} alt="Preview" className="lc-preview-image" />
                  <button
                    className="lc-clear-preview"
                    onClick={(e) => { e.stopPropagation(); handleClear() }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="lc-upload-placeholder">
                  <span className="lc-upload-icon">📷</span>
                  <p className="lc-upload-text">Upload DMs or comments screenshot</p>
                  <p className="lc-upload-hint">We'll extract potential leads automatically</p>
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
              <div className="lc-error">
                <span className="lc-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="lc-tips">
              <h4>Tips for best results:</h4>
              <ul>
                <li>Screenshot your DM inbox or comment notifications</li>
                <li>Make sure names/handles are visible</li>
                <li>Include the conversation preview if possible</li>
              </ul>
            </div>

            <div className="lc-actions">
              <button className="lc-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="lc-analyze-btn"
                onClick={handleAnalyze}
                disabled={!selectedFile}
              >
                Analyze with AI
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <div className="lc-content lc-analyzing">
            <div className="lc-analyzing-animation">
              <div className="lc-spinner"></div>
              <div className="lc-analyzing-icon">🤖</div>
            </div>
            <h4>Analyzing screenshot...</h4>
            <p>Claude is extracting lead information</p>

            {previewUrl && (
              <img src={previewUrl} alt="Analyzing" className="lc-analyzing-preview" />
            )}
          </div>
        )}

        {/* Step 3: Review Extracted Leads */}
        {step === 'review' && (
          <div className="lc-content lc-review">
            <div className="lc-review-header">
              <div className="lc-found-count">
                <span className="lc-count-number">{extractedLeads.length}</span>
                <span className="lc-count-label">lead{extractedLeads.length !== 1 ? 's' : ''} found</span>
              </div>
              {analysisResult?.platform_detected && (
                <div className="lc-platform-detected">
                  {analysisResult.platform_detected}
                </div>
              )}
            </div>

            <p className="lc-review-intro">
              Select the leads you want to add as contacts:
            </p>

            <div className="lc-leads-list">
              {editableLeads.map((lead, index) => {
                const temp = TEMPERATURE_BADGES[lead.temperature] || TEMPERATURE_BADGES.warm
                return (
                  <div
                    key={index}
                    className={`lc-lead-card ${lead.selected ? 'selected' : ''}`}
                    onClick={() => handleToggleLead(index)}
                  >
                    <div className="lc-lead-checkbox">
                      {lead.selected ? '✓' : ''}
                    </div>
                    <div className="lc-lead-info">
                      <div className="lc-lead-header">
                        <span className="lc-lead-name">{lead.name || lead.handle || 'Unknown'}</span>
                        <span
                          className="lc-temp-badge"
                          style={{ background: temp.color }}
                        >
                          {temp.icon} {temp.label}
                        </span>
                      </div>
                      {lead.handle && lead.handle !== lead.name && (
                        <span className="lc-lead-handle">{lead.handle}</span>
                      )}
                      <div className="lc-lead-meta">
                        <span className="lc-engagement-type">{lead.engagement_type}</span>
                        {lead.platform && <span className="lc-lead-platform">{lead.platform}</span>}
                      </div>
                      {lead.message_preview && (
                        <p className="lc-message-preview">"{lead.message_preview}"</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="lc-error">
                <span className="lc-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="lc-actions">
              <button className="lc-back-btn" onClick={handleRetry}>
                ← Try different image
              </button>
              <button
                className="lc-continue-btn"
                onClick={handleProceedToDetails}
                disabled={selectedLeads.length === 0}
              >
                Continue ({selectedLeads.length} selected)
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Add Details for Each Lead */}
        {step === 'details' && currentLead && (
          <div className="lc-content lc-details">
            <div className="lc-details-progress">
              <span>Lead {currentLeadIndex + 1} of {selectedLeads.length}</span>
              <div className="lc-progress-bar">
                <div
                  className="lc-progress-fill"
                  style={{ width: `${((currentLeadIndex + 1) / selectedLeads.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="lc-lead-detail-card">
              <div className="lc-lead-detail-header">
                <span className="lc-lead-avatar">
                  {(currentLead.name || currentLead.handle || 'U')[0].toUpperCase()}
                </span>
                <div>
                  <h4>{currentLead.name || currentLead.handle || 'Unknown'}</h4>
                  {currentLead.handle && currentLead.handle !== currentLead.name && (
                    <span className="lc-detail-handle">{currentLead.handle}</span>
                  )}
                </div>
                <span
                  className="lc-temp-badge"
                  style={{ background: TEMPERATURE_BADGES[currentLead.temperature]?.color || '#6b7280' }}
                >
                  {TEMPERATURE_BADGES[currentLead.temperature]?.icon || '☀️'}
                </span>
              </div>

              {currentLead.message_preview && (
                <div className="lc-detail-message">
                  <label>Message</label>
                  <p>"{currentLead.message_preview}"</p>
                </div>
              )}

              <div className="lc-detail-form">
                <div className="lc-form-group">
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={currentLead.email || ''}
                    onChange={(e) => handleLeadChange(currentLeadOriginalIndex, 'email', e.target.value)}
                  />
                </div>

                <div className="lc-form-group">
                  <label>Phone (optional)</label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={currentLead.phone || ''}
                    onChange={(e) => handleLeadChange(currentLeadOriginalIndex, 'phone', e.target.value)}
                  />
                </div>

                <div className="lc-form-group">
                  <label>Additional Notes (optional)</label>
                  <textarea
                    placeholder="Any additional context about this lead..."
                    value={currentLead.customNotes || ''}
                    onChange={(e) => handleLeadChange(currentLeadOriginalIndex, 'customNotes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="lc-pipeline-info">
                <span className="lc-pipeline-icon">📊</span>
                <p>
                  This lead will be added to your pipeline as a
                  <strong> {currentLead.temperature === 'hot' ? 'Qualified Lead' : 'New Lead'}</strong>
                </p>
              </div>
            </div>

            <div className="lc-actions lc-details-actions">
              {currentLeadIndex > 0 && (
                <button className="lc-back-btn" onClick={handlePrevLead}>
                  ← Previous
                </button>
              )}
              <button className="lc-continue-btn" onClick={handleNextLead}>
                {currentLeadIndex === selectedLeads.length - 1 ? 'Save All Leads' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Saving */}
        {step === 'saving' && (
          <div className="lc-content lc-saving">
            <div className="lc-spinner"></div>
            <p>Creating contacts...</p>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 'success' && (
          <div className="lc-content lc-success">
            <div className="lc-success-icon">✓</div>
            <h4>{createdContacts.length} Contact{createdContacts.length !== 1 ? 's' : ''} Created!</h4>
            <p>Your leads have been added to your CRM and pipeline.</p>

            <div className="lc-success-summary">
              {createdContacts.slice(0, 5).map((contact, i) => (
                <div key={i} className="lc-created-contact">
                  <span className="lc-contact-avatar">
                    {contact.name[0].toUpperCase()}
                  </span>
                  <span className="lc-contact-name">{contact.name}</span>
                  <span className="lc-contact-stage">{contact.lifecycle_stage}</span>
                </div>
              ))}
              {createdContacts.length > 5 && (
                <p className="lc-more-contacts">+{createdContacts.length - 5} more</p>
              )}
            </div>

            <div className="lc-actions">
              <button className="lc-done-btn" onClick={onClose}>
                Done
              </button>
              <button className="lc-another-btn" onClick={handleRetry}>
                Capture More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
