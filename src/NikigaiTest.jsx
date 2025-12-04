import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import { useAuth } from './auth/AuthProvider'
import { createProjectFromSession } from './lib/projectCreation'
import { completeFlowQuest } from './lib/questCompletion'
import './ClusterSlider.css'

// Enhanced markdown parser for bold, italic text, bullets, headers, and line breaks
function formatMessage(text) {
  if (!text) return ''
  return text
    // Headers (process before line breaks)
    .replace(/^### (.*?)$/gm, '<h3 style="margin: 12px 0 8px 0; font-size: 1.1em;">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 style="margin: 16px 0 10px 0; font-size: 1.2em;">$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1 style="margin: 20px 0 12px 0; font-size: 1.3em;">$1</h1>')
    // Bold and italic (process before line breaks to avoid conflicts)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')  // *italic*
    // Bullet points (multiple formats)
    .replace(/^[-•\*] /gm, '&bull; ')  // - or • or * at start of line
    // Line breaks (keep double breaks as paragraphs)
    .replace(/\n\n/g, '<br /><br />')  // double line breaks
    .replace(/\n/g, '<br />')  // single line breaks
}

/**
 * ClusterSlider Component - Swipeable slider for selecting clusters
 */
function ClusterSlider({ title, clusters, selectedIndex, onSelect }) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const minSwipeDistance = 50

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : clusters.length - 1
    setCurrentIndex(newIndex)
    onSelect(newIndex)
  }

  const handleNext = () => {
    const newIndex = currentIndex < clusters.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(newIndex)
    onSelect(newIndex)
  }

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsSwiping(true)
  }

  const onTouchMove = (e) => {
    if (!touchStart) return
    const currentTouch = e.targetTouches[0].clientX
    setTouchEnd(currentTouch)
    const offset = currentTouch - touchStart
    setSwipeOffset(offset)
  }

  const onTouchEnd = () => {
    setIsSwiping(false)
    setSwipeOffset(0)

    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrevious()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  if (!clusters || clusters.length === 0) {
    return (
      <div className="cluster-slider">
        <h3>{title}</h3>
        <div className="slider-empty">No {title.toLowerCase()} available</div>
      </div>
    )
  }

  const currentCluster = clusters[currentIndex]

  const cardStyle = {
    transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)',
    transition: isSwiping ? 'none' : 'transform 0.3s ease'
  }

  return (
    <div className="cluster-slider">
      <h3>{title}</h3>
      <div className="slider-container">
        <div
          className="slider-content"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="cluster-card" style={cardStyle}>
            <div className="cluster-label">{currentCluster.cluster_label || currentCluster.label}</div>
            <div className="cluster-summary">
              {currentCluster.insight || currentCluster.summary || 'No summary available yet'}
            </div>
          </div>
        </div>
      </div>
      <div className="slider-controls">
        <button className="slider-arrow-small" onClick={handlePrevious}>‹</button>
        <div className="slider-indicator">
          {currentIndex + 1} / {clusters.length}
        </div>
        <button className="slider-arrow-small" onClick={handleNext}>›</button>
      </div>
    </div>
  )
}

/**
 * Nikigai Flow - Claude-Powered Conversational Interface
 * Uses Claude AI for natural conversation and semantic clustering
 */
