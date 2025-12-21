/**
 * Shared BackButton for Money Model flows
 * Provides consistent "← Go Back" navigation
 */

function BackButton({ onClick }) {
  return (
    <button
      className="back-button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '4px 0 2px 0',
        marginTop: '16px',
        marginBottom: '0',
        display: 'block',
        width: '100%',
        textAlign: 'center'
      }}
    >
      ← Go Back
    </button>
  )
}

export default BackButton
