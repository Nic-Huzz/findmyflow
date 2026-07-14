/**
 * CreateGate — account-based landing page for the Creator Portal.
 * Shows teaser sections to non-members.
 * Access is granted via user_subscriptions (plan_type includes 'creator').
 * Members are enrolled on the website; the app checks account status.
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { checkSubscription } from '../lib/subscriptionService'
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

      const { active, plan } = await checkSubscription(user.id)
      setHasAccess(active && (plan === 'creator' || plan === 'pro'))
      setLoading(false)
    }

    checkAccess().catch(() => {
      setHasAccess(false)
      setLoading(false)
    })
  }, [user?.id, authLoading])

  // Hide bottom toolbar when gate is blocking
  useEffect(() => {
    if (!loading && !hasAccess) {
      document.body.classList.add('hide-toolbar')
      return () => document.body.classList.remove('hide-toolbar')
    }
  }, [loading, hasAccess])

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
        <div className="cg-badge">Become a Movement Maker</div>

        <h1 className="cg-headline">
          Pick the experience creators who built the life you want. <span className="cg-gradient">See exactly how they did it.</span>
        </h1>

        <p className="cg-sub">
          We studied how 100 experience creators went from unknown to famous. Here's what we found.
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
          <p className="cg-teaser-sub">The rule they broke that made the world pay attention.</p>
          {CREATORS.slice(0, 4).map(c => (
            <CreatorRow key={c.name} creator={c}>
              <div className="cg-trigger-tags">
                <span className="cg-trigger-tag">Rule Break <BlurredText width={140} /></span>
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

        {/* Section 4: What's inside the portal */}
        <div className="cg-teaser-section">
          <div className="cg-teaser-header">
            <span className="cg-teaser-num">04</span>
            <h2 className="cg-teaser-title">Then Run the Same Playbook</h2>
          </div>
          <p className="cg-teaser-sub">The portal turns what they did into steps you can follow.</p>
          <div className="cg-feature-row">
            <span className="cg-feature-icon">💎</span>
            <div className="cg-feature-info">
              <div className="cg-feature-name">Find your rule break</div>
              <div className="cg-feature-desc">A guided flow that finds the thing you do differently. That's what makes word spread.</div>
            </div>
          </div>
          <div className="cg-feature-row">
            <span className="cg-feature-icon">🎟️</span>
            <div className="cg-feature-info">
              <div className="cg-feature-name">Fill your events</div>
              <div className="cg-feature-desc">Plan every event with a simple pipeline. Attract, capture, convert, deliver, grow.</div>
            </div>
          </div>
          <div className="cg-feature-row">
            <span className="cg-feature-icon">🎯</span>
            <div className="cg-feature-info">
              <div className="cg-feature-name">Nail your positioning</div>
              <div className="cg-feature-desc">We turn your answers into a clear statement of who you help and why they come to you.</div>
            </div>
          </div>
        </div>

        <p className="cg-whofor">For people who run workshops, retreats, circles, or live events. Or want to start.</p>

        {/* CTA — no pricing, no external purchase link (App Store 3.1.3(f) compliant) */}
        <div className="cg-gate-section">
          <p className="cg-proof">Built from a study of 100 creators, including Brené Brown, Wim Hof and Tony Robbins.</p>
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
          >
            Already a member? Sign in
          </button>

        </div>
      </div>
    </div>
  )
}
