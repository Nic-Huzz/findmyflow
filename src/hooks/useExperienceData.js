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

  const createExperience = async ({ name, experience_date, previous_experience_id = null }) => {
    setCreating(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      // 1. Insert the experience
      const { data: experience, error: createErr } = await supabase
        .from('experiences')
        .insert({
          user_id: user.id,
          name: name.trim(),
          experience_date: experience_date || null,
          previous_experience_id,
          status: 'upcoming',
        })
        .select()
        .single()

      if (createErr) throw createErr

      // 2. Seed the checklist from template
      const rows = buildChecklistRows(experience.id, user.id)
      const { error: seedErr } = await supabase
        .from('experience_checklist_items')
        .insert(rows)

      if (seedErr) {
        // Rollback the experience if seeding fails
        await supabase.from('experiences').delete().eq('id', experience.id)
        throw seedErr
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
    setExperience(prev => ({ ...prev, ...updates }))
    const { error: err } = await supabase
      .from('experiences')
      .update(updates)
      .eq('id', experienceId)
    if (err) {
      console.error('[useExperience] update failed:', err)
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
