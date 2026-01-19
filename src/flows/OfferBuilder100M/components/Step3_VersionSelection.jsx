/**
 * Step3_VersionSelection - Select which offer versions to build
 *
 * Flow:
 * 1. Show validation data about solution type preferences
 * 2. Let user select which version(s) to build (1, 2, or all 3)
 * 3. Generate AI versions only for selected types
 *
 * Solution Types:
 * - Service: "Someone does it for me"
 * - Productized: "A guided process"
 * - Product: "Tools I use myself"
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const VERSION_INFO = {
  service: {
    icon: '💼',
    label: 'Service',
    sublabel: 'Someone does it for me',
    description: 'Done-for-you service where you do the work for clients',
    examples: 'Coaching, consulting, agency work, freelancing'
  },
  productized: {
    icon: '📦',
    label: 'Productized',
    sublabel: 'A guided process',
    description: 'Structured program or course that guides clients through',
    examples: 'Online courses, group programs, bootcamps, memberships'
  },
  product: {
    icon: '🛠️',
    label: 'Product',
    sublabel: 'Tools I use myself',
    description: 'Self-serve product or tool clients use independently',
    examples: 'Templates, software, apps, digital products'
  }
}

function Step3_VersionSelection({ bucket, dreamOutcome, contextData, onComplete, setIsLoading, setError }) {
  // State
  const [selectedTypes, setSelectedTypes] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVersions, setGeneratedVersions] = useState(null)
  const [generationProgress, setGenerationProgress] = useState({
    analyzing: false,
    generating: false,
    finalizing: false
  })

  // Extract validation solution preferences
  const validationData = contextData?.validationData
  const solutionPrefs = validationData?.solutionPreferences || {}
  const hasValidationData = solutionPrefs.hasPreferences && solutionPrefs.totalVotes > 0

  // Calculate percentages for display
  const breakdown = solutionPrefs.breakdown || { service: 0, productized: 0, product: 0 }
  const totalVotes = solutionPrefs.totalVotes || 0
  const getPercentage = (type) => totalVotes > 0 ? Math.round((breakdown[type] / totalVotes) * 100) : 0

  // Get recommended version
  const recommendedVersion = solutionPrefs.recommendedVersion
  const confidence = solutionPrefs.confidence || 0

  // Extract V1 core product solutions for context
  const v1Data = contextData?.offerBuilderData
  const v1CoreProducts = v1Data?.solutions?.filter(sol => sol.category === 'core_product') || []

  // Toggle version selection
  const toggleVersion = (type) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type)
      } else {
        return [...prev, type]
      }
    })
  }

  // Select all versions
  const selectAll = () => {
    setSelectedTypes(['service', 'productized', 'product'])
  }

  // Generate versions for selected types
  const handleGenerate = async () => {
    if (selectedTypes.length === 0) return

    setIsGenerating(true)
    setGenerationProgress({ analyzing: true, generating: false, finalizing: false })

    try {
      // Short delay for UX
      await new Promise(r => setTimeout(r, 500))
      setGenerationProgress({ analyzing: true, generating: true, finalizing: false })

      // Prepare V1 foundation data for AI context
      const v1Foundation = v1Data ? {
        coreProducts: v1CoreProducts.map(sol => ({
          description: sol.description,
          type: sol.solutionType,
          differentiators: sol.differentiators,
          problemSolved: sol.problemText
        })),
        niche: v1Data.niche_layers,
        problemArea: v1Data.problem_area
      } : null

      const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
        body: {
          action: 'generate_versions',
          context: {
            bucket,
            dreamOutcome,
            skills: contextData?.skills,
            persona: contextData?.persona,
            validationData: contextData?.validationData,
            offerBuilderV1: v1Foundation,
            // Only generate for selected types
            selectedTypes
          }
        }
      })

      if (error) throw error

      setGenerationProgress({ analyzing: true, generating: true, finalizing: true })
      await new Promise(r => setTimeout(r, 500))

      setGeneratedVersions(data.versions)
    } catch (err) {
      console.error('Error generating versions:', err)
      setError('Failed to generate offer versions. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Complete step
  const handleComplete = () => {
    // Build versions object with only selected types
    const versions = {
      service: selectedTypes.includes('service') ? generatedVersions?.service : null,
      productized: selectedTypes.includes('productized') ? generatedVersions?.productized : null,
      product: selectedTypes.includes('product') ? generatedVersions?.product : null
    }
    onComplete(versions, selectedTypes)
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="version-selection generating">
        <div className="question-header">
          <span className="step-label">Step 3 of 9</span>
          <h2>Creating your offer versions...</h2>
        </div>

        <div className="generation-info">
          <p>
            Building {selectedTypes.length} version{selectedTypes.length > 1 ? 's' : ''} for:
            <strong> "{dreamOutcome}"</strong>
          </p>
        </div>

        <div className="generation-progress">
          <div className="spinner large"></div>
          <p className="progress-text">This takes 15-20 seconds</p>

          <div className="progress-steps">
            <div className={`progress-step ${generationProgress.analyzing ? 'active' : ''}`}>
              {generationProgress.analyzing ? '✓' : '○'} Analyzing your skills & foundation
            </div>
            <div className={`progress-step ${generationProgress.generating ? 'active' : ''}`}>
              {generationProgress.generating ? '✓' : '○'} Generating {selectedTypes.length} delivery format{selectedTypes.length > 1 ? 's' : ''}
            </div>
            <div className={`progress-step ${generationProgress.finalizing ? 'active' : ''}`}>
              {generationProgress.finalizing ? '✓' : '○'} Calculating investment & revenue
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show generated versions for review
  if (generatedVersions) {
    return (
      <div className="version-selection review">
        <div className="question-header">
          <span className="step-label">Step 3 of 9</span>
          <h2>Here {selectedTypes.length === 1 ? 'is your' : 'are your'} offer version{selectedTypes.length > 1 ? 's' : ''}</h2>
        </div>

        <div className="versions-intro">
          <p>
            You'll build proof stacks, speed advantages, ease factors, and bonuses
            for {selectedTypes.length === 1 ? 'this version' : 'each version'}.
          </p>
          {selectedTypes.length > 1 && (
            <p className="versions-note">
              <em>At the end, we'll compare them and you'll choose the winner.</em>
            </p>
          )}
        </div>

        <div className="versions-grid">
          {selectedTypes.map(type => {
            const info = VERSION_INFO[type]
            const version = generatedVersions[type]

            if (!version) return null

            return (
              <VersionCard
                key={type}
                type={type}
                icon={info.icon}
                label={`VERSION: ${info.label.toUpperCase()}`}
                sublabel={info.sublabel}
                version={version}
              />
            )
          })}
        </div>

        <div className="versions-footer">
          <p>Next: We'll build proof stacks for {selectedTypes.length === 1 ? 'your version' : 'all versions'}.</p>
          <button className="primary-button" onClick={handleComplete}>
            Continue to Proof Stack Builder →
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              setGeneratedVersions(null)
              setSelectedTypes([])
            }}
          >
            ← Choose Different Versions
          </button>
        </div>
      </div>
    )
  }

  // Version selection UI
  return (
    <div className="version-selection">
      <div className="question-header">
        <span className="step-label">Step 3 of 9</span>
        <h2>Which version{selectedTypes.length !== 1 ? 's' : ''} will you build?</h2>
        <p className="question-subtitle">
          Select one or more delivery formats for your offer.
        </p>
      </div>

      {/* Validation Data - Customer Preferences */}
      {hasValidationData && (
        <div className="customer-preferences">
          <h3>What Your Customers Prefer</h3>
          <p className="prefs-subtitle">
            Based on {totalVotes} validation response{totalVotes !== 1 ? 's' : ''}
          </p>

          <div className="preference-bars">
            {['service', 'productized', 'product'].map(type => {
              const percent = getPercentage(type)
              const isRecommended = type === recommendedVersion
              const info = VERSION_INFO[type]

              return (
                <div
                  key={type}
                  className={`preference-bar ${isRecommended ? 'recommended' : ''}`}
                >
                  <div className="bar-header">
                    <span className="bar-icon">{info.icon}</span>
                    <span className="bar-label">{info.label}</span>
                    {isRecommended && (
                      <span className="recommended-badge">Most Preferred</span>
                    )}
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="bar-value">
                    {percent}% ({breakdown[type]} vote{breakdown[type] !== 1 ? 's' : ''})
                  </div>
                </div>
              )
            })}
          </div>

          {/* Specific type preferences */}
          {Object.entries(solutionPrefs.specificTypes || {}).some(([_, types]) => types.length > 0) && (
            <div className="specific-preferences">
              <h4>Specific Formats Requested</h4>
              <div className="specific-grid">
                {Object.entries(solutionPrefs.specificTypes || {}).map(([type, types]) => {
                  if (!types.length) return null
                  const info = VERSION_INFO[type]
                  return (
                    <div key={type} className="specific-category">
                      <span className="specific-icon">{info.icon}</span>
                      <div className="specific-list">
                        {types.slice(0, 3).map((t, i) => (
                          <span key={i} className="specific-tag">
                            {t.text} ({t.count})
                          </span>
                        ))}
                        {types.length > 3 && (
                          <span className="specific-more">+{types.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No validation data message */}
      {!hasValidationData && (
        <div className="no-validation-data">
          <p>
            💡 <strong>Tip:</strong> Run a validation survey to discover which
            format your customers prefer before deciding.
          </p>
        </div>
      )}

      {/* Version Selection Cards */}
      <div className="version-options">
        {['service', 'productized', 'product'].map(type => {
          const info = VERSION_INFO[type]
          const isSelected = selectedTypes.includes(type)
          const isRecommended = type === recommendedVersion && hasValidationData

          return (
            <button
              key={type}
              className={`version-option ${isSelected ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
              onClick={() => toggleVersion(type)}
            >
              <div className="option-checkbox">
                {isSelected ? '✓' : ''}
              </div>
              <div className="option-content">
                <div className="option-header">
                  <span className="option-icon">{info.icon}</span>
                  <span className="option-label">{info.label}</span>
                  {isRecommended && (
                    <span className="recommended-tag">Recommended</span>
                  )}
                </div>
                <div className="option-sublabel">{info.sublabel}</div>
                <div className="option-description">{info.description}</div>
                <div className="option-examples">e.g., {info.examples}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Quick select all */}
      <div className="select-all-section">
        <button
          className="text-link"
          onClick={selectAll}
          disabled={selectedTypes.length === 3}
        >
          Build all 3 versions (compare them at the end)
        </button>
      </div>

      {/* Action buttons */}
      <div className="selection-actions">
        <button
          className="primary-button"
          onClick={handleGenerate}
          disabled={selectedTypes.length === 0}
        >
          {selectedTypes.length === 0
            ? 'Select at least one version'
            : selectedTypes.length === 1
              ? `Generate ${VERSION_INFO[selectedTypes[0]].label} Version`
              : `Generate ${selectedTypes.length} Versions`
          }
        </button>
      </div>
    </div>
  )
}

// Version Card Component (reused from existing)
function VersionCard({ type, icon, label, sublabel, version }) {
  const [expanded, setExpanded] = useState(false)

  if (!version) {
    return (
      <div className={`version-card ${type} error`}>
        <div className="version-header">
          <span className="version-icon">{icon}</span>
          <span className="version-label">{label}</span>
          {sublabel && <span className="version-sublabel">{sublabel}</span>}
        </div>
        <p className="version-error">Failed to generate this version</p>
      </div>
    )
  }

  return (
    <div className={`version-card ${type} ${expanded ? 'expanded' : ''}`}>
      <div className="version-header">
        <span className="version-icon">{icon}</span>
        <span className="version-label">{label}</span>
        {sublabel && <span className="version-sublabel">{sublabel}</span>}
      </div>

      <h3 className="version-name">"{version.name}"</h3>

      {/* What They Get */}
      <div className="version-section">
        <h4>WHAT THEY GET:</h4>
        <ul className="deliverables-list">
          {version.deliverables?.slice(0, expanded ? undefined : 3).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
          {!expanded && version.deliverables?.length > 3 && (
            <li className="more">+{version.deliverables.length - 3} more...</li>
          )}
        </ul>
      </div>

      {/* Investment Required */}
      <div className="version-section">
        <h4>YOUR INVESTMENT:</h4>
        <div className="investment-grid">
          <div className="investment-item">
            <span className="investment-label">Time to create:</span>
            <span className="investment-value">{version.investment?.timeToCreate || '?'} hours</span>
          </div>
          <div className="investment-item">
            <span className="investment-label">Money upfront:</span>
            <span className="investment-value">${version.investment?.moneyUpfront || 0}</span>
          </div>
          <div className="investment-item">
            <span className="investment-label">Setup timeline:</span>
            <span className="investment-value">{version.investment?.setupTimeline || '?'}</span>
          </div>
          <div className="investment-item">
            <span className="investment-label">Ongoing time:</span>
            <span className="investment-value">{version.investment?.ongoingTime || '?'} hrs/{type === 'service' ? 'customer' : type === 'productized' ? 'cohort' : 'week'}</span>
          </div>
        </div>
      </div>

      {/* Can Start Now */}
      <div className="version-section start-now">
        <span className={`start-badge ${version.canStartNow ? 'yes' : 'no'}`}>
          {version.canStartNow ? '✅ CAN START NOW' : '❌ NEEDS PREP'}
        </span>
        <p className="start-reason">{version.canStartNowReason}</p>
      </div>

      {/* Max Customers */}
      <div className="version-section">
        <h4>MAX CUSTOMERS/MONTH:</h4>
        <span className="max-customers">{version.maxCustomersPerMonth || '?'}</span>
      </div>

      {/* Pros & Cons */}
      {expanded && (
        <>
          <div className="version-section pros-cons">
            <div className="pros">
              <h4>PROS:</h4>
              {version.pros?.map((pro, i) => (
                <div key={i} className="pro-item">✅ {pro}</div>
              ))}
            </div>
            <div className="cons">
              <h4>CONS:</h4>
              {version.cons?.map((con, i) => (
                <div key={i} className="con-item">⚠️ {con}</div>
              ))}
            </div>
          </div>

          {/* Price & Revenue */}
          <div className="version-section pricing">
            <h4>SUGGESTED PRICE:</h4>
            <span className="price">${version.suggestedPrice?.toLocaleString() || '?'}</span>
          </div>

          <div className="version-section revenue">
            <h4>REVENUE POTENTIAL:</h4>
            <div className="revenue-grid">
              <div className="revenue-item">
                <span className="revenue-label">Month 1:</span>
                <span className="revenue-value">${version.revenue?.month1?.toLocaleString() || '?'}</span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Month 3:</span>
                <span className="revenue-value">${version.revenue?.month3?.toLocaleString() || '?'}</span>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">Month 12:</span>
                <span className="revenue-value">${version.revenue?.month12?.toLocaleString() || '?'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <button
        className="expand-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Show Less ▲' : 'Show Details ▼'}
      </button>
    </div>
  )
}

export default Step3_VersionSelection
