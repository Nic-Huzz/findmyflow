/**
 * PipelineNodeDetail.jsx — Expanded detail for a Growth Line node
 *
 * Shows collapsible sections: Modules, Awareness Wahoos (Attract only),
 * Tools, and Checklists. Adapts content per node key.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import TemplateSelector from './TemplateSelector'

// Module definitions per node
// certification: true = hidden in v1, shown in certification tier
const NODE_MODULES = {
  attract: [
    { key: 'attraction_offer', name: 'Attraction Stack', icon: '🎁', desc: 'Choose your attraction strategies', route: '/create/attraction-stack', passExperienceId: true },
    { key: 'leads_strategy', name: 'Leads Strategy', icon: '📢', desc: 'Define where your audience hangs out', route: '/leads-strategy' },
    { key: 'blow_up_brand', name: 'Blow Up Your Brand', icon: '🔥', desc: 'Find your remarkable angle', route: '/create/remarkable' },
    { key: 'validation', name: 'Validation', icon: '🔍', desc: 'Deep audience research', route: '/validation-flows', multi: 'Capture, Convert', certification: true },
  ],
  capture: [
    { key: 'lead_magnet', name: 'Marketing Campaign', icon: '📣', desc: 'Build your marketing campaign', route: '/create/marketing-campaign', passExperienceId: true },
    { key: 'funnel_builder', name: 'Funnel Builder', icon: '🗺️', desc: 'Deep funnel mapping', route: '/funnel-builder', certification: true },
  ],
  convert: [
    { key: 'launch_readiness', name: 'Launch Readiness', icon: '🚀', desc: 'Pre-launch checklist', route: '/launch-readiness' },
    { key: 'grand_slam', name: 'Grand Slam Offer', icon: '🎯', desc: 'Bonuses + guarantee + scarcity', route: '/offer-builder', certification: true },
    { key: 'offer_builder', name: '100M Offer Builder', icon: '💰', desc: 'Dream outcome, price, proof', route: '/offer-builder', certification: true },
    { key: 'product_selection', name: 'Product Selection', icon: '📦', desc: 'Build a full product suite', route: '/product-selection', certification: true },
  ],
  deliver: [
    { key: 'journey_designer', name: 'Journey Designer', icon: '🎨', desc: 'AI runsheet for this event', route: '/create' },
    { key: 'testing', name: 'Testing', icon: '🔬', desc: 'Test with real users', route: '/testing-explainer', multi: 'Convert', certification: true },
  ],
  grow: [
    { key: 'scale_income', name: 'Scale Income', icon: '📈', desc: 'See your 3-layer offer stack', route: '/create/scale-income' },
    { key: 'upsell', name: 'Upsell Offer', icon: '⬆️', desc: 'Design your upsell', route: '/upsell-offer', certification: true },
    { key: 'downsell', name: 'Downsell Offer', icon: '⬇️', desc: 'Design your downsell', route: '/downsell-offer', certification: true },
    { key: 'continuity', name: 'Continuity Offer', icon: '🔁', desc: 'Design recurring offer', route: '/continuity-offer', certification: true },
  ],
}

// Tool definitions per node
const NODE_TOOLS = {
  attract: [
    { name: 'Content Generator', icon: '✨', desc: 'AI posts for this event', route: '/crm/content-create' },
    { name: 'Content Planning', icon: '📋', desc: 'Weekly calendar', route: '/crm/content-create' },
    { name: 'Warm Outreach', icon: '☀️', desc: 'DM contacts about this event', route: '/crm/warm-outreach' },
  ],
  capture: [
    { name: 'Landing Page', icon: '🌐', desc: 'Build/update capture page', route: '/crm/pages' },
    { name: 'Email Sequence', icon: '✉️', desc: 'Welcome nurture after signup', route: '/crm/email-sequences' },
  ],
  convert: [
    { name: 'Sales Pipeline', icon: '💼', desc: 'Track bookings', route: '/crm/sales' },
    { name: 'Sales Script', icon: '📝', desc: 'Close conversations', route: '/crm/scripts' },
  ],
  deliver: [
    { name: 'Experience Checklist', icon: '✅', desc: 'Organisation items', route: null },
  ],
  grow: [
    { name: 'Follow-Up Checklist', icon: '📋', desc: 'Thank you, feedback, testimonials', route: null, afterEvent: true },
    { name: '3% Chain', icon: '🔄', desc: 'What\'s the one improvement?', route: '/create', afterEvent: true },
    { name: 'Funnel Calculator', icon: '📊', desc: 'Track conversion rates', route: '/funnel-calculator', afterEvent: true },
    { name: 'Analytics', icon: '📈', desc: 'Weekly grade + performance', route: '/crm/analytics', afterEvent: true },
  ],
}

// Checklist section per node
const NODE_CHECKLIST = {
  attract: 'marketing',
  deliver: 'organisation',
  grow: 'followup',
}

function getNodeNudge(node, experience, isModuleComplete, wahoos, checklists) {
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

export default function PipelineNodeDetail({ node, experience, userId, checklists, wahoos, isModuleComplete, navigate, onUpdate }) {
  const modules = (NODE_MODULES[node.key] || []).filter(m => !m.certification)
  const tools = NODE_TOOLS[node.key] || []
  const checklistSection = NODE_CHECKLIST[node.key]
  const checklist = checklistSection ? checklists[checklistSection] : null
  const isPast = experience?.status === 'completed' || experience?.status === 'archived'
  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI?.isElectron
  const nudge = getNodeNudge(node, experience, isModuleComplete, wahoos, checklists)

  return (
    <div className="pl-detail">
      <div className="pl-detail-card">
        {/* Contextual nudge */}
        {nudge && (
          <div className="pl-nudge">
            <div className="pl-nudge-text">{nudge.text}</div>
            {nudge.cta && (
              <button
                className="pl-nudge-cta"
                onClick={() => {
                  hapticLight()
                  if (nudge.action === 'update') onUpdate?.()
                  else if (nudge.route) navigate(nudge.route)
                }}
              >
                {nudge.cta} →
              </button>
            )}
          </div>
        )}

        {/* Action bar */}
        {node.key !== 'grow' && (
          <div className="pl-detail-actions">
            <button className="pl-update-btn" onClick={() => { hapticLight(); onUpdate?.() }}>
              + New Activity
            </button>
          </div>
        )}

        {/* Awareness Wahoos (Attract only) — above modules */}
        {node.key === 'attract' && (
          <CollapsibleSection title="Awareness Wahoos" defaultOpen={wahoos.length > 0}>
            {wahoos.length > 0 ? wahoos.map(w => (
              <div key={w.id} className={`pl-item${w.status === 'completed' ? ' completed' : ''}`}>
                <div className={`pl-ico ${w.status === 'completed' ? 'done' : 'wahoo'}`}>
                  {w.status === 'completed' ? '✓' : '⚡'}
                </div>
                <div className="pl-txt">
                  <div className={`pl-nm${w.status === 'completed' ? ' struck' : ''}`}>{w.challenge_text || w.title}</div>
                  {w.status !== 'completed' && w.deadline && (
                    <div className="pl-ds">Deadline: {new Date(w.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  )}
                </div>
                <div className={`pl-bg ${w.status === 'completed' ? 'done' : 'wahoo'}`}>
                  {w.status === 'completed' ? 'Done' : 'Do it'}
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '6px 0' }}>
                No Wahoos yet. Design one to get noticed.
              </div>
            )}
            <button
              className="pl-wahoo-cta"
              onClick={() => navigate('/create/strike')}
            >
              ⚡ Design a New Wahoo
            </button>
          </CollapsibleSection>
        )}

        {/* Modules */}
        {modules.length > 0 && (
          <CollapsibleSection title="Modules" defaultOpen>
            {modules.map(mod => {
              const done = isModuleComplete(mod.key)
              return (
                <div key={mod.key} className="pl-item" onClick={() => {
                  const sep = mod.route.includes('?') ? '&' : '?'
                  const base = mod.passExperienceId ? `${mod.route}?experienceId=${experience.id}` : mod.route
                  navigate(`${base}${base.includes('?') ? '&' : '?'}returnTo=/create`)
                }}>
                  <div className={`pl-ico ${done ? 'done' : 'todo'}`}>{mod.icon}</div>
                  <div className="pl-txt">
                    <div className="pl-nm">{mod.name}</div>
                    {mod.multi && <div className="pl-ds">Also improves: {mod.multi}</div>}
                  </div>
                  <div className={`pl-bg ${done ? 'done' : 'todo'}`}>{done ? 'Done ✓' : 'Start'}</div>
                </div>
              )
            })}
          </CollapsibleSection>
        )}

        {/* Tools */}
        {tools.length > 0 && (
          <CollapsibleSection title="Tools">
            {tools.map((tool, i) => {
              const disabled = tool.afterEvent && !isPast
              return (
                <div
                  key={i}
                  className="pl-item"
                  style={disabled ? { opacity: 0.35 } : undefined}
                  onClick={() => !disabled && tool.route && navigate(tool.route)}
                >
                  <div className="pl-ico tool">{tool.icon}</div>
                  <div className="pl-txt">
                    <div className="pl-nm">{tool.name}</div>
                    <div className="pl-ds">{tool.desc}</div>
                  </div>
                  {disabled ? (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>After event</span>
                  ) : (
                    <div className="pl-bg use">Open</div>
                  )}
                </div>
              )
            })}
          </CollapsibleSection>
        )}

        {/* Templates */}
        <TemplateSelector
          nodeKey={node.key}
          experienceId={experience.id}
          experience={experience}
          userId={userId}
        />

        {/* Checklist */}
        {checklist && checklist.total > 0 && (
          <CollapsibleSection title={`${checklistSection.charAt(0).toUpperCase() + checklistSection.slice(1)} Checklist · ${checklist.done}/${checklist.total}`}>
            <ChecklistItems experienceId={experience.id} section={checklistSection} userId={userId} />
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}

function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="pl-sec">
      <div className="pl-sec-header" onClick={() => { setOpen(!open); hapticLight() }}>
        {title}
        <span className="pl-sec-toggle">{open ? '▼' : '▶'}</span>
      </div>
      {open && <div className="pl-sec-body">{children}</div>}
    </div>
  )
}

function ChecklistItems({ experienceId, section, userId }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    supabase.from('experience_checklist_items')
      .select('id, label, completed')
      .eq('experience_id', experienceId)
      .eq('section', section)
      .eq('user_id', userId)
      .order('sort_order')
      .then(({ data }) => { if (!cancelled && data) setItems(data) })
    return () => { cancelled = true }
  }, [experienceId, section, userId])

  return items.map(item => (
    <div key={item.id} className={`pl-ck${item.completed ? ' done' : ''}`}>
      <div className={`pl-ck-box${item.completed ? ' checked' : ''}`}>
        {item.completed ? '✓' : ''}
      </div>
      <div className={`pl-ck-text${item.completed ? ' struck' : ''}`}>{item.label}</div>
    </div>
  ))
}

