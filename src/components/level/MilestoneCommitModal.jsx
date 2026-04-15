import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import '../../components/GroanCompletionModal.css'

export default function MilestoneCommitModal({ level, milestone, diagonal, userId, onSave, onClose }) {
  const [commitment, setCommitment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    if (!commitment.trim() || saving) return
    setSaving(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from('user_level_progress')
        .upsert({
          user_id: userId,
          current_level: level,
          milestone_commitment: commitment.trim(),
        }, { onConflict: 'user_id,current_level' })

      if (dbError) throw dbError
      onSave?.(commitment.trim())
      onClose()
    } catch (err) {
      console.error('Error saving milestone commitment:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={onClose}>&times;</button>

        <h2 className="gcm-title">Your Diagonal Challenge</h2>
        <p className="gcm-subtitle">{milestone.text}</p>

        {diagonal && (
          <div style={{
            background: 'linear-gradient(135deg, #faf8ff 0%, #f3eeff 100%)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '18px',
            border: '1px solid #e9e0ff',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#5e17eb', marginBottom: '4px' }}>
              The Sweet Spot
            </div>
            <div style={{ fontSize: '14px', color: '#1a1a2e', lineHeight: 1.4 }}>
              {diagonal.name}: {diagonal.description}
            </div>
          </div>
        )}

        <div className="gcm-form">
          <div className="gcm-textarea-group">
            <label>What specific action will you take to embody this?</label>
            <textarea
              placeholder="Describe one thing you'll do to prove this level's diagonal..."
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              rows={4}
            />
          </div>

          {error && <div className="gcm-error">{error}</div>}

          <button
            className="gcm-gold-btn"
            onClick={handleSave}
            disabled={!commitment.trim() || saving}
          >
            {saving ? 'Saving...' : 'Commit to This'}
          </button>
        </div>
      </div>
    </div>
  )
}
