/**
 * Anthropic API Client
 *
 * Calls the secure serverless function instead of the Anthropic API directly.
 * This keeps your API key safe on the server.
 */

/**
 * Send a message to Claude via the serverless function
 *
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - Claude's response
 */
export async function sendMessage(messages, options = {}) {
  const {
    model = 'claude-3-5-sonnet-20241022',
    max_tokens = 1024,
    system = undefined,
  } = options

  try {
    const requestBody = {
      messages,
      model,
      max_tokens,
    }

    // Only add system prompt if provided
    if (system) {
      requestBody.system = system
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get response from Claude')
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Error calling Claude:', error)
    throw error
  }
}

/**
 * Simple helper to get a text response from Claude
 *
 * @param {string} userMessage - The user's message
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} - Claude's text response
 */
export async function getTextResponse(userMessage, options = {}) {
  const messages = [
    {
      role: 'user',
      content: userMessage,
    },
  ]

  const response = await sendMessage(messages, options)

  // Extract the text content from the response
  if (response.content && response.content[0]?.text) {
    return response.content[0].text
  }

  throw new Error('Unexpected response format from Claude')
}

/**
 * Stream a response from Claude (for longer responses)
 *
 * Note: Streaming requires additional setup in the serverless function
 * This is a placeholder for future implementation
 */
export async function streamMessage(messages, onChunk, options = {}) {
  // TODO: Implement streaming when needed
  console.warn('Streaming not yet implemented, falling back to regular request')
  return await sendMessage(messages, options)
}
