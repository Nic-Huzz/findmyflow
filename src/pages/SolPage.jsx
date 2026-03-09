import { useState, useEffect } from 'react'
import useSolData from '../hooks/useSolData'
import './SolPage.css'

const PROVISION_MESSAGES = [
  "Creating Sol's workspace...",
  "Loading your CRM data...",
  "Connecting to Telegram...",
  "Sol is waking up..."
]

export default function SolPage() {
  const { loading, instance, founderProfile, provisionSol, manageSol, refresh } = useSolData()

  if (loading) {
    return (
      <div className="sol-page">
        <div className="sol-loading">
          <div className="sol-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const status = instance?.status

  if (status === 'provisioning') return <ProvisioningView refresh={refresh} />
  if (status === 'active' || status === 'paused') return <DashboardView instance={instance} manageSol={manageSol} />
  if (status === 'error') return <ErrorView instance={instance} provisionSol={provisionSol} founderProfile={founderProfile} />

  // null, terminated, or no instance → onboarding
  return <OnboardingView founderProfile={founderProfile} provisionSol={provisionSol} />
}

function OnboardingView({ founderProfile, provisionSol }) {
  const [apiKey, setApiKey] = useState('')
  const [botToken, setBotToken] = useState('')
  const [telegramUserId, setTelegramUserId] = useState('')
  const [launching, setLaunching] = useState(false)
  const [launchError, setLaunchError] = useState(null)

  const apiKeyValid = /^sk-ant-/.test(apiKey) && apiKey.length > 20
  const botTokenValid = /^\d+:[A-Za-z0-9_-]+$/.test(botToken)
  const userIdValid = /^\d{5,}$/.test(telegramUserId)
  const sectionBUnlocked = apiKeyValid
  const sectionCUnlocked = apiKeyValid && botTokenValid && userIdValid

  const handleLaunch = async () => {
    setLaunching(true)
    setLaunchError(null)
    const { error } = await provisionSol({
      anthropic_token: apiKey,
      telegram_bot_token: botToken,
      telegram_user_id: telegramUserId
    })
    if (error) {
      setLaunchError(error)
      setLaunching(false)
    }
    // On success, useSolData refreshes and parent re-renders to provisioning view
  }

  return (
    <div className="sol-page">
      <div className="hero">
        <h1 className="hero-title">Meet Sol</h1>
        <p className="hero-subtitle">
          Your AI co-founder. Sol handles your business ops via Telegram
          so you can focus on your craft.
        </p>
      </div>

      {/* Section A: API Key */}
      <div className="card onboard-section unlocked">
        <h3 className="card-title">
          <span className={`section-number ${apiKeyValid ? 'done' : ''}`}>
            {apiKeyValid ? '✓' : '1'}
          </span>
          Connect Your AI Brain
        </h3>
        <div className="input-group">
          <label>Anthropic API Key</label>
          <p className="helper">
            Create one at{' '}
            <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" className="external-link">
              console.anthropic.com
            </a>
            {' '}— typically $5-20/mo based on usage.
          </p>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={apiKey ? (apiKeyValid ? 'valid' : 'invalid') : ''}
          />
          {apiKeyValid && <span className="input-check">✓</span>}
        </div>
      </div>

      {/* Section B: Telegram Bot */}
      <div className={`card onboard-section ${sectionBUnlocked ? 'unlocked' : 'locked'}`}>
        <h3 className="card-title">
          <span className={`section-number ${botTokenValid && userIdValid ? 'done' : ''}`}>
            {botTokenValid && userIdValid ? '✓' : '2'}
          </span>
          Create Your Sol on Telegram
        </h3>
        <ol className="walkthrough">
          <li>
            <span className="step-num">1</span>
            <span>Open Telegram and search for <code>@BotFather</code></span>
          </li>
          <li>
            <span className="step-num">2</span>
            <span>Send <code>/newbot</code> and follow the prompts</span>
          </li>
          <li>
            <span className="step-num">3</span>
            <span>Name it something like <strong>"{founderProfile?.name}'s Sol"</strong></span>
          </li>
          <li>
            <span className="step-num">4</span>
            <span>Copy the bot token and paste it below</span>
          </li>
        </ol>
        <div className="input-group">
          <label>Bot Token</label>
          <input
            type="text"
            placeholder="123456789:ABCdef..."
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className={botToken ? (botTokenValid ? 'valid' : 'invalid') : ''}
          />
          {botTokenValid && <span className="input-check">✓</span>}
        </div>
        <div className="input-group">
          <label>Your Telegram User ID</label>
          <p className="helper">
            Send <code>/start</code> to <code>@userinfobot</code> on Telegram to get your ID.
          </p>
          <input
            type="text"
            placeholder="123456789"
            value={telegramUserId}
            onChange={(e) => setTelegramUserId(e.target.value)}
            className={telegramUserId ? (userIdValid ? 'valid' : 'invalid') : ''}
          />
          {userIdValid && <span className="input-check">✓</span>}
        </div>
      </div>

      {/* Section C: Launch */}
      <div className={`card onboard-section ${sectionCUnlocked ? 'unlocked' : 'locked'}`}>
        <h3 className="card-title">
          <span className="section-number">3</span>
          Launch Sol
        </h3>
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
          Sol will connect to your CRM and start managing your pipeline.
        </p>
        <ul style={{ fontSize: '14px', color: '#6b7280', padding: '0 0 0 20px', marginBottom: '16px' }}>
          <li>Daily lead summaries at 7am</li>
          <li>Deal follow-up reminders at 8am</li>
          <li>Weekly funnel sync on Sundays</li>
        </ul>
        {launchError && <p className="error-message">{launchError}</p>}
        <button
          className="btn-gold"
          onClick={handleLaunch}
          disabled={!sectionCUnlocked || launching}
        >
          {launching ? 'Launching...' : 'Launch Sol'}
        </button>
      </div>
    </div>
  )
}

function ProvisioningView({ refresh }) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % PROVISION_MESSAGES.length)
    }, 4000)
    const elapsedTimer = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)

    // Auto-poll every 10s starting at 20s — catches the cloud-init callback
    const pollTimer = setInterval(() => {
      refresh()
    }, 10000)

    return () => { clearInterval(msgTimer); clearInterval(elapsedTimer); clearInterval(pollTimer) }
  }, [refresh])

  return (
    <div className="sol-page">
      <div className="provisioning">
        <div className="prov-spinner" />
        <p className="prov-status" key={msgIndex}>{PROVISION_MESSAGES[msgIndex]}</p>
        {elapsed >= 10 && elapsed < 120 && <p className="prov-hint">This usually takes about 30 seconds</p>}
        {elapsed >= 120 && (
          <p className="prov-hint">Taking longer than expected. Check your Telegram — Sol may already be live.</p>
        )}
        {elapsed >= 45 && (
          <button className="btn-gold" onClick={refresh} style={{ maxWidth: '240px' }}>
            Check Status
          </button>
        )}
      </div>
    </div>
  )
}

