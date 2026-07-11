/**
 * useExperienceData
 *
 * State management for the experience checklist system at /business.
 * Handles: fetch experiences list, fetch single experience + its checklist,
 * create experience (with seeded checklist), toggle/hide/update items,
 * add custom items.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { buildChecklistRows } from '../lib/experienceChecklistTemplate'
import { awardMovementXP } from '../lib/movementXP'

/**
 * List hook — for ExperienceCatalog
 */
export function useExperienceList() {
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchExperiences = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      // Auto-complete experiences whose date is 7+ days in the past
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      const cutoffStr = cutoff.toISOString().split('T')[0]
      await supabase
        .from('experiences')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'upcoming')
        .lt('experience_date', cutoffStr)

      const { data, error: err } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('experience_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (err) throw err
      setExperiences(data || [])
    } catch (err) {
      console.error('[useExperienceList] fetch failed:', err)
      setError(err.message || 'Failed to load experiences')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExperiences()
  }, [fetchExperiences])

  return { experiences, loading, error, refetch: fetchExperiences }
}

/**
 * Create hook — for ExperienceCreate
 * On success, also seeds the checklist from the template.
 */
export function useCreateExperience() {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const createExperience = async ({ name, experience_date, previous_experience_id = null, ticket_price = null, experience_type = null, template_id = null, runAgainFromId = null, capacity = null }) => {
    setCreating(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      // 1. Insert the experience
      const insertPayload = {
        user_id: user.id,
        name: name.trim(),
        experience_date: experience_date || null,
        previous_experience_id: previous_experience_id || runAgainFromId || null,
        status: 'upcoming',
        checklist_version: 'nodes',
      }
      if (ticket_price != null) insertPayload.ticket_price = ticket_price
      if (experience_type) insertPayload.experience_type = experience_type
      if (template_id) insertPayload.template_id = template_id
      if (capacity != null && capacity > 0) insertPayload.capacity = capacity

      let { data: experience, error: createErr } = await supabase
        .from('experiences')
        .insert(insertPayload)
        .select()
        .single()

      if (createErr) throw createErr

      // 2. Seed the checklist from template (type-keyed)
      const rows = buildChecklistRows(experience.id, user.id, experience.experience_type)
      let { error: seedErr } = await supabase
        .from('experience_checklist_items')
        .insert(rows)

      // If template_item_key column doesn't exist yet, retry without it
      if (seedErr?.code === '42703') {
        const rowsWithoutKey = rows.map(({ template_item_key, ...rest }) => rest)
        const retry = await supabase.from('experience_checklist_items').insert(rowsWithoutKey)
        seedErr = retry.error
      }

      if (seedErr) {
        await supabase.from('experiences').delete().eq('id', experience.id)
        throw seedErr
      }

      // 3. Carry forward data from previous experience (Run Again)
      if (runAgainFromId) {
        try {
          // Carry forward checklist notes
          const { data: prevItems } = await supabase
            .from('experience_checklist_items')
            .select('template_item_key, notes')
            .eq('experience_id', runAgainFromId)
            .not('template_item_key', 'is', null)
            .not('notes', 'is', null)
          if (prevItems?.length) {
            const { data: newItems } = await supabase
              .from('experience_checklist_items')
              .select('id, template_item_key')
              .eq('experience_id', experience.id)
              .not('template_item_key', 'is', null)
            const updates = prevItems
              .map(prev => {
                const match = newItems?.find(n => n.template_item_key === prev.template_item_key)
                return match && prev.notes ? supabase.from('experience_checklist_items').update({ notes: prev.notes }).eq('id', match.id) : null
              })
              .filter(Boolean)
            if (updates.length) await Promise.all(updates)
          }

          // Carry forward Details tab fields (one-liner, booking URL, venue, value stack, pricing)
          const { data: srcExp } = await supabase
            .from('experiences')
            .select('one_line_promise, booking_url, venue, description, value_stack, early_bird_price, standard_price, currency, pricing_percentage, modalities, word_of_mouth')
            .eq('id', runAgainFromId)
            .maybeSingle()
          if (srcExp) {
            const detailsUpdate = {}
            if (srcExp.one_line_promise) detailsUpdate.one_line_promise = srcExp.one_line_promise
            if (srcExp.booking_url) detailsUpdate.booking_url = srcExp.booking_url
            if (srcExp.venue) detailsUpdate.venue = srcExp.venue
            if (srcExp.description) detailsUpdate.description = srcExp.description
            if (srcExp.value_stack) detailsUpdate.value_stack = srcExp.value_stack
            if (srcExp.early_bird_price != null) detailsUpdate.early_bird_price = srcExp.early_bird_price
            if (srcExp.standard_price != null) detailsUpdate.standard_price = srcExp.standard_price
            if (srcExp.currency) detailsUpdate.currency = srcExp.currency
            if (srcExp.pricing_percentage != null) detailsUpdate.pricing_percentage = srcExp.pricing_percentage
            if (srcExp.modalities?.length) detailsUpdate.modalities = srcExp.modalities
            if (srcExp.word_of_mouth) detailsUpdate.word_of_mouth = srcExp.word_of_mouth
            if (Object.keys(detailsUpdate).length) {
              await supabase.from('experiences').update(detailsUpdate).eq('id', experience.id)
            }
          }
          // Award 10 XP for Run Again
          awardMovementXP(user.id, 'run_again', name.trim())
        } catch (err) {
          console.error('Run Again carry-forward failed (non-blocking):', err)
        }
      }

      return experience
    } catch (err) {
      console.error('[useCreateExperience] failed:', err)
      setError(err.message || 'Failed to create experience')
      throw err
    } finally {
      setCreating(false)
    }
  }

  return { createExperience, creating, error }
}

