/**
 * GrandSlamMatrix - Match solutions to offer tiers
 *
 * Features:
 * - Pulls solutions from V1 Offer Builder
 * - Pulls strategies from Money Model flows
 * - Drag-drop solutions to tiers (Core, Upsell, Downsell, Continuity, Lead Magnet, Attraction)
 * - AI recommendations based on delivery format + Money Model strategy
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './GrandSlamMatrix.css'

// Offer tier definitions
const OFFER_TIERS = {
  core: {
    id: 'core',
    name: 'Core Offer',
    icon: '💰',
    description: 'Your main paid product',
    color: '#22c55e'
  },
  upsell: {
    id: 'upsell',
    name: 'Upsell',
    icon: '⬆️',
    description: 'Premium add-on after purchase',
    color: '#3b82f6'
  },
  downsell: {
    id: 'downsell',
    name: 'Downsell',
    icon: '⬇️',
    description: 'Lower-priced alternative',
    color: '#f59e0b'
  },
  continuity: {
    id: 'continuity',
    name: 'Continuity',
    icon: '🔄',
    description: 'Recurring subscription',
    color: '#8b5cf6'
  },
  leadMagnet: {
    id: 'leadMagnet',
    name: 'Lead Magnet',
    icon: '🎁',
    description: 'Free value for email',
    color: '#ec4899'
  },
  attraction: {
    id: 'attraction',
    name: 'Attraction Offer',
    icon: '🎯',
    description: 'Low-cost entry point',
    color: '#06b6d4'
  }
}

// Solution category labels
const SOLUTION_LABELS = {
  service: { icon: '💼', label: 'Service' },
  productized: { icon: '📦', label: 'Productized' },
  product: { icon: '🛍️', label: 'Product' }
}

function GrandSlamMatrix() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Data states
  const [solutions, setSolutions] = useState([])
  const [moneyModelStrategies, setMoneyModelStrategies] = useState({})
  const [assignments, setAssignments] = useState({})
  const [recommendations, setRecommendations] = useState({})

  // UI states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [draggedSolution, setDraggedSolution] = useState(null)
  const [showRecommendations, setShowRecommendations] = useState(true)

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load V1 Offer Builder solutions
      const { data: offerBuilderData, error: obError } = await supabase
        .from('offer_builder_assessments')
        .select('responses')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (obError && obError.code !== 'PGRST116') throw obError

      // Extract solutions from responses
      const rawSolutions = offerBuilderData?.responses?.q8_solutions?.solutions || []
      const formattedSolutions = rawSolutions
        .filter(sol => sol.description?.trim())
        .map((sol, index) => ({
          id: `solution_${index}`,
          ...sol
        }))
      setSolutions(formattedSolutions)

      // Load Money Model strategies
      const strategies = {}

      // Attraction Offer
      const { data: attractionData } = await supabase
        .from('attraction_offer_assessments')
        .select('recommended_offer_id, recommended_offer_name, confidence_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (attractionData) strategies.attraction = attractionData

      // Upsell
      const { data: upsellData } = await supabase
        .from('upsell_assessments')
        .select('recommended_offer_id, recommended_offer_name, confidence_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (upsellData) strategies.upsell = upsellData

      // Downsell
      const { data: downsellData } = await supabase
        .from('downsell_assessments')
        .select('recommended_offer_id, recommended_offer_name, confidence_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (downsellData) strategies.downsell = downsellData

      // Continuity
      const { data: continuityData } = await supabase
        .from('continuity_assessments')
        .select('recommended_offer_id, recommended_offer_name, confidence_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (continuityData) strategies.continuity = continuityData

      // Lead Magnet
      const { data: leadMagnetData } = await supabase
        .from('lead_magnet_assessments')
        .select('recommended_offer_id, recommended_offer_name, confidence_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (leadMagnetData) strategies.leadMagnet = leadMagnetData

      setMoneyModelStrategies(strategies)

      // Load existing assignments (if any)
      const { data: existingMatrix } = await supabase
        .from('grand_slam_offers')
        .select('assignments')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingMatrix?.assignments) {
        setAssignments(existingMatrix.assignments)
      }

      // Generate AI recommendations
      generateRecommendations(formattedSolutions, strategies)

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Generate AI recommendations based on delivery format and strategies
  const generateRecommendations = (sols, strategies) => {
    const recs = {}

    sols.forEach(solution => {
      const scores = {
        core: 0,
        upsell: 0,
        downsell: 0,
        continuity: 0,
        leadMagnet: 0,
        attraction: 0
      }

      const category = solution.solutionCategory

      // Factor 1: Delivery format
      if (category === 'service') {
        scores.core += 3 // Services often = premium core
        scores.upsell += 2
      } else if (category === 'productized') {
        scores.core += 2
        scores.continuity += 3 // Memberships, programs
        scores.upsell += 1
      } else if (category === 'product') {
        scores.leadMagnet += 3
        scores.downsell += 2
        scores.attraction += 2
      }

      // Factor 2: Solution type specifics
      const solutionType = solution.solutionType
      if (solutionType === 'custom_service') {
        scores.core += 2
        scores.upsell += 1
      } else if (solutionType === 'membership') {
        scores.continuity += 3
      } else if (solutionType === 'digital_product') {
        scores.leadMagnet += 2
        scores.downsell += 1
      } else if (solutionType === 'live_group' || solutionType === 'automated_group') {
        scores.core += 2
        scores.upsell += 1
      }

      // Factor 3: Money Model strategy fit
      if (strategies.upsell?.recommended_offer_id === 'anchor_upsell' && category === 'service') {
        scores.upsell += 2
      }
      if (strategies.downsell?.recommended_offer_id === 'self_paced' && category === 'product') {
        scores.downsell += 2
      }
      if (strategies.continuity?.recommended_offer_id && category === 'productized') {
        scores.continuity += 1
      }

      // Find best tier
      const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1])
      const bestTier = sortedScores[0][0]
      const secondTier = sortedScores[1][0]

      recs[solution.id] = {
        recommendedTier: bestTier,
        alternativeTier: secondTier,
        scores,
        reasoning: generateReasoning(solution, bestTier, strategies)
      }
    })

    setRecommendations(recs)
  }

  // Generate human-readable reasoning
  const generateReasoning = (solution, tier, strategies) => {
    const category = solution.solutionCategory
    const tierName = OFFER_TIERS[tier]?.name

    let reason = `"${solution.description?.slice(0, 50)}..." `

    if (category === 'service' && tier === 'core') {
      reason += 'is high-touch, making it ideal as your core paid offer.'
    } else if (category === 'service' && tier === 'upsell') {
      reason += 'works well as a premium upgrade after they buy.'
    } else if (category === 'productized' && tier === 'continuity') {
      reason += 'has recurring delivery potential, perfect for subscriptions.'
    } else if (category === 'product' && tier === 'leadMagnet') {
      reason += 'is scalable and easy to give away to capture leads.'
    } else if (category === 'product' && tier === 'downsell') {
      reason += 'offers a lower-commitment option for those not ready for more.'
    } else {
      reason += `fits ${tierName} based on its delivery format.`
    }

    return reason
  }

  // Drag and drop handlers
  const handleDragStart = (solution) => {
    setDraggedSolution(solution)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (tierId) => {
    if (!draggedSolution) return

    setAssignments(prev => {
      // Remove from previous tier if assigned
      const newAssignments = { ...prev }
      Object.keys(newAssignments).forEach(tier => {
        if (newAssignments[tier]?.includes(draggedSolution.id)) {
          newAssignments[tier] = newAssignments[tier].filter(id => id !== draggedSolution.id)
        }
      })

      // Add to new tier
      if (!newAssignments[tierId]) {
        newAssignments[tierId] = []
      }
      newAssignments[tierId] = [...newAssignments[tierId], draggedSolution.id]

      return newAssignments
    })

    setDraggedSolution(null)
  }

  // Remove solution from tier
  const removeSolutionFromTier = (tierId, solutionId) => {
    setAssignments(prev => ({
      ...prev,
      [tierId]: (prev[tierId] || []).filter(id => id !== solutionId)
    }))
  }

  // Apply AI recommendations
  const applyRecommendations = () => {
    const newAssignments = {}

    Object.entries(recommendations).forEach(([solutionId, rec]) => {
      const tier = rec.recommendedTier
      if (!newAssignments[tier]) {
        newAssignments[tier] = []
      }
      newAssignments[tier].push(solutionId)
    })

    setAssignments(newAssignments)
  }

  // Get unassigned solutions
  const getUnassignedSolutions = () => {
    const assignedIds = new Set(Object.values(assignments).flat())
    return solutions.filter(sol => !assignedIds.has(sol.id))
  }

  // Get solutions for a tier
  const getSolutionsForTier = (tierId) => {
    const solutionIds = assignments[tierId] || []
    return solutionIds.map(id => solutions.find(s => s.id === id)).filter(Boolean)
  }

  // Check if matrix is complete
  const isMatrixComplete = () => {
    const assignedCount = Object.values(assignments).flat().length
    return assignedCount > 0
  }

  // Save matrix
  const handleSave = async () => {
    if (!isMatrixComplete()) {
      setError('Please assign at least one solution to a tier.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: saveError } = await supabase
        .from('grand_slam_offers')
        .upsert({
          user_id: user.id,
          assignments,
          money_model_strategies: moneyModelStrategies,
          recommendations,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (saveError) throw saveError

      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving matrix:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Check completion status of Money Models
  const getMoneyModelStatus = () => {
    const completed = Object.keys(moneyModelStrategies).length
    const total = 5 // attraction, upsell, downsell, continuity, leadMagnet
    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  if (loading) {
    return (
      <div className="grand-slam-matrix loading">
        <div className="spinner large"></div>
        <p>Loading your offer data...</p>
      </div>
    )
  }

  const unassignedSolutions = getUnassignedSolutions()
  const moneyModelStatus = getMoneyModelStatus()

  return (
    <div className="grand-slam-matrix">
      <div className="matrix-header">
        <h1>Grand Slam Offer Matrix</h1>
        <p>Drag your solutions to the appropriate offer tiers</p>
      </div>

      {/* Money Model Progress */}
      <div className="money-model-status">
        <div className="status-header">
          <span className="status-icon">📊</span>
          <span>Money Model Progress: {moneyModelStatus.completed}/{moneyModelStatus.total} completed</span>
        </div>
        <div className="status-bar">
          <div className="status-fill" style={{ width: `${moneyModelStatus.percentage}%` }} />
        </div>
        {moneyModelStatus.completed < moneyModelStatus.total && (
          <p className="status-hint">
            Complete more Money Models for better recommendations.
            <button onClick={() => navigate('/attraction-offer')} className="link-btn">
              Start Money Models →
            </button>
          </p>
        )}
      </div>

      {/* AI Recommendations Toggle */}
      <div className="recommendations-toggle">
        <button
          className={`toggle-btn ${showRecommendations ? 'active' : ''}`}
          onClick={() => setShowRecommendations(!showRecommendations)}
        >
          {showRecommendations ? '🤖 Hide AI Suggestions' : '🤖 Show AI Suggestions'}
        </button>
        {showRecommendations && unassignedSolutions.length > 0 && (
          <button className="apply-btn" onClick={applyRecommendations}>
            Apply All Suggestions
          </button>
        )}
      </div>

      {/* No solutions warning */}
      {solutions.length === 0 && (
        <div className="no-solutions-warning">
          <span className="warning-icon">⚠️</span>
          <p>No solutions found. Complete the Offer Builder first.</p>
          <button onClick={() => navigate('/offer-builder')} className="primary-button">
            Go to Offer Builder →
          </button>
        </div>
      )}

      {/* Unassigned Solutions Pool */}
      {unassignedSolutions.length > 0 && (
        <div className="solutions-pool">
          <h3>Your Solutions ({unassignedSolutions.length} unassigned)</h3>
          <div className="solutions-list">
            {unassignedSolutions.map(solution => {
              const rec = recommendations[solution.id]
              const categoryInfo = SOLUTION_LABELS[solution.solutionCategory] || {}

              return (
                <div
                  key={solution.id}
                  className="solution-card draggable"
                  draggable
                  onDragStart={() => handleDragStart(solution)}
                >
                  <div className="solution-header">
                    <span className="category-badge">
                      {categoryInfo.icon} {categoryInfo.label}
                    </span>
                  </div>
                  <p className="solution-description">{solution.description}</p>
                  <p className="solution-problem">Solves: {solution.problemText}</p>

                  {showRecommendations && rec && (
                    <div className="solution-recommendation">
                      <span className="rec-icon">🤖</span>
                      <span>Suggested: <strong>{OFFER_TIERS[rec.recommendedTier]?.name}</strong></span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Offer Tiers Grid */}
      <div className="tiers-grid">
        {Object.values(OFFER_TIERS).map(tier => {
          const tierSolutions = getSolutionsForTier(tier.id)
          const strategy = moneyModelStrategies[tier.id]

          return (
            <div
              key={tier.id}
              className={`tier-drop-zone ${draggedSolution ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(tier.id)}
              style={{ '--tier-color': tier.color }}
            >
              <div className="tier-header">
                <span className="tier-icon">{tier.icon}</span>
                <h3>{tier.name}</h3>
                <p className="tier-description">{tier.description}</p>
              </div>

              {/* Money Model Strategy */}
              {strategy && (
                <div className="tier-strategy">
                  <span className="strategy-label">Strategy:</span>
                  <span className="strategy-name">{strategy.recommended_offer_name}</span>
                </div>
              )}

              {/* Assigned solutions */}
              <div className="tier-solutions">
                {tierSolutions.length === 0 ? (
                  <p className="empty-hint">Drop solutions here</p>
                ) : (
                  tierSolutions.map(solution => {
                    const categoryInfo = SOLUTION_LABELS[solution.solutionCategory] || {}
                    return (
                      <div key={solution.id} className="assigned-solution">
                        <span className="category-mini">{categoryInfo.icon}</span>
                        <span className="solution-text">{solution.description?.slice(0, 40)}...</span>
                        <button
                          className="remove-btn"
                          onClick={() => removeSolutionFromTier(tier.id, solution.id)}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Error message */}
      {error && <p className="error-message">{error}</p>}

      {/* Save button */}
      <div className="matrix-actions">
        <button
          className="primary-button"
          onClick={handleSave}
          disabled={saving || !isMatrixComplete()}
        >
          {saving ? 'Saving...' : 'Save Offer Matrix'}
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate('/7-day-challenge')}
        >
          Back to Challenge
        </button>
      </div>
    </div>
  )
}

export default GrandSlamMatrix
