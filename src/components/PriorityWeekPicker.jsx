/**
 * PriorityWeekPicker.jsx
 *
 * Weekly quest selector for the Priority tab (State 2).
 * 3 sections matching Mockup C grouped-sections design:
 *   1. Play-list Challenges (skill → layer → day → challenge text)
 *   2. Daily Healing
 *   3. Weekly Healing
 *
 * Sections matching the user's priority layer get gold accent + "Recommended" badge.
 *
 * Created: 2026-03-04
 */

import { useState, useMemo } from 'react'
import { GROAN_VISIBILITY_LAYERS } from '../lib/stageConfig'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function PriorityWeekPicker({
  skills,
  userId,
  dailyHealingQuests,
  weeklyHealingQuests,
  recommendations,
  onConfirm,
}) {
  // ── Playlist (groan replacement) state ──
  const [playlistStep, setPlaylistStep] = useState('skills') // 'skills' | 'layer' | 'day' | 'challenge'
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedLayer, setSelectedLayer] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showMoreSkills, setShowMoreSkills] = useState(false)
  const [challengeText, setChallengeText] = useState('')
  const [threePercentText, setThreePercentText] = useState('')
  const [saving, setSaving] = useState(false)
  const [playlistPicks, setPlaylistPicks] = useState([])
  // ── Other sections selections ──
  const [selections, setSelections] = useState({
    daily_healing: new Set(),
    weekly_healing: new Set(),
  })

  const totalPicks = useMemo(() =>
    playlistPicks.length + Object.values(selections).reduce((sum, set) => sum + set.size, 0),
    [playlistPicks, selections]
  )

  const toggleSelection = (type, id) => {
    setSelections(prev => {
      const next = new Set(prev[type])
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { ...prev, [type]: next }
    })
  }

  // ── Skill split (starred first) ──
  const isItemStarred = (item) => item.items?.some(i => i.isStarred === true)
  const starredSkills = useMemo(() => skills.filter(isItemStarred), [skills])
  const nonStarredSkills = useMemo(() => skills.filter(s => !isItemStarred(s)), [skills])
  const visibleSkills = showMoreSkills
    ? skills
    : (starredSkills.length > 0 ? starredSkills : skills)

  // ── Add challenge ──
  const handleAddChallenge = async () => {
    if (!challengeText.trim() || saving) return
    setSaving(true)
    try {
      let description = `Custom challenge: ${challengeText.trim()}`
      if (threePercentText.trim()) {
        description += `\n3% improvement: ${threePercentText.trim()}`
      }

      const saveResult = await createGroanChallenge({
        userId,
        title: challengeText.trim(),
        description,
        visibilityLayer: selectedLayer.id,
        sourceType: 'skill',
        sourceId: selectedSkill.id,
        sourceLabel: selectedSkill.cluster_label,
        scaryScore: 5,
        wahooScore: 5,
      })
      if (saveResult.error) throw saveResult.error

      const acceptResult = await acceptGroanChallenge(saveResult.data.id)
      if (acceptResult.error) throw acceptResult.error

      setPlaylistPicks(prev => [...prev, {
        challengeId: saveResult.data.id,
        skill: selectedSkill,
        layer: selectedLayer,
        day: selectedDay,
        title: challengeText.trim(),
      }])

      // Reset for next pick
      setChallengeText('')
      setThreePercentText('')
      setSelectedSkill(null)
      setSelectedLayer(null)
      setSelectedDay(null)
      setPlaylistStep('skills')
    } catch (err) {
      console.error('Error saving challenge:', err)
    } finally {
      setSaving(false)
    }
  }

  const removePick = (challengeId) => {
    setPlaylistPicks(prev => prev.filter(p => p.challengeId !== challengeId))
  }

  // ── Confirm all picks ──
  const handleConfirm = () => {
    const picks = []

    // Playlist picks (stored as groan type for backwards compat)
    for (const pick of playlistPicks) {
      picks.push({
        pick_type: 'groan',
        reference_id: pick.challengeId,
        display_name: `${pick.skill.cluster_label} × ${pick.layer.label} — ${pick.day}`,
      })
    }

    // Daily healing picks
    for (const id of selections.daily_healing) {
      const quest = dailyHealingQuests.find(q => q.id === id)
      picks.push({
        pick_type: 'daily_healing',
        reference_id: id,
        display_name: quest?.name || id,
      })
    }

    // Weekly healing picks
    for (const id of selections.weekly_healing) {
      const quest = weeklyHealingQuests.find(q => q.id === id)
      picks.push({
        pick_type: 'weekly_healing',
        reference_id: id,
        display_name: quest?.name || id,
      })
    }

    onConfirm(picks)
  }

  const isRecommended = (sectionKey) => recommendations?.sections?.includes(sectionKey)

  // ── Render playlist section content based on step ──
  const renderPlaylistContent = () => {
    if (skills.length === 0) {
      return (
        <div className="pt-empty-state">
          <p>No skills yet.</p>
          <a href="/mind-space" className="pt-empty-link">Complete Mind Space →</a>
        </div>
      )
    }

    if (playlistStep === 'skills') {
      return (
        <>
          {visibleSkills.map(skill => (
            <button
              key={skill.id}
              className="pt-pick-row"
              onClick={() => {
                setSelectedSkill(skill)
                setPlaylistStep('layer')
              }}
            >
              <div className="pt-pick-body">
                <div className="pt-pick-name">{skill.cluster_label}</div>
                <div className="pt-pick-meta">
                  {isItemStarred(skill) && <span className="pt-pill money">Starred</span>}
                  {skill.proficiency != null && <span>Proficiency: {String(skill.proficiency).charAt(0).toUpperCase() + String(skill.proficiency).slice(1)}</span>}
                </div>
              </div>
            </button>
          ))}
          {!showMoreSkills && starredSkills.length > 0 && nonStarredSkills.length > 0 && (
            <button
              className="pt-see-more-btn"
              onClick={() => setShowMoreSkills(true)}
            >
              See More ({nonStarredSkills.length})
            </button>
          )}
          {showMoreSkills && starredSkills.length > 0 && nonStarredSkills.length > 0 && (
            <button
              className="pt-see-more-btn"
              onClick={() => setShowMoreSkills(false)}
            >
              Show Less
            </button>
          )}
        </>
      )
    }

    if (playlistStep === 'layer') {
      return (
        <>
          <button className="pt-step-back" onClick={() => setPlaylistStep('skills')}>
            ← Back to skills
          </button>
          <div className="pt-step-context">
            Skill: <strong>{selectedSkill?.cluster_label}</strong>
          </div>
          {GROAN_VISIBILITY_LAYERS.map(layer => {
            const isLayerRecommended = recommendations?.type === 'playlist_layers' &&
              recommendations.layers?.includes(layer.id)
            return (
              <button
                key={layer.id}
                className={`pt-pick-row ${isLayerRecommended ? 'recommended' : ''}`}
                onClick={() => {
                  setSelectedLayer(layer)
                  setPlaylistStep('day')
                }}
              >
                <span className="pt-pick-check">{layer.icon}</span>
                <div className="pt-pick-body">
                  <div className="pt-pick-name">
                    {layer.label}
                    {isLayerRecommended && <span className="pt-rec-badge">Recommended</span>}
                  </div>
                  <div className="pt-pick-meta">{layer.fear}</div>
                </div>
              </button>
            )
          })}
        </>
      )
    }

    if (playlistStep === 'day') {
      return (
        <>
          <button className="pt-step-back" onClick={() => setPlaylistStep('layer')}>
            ← Back to layers
          </button>
          <div className="pt-step-context">
            {selectedSkill?.cluster_label} × <strong>{selectedLayer?.label}</strong>
          </div>
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              className="pt-pick-row"
              onClick={() => {
                setSelectedDay(day)
                setPlaylistStep('challenge')
              }}
            >
              <div className="pt-pick-body">
                <div className="pt-pick-name">{day}</div>
              </div>
            </button>
          ))}
        </>
      )
    }

    if (playlistStep === 'challenge') {
      return (
        <>
          <button className="pt-step-back" onClick={() => setPlaylistStep('day')}>
            ← Back to days
          </button>
          <div className="pt-step-context">
            {selectedSkill?.cluster_label} × {selectedLayer?.label} — <strong>{selectedDay}</strong>
          </div>
          <div className="pt-challenge-form">
            <label className="pt-challenge-label">What's your challenge?</label>
            <input
              type="text"
              className="pt-challenge-input"
              placeholder="Type your challenge..."
              value={challengeText}
              onChange={e => setChallengeText(e.target.value)}
              disabled={saving}
            />
            <label className="pt-challenge-label">How can you make this 3% better? (optional)</label>
            <input
              type="text"
              className="pt-challenge-input"
              placeholder="3% improvement..."
              value={threePercentText}
              onChange={e => setThreePercentText(e.target.value)}
              disabled={saving}
            />
            <button
              className="pt-gold-cta"
              disabled={!challengeText.trim() || saving}
              onClick={handleAddChallenge}
            >
              {saving ? 'Saving...' : 'Add Challenge'}
            </button>
          </div>
        </>
      )
    }
  }

  return (
    <div className="pt-week-picker">
      <div className="pt-picker-header">
        <h3 className="pt-picker-title">Plan Your Week</h3>
        <p className="pt-picker-desc">Choose what to focus on this week.</p>
      </div>

      {/* Play-list Challenges Section */}
      <div className={`pt-section-card ${isRecommended('groan') ? 'recommended' : ''}`}>
        <div className="pt-section-header">
          <div className="pt-section-header-left">
            <span className="pt-section-icon">🎮</span>
            <span className="pt-section-title">Play-list Challenges</span>
            {isRecommended('groan') && <span className="pt-rec-badge">Recommended</span>}
          </div>
          <span className="pt-section-count">
            {playlistPicks.length}
          </span>
        </div>

        {/* Selected picks as chips */}
        {playlistPicks.length > 0 && (
          <div className="pt-skill-chips">
            {playlistPicks.map(pick => (
              <div key={pick.challengeId} className="pt-skill-chip">
                {pick.skill.cluster_label} × {pick.layer.label} — {pick.day}
                <button onClick={() => removePick(pick.challengeId)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-section-items">
          {renderPlaylistContent()}
        </div>
      </div>

      {/* Daily Healing Section */}
      <div className={`pt-section-card ${isRecommended('daily_healing') ? 'recommended' : ''}`}>
        <div className="pt-section-header">
          <div className="pt-section-header-left">
            <span className="pt-section-icon">💚</span>
            <span className="pt-section-title">Daily Healing</span>
            {isRecommended('daily_healing') && <span className="pt-rec-badge">Recommended</span>}
          </div>
          <span className="pt-section-count">
            {selections.daily_healing.size}
          </span>
        </div>
        <div className="pt-section-items">
          {dailyHealingQuests.length === 0 ? (
            <div className="pt-empty-state">
              <p>No daily healing quests available.</p>
            </div>
          ) : (
            dailyHealingQuests.map(q => (
              <button
                key={q.id}
                className={`pt-pick-row ${selections.daily_healing.has(q.id) ? 'selected' : ''}`}
                onClick={() => toggleSelection('daily_healing', q.id)}
              >
                <span className={`pt-pick-check ${selections.daily_healing.has(q.id) ? 'checked' : ''}`}>
                  {selections.daily_healing.has(q.id) ? '✓' : ''}
                </span>
                <div className="pt-pick-body">
                  <div className="pt-pick-name">{q.name}</div>
                  <div className="pt-pick-meta">
                    <span className="pt-pill daily">{q.type}</span>
                    <span className="pt-pts">{q.points}pts</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Weekly Healing Section */}
      <div className={`pt-section-card ${isRecommended('weekly_healing') ? 'recommended' : ''}`}>
        <div className="pt-section-header">
          <div className="pt-section-header-left">
            <span className="pt-section-icon">💜</span>
            <span className="pt-section-title">Weekly Healing</span>
            {isRecommended('weekly_healing') && <span className="pt-rec-badge">Recommended</span>}
          </div>
          <span className="pt-section-count">
            {selections.weekly_healing.size}
          </span>
        </div>
        <div className="pt-section-items">
          {weeklyHealingQuests.length === 0 ? (
            <div className="pt-empty-state">
              <p>No weekly healing quests available.</p>
            </div>
          ) : (
            weeklyHealingQuests.map(q => (
              <button
                key={q.id}
                className={`pt-pick-row ${selections.weekly_healing.has(q.id) ? 'selected' : ''}`}
                onClick={() => toggleSelection('weekly_healing', q.id)}
              >
                <span className={`pt-pick-check ${selections.weekly_healing.has(q.id) ? 'checked' : ''}`}>
                  {selections.weekly_healing.has(q.id) ? '✓' : ''}
                </span>
                <div className="pt-pick-body">
                  <div className="pt-pick-name">{q.name}</div>
                  <div className="pt-pick-meta">
                    <span className="pt-pill weekly">{q.type}</span>
                    <span className="pt-pts">{q.points}pts</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <button
        className="pt-gold-cta"
        disabled={totalPicks === 0}
        onClick={handleConfirm}
      >
        Confirm My Week ({totalPicks} selected)
      </button>
    </div>
  )
}
