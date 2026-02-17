import { useState, useEffect } from 'react'
import { fetchVoiceProfileForDashboard } from '../../lib/contentReviewService'
import { buildVoiceInstructions } from '../../lib/voiceProfile'

const CATEGORY_LABELS = {
  tone: 'Tone',
  word_choice: 'Word Choice',
  structure: 'Structure',
  content: 'Content',
  brand: 'Brand',
}

function getConfidenceLevel(profile) {
  if (!profile) return { label: 'No profile', level: 0 }
  const corrections = profile.corrections?.length || 0
  const samples = profile.content_samples?.length || 0
  const influences = profile.voice_influences?.length || 0

  if (corrections >= 25) return { label: 'Your voice twin', level: 5 }
  if (corrections >= 10) return { label: 'Dialed in', level: 4 }
  if (samples >= 3) return { label: 'Learning your voice', level: 3 }
  if (influences > 0) return { label: 'Warming up', level: 2 }
  return { label: 'Getting started', level: 1 }
}

const CONFIDENCE_COLORS = ['#94a3b8', '#f59e0b', '#f59e0b', '#22c55e', '#8b5cf6', '#E9A23B']

export default function VoiceDashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    fetchVoiceProfileForDashboard()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="cr-voice-loading">Loading voice profile...</div>
  if (!profile) return (
    <div className="cr-voice-empty">
      <div style={{ textAlign: 'center' }}>
        <p>No voice profile found.</p>
        <a href="/voice-training" className="cr-chip cr-chip--brand" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>
          Create Voice Profile
        </a>
      </div>
    </div>
  )

  const confidence = getConfidenceLevel(profile)
  const corrections = profile.corrections || []
  const influences = profile.voice_influences || []
  const patterns = profile.detected_patterns || {}
  const dos = patterns.voice_dos || []
  const donts = patterns.voice_donts || []
  const samples = profile.content_samples || []

  const categoryCounts = {}
  for (const c of corrections) {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1
  }

  return (
    <div className="cr-voice">
      {/* Voice Summary Card */}
      <div className="cr-voice-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 className="cr-voice-title" style={{ margin: 0 }}>{profile.voice_name || 'My Voice'}</h2>
            {profile.voice_summary && (
              <p style={{ fontSize: 13, color: 'var(--cr-text-secondary)', margin: '6px 0 0' }}>{profile.voice_summary}</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: CONFIDENCE_COLORS[confidence.level]
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: CONFIDENCE_COLORS[confidence.level] }}>
              {confidence.label}
            </span>
          </div>
        </div>

        {/* Influence chips */}
        {influences.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {influences.map((inf, i) => (
              <span key={i} className="cr-chip cr-chip--brand" title={inf.description}>
                {inf.name}
              </span>
            ))}
          </div>
        )}

        {/* Writing samples count */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--cr-text-muted)' }}>
          <span>{samples.length} writing sample{samples.length !== 1 ? 's' : ''}</span>
          <span>{corrections.length} correction{corrections.length !== 1 ? 's' : ''}</span>
          <span>{influences.length} influence{influences.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* How AI Writes For You — collapsible prompt preview */}
      <div className="cr-voice-section">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}
        >
          <h3 style={{ margin: 0 }}>How AI Writes For You</h3>
          <span style={{ fontSize: 12, color: 'var(--cr-text-muted)' }}>
            {showPrompt ? '▾ Hide' : '▸ Show prompt'}
          </span>
        </button>
        {showPrompt && (
          <pre style={{
            marginTop: 12, padding: 14, background: 'var(--cr-input-bg)', borderRadius: 12,
            fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            color: 'var(--cr-text-secondary)', maxHeight: 400, overflow: 'auto'
          }}>
            {buildVoiceInstructions(profile)}
          </pre>
        )}
      </div>

      {/* Corrections Feed */}
      <div className="cr-voice-section">
        <h3>Corrections by Category</h3>
        <div className="cr-voice-counts">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <div key={key} className="cr-voice-count">
              <span className="cr-voice-count-num">{categoryCounts[key] || 0}</span>
              <span className="cr-voice-count-label">{label}</span>
            </div>
          ))}
        </div>
        <div className="cr-voice-total">
          {corrections.length} total corrections logged
        </div>
      </div>

      <div className="cr-voice-section">
        <h3>Recent Corrections</h3>
        {corrections.length === 0 ? (
          <p className="cr-voice-hint">No corrections yet. Review content and resolve comments to build your voice profile.</p>
        ) : (
          <div className="cr-voice-corrections">
            {corrections.slice(-10).reverse().map((c, i) => (
              <div key={i} className="cr-voice-correction">
                <div className="cr-voice-correction-from">"{c.original}"</div>
                <div className="cr-voice-correction-arrow">&rarr;</div>
                <div className="cr-voice-correction-to">"{c.corrected}"</div>
                <span className="cr-chip cr-chip--sm">{c.category?.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand Words */}
      {dos.length > 0 && (
        <div className="cr-voice-section">
          <h3>On-Brand Words</h3>
          <div className="cr-voice-words">
            {dos.map((w, i) => (
              <span key={i} className="cr-chip cr-chip--brand">{w}</span>
            ))}
          </div>
        </div>
      )}

      {donts.length > 0 && (
        <div className="cr-voice-section">
          <h3>Off-Brand Words</h3>
          <div className="cr-voice-words">
            {donts.map((w, i) => (
              <span key={i} className="cr-chip cr-chip--offbrand">{w}</span>
            ))}
          </div>
        </div>
      )}

      {/* Edit Voice Profile button */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <a
          href="/voice-training"
          style={{
            display: 'inline-block', padding: '12px 28px', borderRadius: 16,
            background: 'var(--cr-purple, #5e17eb)', color: '#fff',
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(94,23,235,0.3)'
          }}
        >
          Edit Voice Profile
        </a>
      </div>
    </div>
  )
}
