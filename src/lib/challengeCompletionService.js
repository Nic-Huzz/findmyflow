/**
 * challengeCompletionService.js — Shared save logic for courage challenge completion.
 *
 * Used by: GroanCompletionModal (3-screen flow) and ProgressTab (reflection cards).
 * Extracted to avoid duplicating RP/level-up/evidence logic.
 */

import { supabase } from './supabaseClient'
import { completeGroanChallenge } from './crm/groanChallengeService'
import { getScoringCategory } from './scoringCategories'
import { getWeekStartLocal } from './dateUtils'
import { getLevel, getLevelNumber } from './crm/statsService'
import { postFeedEvent } from './communityFeed'
import { earnMysteryBox, checkNewCategoryBox } from './mysteryBoxes'
import { trackWahooCompleted } from './analytics'
import { awardMovementXP } from './movementXP'

// RP per wahoo classification (Hades model: harder states earn MORE)
const WAHOO_RP = {
  vibe: 10,      // 7 base + 3 identity bonus
  wahoo: 10,     // legacy compat
  peace: 7,      // base
  anxious: 10,   // 7 base + 3 edge-push bonus (Pressure is as brave as Vibe Rise)
  shutdown: 9,   // 7 base + 2 honesty bonus
}

/**
 * Full save for completing a courage challenge.
 * Called from GroanCompletionModal after the 3-screen flow.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {object} params.challenge - groan_challenge row (id, title, source_label, visibility_layer, challenge_source, dimension_values)
 * @param {string} params.wahooClassification - 'vibe' | 'peace' | 'anxious' | 'shutdown'
 * @param {string|null} params.beforeState - NS state before challenge
 * @param {string|null} params.afterState - NS state after challenge
 * @param {string|null} params.aftertaste - 'yes' | 'not_sure' | 'no'
 * @param {string|null} params.voice - gap voice (when experienced > predicted)
 * @param {string|null} params.sourceQuestId - quest this challenge belongs to
 * @param {object} [params.extraFields] - additional groan_challenges fields to save (prediction error, universe response, etc.)
 * @param {object} [params.reflectionPayload] - additional JSON fields for quest_completions.reflection_text
 * @param {string[]|null} [params.selectedCrossQuests] - cross-pollination target quest IDs
 * @param {string|null} [params.expectationResult] - 'better' | 'expected' | 'worse' (affects safety_status)
 * @returns {Promise<{ rpAwarded: number, leveledUp: boolean }>}
 */
