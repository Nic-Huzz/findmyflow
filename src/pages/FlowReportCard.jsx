/**
 * FlowReportCard.jsx
 *
 * Personal Flow Report Card - Shows user's flow profile at a glance
 * Replaces/enhances LibraryOfAnswers for Onboarding V2 users
 *
 * Sections:
 * 1. Hero - Persona + Wealth Ladder position + Guidance Focus
 * 2. Flow Finder wheels (Skills, Problems, Personas)
 * 3. Product Suite - Products from products table
 * 4. Quick actions
 *
 * Created: Jan 2026
 * Updated: Jan 2026 - Fixed data fetching for V1 users using cluster data
 */

import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { GradientWheel } from '../components/CompetenceWheels'
import {
  SKILLS_SEGMENTS,
  PROFICIENCY_RINGS,
  PROBLEM_SEGMENTS,
  PROBLEMS_PROFICIENCY_RINGS,
  PERSONA_SEGMENTS,
  JOURNEY_STAGES
} from '../lib/wheelTaxonomy'
import {
  PERSONA_DISPLAY,
  WEALTH_LADDER_DISPLAY,
  EMPHASIS_CONFIG
} from '../lib/onboardingV2'
import './FlowReportCard.css'

// Try to import PRODUCT_TYPES, fallback if not available
let PRODUCT_TYPES = {}
try {
  const deliverySelector = require('../components/onboarding/QuickCapture/DeliverySelector')
  PRODUCT_TYPES = deliverySelector.PRODUCT_TYPES || {}
} catch (e) {
  console.warn('DeliverySelector not available, using fallback PRODUCT_TYPES')
  PRODUCT_TYPES = {
    custom_service: { label: '1:1 Service', icon: '👤' },
    packaged_service: { label: 'Package', icon: '📦' },
    live_group: { label: 'Live Group', icon: '🎯' },
    automated_group: { label: 'Course', icon: '📚' },
    digital_product: { label: 'Digital Product', icon: '💾' }
  }
}

// Money model tier display info
const TIER_DISPLAY = {
  attraction: { label: 'Attraction', icon: '🧲', color: '#10B981' },
  core: { label: 'Core', icon: '⭐', color: '#F59E0B' },
  upsell: { label: 'Upsell', icon: '📈', color: '#8B5CF6' },
  downsell: { label: 'Downsell', icon: '📉', color: '#6366F1' },
  continuity: { label: 'Continuity', icon: '🔄', color: '#EC4899' }
}

// ============================================================================
// CLUSTER TO WHEEL MAPPING (same as LibraryOfAnswers)
// ============================================================================

// Map cluster labels to wheel segment indices for Skills
const mapClusterToSegments = (clusterLabel) => {
  const labelLower = clusterLabel.toLowerCase()
  const segmentMappings = {
    clarifying: [0], explaining: [0], teaching: [0], translating: [0],
    analyzing: [1], analysis: [1], data: [1], patterns: [1], research: [1],
    strategizing: [2], strategy: [2], planning: [2], vision: [2],
    organizing: [3], systems: [3], operations: [3], processes: [3],
    building: [4], making: [4], engineering: [4], coding: [4], developing: [4],
    designing: [5], design: [5], ux: [5], visual: [5], aesthetic: [5],
    creating: [6], creative: [6], art: [6], writing: [6], ideation: [6],
    expressing: [7], storytelling: [7], presenting: [7], speaking: [7],
    connecting: [8], networking: [8], collaboration: [8], facilitating: [8],
    influencing: [9], sales: [9], persuading: [9], motivating: [9],
    nurturing: [10], coaching: [10], mentoring: [10], supporting: [10],
    synthesizing: [11], integrating: [11], wisdom: [11], 'big picture': [11],
    'problem solving': [1, 2], 'problem-solving': [1, 2],
    'team building': [8, 10], leadership: [2, 9],
    communication: [0, 7], 'project management': [2, 3],
    innovation: [4, 6], entrepreneurship: [2, 4, 9],
    learning: [0, 6], experience: [5, 6], engagement: [8, 9],
    community: [8, 10], healing: [10, 11], growth: [10, 11],
    playful: [6, 8], interaction: [7, 8], performance: [7, 9],
  }
  const matchedSegments = new Set()
  Object.entries(segmentMappings).forEach(([keyword, indices]) => {
    if (labelLower.includes(keyword)) {
      indices.forEach(i => matchedSegments.add(i))
    }
  })
  return matchedSegments.size > 0 ? Array.from(matchedSegments) : [0]
}

