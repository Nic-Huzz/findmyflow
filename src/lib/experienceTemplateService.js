/**
 * experienceTemplateService.js — CRUD for experience templates (library)
 */
import { supabase } from './supabaseClient'

export async function fetchTemplates(userId) {
  const { data, error } = await supabase
    .from('experience_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('times_delivered', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createTemplate(userId, template) {
  const { data, error } = await supabase
    .from('experience_templates')
    .insert({
      user_id: userId,
      name: template.name,
      description: template.description || null,
      experience_type: template.experience_type || 'workshop',
      duration_minutes: template.duration_minutes || null,
      modalities: template.modalities || [],
      default_ticket_price: template.default_ticket_price || null,
      runsheet: template.runsheet || [],
      playlist_url: template.playlist_url || null,
      music_notes: template.music_notes || null,
      setup_notes: template.setup_notes || null,
      equipment_needed: template.equipment_needed || [],
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTemplate(templateId, updates) {
  const { data, error } = await supabase
    .from('experience_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function archiveTemplate(templateId) {
  return updateTemplate(templateId, { status: 'archived' })
}

export async function incrementDeliveryCount(templateId, attendeeCount) {
  // Fetch current stats
  const { data: current } = await supabase
    .from('experience_templates')
    .select('times_delivered, avg_attendees')
    .eq('id', templateId)
    .single()

  if (!current) return

  const newCount = (current.times_delivered || 0) + 1
  const prevTotal = (current.avg_attendees || 0) * (current.times_delivered || 0)
  const newAvg = attendeeCount ? Math.round((prevTotal + attendeeCount) / newCount) : current.avg_attendees

  await updateTemplate(templateId, {
    times_delivered: newCount,
    avg_attendees: newAvg,
  })
}

// ── Event Check-ins ──

export async function submitEventCheckin(experienceId, userId, creatorId, checkinType, state) {
  const { data, error } = await supabase
    .from('event_checkins')
    .upsert({
      experience_id: experienceId,
      user_id: userId,
      creator_id: creatorId,
      checkin_type: checkinType,
      state,
    }, { onConflict: 'experience_id,user_id,checkin_type' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchEventCheckins(experienceId) {
  const { data, error } = await supabase
    .from('event_checkins')
    .select('*')
    .eq('experience_id', experienceId)
    .order('created_at')
  if (error) throw error
  return data || []
}

export function calculateStateShifts(checkins) {
  const STATE_ORDER = { dorsal: 0, sympathetic: 1, ventral: 2, vibe_rise: 3 }
  const STATE_LABELS = { dorsal: 'Shutdown', sympathetic: 'Activated', ventral: 'Safe', vibe_rise: 'Vibe Rise' }

  const byUser = {}
  for (const c of checkins) {
    if (!byUser[c.user_id]) byUser[c.user_id] = {}
    byUser[c.user_id][c.checkin_type] = c.state
  }

  const shifts = []
  let improved = 0
  let total = 0

  for (const [userId, states] of Object.entries(byUser)) {
    if (states.before && states.after) {
      total++
      const beforeVal = STATE_ORDER[states.before] ?? 0
      const afterVal = STATE_ORDER[states.after] ?? 0
      if (afterVal > beforeVal) improved++
      shifts.push({
        userId,
        before: states.before,
        after: states.after,
        beforeLabel: STATE_LABELS[states.before],
        afterLabel: STATE_LABELS[states.after],
        shifted: afterVal > beforeVal,
      })
    }
  }

  // State distribution
  const beforeDist = { dorsal: 0, sympathetic: 0, ventral: 0, vibe_rise: 0 }
  const afterDist = { dorsal: 0, sympathetic: 0, ventral: 0, vibe_rise: 0 }
  for (const s of shifts) {
    beforeDist[s.before]++
    afterDist[s.after]++
  }

  return {
    shifts,
    total,
    improved,
    improvementRate: total > 0 ? Math.round((improved / total) * 100) : 0,
    beforeDist,
    afterDist,
  }
}
