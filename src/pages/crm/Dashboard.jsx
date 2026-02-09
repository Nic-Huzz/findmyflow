/**
 * CRM Dashboard - Command Center Overview
 * Clean, minimal design matching prototype
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchDeals,
  calculateRevenueStats,
  getWeeklyScores,
  getLastWeekScores,
  getWeekStart,
} from '../../lib/crm'
import { supabase } from '../../lib/supabaseClient'
import { DashboardSkeleton } from '../../components/crm/Skeleton'
import PullToRefresh from '../../components/crm/PullToRefresh'
import DailyActions from '../../components/crm/DailyActions'
import EcosystemStatusWidget from '../../components/crm/EcosystemStatusWidget'
import { hapticLight } from '../../lib/haptics'
import '../../components/crm/PageTransition.css'
import './Dashboard.css'

function TrendIndicator({ current, previous, prefix = '', suffix = '', isPercentage = false }) {
  if (previous === null || previous === undefined) return null
  const diff = current - previous
  if (diff === 0) return null
  const isUp = diff > 0
  const display = isPercentage
    ? `${Math.abs(diff).toFixed(1)}%`
    : `${prefix}${Math.abs(diff).toLocaleString()}${suffix}`
  return (
    <span className={`hq-trend ${isUp ? 'hq-trend--up' : 'hq-trend--down'}`}>
      {isUp ? '\u25B2' : '\u25BC'} {display}
    </span>
  )
}

// Get Monday of a given week offset (0 = this week, -1 = last week)
function getWeekStartDate(offset = 0) {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7)
  const d = new Date(now)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState([])
  const [warmLeadCount, setWarmLeadCount] = useState(0)
  const [prevWarmLeadCount, setPrevWarmLeadCount] = useState(null)
  const [weeklyScores, setWeeklyScores] = useState({ execution: 0, conversion: 0, improvement: 0 })
  const [lastWeekScores, setLastWeekScores] = useState(null)

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return
    try {
      const weekStart = getWeekStart()
      const lastWeekStart = getWeekStartDate(-1)
      const thisWeekStart = getWeekStartDate(0)

      const [dealsResult, warmLeadsResult, prevWarmLeadsResult, scores, lastScores] = await Promise.all([
        fetchDeals(user.id),
        supabase
          .from('crm_warm_leads')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['to_contact', 'reached_out', 'in_conversation', 'meeting_booked']),
        supabase
          .from('crm_warm_leads')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['to_contact', 'reached_out', 'in_conversation', 'meeting_booked'])
          .lt('created_at', thisWeekStart.toISOString()),
        getWeeklyScores(user.id, weekStart),
        getLastWeekScores(user.id),
      ])

      if (dealsResult.data) setDeals(dealsResult.data)
      setWarmLeadCount(warmLeadsResult.count || 0)
      setPrevWarmLeadCount(prevWarmLeadsResult.count ?? null)
      if (scores) setWeeklyScores({
        execution: scores.execution ?? 0,
        conversion: scores.conversion ?? 0,
        improvement: scores.improvement ?? 0,
      })

      if (lastScores) setLastWeekScores(lastScores)
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
    return calculateRevenueStats(deals)
  }, [deals])

  // Calculate last month's revenue for trend comparison
  const lastMonthRevenue = useMemo(() => {
    const now = new Date()
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    const wonLastMonth = deals.filter(d => {
      if (!['won', 'delivering', 'completed'].includes(d.status)) return false
      const closeDate = new Date(d.actual_close_date || d.updated_at)
      return closeDate.getMonth() === lastMonth && closeDate.getFullYear() === lastMonthYear
    })

    return wonLastMonth.reduce((sum, d) => sum + (d.value || 0), 0)
  }, [deals])

  // Count active customers last week (deals in delivering before this week)
  const prevActiveCustomers = useMemo(() => {
    const thisWeekStart = getWeekStartDate(0)
    return deals.filter(d => {
      if (d.status !== 'delivering') return false
      const updatedAt = new Date(d.updated_at)
      return updatedAt < thisWeekStart
    }).length
  }, [deals])

  if (loading) {
    return <DashboardSkeleton />
  }

  function handleActionClick(path) {
    hapticLight()
    navigate(path)
  }

  const prevConversion = lastWeekScores?.conversion ?? null

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
            <span className="hq-stat-icon">📦</span>
            <span className="hq-stat-value">{revenueStats.activeCustomers}</span>
            <span className="hq-stat-label">
              Active Customers
              <TrendIndicator current={revenueStats.activeCustomers} previous={prevActiveCustomers} />
            </span>
          </div>

          <div className="hq-stat-card">
            <span className="hq-stat-icon">🔥</span>
            <span className="hq-stat-value">{warmLeadCount}</span>
            <span className="hq-stat-label">
              Warm Leads
              <TrendIndicator current={warmLeadCount} previous={prevWarmLeadCount} />
            </span>
          </div>

          <div className="hq-stat-card">
            <span className="hq-stat-icon">💰</span>
            <span className="hq-stat-value">${revenueStats.currentRevenue.toLocaleString()}</span>
            <span className="hq-stat-label">
              Monthly Revenue
              <TrendIndicator current={revenueStats.currentRevenue} previous={lastMonthRevenue} prefix="$" />
            </span>
          </div>

          <div className="hq-stat-card">
            <span className="hq-stat-icon">📊</span>
            <span className="hq-stat-value">{weeklyScores.conversion.toFixed(1)}%</span>
            <span className="hq-stat-label">
              Avg Conversion
              <TrendIndicator current={weeklyScores.conversion} previous={prevConversion} isPercentage />
            </span>
          </div>
        </div>

        {/* Weekly Score */}
        <div className="hq-weekly-scores stagger-children">
          <h3 className="hq-weekly-scores-title">Weekly Score</h3>
          <div className="hq-score-card">
            <div className="hq-score-header">
              <span className="hq-score-label">Execution</span>
              <span className="hq-score-value">{weeklyScores.execution}%</span>
            </div>
            <div className="hq-score-bar">
              <div
                className="hq-score-fill hq-score-fill--execution"
                style={{ width: `${Math.min(weeklyScores.execution, 100)}%` }}
              />
            </div>
          </div>

          <div className="hq-score-card">
            <div className="hq-score-header">
              <span className="hq-score-label">Conversion</span>
              <span className="hq-score-value">{weeklyScores.conversion.toFixed(1)}%</span>
            </div>
            <div className="hq-score-bar">
              <div
                className="hq-score-fill hq-score-fill--conversion"
                style={{ width: `${Math.min(weeklyScores.conversion, 100)}%` }}
              />
            </div>
          </div>

          <div className="hq-score-card">
            <div className="hq-score-header">
              <span className="hq-score-label">Improvement</span>
              <span className={`hq-score-value ${weeklyScores.improvement >= 0 ? 'hq-score-value--positive' : 'hq-score-value--negative'}`}>
                {weeklyScores.improvement >= 0 ? '+' : ''}{weeklyScores.improvement.toFixed(1)}%
              </span>
            </div>
            <div className="hq-score-bar">
              <div
                className={`hq-score-fill ${weeklyScores.improvement >= 0 ? 'hq-score-fill--improvement' : 'hq-score-fill--decline'}`}
                style={{ width: `${Math.min(Math.abs(weeklyScores.improvement) * 5, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Actions */}
        <section className="hq-section">
          <DailyActions userId={user?.id} />
        </section>

        {/* Business Systems Setup */}
        <section className="hq-section">
          <EcosystemStatusWidget userId={user?.id} />
        </section>

        {/* Quick Actions - grouped by tower */}
        <section className="hq-section">
          <h2 className="hq-section-title">Quick Actions</h2>
          <div className="hq-quick-actions stagger-children">
            {/* Attract */}
            <button className="hq-action-card" onClick={() => handleActionClick('/crm/content-create')}>
              <span className="hq-action-icon">✨</span>
              <span className="hq-action-label">Create Content</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/content-queue')}>
              <span className="hq-action-icon">📋</span>
              <span className="hq-action-label">Content Queue</span>
            </button>

            {/* Nurture */}
            <button className="hq-action-card" onClick={() => handleActionClick('/crm/warm-outreach')}>
              <span className="hq-action-icon">☀️</span>
              <span className="hq-action-label">Warm Outreach</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/sales')}>
              <span className="hq-action-icon">💼</span>
              <span className="hq-action-label">Sales Pipeline</span>
            </button>

            {/* Tools */}
            <button className="hq-action-card" onClick={() => handleActionClick('/crm/contacts')}>
              <span className="hq-action-icon">👤</span>
              <span className="hq-action-label">Contacts</span>
            </button>

            <button className="hq-action-card" onClick={() => handleActionClick('/crm/analytics')}>
              <span className="hq-action-icon">📈</span>
              <span className="hq-action-label">Report Card</span>
            </button>
          </div>
        </section>

      </div>
    </PullToRefresh>
  )
}
