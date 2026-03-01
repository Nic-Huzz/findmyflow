import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import './VoiceDropdown.css'

function VoiceDropdown({ questId, userId, projectId, userArchetypes }) {
  const [openType, setOpenType] = useState(null) // 'essence' | 'protective' | null
  const [essenceText, setEssenceText] = useState('')
  const [protectiveText, setProtectiveText] = useState('')
  const [essenceSaved, setEssenceSaved] = useState(false)
  const [protectiveSaved, setProtectiveSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const essenceName = userArchetypes?.essence || 'Essence'
  const protectiveName = userArchetypes?.protective || 'Protective'

  // Check for existing completions on mount
  useEffect(() => {
    if (!userId || !questId) return
    async function checkExisting() {
      const { data } = await supabase
        .from('quest_completions')
        .select('quest_id')
        .eq('user_id', userId)
        .in('quest_id', [
          `inline_voice_${questId}_essence`,
          `inline_voice_${questId}_protective`
        ])
      if (data) {
        data.forEach(row => {
          if (row.quest_id.endsWith('_essence')) setEssenceSaved(true)
          if (row.quest_id.endsWith('_protective')) setProtectiveSaved(true)
        })
      }
    }
    checkExisting()
  }, [userId, questId])

  const handleToggle = useCallback((type) => {
    setOpenType(prev => prev === type ? null : type)
  }, [])

  const handleSave = useCallback(async (type) => {
    // Guard: prevent duplicate saves
    if (type === 'essence' && essenceSaved) return
    if (type === 'protective' && protectiveSaved) return

    const text = type === 'essence' ? essenceText : protectiveText
    if (!text.trim() || saving) return

    setSaving(true)
    const voiceQuestId = `inline_voice_${questId}_${type}`

    const { error } = await supabase
      .from('quest_completions')
      .insert([{
        user_id: userId,
        quest_id: voiceQuestId,
        quest_category: 'Healing',
        quest_type: 'recognise',
        points_earned: 3,
        challenge_instance_id: null,
        challenge_day: 0,
        project_id: projectId || null,
        stage: null,
        reflection_text: JSON.stringify({
          voice_type: type,
          source_quest: questId,
          archetype: type === 'essence' ? essenceName : protectiveName,
          text: text.trim()
        })
      }])

    setSaving(false)

    if (error) {
      console.error('Error saving voice:', error)
      return
    }

    if (type === 'essence') {
      setEssenceSaved(true)
    } else {
      setProtectiveSaved(true)
    }
    setOpenType(null)

    // Increment scores via RPC
    try {
      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: 'healing',
        p_points: 3,
        p_week_start: getWeekStartLocal()
      })
    } catch (e) {
      console.warn('Score increment failed:', e)
    }

    // Reload page after brief delay so user sees the green dot before score refreshes
    setTimeout(() => window.location.reload(), 800)
  }, [questId, userId, projectId, essenceText, protectiveText, essenceName, protectiveName, essenceSaved, protectiveSaved, saving])

  return (
    <div className="voice-dropdown-section">
      <div className="voice-pill-row">
        <button
          className={`voice-pill essence ${openType === 'essence' ? 'active' : ''} ${essenceSaved ? 'saved' : ''}`}
          onClick={essenceSaved ? undefined : () => handleToggle('essence')}
          disabled={essenceSaved}
        >
          <span className={`voice-pill-dot ${essenceSaved ? 'filled' : ''}`} />
          {essenceSaved && <span className="voice-pill-icon">✓</span>}
          <span className="voice-pill-label">{essenceSaved ? 'Saved' : essenceName}</span>
          {!essenceSaved && (
            <svg className={`voice-pill-chevron ${openType === 'essence' ? 'open' : ''}`} width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <button
          className={`voice-pill protective ${openType === 'protective' ? 'active' : ''} ${protectiveSaved ? 'saved' : ''}`}
          onClick={protectiveSaved ? undefined : () => handleToggle('protective')}
          disabled={protectiveSaved}
        >
          <span className={`voice-pill-dot ${protectiveSaved ? 'filled' : ''}`} />
          {protectiveSaved && <span className="voice-pill-icon">✓</span>}
          <span className="voice-pill-label">{protectiveSaved ? 'Saved' : protectiveName}</span>
          {!protectiveSaved && (
            <svg className={`voice-pill-chevron ${openType === 'protective' ? 'open' : ''}`} width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {openType && (
        <div className={`voice-input-panel ${openType}`}>
          <div className="voice-input-prompt">
            {openType === 'essence'
              ? `How did your ${essenceName} show up in this?`
              : `What is your ${protectiveName} saying?`}
          </div>
          <textarea
            className="voice-input-textarea"
            placeholder={openType === 'essence'
              ? 'I feel excited because...'
              : "I'm worried that..."}
            value={openType === 'essence' ? essenceText : protectiveText}
            onChange={(e) => openType === 'essence'
              ? setEssenceText(e.target.value)
              : setProtectiveText(e.target.value)}
            rows={3}
          />
          <div className="voice-input-actions">
            <button
              className={`voice-save-btn ${openType}`}
              onClick={() => handleSave(openType)}
              disabled={saving || !(openType === 'essence' ? essenceText.trim() : protectiveText.trim())}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceDropdown
