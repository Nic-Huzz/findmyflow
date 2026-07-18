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
      return []
    }

    // Save to quest
    const { error: updateError } = await supabase
      .from('quests')
      .update({ skill_tags: data.skill_tags })
      .eq('id', questId)
    if (updateError) console.warn('Quest skill tag save failed:', updateError)

    return data.skill_tags
  } catch (err) {
    console.error('Quest skill tagging error:', err)
    return []
  }
}
