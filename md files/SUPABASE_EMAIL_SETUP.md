# Supabase Email Setup for Group Code Sharing

## Current Implementation

**Status:** Partial - Group code is displayed in UI and alert message
**Location:** Challenge.jsx line 263

When a user creates a group:
1. ✅ Group code is generated and stored
2. ✅ Success alert shows the group code
3. ✅ Group code displays on the Leaderboard page
4. ⏳ Email notification (not yet implemented)

## Option 1: Supabase Edge Function (Recommended)

### Setup Steps

1. **Install Supabase CLI** (if not already installed)
```bash
npm install -g supabase
```

2. **Initialize Supabase locally**
```bash
supabase init
```

3. **Create Edge Function**
```bash
supabase functions new send-group-code-email
```

4. **Edge Function Code**
Create `supabase/functions/send-group-code-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { email, groupCode, userName } = await req.json()

    // Send email using Resend (or your preferred email service)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Find My Flow <noreply@findmyflow.com>',
        to: [email],
        subject: '🎉 Your Challenge Group Code',
        html: `
          <h2>Hi ${userName}!</h2>
          <p>You've successfully created a challenge group.</p>
          <p>Share this code with friends to invite them:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 0.2em; border-radius: 8px; margin: 20px 0;">
            ${groupCode}
          </div>
          <p>Your friends can join by:</p>
          <ol>
            <li>Going to the 7-Day Challenge</li>
            <li>Clicking "Join Group"</li>
            <li>Entering your code: <strong>${groupCode}</strong></li>
          </ol>
          <p>Good luck on your journey!</p>
          <p>— The Find My Flow Team</p>
        `,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

5. **Deploy Edge Function**
```bash
supabase functions deploy send-group-code-email --no-verify-jwt
```

6. **Set Environment Variables in Supabase Dashboard**
- Go to Project Settings → Edge Functions → Secrets
- Add: `RESEND_API_KEY=your_resend_api_key`

7. **Update Frontend Code**

In Challenge.jsx (around line 265), replace the TODO with:

```javascript
// Send email with group code
try {
  const { data, error } = await supabase.functions.invoke('send-group-code-email', {
    body: {
      email: user.email,
      groupCode: newCode,
      userName: userData?.user_name || user.email.split('@')[0]
    }
  })

  if (error) {
    console.error('Email send error:', error)
  } else {
    console.log('Group code email sent successfully')
  }
} catch (emailErr) {
  console.log('Email notification skipped:', emailErr)
  // Don't block the flow if email fails
}
```

## Option 2: Use Existing Magic Link Email Template

### Quick Implementation (No new email service needed)

You can piggyback on Supabase's built-in email by sending a custom email template:

1. **Go to Supabase Dashboard**
   - Authentication → Email Templates

2. **Create a custom template** or modify an existing one

3. **Use Supabase's admin API to trigger email**:

```javascript
// In Challenge.jsx after group creation
try {
  // This would require a backend endpoint or edge function
  // to use the Supabase Admin API (service role key)
  await fetch('/api/send-group-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      groupCode: newCode,
      userName: userData?.user_name || user.email.split('@')[0]
    })
  })
} catch (err) {
  console.log('Email sending skipped')
}
```

## Option 3: Third-Party Email Service (Resend, SendGrid, etc.)

### Using Resend (Recommended for simplicity)

1. **Sign up for Resend**: https://resend.com
2. **Get API key**
3. **Create backend API route** (e.g., Vercel Serverless Function)

Create `api/send-group-code-email.js`:

```javascript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, groupCode, userName } = req.body

  try {
    const { data, error } = await resend.emails.send({
      from: 'Find My Flow <noreply@findmyflow.com>',
      to: [email],
      subject: '🎉 Your Challenge Group Code',
      html: `
        <h2>Hi ${userName}!</h2>
        <p>You've successfully created a challenge group.</p>
        <p>Share this code with friends to invite them:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 0.2em; border-radius: 8px; margin: 20px 0;">
          ${groupCode}
        </div>
        <p>Your friends can join by entering this code when they start the challenge.</p>
        <p>Good luck on your journey!</p>
      `,
    })

    if (error) {
      return res.status(400).json({ error })
    }

    return res.status(200).json({ data })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
```

4. **Add environment variable to Vercel**:
   - `RESEND_API_KEY=your_api_key`

5. **Install Resend**:
```bash
npm install resend
```

## Current Workaround (No Email Service Needed)

For now, the group code is:
1. ✅ Shown in a success alert when created
2. ✅ Displayed prominently on the Leaderboard page
3. ✅ Can be copied and shared manually by the user

Users can easily share the code via:
- Copy/paste from the leaderboard
- Screenshot
- Manual entry

## Recommended Next Steps

1. **Short-term**: Current implementation is fine - users can see and share the code from the UI
2. **Medium-term**: Implement Option 1 (Supabase Edge Function) for automated email
3. **Long-term**: Consider adding:
   - Copy-to-clipboard button
   - Social share buttons
   - QR code generation for easy mobile sharing

## Cost Considerations

- **Supabase Edge Functions**: Free tier includes 500K invocations/month
- **Resend**: Free tier includes 3,000 emails/month
- **SendGrid**: Free tier includes 100 emails/day

Choose based on expected volume and budget.
