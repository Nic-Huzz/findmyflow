/**
 * LaunchExplainer.jsx
 *
 * Stage explainer for the Launch stage (Stage 7).
 * 5 slides explaining what launch involves and what quests to expect.
 * Written in Zarlo's voice.
 *
 * Created: Feb 2026
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import './FlowFinderExplainer.css'

export default function LaunchExplainer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/7-day-challenge'
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)

  useEffect(() => {
    if (searchParams.get('results') === 'true') {
      setViewingResults(true)
      setCurrentSlide(4)
    }
  }, [searchParams])

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await syncFlowFinderWithChallenge(user.id, 'launch_explainer')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'launch_explainer',
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      if (error) {
        console.error('Error saving flow session:', error)
      }

      navigate(returnTo)
    } catch (err) {
      console.error('Error completing explainer:', err)
      navigate(returnTo)
    }
  }

  const slides = [
    {
      title: "Welcome to Launch",
      icon: "\u{1F680}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            This is it. Everything you've built has been leading to this moment.
          </p>
          <p>
            You've discovered your skills, validated the problem, built the product, designed the offer, and created your campaign.
          </p>
          <p className="highlight-box">
            <strong>Now it's time to press go.</strong>
          </p>
        </div>
      )
    },
    {
      title: "Why Launching Beats Planning",
      icon: "\u{1F4A1}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Here's a truth most people never learn: a launched imperfect business beats an unlaunched perfect one. Every time.
          </p>
          <p>
            The moment you launch, you start getting real data. Real customers. Real feedback. Real revenue.
          </p>
          <p>
            Everything before this was preparation. Everything after this is growth.
          </p>
          <p className="highlight-box">
            <strong>Launching is the only thing that turns your idea into a business.</strong>
          </p>
        </div>
      )
    },
    {
      title: "What You'll Do",
      icon: "\u{1F5FA}\u{FE0F}",
      content: (
        <div className="slide-content">
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">{"\u{1F9F2}"}</div>
              <div className="step-info">
                <h4>Launch Your Attraction Offer</h4>
                <p>Put your offer live and start bringing in your first customers.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F4CB}"}</div>
              <div className="step-info">
                <h4>Daily Implementation</h4>
                <p>Execute your Core Four activities every single day: outreach, content, ads, or cold messages.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{270D}\u{FE0F}"}</div>
              <div className="step-info">
                <h4>Sales Page Copy</h4>
                <p>Write the words that convert visitors into buyers.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F4DD}"}</div>
              <div className="step-info">
                <h4>Post-Launch Review</h4>
                <p>Capture your wins, your learnings, and what you'd do differently next time.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Commit Publicly",
      icon: "\u{1F525}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            This is the groan that separates dreamers from doers: pick a date. Announce it. No backing out, no moving the goalposts.
          </p>
          <p>
            Your protective voice will whisper: "Just one more week." "It's not quite ready." "What if it flops?"
          </p>
          <p>
            But the commitment is the catalyst. Once you say it out loud, everything changes.
          </p>
          <p className="highlight-box">
            <strong>A bold public commitment turns "someday" into "today".</strong>
          </p>
        </div>
      )
    },
    {
      title: "Your Moment",
      icon: "\u{1F3C6}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've done the work that most people only talk about. You've faced fears that most people avoid. You've built something real.
          </p>
          <p>
            Now launch it. One customer at a time. One day at a time.
          </p>
          <p className="highlight-box">
            <strong>This is your moment. Let's make it count.</strong>
          </p>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    } else {
      navigate(returnTo)
    }
  }

  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="flow-finder-explainer">
      <div className="explainer-container">
        {/* Progress dots */}
        <div className="explainer-progress">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="explainer-slide">
          {slides[currentSlide].icon && (
            <div className="slide-icon">{slides[currentSlide].icon}</div>
          )}
          <h1 className="slide-title">{slides[currentSlide].title}</h1>
          {slides[currentSlide].content}
        </div>

        {/* Navigation */}
        <div className="explainer-nav">
          {isLastSlide && viewingResults ? (
            <>
              <button
                className="nav-btn primary"
                onClick={() => navigate(-1)}
              >
                &larr; Back
              </button>
              <button
                className="nav-btn secondary"
                onClick={() => {
                  setViewingResults(false)
                  setCurrentSlide(0)
                  navigate('/launch-explainer', { replace: true })
                }}
              >
                Review Again
              </button>
            </>
          ) : isLastSlide ? (
            <>
              <button
                className="nav-btn primary"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : "Let's Launch \u2192"}
              </button>
              <button
                className="nav-btn secondary"
                onClick={handlePrev}
              >
                &larr; Back
              </button>
            </>
          ) : (
            <>
              <button
                className="nav-btn primary"
                onClick={handleNext}
              >
                Next &rarr;
              </button>
              <button
                className="nav-btn secondary"
                onClick={handlePrev}
              >
                &larr; Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
