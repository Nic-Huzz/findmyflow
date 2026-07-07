/**
 * WahooDiscoveryFlow.jsx
 *
 * First-visit experience for the Wahoo (Play-list) tab.
 * 3 category pages (Creation, Connection, Appearance), 1-5 wahoos each,
 * then pick ONE to start with. Nothing is saved until the final confirm:
 * all entries land in groan_challenges as 'generated' (bucket list),
 * the chosen one is accepted + added to priority_weekly_picks.
 *
 * The gate that shows this flow (PlayListTab) checks for groan_challenges
 * rows with a wahoo_category, so quitting mid-flow is self-healing.
 *
 * CSS prefix: wdf-
 * Created: 2026-06-12
 */

import { useRef, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { STATES, STATE_META } from './LifePathMap/lifePaths'
import './WahooDiscoveryFlow.css'
import './HealingIntentionsList.css' // qs- styles

const MAX_PER_CATEGORY = 5

const CATEGORY_PAGES = [
  {
    id: 'creation',
    name: 'Creation',
    icon: '🎨',
    headline: 'What would you love to make?',
    explainer: 'Creation wahoos are about making something and letting it exist where people can see it.',
    examples: ['Post a video of me teaching something', 'Share a song I wrote', 'Publish my first newsletter'],
  },
  {
    id: 'connection',
    name: 'Connection',
    icon: '🤝',
    headline: 'Who would you love to reach?',
    explainer: 'Connection wahoos are about reaching out, being real with people, and asking for what you want.',
    examples: ['Voice note an old friend I miss', 'Ask someone I admire for a coffee', 'Tell a friend what they mean to me'],
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: '👤',
    headline: 'How would you love to show up?',
    explainer: 'Appearance wahoos are about being seen as you actually are, in person or on camera.',
    examples: ['Go dancing like nobody is watching', 'Wear the outfit I always talk myself out of', 'Speak first in a group'],
  },
]

export default function WahooDiscoveryFlow({
  userId,
  currentVisibilityLayer = 'screen',
  onComplete,
}) {
  // Steps 0-2 = category pages, 3 = pick first wahoo, 4 = success
  const [step, setStep] = useState(0)
  const [entries, setEntries] = useState({
    creation: [''],
    connection: [''],
    appearance: [''],
  })
  const [selected, setSelected] = useState(null) // { category, index }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  // Quest linking per wahoo entry
  const [entryQuests, setEntryQuests] = useState({
    creation: [null],
    connection: [null],
    appearance: [null],
  })
  const [quests, setQuests] = useState([])
  const [showNewQuest, setShowNewQuest] = useState(false)
  const [newQuestLabel, setNewQuestLabel] = useState('')
  const [newQuestState, setNewQuestState] = useState(null)
  const [newQuestSaving, setNewQuestSaving] = useState(false)
  const lastQuestId = useRef(null) // auto-fill from previous selection
  // Dedupe guard so a retry after partial failure never double-saves
  const savedRef = useRef({}) // key `${category}:${title}` -> challenge id
  // Remembers the pick across an error retry (state updates are async)
  const pendingPickRef = useRef(null)

  // Load quests once
  useEffect(() => {
    if (!userId) return
    supabase
      .from('quests')
      .select('id, label')
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('label', 'Healing Work')
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setQuests(data) })
  }, [userId])

  function updateEntryQuest(catId, index, questId) {
    lastQuestId.current = questId
    setEntryQuests(prev => {
      const next = [...prev[catId]]
      next[index] = questId
      return { ...prev, [catId]: next }
    })
  }

  async function handleCreateQuest() {
    if (!newQuestLabel.trim() || !newQuestState || newQuestSaving) return
    setNewQuestSaving(true)
    try {
      const { data } = await supabase.from('quests').insert({
        user_id: userId,
        label: newQuestLabel.trim(),
        predicted_state: newQuestState,
        status: 'active',
        sort_order: quests.length,
      }).select('id, label').single()
      if (data) {
        setQuests(prev => [...prev, data])
        lastQuestId.current = data.id
        setShowNewQuest(false)
        setNewQuestLabel('')
        setNewQuestState(null)
      }
    } catch (e) { console.error('Create quest error:', e) }
    setNewQuestSaving(false)
  }

  const page = CATEGORY_PAGES[step]
  const cleanEntries = (catId) =>
    entries[catId].map(t => t.trim()).filter(Boolean)
  const canAdvance = page ? cleanEntries(page.id).length > 0 : false

  function updateEntry(catId, index, value) {
    setEntries(prev => {
      const next = [...prev[catId]]
      next[index] = value
      return { ...prev, [catId]: next }
    })
  }

  function addEntry(catId) {
    hapticLight()
    setEntries(prev =>
      prev[catId].length >= MAX_PER_CATEGORY
        ? prev
        : { ...prev, [catId]: [...prev[catId], ''] }
    )
    setEntryQuests(prev =>
      prev[catId].length >= MAX_PER_CATEGORY
        ? prev
        : { ...prev, [catId]: [...prev[catId], lastQuestId.current] }
    )
  }

  function goNext() {
    hapticLight()
    setError(null)
    setStep(s => s + 1)
  }

  function goBack() {
    hapticLight()
    setError(null)
    setStep(s => s - 1)
  }

  async function handleFinish(pick) {
    if (saving) return
    pendingPickRef.current = pick
    setSaving(true)
    setError(null)

    try {
      // 1. Save every entry as a 'generated' bucket-list wahoo
      for (const cat of CATEGORY_PAGES) {
        for (const title of cleanEntries(cat.id)) {
          const key = `${cat.id}:${title}`
          if (savedRef.current[key]) continue // already saved on a prior attempt
          const { data, error: saveError } = await createGroanChallenge({
            userId,
            title,
            description: title,
            visibilityLayer: currentVisibilityLayer,
            sourceType: 'skill',
            sourceLabel: 'Wahoo Discovery',
            scaryScore: 7,
            wahooScore: 7,
            wahooCategory: cat.id,
          })
          if (saveError || !data) throw saveError || new Error('Wahoo was not saved')
          savedRef.current[key] = data.id
        }
      }

      // 2. Accept the chosen one and make it this week's active wahoo
      if (pick) {
        const title = entries[pick.category][pick.index]?.trim()
        const challengeId = title ? savedRef.current[`${pick.category}:${title}`] : null
        if (challengeId) {
          const { error: acceptError } = await acceptGroanChallenge(challengeId)
          if (acceptError) throw acceptError

          const { error: pickError } = await supabase.from('priority_weekly_picks').insert({
            user_id: userId,
            week_start_date: getWeekStartLocal(),
            pick_type: 'groan',
            reference_id: challengeId,
            display_name: title,
          })
          if (pickError) throw pickError
        }
      }

      // 3. Create quest_tasks for wahoos with quest links
      for (const cat of CATEGORY_PAGES) {
        const items = cleanEntries(cat.id)
        items.forEach((title, i) => {
          const questId = entryQuests[cat.id]?.[entries[cat.id].findIndex(e => e.trim() === title)]
          const groanId = savedRef.current[`${cat.id}:${title}`]
          if (questId && groanId) {
            supabase.from('quest_tasks').insert({
              quest_id: questId,
              user_id: userId,
              text: title,
              is_courage_challenge: true,
              groan_challenge_id: groanId,
              sort_order: 0,
            }).then(() => {}).catch(() => {})
          }
        })
      }

      hapticSuccess()
      setStep(4)
    } catch (err) {
      console.error('Wahoo discovery save error:', err)
      setError('Something went wrong saving your wahoos. Tap to try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Success ────────────────────────────────────────────────────────────────

  if (step === 4) {
    return (
      <div className="wahoo-discovery-flow">
        <div className="wdf-card wdf-success">
          <div className="wdf-success-icon">⚡</div>
          <h3 className="wdf-headline">Your Wahoo space is open</h3>
          <p className="wdf-explainer">
            Every wahoo you named is waiting in its category. Complete them to grow your capacity for expression.
          </p>
          <button className="wdf-primary-btn" onClick={() => onComplete?.()}>
            See my Wahoos
          </button>
        </div>
      </div>
    )
  }

  // ─── Pick your first Wahoo ──────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="wahoo-discovery-flow">
        <div className="wdf-card">
          <ProgressDots step={step} />
          <h3 className="wdf-headline">Pick your first Wahoo</h3>
          <p className="wdf-explainer">
            Choose one to start with this week. The rest stay on your list.
          </p>

          {CATEGORY_PAGES.map(cat => {
            const items = cleanEntries(cat.id)
            if (items.length === 0) return null
            return (
              <div key={cat.id} className="wdf-pick-group">
                <div className="wdf-pick-group-label">
                  <span>{cat.icon}</span> {cat.name}
                </div>
                {entries[cat.id].map((raw, i) => {
                  const title = raw.trim()
                  if (!title) return null
                  const isSelected = selected?.category === cat.id && selected?.index === i
                  return (
                    <button
                      key={i}
                      className={`wdf-pick-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        hapticLight()
                        setSelected(isSelected ? null : { category: cat.id, index: i })
                      }}
                    >
                      <span className="wdf-pick-radio">{isSelected ? '●' : '○'}</span>
                      <span className="wdf-pick-title">{title}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}

          {error && (
            <button className="wdf-error" onClick={() => handleFinish(pendingPickRef.current)}>{error}</button>
          )}

          <button
            className="wdf-primary-btn"
            disabled={!selected || saving}
            onClick={() => handleFinish(selected)}
          >
            {saving ? 'Saving...' : 'Start with this one 🔥'}
          </button>
          <div className="wdf-footer-row">
            <button className="wdf-text-btn" onClick={goBack} disabled={saving}>Back</button>
            <button
              className="wdf-text-btn"
              disabled={saving}
              onClick={() => handleFinish(null)}
            >
              Save all, choose later
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Category pages (steps 0-2) ─────────────────────────────────────────────

  return (
    <div className="wahoo-discovery-flow">
      <div className="wdf-card">
        <ProgressDots step={step} />
        <div className="wdf-cat-icon">{page.icon}</div>
        <div className="wdf-cat-name">{page.name}</div>
        <h3 className="wdf-headline">{page.headline}</h3>
        <p className="wdf-explainer">{page.explainer}</p>

        <div className="wdf-examples">
          {page.examples.map((ex, i) => (
            <span key={i} className="wdf-example-chip">{ex}</span>
          ))}
        </div>

        <div className="wdf-inputs">
          {entries[page.id].map((value, i) => (
            <div key={i} className="wdf-input-group">
              <input
                className="wdf-input"
                placeholder={i === 0 ? 'Something that would make you go "wahoo!"...' : 'Add another...'}
                value={value}
                maxLength={120}
                autoFocus={i === 0 && step === 0}
                onChange={e => updateEntry(page.id, i, e.target.value)}
              />
              {value.trim() && quests.length > 0 && (
                <select className="wdf-quest-select" value={entryQuests[page.id]?.[i] || ''}
                  onChange={e => {
                    if (e.target.value === '__new__') { setShowNewQuest(true); return }
                    updateEntryQuest(page.id, i, e.target.value || null)
                  }}>
                  <option value="">Life path (optional)</option>
                  {quests.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                  <option value="__new__">+ New life path...</option>
                </select>
              )}
            </div>
          ))}
        </div>

        {/* New quest inline form */}
        {showNewQuest && (
          <div className="wdf-new-quest">
            <input className="wdf-input" type="text" value={newQuestLabel}
              onChange={e => setNewQuestLabel(e.target.value)}
              placeholder="Life path name..." autoFocus />
            <div className="wdf-new-quest-states">
              {[...STATES].reverse().map(s => {
                const m = STATE_META[s]
                return (
                  <button key={s} className={`wdf-state-pill ${newQuestState === s ? 'selected' : ''}`}
                    style={newQuestState === s ? { borderColor: m.color, color: m.color, background: `${m.color}10` } : undefined}
                    onClick={() => setNewQuestState(s)}>
                    {m.emoji} {m.label}
                  </button>
                )
              })}
            </div>
            <div className="wdf-new-quest-actions">
              <button className="wdf-primary-btn" style={{ fontSize: 14, padding: '10px 16px' }}
                disabled={!newQuestLabel.trim() || !newQuestState || newQuestSaving}
                onClick={handleCreateQuest}>
                {newQuestSaving ? 'Creating...' : 'Create'}
              </button>
              <button className="wdf-text-btn" onClick={() => { setShowNewQuest(false); setNewQuestLabel(''); setNewQuestState(null) }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {entries[page.id].length < MAX_PER_CATEGORY && (
          <button className="wdf-add-btn" onClick={() => addEntry(page.id)}>
            + Add another
          </button>
        )}

        <button className="wdf-primary-btn" disabled={!canAdvance} onClick={goNext}>
          {step === 2 ? 'Review my Wahoos' : 'Next'}
        </button>
        {step > 0 && (
          <div className="wdf-footer-row">
            <button className="wdf-text-btn" onClick={goBack}>Back</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressDots({ step }) {
  return (
    <div className="wdf-dots">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={`wdf-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
      ))}
    </div>
  )
}
