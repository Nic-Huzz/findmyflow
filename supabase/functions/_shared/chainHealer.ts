// _shared/chainHealer.ts
// Utilities for detecting and fixing broken data chains in the quest pipeline.
// Chain: life_path_sessions → quests → quest_tasks → groan_challenges → nikigai_clusters

/**
 * Heal a quest that has missing skill_tags by calling the classify-quest-skills edge function.
 * Returns the classification result or empty defaults on failure.
 */
export async function healMissingSkillTags(
  supabase: any,
  questId: string,
  label: string
): Promise<{ skill_tags: string[]; branch: string | null }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/classify-quest-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ label }),
    })

    if (!resp.ok) {
      console.warn(`classify-quest-skills failed for "${label}":`, resp.status)
      return { skill_tags: [], branch: null }
    }

    const result = await resp.json()
    const skillTags = result.skill_tags || []
    const branch = result.branch || null

    if (skillTags.length > 0) {
      await supabase
        .from('quests')
        .update({ skill_tags: skillTags, branch })
        .eq('id', questId)
    }

    return { skill_tags: skillTags, branch }
  } catch (err) {
    console.error('healMissingSkillTags error:', err)
    return { skill_tags: [], branch: null }
  }
}

/**
 * Find nikigai_clusters whose skill_tags overlap with the given tags.
 * Used for behavioral evidence increments and cluster linking.
 */
export async function findMatchingClusters(
  supabase: any,
  userId: string,
  skillTags: string[]
): Promise<Array<{ id: string; skill_tags: string[] }>> {
  if (!skillTags || skillTags.length === 0) return []

  const { data } = await supabase
    .from('nikigai_clusters')
    .select('id, skill_tags')
    .eq('user_id', userId)
    .eq('cluster_stage', 'final')
    .eq('is_removed', false)
    .not('skill_tags', 'is', null)

  if (!data) return []
  return data.filter((c: any) =>
    c.skill_tags?.some((t: string) => skillTags.includes(t))
  )
}

/**
 * Get chain health counts for a user.
 */
export async function getChainHealth(
  supabase: any,
  userId: string
): Promise<{ quests_missing_skill_tags: number; life_paths_without_quests: number }> {
  const { count: missingTags } = await supabase
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('skill_tags', null)

  // life_paths_without_quests is computed in the scoreboard handler
  // (requires comparing life_path_sessions careers against quests)
  return {
    quests_missing_skill_tags: missingTags || 0,
    life_paths_without_quests: 0, // placeholder, computed in scoreboard
  }
}
