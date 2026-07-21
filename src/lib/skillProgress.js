import { supabase } from './supabaseClient'

/**
 * XP thresholds for skill levels.
 * L0 (education) → L1 (testing) at 3 XP
 * L1 → L2 (practising) at 8 XP
 * L2 → L3 (charging) at 15 XP
 * L3 → L4 (teaching) at 25 XP
 */
const LEVEL_THRESHOLDS = [
  { xp: 0, level: 'education' },
  { xp: 3, level: 'testing' },
  { xp: 8, level: 'practising' },
  { xp: 15, level: 'charging' },
  { xp: 25, level: 'teaching' },
]

function xpToLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) return LEVEL_THRESHOLDS[i].level
  }
  return 'education'
}

/**
 * Award +1 XP to each skill in the given skill_tags array.
 * Called after courage challenge completion.
 * Uses atomic RPC to avoid race conditions on concurrent completions.
 */
export async function awardSkillXP(userId, skillTags) {
  if (!userId || !skillTags?.length) return

  for (const skillId of skillTags) {
    try {
      const { error } = await supabase.rpc('increment_skill_xp', {
        p_user_id: userId,
        p_skill_id: skillId,
      })
      if (error) console.warn(`Skill XP award failed for ${skillId}:`, error)
    } catch (err) {
      console.warn(`Skill XP award failed for ${skillId}:`, err)
    }
  }
}

/**
 * Set starting level for a skill (user self-reports baseline).
 * Converts level name to minimum XP for that threshold.
 */
export async function setSkillStartingLevel(userId, skillId, level) {
  const threshold = LEVEL_THRESHOLDS.find(t => t.level === level)
  if (!threshold) return

  try {
    await supabase.from('user_skill_progress').upsert({
      user_id: userId,
      skill_id: skillId,
      xp: threshold.xp,
      level: threshold.level,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,skill_id' })
  } catch (err) {
    console.warn(`Set starting level failed for ${skillId}:`, err)
  }
}
