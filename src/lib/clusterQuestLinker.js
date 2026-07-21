import { supabase } from './supabaseClient'

/**
 * Find quests that match a cluster's skill_tags.
 * Returns array of quest IDs.
 */
export function findMatchingQuests(cluster, quests) {
  if (!cluster.skill_tags?.length || !quests?.length) return []
  return quests
    .filter(q => q.skill_tags?.some(tag => cluster.skill_tags.includes(tag)))
    .map(q => q.id)
}

/**
 * Auto-link a cluster to matching quests and save.
 * Called from Mirror page (on rate) and quest creation (reverse direction).
 */
export async function autoLinkClusterQuests(clusterId, matchingQuestIds) {
  if (!matchingQuestIds.length) return
  await supabase.from('nikigai_clusters')
    .update({ quest_ids: matchingQuestIds })
    .eq('id', clusterId)
}

/**
 * Reverse link: when a new quest is created, find and update all matching clusters.
 * Called from quest creation paths.
 */
export async function linkNewQuestToClusters(userId, questId, questSkillTags) {
  if (!questSkillTags?.length) return
  const { data: clusters } = await supabase
    .from('nikigai_clusters')
    .select('id, skill_tags, quest_ids')
    .eq('user_id', userId)
    .eq('cluster_stage', 'final')
    .eq('is_removed', false)
    .not('skill_tags', 'is', null)

  if (!clusters) return
  for (const c of clusters) {
    if (c.skill_tags?.some(tag => questSkillTags.includes(tag))) {
      const existing = c.quest_ids || []
      if (!existing.includes(questId)) {
        await supabase.from('nikigai_clusters')
          .update({ quest_ids: [...existing, questId] })
          .eq('id', c.id)
      }
    }
  }
}
