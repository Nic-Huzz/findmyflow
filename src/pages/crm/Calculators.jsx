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
    color: '#10b981',
  },
  {
    id: 'ltv',
    icon: '📈',
    title: 'LTV Calculator',
    subtitle: 'Lifetime Value',
    description: 'Calculate the total value of a customer across all revenue streams - initial sale, upsells, downsells, and continuity.',
    path: '/crm/ltv',
    features: ['Multi-product revenue', 'Continuity modeling', 'Referral value'],
    color: '#8b5cf6',
  },
  {
    id: 'cac',
    icon: '💰',
    title: 'CAC Tracker',
    subtitle: 'Customer Acquisition Cost',
    description: 'Track marketing spend by channel and calculate your cost per customer. See your LTV:CAC ratio to ensure profitable growth.',
    path: '/crm/cac',
    features: ['Channel tracking', 'LTV:CAC ratio', 'ROI analysis'],
    color: '#f59e0b',
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
      // Check for saved calculator data
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

  return (
    <div className="calculators-page">
      <header className="calculators-header">
        <button className="back-btn" onClick={() => navigate('/crm/tools')}>
          <span className="back-arrow">←</span> Tools
        </button>
        <div className="header-content">
          <h1>Calculators</h1>
          <p className="header-subtitle">Business metrics powered by Hormozi frameworks</p>
        </div>
      </header>

      <div className="calculators-intro">
        <div className="intro-icon">🧮</div>
        <p>
          These calculators help you understand your business numbers and make data-driven decisions.
          They auto-populate from your challenge data when available.
        </p>
      </div>

      <div className="calculators-grid">
        {CALCULATORS.map(calc => (
          <div
            key={calc.id}
            className="calculator-card"
            onClick={() => handleCardClick(calc)}
            style={{ '--card-color': calc.color }}
          >
            <div className="calc-card-header">
              <span className="calc-icon">{calc.icon}</span>
              {stats[calc.id] && (
                <span className="calc-badge saved">Saved</span>
              )}
            </div>

            <h3 className="calc-title">{calc.title}</h3>
            <span className="calc-subtitle">{calc.subtitle}</span>

            <p className="calc-description">{calc.description}</p>

            <ul className="calc-features">
              {calc.features.map((feature, i) => (
                <li key={i}>
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="calc-action">
              <span>Open Calculator</span>
              <span className="calc-arrow">→</span>
            </div>
          </div>
        ))}
      </div>

      <div className="calculators-tip">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>Pro Tip</strong>
          <p>Complete your offer flows first - the calculators will auto-populate with your pricing data for accurate projections.</p>
        </div>
      </div>
    </div>
  )
}
