import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { STAGES } from '../lib/stageConfig'
import {
  derivePersonaFromWealthLadder,
  determineGuidanceEmphasis,
  getValidGoalsForWealthLadder,
  determineOnboardingPath,
} from '../lib/onboardingV2'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './BusinessSetup.css'

const STAGE_OPTIONS = [
  { value: 'not_validated', label: "I have an idea but haven't tested it yet", stage: STAGES.VALIDATION },
  { value: 'validated_no_product', label: "People want it but I haven't built it yet", stage: STAGES.PRODUCT_CREATION },
  { value: 'have_product_not_tested', label: 'I have something built but need more feedback', stage: STAGES.TESTING },
  { value: 'have_product_with_customers', label: 'I have paying customers', stage: STAGES.MONEY_MODELS },
  { value: 'need_offer_stack', label: 'I need to build out my full offer', stage: STAGES.OFFER_CREATION },
  { value: 'need_marketing', label: 'My offer is ready, I need to get it out there', stage: STAGES.CAMPAIGN_CREATION },
  { value: 'ready_to_launch', label: "I'm ready to launch", stage: STAGES.LAUNCH },
]

// Money model tier options (same as QuickCapture ProductCard)
const TIER_OPTIONS = [
  { id: 'attraction', label: 'Attraction', description: 'Free or low-cost to attract leads', icon: '🧲' },
  { id: 'core', label: 'Core', description: 'Your main offering', icon: '⭐' },
  { id: 'upsell', label: 'Upsell', description: 'Higher-value add-on', icon: '📈' },
  { id: 'downsell', label: 'Downsell', description: 'Lower-cost alternative', icon: '📉' },
  { id: 'continuity', label: 'Continuity', description: 'Recurring subscription', icon: '🔄' }
]

