/**
 * useScoreAnimation — Animates number transitions over 600ms
 * when source scores change. Uses requestAnimationFrame for smooth counting.
 *
 * @param {Object} scores - { [key]: number } raw scores
 * @param {number} duration - animation duration in ms (default 600)
 * @returns {Object} { [key]: number } animated scores (same shape as input)
 */
import { useState, useEffect, useRef } from 'react'

export function useScoreAnimation(scores, duration = 600) {
  const [animated, setAnimated] = useState(scores || {})
  const prevRef = useRef(scores || {})
  const rafRef = useRef(null)

  useEffect(() => {
    if (!scores) return

    const prev = prevRef.current
    const keys = Object.keys(scores)

    // Check if anything actually changed
    const hasChange = keys.some(k => (prev[k] || 0) !== (scores[k] || 0))
    if (!hasChange) {
      prevRef.current = scores
      setAnimated(scores)
      return
    }

    const startTime = performance.now()
    const startValues = { ...prev }

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      const frame = {}
      for (const key of keys) {
        const from = startValues[key] || 0
        const to = scores[key] || 0
        frame[key] = Math.round(from + (to - from) * eased)
      }
      setAnimated(frame)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    prevRef.current = scores

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scores, duration])

  return animated
}
