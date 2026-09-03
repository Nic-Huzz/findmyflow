/**
 * MoneyModelCard.jsx — Direction Card 5: How people earn from this
 *
 * Shows the money model progression ladder with deal sizes and strategies.
 * Each level is expandable. First courage challenge suggested per level.
 * Universal guidance (not personalised — that's Scale Portal).
 */

import { useState } from 'react'
import { MONEY_MODEL_LADDER } from '../../data/moneyModelLadder'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './MoneyModelCard.css'

export default function MoneyModelCard({ userId, onComplete, onClose }) {
  const [expanded, setExpanded] = useState(new Set([0])) // Level 0 auto-expanded
  const [saving, setSaving] = useState(false)

  const toggleLevel = (level) => {
    hapticLight()
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  const handleDone = async () => {
    if (saving) return
    setSaving(true)
    hapticSuccess()

    await supabase.from('direction_reveals').upsert({
      user_id: userId,
      reveal_type: 'money_model',
      reveal_data: { viewed_at: new Date().toISOString() },
    }, { onConflict: 'user_id,reveal_type' })

    onComplete?.()
  }

  return (
    <div className="mmc-container">
      <button className="mmc-close" onClick={onClose}>&times;</button>

      <div className="mmc-header">
        <h2 className="mmc-title">How to earn from what you love</h2>
        <p className="mmc-subtitle">
          Six levels. Start at level 1. Each one builds on the last.
        </p>
      </div>

      <div className="mmc-ladder">
        {MONEY_MODEL_LADDER.map((model) => {
          const isOpen = expanded.has(model.level)
          return (
            <div key={model.id} className={`mmc-level ${isOpen ? 'open' : ''}`}>
              <button className="mmc-level-header" onClick={() => toggleLevel(model.level)}>
                <span className="mmc-level-num">{model.level}</span>
                <div className="mmc-level-info">
                  <span className="mmc-level-label">{model.icon} {model.label}</span>
                  <span className="mmc-level-deal">{model.dealSize}</span>
                </div>
                <span className="mmc-level-chevron">{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className="mmc-level-body">
                  <p className="mmc-level-desc">{model.description}</p>

                  <div className="mmc-strategies">
                    <div className="mmc-strategies-label">How to get there</div>
                    {model.strategies.map((s, i) => (
                      <div key={i} className="mmc-strategy">
                        <span className="mmc-strategy-dot">•</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mmc-courage">
                    <span className="mmc-courage-icon">⚡</span>
                    <span className="mmc-courage-text">{model.courageChallenge}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mmc-fixed">
        <button className="mmc-cta" onClick={handleDone} disabled={saving}>
          {saving ? 'Saving...' : 'Got it'}
        </button>
      </div>
    </div>
  )
}
