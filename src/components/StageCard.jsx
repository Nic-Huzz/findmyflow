/**
 * StageCard.jsx — Journey chapter card with tick boxes
 *
 * Shows current chapter (Search/Challenge/Breakthrough), step progress
 * as tick boxes, chapter dots, movie refs, and next action CTA.
 *
 * CSS prefix: sc-
 */

import { useNavigate } from 'react-router-dom'
import { getChapterForStage, getStepsWithStatus, JOURNEY_CHAPTERS } from '../data/journeyChapters'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import './StageCard.css'

export default function StageCard({ heroStage = 0, directionComplete = false, children }) {
  const navigate = useNavigate()
  const { chapter, stepsComplete, stepsTotal } = getChapterForStage(heroStage, directionComplete)
  const steps = getStepsWithStatus(heroStage, directionComplete)
  const currentStep = steps.find(s => s.current) || steps[steps.length - 1]

  return (
    <div className="sc-card">
      {/* Chapter name with stage number */}
      <div className="sc-chapter-name"><span className="sc-stage-label">Stage {chapter.circleStage}:</span> {chapter.name}</div>
      <div className="sc-step-count">
        {stepsComplete} of {stepsTotal} complete
      </div>

      {/* Tick box list */}
      <div className="sc-steps">
        {steps.map((step, i) => (
          <div key={i} className={`sc-step ${step.complete ? 'sc-step-done' : ''} ${step.current ? 'sc-step-current' : ''}`}>
            <span className="sc-step-icon">
              {step.complete ? <CheckCircleIcon width={18} height={18} /> : step.current ? '▸' : '○'}
            </span>
            <span className="sc-step-name">{step.name}</span>
          </div>
        ))}
      </div>

      {/* Movie refs for current step */}
      {currentStep?.refs && (
        <div className="sc-think">
          <div className="sc-think-label">Think:</div>
          {currentStep.refs.map((ref, i) => (
            <div key={i} className="sc-think-ref">{ref}</div>
          ))}
        </div>
      )}

      {/* Next action CTA */}
      {currentStep?.nextAction && currentStep?.nextRoute && (
        <button className="sc-next-action" onClick={() => navigate(currentStep.nextRoute)}>
          Next: {currentStep.nextAction} <span>→</span>
        </button>
      )}

      {/* Optional slot for extra content (e.g. journey map toggle) */}
      {children}
    </div>
  )
}
