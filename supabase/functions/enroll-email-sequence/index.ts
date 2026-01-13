/**
 * Enroll Email Sequence Edge Function
 *
 * Enrolls a public lead into an email nurture sequence.
 * Called after flow completion.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email schedule (days after enrollment)
const EMAIL_SCHEDULE = {
  day_0: 0,
  day_1: 1,
  day_3: 3,
  day_5: 5,
  day_7: 7
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email, sequence_type, personalization_tokens } = await req.json()

    if (!email || !sequence_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, sequence_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the lead
    const { data: lead, error: leadError } = await supabase
      .from('public_leads')
      .select('id')
      .eq('email', email)
      .single()

    if (leadError || !lead) {
      // Create the lead if it doesn't exist
      const { data: newLead, error: createError } = await supabase
        .from('public_leads')
        .insert({
          email,
          source_flow: sequence_type,
          personalization_tokens: personalization_tokens || {}
        })
        .select('id')
        .single()

      if (createError) {
        throw new Error(`Failed to create lead: ${createError.message}`)
      }

      lead.id = newLead.id
    }

    // Check if already enrolled in this sequence
    const { data: existingEnrollment } = await supabase
      .from('email_sequence_enrollments')
      .select('id')
      .eq('lead_id', lead.id)
      .eq('sequence_type', sequence_type)
      .single()

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ message: 'Already enrolled in sequence', enrollment_id: existingEnrollment.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('email_sequence_enrollments')
      .insert({
        lead_id: lead.id,
        sequence_type,
        status: 'active'
      })
      .select('id')
      .single()

    if (enrollError) {
      throw new Error(`Failed to create enrollment: ${enrollError.message}`)
    }

    // Schedule all emails in the sequence
    const now = new Date()
    const emailsToSchedule = Object.entries(EMAIL_SCHEDULE).map(([emailKey, daysDelay]) => {
      const scheduledFor = new Date(now)
      scheduledFor.setDate(scheduledFor.getDate() + daysDelay)

      // For day_0, send in 5 minutes (not immediately, gives time for processing)
      if (daysDelay === 0) {
        scheduledFor.setMinutes(scheduledFor.getMinutes() + 5)
      } else {
        // Send at 10am in their timezone (approximated as UTC for now)
        scheduledFor.setHours(10, 0, 0, 0)
      }

      return {
        enrollment_id: enrollment.id,
        email_key: emailKey,
        scheduled_for: scheduledFor.toISOString(),
        status: 'scheduled'
      }
    })

    const { error: scheduleError } = await supabase
      .from('email_sequence_emails')
      .insert(emailsToSchedule)

    if (scheduleError) {
      throw new Error(`Failed to schedule emails: ${scheduleError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        enrollment_id: enrollment.id,
        emails_scheduled: emailsToSchedule.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error enrolling in sequence:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
