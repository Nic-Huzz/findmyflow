import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3.1'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authenticated user from Supabase JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { callback_url } = await req.json()
    if (!callback_url) throw new Error('callback_url is required')

    // Check if already connected
    const { data: existing } = await supabase
      .from('user_integrations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .single()

    if (existing?.status === 'active') {
      return new Response(
        JSON.stringify({ status: 'already_connected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initiate Composio connection for this user
    const connectRes = await fetch(`${COMPOSIO_BASE}/connected_accounts`, {
      method: 'POST',
      headers: {
        'x-api-key': COMPOSIO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Use specific integration if configured, otherwise use toolkit default
        ...(Deno.env.get('COMPOSIO_INSTAGRAM_INTEGRATION_ID')
          ? { integration_id: Deno.env.get('COMPOSIO_INSTAGRAM_INTEGRATION_ID') }
          : { toolkit_slug: 'instagram' }
        ),
        user_id: user.id,
        redirect_url: callback_url,
      }),
    })

    if (!connectRes.ok) {
      const err = await connectRes.text()
      throw new Error(`Composio connection failed: ${err}`)
    }

    const connectData = await connectRes.json()

    // Store pending integration
    await supabase.from('user_integrations').upsert({
      user_id: user.id,
      platform: 'instagram',
      composio_entity_id: user.id,
      composio_connection_id: connectData.id || connectData.connected_account_id,
      status: 'disconnected',
    }, { onConflict: 'user_id,platform' })

    return new Response(
      JSON.stringify({
        redirect_url: connectData.redirect_url || connectData.redirectUrl,
        connection_id: connectData.id || connectData.connected_account_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('connect-instagram error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
