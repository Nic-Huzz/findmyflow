import { supabase } from './supabaseClient'

export async function trackFlowCompletion({ userId, projectId, flowType, flowVersion = 'v1', experienceId = null }) {
  try {
    await supabase.from('flow_sessions').insert({
      user_id: userId,
      project_id: projectId || null,
      experience_id: experienceId || null,
      flow_type: flowType,
      flow_version: flowVersion,
      status: 'completed',
      last_step_id: 'complete'
    })
  } catch (error) {
    console.warn('Flow tracking failed:', error)
  }
}
