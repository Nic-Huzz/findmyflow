/**
 * CreatorLogin.jsx — Simple auth page for the creator portal PWA
 * Email/password login + magic link. Dark theme. Redirects to /create after auth.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function CreatorLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('password') // 'password' | 'magic'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [magicSent, setMagicSent] = useState(false)

  async function handlePasswordLogin(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    navigate('/create', { replace: true })
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/create` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setMagicSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
            Vibe Rise
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            Creator Portal
          </div>
        </div>

        {magicSent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>📧</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
              Check your email
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              We sent a sign-in link to <strong style={{ color: '#fff' }}>{email}</strong>. Click it to access the creator portal.
            </div>
          </div>
        ) : (
          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
            {/* Email */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password (only in password mode) */}
            {mode === 'password' && (
              <div style={{ marginBottom: 16 }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: 13,
                marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 10,
                border: 'none',
                background: '#5e17eb',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in...' : mode === 'password' ? 'Sign In' : 'Send Magic Link'}
            </button>

            {/* Mode toggle */}
            <button
              type="button"
              onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '12px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
