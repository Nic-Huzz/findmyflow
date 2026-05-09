import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import useNervousSystemMap from '../hooks/useNervousSystemMap'
import './NervousSystemMap.css'

const ARCHETYPE_ICONS = {
  Controller: '🎮',
  Ghost: '👻',
  Perfectionist: '🎭',
  'Auto-Pilot': '🛋️',
  'People Pleaser': '🪞',
  unsure: '🤷',
}

const STATE_EMOJI = { vibe_rise: '⚡', ventral: '😊', sympathetic: '😬', dorsal: '😶' }
const STATE_LABEL = { vibe_rise: 'Vibe Rise', ventral: 'Ventral', sympathetic: 'Sympathetic', dorsal: 'Dorsal' }

export default function NervousSystemMap() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, loading } = useNervousSystemMap(user?.id)

  if (loading) {
    return (
      <div className="nsm-page">
        <div className="nsm-loading">
          <div className="spinner" />
          <p>Loading your nervous system map...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="nsm-page">
        <div className="nsm-empty">
          <span className="nsm-empty-emoji">🧠</span>
          <h2>No data yet</h2>
          <p>Complete some Play-List or Healing challenges to start mapping your nervous system.</p>
          <button className="nsm-back-btn" onClick={() => navigate('/7-day-challenge')}>← Back to Challenges</button>
        </div>
      </div>
    )
  }

  const { totalCheckins, totalWeeks, dominant, overall, before, after, weeklyTimeline, shiftPatterns, archetypeList, maxArchCount } = data

  return (
    <div className="nsm-page">

      {/* Back button */}
      <button className="nsm-back-btn" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}>← Back</button>

      {/* Hero */}
      <div className="nsm-hero">
        <h1>Your Nervous System Map</h1>
        <p className="nsm-hero-sub">{totalCheckins} check-in{totalCheckins !== 1 ? 's' : ''} across {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}</p>
        <div className="nsm-state-quad">
          {['vibe_rise', 'ventral', 'sympathetic', 'dorsal'].map((s) => (
            <div key={s} className={`nsm-state-card ${dominant === s ? 'active' : ''} ${s === 'vibe_rise' ? 'nsm-vibe-rise-card' : ''}`}>
              <span className="nsm-sc-emoji">{STATE_EMOJI[s]}</span>
              <span className="nsm-sc-pct">{overall[s]}%</span>
              <span className="nsm-sc-label">{STATE_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Where You Live */}
      <div className="nsm-card">
        <h2 className="nsm-card-title">Where you live</h2>
        <p className="nsm-card-sub">Your nervous system frequency distribution</p>

        <div className="nsm-freq-bar">
          {overall.vibe_rise > 0 && <div className="nsm-freq-seg nsm-vibe-rise" style={{ width: `${overall.vibe_rise}%` }}>{overall.vibe_rise}%</div>}
          {overall.ventral > 0 && <div className="nsm-freq-seg nsm-ventral" style={{ width: `${overall.ventral}%` }}>{overall.ventral}%</div>}
          {overall.sympathetic > 0 && <div className="nsm-freq-seg nsm-sympathetic" style={{ width: `${overall.sympathetic}%` }}>{overall.sympathetic}%</div>}
          {overall.dorsal > 0 && <div className="nsm-freq-seg nsm-dorsal" style={{ width: `${overall.dorsal}%` }}>{overall.dorsal}%</div>}
        </div>

        <div className="nsm-legend">
          <span className="nsm-legend-item"><span className="nsm-dot nsm-vibe-rise" /> Vibe Rise</span>
          <span className="nsm-legend-item"><span className="nsm-dot nsm-ventral" /> Ventral</span>
          <span className="nsm-legend-item"><span className="nsm-dot nsm-sympathetic" /> Sympathetic</span>
          <span className="nsm-legend-item"><span className="nsm-dot nsm-dorsal" /> Dorsal</span>
        </div>

        {weeklyTimeline.length > 1 && (
          <>
            <span className="nsm-eyebrow">Over Time</span>
            <div className="nsm-timeline">
              {weeklyTimeline.filter(w => w.count > 0).map((w) => (
                <div key={w.week} className="nsm-timeline-row">
                  <span className="nsm-timeline-label">Week {w.week}</span>
                  <div className="nsm-timeline-bar">
                    {w.vibe_rise > 0 && <div className="nsm-freq-seg nsm-vibe-rise" style={{ width: `${w.vibe_rise}%` }} />}
                    {w.ventral > 0 && <div className="nsm-freq-seg nsm-ventral" style={{ width: `${w.ventral}%` }} />}
                    {w.sympathetic > 0 && <div className="nsm-freq-seg nsm-sympathetic" style={{ width: `${w.sympathetic}%` }} />}
                    {w.dorsal > 0 && <div className="nsm-freq-seg nsm-dorsal" style={{ width: `${w.dorsal}%` }} />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Before vs After */}
      <div className="nsm-card">
        <h2 className="nsm-card-title">Before vs After</h2>
        <p className="nsm-card-sub">How your challenges are shifting your state</p>
        <div className="nsm-comparison">
          <div className="nsm-comp-side">
            <span className="nsm-comp-label">Before</span>
            <div className="nsm-comp-bar">
              {before.vibe_rise > 0 && <div className="nsm-seg nsm-vibe-rise" style={{ width: `${before.vibe_rise}%` }} />}
              {before.ventral > 0 && <div className="nsm-seg nsm-ventral" style={{ width: `${before.ventral}%` }} />}
              {before.sympathetic > 0 && <div className="nsm-seg nsm-sympathetic" style={{ width: `${before.sympathetic}%` }} />}
              {before.dorsal > 0 && <div className="nsm-seg nsm-dorsal" style={{ width: `${before.dorsal}%` }} />}
            </div>
            <span className="nsm-comp-pct">{before.vibe_rise}% Vibe Rise</span>
          </div>
          <span className="nsm-comp-arrow">&#8594;</span>
          <div className="nsm-comp-side">
            <span className="nsm-comp-label">After</span>
            <div className="nsm-comp-bar">
              {after.vibe_rise > 0 && <div className="nsm-seg nsm-vibe-rise" style={{ width: `${after.vibe_rise}%` }} />}
              {after.ventral > 0 && <div className="nsm-seg nsm-ventral" style={{ width: `${after.ventral}%` }} />}
              {after.sympathetic > 0 && <div className="nsm-seg nsm-sympathetic" style={{ width: `${after.sympathetic}%` }} />}
              {after.dorsal > 0 && <div className="nsm-seg nsm-dorsal" style={{ width: `${after.dorsal}%` }} />}
            </div>
            <span className="nsm-comp-pct">{after.vibe_rise}% Vibe Rise</span>
          </div>
        </div>
      </div>

      {/* What's Shifting */}
      {shiftPatterns.some(s => s.count > 0) && (
        <div className="nsm-card">
          <h2 className="nsm-card-title">What's shifting</h2>
          <p className="nsm-card-sub">Before vs after your challenges</p>
          <div className="nsm-shift-grid">
            {shiftPatterns.filter(s => s.count > 0).map((s) => (
              <div key={s.key} className="nsm-shift-card">
                <span className="nsm-shift-emoji">{s.emoji}</span>
                <span className="nsm-shift-count">{s.count}</span>
                <span className="nsm-shift-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protective Voices */}
      {archetypeList.length > 0 && (
        <div className="nsm-card">
          <h2 className="nsm-card-title">Your protective voices</h2>
          <p className="nsm-card-sub">Which voices show up when you're activated or shut down</p>
          <div className="nsm-archetype-list">
            {archetypeList.map((a) => (
              <div key={a.name} className="nsm-arch-row">
                <span className="nsm-arch-icon">{ARCHETYPE_ICONS[a.name] || '🤷'}</span>
                <span className="nsm-arch-name">{a.name === 'unsure' ? 'Unsure' : a.name}</span>
                <span className="nsm-arch-count">{a.count}</span>
                <div className="nsm-arch-bar-wrap">
                  <div className="nsm-arch-bar-fill" style={{ width: `${(a.count / maxArchCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
