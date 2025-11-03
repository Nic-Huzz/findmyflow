import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabaseClient'
import { resolvePrompt } from './lib/promptResolver'
import HybridArchetypeFlow from './HybridArchetypeFlow'

const App = () => {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [currentStep, setCurrentStep] = useState(null)
  const [context, setContext] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [flowData, setFlowData] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [showHybridFlow, setShowHybridFlow] = useState(false)
  const [hybridFlowType, setHybridFlowType] = useState(null) // 'protective' or 'essence'
  const [hybridFlowResult, setHybridFlowResult] = useState(null)
  
  const messagesEndRef = useRef(null)

  // Generate session ID
  useEffect(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(sessionId)
  }, [])

  // Load flow data
  useEffect(() => {
    const loadFlow = async () => {
      try {
        const response = await fetch('/lead-magnet-slide-flow.json')
        const data = await response.json()
        setFlowData(data)
        
        // Start with first step
        const firstStep = data.steps.find(step => step.step_order_index === 1.0)
        if (firstStep) {
          setCurrentStep(firstStep)
          const resolvedPrompt = resolvePrompt(firstStep, {})
          setMessages([{
            id: Date.now(),
            text: resolvedPrompt,
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString()
          }])
        }
      } catch (error) {
        console.error('Error loading flow:', error)
      }
    }
    
    loadFlow()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle hybrid flow completion
  const handleHybridFlowComplete = (result) => {
    console.log('Hybrid flow completed:', result)
    setHybridFlowResult(result)
    setShowHybridFlow(false)
    
    // Update context with the result
    const fieldName = hybridFlowType === 'protective' ? 'protective_archetype_selection' : 'essence_archetype_selection'
    const newContext = {
      ...context,
      [fieldName]: result.name
    }
    console.log('Storing archetype result:', { fieldName, archetypeName: result.name, fullResult: result })
    setContext(newContext)
    
    // Continue to next step with updated context
    moveToNextStep(newContext)
  }

  // Move to next step
  const moveToNextStep = (updatedContext = null) => {
    if (!flowData) return
    
    const currentIndex = flowData.steps.findIndex(step => step.step === currentStep.step)
    const nextStep = flowData.steps[currentIndex + 1]
    
    if (nextStep) {
      setCurrentStep(nextStep)
      
      // Check if next step is hybrid flow
      if (nextStep.step_type === 'hybrid_swipe') {
        setHybridFlowType(nextStep.archetype_type)
        setShowHybridFlow(true)
      } else {
        // Regular step - add AI message with resolved prompt
        const contextToUse = updatedContext || context
        const resolvedPrompt = resolvePrompt(nextStep, contextToUse)
        console.log('Resolving prompt for step:', nextStep.step, 'with context:', contextToUse)
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: resolvedPrompt,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString()
        }])
      }
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Update context with user input
      const newContext = {
        ...context,
        [currentStep.tag_as]: inputText
      }
      setContext(newContext)

      // Check if this step should save to database
      if (currentStep.save_to_db) {
        console.log('Saving to Supabase...')
        
        const { data, error } = await supabase
          .from('lead_flow_profiles')
          .insert({
            session_id: sessionId,
            user_name: newContext.user_name || null,
            user_email: newContext.user_email || null,
            protective_archetype_selection: newContext.protective_archetype_selection || null,
            essence_archetype_selection: newContext.essence_archetype_selection || null,
            persona_selection: newContext.persona_selection || null,
            created_at: new Date().toISOString()
          })
          .select()

        if (error) {
          console.error('Supabase error:', error)
        } else {
          console.log('Profile saved successfully:', data)
        }
      }

      // Move to next step
      moveToNextStep()

    } catch (error) {
      console.error('Error processing step:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle option selection
  const handleOptionSelect = (option) => {
    const userMessage = {
      id: Date.now(),
      text: option.label,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Update context
    const newContext = {
      ...context,
      [currentStep.tag_as]: option.value
    }
    setContext(newContext)

    // Move to next step
    setTimeout(() => {
      moveToNextStep()
      setIsLoading(false)
    }, 1000)
  }

  // Render hybrid flow
  if (showHybridFlow) {
    return (
      <div className="app">
        <HybridArchetypeFlow
          archetypeType={hybridFlowType}
          onComplete={handleHybridFlowComplete}
          onBack={() => setShowHybridFlow(false)}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Find Your Flow</h1>
      </div>
      
      <div className="chat-container">
        <div className="messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender === 'ai' ? 'ai' : 'user'}`}>
              <div className="bubble">
                <div className="text">
                  {message.text}
                </div>
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
      </div>

       {currentStep && currentStep.options && (
         <div className="options-container">
           {currentStep.options.map((option, index) => (
             <button
               key={index}
               className="option-button"
               onClick={() => handleOptionSelect(option)}
               disabled={isLoading}
             >
               {option.label}
             </button>
           ))}
         </div>
       )}

      {currentStep && !currentStep.options && !showHybridFlow && (
        <form onSubmit={handleSubmit} className="input-bar">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your response..."
            disabled={isLoading}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isLoading}
            className="send-button"
          >
            Send
          </button>
        </form>
      )}
    </div>
  )
}

export default App