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
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCreateExperience, daysUntil } from '../hooks/useExperienceData'
import { hapticSuccess, hapticLight } from '../lib/haptics'
import './ExperienceCreate.css'

export default function ExperienceCreate() {
  const navigate = useNavigate()
  const { createExperience, creating, error } = useCreateExperience()

  const [name, setName] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [previousExperience, setPreviousExperience] = useState(null)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    document.title = 'New Experience'
  }, [])

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
      const exp = await createExperience({
        name,
        experience_date: dateStr || null,
        previous_experience_id: previousExperience?.id || null,
      })
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
