import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import { FlowFeedback } from '../components/FlowFeedback'
import { onNervousSystemComplete } from '../lib/brain/autoPopulate'
import './NervousSystemHealingCompass.css'
import './FlowFinder.css'

export default function NervousSystemFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [currentScreen, setCurrentScreen] = useState('time_check')
  const [viewingResults, setViewingResults] = useState(false)
  const [responses, setResponses] = useState({
    visibility_action: '',      // Scary visible action text (e.g. "Go live on camera")
    visibility_layer: '',       // Which layer: screen/live/money/vulnerable/authority/custom
    deal_amount: '',            // Breakthrough deal amount (e.g. "$5,000")
    positive_change: '',
    struggle_area: '',
    calibration_complete: false,
    yes_direction: '',
    no_direction: '',
    // Triage test responses
    test1_visibility_safe: null, // YES/NO — simple check on visibility action
    test2_initial: null, // YES/NO for initial deal amount
    test2_refinements: [], // Array of {amount, response} for binary search
    test3_safe_pursuing: null, // YES/NO
    test4_self_sabotage: null, // YES/NO
    test5_feels_unsafe: null, // YES/NO
    // Contract testing
    contracts_tested: {}, // { contract: 'yes'/'no' }
    // Final calculated edges
    earning_edge: null
  })
  const [safetyContracts, setSafetyContracts] = useState([])
  const [currentContractIndex, setCurrentContractIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reflection, setReflection] = useState(null)
  const [showCalibrationVideo, setShowCalibrationVideo] = useState(false)
  const [showCustomVisibility, setShowCustomVisibility] = useState(false)
  const [customVisibilityText, setCustomVisibilityText] = useState('')

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('nervous-system', user?.id)

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        const { data, error } = await supabase
          .from('nervous_system_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          const saved = data[0]

          // Populate responses state
          setResponses(prev => ({
            ...prev,
            visibility_action: saved.impact_goal || '',
            deal_amount: saved.income_goal || '',
            positive_change: saved.positive_change || '',
            struggle_area: saved.current_struggle || '',
            earning_edge: saved.earning_edge,
            contracts_tested: saved.belief_test_results || {}
          }))

          // Populate reflection state
          if (saved.archetype) {
            setReflection({
              archetype_name: saved.archetype,
              archetype_description: saved.archetype_description || '',
              safety_edges_summary: saved.safety_edges_summary || '',
              core_fear: saved.core_fear || saved.safety_contracts?.[0] || '',
              fear_interpretation: saved.fear_interpretation || '',
              rewiring_needed: saved.rewiring_needed || '',
              full_reflection: saved.reflection_text
            })
          }

          setViewingResults(true)
          setCurrentScreen('mirror-reflection')
        }
      } catch (err) {
        console.error('Error loading saved results:', err)
      }
    }
    loadSavedResults()
  }, [searchParams, user])

  // Check for saved progress on mount (auto-save)
  useEffect(() => {
    if (user && searchParams.get('results') !== 'true') {
      const saved = loadProgress()
      if (saved && saved.currentScreen && saved.currentScreen !== 'time_check' && saved.currentScreen !== 'success') {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, loadProgress, searchParams])

  // Note: Removed auto-register useEffect that was causing duplicate quest completions
  // Quest completion now only happens once when flow is completed

  // Auto-save progress on state changes
  useEffect(() => {
    if (!user || currentScreen === 'time_check' || currentScreen === 'success' || currentScreen === 'processing' || currentScreen === 'mirror-reflection') return
    const progressData = { currentScreen, responses }
    saveProgress(progressData)
  }, [currentScreen, responses, user, saveProgress])

  // Binary search state for Test 2 (deal amount)
  const [test2CurrentAmount, setTest2CurrentAmount] = useState(null)
  const [test2Iteration, setTest2Iteration] = useState(0)
  const [test2LastYes, setTest2LastYes] = useState(0)
  const [test2LastNo, setTest2LastNo] = useState(null)

  const totalScreens = 21 // Total number of progress dots
  const currentScreenIndex = getScreenIndex(currentScreen)

  // Go back handler
  const goBack = (fromScreen) => {
    const screenOrder = [
      'time_check', 'journey', 'welcome', 'q1', 'q2', 'q3', 'q4', 'subconscious-power', 'calibration', 'calibration-directions'
    ]
    const currentIndex = screenOrder.indexOf(fromScreen)
    if (currentIndex > 0) {
      setCurrentScreen(screenOrder[currentIndex - 1])
    }
  }

  // Handle resuming saved progress (auto-save)
  const handleResumeProgress = () => {
    if (savedProgressData) {
      setCurrentScreen(savedProgressData.currentScreen)
      if (savedProgressData.responses) {
        setResponses(savedProgressData.responses)
      }
    }
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }

  // Handle starting fresh (auto-save)
  const handleStartFresh = () => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
    setCurrentScreen('journey')
  }

  // Back button component
  const BackButton = ({ fromScreen }) => (
    <button
      className="ns-hc-back-button"
      onClick={() => goBack(fromScreen)}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '4px 0 2px 0',
        marginTop: '16px',
        marginBottom: '0',
        display: 'block',
        width: '100%',
        textAlign: 'center'
      }}
    >
      ← Go Back
    </button>
  )

  function getScreenIndex(screen) {
    const screenMap = {
      'time_check': 0,
      'journey': 0,
      'welcome': 0,
      'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4,
      'subconscious-power': 5,
      'calibration': 6,
      'calibration-directions': 7,
      'triage-intro': 8,
      'test1-initial': 9,
      'test2-initial': 10,
      'test2-refine': 11,
      'test3': 12,
      'test4': 13,
      'test5': 14,
      'contracts-intro': 15,
      'contracts-test': 16,
      'mirror-intro': 17,
      'mirror-processing': 18,
      'mirror-reflection': 19,
      'success': 20
    }
    return screenMap[screen] || 0
  }

  // Generate safety contracts based on triage results
  const generateSafetyContracts = () => {
    const contracts = []

    // Core contracts based on triage results
    if (responses.test3_safe_pursuing === 'no') {
      contracts.push("If I pursue my ambitions, I'll lose the people I care about")
      contracts.push("If I'm too successful, I'll be rejected or abandoned")
    }

    if (responses.test4_self_sabotage === 'yes') {
      contracts.push("The higher I climb, the harder I'll fall")
      contracts.push("If I reach my goals, they'll discover I'm a fraud")
    }

    if (responses.test5_feels_unsafe === 'yes') {
      contracts.push("If I'm visible, I'll be judged and criticized")
      contracts.push("If I have money, it will corrupt me or change who I am")
    }

    // Always add common contracts to ensure we have 5-7
    contracts.push("If I outgrow my current life, I'll lose my identity")
    contracts.push("If I become too successful, I won't be relatable anymore")
    contracts.push("If I charge what I'm worth, people will think I'm greedy")
    contracts.push("If I shine too bright, I'll make others feel bad about themselves")
    contracts.push("If I'm fully seen, people will discover I'm not enough")

    // Return 5-7 contracts (remove duplicates and limit)
    const uniqueContracts = [...new Set(contracts)]
    return uniqueContracts.slice(0, 7)
  }

  // Test 1 — simple YES/NO on visibility action (no binary search)
  const handleTest1Response = (response) => {
    setResponses(prev => ({ ...prev, test1_visibility_safe: response }))
    setCurrentScreen('test2-initial')
  }

  // Binary search for Test 2 (deal amount edge)
  const handleTest2Response = (response) => {
    const goalNumber = parseInt(responses.deal_amount.replace(/[^0-9]/g, ''))

    if (currentScreen === 'test2-initial') {
      if (response === 'no') {
        // Start binary search downward
        const halfAmount = Math.floor(goalNumber / 2)
        setTest2CurrentAmount(halfAmount)
        setTest2LastNo(goalNumber)
        setTest2Iteration(1)
        setResponses(prev => ({
          ...prev,
          test2_initial: 'no',
          test2_refinements: [{ amount: halfAmount, response: null }]
        }))
        setCurrentScreen('test2-refine')
      } else {
        // They feel safe at their income goal, double it to find the upper limit
        const doubledAmount = goalNumber * 2
        setTest2CurrentAmount(doubledAmount)
        setTest2LastYes(goalNumber)
        setTest2Iteration(1)
        setResponses(prev => ({
          ...prev,
          test2_initial: 'yes',
          test2_refinements: [{ amount: doubledAmount, response: null }]
        }))
        setCurrentScreen('test2-refine')
      }
    } else if (currentScreen === 'test2-refine') {
      const newRefinements = [...responses.test2_refinements]
      newRefinements[newRefinements.length - 1].response = response

      if (response === 'yes') {
        setTest2LastYes(test2CurrentAmount)
      } else {
        setTest2LastNo(test2CurrentAmount)
      }

      if (test2Iteration >= 3 || (test2LastNo && test2LastYes && test2LastNo - test2LastYes <= goalNumber * 0.1)) {
        const edge = test2LastYes
        setResponses(prev => ({
          ...prev,
          test2_refinements: newRefinements,
          earning_edge: edge
        }))
        setCurrentScreen('test3')
      } else {
        let nextAmount
        if (response === 'yes' && test2LastNo) {
          nextAmount = Math.floor((test2CurrentAmount + test2LastNo) / 2)
        } else if (response === 'no') {
          nextAmount = Math.floor((test2LastYes + test2CurrentAmount) / 2)
        } else {
          nextAmount = test2CurrentAmount * 2
        }

        setTest2CurrentAmount(nextAmount)
        setTest2Iteration(test2Iteration + 1)
        newRefinements.push({ amount: nextAmount, response: null })
        setResponses(prev => ({
          ...prev,
          test2_refinements: newRefinements
        }))
      }
    }
  }

  // Handle contract testing
  const handleContractResponse = (response) => {
    const currentContract = safetyContracts[currentContractIndex]
    const newContractsTested = {
      ...responses.contracts_tested,
      [currentContract]: response
    }

    setResponses(prev => ({
      ...prev,
      contracts_tested: newContractsTested
    }))

    if (currentContractIndex < safetyContracts.length - 1) {
      setCurrentContractIndex(currentContractIndex + 1)
    } else {
      // All contracts tested, move to mirror
      setCurrentScreen('mirror-intro')
    }
  }

  // Generate AI mirror reflection
  const generateMirrorReflection = async () => {
    setIsProcessing(true)
    setCurrentScreen('mirror-processing')

    try {
      // Validate required data
      console.log('🔍 Checking edge data:', {
        visibility_action: responses.visibility_action,
        test1_visibility_safe: responses.test1_visibility_safe,
        earning_edge: responses.earning_edge,
        all_responses: responses
      })

      if (!responses.visibility_action || !responses.earning_edge) {
        const errorMsg = `Missing nervous system edge data. visibility_action=${responses.visibility_action}, earning_edge=${responses.earning_edge}`
        console.error('❌ Validation failed:', errorMsg)
        throw new Error(errorMsg)
      }

      const requestBody = {
        impact_goal: responses.visibility_action,
        nervous_system_impact_limit: `${responses.test1_visibility_safe === 'yes' ? 'Feels safe' : 'Does NOT feel safe'} — "${responses.visibility_action}"`,
        income_goal: responses.deal_amount,
        nervous_system_income_limit: `$${responses.earning_edge.toLocaleString()} per deal`,
        positive_change: responses.positive_change,
        struggle_area: responses.struggle_area,
        triage_safe_pursuing: responses.test3_safe_pursuing,
        triage_self_sabotage: responses.test4_self_sabotage,
        triage_feels_unsafe: responses.test5_feels_unsafe,
        belief_test_results: responses.contracts_tested
      }

      console.log('🤖 Sending to nervous-system-mirror:', requestBody)

      const { data, error } = await supabase.functions.invoke('nervous-system-mirror', {
        body: requestBody
      })

      console.log('📥 Edge function response:', { data, error })

      if (error) {
        console.error('Edge function error:', error)
        // Try to get more details from the error
        const errorDetails = data?.error || error.message || 'Unknown error'
        const additionalDetails = data?.details ? `\n\nDetails: ${data.details}` : ''
        throw new Error(`${errorDetails}${additionalDetails}`)
      }

      if (!data) {
        console.error('No data in response')
        throw new Error('No data received from edge function')
      }

      if (data.error) {
        console.error('Error in response data:', data.error, data.details)
        throw new Error(`${data.error}\n\nDetails: ${data.details || 'No additional details'}`)
      }

      if (!data.reflection) {
        console.error('Invalid response data:', data)
        throw new Error('No reflection data received')
      }

      setReflection(data.reflection)
      setCurrentScreen('mirror-reflection')
    } catch (err) {
      console.error('Error generating reflection:', err)
      alert(`Error generating reflection: ${err.message || 'Please try again.'}`)
      setCurrentScreen('mirror-intro')
    } finally {
      setIsProcessing(false)
    }
  }

  // Save to database and complete flow
  const completeFlow = async () => {
    try {
      // Validate required data
      if (!responses.visibility_action || !responses.earning_edge) {
        throw new Error('Missing nervous system edge data. Please complete the flow.')
      }

      // Extract YES contracts for Limiting Belief Rewire
      const yesContracts = Object.entries(responses.contracts_tested)
        .filter(([_, response]) => response === 'yes')
        .map(([contract]) => contract)

      const { error } = await supabase
        .from('nervous_system_responses')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.name || 'Anonymous',
          impact_goal: responses.visibility_action,
          income_goal: responses.deal_amount,
          nervous_system_impact_limit: `${responses.test1_visibility_safe === 'yes' ? 'Safe' : 'Unsafe'}: ${responses.visibility_action}`,
          nervous_system_income_limit: responses.earning_edge != null ? `$${responses.earning_edge.toLocaleString()} per deal` : null,
          positive_change: responses.positive_change,
          current_struggle: responses.struggle_area,
          belief_test_results: responses.contracts_tested,
          safety_contracts: yesContracts,
          reflection_text: reflection?.full_reflection,
          archetype: reflection?.archetype_name,
          archetype_description: reflection?.archetype_description,
          safety_edges_summary: reflection?.safety_edges_summary,
          core_fear: reflection?.core_fear,
          fear_interpretation: reflection?.fear_interpretation,
          rewiring_needed: reflection?.rewiring_needed,
          being_seen_edge: responses.test1_visibility_safe === 'yes' ? 1 : 0,
          earning_edge: responses.earning_edge
        })

      if (error) throw error

      // Auto-populate brain
      onNervousSystemComplete(user.id, {
        impactLimit: `${responses.test1_visibility_safe === 'yes' ? 'Safe' : 'Unsafe'}: ${responses.visibility_action}`,
        incomeLimit: responses.earning_edge != null ? `$${responses.earning_edge.toLocaleString()} per deal` : null,
        archetype: reflection?.archetype_name || null,
      })

      // Complete quest
      await completeFlowQuest({
        userId: user.id,
        flowId: 'nervous_system',
        pointsEarned: 6
      })

      // Clear auto-saved progress on success
      clearProgress()

      setCurrentScreen('success')
    } catch (err) {
      console.error('Error saving data:', err)
      alert('Error saving data. Please try again.')
    }
  }

  // Format money nicely
  const formatMoney = (num) => num >= 1000000 ? `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M` : num >= 1000 ? `$${(num / 1000).toFixed(0)}K` : `$${num}`

  // Parse markdown bold/italic to HTML
  const parseMarkdown = (text) => {
    if (!text) return ''
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fbbf24">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color:#fbbf24">$1</em>')
      .replace(/\n/g, '<br/>')
  }

  // Render functions for each screen
  const renderTimeCheck = () => {
    // Helper to get readable screen name
    const getScreenDisplayName = (screen) => {
      const screenNames = {
        'journey': 'Journey Overview',
        'welcome': 'Welcome',
        'q1': 'Question 1',
        'q2': 'Question 2',
        'q3': 'Question 3',
        'q4': 'Question 4',
        'subconscious-power': 'Subconscious Power',
        'calibration': 'Calibration',
        'calibration-directions': 'Calibration Directions',
        'triage-intro': 'Triage Intro',
        'test1-initial': 'Test 1',
        'test2-initial': 'Test 2',
        'test3': 'Test 3',
        'test4': 'Test 4',
        'test5': 'Test 5',
        'contracts-intro': 'Contracts Intro',
        'contracts-test': 'Contracts Test',
        'mirror-intro': 'Mirror Intro'
      }
      return screenNames[screen] || screen
    }

    // Helper to get time since last save
    const getTimeSinceSave = () => {
      if (!savedProgressData?.savedAt) return null
      const minutesAgo = Math.floor((Date.now() - savedProgressData.savedAt) / 60000)
      if (minutesAgo < 1) return 'just now'
      if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
      const hoursAgo = Math.floor(minutesAgo / 60)
      return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
    }

    return (
      <div className="container welcome-container">
        <h1 className="welcome-greeting">Nervous System Map</h1>

        {/* Resume Prompt - shown if saved progress exists */}
        {showResumePrompt && savedProgressData && (
          <div className="ns-hc-resume-prompt">
            <p className="ns-hc-resume-title">Welcome back!</p>
            <p className="ns-hc-resume-info">
              You have saved progress at <strong>{getScreenDisplayName(savedProgressData.currentScreen)}</strong>
              <br />
              <span className="ns-hc-resume-time">Last saved {getTimeSinceSave()}</span>
            </p>
            <div className="ns-hc-resume-actions">
              <button className="ns-hc-primary-button" style={{ margin: 0, maxWidth: '280px' }} onClick={handleResumeProgress}>
                Continue Where I Left Off
              </button>
              <button className="ns-hc-secondary-button" style={{ margin: '12px 0 0 0', maxWidth: '280px' }} onClick={handleStartFresh}>
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Normal time check content - shown if no resume prompt */}
        {!showResumePrompt && (
          <>
            <div className="welcome-message" style={{ textAlign: 'center' }}>
              <p><span className="time-icon">⏱️</span></p>
              <p><strong>This flow takes about 5-10 minutes</strong></p>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>4 questions to map your nervous system boundaries.</p>
              <p>Find a quiet moment where you can be honest with yourself.</p>
              <p><strong>Your insights will be more valuable when you're present.</strong></p>
            </div>

            <button className="primary-button glow-button" onClick={() => setCurrentScreen('journey')}>
              I've Got Time, Let's Go
            </button>
            <button
              className="primary-button"
              onClick={() => navigate(-1)}
              style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none', marginTop: '12px' }}
            >
              Come Back Later
            </button>
          </>
        )}
      </div>
    )
  }

  const renderJourney = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Where This Fits</h1>
      <div className="welcome-message animated-text">
        <p><strong>In the Vibe Rise journey...</strong></p>
        <p className="highlight-box">
          <span className="highlight-word">Flow Finder</span> helps you discover <em>what</em> you're meant to build.<br /><br />
          <span className="highlight-word">Nervous System Map</span> reveals <em>why</em> you might be holding yourself back from building it.
        </p>
        <p>This flow uncovers the invisible boundaries your nervous system has created around success, visibility, and earning.</p>
        <p>Once you see them, you can expand them.</p>
      </div>

      <button className="primary-button" onClick={() => setCurrentScreen('welcome')}>
        Makes Sense!
      </button>
      <BackButton fromScreen="journey" />
    </div>
  )

  const renderWelcome = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Your Internal Boundaries</h1>
      <div className="welcome-message animated-text">
        <p><strong>Welcome, {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'}!</strong></p>
        <p>Your nervous system has a boundary around what feels 'safe'.</p>
        <p>Safe to earn. Safe to be seen. Safe to succeed.</p>
        <p>Anything beyond that boundary? <strong>It pulls you back.</strong></p>
        <p>Not because you lack capability — but because expansion feels dangerous to your system.</p>
        <p>This is why ambitious people self-sabotage. Not because they're broken. Because their nervous system is protecting them from something.</p>
        <p className="hint-text">Let's discover where your boundaries are — so you can expand them.</p>
      </div>

      <button className="primary-button glow-button" onClick={() => setCurrentScreen('q1')}>
        Let's Begin
      </button>
      <BackButton fromScreen="welcome" />
    </div>
  )

  const VISIBILITY_OPTIONS = [
    { layer: 'screen', icon: '📱', label: 'Post content with my face showing', fear: 'Being seen online' },
    { layer: 'live', icon: '⚡', label: 'Go live on camera or speak on stage', fear: 'Real-time judgment' },
    { layer: 'money', icon: '💰', label: 'Ask someone to pay me', fear: 'Am I worth it?' },
    { layer: 'vulnerable', icon: '💗', label: 'Share my real story publicly', fear: 'Rejected for real self' },
    { layer: 'authority', icon: '👑', label: 'Claim expertise in my field', fear: 'Imposter syndrome' },
  ]

  const renderQ1 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 1 of 4</div>
      <h2 className="ns-hc-question-text">What feels scariest to do right now?</h2>
      <p className="ns-hc-question-subtext">Pick the action that makes your body tense up the most</p>

      <div className="ns-hc-contract-list">
        {VISIBILITY_OPTIONS.map(opt => (
          <button
            key={opt.layer}
            className={`ns-hc-contract-option ${responses.visibility_layer === opt.layer ? 'selected' : ''}`}
            onClick={() => {
              setShowCustomVisibility(false)
              setResponses(prev => ({ ...prev, visibility_action: opt.label, visibility_layer: opt.layer }))
            }}
          >
            <span style={{ marginRight: 8 }}>{opt.icon}</span> {opt.label}
          </button>
        ))}
        <button
          className={`ns-hc-contract-option ${responses.visibility_layer === 'custom' ? 'selected' : ''}`}
          onClick={() => {
            setShowCustomVisibility(true)
            setResponses(prev => ({ ...prev, visibility_layer: 'custom', visibility_action: customVisibilityText }))
          }}
        >
          ✏️ Enter your own
        </button>
      </div>

      {showCustomVisibility && (
        <div className="ns-hc-text-input-container" style={{ marginTop: 0 }}>
          <textarea
            className="ns-hc-text-area"
            placeholder="e.g. Record a video of myself teaching, pitch to a room of investors..."
            value={customVisibilityText}
            onChange={(e) => {
              setCustomVisibilityText(e.target.value)
              setResponses(prev => ({ ...prev, visibility_action: e.target.value }))
            }}
            rows={2}
          />
        </div>
      )}

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('q2')}
          disabled={!responses.visibility_action.trim()}
          style={{ opacity: responses.visibility_action.trim() ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="q1" />
      </div>
    </div>
  )

  const renderQ2 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 2 of 4</div>
      <h2 className="ns-hc-question-text">What single deal amount would feel like a breakthrough?</h2>
      <p className="ns-hc-question-subtext">Not annual income — one sale, one client, one deal</p>

      <div className="ns-hc-horizontal-options">
        {['$500', '$1,000', '$5,000', '$10,000', '$25,000+'].map(option => (
          <button
            key={option}
            className={`ns-hc-horizontal-option ${responses.deal_amount === option ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, deal_amount: option }))}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('q3')}
          disabled={!responses.deal_amount}
          style={{ opacity: responses.deal_amount ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="q2" />
      </div>
    </div>
  )

  const renderQ3 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 3 of 4</div>
      <h2 className="ns-hc-question-text">What positive change does your ambition create for others?</h2>
      <p className="ns-hc-question-subtext">Tell us about the impact you want to have</p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Example: I help people break free from limiting beliefs and design lives they're genuinely excited about..."
          value={responses.positive_change}
          onChange={(e) => setResponses(prev => ({ ...prev, positive_change: e.target.value }))}
        />
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('q4')}
          disabled={!responses.positive_change.trim()}
          style={{ opacity: responses.positive_change.trim() ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="q3" />
      </div>
    </div>
  )

  const renderQ4 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 4 of 4</div>
      <h2 className="ns-hc-question-text">Where are you struggling most with your ambition at the moment?</h2>
      <p className="ns-hc-question-subtext">Be honest — this helps us understand your current edge</p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Example: I keep starting and stopping. I get excited, build momentum, then suddenly pull back when things start working..."
          value={responses.struggle_area}
          onChange={(e) => setResponses(prev => ({ ...prev, struggle_area: e.target.value }))}
        />
      </div>

      <div className="ns-hc-sticky-nav">
        <button
          className="ns-hc-primary-button"
          onClick={() => setCurrentScreen('subconscious-power')}
          disabled={!responses.struggle_area.trim()}
          style={{ opacity: responses.struggle_area.trim() ? 1 : 0.5 }}
        >
          Continue
        </button>
        <BackButton fromScreen="q4" />
      </div>
    </div>
  )

  const renderSubconsciousPower = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Power of Your Subconscious</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>Your <strong>conscious mind</strong> is what you're aware of right now — your thoughts, decisions, what you think you believe.</p>
        <p>But your <strong>subconscious mind</strong> runs 95% of your life. It controls your automatic patterns, emotional reactions, and deeply-held beliefs.</p>
        <p>This is why you can <em>want</em> something consciously (more clients, more visibility, more income) but still find yourself pulling back.</p>
        <p><strong>Your subconscious has veto power.</strong></p>
        <p>If it believes that success = danger, it will sabotage you every time.</p>
        <p style={{ marginTop: 24 }}>Muscle testing (the Sway Test) bypasses your conscious mind and lets us ask your <strong>nervous system</strong> directly:</p>
        <p><em>"What do you actually believe is safe?"</em></p>
        <p>This is how we find your real edges — not what you think they are, but what your body knows them to be.</p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => setCurrentScreen('calibration')}>
        Got it, let's test
      </button>
      <BackButton fromScreen="subconscious-power" />
    </div>
  )

  const renderCalibration = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Calibration</div>
      <h2 className="ns-hc-question-text">The Sway Test</h2>
      <p className="ns-hc-question-subtext">Learn how your body communicates YES and NO</p>

      <div className="ns-hc-welcome-message" style={{ marginTop: 32 }}>
        <p>The Sway Test is simple but powerful.</p>
        <p><strong>Stand up straight</strong> with your feet hip-width apart. Close your eyes if it helps you tune in.</p>
        <p>Say out loud: <strong>"Show me a YES."</strong> Notice which way your body sways—forward, back, left, or right.</p>
        <p>Say out loud: <strong>"Show me a NO."</strong> Notice the contrast.</p>
        <p>There's no right direction. Your body has its own language. Let it show you.</p>
        <p style={{ marginTop: 24 }}>If you're skeptical, that's okay. Just try it with curiosity.</p>
      </div>

      <div className="ns-hc-video-container">
        <iframe
          src="https://www.youtube.com/embed/UXO1mM26Ui0"
          allowFullScreen
          title="Sway Test Demo"
        />
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => {
          setResponses(prev => ({ ...prev, calibration_complete: true }))
          setCurrentScreen('calibration-directions')
        }}
      >
        I've Calibrated
      </button>
      <BackButton fromScreen="calibration" />
    </div>
  )

  const renderCalibrationDirections = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Calibration Complete</div>
      <h2 className="ns-hc-question-text">Let's record your body's language</h2>
      <p className="ns-hc-question-subtext">This helps you stay consistent during testing</p>

      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 16, color: 'white', fontWeight: 600 }}>
          What way was YES?
        </label>
        <div className="ns-hc-horizontal-options">
          <button
            className={`ns-hc-horizontal-option ${responses.yes_direction === 'Forward' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, yes_direction: 'Forward' }))}
          >
            Forward
          </button>
          <button
            className={`ns-hc-horizontal-option ${responses.yes_direction === 'Back' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, yes_direction: 'Back' }))}
          >
            Back
          </button>
          <button
            className={`ns-hc-horizontal-option ${responses.yes_direction === 'Left' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, yes_direction: 'Left' }))}
          >
            Left
          </button>
          <button
            className={`ns-hc-horizontal-option ${responses.yes_direction === 'Right' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, yes_direction: 'Right' }))}
          >
            Right
          </button>
        </div>
      </div>

      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 16, color: 'white', fontWeight: 600 }}>
          What way was NO?
        </label>
        <div className="ns-hc-horizontal-options">
          <button
            className={`ns-hc-horizontal-option ${responses.no_direction === 'Forward' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, no_direction: 'Forward' }))}
          >
            Forward
          </button>
          <button
            className={`ns-hc-horizontal-option ${responses.no_direction === 'Back' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, no_direction: 'Back' }))}
          >
            Back
          </button>
          <button
            className={`ns-hc-horizontal-option ${responses.no_direction === 'Left' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, no_direction: 'Left' }))}
          >
            Left
          </button>
          <button
            className={`ns-hc-horizontal-option ${responses.no_direction === 'Right' ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, no_direction: 'Right' }))}
          >
            Right
          </button>
        </div>
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('triage-intro')}
        disabled={!responses.yes_direction || !responses.no_direction}
        style={{ opacity: (responses.yes_direction && responses.no_direction) ? 1 : 0.5 }}
      >
        Continue
      </button>

      <button
        className="ns-hc-secondary-button"
        onClick={() => setCurrentScreen('calibration')}
      >
        Watch Calibration Video Again
      </button>
    </div>
  )

  const renderTriageIntro = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <h1 className="ns-hc-welcome-greeting">Let's Find Your Edge</h1>
      <div className="ns-hc-welcome-message animated-text" style={{ textAlign: 'left' }}>
        <p>Now let's see where your system feels safe — and where it contracts.</p>
        <p>I'm going to give you <strong>5 statements to test</strong> using the sway test.</p>
        <p>Say each one out loud, notice your body's response, and let me know: <strong>YES or NO?</strong></p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={() => setCurrentScreen('test1-initial')}>
          Ready
        </button>
      </div>
    </div>
  )

  const renderTest1Initial = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 1 of 5</div>
      <h2 className="ns-hc-question-text">"I feel safe to <span className="ns-hc-highlight">{(responses.visibility_action || 'take this action').toLowerCase()}</span>"</h2>
      <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

      <div className="ns-hc-horizontal-options">
        <button
          className="ns-hc-horizontal-option"
          onClick={() => handleTest1Response('yes')}
        >
          YES
        </button>
        <button
          className="ns-hc-horizontal-option"
          onClick={() => handleTest1Response('no')}
        >
          NO
        </button>
      </div>
    </div>
  )

  const renderTest2Initial = () => {
    const goalNumber = parseInt(responses.deal_amount.replace(/[^0-9]/g, ''))
    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Statement 2 of 5</div>
        <h2 className="ns-hc-question-text">"I feel safe charging someone {formatMoney(goalNumber)}"</h2>
        <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

        <div className="ns-hc-horizontal-options">
          <button
            className="ns-hc-horizontal-option"
            onClick={() => {
              setTest2CurrentAmount(goalNumber)
              handleTest2Response('yes')
            }}
          >
            YES
          </button>
          <button
            className="ns-hc-horizontal-option"
            onClick={() => {
              setTest2CurrentAmount(goalNumber)
              handleTest2Response('no')
            }}
          >
            NO
          </button>
        </div>
      </div>
    )
  }

  const renderTest2Refine = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 2 of 5 - Refining (Step {test2Iteration + 1} of 4)</div>
      <h2 className="ns-hc-question-text">"I feel safe charging someone {formatMoney(test2CurrentAmount)}"</h2>
      <p className="ns-hc-question-subtext">Testing to find your exact deal amount edge</p>

      <div className="ns-hc-horizontal-options">
        <button
          className="ns-hc-horizontal-option"
          onClick={() => handleTest2Response('yes')}
        >
          YES
        </button>
        <button
          className="ns-hc-horizontal-option"
          onClick={() => handleTest2Response('no')}
        >
          NO
        </button>
      </div>
    </div>
  )

  const renderTest3 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 3 of 5</div>
      <h2 className="ns-hc-question-text">
        "I feel safe to pursue my ambition to <span className="ns-hc-highlight">{responses.positive_change}</span>"
      </h2>
      <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

      <div className="ns-hc-horizontal-options">
        <button
          className="ns-hc-horizontal-option"
          onClick={() => {
            setResponses(prev => ({ ...prev, test3_safe_pursuing: 'yes' }))
            setCurrentScreen('test4')
          }}
        >
          YES
        </button>
        <button
          className="ns-hc-horizontal-option"
          onClick={() => {
            setResponses(prev => ({ ...prev, test3_safe_pursuing: 'no' }))
            setCurrentScreen('test4')
          }}
        >
          NO
        </button>
      </div>
    </div>
  )

  const renderTest4 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 4 of 5</div>
      <h2 className="ns-hc-question-text">
        "My struggle with <span className="ns-hc-highlight">{responses.struggle_area}</span>, I'm also subconsciously self-sabotaging"
      </h2>
      <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

      <div className="ns-hc-horizontal-options">
        <button
          className="ns-hc-horizontal-option"
          onClick={() => {
            setResponses(prev => ({ ...prev, test4_self_sabotage: 'yes' }))
            setCurrentScreen('test5')
          }}
        >
          YES
        </button>
        <button
          className="ns-hc-horizontal-option"
          onClick={() => {
            setResponses(prev => ({ ...prev, test4_self_sabotage: 'no' }))
            setCurrentScreen('test5')
          }}
        >
          NO
        </button>
      </div>
    </div>
  )

  const renderTest5 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 5 of 5</div>
      <h2 className="ns-hc-question-text">"Part of me feels unsafe with the vision of my ambitions"</h2>
      <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

      <div className="ns-hc-horizontal-options">
        <button
          className="ns-hc-horizontal-option"
          onClick={() => {
            setResponses(prev => ({ ...prev, test5_feels_unsafe: 'yes' }))
            const contracts = generateSafetyContracts()
            setSafetyContracts(contracts)
            setCurrentContractIndex(0)
            setCurrentScreen('contracts-intro')
          }}
        >
          YES
        </button>
        <button
          className="ns-hc-horizontal-option"
          onClick={() => {
            setResponses(prev => ({ ...prev, test5_feels_unsafe: 'no' }))
            const contracts = generateSafetyContracts()
            setSafetyContracts(contracts)
            setCurrentContractIndex(0)
            setCurrentScreen('contracts-intro')
          }}
        >
          NO
        </button>
      </div>
    </div>
  )

  const renderContractsIntro = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">Safety Contracts</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>Your nervous system operates on <strong>safety contracts</strong> — subconscious beliefs designed to protect you.</p>
        <p>These contracts feel true because they once <em>were</em> true. Something happened that taught your system to believe them.</p>
        <p>Now we'll test <strong>{safetyContracts.length} contracts</strong> to see which ones are still active in your system.</p>
        <p>For each one, use the sway test and notice: <strong>YES (this fear is active) or NO (not a concern)</strong>.</p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => setCurrentScreen('contracts-test')}>
        Ready to Test
      </button>
    </div>
  )

  const renderContractsTest = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Contract {currentContractIndex + 1} of {safetyContracts.length}</div>
      <h2 className="ns-hc-question-text">"{safetyContracts[currentContractIndex]}"</h2>
      <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

      <div className="ns-hc-horizontal-options">
        <button
          className="ns-hc-horizontal-option"
          onClick={() => handleContractResponse('yes')}
        >
          YES
        </button>
        <button
          className="ns-hc-horizontal-option"
          onClick={() => handleContractResponse('no')}
        >
          NO
        </button>
      </div>
    </div>
  )

  const renderMirrorIntro = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <h1 className="ns-hc-welcome-greeting">The Mirror</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>Now let's reflect back what your nervous system just revealed.</p>
        <p>This isn't judgment — it's <strong>pattern recognition</strong>.</p>
        <p>Understanding your protective pattern is the first step to expanding beyond it.</p>
      </div>

      <div className="ns-hc-sticky-nav">
        <button className="ns-hc-primary-button" onClick={generateMirrorReflection}>
          Show Me
        </button>
      </div>
    </div>
  )

  const renderMirrorProcessing = () => (
    <div className="ns-hc-container ns-hc-processing-container">
      <div className="ns-hc-spinner"></div>
      <div className="ns-hc-processing-text">Analyzing your nervous system pattern...</div>
      <p className="ns-hc-processing-subtext">Generating your personalized reflection</p>
      <p className="ns-hc-processing-subtext" style={{ marginTop: '16px', opacity: 0.7 }}>This process can take 10–15 seconds</p>
    </div>
  )

  const renderMirrorReflection = () => {
    if (!reflection) return null

    return (
      <div className="ns-hc-container ns-hc-welcome-container">
        <h1 className="ns-hc-welcome-greeting">Your Protective Pattern</h1>

        {/* Pattern Archetype */}
        <div className="ns-hc-result-box" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
          <h3 style={{ fontSize: 22 }}>🌟 {reflection.archetype_name}</h3>
          <p style={{ fontSize: 15, marginTop: 12 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(reflection.archetype_description) }} />
        </div>

        {/* Safety Zones vs Contraction Zones */}
        {reflection.safety_edges_summary && (
          <div className="ns-hc-result-box">
            <h3>🎯 Your Safety Zones vs. Contraction Zones</h3>
            <p style={{ marginTop: 12, lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(reflection.safety_edges_summary) }} />
          </div>
        )}

        {/* Current Limits */}
        <div className="ns-hc-result-box">
          <h3>📊 Your Nervous System Edges:</h3>
          <div style={{ marginTop: 12, paddingLeft: 8 }}>
            <p>{responses.test1_visibility_safe === 'yes' ? '✅' : '🚫'} <strong style={{ color: '#fbbf24' }}>{responses.visibility_action || 'Visibility action'}</strong> — {responses.test1_visibility_safe === 'yes' ? 'feels safe' : 'triggers contraction'}</p>
            {responses.earning_edge != null && (
              <p>💰 Charging up to <strong style={{ color: '#fbbf24' }}>{formatMoney(responses.earning_edge)} per deal</strong></p>
            )}
          </div>
        </div>

        {/* Core Fear */}
        <div className="ns-hc-result-box" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ color: '#fca5a5' }}>🔍 Primary Limiting Belief:</h3>
          <p style={{ marginTop: 12, fontStyle: 'italic' }}>"{reflection.core_fear}"</p>
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(reflection.fear_interpretation) }} />
        </div>

        {/* All Active Safety Contracts */}
        {(() => {
          const activeContracts = Object.entries(responses.contracts_tested)
            .filter(([_, response]) => response === 'yes')
            .map(([contract]) => contract)

          if (activeContracts.length > 1) {
            return (
              <div className="ns-hc-result-box">
                <h3>⚠️ All Active Safety Contracts:</h3>
                <p style={{ fontSize: 14, opacity: 0.7, marginTop: 8, marginBottom: 16 }}>
                  These beliefs are currently active in your nervous system:
                </p>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {activeContracts.map((contract, index) => (
                    <li key={index} style={{
                      marginBottom: 12,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: contract === reflection.core_fear ? '#fbbf24' : 'rgba(255,255,255,0.85)'
                    }}>
                      {contract}
                      {contract === reflection.core_fear && (
                        <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>← Primary</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          }
          return null
        })()}

        {/* What Needs Rewiring */}
        <div className="ns-hc-result-box" style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <h3 style={{ color: '#c4b5fd' }}>✨ What Needs Rewiring:</h3>
          <p style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(reflection.rewiring_needed) }} />
        </div>

        {/* Full Reflection Narrative */}
        {reflection.full_reflection && (
          <div className="ns-hc-result-box" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.15)' }}>
            <h3>📖 Your Complete Reflection</h3>
            <div
              style={{ marginTop: 16, lineHeight: 1.8, fontSize: 15 }}
              dangerouslySetInnerHTML={{
                __html: reflection.full_reflection
                  .replace(/^### (.+)$/gm, '<h5 style="margin:20px 0 8px;font-size:15px;color:white">$1</h5>')
                  .replace(/^## (.+)$/gm, '<h4 style="margin:24px 0 8px;font-size:17px;color:white">$1</h4>')
                  .replace(/^# (.+)$/gm, '<h3 style="margin:24px 0 8px;font-size:19px;color:white">$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fbbf24">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em style="color:#fbbf24">$1</em>')
                  .replace(/\n\n/g, '</p><p style="margin-top: 16px;">')
                  .replace(/\n/g, '<br/>')
                  .replace(/^/, '<p>')
                  .replace(/$/, '</p>')
              }}
            />
          </div>
        )}

        {viewingResults ? (
          <button className="ns-hc-primary-button" onClick={() => navigate('/7-day-challenge')}>
            ← Back to 7-Day Challenge
          </button>
        ) : (
          <button className="ns-hc-primary-button" onClick={completeFlow}>
            Continue to Results
          </button>
        )}
      </div>
    )
  }

  const renderSuccess = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">✓ Nervous System Mapped!</h1>
      <div className="ns-hc-welcome-message">
        <p>You've identified the safety contracts limiting your flow.</p>
        <p>The next step is to <strong>rewire the limiting beliefs</strong> holding you back.</p>
      </div>

      <FlowFeedback
        flowType="nervous_system"
        userId={user?.id}
      />

      <button className="ns-hc-primary-button" onClick={() => navigate('/limiting-belief-rewire')} style={{ marginTop: '24px' }}>
        Proceed to Limiting Belief Rewire
      </button>
      <button className="ns-hc-secondary-button" onClick={() => navigate('/7-day-challenge')}>
        Return to 7-Day Challenge
      </button>
    </div>
  )

  // Main render
  return (
    <div className="ns-hc-app">
      {/* Progress Dots */}
      <div className="ns-hc-progress-container">
        <div className="ns-hc-progress-dots">
          {Array.from({ length: totalScreens }).map((_, index) => (
            <div
              key={index}
              className={`ns-hc-progress-dot ${
                index < currentScreenIndex ? 'completed' :
                index === currentScreenIndex ? 'active' : ''
              }`}
            />
          ))}
        </div>
      </div>

      {/* Screen Content */}
      {currentScreen === 'time_check' && renderTimeCheck()}
      {currentScreen === 'journey' && renderJourney()}
      {currentScreen === 'welcome' && renderWelcome()}
      {currentScreen === 'q1' && renderQ1()}
      {currentScreen === 'q2' && renderQ2()}
      {currentScreen === 'q3' && renderQ3()}
      {currentScreen === 'q4' && renderQ4()}
      {currentScreen === 'subconscious-power' && renderSubconsciousPower()}
      {currentScreen === 'calibration' && renderCalibration()}
      {currentScreen === 'calibration-directions' && renderCalibrationDirections()}
      {currentScreen === 'triage-intro' && renderTriageIntro()}
      {currentScreen === 'test1-initial' && renderTest1Initial()}
      {currentScreen === 'test2-initial' && renderTest2Initial()}
      {currentScreen === 'test2-refine' && renderTest2Refine()}
      {currentScreen === 'test3' && renderTest3()}
      {currentScreen === 'test4' && renderTest4()}
      {currentScreen === 'test5' && renderTest5()}
      {currentScreen === 'contracts-intro' && renderContractsIntro()}
      {currentScreen === 'contracts-test' && renderContractsTest()}
      {currentScreen === 'mirror-intro' && renderMirrorIntro()}
      {currentScreen === 'mirror-processing' && renderMirrorProcessing()}
      {currentScreen === 'mirror-reflection' && renderMirrorReflection()}
      {currentScreen === 'success' && renderSuccess()}
    </div>
  )
}
