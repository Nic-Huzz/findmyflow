// supabase/functions/_shared/auth.ts
// Shared authentication for agent-submit and mcp-server.
// Supports both fmf_k1_ API keys AND Supabase OAuth JWTs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

export interface AuthResult {
  userId: string
  supabase: any
  permissions: any
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Authenticate a request via API key or OAuth JWT.
 * Returns AuthResult on success, or a Response (401/403) on failure.
 */
export async function authenticateRequest(
  req: Request
): Promise<AuthResult | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    // MCP spec: return 401 with resource_metadata hint for OAuth discovery
    return new Response(
      JSON.stringify({ error: 'Authorization required. Provide a Bearer token (API key or OAuth access token).' }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer resource_metadata="https://findmyflow.nichuzz.com/.well-known/oauth-protected-resource"',
        },
      }
    )
  }
  const token = authHeader.replace('Bearer ', '')

  // Route to API key auth or OAuth JWT auth based on prefix
  if (token.startsWith('fmf_k1_')) {
    return authenticateApiKey(token)
  }

  // Treat as Supabase OAuth JWT
  return authenticateOAuthToken(token)
}

/**
 * Authenticate via fmf_k1_ API key (existing flow).
 */
async function authenticateApiKey(apiKey: string): Promise<AuthResult | Response> {
  if (apiKey.length < 20) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key format. Keys start with fmf_k1_' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // SHA-256 hash the key
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: keyRow, error: keyError } = await supabase
    .from('agent_api_keys')
    .select('id, user_id, permissions, is_active')
    .eq('key_hash', keyHash)
    .single()

  if (keyError || !keyRow) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!keyRow.is_active) {
    return new Response(
      JSON.stringify({ error: 'API key has been revoked' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Fire-and-forget: update last_used_at
  supabase
    .from('agent_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(({ error: updateErr }: any) => {
      if (updateErr) console.warn('last_used_at update failed:', updateErr.message)
    })

  return {
    userId: keyRow.user_id,
    supabase,
    permissions: keyRow.permissions,
  }
}

/**
 * Authenticate via Supabase OAuth JWT (from Claude Connectors).
 * The JWT is issued by Supabase GoTrue's OAuth server.
 * We validate it by calling getUser() which checks signature + expiry.
 */
async function authenticateOAuthToken(token: string): Promise<AuthResult | Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Create a client with the user's token to validate it
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || serviceRoleKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await userClient.auth.getUser(token)

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired access token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Use service role client for DB operations (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  return {
    userId: user.id,
    supabase,
    permissions: null, // OAuth users get full access (no flow restrictions)
  }
}
