/**
 * Vercel Serverless Function - Anthropic API Proxy
 *
 * This endpoint securely calls the Anthropic API server-side,
 * keeping your API key hidden from the browser.
 *
 * Endpoint: /api/chat
 * Method: POST
 * Auth: Required (Bearer token in Authorization header)
 *
 * Request body:
 * {
 *   "messages": [{ "role": "user", "content": "Hello!" }],
 *   "model": "claude-3-5-sonnet-20241022", // optional
 *   "max_tokens": 1024 // optional
 * }
 */

import { createClient } from '@supabase/supabase-js'

// Simple in-memory rate limiter
// For production with multiple serverless instances, use Redis/Upstash
const rateLimitStore = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20 // 20 requests per minute per user

function checkRateLimit(userId) {
  const now = Date.now()
  const userKey = `user:${userId}`

  if (!rateLimitStore.has(userKey)) {
    rateLimitStore.set(userKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 }
  }

  const record = rateLimitStore.get(userKey)

  // Reset if window expired
  if (now > record.resetAt) {
    rateLimitStore.set(userKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 }
  }

  // Increment count
  record.count++

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count }
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. Authentication Check
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Bearer token required' })
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify token with Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // 2. Rate Limiting Check
    const rateLimit = checkRateLimit(user.id)

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString())
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString())

    if (!rateLimit.allowed) {
      res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString())
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again after ${new Date(rateLimit.resetAt).toISOString()}`,
        resetAt: rateLimit.resetAt
      })
    }

    // 3. Input Validation
    const { messages, model = 'claude-3-haiku-20240307', max_tokens = 1024, system } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    // Validate message content length (prevent abuse)
    const totalContentLength = messages.reduce((sum, msg) => {
      return sum + (msg.content?.length || 0)
    }, 0)

    if (totalContentLength > 50000) { // ~50KB limit
      return res.status(400).json({
        error: 'Request too large',
        message: 'Total message content exceeds maximum length (50,000 characters)'
      })
    }

    // Validate max_tokens to prevent cost abuse
    if (max_tokens > 4096) {
      return res.status(400).json({
        error: 'Invalid max_tokens',
        message: 'max_tokens cannot exceed 4096'
      })
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
