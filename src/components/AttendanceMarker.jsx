/**
 * AttendanceMarker — Mark who showed up from the guestlist.
 * Toggle attended/no-show per contact. Shows attendance rate.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './AttendanceMarker.css'

export default function AttendanceMarker({ experienceId, userId, previousExperienceId }) {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [walkInName, setWalkInName] = useState('')
  const [adding, setAdding] = useState(false)
  const [prevAttended, setPrevAttended] = useState(null)

  useEffect(() => {
    if (!userId || !experienceId) return

    if (previousExperienceId) {
      supabase
        .from('experience_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('experience_id', previousExperienceId)
        .eq('attended', true)
        .then(({ count }) => setPrevAttended(count || 0))
    }

    supabase
      .from('experience_attendees')
      .select('id, contact_id, attended, crm_contacts(name, email, social_handle)')
      .eq('experience_id', experienceId)
      .then(({ data }) => {
        const list = (data || [])
          .filter(a => a.crm_contacts)
          .map(a => ({
            id: a.id,
            contactId: a.contact_id,
            name: a.crm_contacts.name,
            sub: a.crm_contacts.social_handle
              ? `@${a.crm_contacts.social_handle.replace('@', '')}`
              : a.crm_contacts.email || '',
            attended: a.attended || false,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setGuests(list)
        setLoading(false)
      })
  }, [userId, experienceId])

  const attendedCount = guests.filter(g => g.attended).length
  const totalCount = guests.length

  const vsLast = (() => {
    if (prevAttended == null || attendedCount === 0) return null
    const diff = attendedCount - prevAttended
    if (diff > 0) return { label: `+${diff} vs last`, type: 'up' }
    if (diff < 0) return { label: `${diff} vs last`, type: 'down' }
    return { label: 'Same as last', type: 'neutral' }
  })()

  const toggleAttended = async (guestId) => {
    hapticLight()
    const guest = guests.find(g => g.id === guestId)
    if (!guest) return

    const newVal = !guest.attended
    await supabase
      .from('experience_attendees')
      .update({ attended: newVal })
      .eq('id', guestId)

    setGuests(prev => prev.map(g =>
      g.id === guestId ? { ...g, attended: newVal } : g
    ))

    if (newVal) hapticSuccess()
  }

  const handleAddWalkIn = async () => {
    if (!walkInName.trim() || adding) return
    setAdding(true)

    // Create contact
    const { data: contact } = await supabase
      .from('crm_contacts')
      .insert({
        user_id: userId,
        name: walkInName.trim(),
        source: 'Walk-in',
        lifecycle_stage: 'Lead',
      })
      .select('id, name')
      .single()

    if (contact) {
      // Add as attended
      const { data: attendee } = await supabase
        .from('experience_attendees')
        .insert({
          experience_id: experienceId,
          contact_id: contact.id,
          user_id: userId,
          source: 'walk-in',
          attended: true,
        })
        .select('id')
        .single()

      if (attendee) {
        setGuests(prev => [...prev, {
          id: attendee.id,
          contactId: contact.id,
          name: contact.name,
          sub: 'Walk-in',
          attended: true,
        }].sort((a, b) => a.name.localeCompare(b.name)))
        hapticSuccess()
      }
    }

    setWalkInName('')
    setShowQuickAdd(false)
    setAdding(false)
  }

  if (totalCount === 0 && !loading) {
    return (
      <div className="am-container">
        <div className="am-header" style={{ cursor: 'default' }}>
          <div className="am-header-left">
            <span className="am-icon">✅</span>
            <div>
              <span className="am-title">Attendance</span>
              <span className="am-count">No guestlist yet. Add people in Pre-Event first.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="am-container">
      <button className="am-header" onClick={() => setExpanded(!expanded)}>
        <div className="am-header-left">
          <span className="am-icon">✅</span>
          <div>
            <span className="am-title">Who showed up?</span>
            <span className="am-count">
              {loading ? 'Loading...' : `${attendedCount}/${totalCount} attended`}
              {vsLast && <span className={`am-vs am-vs-${vsLast.type}`}>{vsLast.label}</span>}
            </span>
          </div>
        </div>
        <div className="am-header-right">
          {!loading && totalCount > 0 && (
            <span className="am-rate">
              {totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0}%
            </span>
          )}
          <span className={`am-chevron ${expanded ? 'open' : ''}`}>›</span>
        </div>
      </button>

      {expanded && !loading && (
        <div className="am-body">
          {guests.map(g => (
            <button
              key={g.id}
              className={`am-row ${g.attended ? 'attended' : ''}`}
              onClick={() => toggleAttended(g.id)}
            >
              <span className="am-check">{g.attended ? '✓' : ''}</span>
              <div className="am-row-info">
                <span className="am-row-name">{g.name}</span>
                {g.sub && <span className="am-row-sub">{g.sub}</span>}
              </div>
              <span className={`am-status ${g.attended ? 'yes' : 'no'}`}>
                {g.attended ? 'Attended' : 'No show'}
              </span>
            </button>
          ))}

          {!showQuickAdd ? (
            <button className="am-walkin-btn" onClick={() => setShowQuickAdd(true)}>
              + Add walk-in
            </button>
          ) : (
            <div className="am-walkin-form">
              <input
                className="am-walkin-input"
                type="text"
                placeholder="Walk-in name"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                autoFocus
              />
              <div className="am-walkin-actions">
                <button className="am-walkin-save" onClick={handleAddWalkIn} disabled={!walkInName.trim() || adding}>
                  {adding ? 'Adding...' : 'Add'}
                </button>
                <button className="am-walkin-cancel" onClick={() => { setShowQuickAdd(false); setWalkInName('') }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {attendedCount > 0 && attendedCount === totalCount && (
            <div className="am-full-house">
              Full house! Everyone showed up.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
