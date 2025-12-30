import { useState } from 'react'
import './PortalExplainer.css'

function PortalExplainer({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Welcome to Your Flow Portal! 🌊",
      content: (
        <>
          <p>Over the next 7 days, you'll complete quests across five tabs to help you find your flow and amplify your impact.</p>
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
              <div className="category-icon">😤</div>
              <h3>Groans</h3>
              <p>Tasks your essence knows you're capable of, but your body still has resistance</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">💜</div>
              <h3>Healing</h3>
              <p>Processing the micro-traumas creating fear around being yourself</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">💼</div>
              <h3>Business</h3>
              <p>Build your offer, product, and launch strategy</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🧭</div>
              <h3>Tracker</h3>
              <p>Log your flow state with Flow Compass</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">⭐</div>
              <h3>Bonus</h3>
              <p>Extra quests for bonus points</p>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Groans & Healing 🗺️",
      content: (
        <>
          <p>Groans and Healing tabs use the R's framework to help you work through resistance:</p>
          <div className="category-grid">
            <div className="explainer-category">
              <div className="category-icon">🔍</div>
              <h3>Recognise</h3>
              <p>Build awareness of patterns, triggers, and your essence voice</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🕊️</div>
              <h3>Release</h3>
              <p>Let go of stored emotions and traumas (Healing)</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">⚡</div>
              <h3>Rewire</h3>
              <p>Act despite fear and rewire old patterns (Groans)</p>
            </div>
            <div className="explainer-category">
              <div className="category-icon">🌊</div>
              <h3>Reconnect</h3>
              <p>Morning routines to connect with your essence (Groans)</p>
            </div>
          </div>
          <p className="quest-tip">💡 <strong>Tip:</strong> Filter by Daily or Weekly to focus on what's relevant today!</p>
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
            <div className="checklist-item">✓ Understand the 5 quest tabs</div>
            <div className="checklist-item">✓ Know the R's framework for growth</div>
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
