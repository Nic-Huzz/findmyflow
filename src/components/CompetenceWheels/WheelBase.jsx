import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './CompetenceWheels.css';

/**
 * WheelBase - Core SVG wheel visualization component
 *
 * Renders a color wheel with 12 segments that can be:
 * - Lit (colored) or unlit (gray)
 * - Single ring or multi-ring (2D)
 * - Interactive with hover states and click handlers
 */
export default function WheelBase({
  segments,
  segmentData = {},
  size = 300,
  rings = 1,
  showLabels = true,
  showTooltips = true,
  onSegmentClick,
  centerContent,
  className = '',
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const center = size / 2;
  const outerRadius = (size / 2) - 10; // Leave margin for labels
  const innerRadius = rings > 1 ? outerRadius * 0.3 : outerRadius * 0.25; // Hole in center
  const segmentAngle = 360 / segments.length;

  // Calculate ring radii for multi-ring wheels
  const ringRadii = useMemo(() => {
    if (rings === 1) {
      return [{ inner: innerRadius, outer: outerRadius }];
    }

    const ringWidth = (outerRadius - innerRadius) / rings;
    return Array.from({ length: rings }, (_, i) => ({
      inner: innerRadius + (i * ringWidth),
      outer: innerRadius + ((i + 1) * ringWidth),
      ringIndex: i,
    }));
  }, [rings, innerRadius, outerRadius]);

  // Convert polar to cartesian coordinates
  const polarToCartesian = (radius, angleDegrees) => {
    const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(angleRadians),
      y: center + radius * Math.sin(angleRadians),
    };
  };

  // Generate SVG arc path
  const describeArc = (innerR, outerR, startAngle, endAngle) => {
    const start1 = polarToCartesian(outerR, startAngle);
    const end1 = polarToCartesian(outerR, endAngle);
    const start2 = polarToCartesian(innerR, endAngle);
    const end2 = polarToCartesian(innerR, startAngle);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return [
      'M', start1.x, start1.y,
      'A', outerR, outerR, 0, largeArcFlag, 1, end1.x, end1.y,
      'L', start2.x, start2.y,
      'A', innerR, innerR, 0, largeArcFlag, 0, end2.x, end2.y,
      'Z',
    ].join(' ');
  };

  // Calculate label position
  const getLabelPosition = (segmentIndex) => {
    const angle = segmentIndex * segmentAngle + segmentAngle / 2;
    const labelRadius = outerRadius + 20;
    return polarToCartesian(labelRadius, angle);
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (e, segment) => {
    if (showTooltips) {
      const rect = e.currentTarget.closest('svg').getBoundingClientRect();
      setTooltipPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
      });
    }
    setHoveredSegment(segment);
  };

  // Render a single segment (or segment slice for multi-ring)
  const renderSegment = (segment, segmentIndex, ring = null) => {
    const data = segmentData[segment.id] || {};
    const isLit = data.isLit || false;
    const startAngle = segmentIndex * segmentAngle;
    const endAngle = startAngle + segmentAngle - 1; // Small gap between segments

    let innerR, outerR;
    if (ring !== null) {
      innerR = ring.inner;
      outerR = ring.outer;
    } else {
      innerR = innerRadius;
      outerR = outerRadius;
    }

    // Determine if this specific ring slice is lit (for 2D wheels)
    let sliceLit = isLit;
    if (ring !== null && data.ring) {
      const ringNames = ['inner', 'middle', 'outer'];
      sliceLit = isLit && ringNames[ring.ringIndex] === data.ring;
    }

    const path = describeArc(innerR, outerR, startAngle, endAngle);
    const isHovered = hoveredSegment?.id === segment.id;

    return (
      <path
        key={`${segment.id}-${ring?.ringIndex ?? 0}`}
        d={path}
        className={`wheel-segment ${sliceLit ? 'lit' : 'unlit'} ${isHovered ? 'hovered' : ''}`}
        fill={sliceLit ? segment.color : '#2a2a2a'}
        stroke="#1a1a1a"
        strokeWidth="1"
        style={{
          cursor: onSegmentClick ? 'pointer' : 'default',
          opacity: sliceLit ? 1 : 0.4,
          filter: isHovered ? 'brightness(1.2)' : 'none',
          transition: 'all 0.2s ease',
        }}
        onClick={() => onSegmentClick?.(segment, data)}
        onMouseMove={(e) => handleMouseMove(e, segment)}
        onMouseLeave={() => setHoveredSegment(null)}
      />
    );
  };

  // Render all segments
  const renderSegments = () => {
    if (rings === 1) {
      return segments.map((segment, i) => renderSegment(segment, i));
    }

    // Multi-ring: render each ring for each segment
    return segments.flatMap((segment, segmentIndex) =>
      ringRadii.map((ring) => renderSegment(segment, segmentIndex, ring))
    );
  };

  // Render labels around the wheel
  const renderLabels = () => {
    if (!showLabels) return null;

    return segments.map((segment, i) => {
      const pos = getLabelPosition(i);
      const data = segmentData[segment.id] || {};
      const isLit = data.isLit || false;
      const angle = i * segmentAngle + segmentAngle / 2;

      // Rotate text for readability
      let textAnchor = 'middle';
      let rotation = 0;

      if (angle > 90 && angle < 270) {
        rotation = angle + 180;
        textAnchor = 'middle';
      } else {
        rotation = angle;
      }

      return (
        <text
          key={`label-${segment.id}`}
          x={pos.x}
          y={pos.y}
          textAnchor={textAnchor}
          className={`wheel-label ${isLit ? 'lit' : 'unlit'}`}
          style={{
            fill: isLit ? segment.color : '#666',
            fontSize: '10px',
            fontWeight: isLit ? '600' : '400',
          }}
          transform={`rotate(${rotation - 90}, ${pos.x}, ${pos.y})`}
        >
          {segment.icon} {segment.displayName}
        </text>
      );
    });
  };

  // Render tooltip
  const renderTooltip = () => {
    if (!showTooltips || !hoveredSegment) return null;

    const data = segmentData[hoveredSegment.id] || {};

    return (
      <foreignObject
        x={tooltipPosition.x - 100}
        y={tooltipPosition.y - 80}
        width="200"
        height="80"
        style={{ pointerEvents: 'none' }}
      >
        <div className="wheel-tooltip">
          <div className="tooltip-title">
            {hoveredSegment.icon} {hoveredSegment.aspirationalTitle || hoveredSegment.displayName}
          </div>
          <div className="tooltip-tagline">{hoveredSegment.tagline}</div>
          {data.responseCount > 0 && (
            <div className="tooltip-count">{data.responseCount} response{data.responseCount !== 1 ? 's' : ''}</div>
          )}
        </div>
      </foreignObject>
    );
  };

  return (
    <div className={`wheel-container ${className}`}>
      <svg
        width={size + 60} // Extra space for labels
        height={size + 60}
        viewBox={`-30 -30 ${size + 60} ${size + 60}`}
        className="competence-wheel"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius + 2}
          fill="none"
          stroke="#333"
          strokeWidth="2"
        />

        {/* Segments */}
        <g className="wheel-segments">
          {renderSegments()}
        </g>

        {/* Center content */}
        {centerContent && (
          <foreignObject
            x={center - innerRadius + 10}
            y={center - innerRadius + 10}
            width={(innerRadius - 10) * 2}
            height={(innerRadius - 10) * 2}
          >
            <div className="wheel-center">
              {centerContent}
            </div>
          </foreignObject>
        )}

        {/* Labels */}
        <g className="wheel-labels">
          {renderLabels()}
        </g>

        {/* Tooltip */}
        {renderTooltip()}
      </svg>
    </div>
  );
}

WheelBase.propTypes = {
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      icon: PropTypes.string,
      aspirationalTitle: PropTypes.string,
      tagline: PropTypes.string,
    })
  ).isRequired,
  segmentData: PropTypes.object,
  size: PropTypes.number,
  rings: PropTypes.number,
  showLabels: PropTypes.bool,
  showTooltips: PropTypes.bool,
  onSegmentClick: PropTypes.func,
  centerContent: PropTypes.node,
  className: PropTypes.string,
};
