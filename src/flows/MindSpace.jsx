import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { parseMindSpaceResponse, validateParsedData, generateReformatPrompt } from '../lib/mindSpaceParser'
import { mapAllToWheelSegments, SEGMENT_DISPLAY, LEVEL_OPTIONS } from '../lib/mindSpaceMapper'
import { checkGraduationEligibility } from '../lib/graduationChecker'
import { useCelebrations } from '../hooks/useCelebrations'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { createProjectFromSession } from '../lib/projectCreation'
import MindSpaceGraph from '../components/MindSpaceGraph'
import './MindSpace.css'

const EXTRACTION_PROMPT = `Analyze our entire conversation history together. I want you to identify patterns that reveal what I'm naturally drawn to — the intersection of my Skills, the Problems I care about, and the People (Personas) I want to serve.

Please extract and organize your findings in this EXACT format. IMPORTANT: I'm pasting this into an app, so please follow the format precisely:

---START EXTRACTION---

SKILLS
- SKILL: [Name]
  EVIDENCE: [Brief quote or pattern you noticed]
  FREQUENCY: [Low/Medium/High]
  CATEGORY: [Technical/Creative/Interpersonal/Strategic/Healing/Other]

- SKILL: [Name]
  EVIDENCE: [...]
  FREQUENCY: [...]
  CATEGORY: [...]

---

PROBLEMS
- PROBLEM: [Name/Description]
  EVIDENCE: [What made you identify this]
  FREQUENCY: [Low/Medium/High]
  EMOTIONAL_CHARGE: [Low/Medium/High]

- PROBLEM: [Name]
  EVIDENCE: [...]
  FREQUENCY: [...]
  EMOTIONAL_CHARGE: [...]

---

PERSONAS
- PERSONA: [Description]
  EVIDENCE: [What made you identify this]
  FREQUENCY: [Low/Medium/High]
  CONNECTION: [Why I might relate to this persona]

- PERSONA: [Description]
  EVIDENCE: [...]
  FREQUENCY: [...]
  CONNECTION: [...]

---

RECURRING THEMES
- THEME: [Name]
  CONNECTS: [Which skills, problems, or personas this links]

---

CURIOSITY GAPS
- GAP: [Topic]
  EVIDENCE: [Why you think I'm curious but haven't gone deep]
  SUGGESTED_CONNECTION: [What existing interest this might link to]

---

NORTH STAR HYPOTHESIS
"You seem most alive when you're using [SKILLS] to help [PERSONAS] solve [PROBLEMS]."

---END EXTRACTION---

FORMAT RULES (please follow exactly):
1. Start each item with a dash and the field name: - SKILL:, - PROBLEM:, - PERSONA:, etc.
2. Put each field (EVIDENCE, FREQUENCY, etc.) on its own line, indented with spaces
3. Separate sections with --- on its own line
4. Include the ---START EXTRACTION--- and ---END EXTRACTION--- markers

CONTENT GUIDELINES:
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
  const [searchParams] = useSearchParams()
  const { triggerConfetti, celebrateLevelUp } = useCelebrations()

  const [step, setStep] = useState(1)
  const [viewingResults, setViewingResults] = useState(false)
  const [rawResponse, setRawResponse] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [mappedData, setMappedData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [sourceAI, setSourceAI] = useState('chatgpt')
  const [aiUsageLevel, setAiUsageLevel] = useState(null)
  const [graduationMessage, setGraduationMessage] = useState(null)

  const [starredSkills, setStarredSkills] = useState(new Set())
  const [starredProblems, setStarredProblems] = useState(new Set())
  const [starredPersonas, setStarredPersonas] = useState(new Set())
  const [showReformatPrompt, setShowReformatPrompt] = useState(false)
  const [reformatCopied, setReformatCopied] = useState(false)

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        // Load the most recent mind_space extraction from nikigai_responses
        const { data: savedResponse, error } = await supabase
          .from('nikigai_responses')
          .select('*')
          .eq('user_id', user.id)
          .eq('flow_type', 'mind_space')
          .eq('response_type', 'extraction')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        if (savedResponse && savedResponse.response_data) {
          const data = savedResponse.response_data
          // Restore the mapped data
          setMappedData({
            skills: data.skills || [],
            problems: data.problems || [],
            personas: data.personas || []
          })
          // Restore parsed data (for north star, themes, gaps)
          setParsedData({
            skills: data.skills || [],
            problems: data.problems || [],
            personas: data.personas || [],
            northStar: data.northStar || '',
            themes: data.themes || [],
            curiosityGaps: data.curiosityGaps || []
          })
          // Restore starred items
          if (data.starredSkills) setStarredSkills(new Set(data.starredSkills))
          if (data.starredProblems) setStarredProblems(new Set(data.starredProblems))
          if (data.starredPersonas) setStarredPersonas(new Set(data.starredPersonas))
          if (data.sourceAI) setSourceAI(data.sourceAI)
          if (data.aiUsageLevel) setAiUsageLevel(data.aiUsageLevel)

          setViewingResults(true)
          setStep(4) // Go to "what's next" / results screen
        }
      } catch (err) {
        console.error('Error loading saved Mind Space results:', err)
        // If no results found, just stay on step 1
      }
    }

    loadSavedResults()
  }, [searchParams, user])

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

  const handleParse = async () => {
    setIsProcessing(true)
    setError(null)
    setShowReformatPrompt(false)

    try {
      const parsed = parseMindSpaceResponse(rawResponse)
      const validation = validateParsedData(parsed)

      if (!validation.isValid) {
        const found = validation.found || []
        const foundMsg = found.length > 0
          ? ` (Found: ${found.join(', ')})`
          : ''
        setError(`Couldn't extract all data: ${validation.errors.join(', ')}.${foundMsg}`)
        setShowReformatPrompt(true)
        setIsProcessing(false)
        return
      }

      const mapped = await mapAllToWheelSegments(parsed)
      setParsedData(parsed)
      setMappedData(mapped)
      setStep(3)
    } catch (err) {
      console.error('Parse error:', err)
      setError('Failed to parse the response. The format may not match what we expected.')
      setShowReformatPrompt(true)
    }

    setIsProcessing(false)
  }

  const handleCopyReformatPrompt = async () => {
    const prompt = generateReformatPrompt(rawResponse)
    try {
      await navigator.clipboard.writeText(prompt)
      setReformatCopied(true)
      setTimeout(() => setReformatCopied(false), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = prompt
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setReformatCopied(true)
      setTimeout(() => setReformatCopied(false), 2000)
    }
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
    let hasErrors = false

    // First create a flow session to get a session_id
    const sessionId = crypto.randomUUID()
    const { data: sessionData, error: sessionError } = await supabase.from('flow_sessions').insert({
      id: sessionId,
      user_id: user.id,
      flow_type: 'mind_space',
      flow_version: '1.0',
      status: 'completed',
      last_step_id: 'extraction_complete',
      completed_at: new Date().toISOString()
    }).select().single()

    if (sessionError) {
      console.error('❌ Error creating flow session:', sessionError)
      // Don't continue if session creation failed - we need the session_id
      return { success: false, error: sessionError.message }
    }

    console.log('✅ Flow session created:', sessionData?.id || sessionId)

    // Save skills - using correct nikigai_clusters column names
    for (let i = 0; i < mappedData.skills.length; i++) {
      const skill = mappedData.skills[i]
      if (!skill.userLevel) continue

      const { error } = await supabase.from('nikigai_clusters').insert({
        session_id: sessionId,
        user_id: user.id,
        cluster_type: 'skills',
        cluster_stage: 'final',
        cluster_label: skill.name,
        insight: skill.evidence,
        proficiency: skill.userLevel,
        taxonomy_keys: skill.mappedTo ? [skill.mappedTo] : [],
        items: [{
          text: skill.evidence,
          frequency: skill.frequency,
          isStarred: starredSkills.has(i),
          sourceAI
        }]
      })
      if (error) {
        console.error('❌ Error saving skill:', skill.name, error)
        hasErrors = true
      }
    }

    // Save problems - using correct nikigai_clusters column names
    for (let i = 0; i < mappedData.problems.length; i++) {
      const problem = mappedData.problems[i]
      if (!problem.userLevel) continue

      const { error } = await supabase.from('nikigai_clusters').insert({
        session_id: sessionId,
        user_id: user.id,
        cluster_type: 'problems',
        cluster_stage: 'final',
        cluster_label: problem.name,
        insight: problem.evidence,
        proficiency: problem.userLevel,
        taxonomy_keys: problem.mappedTo ? [problem.mappedTo] : [],
        items: [{
          text: problem.evidence,
          frequency: problem.frequency,
          emotionalCharge: problem.emotionalCharge,
          isStarred: starredProblems.has(i),
          sourceAI
        }]
      })
      if (error) {
        console.error('❌ Error saving problem:', problem.name, error)
        hasErrors = true
      }
    }

    // Save personas - using correct nikigai_clusters column names
    for (let i = 0; i < mappedData.personas.length; i++) {
      const persona = mappedData.personas[i]
      if (!persona.userLevel) continue

      const { error } = await supabase.from('nikigai_clusters').insert({
        session_id: sessionId,
        user_id: user.id,
        cluster_type: 'persona',
        cluster_stage: 'final',
        cluster_label: persona.name,
        insight: persona.evidence,
        proficiency: persona.userLevel,
        taxonomy_keys: persona.mappedTo ? [persona.mappedTo] : [],
        items: [{
          text: persona.evidence,
          frequency: persona.frequency,
          connection: persona.connection,
          isStarred: starredPersonas.has(i),
          sourceAI
        }]
      })
      if (error) {
        console.error('❌ Error saving persona:', persona.name, error)
        hasErrors = true
      }
    }

    // Save raw extraction data to nikigai_responses for re-clustering capability
    // This stores the complete parsed output including north star, themes, and gaps
    const { error: responseError } = await supabase.from('nikigai_responses').insert({
      session_id: sessionId,
      user_id: user.id,
      flow_type: 'mind_space',
      response_type: 'extraction',
      response_data: {
        skills: mappedData.skills,
        problems: mappedData.problems,
        personas: mappedData.personas,
        northStar: parsedData.northStar,
        themes: parsedData.themes || [],
        curiosityGaps: parsedData.curiosityGaps || [],
        sourceAI,
        aiUsageLevel,
        starredSkills: Array.from(starredSkills),
        starredProblems: Array.from(starredProblems),
        starredPersonas: Array.from(starredPersonas)
      }
    })
    if (responseError) {
      console.error('❌ Error saving raw extraction:', responseError)
      hasErrors = true
    }

    if (hasErrors) {
      console.warn('⚠️ Some items failed to save to MindSpace')
      return { success: false, error: 'Some items failed to save' }
    }

    return { success: true, sessionId }
  }

  const handleConfirm = async () => {
    if (isProcessing) return // Prevent double-clicks
    setIsProcessing(true)
    setError(null)

    try {
      const saveResult = await saveToNikigaiClusters()
      if (saveResult && !saveResult.success) {
        setError(saveResult.error || 'Failed to save. Please try again.')
        return
      }

      // Sync with 7-day challenge to award points
      try {
        await syncFlowFinderWithChallenge(user.id, 'mind_space')
        console.log('✅ Mind Space synced with challenge')
      } catch (syncError) {
        console.warn('Challenge sync failed:', syncError)
        // Don't block completion if sync fails
      }

      // Auto-create project if user doesn't have one (vibe seekers)
      try {
        const projectResult = await createProjectFromSession(user.id, saveResult.sessionId, 'mind_space')
        if (projectResult.skipped) {
          console.log('✅ User already has a project, skipped auto-creation')
        } else if (projectResult.success) {
          console.log('✅ Auto-created project from Mind Space:', projectResult.projectName)
        } else {
          console.warn('⚠️ Project auto-creation failed:', projectResult.error)
        }
      } catch (projectError) {
        console.warn('Project creation failed:', projectError)
        // Don't block completion if project creation fails
      }

      // Check if user can now graduate from Flow Finder to Validation
      try {
        const eligibility = await checkGraduationEligibility(user.id)
        console.log('🎓 Graduation eligibility:', eligibility)

        if (eligibility.eligible) {
          // Trigger celebration!
          triggerConfetti()
          setGraduationMessage({
            title: '🎉 Stage Unlocked: Validation!',
            message: 'You\'ve completed Flow Finder and unlocked Stage 1: Validation. Time to validate your ideas with real people!',
            nextStep: 'Head to the Challenge page to start your validation journey.'
          })
        }
      } catch (gradError) {
        console.warn('Graduation check failed:', gradError)
        // Don't block completion if graduation check fails
      }

      setStep(4) // Go to "what's next" screen
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNextChoice = (choice) => {
    switch (choice) {
      case 'skills':
        navigate('/play-list-finder')
        break
      case 'problems':
        navigate('/nikigai/problems')
        break
      case 'people':
        navigate('/persona-identifier')
        break
      case 'done':
        navigate('/me')
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

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          {showReformatPrompt && (
            <div className="reformat-help">
              <p>Copy this prompt back to your AI to get the correct format:</p>
              <button
                className={`copy-button small ${reformatCopied ? 'copied' : ''}`}
                onClick={handleCopyReformatPrompt}
              >
                {reformatCopied ? 'Copied!' : 'Copy Reformat Prompt'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Copy Prompt */}
      {step === 1 && (
        <div className="step-content">
          <div className="card ai-usage-card">
            <h2>How often do you use AI chats?</h2>
            <p>This helps us understand how effective this tool will be for you.</p>

            <div className="ai-usage-options">
              {[
                { value: 'rare', label: 'Rarely', desc: 'Tried it a few times' },
                { value: 'occasional', label: 'Occasionally', desc: 'A few times a month' },
                { value: 'regular', label: 'Regularly', desc: 'A few times a week' },
                { value: 'daily', label: 'Daily', desc: "It's part of my workflow" }
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`ai-usage-btn ${aiUsageLevel === opt.value ? 'selected' : ''}`}
                  onClick={() => setAiUsageLevel(opt.value)}
                >
                  <span className="usage-label">{opt.label}</span>
                  <span className="usage-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`card ${!aiUsageLevel ? 'card-dimmed' : ''}`}>
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
                    </div>
                    <div className="item-tags">
                      {skill.mappedTo && SEGMENT_DISPLAY.skills[skill.mappedTo] && (
                        <span className="taxonomy-tag">
                          {SEGMENT_DISPLAY.skills[skill.mappedTo].title}
                        </span>
                      )}
                      <span className={`freq freq-${skill.frequency?.toLowerCase() || 'medium'}`}>{skill.frequency}</span>
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
                    </div>
                    <div className="item-tags">
                      {problem.mappedTo && SEGMENT_DISPLAY.problems[problem.mappedTo] && (
                        <span className="taxonomy-tag">
                          {SEGMENT_DISPLAY.problems[problem.mappedTo].title}
                        </span>
                      )}
                      <span className={`freq freq-${problem.frequency?.toLowerCase() || 'medium'}`}>{problem.frequency}</span>
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
                    </div>
                    <div className="item-tags">
                      {persona.mappedTo && SEGMENT_DISPLAY.personas[persona.mappedTo] && (
                        <span className="taxonomy-tag">
                          {SEGMENT_DISPLAY.personas[persona.mappedTo].title}
                        </span>
                      )}
                      <span className={`freq freq-${persona.frequency?.toLowerCase() || 'medium'}`}>{persona.frequency}</span>
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

      {/* Step 4: What's Next / Results View */}
      {step === 4 && (
        <div className="step-content">
          <div className="card whats-next">
            <div className="success-icon">{viewingResults ? '🎯' : (graduationMessage ? '🎉' : '✓')}</div>
            <h2>{viewingResults ? 'Your Mind Space Results' : (graduationMessage ? graduationMessage.title : 'Extraction Complete!')}</h2>
            <p>{viewingResults ? 'Here\'s what we extracted from your AI conversations.' : (graduationMessage ? graduationMessage.message : 'Your skills, problems, and people have been saved.')}</p>

            {graduationMessage && !viewingResults && (
              <div className="graduation-banner">
                <p>{graduationMessage.nextStep}</p>
              </div>
            )}

            {/* Show extracted data when viewing results */}
            {viewingResults && mappedData && (
              <div className="results-summary">
                {/* Mind Space Graph Visualization */}
                <MindSpaceGraph
                  data={{
                    skills: mappedData.skills || [],
                    problems: mappedData.problems || [],
                    personas: mappedData.personas || [],
                    themes: parsedData?.themes || [],
                    curiosityGaps: parsedData?.curiosityGaps || [],
                    northStar: parsedData?.northStar || '',
                    starredSkills: Array.from(starredSkills),
                    starredProblems: Array.from(starredProblems),
                    starredPersonas: Array.from(starredPersonas)
                  }}
                />

                {parsedData?.northStar && (
                  <div className="north-star">
                    <span className="north-star-label">Your North Star</span>
                    <p>"{parsedData.northStar}"</p>
                  </div>
                )}

                {mappedData.skills?.length > 0 && (
                  <div className="results-section">
                    <h3>💡 Skills ({mappedData.skills.length})</h3>
                    <div className="results-items">
                      {mappedData.skills.slice(0, 5).map((skill, i) => (
                        <div key={i} className="result-item">
                          <div className="result-main">
                            <span className="result-name">{skill.name}</span>
                            {skill.mappedTo && SEGMENT_DISPLAY.skills[skill.mappedTo] && (
                              <span className="taxonomy-tag">{SEGMENT_DISPLAY.skills[skill.mappedTo].title}</span>
                            )}
                          </div>
                          {skill.userLevel && <span className={`result-level level-${skill.userLevel}`}>{skill.userLevel}</span>}
                        </div>
                      ))}
                      {mappedData.skills.length > 5 && <p className="more-items">+{mappedData.skills.length - 5} more</p>}
                    </div>
                  </div>
                )}

                {mappedData.problems?.length > 0 && (
                  <div className="results-section">
                    <h3>🎯 Problems ({mappedData.problems.length})</h3>
                    <div className="results-items">
                      {mappedData.problems.slice(0, 5).map((problem, i) => (
                        <div key={i} className="result-item">
                          <div className="result-main">
                            <span className="result-name">{problem.name}</span>
                            {problem.mappedTo && SEGMENT_DISPLAY.problems[problem.mappedTo] && (
                              <span className="taxonomy-tag">{SEGMENT_DISPLAY.problems[problem.mappedTo].title}</span>
                            )}
                          </div>
                          {problem.userLevel && <span className={`result-level level-${problem.userLevel}`}>{problem.userLevel}</span>}
                        </div>
                      ))}
                      {mappedData.problems.length > 5 && <p className="more-items">+{mappedData.problems.length - 5} more</p>}
                    </div>
                  </div>
                )}

                {mappedData.personas?.length > 0 && (
                  <div className="results-section">
                    <h3>👥 People ({mappedData.personas.length})</h3>
                    <div className="results-items">
                      {mappedData.personas.slice(0, 5).map((persona, i) => (
                        <div key={i} className="result-item">
                          <div className="result-main">
                            <span className="result-name">{persona.name}</span>
                            {persona.mappedTo && SEGMENT_DISPLAY.personas[persona.mappedTo] && (
                              <span className="taxonomy-tag">{SEGMENT_DISPLAY.personas[persona.mappedTo].title}</span>
                            )}
                          </div>
                          {persona.userLevel && <span className={`result-level level-${persona.userLevel}`}>{persona.userLevel}</span>}
                        </div>
                      ))}
                      {mappedData.personas.length > 5 && <p className="more-items">+{mappedData.personas.length - 5} more</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation for viewing results */}
            {viewingResults ? (
              <div className="nav-buttons" style={{ marginTop: '24px' }}>
                <button
                  className="secondary-button"
                  onClick={() => navigate('/7-day-challenge')}
                >
                  Back
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    setViewingResults(false)
                    setStep(1)
                    setMappedData(null)
                    setParsedData(null)
                    setRawResponse('')
                    setStarredSkills(new Set())
                    setStarredProblems(new Set())
                    setStarredPersonas(new Set())
                    navigate('/mind-space', { replace: true })
                  }}
                >
                  Retake Flow
                </button>
              </div>
            ) : (
              <>
                <div className="next-question">
                  <h3>Does this capture everything?</h3>
                  <p>You can go deeper on any area, or proceed to validation.</p>
                </div>

                <div className="next-options">
                  <button className="option-btn" onClick={() => handleNextChoice('skills')}>
                    <span className="option-icon">💡</span>
                    <span className="option-text">
                      <strong>Skills feel incomplete</strong>
                      <span>Explore deeper in Playlist Finder</span>
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
                      <span>Explore deeper in Persona Identifier</span>
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

                <button
                  className="primary-button complete-btn"
                  onClick={() => navigate('/me')}
                >
                  Complete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
