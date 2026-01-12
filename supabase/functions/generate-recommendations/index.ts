/**
 * Generate Recommendations Edge Function
 *
 * Analyzes user data and generates AI-powered recommendations.
 * Can be triggered:
 * - Weekly via scheduled job
 * - On-demand via API call
 * - After significant events (deal closed, etc.)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Recommendation templates
const TEMPLATES = {
  low_lead_to_discovery: {
    category: 'funnel',
    priority: 'high',
    title: 'Lead qualification needs attention',
    action_text: 'View Sales Scripts',
    action_url: '/crm/scripts',
  },
  low_discovery_to_proposal: {
    category: 'funnel',
    priority: 'medium',
    title: 'Discovery calls not converting',
    action_text: 'View Discovery Scripts',
    action_url: '/crm/scripts',
  },
  low_proposal_to_close: {
    category: 'sales',
    priority: 'high',
    title: 'Proposals not closing',
    action_text: 'View Objection Scripts',
    action_url: '/crm/scripts',
  },
  price_objections: {
    category: 'pricing',
    priority: 'high',
    title: 'Price is costing you deals',
    action_text: 'Create Value Content',
    action_url: '/crm/implementations',
  },
  competitor_losses: {
    category: 'marketing',
    priority: 'medium',
    title: 'Losing deals to competitor',
    action_text: 'Create Comparison Post',
    action_url: '/crm/marketing',
  },
  near_capacity: {
    category: 'capacity',
    priority: 'high',
    title: "You're almost at capacity",
    action_text: 'Review Pricing',
    action_url: '/crm/ptuf',
  },
  win_streak: {
    category: 'marketing',
    priority: 'low',
    title: 'Create a case study from recent wins',
    action_text: 'Create Case Study',
    action_url: '/crm/implementations',
  },
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const body = await req.json().catch(() => ({}))
    const { user_id, all_users } = body

    // If all_users is true, process all active users (for scheduled job)
    if (all_users) {
      // Get users who have been active in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: activeUsers, error: usersError } = await supabase
        .from('user_stats')
        .select('user_id')
        .gte('updated_at', thirtyDaysAgo.toISOString())

      if (usersError) {
        throw new Error(`Error fetching active users: ${usersError.message}`)
      }

      const results = []
      for (const user of activeUsers || []) {
        const result = await generateForUser(supabase, user.user_id)
        results.push({ user_id: user.user_id, ...result })
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: results.length,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Single user mode
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await generateForUser(supabase, user_id)

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateForUser(supabase: any, userId: string) {
  const recommendations: any[] = []

  // 1. Analyze funnel health
  const funnelRecs = await analyzeFunnel(supabase, userId)
  recommendations.push(...funnelRecs)

  // 2. Analyze win/loss patterns
  const winLossRecs = await analyzeWinLoss(supabase, userId)
  recommendations.push(...winLossRecs)

  // 3. Analyze capacity
  const capacityRecs = await analyzeCapacity(supabase, userId)
  recommendations.push(...capacityRecs)

  // Dedupe and limit
  const uniqueRecs = recommendations.reduce((acc: any[], rec) => {
    if (!acc.find(r => r.title === rec.title)) {
      acc.push(rec)
    }
    return acc
  }, [])

  // Sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  uniqueRecs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Take top 5
  const topRecs = uniqueRecs.slice(0, 5)

  if (topRecs.length === 0) {
    return { generated: 0, message: 'No recommendations generated - user data insufficient' }
  }

  // Clear old pending recommendations
  await supabase
    .from('recommendations')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Set expiration (7 days)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Insert new recommendations
  const toInsert = topRecs.map(rec => ({
    user_id: userId,
    category: rec.category,
    priority: rec.priority,
    title: rec.title,
    description: rec.description,
    action_text: rec.action_text,
    action_url: rec.action_url,
    trigger_type: rec.trigger_type,
    trigger_data: rec.trigger_data,
    status: 'pending',
    expires_at: expiresAt.toISOString(),
  }))

  const { data, error } = await supabase
    .from('recommendations')
    .insert(toInsert)
    .select()

  if (error) {
    throw new Error(`Error saving recommendations: ${error.message}`)
  }

  return { generated: data.length, recommendations: data }
}

async function analyzeFunnel(supabase: any, userId: string) {
  const recommendations: any[] = []

  // Get current month's deals
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: deals } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  if (!deals || deals.length < 3) return recommendations

  // Calculate conversion rates
  const leads = deals.length
  const qualified = deals.filter((d: any) => ['discovery', 'proposal', 'won', 'lost'].includes(d.status)).length
  const proposals = deals.filter((d: any) => ['proposal', 'won', 'lost'].includes(d.status)).length
  const won = deals.filter((d: any) => d.status === 'won').length

  const leadToDiscovery = leads > 0 ? Math.round((qualified / leads) * 100) : 0
  const discoveryToProposal = qualified > 0 ? Math.round((proposals / qualified) * 100) : 0
  const proposalToWon = proposals > 0 ? Math.round((won / proposals) * 100) : 0

  if (leadToDiscovery < 30) {
    recommendations.push({
      ...TEMPLATES.low_lead_to_discovery,
      trigger_type: 'funnel_health',
      trigger_data: { rate: leadToDiscovery, threshold: 30 },
      description: `Only ${leadToDiscovery}% of your leads become qualified. Consider improving your lead follow-up speed or refining your qualification criteria.`,
    })
  }

  if (discoveryToProposal < 40 && qualified >= 3) {
    recommendations.push({
      ...TEMPLATES.low_discovery_to_proposal,
      trigger_type: 'funnel_health',
      trigger_data: { rate: discoveryToProposal, threshold: 40 },
      description: `${discoveryToProposal}% of discovery calls lead to proposals. Review your discovery process - are you identifying true fit and building enough trust?`,
    })
  }

  return recommendations
}

async function analyzeWinLoss(supabase: any, userId: string) {
  const recommendations: any[] = []

  // Get deal outcomes from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: outcomes } = await supabase
    .from('deal_outcomes')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (!outcomes || outcomes.length < 3) return recommendations

  const losses = outcomes.filter((o: any) => o.outcome === 'lost')
  const wins = outcomes.filter((o: any) => o.outcome === 'won')

  // Check price factor
  const priceIssues = losses.filter((l: any) => l.price_factor).length
  if (priceIssues >= 3) {
    recommendations.push({
      ...TEMPLATES.price_objections,
      trigger_type: 'win_loss_pattern',
      trigger_data: { count: priceIssues },
      description: `${priceIssues} recent deals lost to price objections. Consider creating ROI content or adjusting your value presentation.`,
    })
  }

  // Check competitor mentions
  const competitors = losses
    .filter((l: any) => l.competitor_mentioned)
    .map((l: any) => l.competitor_mentioned)

  if (competitors.length >= 2) {
    const topCompetitor = competitors[0]
    const count = competitors.filter(c => c === topCompetitor).length

    recommendations.push({
      ...TEMPLATES.competitor_losses,
      trigger_type: 'competitor',
      trigger_data: { competitor: topCompetitor, count },
      title: `Losing deals to ${topCompetitor}`,
      description: `You've lost ${count} deals to ${topCompetitor}. Create comparison content highlighting your advantages.`,
    })
  }

  // Celebrate wins
  if (wins.length >= 3) {
    const topWinReason = wins[0]?.primary_reason || 'value'
    recommendations.push({
      ...TEMPLATES.win_streak,
      trigger_type: 'win_loss_pattern',
      trigger_data: { wins: wins.length, reason: topWinReason },
      description: `You've won ${wins.length} deals recently! Turn these wins into a case study or testimonial.`,
    })
  }

  return recommendations
}

async function analyzeCapacity(supabase: any, userId: string) {
  const recommendations: any[] = []

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('current_clients, max_clients')
    .eq('user_id', userId)
    .single()

  if (!profile || !profile.max_clients) return recommendations

  const utilization = profile.current_clients / profile.max_clients

  if (utilization >= 0.8) {
    recommendations.push({
      ...TEMPLATES.near_capacity,
      trigger_type: 'capacity',
      trigger_data: {
        current: profile.current_clients,
        max: profile.max_clients,
        utilization: Math.round(utilization * 100)
      },
      description: `You have ${profile.current_clients} of ${profile.max_clients} client slots filled. Consider raising prices or planning for team expansion.`,
    })
  }

  return recommendations
}
