/**
 * ZoneDiagnosis.jsx
 *
 * 3 scene cards for zone self-diagnosis.
 * User taps which zone they identify with.
 * If extreme zone selected, the Boss is revealed.
 *
 * Created: 2026-03-27
 */

export default function ZoneDiagnosis({ zones, onSelect, selectedZone }) {
  return (
    <div className="level-zone-diagnosis">
      <h3 className="level-section-title">Where are you on this graph?</h3>
      <div className="level-zone-cards">
        {['topLeft', 'diagonal', 'bottomRight'].map(zoneKey => {
          const zone = zones[zoneKey]
          const isSelected = selectedZone === zoneKey
          return (
            <button
              key={zoneKey}
              type="button"
              className={`level-zone-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(zoneKey)}
            >
              {zone.image && (
                <img
                  className="level-zone-image"
                  src={zone.image}
                  alt={zone.name}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
              <div className="level-zone-pill">
                <div className="level-zone-name">{zone.name}</div>
                <div className="level-zone-desc">{zone.description}</div>
              </div>
              {isSelected && <div className="level-zone-check">&#10003;</div>}
            </button>
          )
        })}
      </div>
      {selectedZone && selectedZone !== 'diagonal' && zones[selectedZone]?.boss && (
        <div className="level-boss-reveal">
          <span className="level-boss-icon">&#9876;&#65039;</span>
          <span>Your Boss: <strong>{zones[selectedZone].boss}</strong></span>
        </div>
      )}
      {selectedZone === 'diagonal' && (
        <div className="level-diagonal-msg">
          This one didn't get you. Nice.
        </div>
      )}
    </div>
  )
}
