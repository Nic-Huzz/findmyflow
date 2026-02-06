/**
 * MVPReadinessFlow - MVP Readiness Assessment for Stage 3 (Testing)
 *
 * Helps users prepare for testing by:
 * - Path A (Ready to test): Select product -> Identify 3-5 testers
 * - Path B (Need to build): Select product -> Define MVP -> Identify 3-5 testers
 *
 * Key insight: "Testing is all about is the transformation real"
 * Critical gate: Early-customer access is essential to success
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useProjectId } from '../hooks/useProjectId'
import { trackFlowCompletion } from '../lib/flowTracking'
import { useAutoSave } from '../hooks/useAutoSave'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import { syncMVPTestersToContacts } from '../lib/crm'
import './MVPReadinessFlow.css'

const STAGES = {
  LOADING: 'loading',
  TIME_CHECK: 'time_check',
  WELCOME: 'welcome',
  READY_CHECK: 'ready_check',        // Q1: Do you have something ready to test?
  PRODUCT_SELECT: 'product_select',   // Select which product
  MVP_DEFINITION: 'mvp_definition',   // Path B: Define MVP
  TESTERS_CHECK: 'testers_check',     // Do you know 3-5 testers?
  TESTERS_INPUT: 'testers_input',     // Path A: Enter tester names
  ACCESS_PLAN: 'access_plan',         // Path B: How will you access testers?
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Start', stages: [STAGES.TIME_CHECK, STAGES.WELCOME] },
  { id: 'readiness', label: 'Readiness', stages: [STAGES.READY_CHECK] },
  { id: 'product', label: 'Product', stages: [STAGES.PRODUCT_SELECT, STAGES.MVP_DEFINITION] },
  { id: 'testers', label: 'Testers', stages: [STAGES.TESTERS_CHECK, STAGES.TESTERS_INPUT, STAGES.ACCESS_PLAN] },
  { id: 'summary', label: 'Summary', stages: [STAGES.SUMMARY, STAGES.SUCCESS] }
]

// Solution type labels - matches OfferBuilderFlow
const SOLUTION_LABELS = {
  one_to_one: '1:1 Service',
  one_to_many: '1:Many Service',
  custom_service: 'Custom Service',
  packaged_service: 'Packaged Service',
  hybrid_service: 'Hybrid Service',
  group_program: 'Group Program',
  automated_group: 'Self-Paced Course',
  live_group: 'Live Cohort',
  managed_service: 'Done-For-You',
  membership: 'Membership',
  digital_product: 'Digital Product',
  tech_digital: 'Tech/Digital',
  software: 'Software/SaaS',
  physical_product: 'Physical Product',
  mixed_products: 'Mixed Products'
}

function MVPReadinessFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { projectId } = useProjectId()
  const showResults = searchParams.get('results') === 'true'

  const [stage, setStage] = useState(STAGES.LOADING)
  const [products, setProducts] = useState([])
  const [personaData, setPersonaData] = useState(null)
  const [problemData, setProblemData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Flow answers
  const [isReadyToTest, setIsReadyToTest] = useState(null) // true/false
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [mvpDefinition, setMvpDefinition] = useState('')
  const [hasTesters, setHasTesters] = useState(null) // true/false
  const [testers, setTesters] = useState(['', '', '', '', ''])
  const [accessPlan, setAccessPlan] = useState('')

  // CRM sync result
  const [testersSyncResult, setTestersSyncResult] = useState(null)

  // Auto-save
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('mvp-readiness', user?.id)

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // Note: Removed auto-register useEffect that was causing duplicate quest completions
  // Quest completion now only happens once when flow is completed

  // Check for saved progress
  useEffect(() => {
    if (user && stage === STAGES.TIME_CHECK) {
      const saved = loadProgress()
      if (saved && saved.stage && saved.stage !== STAGES.LOADING && saved.stage !== STAGES.SUCCESS && saved.stage !== STAGES.TIME_CHECK) {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, stage, loadProgress])

  // Auto-save on changes
  useEffect(() => {
    if (!user || stage === STAGES.LOADING || stage === STAGES.SUCCESS || stage === STAGES.TIME_CHECK) return

    const progressData = {
      stage,
      isReadyToTest,
      selectedProduct,
      mvpDefinition,
      hasTesters,
      testers,
      accessPlan
    }
    saveProgress(progressData)
  }, [stage, isReadyToTest, selectedProduct, mvpDefinition, hasTesters, testers, accessPlan, user, saveProgress])

  const handleResumeProgress = useCallback(() => {
    if (savedProgressData) {
      setStage(savedProgressData.stage)
      if (savedProgressData.isReadyToTest !== undefined) setIsReadyToTest(savedProgressData.isReadyToTest)
      if (savedProgressData.selectedProduct) setSelectedProduct(savedProgressData.selectedProduct)
      if (savedProgressData.mvpDefinition) setMvpDefinition(savedProgressData.mvpDefinition)
      if (savedProgressData.hasTesters !== undefined) setHasTesters(savedProgressData.hasTesters)
      if (savedProgressData.testers) setTesters(savedProgressData.testers)
      if (savedProgressData.accessPlan) setAccessPlan(savedProgressData.accessPlan)
    }
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }, [savedProgressData])

  const handleStartFresh = useCallback(() => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
    setStage(STAGES.WELCOME)
  }, [clearProgress])

  const loadData = async () => {
    try {
      // Load products from offer builder
      const { data: offerData } = await supabase
        .from('offer_builder_assessments')
        .select('responses')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (offerData?.responses?.q8_solutions?.solutions) {
        const solutions = offerData.responses.q8_solutions.solutions
        const solutionsArray = Array.isArray(solutions) ? solutions : Object.values(solutions)

        // Collect existingProductIds to look up names
        const existingProductIds = solutionsArray
          .filter(data => data?.existingProductId)
          .map(data => data.existingProductId)

        // Load existing product names if needed
        let existingProductsMap = {}
        if (existingProductIds.length > 0) {
          const { data: existingProducts } = await supabase
            .from('products')
            .select('id, name')
            .in('id', existingProductIds)

          if (existingProducts) {
            existingProductsMap = Object.fromEntries(
              existingProducts.map(p => [p.id, p.name])
            )
          }
        }

        const prods = solutionsArray
          .filter(data => data && data.description)
          .map((data, idx) => {
            // Determine the display name: user-entered name > existing product name > solution type label
            let displayName = data.name?.trim()
            if (!displayName && data.existingProductId) {
              displayName = existingProductsMap[data.existingProductId]
            }
            if (!displayName) {
              displayName = SOLUTION_LABELS[data.solutionType] || data.solutionType || 'Product'
            }

            return {
              id: `solution_${idx}`,
              ...data,
              label: displayName,
              typeLabel: SOLUTION_LABELS[data.solutionType] || data.solutionType
            }
          })
        setProducts(prods)
      }

      // Load problem from offer builder for MVP context
      if (offerData?.responses?.q7_obstacles?.sections) {
        const problems = offerData.responses.q7_obstacles.sections.flat().join(', ')
        setProblemData(problems)
      }

      // Load persona from persona selection or nikigai
      const { data: personaSelection } = await supabase
        .from('persona_selection_assessments')
        .select('responses')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (personaSelection?.responses?.selected_persona) {
        setPersonaData(personaSelection.responses.selected_persona)
      } else {
        // Fallback to nikigai persona clusters
        const { data: clusters } = await supabase
          .from('nikigai_clusters')
          .select('cluster_name, cluster_summary')
          .eq('user_id', user.id)
          .eq('cluster_type', 'persona')
          .limit(1)
          .maybeSingle()

        if (clusters) {
          setPersonaData({
            name: clusters.cluster_name,
            description: clusters.cluster_summary
          })
        }
      }

      // Check for existing assessment (View Results mode)
      if (showResults) {
        const { data: existing } = await supabase
          .from('mvp_readiness_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existing) {
          setIsReadyToTest(existing.is_ready_to_test)
          setSelectedProduct(existing.selected_product)
          setMvpDefinition(existing.mvp_definition || '')
          setHasTesters(existing.has_testers)
          setTesters(existing.testers || ['', '', '', '', ''])
          setAccessPlan(existing.access_plan || '')
          setStage(STAGES.SUMMARY)
          return
        }
      }

      setStage(STAGES.TIME_CHECK)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please try again.')
      setStage(STAGES.TIME_CHECK)
    }
  }

  const handleSaveResults = async () => {
    if (isLoading || !user) return

    setIsLoading(true)
    setError(null)

    try {
      // Save to mvp_readiness_assessments
      await supabase.from('mvp_readiness_assessments').insert({
        user_id: user.id,
        is_ready_to_test: isReadyToTest,
        selected_product: selectedProduct,
        mvp_definition: mvpDefinition || null,
        has_testers: hasTesters,
        testers: testers.filter(t => t.trim()),
        access_plan: accessPlan || null
      })

      // Track flow completion
      try {
        await trackFlowCompletion({
          userId: user.id,
          projectId,
          flowType: 'mvp_readiness',
          flowVersion: '1.0'
        })
      } catch (e) {
        console.warn('Flow tracking failed:', e)
      }

      // Complete challenge quest
      try {
        await completeFlowQuest({
          userId: user.id,
          flowId: 'mvp_readiness',
          pointsEarned: 6
        })
      } catch (e) {
        console.warn('Quest completion failed:', e)
      }

      // Sync testers to CRM contacts (if they entered testers)
      if (hasTesters && testers.some(t => t.trim())) {
        try {
          const syncResult = await syncMVPTestersToContacts(user.id)
          setTestersSyncResult(syncResult)
        } catch (e) {
          console.warn('CRM sync failed:', e)
        }
      }

      clearProgress()
      setStage(STAGES.SUCCESS)
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    const stageOrder = isReadyToTest
      ? [STAGES.WELCOME, STAGES.READY_CHECK, STAGES.PRODUCT_SELECT, STAGES.TESTERS_CHECK, hasTesters ? STAGES.TESTERS_INPUT : STAGES.ACCESS_PLAN, STAGES.SUMMARY]
      : [STAGES.WELCOME, STAGES.READY_CHECK, STAGES.PRODUCT_SELECT, STAGES.MVP_DEFINITION, STAGES.TESTERS_CHECK, hasTesters ? STAGES.TESTERS_INPUT : STAGES.ACCESS_PLAN, STAGES.SUMMARY]

    const currentIndex = stageOrder.indexOf(stage)
    if (currentIndex > 0) {
      setStage(stageOrder[currentIndex - 1])
    }
  }

  const getValidTesterCount = () => testers.filter(t => t.trim()).length

  // ============ RENDER ============

  if (stage === STAGES.LOADING) {
    return (
      <div className="mvp-readiness-flow">
        <div className="loading-state">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  // TIME CHECK
  if (stage === STAGES.TIME_CHECK) {
    const getTimeSinceSave = () => {
      if (!savedProgressData?.savedAt) return null
      const minutesAgo = Math.floor((Date.now() - savedProgressData.savedAt) / 60000)
      if (minutesAgo < 1) return 'just now'
      if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
      const hoursAgo = Math.floor(minutesAgo / 60)
      return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
    }

    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">MVP Readiness</h1>

          {showResumePrompt && savedProgressData && (
            <div className="resume-prompt">
              <p className="resume-title">Welcome back!</p>
              <p className="resume-info">
                You have saved progress
                <br />
                <span className="resume-time">Last saved {getTimeSinceSave()}</span>
              </p>
              <div className="resume-actions">
                <button className="primary-button" onClick={handleResumeProgress}>
                  Continue Where I Left Off
                </button>
                <button className="secondary-button" onClick={handleStartFresh}>
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {!showResumePrompt && (
            <>
              <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
                <p><span className="time-icon">🎯</span></p>
                <p><strong>This flow takes about 3 minutes</strong></p>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Prepare your product for testing with real customers.
                </p>
              </div>
              <button
                className="primary-button glow-button"
                onClick={() => setStage(STAGES.WELCOME)}
              >
                I'm Ready, Let's Go
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate('/7-day-challenge')}
              >
                Come Back Later
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // WELCOME
  if (stage === STAGES.WELCOME) {
    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Let's Get Testing</h1>
            <div className="welcome-message animated-text">
              <p>Testing is all about one thing:</p>
              <p><strong>Is the transformation real?</strong></p>
              <p style={{ marginTop: '16px', color: 'rgba(255,255,255,0.7)' }}>
                If it is, it solves the problem and people will pay for it.
              </p>
              <p style={{ marginTop: '24px' }}>
                Let's make sure you're set up to test with real people.
              </p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.READY_CHECK)}>
            Let's Do It
          </button>
          <button
            className="go-back-link"
            onClick={() => navigate('/7-day-challenge')}
          >
            &larr; Go Back
          </button>
        </div>
      </div>
    )
  }

  // READY CHECK - Q1
  if (stage === STAGES.READY_CHECK) {
    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="question-number">Question 1</div>
          <h2 className="question-text">Do you have something ready to test?</h2>
          <p className="question-subtext">
            Something a real person can use or experience, even if it's not perfect
          </p>
          <div className="options-list">
            <button
              className="option-card"
              onClick={() => {
                setIsReadyToTest(true)
                setStage(STAGES.PRODUCT_SELECT)
              }}
            >
              <div className="option-label">Yes, I have something ready</div>
              <div className="option-description">I can show or deliver this to a tester right now</div>
            </button>
            <button
              className="option-card"
              onClick={() => {
                setIsReadyToTest(false)
                setStage(STAGES.PRODUCT_SELECT)
              }}
            >
              <div className="option-label">No, I need to build first</div>
              <div className="option-description">I need to create an MVP before I can test</div>
            </button>
          </div>
          <BackButton onClick={() => setStage(STAGES.WELCOME)} />
        </div>
      </div>
    )
  }

  // PRODUCT SELECT
  if (stage === STAGES.PRODUCT_SELECT) {
    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="question-number">Question 2</div>
          <h2 className="question-text">
            {isReadyToTest
              ? 'Which product are you testing?'
              : 'Which product do you want to build first?'}
          </h2>
          <p className="question-subtext">
            Select from your products defined in the Product Builder
          </p>

          {products.length === 0 ? (
            <div className="no-products-message">
              <p>No products found.</p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                Complete the <strong>Offer Builder</strong> first to define your products.
              </p>
              <button
                className="primary-button"
                onClick={() => navigate('/offer-builder')}
                style={{ marginTop: '24px' }}
              >
                Go to Offer Builder
              </button>
            </div>
          ) : (
            <div className="options-list">
              {products.map((product) => (
                <button
                  key={product.id}
                  className="option-card"
                  onClick={() => {
                    setSelectedProduct(product)
                    if (isReadyToTest) {
                      setStage(STAGES.TESTERS_CHECK)
                    } else {
                      setStage(STAGES.MVP_DEFINITION)
                    }
                  }}
                >
                  <div className="option-label">{product.label}</div>
                  {product.typeLabel && product.label !== product.typeLabel && (
                    <div className="option-type">{product.typeLabel}</div>
                  )}
                  <div className="option-description">{product.description}</div>
                </button>
              ))}
            </div>
          )}

          <BackButton onClick={() => setStage(STAGES.READY_CHECK)} />
        </div>
      </div>
    )
  }

  // MVP DEFINITION (Path B only)
  if (stage === STAGES.MVP_DEFINITION) {
    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="question-number">Question 3</div>
          <h2 className="question-text">What's the MVP version?</h2>
          <p className="question-subtext">
            What's the most basic version you can build in <strong>under 1 week</strong> that achieves
            or supports the transformation?
          </p>

          {problemData && (
            <div className="context-box">
              <div className="context-label">The problem you're solving:</div>
              <div className="context-text">{problemData}</div>
            </div>
          )}

          <div className="input-group">
            <textarea
              className="text-input"
              placeholder="Describe the simplest version that still delivers value..."
              value={mvpDefinition}
              onChange={(e) => setMvpDefinition(e.target.value)}
              rows={4}
            />
            <p className="input-hint">
              Think: What's the ONE thing that must work for them to experience the transformation?
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.TESTERS_CHECK)}
            disabled={!mvpDefinition.trim()}
          >
            Continue
          </button>
          <BackButton onClick={() => setStage(STAGES.PRODUCT_SELECT)} />
        </div>
      </div>
    )
  }

  // TESTERS CHECK
  if (stage === STAGES.TESTERS_CHECK) {
    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="question-number">Question {isReadyToTest ? 3 : 4}</div>
          <h2 className="question-text">
            Do you know 3-5 people who are your target audience?
          </h2>

          {personaData && (
            <div className="context-box persona-context">
              <div className="context-label">Your target audience:</div>
              <div className="context-text">
                {personaData.name || personaData}
                {personaData.description && (
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '13px', opacity: 0.8 }}>
                    {personaData.description}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="options-list">
            <button
              className="option-card"
              onClick={() => {
                setHasTesters(true)
                setStage(STAGES.TESTERS_INPUT)
              }}
            >
              <div className="option-label">Yes, I know some people</div>
              <div className="option-description">I can name 3-5 people to reach out to</div>
            </button>
            <button
              className="option-card"
              onClick={() => {
                setHasTesters(false)
                setStage(STAGES.ACCESS_PLAN)
              }}
            >
              <div className="option-label">No, I need to find testers</div>
              <div className="option-description">I'm not sure how to access my target audience</div>
            </button>
          </div>

          <BackButton onClick={() => setStage(isReadyToTest ? STAGES.PRODUCT_SELECT : STAGES.MVP_DEFINITION)} />
        </div>
      </div>
    )
  }

  // TESTERS INPUT
  if (stage === STAGES.TESTERS_INPUT) {
    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="question-number">Question {isReadyToTest ? 4 : 5}</div>
          <h2 className="question-text">Who will you test with?</h2>
          <p className="question-subtext">
            Enter 3-5 names of people you'll reach out to (first name is fine)
          </p>

          <div className="testers-inputs">
            {testers.map((tester, index) => (
              <div key={index} className="tester-input-row">
                <span className="tester-number">{index + 1}</span>
                <input
                  type="text"
                  className="tester-input"
                  placeholder={`Person ${index + 1}${index < 3 ? ' (required)' : ' (optional)'}`}
                  value={tester}
                  onChange={(e) => {
                    const newTesters = [...testers]
                    newTesters[index] = e.target.value
                    setTesters(newTesters)
                  }}
                />
              </div>
            ))}
          </div>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.SUMMARY)}
            disabled={getValidTesterCount() < 3}
          >
            Continue ({getValidTesterCount()}/3 minimum)
          </button>
          <BackButton onClick={() => setStage(STAGES.TESTERS_CHECK)} />
        </div>
      </div>
    )
  }

  // ACCESS PLAN
  if (stage === STAGES.ACCESS_PLAN) {
    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="question-container">
          <div className="question-number">Question {isReadyToTest ? 4 : 5}</div>
          <h2 className="question-text">How will you access your target audience?</h2>
          <p className="question-subtext">
            <strong>Early-customer access is essential to success.</strong> Without it, you can't test, iterate, or launch effectively.
          </p>

          <div className="access-tips">
            <p className="access-tips-title">Some ideas to consider:</p>
            <ul>
              <li>Online communities where they hang out (Facebook groups, Reddit, Discord)</li>
              <li>Social media hashtags or accounts they follow</li>
              <li>Professional networks or associations</li>
              <li>Friends of friends who fit the profile</li>
              <li>Local meetups or events</li>
              <li>Cold outreach via LinkedIn or email</li>
            </ul>
          </div>

          <div className="input-group">
            <textarea
              className="text-input"
              placeholder="How will you find and reach 3-5 people who fit your target audience?"
              value={accessPlan}
              onChange={(e) => setAccessPlan(e.target.value)}
              rows={4}
            />
          </div>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.SUMMARY)}
            disabled={!accessPlan.trim()}
          >
            Continue
          </button>
          <BackButton onClick={() => setStage(STAGES.TESTERS_CHECK)} />
        </div>
      </div>
    )
  }

  // SUMMARY
  if (stage === STAGES.SUMMARY) {
    const validTesters = testers.filter(t => t.trim())

    return (
      <div className="mvp-readiness-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="summary-container">
          <h1 className="summary-title">Your Testing Brief</h1>

          <div className="summary-card">
            <div className="summary-section">
              <div className="summary-label">Status</div>
              <div className="summary-value">
                <span className={`status-badge ${isReadyToTest ? 'ready' : 'building'}`}>
                  {isReadyToTest ? '✓ Ready to Test' : '🔨 Building MVP First'}
                </span>
              </div>
            </div>

            <div className="summary-section">
              <div className="summary-label">Product</div>
              <div className="summary-value">
                <strong>{selectedProduct?.label}</strong>
                {selectedProduct?.typeLabel && selectedProduct?.label !== selectedProduct?.typeLabel && (
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'rgba(251, 191, 36, 0.8)' }}>
                    ({selectedProduct.typeLabel})
                  </span>
                )}
                <p className="summary-description">{selectedProduct?.description}</p>
              </div>
            </div>

            {!isReadyToTest && mvpDefinition && (
              <div className="summary-section">
                <div className="summary-label">MVP Definition</div>
                <div className="summary-value mvp-text">{mvpDefinition}</div>
              </div>
            )}

            <div className="summary-section">
              <div className="summary-label">
                {hasTesters ? 'Your Testers' : 'Your Access Plan'}
              </div>
              <div className="summary-value">
                {hasTesters ? (
                  <ul className="testers-list">
                    {validTesters.map((tester, i) => (
                      <li key={i}>{tester}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="summary-description">{accessPlan}</p>
                )}
              </div>
            </div>
          </div>

          <div className="next-steps-card">
            <h3>Next Steps</h3>
            <ol>
              {!isReadyToTest && <li>Build your MVP (target: under 1 week)</li>}
              {hasTesters ? (
                <>
                  <li>Reach out to your {validTesters.length} testers this week</li>
                  <li>Schedule time for them to try your product</li>
                  <li>Watch them use it (don't help, just observe)</li>
                  <li>Ask what would make it better</li>
                </>
              ) : (
                <>
                  <li>Execute your access plan this week</li>
                  <li>Aim to connect with 3-5 potential testers</li>
                  <li>Come back here once you have names</li>
                </>
              )}
            </ol>
          </div>

          {error && <p className="error-message">{error}</p>}

          {showResults ? (
            <button
              className="primary-button"
              onClick={() => navigate('/7-day-challenge')}
            >
              Back to 7-Day Challenge
            </button>
          ) : (
            <>
              <button
                className="primary-button"
                onClick={handleSaveResults}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save & Complete Quest (+6 pts)'}
              </button>
              <p style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Saves your testing brief and completes this quest
              </p>
            </>
          )}

          <BackButton onClick={() => setStage(hasTesters ? STAGES.TESTERS_INPUT : STAGES.ACCESS_PLAN)} />
        </div>
      </div>
    )
  }

  // SUCCESS
  if (stage === STAGES.SUCCESS) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    return (
      <div className="mvp-readiness-flow">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Ready to Test, {userName}!</h2>
          <p style={{ marginBottom: '8px' }}>Your testing brief is saved.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+6 points earned!</p>

          <div className="success-reminder">
            <p><strong>Remember:</strong></p>
            <p>Testing is all about one question: <em>Is the transformation real?</em></p>
            <p style={{ marginTop: '8px', color: 'rgba(255,255,255,0.7)' }}>
              If it is, people will pay. If not, you'll know exactly what to fix.
            </p>
          </div>

          {testersSyncResult && testersSyncResult.created > 0 && (
            <div className="crm-sync-notice">
              <span className="sync-icon">📋</span>
              <span>
                {testersSyncResult.created} tester{testersSyncResult.created === 1 ? '' : 's'} added to your CRM contacts
              </span>
            </div>
          )}

          <FlowFeedback flowType="mvp_readiness" userId={user?.id} />

          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
            style={{ marginTop: '24px' }}
          >
            Return to 7-Day Challenge
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default MVPReadinessFlow
