/**
 * CreateGate — password-protected landing page for the Creator Portal.
 * Shows teaser sections with blurred answers to create tension.
 * Once unlocked via access code, stores in localStorage.
 */
import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './CreateGate.css'

const ACCESS_CODE = 'movement2026'
const STORAGE_KEY = 'create_portal_access'

const CREATORS = [
  { name: 'Brené Brown', img: '/images/creators/bren-brown.png' },
  { name: 'Wim Hof', img: '/images/creators/wim-hof.png' },
  { name: 'Tony Robbins', img: '/images/creators/tony-robbins.png' },
  { name: 'Esther Perel', img: '/images/creators/esther-perel.png' },
  { name: 'Gabby Bernstein', img: '/images/creators/gabby-bernstein.png' },
  { name: 'Jay Shetty', img: '/images/creators/jay-shetty.png' },
]

function BlurredText({ width = 120 }) {
  return (
    <span className="cg-blurred" style={{ width }}>
      <span className="cg-blurred-inner">Hidden answer text here</span>
    </span>
  )
}

function CreatorRow({ creator, children }) {
  return (
    <div className="cg-creator-row">
      <div className="cg-creator-avatar">
        <img src={creator.img} alt={creator.name} onError={e => { e.target.style.display = 'none' }} />
      </div>
      <div className="cg-creator-info">
        <div className="cg-creator-name">{creator.name}</div>
        {children}
      </div>
    </div>
  )
}

export default function CreateGate({ children }) {
  const [hasAccess, setHasAccess] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'granted'
  })
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [showCode, setShowCode] = useState(false)

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
          Pick the creators who built the life you want. <span className="cg-gradient">See exactly how they did it.</span>
        </h1>

        <p className="cg-sub">
          We studied how 59 experience creators went from unknown to world-renowned. Here's what we found.
        </p>

        {/* Section 1: How Did They Pay Rent? */}
        <div className="cg-teaser-section">
          <div className="cg-teaser-header">
            <span className="cg-teaser-num">01</span>
            <h2 className="cg-teaser-title">How Did They Pay Rent?</h2>
          </div>
          <p className="cg-teaser-sub">Before they blew up, they had to survive. Here's how.</p>
          {CREATORS.slice(0, 4).map(c => (
            <CreatorRow key={c.name} creator={c}>
              <BlurredText width={140} />
            </CreatorRow>
          ))}
        </div>

        {/* Section 2: How Did They Blow Up Their Brand? */}
        <div className="cg-teaser-section">
          <div className="cg-teaser-header">
            <span className="cg-teaser-num">02</span>
            <h2 className="cg-teaser-title">How Did They Blow Up Their Brand?</h2>
          </div>
          <p className="cg-teaser-sub">The four triggers that made the world pay attention.</p>
          {CREATORS.slice(0, 4).map(c => (
            <CreatorRow key={c.name} creator={c}>
              <div className="cg-trigger-tags">
                <span className="cg-trigger-tag">Rule Break <BlurredText width={80} /></span>
                <span className="cg-trigger-tag">Unexpected Combo <BlurredText width={80} /></span>
                <span className="cg-trigger-tag">Extreme Action <BlurredText width={80} /></span>
                <span className="cg-trigger-tag">Extreme Simplicity <BlurredText width={80} /></span>
              </div>
            </CreatorRow>
          ))}
        </div>

        {/* Section 3: How Did They Scale Their Income? */}
        <div className="cg-teaser-section">
          <div className="cg-teaser-header">
            <span className="cg-teaser-num">03</span>
            <h2 className="cg-teaser-title">How Did They Scale Their Income?</h2>
          </div>
          <p className="cg-teaser-sub">The three layers every experience creator needs.</p>
          {CREATORS.slice(0, 4).map(c => (
            <CreatorRow key={c.name} creator={c}>
              <div className="cg-trigger-tags">
                <span className="cg-trigger-tag">Attraction <BlurredText width={90} /></span>
                <span className="cg-trigger-tag">Core <BlurredText width={90} /></span>
                <span className="cg-trigger-tag">Continuity <BlurredText width={90} /></span>
              </div>
            </CreatorRow>
          ))}
        </div>

        {/* CTA */}
        <div className="cg-gate-section">
          <button
            className="cg-cta-main"
            onClick={async () => {
              if (!user) {
                window.location.href = '/log-in?returnTo=/create'
                return
              }
              const { error: insertError } = await supabase.from('creator_interest').insert({
                user_id: user.id,
                email: user.email,
              }).select()
              if (!insertError || insertError.code === '23505') {
                setShowCode(true)
              }
            }}
          >
            Sign up to learn how
          </button>

          {showCode ? (
            <p className="cg-expressed">You're on the list. We'll send you access soon.</p>
          ) : (
            <button className="cg-code-toggle" onClick={() => setShowCode(true)}>
              Already have an access code?
            </button>
          )}

          {showCode && (
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
          )}
          {error && <p className="cg-error">{error}</p>}
        </div>
      </div>
    </div>
  )
}
