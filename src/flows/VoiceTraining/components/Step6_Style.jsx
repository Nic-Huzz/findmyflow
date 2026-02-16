/**
 * Step 6: Your Style (was Step 5: Preferences)
 * Sliders demoted to collapsed optional section. Catchphrases stay visible.
 */
import { useState } from 'react'

const SLIDERS = [
  {
    key: 'sentenceLength',
    label: 'Sentence Length',
    leftLabel: 'Short & punchy',
    rightLabel: 'Long & flowing'
  },
  {
    key: 'emojiUsage',
    label: 'Emoji Usage',
    leftLabel: 'Rarely',
    rightLabel: 'Often'
  },
  {
    key: 'humorLevel',
    label: 'Humor Level',
    leftLabel: 'Serious',
    rightLabel: 'Playful'
  },
  {
    key: 'formalityLevel',
    label: 'Formality',
    leftLabel: 'Casual',
    rightLabel: 'Professional'
  },
  {
    key: 'vulnerabilityLevel',
    label: 'Vulnerability',
    leftLabel: 'Private',
    rightLabel: 'Open'
  }
]

export default function Step6_Style({ preferences, catchphrases, onChangePreferences, onChangeCatchphrases, onContinue }) {
  const [prefs, setPrefs] = useState(preferences || {
    sentenceLength: 50,
    emojiUsage: 40,
    humorLevel: 50,
    formalityLevel: 40,
    vulnerabilityLevel: 50
  })
  const [phrases, setPhrases] = useState(catchphrases || [])
  const [phraseInput, setPhraseInput] = useState('')
  const [showSliders, setShowSliders] = useState(false)

  const handleSliderChange = (key, value) => {
    const updated = { ...prefs, [key]: parseInt(value) }
    setPrefs(updated)
    onChangePreferences(updated)
  }

  const handleAddPhrase = () => {
    const trimmed = phraseInput.trim()
    if (trimmed && !phrases.includes(trimmed) && phrases.length < 10) {
      const updated = [...phrases, trimmed]
      setPhrases(updated)
      onChangeCatchphrases(updated)
      setPhraseInput('')
    }
  }

  const handleRemovePhrase = (phrase) => {
    const updated = phrases.filter(p => p !== phrase)
    setPhrases(updated)
    onChangeCatchphrases(updated)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddPhrase()
    }
  }

  const getSliderLabel = (value) => {
    if (value < 25) return 'Low'
    if (value < 50) return 'Medium-Low'
    if (value < 75) return 'Medium-High'
    return 'High'
  }

  return (
    <div className="vt-step">
      <div className="vt-step-header">
        <h2>Style &amp; Catchphrases</h2>
        <p>
          Add your signature phrases, and optionally fine-tune style sliders.
        </p>
      </div>

      {/* Catchphrases — always visible, high value */}
      <div className="vt-step-header" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Your catchphrases (optional)</h3>
        <p style={{ fontSize: '14px' }}>
          Any signature phrases, words, or expressions you use often?
        </p>
      </div>

      <div className="vt-tags-input">
        {phrases.map(phrase => (
          <span key={phrase} className="vt-tag">
            {phrase}
            <button
              className="vt-tag-remove"
              onClick={() => handleRemovePhrase(phrase)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className="vt-tag-input"
          value={phraseInput}
          onChange={(e) => setPhraseInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={phrases.length === 0 ? "Type and press Enter (e.g., 'Real talk', 'Here's the thing')" : 'Add another...'}
          maxLength={50}
        />
      </div>

      <div className="vt-tip">
        <span className="vt-tip-icon">💡</span>
        <div className="vt-tip-content">
          <strong>Examples:</strong> &quot;Let me be real&quot;, &quot;Here&apos;s the thing&quot;,
          &quot;Plot twist&quot;, &quot;Hot take&quot;, &quot;The truth is&quot;, &quot;Listen...&quot;
        </div>
      </div>

      {/* Sliders — collapsed by default */}
      <button
        className="vt-secondary-btn"
        onClick={() => setShowSliders(!showSliders)}
        style={{ marginBottom: '16px', marginTop: '8px' }}
      >
        {showSliders ? '▾ Hide style sliders' : '▸ Fine-tune style sliders (optional)'}
      </button>

      <p style={{ fontSize: 13, color: '#6c757d', marginTop: 0, marginBottom: 12 }}>
        These are auto-set from your writing samples and influences. Adjust only if needed.
      </p>

      {showSliders && (
        <div style={{ marginBottom: '32px' }}>
          {SLIDERS.map(slider => (
            <div key={slider.key} className="vt-slider-group">
              <div className="vt-slider-header">
                <span className="vt-slider-label">{slider.label}</span>
                <span className="vt-slider-value">{getSliderLabel(prefs[slider.key])}</span>
              </div>
              <input
                type="range"
                className="vt-slider"
                min="0"
                max="100"
                value={prefs[slider.key]}
                onChange={(e) => handleSliderChange(slider.key, e.target.value)}
              />
              <div className="vt-slider-labels">
                <span>{slider.leftLabel}</span>
                <span>{slider.rightLabel}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="vt-continue-btn"
        onClick={onContinue}
      >
        Continue →
      </button>
    </div>
  )
}
