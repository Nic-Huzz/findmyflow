/**
 * Validation Completion Notify Edge Function
 *
 * Sends email notification to validation flow creator when someone completes their survey.
 * Uses Resend for email delivery.
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
    const { flow_id, session_id, flow_name, total_responses } = await req.json()

    if (!flow_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'flow_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the flow and creator info
    const { data: flow, error: flowError } = await supabase
      .from('validation_flows')
      .select(`
        id,
        flow_name,
        user_id,
        user:users (
          id,
          email,
          full_name
        )
      `)
      .eq('id', flow_id)
      .single()

    if (flowError || !flow) {
      console.error('Error fetching flow:', flowError)
      return new Response(
        JSON.stringify({ error: 'Flow not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get session details for the email
    const { data: session, error: sessionError } = await supabase
      .from('validation_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError) {
      console.error('Error fetching session:', sessionError)
    }

    // Get response count
    const { count: responseCount } = await supabase
      .from('validation_responses')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)

    // Get total sessions for this flow (for stats)
    const { count: totalSessions } = await supabase
      .from('validation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('flow_id', flow_id)

    const { count: completedSessions } = await supabase
      .from('validation_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('flow_id', flow_id)
      .eq('is_completed', true)

    const creatorEmail = flow.user?.email
    const creatorName = flow.user?.full_name || 'there'

    if (!creatorEmail) {
      console.log('No creator email found - skipping notification')
      return new Response(
        JSON.stringify({ success: true, message: 'No creator email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email content
    const surveyName = flow.flow_name || flow_name || 'your validation survey'
    const deviceType = session?.metadata?.device_type || 'unknown'
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New Survey Response!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 16px 16px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Hey ${creatorName}!
          </p>

          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            Someone just completed <strong>${surveyName}</strong>! 🙌
          </p>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Response Details</h3>
            <p style="margin: 8px 0; color: #374151;"><strong>Questions Answered:</strong> ${responseCount || total_responses || 'N/A'}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Device:</strong> ${deviceType}</p>
          </div>

          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Survey Stats</h3>
            <p style="margin: 8px 0; color: #374151;"><strong>Total Responses:</strong> ${completedSessions}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Completion Rate:</strong> ${completionRate}%</p>
          </div>

          <a href="https://findmyflow.nichuzz.com/validation-flows"
             style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View All Responses →
          </a>

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Keep sharing your survey to gather more insights!
          </p>
        </div>

        <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
          Powered by FindMyFlow
        </p>
      </div>
    `

    // Send email via Resend
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'FindMyFlow <notifications@findmyflow.nichuzz.com>',
          to: creatorEmail,
          subject: `🎉 New response: ${surveyName}`,
          html: emailHtml
        })
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Resend error:', errorText)
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`✅ Notification sent to ${creatorEmail} for flow ${flow_id}`)
    } else {
      console.log('RESEND_API_KEY not set - email logged but not sent')
      console.log('Would send to:', creatorEmail)
    }

    return new Response(
      JSON.stringify({ success: true, sent_to: creatorEmail }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in validation-completion-notify:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
