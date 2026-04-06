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
