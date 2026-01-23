// src/components/Celebrations/Confetti.jsx
// Confetti burst animations using canvas-confetti

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

// Brand colors
const BRAND_COLORS = ['#5e17eb', '#7c3aed', '#ffdd27', '#22c55e']
const FIRE_COLORS = ['#f97316', '#ea580c', '#ffdd27']

/**
 * Trigger a confetti burst
 * @param {Object} options - Confetti options
 */
export function triggerConfetti(options = {}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    disableForReducedMotion: true
  }

  confetti({ ...defaults, ...options })
}

/**
 * Trigger a celebration confetti (larger burst)
 */
export function triggerCelebration() {
  const duration = 2000
  const animationEnd = Date.now() + duration

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    confetti({
      particleCount: 50,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2
      },
      colors: BRAND_COLORS,
      disableForReducedMotion: true
    })
  }, 250)
}

/**
 * Trigger fire-themed confetti for streaks
 */
export function triggerFireConfetti() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: FIRE_COLORS,
    shapes: ['circle'],
    gravity: 0.8,
    disableForReducedMotion: true
  })
}

/**
 * Trigger side cannons (for big wins)
 */
export function triggerSideCannons() {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    colors: BRAND_COLORS,
    disableForReducedMotion: true
  }

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0.1 }
  })

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    origin: { x: 0.9 }
  })

  fire(0.2, {
    spread: 60,
    origin: { x: 0.5 }
  })

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    origin: { x: 0.5 }
  })

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    origin: { x: 0.5 }
  })
}

/**
 * Component that triggers confetti on mount
 */
export function Confetti({ trigger, type = 'default' }) {
  useEffect(() => {
    if (!trigger) return

    switch (type) {
      case 'celebration':
        triggerCelebration()
        break
      case 'fire':
        triggerFireConfetti()
        break
      case 'cannons':
        triggerSideCannons()
        break
      default:
        triggerConfetti()
    }
  }, [trigger, type])

  return null
}

export default Confetti
