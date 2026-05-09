/**
 * NervousSystemCheckin — Universal before/after polyvagal state selector.
 *
 * mode="both"   → before + after side by side (Play-List challenges)
 * mode="before" → single column, before only (Healing pre-quest)
 * mode="after"  → single column, after only (Healing post-quest)
 *
 * Archetype selector appears when any selected state is sympathetic or dorsal.
 */

import { useEffect } from 'react'
import {
  NERVOUS_SYSTEM_STATES,
  getArchetypesForState,
  needsArchetype,
} from '../lib/nervousSystemConstants'
import './NervousSystemCheckin.css'

export default function NervousSystemCheckin({
  mode = 'both',
  beforeState = null,
  afterState = null,
  onBeforeChange,
  onAfterChange,
  protectiveArchetype = null,
  onArchetypeChange,
  onComplete,
  title,
  hideButton = false,
}) {
  const activeBefore = mode !== 'after' ? beforeState : null
  const activeAfter = mode !== 'before' ? afterState : null
  const showArchetype = needsArchetype(activeBefore, activeAfter)

  // Pick archetypes based on which state triggered the prompt
  const activeState = (activeBefore === 'sympathetic' || activeBefore === 'dorsal')
    ? activeBefore
    : activeAfter
  const archetypes = getArchetypesForState(activeState)

  // Clear archetype if it's not in the current list (e.g. switched from sympathetic to dorsal)
  useEffect(() => {
    if (protectiveArchetype && archetypes.length > 0 && !archetypes.find(a => a.id === protectiveArchetype)) {
      onArchetypeChange?.(null)
    }
  }, [activeState])

  const canContinue = (() => {
    if (mode === 'before') return !!beforeState && (!showArchetype || !!protectiveArchetype)
    if (mode === 'after') return !!afterState && (!showArchetype || !!protectiveArchetype)
    return !!beforeState && !!afterState && (!showArchetype || !!protectiveArchetype)
  })()

  const renderStateColumn = (label, value, onChange) => (
    <div className="nsci-column">
      <span className="nsci-column-label">{label}</span>
      <div className="nsci-state-options">
        {NERVOUS_SYSTEM_STATES.map((state) => (
          <button
            key={state.id}
            type="button"
            className={`nsci-state-btn ${value === state.id ? 'active' : ''} ${state.id === 'vibe_rise' ? 'nsci-vibe-rise' : ''}`}
            onClick={() => onChange(state.id)}
          >
            <span className="nsci-emoji">{state.emoji}</span>
            <span className="nsci-label">{state.label}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="nsci-container">
      {title && <h3 className="nsci-title">{title}</h3>}

      <div className={`nsci-columns ${mode === 'both' ? 'nsci-side-by-side' : ''}`}>
        {mode !== 'after' && renderStateColumn(
          mode === 'both' ? 'Before' : 'How were you feeling before?',
          beforeState,
          onBeforeChange
        )}
        {mode !== 'before' && renderStateColumn(
          mode === 'both' ? 'After' : 'How are you feeling now?',
          afterState,
          onAfterChange
        )}
      </div>

      {showArchetype && (
        <div className="nsci-archetype-section">
          <span className="nsci-archetype-label">Which voice is loudest?</span>
          <div className="nsci-archetype-grid">
            {archetypes.map((arch) => (
              <button
                key={arch.id}
                type="button"
                className={`nsci-archetype-btn ${protectiveArchetype === arch.id ? 'active' : ''}`}
                onClick={() => onArchetypeChange(arch.id)}
              >
                <span className="nsci-arch-icon">{arch.icon}</span>
                <span className="nsci-arch-name">{arch.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!hideButton && (
        <button
          type="button"
          className="nsci-continue-btn"
          disabled={!canContinue}
          onClick={onComplete}
        >
          Continue
        </button>
      )}
    </div>
  )
}
