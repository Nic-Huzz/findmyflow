/**
 * ZoneDiagnosisFlow.jsx
 *
 * Multi-step flow for zone self-diagnosis within a level.
 * Config-driven: receives levelNumber from route params, loads from LevelConfig.
 *
 * Steps:
 *   1. Graph — Sweet Spot graph + explanation
 *   2. Zone Explainer — what the 3 zones mean
 *   3. Zone Pick — tap which zone resonates
 *   4. Protective Voices — if extreme zone, pick which Boss (conditional)
 *   5. Boss Reveal — dramatic reveal + save
 *
 * Route: /zone-diagnosis/:levelNumber
 * Saves to user_level_progress table.
 *
 * Created: 2026-03-29
 */

import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getLevelConfig } from '../components/level/LevelConfig'
import SweetSpotGraph from '../components/level/SweetSpotGraph'
import '../styles/flow-base.css'
import './ZoneDiagnosisFlow.css'

// Protective voices per side
const PROTECTIVE_VOICES = {
  topLeft: [
    { id: 'performer', name: 'The Performer', description: 'Works harder, louder, faster. Proves worth through output.' },
    { id: 'controller', name: 'The Controller', description: 'Manages everything. If they can control it, it can\'t hurt them.' },
    { id: 'people_pleaser', name: 'The People Pleaser', description: 'Says yes to everything. Earns love by being useful.' },
  ],
  bottomRight: [
    { id: 'perfectionist', name: 'The Perfectionist', description: 'Nothing is ever ready. Uses "not good enough" as a reason to never ship.' },
    { id: 'ghost', name: 'The Ghost', description: 'Disappears. Withdraws. Becomes invisible to stay safe.' },
  ],
}

const STEPS = {
  GRAPH: 'graph',
  EXPLAINER: 'explainer',
  PICK: 'pick',
  VOICES: 'voices',
  REVEAL: 'reveal',
}

