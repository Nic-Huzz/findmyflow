import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3.1'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // This is called by Composio after OAuth completes (GET redirect)
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const connectedAccountId = url.searchParams.get('connected_account_id')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Resolve user_id from the pending integration row (not from query params — untrusted)
  let userId: string | null = null
  if (connectedAccountId) {
    const { data: pending } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('composio_connection_id', connectedAccountId)
      .eq('platform', 'instagram')
      .single()
    userId = pending?.user_id || null
  }

  // Determine redirect target
  const appUrl = Deno.env.get('APP_URL') || 'https://create.nichuzz.com'

  if (status !== 'success' || !connectedAccountId || !userId) {
    // Redirect to app with error
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/create?ig_connect=error` },
    })
  }

  try {
    // Fetch the connected account details from Composio to get IG username
    const accountRes = await fetch(
      `${COMPOSIO_BASE}/connected_accounts/${connectedAccountId}`,
      { headers: { 'x-api-key': COMPOSIO_API_KEY! } }
    )

    let platformUsername = null
    let platformUserId = null

    if (accountRes.ok) {
      const accountData = await accountRes.json()
      // Try to extract IG info from the connection metadata
      platformUsername = accountData.metadata?.username || null
      platformUserId = accountData.metadata?.id || null
    }

    // If we didn't get username from metadata, fetch via Instagram API
    if (!platformUsername && userId) {
      try {
        const igRes = await fetch(`${COMPOSIO_BASE}/tools/execute/INSTAGRAM_GET_USER_INFO`, {
          method: 'POST',
          headers: {
            'x-api-key': COMPOSIO_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connected_account_id: connectedAccountId,
            arguments: { ig_user_id: 'me' },
          }),
        })

        if (igRes.ok) {
          const igData = await igRes.json()
          const info = igData.data || igData.response?.data || igData
          platformUsername = info.username || null
          platformUserId = info.id || null
        }
      } catch (e) {
        console.warn('Failed to fetch IG user info:', e.message)
      }
    }

    // Update integration to active
    if (userId) {
      await supabase.from('user_integrations').upsert({
        user_id: userId,
        platform: 'instagram',
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        composio_entity_id: userId,
        composio_connection_id: connectedAccountId,
        status: 'active',
        connected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' })
    }

    // Trigger initial data sync
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/fetch-instagram`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, initial_sync: true }),
      })
    } catch (e) {
      console.warn('Initial sync trigger failed (will retry on cron):', e.message)
    }

    // Redirect to app with success
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/create?ig_connect=success&username=${platformUsername || ''}` },
    })

  } catch (error) {
    console.error('instagram-callback error:', error.message)
    return new Response(null, {
      status: 302,
      headers: { Location: `${appUrl}/create?ig_connect=error` },
    })
  }
})