/**
 * Single experience hook — for ExperienceDetail
 * Returns experience + its checklist items, plus mutation helpers.
 */
export function useExperience(experienceId) {
  const [experience, setExperience] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchExperience = useCallback(async () => {
    if (!experienceId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const [{ data: exp, error: expErr }, { data: its, error: itsErr }] = await Promise.all([
        supabase
          .from('experiences')
          .select('*')
          .eq('id', experienceId)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('experience_checklist_items')
          .select('*')
          .eq('experience_id', experienceId)
          .eq('user_id', user.id)
          .order('phase', { ascending: true })
          .order('section', { ascending: true })
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ])

      if (expErr) throw expErr
      if (itsErr) throw itsErr

      setExperience(exp)
      setItems(its || [])
    } catch (err) {
      console.error('[useExperience] fetch failed:', err)
      setError(err.message || 'Failed to load experience')
    } finally {
      setLoading(false)
    }
  }, [experienceId])

  useEffect(() => {
    fetchExperience()
  }, [fetchExperience])

  // Toggle completion (optimistic)
  const toggleItem = async (itemId) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const nextCompleted = !item.completed

    setItems(prev => prev.map(i =>
      i.id === itemId
        ? { ...i, completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null }
        : i
    ))

    const { error: err } = await supabase
      .from('experience_checklist_items')
      .update({
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      })
      .eq('id', itemId)

    if (err) {
      console.error('[useExperience] toggle failed, rolling back:', err)
      setItems(prev => prev.map(i =>
        i.id === itemId ? { ...i, completed: item.completed, completed_at: item.completed_at } : i
      ))
    } else if (nextCompleted) {
      // Award 2 XP for completing a checklist item
      const session = await supabase.auth.getSession()
      const uid = session?.data?.session?.user?.id
      if (uid) awardMovementXP(uid, 'checklist_item', item.label)
    }
  }

  // Hide a seeded item (skip)
  const hideItem = async (itemId) => {
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, is_hidden: true } : i
    ))
    const { error: err } = await supabase
      .from('experience_checklist_items')
      .update({ is_hidden: true })
      .eq('id', itemId)
    if (err) {
      console.error('[useExperience] hide failed:', err)
      await fetchExperience()
    }
  }

  // Unhide a seeded item
  const unhideItem = async (itemId) => {
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, is_hidden: false } : i
    ))
    const { error: err } = await supabase
      .from('experience_checklist_items')
      .update({ is_hidden: false })
      .eq('id', itemId)
    if (err) {
      console.error('[useExperience] unhide failed:', err)
      await fetchExperience()
    }
  }

  // Add a custom item
  const addCustomItem = async ({ phase, section, label }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      // Max sort_order for this phase/section
      const siblings = items.filter(i => i.phase === phase && i.section === section)
      const maxOrder = siblings.reduce((m, i) => Math.max(m, i.sort_order), 0)

      const { data, error: err } = await supabase
        .from('experience_checklist_items')
        .insert({
          experience_id: experienceId,
          user_id: user.id,
          phase,
          section,
          label: label.trim(),
          sort_order: maxOrder + 1,
          is_custom: true,
          is_hidden: false,
          completed: false,
        })
        .select()
        .single()

      if (err) throw err
      setItems(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('[useExperience] addCustomItem failed:', err)
      throw err
    }
  }

  // Delete a custom item (seeded items can only be hidden, not deleted)
  const deleteCustomItem = async (itemId) => {
    const item = items.find(i => i.id === itemId)
    if (!item || !item.is_custom) return

    setItems(prev => prev.filter(i => i.id !== itemId))
    const { error: err } = await supabase
      .from('experience_checklist_items')
      .delete()
      .eq('id', itemId)

    if (err) {
      console.error('[useExperience] delete failed:', err)
      await fetchExperience()
    }
  }

  // Update experience fields (name, date, status, reflection notes)
  const updateExperience = async (updates) => {
    const prev = experience
    setExperience(p => ({ ...p, ...updates }))
    const { error: err } = await supabase
      .from('experiences')
      .update(updates)
      .eq('id', experienceId)
    if (err) {
      console.error('[useExperience] update failed:', err)
      await fetchExperience()
      throw err
    }

    // Award Movement XP for key milestones
    const session = await supabase.auth.getSession()
    const uid = session?.data?.session?.user?.id
    if (uid) {
      if (updates.status === 'completed' && prev?.status !== 'completed') {
        awardMovementXP(uid, 'experience_complete', prev?.name || '')
      }
      if (updates.three_percent_note && !prev?.three_percent_note) {
        awardMovementXP(uid, 'three_percent', updates.three_percent_note)
      }
    }
  }

  // Update notes on a checklist item (for Run Again carry-forward)
  const updateChecklistNote = async (itemId, notes) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i))
    const { error: err } = await supabase
      .from('experience_checklist_items')
      .update({ notes: notes || null })
      .eq('id', itemId)
    if (err) {
      console.error('[useExperience] updateNote failed:', err)
      await fetchExperience()
    }
  }

  return {
    experience,
    items,
    loading,
    error,
    refetch: fetchExperience,
    toggleItem,
    hideItem,
    unhideItem,
    addCustomItem,
    deleteCustomItem,
    updateExperience,
    updateChecklistNote,
  }
}

/**
 * Parse a YYYY-MM-DD date string as LOCAL time (not UTC).
 * Avoids the timezone shift bug where `new Date("2026-05-03")` is UTC midnight,
 * which renders as the day before in timezones west of UTC.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/**
 * Format a YYYY-MM-DD date for display (long or short form).
 */
export function formatExperienceDate(dateStr, opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) {
  const d = parseLocalDate(dateStr)
  if (!d) return 'No date set'
  return d.toLocaleDateString('en-US', opts)
}

/**
 * Helper: compute days until an experience date (local time).
 * Returns null if no date, negative for past dates.
 */
export function daysUntil(dateStr) {
  const target = parseLocalDate(dateStr)
  if (!target) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}
