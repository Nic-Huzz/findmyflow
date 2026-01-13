/**
 * PublicNervousSystemFlow - Public version of Nervous System flow (no auth required)
 *
 * Used as lead magnet - captures email before AI reflection.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { FlowFeedback } from '../components/FlowFeedback'
import PublicEmailGate from '../components/PublicEmailGate'
import PublicFlowCTA from '../components/PublicFlowCTA'
import DownloadResultsButton from '../components/DownloadResultsButton'
import { extractNervousSystemTokens } from '../lib/emailPersonalization'
import { generateNervousSystemPdf, downloadResultsPdf } from '../lib/pdfGenerator'
import { generateWarningSigns } from '../lib/nervousSystemInsights'
import {
  trackFlowStarted,
  trackFlowProgress50,
  trackFlowCompleted,
  trackEmailCaptured
} from '../lib/pixelTracking'
import './NervousSystemHealingCompass.css'
import './FlowFinder.css'

export default function PublicNervousSystemFlow() {
  // Session management (no auth)
  const [sessionToken] = useState(() => {
    const existing = sessionStorage.getItem('publicFlowSession')
    if (existing) return existing
    const token = crypto.randomUUID()
    sessionStorage.setItem('publicFlowSession', token)
    return token
  })

  const [currentScreen, setCurrentScreen] = useState('time_check')
  const [responses, setResponses] = useState({
    impact_goal: '',
    income_goal: '',
    positive_change: '',
    struggle_area: '',
    calibration_complete: false,
    yes_direction: '',
    no_direction: '',
    test1_initial: null,
    test1_refinements: [],
    test2_initial: null,
    test2_refinements: [],
    test3_safe_pursuing: null,
    test4_self_sabotage: null,
    test5_feels_unsafe: null,
    contracts_tested: {},
    being_seen_edge: null,
    earning_edge: null
  })
  const [safetyContracts, setSafetyContracts] = useState([])
  const [currentContractIndex, setCurrentContractIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reflection, setReflection] = useState(null)

  // Email gate state
  const [email, setEmail] = useState(null)
  const [showEmailGate, setShowEmailGate] = useState(false)

  // Binary search state for Test 1 (impact)
  const [test1CurrentAmount, setTest1CurrentAmount] = useState(null)
  const [test1Iteration, setTest1Iteration] = useState(0)
  const [test1LastYes, setTest1LastYes] = useState(0)
  const [test1LastNo, setTest1LastNo] = useState(null)

  // Binary search state for Test 2 (income)
  const [test2CurrentAmount, setTest2CurrentAmount] = useState(null)
  const [test2Iteration, setTest2Iteration] = useState(0)
  const [test2LastYes, setTest2LastYes] = useState(0)
  const [test2LastNo, setTest2LastNo] = useState(null)

  const totalScreens = 22
  const currentScreenIndex = getScreenIndex(currentScreen)

  function getScreenIndex(screen) {
    const screenMap = {
      'time_check': 0, 'journey': 0, 'welcome': 0,
      'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4,
      'subconscious-power': 5, 'calibration': 6, 'calibration-directions': 7,
      'triage-intro': 8, 'test1-initial': 9, 'test1-refine': 10,
      'test2-initial': 11, 'test2-refine': 12,
      'test3': 13, 'test4': 14, 'test5': 15,
      'contracts-intro': 16, 'contracts-test': 17,
      'email-gate': 18, 'mirror-intro': 19, 'mirror-processing': 20,
      'mirror-error': 20, 'mirror-reflection': 21, 'success': 22
    }
    return screenMap[screen] || 0
  }

  // Generate safety contracts based on triage results
  const generateSafetyContracts = () => {
    const contracts = []

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

    contracts.push("If I outgrow my current life, I'll lose my identity")
    contracts.push("If I become too successful, I won't be relatable anymore")
    contracts.push("If I charge what I'm worth, people will think I'm greedy")
    contracts.push("If I shine too bright, I'll make others feel bad about themselves")
    contracts.push("If I'm fully seen, people will discover I'm not enough")

    const uniqueContracts = [...new Set(contracts)]
    return uniqueContracts.slice(0, 7)
  }

  // Binary search for Test 1 (visibility edge)
  const handleTest1Response = (response) => {
    const goalNumber = parseInt(responses.impact_goal.replace(/[^0-9]/g, ''))

    if (currentScreen === 'test1-initial') {
      if (response === 'no') {
        const halfAmount = Math.floor(goalNumber / 2)
        setTest1CurrentAmount(halfAmount)
        setTest1LastNo(goalNumber)
        setTest1Iteration(1)
        setResponses(prev => ({
          ...prev,
          test1_initial: 'no',
          test1_refinements: [{ amount: halfAmount, response: null }]
        }))
        setCurrentScreen('test1-refine')
      } else {
        const doubledAmount = goalNumber * 2
        setTest1CurrentAmount(doubledAmount)
        setTest1LastYes(goalNumber)
        setTest1Iteration(1)
        setResponses(prev => ({
          ...prev,
          test1_initial: 'yes',
          test1_refinements: [{ amount: doubledAmount, response: null }]
        }))
        setCurrentScreen('test1-refine')
      }
    } else if (currentScreen === 'test1-refine') {
      const newRefinements = [...responses.test1_refinements]
      newRefinements[newRefinements.length - 1].response = response

      if (response === 'yes') {
        setTest1LastYes(test1CurrentAmount)
      } else {
        setTest1LastNo(test1CurrentAmount)
      }

      if (test1Iteration >= 3 || (test1LastNo && test1LastYes && test1LastNo - test1LastYes <= goalNumber * 0.1)) {
        const edge = test1LastYes
        setResponses(prev => ({
          ...prev,
          test1_refinements: newRefinements,
          being_seen_edge: edge
        }))
        // Track progress at 50%
        trackFlowProgress50('nervous_system')
        setCurrentScreen('test2-initial')
      } else {
        let nextAmount
        if (response === 'yes' && test1LastNo) {
          nextAmount = Math.floor((test1CurrentAmount + test1LastNo) / 2)
        } else if (response === 'no') {
          nextAmount = Math.floor((test1LastYes + test1CurrentAmount) / 2)
        } else {
          nextAmount = test1CurrentAmount * 2
        }

        setTest1CurrentAmount(nextAmount)
        setTest1Iteration(test1Iteration + 1)
        newRefinements.push({ amount: nextAmount, response: null })
        setResponses(prev => ({
          ...prev,
          test1_refinements: newRefinements
        }))
      }
    }
  }

  // Binary search for Test 2 (income edge)
  const handleTest2Response = (response) => {
    const goalNumber = parseInt(responses.income_goal.replace(/[^0-9]/g, ''))

    if (currentScreen === 'test2-initial') {
      if (response === 'no') {
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
      // All contracts tested - show email gate before AI reflection
      setShowEmailGate(true)
      setCurrentScreen('email-gate')
    }
  }

  // Handle email submission and proceed to AI reflection
  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail)
    setShowEmailGate(false)
    // Track email capture
    trackEmailCaptured('nervous_system')
    setCurrentScreen('mirror-intro')
  }

  // Error state
  const [errorMessage, setErrorMessage] = useState(null)

  // Generate AI mirror reflection
  const generateMirrorReflection = async () => {
    setIsProcessing(true)
    setErrorMessage(null)
    setCurrentScreen('mirror-processing')

    try {
      if (!responses.being_seen_edge || !responses.earning_edge) {
        throw new Error('Missing nervous system edge data')
      }

      const requestBody = {
        impact_goal: responses.impact_goal,
        nervous_system_impact_limit: `${responses.being_seen_edge} people`,
        income_goal: responses.income_goal,
        nervous_system_income_limit: `$${responses.earning_edge.toLocaleString()}`,
        positive_change: responses.positive_change,
        struggle_area: responses.struggle_area,
        triage_safe_pursuing: responses.test3_safe_pursuing,
        triage_self_sabotage: responses.test4_self_sabotage,
        triage_feels_unsafe: responses.test5_feels_unsafe,
        belief_test_results: responses.contracts_tested
      }

      const { data, error } = await supabase.functions.invoke('nervous-system-mirror', {
        body: requestBody
      })

      if (error) throw error
      if (!data?.reflection) throw new Error('No reflection data received')

      setReflection(data.reflection)

      // Save to database
      const yesContracts = Object.entries(responses.contracts_tested)
        .filter(([_, r]) => r === 'yes')
        .map(([contract]) => contract)

      // Extract personalization tokens
      const personalizationTokens = extractNervousSystemTokens(
        email,
        responses,
        data.reflection
      )

      await supabase.from('public_nervous_system_responses').insert({
        session_token: sessionToken,
        respondent_email: email,
        impact_goal: responses.impact_goal,
        income_goal: responses.income_goal,
        positive_change: responses.positive_change,
        current_struggle: responses.struggle_area,
        being_seen_edge: responses.being_seen_edge,
        earning_edge: responses.earning_edge,
        belief_test_results: responses.contracts_tested,
        safety_contracts: yesContracts,
        reflection_text: data.reflection.full_reflection,
        archetype: data.reflection.archetype_name,
        archetype_description: data.reflection.archetype_description
      })

      // Update public_leads with personalization tokens
      await supabase.from('public_leads').upsert({
        email: email,
        source_flow: 'nervous_system',
        personalization_tokens: personalizationTokens,
        flow_results: {
          archetype: data.reflection.archetype_name,
          being_seen_edge: responses.being_seen_edge,
          earning_edge: responses.earning_edge
        }
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })

      // Enroll in email sequence
      await supabase.functions.invoke('enroll-email-sequence', {
        body: {
          email: email,
          sequence_type: 'nervous_system',
          personalization_tokens: personalizationTokens
        }
      })

      // Track flow completion
      trackFlowCompleted('nervous_system', {
        archetype: data.reflection.archetype_name,
        being_seen_edge: responses.being_seen_edge,
        earning_edge: responses.earning_edge
      })

      setCurrentScreen('mirror-reflection')
    } catch (err) {
      console.error('Error generating reflection:', err)
      setErrorMessage(err.message || 'Something went wrong generating your reflection')
      setCurrentScreen('mirror-error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Format helpers
  const formatPeople = (num) => num >= 1000000 ? `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M` : num >= 1000 ? `${(num / 1000).toFixed(0)}K` : num
  const formatMoney = (num) => num >= 1000000 ? `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M` : num >= 1000 ? `$${(num / 1000).toFixed(0)}K` : `$${num}`

  // ============ RENDER FUNCTIONS ============

  const renderTimeCheck = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Nervous System Map</h1>
      <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
        <p><span className="time-icon">⏱️</span></p>
        <p><strong>This flow takes about 5-10 minutes</strong></p>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>4 questions to map your nervous system boundaries.</p>
        <p>Find a quiet moment where you can be honest with yourself.</p>
        <p><strong>Your insights will be more valuable when you're present.</strong></p>
      </div>

      <button className="primary-button glow-button" onClick={() => {
        trackFlowStarted('nervous_system')
        setCurrentScreen('journey')
      }}>
        I've Got Time, Let's Go
      </button>
    </div>
  )

  const renderJourney = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Where This Fits</h1>
      <div className="welcome-message animated-text">
        <p><strong>In the Find My Flow journey...</strong></p>
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
    </div>
  )

  const renderWelcome = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Your Internal Boundaries</h1>
      <div className="welcome-message animated-text">
        <p><strong>Welcome!</strong></p>
        <p>Your nervous system has a boundary around what feels 'safe'.</p>
        <p>Safe to earn. Safe to be seen. Safe to succeed.</p>
        <p>Anything beyond that boundary? <strong>It pulls you back.</strong></p>
        <p>Not because you lack capability — but because expansion feels dangerous to your system.</p>
        <p className="hint-text">Let's discover where your boundaries are — so you can expand them.</p>
      </div>

      <button className="primary-button glow-button" onClick={() => setCurrentScreen('q1')}>
        Let's Begin
      </button>
    </div>
  )

  const renderQ1 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 1 of 4</div>
      <h2 className="ns-hc-question-text">In your most audacious ambitions, how many people do you hope to impact?</h2>

      <div className="ns-hc-horizontal-options">
        {['100+', '1,000+', '10,000+', '100,000+'].map(option => (
          <button
            key={option}
            className={`ns-hc-horizontal-option ${responses.impact_goal === option ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, impact_goal: option }))}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q2')}
        disabled={!responses.impact_goal}
        style={{ opacity: responses.impact_goal ? 1 : 0.5 }}
      >
        Continue
      </button>
    </div>
  )

  const renderQ2 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 2 of 4</div>
      <h2 className="ns-hc-question-text">In your most audacious ambitions, how much would you be earning per year?</h2>

      <div className="ns-hc-horizontal-options">
        {['$100,000+', '$500,000+', '$1,000,000+'].map(option => (
          <button
            key={option}
            className={`ns-hc-horizontal-option ${responses.income_goal === option ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, income_goal: option }))}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q3')}
        disabled={!responses.income_goal}
        style={{ opacity: responses.income_goal ? 1 : 0.5 }}
      >
        Continue
      </button>
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

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q4')}
        disabled={!responses.positive_change.trim()}
        style={{ opacity: responses.positive_change.trim() ? 1 : 0.5 }}
      >
        Continue
      </button>
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

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('subconscious-power')}
        disabled={!responses.struggle_area.trim()}
        style={{ opacity: responses.struggle_area.trim() ? 1 : 0.5 }}
      >
        Continue
      </button>
    </div>
  )

  const renderSubconsciousPower = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Power of Your Subconscious</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>Your <strong>conscious mind</strong> is what you're aware of right now.</p>
        <p>But your <strong>subconscious mind</strong> runs 95% of your life.</p>
        <p>This is why you can <em>want</em> something consciously but still find yourself pulling back.</p>
        <p><strong>Your subconscious has veto power.</strong></p>
        <p style={{ marginTop: 24 }}>Muscle testing (the Sway Test) bypasses your conscious mind and lets us ask your <strong>nervous system</strong> directly:</p>
        <p><em>"What do you actually believe is safe?"</em></p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => setCurrentScreen('calibration')}>
        Got it, let's test
      </button>
    </div>
  )

  const renderCalibration = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Calibration</div>
      <h2 className="ns-hc-question-text">The Sway Test</h2>
      <p className="ns-hc-question-subtext">Learn how your body communicates YES and NO</p>

      <div className="ns-hc-welcome-message" style={{ marginTop: 32 }}>
        <p><strong>Stand up straight</strong> with your feet hip-width apart.</p>
        <p>Say out loud: <strong>"Show me a YES."</strong> Notice which way your body sways.</p>
        <p>Say out loud: <strong>"Show me a NO."</strong> Notice the contrast.</p>
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
        onClick={() => setCurrentScreen('calibration-directions')}
      >
        I've Calibrated
      </button>
    </div>
  )

  const renderCalibrationDirections = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Calibration Complete</div>
      <h2 className="ns-hc-question-text">Let's record your body's language</h2>

      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 16, color: 'white', fontWeight: 600 }}>
          What way was YES?
        </label>
        <div className="ns-hc-horizontal-options">
          {['Forward', 'Back', 'Left', 'Right'].map(dir => (
            <button
              key={dir}
              className={`ns-hc-horizontal-option ${responses.yes_direction === dir ? 'selected' : ''}`}
              onClick={() => setResponses(prev => ({ ...prev, yes_direction: dir }))}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 32, marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 16, color: 'white', fontWeight: 600 }}>
          What way was NO?
        </label>
        <div className="ns-hc-horizontal-options">
          {['Forward', 'Back', 'Left', 'Right'].map(dir => (
            <button
              key={dir}
              className={`ns-hc-horizontal-option ${responses.no_direction === dir ? 'selected' : ''}`}
              onClick={() => setResponses(prev => ({ ...prev, no_direction: dir }))}
            >
              {dir}
            </button>
          ))}
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
    </div>
  )

  const renderTriageIntro = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">Let's Find Your Edge</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>Now let's see where your system feels safe — and where it contracts.</p>
        <p>I'm going to give you <strong>5 statements to test</strong> using the sway test.</p>
        <p>Say each one out loud, notice your body's response, and let me know: <strong>YES or NO?</strong></p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => {
        setCurrentScreen('test1-initial')
        const goalNumber = parseInt(responses.impact_goal.replace(/[^0-9]/g, ''))
        setTest1CurrentAmount(goalNumber)
      }}>
        Ready
      </button>
    </div>
  )

  const renderTest1Initial = () => {
    const goalNumber = parseInt(responses.impact_goal.replace(/[^0-9]/g, ''))
    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Statement 1 of 5</div>
        <h2 className="ns-hc-question-text">"I feel safe being seen by {formatPeople(goalNumber)} people"</h2>
        <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

        <div className="ns-hc-horizontal-options">
          <button className="ns-hc-horizontal-option" onClick={() => handleTest1Response('yes')}>YES</button>
          <button className="ns-hc-horizontal-option" onClick={() => handleTest1Response('no')}>NO</button>
        </div>
      </div>
    )
  }

  const renderTest1Refine = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 1 of 5 - Refining</div>
      <h2 className="ns-hc-question-text">"I feel safe being seen by {formatPeople(test1CurrentAmount)} people"</h2>
      <p className="ns-hc-question-subtext">Testing to find your exact edge</p>

      <div className="ns-hc-horizontal-options">
        <button className="ns-hc-horizontal-option" onClick={() => handleTest1Response('yes')}>YES</button>
        <button className="ns-hc-horizontal-option" onClick={() => handleTest1Response('no')}>NO</button>
      </div>
    </div>
  )

  const renderTest2Initial = () => {
    const goalNumber = parseInt(responses.income_goal.replace(/[^0-9]/g, ''))
    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Statement 2 of 5</div>
        <h2 className="ns-hc-question-text">"I feel safe earning over {formatMoney(goalNumber)}/year"</h2>
        <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

        <div className="ns-hc-horizontal-options">
          <button className="ns-hc-horizontal-option" onClick={() => {
            setTest2CurrentAmount(goalNumber)
            handleTest2Response('yes')
          }}>YES</button>
          <button className="ns-hc-horizontal-option" onClick={() => {
            setTest2CurrentAmount(goalNumber)
            handleTest2Response('no')
          }}>NO</button>
        </div>
      </div>
    )
  }

  const renderTest2Refine = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 2 of 5 - Refining</div>
      <h2 className="ns-hc-question-text">"I feel safe earning over {formatMoney(test2CurrentAmount)}/year"</h2>
      <p className="ns-hc-question-subtext">Testing to find your exact edge</p>

      <div className="ns-hc-horizontal-options">
        <button className="ns-hc-horizontal-option" onClick={() => handleTest2Response('yes')}>YES</button>
        <button className="ns-hc-horizontal-option" onClick={() => handleTest2Response('no')}>NO</button>
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
        <button className="ns-hc-horizontal-option" onClick={() => {
          setResponses(prev => ({ ...prev, test3_safe_pursuing: 'yes' }))
          setCurrentScreen('test4')
        }}>YES</button>
        <button className="ns-hc-horizontal-option" onClick={() => {
          setResponses(prev => ({ ...prev, test3_safe_pursuing: 'no' }))
          setCurrentScreen('test4')
        }}>NO</button>
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
        <button className="ns-hc-horizontal-option" onClick={() => {
          setResponses(prev => ({ ...prev, test4_self_sabotage: 'yes' }))
          setCurrentScreen('test5')
        }}>YES</button>
        <button className="ns-hc-horizontal-option" onClick={() => {
          setResponses(prev => ({ ...prev, test4_self_sabotage: 'no' }))
          setCurrentScreen('test5')
        }}>NO</button>
      </div>
    </div>
  )

  const renderTest5 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 5 of 5</div>
      <h2 className="ns-hc-question-text">"Part of me feels unsafe with the vision of my ambitions"</h2>
      <p className="ns-hc-question-subtext">Stand up, say it out loud, and notice your body's response</p>

      <div className="ns-hc-horizontal-options">
        <button className="ns-hc-horizontal-option" onClick={() => {
          setResponses(prev => ({ ...prev, test5_feels_unsafe: 'yes' }))
          const contracts = generateSafetyContracts()
          setSafetyContracts(contracts)
          setCurrentContractIndex(0)
          setCurrentScreen('contracts-intro')
        }}>YES</button>
        <button className="ns-hc-horizontal-option" onClick={() => {
          setResponses(prev => ({ ...prev, test5_feels_unsafe: 'no' }))
          const contracts = generateSafetyContracts()
          setSafetyContracts(contracts)
          setCurrentContractIndex(0)
          setCurrentScreen('contracts-intro')
        }}>NO</button>
      </div>
    </div>
  )

  const renderContractsIntro = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">Safety Contracts</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>Your nervous system operates on <strong>safety contracts</strong> — subconscious beliefs designed to protect you.</p>
        <p>Now we'll test <strong>{safetyContracts.length} contracts</strong> to see which ones are still active in your system.</p>
        <p>For each one, use the sway test: <strong>YES (this fear is active) or NO (not a concern)</strong>.</p>
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
        <button className="ns-hc-horizontal-option" onClick={() => handleContractResponse('yes')}>YES</button>
        <button className="ns-hc-horizontal-option" onClick={() => handleContractResponse('no')}>NO</button>
      </div>
    </div>
  )

  const renderEmailGate = () => (
    <PublicEmailGate
      flowType="nervous_system"
      onEmailSubmit={handleEmailSubmit}
      title="Your results are ready!"
      subtitle="Enter your email to see your personalized nervous system reflection"
    />
  )

  const renderMirrorIntro = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Mirror</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>Now let's reflect back what your nervous system just revealed.</p>
        <p>This isn't judgment — it's <strong>pattern recognition</strong>.</p>
        <p>Understanding your protective pattern is the first step to expanding beyond it.</p>
      </div>

      <button className="ns-hc-primary-button" onClick={generateMirrorReflection}>
        Show Me
      </button>
    </div>
  )

  const renderMirrorProcessing = () => (
    <div className="ns-hc-container ns-hc-processing-container">
      <div className="ns-hc-spinner"></div>
      <div className="ns-hc-processing-text">Analyzing your nervous system pattern...</div>
      <p className="ns-hc-processing-subtext">This process can take 10–15 seconds</p>
    </div>
  )

  const renderMirrorError = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
      <h1 className="ns-hc-welcome-greeting">Something Went Wrong</h1>
      <div className="ns-hc-welcome-message">
        <p>We couldn't generate your personalized reflection right now.</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
          {errorMessage}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <button className="ns-hc-primary-button" onClick={generateMirrorReflection}>
          Try Again
        </button>
        <button
          className="ns-hc-primary-button"
          onClick={() => window.location.href = 'https://findmyflow.nichuzz.com'}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
        >
          Continue to Find My Flow
        </button>
      </div>
    </div>
  )

  const renderMirrorReflection = () => {
    if (!reflection) return null

    const flowResults = {
      archetype: reflection.archetype_name,
      being_seen_edge: responses.being_seen_edge,
      earning_edge: responses.earning_edge
    }

    return (
      <div className="ns-hc-container ns-hc-welcome-container">
        <h1 className="ns-hc-welcome-greeting">Your Protective Pattern</h1>

        <div className="ns-hc-result-box" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
          <h3 style={{ fontSize: 22 }}>🌟 {reflection.archetype_name}</h3>
          <p style={{ fontSize: 15, marginTop: 12 }}>{reflection.archetype_description}</p>
        </div>

        <div className="ns-hc-result-box">
          <h3>📊 Your Nervous System Limits:</h3>
          <div style={{ marginTop: 12, paddingLeft: 8 }}>
            <p>💰 Earning up to <strong style={{ color: '#fbbf24' }}>{formatMoney(responses.earning_edge)}/year</strong></p>
            <p>👥 Being visible to about <strong style={{ color: '#fbbf24' }}>{formatPeople(responses.being_seen_edge)} people</strong></p>
          </div>
        </div>

        <div className="ns-hc-result-box" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ color: '#fca5a5' }}>🔍 Primary Limiting Belief:</h3>
          <p style={{ marginTop: 12, fontStyle: 'italic' }}>"{reflection.core_fear}"</p>
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }}>{reflection.fear_interpretation}</p>
        </div>

        <div className="ns-hc-result-box" style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <h3 style={{ color: '#c4b5fd' }}>✨ What Needs Rewiring:</h3>
          <p style={{ marginTop: 12, whiteSpace: 'pre-line' }}>{reflection.rewiring_needed}</p>
        </div>

        {/* Warning Signs Section */}
        {(() => {
          const warnings = generateWarningSigns(responses)
          if (warnings.length === 0) return null

          return (
            <div className="ns-hc-result-box" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <h3 style={{ color: '#fbbf24', marginBottom: 16 }}>⚠️ Watch For These Patterns</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {warnings.map((warning, index) => (
                  <div key={warning.id} style={{ paddingBottom: index < warnings.length - 1 ? 16 : 0, borderBottom: index < warnings.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <h4 style={{ fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{warning.icon}</span>
                      <span>{warning.title}</span>
                    </h4>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12, lineHeight: 1.5 }}>
                      {warning.description}
                    </p>
                    {warning.triggers && warning.triggers.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Common triggers:</p>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                          {warning.triggers.map((trigger, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>{trigger}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {warning.practice && (
                      <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: 12, borderRadius: 8, marginTop: 8 }}>
                        <p style={{ fontSize: 12, color: '#c4b5fd', marginBottom: 4 }}>Practice:</p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
                          {warning.practice}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Download Results Button */}
        <DownloadResultsButton
          label="Download Your Results"
          onDownload={() => {
            const activeContracts = Object.entries(responses.contracts_tested)
              .filter(([_, r]) => r === 'yes')
              .map(([contract]) => contract)

            const warningSigns = generateWarningSigns(responses)

            const pdfContent = generateNervousSystemPdf({
              archetype: reflection.archetype_name,
              archetypeDescription: reflection.archetype_description,
              beingSeenEdge: responses.being_seen_edge,
              earningEdge: responses.earning_edge,
              coreFear: reflection.core_fear,
              fearInterpretation: reflection.fear_interpretation,
              rewiringNeeded: reflection.rewiring_needed,
              activeContracts,
              warningSigns
            })
            downloadResultsPdf(pdfContent, 'Nervous System Map - Find My Flow')
          }}
        />

        <FlowFeedback
          flowType="nervous_system"
          sessionToken={sessionToken}
        />

        <PublicFlowCTA
          email={email}
          flowType="nervous_system"
          flowResults={flowResults}
        />
      </div>
    )
  }

  // ============ MAIN RENDER ============

  return (
    <div className="ns-hc-app">
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
      {currentScreen === 'test1-refine' && renderTest1Refine()}
      {currentScreen === 'test2-initial' && renderTest2Initial()}
      {currentScreen === 'test2-refine' && renderTest2Refine()}
      {currentScreen === 'test3' && renderTest3()}
      {currentScreen === 'test4' && renderTest4()}
      {currentScreen === 'test5' && renderTest5()}
      {currentScreen === 'contracts-intro' && renderContractsIntro()}
      {currentScreen === 'contracts-test' && renderContractsTest()}
      {currentScreen === 'email-gate' && renderEmailGate()}
      {currentScreen === 'mirror-intro' && renderMirrorIntro()}
      {currentScreen === 'mirror-processing' && renderMirrorProcessing()}
      {currentScreen === 'mirror-error' && renderMirrorError()}
      {currentScreen === 'mirror-reflection' && renderMirrorReflection()}
    </div>
  )
}
