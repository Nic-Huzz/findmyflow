import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import CompassCheckin from '../CompassCheckin'
import confetti from 'canvas-confetti'
import '../../components/GroanCompletionModal.css'

export default function MilestoneReflectModal({ level, milestone, commitment, userId, onComplete, onClose }) {
  const [step, setStep] = useState('reflect') // 'reflect' | 'compass'
  const [reflection, setReflection] = useState('')
  const [diagonalScore, setDiagonalScore] = useState(5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleReflectionSubmit = async () => {
    if (!reflection.trim() || saving) return
    setSaving(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from('user_level_progress')
        .upsert({
          user_id: userId,
          current_level: level,
          milestone_completed: true,
          milestone_reflection: reflection.trim(),
          milestone_diagonal_score: diagonalScore,
        }, { onConflict: 'user_id,current_level' })

      if (dbError) throw dbError
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      setStep('compass')
    } catch (err) {
      console.error('Error saving milestone reflection:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCompassComplete = async (compassData) => {
    try {
      await supabase.from('flow_entries').insert({
        user_id: userId,
        direction: compassData.direction,
        internal_state: compassData.internal_state,
        external_state: compassData.external_state,
        note: compassData.reasoning || null,
        project_id: null,
      })
    } catch (err) {
      console.warn('Error saving compass:', err)
    }
    onComplete?.()
    onClose()
  }

  const handleCompassSkip = () => {
    onComplete?.()
    onClose()
  }

  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={onClose}>&times;</button>

        {step === 'reflect' && (
          <>
            <h2 className="gcm-title">I Did It!</h2>
            <p className="gcm-subtitle">{commitment}</p>

            <div className="gcm-form">
              <div className="gcm-textarea-group">
                <label>What happened?</label>
                <textarea
                  placeholder="Describe your experience..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="gcm-slider-group">
                <label>
                  How close to the diagonal did it feel? <span className="gcm-score">{diagonalScore}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={diagonalScore}
                  onChange={(e) => setDiagonalScore(parseInt(e.target.value))}
                />
              </div>

              {error && <div className="gcm-error">{error}</div>}

              <button
                className="gcm-gold-btn"
                onClick={handleReflectionSubmit}
                disabled={!reflection.trim() || saving}
              >
                {saving ? 'Saving...' : 'Complete Milestone'}
              </button>
            </div>
          </>
        )}

        {step === 'compass' && (
          <CompassCheckin
            onComplete={handleCompassComplete}
            onSkip={handleCompassSkip}
            challengeTitle={`Level ${level} Milestone: ${milestone.text}`}
          />
        )}
      </div>
    </div>
  )
}
