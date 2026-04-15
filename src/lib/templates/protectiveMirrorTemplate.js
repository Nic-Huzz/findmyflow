// Map of protective archetype descriptions
const protectiveProfiles = {
  "Controller": `Ah, the Controller. \n\nThis archetype developed to protect you from chaos, unpredictability, and being seen as not enough.\n\nIt insists: "Leaving it to chance isn't an option." So you manage, you perform, you stay on top of everything.\n\nBut control and performance become exhaustion in disguise. Does this resonate?`,
  "Ghost": `Ah, the Ghost. \n\nThis archetype developed to protect you from being seen, judged, or overwhelmed.\n\nIt whispers: "I don't feel comfortable sharing." So you withdraw, you hide, you leave before things get too real.\n\nBut hiding keeps you from the very connection and opportunities you crave. Sound familiar?`,
  "Perfectionist": `Ah, the Perfectionist. \n\nThis archetype developed to protect you from criticism and failure.\n\nIt whispers: "I'm not ready yet." Gas and brake pressed at the same time.\n\nBut perfectionism often becomes procrastination in disguise, keeping you stuck in endless prep mode. Exhausting, isn't it?`,
  "Auto-Pilot": `Ah, the Auto-Pilot. \n\nThis archetype developed to protect you from sustained overwhelm by checking out.\n\nIt says nothing. That's the point. Just: "I'm fine, just tired." Going through the motions so you never have to face what you're avoiding.\n\nBut numbness is not peace. It's protection from feeling anything at all. Does this feel true?`,
  "People Pleaser": `Ah, the People Pleaser. \n\nThis archetype learned that keeping everyone happy meant staying safe from conflict and rejection.\n\nIt says: "As long as everyone's happy, I'm safe."\n\nBut people-pleasing often leads to burnout and losing yourself in others' needs. Sound familiar?`,
  // Legacy alias
  "Performer": `Ah, the Controller. \n\nThis archetype developed to protect you from chaos, unpredictability, and being seen as not enough.\n\nIt insists: "Leaving it to chance isn't an option." So you manage, you perform, you stay on top of everything.\n\nBut control and performance become exhaustion in disguise. Does this resonate?`
}

/**
 * Render the Protective Mirror text based on the selected archetype.
 * @param {string} key - The protective archetype (e.g., "Perfectionist")
 * @returns {string} - Fully formatted mirror text
 */
export function renderProtectiveMirror(key) {
  console.log('ProtectiveMirror called with key:', key, 'Available keys:', Object.keys(protectiveProfiles))
  const d = protectiveProfiles[key]
  if (!d) {
    return "We couldn't find that archetype. Please try again."
  }

  // Return the formatted string for the selected protective archetype
  return d
}
