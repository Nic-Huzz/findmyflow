/**
 * CareerAlignmentFlow.jsx — /career-alignment
 * "How aligned is your career with your curiosities?"
 *
 * Flow: Career Input → Curiosity Feed Check → State Check → Results
 * Pulls clusters from curiosity_clusters. Saves to career_alignments.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess, hapticMedium } from '../lib/haptics'
import './CuriosityMapFlow.css'

const STEPS = {
  CAREER: 'career',
  CURIOSITY_CHECK: 'curiosity_check',
  STATE: 'state',
  RESULTS: 'results',
}

const NS_STATES = [
  { value: 'vibe_rise', label: 'Vibe Rise', desc: 'Alive, expressed, lit up', color: '#fbbf24' },
  { value: 'safe', label: 'Safe', desc: 'Calm, steady, fine', color: '#34d399' },
  { value: 'activated', label: 'Activated', desc: 'Stressed, racing, on edge', color: '#f87171' },
  { value: 'shutdown', label: 'Shutdown', desc: 'Numb, flat, checked out', color: '#94a3b8' },
]

const CLUSTER_ICONS = {
  movement: '\u{1F3C3}', nourishment: '\u{1F33F}', tools: '\u{1F9E0}', status: '\u2728',
  bonds: '\u{1F91D}', shelter: '\u{1F3E1}', story: '\u{1F4D6}', fire: '\u{1F525}',
  healing: '\u{1F49C}', threat: '\u26A1', default: '\u2728',
}

export default function CareerAlignmentFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.CAREER)
  const setStep = (next) => { setStepRaw(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  const [jobTitle, setJobTitle] = useState('')
  const [workExperiences, setWorkExperiences] = useState([])
  const [currentExperience, setCurrentExperience] = useState('')
  const [clusters, setClusters] = useState([])
  const [clusterFed, setClusterFed] = useState({})
  const [workTopics, setWorkTopics] = useState('')
  const [nsState, setNsState] = useState('')
  const [wantToChange, setWantToChange] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const { data } = await supabase.from('curiosity_clusters')
          .select('cluster_name, branch, description, why, input_count')
          .eq('user_id', user.id)
        if (data?.length) setClusters(data)
      } catch (err) { console.warn('Career alignment data load failed:', err.message) }
      finally { setLoading(false) }
    })()
  }, [user])

  const addExperience = () => {
    if (!currentExperience.trim()) return
    setWorkExperiences(prev => [...prev, currentExperience.trim()])
    setCurrentExperience('')
    hapticLight()
  }

  const removeExperience = (index) => {
    setWorkExperiences(prev => prev.filter((_, i) => i !== index))
  }

  const fedCount = Object.values(clusterFed).filter(Boolean).length
  const totalClusters = clusters.length
  const alignmentScore = totalClusters > 0 ? Math.round((fedCount / totalClusters) * 100) : 0
  const selectedState = NS_STATES.find(s => s.value === nsState)

  const getScoreColor = (score) => {
    if (score >= 60) return '#34d399'
    if (score >= 30) return '#fbbf24'
    return '#f87171'
  }

  const saveResults = async () => {
    if (!user) return
    try {
      await supabase.from('career_alignments').insert({
        user_id: user.id,
        career_title: jobTitle,
        career_description: workExperiences.join(', '),
        alive_score: nsState === 'vibe_rise' ? 5 : nsState === 'safe' ? 3 : nsState === 'activated' ? 2 : 1,
        alignment_score: alignmentScore,
        alignment_summary: `${fedCount} of ${totalClusters} curiosities fed. Work topics: ${workTopics}. State: ${nsState}.`,
        clusters: {
          fed: clusters.filter((_, i) => clusterFed[i]).map(c => c.cluster_name),
          unfed: clusters.filter((_, i) => !clusterFed[i]).map(c => c.cluster_name),
          work_experiences: workExperiences,
          work_topics: workTopics,
        },
      })
    } catch (err) { console.warn('Career alignment save failed:', err.message) }
  }

  if (loading) {
    return <div className="cmf"><div className="cmf-processing"><div className="cmf-spinner" /></div></div>
  }

  if (!clusters.length) {
    return (
      <div className="cmf">
        <div className="cmf-container">
          <div className="cmf-welcome">
            <div className="cmf-welcome-content">
              <div className="cmf-greeting">Career Alignment</div>
              <p>You need to map your curiosities first before we can check how aligned your career is.</p>
            </div>
            <button className="cmf-primary-btn" onClick={() => navigate('/curiosity-map')}>Map my curiosities first</button>
            <button className="cmf-back-btn" style={{ width: '100%', textAlign: 'center', marginTop: 8 }} onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 1: CAREER INPUT
  // ═══════════════════════════════════════════════
  if (step === STEPS.CAREER) {
    return (
      <div className="cmf">
        <div className="cmf-progress">
          <div className="cmf-dot active" /><div className="cmf-dot" /><div className="cmf-dot" />
        </div>
        <div className="cmf-container">
          <div className="cmf-step-label">Step 1 of 3</div>
          <div className="cmf-heading">What does your <span className="cmf-gold">work week</span> look like?</div>

          <div style={{ marginBottom: 20 }}>
            <div className="cmf-field-label">Job title</div>
            <input className="cmf-input" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g., Marketing Manager" autoFocus />
          </div>

          <div>
            <div className="cmf-field-label">What are your 3-5 most common experiences each week?</div>
            <div className="cmf-subtext" style={{ marginBottom: 12 }}>The things you actually spend your time doing. Not your job description, your real week.</div>

            <input className="cmf-input" style={{ width: '100%', marginBottom: 8 }} value={currentExperience} onChange={e => setCurrentExperience(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && currentExperience.trim()) { e.preventDefault(); addExperience() } }}
              placeholder="e.g., Zoom meetings, writing reports" />
            <button className="cmf-add-btn" onClick={addExperience} disabled={!currentExperience.trim()}>+ Add</button>

            {workExperiences.length > 0 && (
              <div className="cmf-items" style={{ marginTop: 12 }}>
                {workExperiences.map((exp, i) => (
                  <div key={i} className="cmf-item">
                    <span className="cmf-item-title">{exp}</span>
                    <button className="cmf-item-remove" onClick={() => removeExperience(i)}>{'\u00D7'}</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cmf-nav">
            <button className="cmf-back-btn" onClick={() => navigate(-1)}>Back</button>
            <button className="cmf-primary-btn" disabled={!jobTitle.trim() || workExperiences.length < 3}
              onClick={() => { hapticMedium(); setStep(STEPS.CURIOSITY_CHECK) }}>
              {workExperiences.length < 3 ? `Add ${3 - workExperiences.length} more experience${3 - workExperiences.length > 1 ? 's' : ''}` : 'Next'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 2: CURIOSITY FEED CHECK
  // ═══════════════════════════════════════════════
  if (step === STEPS.CURIOSITY_CHECK) {
    const allAnswered = clusters.every((_, i) => clusterFed[i] !== undefined)

    return (
      <div className="cmf">
        <div className="cmf-progress">
          <div className="cmf-dot completed" /><div className="cmf-dot active" /><div className="cmf-dot" />
        </div>
        <div className="cmf-container">
          <div className="cmf-step-label">Step 2 of 3</div>
          <div className="cmf-heading">Does your work <span className="cmf-gold">feed</span> these?</div>
          <div className="cmf-subtext">Your curiosities from your Curiosity Map. For each one: does your current job give you any outlet for this?</div>

          <div className="cmf-clusters">
            {clusters.map((cluster, i) => {
              const fed = clusterFed[i]
              const icon = CLUSTER_ICONS[cluster.branch] || CLUSTER_ICONS.default
              return (
                <div key={i} className={`cmf-feed-card ${fed === true ? 'fed' : fed === false ? 'unfed' : ''}`}>
                  <div className="cmf-feed-header">
                    <span className="cmf-feed-icon">{icon}</span>
                    <span className="cmf-feed-name">{cluster.cluster_name}</span>
                  </div>
                  <div className="cmf-feed-buttons">
                    <button className={`cmf-feed-btn ${fed === true ? 'yes-selected' : ''}`}
                      onClick={() => { hapticLight(); setClusterFed(prev => ({ ...prev, [i]: true })) }}>
                      Yes, my work feeds this
                    </button>
                    <button className={`cmf-feed-btn ${fed === false ? 'no-selected' : ''}`}
                      onClick={() => { hapticLight(); setClusterFed(prev => ({ ...prev, [i]: false })) }}>
                      No
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {allAnswered && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div className="cmf-field-label">What topics does your work predominantly focus on?</div>
              <textarea className="cmf-input" value={workTopics} onChange={e => setWorkTopics(e.target.value)}
                placeholder="e.g., revenue targets, project management, client retention" rows={3} style={{ resize: 'none', width: '100%' }} />
            </div>
          )}

          <div className="cmf-nav">
            <button className="cmf-back-btn" onClick={() => setStep(STEPS.CAREER)}>Back</button>
            <button className="cmf-primary-btn" disabled={!allAnswered || !workTopics.trim()}
              onClick={() => { hapticMedium(); setStep(STEPS.STATE) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 3: STATE CHECK
  // ═══════════════════════════════════════════════
  if (step === STEPS.STATE) {
    return (
      <div className="cmf">
        <div className="cmf-progress">
          <div className="cmf-dot completed" /><div className="cmf-dot completed" /><div className="cmf-dot active" />
        </div>
        <div className="cmf-container">
          <div className="cmf-step-label">Step 3 of 3</div>
          <div className="cmf-heading">How do you feel <span className="cmf-gold">most days</span> at work?</div>
          <div className="cmf-subtext">Not your best day. Not your worst. The average Tuesday afternoon.</div>

          <div className="cmf-clusters">
            {NS_STATES.map(state => (
              <button key={state.value} className="cmf-state-btn"
                style={nsState === state.value ? { background: `${state.color}18`, borderColor: `${state.color}60` } : undefined}
                onClick={() => { hapticLight(); setNsState(state.value) }}>
                <div className="cmf-state-label" style={nsState === state.value ? { color: state.color } : undefined}>{state.label}</div>
                <div className="cmf-state-desc">{state.desc}</div>
              </button>
            ))}
          </div>

          <div className="cmf-nav">
            <button className="cmf-back-btn" onClick={() => setStep(STEPS.CURIOSITY_CHECK)}>Back</button>
            <button className="cmf-primary-btn" disabled={!nsState}
              onClick={() => { hapticSuccess(); saveResults(); setStep(STEPS.RESULTS) }}>See my alignment</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 4: RESULTS
  // ═══════════════════════════════════════════════
  if (step === STEPS.RESULTS) {
    const unfedClusters = clusters.filter((_, i) => !clusterFed[i])
    const fedClusters = clusters.filter((_, i) => clusterFed[i])
    const stateMessage = nsState === 'activated' || nsState === 'shutdown'
      ? `You're in ${selectedState?.label} most days. That's not a personality trait. It's a signal.`
      : nsState === 'safe'
      ? `You feel Safe most days. Not bad. But Safe isn't the same as alive.`
      : `You feel Vibe Rise most days. That's rare. Your work might already be aligned.`

    return (
      <div className="cmf">
        <div className="cmf-container">
          <div className="cmf-greeting">Career Alignment</div>

          {/* Big score */}
          <div className="cmf-big-score">
            <div className="cmf-big-score-num" style={{ color: getScoreColor(alignmentScore) }}>{alignmentScore}%</div>
            <div className="cmf-big-score-label">of your curiosities are fed by your work</div>
          </div>

          {/* Unfed */}
          {unfedClusters.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="cmf-section-label red">Unfed curiosities ({unfedClusters.length})</div>
              {unfedClusters.map((c, i) => (
                <div key={i} className="cmf-result-pill unfed">
                  <span>{CLUSTER_ICONS[c.branch] || CLUSTER_ICONS.default}</span>
                  <span>{c.cluster_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fed */}
          {fedClusters.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="cmf-section-label green">Fed by your work ({fedClusters.length})</div>
              {fedClusters.map((c, i) => (
                <div key={i} className="cmf-result-pill fed">
                  <span>{CLUSTER_ICONS[c.branch] || CLUSTER_ICONS.default}</span>
                  <span>{c.cluster_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Work topics */}
          {workTopics && (
            <div className="cmf-context-box">
              <div className="cmf-context-box-label">Your work focuses on</div>
              <div className="cmf-context-box-text">{workTopics}</div>
            </div>
          )}

          {/* NS state */}
          <div className="cmf-state-box" style={{ background: `${selectedState?.color || '#fff'}10`, border: `1px solid ${selectedState?.color || '#fff'}30` }}>
            <div className="cmf-state-box-title" style={{ color: selectedState?.color }}>{stateMessage}</div>
            {(nsState === 'activated' || nsState === 'shutdown') && unfedClusters.length > 0 && (
              <div className="cmf-state-box-text">
                Your nervous system is {nsState === 'activated' ? 'activated' : 'shutting down'} because {unfedClusters.length} of your {totalClusters} curiosities have no outlet in your current work. The gap between what draws you and what you do is where the tension lives.
              </div>
            )}
          </div>

          {/* Belief shift */}
          {alignmentScore < 80 ? (
            <div className="cmf-belief-box gap">
              <div className="cmf-belief-title" style={{ color: '#fbbf24' }}>Work doesn't have to feel like this.</div>
              <div className="cmf-belief-text">People rebuild their work around their curiosities and feel alive doing it. Your curiosities aren't distractions from your career. They might be the career.</div>
            </div>
          ) : (
            <div className="cmf-belief-box aligned">
              <div className="cmf-belief-title" style={{ color: '#34d399' }}>Your work feeds your curiosities.</div>
              <div className="cmf-belief-text">That's rare. Most people's careers ignore what they're genuinely drawn to. Yours doesn't. The question now is: could you go deeper?</div>
            </div>
          )}

          {/* Intent capture */}
          {wantToChange === null && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>
                Would you like to figure out how to make these curiosities your career?
              </div>
              <div className="cmf-intent-row">
                <button className="cmf-primary-btn" onClick={() => { hapticSuccess(); setWantToChange(true) }}>Yes, show me how</button>
                <button className="cmf-secondary-btn" onClick={() => setWantToChange(false)}>Not yet</button>
              </div>
            </div>
          )}

          {wantToChange === true && (
            <div className="cmf-noted-box">
              <div style={{ fontSize: 14, fontWeight: 600, color: '#34d399', marginBottom: 4 }}>Noted.</div>
              <div className="cmf-belief-text">Your curiosities are the raw material. The next step is mapping who you are (your skills, your wounds, your people) so we can connect the dots.</div>
            </div>
          )}

          <div className="cmf-results-actions">
            <button className="cmf-primary-btn" onClick={() => navigate('/7-day-challenge')}>Return to quests</button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
