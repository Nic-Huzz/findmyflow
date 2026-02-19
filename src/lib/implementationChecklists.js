/**
 * Implementation Checklists Loader
 *
 * Loads and serves implementation checklists for Money Model offer recommendations.
 * Part of Tier 1 implementation for Sales Tower improvement.
 */

// Map flow types to their checklist paths
const CHECKLIST_PATHS = {
  attraction_offer: '/Money Model/Attraction/implementation_checklists.json',
  upsell_offer: '/Money Model/Upsell/implementation_checklists.json',
  downsell_offer: '/Money Model/Downsell/implementation_checklists.json',
  continuity_offer: '/Money Model/Continuity/implementation_checklists.json'
}

// Cache for loaded checklists
const checklistCache = {}

/**
 * Load implementation checklist for a specific flow type
 * @param {string} flowType - The flow type (e.g., 'attraction_offer', 'upsell_flow')
 * @returns {Promise<Object|null>} The checklists object or null if not found
 */
export async function loadChecklists(flowType) {
  const path = CHECKLIST_PATHS[flowType]
  if (!path) {
    console.warn(`No checklist path defined for flow type: ${flowType}`)
    return null
  }

  // Return cached if available
  if (checklistCache[flowType]) {
    return checklistCache[flowType]
  }

  try {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to load checklists: ${response.status}`)
    }
    const data = await response.json()
    checklistCache[flowType] = data
    return data
  } catch (error) {
    console.error(`Error loading checklists for ${flowType}:`, error)
    return null
  }
}

/**
 * Get implementation checklist for a specific offer
 * @param {string} flowType - The flow type
 * @param {string} offerId - The offer ID (e.g., 'classic_upsell')
 * @returns {Promise<Object|null>} The checklist for the offer or null
 */
export async function getOfferChecklist(flowType, offerId) {
  const checklists = await loadChecklists(flowType)
  if (!checklists) return null

  // Try exact match first
  if (checklists[offerId]) {
    return checklists[offerId]
  }

  // Try normalized ID (snake_case)
  const normalizedId = offerId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  if (checklists[normalizedId]) {
    return checklists[normalizedId]
  }

  // Try to find by name match
  for (const [key, checklist] of Object.entries(checklists)) {
    if (checklist.name && checklist.name.toLowerCase() === offerId.toLowerCase()) {
      return checklist
    }
  }

  console.warn(`No checklist found for offer: ${offerId} in ${flowType}`)
  return null
}

/**
 * Get all available checklists for a flow type
 * @param {string} flowType - The flow type
 * @returns {Promise<Array>} Array of checklist entries with id and name
 */
export async function getAvailableChecklists(flowType) {
  const checklists = await loadChecklists(flowType)
  if (!checklists) return []

  return Object.entries(checklists).map(([id, checklist]) => ({
    id,
    name: checklist.name,
    summary: checklist.summary
  }))
}

/**
 * Calculate checklist completion percentage
 * @param {Array} completedTasks - Array of completed task identifiers
 * @param {Array} checklistPhases - The implementation_checklist array
 * @returns {Object} Completion stats
 */
export function calculateChecklistProgress(completedTasks = [], checklistPhases = []) {
  const totalTasks = checklistPhases.reduce((sum, phase) => sum + (phase.tasks?.length || 0), 0)
  const completedCount = completedTasks.length

  return {
    completed: completedCount,
    total: totalTasks,
    percentage: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  }
}

/**
 * Generate a printable/PDF-friendly version of the checklist
 * @param {Object} checklist - The full checklist object
 * @returns {string} Markdown-formatted checklist
 */
export function generatePrintableChecklist(checklist) {
  if (!checklist) return ''

  let markdown = `# ${checklist.name} Implementation Checklist\n\n`

  if (checklist.summary) {
    markdown += `> ${checklist.summary}\n\n`
  }

  if (checklist.target_metrics) {
    markdown += `## Target Metrics\n`
    for (const [key, value] of Object.entries(checklist.target_metrics)) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      markdown += `- **${label}:** ${value}\n`
    }
    markdown += '\n'
  }

  if (checklist.hormozi_principle) {
    markdown += `## Hormozi Principle\n*"${checklist.hormozi_principle}"*\n\n`
  }

  if (checklist.implementation_checklist) {
    markdown += `## Implementation Steps\n\n`
    checklist.implementation_checklist.forEach((phase, phaseIndex) => {
      markdown += `### Phase ${phaseIndex + 1}: ${phase.phase}\n\n`
      phase.tasks?.forEach((task, taskIndex) => {
        markdown += `- [ ] **${task.task}**\n`
        if (task.description) {
          markdown += `  - ${task.description}\n`
        }
      })
      markdown += '\n'
    })
  }

  if (checklist.quick_wins?.length > 0) {
    markdown += `## Quick Wins\n`
    checklist.quick_wins.forEach(win => {
      markdown += `- ✨ ${win}\n`
    })
    markdown += '\n'
  }

  if (checklist.common_mistakes?.length > 0) {
    markdown += `## Common Mistakes to Avoid\n`
    checklist.common_mistakes.forEach(mistake => {
      if (typeof mistake === 'string') {
        markdown += `- ⚠️ ${mistake}\n`
      } else if (mistake.mistake) {
        markdown += `- ⚠️ **${mistake.mistake}**${mistake.fix ? `: ${mistake.fix}` : ''}\n`
      }
    })
  }

  return markdown
}

export default {
  loadChecklists,
  getOfferChecklist,
  getAvailableChecklists,
  calculateChecklistProgress,
  generatePrintableChecklist
}
