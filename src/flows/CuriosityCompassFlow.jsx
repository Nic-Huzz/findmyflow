/**
 * CuriosityCompassFlow.jsx
 *
 * Skills-only extraction flow for Level 0.
 * Simplified version of MindSpace that only extracts skills.
 *
 * Steps:
 *   1. Intro + AI usage check
 *   2. Copy prompt to AI / paste response
 *   3. Review extracted skills
 *   4. Satisfaction check (looks good / dig deeper via Play-List Finder)
 *
 * Route: /curiosity-compass
 * Created: 2026-04-03
 */

import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { SKILLS_SEGMENTS, findSkillSegment } from '../lib/wheelTaxonomy'
import taxonomyV2 from '../../public/data/playSkillTaxonomyV2.json'

// Build lookup: { categoryId: { placemakeLabel: { example, anchorPerson } } }
const PLACEMAKE_DETAILS = {}
for (const cat of taxonomyV2.categories) {
  PLACEMAKE_DETAILS[cat.id] = {}
  for (const pm of cat.placemakes) {
    PLACEMAKE_DETAILS[cat.id][pm.label] = { example: pm.example, anchorPerson: pm.anchorPerson }
  }
}
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import '../styles/flow-base.css'
import './MindSpace.css'

const MAX_CATEGORIES = 3
const MAX_SKILLS_PER_CATEGORY = 3
const DEFAULT_WHEEL_VISIBILITY_LAYER = 'screen'

const SKILLS_PROMPT = `Analyze our entire conversation history. I want you to identify the things I naturally light up about, the activities that feel like play not work.

Look for:
- What I talk about with genuine excitement (not just competence)
- What I'd do even if nobody paid me
- What makes me lose track of time
- What I keep coming back to because I love it, not because I have to

Ignore anything that sounds like obligation, duty, or "should." I only want the things that genuinely energize me.

Extract and organize your findings in this EXACT format:

---START EXTRACTION---

SKILLS
- SKILL: [Name]
  EVIDENCE: [Brief quote or pattern you noticed]
  FREQUENCY: [Low/Medium/High]
  CATEGORY: [Technical/Creative/Interpersonal/Strategic/Healing/Other]

(list ALL skills you identified, aim for 5-10)

---END EXTRACTION---`

function parseSkills(text) {
  const skills = []
  const skillRegex = /SKILL:\s*(.+?)(?:\n|$)/gi
  const evidenceRegex = /EVIDENCE:\s*(.+?)(?:\n|$)/gi
  const categoryRegex = /CATEGORY:\s*(.+?)(?:\n|$)/gi

  const skillMatches = [...text.matchAll(/SKILL:\s*(.+?)(?:\n|$)/gi)]
  const evidenceMatches = [...text.matchAll(/EVIDENCE:\s*(.+?)(?:\n|$)/gi)]
  const categoryMatches = [...text.matchAll(/CATEGORY:\s*(.+?)(?:\n|$)/gi)]

  for (let i = 0; i < skillMatches.length; i++) {
    skills.push({
      name: skillMatches[i][1].trim(),
      evidence: evidenceMatches[i]?.[1]?.trim() || '',
      category: categoryMatches[i]?.[1]?.trim() || 'Other',
      kept: true,
    })
  }

  // Fallback: try line-by-line if structured parsing fails
  if (skills.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
    lines.forEach(line => {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim()
      if (cleaned.length > 2 && cleaned.length < 100) {
        skills.push({ name: cleaned, evidence: '', category: 'Other', kept: true })
      }
    })
  }

  return skills
}

