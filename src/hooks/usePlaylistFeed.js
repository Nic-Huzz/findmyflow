/**
 * usePlaylistFeed — paginated public Play-List feed
 *
 * Mirrors useNewsfeed.js shape: items, loading, refresh, loadMore,
 * userReactions, toggleReaction (optimistic). Works for both anon and
 * authenticated viewers — toggleReaction no-ops for anon.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchFeed,
  toggleReaction as persistReaction,
  getUserReactionsForPosts,
} from '../lib/playlistFeedService'

const PAGE_SIZE = 20

export default function usePlaylistFeed(currentUserId = null) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const [userReactions, setUserReactions] = useState({})
  const offsetRef = useRef(0)

  const loadPage = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        offsetRef.current = 0
      } else {
        setLoadingMore(true)
      }

      const data = await fetchFeed({
        limit: PAGE_SIZE,
        offset: reset ? 0 : offsetRef.current,
      })

      setItems(prev => (reset ? data : [...prev, ...data]))
      offsetRef.current = (reset ? 0 : offsetRef.current) + data.length
      setHasMore(data.length === PAGE_SIZE)
      setError(null)

      if (currentUserId && data.length > 0) {
        const ids = data.map(p => p.id)
        const reactionMap = await getUserReactionsForPosts(currentUserId, ids)
        setUserReactions(prev => (reset ? reactionMap : { ...prev, ...reactionMap }))
      }
    } catch (err) {
      console.error('usePlaylistFeed error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [currentUserId])

  useEffect(() => {
    loadPage(true)
  }, [loadPage])

  const refresh = useCallback(() => loadPage(true), [loadPage])
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) loadPage(false)
  }, [loadPage, loadingMore, hasMore])

  const toggleReaction = useCallback(async (postId, reactionType) => {
    if (!currentUserId) return false // anon viewers cannot react

    // Optimistic update
    let added
    setUserReactions(prev => {
      const next = { ...prev }
      const set = new Set(next[postId] || [])
      if (set.has(reactionType)) {
        set.delete(reactionType)
        added = false
      } else {
        set.add(reactionType)
        added = true
      }
      next[postId] = set
      return next
    })

    setItems(prev => prev.map(item => {
      if (item.id !== postId) return item
      const counts = { ...(item.reaction_counts || {}) }
      if (added) {
        counts[reactionType] = (counts[reactionType] || 0) + 1
      } else {
        counts[reactionType] = Math.max(0, (counts[reactionType] || 1) - 1)
        if (counts[reactionType] === 0) delete counts[reactionType]
      }
      return { ...item, reaction_counts: counts }
    }))

    // Persist (rollback on failure)
    try {
      await persistReaction(postId, currentUserId, reactionType)
    } catch (err) {
      console.error('Reaction persist failed, rolling back:', err)
      setUserReactions(prev => {
        const next = { ...prev }
        const set = new Set(next[postId] || [])
        if (added) set.delete(reactionType)
        else set.add(reactionType)
        next[postId] = set
        return next
      })
      setItems(prev => prev.map(item => {
        if (item.id !== postId) return item
        const counts = { ...(item.reaction_counts || {}) }
        if (added) {
          counts[reactionType] = Math.max(0, (counts[reactionType] || 1) - 1)
          if (counts[reactionType] === 0) delete counts[reactionType]
        } else {
          counts[reactionType] = (counts[reactionType] || 0) + 1
        }
        return { ...item, reaction_counts: counts }
      }))
    }

    return added
  }, [currentUserId])

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    userReactions,
    toggleReaction,
  }
}
