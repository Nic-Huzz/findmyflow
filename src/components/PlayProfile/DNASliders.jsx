import { useState } from 'react'

const sliders = [
  {
    id: 'workRhythm',
    label: 'Work Rhythm',
    leftLabel: 'Marathon',
    rightLabel: 'Sprints',
    positionLabels: [
      'Slow and relentless \u2014 never stops, never rushes',
      'Mostly consistent, with occasional bursts',
      'A rhythm of push and rest \u2014 both matter',
      'Intense sprints with real recovery between',
      'All-in bursts then fully recharge \u2014 zero or a hundred',
    ],
  },
  {
    id: 'fuelType',
    label: 'Fuel Type',
    leftLabel: 'Fire',
    rightLabel: 'Purpose',
    positionLabels: [
      'Fuelled by fire \u2014 proving doubters wrong, competition',
      'Mostly fire, but there\u2019s a deeper reason underneath',
      'Both \u2014 competition lights the match, purpose keeps it burning',
      'Mostly mission-driven, but a competitive edge helps',
      'Pure purpose \u2014 making things better for people, values-led',
    ],
  },
  {
    id: 'scaleApproach',
    label: 'Scale Approach',
    leftLabel: 'Craft',
    rightLabel: 'Empire',
    positionLabels: [
      'Being the absolute best at one thing \u2014 mastery over scale',
      'Deep mastery, but with some reach',
      'Meaningful growth without losing what makes it special',
      'Growth-focused but quality matters',
      'Building something massive \u2014 growth, reach, legacy',
    ],
  },
]

export default function DNASliders({ onComplete, onBack, isLoading }) {
  const [values, setValues] = useState({
    workRhythm: 3,
    fuelType: 3,
    scaleApproach: 3,
  })

  const handleChange = (id, val) => {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  return (
    <>
      <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="pp-badge">Step 2 of 4</span>
        <h1>How are you wired?</h1>
        <p className="pp-subtitle">
          Slide each one to where it feels true. Trust your gut.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sliders.map((slider, i) => {
          const val = values[slider.id]
          return (
            <div
              key={slider.id}
              className={`pp-glass-card pp-slider-card pp-fade-in-up pp-stagger-${i + 2}`}
            >
              <div className="pp-slider-label">{slider.label}</div>

              <div className="pp-slider-description" key={val}>
                {slider.positionLabels[val - 1]}
              </div>

              <div className="pp-slider-anchors">
                <span className={`pp-slider-anchor ${val <= 2 ? 'active' : 'inactive'}`}>
                  {slider.leftLabel}
                </span>
                <span className={`pp-slider-anchor ${val >= 4 ? 'active' : 'inactive'}`}>
                  {slider.rightLabel}
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={val}
                onChange={(e) => handleChange(slider.id, Number(e.target.value))}
                className="pp-slider"
              />

              <div className="pp-slider-markers">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="pp-slider-marker"
                    style={{
                      background: val === n ? '#5e17eb' : '#dee2e6',
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="pp-btn-gold"
          disabled={isLoading}
          onClick={() => onComplete({
            workRhythm: values.workRhythm,
            fuelType: values.fuelType,
            scaleApproach: values.scaleApproach,
          })}
        >
          {isLoading ? 'Loading...' : 'Reveal My DNA'}
        </button>
        <button className="pp-btn-ghost" onClick={onBack} style={{ fontSize: 13 }}>
          Back
        </button>
      </div>
    </>
  )
}
