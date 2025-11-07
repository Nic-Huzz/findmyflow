import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { resolvePrompt } from './lib/promptResolver'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { completeFlowQuest } from './lib/questCompletion'

function HealingCompass() {
  const { user } = useAuth()
  const [flow, setFlow] = useState(null)
  const [messages, setMessages] = useState([])
  const [context, setContext] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [leadMagnetData, setLeadMagnetData] = useState(null)
  const messagesEndRef = useRef(null)

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
        
        // Update context with lead magnet data
        const updatedContext = {
          user_name: leadData.user_name,
          protective_archetype: leadData.protective_archetype
        }
        setContext(updatedContext)

        // Load healing compass flow
        const response = await fetch('/Healing_compass_flow.json')
        if (!response.ok) throw new Error('Failed to load healing compass flow')
        const flowData = await response.json()
        setFlow(flowData)
        
        // Start with the first step using the updated context
        if (flowData.steps && flowData.steps.length > 0) {
          const firstStep = flowData.steps[0]
          const responseText = resolvePrompt(firstStep, updatedContext)
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
    setIsLoading(true)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: trimmedInput,
      timestamp: new Date().toLocaleTimeString()
    }

    // Update context
    const newContext = { ...context }
    if (currentStep.tag_as) {
      newContext[currentStep.tag_as] = trimmedInput
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
      const responseText = resolvePrompt(nextStep, newContext)
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
        try {
          console.log('💾 SAVING HEALING COMPASS DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('healing_compass_responses')
            .insert([{
              user_name: newContext.user_name || 'Anonymous',
              stuck_gap_description: newContext.stuck_gap_description,
              stuck_reason: newContext.stuck_reason_list, // Fixed field name
              stuck_emotional_response: newContext.stuck_emotional_response,
              past_parallel_story: newContext.past_parallel_story,
              past_event_emotions: newContext.past_event_emotions,
              splinter_interpretation: newContext.splinter_interpretation,
              connect_dots_consent: newContext.connect_dots_consent,
              connect_dots_acknowledged: newContext.connect_dots_acknowledged,
              splinter_removal_consent: newContext.splinter_removal_consent,
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

      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Healing Compass flow. Return to your profile to continue your journey:",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])
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

    // Move to next step
    const nextIndex = currentIndex + 1
    const nextStep = flow?.steps?.[nextIndex]

    if (nextStep) {
      // Add AI response
      const responseText = resolvePrompt(nextStep, newContext)
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
        try {
          console.log('💾 SAVING HEALING COMPASS DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('healing_compass_responses')
            .insert([{
              user_name: newContext.user_name || 'Anonymous',
              stuck_gap_description: newContext.stuck_gap_description,
              stuck_reason: newContext.stuck_reason_list, // Fixed field name
              stuck_emotional_response: newContext.stuck_emotional_response,
              past_parallel_story: newContext.past_parallel_story,
              past_event_emotions: newContext.past_event_emotions,
              splinter_interpretation: newContext.splinter_interpretation,
              connect_dots_consent: newContext.connect_dots_consent,
              connect_dots_acknowledged: newContext.connect_dots_acknowledged,
              splinter_removal_consent: newContext.splinter_removal_consent,
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

      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Healing Compass flow. Return to your profile to continue your journey:",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
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

      {currentStep?.options && currentStep.options.length > 0 && (
        <div className="options-container">
          {currentStep.options.map((option, index) => (
            <button
              key={index}
              className="option-button"
              onClick={() => handleOptionClick(option)}
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {currentStep && !currentStep.options && (
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
