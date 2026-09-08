/**
 * QuadrantCard.jsx
 *
 * Compass card showing the user's position on a Safety x Expression quadrant.
 * Collapsed: mini compass + zone name + subtitle + chevron.
 * Expanded: quadrant field with orb + 3 actionable bars + nudge.
 *
 * CSS prefix: qc- (scoped under .qc-card)
 * Created: 2026-09-07
 */

import { useState } from 'react'
import './QuadrantCard.css'

const QUADRANTS = {
  'vibe-rise': { label: 'Vibe Rise', desc: 'Safe and expressing yourself fully', color: '#b8860b', orb: '#E9A23B' },
  'grounded': { label: 'Grounded', desc: 'Safe but not putting yourself out there', color: '#5e17eb', orb: '#5e17eb' },
  'wired': { label: 'Wired', desc: 'Expressing but your body needs safety', color: '#e05252', orb: '#e05252' },
  'stuck': { label: 'Stuck', desc: 'Low on both', color: '#9ca3af', orb: '#9ca3af' },
}

const ZONE_TO_COMPASS = {
  'grounded': 'tl',
  'vibe-rise': 'tr',
  'stuck': 'bl',
  'wired': 'br',
}

const NUDGE_TEXT = {
  'wired': "You're putting yourself out there. But your body needs more safety practices to sustain it.",
  'grounded': 'Your safety foundation is solid. Try a courage challenge to start expressing yourself.',
  'stuck': 'Start with one safety practice today. Small steps move the dot.',
}

export default function QuadrantCard({ safety = 0, expression = 0, maintenancePct = 0, zone = 'stuck', todayProgress, trend }) {
  const [open, setOpen] = useState(false)

  const q = QUADRANTS[zone] || QUADRANTS.stuck
  const activeCorner = ZONE_TO_COMPASS[zone] || 'bl'

  // Orb position: safety→Y (0=bottom 95%, 10=top 5%), expression→X (0=left 5%, 10=right 95%)
  const orbY = 95 - (safety / 10) * 90
  const orbX = 5 + (expression / 10) * 90

  // Mini compass orb (same mapping, scaled to 52px)
  const miniOrbX = 5 + (expression / 10) * 90
  const miniOrbY = 95 - (safety / 10) * 90

  // Today's progress bars
  const sp = todayProgress?.safety || { done: 0, target: 4 }
  const ep = todayProgress?.expression || { done: 0, target: 3 }
  const mp = todayProgress?.maintenance || { done: 0, target: 6 }

  const safetyPct = Math.min(100, (sp.done / sp.target) * 100)
  const exprPct = Math.min(100, (ep.done / ep.target) * 100)
  const maintPct = Math.min(100, (mp.done / mp.target) * 100)

  return (
    <div className={`qc-card ${open ? 'qc-open' : ''}`} onClick={() => setOpen(o => !o)}>
      {/* ── Collapsed header ── */}
      <div className="qc-header">
        <div className="qc-compass">
          <div className={`qc-mz qc-mz-tl ${activeCorner === 'tl' ? 'qc-mz-active' : ''}`} />
          <div className={`qc-mz qc-mz-tr ${activeCorner === 'tr' ? 'qc-mz-active' : ''}`} />
          <div className={`qc-mz qc-mz-bl ${activeCorner === 'bl' ? 'qc-mz-active' : ''}`} />
          <div className={`qc-mz qc-mz-br ${activeCorner === 'br' ? 'qc-mz-active' : ''}`} />
          <div
            className="qc-mini-orb"
            style={{ background: q.orb, left: `${miniOrbX}%`, top: `${miniOrbY}%` }}
          />
        </div>

        <div className="qc-meta">
          <div className="qc-zone-name" style={{ color: q.color }}>{q.label}</div>
          <div className="qc-zone-desc">{q.desc}</div>
        </div>

        <div className="qc-chevron">
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>

      {/* ── Expanded body ── */}
      <div className="qc-body">
        <div className="qc-body-inner">
          <div className="qc-body-content">
            {/* Quadrant field */}
            <div className="qc-field" style={{ '--qc-orb-color': q.orb }}>
              <div className="qc-axis-h" />
              <div className="qc-axis-v" />

              <div className={`qc-zone qc-zone-tl qc-zone-grounded ${zone === 'grounded' ? 'qc-zone-active' : ''}`}>
                <div className="qc-zone-label-text">Grounded</div>
                <div className="qc-zone-sub-text">Safe, not expressing</div>
              </div>
              <div className={`qc-zone qc-zone-tr qc-zone-viberise ${zone === 'vibe-rise' ? 'qc-zone-active' : ''}`}>
                <div className="qc-zone-label-text">Vibe Rise</div>
                <div className="qc-zone-sub-text">Safe and expressed</div>
              </div>
              <div className={`qc-zone qc-zone-bl qc-zone-stuck ${zone === 'stuck' ? 'qc-zone-active' : ''}`}>
                <div className="qc-zone-label-text">Stuck</div>
                <div className="qc-zone-sub-text">Low on both</div>
              </div>
              <div className={`qc-zone qc-zone-br qc-zone-wired ${zone === 'wired' ? 'qc-zone-active' : ''}`}>
                <div className="qc-zone-label-text">Wired</div>
                <div className="qc-zone-sub-text">Expressing without safety</div>
              </div>

              <div className="qc-orb" style={{ left: `${orbX}%`, top: `${orbY}%` }} />

              <span className="qc-ax-label qc-ax-label-bottom">expression</span>
              <span className="qc-ax-label qc-ax-label-left">safety</span>
            </div>

            {/* Actionable bars */}
            <div className="qc-bars">
              <div className="qc-bar">
                <div className="qc-bar-label">Safety</div>
                <div className="qc-bar-track">
                  <div className="qc-bar-fill qc-bar-fill-safety" style={{ width: `${safetyPct}%` }} />
                </div>
                <div className="qc-bar-nudge">
                  {sp.done >= sp.target
                    ? <span className="qc-bar-done">{sp.done}/{sp.target} done</span>
                    : <span className="qc-bar-todo">{sp.target - sp.done} left today</span>
                  }
                </div>
              </div>

              <div className="qc-bar">
                <div className="qc-bar-label">Expression</div>
                <div className="qc-bar-track">
                  <div className="qc-bar-fill qc-bar-fill-expression" style={{ width: `${exprPct}%` }} />
                </div>
                <div className="qc-bar-nudge">
                  {ep.done >= ep.target
                    ? <span className="qc-bar-done">{ep.done}/{ep.target} done</span>
                    : <span className="qc-bar-todo">{ep.target - ep.done} left today</span>
                  }
                </div>
              </div>

              <div className="qc-bar">
                <div className="qc-bar-label">Maintain</div>
                <div className="qc-bar-track">
                  <div className="qc-bar-fill qc-bar-fill-maintenance" style={{ width: `${maintPct}%` }} />
                </div>
                <div className="qc-bar-nudge">
                  {mp.done >= mp.target
                    ? <span className="qc-bar-done">{mp.done}/{mp.target} done</span>
                    : <span className="qc-bar-todo">{mp.target - mp.done} left today</span>
                  }
                </div>
              </div>
            </div>

            {/* Nudge (only when not vibe-rise) */}
            {zone !== 'vibe-rise' && NUDGE_TEXT[zone] && (
              <div className="qc-nudge">{NUDGE_TEXT[zone]}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
