import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { userId, title, body, url, tag } = await req.json()

    // Validate required fields
    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: 'userId and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all push subscriptions for this user
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL')

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Import web-push library
    const webpush = await import('https://esm.sh/web-push@3.6.6')

    // Configure web-push
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: body || '',
      icon: '/icon-192.png',
      badge: '/badge-72x72.png',
      tag: tag || 'default',
      url: url || '/',
      timestamp: Date.now()
    })

    // Send notifications to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          }

          await webpush.sendNotification(pushSubscription, payload)
          return { success: true, endpoint: subscription.endpoint }
        } catch (error: any) {
          console.error('Error sending to subscription:', error)

          // If subscription is invalid/expired, delete it from database
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint)
          }

          return { success: false, endpoint: subscription.endpoint, error: error.message }
        }
      })
    )

    // Count successes and failures
    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - sent

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
