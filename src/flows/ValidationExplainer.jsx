/**
 * ValidationExplainer.jsx
 *
 * Stage explainer for the Validation stage (Stage 1).
 * 5 slides explaining why validation matters and what quests to expect.
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

export default function ValidationExplainer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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
      await syncFlowFinderWithChallenge(user.id, 'validation_explainer')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'validation_explainer',
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      if (error) {
        console.error('Error saving flow session:', error)
      }

      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error completing explainer:', err)
      navigate('/7-day-challenge')
    }
  }

  const slides = [
    {
      title: "Welcome to Validation",
      icon: "🔍",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've discovered your skills, your problems, and the people you're here to help.
          </p>
          <p>
            Now it's time to learn how we can create a product people are excited to pay for.
          </p>
          <p className="highlight-box">
            Validation is the secret to launching something that is successful from day one.
          </p>
        </div>
      )
    },
    {
      title: "Why This Matters",
      icon: "💡",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            One of the biggest reasons businesses fail? They build something people don't want.
          </p>
          <p>
            To make sure that isn't us, we're going to ask the people who have this problem exactly what they want.
          </p>
          <p className="highlight-box">
            Then we're going to <strong>build it for them and test it</strong>.
          </p>
        </div>
      )
    },
    {
      title: "What You'll Do",
      icon: "🗺️",
      content: (
        <div className="slide-content">
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">📋</div>
              <div className="step-info">
                <h4>Collect Validation</h4>
                <p>Send a validation form and gather honest responses from people with this problem.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🔬</div>
              <div className="step-info">
                <h4>Self-Trial</h4>
                <p>Test your skill on yourself first. You're your own best guinea pig.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🤝</div>
              <div className="step-info">
                <h4>Peer-Trial</h4>
                <p>Help a real person with a real problem. Watch what happens.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🔎</div>
              <div className="step-info">
                <h4>Analyse</h4>
                <p>Let AI help you spot the patterns in what people are telling you.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Fear is the Feature",
      icon: "🔥",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Here's the truth: asking people what they think feels scary.
          </p>
          <p>
            What if they say no? What if your idea isn't as good as you thought?
          </p>
          <p>
            That fear is exactly why this stage matters.
          </p>
          <p className="highlight-box">
            The goal isn't perfection — it's ensuring we don't waste our time and <strong>make something people are willing to pay for</strong>.
          </p>
        </div>
      )
    },
    {
      title: "You're Ready",
      icon: "🚀",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You don't need to have it all figured out. You just need to start asking.
          </p>
          <p>
            One conversation at a time. One test at a time. One improvement at a time.
          </p>
          <p className="highlight-box">
            That's all it takes to move from <strong>"I think this could work"</strong> to <strong>"I know it does."</strong>
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
      navigate('/7-day-challenge')
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
                ← Back
              </button>
              <button
                className="nav-btn secondary"
                onClick={() => {
                  setViewingResults(false)
                  setCurrentSlide(0)
                  navigate('/validation-explainer', { replace: true })
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
                {isCompleting ? 'Completing...' : "Let's Validate →"}
              </button>
              <button
                className="nav-btn secondary"
                onClick={handlePrev}
              >
                ← Back
              </button>
            </>
          ) : (
            <>
              <button
                className="nav-btn primary"
                onClick={handleNext}
              >
                Next →
              </button>
              <button
                className="nav-btn secondary"
                onClick={handlePrev}
              >
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
