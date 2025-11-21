import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolvePrompt } from './lib/promptResolver'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { completeFlowQuest, hasActiveChallenge } from './lib/questCompletion'
import { sanitizeText } from './lib/sanitize'

function HealingCompass() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [flow, setFlow] = useState(null)
  const [messages, setMessages] = useState([])
  const [context, setContext] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [leadMagnetData, setLeadMagnetData] = useState(null)
  const [hasChallenge, setHasChallenge] = useState(false)
  const [safetyContracts, setSafetyContracts] = useState([]) // Safety contracts from nervous system flow
  const messagesEndRef = useRef(null)

  // Fetch safety contracts from nervous system responses
  const fetchSafetyContracts = async () => {
    if (!user?.id) return []

    try {
      console.log('🔍 Fetching safety contracts from nervous system responses...')

      const { data, error } = await supabase
        .from('nervous_system_responses')
        .select('safety_contracts')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('❌ Error fetching safety contracts:', error)
        return []
      }

      if (data && data.length > 0 && data[0].safety_contracts) {
        console.log('✅ Safety contracts fetched:', data[0].safety_contracts)
        return data[0].safety_contracts
      } else {
        console.warn('⚠️ No safety contracts found')
        return []
      }
    } catch (err) {
      console.error('❌ Error fetching safety contracts:', err)
      return []
    }
  }

  // Fetch lead magnet data from Supabase
  const fetchLeadMagnetData = async () => {
    if (!supabase) {
      console.warn('⚠️ Supabase not available - using fallback data')
      return {
        user_name: 'User',
        protective_archetype: 'Unknown'
      }
    }

    try {
      console.log('🔍 Fetching lead magnet data from Supabase...')
      
      // Get the most recent profile for this authenticated user
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('user_name, protective_archetype, essence_archetype, persona')
        .eq('email', user?.email) // Filter by authenticated user's email
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('❌ Error fetching lead magnet data:', error)
        return {
          user_name: 'User',
          protective_archetype: 'Unknown'
        }
      }

      if (data && data.length > 0) {
        console.log('✅ Lead magnet data fetched:', data[0])
        return data[0]
      } else {
        console.warn('⚠️ No lead magnet data found')
        return {
          user_name: 'User',
          protective_archetype: 'Unknown'
        }
      }
    } catch (err) {
      console.error('❌ Error fetching lead magnet data:', err)
      return {
        user_name: 'User',
        protective_archetype: 'Unknown'
      }
    }
  }

  // Load healing compass flow JSON and lead magnet data
  useEffect(() => {
    const loadFlow = async () => {
      try {
        // Fetch lead magnet data first
        const leadData = await fetchLeadMagnetData()
        setLeadMagnetData(leadData)

        // Fetch safety contracts from nervous system flow
        const contracts = await fetchSafetyContracts()
        setSafetyContracts(contracts)

        // Check if user has active challenge
        if (user?.id) {
          const active = await hasActiveChallenge(user.id)
          setHasChallenge(active)
        }

        // Format safety contracts as a bullet list for display
        const safetyContractsList = contracts.length > 0
          ? contracts.map(c => `• "${c}"`).join('\n')
          : '• No safety contracts found'

        // Update context with lead magnet data, safety contracts, and challenge status
        const updatedContext = {
          user_name: leadData.user_name,
          protective_archetype: leadData.protective_archetype,
          safety_contracts: contracts,
          safety_contracts_list: safetyContractsList,
          CHALLENGE_ACTION: hasChallenge ? 'continue' : 'start',
          CHALLENGE_ACTION_LOWER: hasChallenge ? 'continue' : 'start'
        }
        setContext(updatedContext)

        // Load healing compass flow
        // Add cache-busting timestamp in development to always get latest version
        const response = await fetch(`/Healing_compass_flow.json?t=${Date.now()}`)
        if (!response.ok) throw new Error('Failed to load healing compass flow')
        const flowData = await response.json()
        setFlow(flowData)
        
        // Start with the first step using the updated context
        if (flowData.steps && flowData.steps.length > 0) {
          const firstStep = flowData.steps[0]
          const responseText = await resolvePrompt(firstStep, updatedContext)
          const aiMessage = {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: responseText,
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages([aiMessage])
        }
      } catch (err) {
        console.error('Error loading healing compass flow:', err)
        setError('Failed to load healing compass flow')
      }
    }

    loadFlow()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentStep = flow?.steps?.[currentIndex]

  const handleSubmit = async () => {
    console.log('🚀 Healing Compass handleSubmit called')
    console.log('Current step:', currentStep?.step)
    console.log('Input text:', inputText)
    
    if (!currentStep || isLoading || !inputText.trim()) {
      return
    }

    const trimmedInput = inputText.trim()
    const sanitizedInput = sanitizeText(trimmedInput) // ✅ Sanitize user input
    setIsLoading(true)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: sanitizedInput,
      timestamp: new Date().toLocaleTimeString()
    }

    // Update context
    const newContext = { ...context }
    if (currentStep.tag_as) {
      newContext[currentStep.tag_as] = sanitizedInput
    }
    if (currentStep.store_as) {
      newContext[currentStep.store_as] = true
    }

    setContext(newContext)
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // Move to next step
    const nextIndex = currentIndex + 1
    const nextStep = flow?.steps?.[nextIndex]

    if (nextStep) {
      // Add AI response
      const responseText = await resolvePrompt(nextStep, newContext)
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
      setCurrentIndex(nextIndex)
    } else {
      // Flow completed - save to Supabase
      if (supabase) {
        // Validate user is authenticated before saving
        if (!user?.id) {
          console.error('❌ User not authenticated - cannot save healing compass data')
          const errorMessage = {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: "⚠️ Please sign in to save your healing compass responses.",
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, errorMessage])
          setIsLoading(false)
          return
        }

        try {
          console.log('💾 SAVING HEALING COMPASS DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('healing_compass_responses')
            .insert([{
              user_id: user.id,
              user_name: newContext.user_name || 'Anonymous',
              selected_safety_contract: newContext.selected_safety_contract,
              limiting_impact: newContext.limiting_impact,
              past_parallel_story: newContext.past_parallel_story,
              past_event_details: newContext.past_event_details,
              past_event_emotions: newContext.past_event_emotions,
              connect_dots_acknowledged: newContext.connect_dots_acknowledged,
              splinter_removal_consent: newContext.splinter_removal_consent,
              challenge_enrollment_consent: newContext.challenge_enrollment_consent,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
            throw error
          }
          console.log('✅ Healing compass data saved successfully:', data)

          // Auto-complete challenge quest if user has active challenge
          if (user?.id) {
            console.log('🎯 Attempting to complete flow quest for healing_compass')
            const questResult = await completeFlowQuest({
              userId: user.id,
              flowId: 'healing_compass',
              pointsEarned: 20
            })

            if (questResult.success) {
              console.log('✅ Quest completed!', questResult.message)
            } else {
              console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
            }
          }
        } catch (err) {
          console.error('❌ Failed to save healing compass data:', err)
          // Continue with flow even if save fails
        }
      }

      // Flow completed - check if there's a navigation step
      const lastStep = flow?.steps?.[flow.steps.length - 1]
      if (lastStep?.navigate_to) {
        const finalMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          kind: 'navigation',
          text: await resolvePrompt(lastStep, newContext),
          navigateTo: lastStep.navigate_to,
          buttonText: hasChallenge ? 'Continue 7-Day Challenge' : 'Start 7-Day Challenge',
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, finalMessage])
      } else {
        const completionMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          kind: 'completion',
          text: "🎉 Congratulations! You've completed the Healing Compass flow. Return to your profile to continue your journey:",
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, completionMessage])
      }
    }

    setIsLoading(false)
  }

  const handleOptionClick = async (option) => {
    if (!currentStep || isLoading) return

    const optionValue = option.value || option.label
    setIsLoading(true)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: option.label,
      timestamp: new Date().toLocaleTimeString()
    }

    // Update context
    const newContext = { ...context }
    if (currentStep.tag_as) {
      newContext[currentStep.tag_as] = optionValue
    }
    if (currentStep.store_as) {
      newContext[currentStep.store_as] = true
    }

    setContext(newContext)
    setMessages(prev => [...prev, userMessage])

    // Check if option has an external link - if so, open in new tab and complete flow
    if (option.external_link && option.url) {
      console.log('🔗 Opening external link in new tab:', option.url)

      // Save to Supabase before opening external link
      if (supabase && user?.id) {
        try {
          console.log('💾 SAVING HEALING COMPASS DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('healing_compass_responses')
            .insert([{
              user_id: user.id,
              user_name: newContext.user_name || 'Anonymous',
              selected_safety_contract: newContext.selected_safety_contract,
              limiting_impact: newContext.limiting_impact,
              past_parallel_story: newContext.past_parallel_story,
              past_event_details: newContext.past_event_details,
              past_event_emotions: newContext.past_event_emotions,
              connect_dots_acknowledged: newContext.connect_dots_acknowledged,
              splinter_removal_consent: newContext.splinter_removal_consent,
              challenge_enrollment_consent: newContext.challenge_enrollment_consent,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
          } else {
            console.log('✅ Healing compass data saved successfully:', data)
          }

          // Auto-complete challenge quest
          console.log('🎯 Attempting to complete flow quest for healing_compass')
          const questResult = await completeFlowQuest({
            userId: user.id,
            flowId: 'healing_compass',
            pointsEarned: 20
          })

          if (questResult.success) {
            console.log('✅ Quest completed!', questResult.message)
          } else {
            console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
          }
        } catch (err) {
          console.error('❌ Failed to save healing compass data:', err)
        }
      }

      // Open external link in new tab
      window.open(option.url, '_blank', 'noopener,noreferrer')

      // Show completion message
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Healing Compass flow. Your session booking will open in a new tab.",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])
      setIsLoading(false)
      return
    }

    // Check if option has navigate_to - if so, save data and navigate
    if (option.navigate_to) {
      console.log('🧭 Option has navigate_to, saving data and navigating to:', option.navigate_to)

      // Save to Supabase before navigating
      if (supabase && user?.id) {
        try {
          console.log('💾 SAVING HEALING COMPASS DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('healing_compass_responses')
            .insert([{
              user_id: user.id,
              user_name: newContext.user_name || 'Anonymous',
              selected_safety_contract: newContext.selected_safety_contract,
              limiting_impact: newContext.limiting_impact,
              past_parallel_story: newContext.past_parallel_story,
              past_event_details: newContext.past_event_details,
              past_event_emotions: newContext.past_event_emotions,
              connect_dots_acknowledged: newContext.connect_dots_acknowledged,
              splinter_removal_consent: newContext.splinter_removal_consent,
              challenge_enrollment_consent: newContext.challenge_enrollment_consent,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
          } else {
            console.log('✅ Healing compass data saved successfully:', data)
          }

          // Auto-complete challenge quest
          console.log('🎯 Attempting to complete flow quest for healing_compass')
          const questResult = await completeFlowQuest({
            userId: user.id,
            flowId: 'healing_compass',
            pointsEarned: 20
          })

          if (questResult.success) {
            console.log('✅ Quest completed!', questResult.message)
          } else {
            console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
          }
        } catch (err) {
          console.error('❌ Failed to save healing compass data:', err)
          // Continue with navigation even if save fails
        }
      }

      setIsLoading(false)
      navigate(option.navigate_to)
      return
    }

    // Check if current step has navigate_to - if so, save data and navigate
    if (currentStep.navigate_to) {
      console.log('🧭 Step has navigate_to, saving data and navigating to:', currentStep.navigate_to)

      // Save to Supabase before navigating
      if (supabase && user?.id) {
        try {
          console.log('💾 SAVING HEALING COMPASS DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('healing_compass_responses')
            .insert([{
              user_id: user.id,
              user_name: newContext.user_name || 'Anonymous',
              selected_safety_contract: newContext.selected_safety_contract,
              limiting_impact: newContext.limiting_impact,
              past_parallel_story: newContext.past_parallel_story,
              past_event_details: newContext.past_event_details,
              past_event_emotions: newContext.past_event_emotions,
              connect_dots_acknowledged: newContext.connect_dots_acknowledged,
              splinter_removal_consent: newContext.splinter_removal_consent,
              challenge_enrollment_consent: newContext.challenge_enrollment_consent,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
          } else {
            console.log('✅ Healing compass data saved successfully:', data)
          }

          // Auto-complete challenge quest if user has active challenge
          console.log('🎯 Attempting to complete flow quest for healing_compass')
          const questResult = await completeFlowQuest({
            userId: user.id,
            flowId: 'healing_compass',
            pointsEarned: 20
          })

          if (questResult.success) {
            console.log('✅ Quest completed!', questResult.message)
          } else {
            console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
          }
        } catch (err) {
          console.error('❌ Failed to save healing compass data:', err)
          // Continue with navigation even if save fails
        }
      }

      setIsLoading(false)
      navigate(currentStep.navigate_to)
      return
    }

    // Move to next step
    const nextIndex = currentIndex + 1
    const nextStep = flow?.steps?.[nextIndex]

    if (nextStep) {
      // Add AI response
      const responseText = await resolvePrompt(nextStep, newContext)
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
      setCurrentIndex(nextIndex)
    } else {
      // Flow completed - save to Supabase
      if (supabase) {
        // Validate user is authenticated before saving
        if (!user?.id) {
          console.error('❌ User not authenticated - cannot save healing compass data')
          const errorMessage = {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: "⚠️ Please sign in to save your healing compass responses.",
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, errorMessage])
          setIsLoading(false)
          return
        }

        try {
          console.log('💾 SAVING HEALING COMPASS DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('healing_compass_responses')
            .insert([{
              user_id: user.id,
              user_name: newContext.user_name || 'Anonymous',
              selected_safety_contract: newContext.selected_safety_contract,
              limiting_impact: newContext.limiting_impact,
              past_parallel_story: newContext.past_parallel_story,
              past_event_details: newContext.past_event_details,
              past_event_emotions: newContext.past_event_emotions,
              connect_dots_acknowledged: newContext.connect_dots_acknowledged,
              splinter_removal_consent: newContext.splinter_removal_consent,
              challenge_enrollment_consent: newContext.challenge_enrollment_consent,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
            throw error
          }
          console.log('✅ Healing compass data saved successfully:', data)

          // Auto-complete challenge quest if user has active challenge
          if (user?.id) {
            console.log('🎯 Attempting to complete flow quest for healing_compass')
            const questResult = await completeFlowQuest({
              userId: user.id,
              flowId: 'healing_compass',
              pointsEarned: 20
            })

            if (questResult.success) {
              console.log('✅ Quest completed!', questResult.message)
            } else {
              console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
            }
          }
        } catch (err) {
          console.error('❌ Failed to save healing compass data:', err)
          // Continue with flow even if save fails
        }
      }

      // Flow completed - check if there's a navigation step
      const lastStep = flow?.steps?.[flow.steps.length - 1]
      if (lastStep?.navigate_to) {
        const finalMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          kind: 'navigation',
          text: await resolvePrompt(lastStep, newContext),
          navigateTo: lastStep.navigate_to,
          buttonText: hasChallenge ? 'Continue 7-Day Challenge' : 'Start 7-Day Challenge',
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, finalMessage])
      } else {
        const completionMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          kind: 'completion',
          text: "🎉 Congratulations! You've completed the Healing Compass flow. Return to your profile to continue your journey:",
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, completionMessage])
      }
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Helper function to resolve template variables in text
  const resolveText = (text) => {
    if (!text) return text
    let resolved = text
    Object.keys(context).forEach(key => {
      const placeholder = `{{${key}}}`
      if (resolved.includes(placeholder)) {
        resolved = resolved.replace(new RegExp(placeholder, 'g'), context[key])
      }
    })
    return resolved
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          {error}
        </div>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="app">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Healing Compass</h1>
        <p>Identify your emotional splinters and unlock your potential</p>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                {message.kind === 'completion' ? (
                  <div className="text">
                    {message.text}
                    <div style={{ marginTop: 8 }}>
                      <Link to="/me" style={{ color: '#5e17eb', textDecoration: 'underline' }}>
                        Return to your profile
                      </Link>
                    </div>
                  </div>
                ) : message.kind === 'navigation' ? (
                  <div className="text">
                    {message.text}
                    <div style={{ marginTop: 16 }}>
                      <button
                        className="option-button"
                        onClick={() => navigate(message.navigateTo)}
                        style={{ width: '100%' }}
                      >
                        {message.buttonText}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text">{message.text}</div>
                )}
                <div className="timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai">
              <div className="bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Dynamic options from safety_contracts */}
      {currentStep?.options_from === 'safety_contracts' && safetyContracts.length > 0 && (
        <div className="options-container">
          {safetyContracts.map((contract, index) => (
            <button
              key={index}
              className="option-button"
              onClick={() => handleOptionClick({ label: contract, value: contract })}
              disabled={isLoading}
              style={{ textAlign: 'left', whiteSpace: 'normal' }}
            >
              {contract}
            </button>
          ))}
        </div>
      )}

      {/* Static options */}
      {currentStep?.options && currentStep.options.length > 0 && !currentStep.options_from && (
        <div className="options-container">
          {currentStep.options.map((option, index) => (
            <button
              key={index}
              className="option-button"
              onClick={() => handleOptionClick(option)}
              disabled={isLoading}
            >
              {resolveText(option.label)}
            </button>
          ))}
        </div>
      )}

      {currentStep && !currentStep.options && !currentStep.options_from && (
        <div className="input-bar">
          <textarea
            className="message-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            disabled={isLoading}
            rows={1}
          />
          <button
            className="send-button"
            onClick={handleSubmit}
            disabled={isLoading || !inputText.trim()}
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

export default HealingCompass
