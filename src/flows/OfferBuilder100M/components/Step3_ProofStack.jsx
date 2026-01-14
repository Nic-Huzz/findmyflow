/**
 * Step3_ProofStack - Build credibility stack for all 3 versions
 *
 * Features:
 * - Multi-select with details for 6 proof types
 * - AI analysis ranks proof for each version
 * - Tabbed view showing recommendations per version
 */

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const PROOF_TYPES = [
  {
    id: 'personal',
    label: "I've done this myself (personal transformation)",
    placeholder: "I went from X to Y in Z timeframe...",
    example: "I went from corporate burnout to location independence in 18 months, now running my business from Bali."
  },
  {
    id: 'caseStudies',
    label: "I've helped others achieve this (case studies)",
    placeholder: "I've helped X people achieve Y...",
    example: "I've helped 47 non-technical founders deploy their products. Average time to launch: 3 hours. 100% completion rate."
  },
  {
    id: 'credentials',
    label: "I have credentials or certifications",
    placeholder: "Certified X, Trained in Y...",
    example: "altMBA graduate, Certified NLP Practitioner, 10 years software engineering experience"
  },
  {
    id: 'experience',
    label: "I have years of experience in this field",
    placeholder: "X years doing Y...",
    example: "15 years as a senior software engineer at Google, built systems serving 1B+ users"
  },
  {
    id: 'methodology',
    label: "I have a proprietary methodology or framework",
    placeholder: "The XYZ Framework: how it works...",
    example: "The LEGO Castle Methodology: Breaking complex apps into simple building blocks anyone can assemble."
  },
  {
    id: 'data',
    label: "I have data or research backing this approach",
    placeholder: "Studies show...",
    example: "MIT study showing AI-assisted development reduces time-to-launch by 87% for non-technical founders."
  }
]

