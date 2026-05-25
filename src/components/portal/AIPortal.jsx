/**
 * AIPortal.jsx — AI Portal mode switcher
 *
 * Desktop-only tab within /create. Contains 4 modes:
 *   Growth   — Growth Line + Grind Line dashboard
 *   App Build — health scanner + terminal + preview
 *   Documents — document processing + output panel
 *   Agents   — Zarlo + Perry AI chat
 *
 * Terminal slides up from bottom on task click.
 */

import { useState } from 'react'
import GrowthDashboard from './GrowthDashboard'
import AppBuildMode from './AppBuildMode'
import AgentsMode from './AgentsMode'
import './portal.css'

const MODES = [
  { key: 'growth', label: 'Growth', icon: '📈' },
  { key: 'build', label: 'App Build', icon: '🔨' },
  { key: 'documents', label: 'Documents', icon: '📄' },
  { key: 'agents', label: 'Agents', icon: '🤖' },
]

export default function AIPortal() {
  const [activeMode, setActiveMode] = useState('growth')

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
      </div>

      <div className="portal-mode-content">
        {activeMode === 'growth' && <GrowthDashboard />}
        {activeMode === 'build' && <AppBuildMode />}
        {activeMode === 'documents' && <PlaceholderMode label="Documents" description="Process decks, copy, proposals, and session guides. Coming with the desktop app." />}
        {activeMode === 'agents' && <AgentsMode />}
      </div>
    </div>
  )
}

function PlaceholderMode({ label, description }) {
  return (
    <div className="portal-placeholder">
      <div className="portal-placeholder-label">{label}</div>
      <div className="portal-placeholder-desc">{description}</div>
    </div>
  )
}
