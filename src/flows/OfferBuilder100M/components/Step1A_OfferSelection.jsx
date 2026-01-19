/**
 * Step1A_OfferSelection - Select which V1 Offer to build Grand Slam for
 *
 * Features:
 * - Shows all completed V1 offers as selectable cards
 * - Displays persona name, problem area, and niche
 * - If no V1 offers exist, prompts to complete Offer Builder first
 * - Auto-advances to summary on selection
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../auth/AuthProvider'

function Step1A_OfferSelection({ onSelect, setIsLoading, setError }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOffer, setSelectedOffer] = useState(null)

  // Load all V1 offers for this user
  useEffect(() => {
    if (!user) return

    const loadOffers = async () => {
      setLoading(true)
      try {
        // Get all completed V1 offers
        const { data, error } = await supabase
          .from('offer_builder_assessments')
          .select(`
            *,
            persona_profiles (
              id,
              name,
              problem_statement,
              dream_outcome
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setOffers(data || [])
      } catch (err) {
        console.error('Error loading offers:', err)
        setError('Failed to load your offers. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadOffers()
  }, [user, setError])

  // Handle offer selection
  const handleSelect = (offer) => {
    setSelectedOffer(offer.id)

    // Extract bucket from problem_area
    const bucket = deriveBucket(offer.problem_area)

    // Small delay for visual feedback
    setTimeout(() => {
      onSelect(offer, bucket)
    }, 300)
  }

  // Derive bucket from problem_area text
  const deriveBucket = (problemArea) => {
    if (!problemArea) return 'wealth' // default

    const lower = problemArea.toLowerCase()

    // Health indicators
    if (lower.includes('health') || lower.includes('fitness') || lower.includes('weight') ||
        lower.includes('energy') || lower.includes('pain') || lower.includes('wellness') ||
        lower.includes('nutrition') || lower.includes('body') || lower.includes('exercise')) {
      return 'health'
    }

    // Love/fulfillment indicators
    if (lower.includes('relationship') || lower.includes('love') || lower.includes('purpose') ||
        lower.includes('happiness') || lower.includes('fulfillment') || lower.includes('connection') ||
        lower.includes('meaning') || lower.includes('joy') || lower.includes('passion') ||
        lower.includes('self-love') || lower.includes('confidence')) {
      return 'love'
    }

    // Default to wealth for business/money related
    return 'wealth'
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Loading state
  if (loading) {
    return (
      <div className="offer-selection">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your offers...</p>
        </div>
      </div>
    )
  }

  // No offers - prompt to create one first
  if (offers.length === 0) {
    return (
      <div className="offer-selection">
        <div className="question-header">
          <span className="step-label">Step 1 of 8</span>
          <h2>Build Your Offer Foundation First</h2>
        </div>

        <div className="no-offers-prompt">
          <div className="prompt-icon">📦</div>
          <h3>No Offer Foundations Found</h3>
          <p>
            Before creating your Grand Slam Offer, you need to complete the
            <strong> Offer Builder</strong> to establish your foundation.
          </p>
          <p className="prompt-detail">
            The Offer Builder helps you:
          </p>
          <ul>
            <li>Define your target customer and their pain points</li>
            <li>Identify obstacles preventing them from buying</li>
            <li>Brainstorm solutions that address each obstacle</li>
            <li>Categorize your solutions into products and lead magnets</li>
          </ul>
          <p className="prompt-time">⏱️ Takes about 15-20 minutes</p>

          <button
            className="primary-button"
            onClick={() => navigate('/offer-builder')}
          >
            Go to Offer Builder →
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  // Show offer selection cards
  return (
    <div className="offer-selection">
      <div className="question-header">
        <span className="step-label">Step 1 of 8</span>
        <h2>Which offer are you building?</h2>
        <p className="question-subtitle">
          Select the offer foundation you want to transform into a Grand Slam Offer.
        </p>
      </div>

      <div className="offer-cards">
        {offers.map((offer) => {
          const persona = offer.persona_profiles
          const isSelected = selectedOffer === offer.id
          const bucket = deriveBucket(offer.problem_area)
          const bucketEmoji = bucket === 'health' ? '❤️' : bucket === 'love' ? '💕' : '💰'

          return (
            <button
              key={offer.id}
              className={`offer-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(offer)}
              disabled={selectedOffer !== null}
            >
              <div className="offer-card-header">
                <span className="bucket-badge">
                  {bucketEmoji} {bucket.charAt(0).toUpperCase() + bucket.slice(1)}
                </span>
                <span className="offer-date">{formatDate(offer.created_at)}</span>
              </div>

              {/* Persona info */}
              {persona && (
                <div className="offer-persona">
                  <span className="persona-icon">👤</span>
                  <span className="persona-name">{persona.name || 'Unnamed Persona'}</span>
                </div>
              )}

              {/* Problem area */}
              {offer.problem_area && (
                <div className="offer-problem">
                  <span className="label">Problem:</span>
                  <span className="value">"{offer.problem_area}"</span>
                </div>
              )}

              {/* Niche */}
              {offer.niche_layers?.what && (
                <div className="offer-niche">
                  <span className="label">What:</span>
                  <span className="value">{offer.niche_layers.what}</span>
                </div>
              )}
              {offer.niche_layers?.who && (
                <div className="offer-niche">
                  <span className="label">Who:</span>
                  <span className="value">{offer.niche_layers.who}</span>
                </div>
              )}

              {/* Solutions count */}
              {offer.solutions?.length > 0 && (
                <div className="offer-solutions">
                  <span className="solutions-count">
                    {offer.solutions.length} solution{offer.solutions.length !== 1 ? 's' : ''} defined
                  </span>
                </div>
              )}

              {isSelected && (
                <div className="selected-indicator">
                  <span>✓ Selected</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Create new offer link */}
      <div className="create-new-section">
        <p>Need to create a new offer for a different persona?</p>
        <button
          className="text-link"
          onClick={() => navigate('/offer-builder')}
        >
          → Go to Offer Builder
        </button>
      </div>
    </div>
  )
}

export default Step1A_OfferSelection
