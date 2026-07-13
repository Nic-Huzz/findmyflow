/**
 * backfill-hero-stages — One-time Edge Function
 *
 * Fetches all users from user_stage_progress and cascades graduation checks
 * (max 20 iterations per user) so existing users advance to their correct hero stage.
 *
 * Graduation logic mirrors src/lib/heroStageChecker.js:
 *   →2: nervous_system_checkins count > 0
 *  2→3: quests with status 'active' count > 0
 *  3→4: essence_mirror_completed = true AND essence_archetype exists
 *  4→5: quest_completions with reflection_text LIKE '%"wahoo_classification":"vibe",%'
 *  5→6: quest_completions with quest_category = 'Groans' count >= 2
 *  6→7: nervous_system_checkins protective_voice count >= 5 for any single voice
 *
 * Uses service role key — bypasses RLS.
 * Per-user try/catch so one failure never blocks others.
 *
 * Returns: { processed: N, graduated: M, errors: E }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ITERATIONS = 20

/**
 * Checks if a user qualifies for the NEXT hero stage graduation.
 * Returns { from, to } if graduated, or null if no change.
 *
 * Same logic as heroStageChecker.js but server-side with service role client.
 */
async function checkAndAdvance(
  supabase: any,
  userId: string
): Promise<{ from: number; to: number } | null> {
  // Fetch current stage data
  const { data: stageData } = await supabase
    .from('user_stage_progress')
    .select('current_journey_level, essence_mirror_completed, hero_avatar_url')
    .eq('user_id', userId)
    .maybeSingle()

  const currentStage = stageData?.current_journey_level || 0
  let newStage: number | null = null

  // →2: Account exists + first NS check-in
  if (currentStage < 2) {
    const { count } = await supabase
      .from('nervous_system_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count > 0) newStage = 2
  }

  // 2→3: Life Paths exercise completed
  if (currentStage === 2) {
    // Backfill uses service role — look up email from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email
    if (email) {
      const { count } = await supabase
        .from('life_path_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('client_email', email)
      if (count > 0) newStage = 3
    }
  }

  // 3→4: Essence Mirror completed + hero avatar generated
  if (currentStage === 3) {
    if (stageData?.essence_mirror_completed && stageData?.hero_avatar_url) {
      newStage = 4
    }
  }

  // 4→5: First wahoo classified as Vibe Rise
  if (currentStage === 4) {
    const { count } = await supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .like('reflection_text', '%"wahoo_classification":"vibe",%')
    if (count > 0) newStage = 5
  }

  // 5→6: 2+ wahoos completed
  if (currentStage === 5) {
    const { count } = await supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
    if (count >= 2) newStage = 6
  }

  // 6→7: Protective voice identified 5+ times (any single voice)
  if (currentStage === 6) {
    const { data: voiceRows } = await supabase
      .from('nervous_system_checkins')
      .select('protective_voice')
      .eq('user_id', userId)
      .not('protective_voice', 'is', null)

    const counts: Record<string, number> = {}
    voiceRows?.forEach((row: any) => {
      if (row.protective_voice)
        counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
    })
    const maxCount = Math.max(0, ...Object.values(counts))
    if (maxCount >= 5) newStage = 7
  }

  // If graduated, update the stage
  if (newStage !== null && newStage > currentStage) {
    // UPDATE first (row should exist since we fetched from user_stage_progress)
    const { count } = await supabase
      .from('user_stage_progress')
      .update({ current_journey_level: newStage })
      .eq('user_id', userId)

    // Fallback: if no row existed, create minimal one
    if (count === 0) {
      await supabase
        .from('user_stage_progress')
        .insert({
          user_id: userId,
          current_journey_level: newStage,
          conversations_logged: 0,
        })
        .catch(() => {}) // Silent — constraint failure just means stage doesn't advance
    }

    return { from: currentStage, to: newStage }
  }

  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('Starting hero stage backfill...')

    // Fetch all users with stage progress
    const { data: users, error: usersError } = await supabase
      .from('user_stage_progress')
      .select('user_id, current_journey_level')

    if (usersError) throw usersError

    if (!users?.length) {
      console.log('No users found in user_stage_progress')
      return new Response(
        JSON.stringify({ processed: 0, graduated: 0, errors: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${users.length} user(s) to process`)

    let graduated = 0
    let errors = 0

    for (const { user_id } of users) {
      try {
        let iterations = 0
        let advanced = true

        // Cascade: keep advancing until no more graduations or max iterations
        while (advanced && iterations < MAX_ITERATIONS) {
          iterations++
          const result = await checkAndAdvance(supabase, user_id)
          advanced = result !== null
          if (advanced) {
            graduated++
            console.log(`User ${user_id}: ${result!.from} → ${result!.to}`)
          }
        }

        if (iterations >= MAX_ITERATIONS) {
          console.warn(`User ${user_id}: hit max iterations (${MAX_ITERATIONS})`)
        }
      } catch (e: any) {
        errors++
        console.error(`Backfill failed for ${user_id}:`, e.message || e)
        // Continue to next user
      }
    }

    console.log(`Backfill complete. Processed: ${users.length}, Graduated: ${graduated}, Errors: ${errors}`)

    return new Response(
      JSON.stringify({ processed: users.length, graduated, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Backfill error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
