const TYPE_META = {
  DO_IT:    { label: 'DO IT',    className: 'do-it' },
  CUT_IT:   { label: 'CUT IT',   className: 'cut-it' },
  THINK_IT: { label: 'THINK IT', className: 'think-it' },
  MAKE_IT:  { label: 'MAKE IT',  className: 'make-it' },
}

export default function ChallengeDelivery({
  founderName, challengeType, mirror, bridge, action, onAccept,
}) {
  const meta = TYPE_META[challengeType] || TYPE_META.DO_IT

  return (
    <div style={{ paddingTop: 16, paddingBottom: 40 }}>
      {/* Header */}
      <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2>{founderName}&apos;s challenge for you</h2>
        <span className={`pp-type-badge ${meta.className}`}>{meta.label}</span>
      </div>

      {/* Mirror — Feel Seen */}
      <div className="pp-challenge-mirror pp-challenge-section pp-fade-in-up pp-stagger-2">
        <div className="pp-challenge-label">Mirror</div>
        <div className="pp-challenge-content">{mirror}</div>
      </div>

      {/* Bridge — Feel Inspired */}
      <div className="pp-challenge-bridge pp-challenge-section pp-fade-in-up pp-stagger-3">
        <div className="pp-challenge-label">The Principle</div>
        <div className="pp-challenge-content">{bridge}</div>
      </div>

      {/* Challenge — Feel Activated */}
      <div className="pp-challenge-action pp-challenge-section pp-fade-in-up pp-stagger-4">
        <div className="pp-challenge-label">Your Challenge</div>
        <div className="pp-challenge-content">{action}</div>
      </div>

      {/* CTA */}
      <div className="pp-fade-in-up pp-stagger-5" style={{ marginTop: 8 }}>
        <button className="pp-btn-gold" onClick={onAccept}>
          I&apos;ll try this
        </button>
      </div>
    </div>
  )
}
