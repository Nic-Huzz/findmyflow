/**
 * ProductCard.jsx
 *
 * Individual product entry card for Quick Capture
 * Captures: name, description, type, tier, price
 *
 * Props:
 * - product: Product data object
 * - index: Product index (0-based)
 * - isFirst: Whether this is the first product
 * - defaultCategory: Default category based on wealth ladder
 * - onUpdate: Callback when product data changes
 * - onRemove: Callback to remove this product
 *
 * Created: Jan 2026
 */

import { useState } from 'react'
import DeliverySelector, { PRODUCT_TYPES, PRODUCT_SUBTYPES } from './DeliverySelector'
import './ProductCard.css'

// Money model tier options
const TIER_OPTIONS = [
  { id: 'attraction', label: 'Attraction', description: 'Free or low-cost to attract leads', icon: '🧲' },
  { id: 'core', label: 'Core', description: 'Your main offering', icon: '⭐' },
  { id: 'upsell', label: 'Upsell', description: 'Higher-value add-on', icon: '📈' },
  { id: 'downsell', label: 'Downsell', description: 'Lower-cost alternative', icon: '📉' },
  { id: 'continuity', label: 'Continuity', description: 'Recurring subscription', icon: '🔄' }
]

// Price type options
const PRICE_TYPE_OPTIONS = [
  { id: 'one_time', label: 'One-time', description: 'Single payment' },
  { id: 'per_session', label: 'Per session', description: 'Pay per use' },
  { id: 'subscription', label: 'Subscription', description: 'Recurring' }
]

// Product stage options (maps to STAGES in stageConfig.js)
const STAGE_OPTIONS = [
  { id: 1, label: "Just an idea", description: "Haven't sold it yet", icon: '💡' },
  { id: 2, label: "Sold a few times", description: "Proving it works", icon: '🌱' },
  { id: 4, label: "Getting consistent customers", description: "Building momentum", icon: '📈' },
  { id: 6, label: "Established", description: "Ready to scale", icon: '🚀' },
  { id: 7, label: "Scaling & optimizing", description: "Growing fast", icon: '⚡' }
]

