/**
 * AppBuildDashboard.jsx
 *
 * Dashboard for the "Build Your App" hackathon flow.
 * Shows prework card + 5 sequential challenge cards with progress tracking.
 * Lives under /create portal, hidden for now (no nav links point here).
 *
 * Route: /create/build-app
 */

import { useNavigate } from 'react-router-dom'
import useAppBuildData from '../../hooks/useAppBuildData'
import './AppBuildDashboard.css'

// SVG progress ring constants
const RING_RADIUS = 19
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({ percent, children }) {
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE
  return (
    <div className="abd-ring-wrap">
      <svg className="abd-ring-svg" viewBox="0 0 48 48">
        <circle className="abd-ring-bg" cx="24" cy="24" r={RING_RADIUS} />
        <circle
          className="abd-ring-fill"
          cx="24"
          cy="24"
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      {children}
    </div>
  )
}

export default function AppBuildDashboard() {
  const navigate = useNavigate()
  const { loading, challenges, prework, progress, isUnlocked, getProgress } = useAppBuildData()

  if (loading) {
    return (
      <div className="app-build-dashboard">
        <div className="abd-loading">
          <div className="abd-spinner" />
        </div>
      </div>
    )
  }

  // Overall progress: prework counts as 1 unit, each challenge as 1 unit = 6 total
  const preworkDone = !!prework?.completedAt
  const challengeProgressValues = challenges.map(c => getProgress(c.number))
  const totalUnits = challenges.length + 1
  const completedUnits =
    (preworkDone ? 1 : 0) +
    challengeProgressValues.reduce((sum, pct) => sum + pct / 100, 0)
  const overallPercent = Math.round((completedUnits / totalUnits) * 100)

  return (
    <div className="app-build-dashboard">
      {/* Header */}
      <div className="abd-header">
        <h1 className="abd-title">Build Your App</h1>
        <p className="abd-subtitle">Go from idea to live product in one session</p>
        <span className="abd-duration">~3.5 hours</span>
      </div>

      {/* Overall progress */}
      <div className="abd-overall-progress">
        <div className="abd-overall-label">
          <span>Overall Progress</span>
          <span>{overallPercent}%</span>
        </div>
        <div className="abd-overall-track">
          <div className="abd-overall-fill" style={{ width: `${overallPercent}%` }} />
        </div>
      </div>

      {/* Prework card */}
      <div
        className={`abd-prework${preworkDone ? ' abd-prework--complete' : ''}`}
        onClick={() => navigate('/create/build-app/prework')}
      >
        <div className="abd-prework-top">
          <div className="abd-prework-icon">📋</div>
          <div className="abd-prework-info">
            <p className="abd-prework-title">Define Your Product</p>
            <p className="abd-prework-desc">
              Clarify your problem, target user, features, and design before building
            </p>
          </div>
          <span className={`abd-badge ${preworkDone ? 'abd-badge--complete' : 'abd-badge--todo'}`}>
            {preworkDone ? 'Complete' : 'Start here'}
          </span>
        </div>
      </div>

      {/* Challenges */}
      <div className="abd-section-label">Challenges</div>
      {challenges.map(challenge => {
        const unlocked = isUnlocked(challenge.number)
        const pct = getProgress(challenge.number)
        const completed = !!progress[challenge.number]?.completedAt
        const locked = !unlocked

        const cardClass = [
          'abd-challenge',
          locked && 'abd-challenge--locked',
          completed && 'abd-challenge--complete',
        ].filter(Boolean).join(' ')

        return (
          <div
            key={challenge.number}
            className={cardClass}
            onClick={() => {
              if (!locked) navigate(`/create/build-app/challenge/${challenge.number}`)
            }}
          >
            {/* Progress ring with emoji or lock */}
            <ProgressRing percent={locked ? 0 : pct}>
              {locked ? (
                <span className="abd-ring-lock">🔒</span>
              ) : (
                <span className="abd-ring-emoji">{challenge.emoji}</span>
              )}
            </ProgressRing>

            {/* Body */}
            <div className="abd-challenge-body">
              <p className="abd-challenge-title">
                {challenge.title}
                <span className="abd-challenge-duration">{challenge.duration}</span>
              </p>
              {challenge.lego_parallel && (
                <p className="abd-challenge-lego">{challenge.lego_parallel.title}</p>
              )}
              <p className="abd-challenge-obj">{challenge.objective}</p>
            </div>

            {/* Right side: badge or chevron */}
            <div className="abd-challenge-end">
              {completed ? (
                <span className="abd-badge--done">Completed</span>
              ) : !locked ? (
                <span className="abd-chevron">›</span>
              ) : null}
            </div>
          </div>
        )
      })}

      <div className="abd-footer">
        Built with Find My Flow
      </div>
    </div>
  )
}
