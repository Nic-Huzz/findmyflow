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
    heading: 'You know that feeling.',
    body: 'When fear turns into aliveness. When you do the scary thing and everything lights up instead of falling apart.',
    duration: 7000,
  },
  {
    heading: 'That feeling is trainable.',
    body: 'Every challenge here is designed to build your capacity for it. Remove what blocks it. Practice what creates it. Track what sustains it.',
    duration: 8000,
  },
  {
    heading: 'A gym for your nervous system.',
    body: null,
    duration: null,
    hasQuadrant: true,
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
        {slide.hasQuadrant && (
          <div className="ci-quadrant">
            <div className="ci-quad ci-quad-calm">
              <span className="ci-quad-label">Calm</span>
              <span className="ci-quad-sub">safe, but flat</span>
            </div>
            <div className="ci-quad ci-quad-vr">
              <span className="ci-quad-label">Vibe Rise</span>
              <span className="ci-quad-sub">expressing, safe</span>
            </div>
            <div className="ci-quad ci-quad-numb">
              <span className="ci-quad-label">Numb</span>
              <span className="ci-quad-sub">shutdown, not alive</span>
            </div>
            <div className="ci-quad ci-quad-anxious">
              <span className="ci-quad-label">Anxious</span>
              <span className="ci-quad-sub">performing, unsafe</span>
            </div>
            <span className="ci-axis ci-axis-y">Safety →</span>
            <span className="ci-axis ci-axis-x">Expression →</span>
          </div>
        )}
        {slide.hasButton && (
          <button className="challenge-intro-cta" onClick={handleComplete}>
            Let&apos;s Go
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
