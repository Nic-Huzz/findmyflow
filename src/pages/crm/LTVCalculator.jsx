/**
 * LTV Calculator - Lifetime Value Calculator
 * Calculates customer lifetime value with multiple revenue streams
 *
 * Pre-populates from challenge data:
 * - offer_stack_builds → attraction offer price
 * - launch_readiness_assessments → core offer price
 * - upsell_assessments → upsell price
 * - downsell_assessments → downsell price
 * - continuity_assessments → continuity price
 * - funnel_metrics → actual conversion rates
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchOfferStackData,
  fetchLaunchReadiness,
  getFunnelTrends
} from '../../lib/crm'
import { supabase } from '../../lib/supabaseClient'
import './LTVCalculator.css'

export default function LTVCalculator() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loadingDefaults, setLoadingDefaults] = useState(true)
  const [dataSource, setDataSource] = useState(null)

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

  useEffect(() => {
    if (!user) {
      setLoadingDefaults(false)
      return
    }

    async function loadDefaults() {
      try {
        const sources = []

        const [offerStack, launchReadiness, funnelTrends, upsellData, downsellData, continuityData] = await Promise.all([
          fetchOfferStackData(user.id),
          fetchLaunchReadiness(user.id),
          getFunnelTrends(user.id, 1),
          supabase.from('upsell_assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('downsell_assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('continuity_assessments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        ])

        if (offerStack?.attraction_offer_price) {
          setAttractionOffer(offerStack.attraction_offer_price)
          sources.push('Offer Stack')
        }

        if (launchReadiness?.pricing_data?.coreOfferPrice) {
          setCoreOffer(launchReadiness.pricing_data.coreOfferPrice)
          sources.push('Launch Readiness')
        }

        if (upsellData?.data?.pricing) {
          setUpsellPrice(upsellData.data.pricing)
          sources.push('Upsell Flow')
        }

        if (downsellData?.data?.pricing) {
          setDownsellPrice(downsellData.data.pricing)
          sources.push('Downsell Flow')
        }

        if (continuityData?.data?.monthly_price) {
          setContinuityPrice(continuityData.data.monthly_price)
          sources.push('Continuity Flow')
        }

        if (funnelTrends && funnelTrends.length > 0) {
          const latest = funnelTrends[0]
          if (latest.rates) {
            const nurtureToCore = parseFloat(latest.rates.nurtureToCore)
            if (nurtureToCore > 0) {
              setCoreConversion(Math.round(nurtureToCore))
              sources.push('Funnel Baseline')
            }
          }
        }

        if (sources.length > 0) {
          setDataSource(sources.join(', '))
        }
      } catch (err) {
        console.error('Error loading LTV defaults:', err)
      } finally {
        setLoadingDefaults(false)
      }
    }

    loadDefaults()
  }, [user])

  const calculations = useMemo(() => {
    const attractionRevenue = attractionOffer * (attractionConversion / 100) * 100
    const coreRevenue = coreOffer * (coreConversion / 100) * 100
    const frontEndTotal = attractionRevenue + coreRevenue

    const coreBuyers = (coreConversion / 100) * 100
    const upsellRevenue = upsellPrice * (upsellRate / 100) * coreBuyers
    const nonUpsellBuyers = coreBuyers * (1 - upsellRate / 100)
    const downsellRevenue = downsellPrice * (downsellRate / 100) * nonUpsellBuyers

    const continuityBuyers = coreBuyers * (continuityRate / 100)
    const continuityRevenue = continuityPrice * avgMonths * continuityBuyers

    const directRevenue = frontEndTotal + upsellRevenue + downsellRevenue + continuityRevenue

    const referralMultiplier = 1 / (1 - (referralRate / 100) * referralsPerCustomer)
    const totalWithReferrals = directRevenue * referralMultiplier

    const ltvPerCustomer = totalWithReferrals / 100
    const avgRevenuePerCoreBuyer = totalWithReferrals / coreBuyers

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

  if (loadingDefaults) {
    return (
      <div className="ltv-calculator">
        <div className="ltv-toolbar">
          <button className="ltv-back" onClick={() => navigate('/crm/tools/calculators')}>←</button>
          <h2 className="ltv-toolbar-title">LTV Calculator</h2>
        </div>
        <div className="ltv-loading">
          <div className="ltv-spinner" />
          <p>Loading your offer data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ltv-calculator">
      {/* TOOLBAR */}
      <div className="ltv-toolbar">
        <button className="ltv-back" onClick={() => navigate('/crm/tools/calculators')}>←</button>
        <h2 className="ltv-toolbar-title">LTV Calculator</h2>
      </div>

      {/* HERO — LTV Summary */}
      <div className="ltv-hero">
        <span className="ltv-hero-label">Lifetime Value Analysis</span>
        <h2 className="ltv-hero-title">${calculations.ltvPerCustomer.toFixed(2)}</h2>
        <p className="ltv-hero-sub">LTV per lead (100 lead basis){dataSource ? ` — from: ${dataSource}` : ''}</p>
        <div className="ltv-hero-stats">
          <div className="ltv-hero-stat">
            <span className="ltv-hero-stat-value gold">${calculations.avgRevenuePerCoreBuyer.toFixed(0)}</span>
            <span className="ltv-hero-stat-label">Per Core Buyer</span>
          </div>
          <div className="ltv-hero-stat">
            <span className="ltv-hero-stat-value">{calculations.coreBuyers}</span>
            <span className="ltv-hero-stat-label">Core Buyers/100</span>
          </div>
          <div className="ltv-hero-stat">
            <span className="ltv-hero-stat-value">{calculations.avgLifetimeMonths.toFixed(1)} mo</span>
            <span className="ltv-hero-stat-label">Avg Lifetime</span>
          </div>
          <div className="ltv-hero-stat">
            <span className="ltv-hero-stat-value gold">${calculations.totalWithReferrals.toLocaleString()}</span>
            <span className="ltv-hero-stat-label">Total/100 Leads</span>
          </div>
        </div>
      </div>

      {/* INPUT SECTIONS */}
      <div className="ltv-sections">
        {/* Front-End Offers */}
        <div className="ltv-card">
          <div className="ltv-section-header">
            <div className="ltv-section-icon">🎯</div>
            <span className="ltv-section-title">Front-End Offers</span>
          </div>
          <div className="ltv-row">
            <div className="ltv-field half">
              <label>Attraction Price</label>
              <div className="ltv-input-wrap prefix">
                <span className="ltv-input-affix">$</span>
                <input type="number" value={attractionOffer} onChange={e => setAttractionOffer(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="ltv-field half">
              <label>Conversion</label>
              <div className="ltv-input-wrap suffix">
                <input type="number" value={attractionConversion} onChange={e => setAttractionConversion(parseInt(e.target.value) || 0)} />
                <span className="ltv-input-affix">%</span>
              </div>
            </div>
          </div>
          <div className="ltv-row">
            <div className="ltv-field half">
              <label>Core Offer Price</label>
              <div className="ltv-input-wrap prefix">
                <span className="ltv-input-affix">$</span>
                <input type="number" value={coreOffer} onChange={e => setCoreOffer(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="ltv-field half">
              <label>Conversion</label>
              <div className="ltv-input-wrap suffix">
                <input type="number" value={coreConversion} onChange={e => setCoreConversion(parseInt(e.target.value) || 0)} />
                <span className="ltv-input-affix">%</span>
              </div>
            </div>
          </div>
          <div className="ltv-inline-result">
            <span>Front-End Revenue (per 100)</span>
            <strong>${calculations.frontEndTotal.toLocaleString()}</strong>
          </div>
        </div>

        {/* Upsells & Downsells */}
        <div className="ltv-card">
          <div className="ltv-section-header">
            <div className="ltv-section-icon">⬆️</div>
            <span className="ltv-section-title">Upsells & Downsells</span>
          </div>
          <div className="ltv-row">
            <div className="ltv-field half">
              <label>Upsell Price</label>
              <div className="ltv-input-wrap prefix">
                <span className="ltv-input-affix">$</span>
                <input type="number" value={upsellPrice} onChange={e => setUpsellPrice(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="ltv-field half">
              <label>Take Rate</label>
              <div className="ltv-input-wrap suffix">
                <input type="number" value={upsellRate} onChange={e => setUpsellRate(parseInt(e.target.value) || 0)} />
                <span className="ltv-input-affix">%</span>
              </div>
            </div>
          </div>
          <div className="ltv-row">
            <div className="ltv-field half">
              <label>Downsell Price</label>
              <div className="ltv-input-wrap prefix">
                <span className="ltv-input-affix">$</span>
                <input type="number" value={downsellPrice} onChange={e => setDownsellPrice(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="ltv-field half">
              <label>Take Rate</label>
              <div className="ltv-input-wrap suffix">
                <input type="number" value={downsellRate} onChange={e => setDownsellRate(parseInt(e.target.value) || 0)} />
                <span className="ltv-input-affix">%</span>
              </div>
            </div>
          </div>
          <div className="ltv-inline-result">
            <span>Upsell/Downsell Revenue</span>
            <strong>${(calculations.upsellRevenue + calculations.downsellRevenue).toLocaleString()}</strong>
          </div>
        </div>

        {/* Continuity */}
        <div className="ltv-card">
          <div className="ltv-section-header">
            <div className="ltv-section-icon">🔄</div>
            <span className="ltv-section-title">Continuity</span>
          </div>
          <div className="ltv-row">
            <div className="ltv-field half">
              <label>Monthly Price</label>
              <div className="ltv-input-wrap prefix">
                <span className="ltv-input-affix">$</span>
                <input type="number" value={continuityPrice} onChange={e => setContinuityPrice(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <div className="ltv-field half">
              <label>Take Rate</label>
              <div className="ltv-input-wrap suffix">
                <input type="number" value={continuityRate} onChange={e => setContinuityRate(parseInt(e.target.value) || 0)} />
                <span className="ltv-input-affix">%</span>
              </div>
            </div>
          </div>
          <div className="ltv-row">
            <div className="ltv-field half">
              <label>Avg Months</label>
              <input type="number" value={avgMonths} onChange={e => setAvgMonths(parseInt(e.target.value) || 0)} />
            </div>
            <div className="ltv-field half">
              <label>Monthly Churn</label>
              <div className="ltv-input-wrap suffix">
                <input type="number" value={churnRate} onChange={e => setChurnRate(parseInt(e.target.value) || 0)} />
                <span className="ltv-input-affix">%</span>
              </div>
            </div>
          </div>
          <div className="ltv-inline-result">
            <span>Continuity Revenue</span>
            <strong>${calculations.continuityRevenue.toLocaleString()}</strong>
          </div>
        </div>

        {/* Referrals */}
        <div className="ltv-card">
          <div className="ltv-section-header">
            <div className="ltv-section-icon">🗣️</div>
            <span className="ltv-section-title">Referral Value</span>
          </div>
          <div className="ltv-row">
            <div className="ltv-field half">
              <label>Customers Who Refer</label>
              <div className="ltv-input-wrap suffix">
                <input type="number" value={referralRate} onChange={e => setReferralRate(parseInt(e.target.value) || 0)} />
                <span className="ltv-input-affix">%</span>
              </div>
            </div>
            <div className="ltv-field half">
              <label>Referrals/Referrer</label>
              <input type="number" step="0.1" value={referralsPerCustomer} onChange={e => setReferralsPerCustomer(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
      </div>

      {/* REVENUE BREAKDOWN */}
      <div className="ltv-card">
        <div className="ltv-section-header">
          <div className="ltv-section-icon">📊</div>
          <span className="ltv-section-title">Revenue Breakdown (per 100 leads)</span>
        </div>
        <div className="ltv-breakdown">
          {[
            { label: 'Attraction', value: calculations.attractionRevenue, color: '#6366f1' },
            { label: 'Core', value: calculations.coreRevenue, color: '#8b5cf6' },
            { label: 'Upsells', value: calculations.upsellRevenue, color: '#10b981' },
            { label: 'Downsells', value: calculations.downsellRevenue, color: '#f59e0b' },
            { label: 'Continuity', value: calculations.continuityRevenue, color: '#06b6d4' },
          ].map(item => (
            <div key={item.label} className="ltv-breakdown-row">
              <div className="ltv-breakdown-label">
                <span className="ltv-breakdown-dot" style={{ background: item.color }} />
                <span>{item.label}</span>
                <span className="ltv-breakdown-amount">${item.value.toLocaleString()}</span>
              </div>
              <div className="ltv-breakdown-bar">
                <div
                  className="ltv-breakdown-fill"
                  style={{
                    width: `${calculations.totalWithReferrals > 0 ? (item.value / calculations.totalWithReferrals) * 100 : 0}%`,
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}
          <div className="ltv-breakdown-total">
            <span>Total (with referrals)</span>
            <strong>${calculations.totalWithReferrals.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
