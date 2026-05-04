/**
 * CreateGate — password-protected landing page for the Creator Portal.
 * Shows a cover page with password input. Once unlocked, stores in localStorage.
 */
import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './CreateGate.css'

const ACCESS_CODE = 'movement2026'
const STORAGE_KEY = 'create_portal_access'

export default function CreateGate({ children }) {
  const [hasAccess, setHasAccess] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'granted'
  })
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [expressed, setExpressed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.trim().toLowerCase() === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, 'granted')
      setHasAccess(true)
    } else {
      setError('Incorrect access code')
      setCode('')
    }
  }

  if (hasAccess) return children

  return (
    <div className="cg-page">
      <div className="cg-container">
        <div className="cg-badge">Movement Maker</div>

        <h1 className="cg-headline">
          Ready to <span className="cg-gradient">scale your impact + income</span> as an experience creator?
        </h1>

        <p className="cg-sub">
          For facilitators, workshop leaders, and retreat hosts who want to fill rooms, build movements, and compound every experience.
        </p>

        <div className="cg-features">
          <div className="cg-feature">
            <span className="cg-feature-icon">🔥</span>
            <div>
              <div className="cg-feature-title">Find your movement</div>
              <div className="cg-feature-desc">Discover what you stand for and what makes people talk about you</div>
            </div>
          </div>
          <div className="cg-feature">
            <span className="cg-feature-icon">⚡</span>
            <div>
              <div className="cg-feature-title">Design bold actions</div>
              <div className="cg-feature-desc">Create moments that make the market come to you</div>
            </div>
          </div>
          <div className="cg-feature">
            <span className="cg-feature-icon">💎</span>
            <div>
              <div className="cg-feature-title">Price with confidence</div>
              <div className="cg-feature-desc">Stop guessing what to charge. Let the math do the selling.</div>
            </div>
          </div>
          <div className="cg-feature">
            <span className="cg-feature-icon">📈</span>
            <div>
              <div className="cg-feature-title">Compound every experience</div>
              <div className="cg-feature-desc">Each event builds on the last. Track what's working.</div>
            </div>
          </div>
        </div>

        <div className="cg-gate-section">
          <div className="cg-gate-label">Enter the portal</div>
          <form className="cg-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="cg-input"
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
              placeholder="Access code"
              autoFocus
            />
            <button type="submit" className="cg-cta" disabled={!code.trim()}>
              Enter
            </button>
          </form>
          {error && <p className="cg-error">{error}</p>}

          {expressed ? (
            <p className="cg-expressed">You're on the list. We'll be in touch.</p>
          ) : (
            <button
              className="cg-interest-btn"
              onClick={async () => {
                if (!user) {
                  setError('Log in first to join the list')
                  return
                }
                const { error: insertError } = await supabase.from('creator_interest').insert({
                  user_id: user.id,
                  email: user.email,
                })
                if (!insertError || insertError.code === '23505') {
                  setExpressed(true)
                } else {
                  setError('Something went wrong. Please try again.')
                }
              }}
            >
              Don't have a code? Express interest
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
