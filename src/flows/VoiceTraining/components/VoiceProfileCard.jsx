/**
 * VoiceProfileCard - Display completed voice profile
 */
export default function VoiceProfileCard({ profile, onEdit, onStartFresh, onDone }) {
  if (!profile) {
    return (
      <div className="vt-step" style={{ textAlign: 'center' }}>
        <p>No voice profile found.</p>
        <button className="vt-continue-btn" onClick={onStartFresh}>
          Create Voice Profile
        </button>
      </div>
    )
  }

  // Determine if this is a template-based or custom profile
  const isTemplate = profile.is_template || profile.template_id
  const dp = profile.detected_patterns || {}
  const voiceType = profile.voice_type || profile.voiceType || profile.voice_name || 'Custom Voice'

  // Extract traits (top-level from fresh response, or from detected_patterns for DB-loaded)
  const traits = profile.traits || profile.voice_traits || dp.traits || []

  // Extract patterns (top-level from fresh response, or detected_patterns IS the patterns object for DB)
  const patterns = profile.patterns || profile.writing_patterns || dp

  // Extract sample
  const sampleOutput = profile.sample_output || profile.sampleOutput || dp.sample_output || null

  // Extract summary
  const summary = profile.summary || profile.voice_summary ||
    'Your unique voice has been captured. AI content will now match your authentic style.'

  return (
    <div className="vt-profile-card">
      <div className="vt-profile-header">
        <div className="vt-profile-icon">🎙️</div>
        <h2 className="vt-profile-name">Your Voice Profile</h2>
        <div className="vt-profile-badge">
          {isTemplate ? `Template: ${voiceType}` : voiceType}
        </div>
      </div>

      <div className="vt-profile-body">
        <div className="vt-profile-summary">
          {summary}
        </div>

        {traits.length > 0 && (
          <div className="vt-profile-section">
            <h4>Voice Traits</h4>
            <div className="vt-traits">
              {traits.map((trait, i) => (
                <span key={i} className="vt-trait">{trait}</span>
              ))}
            </div>
          </div>
        )}

        {(patterns.hookStyle || patterns.hook_style) && (
          <div className="vt-profile-section">
            <h4>Writing Patterns</h4>
            <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.6' }}>
              {(patterns.hookStyle || patterns.hook_style) && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Hook style:</strong> {patterns.hookStyle || patterns.hook_style}
                </div>
              )}
              {(patterns.sentenceFlow || patterns.sentence_flow) && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Sentence flow:</strong> {patterns.sentenceFlow || patterns.sentence_flow}
                </div>
              )}
              {(patterns.emotionalTone || patterns.emotional_tone) && (
                <div>
                  <strong>Emotional tone:</strong> {patterns.emotionalTone || patterns.emotional_tone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Style Preferences */}
        <div className="vt-profile-section">
          <h4>Style Settings</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#6c757d' }}>Sentence Length:</span>{' '}
              <span style={{ fontWeight: '500' }}>{getStyleLabel(profile.sentence_length || 50)}</span>
            </div>
            <div>
              <span style={{ color: '#6c757d' }}>Emoji Usage:</span>{' '}
              <span style={{ fontWeight: '500' }}>{getStyleLabel(profile.emoji_usage || 40)}</span>
            </div>
            <div>
              <span style={{ color: '#6c757d' }}>Humor Level:</span>{' '}
              <span style={{ fontWeight: '500' }}>{getStyleLabel(profile.humor_level || 50)}</span>
            </div>
            <div>
              <span style={{ color: '#6c757d' }}>Formality:</span>{' '}
              <span style={{ fontWeight: '500' }}>{getStyleLabel(profile.formality_level || 40)}</span>
            </div>
          </div>
        </div>

        {/* Catchphrases */}
        {profile.catchphrases && profile.catchphrases.length > 0 && (
          <div className="vt-profile-section">
            <h4>Your Catchphrases</h4>
            <div className="vt-traits">
              {profile.catchphrases.map((phrase, i) => (
                <span key={i} className="vt-trait">&quot;{phrase}&quot;</span>
              ))}
            </div>
          </div>
        )}

        {sampleOutput && (
          <div className="vt-profile-section">
            <h4>Sample in Your Voice</h4>
            <div className="vt-sample-preview">
              &quot;{sampleOutput}&quot;
            </div>
          </div>
        )}
      </div>

      <div className="vt-profile-actions">
        <button className="vt-secondary-btn" onClick={onEdit}>
          Update Voice
        </button>
        <button className="vt-continue-btn" onClick={onDone}>
          Done - Start Creating
        </button>
      </div>
    </div>
  )
}

function getStyleLabel(value) {
  if (value < 25) return 'Low'
  if (value < 50) return 'Medium-Low'
  if (value < 75) return 'Medium-High'
  return 'High'
}
