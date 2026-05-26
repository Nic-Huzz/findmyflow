/**
 * PipelineNodeDetail.jsx — Expanded detail for a Growth Line node
 *
 * Shows collapsible sections: Modules, Awareness Wahoos (Attract only),
 * Tools, and Checklists. Adapts content per node key.
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

// Module definitions per node
const NODE_MODULES = {
  attract: [
    { key: 'leads_strategy', name: 'Leads Strategy', icon: '📢', desc: 'Define where your audience hangs out', route: '/campaign-creation' },
    { key: 'blow_up_brand', name: 'Blow Up Your Brand', icon: '🔥', desc: 'Find your remarkable angle', route: '/create/remarkable' },
    { key: 'validation', name: 'Validation', icon: '🔍', desc: 'Learn your audience\'s language', route: '/validation-flows', multi: 'Capture, Convert' },
  ],
  capture: [
    { key: 'attraction_offer', name: 'Attraction Offer', icon: '🎁', desc: 'Free/low-cost entry offer', route: '/attraction-offer' },
    { key: 'lead_magnet', name: 'Lead Magnet', icon: '🧲', desc: 'Pick the right format', route: '/lead-magnet-selection' },
    { key: 'funnel_builder', name: 'Funnel Builder', icon: '🗺️', desc: 'Map stranger → lead journey', route: '/funnel-builder' },
  ],
  convert: [
    { key: 'grand_slam', name: 'Grand Slam Offer', icon: '🎯', desc: 'Bonuses + guarantee + scarcity', route: '/offer-builder' },
    { key: 'offer_builder', name: '100M Offer Builder', icon: '💰', desc: 'Dream outcome, price, proof', route: '/offer-builder' },
    { key: 'product_selection', name: 'Product Selection', icon: '📦', desc: 'Choose what to build', route: '/product-selection' },
    { key: 'launch_readiness', name: 'Launch Readiness', icon: '🚀', desc: 'Pre-launch checklist', route: '/launch-readiness' },
  ],
  deliver: [
    { key: 'journey_designer', name: 'Journey Designer', icon: '🎨', desc: 'AI runsheet for this event', route: '/create' },
    { key: 'testing', name: 'Testing', icon: '🔬', desc: 'Test with real users', route: '/testing', multi: 'Convert' },
  ],
  grow: [
    { key: 'upsell', name: 'Upsell Offer', icon: '⬆️', desc: 'What do they buy next?', route: '/upsell-offer' },
    { key: 'downsell', name: 'Downsell Offer', icon: '⬇️', desc: 'Lower-tier alternative', route: '/downsell-offer' },
    { key: 'continuity', name: 'Continuity Offer', icon: '🔁', desc: 'Recurring membership', route: '/continuity-offer' },
    { key: 'scale_income', name: 'Scale Income', icon: '📈', desc: '3-layer offer stack', route: '/create/scale-income' },
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
    { name: 'Email Sequence', icon: '✉️', desc: 'Welcome nurture after signup', route: '/crm/email' },
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

export default function PipelineNodeDetail({ node, experience, checklists, wahoos, isModuleComplete, navigate }) {
  const modules = NODE_MODULES[node.key] || []
  const tools = NODE_TOOLS[node.key] || []
  const checklistSection = NODE_CHECKLIST[node.key]
  const checklist = checklistSection ? checklists[checklistSection] : null
  const isPast = experience?.status === 'completed' || experience?.status === 'archived'
  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI?.isElectron

  return (
    <div className="pl-detail">
      <div className="pl-detail-card">
        {/* Header */}
        <div className="pl-detail-top">
          <div>
            <div className="pl-detail-title">{node.label}</div>
            <div className="pl-detail-stats">
              <div className="pl-stat">
                <div className="pl-stat-val">{node.value}</div>
                <div className="pl-stat-lbl">{node.sublabel}</div>
              </div>
              {node.revenue > 0 && (
                <div className="pl-stat">
                  <div className="pl-stat-val">${node.revenue.toLocaleString()}</div>
                  <div className="pl-stat-lbl">revenue</div>
                </div>
              )}
            </div>
          </div>
          <div className={`pl-pill ${node.status}`}>{node.readinessPercent}%</div>
        </div>

        {/* Modules */}
        {modules.length > 0 && (
          <CollapsibleSection title="Modules" defaultOpen>
            {modules.map(mod => {
              const done = isModuleComplete(mod.key)
              return (
                <div key={mod.key} className="pl-item" onClick={() => navigate(mod.route)}>
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

        {/* Awareness Wahoos (Attract only) */}
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
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', padding: '6px 0' }}>
                No courage challenges yet. Add one from the Challenge tab.
              </div>
            )}
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

        {/* Checklist */}
        {checklist && checklist.total > 0 && (
          <CollapsibleSection title={`${checklistSection.charAt(0).toUpperCase() + checklistSection.slice(1)} Checklist · ${checklist.done}/${checklist.total}`}>
            <ChecklistItems experienceId={experience.id} section={checklistSection} />
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

function ChecklistItems({ experienceId, section }) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  // Lazy load checklist items on first render
  if (!loaded) {
    setLoaded(true)
    supabase.from('experience_checklist_items')
      .select('id, label, completed')
      .eq('experience_id', experienceId)
      .eq('section', section)
      .order('sort_order')
      .then(({ data }) => { if (data) setItems(data) })
  }

  return items.map(item => (
    <div key={item.id} className={`pl-ck${item.completed ? ' done' : ''}`}>
      <div className={`pl-ck-box${item.completed ? ' checked' : ''}`}>
        {item.completed ? '✓' : ''}
      </div>
      <div className={`pl-ck-text${item.completed ? ' struck' : ''}`}>{item.label}</div>
    </div>
  ))
}

