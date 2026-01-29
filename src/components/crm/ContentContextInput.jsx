// src/components/crm/ContentContextInput.jsx
// Screen 2: Add context for each content piece

import { useState, useEffect } from 'react'
import { PHASES } from '../../lib/crm/weeklyPlanningService'
import './ContentContextInput.css'

const WEEKDAYS = [
  { id: 'Monday', short: 'Mon' },
  { id: 'Tuesday', short: 'Tue' },
  { id: 'Wednesday', short: 'Wed' },
  { id: 'Thursday', short: 'Thu' },
  { id: 'Friday', short: 'Fri' },
  { id: 'Saturday', short: 'Sat' },
  { id: 'Sunday', short: 'Sun' }
]

export default function ContentContextInput({
  items = [],
  onChange,
  onComplete,
  onBack
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localItems, setLocalItems] = useState(items)
  const [currentContext, setCurrentContext] = useState('')
  const [currentPostDay, setCurrentPostDay] = useState(null)

  useEffect(() => {
    setLocalItems(items)
    // Load context and post day for current item if they exist
    if (items[currentIndex]?.context) {
      setCurrentContext(items[currentIndex].context)
    } else {
      setCurrentContext('')
    }
    if (items[currentIndex]?.postDay) {
      setCurrentPostDay(items[currentIndex].postDay)
    } else {
      setCurrentPostDay(null)
    }
  }, [items])

  useEffect(() => {
    // When index changes, load context and post day for that item
    if (localItems[currentIndex]?.context) {
      setCurrentContext(localItems[currentIndex].context)
    } else {
      setCurrentContext('')
    }
    if (localItems[currentIndex]?.postDay) {
      setCurrentPostDay(localItems[currentIndex].postDay)
    } else {
      setCurrentPostDay(null)
    }
  }, [currentIndex, localItems])

  const currentItem = localItems[currentIndex]
  const phase = currentItem ? PHASES[currentItem.phase] : null
  const isLast = currentIndex === localItems.length - 1
  const progress = ((currentIndex + 1) / localItems.length) * 100

  const saveCurrentItem = () => {
    if (!currentContext.trim()) return false

    const updated = localItems.map((item, idx) =>
      idx === currentIndex
        ? { ...item, context: currentContext.trim(), postDay: currentPostDay }
        : item
    )
    setLocalItems(updated)
    onChange?.(updated)
    return true
  }

  const handleNext = () => {
    if (!saveCurrentItem()) return

    if (isLast) {
      onComplete(localItems.map((item, idx) =>
        idx === currentIndex
          ? { ...item, context: currentContext.trim(), postDay: currentPostDay }
          : item
      ))
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    saveCurrentItem()
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      onBack?.()
    }
  }

  const handleSkip = () => {
    // Save empty context and move on (keep postDay if set)
    const updated = localItems.map((item, idx) =>
      idx === currentIndex
        ? { ...item, context: '', postDay: currentPostDay }
        : item
    )
    setLocalItems(updated)
    onChange?.(updated)

    if (isLast) {
      onComplete(updated)
    } else {
      setCurrentIndex(currentIndex + 1)
      setCurrentContext('')
      setCurrentPostDay(null)
    }
  }

  if (!currentItem) return null

  return (
    <div className="content-context-input">
      {/* Progress Bar */}
      <div className="context-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">
          {currentIndex + 1} of {localItems.length}
        </span>
      </div>

      {/* Current Item Card */}
      <div className="current-item-card" style={{ '--phase-color': phase?.color }}>
        <div className="item-phase-badge">
          {phase?.icon} {phase?.label}
        </div>
        <div className="item-type">
          <span className="item-icon">{currentItem.icon}</span>
          <span className="item-label">{currentItem.label}</span>
        </div>
      </div>

      {/* Context Input */}
      <div className="context-form">
        <label className="context-label">
          What specific topic or angle?
        </label>
        <p className="context-hint">
          Add context to help generate better content later
        </p>
        <textarea
          value={currentContext}
          onChange={(e) => setCurrentContext(e.target.value)}
          placeholder={getPlaceholder(currentItem.type)}
          rows={4}
          autoFocus
        />
      </div>

      {/* Quick Examples */}
      <div className="context-examples">
        <span className="examples-label">Examples:</span>
        <div className="example-chips">
          {getExamples(currentItem.type).map((example, idx) => (
            <button
              key={idx}
              className="example-chip"
              onClick={() => setCurrentContext(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Posting Day Selector */}
      <div className="post-day-section">
        <label className="post-day-label">
          Which day will you post this?
        </label>
        <div className="post-day-pills">
          {WEEKDAYS.map(day => (
            <button
              key={day.id}
              className={`post-day-pill ${currentPostDay === day.id ? 'selected' : ''}`}
              onClick={() => setCurrentPostDay(currentPostDay === day.id ? null : day.id)}
            >
              {day.short}
            </button>
          ))}
        </div>
        {!currentPostDay && (
          <p className="post-day-hint">Optional - helps track your daily content schedule</p>
        )}
      </div>

      {/* Actions */}
      <div className="context-actions">
        <button className="back-btn" onClick={handlePrevious}>
          ← Back
        </button>
        <button
          className="skip-btn"
          onClick={handleSkip}
        >
          Skip
        </button>
        <button
          className="next-btn"
          onClick={handleNext}
          disabled={!currentContext.trim()}
        >
          {isLast ? 'Review Plan →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

// Helper functions for placeholders and examples
function getPlaceholder(type) {
  const placeholders = {
    behind_the_scenes: 'e.g., Working on new course module about...',
    progress_update: 'e.g., Hit 100 subscribers milestone...',
    tutorial: 'e.g., How to set up email automation in...',
    urgency: 'e.g., Early bird pricing ends Friday...',
    testimonial: 'e.g., Sarah\'s transformation story...',
    cta: 'e.g., Join the waitlist for...',
    countdown: 'e.g., 3 days until course launch...',
    case_study: 'e.g., How client X achieved Y result...',
    client_win: 'e.g., Just got this message from...',
    process: 'e.g., My 3-step framework for...',
    learnings: 'e.g., What I learned from my failed launch...',
    metrics: 'e.g., January revenue breakdown...',
    retrospective: 'e.g., Looking back at Q1...',
    custom: 'Describe your content idea...'
  }
  return placeholders[type] || 'Add context for this content...'
}

function getExamples(type) {
  const examples = {
    behind_the_scenes: ['Recording new module', 'Designing sales page', 'Testing checkout'],
    progress_update: ['Revenue milestone', 'Subscriber count', 'Course completion'],
    tutorial: ['Tool walkthrough', 'Strategy breakdown', 'Step-by-step guide'],
    urgency: ['Price increase', 'Bonus expiring', 'Limited spots'],
    testimonial: ['Client story', 'DM screenshot', 'Video testimonial'],
    cta: ['Waitlist signup', 'Book a call', 'Download free guide'],
    countdown: ['Launch day', 'Cart close', 'Live event'],
    case_study: ['Client transformation', 'Before/after', 'ROI breakdown'],
    client_win: ['Quick win share', 'Milestone celebration', 'Feedback highlight'],
    process: ['Framework reveal', 'Method breakdown', 'System overview'],
    learnings: ['Failure lesson', 'Pivot story', 'Mindset shift'],
    metrics: ['Revenue report', 'Growth stats', 'Conversion rates'],
    retrospective: ['Month review', 'Quarter analysis', 'Year in review'],
    custom: ['Your idea', 'Unique content', 'Special topic']
  }
  return examples[type] || ['Add your context']
}
