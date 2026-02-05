/**
 * Error Support Utility
 *
 * Logs errors to database and provides WhatsApp support link
 * Usage:
 *   const { offerSupport } = await logError({
 *     error,
 *     component: 'QuickCapture',
 *     action: 'save_products',
 *     userId: user?.id,
 *     userEmail: user?.email
 *   })
 *
 *   if (userWantsHelp) {
 *     offerSupport() // Opens WhatsApp
 *   }
 */

import { supabase } from './supabaseClient'

// Nic's WhatsApp for support
const SUPPORT_WHATSAPP = '61423220241'

/**
 * Log an error to the database and return a support helper
 */
export const logError = async ({
  error,
  component,
  action = null,
  userId = null,
  userEmail = null,
  metadata = {}
}) => {
  // Extract error details
  const errorCode = error?.code || error?.status || null
  const errorMessage = error?.message || error?.toString() || 'Unknown error'
  const errorType = categorizeError(error)

  // Get page URL
  const pageUrl = typeof window !== 'undefined' ? window.location.href : null

  // Log to database (fire and forget - don't block on this)
  let errorLogId = null
  try {
    const { data } = await supabase
      .from('error_logs')
      .insert({
        user_id: userId,
        user_email: userEmail,
        error_type: errorType,
        error_code: errorCode,
        error_message: errorMessage,
        component,
        action,
        page_url: pageUrl,
        metadata,
        support_requested: false
      })
      .select('id')
      .single()

    errorLogId = data?.id
  } catch (logError) {
    // Don't fail if logging fails - just console log
    console.error('Failed to log error to database:', logError)
  }

  // Return helper function to open WhatsApp support
  const offerSupport = () => {
    // Mark as support requested
    if (errorLogId) {
      supabase
        .from('error_logs')
        .update({ support_requested: true })
        .eq('id', errorLogId)
        .then(() => {})
        .catch(() => {})
    }

    // Build WhatsApp message
    const message = buildSupportMessage({
      component,
      action,
      errorMessage,
      errorCode,
      errorLogId,
      userEmail
    })

    const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return {
    errorLogId,
    offerSupport,
    errorType,
    errorMessage
  }
}

/**
 * Categorize error for easier filtering
 */
const categorizeError = (error) => {
  const code = error?.code
  const message = error?.message?.toLowerCase() || ''

  if (code === '23505') return 'duplicate_entry'
  if (code === '23503') return 'foreign_key_violation'
  if (code === '23502') return 'null_violation'
  if (code === '42501') return 'permission_denied'
  if (code === 'PGRST301') return 'row_not_found'
  if (message.includes('network') || message.includes('fetch')) return 'network_error'
  if (message.includes('timeout')) return 'timeout'
  if (message.includes('jwt') || message.includes('auth')) return 'auth_error'

  return 'unknown'
}

/**
 * Build a helpful support message for WhatsApp
 */
const buildSupportMessage = ({
  component,
  action,
  errorMessage,
  errorCode,
  errorLogId,
  userEmail
}) => {
  const lines = [
    `Hi Nic! I need help with FindMyFlow.`,
    ``,
    `*Error in:* ${component}${action ? ` (${action})` : ''}`,
    `*What happened:* ${errorMessage}`,
  ]

  if (errorCode) {
    lines.push(`*Error code:* ${errorCode}`)
  }

  if (errorLogId) {
    lines.push(`*Log ID:* ${errorLogId}`)
  }

  if (userEmail) {
    lines.push(`*My email:* ${userEmail}`)
  }

  lines.push(``, `Can you help me fix this?`)

  return lines.join('\n')
}

/**
 * Show error dialog with support option
 * Returns true if user wants to retry, false otherwise
 */
export const showErrorWithSupport = async ({
  error,
  component,
  action,
  userId,
  userEmail,
  metadata = {},
  title = 'Something went wrong',
  retryLabel = 'Try Again',
  canRetry = true
}) => {
  // Log the error first
  const { offerSupport, errorMessage: _errorMessage } = await logError({
    error,
    component,
    action,
    userId,
    userEmail,
    metadata
  })

  // Build message
  let message = `${title}\n\n${getHelpfulMessage(error)}`

  if (canRetry) {
    message += `\n\nClick OK to ${retryLabel.toLowerCase()}, or Cancel to get help via WhatsApp.`
  } else {
    message += `\n\nClick OK to continue, or Cancel to get help via WhatsApp.`
  }

  const retry = window.confirm(message)

  if (!retry) {
    // User clicked Cancel - open WhatsApp
    offerSupport()
  }

  return retry
}

/**
 * Get a user-friendly message based on error type
 */
const getHelpfulMessage = (error) => {
  const code = error?.code
  const message = error?.message?.toLowerCase() || ''

  if (code === '23505') {
    return 'This item already exists. Try using a different name.'
  }

  if (code === '23503') {
    return 'A required item was not found. Please go back and try again.'
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return 'Network connection issue. Please check your internet and try again.'
  }

  if (message.includes('timeout')) {
    return 'The request took too long. Please try again.'
  }

  if (code === '42501' || message.includes('permission')) {
    return 'You don\'t have permission for this action. Try logging out and back in.'
  }

  return 'Your data should be safe. Please try again or contact support.'
}

/**
 * Open WhatsApp with error details (simpler version for quick use)
 * Use this when you already have error info and just want to open WhatsApp
 */
export const openWhatsAppSupport = ({
  component = 'Unknown',
  action = null,
  errorMessage = 'Unknown error',
  errorCode = null,
  errorStack = null
}) => {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : 'Unknown'

  const lines = [
    `Hey! Something isn't working properly...`,
    ``,
    `*Page:* ${pageUrl}`,
    `*Component:* ${component}${action ? ` (${action})` : ''}`,
    `*Error:* ${errorMessage}`,
  ]

  if (errorCode) {
    lines.push(`*Code:* ${errorCode}`)
  }

  if (errorStack) {
    // Truncate stack to avoid hitting URL limits
    const truncatedStack = errorStack.substring(0, 500)
    lines.push(``, `*Stack:* ${truncatedStack}${errorStack.length > 500 ? '...' : ''}`)
  }

  const message = lines.join('\n')
  const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

export default {
  logError,
  showErrorWithSupport,
  openWhatsAppSupport
}
