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
          <div className="ci-tier-stack">
            <div className="ci-tier ci-tier-vr">
              <span className="ci-tier-name">Vibe Rise <span className="ci-tier-bracket ci-tier-bracket--vr">(Essence Archetype)</span></span>
            </div>
            <div className="ci-tier ci-tier-ventral">
              <span className="ci-tier-name">Fun <span className="ci-tier-bracket">(Ventral Vagal)</span></span>
            </div>
            <div className="ci-tier ci-tier-sympathetic">
              <span className="ci-tier-name">Pressure <span className="ci-tier-bracket">(Sympathetic)</span></span>
            </div>
            <div className="ci-tier ci-tier-dorsal">
              <span className="ci-tier-name">Auto-Pilot <span className="ci-tier-bracket">(Dorsal Vagal)</span></span>
            </div>
            <p className="ci-tier-tagline">Three states are mapped. <span className="ci-tier-gold">We train the fourth.</span></p>
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
