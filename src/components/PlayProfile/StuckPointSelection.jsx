import stuckPoints from '../../data/founderDnaStuckPoints'

export default function StuckPointSelection({ founderName, onSelect, onBack, stepLabel }) {
  return (
    <>
      <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 20, paddingTop: 16 }}>
        <span className="pp-badge">{stepLabel || 'Step 3 of 4'}</span>
        <h1>Where would you like support?</h1>
        <p className="pp-subtitle">
          {founderName} navigated every one of these. Pick where you are right now.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stuckPoints.map((sp, i) => (
          <div
            key={sp.id}
            className={`pp-selectable-card pp-fade-in-up pp-stagger-${Math.min(i + 1, 8)}`}
            onClick={() => onSelect(sp)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(sp))}
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div className="pp-stuck-icon">{sp.icon}</div>
            <div>
              <div className="pp-sp-name">{sp.name}</div>
              <div className="pp-sp-desc">{sp.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="pp-back-link" onClick={onBack}>
          ← Back
        </button>
      </div>
    </>
  )
}
