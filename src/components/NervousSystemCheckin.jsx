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
  BoltIcon,
  FaceSmileIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  UsersIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid'
import {
  NERVOUS_SYSTEM_STATES,
  getArchetypesForState,
  needsArchetype,
} from '../lib/nervousSystemConstants'
import './NervousSystemCheckin.css'

const NS_ICONS = {
  vibe_rise: <BoltIcon style={{ width: 22, height: 22 }} />,
  ventral: <FaceSmileIcon style={{ width: 22, height: 22 }} />,
  sympathetic: <ExclamationTriangleIcon style={{ width: 22, height: 22 }} />,
  dorsal: <MinusCircleIcon style={{ width: 22, height: 22 }} />,
}

const ARCH_ICONS = {
  Controller: <ShieldCheckIcon style={{ width: 18, height: 18 }} />,
  Ghost: <EyeSlashIcon style={{ width: 18, height: 18 }} />,
  Perfectionist: <AdjustmentsHorizontalIcon style={{ width: 18, height: 18 }} />,
  'Auto-Pilot': <CpuChipIcon style={{ width: 18, height: 18 }} />,
  'People Pleaser': <UsersIcon style={{ width: 18, height: 18 }} />,
  unsure: <QuestionMarkCircleIcon style={{ width: 18, height: 18 }} />,
}

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
  skipArchetype = false,
}) {
  const activeBefore = mode !== 'after' ? beforeState : null
  const activeAfter = mode !== 'before' ? afterState : null
  const showArchetype = !skipArchetype && needsArchetype(activeBefore, activeAfter)

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
            <span className="nsci-emoji">{NS_ICONS[state.id]}</span>
            <span className="nsci-text">
              <span className="nsci-name">{state.name}</span>
              <span className="nsci-label">{state.label}</span>
            </span>
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
          mode === 'both' ? 'During' : 'How are you feeling now?',
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
                <span className="nsci-arch-icon">{ARCH_ICONS[arch.id] || arch.icon}</span>
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
