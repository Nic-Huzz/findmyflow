/**
 * CEO Dashboard - Multi-project command center
 * Shows what fell through the cracks across all businesses
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import './CEODashboard.css'

const PROJECTS = {
  viberise: {
    name: 'Vibe Rise',
    color: '#5e17eb',
    accent: '#E9A23B',
    icon: '🔥',
  },
  headphones: {
    name: 'Headphones',
    color: '#E9A23B',
    accent: '#5e17eb',
    icon: '🎧',
  },
}

function StatusBadge({ status }) {
  const colors = {
    active: { bg: 'rgba(16,185,129,0.1)', text: '#059669', label: 'Active' },
    not_started: { bg: 'rgba(245,158,11,0.1)', text: '#d97706', label: 'Not Started' },
    blocked: { bg: 'rgba(239,68,68,0.1)', text: '#dc2626', label: 'Blocked' },
    paused: { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', label: 'Paused' },
  }
  const c = colors[status] || colors.not_started
  return (
    <span className="ceo-status-badge" style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  )
}

function ConnectButton({ connectTo }) {
  const guides = {
    meta_ads: { label: 'Connect Meta Ads', desc: 'Link your Meta Business account to track ad performance' },
    cold_email: { label: 'Connect Gmail', desc: 'Send and track cold email sequences' },
    seo: { label: 'Connect GSC', desc: 'Link Google Search Console for ranking data' },
    reddit: { label: 'Fix Reddit Monitor', desc: 'Remote env needs reddit.com allowlisted' },
    stripe: { label: 'Connect Stripe', desc: 'Track rental revenue automatically' },
  }
  const guide = guides[connectTo]
  if (!guide) return null
  return (
    <button className="ceo-connect-btn" title={guide.desc}>
      {guide.label}
    </button>
  )
}

function MetricRow({ label, value, status, action, connectTo, source }) {
  return (
    <div className="ceo-metric-row">
      <div className="ceo-metric-left">
        <div className="ceo-metric-label">
          {label}
          {source && <span className="ceo-metric-source">{source}</span>}
        </div>
      </div>
      <div className="ceo-metric-right">
        {value !== undefined && <span className="ceo-metric-value">{value}</span>}
        {status && <StatusBadge status={status} />}
        {connectTo && <ConnectButton connectTo={connectTo} />}
      </div>
      {action && <div className="ceo-metric-action">{action}</div>}
    </div>
  )
}

function ProjectCard({ project, metrics, actions, seoData }) {
  const p = PROJECTS[project]
  return (
    <div className="ceo-project-card" style={{ '--project-color': p.color, '--project-accent': p.accent }}>
      <div className="ceo-project-header">
        <span className="ceo-project-icon">{p.icon}</span>
        <h2 className="ceo-project-name">{p.name}</h2>
      </div>
      <div className="ceo-metrics-list">
        {metrics.map((m, i) => (
          <MetricRow key={i} {...m} />
        ))}
        {seoData && <SEODropdown data={seoData} />}
      </div>
      {actions.length > 0 && (
        <div className="ceo-actions">
          <div className="ceo-actions-label">Next actions</div>
          {actions.map((a, i) => (
            <div key={i} className="ceo-action-item">
              <span className="ceo-action-dot" />
              {a}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SEODropdown({ data }) {
  const [open, setOpen] = useState(false)
  if (!data) return null
  return (
    <div className="ceo-seo-dropdown">
      <div className="ceo-metric-row" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        <div className="ceo-metric-left">
          <div className="ceo-metric-label">
            SEO (28 days)
            <span className="ceo-metric-source">GSC</span>
          </div>
        </div>
        <div className="ceo-metric-right">
          <span className="ceo-metric-value">{data.summary.clicks} clicks</span>
          <span className="ceo-seo-toggle">{open ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>
      {open && (
        <div className="ceo-seo-detail">
          <div className="ceo-seo-summary">
            <span>{data.summary.impressions} impressions</span>
            <span>{data.summary.ctr}% CTR</span>
            <span>Avg pos: {data.summary.avgPosition}</span>
          </div>
          <div className="ceo-seo-section-label">Top Pages</div>
          {data.topPages.slice(0, 3).map((p, i) => (
            <div key={i} className="ceo-seo-page">
              <span className="ceo-seo-page-url">{p.page || '/'}</span>
              <span className="ceo-seo-page-stats">{p.clicks}c / {p.impressions}i / pos {p.position}</span>
            </div>
          ))}
          <div className="ceo-seo-section-label">Top Queries</div>
          {data.topQueries.slice(0, 5).map((q, i) => (
            <div key={i} className="ceo-seo-page">
              <span className="ceo-seo-page-url">{q.query}</span>
              <span className="ceo-seo-page-stats">pos {q.position} / {q.impressions}i</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CEODashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [vrMetrics, setVrMetrics] = useState({})
  const [hpMetrics, setHpMetrics] = useState({})
  const [seoData, setSeoData] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const day = now.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset).toISOString()

    try {
      const [
        totalUsersRes,
        activeWeekRes,
        checkinsTodayRes,
      ] = await Promise.all([
        supabase.from('user_stage_progress').select('id', { count: 'exact', head: true }),
        supabase.from('nervous_system_checkins').select('user_id', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('nervous_system_checkins').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      ])

      setVrMetrics({
        totalUsers: totalUsersRes.count || 0,
        activeThisWeek: activeWeekRes.count || 0,
        checkinsToday: checkinsTodayRes.count || 0,
      })

      // Fetch headphone order data
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, current_stage, created_at')
          .order('created_at', { ascending: false })

        const totalRevenue = (orders || []).reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
        const activeOrders = (orders || []).filter(o => o.current_stage !== 'completed' && o.current_stage !== 'cancelled').length
        setHpMetrics({ totalRevenue, activeOrders, totalOrders: (orders || []).length })
      } catch (orderErr) {
        console.error('Orders fetch error:', orderErr)
      }

      // Fetch SEO data from edge function
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const seoRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ceo-seo-metrics`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
              },
            }
          )
          if (seoRes.ok) {
            setSeoData(await seoRes.json())
          } else {
            const errBody = await seoRes.text()
            console.error('SEO edge function error:', seoRes.status, errBody)
          }
        } else {
          console.error('No session token for SEO fetch')
        }
      } catch (seoErr) {
        console.error('SEO fetch error:', seoErr)
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('CEO dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div className="ceo-dashboard">
        <div className="ceo-loading"><div className="ceo-spinner" /></div>
      </div>
    )
  }

  const vibeRiseMetrics = [
    { label: 'Total users', value: vrMetrics.totalUsers, source: 'Supabase' },
    { label: 'Active this week', value: vrMetrics.activeThisWeek, source: 'Supabase' },
    { label: 'Check-ins today', value: vrMetrics.checkinsToday, source: 'Supabase' },
    { label: 'Strike (7 Wahoos)', status: 'not_started' },
    { label: 'Reddit (r/findapath)', status: 'active', source: 'Trigger' },
  ]

  const vibeRiseActions = [
    'Pick a start date for 7 Wahoos strike',
    'Post 5 Reddit comments to build karma',
  ]

  const headphoneMetrics = [
    { label: 'Total order revenue', value: `$${(hpMetrics.totalRevenue || 0).toLocaleString()}`, source: 'Supabase' },
    { label: 'Active orders', value: hpMetrics.activeOrders || 0, source: 'Supabase' },
    { label: 'Cold emails sent', value: '0' },
    { label: 'Cold email replies', value: '0' },
    { label: 'Meta Ads', status: 'not_started', connectTo: 'meta_ads' },
    { label: 'Reddit leads monitor', status: 'active', source: 'Trigger' },
    { label: 'Competitors profiled', value: '1/3' },
  ]

  const headphoneActions = [
    'Send 5 cold emails to AU yoga studios',
    'Write first SEO article: "How to run a silent disco yoga class"',
    'Connect Stripe for rental revenue tracking',
  ]

  return (
    <div className="ceo-dashboard">
      <div className="ceo-header">
        <h1 className="ceo-title">CEO</h1>
        <p className="ceo-subtitle">
          {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>

      <div className="ceo-grid">
        <ProjectCard
          project="viberise"
          metrics={vibeRiseMetrics}
          actions={vibeRiseActions}
        />
        <ProjectCard
          project="headphones"
          metrics={headphoneMetrics}
          actions={headphoneActions}
          seoData={seoData}
        />
      </div>

      <div className="ceo-footer">
        <button className="ceo-refresh-btn" onClick={loadData}>
          Refresh
        </button>
      </div>
    </div>
  )
}
