/**
 * SetupWizard.jsx — One-time setup for AI Build Engine (desktop only)
 *
 * Detects Claude Code + Vercel CLI, installs missing tools with one click,
 * handles authentication. Shows as a modal when any ⚡ button is tapped
 * before setup is complete.
 *
 * Ported from claude-portal wizard pattern.
 */

import { useState, useEffect, useCallback } from 'react'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

const TOOL_INFO = {
  node: { icon: '🟢', desc: 'Runs everything. Bundled with the app.' },
  claude: { icon: '🤖', desc: 'Your AI builder. Writes code, builds pages, creates assets.' },
  vercel: { icon: '▲', desc: 'Deploys your pages to the web in seconds.' },
}

export default function SetupWizard({ onComplete, onClose }) {
  const [tools, setTools] = useState([])
  const [installing, setInstalling] = useState(false)
  const [installLog, setInstallLog] = useState([])
  const [authStep, setAuthStep] = useState(null) // 'claude' | 'vercel' | null
  const [loading, setLoading] = useState(true)

  // Detect tools on mount
  useEffect(() => {
    detectTools()
  }, [])

  async function detectTools() {
    setLoading(true)
    try {
      const res = await fetch('/api/detect')
      const data = await res.json()
      setTools(data.tools || [])

      // If all required tools are installed, check if already authenticated
      if (data.allReady) {
        checkComplete(data.tools)
      }
    } catch (err) {
      console.error('Tool detection failed:', err)
    }
    setLoading(false)
  }

  function checkComplete(toolList) {
    const allInstalled = toolList.filter(t => t.required).every(t => t.installed)
    if (allInstalled) {
      // Check if auth is done (stored in localStorage)
      const authDone = localStorage.getItem('vr_claude_auth_done')
      if (authDone) {
        localStorage.setItem('vr_build_engine_ready', 'true')
        onComplete?.()
      }
    }
  }

  async function handleInstallAll() {
    setInstalling(true)
    setInstallLog([])
    hapticLight()

    try {
      const res = await fetch('/api/install-all', { method: 'POST' })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              setInstallLog(prev => [...prev, event])

              if (event.status === 'complete') {
                hapticSuccess()
                // Re-detect after install
                await detectTools()
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setInstallLog(prev => [...prev, { status: 'error', error: err.message }])
    }

    setInstalling(false)
  }

  async function handleAuth(tool) {
    setAuthStep(tool)
    hapticLight()

    try {
      const endpoint = tool === 'claude' ? '/api/launch-auth' : '/api/launch-vercel-auth'
      await fetch(endpoint, { method: 'POST' })

      // Show "check your browser" message for 3 seconds, then mark as done
      setTimeout(() => {
        if (tool === 'claude') {
          localStorage.setItem('vr_claude_auth_done', 'true')
        }
        setAuthStep(null)
        detectTools()
      }, 5000)
    } catch (err) {
      console.error(`${tool} auth failed:`, err)
      setAuthStep(null)
    }
  }

  function handleSkipVercel() {
    // Vercel is optional — can deploy later
    localStorage.setItem('vr_build_engine_ready', 'true')
    hapticSuccess()
    onComplete?.()
  }

  const allRequiredInstalled = tools.filter(t => t.required).every(t => t.installed)
  const claudeInstalled = tools.find(t => t.id === 'claude')?.installed
  const vercelInstalled = tools.find(t => t.id === 'vercel')?.installed
  const claudeAuthDone = localStorage.getItem('vr_claude_auth_done')

  // Determine current step
  let currentStep = 'detect'
  if (!loading && !allRequiredInstalled) currentStep = 'install'
  else if (allRequiredInstalled && !claudeAuthDone) currentStep = 'auth'
  else if (allRequiredInstalled && claudeAuthDone) currentStep = 'ready'

  return (
    <div className="ips-overlay" onClick={onClose}>
      <div className="ips-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="ips-header">
          <div>
            <div className="ips-title">Set Up Your Build Engine ⚡</div>
            <div className="ips-summary" style={{ color: 'rgba(255,255,255,0.3)' }}>
              One-time setup. Takes about 3 minutes.
            </div>
          </div>
          <button className="ips-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {/* Tool Status */}
          {tools.map(tool => {
            const info = TOOL_INFO[tool.id] || {}
            return (
              <div key={tool.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 20, width: 32, textAlign: 'center' }}>
                  {info.icon || '📦'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {tool.name}
                    {!tool.required && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 6 }}>optional</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {info.desc}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {tool.installed ? (
                    <div>
                      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Installed</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{tool.version}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'rgba(239, 68, 68, 0.7)' }}>Not installed</div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Install Log */}
          {installLog.length > 0 && (
            <div style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              background: 'rgba(0,0,0,0.3)',
              maxHeight: 120,
              overflowY: 'auto',
              fontSize: 10,
              fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.4)',
            }}>
              {installLog.map((log, i) => (
                <div key={i} style={{
                  color: log.status === 'error' ? '#ef4444'
                    : log.status === 'done' ? '#10b981'
                    : 'rgba(255,255,255,0.4)'
                }}>
                  {log.message || log.error || `${log.tool}: ${log.status}`}
                </div>
              ))}
            </div>
          )}

          {/* Actions based on step */}
          <div style={{ marginTop: 16 }}>
            {currentStep === 'install' && (
              <button
                className="ips-done"
                onClick={handleInstallAll}
                disabled={installing}
              >
                {installing ? 'Installing...' : 'Install Missing Tools'}
              </button>
            )}

            {currentStep === 'auth' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!claudeAuthDone && (
                  <button
                    className="ips-done"
                    onClick={() => handleAuth('claude')}
                    disabled={authStep === 'claude'}
                  >
                    {authStep === 'claude' ? 'Check your browser...' : 'Authenticate Claude Code'}
                  </button>
                )}
                {claudeAuthDone && !vercelInstalled && (
                  <button
                    className="ips-done"
                    style={{ background: 'rgba(94,23,235,0.3)' }}
                    onClick={handleSkipVercel}
                  >
                    Skip Vercel (can set up later)
                  </button>
                )}
                {claudeAuthDone && vercelInstalled && (
                  <button
                    className="ips-done"
                    onClick={() => handleAuth('vercel')}
                    disabled={authStep === 'vercel'}
                  >
                    {authStep === 'vercel' ? 'Check your browser...' : 'Login to Vercel'}
                  </button>
                )}
              </div>
            )}

            {currentStep === 'ready' && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginBottom: 4 }}>
                  Build Engine Ready
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
                  You can now use AI to build lead magnets, landing pages, and content.
                </div>
                <button className="ips-done" onClick={() => {
                  localStorage.setItem('vr_build_engine_ready', 'true')
                  hapticSuccess()
                  onComplete?.()
                }}>
                  Let's Go
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to check if Build Engine is ready.
 * Returns { isReady, isElectron, showSetup() }
 */
export function useBuildEngine() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron
  const [isReady, setIsReady] = useState(() =>
    isElectron && localStorage.getItem('vr_build_engine_ready') === 'true'
  )
  const [showWizard, setShowWizard] = useState(false)

  const requestBuild = useCallback(() => {
    if (!isElectron) return false
    if (isReady) return true
    setShowWizard(true)
    return false
  }, [isElectron, isReady])

  const handleComplete = useCallback(() => {
    setIsReady(true)
    setShowWizard(false)
  }, [])

  return {
    isElectron,
    isReady,
    showWizard,
    requestBuild,
    handleComplete,
    closeWizard: () => setShowWizard(false),
  }
}
