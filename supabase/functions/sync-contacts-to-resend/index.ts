import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AUDIENCES = {
  vibe_rise_events: {
    id: 'c9e58241-1a76-4aea-9194-fde1e74aa8bd',
    tags: [
      'Event Participant', 'Vibe Rise Fest May 2026', 'Healing But Fun October 2025',
      'Healing But Fun August 2025', '12/3/24 - Istana', 'Istana Huzzrise 21/4/24',
      'Istana Disco 14/4/24', '6/12/24 - Istana', '4/5/24 Mantra HuzzRise',
      'HuzzRise Mantra (4/5/24)', '30/3/25 - Coffee Rave', 'Istana Disco 26/3/24',
      '15/11/24 - Istana', '11/10/24 - Istana', '25/5/24', '18/5/24 - HuzzRise Mantra',
      'healing-but-fun-retreat', 'rise-and-vibe-fam', 'vibe-rise', 'nyepi'
    ]
  },
  buildwithai: {
    id: '71b80a19-582f-4965-989d-a6000a789011',
    tags: ['buildwithai', 'buildwithai-user', 'buildwithai-lead', 'BuildWithAI',
      'coding-client', 'claude-code-poll-2026-03-25']
  },
  app_users: {
    id: 'e7c42769-747f-4468-ac81-f2e1ecde5e29',
    tags: ['app-signup', 'findmyflow', 'archetype-quiz', 'earthquake-quiz']
  },
  general: {
    id: 'ef1543b9-9b16-429e-a948-8d722eae4d5d',
    tags: [] as string[]
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  if (!name) return { firstName: '', lastName: '' }
  const parts = name.trim().split(' ')
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  }
}

async function createResendContact(
  apiKey: string,
  audienceId: string,
  email: string,
  firstName: string,
  lastName: string,
  unsubscribed: boolean
) {
  const body: Record<string, unknown> = { email, unsubscribed }
  if (firstName) body.first_name = firstName
  if (lastName) body.last_name = lastName

  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    return { success: false, error: err }
  }
  return { success: true }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { audience, offset = 0, limit = 80 } = await req.json().catch(() => ({ audience: '', offset: 0, limit: 80 }))
  if (!audience || !AUDIENCES[audience as keyof typeof AUDIENCES]) {
    return new Response(JSON.stringify({
      error: 'Provide { "audience": "vibe_rise_events" | "buildwithai" | "app_users" | "general" }'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const config = AUDIENCES[audience as keyof typeof AUDIENCES]

  // Fetch contacts with emails (ordered for stable pagination)
  const { data: contacts, error } = await supabase
    .from('crm_contacts')
    .select('name, email, tags')
    .not('email', 'is', null)
    .order('created_at', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Deduplicate by lowercase email
  const seen = new Set<string>()
  const unique = contacts.filter(c => {
    const el = c.email.toLowerCase()
    if (seen.has(el)) return false
    seen.add(el)
    return true
  })

  // Filter for this audience
  let allAudienceContacts
  if (audience === 'general') {
    allAudienceContacts = unique
  } else {
    allAudienceContacts = unique.filter(c =>
      c.tags && c.tags.some((t: string) => config.tags.includes(t))
    )
  }

  const audienceContacts = allAudienceContacts.slice(offset, offset + limit)
  const hasMore = offset + limit < allAudienceContacts.length

  let created = 0, errors = 0
  const errorDetails: string[] = []

  for (let i = 0; i < audienceContacts.length; i++) {
    const c = audienceContacts[i]
    const { firstName, lastName } = splitName(c.name)
    const isUnsub = c.tags?.includes('unsubscribed') || false

    const res = await createResendContact(
      resendApiKey, config.id, c.email, firstName, lastName, isUnsub
    )

    if (res.success) {
      created++
    } else {
      errors++
      if (errorDetails.length < 5) errorDetails.push(`${c.email}: ${res.error}`)
    }

    // Rate limit: 4 per second
    if ((i + 1) % 4 === 0) {
      await sleep(1100)
    }
  }

  return new Response(JSON.stringify({
    audience,
    total_in_audience: allAudienceContacts.length,
    batch: `${offset}-${offset + audienceContacts.length}`,
    created,
    errors,
    has_more: hasMore,
    next_offset: hasMore ? offset + limit : null,
    error_samples: errorDetails
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
