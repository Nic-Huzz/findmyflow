/**
 * FunnelCalculator - Track and Plan Your Funnel Metrics
 *
 * A spreadsheet-like tool for tracking funnel performance.
 * Two modes:
 * - Actual: Input real numbers to track performance
 * - Planner: Input target numbers with industry average conversions
 *
 * Funnel stages:
 * 1. Awareness (people reached)
 * 2. Attraction Offer Engagements
 * 3. Lead Magnet Opt-ins
 * 4. Nurture Engagement
 * 5. Core Offer Sales
 * 6. Upsell Conversions
 * 7. Downsell Conversions
 * 8. Continuity Sign-ups
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { BackButton } from '../components/MoneyModelShared'
import './FunnelCalculator.css'

// Industry average conversion rates for Planner mode
const INDUSTRY_AVERAGES = {
  awareness_to_attraction: 0.05,      // 5% click/engage with attraction offer
  attraction_to_leadmagnet: 0.25,     // 25% opt-in for lead magnet
  leadmagnet_to_nurture: 0.40,        // 40% engage with nurture sequence
  nurture_to_core: 0.05,              // 5% buy core offer
  core_to_upsell: 0.20,               // 20% take upsell
  core_to_downsell: 0.30,             // 30% of non-upsellers take downsell
  core_to_continuity: 0.15            // 15% sign up for continuity
}

// Default funnel stage labels
const FUNNEL_STAGES = [
  { id: 'awareness', label: 'Awareness', sublabel: 'People Reached', icon: '👁️', color: '#6366f1' },
  { id: 'attraction', label: 'Attraction Offer', sublabel: 'Engagements', icon: '🎯', color: '#8b5cf6' },
  { id: 'leadmagnet', label: 'Lead Magnet', sublabel: 'Opt-ins', icon: '🧲', color: '#a855f7' },
  { id: 'nurture', label: 'Nurture', sublabel: 'Engaged Leads', icon: '💬', color: '#d946ef' },
  { id: 'core', label: 'Core Offer', sublabel: 'Sales', icon: '💰', color: '#f59e0b' },
  { id: 'upsell', label: 'Upsell', sublabel: 'Conversions', icon: '⬆️', color: '#22c55e' },
  { id: 'downsell', label: 'Downsell', sublabel: 'Conversions', icon: '⬇️', color: '#06b6d4' },
  { id: 'continuity', label: 'Continuity', sublabel: 'Subscribers', icon: '🔄', color: '#3b82f6' }
]

function FunnelCalculator() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [mode, setMode] = useState('actual') // 'actual' or 'planner'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Actual mode values
  const [actualValues, setActualValues] = useState({
    awareness: '',
    attraction: '',
    leadmagnet: '',
    nurture: '',
    core: '',
    upsell: '',
    downsell: '',
    continuity: ''
  })

  // Planner mode values
  const [plannerValues, setPlannerValues] = useState({
    awareness: '1000', // Start with 1000 people reached
    attraction: '',
    leadmagnet: '',
    nurture: '',
    core: '',
    upsell: '',
    downsell: '',
    continuity: ''
  })

  // Custom conversion rates for planner
  const [customRates, setCustomRates] = useState({ ...INDUSTRY_AVERAGES })
  const [useCustomRates, setUseCustomRates] = useState(false)

  // Revenue inputs
  const [prices, setPrices] = useState({
    core: '',
    upsell: '',
    downsell: '',
    continuity: ''
  })

  // Load saved data
  useEffect(() => {
    if (user) {
      loadSavedData()
    } else {
      setLoading(false)
    }
  }, [user])

  async function loadSavedData() {
    try {
      const { data, error } = await supabase
        .from('funnel_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error loading funnel metrics:', error)
      }

      if (data) {
        if (data.actual_values) setActualValues(data.actual_values)
        if (data.planner_values) setPlannerValues(data.planner_values)
        if (data.custom_rates) {
          setCustomRates(data.custom_rates)
          setUseCustomRates(true)
        }
        if (data.prices) setPrices(data.prices)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('funnel_metrics')
        .upsert({
          user_id: user.id,
          actual_values: actualValues,
          planner_values: plannerValues,
          custom_rates: useCustomRates ? customRates : null,
          prices: prices,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  // Calculate conversion rates from actual values
  const actualConversions = useMemo(() => {
    const vals = actualValues
    const toNum = (v) => parseFloat(v) || 0

    return {
      awareness_to_attraction: toNum(vals.awareness) > 0
        ? (toNum(vals.attraction) / toNum(vals.awareness) * 100).toFixed(1)
        : '-',
      attraction_to_leadmagnet: toNum(vals.attraction) > 0
        ? (toNum(vals.leadmagnet) / toNum(vals.attraction) * 100).toFixed(1)
        : '-',
      leadmagnet_to_nurture: toNum(vals.leadmagnet) > 0
        ? (toNum(vals.nurture) / toNum(vals.leadmagnet) * 100).toFixed(1)
        : '-',
      nurture_to_core: toNum(vals.nurture) > 0
        ? (toNum(vals.core) / toNum(vals.nurture) * 100).toFixed(1)
        : '-',
      core_to_upsell: toNum(vals.core) > 0
        ? (toNum(vals.upsell) / toNum(vals.core) * 100).toFixed(1)
        : '-',
      core_to_downsell: toNum(vals.core) > 0
        ? (toNum(vals.downsell) / toNum(vals.core) * 100).toFixed(1)
        : '-',
      core_to_continuity: toNum(vals.core) > 0
        ? (toNum(vals.continuity) / toNum(vals.core) * 100).toFixed(1)
        : '-'
    }
  }, [actualValues])

  // Calculate planner values based on awareness and conversion rates
  const calculatedPlannerValues = useMemo(() => {
    const awareness = parseFloat(plannerValues.awareness) || 0
    const rates = useCustomRates ? customRates : INDUSTRY_AVERAGES

    const attraction = Math.round(awareness * rates.awareness_to_attraction)
    const leadmagnet = Math.round(attraction * rates.attraction_to_leadmagnet)
    const nurture = Math.round(leadmagnet * rates.leadmagnet_to_nurture)
    const core = Math.round(nurture * rates.nurture_to_core)
    const upsell = Math.round(core * rates.core_to_upsell)
    const downsell = Math.round((core - upsell) * rates.core_to_downsell)
    const continuity = Math.round(core * rates.core_to_continuity)

    return { awareness, attraction, leadmagnet, nurture, core, upsell, downsell, continuity }
  }, [plannerValues.awareness, customRates, useCustomRates])

  // Calculate revenue projections
  const revenueProjection = useMemo(() => {
    const vals = mode === 'actual' ? actualValues : calculatedPlannerValues
    const p = prices

    const coreRev = (parseFloat(vals.core) || 0) * (parseFloat(p.core) || 0)
    const upsellRev = (parseFloat(vals.upsell) || 0) * (parseFloat(p.upsell) || 0)
    const downsellRev = (parseFloat(vals.downsell) || 0) * (parseFloat(p.downsell) || 0)
    const continuityRev = (parseFloat(vals.continuity) || 0) * (parseFloat(p.continuity) || 0)

    return {
      core: coreRev,
      upsell: upsellRev,
      downsell: downsellRev,
      continuity: continuityRev,
      total: coreRev + upsellRev + downsellRev + continuityRev
    }
  }, [mode, actualValues, calculatedPlannerValues, prices])

  function handleActualChange(field, value) {
    setActualValues(prev => ({ ...prev, [field]: value }))
  }

  function handlePlannerChange(field, value) {
    setPlannerValues(prev => ({ ...prev, [field]: value }))
  }

  function handleRateChange(field, value) {
    const numValue = parseFloat(value) / 100 // Convert percentage to decimal
    setCustomRates(prev => ({ ...prev, [field]: numValue }))
  }

  function handlePriceChange(field, value) {
    setPrices(prev => ({ ...prev, [field]: value }))
  }

  function resetToIndustryAverages() {
    setCustomRates({ ...INDUSTRY_AVERAGES })
    setUseCustomRates(false)
  }

  if (loading) {
    return (
      <div className="funnel-calculator flow-base">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your funnel data...</p>
        </div>
      </div>
    )
  }

  const currentValues = mode === 'actual' ? actualValues : calculatedPlannerValues
  const currentRates = useCustomRates ? customRates : INDUSTRY_AVERAGES

  return (
    <div className="funnel-calculator flow-base">
      <BackButton onClick={() => navigate('/7-day-challenge')} />

      <div className="fc-header">
        <h1>Funnel Calculator</h1>
        <p className="fc-subtitle">Track your actual metrics or plan with projections</p>

        <div className="fc-mode-toggle">
          <button
            className={`fc-mode-btn ${mode === 'actual' ? 'active' : ''}`}
            onClick={() => setMode('actual')}
          >
            Actual Tracking
          </button>
          <button
            className={`fc-mode-btn ${mode === 'planner' ? 'active' : ''}`}
            onClick={() => setMode('planner')}
          >
            Planner Mode
          </button>
        </div>
      </div>

      {mode === 'planner' && (
        <div className="fc-planner-controls">
          <div className="fc-awareness-input">
            <label>Start with how many people reached:</label>
            <input
              type="number"
              value={plannerValues.awareness}
              onChange={(e) => handlePlannerChange('awareness', e.target.value)}
              placeholder="1000"
            />
          </div>

          <div className="fc-rates-toggle">
            <label>
              <input
                type="checkbox"
                checked={useCustomRates}
                onChange={(e) => setUseCustomRates(e.target.checked)}
              />
              Customize conversion rates
            </label>
            {useCustomRates && (
              <button className="fc-reset-btn" onClick={resetToIndustryAverages}>
                Reset to Industry Averages
              </button>
            )}
          </div>
        </div>
      )}

      {/* Funnel Visualization */}
      <div className="fc-funnel">
        {FUNNEL_STAGES.map((stage, index) => {
          const value = currentValues[stage.id]
          const prevStage = FUNNEL_STAGES[index - 1]
          const conversionKey = prevStage
            ? `${prevStage.id}_to_${stage.id}`
            : null

          // Get conversion rate
          let conversionRate = null
          if (conversionKey && mode === 'actual') {
            conversionRate = actualConversions[conversionKey]
          } else if (conversionKey && mode === 'planner') {
            const rateValue = currentRates[conversionKey]
            conversionRate = rateValue ? (rateValue * 100).toFixed(1) : null
          }

          return (
            <div key={stage.id} className="fc-stage">
              {index > 0 && (
                <div className="fc-conversion-rate">
                  {mode === 'planner' && useCustomRates ? (
                    <input
                      type="number"
                      className="fc-rate-input"
                      value={(currentRates[conversionKey] * 100).toFixed(1)}
                      onChange={(e) => handleRateChange(conversionKey, e.target.value)}
                      step="0.1"
                    />
                  ) : (
                    <span className="fc-rate-display">{conversionRate}%</span>
                  )}
                  <span className="fc-rate-arrow">↓</span>
                </div>
              )}

              <div
                className="fc-stage-bar"
                style={{
                  '--stage-color': stage.color,
                  '--stage-width': `${Math.max(20, 100 - (index * 10))}%`
                }}
              >
                <div className="fc-stage-icon">{stage.icon}</div>
                <div className="fc-stage-info">
                  <span className="fc-stage-label">{stage.label}</span>
                  <span className="fc-stage-sublabel">{stage.sublabel}</span>
                </div>
                <div className="fc-stage-value">
                  {mode === 'actual' ? (
                    <input
                      type="number"
                      value={actualValues[stage.id]}
                      onChange={(e) => handleActualChange(stage.id, e.target.value)}
                      placeholder="0"
                    />
                  ) : (
                    <span className="fc-calculated-value">
                      {typeof value === 'number' ? value.toLocaleString() : value || '0'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Section */}
      <div className="fc-revenue-section">
        <h3>Revenue Calculation</h3>
        <p className="fc-revenue-subtitle">Enter your prices to see revenue projections</p>

        <div className="fc-price-inputs">
          <div className="fc-price-row">
            <label>Core Offer Price:</label>
            <div className="fc-price-input">
              <span className="fc-currency">$</span>
              <input
                type="number"
                value={prices.core}
                onChange={(e) => handlePriceChange('core', e.target.value)}
                placeholder="0"
              />
            </div>
            <span className="fc-revenue-result">
              = ${revenueProjection.core.toLocaleString()}
            </span>
          </div>

          <div className="fc-price-row">
            <label>Upsell Price:</label>
            <div className="fc-price-input">
              <span className="fc-currency">$</span>
              <input
                type="number"
                value={prices.upsell}
                onChange={(e) => handlePriceChange('upsell', e.target.value)}
                placeholder="0"
              />
            </div>
            <span className="fc-revenue-result">
              = ${revenueProjection.upsell.toLocaleString()}
            </span>
          </div>

          <div className="fc-price-row">
            <label>Downsell Price:</label>
            <div className="fc-price-input">
              <span className="fc-currency">$</span>
              <input
                type="number"
                value={prices.downsell}
                onChange={(e) => handlePriceChange('downsell', e.target.value)}
                placeholder="0"
              />
            </div>
            <span className="fc-revenue-result">
              = ${revenueProjection.downsell.toLocaleString()}
            </span>
          </div>

          <div className="fc-price-row">
            <label>Continuity (monthly):</label>
            <div className="fc-price-input">
              <span className="fc-currency">$</span>
              <input
                type="number"
                value={prices.continuity}
                onChange={(e) => handlePriceChange('continuity', e.target.value)}
                placeholder="0"
              />
            </div>
            <span className="fc-revenue-result">
              = ${revenueProjection.continuity.toLocaleString()}/mo
            </span>
          </div>
        </div>

        <div className="fc-total-revenue">
          <span className="fc-total-label">Total Revenue:</span>
          <span className="fc-total-value">${revenueProjection.total.toLocaleString()}</span>
          {revenueProjection.continuity > 0 && (
            <span className="fc-recurring-note">+ ${revenueProjection.continuity.toLocaleString()}/mo recurring</span>
          )}
        </div>
      </div>

      {/* Industry Benchmarks (shown in planner mode) */}
      {mode === 'planner' && !useCustomRates && (
        <div className="fc-benchmarks">
          <h4>Industry Average Conversion Rates</h4>
          <div className="fc-benchmark-list">
            <div className="fc-benchmark-item">
              <span>Awareness → Attraction:</span>
              <span>{(INDUSTRY_AVERAGES.awareness_to_attraction * 100).toFixed(0)}%</span>
            </div>
            <div className="fc-benchmark-item">
              <span>Attraction → Lead Magnet:</span>
              <span>{(INDUSTRY_AVERAGES.attraction_to_leadmagnet * 100).toFixed(0)}%</span>
            </div>
            <div className="fc-benchmark-item">
              <span>Lead Magnet → Nurture:</span>
              <span>{(INDUSTRY_AVERAGES.leadmagnet_to_nurture * 100).toFixed(0)}%</span>
            </div>
            <div className="fc-benchmark-item">
              <span>Nurture → Core Sale:</span>
              <span>{(INDUSTRY_AVERAGES.nurture_to_core * 100).toFixed(0)}%</span>
            </div>
            <div className="fc-benchmark-item">
              <span>Core → Upsell:</span>
              <span>{(INDUSTRY_AVERAGES.core_to_upsell * 100).toFixed(0)}%</span>
            </div>
            <div className="fc-benchmark-item">
              <span>Non-Upsell → Downsell:</span>
              <span>{(INDUSTRY_AVERAGES.core_to_downsell * 100).toFixed(0)}%</span>
            </div>
            <div className="fc-benchmark-item">
              <span>Core → Continuity:</span>
              <span>{(INDUSTRY_AVERAGES.core_to_continuity * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {user && (
        <div className="fc-actions">
          <button
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Funnel Data'}
          </button>
        </div>
      )}
    </div>
  )
}

export default FunnelCalculator
