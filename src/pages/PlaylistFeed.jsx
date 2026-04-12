/**
 * PlaylistFeed — public Play-List newsfeed page.
 *
 * Anonymous-readable. Shows wins from the 100-day Play-List Challenge,
 * with FeedSignupCTA cards injected periodically for conversion.
 * Authenticated viewers can react. Infinite scroll via IntersectionObserver.
 */
import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/AuthProvider'
import usePlaylistFeed from '../hooks/usePlaylistFeed'
import FeedCard from '../components/playlist/FeedCard'
import FeedSignupCTA from '../components/playlist/FeedSignupCTA'
import './PlaylistFeed.css'

const CTA_INTERVAL = 5

export default function PlaylistFeed() {
  const { user } = useAuth()
  const isAnon = !user
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    userReactions,
    toggleReaction,
  } = usePlaylistFeed(user?.id || null)

  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  return (
    <div className="pf-page">
      <header className="pf-header">
        <div className="pf-eyebrow">100-Day Play-List Challenge</div>
        <h1 className="pf-title">Play-List Feed</h1>
        <p className="pf-subtitle">
          Real wins from people discovering their courage, one challenge at a time.
        </p>
        {isAnon && (
          <a href="/log-in" className="pf-cta-btn">Start your 100 days</a>
        )}
      </header>

      <main className="pf-main">
        {loading && items.length === 0 && (
          <div className="pf-loading">Loading wins...</div>
        )}

        {error && !loading && (
          <div className="pf-error">Couldn't load the feed: {error}</div>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="pf-empty">
            No wins shared yet. Be the first.
          </div>
        )}

        {items.map((post, idx) => (
          <div key={post.id}>
            <FeedCard
              post={post}
              userReactions={userReactions[post.id] || new Set()}
              onReact={toggleReaction}
              isAnon={isAnon}
            />
            {isAnon && (idx + 1) % CTA_INTERVAL === 0 && <FeedSignupCTA />}
          </div>
        ))}

        <div ref={sentinelRef} />

        {loadingMore && <div className="pf-loading-more">Loading more...</div>}

        {!hasMore && items.length > 0 && (
          <div className="pf-end">You've reached the end · {items.length} wins</div>
        )}
      </main>
    </div>
  )
}
