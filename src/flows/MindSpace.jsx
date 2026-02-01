import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { parseMindSpaceResponse, validateParsedData } from '../lib/mindSpaceParser'
import { mapAllToWheelSegments, SEGMENT_DISPLAY, LEVEL_OPTIONS } from '../lib/mindSpaceMapper'
import './MindSpace.css'

const EXTRACTION_PROMPT = `Analyze our entire conversation history together. I want you to identify patterns that reveal what I'm naturally drawn to — the intersection of my Skills, the Problems I care about, and the People (Personas) I want to serve.

Please extract and organize your findings in this EXACT format (I'll be pasting this into an app):

---START EXTRACTION---

## SKILLS (Things I'm good at or learning)
For each skill, provide:
- SKILL: [Name]
- EVIDENCE: [Brief quote or pattern you noticed]
- FREQUENCY: [Low/Medium/High - how often this appeared]
- CATEGORY: [Technical / Creative / Interpersonal / Strategic / Healing / Other]

## PROBLEMS (Issues I care about solving)
For each problem, provide:
- PROBLEM: [Name/Description]
- EVIDENCE: [What made you identify this]
- FREQUENCY: [Low/Medium/High]
- EMOTIONAL_CHARGE: [Low/Medium/High - how much passion I showed]

## PERSONAS (Types of people I want to help or relate to)
For each persona, provide:
- PERSONA: [Description]
- EVIDENCE: [What made you identify this]
- FREQUENCY: [Low/Medium/High]
- CONNECTION: [Why I might relate to this persona]

## RECURRING THEMES
List 3-5 themes that appear across multiple conversations:
- THEME: [Name]
- CONNECTS: [Which skills, problems, or personas this links]

## CURIOSITY GAPS
Things I've circled around but haven't fully explored:
- GAP: [Topic]
- EVIDENCE: [Why you think I'm curious but haven't gone deep]
- SUGGESTED_CONNECTION: [What existing interest this might link to]

## NORTH STAR HYPOTHESIS
Based on everything above, complete this sentence:
"You seem most alive when you're using [SKILLS] to help [PERSONAS] solve [PROBLEMS]."

---END EXTRACTION---

Important guidelines:
1. Be specific — use my actual words and topics, not generic descriptions
2. Look for PATTERNS, not just one-off mentions
3. Include things I might not consciously recognize about myself
4. Note contradictions or tensions if you see them
5. Prioritize depth over breadth — fewer items with rich detail is better
6. For frequency, base it on how often the topic genuinely appeared
7. Keep each evidence note under 20 words
8. This is for self-discovery, so be honest rather than flattering`

