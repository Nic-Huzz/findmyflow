import { useState } from 'react'
import './PortalExplainer.css'

function PortalExplainer({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Here's how this works",
      content: (
        <>
          <p><strong>Discover</strong> — tick experiences you love. The more you tick, the clearer your path gets.</p>
          <p><strong>Paths</strong> — turn those experiences into life paths with projects and courage challenges.</p>
          <p><strong>Progress</strong> — watch your comfort zone grow as you take action.</p>
        </>
      )
    },
    {
      title: "This is your private space",
      content: (
        <>
          <p>The app asks you to be honest and vulnerable. Here's how we protect that:</p>
          <ul className="privacy-list">
            <li>Your reflections and healing responses are yours alone. No one else can see them.</li>
            <li>We never sell or share your data.</li>
            <li>You can delete everything at any time.</li>
          </ul>
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
