/**
 * CRM Onboarding Tour
 * First-time walkthrough of CRM features
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './OnboardingTour.css'

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Your HQ',
    description: 'Your command center for marketing and sales. Let me show you around.',
    icon: '👋',
  },
  {
    id: 'attract',
    title: 'Attract Tower',
    description: 'Create content, landing pages, and reach new leads. Start here to grow your audience.',
    icon: '🎯',
    highlight: 'attract',
  },
  {
    id: 'execute',
    title: 'Execute Tab',
    description: 'Your weekly task manager. Plan and track what needs to get done.',
    icon: '🚀',
    highlight: 'execute',
  },
  {
    id: 'nurture',
    title: 'Nurture Tower',
    description: 'Build relationships with contacts, email sequences, and your sales pipeline.',
    icon: '💜',
    highlight: 'nurture',
  },
  {
    id: 'tools',
    title: 'Tools Tower',
    description: 'Calculators, scripts, and analytics to help you make better decisions.',
    icon: '🧰',
    highlight: 'tools',
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'Explore at your own pace. Tap any card to dive deeper.',
    icon: '✨',
  },
]

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const navigate = useNavigate()

  const step = TOUR_STEPS[currentStep]
  const isLastStep = currentStep === TOUR_STEPS.length - 1
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100

  function handleNext() {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  function handleSkip() {
    handleComplete()
  }

  function handleComplete() {
    setIsVisible(false)
    // Save that tour was completed
    localStorage.setItem('crm_onboarding_complete', 'true')
    setTimeout(() => {
      onComplete?.()
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div className={`tour-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="tour-card">
        {/* Progress bar */}
        <div className="tour-progress">
          <div className="tour-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step indicator */}
        <div className="tour-step-indicator">
          {currentStep + 1} of {TOUR_STEPS.length}
        </div>

        {/* Content */}
        <div className="tour-content">
          <div className="tour-icon">{step.icon}</div>
          <h2 className="tour-title">{step.title}</h2>
          <p className="tour-description">{step.description}</p>
        </div>

        {/* Highlight indicator */}
        {step.highlight && (
          <div className="tour-highlight-hint">
            <span className="tour-arrow">↓</span>
            Look at the {step.highlight} tab below
          </div>
        )}

        {/* Actions */}
        <div className="tour-actions">
          {!isLastStep && (
            <button className="tour-skip" onClick={handleSkip}>
              Skip tour
            </button>
          )}
          <button className="tour-next" onClick={handleNext}>
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to check if onboarding should be shown
 */
export function useCRMOnboarding() {
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('crm_onboarding_complete')
    if (!completed) {
      // Small delay before showing tour
      const timer = setTimeout(() => setShowTour(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  function completeTour() {
    setShowTour(false)
  }

  function resetTour() {
    localStorage.removeItem('crm_onboarding_complete')
    setShowTour(true)
  }

  return { showTour, completeTour, resetTour }
}
