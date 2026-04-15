/**
 * MobilePlaylistPicker.jsx
 *
 * Challenge creation popup for the Play-List tab.
 * Steps: Topic → Role → Playskill → Challenge text → Day → Save
 *
 * Receives a pre-selected category from PlayListTab.
 * Topics come from nikigai_clusters (cluster_type: 'problems', step_id: 'identify_topics').
 * Roles come from wheelTaxonomy exampleJobs.
 * Playskills come from wheelTaxonomy placemakes.
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import { findSkillSegment } from '../lib/wheelTaxonomy'
import './MobilePlaylistPicker.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function MobilePlaylistPicker({
  userId,
  categoryId,
  onChallengeAccepted,
  onClose,
}) {
  const [step, setStep] = useState('topic') // topic | role | playskill | challenge | day | success
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [customTopic, setCustomTopic] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedPlayskill, setSelectedPlayskill] = useState(null)
  const [challengeText, setChallengeText] = useState('')
  const [selectedDay, setSelectedDay] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const successTimerRef = useRef(null)

  const segment = findSkillSegment(categoryId)
  const roles = segment?.exampleJobs || []
  const playskills = segment?.placemakes || []

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  // Load user's topics (problems) from DB
  useEffect(() => {
    if (!userId) return
    supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, items')
      .eq('user_id', userId)
      .eq('cluster_type', 'problems')
      .eq('step_id', 'identify_topics')
      .then(({ data }) => {
        if (data) setTopics(data)
      })
  }, [userId])

  // Split topics into matched vs potential for this category's playskills
  const matched = topics.filter(t => {
    const mp = t.items?.[0]?.matchedPlayskills || []
    return mp.some(ps => playskills.includes(ps))
  })
  const potential = topics.filter(t => {
    const mp = t.items?.[0]?.matchedPlayskills || []
    return !mp.some(ps => playskills.includes(ps))
  })

  const getTopicLabel = () => {
    if (selectedTopic) return selectedTopic.cluster_label
    if (customTopic.trim()) return customTopic.trim()
    return ''
  }

  const handleSaveChallenge = async () => {
    const topicLabel = getTopicLabel()
    if (!challengeText.trim() || !selectedDay || !selectedPlayskill || saving) return
    setSaving(true)
    setError(null)

    try {
      const title = `${challengeText.trim()} (${selectedDay})`
      const description = [
        topicLabel,
        selectedRole,
        selectedPlayskill,
      ].filter(Boolean).join(' × ')

      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title,
        description,
        visibilityLayer: null,
        sourceType: 'skill',
        sourceLabel: segment?.displayName || categoryId,
        scaryScore: null,
        wahooScore: null,
      })
      if (saveError) throw saveError

      const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
      if (acceptError) throw acceptError

      const { error: pickError } = await supabase.from('priority_weekly_picks').insert({
        user_id: userId,
        week_start_date: getWeekStartLocal(),
        pick_type: 'groan',
        reference_id: dbRecord.id,
        display_name: title,
      })
      if (pickError) console.warn('Error saving weekly pick:', pickError)

      onChallengeAccepted?.()

      setStep('success')
      successTimerRef.current = setTimeout(() => {
        onClose?.()
      }, 1500)
    } catch (err) {
      console.error('Error saving challenge:', err)
      setError('Failed to save challenge. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Success ──────────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="mpp-container">
        <div className="mpp-section-card mpp-success-card">
          <div className="mpp-success-icon">✅</div>
          <p className="mpp-success-text">Challenge confirmed!</p>
        </div>
      </div>
    )
  }

  // ─── Step 1: Topic ────────────────────────────────────────────────────────

  if (step === 'topic') {
    return (
      <div className="mpp-container">
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">{segment?.icon}</span>
              <span className="mpp-section-title">What topic will you cover?</span>
            </div>
          </div>

          <div className="mpp-subsection-label">Identify your own</div>
          <div className="mpp-challenge-form">
            <input
              type="text"
              className="mpp-challenge-input"
              placeholder="Type a topic..."
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
            />
            <button
              className="mpp-gold-btn"
              disabled={!customTopic.trim()}
              onClick={() => { setSelectedTopic(null); setStep('role') }}
            >
              Continue
            </button>
          </div>

          {matched.length > 0 && (
            <>
              <div className="mpp-subsection-label">Matched</div>
              <div className="mpp-section-items">
                {matched.map(t => (
                  <button key={t.id} className="mpp-item-row"
                    onClick={() => { setSelectedTopic(t); setStep('role') }}>
                    <div className="mpp-item-body">
                      <div className="mpp-item-name">{t.cluster_label}</div>
                    </div>
                    <span className="mpp-item-arrow">&rsaquo;</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {potential.length > 0 && (
            <>
              <div className="mpp-subsection-label">Potential</div>
              <div className="mpp-section-items">
                {potential.map(t => (
                  <button key={t.id} className="mpp-item-row"
                    onClick={() => { setSelectedTopic(t); setStep('role') }}>
                    <div className="mpp-item-body">
                      <div className="mpp-item-name">{t.cluster_label}</div>
                    </div>
                    <span className="mpp-item-arrow">&rsaquo;</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {topics.length === 0 && !customTopic && (
            <p className="mpp-empty" style={{ marginTop: '0.5rem' }}>
              No topics identified yet. Type your own above or identify topics from the Play-List tab.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Step 2: Role ─────────────────────────────────────────────────────────

  if (step === 'role') {
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('topic')}>
          &larr; {getTopicLabel()}
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">💼</span>
              <span className="mpp-section-title">How will you show up?</span>
            </div>
          </div>
          <div className="mpp-section-items">
            {roles.map(role => (
              <button key={role} className="mpp-item-row"
                onClick={() => { setSelectedRole(role); setStep('playskill') }}>
                <div className="mpp-item-body">
                  <div className="mpp-item-name">{role}</div>
                </div>
                <span className="mpp-item-arrow">&rsaquo;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 3: Playskill ────────────────────────────────────────────────────

  if (step === 'playskill') {
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('role')}>
          &larr; {selectedRole}
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">✨</span>
              <span className="mpp-section-title">What's the play-skill?</span>
            </div>
          </div>
          <div className="mpp-section-items">
            {playskills.map(ps => (
              <button key={ps} className="mpp-item-row"
                onClick={() => { setSelectedPlayskill(ps); setStep('challenge') }}>
                <div className="mpp-item-body">
                  <div className="mpp-item-name">{ps}</div>
                </div>
                <span className="mpp-item-arrow">&rsaquo;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 4: Challenge text ───────────────────────────────────────────────

  if (step === 'challenge') {
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('playskill')}>
          &larr; {selectedPlayskill?.substring(0, 40)}...
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">✏️</span>
              <span className="mpp-section-title">What's your challenge?</span>
            </div>
          </div>
          <div className="mpp-challenge-form">
            <div className="mpp-step-context">
              {getTopicLabel()} × {selectedRole} × {selectedPlayskill?.substring(0, 30)}...
            </div>
            <input
              type="text"
              className="mpp-challenge-input"
              placeholder="Type your challenge..."
              value={challengeText}
              onChange={e => setChallengeText(e.target.value)}
            />
            <button
              className="mpp-gold-btn"
              disabled={!challengeText.trim()}
              onClick={() => setStep('day')}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 5: Day ──────────────────────────────────────────────────────────

  if (step === 'day') {
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('challenge')}>
          &larr; {challengeText}
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">📅</span>
              <span className="mpp-section-title">Pick a day</span>
            </div>
          </div>
          <div className="mpp-section-items">
            {DAYS.map(day => (
              <button key={day} className="mpp-item-row"
                disabled={saving}
                onClick={() => setSelectedDay(day)}>
                <div className="mpp-item-body">
                  <div className="mpp-item-name">{day}</div>
                </div>
                {selectedDay === day ? (
                  <span className="mpp-item-check-mark">✓</span>
                ) : (
                  <span className="mpp-item-arrow">&rsaquo;</span>
                )}
              </button>
            ))}
          </div>
          <button
            className="mpp-gold-btn mpp-gold-btn-spaced"
            disabled={!selectedDay || saving}
            onClick={handleSaveChallenge}
          >
            {saving ? 'Saving...' : 'Accept Challenge'}
          </button>
          {error && <p className="mpp-error">{error}</p>}
        </div>
      </div>
    )
  }

  return null
}
