/**
 * ProductExplainer.jsx
 *
 * Stage explainer for the Product Creation stage (Stage 2).
 * 5 slides explaining what product creation involves and what quests to expect.
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

export default function ProductExplainer() {
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
      await syncFlowFinderWithChallenge(user.id, 'product_explainer')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'product_explainer',
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
      title: "Welcome to Product Creation",
      icon: "\u{1F6E0}\u{FE0F}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've validated that real people have the problem you want to solve.
          </p>
          <p>
            Now it's time to build something they'll actually pay for.
          </p>
          <p className="highlight-box">
            This stage turns your validated idea into a <strong>real product, a lead magnet, and an irresistible offer</strong>.
          </p>
        </div>
      )
    },
    {
      title: "The Value Equation",
      icon: "\u{1F4A1}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Not all products are created equal. The secret to charging what you're worth?
          </p>
          <p>
            <strong>Value = (Dream Outcome x Likelihood of Success) / (Time x Effort)</strong>
          </p>
          <p>
            Increase the dream outcome and their belief it'll work. Decrease the time and effort it takes them to get there.
          </p>
          <p className="highlight-box">
            Do this right and your product <strong>sells itself</strong>.
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
              <div className="step-icon">{"\u{1F3AF}"}</div>
              <div className="step-info">
                <h4>Product Builder</h4>
                <p>Define your niche, identify why customers are stuck, and brainstorm solutions using the $100M Offers framework.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F48E}"}</div>
              <div className="step-info">
                <h4>Product Designer</h4>
                <p>Apply the Value Equation to maximise what your product is worth to your customers.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Done Beats Perfect",
      icon: "\u{1F525}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Here's what's going to happen: you'll want to keep tweaking forever.
          </p>
          <p>
            "It's not ready yet." "I just need to fix one more thing." Sound familiar?
          </p>
          <p>
            Perfectionism is procrastination in disguise. Your product doesn't need to be perfect — it needs to be <em>out there</em>.
          </p>
          <p className="highlight-box">
            The feedback you get from shipping is <strong>infinitely more valuable</strong> than another round of polishing.
          </p>
        </div>
      )
    },
    {
      title: "Let's Build",
      icon: "\u{1F680}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You already know who you help and what problem you solve. That's the hard part done.
          </p>
          <p>
            Now you're packaging that knowledge into something people can buy, use, and rave about.
          </p>
          <p className="highlight-box">
            One product. One offer. One step at a time. <strong>Let's build something you're proud of.</strong>
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
                  navigate('/product-explainer', { replace: true })
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
                {isCompleting ? 'Completing...' : "Let's Build \u2192"}
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
