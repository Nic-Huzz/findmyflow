// src/lib/zarlo/voiceProcessor.js
// Process voice commands and execute actions

import { supabase } from '../supabaseClient'
import { getWeekStart, getQuickStats } from '../executeHelpers'

const COMMAND_PATTERNS = [
  {
    pattern: /^log (?:a )?deal with (.+) for \$?([\d,]+)/i,
    action: 'create_deal',
    extract: (match) => ({
      contact_name: match[1],
      amount: parseInt(match[2].replace(/,/g, ''))
    })
  },
  {
    pattern: /^complete (?:task )?(.+)/i,
    action: 'complete_task',
    extract: (match) => ({ task_search: match[1] })
  },
  {
    pattern: /^add task:?\s*(.+)/i,
    action: 'create_task',
    extract: (match) => ({ title: match[1] })
  },
  {
    pattern: /^update funnel:?\s*([\d,]+)\s+(\w+)/i,
    action: 'update_funnel',
    extract: (match) => ({
      count: parseInt(match[1].replace(/,/g, '')),
      stage: match[2]
    })
  },
  {
    pattern: /^note:?\s*(.+)/i,
    action: 'create_note',
    extract: (match) => ({ content: match[1] })
  },
  {
    pattern: /^how am i doing\??$/i,
    action: 'get_stats',
    extract: () => ({})
  },
  {
    pattern: /^what('s| is) my (streak|stats|progress)\??$/i,
    action: 'get_stats',
    extract: () => ({})
  }
]

/**
 * Process a voice command and execute the appropriate action
 * @param {string} transcript - The transcribed voice input
 * @param {string} userId - The user's ID
 * @param {string} projectId - Optional project ID for context
 * @returns {Object} Result with success status and message
 */
export async function processVoiceCommand(transcript, userId, projectId = null) {
  const cleanedText = transcript.trim()

  for (const { pattern, action, extract } of COMMAND_PATTERNS) {
    const match = cleanedText.match(pattern)
    if (match) {
      const data = extract(match)
      return await executeAction(action, data, userId, projectId)
    }
  }

  // No pattern matched - return for Zarlo to handle as chat
  return {
    success: true,
    action: 'fallback_chat',
    message: "I'll help you with that...",
    originalText: cleanedText
  }
}

/**
 * Execute a specific action based on voice command
 */
async function executeAction(action, data, userId, projectId) {
  switch (action) {
    case 'create_deal': {
      const { error } = await supabase.from('sales_deals').insert({
        user_id: userId,
        project_id: projectId,
        contact_name: data.contact_name,
        value: data.amount,
        status: 'lead',
        product_type: 'service'
      })
      return {
        success: !error,
        action: 'create_deal',
        message: error
          ? 'Failed to log deal'
          : `Logged $${data.amount.toLocaleString()} deal with ${data.contact_name}`
      }
    }

    case 'complete_task': {
      // Find matching task
      const { data: tasks } = await supabase
        .from('execute_tasks')
        .select('id, title')
        .eq('user_id', userId)
        .eq('completed', false)
        .ilike('title', `%${data.task_search}%`)
        .limit(1)

      if (tasks?.length > 0) {
        await supabase
          .from('execute_tasks')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', tasks[0].id)

        return {
          success: true,
          action: 'complete_task',
          taskId: tasks[0].id,
          message: `Completed: "${tasks[0].title}"`
        }
      }
      return {
        success: false,
        action: 'complete_task',
        message: `Couldn't find task matching "${data.task_search}"`
      }
    }

    case 'create_task': {
      if (!projectId) {
        // Try to get default project
        const { data: projects } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)

        projectId = projects?.[0]?.id
      }

      if (!projectId) {
        return {
          success: false,
          action: 'create_task',
          message: 'No project found. Please create a project first.'
        }
      }

      const { error } = await supabase.from('execute_tasks').insert({
        user_id: userId,
        project_id: projectId,
        title: data.title,
        scheduled_date: new Date().toISOString().split('T')[0],
        phase: 'build',
        points: 10
      })

      return {
        success: !error,
        action: 'create_task',
        message: error ? 'Failed to create task' : `Added: "${data.title}"`
      }
    }

    case 'update_funnel': {
      // Map voice commands to actual funnel_metrics column names
      const stageMap = {
        awareness: 'awareness',
        reach: 'awareness',
        attraction: 'attraction',
        engaged: 'attraction',
        leads: 'leadmagnet',
        leadmagnet: 'leadmagnet',
        optins: 'leadmagnet',
        nurture: 'nurture',
        nurtured: 'nurture',
        core: 'core',
        sales: 'core',
        conversions: 'core',
        upsell: 'upsell',
        upsells: 'upsell',
        downsell: 'downsell',
        downsells: 'downsell',
        continuity: 'continuity',
        recurring: 'continuity'
      }

      const field = stageMap[data.stage.toLowerCase()]
      if (!field) {
        return {
          success: false,
          action: 'update_funnel',
          message: `Unknown funnel stage: ${data.stage}. Try: awareness, leads, nurture, sales, upsell, downsell, continuity`
        }
      }

      // Get week start (Monday)
      const weekStart = getWeekStart(new Date())

      // Check if record exists for this week
      const { data: existing } = await supabase
        .from('funnel_metrics')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single()

      let error
      if (existing) {
        // Update existing
        const result = await supabase
          .from('funnel_metrics')
          .update({ [field]: data.count, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        error = result.error
      } else {
        // Create new
        const result = await supabase.from('funnel_metrics').insert({
          user_id: userId,
          project_id: projectId,
          week_start: weekStart,
          mode: 'actual',
          [field]: data.count
        })
        error = result.error
      }

      return {
        success: !error,
        action: 'update_funnel',
        message: error
          ? 'Failed to update funnel'
          : `Updated ${field}: ${data.count}`
      }
    }

    case 'create_note': {
      // Store as a Zarlo conversation note
      const { error } = await supabase.from('zarlo_conversations').insert({
        user_id: userId,
        messages: [{
          role: 'user',
          content: `Voice note: ${data.content}`,
          timestamp: new Date().toISOString()
        }]
      })

      return {
        success: !error,
        action: 'create_note',
        message: error ? 'Failed to save note' : `Noted: "${data.content}"`
      }
    }

    case 'get_stats': {
      const stats = await getQuickStats(userId)
      return {
        success: true,
        action: 'get_stats',
        stats,
        message: `This week: ${stats.executionRate}% execution, ${stats.tasksCompleted}/${stats.totalTasks} tasks done, ${stats.streak}-day streak`
      }
    }

    default:
      return {
        success: false,
        action: 'unknown',
        message: 'Unknown command'
      }
  }
}

/**
 * Get suggested voice commands for help text
 */
export function getVoiceCommandSuggestions() {
  return [
    { command: 'Log a deal with [name] for [amount]', example: 'Log a deal with Sarah for $997' },
    { command: 'Complete [task]', example: 'Complete send launch email' },
    { command: 'Add task: [description]', example: 'Add task: Follow up with James' },
    { command: 'Update funnel: [number] [stage]', example: 'Update funnel: 50 leads' },
    { command: 'Note: [anything]', example: 'Note: Great call with potential partner' },
    { command: 'How am I doing?', example: 'How am I doing?' }
  ]
}
