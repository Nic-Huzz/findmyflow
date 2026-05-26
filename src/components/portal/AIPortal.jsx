/**
 * AIPortal.jsx — AI Portal mode switcher (desktop-only)
 *
 * 3 modes:
 *   App Build — health scanner + terminal + preview
 *   Documents — document processing + output panel
 *   Agents   — Zarlo + Perry AI chat
 *
 * Terminal slides up from bottom on task click via TerminalDrawer.
 */

import { useState, useCallback } from 'react'
import AppBuildMode from './AppBuildMode'
import DocumentsMode from './DocumentsMode'
import AgentsMode from './AgentsMode'
import TerminalDrawer from './TerminalDrawer'
import './portal.css'

const MODES = [
  { key: 'build', label: 'App Build', icon: '🔨' },
  { key: 'documents', label: 'Documents', icon: '📄' },
  { key: 'agents', label: 'Agents', icon: '🤖' },
]

export default function AIPortal() {
  const [activeMode, setActiveMode] = useState('agents')
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
        {MODES.map(mode => (
          <button
            key={mode.key}
            className={`portal-mode-btn${activeMode === mode.key ? ' active' : ''}`}
            onClick={() => setActiveMode(mode.key)}
          >
            <span className="portal-mode-icon">{mode.icon}</span>
            <span className="portal-mode-label">{mode.label}</span>
          </button>
        ))}

        {/* Terminal toggle */}
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
        {activeMode === 'build' && <AppBuildMode />}
        {activeMode === 'documents' && <DocumentsMode runInTerminal={runInTerminal} />}
        {activeMode === 'agents' && <AgentsMode />}
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
