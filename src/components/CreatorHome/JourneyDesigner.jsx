/**
 * JourneyDesigner.jsx — AI-powered experience journey generator
 * Input: modality, audience, target shift, duration
 * Output: Shift Architecture runsheet saved to template
 * CSS prefix: jd-
 */
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { updateTemplate } from '../../lib/experienceTemplateService'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import './JourneyDesigner.css'

const MODALITIES = [
  { id: 'dance', label: 'Dance Journey', emoji: '💃' },
  { id: 'breathwork', label: 'Breathwork', emoji: '🌬️' },
  { id: 'shaking', label: 'Shaking / Somatic', emoji: '🫨' },
  { id: 'visualisation', label: 'Guided Visualisation', emoji: '🧘' },
  { id: 'combined', label: 'Multi-Modality', emoji: '✨' },
]

const AUDIENCES = [
  { id: 'general', label: 'General public' },
  { id: 'corporate', label: 'Corporate / burnout' },
  { id: 'retreat', label: 'Retreat guests' },
  { id: 'festival', label: 'Festival attendees' },
  { id: 'youth', label: 'Young adults / teens' },
  { id: 'creators', label: 'Experience creators' },
]

const SHIFTS = [
  { id: 'confidence', label: 'Build confidence' },
  { id: 'expression', label: 'Unlock expression' },
  { id: 'grief', label: 'Process grief / loss' },
  { id: 'self_worth', label: 'Reclaim self-worth' },
  { id: 'letting_go', label: 'Let go of control' },
  { id: 'connection', label: 'Deepen connection' },
  { id: 'aliveness', label: 'Feel alive again' },
  { id: 'custom', label: 'Custom...' },
]

export default function JourneyDesigner({ templateId, onSaved }) {
  const [modality, setModality] = useState('')
  const [audience, setAudience] = useState('')
  const [shift, setShift] = useState('')
  const [customShift, setCustomShift] = useState('')
  const [duration, setDuration] = useState('60')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const targetShift = shift === 'custom' ? customShift : SHIFTS.find(s => s.id === shift)?.label || ''
  const canGenerate = modality && audience && targetShift && duration

  const handleGenerate = async () => {
    if (!canGenerate || generating) return
    setGenerating(true)
    setError('')
    hapticLight()

    try {
      const { data, error: fnError } = await supabase.functions.invoke('experience-blueprint-ai', {
        body: {
          action: 'generate_arc',
          experienceName: `${MODALITIES.find(m => m.id === modality)?.label} for ${AUDIENCES.find(a => a.id === audience)?.label}`,
          experienceDescription: `A ${duration}-minute ${modality} experience designed to help ${AUDIENCES.find(a => a.id === audience)?.label?.toLowerCase()} ${targetShift.toLowerCase()}. Primary modality: ${modality}.`,
          placemakes: [modality, targetShift],
          targetPattern: targetShift,
          targetPrediction: `If I ${targetShift.toLowerCase()}, something bad will happen`,
        },
      })

      if (fnError) throw fnError

      // The edge function returns { phases: [{ content, somaticTool }] }
      // Phase names are implied by order: Safety, Activation, Mismatch, Discharge, Integration, Verification
      const PHASE_NAMES = ['safety', 'activation', 'mismatch', 'discharge', 'integration', 'verification']
      const phases = data?.phases || []
      const totalDur = parseInt(duration)
      const phaseDurations = [
        Math.round(totalDur * 0.12), // safety
        Math.round(totalDur * 0.15), // activation
        Math.round(totalDur * 0.25), // mismatch (longest)
        Math.round(totalDur * 0.18), // discharge
        Math.round(totalDur * 0.18), // integration
        Math.round(totalDur * 0.12), // verification
      ]

      const runsheet = phases.map((phase, i) => ({
        phase: PHASE_NAMES[i] || `phase_${i + 1}`,
        duration: phaseDurations[i] || Math.round(totalDur / 6),
        notes: phase.content || '',
        musicNotes: phase.somaticTool ? `Somatic tool: ${phase.somaticTool}` : '',
      }))

      setResult(runsheet.length > 0 ? runsheet : null)
      if (runsheet.length === 0) setError('AI returned empty result. Try different inputs.')
      else hapticSuccess()
    } catch (err) {
      console.error('Journey designer error:', err)
      setError('Failed to generate. Please try again.')
    }
    setGenerating(false)
  }

  const handleSave = async () => {
    if (!result || !templateId || saving) return
    setSaving(true)
    try {
      await updateTemplate(templateId, {
        runsheet: result,
        shift_arc: result,
        duration_minutes: parseInt(duration),
      })
      hapticSuccess()
      onSaved?.(result)
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="jd-designer">
      <div className="jd-header">
        <span className="jd-header-icon">🤖</span>
        <span className="jd-header-title">AI Journey Designer</span>
      </div>

      {!result ? (
        <>
          {/* Modality */}
          <div className="jd-field">
            <label className="jd-label">Modality</label>
            <div className="jd-chips">
              {MODALITIES.map(m => (
                <button
                  key={m.id}
                  className={`jd-chip ${modality === m.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setModality(m.id) }}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="jd-field">
            <label className="jd-label">Audience</label>
            <div className="jd-chips">
              {AUDIENCES.map(a => (
                <button
                  key={a.id}
                  className={`jd-chip ${audience === a.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setAudience(a.id) }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Shift */}
          <div className="jd-field">
            <label className="jd-label">Target Shift</label>
            <div className="jd-chips">
              {SHIFTS.map(s => (
                <button
                  key={s.id}
                  className={`jd-chip ${shift === s.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setShift(s.id) }}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {shift === 'custom' && (
              <input
                className="jd-input"
                value={customShift}
                onChange={e => setCustomShift(e.target.value)}
                placeholder="Describe the shift you want to create..."
                autoFocus
              />
            )}
          </div>

          {/* Duration */}
          <div className="jd-field">
            <label className="jd-label">Duration (minutes)</label>
            <div className="jd-chips">
              {['30', '45', '60', '90', '120'].map(d => (
                <button
                  key={d}
                  className={`jd-chip ${duration === d ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setDuration(d) }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <button className="jd-generate" onClick={handleGenerate} disabled={!canGenerate || generating}>
            {generating ? 'Designing your journey...' : 'Design Journey with AI'}
          </button>
          {error && <p className="jd-error">{error}</p>}
        </>
      ) : (
        <>
          {/* Result */}
          <div className="jd-result">
            <div className="jd-result-header">
              <span>Generated Runsheet</span>
              <button className="jd-retry" onClick={() => setResult(null)}>Redo</button>
            </div>
            {result.map((phase, i) => (
              <div key={i} className="jd-phase">
                <div className="jd-phase-top">
                  <span className="jd-phase-num">{i + 1}</span>
                  <span className="jd-phase-name">{phase.phase}</span>
                  <span className="jd-phase-dur">{phase.duration} min</span>
                </div>
                {phase.notes && <p className="jd-phase-notes">{phase.notes}</p>}
                {phase.musicNotes && <p className="jd-phase-music">🎵 {phase.musicNotes}</p>}
              </div>
            ))}
          </div>

          <button className="jd-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save to Template'}
          </button>
        </>
      )}
    </div>
  )
}
