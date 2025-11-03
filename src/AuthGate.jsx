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
        <div className="loading">
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
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome to Find My Flow</h1>
          <p>Sign in to access your personalized profile and continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isSubmitting || !email.trim()}
          >
            {isSubmitting ? 'Sending...' : 'Send Magic Link'}
          </button>

          {message && (
            <div className={`auth-message ${message.includes('Check your email') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>We'll send you a secure link to sign in - no password required!</p>
        </div>
      </div>
    </div>
  )
}

export default AuthGate


