/**
 * MoneyModelGuide.jsx
 *
 * Slide-based explainer for the Money Model stage.
 * 6 slides explaining the 4 offer types, real examples, and key principles.
 * Follows the same pattern as ValidationExplainer, FlowFinderExplainer, etc.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { supabase } from './lib/supabaseClient'
import { syncFlowFinderWithChallenge } from './lib/questCompletionHelpers'
import './flows/FlowFinderExplainer.css'
import './MoneyModelGuide.css'

function MoneyModelGuide() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)
  const [openExample, setOpenExample] = useState(null)

  const examples = [
    {
      name: 'Fitness Studio',
      flow: [
        { type: 'Attraction', detail: 'Win Your Money Back' },
        { type: 'Upsell', detail: 'Buy X Get Y' },
        { type: 'Upsell', detail: 'Prepay Time' },
        { type: 'Continuity', detail: 'Continuity Bonus / Rollover Upsell' },
        { type: 'Downsell', detail: 'Free Trial w/ Penalty' },
        { type: 'Upsell', detail: 'Menu Upsell' }
      ]
    },
    {
      name: 'Gym Launch',
      flow: [
        { type: 'Attraction', detail: 'Decoy Offer' },
        { type: 'Upsell', detail: 'Classic Upsell' },
        { type: 'Upsell', detail: 'Menu Upsell into Continuity' },
        { type: 'Downsell', detail: 'Payment Plan' },
        { type: 'Downsell', detail: 'Feature Downsell' },
        { type: 'Downsell', detail: 'Free Trial' }
      ]
    },
    {
      name: 'Newsletter & Consulting',
      flow: [
        { type: 'Attraction', detail: 'Free Trial' },
        { type: 'Upsell', detail: 'Pay Less Now Pay More Later (Past Newsletters)' },
        { type: 'Continuity', detail: 'Continuity Discount (Lifetime Lower Rate)' },
        { type: 'Upsell', detail: 'Classic Upsell (Consulting)' }
      ]
    }
  ]

  const slides = [
    {
      title: "What is a Money Model?",
      icon: "💰",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            A Money Model is a series of offers designed to increase how many customers you get, how much they pay, and how fast they pay it.
          </p>
          <div className="insight-card">
            <div className="insight-number">✓</div>
            <div className="insight-body">
              <h3>Good Money Model</h3>
              <p>Makes more profit from a customer than it costs to get and service them in the first thirty days.</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-number">🏆</div>
            <div className="insight-body">
              <h3>$100M Money Model</h3>
              <p>Makes more profit from <span className="highlight">one customer</span> than it costs to get and service <span className="highlight">many customers</span> — removing cash as a limiter to scaling.</p>
            </div>
          </div>
          <p className="highlight-box">
            The goal: get your cash back in 30 days, get more customers, make more money, win.
          </p>
        </div>
      )
    },
    {
      title: "The 4 Offer Types",
      icon: "🧩",
      content: (
        <div className="slide-content">
          <p>Your money model is built from 4 types of offers:</p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">🧲</div>
              <div className="step-info">
                <h4>1. Attraction Offers</h4>
                <p>Get customers in the door with something free or discounted. E.g. Win Your Money Back, Giveaways, Decoy Offers.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">⬆️</div>
              <div className="step-info">
                <h4>2. Upsell Offers</h4>
                <p>Offer more, better, or newer versions of what they just bought. E.g. Classic Upsell, Menu Upsells, Pick Your Price.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">⬇️</div>
              <div className="step-info">
                <h4>3. Downsell Offers</h4>
                <p>Turn "No" into "Yes" with alternative payment or features. E.g. Payment Plans, Trial With Penalty, Feature Downsells.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🔄</div>
              <div className="step-info">
                <h4>4. Continuity Offers</h4>
                <p>Provide ongoing value with recurring payments. E.g. Downsell the Upsell, Big Head Long Tail, Commitment Discounts.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Real Examples",
      icon: "📋",
      content: (
        <div className="slide-content">
          <p>See how real businesses stack these offer types together:</p>
          <div className="mm-examples">
            {examples.map((example, idx) => (
              <div key={idx} className={`mm-example-card ${openExample === idx ? 'open' : ''}`}>
                <button
                  className="mm-example-toggle"
                  onClick={() => setOpenExample(openExample === idx ? null : idx)}
                >
                  <span className="mm-example-name">{example.name}</span>
                  <span className="mm-example-chevron">{openExample === idx ? '▲' : '▼'}</span>
                </button>
                {openExample === idx && (
                  <div className="mm-flow-steps">
                    {example.flow.map((step, stepIdx) => (
                      <div key={stepIdx} className="mm-flow-item">
                        <span className={`mm-flow-badge mm-${step.type.toLowerCase()}`}>
                          {step.type}
                        </span>
                        <span className="mm-flow-detail">{step.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Key Principles",
      icon: "💡",
      content: (
        <div className="slide-content">
          <div className="ready-checklist">
            <div className="check-item">✓ Perfect one offer at a time</div>
            <div className="check-item">✓ Raise prices in stages</div>
            <div className="check-item">✓ Simple scales, fancy fails</div>
            <div className="check-item">✓ Affiliate products can fill gaps</div>
            <div className="check-item">✓ Turn attraction offers into continuity with auto-renewal</div>
            <div className="check-item">✓ Mix and match — e.g., use an attraction offer as an upsell</div>
          </div>
          <p className="highlight-box">
            The possibilities are <strong>endless</strong>!<br />
            KEY: Upfront Cash + Continuity + Upsell + Downsell
          </p>
          <p style={{ fontStyle: 'italic', fontSize: '13px', opacity: 0.7, marginTop: '16px' }}>
            Once I get customers reliably, <strong>then</strong> they pay for themselves, <strong>then</strong> they pay for other customers, <strong>then</strong> I maximize each customer's long term value.
          </p>
        </div>
      )
    },
    {
      title: "Words from $100M Leads",
      icon: "📖",
      content: (
        <div className="slide-content">
          <p className="highlight-box">
            "The knowledge in these bullets brought me more free and profitable customers than I've known what to do with. If executed, they will do the same for you."
          </p>
          <p style={{ fontSize: '13px', fontStyle: 'italic', opacity: 0.7, textAlign: 'center' }}>
            — Alex Hormozi, $100M Leads
          </p>
          <p className="slide-intro" style={{ marginTop: '20px' }}>
            Set audacious goals. Keep improving. Learn from failure. Repeat.
          </p>
        </div>
      )
    },
    {
      title: "Build Your Money Model",
      icon: "🚀",
      content: (
        <div className="slide-content">
          <p>
            If just starting out, pick <span className="highlight">ONE</span> offer type to inspire you.
          </p>
          <p>
            If more advanced, consider weaving two together. There are no rules for how you can stack these.
          </p>
          <p style={{ marginBottom: '20px' }}>Take each assessment to discover which offers work best for your business:</p>
          <div className="mm-cta-grid">
            <a href="/attraction-offer" className="mm-cta-link mm-attraction">🧲 Attraction Offers</a>
            <a href="/upsell-offer" className="mm-cta-link mm-upsell">⬆️ Upsell Offers</a>
            <a href="/downsell-offer" className="mm-cta-link mm-downsell">⬇️ Downsell Offers</a>
            <a href="/continuity-offer" className="mm-cta-link mm-continuity">🔄 Continuity Offers</a>
          </div>
        </div>
      )
    }
  ]

  useEffect(() => {
    if (searchParams.get('results') === 'true') {
      setViewingResults(true)
      setCurrentSlide(slides.length - 1)
    }
  }, [searchParams])

  const handleComplete = async () => {
    if (!user) {
      navigate('/7-day-challenge')
      return
    }

    setIsCompleting(true)
    try {
      await syncFlowFinderWithChallenge(user.id, 'milestone_read_money_model')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'money_model_guide',
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      if (error) {
        console.error('Error saving flow session:', error)
      }

      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error completing guide:', err)
      navigate('/7-day-challenge')
    }
  }

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
          <div className="slide-icon">{slides[currentSlide].icon}</div>
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
                {isCompleting ? 'Completing...' : 'Complete & Return →'}
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

export default MoneyModelGuide
