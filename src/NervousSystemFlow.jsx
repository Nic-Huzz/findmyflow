import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { resolvePrompt } from './lib/promptResolver'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { completeFlowQuest } from './lib/questCompletion'

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

function NervousSystemFlow() {
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

      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('user_name, protective_archetype, essence_archetype, persona')
        .eq('email', user?.email)
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

  // Load nervous system flow JSON and lead magnet data
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

        // Load nervous system safety flow
        const response = await fetch('/nervous-system-safety-flow.json')
        if (!response.ok) throw new Error('Failed to load nervous system flow')
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
        console.error('Error loading nervous system flow:', err)
        setError('Failed to load nervous system flow')
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
    console.log('🚀 Nervous System Flow handleSubmit called')
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
        try {
          console.log('💾 SAVING NERVOUS SYSTEM DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('nervous_system_responses')
            .insert([{
              user_email: user?.email,
              user_name: newContext.user_name || 'Anonymous',
              impact_goal: newContext.impact_goal,
              income_goal: newContext.income_goal,
              positive_change: newContext.positive_change,
              current_struggle: newContext.struggle_area,
              belief_test_results: newContext.belief_test_results,
              reflection_text: newContext.pattern_mirrored,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
            throw error
          }
          console.log('✅ Nervous system data saved successfully:', data)

          // Auto-complete challenge quest if user has active challenge
          if (user?.id) {
            console.log('🎯 Attempting to complete flow quest for nervous_system')
            const questResult = await completeFlowQuest({
              userId: user.id,
              flowId: 'nervous_system',
              pointsEarned: 25
            })

            if (questResult.success) {
              console.log('✅ Quest completed!', questResult.message)
            } else {
              console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
            }
          }
        } catch (err) {
          console.error('❌ Failed to save nervous system data:', err)
          // Continue with flow even if save fails
        }
      }

      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Nervous System Safety Boundaries flow. Return to your profile to continue your journey:",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])

      // Move currentIndex beyond last step to hide options
      setCurrentIndex(flow.steps.length)
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
      const responseText = await resolvePrompt(nextStep, newContext)

      // If this is the mirror reflection step, store the generated text
      if (nextStep.step === 'stage6_mirror_reflection') {
        newContext.pattern_mirrored = responseText
        setContext(newContext)
      }

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
          console.log('💾 SAVING NERVOUS SYSTEM DATA TO SUPABASE')
          console.log('📤 Sending to Supabase:', newContext)

          const { data, error } = await supabase
            .from('nervous_system_responses')
            .insert([{
              user_email: user?.email,
              user_name: newContext.user_name || 'Anonymous',
              impact_goal: newContext.impact_goal,
              income_goal: newContext.income_goal,
              positive_change: newContext.positive_change,
              current_struggle: newContext.struggle_area,
              belief_test_results: newContext.belief_test_results,
              reflection_text: newContext.pattern_mirrored,
              context: newContext
            }])

          if (error) {
            console.error('❌ Supabase error:', error)
            throw error
          }
          console.log('✅ Nervous system data saved successfully:', data)

          // Auto-complete challenge quest if user has active challenge
          if (user?.id) {
            console.log('🎯 Attempting to complete flow quest for nervous_system')
            const questResult = await completeFlowQuest({
              userId: user.id,
              flowId: 'nervous_system',
              pointsEarned: 25
            })

            if (questResult.success) {
              console.log('✅ Quest completed!', questResult.message)
            } else {
              console.log('ℹ️ Quest not completed:', questResult.reason || questResult.error)
            }
          }
        } catch (err) {
          console.error('❌ Failed to save nervous system data:', err)
          // Continue with flow even if save fails
        }
      }

      // Flow completed
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Nervous System Safety Boundaries flow. Return to your profile to continue your journey:",
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
        <h1>Nervous System Safety Boundaries</h1>
        <p>Use sway testing to identify subconscious safety edges</p>
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
                      <Link to="/me" style={{ color: '#5e17eb', textDecoration: 'underline' }}>
                        Return to your profile
                      </Link>
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

export default NervousSystemFlow
