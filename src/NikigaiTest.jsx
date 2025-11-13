import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import { extractTags } from './lib/tagExtraction.js'
import { generateClusters, generateClusterLabel, calculateClusterQualityMetrics } from './lib/clustering.js'
import { processTagWeights, extractBulletPoints } from './lib/weighting.js'
import { useAuth } from './auth/AuthProvider'

/**
 * Nikigai Flow - Conversational Chat Interface
 * Discover your unique combination of skills, passions, and purpose
 */
export default function NikigaiTest() {
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState(null)
  const [currentStep, setCurrentStep] = useState('2.0')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [allResponses, setAllResponses] = useState([])
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  // Sample questions (from v2.2 flow)
  const questions = {
    '2.0': {
      prompt: "Let's start with Childhood (Pre-school + Primary).\n\nWhat did you *love doing most*? These can be games, hobbies, or activities that made you lose track of time.\n\nPlease share 3–5 short bullets (the more the better!).",
      store_as: 'life_map.hobbies.childhood',
      shouldCluster: false
    },
    '2.1': {
      prompt: "Now think of High School.\n\nWhat did you enjoy doing most for fun or self-expression?\n\nShare 3–5 bullets.",
      store_as: 'life_map.hobbies.highschool',
      shouldCluster: false
    },
    '2.2': {
      prompt: "Finally, from 18 to Now — what activities, hobbies, or creative outlets light you up today?\n\n3–5 bullets please.",
      store_as: 'life_map.hobbies.current',
      shouldCluster: true, // First clustering checkpoint
      clusterType: 'skills',
      clusterStage: 'preview'
    }
  }

  // Initialize session
  useEffect(() => {
    initSession()
  }, [])

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
          last_step_id: '2.0'
        })
        .select()
        .single()

      if (error) throw error

      setSessionId(data.id)
      console.log('✅ Session created:', data.id)

      // Add initial AI message
      const firstQuestion = questions['2.0']
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: firstQuestion.prompt,
        timestamp: new Date().toLocaleTimeString()
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

      // Step 1: Extract tags
      console.log('🔍 Extracting tags...')
      const tags = await extractTags(trimmedInput, {
        step_id: currentStep,
        store_as: questions[currentStep].store_as
      })
      console.log('✅ Tags extracted:', tags)

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
          step_order_index: parseInt(currentStep.replace('.', '')),
          question_text: questions[currentStep].prompt,
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

      // Step 5: If this is a clustering checkpoint, generate clusters
      if (questions[currentStep].shouldCluster) {
        console.log('🎯 Generating clusters...')

        // Prepare items for clustering
        const items = newResponses.flatMap(resp =>
          extractBulletPoints(resp.response_raw).map(bullet => ({
            text: bullet,
            tags: resp.tags_extracted,
            source_step: resp.step_id,
            bullet_score: 0 // Will be calculated
          }))
        )

        // Generate clusters
        const generatedClusters = generateClusters(items, {
          target_clusters_min: 3,
          target_clusters_max: 6,
          source_tags: ['skill_verb', 'domain_topic', 'value']
        })

        // Add labels
        const labeledClusters = generatedClusters.map(cluster => ({
          ...cluster,
          label: generateClusterLabel(cluster)
        }))

        // Calculate quality metrics
        const qualityMetrics = calculateClusterQualityMetrics(labeledClusters)
        console.log('📊 Quality metrics:', qualityMetrics)

        // Add clusters as AI message
        const clusterMessage = formatClustersMessage(labeledClusters, qualityMetrics)
        const aiMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          text: clusterMessage,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, aiMessage])

        console.log('✅ Clusters generated:', labeledClusters.length)
      }

      // Step 6: Move to next step
      const nextStep = getNextStep(currentStep)
      if (nextStep) {
        setCurrentStep(nextStep)

        // Add next question as AI message
        const nextQuestion = questions[nextStep]
        const aiMessage = {
          id: `ai-${Date.now()}`,
          isAI: true,
          text: nextQuestion.prompt,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        // Flow complete
        const completionMessage = {
          id: `ai-${Date.now()}`,
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

  function formatClustersMessage(clusters, quality) {
    let message = "✨ **Your Skill Clusters Are Emerging:**\n\n"
    message += `**Quality Score:** ${quality.grade} (${Math.round(quality.overall_score * 100)}%)\n`
    message += `Coherence: ${Math.round(quality.coherence * 100)}% | Distinctness: ${Math.round(quality.distinctness * 100)}% | Balance: ${Math.round(quality.balance * 100)}%\n\n`

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

  function getNextStep(current) {
    const steps = Object.keys(questions)
    const currentIndex = steps.indexOf(current)
    return steps[currentIndex + 1] || null
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

  if (!sessionId) {
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

      {questions[currentStep] && (
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
