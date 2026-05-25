import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { trackCtaInterest, trackCtaContinue } from '../lib/abTesting'
import './PublicFlowCTA.css'

// Wealth ladder stages for roadmap visual
// Each stage maps to a wealth ladder position
const WEALTH_LADDER_STAGES = [
  { level: 1, name: 'Validation', description: 'Validate your offer with real customers', icon: '🎯', wealthLadder: 'pre_ladder' },
  { level: 2, name: 'Product Creation', description: 'Build your core offer & lead magnet', icon: '🛠️', wealthLadder: 'service' },
  { level: 3, name: 'Testing', description: 'Test with users, gather feedback', icon: '🧪', wealthLadder: 'service' },
  { level: 4, name: 'Money Models', description: 'Upsells, downsells & continuity', icon: '💰', wealthLadder: 'productized' },
  { level: 5, name: 'Campaign', description: 'Lead generation strategy', icon: '📢', wealthLadder: 'productized' },
  { level: 6, name: 'Launch', description: 'Execute with your leads funnel', icon: '🚀', wealthLadder: 'products' }
]

// Map wealth ladder position to starting stage
const WEALTH_LADDER_TO_STAGE = {
  pre_ladder: 1,
  service: 2,
  productized: 4,
  products: 6
}

// Interest options for AI tools question
const AI_INTEREST_OPTIONS = [
  { value: 'yes', label: "Yes, I'm interested!", icon: '🚀' },
  { value: 'maybe', label: 'Maybe later', icon: '🤔' },
  { value: 'no', label: 'No thanks', icon: '👋' }
]

/**
 * PublicFlowCTA - CTA section for public flows
 * Shows AI interest question, wealth ladder roadmap, and launch notification CTA
 *
 * @param {string} email - User's email (captured earlier)
 * @param {string} flowType - Source flow type
 * @param {object} flowResults - Results from the flow (for lead enrichment)
 * @param {object} answers - User answers from the flow (to determine wealth ladder position)
 */
export default function PublicFlowCTA({ email, flowType, flowResults, answers = {} }) {
  const [selectedInterest, setSelectedInterest] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [launchNotifySubmitting, setLaunchNotifySubmitting] = useState(false)
  const [launchNotifySubmitted, setLaunchNotifySubmitted] = useState(false)

  // Get session token
  const sessionToken = sessionStorage.getItem('publicFlowSession') || 'unknown'

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
          ai_tools_interest: interest
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })

      // Track conversion
      await trackCtaInterest(sessionToken, email, interest, flowType)
    } catch (err) {
      console.error('Error saving lead:', err)
    }

    setIsSubmitting(false)
    setHasSubmitted(true)
  }

  const handleLaunchNotify = async () => {
    setLaunchNotifySubmitting(true)

    try {
      // Update public_leads with launch notification interest
      await supabase
        .from('public_leads')
        .upsert({
          email: email,
          source_flow: flowType,
          launch_notify: true,
          launch_notify_at: new Date().toISOString()
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })

      // Track conversion
      await trackCtaContinue(sessionToken, email, flowType)
    } catch (err) {
      console.error('Error saving launch notification interest:', err)
    }

    setLaunchNotifySubmitting(false)
    setLaunchNotifySubmitted(true)
  }

  return (
    <div className="public-cta">
      <div className="public-cta-content">
        {/* AI Tools Interest Question */}
        <div className="cta-ai-section">
          <h3 className="public-cta-title">Want to learn how to build an app with AI to support your clients?</h3>

          {!hasSubmitted ? (
            <div className="public-cta-options">
              {AI_INTEREST_OPTIONS.map(option => (
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
        </div>

        {/* Wealth Ladder Roadmap */}
        <div className="cta-roadmap-section">
          <h4 className="roadmap-title">Your Scaling Roadmap</h4>
          <p className="roadmap-subtitle">The 6 stages to building a profitable business</p>

          <div className="roadmap-ladder">
            {WEALTH_LADDER_STAGES.map((stage, index) => {
              // Determine user's current stage from wealth ladder answer
              const userWealthLadder = answers?.q2_wealth_ladder?.value
              const userCurrentStage = userWealthLadder ? WEALTH_LADDER_TO_STAGE[userWealthLadder] : null
              const isCurrentStage = userCurrentStage === stage.level
              const isCompletedStage = userCurrentStage && stage.level < userCurrentStage
              const isFutureStage = userCurrentStage && stage.level > userCurrentStage

              return (
                <div
                  key={stage.level}
                  className={`roadmap-rung ${isCurrentStage ? 'current' : ''} ${isCompletedStage ? 'completed' : ''} ${isFutureStage ? 'future' : ''}`}
                >
                  <div className="rung-connector">
                    {index < WEALTH_LADDER_STAGES.length - 1 && <div className={`connector-line ${isCompletedStage ? 'completed' : ''}`} />}
                  </div>
                  <div className={`rung-icon ${isCurrentStage ? 'current' : ''} ${isCompletedStage ? 'completed' : ''}`}>
                    {isCompletedStage ? '✓' : stage.icon}
                  </div>
                  <div className="rung-content">
                    <span className="rung-level">
                      Stage {stage.level}
                      {isCurrentStage && <span className="you-are-here"> ← You are here</span>}
                    </span>
                    <span className={`rung-name ${isCurrentStage ? 'current' : ''}`}>{stage.name}</span>
                    <span className="rung-description">{stage.description}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Launch Notification Button */}
        {!launchNotifySubmitted ? (
          <button
            className="public-cta-scaling"
            onClick={handleLaunchNotify}
            disabled={launchNotifySubmitting}
          >
            {launchNotifySubmitting ? 'Saving...' : 'Keen to learn more about scaling your business and be notified when Vibe Rise launches?'}
          </button>
        ) : (
          <div className="launch-notify-success">
            <span className="launch-notify-icon">🎉</span>
            <p>You're on the list! We'll let you know when Vibe Rise is ready.</p>
          </div>
        )}
      </div>
    </div>
  )
}
