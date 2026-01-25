// src/components/crm/WeeklyPlanningFlow.jsx
// Main orchestrator for weekly planning flow (modal)

import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import {
  saveWeeklyPlan,
  hasCurrentWeekPlan,
  shouldShowWeeklyPlanning,
  getPlanningWeekStart
} from '../../lib/crm/weeklyPlanningService'
import { saveReflection } from '../../lib/crm/reflectionService'
import WeeklyReflection from './WeeklyReflection'
import PhaseSelector from './PhaseSelector'
import TaskMenuPicker from './TaskMenuPicker'
import WeekPlanSummary from './WeekPlanSummary'
import './WeeklyPlanningFlow.css'

const STEPS = {
  REFLECTION: 'reflection',
  PHASES: 'phases',
  TASKS: 'tasks',
  SUMMARY: 'summary'
}

export default function WeeklyPlanningFlow({ isOpen, onClose, onComplete }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(STEPS.REFLECTION)
  const [saving, setSaving] = useState(false)

  // Collected data
  const [reflectionData, setReflectionData] = useState(null)
  const [activePhases, setActivePhases] = useState([])
  const [tasks, setTasks] = useState([])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(STEPS.REFLECTION)
      setReflectionData(null)
      setActivePhases([])
      setTasks([])
    }
  }, [isOpen])

  // Get week label for header
  const weekStart = getPlanningWeekStart()
  const weekLabel = new Date(weekStart + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  // Handle reflection complete
  const handleReflectionComplete = (data) => {
    setReflectionData(data)
    setCurrentStep(STEPS.PHASES)
  }

  // Handle skip reflection
  const handleSkipReflection = () => {
    setCurrentStep(STEPS.PHASES)
  }

  // Handle phase selection
  const handlePhasesComplete = (phases) => {
    setActivePhases(phases)
    setCurrentStep(STEPS.TASKS)
  }

  // Handle task selection
  const handleTasksComplete = (selectedTasks) => {
    setTasks(selectedTasks)
    setCurrentStep(STEPS.SUMMARY)
  }

  // Handle start week (save everything)
  const handleStartWeek = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Save reflection if we have it
      if (reflectionData) {
        await saveReflection(user.id, reflectionData)
      }

      // Save weekly plan
      const plan = await saveWeeklyPlan(user.id, {
        activePhases,
        tasks
      })

      onComplete?.(plan)
      onClose?.()
    } catch (error) {
      console.error('Error saving weekly plan:', error)
    }
    setSaving(false)
  }

  // Navigation
  const goBack = () => {
    switch (currentStep) {
      case STEPS.PHASES:
        setCurrentStep(STEPS.REFLECTION)
        break
      case STEPS.TASKS:
        setCurrentStep(STEPS.PHASES)
        break
      case STEPS.SUMMARY:
        setCurrentStep(STEPS.TASKS)
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="weekly-planning-modal-overlay" onClick={onClose}>
      <div className="weekly-planning-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
          <h2 className="modal-title">Plan Your Week</h2>
          <span className="week-label">Week of {weekLabel}</span>
        </div>

        {/* Progress Indicator */}
        <div className="step-progress">
          <div className={`step-dot ${currentStep === STEPS.REFLECTION ? 'active' : ''} ${[STEPS.PHASES, STEPS.TASKS, STEPS.SUMMARY].includes(currentStep) ? 'complete' : ''}`} />
          <div className={`step-dot ${currentStep === STEPS.PHASES ? 'active' : ''} ${[STEPS.TASKS, STEPS.SUMMARY].includes(currentStep) ? 'complete' : ''}`} />
          <div className={`step-dot ${currentStep === STEPS.TASKS ? 'active' : ''} ${currentStep === STEPS.SUMMARY ? 'complete' : ''}`} />
          <div className={`step-dot ${currentStep === STEPS.SUMMARY ? 'active' : ''}`} />
        </div>

        {/* Content */}
        <div className="modal-content">
          {currentStep === STEPS.REFLECTION && (
            <WeeklyReflection
              userId={user?.id}
              onComplete={handleReflectionComplete}
              onSkip={handleSkipReflection}
            />
          )}

          {currentStep === STEPS.PHASES && (
            <PhaseSelector
              value={activePhases}
              onChange={setActivePhases}
              onContinue={handlePhasesComplete}
              onBack={goBack}
            />
          )}

          {currentStep === STEPS.TASKS && (
            <TaskMenuPicker
              activePhases={activePhases}
              value={tasks}
              onChange={setTasks}
              onContinue={handleTasksComplete}
              onBack={goBack}
            />
          )}

          {currentStep === STEPS.SUMMARY && (
            <WeekPlanSummary
              activePhases={activePhases}
              tasks={tasks}
              flowDirection={reflectionData?.flowDirection}
              onStartWeek={handleStartWeek}
              onBack={goBack}
            />
          )}
        </div>

        {/* Saving overlay */}
        {saving && (
          <div className="saving-overlay">
            <div className="saving-spinner" />
            <p>Saving your plan...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Hook to check if planning flow should show
export function useWeeklyPlanningPrompt() {
  const { user } = useAuth()
  const [shouldShow, setShouldShow] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!user) {
      setChecked(true)
      return
    }

    const checkPlan = async () => {
      // First check if it's the right time
      if (!shouldShowWeeklyPlanning()) {
        setShouldShow(false)
        setChecked(true)
        return
      }

      // Then check if plan already exists
      const hasPlan = await hasCurrentWeekPlan(user.id)
      setShouldShow(!hasPlan)
      setChecked(true)
    }

    checkPlan()
  }, [user])

  return { shouldShow, checked }
}
