// src/components/crm/ContentPlanningFlow.jsx
// Main orchestrator for the content planning flow

import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import {
  getActivePhases,
  createContentPlan,
  getCurrentContentPlan,
  updateContentPlan
} from '../../lib/crm/contentPlanningService'
import ContentTypeSelector from './ContentTypeSelector'
import ContentContextInput from './ContentContextInput'
import ContentPlanSummary from './ContentPlanSummary'
import './ContentPlanningFlow.css'

const STEPS = {
  SELECT: 'select',
  CONTEXT: 'context',
  SUMMARY: 'summary'
}

export default function ContentPlanningFlow({ onComplete, onClose }) {
  const { user } = useAuth()
  const [step, setStep] = useState(STEPS.SELECT)
  const [activePhases, setActivePhases] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingPlan, setExistingPlan] = useState(null)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get active phases from weekly plan
      const phases = await getActivePhases(user.id)
      setActivePhases(phases)

      // Check for existing content plan
      const plan = await getCurrentContentPlan(user.id)
      if (plan) {
        setExistingPlan(plan)
        // Convert stored items back to selection format
        const items = plan.items.map(item => ({
          id: item.id,
          type: item.content_type,
          label: item.label,
          icon: item.icon,
          phase: item.phase,
          context: item.context,
          isCustom: item.content_type === 'custom',
          status: item.status,
          generated_content: item.generated_content
        }))
        setSelectedItems(items)
      }
    } catch (err) {
      console.error('Error loading content planning data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleContentSelected = (items) => {
    setSelectedItems(items)
    setStep(STEPS.CONTEXT)
  }

  const handleContextComplete = (items) => {
    setSelectedItems(items)
    setStep(STEPS.SUMMARY)
  }

  const handleBack = () => {
    if (step === STEPS.CONTEXT) {
      setStep(STEPS.SELECT)
    } else if (step === STEPS.SUMMARY) {
      setStep(STEPS.CONTEXT)
    }
  }

  const handleConfirm = async (items) => {
    if (!user) return

    setSaving(true)
    try {
      let result
      if (existingPlan) {
        // Update existing plan
        result = await updateContentPlan(user.id, existingPlan.id, items)
      } else {
        // Create new plan
        result = await createContentPlan(user.id, items)
      }

      if (result) {
        onComplete?.(result)
      }
    } catch (err) {
      console.error('Error saving content plan:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleEditItem = (item, index) => {
    // Jump to context step at specific item
    // For now, just go to context step - could enhance to start at specific index
    setStep(STEPS.CONTEXT)
  }

  if (loading) {
    return (
      <div className="content-planning-flow">
        <div className="planning-loading">
          <div className="spinner" />
          <p>Loading your content plan...</p>
        </div>
      </div>
    )
  }

  if (activePhases.length === 0) {
    return (
      <div className="content-planning-flow">
        <div className="no-phases-message">
          <span className="message-emoji">📅</span>
          <h3>Set Up Your Week First</h3>
          <p>Before planning content, set your active phases in the weekly planning flow.</p>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="content-planning-flow">
      {/* Progress Steps */}
      <div className="planning-steps">
        <div className={`step-dot ${step === STEPS.SELECT ? 'active' : ''} ${step !== STEPS.SELECT ? 'completed' : ''}`}>
          1
        </div>
        <div className="step-line" />
        <div className={`step-dot ${step === STEPS.CONTEXT ? 'active' : ''} ${step === STEPS.SUMMARY ? 'completed' : ''}`}>
          2
        </div>
        <div className="step-line" />
        <div className={`step-dot ${step === STEPS.SUMMARY ? 'active' : ''}`}>
          3
        </div>
      </div>

      {/* Step Content */}
      {step === STEPS.SELECT && (
        <ContentTypeSelector
          activePhases={activePhases}
          value={selectedItems}
          onChange={setSelectedItems}
          onContinue={handleContentSelected}
          onBack={onClose}
        />
      )}

      {step === STEPS.CONTEXT && (
        <ContentContextInput
          items={selectedItems}
          onChange={setSelectedItems}
          onComplete={handleContextComplete}
          onBack={handleBack}
        />
      )}

      {step === STEPS.SUMMARY && (
        <ContentPlanSummary
          items={selectedItems}
          onConfirm={handleConfirm}
          onBack={handleBack}
          onEditItem={handleEditItem}
        />
      )}

      {/* Saving Overlay */}
      {saving && (
        <div className="saving-overlay">
          <div className="spinner" />
          <p>Saving your content plan...</p>
        </div>
      )}
    </div>
  )
}
