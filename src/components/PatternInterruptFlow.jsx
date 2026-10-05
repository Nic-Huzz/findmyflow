/**
 * PatternInterruptFlow — Single-screen voice rescript.
 * Fires after a protective voice is identified (stall log or courage challenge gap).
 * User picks a voice-specific rescript pill or writes their own.
 *
 * CSS prefix: pif-
 */

import { useState } from 'react'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './PatternInterruptFlow.css'

const VOICE_RESCRIPTS = {
  ghost:          { icon: '👻', label: 'Ghost',          rescript: '...be seen' },
  perfectionist:  { icon: '🎯', label: 'Perfectionist',  rescript: '...start before I\'m ready' },
  people_pleaser: { icon: '🪞', label: 'People Pleaser', rescript: '...honour what I need' },
  controller:     { icon: '🎮', label: 'Controller',     rescript: '...let go and trust' },
  auto_pilot:     { icon: '🛋️', label: 'Auto-Pilot',     rescript: '...show up fully' },
}

export default function PatternInterruptFlow({ voice, onComplete, onSkip }) {
  const [selected, setSelected] = useState(voice)
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState('')

  const voiceData = VOICE_RESCRIPTS[voice]
  if (!voiceData) return null

  const rescriptText = selected === 'custom'
    ? customText.trim()
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
