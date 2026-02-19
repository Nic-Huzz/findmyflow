import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './AgentAccess.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function AgentAccess() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // API Key state
  const [apiKeys, setApiKeys] = useState([])
  const [apiKeysLoading, setApiKeysLoading] = useState(true)
  const [newKeyLabel, setNewKeyLabel] = useState('My Agent')
  const [generatedKey, setGeneratedKey] = useState(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [keyGenerating, setKeyGenerating] = useState(false)
  const [keyError, setKeyError] = useState(null)

  // Setup copy state
  const [setupCopied, setSetupCopied] = useState(false)
  const [stepCopied, setStepCopied] = useState(null)

  // Email state
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (user?.id) loadApiKeys()
  }, [user?.id])

  // --- API Key Management ---

  const loadApiKeys = async () => {
    if (!user?.id) return
    setApiKeysLoading(true)
    try {
      const { data, error } = await supabase
        .from('agent_api_keys')
        .select('id, key_prefix, label, created_at, last_used_at, is_active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setApiKeys(data || [])
    } catch (err) {
      console.error('Error loading API keys:', err)
    } finally {
      setApiKeysLoading(false)
    }
  }

  const generateApiKey = async () => {
    if (!user?.id || keyGenerating) return
    const activeKeys = apiKeys.filter(k => k.is_active)
    if (activeKeys.length >= 5) {
      setKeyError('Maximum 5 active API keys. Revoke an existing key first.')
      return
    }
    setKeyGenerating(true)
    setKeyError(null)
    try {
      const randomBytes = new Uint8Array(16)
      crypto.getRandomValues(randomBytes)
      const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
      const rawKey = `fmf_k1_${hex}`
      const keyPrefix = rawKey.substring(0, 12)
      const encoder = new TextEncoder()
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      const { error } = await supabase
        .from('agent_api_keys')
        .insert({ user_id: user.id, key_hash: keyHash, key_prefix: keyPrefix, label: newKeyLabel || 'My Agent' })
      if (error) {
        setKeyError('Failed to create API key. Please try again.')
        return
      }
      setGeneratedKey(rawKey)
      setNewKeyLabel('My Agent')
      loadApiKeys()
    } catch (err) {
      console.error('Error generating API key:', err)
      setKeyError('Failed to create API key. Please try again.')
    } finally {
      setKeyGenerating(false)
    }
  }

  const revokeApiKey = async (keyId) => {
    try {
      const { error } = await supabase
        .from('agent_api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', user.id)
      if (!error) loadApiKeys()
    } catch (err) {
      console.error('Error revoking API key:', err)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    }
  }

  const handleCopyKey = async () => {
    await copyToClipboard(generatedKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  // --- Setup Text ---

  const keyPlaceholder = generatedKey || 'PASTE_YOUR_KEY_HERE'

  const step1Text = `export FINDMYFLOW_API_KEY="${keyPlaceholder}"`

  const step2Text = `{
  "mcpServers": {
    "findmyflow": {
      "url": "${SUPABASE_URL}/functions/v1/mcp-server",
      "headers": {
        "Authorization": "Bearer \${FINDMYFLOW_API_KEY}"
      }
    }
  }
}`

  const step3Text = 'Restart Claude Code, then say: "Help me figure out my attraction offer"'

  const fullSetupText = `# 1. Add to your shell profile (~/.zshrc or ~/.bashrc):
${step1Text}

# 2. Save this as .mcp.json in your project or ~/.claude/:
${step2Text}

# 3. ${step3Text}`

  const handleCopyFullSetup = async () => {
    await copyToClipboard(fullSetupText)
    setSetupCopied(true)
    setTimeout(() => setSetupCopied(false), 2500)
  }

  const handleCopyStep = async (stepNum, text) => {
    await copyToClipboard(text)
    setStepCopied(stepNum)
    setTimeout(() => setStepCopied(null), 2000)
  }

  // --- Email ---

  const handleEmailInstructions = async () => {
    if (emailSending) return
    if (!user?.email) { alert('No email address on your account.'); return }
    setEmailSending(true)
    try {
      const activeKey = apiKeys.find(k => k.is_active)
      const keyPrefix = activeKey?.key_prefix || generatedKey?.substring(0, 12) || null

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-agent-instructions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ keyPrefix }),
      })

      if (!res.ok) throw new Error('Failed to send email')
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 5000)
    } catch (err) {
      console.error('Error sending instructions:', err)
      alert('Failed to send email. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  // --- Render ---

  const activeKeys = apiKeys.filter(k => k.is_active)
  const hasKeys = activeKeys.length > 0

  return (
    <div className="agent-access-container">
      <button className="agent-access-back" onClick={() => navigate('/profile-hub')}>
        ← Back
      </button>

      <h1 className="agent-access-title">Agent Access</h1>
      <p className="agent-access-subtitle">
        Connect AI agents to run assessments via API
      </p>

      {/* Section 1: Your API Key */}
      <section className="agent-section">
        <h2 className="agent-section-title">Your API Key</h2>

        {generatedKey && (
          <div className="agent-key-reveal">
            <div className="agent-key-reveal-header">
              Your new API key (shown once):
            </div>
            <div className="agent-key-reveal-value">
              <code>{generatedKey}</code>
              <button className="agent-key-copy-btn agent-key-copy-btn--big" onClick={handleCopyKey}>
                {keyCopied ? 'Copied!' : 'Copy Key'}
              </button>
            </div>
            <p className="agent-key-reveal-warning">
              Save this key now — you won't be able to see it again.
            </p>
            <button className="agent-key-dismiss-btn" onClick={() => setGeneratedKey(null)}>
              I've saved it
            </button>
          </div>
        )}

        {!generatedKey && (
          <div className="agent-key-generate">
            <input
              type="text"
              className="agent-key-label-input"
              placeholder="Key label (e.g. Claude Code)"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              maxLength={50}
            />
            <button
              className="agent-key-generate-btn"
              onClick={generateApiKey}
              disabled={keyGenerating}
            >
              {keyGenerating ? 'Generating...' : 'Generate API Key'}
            </button>
          </div>
        )}

        {keyError && <p className="agent-key-error">{keyError}</p>}

        {apiKeysLoading ? (
          <div className="agent-keys-loading">Loading keys...</div>
        ) : apiKeys.length > 0 ? (
          <div className="agent-keys-list">
            <div className="agent-keys-list-header">Your Keys</div>
            {apiKeys.map((key) => (
              <div key={key.id} className={`agent-key-row ${!key.is_active ? 'revoked' : ''}`}>
                <div className="agent-key-info">
                  <span className="agent-key-label">{key.label}</span>
                  <span className="agent-key-prefix">{key.key_prefix}····</span>
                  <span className="agent-key-meta">
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                  </span>
                </div>
                {key.is_active ? (
                  <button className="agent-key-revoke-btn" onClick={() => revokeApiKey(key.id)}>Revoke</button>
                ) : (
                  <span className="agent-key-revoked-badge">Revoked</span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Section 2: Quick Setup */}
      {(hasKeys || generatedKey || apiKeysLoading) && (
        <section className="agent-section">
          <h2 className="agent-section-title">Quick Setup</h2>

          <button className="agent-setup-copy-all" onClick={handleCopyFullSetup}>
            {setupCopied ? 'Copied!' : 'Copy Full Setup'}
          </button>

          <div className="agent-setup-steps">
            {/* Step 1 */}
            <div className="agent-setup-step">
              <div className="agent-setup-step-header">
                <span className="agent-setup-step-number">1</span>
                <span className="agent-setup-step-label">Add to your shell profile (~/.zshrc or ~/.bashrc)</span>
                <button
                  className="agent-setup-step-copy"
                  onClick={() => handleCopyStep(1, step1Text)}
                >
                  {stepCopied === 1 ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="agent-setup-code">{step1Text}</pre>
            </div>

            {/* Step 2 */}
            <div className="agent-setup-step">
              <div className="agent-setup-step-header">
                <span className="agent-setup-step-number">2</span>
                <span className="agent-setup-step-label">Save as .mcp.json in your project or ~/.claude/</span>
                <button
                  className="agent-setup-step-copy"
                  onClick={() => handleCopyStep(2, step2Text)}
                >
                  {stepCopied === 2 ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="agent-setup-code">{step2Text}</pre>
            </div>

            {/* Step 3 */}
            <div className="agent-setup-step">
              <div className="agent-setup-step-header">
                <span className="agent-setup-step-number">3</span>
                <span className="agent-setup-step-label">Try it out</span>
              </div>
              <p className="agent-setup-step-text">
                Restart Claude Code, then say: <strong>"Help me figure out my attraction offer"</strong>
              </p>
            </div>
          </div>

          <p className="agent-setup-guide-link">
            See <a href="/llms-full.txt" target="_blank" rel="noopener noreferrer">llms-full.txt</a> for the full agent guide.
          </p>
        </section>
      )}

      {/* Section 3: Email Me Instructions */}
      {(hasKeys || generatedKey || apiKeysLoading) && (
        <section className="agent-section">
          <h2 className="agent-section-title">Setting Up On Another Device?</h2>
          <p className="agent-section-description">
            Email yourself the setup instructions so you can configure your agent anywhere.
          </p>
          <button
            className="agent-email-btn"
            onClick={handleEmailInstructions}
            disabled={emailSending}
          >
            {emailSending ? 'Sending...' : emailSent ? `Sent to ${user?.email}` : 'Email Me Setup Instructions'}
          </button>
        </section>
      )}
    </div>
  )
}

export default AgentAccess
