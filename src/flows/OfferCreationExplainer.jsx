/**
 * OfferCreationExplainer.jsx
 *
 * Stage explainer for the Offer Creation stage (Stage 5 / Grand Slam).
 * 5 slides explaining what offer creation involves and what quests to expect.
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

export default function OfferCreationExplainer() {
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
      await syncFlowFinderWithChallenge(user.id, 'offer_creation_explainer')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'offer_creation_explainer',
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
      title: "Welcome to Offer Creation",
      icon: "\u{1F3AF}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've got your product suite — attraction, upsell, downsell, continuity. The building blocks are in place.
          </p>
          <p>
            Now it's time to turn them into an offer so good that people feel stupid saying no.
          </p>
          <p className="highlight-box">
            <strong>Welcome to the Grand Slam.</strong>
          </p>
        </div>
      )
    },
    {
      title: "What Makes an Offer Irresistible",
      icon: "\u{1F4A1}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            A great product isn't enough. The way you package and present it is what makes people buy.
          </p>
          <p>
            The Grand Slam formula adds four layers on top of your core product: bonuses that increase the value, a guarantee that removes the risk, scarcity that creates urgency, and a name that sticks.
          </p>
          <p className="highlight-box">
            <strong>When all four come together, your offer stops competing on price — and starts competing on value.</strong>
          </p>
        </div>
      )
    },
    {
      title: "What You'll Build",
      icon: "\u{1F5FA}\u{FE0F}",
      content: (
        <div className="slide-content">
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">{"\u{1F4CA}"}</div>
              <div className="step-info">
                <h4>Grand Slam Evaluation</h4>
                <p>Score your offer using the Value Equation to see how likely it is to succeed before you launch.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F4E6}"}</div>
              <div className="step-info">
                <h4>Offer Stack Builder</h4>
                <p>Package your product with bonuses, guarantee, scarcity, and a compelling name.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F9F2}"}</div>
              <div className="step-info">
                <h4>Lead Magnet Selector</h4>
                <p>Design your lead magnet in detail — format, delivery, and content outline.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Give More Than Feels Comfortable",
      icon: "\u{1F525}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Here's where your protective voice kicks in: "I'm giving away too much." "They'll take advantage of me."
          </p>
          <p>
            But the truth is the opposite. The more value you stack, the easier it is for people to say yes.
          </p>
          <p>
            Abundance attracts abundance. Scarcity thinking repels customers.
          </p>
          <p className="highlight-box">
            <strong>Your offer should feel almost too generous. That's how you know it's right.</strong>
          </p>
        </div>
      )
    },
    {
      title: "Make Them an Offer",
      icon: "\u{1F680}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've validated the problem, built the product, tested it with real people, and designed your money model.
          </p>
          <p>
            This is where it all comes together into one irresistible package.
          </p>
          <p className="highlight-box">
            <strong>One Grand Slam offer. That's all it takes to change everything. Let's build yours.</strong>
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
                  navigate('/offer-creation-explainer', { replace: true })
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
                {isCompleting ? 'Completing...' : "Let's Create \u2192"}
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
