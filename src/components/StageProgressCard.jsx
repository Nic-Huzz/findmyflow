import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { checkGraduationEligibility } from '../lib/graduationChecker';
import { PERSONA_STAGES, getStageDisplayName, getPersonaDisplayName } from '../lib/personaStages';
import { personaProfiles } from '../data/personaProfiles';
import './StageProgressCard.css';

function StageProgressCard({ persona, currentStage, onGraduate }) {
  const { user } = useAuth();
  const [graduationStatus, setGraduationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get stages dynamically from PERSONA_STAGES for current persona
  const allStages = PERSONA_STAGES[persona]?.stages || [];

  const stageIcons = {
    clarity: '🔮',
    validation: '🔍',
    creation: '🗺️',
    testing: '🎯',
    ideation: '💡',
    launch: '🚀',
    scale: '🚀' // Legacy
  };

  useEffect(() => {
    if (user && persona && currentStage) {
      checkEligibility();
    }
  }, [user, persona, currentStage]);

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const status = await checkGraduationEligibility(user.id);
      setGraduationStatus(status);
    } catch (error) {
      console.error('Error checking graduation eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stage-progress-card loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!persona || !currentStage) {
    return null;
  }

  const requirements = PERSONA_STAGES[persona]?.graduation_requirements?.[currentStage];
  const nextStage = graduationStatus?.next_stage;
  const isEligible = graduationStatus?.eligible;

  // Case-insensitive stage matching to handle potential database case differences
  const currentStageIndex = allStages.indexOf(currentStage?.toLowerCase());

  // Safety check: if stage not found, default to first stage (discover)
  const safeStageIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  // Get next persona (Level Up logic)
  const personaOrder = ['vibe_seeker', 'vibe_riser', 'vibe_creator', 'vibe_leader'];
  const currentPersonaIndex = personaOrder.indexOf(persona);
  const nextPersona = currentPersonaIndex < personaOrder.length - 1 ? personaOrder[currentPersonaIndex + 1] : null;
  const nextPersonaProfile = nextPersona ? personaProfiles[nextPersona] : null;

  return (
    <div className={`stage-progress-card ${isEligible ? 'eligible' : ''}`}>
      <div className="card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-top">
          <div className={`persona-badge persona-${persona}`}>{getPersonaDisplayName(persona)}</div>
          <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>↓</div>
        </div>
        <div className="stage-info">
          <div>
            <div className="current-stage-label">Current Stage</div>
            <div className="current-stage-name">{getStageDisplayName(currentStage)}</div>
          </div>
          {nextStage && (
            <div className="next-stage">
              <div className="next-stage-label">Next Stage</div>
              <div className="next-stage-name">{getStageDisplayName(nextStage)}</div>
            </div>
          )}
        </div>
      </div>

      <div className={`dropdown-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="journey-visualization">
          <div className="journey-path">
            <div className="milestones">
              {/* Dynamic progress line based on current stage */}
              <div
                className="milestone-progress-line"
                style={{
                  background: `linear-gradient(to right,
                    #667eea 0%,
                    #667eea ${(safeStageIndex / (allStages.length - 1)) * 100}%,
                    #e2e8f0 ${(safeStageIndex / (allStages.length - 1)) * 100}%,
                    #e2e8f0 100%)`
                }}
              />
              {allStages.map((stage, index) => {
                const isCompleted = index < safeStageIndex;
                const isCurrent = index === safeStageIndex;
                const milestoneWidth = `${100 / allStages.length}%`;
                return (
                  <div
                    key={stage}
                    className={`milestone ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    style={{ width: milestoneWidth }}
                  >
                    <div className="milestone-icon">
                      {isCompleted ? '✓' : stageIcons[stage]}
                    </div>
                    <div className="milestone-name">{getStageDisplayName(stage)}</div>
                    <div className="milestone-status">
                      {isCompleted ? 'Complete' : isCurrent ? 'Current' : 'Locked'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {requirements && (
            <div className="requirements-section">
              <div className="requirements-title">
                {persona === 'vibe_seeker'
                  ? 'Graduation Requirements'
                  : 'Complete Graduation Requirements in 7-Day Challenge'}
              </div>
              {requirements.description && (
                <div className="requirements-description" style={{ marginBottom: '16px', color: '#6b7280', fontSize: '0.95rem' }}>
                  {requirements.description}
                </div>
              )}
              <div className="requirements-checklist">
                {/* Only show flows_required if there's no milestones_display (for other personas) */}
                {requirements.flows_required && requirements.flows_required.length > 0 && !requirements.milestones_display && (
                  <div className={`requirement-item ${graduationStatus?.checks?.flows_completed ? 'completed' : ''}`}>
                    <div className="checkbox">
                      {graduationStatus?.checks?.flows_completed ? '✓' : '○'}
                    </div>
                    <div>Complete {requirements.flows_required.join(', ')} flows</div>
                  </div>
                )}

                {requirements.conversations_required > 0 && (
                  <div className={`requirement-item ${graduationStatus?.checks?.conversations_logged ? 'completed' : ''}`}>
                    <div className="checkbox">
                      {graduationStatus?.checks?.conversations_logged ? '✓' : '○'}
                    </div>
                    <div>Log {requirements.conversations_required} customer conversations</div>
                  </div>
                )}

                {requirements.milestones_display && requirements.milestones_display.length > 0 && requirements.milestones_display.map((milestone, index) => {
                  // Check if corresponding flow is completed
                  const flowId = requirements.flows_required?.[index];
                  const isCompleted = graduationStatus?.completed_flows?.includes(flowId);

                  // Add "Inside 7-Day Challenge" heading before "Complete a Groan Challenge" for Vibe Seeker only
                  const showChallengeHeading = persona === 'vibe_seeker' &&
                                               milestone.toLowerCase().includes('groan challenge') &&
                                               index > 0 &&
                                               !requirements.milestones_display[index - 1].toLowerCase().includes('groan challenge');

                  // Check if this is the Money Model Guide milestone
                  const isMoneyGuide = milestone.toLowerCase().includes('money') && milestone.toLowerCase().includes('guide');

                  return (
                    <div key={index}>
                      {showChallengeHeading && (
                        <div style={{
                          marginTop: '16px',
                          marginBottom: '8px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: '#9CA3AF',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Inside 7-Day Challenge
                        </div>
                      )}
                      <div className={`requirement-item ${isCompleted ? 'completed' : ''}`}>
                        <div className="checkbox">
                          {isCompleted ? '✓' : '○'}
                        </div>
                        <div>{milestone}</div>
                      </div>
                    </div>
                  );
                })}

                {requirements.milestones && requirements.milestones.length > 0 && !requirements.milestones_display && requirements.milestones.map((milestone, index) => (
                  <div key={index} className={`requirement-item ${graduationStatus?.checks?.milestones_met ? 'completed' : ''}`}>
                    <div className="checkbox">
                      {graduationStatus?.checks?.milestones_met ? '✓' : '○'}
                    </div>
                    <div>{milestone}</div>
                  </div>
                ))}

                {requirements.challenge_streak && (
                  <div className={`requirement-item ${graduationStatus?.checks?.streak_met ? 'completed' : ''}`}>
                    <div className="checkbox">
                      {graduationStatus?.checks?.streak_met ? '✓' : '○'}
                    </div>
                    <div>Achieve {requirements.challenge_streak}-day challenge streak</div>
                  </div>
                )}
              </div>

              {isEligible && onGraduate && (
                <button
                  className="graduate-button"
                  onClick={() => onGraduate(currentStage, nextStage)}
                >
                  {persona === 'vibe_seeker' && currentStage === 'clarity'
                    ? 'Graduate to Vibe Riser'
                    : persona === 'vibe_riser' && currentStage === 'launch'
                    ? 'Graduate to Movement Maker'
                    : `Graduate to ${getStageDisplayName(nextStage)}`}
                </button>
              )}
            </div>
          )}

          {nextPersonaProfile && persona !== 'movement_maker' && (
            <div className="next-level-section">
              <div className="next-level-title">Next Level: {getPersonaDisplayName(nextPersona)}</div>
              <div className="next-level-description">
                {nextPersonaProfile.detailed?.description || nextPersonaProfile.description}
              </div>
              <div className="unlock-requirement">
                <div className="lock-icon">🔒</div>
                <div className="unlock-text">
                  Complete all {allStages.length} stage{allStages.length !== 1 ? 's' : ''} of {getPersonaDisplayName(persona)} to unlock
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StageProgressCard;
