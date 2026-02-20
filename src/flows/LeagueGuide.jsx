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
  business_efficiency: 'Project stage quests. Quality over quantity.',
  play_list: 'Courage challenges. Face your fears.',
  healing: 'Self-care, daily & weekly rituals.',
  voice: 'Deep dive exploration.',
  bonus: 'Tracker quests + social content.',
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
            Fantasy League is a team competition that makes building your business fun.
          </p>
          <p>
            You and 2 friends form a <strong>squad</strong>. Each week, your squad goes head-to-head against another squad.
          </p>
          <p className="highlight-box">
            The more you work on yourself and your business, <strong>the more your team wins</strong>.
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
            These quests help you build your business, face your fears, and take care of yourself. Completing them earns points.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">💼</div>
              <div className="step-info">
                <h4>Business Quests</h4>
                <p>Work on your project — validation, offers, funnels, and more.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">💚</div>
              <div className="step-info">
                <h4>Healing Quests</h4>
                <p>Daily check-ins, weekly reflections, and self-care rituals.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🎮</div>
              <div className="step-info">
                <h4>Courage Challenges</h4>
                <p>Face your fears with visibility challenges from your Play-List.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The 5 Categories",
      icon: "📊",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Your points are split across 5 scoring categories.
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
            Your team's <strong>combined scores</strong> compete in each category.
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
            Each week, your squad faces another squad.
          </p>
          <p>
            Your team's combined points are compared in each of the 5 categories. Whoever scores higher in a category wins it.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>✅</div>
              <div className="step-info">
                <h4 style={{ color: '#10b981' }}>Win 3+ categories = Win (3 pts)</h4>
                <p>Dominate the majority to claim the win.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>🤝</div>
              <div className="step-info">
                <h4 style={{ color: '#E9A23B' }}>Tie 2-2 = Draw (1 pt each)</h4>
                <p>Evenly matched — both squads earn a point.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '18px' }}>❌</div>
              <div className="step-info">
                <h4 style={{ color: '#ef4444' }}>Win 0-1 = Loss (0 pts)</h4>
                <p>Time to rally the squad for next week.</p>
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
            You don't need to be perfect. <strong>Just show up and do the work</strong> — your squad is counting on you.
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
                className="nav-btn primary"
                onClick={() => navigate('/league')}
              >
                Join the League →
              </button>
              <button
                className="nav-btn secondary"
                onClick={() => navigate('/7-day-challenge')}
              >
                Back to Challenge
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn primary" onClick={handleNext}>
                Next →
              </button>
              <button className="nav-btn secondary" onClick={handlePrev}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
