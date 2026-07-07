/**
 * CreateGate — account-based landing page for the Creator Portal.
 * Shows teaser sections to non-members.
 * Access is granted via user_subscriptions (plan_type includes 'creator').
 * Members are enrolled on the website; the app checks account status.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './CreateGate.css'

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
  const { user, loading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expressed, setExpressed] = useState(false)

  // Check account-based access via user_subscriptions
  useEffect(() => {
    if (authLoading) return // wait for auth to resolve first

    async function checkAccess() {
      if (!user?.id) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('status, plan_type')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        // On query failure, keep loading rather than wrongly denying access
        console.error('Subscription check failed:', error.message)
        setLoading(false)
        return
      }

      const active = data?.status === 'active' &&
        (data?.plan_type === 'creator' || data?.plan_type === 'pro')

      setHasAccess(active)
      setLoading(false)
    }

    checkAccess()
  }, [user?.id, authLoading])

  if (loading) {
    return (
      <div className="cg-page">
        <div className="cg-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div className="cg-loading-spinner" />
        </div>
      </div>
    )
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

        {/* CTA — no pricing, no external purchase link (App Store 3.1.3(f) compliant) */}
        <div className="cg-gate-section">
          {expressed ? (
            <p className="cg-expressed">You're on the list. We'll be in touch soon.</p>
          ) : (
            <button
              className="cg-cta-main"
              onClick={async () => {
                if (!user) {
                  window.location.href = '/log-in?returnTo=/create'
                  return
                }
                setExpressed(true)
                const { error } = await supabase.from('creator_interest').insert({
                  user_id: user.id,
                  email: user.email,
                })
                if (error && error.code !== '23505') {
                  console.error('Waitlist insert failed:', error.message)
                }
                // Notify Huzz via email (fire-and-forget)
                supabase.functions.invoke('notify-app-build-interest', {
                  body: {
                    userEmail: user.email,
                    userName: user.user_metadata?.display_name || user.user_metadata?.name || null,
                    userId: user.id,
                    source: 'creator-portal',
                  },
                }).catch(() => {})
              }}
            >
              Join the waitlist
            </button>
          )}

          <button
            className="cg-cta-signin"
            onClick={() => { window.location.href = '/log-in?returnTo=/create' }}
            style={{
              marginTop: 12,
              padding: '14px 24px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Already a member? Sign in
          </button>

        </div>
      </div>
    </div>
  )
}
