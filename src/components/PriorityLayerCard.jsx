/**
 * PriorityLayerCard.jsx
 *
 * Gold-bordered card displaying the user's current priority layer
 * with a single recommended next quest/action.
 */

import { useState } from 'react'
import { TENSION_LAYER_DISPLAY } from '../lib/onboardingV2'
import { GROAN_VISIBILITY_LAYERS } from '../lib/stageConfig'
import MobilePlaylistPicker from './MobilePlaylistPicker'

const QUEST_INFO = {
  flow_finder_skills: { name: 'Flow Finder: Skills', route: '/nikigai/skills', icon: '🎯', desc: 'Discover what you\'re naturally great at' },
  flow_finder_problems: { name: 'Flow Finder: Problems', route: '/nikigai/problems', icon: '🧩', desc: 'Find the problems you care about solving' },
  flow_finder_persona: { name: 'Flow Finder: Persona', route: '/nikigai/persona', icon: '👤', desc: 'Identify who you\'re meant to serve' },
  recognise_nervous_system: { name: 'Map Your Nervous System', route: '/nervous-system', icon: '🧠', desc: 'Find your boundaries around money and visibility' },
  recognise_limiting_belief_rewire: { name: 'Limiting Belief Rewire', route: '/limiting-belief-rewire', icon: '🔓', desc: 'Trace a limiting belief and rewire it' },
  release_weekly_big: { name: 'Big Release', route: null, icon: '💜', desc: 'Complete an extended release practice' },
}

export default function PriorityLayerCard({ layer, recommendations, onReassess, userId }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const display = TENSION_LAYER_DISPLAY[layer]
  if (!display) return null

  // Pick the single next recommended item
  let nextItem = null

  if (recommendations?.type === 'quests') {
    if (recommendations.nextQuest) {
      const info = QUEST_INFO[recommendations.nextQuest]
      if (info) nextItem = { ...info, key: recommendations.nextQuest }
    } else if (recommendations.alwaysRecommend?.length > 0) {
      const info = QUEST_INFO[recommendations.alwaysRecommend[0]]
      if (info) nextItem = { ...info, key: recommendations.alwaysRecommend[0] }
    }
  }

  if (recommendations?.type === 'playlist_layers' && recommendations.layers?.length > 0) {
    const layerObj = GROAN_VISIBILITY_LAYERS.find(l => l.id === recommendations.layers[0])
    if (layerObj) {
      nextItem = {
        key: layerObj.id,
        name: `${layerObj.label} Layer Challenge`,
        icon: layerObj.icon,
        desc: layerObj.fear,
      }
    }
  }

  return (
    <div className="pt-layer-card">
      <div className="pt-layer-top">
        <span className="pt-layer-emoji">{display.emoji}</span>
        <div className="pt-layer-info">
          <span className="pt-layer-eyebrow">Your Priority</span>
          <div className="pt-layer-name">{display.name}: <span className="pt-layer-desc-inline">{display.description}</span></div>
        </div>
        {onReassess && (
          <button className="pt-layer-reassess" onClick={onReassess}>
            Reassess
          </button>
        )}
      </div>

      {nextItem && (
        <div className="pt-layer-recs">
          <div className="pt-layer-rec-step">
            <span className="pt-layer-rec-icon">{nextItem.icon}</span>
            <div className="pt-layer-rec-body">
              <div className="pt-layer-rec-name">{nextItem.name}</div>
              <div className="pt-layer-rec-desc">{nextItem.desc}</div>
            </div>
          </div>
          {nextItem.route && (
            <a
              href={`${nextItem.route}?returnTo=/7-day-challenge`}
              className="pt-onboarding-cta"
            >
              Continue
            </a>
          )}
        </div>
      )}

      {recommendations?.type === 'playlist_layers' && userId && (
        <div className="pt-layer-recs">
          {!pickerOpen ? (
            <button className="pt-onboarding-cta" onClick={() => setPickerOpen(true)}>
              Set Challenge
            </button>
          ) : (
            <MobilePlaylistPicker
              userId={userId}
              onCellClick={() => setPickerOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
