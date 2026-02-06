import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Healing R-type configuration
 */
const HEALING_TYPES = [
  { id: 'recognise', label: 'Recognise', icon: '👁️' },
  { id: 'release', label: 'Release', icon: '🌊' },
  { id: 'rewire', label: 'Rewire', icon: '🔄' },
  { id: 'reconnect', label: 'Reconnect', icon: '🌱' },
]

/**
 * EssenceVsProtectiveTracker - Shows the balance between essence and protective
 * voice moments from the 7-day challenge, plus healing journey progress.
 *
 * Data sources:
 * - Business > Voices tab: voice_stage_*_essence_voice / voice_stage_*_protective_voice
 * - Healing tab: Recognise, Release, Rewire, Reconnect quest completions
 */
function EssenceVsProtectiveTracker({ voiceTracker, archetypes }) {
  if (!voiceTracker) return null

  const {
    essenceCount,
    protectiveCount,
    totalVoiceMoments,
    essencePercentage,
    healingByType,
    totalHealingCompleted,
  } = voiceTracker

  const essenceName = archetypes?.essence?.name || 'Essence'
  const protectiveName = archetypes?.protective?.name || 'Protective Voice'

  const hasVoiceData = totalVoiceMoments > 0
  const hasHealingData = totalHealingCompleted > 0

  // Determine which voice is "winning"
  let balanceLabel = 'Balanced'
  let balanceClass = 'balanced'
  if (essenceCount > protectiveCount) {
    balanceLabel = `${essenceName} leads`
    balanceClass = 'essence-leads'
  } else if (protectiveCount > essenceCount) {
    balanceLabel = `${protectiveName} leads`
    balanceClass = 'protective-leads'
  }

  return (
    <div className="voice-tracker">
      <h3 className="voice-tracker-title">Essence vs Protective Tracker</h3>

      {/* Voice Balance Section */}
      <div className="voice-balance-section">
        <div className="voice-balance-labels">
          <div className="voice-label essence-label">
            <span className="voice-label-icon">✨</span>
            <span className="voice-label-name">{essenceName}</span>
          </div>
          <div className="voice-label protective-label">
            <span className="voice-label-name">{protectiveName}</span>
            <span className="voice-label-icon">🛡️</span>
          </div>
        </div>

        {hasVoiceData ? (
          <>
            {/* Ratio slider bar */}
            <div className="voice-balance-bar">
              <div
                className="voice-balance-fill essence-fill"
                style={{ width: `${essencePercentage}%` }}
              >
                {essencePercentage >= 20 && (
                  <span className="voice-bar-pct essence-pct">{essencePercentage}%</span>
                )}
              </div>
              <div
                className="voice-balance-fill protective-fill"
                style={{ width: `${100 - essencePercentage}%` }}
              >
                {(100 - essencePercentage) >= 20 && (
                  <span className="voice-bar-pct protective-pct">{100 - essencePercentage}%</span>
                )}
              </div>
              <div className="voice-balance-marker" style={{ left: `${essencePercentage}%` }} />
            </div>

            {/* Counts */}
            <div className="voice-balance-counts">
              <span className="voice-count essence-count">{essenceCount} moments</span>
              <span className={`voice-balance-status ${balanceClass}`}>{balanceLabel}</span>
              <span className="voice-count protective-count">{protectiveCount} moments</span>
            </div>
          </>
        ) : (
          <div className="voice-balance-empty">
            <p className="voice-empty-text">
              Track moments when your essence voice guides you vs when your
              protective voice holds you back. Complete voice quests in the{' '}
              <Link to="/7-day-challenge?tab=business" className="hero-profile-link">
                7-Day Challenge →
              </Link>{' '}
              to start tracking.
            </p>
          </div>
        )}
      </div>

      {/* Healing Journey Section */}
      <div className="healing-journey-section">
        <div className="healing-journey-header">
          <span className="healing-journey-label">Healing Journey</span>
          {hasHealingData && (
            <span className="healing-journey-total">{totalHealingCompleted} completed</span>
          )}
        </div>

        <div className="healing-types-grid">
          {HEALING_TYPES.map(type => {
            const count = healingByType?.[type.id] || 0
            const hasActivity = count > 0

            return (
              <div
                key={type.id}
                className={`healing-type-card ${hasActivity ? 'active' : ''}`}
              >
                <span className="healing-type-icon">{type.icon}</span>
                <span className="healing-type-label">{type.label}</span>
                <span className="healing-type-count">
                  {count > 0 ? count : '-'}
                </span>
              </div>
            )
          })}
        </div>

        {!hasHealingData && (
          <p className="healing-empty-text">
            Complete healing quests (Recognise, Release, Rewire, Reconnect) in the{' '}
            <Link to="/7-day-challenge?tab=healing" className="hero-profile-link">
              7-Day Challenge →
            </Link>{' '}
            to track your inner growth journey.
          </p>
        )}
      </div>
    </div>
  )
}

export default EssenceVsProtectiveTracker
