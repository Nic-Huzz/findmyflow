/**
 * SwipeCardDeck
 *
 * Reusable binary-choice card deck (keep / reject) with progress dots,
 * back navigation, and touch swipe gestures. Extracted from EssenceMirrorFlow
 * so multiple flows can share the same interaction.
 *
 * Design:
 * - The deck is content-agnostic. Consumers pass a `renderCard` render prop
 *   to control the inside of each card.
 * - Kept/rejected state is tracked internally, surfaced via `onComplete`
 *   when the last card is decided.
 * - Supports multi-round use via `totalDots` and `dotOffset` so a host flow
 *   can render the deck multiple times (one per round) while showing
 *   a single unified progress bar.
 *
 * Usage:
 *   <SwipeCardDeck
 *     cards={[{ id: 'a' }, { id: 'b' }]}
 *     renderCard={(card, { isKept }) => <div>{card.label}</div>}
 *     onComplete={(keptIds) => ...}
 *     headerText="Does this sound like you?"
 *     onBackFromFirst={() => goToPreviousScreen()}
 *   />
 */

import { useState, useRef } from 'react'
import './SwipeCardDeck.css'

export default function SwipeCardDeck({
  cards,
  renderCard,
  onComplete,
  onBackFromFirst,
  onCardKept,
  onCardRejected,
  headerText,
  initialKeptIds = [],
  initialIndex = 0,
  keepLabel = "That's me",
  rejectLabel = 'Not me',
  backLabel = '← Back',
  totalDots,
  dotOffset = 0,
  showBackButton = true,
}) {
  const [index, setIndex] = useState(initialIndex)
  const [keptIds, setKeptIds] = useState(() => new Set(initialKeptIds))
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const currentCard = cards?.[index]
  if (!currentCard) return null

  const isLast = index === cards.length - 1
  const isKept = keptIds.has(currentCard.id)
  const globalDotIndex = dotOffset + index
  const dotCount = totalDots ?? cards.length

  const advance = (updatedKept) => {
    const keptArray = [...(updatedKept || keptIds)]
    if (isLast) {
      onComplete?.(keptArray)
    } else {
      setIndex(i => i + 1)
    }
  }

  const goBack = () => {
    if (index > 0) {
      setIndex(i => i - 1)
    } else {
      onBackFromFirst?.()
    }
  }

  const handleReject = () => {
    // Actively deselect if previously kept (user changed their mind)
    if (keptIds.has(currentCard.id)) {
      const nextKept = new Set(keptIds)
      nextKept.delete(currentCard.id)
      setKeptIds(nextKept)
    }
    onCardRejected?.(currentCard.id)
    advance()
  }

  const handleKeep = () => {
    let nextKept = keptIds
    if (!keptIds.has(currentCard.id)) {
      nextKept = new Set(keptIds).add(currentCard.id)
      setKeptIds(nextKept)
    }
    onCardKept?.(currentCard.id)
    advance(nextKept)
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
    const diff = touchStartX.current - touchEndX.current
    if (diff > 50) {
      handleReject()
    } else if (diff < -50) {
      handleKeep()
    }
  }

  return (
    <div
      className="swipe-deck"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="swipe-deck-dots">
        {Array.from({ length: dotCount }).map((_, i) => (
          <div
            key={i}
            className={`swipe-deck-dot ${i === globalDotIndex ? 'active' : i < globalDotIndex ? 'done' : ''}`}
          />
        ))}
      </div>

      {headerText && (
        <div className="swipe-deck-header">
          <p className="swipe-deck-subtitle">{headerText}</p>
        </div>
      )}

      <div className="swipe-deck-middle">
        <div
          className={`swipe-deck-card ${isKept ? 'selected' : ''}`}
          key={currentCard.id}
        >
          {renderCard(currentCard, { isKept, index, total: cards.length })}
          {isKept && <div className="swipe-deck-check">&#10003;</div>}
        </div>
      </div>

      <div className="swipe-deck-bottom">
        <div className="swipe-deck-actions">
          <button className="swipe-deck-btn no" type="button" onClick={handleReject}>
            {rejectLabel}
          </button>
          <button className="swipe-deck-btn yes" type="button" onClick={handleKeep}>
            {keepLabel}
          </button>
        </div>
        {showBackButton && (
          <button
            className="swipe-deck-back-btn"
            type="button"
            onClick={goBack}
          >
            {backLabel}
          </button>
        )}
      </div>
    </div>
  )
}
