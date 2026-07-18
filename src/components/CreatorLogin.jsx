/**
 * CreatorLogin.jsx — Auth page for the creator portal PWA
 * OTP code login (6-digit). Brand purple theme. Redirects to /create after auth.
 */

import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function CreatorLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'scale'
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const codeRefs = useRef([])

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setStep('code')
    setLoading(false)
  }

  function handleCodeChange(index, value) {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return

    const next = [...code]
    next[index] = value
    setCode(next)

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus()
    }

    if (next.every(d => d) && next.join('').length === 6) {
      verifyCode(next.join(''))
    }
  }

  function handleCodeKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  function handleCodePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      e.preventDefault()
      const next = pasted.split('')
      setCode(next)
      verifyCode(pasted)
    }
  }

  async function verifyCode(token) {
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'email',
    })

    if (authError) {
      setError('Invalid code. Please try again.')
      setCode(['', '', '', '', '', ''])
      codeRefs.current[0]?.focus()
      setLoading(false)
      return
    }

    navigate('/create', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #2a0a6e 0%, #5e17eb 50%, #2a0a6e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/icon-creator-192.png"
            alt="Scale"
            style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 16, display: 'block', margin: '0 auto 16px' }}
          />
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Scale
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            Welcome, Movement Maker
          </div>
        </div>

        {isWelcome && step === 'email' && (
          <div style={{
            background: 'rgba(233, 162, 59, 0.12)',
            border: '1px solid rgba(233, 162, 59, 0.3)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E9A23B', marginBottom: 4 }}>
              Welcome to Scale!
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Your payment is confirmed. Sign in with the email you used at checkout to activate your portal.
            </div>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', textAlign: 'center', marginBottom: 6 }}>
              Sign in
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 24 }}>
              Enter your email and we'll send you a 6-digit code.
            </div>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid rgba(94, 23, 235, 0.3)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 12,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#5e17eb'}
              onBlur={e => e.target.style.borderColor = 'rgba(94, 23, 235, 0.3)'}
            />

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                fontSize: 13, marginBottom: 12, textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #E9A23B, #f5c842)',
                color: '#1a0440', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(233, 162, 59, 0.4)',
              }}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
              Enter your code
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 28 }}>
              We sent a 6-digit code to <strong style={{ color: '#fff' }}>{email}</strong>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { codeRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={i === 0 ? handleCodePaste : undefined}
                  autoFocus={i === 0}
                  style={{
                    width: 46, height: 56,
                    textAlign: 'center', fontSize: 22,
                    fontWeight: 700, fontFamily: 'monospace',
                    border: `2px solid ${digit ? '#5e17eb' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 12, outline: 'none',
                    color: '#fff',
                    background: 'rgba(255,255,255,0.06)',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#5e17eb'}
                  onBlur={e => e.target.style.borderColor = digit ? '#5e17eb' : 'rgba(255,255,255,0.15)'}
                />
              ))}
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}

            {loading && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 12 }}>
                Verifying...
              </div>
            )}

            <button
              onClick={() => { setStep('email'); setCode(['', '', '', '', '', '']); setError(null) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', fontSize: 13,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
