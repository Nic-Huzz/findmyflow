/**
 * ErrorMessage - Error display with optional WhatsApp help button
 *
 * Drop-in replacement for: {error && <p className="error-message">{error}</p>}
 * Use instead:             {error && <ErrorMessage error={error} component="MyComponent" />}
 *
 * Props:
 *   - error: string | Error - the error message or Error object
 *   - component: string - component name for bug report context
 *   - showHelp: boolean - whether to show the WhatsApp help button (default: true)
 *   - className: string - additional CSS classes
 */

import { openWhatsAppSupport } from '../lib/errorSupport'

function ErrorMessage({
  error,
  component = 'Unknown',
  action = null,
  showHelp = true,
  className = ''
}) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error?.message || error?.toString()

  const handleGetHelp = () => {
    openWhatsAppSupport({
      component,
      action,
      errorMessage,
      errorCode: error?.code || null
    })
  }

  return (
    <div className={`error-message-container ${className}`}>
      <p className="error-message">{errorMessage}</p>
      {showHelp && (
        <button
          type="button"
          onClick={handleGetHelp}
          className="error-help-link"
        >
          Report this issue
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
