/**
 * useBrandPulse.js — Composite brand growth metric
 *
 * Three signals, weighted:
 *   Reach trend (50%) — Are more people seeing you?
 *   Engagement rate trend (30%) — Is your content landing?
 *   Follower growth rate (20%) — Is your audience compounding?
 *
 * Compares this week (0-6 days ago) vs last week (7-13 days ago).
 * 7-day rolling average smooths viral spikes.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

// Score a % change into a -1 to +1 band
function scoreTrend(pctChange) {
  if (pctChange > 0.10) return 1.0
  if (pctChange > 0.05) return 0.7
  if (pctChange > 0.01) return 0.4
  if (pctChange > -0.01) return 0
  if (pctChange > -0.05) return -0.4
  if (pctChange > -0.10) return -0.7
  return -1.0
}

function trendDirection(pctChange) {
  if (pctChange > 0.01) return 'up'
  if (pctChange < -0.01) return 'down'
  return 'steady'
}

function formatPct(val) {
  if (val === null || val === undefined) return '—'
  const pct = (val * 100).toFixed(1)
  return val > 0 ? `+${pct}%` : `${pct}%`
}

export default function useBrandPulse() {
  const { user } = useAuth()
  const [data, setData] = useState({
    score: null,
    label: null,
    color: null,
    signals: null,
    hasEnoughData: false,
    isConnected: false,
    lastSynced: null,
    loading: true,
  })

  const calculate = useCallback(async () => {
    if (!user?.id) return

    // Check if Instagram is connected
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('status, last_synced_at')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .single()

    if (!integration || integration.status !== 'active') {
      setData(prev => ({ ...prev, loading: false, isConnected: false }))
      return
    }

    // Fetch last 14 days of metrics
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: metrics } = await supabase
      .from('instagram_metrics')
      .select('date, followers, reach, total_interactions, views')
      .eq('user_id', user.id)
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (!metrics || metrics.length < 7) {
      setData(prev => ({
        ...prev,
        loading: false,
        isConnected: true,
        hasEnoughData: false,
        lastSynced: integration.last_synced_at,
      }))
      return
    }

    // Split into two periods
    const midpoint = metrics.length >= 14
      ? Math.floor(metrics.length / 2)
      : Math.min(7, metrics.length - 1)

    const lastWeek = metrics.slice(0, midpoint)
    const thisWeek = metrics.slice(midpoint)

    // Average per period
    const avg = (arr, key) => {
      const vals = arr.map(m => m[key]).filter(v => v !== null && v !== undefined)
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }

    const thisReach = avg(thisWeek, 'reach')
    const lastReach = avg(lastWeek, 'reach')
    const thisInteractions = avg(thisWeek, 'total_interactions')
    const lastInteractions = avg(lastWeek, 'total_interactions')

    // Engagement rate = interactions / reach
    const thisEngRate = thisReach > 0 ? thisInteractions / thisReach : 0
    const lastEngRate = lastReach > 0 ? lastInteractions / lastReach : 0

    // Follower growth (latest vs earliest in window)
    const latestFollowers = thisWeek[thisWeek.length - 1]?.followers || 0
    const earliestFollowers = lastWeek[0]?.followers || latestFollowers

    // Calculate trends (avoid division by zero)
    const reachTrend = lastReach > 0 ? (thisReach - lastReach) / lastReach : 0
    const engTrend = lastEngRate > 0 ? (thisEngRate - lastEngRate) / lastEngRate : 0
    const followerGrowth = earliestFollowers > 0
      ? (latestFollowers - earliestFollowers) / earliestFollowers
      : 0

    // Weighted composite score
    const reachScore = scoreTrend(reachTrend)
    const engScore = scoreTrend(engTrend)
    const followerScore = scoreTrend(followerGrowth)

    const composite = (reachScore * 0.5) + (engScore * 0.3) + (followerScore * 0.2)

    // Map -1..+1 to 0..10
    const score = Math.round(((composite + 1) / 2) * 10)

    let label, color
    if (score >= 7) { label = 'Growing'; color = '#10b981' }
    else if (score >= 4) { label = 'Steady'; color = '#E9A23B' }
    else { label = 'Declining'; color = '#ef4444' }

    // Check for "paused" state (no posts this week)
    const hasRecentData = thisWeek.some(m => m.reach !== null && m.reach > 0)
    if (!hasRecentData) {
      label = 'Paused'
      color = 'rgba(255,255,255,0.3)'
    }

    setData({
      score,
      label,
      color,
      signals: {
        reach: {
          value: Math.round(thisReach),
          trend: formatPct(reachTrend),
          direction: trendDirection(reachTrend),
        },
        engagement: {
          value: `${(thisEngRate * 100).toFixed(1)}%`,
          trend: formatPct(engTrend),
          direction: trendDirection(engTrend),
        },
        followers: {
          value: latestFollowers,
          trend: `${latestFollowers - earliestFollowers >= 0 ? '+' : ''}${latestFollowers - earliestFollowers}`,
          direction: trendDirection(followerGrowth),
        },
      },
      hasEnoughData: true,
      isConnected: true,
      lastSynced: integration.last_synced_at,
      loading: false,
    })
  }, [user?.id])

  useEffect(() => {
    calculate()
  }, [calculate])

  return { ...data, refresh: calculate }
}
