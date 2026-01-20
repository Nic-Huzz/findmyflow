import { useState } from 'react'
import './PublicEmailGate.css'

/**
 * PublicEmailGate - Email capture gate before showing results
 *
 * @param {string} flowType - Type of flow for context
 * @param {function} onEmailSubmit - Callback with email and name when submitted
 * @param {string} title - Optional custom title
 * @param {string} subtitle - Optional custom subtitle
 */
export default function PublicEmailGate({
  flowType,
  onEmailSubmit,
  title = "You're almost there!",
  subtitle = "Enter your details to see your personalized results"
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    // Store in sessionStorage for later use
    sessionStorage.setItem('publicFlowName', name.trim())
    sessionStorage.setItem('publicFlowEmail', email.trim())

    // Call the callback with both name and email
    if (onEmailSubmit) {
      onEmailSubmit(email.trim(), name.trim())
    }

    setIsSubmitting(false)
  }

  return (
    <div className="email-gate">
      <div className="email-gate-content">
        <div className="email-gate-icon">✨</div>
        <h2 className="email-gate-title">{title}</h2>
        <p className="email-gate-subtitle">{subtitle}</p>

        <form onSubmit={handleSubmit} className="email-gate-form">
          <div className="email-input-wrapper">
            <input
              type="text"
              className={`email-input ${error && !name.trim() ? 'has-error' : ''}`}
              placeholder="Your first name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              autoFocus
            />
          </div>

          <div className="email-input-wrapper">
            <input
              type="email"
              className={`email-input ${error && name.trim() && !validateEmail(email) ? 'has-error' : ''}`}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />
            {error && <div className="email-error">{error}</div>}
          </div>

          <button
            type="submit"
            className="email-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Loading...' : 'See My Results'}
          </button>
        </form>

        <p className="email-gate-privacy">
          We respect your privacy. No spam, ever.
        </p>
      </div>
    </div>
  )
}
