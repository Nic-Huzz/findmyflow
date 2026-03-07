/**
 * PriorityRecommendedCard.jsx
 *
 * Post-onboarding card showing a recommended focus area
 * based on the user's priority layer and current recommendation.
 */

import { TENSION_LAYER_DISPLAY } from '../lib/onboardingV2'

const QUEST_FOCUS_TEXT = {
  flow_finder_skills: 'Complete Flow Finder: Skills to discover what you\'re naturally great at',
  flow_finder_problems: 'Complete Flow Finder: Problems to find what you care about solving',
  flow_finder_persona: 'Complete Flow Finder: Persona to identify who you\'re meant to serve',
  recognise_nervous_system: 'Map your nervous system boundaries around money and visibility',
  recognise_limiting_belief_rewire: 'Trace a limiting belief back to its origin and rewire it',
  release_weekly_big: 'Complete your weekly Big Release practice',
}

const LAYER_FOCUS_TEXT = {
  screen: 'Push into Screen-level visibility challenges this week',
  live: 'Step into Live visibility challenges this week',
  money: 'Take on Money-level visibility challenges this week',
  vulnerable: 'Challenge yourself with Vulnerable-level visibility this week',
  authority: 'Claim your Authority with high-visibility challenges this week',
}

function getFocusText(recommendations) {
  if (!recommendations) return 'Keep building your weekly practice'

  if (recommendations.type === 'quests') {
    if (recommendations.nextQuest) {
      return QUEST_FOCUS_TEXT[recommendations.nextQuest] || 'Complete your next recommended quest'
    }
    if (recommendations.alwaysRecommend?.length > 0) {
      return QUEST_FOCUS_TEXT[recommendations.alwaysRecommend[0]] || 'Keep building your weekly practice'
    }
    return 'Keep building your weekly practice'
  }

  if (recommendations.type === 'playlist_layers' && recommendations.layers?.length > 0) {
    return LAYER_FOCUS_TEXT[recommendations.layers[0]] || 'Push into your next Play-list visibility layer'
  }

  return 'Keep building your weekly practice'
}

export default function PriorityRecommendedCard({ priorityLayer, recommendations, onReassess }) {
  const display = TENSION_LAYER_DISPLAY[priorityLayer]
  if (!display) return null

  const focus = getFocusText(recommendations)

  return (
    <div className="pt-recommended-card">
      <div className="pt-recommended-header">
        <span className="pt-recommended-emoji">{display.emoji}</span>
        <div className="pt-recommended-info">
          <span className="pt-recommended-eyebrow">Recommended</span>
          <div className="pt-recommended-name">{display.riverElement} — {display.name}</div>
          <div className="pt-recommended-focus">{focus}</div>
        </div>
        {onReassess && (
          <button className="pt-layer-reassess" onClick={onReassess}>
            Reassess
          </button>
        )}
      </div>
    </div>
  )
}
