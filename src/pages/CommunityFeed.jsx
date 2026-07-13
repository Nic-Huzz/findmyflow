/**
 * CommunityFeed — Community activity feed
 *
 * Shows a cumulative wahoo counter + paginated feed of community events
 * with reaction buttons. Auto events (graduations, streaks, level ups)
 * and opt-in shared wahoos all appear in a single timeline.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

// Hide bottom toolbar on this page
import { supabase } from '../lib/supabaseClient'
import { fetchFeed, toggleFeedReaction } from '../lib/communityFeed'
import './CommunityFeed.css'

const REACTION_TYPES = [
  { type: 'cheer', emoji: '🎉', label: 'Cheer' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'heart', emoji: '💜', label: 'Heart' },
]

const EVENT_ICONS = {
  stage_graduation: '🏔️',
  streak_milestone: '🔥',
  level_up: '⚡',
  first_wahoo: '✨',
  first_vibe_rise: '✨',
  insight_unlocked: '🔮',
  league_win: '🏆',
  shared_wahoo: '💪',
  shared_healing: '💚',
  shared_weekly_review: '📊',
}

// Variant CSS class for auto-event accent borders
const EVENT_VARIANT = {
  stage_graduation: 'graduation',
  streak_milestone: 'streak_milestone',
  level_up: 'level_up',
}

function timeAgo(dateStr) {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
}

export default function CommunityFeed() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalWahoos, setTotalWahoos] = useState(0)
  const [myWahoos, setMyWahoos] = useState(0)
  const [displayNames, setDisplayNames] = useState({})
  const pendingReactions = useRef(new Set())

  const PAGE_SIZE = 20

  // Fetch cumulative wahoo counts
  useEffect(() => {
    if (!userId) return

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthISO = monthStart.toISOString()

    // Total wahoos this month
    supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('quest_category', 'Groans')
      .gte('created_at', monthISO)
      .then(({ count }) => setTotalWahoos(count || 0))

    // My wahoos this month
    supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('quest_category', 'Groans')
      .eq('user_id', userId)
      .gte('created_at', monthISO)
      .then(({ count }) => setMyWahoos(count || 0))
  }, [userId])

  // Fetch display names for a set of user IDs
  const fetchDisplayNames = useCallback(async (userIds) => {
    if (!userIds.length) return
    const unknownIds = userIds.filter(id => !displayNames[id])
    if (!unknownIds.length) return

    // Fetch profile data + avatar URL
    const { data: profileData } = await supabase
      .from('lead_flow_profiles')
      .select('user_id, custom_essence_name, essence_archetype, custom_essence_image')
      .in('user_id', unknownIds)

    const { data: avatarData } = await supabase
      .from('user_stage_progress')
      .select('user_id, hero_avatar_url')
      .in('user_id', unknownIds)

    const avatarMap = {}
    avatarData?.forEach(a => { if (a.hero_avatar_url) avatarMap[a.user_id] = a.hero_avatar_url })

    const names = { ...displayNames }
    const foundIds = new Set()
    if (profileData) {
      profileData.forEach(p => {
        const essenceName = p.custom_essence_name
        const archetype = p.essence_archetype
        // Format: "Name: Archetype" if both exist, otherwise just whichever is available
        const display = essenceName && archetype
          ? `${essenceName}: ${archetype}`
          : essenceName || archetype || null
        names[p.user_id] = {
          display: display,
          avatarUrl: p.custom_essence_image || avatarMap[p.user_id] || null,
        }
        foundIds.add(p.user_id)
      })
    }

    // For users without profiles, get email prefix
    const noProfileIds = unknownIds.filter(id => !foundIds.has(id))
    if (noProfileIds.length) {
      // We can't query auth.users directly from client, so fall back to email prefix
      // The user's own email is available from auth context
      noProfileIds.forEach(id => {
        if (id === userId && user?.email) {
          names[id] = { display: user.email.split('@')[0], avatarUrl: avatarMap[id] || null }
        } else if (!names[id]) {
          names[id] = { display: null, avatarUrl: avatarMap[id] || null }
        }
      })
    }

    setDisplayNames(names)
  }, [displayNames, userId, user?.email])

  // Load initial feed
  useEffect(() => {
    if (!userId) return
    loadFeed(0)
  }, [userId])

  const loadFeed = async (offset) => {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)

    const { data, error } = await fetchFeed(offset, PAGE_SIZE)

    if (error) {
      console.error('Feed fetch error:', error)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const newItems = data || []
    if (offset === 0) {
      setItems(newItems)
    } else {
      setItems(prev => [...prev, ...newItems])
    }

    setHasMore(newItems.length === PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)

    // Fetch display names for new items
    const userIds = [...new Set(newItems.map(item => item.user_id))]
    fetchDisplayNames(userIds)
  }

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    loadFeed(items.length)
  }

  const handleReaction = useCallback(async (itemId, reactionType) => {
    const key = `${itemId}-${reactionType}`
    if (pendingReactions.current.has(key)) return
    pendingReactions.current.add(key)

    // Optimistic update
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const reactions = item.reactions || []
      const existing = reactions.find(r => r.reaction_type === reactionType && r.user_id === userId)
      let newReactions
      if (existing) {
        newReactions = reactions.filter(r => !(r.reaction_type === reactionType && r.user_id === userId))
      } else {
        newReactions = [...reactions, { reaction_type: reactionType, user_id: userId }]
      }
      return { ...item, reactions: newReactions }
    }))

    try {
      await toggleFeedReaction(itemId, userId, reactionType)
    } catch (err) {
      console.error('Reaction error:', err)
    } finally {
      pendingReactions.current.delete(key)
    }
  }, [userId])

  const getDisplayName = (itemUserId) => {
    const info = displayNames[itemUserId]
    return info?.display || 'Someone'
  }

  const getAvatarUrl = (itemUserId) => {
    const info = displayNames[itemUserId]
    return info?.avatarUrl || null
  }

  const formatSubtitle = (text) => {
    if (!text) return null
    return text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const getReactionCount = (reactions, type) => {
    if (!reactions) return 0
    return reactions.filter(r => r.reaction_type === type).length
  }

  const isReactionActive = (reactions, type) => {
    if (!reactions) return false
    return reactions.some(r => r.reaction_type === type && r.user_id === userId)
  }

  return (
    <div className="cf-page">
      {/* Toolbar */}
      <div className="cf-toolbar">
        <button className="cf-back-btn" onClick={() => navigate('/7-day-challenge')}>
          ← Back
        </button>
        <h1 className="cf-toolbar-title">Community</h1>
        <div style={{ width: 60 }} /> {/* Spacer for centering */}
      </div>

      {/* Cumulative counter */}
      <div className="cf-counter">
        <div className="cf-counter-total">
          {totalWahoos}
          <span>wahoos completed this month</span>
        </div>
        {myWahoos > 0 && (
          <div className="cf-counter-you">
            You contributed <strong>{myWahoos}</strong> of them
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="cf-loading">
          <div className="cf-spinner" />
          <span>Loading feed...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="cf-empty">
          <span className="cf-empty-icon">📣</span>
          <h2 className="cf-empty-title">No activity yet</h2>
          <p className="cf-empty-text">
            Complete a wahoo to be the first on the feed.
          </p>
        </div>
      )}

      {/* Feed items */}
      {!loading && items.length > 0 && (
        <div className="cf-feed">
          {items.map(item => {
            const variant = EVENT_VARIANT[item.event_type] || ''
            const icon = EVENT_ICONS[item.event_type] || '💪'
            const name = getDisplayName(item.user_id)
            const avatarUrl = getAvatarUrl(item.user_id)

            return (
              <div key={item.id} className={`cf-item${variant ? ` cf-item--${variant}` : ''}`}>
                {/* Header */}
                <div className="cf-item-header">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="cf-avatar-img" />
                  ) : (
                    <div className="cf-avatar">{getInitials(name)}</div>
                  )}
                  <span className="cf-item-name">{name}</span>
                  <span className="cf-item-time">{timeAgo(item.created_at)}</span>
                </div>

                {/* Body */}
                <div className="cf-item-body">
                  <p className="cf-item-title">{icon} {item.title}</p>
                  {item.subtitle && (
                    <p className="cf-item-subtitle">{formatSubtitle(item.subtitle)}</p>
                  )}
                </div>

                {/* Image */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt=""
                    className="cf-item-image"
                    loading="lazy"
                  />
                )}

                {/* Reactions */}
                <div className="cf-reactions">
                  {REACTION_TYPES.map(rt => {
                    const count = getReactionCount(item.reactions, rt.type)
                    const active = isReactionActive(item.reactions, rt.type)
                    return (
                      <button
                        key={rt.type}
                        className={`cf-reaction-btn${active ? ' cf-reaction-active' : ''}`}
                        onClick={() => handleReaction(item.id, rt.type)}
                        title={rt.label}
                      >
                        <span>{rt.emoji}</span>
                        {count > 0 && <span className="cf-reaction-count">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Load more */}
      {!loading && hasMore && items.length > 0 && (
        <div className="cf-load-more">
          <button
            className="cf-load-more-btn"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
