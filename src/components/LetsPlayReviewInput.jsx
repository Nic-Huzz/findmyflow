/**
 * LetsPlayReviewInput - Review quest for Let's Play completions
 *
 * Unlocks after 3+ Let's Play completions. Shows past plays,
 * helps users identify patterns, and plan their next experiment.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useSteppedForm } from '../hooks/useSteppedForm'
import { StepProgress, IconGrid } from './QuestInputShared'
import { supabase } from '../lib/supabaseClient'
import { SKILLS_SEGMENTS, PROBLEM_SEGMENTS } from '../lib/wheelTaxonomy'
import './LetsPlayInput.css'

// Quest IDs handled by this component
export const LETS_PLAY_REVIEW_QUEST_IDS = ['lets_play_review']

// Flow direction display
const FLOW_DIRECTIONS = {
  north: { icon: '🟢', label: 'Flow', color: '#22c55e' },
  east: { icon: '🔵', label: 'Redirect', color: '#3b82f6' },
  south: { icon: '🔴', label: 'Rest', color: '#ef4444' },
  west: { icon: '🟡', label: 'Honour', color: '#eab308' }
}

// Next play options
const NEXT_PLAY_OPTIONS = [
  { id: 'same_combo_different', label: 'Same combo, different person', icon: '🔄', description: "Double down on what's working" },
  { id: 'different_combo', label: 'Different combo', icon: '🔀', description: 'Try a new skill × problem mix' },
  { id: 'level_up', label: 'Level up', icon: '⬆️', description: 'Same combo, bigger ask or stranger' },
  { id: 'something_new', label: 'Something new', icon: '💡', description: 'I have a new idea to test' }
]

// Initial form data
const INITIAL_REVIEW_DATA = {
  bestCombo: null,
  patternReflection: '',
  nextPlayType: null,
  nextPlayDescription: ''
}

function LetsPlayReviewInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [pastPlays, setPastPlays] = useState([])
  const [loading, setLoading] = useState(true)

  // Validation function
  const validateStep = useCallback((currentStep, data) => {
    switch (currentStep) {
      case 1: return pastPlays.length >= 3
      case 2: return data.bestCombo !== null && data.patternReflection.trim().length >= 10
      case 3: return data.nextPlayType !== null
      default: return false
    }
  }, [pastPlays.length])

  // Build structured data for submission
  const buildStructuredData = useCallback((data) => {
    return {
      quest_type: 'lets_play_review',
      total_plays_reviewed: pastPlays.length,
      best_combo: data.bestCombo,
      pattern_reflection: data.patternReflection,
      next_play_type: data.nextPlayType,
      next_play_description: data.nextPlayDescription || null
    }
  }, [pastPlays.length])

  const {
    step,
    formData,
    isSubmitting,
    canContinue,
    handleNext,
    handleBack,
    updateField,
    handleSubmit
  } = useSteppedForm({
    totalSteps: 3,
    initialData: INITIAL_REVIEW_DATA,
    validateStep,
    onSubmit: (data) => onComplete(quest, buildStructuredData(data))
  })

  // Load past Let's Play completions
  useEffect(() => {
    const loadPlays = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('quest_completions')
          .select('id, reflection_text, created_at')
          .eq('user_id', user.id)
          .eq('quest_id', 'lets_play')
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('Error loading past plays:', error)
          return
        }

        // Parse structured data from reflection_text
        const parsed = (data || []).map(completion => {
          try {
            const reflection = typeof completion.reflection_text === 'string'
              ? JSON.parse(completion.reflection_text)
              : completion.reflection_text
            return {
              id: completion.id,
              createdAt: completion.created_at,
              ...reflection
            }
          } catch {
            return null
          }
        }).filter(Boolean)

        setPastPlays(parsed)
      } catch (err) {
        console.warn('LetsPlayReviewInput load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPlays()
  }, [user?.id])

  // Get unique combos with outcome summaries
  const uniqueCombos = useMemo(() => {
    const comboMap = new Map()

    pastPlays.forEach(play => {
      const key = `${play.skill_id}__${play.problem_id}`
      if (!comboMap.has(key)) {
        comboMap.set(key, {
          key,
          skillId: play.skill_id,
          problemId: play.problem_id,
          skillName: play.skill_name,
          problemName: play.problem_name,
          plays: [],
          outcomes: {}
        })
      }
      const combo = comboMap.get(key)
      combo.plays.push(play)
      combo.outcomes[play.outcome_rating] = (combo.outcomes[play.outcome_rating] || 0) + 1
    })

    return Array.from(comboMap.values())
  }, [pastPlays])

  // Get outcome label
  const getOutcomeIcon = (rating) => {
    const map = {
      loved_it: '⭐',
      it_helped: '👍',
      mixed: '🤷',
      didnt_land: '😬',
      not_needed: '❌'
    }
    return map[rating] || '•'
  }

  // Format outcome summary for a combo
  const formatOutcomeSummary = (combo) => {
    const parts = []
    Object.entries(combo.outcomes).forEach(([rating, count]) => {
      parts.push(`${count} ${getOutcomeIcon(rating)}`)
    })
    return `${combo.plays.length} play${combo.plays.length !== 1 ? 's' : ''}: ${parts.join(', ')}`
  }

  if (loading) {
    return (
      <div className="lets-play-review">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your plays...</p>
        </div>
      </div>
    )
  }

  if (pastPlays.length < 3) {
    return (
      <div className="lets-play-review">
        <div className="lets-play-prereq">
          <span className="prereq-icon">🔒</span>
          <p>Complete 3 Let's Play quests first to unlock the review.</p>
          <p className="prereq-hint">You have {pastPlays.length}/3 plays so far.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lets-play-review stepped">
      <StepProgress currentStep={step} totalSteps={3} variant="dots" />

      <div className="step-content">
        {/* Step 1: Your Plays So Far */}
        {step === 1 && (
          <div className="step-section">
            <div className="step-header">
              <span className="step-icon">📊</span>
              <h4>Your Plays So Far</h4>
            </div>
            <p className="step-description">Here's what you've tested.</p>

            <div className="plays-list">
              {pastPlays.map(play => {
                const skillSeg = SKILLS_SEGMENTS.find(s => s.id === play.skill_id)
                const problemSeg = PROBLEM_SEGMENTS.find(p => p.id === play.problem_id)

                return (
                  <div key={play.id} className="play-card">
                    <div className="play-card-combo">
                      <span>{skillSeg?.icon || '💡'}</span>
                      <span className="play-card-skill">{play.skill_name}</span>
                      <span className="combo-x">×</span>
                      <span>{problemSeg?.icon || '🎯'}</span>
                      <span className="play-card-problem">{play.problem_name}</span>
                    </div>
                    <div className="play-card-details">
                      <span className="play-card-who">Helped {play.person_name}</span>
                      <span className="play-card-outcome">{getOutcomeIcon(play.outcome_rating)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Spot Your Patterns */}
        {step === 2 && (
          <div className="step-section">
            <div className="step-header">
              <span className="step-icon">🔍</span>
              <h4>Spot Your Patterns</h4>
            </div>
            <p className="step-description">Look at your plays together. What patterns are emerging?</p>

            <div className="step-subsection">
              <label className="input-label">Which combo felt most like you?</label>
              <div className="combo-selector">
                {uniqueCombos.map(combo => {
                  const skillSeg = SKILLS_SEGMENTS.find(s => s.id === combo.skillId)
                  const problemSeg = PROBLEM_SEGMENTS.find(p => p.id === combo.problemId)

                  return (
                    <button
                      key={combo.key}
                      type="button"
                      className={`combo-option ${formData.bestCombo === combo.key ? 'selected' : ''}`}
                      onClick={() => updateField('bestCombo', combo.key)}
                    >
                      <div className="combo-option-header">
                        <span>{skillSeg?.icon || '💡'} {combo.skillName}</span>
                        <span className="combo-x">×</span>
                        <span>{problemSeg?.icon || '🎯'} {combo.problemName}</span>
                      </div>
                      <div className="combo-option-summary">
                        {formatOutcomeSummary(combo)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="step-subsection">
              <label className="input-label">What's becoming clear about your direction?</label>
              <textarea
                className="lets-play-textarea"
                placeholder="What are you starting to see about where you belong?"
                value={formData.patternReflection}
                onChange={(e) => updateField('patternReflection', e.target.value)}
                rows={3}
              />
              {(() => {
                const len = (formData.patternReflection || '').trim().length
                if (len >= 10) return <span className="char-hint met">Ready to continue</span>
                return <span className="char-hint">{len}/10 characters minimum</span>
              })()}
            </div>
          </div>
        )}

        {/* Step 3: Your Next Play */}
        {step === 3 && (
          <div className="step-section">
            <div className="step-header">
              <span className="step-icon">🎯</span>
              <h4>Your Next Play</h4>
            </div>
            <p className="step-description">Based on what you've learned, what's the next experiment?</p>

            <div className="step-subsection">
              <label className="input-label">What will you test next?</label>
              <div className="next-play-grid">
                {NEXT_PLAY_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={`next-play-card ${formData.nextPlayType === option.id ? 'selected' : ''}`}
                    onClick={() => updateField('nextPlayType', option.id)}
                  >
                    <span className="next-play-icon">{option.icon}</span>
                    <span className="next-play-label">{option.label}</span>
                    <span className="next-play-desc">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="step-subsection">
              <label className="input-label">Describe your next play <span className="optional-tag">(optional)</span></label>
              <textarea
                className="lets-play-textarea"
                placeholder="What's the experiment? (optional)"
                value={formData.nextPlayDescription}
                onChange={(e) => updateField('nextPlayDescription', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        {step > 1 && (
          <button className="nav-btn back" onClick={handleBack}>
            ← Back
          </button>
        )}
        {step < 3 ? (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={!canContinue()}
          >
            Continue →
          </button>
        ) : (
          <button
            className="nav-btn complete"
            onClick={handleSubmit}
            disabled={isSubmitting || !canContinue()}
          >
            {isSubmitting ? 'Saving...' : 'Complete Review ✨'}
          </button>
        )}
      </div>
    </div>
  )
}

export default LetsPlayReviewInput
