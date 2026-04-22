/**
 * ExperienceDetail — /business/experience/:id
 *
 * The workspace for a single experience. Phase 1 ships the Pre-Event tab with
 * Marketing + Organisation sections. Post-Event tab is placeholder (Phase 2).
 *
 * Features:
 *  - Countdown badge
 *  - Progress rings per section
 *  - Check items on/off
 *  - Hide seeded items (skip without deleting)
 *  - Add custom items per section
 *  - Delete custom items
 *  - Show hidden items toggle (so nothing feels permanently gone)
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useExperience, daysUntil, formatExperienceDate } from '../hooks/useExperienceData'
import { SECTION_META, PHASE_META } from '../lib/experienceChecklistTemplate'
import { CONVERTIBLE_SECTIONS, convertChecklistToChallenge, fetchDNASliders, fetchCreatorChallenges } from '../lib/checklistChallengeService'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ExperienceDetail.css'

const formatDate = (d) => formatExperienceDate(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

function countdownLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null) return null
  if (d > 1) return `${d} days to go`
  if (d === 1) return 'Tomorrow'
  if (d === 0) return 'Today'
  if (d === -1) return 'Yesterday'
  return `${Math.abs(d)} days ago`
}

export default function ExperienceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    experience,
    items,
    loading,
    error,
    toggleItem,
    hideItem,
    unhideItem,
    addCustomItem,
    deleteCustomItem,
  } = useExperience(id)

  const [activePhase, setActivePhase] = useState('pre')
  const [showHidden, setShowHidden] = useState(false)
  const [dnaSliders, setDnaSliders] = useState(null)
  const [dnaLoaded, setDnaLoaded] = useState(false)
  const [convertingItemId, setConvertingItemId] = useState(null)
  const [convertedIds, setConvertedIds] = useState(new Set())
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(null)
  const [deadlineDate, setDeadlineDate] = useState('')

  // Load DNA sliders + already-converted items
  useEffect(() => {
    if (!user?.id) return
    fetchDNASliders(user.id).then(sliders => {
      setDnaSliders(sliders)
      setDnaLoaded(true)
    })
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !id) return
    fetchCreatorChallenges(user.id, id).then(({ data }) => {
      const ids = new Set(data.filter(c => c.checklist_item_id).map(c => c.checklist_item_id))
      setConvertedIds(ids)
    })
  }, [user?.id, id])

  const handleConvertToChallenge = useCallback(async (item) => {
    if (!user?.id || !experience) return
    setConvertingItemId(item.id)
    try {
      const { error: convErr } = await convertChecklistToChallenge({
        userId: user.id,
        checklistItem: item,
        experience,
        deadline: deadlineDate || null,
        knowledgeStyle: dnaSliders?.knowledgeStyle || null,
      })
      if (!convErr) {
        hapticSuccess()
        setConvertedIds(prev => new Set([...prev, item.id]))
      }
    } catch (err) {
      console.error('Convert to challenge error:', err)
    }
    setConvertingItemId(null)
    setShowDeadlinePicker(null)
    setDeadlineDate('')
  }, [user?.id, experience, deadlineDate, dnaSliders])

  // Bucket items by phase → section
  const grouped = useMemo(() => {
    const buckets = { pre: { marketing: [], organisation: [] }, post: { followup: [], reflection: [] } }
    for (const item of items) {
      if (!buckets[item.phase]) continue
      if (!buckets[item.phase][item.section]) buckets[item.phase][item.section] = []
      buckets[item.phase][item.section].push(item)
    }
    return buckets
  }, [items])

  const handleToggle = async (itemId) => {
    hapticLight()
    await toggleItem(itemId)
  }

  if (loading) {
    return (
      <div className="exp-detail">
        <div className="exp-orb exp-orb-1" />
        <div className="exp-orb exp-orb-2" />
        <div className="exp-detail-container">
          <div className="exp-state">
            <div className="exp-spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !experience) {
    return (
      <div className="exp-detail">
        <div className="exp-detail-container">
          <div className="exp-state exp-error">
            <p>{error || 'Experience not found'}</p>
            <button className="exp-back" onClick={() => navigate('/create')}>← Back</button>
          </div>
        </div>
      </div>
    )
  }

  const countdown = countdownLabel(experience.experience_date)

  return (
    <div className="exp-detail">
      <div className="exp-orb exp-orb-1" />
      <div className="exp-orb exp-orb-2" />

      <div className="exp-detail-container">
        <button className="exp-back" onClick={() => navigate('/create')}>← All Experiences</button>

        {/* Header */}
        <header className="exp-detail-header">
          <h1 className="exp-detail-name">{experience.name}</h1>
          <div className="exp-detail-meta">
            <span className="exp-detail-date">{formatDate(experience.experience_date)}</span>
            {countdown && (
              <span className="exp-detail-countdown">{countdown}</span>
            )}
          </div>
        </header>

        {/* Phase tabs */}
        <div className="exp-phase-tabs">
          {(['pre', 'post']).map(phase => (
            <button
              key={phase}
              className={`exp-phase-tab ${activePhase === phase ? 'active' : ''}`}
              onClick={() => setActivePhase(phase)}
            >
              <div className="exp-phase-tab-title">{PHASE_META[phase].title}</div>
              <div className="exp-phase-tab-sub">{PHASE_META[phase].subtitle}</div>
            </button>
          ))}
        </div>

        {/* Sections for the active phase */}
        {activePhase === 'pre' && (
          <>
            <ChecklistSection
              section="marketing"
              items={grouped.pre.marketing || []}
              showHidden={showHidden}
              onToggle={handleToggle}
              onHide={hideItem}
              onUnhide={unhideItem}
              onAdd={(label) => addCustomItem({ phase: 'pre', section: 'marketing', label })}
              onDelete={deleteCustomItem}
              convertible
              convertedIds={convertedIds}
              convertingItemId={convertingItemId}
              showDeadlinePicker={showDeadlinePicker}
              deadlineDate={deadlineDate}
              onShowDeadline={(itemId) => setShowDeadlinePicker(itemId)}
              onDeadlineChange={setDeadlineDate}
              onConvert={handleConvertToChallenge}
              onCancelDeadline={() => { setShowDeadlinePicker(null); setDeadlineDate('') }}
              hasDna={dnaLoaded && dnaSliders?.knowledgeStyle != null}
            />
            <ChecklistSection
              section="organisation"
              items={grouped.pre.organisation || []}
              showHidden={showHidden}
              onToggle={handleToggle}
              onHide={hideItem}
              onUnhide={unhideItem}
              onAdd={(label) => addCustomItem({ phase: 'pre', section: 'organisation', label })}
              onDelete={deleteCustomItem}
            />
          </>
        )}

        {activePhase === 'post' && (
          <div className="exp-phase-placeholder">
            <div className="exp-phase-placeholder-icon">🔒</div>
            <h2>Post-event coming soon</h2>
            <p>
              The follow-up checklist, attendee upload, and 3% reflection
              unlock after your event. Come back on or after your date to
              close the loop and set up compounding wins for the next one.
            </p>
          </div>
        )}

        {/* Show hidden toggle */}
        {activePhase === 'pre' && (
          <button
            className="exp-show-hidden"
            onClick={() => setShowHidden(v => !v)}
          >
            {showHidden ? 'Hide skipped items' : 'Show skipped items'}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * ChecklistSection — renders a single section card with progress ring,
 * items list, add-custom input, and hide/unhide controls.
 */
function ChecklistSection({
  section, items, showHidden, onToggle, onHide, onUnhide, onAdd, onDelete,
  convertible = false, convertedIds, convertingItemId, showDeadlinePicker,
  deadlineDate, onShowDeadline, onDeadlineChange, onConvert, onCancelDeadline, hasDna,
}) {
  const meta = SECTION_META[section]
  const [addInputOpen, setAddInputOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)

  const visible = items.filter(i => showHidden || !i.is_hidden)
  const active = items.filter(i => !i.is_hidden)
  const completed = active.filter(i => i.completed).length
  const total = active.length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    setAdding(true)
    try {
      await onAdd(newLabel)
      hapticSuccess()
      setNewLabel('')
      setAddInputOpen(false)
    } catch {
      // swallow — hook logs
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="exp-section-card">
      <div className="exp-section-accent" />

      <div className="exp-section-head">
        <div className="exp-section-icon">{meta.icon}</div>
        <div className="exp-section-titleblock">
          <h2 className="exp-section-title">{meta.title}</h2>
          <div className="exp-section-subtitle">{meta.subtitle}</div>
        </div>
        <ProgressRing pct={pct} completed={completed} total={total} />
      </div>

      <ul className="exp-item-list">
        {visible.map(item => (
          <li key={item.id}>
            <ChecklistItem
              item={item}
              onToggle={onToggle}
              onHide={onHide}
              onUnhide={onUnhide}
              onDelete={onDelete}
              convertible={convertible && !item.completed && !item.is_hidden}
              isConverted={convertedIds?.has(item.id)}
              isConverting={convertingItemId === item.id}
              showDeadline={showDeadlinePicker === item.id}
              deadlineDate={deadlineDate}
              onShowDeadline={onShowDeadline}
              onDeadlineChange={onDeadlineChange}
              onConvert={onConvert}
              onCancelDeadline={onCancelDeadline}
              hasDna={hasDna}
            />
          </li>
        ))}
      </ul>

      {addInputOpen ? (
        <div className="exp-add-input-row">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') { setAddInputOpen(false); setNewLabel('') }
            }}
            placeholder="Add a custom task..."
            autoFocus
            maxLength={160}
          />
          <button className="exp-add-save" onClick={handleAdd} disabled={adding || !newLabel.trim()}>
            Add
          </button>
          <button className="exp-add-cancel" onClick={() => { setAddInputOpen(false); setNewLabel('') }}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="exp-add-button" onClick={() => setAddInputOpen(true)}>
          + Add custom task
        </button>
      )}
    </div>
  )
}

