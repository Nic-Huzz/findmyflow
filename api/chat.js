/**
 * Vercel Serverless Function - Anthropic API Proxy
 *
 * This endpoint securely calls the Anthropic API server-side,
 * keeping your API key hidden from the browser.
 *
 * Endpoint: /api/chat
 * Method: POST
 *
 * Request body:
 * {
 *   "messages": [{ "role": "user", "content": "Hello!" }],
 *   "model": "claude-3-5-sonnet-20241022", // optional
 *   "max_tokens": 1024 // optional
 * }
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, model = 'claude-3-5-sonnet-20241022', max_tokens = 1024, system } = req.body

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    // Get API key from environment variable (server-side only)
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured')
      return res.status(500).json({ error: 'API key not configured' })
    }

    // Build request body
    const requestBody = {
      model,
      max_tokens,
      messages
    }

    // Only add system prompt if provided
    if (system) {
      requestBody.system = system
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Anthropic API error:', error)
      return res.status(response.status).json({
        error: 'Anthropic API request failed',
        details: error
      })
    }

    const data = await response.json()

    // Return the response to the client
    return res.status(200).json(data)

  } catch (error) {
    console.error('Error in chat endpoint:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
