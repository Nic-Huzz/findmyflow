/**
 * WhatsAppErrorButton - Reusable button to report errors via WhatsApp
 *
 * Usage:
 *   <WhatsAppErrorButton error={error} component="MyComponent" />
 *   <WhatsAppErrorButton errorMessage="Something failed" component="MyComponent" />
 */

import { openWhatsAppSupport } from '../lib/errorSupport'

function WhatsAppErrorButton({
  error = null,
  errorMessage = null,
  errorCode = null,
  component = 'Unknown',
  action = null,
  variant = 'button', // 'button' | 'link' | 'icon'
  className = ''
}) {
  const handleClick = () => {
    openWhatsAppSupport({
      component,
      action,
      errorMessage: errorMessage || error?.message || error?.toString() || 'Unknown error',
      errorCode: errorCode || error?.code || null,
      errorStack: error?.stack || null
    })
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`whatsapp-error-icon ${className}`}
        title="Report this error via WhatsApp"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '4px'
        }}
      >
        💬
      </button>
    )
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        className={`whatsapp-error-link ${className}`}
        style={{
          background: 'none',
          border: 'none',
          color: '#25D366',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: 'inherit',
          padding: 0
        }}
      >
        Report via WhatsApp
      </button>
    )
  }

  // Default button variant
  return (
    <button
      onClick={handleClick}
      className={`whatsapp-error-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#25D366',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#128C7E'}
      onMouseLeave={(e) => e.target.style.backgroundColor = '#25D366'}
    >
      <span>💬</span> Get Help
    </button>
  )
}

export default WhatsAppErrorButton
