/**
 * EventStateShifts.jsx — Attendee state shift dashboard for creators
 * Shows before/after distribution, improvement rate, QR code link, and individual shifts.
 * CSS prefix: ess-
 */
import { useState, useEffect } from 'react'
import { fetchEventCheckins, calculateStateShifts } from '../lib/experienceTemplateService'
import { hapticLight } from '../lib/haptics'
import './EventStateShifts.css'

const STATE_CONFIG = {
  dorsal: { label: 'Shutdown', emoji: '😶', color: '#6b7280' },
  sympathetic: { label: 'Activated', emoji: '😰', color: '#ef4444' },
  ventral: { label: 'Safe', emoji: '😌', color: '#10b981' },
  vibe_rise: { label: 'Vibe Rise', emoji: '🔥', color: '#E9A23B' },
}

export default function EventStateShifts({ experienceId }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const checkinUrl = `${window.location.origin}/event/${experienceId}/checkin`

  useEffect(() => {
    if (!experienceId) return
    fetchEventCheckins(experienceId)
      .then(data => { setCheckins(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [experienceId])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkinUrl).then(() => {
      hapticLight()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const analysis = calculateStateShifts(checkins)
  const hasData = analysis.total > 0
  const beforeCount = checkins.filter(c => c.checkin_type === 'before').length
  const afterCount = checkins.filter(c => c.checkin_type === 'after').length

  return (
    <div className="ess-card">
      <div className="ess-header">
        <div className="ess-header-left">
          <span className="ess-icon">📊</span>
          <span className="ess-title">Attendee State Shifts</span>
        </div>
        <span className="ess-checkin-count">{beforeCount} checked in</span>
      </div>

      {/* QR / Share Link */}
      <div className="ess-qr-section">
        <p className="ess-qr-label">Share this link for attendees to check in:</p>
        <div className="ess-qr-row">
          <input className="ess-qr-input" value={checkinUrl} readOnly onClick={e => e.target.select()} />
          <button className="ess-copy-btn" onClick={handleCopyLink}>
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>

      {loading && <p className="ess-loading">Loading check-in data...</p>}

      {!loading && !hasData && (
        <div className="ess-empty">
          <p>No attendees have completed both before + after check-ins yet.</p>
          <p className="ess-empty-sub">Share the check-in link before your event starts.</p>
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* Improvement Rate */}
          <div className="ess-stat-row">
            <div className="ess-stat">
              <div className="ess-stat-value" style={{ color: '#E9A23B' }}>{analysis.improvementRate}%</div>
              <div className="ess-stat-label">improved their state</div>
            </div>
            <div className="ess-stat">
              <div className="ess-stat-value">{analysis.total}</div>
              <div className="ess-stat-label">completed both check-ins</div>
            </div>
          </div>

          {/* Before / After Distribution */}
          <div className="ess-dist">
            <div className="ess-dist-col">
              <div className="ess-dist-label">Before</div>
              {Object.entries(STATE_CONFIG).map(([key, cfg]) => {
                const count = analysis.beforeDist[key] || 0
                const pct = analysis.total > 0 ? Math.round((count / analysis.total) * 100) : 0
                return (
                  <div key={key} className="ess-dist-row">
                    <span className="ess-dist-emoji">{cfg.emoji}</span>
                    <div className="ess-dist-bar-track">
                      <div className="ess-dist-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                    <span className="ess-dist-pct">{pct}%</span>
                  </div>
                )
              })}
            </div>
            <div className="ess-dist-col">
              <div className="ess-dist-label">After</div>
              {Object.entries(STATE_CONFIG).map(([key, cfg]) => {
                const count = analysis.afterDist[key] || 0
                const pct = analysis.total > 0 ? Math.round((count / analysis.total) * 100) : 0
                return (
                  <div key={key} className="ess-dist-row">
                    <span className="ess-dist-emoji">{cfg.emoji}</span>
                    <div className="ess-dist-bar-track">
                      <div className="ess-dist-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                    <span className="ess-dist-pct">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Individual Shifts */}
          <div className="ess-shifts">
            <div className="ess-shifts-label">Individual Shifts</div>
            {analysis.shifts.map((s, i) => (
              <div key={i} className={`ess-shift-row ${s.shifted ? 'ess-shifted' : ''}`}>
                <span className="ess-shift-before">{STATE_CONFIG[s.before]?.emoji} {s.beforeLabel}</span>
                <span className="ess-shift-arrow">→</span>
                <span className="ess-shift-after">{STATE_CONFIG[s.after]?.emoji} {s.afterLabel}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
