/**
 * productsService.js
 *
 * Service for managing products from various flows
 * Products can be created from:
 * - Quick Capture onboarding
 * - Offer Builder flow
 * - Upsell/Downsell/Continuity flows
 * - Manual entry
 *
 * Created: Jan 2026
 */

import { supabase } from './supabaseClient'

// Product type mapping from legacy flow types
const FLOW_TO_PRODUCT_TYPE = {
  attraction_offer: 'custom_service',
  upsell: 'packaged_service',
  downsell: 'packaged_service',
  continuity: 'managed_service',
  lead_magnet: 'digital_product',
  offer_builder: 'packaged_service'
}

// Money model tier mapping from flow types
const FLOW_TO_TIER = {
  attraction_offer: 'attraction',
  upsell: 'upsell',
  downsell: 'downsell',
  continuity: 'continuity',
  lead_magnet: 'attraction',
  offer_builder: 'core'
}

/**
 * Create a product from a flow completion
 * @param {object} params - Product creation params
 * @param {string} params.userId - User ID
 * @param {string} params.flowType - Type of flow (attraction_offer, upsell, etc.)
 * @param {string} params.name - Product name
 * @param {string} params.description - Product description
 * @param {number} params.price - Product price
 * @param {string} params.priceType - Price type (one_time, subscription, per_session)
 * @param {object} params.metadata - Additional metadata from the flow
 * @param {string} params.projectId - Optional project ID
 * @returns {object} Created product or error
 */
export async function createProductFromFlow({
  userId,
  flowType,
  name,
  description,
  price,
  priceType = 'one_time',
  metadata = {},
  projectId = null
}) {
  try {
    const productType = FLOW_TO_PRODUCT_TYPE[flowType] || 'packaged_service'
    const tier = FLOW_TO_TIER[flowType] || 'core'

    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        name,
        description,
        product_type: productType,
        money_model_tier: tier,
        price_amount: price,
        price_type: priceType,
        status: 'active',
        source: flowType,
        project_id: projectId,
        metadata: {
          ...metadata,
          created_from_flow: flowType,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, product: data }
  } catch (error) {
    console.error('Error creating product from flow:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing product
 * @param {string} productId - Product ID
 * @param {string} userId - User ID (for security)
 * @param {object} updates - Fields to update
 */
export async function updateProduct(productId, userId, updates) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, product: data }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all products for a user
 * @param {string} userId - User ID
 * @param {object} options - Filter options
 */
export async function getUserProducts(userId, options = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.tier) {
      query = query.eq('money_model_tier', options.tier)
    }

    if (options.projectId) {
      query = query.eq('project_id', options.projectId)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, products: data || [] }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { success: false, products: [], error: error.message }
  }
}

/**
 * Get products grouped by money model tier
 * @param {string} userId - User ID
 */
export async function getProductsByTier(userId) {
  try {
    const { success, products, error } = await getUserProducts(userId, { status: 'active' })

    if (!success) throw new Error(error)

    const grouped = {
      attraction: products.filter(p => p.money_model_tier === 'attraction'),
      core: products.filter(p => p.money_model_tier === 'core'),
      upsell: products.filter(p => p.money_model_tier === 'upsell'),
      downsell: products.filter(p => p.money_model_tier === 'downsell'),
      continuity: products.filter(p => p.money_model_tier === 'continuity'),
      other: products.filter(p => !p.money_model_tier)
    }

    return { success: true, grouped }
  } catch (error) {
    console.error('Error grouping products by tier:', error)
    return { success: false, grouped: {}, error: error.message }
  }
}

/**
 * Archive a product (soft delete)
 * @param {string} productId - Product ID
 * @param {string} userId - User ID
 */
export async function archiveProduct(productId, userId) {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error archiving product:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calculate total potential revenue from product suite
 * @param {string} userId - User ID
 */
export async function calculateSuiteRevenue(userId) {
  try {
    const { success, products, error } = await getUserProducts(userId, { status: 'active' })

    if (!success) throw new Error(error)

    let oneTimeTotal = 0
    let recurringTotal = 0

    products.forEach(product => {
      if (!product.price_amount) return

      if (product.price_type === 'subscription') {
        recurringTotal += product.price_amount
      } else {
        oneTimeTotal += product.price_amount
      }
    })

    return {
      success: true,
      revenue: {
        oneTimeTotal,
        recurringTotal,
        yearlyRecurring: recurringTotal * 12,
        productCount: products.length
      }
    }
  } catch (error) {
    console.error('Error calculating suite revenue:', error)
    return { success: false, revenue: null, error: error.message }
  }
}

/**
 * Link a flow assessment to a product
 * Used when completing Offer Builder, Upsell, etc.
 * @param {string} productId - Product ID
 * @param {string} assessmentId - Assessment ID
 * @param {string} assessmentType - Type of assessment
 */
export async function linkAssessmentToProduct(productId, userId, assessmentId, assessmentType) {
  try {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('metadata')
      .eq('id', productId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    const updatedMetadata = {
      ...(product.metadata || {}),
      linked_assessments: [
        ...(product.metadata?.linked_assessments || []),
        { id: assessmentId, type: assessmentType, linked_at: new Date().toISOString() }
      ]
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('user_id', userId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error linking assessment to product:', error)
    return { success: false, error: error.message }
  }
}

export default {
  createProductFromFlow,
  updateProduct,
  getUserProducts,
  getProductsByTier,
  archiveProduct,
  calculateSuiteRevenue,
  linkAssessmentToProduct
}
