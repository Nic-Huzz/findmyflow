/**
 * ExperienceCreate — /business/experience/new
 *
 * Form: name + date. On submit, creates the experience and seeds the checklist
 * from the template, then redirects to the detail page.
 *
 * If a previous completed experience has a 3% note, surface it at the top so
 * the user sees last round's lesson before setting up the new one.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCreateExperience, daysUntil } from '../hooks/useExperienceData'
import { createTemplate } from '../lib/experienceTemplateService'
import { hapticSuccess, hapticLight } from '../lib/haptics'
import './ExperienceCreate.css'

export default function ExperienceCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const runAgainFromId = searchParams.get('from')
  const templateId = searchParams.get('templateId')
  const templateType = searchParams.get('type')
  const { createExperience, creating, error } = useCreateExperience()

  const [name, setName] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [ticketPrice, setTicketPrice] = useState('')
  const [previousExperience, setPreviousExperience] = useState(null)
  const [runAgainSource, setRunAgainSource] = useState(null)
  const [prevStats, setPrevStats] = useState(null)
  const [experienceType, setExperienceType] = useState(templateType || 'workshop')
  const [validationError, setValidationError] = useState('')
  const [templateSource, setTemplateSource] = useState(null)
  const [saveToLibrary, setSaveToLibrary] = useState(!templateId)
  const [pitchOfferType, setPitchOfferType] = useState(null)
  const [pitchOtherText, setPitchOtherText] = useState('')

  useEffect(() => {
    document.title = runAgainFromId ? 'Run Again' : templateId ? 'Run from Template' : 'New Experience'
  }, [runAgainFromId, templateId])

  // Template pre-fill
  useEffect(() => {
    if (!templateId) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('experience_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle()
      if (cancelled || !data) return
      setTemplateSource(data)
      setName(data.name || '')
      if (data.experience_type) setExperienceType(data.experience_type)
      if (data.default_ticket_price) setTicketPrice(String(data.default_ticket_price))
    })()
    return () => { cancelled = true }
  }, [templateId])

  // Fetch the most recent completed experience to surface its 3% note
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data } = await supabase
        .from('experiences')
        .select('id, name, three_percent_note')
        .eq('user_id', user.id)
        .in('status', ['completed', 'archived'])
        .not('three_percent_note', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cancelled && data) setPreviousExperience(data)
    })()
    return () => { cancelled = true }
  }, [])

  // Run Again: pre-fill from source experience
  useEffect(() => {
    if (!runAgainFromId) return
    let cancelled = false
    ;(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (cancelled || !authUser) return
      const { data: src } = await supabase
        .from('experiences')
        .select('id, name, ticket_price, experience_type, three_percent_note, one_line_promise, booking_url, venue, description, value_stack, early_bird_price, standard_price, currency, pricing_percentage')
        .eq('id', runAgainFromId)
        .eq('user_id', authUser.id)
        .maybeSingle()
      if (cancelled || !src) return
      setRunAgainSource(src)
      setName(src.name || '')
      if (src.ticket_price != null) setTicketPrice(String(src.ticket_price))
      if (src.experience_type) setExperienceType(src.experience_type)

      // Fetch previous stats
      const [{ count: attendeeCount }, { data: costsData }] = await Promise.all([
        supabase.from('contact_experiences').select('id', { count: 'exact', head: true }).eq('experience_id', runAgainFromId).eq('user_id', authUser.id).eq('role', 'attendee'),
        supabase.from('experience_costs').select('amount').eq('experience_id', runAgainFromId),
      ])
      if (!cancelled) {
        const totalCosts = (costsData || []).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)
        setPrevStats({ attendees: attendeeCount || 0, costs: totalCosts })
      }
    })()
    return () => { cancelled = true }
  }, [runAgainFromId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError('')

    if (!name.trim()) {
      setValidationError('Give your experience a name')
      return
    }
    if (name.trim().length < 3) {
      setValidationError('Name is too short')
      return
    }

    hapticLight()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let resolvedTemplateId = templateId || null

      // Also save to library if checkbox is checked and not already from a template
      if (saveToLibrary && !templateId && user) {
        try {
          const tmpl = await createTemplate(user.id, {
            name: name.trim(),
            experience_type: experienceType,
            duration_minutes: null,
            runsheet: [
              { phase: 'opening', duration: 5, notes: '' },
              { phase: 'main', duration: 30, notes: '' },
              { phase: 'closing', duration: 5, notes: '' },
            ],
          })
          resolvedTemplateId = tmpl.id
        } catch (err) {
          console.warn('Save to library failed:', err)
        }
      }

      const exp = await createExperience({
        name,
        experience_date: dateStr || null,
        previous_experience_id: runAgainFromId || null,
        ticket_price: ticketPrice ? parseFloat(ticketPrice) : null,
        experience_type: experienceType,
        template_id: resolvedTemplateId,
        runAgainFromId: runAgainFromId || null,
      })

      // Save pitch offer type if selected
      if (pitchOfferType) {
        await supabase
          .from('experiences')
          .update({ pitch_offer_type: pitchOfferType, pitch_next_offer: true })
          .eq('id', exp.id)
      }

      hapticSuccess()
      navigate(`/create/experience/${exp.id}`)
    } catch {
      // error state already set in the hook
    }
  }

  const countdown = dateStr ? daysUntil(dateStr) : null

  return (
    <div className="exp-create">

      <div className="exp-create-container">
        <button
          className="exp-back"
          onClick={() => navigate('/create')}
          type="button"
        >
          ← Back
        </button>

        <header className="exp-create-header">
          <div className="exp-badge">New Experience</div>
          <h1 className="exp-create-title">
            What are you <span className="exp-gradient-text">running</span>?
          </h1>
          <p className="exp-create-sub">
            Name it and set the date. We'll give you a checklist to fill the
            room and another to run it smoothly.
          </p>
        </header>

        {!runAgainFromId && (
          <button
            type="button"
            className="exp-inspiration-cta"
            onClick={() => navigate('/create/inspiration')}
          >
            <span className="exp-inspiration-icon">✨</span>
            <div>
              <div className="exp-inspiration-label">Not sure what to create?</div>
              <div className="exp-inspiration-sub">Find Inspiration from creators you admire</div>
            </div>
            <span className="exp-inspiration-arrow">→</span>
          </button>
        )}

        {runAgainSource && (
          <div className="exp-run-again-badge">
            <span className="exp-run-again-icon">🔄</span>
            <div>
              <div className="exp-run-again-label">Running again from</div>
              <div className="exp-run-again-name">{runAgainSource.name}</div>
            </div>
          </div>
        )}

        {prevStats && (
          <div className="exp-prev-stats">
            <div className="exp-prev-stat">
              <span className="exp-prev-val">{prevStats.attendees}</span>
              <span className="exp-prev-label">attendees last time</span>
            </div>
            {runAgainSource?.ticket_price != null && (
              <div className="exp-prev-stat">
                <span className="exp-prev-val">${Number(runAgainSource.ticket_price).toFixed(0)}</span>
                <span className="exp-prev-label">ticket price</span>
              </div>
            )}
            {prevStats.costs > 0 && (
              <div className="exp-prev-stat">
                <span className="exp-prev-val">${prevStats.costs.toFixed(0)}</span>
                <span className="exp-prev-label">total costs</span>
              </div>
            )}
          </div>
        )}

        {previousExperience && (
          <div className="exp-reflection-card">
            <div className="exp-reflection-header">
              <span className="exp-reflection-icon">🪞</span>
              <div>
                <div className="exp-reflection-eyebrow">Your 3% note from</div>
                <div className="exp-reflection-name">{previousExperience.name}</div>
              </div>
            </div>
            <p className="exp-reflection-body">{previousExperience.three_percent_note}</p>
          </div>
        )}

        <form className="exp-form" onSubmit={handleSubmit}>
          <label className="exp-field">
            <span className="exp-field-label">Experience name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bali Dance Event"
              maxLength={80}
              autoFocus
            />
          </label>

          <label className="exp-field">
            <span className="exp-field-label">Date</span>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
            {countdown !== null && countdown >= 0 && (
              <span className="exp-field-hint">
                {countdown === 0 ? 'Today' : countdown === 1 ? 'Tomorrow' : `${countdown} days from now`}
              </span>
            )}
            {countdown !== null && countdown < 0 && (
              <span className="exp-field-hint exp-field-hint-warn">
                This date is in the past
              </span>
            )}
          </label>

          <label className="exp-field">
            <span className="exp-field-label">Experience type</span>
            <select
              value={experienceType}
              onChange={(e) => setExperienceType(e.target.value)}
            >
              <option value="workshop">Workshop</option>
              <option value="retreat">Retreat</option>
              <option value="circle">Circle / Gathering</option>
              <option value="cohort">Cohort / Course</option>
              <option value="performance">Live Event / Performance</option>
              <option value="content">Content Launch</option>
              <option value="online">Online Session</option>
              <option value="one_on_one">1:1 Session</option>
              <option value="popup">Pop-up Event</option>
            </select>
          </label>

          <label className="exp-field">
            <span className="exp-field-label">Ticket price (optional)</span>
            <div className="exp-price-row">
              <span className="exp-price-currency">$</span>
              <input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
              <button
                type="button"
                className="exp-price-free"
                onClick={() => setTicketPrice('0')}
              >
                Free
              </button>
            </div>
          </label>

          <p className="exp-pricing-hint">Set your full pricing in the Details tab after creating.</p>

          <div className="exp-field">
            <span className="exp-field-label">Will you pitch another offer at this event?</span>
            <div className="exp-pitch-options">
              {['core', 'continuity'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`exp-pitch-btn ${pitchOfferType === type ? 'active' : ''}`}
                  onClick={() => {
                    hapticLight()
                    setPitchOfferType(pitchOfferType === type ? null : type)
                  }}
                >
                  {type === 'core' ? 'Core' : 'Continuity'}
                </button>
              ))}
              <button
                type="button"
                className={`exp-pitch-btn ${pitchOfferType && pitchOfferType !== 'core' && pitchOfferType !== 'continuity' ? 'active' : ''}`}
                onClick={() => {
                  hapticLight()
                  if (pitchOfferType && pitchOfferType !== 'core' && pitchOfferType !== 'continuity') {
                    setPitchOfferType(null)
                    setPitchOtherText('')
                  } else {
                    setPitchOfferType('other')
                  }
                }}
              >
                Other
              </button>
            </div>
            {pitchOfferType && pitchOfferType !== 'core' && pitchOfferType !== 'continuity' && (
              <input
                type="text"
                className="exp-pitch-other-input"
                value={pitchOtherText}
                onChange={(e) => {
                  setPitchOtherText(e.target.value)
                  setPitchOfferType(e.target.value.trim() || 'other')
                }}
                placeholder="What will you pitch?"
                maxLength={80}
                autoFocus
              />
            )}
          </div>

          {!templateId && (
            <label className="exp-checkbox-row">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={e => setSaveToLibrary(e.target.checked)}
              />
              <span className="exp-checkbox-label">Also save to library</span>
              <span className="exp-checkbox-hint">Create a reusable template you can run again</span>
            </label>
          )}

          {(validationError || error) && (
            <div className="exp-form-error">{validationError || error}</div>
          )}

          <button
            type="submit"
            className="exp-cta"
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create + Seed Checklist'}
          </button>
        </form>
      </div>
    </div>
  )
}
