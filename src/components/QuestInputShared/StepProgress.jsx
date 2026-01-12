/**
 * StepProgress - Step progress indicator for multi-step forms
 *
 * Shows current step number and title in quest input forms.
 */

import './StepProgress.css'

/**
 * @param {Object} props
 * @param {number} props.currentStep - Current step number (1-indexed)
 * @param {number} props.totalSteps - Total number of steps
 * @param {string} [props.stepTitle] - Optional title for current step
 * @param {string} [props.variant] - Visual variant: 'text' | 'dots' | 'bar'
 */
function StepProgress({
  currentStep,
  totalSteps,
  stepTitle,
  variant = 'text'
}) {
  if (variant === 'dots') {
    return (
      <div className="step-progress step-progress--dots">
        <div className="step-dots">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={`step-dot ${i + 1 <= currentStep ? 'active' : ''} ${i + 1 === currentStep ? 'current' : ''}`}
            />
          ))}
        </div>
        {stepTitle && (
          <span className="step-title">{stepTitle}</span>
        )}
      </div>
    )
  }

  if (variant === 'bar') {
    const progress = (currentStep / totalSteps) * 100
    return (
      <div className="step-progress step-progress--bar">
        <div className="step-bar-container">
          <div
            className="step-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="step-text">
          Step {currentStep} of {totalSteps}{stepTitle ? `: ${stepTitle}` : ''}
        </span>
      </div>
    )
  }

  // Default: text variant
  return (
    <div className="step-progress step-progress--text">
      <span className="step-text">
        Step {currentStep} of {totalSteps}{stepTitle ? `: ${stepTitle}` : ''}
      </span>
    </div>
  )
}

export default StepProgress
