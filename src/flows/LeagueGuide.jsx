/**
 * LeagueGuide.jsx — /league/guide
 *
 * 5-slide explainer for Ghost Self League.
 * Follows the stage explainer pattern (ValidationExplainer, etc.)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hapticLight } from '../lib/haptics'
import './FlowFinderExplainer.css'

export default function LeagueGuide() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Welcome to Ghost Mode",
      icon: "👻",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Every week, you race your Ghost — last week's version of you.
          </p>
          <p>
            We don't do leaderboards here. Everyone's walking their own path at their own pace. The only person worth growing past is who you were yesterday.
          </p>
          <p className="highlight-box">
            Your Ghost is <strong>last week's you</strong>. Beat it to compound your growth and watch your world transform one week at a time.
          </p>
        </div>
      )
    },
    {
      title: "How You Score",
      icon: "⚡",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Complete quests in the 7-Day Challenge to earn points across 3 categories.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">☀️</div>
              <div className="step-info">
                <h4>Tune</h4>
                <p>Daily practices that keep you balanced and regulated.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🔥</div>
              <div className="step-info">
                <h4>Courage</h4>
                <p>Challenges, healing work, and weekly commitments that stretch you.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">📣</div>
              <div className="step-info">
                <h4>Community</h4>
                <p>Sharing your journey and connecting with others.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Your Ghost",
      icon: "📊",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Your Ghost replays what you scored last week, day by day.
          </p>
          <p>
            On Monday, the Ghost's score is what you had by Monday last week. On Tuesday, what you had by Tuesday. Each day reveals a new target to beat.
          </p>
          <p className="highlight-box">
            First week? Your Ghost starts at <strong>zero</strong>. Easy first win to get you going.
          </p>
        </div>
      )
    },
    {
      title: "How to Win",
      icon: "🏆",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Beat your Ghost in 2 of 3 categories to win the week.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>✅</div>
              <div className="step-info">
                <h4 style={{ color: '#10b981' }}>Win 2+ categories = You win</h4>
                <p>Your streak continues. Next week's Ghost gets harder.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>🤝</div>
              <div className="step-info">
                <h4 style={{ color: '#E9A23B' }}>1-1 with a tie = Draw</h4>
                <p>Close match. Ghost stays the same difficulty.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>👻</div>
              <div className="step-info">
                <h4 style={{ color: '#ef4444' }}>Ghost wins 2+ = Ghost wins</h4>
                <p>Next week's Ghost gets 25% easier. It adapts to you.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're Already Playing",
      icon: "🚀",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Your Ghost is live right now. Here's how to win:
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">1️⃣</div>
              <div className="step-info">
                <h4>Do your daily practices</h4>
                <p>Tune points add up fast. Consistency beats intensity.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">2️⃣</div>
              <div className="step-info">
                <h4>Take on courage challenges</h4>
                <p>Each one earns Courage points and builds your streak.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">3️⃣</div>
              <div className="step-info">
                <h4>Check your progress</h4>
                <p>The header shows your live score vs Ghost. Stay ahead.</p>
              </div>
            </div>
          </div>
          <p className="highlight-box">
            You don't need to be perfect. <strong>Just do more than last week</strong>.
          </p>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      hapticLight()
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      hapticLight()
      setCurrentSlide(currentSlide - 1)
    } else {
      navigate('/league')
    }
  }

  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="flow-finder-explainer">
      <div className="explainer-container">
        <div className="explainer-progress">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => { hapticLight(); setCurrentSlide(index) }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="explainer-slide">
          {slides[currentSlide].icon && (
            <div className="slide-icon">{slides[currentSlide].icon}</div>
          )}
          <h1 className="slide-title">{slides[currentSlide].title}</h1>
          {slides[currentSlide].content}
        </div>

        <div className="explainer-nav">
          {isLastSlide ? (
            <button
              className="nav-btn primary"
              onClick={() => navigate('/7-day-challenge')}
              style={{ width: '100%' }}
            >
              Back to Challenge
            </button>
          ) : (
            <>
              <button className="nav-btn secondary" onClick={handlePrev}>
                ← Back
              </button>
              <button className="nav-btn primary" onClick={handleNext}>
                Next →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
