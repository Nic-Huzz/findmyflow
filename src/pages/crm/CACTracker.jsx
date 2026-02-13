/**
 * CAC Tracker - Customer Acquisition Cost Calculator
 * Tracks marketing spend and calculates cost per customer
 *
 * Pre-populates from challenge data:
 * - LTV Calculator data → for LTV:CAC ratio
 * - leads_assessments (Core Four) → highlights recommended channel
 */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { fetchLaunchReadiness } from '../../lib/crm/challengeDataService'
import './CACTracker.css'

const CORE_FOUR_CHANNEL_MAP = {
  'warm_outreach': 'referral',
  'cold_outreach': 'email',
  'content': 'content',
  'paid_ads': 'paid_social',
  'organic_social': 'organic',
  'seo': 'content',
  'partnerships': 'partnerships',
}

const CHANNELS = [
  { id: 'organic', name: 'Organic (Social)', icon: '📱', color: '#10b981' },
  { id: 'paid_social', name: 'Paid Social', icon: '💰', color: '#8b5cf6' },
  { id: 'paid_search', name: 'Paid Search', icon: '🔍', color: '#f59e0b' },
  { id: 'email', name: 'Email Marketing', icon: '📧', color: '#06b6d4' },
  { id: 'referral', name: 'Referrals', icon: '🗣️', color: '#ec4899' },
  { id: 'content', name: 'Content/SEO', icon: '📝', color: '#6366f1' },
  { id: 'partnerships', name: 'Partnerships', icon: '🤝', color: '#14b8a6' },
  { id: 'other', name: 'Other', icon: '📊', color: '#64748b' },
]

