/**
 * Send Agent Instructions Edge Function
 *
 * Sends formatted setup instructions email for configuring AI agent access.
 * Called from the Agent Access page. Uses Resend for email delivery.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FROM_ADDRESS = 'FindMyFlow <notifications@findmyflow.nichuzz.com>'
const MCP_SERVER_URL = 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/mcp-server'
const AGENT_ACCESS_URL = 'https://findmyflow.nichuzz.com/agent-access'
const LLMS_FULL_URL = 'https://findmyflow.nichuzz.com/llms-full.txt'

// Brand tokens
const B = {
  purple: '#5e17eb',
  purpleLight: '#7c3aed',
  gold: '#E9A23B',
  white: '#ffffff',
  warmGray: '#f8f9fa',
  softGray: '#e9ecef',
  textGray: '#495057',
  mutedGray: '#adb5bd',
  codeBg: '#1e1e2e',
  codeText: '#a6e3a1',
  font: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif",
  mono: "'SF Mono','Fira Code','Consolas',monospace",
}

function e(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function buildInstructionsEmail(keyPrefix: string | null): string {
  const keyReminder = keyPrefix
    ? `<tr><td style="padding:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;font-family:${B.font};">Your key starts with: <code style="background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:4px;font-family:${B.mono};font-size:12px;">${e(keyPrefix)}····</code></td></tr>`
    : ''

  const step1Code = 'export FINDMYFLOW_API_KEY="fmf_k1_your_key_here"'
  const step2Code = `echo '{
  "mcpServers": {
    "findmyflow": {
      "type": "http",
      "url": "${MCP_SERVER_URL}",
      "headers": {
        "Authorization": "Bearer \${FINDMYFLOW_API_KEY}"
      }
    }
  }
}' &gt; .mcp.json`

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>FindMyFlow Agent Setup</title>
  </head>
  <body style="margin:0;padding:0;background-color:${B.softGray};-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${B.softGray};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${B.white};border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,${B.purple} 0%,${B.purpleLight} 100%);padding:36px 30px 28px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="padding-bottom:8px;">
              <span style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:3px;font-family:${B.font};">&#129302;&ensp; Agent Setup Guide</span>
            </td></tr>
            <tr><td align="center">
              <h1 style="margin:0;color:${B.gold};font-size:26px;font-weight:700;font-family:${B.font};">Connect Your AI Agent</h1>
            </td></tr>
            ${keyReminder}
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 28px 0;">

          <p style="margin:0 0 20px;color:${B.textGray};font-size:15px;line-height:1.6;font-family:${B.font};">
            Follow these three steps to connect your AI agent (Claude Code, etc.) to FindMyFlow. Your agent will be able to run business assessments and the results will appear in the app.
          </p>

          <!-- Step 1 -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
            <tr><td style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:18px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,${B.purple},${B.purpleLight});text-align:center;vertical-align:middle;color:${B.white};font-size:13px;font-weight:700;font-family:${B.font};">1</td>
                    <td style="padding-left:10px;color:${B.textGray};font-size:14px;font-weight:600;font-family:${B.font};">Add to your shell profile (~/.zshrc or ~/.bashrc)</td>
                  </tr></table>
                </td></tr>
                <tr><td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background:${B.codeBg};color:${B.codeText};padding:10px 14px;border-radius:8px;font-family:${B.mono};font-size:12px;white-space:pre;overflow-x:auto;">${e(step1Code)}</td></tr>
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <!-- Step 2 -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
            <tr><td style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:18px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,${B.purple},${B.purpleLight});text-align:center;vertical-align:middle;color:${B.white};font-size:13px;font-weight:700;font-family:${B.font};">2</td>
                    <td style="padding-left:10px;color:${B.textGray};font-size:14px;font-weight:600;font-family:${B.font};">Paste into terminal to create .mcp.json</td>
                  </tr></table>
                </td></tr>
                <tr><td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background:${B.codeBg};color:${B.codeText};padding:10px 14px;border-radius:8px;font-family:${B.mono};font-size:12px;white-space:pre;overflow-x:auto;line-height:1.5;">${e(step2Code)}</td></tr>
                  </table>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <!-- Step 3 -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
            <tr><td style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:18px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding-bottom:10px;">
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,${B.purple},${B.purpleLight});text-align:center;vertical-align:middle;color:${B.white};font-size:13px;font-weight:700;font-family:${B.font};">3</td>
                    <td style="padding-left:10px;color:${B.textGray};font-size:14px;font-weight:600;font-family:${B.font};">Verify it worked</td>
                  </tr></table>
                </td></tr>
                <tr><td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="background:${B.codeBg};color:${B.codeText};padding:10px 14px;border-radius:8px;font-family:${B.mono};font-size:12px;white-space:pre;overflow-x:auto;">cat .mcp.json</td></tr>
                  </table>
                </td></tr>
                <tr><td style="padding-top:8px;color:${B.textGray};font-size:13px;line-height:1.5;font-family:${B.font};">
                  You should see your MCP server config printed out.
                </td></tr>
              </table>
            </td></tr>
          </table>

          <!-- Step 4 -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr><td style="background:${B.warmGray};border:1px solid ${B.softGray};border-radius:12px;padding:18px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td>
                  <table cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,${B.purple},${B.purpleLight});text-align:center;vertical-align:middle;color:${B.white};font-size:13px;font-weight:700;font-family:${B.font};">4</td>
                    <td style="padding-left:10px;color:${B.textGray};font-size:14px;font-weight:600;font-family:${B.font};">Try it out</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding-top:10px;color:${B.textGray};font-size:14px;line-height:1.6;font-family:${B.font};">
                  Restart Claude Code, then say: <strong style="color:${B.purple};">&ldquo;Help me figure out my attraction offer&rdquo;</strong>
                </td></tr>
              </table>
            </td></tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
            <tr><td align="center">
              <span style="color:${B.gold};font-size:18px;letter-spacing:12px;">&#10022; &#10022; &#10022;</span>
            </td></tr>
          </table>

          <!-- Links -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
            <tr><td align="center" style="padding:0 20px;">
              <p style="margin:0 0 12px;color:${B.textGray};font-size:14px;line-height:1.6;font-family:${B.font};">
                <a href="${AGENT_ACCESS_URL}" style="color:${B.purple};font-weight:600;text-decoration:none;">Manage your API keys</a>
                &nbsp;&bull;&nbsp;
                <a href="${LLMS_FULL_URL}" style="color:${B.purple};font-weight:600;text-decoration:none;">Full agent guide (llms-full.txt)</a>
              </p>
            </td></tr>
          </table>

          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" style="padding:16px 0 8px;">
              <span style="color:${B.gold};font-size:18px;letter-spacing:12px;">&#10022;</span>
            </td></tr>
            <tr><td align="center" style="padding:0 0 6px;color:${B.mutedGray};font-size:12px;font-family:${B.font};">
              FindMyFlow &mdash; On a mission to make healing fun
            </td></tr>
            <tr><td align="center" style="padding:0 0 24px;">
              <a href="https://findmyflow.nichuzz.com" style="color:${B.purple};text-decoration:none;font-size:12px;font-family:${B.font};">findmyflow.nichuzz.com</a>
            </td></tr>
          </table>

        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT — only authenticated users can send emails to themselves
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { keyPrefix } = await req.json()

    // Always send to the authenticated user's email, never trust the body
    const email = user.email
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'No email address on your account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (resendApiKey) {
      const html = buildInstructionsEmail(keyPrefix || null)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: email,
          subject: 'Your FindMyFlow Agent Setup Instructions',
          html,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('Resend error:', err)
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: err }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Agent instructions sent to: ${email}`)
    } else {
      console.log('RESEND_API_KEY not set — would send agent instructions to:', email)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error in send-agent-instructions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
