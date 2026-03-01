/**
 * NewsfeedPage — League Activity Feed
 *
 * Mixed feed of approved content submissions (with OG previews + reactions)
 * and quest completions from league members. Pull-to-refresh + infinite scroll.
 */
import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import useNewsfeed from '../../hooks/useNewsfeed'
import { useLeagueData } from '../../hooks/useLeagueData'
import { addReaction, removeReaction } from '../../lib/league/leagueService'
import { CONTENT_POINT_VALUES } from '../../lib/league/leagueConfig'
import PullToRefresh from '../../components/crm/PullToRefresh'
import './NewsfeedPage.css'

const REACTION_TYPES = [
  { type: 'cheer', emoji: '🎉', label: 'Cheer' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'heart', emoji: '💜', label: 'Heart' },
]

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

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export default function NewsfeedPage() {
  const { league, loading: leagueLoading } = useLeagueData()
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    userReactions,
    toggleReaction,
  } = useNewsfeed(league?.id)

  const pendingReactions = useRef(new Set())

  const handleReaction = useCallback(async (submissionId, reactionType) => {
    const key = `${submissionId}-${reactionType}`
    if (pendingReactions.current.has(key)) return
    pendingReactions.current.add(key)

    // toggleReaction returns true if added, false if removed
    const added = toggleReaction(submissionId, reactionType)

    try {
      if (added) {
        await addReaction(submissionId, reactionType)
      } else {
        await removeReaction(submissionId, reactionType)
      }
    } catch (err) {
      // Revert optimistic update on failure
      toggleReaction(submissionId, reactionType)
      console.error('Reaction failed:', err)
    } finally {
      pendingReactions.current.delete(key)
    }
  }, [toggleReaction])

  if (leagueLoading || loading) {
    return (
      <div className="newsfeed-page">
        <div className="nf-toolbar">
          <h1 className="nf-toolbar-title">Newsfeed</h1>
        </div>
        <div className="nf-loading">
          <div className="nf-spinner" />
          <span>Loading feed...</span>
        </div>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="newsfeed-page">
        <div className="nf-toolbar">
          <h1 className="nf-toolbar-title">Newsfeed</h1>
        </div>
        <div className="nf-empty">
          <span className="nf-empty-icon">🎪</span>
          <h2 className="nf-empty-title">No League Yet</h2>
          <p className="nf-empty-text">
            Join the Fantasy League to see what everyone is up to!
          </p>
          <Link to="/league" className="nf-empty-cta">Go to Fantasy League</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="newsfeed-page">
      <div className="nf-toolbar">
        <h1 className="nf-toolbar-title">Newsfeed</h1>
        <Link to="/league" className="nf-league-link">
          {league.name} &rsaquo;
        </Link>
      </div>

      <PullToRefresh onRefresh={refresh}>
        {error && (
          <div className="nf-error">
            <p className="nf-error-text">Failed to load feed</p>
            <button className="nf-retry-btn" onClick={refresh}>Retry</button>
          </div>
        )}

        {!error && items.length === 0 && (
          <div className="nf-empty">
            <span className="nf-empty-icon">📭</span>
            <h2 className="nf-empty-title">Nothing here yet</h2>
            <p className="nf-empty-text">
              Complete quests and submit content to populate the feed!
            </p>
          </div>
        )}

        {!error && items.length > 0 && (
          <div className="nf-feed">
            {items.map(item => (
              <FeedCard
                key={`${item.item_type}-${item.item_id}`}
                item={item}
                userReactions={userReactions}
                onReaction={handleReaction}
              />
            ))}

            {hasMore && (
              <div className="nf-load-more">
                <button
                  className="nf-load-more-btn"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}

            {!hasMore && items.length > 5 && (
              <div className="nf-end">You're all caught up!</div>
            )}
          </div>
        )}
      </PullToRefresh>
    </div>
  )
}

function FeedCard({ item, userReactions, onReaction }) {
  if (item.item_type === 'content') {
    return <ContentCard item={item} userReactions={userReactions} onReaction={onReaction} />
  }
  return <QuestCard item={item} />
}

function ContentCard({ item, userReactions, onReaction }) {
  const config = CONTENT_POINT_VALUES[item.content_type]
  const label = config?.label || item.content_type
  const icon = config?.icon || '📄'
  const hasOG = item.og_title || item.og_image
  const domain = getDomain(item.link_url)
  const isPlayerPicker = item.content_type === 'comment_engage'

  const reactionCounts = item.reaction_counts || {}
  const myReactions = userReactions[item.item_id] || new Set()

  return (
    <div className="nf-card content-card">
      <div className="nf-card-header">
        <div className="nf-avatar">{getInitials(item.user_name)}</div>
        <div className="nf-card-meta">
          <span className="nf-card-name">{item.user_name}</span>
          <span className="nf-card-team">{item.team_name}</span>
        </div>
        <span className="nf-card-time">{timeAgo(item.created_at)}</span>
      </div>

      <div className="nf-card-body">
        <p className="nf-card-action">
          {icon} <strong>{item.user_name?.split(' ')[0]}</strong> completed{' '}
          <strong>{label}</strong>
          <span className="nf-points-badge">+{item.points_value}</span>
        </p>

        {!isPlayerPicker && item.link_url && (
          hasOG ? (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="nf-og-preview"
            >
              {item.og_image && (
                <img
                  src={item.og_image}
                  alt=""
                  className="nf-og-image"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
              <div className="nf-og-info">
                {item.og_title && <p className="nf-og-title">{item.og_title}</p>}
                {item.og_description && <p className="nf-og-desc">{item.og_description}</p>}
                {domain && <span className="nf-og-domain">{domain}</span>}
              </div>
            </a>
          ) : (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="nf-link-fallback"
            >
              <span className="nf-link-icon">🔗</span>
              {domain || item.link_url}
            </a>
          )
        )}
      </div>

      <div className="nf-reactions">
        {REACTION_TYPES.map(({ type, emoji }) => {
          const count = reactionCounts[type] || 0
          const isActive = myReactions.has(type)
          return (
            <button
              key={type}
              className={`nf-reaction-btn ${isActive ? 'active' : ''}`}
              onClick={() => onReaction(item.item_id, type)}
            >
              <span className="nf-reaction-emoji">{emoji}</span>
              {count > 0 && <span className="nf-reaction-count">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuestCard({ item }) {
  const firstName = item.user_name?.split(' ')[0] || 'Player'

  return (
    <div className="nf-card quest-card">
      <div className="nf-card-header">
        <div className="nf-avatar">{getInitials(item.user_name)}</div>
        <div className="nf-card-meta">
          <span className="nf-card-name">{item.user_name}</span>
          <span className="nf-card-team">{item.team_name}</span>
        </div>
        <span className="nf-card-time">{timeAgo(item.created_at)}</span>
      </div>

      <div className="nf-card-body">
        <p className="nf-card-action">
          <strong>{firstName}</strong> completed a quest
          <span className="nf-points-badge">+{item.quest_points}</span>
        </p>
        <span className="nf-quest-label">
          {item.quest_category}
        </span>
      </div>
    </div>
  )
}
