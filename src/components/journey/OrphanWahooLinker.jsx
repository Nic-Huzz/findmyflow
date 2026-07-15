/**
 * OrphanWahooLinker — One-off popup for linking orphaned wahoos to quests.
 * Shows inline QuestSelector per wahoo item. Item disappears after linked.
 * Auto-dismisses when all wahoos are linked or user closes.
 * CSS prefix: owl-
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticSuccess } from '../../lib/haptics'
import QuestSelector from '../QuestSelector'
import './OrphanWahooLinker.css'

const DEPTH_OPTIONS = [
  { id: 'education', label: 'Learning about it', icon: '📚' },
  { id: 'testing', label: 'Tried it / testing it', icon: '🧪' },
  { id: 'practising', label: 'Do it regularly', icon: '🔄' },
  { id: 'charging', label: 'Getting paid for this', icon: '💰' },
  { id: 'teaching', label: 'Teaching / passing it on', icon: '🎓' },
]

export default function OrphanWahooLinker({ wahoos, userId, onLinked, onClose }) {
  const [linkingId, setLinkingId] = useState(null)
  const [linkedIds, setLinkedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [pendingQuest, setPendingQuest] = useState({}) // wahooId → questId
  const [pendingDepth, setPendingDepth] = useState({}) // wahooId → depthLevel

  const remaining = wahoos.filter(w => !linkedIds.has(w.id))

  async function handleLink(wahoo) {
    const questId = pendingQuest[wahoo.id]
    const depth = pendingDepth[wahoo.id]
    if (!questId || !depth || saving) return
    setSaving(true)

    try {
      await supabase.from('quest_tasks').insert({
        quest_id: questId,
        user_id: userId,
        text: wahoo.title || wahoo.challenge_text,
        is_courage_challenge: true,
        groan_challenge_id: wahoo.id,
        sort_order: 0,
        done: true,
      })

      // Auto-bump quest depth (high watermark)
      const DEPTH_ORDER = { education: 0, testing: 1, practising: 2, charging: 3, teaching: 4 }
      const { data: quest } = await supabase.from('quests').select('depth_level').eq('id', questId).single()
      if ((DEPTH_ORDER[depth] ?? -1) > (DEPTH_ORDER[quest?.depth_level] ?? -1)) {
        await supabase.from('quests').update({ depth_level: depth }).eq('id', questId)
      }

      hapticSuccess()
      setLinkedIds(prev => new Set([...prev, wahoo.id]))
      setLinkingId(null)

      if (remaining.length <= 1) {
        onLinked?.()
      }
    } catch (err) {
      console.error('Link wahoo error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (remaining.length === 0) return null

  return (
    <div className="owl-overlay" onClick={onClose}>
      <div className="owl-popup" onClick={e => e.stopPropagation()}>
        <button className="owl-close" onClick={onClose}>&times;</button>
        <h3 className="owl-title">Connect your wins</h3>
        <p className="owl-intro">
          These courage challenges aren't linked to a life path yet. Tap one to connect it.
        </p>

        <div className="owl-list">
          {remaining.map(w => (
            <div key={w.id} className="owl-item">
              <div className="owl-item-row" onClick={() => setLinkingId(linkingId === w.id ? null : w.id)}>
                <span className="owl-item-icon">&#9889;</span>
                <span className="owl-item-text">{w.title || w.challenge_text}</span>
                <span className="owl-item-arrow">{linkingId === w.id ? '▴' : '▾'}</span>
              </div>
              {linkingId === w.id && (
                <div className="owl-quest-picker">
                  <QuestSelector
                    userId={userId}
                    value={pendingQuest[w.id] || null}
                    onChange={(questId) => setPendingQuest(prev => ({ ...prev, [w.id]: questId }))}
                  />
                  {pendingQuest[w.id] && (
                    <>
                      <div className="owl-depth-label">How deep were you into this?</div>
                      <div className="owl-depth-options">
                        {DEPTH_OPTIONS.map(d => (
                          <button
                            key={d.id}
                            className={`owl-depth-btn ${pendingDepth[w.id] === d.id ? 'selected' : ''}`}
                            onClick={() => setPendingDepth(prev => ({ ...prev, [w.id]: d.id }))}
                          >
                            <span>{d.icon}</span> {d.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {pendingQuest[w.id] && pendingDepth[w.id] && (
                    <button className="owl-link-btn" onClick={() => handleLink(w)} disabled={saving}>
                      {saving ? 'Linking...' : 'Link'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="owl-footer">
          <span className="owl-count">{remaining.length} remaining</span>
          <button className="owl-skip" onClick={onClose}>Do this later</button>
        </div>
      </div>
    </div>
  )
}
