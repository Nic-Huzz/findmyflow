import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

export default function useContentIntel() {
  const { user } = useAuth()
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, currentId: null })
  const [sortBy, setSortBy] = useState('posted_at')
  const [filterHookType, setFilterHookType] = useState(null)

  const loadReels = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('instagram_posts')
      .select('id, ig_media_id, caption, media_type, media_product_type, thumbnail_url, permalink, posted_at, like_count, comments_count, shares, saves, reach, views, skip_rate, avg_watch_time, total_watch_time, ai_analysis')
      .eq('user_id', user.id)
      .in('media_product_type', ['REELS', 'VIDEO'])
      .order('posted_at', { ascending: false })
      .limit(50)

    if (data) setReels(data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadReels() }, [loadReels])

  const analyzeReel = useCallback(async (igMediaId) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-instagram-post`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ig_media_id: igMediaId }),
      }
    )

    const result = await res.json()

    if (result.success) {
      setReels(prev => prev.map(r =>
        r.ig_media_id === igMediaId ? { ...r, ai_analysis: result.analysis } : r
      ))
    }

    return result
  }, [])

  const analyzeAll = useCallback(async () => {
    const unanalyzed = reels.filter(r => !r.ai_analysis)
    if (unanalyzed.length === 0) return

    setAnalyzing(true)
    setProgress({ current: 0, total: unanalyzed.length, currentId: null })

    for (let i = 0; i < unanalyzed.length; i++) {
      const reel = unanalyzed[i]
      setProgress({ current: i + 1, total: unanalyzed.length, currentId: reel.ig_media_id })
      try {
        await analyzeReel(reel.ig_media_id)
      } catch (e) {
        console.warn(`Analysis failed for ${reel.ig_media_id}:`, e)
      }
    }

    setAnalyzing(false)
    setProgress({ current: 0, total: 0, currentId: null })
  }, [reels, analyzeReel])

  const unanalyzedCount = useMemo(() =>
    reels.filter(r => !r.ai_analysis).length
  , [reels])

  // Compute patterns from analyzed reels
  const patterns = useMemo(() => {
    const analyzed = reels.filter(r => r.ai_analysis)
    if (analyzed.length < 3) return null

    // Group by hook_type, compute avg views
    const hookGroups = {}
    const contentGroups = {}
    const overallAvgViews = analyzed.reduce((s, r) => s + (r.views || 0), 0) / analyzed.length

    for (const r of analyzed) {
      const a = r.ai_analysis
      if (!a) continue

      // Hook type performance
      const ht = a.hook_type
      if (ht) {
        if (!hookGroups[ht]) hookGroups[ht] = { views: [], saves: [], count: 0 }
        hookGroups[ht].views.push(r.views || 0)
        hookGroups[ht].saves.push(r.saves || 0)
        hookGroups[ht].count++
      }

      // Content type performance
      const ct = a.content_type
      if (ct) {
        if (!contentGroups[ct]) contentGroups[ct] = { views: [], saves: [], count: 0 }
        contentGroups[ct].views.push(r.views || 0)
        contentGroups[ct].saves.push(r.saves || 0)
        contentGroups[ct].count++
      }
    }

    // Find best hook type by avg views
    let bestHook = null
    let bestHookAvg = 0
    for (const [type, data] of Object.entries(hookGroups)) {
      if (data.count < 2) continue
      const avg = data.views.reduce((a, b) => a + b, 0) / data.count
      if (avg > bestHookAvg) {
        bestHook = type
        bestHookAvg = avg
      }
    }

    // Find best content type by avg saves
    let bestContent = null
    let bestContentAvg = 0
    for (const [type, data] of Object.entries(contentGroups)) {
      if (data.count < 2) continue
      const avg = data.saves.reduce((a, b) => a + b, 0) / data.count
      if (avg > bestContentAvg) {
        bestContent = type
        bestContentAvg = avg
      }
    }

    const multiplier = overallAvgViews > 0 ? (bestHookAvg / overallAvgViews).toFixed(1) : null

    return {
      bestHook,
      bestHookMultiplier: multiplier,
      bestContent,
      analyzedCount: analyzed.length,
      totalCount: reels.length,
    }
  }, [reels])

  // Sort and filter
  const sortedReels = useMemo(() => {
    let filtered = filterHookType
      ? reels.filter(r => r.ai_analysis?.hook_type === filterHookType)
      : reels

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'views': return (b.views || 0) - (a.views || 0)
        case 'skip_rate': return (a.skip_rate ?? 100) - (b.skip_rate ?? 100)
        case 'avg_watch_time': return (b.avg_watch_time || 0) - (a.avg_watch_time || 0)
        case 'engagement': {
          const engA = ((a.like_count || 0) + (a.comments_count || 0) + (a.shares || 0) + (a.saves || 0)) / Math.max(a.reach || 1, 1)
          const engB = ((b.like_count || 0) + (b.comments_count || 0) + (b.shares || 0) + (b.saves || 0)) / Math.max(b.reach || 1, 1)
          return engB - engA
        }
        default: return new Date(b.posted_at) - new Date(a.posted_at)
      }
    })

    return sorted
  }, [reels, sortBy, filterHookType])

  return {
    reels: sortedReels,
    loading,
    analyzing,
    progress,
    unanalyzedCount,
    patterns,
    sortBy,
    setSortBy,
    filterHookType,
    setFilterHookType,
    analyzeReel,
    analyzeAll,
    reload: loadReels,
  }
}
