/**
 * SplinterCheckin — Post-quest modal for tracking splinter changes
 *
 * Shows after completing a Healing quest (non-gateway).
 * Users re-rate need intensity and re-describe their splinter properties.
 * Morph animation shows old → new over 2s.
 * Saves to healing_checkins table.
 *
 * Props:
 *   userId           — auth user id
 *   healingCompassId — UUID of the parent healing_compass_responses row
 *   previousSplinter — { splinter_location, splinter_shape, splinter_size,
 *                        splinter_color, splinter_texture, splinter_movement,
 *                        need_intensity, questId }
 *   onClose          — callback to dismiss modal
 */

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import SplinterVisualization from './SplinterVisualization'
import './SplinterCheckin.css'

const SHAPES = ['spike', 'knot', 'weight', 'wall', 'void', 'cloud', 'flame', 'ball']
const SIZES = ['tiny', 'small', 'medium', 'large', 'massive']
const COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#6b7280', label: 'Grey' },
  { value: '#1f2937', label: 'Black' },
]
const TEXTURES = ['rough', 'smooth', 'burning', 'cold', 'sharp', 'heavy', 'tight']
const MOVEMENTS = ['still', 'pulsing', 'spinning', 'expanding', 'contracting', 'vibrating']
const BODY_ZONES = ['head', 'throat', 'chest', 'stomach', 'hips', 'left_arm', 'right_arm', 'thighs']

function SplinterCheckin({ userId, healingCompassId, previousSplinter, onClose }) {
  const [step, setStep] = useState('rate') // rate → describe → morph → done
  const [saving, setSaving] = useState(false)

  // Pre-fill from previous state
  const [needIntensity, setNeedIntensity] = useState(previousSplinter?.need_intensity || 5)
  const [location, setLocation] = useState(previousSplinter?.splinter_location || 'chest')
  const [shape, setShape] = useState(previousSplinter?.splinter_shape || 'spike')
  const [size, setSize] = useState(previousSplinter?.splinter_size || 'medium')
  const [color, setColor] = useState(previousSplinter?.splinter_color || '#ef4444')
  const [texture, setTexture] = useState(previousSplinter?.splinter_texture || 'rough')
  const [movement, setMovement] = useState(previousSplinter?.splinter_movement || 'pulsing')

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('healing_checkins')
        .insert({
          user_id: userId,
          healing_compass_id: healingCompassId,
          need_intensity: needIntensity,
          splinter_location: location,
          splinter_shape: shape,
          splinter_size: size,
          splinter_color: color,
          splinter_texture: texture,
          splinter_movement: movement,
          quest_id: previousSplinter?.questId || null,
        })

      if (error) {
        console.error('Error saving splinter check-in:', error)
      }

      setStep('morph')
      // Auto-close after morph animation
      setTimeout(() => {
        setStep('done')
        setTimeout(onClose, 600)
      }, 2500)
    } catch (err) {
      console.error('Error saving check-in:', err)
    } finally {
      setSaving(false)
    }
  }

  const previousProps = {
    location: previousSplinter?.splinter_location || 'chest',
    shape: previousSplinter?.splinter_shape || 'spike',
    size: previousSplinter?.splinter_size || 'medium',
    color: previousSplinter?.splinter_color || '#ef4444',
    texture: previousSplinter?.splinter_texture || 'rough',
    movement: previousSplinter?.splinter_movement || 'pulsing',
  }

  const currentProps = { location, shape, size, color, texture, movement }

  return (
    <div className="splinter-checkin-overlay" onClick={onClose}>
      <div className="splinter-checkin-modal" onClick={e => e.stopPropagation()}>
        {/* Skip button always visible */}
        <button className="splinter-checkin-skip" onClick={onClose}>Skip</button>

        {step === 'rate' && (
          <>
            <h2 className="splinter-checkin-title">How's your splinter?</h2>
            <p className="splinter-checkin-subtitle">After this healing quest, how intense is the feeling now?</p>

            <div className="splinter-checkin-viz">
              <SplinterVisualization {...previousProps} animate />
            </div>

            <div className="splinter-checkin-rating">
              <span className="rating-label">Intensity</span>
              <div className="rating-row">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    className={`rating-btn ${needIntensity === n ? 'active' : ''} ${n === 7 ? 'disabled-seven' : ''}`}
                    onClick={() => n !== 7 && setNeedIntensity(n)}
                    disabled={n === 7}
                    title={n === 7 ? 'Commit — high or low' : undefined}
                  >
                    {n === 7 ? <s>7</s> : n}
                  </button>
                ))}
              </div>
              <div className="rating-labels">
                <span>Barely there</span>
                <span>Overwhelming</span>
              </div>
            </div>

            <button className="splinter-checkin-next" onClick={() => setStep('describe')}>
              Describe changes
            </button>
          </>
        )}

        {step === 'describe' && (
          <>
            <h2 className="splinter-checkin-title">Has anything shifted?</h2>
            <p className="splinter-checkin-subtitle">Update any properties that feel different now.</p>

            <div className="splinter-checkin-sections">
              {/* Location */}
              <div className="checkin-section">
                <label>Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)}>
                  {BODY_ZONES.map(z => (
                    <option key={z} value={z}>{z.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Shape */}
              <div className="checkin-section">
                <label>Shape</label>
                <div className="checkin-options">
                  {SHAPES.map(s => (
                    <button key={s} className={`checkin-opt ${shape === s ? 'active' : ''}`} onClick={() => setShape(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="checkin-section">
                <label>Size</label>
                <div className="checkin-options">
                  {SIZES.map(s => (
                    <button key={s} className={`checkin-opt ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="checkin-section">
                <label>Color</label>
                <div className="checkin-colors">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      className={`checkin-swatch ${color === c.value ? 'active' : ''}`}
                      style={{ background: c.value }}
                      onClick={() => setColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Texture */}
              <div className="checkin-section">
                <label>Texture</label>
                <div className="checkin-options">
                  {TEXTURES.map(t => (
                    <button key={t} className={`checkin-opt ${texture === t ? 'active' : ''}`} onClick={() => setTexture(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Movement */}
              <div className="checkin-section">
                <label>Movement</label>
                <div className="checkin-options">
                  {MOVEMENTS.map(m => (
                    <button key={m} className={`checkin-opt ${movement === m ? 'active' : ''}`} onClick={() => setMovement(m)}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="checkin-actions">
              <button className="splinter-checkin-back" onClick={() => setStep('rate')}>Back</button>
              <button className="splinter-checkin-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save check-in'}
              </button>
            </div>
          </>
        )}

        {step === 'morph' && (
          <>
            <h2 className="splinter-checkin-title">Healing in progress</h2>
            <p className="splinter-checkin-subtitle">Watch your splinter shift...</p>
            <div className="splinter-checkin-morph">
              <SplinterVisualization
                {...currentProps}
                morphFrom={previousProps}
                animate
              />
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="splinter-checkin-done">
            <p>Check-in saved</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SplinterCheckin
