/**
 * DirectionSection.jsx — Phase 2→3 bridge card container
 *
 * Shows on Discover tab when hero stage >= 8.
 * 5 bite-size cards, completed one at a time:
 * 1. Life Map Review
 * 2. Problem Motivation
 * 3. Multiplication Reveal
 * 4. Money Model
 * 5. First Income
 */

import { useState, useEffect } from 'react'
import { getDirectionStatus } from '../../lib/directionEngine'
import LifeMapReview from './LifeMapReview'
import ProblemMotivation from './ProblemMotivation'
import MultiplicationReveal from './MultiplicationReveal'
import IncomePrompt from './IncomePrompt'
import MoneyModelCard from './MoneyModelCard'
import './DirectionSection.css'

const CARDS = [
  { id: 'lifeMapReview', label: 'Review your life story', icon: '📖' },
  { id: 'problemMotivation', label: 'What drives you', icon: '🔥' },
  { id: 'multiplication', label: 'Your direction', icon: '✦' },
  { id: 'moneyModel', label: 'How to earn from this', icon: '📈' },
  { id: 'firstIncome', label: 'The first dollar', icon: '💰' },
]

export default function DirectionSection({ userId, onUpdate }) {
  const [status, setStatus] = useState(null)
  const [activeCard, setActiveCard] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStatus = async () => {
    if (!userId) return
    const s = await getDirectionStatus(userId)
    setStatus(s)
    setLoading(false)
  }

  useEffect(() => { loadStatus() }, [userId])

  if (loading || !status) return null

  const isComplete = (id) => status[id]
  const completedCount = CARDS.filter(c => isComplete(c.id)).length

  // Find next unlocked card (1-3 sequential, 4-5 accessible after 1-3 done)
  const coreComplete = isComplete('lifeMapReview') && isComplete('problemMotivation') && isComplete('multiplication')
  const nextCardId = CARDS.slice(0, 3).find(c => !isComplete(c.id))?.id
    || (coreComplete && !isComplete('moneyModel') ? 'moneyModel' : null)
    || (coreComplete && isComplete('moneyModel') && !isComplete('firstIncome') ? 'firstIncome' : null)

  const handleCardDone = () => {
    setActiveCard(null)
    loadStatus()
    onUpdate?.()
  }

  // Render active card full-screen
  if (activeCard === 'lifeMapReview') {
    return <LifeMapReview userId={userId} onComplete={handleCardDone} onClose={() => setActiveCard(null)} />
  }
  if (activeCard === 'problemMotivation') {
    return <ProblemMotivation userId={userId} onComplete={handleCardDone} onClose={() => setActiveCard(null)} />
  }
  if (activeCard === 'multiplication') {
    return <MultiplicationReveal userId={userId} problemSelections={status.problemSelections} onComplete={handleCardDone} onClose={() => setActiveCard(null)} />
  }
  if (activeCard === 'moneyModel') {
    return <MoneyModelCard userId={userId} onComplete={handleCardDone} onClose={() => setActiveCard(null)} />
  }
  if (activeCard === 'firstIncome') {
    return <IncomePrompt userId={userId} onComplete={handleCardDone} onClose={() => setActiveCard(null)} />
  }

  return (
    <div className="dir-section">
      <div className="dir-header">
        <span className="dir-header-icon">🧭</span>
        <span className="dir-header-title">Your Direction</span>
        <span className="dir-header-count">{completedCount}/{CARDS.length}</span>
      </div>

      <div className="dir-cards">
        {CARDS.map((card) => {
          const done = isComplete(card.id)
          const isNext = card.id === nextCardId
          const locked = !done && !isNext

          return (
            <button
              key={card.id}
              className={`dir-card ${done ? 'done' : ''} ${isNext ? 'next' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => {
                if (!locked) setActiveCard(card.id)
              }}
              disabled={locked}
            >
              <span className="dir-card-status">
                {done ? '✓' : isNext ? card.icon : '○'}
              </span>
              <span className="dir-card-label">{card.label}</span>
              {isNext && <span className="dir-card-arrow">›</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
