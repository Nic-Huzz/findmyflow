/**
 * GuestlistPicker — Inline contact picker for the Pre-Event tab.
 * Select existing contacts to add to the guestlist, or quick-add new ones.
 * Writes to contact_experiences + crm_contacts.
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './GuestlistPicker.css'

export default function GuestlistPicker({ experienceId, userId, onGuestlistChange }) {
  const [contacts, setContacts] = useState([])
  const [guestIds, setGuestIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContact, setNewContact] = useState('')
  const [adding, setAdding] = useState(false)

  // Load contacts + existing guestlist
  useEffect(() => {
    if (!userId || !experienceId) return

    Promise.all([
      supabase.from('crm_contacts').select('id, name, email, phone, social_handle, platform').eq('user_id', userId).order('name'),
      supabase.from('contact_experiences').select('contact_id').eq('experience_id', experienceId),
    ]).then(([contactsRes, guestsRes]) => {
      setContacts(contactsRes.data || [])
      setGuestIds(new Set((guestsRes.data || []).map(g => g.contact_id)))
      setLoading(false)
    })
  }, [userId, experienceId])

  const guestCount = guestIds.size

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.social_handle?.toLowerCase().includes(q)
    )
  }, [contacts, search])

  const toggleGuest = async (contactId) => {
    hapticLight()
    if (guestIds.has(contactId)) {
      await supabase.from('contact_experiences')
        .delete()
        .eq('experience_id', experienceId)
        .eq('contact_id', contactId)
      setGuestIds(prev => { const next = new Set(prev); next.delete(contactId); return next })
      onGuestlistChange?.()
    } else {
      await supabase.from('contact_experiences').upsert({
        experience_id: experienceId,
        contact_id: contactId,
        user_id: userId,
        role: 'attendee',
      }, { onConflict: 'contact_id,experience_id' })
      setGuestIds(prev => new Set([...prev, contactId]))
      hapticSuccess()
      onGuestlistChange?.()
    }
  }

  const handleQuickAdd = async () => {
    if (!newName.trim() || adding) return
    setAdding(true)

    const contactData = {
      user_id: userId,
      name: newName.trim(),
      source: 'Guestlist',
      lifecycle_stage: 'Lead',
    }
    const trimmedContact = newContact.trim()
    if (trimmedContact && trimmedContact.includes('@') && trimmedContact.includes('.')) {
      contactData.email = trimmedContact
    } else if (trimmedContact) {
      contactData.social_handle = trimmedContact.replace(/^@/, '')
    }

    const { data, error } = await supabase.from('crm_contacts').insert(contactData).select('id, name, email, phone, social_handle, platform').single()

    if (!error && data) {
      setContacts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      // Auto-add to guestlist
      await supabase.from('contact_experiences').upsert({
        experience_id: experienceId,
        contact_id: data.id,
        user_id: userId,
        role: 'attendee',
      }, { onConflict: 'contact_id,experience_id' })
      setGuestIds(prev => new Set([...prev, data.id]))
      hapticSuccess()
      onGuestlistChange?.()
    }

    setNewName('')
    setNewContact('')
    setShowAdd(false)
    setAdding(false)
  }

  const contactSubtext = (c) => {
    if (c.social_handle) return `@${c.social_handle.replace('@', '')}`
    if (c.email) return c.email
    if (c.phone) return c.phone
    return ''
  }

  return (
    <div className="gl-container">
      <button className="gl-header" onClick={() => setExpanded(!expanded)}>
        <div className="gl-header-left">
          <span className="gl-icon">👥</span>
          <div>
            <span className="gl-title">Guestlist</span>
            <span className="gl-count">{guestCount} {guestCount === 1 ? 'person' : 'people'} invited</span>
          </div>
        </div>
        <span className={`gl-chevron ${expanded ? 'open' : ''}`}>›</span>
      </button>

      {expanded && (
        <div className="gl-body">
          {loading ? (
            <p className="gl-loading">Loading contacts...</p>
          ) : (
            <>
              {contacts.length > 5 && (
                <input
                  className="gl-search"
                  type="text"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}

              <div className="gl-list">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    className={`gl-contact ${guestIds.has(c.id) ? 'selected' : ''}`}
                    onClick={() => toggleGuest(c.id)}
                  >
                    <span className="gl-check">{guestIds.has(c.id) ? '✓' : ''}</span>
                    <div className="gl-contact-info">
                      <span className="gl-contact-name">{c.name}</span>
                      <span className="gl-contact-sub">{contactSubtext(c)}</span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && contacts.length > 0 && (
                  <p className="gl-empty">No matches</p>
                )}
                {contacts.length === 0 && (
                  <p className="gl-empty">No contacts yet. Add your first one below.</p>
                )}
              </div>

              {!showAdd ? (
                <button className="gl-add-btn" onClick={() => setShowAdd(true)}>
                  + Add someone new
                </button>
              ) : (
                <div className="gl-add-form">
                  <input
                    className="gl-input"
                    type="text"
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                  />
                  <input
                    className="gl-input"
                    type="text"
                    placeholder="Email or @social handle"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                  />
                  <div className="gl-add-actions">
                    <button className="gl-save-btn" onClick={handleQuickAdd} disabled={!newName.trim() || adding}>
                      {adding ? 'Adding...' : 'Add to Guestlist'}
                    </button>
                    <button className="gl-cancel-btn" onClick={() => { setShowAdd(false); setNewName(''); setNewContact('') }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
