/**
 * QuestSelector — Reusable dropdown to pick or create a quest (life path).
 * Used by HealingIntentionsList and WahooCreator.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { STATES, STATE_META } from './LifePathMap/lifePaths'
import './HealingIntentionsList.css' // shares qs- styles

export default function QuestSelector({ userId, value, onChange }) {
  const [quests, setQuests] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newState, setNewState] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('quests')
      .select('id, label, predicted_state')
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('label', 'Healing Work')
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setQuests(data) })
  }, [userId])

  const handleCreate = async () => {
    if (!newLabel.trim() || !newState || saving) return
    setSaving(true)
    try {
      const { data } = await supabase.from('quests').insert({
        user_id: userId,
        label: newLabel.trim(),
        predicted_state: newState,
        status: 'active',
        sort_order: quests.length,
      }).select('id, label, predicted_state').single()
      if (data) {
        setQuests(prev => [...prev, data])
        onChange(data.id, data.label)
        setShowNew(false)
        setNewLabel('')
        setNewState(null)
        // Auto-tag skills + reverse link to clusters (non-blocking)
        import('../lib/questSkillTagger').then(async (m) => {
          const tags = await m.tagQuestSkills(data.id, data.label)
          if (tags?.skill_tags?.length) {
            import('../lib/clusterQuestLinker').then(linker =>
              linker.linkNewQuestToClusters(userId, data.id, tags.skill_tags)
            )
          }
        })
      }
    } catch (e) { console.error('Create quest error:', e) }
    setSaving(false)
  }

  if (showNew) {
    return (
      <div className="qs-new">
        <div className="qs-new-label">New life path:</div>
        <input className="quest-add-input" type="text" value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && newState && handleCreate()}
          placeholder="e.g. Run retreats..." autoFocus />
        <div className="quest-add-subtitle">State:</div>
        <div className="quest-add-states">
          {[...STATES].reverse().map(s => {
            const m = STATE_META[s]
            const isActive = newState === s
            return (
              <button key={s} className={`quest-state-pill ${isActive ? 'active' : ''}`}
                style={isActive ? { borderColor: m.color, color: m.color, background: `${m.color}10` } : undefined}
                onClick={() => setNewState(s)}>
                {m.emoji} {m.label}
              </button>
            )
          })}
        </div>
        <div className="qs-new-actions">
          <button className="quest-add-submit" onClick={handleCreate}
            disabled={!newLabel.trim() || !newState || saving}>
            {saving ? 'Creating...' : 'Create'}
          </button>
          <button className="quest-add-cancel" onClick={() => { setShowNew(false); setNewLabel(''); setNewState(null) }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="qs-container">
      <div className="qs-label">Which life path is this for?</div>
      <select className="quest-add-select" value={value || ''}
        onChange={e => {
          if (e.target.value === '__new__') {
            setShowNew(true)
            return
          }
          const q = quests.find(q => q.id === e.target.value)
          if (q) onChange(q.id, q.label)
        }}>
        <option value="">Select a life path...</option>
        {quests.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
        <option value="__new__">+ Add new life path...</option>
      </select>
    </div>
  )
}
