import { essenceProfiles } from '../data/essenceProfiles'

/**
 * Render the Essence Reveal text block based on the selected archetype.
 * @param {string} key - The essence archetype (e.g., "Radiant Rebel")
 * @returns {string} - Fully formatted reveal text
 */
export function renderEssenceReveal(key) {
  console.log('EssenceReveal called with key:', key, 'Available keys:', Object.keys(essenceProfiles))
  const d = essenceProfiles[key]
  if (!d) {
    return "We couldn't find that archetype. Please try again."
  }

  const tpl = `You are the {{essence_archetype}}.

{{poetic_line}}

You carry a frequency that others feel — even when they can't name it:
{{energetic_transmission}}

At your core, your essence is:
{{essence}}

Your natural superpower — the way you shift spaces and people is —
{{superpower}}

Let your path be guided by this deeper truth:
{{north_star}}

I see a vision for your future. To fulfil it, ask yourself:
{{poetic_vision}}

When you live this truth out loud — not just in theory but in embodiment —
{{vision_in_action}}

Does this feel like you?`

  return tpl
    .replaceAll('{{essence_archetype}}', key)
    .replaceAll('{{poetic_line}}', d.poetic_line)
    .replaceAll('{{energetic_transmission}}', d.energetic_transmission)
    .replaceAll('{{essence}}', d.essence)
    .replaceAll('{{superpower}}', d.superpower)
    .replaceAll('{{north_star}}', d.north_star)
    .replaceAll('{{poetic_vision}}', d.poetic_vision)
    .replaceAll('{{vision_in_action}}', d.vision_in_action)
}

