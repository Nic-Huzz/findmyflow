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
    heading: 'Something cracked.',
    body: [
      'Maybe it was burnout.',
      'Maybe it was a quiet realisation that the life you built isn\'t the one you want.',
      'Either way, you\'re here because the old version stopped working.',
    ],
    duration: 7000,
  },
  {
    heading: 'That\'s not a breakdown. That\'s your origin story.',
    body: [
      'Every hero starts in the Ordinary World. Then something breaks them open.',
      'Right now you\'re answering the Call to Adventure.',
      'This app is your map through the journey.',
    ],
    duration: 8000,
  },
  {
    heading: 'Your journey starts with self-knowledge.',
    body: [
      'Map your curiosities.',
      'Trace your life story.',
      'See which paths are open to you.',
      'Then start doing the things that scare you a little.',
    ],
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
