import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { return_url } = await req.json()

    // Find or create Stripe customer
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = existingSub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      })
      customerId = customer.id
    }

    // Create checkout session
    // NOTE: mode: 'payment' = one-time purchase = lifetime access (no expiry check runs).
    // To switch to recurring: change to 'subscription', ensure STRIPE_PRICE_ID points to a
    // recurring price, and the stripe-webhook handler's subscription.updated/deleted events
    // will then fire to manage expiry. Until then those webhook handlers are dormant.
    // TODO: Replace STRIPE_PRICE_ID with actual Stripe Price ID once pricing is decided
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price: Deno.env.get('STRIPE_PRICE_ID'),
        quantity: 1,
      }],
      allow_promotion_codes: true,
      success_url: `${return_url}?payment=success`,
      cancel_url: `${return_url}?payment=cancelled`,
      metadata: { supabase_user_id: user.id }
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ message: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
