/**
 * generate-zarlo-brief — Daily Cron Edge Function
 *
 * Runs daily at 4am UTC via pg_cron. For each active user (checkin in last 14 days):
 * 1. Queries 10 data sources (checkins, healing, wahoos, quests, reviews, etc.)
 * 2. Computes patterns, thresholds, contradictions
 * 3. Upserts a ~500 token structured JSON brief into zarlo_briefs
 *
 * Uses service role key — bypasses RLS entirely.
 * One user's failure never blocks others.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Helpers ───

function withinDays(row: any, days: number, offsetDays = 0): boolean {
  const created = new Date(row.created_at || row.completed_at || row.generated_at)
  const now = Date.now()
  const start = now - (days + offsetDays) * 86400000
  const end = now - offsetDays * 86400000
  return created.getTime() >= start && created.getTime() <= end
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── Pattern Detection Algorithms ───

/**
 * Day-of-week pattern detection.
 * Flag any day where a single state is >60% of check-ins for that day
 * AND has at least 3 data points for that day.
 */
function detectDayOfWeekPatterns(checkins: any[]): Record<string, { [state: string]: number }> | null {
  const dailyCheckins = checkins.filter(c => c.checkin_type === 'daily')
  if (dailyCheckins.length < 7) return null

  // Group by day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const dayGroups: Record<number, any[]> = {}
  for (const c of dailyCheckins) {
    const day = new Date(c.created_at).getUTCDay()
    if (!dayGroups[day]) dayGroups[day] = []
    dayGroups[day].push(c)
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const patterns: Record<string, { [state: string]: number }> = {}

  for (const [dayNum, dayCheckins] of Object.entries(dayGroups)) {
    if (dayCheckins.length < 3) continue

    // Count states for this day
    const stateCounts: Record<string, number> = {}
    for (const c of dayCheckins) {
      const state = c.before_state || 'unknown'
      stateCounts[state] = (stateCounts[state] || 0) + 1
    }

    // Check if any state is >60%
    for (const [state, count] of Object.entries(stateCounts)) {
      const pct = Math.round((count / dayCheckins.length) * 100)
      if (pct > 60) {
        const dayName = dayNames[Number(dayNum)]
        patterns[dayName] = { [`${state}_pct`]: pct }
      }
    }
  }

  return Object.keys(patterns).length > 0 ? patterns : null
}

/**
 * Protective voice counting from healing intentions.
 * The `pattern` field contains the voice name (e.g., "perfectionist", "ghost").
 */
function countProtectiveVoices(healingIntentions: any[]): {
  voices: Record<string, number>
  dominant: { name: string; count: number } | null
} {
  const counts: Record<string, number> = {}
  for (const h of healingIntentions) {
    if (h.pattern) {
      counts[h.pattern] = (counts[h.pattern] || 0) + 1
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const dominant = sorted.length > 0
    ? { name: sorted[0][0], count: sorted[0][1] }
    : null

  return { voices: counts, dominant }
}

/**
 * Wahoo classification trends.
 * Compares pressure percentage between first month and current month of data.
 */
function detectWahooTrend(wahoos: any[]): { pressure_pct_month1: number; pressure_pct_current: number } | null {
  if (wahoos.length < 3) return null

  const sorted = [...wahoos].sort((a, b) =>
    new Date(a.completed_at || a.created_at).getTime() - new Date(b.completed_at || b.created_at).getTime()
  )

  // Split into first-month and last-month
  const firstDate = new Date(sorted[0].completed_at || sorted[0].created_at).getTime()
  const month1 = sorted.filter(w => {
    const t = new Date(w.completed_at || w.created_at).getTime()
    return t < firstDate + 30 * 86400000
  })
  const current = sorted.filter(w => withinDays(w, 30))

  if (month1.length === 0 && current.length === 0) return null

  const month1Pressure = month1.length > 0
    ? Math.round((month1.filter(w => w.wahoo_classification === 'anxious').length / month1.length) * 100)
    : 0
  const currentPressure = current.length > 0
    ? Math.round((current.filter(w => w.wahoo_classification === 'anxious').length / current.length) * 100)
    : 0

  return { pressure_pct_month1: month1Pressure, pressure_pct_current: currentPressure }
}

/**
 * Visibility layer distribution from completed groan challenges.
 */
function countVisibilityLayers(wahoos: any[]): Record<string, number> {
  const layers: Record<string, number> = {
    screen: 0,
    live: 0,
    money: 0,
    vulnerable: 0,
    authority: 0,
  }
  for (const w of wahoos) {
    if (w.visibility_layer && layers.hasOwnProperty(w.visibility_layer)) {
      layers[w.visibility_layer]++
    }
  }
  return layers
}

/**
 * Contradiction detection (exact spec logic).
 */
function detectContradictions(
  checkins: any[],
  wahoos: any[],
  healingIntentions: any[],
  dominantVoiceCount: number
): string[] {
  const contradictions: string[] = []

  // Contradiction 1: "Reports Safe but Pressure wahoos increasing"
  const last14dCheckins = checkins.filter(c => c.checkin_type === 'daily' && withinDays(c, 14))
  if (last14dCheckins.length > 0) {
    const safePct = last14dCheckins.filter(c => c.before_state === 'ventral').length / last14dCheckins.length
    const last14dWahoos = wahoos.filter(w => withinDays(w, 14))
    if (last14dWahoos.length > 0) {
      const pressurePct = last14dWahoos.filter(w => w.wahoo_classification === 'anxious').length / last14dWahoos.length
      if (safePct > 0.5 && pressurePct > 0.3) {
        contradictions.push('Reports Safe but Pressure wahoos increasing')
      }
    }
  }

  // Contradiction 2: "Healing tab declining while voice count rising"
  const healingLast30 = healingIntentions.filter(h => withinDays(h, 30)).length
  const healingFirst30 = healingIntentions.filter(h => withinDays(h, 30, 60)).length
  if (healingFirst30 > 0 && healingLast30 < healingFirst30 * 0.5 && dominantVoiceCount >= 3) {
    contradictions.push('Healing tab declining while protective voice count rising')
  }

  return contradictions
}

/**
 * Threshold detection (exact spec logic).
 */
function detectThresholds(
  dominantVoiceCount: number,
  currentStreak: number,
  heroStage: number,
  lastProgressDate: Date | null
): {
  voice_graduation_ready: boolean
  voice_count_to_graduate: number
  streak_milestone_approaching: string | null
  stage_stuck_days: number
} {
  // Voice graduation
  const voiceCountToGraduate = Math.max(0, 5 - dominantVoiceCount)
  const voiceGraduationReady = voiceCountToGraduate === 0

  // Streak milestone
  const MILESTONES = [7, 14, 21, 30, 60, 100, 200, 365]
  const nextMilestone = MILESTONES.find(m => m > currentStreak)
  const streakMilestoneApproaching = nextMilestone && (nextMilestone - currentStreak) <= 3
    ? `${nextMilestone}_day` : null

  // Stage stuck (days since last stage-relevant action)
  const STUCK_THRESHOLDS: Record<number, number> = { 4: 7, 5: 7, 6: 7, 7: 7, 8: 14, 9: 14 }
  const threshold = STUCK_THRESHOLDS[heroStage] || 14
  let daysSinceLastProgress = 0
  if (lastProgressDate) {
    daysSinceLastProgress = Math.floor((Date.now() - lastProgressDate.getTime()) / 86400000)
  }
  const stageStuckDays = daysSinceLastProgress > threshold ? daysSinceLastProgress : 0

  return {
    voice_graduation_ready: voiceGraduationReady,
    voice_count_to_graduate: voiceCountToGraduate,
    streak_milestone_approaching: streakMilestoneApproaching,
    stage_stuck_days: stageStuckDays,
  }
}

// ─── Main Brief Generation ───

async function generateBriefForUser(supabase: any, userId: string): Promise<any> {
  // Run all 10 queries in parallel for speed
  const [
    checkinsRes,
    healingRes,
    wahoosRes,
    completionsRes,
    questsRes,
    reviewsRes,
    stageRes,
    experienceRes,
    crossPollinationRes,
    streakRes,
  ] = await Promise.all([
    // 1. nervous_system_checkins — ALL
    supabase
      .from('nervous_system_checkins')
      .select('before_state, checkin_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    // 2. healing_intentions — ALL (pattern = protective voice name)
    supabase
      .from('healing_intentions')
      .select('pattern, healing_stage, created_at, updated_at')
      .eq('user_id', userId),

    // 3. groan_challenges (completed) — ALL
    supabase
      .from('groan_challenges')
      .select('visibility_layer, wahoo_classification, completed_at, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed'),

    // 4. quest_completions — ALL
    supabase
      .from('quest_completions')
      .select('reflection_text, quest_category, completed_at, created_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }),

    // 5. quests — CURRENT (active)
    supabase
      .from('quests')
      .select('id, label, predicted_state, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'active'),

    // 6. weekly_reviews — ALL
    supabase
      .from('weekly_reviews')
      .select('scores, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    // 7. user_stage_progress — CURRENT
    supabase
      .from('user_stage_progress')
      .select('current_journey_level, essence_archetype, hero_name, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),

    // 8. experience_checkins — ALL
    supabase
      .from('experience_checkins')
      .select('predicted_state, actual_state, created_at')
      .eq('user_id', userId),

    // 9. quest_cross_pollination — ALL
    supabase
      .from('quest_cross_pollination')
      .select('source_quest_id, target_quest_id, created_at')
      .eq('user_id', userId),

    // 10. groan_streaks — CURRENT
    supabase
      .from('groan_streaks')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  // Extract data with safe defaults for new users
  const checkins = checkinsRes.data || []
  const healingIntentions = healingRes.data || []
  const wahoos = wahoosRes.data || []
  const completions = completionsRes.data || []
  const quests = questsRes.data || []
  const reviews = reviewsRes.data || []
  const stageData = stageRes.data
  const experienceCheckins = experienceRes.data || []
  const crossPollination = crossPollinationRes.data || []
  const streakData = streakRes.data

  // ─── Compute patterns ───

  const heroStage = stageData?.current_journey_level || 0
  const currentStreak = streakData?.current_streak || 0

  // Protective voices
  const { voices: protectiveVoices, dominant: dominantVoice } = countProtectiveVoices(healingIntentions)
  const dominantVoiceCount = dominantVoice?.count || 0

  // Day-of-week patterns
  const dayOfWeekPatterns = detectDayOfWeekPatterns(checkins)

  // Wahoo trend
  const wahooTrend = detectWahooTrend(wahoos)

  // Visibility layers
  const visibilityLayers = countVisibilityLayers(wahoos)

  // Healing tab frequency
  const healingLast30 = healingIntentions.filter(h => withinDays(h, 30)).length
  const healingFirst30 = healingIntentions.filter(h => withinDays(h, 30, 60)).length

  // Last checkin state
  const lastCheckin = checkins.find((c: any) => c.checkin_type === 'daily')
  const lastCheckinState = lastCheckin?.before_state || null

  // Capacity score approximation (from most recent daily checkins)
  const recentCheckins = checkins.filter((c: any) => c.checkin_type === 'daily' && withinDays(c, 7))
  let capacityScore: number | null = null
  if (recentCheckins.length > 0) {
    const stateValues: Record<string, number> = {
      dorsal: -2, sympathetic: -1, ventral: 1, vibe_rise: 2,
    }
    const total = recentCheckins.reduce((sum: number, c: any) => sum + (stateValues[c.before_state] || 0), 0)
    // Normalize to 0-100 scale (range is -2 to +2 per checkin)
    capacityScore = Math.round(((total / recentCheckins.length + 2) / 4) * 100)
  }

  // ─── Convergence signals ───
  const crossPollinationPairs: string[][] = []
  const questMap: Record<string, string> = {}
  for (const q of quests) {
    questMap[q.id] = q.label
  }
  for (const cp of crossPollination) {
    const source = questMap[cp.source_quest_id] || cp.source_quest_id
    const target = questMap[cp.target_quest_id] || cp.target_quest_id
    crossPollinationPairs.push([source, target])
  }

  // ─── Last progress date (for stuck detection) ───
  let lastProgressDate: Date | null = null

  // Check quest_completions
  if (completions.length > 0) {
    const d = new Date(completions[0].completed_at || completions[0].created_at)
    if (!lastProgressDate || d > lastProgressDate) lastProgressDate = d
  }

  // Check healing_intentions
  for (const h of healingIntentions) {
    if (h.updated_at) {
      const d = new Date(h.updated_at)
      if (!lastProgressDate || d > lastProgressDate) lastProgressDate = d
    }
  }

  // Check stage progress updated_at
  if (stageData?.updated_at) {
    const d = new Date(stageData.updated_at)
    if (!lastProgressDate || d > lastProgressDate) lastProgressDate = d
  }

  // ─── Thresholds ───
  const thresholds = detectThresholds(dominantVoiceCount, currentStreak, heroStage, lastProgressDate)

  // ─── Contradictions ───
  const contradictions = detectContradictions(checkins, wahoos, healingIntentions, dominantVoiceCount)

  // ─── Build the brief ───
  return {
    generated_at: new Date().toISOString(),
    current_state: {
      hero_stage: heroStage,
      streak_days: currentStreak,
      capacity_score: capacityScore,
      essence_archetype: stageData?.essence_archetype || null,
      essence_name: stageData?.hero_name || null,
      last_checkin_state: lastCheckinState,
    },
    patterns: {
      day_of_week: dayOfWeekPatterns,
      protective_voices: Object.keys(protectiveVoices).length > 0 ? protectiveVoices : null,
      dominant_voice: dominantVoice,
      wahoo_trend: wahooTrend,
      visibility_layers: visibilityLayers,
      healing_tab_visits_last_30d: healingLast30,
      healing_tab_visits_first_30d: healingFirst30,
    },
    convergence: {
      cross_pollination_pairs: crossPollinationPairs.length > 0 ? crossPollinationPairs : null,
      cross_pollination_count: crossPollination.length,
    },
    thresholds,
    contradictions: contradictions.length > 0 ? contradictions : null,
  }
}

// ─── Server ───

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('Starting Zarlo Brief generation...')

    // 1. Fetch active users (had a checkin in last 14 days)
    const { data: activeUsers, error: usersError } = await supabase
      .from('nervous_system_checkins')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .order('user_id')

    if (usersError) throw usersError

    if (!activeUsers?.length) {
      console.log('No active users found')
      return jsonResponse({ message: 'No active users', processed: 0 })
    }

    const uniqueUserIds = [...new Set(activeUsers.map((r: any) => r.user_id))]
    console.log(`Found ${uniqueUserIds.length} active user(s)`)

    let successCount = 0
    let errorCount = 0

    // 2. Process each user
    for (const userId of uniqueUserIds) {
      try {
        const brief = await generateBriefForUser(supabase, userId)

        const { error: upsertError } = await supabase
          .from('zarlo_briefs')
          .upsert(
            {
              user_id: userId,
              brief,
              generated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )

        if (upsertError) {
          console.error(`Upsert failed for ${userId}:`, upsertError.message)
          errorCount++
        } else {
          successCount++
        }
      } catch (e: any) {
        console.error(`Brief failed for ${userId}:`, e.message || e)
        errorCount++
        // Skip and continue — one user's failure shouldn't block others
      }
    }

    console.log(`Zarlo Brief generation complete. Success: ${successCount}, Errors: ${errorCount}`)
    return jsonResponse({
      success: true,
      processed: uniqueUserIds.length,
      successCount,
      errorCount,
    })
  } catch (error: any) {
    console.error('Zarlo Brief generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
