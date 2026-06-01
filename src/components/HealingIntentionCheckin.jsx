/**
 * HealingIntentionCheckin — End-of-week check-in modal
 *
 * Shows start-of-week splinter, user re-picks location/shape/color/intensity,
 * writes "What shifted?" reflection, saves end_* fields.
 * Morph animation plays after save.
 *
 * CSS prefix: hic-
 */

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SHAPES, COLORS, BODY_ZONES } from '../data/splinterConstants'
import SplinterVisualization from './SplinterVisualization'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './HealingIntention.css'

export default function HealingIntentionCheckin({ intention, onSave, onClose }) {
  const [step, setStep] = useState('location') // location | shape | color | intensity | reflection | morph
  const [location, setLocation] = useState(intention.start_location)
  const [shape, setShape] = useState(intention.start_shape)
  const [color, setColor] = useState(intention.start_color)
  const [intensity, setIntensity] = useState(intention.start_intensity)
  const [reflection, setReflection] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('weekly_healing_intentions')
        .update({
          end_location: location,
          end_shape: shape,
          end_color: color,
          end_intensity: intensity,
          end_reflection: reflection.trim() || null,
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', intention.id)
        .select()
        .single()
      if (dbError) throw dbError
      hapticSuccess()
      setSaving(false)
      setStep('morph')
      setTimeout(() => {
        setStep('done')
        setTimeout(() => onSave?.(data), 600)
      }, 3000)
    } catch (err) {
      console.error('Error saving check-in:', err)
      setError('Failed to save. Try again.')
      setSaving(false)
    }
  }

  const startProps = { shape: intention.start_shape, color: intention.start_color, location: intention.start_location }
  const endProps = { shape, color, location }

  return (
    <div className="his-overlay" onClick={onClose}>
      <div className="his-modal" onClick={e => e.stopPropagation()}>
        <button className="his-skip" onClick={onClose}>Close</button>

        {/* Current intention reminder */}
        {step !== 'morph' && (
          <div className="hic-intention-reminder">
            "{intention.intention_text}"
          </div>
        )}

        {/* Step 1: Location */}
        {step === 'location' && (
          <>
            <h2 className="his-title">How does it feel now?</h2>
            <p className="his-subtitle">Where do you feel it in your body today?</p>

            <div className="hic-before">
              <SplinterVisualization {...startProps} size="medium" texture="rough" movement="pulsing" compact animate />
              <span className="hic-before-label">Start of week</span>
            </div>

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
            <button className="his-next" onClick={() => { hapticLight(); setStep('shape') }}>Next</button>
          </>
        )}

        {/* Step 2: Shape */}
        {step === 'shape' && (
          <>
            <h2 className="his-title">What shape now?</h2>
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
              <button className="his-next" onClick={() => { hapticLight(); setStep('color') }}>Next</button>
            </div>
          </>
        )}

        {/* Step 3: Color */}
        {step === 'color' && (
          <>
            <h2 className="his-title">What color now?</h2>
            <div className="his-preview">
              <SplinterVisualization shape={shape} color={color} location={location} size="medium" texture="rough" movement="pulsing" compact animate />
            </div>
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
              <button className="his-next" onClick={() => { hapticLight(); setStep('intensity') }}>Next</button>
            </div>
          </>
        )}

        {/* Step 4: Intensity */}
        {step === 'intensity' && (
          <>
            <h2 className="his-title">How intense now?</h2>
            <p className="his-subtitle">Started at {intention.start_intensity}/10</p>
            <div className="his-preview">
              <SplinterVisualization shape={shape} color={color} location={location} size="medium" texture="rough" movement="pulsing" compact animate />
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
            <div className="his-nav">
              <button className="his-back" onClick={() => setStep('color')}>Back</button>
              <button className="his-next" onClick={() => { hapticLight(); setStep('reflection') }}>Next</button>
            </div>
          </>
        )}

        {/* Step 5: Reflection */}
        {step === 'reflection' && (
          <>
            <h2 className="his-title">What shifted?</h2>
            <p className="his-subtitle">Even small changes matter.</p>

            <div className="hic-comparison">
              <div className="hic-compare-side">
                <SplinterVisualization {...startProps} size="medium" texture="rough" movement="still" compact />
                <span className="hic-compare-label">Then</span>
                <span className="hic-compare-intensity">{intention.start_intensity}/10</span>
              </div>
              <span className="hic-compare-arrow">→</span>
              <div className="hic-compare-side">
                <SplinterVisualization {...endProps} size="medium" texture="rough" movement="pulsing" compact animate />
                <span className="hic-compare-label">Now</span>
                <span className="hic-compare-intensity">{intensity}/10</span>
              </div>
            </div>

            <textarea
              className="his-textarea"
              placeholder="What changed, what's still there, what surprised you..."
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              rows={3}
              autoFocus
            />

            {error && <p className="his-error">{error}</p>}

            <div className="his-nav">
              <button className="his-back" onClick={() => setStep('intensity')}>Back</button>
              <button className="his-save" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving...' : 'Save check-in'}
              </button>
            </div>
          </>
        )}

        {/* Morph animation */}
        {step === 'morph' && (
          <div className="hic-morph-container">
            <h2 className="his-title">Healing in progress</h2>
            <div className="hic-morph-viz">
              <SplinterVisualization
                {...endProps}
                size="medium"
                texture="rough"
                movement="pulsing"
                morphFrom={startProps}
                animate
              />
            </div>
            <p className="his-subtitle">
              {intensity < intention.start_intensity
                ? `${intention.start_intensity}/10 → ${intensity}/10`
                : intensity === intention.start_intensity
                  ? 'Same intensity, but something shifted'
                  : `${intention.start_intensity}/10 → ${intensity}/10`
              }
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="hic-morph-container">
            <p className="his-subtitle">Check-in saved</p>
          </div>
        )}
      </div>
    </div>
  )
}

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
