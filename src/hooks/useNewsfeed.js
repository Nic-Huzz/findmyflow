/**
 * useNewsfeed — paginated activity feed for Fantasy League
 *
 * Fetches mixed feed of quest completions + approved content via RPC.
 * Supports pull-to-refresh and infinite scroll.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { getActivityFeed, getUserReactions } from '../lib/league/leagueService'

const PAGE_SIZE = 20

export default function useNewsfeed(leagueId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const [userReactions, setUserReactions] = useState({}) // { submissionId: Set(['cheer']) }
  const offsetRef = useRef(0)

  const fetchFeed = useCallback(async (reset = false) => {
    if (!leagueId) {
      setLoading(false)
      return
    }

    try {
      if (reset) {
        setLoading(true)
        offsetRef.current = 0
      } else {
        setLoadingMore(true)
      }

      const data = await getActivityFeed(leagueId, {
        limit: PAGE_SIZE,
        offset: reset ? 0 : offsetRef.current,
      })

      if (reset) {
        setItems(data)
      } else {
        setItems(prev => [...prev, ...data])
      }

      offsetRef.current = (reset ? 0 : offsetRef.current) + data.length
      setHasMore(data.length === PAGE_SIZE)
      setError(null)

      // Fetch user's own reactions for content items
      const contentIds = data
        .filter(item => item.item_type === 'content')
        .map(item => item.item_id)

      if (contentIds.length > 0) {
        try {
          const reactions = await getUserReactions(contentIds)
          const reactionMap = {}
          reactions.forEach(r => {
            if (!reactionMap[r.submission_id]) {
              reactionMap[r.submission_id] = new Set()
            }
            reactionMap[r.submission_id].add(r.reaction_type)
          })
          setUserReactions(prev => reset ? reactionMap : { ...prev, ...reactionMap })
        } catch {
          // Non-critical — reactions just won't show as "own"
        }
      }
    } catch (err) {
      console.error('Error fetching activity feed:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [leagueId])

  // Initial load
  useEffect(() => {
    fetchFeed(true)
  }, [fetchFeed])

  const refresh = useCallback(() => fetchFeed(true), [fetchFeed])
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchFeed(false)
    }
  }, [fetchFeed, loadingMore, hasMore])

  // Update local reaction state optimistically
  // Returns true if reaction was added, false if removed
  const toggleReaction = useCallback((submissionId, reactionType) => {
    let added

    setUserReactions(prev => {
      const next = { ...prev }
      if (!next[submissionId]) {
        next[submissionId] = new Set()
      } else {
        next[submissionId] = new Set(next[submissionId])
      }

      if (next[submissionId].has(reactionType)) {
        next[submissionId].delete(reactionType)
        added = false
      } else {
        next[submissionId].add(reactionType)
        added = true
      }
      return next
    })

    // Update reaction_counts using the toggle direction determined above
    setItems(prev => prev.map(item => {
      if (item.item_id !== submissionId) return item
      const counts = { ...(item.reaction_counts || {}) }
      if (added) {
        counts[reactionType] = (counts[reactionType] || 0) + 1
      } else {
        counts[reactionType] = Math.max(0, (counts[reactionType] || 1) - 1)
        if (counts[reactionType] === 0) delete counts[reactionType]
      }
      return { ...item, reaction_counts: counts }
    }))

    return added
  }, [])

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