export default function NikigaiTest({ flowFile = 'nikigai-flow-v2.2.json', flowName = 'Nikigai Discovery' }) {
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState(null)
  const [currentStep, setCurrentStep] = useState('1.0')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [allResponses, setAllResponses] = useState([])
  const [error, setError] = useState(null)
  const [lockedInfo, setLockedInfo] = useState(null) // { requiredFlow: 'skills', requiredFlowName: 'Skills Discovery' }
  const [flowData, setFlowData] = useState(null)
  const [clusterData, setClusterData] = useState({}) // Store generated clusters
  const [finalChoice, setFinalChoice] = useState(null) // Track user's final choice
  const [sliderSelections, setSliderSelections] = useState({
    skills: 0,
    problems: 0,
    persona: 0
  })
  const messagesEndRef = useRef(null)

  const taglineByFlowName = {
    'Skills Discovery': "Identify your unique skill combinations to uncover roles you're passionate about",
    'Problems Discovery': "Identify your life experiences and curiosities to uncover problems you're passionate about",
    'Persona Discovery': "Identify people you're passionate about supporting",
    'Integration & Mission': "Connect your skills, problems, and personas into a clear mission and opportunity map."
  }

  const headerTagline = taglineByFlowName[flowName] || "Flow Finder: A modern day Ikigai process"

  // Reset all state when flowFile changes (navigating between flows)
  useEffect(() => {
    console.log('🔄 Flow file changed, resetting state...')
    setSessionId(null)
    setCurrentStep('1.0')
    setMessages([])
    setInputText('')
    setIsLoading(false)
    setAllResponses([])
    setError(null)
    setLockedInfo(null)
    setFlowData(null)
    setClusterData({})
    setFinalChoice(null)
    setSliderSelections({ skills: 0, problems: 0, persona: 0 })
  }, [flowFile])

  // Load JSON flow
  useEffect(() => {
    fetch(`/${flowFile}`)
      .then(res => res.json())
      .then(data => {
        console.log('✅ Flow loaded:', data.steps.length, 'steps')
        setFlowData(data)
      })
      .catch(err => {
        console.error('❌ Failed to load flow:', err)
        setError('Failed to load question flow')
      })
  }, [flowFile])

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

  // Map flowFile to flow_type for graduation tracking
  function getFlowType(fileName) {
    // Nikigai flows - each pillar tracked separately for Vibe Seeker graduation
    if (fileName.includes('nikigai-flow-1-skills')) {
      return 'nikigai_skills'
    } else if (fileName.includes('nikigai-flow-2-problems')) {
      return 'nikigai_problems'
    } else if (fileName.includes('nikigai-flow-3-persona')) {
      return 'nikigai_persona'
    } else if (fileName.includes('nikigai-flow-4-integration')) {
      return 'nikigai_integration'
    } else if (fileName.includes('nikigai-flow')) {
      // Legacy v2.2 flow (all-in-one)
      return 'nikigai'
    }

    // Vibe Riser flows
    if (fileName.includes('100m-offer')) {
      return '100m_offer'
    } else if (fileName.includes('lead-magnet')) {
      return 'lead_magnet_offer'
    }

    // Movement Maker flows
    if (fileName.includes('leads-strategy') || fileName.includes('100m-leads')) {
      return '100m_leads'
    }

    return 'nikigai' // default fallback
  }

  async function initSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in first')
        return
      }

      // Check prerequisites
      const prerequisites = {
        'problems': 'skills',
        'persona': 'problems',
        'integration': 'persona'
      }

      const requiredPillar = prerequisites[flowData.pillar]
      if (requiredPillar) {
        const { data: completedSessions, error: checkError } = await supabase
          .from('flow_sessions')
          .select('id, status, completed_at')
          .eq('user_id', user.id)
          .eq('flow_version', `${requiredPillar}-claude`)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)

        if (checkError) {
          console.error('Error checking prerequisites:', checkError)
        }

        if (!completedSessions || completedSessions.length === 0) {
          const flowNames = {
            'skills': 'Skills Discovery',
            'problems': 'Problems Discovery',
            'persona': 'Persona Discovery'
          }
          const flowPaths = {
            'skills': '/nikigai/skills',
            'problems': '/nikigai/problems',
            'persona': '/nikigai/persona'
          }
          setLockedInfo({
            requiredFlow: requiredPillar,
            requiredFlowName: flowNames[requiredPillar],
            requiredFlowPath: flowPaths[requiredPillar]
          })
          return
        }
      }

      // For Flows 3 & 4, load previous responses from this user
      if (flowData.pillar === 'persona' || flowData.pillar === 'integration') {
        const { data: previousResponses, error: fetchError } = await supabase
          .from('nikigai_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (!fetchError && previousResponses) {
          setAllResponses(previousResponses)
          console.log('✅ Loaded', previousResponses.length, 'previous responses')
        }

        // For integration flow, also load saved clusters
        if (flowData.pillar === 'integration') {
          // First, let's see ALL clusters for this user (no filters)
          const { data: allUserClusters, error: debugError } = await supabase
            .from('nikigai_clusters')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          console.log('🔍 ALL clusters for this user:', allUserClusters?.map(c => ({
            label: c.cluster_label,
            type: c.cluster_type,
            stage: c.cluster_stage,
            archived: c.archived,
            store_as: c.source_responses
          })))

          // Now filter for final, non-archived clusters
          const { data: savedClusters, error: clustersError } = await supabase
            .from('nikigai_clusters')
            .select('*')
            .eq('user_id', user.id)
            .eq('cluster_stage', 'final')
            .eq('archived', false)
            .order('created_at', { ascending: false })

          if (!clustersError && savedClusters) {
            // Debug: Show what cluster_types we actually have
            const clusterTypes = new Set(savedClusters.map(c => c.cluster_type))
            console.log('🔍 Unique cluster_types found:', Array.from(clusterTypes))

            // Group clusters by type
            // Note: Skills flow saves as 'roles' (new) or 'skills' (old), support both
            const grouped = {
              skills: savedClusters.filter(c => c.cluster_type === 'roles' || c.cluster_type === 'skills'),
              problems: savedClusters.filter(c => c.cluster_type === 'problems'),
              persona: savedClusters.filter(c => c.cluster_type === 'persona')
            }

            // Debug: Check if any problem clusters exist at all
            const problemClustersInAll = allUserClusters?.filter(c => c.cluster_type === 'problems') || []
            console.log('🔍 Problem clusters analysis:', {
              total_in_db: problemClustersInAll.length,
              final_stage: problemClustersInAll.filter(c => c.cluster_stage === 'final').length,
              not_archived: problemClustersInAll.filter(c => !c.archived).length,
              final_and_not_archived: problemClustersInAll.filter(c => c.cluster_stage === 'final' && !c.archived).length
            })

            setClusterData(grouped)
            console.log('✅ Loaded saved clusters:', {
              skills: grouped.skills.length,
              problems: grouped.problems.length,
              persona: grouped.persona.length
            })
            console.log('📊 Cluster details:', {
              skills: grouped.skills.map(c => ({ label: c.cluster_label, type: c.cluster_type, stage: c.cluster_stage })),
              problems: grouped.problems.map(c => ({ label: c.cluster_label, type: c.cluster_type, stage: c.cluster_stage })),
              persona: grouped.persona.map(c => ({ label: c.cluster_label, type: c.cluster_type, stage: c.cluster_stage }))
            })
            console.log('🗄️ All clusters from DB:', savedClusters.map(c => ({
              label: c.cluster_label,
              type: c.cluster_type,
              stage: c.cluster_stage,
              archived: c.archived
            })))
          }
        }
      }

      // Create new session for this flow
      const { data, error } = await supabase
        .from('flow_sessions')
        .insert({
          user_id: user.id,
          flow_version: `${flowData.pillar || 'v2.2'}-claude`,
          flow_type: getFlowType(flowFile),
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

      // Check if next step requires clustering or generation
      const shouldCluster = nextStepData?.assistant_postprocess?.cluster !== undefined
      const shouldGenerate = nextStepData?.assistant_postprocess?.generate !== undefined
      const shouldProcess = shouldCluster || shouldGenerate

      let clusterSources = []
      let clusterType = 'skills'
      let generateType = null

      if (shouldProcess) {
        const postprocess = nextStepData.assistant_postprocess
        clusterSources = postprocess.tag_from || []

        if (shouldCluster) {
          // Determine cluster type
          if (postprocess.cluster?.target === 'problems' || postprocess.cluster_enrich?.target === 'problems') {
            clusterType = 'problems'
          } else if (postprocess.cluster?.target === 'persona') {
            clusterType = 'persona'
          } else if (postprocess.cluster?.target === 'roles') {
            clusterType = 'roles'
          }
        } else if (shouldGenerate) {
          generateType = postprocess.generate.type
          clusterType = generateType // Use generate type as cluster type for now
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
          shouldGenerate,
          clusterSources,
          clusterType,
          generateType,
          clusterData: shouldGenerate ? clusterData : undefined
        }
      })

      if (claudeResponse.error) {
        throw new Error(claudeResponse.error.message || 'Failed to get AI response')
      }

      // Parse response if it's a string
      let aiResponse = claudeResponse.data
      if (typeof aiResponse === 'string') {
        try {
          aiResponse = JSON.parse(aiResponse)
        } catch (e) {
          console.error('Failed to parse AI response:', e)
          aiResponse = { message: aiResponse, clusters: null }
        }
      }

      console.log('✅ AI Response:', aiResponse)

      // Debug clustering response
      if (shouldCluster || shouldGenerate) {
        console.log('🔍 Clustering/Generation Debug:', {
          shouldCluster,
          shouldGenerate,
          clusterType,
          generateType,
          hasClusters: !!aiResponse.clusters,
          clustersCount: aiResponse.clusters?.length,
          storeAs: nextStepData?.assistant_postprocess?.store_as,
          aiResponseKeys: Object.keys(aiResponse),
          fullAiResponse: aiResponse
        })
      }

      // Store clusters if generated
      if (aiResponse.clusters && nextStepData?.assistant_postprocess?.store_as) {
        setClusterData(prev => ({
          ...prev,
          [nextStepData.assistant_postprocess.store_as]: aiResponse.clusters
        }))

        // Save clusters to database
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const storeAs = nextStepData.assistant_postprocess.store_as
          const clusterStage = storeAs.includes('preview') ? 'preview' :
                              storeAs.includes('final') ? 'final' : 'intermediate'

          // Save each cluster to the database
          console.log('💾 Saving clusters:', {
            clusterType,
            clusterStage,
            storeAs,
            count: aiResponse.clusters.length,
            labels: aiResponse.clusters.map(c => c.label)
          })

          for (const cluster of aiResponse.clusters) {
            await supabase.from('nikigai_clusters').insert({
              session_id: sessionId,
              user_id: user.id,
              cluster_type: clusterType,
              cluster_stage: clusterStage,
              cluster_label: cluster.label,
              items: cluster.items || [],
              insight: cluster.insight || cluster.summary || null,
              source_responses: clusterSources,
              archived: false
            })
          }
          console.log('✅ Clusters saved to database:', aiResponse.clusters.length, 'as cluster_stage:', clusterStage)
        } catch (dbError) {
          console.error('⚠️ Failed to save clusters to database:', dbError)
          // Don't throw - continue even if DB save fails
        }
      }

      // Create AI message
      // For clustering steps, show cluster confirmation options
      // For generate steps, just show the content and move on
      const isClusterStep = nextStepData?.assistant_postprocess?.cluster !== undefined
      const isGenerateStep = nextStepData?.assistant_postprocess?.generate !== undefined

      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: aiResponse.message,
        timestamp: new Date().toLocaleTimeString(),
        stepId: nextStepId || currentStep,
        hasOptions: isClusterStep || nextStepData?.expected_inputs?.[0]?.type === 'single_select',
        options: isClusterStep
          ? ['Clusters look good!', 'Re-cluster please!']
          : (nextStepData?.expected_inputs?.[0]?.options || []),
        clusters: aiResponse.clusters,
        isClusterConfirmation: isClusterStep,
        isGeneration: isGenerateStep
      }
      setMessages(prev => [...prev, aiMessage])

      // Update current step
      if (nextStepId) {
        setCurrentStep(nextStepId)

        // For generate steps, show a confirmation button instead of auto-advancing
        if (isGenerateStep) {
          setTimeout(() => {
            const confirmMessage = {
              id: `ai-${Date.now()}`,
              isAI: true,
              text: "These are all the clusters we've identified from your journey. Ready to find your perfect combination?",
              timestamp: new Date().toLocaleTimeString(),
              stepId: nextStepId,
              hasOptions: true,
              options: ["Looks good!"],
              isGenerateConfirmation: true
            }
            setMessages(prev => [...prev, confirmMessage])
          }, 1500)
        }
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

        // Complete challenge quest if this is the 100M Offer flow
        if (flowFile === '100m-offer-flow.json' && user?.id) {
          try {
            await completeFlowQuest({
              userId: user.id,
              flowId: 'flow_100m_offer',
              pointsEarned: 35
            })
          } catch (questError) {
            console.warn('Quest completion failed:', questError)
          }

          // Auto-save milestone: product_created (Vibe Riser Creation stage requirement)
          try {
            const { data: stageProgress } = await supabase
              .from('user_stage_progress')
              .select('persona, current_stage')
              .eq('user_id', user.id)
              .single()

            if (stageProgress?.persona === 'vibe_riser') {
              await supabase.from('milestone_completions').insert({
                user_id: user.id,
                persona: stageProgress.persona,
                stage: stageProgress.current_stage,
                milestone_id: 'product_created',
                completed_at: new Date().toISOString()
              })
            }
          } catch (milestoneError) {
            console.warn('Milestone auto-save failed:', milestoneError)
          }
        }
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
    const lastMessage = messages[messages.length - 1]

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
      // Handle generate confirmation (Looks good!)
      if (lastMessage?.isGenerateConfirmation) {
        const nextStepId = getNextStepId(currentStepData)
        if (nextStepId) {
          const nextStepData = flowData.steps.find(s => s.id === nextStepId)
          setCurrentStep(nextStepId)

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
        setIsLoading(false)
        return
      }

      // Handle cluster confirmation
      if (lastMessage?.isClusterConfirmation) {
        if (option === 'Re-cluster please!') {
          // Re-cluster: call Claude again with same data
          const postprocess = currentStepData.assistant_postprocess
          const clusterSources = postprocess?.tag_from || []
          let clusterType = 'skills'
          if (postprocess?.cluster?.target === 'problems' || postprocess?.cluster_enrich?.target === 'problems') {
            clusterType = 'problems'
          } else if (postprocess?.cluster?.target === 'persona') {
            clusterType = 'persona'
          } else if (postprocess?.cluster?.target === 'roles') {
            clusterType = 'roles'
          }

          const claudeResponse = await supabase.functions.invoke('nikigai-conversation', {
            body: {
              currentStep: {
                ...currentStepData,
                nextStep: currentStepData // Same step for re-clustering
              },
              userResponse: 'Please re-cluster my responses with different groupings',
              conversationHistory: messages.slice(-6),
              allResponses,
              shouldCluster: true,
              clusterSources,
              clusterType
            }
          })

          if (claudeResponse.error) {
            throw new Error(claudeResponse.error.message || 'Failed to get AI response')
          }

          let aiResponse = claudeResponse.data
          if (typeof aiResponse === 'string') {
            try {
              aiResponse = JSON.parse(aiResponse)
            } catch (e) {
              aiResponse = { message: aiResponse, clusters: null }
            }
          }

          // Store new clusters
          if (aiResponse.clusters && currentStepData.assistant_postprocess?.store_as) {
            setClusterData(prev => ({
              ...prev,
              [currentStepData.assistant_postprocess.store_as]: aiResponse.clusters
            }))
          }

          const aiMessage = {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: aiResponse.message,
            timestamp: new Date().toLocaleTimeString(),
            stepId: currentStep,
            hasOptions: true,
            options: ['Clusters look good!', 'Re-cluster please!'],
            clusters: aiResponse.clusters,
            isClusterConfirmation: true
          }
          setMessages(prev => [...prev, aiMessage])
        } else {
          // Clusters approved
          // Check if current step has its own prompt to show (for steps that both cluster AND ask a question)
          if (currentStepData.assistant_prompt && currentStepData.expected_inputs) {
            const aiMessage = {
              id: `ai-${Date.now()}`,
              isAI: true,
              text: currentStepData.assistant_prompt,
              timestamp: new Date().toLocaleTimeString(),
              stepId: currentStep,
              hasOptions: currentStepData.expected_inputs?.[0]?.type === 'single_select',
              options: currentStepData.expected_inputs?.[0]?.options || []
            }
            setMessages(prev => [...prev, aiMessage])
          } else {
            // No prompt on current step, move to next step
            const nextStepId = getNextStepId(currentStepData)
            if (nextStepId) {
              const nextStepData = flowData.steps.find(s => s.id === nextStepId)
              setCurrentStep(nextStepId)

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
          }
        }
        return
      }

      // Find next step based on selection
      // Support both on_selection (specific option) and on_success (any valid selection)
      let nextStepRule = currentStepData.next_step_rules?.find(
        rule => rule.on_selection === option
      )

      // If no specific match, check for on_success rule (fallback for single-select)
      if (!nextStepRule) {
        nextStepRule = currentStepData.next_step_rules?.find(
          rule => rule.on_success
        )
      }

      if (nextStepRule) {
        const nextStepId = nextStepRule.go_to || nextStepRule.goto
        const nextStepData = flowData.steps.find(s => s.id === nextStepId)

        // Store final choice if this is a completion path
        if (nextStepId === 'complete') {
          setFinalChoice(option)
        }

        setCurrentStep(nextStepId)

        // Handle completion
        if (nextStepId === 'complete') {
          // Mark session as completed in database
          try {
            const { data: { user } } = await supabase.auth.getUser()
            await supabase
              .from('flow_sessions')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', sessionId)

            console.log('✅ Session marked as completed:', sessionId)

            // Auto-create project from completed session (Phase 4A: Project Auto-Creation)
            const currentFlowType = getFlowType(flowFile)
            const projectResult = await createProjectFromSession(user.id, sessionId, currentFlowType)

            if (projectResult.success) {
              console.log('🎯 Project auto-created:', projectResult.projectId, projectResult.projectName)

              // Show success message if new project created (not skipped or already exists)
              if (!projectResult.alreadyExists && !projectResult.skipped) {
                const projectCreatedMsg = {
                  id: `ai-project-created-${Date.now()}`,
                  isAI: true,
                  text: `🎯 Great news! I've created your project "${projectResult.projectName}". Visit /flow-compass to start tracking your daily progress!`,
                  timestamp: new Date().toLocaleTimeString()
                }
                setMessages(prev => [...prev, projectCreatedMsg])
              } else if (projectResult.skipped) {
                console.log('✅ Skipped project creation - user already has an active project')
              }
            } else {
              console.warn('⚠️ Could not auto-create project:', projectResult.error)
            }
          } catch (err) {
            console.error('⚠️ Failed to mark session as completed:', err)
          }

          // Determine redirect based on next_step_rule
          const redirectPath = nextStepRule?.redirect || '/me'

          let completionText = `🎉 Congratulations! You've completed the ${flowData.flow_name}!`

          const completionMessage = {
            id: `ai-completion-${Date.now()}`,
            isAI: true,
            kind: 'completion',
            text: completionText,
            link: redirectPath,
            linkText: option,
            timestamp: new Date().toLocaleTimeString()
          }
          setMessages(prev => [...prev, completionMessage])
          setIsLoading(false)
          return
        }

        // Check if the next step requires clustering or generation
        const shouldCluster = nextStepData?.assistant_postprocess?.cluster !== undefined
        const shouldGenerate = nextStepData?.assistant_postprocess?.generate !== undefined
        const shouldProcess = shouldCluster || shouldGenerate

        if (shouldProcess) {
          // Trigger clustering or generation for this step
          const postprocess = nextStepData.assistant_postprocess
          const clusterSources = postprocess.tag_from || []
          let clusterType = 'skills'
          let generateType = null

          if (shouldCluster) {
            if (postprocess.cluster?.target === 'problems' || postprocess.cluster_enrich?.target === 'problems') {
              clusterType = 'problems'
            } else if (postprocess.cluster?.target === 'persona') {
              clusterType = 'persona'
            } else if (postprocess.cluster?.target === 'roles') {
              clusterType = 'roles'
            }
          } else if (shouldGenerate) {
            generateType = postprocess.generate.type
            clusterType = generateType
          }

          // Call Claude for clustering or generation
          const claudeResponse = await supabase.functions.invoke('nikigai-conversation', {
            body: {
              currentStep: {
                ...currentStepData,
                nextStep: nextStepData
              },
              userResponse: option,
              conversationHistory: messages.slice(-6),
              allResponses,
              shouldCluster,
              shouldGenerate,
              clusterSources,
              clusterType,
              generateType,
              clusterData: shouldGenerate ? clusterData : undefined
            }
          })

          if (claudeResponse.error) {
            throw new Error(claudeResponse.error.message || 'Failed to get AI response')
          }

          let aiResponse = claudeResponse.data
          if (typeof aiResponse === 'string') {
            try {
              aiResponse = JSON.parse(aiResponse)
            } catch (e) {
              aiResponse = { message: aiResponse, clusters: null }
            }
          }

          // Store clusters if generated
          console.log('🔍 Checking if clusters should be saved:', {
            hasClusters: !!aiResponse.clusters,
            clustersCount: aiResponse.clusters?.length,
            hasStoreAs: !!nextStepData.assistant_postprocess?.store_as,
            storeAs: nextStepData.assistant_postprocess?.store_as,
            clusterType: clusterType
          })

          if (aiResponse.clusters && nextStepData.assistant_postprocess?.store_as) {
            setClusterData(prev => ({
              ...prev,
              [nextStepData.assistant_postprocess.store_as]: aiResponse.clusters
            }))

            // Save clusters to database
            try {
              const { data: { user } } = await supabase.auth.getUser()
              const storeAs = nextStepData.assistant_postprocess.store_as
              const clusterStage = storeAs.includes('preview') ? 'preview' :
                                  storeAs.includes('final') ? 'final' : 'intermediate'

              console.log('💾 Attempting to save clusters to database:', {
                sessionId,
                userId: user.id,
                clusterType,
                clusterStage,
                storeAs,
                clusterCount: aiResponse.clusters.length,
                labels: aiResponse.clusters.map(c => c.label)
              })

              // Save each cluster to the database
              for (const cluster of aiResponse.clusters) {
                const insertResult = await supabase.from('nikigai_clusters').insert({
                  session_id: sessionId,
                  user_id: user.id,
                  cluster_type: clusterType,
                  cluster_stage: clusterStage,
                  cluster_label: cluster.label,
                  items: cluster.items || [],
                  insight: cluster.insight || cluster.summary || null,
                  source_responses: clusterSources,
                  archived: false
                })

                if (insertResult.error) {
                  console.error('❌ Error inserting cluster:', cluster.label, insertResult.error)
                } else {
                  console.log('✅ Saved cluster:', cluster.label, 'as', clusterStage)
                }
              }
              console.log('✅ All clusters saved to database:', aiResponse.clusters.length, 'as cluster_stage:', clusterStage)
            } catch (dbError) {
              console.error('⚠️ Failed to save clusters to database:', dbError)
            }
          } else {
            console.warn('⚠️ Skipping cluster save - missing data:', {
              hasClusters: !!aiResponse.clusters,
              hasStoreAs: !!nextStepData.assistant_postprocess?.store_as
            })
          }

          const aiMessage = {
            id: `ai-${Date.now()}`,
            isAI: true,
            text: aiResponse.message,
            timestamp: new Date().toLocaleTimeString(),
            stepId: nextStepId,
            hasOptions: shouldCluster,
            options: shouldCluster ? ['Clusters look good!', 'Re-cluster please!'] : [],
            clusters: aiResponse.clusters,
            isClusterConfirmation: shouldCluster,
            isGeneration: shouldGenerate
          }
          setMessages(prev => [...prev, aiMessage])

          // For generate steps, show confirmation button
          if (shouldGenerate) {
            setTimeout(() => {
              const confirmMessage = {
                id: `ai-${Date.now()}`,
                isAI: true,
                text: "These are all the clusters we've identified from your journey. Ready to find your perfect combination?",
                timestamp: new Date().toLocaleTimeString(),
                stepId: nextStepId,
                hasOptions: true,
                options: ["Looks good!"],
                isGenerateConfirmation: true
              }
              setMessages(prev => [...prev, confirmMessage])
            }, 1500)
          }
        } else {
          // No clustering needed - just show the next prompt
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

  async function handleSliderConfirm() {
    if (isLoading) return

    setIsLoading(true)

    // Get selected clusters
    const selectedSkill = clusterData.skills?.[sliderSelections.skills]
    const selectedProblem = clusterData.problems?.[sliderSelections.problems]
    const selectedPersona = clusterData.persona?.[sliderSelections.persona]

    const selectionText = `I'm most excited about combining:
• Problem: ${selectedProblem?.cluster_label || 'Unknown'}
• Persona: ${selectedPersona?.cluster_label || 'Unknown'}
• Skills: ${selectedSkill?.cluster_label || 'Unknown'}`

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: selectionText,
      timestamp: new Date().toLocaleTimeString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const currentStepData = flowData.steps.find(s => s.id === currentStep)

      // Save selection to Supabase responses table
      await supabase.from('nikigai_responses').insert({
        session_id: sessionId,
        user_id: user.id,
        step_id: currentStep,
        step_order_index: currentStepData.step_order_index,
        question_text: currentStepData.assistant_prompt,
        response_raw: selectionText,
        store_as: currentStepData.store_as,
        response_structured: {
          skill_index: sliderSelections.skills,
          problem_index: sliderSelections.problems,
          persona_index: sliderSelections.persona,
          skill: selectedSkill,
          problem: selectedProblem,
          persona: selectedPersona
        }
      })

      // Also save to key_outcomes for easy Library of Answers access
      const { data: outcomeData, error: outcomeError } = await supabase.from('nikigai_key_outcomes').upsert({
        session_id: sessionId,
        user_id: user.id,
        selected_opportunity: {
          skill: selectedSkill,
          problem: selectedProblem,
          persona: selectedPersona
        }
      }, {
        onConflict: 'session_id'
      })

      if (outcomeError) {
        console.error('❌ Error saving to key_outcomes:', outcomeError)
        console.log('📊 Attempted to save:', {
          session_id: sessionId,
          user_id: user.id,
          selectedSkill,
          selectedProblem,
          selectedPersona
        })
      } else {
        console.log('✅ Saved to key_outcomes:', outcomeData)
      }

      // Get next step
      const nextStepId = getNextStepId(currentStepData)
      const nextStepData = nextStepId ? flowData.steps.find(s => s.id === nextStepId) : null

      if (nextStepData) {
        setCurrentStep(nextStepId)

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
      console.error('Error handling slider confirmation:', err)
    } finally {
      setIsLoading(false)
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

  if (lockedInfo) {
    return (
      <div className="app">
        <header className="header">
          <h1>🔒 Flow Locked</h1>
        </header>
        <main className="chat-container" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            background: '#f8f9fa',
            padding: '30px',
            borderRadius: '12px'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '20px', lineHeight: '1.6' }}>
              This flow is locked. Please complete <strong>{lockedInfo.requiredFlowName}</strong> first.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={lockedInfo.requiredFlowPath} style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#5e17eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                Start {lockedInfo.requiredFlowName}
              </Link>
              <Link to="/me" style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'white',
                color: '#5e17eb',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                border: '2px solid #5e17eb'
              }}>
                Return to Profile
              </Link>
            </div>
          </div>
        </main>
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
  const showSliders = currentStepData?.expected_inputs?.[0]?.type === 'cluster_sliders'

  return (
    <div className="app">
      <header className="header">
        <h1>{flowName}</h1>
        <p>{headerTagline}</p>
      </header>

      <main className="chat-container">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                {message.kind === 'completion' ? (
                  <div className="text">
                    <span dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} />
                    <div style={{ marginTop: 8 }}>
                      <Link to={message.link || "/me"} style={{ color: '#5e17eb', textDecoration: 'underline' }}>
                        {message.linkText || "Return to your profile"}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text" dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} />
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

      {/* Cluster Sliders (if step requires slider selection) */}
      {showSliders && (
        <div className="sliders-container">
          <h2 style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '20px',
            marginTop: '0'
          }}>
            Which combination excites you the most?
          </h2>
          <ClusterSlider
            title="Problems"
            clusters={clusterData.problems || []}
            selectedIndex={sliderSelections.problems}
            onSelect={(index) => setSliderSelections(prev => ({ ...prev, problems: index }))}
          />
          <ClusterSlider
            title="Personas"
            clusters={clusterData.persona || []}
            selectedIndex={sliderSelections.persona}
            onSelect={(index) => setSliderSelections(prev => ({ ...prev, persona: index }))}
          />
          <ClusterSlider
            title="Skills"
            clusters={clusterData.skills || []}
            selectedIndex={sliderSelections.skills}
            onSelect={(index) => setSliderSelections(prev => ({ ...prev, skills: index }))}
          />
          <button
            className="confirm-button"
            onClick={handleSliderConfirm}
            disabled={isLoading}
          >
            Confirm Selection
          </button>
        </div>
      )}

      {/* Text input (if step needs text response) */}
      {currentStepData && !showOptions && !showSliders && (
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
