import PropTypes from 'prop-types';
import WheelBase from './WheelBase';
import { useWheelData } from '../../hooks/useWheelData';
import { PROBLEM_SEGMENTS, PROBLEM_TYPES } from '../../lib/wheelTaxonomy';
import './CompetenceWheels.css';

/**
 * ProblemWheel - Displays the Problem Space competence wheel
 *
 * Shows what problems resonate with the user, organized by
 * Spheres of Impact (Self → Relational → Community → World)
 */
export default function ProblemWheel({
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
  } = useWheelData('problems', userId, projectId);

  if (loading) {
    return (
      <div className="wheel-loading">
        <div className="wheel-loading-spinner" />
        <div className="wheel-loading-text">Loading your problem space...</div>
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

  // Group lit segments by sphere
  const sphereGroups = {
    self: litSegments.filter(s => s.sphere === 'self'),
    relational: litSegments.filter(s => s.sphere === 'relational'),
    community: litSegments.filter(s => s.sphere === 'community'),
    world: litSegments.filter(s => s.sphere === 'world'),
  };

  // Find dominant sphere
  const dominantSphere = Object.entries(sphereGroups)
    .sort((a, b) => b[1].length - a[1].length)[0];

  return (
    <div className={`problem-wheel ${className}`}>
      <div className="wheel-header">
        <h3 className="wheel-title">🌍 Your Problem Space</h3>
        <p className="wheel-subtitle">
          {hasData
            ? `${litSegments.length} of ${segments.length} domains discovered`
            : 'Complete Flow Finder Problems to light up your wheel'
          }
        </p>
      </div>

      <WheelBase
        segments={PROBLEM_SEGMENTS}
        segmentData={segmentData}
        size={size}
        rings={showRings ? PROBLEM_TYPES.length : 1}
        showLabels={showLabels}
        onSegmentClick={onSegmentClick}
        centerContent={
          <div className="wheel-center">
            <div className="wheel-center-title">Problems</div>
            <div className="wheel-center-count">{progress}%</div>
            <div className="wheel-center-subtitle">explored</div>
          </div>
        }
      />

      {showRings && hasData && (
        <div className="ring-legend">
          {PROBLEM_TYPES.slice(0, 3).map(type => (
            <div key={type.id} className="ring-legend-item">
              <div className="ring-indicator" />
              <span>{type.label}</span>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <div className="wheel-insights">
          <div className="insight-title">Your Focus Areas</div>
          {litSegments.slice(0, 3).map(segment => (
            <div key={segment.id} className="insight-item">
              <span className="insight-icon">{segment.icon}</span>
              <div className="insight-text">
                <span className="insight-highlight">{segment.aspirationalTitle}</span>
                {' - '}{segment.tagline}
              </div>
            </div>
          ))}
          {dominantSphere && dominantSphere[1].length > 0 && (
            <div className="insight-item" style={{ marginTop: '12px' }}>
              <span className="insight-icon">🎯</span>
              <div className="insight-text">
                You're drawn to <span className="insight-highlight">{dominantSphere[0]}</span> sphere problems
              </div>
            </div>
          )}
        </div>
      )}

      {!hasData && (
        <div className="wheel-empty">
          <div className="wheel-empty-icon">🌍</div>
          <div className="wheel-empty-title">Explore Your Problem Space</div>
          <div className="wheel-empty-description">
            Complete the Flow Finder Problems flow to discover what issues you're drawn to solve
          </div>
        </div>
      )}
    </div>
  );
}

ProblemWheel.propTypes = {
  userId: PropTypes.string.isRequired,
  projectId: PropTypes.string,
  size: PropTypes.number,
  showRings: PropTypes.bool,
  showLabels: PropTypes.bool,
  onSegmentClick: PropTypes.func,
  className: PropTypes.string,
};
