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

export default function OrphanWahooLinker({ wahoos, userId, onLinked, onClose }) {
  const [linkingId, setLinkingId] = useState(null) // which wahoo has quest selector open
  const [linkedIds, setLinkedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const remaining = wahoos.filter(w => !linkedIds.has(w.id))

  async function handleLink(wahoo, questId) {
    if (!questId || saving) return
    setSaving(true)

    try {
      // Create quest_task linking wahoo to quest
      await supabase.from('quest_tasks').insert({
        quest_id: questId,
        user_id: userId,
        text: wahoo.title || wahoo.challenge_text,
        is_courage_challenge: true,
        groan_challenge_id: wahoo.id,
        sort_order: 0,
        done: true, // already completed
      })

      hapticSuccess()
      setLinkedIds(prev => new Set([...prev, wahoo.id]))
      setLinkingId(null)

      // If all linked, notify parent
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
                    value={null}
                    onChange={(questId) => handleLink(w, questId)}
                  />
                  {saving && <span className="owl-saving">Linking...</span>}
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
