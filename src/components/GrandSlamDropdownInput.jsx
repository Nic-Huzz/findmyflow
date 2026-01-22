/**
 * GrandSlamDropdownInput - Dropdown input populated from Offer Stack data
 *
 * Shows bonuses, guarantee, or scarcity options from user's completed Offer Stack Builder.
 * Falls back to legacy grand_slam_offers and offer_builder_assessments tables.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

const GUARANTEE_LABELS = {
  unconditional: 'Unconditional (no questions asked)',
  conditional: 'Conditional (if X then refund)',
  performance: 'Performance (outcome-based)',
  anti_guarantee: 'Anti-Guarantee (all sales final)',
  results: 'Results-Based (guarantee specific outcomes)',
  extended: 'Extended Period (longer refund window)'
}

const SCARCITY_LABELS = {
  cohort: 'Cohort-based (limited spots)',
  time: 'Time-based (deadline)',
  bonus: 'Bonus-based (expiring bonuses)',
  price: 'Price-based (early bird)',
  inventory: 'Inventory (limited supply)',
  limited_time: 'Limited Time (deadline)',
  limited_spots: 'Limited Spots (capacity)',
  bonus_expires: 'Bonus Expires',
  price_increase: 'Price Increase',
  seasonal: 'Seasonal Availability'
}

function GrandSlamDropdownInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [grandSlamData, setGrandSlamData] = useState(null)
  const [selectedValue, setSelectedValue] = useState('')
  const [error, setError] = useState(null)

  // Load Offer Stack or Grand Slam Offer data
  useEffect(() => {
    const loadGrandSlamData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // First try the offer_stack_builds table (new flow)
        const { data: offerStack, error: osError } = await supabase
          .from('offer_stack_builds')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (offerStack && !osError) {
          // Transform to expected format
          setGrandSlamData({
            bonuses: offerStack.bonuses || [],
            guarantee: {
              type: offerStack.guarantee_type,
              terms: offerStack.guarantee_details
            },
            scarcity: {
              type: offerStack.scarcity_types?.[0] || null,
              types: offerStack.scarcity_types || [],
              details: offerStack.scarcity_details?.custom || null
            }
          })
          setLoading(false)
          return
        }

        // Fallback: try the grand_slam_offers table (legacy)
        const { data: grandSlamOffer, error: gsError } = await supabase
          .from('grand_slam_offers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (grandSlamOffer && !gsError) {
          setGrandSlamData(grandSlamOffer)
          setLoading(false)
          return
        }

        // Fallback: check offer_builder_assessments for grand_slam_data
        const { data: assessment, error: assessError } = await supabase
          .from('offer_builder_assessments')
          .select('grand_slam_data')
          .eq('user_id', user.id)
          .not('grand_slam_data', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (assessment?.grand_slam_data && !assessError) {
          setGrandSlamData(assessment.grand_slam_data)
        } else {
          setError('Complete the Offer Stack Builder first')
        }
      } catch (err) {
        console.error('Error loading offer data:', err)
        setError('Failed to load offer data')
      } finally {
        setLoading(false)
      }
    }

    loadGrandSlamData()
  }, [user])

  // Get options based on data source
  const getOptions = () => {
    if (!grandSlamData) return []

    const dataSource = quest.data_source

    if (dataSource === 'bonuses') {
      const bonuses = grandSlamData.bonuses || []
      return bonuses.map((bonus, index) => ({
        value: `bonus_${index}`,
        label: bonus.name || `Bonus ${index + 1}`,
        details: bonus.value ? `$${bonus.value} value` : null
      }))
    }

    if (dataSource === 'guarantee') {
      const guarantee = grandSlamData.guarantee || {}
      if (guarantee.type) {
        return [{
          value: guarantee.type,
          label: GUARANTEE_LABELS[guarantee.type] || guarantee.type,
          details: guarantee.terms || null
        }]
      }
      return []
    }

    if (dataSource === 'scarcity') {
      const scarcity = grandSlamData.scarcity || {}
      // Handle array format from new flow
      if (scarcity.types && Array.isArray(scarcity.types)) {
        return scarcity.types.map(type => ({
          value: type,
          label: SCARCITY_LABELS[type] || type,
          details: scarcity.details || null
        }))
      }
      // Handle single type format from legacy flow
      if (scarcity.type) {
        return [{
          value: scarcity.type,
          label: SCARCITY_LABELS[scarcity.type] || scarcity.type,
          details: scarcity.details || null
        }]
      }
      return []
    }

    return []
  }

  const options = getOptions()

  const handleComplete = (e) => {
    if (!selectedValue) return

    const selectedOption = options.find(opt => opt.value === selectedValue)
    const completionData = {
      type: quest.data_source,
      value: selectedValue,
      label: selectedOption?.label || selectedValue,
      details: selectedOption?.details || null
    }

    onComplete(quest, completionData, e)
  }

  if (loading) {
    return (
      <div className="grand-slam-dropdown-input">
        <div className="loading-state">Loading your Offer Stack data...</div>
      </div>
    )
  }

  if (error || !grandSlamData) {
    return (
      <div className="grand-slam-dropdown-input">
        <div className="locked-message">
          <span className="lock-icon">🔒</span>
          <p>{error || 'Complete the Offer Stack Builder first'}</p>
          <a href="/offer-stack-builder" className="unlock-link">
            Go to Offer Stack Builder
          </a>
        </div>
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="grand-slam-dropdown-input">
        <div className="no-data-message">
          <p>No {quest.data_source} found in your Offer Stack.</p>
          <a href="/offer-stack-builder" className="unlock-link">
            Update your Offer Stack
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="grand-slam-dropdown-input">
      <select
        className="quest-dropdown grand-slam-select"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
      >
        <option value="">{quest.placeholder || 'Select an option...'}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {selectedValue && (
        <div className="selection-preview">
          {options.find(opt => opt.value === selectedValue)?.details && (
            <p className="selection-details">
              {options.find(opt => opt.value === selectedValue)?.details}
            </p>
          )}
        </div>
      )}

      <button
        className="quest-complete-btn"
        onClick={handleComplete}
        disabled={!selectedValue}
      >
        Confirm & Complete
      </button>
    </div>
  )
}

export default GrandSlamDropdownInput
