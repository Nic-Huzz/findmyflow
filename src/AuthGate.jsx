import React, { useState } from 'react'
import { useAuth } from './auth/AuthProvider'

const AuthGate = ({ children }) => {
  const { user, loading, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setMessage('')

    const result = await signInWithMagicLink(email.trim())
    setMessage(result.message)
    setIsSubmitting(false)

    if (result.success) {
      setEmail('')
    }
  }

  if (loading) {
    return (
      <div className="auth-gate">
        <div className="auth-loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return children
  }

  return (
    <div className="auth-gate">
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <div className="auth-logo">Find Your Flow</div>
          <h2>Live Your Ambitions Faster</h2>
          <p>Join a community of aspiring Movement Makers gamifying their ambitions.</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="feature-icon">✨</span>
              <span>Discover your unique archetypes</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">🎯</span>
              <span>Complete the 7-Day Challenge</span>
            </div>
            <div className="auth-feature">
              <span className="feature-icon">📊</span>
              <span>Track your personal growth</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h1>Welcome Back</h1>
            <p>Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting || !email.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="button-spinner"></span>
                  Sending...
                </>
              ) : (
                'Send Magic Link'
              )}
            </button>

            {message && (
              <div className={`auth-message ${message.includes('Check your email') ? 'success' : 'error'}`}>
                {message.includes('Check your email') ? '✉️ ' : '⚠️ '}
                {message}
              </div>
            )}
          </form>

          <div className="auth-footer">
            <div className="auth-divider">
              <span>Secure &amp; Passwordless</span>
            </div>
            <p>We&apos;ll send you a magic link to sign in instantly - no password needed!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthGate


