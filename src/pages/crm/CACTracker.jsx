/**
 * CAC Tracker - Customer Acquisition Cost Calculator
 * Tracks marketing spend and calculates cost per customer
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './CACTracker.css'

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
  const [timeframe, setTimeframe] = useState('month')
  const [channelData, setChannelData] = useState(
    CHANNELS.reduce((acc, ch) => ({
      ...acc,
      [ch.id]: { spend: 0, leads: 0, customers: 0 }
    }), {})
  )
  const [ltv, setLtv] = useState(1500) // Average LTV for ratio calculation

  // Calculate totals and metrics
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

    // Payback period (months)
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
    if (ratio >= 5) return { label: 'Excellent', class: 'excellent' }
    if (ratio >= 3) return { label: 'Healthy', class: 'healthy' }
    if (ratio >= 1) return { label: 'Break-even', class: 'warning' }
    return { label: 'Losing Money', class: 'danger' }
  }

  return (
    <div className="cac-tracker">
      <header className="cac-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>CAC Tracker</h1>
          <p>Customer Acquisition Cost by Channel</p>
        </div>
        <div className="timeframe-toggle">
          <button
            className={timeframe === 'month' ? 'active' : ''}
            onClick={() => setTimeframe('month')}
          >
            Month
          </button>
          <button
            className={timeframe === 'quarter' ? 'active' : ''}
            onClick={() => setTimeframe('quarter')}
          >
            Quarter
          </button>
          <button
            className={timeframe === 'year' ? 'active' : ''}
            onClick={() => setTimeframe('year')}
          >
            Year
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="cac-summary">
        <div className="summary-card">
          <span className="summary-label">Total Spend</span>
          <span className="summary-value">${calculations.totalSpend.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Blended CPL</span>
          <span className="summary-value">${calculations.blendedCPL.toFixed(2)}</span>
        </div>
        <div className="summary-card primary">
          <span className="summary-label">Blended CAC</span>
          <span className="summary-value">${calculations.blendedCAC.toFixed(2)}</span>
        </div>
        <div className={`summary-card ${getLtvCacStatus(calculations.ltvCacRatio).class}`}>
          <span className="summary-label">LTV:CAC Ratio</span>
          <span className="summary-value">{calculations.ltvCacRatio.toFixed(1)}:1</span>
          <span className="summary-status">{getLtvCacStatus(calculations.ltvCacRatio).label}</span>
        </div>
      </div>

      {/* LTV Input */}
      <div className="ltv-input-row">
        <label>Your Average LTV (for ratio calculation)</label>
        <div className="input-with-prefix">
          <span>$</span>
          <input
            type="number"
            value={ltv}
            onChange={e => setLtv(parseInt(e.target.value) || 0)}
          />
        </div>
        <span className="payback-info">
          Payback Period: <strong>{calculations.paybackMonths.toFixed(1)} months</strong>
        </span>
      </div>

      {/* Channel Input Grid */}
      <section className="channels-section">
        <h2>Channel Breakdown</h2>
        <div className="channels-grid">
          {CHANNELS.map(channel => (
            <div key={channel.id} className="channel-card" style={{ '--channel-color': channel.color }}>
              <div className="channel-header">
                <span className="channel-icon">{channel.icon}</span>
                <span className="channel-name">{channel.name}</span>
              </div>
              <div className="channel-inputs">
                <div className="input-group">
                  <label>Spend</label>
                  <div className="input-with-prefix small">
                    <span>$</span>
                    <input
                      type="number"
                      value={channelData[channel.id].spend || ''}
                      onChange={e => updateChannel(channel.id, 'spend', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Leads</label>
                  <input
                    type="number"
                    value={channelData[channel.id].leads || ''}
                    onChange={e => updateChannel(channel.id, 'leads', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="input-group">
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
                <div className="channel-metrics">
                  <span>CPL: ${channelData[channel.id].leads > 0 ? (channelData[channel.id].spend / channelData[channel.id].leads).toFixed(2) : '—'}</span>
                  <span>CAC: ${channelData[channel.id].customers > 0 ? (channelData[channel.id].spend / channelData[channel.id].customers).toFixed(2) : '—'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Results Table */}
      {calculations.channelMetrics.length > 0 && (
        <section className="results-section">
          <h2>Channel Performance</h2>
          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Spend</th>
                  <th>Leads</th>
                  <th>Customers</th>
                  <th>CPL</th>
                  <th>CAC</th>
                  <th>Conv %</th>
                  <th>LTV:CAC</th>
                </tr>
              </thead>
              <tbody>
                {calculations.channelMetrics
                  .sort((a, b) => b.ltvCacRatio - a.ltvCacRatio)
                  .map(channel => (
                    <tr key={channel.id}>
                      <td>
                        <span className="channel-badge" style={{ background: channel.color }}>
                          {channel.icon} {channel.name}
                        </span>
                      </td>
                      <td>${channel.spend.toLocaleString()}</td>
                      <td>{channel.leads}</td>
                      <td>{channel.customers}</td>
                      <td>${channel.cpl.toFixed(2)}</td>
                      <td>${channel.cac.toFixed(2)}</td>
                      <td>{channel.conversionRate.toFixed(1)}%</td>
                      <td className={getLtvCacStatus(channel.ltvCacRatio).class}>
                        {channel.ltvCacRatio.toFixed(1)}:1
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total/Blended</strong></td>
                  <td><strong>${calculations.totalSpend.toLocaleString()}</strong></td>
                  <td><strong>{calculations.totalLeads}</strong></td>
                  <td><strong>{calculations.totalCustomers}</strong></td>
                  <td><strong>${calculations.blendedCPL.toFixed(2)}</strong></td>
                  <td><strong>${calculations.blendedCAC.toFixed(2)}</strong></td>
                  <td><strong>{calculations.overallConversion.toFixed(1)}%</strong></td>
                  <td className={getLtvCacStatus(calculations.ltvCacRatio).class}>
                    <strong>{calculations.ltvCacRatio.toFixed(1)}:1</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="recommendations">
        <h2>💡 Recommendations</h2>
        <div className="rec-cards">
          {calculations.ltvCacRatio < 3 && (
            <div className="rec-card warning">
              <strong>Improve LTV:CAC Ratio</strong>
              <p>Your ratio of {calculations.ltvCacRatio.toFixed(1)}:1 is below the healthy 3:1 target. Consider raising prices, improving retention, or reducing acquisition costs.</p>
            </div>
          )}
          {calculations.paybackMonths > 12 && (
            <div className="rec-card warning">
              <strong>Long Payback Period</strong>
              <p>At {calculations.paybackMonths.toFixed(1)} months to payback, you need significant cash reserves. Focus on improving front-end offer conversions.</p>
            </div>
          )}
          {calculations.channelMetrics.some(ch => ch.ltvCacRatio >= 5) && (
            <div className="rec-card success">
              <strong>Scale Top Performers</strong>
              <p>You have channels with 5:1+ LTV:CAC. Consider increasing budget on {calculations.channelMetrics.filter(ch => ch.ltvCacRatio >= 5).map(ch => ch.name).join(', ')}.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
