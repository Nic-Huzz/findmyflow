/**
 * MultiProductCapture.jsx
 *
 * Manages multiple product entries with add/remove functionality
 * First product defaults to category based on wealth ladder rung
 *
 * Props:
 * - wealthLadder: 'service' | 'productized' | 'products'
 * - onComplete: Callback with all products data
 * - onBack: Callback to go back
 *
 * Created: Jan 2026
 */

import { useState, useEffect, useCallback } from 'react'
import ProductCard from './ProductCard'
import { CATEGORY_OPTIONS } from './DeliverySelector'
import './MultiProductCapture.css'

// Map wealth ladder to default category
const WEALTH_LADDER_TO_CATEGORY = {
  service: 'service',
  productized: 'productized',
  products: 'product'
}

// Default empty product
const createEmptyProduct = (index, defaultCategory = null) => ({
  id: `product_${Date.now()}_${index}`,
  category: defaultCategory,
  productType: null,
  productSubtype: null,
  name: '',
  description: '',
  tier: null,
  priceType: null,
  price: '',
  step: defaultCategory ? 'type' : 'category'
})

function MultiProductCapture({
  wealthLadder,
  onComplete,
  onBack,
  userId,
  storageKeyPrefix = 'quick_capture_products'
}) {
  // Default category based on wealth ladder
  const defaultCategory = WEALTH_LADDER_TO_CATEGORY[wealthLadder] || null

  // Load saved products from localStorage or create default
  const loadSavedProducts = () => {
    if (userId) {
      const saved = localStorage.getItem(`${storageKeyPrefix}_${userId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.products && parsed.products.length > 0) {
            return parsed.products
          }
        } catch (e) {
          console.error('Error loading saved products:', e)
        }
      }
    }
    return [createEmptyProduct(0, defaultCategory)]
  }

  // Products state
  const [products, setProducts] = useState(loadSavedProducts)

  // Save products to localStorage whenever they change
  const saveProductsToStorage = useCallback((productsData) => {
    if (userId) {
      localStorage.setItem(
        `${storageKeyPrefix}_${userId}`,
        JSON.stringify({ products: productsData, timestamp: Date.now() })
      )
    }
  }, [userId, storageKeyPrefix])

  // Save whenever products change
  useEffect(() => {
    saveProductsToStorage(products)
  }, [products, saveProductsToStorage])

  // Get completed products count
  const completedCount = products.filter(p => p.step === 'complete').length
  const hasAtLeastOne = completedCount > 0

  // Update a product
  const handleUpdateProduct = (index, updatedProduct) => {
    const newProducts = [...products]
    newProducts[index] = updatedProduct
    setProducts(newProducts)
  }

  // Remove a product
  const handleRemoveProduct = (index) => {
    if (products.length > 1) {
      const newProducts = products.filter((_, i) => i !== index)
      setProducts(newProducts)
    }
  }

  // Add a new product
  const handleAddProduct = () => {
    setProducts([
      ...products,
      createEmptyProduct(products.length, null) // No default category for additional products
    ])
  }

  // Complete capture
  const handleComplete = () => {
    // Filter to only completed products
    const completedProducts = products.filter(p => p.step === 'complete')
    // Clear localStorage on successful completion
    if (userId) {
      localStorage.removeItem(`${storageKeyPrefix}_${userId}`)
    }
    onComplete(completedProducts)
  }

  // Get category display for header
  const getCategoryDisplay = () => {
    if (!defaultCategory) return null
    const category = CATEGORY_OPTIONS.find(c => c.id === defaultCategory)
    return category ? `${category.icon} ${category.label}` : null
  }

  return (
    <div className="multi-product-capture">
      <div className="capture-header">
        <h2 className="capture-title">Your Products & Services</h2>
        <p className="capture-subtitle">
          {defaultCategory ? (
            <>
              Starting with your <span className="category-badge">{getCategoryDisplay()}</span> offering
            </>
          ) : (
            'Tell us about what you sell'
          )}
        </p>
      </div>

      <div className="products-list">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            isFirst={index === 0}
            defaultCategory={index === 0 ? defaultCategory : null}
            onUpdate={(updated) => handleUpdateProduct(index, updated)}
            onRemove={products.length > 1 ? () => handleRemoveProduct(index) : null}
          />
        ))}
      </div>

      {/* Add another product button */}
      <button
        className="add-product-btn"
        onClick={handleAddProduct}
      >
        <span className="add-icon">+</span>
        Add another offering
      </button>

      {/* Progress & Actions */}
      <div className="capture-footer">
        <div className="products-summary">
          {completedCount > 0 && (
            <span className="completed-badge">
              {completedCount} product{completedCount !== 1 ? 's' : ''} captured
            </span>
          )}
        </div>

        <div className="capture-actions">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              Back
            </button>
          )}
          <button
            className="continue-btn"
            disabled={!hasAtLeastOne}
            onClick={handleComplete}
          >
            {hasAtLeastOne ? 'Continue' : 'Complete at least 1 product'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MultiProductCapture
