/**
 * Process Scheduled Emails Edge Function
 *
 * Called by cron job to send due emails.
 * Fetches personalization tokens, renders templates, sends via Resend/Kit.
 *
 * NOTE: Requires RESEND_API_KEY environment variable.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Shared HTML wrapper for all emails
function wrapHtml(body: string, unsubEmail: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ff;"><tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#5e17eb,#E9A23B);padding:24px 32px;">
<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Vibe Rise</span>
</td></tr>
<tr><td style="padding:32px;color:#1a1a1a;font-size:16px;line-height:1.6;">
${body}
</td></tr>
<tr><td style="padding:16px 32px 32px;color:#999;font-size:12px;line-height:1.5;border-top:1px solid #eee;">
You're getting this because you signed up for Vibe Rise.<br>
<a href="https://viberise.nichuzz.com/unsubscribe?email=${encodeURIComponent(unsubEmail)}" style="color:#999;text-decoration:underline;">Unsubscribe</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

// Helper to create a branded CTA button
function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="background:#5e17eb;border-radius:8px;padding:14px 28px;">
<a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;">${text}</a>
</td></tr></table>`
}

// Email templates with subject + HTML body
const EMAIL_TEMPLATES: Record<string, Record<string, { subject: string, body: (tokens: Record<string, any>) => string }>> = {
  money_model: {
    day_0: { subject: "{{name}}, your {{offer_type}} strategy is ready", body: () => '' },
    day_1: { subject: "The hidden reason {{offer_type}} feels hard", body: () => '' },
    day_3: { subject: "How {{offer_type}} creators are earning without burnout", body: () => '' },
    day_5: { subject: "{{name}}, the missing piece in your strategy", body: () => '' },
    day_7: { subject: "Your personalized roadmap is waiting, {{name}}", body: () => '' }
  },
  creator_nurture: {
    day_0: {
      subject: "I quit my job because of one experience",
      body: (t) => `
<p style="margin:0 0 16px;">I was 26, sitting in a VC firm in Sydney, and I'd known for 3 years the job wasn't it.</p>
<p style="margin:0 0 16px;">Not in a dramatic way. More like a slow leak. Every Sunday night, a knot in my stomach. Every Monday morning, the same thought: "there has to be more than this."</p>
<p style="margin:0 0 16px;">I'd spent $30K on 52 courses trying to figure out "what's next." None of them worked. Because the problem wasn't information. The problem was I didn't feel safe enough to act on what I already knew.</p>
<p style="margin:0 0 16px;">Then I did one breathwork session on a beach in Bali. 90 minutes. No PowerPoint. No workbook.</p>
<p style="margin:0 0 16px;">Within 6 weeks I was living in Bali. Within 3 months I'd quit the job. Within 6 months I was funding my life running silent discos on beaches across South-East Asia.</p>
<p style="margin:0 0 16px;">One experience cracked everything open. I've spent the last 3 years trying to understand WHY.</p>
<p style="margin:0 0 16px;">If you're an experience creator, I think you'll find what I learned pretty useful. More tomorrow.</p>
${ctaButton('See the Experience Portal →', 'https://create.nichuzz.com/create')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>
<p style="margin:16px 0 0;font-size:13px;color:#999;">P.S. Tomorrow I'll tell you about the 48-hour problem. It's the thing that makes most workshops feel life-changing in the moment but change nothing long-term.</p>`
    },
    day_1: {
      subject: "The 48-hour problem",
      body: (t) => `
<p style="margin:0 0 16px;">Here's what nobody talks about in the healing space.</p>
<p style="margin:0 0 16px;">People come to your workshop. They cry. They shake. They have a genuine breakthrough. They leave saying "that was life-changing."</p>
<p style="margin:0 0 16px;">Then 48 hours later, they're back to the same patterns.</p>
<p style="margin:0 0 16px;">Think of it like trying to renovate a house by just painting the walls. It looks amazing for a week. Then the cracks come back. Because the foundation hasn't changed.</p>
<p style="margin:0 0 16px;">The neuroscience is specific. For a pattern to actually change at the subconscious level, 4 conditions need to be met simultaneously. Most modalities hit 1 or 2 by accident. Almost none hit all 4 by design.</p>
<p style="margin:0 0 16px;">The facilitators whose participants actually change? They combine mind + body + structured action + repetition. Whether they know it or not.</p>
${ctaButton('See the Experience Portal →', 'https://create.nichuzz.com/create')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>
<p style="margin:16px 0 0;font-size:13px;color:#999;">P.S. Next email I'll break down the 4 types of experience creators. Knowing your type changes what you should build first.</p>`
    },
    day_3: {
      subject: "There are 4 types of experience creators",
      body: (t) => `
<p style="margin:0 0 16px;">After studying 100 experience creators, I noticed something. They all fit into one of 4 types. And the type determines what they should build first.</p>
<p style="margin:0 0 16px;"><strong>The Stream.</strong> You know exactly what experience you want to create but you're early. Your move: run 10 experiences. Charge something. Learn by doing.</p>
<p style="margin:0 0 16px;"><strong>The Lake.</strong> You've been doing this for a while but you feel stuck. Lots of skills, lots of ideas, no clear direction. Your move: stop adding. Start subtracting.</p>
<p style="margin:0 0 16px;"><strong>The Waterfall.</strong> You have deep expertise but your audience is too narrow. Your move: find the adjacent audience who needs what you already have.</p>
<p style="margin:0 0 16px;"><strong>The River.</strong> You're already running experiences and people love your work. But you can't scale without burning out. Your move: build the system.</p>
<p style="margin:0 0 16px;">Most creators try to solve a River problem when they're actually a Stream. Or a Waterfall problem when they're actually a Lake.</p>
${ctaButton('Find your type in the Portal →', 'https://create.nichuzz.com/create')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>
<p style="margin:16px 0 0;font-size:13px;color:#999;">P.S. Next email is my favourite. It's about the worst workshop I ever attended.</p>`
    },
    day_5: {
      subject: "The worst workshop I ever attended",
      body: (t) => `
<p style="margin:0 0 16px;">True story. I once went to a yoga class where the teacher spent 45 minutes talking about chakra alignment theory before we did a single pose.</p>
<p style="margin:0 0 16px;">45 minutes. Sitting on a mat. I could feel my soul leaving my body.</p>
<p style="margin:0 0 16px;">Now compare that to a circus school. Circus school doesn't start with "let me explain the physics of trapeze." It starts with "grab the bar and swing."</p>
<p style="margin:0 0 16px;">The best experience creators I've studied all work like circus schools, not yoga lectures. They create a container where the experience comes first and the understanding follows.</p>
<p style="margin:0 0 16px;">That's the difference between an experience people attend and an experience people can't stop talking about.</p>
<p style="margin:0 0 16px;">Play first. Groan second. Insight third.</p>
${ctaButton('Design your first experience →', 'https://create.nichuzz.com/create')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>
<p style="margin:16px 0 0;font-size:13px;color:#999;">P.S. Last email tomorrow. I'll share the 3 findings from studying 100 experience creators that changed how I think about this entire industry.</p>`
    },
    day_7: {
      subject: "I studied 100 experience creators. Here's what I found.",
      body: (t) => `
<p style="margin:0 0 16px;">Over the last 3 years I've studied 100 experience creators. From Wim Hof to Tony Robbins to a breathwork facilitator in Byron Bay who went from free sessions to $5K weekends.</p>
<p style="margin:0 0 16px;">What separates the 3% who build movements from the 97% who stay stuck at 15 participants? It comes down to 3 things:</p>
<p style="margin:0 0 16px;"><strong>1. They figured out how to pay rent while they built.</strong> The ones who made it found bridge income that matched their archetype.</p>
<p style="margin:0 0 16px;"><strong>2. They triggered at least one remarkability trigger.</strong> Every creator who "blew up" either broke a rule, created an unexpected combination, did something extreme, made it stupidly simple, or produced an impossible result.</p>
<p style="margin:0 0 16px;"><strong>3. They built a 3-layer offer stack.</strong> Attraction (gets them in the door), Core (where the shift happens), Continuity (recurring revenue).</p>
<p style="margin:0 0 16px;">The Experience Portal scores you against all 100 creators and shows you exactly where your gaps are.</p>
${ctaButton('See your score →', 'https://create.nichuzz.com/create')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>
<p style="margin:16px 0 0;font-size:13px;color:#999;">P.S. This was the last email in this series. If any of it resonated, reply and tell me which type you are (Stream, Lake, Waterfall, or River). I read every reply.</p>`
    }
  },
  nervous_system: {
    day_0: { subject: "{{name}}, your {{archetype}} pattern revealed", body: () => '' },
    day_1: { subject: "Why knowing your pattern isn't enough", body: () => '' },
    day_3: { subject: "How {{archetype}}s break through", body: () => '' },
    day_5: { subject: "The business strategy that matches your wiring", body: () => '' },
    day_7: { subject: "Ready to expand beyond {{edge_earning}}/year?", body: () => '' }
  },
  welcome: {
    day_0: {
      subject: "Welcome to Vibe Rise",
      body: (t) => `
<p style="margin:0 0 16px;font-size:18px;font-weight:600;">Wahoooo!!! Welcome ${t.name || 'there'}!</p>
<p style="margin:0 0 16px;">To get started, check out the <a href="https://viberise.nichuzz.com/essence-mirror" style="color:#5e17eb;text-decoration:none;font-weight:600;">Essence Mirror</a> flow.</p>
<p style="margin:0 0 16px;">In three years of running workshops in Bali, this exercise is one of participants' favourites. It identifies your Essence Voice, the most loving, playful, energised version of you. The voice you embodied so effortlessly as a kid but can become dimmed as we grow up.</p>
<p style="margin:0 0 16px;">It will also create a Pixar-animated version of you. Basically your very own real life cartoon. See this as your game character.</p>
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>`
    },
    day_1: {
      subject: "I quit my job at 26 because of a feeling",
      body: (t) => `
<p style="margin:0 0 16px;">Hey ${t.name || 'there'},</p>
<p style="margin:0 0 16px;">Quick backstory on why I built this.</p>
<p style="margin:0 0 16px;">I worked at a VC firm in Sydney for five years. Knew for the last three it wasn't my thing. Spent $30K on 52 courses trying to figure out what was next. None of them worked.</p>
<p style="margin:0 0 16px;">Not because they were bad. Because they were giving me information, and information wasn't what I was missing.</p>
<p style="margin:0 0 16px;">I was missing the ability to act on what I already knew.</p>
<p style="margin:0 0 16px;">So I started doing one thing a week that scared me. Started posting online, hosted a pop-up disco in public, started wearing things that felt like me. Within four weeks I was working from Bali. Within three months I quit. Within six months I was funding my own life doing work I actually cared about.</p>
<p style="margin:0 0 16px;">The information didn't change. What felt safe changed.</p>
<p style="margin:0 0 16px;">That's what Vibe Rise is built around. Not more information. More capacity to act on what you already know.</p>
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>`
    },
    day_3: {
      subject: "The thing $30K of courses couldn't teach me",
      body: (t) => `
<p style="margin:0 0 16px;">Hey ${t.name || 'there'},</p>
<p style="margin:0 0 16px;">Here's what 52 courses and $30K taught me: knowing what to do and being able to do it are completely different problems.</p>
<p style="margin:0 0 16px;">We all live inside what I think of as a safety dome. Everything inside it feels comfortable. Everything outside it triggers something that makes us pull back.</p>
<p style="margin:0 0 16px;">The dome isn't set by your intelligence or your ambition. It's set by what your body believes is safe.</p>
<p style="margin:0 0 16px;">In the app, the things that expand your dome are called Wahoos. They're courage challenges tied to the stuff that actually matters to you. Not generic "cold shower" content. Things connected to your skills, your curiosities, the life you're trying to build.</p>
<p style="margin:0 0 16px;">The name comes from the sound people make after they've done the thing they were scared of. Half relief, half disbelief. You'll know it when you feel it.</p>
${ctaButton('Try your first Wahoo →', 'https://viberise.nichuzz.com/7-day-challenge')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>`
    },
    day_5: {
      subject: "Your Vibe Rise score (and what it actually measures)",
      body: (t) => `
<p style="margin:0 0 16px;">Hey ${t.name || 'there'},</p>
<p style="margin:0 0 16px;">You might have noticed the Vibe Rise score in the app. Here's what it actually tracks.</p>
<p style="margin:0 0 16px;font-weight:600;font-size:17px;">Vibe Rise = Safety × Expression</p>
<p style="margin:0 0 16px;">Safety is how regulated and grounded you feel. The healing work in the app builds this. Recognising old patterns, releasing what's stuck, rewiring what was installed that wasn't yours.</p>
<p style="margin:0 0 16px;">Expression is how much of the real you is showing up in the world. Wahoos build this. Every courage challenge expands what you're willing to be seen doing.</p>
<p style="margin:0 0 16px;">Stalls shrink your safety. Those moments where you wanted to act but froze, avoided, or people-pleased instead.</p>
<p style="margin:0 0 16px;">Drains siphon your expression. The job that hollows you out, the habits you fall into when you're running on empty.</p>
<p style="margin:0 0 16px;">Then there's daily practices. Sleep, movement, connection, creative time. These maintain your baseline capacity. When maintenance drops, no matter what other work you're doing, everything feels harder.</p>
<p style="margin:0 0 16px;">The score isn't about being perfect. It's about seeing the ratio. The Tune tab tracks all of this in about 30 seconds a day.</p>
${ctaButton('Check in today →', 'https://viberise.nichuzz.com/7-day-challenge')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>`
    },
    day_7: {
      subject: "One week in",
      body: (t) => `
<p style="margin:0 0 16px;">Hey ${t.name || 'there'},</p>
<p style="margin:0 0 16px;">It's been a week. Whether you've been in the app every day or haven't opened it since, I want to share something.</p>
<p style="margin:0 0 16px;">Most apps guilt you into streaks. Miss a day and the whole thing resets. That's not how growth works.</p>
<p style="margin:0 0 16px;">What matters more than daily perfection is the weekly pattern. Are you depositing more than you're draining? Are you doing things that scare you, even occasionally? Are you noticing what lights you up?</p>
<p style="margin:0 0 16px;">Every Sunday or Monday, the app prompts a weekly review. Seven quick questions about your environment, your network, your bets, your identity, your learning, your compounding, and your attention.</p>
<p style="margin:0 0 16px;">Takes two minutes. Worth more than the other six days combined. Because the weekly review isn't about what you DID. It's about what you're BECOMING.</p>
${ctaButton('Do your first weekly review →', 'https://viberise.nichuzz.com/7-day-challenge')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>`
    },
    day_10: {
      subject: "The pattern I see in everyone who stays stuck",
      body: (t) => `
<p style="margin:0 0 16px;">Hey ${t.name || 'there'},</p>
<p style="margin:0 0 16px;">There's a pattern I see in almost everyone who gets excited about something new and then quietly stops.</p>
<p style="margin:0 0 16px;">It's not laziness. It's not a lack of motivation.</p>
<p style="margin:0 0 16px;">Somewhere around day 5 to 10, a voice kicks in. It sounds like your own thinking but it's not. It's a pattern you picked up years ago to keep yourself safe.</p>
<p style="margin:0 0 16px;">For some people it sounds like "this isn't working fast enough." For others it's "I don't want anyone to see me doing this." Or "I should focus on what other people need from me." Or "I need to stay in control of the outcome."</p>
<p style="margin:0 0 16px;">These aren't flaws. They're defence strategies you built when you needed them. But they become the ceiling on everything. Your career, your relationships, your creativity, your willingness to take a risk.</p>
<p style="margin:0 0 16px;">The app has a tool called Zone Diagnosis that helps you figure out which pattern is running the show. Takes about 5 minutes and it's uncomfortably accurate.</p>
${ctaButton('Find your pattern →', 'https://viberise.nichuzz.com/7-day-challenge')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>
<p style="margin:16px 0 0;color:#666;font-size:14px;font-style:italic;">P.S. If you've already stopped using the app, that's probably one of these voices at work. Not a judgement. Just worth noticing.</p>`
    },
    day_14: {
      subject: "Head Full of Dreams",
      body: (t) => `
<p style="margin:0 0 16px;">Hey ${t.name || 'there'},</p>
<p style="margin:0 0 16px;">Last email in this series. I want to leave you with a framework that changed how I think about everything.</p>
<p style="margin:0 0 16px;">Most people who find Vibe Rise are in a place I call Head Full of Dreams. They can see what they want. They've done the reading, the courses, the journalling. They know themselves better than most people ever will.</p>
<p style="margin:0 0 16px;">But they can't move.</p>
<p style="margin:0 0 16px;">Self-knowledge went up. Action didn't follow. And the gap between what they know and what they do becomes its own kind of pain.</p>
<p style="margin:0 0 16px;">The goal isn't more self-knowledge. It's the diagonal. Self-knowledge AND action moving together, in proportion.</p>
<p style="margin:0 0 16px;">The Essence Mirror and healing work build self-knowledge. The Wahoos and daily practices build action. The score tracks whether they're moving together.</p>
<p style="margin:0 0 16px;">Two weeks ago you signed up. Whatever you've done since then counts. Even reading these emails counts. Awareness is the first deposit.</p>
<p style="margin:0 0 16px;">The app is here whenever you're ready to make the next one.</p>
${ctaButton('Continue your journey →', 'https://viberise.nichuzz.com/7-day-challenge')}
<p style="margin:0 0 4px;">Much Love,</p>
<p style="margin:0;font-weight:600;">Huzz</p>
<p style="margin:16px 0 0;color:#666;font-size:14px;font-style:italic;">P.S. If you want to go deeper, the Level tab in the app maps out the full 9-level journey. Each level has its own boss fight. It gets wild.</p>`
    }
  }
}

function personalizeText(text: string, tokens: Record<string, any>): string {
  let result = text
  Object.entries(tokens).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(placeholder, String(value || ''))
  })
  return result.replace(/\{\{[^}]+\}\}/g, '') // Clean unreplaced
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set - emails will be logged but not sent')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find due emails
    const now = new Date().toISOString()
    const { data: dueEmails, error: fetchError } = await supabase
      .from('email_sequence_emails')
      .select(`
        id,
        email_key,
        enrollment:email_sequence_enrollments (
          id,
          sequence_type,
          status,
          lead:public_leads (
            id,
            email,
            personalization_tokens
          )
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .limit(50) // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch due emails: ${fetchError.message}`)
    }

    if (!dueEmails || dueEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No emails due', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sent = 0
    let failed = 0
    const results: any[] = []

    for (const email of dueEmails) {
      const enrollment = email.enrollment as any
      const lead = enrollment?.lead as any

      // Skip if enrollment is not active
      if (enrollment?.status !== 'active') {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'cancelled' })
          .eq('id', email.id)
        continue
      }

      const sequenceType = enrollment?.sequence_type
      const tokens = lead?.personalization_tokens || {}
      const recipientEmail = lead?.email

      if (!recipientEmail) {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'failed', error_message: 'No recipient email' })
          .eq('id', email.id)
        failed++
        continue
      }

      // Get template
      const template = EMAIL_TEMPLATES[sequenceType]?.[email.email_key]
      if (!template) {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'failed', error_message: 'Template not found' })
          .eq('id', email.id)
        failed++
        continue
      }

      const subject = personalizeText(template.subject, tokens)
      const bodyHtml = template.body ? template.body(tokens) : ''
      const fullHtml = bodyHtml ? wrapHtml(bodyHtml, recipientEmail) : ''

      // Send email via Resend (or log if no API key)
      try {
        if (resendApiKey) {
          const unsubUrl = `https://viberise.nichuzz.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
          const emailPayload: Record<string, any> = {
            from: 'Huzz <huzz@nichuzz.com>',
            reply_to: 'huzz@nichuzz.com',
            to: recipientEmail,
            subject: subject,
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            },
          }

          if (fullHtml) {
            emailPayload.html = fullHtml
          } else {
            emailPayload.text = `This is email ${email.email_key} from the ${sequenceType} sequence.`
          }

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to send via Resend')
          }
        } else {
          console.log(`[DRY RUN] Would send email to ${recipientEmail}: ${subject}`)
        }

        // Mark as sent
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', email.id)

        sent++
        results.push({ email_id: email.id, to: recipientEmail, subject, status: 'sent' })

      } catch (sendError: any) {
        await supabase
          .from('email_sequence_emails')
          .update({ status: 'failed', error_message: sendError.message })
          .eq('id', email.id)
        failed++
        results.push({ email_id: email.id, to: recipientEmail, status: 'failed', error: sendError.message })
      }
    }

    // Check for completed sequences
    const completedEnrollmentIds = [...new Set(dueEmails.map(e => (e.enrollment as any)?.id).filter(Boolean))]

    for (const enrollmentId of completedEnrollmentIds) {
      const { data: remaining } = await supabase
        .from('email_sequence_emails')
        .select('id')
        .eq('enrollment_id', enrollmentId)
        .eq('status', 'scheduled')

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('email_sequence_enrollments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', enrollmentId)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: dueEmails.length,
        sent,
        failed,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing emails:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
