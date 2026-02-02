/**
 * productRelationships.js
 *
 * Service for managing product relationships (upsells, downsells, continuity, etc.)
 * Products can be linked to show how they connect in the user's funnel.
 *
 * Relationship types:
 * - upsell: from (core) → to (upsell product)
 * - downsell: from (core) → to (downsell product)
 * - continuity: from (core) → to (subscription/continuity product)
 * - lead_magnet: from (lead magnet) → to (product it feeds into)
 * - leads_to: general funnel flow (e.g., workshop → app)
 *
 * Created: Feb 2026
 */

import { supabase } from './supabaseClient'

// Valid relationship types
export const RELATIONSHIP_TYPES = {
  UPSELL: 'upsell',
  DOWNSELL: 'downsell',
  CONTINUITY: 'continuity',
  LEAD_MAGNET: 'lead_magnet',
  LEADS_TO: 'leads_to'
}

// Human-readable labels for relationship types
export const RELATIONSHIP_LABELS = {
  upsell: 'Upsell',
  downsell: 'Downsell',
  continuity: 'Continuity',
  lead_magnet: 'Lead Magnet',
  leads_to: 'Leads To'
}

// Relationship type descriptions
export const RELATIONSHIP_DESCRIPTIONS = {
  upsell: 'A higher-value offer for customers who want more',
  downsell: 'A lower-value alternative for hesitant buyers',
  continuity: 'Ongoing subscription or membership',
  lead_magnet: 'Free value that attracts people to this product',
  leads_to: 'Feeds customers into this product'
}

/**
 * Create a relationship between two products
 * @param {string} fromProductId - The source product ID
 * @param {string} toProductId - The target product ID
 * @param {string} relationshipType - One of RELATIONSHIP_TYPES
 * @param {string} sourceFlow - Where this relationship was created (e.g., 'upsell_flow', 'manual')
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createRelationship(fromProductId, toProductId, relationshipType, sourceFlow = 'manual') {
  try {
    // Validate relationship type
    if (!Object.values(RELATIONSHIP_TYPES).includes(relationshipType)) {
      return { success: false, error: `Invalid relationship type: ${relationshipType}` }
    }

    // Prevent self-reference
    if (fromProductId === toProductId) {
      return { success: false, error: 'A product cannot have a relationship with itself' }
    }

    const { data, error } = await supabase
      .from('product_relationships')
      .upsert({
        from_product_id: fromProductId,
        to_product_id: toProductId,
        relationship_type: relationshipType,
        source_flow: sourceFlow
      }, {
        onConflict: 'from_product_id,to_product_id,relationship_type'
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating product relationship:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a relationship between two products
 * @param {string} fromProductId - The source product ID
 * @param {string} toProductId - The target product ID
 * @param {string} relationshipType - The type of relationship to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteRelationship(fromProductId, toProductId, relationshipType) {
  try {
    const { error } = await supabase
      .from('product_relationships')
      .delete()
      .eq('from_product_id', fromProductId)
      .eq('to_product_id', toProductId)
      .eq('relationship_type', relationshipType)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting product relationship:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a relationship by ID
 * @param {string} relationshipId - The relationship ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteRelationshipById(relationshipId) {
  try {
    const { error } = await supabase
      .from('product_relationships')
      .delete()
      .eq('id', relationshipId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting product relationship:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all relationships for a product (both directions)
 * @param {string} productId - The product ID
 * @returns {Promise<{success: boolean, relationships?: object, error?: string}>}
 */
