import { supabase } from './supabaseClient'

/**
 * Auto-tag a quest with skills from the 10-segment taxonomy.
 * Calls the classify-quest-skills edge function (Haiku).
 * Returns the skill_tags array, or empty array on failure.
 */
export async function tagQuestSkills(questId, label) {
  try {
    const { data, error } = await supabase.functions.invoke('classify-quest-skills', {
      body: { label },
    })

    if (error || !data?.skill_tags?.length) {
      console.warn('Quest skill tagging failed or empty:', error || 'no tags')
      return { skill_tags: [], branch: null }
    }

    // Save skills + branch to quest
    const update = { skill_tags: data.skill_tags }
    if (data.branch) update.branch = data.branch

    const { error: updateError } = await supabase
      .from('quests')
      .update(update)
      .eq('id', questId)
    if (updateError) console.warn('Quest tag save failed:', updateError)

    return { skill_tags: data.skill_tags, branch: data.branch || null }
  } catch (err) {
    console.error('Quest skill tagging error:', err)
    return { skill_tags: [], branch: null }
  }
}
