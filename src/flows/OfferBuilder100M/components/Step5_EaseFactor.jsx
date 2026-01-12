/**
 * Step5_EaseFactor - Build ease factors for all 3 versions
 *
 * Features:
 * - Multi-select checklist of "don't needs"
 * - Custom additions allowed
 * - AI analyzes relevance per version
 */

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const EASE_OPTIONS = [
  { id: 'no_tech_skills', label: 'No technical skills required' },
  { id: 'no_expensive_tools', label: 'No expensive tools to buy' },
  { id: 'no_hire_employees', label: 'No need to hire employees' },
  { id: 'no_quit_job', label: "No need to quit their job first" },
  { id: 'no_relocate', label: 'No need to relocate' },
  { id: 'no_large_investment', label: 'No large upfront investment' },
  { id: 'no_months_learning', label: 'No months/years of learning' },
  { id: 'no_complex_setup', label: 'No complex setup process' },
  { id: 'no_maintenance', label: 'No ongoing maintenance burden' },
  { id: 'no_risk', label: 'No risk of failure (results guaranteed)' },
  { id: 'no_experience', label: 'No experience necessary' },
  { id: 'no_equipment', label: 'No special equipment needed' }
]

function Step5_EaseFactor({ bucket, dreamOutcome, initialData, onComplete, setIsLoading, setError }) {
  // Restore from initialData if available
  const [selectedOptions, setSelectedOptions] = useState(initialData?.easeData?.selectedOptions || [])
  const [customOptions, setCustomOptions] = useState(initialData?.easeData?.customOptions || [])
  const [newCustom, setNewCustom] = useState('')
  const [analysis, setAnalysis] = useState(initialData?.easeAnalysis || null)
  const [activeTab, setActiveTab] = useState('product')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Toggle option selection
  const toggleOption = (id) => {
    setSelectedOptions(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  // Add custom option
  const addCustomOption = () => {
    if (newCustom.trim() && !customOptions.includes(newCustom.trim())) {
      setCustomOptions(prev => [...prev, newCustom.trim()])
      setSelectedOptions(prev => [...prev, `custom_${customOptions.length}`])
      setNewCustom('')
    }
  }

  // Remove custom option
  const removeCustomOption = (index) => {
    setCustomOptions(prev => prev.filter((_, i) => i !== index))
    setSelectedOptions(prev => prev.filter(x => x !== `custom_${index}`))
  }

  // Get all selected labels
  const getAllSelectedLabels = () => {
    const standardLabels = selectedOptions
      .filter(id => !id.startsWith('custom_'))
      .map(id => EASE_OPTIONS.find(o => o.id === id)?.label)
      .filter(Boolean)

    return [...standardLabels, ...customOptions]
  }

  // Analyze ease factors
  const handleAnalyze = async () => {
    const allSelected = getAllSelectedLabels()
    if (allSelected.length < 3) {
      setError('Please select at least 3 items.')
      return
    }

    setIsAnalyzing(true)

    try {
      const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
        body: {
          action: 'analyze_ease',
          context: {
            bucket,
            dreamOutcome,
            eliminatedRequirements: allSelected
          }
        }
      })

      if (error) throw error
      setAnalysis(data)
    } catch (err) {
      console.error('Error analyzing ease:', err)
      setError('Failed to analyze ease factors. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Continue to next step
  const handleContinue = () => {
    onComplete({
      eliminatedRequirements: getAllSelectedLabels(),
      // Include raw selections for restoration when navigating back
      selectedOptions,
      customOptions,
      analysis
    })
  }

  // Analysis results view
  if (analysis) {
    const versionData = analysis[activeTab]

    return (
      <div className="ease-factor-step">
        <div className="question-header">
          <span className="step-label">Step 5 of 8</span>
          <h2>Ease Factor: What You DON'T Need</h2>
        </div>

        <div className="version-tabs">
          <button
            className={`tab ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => setActiveTab('product')}
          >
            📦 Product
          </button>
          <button
            className={`tab ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => setActiveTab('service')}
          >
            🤝 Service
          </button>
          <button
            className={`tab ${activeTab === 'hybrid' ? 'active' : ''}`}
            onClick={() => setActiveTab('hybrid')}
          >
            🎓 Hybrid
          </button>
        </div>

        <div className="analysis-content">
          <div className="analysis-header">
            <h3>EASE FACTOR FOR: {activeTab === 'product' ? '📦 PRODUCT' : activeTab === 'service' ? '🤝 SERVICE' : '🎓 HYBRID'} VERSION</h3>
          </div>

          {/* Don't Need List */}
          <div className="ease-list">
            <h4>❌ YOU DON'T NEED TO:</h4>
            <ul>
              {versionData?.topEaseFactors?.map((item, i) => (
                <li key={i}>
                  <strong>{item.factor}</strong>
                  {item.why && <span className="ease-why"> ({item.why})</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Marketing Copy */}
          <div className="marketing-copy">
            <h4>Marketing Copy:</h4>
            <blockquote>"{versionData?.marketingCopy}"</blockquote>
          </div>

          {/* Reality Check */}
          {versionData?.realityCheck && (
            <div className="reality-check">
              <h4>⚠️ Reality Check:</h4>
              <p>{versionData.realityCheck}</p>
              {versionData.stillNeeded && (
                <ul>
                  {versionData.stillNeeded.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Score */}
          <div className="ease-score">
            <span className="score-label">Effort & Sacrifice Score:</span>
            <span className="score-value">{versionData?.effortScore}/10</span>
          </div>
        </div>

        <button className="primary-button" onClick={handleContinue}>
          Continue to Obstacles →
        </button>
      </div>
    )
  }

  // Input form view
  return (
    <div className="ease-factor-step">
      <div className="question-header">
        <span className="step-label">Step 5 of 8</span>
        <h2>What do they NOT have to do?</h2>
      </div>

      <p className="question-subtitle">
        This is powerful: Tell people what they DON'T need.
        Check all that apply (select 3-10 items):
      </p>

      <div className="ease-options">
        {EASE_OPTIONS.map(option => (
          <label key={option.id} className={`ease-option ${selectedOptions.includes(option.id) ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={selectedOptions.includes(option.id)}
              onChange={() => toggleOption(option.id)}
            />
            <span className="checkmark">☑️</span>
            <span className="option-label">{option.label}</span>
          </label>
        ))}

        {/* Custom options */}
        {customOptions.map((custom, i) => (
          <label key={`custom_${i}`} className="ease-option selected custom">
            <input type="checkbox" checked readOnly />
            <span className="checkmark">☑️</span>
            <span className="option-label">{custom}</span>
            <button
              type="button"
              className="remove-custom"
              onClick={() => removeCustomOption(i)}
            >
              ✕
            </button>
          </label>
        ))}
      </div>

      {/* Add custom */}
      <div className="add-custom">
        <input
          type="text"
          value={newCustom}
          onChange={(e) => setNewCustom(e.target.value)}
          placeholder="They don't need to..."
          onKeyPress={(e) => e.key === 'Enter' && addCustomOption()}
        />
        <button
          type="button"
          onClick={addCustomOption}
          disabled={!newCustom.trim()}
        >
          + Add
        </button>
      </div>

      <div className="selection-count">
        {getAllSelectedLabels().length} selected (min 3)
      </div>

      <button
        className="primary-button"
        onClick={handleAnalyze}
        disabled={getAllSelectedLabels().length < 3 || isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <span className="spinner-inline"></span>
            Analyzing...
          </>
        ) : (
          'Generate Ease Factor →'
        )}
      </button>
    </div>
  )
}

export default Step5_EaseFactor
