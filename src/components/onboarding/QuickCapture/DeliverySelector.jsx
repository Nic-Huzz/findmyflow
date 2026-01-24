/**
 * DeliverySelector.jsx
 *
 * Selector for delivery method / product type
 * Maps categories to specific product types from the 7-type taxonomy
 *
 * Props:
 * - selectedCategory: 'service' | 'productized' | 'product' | null
 * - selectedType: The specific product type
 * - onCategorySelect: Callback when category is selected
 * - onTypeSelect: Callback when product type is selected
 * - showCategorySelector: Whether to show category (for products 2+)
 *
 * Created: Jan 2026
 */

import { useState, useMemo } from 'react'
import './DeliverySelector.css'

// Category options for products 2+
export const CATEGORY_OPTIONS = [
  {
    id: 'service',
    label: 'Service',
    description: 'I do the work myself',
    icon: '💼',
    productTypes: ['custom_service', 'packaged_service']
  },
  {
    id: 'productized',
    label: 'Productized',
    description: 'Packaged programs or courses',
    icon: '📦',
    productTypes: ['live_group', 'automated_group', 'managed_service']
  },
  {
    id: 'product',
    label: 'Product',
    description: 'Something they buy from me',
    icon: '🛍️',
    productTypes: ['digital_product'],
    showSubtype: true
  }
]

// Product type details
export const PRODUCT_TYPES = {
  custom_service: {
    id: 'custom_service',
    label: 'Custom Service',
    description: 'Tailored work for each client (1:1)',
    icon: '🎯',
    category: 'service',
    examples: ['Coaching', 'Consulting', 'Freelance work']
  },
  packaged_service: {
    id: 'packaged_service',
    label: 'Packaged Service',
    description: 'Standardized service package',
    icon: '📋',
    category: 'service',
    examples: ['VIP Day', 'Done-for-you package', 'Audit service']
  },
  live_group: {
    id: 'live_group',
    label: 'Live Group',
    description: 'Live cohorts or workshops',
    icon: '👥',
    category: 'productized',
    examples: ['Cohort course', 'Workshop series', 'Mastermind']
  },
  automated_group: {
    id: 'automated_group',
    label: 'Self-Paced Course',
    description: 'Pre-recorded content they access anytime',
    icon: '🎬',
    category: 'productized',
    examples: ['Online course', 'Video training', 'Learning portal']
  },
  managed_service: {
    id: 'managed_service',
    label: 'Managed Service',
    description: 'Done-for-you with ongoing support',
    icon: '⚙️',
    category: 'productized',
    examples: ['Agency retainer', 'Managed service', 'Fractional role']
  },
  digital_product: {
    id: 'digital_product',
    label: 'Product',
    description: 'Something people buy from you',
    icon: '🛍️',
    category: 'product',
    examples: ['Templates', 'Software', 'Physical goods']
  }
}

// Digital product subtypes
export const PRODUCT_SUBTYPES = [
  { id: 'digital', label: 'Digital Download', description: 'Templates, guides, eBooks', icon: '📄' },
  { id: 'software', label: 'Software/App', description: 'SaaS, tools, plugins', icon: '💻' },
  { id: 'physical', label: 'Physical Product', description: 'Shipped goods, merchandise', icon: '📦' }
]

function DeliverySelector({
  selectedCategory,
  selectedType,
  selectedSubtype,
  onCategorySelect,
  onTypeSelect,
  onSubtypeSelect,
  showCategorySelector = false,
  defaultCategory = null
}) {
  const [step, setStep] = useState(
    showCategorySelector ? 'category' : 'type'
  )

  // Get available product types for selected category
  const availableTypes = useMemo(() => {
    if (!selectedCategory && defaultCategory) {
      const category = CATEGORY_OPTIONS.find(c => c.id === defaultCategory)
      return category?.productTypes.map(id => PRODUCT_TYPES[id]) || []
    }
    if (selectedCategory) {
      const category = CATEGORY_OPTIONS.find(c => c.id === selectedCategory)
      return category?.productTypes.map(id => PRODUCT_TYPES[id]) || []
    }
    return Object.values(PRODUCT_TYPES)
  }, [selectedCategory, defaultCategory])

  // Check if subtype needed
  const needsSubtype = selectedType === 'digital_product'

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    onCategorySelect(categoryId)
    setStep('type')
  }

  // Handle type selection
  const handleTypeSelect = (typeId) => {
    onTypeSelect(typeId)
    if (typeId === 'digital_product') {
      setStep('subtype')
    }
  }

  // Category selector step
  if (step === 'category' && showCategorySelector) {
    return (
      <div className="delivery-selector">
        <h3 className="selector-title">What type of offering is this?</h3>
        <p className="selector-subtitle">Choose the category that best fits</p>

        <div className="category-options">
          {CATEGORY_OPTIONS.map(category => (
            <button
              key={category.id}
              className="category-option"
              onClick={() => handleCategorySelect(category.id)}
            >
              <span className="option-icon">{category.icon}</span>
              <span className="option-label">{category.label}</span>
              <span className="option-description">{category.description}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Subtype selector step (for digital products)
  if (step === 'subtype' && needsSubtype) {
    return (
      <div className="delivery-selector">
        <h3 className="selector-title">What kind of product?</h3>
        <p className="selector-subtitle">Help us understand your offering better</p>

        <div className="subtype-options">
          {PRODUCT_SUBTYPES.map(subtype => (
            <button
              key={subtype.id}
              className={`subtype-option ${selectedSubtype === subtype.id ? 'selected' : ''}`}
              onClick={() => onSubtypeSelect(subtype.id)}
            >
              <span className="option-icon">{subtype.icon}</span>
              <span className="option-label">{subtype.label}</span>
              <span className="option-description">{subtype.description}</span>
            </button>
          ))}
        </div>

        <button className="back-button" onClick={() => setStep('type')}>
          Back
        </button>
      </div>
    )
  }

  // Type selector step
  return (
    <div className="delivery-selector">
      <h3 className="selector-title">How do you deliver this?</h3>
      <p className="selector-subtitle">Choose the delivery method</p>

      <div className="type-options">
        {availableTypes.map(type => (
          <button
            key={type.id}
            className={`type-option ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => handleTypeSelect(type.id)}
          >
            <span className="option-icon">{type.icon}</span>
            <div className="option-content">
              <span className="option-label">{type.label}</span>
              <span className="option-description">{type.description}</span>
              <span className="option-examples">
                e.g. {type.examples.join(', ')}
              </span>
            </div>
          </button>
        ))}
      </div>

      {showCategorySelector && (
        <button className="back-button" onClick={() => setStep('category')}>
          Back to categories
        </button>
      )}
    </div>
  )
}

export default DeliverySelector
