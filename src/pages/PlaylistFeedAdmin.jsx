/**
 * PlaylistFeedAdmin — moderation queue for the public Play-List feed.
 *
 * Lists pending + recent posts. Admin actions: approve, remove.
 * Access controlled by admin_users table via RLS policies on
 * playlist_feed_posts.
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './PlaylistFeedAdmin.css'

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'flagged', label: 'Flagged' },
  { id: 'approved', label: 'Approved' },
  { id: 'removed', label: 'Removed' },
]

export default function PlaylistFeedAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('pending')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(null)

  const checkAdmin = useCallback(async () => {
    if (!user?.id) return false
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    return !!data
  }, [user?.id])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('playlist_feed_posts')
      .select('*')
      .eq('moderation_status', filter)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) console.error('Load posts error:', error)
    setPosts(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const ok = await checkAdmin()
      if (cancelled) return
      setAuthorized(ok)
      if (ok) loadPosts()
    })()
    return () => { cancelled = true }
  }, [checkAdmin, loadPosts])

  useEffect(() => {
    if (authorized) loadPosts()
  }, [authorized, loadPosts])

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('playlist_feed_posts')
      .update({ moderation_status: status })
      .eq('id', id)
    if (error) {
      alert('Failed to update: ' + error.message)
      return
    }
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  if (authorized === null) {
    return <div className="pfa-page"><div className="pfa-loading">Checking access...</div></div>
  }

  if (authorized === false) {
    return (
      <div className="pfa-page">
        <div className="pfa-error">
          <h2>Not authorized</h2>
          <p>This page is for admins only.</p>
          <button onClick={() => navigate('/me')}>Back to home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="pfa-page">
      <header className="pfa-header">
        <h1>Play-List Feed Moderation</h1>
        <div className="pfa-filters">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`pfa-filter ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <main className="pfa-grid">
        {loading && <div className="pfa-loading">Loading...</div>}
        {!loading && posts.length === 0 && (
          <div className="pfa-empty">No posts in this queue.</div>
        )}
        {posts.map(post => (
          <div key={post.id} className="pfa-card">
            <img src={post.media_url} alt="" className="pfa-img" />
            <div className="pfa-meta">
              <div className="pfa-name">{post.display_name || 'Anonymous'}</div>
              <div className="pfa-sub">
                Day {post.day_number} · {new Date(post.created_at).toLocaleString()}
              </div>
              {post.challenge_title && (
                <div className="pfa-challenge">{post.challenge_title}</div>
              )}
              {post.caption && <p className="pfa-caption">"{post.caption}"</p>}
            </div>
            <div className="pfa-actions">
              {filter !== 'approved' && (
                <button
                  className="pfa-btn approve"
                  onClick={() => updateStatus(post.id, 'approved')}
                >
                  Approve
                </button>
              )}
              {filter !== 'removed' && (
                <button
                  className="pfa-btn remove"
                  onClick={() => updateStatus(post.id, 'removed')}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
