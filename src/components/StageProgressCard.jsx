import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { checkGraduationEligibility } from '../lib/graduationChecker';
import { PERSONA_STAGES, getStageDisplayName, getPersonaDisplayName } from '../lib/personaStages';
import './StageProgressCard.css';

function StageProgressCard({ persona, currentStage, onGraduate }) {
  const { user } = useAuth();
  const [graduationStatus, setGraduationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className={`stage-progress-card ${isEligible ? 'eligible' : ''}`}>
      <div className="stage-header">
        <div className="persona-badge">{getPersonaDisplayName(persona)}</div>
        <div className="stage-info">
          <h3 className="current-stage">{getStageDisplayName(currentStage)} Stage</h3>
          {nextStage && (
            <p className="next-stage">Next: {getStageDisplayName(nextStage)}</p>
          )}
        </div>
      </div>

      {requirements && (
        <div className="graduation-requirements">
          <h4>Graduation Requirements</h4>
          <p className="requirements-description">{requirements.description}</p>

          <div className="requirements-checklist">
            {requirements.flows_required && requirements.flows_required.length > 0 && (
              <div className={`requirement-item ${graduationStatus?.checks?.flows_completed ? 'completed' : ''}`}>
                <span className="checkbox">
                  {graduationStatus?.checks?.flows_completed ? '✓' : '○'}
                </span>
                <span className="requirement-text">
                  Complete {requirements.flows_required.join(', ')} flow
                </span>
              </div>
            )}

            {requirements.conversations_required > 0 && (
              <div className={`requirement-item ${graduationStatus?.checks?.conversations_logged ? 'completed' : ''}`}>
                <span className="checkbox">
                  {graduationStatus?.checks?.conversations_logged ? '✓' : '○'}
                </span>
                <span className="requirement-text">
                  Log {requirements.conversations_required} customer conversations
                </span>
              </div>
            )}

            {requirements.milestones && requirements.milestones.length > 0 && (
              <div className={`requirement-item ${graduationStatus?.checks?.milestones_met ? 'completed' : ''}`}>
                <span className="checkbox">
                  {graduationStatus?.checks?.milestones_met ? '✓' : '○'}
                </span>
                <span className="requirement-text">
                  Complete milestone: {requirements.milestones.join(', ')}
                </span>
              </div>
            )}

            {requirements.challenge_streak && (
              <div className={`requirement-item ${graduationStatus?.checks?.streak_met ? 'completed' : ''}`}>
                <span className="checkbox">
                  {graduationStatus?.checks?.streak_met ? '✓' : '○'}
                </span>
                <span className="requirement-text">
                  Achieve {requirements.challenge_streak}-day challenge streak
                </span>
              </div>
            )}
          </div>

          {isEligible && onGraduate && (
            <button
              className="graduate-button"
              onClick={() => onGraduate(currentStage, nextStage)}
            >
              Graduate to {getStageDisplayName(nextStage)}
            </button>
          )}
        </div>
      )}

      {!nextStage && (
        <div className="completion-message">
          <p>You've completed all stages! Keep growing!</p>
        </div>
      )}
    </div>
  );
}

export default StageProgressCard;
