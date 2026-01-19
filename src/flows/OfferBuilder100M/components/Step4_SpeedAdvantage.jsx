/**
 * Step4_SpeedAdvantage - Calculate speed advantage for selected versions
 *
 * Features:
 * - Compare traditional vs your approach timeframes
 * - AI calculates speed multiplier and marketing angles
 * - Reality checks for each version type
 * - Supports multi-version tabs
 */

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import VersionTabs from './VersionTabs'

const BUCKET_EXAMPLES = {
  wealth: [
    { traditional: '6 months to learn coding', yours: '3 hours to deploy' },
    { traditional: '2 years to save $10K', yours: '30 days to first $1K' },
    { traditional: '18 months to build business', yours: '90 days to first customer' }
  ],
  health: [
    { traditional: '12 months to transform body', yours: '90 days visible change' },
    { traditional: '6 months to build habit', yours: '21 days to routine' },
    { traditional: '3 years to master practice', yours: '30 days to fundamentals' }
  ],
  love: [
    { traditional: 'Years of self-doubt', yours: '30 days to self-love' },
    { traditional: '5 years searching for purpose', yours: '90 days clarity' },
    { traditional: 'Lifetime of feeling stuck', yours: '8 weeks transformation' }
  ]
}

function Step4_SpeedAdvantage({ bucket, dreamOutcome, versions, selectedVersionTypes = [], initialData, onComplete, setIsLoading, setError }) {
  const [traditionalTime, setTraditionalTime] = useState(initialData?.speedData?.traditionalTime || '')
  const [yourTime, setYourTime] = useState(initialData?.speedData?.yourTime || '')
  const [analysis, setAnalysis] = useState(initialData?.speedAnalysis || null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Use selectedVersionTypes if provided, fallback to all 3 for backwards compatibility
  const versionTypes = selectedVersionTypes.length > 0 ? selectedVersionTypes : ['service', 'productized', 'product']
  const [activeTab, setActiveTab] = useState(versionTypes[0])

  const examples = BUCKET_EXAMPLES[bucket] || BUCKET_EXAMPLES.wealth

  // Analyze speed advantage
  const handleAnalyze = async () => {
    if (!traditionalTime.trim() || !yourTime.trim()) {
      setError('Please fill in both time fields.')
      return
    }

    setIsAnalyzing(true)

    try {
      const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
        body: {
          action: 'analyze_speed',
          context: {
            bucket,
            dreamOutcome,
            traditionalTime: traditionalTime.trim(),
            yourTime: yourTime.trim(),
            selectedVersionTypes: versionTypes
          }
        }
      })

      if (error) throw error
      setAnalysis(data)
    } catch (err) {
      console.error('Error analyzing speed:', err)
      setError('Failed to analyze speed advantage. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Continue to next step
  const handleContinue = () => {
    onComplete({
      speedData: { traditionalTime, yourTime },
      analysis
    })
  }

  // Analysis results view
  if (analysis) {
    const versionData = analysis[activeTab]

    return (
      <div className="speed-advantage-step">
        <div className="question-header">
          <span className="step-label">Step 5 of 9</span>
          <h2>Your Speed Advantage</h2>
        </div>

        <VersionTabs
          selectedVersionTypes={versionTypes}
          activeVersion={activeTab}
          onVersionChange={setActiveTab}
          completedVersions={versionTypes.filter(v => analysis[v])}
        />

        <div className="analysis-content">
          <div className="analysis-header">
            <h3>SPEED ADVANTAGE FOR: {activeTab === 'service' ? '💼 SERVICE' : activeTab === 'productized' ? '📦 PRODUCTIZED' : '🛠️ PRODUCT'} VERSION</h3>
          </div>

          {/* Speed Multiplier */}
          <div className="speed-multiplier">
            <span className="multiplier-value">{versionData?.speedMultiplier}</span>
            <span className="multiplier-label">faster</span>
          </div>

          {/* Time Comparison */}
          <div className="time-comparison">
            <h4>Time Comparison:</h4>
            <div className="comparison-items">
              <div className="comparison-item traditional">
                <span className="comparison-label">Traditional:</span>
                <span className="comparison-value">{traditionalTime}</span>
              </div>
              <div className="comparison-item yours">
                <span className="comparison-label">Your Method:</span>
                <span className="comparison-value">{versionData?.adjustedTime || yourTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Win & Full Outcome */}
          <div className="outcome-timelines">
            <div className="timeline-item">
              <h4>Quick Win:</h4>
              <p>{versionData?.quickWin}</p>
            </div>
            <div className="timeline-item">
              <h4>Full Outcome:</h4>
              <p>{versionData?.fullOutcome}</p>
            </div>
          </div>

          {/* Marketing Angle */}
          <div className="marketing-angle">
            <h4>Marketing Angle:</h4>
            <blockquote>"{versionData?.marketingAngle}"</blockquote>
          </div>

          {/* Reality Check */}
          {versionData?.realityCheck && (
            <div className="reality-check">
              <h4>⚠️ Reality Check:</h4>
              <p>{versionData.realityCheck}</p>
            </div>
          )}

          {/* Score */}
          <div className="speed-score">
            <span className="score-label">Time Delay Score:</span>
            <span className="score-value">{versionData?.timeDelayScore}/10 🔥</span>
          </div>
        </div>

        <button className="primary-button" onClick={handleContinue}>
          Continue to Ease Factor →
        </button>
      </div>
    )
  }

  // Input form view
  return (
    <div className="speed-advantage-step">
      <div className="question-header">
        <span className="step-label">Step 5 of 9</span>
        <h2>How fast can someone see results?</h2>
      </div>

      <p className="question-subtitle">
        Speed is a MASSIVE differentiator in {bucket} offers.
        Let's calculate your speed advantage...
      </p>

      <div className="speed-inputs">
        <div className="input-group">
          <label htmlFor="traditional">Traditional approach takes:</label>
          <input
            id="traditional"
            type="text"
            value={traditionalTime}
            onChange={(e) => setTraditionalTime(e.target.value)}
            placeholder="How long does the old way take?"
          />
        </div>

        <div className="vs-divider">VS</div>

        <div className="input-group">
          <label htmlFor="yours">Your approach takes:</label>
          <input
            id="yours"
            type="text"
            value={yourTime}
            onChange={(e) => setYourTime(e.target.value)}
            placeholder="How long does YOUR way take?"
          />
        </div>
      </div>

      <div className="helper-text">
        <p>💡 Be specific! Don't just say "faster" - give actual timeframes.</p>
        <p><strong>Examples from other {bucket} offers:</strong></p>
        <div className="examples-list">
          {examples.map((ex, i) => (
            <div key={i} className="example-row">
              <span className="example-traditional">"{ex.traditional}"</span>
              <span className="example-arrow">→</span>
              <span className="example-yours">"{ex.yours}"</span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="primary-button"
        onClick={handleAnalyze}
        disabled={!traditionalTime.trim() || !yourTime.trim() || isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <span className="spinner-inline"></span>
            Calculating...
          </>
        ) : (
          'Calculate Speed Advantage →'
        )}
      </button>
    </div>
  )
}

export default Step4_SpeedAdvantage
