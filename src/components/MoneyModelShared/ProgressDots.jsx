/**
 * Shared ProgressDots for Money Model flows
 * Displays progress through stage groups as dots
 */

function ProgressDots({ stageGroups, currentStage }) {
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
