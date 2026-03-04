/**
 * PriorityLayerCard.jsx
 *
 * Gold-bordered card displaying the user's current priority layer.
 * Shows river emoji, layer name, description, and focus area.
 *
 * Created: 2026-03-04
 */

import { TENSION_LAYER_DISPLAY } from '../lib/onboardingV2'

export default function PriorityLayerCard({ layer, onReassess }) {
  const display = TENSION_LAYER_DISPLAY[layer]
  if (!display) return null

  return (
    <div className="pt-layer-card">
      <span className="pt-layer-emoji">{display.emoji}</span>
      <div className="pt-layer-info">
        <span className="pt-layer-eyebrow">Your Priority</span>
        <div className="pt-layer-name">{display.riverElement} — {display.name}</div>
        <div className="pt-layer-desc">{display.description}</div>
        <div className="pt-layer-focus" style={{ color: display.color }}>
          Focus: {display.appFeature}
        </div>
      </div>
      {onReassess && (
        <button className="pt-layer-reassess" onClick={onReassess}>
          Reassess
        </button>
      )}
    </div>
  )
}
