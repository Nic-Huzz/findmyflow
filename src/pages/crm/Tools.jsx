/**
 * Tools Tower - Utilities Hub
 * Analytics, Calculators, Scripts, Implementations
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getToolsStats } from '../../lib/crm/towerStats'
import { TowerSkeleton } from '../../components/crm/Skeleton'
import PullToRefresh from '../../components/crm/PullToRefresh'
import { hapticLight } from '../../lib/haptics'
import '../../components/crm/PageTransition.css'
import './Tools.css'

const CARDS = [
  {
    id: 'import',
    icon: '📥',
    title: 'Import Data',
    description: 'Import contacts, leads & deals from CSV',
    path: '/crm/import',
    statsKey: null,
  },
  {
    id: 'systems',
    icon: '⚙️',
    title: 'Business Systems',
    description: 'Build your flywheel checklist',
    path: '/crm/tools/systems',
    statsKey: 'ecosystem',
  },
  {
    id: 'reports',
    icon: '📊',
    title: 'Reports',
    description: 'Weekly & monthly performance reports',
    path: '/crm/reports',
    statsKey: 'analytics',
  },
  {
    id: 'calculators',
    icon: '🧮',
    title: 'Calculators',
    description: 'PTUF, LTV, and CAC tools',
    path: '/crm/tools/calculators',
    statsKey: 'calculators',
  },
  {
    id: 'expenses',
    icon: '💸',
    title: 'Expenses',
    description: 'Track costs by project',
    path: '/crm/tools/expenses',
    statsKey: 'expenses',
  },
  {
    id: 'scripts',
    icon: '📜',
    title: 'Sales Scripts',
    description: '15 proven Hormozi frameworks',
    path: '/crm/scripts',
    statsKey: 'scripts',
  },
  {
    id: 'implementations',
    icon: '📋',
    title: 'Implementations',
    description: 'Track your build progress',
    path: '/crm/implementations',
    statsKey: 'implementations',
  },
  {
    id: 'email',
    icon: '✉️',
    title: 'Email Sequences',
    description: 'Set-and-forget nurture campaigns',
    path: '/crm/email-sequences',
    statsKey: 'email',
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
    lastReport: 'last report',
    saved: 'saved',
    used: 'used',
    inProgress: 'in progress',
    completed: 'completed',
    percent: 'setup',
    active: 'active',
  }

  return { value, label: labels[key] || key }
}

export default function Tools() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const loadStats = useCallback(async () => {
    if (!user?.id) return
    const data = await getToolsStats(user.id)
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
          <h2 className="tower-toolbar-title">Tools</h2>
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
