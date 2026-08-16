/**
 * InstagramConnect.jsx — Connect/status card for Instagram integration
 * Shows connect CTA, connected state with username, or error state
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'

export default function InstagramConnect({ onRefresh }) {
  const { user } = useAuth()
  const [integration, setIntegration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    loadIntegration()
  }, [user?.id])

  // Check URL params for OAuth callback result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const igConnect = params.get('ig_connect')
    if (igConnect === 'success') {
      loadIntegration()
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (igConnect === 'error') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function loadIntegration() {
    const { data } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .single()
    setIntegration(data)
    setLoading(false)
  }

  async function handleConnect() {
    setLoading(true)
    try {
      const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-callback`
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-instagram`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ callback_url: callbackUrl }),
        }
      )

      const result = await res.json()

      if (result.status === 'already_connected') {
        await loadIntegration()
        return
      }

      if (result.redirect_url) {
        window.location.href = result.redirect_url
      }
    } catch (err) {
      console.error('Connect failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setSyncing(true)
    setSyncError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-instagram`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: user.id, initial_sync: true }),
        }
      )
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(body || `Sync failed (${res.status})`)
      }
      await loadIntegration()
      onRefresh?.()
    } catch (err) {
      console.error('Refresh failed:', err)
      setSyncError(err.message || 'Sync failed. Try again.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    await supabase
      .from('user_integrations')
      .update({ status: 'disconnected' })
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
    setIntegration(null)
  }

  if (loading) return null

  // Connected state
  if (integration?.status === 'active') {
    const lastSync = integration.last_synced_at
      ? formatTimeAgo(new Date(integration.last_synced_at))
      : 'never'

    return (
      <div className="ch2-card" style={{ border: '1px solid rgba(94, 23, 235, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
              📸 @{integration.platform_username || 'Instagram'}
            </div>
            <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 2 }}>
              Last synced: {lastSync}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="ch2-btn-outline"
              style={{ fontSize: 10, padding: '4px 10px' }}
              onClick={handleRefresh}
              disabled={syncing}
            >
              {syncing ? '↻ Syncing...' : '↻ Refresh'}
            </button>
            <button
              style={{ fontSize: 10, padding: '4px 8px', background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer' }}
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        </div>
        {syncError && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>{syncError}</div>
        )}
      </div>
    )
  }

  // Error state
  if (integration?.status === 'error') {
    return (
      <div className="ch2-card" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ fontSize: 12, color: 'rgba(239, 68, 68, 0.8)', marginBottom: 6 }}>
          Instagram connection lost
        </div>
        <button className="ch2-btn-outline" onClick={handleConnect}>
          Reconnect Instagram
        </button>
      </div>
    )
  }

  // Not connected — CTA
  return (
    <div
      className="ch2-card"
      style={{
        background: 'linear-gradient(135deg, rgba(94, 23, 235, 0.06), rgba(233, 162, 59, 0.05))',
        border: '1px solid rgba(94, 23, 235, 0.2)',
        cursor: 'pointer',
      }}
      onClick={handleConnect}
    >
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>📸</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>
          Connect Instagram
        </div>
        <div style={{ fontSize: 11, color: '#6c757d', lineHeight: 1.4 }}>
          Track your brand growth and link posts to experiences automatically
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
