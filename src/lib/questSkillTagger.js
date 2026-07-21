import { supabase } from './supabaseClient'

/**
 * Classify a task's text into 1-2 skills from the 10-skill vocabulary.
 * Client-side keyword matching — instant, no API call.
 * Returns array of matched skill IDs, or null if no match.
 */
const SKILL_KEYWORDS = {
  performing:   /\b(host(ed|ing)?|perform(ed|ing)?|facilitat\w*|dj('?d|ing)?|danc(e[ds]?|ing)|present(ed|ing)?|disco|comedy|sing(ing)?|magic|improv|flash.?mob|open.?mic|gig|concert|festival)/i,
  storytelling: /\b(story|narrat\w*|content|writ(e|ten|ing)|blog|newsletter|reel|film(ed|ing)?)/i,
  teaching:     /\b(teach|taught|mentor\w*|explain|workshop|masterclass|course|lesson|curriculum)/i,
  coaching:     /\b(coach\w*|guid(e[ds]?|ing)|1.on.1|check.?in|debrief)/i,
  creating:     /\b(creat\w*|made|develop\w*|record\w*|compos\w*|prototyp\w*|invent)/i,
  building:     /\b(build|built|code[ds]?|coding|app\b|platform|system|automat\w*|ship(ped)?|launch(ed)?|deploy)/i,
  designing:    /\b(design\w*|layout|visual|brand\w*|ux|ui|mockup|wireframe)/i,
  leading:      /\b(lead\b|led\b|organis\w*|manag\w*|coordinat\w*|hire[ds]?|recruit\w*|direct(ed|ing)?)/i,
  connecting:   /\b(connect\w*|network\w*|call(ed|ing)?|reach\w*|pitch\w*|sell|sold|dm\b|email\w*|outreach|cold|messag\w*|contact\w*)/i,
  speaking_up:  /\b(speak|spoke|shar(e[ds]?|ing)|post(ed|ing)?|publish\w*|vulnerab\w*|admit|confess|public(ly)?|announc)/i,
}

export function classifyTaskSkills(taskText) {
  if (!taskText) return null
  const matches = []
  for (const [skill, rx] of Object.entries(SKILL_KEYWORDS)) {
    if (rx.test(taskText)) matches.push(skill)
  }
  return matches.length > 0 ? matches.slice(0, 2) : null
}

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
