import { useState, useEffect, useRef } from 'react'
import { resolvePrompt } from './lib/promptResolver'
import { supabase } from './lib/supabaseClient'

function App() {
  const [flow, setFlow] = useState(null)
  const [messages, setMessages] = useState([])
  const [context, setContext] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  // Load flow JSON
  useEffect(() => {
    const loadFlow = async () => {
      try {
        const response = await fetch('/lead-magnet.json')
        if (!response.ok) throw new Error('Failed to load flow')
        const data = await response.json()
        
        // Sort steps by step_order_index
        const sortedSteps = data.steps.sort((a, b) => a.step_order_index - b.step_order_index)
        setFlow({ ...data, steps: sortedSteps })
        
        // Start with first message
        const firstStep = sortedSteps[0]
        const firstPrompt = resolvePrompt(firstStep, {})
        setMessages([{
          id: 'ai-0',
          isAI: true,
          text: firstPrompt,
          timestamp: new Date().toLocaleTimeString()
        }])
      } catch (err) {
        setError(`Failed to load flow: ${err.message}`)
      }
    }
    
    loadFlow()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentStep = flow?.steps?.[currentIndex]

  // Function to update persona in Supabase
  const updatePersonaInSupabase = async (context) => {
    if (context.session_id && supabase && context.persona_selection) {
      try {
        console.log('🔄 Updating persona in Supabase for session:', context.session_id)
        const { data, error } = await supabase
          .from('lead_flow_profiles')
          .update({ persona: context.persona_selection })
          .eq('session_id', context.session_id)

        if (error) {
          console.error('❌ Failed to update persona:', error)
        } else {
          console.log('✅ Persona updated successfully:', data)
        }
      } catch (err) {
        console.error('❌ Error updating persona:', err)
      }
    }
  }

  const handleSubmit = async () => {
    console.log('🚀 handleSubmit called')
    console.log('Current step:', currentStep?.step)
    console.log('Input text:', inputText)
    
    if (!currentStep || isLoading || !inputText.trim()) {
      console.log('❌ Early return - no currentStep, isLoading, or no input')
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
      console.log('📝 Stored in context:', currentStep.tag_as, '=', trimmedInput)
    }
    if (currentStep.store_as) {
      newContext[currentStep.store_as] = true
    }

    console.log('📊 Full context after update:', newContext)

    setContext(newContext)
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // Check if this is the email step - save to Supabase
    console.log('🔍 Checking if this is email step:', currentStep.step === 'lead_q7_email_capture')
    console.log('🔍 Supabase available:', !!supabase)
    
    if (currentStep.step === 'lead_q7_email_capture' && supabase) {
      console.log('💾 SAVING TO SUPABASE - Email step detected!')
      try {
        // Generate session ID for anonymous users
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Store session_id in context for later use
        newContext.session_id = sessionId
        
        const profileData = {
          session_id: sessionId,
          user_name: newContext.user_name,
          protective_archetype: newContext.protective_archetype_selection,
          protective_confirm: newContext.protective_archetype_reflect,
          essence_archetype: newContext.essence_archetype_selection,
          essence_confirm: newContext.essence_archetype_reflect,
          persona: newContext.persona_selection || null, // Will be null since persona comes after email
          email: trimmedInput,
          context: newContext
        }
        
        console.log('📤 Sending to Supabase:', profileData)

        const { data, error } = await supabase
          .from('lead_flow_profiles')
          .insert([profileData])

        if (error) {
          console.error('❌ Supabase error:', error)
          throw error
        }
        console.log('✅ Profile saved successfully:', data)
      } catch (err) {
        console.error('❌ Failed to save profile:', err)
        // Continue with flow even if save fails
      }
    } else if (currentStep.step === 'lead_q7_email_capture' && !supabase) {
      console.warn('⚠️ Supabase not configured - profile not saved')
    } else {
      console.log('ℹ️ Not email step or Supabase not available')
    }

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
      // Flow completed - update persona if this is the final step
      await updatePersonaInSupabase(newContext)
      
      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: "🎉 Congratulations! You've completed the flow. Check your email for your profile link!",
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
      // Flow completed - update persona if this is the final step
      await updatePersonaInSupabase(newContext)
      
      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: "🎉 Congratulations! You've completed the flow. Check your email for your profile link!",
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
        <h1>Find My Flow</h1>
        <p>Discover your archetypes and unlock your potential</p>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                <div className="text">{message.text}</div>
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
              placeholder={currentStep.tag_as === 'user_name' ? 'Type your name...' : 'Share your thoughts...'}
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
      </main>
    </div>
  )
}

export default App
