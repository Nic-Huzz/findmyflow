/**
 * FindBridgeFlow.jsx — /find-bridge
 *
 * Helps users find a bridge job from their Fun-rated dome experiences.
 * Steps: pick experience → name job → have it or searching → save.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { useDomeData } from '../hooks/useDomeData'
import { getDomeExperiencesForBridge } from '../lib/domeSummary'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import {
  getViableBridgeExperiences,
  getAllViableBridgeExperiences,
  formatMonthly,
} from '../lib/bridgeJobUtils'
import './FindBridgeFlow.css'

export default function FindBridgeFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)

  const [step, setStep] = useState('loading') // loading | pick | name | status | empty | free_text
  const [experiences, setExperiences] = useState([])
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState(null)
  const [jobTitle, setJobTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  // Process dome data once loaded
  useEffect(() => {
    if (domeLoading) return
    if (!domeStates || Object.keys(domeStates).length === 0) {
      setStep('empty')
      return
    }

    // getDomeExperiencesForBridge returns { fun: [{id, label, primal}], vibeRise: [...] }
    const { fun } = getDomeExperiencesForBridge(domeStates)

    if (fun.length === 0) {
      setStep('empty')
      return
    }

    // Map {id, label} → {nodeId, label} for bridgeJobUtils
    const funExps = fun.map(f => ({ nodeId: f.id, label: f.label }))
    const viable = getViableBridgeExperiences(funExps)

    if (viable.length === 0) {
      setStep('empty')
      return
    }

    setExperiences(viable)
    setStep('pick')
  }, [domeStates, domeLoading])

  // Save bridge quest
  const handleSave = async (bridgeStatus) => {
    if (saving || !jobTitle.trim()) return
    setSaving(true)
    try {
      await supabase.from('quests').insert({
        user_id: user.id,
        label: jobTitle.trim(),
        is_bridge_job: true,
        is_current_job: bridgeStatus === 'active',
        status: 'active',
        predicted_state: 'fun',
        job_relationship: 'bridge_found',
        bridge_status: bridgeStatus,
      })
      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving bridge quest:', err)
    } finally {
      setSaving(false)
    }
  }

  // Save free-text bridge (no experience selection)
  const handleSaveFreeText = async () => {
    if (saving || !jobTitle.trim()) return
    setSaving(true)
    try {
      await supabase.from('quests').insert({
        user_id: user.id,
        label: jobTitle.trim(),
        is_bridge_job: true,
        is_current_job: false,
        status: 'active',
        predicted_state: 'fun',
        job_relationship: 'bridge_found',
        bridge_status: 'searching',
      })
      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving bridge quest:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fbf">
      <div className="fbf-container">

        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.3)' }}>
            Loading your experiences...
          </div>
        )}

        {/* STEP 1: Pick Experience */}
        {step === 'pick' && (
          <>
            <button className="fbf-back" onClick={() => navigate(-1)}>&larr; Back</button>
            <div className="fbf-header">
              <h2>These are things you enjoy that could pay the bills</h2>
              <p>Sorted by earning potential. Pick one that could work as a bridge while your flow grows.</p>
            </div>

            <div className="fbf-list">
              {(showAll ? getAllViableBridgeExperiences() : experiences).map((exp, i) => (
                <div key={exp.label}>
                  {i === 0 && !showAll && <div className="fbf-top-label">Top pick</div>}
                  <div
                    className={`fbf-exp-card ${selected?.label === exp.label ? 'selected' : ''} ${i === 0 && !showAll ? 'top-pick' : ''}`}
                    onClick={() => { hapticLight(); setSelected(exp) }}
                  >
                    <div className="fbf-exp-name">{exp.label}</div>
                    <div className="fbf-exp-rates">
                      <div className="fbf-exp-rate">
                        <div className="fbf-exp-rate-label">Employed</div>
                        <div className="fbf-exp-rate-value">{exp.employed}</div>
                      </div>
                      <div className="fbf-exp-rate">
                        <div className="fbf-exp-rate-label">Freelance</div>
                        <div className="fbf-exp-rate-value">{exp.perSession}</div>
                      </div>
                    </div>
                    {exp.monthlyEstimate && (
                      <div className="fbf-exp-monthly">{formatMonthly(exp.monthlyEstimate)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="fbf-fixed">
              <button
                disabled={!selected}
                onClick={() => {
                  hapticLight()
                  setJobTitle(selected.label)
                  setStep('name')
                }}
              >
                Pick this one
              </button>
            </div>
          </>
        )}

        {/* STEP 2: Name Your Bridge */}
        {step === 'name' && (
          <>
            <button className="fbf-back" onClick={() => setStep('pick')}>&larr; Back</button>
            <div className="fbf-header">
              <h2>What would you call this job?</h2>
              <p>Make it specific. "Design job at an agency" is better than "Graphic Design".</p>
            </div>

            <input
              className="fbf-input"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder={`e.g. ${selected?.label} job`}
              autoFocus
            />

            {selected?.monthlyEstimate && (
              <div className="fbf-earning-context">
                {selected.employed} employed {formatMonthly(selected.monthlyEstimate)}
              </div>
            )}

            <div className="fbf-fixed">
              <button
                disabled={!jobTitle.trim()}
                onClick={() => { hapticLight(); setStep('status') }}
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Have It or Searching */}
        {step === 'status' && (
          <>
            <button className="fbf-back" onClick={() => setStep('name')}>&larr; Back</button>
            <div className="fbf-header">
              <h2>Do you have this already?</h2>
              <p>"{jobTitle}"</p>
            </div>

            <div className="fbf-status-options">
              <button className="fbf-status-btn" onClick={() => handleSave('active')} disabled={saving}>
                <span>✅</span>
                <span>I have this</span>
              </button>
              <button className="fbf-status-btn" onClick={() => handleSave('searching')} disabled={saving}>
                <span>🔍</span>
                <span>I need to find this</span>
              </button>
            </div>
          </>
        )}

        {/* EMPTY STATE: No viable Fun experiences */}
        {step === 'empty' && (
          <>
            <button className="fbf-back" onClick={() => navigate(-1)}>&larr; Back</button>
            <div className="fbf-header">
              <h2>Let's find something</h2>
              <p>None of your fun experiences have clear employed paths right now. But there are other options.</p>
            </div>

            <div className="fbf-empty">
              <div className="fbf-empty-actions">
                <button className="fbf-status-btn" onClick={() => { hapticLight(); setStep('free_text') }}>
                  <span>💼</span>
                  <span>I know what I can do</span>
                </button>
                <button className="fbf-status-btn" onClick={() => {
                  hapticLight()
                  setExperiences(getAllViableBridgeExperiences())
                  setShowAll(true)
                  setStep('pick')
                }}>
                  <span>📋</span>
                  <span>Show me options</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* FREE TEXT: Type your own bridge */}
        {step === 'free_text' && (
          <>
            <button className="fbf-back" onClick={() => setStep('empty')}>&larr; Back</button>
            <div className="fbf-header">
              <h2>What could you do to pay the bills?</h2>
              <p>Name a job or gig you could get while your flow grows.</p>
            </div>

            <input
              className="fbf-input"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Freelance web design"
              autoFocus
            />

            <div className="fbf-fixed">
              <button
                disabled={!jobTitle.trim() || saving}
                onClick={handleSaveFreeText}
              >
                {saving ? 'Saving...' : 'Add as my bridge'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
