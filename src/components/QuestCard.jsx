/**
 * QuestCard - Reusable quest card component for the Challenge page
 *
 * Handles all quest types: text, dropdown, checkbox, flow, conversation_log,
 * milestone, flow_compass, and groan reflections.
 */

import { Link } from 'react-router-dom'
import ConversationLogInput from './ConversationLogInput'
import MilestoneInput from './MilestoneInput'
import FlowCompassInput from './FlowCompassInput'
import GroanReflectionInput from './GroanReflectionInput'

function QuestCard({
  quest,
  completed,
  locked,
  lockedMessage,
  lockedPrerequisite,
  isDayZeroLocked,
  showStreak,
  streak,
  dayLabels,
  questInput,
  onInputChange,
  onComplete,
  expandedLearnMore,
  onToggleLearnMore,
  showLockedTooltip,
  onToggleLockedTooltip,
  renderDescription,
  dailyReleaseContent,
  completedBadgeText = 'Completed',
  navigate,
  // For special locked states (Healing Compass, Nervous System)
  specialLockCheck,
  specialLockMessage,
  // For groan reflections
  selectedProject,
  progress,
  projectStage,
  // Extra class for styling
  extraClass = ''
}) {
  const cardClasses = [
    'quest-card',
    completed ? 'completed' : '',
    locked || isDayZeroLocked ? 'locked' : '',
    extraClass
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses}>
      <div className="quest-header">
        <h3 className="quest-name">
          {locked && !isDayZeroLocked ? 'Locked ' : ''}{quest.name}
        </h3>
        <span className="quest-points">+{quest.points} pts</span>
      </div>

      {/* Daily streak bubbles */}
      {showStreak && streak && dayLabels && (
        <div className="daily-streak">
          {dayLabels.map((label, index) => (
            <div
              key={index}
              className={`streak-bubble ${streak[index] ? 'completed' : ''}`}
              title={`Day ${index + 1}`}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      <p className="quest-description">{renderDescription(quest.description)}</p>

      {/* Daily Release Challenge content (for release_daily_challenge quest) */}
      {quest.id === 'release_daily_challenge' && !completed && !isDayZeroLocked && dailyReleaseContent && (
        <div className="learn-more-section">
          <button
            className="learn-more-toggle"
            onClick={() => onToggleLearnMore(quest.id)}
          >
            <span>Today's Challenge</span>
            <svg
              className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {expandedLearnMore[quest.id] && (
            <div className="learn-more-content">
              {dailyReleaseContent}
            </div>
          )}
        </div>
      )}

      {/* Learn More section (standard quests) */}
      {quest.id !== 'release_daily_challenge' && quest.learnMore && !completed && !isDayZeroLocked && (
        <div className="learn-more-section">
          <button
            className="learn-more-toggle"
            onClick={() => onToggleLearnMore(quest.id)}
          >
            <span>Learn More</span>
            <svg
              className={`learn-more-arrow ${expandedLearnMore[quest.id] ? 'expanded' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {expandedLearnMore[quest.id] && (
            <div className="learn-more-content">
              {quest.learnMore}
            </div>
          )}
        </div>
      )}

      {/* Day 0 locked message */}
      {isDayZeroLocked && (
        <div className="quest-locked-message">
          Unlocked on Day 1 (Tomorrow)
        </div>
      )}

      {/* Locked due to prerequisite quest */}
      {!completed && locked && lockedPrerequisite && (
        <div className="quest-locked-message">
          Complete "{lockedPrerequisite}" first to unlock
        </div>
      )}

      {/* Quest input area - only show if not completed and not locked */}
      {!completed && !locked && !isDayZeroLocked && (
        <div className="quest-input-area">
          {quest.status === 'coming_soon' ? (
            <button className="quest-flow-btn coming-soon" disabled>
              Coming Soon
            </button>
          ) : specialLockCheck ? (
            // Special lock state (e.g., Healing Compass not complete, Nervous System not complete)
            <div className="quest-locked-container">
              {quest.inputType === 'text' && (
                <textarea
                  className="quest-textarea"
                  placeholder={quest.placeholder}
                  value={questInput || ''}
                  onChange={(e) => onInputChange(quest.id, e.target.value)}
                  rows={3}
                  disabled
                />
              )}
              <button
                className={`${quest.inputType === 'flow' ? 'quest-flow-btn' : 'quest-complete-btn'} locked`}
                disabled
              >
                {specialLockMessage || 'Locked'}
                <span
                  className="locked-info-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onToggleLockedTooltip(quest.id)
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onToggleLockedTooltip(quest.id)
                  }}
                >
                  ⓘ
                </span>
              </button>
              {showLockedTooltip === quest.id && (
                <div className="locked-tooltip">
                  {lockedMessage}
                </div>
              )}
            </div>
          ) : quest.inputType === 'flow' ? (
            <Link to={quest.flow_route} className="quest-flow-btn">
              Start {quest.name}
            </Link>
          ) : quest.type === 'groan' ? (
            <GroanReflectionInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
              projectId={selectedProject?.id}
              challengeInstanceId={progress?.challenge_instance_id}
              stage={projectStage}
            />
          ) : quest.inputType === 'text' ? (
            <>
              <textarea
                className="quest-textarea"
                placeholder={quest.placeholder}
                value={questInput || ''}
                onChange={(e) => onInputChange(quest.id, e.target.value)}
                rows={3}
              />
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
              >
                Complete Quest
              </button>
            </>
          ) : quest.inputType === 'conversation_log' ? (
            <ConversationLogInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
            />
          ) : quest.inputType === 'milestone' ? (
            <MilestoneInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
            />
          ) : quest.inputType === 'flow_compass' ? (
            <FlowCompassInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
            />
          ) : quest.inputType === 'dropdown' ? (
            <>
              <select
                className="quest-dropdown"
                value={questInput || ''}
                onChange={(e) => onInputChange(quest.id, e.target.value)}
              >
                <option value="">Select an option...</option>
                {quest.options?.map(opt => (
                  <option key={opt.value} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
              >
                Complete Quest
              </button>
            </>
          ) : (
            // Default: checkbox type
            <>
              <div className="quest-checkbox-area">
                <label className="quest-checkbox-label">
                  {quest.actionLink ? (
                    <Link to={quest.actionLink} className="quest-inline-link">
                      {quest.actionLinkText || 'View'}
                    </Link>
                  ) : (
                    'Mark as complete'
                  )}
                </label>
              </div>
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
              >
                Complete Quest
              </button>
            </>
          )}
        </div>
      )}

      {/* Graduation note for Flow Finder quests */}
      {quest.counts_toward_graduation && !completed && quest.inputType !== 'conversation_log' && !locked && !isDayZeroLocked && (
        <p className="graduation-note">Counts toward stage graduation</p>
      )}

      {/* Completed state */}
      {completed && (
        <div className="quest-completed-section">
          <div className="quest-completed-badge">
            {completedBadgeText}
          </div>
          {quest.flow_route && (
            <button
              className="view-results-btn"
              onClick={() => navigate(`${quest.flow_route}?results=true`)}
            >
              View Results
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default QuestCard
