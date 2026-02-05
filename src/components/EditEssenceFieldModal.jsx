import React, { useState, useEffect, useMemo } from 'react'
import ArchetypeBrowseCarousel from './ArchetypeBrowseCarousel'
import {
  FIELD_KEYS,
  updateEssenceField,
  resetEssenceField,
  generateHybridStatement
} from '../lib/essencePreferences'
import './EditEssenceFieldModal.css'

const FIELD_LABELS = {
  // Essence fields
  tagline: 'Essence Tagline',
  essence: 'Your Essence',
  superpower: 'Your Superpower',
  vision: 'Your Vision',
  north_star: 'Your North Star',
  inner_child: 'Inner Child Desire',
  wound: 'Essence Wound',
  characters: 'Heroes Like You',
  energetic_transmission: 'Energetic Transmission',
  recognition_pattern: 'Recognition Pattern',
  vision_in_action: 'Vision in Action',
  // Shadow fields
  shadow_lie: 'The Lie It Tells You',
  shadow_origin: 'Where It Came From',
  shadow_protects: 'How It Protects You',
  shadow_kryptonite: 'Its Kryptonite',
  shadow_affirmation: 'Your Healing Affirmation',
  shadow_play_blocker: 'How It Blocks Your Play'
}

const FIELD_DESCRIPTIONS = {
  // Essence fields
  tagline: 'A short phrase that captures your core essence',
  essence: 'A poetic line that captures who you are at your core',
  superpower: 'Your unique gift that creates transformation',
  vision: 'What becomes possible when you fully embody your essence',
  north_star: 'Your guiding principle that keeps you on path',
  inner_child: 'What your inner child wanted most',
  wound: 'The message you internalized that made you dim your light',
  characters: 'Fictional or real characters who embody similar energy',
  energetic_transmission: 'The energy you transmit when fully in your power',
  recognition_pattern: 'How people recognize when they need you',
  vision_in_action: 'What it looks like when your vision is fully manifested',
  // Shadow fields
  shadow_lie: 'The limiting belief your protective voice whispers',
  shadow_origin: 'The experiences that created this protective pattern',
  shadow_protects: 'The perceived danger it shields you from',
  shadow_kryptonite: 'What dissolves this shadow\'s grip on you',
  shadow_affirmation: 'A truth that counteracts the shadow\'s lie',
  shadow_play_blocker: 'How this voice prevents you from playing freely'
}

// Fields that are arrays (comma-separated in custom mode)
const ARRAY_FIELDS = ['characters']

/**
 * Modal for editing an essence field with three modes:
 * - Browse: Select from any of the 12 archetypes
 * - AI Hybrid: Combine 2-3 archetypes into a new statement
 * - Custom: Write your own
 */
