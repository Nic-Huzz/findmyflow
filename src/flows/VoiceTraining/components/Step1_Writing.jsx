/**
 * Step 1: Your Writing
 * Paste 3-5 pieces of content — writing samples are now the first and most important step.
 * Promoted from old Step 6 (Content Samples).
 */
import { useState } from 'react'

export default function Step1_Writing({ samples, onChangeSamples, onContinue }) {
  const [sampleList, setSampleList] = useState(samples.length > 0 ? samples : [''])

  const handleSampleChange = (index, value) => {
    const updated = [...sampleList]
    updated[index] = value
    setSampleList(updated)
    onChangeSamples(updated.filter(s => s.trim()))
  }

  const handleAddSample = () => {
    if (sampleList.length < 5) {
      setSampleList([...sampleList, ''])
    }
  }

  const handleRemoveSample = (index) => {
    if (sampleList.length > 1) {
      const updated = sampleList.filter((_, i) => i !== index)
      setSampleList(updated)
      onChangeSamples(updated.filter(s => s.trim()))
    }
  }

  const filledSamples = sampleList.filter(s => s.trim().length >= 100)
  const canContinue = filledSamples.length >= 1

  return (
    <div className="vt-step">
      <div className="vt-step-header">
        <h2>Share your writing</h2>
        <p>
          Paste 3-5 pieces of content you&apos;ve written. Include at least one casual piece
          (social post, text, email) — that&apos;s where your real voice lives.
        </p>
      </div>

      <div className="vt-samples-list">
        {sampleList.map((sample, index) => (
          <div key={index} className="vt-sample-item">
            <textarea
              className="vt-sample-textarea"
              value={sample}
              onChange={(e) => handleSampleChange(index, e.target.value)}
              placeholder={`Paste content sample ${index + 1} here... (min 100 characters)\n\nThis could be:\n• A social media post\n• An email newsletter\n• A website about section\n• A caption you wrote\n• A text or DM about your work`}
              maxLength={2000}
            />
            {sampleList.length > 1 && (
              <button
                className="vt-sample-remove"
                onClick={() => handleRemoveSample(index)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {sampleList.length < 5 && (
          <button
            className="vt-add-sample-btn"
            onClick={handleAddSample}
          >
            <span>+</span> Add another sample
          </button>
        )}
      </div>

      <div className="vt-char-count">
        {filledSamples.length} of {sampleList.length} samples ready (min 100 chars each)
      </div>

      <div className="vt-tip">
        <span className="vt-tip-icon">💡</span>
        <div className="vt-tip-content">
          <strong>Best results:</strong> Mix formal (blog post, email) with informal
          (social post, text message). The casual stuff captures your real voice best.
        </div>
      </div>

      <button
        className="vt-continue-btn"
        onClick={onContinue}
        disabled={!canContinue}
      >
        {canContinue ? 'Continue →' : 'Add at least 1 sample (100+ chars)'}
      </button>
    </div>
  )
}
