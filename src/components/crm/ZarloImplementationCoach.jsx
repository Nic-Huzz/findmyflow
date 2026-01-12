/**
 * ZarloImplementationCoach - AI-powered task assistance
 *
 * Part of Sales Tower Tier 3.
 * Slides in from right (desktop) or full-screen (mobile) when user clicks a task.
 * Shows pre-filled context, asks clarifying questions, generates artifacts.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getOfferContext, getVoiceForGeneration } from '../../lib/businessProfile'
import { getTemplateForTask, hasGenerationTemplate } from '../../lib/crm/implementationTemplates'
import './ZarloImplementationCoach.css'

// Phases of the coach flow
const PHASE = {
  LOADING: 'loading',
  CONTEXT_CONFIRM: 'context_confirm',
  QUESTIONS: 'questions',
  GENERATING: 'generating',
  RESULT: 'result',
  GUIDANCE_ONLY: 'guidance_only',
}

export default function ZarloImplementationCoach({
  isOpen,
  onClose,
  task,
  category,
  userId,
  onComplete,
}) {
  const [phase, setPhase] = useState(PHASE.LOADING)
  const [context, setContext] = useState(null)
  const [template, setTemplate] = useState(null)
  const [answers, setAnswers] = useState({})
  const [generatedContent, setGeneratedContent] = useState(null)
  const [error, setError] = useState(null)
  const [voiceInstructions, setVoiceInstructions] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerationCount, setRegenerationCount] = useState(0)
  const [generationStartTime, setGenerationStartTime] = useState(null)

  // Get project ID for analytics
  const getProjectId = () => {
    const savedProject = localStorage.getItem('crm_current_project')
    if (savedProject) {
      try {
        return JSON.parse(savedProject)?.id
      } catch { return null }
    }
    return null
  }

  // Track analytics events
  const trackEvent = async (eventType, extraData = {}) => {
    try {
      await supabase.from('coach_analytics').insert({
        user_id: userId,
        project_id: getProjectId(),
        event_type: eventType,
        category,
        task_title: task?.task,
        template_id: template?.task_id,
        template_type: template?.task_type,
        ...extraData,
      })
    } catch (err) {
      console.error('Analytics tracking error:', err)
    }
  }

  // Load context and template when opening
  useEffect(() => {
    if (isOpen && task && userId) {
      loadContext()
    }
  }, [isOpen, task, userId, category])

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setPhase(PHASE.LOADING)
      setContext(null)
      setTemplate(null)
      setAnswers({})
      setGeneratedContent(null)
      setError(null)
      setSaved(false)
      setSaving(false)
      setCopied(false)
      setRegenerationCount(0)
      setGenerationStartTime(null)
    }
  }, [isOpen])

  async function loadContext() {
    setPhase(PHASE.LOADING)
    setError(null)

    // Track coach opened
    trackEvent('coach_opened')

    try {
      // Load business context and voice profile in parallel
      const [offerContext, voiceData] = await Promise.all([
        getOfferContext(userId, category),
        getVoiceForGeneration(userId),
      ])

      setContext(offerContext)
      if (voiceData?.instructions) {
        setVoiceInstructions(voiceData.instructions)
      }

      // Get template for this task
      const taskTemplate = getTemplateForTask(task.task, category)
      setTemplate(taskTemplate)

      if (taskTemplate) {
        setPhase(PHASE.CONTEXT_CONFIRM)
      } else {
        // No template - show guidance only mode
        setPhase(PHASE.GUIDANCE_ONLY)
      }
    } catch (err) {
      console.error('Error loading context:', err)
      setError('Failed to load your business context. Please try again.')
      setPhase(PHASE.GUIDANCE_ONLY)
    }
  }

  const handleConfirmContext = () => {
    // Check if we have required questions
    const requiredQuestions = template?.clarifying_questions?.filter(q => q.required) || []

    if (requiredQuestions.length > 0) {
      setPhase(PHASE.QUESTIONS)
    } else {
      handleGenerate()
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const canSubmitAnswers = useCallback(() => {
    if (!template?.clarifying_questions) return true

    const requiredQuestions = template.clarifying_questions.filter(q => q.required)
    return requiredQuestions.every(q => answers[q.id]?.trim())
  }, [template, answers])

  const handleSubmitAnswers = () => {
    if (canSubmitAnswers()) {
      handleGenerate()
    }
  }

  async function handleGenerate() {
    setPhase(PHASE.GENERATING)
    setError(null)
    setGenerationStartTime(Date.now())

    // Track generation started
    trackEvent('generation_started', { model_used: 'haiku' })

    try {
      // Build the prompt
      const prompt = template.generation_prompt(context, answers, voiceInstructions)

      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke('implementation-coach', {
        body: {
          prompt,
          task_type: template.task_type,
          category,
          action: 'generate',
        },
      })

      if (fnError) {
        throw fnError
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setGeneratedContent(data.content)
      setPhase(PHASE.RESULT)

      // Track generation completed
      const generationTime = generationStartTime ? Date.now() - generationStartTime : null
      trackEvent('generation_completed', {
        model_used: 'haiku',
        generation_time_ms: generationTime,
      })
    } catch (err) {
      console.error('Error generating content:', err)
      setError('Failed to generate content. Please try again.')
      setPhase(PHASE.QUESTIONS)
    }
  }

  const handleRegenerate = () => {
    setRegenerationCount(prev => prev + 1)
    trackEvent('content_regenerated', { regeneration_count: regenerationCount + 1 })
    handleGenerate()
  }

  const handleCopy = async () => {
    if (generatedContent) {
      try {
        await navigator.clipboard.writeText(generatedContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        trackEvent('content_copied', { was_copied: true })
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const handleSave = async () => {
    if (!generatedContent || saving || saved) return

    setSaving(true)
    try {
      // Get project ID from localStorage
      let projectId = null
      const savedProject = localStorage.getItem('crm_current_project')
      if (savedProject) {
        try {
          projectId = JSON.parse(savedProject)?.id
        } catch { /* ignore */ }
      }

      const { error: saveError } = await supabase
        .from('generated_assets')
        .insert({
          user_id: userId,
          project_id: projectId,
          asset_type: template?.task_type || 'content',
          category: category,
          task_title: task?.task || 'Unknown task',
          content: generatedContent,
          context_snapshot: context,
          answers_used: answers,
        })

      if (saveError) throw saveError

      setSaved(true)
      trackEvent('content_saved', { was_saved: true })
    } catch (err) {
      console.error('Error saving asset:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleMarkComplete = () => {
    trackEvent('task_completed', {
      was_saved: saved,
      was_copied: copied,
      regeneration_count: regenerationCount,
    })
    onComplete?.()
    onClose()
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="coach-backdrop" onClick={onClose} />

      {/* Coach Panel */}
      <div className={`coach-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="coach-header">
          <div className="coach-header-content">
            <span className="coach-icon">🤖</span>
            <div className="coach-header-text">
              <h2>Zarlo</h2>
              <p>Implementation Coach</p>
            </div>
          </div>
          <button className="coach-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Task Info */}
        <div className="coach-task-info">
          <span className="task-badge">{category}</span>
          <h3>{task?.task}</h3>
          {task?.description && (
            <p className="task-desc">{task.description}</p>
          )}
        </div>

        {/* Content Area */}
        <div className="coach-content">
          {/* Loading Phase */}
          {phase === PHASE.LOADING && (
            <div className="coach-loading">
              <div className="coach-spinner"></div>
              <p>Loading your business context...</p>
            </div>
          )}

          {/* Guidance Only Phase (no template) */}
          {phase === PHASE.GUIDANCE_ONLY && (
            <div className="coach-guidance">
              <div className="guidance-icon">💡</div>
              <h4>Task Guidance</h4>

              {/* Task description */}
              {task?.description && (
                <div className="guidance-description">
                  <p>{task.description}</p>
                </div>
              )}

              {/* Hormozi Principle */}
              {task?.principle && (
                <div className="guidance-principle">
                  <strong>Hormozi Principle:</strong>
                  <p>"{task.principle}"</p>
                </div>
              )}

              {/* Examples if available */}
              {task?.examples && task.examples.length > 0 && (
                <div className="guidance-tips">
                  <h5>Examples:</h5>
                  <ul>
                    {task.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Templates if available */}
              {task?.templates && task.templates.length > 0 && (
                <div className="guidance-tips">
                  <h5>Templates to use:</h5>
                  <ul>
                    {task.templates.map((template, idx) => (
                      <li key={idx}>{template}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Script if available */}
              {task?.script && (
                <div className="guidance-script">
                  <h5>Suggested script:</h5>
                  <p className="script-text">"{task.script}"</p>
                </div>
              )}

              {/* Fallback tips if no specific guidance */}
              {!task?.description && !task?.principle && !task?.examples && !task?.templates && !task?.script && (
                <div className="guidance-tips">
                  <h5>Tips for this task:</h5>
                  <ul>
                    <li>Focus on the transformation, not the features</li>
                    <li>Keep it simple - one clear message</li>
                    <li>Test with a small audience first</li>
                  </ul>
                </div>
              )}

              <div className="guidance-actions">
                <button className="coach-btn primary" onClick={handleMarkComplete}>
                  Mark as Complete
                </button>
              </div>
            </div>
          )}

          {/* Context Confirm Phase */}
          {phase === PHASE.CONTEXT_CONFIRM && template && (
            <div className="coach-context">
              {template.context_display(context)?.length > 0 ? (
                <>
                  <div className="context-header">
                    <span className="context-icon">✓</span>
                    <h4>I already know about your business</h4>
                  </div>

                  <div className="context-items">
                    {template.context_display(context).map((item, idx) => (
                      <div key={idx} className="context-item">
                        <span className="context-label">{item.label}:</span>
                        <span className="context-value">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="context-actions">
                    <button
                      className="coach-btn primary"
                      onClick={handleConfirmContext}
                    >
                      Yes, continue
                    </button>
                    <button
                      className="coach-btn secondary"
                      onClick={() => setPhase(PHASE.QUESTIONS)}
                    >
                      Let me update this
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="context-header">
                    <span className="context-icon">📝</span>
                    <h4>Let me learn about your business</h4>
                  </div>
                  <p className="context-empty">
                    I'll ask a few quick questions to personalize your {template.task_type || 'content'}.
                  </p>
                  <div className="context-actions">
                    <button
                      className="coach-btn primary"
                      onClick={() => setPhase(PHASE.QUESTIONS)}
                    >
                      Let's go
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Questions Phase */}
          {phase === PHASE.QUESTIONS && template && (
            <div className="coach-questions">
              <h4>A few quick questions...</h4>

              {template.clarifying_questions?.map((q) => (
                <div key={q.id} className="question-group">
                  <label className="question-label">
                    {q.question}
                    {q.required && <span className="required">*</span>}
                  </label>
                  {q.help && <p className="question-help">{q.help}</p>}

                  {q.options ? (
                    <div className="question-options">
                      {q.options.map((opt, idx) => (
                        <button
                          key={idx}
                          className={`option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
                          onClick={() => handleAnswerChange(q.id, opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="question-input"
                      placeholder={q.placeholder || ''}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows={3}
                    />
                  )}
                </div>
              ))}

              {error && <p className="coach-error">{error}</p>}

              <div className="question-actions">
                <button
                  className="coach-btn primary"
                  onClick={handleSubmitAnswers}
                  disabled={!canSubmitAnswers()}
                >
                  Generate Content
                </button>
              </div>
            </div>
          )}

          {/* Generating Phase */}
          {phase === PHASE.GENERATING && (
            <div className="coach-generating">
              <div className="generating-animation">
                <span className="generating-dot"></span>
                <span className="generating-dot"></span>
                <span className="generating-dot"></span>
              </div>
              <p>Creating your {template?.task_type || 'content'}...</p>
              <p className="generating-tip">This usually takes 5-10 seconds</p>
            </div>
          )}

          {/* Result Phase */}
          {phase === PHASE.RESULT && (
            <div className="coach-result">
              <div className="result-header">
                <span className="result-icon">✨</span>
                <h4>Here's what I created</h4>
              </div>

              <div className="result-content">
                <pre>{generatedContent}</pre>
              </div>

              <div className="result-actions">
                <button className="coach-btn icon" onClick={handleCopy} title="Copy to clipboard">
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button
                  className={`coach-btn icon ${saved ? 'saved' : ''}`}
                  onClick={handleSave}
                  disabled={saving || saved}
                >
                  {saving ? '💾 Saving...' : saved ? '✓ Saved!' : '💾 Save'}
                </button>
                <button className="coach-btn icon" onClick={handleRegenerate}>
                  🔄 Regenerate
                </button>
              </div>

              {template?.success_tips && (
                <div className="result-tips">
                  <h5>Tips:</h5>
                  <ul>
                    {template.success_tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="result-complete">
                <button className="coach-btn primary" onClick={handleMarkComplete}>
                  Mark Task Complete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="coach-footer">
          <p>Powered by Hormozi's $100M methodology</p>
        </div>
      </div>
    </>
  )
}
