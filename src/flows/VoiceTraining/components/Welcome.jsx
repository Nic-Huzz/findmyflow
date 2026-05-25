/**
 * Welcome - Voice Training introduction
 */
export default function Welcome({ hasExisting, onContinue, onEdit, onBack }) {
  return (
    <div className="vt-welcome">
      <div className="vt-welcome-icon">🎙️</div>
      <h1>Voice Training Studio</h1>
      <p>
        Let&apos;s capture your unique voice so AI writes content that sounds
        authentically like YOU.
      </p>

      <div className="vt-welcome-features">
        <div className="vt-feature">
          <span className="vt-feature-icon">✨</span>
          <span className="vt-feature-text">
            <strong>Personalized content</strong> - AI learns your style, not generic marketing speak
          </span>
        </div>
        <div className="vt-feature">
          <span className="vt-feature-icon">⚡</span>
          <span className="vt-feature-text">
            <strong>Quick path available</strong> - Pick a voice template if you&apos;re short on time
          </span>
        </div>
        <div className="vt-feature">
          <span className="vt-feature-icon">🎯</span>
          <span className="vt-feature-text">
            <strong>Context + Voice</strong> - Combines with your Vibe Rise data for best results
          </span>
        </div>
        <div className="vt-feature">
          <span className="vt-feature-icon">🔄</span>
          <span className="vt-feature-text">
            <strong>Update anytime</strong> - Refine your voice as your brand evolves
          </span>
        </div>
      </div>

      {hasExisting ? (
        <>
          <button className="vt-continue-btn" onClick={onEdit}>
            Update My Voice Profile
          </button>
          <button className="vt-secondary-btn" onClick={onBack}>
            ← Back
          </button>
        </>
      ) : (
        <>
          <button className="vt-continue-btn" onClick={onContinue}>
            Let&apos;s Get Started
          </button>
          <button className="vt-secondary-btn" onClick={onBack}>
            ← Back
          </button>
        </>
      )}
    </div>
  )
}
