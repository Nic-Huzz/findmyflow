import { useState, useEffect, useRef } from 'react'
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
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
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

function AddCustomInput({ type, onAdd, placeholder }) {
  const [value, setValue] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) {
      onAdd(type, value)
      setValue('')
    }
  }
  return (
    <form className="add-custom-row" onSubmit={handleSubmit}>
      <input
        type="text"
        className="add-custom-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="add-custom-btn" disabled={!value.trim()}>+ Add</button>
    </form>
  )
}

function generateCombinations(skills, problems, personas) {
  const combos = []
  const s = skills.length > 0 ? skills : [null]
  const p = problems.length > 0 ? problems : [null]
  const pe = personas.length > 0 ? personas : [null]

  for (const skill of s) {
    for (const problem of p) {
      for (const persona of pe) {
        const present = [skill, problem, persona].filter(Boolean).length
        if (present >= 2) {
          combos.push({ skill, problem, persona })
        }
      }
    }
  }
  return combos
}

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
  const [userPersona, setUserPersona] = useState(null)
  const [selectedCombination, setSelectedCombination] = useState(null)
  const [lastSessionId, setLastSessionId] = useState(null)
  const sessionIdRef = useRef(null)
  const [combinationSaving, setCombinationSaving] = useState(false)
  const [currentSkillIdx, setCurrentSkillIdx] = useState(0)
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0)
  const [currentPersonaIdx, setCurrentPersonaIdx] = useState(0)
  const [projectName, setProjectName] = useState('')
  const projectIdRef = useRef(null)

  // Review sub-page state (0=skills, 1=problems, 2=personas)
  const [reviewCategory, setReviewCategory] = useState(0)

  // Ambition flow state (Steps 4-7)
  const [ambition, setAmbition] = useState(null)
  const [hasExistingBiz, setHasExistingBiz] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)

  // Stage options for build_own + existing business (same as BusinessSetup)
  const STAGE_OPTIONS = [
    { value: 'not_validated', label: "I have an idea but haven't tested it yet", stage: 1 },
    { value: 'validated_no_product', label: "People want it but I haven't built it yet", stage: 2 },
    { value: 'have_product_not_tested', label: 'I have something built but need more feedback', stage: 3 },
    { value: 'have_product_with_customers', label: 'I have paying customers', stage: 4 },
    { value: 'need_offer_stack', label: 'I need to build out my full offer', stage: 5 },
    { value: 'need_marketing', label: 'My offer is ready, I need to get it out there', stage: 6 },
    { value: 'ready_to_launch', label: "I'm ready to launch", stage: 7 },
  ]

  // Fetch user persona + ambition on mount
  useEffect(() => {
    if (!user?.id) return
    const fetchUserProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('user_stage_progress')
          .select('persona, ambition, has_existing_business')
          .eq('user_id', user.id)
          .maybeSingle()
        if (data?.persona) {
          setUserPersona(data.persona)
        }
        if (data?.ambition) {
          setAmbition(data.ambition)
        }
        if (data?.has_existing_business != null) {
          setHasExistingBiz(data.has_existing_business)
        }
      } catch (err) {
        console.warn('Could not fetch user progress:', err)
      }
    }
    fetchUserProgress()
  }, [user?.id])

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
          setStep(8) // Go to "what's next" / results screen
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
      setReviewCategory(0)
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

  const handleKeepItem = (type, index) => {
    setMappedData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) =>
        i === index ? { ...item, kept: true } : item
      )
    }))
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
    // Soft-remove: mark as removed (undoable) instead of deleting from array
    setMappedData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) =>
        i === index ? { ...item, removed: true, kept: false, userLevel: null } : item
      )
    }))
    // Also unstar if starred
    const setters = { skills: setStarredSkills, problems: setStarredProblems, personas: setStarredPersonas }
    setters[type](prev => {
      if (!prev.has(index)) return prev
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const handleUndoRemove = (type, index) => {
    setMappedData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) =>
        i === index ? { ...item, removed: false } : item
      )
    }))
  }

  const handleAddCustomItem = (type, name) => {
    if (!name.trim()) return
    // Default userLevel to middle option so custom items save to DB
    // (saveToNikigaiClusters skips items with userLevel: null)
    const defaultLevels = { skills: 'establishing', problems: 'pursuing', personas: 'familiar' }
    const newItem = {
      name: name.trim(),
      evidence: 'Added manually',
      frequency: 'Medium',
      mappedTo: null,
      userLevel: defaultLevels[type],
      kept: true,
      custom: true
    }
    if (type === 'personas') {
      newItem.connection = ''
    }
    setMappedData(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
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

  const saveCombination = async (combo, sessionId, clusterType = 'primary_combination') => {
    try {
      const { error } = await supabase.from('nikigai_clusters').insert({
        session_id: sessionId || lastSessionId,
        user_id: user.id,
        cluster_type: clusterType,
        cluster_stage: 'selected',
        cluster_label: [
          combo.skill?.name,
          combo.persona?.name ? `helping ${combo.persona.name}` : null,
          combo.problem?.name ? `with ${combo.problem.name}` : null
        ].filter(Boolean).join(' ') || 'No alignment',
        items: [{
          skill: combo.skill ? { name: combo.skill.name, mappedTo: combo.skill.mappedTo } : null,
          problem: combo.problem ? { name: combo.problem.name, mappedTo: combo.problem.mappedTo } : null,
          persona: combo.persona ? { name: combo.persona.name, mappedTo: combo.persona.mappedTo } : null
        }]
      })
      if (error) {
        console.error('Error saving combination:', error)
        return false
      }
      console.log('Combination saved successfully')
      return true
    } catch (err) {
      console.error('Error saving combination:', err)
      return false
    }
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
        if (projectResult.projectId) {
          projectIdRef.current = projectResult.projectId
        }
        if (projectResult.skipped) {
          console.log('✅ User already has a project, skipped auto-creation')
          // Pre-populate project name for existing projects
          if (projectResult.projectName) {
            setProjectName(projectResult.projectName)
          }
        } else if (projectResult.success) {
          console.log('✅ Auto-created project from Mind Space:', projectResult.projectName)
          if (projectResult.projectName) {
            setProjectName(projectResult.projectName)
          }
        } else {
          console.warn('⚠️ Project auto-creation failed:', projectResult.error)
        }
      } catch (projectError) {
        console.warn('Project creation failed:', projectError)
        // Don't block completion if project creation fails
      }

      // Store session ID for combination save
      sessionIdRef.current = saveResult.sessionId
      setLastSessionId(saveResult.sessionId)

      // Check if user can now graduate from Flow Finder to Validation
      try {
        const eligibility = await checkGraduationEligibility(user.id)
        console.log('Graduation eligibility:', eligibility)

        if (eligibility.eligible) {
          // Trigger celebration!
          triggerConfetti()
          setGraduationMessage({
            title: 'Stage Unlocked: Validation!',
            message: 'You\'ve completed Flow Finder and unlocked Stage 1: Validation. Time to validate your ideas with real people!',
            nextStep: 'Head to the Challenge page to start your validation journey.'
          })
        }
      } catch (gradError) {
        console.warn('Graduation check failed:', gradError)
        // Don't block completion if graduation check fails
      }

      // Reset slider indices for step 6 (sliders default to "No alignment" at index 0)
      setCurrentSkillIdx(0)
      setCurrentProblemIdx(0)
      setCurrentPersonaIdx(0)

      // Route based on whether ambition was already answered
      if (ambition) {
        // Returning user — skip ambition questions, still show sliders for new session
        setStep(6)
      } else {
        // First-time — ask ambition question
        setStep(4)
      }
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Hide "go deeper" options if user hasn't visited /me yet (prevents navigation leaks)
  const hasVisitedMe = Boolean(user?.id && localStorage.getItem(`me_page_visited_${user.id}`))

  const returnTo = searchParams.get('returnTo') || '/me'

  const handleNextChoice = (choice) => {
    switch (choice) {
      case 'skills':
        navigate(`/play-list-finder?returnTo=${returnTo}`)
        break
      case 'problems':
        navigate(`/nikigai/problems?returnTo=${returnTo}`)
        break
      case 'people':
        navigate(`/persona-identifier?returnTo=${returnTo}`)
        break
      case 'done':
        navigate(returnTo)
        break
    }
  }

  // Review config per category
  const REVIEW_CONFIGS = {
    skills: { levelLabel: 'Pick your experience level', addPlaceholder: 'Add your own skill...' },
    problems: { levelLabel: 'Pick your experience level', addPlaceholder: 'Add your own problem...' },
    personas: { levelLabel: 'How well do you know this person?', addPlaceholder: 'Add your own persona...' }
  }

  // Shared review item renderer with progressive disclosure
  const renderReviewItem = (type, item, index, starredSet, config) => {
    if (item.removed) {
      return (
        <div key={index} className="review-item removed">
          <div className="item-main">
            <div className="removed-row">
              <span className="removed-name">{item.name}</span>
              <button className="undo-btn" onClick={() => handleUndoRemove(type, index)}>Undo</button>
            </div>
          </div>
        </div>
      )
    }
    const isStarred = starredSet.has(index)
    return (
      <div key={index} className={`review-item ${!item.kept ? 'undecided' : ''}`}>
        <div className="item-main">
          <div className="item-header">
            {item.mappedTo && SEGMENT_DISPLAY[type]?.[item.mappedTo] && (
              <span className="icon">{SEGMENT_DISPLAY[type][item.mappedTo].icon}</span>
            )}
            <span className="name">{isStarred && '★ '}{item.name}</span>
          </div>
          <div className="item-tags">
            {item.mappedTo && SEGMENT_DISPLAY[type]?.[item.mappedTo] && (
              <span className="taxonomy-tag">{SEGMENT_DISPLAY[type][item.mappedTo].title}</span>
            )}
            <span className={`freq freq-${item.frequency?.toLowerCase() || 'medium'}`}>{item.frequency}</span>
          </div>
          <div className="evidence">{item.evidence}</div>
          {type === 'personas' && item.connection && (
            <div className="connection">Connection: {item.connection}</div>
          )}

          {/* Progressive disclosure */}
          {!item.kept ? (
            <div className="keep-remove-btns">
              <span className="level-label">Keep or remove?</span>
              <div className="keep-remove-row">
                <button className="keep-btn" onClick={() => handleKeepItem(type, index)}>Keep</button>
                <button className="remove-btn-inline" onClick={() => handleRemoveItem(type, index)}>Remove</button>
              </div>
            </div>
          ) : (
            <>
              <div className="level-section">
                <span className="level-label">{config.levelLabel}</span>
                <div className="level-btns">
                  {LEVEL_OPTIONS[type].map(opt => (
                    <button
                      key={opt.value}
                      className={item.userLevel === opt.value ? 'selected' : ''}
                      onClick={() => handleLevelChange(type, index, opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {item.userLevel && (
                  <p className="level-desc">{LEVEL_OPTIONS[type].find(o => o.value === item.userLevel)?.description}</p>
                )}
              </div>

              {/* Star prompt — only after level selected */}
              {item.userLevel && (
                <div className="star-prompt">
                  {isStarred ? (
                    <button className="star-prompt-btn starred" onClick={() => handleToggleStar(type, index)}>
                      ★ Favourite
                    </button>
                  ) : starredSet.size < 3 ? (
                    <button className="star-prompt-btn" onClick={() => handleToggleStar(type, index)}>
                      ☆ Mark as favourite?
                    </button>
                  ) : null}
                </div>
              )}

              <button className="remove-btn-small" onClick={() => handleRemoveItem(type, index)}>Remove</button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Validation helpers for review sub-pages
  const getReviewValidation = (type) => {
    const items = mappedData?.[type] || []
    const starredSet = type === 'skills' ? starredSkills : type === 'problems' ? starredProblems : starredPersonas
    const undecidedCount = items.filter(item => !item.kept && !item.removed).length
    const keptWithLevel = items.filter(item => item.kept && !item.removed && item.userLevel).length
    return { undecidedCount, keptWithLevel, canProceed: undecidedCount === 0 && keptWithLevel >= 1, starredCount: starredSet.size }
  }

  return (
    <div className="mind-space">
      <header className="mind-space-header">
        <h1>Mind Space</h1>
        <p className="subtitle">Extract your patterns from AI conversations</p>

        {step <= 3 && (
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
            <div className={`step ${step === 3 ? 'active' : ''} ${step === 3 && reviewCategory === 0 ? 'current' : ''}`}>
              <span className="step-num">3</span>
              <span className="step-label">Skills</span>
            </div>
            <div className="step-line" />
            <div className={`step ${step === 3 && reviewCategory >= 1 ? 'active' : ''} ${step === 3 && reviewCategory === 1 ? 'current' : ''}`}>
              <span className="step-num">4</span>
              <span className="step-label">Problems</span>
            </div>
            <div className="step-line" />
            <div className={`step ${step === 3 && reviewCategory >= 2 ? 'active' : ''} ${step === 3 && reviewCategory === 2 ? 'current' : ''}`}>
              <span className="step-num">5</span>
              <span className="step-label">People</span>
            </div>
          </div>
        )}
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

      {/* Step 3a: Review Skills */}
      {step === 3 && reviewCategory === 0 && mappedData && (() => {
        const v = getReviewValidation('skills')
        return (
          <div className="step-content review-step">
            <div className="card">
              <h2>Review Your Skills</h2>
              <p>Keep or remove each skill, then pick your level.</p>

              {parsedData.northStar && (
                <div className="north-star">
                  <span className="north-star-label">Your North Star</span>
                  <p>"{parsedData.northStar}"</p>
                </div>
              )}

              <section className="review-section">
                <h3>Skills <span className="count">({mappedData.skills.length})</span>
                  {v.starredCount > 0 && <span className="star-count fulfilled">★ {v.starredCount}/3</span>}
                </h3>

                {mappedData.skills.map((skill, i) => renderReviewItem('skills', skill, i, starredSkills, REVIEW_CONFIGS.skills))}

                <AddCustomInput type="skills" onAdd={handleAddCustomItem} placeholder="Add your own skill..." />
              </section>

              {v.undecidedCount > 0 && (
                <div className="undecided-notice">
                  {v.undecidedCount} item{v.undecidedCount > 1 ? 's' : ''} remaining — keep or remove each to continue
                </div>
              )}

              <div className="button-row">
                <button className="primary-button" onClick={() => setReviewCategory(1)} disabled={!v.canProceed}>
                  Next: Problems
                </button>
                <button className="secondary-button" onClick={() => setStep(2)}>← Back</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Step 3b: Review Problems */}
      {step === 3 && reviewCategory === 1 && mappedData && (() => {
        const v = getReviewValidation('problems')
        return (
          <div className="step-content review-step">
            <div className="card">
              <h2>Review Your Problems</h2>
              <p>These are the problems you naturally solve.</p>

              <section className="review-section">
                <h3>Problems <span className="count">({mappedData.problems.length})</span>
                  {v.starredCount > 0 && <span className="star-count fulfilled">★ {v.starredCount}/3</span>}
                </h3>

                {mappedData.problems.map((problem, i) => renderReviewItem('problems', problem, i, starredProblems, REVIEW_CONFIGS.problems))}

                <AddCustomInput type="problems" onAdd={handleAddCustomItem} placeholder="Add your own problem..." />
              </section>

              {v.undecidedCount > 0 && (
                <div className="undecided-notice">
                  {v.undecidedCount} item{v.undecidedCount > 1 ? 's' : ''} remaining — keep or remove each to continue
                </div>
              )}

              <div className="button-row">
                <button className="primary-button" onClick={() => setReviewCategory(2)} disabled={!v.canProceed}>
                  Next: People
                </button>
                <button className="secondary-button" onClick={() => setReviewCategory(0)}>← Back</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Step 3c: Review Personas */}
      {step === 3 && reviewCategory === 2 && mappedData && (() => {
        const v = getReviewValidation('personas')
        return (
          <div className="step-content review-step">
            <div className="card">
              <h2>Review Your People</h2>
              <p>The people you're meant to help.</p>

              <section className="review-section">
                <h3>People <span className="count">({mappedData.personas.length})</span>
                  {v.starredCount > 0 && <span className="star-count fulfilled">★ {v.starredCount}/3</span>}
                </h3>

                {mappedData.personas.map((persona, i) => renderReviewItem('personas', persona, i, starredPersonas, REVIEW_CONFIGS.personas))}

                <AddCustomInput type="personas" onAdd={handleAddCustomItem} placeholder="Add your own persona..." />
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

              {v.undecidedCount > 0 && (
                <div className="undecided-notice">
                  {v.undecidedCount} item{v.undecidedCount > 1 ? 's' : ''} remaining — keep or remove each to continue
                </div>
              )}

              <div className="button-row">
                <button
                  className="primary-button"
                  onClick={handleConfirm}
                  disabled={isProcessing || !v.canProceed}
                >
                  {isProcessing ? 'Saving...' : 'Confirm & Continue'}
                </button>
                <button className="secondary-button" onClick={() => setReviewCategory(1)}>← Back</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Step 4: Ambition Question */}
      {step === 4 && (
        <div className="step-content">
          <div className="card">
            <h2>What do you want to do with these discoveries?</h2>
            <p>This helps us tailor your experience.</p>

            <div className="next-options" style={{ marginTop: '24px' }}>
              <button className="option-btn" onClick={async () => {
                setAmbition('find_job')
                await supabase.from('user_stage_progress')
                  .upsert({ user_id: user.id, ambition: 'find_job' }, { onConflict: 'user_id' })
                setStep(6)
              }}>
                <span className="option-icon">🎯</span>
                <span className="option-text">
                  <strong>Help me find an aligned career</strong>
                  <span>Support the pursuit of your dream role</span>
                </span>
              </button>

              <button className="option-btn" onClick={async () => {
                setAmbition('build_own')
                await supabase.from('user_stage_progress')
                  .upsert({ user_id: user.id, ambition: 'build_own' }, { onConflict: 'user_id' })
                setStep(5)
              }}>
                <span className="option-icon">🚀</span>
                <span className="option-text">
                  <strong>Build something of my own</strong>
                  <span>Turn your skills into a business or side project</span>
                </span>
              </button>

              <button className="option-btn" onClick={async () => {
                setAmbition('exploring')
                await supabase.from('user_stage_progress')
                  .upsert({ user_id: user.id, ambition: 'exploring' }, { onConflict: 'user_id' })
                setStep(6)
              }}>
                <span className="option-icon">🌱</span>
                <span className="option-text">
                  <strong>I'm still exploring</strong>
                  <span>Keep discovering — no pressure to decide yet</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Existing Business Question (build_own only) */}
      {step === 5 && ambition === 'build_own' && (
        <div className="step-content">
          <div className="card">
            <h2>Do you already have something?</h2>
            <p>We'll tailor the next steps based on where you are.</p>

            <div className="next-options" style={{ marginTop: '24px' }}>
              <button className="option-btn" onClick={async () => {
                setHasExistingBiz(true)
                await supabase.from('user_stage_progress')
                  .upsert({ user_id: user.id, has_existing_business: true }, { onConflict: 'user_id' })
                setStep(6)
              }}>
                <span className="option-icon">🏢</span>
                <span className="option-text">
                  <strong>Yes, I have an existing business</strong>
                  <span>Let's connect it with your discoveries</span>
                </span>
              </button>

              <button className="option-btn" onClick={async () => {
                setHasExistingBiz(false)
                await supabase.from('user_stage_progress')
                  .upsert({ user_id: user.id, has_existing_business: false }, { onConflict: 'user_id' })
                setStep(6)
              }}>
                <span className="option-icon">✨</span>
                <span className="option-text">
                  <strong>No, starting fresh</strong>
                  <span>We'll help you build from your strengths</span>
                </span>
              </button>
            </div>

            <button
              className="secondary-button"
              style={{ marginTop: '16px' }}
              onClick={() => setStep(4)}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Alignment Sliders (all paths, default "No alignment") */}
      {step === 6 && mappedData && (() => {
        const NO_ALIGNMENT = { name: 'No alignment', id: 'none' }
        const starredSkillItems = mappedData.skills.filter((_, i) => starredSkills.has(i))
        const starredProblemItems = mappedData.problems.filter((_, i) => starredProblems.has(i))
        const starredPersonaItems = mappedData.personas.filter((_, i) => starredPersonas.has(i))

        // Prepend "No alignment" to each slider array
        const sliderSkills = [NO_ALIGNMENT, ...starredSkillItems]
        const sliderProblems = [NO_ALIGNMENT, ...starredProblemItems]
        const sliderPersonas = [NO_ALIGNMENT, ...starredPersonaItems]

        // Build combo from current slider positions (index 0 = "No alignment" → null)
        const currentCombo = {
          skill: currentSkillIdx === 0 ? null : starredSkillItems[currentSkillIdx - 1],
          problem: currentProblemIdx === 0 ? null : starredProblemItems[currentProblemIdx - 1],
          persona: currentPersonaIdx === 0 ? null : starredPersonaItems[currentPersonaIdx - 1]
        }

        const isBuildOwn = ambition === 'build_own'
        const clusterType = isBuildOwn ? 'primary_combination' : 'current_alignment'

        // Heading varies by path
        const heading = isBuildOwn
          ? (hasExistingBiz ? 'Which areas align with your current business?' : 'Which areas excite you most?')
          : 'Does your current role align with any of these areas?'

        const handleSliderConfirm = async () => {
          if (combinationSaving) return
          setCombinationSaving(true)
          try {
            const saved = await saveCombination(currentCombo, sessionIdRef.current, clusterType)
            if (!saved) {
              setError('Failed to save your selection. Please try again.')
              setCombinationSaving(false)
              return
            }

            // Update project name if build_own and user provided one
            if (isBuildOwn && projectName.trim() && projectIdRef.current) {
              const { error: nameError } = await supabase
                .from('user_projects')
                .update({ name: projectName.trim() })
                .eq('id', projectIdRef.current)
              if (nameError) {
                console.error('Failed to update project name:', nameError)
              }
            }

            // Route to next step
            if (isBuildOwn && hasExistingBiz) {
              setStep(7) // Stage selection
            } else {
              setStep(8) // Completion
            }
          } catch (err) {
            console.error('Error saving selection:', err)
            setError('Failed to save. Please try again.')
          } finally {
            setCombinationSaving(false)
          }
        }

        return (
          <div className="step-content">
            <div className="card combination-step">
              <h2>{heading}</h2>
              <p>Slide through your top picks. Leave on "No alignment" for areas that don't apply.</p>

              <div className="combo-sliders">
                {/* Skill slider */}
                <div className="combo-slider-section">
                  <h3 className="combo-slider-label">Your skill:</h3>
                  <div className="combo-slider-controls">
                    <button
                      className="combo-slider-arrow"
                      onClick={() => setCurrentSkillIdx(i => Math.max(0, i - 1))}
                      disabled={currentSkillIdx === 0}
                    >‹</button>
                    <div className="combo-slider-content">
                      <p className={`combo-slider-text ${sliderSkills[currentSkillIdx]?.id === 'none' ? 'no-alignment' : ''}`}>
                        {sliderSkills[currentSkillIdx]?.name}
                      </p>
                      <p className="combo-slider-counter">{currentSkillIdx + 1} of {sliderSkills.length}</p>
                    </div>
                    <button
                      className="combo-slider-arrow"
                      onClick={() => setCurrentSkillIdx(i => Math.min(sliderSkills.length - 1, i + 1))}
                      disabled={currentSkillIdx === sliderSkills.length - 1}
                    >›</button>
                  </div>
                </div>

                {/* Problem slider */}
                <div className="combo-slider-section">
                  <h3 className="combo-slider-label">The problem you solve:</h3>
                  <div className="combo-slider-controls">
                    <button
                      className="combo-slider-arrow"
                      onClick={() => setCurrentProblemIdx(i => Math.max(0, i - 1))}
                      disabled={currentProblemIdx === 0}
                    >‹</button>
                    <div className="combo-slider-content">
                      <p className={`combo-slider-text ${sliderProblems[currentProblemIdx]?.id === 'none' ? 'no-alignment' : ''}`}>
                        {sliderProblems[currentProblemIdx]?.name}
                      </p>
                      <p className="combo-slider-counter">{currentProblemIdx + 1} of {sliderProblems.length}</p>
                    </div>
                    <button
                      className="combo-slider-arrow"
                      onClick={() => setCurrentProblemIdx(i => Math.min(sliderProblems.length - 1, i + 1))}
                      disabled={currentProblemIdx === sliderProblems.length - 1}
                    >›</button>
                  </div>
                </div>

                {/* Persona slider */}
                <div className="combo-slider-section">
                  <h3 className="combo-slider-label">Who you help:</h3>
                  <div className="combo-slider-controls">
                    <button
                      className="combo-slider-arrow"
                      onClick={() => setCurrentPersonaIdx(i => Math.max(0, i - 1))}
                      disabled={currentPersonaIdx === 0}
                    >‹</button>
                    <div className="combo-slider-content">
                      <p className={`combo-slider-text ${sliderPersonas[currentPersonaIdx]?.id === 'none' ? 'no-alignment' : ''}`}>
                        {sliderPersonas[currentPersonaIdx]?.name}
                      </p>
                      <p className="combo-slider-counter">{currentPersonaIdx + 1} of {sliderPersonas.length}</p>
                    </div>
                    <button
                      className="combo-slider-arrow"
                      onClick={() => setCurrentPersonaIdx(i => Math.min(sliderPersonas.length - 1, i + 1))}
                      disabled={currentPersonaIdx === sliderPersonas.length - 1}
                    >›</button>
                  </div>
                </div>
              </div>

              {/* Project name field — only for build_own */}
              {isBuildOwn && (
                <div className="project-name-field">
                  <label htmlFor="project-name">Name your project</label>
                  <input
                    id="project-name"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. My Coaching Business"
                    maxLength={100}
                  />
                </div>
              )}

              <div className="button-row">
                <button
                  className="primary-button"
                  onClick={handleSliderConfirm}
                  disabled={combinationSaving || (isBuildOwn && !projectName.trim())}
                >
                  {combinationSaving ? 'Saving...' : 'Continue'}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setStep(isBuildOwn ? 5 : 4)}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Step 7: Stage Selection (build_own + existing business only) */}
      {step === 7 && ambition === 'build_own' && hasExistingBiz && (
        <div className="step-content">
          <div className="card">
            <h2>Where are you at with your business?</h2>
            <p>This helps us recommend the right quests for your stage.</p>

            <div className="next-options" style={{ marginTop: '24px' }}>
              {STAGE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={`option-btn ${selectedStage?.value === option.value ? 'selected' : ''}`}
                  onClick={() => setSelectedStage(option)}
                  style={{
                    borderColor: selectedStage?.value === option.value ? '#E9A23B' : undefined,
                    background: selectedStage?.value === option.value ? 'rgba(233, 162, 59, 0.1)' : undefined
                  }}
                >
                  <span className="option-text">
                    <strong>{option.label}</strong>
                  </span>
                </button>
              ))}
            </div>

            <div className="button-row" style={{ marginTop: '24px' }}>
              <button
                className="primary-button"
                onClick={async () => {
                  if (!selectedStage) return
                  if (projectIdRef.current) {
                    const { error } = await supabase.from('user_projects')
                      .update({ current_stage: selectedStage.stage })
                      .eq('id', projectIdRef.current)
                    if (error) console.error('Failed to update stage:', error)
                  }
                  setStep(8)
                }}
                disabled={!selectedStage}
              >
                Continue
              </button>
              <button className="secondary-button" onClick={() => setStep(6)}>Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 8: What's Next / Results View (Completion) */}
      {step === 8 && (
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
                  onClick={() => navigate('/me')}
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
                    setSelectedCombination(null)
                    setLastSessionId(null)
                    setAmbition(null)
                    setHasExistingBiz(null)
                    setSelectedStage(null)
                    setCurrentSkillIdx(0)
                    setCurrentProblemIdx(0)
                    setCurrentPersonaIdx(0)
                    sessionIdRef.current = null
                    projectIdRef.current = null
                    navigate('/mind-space', { replace: true })
                  }}
                >
                  Retake Flow
                </button>
              </div>
            ) : (
              <>
                <div className="next-question">
                  <h3>{hasVisitedMe ? 'Does this capture everything?' : 'Extraction Complete!'}</h3>
                  <p>{hasVisitedMe ? 'You can go deeper on any area, or proceed to validation.' : 'Your skills, problems, and people have been saved. Head to your home base to see your full journey.'}</p>
                </div>

                <div className="next-options">
                  <button className="option-btn" onClick={() => handleNextChoice('skills')}>
                    <span className="option-icon">💡</span>
                    <span className="option-text">
                      <strong>I want to dig deeper</strong>
                      <span>Explore more in Play-List Finder</span>
                    </span>
                  </button>

                  <button className="option-btn primary" onClick={() => handleNextChoice('done')}>
                    <span className="option-icon">✅</span>
                    <span className="option-text">
                      <strong>Looks good!</strong>
                      <span>These capture what I love doing</span>
                    </span>
                  </button>
                </div>

                <FlowFeedback flowType="mind_space" userId={user?.id} />

                {hasVisitedMe && (
                  <button
                    className="primary-button complete-btn"
                    onClick={() => navigate('/me')}
                  >
                    Complete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