function Step3_ProofStack({ dreamOutcome, bucket, contextData, initialData, onComplete, setIsLoading, setError }) {
  const [proofData, setProofData] = useState(initialData?.proofData || {})
  const [analysis, setAnalysis] = useState(initialData?.proofAnalysis || null)
  const [activeTab, setActiveTab] = useState('product')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Toggle proof type selection
  const toggleProof = (id) => {
    setProofData(prev => {
      if (prev[id]) {
        const { [id]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: '' }
    })
  }

  // Update proof detail text
  const updateProofDetail = (id, value) => {
    setProofData(prev => ({ ...prev, [id]: value }))
  }

  // Validate before analyzing
  const canAnalyze = () => {
    const selected = Object.keys(proofData)
    if (selected.length < 2) return false

    // Each selected must have at least 20 chars
    return selected.every(id => proofData[id]?.length >= 20)
  }

  // Analyze proof stack
  const handleAnalyze = async () => {
    if (!canAnalyze()) {
      setError('Please select at least 2 proof types and fill in details (min 20 characters each).')
      return
    }

    setIsAnalyzing(true)

    try {
      // Extract sunk cost for AI context
      const v1SunkCost = contextData?.offerBuilderData?.responses?.q4_sunk_cost ||
        contextData?.offerBuilderData?.sunk_cost || null

      const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
        body: {
          action: 'analyze_proof_stack',
          context: {
            dreamOutcome,
            bucket,
            persona: contextData.persona,
            validationData: contextData.validationData,
            proofData,
            // V1 sunk cost data for contrast messaging in proof stack
            sunkCost: v1SunkCost
          }
        }
      })

      if (error) throw error
      setAnalysis(data)
    } catch (err) {
      console.error('Error analyzing proof:', err)
      setError('Failed to analyze proof stack. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Continue to next step
  const handleContinue = () => {
    onComplete({
      proofData,
      analysis
    })
  }

  // Analysis results view
  if (analysis) {
    const versionData = analysis[activeTab]

    return (
      <div className="proof-stack-step">
        <div className="question-header">
          <span className="step-label">Step 3 of 8</span>
          <h2>Your Proof Stack Analysis</h2>
        </div>

        <div className="version-tabs">
          <button
            className={`tab ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => setActiveTab('service')}
          >
            💼 Service
          </button>
          <button
            className={`tab ${activeTab === 'productized' ? 'active' : ''}`}
            onClick={() => setActiveTab('productized')}
          >
            📦 Productized
          </button>
          <button
            className={`tab ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => setActiveTab('product')}
          >
            🛠️ Product
          </button>
        </div>

        <div className="analysis-content">
          <div className="analysis-header">
            <h3>PROOF STACK FOR: {activeTab === 'service' ? '💼 SERVICE' : activeTab === 'productized' ? '📦 PRODUCTIZED' : '🛠️ PRODUCT'} VERSION</h3>
          </div>

          {/* Lead With */}
          <div className="proof-section lead">
            <h4>🏆 LEAD WITH: {versionData?.lead_with?.type}</h4>
            <p className="proof-text">"{versionData?.lead_with?.text}"</p>
            <p className="proof-why"><strong>Why:</strong> {versionData?.lead_with?.why}</p>
          </div>

          {/* Support With */}
          <div className="proof-section support">
            <h4>💪 SUPPORT WITH:</h4>
            {versionData?.support_with?.map((item, i) => (
              <div key={i} className="support-item">
                <strong>{i + 1}. {item.type}</strong>
                <p>"{item.text}"</p>
                <p className="proof-why">Why: {item.why}</p>
              </div>
            ))}
          </div>

          {/* Missing Elements */}
          {analysis.overall_missing?.length > 0 && (
            <div className="proof-section missing">
              <h4>⚠️ WHAT'S MISSING:</h4>
              <ul>
                {analysis.overall_missing.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Score */}
          <div className="proof-score">
            <span className="score-label">Proof Strength:</span>
            <span className="score-value">{versionData?.proof_score}/10</span>
          </div>
        </div>

        <button className="primary-button" onClick={handleContinue}>
          Continue to Speed Advantage →
        </button>
      </div>
    )
  }

  // Extract testimonials/quotes from validation data
  const validationQuotes = contextData.validationData?.testimonials ||
    contextData.validationData?.quotes ||
    contextData.validationData?.directQuotes || []
  const validationResults = contextData.validationData?.results ||
    contextData.validationData?.outcomes || []
  const hasValidationProof = validationQuotes.length > 0 || validationResults.length > 0

  // Extract sunk cost data from V1 Offer Builder
  const v1Data = contextData?.offerBuilderData
  const sunkCost = v1Data?.responses?.q4_sunk_cost || v1Data?.sunk_cost || null
  const hasSunkCost = sunkCost && (sunkCost.amount || sunkCost.attempts || sunkCost.description)

  // Input form view
  return (
    <div className="proof-stack-step">
      <div className="question-header">
        <span className="step-label">Step 3 of 8</span>
        <h2>Why should they believe you can deliver?</h2>
      </div>

      <p className="question-subtitle">
        Let's build your credibility stack. You'll answer these questions ONCE,
        then we'll customize the proof for each of your 3 versions.
      </p>

      {/* Validation Testimonials Panel */}
      {hasValidationProof && (
        <div className="validation-proof-panel">
          <div className="proof-panel-header">
            <span className="panel-icon">💬</span>
            <span>FROM YOUR VALIDATION SURVEYS</span>
          </div>
          <div className="proof-panel-content">
            {validationQuotes.length > 0 && (
              <div className="proof-panel-section">
                <strong>Customer quotes you can use:</strong>
                <div className="quote-list">
                  {validationQuotes.slice(0, 3).map((quote, i) => (
                    <div key={i} className="validation-quote">
                      "{typeof quote === 'string' ? quote : quote.text || quote.quote}"
                    </div>
                  ))}
                </div>
              </div>
            )}
            {validationResults.length > 0 && (
              <div className="proof-panel-section">
                <strong>Results they reported:</strong>
                <div className="results-list">
                  {validationResults.slice(0, 3).map((result, i) => (
                    <div key={i} className="validation-result">
                      ✓ {typeof result === 'string' ? result : result.text || result.outcome}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="proof-tip">
              💡 Use these real quotes in your "case studies" section below!
            </p>
          </div>
        </div>
      )}

      {/* Sunk Cost Contrast Panel (from V1 Offer Builder) */}
      {hasSunkCost && (
        <div className="sunk-cost-panel">
          <div className="sunk-cost-header">
            <span className="panel-icon">💸</span>
            <span>CONTRAST MESSAGING OPPORTUNITY</span>
          </div>
          <div className="sunk-cost-content">
            <p className="sunk-cost-intro">
              Your customers have already invested in solving this problem:
            </p>
            <div className="sunk-cost-stats">
              {sunkCost.amount && (
                <div className="sunk-stat">
                  <span className="stat-value">${typeof sunkCost.amount === 'number' ? sunkCost.amount.toLocaleString() : sunkCost.amount}</span>
                  <span className="stat-label">spent on failed solutions</span>
                </div>
              )}
              {sunkCost.attempts && (
                <div className="sunk-stat">
                  <span className="stat-value">{sunkCost.attempts}</span>
                  <span className="stat-label">different things tried</span>
                </div>
              )}
              {sunkCost.timeWasted && (
                <div className="sunk-stat">
                  <span className="stat-value">{sunkCost.timeWasted}</span>
                  <span className="stat-label">time wasted</span>
                </div>
              )}
            </div>
            {sunkCost.failedSolutions && sunkCost.failedSolutions.length > 0 && (
              <div className="failed-solutions">
                <strong>What hasn't worked for them:</strong>
                <ul>
                  {sunkCost.failedSolutions.slice(0, 4).map((sol, i) => (
                    <li key={i}>{sol}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="contrast-tips">
              <p className="tip-header">💡 Use this in your proof messaging:</p>
              <div className="contrast-example">
                <em>"Unlike the ${sunkCost.amount || 'thousands'} you've spent on {sunkCost.failedSolutions?.[0] || 'solutions that didn\'t work'}..."</em>
              </div>
              <div className="contrast-example">
                <em>"You've already tried {sunkCost.attempts || 'multiple approaches'}. Here's why this is different..."</em>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="instruction">Check all that apply (select at least 2):</p>

      <div className="proof-options">
        {PROOF_TYPES.map(proof => (
          <div key={proof.id} className={`proof-option ${proofData[proof.id] !== undefined ? 'selected' : ''}`}>
            <label className="proof-checkbox">
              <input
                type="checkbox"
                checked={proofData[proof.id] !== undefined}
                onChange={() => toggleProof(proof.id)}
              />
              <span className="checkmark">☑️</span>
              <span className="proof-label">{proof.label}</span>
            </label>

            {proofData[proof.id] !== undefined && (
              <div className="proof-detail">
                <textarea
                  value={proofData[proof.id]}
                  onChange={(e) => updateProofDetail(proof.id, e.target.value)}
                  placeholder={proof.placeholder}
                  rows={3}
                />
                <p className="proof-example">
                  <em>Example:</em> "{proof.example}"
                </p>
                <div className="char-count">
                  {proofData[proof.id]?.length || 0}/20 min characters
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="primary-button"
        onClick={handleAnalyze}
        disabled={!canAnalyze() || isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <span className="spinner-inline"></span>
            Analyzing...
          </>
        ) : (
          'Analyze My Proof Stack →'
        )}
      </button>
    </div>
  )
}

export default Step3_ProofStack
