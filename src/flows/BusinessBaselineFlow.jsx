/**
 * BusinessBaselineFlow - Capture revenue, margins, and capacity
 *
 * Part of Tier 4 Autonomous System setup.
 * ~2 minute flow that captures financial and operational context.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './BusinessBaselineFlow.css'

const STEPS = [
  {
    id: 'revenue',
    title: 'Revenue Baseline',
    subtitle: 'Where are you now and where do you want to go?',
    fields: [
      {
        id: 'current_monthly_revenue',
        label: "What's your current monthly revenue?",
        help: 'Approximate is fine - we just need a baseline',
        type: 'currency',
        placeholder: '5000',
        required: true,
      },
      {
        id: 'target_monthly_revenue',
        label: "What's your target monthly revenue?",
        help: 'Your goal in the next 6-12 months',
        type: 'currency',
        placeholder: '15000',
        required: true,
      },
    ],
  },
  {
    id: 'margins',
    title: 'Profitability',
    subtitle: 'Understanding your margins helps AI recommend pricing',
    fields: [
      {
        id: 'cost_to_deliver',
        label: 'What does it cost you to deliver your core offer?',
        help: 'Include your time, tools, materials, contractors',
        type: 'currency',
        placeholder: '500',
        required: true,
      },
      {
        id: 'marketing_budget_monthly',
        label: "What's your monthly marketing budget?",
        help: 'Ads, software, content creation, etc.',
        type: 'currency',
        placeholder: '500',
        required: false,
      },
    ],
  },
  {
    id: 'capacity',
    title: 'Capacity',
    subtitle: 'So AI never recommends more than you can handle',
    fields: [
      {
        id: 'hours_per_week',
        label: 'How many hours per week can you dedicate?',
        type: 'slider',
        min: 5,
        max: 60,
        default: 20,
        unit: 'hours',
        required: true,
      },
      {
        id: 'max_clients',
        label: 'Maximum clients you can serve at once?',
        type: 'number',
        placeholder: '10',
        required: true,
      },
      {
        id: 'current_clients',
        label: 'How many active clients do you have now?',
        type: 'number',
        placeholder: '3',
        required: false,
      },
    ],
  },
  {
    id: 'team',
    title: 'Team Size',
    subtitle: 'Understanding your resources',
    fields: [
      {
        id: 'team_size',
        label: "What's your team size? (including yourself)",
        type: 'options',
        options: [
          { value: 1, label: 'Just me (solopreneur)' },
          { value: 2, label: '2 people' },
          { value: 3, label: '3-5 people' },
          { value: 6, label: '6-10 people' },
          { value: 11, label: '11+ people' },
        ],
        required: true,
      },
      {
        id: 'revenue_model',
        label: 'How do you primarily make money?',
        type: 'options',
        options: [
          { value: 'one_time', label: 'One-time payments (projects, courses)' },
          { value: 'subscription', label: 'Recurring subscriptions (memberships)' },
          { value: 'hybrid', label: 'Mix of both' },
        ],
        required: true,
      },
    ],
  },
]

export default function BusinessBaselineFlow({ userId }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    hours_per_week: 20,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load existing data if available
  useEffect(() => {
    if (userId) {
      loadExistingData()
    }
  }, [userId])

  async function loadExistingData() {
    try {
      const { data } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        setAnswers({
          current_monthly_revenue: data.current_monthly_revenue || '',
          target_monthly_revenue: data.target_monthly_revenue || '',
          cost_to_deliver: data.cost_to_deliver || '',
          marketing_budget_monthly: data.marketing_budget_monthly || '',
          hours_per_week: data.hours_per_week || 20,
          max_clients: data.max_clients || '',
          current_clients: data.current_clients || '',
          team_size: data.team_size || '',
          revenue_model: data.revenue_model || '',
        })
      }
    } catch (err) {
      // No existing data, that's fine
    }
  }

  const currentStep = STEPS[step]

  const handleFieldChange = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  const canProceed = () => {
    return currentStep.fields
      .filter(f => f.required)
      .every(f => answers[f.id] !== undefined && answers[f.id] !== '')
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
      // Calculate gross margin if we have the data
      let grossMarginPercent = null
      if (answers.cost_to_deliver && answers.current_monthly_revenue) {
        // Very rough estimate - assumes one delivery per month
        const revenue = parseFloat(answers.current_monthly_revenue)
        const cost = parseFloat(answers.cost_to_deliver)
        if (revenue > 0) {
          grossMarginPercent = Math.round(((revenue - cost) / revenue) * 100)
        }
      }

      // Upsert business profile
      const { error: upsertError } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: userId,
          current_monthly_revenue: parseFloat(answers.current_monthly_revenue) || null,
          target_monthly_revenue: parseFloat(answers.target_monthly_revenue) || null,
          cost_to_deliver: parseFloat(answers.cost_to_deliver) || null,
          marketing_budget_monthly: parseFloat(answers.marketing_budget_monthly) || null,
          gross_margin_percent: grossMarginPercent,
          hours_per_week: parseInt(answers.hours_per_week) || null,
          max_clients: parseInt(answers.max_clients) || null,
          current_clients: parseInt(answers.current_clients) || 0,
          team_size: parseInt(answers.team_size) || 1,
          revenue_model: answers.revenue_model || null,
          setup_completed: true,
          setup_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      if (upsertError) throw upsertError

      // Update progress tracker
      await supabase
        .from('autonomous_setup_progress')
        .upsert({
          user_id: userId,
          business_baseline_completed: true,
          business_baseline_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      // Navigate back to setup
      navigate('/crm/setup')
    } catch (err) {
      console.error('Error saving business baseline:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="baseline-flow">
      {/* Header */}
      <div className="baseline-header">
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
      <div className="baseline-content">
        <div className="step-header">
          <span className="step-icon">📊</span>
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

              {field.type === 'currency' && (
                <div className="currency-input">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    value={answers[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  className="number-input"
                  value={answers[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
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
                    {answers[field.id] || field.default} {field.unit}
                  </span>
                </div>
              )}

              {field.type === 'options' && (
                <div className="options-grid">
                  {field.options.map((opt) => (
                    <button
                      key={opt.value}
                      className={`option-btn ${answers[field.id] === opt.value ? 'selected' : ''}`}
                      onClick={() => handleFieldChange(field.id, opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Footer */}
      <div className="baseline-footer">
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
