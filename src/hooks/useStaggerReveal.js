import { useState, useEffect, useCallback } from 'react'

/**
 * useStaggerReveal — timer-based sequential reveal for results screens.
 *
 * Usage:
 *   const { isRevealed, revealStyle } = useStaggerReveal(count, active, { interval: 800 })
 *
 *   <div style={revealStyle(0)}>First item</div>
 *   <div style={revealStyle(1)}>Second item</div>
 *
 * Or with CSS classes:
 *   <div className={isRevealed(2) ? 'revealed' : ''}>Third</div>
 *
 * @param {number} count - total items to reveal
 * @param {boolean} active - whether stagger should run (e.g. step === STEPS.RESULTS)
 * @param {object} options
 * @param {number} options.interval - ms between reveals (default 800)
 */
export default function useStaggerReveal(count, active, { interval = 800 } = {}) {
  const [revealed, setRevealed] = useState(-1)

  useEffect(() => {
    if (!active || count <= 0) {
      setRevealed(-1)
      return
    }

    setRevealed(-1)
    const timers = []
    for (let i = 0; i < count; i++) {
      timers.push(
        setTimeout(() => setRevealed(i), (i + 1) * interval)
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [active, count, interval])

  const isRevealed = useCallback((index) => revealed >= index, [revealed])

  const revealStyle = useCallback((index) => ({
    opacity: revealed >= index ? 1 : 0,
    transform: revealed >= index ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  }), [revealed])

  return { isRevealed, revealStyle, revealed }
}
