import PropTypes from 'prop-types';
import WheelBase from './WheelBase';
import { useWheelData } from '../../hooks/useWheelData';
import { PERSONA_SEGMENTS, JOURNEY_STAGES, ENGAGEMENT_DEPTH } from '../../lib/wheelTaxonomy';
import './CompetenceWheels.css';

/**
 * PersonaWheel - Displays the Customer Persona competence wheel
 *
 * Shows who the user is drawn to serve, with journey stage rings
 * and optional engagement depth information.
 */
export default function PersonaWheel({
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
  } = useWheelData('persona', userId, projectId);

  if (loading) {
    return (
      <div className="wheel-loading">
        <div className="wheel-loading-spinner" />
        <div className="wheel-loading-text">Loading your personas...</div>
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
    <div className={`persona-wheel ${className}`}>
      <div className="wheel-header">
        <h3 className="wheel-title">👥 Your Ideal Customers</h3>
        <p className="wheel-subtitle">
          {hasData
            ? `${litSegments.length} of ${segments.length} personas identified`
            : 'Complete Flow Finder Persona to light up your wheel'
          }
        </p>
      </div>

      <WheelBase
        segments={PERSONA_SEGMENTS}
        segmentData={segmentData}
        size={size}
        rings={showRings ? 3 : 1}
        showLabels={showLabels}
        onSegmentClick={onSegmentClick}
        centerContent={
          <div className="wheel-center">
            <div className="wheel-center-title">Personas</div>
            <div className="wheel-center-count">{progress}%</div>
            <div className="wheel-center-subtitle">discovered</div>
          </div>
        }
      />

      {showRings && hasData && (
        <div className="ring-legend">
          {JOURNEY_STAGES.map(stage => (
            <div key={stage.id} className="ring-legend-item">
              <div className={`ring-indicator ${stage.ring}`} />
              <span>{stage.label}</span>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <div className="wheel-insights">
          <div className="insight-title">Who You Serve Best</div>
          {litSegments.slice(0, 3).map(segment => (
            <div key={segment.id} className="insight-item">
              <span className="insight-icon">{segment.icon}</span>
              <div className="insight-text">
                <span className="insight-highlight">{segment.aspirationalTitle}</span>
                {' - '}{segment.tagline}
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  Core drive: {segment.coreDrive}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasData && (
        <div className="wheel-empty">
          <div className="wheel-empty-icon">👥</div>
          <div className="wheel-empty-title">Identify Your Customers</div>
          <div className="wheel-empty-description">
            Complete the Flow Finder Persona flow to discover who you're drawn to serve
          </div>
        </div>
      )}
    </div>
  );
}

PersonaWheel.propTypes = {
  userId: PropTypes.string.isRequired,
  projectId: PropTypes.string,
  size: PropTypes.number,
  showRings: PropTypes.bool,
  showLabels: PropTypes.bool,
  onSegmentClick: PropTypes.func,
  className: PropTypes.string,
};
