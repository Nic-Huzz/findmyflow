/**
 * CRM Dashboard - Command Center Overview
 * Clean, minimal design matching prototype
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchUserStats,
  fetchDeals,
  calculateRevenueStats,
} from '../../lib/crm'
import { supabase } from '../../lib/supabaseClient'
import { DashboardSkeleton } from '../../components/crm/Skeleton'
import PullToRefresh from '../../components/crm/PullToRefresh'
import DailyActions from '../../components/crm/DailyActions'
import EcosystemStatusWidget from '../../components/crm/EcosystemStatusWidget'
import { hapticLight } from '../../lib/haptics'
import '../../components/crm/PageTransition.css'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [deals, setDeals] = useState([])

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [statsResult, dealsResult] = await Promise.all([
        fetchUserStats(user.id),
        fetchDeals(user.id),
      ])

      if (statsResult.data) setStats(statsResult.data)
      if (dealsResult.data) setDeals(dealsResult.data)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id, loadDashboardData])

  const revenueStats = useMemo(() => {
    return calculateRevenueStats(deals, stats?.monthly_revenue_goal || 5000)
  }, [deals, stats])

  if (loading) {
    return <DashboardSkeleton />
  }

  function handleActionClick(path) {
    hapticLight()
    navigate(path)
  }

  return (
    <PullToRefresh onRefresh={loadDashboardData}>
      <div className="hq-dashboard">
        {/* Header */}
        <header className="hq-header">
          <h1 className="hq-title">Your HQ</h1>
          <p className="hq-subtitle">Marketing & sales at a glance</p>
        </header>

        {/* Stats Grid - 2x2 compact cards */}
        <div className="hq-stats-grid stagger-children">
        <div className="hq-stat-card">
          <span className="hq-stat-icon">🏆</span>
          <span className="hq-stat-value">{(stats?.total_points || 0).toLocaleString()}</span>
          <span className="hq-stat-label">Total Points</span>
        </div>

        <div className="hq-stat-card">
          <span className="hq-stat-icon">🔥</span>
          <span className="hq-stat-value">{stats?.current_streak || 0} days</span>
          <span className="hq-stat-label">Current Streak</span>
        </div>

        <div className="hq-stat-card">
          <span className="hq-stat-icon">💰</span>
          <span className="hq-stat-value">${revenueStats.currentRevenue.toLocaleString()}</span>
          <span className="hq-stat-label">Monthly Revenue</span>
        </div>

        <div className="hq-stat-card">
          <span className="hq-stat-icon">📊</span>
          <span className="hq-stat-value">${revenueStats.pipelineValue.toLocaleString()}</span>
          <span className="hq-stat-label">Pipeline Value</span>
        </div>
      </div>

        {/* Business Systems Progress */}
        <section className="hq-section">
          <EcosystemStatusWidget userId={user?.id} />
        </section>

        {/* Daily Actions */}
        <section className="hq-section">
          <DailyActions userId={user?.id} />
        </section>

        {/* Quick Actions - 2 column grid */}
        <section className="hq-section">
          <h2 className="hq-section-title">Quick Actions</h2>
          <div className="hq-quick-actions stagger-children">
            <button className="hq-action-card" onClick={() => handleActionClick('/crm/marketing')}>
              <span className="hq-action-icon">📝</span>
              <span className="hq-action-label">Create Content</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/sales')}>
              <span className="hq-action-icon">💼</span>
              <span className="hq-action-label">Sales Pipeline</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/analytics')}>
              <span className="hq-action-icon">📈</span>
              <span className="hq-action-label">Report Card</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/attract')}>
              <span className="hq-action-icon">🎯</span>
              <span className="hq-action-label">Attract Tower</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/nurture')}>
              <span className="hq-action-icon">💜</span>
              <span className="hq-action-label">Nurture Tower</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/tools')}>
              <span className="hq-action-icon">🧰</span>
              <span className="hq-action-label">Tools Tower</span>
            </button>
          </div>
        </section>

      </div>
    </PullToRefresh>
  )
}
