import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

/**
 * Content Score formula:
 * 1. Skip Rate Gate: >35% = score 0 (hook failure)
 * 2. WES = (likes x 1) + (comments x 2) + (saves x 3) + (shares x 4)
 * 3. Retention Multiplier (avg_watch_time in ms):
 *    >8s = 1.5x | 5-8s = 1.0x | 3-5s = 0.6x | <3s = 0.3x
 * 4. Score = (WES / views) x multiplier x 1000
 */
function computeContentScore(reel) {
  const skipRate = reel.skip_rate !== null ? Number(reel.skip_rate) : null
  const avgWatch = reel.avg_watch_time !== null ? Number(reel.avg_watch_time) / 1000 : null // ms → s
  const views = reel.views || 0

  // Gate: skip rate > 35% = hook failure
  const hookFailed = skipRate !== null && skipRate > 35

  // WES
  const wes = (reel.like_count || 0) * 1
    + (reel.comments_count || 0) * 2
    + (reel.saves || 0) * 3
    + (reel.shares || 0) * 4

  if (views === 0 || wes === 0) return { score: 0, wes, hookFailed, retentionMult: null }

  // Retention multiplier
  let retentionMult = 1.0
  if (avgWatch !== null) {
    if (avgWatch > 8) retentionMult = 1.5
    else if (avgWatch >= 5) retentionMult = 1.0
    else if (avgWatch >= 3) retentionMult = 0.6
    else retentionMult = 0.3
  }

  const raw = (wes / views) * retentionMult * 1000
  const score = hookFailed ? 0 : Math.round(raw * 10) / 10

  return { score, wes, hookFailed, retentionMult }
}

export default function useContentIntel(refreshKey) {
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
      .select('id, ig_media_id, caption, media_type, media_product_type, thumbnail_url, permalink, posted_at, like_count, comments_count, shares, saves, reach, views, skip_rate, avg_watch_time, total_watch_time, ai_analysis, followers_gained, profile_visits')
      .eq('user_id', user.id)
      .in('media_product_type', ['REELS', 'VIDEO'])
      .order('posted_at', { ascending: false })
      .limit(50)

    if (data) setReels(data)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadReels() }, [loadReels, refreshKey])

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

    // Outlier stats: count posts 2x+ above rolling average score
    const allScores = reels.map(r => computeContentScore(r))
    const validScores = allScores.map(s => s.score).filter(s => s > 0)
    const avgScore = validScores.length >= 3
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : null
    const outlierCount = avgScore
      ? validScores.filter(s => s >= avgScore * 2).length
      : 0

    // Top followers-gained post
    const topFollowersPost = reels
      .filter(r => (r.followers_gained || 0) > 0)
      .sort((a, b) => (b.followers_gained || 0) - (a.followers_gained || 0))[0] || null

    return {
      bestHook,
      bestHookMultiplier: multiplier,
      bestContent,
      analyzedCount: analyzed.length,
      totalCount: reels.length,
      outlierCount,
      avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
      topFollowersPost,
    }
  }, [reels])

  // Compute scores, outlier ratios, and sort/filter
  const sortedReels = useMemo(() => {
    // Score ALL reels first (before filtering) to get a true rolling average
    const allScored = reels.map(r => ({ ...r, _score: computeContentScore(r) }))

    // Compute rolling average from non-zero, non-hook-failed scores
    const validScores = allScored
      .map(r => r._score.score)
      .filter(s => s > 0)
    const avgScore = validScores.length >= 3
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : null

    // Attach outlier ratio to each reel
    const withOutlier = allScored.map(r => ({
      ...r,
      _score: {
        ...r._score,
        outlierRatio: avgScore && r._score.score > 0
          ? Math.round((r._score.score / avgScore) * 10) / 10
          : null,
        avgScore,
      },
    }))

    // Now apply hook type filter
    const filtered = filterHookType
      ? withOutlier.filter(r => r.ai_analysis?.hook_type === filterHookType)
      : withOutlier

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score': return (b._score.score || 0) - (a._score.score || 0)
        case 'outlier': return (b._score.outlierRatio || 0) - (a._score.outlierRatio || 0)
        case 'views': return (b.views || 0) - (a.views || 0)
        case 'followers': return (b.followers_gained || 0) - (a.followers_gained || 0)
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