export default function CuriosityCompassFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/7-day-challenge'

  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
  const [rawResponse, setRawResponse] = useState('')
  const [skills, setSkills] = useState([])
  const [starred, setStarred] = useState(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  // Wheel picker state (steps 5-7)
  const [selectedCategories, setSelectedCategories] = useState([]) // ordered list of category ids
  const [selectedPlaySkills, setSelectedPlaySkills] = useState({}) // { [categoryId]: string[] }
  const [wheelSavedCount, setWheelSavedCount] = useState(0)

  const toggleCategory = (id) => {
    setSelectedCategories(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_CATEGORIES) return prev
      return [...prev, id]
    })
  }

  const togglePlaySkill = (categoryId, skill) => {
    setSelectedPlaySkills(prev => {
      const current = prev[categoryId] || []
      if (current.includes(skill)) {
        return { ...prev, [categoryId]: current.filter(s => s !== skill) }
      }
      if (current.length >= MAX_SKILLS_PER_CATEGORY) return prev
      return { ...prev, [categoryId]: [...current, skill] }
    })
  }

  // Only count skills from currently-selected categories (avoid orphaned picks from deselected categories)
  const totalWheelPicks = selectedCategories.reduce(
    (sum, catId) => sum + (selectedPlaySkills[catId]?.length || 0),
    0
  )

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(SKILLS_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleParse = () => {
    if (!rawResponse.trim()) return
    setIsProcessing(true)
    setError(null)

    try {
      const parsed = parseSkills(rawResponse)
      if (parsed.length === 0) {
        setError("Couldn't find any skills in the response. Make sure you copied the full extraction output.")
        setIsProcessing(false)
        return
      }
      setSkills(parsed)
      setStep(3)
    } catch (err) {
      setError('Failed to parse the response. Try again.')
    }
    setIsProcessing(false)
  }

  const toggleStar = (index) => {
    setStarred(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const removeSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index))
    setStarred(prev => {
      const next = new Set()
      prev.forEach(i => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  const handleSave = async () => {
    if (!user?.id || skills.length === 0) return
    setIsProcessing(true)

    try {
      // Create a flow session
      const { data: session } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'curiosity_compass',
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).select('id').single()

      // Save skills as nikigai_clusters
      const skillsToSave = skills.filter(s => s.kept !== false).map((s, i) => ({
        session_id: session.id,
        user_id: user.id,
        cluster_type: 'skills',
        cluster_label: s.name,
        cluster_stage: 'final',
        step_id: 'curiosity_compass',
        items: [{
          text: s.name,
          evidence: s.evidence,
          category: s.category,
          isStarred: starred.has(i),
        }],
      }))

      // Delete old curiosity compass skills
      await supabase
        .from('nikigai_clusters')
        .delete()
        .eq('user_id', user.id)
        .eq('step_id', 'curiosity_compass')

      // Insert new
      if (skillsToSave.length > 0) {
        await supabase.from('nikigai_clusters').insert(skillsToSave)
      }

      // Sync with challenge system
      try {
        await syncFlowFinderWithChallenge(user.id, 'skill')
      } catch (syncErr) {
        console.warn('Challenge sync error:', syncErr)
      }

      setStep(4)
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    }
    setIsProcessing(false)
  }

  // Save wheel picks: nikigai_clusters + groan_challenges + priority_weekly_picks
  const handleWheelSave = async () => {
    if (!user?.id || totalWheelPicks === 0) return
    setIsProcessing(true)
    setError(null)

    const weekStart = getWeekStartLocal()
    let saved = 0

    // Create a flow session for wheel picks
    let wheelSessionId

    try {
      const { data: wheelSession } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'curiosity_compass_wheel',
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).select('id').single()
      wheelSessionId = wheelSession.id

      for (const categoryId of selectedCategories) {
        const segment = findSkillSegment(categoryId)
        const picks = selectedPlaySkills[categoryId] || []

        for (const skillText of picks) {
          // 1. Save to nikigai_clusters as a library skill
          const { error: clusterError } = await supabase.from('nikigai_clusters').insert({
            session_id: wheelSessionId,
            user_id: user.id,
            cluster_type: 'skills',
            cluster_label: skillText,
            cluster_stage: 'final',
            step_id: 'curiosity_compass_wheel',
            items: [{
              text: skillText,
              category: categoryId,
              categoryTitle: segment?.displayName || categoryId,
              isStarred: true,
            }],
          })
          if (clusterError) {
            console.warn('cluster insert error:', clusterError)
            continue
          }

          // 2. Create groan_challenge
          const { data: groanRecord, error: groanError } = await createGroanChallenge({
            userId: user.id,
            title: skillText,
            description: `${segment?.displayName || categoryId} play-list pick`,
            visibilityLayer: DEFAULT_WHEEL_VISIBILITY_LAYER,
            sourceType: 'skill',
            sourceLabel: segment?.displayName || categoryId,
            scaryScore: 5,
            wahooScore: 5,
          })
          if (groanError || !groanRecord) {
            console.warn('groan create error:', groanError)
            continue
          }

          // 3. Accept it
          await acceptGroanChallenge(groanRecord.id)

          // 4. Insert into priority_weekly_picks
          const { error: pickError } = await supabase.from('priority_weekly_picks').insert({
            user_id: user.id,
            week_start_date: weekStart,
            pick_type: 'groan',
            reference_id: groanRecord.id,
            display_name: skillText,
          })
          if (pickError) {
            console.warn('weekly pick insert error:', pickError)
            continue
          }

          saved++
        }
      }

      // Sync flow finder so library wheel reflects the new skills
      try {
        await syncFlowFinderWithChallenge(user.id, 'skills')
      } catch (syncErr) {
        console.warn('Challenge sync error:', syncErr)
      }

      setWheelSavedCount(saved)
      setStep(7)
    } catch (err) {
      console.error('Wheel save error:', err)
      setError('Failed to save your picks. Please try again.')
    }
    setIsProcessing(false)
  }

  return (
    <div className="mind-space flow-base">
      <div className="ms-container">

        {/* Step 1: Copy prompt */}
        {step === 1 && (
          <div className="step-content">
            <div className="card">
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧭 Curiosity Compass</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
                Paste this prompt into an AI you've been chatting with.
                It will analyze your conversation history and extract your natural skills.
              </p>

              <div className="prompt-preview" style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '1rem',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                maxHeight: 120,
                overflow: 'hidden',
                marginBottom: '0.75rem',
              }}>
                {SKILLS_PROMPT.substring(0, 200)}...
              </div>

              <button className="primary-button" onClick={handleCopyPrompt} style={{ width: '100%' }}>
                {copied ? '✓ Copied!' : 'Copy Prompt'}
              </button>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
                <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer"
                  className="secondary-button" style={{ textDecoration: 'none', textAlign: 'center', flex: 1 }}>
                  Open ChatGPT
                </a>
                <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
                  className="secondary-button" style={{ textDecoration: 'none', textAlign: 'center', flex: 1 }}>
                  Open Claude
                </a>
              </div>

              <button className="primary-button" onClick={() => setStep(2)} style={{ width: '100%', marginTop: '1.5rem' }}>
                I have my results →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Paste response */}
        {step === 2 && (
          <div className="step-content">
            <div className="card">
              <h2>Paste your AI extraction</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                Paste the skills extraction from your AI conversation below.
              </p>

              <textarea
                ref={textareaRef}
                className="ms-textarea"
                value={rawResponse}
                onChange={(e) => setRawResponse(e.target.value)}
                placeholder="Paste the extraction here..."
                style={{
                  width: '100%',
                  minHeight: 200,
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '2px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />

              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}

              <div className="nav-buttons" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="primary-button"
                  onClick={handleParse}
                  disabled={!rawResponse.trim() || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Extract My Skills →'}
                </button>
                <button className="secondary-button" onClick={() => setStep(1)}>
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review skills */}
        {step === 3 && (
          <div className="step-content">
            <div className="card">
              <h2>Your Skills ({skills.length})</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                Star the ones that feel most like you. Remove any that don't fit.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {skills.map((skill, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: starred.has(i) ? 'rgba(233,162,59,0.15)' : 'rgba(255,255,255,0.06)',
                    border: starred.has(i) ? '1px solid rgba(233,162,59,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '0.75rem 1rem',
                  }}>
                    <button
                      onClick={() => toggleStar(i)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '1.2rem', padding: 0, flexShrink: 0,
                      }}
                    >
                      {starred.has(i) ? '⭐' : '☆'}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{skill.name}</div>
                      {skill.evidence && (
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                          {skill.evidence}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeSkill(i)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.3)', fontSize: '1rem', padding: '0 0.25rem', flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}

              <div className="nav-buttons" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  className="primary-button"
                  onClick={handleSave}
                  disabled={skills.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Saving...' : `Save ${skills.length} Skills →`}
                </button>
                <button className="secondary-button" onClick={() => setStep(2)}>
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Satisfaction check */}
        {step === 4 && (
          <div className="step-content">
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '3rem' }}>✨</div>
                <h2>{skills.length} skills saved!</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                  These will power your play-list courage challenges.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="option-btn primary" onClick={() => navigate(returnTo)}>
                  <span className="option-icon">✅</span>
                  <span className="option-text">
                    <strong>Looks good!</strong>
                    <span>These capture what I love doing</span>
                  </span>
                </button>

                <button className="option-btn" onClick={() => setStep(5)}>
                  <span className="option-icon">💡</span>
                  <span className="option-text">
                    <strong>I want to dig deeper</strong>
                    <span>Pick from the skills wheel</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Wheel category picker */}
        {step === 5 && (
          <div className="step-content">
            <div className="card">
              <h2 style={{ marginBottom: '0.25rem' }}>Which of these sound fun this week?</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Pick up to {MAX_CATEGORIES}. ({selectedCategories.length}/{MAX_CATEGORIES} selected)
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
              }}>
                {SKILLS_SEGMENTS.map(seg => {
                  const isSelected = selectedCategories.includes(seg.id)
                  const disabled = !isSelected && selectedCategories.length >= MAX_CATEGORIES
                  return (
                    <button
                      key={seg.id}
                      onClick={() => toggleCategory(seg.id)}
                      disabled={disabled}
                      style={{
                        background: isSelected ? 'rgba(233,162,59,0.18)' : 'rgba(255,255,255,0.06)',
                        border: isSelected ? '2px solid rgba(233,162,59,0.6)' : '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 14,
                        padding: '0.85rem 0.75rem',
                        textAlign: 'left',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.35 : 1,
                        color: 'white',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{seg.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{seg.displayName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', marginTop: '0.2rem', lineHeight: 1.3 }}>
                        {seg.tagline}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="nav-buttons" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  className="primary-button"
                  onClick={() => setStep(6)}
                  disabled={selectedCategories.length === 0}
                >
                  Continue →
                </button>
                <button className="secondary-button" onClick={() => setStep(4)}>
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Play-skill sub-picker */}
        {step === 6 && (
          <div className="step-content">
            <div className="card">
              <h2 style={{ marginBottom: '0.25rem' }}>Pick what sounds fun to do</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Up to {MAX_SKILLS_PER_CATEGORY} per category. ({totalWheelPicks} picked)
              </p>

              {selectedCategories.map(catId => {
                const seg = findSkillSegment(catId)
                if (!seg) return null
                const picks = selectedPlaySkills[catId] || []

                return (
                  <div key={catId} style={{ marginBottom: '1.25rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{seg.icon}</span>
                      <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>
                        {seg.displayName}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginLeft: 'auto' }}>
                        {picks.length}/{MAX_SKILLS_PER_CATEGORY}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(seg.placemakes || seg.playSkills || []).map(skill => {
                        const isSelected = picks.includes(skill)
                        const disabled = !isSelected && picks.length >= MAX_SKILLS_PER_CATEGORY
                        const details = PLACEMAKE_DETAILS[catId]?.[skill]
                        return (
                          <button
                            key={skill}
                            onClick={() => togglePlaySkill(catId, skill)}
                            disabled={disabled}
                            style={{
                              background: isSelected ? 'rgba(233,162,59,0.15)' : 'rgba(255,255,255,0.05)',
                              border: isSelected ? '2px solid rgba(233,162,59,0.6)' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 12,
                              padding: '0.75rem 0.85rem',
                              textAlign: 'left',
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              opacity: disabled ? 0.35 : 1,
                              color: 'white',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>
                              {isSelected ? '⭐ ' : ''}{skill}
                            </div>
                            {details && (
                              <div style={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.72rem',
                                marginTop: '0.3rem',
                                lineHeight: 1.35,
                                fontStyle: 'italic',
                              }}>
                                {details.example}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}

              <div className="nav-buttons" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="primary-button"
                  onClick={handleWheelSave}
                  disabled={totalWheelPicks === 0 || isProcessing}
                >
                  {isProcessing ? 'Saving...' : `Add ${totalWheelPicks} to my Play-List →`}
                </button>
                <button className="secondary-button" onClick={() => setStep(5)} disabled={isProcessing}>
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Wheel save success */}
        {step === 7 && (
          <div className="step-content">
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '3rem' }}>🎯</div>
                <h2>{wheelSavedCount} picks added</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                  They are waiting for you on your Play-List.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => navigate(returnTo)}
                style={{ width: '100%' }}
              >
                Go to my Play-List →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