function BusinessSetup({ userId, onSetupComplete, existingProject, stageProgress }) {
  const [setupComplete, setSetupComplete] = useState(false)
  const [loading, setLoading] = useState(!!existingProject)
  const [existingProducts, setExistingProducts] = useState([])

  // Product form state
  const [products, setProducts] = useState([makeEmptyProduct()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Check existing products
  useEffect(() => {
    if (!existingProject || !userId) {
      setLoading(false)
      return
    }

    // Skip product identification unless user explicitly said "build my own"
    if (stageProgress?.ambition !== 'build_own') {
      setSetupComplete(true)
      setLoading(false)
      return
    }

    const checkProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, money_model_tier')
          .eq('user_id', userId)
          .eq('project_id', existingProject.id)
          .eq('status', 'active')

        if (data && data.length > 0) {
          setExistingProducts(data)
          setSetupComplete(true)
        }
      } catch (err) {
        console.warn('Error checking products:', err)
      }
      setLoading(false)
    }

    checkProducts()
  }, [existingProject, userId, stageProgress?.ambition])

  const handleAddProduct = () => {
    hapticLight()
    setProducts(prev => [...prev, makeEmptyProduct()])
  }

  const handleRemoveProduct = (index) => {
    if (products.length <= 1) return
    setProducts(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateProduct = (index, field, value) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handleSaveProducts = async () => {
    const validProducts = products.filter(p => p.name.trim())
    if (validProducts.length === 0) return

    setSaving(true)
    setError(null)

    try {
      const inserts = validProducts.map(p => ({
        user_id: userId,
        project_id: existingProject?.id || null,
        name: p.name.trim(),
        description: p.description.trim() || null,
        product_type: 'custom_service',
        money_model_tier: p.tier || null,
        status: 'active',
        source: 'business_setup',
        metadata: { captured_at: new Date().toISOString() }
      }))

      const { error: insertError } = await supabase
        .from('products')
        .insert(inserts)

      if (insertError) throw insertError

      hapticSuccess()
      setSetupComplete(true)
    } catch (err) {
      console.error('Error saving products:', err)
      setError('Failed to save products. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const hasValidProduct = products.some(p => p.name.trim())

  if (loading) {
    return (
      <div className="business-setup">
        <div className="bs-loading">
          <div className="bs-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Fully complete
  if (setupComplete && existingProject) {
    return (
      <div className="business-setup">
        <div className="bs-hero">
          <span className="bs-hero-label">Setup</span>
          <h2 className="bs-hero-title">Business Setup Complete</h2>
          <p className="bs-hero-sub">
            {existingProducts.length > 0
              ? `${existingProducts.length} product${existingProducts.length > 1 ? 's' : ''} identified`
              : 'Your project is ready'}
          </p>
        </div>
        <div className="bs-card">
          <p className="bs-card-text">Select a stage tab above to start working on your quests.</p>
        </div>
      </div>
    )
  }

  // Has project but products not yet identified
  if (existingProject && !setupComplete) {
    return (
      <div className="business-setup">
        <div className="bs-hero">
          <span className="bs-hero-label">Setup</span>
          <h2 className="bs-hero-title">Identify Your Products</h2>
          <p className="bs-hero-sub">
            {stageProgress?.has_existing_business
              ? 'Define the products in your suite to unlock the business stages.'
              : 'Tell us about your core product to unlock the business stages.'}
          </p>
        </div>

        <div className="bs-products">
          {products.map((product, index) => (
            <div key={index} className="bs-product-card">
              <div className="bs-product-header">
                <span className="bs-product-number">Product {index + 1}</span>
                {products.length > 1 && (
                  <button className="bs-product-remove" onClick={() => handleRemoveProduct(index)}>&times;</button>
                )}
              </div>

              <div className="bs-field">
                <label>Name your offering</label>
                <input
                  type="text"
                  placeholder="e.g. 1:1 Coaching, Online Course"
                  value={product.name}
                  onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="bs-field">
                <label>One-line description <span className="bs-optional">(optional)</span></label>
                <input
                  type="text"
                  placeholder="What does someone get?"
                  value={product.description}
                  onChange={(e) => handleUpdateProduct(index, 'description', e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="bs-field">
                <label>Where does this fit in your suite?</label>
                <div className="bs-tier-grid">
                  {TIER_OPTIONS.map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      className={`bs-tier-btn ${product.tier === tier.id ? 'selected' : ''}`}
                      onClick={() => {
                        hapticLight()
                        handleUpdateProduct(index, 'tier', tier.id)
                      }}
                    >
                      <span className="bs-tier-icon">{tier.icon}</span>
                      <span className="bs-tier-label">{tier.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button className="bs-add-product" onClick={handleAddProduct}>
            + Add another product
          </button>
        </div>

        {error && <p className="bs-error">{error}</p>}

        <button
          className="bs-cta"
          onClick={handleSaveProducts}
          disabled={!hasValidProduct || saving}
        >
          {saving ? 'Saving...' : 'Save Products & Continue'}
        </button>
      </div>
    )
  }

  // No project yet — show the full setup flow (BQ1-BQ3 → project creation)
  return (
    <div className="business-setup">
      <div className="bs-hero">
        <span className="bs-hero-label">Setup</span>
        <h2 className="bs-hero-title">Set Up Your Business</h2>
        <p className="bs-hero-sub">A few quick questions to personalise your business journey.</p>
      </div>

      <div className="bs-card">
        <BusinessQuestionsFlow
          userId={userId}
          onComplete={(project) => {
            setSetupComplete(true)
            if (onSetupComplete) onSetupComplete(project)
          }}
        />
      </div>
    </div>
  )
}

function makeEmptyProduct() {
  return { name: '', description: '', tier: null }
}

/**
 * BusinessQuestionsFlow — Old Q1-Q3 + project creation
 * Steps: BQ1 (journey) → BQ2 (wealth ladder) → BQ3 (goal) → Project Name → Stage
 */
function BusinessQuestionsFlow({ userId, onComplete }) {
  const [step, setStep] = useState('bq1')
  const [questions, setQuestions] = useState(null)
  const [loadError, setLoadError] = useState(false)

  // Business question answers
  const [employmentStatus, setEmploymentStatus] = useState(null)
  const [hasSideProject, setHasSideProject] = useState(false)
  const [wealthLadderRung, setWealthLadderRung] = useState(null)
  const [primaryGoal, setPrimaryGoal] = useState(null)

  // Project creation state
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [selectedStage, setSelectedStage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load persona-assessment.json for the 3 business questions
  useEffect(() => {
    fetch(`/persona-assessment.json?v=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(data => setQuestions(data.questions))
      .catch(() => setLoadError(true))
  }, [])

  const STEP_LABELS = ['Journey', 'Creations', 'Goal', 'Project', 'Stage']
  const STEP_KEYS = ['bq1', 'bq2', 'bq3', 'name', 'stage']
  const currentStepIndex = STEP_KEYS.indexOf(step)

  // Save business profile data after BQ3
  const saveBusinessProfile = async (goal) => {
    const persona = derivePersonaFromWealthLadder(wealthLadderRung, employmentStatus)
    const emphasis = determineGuidanceEmphasis(wealthLadderRung, goal)

    try {
      await supabase.from('user_stage_progress').upsert({
        user_id: userId,
        persona,
        employment_status: employmentStatus,
        has_side_project: hasSideProject,
        wealth_ladder_rung: wealthLadderRung,
        primary_goal: goal,
        guidance_emphasis: emphasis,
      }, { onConflict: 'user_id' })
    } catch (err) {
      console.warn('Error saving business profile:', err)
    }
  }

  // Create project after stage selection
  const handleCreateProject = async () => {
    if (!selectedStage || saving) return

    setSaving(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('user_projects')
        .insert({
          user_id: userId,
          name: projectName.trim(),
          description: projectDesc.trim() || null,
          source_flow: 'business_setup',
          status: 'active',
          current_stage: selectedStage.stage,
          total_points: 0,
          is_primary: true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      hapticSuccess()
      onComplete(data)
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Failed to create project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return <p className="bs-error">Failed to load questions. Please refresh.</p>
  }

  if (!questions) {
    return (
      <div className="bs-loading">
        <div className="bs-spinner" />
      </div>
    )
  }

  // Step progress dots
  const renderStepDots = () => (
    <div className="bs-step-dots">
      {STEP_LABELS.map((label, i) => (
        <div
          key={label}
          className={`bs-step-dot ${i === currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}`}
        />
      ))}
    </div>
  )

  // ─── BQ1: Journey Stage ─────────────────────────────────
  if (step === 'bq1') {
    const q = questions[0]
    return (
      <div className="bs-form">
        {renderStepDots()}
        <div className="bs-question">
          <h3 className="bs-question-heading">{q.question}</h3>
          {q.subtext && <p className="bs-question-sub">{q.subtext}</p>}
        </div>
        <div className="bs-option-list">
          {q.options.map(option => (
            <button
              key={option.value}
              type="button"
              className="bs-option"
              onClick={() => {
                hapticLight()
                setEmploymentStatus(option.value)
                setHasSideProject(option.data?.has_side_project || false)
                setStep('bq2')
              }}
            >
              <span className="bs-option-label">{option.label}</span>
              <span className="bs-option-desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── BQ2: Wealth Ladder ─────────────────────────────────
  if (step === 'bq2') {
    const q = questions[1]
    return (
      <div className="bs-form">
        {renderStepDots()}
        <div className="bs-question">
          <h3 className="bs-question-heading">{q.question}</h3>
          {q.subtext && <p className="bs-question-sub">{q.subtext}</p>}
        </div>
        <div className="bs-option-list">
          {q.options.map(option => (
            <button
              key={option.value}
              type="button"
              className="bs-option"
              onClick={() => {
                hapticLight()
                setWealthLadderRung(option.data?.wealth_ladder || option.value)
                setPrimaryGoal(null)
                setStep('bq3')
              }}
            >
              <span className="bs-option-label">{option.label}</span>
              <span className="bs-option-desc">{option.description}</span>
            </button>
          ))}
        </div>
        <button type="button" className="bs-back-btn" onClick={() => setStep('bq1')}>
          Back
        </button>
      </div>
    )
  }

  // ─── BQ3: Goal ──────────────────────────────────────────
  if (step === 'bq3') {
    const q = questions[2]
    const validGoals = getValidGoalsForWealthLadder(wealthLadderRung)
    return (
      <div className="bs-form">
        {renderStepDots()}
        <div className="bs-question">
          <h3 className="bs-question-heading">{q.question}</h3>
          {q.subtext && <p className="bs-question-sub">{q.subtext}</p>}
        </div>
        <div className="bs-option-list">
          {q.options.map(option => {
            const isDisabled = !validGoals.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                className={`bs-option ${isDisabled ? 'disabled' : ''}`}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return
                  hapticLight()
                  setPrimaryGoal(option.value)
                  saveBusinessProfile(option.value)
                  setStep('name')
                }}
              >
                <span className="bs-option-label">{option.label}</span>
                <span className="bs-option-desc">{option.description}</span>
                {isDisabled && <span className="bs-option-locked">Not available at your stage</span>}
              </button>
            )
          })}
        </div>
        <button type="button" className="bs-back-btn" onClick={() => setStep('bq2')}>
          Back
        </button>
      </div>
    )
  }

  // ─── Project Name ───────────────────────────────────────
  if (step === 'name') {
    return (
      <form className="bs-form" onSubmit={(e) => { e.preventDefault(); if (projectName.trim()) { hapticLight(); setStep('stage') } }}>
        {renderStepDots()}
        <div className="bs-field">
          <label htmlFor="bs-project-name">What's your business or project called?</label>
          <input
            id="bs-project-name"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. My Coaching Business, SaaS App"
            maxLength={100}
            required
          />
        </div>
        <div className="bs-field">
          <label htmlFor="bs-project-desc">Brief description <span className="bs-optional">(optional)</span></label>
          <textarea
            id="bs-project-desc"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="What does your business do? Who does it serve?"
            rows={3}
            maxLength={500}
          />
        </div>
        <div className="bs-actions">
          <button type="button" className="bs-back-btn" onClick={() => setStep('bq3')}>
            Back
          </button>
          <button type="submit" className="bs-cta" disabled={!projectName.trim()}>
            Next
          </button>
        </div>
      </form>
    )
  }

  // ─── Stage Selection ────────────────────────────────────
  if (step === 'stage') {
    return (
      <div className="bs-form">
        {renderStepDots()}
        <div className="bs-field">
          <label>Where are you at with <strong>{projectName}</strong>?</label>
          <div className="bs-stage-options">
            {STAGE_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`bs-stage-option ${selectedStage?.value === option.value ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setSelectedStage(option) }}
              >
                <span className="bs-stage-number">{option.stage}</span>
                <span className="bs-stage-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="bs-error">{error}</p>}

        <div className="bs-actions">
          <button type="button" className="bs-back-btn" onClick={() => setStep('name')}>
            Back
          </button>
          <button
            type="button"
            className="bs-cta"
            onClick={handleCreateProject}
            disabled={!selectedStage || saving}
          >
            {saving ? 'Creating...' : 'Create Project & Start'}
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default BusinessSetup
