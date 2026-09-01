/**
 * IncomePrompt.jsx — Card 4: The First Dollar
 *
 * Celebration-framed income question.
 * "Your first dollar from doing what you love is a bigger deal than your first million."
 * Currency picker: USD, AUD, GBP, EUR, IDR.
 * Saves to income_self_reports. Triggers stage 8→9.
 * After first report, income question moves to Weekly Review.
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './IncomePrompt.css'

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD' },
  { code: 'AUD', symbol: 'A$', label: 'AUD' },
  { code: 'GBP', symbol: '£', label: 'GBP' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'IDR', symbol: 'Rp', label: 'IDR' },
]

function getCurrentMonthYear() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function IncomePrompt({ userId, onComplete, onClose }) {
  const [answered, setAnswered] = useState(null) // null | 'yes' | 'no'
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleYes = () => {
    hapticLight()
    setAnswered('yes')
  }

  const handleNotYet = () => {
    hapticLight()
    setAnswered('no')
  }

  const handleSave = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0 || saving) return
    setSaving(true)
    hapticSuccess()

    // Convert to cents (IDR has no fractional unit but we store as-is)
    const amountCents = Math.round(num * 100)

    await supabase.from('income_self_reports').upsert({
      user_id: userId,
      month_year: getCurrentMonthYear(),
      amount_cents: amountCents,
      currency,
      source: 'self_report',
    }, { onConflict: 'user_id,month_year' })

    setSaved(true)
    setTimeout(() => onComplete?.(), 2000)
  }

  // Saved celebration
  if (saved) {
    return (
      <div className="ip-container">
        <div className="ip-celebration">
          <div className="ip-celebration-emoji">🎉</div>
          <h2 className="ip-celebration-title">Stage 9: Reward</h2>
          <p className="ip-celebration-sub">You're earning from what you love. That changes everything.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ip-container">
      <button className="ip-close" onClick={onClose}>&times;</button>

      <div className="ip-content">
        <h2 className="ip-title">The First Dollar</h2>
        <p className="ip-quote">
          Your first dollar from doing what you love is a bigger deal than your first million.
        </p>

        {!answered && (
          <>
            <p className="ip-question">Have you earned anything from your experiences yet?</p>
            <p className="ip-hint">This could be a workshop fee, a coaching session, a ticket sale, anything.</p>
            <div className="ip-buttons">
              <button className="ip-btn ip-btn-yes" onClick={handleYes}>💰 Yes!</button>
              <button className="ip-btn ip-btn-no" onClick={handleNotYet}>Not yet</button>
            </div>
          </>
        )}

        {answered === 'yes' && (
          <div className="ip-amount-section">
            <p className="ip-amount-label">How much this month?</p>
            <div className="ip-amount-row">
              <select
                className="ip-currency-picker"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.label}</option>
                ))}
              </select>
              <input
                className="ip-amount-input"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="ip-save-btn"
              disabled={!amount || parseFloat(amount) <= 0 || saving}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}

        {answered === 'no' && (
          <div className="ip-not-yet">
            <p className="ip-not-yet-text">That's completely fine. This card will be here when you're ready.</p>
            <button className="ip-not-yet-btn" onClick={onClose}>Continue</button>
          </div>
        )}
      </div>
    </div>
  )
}
