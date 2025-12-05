import { useState } from 'react'
import './PortalExplainer.css'

function PortalExplainer({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Welcome to Your Flow Portal! 🌊",
      content: (
        <>
          <p>Over the next 7 days, you'll complete quests across four categories to help you find your flow and amplify your impact.</p>
          <p>Let's take a quick tour to show you how everything works!</p>
        </>
      )
    },
    {
      title: "Quest Tabs 📑",
      content: (
        <>
          <p>Your quests are organized into 5 tabs, each serving a different purpose:</p>
          <div className="category-grid">
            <div className="explainer-category">
              <div className="category-icon">🎯</div>
              <h3>Flow Finder</h3>
              <p>Persona-specific quests to find your flow</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">📆</div>
              <h3>Daily</h3>
              <p>Daily quests across the 4 R's framework</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">📋</div>
              <h3>Weekly</h3>
              <p>Weekly quests across the 4 R's framework</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">⭐</div>
              <h3>Bonus</h3>
              <p>Extra quests for bonus points</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🧭</div>
              <h3>Tracker</h3>
              <p>Track your flow with Flow Compass</p>
            </div>
          </div>
        </>
      )
    },
    {
      title: "The 4 R's Framework 🗺️",
      content: (
        <>
          <p>Daily and Weekly quests are organized using the 4 R's framework - four pillars to help you find your flow:</p>
          <div className="category-grid">
            <div className="explainer-category">
              <div className="category-icon">🔍</div>
              <h3>Recognise</h3>
              <p>Build awareness of what's blocking your flow and what your flow is</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🕊️</div>
              <h3>Release</h3>
              <p>Let go of traumas blocking your flow</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">⚡</div>
              <h3>Rewire</h3>
              <p>Act in alignment with your flow</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🌊</div>
              <h3>Reconnect</h3>
              <p>Live from your essence and find your flow</p>
            </div>
          </div>
          <p className="quest-tip">💡 <strong>Tip:</strong> Complete quests from all 4 R's each day to unlock artifacts!</p>
        </>
      )
    },
    {
      title: "Leaderboard & Points 🏆",
      content: (
        <>
          <p>Earn points by completing quests and compete with your group or the weekly cohort!</p>
          <div className="points-info">
            <div className="points-item">
              <span className="points-emoji">🎯</span>
              <div>
                <strong>Complete Quests</strong>
                <p>Earn 3-30 points per quest</p>
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
              <span className="points-emoji">🥇</span>
              <div>
                <strong>Climb the Leaderboard</strong>
                <p>See how you rank among participants</p>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Privacy & Data 🔒",
      content: (
        <>
          <p><strong>Your privacy matters to us.</strong></p>
          <p>Here's how we handle your data:</p>
          <ul className="privacy-list">
            <li>✅ Your reflections and quest responses are stored securely in our encrypted database</li>
            <li>✅ Only you can see your detailed responses - others only see your name and points on the leaderboard</li>
            <li>✅ We use your email only to send you login links and important updates</li>
            <li>✅ Your data helps us improve the experience but is never sold or shared with third parties</li>
            <li>✅ You can request deletion of your data at any time by contacting support</li>
          </ul>
          <p className="privacy-footer">For full details, see our Privacy Policy.</p>
        </>
      )
    },
    {
      title: "Ready to Begin? 🚀",
      content: (
        <>
          <p>You now have everything you need to start your journey!</p>
          <div className="ready-checklist">
            <div className="checklist-item">✓ Understand the 4 categories</div>
            <div className="checklist-item">✓ Know the difference between daily and weekly quests</div>
            <div className="checklist-item">✓ Ready to earn points and climb the leaderboard</div>
            <div className="checklist-item">✓ Aware of how we protect your privacy</div>
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
