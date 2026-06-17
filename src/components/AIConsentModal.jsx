/**
 * AIConsentModal.jsx
 *
 * One-time AI data consent overlay (Apple 5.1.1(i) / 5.1.2(i)).
 * Shown on first app load before any AI features are used.
 * "Allow" grants consent; "Don't Allow" shows a graceful exit screen.
 */
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './AIConsentModal.css'

export default function AIConsentModal({ userId, onContinue }) {
  const [saving, setSaving] = useState(false)
  const [declined, setDeclined] = useState(false)

  const handleAllow = async () => {
    setSaving(true)
    try {
      if (userId) {
        await supabase
          .from('user_stage_progress')
          .update({ ai_consent_given: true })
          .eq('user_id', userId)
      }
    } catch (e) {
      console.error('AI consent save failed:', e)
    }

    localStorage.setItem('ai_consent_given', 'true')
    onContinue()
  }

  if (declined) {
    return (
      <div className="ai-consent-overlay">
        <div className="ai-consent-card">
          <div className="ai-consent-icon">🔒</div>
          <h1 className="ai-consent-heading">AI Features Required</h1>

          <p className="ai-consent-body">
            Vibe Rise uses AI to create personalised insights, coaching,
            and visual content throughout the app. Without AI features,
            the app cannot function.
          </p>

          <p className="ai-consent-body">
            If you change your mind, simply reopen the app.
          </p>

          <button
            className="ai-consent-cta"
            onClick={() => setDeclined(false)}
          >
            Go Back
          </button>

          <div className="ai-consent-declined-links">
            <a href="mailto:huzz@nichuzz.com" className="ai-consent-privacy-link">
              Contact Us
            </a>
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="ai-consent-privacy-link">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-consent-overlay">
      <div className="ai-consent-card">
        <div className="ai-consent-icon">🌞</div>
        <h1 className="ai-consent-heading">AI-Powered Features</h1>

        <p className="ai-consent-body">
          This app uses AI to personalise your experience. When you use features like
          archetype discovery, avatar generation, and coaching insights, your responses
          and profile information are sent to the following services:
        </p>

        <div className="ai-consent-providers">
          <div className="ai-consent-provider">
            <span className="ai-consent-provider-name">Anthropic (Claude)</span>
            <span className="ai-consent-provider-use">Insights and coaching</span>
          </div>
          <div className="ai-consent-provider">
            <span className="ai-consent-provider-name">Google (Gemini)</span>
            <span className="ai-consent-provider-use">Image generation</span>
          </div>
          <div className="ai-consent-provider">
            <span className="ai-consent-provider-name">OpenAI (GPT-4o)</span>
            <span className="ai-consent-provider-use">Image generation</span>
          </div>
        </div>

        <p className="ai-consent-note">
          Your data is used only to generate your results and is not stored
          by these providers for model training. See our Privacy Policy for full details.
        </p>

        <button
          className="ai-consent-cta"
          onClick={handleAllow}
          disabled={saving}
        >
          {saving ? 'Loading...' : 'Allow'}
        </button>

        <button
          className="ai-consent-decline"
          onClick={() => setDeclined(true)}
        >
          Don't Allow
        </button>

        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="ai-consent-privacy-link">
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