export async function saveChallengeCompletion({
  userId,
  challenge,
  wahooClassification,
  beforeState = null,
  afterState = null,
  aftertaste = null,
  voice = null,
  sourceQuestId = null,
  extraFields = {},
  reflectionPayload = {},
  selectedCrossQuests = [],
  expectationResult = null,
}) {
  const rpAwarded = WAHOO_RP[wahooClassification] || 7
  const questId = `play_list_challenge_${challenge.id}`

  // 1. Mark groan challenge as completed
  const { error: groanError } = await completeGroanChallenge(challenge.id, {
    reflectionText: reflectionPayload.reflection || null,
  })
  if (groanError) throw groanError

  // 1b. Save extra groan_challenges fields (prediction error, voice, universe response, etc.)
  const allExtraFields = { ...extraFields }
  if (voice) allExtraFields.gap_voice = voice
  if (Object.keys(allExtraFields).length > 0) {
    await supabase
      .from('groan_challenges')
      .update(allExtraFields)
      .eq('id', challenge.id)
      .catch(e => console.warn('Challenge data save error:', e))
  }

  // 2. Upsert quest_completions (delete old first to prevent RP farming)
  try {
    await supabase.from('quest_completions').delete()
      .eq('user_id', userId).eq('quest_id', questId)
  } catch {} // ignore if no existing record

  const { error: questError } = await supabase.from('quest_completions').insert({
    user_id: userId,
    challenge_instance_id: null,
    quest_id: questId,
    quest_category: 'Groans',
    quest_type: 'Rewire',
    points_earned: rpAwarded,
    challenge_day: 0,
    project_id: null,
    reflection_text: JSON.stringify({
      challenge_id: challenge.id,
      source_label: challenge.source_label,
      visibility_layer: challenge.visibility_layer,
      before_state: beforeState,
      after_state: afterState,
      wahoo_classification: wahooClassification,
      identity_statement: wahooClassification === 'anxious' ? null : (reflectionPayload.identity_statement || null),
      voice_objection: wahooClassification === 'anxious' ? (reflectionPayload.identity_statement || null) : null,
      expectation_result: expectationResult,
      reflection: reflectionPayload.reflection || null,
      life_fuel: reflectionPayload.life_fuel || null,
      aftertaste,
      universe_response: allExtraFields.universe_response || null,
      universe_response_note: allExtraFields.universe_response_note || null,
    }),
    aftertaste,
  })
  if (questError) throw questError

  // 3. NS check-in
  await supabase.from('nervous_system_checkins').insert({
    user_id: userId,
    before_state: beforeState,
    after_state: afterState,
    checkin_type: 'playlist',
    source_quest_id: questId,
    source_challenge_id: challenge.id,
  }).catch(e => console.warn('NS check-in insert error:', e))

  // 4. Award RP
  await supabase.rpc('increment_scores', {
    p_user_id: userId,
    p_project_id: null,
    p_category: getScoringCategory('Groans'),
    p_points: rpAwarded,
    p_week_start: getWeekStartLocal(),
  }).catch(e => console.warn('Score increment error:', e))

  // 4a. Level-up detection
  let leveledUp = false
  try {
    const { data: freshScores } = await supabase
      .from('user_lifetime_scores')
      .select('lifetime_total_score')
      .eq('user_id', userId)
      .is('project_id', null)
      .maybeSingle()
    const freshXP = freshScores?.lifetime_total_score || 0
    const priorXP = freshXP - rpAwarded
    if (getLevelNumber(freshXP) > getLevelNumber(priorXP)) {
      leveledUp = true
      const newLevel = getLevel(freshXP)
      postFeedEvent(userId, 'level_up', `Reached ${newLevel?.name || 'a new level'}`)
    }
  } catch {}

  // 4b. First wahoo + mystery box checks
  try {
    const { count } = await supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
    if (count === 1) {
      postFeedEvent(userId, 'first_wahoo', 'Completed their first wahoo')
      earnMysteryBox(userId, 'first_wahoo', 'bronze')
    }
  } catch {}

  // 4c. First vibe rise
  if (wahooClassification === 'vibe') {
    postFeedEvent(userId, 'first_vibe_rise', 'Reached Vibe Rise for the first time')
  }

  // 4d. Mystery box: new wahoo category check
  checkNewCategoryBox(userId, challenge.visibility_layer).catch(() => {})

  // 4e. Track analytics
  trackWahooCompleted({ challengeId: challenge.id })

  // 4f. Award Movement XP for Strike completion
  if (challenge.challenge_source === 'strike') {
    awardMovementXP(userId, 'strike_complete', challenge.title)
  }

  // 5. Sync linked quest_tasks: mark done + set safety_status
  // expectationResult removed from completion flow — safety derived from NS state only
  const isSafe = ['vibe', 'peace'].includes(wahooClassification)
  await supabase
    .from('quest_tasks')
    .update({
      done: true,
      completed_at: new Date().toISOString(),
      safety_status: isSafe ? 'safe' : 'not_safe',
    })
    .eq('groan_challenge_id', challenge.id)
    .eq('user_id', userId)
    .catch(e => console.warn('Quest task sync error:', e))

  // 5b. Save cross-pollination signals
  if (selectedCrossQuests.length > 0 && sourceQuestId) {
    try {
      const rows = selectedCrossQuests.map(targetId => ({
        user_id: userId,
        source_quest_id: sourceQuestId,
        target_quest_id: targetId,
        groan_challenge_id: challenge.id,
      }))
      await supabase.from('quest_cross_pollination').insert(rows)
    } catch (e) {
      console.warn('Cross-pollination save error:', e)
    }
  }

  // 6. Append challenge id to user_level_progress.courage_challenge_ids for current level
  try {
    const { data: stage } = await supabase
      .from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', userId)
      .maybeSingle()
    const currentLevel = stage?.current_journey_level ?? 0
    if (currentLevel > 0) {
      const { data: progress } = await supabase
        .from('user_level_progress')
        .select('courage_challenge_ids')
        .eq('user_id', userId)
        .eq('current_level', currentLevel)
        .maybeSingle()
      const existing = progress?.courage_challenge_ids || []
      if (!existing.includes(challenge.id)) {
        await supabase.from('user_level_progress').upsert({
          user_id: userId,
          current_level: currentLevel,
          courage_challenge_ids: [...existing, challenge.id],
        }, { onConflict: 'user_id,current_level' })
      }
    }
  } catch {}

  // 7. Behavioral evidence + skill XP
  if (sourceQuestId) {
    try {
      const { data: quest } = await supabase
        .from('quests')
        .select('skill_tags')
        .eq('id', sourceQuestId)
        .maybeSingle()
      if (quest?.skill_tags?.length) {
        // 7a. Behavioral evidence on matching clusters
        const { data: matchingClusters } = await supabase
          .from('nikigai_clusters')
          .select('id, skill_tags, behavioral_evidence')
          .eq('user_id', userId)
          .eq('cluster_stage', 'final')
          .is('step_id', null)
          .eq('is_removed', false)
          .in('cluster_type', ['skills', 'problems', 'persona'])
          .not('skill_tags', 'is', null)
        if (matchingClusters) {
          const toUpdate = matchingClusters.filter(c =>
            c.skill_tags?.some(tag => quest.skill_tags.includes(tag))
          )
          for (const c of toUpdate) {
            await supabase.rpc('increment_behavioral_evidence', { p_cluster_id: c.id })
              .catch(e => console.warn('Behavioral evidence increment failed:', e))
          }
        }

        // 7b. Skill XP (non-blocking)
        import('./skillProgress').then(m => m.awardSkillXP(userId, quest.skill_tags))

        // 7c. Push notification if cluster just hit re-gen threshold
        try {
          const { data: readyForRegen } = await supabase
            .from('nikigai_clusters')
            .select('id')
            .eq('user_id', userId)
            .gte('behavioral_evidence', 5)
            .eq('is_removed', false)
            .eq('regen_notified', false)
            .limit(1)
          if (readyForRegen?.length > 0) {
            supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: userId,
                title: 'Your mirror has new evidence',
                body: "Your challenges are showing who you're becoming. Check in.",
                url: '/mirror',
              }
            }).catch(() => {})
            await supabase.from('nikigai_clusters')
              .update({ regen_notified: true })
              .eq('id', readyForRegen[0].id)
          }
        } catch {} // best effort
      }
    } catch (e) {
      console.warn('Behavioral evidence / skill XP error:', e)
    }
  }

  // 8. Voice pattern detection (silent — surfaces on Progress tab)
  if (voice) {
    import('./voicePatternDetector').then(({ detectNewPattern, markPatternShown }) => {
      detectNewPattern(userId, voice, challenge.dimension_values)
        .then(pattern => {
          if (pattern) markPatternShown(userId, pattern.voice, pattern.primaryDimensions)
        })
        .catch(() => {})
    })
  }

  return { rpAwarded, leveledUp }
}

