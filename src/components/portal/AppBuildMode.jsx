/**
 * AppBuildMode.jsx — Health scanner + terminal + preview
 *
 * Desktop-only mode. Requires Express server running for:
 *   GET /api/health-scan?projectPath=...
 *   SSE /api/events for real-time updates
 *
 * Shows graceful "connect" state when server is not available.
 */

import { useState, useEffect, useCallback } from 'react'

const EXPRESS_PORT = typeof window !== 'undefined' && window.electronAPI?.expressPort

function apiUrl(path) {
  return EXPRESS_PORT ? `http://localhost:${EXPRESS_PORT}${path}` : null
}

export default function AppBuildMode() {
  const [projectPath, setProjectPath] = useState('')
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [previewPort, setPreviewPort] = useState(null)

  // Check if Express server is available
  useEffect(() => {
    if (!EXPRESS_PORT) return
    fetch(apiUrl('/api/health-scan?projectPath=test'), { signal: AbortSignal.timeout(2000) })
      .then(() => setConnected(true))
      .catch(() => setConnected(false))
  }, [])

  const scanProject = useCallback(async () => {
    if (!projectPath || !connected) return
    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/health-scan?projectPath=${encodeURIComponent(projectPath)}`))
      const data = await res.json()
      setChecks(data.checks || [])
    } catch (err) {
      console.warn('Health scan failed:', err.message)
    }
    setLoading(false)
  }, [projectPath, connected])

  const pickProject = useCallback(async () => {
    if (!connected) return
    try {
      const res = await fetch(apiUrl('/api/pick-folder'))
      const data = await res.json()
      if (data.path) {
        setProjectPath(data.path)
      }
    } catch (err) {
      console.warn('Folder picker failed:', err.message)
    }
  }, [connected])

  // Auto-scan when project changes
  useEffect(() => {
    if (projectPath && connected) scanProject()
  }, [projectPath, connected, scanProject])

  const sendFix = useCallback((fixPrompt) => {
    if (window.electronAPI?.runInTerminal) {
      window.electronAPI.runInTerminal(fixPrompt)
    } else {
      navigator.clipboard.writeText(fixPrompt)
    }
  }, [])

  if (!EXPRESS_PORT) {
    return (
      <div className="portal-empty">
        <div className="portal-empty-title">Desktop Required</div>
        <div className="portal-empty-desc">
          App Build mode requires the desktop app. Download it to scan projects, run terminals, and preview your work.
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="portal-empty">
        <div className="portal-empty-title">Connecting...</div>
        <div className="portal-empty-desc">Waiting for the local server. Make sure the desktop app is running.</div>
      </div>
    )
  }

  const failChecks = checks.filter(c => c.status === 'fail')
  const passCount = checks.filter(c => c.status === 'pass').length

  return (
    <div className="appbuild-container">
      {/* Project selector */}
      <div className="appbuild-project-bar">
        <button className="portal-mode-btn" onClick={pickProject}>Browse...</button>
        <input
          type="text"
          value={projectPath}
          onChange={e => setProjectPath(e.target.value)}
          placeholder="Enter project path..."
          className="appbuild-path-input"
          onKeyDown={e => e.key === 'Enter' && scanProject()}
        />
        <button className="task-action-btn" onClick={scanProject} disabled={loading || !projectPath}>
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {checks.length === 0 && !loading && projectPath && (
        <div className="portal-empty" style={{ minHeight: 120 }}>
          <div className="portal-empty-desc">No scan results yet. Click Scan to check project health.</div>
        </div>
      )}

      {/* Health results */}
      {checks.length > 0 && (
        <div className="appbuild-health">
          <div className="appbuild-health-header">
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              Project Health
            </span>
            <span style={{ fontSize: 12, color: failChecks.length > 0 ? '#eab308' : '#22c55e' }}>
              {failChecks.length > 0 ? `${failChecks.length} issues` : `${passCount} checks passed`}
            </span>
          </div>

          {failChecks.map(check => (
            <div key={check.id} className="appbuild-check-item">
              <div className="appbuild-check-dot" />
              <div className="appbuild-check-info">
                <div className="appbuild-check-label">{check.label}</div>
                {check.description && (
                  <div className="appbuild-check-desc">{check.description}</div>
                )}
              </div>
              {check.fixPrompt && (
                <button className="task-action-btn" onClick={() => sendFix(check.fixPrompt)}>
                  Fix →
                </button>
              )}
            </div>
          ))}

          {failChecks.length === 0 && (
            <div style={{ fontSize: 13, color: '#22c55e', padding: '12px 0' }}>
              ✓ All {passCount} checks passed
            </div>
          )}
        </div>
      )}

      {/* Preview section */}
      {previewPort ? (
        <div className="appbuild-preview">
          <div className="appbuild-preview-header">
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Preview — localhost:{previewPort}
            </span>
            <button className="task-action-btn" onClick={() => setPreviewPort(null)}>Close</button>
          </div>
          <iframe
            src={`http://localhost:${previewPort}`}
            className="appbuild-preview-frame"
            title="Preview"
          />
        </div>
      ) : projectPath && checks.length > 0 && (
        <div style={{ padding: '12px 0' }}>
          <button
            className="portal-mode-btn"
            onClick={() => {
              sendFix('Run the dev server for this project. Tell me the port when it starts.')
            }}
          >
            ▶ Start Preview
          </button>
        </div>
      )}
    </div>
  )
}
