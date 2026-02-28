import { useState } from 'react'
import gamesData from '../../data/founderDnaGames'

export default function GameSelection({ onComplete }) {
  const [selected, setSelected] = useState(new Set())

  const toggle = (gameName) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(gameName)) {
        next.delete(gameName)
      } else if (next.size < 5) {
        next.add(gameName)
      }
      return next
    })
  }

  const allGames = gamesData.categories.flatMap((c) => c.games)
  const selectedGames = allGames.filter((g) => selected.has(g.name))
  const canContinue = selected.size >= 3

  return (
    <>
      <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 20 }}>
        <span className="pp-badge">Step 1 of 4</span>
        <h1>What do you love to play?</h1>
        <p className="pp-subtitle">
          Pick 3-5 games or activities you genuinely enjoy. No wrong answers.
        </p>
      </div>

      <div className={`pp-counter ${canContinue ? 'ready' : 'pending'}`}>
        {selected.size >= 3
          ? `${selected.size} selected \u2014 ready!${selected.size < 5 ? ' (up to 5)' : ''}`
          : `${selected.size} selected \u2014 pick at least ${3 - selected.size} more`}
      </div>

      {gamesData.categories.map((category) => (
        <div key={category.name}>
          <div className="pp-category-header">{category.name}</div>
          <div className="pp-game-grid">
            {category.games.map((game) => (
              <div
                key={game.name}
                className={`pp-game-card ${selected.has(game.name) ? 'selected' : ''}`}
                onClick={() => toggle(game.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(game.name))}
              >
                <span className="pp-game-icon">{game.icon}</span>
                <span className="pp-game-name">{game.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="pp-sticky-cta">
        <button
          className="pp-btn-gold"
          disabled={!canContinue}
          onClick={() => onComplete(selectedGames)}
        >
          {canContinue ? "Let's Go!" : `Pick ${3 - selected.size} more`}
        </button>
      </div>
    </>
  )
}
