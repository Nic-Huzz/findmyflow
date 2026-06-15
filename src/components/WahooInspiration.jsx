/**
 * WahooInspiration.jsx
 *
 * "Need inspiration? 💡" — collapsible section on the Wahoo tab (Play-list).
 * Permanent home for all Wahoo inspiration engines:
 *
 *   Row 1: ✨ Your play-skills — chips → expression dials → freetext (or PlaySkillPicker CTA if none)
 *   Row 2: 🎯 Ikigai Mix — skill × problem × persona from the Life Map (gated)
 *   Row 3: 🏛️ Fill a pillar — gap pillar + lost orbs + freetext (gated by Essence Chamber)
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
  const [mode, setMode] = useState('rows') // rows | dials | preview
  const [genSource, setGenSource] = useState(null) // 'save' | null
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
  const [selectedDial, setSelectedDial] = useState(null)
  const [dialText, setDialText] = useState('')

  // Row 2 state
  const [ikigaiReady, setIkigaiReady] = useState(false)
  const [ikigaiData, setIkigaiData] = useState(null) // { skills, problems, personas }
  const [picks, setPicks] = useState({ skill: null, problem: null, persona: null })

  // Row 3 state (Essence Chamber pillars)
  const [pillarData, setPillarData] = useState(null) // { pillars, gap }
  const [pillarText, setPillarText] = useState('')

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
        if (data) {
          // Filter out play-skills (step_id 'get_started') — those belong in Row 1
          const lifeMapSkills = data.skills.filter(s => s.step_id !== 'get_started')
          setIkigaiData({ ...data, skills: lifeMapSkills })
        }
      })
      // Fetch Essence Chamber pillars from latest Life Map session
      supabase
        .from('flow_sessions')
        .select('response_data')
        .eq('user_id', userId)
        .eq('flow_type', 'life_map')
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          const chamber = data?.[0]?.response_data?.essence_chamber
          if (chamber?.pillars) setPillarData(chamber)
        })
    })
  }, [userId])

  function flashThen(type) {
    setFlash(type)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlash(null), 1800)
  }

  // ─── Row 1: expression dials ────────────────────────────────────────────────

  const EXPRESSION_DIALS = [
    { id: 'more_people', label: 'More people', icon: '🎤' },
    { id: 'bolder_topic', label: 'Bolder topic', icon: '📢' },
    { id: 'new_format', label: 'New format', icon: '🎭' },
    { id: 'charge_for_it', label: 'Higher price', icon: '💰' },
    { id: 'go_public', label: 'Go public', icon: '🌍' },
  ]

  function selectSkillChip(categoryId) {
    hapticLight()
    setSelectedSkillCat(categoryId)
    setSelectedDial(null)
    setDialText('')
    setMode('dials')
  }

  function selectDial(dialId) {
    hapticLight()
    setSelectedDial(dialId)
  }

  function handleDialSave() {
    if (!dialText.trim() || !selectedSkillCat) return
    const seg = findSkillSegment(selectedSkillCat)
    const dial = EXPRESSION_DIALS.find(d => d.id === selectedDial)
    setPreview({
      title: dialText.trim(),
      description: dialText.trim(),
      scaryScore: 5,
      wahooScore: 7,
      sourceType: 'skill',
      sourceLabel: `${seg?.displayName || selectedSkillCat}${dial ? ` · ${dial.label}` : ''}`,
    })
    setWahooCategory('creation')
    setPreviewOrigin('dials')
    setMode('preview')
  }

  // ─── Row 2: Ikigai Mix ──────────────────────────────────────────────────────

  function shufflePicks() {
    if (!ikigaiData) return
    hapticLight()
    const rand = arr => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : null)
    setPicks({
      skill: rand(ikigaiData.skills.slice(0, 5))?.cluster_label || null,
      problem: rand(ikigaiData.problems.slice(0, 5))?.cluster_label || null,
      persona: rand(ikigaiData.personas.slice(0, 5))?.cluster_label || null,
    })
  }

  const mixReady = picks.skill && picks.problem && picks.persona
  const [mixText, setMixText] = useState('')

  function handleMixSave() {
    if (!mixText.trim() || !mixReady) return
    setPreview({
      title: mixText.trim(),
      description: mixText.trim(),
      scaryScore: 5,
      wahooScore: 7,
      sourceType: 'skill_x_problem',
      sourceLabel: `${picks.skill} × ${picks.problem} (for ${picks.persona})`,
    })
    setWahooCategory('creation')
    setPreviewOrigin('rows')
    setMode('preview')
  }

  // ─── Row 3: Essence Chamber pillar gaps ─────────────────────────────────────

  const gapPillar = pillarData?.gap ? pillarData.pillars?.find(
    p => p.name === pillarData.gap.pillar_name
  ) : null

  const gapNowOrbs = gapPillar?.orbs?.now || []
  const gapLostOrbs = (() => {
    if (!gapPillar?.orbs) return []
    const nowSet = new Set((gapPillar.orbs.now || []).map(o => o.toLowerCase()))
    const earlier = [
      ...(gapPillar.orbs.childhood || []),
      ...(gapPillar.orbs.teens || []),
      ...(gapPillar.orbs.young_adult || []),
      ...(gapPillar.orbs.career || []),
    ]
    // Dedupe and exclude anything already in "now"
    const seen = new Set()
    return earlier.filter(o => {
      const key = o.toLowerCase()
      if (nowSet.has(key) || seen.has(key)) return false
      seen.add(key)
      return true
    })
  })()

  function handlePillarSave() {
    if (!pillarText.trim() || !gapPillar) return
    setPreview({
      title: pillarText.trim(),
      description: pillarText.trim(),
      scaryScore: 5,
      wahooScore: 8,
      sourceType: 'skill',
      sourceLabel: `Pillar: ${gapPillar.name}`,
    })
    setWahooCategory('creation')
    setPreviewOrigin('rows')
    setMode('preview')
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
      setPreview(null)
      setMixText('')
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
        className={`wi-toggle ${expanded ? 'open' : ''}`}
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
          {/* ── Expression dials (Row 1 result) ── */}
          {mode === 'dials' && (
            <div className="wi-panel">
              <button className="wi-back" onClick={() => { setMode('rows'); setSelectedSkillCat(null); setSelectedDial(null); setDialText('') }}>← Back</button>
              <div className="wi-panel-title">
                How could you stretch your {findSkillSegment(selectedSkillCat)?.displayName || selectedSkillCat}?
              </div>
              <div className="wi-dials">
                {EXPRESSION_DIALS.map(dial => (
                  <button
                    key={dial.id}
                    className={`wi-dial ${selectedDial === dial.id ? 'selected' : ''}`}
                    onClick={() => selectDial(dial.id)}
                  >
                    <span className="wi-dial-icon">{dial.icon}</span>
                    <span className="wi-dial-label">{dial.label}</span>
                  </button>
                ))}
              </div>
              {selectedDial && (
                <div className="wi-dial-input">
                  <input
                    type="text"
                    className="wi-dial-text"
                    placeholder="Write your Wahoo..."
                    value={dialText}
                    onChange={e => setDialText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDialSave()}
                    maxLength={120}
                  />
                  <button
                    className="wi-primary-btn"
                    disabled={!dialText.trim()}
                    onClick={handleDialSave}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Preview + category + accept/save ── */}
          {mode === 'preview' && preview && (
            <div className="wi-panel">
              <button className="wi-back" onClick={() => { setMode(previewOrigin); setError(null) }}>← Back</button>
              <div className="wi-preview-card">
                <div className="wi-preview-source">{preview.sourceLabel}</div>
                <div className="wi-preview-title">{preview.title}</div>
                {preview.description && preview.description !== preview.title && (
                  <div className="wi-preview-desc">{preview.description}</div>
                )}
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
                    <div className="wi-row-sub">Tap one to stretch your expression.</div>
                    <div className="wi-chips">
                      {skillChips.map(chip => (
                        <button
                          key={chip.id}
                          className="wi-chip"
                          onClick={() => selectSkillChip(chip.id)}
                        >
                          {chip.icon} {chip.name}
                        </button>
                      ))}
                    </div>
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
                      const allItems = dim === 'skill' ? ikigaiData.skills : dim === 'problem' ? ikigaiData.problems : ikigaiData.personas
                      const items = allItems.slice(0, 5)
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
                      <button className="wi-secondary-btn" onClick={shufflePicks}>
                        Shuffle 🎲
                      </button>
                    </div>
                    {mixReady && (
                      <div className="wi-mix-prompt">
                        <p className="wi-mix-question">
                          What experience could you create that solves <strong>{picks.problem}</strong> for <strong>{picks.persona}</strong> using your <strong>{picks.skill}</strong>?
                        </p>
                        <input
                          type="text"
                          className="wi-dial-text"
                          placeholder="Write your Wahoo..."
                          value={mixText}
                          onChange={e => setMixText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleMixSave()}
                          maxLength={120}
                        />
                        <button
                          className="wi-primary-btn wi-mix-btn"
                          disabled={!mixText.trim()}
                          onClick={handleMixSave}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="wi-row-sub wi-locked">
                    🔒 Complete the <Link to="/life-map">Life Map</Link> to unlock Ikigai Mix.
                  </div>
                )}
              </div>

              {/* Row 3: Fill a pillar */}
              {pillarData && gapPillar && (
                <div className="wi-row">
                  <div className="wi-row-label">🏛️ Fill a pillar</div>
                  <div className="wi-pillar-card">
                    <div className="wi-pillar-status">
                      <span className={`wi-pillar-badge wi-pillar-${gapPillar.status.toLowerCase()}`}>
                        {gapPillar.status === 'FLICKERING' ? '⚡ Flickering' : '💀 Empty'}
                      </span>
                    </div>
                    <div className="wi-pillar-name">{gapPillar.name}</div>
                    <div className="wi-pillar-insight">{pillarData.gap.insight}</div>

                    {gapNowOrbs.length > 0 && (
                      <div className="wi-pillar-orbs">
                        <div className="wi-pillar-orbs-label">Currently feeding this:</div>
                        <div className="wi-chips">
                          {gapNowOrbs.map(orb => (
                            <span key={orb} className="wi-chip wi-chip-small wi-chip-muted">{orb}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {gapLostOrbs.length > 0 && (
                      <div className="wi-pillar-orbs">
                        <div className="wi-pillar-orbs-label">You used to do:</div>
                        <div className="wi-chips">
                          {gapLostOrbs.map(orb => (
                            <span key={orb} className="wi-chip wi-chip-small wi-chip-lost">{orb}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="wi-pillar-prompt">
                      <p className="wi-mix-question">What experience could feed this pillar?</p>
                      <input
                        type="text"
                        className="wi-dial-text"
                        placeholder="Write your Wahoo..."
                        value={pillarText}
                        onChange={e => setPillarText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePillarSave()}
                        maxLength={120}
                      />
                      <button
                        className="wi-primary-btn"
                        disabled={!pillarText.trim()}
                        onClick={handlePillarSave}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
