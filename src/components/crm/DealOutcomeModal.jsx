/**
 * DealOutcomeModal - Capture win/loss data when closing deals
 * Feeds the autonomous AI with sales intelligence
 * Enhanced: Also captures offer category for Ascension Engine
 */
import { useState } from 'react'
import './DealOutcomeModal.css'

// Offer categories for Value Ladder / Ascension Engine
const OFFER_CATEGORIES = [
  {
    id: 'attraction',
    label: 'Attraction Offer',
    description: 'Lead magnet, giveaway, free resource',
    icon: '🎁',
    isActualSale: false,
  },
  {
    id: 'core',
    label: 'Core Offer',
    description: 'Main product or service',
    icon: '💎',
    isActualSale: true,
  },
  {
    id: 'upsell',
    label: 'Upsell',
    description: 'Premium upgrade',
    icon: '🚀',
    isActualSale: true,
  },
  {
    id: 'downsell',
    label: 'Downsell',
    description: 'Lighter option',
    icon: '💰',
    isActualSale: true,
  },
  {
    id: 'continuity',
    label: 'Continuity',
    description: 'Subscription/recurring',
    icon: '🔄',
    isActualSale: true,
  },
]

const WIN_REASONS = [
  { id: 'timing', label: 'Right timing', description: 'They were ready to solve this now' },
  { id: 'value', label: 'Clear value', description: 'ROI was obvious' },
  { id: 'trust', label: 'Built trust', description: 'Good rapport and credibility' },
  { id: 'offer', label: 'Irresistible offer', description: 'Couldn\'t say no to the deal' },
  { id: 'urgency', label: 'Urgency', description: 'Deadline or limited availability' },
  { id: 'referral', label: 'Strong referral', description: 'Came pre-sold from trusted source' },
]

const LOSS_REASONS = [
  { id: 'price', label: 'Price too high', description: 'Budget constraints' },
  { id: 'timing', label: 'Bad timing', description: 'Not ready yet' },
  { id: 'competitor', label: 'Went with competitor', description: 'Chose another solution' },
  { id: 'no_decision', label: 'No decision', description: 'Went dark or delayed' },
  { id: 'fit', label: 'Not a fit', description: 'Wrong solution for their needs' },
  { id: 'trust', label: 'Trust issues', description: 'Needed more credibility' },
]

