import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

/**
 * notify-new-signup
 *
 * Called by a Supabase database webhook on auth.users INSERT.
 * Sends an email to Huzz via Resend whenever a new user signs up.
 *
 * Trigger setup (run in SQL editor):
 *   See bottom of this file for the webhook SQL.
 */

const RESEND_KEY = Deno.env.get('RESEND_KEY') || ''
const NOTIFY_EMAIL = 'huzz@nichuzz.com'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const payload = await req.json()

    // Supabase webhook sends: { type, table, record, schema, old_record }
    const record = payload.record || payload
    const email = record.email || record.raw_user_meta_data?.email || 'unknown'
    const name = record.raw_user_meta_data?.display_name || record.raw_user_meta_data?.name || 'New User'
    const createdAt = record.created_at || new Date().toISOString()

    // Send notification email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vibe Rise <huzz@nichuzz.com>',
        to: NOTIFY_EMAIL,
        subject: `New signup: ${name} (${email})`,
        html: `
          <div style="font-family: -apple-system, sans-serif; padding: 20px; max-width: 500px;">
            <h2 style="color: #5e17eb; margin-bottom: 8px;">New Vibe Rise Signup</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Signed up:</strong> ${createdAt}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
            <p style="color: #999; font-size: 13px;">
              <a href="https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv/auth/users" style="color: #5e17eb;">View in Supabase</a>
            </p>
          </div>
        `,
      }),
    })

    const result = await res.json()

    // Also enroll in welcome email sequence
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://qlwfcfypnoptsocdpxuv.supabase.co'
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (email && email !== 'unknown') {
      try {
        await fetch(`${supabaseUrl}/functions/v1/enroll-email-sequence`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            sequence_type: 'welcome',
            personalization_tokens: { name: name || email.split('@')[0] },
          }),
        })
      } catch (enrollErr) {
        console.error('Welcome sequence enrollment failed:', enrollErr)
      }
    }

    return new Response(
      JSON.stringify({ success: true, email_id: result.id, user_email: email, enrolled_welcome: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('notify-new-signup error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/*
 * DATABASE WEBHOOK SETUP
 *
 * Run this in the Supabase SQL Editor to create the webhook trigger:
 *
 * -- Create the webhook that fires on new auth.users insert
 * CREATE OR REPLACE FUNCTION public.notify_new_signup()
 * RETURNS trigger AS $$
 * BEGIN
 *   PERFORM net.http_post(
 *     url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/notify-new-signup',
 *     headers := jsonb_build_object(
 *       'Content-Type', 'application/json',
 *       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
 *     ),
 *     body := jsonb_build_object(
 *       'record', row_to_json(NEW)
 *     )
 *   );
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 * -- Attach trigger to auth.users
 * DROP TRIGGER IF EXISTS on_new_user_signup ON auth.users;
 * CREATE TRIGGER on_new_user_signup
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW
 *   EXECUTE FUNCTION public.notify_new_signup();
 */
