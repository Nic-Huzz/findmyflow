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
import '../styles/flow-base.css'
import './MindSpace.css'

const SKILLS_PROMPT = `I want you to help me discover what I'm naturally good at. Have a conversation with me about:

1. What did I love doing as a kid? What activities made me lose track of time?
2. What do people come to me for? What do friends/family always ask me to help with?
3. What feels effortless to me but hard for others?
4. When do I feel most alive and in flow?

After our conversation, extract my skills in this EXACT format:

---START EXTRACTION---

SKILLS
- SKILL: [Name]
  EVIDENCE: [Brief quote or pattern you noticed]
  FREQUENCY: [Low/Medium/High]
  CATEGORY: [Technical/Creative/Interpersonal/Strategic/Healing/Other]

---END EXTRACTION---

Start by asking me the first question. Be warm, curious, and follow up on interesting threads. Ask one question at a time.`

const EXTRACT_PROMPT = `Now analyze our entire conversation and extract all the skills you identified. Use this EXACT format:

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
  const [extractCopied, setExtractCopied] = useState(false)
  const [rawResponse, setRawResponse] = useState('')
  const [skills, setSkills] = useState([])
  const [starred, setStarred] = useState(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(SKILLS_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyExtract = () => {
    navigator.clipboard.writeText(EXTRACT_PROMPT)
    setExtractCopied(true)
    setTimeout(() => setExtractCopied(false), 2000)
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
      // Save skills as nikigai_clusters
      const skillsToSave = skills.filter(s => s.kept !== false).map((s, i) => ({
        user_id: user.id,
        cluster_type: 'skill',
        cluster_label: s.name,
        source_flow: 'curiosity_compass',
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
        .eq('source_flow', 'curiosity_compass')

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

  return (
    <div className="mind-space flow-base">
      <div className="ms-container">

        {/* Step 1: Intro */}
        {step === 1 && (
          <div className="step-content">
            <div className="card">
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧭 Curiosity Compass</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
                What did you love doing as a kid? What makes you lose track of time?
                Let's discover your natural skills through a conversation with AI.
              </p>

              <div className="prompt-section">
                <h3 style={{ fontSize: '0.85rem', color: '#E9A23B', marginBottom: '0.75rem' }}>Step 1: Copy this prompt</h3>
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

                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem' }}>
                  Paste the prompt, have a conversation, then come back here.
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#E9A23B', marginBottom: '0.75rem' }}>Step 2: When the conversation feels complete</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  Copy the extraction prompt below and paste it into the same conversation. The AI will extract your skills.
                </p>

                <button className="primary-button" onClick={handleCopyExtract} style={{ width: '100%' }}>
                  {extractCopied ? '✓ Copied!' : 'Copy Extraction Prompt'}
                </button>
              </div>

              <button className="primary-button" onClick={() => setStep(2)} style={{ width: '100%', marginTop: '1.5rem' }}>
                I have my extraction ready →
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

                <button className="option-btn" onClick={() => navigate(`/play-list-finder?returnTo=${returnTo}`)}>
                  <span className="option-icon">💡</span>
                  <span className="option-text">
                    <strong>I want to dig deeper</strong>
                    <span>Explore more in Play-List Finder</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
