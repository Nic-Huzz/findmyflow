/**
 * PTUF Calculator - Price To Unit Formula
 * Based on Alex Hormozi's $100M Offers pricing framework
 * Helps calculate optimal pricing based on desired income and capacity
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './PTUFCalculator.css'

export default function PTUFCalculator() {
  const navigate = useNavigate()

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

  const calculations = useMemo(() => {
    // Basic capacity
    const totalHoursPerYear = hoursPerWeek * weeksPerYear
    const hoursForClients = totalHoursPerYear * 0.6 // 60% client work
    const maxClientsPerYear = Math.floor(hoursForClients / (clientHoursPerMonth * 12))

    // Revenue requirements
    const monthlyGoal = annualGoal / 12
    const profitMargin = ((monthlyGoal - monthlyExpenses) / monthlyGoal) * 100

    // LTV calculation
    const ltv = coreOfferPrice + (continuityPrice * continuityMonths)

    // Clients needed
    const clientsNeeded = Math.ceil(annualGoal / ltv)
    const clientsPerMonth = Math.ceil(clientsNeeded / 12)

    // Leads needed (working backwards)
    const leadsPerMonth = Math.ceil(clientsPerMonth / (leadToSale / 100))
    const showsPerMonth = Math.ceil(leadsPerMonth / (showToLead / 100))

    // Can you handle it?
    const capacityUtilization = (clientsNeeded / maxClientsPerYear) * 100
    const isOverCapacity = capacityUtilization > 100

    // Minimum viable price
    const minPrice = Math.ceil(annualGoal / maxClientsPerYear)

    // Hourly equivalent
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

  return (
    <div className="ptuf-calculator">
      <header className="ptuf-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>PTUF Calculator</h1>
          <p>Price To Unit Formula - Find Your Magic Number</p>
        </div>
      </header>

      <div className="ptuf-grid">
        {/* Income Goals */}
        <section className="ptuf-section">
          <h2>💰 Income Goals</h2>
          <div className="input-group">
            <label>Annual Revenue Goal</label>
            <div className="input-with-prefix">
              <span>$</span>
              <input
                type="number"
                value={annualGoal}
                onChange={e => setAnnualGoal(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Monthly Expenses</label>
            <div className="input-with-prefix">
              <span>$</span>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={e => setMonthlyExpenses(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="calc-result">
            <span>Monthly Goal</span>
            <strong>${calculations.monthlyGoal.toLocaleString()}</strong>
          </div>
          <div className="calc-result">
            <span>Profit Margin</span>
            <strong className={calculations.profitMargin > 30 ? 'positive' : 'warning'}>
              {calculations.profitMargin.toFixed(1)}%
            </strong>
          </div>
        </section>

        {/* Capacity */}
        <section className="ptuf-section">
          <h2>⏰ Your Capacity</h2>
          <div className="input-group">
            <label>Hours Per Week (for business)</label>
            <input
              type="number"
              value={hoursPerWeek}
              onChange={e => setHoursPerWeek(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="input-group">
            <label>Working Weeks Per Year</label>
            <input
              type="number"
              value={weeksPerYear}
              onChange={e => setWeeksPerYear(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="input-group">
            <label>Hours Per Client Per Month</label>
            <input
              type="number"
              value={clientHoursPerMonth}
              onChange={e => setClientHoursPerMonth(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="calc-result">
            <span>Max Clients/Year</span>
            <strong>{calculations.maxClientsPerYear}</strong>
          </div>
        </section>

        {/* Pricing */}
        <section className="ptuf-section">
          <h2>💵 Your Pricing</h2>
          <div className="input-group">
            <label>Core Offer Price</label>
            <div className="input-with-prefix">
              <span>$</span>
              <input
                type="number"
                value={coreOfferPrice}
                onChange={e => setCoreOfferPrice(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Continuity Price (monthly)</label>
            <div className="input-with-prefix">
              <span>$</span>
              <input
                type="number"
                value={continuityPrice}
                onChange={e => setContinuityPrice(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Avg Continuity Months</label>
            <input
              type="number"
              value={continuityMonths}
              onChange={e => setContinuityMonths(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="calc-result highlight">
            <span>Customer LTV</span>
            <strong>${calculations.ltv.toLocaleString()}</strong>
          </div>
          <div className="calc-result">
            <span>Hourly Equivalent</span>
            <strong>${calculations.hourlyEquivalent.toFixed(0)}/hr</strong>
          </div>
        </section>

        {/* Conversion */}
        <section className="ptuf-section">
          <h2>📊 Conversion Rates</h2>
          <div className="input-group">
            <label>Lead → Sale Rate</label>
            <div className="input-with-suffix">
              <input
                type="number"
                value={leadToSale}
                onChange={e => setLeadToSale(parseInt(e.target.value) || 0)}
              />
              <span>%</span>
            </div>
          </div>
          <div className="input-group">
            <label>Show → Lead Rate</label>
            <div className="input-with-suffix">
              <input
                type="number"
                value={showToLead}
                onChange={e => setShowToLead(parseInt(e.target.value) || 0)}
              />
              <span>%</span>
            </div>
          </div>
        </section>
      </div>

      {/* Results Dashboard */}
      <section className="ptuf-results">
        <h2>🎯 Your Numbers</h2>

        <div className="results-grid">
          <div className="result-card">
            <span className="result-label">Clients Needed/Year</span>
            <span className="result-value">{calculations.clientsNeeded}</span>
          </div>
          <div className="result-card">
            <span className="result-label">Clients/Month</span>
            <span className="result-value">{calculations.clientsPerMonth}</span>
          </div>
          <div className="result-card">
            <span className="result-label">Leads/Month</span>
            <span className="result-value">{calculations.leadsPerMonth}</span>
          </div>
          <div className="result-card">
            <span className="result-label">Shows/Month</span>
            <span className="result-value">{calculations.showsPerMonth}</span>
          </div>
        </div>

        {/* Capacity Warning */}
        <div className={`capacity-indicator ${calculations.isOverCapacity ? 'over' : 'under'}`}>
          <div className="capacity-bar">
            <div
              className="capacity-fill"
              style={{ width: `${Math.min(100, calculations.capacityUtilization)}%` }}
            ></div>
          </div>
          <div className="capacity-info">
            <span>Capacity Utilization: {calculations.capacityUtilization.toFixed(0)}%</span>
            {calculations.isOverCapacity && (
              <span className="warning-text">
                ⚠️ Over capacity! Minimum price should be ${calculations.minPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="action-items">
          <h3>📋 Daily Actions Required</h3>
          <div className="action-grid">
            <div className="action-item">
              <span className="action-number">{Math.ceil(calculations.showsPerMonth / 20)}</span>
              <span className="action-label">Shows/Day (20 workdays)</span>
            </div>
            <div className="action-item">
              <span className="action-number">{Math.ceil(calculations.leadsPerMonth / 20)}</span>
              <span className="action-label">Leads/Day</span>
            </div>
            <div className="action-item">
              <span className="action-number">{Math.ceil(calculations.clientsPerMonth / 4)}</span>
              <span className="action-label">Sales/Week</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
