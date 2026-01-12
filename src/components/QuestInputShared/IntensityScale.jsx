/**
 * IntensityScale - Reusable before/after intensity slider
 *
 * Used in Release quests to track emotional intensity shifts.
 * Displays two 1-5 scales with emoji endpoints and shift calculation.
 */

import './IntensityScale.css'

/**
 * @param {Object} props
 * @param {number|null} props.beforeValue - Before intensity value (1-5)
 * @param {number|null} props.afterValue - After intensity value (1-5)
 * @param {Function} props.onBeforeChange - Callback when before value changes
 * @param {Function} props.onAfterChange - Callback when after value changes
 * @param {string} [props.beforeLabel] - Label for before scale
 * @param {string} [props.afterLabel] - Label for after scale
 * @param {string} [props.lowEmoji] - Emoji for low end (default: 😌)
 * @param {string} [props.highEmoji] - Emoji for high end (default: 😰)
 * @param {number} [props.min] - Minimum value (default: 1)
 * @param {number} [props.max] - Maximum value (default: 5)
 */
function IntensityScale({
  beforeValue,
  afterValue,
  onBeforeChange,
  onAfterChange,
  beforeLabel = 'Intensity before',
  afterLabel = 'Intensity after',
  lowEmoji = '😌',
  highEmoji = '😰',
  min = 1,
  max = 5
}) {
  // Reverse order: HIGH (5) on left → LOW (1) on right (matches release journey)
  const levels = Array.from({ length: max - min + 1 }, (_, i) => max - i)

  const shift = beforeValue && afterValue ? beforeValue - afterValue : null
  const shiftClass = shift > 0 ? 'positive' : shift < 0 ? 'negative' : 'neutral'

  return (
    <div className="intensity-scale-container">
      {/* Before Scale */}
      <div className="intensity-section">
        <label className="intensity-label">{beforeLabel}</label>
        <div className="intensity-scale">
          <span className="intensity-end">{highEmoji}</span>
          <div className="intensity-buttons">
            {levels.map(level => (
              <button
                key={level}
                type="button"
                className={`intensity-btn ${beforeValue === level ? 'selected' : ''}`}
                onClick={() => onBeforeChange(level)}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="intensity-end">{lowEmoji}</span>
        </div>
      </div>

      {/* After Scale */}
      <div className="intensity-section">
        <label className="intensity-label">{afterLabel}</label>
        <div className="intensity-scale">
          <span className="intensity-end">{highEmoji}</span>
          <div className="intensity-buttons">
            {levels.map(level => (
              <button
                key={level}
                type="button"
                className={`intensity-btn ${afterValue === level ? 'selected' : ''}`}
                onClick={() => onAfterChange(level)}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="intensity-end">{lowEmoji}</span>
        </div>
      </div>

      {/* Shift Display */}
      {shift !== null && (
        <div className="shift-display">
          <span className="shift-label">Shift:</span>
          <span className={`shift-value ${shiftClass}`}>
            {shift > 0 ? '-' : '+'}
            {Math.abs(shift)} intensity
          </span>
        </div>
      )}
    </div>
  )
}

export default IntensityScale
