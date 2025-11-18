# Anthropic API Setup Guide

This project uses Anthropic's Claude API via secure serverless functions to keep your API key safe.

## 🔒 Security Architecture

```
Browser (Frontend)
    ↓
    | Calls /api/chat (no API key exposed)
    ↓
Vercel Serverless Function
    ↓
    | Uses ANTHROPIC_API_KEY from env vars
    ↓
Anthropic API
```

## 📁 Files Created

1. **`/api/chat.js`** - Serverless function that proxies requests to Anthropic API
2. **`/src/lib/anthropicClient.js`** - Frontend client to call the serverless function
3. **`.env.local`** - Local environment variables (git-ignored)

## 🚀 Setup Instructions

### Local Development

1. **Get your API key** from [Anthropic Console](https://console.anthropic.com/settings/keys)

2. **Update `.env.local`** with your actual API key:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ```

3. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

4. **Test locally**:
   ```bash
   vercel dev
   ```
   This will run your serverless functions locally at `http://localhost:3000`

### Production Deployment (Vercel)

1. **Add environment variable in Vercel**:
   - Go to your project settings: https://vercel.com/dashboard
   - Navigate to Settings → Environment Variables
   - Add:
     - Name: `ANTHROPIC_API_KEY`
     - Value: `sk-ant-api03-xxxxx` (your actual key)
     - ⚠️ **DO NOT** prefix with `VITE_`
     - Select all environments (Production, Preview, Development)

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add Anthropic API integration"
   git push
   ```

## 💻 Usage Examples

### Basic Usage

```javascript
import { getTextResponse } from './lib/anthropicClient'

// Simple text response
const response = await getTextResponse('What is the meaning of life?')
console.log(response)
```

### Advanced Usage

```javascript
import { sendMessage } from './lib/anthropicClient'

// Multi-turn conversation
const messages = [
  { role: 'user', content: 'Hello, Claude!' },
  { role: 'assistant', content: 'Hello! How can I help you today?' },
  { role: 'user', content: 'Tell me about archetypes' }
]

const response = await sendMessage(messages, {
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 2048
})

console.log(response.content[0].text)
```

### In a React Component

```javascript
import { useState } from 'react'
import { getTextResponse } from './lib/anthropicClient'

function ChatComponent() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const askClaude = async () => {
    setLoading(true)
    try {
      const result = await getTextResponse('Explain essence archetypes')
      setResponse(result)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={askClaude} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask Claude'}
      </button>
      {response && <p>{response}</p>}
    </div>
  )
}
```

## 🔧 Troubleshooting

### Error: "API key not configured"
- Make sure `ANTHROPIC_API_KEY` is set in `.env.local` (local) or Vercel settings (production)
- Restart your dev server after adding environment variables

### Error: "Method not allowed"
- The `/api/chat` endpoint only accepts POST requests
- Check your frontend is sending a POST request

### Error: "Anthropic API request failed"
- Check your API key is valid
- Verify you have credits in your Anthropic account
- Check the console for detailed error messages

## 📊 API Limits & Costs

- Model: `claude-3-5-sonnet-20241022`
- Rate limits: Check [Anthropic docs](https://docs.anthropic.com/en/api/rate-limits)
- Pricing: ~$3 per million input tokens, ~$15 per million output tokens
- Monitor usage: [Anthropic Console](https://console.anthropic.com/settings/usage)

## 🔐 Security Best Practices

✅ **DO:**
- Keep API keys in environment variables
- Use serverless functions for API calls
- Add error handling
- Monitor API usage

❌ **DON'T:**
- Expose API keys in frontend code
- Use `VITE_` prefix for API keys
- Commit `.env.local` to git
- Share API keys publicly

## 📚 Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Models](https://docs.anthropic.com/en/docs/models-overview)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
