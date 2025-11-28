import { useEffect } from 'react';
import { getStageDisplayName } from '../lib/personaStages';
import './GraduationModal.css';

function GraduationModal({ isOpen, celebration, onClose }) {
  useEffect(() => {
    // Prevent scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !celebration) return null;

  return (
    <div className="graduation-modal-overlay" onClick={onClose}>
      <div className="graduation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confetti-container">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="graduation-content">
          <div className="graduation-icon">
            {celebration.title?.includes('🎉') ? '🎉' :
             celebration.title?.includes('🚀') ? '🚀' :
             celebration.title?.includes('✨') ? '✨' :
             celebration.title?.includes('🌟') ? '🌟' : '🎊'}
          </div>

          <h2 className="graduation-title">
            {celebration.title || 'Congratulations!'}
          </h2>

          <p className="graduation-message">
            {celebration.message || 'You completed a stage!'}
          </p>

          {celebration.next_step && (
            <div className="next-step">
              <p className="next-step-label">What's Next?</p>
              <p className="next-step-text">{celebration.next_step}</p>
            </div>
          )}

          <button className="close-button" onClick={onClose}>
            Continue Your Journey
          </button>
        </div>
      </div>
    </div>
  );
}

export default GraduationModal;
