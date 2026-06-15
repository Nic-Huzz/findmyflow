/**
 * LeagueGuide.jsx — /league/guide
 *
 * 5-slide explainer for users brand new to Fantasy League.
 * Follows the stage explainer pattern (ValidationExplainer, etc.)
 * Purely informational — no quest completion sync.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../lib/league/leagueConfig'
import { hapticLight } from '../lib/haptics'
import './FlowFinderExplainer.css'

const CATEGORY_DESCRIPTIONS = {
  play_list: 'Expression. Do the things that scare you and make you feel alive.',
  healing: 'Safety. Recognise, release, and rewire what keeps you stuck.',
  tune: 'Balance. Daily practices that keep your nervous system regulated.',
}

export default function LeagueGuide() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Welcome to Fantasy League",
      icon: "🏆",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Fantasy League is a competition that makes training your nervous system fun.
          </p>
          <p>
            Play solo or form a team. Each week, you go head-to-head in matchups.
          </p>
          <p className="highlight-box">
            The more you show up for yourself, <strong>the more you win</strong>.
          </p>
        </div>
      )
    },
    {
      title: "How You Score Points",
      icon: "⚡",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Every week, you'll get quests in the 7-Day Challenge.
          </p>
          <p>
            These quests train your nervous system to hold more expression while staying safe. Completing them earns points.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">☀️</div>
              <div className="step-info">
                <h4>Tune</h4>
                <p>Daily practices that keep your nervous system regulated and balanced.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🔥</div>
              <div className="step-info">
                <h4>Wahoos</h4>
                <p>Courage challenges that expand your capacity for expression and aliveness.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">💚</div>
              <div className="step-info">
                <h4>Healing</h4>
                <p>Recognise, release, and rewire the patterns that keep you stuck.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The 3 Categories",
      icon: "📊",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Your points are split across 3 scoring categories.
          </p>
          <div className="validation-steps">
            {CATEGORY_KEYS.map(key => {
              const cat = FANTASY_CATEGORIES[key]
              return (
                <div key={key} className="validation-step">
                  <div className="step-icon">{cat.icon}</div>
                  <div className="step-info">
                    <h4 style={{ color: cat.color }}>{cat.label}</h4>
                    <p>{CATEGORY_DESCRIPTIONS[key]}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="highlight-box">
            Your scores compete in each category head-to-head.
          </p>
        </div>
      )
    },
    {
      title: "How Matchups Work",
      icon: "⚔️",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Each week, you face an opponent in a matchup.
          </p>
          <p>
            Your points are compared in each of the 3 categories. Whoever scores higher in a category wins it.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>✅</div>
              <div className="step-info">
                <h4 style={{ color: '#10b981' }}>Win 2+ categories = Win (3 pts)</h4>
                <p>Win the majority to claim the win.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>🤝</div>
              <div className="step-info">
                <h4 style={{ color: '#E9A23B' }}>Tie 1-1 = Draw (1 pt each)</h4>
                <p>Evenly matched — both earn a point.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>❌</div>
              <div className="step-info">
                <h4 style={{ color: '#ef4444' }}>Win 0 = Loss (0 pts)</h4>
                <p>Time to rally for next week.</p>
              </div>
            </div>
          </div>
          <p className="highlight-box">
            Match points decide the <strong>league standings</strong>. Most points at season end wins!
          </p>
        </div>
      )
    },
    {
      title: "Ready to Play",
      icon: "🚀",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            That's all you need to know. Here's the game plan:
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">1️⃣</div>
              <div className="step-info">
                <h4>Join a Squad</h4>
                <p>Create a team or join one with an invite code.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">2️⃣</div>
              <div className="step-info">
                <h4>Do Your Quests</h4>
                <p>Complete quests in the 7-Day Challenge to earn points.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">3️⃣</div>
              <div className="step-info">
                <h4>Check the Scoreboard</h4>
                <p>Watch your team climb the standings each week.</p>
              </div>
            </div>
          </div>
          <p className="highlight-box">
            You don't need to be perfect. <strong>Just show up and do the work</strong> — every quest counts.
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
            <>
              <button
                className="nav-btn secondary"
                onClick={() => navigate('/7-day-challenge')}
              >
                Back to Challenge
              </button>
              <button
                className="nav-btn primary"
                onClick={() => navigate('/league')}
              >
                Join the League →
              </button>
            </>
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
