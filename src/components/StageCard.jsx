/**
 * StageCard.jsx — Hero stage level card
 *
 * Shows current stage (0-12), journey bar, description, movie refs,
 * and next action CTA. Used on /me and ProgressTab.
 *
 * CSS prefix: sc-
 */

import { useNavigate } from 'react-router-dom'
import { HERO_STAGES } from './ProgressTab'
import './StageCard.css'

export default function StageCard({ heroStage = 0 }) {
  const navigate = useNavigate()
  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]

  return (
    <div className="sc-card">
      <div className="sc-stage-row">
        <div className="sc-stage-label">Stage {heroStage} of 12</div>
      </div>
      <div className="sc-stage-name">{stageInfo.name}</div>

      <div className="sc-journey-bar">
        <div className="sc-journey-fill" style={{ width: `${Math.max(Math.min((heroStage / 12) * 100, 100), 4)}%` }} />
      </div>
      <div className="sc-journey-endpoints">
        <span>The Crack</span>
        <span>Doing What You Love</span>
      </div>

      {stageInfo.desc && (
        <div className="sc-stage-desc">{stageInfo.desc}</div>
      )}

      {stageInfo.refs && (
        <div className="sc-think">
          <div className="sc-think-label">Think:</div>
          {stageInfo.refs.map((ref, i) => (
            <div key={i} className="sc-think-ref">{ref}</div>
          ))}
        </div>
      )}

      {stageInfo.nextAction && (
        <button className="sc-next-action" onClick={() => navigate(stageInfo.nextRoute)}>
          Next step: {stageInfo.nextAction} <span>→</span>
        </button>
      )}
    </div>
  )
}