function ProductCard({
  product,
  index,
  isFirst,
  defaultCategory,
  onUpdate,
  onRemove
}) {
  const [currentStep, setCurrentStep] = useState(product.step || 'basics')
  const [isExpanded, setIsExpanded] = useState(true)

  // Update field
  const updateField = (field, value) => {
    onUpdate({ ...product, [field]: value })
  }

  // Get product type display
  const getTypeDisplay = () => {
    if (!product.productType) return null
    const type = PRODUCT_TYPES[product.productType]
    return type ? `${type.icon} ${type.label}` : product.productType
  }

  // Get tier display
  const getTierDisplay = () => {
    if (!product.tier) return null
    const tier = TIER_OPTIONS.find(t => t.id === product.tier)
    return tier ? `${tier.icon} ${tier.label}` : product.tier
  }

  // Collapsed view (for completed products)
  if (!isExpanded && product.name) {
    return (
      <div className="qc-product-card collapsed" onClick={() => setIsExpanded(true)}>
        <div className="product-summary">
          <span className="product-number">#{index + 1}</span>
          <div className="product-info">
            <span className="product-name">{product.name}</span>
            <span className="product-meta">
              {getTypeDisplay()} {getTierDisplay() && `• ${getTierDisplay()}`}
            </span>
          </div>
          <button className="expand-button">Edit</button>
        </div>
      </div>
    )
  }

  // STEP: Category selection (for products 2+ or first product with no default category)
  if (currentStep === 'category' && (!isFirst || !defaultCategory)) {
    return (
      <div className="qc-product-card">
        <div className="product-header">
          <span className="product-number">Product #{index + 1}</span>
          {onRemove && (
            <button className="remove-button" onClick={onRemove}>&times;</button>
          )}
        </div>

        <DeliverySelector
          showCategorySelector={true}
          selectedCategory={product.category}
          selectedType={product.productType}
          selectedSubtype={product.productSubtype}
          onCategorySelect={(cat) => {
            updateField('category', cat)
            setCurrentStep('type')
          }}
          onTypeSelect={(type) => updateField('productType', type)}
          onSubtypeSelect={(subtype) => {
            updateField('productSubtype', subtype)
            setCurrentStep('basics')
          }}
        />
      </div>
    )
  }

  // STEP: Type selection
  if (currentStep === 'type') {
    return (
      <div className="qc-product-card">
        <div className="product-header">
          <span className="product-number">Product #{index + 1}</span>
          {onRemove && (
            <button className="remove-button" onClick={onRemove}>&times;</button>
          )}
        </div>

        <DeliverySelector
          showCategorySelector={!isFirst || !defaultCategory}
          defaultCategory={isFirst ? defaultCategory : product.category}
          selectedCategory={product.category}
          selectedType={product.productType}
          selectedSubtype={product.productSubtype}
          onCategorySelect={(cat) => updateField('category', cat)}
          onTypeSelect={(type) => {
            updateField('productType', type)
            if (type !== 'digital_product') {
              setCurrentStep('basics')
            }
          }}
          onSubtypeSelect={(subtype) => {
            updateField('productSubtype', subtype)
            setCurrentStep('basics')
          }}
        />
      </div>
    )
  }

  // STEP: Basics (name, description)
  if (currentStep === 'basics') {
    return (
      <div className="qc-product-card">
        <div className="product-header">
          <span className="product-number">Product #{index + 1}</span>
          {onRemove && (
            <button className="remove-button" onClick={onRemove}>&times;</button>
          )}
        </div>

        {getTypeDisplay() && (
          <div className="type-badge" onClick={() => setCurrentStep('type')}>
            {getTypeDisplay()}
            <span className="change-link">Change</span>
          </div>
        )}

        <div className="form-group">
          <label>Name your offering</label>
          <input
            type="text"
            placeholder="e.g. 1:1 Coaching, Business Accelerator"
            value={product.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>One-line description (optional)</label>
          <input
            type="text"
            placeholder="What does someone get?"
            value={product.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>

        <div className="step-actions">
          {!product.productType && (
            <button className="back-btn" onClick={() => setCurrentStep('type')}>
              Back
            </button>
          )}
          <button
            className="next-btn"
            disabled={!product.name}
            onClick={() => setCurrentStep('tier')}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // STEP: Tier selection
  if (currentStep === 'tier') {
    return (
      <div className="qc-product-card">
        <div className="product-header">
          <span className="product-number">Product #{index + 1}: {product.name}</span>
          {onRemove && (
            <button className="remove-button" onClick={onRemove}>&times;</button>
          )}
        </div>

        <h4 className="step-title">Where does this fit in your suite?</h4>
        <p className="step-subtitle">This helps us understand your product ladder</p>

        <div className="tier-options">
          {TIER_OPTIONS.map(tier => (
            <button
              key={tier.id}
              className={`tier-option ${product.tier === tier.id ? 'selected' : ''}`}
              onClick={() => updateField('tier', tier.id)}
            >
              <span className="tier-icon">{tier.icon}</span>
              <span className="tier-label">{tier.label}</span>
              <span className="tier-description">{tier.description}</span>
            </button>
          ))}
        </div>

        <div className="step-actions">
          <button className="back-btn" onClick={() => setCurrentStep('basics')}>
            Back
          </button>
          <button
            className="next-btn"
            disabled={!product.tier}
            onClick={() => setCurrentStep('pricing')}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // STEP: Pricing
  if (currentStep === 'pricing') {
    return (
      <div className="qc-product-card">
        <div className="product-header">
          <span className="product-number">Product #{index + 1}: {product.name}</span>
          {onRemove && (
            <button className="remove-button" onClick={onRemove}>&times;</button>
          )}
        </div>

        <h4 className="step-title">Pricing (optional)</h4>
        <p className="step-subtitle">You can update this later</p>

        <div className="price-type-row">
          {PRICE_TYPE_OPTIONS.map(type => (
            <button
              key={type.id}
              className={`price-type-btn ${product.priceType === type.id ? 'selected' : ''}`}
              onClick={() => updateField('priceType', type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label>Price</label>
          <div className="price-input-wrapper">
            <span className="currency">$</span>
            <input
              type="number"
              placeholder="0"
              value={product.price || ''}
              onChange={(e) => updateField('price', e.target.value)}
            />
          </div>
        </div>

        <div className="step-actions">
          <button className="back-btn" onClick={() => setCurrentStep('tier')}>
            Back
          </button>
          <button
            className="next-btn"
            onClick={() => setCurrentStep('stage')}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // STEP: Stage selection
  if (currentStep === 'stage') {
    return (
      <div className="qc-product-card">
        <div className="product-header">
          <span className="product-number">Product #{index + 1}: {product.name}</span>
          {onRemove && (
            <button className="remove-button" onClick={onRemove}>&times;</button>
          )}
        </div>

        <h4 className="step-title">Where is this product at?</h4>
        <p className="step-subtitle">This helps us show you the right next steps</p>

        <div className="stage-options">
          {STAGE_OPTIONS.map(stage => (
            <button
              key={stage.id}
              className={`stage-option ${product.stage === stage.id ? 'selected' : ''}`}
              onClick={() => updateField('stage', stage.id)}
            >
              <span className="stage-icon">{stage.icon}</span>
              <div className="stage-text">
                <span className="stage-label">{stage.label}</span>
                <span className="stage-description">{stage.description}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="step-actions">
          <button className="back-btn" onClick={() => setCurrentStep('pricing')}>
            Back
          </button>
          <button
            className="next-btn done"
            disabled={!product.stage}
            onClick={() => {
              updateField('step', 'complete')
              setIsExpanded(false)
            }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  // Default: show type selector
  return (
    <div className="qc-product-card">
      <div className="product-header">
        <span className="product-number">Product #{index + 1}</span>
        {onRemove && (
          <button className="remove-button" onClick={onRemove}>&times;</button>
        )}
      </div>

      <DeliverySelector
        showCategorySelector={!isFirst}
        defaultCategory={isFirst ? defaultCategory : null}
        selectedCategory={product.category}
        selectedType={product.productType}
        selectedSubtype={product.productSubtype}
        onCategorySelect={(cat) => updateField('category', cat)}
        onTypeSelect={(type) => {
          updateField('productType', type)
          if (type !== 'digital_product') {
            setCurrentStep('basics')
          }
        }}
        onSubtypeSelect={(subtype) => {
          updateField('productSubtype', subtype)
          setCurrentStep('basics')
        }}
      />
    </div>
  )
}

export default ProductCard
