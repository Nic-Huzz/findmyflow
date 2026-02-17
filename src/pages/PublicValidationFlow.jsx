import React, { useState, useEffect, useRef } from 'react'
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
  const [stepHistory, setStepHistory] = useState([]) // Track visited step indices for back navigation
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [textListAnswers, setTextListAnswers] = useState([])
  const [sessionToken, setSessionToken] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  // New state for enhanced UX features
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showSkipDropdown, setShowSkipDropdown] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [responseSummary, setResponseSummary] = useState([]) // Track responses for completion summary
  const [savedAnswers, setSavedAnswers] = useState({}) // Store all answers by step ID
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [nameInput, setNameInput] = useState('') // For name_email combined input
  const [launchNotifySubmitting, setLaunchNotifySubmitting] = useState(false)
  const [launchNotifySubmitted, setLaunchNotifySubmitted] = useState(false)

  // Voice recording ref
  const recognitionRef = useRef(null)

  // localStorage key for this flow
  const getStorageKey = () => `validation_progress_${shareToken}`

  // Save progress to localStorage
  const saveProgressLocally = (stepIndex, answers, history, summary) => {
    try {
      const progress = {
        currentStepIndex: stepIndex,
        savedAnswers: answers,
        stepHistory: history,
        responseSummary: summary,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(progress))
    } catch (err) {
      console.error('Error saving progress locally:', err)
    }
  }

  // Load progress from localStorage
  const loadLocalProgress = () => {
    try {
      const saved = localStorage.getItem(getStorageKey())
      if (saved) {
        const progress = JSON.parse(saved)
        // Check if progress is less than 7 days old
        const lastUpdated = new Date(progress.lastUpdated)
        const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceUpdate < 7 && progress.currentStepIndex > 0) {
          return progress
        }
      }
    } catch (err) {
      console.error('Error loading local progress:', err)
    }
    return null
  }

  // Clear local progress
  const clearLocalProgress = () => {
    try {
      localStorage.removeItem(getStorageKey())
    } catch (err) {
      console.error('Error clearing local progress:', err)
    }
  }

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

      if (flowError) {
        console.error('Supabase flow query error:', flowError)
        throw new Error('Flow not found')
      }
      if (!flowRecord) throw new Error('This validation flow is no longer active')

      // Load the JSON flow definition
      const response = await fetch(`/${flowRecord.flow_json_path}`)
      if (!response.ok) throw new Error('Failed to load flow questions')

      const flowJson = await response.json()

      // Merge placeholders: flow record overrides JSON defaults
      const mergedPlaceholders = {
        ...(flowJson.placeholders || {}),
        ...(flowRecord.placeholders || {})
      }

      setFlowData({
        ...flowRecord,
        steps: flowJson.steps,
        metadata: flowJson.metadata,
        placeholders: mergedPlaceholders
      })

      // Check for saved local progress
      const localProgress = loadLocalProgress()
      if (localProgress) {
        setShowResumePrompt(true)
      }

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

    // Create new session with analytics data
    const newToken = generateSessionToken()

    // Collect analytics metadata
    const analyticsData = {
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      screen_width: window.innerWidth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    const { data: newSession, error: createError } = await supabase
      .from('validation_sessions')
      .insert({
        flow_id: flowId,
        session_token: newToken,
        started_at: new Date().toISOString(),
        metadata: analyticsData
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

  // Resume from saved progress
  const handleResume = () => {
    const progress = loadLocalProgress()
    if (progress) {
      setCurrentStepIndex(progress.currentStepIndex)
      setSavedAnswers(progress.savedAnswers || {})
      setStepHistory(progress.stepHistory || [])
      setResponseSummary(progress.responseSummary || [])
      showAutoSaveToast('Progress restored')
    }
    setShowResumePrompt(false)
  }

  // Start fresh (clear saved progress)
  const handleStartFresh = () => {
    clearLocalProgress()
    setShowResumePrompt(false)
  }

  // Send email notification to creator when survey is completed
  const sendCompletionNotification = async () => {
    try {
      // Call edge function to send email
      const { error } = await supabase.functions.invoke('validation-completion-notify', {
        body: {
          flow_id: flowData.id,
          session_id: sessionId,
          flow_name: flowData.flow_name || 'Validation Survey',
          total_responses: responseSummary.length
        }
      })
      if (error) {
        console.error('Error sending notification:', error)
      }
    } catch (err) {
      // Silently fail - don't disrupt user experience
      console.error('Notification error:', err)
    }
  }

  // Handle launch notification signup
  const handleLaunchNotify = async () => {
    setLaunchNotifySubmitting(true)

    try {
      // Get email from session if available
      const { data: session } = await supabase
        .from('validation_sessions')
        .select('respondent_email, respondent_name')
        .eq('id', sessionId)
        .single()

      if (session?.respondent_email) {
        // Save to public_leads with launch notification interest
        await supabase
          .from('public_leads')
          .upsert({
            email: session.respondent_email,
            name: session.respondent_name || null,
            source_flow: 'validation_survey',
            launch_notify: true,
            launch_notify_at: new Date().toISOString()
          }, {
            onConflict: 'email',
            ignoreDuplicates: false
          })
      }
    } catch (err) {
      console.error('Error saving launch notification interest:', err)
    }

    setLaunchNotifySubmitting(false)
    setLaunchNotifySubmitted(true)
  }

  // Replace {{placeholder}} patterns with actual values and convert markdown
  const replacePlaceholders = (text) => {
    if (!text || !flowData?.placeholders) return text

    let result = text
    Object.entries(flowData.placeholders).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(pattern, value)
    })
    return result
  }

  // Convert markdown **text** to <strong> and \n to <br/>
  const formatPrompt = (text) => {
    if (!text) return ''
    let result = replacePlaceholders(text)
    // Convert **text** to <strong>text</strong>
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert newlines to <br/>
    result = result.replace(/\n/g, '<br/>')
    return result
  }

  // Split prompt into title (first line) and body (rest) for styling
  const splitPrompt = (text) => {
    if (!text) return { title: '', body: '' }
    const withPlaceholders = replacePlaceholders(text)
    // Split on first double newline or single newline
    const parts = withPlaceholders.split(/\n\n|\n/)
    const title = parts[0] || ''
    const body = parts.slice(1).join('\n')
    // Format title - just replace markdown
    const formattedTitle = title.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Format body - replace markdown and newlines
    let formattedBody = body.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    formattedBody = formattedBody.replace(/\n/g, '<br/>')
    return { title: formattedTitle, body: formattedBody }
  }

  // Handle going back to previous step (uses step history)
  const handleBack = () => {
    if (stepHistory.length > 0) {
      const previousIndex = stepHistory[stepHistory.length - 1]
      setStepHistory(prev => prev.slice(0, -1))
      setCurrentStepIndex(previousIndex)
      setCurrentAnswer('')
      setNameInput('')
      setTextListAnswers([])
    }
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

      // Track response for completion summary
      setResponseSummary(prev => [...prev, {
        question: questionText?.substring(0, 60),
        answer: typeof answerValue === 'string' ? answerValue?.substring(0, 100) : JSON.stringify(answerValue)?.substring(0, 100)
      }])

      showAutoSaveToast('Progress saved')
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
          showAutoSaveToast(`Please provide at least ${expectedInput.min_items} answers`)
          return
        }
      } else if (expectedInput.type === 'email') {
        if (!currentAnswer || !currentAnswer.includes('@')) {
          showAutoSaveToast('Please enter a valid email address')
          return
        }
        // Update session with email
        await supabase
          .from('validation_sessions')
          .update({ respondent_email: currentAnswer })
          .eq('id', sessionId)
      } else if (expectedInput.type === 'name_email') {
        if (!currentAnswer || !currentAnswer.includes('@')) {
          showAutoSaveToast('Please enter a valid email address')
          return
        }
        // Update session with name and email
        await supabase
          .from('validation_sessions')
          .update({
            respondent_name: nameInput.trim() || null,
            respondent_email: currentAnswer
          })
          .eq('id', sessionId)
        // Store combined answer
        answerValue = { name: nameInput.trim(), email: currentAnswer }
      } else if (!currentAnswer && expectedInput.type !== 'single_select') {
        showAutoSaveToast('Please provide an answer before continuing')
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

    // Determine next step based on next_step_rules
    const rules = currentStep.next_step_rules || []
    let nextStepId = null

    // Find matching rule
    for (const rule of rules) {
      if (rule.on_success) {
        // Simple success rule - go to specified step
        nextStepId = rule.on_success
        break
      } else if (rule.on_selection && rule.go_to) {
        // Selection-based rule - match against current answer
        if (rule.on_selection === currentAnswer) {
          nextStepId = rule.go_to
          break
        }
      }
    }

    // Save answer to local state
    const newSavedAnswers = { ...savedAnswers, [currentStep.id]: currentAnswer || textListAnswers }
    setSavedAnswers(newSavedAnswers)

    // Handle "complete" as end of flow
    if (nextStepId === 'complete') {
      // Mark session as completed
      await supabase
        .from('validation_sessions')
        .update({
          completed_at: new Date().toISOString(),
          is_completed: true
        })
        .eq('id', sessionId)

      // Clear session and local storage
      sessionStorage.removeItem(`validation_session_${shareToken}`)
      clearLocalProgress()

      // Go past the last step to show completion
      setCurrentStepIndex(flowData.steps.length)
      setCurrentAnswer('')
      setNameInput('')
      setTextListAnswers([])
      return
    }

    // Find the index of the target step
    let nextIndex = currentStepIndex + 1 // Default to next in array
    if (nextStepId) {
      const targetIndex = flowData.steps.findIndex(step => step.id === nextStepId)
      if (targetIndex !== -1) {
        nextIndex = targetIndex
      }
    }

    // Check if this is the last step
    if (nextIndex >= flowData.steps.length) {
      // Mark session as completed with analytics
      await supabase
        .from('validation_sessions')
        .update({
          completed_at: new Date().toISOString(),
          is_completed: true,
          total_questions: flowData.steps.length,
          last_step_index: flowData.steps.length
        })
        .eq('id', sessionId)

      // Send completion notification to creator
      sendCompletionNotification()

      // Clear session and local storage
      sessionStorage.removeItem(`validation_session_${shareToken}`)
      clearLocalProgress()
    }

    // Move to next step (push current to history for back navigation)
    const newHistory = [...stepHistory, currentStepIndex]
    setStepHistory(newHistory)
    setCurrentStepIndex(nextIndex)
    setCurrentAnswer('')
    setNameInput('')

    // Update session with current step (for drop-off tracking)
    await supabase
      .from('validation_sessions')
      .update({
        last_step_index: nextIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    // Save progress locally (if not completing)
    if (nextIndex < flowData.steps.length) {
      saveProgressLocally(nextIndex, newSavedAnswers, newHistory, responseSummary)
    }
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

  // Show auto-save toast notification
  const showAutoSaveToast = (message = 'Progress saved') => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  // Handle skip with reason
  const handleSkip = async (reason) => {
    const currentStep = flowData.steps[currentStepIndex]

    // Save skip response
    await saveResponse(
      currentStep.id,
      currentStep.assistant_prompt,
      'skipped',
      { skipped: true, reason }
    )

    showAutoSaveToast('Skipped')
    setShowSkipDropdown(false)

    const nextIndex = currentStepIndex + 1
    const newHistory = [...stepHistory, currentStepIndex]

    // Check if skipping past the last step
    if (nextIndex >= flowData.steps.length) {
      await supabase
        .from('validation_sessions')
        .update({
          completed_at: new Date().toISOString(),
          is_completed: true,
          last_step_index: flowData.steps.length
        })
        .eq('id', sessionId)
      sessionStorage.removeItem(`validation_session_${shareToken}`)
      clearLocalProgress()
    } else {
      // Update session with current step (for drop-off tracking)
      await supabase
        .from('validation_sessions')
        .update({
          last_step_index: nextIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      // Save progress locally
      const newSavedAnswers = { ...savedAnswers, [currentStep.id]: { skipped: true, reason } }
      setSavedAnswers(newSavedAnswers)
      saveProgressLocally(nextIndex, newSavedAnswers, newHistory, responseSummary)
    }

    // Move to next step
    setStepHistory(newHistory)
    setCurrentStepIndex(nextIndex)
    setCurrentAnswer('')
    setNameInput('')
    setTextListAnswers([])
  }

  // Voice input handlers
  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showAutoSaveToast('Voice input not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true

    recognitionRef.current.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setCurrentAnswer(prev => prev + transcript)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current.start()
    setIsRecording(true)
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording()
    } else {
      startVoiceRecording()
    }
  }


  // Get estimated time remaining
  const getEstimatedTime = () => {
    if (!flowData) return '~5 min'
    const remainingSteps = flowData.steps.length - currentStepIndex
    const minutesPerStep = 0.5 // ~30 seconds per question
    const minutes = Math.min(Math.ceil(remainingSteps * minutesPerStep), 10) // Cap at 10 min
    return `~${minutes} min`
  }

  // Render progress bar (replaces dots)
  const renderProgressBar = () => {
    if (!flowData) return null
    const totalSteps = flowData.steps.length
    const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100

    return (
      <div className="validation-progress-section">
        <div className="validation-time-badge">
          <span className="time-icon">⏱️</span>
          <span>{getEstimatedTime()} left</span>
        </div>
        <div className="validation-progress-bar-container">
          <div className="validation-progress-bar">
            <div
              className="validation-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="validation-progress-text">
            {currentStepIndex + 1} of {totalSteps} questions
          </div>
        </div>
      </div>
    )
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

      case 'multi_select':
        // Parse current selections from comma-separated string
        const selectedOptions = currentAnswer ? currentAnswer.split('|||') : []
        const toggleOption = (option) => {
          if (selectedOptions.includes(option)) {
            // Remove option
            const newSelections = selectedOptions.filter(o => o !== option)
            setCurrentAnswer(newSelections.join('|||'))
          } else {
            // Add option
            setCurrentAnswer([...selectedOptions, option].join('|||'))
          }
        }
        return (
          <div className="validation-options">
            {inputConfig.options.map(option => (
              <button
                key={option}
                className={`validation-option-btn ${selectedOptions.includes(option) ? 'selected' : ''}`}
                onClick={() => toggleOption(option)}
              >
                <span className="option-checkbox">{selectedOptions.includes(option) ? '✓' : ''}</span>
                {option}
              </button>
            ))}
          </div>
        )

      case 'free_text':
      case 'text':
        return (
          <div className="validation-voice-input-wrapper">
            <textarea
              className="validation-textarea with-voice"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={inputConfig.placeholder || 'Type your answer...'}
              rows={5}
            />
            <button
              type="button"
              className={`validation-voice-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
          </div>
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

      case 'name_email':
        return (
          <div className="validation-name-email">
            <input
              type="text"
              className="validation-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={inputConfig.name_placeholder || 'Your name (optional)'}
            />
            <input
              type="email"
              className="validation-input"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={inputConfig.email_placeholder || 'your.email@example.com'}
            />
          </div>
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
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show resume prompt if there's saved progress
  if (showResumePrompt) {
    const progress = loadLocalProgress()
    const questionsAnswered = progress?.currentStepIndex || 0
    return (
      <div className="public-validation-page">
        <div className="validation-container">
          <div className="validation-resume-prompt">
            <div className="resume-icon">📝</div>
            <h2>Welcome back!</h2>
            <p>Looks like you were in the middle of this survey.</p>
            <p className="resume-progress">You answered {questionsAnswered} question{questionsAnswered !== 1 ? 's' : ''}.</p>
            <div className="resume-buttons">
              <button className="validation-next-btn" onClick={handleResume}>
                Continue where I left off
              </button>
              <button className="validation-back-btn" onClick={handleStartFresh}>
                Start fresh
              </button>
            </div>
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
          <button
            className="validation-next-btn"
            onClick={() => {
              setError(null)
              loadValidationFlow()
            }}
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!flowData || currentStepIndex >= flowData.steps.length) {
    // Personalized completion screen
    return (
      <div className="public-validation-page">
        <div className="validation-complete">
          <div className="complete-icon">🎉</div>
          <h2>You're amazing. Seriously.</h2>
          <p className="complete-message">
            Your honest answers are going to help shape something real.
            The person who sent you this? They're not building for "the market" — they're building for people like you.
          </p>

          {responseSummary.length > 0 && (
            <div className="summary-card">
              <h3>Your Responses</h3>
              {responseSummary.slice(0, 3).map((item, idx) => (
                <div key={idx} className="summary-item">
                  <div className="summary-label">Q{idx + 1}</div>
                  <div className="summary-value">{item.answer || '—'}</div>
                </div>
              ))}
              {responseSummary.length > 3 && (
                <div className="summary-item">
                  <div className="summary-value" style={{ opacity: 0.6 }}>
                    + {responseSummary.length - 3} more responses
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FindMyFlow CTA */}
          <div className="completion-cta">
            <p className="cta-intro">Curious what they're using to build this?</p>
            <p className="cta-description">
              Find My Flow helps people discover what they're meant to create — and actually follow through on it.
            </p>
            {!launchNotifySubmitted ? (
              <button
                className="cta-button"
                onClick={handleLaunchNotify}
                disabled={launchNotifySubmitting}
              >
                {launchNotifySubmitting ? 'Saving...' : 'Keen to learn more about scaling your business and be notified when Find My Flow launches?'}
              </button>
            ) : (
              <div className="launch-notify-success">
                <span className="launch-notify-icon">🎉</span>
                <p>You're on the list! We'll let you know when Find My Flow is ready.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentStep = flowData.steps[currentStepIndex]

  return (
    <div className="public-validation-page">
      {/* Auto-save Toast */}
      <div className={`validation-toast ${showToast ? 'show' : ''}`}>
        <span className="toast-icon">✓</span>
        <span>{toastMessage}</span>
      </div>

      {/* Progress Bar with Time Estimate */}
      {renderProgressBar()}

      {/* Main Content */}
      <div className="validation-container">
        <div className="validation-header">
          <div className="validation-logo">FindMyFlow</div>
          <div className="validation-step-counter">
            {currentStepIndex + 1} / {flowData.steps.length}
          </div>
        </div>

        <div className="validation-content" key={currentStepIndex}>
          {/* Question Prompt - Split into title and body for proper styling */}
          {(() => {
            const { title, body } = splitPrompt(currentStep.assistant_prompt)
            return (
              <>
                <div
                  className="validation-prompt"
                  dangerouslySetInnerHTML={{ __html: title }}
                />
                {body && (
                  <div
                    className="validation-body-text"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                )}
              </>
            )
          })()}

          {/* Input Field */}
          <div className="validation-input-section">
            {renderInput(currentStep.expected_inputs?.[0])}
          </div>
        </div>

        {/* Navigation Buttons - Fixed at bottom */}
        <div className="validation-nav-buttons">
          <button
            className="validation-next-btn"
            onClick={handleNext}
            disabled={
              currentStep.expected_inputs?.length > 0 &&
              !currentAnswer &&
              currentStep.expected_inputs?.[0]?.type !== 'text_list' &&
              textListAnswers.length === 0
            }
          >
            {currentStep.button_text || (currentStepIndex === flowData.steps.length - 1 ? 'Finish' : 'Continue')}
          </button>

          {/* Back Button - only show if there's history to go back to */}
          {stepHistory.length > 0 && (
            <button className="validation-back-btn" onClick={handleBack}>
              ← Go Back
            </button>
          )}

          {/* Skip with Reason */}
          {currentStep.expected_inputs?.length > 0 && currentStepIndex > 0 && (
            <div className="validation-skip-section">
              <button
                className="validation-skip-btn"
                onClick={() => setShowSkipDropdown(!showSkipDropdown)}
              >
                Skip this question
              </button>
              {showSkipDropdown && (
                <div className="validation-skip-dropdown">
                  <select onChange={(e) => e.target.value && handleSkip(e.target.value)}>
                    <option value="">Why are you skipping?</option>
                    <option value="not_applicable">Not applicable to me</option>
                    <option value="prefer_not_say">Prefer not to say</option>
                    <option value="need_more_time">Need more time to think</option>
                    <option value="dont_understand">Don't understand the question</option>
                  </select>
                </div>
              )}
            </div>
          )}
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
