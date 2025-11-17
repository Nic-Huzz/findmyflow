import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { resolvePrompt } from './lib/promptResolver'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import HybridArchetypeFlow from './HybridArchetypeFlow'

// Helper function to convert markdown to HTML for basic formatting
function formatMarkdown(text) {
  if (!text) return ''

  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

function App() {
  const { signInWithMagicLink } = useAuth()
  const [flow, setFlow] = useState(null)
  const [messages, setMessages] = useState([])
  const [context, setContext] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showHybridFlow, setShowHybridFlow] = useState(false)
  const [hybridFlowType, setHybridFlowType] = useState(null) // 'protective' or 'essence'
  const [isResending, setIsResending] = useState(false)
  const messagesEndRef = useRef(null)

  // Load flow JSON
  useEffect(() => {
    const loadFlow = async () => {
      try {
        const response = await fetch('/lead-magnet-slide-flow.json')
        if (!response.ok) throw new Error('Failed to load flow')
        const data = await response.json()
        
        // Sort steps by step_order_index
        const sortedSteps = data.steps.sort((a, b) => a.step_order_index - b.step_order_index)
        setFlow({ ...data, steps: sortedSteps })
        
        // Start with first message
        const firstStep = sortedSteps[0]
        const firstPrompt = await resolvePrompt(firstStep, {})
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

  // Handle hybrid flow completion
  const handleHybridFlowComplete = async (result) => {
    console.log('✅ Hybrid flow completed:', result)
    setShowHybridFlow(false)
    
    // Update context with the result
    const fieldName = hybridFlowType === 'protective' ? 'protective_archetype_selection' : 'essence_archetype_selection'
    const newContext = {
      ...context,
      [fieldName]: result.name,
      // Store completion flag
      [currentStep?.store_as]: true
    }
    console.log('📝 Storing archetype result:', { fieldName, archetypeName: result.name })
    setContext(newContext)
    
    // Move to next step
    const nextIndex = currentIndex + 1
    const nextStep = flow?.steps?.[nextIndex]
    
    if (nextStep) {
      // Add AI response with resolved prompt
      const responseText = await resolvePrompt(nextStep, newContext)
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, aiMessage])
      setCurrentIndex(nextIndex)
    }
  }

  // Move to next step - checks for hybrid_swipe type
  const moveToNextStep = async (updatedContext, skipHybridCheck = false) => {
    const contextToUse = updatedContext || context
    const nextIndex = currentIndex + 1
    const nextStep = flow?.steps?.[nextIndex]

    if (nextStep) {
      // Check if next step is hybrid flow
      if (!skipHybridCheck && nextStep.step_type === 'hybrid_swipe') {
        // Update index first so hybrid flow completion knows which step to store
        setCurrentIndex(nextIndex)
        setHybridFlowType(nextStep.archetype_type)
        setShowHybridFlow(true)
      } else {
        // Regular step - add AI message with resolved prompt
        const responseText = await resolvePrompt(nextStep, contextToUse)
        const aiMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          text: responseText,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, aiMessage])
        setCurrentIndex(nextIndex)
      }
    } else {
      // Flow completed
      return true // Signal completion
    }
    return false
  }

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
      // If persona was just selected, update Supabase immediately
      if (currentStep.tag_as === 'persona_selection') {
        await updatePersonaInSupabase(newContext)
      }
    }
    if (currentStep.store_as) {
      newContext[currentStep.store_as] = true
    }

    console.log('📊 Full context after update:', newContext)

    setContext(newContext)
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // Check if this step should persist profile to Supabase (flagged in flow JSON)
    const shouldSaveToDb = Boolean(currentStep.save_to_db) || currentStep.step === 'lead_q8_email_capture' // fallback check for step name
    console.log('🔍 Should save to DB:', shouldSaveToDb)
    console.log('🔍 Supabase available:', !!supabase)
    
    if (shouldSaveToDb && supabase) {
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
          email: trimmedInput.toLowerCase(), // Normalize to lowercase to match Supabase Auth
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
        
        // Send magic link after saving profile
        console.log('📧 Sending magic link to:', trimmedInput.toLowerCase())
        const magicLinkResult = await signInWithMagicLink(trimmedInput.toLowerCase())
        if (magicLinkResult.success) {
          console.log('✅ Magic link sent successfully')
          setMessages(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              isAI: true,
              text: `I've sent a magic link to ${trimmedInput}. Please check your inbox (and spam folder).`,
              timestamp: new Date().toLocaleTimeString()
            }
          ])
        } else {
          console.error('❌ Magic link failed:', magicLinkResult.message)
          setMessages(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              isAI: true,
              text: `Hmm, I couldn't send the magic link: ${magicLinkResult.message}. Please double-check your email or try again in a moment.`,
              timestamp: new Date().toLocaleTimeString()
            }
          ])
        }
      } catch (err) {
        console.error('❌ Failed to save profile:', err)
        // Continue with flow even if save fails
      }
    } else if (shouldSaveToDb && !supabase) {
      console.warn('⚠️ Supabase not configured - profile not saved')
    } else {
      console.log('ℹ️ Not email step or Supabase not available')
    }

    // Move to next step (check for hybrid flow)
    const flowCompleted = await moveToNextStep(newContext)

    if (flowCompleted) {
      // Flow completed - update persona if this is the final step
      await updatePersonaInSupabase(newContext)

      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the flow. Check your email for a magic link to access your profile, or if you can't see it, click below to resend.",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])

      // Move currentIndex beyond last step to hide options/inputs
      setCurrentIndex(flow.steps.length)
    }

    setIsLoading(false)
  }

  const handleOptionClick = async (option) => {
    if (!currentStep || isLoading) return

    const optionValue = option.value || option.label
    setIsLoading(true)

    // Handle "change" or "no" option - go back to swipe flow (dynamic approach)
    if (optionValue === 'change' || optionValue === 'no') {
      // Get the required input (which is the store_as from the previous swipe step)
      const requiredStoreAs = currentStep?.required_inputs?.[0]

      if (!requiredStoreAs) {
        console.warn('⚠️ No required_inputs found for current step')
        setIsLoading(false)
        return
      }

      // Find the swipe step that has this as its store_as
      const swipeStep = flow?.steps.find(step => step.store_as === requiredStoreAs)

      // Validate: ensure we found a hybrid_swipe step
      if (swipeStep && swipeStep.step_type === 'hybrid_swipe') {
        // Find the step index
        const targetStepIndex = flow?.steps.findIndex(step => step.step === swipeStep.step)

        if (targetStepIndex !== -1) {
          // Clear the previous selection and related context
          const newContext = { ...context }

          // Clear the archetype selection (tag_as from swipe step)
          if (swipeStep.tag_as) {
            delete newContext[swipeStep.tag_as]
          }

          // Clear the swipe step completion flag (store_as from swipe step)
          if (swipeStep.store_as) {
            delete newContext[swipeStep.store_as]
          }

          // Clear the reflection step completion flag (store_as from current step)
          if (currentStep.store_as) {
            delete newContext[currentStep.store_as]
          }

          setContext(newContext)

          // Go back to swipe flow using the step's archetype_type
          setCurrentIndex(targetStepIndex)
          setShowHybridFlow(true)
          setHybridFlowType(swipeStep.archetype_type)
          setIsLoading(false)
          return
        }
      } else {
        console.warn('⚠️ Swipe step not found or invalid step_type:', { requiredStoreAs, swipeStep })
        setIsLoading(false)
        return
      }
    }

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
      // If persona was just selected, update Supabase immediately
      if (currentStep.tag_as === 'persona_selection') {
        await updatePersonaInSupabase(newContext)
      }
    }
    if (currentStep.store_as) {
      newContext[currentStep.store_as] = true
    }

    setContext(newContext)
    setMessages(prev => [...prev, userMessage])

    // Move to next step (check for hybrid flow)
    const flowCompleted = await moveToNextStep(newContext)

    if (flowCompleted) {
      // Flow completed - update persona if this is the final step
      await updatePersonaInSupabase(newContext)

      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the flow. Check your email for a magic link to access your profile, or if you can't see it, click below to resend.",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])

      // Move currentIndex beyond last step to hide options
      setCurrentIndex(flow.steps.length)
    }

    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleResendEmail = async () => {
    const email = (context.user_email || context.email)?.toLowerCase()
    if (!email) {
      console.error('No email found in context')
      return
    }

    setIsResending(true)
    try {
      console.log('📧 Resending magic link to:', email)
      const magicLinkResult = await signInWithMagicLink(email)
      if (magicLinkResult.success) {
        console.log('✅ Magic link resent successfully')
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: `I've resent the magic link to ${email}. Please check your inbox (and spam folder).`,
            timestamp: new Date().toLocaleTimeString()
          }
        ])
      } else {
        console.error('❌ Magic link failed:', magicLinkResult.message)
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: `Hmm, I couldn't resend the magic link: ${magicLinkResult.message}. Please try again in a moment.`,
            timestamp: new Date().toLocaleTimeString()
          }
        ])
      }
    } catch (err) {
      console.error('❌ Failed to resend magic link:', err)
    } finally {
      setIsResending(false)
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

  // Render hybrid flow if active
  if (showHybridFlow && hybridFlowType) {
    return (
      <div className="app">
        <HybridArchetypeFlow
          archetypeType={hybridFlowType}
          onComplete={handleHybridFlowComplete}
          onBack={() => {
            setShowHybridFlow(false)
            // Optionally go back to previous step
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Find My Flow</h1>
        <p>Fulfil Your Ambitions Faster</p>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                {message.kind === 'completion' ? (
                  <div className="text">
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }} />
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={handleResendEmail}
                        disabled={isResending}
                        style={{
                          color: '#5e17eb',
                          textDecoration: 'underline',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 'inherit',
                          padding: 0,
                          fontFamily: 'inherit'
                        }}
                      >
                        {isResending ? 'Sending...' : 'Resend Email'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text" dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }} />
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
    </div>
  )
}

export default App
