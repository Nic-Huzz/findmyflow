/**
 * WhyICreatedThis.jsx
 *
 * Cinematic full-screen explainer slides — Nic's story of turning
 * pain into purpose. Public page (no auth), shareable as marketing/about.
 *
 * Created: Feb 2026
 */

import { useState, useEffect, useCallback } from 'react'
import './WhyICreatedThis.css'

const SLIDES = [
  {
    title: 'PAIN INTO PURPOSE',
    body: "Why did I create this? I'm a big believer of turning pain into purpose and the most painful experience of my life was failing to find fulfilment in my dream job.",
  },
  {
    title: 'THE BETRAYAL',
    body: "I felt betrayed. For 18+ years of my life I'd suffered through school, uni and part-time jobs to get to this dream job... Why?\n\nBecause I thought it guaranteed happiness, fulfilment and joy. Why else would everyone follow this path?",
  },
  {
    title: 'THE SYSTEM',
    preQuote: 'This James Clear quote lit a spark in me:',
    quote: '"You don\'t rise to the level of your goals, you fall to the level of your systems."',
    attribution: '— James Clear',
    body: "It made me realise there must be a system out there to achieve any intention.\n\nIt became my mission to figure out the exact system that would guide people to do what I wish the traditional education system did for me:\n\nMonetise my mission to gain financial + location independence.",
  },
  {
    title: 'THE EVOLUTION',
    body: "After 2.5 years of living in Bali working for myself I now feel confident enough that I've figured out how to do exactly that.\n\nThis app hosts the best of everything I learnt in my 5 year journey.",
  },
  {
    title: 'THE REAL BLOCKER',
    preQuote: 'Key realisation in my journey:',
    quote: '"We don\'t rise to the level of our ambitions — we fall to the level that feels safe."',
    body: "It's not a lack of knowledge or ambition that limits our success. It's how we don't feel safe to take the action we know we need to take.",
  },
  {
    title: 'THE INVITATION',
    body: "Unlike other business accelerators that simply focus on giving you more knowledge.\n\nThis process is designed to identify what action you need to take then heal whatever inside you doesn't feel safe and is stopping that action.\n\nWrapped in a game to make it fun.",
    isFinal: true,
  },
]

export default function WhyICreatedThis() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fadeClass, setFadeClass] = useState('fade-in')

  const goTo = useCallback((index) => {
    if (index === currentSlide || index < 0 || index >= SLIDES.length) return
    setFadeClass('fade-out')
    setTimeout(() => {
      setCurrentSlide(index)
      setFadeClass('fade-in')
    }, 250)
  }, [currentSlide])

  const handleNext = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo])
  const handlePrev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext, handlePrev])

  // Touch swipe
  useEffect(() => {
    let startX = 0
    let startY = 0
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return
      if (dx < 0) handleNext()
      else handlePrev()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [handleNext, handlePrev])

  const slide = SLIDES[currentSlide]
  const isFirst = currentSlide === 0
  const isLast = currentSlide === SLIDES.length - 1

  return (
    <div className="why-i-created-this">
      {/* Progress dots */}
      <div className="wict-progress">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`wict-dot${i === currentSlide ? ' active' : ''}${i < currentSlide ? ' completed' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide */}
      <div className={`wict-slide ${fadeClass}`}>
        <h1 className="wict-title">{slide.title}</h1>

        {slide.preQuote && (
          <p className="wict-pre-quote">{slide.preQuote}</p>
        )}

        {slide.quote && (
          <blockquote className="wict-quote">
            {slide.quote}
            <cite>{slide.attribution}</cite>
          </blockquote>
        )}

        {slide.body && (
          <div className="wict-body">
            {slide.body.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {slide.evolution && (
          <div className="wict-evolution">
            {slide.evolution.map((name, i) => (
              <div key={i} className="evo-step">
                <span className="evo-number">{i + 1}</span>
                <span className="evo-name">{name}</span>
                {i < slide.evolution.length - 1 && <span className="evo-arrow">&#x2193;</span>}
              </div>
            ))}
          </div>
        )}

        {slide.footer && (
          <p className="wict-footer">{slide.footer}</p>
        )}

        {slide.isFinal && (
          <a href="/get-started" className="wict-cta">
            Start Your Journey
          </a>
        )}
      </div>

      {/* Navigation */}
      <div className="wict-nav">
        {!isFirst && (
          <button className="wict-btn secondary" onClick={handlePrev}>
            &#8592; Back
          </button>
        )}
        {!isLast && (
          <button className="wict-btn primary" onClick={handleNext}>
            Next &#8594;
          </button>
        )}
      </div>
    </div>
  )
}
