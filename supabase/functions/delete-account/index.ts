import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user's JWT
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401)
    }

    const userId = user.id

    // Service role client for deletion operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete user data from all tables (order matters for foreign keys)
    const tables = [
      'league_content_reactions',
      'league_content_submissions',
      'fantasy_team_members',
      'fantasy_teams',
      'groan_proof',
      'groan_contract_evidence',
      'groan_outcomes',
      'groan_reflections',
      'groan_streaks',
      'groan_user_preferences',
      'groan_challenges',
      'quest_completions',
      'milestone_completions',
      'boss_fight_sessions',
      'user_level_progress',
      'challenge_instances',
      'nervous_system_checkins',
      'nervous_system_responses',
      'healing_compass_responses',
      'founder_dna_results',
      'founder_dna_sessions',
      'quiz_results',
      'scope_map_results',
      'flow_sessions',
      'flow_entries',
      'nikigai_clusters',
      'nikigai_responses',
      'nikigai_key_outcomes',
      'persona_profiles',
      'lead_flow_profiles',
      'attraction_offer_assessments',
      'upsell_assessments',
      'downsell_assessments',
      'continuity_assessments',
      'leads_assessments',
      'lead_magnet_assessments',
      'offer_builder_assessments',
      'funnel_metrics',
      'zarlo_conversations',
      'content_history',
      'crm_email_steps',
      'crm_email_sequences',
      'sales_deals',
      'sales_scripts',
      'script_usage_log',
      'crm_contacts',
      'crm_pages',
      'ecosystem_system_progress',
      'offer_implementations',
      'user_projects',
      'notification_preferences',
      'push_subscriptions',
      'user_subscriptions',
      'creator_interest',
      'user_stage_progress',
    ]

    const failedTables: string[] = []
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId)
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        // PGRST116 = no rows found, 42P01 = table doesn't exist — both are fine
        failedTables.push(table)
      }
    }

    // Only delete the auth user if no critical table deletions failed
    if (failedTables.length > 0) {
      return jsonResponse({ error: 'Failed to delete data from some tables', failedTables }, 500)
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteError) {
      return jsonResponse({ error: 'Failed to delete account' }, 500)
    }

    return jsonResponse({ success: true })
  } catch (err) {
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
