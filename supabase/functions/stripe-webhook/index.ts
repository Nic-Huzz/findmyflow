import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

// Scale creator portal product ID — payments for this product grant plan_type 'creator'
const SCALE_PRODUCT_ID = 'prod_UsdZD0VH5q0wwe'

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Determine plan type from product metadata or line items
      let planType = session.metadata?.plan || 'pro'

      // For payment link purchases: detect Scale product from line items
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string, {
            expand: ['items.data.price.product'],
          })
          const hasScaleProduct = sub.items.data.some((item: any) => {
            const product = item.price.product
            const productId = typeof product === 'string' ? product : product.id
            return productId === SCALE_PRODUCT_ID
          })
          if (hasScaleProduct) planType = 'creator'
        } catch (e) {
          console.error('Failed to check subscription items:', e)
        }
      }

      // Resolve user: prefer metadata user ID, fall back to targeted email lookup
      let userId = session.metadata?.supabase_user_id
      if (!userId && session.customer_details?.email) {
        const { data: matchedUsers } = await supabase
          .rpc('get_user_id_by_email', { lookup_email: session.customer_details.email.toLowerCase() })
        if (matchedUsers?.[0]?.id) userId = matchedUsers[0].id
      }

      if (!userId) {
        // No matching Supabase user yet. Store by email so we can link later.
        console.log(`No Supabase user for ${session.customer_details?.email}. Storing pending subscription.`)
        await supabase.from('pending_subscriptions').upsert({
          email: session.customer_details?.email?.toLowerCase(),
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: (session.subscription as string) || null,
          plan_type: planType,
          status: 'active',
          created_at: new Date().toISOString(),
        }, { onConflict: 'email' }).then(({ error }) => {
          if (error) console.error('pending_subscriptions upsert failed:', error.message)
        })
        break
      }

      await supabase.from('user_subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: (session.subscription as string) || null,
        status: 'active',
        plan_type: planType,
        current_period_start: new Date().toISOString(),
        current_period_end: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (sub) {
        await supabase.from('user_subscriptions').update({
          status: subscription.status === 'active' ? 'active' : subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }).eq('user_id', sub.user_id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase.from('user_subscriptions').update({
        status: 'expired',
        updated_at: new Date().toISOString()
      }).eq('stripe_customer_id', customerId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
