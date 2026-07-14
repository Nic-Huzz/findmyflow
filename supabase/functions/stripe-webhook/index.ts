import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

// Scale product IDs — payments for either grant plan_type 'creator'
const SCALE_PRODUCT_IDS = ['prod_UsdZD0VH5q0wwe', 'prod_UsyctdcmpVwlCs']

const DMG_ARM64 = 'https://github.com/Nic-Huzz/findmyflow/releases/download/v1.0.0/Vibe-Rise-mac-arm64.dmg'
const DMG_X64 = 'https://github.com/Nic-Huzz/findmyflow/releases/download/v1.0.0/Vibe-Rise-mac-x64.dmg'
const PORTAL_URL = 'https://create.nichuzz.com/log-in?welcome=scale'
const NOTIFY_EMAIL = 'huzz@nichuzz.com'

async function sendScaleWelcomeEmail(email: string, resendApiKey: string) {
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#5e17eb,#E9A23B);padding:32px 30px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.2);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
          <span style="color:#fff;font-size:22px;font-weight:700;">S</span>
        </div>
        <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Welcome to Scale</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Your portal is ready</p>
      </div>

      <div style="background:#f9fafb;padding:30px;border-radius:0 0 16px 16px;">
        <p style="font-size:16px;line-height:1.6;color:#1a1a1a;margin:0 0 20px;">
          Your payment is confirmed. Here's how to access Scale:
        </p>

        <div style="background:white;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:16px;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#5e17eb;">Option 1: Web Portal (any device)</h3>
          <p style="margin:0 0 12px;font-size:14px;color:#555;line-height:1.5;">
            Sign in with this email at the creator portal. Works on any device, no download needed.
          </p>
          <a href="${PORTAL_URL}" style="display:inline-block;background:#5e17eb;color:white;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
            Open Scale Portal
          </a>
        </div>

        <div style="background:white;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin-bottom:16px;">
          <h3 style="margin:0 0 8px;font-size:15px;color:#E9A23B;">Option 2: Desktop App (Mac)</h3>
          <p style="margin:0 0 12px;font-size:14px;color:#555;line-height:1.5;">
            Download the desktop app for quick access from your toolbar.
          </p>
          <a href="${DMG_ARM64}" style="display:inline-block;background:#1a1a1a;color:white;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;margin-right:8px;">
            Apple Silicon (M1-M4)
          </a>
          <a href="${DMG_X64}" style="display:inline-block;background:#1a1a1a;color:white;padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;">
            Intel Mac
          </a>
        </div>

        <p style="font-size:13px;color:#888;margin:16px 0 0;line-height:1.5;">
          Questions? Reply to this email. I read every one.<br>
          Huzz
        </p>
      </div>
    </div>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Huzz <huzz@nichuzz.com>',
      to: email,
      subject: 'Welcome to Scale — your portal is ready',
      html,
    }),
  })
}

async function notifyHuzzNewSale(email: string, planType: string, resendApiKey: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Scale <huzz@nichuzz.com>',
      to: NOTIFY_EMAIL,
      subject: `New Scale sale: ${email}`,
      html: `<p><strong>${email}</strong> just purchased <strong>${planType}</strong>.</p><p>Time: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</p>`,
    }),
  })
}

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
            return SCALE_PRODUCT_IDS.includes(productId)
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

        // Send welcome email + notify Huzz (fire-and-forget)
        const resendKey = Deno.env.get('RESEND_API_KEY')
        if (resendKey && session.customer_details?.email) {
          sendScaleWelcomeEmail(session.customer_details.email, resendKey).catch(e => console.error('Welcome email failed:', e))
          notifyHuzzNewSale(session.customer_details.email, planType, resendKey).catch(e => console.error('Sale notify failed:', e))
        }
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
      }, { onConflict: 'user_id,plan_type' })

      // Send welcome email + notify Huzz (fire-and-forget)
      const resendKey2 = Deno.env.get('RESEND_API_KEY')
      if (resendKey2 && session.customer_details?.email) {
        sendScaleWelcomeEmail(session.customer_details.email, resendKey2).catch(e => console.error('Welcome email failed:', e))
        notifyHuzzNewSale(session.customer_details.email, planType, resendKey2).catch(e => console.error('Sale notify failed:', e))
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const subId = subscription.id

      await supabase.from('user_subscriptions').update({
        status: subscription.status === 'active' ? 'active' : subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }).eq('stripe_subscription_id', subId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase.from('user_subscriptions').update({
        status: 'expired',
        updated_at: new Date().toISOString()
      }).eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
