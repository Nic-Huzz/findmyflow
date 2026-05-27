/**
 * ExperienceHealthCard — shown on ExperienceDetail for completed/archived experiences.
 * Displays: attendees, revenue, costs, profit with delta vs previous.
 * Also shows linked Strike challenge status.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ExperienceHealthCard.css'

export default function ExperienceHealthCard({ experienceId, userId, previousExperienceId, ticketPrice }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!experienceId || !userId) return
    ;(async () => {
      try {
        const queries = [
          supabase.from('contact_experiences').select('id', { count: 'exact', head: true }).eq('experience_id', experienceId),
          supabase.from('experience_costs').select('amount').eq('experience_id', experienceId),
          supabase.from('groan_challenges').select('id, title, status').eq('experience_id', experienceId).eq('challenge_source', 'strike').limit(1).maybeSingle(),
        ]
        // Fetch previous experience data if linked
        if (previousExperienceId) {
          queries.push(
            supabase.from('contact_experiences').select('id', { count: 'exact', head: true }).eq('experience_id', previousExperienceId),
            supabase.from('experience_costs').select('amount').eq('experience_id', previousExperienceId),
            supabase.from('experiences').select('ticket_price').eq('id', previousExperienceId).maybeSingle(),
          )
        }

        const results = await Promise.all(queries)
        const attendees = results[0].count || 0
        const costs = (results[1].data || []).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)
        const strike = results[2].data || null

        const price = ticketPrice != null ? Number(ticketPrice) : null
        const revenue = price != null ? price * attendees : null
        const profit = revenue != null ? revenue - costs : null

        let prev = null
        if (previousExperienceId) {
          const prevAttendees = results[3].count || 0
          const prevCosts = (results[4].data || []).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)
          const prevPrice = results[5].data?.ticket_price != null ? Number(results[5].data.ticket_price) : null
          const prevRevenue = prevPrice != null ? prevPrice * prevAttendees : null
          const prevProfit = prevRevenue != null ? prevRevenue - prevCosts : null
          prev = { attendees: prevAttendees, costs: prevCosts, revenue: prevRevenue, profit: prevProfit }
        }

        setData({ attendees, costs, revenue, profit, strike, prev, hasRevenue: revenue != null })
      } catch (err) {
        console.error('ExperienceHealthCard error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [experienceId, userId, previousExperienceId, ticketPrice])

  if (loading || !data) return null

  const delta = (current, previous) => {
    if (previous == null || previous === 0) return null
    const diff = current - previous
    const pct = Math.round((diff / Math.abs(previous)) * 100)
    if (pct === 0) return { pct: 0, dir: 'flat' }
    return { pct: Math.abs(pct), dir: pct > 0 ? 'up' : 'down' }
  }

  const Delta = ({ current, previous, invert = false }) => {
    const d = delta(current, previous)
    if (!d) return null
    const isGood = invert ? d.dir === 'down' : d.dir === 'up'
    return (
      <span className={`ehc-delta ${isGood ? 'ehc-delta-good' : d.dir === 'flat' ? 'ehc-delta-flat' : 'ehc-delta-bad'}`}>
        {d.dir === 'up' ? '↑' : d.dir === 'down' ? '↓' : '→'} {d.pct}%
      </span>
    )
  }

  return (
    <div className="ehc-card">
      <div className="ehc-title">Experience Health</div>
      <div className="ehc-kpi-grid">
        <div className="ehc-kpi">
          <div className="ehc-kpi-val">{data.attendees}</div>
          <div className="ehc-kpi-label">Attendees</div>
          {data.prev && <Delta current={data.attendees} previous={data.prev.attendees} />}
        </div>
        <div className="ehc-kpi">
          <div className="ehc-kpi-val">{data.hasRevenue ? `$${data.revenue.toFixed(0)}` : '--'}</div>
          <div className="ehc-kpi-label">Revenue</div>
          {data.prev && data.hasRevenue && <Delta current={data.revenue} previous={data.prev.revenue} />}
        </div>
        <div className="ehc-kpi">
          <div className="ehc-kpi-val">${data.costs.toFixed(0)}</div>
          <div className="ehc-kpi-label">Costs</div>
          {data.prev && <Delta current={data.costs} previous={data.prev.costs} invert />}
        </div>
        <div className="ehc-kpi">
          <div className="ehc-kpi-val">{data.hasRevenue ? `$${data.profit.toFixed(0)}` : '--'}</div>
          <div className="ehc-kpi-label">Profit</div>
          {data.prev && data.hasRevenue && <Delta current={data.profit} previous={data.prev.profit} />}
        </div>
      </div>

      {data.strike && (
        <div className="ehc-strike">
          <span className="ehc-strike-icon">⚡</span>
          <span className="ehc-strike-title">{data.strike.title}</span>
          <span className={`ehc-strike-badge ehc-strike-${data.strike.status}`}>
            {data.strike.status === 'completed' ? 'Done' : 'Active'}
          </span>
        </div>
      )}
    </div>
  )
}