export default function DealOutcomeModal({
  deal,
  outcome, // 'won' or 'lost'
  onSave,
  onCancel,
}) {
  const isWin = outcome === 'won'
  const reasons = isWin ? WIN_REASONS : LOSS_REASONS

  const [formData, setFormData] = useState({
    primary_reason: '',
    secondary_reasons: [],
    competitor_mentioned: '',
    price_factor: false,
    timing_factor: false,
    fit_factor: false,
    notes: '',
    // Win-specific fields
    final_value: deal.value,
    what_sold_them: '',
    // Offer category for Ascension Engine (wins only)
    offer_category: '',
    offer_type: '', // Product name
    monthly_value: '', // For continuity
  })

  function toggleSecondaryReason(id) {
    setFormData(prev => ({
      ...prev,
      secondary_reasons: prev.secondary_reasons.includes(id)
        ? prev.secondary_reasons.filter(r => r !== id)
        : [...prev.secondary_reasons, id]
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Auto-set factor flags based on selected reasons
    const allReasons = [formData.primary_reason, ...formData.secondary_reasons]
    const selectedOffer = OFFER_CATEGORIES.find(c => c.id === formData.offer_category)

    const outcomeData = {
      ...formData,
      outcome,
      price_factor: allReasons.includes('price'),
      timing_factor: allReasons.includes('timing'),
      fit_factor: allReasons.includes('fit'),
      // Add offer data for ascension engine
      is_continuity: formData.offer_category === 'continuity',
      is_actual_sale: selectedOffer?.isActualSale ?? true,
    }

    onSave(outcomeData)
  }

  const showContinuityFields = formData.offer_category === 'continuity'

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="deal-outcome-modal" onClick={e => e.stopPropagation()}>
        <div className={`outcome-header ${outcome}`}>
          <span className="outcome-icon">{isWin ? '🎉' : '📊'}</span>
          <h3>{isWin ? 'Deal Won!' : 'Capture the Learning'}</h3>
          <p className="outcome-subtitle">
            {isWin
              ? 'What made them say yes? This helps your AI coach improve.'
              : 'Understanding why helps you win more. Quick analysis:'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="deal-summary">
            <span className="deal-name">{deal.contact_name}</span>
            <span className="deal-value">${deal.value.toLocaleString()}</span>
          </div>

          {/* Offer Category - For wins, determine where they are on the value ladder */}
          {isWin && (
            <div className="form-section">
              <label className="section-label">
                What did they buy? *
              </label>
              <div className="offer-category-grid">
                {OFFER_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    className={`offer-category-btn ${formData.offer_category === category.id ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, offer_category: category.id }))}
                  >
                    <span className="offer-cat-icon">{category.icon}</span>
                    <span className="offer-cat-label">{category.label}</span>
                    <span className="offer-cat-desc">{category.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Name - For wins */}
          {isWin && formData.offer_category && (
            <div className="form-section">
              <label className="section-label">
                Product/Offer Name
              </label>
              <input
                type="text"
                value={formData.offer_type}
                onChange={e => setFormData(prev => ({ ...prev, offer_type: e.target.value }))}
                placeholder="e.g., 6-Week Coaching Program"
              />
            </div>
          )}

          {/* Monthly Value - For continuity */}
          {isWin && showContinuityFields && (
            <div className="form-section">
              <label className="section-label">
                Monthly Recurring Value
              </label>
              <div className="value-input">
                <span className="currency">$</span>
                <input
                  type="number"
                  value={formData.monthly_value}
                  onChange={e => setFormData(prev => ({ ...prev, monthly_value: e.target.value }))}
                  placeholder="297"
                />
                <span className="currency-suffix">/mo</span>
              </div>
            </div>
          )}

          {/* Primary Reason */}
          <div className="form-section">
            <label className="section-label">
              {isWin ? 'Main reason they bought' : 'Primary reason for loss'} *
            </label>
            <div className="reason-grid">
              {reasons.map(reason => (
                <button
                  key={reason.id}
                  type="button"
                  className={`reason-btn ${formData.primary_reason === reason.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, primary_reason: reason.id }))}
                >
                  <span className="reason-label">{reason.label}</span>
                  <span className="reason-desc">{reason.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Reasons */}
          <div className="form-section">
            <label className="section-label">
              Other contributing factors (optional)
            </label>
            <div className="chip-grid">
              {reasons
                .filter(r => r.id !== formData.primary_reason)
                .map(reason => (
                  <button
                    key={reason.id}
                    type="button"
                    className={`chip-btn ${formData.secondary_reasons.includes(reason.id) ? 'selected' : ''}`}
                    onClick={() => toggleSecondaryReason(reason.id)}
                  >
                    {reason.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Win-specific: What sold them */}
          {isWin && (
            <div className="form-section">
              <label className="section-label">
                In their words, what sold them?
              </label>
              <textarea
                value={formData.what_sold_them}
                onChange={e => setFormData(prev => ({ ...prev, what_sold_them: e.target.value }))}
                placeholder="e.g., 'I loved the guarantee' or 'The case study convinced me'"
                rows={2}
              />
            </div>
          )}

          {/* Loss-specific: Competitor */}
          {!isWin && formData.primary_reason === 'competitor' && (
            <div className="form-section">
              <label className="section-label">
                Which competitor?
              </label>
              <input
                type="text"
                value={formData.competitor_mentioned}
                onChange={e => setFormData(prev => ({ ...prev, competitor_mentioned: e.target.value }))}
                placeholder="e.g., Competitor name or 'unknown'"
              />
            </div>
          )}

          {/* Final Value (for wins) */}
          {isWin && (
            <div className="form-section">
              <label className="section-label">
                Final deal value
              </label>
              <div className="value-input">
                <span className="currency">$</span>
                <input
                  type="number"
                  value={formData.final_value}
                  onChange={e => setFormData(prev => ({ ...prev, final_value: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-section">
            <label className="section-label">
              Additional notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={isWin
                ? "Any insights to remember for similar deals..."
                : "What could have been done differently?"}
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Skip
            </button>
            <button
              type="submit"
              className={`save-btn ${outcome}`}
              disabled={!formData.primary_reason || (isWin && !formData.offer_category)}
            >
              {isWin ? 'Save & Celebrate' : 'Save & Learn'}
            </button>
          </div>
        </form>

        <p className="ai-note">
          This data trains your AI to give better recommendations
        </p>
      </div>
    </div>
  )
}
