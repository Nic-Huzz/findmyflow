/**
 * ChallengeIntro.jsx
 *
 * First-visit animated narrative overlay for the 7-Day Challenge.
 * 3 slides with auto-advance + manual tap, shown once ever.
 *
 * Created: 2026-03-07
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ChallengeIntro.css'

const SLIDES = [
  {
    heading: 'You were built to play.',
    body: 'Somewhere along the way, you were told to be serious, be safe, be realistic.',
    duration: 7000,
  },
  {
    heading: 'This game changes that.',
    body: 'Every quest is designed to reconnect you with your curiosity, remove the fear blocking your path, and get you paid to do what you love.',
    duration: 8000,
  },
  {
    heading: 'Ready to turn life into a game?',
    body: null,
    duration: null, // waits for button
    hasButton: true,
  },
]

export default function ChallengeIntro({ userId, onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fading, setFading] = useState(false)

  const slide = SLIDES[currentSlide]
  const isLastSlide = currentSlide === SLIDES.length - 1

  const advanceSlide = useCallback(() => {
    if (isLastSlide || fading) return
    setFading(true)
    setTimeout(() => {
      setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1))
      setFading(false)
    }, 400)
  }, [isLastSlide, fading])

  // Auto-advance timer
  useEffect(() => {
    if (!slide.duration) return
    const timer = setTimeout(advanceSlide, slide.duration)
    return () => clearTimeout(timer)
  }, [currentSlide, slide.duration, advanceSlide])

  const handleTap = (e) => {
    // Don't advance on button click (button has its own handler)
    if (e.target.closest('.challenge-intro-cta')) return
    if (!isLastSlide) advanceSlide()
  }

  const handleComplete = () => {
    if (userId) {
      supabase
        .from('user_stage_progress')
        .update({ has_seen_challenge_intro: true })
        .eq('user_id', userId)
        .then()
    }
    onComplete()
  }

  return (
    <div className="challenge-intro-overlay" onClick={handleTap}>
      <div className={`challenge-intro-content ${fading ? 'fading' : ''}`}>
        <h1 className="challenge-intro-heading">{slide.heading}</h1>
        {slide.body && (
          <p className="challenge-intro-body">{slide.body}</p>
        )}
        {slide.hasButton && (
          <button className="challenge-intro-cta" onClick={handleComplete}>
            Let's Go
          </button>
        )}
      </div>

      <div className="challenge-intro-dots">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`challenge-intro-dot ${i <= currentSlide ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
