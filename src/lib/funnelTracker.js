import { supabase } from './supabaseClient'

/**
 * Lightweight funnel step tracker for lead magnets.
 *
 * Usage:
 *   const tracker = createFunnelTracker('aliveness_quiz')
 *   tracker.step('hook', 0)
 *   tracker.step('choice', 1)
 *   tracker.step('email_gate', 5, { skipped: false })
 *
 * Each .step() call logs that the user REACHED this step.
 * Duration is auto-calculated from the previous step.
 */

function generateSessionId() {
  const key = '_fmf_funnel_sid'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(key, sid)
  }
  return sid
}

export function createFunnelTracker(funnel) {
  const sessionId = generateSessionId()
  let lastStepTime = Date.now()

  return {
    step(stepName, stepIndex, metadata) {
      const now = Date.now()
      const durationMs = now - lastStepTime
      lastStepTime = now

      // Fire and forget — don't block UI
      supabase.from('lead_funnel_events').insert({
        session_id: sessionId,
        funnel,
        step: stepName,
        step_index: stepIndex,
        duration_ms: stepIndex === 0 ? null : durationMs,
        metadata: metadata || null,
      }).then(() => {}).catch(() => {})
    },
  }
}