/**
 * ChecklistItem — single row with checkbox, label, and actions menu
 */
function ChecklistItem({
  item, onToggle, onHide, onUnhide, onDelete,
  convertible, isConverted, isConverting, showDeadline,
  deadlineDate, onShowDeadline, onDeadlineChange, onConvert, onCancelDeadline, hasDna,
}) {
  return (
    <div className={`exp-item ${item.completed ? 'exp-item-done' : ''} ${item.is_hidden ? 'exp-item-hidden' : ''}`}>
      <button
        className="exp-item-check"
        onClick={() => onToggle(item.id)}
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {item.completed && <span className="exp-item-check-tick">✓</span>}
      </button>

      <span className="exp-item-label">{item.label}</span>

      <div className="exp-item-actions">
        {/* Lightning bolt: convert to challenge */}
        {convertible && !isConverted && (
          <button
            className="exp-item-action exp-item-bolt"
            onClick={() => onShowDeadline(item.id)}
            disabled={isConverting}
            title="Make this a challenge"
          >
            {isConverting ? '...' : '⚡'}
          </button>
        )}
        {isConverted && (
          <span className="exp-item-converted" title="Active challenge">🎯</span>
        )}

        {item.is_custom ? (
          <button className="exp-item-action" onClick={() => onDelete(item.id)} title="Delete">✕</button>
        ) : item.is_hidden ? (
          <button className="exp-item-action" onClick={() => onUnhide(item.id)} title="Restore">↺</button>
        ) : (
          <button className="exp-item-action" onClick={() => onHide(item.id)} title="Skip">⊘</button>
        )}
      </div>

      {/* Deadline picker (shown when lightning bolt tapped) */}
      {showDeadline && (
        <div className="exp-deadline-picker">
          {!hasDna && (
            <p className="exp-deadline-dna-hint">
              Want personalized challenges? <a href="/play-profile">Complete your Play Profile</a>
            </p>
          )}
          <div className="exp-deadline-row">
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => onDeadlineChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="exp-deadline-input"
            />
            <button
              className="exp-deadline-go"
              onClick={() => onConvert(item)}
            >
              {isConverting ? '...' : 'Create Challenge'}
            </button>
            <button className="exp-deadline-cancel" onClick={onCancelDeadline}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ProgressRing — SVG circle with % fill in the middle
 */
function ProgressRing({ pct, completed, total }) {
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="exp-ring-wrap">
      <svg width={size} height={size} className="exp-ring">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5e17eb" />
            <stop offset="100%" stopColor="#E9A23B" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="exp-ring-label">
        <div className="exp-ring-pct">{pct}%</div>
        <div className="exp-ring-count">{completed}/{total}</div>
      </div>
    </div>
  )
}
