// Project Auto-Creation Library
// Handles automatic project creation from completed discovery flows

import { supabase } from './supabaseClient'

/**
 * Create a project from a completed Nikigai session
 * This is the "Project Auto-Creation" feature explained in the Lego castle analogy:
 * - User completes Nikigai flow (designs their castle) ✅
 * - This function auto-creates a project (starts building) 🏰
 * - User can then track flow entries (track building progress) 📊
 *
 * @param {string} userId - User's ID
 * @param {string} sessionId - Nikigai session ID
 * @param {string} flowType - Flow type ('nikigai', '100m_offer', '100m_money_model')
 * @returns {Promise<{success: boolean, projectId?: string, error?: string}>}
 */
export const createProjectFromSession = async (userId, sessionId, flowType) => {
  try {
    console.log('🎯 Auto-creating project from session:', { userId, sessionId, flowType })

    // Step 1: Fetch the session data
    const { data: session, error: sessionError } = await supabase
      .from('nikigai_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError)
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'completed') {
      console.warn('⚠️ Session not completed, skipping project creation')
      return { success: false, error: 'Session not completed yet' }
    }

    // Step 2: Fetch key outcomes (contains selected opportunity from integration)
    const { data: keyOutcomes, error: outcomesError } = await supabase
      .from('nikigai_key_outcomes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (outcomesError) {
      console.warn('⚠️ Error fetching key outcomes:', outcomesError)
    }

    // Step 3: Generate project name and description based on flow type
    let projectName = 'My Project'
    let projectDescription = ''

    if (flowType === 'nikigai') {
      // Use selected opportunity from integration flow
      const selectedOpp = keyOutcomes?.[0]?.selected_opportunity
      if (selectedOpp) {
        const skillLabel = selectedOpp.skill?.label || 'skill'
        const problemLabel = selectedOpp.problem?.label || 'problem'
        const personaLabel = selectedOpp.persona?.label || 'people'

        projectName = `${skillLabel} for ${personaLabel}`
        projectDescription = `Using ${skillLabel} to solve ${problemLabel} for ${personaLabel}.`
      } else {
        // Fallback: use mission or first key outcome
        const mission = keyOutcomes?.[0]?.mission
        const outcome = keyOutcomes?.[0]?.outcome_text

        if (mission) {
          projectName = mission.split(' ').slice(0, 6).join(' ')
          projectDescription = mission
        } else if (outcome) {
          projectName = outcome.split(' ').slice(0, 6).join(' ')
          projectDescription = outcome
        } else {
          projectName = 'My Nikigai Project'
          projectDescription = 'A project born from my Nikigai discovery journey'
        }
      }
    } else if (flowType === '100m_offer') {
      projectName = 'My $100M Offer'
      projectDescription = 'Building a grand slam offer that stands out in the market'
    } else if (flowType === '100m_money_model') {
      projectName = 'My Money Model'
      projectDescription = 'Designing a sustainable revenue model for my business'
    }

    // Step 4: Create the project (unique constraint prevents duplicates)
    const { data: newProject, error: createError } = await supabase
      .from('user_projects')
      .insert({
        user_id: userId,
        name: projectName,
        description: projectDescription,
        source_flow: flowType,
        source_session_id: sessionId,
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      // Check if it's a duplicate error (unique constraint violation)
      if (createError.code === '23505') {
        console.log('✅ Project already exists for this session')
        // Fetch existing project
        const { data: existingProject } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', userId)
          .eq('source_flow', flowType)
          .eq('source_session_id', sessionId)
          .single()

        return {
          success: true,
          projectId: existingProject?.id,
          alreadyExists: true
        }
      }

      console.error('❌ Error creating project:', createError)
      return { success: false, error: createError.message }
    }

    console.log('✅ Project auto-created:', newProject.id, newProject.name)

    // Step 5: Set as default project in user_stage_progress
    const { error: updateError } = await supabase
      .from('user_stage_progress')
      .update({ default_project_id: newProject.id })
      .eq('user_id', userId)

    if (updateError) {
      console.warn('⚠️ Could not set default project:', updateError)
      // Non-critical error, don't fail the whole operation
    }

    return {
      success: true,
      projectId: newProject.id,
      projectName: newProject.name
    }
  } catch (err) {
    console.error('❌ Unexpected error in createProjectFromSession:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get or create active project for user
 * Used when user wants to log flow but doesn't have an active project yet
 *
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, projectId?: string, error?: string}>}
 */
export const getOrCreateActiveProject = async (userId) => {
  try {
    // Try to get existing active project
    const { data: activeProject, error: fetchError } = await supabase
      .from('user_projects')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (activeProject && !fetchError) {
      return { success: true, projectId: activeProject.id }
    }

    // No active project found, check if user has completed any flows
    const { data: completedSessions } = await supabase
      .from('nikigai_sessions')
      .select('id, flow_type')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)

    if (completedSessions && completedSessions.length > 0) {
      // Auto-create project from most recent completed session
      const session = completedSessions[0]
      return createProjectFromSession(userId, session.id, session.flow_type)
    }

    // User has no completed flows, cannot auto-create
    return {
      success: false,
      error: 'No active project. Complete a discovery flow to create your first project.'
    }
  } catch (err) {
    console.error('❌ Error in getOrCreateActiveProject:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Check if a project exists for a session
 *
 * @param {string} sessionId - Nikigai session ID
 * @returns {Promise<{exists: boolean, projectId?: string}>}
 */
export const checkProjectExists = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('user_projects')
      .select('id')
      .eq('source_session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking project:', error)
      return { exists: false }
    }

    return {
      exists: !!data,
      projectId: data?.id
    }
  } catch (err) {
    console.error('Error in checkProjectExists:', err)
    return { exists: false }
  }
}
