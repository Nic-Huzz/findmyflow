/**
 * QuestCard - Reusable quest card component for the Challenge page
 *
 * Handles all quest types: text, dropdown, checkbox, flow, conversation_log,
 * milestone, flow_compass, and groan reflections.
 *
 * WARNING: Flow quest buttons MUST use plain <a href>, NOT React Router <Link>.
 * React Router wraps <Link> in startTransition which silently prevents lazy
 * chunks from rendering. This was a multi-day debugging nightmare — do not
 * change flow links back to <Link> or navigate().
 */

import { memo } from 'react'
import { Link } from 'react-router-dom'
import ConversationLogInput from './ConversationLogInput'
import MilestoneInput from './MilestoneInput'
import FlowCompassInput from './FlowCompassInput'
import GroanReflectionInput from './GroanReflectionInput'
import LaunchReviewInput from './LaunchReviewInput'
import RecogniseQuestInput from './RecogniseQuestInput'
import RewireQuestInput, { REWIRE_QUEST_IDS } from './RewireQuestInput'
import ReconnectQuestInput, { RECONNECT_QUEST_IDS } from './ReconnectQuestInput'
import ReleaseQuestInput, { RELEASE_QUEST_IDS } from './ReleaseQuestInput'
import GrandSlamDropdownInput from './GrandSlamDropdownInput'
import ValidationResponsesInput from './ValidationResponsesInput'
import ResponseCounterInput from './ResponseCounterInput'
import { getCategoryColor } from '../lib/league/leagueConfig'
import UpgradePrompt from './UpgradePrompt'
import VoiceDropdown from './VoiceDropdown'

// Recognise quest IDs that use the enhanced input
const RECOGNISE_QUEST_IDS = [
  'recognise_protective_observe',
  'recognise_essence_observe',
  'recognise_negative_frequency',
  'recognise_positive_frequency',
  'recognise_trigger_pattern',
  'playlist_essence_voice',
  'playlist_protective_voice'
]

// Helper to check if quest is a voice quest (stage-specific essence/protective)
// Excludes stage groan quests which should go to GroanReflectionInput
const isVoiceQuest = (questId) => {
  if (!questId?.startsWith('voice_stage_')) return false
  // Stage groan quests should NOT be handled by RecogniseQuestInput
  if (questId.endsWith('_stage_groan')) return false
  return true
}

