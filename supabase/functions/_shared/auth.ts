// supabase/functions/_shared/auth.ts
// Shared API key authentication for agent-submit and mcp-server.

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
 * Validate a fmf_k1_ API key from the Authorization header.
 * Returns AuthResult on success, or a Response (401/403) on failure.
 */
export async function authenticateRequest(
  req: Request
): Promise<AuthResult | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header. Expected: Bearer <api_key>' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  const apiKey = authHeader.replace('Bearer ', '')

  if (!apiKey.startsWith('fmf_k1_') || apiKey.length < 20) {
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
