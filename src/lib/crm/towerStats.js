/**
 * Tower Stats Service
 * Fetches live stats for tower card displays
 */
import { supabase } from '../supabaseClient'
import { getEcosystemStats } from './ecosystemService'

/**
 * Get stats for Attract tower cards
 */
export async function getAttractStats(userId) {
  try {
    // Content stats - count posts this week from content_history
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: contentThisWeek } = await supabase
      .from('content_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())

    // Get drafts count
    const { count: draftsCount } = await supabase
      .from('content_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'draft')

    // Marketing tasks this week
    const { count: tasksThisWeek } = await supabase
      .from('marketing_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', weekAgo.toISOString().split('T')[0])

    // Pages stats
    const { data: pagesData } = await supabase
      .from('crm_pages')
      .select('status, visitors, conversions')
      .eq('user_id', userId)
      .neq('status', 'archived')

    const livePages = pagesData?.filter(p => p.status === 'live').length || 0
    const totalVisitors = pagesData?.reduce((sum, p) => sum + (p.visitors || 0), 0) || 0
    const totalConversions = pagesData?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0
    const avgConversion = totalVisitors > 0
      ? `${((totalConversions / totalVisitors) * 100).toFixed(1)}%`
      : '—'

    return {
      content: {
        thisWeek: contentThisWeek || 0,
        drafts: draftsCount || 0,
      },
      pages: {
        active: livePages,
        conversion: avgConversion,
      },
      coldOutreach: {
        sent: 0,
        replies: 0,
      },
      ads: {
        active: 0,
        spend: 0,
      },
    }
  } catch (err) {
    console.error('Error fetching attract stats:', err)
    return null
  }
}

/**
 * Get stats for Nurture tower cards
 */
export async function getNurtureStats(userId) {
  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Active deals from sales_deals table
    const { data: dealsData } = await supabase
      .from('sales_deals')
      .select('id, value, status')
      .eq('user_id', userId)
      .not('status', 'in', '("won","lost")')

    const activeDeals = dealsData?.length || 0
    const pipelineValue = dealsData?.reduce((sum, d) => sum + (d.value || 0), 0) || 0

    // Get new deals this week
    const { count: newDealsCount } = await supabase
      .from('sales_deals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString())

    // Won deals this month for ascension rate
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const { count: wonDeals } = await supabase
      .from('sales_deals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'won')
      .gte('actual_close_date', monthAgo.toISOString().split('T')[0])

    return {
      contacts: {
        total: 0, // Contacts table doesn't exist yet
        thisWeek: newDealsCount || 0,
      },
      email: {
        active: 0,
        openRate: '—',
      },
      pipeline: {
        activeDeals,
        pipelineValue,
      },
      warmOutreach: {
        toFollowUp: activeDeals, // Deals in pipeline need follow-up
      },
      ascension: {
        upsellRate: wonDeals > 0 ? `${wonDeals} won` : '—',
      },
    }
  } catch (err) {
    console.error('Error fetching nurture stats:', err)
    return null
  }
}

/**
 * Get stats for Tools tower cards
 */
export async function getToolsStats(userId) {
  try {
    // Funnel metrics for analytics - get most recent entry
    const { data: funnelData } = await supabase
      .from('funnel_metrics')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Format last report date
    let lastReport = null
    if (funnelData?.created_at) {
      const date = new Date(funnelData.created_at)
      const now = new Date()
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) lastReport = 'Today'
      else if (diffDays === 1) lastReport = '1 day ago'
      else if (diffDays < 7) lastReport = `${diffDays} days ago`
      else lastReport = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Script usage tracking
    const { count: scriptsUsed } = await supabase
      .from('script_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Implementation stats
    const { data: implData } = await supabase
      .from('offer_implementations')
      .select('id, status')
      .eq('user_id', userId)

    const inProgress = implData?.filter(i => i.status === 'in_progress').length || 0
    const completed = implData?.filter(i => i.status === 'completed').length || 0

    // Ecosystem stats
    const ecoStats = await getEcosystemStats(userId)

    return {
      ecosystem: {
        percent: ecoStats?.percent != null ? `${ecoStats.percent}%` : '0%',
      },
      analytics: {
        lastReport: lastReport || '—',
      },
      calculators: {
        saved: 0,
      },
      scripts: {
        used: scriptsUsed || 0,
      },
      implementations: {
        inProgress,
        completed,
      },
    }
  } catch (err) {
    console.error('Error fetching tools stats:', err)
    return null
  }
}
