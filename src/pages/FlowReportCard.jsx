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
    // 0=storytelling, 1=teaching, 2=coaching, 3=performing, 4=creating, 5=building, 6=designing, 7=leading, 8=connecting, 9=speaking_up
    storytelling: [0], narrative: [0], memoir: [0], 'content writing': [0],
    teaching: [1], explaining: [1], clarifying: [1], translating: [1], simplifying: [1],
    coaching: [2], mentoring: [2], nurturing: [2], supporting: [2], 'holding space': [2],
    performing: [3], presenting: [3], speaking: [3], stage: [3], keynote: [3],
    creating: [4], creative: [4], art: [4], inventing: [4], ideation: [4],
    building: [5], making: [5], engineering: [5], coding: [5], developing: [5], prototype: [5],
    designing: [6], design: [6], ux: [6], visual: [6], aesthetic: [6],
    leading: [7], strategy: [7], strategizing: [7], planning: [7], vision: [7], organizing: [7], systems: [7], operations: [7],
    connecting: [8], networking: [8], collaboration: [8], facilitating: [8], community: [8],
    'speaking up': [9], advocacy: [9], activism: [9], courage: [9],
    // Absorbed old terms
    analyzing: [1], analysis: [1], data: [1], patterns: [1], research: [1],
    influencing: [3], sales: [3], persuading: [3], motivating: [3],
    synthesizing: [1], integrating: [1], wisdom: [1], 'big picture': [1],
    expressing: [0], writing: [0],
    // Compound terms
    'problem solving': [1, 7], 'problem-solving': [1, 7],
    'team building': [8, 2], leadership: [7, 3],
    communication: [0, 3], 'project management': [7, 5],
    innovation: [4, 5], entrepreneurship: [7, 5, 3],
    learning: [1, 4], experience: [6, 4], engagement: [8, 3],
    healing: [2, 9], growth: [2, 1],
    playful: [4, 8], interaction: [3, 8], performance: [3, 9],
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
    // 0=kids_deserved_better, 1=voice_taken, 2=pain_not_believed, 3=world_losing,
    // 4=life_not_yours, 5=feeling_stupid, 6=locked_out, 7=work_treated_nothing,
    // 8=left_behind, 9=forgot_what_for, 10=stopped_wondering, 11=work_hollows
    children: [0], kids: [0], parenting: [0], youth: [0], childhood: [0], student: [0], school: [0],
    silence: [1], voice: [1], suppressed: [1], censored: [1], erased: [1], gender: [1], identity: [1],
    pain: [2], illness: [2], chronic: [2], dying: [2], body: [2], health: [2], sleep: [2], disability: [2],
    climate: [3], environment: [3], sustainability: [3], planet: [3], nature: [3], species: [3], ecological: [3],
    oppression: [4], control: [4], rights: [4], freedom: [4], justice: [4], discrimination: [4], slavery: [4],
    jargon: [5], confusing: [5], complicated: [5], explain: [5], simplify: [5], literacy: [5],
    access: [6], cost: [6], affordable: [6], gatekeeping: [6], credentials: [6], poverty: [6], inequality: [6],
    art: [7], creativity: [7], dismissed: [7], stolen: [7], credit: [7], recognition: [7], craft: [7],
    abandoned: [8], forgotten: [8], homeless: [8], displaced: [8], refugee: [8], community: [8], veteran: [8],
    meaning: [9], purpose: [9], lost: [9], existential: [9], spiritual: [9], soul: [9], stuck: [9],
    certainty: [10], dogma: [10], rigid: [10], questioning: [10], curious: [10], bias: [10],
    burnout: [11], exploit: [11], dignity: [11], toxic: [11], hustle: [11], grind: [11], career: [11], job: [11],
    // Absorbed old terms
    anxiety: [9], stress: [11], mindset: [9], emotions: [9],
    relationship: [8], family: [0], love: [8],
    expression: [1, 7], belonging: [8], movement: [1],
    money: [11], business: [11], financial: [6],
    technology: [5], innovation: [5], education: [5, 6],
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
    SKILLS_SEGMENTS.map((s, i) => ({ ...s, hue: i * 36 })),
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
