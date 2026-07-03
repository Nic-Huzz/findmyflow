/**
 * AIPortal.jsx — App Build portal (desktop-only)
 *
 * Health scanner + terminal + preview for building apps with Claude Code.
 * Terminal slides up from bottom via TerminalDrawer.
 */

import { useState, useCallback } from 'react'
import AppBuildMode from './AppBuildMode'
import TerminalDrawer from './TerminalDrawer'
import './portal.css'

export default function AIPortal() {
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState(null)

  const runInTerminal = useCallback((prompt) => {
    setPendingPrompt(prompt)
    setTerminalOpen(true)
  }, [])

  const handlePromptSent = useCallback(() => {
    setPendingPrompt(null)
  }, [])

  return (
    <div className="portal-container">
      <div className="portal-mode-bar">
        <button className="portal-mode-btn active">
          <span className="portal-mode-icon">🔨</span>
          <span className="portal-mode-label">App Build</span>
        </button>

        <button
          className={`portal-mode-btn${terminalOpen ? ' active' : ''}`}
          onClick={() => setTerminalOpen(prev => !prev)}
          style={{ marginLeft: 'auto' }}
        >
          <span className="portal-mode-icon">⌨</span>
          <span className="portal-mode-label">Terminal</span>
        </button>
      </div>

      <div className="portal-mode-content" style={terminalOpen ? { paddingBottom: '45vh' } : undefined}>
        <AppBuildMode runInTerminal={runInTerminal} />
      </div>

      <TerminalDrawer
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        pendingPrompt={pendingPrompt}
        onPromptSent={handlePromptSent}
      />
    </div>
  )
}
