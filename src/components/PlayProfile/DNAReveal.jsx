import { useState, useEffect } from 'react'

const factorNames = ['Work Rhythm', 'Fuel Type', 'Orientation', 'Knowledge Style', 'Scale Approach']

const factorLabels = {
  0: ['Grinder', 'Sprinter'],
  1: ['Fire-Fueled', 'Purpose-Driven'],
  2: ['Product', 'Market'],
  3: ['Study', 'Do'],
  4: ['Craft', 'Empire'],
}

function getFactorDescription(idx, value) {
  const [low, high] = factorLabels[idx]
  if (value <= 2) return low
  if (value >= 4) return high
  return 'Balanced'
}

function getBusinessSummary(founder) {
  const raw = founder.businessBio
    || founder.stageStories?.general?.[0]?.content
  if (!raw) return null
  return raw
    .replace(/\*\*/g, '')
    .replace(/\*The Problem:\*\s*/i, '')
    .split('. ')
    .slice(0, 2)
    .join('. ') + '.'
}

export default function DNAReveal({ profile, match, onContinue, onFounderChange, continueLabel }) {
  const [phase, setPhase] = useState(0)
  const [showCopied, setShowCopied] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)

  const topMatches = match.topMatches || [match]
  const selected = topMatches[selectedIdx]
  const businessSummary = getBusinessSummary(selected.founder)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2600),
      setTimeout(() => setPhase(4), 3400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const digits = profile.code.split('-')

  function handleSelectFounder(idx) {
    setSelectedIdx(idx)
    if (onFounderChange) onFounderChange(topMatches[idx])
  }

  const handleShare = async () => {
    const text = `My Founder DNA: ${profile.code} \u2014 ${match.archetype}\nI think like ${selected.founder.name} (${selected.founder.company})\n\nDiscover yours at findmyflow.nichuzz.com`
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Phase 0: Loading spinner */}
      {phase === 0 && (
        <div className="pp-fade-in" style={{ padding: '60px 0' }}>
          <div className="pp-spinner" />
          <p className="pp-subtitle" style={{ fontWeight: 500 }}>Analyzing your play DNA...</p>
        </div>
      )}

      {/* Phase 1+: DNA Code */}
      {phase >= 1 && (
        <div style={{ marginBottom: 24 }}>
          <div
            className="pp-reveal-label"
            style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            Your Founder DNA
          </div>
          <div className="pp-dna-code">
            {digits.map((d, i) => (
              <span
                key={i}
                className="pp-dna-digit"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {d}{i < digits.length - 1 ? '-' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Phase 2+: Archetype */}
      {phase >= 2 && (
        <div className="pp-fade-in-up" style={{ marginBottom: 28 }}>
          <div className="pp-archetype">{match.archetype}</div>
        </div>
      )}

      {/* Phase 3+: Founder match carousel */}
      {phase >= 3 && (
        <>
          {/* Top match - large card */}
          <div className="pp-glass-card pp-founder-card pp-fade-in-up">
            <div className="pp-founder-icon">
              {selected.founder.fuelType >= 4 ? '\u2728' : '\ud83d\udd25'}
            </div>
            <div className="pp-founder-label">You think like</div>
            <div className="pp-founder-name">{selected.founder.name}</div>
            <div className="pp-founder-company">{selected.founder.company}</div>

            {selected.founder.oneLiner && (
              <div className="pp-founder-quote">
                &ldquo;{selected.founder.oneLiner}&rdquo;
              </div>
            )}

            {businessSummary && (
              <div className="pp-founder-bio">
                {businessSummary}
              </div>
            )}

            {selectedIdx === 0 && (
              <div className="pp-match-badge">Best Match</div>
            )}
          </div>

          {/* Other matches - horizontal scroll */}
          {topMatches.length > 1 && (
            <div className="pp-fade-in-up" style={{ marginTop: 16 }}>
              <div className="pp-reveal-label" style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 10,
              }}>
                Other founders who think like you
              </div>
              <div className="pp-founder-carousel">
                {topMatches.map((m, i) => (
                  <button
                    key={m.founder.name}
                    className={`pp-founder-chip${i === selectedIdx ? ' pp-chip-selected' : ''}`}
                    onClick={() => handleSelectFounder(i)}
                  >
                    <span className="pp-chip-icon">
                      {m.founder.fuelType >= 4 ? '\u2728' : '\ud83d\udd25'}
                    </span>
                    <span className="pp-chip-name">{m.founder.name}</span>
                    <span className="pp-chip-company">{m.founder.company}</span>
                    {i === 0 && <span className="pp-chip-badge">Best</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Phase 4: Factor breakdown + actions */}
      {phase >= 4 && (
        <>
          <div className="pp-glass-card pp-fade-in-up" style={{ padding: 16, marginTop: 20, marginBottom: 24, textAlign: 'left' }}>
            {digits.map((d, i) => (
              <div key={i} className="pp-factor-row">
                <span className="pp-factor-name">{factorNames[i]}</span>
                <span className="pp-factor-value">{getFactorDescription(i, Number(d))}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="pp-btn-gold" onClick={onContinue}>
              {continueLabel || 'What should I work on?'}
            </button>
            <button className="pp-btn-ghost" onClick={handleShare}>
              Share my DNA
            </button>
          </div>
        </>
      )}

      {/* Copied toast */}
      {showCopied && (
        <div className="pp-toast pp-fade-in-up">
          Copied to clipboard
        </div>
      )}
    </div>
  )
}