export default function MindSpace() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [rawResponse, setRawResponse] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [mappedData, setMappedData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [sourceAI, setSourceAI] = useState('chatgpt')

  const [starredSkills, setStarredSkills] = useState(new Set())
  const [starredProblems, setStarredProblems] = useState(new Set())
  const [starredPersonas, setStarredPersonas] = useState(new Set())

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(EXTRACTION_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = EXTRACTION_PROMPT
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleParse = () => {
    setIsProcessing(true)
    setError(null)

    try {
      const parsed = parseMindSpaceResponse(rawResponse)
      const validation = validateParsedData(parsed)

      if (!validation.isValid) {
        setError(`Couldn't extract enough data: ${validation.errors.join(', ')}. Try a longer conversation or check the format.`)
        setIsProcessing(false)
        return
      }

      const mapped = mapAllToWheelSegments(parsed)
      setParsedData(parsed)
      setMappedData(mapped)
      setStep(3)
    } catch (err) {
      setError('Failed to parse the response. Make sure the AI followed the format.')
    }

    setIsProcessing(false)
  }

  const handleLevelChange = (type, index, level) => {
    setMappedData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) =>
        i === index ? { ...item, userLevel: level } : item
      )
    }))
  }

  const handleToggleStar = (type, index) => {
    const setters = {
      skills: setStarredSkills,
      problems: setStarredProblems,
      personas: setStarredPersonas
    }
    const current = type === 'skills' ? starredSkills
      : type === 'problems' ? starredProblems
        : starredPersonas

    const newSet = new Set(current)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else if (newSet.size < 3) {
      newSet.add(index)
    }
    setters[type](newSet)
  }

  const handleRemoveItem = (type, index) => {
    setMappedData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const saveToNikigaiClusters = async () => {
    // Save skills
    for (let i = 0; i < mappedData.skills.length; i++) {
      const skill = mappedData.skills[i]
      if (!skill.userLevel) continue

      await supabase.from('nikigai_clusters').upsert({
        user_id: user.id,
        flow_type: 'skills',
        label: skill.name,
        summary: skill.evidence,
        confidence: skill.frequency === 'High' ? 0.9 : skill.frequency === 'Medium' ? 0.7 : 0.5,
        source: 'mind_space',
        metadata: {
          mappedTo: skill.mappedTo,
          level: skill.userLevel,
          isStarred: starredSkills.has(i),
          sourceAI
        }
      }, { onConflict: 'user_id,flow_type,label' })
    }

    // Save problems
    for (let i = 0; i < mappedData.problems.length; i++) {
      const problem = mappedData.problems[i]
      if (!problem.userLevel) continue

      await supabase.from('nikigai_clusters').upsert({
        user_id: user.id,
        flow_type: 'problems',
        label: problem.name,
        summary: problem.evidence,
        confidence: problem.frequency === 'High' ? 0.9 : problem.frequency === 'Medium' ? 0.7 : 0.5,
        source: 'mind_space',
        metadata: {
          mappedTo: problem.mappedTo,
          level: problem.userLevel,
          emotionalCharge: problem.emotionalCharge,
          isStarred: starredProblems.has(i),
          sourceAI
        }
      }, { onConflict: 'user_id,flow_type,label' })
    }

    // Save personas
    for (let i = 0; i < mappedData.personas.length; i++) {
      const persona = mappedData.personas[i]
      if (!persona.userLevel) continue

      await supabase.from('nikigai_clusters').upsert({
        user_id: user.id,
        flow_type: 'persona',
        label: persona.name,
        summary: persona.evidence,
        confidence: persona.frequency === 'High' ? 0.9 : persona.frequency === 'Medium' ? 0.7 : 0.5,
        source: 'mind_space',
        metadata: {
          mappedTo: persona.mappedTo,
          level: persona.userLevel,
          connection: persona.connection,
          isStarred: starredPersonas.has(i),
          sourceAI
        }
      }, { onConflict: 'user_id,flow_type,label' })
    }

    // Save north star as key outcome
    if (parsedData.northStar) {
      await supabase.from('nikigai_key_outcomes').upsert({
        user_id: user.id,
        outcome_type: 'north_star',
        content: parsedData.northStar,
        source: 'mind_space'
      }, { onConflict: 'user_id,outcome_type' })
    }
  }

  const handleConfirm = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      await saveToNikigaiClusters()
      setStep(4) // Go to "what's next" screen
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    }

    setIsProcessing(false)
  }

  const handleNextChoice = (choice) => {
    switch (choice) {
      case 'skills':
        navigate('/nikigai/skills')
        break
      case 'problems':
      case 'people':
        navigate('/nikigai/problems', {
          state: choice === 'people' ? { showPeopleExplanation: true } : undefined
        })
        break
      case 'done':
        navigate('/7-day-challenge', { state: { completedMindSpace: true } })
        break
    }
  }

  return (
    <div className="mind-space">
      <header className="mind-space-header">
        <h1>Mind Space</h1>
        <p className="subtitle">Extract your patterns from AI conversations</p>

        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">Copy</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">Paste</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Review</span>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* Step 1: Copy Prompt */}
      {step === 1 && (
        <div className="step-content">
          <div className="card">
            <h2>Copy this prompt</h2>
            <p>Paste it into ChatGPT, Claude, or any AI you've had meaningful conversations with.</p>

            <div className="prompt-preview">
              <pre>{EXTRACTION_PROMPT.slice(0, 300)}...</pre>
            </div>

            <button
              className={`copy-button ${copied ? 'copied' : ''}`}
              onClick={handleCopyPrompt}
            >
              {copied ? '✓ Copied!' : 'Copy Prompt'}
            </button>

            <div className="ai-links">
              <span>Open:</span>
              <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer">ChatGPT</a>
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude</a>
            </div>

            <div className="tip-box">
              <strong>Tip:</strong> The more conversation history you have with the AI, the better the extraction. This works best when you've discussed your work, interests, or goals over multiple sessions.
            </div>

            <div className="button-row">
              <button className="primary-button" onClick={() => setStep(2)}>
                I've copied it →
              </button>
              <button className="secondary-button" onClick={() => navigate('/7-day-challenge')}>
                ← Back to Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Paste Response */}
      {step === 2 && (
        <div className="step-content">
          <div className="card">
            <h2>Paste the AI's response</h2>
            <p>After the AI generates the extraction, paste the full response here.</p>

            <div className="source-selector">
              <label>Which AI?</label>
              <div className="source-options">
                {['chatgpt', 'claude', 'other'].map(src => (
                  <button
                    key={src}
                    className={sourceAI === src ? 'selected' : ''}
                    onClick={() => setSourceAI(src)}
                  >
                    {src === 'chatgpt' ? 'ChatGPT' : src === 'claude' ? 'Claude' : 'Other'}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="paste-area"
              placeholder="Paste the AI's response here..."
              value={rawResponse}
              onChange={(e) => setRawResponse(e.target.value)}
              rows={10}
            />

            <div className="char-count">{rawResponse.length} characters</div>

            <div className="button-row">
              <button
                className="primary-button"
                onClick={handleParse}
                disabled={rawResponse.length < 500 || isProcessing}
              >
                {isProcessing ? 'Extracting...' : 'Extract Patterns'}
              </button>
              <button className="secondary-button" onClick={() => setStep(1)}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && mappedData && (
        <div className="step-content review-step">
          <div className="card">
            <h2>Review Your Extraction</h2>
            <p>Star your top 3 in each category and select your level.</p>

            {parsedData.northStar && (
              <div className="north-star">
                <span className="north-star-label">Your North Star</span>
                <p>"{parsedData.northStar}"</p>
              </div>
            )}

            {/* Skills */}
            <section className="review-section">
              <h3>Skills <span className="count">({mappedData.skills.length})</span></h3>
              <p className="hint">Star your top 3 strongest</p>

              {mappedData.skills.map((skill, i) => (
                <div key={i} className="review-item">
                  <button
                    className={`star-btn ${starredSkills.has(i) ? 'starred' : ''}`}
                    onClick={() => handleToggleStar('skills', i)}
                    disabled={!starredSkills.has(i) && starredSkills.size >= 3}
                  >
                    {starredSkills.has(i) ? '★' : '☆'}
                  </button>

                  <div className="item-main">
                    <div className="item-header">
                      {skill.mappedTo && SEGMENT_DISPLAY.skills[skill.mappedTo] && (
                        <span className="icon">{SEGMENT_DISPLAY.skills[skill.mappedTo].icon}</span>
                      )}
                      <span className="name">{skill.name}</span>
                      <span className={`freq freq-${skill.frequency.toLowerCase()}`}>{skill.frequency}</span>
                    </div>
                    <div className="evidence">{skill.evidence}</div>
                    <div className="level-btns">
                      {LEVEL_OPTIONS.skills.map(opt => (
                        <button
                          key={opt.value}
                          className={skill.userLevel === opt.value ? 'selected' : ''}
                          onClick={() => handleLevelChange('skills', i, opt.value)}
                          title={opt.description}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="remove-btn" onClick={() => handleRemoveItem('skills', i)}>×</button>
                </div>
              ))}
            </section>

            {/* Problems */}
            <section className="review-section">
              <h3>Problems <span className="count">({mappedData.problems.length})</span></h3>
              <p className="hint">Star the top 3 that light you up</p>

              {mappedData.problems.map((problem, i) => (
                <div key={i} className="review-item">
                  <button
                    className={`star-btn ${starredProblems.has(i) ? 'starred' : ''}`}
                    onClick={() => handleToggleStar('problems', i)}
                    disabled={!starredProblems.has(i) && starredProblems.size >= 3}
                  >
                    {starredProblems.has(i) ? '★' : '☆'}
                  </button>

                  <div className="item-main">
                    <div className="item-header">
                      {problem.mappedTo && SEGMENT_DISPLAY.problems[problem.mappedTo] && (
                        <span className="icon">{SEGMENT_DISPLAY.problems[problem.mappedTo].icon}</span>
                      )}
                      <span className="name">{problem.name}</span>
                      <span className={`freq freq-${problem.frequency.toLowerCase()}`}>{problem.frequency}</span>
                    </div>
                    <div className="evidence">{problem.evidence}</div>
                    <div className="level-btns">
                      {LEVEL_OPTIONS.problems.map(opt => (
                        <button
                          key={opt.value}
                          className={problem.userLevel === opt.value ? 'selected' : ''}
                          onClick={() => handleLevelChange('problems', i, opt.value)}
                          title={opt.description}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="remove-btn" onClick={() => handleRemoveItem('problems', i)}>×</button>
                </div>
              ))}
            </section>

            {/* Personas */}
            <section className="review-section">
              <h3>People <span className="count">({mappedData.personas.length})</span></h3>
              <p className="hint">Star the top 3 you want to serve</p>

              {mappedData.personas.map((persona, i) => (
                <div key={i} className="review-item">
                  <button
                    className={`star-btn ${starredPersonas.has(i) ? 'starred' : ''}`}
                    onClick={() => handleToggleStar('personas', i)}
                    disabled={!starredPersonas.has(i) && starredPersonas.size >= 3}
                  >
                    {starredPersonas.has(i) ? '★' : '☆'}
                  </button>

                  <div className="item-main">
                    <div className="item-header">
                      {persona.mappedTo && SEGMENT_DISPLAY.personas[persona.mappedTo] && (
                        <span className="icon">{SEGMENT_DISPLAY.personas[persona.mappedTo].icon}</span>
                      )}
                      <span className="name">{persona.name}</span>
                      <span className={`freq freq-${persona.frequency.toLowerCase()}`}>{persona.frequency}</span>
                    </div>
                    <div className="evidence">{persona.evidence}</div>
                    {persona.connection && <div className="connection">Connection: {persona.connection}</div>}
                    <div className="level-btns">
                      {LEVEL_OPTIONS.personas.map(opt => (
                        <button
                          key={opt.value}
                          className={persona.userLevel === opt.value ? 'selected' : ''}
                          onClick={() => handleLevelChange('personas', i, opt.value)}
                          title={opt.description}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="remove-btn" onClick={() => handleRemoveItem('personas', i)}>×</button>
                </div>
              ))}
            </section>

            {/* Themes & Gaps (collapsed) */}
            {parsedData.themes.length > 0 && (
              <details className="extras-section">
                <summary>Recurring Themes ({parsedData.themes.length})</summary>
                {parsedData.themes.map((t, i) => (
                  <div key={i} className="extra-item">
                    <strong>{t.name}</strong>
                    <span>{t.connects}</span>
                  </div>
                ))}
              </details>
            )}

            {parsedData.curiosityGaps.length > 0 && (
              <details className="extras-section">
                <summary>Curiosity Gaps ({parsedData.curiosityGaps.length})</summary>
                {parsedData.curiosityGaps.map((g, i) => (
                  <div key={i} className="extra-item">
                    <strong>{g.name}</strong>
                    <span>{g.suggestedConnection}</span>
                  </div>
                ))}
              </details>
            )}

            <div className="button-row">
              <button
                className="primary-button"
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Confirm & Continue'}
              </button>
              <button className="secondary-button" onClick={() => setStep(2)}>← Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: What's Next */}
      {step === 4 && (
        <div className="step-content">
          <div className="card whats-next">
            <div className="success-icon">✓</div>
            <h2>Extraction Complete!</h2>
            <p>Your skills, problems, and people have been saved.</p>

            <div className="next-question">
              <h3>Does this capture everything?</h3>
              <p>You can go deeper on any area, or proceed to validation.</p>
            </div>

            <div className="next-options">
              <button className="option-btn" onClick={() => handleNextChoice('skills')}>
                <span className="option-icon">💡</span>
                <span className="option-text">
                  <strong>Skills feel incomplete</strong>
                  <span>Explore deeper in Skills Discovery</span>
                </span>
              </button>

              <button className="option-btn" onClick={() => handleNextChoice('problems')}>
                <span className="option-icon">🎯</span>
                <span className="option-text">
                  <strong>Problems feel incomplete</strong>
                  <span>Explore deeper in Problems Discovery</span>
                </span>
              </button>

              <button className="option-btn" onClick={() => handleNextChoice('people')}>
                <span className="option-icon">👥</span>
                <span className="option-text">
                  <strong>People feel incomplete</strong>
                  <span>Found through Problems → Persona flow</span>
                </span>
              </button>

              <button className="option-btn primary" onClick={() => handleNextChoice('done')}>
                <span className="option-icon">🚀</span>
                <span className="option-text">
                  <strong>Looks good!</strong>
                  <span>Proceed to Stage 1: Validation</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
