/**
 * InstagramPostSelector.jsx — Bottom sheet to tag Instagram posts to an experience
 * Reuses MetricInputSheet pattern (slide-up overlay)
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

export default function InstagramPostSelector({ experienceId, experienceName, onClose, onSave }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [taggedIds, setTaggedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    loadPosts()
  }, [user?.id])

  async function loadPosts() {
    // Fetch recent Instagram posts
    const { data: allPosts } = await supabase
      .from('instagram_posts')
      .select('id, ig_media_id, caption, media_type, media_product_type, permalink, thumbnail_url, posted_at, like_count, comments_count, reach, views, experience_id')
      .eq('user_id', user.id)
      .order('posted_at', { ascending: false })
      .limit(30)

    if (allPosts) {
      setPosts(allPosts)
      // Pre-select posts already tagged to this experience
      const alreadyTagged = new Set(
        allPosts.filter(p => p.experience_id === experienceId).map(p => p.id)
      )
      setTaggedIds(alreadyTagged)
    }
    setLoading(false)
  }

  function togglePost(postId) {
    hapticLight()
    setTaggedIds(prev => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      hapticSuccess()

      // Clear all tags for this experience first
      await supabase
        .from('instagram_posts')
        .update({ experience_id: null })
        .eq('user_id', user.id)
        .eq('experience_id', experienceId)

      // Set tags for selected posts
      if (taggedIds.size > 0) {
        const ids = Array.from(taggedIds)
        await supabase
          .from('instagram_posts')
          .update({ experience_id: experienceId })
          .eq('user_id', user.id)
          .in('id', ids)
      }

      onSave?.()
      onClose()
    } catch (err) {
      console.error('Failed to save post tags:', err)
    } finally {
      setSaving(false)
    }
  }

  // Check if caption contains experience name (auto-suggest)
  function isAutoSuggested(caption) {
    if (!caption || !experienceName) return false
    const words = experienceName.toLowerCase().split(' ').filter(w => w.length > 3)
    return words.some(w => caption.toLowerCase().includes(w))
  }

  const totalReach = posts
    .filter(p => taggedIds.has(p.id))
    .reduce((sum, p) => sum + (p.reach || 0), 0)

  return (
    <div className="ips-overlay" onClick={onClose}>
      <div className="ips-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ips-header">
          <div>
            <div className="ips-title">Tag Posts to "{experienceName}"</div>
            {taggedIds.size > 0 && (
              <div className="ips-summary">
                {taggedIds.size} post{taggedIds.size > 1 ? 's' : ''} tagged, {totalReach.toLocaleString()} total reach
              </div>
            )}
          </div>
          <button className="ips-close" onClick={onClose}>✕</button>
        </div>

        {/* Post list */}
        <div className="ips-list">
          {loading ? (
            <div className="ips-loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="ips-empty">
              No Instagram posts synced yet. Connect Instagram and refresh to see your posts here.
            </div>
          ) : (
            posts.map(post => {
              const isTagged = taggedIds.has(post.id)
              const isOtherExp = post.experience_id && post.experience_id !== experienceId
              const suggested = isAutoSuggested(post.caption)

              return (
                <div
                  key={post.id}
                  className={`ips-post ${isTagged ? 'tagged' : ''} ${suggested && !isTagged ? 'suggested' : ''}`}
                  onClick={() => !isOtherExp && togglePost(post.id)}
                  style={{ opacity: isOtherExp ? 0.4 : 1 }}
                >
                  {/* Thumbnail */}
                  <div className="ips-thumb">
                    {post.thumbnail_url ? (
                      <img src={post.thumbnail_url} alt="" />
                    ) : (
                      <span>{post.media_type === 'VIDEO' ? '🎬' : '📷'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="ips-info">
                    <div className="ips-caption">
                      {post.caption?.substring(0, 60) || 'No caption'}
                      {post.caption?.length > 60 ? '...' : ''}
                    </div>
                    <div className="ips-meta">
                      {post.media_product_type === 'REELS' ? 'Reel' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post'}
                      {' · '}
                      {formatDate(post.posted_at)}
                    </div>
                    <div className="ips-stats">
                      {(post.reach || 0).toLocaleString()} reach · {post.like_count || 0} likes
                      {post.comments_count > 0 ? ` · ${post.comments_count} comments` : ''}
                    </div>
                  </div>

                  {/* Tag toggle */}
                  <div className="ips-toggle">
                    {isOtherExp ? (
                      <span className="ips-other">Other</span>
                    ) : isTagged ? (
                      <span className="ips-check">✓</span>
                    ) : suggested ? (
                      <span className="ips-suggest">Match</span>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="ips-footer">
          <button className="ips-done" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : `Done${taggedIds.size > 0 ? ` (${taggedIds.size} tagged)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
