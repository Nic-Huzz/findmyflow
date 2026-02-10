/**
 * Attract Tower - Lead Attraction Hub
 * Content, Pages, Cold Outreach, Ads
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getAttractStats } from '../../lib/crm/towerStats'
import { TowerSkeleton } from '../../components/crm/Skeleton'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { hapticLight } from '../../lib/haptics'
import '../../components/crm/PageTransition.css'
import './Attract.css'

const CARDS = [
  {
    id: 'create',
    icon: '✨',
    title: 'Create Content',
    description: 'AI-powered content from your data',
    path: '/crm/content-create',
  },
  {
    id: 'content',
    icon: '📝',
    title: 'Content',
    description: 'Create and schedule posts with AI assistance',
    path: '/crm/marketing',
    statsKey: 'content',
  },
  {
    id: 'pages',
    icon: '🌐',
    title: 'Landing Pages',
    description: 'Track pages & generate AI copy',
    path: '/crm/pages',
    statsKey: 'pages',
  },
  {
    id: 'cold-outreach',
    icon: '📧',
    title: 'Cold Outreach',
    description: 'Scripts and tracking for cold leads',
    path: '/crm/cold-outreach',
    badge: 'SOON',
    disabled: true,
    statsKey: 'coldOutreach',
  },
  {
    id: 'ads',
    icon: '📣',
    title: 'Ads',
    description: 'Paid campaign management',
    path: '/crm/ads',
    badge: 'SOON',
    disabled: true,
    statsKey: 'ads',
  },
]

function formatStat(key, value) {
  if (value === undefined || value === null || value === '—') return null

  const labels = {
    thisWeek: 'this week',
    drafts: 'drafts',
    active: 'active',
    conversion: 'conversion',
    sent: 'sent',
    replies: 'replies',
    spend: 'spend',
  }

  return { value, label: labels[key] || key }
}

export default function Attract() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const loadStats = useCallback(async () => {
    if (!user?.id) return
    const data = await getAttractStats(user.id)
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
          <h2 className="tower-toolbar-title">Attract</h2>
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
