/**
 * Step1B_SummaryReview - Review V1 offer data before proceeding
 *
 * Features:
 * - Shows comprehensive summary of V1 offer foundation
 * - Displays persona, niche, obstacles, solutions
 * - Link to edit in Offer Builder if changes needed
 * - Confirm to proceed to Dream Outcome
 */

import { useNavigate } from 'react-router-dom'

const SOLUTION_LABELS = {
  core_product: 'Core Product',
  lead_magnet: 'Lead Magnet',
  bonus: 'Bonus',
  upsell: 'Upsell',
  downsell: 'Downsell'
}

const BUCKET_INFO = {
  wealth: { emoji: '💰', label: 'Wealth', color: '#fbbf24' },
  health: { emoji: '❤️', label: 'Health', color: '#ef4444' },
  love: { emoji: '💕', label: 'Love', color: '#ec4899' }
}

function Step1B_SummaryReview({ selectedOffer, bucket, onConfirm, onBack }) {
  const navigate = useNavigate()

  if (!selectedOffer) {
    return (
      <div className="summary-review">
        <p>No offer selected. Please go back and select an offer.</p>
        <button className="secondary-button" onClick={onBack}>
          ← Back to Selection
        </button>
      </div>
    )
  }

  const bucketInfo = BUCKET_INFO[bucket] || BUCKET_INFO.wealth
  const persona = selectedOffer.persona_profiles
  const niche = selectedOffer.niche_layers || {}
  const problemReasons = selectedOffer.problem_reasons || {}
  const solutions = selectedOffer.solutions || []

  // Group solutions by category
  const solutionsByCategory = solutions.reduce((acc, sol) => {
    const cat = sol.category || 'uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(sol)
    return acc
  }, {})

  // Count obstacles
  const totalObstacles =
    (problemReasons.vehicle_problems?.length || 0) +
    (problemReasons.internal_beliefs?.length || 0) +
    (problemReasons.external_beliefs?.length || 0)

  return (
    <div className="summary-review">
      <div className="question-header">
        <span className="step-label">Step 1 of 8</span>
        <h2>Your Offer Foundation</h2>
        <p className="question-subtitle">
          Review the foundation we'll use to build your Grand Slam Offer.
        </p>
      </div>

      {/* Bucket indicator */}
      <div className="bucket-indicator" style={{ borderColor: bucketInfo.color }}>
        <span className="bucket-emoji">{bucketInfo.emoji}</span>
        <span className="bucket-label">{bucketInfo.label} Bucket</span>
      </div>

      <div className="summary-sections">
        {/* Persona Section */}
        {persona && (
          <div className="summary-section">
            <h3>👤 Target Customer</h3>
            <div className="section-content">
              {persona.name && (
                <div className="summary-row">
                  <span className="row-label">Persona:</span>
                  <span className="row-value">{persona.name}</span>
                </div>
              )}
              {persona.problem_statement && (
                <div className="summary-row">
                  <span className="row-label">Their Problem:</span>
                  <span className="row-value">"{persona.problem_statement}"</span>
                </div>
              )}
              {persona.dream_outcome && (
                <div className="summary-row">
                  <span className="row-label">Dream Outcome:</span>
                  <span className="row-value">"{persona.dream_outcome}"</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Problem Area */}
        {selectedOffer.problem_area && (
          <div className="summary-section">
            <h3>🎯 Problem Area</h3>
            <div className="section-content">
              <p className="problem-text">"{selectedOffer.problem_area}"</p>
            </div>
          </div>
        )}

        {/* Niche Definition */}
        {(niche.what || niche.who || niche.where || niche.when) && (
          <div className="summary-section">
            <h3>🔍 Niche Definition</h3>
            <div className="section-content niche-layers">
              {niche.what && (
                <div className="niche-layer">
                  <span className="layer-label">What:</span>
                  <span className="layer-value">{niche.what}</span>
                </div>
              )}
              {niche.who && (
                <div className="niche-layer">
                  <span className="layer-label">Who:</span>
                  <span className="layer-value">{niche.who}</span>
                </div>
              )}
              {niche.where && (
                <div className="niche-layer">
                  <span className="layer-label">Where:</span>
                  <span className="layer-value">{niche.where}</span>
                </div>
              )}
              {niche.when && (
                <div className="niche-layer">
                  <span className="layer-label">When:</span>
                  <span className="layer-value">{niche.when}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Context */}
        {(selectedOffer.target_pain_level || selectedOffer.target_budget || selectedOffer.target_emotion) && (
          <div className="summary-section">
            <h3>💭 Customer Context</h3>
            <div className="section-content context-grid">
              {selectedOffer.target_pain_level && (
                <div className="context-item">
                  <span className="context-label">Pain Level</span>
                  <span className="context-value">{selectedOffer.target_pain_level}/10</span>
                </div>
              )}
              {selectedOffer.target_budget && (
                <div className="context-item">
                  <span className="context-label">Budget</span>
                  <span className="context-value">{selectedOffer.target_budget}</span>
                </div>
              )}
              {selectedOffer.target_emotion && (
                <div className="context-item">
                  <span className="context-label">Emotion</span>
                  <span className="context-value">{selectedOffer.target_emotion}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Obstacles */}
        {totalObstacles > 0 && (
          <div className="summary-section">
            <h3>🚧 Obstacles Identified ({totalObstacles})</h3>
            <div className="section-content obstacles-summary">
              {problemReasons.vehicle_problems?.length > 0 && (
                <div className="obstacle-category">
                  <span className="category-label">Vehicle Problems:</span>
                  <ul>
                    {problemReasons.vehicle_problems.slice(0, 3).map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                    {problemReasons.vehicle_problems.length > 3 && (
                      <li className="more">+{problemReasons.vehicle_problems.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
              {problemReasons.internal_beliefs?.length > 0 && (
                <div className="obstacle-category">
                  <span className="category-label">Internal Beliefs:</span>
                  <ul>
                    {problemReasons.internal_beliefs.slice(0, 3).map((o, i) => (
                      <li key={i}>"{o}"</li>
                    ))}
                    {problemReasons.internal_beliefs.length > 3 && (
                      <li className="more">+{problemReasons.internal_beliefs.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
              {problemReasons.external_beliefs?.length > 0 && (
                <div className="obstacle-category">
                  <span className="category-label">External Beliefs:</span>
                  <ul>
                    {problemReasons.external_beliefs.slice(0, 3).map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                    {problemReasons.external_beliefs.length > 3 && (
                      <li className="more">+{problemReasons.external_beliefs.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Solutions */}
        {solutions.length > 0 && (
          <div className="summary-section">
            <h3>💡 Solutions ({solutions.length})</h3>
            <div className="section-content solutions-summary">
              {Object.entries(solutionsByCategory).map(([category, sols]) => (
                <div key={category} className="solution-category">
                  <span className="category-badge">
                    {SOLUTION_LABELS[category] || category}
                  </span>
                  <ul>
                    {sols.slice(0, 2).map((sol, i) => (
                      <li key={i}>
                        {sol.description}
                        {sol.differentiators?.length > 0 && (
                          <span className="diff-tags">
                            {sol.differentiators.map(d => (
                              <span key={d} className="diff-tag">{d}</span>
                            ))}
                          </span>
                        )}
                      </li>
                    ))}
                    {sols.length > 2 && (
                      <li className="more">+{sols.length - 2} more</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit link */}
      <div className="edit-section">
        <p>Need to make changes to your foundation?</p>
        <button
          className="text-link"
          onClick={() => navigate('/offer-builder')}
        >
          → Edit in Offer Builder
        </button>
      </div>

      {/* Action buttons */}
      <div className="summary-actions">
        <button className="primary-button" onClick={onConfirm}>
          Continue to Dream Outcome →
        </button>
        <button className="secondary-button" onClick={onBack}>
          ← Choose Different Offer
        </button>
      </div>
    </div>
  )
}

export default Step1B_SummaryReview
