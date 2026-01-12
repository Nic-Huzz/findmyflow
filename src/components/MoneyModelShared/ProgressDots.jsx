/**
 * Shared ProgressDots for Money Model flows
 * Displays progress through stage groups as dots
 *
 * Supports two interfaces:
 * 1. stageGroups + currentStage (MoneyModelFlowBase)
 * 2. current + total (OfferBuilder100M simple mode)
 */

function ProgressDots({ stageGroups, currentStage, current, total }) {
  // Simple mode: current/total numbers
  if (typeof current === 'number' && typeof total === 'number') {
    return (
      <div className="progress-container">
        <div className="progress-dots">
          {Array.from({ length: total }, (_, index) => (
            <div
              key={index}
              className={`progress-dot ${index < current - 1 ? 'completed' : ''} ${index === current - 1 ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Stage groups mode: stageGroups array
  if (!stageGroups || !Array.isArray(stageGroups)) {
    return null
  }

  // Find which group the current stage belongs to
  const getCurrentGroupIndex = () => {
    for (let i = 0; i < stageGroups.length; i++) {
      if (stageGroups[i].stages.includes(currentStage)) {
        return i
      }
    }
    return 0
  }

  const currentGroupIndex = getCurrentGroupIndex()

  return (
    <div className="progress-container">
      <div className="progress-dots">
        {stageGroups.map((group, index) => (
          <div
            key={group.id}
            className={`progress-dot ${index < currentGroupIndex ? 'completed' : ''} ${index === currentGroupIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default ProgressDots
