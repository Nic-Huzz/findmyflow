/**
 * GrandSlamOfferFlow.jsx - Grand Slam Offer Builder V2 (+35 pts)
 *
 * Stage 2 (Product Creation) flow for building a complete Grand Slam Offer
 * using Alex Hormozi's $100M Offers framework.
 *
 * Prerequisites: Offer Builder V1 (flow_100m_offer)
 *
 * Flow:
 * 1. Load existing offer from V1
 * 2. Design Bonuses (value stacking)
 * 3. Create Guarantee (risk reversal)
 * 4. Define Scarcity/Urgency
 * 5. Name Your Offer
 * 6. Summary & Complete
 *
 * Created: January 2026
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './GrandSlamOfferFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  REVIEW_OFFER: 'review_offer',
  BONUSES: 'bonuses',
  GUARANTEE: 'guarantee',
  SCARCITY: 'scarcity',
  NAMING: 'naming',
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.LOADING, STAGES.WELCOME, STAGES.REVIEW_OFFER] },
  { id: 'bonuses', label: 'Bonuses', stages: [STAGES.BONUSES] },
  { id: 'guarantee', label: 'Guarantee', stages: [STAGES.GUARANTEE] },
  { id: 'scarcity', label: 'Scarcity', stages: [STAGES.SCARCITY] },
  { id: 'naming', label: 'Naming', stages: [STAGES.NAMING] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUMMARY, STAGES.SUCCESS] }
]

// Guarantee types with descriptions
const GUARANTEE_TYPES = [
  {
    id: 'unconditional',
    name: 'Unconditional',
    icon: '🛡️',
    description: 'No questions asked refund within X days',
    example: '"30-day money-back guarantee, no questions asked"',
    risk: 'Higher refund risk, maximum trust building'
  },
  {
    id: 'conditional',
    name: 'Conditional',
    icon: '📋',
    description: 'Refund if they complete requirements and don\'t get results',
    example: '"Complete all modules, implement the system, if you don\'t see results in 90 days, full refund"',
    risk: 'Lower refund risk, still builds trust'
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: '🎯',
    description: 'Outcome-based guarantee tied to specific results',
    example: '"If you don\'t get X result, I\'ll work with you until you do"',
    risk: 'Can create ongoing commitment, shows extreme confidence'
  },
  {
    id: 'anti_guarantee',
    name: 'Anti-Guarantee',
    icon: '🔥',
    description: 'All sales final - for high-demand, proven offers',
    example: '"Due to the nature of digital products, all sales are final"',
    risk: 'Only works with high trust/demand, can reduce conversions'
  }
]

// Scarcity types
const SCARCITY_TYPES = [
  {
    id: 'cohort',
    name: 'Cohort-Based',
    icon: '👥',
    description: 'Limited spots per cohort or batch',
    example: 'Only 20 spots available per cohort'
  },
  {
    id: 'time',
    name: 'Time-Based',
    icon: '⏰',
    description: 'Enrollment windows or launch periods',
    example: 'Doors close Friday at midnight'
  },
  {
    id: 'bonus',
    name: 'Bonus-Based',
    icon: '🎁',
    description: 'Bonuses expire after deadline',
    example: 'First 10 buyers get a 1:1 strategy call'
  },
  {
    id: 'price',
    name: 'Price-Based',
    icon: '💰',
    description: 'Early-bird or founding member pricing',
    example: 'Founding member price: $497 (regular $997)'
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: '📦',
    description: 'Physical inventory or capacity limits',
    example: 'Only 50 units available this quarter'
  }
]

function GrandSlamOfferFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [existingOffer, setExistingOffer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  // Grand Slam elements
  const [bonuses, setBonuses] = useState([])
  const [currentBonus, setCurrentBonus] = useState({
    name: '',
    description: '',
    value: '',
    problemSolved: ''
  })
  const [guarantee, setGuarantee] = useState({
    type: '',
    details: '',
    duration: ''
  })
  const [scarcity, setScarcity] = useState({
    type: '',
    details: '',
    deadline: ''
  })
  const [offerName, setOfferName] = useState('')
  const [offerTagline, setOfferTagline] = useState('')

  // Auto-save
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('grand-slam-offer', user?.id)

  // Load existing offer from V1 on mount
  useEffect(() => {
    if (user) {
      loadExistingOffer()
    }
  }, [user])

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
      bonuses,
      guarantee,
      scarcity,
      offerName,
      offerTagline
    }
    saveProgress(progressData)
  }, [stage, bonuses, guarantee, scarcity, offerName, offerTagline, user, saveProgress])

  const loadExistingOffer = async () => {
    try {
      // Load most recent offer builder assessment
      const { data, error } = await supabase
        .from('offer_builder_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setExistingOffer(data)
        setStage(STAGES.WELCOME)
      } else {
        // No V1 offer found
        setError('Please complete Offer Builder V1 first')
        setStage(STAGES.WELCOME)
      }
    } catch (err) {
      console.error('Error loading existing offer:', err)
      setError('Failed to load your offer data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeProgress = useCallback(() => {
    if (savedProgressData) {
      setStage(savedProgressData.stage)
      if (savedProgressData.bonuses) setBonuses(savedProgressData.bonuses)
      if (savedProgressData.guarantee) setGuarantee(savedProgressData.guarantee)
      if (savedProgressData.scarcity) setScarcity(savedProgressData.scarcity)
      if (savedProgressData.offerName) setOfferName(savedProgressData.offerName)
      if (savedProgressData.offerTagline) setOfferTagline(savedProgressData.offerTagline)
    }
    setShowResumePrompt(false)
  }, [savedProgressData])

  const handleStartFresh = useCallback(() => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }, [clearProgress])

  // Add bonus to list
  const addBonus = () => {
    if (!currentBonus.name.trim() || !currentBonus.description.trim()) return
    setBonuses(prev => [...prev, { ...currentBonus, id: Date.now() }])
    setCurrentBonus({ name: '', description: '', value: '', problemSolved: '' })
  }

  // Remove bonus
  const removeBonus = (id) => {
    setBonuses(prev => prev.filter(b => b.id !== id))
  }

  // Calculate total bonus value
  const getTotalBonusValue = () => {
    return bonuses.reduce((sum, b) => sum + (parseInt(b.value) || 0), 0)
  }

  // Save results
  const handleSaveResults = async () => {
    if (isSaving || !user) return
    setIsSaving(true)
    setError(null)

    try {
      const grandSlamData = {
        user_id: user.id,
        offer_builder_id: existingOffer?.id,
        offer_name: offerName,
        offer_tagline: offerTagline,
        bonuses: bonuses,
        guarantee: guarantee,
        scarcity: scarcity,
        total_bonus_value: getTotalBonusValue(),
        created_at: new Date().toISOString()
      }

      // Save to grand_slam_offers table (or create if doesn't exist)
      const { error: saveError } = await supabase
        .from('grand_slam_offers')
        .insert(grandSlamData)

      if (saveError) {
        // Table might not exist, save to offer_builder_assessments metadata
        await supabase
          .from('offer_builder_assessments')
          .update({
            grand_slam_data: grandSlamData
          })
          .eq('id', existingOffer?.id)
      }

      // Track flow completion
      await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'offer_builder_v2',
        flow_version: 'grand-slam-v1',
        status: 'completed',
        last_step_id: 'complete'
      })

      // Complete quest
      await completeFlowQuest({
        userId: user.id,
        flowId: 'offer_builder_v2',
        pointsEarned: 35
      })

      // Create milestone
      try {
        const { data: projectData } = await supabase
          .from('user_projects')
          .select('id, current_stage')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        await supabase.from('milestone_completions').insert({
          user_id: user.id,
          project_id: projectData?.id,
          milestone_id: 'grand_slam_offer_created',
          stage: projectData?.current_stage || 2,
          evidence_text: `Created Grand Slam offer: ${offerName} with ${bonuses.length} bonuses`
        })
      } catch (milestoneError) {
        console.warn('Milestone creation failed:', milestoneError)
      }

      clearProgress()
      setStage(STAGES.SUCCESS)
    } catch (err) {
      setError('Failed to save. Please try again.')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Get core products from existing offer
  const getCoreProducts = () => {
    if (!existingOffer?.responses?.solution_categories) return []
    const solutions = existingOffer.responses.q8_problem_solutions?.solutions || []
    return solutions.filter((_, idx) =>
      existingOffer.responses.solution_categories[`solution_${idx}`] === 'core_product'
    )
  }

  // RENDER

  // Loading state
  if (stage === STAGES.LOADING) {
    return (
      <div className="grand-slam-flow">
        <div className="loading-state">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>Loading your offer...</p>
        </div>
      </div>
    )
  }

  // Resume prompt
  if (showResumePrompt && savedProgressData) {
    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">Welcome Back!</h1>
          <div className="resume-prompt">
            <p className="resume-icon">💾</p>
            <p><strong>You have saved progress</strong></p>
            <p className="resume-stage">
              You were on: <strong>{savedProgressData.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
            </p>
          </div>
          <button className="primary-button glow-button" onClick={handleResumeProgress}>
            Continue Where I Left Off
          </button>
          <button className="secondary-button" onClick={handleStartFresh} style={{ marginTop: '12px' }}>
            Start Fresh
          </button>
        </div>
      </div>
    )
  }

  // WELCOME
  if (stage === STAGES.WELCOME) {
    if (!existingOffer) {
      return (
        <div className="grand-slam-flow">
          <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
          <div className="welcome-container">
            <h1 className="welcome-greeting">Grand Slam Offer Builder</h1>
            <div className="welcome-message">
              <p className="error-notice">You need to complete Offer Builder V1 first.</p>
              <p>V1 helps you categorize your solutions into Core Products, Lead Magnets, and Bonuses.</p>
              <p>Then V2 (this flow) helps you design the full Grand Slam package.</p>
            </div>
            <button className="primary-button" onClick={() => navigate('/offer-builder')}>
              Go to Offer Builder V1
            </button>
            <button className="secondary-button" onClick={() => navigate('/7-day-challenge')} style={{ marginTop: '12px' }}>
              Back to Challenge
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">Grand Slam Offer Builder</h1>
          <div className="welcome-message animated-text">
            <p><strong>Time to make your offer irresistible.</strong></p>
            <p>You've categorized your solutions. Now let's add the elements that make people feel <em>stupid</em> saying no:</p>
            <div className="grand-slam-elements">
              <div className="gs-element">
                <span className="gs-icon">🎁</span>
                <span>Stack valuable bonuses</span>
              </div>
              <div className="gs-element">
                <span className="gs-icon">🛡️</span>
                <span>Create risk reversal</span>
              </div>
              <div className="gs-element">
                <span className="gs-icon">⏰</span>
                <span>Add ethical scarcity</span>
              </div>
              <div className="gs-element">
                <span className="gs-icon">✨</span>
                <span>Name it memorably</span>
              </div>
            </div>
          </div>
          <button className="primary-button glow-button" onClick={() => setStage(STAGES.REVIEW_OFFER)}>
            Let's Build This
          </button>
          <p className="attribution-text">Based on Alex Hormozi's $100M Offers framework</p>
        </div>
      </div>
    )
  }

  // REVIEW OFFER
  if (stage === STAGES.REVIEW_OFFER) {
    const coreProducts = getCoreProducts()
    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="review-container">
          <h2 className="question-text">Your Core Offer Foundation</h2>
          <p className="question-subtext">Here's what we're building on from V1</p>

          <div className="offer-foundation">
            {coreProducts.length > 0 ? (
              <div className="core-products-list">
                <h4>Core Product(s)</h4>
                {coreProducts.map((product, idx) => (
                  <div key={idx} className="foundation-card">
                    <span className="product-type-badge">{product.solutionType}</span>
                    <p>{product.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="foundation-card">
                <p>Your core offer from V1 categorization</p>
              </div>
            )}

            <div className="niche-summary">
              <h4>Your Niche</h4>
              <p>{existingOffer.niche_definition || existingOffer.responses?.q6_niche_layers?.value || 'Not defined'}</p>
            </div>
          </div>

          <button className="primary-button" onClick={() => setStage(STAGES.BONUSES)}>
            Continue to Bonuses
          </button>
          <BackButton onClick={() => setStage(STAGES.WELCOME)} />
        </div>
      </div>
    )
  }

  // BONUSES
  if (stage === STAGES.BONUSES) {
    const totalValue = getTotalBonusValue()
    const isValid = bonuses.length >= 1

    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="bonuses-container">
          <h2 className="question-text">Design Your Bonuses</h2>
          <p className="question-subtext">
            Great bonuses address obstacles your customer faces AFTER buying. Aim for 10x the price in perceived value.
          </p>

          {/* Value tracker */}
          <div className="value-tracker">
            <span className="value-label">Total Bonus Value:</span>
            <span className="value-amount">${totalValue.toLocaleString()}</span>
            {bonuses.length > 0 && (
              <span className="value-count">({bonuses.length} bonus{bonuses.length !== 1 ? 'es' : ''})</span>
            )}
          </div>

          {/* Added bonuses */}
          {bonuses.length > 0 && (
            <div className="bonuses-list">
              {bonuses.map((bonus) => (
                <div key={bonus.id} className="bonus-card">
                  <div className="bonus-header">
                    <h4>{bonus.name}</h4>
                    <span className="bonus-value">${parseInt(bonus.value || 0).toLocaleString()} value</span>
                  </div>
                  <p className="bonus-desc">{bonus.description}</p>
                  {bonus.problemSolved && (
                    <p className="bonus-problem">Solves: {bonus.problemSolved}</p>
                  )}
                  <button className="remove-bonus-btn" onClick={() => removeBonus(bonus.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add bonus form */}
          <div className="add-bonus-form">
            <h4>{bonuses.length === 0 ? 'Add a Bonus' : 'Add Another Bonus'}</h4>

            <div className="form-field">
              <label>Bonus Name</label>
              <input
                type="text"
                placeholder="e.g., Quick-Start Implementation Guide"
                value={currentBonus.name}
                onChange={(e) => setCurrentBonus(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-field">
              <label>What is it?</label>
              <textarea
                placeholder="Describe what they get and why it's valuable"
                value={currentBonus.description}
                onChange={(e) => setCurrentBonus(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-field half">
                <label>Perceived Value ($)</label>
                <input
                  type="number"
                  placeholder="497"
                  value={currentBonus.value}
                  onChange={(e) => setCurrentBonus(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div className="form-field half">
                <label>What obstacle does it solve?</label>
                <input
                  type="text"
                  placeholder="e.g., Getting started quickly"
                  value={currentBonus.problemSolved}
                  onChange={(e) => setCurrentBonus(prev => ({ ...prev, problemSolved: e.target.value }))}
                />
              </div>
            </div>

            <button
              className="add-btn"
              onClick={addBonus}
              disabled={!currentBonus.name.trim() || !currentBonus.description.trim()}
            >
              + Add Bonus
            </button>
          </div>

          <div className="bonus-tips">
            <h4>Bonus Ideas</h4>
            <ul>
              <li><strong>Templates/Swipe Files</strong> - Reduce effort and time</li>
              <li><strong>Community Access</strong> - Connection and accountability</li>
              <li><strong>Quick-Start Guide</strong> - Faster implementation</li>
              <li><strong>Bonus Training</strong> - Address specific challenges</li>
              <li><strong>1:1 Call</strong> - Personalized support (high perceived value)</li>
            </ul>
          </div>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.GUARANTEE)}
            disabled={!isValid}
          >
            Continue ({bonuses.length} bonus{bonuses.length !== 1 ? 'es' : ''})
          </button>
          <BackButton onClick={() => setStage(STAGES.REVIEW_OFFER)} />
        </div>
      </div>
    )
  }

  // GUARANTEE
  if (stage === STAGES.GUARANTEE) {
    const isValid = guarantee.type && guarantee.details.trim()

    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="guarantee-container">
          <h2 className="question-text">Create Your Guarantee</h2>
          <p className="question-subtext">
            A guarantee transfers risk from the buyer to you. The stronger the guarantee, the more confident your prospect feels.
          </p>

          <div className="guarantee-types">
            {GUARANTEE_TYPES.map((type) => (
              <button
                key={type.id}
                className={`guarantee-type-card ${guarantee.type === type.id ? 'selected' : ''}`}
                onClick={() => setGuarantee(prev => ({ ...prev, type: type.id }))}
              >
                <span className="type-icon">{type.icon}</span>
                <h4>{type.name}</h4>
                <p className="type-desc">{type.description}</p>
                <p className="type-example">"{type.example}"</p>
                <p className="type-risk">{type.risk}</p>
              </button>
            ))}
          </div>

          {guarantee.type && (
            <div className="guarantee-details">
              <div className="form-field">
                <label>Your Specific Guarantee</label>
                <textarea
                  placeholder="Write out your guarantee exactly as you'd present it to customers..."
                  value={guarantee.details}
                  onChange={(e) => setGuarantee(prev => ({ ...prev, details: e.target.value }))}
                  rows={4}
                />
              </div>

              {(guarantee.type === 'unconditional' || guarantee.type === 'conditional') && (
                <div className="form-field">
                  <label>Duration (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 30 days, 90 days, 1 year"
                    value={guarantee.duration}
                    onChange={(e) => setGuarantee(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )}

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.SCARCITY)}
            disabled={!isValid}
          >
            Continue
          </button>
          <BackButton onClick={() => setStage(STAGES.BONUSES)} />
        </div>
      </div>
    )
  }

  // SCARCITY
  if (stage === STAGES.SCARCITY) {
    const isValid = scarcity.type && scarcity.details.trim()

    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="scarcity-container">
          <h2 className="question-text">Define Scarcity & Urgency</h2>
          <p className="question-subtext">
            Scarcity gives prospects a reason to act NOW. <strong>Only use scarcity that's real</strong> - fake scarcity destroys trust.
          </p>

          <div className="scarcity-types">
            {SCARCITY_TYPES.map((type) => (
              <button
                key={type.id}
                className={`scarcity-type-card ${scarcity.type === type.id ? 'selected' : ''}`}
                onClick={() => setScarcity(prev => ({ ...prev, type: type.id }))}
              >
                <span className="type-icon">{type.icon}</span>
                <h4>{type.name}</h4>
                <p className="type-desc">{type.description}</p>
                <p className="type-example">{type.example}</p>
              </button>
            ))}
          </div>

          {scarcity.type && (
            <div className="scarcity-details">
              <div className="form-field">
                <label>Your Specific Scarcity/Urgency</label>
                <textarea
                  placeholder="Describe your scarcity element in detail..."
                  value={scarcity.details}
                  onChange={(e) => setScarcity(prev => ({ ...prev, details: e.target.value }))}
                  rows={3}
                />
              </div>

              {(scarcity.type === 'time' || scarcity.type === 'bonus') && (
                <div className="form-field">
                  <label>Deadline (if applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g., Friday at midnight, First 10 buyers"
                    value={scarcity.deadline}
                    onChange={(e) => setScarcity(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )}

          <div className="scarcity-warning">
            <p><strong>Remember:</strong> Only use scarcity that's actually true. If you can serve unlimited customers, create real constraints (cohort sizes, personal bandwidth, etc.)</p>
          </div>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.NAMING)}
            disabled={!isValid}
          >
            Continue
          </button>
          <BackButton onClick={() => setStage(STAGES.GUARANTEE)} />
        </div>
      </div>
    )
  }

  // NAMING
  if (stage === STAGES.NAMING) {
    const isValid = offerName.trim().length > 0

    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="naming-container">
          <h2 className="question-text">Name Your Offer</h2>
          <p className="question-subtext">
            A great name is memorable, specific, and hints at the transformation.
          </p>

          <div className="naming-form">
            <div className="form-field">
              <label>Offer Name</label>
              <input
                type="text"
                placeholder="e.g., The 90-Day Revenue Accelerator"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                className="offer-name-input"
              />
            </div>

            <div className="form-field">
              <label>Tagline (optional)</label>
              <input
                type="text"
                placeholder="e.g., From stuck to $10K/month in 90 days or less"
                value={offerTagline}
                onChange={(e) => setOfferTagline(e.target.value)}
              />
            </div>
          </div>

          <div className="naming-tips">
            <h4>Naming Formulas</h4>
            <ul>
              <li><strong>The [Timeframe] [Outcome]</strong> - "The 30-Day Launch System"</li>
              <li><strong>[Adjective] [Noun] [Method]</strong> - "The Rapid Revenue Blueprint"</li>
              <li><strong>[Number] [Outcome] [System/Method]</strong> - "The 6-Figure Coaching Formula"</li>
              <li><strong>The [Specific Niche] [Transformation]</strong> - "The Burnt-Out Executive's Freedom Path"</li>
            </ul>
          </div>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.SUMMARY)}
            disabled={!isValid}
          >
            Review My Grand Slam Offer
          </button>
          <BackButton onClick={() => setStage(STAGES.SCARCITY)} />
        </div>
      </div>
    )
  }

  // SUMMARY
  if (stage === STAGES.SUMMARY) {
    const totalBonusValue = getTotalBonusValue()
    const selectedGuarantee = GUARANTEE_TYPES.find(g => g.id === guarantee.type)
    const selectedScarcity = SCARCITY_TYPES.find(s => s.id === scarcity.type)

    return (
      <div className="grand-slam-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="summary-container">
          <h1 className="welcome-greeting">{offerName || 'Your Grand Slam Offer'}</h1>
          {offerTagline && <p className="offer-tagline">{offerTagline}</p>}

          <div className="grand-slam-summary">
            {/* Bonuses */}
            <div className="summary-section">
              <h3>🎁 Bonuses (${totalBonusValue.toLocaleString()} value)</h3>
              <div className="summary-bonuses">
                {bonuses.map((bonus) => (
                  <div key={bonus.id} className="summary-bonus">
                    <strong>{bonus.name}</strong> - ${parseInt(bonus.value || 0).toLocaleString()} value
                    <p>{bonus.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantee */}
            <div className="summary-section">
              <h3>{selectedGuarantee?.icon} Guarantee: {selectedGuarantee?.name}</h3>
              <p>{guarantee.details}</p>
              {guarantee.duration && <p className="meta">Duration: {guarantee.duration}</p>}
            </div>

            {/* Scarcity */}
            <div className="summary-section">
              <h3>{selectedScarcity?.icon} Scarcity: {selectedScarcity?.name}</h3>
              <p>{scarcity.details}</p>
              {scarcity.deadline && <p className="meta">Deadline: {scarcity.deadline}</p>}
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button glow-button"
            onClick={handleSaveResults}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Complete Grand Slam Offer (+35 pts)'}
          </button>
          <BackButton onClick={() => setStage(STAGES.NAMING)} />
        </div>
      </div>
    )
  }

  // SUCCESS
  if (stage === STAGES.SUCCESS) {
    return (
      <div className="grand-slam-flow">
        <div className="success-container">
          <div className="success-icon">🏆</div>
          <h2>Grand Slam Offer Complete!</h2>
          <p>You've built an offer so good people feel silly saying no.</p>
          <p className="points-earned">+35 points earned!</p>

          <div className="grand-slam-recap">
            <h3>{offerName}</h3>
            <p>{bonuses.length} bonuses worth ${getTotalBonusValue().toLocaleString()}</p>
            <p>{GUARANTEE_TYPES.find(g => g.id === guarantee.type)?.name} guarantee</p>
            <p>{SCARCITY_TYPES.find(s => s.id === scarcity.type)?.name} scarcity</p>
          </div>

          <div className="next-actions">
            <button className="primary-button" onClick={() => navigate('/7-day-challenge')}>
              Back to Challenge
            </button>
            <button className="secondary-button" onClick={() => navigate('/product-selection')} style={{ marginTop: '12px' }}>
              Continue to Product Selection
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GrandSlamOfferFlow
