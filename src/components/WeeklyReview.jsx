/**
 * WeeklyReview.jsx
 *
 * 7-question weekly self-audit of T4 multipliers.
 * Single scrollable form, all questions on one page.
 * 15 RP on completion, +5 RP for sharing.
 * Does NOT affect Capacity Score.
 *
 * CSS prefix: wr-
 * Created: 2026-06-14
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { postFeedEvent } from '../lib/communityFeed'
import { getDimensionById, getNumericTier } from '../data/domeDimensions'
import { ESSENCE_ARCHETYPES } from '../data/essenceArchetypes'
import confetti from 'canvas-confetti'
import WeeklyReviewCard from './WeeklyReviewCard'
import './WeeklyReview.css'

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'IDR', symbol: 'Rp' },
]

export default function WeeklyReview({ userId, weekStart, heroStage = 0, onComplete, onClose }) {
  const [compoundingText, setCompoundingText] = useState('')
  const [incomeEntries, setIncomeEntries] = useState([]) // [{ questId, amount, currency }]
  const [activeQuests, setActiveQuests] = useState([])
  const [saving, setSaving] = useState(false)
  const [savedReview, setSavedReview] = useState(null)
  const [aftertasteReviews, setAftertasteReviews] = useState([]) // 'not_sure' challenges from this week
  const [essenceName, setEssenceName] = useState(null)
  const [voiceWon, setVoiceWon] = useState(null) // null | true | false
  const [voiceWhich, setVoiceWhich] = useState(null)
  const [voiceText, setVoiceText] = useState('')

  // Per-path fuel reviews: { questId: { choice: bool, connection: bool, mastery: bool, meaning: bool } | 'skip' }
  const [pathFuels, setPathFuels] = useState({})

  // Load active quests for income tagging
  useEffect(() => {
    if (!userId) return
    supabase.from('quests')
      .select('id, label')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) setActiveQuests(data)
      })
  }, [userId])

  // Load essence archetype name
  useEffect(() => {
    if (!userId) return
    supabase.from('lead_flow_profiles')
      .select('custom_essence_name, essence_archetype')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEssenceName(data.custom_essence_name || data.essence_archetype)
        } else {
          // Fallback: check if archetype is in any quests or stage progress
          supabase.from('quests')
            .select('label')
            .eq('user_id', userId)
            .limit(1)
            .then(() => {}) // essence not critical, just nice to have
        }
      })
  }, [userId])

  // Load 'not_sure' aftertaste challenges from previous week (second clock)
  // The weekly review asks "a week on..." so we look at the PRIOR week, not current
  useEffect(() => {
    if (!userId || !weekStart) return
    let cancelled = false
    const priorWeekStart = new Date(weekStart + 'T00:00:00')
    priorWeekStart.setDate(priorWeekStart.getDate() - 7)
    supabase
      .from('quest_completions')
      .select('id, quest_id, reflection_text, aftertaste')
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .eq('aftertaste', 'not_sure')
      .is('aftertaste_week_later', null)
      .gte('created_at', priorWeekStart.toISOString())
      .lt('created_at', weekStart + 'T00:00:00')
      .then(({ data }) => {
        if (cancelled || !data) return
        const reviews = data.map(row => {
          let title = null
          try {
            const parsed = JSON.parse(row.reflection_text)
            title = parsed?.source_label || parsed?.challenge_id
          } catch {}
          return { id: row.id, title: title || 'a courage challenge' }
        })
        setAftertasteReviews(reviews)
      })
    return () => { cancelled = true }
  }, [userId, weekStart])

  // Compute per-quest dome growth this week
  const [weeklyGrowth, setWeeklyGrowth] = useState([]) // [{ questLabel, dims: [{ label, from, to }] }]
  useEffect(() => {
    if (!userId || !weekStart) return
    let cancelled = false

    async function computeGrowth() {
      // Get this week's completed groans with quest + dims + NS outcome
      const { data: groans } = await supabase.from('groan_challenges')
        .select('id, quest_id, dimension_values, expansion_dimensions')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('dimension_values', 'is', null)
        .gte('completed_at', weekStart + 'T00:00:00')

      if (cancelled || !groans?.length) return

      // Get NS check-ins for these challenges (need integrated state)
      const ids = groans.map(g => g.id)
      const { data: checkins } = await supabase.from('nervous_system_checkins')
        .select('source_challenge_id, after_state')
        .in('source_challenge_id', ids)
        .not('after_state', 'is', null)

      const stateMap = {}
      ;(checkins || []).forEach(ci => {
        if (!stateMap[ci.source_challenge_id]) stateMap[ci.source_challenge_id] = ci.after_state
      })

      // Get quest labels
      const questIds = [...new Set(groans.map(g => g.quest_id).filter(Boolean))]
      const { data: quests } = questIds.length
        ? await supabase.from('quests').select('id, label').in('id', questIds)
        : { data: [] }
      const questMap = {}
      ;(quests || []).forEach(q => { questMap[q.id] = q.label })

      // Get prior dome edges (before this week) for comparison
      const { data: priorGroans } = await supabase.from('groan_challenges')
        .select('id, dimension_values')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('dimension_values', 'is', null)
        .lt('completed_at', weekStart + 'T00:00:00')

      const { data: priorCheckins } = (priorGroans?.length)
        ? await supabase.from('nervous_system_checkins')
          .select('source_challenge_id, after_state')
          .in('source_challenge_id', priorGroans.map(g => g.id))
          .not('after_state', 'is', null)
        : { data: [] }

      const priorStateMap = {}
      ;(priorCheckins || []).forEach(ci => {
        if (!priorStateMap[ci.source_challenge_id]) priorStateMap[ci.source_challenge_id] = ci.after_state
      })

      // Compute prior dome edges per dimension
      const priorEdges = {}
      ;(priorGroans || []).forEach(c => {
        const state = priorStateMap[c.id]
        if (!state || !['vibe_rise', 'ventral'].includes(state)) return
        Object.entries(c.dimension_values || {}).forEach(([dimId, val]) => {
          const dim = getDimensionById(dimId)
          if (!dim) return
          const level = dim.type === 'numeric' ? getNumericTier(dimId, val) : val
          if (level > 0) priorEdges[dimId] = Math.max(priorEdges[dimId] || 0, level)
        })
      })

      // Group this week's integrated groans by quest, find new highs
      const byQuest = {}
      groans.forEach(g => {
        const state = stateMap[g.id]
        if (!state || !['vibe_rise', 'ventral'].includes(state)) return
        const qId = g.quest_id || '_unlinked'
        if (!byQuest[qId]) byQuest[qId] = []
        byQuest[qId].push(g)
      })

      const growth = []
      for (const [qId, qGroans] of Object.entries(byQuest)) {
        const dimGrowth = []
        const weekEdges = {}

        qGroans.forEach(g => {
          Object.entries(g.dimension_values || {}).forEach(([dimId, val]) => {
            const dim = getDimensionById(dimId)
            if (!dim) return
            const level = dim.type === 'numeric'
              ? (dim.tiers || []).findIndex(t => val < t) || dim.tiers?.length || 0
              : val
            if (level > 0) weekEdges[dimId] = Math.max(weekEdges[dimId] || 0, level)
          })
        })

        for (const [dimId, newLevel] of Object.entries(weekEdges)) {
          const prior = priorEdges[dimId] || 0
          if (newLevel > prior) {
            const dim = getDimensionById(dimId)
            dimGrowth.push({ label: dim?.label || dimId, from: prior, to: newLevel })
          }
        }

        if (dimGrowth.length > 0) {
          growth.push({
            questLabel: questMap[qId] || 'General',
            dims: dimGrowth,
          })
        }
      }

      if (!cancelled) setWeeklyGrowth(growth)
    }

    computeGrowth().catch(() => {})
    return () => { cancelled = true }
  }, [userId, weekStart])

  const isValid = compoundingText.trim().length > 0

  async function handleSubmit() {
    if (!isValid || saving) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .insert({
          user_id: userId,
          week_start: weekStart,
          narrative_revision: null,
          identity_did: voiceWon,
          identity_text: voiceWon ? `${voiceWhich || 'unknown'}: ${voiceText.trim()}` : null,
          compounding_text: compoundingText.trim() || null,
        })
        .select()
        .single()
      if (error) throw error

      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: 'healing',
        p_points: 15,
        p_week_start: getWeekStartLocal(),
      })

      // Save per-quest income (accumulates into monthly total)
      const validEntries = incomeEntries.filter(e => parseFloat(e.amount) > 0)
      if (validEntries.length > 0) {
        const now = new Date()
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const totalCents = validEntries.reduce((sum, e) => sum + Math.round(parseFloat(e.amount) * 100), 0)

        // Accumulate into monthly total
        const { data: existing } = await supabase.from('income_self_reports')
          .select('amount_cents').eq('user_id', userId).eq('month_year', monthYear).maybeSingle()

        // Per-quest breakdown stored in source field as JSON
        const sourceData = JSON.stringify(validEntries.map(e => ({
          quest_id: e.questId,
          amount: parseFloat(e.amount),
          currency: e.currency,
        })))

        await supabase.from('income_self_reports').upsert({
          user_id: userId,
          month_year: monthYear,
          amount_cents: (existing?.amount_cents || 0) + totalCents,
          currency: validEntries[0].currency,
          source: sourceData,
        }, { onConflict: 'user_id,month_year' }).catch(() => {})
      }

      // Save per-path fuel reviews
      const fuelRows = Object.entries(pathFuels)
        .filter(([, val]) => val && val !== 'skip' && typeof val === 'object')
        .map(([questId, fuels]) => ({
          user_id: userId,
          quest_id: questId,
          week_of: weekStart,
          choice: fuels.choice ?? null,
          connection: fuels.connection ?? null,
          mastery: fuels.mastery ?? null,
          meaning: fuels.meaning ?? null,
        }))
      if (fuelRows.length > 0) {
        await supabase.from('path_fuel_reviews')
          .upsert(fuelRows, { onConflict: 'user_id,quest_id,week_of' })
          .catch(() => {})
      }

      hapticSuccess()
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
      setSavedReview(data)

      // Mystery box: 4th weekly review
      supabase.from('weekly_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then(({ count }) => {
          if (count === 4) import('../lib/mysteryBoxes').then(m => m.earnMysteryBox(userId, 'weekly_review_streak_4', 'silver'))
        }).catch(() => {})

      onComplete?.()
    } catch (err) {
      console.error('Weekly review save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!savedReview) return
    try {
      await supabase
        .from('weekly_reviews')
        .update({ shared: true })
        .eq('id', savedReview.id)
      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: 'healing',
        p_points: 5,
        p_week_start: getWeekStartLocal(),
      })
      postFeedEvent(userId, 'shared_weekly_review',
        `Shared their weekly review (${weekLabel})`,
        savedReview?.narrative_revision?.slice(0, 140) || null)
      onComplete?.()
    } catch (err) {
      console.error('Share bonus error:', err)
    }
  }

  // Format week label
  const weekLabel = (() => {
    const d = new Date(weekStart + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })()

  if (savedReview) {
    return (
      <div className="wr-overlay" onClick={onClose}>
        <div className="wr-modal" onClick={e => e.stopPropagation()}>
          <WeeklyReviewCard
            review={savedReview}
            weekLabel={weekLabel}
            onShare={handleShare}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="wr-overlay" onClick={onClose}>
      <div className="wr-modal" onClick={e => e.stopPropagation()}>
        <div className="wr-header">
          <div className="wr-header-left">
            <div className="wr-header-icon">⚡</div>
            <div>
              <h2 className="wr-title">Weekly Multipliers</h2>
              <p className="wr-week">Week of {weekLabel}</p>
            </div>
          </div>
          <button className="wr-close" onClick={onClose}>&times;</button>
        </div>

        <div className="wr-progress">
          <div className="wr-progress-fill" style={{ width: `${Math.round(([voiceWon !== null, compoundingText.trim()].filter(Boolean).length / 2) * 100)}%` }} />
        </div>

        <div className="wr-form">
          {/* Second Clock: aftertaste follow-up for 'not_sure' challenges */}
          {aftertasteReviews.length > 0 && (
            <div className="wr-question">
              <div className="wr-question-top">
                <span className="wr-question-icon">🔁</span>
                <span className="wr-question-label">A week on...</span>
              </div>
              {aftertasteReviews.map(review => (
                <div key={review.id} className="wr-aftertaste-item">
                  <p className="wr-question-text">
                    You did <strong>{review.title}</strong> and weren't sure if you wanted to do it again. A week later, has that changed?
                  </p>
                  <div className="wr-option-row">
                    {[
                      { value: 'yes', label: '🔥 Yes, I want to' },
                      { value: 'no', label: '😶 No, it\'s faded' },
                      { value: 'still_not_sure', label: '🤷 Still not sure' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`wr-option-btn ${review.answer === opt.value ? 'selected' : ''}`}
                        disabled={!!review.answer}
                        onClick={() => {
                          hapticLight()
                          setAftertasteReviews(prev => prev.map(r => r.id === review.id ? { ...r, answer: opt.value } : r))
                          supabase.from('quest_completions').update({ aftertaste_week_later: opt.value }).eq('id', review.id).then(() => {})
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Q2: Protective Voice */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🛡️</span>
              <span className="wr-question-label">Protective Voice</span>
            </div>
            <p className="wr-question-text">Were there moments your protective voice won this week?</p>
            <div className="wr-option-row">
              <button
                type="button"
                className={`wr-option-btn ${voiceWon === true ? 'selected wr-option-negative' : ''}`}
                onClick={() => { hapticLight(); setVoiceWon(true) }}
              >
                Yes
              </button>
              <button
                type="button"
                className={`wr-option-btn ${voiceWon === false ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setVoiceWon(false) }}
              >
                No
              </button>
            </div>
            {voiceWon && (
              <>
                <p className="wr-question-sub">Which voice showed up?</p>
                <div className="wr-voice-row">
                  {[
                    { id: 'ghost', icon: '👻', label: 'Ghost' },
                    { id: 'perfectionist', icon: '🎭', label: 'Perfectionist' },
                    { id: 'people_pleaser', icon: '🪞', label: 'People Pleaser' },
                    { id: 'controller', icon: '🎮', label: 'Controller' },
                    { id: 'auto_pilot', icon: '🛋️', label: 'Auto-Pilot' },
                  ].map(v => (
                    <button
                      key={v.id}
                      type="button"
                      className={`wr-voice-btn ${voiceWhich === v.id ? 'selected' : ''}`}
                      onClick={() => { hapticLight(); setVoiceWhich(v.id) }}
                    >
                      <span>{v.icon}</span>
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>
                <textarea
                  className="wr-textarea wr-textarea-conditional"
                  value={voiceText}
                  onChange={e => setVoiceText(e.target.value)}
                  placeholder="What happened?"
                  maxLength={200}
                />
              </>
            )}
          </div>

          {/* Q3: Essence honour */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">✨</span>
              <span className="wr-question-label">{essenceName || 'Your Essence'}</span>
            </div>
            <p className="wr-question-text">
              How did you honour your {essenceName ? <strong>{essenceName}</strong> : 'true self'} this week?
            </p>
            <textarea
              className="wr-textarea"
              value={compoundingText}
              onChange={e => setCompoundingText(e.target.value)}
              placeholder="I showed up as my true self when..."
              maxLength={200}
            />
          </div>

          {/* Q3b: Life fuel per path */}
          {activeQuests.length > 0 && (
            <div className="wr-question">
              <div className="wr-question-top">
                <span className="wr-question-icon">⛽</span>
                <span className="wr-question-label">Life Fuel</span>
              </div>
              <p className="wr-question-text">For each path, what was true this week?</p>
              {activeQuests.map(q => {
                const fuel = pathFuels[q.id]
                const skipped = fuel === 'skip'
                return (
                  <div key={q.id} className="wr-fuel-quest">
                    <div className="wr-fuel-quest-name">{q.label}</div>
                    {!skipped ? (
                      <>
                        {[
                          { id: 'choice', emoji: '🔓', text: 'I did this because I wanted to' },
                          { id: 'connection', emoji: '🤝', text: 'The people felt like my tribe' },
                          { id: 'mastery', emoji: '📈', text: 'I used or grew a skill I love' },
                          { id: 'meaning', emoji: '✨', text: 'This served something I care about' },
                        ].map(f => {
                          const val = fuel?.[f.id]
                          return (
                            <div key={f.id} className="wr-fuel-row">
                              <span className="wr-fuel-emoji">{f.emoji}</span>
                              <span className="wr-fuel-text">{f.text}</span>
                              <div className="wr-fuel-toggle">
                                <button
                                  className={`wr-fuel-btn ${val === true ? 'yes' : ''}`}
                                  onClick={() => {
                                    hapticLight()
                                    setPathFuels(prev => ({
                                      ...prev,
                                      [q.id]: { ...(typeof prev[q.id] === 'object' ? prev[q.id] : {}), [f.id]: val === true ? null : true }
                                    }))
                                  }}>Yes</button>
                                <button
                                  className={`wr-fuel-btn ${val === false ? 'no' : ''}`}
                                  onClick={() => {
                                    hapticLight()
                                    setPathFuels(prev => ({
                                      ...prev,
                                      [q.id]: { ...(typeof prev[q.id] === 'object' ? prev[q.id] : {}), [f.id]: val === false ? null : false }
                                    }))
                                  }}>No</button>
                              </div>
                            </div>
                          )
                        })}
                        <button className="wr-fuel-skip" onClick={() => {
                          hapticLight()
                          setPathFuels(prev => ({ ...prev, [q.id]: 'skip' }))
                        }}>I didn't work on this path</button>
                      </>
                    ) : (
                      <button className="wr-fuel-unskip" onClick={() => {
                        hapticLight()
                        setPathFuels(prev => ({ ...prev, [q.id]: {} }))
                      }}>Skipped. Tap to undo.</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Dome growth this week — per quest */}
          {weeklyGrowth.length > 0 && (
            <div className="wr-question">
              <div className="wr-question-top">
                <span className="wr-question-icon">🫧</span>
                <span className="wr-question-label">Comfort zone growth this week</span>
              </div>
              {weeklyGrowth.map((quest, qi) => (
                <div key={qi} className="wr-growth-quest">
                  <div className="wr-growth-quest-name">{quest.questLabel}</div>
                  {quest.dims.map((d, di) => (
                    <div key={di} className="wr-growth-dim">
                      <span className="wr-growth-dim-label">{d.label}</span>
                      <span className="wr-growth-dim-change">level {d.from} → {d.to}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Q4: Weekly income by path (stage 8+ only) */}
          {heroStage >= 8 && activeQuests.length > 0 && (
            <div className="wr-question">
              <div className="wr-question-top">
                <span className="wr-question-icon">💰</span>
                <span className="wr-question-label">Income</span>
              </div>
              <p className="wr-question-text">Did you earn anything from your paths this week?</p>

              {incomeEntries.map((entry, i) => (
                <div key={i} className="wr-income-entry">
                  <select
                    className="wr-income-quest"
                    value={entry.questId}
                    onChange={e => {
                      setIncomeEntries(prev => prev.map((en, j) => j === i ? { ...en, questId: e.target.value } : en))
                    }}
                  >
                    {activeQuests.map(q => (
                      <option key={q.id} value={q.id}>{q.label}</option>
                    ))}
                  </select>
                  <div className="wr-income-row">
                    <select
                      className="wr-income-currency"
                      value={entry.currency}
                      onChange={e => {
                        setIncomeEntries(prev => prev.map((en, j) => j === i ? { ...en, currency: e.target.value } : en))
                      }}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                      ))}
                    </select>
                    <input
                      className="wr-income-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={entry.amount}
                      onChange={e => {
                        setIncomeEntries(prev => prev.map((en, j) => j === i ? { ...en, amount: e.target.value } : en))
                      }}
                    />
                    <button
                      className="wr-income-remove"
                      onClick={() => setIncomeEntries(prev => prev.filter((_, j) => j !== i))}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <button
                className="wr-income-add"
                onClick={() => {
                  hapticLight()
                  setIncomeEntries(prev => [...prev, {
                    questId: activeQuests[0]?.id,
                    amount: '',
                    currency: 'USD',
                  }])
                }}
              >
                + Add income from a path
              </button>
            </div>
          )}

        </div>

        <div className="wr-footer">
          <button
            className="wr-submit"
            disabled={!isValid || saving}
            onClick={handleSubmit}
          >
            {saving ? 'Saving...' : 'Complete Review (+15 RP)'}
          </button>
        </div>
      </div>
    </div>
  )
}