export async function getProductRelationships(productId) {
  try {
    const { data, error } = await supabase
      .from('product_relationships')
      .select(`
        *,
        from_product:from_product_id(id, name, money_model_tier, status),
        to_product:to_product_id(id, name, money_model_tier, status)
      `)
      .or(`from_product_id.eq.${productId},to_product_id.eq.${productId}`)

    if (error) throw error

    // Separate into outgoing and incoming
    const outgoing = data.filter(r => r.from_product_id === productId)
    const incoming = data.filter(r => r.to_product_id === productId)

    return {
      success: true,
      relationships: {
        all: data,
        outgoing, // This product → other products
        incoming  // Other products → this product
      }
    }
  } catch (error) {
    console.error('Error fetching product relationships:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get products related to a product by a specific relationship type
 * @param {string} productId - The source product ID
 * @param {string} relationshipType - The type of relationship
 * @returns {Promise<{success: boolean, products?: array, error?: string}>}
 */
export async function getRelatedProducts(productId, relationshipType) {
  try {
    const { data, error } = await supabase
      .from('product_relationships')
      .select(`
        to_product:to_product_id(id, name, description, money_model_tier, status, price_amount)
      `)
      .eq('from_product_id', productId)
      .eq('relationship_type', relationshipType)

    if (error) throw error

    return {
      success: true,
      products: data?.map(r => r.to_product).filter(Boolean) || []
    }
  } catch (error) {
    console.error('Error fetching related products:', error)
    return { success: false, products: [], error: error.message }
  }
}

/**
 * Get upsells for a product
 * @param {string} productId - The core product ID
 * @returns {Promise<{success: boolean, products?: array, error?: string}>}
 */
export async function getUpsells(productId) {
  return getRelatedProducts(productId, RELATIONSHIP_TYPES.UPSELL)
}

/**
 * Get downsells for a product
 * @param {string} productId - The core product ID
 * @returns {Promise<{success: boolean, products?: array, error?: string}>}
 */
export async function getDownsells(productId) {
  return getRelatedProducts(productId, RELATIONSHIP_TYPES.DOWNSELL)
}

/**
 * Get continuity offers for a product
 * @param {string} productId - The core product ID
 * @returns {Promise<{success: boolean, products?: array, error?: string}>}
 */
export async function getContinuityOffers(productId) {
  return getRelatedProducts(productId, RELATIONSHIP_TYPES.CONTINUITY)
}

/**
 * Get lead magnets that feed into a product
 * @param {string} productId - The target product ID
 * @returns {Promise<{success: boolean, products?: array, error?: string}>}
 */
export async function getLeadMagnets(productId) {
  try {
    const { data, error } = await supabase
      .from('product_relationships')
      .select(`
        from_product:from_product_id(id, name, description, money_model_tier, status)
      `)
      .eq('to_product_id', productId)
      .eq('relationship_type', RELATIONSHIP_TYPES.LEAD_MAGNET)

    if (error) throw error

    return {
      success: true,
      products: data?.map(r => r.from_product).filter(Boolean) || []
    }
  } catch (error) {
    console.error('Error fetching lead magnets:', error)
    return { success: false, products: [], error: error.message }
  }
}

/**
 * Get what products feed into this product (leads_to relationships)
 * @param {string} productId - The target product ID
 * @returns {Promise<{success: boolean, products?: array, error?: string}>}
 */
export async function getProductsThatLeadTo(productId) {
  try {
    const { data, error } = await supabase
      .from('product_relationships')
      .select(`
        from_product:from_product_id(id, name, description, money_model_tier, status)
      `)
      .eq('to_product_id', productId)
      .eq('relationship_type', RELATIONSHIP_TYPES.LEADS_TO)

    if (error) throw error

    return {
      success: true,
      products: data?.map(r => r.from_product).filter(Boolean) || []
    }
  } catch (error) {
    console.error('Error fetching feeder products:', error)
    return { success: false, products: [], error: error.message }
  }
}

/**
 * Get the full product suite for a user with all relationships
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, suite?: object, error?: string}>}
 */
export async function getProductSuite(userId) {
  try {
    // Get all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (productsError) throw productsError

    if (!products || products.length === 0) {
      return { success: true, suite: { products: [], relationships: [], graph: {} } }
    }

    const productIds = products.map(p => p.id)

    // Get all relationships between these products
    const { data: relationships, error: relError } = await supabase
      .from('product_relationships')
      .select('*')
      .or(`from_product_id.in.(${productIds.join(',')}),to_product_id.in.(${productIds.join(',')})`)

    if (relError) throw relError

    // Build a graph representation for easy traversal
    const graph = {}
    products.forEach(p => {
      graph[p.id] = {
        product: p,
        upsells: [],
        downsells: [],
        continuity: [],
        leadMagnets: [],
        leadsTo: [],
        fedBy: [] // Products that lead to this one
      }
    })

    // Populate graph with relationships
    relationships?.forEach(rel => {
      const fromNode = graph[rel.from_product_id]
      const toNode = graph[rel.to_product_id]

      if (fromNode && toNode) {
        switch (rel.relationship_type) {
          case RELATIONSHIP_TYPES.UPSELL:
            fromNode.upsells.push(rel.to_product_id)
            break
          case RELATIONSHIP_TYPES.DOWNSELL:
            fromNode.downsells.push(rel.to_product_id)
            break
          case RELATIONSHIP_TYPES.CONTINUITY:
            fromNode.continuity.push(rel.to_product_id)
            break
          case RELATIONSHIP_TYPES.LEAD_MAGNET:
            toNode.leadMagnets.push(rel.from_product_id)
            break
          case RELATIONSHIP_TYPES.LEADS_TO:
            fromNode.leadsTo.push(rel.to_product_id)
            toNode.fedBy.push(rel.from_product_id)
            break
        }
      }
    })

    return {
      success: true,
      suite: {
        products,
        relationships: relationships || [],
        graph
      }
    }
  } catch (error) {
    console.error('Error fetching product suite:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if a relationship exists
 * @param {string} fromProductId - The source product ID
 * @param {string} toProductId - The target product ID
 * @param {string} relationshipType - The type of relationship
 * @returns {Promise<{success: boolean, exists?: boolean, error?: string}>}
 */
export async function relationshipExists(fromProductId, toProductId, relationshipType) {
  try {
    const { data, error } = await supabase
      .from('product_relationships')
      .select('id')
      .eq('from_product_id', fromProductId)
      .eq('to_product_id', toProductId)
      .eq('relationship_type', relationshipType)
      .maybeSingle()

    if (error) throw error

    return { success: true, exists: !!data }
  } catch (error) {
    console.error('Error checking relationship existence:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all products that could be linked (for dropdown selection)
 * Excludes the current product and optionally filters by tier
 * @param {string} userId - The user ID
 * @param {string} excludeProductId - Product ID to exclude from results
 * @param {string} tierFilter - Optional filter by money_model_tier
 * @returns {Promise<{success: boolean, products?: array, error?: string}>}
 */
export async function getLinkableProducts(userId, excludeProductId = null, tierFilter = null) {
  try {
    let query = supabase
      .from('products')
      .select('id, name, description, money_model_tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (excludeProductId) {
      query = query.neq('id', excludeProductId)
    }

    if (tierFilter) {
      query = query.eq('money_model_tier', tierFilter)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, products: data || [] }
  } catch (error) {
    console.error('Error fetching linkable products:', error)
    return { success: false, products: [], error: error.message }
  }
}

export default {
  RELATIONSHIP_TYPES,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_DESCRIPTIONS,
  createRelationship,
  deleteRelationship,
  deleteRelationshipById,
  getProductRelationships,
  getRelatedProducts,
  getUpsells,
  getDownsells,
  getContinuityOffers,
  getLeadMagnets,
  getProductsThatLeadTo,
  getProductSuite,
  relationshipExists,
  getLinkableProducts
}
