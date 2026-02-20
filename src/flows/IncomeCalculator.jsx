/**
 * IncomeCalculator.jsx
 *
 * Income Calculator Flow
 * - Public users: Full 8-step flow with email gate
 * - Logged-in users: Pre-filled data, skip email gate, personalized results
 *
 * Steps:
 * 1. Wealth Ladder selection
 * 2. Product Type selection
 * 3. Income Goal
 * 4. Model-specific inputs
 * 5. Visibility Assessment
 * 6. Safety Contracts
 * 7. Email Gate (public only)
 * 8. Results
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import {
  WEALTH_LADDER,
  PRODUCT_TYPES,
  VISIBILITY_LAYERS,
  SAFETY_CONTRACTS,
  INCOME_GOALS,
  getProductTypesForLadder,
  getRequiredVisibility,
  calculateVisibilityGap,
  getRecommendedStart
} from '../lib/incomeCalculatorData'
import {
  calculateForProductType,
  generatePaths,
  formatCurrency,
  formatNumber
} from '../lib/incomeCalculatorLogic'
import { createProductFromFlow, getUserProducts } from '../lib/productsService'
import { completeFlowQuest } from '../lib/questCompletion'
import { useProjectId } from '../hooks/useProjectId'
import './IncomeCalculator.css'

const TOTAL_STEPS = 8

export default function IncomeCalculator() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { projectId } = useProjectId()

  // Current step (1-8)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)

  // User data (for logged-in users)
  const [existingProducts, setExistingProducts] = useState([])
  const [nsData, setNsData] = useState(null)

  // Form state
  const [selectedProduct, setSelectedProduct] = useState(null) // existing product or 'new'
  const [wealthLadder, setWealthLadder] = useState(null)
  const [productType, setProductType] = useState(null)
  const [incomeGoal, setIncomeGoal] = useState(null)
  const [customGoal, setCustomGoal] = useState('')
  const [modelInputs, setModelInputs] = useState({})
  const [visibilityRatings, setVisibilityRatings] = useState({
    screen: 5,
    live: 5,
    money: 5,
    vulnerable: 5,
    authority: 5
  })
  const [selectedContracts, setSelectedContracts] = useState([])

  // Email gate (public users)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Results
  const [calculation, setCalculation] = useState(null)
  const [paths, setPaths] = useState([])
  const [visibilityGap, setVisibilityGap] = useState(0)

  // Load user data on mount
  useEffect(() => {
    loadUserData()
  }, [user])

  async function loadUserData() {
    setLoading(true)
    try {
      if (user) {
        // Fetch existing products
        const { products } = await getUserProducts(user.id, { status: 'active' })
        setExistingProducts(products || [])

        // Fetch nervous system data
        const { data: nsResponse } = await supabase
          .from('nervous_system_responses')
          .select('being_seen_edge, earning_edge, safety_contracts, belief_test_results')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (nsResponse) {
          setNsData(nsResponse)
          // Pre-fill safety contracts if available
          if (nsResponse.safety_contracts && nsResponse.safety_contracts.length > 0) {
            // Match text to our contract IDs
            const matchedContracts = SAFETY_CONTRACTS
              .filter(c => nsResponse.safety_contracts.some(sc =>
                sc.toLowerCase().includes(c.text.toLowerCase().slice(0, 30))
              ))
              .map(c => c.id)
            setSelectedContracts(matchedContracts)
          }
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get current income goal value
  const getIncomeGoalValue = () => {
    if (incomeGoal) return incomeGoal
    if (customGoal) return parseInt(customGoal) || 0
    return 0
  }

  // Handle step navigation
  const nextStep = () => {
    if (step < TOTAL_STEPS) {
      // Skip email gate for logged-in users
      if (step === 6 && user) {
        calculateResults()
        setStep(8)
      } else if (step === 7) {
        calculateResults()
        setStep(8)
      } else {
        setStep(step + 1)
      }
    }
  }

  const prevStep = () => {
    if (step > 1) {
      // Handle skipping email gate when going back
      if (step === 8 && user) {
        setStep(6)
      } else {
        setStep(step - 1)
      }
    }
  }

  // Calculate results
  function calculateResults() {
    const goal = getIncomeGoalValue()
    const inputs = { incomeGoal: goal, ...modelInputs }

    // Run calculation
    const result = calculateForProductType(productType, inputs)
    setCalculation(result)

    // Calculate visibility gap
    const requiredLayers = PRODUCT_TYPES[productType]?.visibilityRequired || []
    const gap = calculateVisibilityGap(visibilityRatings, requiredLayers)
    setVisibilityGap(gap)

    // Generate recommended paths
    const recommendedPaths = generatePaths(visibilityRatings, productType)
    setPaths(recommendedPaths)
  }

  // Save results to database
  async function saveResults() {
    try {
      const goal = getIncomeGoalValue()

      // If logged-in and creating new product, save it
      if (user && selectedProduct === 'new' && productType) {
        const productName = PRODUCT_TYPES[productType]?.label || 'My Product'
        await createProductFromFlow({
          userId: user.id,
          flowType: 'income_calculator',
          name: productName,
          description: `Created from Income Calculator - ${WEALTH_LADDER[wealthLadder]?.label}`,
          price: modelInputs.sessionPrice || modelInputs.packagePrice || modelInputs.ticketPrice || 0,
          priceType: productType === 'membership' ? 'subscription' : 'one_time',
          metadata: {
            wealthLadder,
            productType,
            incomeGoal: goal,
            modelInputs,
            visibilityRatings,
            visibilityGap
          }
        })
      }

      // Save calculation record
      const { error } = await supabase
        .from('public_income_calculations')
        .insert({
          session_token: crypto.randomUUID(),
          user_id: user?.id || null,
          respondent_name: user ? (user.user_metadata?.name || user.email) : name,
          respondent_email: user?.email || email,
          business_type: wealthLadder,
          monetization_model: productType,
          wealth_ladder_level: wealthLadder,
          product_type: productType,
          income_goal: goal,
          model_inputs: modelInputs,
          visibility_ratings: visibilityRatings,
          identified_contracts: selectedContracts,
          calculated_results: calculation,
          visibility_gap_score: visibilityGap,
          recommended_start_model: getRecommendedStart(visibilityRatings),
          ecosystem_phase: wealthLadder
        })

      if (error) {
        console.error('Error saving calculation:', error)
      }

      // Complete quest for logged-in users
      if (user) {
        try {
          await completeFlowQuest({
            userId: user.id,
            flowId: 'income_calculator',
            pointsEarned: 4,
            projectId: projectId || null
          })
        } catch (questError) {
          console.error('Error completing quest:', questError)
        }
      }

      // For public users, also save as lead
      if (!user && email) {
        await supabase
          .from('public_leads')
          .insert({
            name,
            email,
            source_flow: 'income_calculator',
            personalization_tokens: {
              name,
              business_type: wealthLadder,
              income_goal: goal,
              visibility_gap_score: visibilityGap,
              blocking_layers: Object.entries(visibilityRatings)
                .filter(([_, v]) => v >= 7)
                .map(([k]) => k),
              identified_contracts: selectedContracts,
              recommended_model: getRecommendedStart(visibilityRatings),
              ecosystem_phase: wealthLadder
            }
          })
      }
    } catch (err) {
      console.error('Error saving results:', err)
    }
  }

  // Update model input
  const updateModelInput = (key, value) => {
    setModelInputs(prev => ({ ...prev, [key]: value }))
  }

  // Toggle contract selection
  const toggleContract = (contractId) => {
    setSelectedContracts(prev =>
      prev.includes(contractId)
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    )
  }

  // Check if can proceed to next step
  const canProceed = () => {
    switch (step) {
      case 1: return wealthLadder !== null
      case 2: return productType !== null
      case 3: return getIncomeGoalValue() > 0
      case 4: return true // Inputs have defaults
      case 5: return true // Ratings have defaults
      case 6: return true // Contracts are optional
      case 7: return name.trim() && email.trim() && email.includes('@')
      default: return true
    }
  }

  // Get color for visibility rating
  const getRatingColor = (rating) => {
    if (rating <= 3) return '#22c55e'
    if (rating <= 6) return '#eab308'
    return '#ef4444'
  }

  // Render loading state
  if (loading) {
    return (
      <div className="income-calculator">
        <div className="ic-container">
          <div className="ic-loading">
            <div className="ic-spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 1:
        return renderWealthLadderStep()
      case 2:
        return renderProductTypeStep()
      case 3:
        return renderIncomeGoalStep()
      case 4:
        return renderModelInputsStep()
      case 5:
        return renderVisibilityStep()
      case 6:
        return renderContractsStep()
      case 7:
        return renderEmailGateStep()
      case 8:
        return renderResultsStep()
      default:
        return null
    }
  }

  // Step 1: Wealth Ladder
  const renderWealthLadderStep = () => (
    <>
      <div className="ic-step-header">
        <div className="ic-step-number">Step 1 of {user ? 6 : 8}</div>
        <h1 className="ic-step-title">Where are you on your journey?</h1>
        <p className="ic-step-subtitle">Select the stage that best describes your current business</p>
      </div>

      {/* Show existing products for logged-in users */}
      {user && existingProducts.length > 0 && (
        <div className="ic-options" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: '#495057', marginBottom: 8 }}>Your existing products:</p>
          {existingProducts.map(product => (
            <div
              key={product.id}
              className={`ic-option ${selectedProduct === product.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedProduct(product.id)
                // Auto-fill from product data
                const pt = product.product_type
                const wl = PRODUCT_TYPES[pt]?.wealthLadder || 'service'
                setWealthLadder(wl)
                setProductType(pt)
                if (product.price_amount) {
                  updateModelInput('sessionPrice', product.price_amount)
                  updateModelInput('packagePrice', product.price_amount)
                }
              }}
            >
              <span className="ic-option-icon">{PRODUCT_TYPES[product.product_type]?.icon || '📦'}</span>
              <div className="ic-option-content">
                <p className="ic-option-label">{product.name}</p>
                <p className="ic-option-description">{PRODUCT_TYPES[product.product_type]?.label}</p>
              </div>
              <div className="ic-option-check">
                {selectedProduct === product.id && '✓'}
              </div>
            </div>
          ))}
          <div
            className={`ic-option ${selectedProduct === 'new' ? 'selected' : ''}`}
            onClick={() => {
              setSelectedProduct('new')
              setWealthLadder(null)
              setProductType(null)
            }}
          >
            <span className="ic-option-icon">➕</span>
            <div className="ic-option-content">
              <p className="ic-option-label">Plan a new offering</p>
              <p className="ic-option-description">Calculate for something you haven't built yet</p>
            </div>
            <div className="ic-option-check">
              {selectedProduct === 'new' && '✓'}
            </div>
          </div>
        </div>
      )}

      {/* Wealth ladder options (show if no product selected or new) */}
      {(!user || selectedProduct === 'new' || !selectedProduct) && (
        <div className="ic-options">
          {Object.values(WEALTH_LADDER).map(ladder => (
            <div
              key={ladder.id}
              className={`ic-option ${wealthLadder === ladder.id ? 'selected' : ''}`}
              onClick={() => {
                setWealthLadder(ladder.id)
                setProductType(null) // Reset product type when ladder changes
                if (!user || selectedProduct === 'new') {
                  setSelectedProduct('new')
                }
              }}
            >
              <span className="ic-option-icon">{ladder.icon}</span>
              <div className="ic-option-content">
                <p className="ic-option-label">{ladder.label}</p>
                <p className="ic-option-description">{ladder.description}</p>
                <p className="ic-option-examples">{ladder.examples.join(' • ')}</p>
              </div>
              <div className="ic-option-check">
                {wealthLadder === ladder.id && '✓'}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )

  // Step 2: Product Type
  const renderProductTypeStep = () => {
    const availableTypes = getProductTypesForLadder(wealthLadder)

    return (
      <>
        <div className="ic-step-header">
          <div className="ic-step-number">Step 2 of {user ? 6 : 8}</div>
          <h1 className="ic-step-title">What are you offering?</h1>
          <p className="ic-step-subtitle">Select the product type that matches your offering</p>
        </div>

        <div className="ic-options">
          {availableTypes.map(pt => (
            <div
              key={pt.id}
              className={`ic-option ${productType === pt.id ? 'selected' : ''}`}
              onClick={() => setProductType(pt.id)}
            >
              <span className="ic-option-icon">{pt.icon}</span>
              <div className="ic-option-content">
                <p className="ic-option-label">{pt.label}</p>
                <p className="ic-option-description">{pt.description}</p>
              </div>
              <div className="ic-option-check">
                {productType === pt.id && '✓'}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // Step 3: Income Goal
  const renderIncomeGoalStep = () => (
    <>
      <div className="ic-step-header">
        <div className="ic-step-number">Step 3 of {user ? 6 : 8}</div>
        <h1 className="ic-step-title">What's your income goal?</h1>
        <p className="ic-step-subtitle">How much do you want to earn per month?</p>
      </div>

      <div className="ic-goal-presets">
        {INCOME_GOALS.map(goal => (
          <button
            key={goal.value}
            className={`ic-goal-preset ${incomeGoal === goal.value ? 'selected' : ''}`}
            onClick={() => {
              setIncomeGoal(goal.value)
              setCustomGoal('')
            }}
          >
            {goal.label}
          </button>
        ))}
      </div>

      <div className="ic-custom-goal">
        <span className="ic-currency">$</span>
        <input
          type="number"
          placeholder="Custom amount"
          value={customGoal}
          onChange={(e) => {
            setCustomGoal(e.target.value)
            setIncomeGoal(null)
          }}
        />
        <span className="ic-period">/month</span>
      </div>
    </>
  )

  // Step 4: Model Inputs
  const renderModelInputsStep = () => {
    const pt = PRODUCT_TYPES[productType]
    if (!pt) return null

    const inputConfigs = {
      // Service
      sessionPrice: { label: 'Price per session', prefix: '$', default: 150 },
      sessionsPerWeek: { label: 'Max sessions per week', suffix: 'sessions', default: 10 },
      packagePrice: { label: 'Package price', prefix: '$', default: 1500 },
      packagesPerMonth: { label: 'Max packages per month', suffix: 'packages', default: 4 },

      // Productized
      ticketPrice: { label: 'Ticket price', prefix: '$', default: 75 },
      eventsPerMonth: { label: 'Events per month', suffix: 'events', default: 4 },
      capacityPerEvent: { label: 'Capacity per event', suffix: 'seats', default: 20 },
      programPrice: { label: 'Program price', prefix: '$', default: 2000 },
      launchesPerYear: { label: 'Launches per year', suffix: 'launches', default: 2 },
      retainerPrice: { label: 'Retainer price', prefix: '$', default: 2000 },
      maxClients: { label: 'Max clients', suffix: 'clients', default: 5 },
      monthlyPrice: { label: 'Monthly price', prefix: '$', default: 49 },
      targetMembers: { label: 'Target members', suffix: 'members', default: 100 },

      // Digital Products
      productPrice: { label: 'Product price', prefix: '$', default: 47 },
      salesPerMonth: { label: 'Expected sales per month', suffix: 'sales', default: 50 },
      targetUsers: { label: 'Target users', suffix: 'users', default: 100 },
      coursePrice: { label: 'Course price', prefix: '$', default: 297 },

      // Physical Products
      profitMargin: { label: 'Profit margin', suffix: '%', default: 40 },
      bookPrice: { label: 'Book price', prefix: '$', default: 20 },
      royaltyPercent: { label: 'Royalty percentage', suffix: '%', default: 10 },

      // Content
      episodesPerMonth: { label: 'Episodes per month', suffix: 'episodes', default: 4 },
      downloadsPerEpisode: { label: 'Downloads per episode', suffix: 'downloads', default: 1000 },
      videosPerMonth: { label: 'Videos per month', suffix: 'videos', default: 4 },
      viewsPerVideo: { label: 'Views per video', suffix: 'views', default: 10000 },
      subscriberCount: { label: 'Subscriber count', suffix: 'subscribers', default: 5000 },
      revenueModel: { label: 'Revenue model', type: 'select', options: ['sponsored', 'paid'], default: 'sponsored' },
      audienceSize: { label: 'Audience size', suffix: 'followers', default: 10000 },
      dealsPerMonth: { label: 'Deals per month', suffix: 'deals', default: 2 }
    }

    return (
      <>
        <div className="ic-step-header">
          <div className="ic-step-number">Step 4 of {user ? 6 : 8}</div>
          <h1 className="ic-step-title">Your pricing & capacity</h1>
          <p className="ic-step-subtitle">Enter your numbers (or use the defaults)</p>
        </div>

        <div className="ic-inputs">
          {pt.inputs.map(inputKey => {
            const config = inputConfigs[inputKey]
            if (!config) return null

            // Handle select type (e.g., revenueModel)
            if (config.type === 'select') {
              return (
                <div key={inputKey} className="ic-input-group">
                  <label className="ic-input-label">{config.label}</label>
                  <div className="ic-input-field">
                    <select
                      value={modelInputs[inputKey] || config.default}
                      onChange={(e) => updateModelInput(inputKey, e.target.value)}
                      className="ic-select"
                    >
                      {config.options.map(opt => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            }

            return (
              <div key={inputKey} className="ic-input-group">
                <label className="ic-input-label">{config.label}</label>
                <div className="ic-input-field">
                  {config.prefix && <span className="ic-input-prefix">{config.prefix}</span>}
                  <input
                    type="number"
                    value={modelInputs[inputKey] || ''}
                    placeholder={config.default.toString()}
                    onChange={(e) => updateModelInput(inputKey, e.target.value)}
                  />
                  {config.suffix && <span className="ic-input-suffix">{config.suffix}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  // Step 5: Visibility Assessment
  const renderVisibilityStep = () => {
    const requiredLayers = PRODUCT_TYPES[productType]?.visibilityRequired || []

    return (
      <>
        <div className="ic-step-header">
          <div className="ic-step-number">Step 5 of {user ? 6 : 8}</div>
          <h1 className="ic-step-title">Visibility check</h1>
          <p className="ic-step-subtitle">Rate how scary each type of visibility feels (1-10)</p>
        </div>

        <div className="ic-visibility-intro">
          <p>Your {PRODUCT_TYPES[productType]?.label} requires these visibility layers. Rate each one honestly — this helps identify what might hold you back.</p>
        </div>

        <div className="ic-visibility-layers">
          {Object.values(VISIBILITY_LAYERS).map(layer => {
            const isRequired = requiredLayers.includes(layer.id)
            const rating = visibilityRatings[layer.id]

            return (
              <div key={layer.id} className="ic-visibility-layer">
                <div className="ic-layer-header">
                  <span className="ic-layer-icon">{layer.icon}</span>
                  <div className="ic-layer-info">
                    <p className="ic-layer-name">{layer.label}</p>
                    <p className="ic-layer-desc">{layer.description}</p>
                  </div>
                  {isRequired && <span className="ic-layer-required">Required</span>}
                </div>

                <div className="ic-slider-container">
                  <span className="ic-slider-label">Easy</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rating}
                    className="ic-slider"
                    onChange={(e) => setVisibilityRatings(prev => ({
                      ...prev,
                      [layer.id]: parseInt(e.target.value)
                    }))}
                  />
                  <span className="ic-slider-label scary">Scary</span>
                  <span
                    className="ic-slider-value"
                    style={{ color: getRatingColor(rating) }}
                  >
                    {rating}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  // Step 6: Safety Contracts
  const renderContractsStep = () => (
    <>
      <div className="ic-step-header">
        <div className="ic-step-number">Step 6 of {user ? 6 : 8}</div>
        <h1 className="ic-step-title">Do any of these feel true?</h1>
        <p className="ic-step-subtitle">Select any beliefs that resonate with you (optional)</p>
      </div>

      {nsData?.safety_contracts?.length > 0 && (
        <div className="ic-visibility-intro" style={{ marginBottom: 16 }}>
          <p>Based on your Nervous System Flow, we've pre-selected beliefs that may be active for you.</p>
        </div>
      )}

      <div className="ic-contracts">
        {SAFETY_CONTRACTS.map(contract => (
          <div
            key={contract.id}
            className={`ic-contract ${selectedContracts.includes(contract.id) ? 'selected' : ''}`}
            onClick={() => toggleContract(contract.id)}
          >
            <div className="ic-contract-checkbox">
              {selectedContracts.includes(contract.id) && '✓'}
            </div>
            <span className="ic-contract-text">"{contract.text}"</span>
          </div>
        ))}
      </div>
    </>
  )

  // Step 7: Email Gate (public only)
  const renderEmailGateStep = () => (
    <>
      <div className="ic-step-header">
        <div className="ic-step-number">Step 7 of 8</div>
        <h1 className="ic-step-title">Almost there!</h1>
        <p className="ic-step-subtitle">Enter your details to see your personalized results</p>
      </div>

      <div className="ic-email-gate">
        <h3>See Your Income Blueprint</h3>
        <p>We'll show you exactly what it takes to hit your goal</p>

        <div className="ic-email-inputs">
          <input
            type="text"
            className="ic-email-input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            className="ic-email-input"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          className="ic-primary-btn"
          disabled={!canProceed()}
          onClick={() => {
            saveResults()
            nextStep()
          }}
        >
          Show My Results
        </button>
      </div>
    </>
  )

  // Step 8: Results
  const renderResultsStep = () => {
    const requiredLayers = PRODUCT_TYPES[productType]?.visibilityRequired || []

    return (
      <>
        <div className="ic-step-header">
          <h1 className="ic-step-title">Your Income Blueprint</h1>
          <p className="ic-step-subtitle">
            {formatCurrency(getIncomeGoalValue())}/month from {PRODUCT_TYPES[productType]?.label}
          </p>
        </div>

        <div className="ic-results">
          {/* The Math */}
          {calculation && (
            <div className="ic-result-card">
              <h3>📊 The Math</h3>
              <div className="ic-math-grid">
                <span className="ic-math-label">Monthly Goal</span>
                <span className="ic-math-value">{formatCurrency(getIncomeGoalValue())}</span>

                {calculation.requirements && Object.entries(calculation.requirements)
                  .filter(([key]) => !['capacityOk', 'maxCapacity', 'targetCapacity'].includes(key))
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <React.Fragment key={key}>
                      <span className="ic-math-label">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span className="ic-math-value">
                        {typeof value === 'number' ? formatNumber(Math.round(value)) : value}
                      </span>
                    </React.Fragment>
                  ))}

                <div className="ic-math-divider" />

                {calculation.content && (
                  <>
                    <span className="ic-math-label">Posts per week</span>
                    <span className="ic-math-value">{calculation.content.postsPerWeek}</span>
                  </>
                )}

                {calculation.funnel && (
                  <>
                    <span className="ic-math-label">Leads needed/month</span>
                    <span className="ic-math-value">{formatNumber(calculation.funnel.leadsNeeded)}</span>
                  </>
                )}
              </div>

              {calculation.warnings?.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
                  {calculation.warnings.map((warning, i) => (
                    <p key={i} style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>⚠️ {warning}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Visibility Gap */}
          <div className="ic-result-card">
            <h3>🎯 Your Visibility Gap</h3>

            <div className="ic-gap-score">
              <div className="ic-gap-number">{visibilityGap}</div>
              <div className="ic-gap-label">out of 10 (lower is better)</div>
            </div>

            <div className="ic-gap-layers">
              {requiredLayers.map(layerId => {
                const layer = VISIBILITY_LAYERS[layerId]
                const rating = visibilityRatings[layerId]
                return (
                  <div key={layerId} className="ic-gap-layer">
                    <span className="ic-gap-layer-icon">{layer.icon}</span>
                    <span className="ic-gap-layer-name">{layer.label}</span>
                    <div className="ic-gap-layer-bar">
                      <div
                        className="ic-gap-layer-fill"
                        style={{
                          width: `${rating * 10}%`,
                          background: getRatingColor(rating)
                        }}
                      />
                    </div>
                    <span className="ic-gap-layer-value" style={{ color: getRatingColor(rating) }}>
                      {rating}/10
                    </span>
                  </div>
                )
              })}
            </div>

            {visibilityGap >= 6 && (
              <p style={{ marginTop: 16, fontSize: 14, color: '#ef4444', fontStyle: 'italic' }}>
                This isn't a strategy problem. It's a nervous system safety problem.
              </p>
            )}
          </div>

          {/* Blocking Beliefs */}
          {selectedContracts.length > 0 && (
            <div className="ic-result-card">
              <h3>🔒 Beliefs That May Be Blocking You</h3>
              {selectedContracts.map(contractId => {
                const contract = SAFETY_CONTRACTS.find(c => c.id === contractId)
                return contract ? (
                  <div key={contractId} style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0, fontStyle: 'italic', color: '#495057' }}>"{contract.text}"</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6c757d' }}>
                      → Blocks your {contract.layers.map(l => VISIBILITY_LAYERS[l]?.label).join(' & ')} visibility
                    </p>
                  </div>
                ) : null
              })}
            </div>
          )}

          {/* Recommended Paths */}
          {paths.length > 0 && (
            <div className="ic-result-card">
              <h3>🛤️ Recommended Paths</h3>
              <div className="ic-paths">
                {paths.slice(0, 3).map(path => (
                  <div key={path.id} className="ic-path">
                    <p className="ic-path-title">{path.title}</p>
                    <p className="ic-path-description">{path.description}</p>
                    {path.activities && (
                      <div className="ic-path-activities">
                        {path.activities.map((activity, i) => (
                          <span key={i} className="ic-path-activity">{activity}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {!user && (
            <div className="ic-cta-section">
              <h3>Ready to Close the Gap?</h3>
              <p>FindMyFlow helps you build the visibility courage you need to hit your income goals.</p>

              <div className="ic-cta-features">
                <div className="ic-cta-feature">✓ Identify exact beliefs blocking your income</div>
                <div className="ic-cta-feature">✓ Heal them through guided nervous system work</div>
                <div className="ic-cta-feature">✓ Build visibility courage with daily challenges</div>
                <div className="ic-cta-feature">✓ Track progress as your comfort zone expands</div>
              </div>

              <button className="ic-gold-btn" onClick={() => navigate('/')}>
                Start Your Free Journey
              </button>
            </div>
          )}

          {user && (
            <div className="ic-cta-section">
              <h3>Next Steps</h3>
              <p>Based on your results, here's what we recommend:</p>

              <div className="ic-cta-features">
                {visibilityGap >= 5 && (
                  <div className="ic-cta-feature">→ Complete the Nervous System Flow to understand your blocks</div>
                )}
                <div className="ic-cta-feature">→ Generate Groan Challenges for your blocking layers</div>
                <div className="ic-cta-feature">→ Track your visibility progress over time</div>
              </div>

              <button className="ic-gold-btn" onClick={() => navigate('/7-day-challenge')}>
                Continue Your Journey
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="income-calculator">
      <div className="ic-container">
        {/* Progress dots */}
        <div className="ic-progress">
          {Array.from({ length: user ? 6 : TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`ic-progress-dot ${
                i + 1 === (user && step > 6 ? 6 : step) ? 'active' :
                i + 1 < (user && step > 6 ? 6 : step) ? 'completed' : ''
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {renderStep()}

        {/* Navigation buttons */}
        {step < 8 && step !== 7 && (
          <div className="ic-actions">
            <button
              className="ic-primary-btn"
              disabled={!canProceed()}
              onClick={nextStep}
            >
              {step === 6 && user ? 'See Results' : 'Continue'}
            </button>
            {step > 1 && (
              <button className="ic-secondary-btn" onClick={prevStep}>
                ← Go Back
              </button>
            )}
          </div>
        )}

        {/* Results actions */}
        {step === 8 && (
          <div className="ic-actions">
            <button className="ic-secondary-btn" onClick={() => setStep(1)}>
              Start Over
            </button>
            <button className="ic-secondary-btn" onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
