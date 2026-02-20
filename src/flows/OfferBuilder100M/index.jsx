/**
 * OfferBuilder100M - $100M Offer Builder based on Hormozi framework
 *
 * 8-step flow that creates a "Grand Slam Offer" with 3 parallel versions
 * (Service/Productized/Product) for comparison and final selection.
 *
 * Steps:
 * 1A: Offer Selection (choose which V1 offer to build on)
 * 1B: Summary Review (review V1 foundation data)
 * 2:  Dream Outcome (bucket-specific, AI validated)
 * 3:  Generate 3 Versions (Service/Productized/Product)
 * 4:  Proof Stack Builder (for all 3)
 * 5:  Speed Advantage Calculator (for all 3)
 * 6:  Ease Factor Builder (for all 3)
 * 7:  Obstacles → Bonuses (for all 3)
 * 8:  Final Selection (compare + choose)
 * 9:  Grand Slam Score + Stack Slide
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/AuthProvider'
import { BackButton, ProgressDots } from '../../components/MoneyModelShared'
import { getValidationObstaclesForOfferBuilder } from '../../lib/validationObstacles'

// Step Components
import Welcome from './components/Welcome'
import Step1A_OfferSelection from './components/Step1A_OfferSelection'
import Step1B_SummaryReview from './components/Step1B_SummaryReview'
import Step2_DreamOutcome from './components/Step1B_DreamOutcome' // Renamed to Step2
import Step3_VersionSelection from './components/Step3_VersionSelection'
import Step3_ProofStack from './components/Step3_ProofStack'
import Step4_SpeedAdvantage from './components/Step4_SpeedAdvantage'
import Step5_EaseFactor from './components/Step5_EaseFactor'
import Step6_Obstacles from './components/Step6_Obstacles'
import Step6_Bonuses from './components/Step6_Bonuses'
import Step7_FinalSelection from './components/Step7_FinalSelection'
import Step8_GrandSlam from './components/Step8_GrandSlam'
import Success from './components/Success'

import './OfferBuilder100M.css'

// Flow stages
const STAGES = {
  TIME_CHECK: 'time_check',
  WELCOME: 'welcome',
  STEP_1A: 'step_1a',    // Offer Selection
  STEP_1B: 'step_1b',    // Summary Review
  STEP_2: 'step_2',      // Dream Outcome
  STEP_3: 'step_3',      // Generate Versions
  STEP_4: 'step_4',      // Proof Stack
  STEP_5: 'step_5',      // Speed Advantage
  STEP_6: 'step_6',      // Ease Factor
  STEP_7A: 'step_7a',    // Obstacles
  STEP_7B: 'step_7b',    // Bonuses
  STEP_8: 'step_8',      // Final Selection
  STEP_9: 'step_9',      // Grand Slam Score
  SUCCESS: 'success'
}

// Step numbers for progress indicator
const STEP_NUMBERS = {
  [STAGES.STEP_1A]: 1,
  [STAGES.STEP_1B]: 1,
  [STAGES.STEP_2]: 2,
  [STAGES.STEP_3]: 3,
  [STAGES.STEP_4]: 4,
  [STAGES.STEP_5]: 5,
  [STAGES.STEP_6]: 6,
  [STAGES.STEP_7A]: 7,
  [STAGES.STEP_7B]: 7,
  [STAGES.STEP_8]: 8,
  [STAGES.STEP_9]: 9
}

function OfferBuilder100M() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const projectId = searchParams.get('project')

  // Core state
  const [stage, setStage] = useState(STAGES.TIME_CHECK)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Offer creation data (includes all step state for back/forth navigation)
  const [offerData, setOfferData] = useState({
    // V1 Foundation (from Offer Builder)
    selectedOffer: null,        // Full V1 offer data
    selectedOfferId: null,      // V1 offer ID for linking
    bucket: null,               // Derived from V1 problem_area
    // Dream Outcome
    dreamOutcome: '',
    dreamOutcomeScore: null,
    // 3 Versions (only selected types will be populated)
    versions: {
      service: null,
      productized: null,
      product: null
    },
    selectedVersionTypes: [], // Which version types user chose to build
    // Proof Stack
    proofData: null,
    proofAnalysis: null,
    // Speed
    speedData: null,
    speedAnalysis: null,
    // Ease
    easeData: null,
    easeAnalysis: null,
    // Obstacles & Bonuses
    obstacles: [],
    bonuses: {
      service: [],
      productized: [],
      product: []
    },
    bonusSuggestions: null,
    selectedBonuses: null,
    // Final Selection
    selectedVersion: null,
    grandSlamScore: null,
    stackSlide: null
  })

  // Context data from other flows (supplementary data, not the V1 offer itself)
  const [contextData, setContextData] = useState({
    skills: [],
    problems: [],
    persona: null,
    validationData: null
  })

  // Resume prompt state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgress, setSavedProgress] = useState(null)

  // Load existing offer and context data
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        // Load any existing offer creation
        const { data: existingOffer } = await supabase
          .from('offer_creations')
          .select('*')
          .eq('user_id', user.id)
          .eq('project_id', projectId || user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existingOffer && existingOffer.status !== 'completed') {
          // Resume from saved progress
          setSavedProgress(existingOffer)
          setShowResumePrompt(true)
        }

        // Load supplementary context from other flows
        // Note: V1 offer selection is handled by Step1A_OfferSelection
        const [skillsRes, problemsRes, personaRes, validationObstacles] = await Promise.all([
          supabase
            .from('nikigai_clusters')
            .select('cluster_data')
            .eq('user_id', user.id)
            .eq('cluster_type', 'skills')
            .single(),
          supabase
            .from('nikigai_clusters')
            .select('cluster_data')
            .eq('user_id', user.id)
            .eq('cluster_type', 'problems')
            .single(),
          supabase
            .from('persona_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          // Fetch validation obstacles using the new helper (project-scoped)
          getValidationObstaclesForOfferBuilder(user.id, projectId)
        ])

        setContextData({
          skills: skillsRes.data?.cluster_data || [],
          problems: problemsRes.data?.cluster_data || [],
          persona: personaRes.data || null,
          validationData: validationObstacles
        })
      } catch (err) {
        console.error('Error loading context data:', err)
      }
    }

    loadData()
  }, [user, projectId])

  // Auto-save progress
  useEffect(() => {
    if (!user || stage === STAGES.TIME_CHECK || stage === STAGES.SUCCESS) return

    const saveProgress = async () => {
      const progressData = {
        user_id: user.id,
        project_id: projectId || user.id,
        current_step: stage,
        dream_outcome_bucket: offerData.bucket,
        dream_outcome: offerData.dreamOutcome,
        dream_outcome_score: offerData.dreamOutcomeScore,
        version_product: offerData.versions.product,
        version_service: offerData.versions.service,
        version_productized: offerData.versions.productized,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      }

      try {
        await supabase
          .from('offer_creations')
          .upsert(progressData, { onConflict: 'user_id,project_id' })
      } catch (err) {
        console.error('Error saving progress:', err)
      }
    }

    saveProgress()
  }, [stage, offerData, user, projectId])

  // Resume from saved progress
  const handleResume = () => {
    if (savedProgress) {
      setOfferData(prev => ({
        ...prev,
        bucket: savedProgress.dream_outcome_bucket,
        dreamOutcome: savedProgress.dream_outcome || '',
        dreamOutcomeScore: savedProgress.dream_outcome_score,
        versions: {
          product: savedProgress.version_product,
          service: savedProgress.version_service,
          productized: savedProgress.version_productized
        }
      }))
      setStage(savedProgress.current_step || STAGES.WELCOME)
    }
    setShowResumePrompt(false)
  }

  // Start fresh
  const handleStartFresh = () => {
    setShowResumePrompt(false)
    setStage(STAGES.TIME_CHECK)
  }

  // Update offer data helper
  const updateOfferData = (updates) => {
    setOfferData(prev => ({ ...prev, ...updates }))
  }

  // Navigation helpers
  const goToStage = (newStage) => setStage(newStage)

  const goBack = () => {
    const stageOrder = [
      STAGES.WELCOME,
      STAGES.STEP_1A,
      STAGES.STEP_1B,
      STAGES.STEP_2,
      STAGES.STEP_3,
      STAGES.STEP_4,
      STAGES.STEP_5,
      STAGES.STEP_6,
      STAGES.STEP_7A,
      STAGES.STEP_7B,
      STAGES.STEP_8,
      STAGES.STEP_9
    ]
    const currentIndex = stageOrder.indexOf(stage)
    if (currentIndex > 0) {
      setStage(stageOrder[currentIndex - 1])
    }
  }

  // Get current step number for progress
  const currentStep = STEP_NUMBERS[stage] || 0
  const totalSteps = 9

  // Show resume prompt
  if (showResumePrompt && savedProgress) {
    return (
      <div className="offer-builder-100m">
        <div className="resume-prompt">
          <div className="time-icon">⏱️</div>
          <h2>Welcome back!</h2>
          <p>You have an offer in progress.</p>
          <p className="resume-details">
            Last step: {savedProgress.current_step?.replace('step_', 'Step ').toUpperCase()}
            {savedProgress.dream_outcome && (
              <><br />Dream: "{savedProgress.dream_outcome.slice(0, 50)}..."</>
            )}
          </p>
          <div className="resume-buttons">
            <button className="primary-button" onClick={handleResume}>
              Continue Where I Left Off
            </button>
            <button className="secondary-button" onClick={handleStartFresh}>
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Time check screen
  if (stage === STAGES.TIME_CHECK) {
    return (
      <div className="offer-builder-100m">
        <div className="time-check">
          <div className="time-icon">⏱️</div>
          <h2>Ready to build your Grand Slam Offer?</h2>
          <p>This takes about <strong>20-25 minutes</strong> to complete properly.</p>
          <p className="time-tip">Set aside focused time. Your offer is the foundation of everything.</p>
          <button
            className="primary-button"
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
        </div>
      </div>
    )
  }

  return (
    <div className="offer-builder-100m">
      {/* Progress indicator for steps */}
      {currentStep > 0 && (
        <div className="progress-header">
          <BackButton onClick={goBack} />
          <div className="step-indicator">
            Step {currentStep} of {totalSteps}
          </div>
          <ProgressDots current={currentStep} total={totalSteps} />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {/* Stage components */}
      {stage === STAGES.WELCOME && (
        <Welcome
          onContinue={() => goToStage(STAGES.STEP_1A)}
        />
      )}

      {/* Step 1A: Offer Selection */}
      {stage === STAGES.STEP_1A && (
        <Step1A_OfferSelection
          onSelect={(selectedOffer, bucket) => {
            updateOfferData({
              selectedOffer,
              selectedOfferId: selectedOffer.id,
              bucket
            })
            goToStage(STAGES.STEP_1B)
          }}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {/* Step 1B: Summary Review */}
      {stage === STAGES.STEP_1B && (
        <Step1B_SummaryReview
          selectedOffer={offerData.selectedOffer}
          bucket={offerData.bucket}
          onConfirm={() => goToStage(STAGES.STEP_2)}
          onBack={() => goToStage(STAGES.STEP_1A)}
        />
      )}

      {/* Step 2: Dream Outcome */}
      {stage === STAGES.STEP_2 && (
        <Step2_DreamOutcome
          bucket={offerData.bucket}
          contextData={{
            ...contextData,
            offerBuilderData: offerData.selectedOffer // Pass V1 data for context
          }}
          initialData={{ dreamOutcome: offerData.dreamOutcome }}
          onComplete={(dreamOutcome, score) => {
            updateOfferData({ dreamOutcome, dreamOutcomeScore: score })
            goToStage(STAGES.STEP_3)
          }}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {/* Step 3: Version Selection & Generation */}
      {stage === STAGES.STEP_3 && (
        <Step3_VersionSelection
          bucket={offerData.bucket}
          dreamOutcome={offerData.dreamOutcome}
          contextData={{
            ...contextData,
            offerBuilderData: offerData.selectedOffer
          }}
          onComplete={(versions, selectedTypes) => {
            updateOfferData({ versions, selectedVersionTypes: selectedTypes })
            goToStage(STAGES.STEP_4)
          }}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {/* Step 4: Proof Stack */}
      {stage === STAGES.STEP_4 && (
        <Step3_ProofStack
          dreamOutcome={offerData.dreamOutcome}
          bucket={offerData.bucket}
          versions={offerData.versions}
          selectedVersionTypes={offerData.selectedVersionTypes}
          contextData={{
            ...contextData,
            offerBuilderData: offerData.selectedOffer
          }}
          initialData={{
            proofData: offerData.proofData,
            proofAnalysis: offerData.proofAnalysis
          }}
          onComplete={(proofResult) => {
            updateOfferData({
              proofData: proofResult.proofData,
              proofAnalysis: proofResult.analysis
            })
            goToStage(STAGES.STEP_5)
          }}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {/* Step 5: Speed Advantage */}
      {stage === STAGES.STEP_5 && (
        <Step4_SpeedAdvantage
          bucket={offerData.bucket}
          dreamOutcome={offerData.dreamOutcome}
          versions={offerData.versions}
          selectedVersionTypes={offerData.selectedVersionTypes}
          initialData={{
            speedData: offerData.speedData,
            speedAnalysis: offerData.speedAnalysis
          }}
          onComplete={(speedResult) => {
            updateOfferData({
              speedData: speedResult.speedData,
              speedAnalysis: speedResult.analysis
            })
            goToStage(STAGES.STEP_6)
          }}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {/* Step 6: Ease Factor */}
      {stage === STAGES.STEP_6 && (
        <Step5_EaseFactor
          bucket={offerData.bucket}
          dreamOutcome={offerData.dreamOutcome}
          versions={offerData.versions}
          selectedVersionTypes={offerData.selectedVersionTypes}
          initialData={{
            easeData: offerData.easeData,
            easeAnalysis: offerData.easeAnalysis
          }}
          onComplete={(easeResult) => {
            updateOfferData({
              easeData: easeResult.easeData,
              easeAnalysis: easeResult.analysis
            })
            goToStage(STAGES.STEP_7A)
          }}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {/* Step 7A: Obstacles */}
      {stage === STAGES.STEP_7A && (
        <Step6_Obstacles
          bucket={offerData.bucket}
          versions={offerData.versions}
          selectedVersionTypes={offerData.selectedVersionTypes}
          contextData={{
            ...contextData,
            offerBuilderData: offerData.selectedOffer
          }}
          initialData={{ obstacles: offerData.obstacles }}
          onComplete={(obstacles) => {
            updateOfferData({ obstacles })
            goToStage(STAGES.STEP_7B)
          }}
          setError={setError}
        />
      )}

      {/* Step 7B: Bonuses */}
      {stage === STAGES.STEP_7B && (
        <Step6_Bonuses
          obstacles={offerData.obstacles}
          dreamOutcome={offerData.dreamOutcome}
          bucket={offerData.bucket}
          versions={offerData.versions}
          selectedVersionTypes={offerData.selectedVersionTypes}
          contextData={{
            ...contextData,
            offerBuilderData: offerData.selectedOffer
          }}
          initialData={{
            bonusSuggestions: offerData.bonusSuggestions,
            selectedBonuses: offerData.selectedBonuses
          }}
          onComplete={(result) => {
            updateOfferData({
              bonuses: result.bonuses,
              bonusSuggestions: result.bonusSuggestions,
              selectedBonuses: result.selectedBonuses
            })
            goToStage(STAGES.STEP_8)
          }}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {/* Step 8: Final Selection */}
      {stage === STAGES.STEP_8 && (
        <Step7_FinalSelection
          offerData={offerData}
          contextData={{
            ...contextData,
            offerBuilderData: offerData.selectedOffer
          }}
          onComplete={(selectedVersion, score) => {
            updateOfferData({
              selectedVersion,
              grandSlamScore: score
            })
            goToStage(STAGES.STEP_9)
          }}
          setError={setError}
        />
      )}

      {/* Step 9: Grand Slam Score */}
      {stage === STAGES.STEP_9 && (
        <Step8_GrandSlam
          offerData={offerData}
          selectedVersion={offerData.selectedVersion}
          score={offerData.grandSlamScore}
          onComplete={() => goToStage(STAGES.SUCCESS)}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}

      {stage === STAGES.SUCCESS && (
        <Success
          offerName={offerData.versions?.[offerData.selectedVersion]?.name}
          score={offerData.grandSlamScore}
        />
      )}
    </div>
  )
}

export default OfferBuilder100M
