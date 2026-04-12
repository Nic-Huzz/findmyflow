import { useEffect } from 'react'
import './JourneyGraphPopup.css'

export default function JourneyGraphPopup({ isOpen, onClose, currentLevel = 1 }) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="journey-graph-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="journey-graph-popup">
        <button className="journey-graph-close" onClick={onClose}>&times;</button>
        <h3 className="journey-graph-title">Your Journey</h3>

        <div className="journey-graph-container">
          <img
            src="/images/carousel/Self-Actualisation/export/slide_2.png"
            alt="Sprouter Sweet Spot: Self-Knowledge x Action"
            className="journey-graph-image"
          />
        </div>

        <p className="journey-graph-caption">
          You started in the Unfulfilment Zone. Let's keep upgrading self-knowledge and building towards self-actualisation.
        </p>
      </div>
    </div>
  )
}
