import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import { extractTags } from './lib/tagExtraction.js'
import { generateClusters, generateClusterLabel, calculateClusterQualityMetrics } from './lib/clustering.js'
import { processTagWeights, extractBulletPoints } from './lib/weighting.js'
import { useAuth } from './auth/AuthProvider'

/**
 * Nikigai Flow - Conversational Chat Interface
 * Full implementation using v2.2 JSON flow (39 steps)
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
          flow_version: 'v2.2',
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
        stepId: '1.0'
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

      // Step 1: Extract tags (if needed)
      let tags = {}
      if (currentStepData.store_as) {
        console.log('🔍 Extracting tags...')
        tags = await extractTags(trimmedInput, {
          step_id: currentStep,
          store_as: currentStepData.store_as
        })
        console.log('✅ Tags extracted:', tags)
      }

      // Step 2: Count bullets
      const bullets = extractBulletPoints(trimmedInput)
      console.log('📝 Bullets found:', bullets.length)

      // Step 3: Save response to Supabase
      const { data: savedResponse, error: saveError } = await supabase
        .from('nikigai_responses')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          step_id: currentStep,
          step_order_index: currentStepData.step_order_index,
          question_text: currentStepData.assistant_prompt,
          response_raw: trimmedInput,
          bullet_count: bullets.length,
          tags_extracted: tags
        })
        .select()
        .single()

      if (saveError) throw saveError
      console.log('✅ Response saved:', savedResponse.id)

      // Step 4: Add to responses array
      const newResponses = [...allResponses, savedResponse]
      setAllResponses(newResponses)

      // Step 5: Move to next step and check for postprocessing
      await processNextStep(currentStepData, newResponses)

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

  async function processNextStep(currentStepData, responses) {
    // Get next step ID
    const nextStepId = getNextStepId(currentStepData)

    if (!nextStepId) {
      // Flow complete
      const completionMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        kind: 'completion',
        text: "🎉 Congratulations! You've completed the Nikigai discovery flow. Your unique skill clusters have been identified and saved.",
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, completionMessage])
      return
    }

    const nextStepData = flowData.steps.find(s => s.id === nextStepId)
    setCurrentStep(nextStepId)

    // Check if next step has postprocessing (clustering)
    if (nextStepData.assistant_postprocess) {
      console.log('🎯 Processing clusters for step:', nextStepId)
      await handlePostprocessing(nextStepData, responses)
    } else {
      // Just show the next question
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: nextStepData.assistant_prompt,
        timestamp: new Date().toLocaleTimeString(),
        stepId: nextStepId
      }
      setMessages(prev => [...prev, aiMessage])
    }
  }

  async function handlePostprocessing(stepData, responses) {
    const postprocess = stepData.assistant_postprocess

    try {
      // Get responses to cluster from
      const sourceFields = postprocess.tag_from
      const relevantResponses = responses.filter(r =>
        sourceFields.some(field => r.store_as === field || field.includes('*'))
      )

      console.log('📦 Clustering from', relevantResponses.length, 'responses')

      // Extract items for clustering
      const items = relevantResponses.flatMap(resp =>
        extractBulletPoints(resp.response_raw).map(bullet => ({
          text: bullet,
          tags: resp.tags_extracted,
          source_step: resp.step_id,
          bullet_score: 0
        }))
      )

      // Generate clusters
      const clusterConfig = postprocess.cluster
      const generatedClusters = generateClusters(items, {
        target_clusters_min: clusterConfig.target_clusters_min,
        target_clusters_max: clusterConfig.target_clusters_max,
        source_tags: clusterConfig.source_tags
      })

      // Add labels
      const labeledClusters = generatedClusters.map(cluster => ({
        ...cluster,
        label: generateClusterLabel(cluster)
      }))

      // Calculate quality metrics
      const qualityMetrics = calculateClusterQualityMetrics(labeledClusters)
      console.log('📊 Quality metrics:', qualityMetrics)

      // Store clusters
      setClusterData(prev => ({
        ...prev,
        [postprocess.store_as]: labeledClusters
      }))

      // Format the assistant_prompt with cluster data
      let promptText = stepData.assistant_prompt
      const clusterPlaceholder = `{${postprocess.store_as}}`
      if (promptText.includes(clusterPlaceholder)) {
        const clusterMessage = formatClustersForDisplay(labeledClusters, qualityMetrics)
        promptText = promptText.replace(clusterPlaceholder, clusterMessage)
      }

      // Add clusters + options as AI message
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: promptText,
        timestamp: new Date().toLocaleTimeString(),
        stepId: stepData.id,
        hasOptions: stepData.expected_inputs?.[0]?.type === 'single_select',
        options: stepData.expected_inputs?.[0]?.options || []
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (err) {
      console.error('❌ Clustering failed:', err)
      // Show question anyway
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: stepData.assistant_prompt,
        timestamp: new Date().toLocaleTimeString(),
        stepId: stepData.id
      }
      setMessages(prev => [...prev, aiMessage])
    }
  }

  function formatClustersForDisplay(clusters, quality) {
    let message = "**Your Skill Clusters:**\n\n"
    message += `Quality: ${quality.grade} (${Math.round(quality.overall_score * 100)}%)\n\n`

    clusters.forEach((cluster, index) => {
      message += `**📦 ${cluster.label}** (${cluster.items.length} items)\n`
      cluster.items.slice(0, 3).forEach(item => {
        message += `• ${item.text}\n`
      })
      if (cluster.items.length > 3) {
        message += `  _...and ${cluster.items.length - 3} more_\n`
      }
      message += '\n'
    })

    return message
  }

  function getNextStepId(currentStepData) {
    // Check next_step_rules
    if (currentStepData.next_step_rules && currentStepData.next_step_rules.length > 0) {
      const rule = currentStepData.next_step_rules[0]
      return rule.on_success || rule.goto || rule.go_to || null
    }
    return null
  }

  function handleOptionSelect(option) {
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

    // Find next step based on selection
    const nextStepRule = currentStepData.next_step_rules.find(
      rule => rule.on_selection === option
    )

    if (nextStepRule) {
      const nextStepId = nextStepRule.go_to || nextStepRule.goto
      const nextStepData = flowData.steps.find(s => s.id === nextStepId)

      setCurrentStep(nextStepId)

      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: nextStepData.assistant_prompt,
        timestamp: new Date().toLocaleTimeString(),
        stepId: nextStepId
      }
      setMessages(prev => [...prev, aiMessage])
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
