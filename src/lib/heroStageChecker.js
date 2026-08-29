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
 *   9: Scale Portal started (remarkable_angles or scale_diagnostics)
 *   10-12: Deferred (need income tracking)
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
      .from('experience_checkins')
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

  // 8→9: Scale Portal started (remarkable_angles or scale_diagnostics exist)
  if (currentStage === 8) {
    const [{ count: raCount }, { count: sdCount }] = await Promise.all([
      supabase
        .from('remarkable_angles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('scale_diagnostics')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])
    if (raCount > 0 || sdCount > 0) newStage = 9
  }

  // Stages 10-12: Deferred — need income tracking. Users cap at 9.

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
