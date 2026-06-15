/**
 * AIConsentModal.jsx
 *
 * One-time AI data disclosure overlay (Apple 5.1.1(i) / 5.1.2(i)).
 * Shown on first app load before any AI features are used.
 * Single "Continue" button — disclosure + acknowledgment, not opt-in/opt-out.
 */
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './AIConsentModal.css'

export default function AIConsentModal({ userId, onContinue }) {
  const [saving, setSaving] = useState(false)

  const handleContinue = async () => {
    setSaving(true)

    // Persist to DB for logged-in users
    if (userId) {
      await supabase
        .from('user_stage_progress')
        .update({ ai_consent_given: true })
        .eq('user_id', userId)
        .then()
    }

    // Always persist locally for fast future checks
    localStorage.setItem('ai_consent_given', 'true')
    onContinue()
  }

  return (
    <div className="ai-consent-overlay">
      <div className="ai-consent-card">
        <div className="ai-consent-icon">🤖</div>
        <h1 className="ai-consent-heading">AI-Powered Features</h1>

        <p className="ai-consent-body">
          This app uses AI to personalise your experience. When you use features like
          archetype discovery, avatar generation, and coaching insights, your responses
          are processed by third-party AI services.
        </p>

        <div className="ai-consent-providers">
          <div className="ai-consent-provider">
            <span className="ai-consent-provider-name">Anthropic</span>
            <span className="ai-consent-provider-use">Insights and coaching</span>
          </div>
          <div className="ai-consent-provider">
            <span className="ai-consent-provider-name">Google</span>
            <span className="ai-consent-provider-use">Image generation</span>
          </div>
          <div className="ai-consent-provider">
            <span className="ai-consent-provider-name">OpenAI</span>
            <span className="ai-consent-provider-use">Image generation</span>
          </div>
        </div>

        <p className="ai-consent-note">
          Your data is used only to generate your results and is not stored
          by these providers for model training.
        </p>

        <button
          className="ai-consent-cta"
          onClick={handleContinue}
          disabled={saving}
        >
          {saving ? 'Loading...' : 'Continue'}
        </button>

        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="ai-consent-privacy-link">
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
