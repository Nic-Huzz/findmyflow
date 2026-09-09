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
    heading: 'Something cracked. That\'s not a breakdown. That\'s your origin story.',
    body: [
      'Every hero starts here. The old version stopped working.',
      'Good.',
    ],
    duration: 6000,
  },
  {
    heading: 'Here\'s what happens next.',
    body: [
      'Step 1: Discover what lights you up.',
      'Step 2: Turn them into life paths.',
      'Step 3: Face what scares you. Watch your comfort zone grow.',
    ],
    duration: 8000,
  },
  {
    heading: 'Your quest starts now.',
    body: [],
    duration: null,
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
        .upsert({
          user_id: userId,
          has_seen_challenge_intro: true,
        }, { onConflict: 'user_id' })
        .then()
    }
    onComplete()
  }

  return (
    <div className="challenge-intro-overlay" onClick={handleTap}>
      <div className={`challenge-intro-content ${fading ? 'fading' : ''}`}>
        <h1 className="challenge-intro-heading">{slide.heading}</h1>
        {slide.body && (
          <div className="challenge-intro-body">
            {slide.body.map((line, i) => (
              <p key={i} className="challenge-intro-line">{line}</p>
            ))}
          </div>
        )}
        {slide.hasButton && (
          <button className="challenge-intro-cta" onClick={handleComplete}>
            Begin Your Journey
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
