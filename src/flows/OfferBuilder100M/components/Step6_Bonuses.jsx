/**
 * Step6_Bonuses - Generate bonuses from obstacles (Step 7B)
 *
 * Features:
 * - AI generates bonuses per version based on obstacles
 * - User can use, customize, or skip each bonus
 * - Tabbed view for selected versions
 * - Supports multi-version tabs
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import VersionTabs from './VersionTabs'

function Step6_Bonuses({ obstacles, dreamOutcome, bucket, versions, selectedVersionTypes = [], contextData, initialData, onComplete, setIsLoading, setError }) {
  // Use selectedVersionTypes if provided, fallback to all 3 for backwards compatibility
  const versionTypes = selectedVersionTypes.length > 0 ? selectedVersionTypes : ['service', 'productized', 'product']

  // Restore from initialData if available (skip generation)
  const hasInitialData = initialData?.bonusSuggestions && Object.keys(initialData.bonusSuggestions).length > 0

  // Initialize selectedBonuses based on versionTypes
  const getInitialSelectedBonuses = () => {
    if (initialData?.selectedBonuses) return initialData.selectedBonuses
    const initial = {}
    versionTypes.forEach(type => { initial[type] = [] })
    return initial
  }

  const [bonusSuggestions, setBonusSuggestions] = useState(initialData?.bonusSuggestions || null)
  const [selectedBonuses, setSelectedBonuses] = useState(getInitialSelectedBonuses())
  const [activeTab, setActiveTab] = useState(versionTypes[0])
  const [isGenerating, setIsGenerating] = useState(!hasInitialData)
  const [editingBonus, setEditingBonus] = useState(null)

  // Extract V1 lead magnet and bonus solutions
  const v1Data = contextData?.offerBuilderData
  const v1Solutions = v1Data?.responses?.q8_solutions?.solutions || []
  const v1Categories = v1Data?.responses?.solution_categories || {}

  const v1LeadMagnets = v1Solutions.filter((sol, idx) =>
    v1Categories[`solution_${idx}`] === 'lead_magnet'
  )
  const v1Bonuses = v1Solutions.filter((sol, idx) =>
    v1Categories[`solution_${idx}`] === 'bonus'
  )
  const hasV1Suggestions = v1LeadMagnets.length > 0 || v1Bonuses.length > 0

  // Generate bonuses on mount (skip if restoring from initialData)
  useEffect(() => {
    // Skip generation if we have initialData
    if (hasInitialData) {
      setIsGenerating(false)
      return
    }

    const generateBonuses = async () => {
      setIsGenerating(true)

      try {
        // Prepare V1 bonus suggestions for AI context
        const v1BonusSuggestions = hasV1Suggestions ? {
          leadMagnets: v1LeadMagnets.map(sol => ({
            description: sol.description,
            type: sol.solutionType,
            problemSolved: sol.problemText
          })),
          bonuses: v1Bonuses.map(sol => ({
            description: sol.description,
            type: sol.solutionType,
            problemSolved: sol.problemText
          }))
        } : null

        const { data, error } = await supabase.functions.invoke('offer-builder-ai', {
          body: {
            action: 'generate_bonuses',
            context: {
              obstacles,
              dreamOutcome,
              bucket,
              // V1 Offer Builder bonus/lead magnet ideas for smarter suggestions
              offerBuilderV1: v1BonusSuggestions,
              // Only generate for selected version types
              selectedVersionTypes: versionTypes
            }
          }
        })

        if (error) throw error
        setBonusSuggestions(data)

        // Auto-select all bonuses initially (only for selected versions)
        if (data) {
          const autoSelected = {}
          versionTypes.forEach(type => {
            autoSelected[type] = data[type]?.map((_, i) => i) || []
          })
          setSelectedBonuses(autoSelected)
        }
      } catch (err) {
        console.error('Error generating bonuses:', err)
        setError('Failed to generate bonuses. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    }

    generateBonuses()
  }, [obstacles, dreamOutcome, bucket, setError, hasInitialData, hasV1Suggestions, v1LeadMagnets, v1Bonuses])

  // Toggle bonus selection
  const toggleBonus = (version, index) => {
    setSelectedBonuses(prev => ({
      ...prev,
      [version]: prev[version].includes(index)
        ? prev[version].filter(i => i !== index)
        : [...prev[version], index]
    }))
  }

  // Update bonus (after editing)
  const updateBonus = (version, index, updates) => {
    setBonusSuggestions(prev => ({
      ...prev,
      [version]: prev[version].map((bonus, i) =>
        i === index ? { ...bonus, ...updates } : bonus
      )
    }))
    setEditingBonus(null)
  }

  // Calculate total value for a version
  const getTotalValue = (version) => {
    if (!bonusSuggestions?.[version]) return 0
    return selectedBonuses[version].reduce((sum, index) => {
      return sum + (bonusSuggestions[version][index]?.perceivedValue || 0)
    }, 0)
  }

  // Get final bonuses for completion
  const getFinalBonuses = () => {
    const result = {}
    for (const version of versionTypes) {
      result[version] = (selectedBonuses[version] || []).map(index =>
        bonusSuggestions?.[version]?.[index]
      ).filter(Boolean)
    }
    return result
  }

  // Continue to next step
  const handleContinue = () => {
    const finalBonuses = getFinalBonuses()

    // Check each selected version has at least 1 bonus
    const hasMinimum = versionTypes.every(type => finalBonuses[type]?.length >= 1)
    if (!hasMinimum) {
      setError('Please select at least 1 bonus for each version.')
      return
    }

    // Include all state for restoration when navigating back
    onComplete({
      bonuses: finalBonuses,
      bonusSuggestions,
      selectedBonuses
    })
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="bonuses-step generating">
        <div className="question-header">
          <span className="step-label">Step 7 of 9 (Part 2)</span>
          <h2>Creating bonuses for {versionTypes.length === 1 ? 'your version' : `${versionTypes.length} versions`}...</h2>
        </div>

        <div className="generation-progress">
          <div className="spinner large"></div>
          <p>This takes 15-20 seconds</p>
          <p className="progress-detail">Analyzing obstacles and matching solutions...</p>
        </div>
      </div>
    )
  }

  const versionBonuses = bonusSuggestions?.[activeTab] || []

  // Count selected bonuses per version for tab display
  const getSelectedCount = (type) => (selectedBonuses[type] || []).length

  return (
    <div className="bonuses-step">
      <div className="question-header">
        <span className="step-label">Step 7 of 9 (Part 2)</span>
        <h2>Bonuses Created{versionTypes.length > 1 ? ` for ${versionTypes.length} Versions` : ''}</h2>
      </div>

      <VersionTabs
        selectedVersionTypes={versionTypes}
        activeVersion={activeTab}
        onVersionChange={setActiveTab}
        completedVersions={versionTypes.filter(v => getSelectedCount(v) > 0)}
      />

      {/* V1 Offer Foundation Suggestions Panel */}
      {hasV1Suggestions && (
        <div className="v1-bonus-suggestions">
          <div className="v1-suggestions-header">
            <span className="panel-icon">📦</span>
            <span>IDEAS FROM YOUR OFFER FOUNDATION</span>
          </div>
          <p className="v1-suggestions-intro">
            You can adapt these as bonuses for any version:
          </p>
          <div className="v1-suggestions-list">
            {v1LeadMagnets.map((sol, idx) => (
              <div key={`lm-${idx}`} className="v1-suggestion-chip lead-magnet">
                <span className="suggestion-type">🎁 Lead Magnet</span>
                <span className="suggestion-text">{sol.description}</span>
                <span className="suggestion-problem">Solves: {sol.problemText}</span>
              </div>
            ))}
            {v1Bonuses.map((sol, idx) => (
              <div key={`bonus-${idx}`} className="v1-suggestion-chip bonus">
                <span className="suggestion-type">✨ Bonus</span>
                <span className="suggestion-text">{sol.description}</span>
                <span className="suggestion-problem">Solves: {sol.problemText}</span>
              </div>
            ))}
          </div>
          <p className="v1-suggestions-tip">
            💡 The AI has used these ideas to generate version-specific bonuses below.
          </p>
        </div>
      )}

      <div className="bonuses-content">
        <div className="bonuses-header">
          <h3>BONUSES FOR: {activeTab === 'service' ? '💼 SERVICE' : activeTab === 'productized' ? '📦 PRODUCTIZED' : '🛠️ PRODUCT'} VERSION</h3>
        </div>

        {versionBonuses.map((bonus, index) => {
          const isSelected = selectedBonuses[activeTab].includes(index)
          const isEditing = editingBonus?.version === activeTab && editingBonus?.index === index

          if (isEditing) {
            return (
              <BonusEditor
                key={index}
                bonus={bonus}
                onSave={(updates) => updateBonus(activeTab, index, updates)}
                onCancel={() => setEditingBonus(null)}
              />
            )
          }

          return (
            <div key={index} className={`bonus-card ${isSelected ? 'selected' : 'skipped'}`}>
              <div className="obstacle-reference">
                <strong>OBSTACLE {bonus.obstacleIndex || index + 1}:</strong>
                <p>"{obstacles[bonus.obstacleIndex - 1] || obstacles[index] || 'General concern'}"</p>
              </div>

              <div className="bonus-suggestion">
                <div className="suggestion-header">
                  <span className="suggestion-icon">💡</span>
                  <span>AI SUGGESTS BONUS {index + 1}:</span>
                </div>

                <h4 className="bonus-name">"{bonus.name}"</h4>

                <div className="bonus-description">
                  <strong>What it is:</strong>
                  <p>{bonus.description}</p>
                </div>

                <div className="bonus-reasoning">
                  <strong>Why this removes the obstacle:</strong>
                  <p>{bonus.reasoning}</p>
                </div>

                <div className="bonus-value">
                  <strong>Perceived Value:</strong>
                  <span className="value-amount">${bonus.perceivedValue}</span>
                </div>
              </div>

              <div className="bonus-actions">
                <button
                  type="button"
                  className={`action-btn use ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleBonus(activeTab, index)}
                >
                  {isSelected ? '✓ Using This Bonus' : 'Use This Bonus'}
                </button>
                <button
                  type="button"
                  className="action-btn customize"
                  onClick={() => setEditingBonus({ version: activeTab, index })}
                >
                  Customize
                </button>
                {isSelected && (
                  <button
                    type="button"
                    className="action-btn skip"
                    onClick={() => toggleBonus(activeTab, index)}
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          )
        })}

        <div className="total-value">
          <strong>TOTAL BONUS VALUE:</strong>
          <span className="total-amount">${getTotalValue(activeTab).toLocaleString()}</span>
        </div>
      </div>

      <button className="primary-button" onClick={handleContinue}>
        Continue to Final Selection →
      </button>
    </div>
  )
}

// Bonus Editor Component
function BonusEditor({ bonus, onSave, onCancel }) {
  const [name, setName] = useState(bonus.name)
  const [description, setDescription] = useState(bonus.description)
  const [perceivedValue, setPerceivedValue] = useState(bonus.perceivedValue)

  const handleSave = () => {
    onSave({ name, description, perceivedValue: Number(perceivedValue) })
  }

  return (
    <div className="bonus-card editing">
      <h4>Customize Bonus</h4>

      <div className="edit-field">
        <label>Bonus Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="edit-field">
        <label>What it is (description):</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="edit-field">
        <label>Perceived Value: $</label>
        <input
          type="number"
          value={perceivedValue}
          onChange={(e) => setPerceivedValue(e.target.value)}
        />
      </div>

      <div className="edit-actions">
        <button type="button" className="primary-button" onClick={handleSave}>
          Save Changes
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default Step6_Bonuses
