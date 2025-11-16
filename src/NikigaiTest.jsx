import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import { extractTags } from './lib/tagExtraction.js'
import { generateClusters, generateClusterLabel, generateSemanticClusterLabel, calculateClusterQualityMetrics, calculateItemSimilarity, generateMetaSkills } from './lib/clustering.js'
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

      // Step 1: Extract tags per bullet (if needed)
      let taggedBullets = { bullets: [] }
      if (currentStepData.store_as) {
        console.log('🔍 Extracting tags per bullet...')
        taggedBullets = await extractTags(trimmedInput, {
          step_id: currentStep,
          store_as: currentStepData.store_as
        })
        console.log('✅ Tags extracted per bullet:', taggedBullets)
      }

      // Step 2: Count bullets (fallback if AI didn't parse them)
      const bulletCount = taggedBullets.bullets.length || extractBulletPoints(trimmedInput).length
      console.log('📝 Bullets found:', bulletCount)

      // Step 3: Save response to Supabase (with per-bullet tags)
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
          tags_extracted: taggedBullets, // Store per-bullet tags: {bullets: [{text, tags}]}
          store_as: currentStepData.store_as
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
      console.log('🔍 Looking for responses with store_as in:', sourceFields)
      console.log('🔍 All responses store_as values:', responses.map(r => r.store_as))

      const relevantResponses = responses.filter(r =>
        sourceFields.some(field => r.store_as === field || field.includes('*'))
      )

      console.log('📦 Clustering from', relevantResponses.length, 'responses')

      if (relevantResponses.length === 0) {
        console.warn('⚠️ No relevant responses found for clustering!')
        throw new Error('No responses found for clustering')
      }

      // Extract items for clustering (using per-bullet tags)
      const items = relevantResponses.flatMap(resp => {
        // tags_extracted now contains {bullets: [{text, tags}]}
        const bulletsData = resp.tags_extracted?.bullets || []

        // If no bullets from AI, fall back to manual extraction
        if (bulletsData.length === 0) {
          return extractBulletPoints(resp.response_raw).map(bullet => ({
            text: bullet,
            tags: {
              skill_verb: [],
              domain_topic: [],
              value: [],
              emotion: [],
              context: [],
              problem_theme: [],
              persona_hint: []
            },
            source_step: resp.step_id,
            bullet_score: 0
          }))
        }

        // Use AI-extracted per-bullet tags
        return bulletsData.map(bullet => ({
          text: bullet.text,
          tags: bullet.tags,
          source_step: resp.step_id,
          bullet_score: 0
        }))
      })

      console.log('🔧 Extracted items for clustering:', items.length)
      console.log('🏷️ Items with tags:')
      items.forEach((item, i) => {
        const tagSummary = Object.entries(item.tags || {})
          .filter(([_, vals]) => vals.length > 0)
          .map(([type, vals]) => `${type}: ${vals.join(', ')}`)
          .join(' | ')
        console.log(`  ${i + 1}. "${item.text}" → ${tagSummary || 'no tags'}`)
      })

      if (items.length === 0) {
        console.warn('⚠️ No items extracted from responses!')
        throw new Error('No items to cluster')
      }

      let generatedClusters

      // Check if this is cluster enrichment or new clustering
      if (postprocess.cluster_enrich) {
        // Cluster enrichment: add new items to existing clusters
        const enrichConfig = postprocess.cluster_enrich
        console.log('🔄 Enriching existing clusters from:', enrichConfig.merge_into)

        // Load existing clusters from session data
        const existingClusters = sessionData[enrichConfig.merge_into] || []
        console.log('📦 Loaded', existingClusters.length, 'existing clusters')

        if (existingClusters.length === 0) {
          console.warn('⚠️ No existing clusters found to enrich!')
          // Fall back to creating new clusters
          generatedClusters = generateClusters(items, {
            similarity_threshold: 0.25,
            min_merge_similarity: 0.1,
            min_items_per_cluster: 3,
            source_tags: enrichConfig.source_tags
          })
        } else {
          // Enrich existing clusters with new items
          generatedClusters = existingClusters.map(cluster => ({
            ...cluster,
            items: cluster.items || []
          }))

          // Add each new item to the most similar existing cluster
          items.forEach(newItem => {
            let bestClusterIndex = 0
            let bestSimilarity = 0

            generatedClusters.forEach((cluster, idx) => {
              // Calculate average similarity to items in this cluster
              let totalSim = 0
              cluster.items.forEach(existingItem => {
                totalSim += calculateItemSimilarity(newItem, existingItem, enrichConfig.source_tags)
              })
              const avgSim = cluster.items.length > 0 ? totalSim / cluster.items.length : 0

              if (avgSim > bestSimilarity) {
                bestSimilarity = avgSim
                bestClusterIndex = idx
              }
            })

            // Add to best matching cluster
            generatedClusters[bestClusterIndex].items.push(newItem)
            console.log(`  ➕ Added "${newItem.text}" to cluster ${bestClusterIndex + 1} (similarity: ${bestSimilarity.toFixed(2)})`)
          })

          // Update item counts
          generatedClusters = generatedClusters.map(cluster => ({
            ...cluster,
            item_count: cluster.items.length
          }))
        }
      } else {
        // Standard clustering: create new clusters from scratch
        const clusterConfig = postprocess.cluster
        const clusterParams = {
          similarity_threshold: clusterConfig.similarity_threshold || 0.25,
          min_merge_similarity: clusterConfig.min_merge_similarity || 0.1,
          min_items_per_cluster: clusterConfig.min_items_per_cluster || 3,
          source_tags: clusterConfig.source_tags
        }

        console.log('🎯 Clustering with params:', clusterParams)

        generatedClusters = generateClusters(items, clusterParams)
      }

      console.log('🎯 Generated', generatedClusters.length, 'clusters')
      generatedClusters.forEach((cluster, i) => {
        console.log(`  Cluster ${i + 1}: ${cluster.items.length} items -`, cluster.items.map(item => item.text).join(', '))
      })

      // Generate semantic labels using AI
      console.log('🏷️ Generating semantic labels...')
      const labeledClusters = await Promise.all(
        generatedClusters.map(async (cluster) => {
          const labelData = await generateSemanticClusterLabel(cluster, supabase)
          return {
            ...cluster,
            label: labelData.displayLabel,  // User sees this
            displayLabel: labelData.displayLabel,
            archetypes: labelData.archetypes,  // For job matching
            rationale: labelData.rationale
          }
        })
      )
      console.log('✅ Labels generated:', labeledClusters.map(c => ({
        display: c.displayLabel,
        archetypes: c.archetypes?.map(a => `${a.name} (${Math.round(a.confidence * 100)}%)`)
      })))

      // Calculate quality metrics
      const qualityMetrics = calculateClusterQualityMetrics(labeledClusters)
      console.log('📊 Quality metrics:', qualityMetrics)

      // Generate meta-skills (higher-order patterns across clusters)
      const metaSkills = await generateMetaSkills(labeledClusters, supabase)
      console.log('✨ Meta-skills:', metaSkills)

      // Store clusters with meta-skills
      setClusterData(prev => ({
        ...prev,
        [postprocess.store_as]: labeledClusters,
        [`${postprocess.store_as}_meta_skills`]: metaSkills
      }))

      // Format the assistant_prompt with cluster data
      let promptText = stepData.assistant_prompt
      const clusterPlaceholder = `{${postprocess.store_as}}`
      if (promptText.includes(clusterPlaceholder)) {
        const clusterMessage = formatClustersForDisplay(labeledClusters, qualityMetrics, metaSkills)
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

  function formatClustersForDisplay(clusters, quality, metaSkills = []) {
    let message = "**Your Skill Clusters:**\n\n"
    message += `Quality: ${quality.grade} (${Math.round(quality.overall_score * 100)}%)\n\n`

    clusters.forEach((cluster, index) => {
      message += `**📦 ${cluster.label}** (${cluster.items.length} items)\n`
      // Show ALL items, not just first 3
      cluster.items.forEach(item => {
        message += `• ${item.text}\n`
      })
      message += '\n'
    })

    // Add meta-skills if present
    if (metaSkills && metaSkills.length > 0) {
      message += "\n**✨ Your Meta-Skills:**\n\n"
      message += "_Higher-order patterns that appear across your clusters:_\n\n"

      metaSkills.forEach((metaSkill, index) => {
        message += `**${index + 1}. ${metaSkill.name}**\n`
        message += `${metaSkill.description}\n\n`
      })
    }

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