function EditEssenceFieldModal({
  field, // 'essence' | 'superpower' | 'vision' | 'north_star'
  currentValue, // Current display value
  currentMeta, // { mode, value, sources } or null if not customized
  archetypes, // Array of all 12 archetype objects
  userArchetype, // User's archetype name
  userId,
  userEmail,
  onClose,
  onSaved
}) {
  const [activeTab, setActiveTab] = useState(currentMeta?.mode || 'browse')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  // Browse mode state
  const [browseSelection, setBrowseSelection] = useState(
    currentMeta?.mode === 'browse' ? currentMeta.sources?.[0] : userArchetype
  )

  // Hybrid mode state
  const [hybridSelections, setHybridSelections] = useState(
    currentMeta?.mode === 'hybrid' ? currentMeta.sources || [] : []
  )
  const [hybridResult, setHybridResult] = useState(
    currentMeta?.mode === 'hybrid' ? currentMeta.value : ''
  )
  const [generating, setGenerating] = useState(false)

  // Custom mode state - handle arrays as comma-separated
  const [customText, setCustomText] = useState(() => {
    if (currentMeta?.mode === 'custom') {
      const val = currentMeta.value
      return Array.isArray(val) ? val.join(', ') : val
    }
    return ''
  })

  const fieldKey = FIELD_KEYS[field]
  const isArrayField = ARRAY_FIELDS.includes(field)
  const label = FIELD_LABELS[field]
  const description = FIELD_DESCRIPTIONS[field]

  // Get the value for browse selection
  const browseValue = useMemo(() => {
    const archetype = archetypes.find(a => a.name === browseSelection)
    const val = archetype?.[fieldKey]
    // Handle array fields for display
    if (Array.isArray(val)) {
      return val.join(', ')
    }
    return val || ''
  }, [browseSelection, archetypes, fieldKey])

  // Hide bottom toolbar when modal is open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => {
      document.body.classList.remove('modal-active')
    }
  }, [])

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  // Toggle hybrid selection (2-3 max)
  const toggleHybridSelection = (name) => {
    setHybridSelections(prev => {
      if (prev.includes(name)) {
        return prev.filter(n => n !== name)
      }
      if (prev.length >= 3) {
        return prev // Can't add more than 3
      }
      return [...prev, name]
    })
    // Clear previous result when selections change
    setHybridResult('')
  }

  // Generate hybrid statement
  const handleGenerateHybrid = async () => {
    if (hybridSelections.length < 2) {
      setError('Select at least 2 archetypes to combine')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const result = await generateHybridStatement(field, hybridSelections, archetypes)
      setHybridResult(result.statement)
      setToast('Generated!')
    } catch (err) {
      console.error('Error generating hybrid:', err)
      setError('Failed to generate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Get the value that will be saved based on active tab
  const getSaveValue = () => {
    // Helper to convert string to array for array fields
    const processValue = (val) => {
      if (isArrayField && typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(Boolean)
      }
      return val
    }

    switch (activeTab) {
      case 'browse':
        return {
          mode: 'browse',
          value: processValue(browseValue),
          sources: [browseSelection]
        }
      case 'hybrid':
        return {
          mode: 'hybrid',
          value: processValue(hybridResult),
          sources: hybridSelections
        }
      case 'custom':
        return {
          mode: 'custom',
          value: processValue(customText.trim()),
          sources: []
        }
      default:
        return null
    }
  }

  // Check if save is allowed
  const canSave = () => {
    switch (activeTab) {
      case 'browse':
        return browseSelection && browseValue
      case 'hybrid':
        return hybridResult.trim().length > 0
      case 'custom':
        return customText.trim().length > 0
      default:
        return false
    }
  }

  // Check if there are actual changes
  const hasChanges = () => {
    const saveValue = getSaveValue()
    if (!saveValue) return false

    // If switching back to own archetype in browse mode, that's a reset not a save
    if (activeTab === 'browse' && browseSelection === userArchetype) {
      // Only a "change" if there's existing customization to reset
      return !!currentMeta
    }

    // If not customized before, any other selection is a change
    if (!currentMeta) {
      return true
    }

    // Compare with current meta
    if (currentMeta.mode !== activeTab) return true
    if (currentMeta.value !== saveValue.value) return true
    return false
  }

  // Save the selection
  const handleSave = async () => {
    if (!canSave() || !hasChanges()) return

    setSaving(true)
    setError(null)

    try {
      // If selecting own archetype in browse mode, reset instead of save
      if (activeTab === 'browse' && browseSelection === userArchetype && currentMeta) {
        const result = await resetEssenceField(userId, userEmail, field)
        if (result.error) {
          setError('Failed to reset. Please try again.')
          setSaving(false)
          return
        }
        onSaved()
        setToast('Reset to default!')
        setTimeout(() => onClose(), 600)
        return
      }

      const data = getSaveValue()
      const result = await updateEssenceField(userId, userEmail, field, data)

      if (result.error) {
        setError('Failed to save. Please try again.')
        setSaving(false)
        return
      }

      onSaved()
      setToast('Saved!')
      setTimeout(() => onClose(), 600)
    } catch (err) {
      console.error('Error saving:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Reset to default
  const handleReset = async () => {
    if (!currentMeta) return

    setSaving(true)
    setError(null)

    try {
      const result = await resetEssenceField(userId, userEmail, field)

      if (result.error) {
        setError('Failed to reset. Please try again.')
        setSaving(false)
        return
      }

      onSaved()
      setToast('Reset to default!')
      setTimeout(() => onClose(), 600)
    } catch (err) {
      console.error('Error resetting:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edit-field-overlay" onClick={onClose}>
      <div className="edit-field-modal" onClick={e => e.stopPropagation()}>
        {/* Toast */}
        {toast && <div className="edit-field-toast">{toast}</div>}

        {/* Header */}
        <div className="edit-field-header">
          <div>
            <h3>{label}</h3>
            <p className="edit-field-description">{description}</p>
          </div>
          <button className="edit-field-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="edit-field-tabs">
          <button
            className={`edit-field-tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse
          </button>
          <button
            className={`edit-field-tab ${activeTab === 'hybrid' ? 'active' : ''}`}
            onClick={() => setActiveTab('hybrid')}
          >
            AI Hybrid
          </button>
          <button
            className={`edit-field-tab ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            Custom
          </button>
        </div>

        {/* Tab Content */}
        <div className="edit-field-content">
          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <div className="edit-field-browse">
              <p className="edit-field-hint">
                Select any archetype's {field} that resonates with you
              </p>
              <ArchetypeBrowseCarousel
                field={field}
                archetypes={archetypes}
                selectedArchetype={browseSelection}
                currentArchetype={userArchetype}
                onSelect={setBrowseSelection}
                fieldKey={fieldKey}
              />
              {browseSelection && (
                <div className="edit-field-preview">
                  <label>Preview</label>
                  <p>{browseValue}</p>
                </div>
              )}
            </div>
          )}

          {/* Hybrid Tab */}
          {activeTab === 'hybrid' && (
            <div className="edit-field-hybrid">
              <p className="edit-field-hint">
                Select 2-3 archetypes to blend into a unique statement
              </p>
              <div className="hybrid-selection-grid">
                {archetypes.map(archetype => (
                  <button
                    key={archetype.name}
                    className={`hybrid-chip ${hybridSelections.includes(archetype.name) ? 'selected' : ''}`}
                    onClick={() => toggleHybridSelection(archetype.name)}
                  >
                    {archetype.name}
                    {hybridSelections.includes(archetype.name) && (
                      <span className="hybrid-chip-num">
                        {hybridSelections.indexOf(archetype.name) + 1}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="hybrid-actions">
                <span className="hybrid-count">
                  {hybridSelections.length}/3 selected
                </span>
                <button
                  className="hybrid-generate-btn"
                  onClick={handleGenerateHybrid}
                  disabled={hybridSelections.length < 2 || generating}
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {hybridResult && (
                <div className="edit-field-preview">
                  <label>Generated Statement</label>
                  <p>{hybridResult}</p>
                </div>
              )}
            </div>
          )}

          {/* Custom Tab */}
          {activeTab === 'custom' && (
            <div className="edit-field-custom">
              <p className="edit-field-hint">
                Write your own {field} statement
              </p>
              <textarea
                className="custom-textarea"
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder={`Enter your custom ${field}...`}
                rows={5}
              />
              <div className="custom-char-count">
                {customText.length} characters
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="edit-field-error">{error}</div>}

        {/* Actions */}
        <div className="edit-field-actions">
          {currentMeta && (
            <button
              className="edit-field-reset"
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Default
            </button>
          )}
          <div className="edit-field-actions-right">
            <button className="edit-field-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="edit-field-save"
              onClick={handleSave}
              disabled={saving || !canSave() || !hasChanges()}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditEssenceFieldModal
