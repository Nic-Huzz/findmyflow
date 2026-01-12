import PropTypes from 'prop-types';
import { useAllWheels } from '../../hooks/useWheelData';
import SkillsWheel from './SkillsWheel';
import ProblemWheel from './ProblemWheel';
import PersonaWheel from './PersonaWheel';
import './CompetenceWheels.css';

/**
 * WheelDashboard - Displays all three competence wheels together
 *
 * Shows Skills, Problem, and Persona wheels with a combined identity
 * statement when all three have data.
 */
export default function WheelDashboard({
  userId,
  projectId,
  wheelSize = 280,
  showRings = true,
  onSegmentClick,
  className = '',
}) {
  const {
    skills,
    problems,
    persona,
    loading,
    combinedIdentity,
    overallProgress,
  } = useAllWheels(userId, projectId);

  if (loading) {
    return (
      <div className="wheel-loading">
        <div className="wheel-loading-spinner" />
        <div className="wheel-loading-text">Loading your competence wheels...</div>
      </div>
    );
  }

  const hasAnyData = skills.litSegments.length > 0 ||
                     problems.litSegments.length > 0 ||
                     persona.litSegments.length > 0;

  return (
    <div className={`wheel-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Your Circle of Competence</h2>
        <p className="dashboard-subtitle">
          {hasAnyData
            ? `${overallProgress}% of your competence discovered`
            : 'Complete Flow Finder flows to reveal your unique profile'
          }
        </p>
      </div>

      {/* Combined Identity (when all wheels have data) */}
      {combinedIdentity && (
        <div className="combined-identity">
          <div className="identity-label">Your Founder Identity</div>
          <div className="identity-title">{combinedIdentity.title}</div>
          <div className="identity-description">{combinedIdentity.description}</div>
          <div className="identity-superpower">{combinedIdentity.superpower}</div>
        </div>
      )}

      {/* Wheel Grid */}
      <div className="wheel-grid">
        <div className="wheel-grid-item">
          <SkillsWheel
            userId={userId}
            projectId={projectId}
            size={wheelSize}
            showRings={showRings}
            onSegmentClick={(segment, data) => onSegmentClick?.('skills', segment, data)}
          />
        </div>

        <div className="wheel-grid-item">
          <ProblemWheel
            userId={userId}
            projectId={projectId}
            size={wheelSize}
            showRings={showRings}
            onSegmentClick={(segment, data) => onSegmentClick?.('problems', segment, data)}
          />
        </div>

        <div className="wheel-grid-item">
          <PersonaWheel
            userId={userId}
            projectId={projectId}
            size={wheelSize}
            showRings={showRings}
            onSegmentClick={(segment, data) => onSegmentClick?.('persona', segment, data)}
          />
        </div>
      </div>

      {/* Three DNAs Summary */}
      {hasAnyData && (
        <div className="three-dnas-summary">
          <h3 className="dnas-title">Your Three DNAs</h3>
          <div className="dnas-grid">
            <div className="dna-card">
              <div className="dna-icon">🧬</div>
              <div className="dna-label">Founder DNA</div>
              <div className="dna-value">
                {skills.litSegments.length > 0
                  ? skills.litSegments.slice(0, 2).map(s => s.aspirationalTitle).join(' + ')
                  : 'Discovering...'
                }
              </div>
            </div>

            <div className="dna-card">
              <div className="dna-icon">🎯</div>
              <div className="dna-label">Market DNA</div>
              <div className="dna-value">
                {problems.litSegments.length > 0 && persona.litSegments.length > 0
                  ? `${problems.litSegments[0]?.displayName} for ${persona.litSegments[0]?.displayName}`
                  : 'Discovering...'
                }
              </div>
            </div>

            <div className="dna-card">
              <div className="dna-icon">🔨</div>
              <div className="dna-label">Build DNA</div>
              <div className="dna-value">
                Ready to design
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

WheelDashboard.propTypes = {
  userId: PropTypes.string.isRequired,
  projectId: PropTypes.string,
  wheelSize: PropTypes.number,
  showRings: PropTypes.bool,
  onSegmentClick: PropTypes.func,
  className: PropTypes.string,
};
