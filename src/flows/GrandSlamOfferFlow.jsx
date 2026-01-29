/**
 * GrandSlamOfferFlow.jsx - Grand Slam Offer Evaluation
 *
 * Stage 5 (Grand Slam) flow for evaluating product success potential
 * using Alex Hormozi's $100M Offers Value Equation.
 *
 * Value Equation: Dream Outcome × Perceived Likelihood / Time Delay × Effort & Sacrifice
 *
 * Question answered: "If I launched this product, how successful will I be?"
 *
 * Flow:
 * 1. Select product from Product Builder
 * 2. Proof Stack - Can I prove I can deliver? (Perceived Likelihood)
 * 3. Speed Advantage - How fast can they get results? (Time Delay)
 * 4. Ease Factor - How easy is it for them? (Effort & Sacrifice)
 * 5. Grand Slam Score - Success prediction output
 *
 * Created: January 2026
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import { ProgressDots } from '../components/MoneyModelShared'
import './GrandSlamOfferFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  PRODUCT_SELECT: 'product_select',
  PROOF_STACK: 'proof_stack',
  SPEED: 'speed',
  EASE: 'ease',
  SCORE: 'score',
  SUCCESS: 'success'
}

const STAGE_ORDER = [
  STAGES.WELCOME,
  STAGES.PRODUCT_SELECT,
  STAGES.PROOF_STACK,
  STAGES.SPEED,
  STAGES.EASE,
  STAGES.SCORE
]

// Proof types for credibility stack
const PROOF_TYPES = [
  {
    id: 'personal',
    label: "I've done this myself (personal transformation)",
    placeholder: "I went from X to Y in Z timeframe...",
    example: "I went from corporate burnout to location independence in 18 months"
  },
  {
    id: 'caseStudies',
    label: "I've helped others achieve this (case studies)",
    placeholder: "I've helped X people achieve Y...",
    example: "I've helped 47 non-technical founders deploy their products"
  },
  {
    id: 'credentials',
    label: "I have credentials or certifications",
    placeholder: "Certified X, Trained in Y...",
    example: "altMBA graduate, Certified NLP Practitioner"
  },
  {
    id: 'experience',
    label: "I have years of experience in this field",
    placeholder: "X years doing Y...",
    example: "15 years as a senior software engineer"
  },
  {
    id: 'methodology',
    label: "I have a proprietary methodology or framework",
    placeholder: "The XYZ Framework: how it works...",
    example: "The LEGO Castle Methodology: Breaking complex apps into simple building blocks"
  },
  {
    id: 'data',
    label: "I have data or research backing this approach",
    placeholder: "Studies show...",
    example: "MIT study showing AI-assisted development reduces time-to-launch by 87%"
  },
  {
    id: 'none',
    label: "None of the above",
    placeholder: null,
    example: null,
    isNone: true
  }
]

// Ease factor options
const EASE_OPTIONS = [
  { id: 'no_tech_skills', label: 'No technical skills required' },
  { id: 'no_expensive_tools', label: 'No expensive tools to buy' },
  { id: 'no_hire_employees', label: 'No need to hire employees' },
  { id: 'no_quit_job', label: "No need to quit their job first" },
  { id: 'no_large_investment', label: 'No large upfront investment' },
  { id: 'no_months_learning', label: 'No months/years of learning' },
  { id: 'no_complex_setup', label: 'No complex setup process' },
  { id: 'no_experience', label: 'No prior experience necessary' },
  { id: 'no_equipment', label: 'No special equipment needed' },
  { id: 'no_travel', label: 'No travel or relocation required' },
  { id: 'none', label: 'None of the above', isNone: true }
]

function GrandSlamOfferFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [existingOffer, setExistingOffer] = useState(null)
  const [productData, setProductData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Product selection
  const [availableProducts, setAvailableProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [evaluatedProducts, setEvaluatedProducts] = useState([]) // Track which products have been evaluated
  const [chosenMainProduct, setChosenMainProduct] = useState(null) // The product user chooses to proceed with

  // Evaluation data
  const [proofData, setProofData] = useState({})
  const [speedData, setSpeedData] = useState({ traditional: '', yours: '' })
  const [easeData, setEaseData] = useState([])
  const [customEase, setCustomEase] = useState([])
  const [grandSlamScore, setGrandSlamScore] = useState(null)

  // Auto-save
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('grand-slam-offer-v2', user?.id)

  // View results mode
  const [viewingResults, setViewingResults] = useState(false)

  // Load existing offer and product data
  useEffect(() => {
    if (user) {
      loadExistingData()
    }
  }, [user])

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        const { data: savedData, error } = await supabase
          .from('grand_slam_offers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error || !savedData) {
          console.log('No saved grand slam results found')
          return
        }

        // Restore the saved state
        if (savedData.proof_data) setProofData(savedData.proof_data)
        if (savedData.speed_data) setSpeedData(savedData.speed_data)
        if (savedData.ease_data) setEaseData(savedData.ease_data)
        if (savedData.custom_ease) setCustomEase(savedData.custom_ease)
        if (savedData.grand_slam_score) setGrandSlamScore(savedData.grand_slam_score)
        if (savedData.selected_product) setSelectedProduct(savedData.selected_product)

        setViewingResults(true)
        setStage(STAGES.SCORE)
      } catch (err) {
        console.error('Error loading saved results:', err)
      }
    }

    if (!isLoading) {
      loadSavedResults()
    }
  }, [searchParams, user, isLoading])

  // Check for saved progress
  useEffect(() => {
    if (user && !isLoading) {
      const saved = loadProgress()
      if (saved && saved.stage && saved.stage !== STAGES.LOADING && saved.stage !== STAGES.SUCCESS) {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, isLoading, loadProgress])

  // Auto-save on state changes
  useEffect(() => {
    if (!user || stage === STAGES.LOADING || stage === STAGES.SUCCESS) return
    const progressData = {
      stage,
      proofData,
      speedData,
      easeData,
      customEase
    }
    saveProgress(progressData)
  }, [stage, proofData, speedData, easeData, customEase, user, saveProgress])

  const loadExistingData = async () => {
    try {
      // Load most recent offer builder assessment
      const { data: offerData, error: offerError } = await supabase
        .from('offer_builder_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (offerError && offerError.code !== 'PGRST116') throw offerError

      // Load product selection data
      const { data: product, error: productError } = await supabase
        .from('product_selection_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (productError && productError.code !== 'PGRST116') {
        // Product selection is optional
        console.log('No product selection found')
      }

      // Load previously evaluated products and check for prior completion
      const { data: existingEvaluations } = await supabase
        .from('grand_slam_offers')
        .select('evaluated_product_ids, status, grand_slam_score')
        .eq('user_id', user.id)
        .single()

      if (existingEvaluations?.evaluated_product_ids) {
        setEvaluatedProducts(existingEvaluations.evaluated_product_ids)
      }

      // Note: Removed auto-register logic that was causing duplicate quest completions
      // Quest completion now only happens once when flow is completed

      if (offerData) {
        setExistingOffer(offerData)
        setProductData(product || null)

        // Extract products from offer builder responses
        const solutions = offerData.responses?.q8_solutions?.solutions || []
        const products = solutions.map((sol, index) => ({
          id: `solution_${index}`,
          name: sol.description?.substring(0, 50) || `Product ${index + 1}`,
          fullDescription: sol.description,
          problemText: sol.problemText,
          solutionType: sol.solutionType,
          solutionCategory: sol.solutionCategory
        }))
        setAvailableProducts(products)

        setStage(STAGES.WELCOME)
      } else {
        setError('Please complete Product Builder first')
        setStage(STAGES.WELCOME)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load your offer data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeProgress = useCallback(() => {
    if (savedProgressData) {
      setStage(savedProgressData.stage)
      if (savedProgressData.proofData) setProofData(savedProgressData.proofData)
      if (savedProgressData.speedData) setSpeedData(savedProgressData.speedData)
      if (savedProgressData.easeData) setEaseData(savedProgressData.easeData)
      if (savedProgressData.customEase) setCustomEase(savedProgressData.customEase)
    }
    setShowResumePrompt(false)
  }, [savedProgressData])

  const handleStartFresh = useCallback(() => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }, [clearProgress])

  // Navigation
  const goBack = () => {
    const currentIndex = STAGE_ORDER.indexOf(stage)
    if (currentIndex > 0) {
      setStage(STAGE_ORDER[currentIndex - 1])
    }
  }

  const goNext = () => {
    const currentIndex = STAGE_ORDER.indexOf(stage)
    if (currentIndex < STAGE_ORDER.length - 1) {
      setStage(STAGE_ORDER[currentIndex + 1])
    }
  }

  // Get current step number
  const getCurrentStep = () => {
    const index = STAGE_ORDER.indexOf(stage)
    return index >= 0 ? index : 0
  }

  // Proof Stack handlers
  const toggleProof = (id) => {
    setProofData(prev => {
      // If selecting "none", clear all other selections
      if (id === 'none') {
        if (prev.none !== undefined) {
          return {} // Deselect none
        }
        return { none: true } // Select only none
      }

      // If selecting something else and "none" was selected, remove "none"
      const { none: _, ...withoutNone } = prev

      if (prev[id] !== undefined) {
        const { [id]: removed, ...rest } = withoutNone
        return rest
      }
      return { ...withoutNone, [id]: '' }
    })
  }

  const updateProofDetail = (id, value) => {
    setProofData(prev => ({ ...prev, [id]: value }))
  }

  // Ease handlers
  const toggleEase = (id) => {
    setEaseData(prev => {
      // If selecting "none", clear all other selections
      if (id === 'none') {
        if (prev.includes('none')) {
          return [] // Deselect none
        }
        setCustomEase([]) // Clear custom ease too
        return ['none'] // Select only none
      }

      // If selecting something else and "none" was selected, remove "none"
      const withoutNone = prev.filter(x => x !== 'none')

      if (prev.includes(id)) {
        return withoutNone.filter(x => x !== id)
      }
      return [...withoutNone, id]
    })
  }

  const addCustomEase = (text) => {
    if (text.trim() && !customEase.includes(text.trim())) {
      setCustomEase(prev => [...prev, text.trim()])
    }
  }

  // Calculate Grand Slam Score
  const calculateScore = async () => {
    setIsLoading(true)
    try {
      // Calculate scores based on inputs (Value Equation: Dream Outcome × Perceived Likelihood / Time Delay × Effort)
      const proofCount = Object.keys(proofData).filter(k => proofData[k]?.length > 20).length
      const proofScore = Math.min(10, proofCount * 2) // 0-10 (Perceived Likelihood)

      // Speed score based on comparison (Time Delay - lower is better)
      let speedScore = 5 // Default
      if (speedData.traditional && speedData.yours) {
        // If they have both filled, give bonus for articulating the difference
        speedScore = 7
      }

      // Ease score based on selections (Effort & Sacrifice - lower is better)
      const totalEase = easeData.length + customEase.length
      const easeScore = Math.min(10, totalEase) // 0-10

      // Calculate total (out of 100) - 3 components, ~33 points each
      const total = Math.round(
        (proofScore * 3.33) + // ~33 points max (Perceived Likelihood)
        (speedScore * 3.33) + // ~33 points max (Time Delay)
        (easeScore * 3.33)    // ~33 points max (Effort & Sacrifice)
      )

      const grade = total >= 80 ? { letter: 'A', label: 'Grand Slam Ready', color: '#10B981' }
        : total >= 60 ? { letter: 'B', label: 'Strong Foundation', color: '#3B82F6' }
        : total >= 40 ? { letter: 'C', label: 'Needs Work', color: '#F59E0B' }
        : { letter: 'D', label: 'Early Stage', color: '#EF4444' }

      setGrandSlamScore({
        total,
        grade,
        proofScore,
        speedScore,
        easeScore
      })

      setStage(STAGES.SCORE)
    } catch (err) {
      console.error('Error calculating score:', err)
      setError('Failed to calculate score')
    } finally {
      setIsLoading(false)
    }
  }

  // Save and complete
  const handleComplete = async () => {
    setIsSaving(true)
    try {
      // Update evaluated products list
      const newEvaluatedProducts = [...evaluatedProducts]
      if (selectedProduct && !newEvaluatedProducts.includes(selectedProduct.id)) {
        newEvaluatedProducts.push(selectedProduct.id)
      }

      // Save to database
      const { error: saveError } = await supabase
        .from('grand_slam_offers')
        .upsert({
          user_id: user.id,
          offer_builder_id: existingOffer?.id,
          selected_product_id: selectedProduct?.id,
          selected_product_name: selectedProduct?.name,
          selected_product_data: selectedProduct,
          evaluated_product_ids: newEvaluatedProducts,
          proof_data: proofData,
          speed_data: speedData,
          ease_data: { selected: easeData, custom: customEase },
          grand_slam_score: grandSlamScore?.total,
          score_breakdown: grandSlamScore,
          status: 'completed',
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (saveError) throw saveError

      // Update local state
      setEvaluatedProducts(newEvaluatedProducts)

      // Auto-select as main product (user can change on SUCCESS screen)
      setChosenMainProduct(selectedProduct)

      // Complete quest
      const questResult = await completeFlowQuest({
        userId: user.id,
        flowId: 'grand_slam_offer',
        pointsEarned: 8
      })
      console.log('🎯 Grand Slam quest completion result:', questResult)

      clearProgress()
      setStage(STAGES.SUCCESS)
    } catch (err) {
      console.error('Error saving:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Start evaluation for another product
  const handleEvaluateAnother = () => {
    // Reset evaluation state but keep product list and evaluated products
    setSelectedProduct(null)
    setProofData({})
    setSpeedData({ traditional: '', yours: '' })
    setEaseData([])
    setCustomEase([])
    setGrandSlamScore(null)
    setShowResumePrompt(false) // Prevent resume prompt from showing
    setSavedProgressData(null)
    clearProgress()
    setStage(STAGES.PRODUCT_SELECT)
  }

  // Get unevaluated products
  const getUnevaluatedProducts = () => {
    return availableProducts.filter(p => !evaluatedProducts.includes(p.id))
  }

  // Get dream outcome from offer data
  const getDreamOutcome = () => {
    return existingOffer?.responses?.q1_dream_outcome ||
           existingOffer?.dream_outcome ||
           productData?.dream_outcome ||
           'their desired outcome'
  }

  // Loading state
  if (stage === STAGES.LOADING) {
    return (
      <div className="grand-slam-flow flow-base">
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  // Resume prompt
  if (showResumePrompt && savedProgressData) {
    return (
      <div className="grand-slam-flow flow-base">
        <div className="welcome-container">
          <div className="resume-prompt">
            <div className="time-icon">⏱️</div>
            <h2 className="resume-title">Welcome back!</h2>
            <p className="resume-info">You have progress saved from a previous session.</p>
            <div className="resume-actions">
              <button className="primary-button" onClick={handleResumeProgress}>
                Continue Where I Left Off
              </button>
              <button className="secondary-button" onClick={handleStartFresh}>
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grand-slam-flow flow-base">
      {/* Progress indicator */}
      {stage !== STAGES.WELCOME && stage !== STAGES.SUCCESS && stage !== STAGES.SCORE && (
        <div className="progress-container">
          <ProgressDots current={getCurrentStep()} total={STAGE_ORDER.length - 1} />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* WELCOME */}
      {stage === STAGES.WELCOME && (
        <div className="welcome-container">
          <div className="welcome-content">
            <div className="time-icon">🎯</div>
            <h1 className="welcome-greeting">Grand Slam Evaluation</h1>
            <div className="welcome-message">
              <p>
                Let's evaluate your offer using Alex Hormozi's
                <strong> Value Equation</strong> to predict success.
              </p>
              <p>
                We'll assess 3 key dimensions:
              </p>
              <div className="evaluation-preview">
                <div className="eval-item">✅ Proof Stack (Can you prove you deliver?)</div>
                <div className="eval-item">⚡ Speed Advantage (How fast do they get results?)</div>
                <div className="eval-item">🎯 Ease Factor (What do they NOT need to do?)</div>
              </div>
              <p className="time-estimate">⏱️ Takes about 10-15 minutes</p>
            </div>
          </div>
          {!existingOffer ? (
            <button className="primary-button" onClick={() => navigate('/offer-builder')}>
              Complete Product Builder First
            </button>
          ) : availableProducts.length === 0 ? (
            <button className="primary-button" onClick={() => navigate('/offer-builder')}>
              Add Products in Product Builder First
            </button>
          ) : (
            <button className="primary-button glow-button" onClick={() => setStage(STAGES.PRODUCT_SELECT)}>
              Start Evaluation →
            </button>
          )}
        </div>
      )}

      {/* PRODUCT SELECT */}
      {stage === STAGES.PRODUCT_SELECT && (
        <div className="question-container">
          <div className="question-header">
            <h2 className="question-text">Which product are you evaluating?</h2>
            <p className="question-subtext">
              Select the product from your Product Builder that you want to evaluate.
            </p>
          </div>

          <div className="product-options">
            {availableProducts.map((product) => {
              const isEvaluated = evaluatedProducts.includes(product.id)
              return (
                <button
                  key={product.id}
                  className={`product-option ${selectedProduct?.id === product.id ? 'selected' : ''} ${isEvaluated ? 'evaluated' : ''}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="product-option-content">
                    <span className="product-name">{product.name}</span>
                    {product.solutionType && (
                      <span className="product-type">
                        {product.solutionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    )}
                    {product.problemText && (
                      <span className="product-problem">Solves: {product.problemText.substring(0, 60)}...</span>
                    )}
                  </div>
                  {isEvaluated && (
                    <span className="evaluated-badge">✓ Evaluated</span>
                  )}
                </button>
              )
            })}
          </div>

          {evaluatedProducts.length > 0 && (
            <div className="evaluated-info">
              <span>✓ {evaluatedProducts.length} product{evaluatedProducts.length > 1 ? 's' : ''} already evaluated</span>
            </div>
          )}

          <button
            className="primary-button"
            onClick={goNext}
            disabled={!selectedProduct}
          >
            Evaluate This Product →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* PROOF STACK */}
      {stage === STAGES.PROOF_STACK && (
        <div className="question-container">
          <div className="question-header">
            <span className="question-number">Step 1 of 3</span>
            <h2 className="question-text">Why should they believe you can deliver?</h2>
            <p className="question-subtext">
              Build your credibility stack. Select all that apply and provide details.
            </p>
          </div>

          <div className="proof-options">
            {PROOF_TYPES.map(proof => (
              <div key={proof.id} className={`proof-option ${proofData[proof.id] !== undefined ? 'selected' : ''} ${proof.isNone ? 'none-option' : ''}`}>
                <button
                  type="button"
                  className="proof-toggle"
                  onClick={() => toggleProof(proof.id)}
                >
                  <span className={`proof-checkbox ${proofData[proof.id] !== undefined ? 'checked' : ''}`}>
                    {proofData[proof.id] !== undefined && <span className="checkmark">✓</span>}
                  </span>
                  <span className="proof-label">{proof.label}</span>
                </button>

                {proofData[proof.id] !== undefined && !proof.isNone && (
                  <div className="proof-detail">
                    <textarea
                      value={proofData[proof.id]}
                      onChange={(e) => updateProofDetail(proof.id, e.target.value)}
                      placeholder={proof.placeholder}
                      rows={3}
                    />
                    <p className="proof-example">
                      <em>Example:</em> "{proof.example}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="selection-status">
            {Object.keys(proofData).length} selected · Min 1 required
          </div>

          <button
            className="primary-button"
            onClick={goNext}
            disabled={Object.keys(proofData).length < 1}
          >
            Continue →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* SPEED ADVANTAGE */}
      {stage === STAGES.SPEED && (
        <div className="question-container">
          <div className="question-header">
            <span className="question-number">Step 2 of 3</span>
            <h2 className="question-text">How fast can they see results?</h2>
            <p className="question-subtext">
              Speed is a massive differentiator. Compare traditional vs your approach.
            </p>
          </div>

          <div className="speed-inputs">
            <div className="input-group">
              <label>Traditional approach takes:</label>
              <input
                type="text"
                value={speedData.traditional}
                onChange={(e) => setSpeedData(prev => ({ ...prev, traditional: e.target.value }))}
                placeholder="e.g., 6 months to learn coding"
              />
            </div>

            <div className="vs-divider">VS</div>

            <div className="input-group">
              <label>Your approach takes:</label>
              <input
                type="text"
                value={speedData.yours}
                onChange={(e) => setSpeedData(prev => ({ ...prev, yours: e.target.value }))}
                placeholder="e.g., 3 hours to deploy"
              />
            </div>
          </div>

          <div className="speed-examples">
            <p className="example-header">💡 Examples:</p>
            <div className="example-item">"12 months to transform body" → "90 days visible change"</div>
            <div className="example-item">"2 years to save $10K" → "30 days to first $1K"</div>
          </div>

          <button
            className="primary-button"
            onClick={goNext}
            disabled={!speedData.traditional || !speedData.yours}
          >
            Continue →
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* EASE FACTOR */}
      {stage === STAGES.EASE && (
        <div className="question-container">
          <div className="question-header">
            <span className="question-number">Step 3 of 3</span>
            <h2 className="question-text">What do they NOT have to do?</h2>
            <p className="question-subtext">
              Tell people what they don't need. Select all that apply.
            </p>
          </div>

          <div className="ease-options">
            {EASE_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                className={`ease-option ${easeData.includes(option.id) ? 'selected' : ''} ${option.isNone ? 'none-option' : ''}`}
                onClick={() => toggleEase(option.id)}
              >
                <span className={`ease-checkbox ${easeData.includes(option.id) ? 'checked' : ''}`}>
                  {easeData.includes(option.id) && <span className="checkmark">✓</span>}
                </span>
                <span>{option.label}</span>
              </button>
            ))}

            {customEase.map((custom, i) => (
              <div key={`custom-${i}`} className="ease-option selected custom">
                <span className="ease-checkbox checked">
                  <span className="checkmark">✓</span>
                </span>
                <span>{custom}</span>
              </div>
            ))}
          </div>

          <div className="add-custom-ease">
            <input
              type="text"
              placeholder="Add custom: They don't need to..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  addCustomEase(e.target.value)
                  e.target.value = ''
                }
              }}
            />
          </div>

          <div className="selection-status">
            {easeData.length + customEase.length} selected · Min 1 required
          </div>

          <button
            className="primary-button"
            onClick={calculateScore}
            disabled={easeData.length + customEase.length < 1 || isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Grand Slam Score →'}
          </button>
          <button className="go-back-link" onClick={goBack}>
            ← Go Back
          </button>
        </div>
      )}

      {/* SCORE */}
      {stage === STAGES.SCORE && grandSlamScore && (
        <div className="score-container">
          <div className="score-header">
            <h2>Your Grand Slam Score</h2>
          </div>

          <div className="score-display" style={{ borderColor: grandSlamScore.grade.color }}>
            <div className="score-circle" style={{ background: `${grandSlamScore.grade.color}22` }}>
              <span className="score-number" style={{ color: grandSlamScore.grade.color }}>
                {grandSlamScore.total}
              </span>
              <span className="score-max">/100</span>
            </div>
            <div className="grade-badge" style={{ background: grandSlamScore.grade.color }}>
              {grandSlamScore.grade.letter}
            </div>
            <div className="grade-label">{grandSlamScore.grade.label}</div>
          </div>

          <div className="score-breakdown">
            <h3>Value Equation Breakdown</h3>
            <div className="breakdown-item">
              <span className="breakdown-label">Proof Stack (Perceived Likelihood)</span>
              <span className="breakdown-value">{grandSlamScore.proofScore}/10</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Speed Advantage (Time Delay)</span>
              <span className="breakdown-value">{grandSlamScore.speedScore}/10</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Ease Factor (Effort & Sacrifice)</span>
              <span className="breakdown-value">{grandSlamScore.easeScore}/10</span>
            </div>
          </div>

          <div className="value-equation">
            <div className="equation-visual">
              <div className="equation-numerator">
                <span>Dream Outcome × Perceived Likelihood</span>
              </div>
              <div className="equation-divider">―――――――――――――――――――</div>
              <div className="equation-denominator">
                <span>Time Delay × Effort & Sacrifice</span>
              </div>
            </div>
          </div>

          {availableProducts.length > 1 && (
            <div className="evaluate-another-section">
              <label className="evaluate-another-label">Evaluate another product:</label>
              <select
                className="product-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const product = availableProducts.find(p => p.id === e.target.value)
                    if (product) {
                      setSelectedProduct(product)
                      setProofData({})
                      setSpeedData({ traditional: '', yours: '' })
                      setEaseData([])
                      setCustomEase([])
                      setGrandSlamScore(null)
                      setShowResumePrompt(false)
                      setSavedProgressData(null)
                      clearProgress()
                      setStage(STAGES.PROOF_STACK)
                    }
                  }
                }}
              >
                <option value="">Select a product...</option>
                {availableProducts
                  .filter(p => p.id !== selectedProduct?.id)
                  .map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {viewingResults ? (
            <button
              className="primary-button"
              onClick={() => navigate('/7-day-challenge')}
              style={{ marginTop: '1rem' }}
            >
              Return to Challenge
            </button>
          ) : (
            <>
              <button
                className="primary-button"
                onClick={handleComplete}
                disabled={isSaving}
                style={{ marginTop: '1rem' }}
              >
                {isSaving ? 'Saving...' : 'Complete & Continue →'}
              </button>

              <button className="go-back-link" onClick={goBack}>
                ← Go Back
              </button>
            </>
          )}
        </div>
      )}

      {/* SUCCESS */}
      {stage === STAGES.SUCCESS && (
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Evaluation Complete!</h2>
          {selectedProduct && (
            <p className="success-product-name">"{selectedProduct.name}"</p>
          )}
          <p>Your Grand Slam Score: {grandSlamScore?.total}/100</p>

          {/* Choose Main Product Section */}
          <div className="choose-main-product">
            <h3>Which product will you build your offer around?</h3>
            <p className="choose-subtext">This will be your core offer for the Offer Stack Builder.</p>

            <div className="main-product-options">
              {availableProducts.map((product) => {
                const isEvaluated = evaluatedProducts.includes(product.id)
                const isChosen = chosenMainProduct?.id === product.id
                return (
                  <button
                    key={product.id}
                    className={`main-product-option ${isChosen ? 'chosen' : ''} ${!isEvaluated ? 'not-evaluated' : ''}`}
                    onClick={() => setChosenMainProduct(product)}
                    disabled={!isEvaluated}
                  >
                    <span className="product-name">{product.name}</span>
                    {isEvaluated ? (
                      <span className="evaluated-status">✓ Evaluated</span>
                    ) : (
                      <span className="not-evaluated-status">Not evaluated</span>
                    )}
                    {isChosen && <span className="chosen-badge">★ Main Product</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            className="primary-button"
            onClick={async () => {
              // Save the chosen main product to Supabase
              if (chosenMainProduct) {
                await supabase
                  .from('grand_slam_offers')
                  .update({
                    chosen_product_id: chosenMainProduct.id,
                    chosen_product_name: chosenMainProduct.name,
                    chosen_product_data: chosenMainProduct
                  })
                  .eq('user_id', user.id)
              }
              navigate('/offer-stack-builder')
            }}
            disabled={!chosenMainProduct}
          >
            Build Offer Stack →
          </button>

          <button
            className="go-back-link"
            onClick={() => navigate('/7-day-challenge')}
          >
            Return to Challenge
          </button>
        </div>
      )}
    </div>
  )
}

export default GrandSlamOfferFlow
