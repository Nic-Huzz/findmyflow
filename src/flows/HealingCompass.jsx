import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useAutoSave } from '../hooks/useAutoSave'
import '../NervousSystemHealingCompass.css'
import '../FlowFinder.css'

export default function HealingCompass() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [currentScreen, setCurrentScreen] = useState('loading')
  const [viewingResults, setViewingResults] = useState(false)
  const [safetyContracts, setSafetyContracts] = useState([])
  const [responses, setResponses] = useState({
    selected_safety_contract: '',
    limiting_impact: '',
    past_parallel_story: '',
    past_event_details: '',
    past_event_emotions: '',
    connect_dots_acknowledged: false,
    splinter_removal_consent: false
  })

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('healing-compass', user?.id)

  const totalScreens = 9
  const currentScreenIndex = getScreenIndex(currentScreen)

  // Go back handler
  const goBack = (fromScreen) => {
    const screenOrder = ['time_check', 'journey', 'welcome', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8']
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
      'loading': 0,
      'no-results': 0,
      'time_check': 0,
      'journey': 0,
      'welcome': 0,
      'q1': 1,
      'q2': 2,
      'q3': 3,
      'q4': 4,
      'q5': 5,
      'q6': 6,
      'q7': 7,
      'q8': 8
    }
    return screenMap[screen] || 0
  }

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        const { data, error } = await supabase
          .from('healing_compass_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          const saved = data[0]

          // Populate responses state
          setResponses({
            selected_safety_contract: saved.selected_safety_contract || '',
            limiting_impact: saved.limiting_impact || '',
            past_parallel_story: saved.past_parallel_story || '',
            past_event_details: saved.past_event_details || '',
            past_event_emotions: saved.past_event_emotions || '',
            connect_dots_acknowledged: saved.connect_dots_acknowledged || false,
            splinter_removal_consent: saved.splinter_removal_consent || false
          })

          setViewingResults(true)
          setCurrentScreen('q6') // Show the insight/summary screen
        } else {
          // No saved results found - show navigation options
          setCurrentScreen('no-results')
        }
      } catch (err) {
        console.error('Error loading saved results:', err)
        setCurrentScreen('no-results')
      }
    }
    loadSavedResults()
  }, [searchParams, user])

  // Load safety contracts from Nervous System flow
  useEffect(() => {
    // Skip loading safety contracts if we're viewing results (they're already populated)
    if (searchParams.get('results') === 'true') return
    loadSafetyContracts()
  }, [user, searchParams])

  // Check for saved progress on mount (auto-save)
  useEffect(() => {
    if (user && searchParams.get('results') !== 'true') {
      const saved = loadProgress()
      if (saved && saved.currentScreen && saved.currentScreen !== 'time_check' && saved.currentScreen !== 'success' && saved.currentScreen !== 'loading') {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, loadProgress, searchParams])

  // Auto-save progress on state changes
  useEffect(() => {
    if (!user || currentScreen === 'time_check' || currentScreen === 'success' || currentScreen === 'loading' || currentScreen === 'no-results') return
    const progressData = { currentScreen, responses }
    saveProgress(progressData)
  }, [currentScreen, responses, user, saveProgress])

  const loadSafetyContracts = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('nervous_system_responses')
        .select('safety_contracts, belief_test_results')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        // First try safety_contracts array
        if (data[0].safety_contracts && data[0].safety_contracts.length > 0) {
          setSafetyContracts(data[0].safety_contracts)
          setCurrentScreen('time_check')
        }
        // Fallback: Extract YES contracts from belief_test_results
        else if (data[0].belief_test_results) {
          const yesContracts = Object.entries(data[0].belief_test_results)
            .filter(([_, response]) => response === 'yes')
            .map(([contract]) => contract)

          if (yesContracts.length > 0) {
            setSafetyContracts(yesContracts)
            setCurrentScreen('time_check')
          } else {
            alert('Please complete the Nervous System flow first to identify your safety contracts.')
            navigate('/nervous-system')
          }
        } else {
          alert('Please complete the Nervous System flow first to identify your safety contracts.')
          navigate('/nervous-system')
        }
      } else {
        // No nervous system data found
        alert('Please complete the Nervous System flow first to identify your safety contracts.')
        navigate('/nervous-system')
      }
    } catch (err) {
      console.error('Error loading safety contracts:', err)
      alert('Error loading safety contracts. Please try again.')
    }
  }

  const saveAndComplete = async (selectedOption) => {
    try {
      // Save to database
      const { error } = await supabase
        .from('healing_compass_responses')
        .insert({
          user_id: user.id,
          user_name: user.user_metadata?.name || 'Anonymous',
          selected_safety_contract: responses.selected_safety_contract,
          limiting_impact: responses.limiting_impact,
          past_parallel_story: responses.past_parallel_story,
          past_event_details: responses.past_event_details,
          past_event_emotions: responses.past_event_emotions,
          connect_dots_acknowledged: responses.connect_dots_acknowledged,
          splinter_removal_consent: responses.splinter_removal_consent,
          challenge_enrollment_consent: selectedOption
        })

      if (error) throw error

      // Complete quest
      await completeFlowQuest({
        userId: user.id,
        flowId: 'healing_compass',
        pointsEarned: 20
      })

      // Clear auto-saved progress on completion
      clearProgress()

      // Navigate based on selection
      if (selectedOption === 'continue_challenge') {
        navigate('/7-day-challenge')
      } else {
        // Open Calendly in new tab
        window.open('https://calendly.com/huzz-nichuzz/30min', '_blank', 'noopener,noreferrer')
        navigate('/me')
      }
    } catch (err) {
      console.error('Error saving data:', err)
      alert('Error saving data. Please try again.')
    }
  }

  // Helper to get readable screen name
  const getScreenDisplayName = (screen) => {
    const screenNames = {
      'journey': 'Journey Context',
      'welcome': 'Welcome',
      'q1': 'Question 1 - Safety Contract',
      'q2': 'Question 2 - Impact',
      'q3': 'Question 3 - Origin',
      'q4': 'Question 4 - What Happened',
      'q5': 'Question 5 - Emotions',
      'q6': 'Question 6 - Insight',
      'q7': 'Question 7 - Splinter',
      'q8': 'Question 8 - Healing Options'
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

  const renderTimeCheck = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Healing Compass</h1>

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
          <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
            <p><span className="time-icon">⏱️</span></p>
            <p><strong>This flow takes about 10-15 minutes</strong></p>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>7 questions to trace and heal a limiting belief.</p>
            <p>Find a quiet, safe space where you can be emotionally present.</p>
            <p><strong>This work can bring up old memories — that's part of the healing.</strong></p>
          </div>

          <button className="primary-button glow-button" onClick={() => setCurrentScreen('journey')}>
            I'm Ready
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

  const renderJourney = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Where This Fits</h1>
      <div className="welcome-message animated-text">
        <p><strong>In the Find My Flow journey...</strong></p>
        <p className="highlight-box">
          <span className="highlight-word">Nervous System Map</span> revealed <em>what</em> beliefs are holding you back.<br /><br />
          <span className="highlight-word">Healing Compass</span> helps you <em>heal</em> the root cause of those beliefs.
        </p>
        <p>We'll trace a safety contract back to its origin and remove the emotional "splinter" that created it.</p>
        <p>This is deep work — and it's how lasting change happens.</p>
      </div>

      <button className="primary-button" onClick={() => setCurrentScreen('welcome')}>
        Makes Sense!
      </button>
      <BackButton fromScreen="journey" />
    </div>
  )

  const renderWelcome = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Let's Heal Together</h1>
      <div className="welcome-message animated-text">
        <p><strong>Hey {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'}!</strong> I'm excited to dive deeper with you.</p>
        <p>Our mission here is to find the <strong>source</strong> of what's blocking your flow so we can heal it.</p>
        <p>In the Nervous System flow, you identified safety contracts that have been protecting you.</p>
        <p>Now let's trace one back to its origin — and remove the emotional splinter driving it.</p>
        <p className="hint-text">Be gentle with yourself. This is powerful work.</p>
      </div>

      <button className="primary-button glow-button" onClick={() => setCurrentScreen('q1')}>
        Let's Begin
      </button>
      <BackButton fromScreen="welcome" />
    </div>
  )

  const renderQ1 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 1 of 7</div>
      <h2 className="ns-hc-question-text">Which safety contract would you like to focus on healing?</h2>

      <div className="ns-hc-contract-list">
        {safetyContracts.map((contract, index) => (
          <button
            key={index}
            className={`ns-hc-contract-option ${responses.selected_safety_contract === contract ? 'selected' : ''}`}
            onClick={() => setResponses(prev => ({ ...prev, selected_safety_contract: contract }))}
          >
            {contract}
          </button>
        ))}
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q2')}
        disabled={!responses.selected_safety_contract}
        style={{ opacity: responses.selected_safety_contract ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q1" />
    </div>
  )

  const renderQ2 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 2 of 7</div>
      <h2 className="ns-hc-question-text">How is this safety contract currently slowing down your flow?</h2>
      <p className="ns-hc-question-subtext">Tell us how it's limiting the pursuit of your ambitions</p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Example: It stops me from posting content consistently because I'm afraid of judgment..."
          value={responses.limiting_impact}
          onChange={(e) => setResponses(prev => ({ ...prev, limiting_impact: e.target.value }))}
        />
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q3')}
        disabled={!responses.limiting_impact.trim()}
        style={{ opacity: responses.limiting_impact.trim() ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q2" />
    </div>
  )

  const renderQ3 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 3 of 7</div>
      <h2 className="ns-hc-question-text">Can you think of a time when you may have learned this belief?</h2>
      <p className="ns-hc-question-subtext">
        You didn't wake up believing "<span className="ns-hc-highlight">{responses.selected_safety_contract}</span>".
        Something happened that created it. This is the emotional splinter we're looking to remove.
      </p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Example: When I was 12, I shared a creative project I was proud of in class..."
          value={responses.past_parallel_story}
          onChange={(e) => setResponses(prev => ({ ...prev, past_parallel_story: e.target.value }))}
        />
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q4')}
        disabled={!responses.past_parallel_story.trim()}
        style={{ opacity: responses.past_parallel_story.trim() ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q3" />
    </div>
  )

  const renderQ4 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 4 of 7</div>
      <h2 className="ns-hc-question-text">What happened back then?</h2>
      <p className="ns-hc-question-subtext">Is there a particular moment or series of events that felt painful or uncomfortable?</p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Example: My classmates laughed at it. The teacher said nothing. I felt completely exposed and embarrassed..."
          value={responses.past_event_details}
          onChange={(e) => setResponses(prev => ({ ...prev, past_event_details: e.target.value }))}
        />
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q5')}
        disabled={!responses.past_event_details.trim()}
        style={{ opacity: responses.past_event_details.trim() ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q4" />
    </div>
  )

  const renderQ5 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 5 of 7</div>
      <h2 className="ns-hc-question-text">If you're okay revisiting this experience... when it happened, how did you feel afterwards?</h2>
      <p className="ns-hc-question-subtext">What emotions came up? Shame, embarrassment, fear?</p>

      <div className="ns-hc-text-input-container">
        <textarea
          className="ns-hc-text-area"
          placeholder="Example: Deep shame. I felt like I could never share my creative work again. I decided it was safer to stay invisible..."
          value={responses.past_event_emotions}
          onChange={(e) => setResponses(prev => ({ ...prev, past_event_emotions: e.target.value }))}
        />
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => setCurrentScreen('q6')}
        disabled={!responses.past_event_emotions.trim()}
        style={{ opacity: responses.past_event_emotions.trim() ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q5" />
    </div>
  )

  const renderQ6 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">{viewingResults ? 'Your Results' : 'Question 6 of 7'}</div>
      <h2 className="ns-hc-question-text">Now we can see how this belief formed</h2>

      <div className="ns-hc-result-box" style={{ marginTop: 32 }}>
        <p>This experience — <span className="ns-hc-highlight">{responses.past_event_details}</span> — and feeling <span className="ns-hc-highlight">{responses.past_event_emotions}</span> was so impactful that your system decided to protect you from ever having the same experience again.</p>
        <p style={{ marginTop: 16 }}>That's why it created this belief: <span className="ns-hc-highlight">"{responses.selected_safety_contract}"</span></p>
        <p style={{ marginTop: 16 }}>To protect you, it now doesn't feel safe doing anything that might create that experience again.</p>
        {!viewingResults && <p style={{ marginTop: 16 }}>Make sense?</p>}
      </div>

      {viewingResults ? (
        <button className="ns-hc-primary-button" onClick={() => navigate('/7-day-challenge')}>
          ← Back to 7-Day Challenge
        </button>
      ) : (
        <>
          <button
            className="ns-hc-primary-button"
            onClick={() => {
              setResponses(prev => ({ ...prev, connect_dots_acknowledged: true }))
              setCurrentScreen('q7')
            }}
          >
            Yes, I see it
          </button>
          <BackButton fromScreen="q6" />
        </>
      )}
    </div>
  )

  const renderQ7 = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Emotional Splinter</h1>
      <div className="ns-hc-welcome-message animated-text">
        <p>So even though your essence has been pulling you <strong>forward</strong> in the pursuit of your ambitions...</p>
        <p>Your subconscious has been pulling you <strong>back</strong> in its attempt to protect you.</p>
        <p>This is the emotional splinter. A past hurt that never fully healed.</p>
        <p>Keen to finally remove it?</p>
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => {
          setResponses(prev => ({ ...prev, splinter_removal_consent: true }))
          setCurrentScreen('q8')
        }}
      >
        Yes, let's do it!
      </button>
      <BackButton fromScreen="q7" />
    </div>
  )

  const renderQ8 = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Healing Process</h1>
      <div className="ns-hc-welcome-message">
        <p>Amazing! You have two options to remove this emotional splinter:</p>
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => saveAndComplete('continue_challenge')}
      >
        Continue 7-Day Challenge
      </button>

      <button
        className="ns-hc-secondary-button"
        onClick={() => saveAndComplete('book_session')}
      >
        Book 1-on-1 Emotional Splinter Release Session
      </button>
    </div>
  )

  const renderNoResults = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">No Results Found</h1>
      <div className="ns-hc-welcome-message">
        <p>It looks like you haven't completed the Healing Compass yet.</p>
        <p>To get started, you'll first need to complete the <strong>Nervous System Map</strong> to identify your safety contracts.</p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => navigate('/nervous-system')}>
        Go to Nervous System Map
      </button>
      <button className="ns-hc-secondary-button" onClick={() => navigate('/me')}>
        Back to Home
      </button>
    </div>
  )

  const renderLoading = () => (
    <div className="ns-hc-container ns-hc-processing-container">
      <div className="ns-hc-spinner"></div>
      <div className="ns-hc-processing-text">Loading your safety contracts...</div>
    </div>
  )

  return (
    <div className="ns-hc-app">
      {/* Progress Dots */}
      {currentScreen !== 'loading' && currentScreen !== 'no-results' && (
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
      )}

      {/* Screen Content */}
      {currentScreen === 'loading' && renderLoading()}
      {currentScreen === 'no-results' && renderNoResults()}
      {currentScreen === 'time_check' && renderTimeCheck()}
      {currentScreen === 'journey' && renderJourney()}
      {currentScreen === 'welcome' && renderWelcome()}
      {currentScreen === 'q1' && renderQ1()}
      {currentScreen === 'q2' && renderQ2()}
      {currentScreen === 'q3' && renderQ3()}
      {currentScreen === 'q4' && renderQ4()}
      {currentScreen === 'q5' && renderQ5()}
      {currentScreen === 'q6' && renderQ6()}
      {currentScreen === 'q7' && renderQ7()}
      {currentScreen === 'q8' && renderQ8()}
    </div>
  )
}