function QuestCard({
  quest,
  completed,
  isCompleting = false,
  locked,
  lockedMessage,
  lockedPrerequisite,
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
  // For special locked states (Healing Compass, Nervous System)
  specialLockCheck,
  specialLockMessage,
  // For inline voice dropdowns on flow quests
  userId,
  userArchetypes,
  // For groan reflections
  selectedProject,
  progress,
  projectStage,
  // For Release quests - safety contracts from Nervous System
  safetyContracts,
  // Extra class for styling
  extraClass = '',
  // For completion animation
  justCompleted = false,
  // For weekly plan highlighting
  isPlanned = false,
  plannedDay = null,
  // For response counter quests
  validationResponseCounts = {},
  // For quests with maxCompletions > 1 (e.g. Tell a Friend)
  completionCount = 0,
  // Pre-launch lock: grey out all non-flow quests
  prelaunchLocked = false,
  // Payment gating
  paidLocked = false,
  onUpgrade = null,
  // Return path after flow completion (e.g. '/business')
  returnTo
}) {
  // Build flow URLs with optional returnTo param
  const flowUrl = (route, extra = {}) => {
    const p = new URLSearchParams()
    if (selectedProject?.id) p.set('projectId', selectedProject.id)
    if (returnTo) p.set('returnTo', returnTo)
    Object.entries(extra).forEach(([k, v]) => p.set(k, v))
    const qs = p.toString()
    return qs ? `${route}?${qs}` : route
  }

  const cardClasses = [
    'quest-card',
    completed ? 'completed' : '',
    locked ? 'locked' : '',
    justCompleted ? 'just-completed' : '',
    isPlanned ? 'planned' : '',
    paidLocked ? 'paid-locked' : '',
    extraClass
  ].filter(Boolean).join(' ')

  // Frequency badge for daily/weekly
  const showFrequencyBadge = quest.frequency === 'daily' || quest.frequency === 'weekly'

  return (
    <div className={cardClasses}>
      <div className="quest-header">
        <div className="quest-name-row">
          <h3 className="quest-name">
            {locked ? 'Locked ' : ''}{quest.name}
          </h3>
          {showFrequencyBadge && (
            <span className={`frequency-badge ${quest.frequency}`}>
              {quest.frequency === 'daily' ? 'Daily' : 'Weekly'}
            </span>
          )}
          {isPlanned && !completed && (
            <span className="planned-badge" title={plannedDay ? `Planned for ${plannedDay}` : 'Part of your weekly plan'}>
              📋 Planned
            </span>
          )}
        </div>
        <span
          className="quest-points"
          style={getCategoryColor(quest.category) ? {
            background: getCategoryColor(quest.category),
            color: getCategoryColor(quest.category) === '#E9A23B' ? '#212529' : undefined
          } : undefined}
        >+{quest.points} XP</span>
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

      {/* Hide description for voice quests - it's shown in the input component */}
      {!quest.voiceType && (
        <p className="quest-description">{renderDescription(quest.description)}</p>
      )}

      {/* Completion counter for repeatable quests (e.g. Tell a Friend 1 of 3) */}
      {quest.maxCompletions > 1 && !completed && (
        <div className="quest-completion-counter">
          <span className="counter-progress">{completionCount} of {quest.maxCompletions}</span> completed
        </div>
      )}

      {/* Daily Release Challenge content (for release_daily_challenge quest) */}
      {quest.id === 'release_daily_challenge' && !completed && dailyReleaseContent && (
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
      {quest.id !== 'release_daily_challenge' && quest.learnMore && !completed && (
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
              {quest.learnMore.split('\n').map((line, i) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/).map((seg, j) => {
                  if (seg.startsWith('**') && seg.endsWith('**')) {
                    return <strong key={j}>{seg.slice(2, -2)}</strong>
                  }
                  return seg
                })
                return <span key={i}>{parts}{i < quest.learnMore.split('\n').length - 1 && <br />}</span>
              })}
            </div>
          )}
        </div>
      )}

      {paidLocked && (
        <UpgradePrompt onUpgrade={onUpgrade} />
      )}

      {/* Locked due to prerequisite quest */}
      {!completed && locked && lockedPrerequisite && (
        <div className="quest-locked-message">
          Complete "{lockedPrerequisite}" first to unlock
        </div>
      )}

      {/* Quest input area - only show if not completed, not locked, and not paid-locked */}
      {!completed && !locked && !paidLocked && (
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
          ) : prelaunchLocked && quest.type !== 'Flow Finder' ? (
            <button className="quest-complete-btn prelaunch-locked" disabled>
              Unlocked Monday
            </button>

          ) : quest.inputType === 'flow' ? (
            // Plain <a> bypasses React Router's startTransition which prevents
            // Suspense fallbacks from showing during lazy chunk loading.
            // Full navigation ensures the flow page always renders.
            <a
              href={flowUrl(quest.flow_route)}
              className="quest-flow-btn"
            >
              Start {quest.name}
            </a>

          ) : RECOGNISE_QUEST_IDS.includes(quest.id) || isVoiceQuest(quest.id) ? (
            <RecogniseQuestInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
            />
          ) : REWIRE_QUEST_IDS.includes(quest.id) ? (
            <RewireQuestInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
            />
          ) : RECONNECT_QUEST_IDS.includes(quest.id) ? (
            <ReconnectQuestInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
            />
          ) : RELEASE_QUEST_IDS.includes(quest.id) ? (
            <ReleaseQuestInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
              safetyContracts={safetyContracts}
            />
          ) : quest.type === 'groan' ? (
            <GroanReflectionInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
              projectId={selectedProject?.id}
              challengeInstanceId={progress?.challenge_instance_id}
              stage={projectStage}
            />
          ) : quest.inputType === 'launch_review' ? (
            <LaunchReviewInput
              quest={quest}
              onComplete={(quest, data) => onComplete(quest, data)}
              projectId={selectedProject?.id}
              challengeInstanceId={progress?.challenge_instance_id}
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
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 'Complete Quest'}
              </button>
            </>
          ) : quest.inputType === 'rating' ? (
            <>
              <div className="quest-rating-buttons">
                {(quest.ratingOptions || [0,1,2,3,4,5,6,7,8,9,10]).map(n => (
                  <button
                    key={n}
                    className={`quest-rating-btn${(typeof questInput === 'object' ? questInput.rating : null) === n ? ' selected' : ''}`}
                    onClick={() => onInputChange(quest.id, { ...(typeof questInput === 'object' ? questInput : {}), rating: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {(typeof questInput === 'object' && questInput.rating != null) && (
                <textarea
                  className="quest-textarea"
                  placeholder={quest.placeholder || 'What made you give it that score?'}
                  value={(typeof questInput === 'object' ? questInput.reason : '') || ''}
                  onChange={(e) => onInputChange(quest.id, { ...questInput, reason: e.target.value })}
                  rows={2}
                />
              )}
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
                disabled={isCompleting || !(typeof questInput === 'object' && questInput.rating != null)}
              >
                {isCompleting ? 'Completing...' : 'Complete Quest'}
              </button>
            </>
          ) : quest.inputType === 'referral' ? (
            <>
              <div className="quest-referral-inputs">
                <input
                  type="text"
                  className="quest-input"
                  placeholder="Their name"
                  value={(typeof questInput === 'object' ? questInput.name : '') || ''}
                  onChange={(e) => onInputChange(quest.id, { ...(typeof questInput === 'object' ? questInput : {}), name: e.target.value })}
                />
                <input
                  type="text"
                  className="quest-input"
                  placeholder="Email or WhatsApp number"
                  value={(typeof questInput === 'object' ? questInput.contact : '') || ''}
                  onChange={(e) => onInputChange(quest.id, { ...(typeof questInput === 'object' ? questInput : {}), contact: e.target.value })}
                />
              </div>
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
                disabled={isCompleting || !(typeof questInput === 'object' && questInput.name?.trim() && questInput.contact?.trim())}
              >
                {isCompleting ? 'Completing...' : 'Complete Quest'}
              </button>
            </>
          ) : quest.inputType === 'text_with_tags' ? (
            <>
              <textarea
                className="quest-textarea"
                placeholder={quest.placeholder}
                value={typeof questInput === 'object' ? questInput.text || '' : questInput || ''}
                onChange={(e) => onInputChange(quest.id, {
                  text: e.target.value,
                  tags: typeof questInput === 'object' ? questInput.tags || [] : []
                })}
                rows={3}
              />
              {quest.tagOptions && (
                <div className="quest-tag-selector">
                  <span className="quest-tag-label">{quest.tagLabel || 'Select tags:'}</span>
                  <div className="quest-tags">
                    {quest.tagOptions.map(tag => {
                      const currentTags = typeof questInput === 'object' ? questInput.tags || [] : []
                      const isSelected = currentTags.includes(tag.value)
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          className={`quest-tag ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const newTags = isSelected
                              ? currentTags.filter(t => t !== tag.value)
                              : [...currentTags, tag.value]
                            onInputChange(quest.id, {
                              text: typeof questInput === 'object' ? questInput.text || '' : questInput || '',
                              tags: newTags
                            })
                          }}
                        >
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 'Complete Quest'}
              </button>
            </>
          ) : quest.inputType === 'multi_select' ? (
            <>
              {quest.selectOptions && (
                <div className="quest-multi-select">
                  <span className="quest-select-label">{quest.selectLabel || 'Select all that apply:'}</span>
                  <div className="quest-select-options">
                    {quest.selectOptions.map(option => {
                      const currentSelections = Array.isArray(questInput) ? questInput : []
                      const isSelected = currentSelections.includes(option.value)
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`quest-select-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const newSelections = isSelected
                              ? currentSelections.filter(v => v !== option.value)
                              : [...currentSelections, option.value]
                            onInputChange(quest.id, newSelections)
                          }}
                        >
                          <span className="option-icon">{option.icon}</span>
                          <span className="option-label">{option.label}</span>
                          {isSelected && <span className="option-check">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
                disabled={isCompleting || !Array.isArray(questInput) || questInput.length === 0}
              >
                {isCompleting ? 'Completing...' : 'Complete Quest'}
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
          ) : quest.inputType === 'grand_slam_dropdown' ? (
            <GrandSlamDropdownInput
              quest={quest}
              onComplete={(quest, data, e) => onComplete(quest, data, e)}
            />
          ) : quest.inputType === 'validation_responses' ? (
            <ValidationResponsesInput
              quest={quest}
              projectId={selectedProject?.id}
              onComplete={(quest, data) => onComplete(quest, data)}
            />
          ) : quest.inputType === 'response_counter' ? (
            <ResponseCounterInput
              quest={quest}
              responseCount={validationResponseCounts[quest.flow_stage] || 0}
              onComplete={(quest, data, e) => onComplete(quest, data, e)}
            />
          ) : quest.inputType === 'offer_checklist' ? (
            <Link
              to={selectedProject?.id ? `${quest.actionLink}?projectId=${selectedProject.id}` : quest.actionLink}
              className="quest-checklist-link"
            >
              {quest.actionLinkText || 'Open Checklist'}
            </Link>
          ) : quest.inputType === 'progress_dropdown' ? (
            <>
              <select
                className="quest-dropdown progress-dropdown"
                value={questInput || 'not_started'}
                onChange={(e) => onInputChange(quest.id, e.target.value)}
              >
                {quest.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {(questInput === 'completed_crm' || questInput === 'completed_other') && (
                <button
                  className="quest-complete-btn"
                  onClick={(e) => onComplete(quest, { progress: questInput }, e)}
                  disabled={isCompleting}
                >
                  {isCompleting ? 'Completing...' : 'Complete Quest'}
                </button>
              )}
              {questInput === 'in_progress' && (
                <div className="quest-progress-note">
                  <span className="progress-indicator">🔄</span>
                  <span>In Progress - Keep going!</span>
                </div>
              )}
            </>
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
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 'Complete Quest'}
              </button>
            </>
          ) : quest.actionLink ? (
            // Checkbox with action link - show styled button like flow quests
            <div className="quest-guide-area">
              <Link to={quest.actionLink} className="quest-flow-btn">
                {quest.actionLinkText || 'View Guide'}
              </Link>
              <button
                className="quest-complete-btn secondary"
                onClick={(e) => onComplete(quest, null, e)}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : "✓ I've Completed This"}
              </button>
            </div>
          ) : (
            // Default: simple checkbox type
            <>
              <div className="quest-checkbox-area">
                <label className="quest-checkbox-label">
                  Mark as complete
                </label>
              </div>
              <button
                className="quest-complete-btn"
                onClick={(e) => onComplete(quest, null, e)}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 'Complete Quest'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Graduation note for Flow Finder quests */}
      {quest.counts_toward_graduation && !completed && quest.inputType !== 'conversation_log' && !locked && (
        <p className="graduation-note">Counts toward stage graduation</p>
      )}

      {/* Completed state */}
      {completed && (
        <div className="quest-completed-section">
          <div className="quest-completed-badge">
            {justCompleted && <span className="checkmark-animation">✓</span>}
            {completedBadgeText}
          </div>
          {justCompleted && (
            <div className="points-fly-up">+{quest.points} XP</div>
          )}
          {quest.flow_route && (
            <a
              href={flowUrl(quest.flow_route, { results: 'true' })}
              className="view-results-btn"
            >
              {quest.isExplainer ? 'Read Again' : 'View Results'}
            </a>
          )}
        </div>
      )}

      {/* Inline voice buttons for flow quests - shown after completion */}
      {quest.inputType === 'flow' && completed && userId && (
        <VoiceDropdown
          questId={quest.id}
          userId={userId}
          projectId={selectedProject?.id}
          userArchetypes={userArchetypes}
        />
      )}

      {/* Confetti burst on completion */}
      {justCompleted && (
        <div className="confetti-container">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`confetti confetti-${i}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(QuestCard)
