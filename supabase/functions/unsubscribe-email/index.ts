/**
 * Unsubscribe Email Edge Function
 *
 * Cancels all pending emails for a given email address
 * and marks enrollments as unsubscribed.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the lead
    const { data: lead } = await supabase
      .from('public_leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (!lead) {
      // No lead found — still return success (don't leak whether email exists)
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find all active enrollments for this lead
    const { data: enrollments } = await supabase
      .from('email_sequence_enrollments')
      .select('id')
      .eq('lead_id', lead.id)
      .eq('status', 'active')

    if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map(e => e.id)

      // Cancel all pending emails
      await supabase
        .from('email_sequence_emails')
        .update({ status: 'cancelled' })
        .in('enrollment_id', enrollmentIds)
        .eq('status', 'scheduled')

      // Mark enrollments as unsubscribed
      await supabase
        .from('email_sequence_enrollments')
        .update({ status: 'unsubscribed', completed_at: new Date().toISOString() })
        .in('id', enrollmentIds)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
