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
import { logError } from '../../../lib/errorSupport'
import { STAGES } from '../../../lib/stageConfig'
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
  const [errorSupport, setErrorSupport] = useState(null)

  // Transition state for smooth page changes
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)

  // Clear entering state after animation
  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isEntering, currentStep])

  // Helper to get display name for segments
  const getSegmentName = useMemo(() => {
    const segmentMap = {
      skills: Object.fromEntries(SKILLS_SEGMENTS.map(s => [s.id, s.displayName])),
      problems: Object.fromEntries(PROBLEM_SEGMENTS.map(s => [s.id, s.displayName])),
      personas: Object.fromEntries(PERSONA_SEGMENTS.map(s => [s.id, s.displayName]))
    }
    return (type, id) => segmentMap[type]?.[id] || id
  }, [])

  // Helper to get stage label
  const getStageLabel = (stageId) => {
    const stageMap = {
      1: 'Just an idea',
      2: 'Sold a few times',
      4: 'Getting customers',
      6: 'Established',
      7: 'Scaling'
    }
    return stageMap[stageId] || 'Unknown'
  }

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

  // Handle next step with transition
  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && !isTransitioning) {
      setIsTransitioning(true)
      setTimeout(() => {
        const nextStep = currentStep + 1
        setCurrentStep(nextStep)
        saveProgress(nextStep, capturedData)
        setIsTransitioning(false)
        setIsEntering(true)
      }, 200)
    }
  }

  // Handle back with transition
  const handleBack = () => {
    if (isTransitioning) return

    if (currentStep > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        const prevStep = currentStep - 1
        setCurrentStep(prevStep)
        saveProgress(prevStep, capturedData)
        setIsTransitioning(false)
        setIsEntering(true)
      }, 200)
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

  // Helper to save wheel data
  const saveWheelData = async (wheelType, segments) => {
    if (!segments || segments.length === 0) return

    // 1. Create or get the wheel
    const { data: existingWheel } = await supabase
      .from('competence_wheels')
      .select('id')
      .eq('user_id', userId)
      .eq('wheel_type', wheelType)
      .is('project_id', null)
      .maybeSingle()

    let wheelId = existingWheel?.id

    if (!wheelId) {
      const { data: newWheel, error: createError } = await supabase
        .from('competence_wheels')
        .insert({
          user_id: userId,
          wheel_type: wheelType
        })
        .select('id')
        .single()

      if (createError) throw createError
      wheelId = newWheel.id
    }

    // 2. Save each segment
    const segmentInserts = segments.map(segment => ({
      wheel_id: wheelId,
      segment_id: segment.id,
      is_lit: true,
      ring: segment.ring || 'core',
      confidence: 1.0,
      response_count: 1
    }))

    const { error: segmentError } = await supabase
      .from('wheel_segments')
      .upsert(segmentInserts, {
        onConflict: 'wheel_id,segment_id',
        ignoreDuplicates: false
      })

    if (segmentError) {
      console.error('Error saving wheel segments:', segmentError)
    }
  }

  // Save all data to database
  const saveToDatabase = async () => {
    setIsSaving(true)
    setSaveError(null)

    try {
      console.log('Starting save process...', { userId, capturedData })

      // Validate products have required fields
      for (const product of capturedData.products) {
        if (!product.productType) {
          throw new Error(`Product "${product.name}" is missing a product type. Please go back and select one.`)
        }
        if (!product.stage) {
          throw new Error(`Product "${product.name}" is missing a stage. Please go back and select where this product is at.`)
        }
      }

      // 1. Save wheel data (skills, problems, personas)
      console.log('Saving wheel data...')
      await saveWheelData('skills', capturedData.skills)
      await saveWheelData('problems', capturedData.problems)
      await saveWheelData('personas', capturedData.personas)

      // 2. Save products to products table
      console.log('Saving products...')
      for (const product of capturedData.products) {
        console.log('Saving product:', product.name, product)
        const { error: productError } = await supabase.from('products').insert({
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

        if (productError) {
          console.error(`Error saving product "${product.name}":`, productError)
          // Provide specific error for constraint violations
          if (productError.code === '23505') {
            throw new Error(`Product "${product.name}" already exists. Try a different name.`)
          } else if (productError.code === '23503') {
            throw new Error(`Invalid product type for "${product.name}". Please go back and re-select.`)
          }
          throw new Error(
            `Failed to save "${product.name}".\n\n` +
            `Check your internet connection and tap "Complete Setup" to retry.`
          )
        }
      }

      // 2.5 Create projects for all non-pre-ladder users
      // (pre_ladder users complete Flow Finder which creates their project)
      if (wealthLadder === 'service' || wealthLadder === 'productized' || wealthLadder === 'products') {
        console.log('Creating projects for products...')

        // Check if user already has any active projects
        const { data: existingProjects } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')

        const hasExistingProjects = existingProjects && existingProjects.length > 0

        // Create a project for each product
        for (let i = 0; i < capturedData.products.length; i++) {
          const product = capturedData.products[i]
          const isFirstProject = !hasExistingProjects && i === 0

          console.log(`Creating project for product: ${product.name}, isPrimary: ${isFirstProject}`)

          const { error: projectError } = await supabase.from('user_projects').insert({
            user_id: userId,
            name: product.name,
            description: product.description || `${product.productType} offering`,
            source_flow: 'quick_capture',
            status: 'active',
            current_stage: product.stage || STAGES.VALIDATION,
            total_points: 0,
            is_primary: isFirstProject
          })

          if (projectError) {
            console.error(`Error creating project for "${product.name}":`, projectError)
            // Don't fail the whole onboarding for project creation errors
            // The user can still proceed and create projects later
          } else {
            console.log(`Project created for: ${product.name}`)
          }
        }
      }

      // 3. Mark onboarding complete in user_stage_progress
      // First check if record exists
      const { data: existingProgress } = await supabase
        .from('user_stage_progress')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existingProgress) {
        // Update existing record
        await supabase
          .from('user_stage_progress')
          .update({
            onboarding_completed: true,
            onboarding_v2_completed: true,
            guidance_emphasis: guidanceEmphasis,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
      } else {
        // Create new record if it doesn't exist
        // Map wealth ladder to persona (service + productized = vibe_riser, products = movement_maker)
        const personaMap = {
          service: 'vibe_riser',
          productized: 'vibe_riser',
          products: 'movement_maker'
        }
        await supabase
          .from('user_stage_progress')
          .insert({
            user_id: userId,
            persona: personaMap[wealthLadder] || 'vibe_seeker',
            current_stage: 'validation',
            onboarding_completed: true,
            onboarding_v2_completed: true,
            guidance_emphasis: guidanceEmphasis
          })
      }

      // Clear localStorage
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`)

      // Complete
      console.log('Save successful! Calling onComplete...')
      onComplete(capturedData)
      console.log('onComplete called, should navigate to /me')

    } catch (error) {
      console.error('Error saving quick capture data:', error)

      // Log error and get support helper
      const { offerSupport, errorMessage } = await logError({
        error,
        component: 'QuickCapture',
        action: 'save_onboarding_data',
        userId,
        metadata: {
          skillsCount: capturedData.skills.length,
          problemsCount: capturedData.problems.length,
          personasCount: capturedData.personas.length,
          productsCount: capturedData.products.length
        }
      })

      setErrorSupport(() => offerSupport)
      setSaveError(error.message || 'Failed to save. Please try again.')
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
            userId={userId}
          />
        )

      case 'summary':
        return (
          <div className="summary-step">
            <div className="summary-header">
              <span className="success-icon">🎉</span>
              <h2>Epic!</h2>
              <p>Here's what we captured about your business</p>
            </div>

            <div className="summary-sections">
              {/* Skills summary */}
              <div className="summary-section">
                <h4>
                  <span className="section-icon">🛠️</span>
                  Your Skills ({capturedData.skills.length})
                  <span className="checkmark">✓</span>
                </h4>
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
                <h4>
                  <span className="section-icon">🎯</span>
                  Problems You Solve ({capturedData.problems.length})
                  <span className="checkmark">✓</span>
                </h4>
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
                <h4>
                  <span className="section-icon">👥</span>
                  Who You Help ({capturedData.personas.length})
                  <span className="checkmark">✓</span>
                </h4>
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
                <h4>
                  <span className="section-icon">📦</span>
                  Your Products ({capturedData.products.length})
                  <span className="checkmark">✓</span>
                </h4>
                <div className="products-summary">
                  {capturedData.products.map((product, idx) => (
                    <div key={idx} className="product-summary-card">
                      <span className="product-name">{product.name}</span>
                      <div className="product-tags">
                        {product.tier && <span className="product-tier">{product.tier}</span>}
                        {product.stage && <span className="product-stage">{getStageLabel(product.stage)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {saveError && (
              <div className="save-error">
                <p>{saveError}</p>
                {errorSupport && (
                  <button
                    className="help-btn"
                    onClick={errorSupport}
                    type="button"
                  >
                    Get Help via WhatsApp
                  </button>
                )}
              </div>
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
      <div className={`step-content ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
        {renderStep()}
      </div>
    </div>
  )
}

export default QuickCapture
