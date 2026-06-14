import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PREWORK_STEPS } from '../../data/appBuildChallenges'
import useAppBuildData from '../../hooks/useAppBuildData'
import './AppBuildPrework.css'

const DEFAULT_FEATURES = [
  { name: '', description: '' },
  { name: '', description: '' },
  { name: '', description: '' }
]

const DEFAULT_STEPS = ['', '', '', '', '']
const DEFAULT_LIST = ['', '', '']

function initResponses(saved) {
  const r = { ...saved }
  if (!r.features || !Array.isArray(r.features)) r.features = DEFAULT_FEATURES.map(f => ({ ...f }))
  if (!r.user_flow || !Array.isArray(r.user_flow)) r.user_flow = [...DEFAULT_STEPS]
  if (!r.out_of_scope || !Array.isArray(r.out_of_scope)) r.out_of_scope = [...DEFAULT_LIST]
  if (!r.design || typeof r.design !== 'object') r.design = {}
  return r
}

export default function AppBuildPrework() {
  const navigate = useNavigate()
  const { prework, savePrework, loading } = useAppBuildData()
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState(() => initResponses({}))
  const [complete, setComplete] = useState(false)
  const [saving, setSaving] = useState(false)

  // Pre-fill from saved prework when it loads
  useEffect(() => {
    if (prework?.responses) {
      setResponses(initResponses(prework.responses))
    }
    if (prework?.completedAt) {
      setComplete(true)
    }
  }, [prework])

  const step = PREWORK_STEPS[currentStep]
  const isLastStep = currentStep === PREWORK_STEPS.length - 1

  function updateResponse(key, value) {
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  async function handleNext() {
    setSaving(true)
    if (isLastStep) {
      await savePrework(responses, true)
      setComplete(true)
    } else {
      await savePrework(responses, false)
      setCurrentStep(prev => prev + 1)
    }
    setSaving(false)
  }

  function handleBack() {
    if (currentStep === 0) {
      navigate('/create/build-app')
    } else {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="app-build-prework">
        <div className="prework-loading">
          <div className="prework-spinner" />
        </div>
      </div>
    )
  }

  if (complete) {
    return (
      <div className="app-build-prework">
        <div className="prework-success">
          <div className="success-icon">&#10003;</div>
          <h2>You're ready to build!</h2>
          <p>Your product definition is complete. Time to bring it to life.</p>
          <button
            className="prework-btn-primary"
            onClick={() => navigate('/create/build-app/challenge/1')}
          >
            Start Challenge 1
          </button>
          <button
            className="prework-btn-ghost"
            onClick={() => { setComplete(false); setCurrentStep(0) }}
          >
            Edit responses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-build-prework">
      {/* Progress dots */}
      <div className="prework-progress">
        {PREWORK_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`prework-dot${i < currentStep ? ' completed' : ''}${i === currentStep ? ' current' : ''}`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="prework-step">
        <div className="prework-step-meta">
          <span className="step-number">Step {currentStep + 1} of {PREWORK_STEPS.length}</span>
          {step.duration && <span className="step-duration">{step.duration}</span>}
        </div>

        <h2 className="prework-step-title">{step.title}</h2>
        <p className="prework-step-instruction">{step.instruction}</p>

        {step.example && (
          <div className="prework-example">
            <span className="example-label">Example</span>
            <p>{step.example}</p>
          </div>
        )}

        {/* Input area */}
        <div className="prework-input-area">
          {step.inputType === 'textarea' && (
            <TextareaInput
              value={responses[step.id] || ''}
              onChange={val => updateResponse(step.id, val)}
              placeholder={step.placeholder}
            />
          )}

          {step.inputType === 'features' && (
            <FeaturesInput
              value={responses.features}
              onChange={val => updateResponse('features', val)}
              placeholder={step.placeholder}
            />
          )}

          {step.inputType === 'steps' && (
            <StepsInput
              value={responses.user_flow}
              onChange={val => updateResponse('user_flow', val)}
              placeholder={step.placeholder}
            />
          )}

          {step.inputType === 'design' && (
            <DesignInput
              fields={step.fields}
              value={responses.design}
              onChange={val => updateResponse('design', val)}
            />
          )}

          {step.inputType === 'list' && (
            <ListInput
              value={responses.out_of_scope}
              onChange={val => updateResponse('out_of_scope', val)}
              placeholder={step.placeholder}
            />
          )}
        </div>

        {/* Checkpoint */}
        {step.checkpoint && (
          <div className="prework-checkpoint">
            <span className="checkpoint-icon">&#9989;</span>
            <span>{step.checkpoint}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="prework-nav">
        <button className="prework-btn-ghost" onClick={handleBack}>
          {currentStep === 0 ? 'Back' : 'Previous'}
        </button>
        <button
          className="prework-btn-primary"
          onClick={handleNext}
          disabled={saving}
        >
          {saving ? 'Saving...' : isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  )
}

/* ── Input Components ───────────────────────────────────────────────────── */

function TextareaInput({ value, onChange, placeholder }) {
  return (
    <textarea
      className="prework-textarea"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
    />
  )
}

function FeaturesInput({ value, onChange, placeholder }) {
  const features = value || []

  function update(index, field, val) {
    const updated = features.map((f, i) => i === index ? { ...f, [field]: val } : f)
    onChange(updated)
  }

  function addFeature() {
    if (features.length >= 5) return
    onChange([...features, { name: '', description: '' }])
  }

  function removeFeature(index) {
    if (features.length <= 1) return
    onChange(features.filter((_, i) => i !== index))
  }

  return (
    <div className="prework-features">
      {features.map((feature, i) => (
        <div key={i} className="feature-entry">
          <div className="feature-header">
            <span className="feature-number">{i + 1}</span>
            {features.length > 1 && (
              <button
                className="feature-remove"
                onClick={() => removeFeature(i)}
                type="button"
              >
                &times;
              </button>
            )}
          </div>
          <input
            type="text"
            className="prework-input"
            value={feature.name}
            onChange={e => update(i, 'name', e.target.value)}
            placeholder={placeholder || 'Feature name...'}
          />
          <textarea
            className="prework-textarea small"
            value={feature.description}
            onChange={e => update(i, 'description', e.target.value)}
            placeholder="What does it do?"
            rows={2}
          />
        </div>
      ))}
      {features.length < 5 && (
        <button className="prework-add-btn" onClick={addFeature} type="button">
          + Add feature
        </button>
      )}
    </div>
  )
}

function StepsInput({ value, onChange, placeholder }) {
  const steps = value || []

  function update(index, val) {
    const updated = steps.map((s, i) => i === index ? val : s)
    onChange(updated)
  }

  function addStep() {
    if (steps.length >= 8) return
    onChange([...steps, ''])
  }

  function removeStep(index) {
    if (steps.length <= 1) return
    onChange(steps.filter((_, i) => i !== index))
  }

  return (
    <div className="prework-steps">
      {steps.map((step, i) => (
        <div key={i} className="step-entry">
          <span className="step-entry-number">{i + 1}.</span>
          <input
            type="text"
            className="prework-input"
            value={step}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder || 'Step...'}
          />
          {steps.length > 1 && (
            <button
              className="step-remove"
              onClick={() => removeStep(i)}
              type="button"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      {steps.length < 8 && (
        <button className="prework-add-btn" onClick={addStep} type="button">
          + Add step
        </button>
      )}
    </div>
  )
}

function DesignInput({ fields, value, onChange }) {
  const design = value || {}

  function update(key, val) {
    onChange({ ...design, [key]: val })
  }

  return (
    <div className="prework-design">
      {Object.entries(fields).map(([key, field]) => {
        if (field.options) {
          return (
            <div key={key} className="design-field">
              <label className="design-label">{field.label}</label>
              <div className="design-pills">
                {field.options.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={`design-pill${design[key] === option ? ' selected' : ''}`}
                    onClick={() => update(key, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )
        }
        return (
          <div key={key} className="design-field">
            <label className="design-label">{field.label}</label>
            <input
              type="text"
              className="prework-input"
              value={design[key] || ''}
              onChange={e => update(key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        )
      })}
    </div>
  )
}

function ListInput({ value, onChange, placeholder }) {
  const items = value || []

  function update(index, val) {
    const updated = items.map((item, i) => i === index ? val : item)
    onChange(updated)
  }

  function addItem() {
    if (items.length >= 6) return
    onChange([...items, ''])
  }

  function removeItem(index) {
    if (items.length <= 1) return
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="prework-list">
      {items.map((item, i) => (
        <div key={i} className="list-entry">
          <span className="list-bullet">&bull;</span>
          <input
            type="text"
            className="prework-input"
            value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder || 'Not building...'}
          />
          {items.length > 1 && (
            <button
              className="list-remove"
              onClick={() => removeItem(i)}
              type="button"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      {items.length < 6 && (
        <button className="prework-add-btn" onClick={addItem} type="button">
          + Add item
        </button>
      )}
    </div>
  )
}
