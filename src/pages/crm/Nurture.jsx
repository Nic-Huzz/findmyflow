/**
 * Nurture Tower - Relationship Building Hub
 * Contacts, Email, Pipeline, Warm Outreach, Ascension
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getNurtureStats } from '../../lib/crm/towerStats'
import { TowerSkeleton } from '../../components/crm/Skeleton'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { hapticLight } from '../../lib/haptics'
import '../../components/crm/PageTransition.css'
import './Nurture.css'

const CARDS = [
  {
    id: 'contacts',
    icon: '👥',
    title: 'Contacts',
    description: 'Manage leads and customers',
    path: '/crm/contacts',
    statsKey: 'contacts',
  },
  {
    id: 'email',
    icon: '✉️',
    title: 'Email Sequences',
    description: 'Automated nurture campaigns',
    path: '/crm/email-sequences',
    statsKey: 'email',
  },
  {
    id: 'pipeline',
    icon: '📊',
    title: 'Pipeline',
    description: 'Track deals from lead to close',
    path: '/crm/sales',
    statsKey: 'pipeline',
  },
  {
    id: 'warm-outreach',
    icon: '🤝',
    title: 'Warm Outreach',
    description: 'Follow up with engaged leads',
    path: '/crm/warm-outreach',
    statsKey: 'warmOutreach',
  },
  {
    id: 'ascension',
    icon: '🚀',
    title: 'Ascension',
    description: 'Move customers up your value ladder',
    path: '/crm/ascension',
    statsKey: 'ascension',
  },
  {
    id: 'playbook',
    icon: '📚',
    title: 'Sales Playbook',
    description: 'Closing frameworks & objection handling',
    path: '/crm/sales-playbook',
  },
]

function formatStat(key, value) {
  if (value === undefined || value === null || value === '—') return null

  const labels = {
    total: 'total',
    thisWeek: 'this week',
    active: 'active',
    openRate: 'open rate',
    activeDeals: 'deals',
    pipelineValue: 'value',
    toFollowUp: 'to follow up',
    upsellRate: 'upsell rate',
  }

  // Format currency values
  if (key === 'pipelineValue' && typeof value === 'number') {
    return { value: `$${value.toLocaleString()}`, label: labels[key] }
  }

  return { value, label: labels[key] || key }
}

export default function Nurture() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const loadStats = useCallback(async () => {
    if (!user?.id) return
    const data = await getNurtureStats(user.id)
    setStats(data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadStats()
    }
  }, [user?.id, loadStats])

  function handleCardClick(card) {
    if (card.disabled) return
    hapticLight()
    navigate(card.path)
  }

  if (loading) {
    return <TowerSkeleton />
  }

  return (
    <PullToRefresh onRefresh={loadStats}>
      <div className="tower-page">
        {/* Top Toolbar */}
        <div className="tower-toolbar">
          <button className="tower-toolbar-back" onClick={() => navigate('/crm')}>
            ←
          </button>
          <h2 className="tower-toolbar-title">Nurture</h2>
          <span className="tower-toolbar-points">💜</span>
        </div>

        <div className="tower-grid stagger-children">
        {CARDS.map(card => {
          const cardStats = stats?.[card.statsKey]
          const statItems = cardStats
            ? Object.entries(cardStats)
                .map(([k, v]) => formatStat(k, v))
                .filter(Boolean)
                .slice(0, 2)
            : []

          return (
            <div
              key={card.id}
              className={`tower-card ${card.disabled ? 'disabled' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="tower-card-icon">{card.icon}</div>
              <h3 className="tower-card-title">
                {card.title}
                {card.badge && (
                  <span className="tower-badge soon">{card.badge}</span>
                )}
              </h3>
              <p className="tower-card-description">{card.description}</p>

              {statItems.length > 0 && (
                <div className="tower-card-stats">
                  {statItems.map((stat, i) => (
                    <div key={i} className="tower-stat">
                      <span className="tower-stat-value">{stat.value}</span>
                      <span className="tower-stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </PullToRefresh>
  )
}
