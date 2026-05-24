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
import { supabase } from '../lib/supabaseClient'
import { useExperience, daysUntil, formatExperienceDate } from '../hooks/useExperienceData'
import { SECTION_META, PHASE_META, NOTABLE_KEYS } from '../lib/experienceChecklistTemplate'
import { CONVERTIBLE_SECTIONS, convertChecklistToChallenge, fetchDNASliders, fetchCreatorChallenges } from '../lib/checklistChallengeService'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { awardMovementXP } from '../lib/movementXP'
import ExperienceHealthCard from '../components/ExperienceHealthCard'
import GuestlistPicker from '../components/GuestlistPicker'
import DMTracker from '../components/DMTracker'
import AttendanceMarker from '../components/AttendanceMarker'
import RevenueLogger from '../components/RevenueLogger'
import ScaleIncomeCard from '../components/ScaleIncomeCard'
import DnaInsightCard from '../components/DnaInsightCard'
import UpsellDesigner from '../components/UpsellDesigner'
import DownsellDesigner from '../components/DownsellDesigner'
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
    updateChecklistNote,
    updateExperience,
  } = useExperience(id)

  const [activePhase, setActivePhase] = useState('details')
  const [guestlistVersion, setGuestlistVersion] = useState(0)
  const [showHidden, setShowHidden] = useState(false)
  const [dnaSliders, setDnaSliders] = useState(null)
  const [dnaLoaded, setDnaLoaded] = useState(false)
  const [convertingItemId, setConvertingItemId] = useState(null)
  const [convertedIds, setConvertedIds] = useState(new Set())
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(null)
  const [deadlineDate, setDeadlineDate] = useState('')

  // Details tab state
  const [detailsDraft, setDetailsDraft] = useState(null)
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState(null)
  const [valueStackItems, setValueStackItems] = useState([])
  const [newStackLabel, setNewStackLabel] = useState('')
  const [newStackValue, setNewStackValue] = useState('')
  const [newModality, setNewModality] = useState('')

  // Initialize details tab from experience data
  useEffect(() => {
    if (!experience) return
    setDetailsDraft({
      one_line_promise: experience.one_line_promise || '',
      booking_url: experience.booking_url || '',
      venue: experience.venue || '',
      description: experience.description || '',
      ticket_price: experience.ticket_price != null ? String(experience.ticket_price) : '',
      early_bird_price: experience.early_bird_price != null ? String(experience.early_bird_price) : '',
      standard_price: experience.standard_price != null ? String(experience.standard_price) : '',
      currency: experience.currency || 'IDR',
      pricing_percentage: experience.pricing_percentage != null ? String(experience.pricing_percentage) : '15',
      modalities: experience.modalities || [],
      word_of_mouth: experience.word_of_mouth || '',
    })
    setValueStackItems(experience.value_stack || [])
  }, [experience?.id])

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

  // Save details tab
  const saveDetails = async () => {
    if (!detailsDraft || savingDetails) return
    setSavingDetails(true)
    setDetailsError(null)
    try {
      const updates = {
        one_line_promise: detailsDraft.one_line_promise || null,
        booking_url: detailsDraft.booking_url || null,
        venue: detailsDraft.venue || null,
        description: detailsDraft.description || null,
        ticket_price: detailsDraft.ticket_price ? parseFloat(detailsDraft.ticket_price) : null,
        early_bird_price: detailsDraft.early_bird_price ? parseFloat(detailsDraft.early_bird_price) : null,
        standard_price: detailsDraft.standard_price ? parseFloat(detailsDraft.standard_price) : null,
        currency: detailsDraft.currency || 'IDR',
        pricing_percentage: detailsDraft.pricing_percentage ? parseFloat(detailsDraft.pricing_percentage) : null,
        value_stack: valueStackItems.length > 0 ? valueStackItems.map(({ label, value }) => ({ label, value })) : null,
        modalities: detailsDraft.modalities?.length > 0 ? detailsDraft.modalities : null,
        word_of_mouth: detailsDraft.word_of_mouth || null,
      }
      const prevExp = { ...experience }
      console.log('[saveDetails] saving:', JSON.stringify(updates).slice(0, 200))
      await updateExperience(updates)
      console.log('[saveDetails] saved successfully')
      hapticSuccess()

      // Award XP for newly filled fields (compare against experience before save)
      if (user?.id) {
        const fields = ['one_line_promise', 'booking_url', 'venue', 'description']
        for (const f of fields) {
          if (updates[f] && !prevExp[f]) {
            awardMovementXP(user.id, 'details_field', f)
          }
        }
        if (valueStackItems.length > 0 && !prevExp.value_stack?.length) {
          awardMovementXP(user.id, 'value_stack', 'pricing set')
        }
      }
      setSavingDetails(false)
      navigate('/create')
      return
    } catch (err) {
      console.error('Save details error:', err, JSON.stringify(err))
      setDetailsError(`Failed to save: ${err?.message || err?.code || 'unknown error'}`)
    }
    setSavingDetails(false)
  }

  const addStackItem = () => {
    if (!newStackLabel.trim()) return
    setValueStackItems(prev => [...prev, {
      id: Date.now(),
      label: newStackLabel.trim(),
      value: parseFloat(newStackValue) || 0,
    }])
    setNewStackLabel('')
    setNewStackValue('')
    hapticLight()
  }

  const removeStackItem = (idx) => {
    setValueStackItems(prev => prev.filter((_, i) => i !== idx))
  }

  const totalStackValue = valueStackItems.reduce((sum, item) => sum + (item.value || 0), 0)

  // Bucket items by phase → section
  // Load pitch-next-offer state + next offer label for dynamic checklist item
  const [pitchOfferLabel, setPitchOfferLabel] = useState(null)
  const [pitchEnabled, setPitchEnabled] = useState(false)
  const [pitchDone, setPitchDone] = useState(false)

  useEffect(() => {
    if (!user?.id || !experience) return

    // Check current pitch_next_offer from DB (in case ScaleIncomeCard updated it)
    supabase
      .from('experiences')
      .select('pitch_next_offer')
      .eq('id', experience.id)
      .single()
      .then(({ data }) => {
        const enabled = data?.pitch_next_offer || false
        setPitchEnabled(enabled)
        if (!enabled) { setPitchOfferLabel(null); return }

        supabase
          .from('creator_assessments')
          .select('attraction_detail, core_detail, continuity_detail')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data: assessData }) => {
            if (!assessData) return
            const price = experience?.ticket_price || 0
            const currentLayer = price === 0 ? 'attraction' : 'core'
            const order = ['attraction', 'core', 'continuity']
            const nextIdx = order.indexOf(currentLayer) + 1
            if (nextIdx < order.length) {
              const nextKey = `${order[nextIdx]}_detail`
              if (assessData[nextKey]) setPitchOfferLabel(assessData[nextKey])
            }
          })
      })
  }, [user?.id, experience?.id, experience?.ticket_price])

  const grouped = useMemo(() => {
    const buckets = { pre: { marketing: [], organisation: [] }, post: { followup: [], reflection: [] } }
    for (const item of items) {
      if (!buckets[item.phase]) continue
      if (!buckets[item.phase][item.section]) buckets[item.phase][item.section] = []
      buckets[item.phase][item.section].push(item)
    }

    // Inject dynamic pitch item if toggle is on
    if (pitchEnabled && pitchOfferLabel) {
      buckets.post.followup.push({
        id: 'dynamic_pitch_next',
        phase: 'post',
        section: 'followup',
        sort_order: 3.5,
        label: `Pitch your next offer: "${pitchOfferLabel}"`,
        completed: pitchDone,
        is_custom: false,
        is_hidden: false,
      })
      buckets.post.followup.sort((a, b) => a.sort_order - b.sort_order)
    }

    return buckets
  }, [items, pitchEnabled, pitchOfferLabel, pitchDone])

  const handleToggle = async (itemId) => {
    if (itemId === 'dynamic_pitch_next') {
      hapticLight()
      setPitchDone(prev => !prev)
      return
    }
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
            {experience.ticket_price != null && (() => {
              const price = Number(experience.ticket_price)
              if (isNaN(price)) return null
              return <span className="exp-detail-price">${price.toFixed(price % 1 === 0 ? 0 : 2)}</span>
            })()}
          </div>
        </header>

        {/* DNA Insight — contextual guidance based on Play Profile + lifecycle phase */}
        <DnaInsightCard
          userId={user?.id}
          experience={experience}
          checklistProgress={items.length > 0 ? Math.round(items.filter(i => i.completed).length / items.filter(i => !i.hidden).length * 100) : 0}
        />

        {/* Health Card (completed/archived experiences only) */}
        {experience && (experience.status === 'completed' || experience.status === 'archived') && (
          <ExperienceHealthCard
            experienceId={id}
            userId={user?.id}
            previousExperienceId={experience.previous_experience_id}
            ticketPrice={experience.ticket_price}
          />
        )}

        {/* Phase tabs */}
        <div className="exp-phase-tabs exp-phase-tabs-3">
          {[
            { id: 'details', title: 'Details', sub: 'Your experience' },
            { id: 'pre', title: 'Pre-Event', sub: 'Set up to win' },
            { id: 'post', title: 'Post-Event', sub: 'Close the loop' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`exp-phase-tab ${activePhase === tab.id ? 'active' : ''}`}
              onClick={() => setActivePhase(tab.id)}
            >
              <div className="exp-phase-tab-title">{tab.title}</div>
              <div className="exp-phase-tab-sub">{tab.sub}</div>
            </button>
          ))}
        </div>

        {/* ═══ DETAILS TAB ═══ */}
        {activePhase === 'details' && !detailsDraft && !loading && (
          <p style={{ textAlign: 'center', color: '#adb5bd', fontSize: '0.82rem', padding: '2rem 0' }}>Loading details...</p>
        )}
        {activePhase === 'details' && detailsDraft && (
          <div className="exp-details-tab">
            {/* One-line promise */}
            <div className="exp-det-section">
              <label className="exp-det-label">One-line promise</label>
              <input
                type="text"
                className="exp-det-input"
                value={detailsDraft.one_line_promise}
                onChange={e => setDetailsDraft(d => ({ ...d, one_line_promise: e.target.value }))}
                placeholder="What transformation do attendees get?"
                maxLength={200}
              />
            </div>

            {/* Booking link */}
            <div className="exp-det-section">
              <label className="exp-det-label">Booking / sales page</label>
              <input
                type="url"
                className="exp-det-input"
                value={detailsDraft.booking_url}
                onChange={e => setDetailsDraft(d => ({ ...d, booking_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Venue */}
            <div className="exp-det-section">
              <label className="exp-det-label">Venue / location</label>
              <input
                type="text"
                className="exp-det-input"
                value={detailsDraft.venue}
                onChange={e => setDetailsDraft(d => ({ ...d, venue: e.target.value }))}
                placeholder="e.g. The Istana, Bali"
              />
            </div>

            {/* Description */}
            <div className="exp-det-section">
              <label className="exp-det-label">Description</label>
              <textarea
                className="exp-det-textarea"
                value={detailsDraft.description}
                onChange={e => setDetailsDraft(d => ({ ...d, description: e.target.value }))}
                placeholder="What is this experience about?"
                rows={3}
              />
            </div>

            {/* Word of mouth */}
            <div className="exp-det-section">
              <label className="exp-det-label">What will people say?</label>
              <p className="exp-det-hint">"You have to come because..."</p>
              <textarea
                className="exp-det-textarea"
                value={detailsDraft.word_of_mouth}
                onChange={e => setDetailsDraft(d => ({ ...d, word_of_mouth: e.target.value }))}
                placeholder={"e.g. It's like therapy but you're dancing and it actually works"}
                rows={2}
              />
              <div className="exp-wom-patterns">
                {[
                  { label: 'The contrast', eg: "It's therapy but you're dancing the whole time" },
                  { label: 'The specific', eg: "You don't talk. You just breathe and move and everything shifts." },
                  { label: 'The scale', eg: "100 people. One sunrise. Headphones on." },
                  { label: 'The absurd', eg: "You'll dance, cry, and laugh in 90 minutes. In that order." },
                  { label: 'The exclusive', eg: "12 spots. No waitlist. If it's full, it's full." },
                  { label: 'The mystery', eg: "I can't tell you what happens. Just come." },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    className="exp-wom-pattern"
                    onClick={() => setDetailsDraft(d => ({ ...d, word_of_mouth: p.eg }))}
                  >
                    <span className="exp-wom-pattern-label">{p.label}</span>
                    <span className="exp-wom-pattern-eg">"{p.eg}"</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modalities */}
            <div className="exp-det-section">
              <label className="exp-det-label">What you facilitate</label>
              {detailsDraft.modalities?.length > 0 && (
                <div className="exp-mod-tags">
                  {detailsDraft.modalities.map((mod, i) => (
                    <span key={i} className="exp-mod-tag">
                      {mod}
                      <button className="exp-mod-remove" onClick={() => setDetailsDraft(d => ({ ...d, modalities: d.modalities.filter((_, j) => j !== i) }))}>x</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="exp-mod-input-row">
                <input
                  type="text"
                  className="exp-det-input"
                  value={newModality}
                  onChange={e => setNewModality(e.target.value)}
                  placeholder="e.g. breathwork, somatic dance, coaching..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newModality.trim()) {
                      e.preventDefault()
                      setDetailsDraft(d => ({ ...d, modalities: [...(d.modalities || []), newModality.trim()] }))
                      setNewModality('')
                    }
                  }}
                />
                <button
                  className="exp-mod-add"
                  disabled={!newModality.trim()}
                  onClick={() => {
                    if (newModality.trim()) {
                      setDetailsDraft(d => ({ ...d, modalities: [...(d.modalities || []), newModality.trim()] }))
                      setNewModality('')
                    }
                  }}
                >+</button>
              </div>
            </div>

            {/* ── VALUE STACK PRICING ── */}
            <div className="exp-det-pricing-header">
              <h3 className="exp-det-pricing-title">Value Stack Pricing</h3>
              <p className="exp-det-pricing-sub">List everything included. What would each be worth if someone bought it separately?</p>
            </div>

            {/* Stack items */}
            {valueStackItems.length > 0 && (
              <div className="exp-vs-list">
                {valueStackItems.map((item, i) => (
                  <div key={item.id || i} className="exp-vs-item">
                    <span className="exp-vs-item-label">{item.label}</span>
                    <span className="exp-vs-item-value">
                      {detailsDraft.currency === 'IDR'
                        ? `${(item.value || 0).toLocaleString()} IDR`
                        : `$${(item.value || 0).toLocaleString()}`
                      }
                    </span>
                    <button className="exp-vs-item-remove" onClick={() => removeStackItem(i)}>x</button>
                  </div>
                ))}
                <div className="exp-vs-total">
                  <span>Total value</span>
                  <span className="exp-vs-total-val">
                    {detailsDraft.currency === 'IDR'
                      ? `${totalStackValue.toLocaleString()} IDR`
                      : `$${totalStackValue.toLocaleString()}`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Add stack item */}
            <div className="exp-vs-add">
              <input
                type="text"
                className="exp-vs-add-label"
                value={newStackLabel}
                onChange={e => setNewStackLabel(e.target.value)}
                placeholder="e.g. Breathwork session"
                onKeyDown={e => e.key === 'Enter' && addStackItem()}
              />
              <input
                type="number"
                className="exp-vs-add-value"
                value={newStackValue}
                onChange={e => setNewStackValue(e.target.value)}
                placeholder="Value"
                min="0"
                onKeyDown={e => e.key === 'Enter' && addStackItem()}
              />
              <button className="exp-vs-add-btn" onClick={addStackItem} disabled={!newStackLabel.trim()}>+</button>
            </div>

            {/* Currency toggle */}
            <div className="exp-det-section exp-det-row">
              <label className="exp-det-label">Currency</label>
              <select
                className="exp-det-select"
                value={detailsDraft.currency}
                onChange={e => setDetailsDraft(d => ({ ...d, currency: e.target.value }))}
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="AUD">AUD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {/* Pricing percentage + calculated prices */}
            {totalStackValue > 0 && (
              <div className="exp-vs-pricing">
                <div className="exp-vs-slider-row">
                  <label className="exp-det-label">
                    Price at <span className="exp-vs-pct">{detailsDraft.pricing_percentage || 15}%</span> of value
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="30"
                    step="1"
                    value={detailsDraft.pricing_percentage || 15}
                    onChange={e => {
                      const pct = Number(e.target.value)
                      const ebPct = Math.max(5, pct - 3)
                      const eb = Math.round(totalStackValue * ebPct / 100)
                      const std = Math.round(totalStackValue * pct / 100)
                      setDetailsDraft(d => ({
                        ...d,
                        pricing_percentage: String(pct),
                        early_bird_price: String(eb),
                        standard_price: String(std),
                        ticket_price: String(std),
                      }))
                    }}
                    className="exp-vs-slider"
                  />
                </div>

                <div className="exp-vs-tiers">
                  <div className="exp-vs-tier">
                    <div className="exp-vs-tier-label">Early Bird ({Math.max(5, Number(detailsDraft.pricing_percentage || 15) - 3)}%)</div>
                    <div className="exp-vs-tier-price">
                      {detailsDraft.currency === 'IDR'
                        ? `${Number(detailsDraft.early_bird_price || 0).toLocaleString()} IDR`
                        : `$${Number(detailsDraft.early_bird_price || 0).toLocaleString()}`
                      }
                    </div>
                  </div>
                  <div className="exp-vs-tier exp-vs-tier-highlight">
                    <div className="exp-vs-tier-label">Standard ({detailsDraft.pricing_percentage || 15}%)</div>
                    <div className="exp-vs-tier-price">
                      {detailsDraft.currency === 'IDR'
                        ? `${Number(detailsDraft.standard_price || 0).toLocaleString()} IDR`
                        : `$${Number(detailsDraft.standard_price || 0).toLocaleString()}`
                      }
                    </div>
                  </div>
                </div>

                {/* Tier guide */}
                <div className="exp-vs-guide">
                  <div className={Number(detailsDraft.pricing_percentage) <= 10 ? 'exp-vs-guide-active' : ''}>8-10% Room Filler</div>
                  <div className={Number(detailsDraft.pricing_percentage) > 10 && Number(detailsDraft.pricing_percentage) <= 15 ? 'exp-vs-guide-active' : ''}>12-15% Sweet Spot</div>
                  <div className={Number(detailsDraft.pricing_percentage) > 15 && Number(detailsDraft.pricing_percentage) <= 20 ? 'exp-vs-guide-active' : ''}>18-20% Premium</div>
                  <div className={Number(detailsDraft.pricing_percentage) > 20 ? 'exp-vs-guide-active' : ''}>22-25% Top Tier</div>
                </div>
              </div>
            )}

            {/* Manual price override */}
            {!totalStackValue && (
              <div className="exp-det-section">
                <label className="exp-det-label">Ticket price (manual)</label>
                <div className="exp-det-row">
                  <input
                    type="number"
                    className="exp-det-input"
                    value={detailsDraft.ticket_price}
                    onChange={e => setDetailsDraft(d => ({ ...d, ticket_price: e.target.value }))}
                    placeholder="0"
                    min="0"
                  />
                  <select
                    className="exp-det-select"
                    value={detailsDraft.currency}
                    onChange={e => setDetailsDraft(d => ({ ...d, currency: e.target.value }))}
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="AUD">AUD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            )}

            {/* Scale Income + Offer Strategy */}
            <ScaleIncomeCard experienceId={id} userId={user?.id} ticketPrice={experience?.ticket_price} />
            {experience?.ticket_price > 0 && (
              <>
                <UpsellDesigner experienceId={id} experienceType={experience?.experience_type} ticketPrice={experience?.ticket_price} />
                <DownsellDesigner experienceId={id} experienceType={experience?.experience_type} ticketPrice={experience?.ticket_price} />
              </>
            )}

            {/* Save button */}
            {detailsError && <p style={{ color: '#ef4444', fontSize: '0.82rem', textAlign: 'center' }}>{detailsError}</p>}
            <button
              className="exp-det-save"
              onClick={saveDetails}
              disabled={savingDetails}
            >
              {savingDetails ? 'Saving...' : 'Save Details'}
            </button>
            <button
              className="exp-det-delete"
              onClick={async () => {
                if (!window.confirm('Are you sure you want to delete this experience? This cannot be undone.')) return
                try {
                  // Delete the experience (related data cascades via ON DELETE CASCADE)
                  const { error: delError } = await supabase.from('experiences').delete().eq('id', id)
                  if (delError) throw delError
                  navigate('/create')
                } catch (err) {
                  console.error('Delete experience error:', err)
                  alert('Failed to delete. Please try again.')
                }
              }}
            >
              Delete Experience
            </button>
          </div>
        )}

        {/* ═══ PRE-EVENT TAB ═══ */}
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
              onUpdateNote={updateChecklistNote}
            />
            {/* Guestlist + DM Tracker (inline contact tools) */}
            <GuestlistPicker experienceId={id} userId={user?.id} onGuestlistChange={() => setGuestlistVersion(v => v + 1)} />
            <DMTracker experienceId={id} userId={user?.id} refreshKey={guestlistVersion} />

            <ChecklistSection
              section="organisation"
              items={grouped.pre.organisation || []}
              showHidden={showHidden}
              onToggle={handleToggle}
              onHide={hideItem}
              onUnhide={unhideItem}
              onAdd={(label) => addCustomItem({ phase: 'pre', section: 'organisation', label })}
              onDelete={deleteCustomItem}
              onUpdateNote={updateChecklistNote}
            />
          </>
        )}

        {activePhase === 'post' && (
          <>
            {/* Attendance + Revenue */}
            <AttendanceMarker experienceId={id} userId={user?.id} previousExperienceId={experience?.previous_experience_id} />
            <RevenueLogger experienceId={id} userId={user?.id} currency={experience?.currency || 'IDR'} previousExperienceId={experience?.previous_experience_id} />

            {/* Attendee Upload (screenshot AI extraction - legacy) */}
            <AttendeeUpload experienceId={id} userId={user?.id} />

            {/* Follow-up checklist */}
            <ChecklistSection
              section="followup"
              items={grouped.post.followup || []}
              showHidden={showHidden}
              onToggle={handleToggle}
              onHide={hideItem}
              onUnhide={unhideItem}
              onAdd={(label) => addCustomItem({ phase: 'post', section: 'followup', label })}
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
              onUpdateNote={updateChecklistNote}
            />

            {/* Costs */}
            <CostLogger experienceId={id} userId={user?.id} />

            {/* Reflection */}
            <ChecklistSection
              section="reflection"
              items={grouped.post.reflection || []}
              showHidden={showHidden}
              onToggle={handleToggle}
              onHide={hideItem}
              onUnhide={unhideItem}
              onAdd={(label) => addCustomItem({ phase: 'post', section: 'reflection', label })}
              onDelete={deleteCustomItem}
              onUpdateNote={updateChecklistNote}
            />
          </>
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
  onUpdateNote,
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
              showNotes={NOTABLE_KEYS.includes(item.template_item_key)}
              onUpdateNote={onUpdateNote}
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
  showNotes, onUpdateNote,
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteVal, setNoteVal] = useState(item.notes || '')

  // Re-sync noteVal when item.notes changes (e.g. after carry-forward or refetch)
  useEffect(() => { setNoteVal(item.notes || '') }, [item.notes])

  return (
    <div className={`exp-item ${item.completed ? 'exp-item-done' : ''} ${item.is_hidden ? 'exp-item-hidden' : ''}`}>
      <button
        className="exp-item-check"
        onClick={() => onToggle(item.id)}
        aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {item.completed && <span className="exp-item-check-tick">✓</span>}
      </button>

      <div className="exp-item-content">
        <span className="exp-item-label" onClick={showNotes ? () => setNoteOpen(!noteOpen) : undefined} style={showNotes ? { cursor: 'pointer' } : undefined}>{item.label}</span>
        {showNotes && item.notes && !noteOpen && (
          <div className="exp-item-note-preview" onClick={() => setNoteOpen(true)}>{item.notes}</div>
        )}
        {showNotes && noteOpen && (
          <textarea
            className="exp-item-note-input"
            value={noteVal}
            onChange={(e) => setNoteVal(e.target.value)}
            onBlur={() => { if (noteVal !== (item.notes || '')) onUpdateNote(item.id, noteVal); setNoteOpen(false) }}
            placeholder="Your answer..."
            rows={2}
            autoFocus
          />
        )}
      </div>

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

/**
 * AttendeeUpload — Screenshot → AI extraction → CRM insertion
 */
function AttendeeUpload({ experienceId, userId }) {
  const [uploading, setUploading] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [attendeeCount, setAttendeeCount] = useState(0)

  // Load existing attendee count
  useEffect(() => {
    if (!experienceId) return
    supabase
      .from('experience_attendees')
      .select('id', { count: 'exact', head: true })
      .eq('experience_id', experienceId)
      .then(({ count }) => setAttendeeCount(count || 0))
  }, [experienceId, saved])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setExtracted(null)

    try {
      const reader = new FileReader()
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const { data, error: fnErr } = await supabase.functions.invoke('extract-attendees', {
        body: { imageBase64: base64, mimeType: file.type },
      })

      if (fnErr) throw fnErr
      if (!data?.success) throw new Error(data?.error || 'Extraction failed')

      setExtracted(data)
    } catch (err) {
      console.error('Attendee extraction error:', err)
      setError('Could not extract attendees. Try a clearer screenshot.')
    }
    setUploading(false)
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setExtracted(null)

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) throw new Error('CSV has no data rows')

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
      const nameCol = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'full_name')
      const emailCol = headers.findIndex(h => h === 'email' || h === 'email address')
      const phoneCol = headers.findIndex(h => h === 'phone' || h === 'phone number')

      if (nameCol === -1 && emailCol === -1) throw new Error('CSV needs a Name or Email column')

      const attendees = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(c => c.trim().replace(/^"|"$/g, '')) || lines[i].split(',').map(c => c.trim())
        const name = nameCol >= 0 ? (cols[nameCol] || '').trim() : ''
        const email = emailCol >= 0 ? (cols[emailCol] || '').trim() : ''
        if (name || email) attendees.push({ name: name || email.split('@')[0], email: email || null, phone: phoneCol >= 0 ? (cols[phoneCol] || '').trim() || null : null })
      }

      setExtracted({ success: true, attendees, total_found: attendees.length, source_type: 'CSV', notes: file.name })
    } catch (err) {
      console.error('CSV parse error:', err)
      setError(err.message || 'Could not parse CSV. Check the format.')
    }
    setUploading(false)
  }

  const handleRemoveAttendee = (index) => {
    setExtracted(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index),
      total_found: prev.total_found - 1,
    }))
  }

  const handleSaveAll = async () => {
    if (!extracted?.attendees?.length || !userId || !experienceId) return
    setSaving(true)
    setError(null)

    try {
      let added = 0
      let returning = 0

      for (const att of extracted.attendees) {
        // Find or create contact
        const { data: existing } = await supabase
          .from('crm_contacts')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', att.name)
          .limit(1)
          .maybeSingle()

        let contactId = existing?.id

        if (!contactId) {
          const { data: created, error: createErr } = await supabase
            .from('crm_contacts')
            .insert({
              user_id: userId,
              name: att.name,
              email: att.email || null,
              phone: att.phone || null,
              lifecycle_stage: 'customer',
              source: 'experience',
            })
            .select('id')
            .single()
          if (createErr) {
            console.error('Failed to create contact:', att.name, createErr)
            continue
          }
          contactId = created?.id
        } else {
          returning++
        }

        if (contactId) {
          await supabase
            .from('experience_attendees')
            .upsert({
              experience_id: experienceId,
              contact_id: contactId,
              user_id: userId,
              source: extracted?.source_type === 'CSV' ? 'csv' : 'screenshot',
            }, { onConflict: 'experience_id,contact_id' })
          added++
        }
      }

      setSaved(true)
      setExtracted(null)
      hapticSuccess()
      // Award 5 XP for uploading attendees
      if (userId) awardMovementXP(userId, 'attendee_upload', `${added} attendees`)
    } catch (err) {
      console.error('Save attendees error:', err)
      setError('Failed to save some attendees. Try again.')
    }
    setSaving(false)
  }

  return (
    <div className="exp-section-card">
      <div className="exp-section-accent" />
      <div className="exp-section-head">
        <div className="exp-section-icon">👥</div>
        <div className="exp-section-titleblock">
          <h2 className="exp-section-title">Attendees</h2>
          <div className="exp-section-subtitle">
            {attendeeCount > 0 ? `${attendeeCount} recorded` : 'Upload a screenshot or CSV to add'}
          </div>
        </div>
      </div>

      {error && <p className="exp-upload-error">{error}</p>}

      {/* Upload buttons */}
      {!extracted && !saved && (
        <div className="exp-upload-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <label className="exp-upload-btn">
            <input type="file" accept="image/*" capture="environment" onChange={handleUpload} style={{ display: 'none' }} />
            {uploading ? 'Processing...' : '📸 Upload Screenshot'}
          </label>
          <label className="exp-upload-btn" style={{ background: '#10b981' }}>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCSVUpload} style={{ display: 'none' }} />
            {uploading ? 'Processing...' : '📄 Upload CSV'}
          </label>
        </div>
      )}

      {/* Extraction preview */}
      {extracted && extracted.attendees?.length > 0 && (
        <div className="exp-attendee-preview">
          <div className="exp-attendee-count">
            Found {extracted.total_found} attendee{extracted.total_found !== 1 ? 's' : ''}
            {extracted.notes && <span className="exp-attendee-notes"> from {extracted.source_type}</span>}
          </div>
          <ul className="exp-attendee-list">
            {extracted.attendees.map((att, i) => (
              <li key={i} className="exp-attendee-row">
                <span className="exp-attendee-name">{att.name}</span>
                {att.email && <span className="exp-attendee-email">{att.email}</span>}
                <button className="exp-attendee-remove" onClick={() => handleRemoveAttendee(i)}>✕</button>
              </li>
            ))}
          </ul>
          <button className="exp-upload-save" onClick={handleSaveAll} disabled={saving}>
            {saving ? 'Adding...' : `Add All ${extracted.attendees.length} Attendees`}
          </button>
        </div>
      )}

      {extracted && extracted.attendees?.length === 0 && (
        <p className="exp-upload-empty">No attendees found in this screenshot. Try a clearer image.</p>
      )}

      {saved && (
        <div className="exp-upload-done">
          <span>&#10003; Attendees added</span>
          <button className="exp-upload-more" onClick={() => setSaved(false)}>Upload more</button>
        </div>
      )}
    </div>
  )
}

