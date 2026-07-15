/**
 * BackdatePanel — "Add pre-app progress to the line?"
 *
 * Shows AI-suggested milestones as tappable chips.
 * Each chip gets a month/year picker when tapped.
 * Free text input for custom milestones.
 * Saves as quest_tasks with done: true, backdated: true, backdated_date.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getYearOptions() {
  const current = new Date().getFullYear()
  const years = []
  for (let y = current; y >= current - 10; y--) years.push(y)
  return years
}

export default function BackdatePanel({ quest, existingTasks, userId, onSaved }) {
  const [open, setOpen] = useState(false)
  const [milestones, setMilestones] = useState([]) // AI suggestions
  const [loading, setLoading] = useState(false)
  const [selections, setSelections] = useState({}) // { index: { month, year } }
  const [customText, setCustomText] = useState('')
  const [customEntries, setCustomEntries] = useState([]) // [{ text, month, year }]
  const [saving, setSaving] = useState(false)

  // Fetch AI milestones when panel opens
  useEffect(() => {
    if (!open || milestones.length > 0) return
    setLoading(true)
    supabase.functions.invoke('suggest-milestones', {
      body: {
        pathName: quest.label,
        existingTasks: (existingTasks || []).map(t => t.text),
      },
    }).then(({ data, error }) => {
      if (!error && data?.milestones?.length) {
        setMilestones(data.milestones)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [open, milestones.length, quest.label, existingTasks])

  const toggleMilestone = (index) => {
    hapticLight()
    setSelections(prev => {
      const next = { ...prev }
      if (next[index]) {
        delete next[index]
      } else {
        next[index] = { month: null, year: null }
      }
      return next
    })
  }

  const setMilestoneDate = (index, field, value) => {
    setSelections(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: parseInt(value) },
    }))
  }

  const addCustom = () => {
    if (!customText.trim()) return
    setCustomEntries(prev => [...prev, { text: customText.trim(), month: null, year: null }])
    setCustomText('')
    hapticLight()
  }

  const setCustomDate = (index, field, value) => {
    setCustomEntries(prev => prev.map((e, i) =>
      i === index ? { ...e, [field]: parseInt(value) } : e
    ))
  }

  const removeCustom = (index) => {
    setCustomEntries(prev => prev.filter((_, i) => i !== index))
  }

  // Count confirmed entries (has both month + year)
  const confirmedMilestones = Object.entries(selections).filter(([, s]) => s.month !== null && s.year !== null)
  const confirmedCustom = customEntries.filter(e => e.month !== null && e.year !== null)
  const totalConfirmed = confirmedMilestones.length + confirmedCustom.length

  const handleSave = async () => {
    if (totalConfirmed === 0 || saving) return
    setSaving(true)

    try {
      const rows = []

      // AI milestones
      confirmedMilestones.forEach(([idx, dates]) => {
        const backdatedDate = `${dates.year}-${String(dates.month).padStart(2, '0')}-01`
        rows.push({
          quest_id: quest.id,
          user_id: userId,
          text: milestones[parseInt(idx)],
          done: true,
          backdated: true,
          backdated_date: backdatedDate,
          is_courage_challenge: false,
          sort_order: 0,
        })
      })

      // Custom entries
      confirmedCustom.forEach(entry => {
        const backdatedDate = `${entry.year}-${String(entry.month).padStart(2, '0')}-01`
        rows.push({
          quest_id: quest.id,
          user_id: userId,
          text: entry.text,
          done: true,
          backdated: true,
          backdated_date: backdatedDate,
          is_courage_challenge: false,
          sort_order: 0,
        })
      })

      if (rows.length > 0) {
        // Dedupe against existing tasks
        const existingTexts = new Set((existingTasks || []).map(t => t.text.toLowerCase()))
        const unique = rows.filter(r => !existingTexts.has(r.text.toLowerCase()))

        if (unique.length > 0) {
          await supabase.from('quest_tasks').insert(unique)
        }
      }

      hapticSuccess()
      setOpen(false)
      setSelections({})
      setCustomEntries([])
      onSaved?.()
    } catch (err) {
      console.error('Backdate save error:', err)
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button onClick={() => { hapticLight(); setOpen(true) }} style={{
        width: '100%', padding: '12px', background: 'rgba(0,0,0,0.03)',
        border: '1px dashed rgba(0,0,0,0.12)', borderRadius: 12, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.4)',
        transition: 'all 0.2s', marginTop: 12,
      }}>
        Add pre-app progress to the line?
      </button>
    )
  }

  const yearOptions = getYearOptions()

  return (
    <div style={{ marginTop: 12, padding: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#1a1a2e' }}>Pre-app progress</div>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 16 }}>Tap anything you've already done. Set when it happened.</div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 16, color: 'rgba(0,0,0,0.3)', fontSize: 13, fontStyle: 'italic' }}>
          Thinking of milestones...
        </div>
      )}

      {/* AI milestones */}
      {milestones.map((milestone, i) => {
        const selected = selections[i]
        const confirmed = selected && selected.month !== null && selected.year !== null

        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <button onClick={() => toggleMilestone(i)} style={{
              width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              border: confirmed ? '2px solid #E9A23B' : selected ? '2px solid rgba(233,162,59,0.4)' : '2px solid rgba(0,0,0,0.08)',
              background: confirmed ? 'rgba(233,162,59,0.08)' : selected ? 'rgba(233,162,59,0.04)' : 'white',
              color: '#1a1a2e', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ flexShrink: 0 }}>{confirmed ? '✓' : selected ? '○' : '○'}</span>
              <span style={{ flex: 1, color: confirmed ? '#E9A23B' : 'inherit', fontWeight: confirmed ? 600 : 400 }}>{milestone}</span>
            </button>

            {selected && (
              <div style={{ display: 'flex', gap: 8, padding: '6px 0 0 28px' }}>
                <select value={selected.month ?? ''} onChange={e => setMilestoneDate(i, 'month', e.target.value)}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#1a1a2e' }}>
                  <option value="" disabled>Month</option>
                  {MONTHS.map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
                </select>
                <select value={selected.year ?? ''} onChange={e => setMilestoneDate(i, 'year', e.target.value)}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#1a1a2e' }}>
                  <option value="" disabled>Year</option>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>
        )
      })}

      {/* Custom entries */}
      {customEntries.map((entry, i) => (
        <div key={`c${i}`} style={{ marginBottom: 8 }}>
          <div style={{
            width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13,
            border: (entry.month !== null && entry.year !== null) ? '2px solid #E9A23B' : '2px solid rgba(0,0,0,0.08)',
            background: (entry.month !== null && entry.year !== null) ? 'rgba(233,162,59,0.08)' : 'white',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>✓</span>
            <span style={{ flex: 1, fontWeight: 600, color: '#E9A23B' }}>{entry.text}</span>
            <button onClick={() => removeCustom(i)} style={{ background: 'none', border: 'none', color: 'rgba(0,0,0,0.3)', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '6px 0 0 28px' }}>
            <select value={entry.month ?? ''} onChange={e => setCustomDate(i, 'month', e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#1a1a2e' }}>
              <option value="" disabled>Month</option>
              {MONTHS.map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
            </select>
            <select value={entry.year ?? ''} onChange={e => setCustomDate(i, 'year', e.target.value)}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#1a1a2e' }}>
              <option value="" disabled>Year</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      ))}

      {/* Add custom input */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input value={customText} onChange={e => setCustomText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCustom() }}
          placeholder="Add your own..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#1a1a2e' }} />
        <button onClick={addCustom} disabled={!customText.trim()}
          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: totalConfirmed > 0 || customText.trim() ? '#E9A23B' : 'rgba(0,0,0,0.06)', color: totalConfirmed > 0 || customText.trim() ? 'white' : 'rgba(0,0,0,0.3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          +
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={() => { setOpen(false); setSelections({}); setCustomEntries([]) }}
          style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={totalConfirmed === 0 || saving}
          style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: totalConfirmed > 0 ? '#E9A23B' : 'rgba(0,0,0,0.06)', color: totalConfirmed > 0 ? 'white' : 'rgba(0,0,0,0.3)', fontSize: 13, fontWeight: 700, cursor: totalConfirmed > 0 ? 'pointer' : 'default', fontFamily: 'inherit' }}>
          {saving ? 'Saving...' : `Save ${totalConfirmed} milestone${totalConfirmed !== 1 ? 's' : ''}`}
        </button>
      </div>

      {totalConfirmed > 0 && (
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', textAlign: 'center', marginTop: 8 }}>
          These show on your map but don't count toward points.
        </div>
      )}
    </div>
  )
}
