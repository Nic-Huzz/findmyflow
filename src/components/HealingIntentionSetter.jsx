/**
 * HealingIntentionSetter — Modal for setting a weekly healing intention
 *
 * 5-step flow: intention text → body location → shape → color → intensity → save
 * Saves to weekly_healing_intentions table.
 *
 * CSS prefix: his-
 */

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { SHAPES, COLORS, BODY_ZONES } from '../data/splinterConstants'
import SplinterVisualization from './SplinterVisualization'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './HealingIntention.css'

export default function HealingIntentionSetter({ userId, onSave, onClose, stuckPoints = [] }) {
  const [step, setStep] = useState('intention') // intention | location | shape | color | intensity
  const [intentionText, setIntentionText] = useState('')
  const [location, setLocation] = useState(null)
  const [shape, setShape] = useState(null)
  const [color, setColor] = useState(null)
  const [intensity, setIntensity] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!intentionText.trim() || !location || !shape || !color || !intensity) return
    setSaving(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('weekly_healing_intentions')
        .upsert({
          user_id: userId,
          week_start_date: getWeekStartLocal(),
          intention_text: intentionText.trim(),
          start_location: location,
          start_shape: shape,
          start_color: color,
          start_intensity: intensity,
          end_location: null,
          end_shape: null,
          end_color: null,
          end_intensity: null,
          end_reflection: null,
          checked_in_at: null,
        }, { onConflict: 'user_id,week_start_date' })
        .select()
        .single()
      if (dbError) throw dbError
      hapticSuccess()
      onSave?.(data)
    } catch (err) {
      console.error('Error saving intention:', err)
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const stepNum = { intention: 1, location: 2, shape: 3, color: 4, intensity: 5 }[step]

  return (
    <div className="his-overlay" onClick={onClose}>
      <div className="his-modal" onClick={e => e.stopPropagation()}>
        <button className="his-skip" onClick={onClose}>Skip</button>

        {/* Progress dots */}
        <div className="his-progress">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`his-dot ${n <= stepNum ? 'active' : ''}`} />
          ))}
        </div>

        {/* Step 1: Intention */}
        {step === 'intention' && (
          <>
            <h2 className="his-title">This week's healing focus</h2>
            <p className="his-subtitle">Where are you struggling to make progress right now?</p>
            <textarea
              className="his-textarea"
              placeholder="I keep..."
              value={intentionText}
              onChange={e => setIntentionText(e.target.value)}
              rows={3}
              autoFocus
            />
            {/* Stuck point suggestions from life path */}
            {stuckPoints.length > 0 && !intentionText.trim() && (
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.4, marginBottom: 6 }}>From your life path</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {stuckPoints.filter(sp => sp.reason).slice(0, 5).map(sp => {
                    const reasonText = sp.reasonLabel ? sp.reasonLabel.toLowerCase() : 'avoiding'
                    const suggestion = `I keep ${reasonText === 'too busy' ? 'saying I\'m too busy to' : reasonText === 'scared of failing' ? 'being scared to' : reasonText === 'waiting for the right time' ? 'waiting for the right time to' : reasonText === 'need more money' ? 'saying I need more money to' : reasonText === 'need to learn more' ? 'saying I need to learn more before I' : 'putting off'} ${sp.text.toLowerCase()}`
                    return (
                      <button key={sp.id} onClick={() => { setIntentionText(suggestion); hapticLight() }}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(233,162,59,0.2)', background: 'rgba(233,162,59,0.06)',
                          color: 'inherit', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', lineHeight: 1.4, opacity: 0.7,
                          transition: 'opacity 0.15s' }}>
                        {suggestion}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <button
              className="his-next"
              disabled={!intentionText.trim()}
              onClick={() => { hapticLight(); setStep('location') }}
            >
              Next
            </button>
          </>
        )}

        {/* Step 2: Location */}
        {step === 'location' && (
          <>
            <h2 className="his-title">Where do you feel it?</h2>
            <p className="his-subtitle">Tap the area in your body where this lives.</p>
            <div className="his-body-grid">
              {BODY_ZONES.map(z => (
                <button
                  key={z}
                  className={`his-body-btn ${location === z ? 'active' : ''}`}
                  onClick={() => { hapticLight(); setLocation(z) }}
                >
                  {z.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="his-nav">
              <button className="his-back" onClick={() => setStep('intention')}>Back</button>
              <button className="his-next" disabled={!location} onClick={() => { hapticLight(); setStep('shape') }}>Next</button>
            </div>
          </>
        )}

        {/* Step 3: Shape */}
        {step === 'shape' && (
          <>
            <h2 className="his-title">What shape does it take?</h2>
            <p className="his-subtitle">Pick the shape that matches the feeling.</p>
            <div className="his-shape-grid">
              {SHAPES.map(s => (
                <button
                  key={s}
                  className={`his-shape-btn ${shape === s ? 'active' : ''}`}
                  onClick={() => { hapticLight(); setShape(s) }}
                >
                  <svg viewBox="-30 -30 60 60" width="40" height="40">
                    {renderShapePreview(s, shape === s ? (color || '#8b5cf6') : '#cbd5e1')}
                  </svg>
                  <span>{s}</span>
                </button>
              ))}
            </div>
            <div className="his-nav">
              <button className="his-back" onClick={() => setStep('location')}>Back</button>
              <button className="his-next" disabled={!shape} onClick={() => { hapticLight(); setStep('color') }}>Next</button>
            </div>
          </>
        )}

        {/* Step 4: Color */}
        {step === 'color' && (
          <>
            <h2 className="his-title">What color?</h2>
            <p className="his-subtitle">If this feeling had a color, what would it be?</p>

            {shape && (
              <div className="his-preview">
                <SplinterVisualization
                  shape={shape}
                  color={color || '#6b7280'}
                  location={location}
                  size="medium"
                  texture="rough"
                  movement="pulsing"
                  compact
                  animate
                />
              </div>
            )}

            <div className="his-color-grid">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  className={`his-swatch ${color === c.value ? 'active' : ''}`}
                  style={{ background: c.value }}
                  onClick={() => { hapticLight(); setColor(c.value) }}
                  title={c.label}
                />
              ))}
            </div>
            <div className="his-nav">
              <button className="his-back" onClick={() => setStep('shape')}>Back</button>
              <button className="his-next" disabled={!color} onClick={() => { hapticLight(); setStep('intensity') }}>Next</button>
            </div>
          </>
        )}

        {/* Step 5: Intensity */}
        {step === 'intensity' && (
          <>
            <h2 className="his-title">How intense is it?</h2>
            <p className="his-subtitle">Right now, how much is this affecting you?</p>

            <div className="his-preview">
              <SplinterVisualization
                shape={shape}
                color={color}
                location={location}
                size="medium"
                texture="rough"
                movement="pulsing"
                compact
                animate
              />
            </div>

            <div className="his-rating">
              <div className="his-rating-row">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    className={`his-rating-btn ${intensity === n ? 'active' : ''}`}
                    onClick={() => { hapticLight(); setIntensity(n) }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="his-rating-labels">
                <span>Barely there</span>
                <span>Overwhelming</span>
              </div>
            </div>

            {error && <p className="his-error">{error}</p>}

            <div className="his-nav">
              <button className="his-back" onClick={() => setStep('color')}>Back</button>
              <button
                className="his-save"
                disabled={!intensity || saving}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Set intention'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Inline shape preview renderer (mirrors SplinterVisualization's renderShape)
function renderShapePreview(shape, fill) {
  switch (shape) {
    case 'spike': return <polygon points="0,-22 8,18 -8,18" fill={fill} />
    case 'knot': return <path d="M0,-16 C12,-8 8,8 0,16 C-8,8 -12,-8 0,-16 Z" fill={fill} />
    case 'weight': return <rect x="-13" y="-10" width="26" height="20" rx="3" fill={fill} />
    case 'wall': return <rect x="-18" y="-6" width="36" height="12" rx="2" fill={fill} />
    case 'void': return <><circle cx="0" cy="0" r="15" fill={fill} /><circle cx="0" cy="0" r="8" fill="rgba(0,0,0,0.5)" /></>
    case 'cloud': return <><ellipse cx="-6" cy="0" rx="10" ry="8" fill={fill} /><ellipse cx="6" cy="-3" rx="8" ry="7" fill={fill} opacity="0.9" /></>
    case 'flame': return <path d="M0,-20 C6,-10 13,0 8,12 C5,18 -5,18 -8,12 C-13,0 -6,-10 0,-20 Z" fill={fill} />
    case 'ball': default: return <circle cx="0" cy="0" r="15" fill={fill} />
  }
}
