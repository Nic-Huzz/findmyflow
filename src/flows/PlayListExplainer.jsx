/**
 * PlayListExplainer.jsx
 *
 * Educational quest explaining the Play-List Matrix:
 * - What a play-list is (Naval quote)
 * - Comfort zone → Groan zone spectrum
 * - 5 visibility layers (Screen → Authority)
 * - How the matrix works (skills × layers)
 * - Essence zone scoring (scary + wahoo)
 * - The journey workflow
 *
 * Created: Feb 2026
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { GROAN_VISIBILITY_LAYERS } from '../lib/stageConfig'
import '../styles/flow-base.css'
import './FlowFinderExplainer.css'

export default function PlayListExplainer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await syncFlowFinderWithChallenge(user.id, 'play_list_explainer')

      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'play_list_explainer',
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
    // Slide 1: What is a Play-List?
    {
      title: "What is a Play-List?",
      icon: "🎮",
      content: (
        <div className="slide-content">
          <p className="highlight-box" style={{ fontStyle: 'italic' }}>
            "Do what feels like play to you but looks like work to others."
            <br />
            <span style={{ fontSize: '13px', opacity: 0.6 }}>— Naval Ravikant</span>
          </p>
          <p className="slide-intro">
            Your play-list is your collection of skills that feel like <span className="highlight">play</span>.
          </p>
          <p>
            Things you'd do for free. Things that energise you. Things you lose track of time doing.
          </p>
          <p>
            The Play-List Matrix helps you turn those skills into <span className="highlight">courage challenges</span> that grow your visibility.
          </p>
        </div>
      )
    },
    // Slide 2: The Courage Spectrum
    {
      title: "The Courage Spectrum",
      icon: "🌈",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Your skills exist on a spectrum:
          </p>
          <div className="pillars-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="pillar-card" style={{ border: '1px solid rgba(107, 203, 119, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="pillar-icon">😌</div>
              <h3 style={{ color: '#6BCB77' }}>Comfort Zone</h3>
              <p>Safe, familiar, no growth</p>
            </div>
            <div className="pillar-card" style={{ border: '1px solid rgba(233, 162, 59, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="pillar-icon">😬</div>
              <h3>Groan Zone</h3>
              <p>Scary + exciting — you groan because you know you should</p>
            </div>
          </div>
          <p>
            The <span className="highlight">groan</span> is the feeling when your essence knows you're capable of something, but your body still resists.
          </p>
          <p>
            The magic happens when you take your play-list skills <strong>into the groan zone</strong>.
          </p>
        </div>
      )
    },
    // Slide 3: The 5 Visibility Layers
    {
      title: "The 5 Visibility Layers",
      icon: "📱",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Each layer represents a deeper level of visibility and courage:
          </p>
          <div className="validation-steps">
            {GROAN_VISIBILITY_LAYERS.map(layer => (
              <div className="validation-step" key={layer.id}>
                <span className="step-icon">{layer.icon}</span>
                <div className="step-info">
                  <h4 style={{ color: layer.color }}>{layer.label}</h4>
                  <p>{layer.fear}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    // Slide 4: How the Framework Works
    {
      title: "How the Framework Works",
      icon: "⚡",
      content: (
        <div className="slide-content">
          <div className="pillar-formula" style={{ flexWrap: 'nowrap', fontSize: '14px' }}>
            <span className="formula-result">The Framework</span>
            <span className="formula-operator">=</span>
            <span className="formula-item">Your Skills</span>
            <span className="formula-operator">×</span>
            <span className="formula-item">Visibility Layers</span>
          </div>
          <p style={{ marginTop: '20px' }}>
            Each cell combines <strong>what you do</strong> with <strong>how visible you are</strong> doing it.
          </p>
          <div className="highlight-box" style={{ textAlign: 'left' }}>
            <p style={{ margin: '0 0 8px' }}><strong>Example:</strong></p>
            <p style={{ margin: 0 }}>"Systems Design" × "Live" =<br /><span className="highlight">"Host a live workshop on systems thinking"</span></p>
          </div>
          <p>
            Create your own challenges or have them <span className="highlight">AI-generated</span> based on your specific skills from Flow Finder.
          </p>
        </div>
      )
    },
    // Slide 5: Essence Zone Scoring
    {
      title: "Essence Zone Scoring",
      icon: "🎯",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Each challenge has two scores:
          </p>
          <div className="pillars-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="pillar-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="pillar-icon">😰</div>
              <h3 style={{ color: '#ef4444' }}>Scary Score</h3>
              <p>How much fear it triggers</p>
            </div>
            <div className="pillar-card" style={{ border: '1px solid rgba(233, 162, 59, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div className="pillar-icon">🤩</div>
              <h3>Wahoo Score</h3>
              <p>How much excitement it sparks</p>
            </div>
          </div>
          <div className="validation-steps" style={{ marginTop: '16px' }}>
            <div className="validation-step">
              <span className="step-icon">✨</span>
              <div className="step-info">
                <h4>High scary + High wahoo = Essence Zone</h4>
                <p>This is where growth lives</p>
              </div>
            </div>
            <div className="validation-step">
              <span className="step-icon">🛡️</span>
              <div className="step-info">
                <h4>High scary + Low wahoo =<br />Not for you</h4>
                <p>This doesn't light you up or feel like play — not something to pursue</p>
              </div>
            </div>
            <div className="validation-step">
              <span className="step-icon">😴</span>
              <div className="step-info">
                <h4>Low scary = Comfort Zone</h4>
                <p>Safe but no growth happening here</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 6: The Journey
    {
      title: "The Journey",
      icon: "🗺️",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Every challenge follows a simple workflow:
          </p>
          <div className="pillar-formula">
            <span className="formula-item">Generated</span>
            <span className="formula-operator">→</span>
            <span className="formula-item">Accepted</span>
            <span className="formula-operator">→</span>
            <span className="formula-result">Completed</span>
          </div>
          <div className="validation-steps" style={{ marginTop: '20px' }}>
            <div className="validation-step">
              <span className="step-icon">☀️</span>
              <div className="step-info">
                <h4>Generate challenge</h4>
                <p>Create your own or have AI generate one from your Flow Finder skills</p>
              </div>
            </div>
            <div className="validation-step">
              <span className="step-icon">📸</span>
              <div className="step-info">
                <h4>Complete with proof</h4>
                <p>Or skip if it's not the right time</p>
              </div>
            </div>
            <div className="validation-step">
              <span className="step-icon">🔓</span>
              <div className="step-info">
                <h4>Layers unlock with progress</h4>
                <p>New visibility layers open as you advance through stages</p>
              </div>
            </div>
          </div>
          <p className="slide-question">
            The goal isn't to eliminate fear — it's to act alongside it.
          </p>
        </div>
      )
    },
    // Slide 7: Ready to Play?
    {
      title: "Ready to Play?",
      icon: "🚀",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You now understand the Play-List Matrix!
          </p>
          <div className="ready-checklist">
            <div className="check-item">✓ Your play-list = skills that feel like play</div>
            <div className="check-item">✓ 5 visibility layers from Screen to Authority</div>
            <div className="check-item">✓ Groan zone = scary + exciting</div>
            <div className="check-item">✓ AI generates challenges from your skills × layers</div>
          </div>
          <p className="ready-cta">
            Head back and pick your first courage challenge!
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
          {isLastSlide ? (
            <>
              <button
                className="nav-btn primary"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : "Complete & Return →"}
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
