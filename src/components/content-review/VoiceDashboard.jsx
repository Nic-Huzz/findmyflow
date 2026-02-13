import { useState, useEffect } from 'react'
import { fetchVoiceConfig } from '../../lib/contentReviewService'

const CATEGORY_LABELS = {
  tone: 'Tone',
  word_choice: 'Word Choice',
  structure: 'Structure',
  content: 'Content',
  brand: 'Brand',
}

export default function VoiceDashboard() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVoiceConfig()
      .then(setConfig)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="cr-voice-loading">Loading voice profile...</div>
  if (!config) return <div className="cr-voice-empty">No voice config found.</div>

  const corrections = config.corrections || []
  const categoryCounts = {}
  for (const c of corrections) {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1
  }

  return (
    <div className="cr-voice">
      <h2 className="cr-voice-title">Voice Profile</h2>

      {/* Category counts */}
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

      {/* Recent corrections */}
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
                <span className="cr-chip cr-chip--sm">{c.category?.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Word lists */}
      <div className="cr-voice-section">
        <h3>On-Brand Words</h3>
        <div className="cr-voice-words">
          {(config.on_brand_words || []).map((w, i) => (
            <span key={i} className="cr-chip cr-chip--brand">{w}</span>
          ))}
        </div>
      </div>

      <div className="cr-voice-section">
        <h3>Off-Brand Words</h3>
        <div className="cr-voice-words">
          {(config.off_brand_words || []).map((w, i) => (
            <span key={i} className="cr-chip cr-chip--offbrand">{w}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
