/**
 * pipelineNudges.js — Contextual nudge logic per pipeline node
 *
 * Pure function: (node, experience, isModuleComplete, wahoos, checklists) => nudge | null
 */

export function getNodeNudge(node, experience, isModuleComplete, wahoos, checklists) {
  const isPast = experience?.status === 'completed' || experience?.status === 'archived'
  const days = experience?.experience_date
    ? Math.ceil((new Date(experience.experience_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null
  const val = Number(node.value) || 0
  const hasMetrics = node.hasManualMetrics

  switch (node.key) {
    case 'attract':
      if (!hasMetrics && !isModuleComplete('blow_up_brand'))
        return { text: 'Find your angle first, then start attracting.', cta: 'Blow Up Your Brand', route: '/create/remarkable' }
      if (!hasMetrics && days !== null && days < 14)
        return { text: 'Your event is soon and nobody knows. Start with warm outreach.', cta: null }
      if (!hasMetrics)
        return { text: 'Log your first attraction activity to start tracking.', cta: null }
      if (val > 0 && wahoos.length === 0)
        return { text: 'People are seeing you. A Wahoo will make you stand out.', cta: 'Design a Wahoo', route: '/create/strike' }
      return null
    case 'capture':
      if (val === 0)
        return { text: 'No signups yet. Share your link and log the clicks.', cta: null }
      return null
    case 'convert':
      if (val === 0 && days !== null && days < 7)
        return { text: 'Event is soon. Send a direct pitch to your warmest leads.', cta: null }
      if (val === 0)
        return { text: 'No tickets sold yet. Log your first sale.', cta: null }
      return null
    case 'deliver':
      if (!isPast) {
        const orgCl = checklists.organisation || { total: 0, done: 0 }
        if (orgCl.total > 0 && orgCl.done / orgCl.total < 0.5)
          return { text: 'Work through your organisation checklist to be ready.', cta: null }
        return null
      }
      if (val === 0)
        return { text: 'Event is done. Log how many people showed up.', cta: null }
      return null
    case 'grow': {
      if (!isPast) return null
      const followCl = checklists.followup || { total: 0, done: 0 }
      if (followCl.total > 0 && followCl.done === 0)
        return { text: "Don't lose the connection. Start your follow-up.", cta: null }
      return null
    }
    default:
      return null
  }
}
