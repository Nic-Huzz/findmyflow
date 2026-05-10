/**
 * RevenueLogger — Log revenue for an experience.
 * Two modes: screenshot upload (AI extraction) or manual input.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticSuccess } from '../lib/haptics'
import './RevenueLogger.css'

export default function RevenueLogger({ experienceId, userId, currency = 'IDR', previousExperienceId }) {
  const [expanded, setExpanded] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prevRevenue, setPrevRevenue] = useState(null)

  // Load existing revenue + previous experience revenue
  useEffect(() => {
    if (!experienceId) return
    supabase
      .from('experiences')
      .select('total_revenue, revenue_notes, currency')
      .eq('id', experienceId)
      .single()
      .then(({ data }) => {
        if (data?.total_revenue != null) {
          setAmount(String(data.total_revenue))
          setNotes(data.revenue_notes || '')
          setSaved(true)
        }
      })

    if (previousExperienceId) {
      supabase
        .from('experiences')
        .select('total_revenue')
        .eq('id', previousExperienceId)
        .single()
        .then(({ data }) => {
          if (data?.total_revenue != null) setPrevRevenue(data.total_revenue)
        })
    }
  }, [experienceId, previousExperienceId])

  const handleSave = async () => {
    if (!amount || saving) return
    setSaving(true)
    await supabase
      .from('experiences')
      .update({
        total_revenue: parseFloat(amount),
        revenue_notes: notes || null,
      })
      .eq('id', experienceId)
    hapticSuccess()
    setSaved(true)
    setSaving(false)
  }

  const displayAmount = amount ? parseFloat(amount).toLocaleString() : '0'
  const currentNum = amount ? parseFloat(amount) : 0

  const vsLast = (() => {
    if (!saved || prevRevenue == null || currentNum === 0) return null
    if (prevRevenue === 0) return { label: 'New', type: 'neutral' }
    const pct = Math.round(((currentNum - prevRevenue) / prevRevenue) * 100)
    if (pct > 0) return { label: `+${pct}% vs last`, type: 'up' }
    if (pct < 0) return { label: `${pct}% vs last`, type: 'down' }
    return { label: 'Same as last', type: 'neutral' }
  })()

  return (
    <div className="rl-container">
      <button className="rl-header" onClick={() => setExpanded(!expanded)}>
        <div className="rl-header-left">
          <span className="rl-icon">💰</span>
          <div>
            <span className="rl-title">Revenue</span>
            <span className="rl-count">
              {saved ? `${currency} ${displayAmount}` : 'Not logged yet'}
              {vsLast && <span className={`rl-vs rl-vs-${vsLast.type}`}>{vsLast.label}</span>}
            </span>
          </div>
        </div>
        <span className={`rl-chevron ${expanded ? 'open' : ''}`}>›</span>
      </button>

      {expanded && (
        <div className="rl-body">
          <div className="rl-form">
            <div className="rl-input-row">
              <span className="rl-currency">{currency}</span>
              <input
                className="rl-amount-input"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setSaved(false) }}
              />
            </div>
            <input
              className="rl-notes-input"
              type="text"
              placeholder="Notes (optional, e.g. 12 tickets + 3 walk-ins)"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
            />
            {!saved ? (
              <button className="rl-save-btn" onClick={handleSave} disabled={!amount || saving}>
                {saving ? 'Saving...' : 'Save Revenue'}
              </button>
            ) : (
              <div className="rl-saved">Saved</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