function DashboardView({ instance, manageSol }) {
  const [actionLoading, setActionLoading] = useState(false)
  const [showTerminate, setShowTerminate] = useState(false)
  const isActive = instance.status === 'active'
  const isPaused = instance.status === 'paused'

  const handleAction = async (action) => {
    setActionLoading(true)
    await manageSol(action)
    setActionLoading(false)
  }

  const activeSince = instance.activated_at
    ? new Date(instance.activated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const pausedAt = instance.paused_at
    ? new Date(instance.paused_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="sol-page">
      <div className="hero">
        <h1 className="hero-title">Sol</h1>
        <div className="hero-status">
          <span className={`status-dot ${isActive ? 'active' : 'paused'}`} />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            {isActive ? 'Active' : 'Paused'}
          </span>
        </div>
        {isActive && activeSince && <p className="hero-meta">Live since {activeSince}</p>}
        {isPaused && pausedAt && <p className="hero-meta">Paused on {pausedAt}</p>}
      </div>

      {/* Telegram Card */}
      <div className="card">
        <h3 className="card-title">Telegram</h3>
        {instance.telegram_bot_username && (
          <a
            href={`https://t.me/${instance.telegram_bot_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-purple"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            Open in Telegram
          </a>
        )}
      </div>

      {/* Schedule Card */}
      <div className="card">
        <h3 className="card-title">Schedule</h3>
        <div className="schedule-item">
          <span className="schedule-label">Daily leads summary</span>
          <span className="schedule-time">7:00 AM</span>
        </div>
        <div className="schedule-item">
          <span className="schedule-label">Deal follow-up reminders</span>
          <span className="schedule-time">8:00 AM</span>
        </div>
        <div className="schedule-item">
          <span className="schedule-label">Weekly funnel sync</span>
          <span className="schedule-time">Sun 6:00 AM</span>
        </div>
      </div>

      {/* Controls Card */}
      <div className="card">
        <h3 className="card-title">Controls</h3>
        {isActive && (
          <button
            className="btn-ghost"
            onClick={() => handleAction('pause')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Pausing...' : 'Pause Sol'}
          </button>
        )}
        {isPaused && (
          <button
            className="btn-gold"
            onClick={() => handleAction('resume')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Resuming...' : 'Resume Sol'}
          </button>
        )}
        <button
          className="btn-ghost"
          onClick={() => setShowTerminate(true)}
          style={{ marginTop: '12px', color: '#ef4444', borderColor: '#fecaca' }}
        >
          Shut Down Sol
        </button>
      </div>

      {showTerminate && (
        <TerminateModal
          manageSol={manageSol}
          onClose={() => setShowTerminate(false)}
        />
      )}
    </div>
  )
}

function TerminateModal({ manageSol, onClose }) {
  const [step, setStep] = useState('confirm') // confirm | github | backing-up | terminating | done
  const [ghToken, setGhToken] = useState('')
  const [error, setError] = useState(null)

  const handleSkipAndTerminate = async () => {
    setStep('terminating')
    const { error: err } = await manageSol('terminate')
    if (err) { setError(err); setStep('confirm'); return }
    setStep('done')
  }

  const handleBackupAndTerminate = async () => {
    if (!ghToken.startsWith('ghp_') && !ghToken.startsWith('github_pat_')) {
      setError('Enter a valid GitHub personal access token (starts with ghp_ or github_pat_)')
      return
    }
    setError(null)
    setStep('backing-up')

    try {
      // 1. Export Sol data from edge function
      const { data: exportData, error: exportErr } = await manageSol('export')
      if (exportErr) throw new Error(exportErr)

      const solData = exportData?.data || {}
      const repoName = 'my-sol-backup'
      const now = new Date().toISOString()

      // 2. Create private GitHub repo
      const ghHeaders = {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      }

      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          name: repoName,
          description: 'Sol AI Co-Founder backup — exported from FindMyFlow',
          private: true,
          auto_init: true,
        }),
      })

      if (!createRes.ok) {
        const createData = await createRes.json()
        // 422 = repo already exists, that's fine
        if (createRes.status !== 422) throw new Error(createData.message || 'Failed to create repo')
      }

      // Get authenticated user for repo path
      const userRes = await fetch('https://api.github.com/user', { headers: ghHeaders })
      const ghUser = await userRes.json()
      const owner = ghUser.login

      // 3. Push files via GitHub Contents API
      const filesToPush = [
        {
          path: 'SOUL.md',
          content: solData.soul_md || '# No SOUL.md found',
        },
        {
          path: 'sol-config.json',
          content: JSON.stringify(solData.config || {}, null, 2),
        },
        {
          path: 'README.md',
          content: `# Sol Backup\n\nExported from FindMyFlow on ${now}.\n\nThis repo contains your Sol AI co-founder's configuration and personality.\nYou can use this to restore Sol or as a reference for your business journey.\n`,
        },
      ]

      for (const file of filesToPush) {
        // Check if file exists (for updates)
        let sha
        try {
          const existing = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
            { headers: ghHeaders }
          )
          if (existing.ok) {
            const existingData = await existing.json()
            sha = existingData.sha
          }
        } catch { /* file doesn't exist, that's fine */ }

        await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
          {
            method: 'PUT',
            headers: ghHeaders,
            body: JSON.stringify({
              message: `Sol backup — ${now}`,
              content: btoa(unescape(encodeURIComponent(file.content))),
              ...(sha ? { sha } : {}),
            }),
          }
        )
      }

      // 4. Backup complete — now terminate
      setStep('terminating')
      const { error: termErr } = await manageSol('terminate')
      if (termErr) throw new Error(termErr)

      setStep('done')
    } catch (err) {
      setError(err.message)
      setStep('github')
    }
  }

  return (
    <div className="sol-terminate-overlay" onClick={onClose}>
      <div className="sol-terminate-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sol-terminate-close" onClick={onClose}>&times;</button>

        {step === 'confirm' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#1a1a2e' }}>
              Shut Down Sol?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5 }}>
              This will permanently delete Sol's server. Your CRM data in FindMyFlow is safe —
              only Sol's personality and config will be lost unless you back up.
            </p>
            <button className="btn-gold" onClick={() => setStep('github')} style={{ marginBottom: '10px' }}>
              Save to GitHub First
            </button>
            <button
              className="btn-ghost"
              onClick={handleSkipAndTerminate}
              style={{ color: '#ef4444', borderColor: '#fecaca' }}
            >
              Skip & Shut Down
            </button>
          </>
        )}

        {step === 'github' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#1a1a2e' }}>
              Save to GitHub
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
              We'll create a private repo called <strong>my-sol-backup</strong> with your Sol's
              personality and config.
            </p>
            <div className="input-group">
              <label>GitHub Personal Access Token</label>
              <p className="helper">
                Create one at{' '}
                <a href="https://github.com/settings/tokens/new?scopes=repo&description=Sol+Backup" target="_blank" rel="noopener noreferrer" className="external-link">
                  github.com/settings/tokens
                </a>
                {' '}— needs "repo" scope.
              </p>
              <input
                type="password"
                placeholder="ghp_..."
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                className={ghToken ? ((ghToken.startsWith('ghp_') || ghToken.startsWith('github_pat_')) ? 'valid' : 'invalid') : ''}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button
              className="btn-gold"
              onClick={handleBackupAndTerminate}
              disabled={!ghToken}
              style={{ marginBottom: '10px' }}
            >
              Back Up & Shut Down
            </button>
            <button className="btn-ghost" onClick={() => setStep('confirm')}>
              Back
            </button>
          </>
        )}

        {step === 'backing-up' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="sol-spinner" />
            <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', color: '#1a1a2e' }}>
              Saving to GitHub...
            </p>
          </div>
        )}

        {step === 'terminating' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="sol-spinner" />
            <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '16px', color: '#1a1a2e' }}>
              Shutting down Sol...
            </p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '28px', marginBottom: '12px' }}>&#10003;</p>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: '#1a1a2e' }}>
              Sol has been shut down
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.5 }}>
              {ghToken ? 'Your data has been saved to GitHub.' : 'Your CRM data is still safe in FindMyFlow.'}
              {' '}You can re-launch Sol anytime.
            </p>
            <a href="/sol" className="btn-purple" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Done
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorView({ instance, provisionSol, founderProfile }) {
  const [retrying, setRetrying] = useState(false)

  if (retrying) {
    return <OnboardingView founderProfile={founderProfile} provisionSol={provisionSol} />
  }

  return (
    <div className="sol-page">
      <div className="hero">
        <h1 className="hero-title">Sol</h1>
        <div className="hero-status">
          <span className="status-dot error" />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Error</span>
        </div>
      </div>
      <div className="card error-card">
        <h3 className="card-title">Something went wrong</h3>
        <p className="error-message">{instance.error_message || 'Unknown error during provisioning.'}</p>
        <button className="btn-gold" onClick={() => setRetrying(true)}>
          Try Again
        </button>
      </div>
    </div>
  )
}
