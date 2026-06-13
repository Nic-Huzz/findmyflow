/**
 * WahooInspiration.jsx
 *
 * "Need inspiration? 💡" — collapsible section on the Wahoo tab (Play-list).
 * Permanent home for all Wahoo inspiration engines:
 *
 *   Row 1: ✨ Your play-skills — chips → AI suggestions (or PlaySkillPicker CTA if none)
 *   Row 2: 🎯 Ikigai Mix — skill × problem × persona from the Life Map (gated)
 *   Row 3: 🏛️ Fill a pillar — FUTURE (Essence Chamber pillar gaps), stub below
 *
 * Accept pipeline: createGroanChallenge → acceptGroanChallenge → priority_weekly_picks.
 * "Save for later" stops after step 1 (lands in bucket as status 'generated').
 *
 * CSS prefix: wi-
 * Created: 2026-06-12
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  createGroanChallenge,
  acceptGroanChallenge,
  fetchFlowFinderData,
  hasCompletedFlowFinder,
} from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import { findSkillSegment } from '../lib/wheelTaxonomy'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import PlaySkillPicker from './PlaySkillPicker'
import './WahooInspiration.css'

const WAHOO_CATEGORIES = [
  { id: 'creation', name: 'Creation', icon: '🎨' },
  { id: 'connection', name: 'Connection', icon: '🤝' },
  { id: 'appearance', name: 'Appearance', icon: '👤' },
]

export default function WahooInspiration({
  userId,
  categories = [], // user's play-skill category ids (from nikigai_clusters)
  currentVisibilityLayer = 'screen',
  onWahooAccepted,
  onWahooSaved,
  onPlaySkillsUpdated,
}) {
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState('rows') // rows | suggestions | preview
  const [genSource, setGenSource] = useState(null) // 'skill' | 'mix' | 'save' | null
  const generating = genSource !== null
  const [error, setError] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [flash, setFlash] = useState(null) // 'accepted' | 'saved'
  const flashTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current) }
  }, [])

  // Row 1 state
  const [selectedSkillCat, setSelectedSkillCat] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  // Row 2 state
  const [ikigaiReady, setIkigaiReady] = useState(false)
  const [ikigaiData, setIkigaiData] = useState(null) // { skills, problems, personas }
  const [picks, setPicks] = useState({ skill: null, problem: null, persona: null })

  // Preview state
  const [preview, setPreview] = useState(null) // challenge object
  const [previewOrigin, setPreviewOrigin] = useState('rows') // where Back returns to
  const [wahooCategory, setWahooCategory] = useState('creation')

  // Play-skill chips from category ids
  const skillChips = categories.map(catId => {
    const seg = findSkillSegment(catId)
    return seg
      ? { id: seg.id, name: seg.displayName, icon: seg.icon }
      : { id: catId, name: catId, icon: '✨' }
  })

  // Check Ikigai Mix eligibility once
  useEffect(() => {
    if (!userId) return
    hasCompletedFlowFinder(userId).then(({ completed }) => {
      if (!completed) return
      setIkigaiReady(true)
      fetchFlowFinderData(userId).then(({ data }) => {
        if (data) setIkigaiData(data)
      })
    })
  }, [userId])

  function flashThen(type) {
    setFlash(type)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlash(null), 1800)
  }

  // ─── Row 1: play-skill suggestions (3 in parallel) ─────────────────────────

  async function generateSuggestions(categoryId) {
    if (generating) return
    hapticLight()
    setGenSource('skill')
    setError(null)
    setSelectedSkillCat(categoryId)

    const seg = findSkillSegment(categoryId)
    const label = seg?.displayName || categoryId

    try {
      const results = await Promise.all(
        [1, 2, 3].map(n =>
          supabase.functions.invoke('groan-challenge-generator', {
            body: {
              sourceType: 'skill',
              sourceLabel: label,
              sourceInsight: `Generate suggestion ${n} of 3 for "${label}". Each suggestion must be completely different from the others. Suggestion ${n} should take a distinct angle.`,
              visibilityLayer: currentVisibilityLayer,
            },
          }).then(r => r.data).catch(() => null)
        )
      )

      const valid = results.filter(Boolean).map(data => ({
        title: data.title,
        description: data.description,
        scaryScore: data.scaryScore,
        wahooScore: data.wahooScore,
        sourceType: 'skill',
        sourceLabel: label,
      }))
      if (valid.length === 0) throw new Error('No suggestions generated')

      setSuggestions(valid)
      setMode('suggestions')
    } catch (err) {
      console.error('Inspiration suggestion error:', err)
      setError('Failed to generate suggestions. Try again.')
    } finally {
      setGenSource(null)
    }
  }

  // ─── Row 2: Ikigai Mix ──────────────────────────────────────────────────────

  function shufflePicks() {
    if (!ikigaiData) return
    hapticLight()
    const rand = arr => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : null)
    setPicks({
      skill: rand(ikigaiData.skills)?.cluster_label || null,
      problem: rand(ikigaiData.problems)?.cluster_label || null,
      persona: rand(ikigaiData.personas)?.cluster_label || null,
    })
  }

  const mixReady = picks.skill && picks.problem && picks.persona

  async function generateMix() {
    if (!mixReady || generating) return
    hapticLight()
    setGenSource('mix')
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('groan-challenge-generator', {
        body: {
          sourceType: 'skill_x_problem',
          skillLabel: picks.skill,
          problemLabel: picks.problem,
          personaLabel: picks.persona,
          visibilityLayer: currentVisibilityLayer,
        },
      })
      if (fnError) throw fnError

      setPreview({
        title: data.title,
        description: data.description,
        scaryScore: data.scaryScore,
        wahooScore: data.wahooScore,
        sourceType: 'skill_x_problem',
        sourceLabel: data.sourceLabel || `${picks.skill} × ${picks.problem} (for ${picks.persona})`,
      })
      setWahooCategory('creation')
      setPreviewOrigin('rows')
      setMode('preview')
    } catch (err) {
      console.error('Ikigai Mix error:', err)
      setError('Failed to mix. Try again.')
    } finally {
      setGenSource(null)
    }
  }

  // ─── Save / Accept ──────────────────────────────────────────────────────────

  async function saveChallenge(challenge, activate) {
    if (generating) return
    setGenSource('save')
    setError(null)
    try {
      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: challenge.title,
        description: challenge.description,
        visibilityLayer: currentVisibilityLayer,
        sourceType: challenge.sourceType,
        sourceLabel: challenge.sourceLabel,
        scaryScore: challenge.scaryScore,
        wahooScore: challenge.wahooScore,
        wahooCategory,
      })
      if (saveError || !dbRecord) throw saveError || new Error('Challenge was not saved')

      if (activate) {
        const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
        if (acceptError) throw acceptError
        const { error: pickError } = await supabase.from('priority_weekly_picks').insert({
          user_id: userId,
          week_start_date: getWeekStartLocal(),
          pick_type: 'groan',
          reference_id: dbRecord.id,
          display_name: challenge.title,
        })
        if (pickError) throw pickError
        hapticSuccess()
        onWahooAccepted?.()
        flashThen('accepted')
      } else {
        hapticLight()
        onWahooSaved?.()
        flashThen('saved')
      }
      setMode('rows')
      setSuggestions([])
      setPreview(null)
    } catch (err) {
      console.error('Inspiration save error:', err)
      setError('Failed to save. Try again.')
    } finally {
      setGenSource(null)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="wahoo-inspiration">
      <button
        className="wi-toggle"
        onClick={() => { hapticLight(); setExpanded(e => !e) }}
        aria-expanded={expanded}
      >
        <span className="wi-toggle-icon">💡</span>
        <span className="wi-toggle-label">Need inspiration?</span>
        <span className={`wi-toggle-chevron ${expanded ? 'open' : ''}`}>›</span>
      </button>

      {flash && (
        <div className="wi-flash">
          {flash === 'accepted' ? '🔥 Wahoo activated!' : '📋 Saved to your list'}
        </div>
      )}

      {expanded && (
        <div className="wi-body">
          {/* ── Suggestions list (Row 1 result) ── */}
          {mode === 'suggestions' && (
            <div className="wi-panel">
              <button className="wi-back" onClick={() => { setMode('rows'); setError(null) }}>← Back</button>
              <div className="wi-panel-title">
                Pick one for {findSkillSegment(selectedSkillCat)?.displayName || selectedSkillCat}
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="wi-suggestion-card"
                  disabled={generating}
                  onClick={() => {
                    hapticLight()
                    setPreview(s)
                    setWahooCategory('creation')
                    setPreviewOrigin('suggestions')
                    setMode('preview')
                  }}
                >
                  <div className="wi-suggestion-title">{s.title}</div>
                  <div className="wi-suggestion-desc">{s.description}</div>
                </button>
              ))}
              {error && <p className="wi-error">{error}</p>}
            </div>
          )}

          {/* ── Preview + category + accept/save ── */}
          {mode === 'preview' && preview && (
            <div className="wi-panel">
              <button className="wi-back" onClick={() => { setMode(previewOrigin); setError(null) }}>← Back</button>
              <div className="wi-preview-card">
                <div className="wi-preview-source">{preview.sourceLabel}</div>
                <div className="wi-preview-title">{preview.title}</div>
                <div className="wi-preview-desc">{preview.description}</div>
                <div className="wi-cat-row">
                  {WAHOO_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      className={`wi-cat-btn ${wahooCategory === cat.id ? 'selected' : ''}`}
                      onClick={() => { hapticLight(); setWahooCategory(cat.id) }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
                <button
                  className="wi-primary-btn"
                  disabled={generating}
                  onClick={() => saveChallenge(preview, true)}
                >
                  {generating ? 'Saving...' : 'Activate this Wahoo 🔥'}
                </button>
                <button
                  className="wi-text-btn"
                  disabled={generating}
                  onClick={() => saveChallenge(preview, false)}
                >
                  Save for later instead
                </button>
                {error && <p className="wi-error">{error}</p>}
              </div>
            </div>
          )}

          {/* ── Rows ── */}
          {mode === 'rows' && (
            <>
              {/* Row 1: Play-skills */}
              <div className="wi-row">
                <div className="wi-row-label">✨ Your play-skills</div>
                {skillChips.length > 0 ? (
                  <>
                    <div className="wi-row-sub">Tap one for tailored Wahoo ideas.</div>
                    <div className="wi-chips">
                      {skillChips.map(chip => (
                        <button
                          key={chip.id}
                          className="wi-chip"
                          disabled={generating}
                          onClick={() => generateSuggestions(chip.id)}
                        >
                          {chip.icon} {chip.name}
                        </button>
                      ))}
                    </div>
                    {genSource === 'skill' && (
                      <div className="wi-generating"><div className="wi-spinner" /> Finding ideas...</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="wi-row-sub">
                      Play-skills are a deck of things that light people up. Pick yours for tailored Wahoo ideas.
                    </div>
                    <button className="wi-chip wi-chip-cta" onClick={() => { hapticLight(); setShowPicker(true) }}>
                      Pick my play-skills
                    </button>
                  </>
                )}
              </div>

              {/* Row 2: Ikigai Mix */}
              <div className="wi-row">
                <div className="wi-row-label">🎯 Ikigai Mix</div>
                {ikigaiReady && ikigaiData ? (
                  <>
                    <div className="wi-row-sub">Mix a skill, a problem and a person from your Life Map.</div>
                    {['skill', 'problem', 'persona'].map(dim => {
                      const items = dim === 'skill' ? ikigaiData.skills : dim === 'problem' ? ikigaiData.problems : ikigaiData.personas
                      return (
                        <div key={dim} className="wi-ikigai-dim">
                          <div className="wi-ikigai-dim-label">{dim}</div>
                          <div className="wi-chips">
                            {items.map(item => (
                              <button
                                key={item.id}
                                className={`wi-chip wi-chip-small ${picks[dim] === item.cluster_label ? 'selected' : ''}`}
                                disabled={generating}
                                onClick={() => { hapticLight(); setPicks(p => ({ ...p, [dim]: item.cluster_label })) }}
                              >
                                {item.cluster_label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    <div className="wi-ikigai-actions">
                      <button className="wi-secondary-btn" disabled={generating} onClick={shufflePicks}>
                        Shuffle 🎲
                      </button>
                      <button className="wi-primary-btn wi-mix-btn" disabled={!mixReady || generating} onClick={generateMix}>
                        {genSource === 'mix' ? 'Mixing...' : 'Mix'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="wi-row-sub wi-locked">
                    🔒 Complete the <Link to="/life-map">Life Map</Link> to unlock Ikigai Mix.
                  </div>
                )}
              </div>

              {/* Row 3: 🏛️ Fill a pillar — FUTURE
                  Appears when Essence Chamber data exists
                  (flow_sessions.response_data.essence_chamber). Empty/flickering
                  pillars feed "test a new orb" wahoo suggestions through the same
                  generator pipeline (new sourceType 'pillar' when built). */}

              {error && <p className="wi-error">{error}</p>}
            </>
          )}
        </div>
      )}

      {showPicker && (
        <PlaySkillPicker
          userId={userId}
          onComplete={() => {
            setShowPicker(false)
            onPlaySkillsUpdated?.()
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
