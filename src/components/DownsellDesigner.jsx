/**
 * DownsellDesigner — 2-question mini-flow on the Details tab.
 * Recommends Payment Plan / Trial With Penalty / Feature Downsell
 * with concrete examples using the experience type + ticket price.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './OfferDesigner.css'

const STRATEGIES = {
  payment_plan: {
    name: 'Payment Plan',
    emoji: '💳',
    desc: 'Same offer, spread the cost. Removes the price barrier without reducing value.',
    examples: (type, price) => [
      `${formatPrice(price * 0.3)} deposit now, rest on the day`,
      `3 payments of ${formatPrice(price / 3)}`,
      '"Pay what you can" with a minimum',
      'Bring a friend and split the cost',
    ],
  },
  trial: {
    name: 'Trial With Penalty',
    emoji: '🎟️',
    desc: 'Let them try before they commit. If they stay, they pay. Removes the trust barrier.',
    examples: (type, price) => [
      'First hour free. If you stay past the break, full price applies',
      `Free taster session this week. Full ${type} next month for ${formatPrice(price)}`,
      'Come as a guest once. If you come back, you pay',
      '"Satisfaction checkpoint" at the halfway mark',
    ],
  },
  feature_downsell: {
    name: 'Feature Downsell',
    emoji: '✂️',
    desc: 'Offer a lighter version. Different format, fewer features, lower price.',
    examples: (type, price) => [
      `Online version for ${formatPrice(price * 0.3)}`,
      `Half-day option for ${formatPrice(price * 0.5)}`,
      'Recording only (no live attendance)',
      `Group rate: 3 tickets for ${formatPrice(price * 2.5)}`,
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
  { id: 'expensive', label: 'Too expensive right now', icon: '💸' },
  { id: 'logistics', label: "Can't make the date or location", icon: '📅' },
  { id: 'trust', label: 'Not sure it\'s for them yet', icon: '🤔' },
  { id: 'unknown', label: "I don't know, they just don't sign up", icon: '❓' },
]

const Q2_OPTIONS = [
  { id: 'lighter', label: 'Yes, I could run it online or as a shorter session', icon: '✂️' },
  { id: 'taster', label: 'I could offer a free taster or intro first', icon: '🎟️' },
  { id: 'payment', label: 'Not really, but I could offer a payment plan or deposit', icon: '💳' },
]

function getStrategy(q1, q2) {
  // Rule 1: logistics → always feature downsell
  if (q1 === 'logistics') return 'feature_downsell'
  // Rule 2: taster offered, or trust + payment only → trial
  if (q2 === 'taster') return 'trial'
  if (q1 === 'trust' && q2 === 'payment') return 'trial'
  // Rule 3: payment plan
  if (q2 === 'payment') return 'payment_plan'
  // Rule 4: everything else → feature downsell
  return 'feature_downsell'
}

export default function DownsellDesigner({ experienceId, experienceType, ticketPrice }) {
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
      .select('downsell_strategy, downsell_answers')
      .eq('id', experienceId)
      .single()
      .then(({ data }) => {
        if (data?.downsell_strategy) {
          setSavedStrategy(data.downsell_strategy)
          if (data.downsell_answers) {
            setQ1(data.downsell_answers.q1)
            setQ2(data.downsell_answers.q2)
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
        downsell_strategy: strategy,
        downsell_answers: { q1, q2 },
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
          <span className="od-icon">🛟</span>
          <div>
            <span className="od-title">Downsell Strategy</span>
            <span className="od-count">
              {saved && result ? result.name : 'Capture the "no"'}
            </span>
          </div>
        </div>
        <span className={`od-chevron ${expanded ? 'open' : ''}`}>›</span>
      </button>

      {expanded && (
        <div className="od-body">
          {!saved && (
            <>
              <div className="od-question">
                <span className="od-q-label">Why do people say no to your events?</span>
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

              {q1 && (
                <div className="od-question">
                  <span className="od-q-label">Can you offer a lighter version?</span>
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