/**
 * CostLogger — Line items for experience costs
 */
function CostLogger({ experienceId, userId }) {
  const [costs, setCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newCategory, setNewCategory] = useState('venue')
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const CATEGORIES = [
    { id: 'venue', label: 'Venue', icon: '🏠' },
    { id: 'marketing', label: 'Marketing', icon: '📣' },
    { id: 'materials', label: 'Materials', icon: '📦' },
    { id: 'staff', label: 'Staff', icon: '🤝' },
    { id: 'other', label: 'Other', icon: '📋' },
  ]

  useEffect(() => {
    if (!experienceId) return
    supabase
      .from('experience_costs')
      .select('*')
      .eq('experience_id', experienceId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setCosts(data || [])
        setLoading(false)
      })
  }, [experienceId])

  const handleAdd = async () => {
    if (!newLabel.trim() || !newAmount || !userId) return
    setAdding(true)
    const { data, error } = await supabase
      .from('experience_costs')
      .insert({
        experience_id: experienceId,
        user_id: userId,
        category: newCategory,
        label: newLabel.trim(),
        amount: parseFloat(newAmount) || 0,
      })
      .select()
      .single()

    if (data) {
      setCosts(prev => [...prev, data])
      hapticSuccess()
      setNewLabel('')
      setNewAmount('')
    }
    setAdding(false)
  }

  const handleDelete = async (costId) => {
    await supabase.from('experience_costs').delete().eq('id', costId)
    setCosts(prev => prev.filter(c => c.id !== costId))
  }

  const total = costs.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)

  if (loading) return null

  return (
    <div className="exp-section-card">
      <div className="exp-section-accent" />
      <div className="exp-section-head">
        <div className="exp-section-icon">💰</div>
        <div className="exp-section-titleblock">
          <h2 className="exp-section-title">Costs</h2>
          <div className="exp-section-subtitle">
            {total > 0 ? `$${total.toFixed(0)} total` : 'Track your expenses'}
          </div>
        </div>
      </div>

      {costs.length > 0 && (
        <ul className="exp-cost-list">
          {costs.map(cost => {
            const cat = CATEGORIES.find(c => c.id === cost.category)
            return (
              <li key={cost.id} className="exp-cost-row">
                <span className="exp-cost-icon">{cat?.icon || '📋'}</span>
                <span className="exp-cost-label">{cost.label}</span>
                <span className="exp-cost-amount">${parseFloat(cost.amount).toFixed(0)}</span>
                <button className="exp-cost-delete" onClick={() => handleDelete(cost.id)}>✕</button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="exp-cost-add">
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="exp-cost-cat-select"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Description"
          className="exp-cost-label-input"
        />
        <input
          type="number"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="$"
          className="exp-cost-amount-input"
        />
        <button
          className="exp-cost-add-btn"
          onClick={handleAdd}
          disabled={adding || !newLabel.trim() || !newAmount}
        >
          {adding ? '...' : '+'}
        </button>
      </div>
    </div>
  )
}
