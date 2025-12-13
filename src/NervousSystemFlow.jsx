import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { completeFlowQuest } from './lib/questCompletion'
import './NervousSystemHealingCompass.css'

export default function NervousSystemFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [responses, setResponses] = useState({
    impact_goal: '',
    income_goal: '',
    positive_change: '',
    struggle_area: '',
    calibration_complete: false,
    yes_direction: '',
    no_direction: '',
    // Triage test responses
    test1_initial: null, // YES/NO for initial impact goal
    test1_refinements: [], // Array of {amount, response} for binary search
    test2_initial: null, // YES/NO for initial income goal
    test2_refinements: [], // Array of {amount, response} for binary search
    test3_safe_pursuing: null, // YES/NO
    test4_self_sabotage: null, // YES/NO
    test5_feels_unsafe: null, // YES/NO
    // Contract testing
    contracts_tested: {}, // { contract: 'yes'/'no' }
    // Final calculated edges
    being_seen_edge: null,
    earning_edge: null
  })
  const [safetyContracts, setSafetyContracts] = useState([])
  const [currentContractIndex, setCurrentContractIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reflection, setReflection] = useState(null)
  const [showCalibrationVideo, setShowCalibrationVideo] = useState(false)

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

  const totalScreens = 22 // Total number of progress dots (added subconscious + calibration-directions)
  const currentScreenIndex = getScreenIndex(currentScreen)

  function getScreenIndex(screen) {
    const screenMap = {
      'welcome': 0,
      'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4,
      'subconscious-power': 5,
      'calibration': 6,
      'calibration-directions': 7,
      'triage-intro': 8,
      'test1-initial': 9,
      'test1-refine': 10,
      'test2-initial': 11,
      'test2-refine': 12,
      'test3': 13,
      'test4': 14,
      'test5': 15,
      'contracts-intro': 16,
      'contracts-test': 17,
      'mirror-intro': 18,
      'mirror-processing': 19,
      'mirror-reflection': 20,
      'success': 21
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
      contracts.push("If I succeed, I'll have to maintain it forever (and I can't)")
      contracts.push("If I reach my goals, I'll discover I'm a fraud")
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

  // Binary search for Test 1 (visibility edge)
  const handleTest1Response = (response) => {
    const goalNumber = parseInt(responses.impact_goal.replace(/[^0-9]/g, ''))

    if (currentScreen === 'test1-initial') {
      if (response === 'no') {
        // Start binary search downward
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
        // They feel safe at their goal, double it to find the upper limit
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
      // Binary search logic
      const newRefinements = [...responses.test1_refinements]
      newRefinements[newRefinements.length - 1].response = response

      if (response === 'yes') {
        setTest1LastYes(test1CurrentAmount)
      } else {
        setTest1LastNo(test1CurrentAmount)
      }

      // Check if we should continue or stop
      if (test1Iteration >= 3 || (test1LastNo && test1LastYes && test1LastNo - test1LastYes <= goalNumber * 0.1)) {
        // Stop: we've found the edge
        const edge = test1LastYes
        setResponses(prev => ({
          ...prev,
          test1_refinements: newRefinements,
          being_seen_edge: edge
        }))
        setCurrentScreen('test2-initial')
      } else {
        // Continue binary search
        let nextAmount
        if (response === 'yes' && test1LastNo) {
          // Try midpoint between current YES and last NO
          nextAmount = Math.floor((test1CurrentAmount + test1LastNo) / 2)
        } else if (response === 'no') {
          // Try midpoint between last YES and current NO
          nextAmount = Math.floor((test1LastYes + test1CurrentAmount) / 2)
        } else {
          // First YES, try doubling
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
        being_seen_edge: responses.being_seen_edge,
        earning_edge: responses.earning_edge,
        all_responses: responses
      })

      if (!responses.being_seen_edge || !responses.earning_edge) {
        const errorMsg = `Missing nervous system edge data. being_seen_edge=${responses.being_seen_edge}, earning_edge=${responses.earning_edge}`
        console.error('❌ Validation failed:', errorMsg)
        throw new Error(errorMsg)
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
      if (!responses.being_seen_edge || !responses.earning_edge) {
        throw new Error('Missing nervous system edge data. Please complete the flow.')
      }

      // Extract YES contracts for Healing Compass
      const yesContracts = Object.entries(responses.contracts_tested)
        .filter(([_, response]) => response === 'yes')
        .map(([contract]) => contract)

      const { error } = await supabase
        .from('nervous_system_responses')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.name || 'Anonymous',
          impact_goal: responses.impact_goal,
          income_goal: responses.income_goal,
          nervous_system_impact_limit: `${responses.being_seen_edge} people`,
          nervous_system_income_limit: `$${responses.earning_edge.toLocaleString()}`,
          positive_change: responses.positive_change,
          current_struggle: responses.struggle_area,
          belief_test_results: responses.contracts_tested,
          safety_contracts: yesContracts,
          reflection_text: reflection?.full_reflection,
          archetype: reflection?.archetype_name,
          being_seen_edge: responses.being_seen_edge,
          earning_edge: responses.earning_edge
        })

      if (error) throw error

      // Complete quest
      await completeFlowQuest({
        userId: user.id,
        flowId: 'nervous_system',
        pointsEarned: 25
      })

      setCurrentScreen('success')
    } catch (err) {
      console.error('Error saving data:', err)
      alert('Error saving data. Please try again.')
    }
  }

  // Format numbers nicely
  const formatPeople = (num) => num >= 1000 ? `${(num / 1000).toFixed(0)}K` : num
  const formatMoney = (num) => num >= 1000 ? `$${(num / 1000).toFixed(0)}K` : `$${num}`

  // Render functions for each screen
  const renderWelcome = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">Nervous System Map</h1>
      <div className="ns-hc-welcome-message">
        <p><strong>Welcome, {user?.user_metadata?.name || 'there'}!</strong></p>
        <p>Remember how we talked about your flow hitting a river bank?</p>
        <p>What if the bank isn't external — what if it's <strong>inside you</strong>?</p>
        <p>Your nervous system has a boundary around what feels 'safe'. Safe to earn. Safe to be seen. Safe to succeed.</p>
        <p>Anything beyond that boundary? It pulls you back. Not because you lack capability — but because expansion feels dangerous to your system.</p>
        <p>This is why ambitious people self-sabotage. Not because they're broken. Because their nervous system is protecting them from something.</p>
        <p>Let's discover where your boundaries are — so you can expand them.</p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => setCurrentScreen('q1')}>
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
      >
        Continue
      </button>
    </div>
  )

  const renderSubconsciousPower = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Power of Your Subconscious</h1>
      <div className="ns-hc-welcome-message">
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
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">Let's Find Your Edge</h1>
      <div className="ns-hc-welcome-message">
        <p>Now let's see where your system feels safe — and where it contracts.</p>
        <p>I'm going to give you <strong>5 statements to test</strong> using the sway test.</p>
        <p>Say each one out loud, notice your body's response, and let me know: <strong>YES or NO?</strong></p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => {
        setCurrentScreen('test1-initial')
        // Initialize test 1 with the impact goal
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
  }

  const renderTest1Refine = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Statement 1 of 5 - Refining (Step {test1Iteration + 1} of 4)</div>
      <h2 className="ns-hc-question-text">"I feel safe being seen by {formatPeople(test1CurrentAmount)} people"</h2>
      <p className="ns-hc-question-subtext">Testing to find your exact edge</p>

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
    const goalNumber = parseInt(responses.income_goal.replace(/[^0-9]/g, ''))
    return (
      <div className="ns-hc-container ns-hc-question-container">
        <div className="ns-hc-question-number">Statement 2 of 5</div>
        <h2 className="ns-hc-question-text">"I feel safe earning over {formatMoney(goalNumber)}/year"</h2>
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
      <h2 className="ns-hc-question-text">"I feel safe earning over {formatMoney(test2CurrentAmount)}/year"</h2>
      <p className="ns-hc-question-subtext">Testing to find your exact edge</p>

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
      <div className="ns-hc-welcome-message">
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
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Mirror</h1>
      <div className="ns-hc-welcome-message">
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
      <p className="ns-hc-processing-subtext">Generating your personalized reflection</p>
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
          <p style={{ fontSize: 15, marginTop: 12 }}>{reflection.archetype_description}</p>
        </div>

        {/* Safety Zone */}
        <div className="ns-hc-result-box">
          <h3>✓ Where You Feel Safe:</h3>
          <div style={{ marginTop: 12, paddingLeft: 8 }}>
            <p>💰 Earning up to <strong style={{ color: '#fbbf24' }}>{formatMoney(responses.earning_edge)}/year</strong></p>
            <p>👥 Being visible to about <strong style={{ color: '#fbbf24' }}>{formatPeople(responses.being_seen_edge)} people</strong></p>
          </div>
        </div>

        {/* Core Fear */}
        <div className="ns-hc-result-box" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ color: '#fca5a5' }}>🔍 Primary Limiting Belief:</h3>
          <p style={{ marginTop: 12, fontStyle: 'italic' }}>"{reflection.core_fear}"</p>
          <p style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }}>{reflection.fear_interpretation}</p>
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
          <p style={{ marginTop: 12, whiteSpace: 'pre-line' }}>{reflection.rewiring_needed}</p>
        </div>

        <button className="ns-hc-primary-button" onClick={completeFlow}>
          Continue to Results
        </button>
      </div>
    )
  }

  const renderSuccess = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">✓ Nervous System Mapped!</h1>
      <div className="ns-hc-welcome-message">
        <p>You've identified the safety contracts limiting your flow.</p>
        <p>The next step is to <strong>heal the root cause</strong> through the Healing Compass.</p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => navigate('/healing-compass')}>
        Proceed to Healing Compass
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
      {currentScreen === 'mirror-intro' && renderMirrorIntro()}
      {currentScreen === 'mirror-processing' && renderMirrorProcessing()}
      {currentScreen === 'mirror-reflection' && renderMirrorReflection()}
      {currentScreen === 'success' && renderSuccess()}
    </div>
  )
}