// Map cluster labels to wheel segment indices for Problems
const mapProblemClusterToSegments = (clusterLabel) => {
  const labelLower = clusterLabel.toLowerCase()
  const segmentMappings = {
    health: [0], fitness: [0], body: [0], energy: [0], sleep: [0], nutrition: [0],
    anxiety: [1], stress: [1], mindset: [1], mental: [1], emotions: [1], burnout: [1],
    skills: [2], productivity: [2], habits: [2], growth: [2], learning: [2],
    relationship: [3], family: [3], parenting: [3], love: [3], marriage: [3],
    caregiving: [4], disability: [4], healthcare: [4], support: [4],
    art: [5], creativity: [5], voice: [5], expression: [5], identity: [5],
    team: [6], organization: [6], community: [6], workplace: [6], culture: [6],
    movement: [7], belonging: [7], trends: [7], social: [7],
    money: [8], business: [8], career: [8], income: [8], financial: [8], freedom: [8],
    inequality: [9], discrimination: [9], rights: [9], fairness: [9], advocacy: [9],
    climate: [10], environment: [10], sustainability: [10], planet: [10],
    technology: [11], innovation: [11], future: [11], education: [11],
  }
  const matchedSegments = new Set()
  Object.entries(segmentMappings).forEach(([keyword, indices]) => {
    if (labelLower.includes(keyword)) {
      indices.forEach(i => matchedSegments.add(i))
    }
  })
  return matchedSegments.size > 0 ? Array.from(matchedSegments) : [0]
}

// Map cluster labels to wheel segment indices for Personas
const mapPersonaClusterToSegments = (clusterLabel) => {
  const labelLower = clusterLabel.toLowerCase()
  const segmentMappings = {
    seeker: [0], lost: [0], direction: [0], purpose: [0], meaning: [0], clarity: [0],
    builder: [1], creating: [1], building: [1], entrepreneur: [1], starting: [1],
    healer: [2], healing: [2], trauma: [2], pain: [2], suffering: [2], recovery: [2],
    teacher: [3], learning: [3], growing: [3], knowledge: [3], education: [3],
    connector: [4], lonely: [4], isolated: [4], community: [4], belonging: [4],
    achiever: [5], success: [5], winning: [5], status: [5], ambitious: [5],
    explorer: [6], freedom: [6], adventure: [6], autonomy: [6], travel: [6],
    visionary: [7], future: [7], change: [7], innovation: [7], transformation: [7],
    protector: [8], security: [8], safety: [8], stability: [8], risk: [8],
    creator: [9], expression: [9], art: [9], originality: [9], voice: [9],
    nurturer: [10], family: [10], caring: [10], devoted: [10], children: [10],
    challenger: [11], injustice: [11], disruption: [11], truth: [11], advocacy: [11],
  }
  const matchedSegments = new Set()
  Object.entries(segmentMappings).forEach(([keyword, indices]) => {
    if (labelLower.includes(keyword)) {
      indices.forEach(i => matchedSegments.add(i))
    }
  })
  return matchedSegments.size > 0 ? Array.from(matchedSegments) : [0]
}

// Get ring index from proficiency rating
const getRingForProficiency = (rating) => {
  switch (rating) {
    case 'emerging': return 0
    case 'establishing': return 1
    case 'mastering': return 2
    default: return 1
  }
}

const getRingForProblemProficiency = (rating) => {
  switch (rating) {
    case 'exploring': return 0
    case 'pursuing': return 1
    case 'proven': return 2
    default: return 1
  }
}

const getRingForJourneyStage = (stage) => {
  switch (stage) {
    case 'awakening': return 0
    case 'struggling': return 1
    case 'ready': return 2
    default: return 1
  }
}

function FlowReportCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // User profile data
  const [userProfile, setUserProfile] = useState(null)

  // Flow Finder cluster data (from nikigai_clusters)
  const [skillsClusters, setSkillsClusters] = useState([])
  const [problemsClusters, setProblemsClusters] = useState([])
  const [personaClusters, setPersonaClusters] = useState([])

  // Products
  const [products, setProducts] = useState([])

  // Money Model assessments
  const [offers, setOffers] = useState([])

  // Active wheel tab
  const [activeWheel, setActiveWheel] = useState('skills')

  // Add hue values to segments for wheel rendering
  const skillsWithHue = useMemo(() =>
    SKILLS_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  const problemsWithHue = useMemo(() =>
    PROBLEM_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  const personasWithHue = useMemo(() =>
    PERSONA_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  // Calculate lit cells from clusters (same logic as LibraryOfAnswers)
  const skillsLitCells = useMemo(() => {
    if (skillsClusters.length === 0) return new Set()
    const newLitCells = new Set()

    skillsClusters.forEach(cluster => {
      const segmentIndices = mapClusterToSegments(cluster.cluster_label)
      const items = cluster.items || []
      const hasRatings = items.length > 0 && typeof items[0] === 'object' && items[0].rating

      if (hasRatings) {
        const proficiencyCounts = { emerging: 0, establishing: 0, mastering: 0 }
        items.forEach(item => {
          if (item.rating) proficiencyCounts[item.rating]++
        })

        let dominantProficiency = 'establishing'
        let maxCount = 0
        Object.entries(proficiencyCounts).forEach(([level, count]) => {
          if (count > maxCount) {
            maxCount = count
            dominantProficiency = level
          }
        })

        const ringIdx = getRingForProficiency(dominantProficiency)
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      } else {
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-1`)
        })
      }
    })

    return newLitCells
  }, [skillsClusters])

  const problemsLitCells = useMemo(() => {
    if (problemsClusters.length === 0) return new Set()
    const newLitCells = new Set()

    problemsClusters.forEach(cluster => {
      const segmentIndices = mapProblemClusterToSegments(cluster.cluster_label)
      const items = cluster.items || []
      const hasRatings = items.length > 0 && typeof items[0] === 'object' && items[0].rating

      if (hasRatings) {
        const proficiencyCounts = { exploring: 0, pursuing: 0, proven: 0 }
        items.forEach(item => {
          if (item.rating) proficiencyCounts[item.rating]++
        })

        let dominantProficiency = 'pursuing'
        let maxCount = 0
        Object.entries(proficiencyCounts).forEach(([level, count]) => {
          if (count > maxCount) {
            maxCount = count
            dominantProficiency = level
          }
        })

        const ringIdx = getRingForProblemProficiency(dominantProficiency)
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      } else {
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-1`)
        })
      }
    })

    return newLitCells
  }, [problemsClusters])

  const personasLitCells = useMemo(() => {
    if (personaClusters.length === 0) return new Set()
    const newLitCells = new Set()

    personaClusters.forEach(cluster => {
      const segmentIndices = mapPersonaClusterToSegments(cluster.cluster_label)
      const items = cluster.items || []
      const hasStage = items.length > 0 && typeof items[0] === 'object' && items[0].journeyStage

      if (hasStage) {
        const journeyStage = items[0].journeyStage || 'struggling'
        const ringIdx = getRingForJourneyStage(journeyStage)
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      } else {
        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-1`)
        })
      }
    })

    return newLitCells
  }, [personaClusters])

  // Fetch all data on mount
  useEffect(() => {
    if (user?.id) {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchFlowFinderData(),
        fetchProducts(),
        fetchOffers()
      ])
    } catch (err) {
      console.error('Error fetching report card data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_stage_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setUserProfile(data)
    } catch (err) {
      console.error('Error in fetchUserProfile:', err)
    }
  }

  const fetchFlowFinderData = async () => {
    try {
      // Fetch clusters from nikigai_clusters (works for both V1 and V2 users)
      const { data: clusters, error } = await supabase
        .from('nikigai_clusters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clusters:', error)
        return
      }

      if (clusters && clusters.length > 0) {
        setSkillsClusters(clusters.filter(c => c.cluster_type === 'skills'))
        setProblemsClusters(clusters.filter(c => c.cluster_type === 'problems'))
        setPersonaClusters(clusters.filter(c => c.cluster_type === 'persona'))
      }
    } catch (err) {
      console.error('Error in fetchFlowFinderData:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (error) {
        // Products table might not exist for all users
        console.warn('Products table error (may not exist):', error.message)
        return
      }

      setProducts(data || [])
    } catch (err) {
      console.error('Error in fetchProducts:', err)
    }
  }

  const fetchOffers = async () => {
    try {
      // Fetch attraction offers as a fallback for products
      const { data, error } = await supabase
        .from('attraction_offer_assessments')
        .select('id, offer_name, dream_outcome, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Offers table error:', error.message)
        return
      }

      setOffers(data || [])
    } catch (err) {
      console.error('Error in fetchOffers:', err)
    }
  }

  // Get display data
  const persona = userProfile?.persona
  const wealthLadder = userProfile?.wealth_ladder_rung
  const emphasis = userProfile?.guidance_emphasis

  const personaInfo = persona ? PERSONA_DISPLAY[persona] : null
  const ladderInfo = wealthLadder ? WEALTH_LADDER_DISPLAY[wealthLadder] : null
  const emphasisInfo = emphasis ? EMPHASIS_CONFIG[emphasis] : null

  // Format price for display
  const formatPrice = (price, priceType) => {
    if (!price) return 'Price TBD'
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)

    if (priceType === 'subscription') return `${formatted}/mo`
    if (priceType === 'per_session') return `${formatted}/session`
    return formatted
  }

  // Get product type info
  const getProductTypeInfo = (productType) => {
    return PRODUCT_TYPES[productType] || { label: productType, icon: '📦' }
  }

  // Get tier info
  const getTierInfo = (tier) => {
    return TIER_DISPLAY[tier] || { label: tier, icon: '📦', color: '#6B7280' }
  }

  // Get clusters for active wheel tab
  const getActiveClusters = () => {
    switch (activeWheel) {
      case 'skills': return skillsClusters
      case 'problems': return problemsClusters
      case 'personas': return personaClusters
      default: return []
    }
  }

  // Render wheel section
  const renderWheelSection = () => {
    const wheelConfig = {
      skills: {
        segments: skillsWithHue,
        rings: PROFICIENCY_RINGS,
        litCells: skillsLitCells,
        label: 'SKILLS',
        count: skillsClusters.length,
        route: '/nikigai/skills'
      },
      problems: {
        segments: problemsWithHue,
        rings: PROBLEMS_PROFICIENCY_RINGS,
        litCells: problemsLitCells,
        label: 'PROBLEMS',
        count: problemsClusters.length,
        route: '/nikigai/problems'
      },
      personas: {
        segments: personasWithHue,
        rings: JOURNEY_STAGES,
        litCells: personasLitCells,
        label: 'PERSONAS',
        count: personaClusters.length,
        route: '/nikigai/persona'
      }
    }

    const active = wheelConfig[activeWheel]
    const hasData = active.litCells.size > 0
    const activeClusters = getActiveClusters()

    return (
      <div className="wheel-section">
        <div className="wheel-tabs">
          {Object.entries(wheelConfig).map(([key, config]) => (
            <button
              key={key}
              className={`wheel-tab ${activeWheel === key ? 'active' : ''}`}
              onClick={() => setActiveWheel(key)}
            >
              {config.label}
              {config.count > 0 && <span className="tab-badge">{config.count}</span>}
            </button>
          ))}
        </div>

        <div className="wheel-display">
          {hasData ? (
            <>
              <GradientWheel
                segments={active.segments}
                rings={active.rings}
                litCells={active.litCells}
                size={240}
                centerLabel={active.label}
                interactive={false}
              />
              <div className="wheel-stats">
                {active.litCells.size} areas identified
              </div>
            </>
          ) : (
            <div className="wheel-empty">
              <span className="empty-icon">🎯</span>
              <p>No {activeWheel} captured yet</p>
              <Link to={active.route} className="capture-link">
                Start Flow Finder
              </Link>
            </div>
          )}
        </div>

        {/* Show cluster cards if we have data */}
        {activeClusters.length > 0 && (
          <div className="clusters-list">
            {activeClusters.map(cluster => (
              <div key={cluster.id} className="cluster-card">
                <div className="cluster-label">{cluster.cluster_label}</div>
                {cluster.insight && (
                  <div className="cluster-insight">{cluster.insight}</div>
                )}
                {cluster.items && cluster.items.length > 0 && (
                  <div className="cluster-items-preview">
                    {cluster.items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="cluster-item-tag">
                        {typeof item === 'string' ? item : item.text || item.label}
                      </span>
                    ))}
                    {cluster.items.length > 3 && (
                      <span className="cluster-item-more">+{cluster.items.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render products section
  const renderProductsSection = () => {
    // Group products by tier
    const productsByTier = products.reduce((acc, product) => {
      const tier = product.money_model_tier || 'other'
      if (!acc[tier]) acc[tier] = []
      acc[tier].push(product)
      return acc
    }, {})

    const tierOrder = ['attraction', 'core', 'upsell', 'downsell', 'continuity', 'other']
    const hasProducts = products.length > 0
    const hasOffers = offers.length > 0

    return (
      <div className="products-section">
        <div className="section-header">
          <h3>Your Offers & Products</h3>
          <span className="product-count">
            {hasProducts ? `${products.length} products` : hasOffers ? `${offers.length} offers` : ''}
          </span>
        </div>

        {!hasProducts && !hasOffers ? (
          <div className="products-empty">
            <span className="empty-icon">📦</span>
            <p>No products or offers captured yet</p>
            <Link to="/attraction-offer" className="capture-link">
              Create Your First Offer
            </Link>
          </div>
        ) : hasProducts ? (
          <div className="products-ladder">
            {tierOrder.map(tier => {
              const tierProducts = productsByTier[tier]
              if (!tierProducts || tierProducts.length === 0) return null

              const tierInfo = getTierInfo(tier)

              return (
                <div key={tier} className="tier-group">
                  <div
                    className="tier-header"
                    style={{ borderLeftColor: tierInfo.color }}
                  >
                    <span className="tier-icon">{tierInfo.icon}</span>
                    <span className="tier-label">{tierInfo.label}</span>
                  </div>
                  <div className="tier-products">
                    {tierProducts.map(product => {
                      const typeInfo = getProductTypeInfo(product.product_type)
                      return (
                        <div key={product.id} className="product-card">
                          <div className="product-main">
                            <span className="product-type-icon">{typeInfo.icon}</span>
                            <div className="product-info">
                              <span className="product-name">{product.name}</span>
                              <span className="product-type">{typeInfo.label}</span>
                            </div>
                          </div>
                          <span className="product-price">
                            {formatPrice(product.price_amount, product.price_type)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Show offers if no products
          <div className="offers-list">
            {offers.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-icon">🧲</div>
                <div className="offer-info">
                  <span className="offer-name">{offer.offer_name || 'Untitled Offer'}</span>
                  {offer.dream_outcome && (
                    <span className="offer-outcome">{offer.dream_outcome}</span>
                  )}
                </div>
              </div>
            ))}
            <Link to="/attraction-offer" className="add-offer-link">
              + Add another offer
            </Link>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flow-report-card">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading your report card...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-report-card">
      {/* Header */}
      <header className="report-header">
        <Link to="/me" className="back-link">← Back</Link>
        <h1>Your Flow Report Card</h1>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        {personaInfo && (
          <div className="persona-badge">
            <span className="persona-icon">{personaInfo.icon}</span>
            <span className="persona-name">{personaInfo.name}</span>
          </div>
        )}

        {ladderInfo && (
          <div className="ladder-position">
            <span className="ladder-icon">{ladderInfo.icon}</span>
            <div className="ladder-info">
              <span className="ladder-label">{ladderInfo.label}</span>
              <span className="ladder-description">{ladderInfo.description}</span>
            </div>
          </div>
        )}

        {emphasisInfo && (
          <div className="emphasis-badge">
            <span className="emphasis-label">Focus: {emphasisInfo.label}</span>
          </div>
        )}
      </section>

      {/* Wheels Section */}
      <section className="wheels-container">
        <h2>Flow Finder</h2>
        {renderWheelSection()}
      </section>

      {/* Products Section */}
      <section className="products-container">
        {renderProductsSection()}
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <Link to="/7-day-challenge" className="action-btn primary">
          Continue Challenge
        </Link>
        <Link to="/library" className="action-btn secondary">
          Full Library
        </Link>
      </section>
    </div>
  )
}

export default FlowReportCard