export default function ZoneDiagnosisFlow() {
  const { levelNumber } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const level = parseInt(levelNumber) || 1
  const config = getLevelConfig(level)
  const returnTo = searchParams.get('returnTo') || '/7-day-challenge'

  const [step, setStep] = useState(STEPS.GRAPH)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToStep = (nextStep) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setStep(nextStep)
      setIsTransitioning(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 300)
  }

  const handleZoneSelect = (zoneKey) => {
    setSelectedZone(zoneKey)
    setSelectedVoice(null)
  }

  const handleZoneConfirm = () => {
    if (!selectedZone) return
    if (selectedZone === 'diagonal') {
      // No boss for diagonal, go straight to reveal
      goToStep(STEPS.REVEAL)
    } else {
      goToStep(STEPS.VOICES)
    }
  }

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoice(voiceId)
  }

  const handleVoiceConfirm = () => {
    if (!selectedVoice) return
    goToStep(STEPS.REVEAL)
  }

  const getBossName = () => {
    if (selectedZone === 'diagonal') return null
    if (selectedVoice) {
      const voices = PROTECTIVE_VOICES[selectedZone] || []
      const voice = voices.find(v => v.id === selectedVoice)
      return voice?.name || config.zones[selectedZone]?.boss
    }
    return config.zones[selectedZone]?.boss
  }

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const boss = getBossName()
      const { error } = await supabase
        .from('user_level_progress')
        .upsert({
          user_id: user.id,
          level: level,
          zone_selected: selectedZone,
          boss_name: boss,
          zone_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,level' })

      if (error) {
        console.warn('Failed to save zone diagnosis:', error)
      }
    } catch (err) {
      console.warn('Zone diagnosis save error:', err)
    }
    setSaving(false)
    navigate(returnTo)
  }

  // ─── Render Steps ───────────────────────────────────────────────────────────

  return (
    <div className={`zd-flow ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Step 1: Graph */}
      {step === STEPS.GRAPH && (
        <div className="zd-step zd-graph-step">
          <div className="zd-step-header">
            <div className="zd-step-badge">Level {level}</div>
            <h1 className="zd-step-title">{config.graph}</h1>
            <p className="zd-step-subtitle">
              Every level has a sweet spot. Two forces pulling in opposite directions,
              with the diagonal being where growth happens.
            </p>
          </div>

          <SweetSpotGraph
            title={config.graph}
            yAxis={config.yAxis}
            xAxis={config.xAxis}
            zones={config.zones}
          />

          <div className="zd-step-body">
            <p className="zd-explanation">
              <strong>{config.yAxis}</strong> pulls one way. <strong>{config.xAxis}</strong> pulls the other.
              Most people get stuck on one side or the other. The diagonal is where both forces
              move together.
            </p>
          </div>

          <button className="primary-button zd-next-btn" onClick={() => goToStep(STEPS.EXPLAINER)}>
            Show me the zones <span>→</span>
          </button>
        </div>
      )}

      {/* Step 2: Zone Explainer */}
      {step === STEPS.EXPLAINER && (
        <div className="zd-step zd-explainer-step">
          <div className="zd-step-header">
            <h1 className="zd-step-title">Three zones</h1>
            <p className="zd-step-subtitle">
              Where you sit on this graph tells us what's keeping you stuck.
            </p>
          </div>

          <div className="zd-zone-explainers">
            <div className="zd-zone-explain-card top-left">
              <div className="zd-zone-explain-dot" />
              <div className="zd-zone-explain-info">
                <div className="zd-zone-explain-name">{config.zones.topLeft.name}</div>
                <div className="zd-zone-explain-desc">{config.zones.topLeft.description}</div>
              </div>
            </div>

            <div className="zd-zone-explain-card diagonal">
              <div className="zd-zone-explain-dot gold" />
              <div className="zd-zone-explain-info">
                <div className="zd-zone-explain-name">{config.zones.diagonal.name}</div>
                <div className="zd-zone-explain-desc">{config.zones.diagonal.description}</div>
              </div>
            </div>

            <div className="zd-zone-explain-card bottom-right">
              <div className="zd-zone-explain-dot" />
              <div className="zd-zone-explain-info">
                <div className="zd-zone-explain-name">{config.zones.bottomRight.name}</div>
                <div className="zd-zone-explain-desc">{config.zones.bottomRight.description}</div>
              </div>
            </div>
          </div>

          <p className="zd-step-body zd-explanation">
            The two outer zones each have a <strong>protective voice</strong> keeping you there.
            That voice became your Boss.
          </p>

          <button className="primary-button zd-next-btn" onClick={() => goToStep(STEPS.PICK)}>
            Which zone am I in? <span>→</span>
          </button>

          <button className="secondary-button zd-back-btn" onClick={() => goToStep(STEPS.GRAPH)}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 3: Zone Pick */}
      {step === STEPS.PICK && (
        <div className="zd-step zd-pick-step">
          <div className="zd-step-header">
            <h1 className="zd-step-title">Be honest</h1>
            <p className="zd-step-subtitle">
              {config.essenceQuestion}
            </p>
          </div>

          <SweetSpotGraph
            title={config.graph}
            yAxis={config.yAxis}
            xAxis={config.xAxis}
            zones={config.zones}
            width="100%"
          />

          <div className="zd-zone-cards">
            {['topLeft', 'diagonal', 'bottomRight'].map(zoneKey => {
              const zone = config.zones[zoneKey]
              const isSelected = selectedZone === zoneKey
              return (
                <button
                  key={zoneKey}
                  type="button"
                  className={`zd-zone-card ${isSelected ? 'selected' : ''} ${zoneKey === 'diagonal' ? 'gold' : ''}`}
                  onClick={() => handleZoneSelect(zoneKey)}
                >
                  {zone.image && (
                    <img
                      className="zd-zone-image"
                      src={zone.image}
                      alt={zone.name}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                  <div className="zd-zone-pill">
                    <div className="zd-zone-name">{zone.name}</div>
                    <div className="zd-zone-desc">{zone.description}</div>
                  </div>
                  {isSelected && <div className="zd-zone-check">&#10003;</div>}
                </button>
              )
            })}
          </div>

          {selectedZone && (
            <button className="primary-button zd-next-btn" onClick={handleZoneConfirm}>
              {selectedZone === 'diagonal' ? 'This one didn\'t get me' : 'That\'s me'} <span>→</span>
            </button>
          )}

          <button className="secondary-button zd-back-btn" onClick={() => goToStep(STEPS.EXPLAINER)}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 4: Protective Voices (conditional — only for extreme zones) */}
      {step === STEPS.VOICES && selectedZone && selectedZone !== 'diagonal' && (
        <div className="zd-step zd-voices-step">
          <div className="zd-step-header">
            <h1 className="zd-step-title">Meet your protectors</h1>
            <p className="zd-step-subtitle">
              You're in the <strong>{config.zones[selectedZone]?.name}</strong>.
              One of these voices is keeping you there. Which one resonates most?
            </p>
          </div>

          <div className="zd-voice-cards">
            {(PROTECTIVE_VOICES[selectedZone] || []).map(voice => {
              const isSelected = selectedVoice === voice.id
              return (
                <button
                  key={voice.id}
                  type="button"
                  className={`zd-voice-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleVoiceSelect(voice.id)}
                >
                  <div className="zd-voice-name">{voice.name}</div>
                  <div className="zd-voice-desc">{voice.description}</div>
                  {isSelected && <div className="zd-voice-check">&#10003;</div>}
                </button>
              )
            })}
          </div>

          {selectedVoice && (
            <button className="primary-button zd-next-btn" onClick={handleVoiceConfirm}>
              That's my Boss <span>→</span>
            </button>
          )}

          <button className="secondary-button zd-back-btn" onClick={() => goToStep(STEPS.PICK)}>
            ← Back
          </button>
        </div>
      )}

      {/* Step 5: Boss Reveal */}
      {step === STEPS.REVEAL && (
        <div className="zd-step zd-reveal-step">
          {selectedZone === 'diagonal' ? (
            <>
              <div className="zd-reveal-icon">&#10024;</div>
              <h1 className="zd-reveal-title">This level didn't catch you</h1>
              <p className="zd-reveal-subtitle">
                You're already on the diagonal for <strong>{config.name}</strong>.
                That's rare. You can still do the deep dive and courage challenges to strengthen this.
              </p>
            </>
          ) : (
            <>
              <div className="zd-reveal-icon">&#9876;&#65039;</div>
              <h1 className="zd-reveal-title">{getBossName()}</h1>
              <p className="zd-reveal-subtitle">
                This is the voice that's been keeping you in the <strong>{config.zones[selectedZone]?.name}</strong>.
                Every courage challenge, every deep dive, every healing day at this level is about
                moving past this Boss and onto the diagonal.
              </p>
              <div className="zd-boss-card">
                <div className="zd-boss-zone">{config.zones[selectedZone]?.name}</div>
                <div className="zd-boss-arrow">→</div>
                <div className="zd-boss-target">{config.zones.diagonal.name}</div>
              </div>
            </>
          )}

          <button
            className="primary-button zd-next-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Let\'s begin'} <span>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
