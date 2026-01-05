/**
 * LTV Calculator - Lifetime Value Calculator
 * Calculates customer lifetime value with multiple revenue streams
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './LTVCalculator.css'

export default function LTVCalculator() {
  const navigate = useNavigate()

  // Initial Sale
  const [attractionOffer, setAttractionOffer] = useState(47)
  const [attractionConversion, setAttractionConversion] = useState(100)
  const [coreOffer, setCoreOffer] = useState(497)
  const [coreConversion, setCoreConversion] = useState(20)

  // Upsells
  const [upsellPrice, setUpsellPrice] = useState(997)
  const [upsellRate, setUpsellRate] = useState(15)
  const [downsellPrice, setDownsellPrice] = useState(197)
  const [downsellRate, setDownsellRate] = useState(25)

  // Continuity
  const [continuityPrice, setContinuityPrice] = useState(97)
  const [continuityRate, setContinuityRate] = useState(30)
  const [avgMonths, setAvgMonths] = useState(6)
  const [churnRate, setChurnRate] = useState(10)

  // Referrals
  const [referralRate, setReferralRate] = useState(10)
  const [referralsPerCustomer, setReferralsPerCustomer] = useState(0.5)

  const calculations = useMemo(() => {
    // Front-end value (per 100 customers at attraction offer)
    const attractionRevenue = attractionOffer * (attractionConversion / 100) * 100
    const coreRevenue = coreOffer * (coreConversion / 100) * 100
    const frontEndTotal = attractionRevenue + coreRevenue

    // Upsell/Downsell value (based on core buyers)
    const coreBuyers = (coreConversion / 100) * 100
    const upsellRevenue = upsellPrice * (upsellRate / 100) * coreBuyers
    const nonUpsellBuyers = coreBuyers * (1 - upsellRate / 100)
    const downsellRevenue = downsellPrice * (downsellRate / 100) * nonUpsellBuyers

    // Continuity value
    const continuityBuyers = coreBuyers * (continuityRate / 100)
    const continuityRevenue = continuityPrice * avgMonths * continuityBuyers

    // Total before referrals
    const directRevenue = frontEndTotal + upsellRevenue + downsellRevenue + continuityRevenue

    // Referral value (recursive)
    const referralMultiplier = 1 / (1 - (referralRate / 100) * referralsPerCustomer)
    const totalWithReferrals = directRevenue * referralMultiplier

    // Per customer metrics
    const ltvPerCustomer = totalWithReferrals / 100
    const avgRevenuePerCoreBuyer = totalWithReferrals / coreBuyers

    // Retention metrics
    const monthlyChurnDecimal = churnRate / 100
    const avgLifetimeMonths = monthlyChurnDecimal > 0 ? 1 / monthlyChurnDecimal : avgMonths
    const annualRetentionRate = Math.pow(1 - monthlyChurnDecimal, 12) * 100

    return {
      attractionRevenue,
      coreRevenue,
      frontEndTotal,
      upsellRevenue,
      downsellRevenue,
      continuityRevenue,
      directRevenue,
      totalWithReferrals,
      ltvPerCustomer,
      avgRevenuePerCoreBuyer,
      coreBuyers,
      avgLifetimeMonths,
      annualRetentionRate,
    }
  }, [attractionOffer, attractionConversion, coreOffer, coreConversion,
      upsellPrice, upsellRate, downsellPrice, downsellRate,
      continuityPrice, continuityRate, avgMonths, churnRate,
      referralRate, referralsPerCustomer])

  return (
    <div className="ltv-calculator">
      <header className="ltv-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>LTV Calculator</h1>
          <p>Customer Lifetime Value Analysis</p>
        </div>
      </header>

      <div className="ltv-grid">
        {/* Front-End Offers */}
        <section className="ltv-section">
          <h2>🎯 Front-End Offers</h2>
          <div className="offer-row">
            <div className="input-group">
              <label>Attraction Offer Price</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  value={attractionOffer}
                  onChange={e => setAttractionOffer(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Conversion Rate</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={attractionConversion}
                  onChange={e => setAttractionConversion(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="offer-row">
            <div className="input-group">
              <label>Core Offer Price</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  value={coreOffer}
                  onChange={e => setCoreOffer(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Conversion Rate</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={coreConversion}
                  onChange={e => setCoreConversion(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="section-total">
            <span>Front-End Revenue (per 100 leads)</span>
            <strong>${calculations.frontEndTotal.toLocaleString()}</strong>
          </div>
        </section>

        {/* Upsells & Downsells */}
        <section className="ltv-section">
          <h2>⬆️ Upsells & Downsells</h2>
          <div className="offer-row">
            <div className="input-group">
              <label>Upsell Price</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  value={upsellPrice}
                  onChange={e => setUpsellPrice(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Take Rate</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={upsellRate}
                  onChange={e => setUpsellRate(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="offer-row">
            <div className="input-group">
              <label>Downsell Price</label>
              <div className="input-with-prefix">
                <span>$</span>
                <input
                  type="number"
                  value={downsellPrice}
                  onChange={e => setDownsellPrice(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Take Rate</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={downsellRate}
                  onChange={e => setDownsellRate(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="section-total">
            <span>Upsell/Downsell Revenue</span>
            <strong>${(calculations.upsellRevenue + calculations.downsellRevenue).toLocaleString()}</strong>
          </div>
        </section>

        {/* Continuity */}
        <section className="ltv-section">
          <h2>🔄 Continuity</h2>
          <div className="offer-row">
            <div className="input-group">
              <label>Monthly Price</label>
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
              <label>Take Rate</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={continuityRate}
                  onChange={e => setContinuityRate(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="offer-row">
            <div className="input-group">
              <label>Avg Months Retained</label>
              <input
                type="number"
                value={avgMonths}
                onChange={e => setAvgMonths(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label>Monthly Churn %</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={churnRate}
                  onChange={e => setChurnRate(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="section-total">
            <span>Continuity Revenue</span>
            <strong>${calculations.continuityRevenue.toLocaleString()}</strong>
          </div>
        </section>

        {/* Referrals */}
        <section className="ltv-section">
          <h2>🗣️ Referral Value</h2>
          <div className="offer-row">
            <div className="input-group">
              <label>Customers Who Refer</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  value={referralRate}
                  onChange={e => setReferralRate(parseInt(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </div>
            <div className="input-group">
              <label>Referrals Per Referrer</label>
              <input
                type="number"
                step="0.1"
                value={referralsPerCustomer}
                onChange={e => setReferralsPerCustomer(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* LTV Summary */}
      <section className="ltv-summary">
        <h2>💎 Lifetime Value Summary</h2>

        <div className="summary-cards">
          <div className="summary-card primary">
            <span className="summary-label">LTV Per Lead</span>
            <span className="summary-value">${calculations.ltvPerCustomer.toFixed(2)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">LTV Per Core Buyer</span>
            <span className="summary-value">${calculations.avgRevenuePerCoreBuyer.toFixed(2)}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Core Buyers (per 100)</span>
            <span className="summary-value">{calculations.coreBuyers}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Avg Lifetime</span>
            <span className="summary-value">{calculations.avgLifetimeMonths.toFixed(1)} mo</span>
          </div>
        </div>

        {/* Waterfall Chart */}
        <div className="waterfall-chart">
          <h3>Revenue Waterfall (per 100 leads)</h3>
          <div className="waterfall-container">
            {(() => {
              const steps = [
                { label: 'Attraction', value: calculations.attractionRevenue, color: '#6366f1' },
                { label: 'Core', value: calculations.coreRevenue, color: '#8b5cf6' },
                { label: 'Upsells', value: calculations.upsellRevenue, color: '#10b981' },
                { label: 'Downsells', value: calculations.downsellRevenue, color: '#f59e0b' },
                { label: 'Continuity', value: calculations.continuityRevenue, color: '#06b6d4' },
              ]
              const maxTotal = calculations.totalWithReferrals
              let runningTotal = 0

              return steps.map((step, index) => {
                const prevTotal = runningTotal
                runningTotal += step.value
                const barBottom = (prevTotal / maxTotal) * 100
                const barHeight = (step.value / maxTotal) * 100

                return (
                  <div key={step.label} className="waterfall-column">
                    <div className="waterfall-value">${step.value.toLocaleString()}</div>
                    <div className="waterfall-bar-container">
                      <div
                        className="waterfall-bar"
                        style={{
                          bottom: `${barBottom}%`,
                          height: `${Math.max(barHeight, 2)}%`,
                          backgroundColor: step.color,
                        }}
                      />
                      {index > 0 && (
                        <div
                          className="waterfall-connector"
                          style={{ bottom: `${barBottom}%` }}
                        />
                      )}
                    </div>
                    <div className="waterfall-label">{step.label}</div>
                    <div className="waterfall-running-total">${runningTotal.toLocaleString()}</div>
                  </div>
                )
              })
            })()}
            <div className="waterfall-column total-column">
              <div className="waterfall-value total-value">${calculations.totalWithReferrals.toLocaleString()}</div>
              <div className="waterfall-bar-container">
                <div
                  className="waterfall-bar total-bar"
                  style={{ bottom: '0%', height: '100%' }}
                />
              </div>
              <div className="waterfall-label">Total</div>
              <div className="waterfall-running-total">with referrals</div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="revenue-breakdown">
          <h3>Revenue Breakdown (per 100 leads)</h3>
          <div className="breakdown-bars">
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span>Attraction Offer</span>
                <span>${calculations.attractionRevenue.toLocaleString()}</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill attraction"
                  style={{ width: `${(calculations.attractionRevenue / calculations.totalWithReferrals) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span>Core Offer</span>
                <span>${calculations.coreRevenue.toLocaleString()}</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill core"
                  style={{ width: `${(calculations.coreRevenue / calculations.totalWithReferrals) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span>Upsells</span>
                <span>${calculations.upsellRevenue.toLocaleString()}</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill upsell"
                  style={{ width: `${(calculations.upsellRevenue / calculations.totalWithReferrals) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span>Downsells</span>
                <span>${calculations.downsellRevenue.toLocaleString()}</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill downsell"
                  style={{ width: `${(calculations.downsellRevenue / calculations.totalWithReferrals) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-label">
                <span>Continuity</span>
                <span>${calculations.continuityRevenue.toLocaleString()}</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="bar-fill continuity"
                  style={{ width: `${(calculations.continuityRevenue / calculations.totalWithReferrals) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="total-row">
            <span>Total Revenue (per 100 leads)</span>
            <strong>${calculations.totalWithReferrals.toLocaleString()}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}
