/**
 * Voice Training Flow
 * Captures user's unique voice through contextual questions + content analysis
 *
 * Two paths:
 * 1. Quick Path: Select a voice template (pre-fills influences + preferences)
 * 2. Full Path: 7-step voice training journey
 *
 * Step order (Smart Bridge):
 * 1. Your Writing (samples) — was Step 6
 * 2. Your Influences (NEW)
 * 3. Your Story — was Step 1
 * 4. Your People — was Step 2
 * 5. Your Difference — was Step 4
 * 6. Your Style (sliders demoted) — was Step 5
 * 7. Voice Generation — unchanged
 *
 * Features:
 * - Auto-save progress to localStorage
 * - Step transition animations
 * - Voice preview at generation
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { fetchVoiceProfile, saveVoiceTemplate, VOICE_TEMPLATES } from '../../lib/voiceProfile'

// Components
import Welcome from './components/Welcome'
import VoiceTemplates from './components/VoiceTemplates'
import Step1_Writing from './components/Step1_Writing'
import Step2_Influences from './components/Step2_Influences'
import Step3_Story from './components/Step3_Story'
import Step4_Audience from './components/Step4_Audience'
import Step5_Difference from './components/Step5_Difference'
import Step6_Style from './components/Step6_Style'
import Step7_Generation from './components/Step7_Generation'
import VoiceProfileCard from './components/VoiceProfileCard'

import './VoiceTraining.css'

// Auto-save key for localStorage
const AUTOSAVE_KEY = 'voice_training_progress'

const STAGES = {
  WELCOME: 'welcome',
  TEMPLATES: 'templates',
  STEP_1: 'step_1',
  STEP_2: 'step_2',
  STEP_3: 'step_3',
  STEP_4: 'step_4',
  STEP_5: 'step_5',
  STEP_6: 'step_6',
  STEP_7: 'step_7',
  COMPLETE: 'complete'
}

const STEP_LABELS = {
  [STAGES.STEP_1]: { num: 1, title: 'Your Writing' },
  [STAGES.STEP_2]: { num: 2, title: 'Your Influences' },
  [STAGES.STEP_3]: { num: 3, title: 'Your Story' },
  [STAGES.STEP_4]: { num: 4, title: 'Your People' },
  [STAGES.STEP_5]: { num: 5, title: 'Your Difference' },
  [STAGES.STEP_6]: { num: 6, title: 'Your Style' },
  [STAGES.STEP_7]: { num: 7, title: 'Voice Generation' }
}

// Default voice data structure
const DEFAULT_VOICE_DATA = {
  originStory: '',
  audienceDescription: '',
  uniqueApproach: '',
  preferences: {
    sentenceLength: 50,
    emojiUsage: 40,
    humorLevel: 50,
    formalityLevel: 40,
    vulnerabilityLevel: 50
  },
  catchphrases: [],
  contentSamples: [],
  voiceInfluences: [],
  skipSamples: false
}

export default function VoiceTraining() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stage, setStage] = useState(STAGES.WELCOME)
  const [loading, setLoading] = useState(true)
  const [existingProfile, setExistingProfile] = useState(null)
  const [hasSavedProgress, setHasSavedProgress] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const isInitialized = useRef(false)

  // Voice training data collected through steps
  const [voiceData, setVoiceData] = useState(DEFAULT_VOICE_DATA)

  // Generated voice profile
  const [generatedProfile, setGeneratedProfile] = useState(null)

  // Load saved progress from localStorage
  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY)
      if (saved) {
        const { stage: savedStage, voiceData: savedData, timestamp } = JSON.parse(saved)
        // Only restore if saved within last 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        if (timestamp > sevenDaysAgo && savedStage && savedData) {
          return { stage: savedStage, voiceData: savedData }
        }
      }
    } catch (e) {
      console.error('Error loading saved progress:', e)
    }
    return null
  }

  // Save progress to localStorage
  const saveProgress = (currentStage, currentData) => {
    // Only save during training steps (not welcome, templates, or complete)
    const trainingStages = [STAGES.STEP_1, STAGES.STEP_2, STAGES.STEP_3, STAGES.STEP_4, STAGES.STEP_5, STAGES.STEP_6]
    if (trainingStages.includes(currentStage)) {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
          stage: currentStage,
          voiceData: currentData,
          timestamp: Date.now()
        }))
      } catch (e) {
        console.error('Error saving progress:', e)
      }
    }
  }

  // Clear saved progress
  const clearSavedProgress = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY)
      setHasSavedProgress(false)
    } catch (e) {
      console.error('Error clearing progress:', e)
    }
  }

  // Check for existing profile and saved progress on load
  useEffect(() => {
    async function initialize() {
      if (!user?.id || isInitialized.current) return
      isInitialized.current = true

      setLoading(true)

      // Check for existing completed profile
      const { data } = await fetchVoiceProfile(user.id)

      if (data) {
        setExistingProfile(data)
        setStage(STAGES.COMPLETE)
        clearSavedProgress() // Clear any saved progress if profile exists
      } else {
        // Check for saved progress
        const savedProgress = loadSavedProgress()
        if (savedProgress) {
          setHasSavedProgress(true)
        }
      }

      setLoading(false)
    }

    initialize()
  }, [user?.id])

  // Auto-save when voiceData or stage changes
  useEffect(() => {
    if (!loading && isInitialized.current) {
      saveProgress(stage, voiceData)
    }
  }, [stage, voiceData, loading])

  // Update voice data helper
  const updateVoiceData = (updates) => {
    setVoiceData(prev => ({ ...prev, ...updates }))
  }

  // Handle template selection — pre-fills influences + preferences, jumps to Step 1
  const handleTemplateSelect = (templateId) => {
    const template = VOICE_TEMPLATES[templateId]
    if (!template) return

    // Pre-fill influences from template inspiration
    const influenceNames = (template.inspiration || '').split(', ').filter(Boolean)
    const influences = influenceNames.map(name => ({
      name,
      description: template.description || '',
      snippets: [],
      confirmed: false
    }))

    updateVoiceData({
      voiceInfluences: influences,
      preferences: {
        sentenceLength: template.settings?.sentence_length ?? 50,
        emojiUsage: template.settings?.emoji_usage ?? 40,
        humorLevel: template.settings?.humor_level ?? 50,
        formalityLevel: template.settings?.formality_level ?? 40,
        vulnerabilityLevel: template.settings?.vulnerability_level ?? 50
      },
      catchphrases: template.signature_phrases || []
    })

    // Jump to step 1 (writing) — user still provides their own samples
    animateToStage(STAGES.STEP_1)
  }

  // Animate stage transition
  const animateToStage = (newStage) => {
    setIsAnimating(true)
    setTimeout(() => {
      setStage(newStage)
      setTimeout(() => setIsAnimating(false), 50)
    }, 150)
  }

  // Navigate to next step with animation
  const goNext = () => {
    const stageOrder = [
      STAGES.WELCOME,
      STAGES.TEMPLATES,
      STAGES.STEP_1,
      STAGES.STEP_2,
      STAGES.STEP_3,
      STAGES.STEP_4,
      STAGES.STEP_5,
      STAGES.STEP_6,
      STAGES.STEP_7,
      STAGES.COMPLETE
    ]
    const currentIndex = stageOrder.indexOf(stage)
    if (currentIndex < stageOrder.length - 1) {
      animateToStage(stageOrder[currentIndex + 1])
    }
  }

  // Navigate to previous step with animation
  const goBack = () => {
    const stageOrder = [
      STAGES.WELCOME,
      STAGES.TEMPLATES,
      STAGES.STEP_1,
      STAGES.STEP_2,
      STAGES.STEP_3,
      STAGES.STEP_4,
      STAGES.STEP_5,
      STAGES.STEP_6,
      STAGES.STEP_7
    ]
    const currentIndex = stageOrder.indexOf(stage)
    if (currentIndex > 0) {
      animateToStage(stageOrder[currentIndex - 1])
    }
  }

  // Start full training (from templates page)
  const startFullTraining = () => {
    animateToStage(STAGES.STEP_1)
  }

  // Resume saved progress
  const handleResumeProgress = () => {
    const savedProgress = loadSavedProgress()
    if (savedProgress) {
      setVoiceData(savedProgress.voiceData)
      setHasSavedProgress(false)
      animateToStage(savedProgress.stage)
    }
  }

  // Discard saved progress
  const handleDiscardProgress = () => {
    clearSavedProgress()
  }

  // Handle profile generation complete
  const handleGenerationComplete = (profile) => {
    setGeneratedProfile(profile)
    setExistingProfile(profile)
    clearSavedProgress()
    animateToStage(STAGES.COMPLETE)
  }

  // Edit existing profile
  const handleEditProfile = () => {
    // Pre-fill voiceData from existing profile
    if (existingProfile) {
      setVoiceData({
        originStory: existingProfile.origin_story || '',
        audienceDescription: existingProfile.audience_description || '',
        uniqueApproach: existingProfile.unique_approach || '',
        preferences: {
          sentenceLength: existingProfile.sentence_length || 50,
          emojiUsage: existingProfile.emoji_usage || 40,
          humorLevel: existingProfile.humor_level || 50,
          formalityLevel: existingProfile.formality_level || 40,
          vulnerabilityLevel: existingProfile.vulnerability_level || 50
        },
        catchphrases: existingProfile.catchphrases || [],
        contentSamples: existingProfile.content_samples || [],
        voiceInfluences: existingProfile.voice_influences || [],
        skipSamples: false
      })
    }
    animateToStage(STAGES.STEP_1)
  }

  // Reset and start fresh
  const handleStartFresh = () => {
    setVoiceData({ ...DEFAULT_VOICE_DATA })
    clearSavedProgress()
    animateToStage(STAGES.TEMPLATES)
  }

  // Get current step info
  const currentStepInfo = STEP_LABELS[stage]
  const totalSteps = 7

  if (loading) {
    return (
      <div className="voice-training">
        <div className="vt-loading">
          <div className="vt-spinner"></div>
          <p>Loading voice profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="voice-training">
      {/* Resume Banner */}
      {hasSavedProgress && stage === STAGES.WELCOME && (
        <div className="vt-resume-banner">
          <div className="vt-resume-content">
            <span className="vt-resume-icon">📝</span>
            <div className="vt-resume-text">
              <strong>Resume your progress?</strong>
              <span>You have unsaved voice training in progress</span>
            </div>
          </div>
          <div className="vt-resume-actions">
            <button className="vt-resume-btn" onClick={handleResumeProgress}>
              Resume
            </button>
            <button className="vt-discard-btn" onClick={handleDiscardProgress}>
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* Progress Header (for steps only) */}
      {currentStepInfo && (
        <div className="vt-progress-header">
          <button className="vt-back-btn" onClick={goBack}>
            ← Back
          </button>
          <div className="vt-step-info">
            <span className="vt-step-num">Step {currentStepInfo.num} of {totalSteps}</span>
            <span className="vt-step-title">{currentStepInfo.title}</span>
          </div>
          <div className="vt-progress-bar">
            <div
              className="vt-progress-fill"
              style={{ width: `${(currentStepInfo.num / totalSteps) * 100}%` }}
            ></div>
          </div>
          {/* Auto-save indicator */}
          <div className="vt-autosave-indicator">
            <span className="vt-autosave-dot"></span>
            Auto-saved
          </div>
        </div>
      )}

      {/* Stage Components with Animation Wrapper */}
      <div className={`vt-stage-wrapper ${isAnimating ? 'vt-animating' : ''}`}>
        {stage === STAGES.WELCOME && (
          <Welcome
            hasExisting={!!existingProfile}
            hasSavedProgress={hasSavedProgress}
            onContinue={() => animateToStage(STAGES.TEMPLATES)}
            onEdit={handleEditProfile}
            onBack={() => navigate(-1)}
          />
        )}

        {stage === STAGES.TEMPLATES && (
          <VoiceTemplates
            onSelectTemplate={handleTemplateSelect}
            onStartFullTraining={startFullTraining}
            onBack={() => animateToStage(STAGES.WELCOME)}
          />
        )}

        {stage === STAGES.STEP_1 && (
          <Step1_Writing
            samples={voiceData.contentSamples}
            onChangeSamples={(samples) => updateVoiceData({ contentSamples: samples })}
            onContinue={goNext}
          />
        )}

        {stage === STAGES.STEP_2 && (
          <Step2_Influences
            influences={voiceData.voiceInfluences}
            onChangeInfluences={(influences) => updateVoiceData({ voiceInfluences: influences })}
            onContinue={goNext}
          />
        )}

        {stage === STAGES.STEP_3 && (
          <Step3_Story
            value={voiceData.originStory}
            onChange={(value) => updateVoiceData({ originStory: value })}
            onContinue={goNext}
          />
        )}

        {stage === STAGES.STEP_4 && (
          <Step4_Audience
            value={voiceData.audienceDescription}
            onChange={(value) => updateVoiceData({ audienceDescription: value })}
            userId={user?.id}
            onContinue={goNext}
          />
        )}

        {stage === STAGES.STEP_5 && (
          <Step5_Difference
            value={voiceData.uniqueApproach}
            onChange={(value) => updateVoiceData({ uniqueApproach: value })}
            onContinue={goNext}
            voiceData={voiceData}
          />
        )}

        {stage === STAGES.STEP_6 && (
          <Step6_Style
            preferences={voiceData.preferences}
            catchphrases={voiceData.catchphrases}
            onChangePreferences={(prefs) => updateVoiceData({ preferences: prefs })}
            onChangeCatchphrases={(phrases) => updateVoiceData({ catchphrases: phrases })}
            onContinue={goNext}
          />
        )}

        {stage === STAGES.STEP_7 && (
          <Step7_Generation
            voiceData={voiceData}
            userId={user?.id}
            onComplete={handleGenerationComplete}
            onBack={goBack}
          />
        )}

        {stage === STAGES.COMPLETE && (
          <VoiceProfileCard
            profile={existingProfile || generatedProfile}
            onEdit={handleEditProfile}
            onStartFresh={handleStartFresh}
            onDone={() => navigate('/crm/marketing')}
          />
        )}
      </div>
    </div>
  )
}
