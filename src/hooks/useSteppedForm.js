/**
 * useSteppedForm - Shared hook for multi-step quest input forms
 *
 * Extracts common step navigation and form state management from:
 * - ReleaseQuestInput
 * - RecogniseQuestInput
 * - RewireQuestInput
 * - ReconnectQuestInput
 *
 * Usage:
 * const {
 *   step,
 *   formData,
 *   setFormData,
 *   isSubmitting,
 *   isReviewStep,
 *   handleNext,
 *   handleBack,
 *   handleSubmit
 * } = useSteppedForm({
 *   totalSteps: 4,
 *   initialData: { emotion: null, intensity: 3 },
 *   validateStep: (step, formData) => formData.emotion !== null,
 *   onSubmit: (formData) => { ... }
 * })
 */

import { useState, useCallback, useMemo } from 'react'

/**
 * @param {Object} config - Hook configuration
 * @param {number} config.totalSteps - Total number of steps in the form
 * @param {Object} config.initialData - Initial form data state
 * @param {Function} [config.validateStep] - Function to validate current step: (step, formData) => boolean
 * @param {Function} [config.onSubmit] - Callback when form is submitted: (formData) => void | Promise
 */
export function useSteppedForm({
  totalSteps,
  initialData = {},
  validateStep,
  onSubmit
}) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Whether current step is the final review step
  const isReviewStep = useMemo(() => step === totalSteps, [step, totalSteps])

  // Check if current step is valid and can continue
  const canContinue = useCallback(() => {
    if (!validateStep) return true
    return validateStep(step, formData)
  }, [step, formData, validateStep])

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (step < totalSteps && canContinue()) {
      setStep(prev => prev + 1)
    }
  }, [step, totalSteps, canContinue])

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }, [step])

  // Go to a specific step (useful for review step edits)
  const goToStep = useCallback((targetStep) => {
    if (targetStep >= 1 && targetStep <= totalSteps) {
      setStep(targetStep)
    }
  }, [totalSteps])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit(formData)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, isSubmitting, onSubmit])

  // Update a single field in formData
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Toggle item in an array field (for multi-select)
  const toggleArrayItem = useCallback((field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(item)
        ? prev[field].filter(i => i !== item)
        : [...(prev[field] || []), item]
    }))
  }, [])

  // Reset form to initial state
  const reset = useCallback(() => {
    setStep(1)
    setFormData(initialData)
    setIsSubmitting(false)
  }, [initialData])

  return {
    // State
    step,
    formData,
    isSubmitting,

    // Computed
    isReviewStep,
    totalSteps,

    // Validation
    canContinue,

    // Navigation
    handleNext,
    handleBack,
    goToStep,

    // Form updates
    setFormData,
    updateField,
    toggleArrayItem,

    // Submission
    handleSubmit,

    // Reset
    reset
  }
}

export default useSteppedForm
