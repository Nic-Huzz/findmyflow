import React, { useState } from 'react'
import { useAuth } from './auth/AuthProvider'

const AuthGate = ({ children }) => {
  const { user, loading, signInWithCode, verifyCode } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // 'email' or 'code'
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setMessage('')

    // Login only — don't create new accounts from AuthGate
    // New users must go through /get-started to create account + archetype profile
    const result = await signInWithCode(email.trim(), { shouldCreateUser: false })
    setIsSubmitting(false)

    if (result.success) {
      setMessage(result.message)
      setStep('code')
    } else {
      // Supabase returns "Signups not allowed for otp" when account doesn't exist
      const isNoAccount = result.message?.toLowerCase().includes('signup') ||
                          result.message?.toLowerCase().includes('not allowed')
      if (isNoAccount) {
        setMessage('no_account')
      } else {
        setMessage(result.message)
      }
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsSubmitting(true)
    setMessage('')

    const result = await verifyCode(email.trim(), code.trim())

    if (!result.success) {
      setMessage(result.message || 'Invalid code. Please try again.')
      setIsSubmitting(false)
    }
    // If successful, user state will update and component will re-render
  }

  const handleBackToEmail = () => {
    setStep('email')
    setCode('')
    setMessage('')
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
            <p>{step === 'email' ? 'Sign in to continue your journey' : 'Enter the code sent to your email'}</p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="auth-form">
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
                  autoFocus
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
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>

              {message && message !== 'no_account' && (
                <div className={`auth-message ${message.includes('Check your email') ? 'success' : 'error'}`}>
                  {message.includes('Check your email') ? '✉️ ' : '⚠️ '}
                  {message}
                </div>
              )}

              {message === 'no_account' && (
                <div className="auth-message" style={{ background: 'rgba(94, 23, 235, 0.08)', border: '1px solid rgba(94, 23, 235, 0.2)', color: '#1a1a2e' }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}>No account found for <strong>{email}</strong></p>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                    New here? <a href="/get-started" style={{ color: '#E9A23B', fontWeight: 600 }}>Start your journey</a> to discover your archetype and create your account.
                  </p>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="code">Verification Code</label>
                <div className="code-input-helper">
                  <p className="email-display">Sent to: <strong>{email}</strong></p>
                </div>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                  placeholder="Enter 6-digit code"
                  required
                  disabled={isSubmitting}
                  autoFocus
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                />
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={isSubmitting || !code.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="button-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              {message && (
                <div className="auth-message error">
                  ⚠️ {message}
                </div>
              )}

              <button
                type="button"
                className="auth-back-button"
                onClick={handleBackToEmail}
                disabled={isSubmitting}
              >
                ← Use a different email
              </button>
            </form>
          )}

          <div className="auth-footer">
            <div className="auth-divider">
              <span>Secure &amp; Passwordless</span>
            </div>
            <p>We&apos;ll send you a verification code to sign in - no password needed!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthGate


