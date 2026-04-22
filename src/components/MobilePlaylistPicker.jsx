/**
 * MobilePlaylistPicker.jsx
 *
 * Challenge creation popup for the Play-List tab.
 * Steps: Role → Topic → Challenge + Day → Save
 *
 * Receives a pre-selected category from PlayListTab.
 * Topics come from nikigai_clusters (cluster_type: 'problems', step_id: 'identify_topics').
 * Roles come from wheelTaxonomy exampleJobs.
 * Play-skills shown as collapsible inspiration on challenge step.
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import { findSkillSegment } from '../lib/wheelTaxonomy'
import './MobilePlaylistPicker.css'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }

export default function MobilePlaylistPicker({
  userId,
  categoryId,
  userPlayskills = [],
  onChallengeAccepted,
  onClose,
}) {
  const [step, setStep] = useState('role') // role | topic | challenge | success
  const [topics, setTopics] = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [customTopic, setCustomTopic] = useState('')
  const [challengeText, setChallengeText] = useState('')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showPlayskills, setShowPlayskills] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const successTimerRef = useRef(null)

  const segment = findSkillSegment(categoryId)
  const roles = segment?.exampleJobs || []
  const playskills = userPlayskills.length > 0 ? userPlayskills : (segment?.placemakes || [])

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

  // Group topics by problem category
  const groupedTopics = useMemo(() => {
    const groups = {}
    topics.forEach(t => {
      const catId = t.items?.[0]?.categoryId || 'other'
      const catName = t.items?.[0]?.categoryName || 'Other'
      if (!groups[catId]) groups[catId] = { name: catName, items: [] }
      groups[catId].items.push(t)
    })
    return Object.values(groups)
  }, [topics])

  // Problem category icons
  const CATEGORY_ICONS = {
    kids_deserved_better: '👶', voice_taken: '😤', pain_not_believed: '😣',
    world_losing: '🌍', life_not_yours: '🎭', feeling_stupid: '😵‍💫',
    locked_out: '🔒', work_treated_nothing: '💔', left_behind: '😞',
    forgot_what_for: '🌑', stopped_wondering: '🤔', work_hollows: '😔',
  }

  const getTopicLabel = () => {
    if (selectedTopic) return selectedTopic.cluster_label
    if (customTopic.trim()) return customTopic.trim()
    return ''
  }

  const handleSaveChallenge = async () => {
    const topicLabel = getTopicLabel()
    if (!challengeText.trim() || !selectedDay || saving) return
    setSaving(true)
    setError(null)

    try {
      const title = `${challengeText.trim()} (${DAY_FULL[selectedDay]})`
      const description = [topicLabel, selectedRole].filter(Boolean).join(' × ')

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
          <p style={{ color: '#9a9daa', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {selectedRole} × {DAY_FULL[selectedDay]}
          </p>
        </div>
      </div>
    )
  }

  // ─── Step 1: Role ─────────────────────────────────────────────────────────

  if (step === 'role') {
    return (
      <div className="mpp-container">
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">💼</span>
              <span className="mpp-section-title">How do you want to show up?</span>
            </div>
          </div>
          <p style={{ color: '#9a9daa', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            Pick the role that fits this challenge.
          </p>
          <div className="mpp-section-items">
            {roles.map(role => (
              <button key={role} className="mpp-item-row"
                onClick={() => { setSelectedRole(role); setStep('topic') }}>
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

  // ─── Step 2: Topic (grouped by category) ──────────────────────────────────

  if (step === 'topic') {
    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('role')}>
          &larr; {selectedRole}
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">🎯</span>
              <span className="mpp-section-title">What problem will you tackle?</span>
            </div>
          </div>
          <p style={{ color: '#9a9daa', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            Pick a topic or write your own.
          </p>

          {groupedTopics.map(group => {
            const catId = group.items[0]?.items?.[0]?.categoryId
            const icon = CATEGORY_ICONS[catId] || '📌'
            return (
              <div key={group.name}>
                <div className="mpp-subsection-label">{icon} {group.name}</div>
                <div className="mpp-section-items">
                  {group.items.map(t => (
                    <button key={t.id} className="mpp-item-row"
                      onClick={() => { setSelectedTopic(t); setStep('challenge') }}>
                      <div className="mpp-item-body">
                        <div className="mpp-item-name">{t.cluster_label}</div>
                      </div>
                      <span className="mpp-item-arrow">&rsaquo;</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {topics.length === 0 && (
            <p style={{ color: '#9a9daa', fontSize: '0.82rem', margin: '0.5rem 0' }}>
              No topics identified yet. Type your own below.
            </p>
          )}

          <div className="mpp-subsection-label" style={{ color: '#9a9daa' }}>Write your own</div>
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
              onClick={() => { setSelectedTopic(null); setStep('challenge') }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step 3: Challenge + Day ──────────────────────────────────────────────

  if (step === 'challenge') {
    const topicLabel = getTopicLabel()
    const truncatedTopic = topicLabel.length > 60 ? topicLabel.slice(0, 60) + '...' : topicLabel

    return (
      <div className="mpp-container">
        <button className="mpp-back" onClick={() => setStep('topic')}>
          &larr; Back
        </button>
        <div className="mpp-section-card">
          <div className="mpp-section-header">
            <div className="mpp-section-header-left">
              <span className="mpp-section-icon">✏️</span>
              <span className="mpp-section-title">Create your challenge</span>
            </div>
          </div>

          <div className="mpp-step-context" style={{ marginBottom: '1rem' }}>
            <strong>{selectedRole}</strong> tackling<br />
            <em>"{truncatedTopic}"</em>
          </div>

          <div className="mpp-challenge-form">
            <input
              type="text"
              className="mpp-challenge-input"
              placeholder="What will you do this week?"
              value={challengeText}
              onChange={e => setChallengeText(e.target.value)}
            />

            <div className="mpp-subsection-label" style={{ marginTop: '0.5rem' }}>Pick a day</div>
            <div className="mpp-day-pills">
              {DAYS.map(day => (
                <button
                  key={day}
                  className={`mpp-day-pill ${selectedDay === day ? 'selected' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Collapsible play-skill inspiration */}
            <button
              className="mpp-playskill-toggle"
              onClick={() => setShowPlayskills(!showPlayskills)}
            >
              <span>{showPlayskills ? '▼' : '▶'}</span>
              Need inspiration? See your play-skills
            </button>
            {showPlayskills && (
              <div className="mpp-playskill-list">
                {playskills.map((ps, i) => (
                  <button
                    key={i}
                    className="mpp-playskill-item"
                    onClick={() => setChallengeText(ps)}
                  >
                    {ps}
                  </button>
                ))}
              </div>
            )}

            <button
              className="mpp-gold-btn mpp-gold-btn-spaced"
              disabled={!challengeText.trim() || !selectedDay || saving}
              onClick={handleSaveChallenge}
            >
              {saving ? 'Saving...' : 'Accept Challenge'}
            </button>
            {error && <p className="mpp-error">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  return null
}
