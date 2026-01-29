/**
 * Weekly Planning Session
 *
 * Guided flow for starting each week:
 * 1. Review last week's execution score
 * 2. Adjust strategy based on learnings
 * 3. Preview posts + add Quick Context
 * 4. Generate content for the new week
 *
 * Philosophy: "You don't rise to the level of your goals,
 * you fall to the level of your systems."
 * Score = % of system (strategy) executed
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { fetchContentStrategy, saveContentStrategy } from '../../lib/contentStrategy'
import { gatherContentContext } from '../../lib/contentContext'
import { fetchVoiceProfile, buildEnhancedVoiceInstructions, getVoiceFeedbackInsights } from '../../lib/voiceProfile'
import { selectStoriesForContent, buildStoryMemoryContext, logStoriesUsed } from '../../lib/storyBank'
import {
  fetchWeeklyTasks,
  generateWeeklyTasks,
  getWeekStartDate,
  getWeekInfo
} from '../../lib/crm'
import VoiceRecorder from '../../flows/VoiceTraining/components/VoiceRecorder'
import './WeeklyPlanningSession.css'

// Map task types to content generator types
const TASK_TO_CONTENT_TYPE = {
  'Transformation Story': 'transformation_story',
  'Educational Post': 'educational',
  'Pain Point Post': 'pain_agitation',
  'Social Proof': 'social_proof',
  'Offer Teaser': 'offer_teaser',
  'Behind the Scenes': 'behind_scenes',
  'Value Thread': 'value_bomb',
  'Engagement Post': 'question_post',
  'Myth Buster': 'myth_buster',
  'Failure Lesson': 'failure_lesson'
}

const STAGES = {
  LOADING: 'loading',
  REVIEW: 'review',
  ADJUST: 'adjust',
  PREVIEW: 'preview',   // New: Preview tasks with Quick Context
  GENERATE: 'generate',
  GENERATING: 'generating',
  COMPLETE: 'complete'
}

export default function WeeklyPlanningSession({ onComplete, onSkip }) {
  const { user } = useAuth()
  const [stage, setStage] = useState(STAGES.LOADING)
  const [lastWeekData, setLastWeekData] = useState(null)
  const [executionScore, setExecutionScore] = useState(0)
  const [strategy, setStrategy] = useState(null)
  const [adjustments, setAdjustments] = useState({})
  const [generationProgress, setGenerationProgress] = useState('')
  const [error, setError] = useState(null)

  // Preview & Quick Context state
  const [plannedTasks, setPlannedTasks] = useState([])
  const [quickContexts, setQuickContexts] = useState({}) // taskId -> context string
  const [expandedTask, setExpandedTask] = useState(null) // which task has quick context open
  const [inputModes, setInputModes] = useState({}) // taskId -> 'type' | 'speak'
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Hide bottom toolbar during planning flow
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => {
      document.body.classList.remove('hide-toolbar')
    }
  }, [])

  // Load last week's data and current strategy
  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  async function loadData() {
    try {
      // Get last week's tasks
      const lastWeekStart = getWeekStartDate(-1) // -1 = last week
      const lastWeekTasks = await fetchWeeklyTasks(user.id, lastWeekStart)

      // Calculate execution score
      if (lastWeekTasks?.data && lastWeekTasks.data.length > 0) {
        const tasks = lastWeekTasks.data
        const completed = tasks.filter(t => t.completed).length
        const total = tasks.length
        const score = Math.round((completed / total) * 100)

        setLastWeekData({
          tasks,
          completed,
          total,
          weekInfo: getWeekInfo(-1)
        })
        setExecutionScore(score)
      } else {
        setLastWeekData(null)
        setExecutionScore(0)
      }

      // Get current strategy
      const userStrategy = await fetchContentStrategy(user.id)
      setStrategy(userStrategy)

      setStage(STAGES.REVIEW)
    } catch (err) {
      console.error('Error loading planning data:', err)
      setError('Failed to load data. Please try again.')
      setStage(STAGES.REVIEW)
    }
  }

  // Get score color based on percentage
  function getScoreColor(score) {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'needs-work'
    return 'low'
  }

  // Get score message
  function getScoreMessage(score) {
    if (score >= 80) return "Excellent system execution! Your consistency is paying off."
    if (score >= 60) return "Good effort! A few more tasks would level up your consistency."
    if (score >= 40) return "Room to improve. Consider if your strategy is realistic for your schedule."
    if (score > 0) return "Your system needs attention. Let's adjust to something more achievable."
    return "No tasks completed last week. Let's set up a system you can stick to."
  }

  // Group tasks by type for review
  function getTaskBreakdown() {
    if (!lastWeekData?.tasks) return []

    const byType = {}
    lastWeekData.tasks.forEach(task => {
      const type = task.task_type || 'Other'
      if (!byType[type]) {
        byType[type] = { total: 0, completed: 0 }
      }
      byType[type].total++
      if (task.completed) byType[type].completed++
    })

    return Object.entries(byType).map(([type, data]) => ({
      type,
      ...data,
      rate: Math.round((data.completed / data.total) * 100)
    }))
  }

  // Handle strategy adjustment
  function handleAdjustment(field, value) {
    setAdjustments(prev => ({ ...prev, [field]: value }))
  }

  // Save strategy adjustments
  async function saveAdjustments() {
    if (strategy && Object.keys(adjustments).length > 0) {
      try {
        const updatedStrategy = { ...strategy, ...adjustments }
        await saveContentStrategy(user.id, updatedStrategy)
        setStrategy(updatedStrategy)
      } catch (err) {
        console.error('Error saving adjustments:', err)
        setError('Failed to save adjustments. Continuing anyway.')
      }
    }

    // Move to Preview stage and load/create tasks
    await loadPreviewTasks()
  }

  // Load or create tasks for preview
  async function loadPreviewTasks() {
    setLoadingTasks(true)
    setStage(STAGES.PREVIEW)

    try {
      const thisWeekStart = getWeekStartDate(0)

      // Check if tasks already exist for this week
      let tasksResult = await fetchWeeklyTasks(user.id, thisWeekStart)

      if (!tasksResult.data || tasksResult.data.length === 0) {
        // Generate new tasks based on strategy
        await generateWeeklyTasks(user.id, null, thisWeekStart)
        tasksResult = await fetchWeeklyTasks(user.id, thisWeekStart)
      }

      setPlannedTasks(tasksResult.data || [])
    } catch (err) {
      console.error('Error loading preview tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoadingTasks(false)
    }
  }

  // Update quick context for a task
  function updateQuickContext(taskId, context) {
    setQuickContexts(prev => ({ ...prev, [taskId]: context }))
  }

  // Toggle input mode for a task
  function toggleInputMode(taskId, mode) {
    setInputModes(prev => ({ ...prev, [taskId]: mode }))
  }

  // Get day name from date
  function getDayName(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  // Generate content for this week (using Story Bank + Quick Context)
  async function handleGenerate() {
    setStage(STAGES.GENERATING)

    const tasks = plannedTasks

    if (tasks.length === 0) {
      setGenerationProgress('No tasks to generate content for.')
      setStage(STAGES.COMPLETE)
      return
    }

    setGenerationProgress(`Gathering context and generating ${tasks.length} posts...`)

    try {
      const thisWeekStart = getWeekStartDate(0)

      // Gather all context data (FlowFinder, Offer Builders, Validation, Voice)
      const context = await gatherContentContext(user.id)
      const voiceProfile = await fetchVoiceProfile(user.id)

      // VOICE FEEDBACK LOOP: Get feedback insights and build enhanced instructions
      // This includes corrections based on user's past feedback (e.g., "too formal" → make more casual)
      const feedbackInsights = await getVoiceFeedbackInsights(user.id)
      const voiceInstructions = voiceProfile?.data
        ? buildEnhancedVoiceInstructions(voiceProfile.data, feedbackInsights)
        : ''

      // Generate content for each task
      let generated = 0
      for (const task of tasks) {
        const contentType = TASK_TO_CONTENT_TYPE[task.task_type] || 'educational'
        const platform = (task.platform || 'instagram').toLowerCase().replace('/', '_')

        setGenerationProgress(`Generating ${generated + 1}/${tasks.length}: ${task.task_type}...`)

        try {
          // STORY MEMORY: Auto-select relevant stories for this content type
          // Stories are selected based on: relevance, recency (not used in 7 days), performance
          const storiesResult = await selectStoriesForContent(user.id, contentType, 3)
          const stories = storiesResult.data || []
          const storyMemoryContext = buildStoryMemoryContext(stories)

          // Get quick context for this task (user's brain dump)
          const quickContext = quickContexts[task.id] || ''

          // Build additional instructions combining everything
          let additionalInstructions = voiceInstructions

          if (storyMemoryContext) {
            additionalInstructions += `\n\n${storyMemoryContext}`
          }

          if (quickContext) {
            additionalInstructions += `\n\nUSER'S SPECIFIC DIRECTION FOR THIS POST:\n${quickContext}\n\nIMPORTANT: Use the above context as the primary inspiration for this specific piece of content. Weave in these specific details, examples, or angles.`
          }

          // Call content generator edge function
          const response = await supabase.functions.invoke('content-generator', {
            body: {
              action: 'generate',
              contentType,
              platform,
              context,
              additionalInstructions,
              useHaiku: false // Use Sonnet for better quality
            }
          })

          if (response.data?.content) {
            // Save to content_history as draft for approval
            const { data: contentRecord } = await supabase.from('content_history').insert({
              user_id: user.id,
              content: response.data.content,
              content_type: contentType,
              platform,
              status: 'draft',
              review_status: 'pending',
              scheduled_date: task.scheduled_date || thisWeekStart,
              stories_used: stories.map(s => s.id), // Track which stories were used
              context_used: {
                ...response.data.contextUsed,
                hasStoryBank: stories.length > 0,
                hasQuickContext: !!quickContext,
                storiesUsed: stories.length
              },
              metadata: {
                task_id: task.id,
                task_type: task.task_type,
                generated_by: 'weekly_planning',
                quick_context: quickContext || null
              }
            }).select('id').single()

            // Log stories used for performance tracking
            if (contentRecord?.id && stories.length > 0) {
              await logStoriesUsed(contentRecord.id, stories.map(s => s.id))
            }

            // Also update the marketing_task with quick_context if provided
            if (quickContext) {
              await supabase
                .from('marketing_tasks')
                .update({ quick_context: quickContext, quick_context_used: true })
                .eq('id', task.id)
            }

            generated++
          }
        } catch (taskErr) {
          console.error(`Error generating content for task ${task.id}:`, taskErr)
          // Continue with other tasks
        }
      }

      setGenerationProgress(`Done! Generated ${generated} content drafts.`)
      await new Promise(resolve => setTimeout(resolve, 800))
      setStage(STAGES.COMPLETE)
    } catch (err) {
      console.error('Error generating week:', err)
      setError('Failed to generate content. Please try again.')
      setStage(STAGES.PREVIEW)
    }
  }

  // Loading state
  if (stage === STAGES.LOADING) {
    return (
      <div className="weekly-planning">
        <div className="wps-loading">
          <div className="wps-spinner"></div>
          <p>Loading your weekly data...</p>
        </div>
      </div>
    )
  }

  // Stage 1: Review Last Week
  if (stage === STAGES.REVIEW) {
    const taskBreakdown = getTaskBreakdown()

    return (
      <div className="weekly-planning">
        <div className="wps-content">
          <div className="wps-header">
            <span className="wps-step">Step 1 of 3</span>
            <h1>Review Last Week</h1>
            <p className="wps-philosophy">
              "You don't rise to the level of your goals, you fall to the level of your systems."
            </p>
          </div>

          {lastWeekData ? (
            <>
              {/* Execution Score */}
              <div className={`wps-score-card ${getScoreColor(executionScore)}`}>
                <div className="wps-score-header">
                  <span className="wps-score-label">System Execution Score</span>
                  <span className="wps-week-label">{lastWeekData.weekInfo?.label}</span>
                </div>
                <div className="wps-score-value">{executionScore}%</div>
                <div className="wps-score-detail">
                  {lastWeekData.completed} of {lastWeekData.total} tasks completed
                </div>
                <div className="wps-score-bar">
                  <div
                    className="wps-score-fill"
                    style={{ width: `${executionScore}%` }}
                  ></div>
                </div>
                <p className="wps-score-message">{getScoreMessage(executionScore)}</p>
              </div>

              {/* Task Breakdown */}
              {taskBreakdown.length > 0 && (
                <div className="wps-breakdown">
                  <h3>Breakdown by Task Type</h3>
                  <div className="wps-breakdown-list">
                    {taskBreakdown.map(item => (
                      <div key={item.type} className="wps-breakdown-item">
                        <span className="wps-breakdown-type">{item.type}</span>
                        <span className="wps-breakdown-stats">
                          {item.completed}/{item.total}
                          <span className={`wps-breakdown-rate ${getScoreColor(item.rate)}`}>
                            {item.rate}%
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="wps-no-data">
              <span className="wps-no-data-icon">📊</span>
              <h3>No data from last week</h3>
              <p>This might be your first week, or no tasks were scheduled.</p>
            </div>
          )}

          <div className="wps-actions">
            <button
              className="wps-primary-btn"
              onClick={() => setStage(STAGES.ADJUST)}
            >
              Continue to Strategy →
            </button>
            <button
              className="wps-skip-btn"
              onClick={onSkip}
            >
              Skip Planning
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Stage 2: Adjust Strategy
  if (stage === STAGES.ADJUST) {
    return (
      <div className="weekly-planning">
        <div className="wps-content">
          <div className="wps-header">
            <span className="wps-step">Step 2 of 3</span>
            <h1>Adjust Your System</h1>
            <p className="wps-subtitle">
              Based on last week's {executionScore}% execution, do you want to adjust?
            </p>
          </div>

          {strategy ? (
            <div className="wps-strategy-review">
              {/* Current Strategy Summary */}
              <div className="wps-current-strategy">
                <h3>Current System</h3>
                <div className="wps-strategy-items">
                  <div className="wps-strategy-item">
                    <span className="wps-strategy-label">Posting Days</span>
                    <span className="wps-strategy-value">
                      {(strategy.selected_days || ['Monday', 'Wednesday', 'Friday']).join(', ')}
                    </span>
                  </div>
                  <div className="wps-strategy-item">
                    <span className="wps-strategy-label">Primary Platform</span>
                    <span className="wps-strategy-value">{strategy.primary_platform || 'Not set'}</span>
                  </div>
                  <div className="wps-strategy-item">
                    <span className="wps-strategy-label">Time Per Day</span>
                    <span className="wps-strategy-value">{strategy.minutes_per_day || 60} minutes</span>
                  </div>
                </div>
              </div>

              {/* Quick Adjustments */}
              <div className="wps-adjustments">
                <h3>Quick Adjustments</h3>

                {executionScore < 60 && (
                  <div className="wps-suggestion">
                    <span className="wps-suggestion-icon">💡</span>
                    <p>Your execution was below 60%. Consider reducing posting days to build consistency first.</p>
                  </div>
                )}

                <div className="wps-adjustment-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={adjustments.reduceFrequency || false}
                      onChange={(e) => handleAdjustment('reduceFrequency', e.target.checked)}
                    />
                    <span>Reduce to fewer posting days this week</span>
                  </label>
                </div>

                <div className="wps-adjustment-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={adjustments.keepSame || false}
                      onChange={(e) => handleAdjustment('keepSame', e.target.checked)}
                    />
                    <span>Keep the same system (I can do better)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="wps-no-strategy">
              <p>No strategy found. You'll set one up after planning.</p>
            </div>
          )}

          <div className="wps-actions">
            <button
              className="wps-primary-btn"
              onClick={saveAdjustments}
            >
              Continue to Generation →
            </button>
            <button
              className="wps-back-btn"
              onClick={() => setStage(STAGES.REVIEW)}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Stage 3: Preview Tasks with Quick Context
  if (stage === STAGES.PREVIEW) {
    const tasksWithContext = plannedTasks.filter(t => quickContexts[t.id]?.trim())

    return (
      <div className="weekly-planning">
        <div className="wps-content">
          <div className="wps-header">
            <span className="wps-step">Step 3 of 3</span>
            <h1>Preview & Add Context</h1>
            <p className="wps-subtitle">
              Have something specific in mind? Add context for better AI content.
            </p>
          </div>

          {loadingTasks ? (
            <div className="wps-loading">
              <div className="wps-spinner"></div>
              <p>Loading your posts...</p>
            </div>
          ) : (
            <>
              {/* Quick Context Info */}
              <div className="wps-context-info">
                <span className="wps-info-icon">💡</span>
                <p>
                  <strong>Quick Context</strong> lets you add a brain dump for any post.
                  Type or speak what you're thinking - a client story, an angle, a quote.
                  AI will use your context as the primary inspiration.
                </p>
              </div>

              {/* Tasks List */}
              <div className="wps-tasks-preview">
                {plannedTasks.map(task => {
                  const isExpanded = expandedTask === task.id
                  const hasContext = quickContexts[task.id]?.trim()
                  const inputMode = inputModes[task.id] || 'type'

                  return (
                    <div key={task.id} className={`wps-task-card ${isExpanded ? 'expanded' : ''} ${hasContext ? 'has-context' : ''}`}>
                      <div className="wps-task-header" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                        <div className="wps-task-info">
                          <span className="wps-task-day">{getDayName(task.scheduled_date)}</span>
                          <span className="wps-task-type">{task.task_type}</span>
                          <span className="wps-task-platform">{task.platform}</span>
                        </div>
                        <div className="wps-task-status">
                          {hasContext && <span className="wps-context-badge">Context Added</span>}
                          <span className="wps-expand-icon">{isExpanded ? '−' : '+'}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="wps-task-context">
                          {/* Input Mode Toggle */}
                          <div className="wps-input-toggle">
                            <button
                              type="button"
                              className={`wps-toggle-btn ${inputMode === 'type' ? 'active' : ''}`}
                              onClick={() => toggleInputMode(task.id, 'type')}
                            >
                              ⌨️ Type
                            </button>
                            <button
                              type="button"
                              className={`wps-toggle-btn ${inputMode === 'speak' ? 'active' : ''}`}
                              onClick={() => toggleInputMode(task.id, 'speak')}
                            >
                              🎤 Speak
                            </button>
                          </div>

                          {/* Voice Recorder */}
                          {inputMode === 'speak' && (
                            <VoiceRecorder
                              onTranscript={(text) => updateQuickContext(task.id, text)}
                              existingText={quickContexts[task.id] || ''}
                              placeholder="Click the microphone and share your thoughts..."
                            />
                          )}

                          {/* Text Input */}
                          <textarea
                            className="wps-context-input"
                            value={quickContexts[task.id] || ''}
                            onChange={(e) => updateQuickContext(task.id, e.target.value)}
                            placeholder={inputMode === 'speak'
                              ? 'Your words will appear here...'
                              : 'Brain dump: a story to tell, specific angle, client win, quote, or anything you want the AI to use...'
                            }
                            rows={4}
                          />

                          <p className="wps-context-hint">
                            Leave empty to let AI generate freely from your flows and Story Bank.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div className="wps-preview-summary">
                <div className="wps-summary-stat">
                  <span className="wps-stat-value">{plannedTasks.length}</span>
                  <span className="wps-stat-label">Posts</span>
                </div>
                <div className="wps-summary-stat">
                  <span className="wps-stat-value">{tasksWithContext.length}</span>
                  <span className="wps-stat-label">With Context</span>
                </div>
              </div>

              {error && (
                <div className="wps-error">
                  <p>{error}</p>
                </div>
              )}

              <div className="wps-actions">
                <button
                  className="wps-primary-btn wps-generate-btn"
                  onClick={handleGenerate}
                  disabled={plannedTasks.length === 0}
                >
                  Generate Content →
                </button>
                <button
                  className="wps-back-btn"
                  onClick={() => setStage(STAGES.ADJUST)}
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Legacy GENERATE stage (kept for backwards compatibility)
  if (stage === STAGES.GENERATE) {
    // Redirect to PREVIEW if we get here
    loadPreviewTasks()
    return (
      <div className="weekly-planning">
        <div className="wps-loading">
          <div className="wps-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Generating state
  if (stage === STAGES.GENERATING) {
    return (
      <div className="weekly-planning">
        <div className="wps-content wps-generating">
          <div className="wps-spinner large"></div>
          <h2>Creating Your Week</h2>
          <p className="wps-progress-text">{generationProgress}</p>
        </div>
      </div>
    )
  }

  // Complete state
  if (stage === STAGES.COMPLETE) {
    return (
      <div className="weekly-planning">
        <div className="wps-content wps-complete">
          <div className="wps-complete-icon">🎉</div>
          <h1>You're All Set!</h1>
          <p>Your tasks for this week have been created.</p>
          <p className="wps-complete-tip">
            Check your daily task board to see today's content.
          </p>
          <button
            className="wps-primary-btn"
            onClick={onComplete}
          >
            View My Tasks →
          </button>
        </div>
      </div>
    )
  }

  return null
}
