/**
 * useReachScore.js — Creator Reach score (0-10)
 *
 * "Are you running the machine?"
 *
 * 10 rolling 7-day binary checks × 1 point each.
 * Uses the same rolling window pattern as useCapacityScore.js.
 * Fluctuates weekly — rest weeks = low Reach, launch weeks = high.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const REACH_ITEMS = [
  { key: 'content', label: 'Posted content', route: '/create/growth' },
  { key: 'checklist', label: 'Completed checklist items', route: null, expRoute: (id) => `/create/experience/${id}?tab=pre` },
  { key: 'outreach', label: 'Reached out to someone', route: null, expRoute: (id) => `/create/experience/${id}?tab=pre` },
  { key: 'wahoo', label: 'Completed a courage challenge', route: '/create/plays' },
  { key: 'experience', label: 'Delivered an experience', route: '/create/experience/new' },
  { key: 'tasks', label: 'Completed tasks', route: null, expRoute: (id) => `/create/experience/${id}?tab=pre` },
  { key: 'contacts_added', label: 'Added contacts to an experience', route: null, expRoute: (id) => `/create/experience/${id}?tab=pre` },
  { key: 'reflection', label: 'Logged a 3% reflection', route: null, expRoute: (id) => `/create/experience/${id}?tab=post` },
  { key: 'pipeline_metric', label: 'Updated pipeline metrics', route: null, expRoute: (id) => `/create/experience/${id}` },
  { key: 'instagram', label: 'Posted on Instagram', route: null },
]

export { REACH_ITEMS }

export default function useReachScore(userId) {
  const [data, setData] = useState({
    reach: null,
    breakdown: [],
    loading: true,
  })

  const calculate = useCallback(async () => {
    if (!userId) return

    try {
      // Rolling 7-day window
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const since = sevenDaysAgo.toISOString()

      const results = await Promise.all([
        // 1. Content posted
        supabase.from('content_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('status', 'posted')
          .gte('posted_at', since),

        // 2. Checklist items completed
        supabase.from('experience_checklist_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('completed', true)
          .gte('completed_at', since),

        // 3. Outreach done
        supabase.from('crm_contacts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('outreach_status', ['reached_out', 'in_conversation', 'meeting_booked'])
          .gte('updated_at', since),

        // 4. Wahoo completed
        supabase.from('groan_challenges')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('status', 'completed')
          .gte('completed_at', since),

        // 5. Experience delivered
        supabase.from('experiences')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('status', 'completed')
          .gte('updated_at', since),

        // 6. Tasks completed
        supabase.from('execute_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('completed', true)
          .gte('completed_at', since)
          .then(res => res)
          .catch(() => ({ count: 0 })),

        // 7. Contacts added to experiences
        supabase.from('contact_experiences')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', since),

        // 8. 3% reflection logged
        supabase.from('experiences')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('three_percent_note', 'is', null)
          .gte('updated_at', since),

        // 9. Pipeline metric logged (may not exist yet — fail gracefully)
        supabase.from('pipeline_metrics')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', since)
          .then(res => res)
          .catch(() => ({ count: 0 })),

        // 10. Instagram post (may not exist yet — fail gracefully)
        supabase.from('instagram_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('posted_at', since)
          .then(res => res)
          .catch(() => ({ count: 0 })),
      ])

      // Fetch active experience for dynamic routing
      const { data: activeExp } = await supabase
        .from('experiences')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'upcoming')
        .order('experience_date', { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle()

      const activeExpId = activeExp?.id
      const counts = results.map(r => r.count || 0)

      const breakdown = REACH_ITEMS.map((item, i) => ({
        ...item,
        active: counts[i] > 0,
        count: counts[i],
        route: item.route || (item.expRoute && activeExpId ? item.expRoute(activeExpId) : '/create/experiences'),
      }))

      const reach = breakdown.filter(item => item.active).length

      setData({ reach, breakdown, loading: false })

    } catch (err) {
      console.error('useReachScore error:', err)
      setData(prev => ({ ...prev, loading: false }))
    }
  }, [userId])

  useEffect(() => {
    calculate()
  }, [calculate])

  return { ...data, refresh: calculate }
}
