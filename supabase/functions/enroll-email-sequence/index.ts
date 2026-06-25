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

// Email schedules per sequence type (days after enrollment)
const EMAIL_SCHEDULES: Record<string, Record<string, number>> = {
  money_model: {
    day_0: 0,
    day_1: 1,
    day_3: 3,
    day_5: 5,
    day_7: 7
  },
  nervous_system: {
    day_0: 0,
    day_1: 1,
    day_3: 3,
    day_5: 5,
    day_7: 7
  },
  welcome: {
    day_0: 0,
    day_1: 1,
    day_3: 3,
    day_5: 5,
    day_7: 7,
    day_10: 10,
    day_14: 14
  }
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

    // Find or create the lead
    let leadId: string

    const { data: existingLead } = await supabase
      .from('public_leads')
      .select('id')
      .eq('email', email)
      .single()

    if (existingLead) {
      leadId = existingLead.id
    } else {
      const { data: newLead, error: createError } = await supabase
        .from('public_leads')
        .insert({
          email,
          source_flow: sequence_type,
          personalization_tokens: personalization_tokens || {}
        })
        .select('id')
        .single()

      if (createError || !newLead) {
        throw new Error(`Failed to create lead: ${createError?.message || 'Unknown error'}`)
      }

      leadId = newLead.id
    }

    // Check if already enrolled in this sequence
    const { data: existingEnrollment } = await supabase
      .from('email_sequence_enrollments')
      .select('id')
      .eq('lead_id', leadId)
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
        lead_id: leadId,
        sequence_type,
        status: 'active'
      })
      .select('id')
      .single()

    if (enrollError) {
      throw new Error(`Failed to create enrollment: ${enrollError.message}`)
    }

    // Schedule all emails in the sequence
    const schedule = EMAIL_SCHEDULES[sequence_type] || EMAIL_SCHEDULES.money_model
    const now = new Date()
    const emailsToSchedule = Object.entries(schedule).map(([emailKey, daysDelay]) => {
      const scheduledFor = new Date(now)
      scheduledFor.setDate(scheduledFor.getDate() + daysDelay)

      if (daysDelay === 0) {
        // Welcome sequence: 30 min delay. Others: 5 min delay.
        const delayMinutes = sequence_type === 'welcome' ? 30 : 5
        scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes)
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
