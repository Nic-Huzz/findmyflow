/**
 * DMTracker — Inline outreach tracker for the Pre-Event tab.
 * Shows guestlist contacts with DM/outreach tick-off.
 * Tracks progress: "7/10 reached out to".
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './DMTracker.css'

export default function DMTracker({ experienceId, userId, refreshKey }) {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  // Load guestlist contacts with their outreach status
  useEffect(() => {
    if (!userId || !experienceId) return

    supabase
      .from('experience_attendees')
      .select('contact_id, crm_contacts(id, name, email, social_handle, platform, outreach_status)')
      .eq('experience_id', experienceId)
      .then(({ data }) => {
        const list = (data || [])
          .filter(a => a.crm_contacts)
          .map(a => ({
            contactId: a.contact_id,
            name: a.crm_contacts.name,
            handle: a.crm_contacts.social_handle
              ? `@${a.crm_contacts.social_handle.replace('@', '')}`
              : a.crm_contacts.email || '',
            platform: a.crm_contacts.platform || '',
            reached: a.crm_contacts.outreach_status === 'reached_out'
              || a.crm_contacts.outreach_status === 'in_conversation'
              || a.crm_contacts.outreach_status === 'meeting_booked',
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setGuests(list)
        setLoading(false)
      })
  }, [userId, experienceId, refreshKey])

  const reachedCount = guests.filter(g => g.reached).length
  const totalCount = guests.length

  const toggleReached = async (contactId) => {
    hapticLight()
    const guest = guests.find(g => g.contactId === contactId)
    if (!guest) return

    const newStatus = guest.reached ? 'to_contact' : 'reached_out'

    await supabase
      .from('crm_contacts')
      .update({
        outreach_status: newStatus,
        outreach_status_entered_at: new Date().toISOString(),
      })
      .eq('id', contactId)

    setGuests(prev => prev.map(g =>
      g.contactId === contactId ? { ...g, reached: !g.reached } : g
    ))

    if (!guest.reached) hapticSuccess()
  }

  if (totalCount === 0 && !loading) return null

  return (
    <div className="dmt-container">
      <button className="dmt-header" onClick={() => setExpanded(!expanded)}>
        <div className="dmt-header-left">
          <span className="dmt-icon">💬</span>
          <div>
            <span className="dmt-title">DM Your Guestlist</span>
            <span className="dmt-count">
              {loading ? 'Loading...' : `${reachedCount}/${totalCount} reached out to`}
            </span>
          </div>
        </div>
        <div className="dmt-header-right">
          {!loading && totalCount > 0 && (
            <div className="dmt-progress-ring">
              <svg viewBox="0 0 36 36" className="dmt-ring-svg">
                <path
                  className="dmt-ring-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="dmt-ring-fill"
                  strokeDasharray={`${totalCount > 0 ? (reachedCount / totalCount) * 100 : 0}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          )}
          <span className={`dmt-chevron ${expanded ? 'open' : ''}`}>›</span>
        </div>
      </button>

      {expanded && !loading && (
        <div className="dmt-body">
          {guests.map(g => (
            <button
              key={g.contactId}
              className={`dmt-row ${g.reached ? 'reached' : ''}`}
              onClick={() => toggleReached(g.contactId)}
            >
              <span className="dmt-check">{g.reached ? '✓' : ''}</span>
              <div className="dmt-row-info">
                <span className="dmt-row-name">{g.name}</span>
                {g.handle && <span className="dmt-row-handle">{g.handle}</span>}
              </div>
              {g.platform && <span className="dmt-row-platform">{g.platform}</span>}
            </button>
          ))}

          {reachedCount === totalCount && totalCount > 0 && (
            <div className="dmt-complete">
              All {totalCount} people contacted
            </div>
          )}
        </div>
      )}
    </div>
  )
}
