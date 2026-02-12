/**
 * TestingExplainer.jsx
 *
 * Stage explainer for the Testing stage (Stage 3).
 * 5 slides explaining what testing involves and what quests to expect.
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

export default function TestingExplainer() {
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
      await syncFlowFinderWithChallenge(user.id, 'testing_explainer')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'testing_explainer',
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
      title: "Welcome to Testing",
      icon: "\u{1F3AF}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've built your product and packaged your offer. That took courage.
          </p>
          <p>
            Now it's time to put it in front of real people and find out what actually works.
          </p>
          <p className="highlight-box">
            <strong>Testing is how you turn a good idea into something people love.</strong>
          </p>
        </div>
      )
    },
    {
      title: "Why This Matters",
      icon: "\u{1F4A1}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Here's something most people get wrong: they assume they know what their customers want.
          </p>
          <p>
            But the gap between what you <em>think</em> works and what <em>actually</em> works can be huge.
          </p>
          <p>
            Testing closes that gap — fast.
          </p>
          <p className="highlight-box">
            <strong>The businesses that test early, win. The ones that guess, struggle.</strong>
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
              <div className="step-icon">{"\u{1F4CB}"}</div>
              <div className="step-info">
                <h4>MVP Readiness</h4>
                <p>Define your minimum viable product and identify 3-5 testers from your target audience.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F4E8}"}</div>
              <div className="step-info">
                <h4>Collect Feedback</h4>
                <p>Send a feedback form and gather honest responses from real testers.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F50E}"}</div>
              <div className="step-info">
                <h4>Analyse Patterns</h4>
                <p>Let AI spot the themes in what's working and what's not.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F504}"}</div>
              <div className="step-info">
                <h4>Iterate</h4>
                <p>Use what you learn to make your product better before you scale.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Criticism is a Gift",
      icon: "\u{1F525}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            This is the stage where your ego wants to hide.
          </p>
          <p>
            "What if they don't like it?" "What if they find problems?"
          </p>
          <p>
            Good. That's the whole point. Every piece of honest feedback saves you months of building the wrong thing.
          </p>
          <p className="highlight-box">
            <strong>The discomfort of hearing the truth now is nothing compared to the pain of launching something nobody wants.</strong>
          </p>
        </div>
      )
    },
    {
      title: "Let's Test",
      icon: "\u{1F680}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You don't need hundreds of testers. You need three to five honest ones.
          </p>
          <p>
            One form. One conversation. One round of feedback. That's all it takes to level up your product.
          </p>
          <p className="highlight-box">
            <strong>The best version of your product is on the other side of this stage. Let's find it.</strong>
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
                &larr; Back
              </button>
              <button
                className="nav-btn secondary"
                onClick={() => {
                  setViewingResults(false)
                  setCurrentSlide(0)
                  navigate('/testing-explainer', { replace: true })
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
                {isCompleting ? 'Completing...' : "Let's Test \u2192"}
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
