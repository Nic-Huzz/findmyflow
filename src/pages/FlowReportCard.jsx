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
import { PRODUCT_TYPES, CATEGORY_OPTIONS } from '../components/onboarding/QuickCapture/DeliverySelector'
import './FlowReportCard.css'

// Money model tier display info
const TIER_DISPLAY = {
  attraction: { label: 'Attraction', icon: '🧲', color: '#10B981' },
  core: { label: 'Core', icon: '⭐', color: '#F59E0B' },
  upsell: { label: 'Upsell', icon: '📈', color: '#8B5CF6' },
  downsell: { label: 'Downsell', icon: '📉', color: '#6366F1' },
  continuity: { label: 'Continuity', icon: '🔄', color: '#EC4899' }
}

function FlowReportCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // User profile data
  const [userProfile, setUserProfile] = useState(null)

  // Flow Finder data
  const [skillsData, setSkillsData] = useState([])
  const [problemsData, setProblemsData] = useState([])
  const [personasData, setPersonasData] = useState([])

  // Products
  const [products, setProducts] = useState([])

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

  // Calculate lit cells from quick capture or cluster data
  const skillsLitCells = useMemo(() => {
    const cells = new Set()
    skillsData.forEach(item => {
      const segmentIndex = SKILLS_SEGMENTS.findIndex(s => s.id === item.id)
      if (segmentIndex !== -1) {
        const ringIndex = item.ring === 'emerging' ? 0 : item.ring === 'establishing' ? 1 : 2
        cells.add(`${segmentIndex}-${ringIndex}`)
      }
    })
    return cells
  }, [skillsData])

  const problemsLitCells = useMemo(() => {
    const cells = new Set()
    problemsData.forEach(item => {
      const segmentIndex = PROBLEM_SEGMENTS.findIndex(s => s.id === item.id)
      if (segmentIndex !== -1) {
        const ringIndex = item.ring === 'exploring' ? 0 : item.ring === 'pursuing' ? 1 : 2
        cells.add(`${segmentIndex}-${ringIndex}`)
      }
    })
    return cells
  }, [problemsData])

  const personasLitCells = useMemo(() => {
    const cells = new Set()
    personasData.forEach(item => {
      const segmentIndex = PERSONA_SEGMENTS.findIndex(s => s.id === item.id)
      if (segmentIndex !== -1) {
        const ringIndex = item.ring === 'awakening' ? 0 : item.ring === 'struggling' ? 1 : 2
        cells.add(`${segmentIndex}-${ringIndex}`)
      }
    })
    return cells
  }, [personasData])

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
        fetchProducts()
      ])
    } catch (err) {
      console.error('Error fetching report card data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('user_stage_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    setUserProfile(data)
  }

  const fetchFlowFinderData = async () => {
    // First try quick capture data from nikigai_responses
    const { data: responses } = await supabase
      .from('nikigai_responses')
      .select('*')
      .eq('user_id', user.id)
      .eq('metadata->>source', 'quick_capture')

    if (responses && responses.length > 0) {
      const skills = responses
        .filter(r => r.flow_type === 'skills')
        .map(r => ({ id: r.answer, ring: r.metadata?.ring }))
      const problems = responses
        .filter(r => r.flow_type === 'problems')
        .map(r => ({ id: r.answer, ring: r.metadata?.ring }))
      const personas = responses
        .filter(r => r.flow_type === 'persona')
        .map(r => ({ id: r.answer, ring: r.metadata?.ring }))

      setSkillsData(skills)
      setProblemsData(problems)
      setPersonasData(personas)
    } else {
      // Fall back to cluster data
      const { data: clusters } = await supabase
        .from('nikigai_clusters')
        .select('*')
        .eq('user_id', user.id)

      if (clusters) {
        // Process cluster data into wheel format
        // This is a simplified mapping - real implementation would need more logic
        const skillClusters = clusters.filter(c => c.cluster_type === 'skills')
        const problemClusters = clusters.filter(c => c.cluster_type === 'problems')
        const personaClusters = clusters.filter(c => c.cluster_type === 'persona')

        // For now, just set empty arrays if no quick capture data
        setSkillsData([])
        setProblemsData([])
        setPersonasData([])
      }
    }
  }

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    setProducts(data || [])
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

  // Render wheel section
  const renderWheelSection = () => {
    const wheelConfig = {
      skills: {
        segments: skillsWithHue,
        rings: PROFICIENCY_RINGS,
        litCells: skillsLitCells,
        label: 'SKILLS',
        count: skillsData.length
      },
      problems: {
        segments: problemsWithHue,
        rings: PROBLEMS_PROFICIENCY_RINGS,
        litCells: problemsLitCells,
        label: 'PROBLEMS',
        count: problemsData.length
      },
      personas: {
        segments: personasWithHue,
        rings: JOURNEY_STAGES,
        litCells: personasLitCells,
        label: 'PERSONAS',
        count: personasData.length
      }
    }

    const active = wheelConfig[activeWheel]
    const hasData = active.count > 0

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
            <GradientWheel
              segments={active.segments}
              rings={active.rings}
              litCells={active.litCells}
              size={240}
              centerLabel={active.label}
              interactive={false}
            />
          ) : (
            <div className="wheel-empty">
              <span className="empty-icon">🎯</span>
              <p>No {activeWheel} captured yet</p>
              <Link to="/nikigai/skills" className="capture-link">
                Start Flow Finder
              </Link>
            </div>
          )}
        </div>
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

    return (
      <div className="products-section">
        <div className="section-header">
          <h3>Your Product Suite</h3>
          <span className="product-count">{products.length} products</span>
        </div>

        {products.length === 0 ? (
          <div className="products-empty">
            <span className="empty-icon">📦</span>
            <p>No products captured yet</p>
            <p className="empty-hint">Complete Quick Capture to add your offerings</p>
          </div>
        ) : (
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
