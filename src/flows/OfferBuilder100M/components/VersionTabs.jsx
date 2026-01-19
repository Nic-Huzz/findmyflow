/**
 * VersionTabs - Reusable multi-version tab component for Steps 4-7B
 *
 * Features:
 * - Shows tabs only for selected version types
 * - "Apply to All" button when multiple versions selected
 * - Single version mode (no tabs, just header)
 * - Tracks completion status per version
 */

const VERSION_INFO = {
  service: {
    icon: '💼',
    label: 'Service'
  },
  productized: {
    icon: '📦',
    label: 'Productized'
  },
  product: {
    icon: '🛠️',
    label: 'Product'
  }
}

function VersionTabs({
  selectedVersionTypes,
  activeVersion,
  onVersionChange,
  completedVersions = [],
  showApplyAll = false,
  onApplyAll,
  applyAllDisabled = false,
  applyAllLabel = 'Apply to All Versions'
}) {
  // Single version - show simple header instead of tabs
  if (selectedVersionTypes.length === 1) {
    const type = selectedVersionTypes[0]
    const info = VERSION_INFO[type]

    return (
      <div className="single-version-header">
        <span className="version-icon">{info.icon}</span>
        <span className="version-label">{info.label} Version</span>
      </div>
    )
  }

  // Multiple versions - show tabs
  return (
    <div className="version-tabs-container">
      {/* Progress dots */}
      <div className="tab-progress">
        {selectedVersionTypes.map((type, i) => (
          <div
            key={type}
            className={`tab-progress-dot ${
              completedVersions.includes(type)
                ? 'completed'
                : activeVersion === type
                  ? 'active'
                  : ''
            }`}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="version-tabs">
        {selectedVersionTypes.map(type => {
          const info = VERSION_INFO[type]
          const isActive = activeVersion === type
          const isCompleted = completedVersions.includes(type)

          return (
            <button
              key={type}
              className={`version-tab ${isActive ? 'active' : ''}`}
              onClick={() => onVersionChange(type)}
            >
              <span className="tab-icon">{info.icon}</span>
              <span className="tab-label">{info.label}</span>
              {isCompleted && <span className="tab-check">✓</span>}
            </button>
          )
        })}
      </div>

      {/* Apply to All button */}
      {showApplyAll && selectedVersionTypes.length > 1 && (
        <div className="apply-all-section">
          <button
            className="apply-all-btn"
            onClick={onApplyAll}
            disabled={applyAllDisabled}
          >
            <span className="apply-icon">📋</span>
            {applyAllLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default VersionTabs
