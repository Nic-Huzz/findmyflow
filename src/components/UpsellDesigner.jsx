/**
 * UpsellDesigner — 2-question mini-flow on the Details tab.
 * Recommends Classic/Menu/Anchor/Rollover upsell strategy
 * with concrete examples using the experience type + ticket price.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './OfferDesigner.css'

const STRATEGIES = {
  classic: {
    name: 'Classic Upsell',
    emoji: '🎁',
    desc: 'Offer something extra at the point of purchase. Simple, low-friction, instant revenue boost.',
    examples: (type, price) => [
      `Add the recording for ${formatPrice(price * 0.15)}`,
      'Materials pack or workbook for a small fee',
      'Follow-up group chat access',
      'Priority seating or early entry',
    ],
  },
  menu: {
    name: 'Menu Upsell',
    emoji: '📋',
    desc: 'Offer tiered tickets so people self-select into the level that fits them.',
    examples: (type, price) => [
      `Standard: ${formatPrice(price)} | VIP + 1:1 follow-up: ${formatPrice(price * 2.5)}`,
      `Early Bird: ${formatPrice(price * 0.8)} | Regular: ${formatPrice(price)} | VIP: ${formatPrice(price * 2)}`,
      'Group table discount for 4+ people',
    ],
  },
  anchor: {
    name: 'Anchor Upsell',
    emoji: '⚓',
    desc: 'Show your premium offer first. The high price makes your main offer feel like a steal.',
    examples: (type, price) => [
      `Show your retreat (${formatPrice(price * 10)}) first, then this ${type} feels affordable at ${formatPrice(price)}`,
      'Lead with the 1:1 package price, then offer the group version',
      '"Most people start here" label on the mid-tier',
    ],
  },
  rollover: {
    name: 'Rollover Upsell',
    emoji: '🔄',
    desc: 'Credit what they paid toward your bigger offer. Turns every ticket into a stepping stone.',
    examples: (type, price) => [
      `"Your ${formatPrice(price)} counts toward the retreat if you book within 30 days"`,
      'Alumni pricing: past attendees get their ticket credited to the next tier',
      '"Upgrade to the full programme and today is free"',
    ],
  },
}

function formatPrice(n) {
  if (!n || n <= 0) return '$X'
  return '$' + Math.round(n).toLocaleString()
}

const TYPE_LABELS = {
  workshop: 'workshop', retreat: 'retreat', circle: 'circle',
  online: 'online session', one_on_one: '1:1 session', popup: 'pop-up event', course: 'course',
}
function humanType(t) { return TYPE_LABELS[t] || t || 'experience' }

const Q1_OPTIONS = [
  { id: 'addon', label: 'Yes, a recording, workbook, or digital follow-up', icon: '📦' },
  { id: 'vip', label: 'Yes, VIP seating, 1:1 time, or extended session', icon: '⭐' },
  { id: 'none', label: 'No, this is my only offer right now', icon: '🤷' },
]

const Q2_OPTIONS = [
  { id: 'revenue', label: 'Earn more per attendee at this event', icon: '💰' },
  { id: 'ascension', label: 'Move attendees toward my bigger offer', icon: '🚀' },
]

function getStrategy(q1, q2) {
  if (q2 === 'ascension') return q1 === 'vip' ? 'anchor' : 'rollover'
  if (q1 === 'vip') return 'menu'
  return 'classic'
}

export default function UpsellDesigner({ experienceId, experienceType, ticketPrice }) {
  const [expanded, setExpanded] = useState(false)
  const [q1, setQ1] = useState(null)
  const [q2, setQ2] = useState(null)
  const [saved, setSaved] = useState(false)
  const [savedStrategy, setSavedStrategy] = useState(null)

  // Load existing result
  useEffect(() => {
    if (!experienceId) return
    supabase
      .from('experiences')
      .select('upsell_strategy, upsell_answers')
      .eq('id', experienceId)
      .single()
      .then(({ data }) => {
        if (data?.upsell_strategy) {
          setSavedStrategy(data.upsell_strategy)
          if (data.upsell_answers) {
            setQ1(data.upsell_answers.q1)
            setQ2(data.upsell_answers.q2)
          }
          setSaved(true)
        }
      })
  }, [experienceId])

  const strategy = (q1 && q2) ? getStrategy(q1, q2) : savedStrategy
  const result = strategy ? STRATEGIES[strategy] : null

  const handleSelect = (question, value) => {
    hapticLight()
    if (question === 'q1') setQ1(value)
    if (question === 'q2') setQ2(value)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!strategy || !experienceId) return
    await supabase
      .from('experiences')
      .update({
        upsell_strategy: strategy,
        upsell_answers: { q1, q2 },
      })
      .eq('id', experienceId)
    hapticSuccess()
    setSavedStrategy(strategy)
    setSaved(true)
  }

  const handleRetake = () => {
    setQ1(null)
    setQ2(null)
    setSaved(false)
    setSavedStrategy(null)
  }

  return (
    <div className="od-container">
      <button className="od-header" onClick={() => setExpanded(!expanded)}>
        <div className="od-header-left">
          <span className="od-icon">📈</span>
          <div>
            <span className="od-title">Upsell Strategy</span>
            <span className="od-count">
              {saved && result ? result.name : 'Design your upsell'}
            </span>
          </div>
        </div>
        <span className={`od-chevron ${expanded ? 'open' : ''}`}>›</span>
      </button>

      {expanded && (
        <div className="od-body">
          {/* Q1 */}
          {!saved && (
            <>
              <div className="od-question">
                <span className="od-q-label">Can you add a premium option to this experience?</span>
                <div className="od-options">
                  {Q1_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      className={`od-option ${q1 === opt.id ? 'selected' : ''}`}
                      onClick={() => handleSelect('q1', opt.id)}
                    >
                      <span className="od-option-icon">{opt.icon}</span>
                      <span className="od-option-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              {q1 && (
                <div className="od-question">
                  <span className="od-q-label">What's your goal with the upsell?</span>
                  <div className="od-options">
                    {Q2_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        className={`od-option ${q2 === opt.id ? 'selected' : ''}`}
                        onClick={() => handleSelect('q2', opt.id)}
                      >
                        <span className="od-option-icon">{opt.icon}</span>
                        <span className="od-option-label">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Result */}
          {result && (q1 && q2 || saved) && (
            <div className="od-result">
              <div className="od-result-header">
                <span className="od-result-emoji">{result.emoji}</span>
                <div>
                  <span className="od-result-name">{result.name}</span>
                  <span className="od-result-desc">{result.desc}</span>
                </div>
              </div>

              <div className="od-examples">
                <span className="od-examples-label">Ideas for your {humanType(experienceType)}</span>
                {result.examples(humanType(experienceType), ticketPrice).map((ex, i) => (
                  <div key={i} className="od-example">
                    <span className="od-example-bullet">•</span>
                    <span>{ex}</span>
                  </div>
                ))}
              </div>

              {!saved ? (
                <button className="od-save" onClick={handleSave}>Save Strategy</button>
              ) : (
                <div className="od-saved-row">
                  <span className="od-saved-label">Saved</span>
                  <button className="od-retake" onClick={handleRetake}>Retake</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
