import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCtaVariant, trackCtaInterest, trackCtaContinue } from '../lib/abTesting'
import './PublicFlowCTA.css'

const LANDING_PAGE_URL = 'https://findmyflow.nichuzz.com'

/**
 * PublicFlowCTA - CTA section for public flows with A/B testing
 * Tests different CTA variants to optimize conversion
 *
 * @param {string} email - User's email (captured earlier)
 * @param {string} flowType - Source flow type
 * @param {object} flowResults - Results from the flow (for lead enrichment)
 */
export default function PublicFlowCTA({ email, flowType, flowResults }) {
  const [variant, setVariant] = useState(null)
  const [selectedInterest, setSelectedInterest] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Get session token
  const sessionToken = sessionStorage.getItem('publicFlowSession') || 'unknown'

  // Get A/B test variant on mount
  useEffect(() => {
    const v = getCtaVariant(sessionToken)
    setVariant(v)
  }, [sessionToken])

  const handleSelect = async (interest) => {
    setSelectedInterest(interest)
    setIsSubmitting(true)

    try {
      // Save to public_leads
      await supabase
        .from('public_leads')
        .upsert({
          email: email,
          source_flow: flowType,
          flow_results: flowResults,
          ai_tools_interest: interest,
          ab_variant: variant?.id || 'unknown'
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })

      // Track A/B conversion
      await trackCtaInterest(sessionToken, email, interest, flowType)
    } catch (err) {
      console.error('Error saving lead:', err)
      // Continue anyway - don't block the user
    }

    setIsSubmitting(false)
    setHasSubmitted(true)
  }

  const handleContinue = async () => {
    // Track continue click
    await trackCtaContinue(sessionToken, email, flowType)
    window.location.href = LANDING_PAGE_URL
  }

  // Show loading state while variant loads
  if (!variant) {
    return (
      <div className="public-cta">
        <div className="public-cta-content">
          <div className="cta-loading">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="public-cta">
      <div className="public-cta-content">
        <h3 className="public-cta-title">{variant.title}</h3>

        {!hasSubmitted ? (
          <div className="public-cta-options">
            {variant.interestOptions.map(option => (
              <button
                key={option.value}
                className={`cta-option ${selectedInterest === option.value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
                disabled={isSubmitting}
              >
                <span className="cta-option-icon">{option.icon}</span>
                <span className="cta-option-label">{option.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="public-cta-thanks">
            <p>
              {selectedInterest === 'yes' && "Awesome! We'll be in touch with resources to help you get started."}
              {selectedInterest === 'maybe' && "No problem! Feel free to explore when you're ready."}
              {selectedInterest === 'no' && "Thanks for trying out the flow!"}
            </p>
          </div>
        )}

        <button
          className="public-cta-continue"
          onClick={handleContinue}
          disabled={!hasSubmitted && !selectedInterest}
        >
          {variant.continueButton}
        </button>
      </div>
    </div>
  )
}
