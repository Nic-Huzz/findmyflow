/**
 * Step2_GenerateVersions - Generate 3 parallel offer versions
 *
 * Features:
 * - AI generates Service/Productized/Product versions (aligned with wealth ladder)
 * - Shows investment requirements, pros/cons, revenue potential
 * - All 3 versions displayed for review before continuing
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

function Step2_GenerateVersions({ bucket, dreamOutcome, contextData, onComplete, setIsLoading, setError }) {
  const [versions, setVersions] = useState(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [generationProgress, setGenerationProgress] = useState({
    analyzing: false,
    generating: false,
    finalizing: false
  })

  // Extract V1 core product solutions for seeding
  const v1Data = contextData?.offerBuilderData
  const v1CoreProducts = v1Data?.responses?.q8_solutions?.solutions?.filter(sol => {
    const solId = `solution_${v1Data.responses.q8_solutions.solutions.indexOf(sol)}`
    return v1Data.responses.solution_categories?.[solId] === 'core_product'
  }) || []
  const hasV1CoreProducts = v1CoreProducts.length > 0

  // Generate versions on mount
  useEffect(() => {
    const generateVersions = async () => {
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
          niche: v1Data.responses?.q6_niche_layers?.layers,
          problemArea: v1Data.problem_area
        } : null

        const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
          body: {
            action: 'generate_versions',
            context: {
              bucket,
              dreamOutcome,
              skills: contextData.skills,
              persona: contextData.persona,
              validationData: contextData.validationData,
              // V1 Offer Builder foundation for smarter version generation
              offerBuilderV1: v1Foundation
            }
          }
        })

        if (error) throw error

        setGenerationProgress({ analyzing: true, generating: true, finalizing: true })
        await new Promise(r => setTimeout(r, 500))

        setVersions(data.versions)
      } catch (err) {
        console.error('Error generating versions:', err)
        setError('Failed to generate offer versions. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    }

    generateVersions()
  }, [bucket, dreamOutcome, contextData, setError])

  // Loading state
  if (isGenerating) {
    return (
      <div className="generating-versions">
        <div className="question-header">
          <span className="step-label">Step 2 of 8</span>
          <h2>Creating your 3 offer versions...</h2>
        </div>

        <div className="generation-info">
          <p>
            Same dream outcome: <strong>"{dreamOutcome}"</strong>
          </p>
          <p>Different delivery methods.</p>
        </div>

        <div className="generation-progress">
          <div className="spinner large"></div>
          <p className="progress-text">This takes 15-20 seconds</p>

          <div className="progress-steps">
            <div className={`progress-step ${generationProgress.analyzing ? 'active' : ''}`}>
              {generationProgress.analyzing ? '✓' : '○'} Analyzing your skills (from Vibe Rise)
            </div>
            {hasV1CoreProducts && (
              <div className={`progress-step ${generationProgress.analyzing ? 'active' : ''}`}>
                {generationProgress.analyzing ? '✓' : '○'} Using {v1CoreProducts.length} core product idea{v1CoreProducts.length > 1 ? 's' : ''} from Offer Foundation
              </div>
            )}
            <div className={`progress-step ${generationProgress.generating ? 'active' : ''}`}>
              {generationProgress.generating ? '✓' : '○'} Generating 3 delivery formats
            </div>
            <div className={`progress-step ${generationProgress.finalizing ? 'active' : ''}`}>
              {generationProgress.finalizing ? '✓' : '○'} Calculating investment & revenue
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No versions generated
  if (!versions) {
    return (
      <div className="generation-error">
        <h2>Something went wrong</h2>
        <p>We couldn't generate your offer versions.</p>
        <button className="primary-button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="versions-display">
      <div className="question-header">
        <span className="step-label">Step 2 of 8</span>
        <h2>Here are your 3 offer versions</h2>
      </div>

      <div className="versions-intro">
        <p>
          You'll build proof stacks, speed advantages, ease factors, and
          bonuses for <strong>ALL THREE</strong> versions.
        </p>
        <p className="versions-note">
          Then we'll score each one and you choose the winner.
          <br />
          <em>Don't worry about picking now - we'll compare them at the end.</em>
        </p>
      </div>

      <div className="versions-grid">
        {/* Service Version */}
        <VersionCard
          type="service"
          icon="💼"
          label="VERSION 1: SERVICE"
          sublabel="Someone does it for me"
          version={versions.service}
        />

        {/* Productized Version */}
        <VersionCard
          type="productized"
          icon="📦"
          label="VERSION 2: PRODUCTIZED"
          sublabel="A guided process"
          version={versions.productized}
        />

        {/* Product Version */}
        <VersionCard
          type="product"
          icon="🛠️"
          label="VERSION 3: PRODUCT"
          sublabel="Tools I use myself"
          version={versions.product}
        />
      </div>

      <div className="versions-footer">
        <p>Next: We'll build proof stacks for all 3 versions.</p>
        <button
          className="primary-button"
          onClick={() => onComplete(versions)}
        >
          Continue to Proof Stack Builder →
        </button>
      </div>
    </div>
  )
}

// Version Card Component
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

export default Step2_GenerateVersions
