/**
 * Story Bank Component
 * UI for managing the library of reusable content
 * Supports text input, voice recording, and AI Interview Mode
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import {
  STORY_CATEGORIES,
  INTERVIEW_QUESTIONS,
  fetchStoryBank,
  saveStory,
  updateStory,
  deleteStory,
  getStoryBankStats,
  getStoryGapAnalysis,
  buildStoryFromInterview
} from '../../lib/storyBank'
import VoiceRecorder from '../../flows/VoiceTraining/components/VoiceRecorder'
import StoryMiner from './StoryMiner'
import './StoryBank.css'

export default function StoryBank({ onClose, initialCategory = null }) {
  const { user } = useAuth()
  const [view, setView] = useState('list') // 'list', 'add', 'edit', 'interview', 'mine'
  const [stories, setStories] = useState([])
  const [stats, setStats] = useState({ total: 0, byCategory: {} })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all')
  const [editingStory, setEditingStory] = useState(null)

  // Gap analysis
  const [gapAnalysis, setGapAnalysis] = useState(null)

  // Add/Edit form state
  const [formCategory, setFormCategory] = useState(initialCategory || 'transformation_story')
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [inputMode, setInputMode] = useState('type') // 'type', 'speak', 'interview'
  const [saving, setSaving] = useState(false)

  // Interview mode state
  const [interviewStep, setInterviewStep] = useState(0)
  const [interviewAnswers, setInterviewAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadStories()
      loadStats()
    }
  }, [user?.id])

  async function loadStories() {
    setLoading(true)
    const category = selectedCategory === 'all' ? null : selectedCategory
    const { data } = await fetchStoryBank(user.id, category)
    setStories(data)
    setLoading(false)
  }

  async function loadStats() {
    const statsData = await getStoryBankStats(user.id)
    setStats(statsData)

    // Also load gap analysis
    const gaps = await getStoryGapAnalysis(user.id)
    setGapAnalysis(gaps)
  }

  useEffect(() => {
    if (user?.id) {
      loadStories()
    }
  }, [selectedCategory])

  function handleAddNew(category = null, useInterview = false) {
    setFormCategory(category || 'transformation_story')
    setFormTitle('')
    setFormContent('')
    setEditingStory(null)
    setInterviewStep(0)
    setInterviewAnswers({})
    setCurrentAnswer('')
    setInputMode(useInterview ? 'interview' : 'type')
    setView(useInterview ? 'interview' : 'add')
  }

  // Interview mode handlers
  function handleInterviewNext() {
    const questions = INTERVIEW_QUESTIONS[formCategory] || []
    const currentQ = questions[interviewStep]

    if (currentAnswer.trim()) {
      setInterviewAnswers(prev => ({
        ...prev,
        [currentQ.id]: currentAnswer.trim()
      }))
    }

    if (interviewStep < questions.length - 1) {
      setInterviewStep(interviewStep + 1)
      setCurrentAnswer('')
    } else {
      // Interview complete - build story and go to review
      const answers = { ...interviewAnswers, [currentQ.id]: currentAnswer.trim() }
      const storyContent = buildStoryFromInterview(formCategory, answers)
      setFormContent(storyContent)
      setView('add')
      setInputMode('type') // Switch to edit mode for review
    }
  }

  function handleInterviewBack() {
    if (interviewStep > 0) {
      const questions = INTERVIEW_QUESTIONS[formCategory] || []
      const prevQ = questions[interviewStep - 1]
      setCurrentAnswer(interviewAnswers[prevQ.id] || '')
      setInterviewStep(interviewStep - 1)
    }
  }

  function handleInterviewVoice(transcript) {
    setCurrentAnswer(transcript)
  }

  function handleEdit(story) {
    setFormCategory(story.category)
    setFormTitle(story.title || '')
    setFormContent(story.content)
    setEditingStory(story)
    setView('edit')
  }

  async function handleSave() {
    if (!formContent.trim()) return

    setSaving(true)

    if (editingStory) {
      await updateStory(editingStory.id, {
        category: formCategory,
        title: formTitle.trim() || null,
        content: formContent.trim()
      })
    } else {
      await saveStory(user.id, formCategory, formContent.trim(), formTitle.trim() || null)
    }

    setSaving(false)
    setView('list')
    loadStories()
    loadStats()
  }

  async function handleDelete(storyId) {
    if (!confirm('Delete this story? This cannot be undone.')) return

    await deleteStory(storyId)
    loadStories()
    loadStats()
  }

  function handleVoiceTranscript(transcript) {
    setFormContent(transcript)
  }

  const categoryConfig = STORY_CATEGORIES[formCategory]
  const categories = Object.entries(STORY_CATEGORIES)

  // List View
  if (view === 'list') {
    return (
      <div className="story-bank">
        <div className="sb-header">
          <div className="sb-header-content">
            <h2>📚 Story Bank</h2>
            <p>Your library of stories, takes, and examples for AI-powered content</p>
          </div>
          {onClose && (
            <button className="sb-close-btn" onClick={onClose}>×</button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="sb-stats">
          <div className="sb-stat-total">
            <span className="sb-stat-num">{stats.total}</span>
            <span className="sb-stat-label">Total Stories</span>
          </div>
          <div className="sb-stat-categories">
            {categories.slice(0, 5).map(([key, config]) => (
              <div key={key} className="sb-stat-cat">
                <span className="sb-stat-icon">{config.icon}</span>
                <span className="sb-stat-count">{stats.byCategory[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="sb-filter">
          <button
            className={`sb-filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map(([key, config]) => (
            <button
              key={key}
              className={`sb-filter-btn ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        {/* Gap Analysis Alert */}
        {gapAnalysis && gapAnalysis.gaps.length > 0 && (
          <div className="sb-gap-alert">
            <div className="sb-gap-header">
              <span className="sb-gap-icon">💡</span>
              <strong>Story Gaps Detected</strong>
            </div>
            <p>AI content works better with variety. You're missing:</p>
            <div className="sb-gap-list">
              {gapAnalysis.gaps.slice(0, 3).map(gap => (
                <button
                  key={gap.category}
                  className="sb-gap-item"
                  onClick={() => handleAddNew(gap.category, true)}
                >
                  <span>{gap.icon}</span>
                  <span>{gap.label}</span>
                  <span className="sb-gap-add">+ Add</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Buttons */}
        <div className="sb-add-buttons">
          <button className="sb-add-btn" onClick={() => handleAddNew(selectedCategory === 'all' ? null : selectedCategory)}>
            ✍️ Write Story
          </button>
          <button className="sb-interview-btn" onClick={() => handleAddNew(selectedCategory === 'all' ? null : selectedCategory, true)}>
            🎤 Interview Me
          </button>
          <button className="sb-mine-btn" onClick={() => setView('mine')}>
            🔍 Mine Stories
          </button>
        </div>

        {/* Stories List */}
        <div className="sb-list">
          {loading ? (
            <div className="sb-loading">Loading stories...</div>
          ) : stories.length === 0 ? (
            <div className="sb-empty">
              <div className="sb-empty-icon">📝</div>
              <h3>No stories yet</h3>
              <p>Add your first story to help AI generate better content</p>
              <button className="sb-empty-add" onClick={() => handleAddNew()}>
                Add Your First Story
              </button>
            </div>
          ) : (
            stories.map(story => {
              const config = STORY_CATEGORIES[story.category]
              return (
                <div key={story.id} className="sb-story-card">
                  <div className="sb-story-header">
                    <span className="sb-story-category">
                      {config?.icon} {config?.label}
                    </span>
                    {story.title && <span className="sb-story-title">{story.title}</span>}
                    <span className="sb-story-uses">Used {story.use_count}x</span>
                  </div>
                  <p className="sb-story-content">{story.content}</p>
                  <div className="sb-story-actions">
                    <button className="sb-action-btn edit" onClick={() => handleEdit(story)}>
                      ✏️ Edit
                    </button>
                    <button className="sb-action-btn delete" onClick={() => handleDelete(story.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Story Miner View
  if (view === 'mine') {
    return (
      <StoryMiner
        onClose={() => setView('list')}
        onStoryExtracted={() => {
          loadStories()
          loadStats()
        }}
      />
    )
  }

  // Interview View
  if (view === 'interview') {
    const questions = INTERVIEW_QUESTIONS[formCategory] || []
    const currentQ = questions[interviewStep]
    const progress = ((interviewStep + 1) / questions.length) * 100

    return (
      <div className="story-bank">
        <div className="sb-header">
          <button className="sb-back-btn" onClick={() => setView('list')}>
            ← Back
          </button>
          <h2>🎤 Story Interview</h2>
          {onClose && (
            <button className="sb-close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="sb-interview">
          {/* Category indicator */}
          <div className="sb-interview-category">
            <span>{categoryConfig?.icon}</span>
            <span>{categoryConfig?.label}</span>
          </div>

          {/* Progress */}
          <div className="sb-interview-progress">
            <div className="sb-progress-bar">
              <div className="sb-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="sb-progress-text">Question {interviewStep + 1} of {questions.length}</span>
          </div>

          {/* Question */}
          {currentQ && (
            <div className="sb-interview-question">
              <h3>{currentQ.question}</h3>
              <p className="sb-interview-hint">{currentQ.followUp}</p>
            </div>
          )}

          {/* Voice/Type Toggle */}
          <div className="sb-input-toggle">
            <button
              type="button"
              className={`sb-toggle-btn ${inputMode === 'interview' ? 'active' : ''}`}
              onClick={() => setInputMode('interview')}
            >
              ⌨️ Type
            </button>
            <button
              type="button"
              className={`sb-toggle-btn ${inputMode === 'speak' ? 'active' : ''}`}
              onClick={() => setInputMode('speak')}
            >
              🎤 Speak
            </button>
          </div>

          {/* Voice Recorder */}
          {inputMode === 'speak' && (
            <VoiceRecorder
              onTranscript={handleInterviewVoice}
              existingText={currentAnswer}
              placeholder="Click the microphone and answer..."
            />
          )}

          {/* Answer Input */}
          <textarea
            className="sb-interview-input"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={inputMode === 'speak' ? 'Your words will appear here...' : 'Type your answer...'}
            rows={5}
          />

          {/* Navigation */}
          <div className="sb-interview-nav">
            <button
              className="sb-nav-back"
              onClick={handleInterviewBack}
              disabled={interviewStep === 0}
            >
              ← Back
            </button>
            <button
              className="sb-nav-next"
              onClick={handleInterviewNext}
              disabled={!currentAnswer.trim()}
            >
              {interviewStep === questions.length - 1 ? 'Review Story →' : 'Next →'}
            </button>
          </div>

          {/* Skip option */}
          {currentAnswer.trim() === '' && (
            <button
              className="sb-skip-btn"
              onClick={handleInterviewNext}
            >
              Skip this question
            </button>
          )}
        </div>
      </div>
    )
  }

  // Add/Edit View
  return (
    <div className="story-bank">
      <div className="sb-header">
        <button className="sb-back-btn" onClick={() => setView('list')}>
          ← Back
        </button>
        <h2>{editingStory ? 'Edit Story' : 'Add New Story'}</h2>
        {onClose && (
          <button className="sb-close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="sb-form">
        {/* Category Selection */}
        <div className="sb-form-group">
          <label>Category</label>
          <div className="sb-category-grid">
            {categories.map(([key, config]) => (
              <button
                key={key}
                type="button"
                className={`sb-category-btn ${formCategory === key ? 'active' : ''}`}
                onClick={() => setFormCategory(key)}
              >
                <span className="sb-cat-icon">{config.icon}</span>
                <span className="sb-cat-label">{config.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Prompt */}
        {categoryConfig && (
          <div className="sb-prompt">
            <div className="sb-prompt-header">
              <span className="sb-prompt-icon">💡</span>
              <strong>{categoryConfig.label}</strong>
            </div>
            <p className="sb-prompt-text">{categoryConfig.prompt}</p>
            <div className="sb-prompt-example">
              <span className="sb-example-label">Example:</span>
              <p>{categoryConfig.example}</p>
            </div>
          </div>
        )}

        {/* Optional Title */}
        <div className="sb-form-group">
          <label>Title (optional)</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Short label for this story..."
            maxLength={100}
          />
        </div>

        {/* Input Mode Toggle */}
        <div className="sb-input-toggle">
          <button
            type="button"
            className={`sb-toggle-btn ${inputMode === 'type' ? 'active' : ''}`}
            onClick={() => setInputMode('type')}
          >
            ⌨️ Type
          </button>
          <button
            type="button"
            className={`sb-toggle-btn ${inputMode === 'speak' ? 'active' : ''}`}
            onClick={() => setInputMode('speak')}
          >
            🎤 Speak
          </button>
        </div>

        {/* Voice Recorder */}
        {inputMode === 'speak' && (
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            existingText={formContent}
            placeholder="Click the microphone and share your story..."
          />
        )}

        {/* Content Textarea */}
        <div className="sb-form-group">
          <label>Your Story</label>
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder={inputMode === 'speak'
              ? "Your spoken words will appear here..."
              : categoryConfig?.example || "Share your story..."
            }
            rows={6}
          />
          <div className="sb-char-count">
            {formContent.length} characters
          </div>
        </div>

        {/* Actions */}
        <div className="sb-form-actions">
          <button
            type="button"
            className="sb-cancel-btn"
            onClick={() => setView('list')}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sb-save-btn"
            onClick={handleSave}
            disabled={!formContent.trim() || saving}
          >
            {saving ? 'Saving...' : (editingStory ? 'Update Story' : 'Save Story')}
          </button>
        </div>
      </div>
    </div>
  )
}
