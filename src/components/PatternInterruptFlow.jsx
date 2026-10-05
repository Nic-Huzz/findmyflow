/**
 * PatternInterruptFlow — Single-screen voice rescript.
 * Fires after a protective voice is identified (stall log or courage challenge gap).
 * User picks a voice-specific rescript pill or writes their own.
 *
 * CSS prefix: pif-
 */

import { useState, useEffect } from 'react'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { supabase } from '../lib/supabaseClient'
import './PatternInterruptFlow.css'

const VOICE_RESCRIPTS = {
  ghost:          { icon: '👻', label: 'Ghost',          rescript: '...be seen' },
  perfectionist:  { icon: '🎯', label: 'Perfectionist',  rescript: '...start before I\'m ready' },
  people_pleaser: { icon: '🪞', label: 'People Pleaser', rescript: '...honour what I need' },
  controller:     { icon: '🎮', label: 'Controller',     rescript: '...let go and trust' },
  auto_pilot:     { icon: '🛋️', label: 'Auto-Pilot',     rescript: '...show up fully' },
}

export default function PatternInterruptFlow({ voice, userId, onComplete, onSkip }) {
  const [selected, setSelected] = useState(voice)
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState('')
  const [pastRescript, setPastRescript] = useState(null)

  // Load most-used rescript for this voice (shows after 2+ uses)
  useEffect(() => {
    if (!userId || !voice) return
    let cancelled = false
    supabase
      .from('nervous_system_checkins')
      .select('drain_note')
      .eq('user_id', userId)
      .eq('checkin_type', 'stall')
      .eq('protective_voice', voice)
      .not('drain_note', 'is', null)
      .like('drain_note', '%[rescript]%')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (cancelled || !data?.length) return
        const counts = {}
        data.forEach(row => {
          const match = row.drain_note.match(/\[rescript\]\s*(.+?)(?:\n|$)/)
          if (match?.[1]) {
            const text = match[1].trim()
            counts[text] = (counts[text] || 0) + 1
          }
        })
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
        if (sorted[0] && sorted[0][1] >= 2) setPastRescript(sorted[0][0])
      })
    return () => { cancelled = true }
  }, [userId, voice])

  const voiceData = VOICE_RESCRIPTS[voice]
  if (!voiceData) return null

  const rescriptText = selected === 'custom'
    ? customText.trim()
    : selected === 'past'
      ? pastRescript
      : selected
        ? `I choose to ${VOICE_RESCRIPTS[selected]?.rescript?.replace('...', '') || selected}`
        : null

  function handleDone() {
    if (!rescriptText) return
    hapticSuccess()
    onComplete?.(rescriptText)
  }

  return (
    <div className="pif-container">
      <h4 className="pif-title">Rewire it</h4>
      <p className="pif-prompt">I'm done with that. I choose to...</p>

      <div className="pif-pills">
        {pastRescript && (
          <button
            type="button"
            className={`pif-pill pif-pill-past ${selected === 'past' ? 'selected' : ''}`}
            onClick={() => { hapticLight(); setSelected('past'); setShowCustom(false) }}
          >
            Your go-to: {pastRescript.replace(/^I choose to\s*/i, '...')}
          </button>
        )}
        {Object.entries(VOICE_RESCRIPTS).map(([id, data]) => (
          <button
            key={id}
            type="button"
            className={`pif-pill ${selected === id ? 'selected' : ''} ${id === voice ? 'pif-pill-voice' : ''}`}
            onClick={() => { hapticLight(); setSelected(id); setShowCustom(false) }}
          >
            {data.rescript}
          </button>
        ))}
      </div>

      {!showCustom ? (
        <button
          type="button"
          className="pif-custom-toggle"
          onClick={() => { hapticLight(); setShowCustom(true); setSelected('custom') }}
        >
          Write your own
        </button>
      ) : (
        <div className="pif-custom-input-wrap">
          <span className="pif-custom-prefix">I choose to</span>
          <input
            type="text"
            className="pif-custom-input"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="..."
            maxLength={100}
            autoFocus
          />
        </div>
      )}

      <div className="pif-actions">
        <button
          type="button"
          className="pif-skip"
          onClick={onSkip}
        >
          Skip
        </button>
        <button
          type="button"
          className="pif-done"
          disabled={!rescriptText}
          onClick={handleDone}
        >
          Done
        </button>
      </div>
    </div>
  )
}
