/**
 * CustomerSegmentsFlow - Capture best & worst customer profiles
 *
 * Part of Tier 4 Autonomous System setup.
 * ~3 minute flow that captures customer segment intelligence.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './CustomerSegmentsFlow.css'

const STEPS = [
  {
    id: 'best_customer',
    title: 'Your Best Customer',
    subtitle: 'Think of your most profitable, enjoyable client',
    icon: '⭐',
    fields: [
      {
        id: 'best_description',
        label: 'Describe your BEST customer',
        help: 'Most profitable, easiest to work with, best results',
        type: 'textarea',
        placeholder: 'e.g., Small business owner, 5-10 employees, tech-savvy, values their time, makes decisions quickly, refers others...',
        required: true,
      },
      {
        id: 'best_buying_trigger',
        label: 'What made them finally buy?',
        help: 'The tipping point that got them to act',
        type: 'textarea',
        placeholder: "e.g., Lost a big client and realized they needed help, heard me on a podcast, friend's recommendation...",
        required: true,
      },
    ],
  },
  {
    id: 'best_economics',
    title: 'Best Customer Economics',
    subtitle: 'Understanding the value they bring',
    icon: '💰',
    fields: [
      {
        id: 'best_revenue_percent',
        label: 'What % of your revenue comes from customers like this?',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50,
        unit: '%',
        required: true,
      },
      {
        id: 'best_ease_rating',
        label: 'How easy are they to work with?',
        type: 'rating',
        labels: ['Difficult', 'Average', 'Dream clients'],
        required: true,
      },
    ],
  },
  {
    id: 'worst_customer',
    title: 'Your Worst Customer',
    subtitle: 'The ones that drain your energy',
    icon: '😓',
    fields: [
      {
        id: 'worst_description',
        label: 'Describe your WORST customer',
        help: 'Low profit, high maintenance, poor results',
        type: 'textarea',
        placeholder: 'e.g., Price shoppers, unclear on what they want, constantly changes scope, slow to pay, negative attitude...',
        required: true,
      },
      {
        id: 'worst_red_flags',
        label: 'What are the red flags you now recognize?',
        help: 'Warning signs you look for to avoid these clients',
        type: 'textarea',
        placeholder: 'e.g., Asks for discount before seeing value, compares to cheap alternatives, wants guarantees upfront...',
        required: true,
      },
    ],
  },
  {
    id: 'objections',
    title: 'Common Objections',
    subtitle: 'What stops good prospects from buying?',
    icon: '🤔',
    fields: [
      {
        id: 'common_objections',
        label: 'Top 3 objections you hear from prospects',
        help: 'The reasons they hesitate or say no',
        type: 'multi_text',
        placeholders: [
          'e.g., "It\'s too expensive"',
          'e.g., "I need to think about it"',
          'e.g., "I\'m not sure it\'ll work for me"',
        ],
        required: true,
      },
    ],
  },
]

export default function CustomerSegmentsFlow({ userId }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    best_revenue_percent: 50,
    best_ease_rating: 5,
    common_objections: ['', '', ''],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load existing data
  useEffect(() => {
    if (userId) {
      loadExistingData()
    }
  }, [userId])

  async function loadExistingData() {
    try {
      const { data: segments } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('user_id', userId)

      if (segments?.length) {
        const best = segments.find(s => s.segment_type === 'best')
        const worst = segments.find(s => s.segment_type === 'worst')

        setAnswers(prev => ({
          ...prev,
          best_description: best?.description || '',
          best_buying_trigger: best?.buying_trigger || '',
          best_revenue_percent: best?.revenue_percent || 50,
          best_ease_rating: best?.ease_of_work_rating || 5,
          worst_description: worst?.description || '',
          worst_red_flags: worst?.common_objections?.join('\n') || '',
          common_objections: worst?.common_objections?.slice(0, 3) || ['', '', ''],
        }))
      }
    } catch (err) {
      // No existing data, that's fine
    }
  }

  const currentStep = STEPS[step]

  const handleFieldChange = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleObjectionChange = (index, value) => {
    setAnswers(prev => {
      const updated = [...(prev.common_objections || ['', '', ''])]
      updated[index] = value
      return { ...prev, common_objections: updated }
    })
  }

  const canProceed = () => {
    if (currentStep.id === 'objections') {
      // At least 1 objection filled
      return answers.common_objections?.some(o => o.trim())
    }
    return currentStep.fields
      .filter(f => f.required)
      .every(f => {
        const val = answers[f.id]
        if (f.type === 'slider' || f.type === 'rating') return val !== undefined
        return val && val.toString().trim()
      })
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    } else {
      navigate('/crm/setup')
    }
  }

  async function handleComplete() {
    setSaving(true)
    setError(null)

    try {
      // Delete existing segments first
      await supabase
        .from('customer_segments')
        .delete()
        .eq('user_id', userId)

      // Insert best customer segment
      await supabase
        .from('customer_segments')
        .insert({
          user_id: userId,
          segment_name: 'Best Customer',
          segment_type: 'best',
          description: answers.best_description,
          revenue_percent: parseInt(answers.best_revenue_percent) || 0,
          ease_of_work_rating: parseInt(answers.best_ease_rating) || 5,
          buying_trigger: answers.best_buying_trigger,
        })

      // Insert worst customer segment
      await supabase
        .from('customer_segments')
        .insert({
          user_id: userId,
          segment_name: 'Worst Customer',
          segment_type: 'worst',
          description: answers.worst_description,
          common_objections: answers.common_objections?.filter(o => o.trim()) || [],
        })

      // Update progress tracker
      await supabase
        .from('autonomous_setup_progress')
        .upsert({
          user_id: userId,
          customer_segments_completed: true,
          customer_segments_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      navigate('/crm/setup')
    } catch (err) {
      console.error('Error saving customer segments:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="segments-flow">
      {/* Header */}
      <div className="segments-header">
        <button className="back-btn" onClick={handleBack}>
          ← {step === 0 ? 'Exit' : 'Back'}
        </button>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="step-counter">{step + 1}/{STEPS.length}</span>
      </div>

      {/* Content */}
      <div className="segments-content">
        <div className="step-header">
          <span className="step-icon">{currentStep.icon}</span>
          <h2>{currentStep.title}</h2>
          <p>{currentStep.subtitle}</p>
        </div>

        <div className="fields">
          {currentStep.fields.map((field) => (
            <div key={field.id} className="field-group">
              <label className="field-label">
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              {field.help && <p className="field-help">{field.help}</p>}

              {field.type === 'textarea' && (
                <textarea
                  className="textarea-input"
                  value={answers[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                />
              )}

              {field.type === 'slider' && (
                <div className="slider-input">
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    value={answers[field.id] || field.default}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                  <span className="slider-value">
                    {answers[field.id] || field.default}{field.unit}
                  </span>
                </div>
              )}

              {field.type === 'rating' && (
                <div className="rating-input">
                  <div className="rating-track">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <button
                        key={num}
                        className={`rating-dot ${(answers[field.id] || 5) >= num ? 'active' : ''}`}
                        onClick={() => handleFieldChange(field.id, num)}
                      />
                    ))}
                  </div>
                  <div className="rating-labels">
                    {field.labels.map((label, idx) => (
                      <span key={idx}>{label}</span>
                    ))}
                  </div>
                </div>
              )}

              {field.type === 'multi_text' && (
                <div className="multi-text-inputs">
                  {field.placeholders.map((placeholder, idx) => (
                    <input
                      key={idx}
                      type="text"
                      className="text-input"
                      value={answers.common_objections?.[idx] || ''}
                      onChange={(e) => handleObjectionChange(idx, e.target.value)}
                      placeholder={placeholder}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Footer */}
      <div className="segments-footer">
        <button
          className="next-btn"
          onClick={handleNext}
          disabled={!canProceed() || saving}
        >
          {saving ? 'Saving...' : step === STEPS.length - 1 ? 'Complete' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
