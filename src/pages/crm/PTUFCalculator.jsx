/**
 * PTUF Calculator - Price To Unit Formula
 * Based on Alex Hormozi's $100M Offers pricing framework
 * Helps calculate optimal pricing based on desired income and capacity
 *
 * Pre-populates from challenge data:
 * - launch_readiness_assessments → core offer price
 * - continuity_assessments → continuity price
 * - funnel_metrics → actual conversion rates
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { fetchLaunchReadiness, getFunnelTrends } from '../../lib/crm'
import { supabase } from '../../lib/supabaseClient'
import './PTUFCalculator.css'

export default function PTUFCalculator() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loadingDefaults, setLoadingDefaults] = useState(true)
  const [dataSource, setDataSource] = useState(null)

  // Income Goals
  const [annualGoal, setAnnualGoal] = useState(100000)
  const [monthlyExpenses, setMonthlyExpenses] = useState(3000)

  // Capacity
  const [hoursPerWeek, setHoursPerWeek] = useState(20)
  const [weeksPerYear, setWeeksPerYear] = useState(48)
  const [clientHoursPerMonth, setClientHoursPerMonth] = useState(4)

  // Product Mix
  const [coreOfferPrice, setCoreOfferPrice] = useState(997)
  const [continuityPrice, setContinuityPrice] = useState(97)
  const [continuityMonths, setContinuityMonths] = useState(6)

  // Conversion Rates
  const [leadToSale, setLeadToSale] = useState(5)
  const [showToLead, setShowToLead] = useState(20)

  // Pre-populate from challenge data
  useEffect(() => {
    if (!user) {
      setLoadingDefaults(false)
      return
    }

    async function loadDefaults() {
      try {
        const sources = []

        const [launchReadiness, continuityData, funnelTrends] = await Promise.all([
          fetchLaunchReadiness(user.id),
          supabase
            .from('continuity_assessments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          getFunnelTrends(user.id, 1)
        ])

        if (launchReadiness?.pricing_data?.coreOfferPrice) {
          setCoreOfferPrice(launchReadiness.pricing_data.coreOfferPrice)
          sources.push('Launch Readiness')
        }

        if (continuityData?.data?.monthly_price) {
          setContinuityPrice(continuityData.data.monthly_price)
          sources.push('Continuity Flow')
        }
        if (continuityData?.data?.avg_retention_months) {
          setContinuityMonths(continuityData.data.avg_retention_months)
        }

        if (funnelTrends && funnelTrends.length > 0) {
          const latest = funnelTrends[0]
          if (latest.rates) {
            const nurtureToCore = parseFloat(latest.rates.nurtureToCore)
            if (nurtureToCore > 0) {
              setLeadToSale(Math.round(nurtureToCore))
              sources.push('Funnel Baseline')
            }
          }
        }

        if (sources.length > 0) {
          setDataSource(sources.join(', '))
        }
      } catch (err) {
        console.error('Error loading PTUF defaults:', err)
      } finally {
        setLoadingDefaults(false)
      }
    }

    loadDefaults()
  }, [user])

  const calculations = useMemo(() => {
    const totalHoursPerYear = hoursPerWeek * weeksPerYear
    const hoursForClients = totalHoursPerYear * 0.6
    const maxClientsPerYear = Math.floor(hoursForClients / (clientHoursPerMonth * 12))

    const monthlyGoal = annualGoal / 12
    const profitMargin = ((monthlyGoal - monthlyExpenses) / monthlyGoal) * 100

    const ltv = coreOfferPrice + (continuityPrice * continuityMonths)

    const clientsNeeded = Math.ceil(annualGoal / ltv)
    const clientsPerMonth = Math.ceil(clientsNeeded / 12)

    const leadsPerMonth = Math.ceil(clientsPerMonth / (leadToSale / 100))
    const showsPerMonth = Math.ceil(leadsPerMonth / (showToLead / 100))

    const capacityUtilization = (clientsNeeded / maxClientsPerYear) * 100
    const isOverCapacity = capacityUtilization > 100

    const minPrice = Math.ceil(annualGoal / maxClientsPerYear)

    const hourlyEquivalent = ltv / (clientHoursPerMonth * continuityMonths)

    return {
      monthlyGoal,
      profitMargin,
      ltv,
      clientsNeeded,
      clientsPerMonth,
      leadsPerMonth,
      showsPerMonth,
      maxClientsPerYear,
      capacityUtilization,
      isOverCapacity,
      minPrice,
      hourlyEquivalent,
    }
  }, [annualGoal, monthlyExpenses, hoursPerWeek, weeksPerYear, clientHoursPerMonth,
      coreOfferPrice, continuityPrice, continuityMonths, leadToSale, showToLead])

  if (loadingDefaults) {
    return (
      <div className="ptuf-calculator">
        <div className="ptuf-toolbar">
          <button className="ptuf-back" onClick={() => navigate('/crm/tools/calculators')}>←</button>
          <h2 className="ptuf-toolbar-title">PTUF Calculator</h2>
        </div>
        <div className="ptuf-loading">
          <div className="ptuf-spinner" />
          <p>Loading your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ptuf-calculator">
      {/* TOOLBAR */}
      <div className="ptuf-toolbar">
        <button className="ptuf-back" onClick={() => navigate('/crm/tools/calculators')}>←</button>
        <h2 className="ptuf-toolbar-title">PTUF Calculator</h2>
      </div>

      {/* HERO — Key Results */}
      <div className="ptuf-hero">
        <span className="ptuf-hero-label">Price To Unit Formula</span>
        <h2 className="ptuf-hero-title">Your Magic Number</h2>
        {dataSource && (
          <p className="ptuf-hero-sub">Pre-populated from: {dataSource}</p>
        )}
        <div className="ptuf-hero-stats">
          <div className="ptuf-hero-stat">
            <span className="ptuf-hero-stat-value gold">${calculations.ltv.toLocaleString()}</span>
            <span className="ptuf-hero-stat-label">Customer LTV</span>
          </div>
          <div className="ptuf-hero-stat">
            <span className="ptuf-hero-stat-value">{calculations.clientsPerMonth}</span>
            <span className="ptuf-hero-stat-label">Clients/Month</span>
          </div>
          <div className="ptuf-hero-stat">
            <span className="ptuf-hero-stat-value">{calculations.leadsPerMonth}</span>
            <span className="ptuf-hero-stat-label">Leads/Month</span>
          </div>
          <div className="ptuf-hero-stat">
            <span className="ptuf-hero-stat-value">${calculations.hourlyEquivalent.toFixed(0)}/hr</span>
            <span className="ptuf-hero-stat-label">Hourly Equiv</span>
          </div>
        </div>
      </div>

      {/* INPUT SECTIONS */}
      <div className="ptuf-sections">
        {/* Income Goals */}
        <div className="ptuf-card">
          <div className="ptuf-section-header">
            <div className="ptuf-section-icon">💰</div>
            <span className="ptuf-section-title">Income Goals</span>
          </div>
          <div className="ptuf-field">
            <label>Annual Revenue Goal</label>
            <div className="ptuf-input-wrap prefix">
              <span className="ptuf-input-affix">$</span>
              <input
                type="number"
                value={annualGoal}
                onChange={e => setAnnualGoal(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="ptuf-field">
            <label>Monthly Expenses</label>
            <div className="ptuf-input-wrap prefix">
              <span className="ptuf-input-affix">$</span>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={e => setMonthlyExpenses(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="ptuf-inline-results">
            <div className="ptuf-inline-result">
              <span>Monthly Goal</span>
              <strong>${calculations.monthlyGoal.toLocaleString()}</strong>
            </div>
            <div className="ptuf-inline-result">
              <span>Profit Margin</span>
              <strong className={calculations.profitMargin > 30 ? 'positive' : 'warning'}>
                {calculations.profitMargin.toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="ptuf-card">
          <div className="ptuf-section-header">
            <div className="ptuf-section-icon">⏰</div>
            <span className="ptuf-section-title">Your Capacity</span>
          </div>
          <div className="ptuf-field">
            <label>Hours Per Week (for business)</label>
            <input
              type="number"
              value={hoursPerWeek}
              onChange={e => setHoursPerWeek(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="ptuf-field">
            <label>Working Weeks Per Year</label>
            <input
              type="number"
              value={weeksPerYear}
              onChange={e => setWeeksPerYear(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="ptuf-field">
            <label>Hours Per Client Per Month</label>
            <input
              type="number"
              value={clientHoursPerMonth}
              onChange={e => setClientHoursPerMonth(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="ptuf-inline-results">
            <div className="ptuf-inline-result">
              <span>Max Clients/Year</span>
              <strong>{calculations.maxClientsPerYear}</strong>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="ptuf-card">
          <div className="ptuf-section-header">
            <div className="ptuf-section-icon">💵</div>
            <span className="ptuf-section-title">Your Pricing</span>
          </div>
          <div className="ptuf-field">
            <label>Core Offer Price</label>
            <div className="ptuf-input-wrap prefix">
              <span className="ptuf-input-affix">$</span>
              <input
                type="number"
                value={coreOfferPrice}
                onChange={e => setCoreOfferPrice(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="ptuf-field">
            <label>Continuity Price (monthly)</label>
            <div className="ptuf-input-wrap prefix">
              <span className="ptuf-input-affix">$</span>
              <input
                type="number"
                value={continuityPrice}
                onChange={e => setContinuityPrice(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="ptuf-field">
            <label>Avg Continuity Months</label>
            <input
              type="number"
              value={continuityMonths}
              onChange={e => setContinuityMonths(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="ptuf-card">
          <div className="ptuf-section-header">
            <div className="ptuf-section-icon">📊</div>
            <span className="ptuf-section-title">Conversion Rates</span>
          </div>
          <div className="ptuf-field">
            <label>Lead → Sale Rate</label>
            <div className="ptuf-input-wrap suffix">
              <input
                type="number"
                value={leadToSale}
                onChange={e => setLeadToSale(parseInt(e.target.value) || 0)}
              />
              <span className="ptuf-input-affix">%</span>
            </div>
          </div>
          <div className="ptuf-field">
            <label>Show → Lead Rate</label>
            <div className="ptuf-input-wrap suffix">
              <input
                type="number"
                value={showToLead}
                onChange={e => setShowToLead(parseInt(e.target.value) || 0)}
              />
              <span className="ptuf-input-affix">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY ACTIONS CARD */}
      <div className="ptuf-card">
        <div className="ptuf-section-header">
          <div className="ptuf-section-icon">📋</div>
          <span className="ptuf-section-title">Daily Actions Required</span>
        </div>
        <div className="ptuf-actions-grid">
          <div className="ptuf-action-item">
            <span className="ptuf-action-number">{Math.ceil(calculations.showsPerMonth / 20)}</span>
            <span className="ptuf-action-label">Shows/Day</span>
          </div>
          <div className="ptuf-action-item">
            <span className="ptuf-action-number">{Math.ceil(calculations.leadsPerMonth / 20)}</span>
            <span className="ptuf-action-label">Leads/Day</span>
          </div>
          <div className="ptuf-action-item">
            <span className="ptuf-action-number">{Math.ceil(calculations.clientsPerMonth / 4)}</span>
            <span className="ptuf-action-label">Sales/Week</span>
          </div>
        </div>
      </div>

      {/* CAPACITY BAR */}
      <div className={`ptuf-capacity ${calculations.isOverCapacity ? 'over' : 'under'}`}>
        <div className="ptuf-capacity-bar">
          <div
            className="ptuf-capacity-fill"
            style={{ width: `${Math.min(100, calculations.capacityUtilization)}%` }}
          />
        </div>
        <div className="ptuf-capacity-info">
          <span>Capacity: {calculations.capacityUtilization.toFixed(0)}%</span>
          {calculations.isOverCapacity && (
            <span className="ptuf-capacity-warn">
              Over capacity! Min price: ${calculations.minPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
