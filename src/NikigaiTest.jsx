import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import { useAuth } from './auth/AuthProvider'

/**
 * Nikigai Flow - Claude-Powered Conversational Interface
 * Uses Claude AI for natural conversation and semantic clustering
 */
export default function NikigaiTest() {
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState(null)
  const [currentStep, setCurrentStep] = useState('1.0')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [allResponses, setAllResponses] = useState([])
  const [error, setError] = useState(null)
  const [flowData, setFlowData] = useState(null)
  const [clusterData, setClusterData] = useState({}) // Store generated clusters
  const messagesEndRef = useRef(null)

  // Load JSON flow
  useEffect(() => {
    fetch('/nikigai-flow-v2.2.json')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Flow loaded:', data.steps.length, 'steps')
        setFlowData(data)
      })
      .catch(err => {
        console.error('❌ Failed to load flow:', err)
        setError('Failed to load question flow')
      })
  }, [])

  // Initialize session when flow is loaded
  useEffect(() => {
    if (flowData) {
      initSession()
    }
  }, [flowData])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function initSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in first')
        return
      }

      // Create new session
      const { data, error } = await supabase
        .from('nikigai_sessions')
        .insert({
          user_id: user.id,
          flow_version: 'v2.2-claude',
          status: 'in_progress',
          last_step_id: '1.0'
        })
        .select()
        .single()

      if (error) throw error

      setSessionId(data.id)
      console.log('✅ Session created:', data.id)

      // Add initial AI message (step 1.0)
      const firstStep = flowData.steps.find(s => s.id === '1.0')
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: firstStep.assistant_prompt,
        timestamp: new Date().toLocaleTimeString(),
        stepId: '1.0',
        hasOptions: firstStep.expected_inputs?.[0]?.type === 'single_select',
        options: firstStep.expected_inputs?.[0]?.options || []
      }
      setMessages([aiMessage])

    } catch (err) {
      console.error('Error creating session:', err)
      setError(err.message)
    }
  }

  async function handleSubmit() {
    if (!inputText.trim() || !sessionId || isLoading) {
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
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const currentStepData = flowData.steps.find(s => s.id === currentStep)

      // Count bullets for storage
      const bulletCount = trimmedInput.split(/[\n•\-\*]/)
        .map(b => b.trim())
        .filter(b => b.length > 0).length

      // Save response to Supabase
      const { data: savedResponse, error: saveError } = await supabase
        .from('nikigai_responses')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          step_id: currentStep,
          step_order_index: currentStepData.step_order_index,
          question_text: currentStepData.assistant_prompt,
          response_raw: trimmedInput,
          bullet_count: bulletCount,
          store_as: currentStepData.store_as
        })
        .select()
        .single()

      if (saveError) throw saveError
      console.log('✅ Response saved:', savedResponse.id)

      // Add to responses array
      const newResponses = [...allResponses, savedResponse]
      setAllResponses(newResponses)

      // Get next step
      const nextStepId = getNextStepId(currentStepData)
      const nextStepData = nextStepId ? flowData.steps.find(s => s.id === nextStepId) : null

      // Check if next step requires clustering
      const shouldCluster = nextStepData?.assistant_postprocess !== undefined
      let clusterSources = []
      let clusterType = 'skills'

      if (shouldCluster) {
        const postprocess = nextStepData.assistant_postprocess
        clusterSources = postprocess.tag_from || []

        // Determine cluster type
        if (postprocess.cluster?.target === 'problems' || postprocess.cluster_enrich?.target === 'problems') {
          clusterType = 'problems'
        }
      }

      // Call Claude for conversational response
      const claudeResponse = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: {
            ...currentStepData,
            nextStep: nextStepData
          },
          userResponse: trimmedInput,
          conversationHistory: messages.slice(-6),
          allResponses: newResponses,
          shouldCluster,
          clusterSources,
          clusterType
        }
      })

      if (claudeResponse.error) {
        throw new Error(claudeResponse.error.message || 'Failed to get AI response')
      }

      const aiResponse = claudeResponse.data

      // Store clusters if generated
      if (aiResponse.clusters && nextStepData?.assistant_postprocess?.store_as) {
        setClusterData(prev => ({
          ...prev,
          [nextStepData.assistant_postprocess.store_as]: aiResponse.clusters
        }))
      }

      // Create AI message
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: aiResponse.message,
        timestamp: new Date().toLocaleTimeString(),
        stepId: nextStepId || currentStep,
        hasOptions: nextStepData?.expected_inputs?.[0]?.type === 'single_select',
        options: nextStepData?.expected_inputs?.[0]?.options || [],
        clusters: aiResponse.clusters
      }
      setMessages(prev => [...prev, aiMessage])

      // Update current step
      if (nextStepId) {
        setCurrentStep(nextStepId)
      } else {
        // Flow complete
        const completionMessage = {
          id: `ai-completion-${Date.now()}`,
          isAI: true,
          kind: 'completion',
          text: "🎉 Congratulations! You've completed the Nikigai discovery flow. Your unique skill clusters have been identified and saved.",
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, completionMessage])
      }

    } catch (err) {
      console.error('Error:', err)
      const errorMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: `❌ Sorry, there was an error: ${err.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  function getNextStepId(currentStepData) {
    // Check next_step_rules
    if (currentStepData.next_step_rules && currentStepData.next_step_rules.length > 0) {
      const rule = currentStepData.next_step_rules[0]
      return rule.on_success || rule.goto || rule.go_to || null
    }
    return null
  }

  async function handleOptionSelect(option) {
    // Find current step
    const currentStepData = flowData.steps.find(s => s.id === currentStep)

    // Add user selection as message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: option,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])

    setIsLoading(true)

    try {
      // Find next step based on selection
      const nextStepRule = currentStepData.next_step_rules.find(
        rule => rule.on_selection === option
      )

      if (nextStepRule) {
        const nextStepId = nextStepRule.go_to || nextStepRule.goto
        const nextStepData = flowData.steps.find(s => s.id === nextStepId)

        setCurrentStep(nextStepId)

        // For option selections, we can use a simpler response
        // or call Claude for more natural transitions
        const aiMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          text: nextStepData.assistant_prompt,
          timestamp: new Date().toLocaleTimeString(),
          stepId: nextStepId,
          hasOptions: nextStepData?.expected_inputs?.[0]?.type === 'single_select',
          options: nextStepData?.expected_inputs?.[0]?.options || []
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (err) {
      console.error('Error handling option:', err)
    } finally {
      setIsLoading(false)
    }
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

  if (!sessionId || !flowData) {
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

  // Check if current step exists and needs options
  const currentStepData = flowData.steps.find(s => s.id === currentStep)
  const lastMessage = messages[messages.length - 1]
  const showOptions = lastMessage?.hasOptions && lastMessage?.stepId === currentStep

  return (
    <div className="app">
      <header className="header">
        <h1>Nikigai Discovery</h1>
        <p>Uncover your unique combination of skills, passions, and purpose</p>
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

      {/* Options (if step requires selection) */}
      {showOptions && lastMessage.options && (
        <div className="options-container">
          {lastMessage.options.map((option, index) => (
            <button
              key={index}
              className="option-button"
              onClick={() => handleOptionSelect(option)}
              disabled={isLoading}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Text input (if step needs text response) */}
      {currentStepData && !showOptions && (
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
