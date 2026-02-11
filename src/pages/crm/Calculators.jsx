/**
 * Calculators Hub - Business Metrics Tools
 * Links to PTUF, LTV, and CAC calculators
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight } from '../../lib/haptics'
import './Calculators.css'

const CALCULATORS = [
  {
    id: 'ptuf',
    icon: '💵',
    title: 'PTUF Calculator',
    subtitle: 'Price To Unit Formula',
    description: 'Calculate your optimal pricing based on income goals, capacity, and conversion rates. Based on Alex Hormozi\'s $100M Offers framework.',
    path: '/crm/ptuf',
    features: ['Income goal planning', 'Capacity analysis', 'Price optimization'],
  },
  {
    id: 'ltv',
    icon: '📈',
    title: 'LTV Calculator',
    subtitle: 'Lifetime Value',
    description: 'Calculate the total value of a customer across all revenue streams - initial sale, upsells, downsells, and continuity.',
    path: '/crm/ltv',
    features: ['Multi-product revenue', 'Continuity modeling', 'Referral value'],
  },
  {
    id: 'cac',
    icon: '💰',
    title: 'CAC Tracker',
    subtitle: 'Customer Acquisition Cost',
    description: 'Track marketing spend by channel and calculate your cost per customer. See your LTV:CAC ratio to ensure profitable growth.',
    path: '/crm/cac',
    features: ['Channel tracking', 'LTV:CAC ratio', 'ROI analysis'],
  },
]

export default function Calculators() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadStats()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  async function loadStats() {
    try {
      const [ptufResult, ltvResult, cacResult] = await Promise.all([
        supabase
          .from('ptuf_calculations')
          .select('updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1),
        supabase
          .from('ltv_calculations')
          .select('updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1),
        supabase
          .from('cac_calculations')
          .select('updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1),
      ])

      setStats({
        ptuf: ptufResult.data?.[0] ? 'Saved' : null,
        ltv: ltvResult.data?.[0] ? 'Saved' : null,
        cac: cacResult.data?.[0] ? 'Saved' : null,
      })
    } catch (err) {
      console.error('Error loading calculator stats:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCardClick(calculator) {
    hapticLight()
    navigate(calculator.path)
  }

  if (loading) {
    return (
      <div className="calculators-page">
        <div className="calc-hub-toolbar">
          <button className="calc-hub-back" onClick={() => navigate('/crm/tools')}>←</button>
          <h2 className="calc-hub-toolbar-title">Calculators</h2>
        </div>
        <div className="calc-hub-loading">
          <div className="calc-hub-spinner" />
          <p>Loading calculators...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="calculators-page">
      {/* TOOLBAR */}
      <div className="calc-hub-toolbar">
        <button className="calc-hub-back" onClick={() => navigate('/crm/tools')}>←</button>
        <h2 className="calc-hub-toolbar-title">Calculators</h2>
      </div>

      {/* HERO */}
      <div className="calc-hub-hero">
        <span className="calc-hub-hero-label">Business Metrics</span>
        <h2 className="calc-hub-hero-title">Your Numbers</h2>
        <p className="calc-hub-hero-sub">Data-driven decisions powered by Hormozi frameworks. Auto-populates from your challenge data.</p>
      </div>

      {/* CALCULATOR CARDS */}
      <div className="calc-hub-grid">
        {CALCULATORS.map(calc => (
          <div
            key={calc.id}
            className="calc-hub-card"
            onClick={() => handleCardClick(calc)}
          >
            <div className="calc-hub-card-top">
              <span className="calc-hub-card-icon">{calc.icon}</span>
              {stats[calc.id] && (
                <span className="calc-hub-badge">Saved</span>
              )}
            </div>

            <h3 className="calc-hub-card-title">{calc.title}</h3>
            <span className="calc-hub-card-eyebrow">{calc.subtitle}</span>

            <p className="calc-hub-card-desc">{calc.description}</p>

            <ul className="calc-hub-features">
              {calc.features.map((feature, i) => (
                <li key={i}>
                  <span className="calc-hub-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="calc-hub-card-action">
              <span>Open Calculator</span>
              <span className="calc-hub-arrow">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* TIP */}
      <div className="calc-hub-tip">
        <div className="calc-hub-tip-icon">💡</div>
        <div className="calc-hub-tip-body">
          <strong>Pro Tip</strong>
          <p>Complete your offer flows first - the calculators will auto-populate with your pricing data for accurate projections.</p>
        </div>
      </div>
    </div>
  )
}
