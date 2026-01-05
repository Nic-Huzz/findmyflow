/**
 * ScreenshotUpload - AI-powered deal creation from conversation screenshots
 * Upload a screenshot and let Claude Vision extract deal details
 */
import { useState, useRef } from 'react'
import { analyzeScreenshot, mapExtractedToDeal } from '../../lib/screenshotAnalysis'
import { PRODUCTS } from '../../lib/crm'
import './ScreenshotUpload.css'

export default function ScreenshotUpload({ onDealExtracted, onClose, existingDeals = [] }) {
  const [step, setStep] = useState('upload') // upload, analyzing, review, error
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const [matchingDeals, setMatchingDeals] = useState([])
  const [editedDeal, setEditedDeal] = useState(null)
  const [error, setError] = useState(null)
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
      const result = await analyzeScreenshot(selectedFile, existingDeals)

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      setExtracted(result.extracted)
      setMatchingDeals(result.matchingDeals || [])

      // Map to deal fields for editing
      const dealData = mapExtractedToDeal(result.extracted)
      setEditedDeal(dealData)
      setStep('review')

    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze screenshot')
      setStep('error')
    }
  }

  function handleFieldChange(field, value) {
    setEditedDeal(prev => ({ ...prev, [field]: value }))
  }

  function handleCreateDeal() {
    if (!editedDeal) return
    onDealExtracted(editedDeal, selectedFile)
  }

  function handleUpdateExisting(deal) {
    // Merge extracted data with existing deal
    const merged = {
      ...editedDeal,
      id: deal.id,
      isUpdate: true
    }
    onDealExtracted(merged, selectedFile)
  }

  function handleRetry() {
    setStep('upload')
    setError(null)
  }

  function handleClear() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setExtracted(null)
    setMatchingDeals([])
    setEditedDeal(null)
    setError(null)
    setStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="screenshot-upload-overlay" onClick={onClose}>
      <div className="screenshot-upload-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="screenshot-upload-header">
          <div className="header-title">
            <span className="header-icon">📸</span>
            <h3>Create Deal from Screenshot</h3>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="screenshot-upload-content">
            <div
              className={`upload-zone ${selectedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  <button
                    className="clear-preview"
                    onClick={(e) => { e.stopPropagation(); handleClear() }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <p className="upload-text">Click to upload or take a photo</p>
                  <p className="upload-hint">Supports: JPEG, PNG, GIF, WebP (max 5MB)</p>
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
              <div className="upload-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="upload-tips">
              <h4>Tips for best results:</h4>
              <ul>
                <li>Include the full conversation thread if possible</li>
                <li>Make sure names and text are clearly visible</li>
                <li>Works with DMs, emails, texts, and more</li>
              </ul>
            </div>

            <div className="upload-actions">
              <button className="cancel-btn" onClick={onClose}>Cancel</button>
              <button
                className="analyze-btn"
                onClick={handleAnalyze}
                disabled={!selectedFile}
              >
                Analyze with AI
              </button>
            </div>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="screenshot-upload-content analyzing">
            <div className="analyzing-animation">
              <div className="analyzing-spinner"></div>
              <div className="analyzing-icon">🤖</div>
            </div>
            <h4>Analyzing screenshot...</h4>
            <p>Claude is extracting deal details from your conversation</p>

            {previewUrl && (
              <img src={previewUrl} alt="Analyzing" className="analyzing-preview" />
            )}
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && extracted && editedDeal && (
          <div className="screenshot-upload-content review">
            {/* Confidence indicator */}
            <div className={`confidence-badge ${extracted.confidence >= 0.7 ? 'high' : extracted.confidence >= 0.4 ? 'medium' : 'low'}`}>
              <span className="confidence-icon">
                {extracted.confidence >= 0.7 ? '✓' : extracted.confidence >= 0.4 ? '~' : '?'}
              </span>
              {Math.round(extracted.confidence * 100)}% confidence
            </div>

            {/* Detected platform */}
            {extracted.platform_detected && (
              <div className="platform-badge">
                Detected: {extracted.platform_detected}
              </div>
            )}

            {/* Matching deals */}
            {matchingDeals.length > 0 && (
              <div className="matching-deals">
                <h4>Possible matches found:</h4>
                {matchingDeals.map(match => (
                  <div key={match.deal.id} className="match-card">
                    <div className="match-info">
                      <span className="match-name">{match.deal.contact_name}</span>
                      <span className="match-score">{match.matchScore}% match</span>
                    </div>
                    <button
                      className="update-existing-btn"
                      onClick={() => handleUpdateExisting(match.deal)}
                    >
                      Update this deal
                    </button>
                  </div>
                ))}
                <div className="match-divider">or create new deal below</div>
              </div>
            )}

            {/* Editable fields */}
            <div className="review-fields">
              <div className="field-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  value={editedDeal.contact_name}
                  onChange={e => handleFieldChange('contact_name', e.target.value)}
                  placeholder="Contact name"
                />
              </div>

              <div className="field-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editedDeal.contact_email}
                  onChange={e => handleFieldChange('contact_email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Product</label>
                  <select
                    value={editedDeal.product_type}
                    onChange={e => handleFieldChange('product_type', e.target.value)}
                  >
                    {Object.entries(PRODUCTS).map(([name, price]) => (
                      <option key={name} value={name}>{name} (${price})</option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label>Value ($)</label>
                  <input
                    type="number"
                    value={editedDeal.value}
                    onChange={e => handleFieldChange('value', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Stage</label>
                  <select
                    value={editedDeal.status}
                    onChange={e => handleFieldChange('status', e.target.value)}
                  >
                    <option value="lead">Lead</option>
                    <option value="discovery">Discovery</option>
                    <option value="proposal">Proposal</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Temperature</label>
                  <div className="temperature-display">
                    <span className={`temp-badge ${extracted.lead_temperature}`}>
                      {extracted.lead_temperature === 'hot' && '🔥 Hot'}
                      {extracted.lead_temperature === 'warm' && '🌤️ Warm'}
                      {extracted.lead_temperature === 'cold' && '❄️ Cold'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key points extracted */}
              {extracted.key_points?.length > 0 && (
                <div className="extracted-section">
                  <label>Key Points Extracted:</label>
                  <ul className="key-points-list">
                    {extracted.key_points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pain indicators */}
              {extracted.pain_indicators?.length > 0 && (
                <div className="extracted-section pain">
                  <label>Pain Points Detected:</label>
                  <ul className="pain-points-list">
                    {extracted.pain_indicators.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="field-group">
                <label>Notes</label>
                <textarea
                  value={editedDeal.notes}
                  onChange={e => handleFieldChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="review-actions">
              <button className="back-btn" onClick={handleClear}>
                ← Try different image
              </button>
              <button className="create-deal-btn" onClick={handleCreateDeal}>
                Create Deal
              </button>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="screenshot-upload-content error-state">
            <div className="error-icon-large">❌</div>
            <h4>Analysis Failed</h4>
            <p className="error-message">{error}</p>

            {previewUrl && (
              <img src={previewUrl} alt="Failed" className="error-preview" />
            )}

            <div className="error-actions">
              <button className="retry-btn" onClick={handleRetry}>
                Try Again
              </button>
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
