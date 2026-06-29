/**
 * PipelineNodeDetail.jsx — Expanded detail for a Growth Line node
 *
 * Shows collapsible sections: Modules, Awareness Wahoos (Attract only),
 * Tools, and Checklists. Adapts content per node key.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import { NODE_MODULES, NODE_TOOLS, NODE_CHECKLIST } from '../../lib/pipelineConfig'
import { getNodeNudge } from '../../lib/pipelineNudges'
import CollapsibleSection from '../CollapsibleSection'
import TemplateSelector from './TemplateSelector'
import InstagramPostSelector from './InstagramPostSelector'
import './InstagramPostSelector.css'

export default function PipelineNodeDetail({ node, experience, userId, checklists, wahoos, isModuleComplete, navigate, onUpdate }) {
  const modules = (NODE_MODULES[node.key] || []).filter(m => !m.certification)
  const tools = NODE_TOOLS[node.key] || []
  const checklistSection = NODE_CHECKLIST[node.key]
  const checklist = checklistSection ? checklists[checklistSection] : null
  const isPast = experience?.status === 'completed' || experience?.status === 'archived'
  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI?.isElectron
  const nudge = getNodeNudge(node, experience, isModuleComplete, wahoos, checklists)
  const [showPostSelector, setShowPostSelector] = useState(false)

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

        {/* Instagram Post Tagging (Attract only) */}
        {node.key === 'attract' && node.hasInstagram && (
          <CollapsibleSection title={`Tagged Posts (${node.igPosts?.length || 0})`} defaultOpen>
            {node.igPosts?.map(post => (
              <div key={post.id} className="pl-item" style={{ cursor: 'default' }}>
                <div className="pl-ico" style={{ fontSize: 14 }}>
                  {post.media_type === 'VIDEO' ? '🎬' : '📷'}
                </div>
                <div className="pl-txt">
                  <div className="pl-nm">{(post.reach || 0).toLocaleString()} reach</div>
                  <div className="pl-ds">{post.like_count || 0} likes · {post.comments_count || 0} comments</div>
                </div>
                {post.permalink && (
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>↗</a>
                )}
              </div>
            ))}
            <button
              className="pl-wahoo-cta"
              onClick={() => { hapticLight(); setShowPostSelector(true) }}
            >
              📸 Tag Instagram Posts
            </button>
          </CollapsibleSection>
        )}

        {node.key === 'attract' && !node.hasInstagram && (
          <div style={{ padding: '0 0 8px' }}>
            <button
              className="pl-wahoo-cta"
              onClick={() => { hapticLight(); setShowPostSelector(true) }}
              style={{ opacity: 0.6 }}
            >
              📸 Tag Instagram Posts
            </button>
          </div>
        )}

        {showPostSelector && (
          <InstagramPostSelector
            experienceId={experience?.id}
            experienceName={experience?.name}
            onClose={() => setShowPostSelector(false)}
            onSave={() => onUpdate?.()}
          />
        )}

        {/* Checklist — first section, closed by default */}
        {checklist && checklist.total > 0 && (
          <CollapsibleSection title={`${checklistSection.charAt(0).toUpperCase() + checklistSection.slice(1)} Checklist · ${checklist.done}/${checklist.total}`}>
            <ChecklistItems experienceId={experience.id} section={checklistSection} userId={userId} />
          </CollapsibleSection>
        )}

        {/* Modules */}
        {modules.length > 0 && (
          <CollapsibleSection title="Modules" defaultOpen>
            {modules.map(mod => {
              const done = isModuleComplete(mod.key)
              return (
                <div key={mod.key} className="pl-item" onClick={() => {
                  const base = `${mod.route}${mod.route.includes('?') ? '&' : '?'}experienceId=${experience.id}&returnTo=/create`
                  navigate(base)
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
              const disabled = tool.soon || (tool.afterEvent && !isPast)
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
                  {tool.soon ? (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>Coming soon</span>
                  ) : disabled ? (
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
      </div>
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

