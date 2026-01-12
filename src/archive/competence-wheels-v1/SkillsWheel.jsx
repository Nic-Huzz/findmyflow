import PropTypes from 'prop-types';
import WheelBase from './WheelBase';
import { useWheelData } from '../../hooks/useWheelData';
import { SKILLS_SEGMENTS, SKILL_MATURITY, ENERGY_SOURCES } from '../../lib/wheelTaxonomy';
import './CompetenceWheels.css';

/**
 * SkillsWheel - Displays the Skills competence wheel
 *
 * Shows what capabilities the user brings, with optional maturity rings
 * and energy source information.
 */
export default function SkillsWheel({
  userId,
  projectId,
  size = 300,
  showRings = true,
  showLabels = true,
  onSegmentClick,
  className = '',
}) {
  const {
    segments,
    segmentData,
    litSegments,
    progress,
    loading,
    error,
  } = useWheelData('skills', userId, projectId);

  if (loading) {
    return (
      <div className="wheel-loading">
        <div className="wheel-loading-spinner" />
        <div className="wheel-loading-text">Loading your skills...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wheel-empty">
        <div className="wheel-empty-icon">⚠️</div>
        <div className="wheel-empty-title">Unable to load wheel</div>
        <div className="wheel-empty-description">{error}</div>
      </div>
    );
  }

  const hasData = litSegments.length > 0;

  return (
    <div className={`skills-wheel ${className}`}>
      <div className="wheel-header">
        <h3 className="wheel-title">🎯 Your Skills</h3>
        <p className="wheel-subtitle">
          {hasData
            ? `${litSegments.length} of ${segments.length} capabilities discovered`
            : 'Complete Flow Finder Skills to light up your wheel'
          }
        </p>
      </div>

      <WheelBase
        segments={SKILLS_SEGMENTS}
        segmentData={segmentData}
        size={size}
        rings={showRings ? 3 : 1}
        showLabels={showLabels}
        onSegmentClick={onSegmentClick}
        centerContent={
          <div className="wheel-center">
            <div className="wheel-center-title">Skills</div>
            <div className="wheel-center-count">{progress}%</div>
            <div className="wheel-center-subtitle">discovered</div>
          </div>
        }
      />

      {showRings && hasData && (
        <div className="ring-legend">
          {SKILL_MATURITY.map(ring => (
            <div key={ring.id} className="ring-legend-item">
              <div className={`ring-indicator ${ring.ring}`} />
              <span>{ring.label}</span>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <div className="wheel-insights">
          <div className="insight-title">Your Strongest Skills</div>
          {litSegments.slice(0, 3).map(segment => (
            <div key={segment.id} className="insight-item">
              <span className="insight-icon">{segment.icon}</span>
              <div className="insight-text">
                <span className="insight-highlight">{segment.aspirationalTitle}</span>
                {' - '}{segment.tagline}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasData && (
        <div className="wheel-empty">
          <div className="wheel-empty-icon">🎯</div>
          <div className="wheel-empty-title">Discover Your Skills</div>
          <div className="wheel-empty-description">
            Complete the Flow Finder Skills flow to reveal your unique capabilities
          </div>
        </div>
      )}
    </div>
  );
}

SkillsWheel.propTypes = {
  userId: PropTypes.string.isRequired,
  projectId: PropTypes.string,
  size: PropTypes.number,
  showRings: PropTypes.bool,
  showLabels: PropTypes.bool,
  onSegmentClick: PropTypes.func,
  className: PropTypes.string,
};
