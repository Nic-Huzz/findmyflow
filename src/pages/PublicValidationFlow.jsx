import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './PublicValidationFlow.css'

/**
 * PublicValidationFlow - Renders public shareable validation flows
 * No authentication required - accessible via /v/:shareToken
 */

const PublicValidationFlow = () => {
  const { shareToken } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [flowData, setFlowData] = useState(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [textListAnswers, setTextListAnswers] = useState([])
  const [sessionToken, setSessionToken] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    if (shareToken) {
      loadValidationFlow()
    }
  }, [shareToken])

  const loadValidationFlow = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch flow by share token
      const { data: flowRecord, error: flowError } = await supabase
        .from('validation_flows')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single()

      if (flowError) throw new Error('Flow not found')
      if (!flowRecord) throw new Error('This validation flow is no longer active')

      // Load the JSON flow definition
      const response = await fetch(`/${flowRecord.flow_json_path}`)
      if (!response.ok) throw new Error('Failed to load flow questions')

      const flowJson = await response.json()

      setFlowData({
        ...flowRecord,
        steps: flowJson.steps,
        metadata: flowJson.metadata
      })

      // Create or retrieve session
      await initializeSession(flowRecord.id)

    } catch (err) {
      console.error('Error loading validation flow:', err)
      setError(err.message || 'Failed to load validation flow')
    } finally {
      setLoading(false)
    }
  }

  const initializeSession = async (flowId) => {
    // Check if session exists in sessionStorage
    const existingToken = sessionStorage.getItem(`validation_session_${shareToken}`)

    if (existingToken) {
      // Retrieve existing session
      const { data: session, error: sessionError } = await supabase
        .from('validation_sessions')
        .select('*')
        .eq('session_token', existingToken)
        .single()

      if (session && !sessionError) {
        setSessionToken(existingToken)
        setSessionId(session.id)
        return
      }
    }

    // Create new session
    const newToken = generateSessionToken()

    const { data: newSession, error: createError } = await supabase
      .from('validation_sessions')
      .insert({
        flow_id: flowId,
        session_token: newToken,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating session:', createError)
      return
    }

    setSessionToken(newToken)
    setSessionId(newSession.id)
    sessionStorage.setItem(`validation_session_${shareToken}`, newToken)
  }

  const generateSessionToken = () => {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }

  const saveResponse = async (stepId, questionText, answerType, answerValue) => {
    if (!sessionId || !flowData) return

    try {
      const { error } = await supabase
        .from('validation_responses')
        .insert({
          session_id: sessionId,
          flow_id: flowData.id,
          step_id: stepId,
          question_text: questionText,
          answer_type: answerType,
          answer_value: answerValue
        })

      if (error) throw error

      console.log('✅ Response saved:', stepId)
    } catch (err) {
      console.error('Error saving response:', err)
    }
  }

  const handleNext = async () => {
    const currentStep = flowData.steps[currentStepIndex]
    const expectedInput = currentStep.expected_inputs?.[0]

    // Validate and save response
    if (expectedInput) {
      let answerValue = currentAnswer

      if (expectedInput.type === 'text_list') {
        answerValue = textListAnswers
        if (textListAnswers.length < (expectedInput.min_items || 0)) {
          alert(`Please provide at least ${expectedInput.min_items} answers`)
          return
        }
      } else if (expectedInput.type === 'email') {
        if (!currentAnswer || !currentAnswer.includes('@')) {
          alert('Please enter a valid email address')
          return
        }
        // Update session with email
        await supabase
          .from('validation_sessions')
          .update({ respondent_email: currentAnswer })
          .eq('id', sessionId)
      } else if (!currentAnswer && expectedInput.type !== 'single_select') {
        alert('Please provide an answer before continuing')
        return
      }

      // Save response
      await saveResponse(
        currentStep.id,
        currentStep.assistant_prompt,
        expectedInput.type,
        answerValue
      )
    }

    // Check if this is the last step
    if (currentStepIndex === flowData.steps.length - 1) {
      // Mark session as completed
      await supabase
        .from('validation_sessions')
        .update({
          completed_at: new Date().toISOString(),
          is_completed: true
        })
        .eq('id', sessionId)

      // Clear session storage
      sessionStorage.removeItem(`validation_session_${shareToken}`)
    }

    // Move to next step
    setCurrentStepIndex(prev => prev + 1)
    setCurrentAnswer('')
    setTextListAnswers([])
  }

  const handleTextListAdd = () => {
    if (currentAnswer.trim()) {
      setTextListAnswers([...textListAnswers, currentAnswer.trim()])
      setCurrentAnswer('')
    }
  }

  const handleTextListRemove = (index) => {
    setTextListAnswers(textListAnswers.filter((_, i) => i !== index))
  }

  const renderInput = (inputConfig) => {
    if (!inputConfig) return null

    switch (inputConfig.type) {
      case 'single_select':
        return (
          <div className="validation-options">
            {inputConfig.options.map(option => (
              <button
                key={option}
                className={`validation-option-btn ${currentAnswer === option ? 'selected' : ''}`}
                onClick={() => setCurrentAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )

      case 'free_text':
      case 'text':
        return (
          <textarea
            className="validation-textarea"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={inputConfig.placeholder || 'Type your answer...'}
            rows={5}
          />
        )

      case 'email':
        return (
          <input
            type="email"
            className="validation-input"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={inputConfig.placeholder || 'your.email@example.com'}
          />
        )

      case 'text_list':
        return (
          <div className="validation-text-list">
            <div className="text-list-input-group">
              <input
                type="text"
                className="validation-input"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={inputConfig.placeholder || 'Type an answer...'}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleTextListAdd()
                  }
                }}
              />
              <button
                className="add-list-item-btn"
                onClick={handleTextListAdd}
                disabled={!currentAnswer.trim()}
              >
                Add
              </button>
            </div>
            <div className="text-list-items">
              {textListAnswers.map((answer, index) => (
                <div key={index} className="text-list-item">
                  <span>{index + 1}. {answer}</span>
                  <button
                    className="remove-list-item-btn"
                    onClick={() => handleTextListRemove(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {inputConfig.min_items && (
              <div className="text-list-progress">
                {textListAnswers.length} / {inputConfig.min_items} required
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="public-validation-page">
        <div className="validation-loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="public-validation-page">
        <div className="validation-error">
          <h2>Oops!</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!flowData || currentStepIndex >= flowData.steps.length) {
    return (
      <div className="public-validation-page">
        <div className="validation-error">
          <p>This validation flow has ended.</p>
        </div>
      </div>
    )
  }

  const currentStep = flowData.steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / flowData.steps.length) * 100

  return (
    <div className="public-validation-page">
      {/* Progress Bar */}
      <div className="validation-progress-bar">
        <div className="validation-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Main Content */}
      <div className="validation-container">
        <div className="validation-header">
          <div className="validation-logo">FindMyFlow</div>
          <div className="validation-step-counter">
            Question {currentStepIndex + 1} of {flowData.steps.length}
          </div>
        </div>

        <div className="validation-content">
          {/* Question Prompt */}
          <div
            className="validation-prompt"
            dangerouslySetInnerHTML={{ __html: currentStep.assistant_prompt.replace(/\n/g, '<br/>') }}
          />

          {/* Input Field */}
          <div className="validation-input-section">
            {renderInput(currentStep.expected_inputs?.[0])}
          </div>

          {/* Next Button */}
          <button
            className="validation-next-btn"
            onClick={handleNext}
            disabled={
              !currentAnswer &&
              currentStep.expected_inputs?.[0]?.type !== 'text_list' &&
              textListAnswers.length === 0
            }
          >
            {currentStepIndex === flowData.steps.length - 1 ? 'Finish' : 'Continue'}
          </button>
        </div>

        {/* Footer */}
        <div className="validation-footer">
          <p>Powered by FindMyFlow</p>
        </div>
      </div>
    </div>
  )
}

export default PublicValidationFlow
