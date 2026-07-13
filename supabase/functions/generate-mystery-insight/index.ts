/**
 * Edge Function: generate-mystery-insight
 * Generates personalised AI Mirror insights for mystery boxes.
 * Called when a user opens a box. Reads user data, picks content type,
 * generates insight via Claude, saves to mystery_boxes.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Data thresholds per content type
const THRESHOLDS = {
  pattern_mirror: { checkinDays: 14 },
  shadow_reveal: { zoneDiagnosis: true, tuneDays: 7 },
  capacity_equation: { scoringDays: 7 },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { boxId } = await req.json()
    if (!boxId) {
      return new Response(JSON.stringify({ error: 'boxId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch the box
    const { data: box, error: boxError } = await supabase
      .from('mystery_boxes')
      .select('*')
      .eq('id', boxId)
      .eq('user_id', user.id)
      .is('opened_at', null)
      .maybeSingle()

    if (boxError || !box) {
      return new Response(JSON.stringify({ error: 'Box not found or already opened' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Gather user data in parallel
    const [
      checkins, wahoos, profile, capacityData, zoneDiagnoses, tuneData
    ] = await Promise.all([
      // NS check-ins (last 30 days)
      supabase.from('nervous_system_checkins')
        .select('before_state, after_state, checkin_type, created_at, protective_voice')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100),

      // Wahoo completions (all time)
      supabase.from('quest_completions')
        .select('quest_id, quest_category, reflection_text, created_at')
        .eq('user_id', user.id)
        .eq('quest_category', 'Groans')
        .order('created_at', { ascending: false })
        .limit(50),

      // Profile
      supabase.from('lead_flow_profiles')
        .select('essence_archetype, custom_essence_name, protective_archetype')
        .eq('user_id', user.id)
        .maybeSingle(),

      // Weekly scores (last 8 weeks)
      supabase.from('challenge_weekly_scores')
        .select('week_start_date, business_score, healing_score, courage_score')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(8),

      // Zone diagnoses
      supabase.from('user_level_progress')
        .select('current_level, zone_diagnosis_zone, zone_diagnosis_boss')
        .eq('user_id', user.id),

      // Tune tab data (practices + drains)
      supabase.from('nervous_system_checkins')
        .select('checkin_type, before_state, created_at')
        .eq('user_id', user.id)
        .in('checkin_type', ['daily', 'practice', 'drain'])
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .limit(200),
    ])

    // Determine content type based on available data
    const checkinDays = new Set(
      (checkins.data || []).map(c => c.created_at?.slice(0, 10))
    ).size
    const hasZoneDiagnosis = (zoneDiagnoses.data || []).filter(z => z.zone_diagnosis_zone).length > 0
    const tuneDays = new Set(
      (tuneData.data || []).map(c => c.created_at?.slice(0, 10))
    ).size
    const scoringDays = (capacityData.data || []).length * 7

    // Pick the best content type the user qualifies for
    let contentType = 'pattern_mirror' // default
    const eligible: string[] = []

    if (checkinDays >= THRESHOLDS.pattern_mirror.checkinDays) {
      eligible.push('pattern_mirror')
    }
    if (hasZoneDiagnosis && tuneDays >= THRESHOLDS.shadow_reveal.tuneDays) {
      eligible.push('shadow_reveal')
    }
    if (scoringDays >= THRESHOLDS.capacity_equation.scoringDays) {
      eligible.push('capacity_equation')
    }

    if (eligible.length > 0) {
      // Pick randomly from eligible types for variety
      contentType = eligible[Math.floor(Math.random() * eligible.length)]
    }

    // Build the prompt based on content type
    const essenceName = profile.data?.custom_essence_name || profile.data?.essence_archetype || 'Unknown'
    const protectiveArchetype = profile.data?.protective_archetype || null

    // Parse wahoo classifications
    const wahooClassifications: Record<string, number> = {}
    const wahooCategories: Record<string, number> = {}
    ;(wahoos.data || []).forEach(w => {
      try {
        const ref = JSON.parse(w.reflection_text || '{}')
        const cls = ref.wahoo_classification
        if (cls) wahooClassifications[cls] = (wahooClassifications[cls] || 0) + 1
        const cat = ref.visibility_layer
        if (cat) wahooCategories[cat] = (wahooCategories[cat] || 0) + 1
      } catch {}
    })

    // Count states
    const stateCounts: Record<string, number> = {}
    ;(checkins.data || []).forEach(c => {
      if (c.before_state) stateCounts[c.before_state] = (stateCounts[c.before_state] || 0) + 1
    })

    // Protective voices
    const voiceCounts: Record<string, number> = {}
    ;(checkins.data || []).forEach(c => {
      if (c.protective_voice) voiceCounts[c.protective_voice] = (voiceCounts[c.protective_voice] || 0) + 1
    })

    // Day-of-week patterns
    const dayOfWeekStates: Record<string, string[]> = {}
    ;(checkins.data || []).forEach(c => {
      const day = new Date(c.created_at).toLocaleDateString('en-US', { weekday: 'long' })
      if (!dayOfWeekStates[day]) dayOfWeekStates[day] = []
      if (c.before_state) dayOfWeekStates[day].push(c.before_state)
    })

    // Zone diagnosis summaries
    const zoneResults = (zoneDiagnoses.data || [])
      .filter(z => z.zone_diagnosis_zone)
      .map(z => `Level ${z.current_level}: zone=${z.zone_diagnosis_zone}, boss=${z.zone_diagnosis_boss}`)
      .join('\n')

    // Score trends
    const scoreTrends = (capacityData.data || []).map(s =>
      `${s.week_start_date}: practices=${s.business_score}, courage=${s.courage_score}, healing=${s.healing_score}`
    ).join('\n')

    const PROMPTS: Record<string, string> = {
      pattern_mirror: `You are an AI Mirror inside a personal growth app. You have been observing this person's behavioural data and must reveal ONE specific, surprising pattern.

USER DATA:
Essence archetype: ${essenceName}
Check-in days: ${checkinDays} days over last 30 days
State distribution: ${JSON.stringify(stateCounts)}
Day-of-week patterns: ${JSON.stringify(dayOfWeekStates)}
Wahoo classifications: ${JSON.stringify(wahooClassifications)}
Wahoo visibility layers: ${JSON.stringify(wahooCategories)}
Total wahoos: ${(wahoos.data || []).length}

RULES:
- Reveal ONE specific pattern with data to back it up (days, counts, percentages).
- Make it feel like "how did you know that?" not "here's a generic insight."
- 2-3 sentences max. No fluff. No em dashes. No colons in headers.
- Write so a 12-year-old would understand.
- Output PLAIN TEXT only. Never use markdown (no **, ##, *, etc). No bullet points.
- Start with the observation, end with what it means for them.`,

      shadow_reveal: `You are an AI Mirror. You connect this person's protective behaviour patterns to what they avoid.

USER DATA:
Essence archetype: ${essenceName}
Protective archetype: ${protectiveArchetype || 'Not identified'}
Protective voice counts: ${JSON.stringify(voiceCounts)}
Zone diagnosis results: ${zoneResults || 'None'}
Wahoo visibility layers: ${JSON.stringify(wahooCategories)}
Wahoo classifications: ${JSON.stringify(wahooClassifications)}
State distribution: ${JSON.stringify(stateCounts)}

RULES:
- Connect their protective voice to a specific avoidance pattern in their data.
- Name the voice, name what they avoid, name what it costs them.
- 2-3 sentences max. No fluff. No em dashes. No colons in headers.
- Write so a 12-year-old would understand.
- Output PLAIN TEXT only. Never use markdown (no **, ##, *, etc). No bullet points.
- Be compassionate but honest. This should land like a loving truth.`,

      capacity_equation: `You are an AI Mirror. You break down what's driving or blocking this person's capacity score.

USER DATA:
Essence archetype: ${essenceName}
Weekly score trends (most recent first):
${scoreTrends || 'No weekly data yet'}
State distribution: ${JSON.stringify(stateCounts)}
Wahoo classifications: ${JSON.stringify(wahooClassifications)}
Total wahoos: ${(wahoos.data || []).length}
Check-in days: ${checkinDays}

RULES:
- Name the specific bottleneck or strength in their capacity equation.
- Use their actual numbers. "Your healing score dropped 40% this week" not "you might want to focus on healing."
- 2-3 sentences max. No fluff. No em dashes. No colons in headers.
- Write so a 12-year-old would understand.
- Output PLAIN TEXT only. Never use markdown (no **, ##, *, etc). No bullet points.
- End with one actionable thing they could try.`,
    }

    const prompt = PROMPTS[contentType]

    // Generate insight
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const insight = response.content[0]?.type === 'text' ? response.content[0].text : ''

    if (!insight) {
      return new Response(JSON.stringify({ error: 'Failed to generate insight' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Save insight and mark box as opened
    const { error: updateError } = await supabase
      .from('mystery_boxes')
      .update({
        content_type: contentType,
        content: insight,
        opened_at: new Date().toISOString(),
      })
      .eq('id', boxId)

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to save insight' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      content_type: contentType,
      content: insight,
      box_tier: box.box_tier,
      trigger_type: box.trigger_type,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
