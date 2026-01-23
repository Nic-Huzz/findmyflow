import { supabase } from './supabaseClient'

/**
 * Create a new validation flow
 * @param {string} userId - Creator's user ID
 * @param {string} flowName - Name of the flow
 * @param {string} flowDescription - Description of the flow
 * @param {string} flowJsonPath - Path to JSON file (e.g., 'validation-flow-vibe-riser.json')
 * @param {string} persona - Persona type (optional)
 * @param {string} stage - Stage (optional)
 * @param {Object} placeholders - Custom placeholders for the flow (optional)
 * @param {string} placeholders.problemArea - The problem area being validated
 * @param {string} placeholders.solutionConcept - The solution concept being tested
 * @param {string} placeholders.audienceDescription - Description of target audience
 * @returns {Promise<{success: boolean, shareToken?: string, flowId?: string, error?: string}>}
 */
export async function createValidationFlow(
  userId,
  flowName,
  flowDescription,
  flowJsonPath,
  persona = null,
  stage = null,
  placeholders = null
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
        placeholders,
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
 * @param {boolean} includeIncomplete - Include sessions that haven't been marked complete
 * @returns {Promise<Array>}
 */
export async function getFlowResponses(flowId, includeIncomplete = false) {
  try {
    // Get sessions for this flow
    let query = supabase
      .from('validation_sessions')
      .select('*')
      .eq('flow_id', flowId)

    if (!includeIncomplete) {
      query = query.eq('is_completed', true)
    }

    // Order by most recent activity
    const { data: sessions, error: sessionsError } = await query
      .order('started_at', { ascending: false })

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
 * @param {string} timePeriod - 'all' | '7days' | '30days'
 * @returns {Promise<Object>}
 */
export async function getFlowAnalytics(flowId, timePeriod = 'all') {
  try {
    // Calculate date filter based on time period
    let dateFilter = null
    const now = new Date()
    if (timePeriod === '7days') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timePeriod === '30days') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Get ALL sessions (including incomplete) for drop-off analysis
    let sessionsQuery = supabase
      .from('validation_sessions')
      .select('*')
      .eq('flow_id', flowId)
      .order('started_at', { ascending: false })

    if (dateFilter) {
      sessionsQuery = sessionsQuery.gte('started_at', dateFilter)
    }

    const { data: allSessions, error: allSessionsError } = await sessionsQuery

    if (allSessionsError) throw allSessionsError

    const completedSessions = allSessions.filter(s => s.is_completed)

    // Calculate previous period for trends
    let previousPeriodData = null
    if (timePeriod !== 'all') {
      const periodMs = timePeriod === '7days' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
      const previousStart = new Date(now.getTime() - 2 * periodMs).toISOString()
      const previousEnd = dateFilter

      const { data: prevSessions } = await supabase
        .from('validation_sessions')
        .select('*')
        .eq('flow_id', flowId)
        .gte('started_at', previousStart)
        .lt('started_at', previousEnd)

      if (prevSessions && prevSessions.length > 0) {
        const prevCompleted = prevSessions.filter(s => s.is_completed)
        previousPeriodData = {
          totalStarted: prevSessions.length,
          totalCompleted: prevCompleted.length,
          completionRate: prevSessions.length > 0
            ? Math.round((prevCompleted.length / prevSessions.length) * 100)
            : 0
        }
      }
    }

    // Calculate daily data for sparklines (last 7 days)
    const dailyData = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayCompleted = allSessions.filter(s => {
        if (!s.is_completed || !s.completed_at) return false
        const completedDate = new Date(s.completed_at)
        return completedDate >= dayStart && completedDate < dayEnd
      }).length

      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        completed: dayCompleted
      })
    }

    const analytics = {
      // Core metrics
      totalStarted: allSessions.length,
      totalCompleted: completedSessions.length,
      completionRate: allSessions.length > 0
        ? Math.round((completedSessions.length / allSessions.length) * 100)
        : 0,
      averageTime: 0,

      // Trend data (compared to previous period)
      trends: previousPeriodData ? {
        startedChange: allSessions.length - previousPeriodData.totalStarted,
        completedChange: completedSessions.length - previousPeriodData.totalCompleted,
        rateChange: (allSessions.length > 0
          ? Math.round((completedSessions.length / allSessions.length) * 100)
          : 0) - previousPeriodData.completionRate
      } : null,

      // Sparkline data (last 7 days)
      sparklineData: dailyData,

      // Device breakdown
      deviceBreakdown: {
        mobile: 0,
        desktop: 0,
        unknown: 0
      },

      // Drop-off funnel
      dropOffFunnel: {},

      // Response aggregations
      responseSummary: {},

      // Recent activity
      recentSessions: allSessions.slice(0, 10).map(s => ({
        id: s.id,
        started_at: s.started_at,
        completed_at: s.completed_at,
        is_completed: s.is_completed,
        last_step_index: s.last_step_index,
        device_type: s.metadata?.device_type || 'unknown'
      }))
    }

    // Calculate device breakdown
    allSessions.forEach(session => {
      const deviceType = session.metadata?.device_type || 'unknown'
      if (analytics.deviceBreakdown[deviceType] !== undefined) {
        analytics.deviceBreakdown[deviceType]++
      } else {
        analytics.deviceBreakdown.unknown++
      }
    })

    // Calculate drop-off funnel (where people stopped)
    allSessions.filter(s => !s.is_completed).forEach(session => {
      const lastStep = session.last_step_index || 0
      if (!analytics.dropOffFunnel[lastStep]) {
        analytics.dropOffFunnel[lastStep] = 0
      }
      analytics.dropOffFunnel[lastStep]++
    })

    // Calculate average completion time
    let totalTime = 0
    let timeCount = 0
    completedSessions.forEach(session => {
      if (session.started_at && session.completed_at) {
        const start = new Date(session.started_at)
        const end = new Date(session.completed_at)
        const minutes = (end - start) / 1000 / 60
        if (minutes > 0 && minutes < 60) { // Filter outliers
          totalTime += minutes
          timeCount++
        }
      }
    })
    analytics.averageTime = timeCount > 0 ? Math.round(totalTime / timeCount) : 0

    // Get responses for completed sessions
    const sessionsWithResponses = await Promise.all(
      completedSessions.slice(0, 50).map(async (session) => { // Limit for performance
        const { data: responses } = await supabase
          .from('validation_responses')
          .select('*')
          .eq('session_id', session.id)
          .order('answered_at', { ascending: true })
        return { ...session, responses: responses || [] }
      })
    )

    // Aggregate responses by question
    sessionsWithResponses.forEach(session => {
      session.responses.forEach(response => {
        if (!analytics.responseSummary[response.step_id]) {
          analytics.responseSummary[response.step_id] = {
            question: response.question_text?.substring(0, 100),
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