export default function CACTracker() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loadingDefaults, setLoadingDefaults] = useState(true)
  const [focusedChannel, setFocusedChannel] = useState(null)
  const [dataSource, setDataSource] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMonth, setSavedMonth] = useState(null)

  const [timeframe, setTimeframe] = useState('month')
  const [channelData, setChannelData] = useState(
    CHANNELS.reduce((acc, ch) => ({
      ...acc,
      [ch.id]: { spend: 0, leads: 0, customers: 0 }
    }), {})
  )
  const [ltv, setLtv] = useState(1500)

  useEffect(() => {
    if (!user) {
      setLoadingDefaults(false)
      return
    }

    async function loadDefaults() {
      try {
        const sources = []

        const [leadsStrategy, launchReadiness, continuityData] = await Promise.all([
          supabase
            .from('leads_assessments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          fetchLaunchReadiness(user.id),
          supabase
            .from('continuity_assessments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ])

        if (leadsStrategy?.data?.chosen_strategy) {
          const channelId = CORE_FOUR_CHANNEL_MAP[leadsStrategy.data.chosen_strategy]
          if (channelId) {
            setFocusedChannel(channelId)
            sources.push('Core Four Strategy')
          }
        }

        const corePrice = parseFloat(launchReadiness?.pricing_data?.coreOfferPrice) || 0
        const monthlyPrice = parseFloat(continuityData?.data?.monthly_price) || 0
        const months = parseFloat(continuityData?.data?.avg_retention_months) || 6
        const estimatedLtv = corePrice + (monthlyPrice * months)
        if (estimatedLtv > 0) {
          setLtv(Math.round(estimatedLtv))
          sources.push('Launch Readiness')
        }

        if (sources.length > 0) {
          setDataSource(sources.join(', '))
        }
      } catch (err) {
        console.error('Error loading CAC defaults:', err)
      } finally {
        setLoadingDefaults(false)
      }
    }

    loadDefaults()

    // Load projects
    async function loadProjects() {
      const { data } = await supabase
        .from('user_projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (data?.length > 0) {
        setProjects(data)
        setSelectedProject(data[0].id)
      }
    }
    loadProjects()
  }, [user])

  const calculations = useMemo(() => {
    let totalSpend = 0
    let totalLeads = 0
    let totalCustomers = 0

    const channelMetrics = CHANNELS.map(channel => {
      const data = channelData[channel.id]
      totalSpend += data.spend
      totalLeads += data.leads
      totalCustomers += data.customers

      const cpl = data.leads > 0 ? data.spend / data.leads : 0
      const cac = data.customers > 0 ? data.spend / data.customers : 0
      const conversionRate = data.leads > 0 ? (data.customers / data.leads) * 100 : 0
      const ltvCacRatio = cac > 0 ? ltv / cac : 0

      return {
        ...channel,
        ...data,
        cpl,
        cac,
        conversionRate,
        ltvCacRatio,
      }
    }).filter(ch => ch.spend > 0 || ch.leads > 0 || ch.customers > 0)

    const blendedCPL = totalLeads > 0 ? totalSpend / totalLeads : 0
    const blendedCAC = totalCustomers > 0 ? totalSpend / totalCustomers : 0
    const overallConversion = totalLeads > 0 ? (totalCustomers / totalLeads) * 100 : 0
    const ltvCacRatio = blendedCAC > 0 ? ltv / blendedCAC : 0

    const avgMonthlyRevenue = ltv / 12
    const paybackMonths = avgMonthlyRevenue > 0 ? blendedCAC / avgMonthlyRevenue : 0

    return {
      channelMetrics,
      totalSpend,
      totalLeads,
      totalCustomers,
      blendedCPL,
      blendedCAC,
      overallConversion,
      ltvCacRatio,
      paybackMonths,
    }
  }, [channelData, ltv])

  // Load saved marketing expenses when project selected
  useEffect(() => {
    if (!user || !selectedProject) return

    async function loadSaved() {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const { data } = await supabase
        .from('project_expenses')
        .select('*')
        .eq('project_id', selectedProject)
        .eq('month', month)
        .eq('expense_type', 'marketing')
        .eq('user_id', user.id)

      if (data?.length > 0) {
        setChannelData(prev => {
          const restored = { ...prev }
          data.forEach(exp => {
            if (restored[exp.category]) {
              restored[exp.category] = { ...restored[exp.category], spend: exp.amount || 0 }
            }
          })
          return restored
        })
        setSavedMonth(month)
      }
    }
    loadSaved()
  }, [user, selectedProject])

  async function handleSaveToProject() {
    if (!selectedProject || saving) return
    setSaving(true)

    try {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      // Delete existing marketing expenses for this project+month
      const { error: delError } = await supabase
        .from('project_expenses')
        .delete()
        .eq('project_id', selectedProject)
        .eq('month', month)
        .eq('expense_type', 'marketing')
        .eq('user_id', user.id)

      if (delError) {
        console.error('Error clearing old expenses:', delError)
        return
      }

      // Insert channels with spend > 0
      const rows = CHANNELS
        .filter(ch => channelData[ch.id].spend > 0)
        .map(ch => ({
          user_id: user.id,
          project_id: selectedProject,
          expense_type: 'marketing',
          category: ch.id,
          description: ch.name,
          amount: channelData[ch.id].spend,
          month,
          is_recurring: false,
        }))

      if (rows.length > 0) {
        const { error: insError } = await supabase.from('project_expenses').insert(rows)
        if (insError) {
          console.error('Error saving expenses:', insError)
          return
        }
      }

      setSavedMonth(month)
    } catch (err) {
      console.error('Save to project failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const hasSpend = Object.values(channelData).some(ch => ch.spend > 0)

  function updateChannel(channelId, field, value) {
    setChannelData(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        [field]: parseInt(value) || 0
      }
    }))
  }

  function getLtvCacStatus(ratio) {
    if (ratio >= 5) return { label: 'Excellent', cls: 'excellent' }
    if (ratio >= 3) return { label: 'Healthy', cls: 'healthy' }
    if (ratio >= 1) return { label: 'Break-even', cls: 'warning' }
    return { label: 'Losing Money', cls: 'danger' }
  }

  if (loadingDefaults) {
    return (
      <div className="cac-tracker">
        <div className="cac-toolbar">
          <button className="cac-back" onClick={() => navigate('/crm/tools/calculators')}>←</button>
          <h2 className="cac-toolbar-title">CAC Tracker</h2>
        </div>
        <div className="cac-loading">
          <div className="cac-spinner" />
          <p>Loading your data...</p>
        </div>
      </div>
    )
  }

  const ratioStatus = getLtvCacStatus(calculations.ltvCacRatio)

  return (
    <div className="cac-tracker">
      {/* TOOLBAR */}
      <div className="cac-toolbar">
        <button className="cac-back" onClick={() => navigate('/crm/tools/calculators')}>←</button>
        <h2 className="cac-toolbar-title">CAC Tracker</h2>
      </div>

      {/* HERO — Summary Stats */}
      <div className="cac-hero">
        <span className="cac-hero-label">Customer Acquisition Cost</span>
        <h2 className="cac-hero-title">${calculations.blendedCAC.toFixed(2)}</h2>
        <p className="cac-hero-sub">Blended CAC{dataSource ? ` — from: ${dataSource}` : ''}</p>
        <div className="cac-hero-stats">
          <div className="cac-hero-stat">
            <span className="cac-hero-stat-value">${calculations.totalSpend.toLocaleString()}</span>
            <span className="cac-hero-stat-label">Total Spend</span>
          </div>
          <div className="cac-hero-stat">
            <span className="cac-hero-stat-value">${calculations.blendedCPL.toFixed(2)}</span>
            <span className="cac-hero-stat-label">Blended CPL</span>
          </div>
          <div className="cac-hero-stat">
            <span className={`cac-hero-stat-value ${ratioStatus.cls}`}>{calculations.ltvCacRatio.toFixed(1)}:1</span>
            <span className="cac-hero-stat-label">LTV:CAC</span>
          </div>
          <div className="cac-hero-stat">
            <span className="cac-hero-stat-value">{calculations.paybackMonths.toFixed(1)} mo</span>
            <span className="cac-hero-stat-label">Payback</span>
          </div>
        </div>
      </div>

      {/* TIMEFRAME + LTV INPUT */}
      <div className="cac-card">
        <div className="cac-controls-row">
          <div className="cac-timeframe">
            {['month', 'quarter', 'year'].map(t => (
              <button
                key={t}
                className={`cac-timeframe-btn ${timeframe === t ? 'active' : ''}`}
                onClick={() => setTimeframe(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="cac-ltv-input">
            <label>Your LTV</label>
            <div className="cac-input-wrap prefix">
              <span className="cac-input-affix">$</span>
              <input
                type="number"
                value={ltv}
                onChange={e => setLtv(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CHANNEL INPUT CARDS */}
      <div className="cac-card">
        <div className="cac-section-header">
          <div className="cac-section-icon">📊</div>
          <span className="cac-section-title">Channel Breakdown</span>
        </div>
        <div className="cac-channels">
          {CHANNELS.map(channel => (
            <div
              key={channel.id}
              className={`cac-channel ${focusedChannel === channel.id ? 'focused' : ''}`}
            >
              <div className="cac-channel-head">
                <span className="cac-channel-icon">{channel.icon}</span>
                <span className="cac-channel-name">{channel.name}</span>
                {focusedChannel === channel.id && (
                  <span className="cac-focus-badge">Core Four</span>
                )}
              </div>
              <div className="cac-channel-inputs">
                <div className="cac-mini-field">
                  <label>Spend</label>
                  <div className="cac-input-wrap prefix small">
                    <span className="cac-input-affix">$</span>
                    <input
                      type="number"
                      value={channelData[channel.id].spend || ''}
                      onChange={e => updateChannel(channel.id, 'spend', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="cac-mini-field">
                  <label>Leads</label>
                  <input
                    type="number"
                    value={channelData[channel.id].leads || ''}
                    onChange={e => updateChannel(channel.id, 'leads', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="cac-mini-field">
                  <label>Customers</label>
                  <input
                    type="number"
                    value={channelData[channel.id].customers || ''}
                    onChange={e => updateChannel(channel.id, 'customers', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              {(channelData[channel.id].spend > 0 || channelData[channel.id].customers > 0) && (
                <div className="cac-channel-metrics">
                  <span>CPL: ${channelData[channel.id].leads > 0 ? (channelData[channel.id].spend / channelData[channel.id].leads).toFixed(2) : '—'}</span>
                  <span>CAC: ${channelData[channel.id].customers > 0 ? (channelData[channel.id].spend / channelData[channel.id].customers).toFixed(2) : '—'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RESULTS TABLE */}
      {calculations.channelMetrics.length > 0 && (
        <div className="cac-card">
          <div className="cac-section-header">
            <div className="cac-section-icon">📈</div>
            <span className="cac-section-title">Channel Performance</span>
          </div>
          <div className="cac-table-wrap">
            <table className="cac-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Spend</th>
                  <th>CAC</th>
                  <th>LTV:CAC</th>
                </tr>
              </thead>
              <tbody>
                {calculations.channelMetrics
                  .sort((a, b) => b.ltvCacRatio - a.ltvCacRatio)
                  .map(channel => {
                    const status = getLtvCacStatus(channel.ltvCacRatio)
                    return (
                      <tr key={channel.id}>
                        <td>
                          <span className="cac-table-channel">
                            {channel.icon} {channel.name}
                          </span>
                        </td>
                        <td>${channel.spend.toLocaleString()}</td>
                        <td>${channel.cac.toFixed(2)}</td>
                        <td className={status.cls}>{channel.ltvCacRatio.toFixed(1)}:1</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS */}
      {(calculations.ltvCacRatio < 3 || calculations.paybackMonths > 12 || calculations.channelMetrics.some(ch => ch.ltvCacRatio >= 5)) && (
        <div className="cac-card">
          <div className="cac-section-header">
            <div className="cac-section-icon">💡</div>
            <span className="cac-section-title">Recommendations</span>
          </div>
          <div className="cac-recs">
            {calculations.ltvCacRatio < 3 && calculations.ltvCacRatio > 0 && (
              <div className="cac-rec warning">
                <strong>Improve LTV:CAC Ratio</strong>
                <p>Your ratio of {calculations.ltvCacRatio.toFixed(1)}:1 is below the healthy 3:1 target. Consider raising prices, improving retention, or reducing acquisition costs.</p>
              </div>
            )}
            {calculations.paybackMonths > 12 && (
              <div className="cac-rec warning">
                <strong>Long Payback Period</strong>
                <p>At {calculations.paybackMonths.toFixed(1)} months, you need significant cash reserves. Focus on improving front-end conversions.</p>
              </div>
            )}
            {calculations.channelMetrics.some(ch => ch.ltvCacRatio >= 5) && (
              <div className="cac-rec success">
                <strong>Scale Top Performers</strong>
                <p>Channels with 5:1+ ratio: {calculations.channelMetrics.filter(ch => ch.ltvCacRatio >= 5).map(ch => ch.name).join(', ')}. Consider increasing budget.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Save to Project */}
      {projects.length > 0 && (
        <div className="cac-card cac-save-section">
          <div className="cac-section-header">
            <div className="cac-section-icon">💾</div>
            <span className="cac-section-title">Save to Project</span>
          </div>
          <select
            className="cac-project-select"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            className="cac-save-btn"
            onClick={handleSaveToProject}
            disabled={!hasSpend || !selectedProject || saving}
          >
            {saving ? 'Saving...' : savedMonth ? 'Update Expenses' : 'Save to Project'}
          </button>
          {savedMonth && (
            <p className="cac-saved-note">Saved for {new Date(savedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          )}
        </div>
      )}
    </div>
  )
}
