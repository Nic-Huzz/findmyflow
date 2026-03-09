import { useState } from 'react'
import './PortalExplainer.css'

function PortalExplainer({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Welcome to Your Flow Portal! 🌊",
      content: (
        <>
          <p>Each week, you'll complete quests across four tabs to help you find your flow and amplify your impact.</p>
          <p>Let's take a quick tour to show you how everything works!</p>
        </>
      )
    },
    {
      title: "Your Four Tabs 📑",
      content: (
        <>
          <p>Your quests are organized into four tabs:</p>
          <div className="category-grid">
            <div className="explainer-category">
              <div className="category-icon">🎯</div>
              <h3>Priority</h3>
              <p>Your weekly focus. Set your play-list challenges, daily healing, and weekly healing each week.</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🎮</div>
              <h3>Play-list</h3>
              <p>Discover your skills, take on courage challenges via the Groan Matrix, and log your voice.</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">💜</div>
              <h3>Healing</h3>
              <p>Daily, weekly, and deep dive quests to process resistance and reconnect with your essence.</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">⭐</div>
              <h3>Bonus</h3>
              <p>Extra tasks and content submissions for bonus points.</p>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Priority Tab 🎯",
      content: (
        <>
          <p>Start each week here. The Priority tab guides you through choosing:</p>
          <div className="category-grid">
            <div className="explainer-category">
              <div className="category-icon">🎮</div>
              <h3>Play-list Challenges</h3>
              <p>Pick a skill, visibility layer, and day for your courage challenge</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">☀️</div>
              <h3>Daily Healing</h3>
              <p>Choose a daily healing quest to practise each day</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">📅</div>
              <h3>Weekly Healing</h3>
              <p>Pick a deeper weekly healing quest to complete this week</p>
            </div>
          </div>
          <p className="quest-tip">💡 <strong>Tip:</strong> Complete Priority onboarding to unlock the other tabs!</p>
        </>
      )
    },
    {
      title: "Healing Tab 💜",
      content: (
        <>
          <p>The Healing tab uses the R's framework to help you work through resistance:</p>
          <div className="category-grid">
            <div className="explainer-category">
              <div className="category-icon">🔍</div>
              <h3>Recognise</h3>
              <p>Build awareness of patterns, triggers, and your essence voice</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🕊️</div>
              <h3>Release</h3>
              <p>Let go of stored emotions and traumas</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">⚡</div>
              <h3>Rewire</h3>
              <p>Act despite fear and rewire old patterns</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🌊</div>
              <h3>Reconnect</h3>
              <p>Morning routines to connect with your essence</p>
            </div>
          </div>
          <p className="quest-tip">💡 <strong>Tip:</strong> Filter by Daily, Weekly, or Deep Dive to focus on what's relevant!</p>
        </>
      )
    },
    {
      title: "Points & Progress 🏆",
      content: (
        <>
          <p>Earn points by completing quests across all tabs!</p>
          <div className="points-info">
            <div className="points-item">
              <span className="points-emoji">🎯</span>
              <div>
                <strong>Complete Quests</strong>
                <p>Earn points for every quest you finish</p>
              </div>
            </div>
            <div className="points-item">
              <span className="points-emoji">✨</span>
              <div>
                <strong>Unlock Artifacts</strong>
                <p>Reach point thresholds in each category</p>
              </div>
            </div>
            <div className="points-item">
              <span className="points-emoji">🔥</span>
              <div>
                <strong>Build Streaks</strong>
                <p>Keep your daily streak alive for consistency</p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Your Space, Your Rules 🔒",
      content: (
        <>
          <p>This portal is deeply personal. Here's how we protect it:</p>
          <ul className="privacy-list">
            <li>✅ Your reflections, voice logs, and healing responses are yours alone. No one else can see them.</li>
            <li>✅ Leaderboards only show your name and points, never your answers.</li>
            <li>✅ We never sell or share your data with third parties.</li>
            <li>✅ You can request full deletion of your data at any time.</li>
          </ul>
          <p className="quest-tip">💡 <strong>Why this matters:</strong> The quests here ask you to be vulnerable. We take that seriously.</p>
        </>
      )
    },
    {
      title: "Ready to Begin? 🚀",
      content: (
        <>
          <p>You now have everything you need to start your journey!</p>
          <div className="ready-checklist">
            <div className="checklist-item">✓ Start with the Priority tab each week</div>
            <div className="checklist-item">✓ Take on courage challenges in Play-list</div>
            <div className="checklist-item">✓ Heal and reconnect through the R's framework</div>
            <div className="checklist-item">✓ Earn bonus points with extra quests and content</div>
          </div>
          <p><strong>Let's find your flow! 🌊</strong></p>
        </>
      )
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleDotClick = (index) => {
    setCurrentSlide(index)
  }

  return (
    <div className="portal-explainer-overlay">
      <div className="portal-explainer-modal">
        <button className="explainer-close" onClick={onClose}>×</button>

        <div className="explainer-content">
          <h2 className="explainer-title">{slides[currentSlide].title}</h2>
          <div className="explainer-body">
            {slides[currentSlide].content}
          </div>
        </div>

        <div className="explainer-navigation">
          <div className="explainer-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`explainer-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="explainer-buttons">
            <button
              className="explainer-btn secondary"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
            >
              ← Previous
            </button>
            <button
              className="explainer-btn primary"
              onClick={handleNext}
            >
              {currentSlide === slides.length - 1 ? "Let's Go! 🚀" : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortalExplainer
