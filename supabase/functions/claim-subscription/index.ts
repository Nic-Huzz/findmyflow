import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

/**
 * claim-subscription — promotes a pending_subscriptions row to user_subscriptions.
 * Called client-side after login when no existing subscription is found.
 * Uses service role so RLS doesn't block the upsert.
 * Security: matches on the authenticated user's email only.
 */
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Authenticate the caller
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') || req.headers.get('apikey') || ''
  )
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (authErr || !user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Check for unclaimed pending subscription matching this email
  const { data: pending } = await supabase
    .from('pending_subscriptions')
    .select('*')
    .eq('email', user.email.toLowerCase())
    .is('claimed_by', null)
    .maybeSingle()

  if (!pending) {
    return new Response(JSON.stringify({ claimed: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Atomically claim: only succeeds if still unclaimed (prevents race between tabs)
  const { data: claimResult } = await supabase
    .from('pending_subscriptions')
    .update({ claimed_by: user.id, claimed_at: new Date().toISOString() })
    .eq('id', pending.id)
    .is('claimed_by', null)
    .select('id')

  if (!claimResult?.length) {
    // Another tab/request won the race — check if we already have a subscription
    return new Response(JSON.stringify({ claimed: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Promote to user_subscriptions (service role bypasses RLS)
  const { error: upsertErr } = await supabase.from('user_subscriptions').upsert({
    user_id: user.id,
    stripe_customer_id: pending.stripe_customer_id,
    stripe_subscription_id: pending.stripe_subscription_id,
    status: pending.status,
    plan_type: pending.plan_type,
    current_period_start: new Date().toISOString(),
    current_period_end: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (upsertErr) {
    console.error('Claim upsert failed:', upsertErr.message)
    return new Response(JSON.stringify({ error: 'Failed to claim' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ claimed: true, plan: pending.plan_type }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