/**
 * Save a single post-completion reflection field.
 * Called from ProgressTab reflection cards.
 * Awards 1 RP per reflection.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.challengeId
 * @param {string} params.field - field name to save
 * @param {*} params.value - value to save
 * @returns {Promise<{ success: boolean }>}
 */
export async function saveReflection({ userId, challengeId, field, value }) {
  const questId = `play_list_challenge_${challengeId}`

  // Save to appropriate table based on field
  const groanFields = [
    'preaction_difficulty',
    'experienced_difficulty',
    'gap_rescript',
    'universe_response',
    'universe_response_note',
  ]

  try {
    if (groanFields.includes(field)) {
      const { error } = await supabase.from('groan_challenges')
        .update({ [field]: value })
        .eq('id', challengeId)
      if (error) throw error
    } else {
      // Save to quest_completions.reflection_text (merge into existing JSON)
      const { data: existing } = await supabase
        .from('quest_completions')
        .select('reflection_text')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .maybeSingle()
      let parsed = {}
      try { parsed = JSON.parse(existing?.reflection_text || '{}') } catch {}
      parsed[field] = value
      const { error } = await supabase.from('quest_completions')
        .update({ reflection_text: JSON.stringify(parsed) })
        .eq('user_id', userId)
        .eq('quest_id', questId)
      if (error) throw error
    }
  } catch (e) {
    console.warn('saveReflection write error:', e)
    return { success: false }
  }

  // Award 1 RP
  await supabase.rpc('increment_scores', {
    p_user_id: userId,
    p_project_id: null,
    p_category: getScoringCategory('Groans'),
    p_points: 1,
    p_week_start: getWeekStartLocal(),
  }).catch(() => {})

  return { success: true }
}
