/**
 * CampaignExplainer.jsx
 *
 * Stage explainer for the Campaign Creation stage (Stage 6).
 * 5 slides explaining what campaign creation involves and what quests to expect.
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

export default function CampaignExplainer() {
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
      await syncFlowFinderWithChallenge(user.id, 'campaign_explainer')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'campaign_explainer',
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
      title: "Welcome to Campaign Creation",
      icon: "\u{1F4E2}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've got your offer. You know it works. Now the question is: how do people find out about it?
          </p>
          <p>
            This stage is about getting your offer in front of the right people, in the right way.
          </p>
          <p className="highlight-box">
            <strong>It's time to stop building in the shadows and start letting the world know you exist.</strong>
          </p>
        </div>
      )
    },
    {
      title: "The Core Four",
      icon: "\u{1F4A1}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            There are only four ways to get customers. That's it. Every business in the world uses some combination of these:
          </p>
          <p>
            <strong>Warm Outreach</strong> — reach out to people you already know. <strong>Cold Outreach</strong> — reach out to people you don't. <strong>Post Free Content</strong> — attract people to you. <strong>Run Paid Ads</strong> — pay to reach them faster.
          </p>
          <p>
            You don't need all four. You just need to pick the right one for where you are right now.
          </p>
          <p className="highlight-box">
            <strong>We'll help you choose.</strong>
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
                <h4>Core Four Strategy</h4>
                <p>Discover which lead generation method fits your skills, resources, and audience.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F527}"}</div>
              <div className="step-info">
                <h4>Funnel Builder</h4>
                <p>Design a complete funnel from lead magnet to customer, with delivery, nurture, and conversion.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{2705}"}</div>
              <div className="step-info">
                <h4>Launch Readiness Check</h4>
                <p>Score your readiness across sales page, pricing, social proof, and audience.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">{"\u{1F4C5}"}</div>
              <div className="step-info">
                <h4>Launch Sequence</h4>
                <p>Plan your 7-day launch: what happens from Day -3 to Day +3.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Let Them See You",
      icon: "\u{1F525}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            This is the stage where you have to be visible. A post, a video, a message, an email. Something real, from you, to the world.
          </p>
          <p>
            Your protective voice will scream: "What if they judge me?" "What if nobody cares?"
          </p>
          <p>
            But the people who resonate with the real you are exactly the ones you want to attract.
          </p>
          <p className="highlight-box">
            <strong>The polished version of you isn't what sells. The real version is.</strong>
          </p>
        </div>
      )
    },
    {
      title: "Go Live",
      icon: "\u{1F680}",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You've built the product. You've packaged the offer. You've designed the money model.
          </p>
          <p>
            Now it's time to tell people about it. One piece of content. One outreach message. One lead at a time.
          </p>
          <p className="highlight-box">
            <strong>Your audience is out there waiting. Let's go find them.</strong>
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
                  navigate('/campaign-explainer', { replace: true })
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
                {isCompleting ? 'Completing...' : "Let's Go \u2192"}
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
