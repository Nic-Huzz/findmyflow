import { supabase } from './supabaseClient'
import { postFeedEvent } from './communityFeed'

/**
 * Checks if a user qualifies for a hero stage graduation.
 * Returns { from, to, stageData, dominantVoice } if graduated, or null if no change.
 *
 * Designed to be called on Challenge.jsx mount. Cheap queries (~50ms).
 * Only advances ONE stage per call — subsequent mounts catch further graduations.
 */
export async function checkHeroGraduation(userId) {
  const { data: stageData } = await supabase
    .from('user_stage_progress')
    .select('current_journey_level, essence_mirror_completed, hero_avatar_url, persona')
    .eq('user_id', userId)
    .maybeSingle()

  const currentStage = stageData?.current_journey_level || 0
  let newStage = null
  let voiceData = null // Declared at function scope (used by 6→7 check AND return)

  // →2: Account exists + first NS check-in
  if (currentStage < 2) {
    const { count } = await supabase
      .from('nervous_system_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count > 0) newStage = 2
  }

  // 2→3: Life Paths exercise completed (life_path_sessions exists)
  if (currentStage === 2) {
    const { data: userData } = await supabase.auth.getUser()
    const email = userData?.user?.email
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

  // 6→7: Protective voice identified 5+ times (combined from both sources)
  if (currentStage === 6) {
    const [{ data: nsVoices }, { data: hiVoices }] = await Promise.all([
      supabase
        .from('nervous_system_checkins')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),
      supabase
        .from('healing_intentions')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),
    ])

    voiceData = [...(nsVoices || []), ...(hiVoices || [])]
    const counts = {}
    voiceData.forEach(row => {
      if (row.protective_voice)
        counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
    })
    const maxCount = Math.max(0, ...Object.values(counts))
    if (maxCount >= 5) newStage = 7
  }

  // If graduated, update the stage
  // Use UPDATE (not UPSERT) — row should always exist from PersonaAssessment.
  // If UPDATE affects 0 rows (edge case: missing row), fall back to INSERT.
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
        .catch(() => {}) // Silent — if INSERT also fails (constraint), stage just doesn't advance
    }

    // Auto-post stage graduation to community feed
    const STAGE_NAMES = {
      2: 'The Earthquake',
      3: 'Head Full of Dreams',
      4: 'Mirror / Mentor',
      5: 'First Vibe Rise',
      6: 'The Daily Loop',
      7: 'Pattern Revealed',
    }
    const stageName = STAGE_NAMES[newStage] || `Stage ${newStage}`
    const feelingTarget = stageData?.persona || null
    postFeedEvent(userId, 'stage_graduation', `Reached Stage ${newStage}: ${stageName}`, feelingTarget)

    return {
      from: currentStage,
      to: newStage,
      stageData,
      dominantVoice: currentStage === 6 ? getDominantVoice(voiceData) : null,
    }
  }

  return null
}

function getDominantVoice(voiceData) {
  const counts = {}
  voiceData?.forEach(row => {
    if (row.protective_voice)
      counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
  })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0] ? sorted[0][0] : null
}
