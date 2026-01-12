/**
 * Step 7: Voice Generation
 * Sends data to AI for analysis and shows the generated profile
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function Step7_Generation({ voiceData, userId, onComplete, onBack }) {
  const [status, setStatus] = useState('analyzing') // analyzing, complete, error
  const [generatedProfile, setGeneratedProfile] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    generateVoiceProfile()
  }, [])

  async function generateVoiceProfile() {
    try {
      setStatus('analyzing')

      // Call Edge Function to analyze voice
      const { data, error: fnError } = await supabase.functions.invoke('voice-analyzer', {
        body: {
          userId,
          voiceData
        }
      })

      if (fnError) throw fnError

      setGeneratedProfile(data.profile)
      setStatus('complete')
    } catch (err) {
      console.error('Voice generation error:', err)
      setError(err.message || 'Failed to analyze voice')
      setStatus('error')
    }
  }

  if (status === 'analyzing') {
    return (
      <div className="vt-step" style={{ textAlign: 'center', padding: '60px 32px' }}>
        <div className="vt-spinner" style={{ margin: '0 auto 24px' }}></div>
        <h2 style={{ marginBottom: '12px' }}>Analyzing Your Voice...</h2>
        <p style={{ color: '#6c757d' }}>
          We&apos;re studying your writing patterns, word choices, and style preferences
          to create your unique voice profile.
        </p>
        <div style={{ marginTop: '32px', fontSize: '14px', color: '#adb5bd' }}>
          This usually takes 10-20 seconds
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="vt-step" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <h2 style={{ marginBottom: '12px' }}>Something went wrong</h2>
        <p style={{ color: '#6c757d', marginBottom: '24px' }}>
          {error || 'We couldn\'t generate your voice profile. Please try again.'}
        </p>
        <button className="vt-continue-btn" onClick={generateVoiceProfile}>
          Try Again
        </button>
        <button className="vt-secondary-btn" onClick={onBack}>
          ← Go Back
        </button>
      </div>
    )
  }

  // Voice Profile Card
  return (
    <div className="vt-profile-card">
      <div className="vt-profile-header">
        <div className="vt-profile-icon">🎙️</div>
        <h2 className="vt-profile-name">Your Voice Profile</h2>
        <div className="vt-profile-badge">
          {generatedProfile?.voiceType || 'Custom Voice'}
        </div>
      </div>

      <div className="vt-profile-body">
        <div className="vt-profile-summary">
          {generatedProfile?.summary ||
            'Your unique voice has been captured. AI content will now match your authentic style.'}
        </div>

        {generatedProfile?.traits && generatedProfile.traits.length > 0 && (
          <div className="vt-profile-section">
            <h4>Voice Traits</h4>
            <div className="vt-traits">
              {generatedProfile.traits.map((trait, i) => (
                <span key={i} className="vt-trait">{trait}</span>
              ))}
            </div>
          </div>
        )}

        {generatedProfile?.patterns && (
          <div className="vt-profile-section">
            <h4>Writing Patterns</h4>
            <div style={{ fontSize: '14px', color: '#495057', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Hook style:</strong> {generatedProfile.patterns.hookStyle || 'Direct'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Sentence flow:</strong> {generatedProfile.patterns.sentenceFlow || 'Varied'}
              </div>
              <div>
                <strong>Emotional tone:</strong> {generatedProfile.patterns.emotionalTone || 'Warm'}
              </div>
            </div>
          </div>
        )}

        {generatedProfile?.sampleOutput && (
          <div className="vt-profile-section">
            <h4>Sample in Your Voice</h4>
            <div className="vt-sample-preview">
              &quot;{generatedProfile.sampleOutput}&quot;
            </div>
          </div>
        )}
      </div>

      <div className="vt-profile-actions">
        <button className="vt-secondary-btn" onClick={onBack}>
          ← Adjust Answers
        </button>
        <button className="vt-continue-btn" onClick={() => onComplete(generatedProfile)}>
          Save My Voice
        </button>
      </div>
    </div>
  )
}
