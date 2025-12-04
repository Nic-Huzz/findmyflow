import { supabase } from './supabaseClient'

/**
 * Create a new validation flow
 * @param {string} userId - Creator's user ID
 * @param {string} flowName - Name of the flow
 * @param {string} flowDescription - Description of the flow
 * @param {string} flowJsonPath - Path to JSON file (e.g., 'validation-flow-vibe-riser.json')
 * @param {string} persona - Persona type (optional)
 * @param {string} stage - Stage (optional)
 * @returns {Promise<{success: boolean, shareToken?: string, flowId?: string, error?: string}>}
 */
export async function createValidationFlow(
  userId,
  flowName,
  flowDescription,
  flowJsonPath,
  persona = null,
  stage = null
) {
  try {
    // Generate unique share token
    const shareToken = await generateUniqueShareToken()

    const { data, error } = await supabase
      .from('validation_flows')
      .insert({
        creator_user_id: userId,
        flow_name: flowName,
        flow_description: flowDescription,
        share_token: shareToken,
        flow_json_path: flowJsonPath,
        persona,
        stage,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      shareToken,
      flowId: data.id,
      shareUrl: `${window.location.origin}/v/${shareToken}`
    }
  } catch (err) {
    console.error('Error creating validation flow:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * Generate a unique share token
 * @returns {Promise<string>}
 */
async function generateUniqueShareToken() {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    // Generate random 8-character token
    const token = Math.random().toString(36).substring(2, 10)

    // Check if token exists
    const { data, error } = await supabase
      .from('validation_flows')
      .select('id')
      .eq('share_token', token)
      .single()

    if (error && error.code === 'PGRST116') {
      // Token doesn't exist - we can use it
      return token
    }

    attempts++
  }

  throw new Error('Failed to generate unique share token')
}

/**
 * Get all validation flows for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getUserValidationFlows(userId) {
  try {
    const { data, error } = await supabase
      .from('validation_flows')
      .select('*')
      .eq('creator_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (err) {
    console.error('Error fetching validation flows:', err)
    return []
  }
}

/**
 * Get validation flow by share token (public)
 * @param {string} shareToken
 * @returns {Promise<Object|null>}
 */
export async function getValidationFlowByToken(shareToken) {
  try {
    const { data, error } = await supabase
      .from('validation_flows')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single()

    if (error) throw error

    return data
  } catch (err) {
    console.error('Error fetching validation flow:', err)
    return null
  }
}

/**
 * Get all responses for a validation flow
 * @param {string} flowId
 * @returns {Promise<Array>}
 */
export async function getFlowResponses(flowId) {
  try {
    // Get all sessions for this flow
    const { data: sessions, error: sessionsError } = await supabase
      .from('validation_sessions')
      .select('*')
      .eq('flow_id', flowId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })

    if (sessionsError) throw sessionsError

    // Get responses for each session
    const sessionsWithResponses = await Promise.all(
      sessions.map(async (session) => {
        const { data: responses, error: responsesError } = await supabase
          .from('validation_responses')
          .select('*')
          .eq('session_id', session.id)
          .order('answered_at', { ascending: true })

        if (responsesError) {
          console.error('Error fetching responses:', responsesError)
          return { ...session, responses: [] }
        }

        return { ...session, responses: responses || [] }
      })
    )

    return sessionsWithResponses
  } catch (err) {
    console.error('Error fetching flow responses:', err)
    return []
  }
}

/**
 * Toggle validation flow active status
 * @param {string} flowId
 * @param {boolean} isActive
 * @returns {Promise<boolean>}
 */
export async function toggleFlowStatus(flowId, isActive) {
  try {
    const { error } = await supabase
      .from('validation_flows')
      .update({ is_active: isActive })
      .eq('id', flowId)

    if (error) throw error

    return true
  } catch (err) {
    console.error('Error toggling flow status:', err)
    return false
  }
}

/**
 * Delete a validation flow
 * @param {string} flowId
 * @returns {Promise<boolean>}
 */
export async function deleteValidationFlow(flowId) {
  try {
    const { error } = await supabase
      .from('validation_flows')
      .delete()
      .eq('id', flowId)

    if (error) throw error

    return true
  } catch (err) {
    console.error('Error deleting flow:', err)
    return false
  }
}

/**
 * Get response summary/analytics for a flow
 * @param {string} flowId
 * @returns {Promise<Object>}
 */
export async function getFlowAnalytics(flowId) {
  try {
    const sessions = await getFlowResponses(flowId)

    const analytics = {
      totalResponses: sessions.length,
      completionRate: 100, // All sessions returned are completed
      averageTime: 0,
      responseSummary: {}
    }

    // Calculate average completion time
    let totalTime = 0
    sessions.forEach(session => {
      if (session.started_at && session.completed_at) {
        const start = new Date(session.started_at)
        const end = new Date(session.completed_at)
        totalTime += (end - start) / 1000 / 60 // minutes
      }
    })
    analytics.averageTime = sessions.length > 0 ? Math.round(totalTime / sessions.length) : 0

    // Aggregate responses by question
    sessions.forEach(session => {
      session.responses.forEach(response => {
        if (!analytics.responseSummary[response.step_id]) {
          analytics.responseSummary[response.step_id] = {
            question: response.question_text,
            type: response.answer_type,
            answers: []
          }
        }
        analytics.responseSummary[response.step_id].answers.push(response.answer_value)
      })
    })

    return analytics
  } catch (err) {
    console.error('Error calculating analytics:', err)
    return null
  }
}
