import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { completeFlowQuest } from './lib/questCompletion'
import './NervousSystemHealingCompass.css'

export default function HealingCompass() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('loading')
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

  const totalScreens = 9
  const currentScreenIndex = getScreenIndex(currentScreen)

  function getScreenIndex(screen) {
    const screenMap = {
      'loading': 0,
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

  // Load safety contracts from Nervous System flow
  useEffect(() => {
    loadSafetyContracts()
  }, [user])

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
          setCurrentScreen('welcome')
        }
        // Fallback: Extract YES contracts from belief_test_results
        else if (data[0].belief_test_results) {
          const yesContracts = Object.entries(data[0].belief_test_results)
            .filter(([_, response]) => response === 'yes')
            .map(([contract]) => contract)

          if (yesContracts.length > 0) {
            setSafetyContracts(yesContracts)
            setCurrentScreen('welcome')
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

  const renderWelcome = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">Healing Compass</h1>
      <div className="ns-hc-welcome-message">
        <p><strong>Hey {user?.user_metadata?.name || 'there'}!</strong> I'm excited to dive deeper with you.</p>
        <p>Our mission here is to find the <strong>source</strong> of what's blocking your flow so we can heal it.</p>
        <p>In the Nervous System flow, you identified safety contracts that have been protecting you.</p>
        <p>Now let's trace one back to its origin — and remove the emotional splinter driving it.</p>
      </div>

      <button className="ns-hc-primary-button" onClick={() => setCurrentScreen('q1')}>
        Let's Begin
      </button>
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
      >
        Continue
      </button>
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
      >
        Continue
      </button>
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
      >
        Continue
      </button>
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
      >
        Continue
      </button>
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
      >
        Continue
      </button>
    </div>
  )

  const renderQ6 = () => (
    <div className="ns-hc-container ns-hc-question-container">
      <div className="ns-hc-question-number">Question 6 of 7</div>
      <h2 className="ns-hc-question-text">Now we can see how this belief formed</h2>

      <div className="ns-hc-result-box" style={{ marginTop: 32 }}>
        <p>This experience — <span className="ns-hc-highlight">{responses.past_event_details}</span> — and feeling <span className="ns-hc-highlight">{responses.past_event_emotions}</span> was so impactful that your system decided to protect you from ever having the same experience again.</p>
        <p style={{ marginTop: 16 }}>That's why it created this belief: <span className="ns-hc-highlight">"{responses.selected_safety_contract}"</span></p>
        <p style={{ marginTop: 16 }}>To protect you, it now doesn't feel safe doing anything that might create that experience again.</p>
        <p style={{ marginTop: 16 }}>Make sense?</p>
      </div>

      <button
        className="ns-hc-primary-button"
        onClick={() => {
          setResponses(prev => ({ ...prev, connect_dots_acknowledged: true }))
          setCurrentScreen('q7')
        }}
      >
        Yes, I see it
      </button>
    </div>
  )

  const renderQ7 = () => (
    <div className="ns-hc-container ns-hc-welcome-container">
      <h1 className="ns-hc-welcome-greeting">The Emotional Splinter</h1>
      <div className="ns-hc-welcome-message">
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

  const renderLoading = () => (
    <div className="ns-hc-container ns-hc-processing-container">
      <div className="ns-hc-spinner"></div>
      <div className="ns-hc-processing-text">Loading your safety contracts...</div>
    </div>
  )

  return (
    <div className="ns-hc-app">
      {/* Progress Dots */}
      {currentScreen !== 'loading' && (
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
