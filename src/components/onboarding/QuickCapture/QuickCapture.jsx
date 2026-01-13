/**
 * QuickCapture.jsx
 *
 * Orchestrates the Quick Capture onboarding flow for non-pre-ladder users
 * Steps: Skills → Problems → Personas → Products → Summary
 *
 * Props:
 * - userId: The user's ID
 * - wealthLadder: 'service' | 'productized' | 'products'
 * - guidanceEmphasis: The determined emphasis value
 * - onComplete: Callback when capture is complete
 * - onBack: Callback to go back
 *
 * Created: Jan 2026
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
  SKILLS_SEGMENTS,
  PROBLEM_SEGMENTS,
  PERSONA_SEGMENTS
} from '../../../lib/wheelTaxonomy'
import WheelPicker from './WheelPicker'
import MultiProductCapture from './MultiProductCapture'
import './QuickCapture.css'

// Steps in the quick capture flow
const STEPS = ['skills', 'problems', 'personas', 'products', 'summary']

// Local storage key prefix
const STORAGE_KEY = 'quick_capture_progress'

function QuickCapture({
  userId,
  wealthLadder,
  guidanceEmphasis,
  onComplete,
  onBack
}) {
  // Current step index
  const [currentStep, setCurrentStep] = useState(0)

  // Captured data
  const [capturedData, setCapturedData] = useState({
    skills: [],
    problems: [],
    personas: [],
    products: []
  })

  // Saving state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Helper to get display name for segments
  const getSegmentName = useMemo(() => {
    const segmentMap = {
      skills: Object.fromEntries(SKILLS_SEGMENTS.map(s => [s.id, s.displayName])),
      problems: Object.fromEntries(PROBLEM_SEGMENTS.map(s => [s.id, s.displayName])),
      personas: Object.fromEntries(PERSONA_SEGMENTS.map(s => [s.id, s.displayName]))
    }
    return (type, id) => segmentMap[type]?.[id] || id
  }, [])

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (savedProgress) {
      try {
        const { step, data } = JSON.parse(savedProgress)
        setCurrentStep(step)
        setCapturedData(data)
      } catch {
        // Invalid saved data, start fresh
      }
    }
  }, [userId])

  // Save progress to localStorage
  const saveProgress = useCallback((step, data) => {
    localStorage.setItem(
      `${STORAGE_KEY}_${userId}`,
      JSON.stringify({ step, data, timestamp: Date.now() })
    )
  }, [userId])

  // Get current step name
  const currentStepName = STEPS[currentStep]

  // Handle wheel selection
  const handleWheelSelect = (type, selections) => {
    const newData = { ...capturedData, [type]: selections }
    setCapturedData(newData)
    saveProgress(currentStep, newData)
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      saveProgress(nextStep, capturedData)
    }
  }

  // Handle back
  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      saveProgress(prevStep, capturedData)
    } else if (onBack) {
      onBack()
    }
  }

  // Handle products capture completion
  const handleProductsComplete = (products) => {
    const newData = { ...capturedData, products }
    setCapturedData(newData)
    saveProgress(currentStep + 1, newData)
    setCurrentStep(currentStep + 1)
  }

  // Save all data to database
  const saveToDatabase = async () => {
    setIsSaving(true)
    setSaveError(null)

    try {
      // 1. Save skills to nikigai_responses
      const skillPromises = capturedData.skills.map(skill =>
        supabase.from('nikigai_responses').insert({
          user_id: userId,
          flow_type: 'skills',
          question_id: 'quick_capture_skill',
          answer: skill.id,
          metadata: { ring: skill.ring, source: 'quick_capture' }
        })
      )

      // 2. Save problems to nikigai_responses
      const problemPromises = capturedData.problems.map(problem =>
        supabase.from('nikigai_responses').insert({
          user_id: userId,
          flow_type: 'problems',
          question_id: 'quick_capture_problem',
          answer: problem.id,
          metadata: { ring: problem.ring, source: 'quick_capture' }
        })
      )

      // 3. Save personas to nikigai_responses
      const personaPromises = capturedData.personas.map(persona =>
        supabase.from('nikigai_responses').insert({
          user_id: userId,
          flow_type: 'persona',
          question_id: 'quick_capture_persona',
          answer: persona.id,
          metadata: { ring: persona.ring, source: 'quick_capture' }
        })
      )

      // 4. Save products to products table
      const productPromises = capturedData.products.map(product =>
        supabase.from('products').insert({
          user_id: userId,
          name: product.name,
          description: product.description || null,
          product_type: product.productType,
          product_subtype: product.productSubtype || null,
          money_model_tier: product.tier,
          price_type: product.priceType || null,
          price_amount: product.price ? parseFloat(product.price) : null,
          status: 'active',
          source: 'quick_capture',
          metadata: {
            category: product.category,
            captured_at: new Date().toISOString()
          }
        })
      )

      // Execute all saves
      await Promise.all([
        ...skillPromises,
        ...problemPromises,
        ...personaPromises,
        ...productPromises
      ])

      // 5. Mark quick capture as complete in user_stage_progress
      await supabase
        .from('user_stage_progress')
        .update({
          onboarding_v2_completed: true,
          guidance_emphasis: guidanceEmphasis,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      // Clear localStorage
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`)

      // Complete
      onComplete(capturedData)

    } catch (error) {
      console.error('Error saving quick capture data:', error)
      setSaveError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate progress percentage
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100

  // Check if current step is complete
  const isStepComplete = () => {
    switch (currentStepName) {
      case 'skills': return capturedData.skills.length > 0
      case 'problems': return capturedData.problems.length > 0
      case 'personas': return capturedData.personas.length > 0
      case 'products': return capturedData.products.length > 0
      case 'summary': return true
      default: return false
    }
  }

  // Render current step
  const renderStep = () => {
    switch (currentStepName) {
      case 'skills':
        return (
          <div className="wheel-step">
            <WheelPicker
              type="skills"
              max={3}
              selected={capturedData.skills}
              onSelect={(selections) => handleWheelSelect('skills', selections)}
            />
            <div className="step-actions">
              <button className="back-btn" onClick={handleBack}>Back</button>
              <button
                className="next-btn"
                disabled={!isStepComplete()}
                onClick={handleNext}
              >
                Continue
              </button>
            </div>
          </div>
        )

      case 'problems':
        return (
          <div className="wheel-step">
            <WheelPicker
              type="problems"
              max={3}
              selected={capturedData.problems}
              onSelect={(selections) => handleWheelSelect('problems', selections)}
            />
            <div className="step-actions">
              <button className="back-btn" onClick={handleBack}>Back</button>
              <button
                className="next-btn"
                disabled={!isStepComplete()}
                onClick={handleNext}
              >
                Continue
              </button>
            </div>
          </div>
        )

      case 'personas':
        return (
          <div className="wheel-step">
            <WheelPicker
              type="personas"
              max={3}
              selected={capturedData.personas}
              onSelect={(selections) => handleWheelSelect('personas', selections)}
            />
            <div className="step-actions">
              <button className="back-btn" onClick={handleBack}>Back</button>
              <button
                className="next-btn"
                disabled={!isStepComplete()}
                onClick={handleNext}
              >
                Continue
              </button>
            </div>
          </div>
        )

      case 'products':
        return (
          <MultiProductCapture
            wealthLadder={wealthLadder}
            onComplete={handleProductsComplete}
            onBack={handleBack}
          />
        )

      case 'summary':
        return (
          <div className="summary-step">
            <div className="summary-header">
              <span className="success-icon">✨</span>
              <h2>Great job!</h2>
              <p>Here's what we captured about your business</p>
            </div>

            <div className="summary-sections">
              {/* Skills summary */}
              <div className="summary-section">
                <h4>Your Skills ({capturedData.skills.length})</h4>
                <div className="summary-chips">
                  {capturedData.skills.map(skill => (
                    <span key={skill.id} className="summary-chip">
                      {getSegmentName('skills', skill.id)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Problems summary */}
              <div className="summary-section">
                <h4>Problems You Solve ({capturedData.problems.length})</h4>
                <div className="summary-chips">
                  {capturedData.problems.map(problem => (
                    <span key={problem.id} className="summary-chip">
                      {getSegmentName('problems', problem.id)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Personas summary */}
              <div className="summary-section">
                <h4>Who You Help ({capturedData.personas.length})</h4>
                <div className="summary-chips">
                  {capturedData.personas.map(persona => (
                    <span key={persona.id} className="summary-chip">
                      {getSegmentName('personas', persona.id)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Products summary */}
              <div className="summary-section">
                <h4>Your Products ({capturedData.products.length})</h4>
                <div className="products-summary">
                  {capturedData.products.map((product, idx) => (
                    <div key={idx} className="product-summary-card">
                      <span className="product-name">{product.name}</span>
                      {product.tier && <span className="product-tier">{product.tier}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {saveError && (
              <div className="save-error">{saveError}</div>
            )}

            <div className="summary-actions">
              <button className="back-btn" onClick={handleBack}>Back</button>
              <button
                className="complete-btn"
                onClick={saveToDatabase}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="quick-capture">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="progress-label">
          Step {currentStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* Step Content */}
      <div className="step-content">
        {renderStep()}
      </div>
    </div>
  )
}

export default QuickCapture
