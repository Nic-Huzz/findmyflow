/**
 * Step7_FinalSelection - Compare all 3 versions and choose one
 *
 * Features:
 * - Side-by-side comparison of Service/Productized/Product (aligned with wealth ladder)
 * - Shows all accumulated data (proof, speed, ease, bonuses)
 * - Calculates preliminary Grand Slam Score for each
 * - User selects their preferred version
 */

import { useState, useMemo } from 'react'

function Step7_FinalSelection({ offerData, contextData, onComplete, setError }) {
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'

  const { versions, proofAnalysis, speedAnalysis, easeAnalysis, bonuses, dreamOutcome, bucket } = offerData

  // Extract customer solution preferences from validation data
  const customerPreferences = contextData?.validationData?.solutionPreferences
  const hasCustomerPreferences = customerPreferences?.hasPreferences && customerPreferences?.totalVotes > 0

  // Calculate preliminary scores for comparison
  const scores = useMemo(() => {
    const calculateScore = (version) => {
      if (!versions?.[version]) return null

      // Get component scores (or use defaults)
      const proofScore = proofAnalysis?.[version]?.proof_score || 5
      const speedScore = speedAnalysis?.[version]?.timeDelayScore || 5
      const easeScore = easeAnalysis?.[version]?.effortScore || 5

      // Calculate total bonus value
      const bonusValue = bonuses?.[version]?.reduce((sum, b) => sum + (b.perceivedValue || 0), 0) || 0

      // Hormozi Value Equation: Dream Outcome × Perceived Likelihood / Time Delay × Effort
      // Normalized to 100-point scale
      const dreamScore = 8 // Base dream outcome score (already validated)
      const likelihoodScore = proofScore // Proof increases perceived likelihood
      const timeDelayInverse = (11 - speedScore) // Invert: lower delay = higher score
      const effortInverse = (11 - easeScore) // Invert: lower effort = higher score

      // Calculate raw score
      const numerator = dreamScore * likelihoodScore
      const denominator = Math.max(timeDelayInverse * effortInverse, 1)
      const rawScore = numerator / denominator

      // Normalize to 0-100 with bonus multiplier
      const bonusMultiplier = 1 + (bonusValue / 10000) // Small boost for bonus value
      const normalizedScore = Math.min(Math.round(rawScore * 10 * bonusMultiplier), 100)

      return {
        total: normalizedScore,
        proofScore,
        speedScore,
        easeScore,
        bonusValue,
        grade: getGrade(normalizedScore)
      }
    }

    return {
      service: calculateScore('service'),
      productized: calculateScore('productized'),
      product: calculateScore('product')
    }
  }, [versions, proofAnalysis, speedAnalysis, easeAnalysis, bonuses])

  // Get letter grade from score
  function getGrade(score) {
    if (score >= 90) return { letter: 'A+', color: '#22c55e', label: 'Grand Slam' }
    if (score >= 80) return { letter: 'A', color: '#4ade80', label: 'Excellent' }
    if (score >= 70) return { letter: 'B+', color: '#84cc16', label: 'Very Good' }
    if (score >= 60) return { letter: 'B', color: '#facc15', label: 'Good' }
    if (score >= 50) return { letter: 'C', color: '#fb923c', label: 'Average' }
    return { letter: 'D', color: '#ef4444', label: 'Needs Work' }
  }

  // Get recommendation
  const recommendation = useMemo(() => {
    const serviceScore = scores.service?.total || 0
    const productizedScore = scores.productized?.total || 0
    const productScore = scores.product?.total || 0

    const max = Math.max(serviceScore, productizedScore, productScore)

    if (max === serviceScore) return 'service'
    if (max === productizedScore) return 'productized'
    return 'product'
  }, [scores])

  // Handle selection
  const handleSelect = (version) => {
    setSelectedVersion(version)
  }

  // Continue to final step
  const handleContinue = () => {
    if (!selectedVersion) {
      setError('Please select a version to continue.')
      return
    }
    onComplete(selectedVersion, scores[selectedVersion])
  }

  const versionLabels = {
    service: { icon: '💼', name: 'Service', desc: 'Someone does it for me' },
    productized: { icon: '📦', name: 'Productized', desc: 'A guided process' },
    product: { icon: '🛠️', name: 'Product', desc: 'Tools I use myself' }
  }

  return (
    <div className="final-selection-step">
      <div className="question-header">
        <span className="step-label">Step 7 of 8</span>
        <h2>Choose Your Grand Slam Offer</h2>
      </div>

      <p className="question-subtitle">
        Compare all 3 versions with their complete data. Select the one that fits your goals.
      </p>

      {/* View toggle */}
      <div className="view-toggle">
        <button
          className={viewMode === 'cards' ? 'active' : ''}
          onClick={() => setViewMode('cards')}
        >
          Card View
        </button>
        <button
          className={viewMode === 'table' ? 'active' : ''}
          onClick={() => setViewMode('table')}
        >
          Table View
        </button>
      </div>

      {/* AI Recommendation */}
      <div className="ai-recommendation">
        <span className="rec-icon">🤖</span>
        <span>AI Recommends: </span>
        <strong>{versionLabels[recommendation].icon} {versionLabels[recommendation].name}</strong>
        <span className="rec-score">Score: {scores[recommendation]?.total}</span>
      </div>

      {/* Customer Preferences from Validation Surveys */}
      {hasCustomerPreferences && (
        <div className="customer-preferences">
          <div className="preferences-header">
            <span className="pref-icon">📊</span>
            <span>Your Customers Prefer: </span>
            <strong>
              {versionLabels[customerPreferences.recommendedVersion]?.icon}{' '}
              {versionLabels[customerPreferences.recommendedVersion]?.name}
            </strong>
            <span className="pref-votes">
              ({customerPreferences.breakdown[customerPreferences.recommendedVersion]} of {customerPreferences.totalVotes} votes)
            </span>
          </div>

          {/* Vote breakdown */}
          <div className="preferences-breakdown">
            {['service', 'productized', 'product'].map(version => {
              const count = customerPreferences.breakdown[version]
              const percentage = Math.round((count / customerPreferences.totalVotes) * 100)
              const isWinner = version === customerPreferences.recommendedVersion
              return (
                <div key={version} className={`breakdown-bar ${isWinner ? 'winner' : ''}`}>
                  <span className="bar-label">{versionLabels[version]?.icon} {versionLabels[version]?.name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="bar-count">{count}</span>
                </div>
              )
            })}
          </div>

          {/* Specific types requested */}
          {customerPreferences.recommendedVersion && customerPreferences.specificTypes[customerPreferences.recommendedVersion]?.length > 0 && (
            <div className="specific-types">
              <span className="types-label">They specifically want:</span>
              <div className="types-list">
                {customerPreferences.specificTypes[customerPreferences.recommendedVersion].slice(0, 3).map((type, i) => (
                  <span key={i} className="type-chip">
                    {type.text} {type.count > 1 && <span className="type-count">×{type.count}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="version-cards">
          {['service', 'productized', 'product'].map((version) => {
            const versionData = versions?.[version]
            const score = scores[version]
            const label = versionLabels[version]
            const isSelected = selectedVersion === version
            const isRecommended = recommendation === version

            if (!versionData) return null

            return (
              <div
                key={version}
                className={`version-card ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
                onClick={() => handleSelect(version)}
              >
                {isRecommended && <div className="recommended-badge">Recommended</div>}

                <div className="card-header">
                  <span className="version-icon">{label.icon}</span>
                  <h3>{versionData.name || label.name}</h3>
                  <p className="version-type">{label.desc}</p>
                </div>

                {/* Grand Slam Score */}
                <div className="score-display" style={{ borderColor: score?.grade.color }}>
                  <div className="score-number">{score?.total}</div>
                  <div className="score-grade" style={{ color: score?.grade.color }}>
                    {score?.grade.letter}
                  </div>
                  <div className="score-label">{score?.grade.label}</div>
                </div>

                {/* Value Equation Breakdown */}
                <div className="score-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Proof</span>
                    <span className="breakdown-value">{score?.proofScore}/10</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Speed</span>
                    <span className="breakdown-value">{score?.speedScore}/10</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Ease</span>
                    <span className="breakdown-value">{score?.easeScore}/10</span>
                  </div>
                </div>

                {/* Price & Revenue */}
                <div className="price-section">
                  <div className="price">
                    <span className="price-label">Price</span>
                    <span className="price-value">${versionData.suggestedPrice?.toLocaleString()}</span>
                  </div>
                  <div className="revenue">
                    <span className="revenue-label">Month 3 Revenue</span>
                    <span className="revenue-value">${versionData.revenue?.month3?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Bonus Stack */}
                <div className="bonus-section">
                  <span className="bonus-label">Bonus Stack Value</span>
                  <span className="bonus-value">${score?.bonusValue?.toLocaleString()}</span>
                </div>

                {/* Quick Stats */}
                <div className="quick-stats">
                  <div className="stat">
                    <span className="stat-label">Setup Time</span>
                    <span className="stat-value">{versionData.investment?.setupTimeline || 'N/A'}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Max Customers/Mo</span>
                    <span className="stat-value">{versionData.maxCustomersPerMonth || 'N/A'}</span>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  className={`select-btn ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(version)
                  }}
                >
                  {isSelected ? '✓ Selected' : 'Select This Version'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="comparison-table-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th
                  className={selectedVersion === 'service' ? 'selected' : ''}
                  onClick={() => handleSelect('service')}
                >
                  {versionLabels.service.icon} Service
                </th>
                <th
                  className={selectedVersion === 'productized' ? 'selected' : ''}
                  onClick={() => handleSelect('productized')}
                >
                  {versionLabels.productized.icon} Productized
                </th>
                <th
                  className={selectedVersion === 'product' ? 'selected' : ''}
                  onClick={() => handleSelect('product')}
                >
                  {versionLabels.product.icon} Product
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="score-row">
                <td>Grand Slam Score</td>
                <td style={{ color: scores.service?.grade.color }}>{scores.service?.total} ({scores.service?.grade.letter})</td>
                <td style={{ color: scores.productized?.grade.color }}>{scores.productized?.total} ({scores.productized?.grade.letter})</td>
                <td style={{ color: scores.product?.grade.color }}>{scores.product?.total} ({scores.product?.grade.letter})</td>
              </tr>
              <tr>
                <td>Price</td>
                <td>${versions?.service?.suggestedPrice?.toLocaleString()}</td>
                <td>${versions?.productized?.suggestedPrice?.toLocaleString()}</td>
                <td>${versions?.product?.suggestedPrice?.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Proof Score</td>
                <td>{scores.service?.proofScore}/10</td>
                <td>{scores.productized?.proofScore}/10</td>
                <td>{scores.product?.proofScore}/10</td>
              </tr>
              <tr>
                <td>Speed Score</td>
                <td>{scores.service?.speedScore}/10</td>
                <td>{scores.productized?.speedScore}/10</td>
                <td>{scores.product?.speedScore}/10</td>
              </tr>
              <tr>
                <td>Ease Score</td>
                <td>{scores.service?.easeScore}/10</td>
                <td>{scores.productized?.easeScore}/10</td>
                <td>{scores.product?.easeScore}/10</td>
              </tr>
              <tr>
                <td>Bonus Value</td>
                <td>${scores.service?.bonusValue?.toLocaleString()}</td>
                <td>${scores.productized?.bonusValue?.toLocaleString()}</td>
                <td>${scores.product?.bonusValue?.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Month 3 Revenue</td>
                <td>${versions?.service?.revenue?.month3?.toLocaleString()}</td>
                <td>${versions?.productized?.revenue?.month3?.toLocaleString()}</td>
                <td>${versions?.product?.revenue?.month3?.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Setup Timeline</td>
                <td>{versions?.service?.investment?.setupTimeline}</td>
                <td>{versions?.productized?.investment?.setupTimeline}</td>
                <td>{versions?.product?.investment?.setupTimeline}</td>
              </tr>
              <tr>
                <td>Max Customers/Mo</td>
                <td>{versions?.service?.maxCustomersPerMonth}</td>
                <td>{versions?.productized?.maxCustomersPerMonth}</td>
                <td>{versions?.product?.maxCustomersPerMonth}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Selection Summary */}
      {selectedVersion && (
        <div className="selection-summary">
          <h4>You've selected: {versionLabels[selectedVersion].icon} {versionLabels[selectedVersion].name}</h4>
          <p>"{versions?.[selectedVersion]?.name}"</p>
          <p className="summary-score">
            Grand Slam Score: <strong style={{ color: scores[selectedVersion]?.grade.color }}>
              {scores[selectedVersion]?.total} ({scores[selectedVersion]?.grade.letter})
            </strong>
          </p>
        </div>
      )}

      <button
        className="primary-button"
        onClick={handleContinue}
        disabled={!selectedVersion}
      >
        Generate My Grand Slam Offer →
      </button>
    </div>
  )
}

export default Step7_FinalSelection
