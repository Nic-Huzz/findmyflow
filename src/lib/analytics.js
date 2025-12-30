import { supabase } from './supabaseClient'

const SESSION_STORAGE_KEY = 'fmf_session_id'

export function getOrCreateSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing
    const newId = crypto.randomUUID()
    localStorage.setItem(SESSION_STORAGE_KEY, newId)
    return newId
  } catch {
    // Fallback when storage unavailable
    return crypto.randomUUID()
  }
}

async function sha256(text) {
  try {
    const enc = new TextEncoder()
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(text))
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

export async function hashEmail(email) {
  if (!email) return null
  return await sha256(email.trim().toLowerCase())
}

export async function sendEvent(eventName, payload = {}) {
  try {
    const sessionId = getOrCreateSessionId()
    const base = { name: eventName, session_id: sessionId, payload, created_at: new Date().toISOString() }
    console.log('📊 Event', base)
    if (!supabase) return { ok: false, reason: 'no-supabase' }
    const { error } = await supabase.from('events').insert([base])
    if (error) {
      console.warn('Event insert error', error)
      return { ok: false, reason: error.message }
    }
    return { ok: true }
  } catch (e) {
    console.warn('Event send failed', e)
    return { ok: false, reason: e?.message }
  }
}

// Generic event tracker
export async function trackEvent(eventName, payload = {}) {
  return sendEvent(eventName, payload)
}

// Convenience trackers
export async function trackLeadMagnetStart(variantId) {
  return sendEvent('leadmagnet_start', { variantId })
}

export async function trackLeadMagnetComplete({ resultArchetype, archetypeType }) {
  return sendEvent('leadmagnet_complete', { resultArchetype, archetypeType })
}

export async function trackEmailSubmitted(email) {
  const emailHash = await hashEmail(email)
  return sendEvent('email_submitted', { emailHash })
}

export async function trackAccountCreated({ userId, source }) {
  return sendEvent('account_created', { userId, source })
}

export async function trackProfileView({ userId, entry }) {
  return sendEvent('profile_view', { userId, entry })
}

// Weekly Planning Analytics
export async function trackWeeklyPlanStarted({ weekType }) {
  return sendEvent('weekly_plan_started', { weekType })
}

export async function trackWeeklyPlanCompleted({ weekType, morningRoutineCount, hasGroan, hasRelease, has3Percent }) {
  return sendEvent('weekly_plan_completed', {
    weekType,
    morningRoutineCount,
    hasGroan,
    hasRelease,
    has3Percent
  })
}

export async function trackGroanCompleted({ weekType, dayPlanned, dayCompleted }) {
  return sendEvent('groan_completed', { weekType, dayPlanned, dayCompleted })
}

export async function trackMorningRoutineCompleted({ routineType }) {
  return sendEvent('morning_routine_completed', { routineType })
}





