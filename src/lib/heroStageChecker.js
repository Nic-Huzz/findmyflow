import { supabase } from './supabaseClient'
import { postFeedEvent } from './communityFeed'

/**
 * Checks if a user qualifies for a hero stage graduation.
 * Returns { from, to, stageData } if graduated, or null if no change.
 *
 * Designed to be called on Challenge.jsx mount. Cheap queries (~50ms).
 * Only advances ONE stage per call — subsequent mounts catch further graduations.
 *
 * Stage triggers (see docs/features/experience-dome-full-system-reference.md):
 *   2: First NS check-in
 *   3: Dome completed (10+ ticks)
 *   4: Essence Mirror + avatar
 *   5: Choose Quests completed (1+ quest created)
 *   6: 5+ courage challenges completed
 *   7: First healing flow started
 *   8: 3+ healing outcomes + 20+ courage completed
 *   9: First income > 0 (income_self_reports)
 *   10: 3+ months income > 0
 *   11: Income >= expenses target
 *   12: Self-declared (deferred)
 */
export async function checkHeroGraduation(userId) {
  const { data: stageData } = await supabase
    .from('user_stage_progress')
    .select('current_journey_level, essence_mirror_completed, hero_avatar_url, persona')
    .eq('user_id', userId)
    .maybeSingle()

  const currentStage = stageData?.current_journey_level || 0
  let newStage = null

  // →2: First NS check-in
  if (currentStage < 2) {
    const { count } = await supabase
      .from('nervous_system_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count > 0) newStage = 2
  }

  // 2→3: Dome completed (10+ experience ticks)
  if (currentStage === 2) {
    const { count } = await supabase
      .from('experience_dome_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count >= 10) newStage = 3
  }

  // 3→4: Essence Mirror completed + hero avatar generated
  if (currentStage === 3) {
    if (stageData?.essence_mirror_completed && stageData?.hero_avatar_url) {
      newStage = 4
    }
  }

  // 4→5: Choose Quests completed (1+ quest created)
  if (currentStage === 4) {
    const { count } = await supabase
      .from('quests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')
    if (count > 0) newStage = 5
  }

  // 5→6: 5+ courage challenges completed
  if (currentStage === 5) {
    const { count } = await supabase
      .from('groan_challenges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
    if (count >= 5) newStage = 6
  }

  // 6→7: First healing flow started
  if (currentStage === 6) {
    const { count } = await supabase
      .from('healing_intentions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count > 0) newStage = 7
  }

  // 7→8: 3+ healing flows with outcome + 20+ courage completed
  if (currentStage === 7) {
    const [{ count: healingCount }, { count: courageCount }] = await Promise.all([
      supabase
        .from('healing_intentions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('outcome', 'is', null),
      supabase
        .from('groan_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
    ])
    if (healingCount >= 3 && courageCount >= 20) newStage = 8
  }

  // 8→9: First income reported > 0
  if (currentStage === 8) {
    const { count } = await supabase
      .from('income_self_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('amount_cents', 0)
    if (count > 0) newStage = 9
  }

  // 9→10: 3+ months with income > 0
  if (currentStage === 9) {
    const { count } = await supabase
      .from('income_self_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('amount_cents', 0)
    if (count >= 3) newStage = 10
  }

  // 10→11: Income >= expenses target
  if (currentStage === 10) {
    const [{ data: latest }, { data: stage }] = await Promise.all([
      supabase.from('income_self_reports')
        .select('amount_cents').eq('user_id', userId)
        .order('month_year', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('user_stage_progress')
        .select('expenses_target_cents').eq('user_id', userId).maybeSingle(),
    ])
    if (latest?.amount_cents > 0 && stage?.expenses_target_cents > 0
        && latest.amount_cents >= stage.expenses_target_cents) {
      newStage = 11
    }
  }

  // Stage 12: Self-declared + threshold (deferred)

  // If graduated, update the stage
  if (newStage !== null && newStage > currentStage) {
    const { count } = await supabase
      .from('user_stage_progress')
      .update({ current_journey_level: newStage })
      .eq('user_id', userId)

    // Fallback: if no row existed, create minimal one
    if (count === 0) {
      await supabase
        .from('user_stage_progress')
        .insert({ user_id: userId, current_journey_level: newStage, conversations_logged: 0 })
        .catch(() => {})
    }

    // Auto-post stage graduation to community feed
    const STAGE_NAMES = {
      2: 'Call to Adventure',
      3: 'Refusal of the Call',
      4: 'Meeting the Mentor',
      5: 'Crossing the Threshold',
      6: 'Tests, Allies, Enemies',
      7: 'Approach to the Inmost Cave',
      8: 'The Ordeal',
      9: 'Reward',
      10: 'The Road Back',
      11: 'Resurrection',
    }
    const stageName = STAGE_NAMES[newStage] || `Stage ${newStage}`
    postFeedEvent(userId, 'stage_graduation', `Reached Stage ${newStage}: ${stageName}`)

    // Mystery box: hero stage milestones
    if (newStage === 4 || newStage === 7 || newStage === 9) {
      import('./mysteryBoxes').then(m => {
        const tier = newStage === 9 ? 'legendary' : newStage === 7 ? 'gold' : 'gold'
        m.earnMysteryBox(userId, `hero_stage_${newStage}`, tier)
      }).catch(() => {})
    }

    return {
      from: currentStage,
      to: newStage,
      stageData,
    }
  }

  return null
}
