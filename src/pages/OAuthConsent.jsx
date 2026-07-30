import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/flow-base.css'

/**
 * OAuth Consent Page — /oauth/consent
 *
 * Supabase GoTrue redirects here when an OAuth client (like Claude)
 * requests authorization. Shows the user what's being requested
 * and lets them approve or deny.
 *
 * Query params from Supabase:
 *   ?authorization_id=<uuid> — the pending authorization to approve/deny
 */
export default function OAuthConsent() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Check URL param first, then sessionStorage (for post-login return)
  const urlAuthId = searchParams.get('authorization_id')
  const storedAuthId = sessionStorage.getItem('oauth_authorization_id')
  const authorizationId = urlAuthId || storedAuthId

  // Clear stored ID once we have it from the URL
  useEffect(() => {
    if (urlAuthId && storedAuthId) {
      sessionStorage.removeItem('oauth_authorization_id')
    }
  }, [urlAuthId, storedAuthId])

  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [authDetails, setAuthDetails] = useState(null)

  // Check if user is logged in + listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (!s) setLoading(false) // Show login prompt, don't redirect
    })

    // Listen for login (user might log in on this page)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' && s) {
        setSession(s)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load authorization details once we have a session
  useEffect(() => {
    if (!session || !authorizationId) return

    async function loadDetails() {
      try {
        // Get details about what the OAuth client is requesting
        const { data, error: detailsError } = await supabase.auth.oauth
          ? await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
          : { data: null, error: { message: 'OAuth methods not available in this SDK version' } }

        if (detailsError) {
          setError(detailsError.message)
        } else {
          setAuthDetails(data)
        }
      } catch (err) {
        // Fallback: if the SDK method doesn't exist yet, show a generic consent screen
        setAuthDetails({ client: { name: 'AI Assistant' }, scopes: ['openid', 'email'] })
      }
      setLoading(false)
    }

    loadDetails()
  }, [session, authorizationId])

  async function handleApprove() {
    setApproving(true)
    try {
      if (supabase.auth.oauth?.approveAuthorization) {
        const { data, error: approveError } = await supabase.auth.oauth.approveAuthorization(authorizationId)
        if (approveError) {
          setError(approveError.message)
          setApproving(false)
          return
        }
        // Supabase returns a redirect URL — follow it
        if (data?.redirect_to) {
          window.location.href = data.redirect_to
          return
        }
      } else {
        // Fallback: call the REST API directly
        const { data: { session: s } } = await supabase.auth.getSession()
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/oauth/authorize/${authorizationId}/approve`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${s.access_token}`,
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        )
        if (resp.ok) {
          const result = await resp.json()
          if (result.redirect_to) {
            window.location.href = result.redirect_to
            return
          }
        } else {
          const errBody = await resp.json().catch(() => ({}))
          setError(errBody.msg || errBody.error || 'Failed to approve')
          setApproving(false)
          return
        }
      }
    } catch (err) {
      setError(err.message)
      setApproving(false)
    }
  }

  async function handleDeny() {
    try {
      if (supabase.auth.oauth?.denyAuthorization) {
        const { data } = await supabase.auth.oauth.denyAuthorization(authorizationId)
        if (data?.redirect_to) {
          window.location.href = data.redirect_to
          return
        }
      } else {
        const { data: { session: s } } = await supabase.auth.getSession()
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/oauth/authorize/${authorizationId}/deny`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${s.access_token}`,
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        )
        if (resp.ok) {
          const result = await resp.json().catch(() => ({}))
          if (result.redirect_to) {
            window.location.href = result.redirect_to
            return
          }
        }
      }
    } catch {}
    // Fallback: just close/navigate away
    window.close()
    navigate('/')
  }

  if (!authorizationId) {
    return (
      <div className="welcome-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Missing authorization request</h2>
        <p>This page is used by AI assistants to connect to your Vibe Rise account.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="welcome-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="welcome-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p className="error-message">{error}</p>
        <button className="secondary-button" onClick={() => navigate('/')}>Go home</button>
      </div>
    )
  }

  // Not logged in — show login prompt
  if (!session) {
    return (
      <div className="welcome-container" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
        <h2 style={{ margin: '0 0 0.5rem' }}>Connect to Vibe Rise</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Log in to approve this connection
        </p>
        <button
          className="primary-button"
          onClick={() => {
            // Store authorization_id so we can resume after login
            if (authorizationId) {
              sessionStorage.setItem('oauth_authorization_id', authorizationId)
            }
            navigate('/log-in')
          }}
          style={{ width: '100%' }}
        >
          Log in
        </button>
      </div>
    )
  }

  const clientName = authDetails?.client?.name || 'AI Assistant'

  return (
    <div className="welcome-container" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
        <h2 style={{ margin: '0 0 0.5rem' }}>Connect to Vibe Rise</h2>
        <p style={{ color: '#666', margin: 0 }}>
          <strong>{clientName}</strong> wants to access your account
        </p>
      </div>

      <div style={{
        background: '#f8f8f5',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <p style={{ fontWeight: 600, margin: '0 0 0.75rem', fontSize: '0.9rem' }}>This will allow access to:</p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.8' }}>
          <li>Your quests, tasks, and progress</li>
          <li>Your skill levels and XP</li>
          <li>Your identity statements</li>
          <li>Creating and completing tasks on your behalf</li>
        </ul>
      </div>

      <div style={{
        background: '#f0edf9',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem',
        fontSize: '0.85rem',
        color: '#5e17eb',
      }}>
        You can revoke access anytime from your Profile page.
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          className="secondary-button"
          onClick={handleDeny}
          style={{ flex: 1 }}
        >
          Deny
        </button>
        <button
          className="primary-button"
          onClick={handleApprove}
          disabled={approving}
          style={{ flex: 2 }}
        >
          {approving ? 'Connecting...' : 'Approve'}
        </button>
      </div>
    </div>
  )
}
