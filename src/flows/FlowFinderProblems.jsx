import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { useAutoSave } from '../hooks/useAutoSave'
import { GradientWheel } from '../components/CompetenceWheels'
import { PROBLEM_SEGMENTS, PROBLEMS_PROFICIENCY_RINGS } from '../lib/wheelTaxonomy'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import './FlowFinder.css'

export default function FlowFinderProblems() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [viewingResults, setViewingResults] = useState(false)
  const [responses, setResponses] = useState({
    q1_topics: ['', '', '', '', ''],
    q2_impact: ['', '', '', '', ''],
    q3_chapters: ['', '', '', '', ''],
    q4_struggles: ['', '', '', '', ''],
    q5_rolemodels: ['', '', '', '', ''],
    q6_future: ['', '', '', '', ''],
    q7_pulls: ['', '', '']
  })
  const [clusters, setClusters] = useState([])
  const [intermediateClusters1, setIntermediateClusters1] = useState([])
  const [intermediateClusters2, setIntermediateClusters2] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState(null)
  // Cluster-level proficiency ratings: { 'cluster_label': 'exploring' | 'pursuing' | 'proven' }
  const [clusterRatings, setClusterRatings] = useState({})
  const [litCells, setLitCells] = useState(new Set())

  // Add hue values to segments for wheel rendering
  const problemsWithHue = useMemo(() =>
    PROBLEM_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  // Map cluster labels to wheel segment indices
  const mapClusterToSegments = (clusterLabel) => {
    const labelLower = clusterLabel.toLowerCase()
    const segmentMappings = {
      // Physical vitality
      health: [0], fitness: [0], body: [0], energy: [0], sleep: [0], nutrition: [0], physical: [0],
      // Mental wellbeing
      anxiety: [1], stress: [1], mindset: [1], mental: [1], emotions: [1], burnout: [1], wellbeing: [1],
      // Personal mastery
      skills: [2], productivity: [2], habits: [2], growth: [2], learning: [2], mastery: [2], personal: [2],
      // Intimate bonds
      relationship: [3], family: [3], parenting: [3], love: [3], marriage: [3], intimate: [3],
      // Service & care
      caregiving: [4], disability: [4], healthcare: [4], support: [4], service: [4], care: [4],
      // Creative expression
      art: [5], creativity: [5], voice: [5], expression: [5], identity: [5], creative: [5],
      // Local impact
      team: [6], organization: [6], community: [6], workplace: [6], culture: [6], local: [6],
      // Cultural movements
      movement: [7], belonging: [7], trends: [7], social: [7], cultural: [7],
      // Economic freedom
      money: [8], business: [8], career: [8], income: [8], financial: [8], freedom: [8], economic: [8],
      // Social justice
      inequality: [9], discrimination: [9], rights: [9], fairness: [9], advocacy: [9], justice: [9],
      // Planetary health
      climate: [10], environment: [10], sustainability: [10], planet: [10], planetary: [10],
      // Human progress
      technology: [11], innovation: [11], future: [11], education: [11], progress: [11], human: [11],
    }
    const matchedSegments = new Set()
    Object.entries(segmentMappings).forEach(([keyword, indices]) => {
      if (labelLower.includes(keyword)) {
        indices.forEach(i => matchedSegments.add(i))
      }
    })
    return matchedSegments.size > 0 ? Array.from(matchedSegments) : [0]
  }

  // Map proficiency rating to ring index (0-2) for 3-ring wheel
  const getRingForProficiency = (rating) => {
    switch (rating) {
      case 'exploring': return 0
      case 'pursuing': return 1
      case 'proven': return 2
      default: return 1
    }
  }

  // Update lit cells when clusters or cluster ratings change
  useEffect(() => {
    if (clusters.length > 0) {
      const newLitCells = new Set()

      clusters.forEach(cluster => {
        const segmentIndices = mapClusterToSegments(cluster.label || cluster.cluster_label || '')

        // Get proficiency from cluster-level rating (Option B)
        const proficiency = cluster.proficiency || clusterRatings[cluster.label] || 'pursuing'
        const ringIdx = getRingForProficiency(proficiency)

        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      })

      setLitCells(newLitCells)
    }
  }, [clusters, clusterRatings])

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('flow-finder-problems', user?.id)

  // Create flow session on mount
  useEffect(() => {
    createSession()
  }, [])

  // Check for saved progress on mount (auto-save)
  useEffect(() => {
    if (user) {
      const saved = loadProgress()
      if (saved && saved.currentScreen && saved.currentScreen !== 'welcome' && saved.currentScreen !== 'success') {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, loadProgress])

  // Auto-save progress on state changes
  useEffect(() => {
    if (!user || currentScreen === 'welcome' || currentScreen === 'success' || currentScreen.startsWith('processing')) return
    const progressData = { currentScreen, responses }
    saveProgress(progressData)
  }, [currentScreen, responses, user, saveProgress])

  const createSession = async () => {
    try {
      const { data, error } = await supabase
        .from('flow_sessions')
        .insert({
          user_id: user.id,
          flow_type: 'nikigai_problems',
          status: 'in_progress'
        })
        .select()
        .single()

      if (error) throw error
      setSessionId(data.id)
      return data.id  // Return the ID for immediate use
    } catch (err) {
      console.error('Error creating session:', err)
      return null
    }
  }

  const addInput = (questionKey) => {
    setResponses(prev => ({
      ...prev,
      [questionKey]: [...prev[questionKey], '']
    }))
  }

  const updateResponse = (questionKey, index, value) => {
    setResponses(prev => {
      const newArray = [...prev[questionKey]]
      newArray[index] = value
      return {
        ...prev,
        [questionKey]: newArray
      }
    })
  }

  // Check if at least 3 non-empty answers exist for a question
  const hasMinimumAnswers = (questionKey, minCount = 3) => {
    const filledAnswers = responses[questionKey].filter(val => val.trim().length > 0)
    return filledAnswers.length >= minCount
  }

  // Get count of filled answers for display
  const getFilledCount = (questionKey) => {
    return responses[questionKey].filter(val => val.trim().length > 0).length
  }

  // Handle resuming saved progress (auto-save)
  const handleResumeProgress = () => {
    if (savedProgressData) {
      setCurrentScreen(savedProgressData.currentScreen)
      if (savedProgressData.responses) {
        setResponses(savedProgressData.responses)
      }
    }
    setShowResumePrompt(false)
    setSavedProgressData(null)
  }

  // Handle starting fresh (auto-save)
  const handleStartFresh = () => {
    clearProgress()
    setShowResumePrompt(false)
    setSavedProgressData(null)
    setCurrentScreen('q1')
  }

  // Intermediate clustering after Q2 (topics + impact)
  const runIntermediateClustering1 = async () => {
    setIsProcessing(true)
    setProcessingError(null)
    setCurrentScreen('processing1')

    try {
      const items = [
        ...responses.q1_topics.filter(v => v.trim()),
        ...responses.q2_impact.filter(v => v.trim())
      ]

      const allResponses = [{
        user_id: user.id,
        response_raw: items.join('\n'),
        store_as: 'problems_intermediate1'
      }]

      const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'problems_preview1', assistant_prompt: 'Early problem theme preview from learning interests and impact' },
          userResponse: 'Show me early patterns',
          shouldCluster: true,
          clusterType: 'problems',
          clusterSources: ['problems_intermediate1'],
          allResponses: allResponses,
          conversationHistory: []
        }
      })

      if (error) throw error

      setIntermediateClusters1(data.clusters || [])
      setIsProcessing(false)
    } catch (err) {
      console.error('Error in intermediate clustering 1:', err)
      setProcessingError('Could not generate preview. You can continue or retry.')
      setIsProcessing(false)
    }
  }

  // Intermediate clustering after Q5 (chapters + struggles + rolemodels)
  const runIntermediateClustering2 = async () => {
    setIsProcessing(true)
    setProcessingError(null)
    setCurrentScreen('processing2')

    try {
      const items = [
        ...responses.q1_topics.filter(v => v.trim()),
        ...responses.q2_impact.filter(v => v.trim()),
        ...responses.q3_chapters.filter(v => v.trim()),
        ...responses.q4_struggles.filter(v => v.trim()),
        ...responses.q5_rolemodels.filter(v => v.trim())
      ]

      const allResponses = [{
        user_id: user.id,
        response_raw: items.join('\n'),
        store_as: 'problems_intermediate2'
      }]

      const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'problems_preview2', assistant_prompt: 'Deeper problem theme preview including life story and inspirations' },
          userResponse: 'Show me deeper patterns',
          shouldCluster: true,
          clusterType: 'problems',
          clusterSources: ['problems_intermediate2'],
          allResponses: allResponses,
          conversationHistory: []
        }
      })

      if (error) throw error

      setIntermediateClusters2(data.clusters || [])
      setIsProcessing(false)
    } catch (err) {
      console.error('Error in intermediate clustering 2:', err)
      setProcessingError('Could not generate preview. You can continue or retry.')
      setIsProcessing(false)
    }
  }

  const analyzeResponses = async () => {
    // Safety check for sessionId - use returned value since setState is async
    let currentSessionId = sessionId
    if (!currentSessionId) {
      console.error('No session ID - attempting to create one')
      currentSessionId = await createSession()
      if (!currentSessionId) {
        alert('Error starting flow. Please refresh and try again.')
        return
      }
    }

    setIsProcessing(true)
    setProcessingError(null)
    setCurrentScreen('processing')

    try {
      // Transform responses to match edge function format
      const allItems = []

      // All questions - just collect items without ratings
      ;['q1_topics', 'q2_impact', 'q3_chapters', 'q4_struggles', 'q5_rolemodels', 'q6_future', 'q7_pulls'].forEach(key => {
        responses[key].forEach(val => {
          if (val.trim()) {
            allItems.push(val.trim())
          }
        })
      })

      // Create allResponses array in the format the edge function expects
      const allResponses = [{
        user_id: user.id,
        response_raw: allItems.join('\n'),
        store_as: 'problems_all'
      }]

      // Call Claude API to generate clusters
      const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'problems_final', assistant_prompt: 'Problems clustering from all responses' },
          userResponse: 'Ready to see my problem themes',
          shouldCluster: true,
          clusterType: 'problems',
          clusterSources: ['problems_all'],
          allResponses: allResponses,
          conversationHistory: []
        }
      })

      if (error) throw error

      console.log('✅ API Response:', data)

      const returnedClusters = data.clusters || []

      // Store clusters for rating - don't save to DB yet
      setClusters(returnedClusters)

      // Reset cluster ratings for fresh rating
      setClusterRatings({})

      // Navigate to cluster rating screen
      setCurrentScreen('cluster_rating')
    } catch (err) {
      console.error('Error analyzing responses:', err)
      setProcessingError('Error generating insights. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Save clusters with ratings to database
  const saveWithRatings = async () => {
    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = await createSession()
      if (!currentSessionId) {
        alert('Error saving. Please try again.')
        return
      }
    }

    setIsProcessing(true)
    setCurrentScreen('saving')

    try {
      // Add proficiency rating to each cluster
      const clustersWithRatings = clusters.map(cluster => ({
        ...cluster,
        proficiency: clusterRatings[cluster.label] || 'pursuing'
      }))

      // Save clusters to database
      const clustersToSave = clustersWithRatings.map(cluster => ({
        user_id: user.id,
        session_id: currentSessionId,
        cluster_type: 'problems',
        cluster_stage: 'final',
        cluster_label: cluster.label,
        insight: cluster.insight,
        proficiency: cluster.proficiency,
        items: (cluster.items || []).map(item =>
          typeof item === 'string' ? { text: item } : item
        )
      }))

      console.log('💾 Saving to database:', clustersToSave)

      const { error: insertError } = await supabase
        .from('nikigai_clusters')
        .insert(clustersToSave)

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        throw insertError
      }

      // Update clusters state with ratings for wheel display
      setClusters(clustersWithRatings)

      // Mark session as completed
      await supabase
        .from('flow_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', currentSessionId)

      // Sync with 7-day challenge if active
      await syncFlowFinderWithChallenge(user.id, 'problems')

      // Clear auto-saved progress on success
      clearProgress()

      // Navigate to success screen
      setCurrentScreen('success')
    } catch (err) {
      console.error('Error saving:', err)
      setProcessingError('Error saving your results. Please try again.')
      setCurrentScreen('cluster_rating')
    } finally {
      setIsProcessing(false)
    }
  }

  // Back button handler
  const goBack = (fromScreen) => {
    const screenOrder = ['welcome', 'q1', 'q2', 'processing1', 'q3', 'q4', 'q5', 'processing2', 'q6', 'q7', 'processing', 'cluster_rating']
    const currentIndex = screenOrder.indexOf(fromScreen)
    if (currentIndex > 0) {
      // Skip processing screens when going back
      let targetIndex = currentIndex - 1
      if (screenOrder[targetIndex] === 'processing1') targetIndex = currentIndex - 2
      if (screenOrder[targetIndex] === 'processing2') targetIndex = currentIndex - 2
      if (screenOrder[targetIndex] === 'processing') targetIndex = currentIndex - 2
      setCurrentScreen(screenOrder[Math.max(0, targetIndex)])
    }
  }

  // Update cluster rating
  const setClusterRating = (clusterLabel, rating) => {
    setClusterRatings(prev => ({
      ...prev,
      [clusterLabel]: rating
    }))
  }

  // Check if all clusters have been rated
  const allClustersRated = () => {
    return clusters.length > 0 && clusters.every(cluster => clusterRatings[cluster.label])
  }

  // Validation message component
  const ValidationMessage = ({ questionKey, minCount = 3 }) => {
    const filled = getFilledCount(questionKey)
    const needed = minCount - filled
    if (filled >= minCount) return null
    return (
      <div className="validation-message" style={{ color: '#fbbf24', fontSize: '14px', marginTop: '8px', textAlign: 'center' }}>
        Please add {needed} more {needed === 1 ? 'answer' : 'answers'} to continue ({filled}/{minCount})
      </div>
    )
  }

  // Back button component (positioned below Continue button)
  const BackButton = ({ fromScreen }) => (
    <button
      className="back-button"
      onClick={() => goBack(fromScreen)}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '4px 0 2px 0',
        marginTop: '16px',
        marginBottom: '0',
        display: 'block',
        width: '100%',
        textAlign: 'center'
      }}
    >
      ← Go Back
    </button>
  )

  const renderWelcome = () => {
    // Helper to get readable screen name
    const getScreenDisplayName = (screen) => {
      const screenNames = {
        'q1': 'Question 1 (Topics)',
        'q2': 'Question 2 (Impact)',
        'q3': 'Question 3 (Chapters)',
        'q4': 'Question 4 (Struggles)',
        'q5': 'Question 5 (Role Models)',
        'q6': 'Question 6 (Future)',
        'q7': 'Question 7 (Pulls)'
      }
      return screenNames[screen] || screen
    }

    // Helper to get time since last save
    const getTimeSinceSave = () => {
      if (!savedProgressData?.savedAt) return null
      const minutesAgo = Math.floor((Date.now() - savedProgressData.savedAt) / 60000)
      if (minutesAgo < 1) return 'just now'
      if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`
      const hoursAgo = Math.floor(minutesAgo / 60)
      return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`
    }

    return (
      <div className="container welcome-container">
        <h1 className="welcome-greeting">Flow Finder: Problems Discovery</h1>

        {/* Resume Prompt - shown if saved progress exists */}
        {showResumePrompt && savedProgressData && (
          <div className="resume-prompt">
            <p className="resume-title">Welcome back!</p>
            <p className="resume-info">
              You have saved progress at <strong>{getScreenDisplayName(savedProgressData.currentScreen)}</strong>
              <br />
              <span className="resume-time">Last saved {getTimeSinceSave()}</span>
            </p>
            <div className="resume-actions">
              <button className="primary-button" onClick={handleResumeProgress}>
                Continue Where I Left Off
              </button>
              <button className="primary-button" onClick={handleStartFresh} style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none' }}>
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Normal welcome content - shown if no resume prompt */}
        {!showResumePrompt && (
          <>
            <div className="welcome-message">
              <p><strong>Hey {user?.user_metadata?.name || 'there'}!</strong></p>
              <p>Now let's discover the <strong>problems and changes you care about</strong> — the things that matter to you and the impact you want to create.</p>
              <p>We'll explore your learning interests, impact you've made, life chapters, role models, and future vision.</p>
              <p><strong>For each question, aim for 3-5+ bullet points.</strong></p>
            </div>

            <button className="primary-button" onClick={() => setCurrentScreen('q1')}>
              Yep!
            </button>
          </>
        )}
      </div>
    )
  }

  const renderQuestion1 = () => (
    <div className="container question-container">
      <div className="question-number">Question 1 of 7</div>
      <h2 className="question-text">What topics have you loved learning about?</h2>
      <p className="question-subtext">What are the topics of your favourite non-fiction books or podcasts? What feels like fun to learn about?</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q1_topics.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Psychology — how the mind works" :
                           index === 1 ? "Business — how ideas grow" :
                           index === 2 ? "Health — how the body heals" :
                           index === 3 ? "Creativity — how innovation happens" :
                           "Philosophy — what makes life meaningful"}
              value={value}
              onChange={(e) => updateResponse('q1_topics', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q1_topics')}>
        + Add More
      </button>

      {!hasMinimumAnswers('q1_topics') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q2')}
        disabled={!hasMinimumAnswers('q1_topics')}
        style={{ opacity: hasMinimumAnswers('q1_topics') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q1" />
    </div>
  )

  const renderQuestion2 = () => (
    <div className="container question-container">
      <div className="question-number">Question 2 of 7</div>
      <h2 className="question-text">What impact have you enjoyed making for others?</h2>
      <p className="question-subtext">What difference have you made? How have you helped others?</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q2_impact.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Helped a friend rebuild their confidence after a setback" :
                           index === 1 ? "Created a system that saved my team 10 hours per week" :
                           index === 2 ? "Mentored junior colleagues through career transitions" :
                           index === 3 ? "Designed a workshop that helped people find clarity" :
                           "Built a community where people felt safe to be themselves"}
              value={value}
              onChange={(e) => updateResponse('q2_impact', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q2_impact')}>
        + Add More
      </button>

      {!hasMinimumAnswers('q2_impact') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={runIntermediateClustering1}
        disabled={!hasMinimumAnswers('q2_impact')}
        style={{ opacity: hasMinimumAnswers('q2_impact') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q2" />
    </div>
  )

  const renderProcessing1 = () => (
    <div className="container processing-container">
      {isProcessing ? (
        <>
          <div className="spinner"></div>
          <div className="processing-text">Discovering early patterns...</div>
          <div className="processing-subtext">
            Looking for themes across your learning interests and impact created.
            <br /><br />
            This usually takes 10-15 seconds.
          </div>
        </>
      ) : processingError ? (
        <>
          <div className="processing-text" style={{ color: '#fbbf24' }}>{processingError}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
            <button className="primary-button" onClick={runIntermediateClustering1} style={{ background: 'rgba(255,255,255,0.1)' }}>
              Retry
            </button>
            <button className="primary-button" onClick={() => setCurrentScreen('q3')}>
              Continue Anyway
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="processing-text">Early Problem Themes</div>
          <div className="processing-subtext" style={{ marginBottom: '24px' }}>
            Based on your learning interests and impact, here's what we're seeing so far:
          </div>

          <div className="cluster-preview" style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            {intermediateClusters1.map((cluster, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: '3px solid #fbbf24' }}>
                <strong style={{ color: '#fbbf24' }}>{cluster.label}</strong>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>{cluster.insight}</p>
              </div>
            ))}
          </div>

          <div className="processing-subtext" style={{ marginTop: '24px' }}>
            Let's go deeper — your life story will reveal even more.
          </div>

          <button className="primary-button" onClick={() => setCurrentScreen('q3')} style={{ marginTop: '24px' }}>
            Continue
          </button>
        </>
      )}
    </div>
  )

  const renderQuestion3 = () => (
    <div className="container question-container">
      <div className="question-number">Question 3 of 7</div>
      <h2 className="question-text">If you saw your life as a story, what are the chapters?</h2>
      <p className="question-subtext">Think of major phases or turning points in your journey</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q3_chapters.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "The Explorer Years" :
                           index === 1 ? "The Rebuild" :
                           index === 2 ? "The Awakening" :
                           index === 3 ? "Finding My Voice" :
                           "Building My Legacy"}
              value={value}
              onChange={(e) => updateResponse('q3_chapters', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q3_chapters')}>
        + Add More
      </button>

      {!hasMinimumAnswers('q3_chapters') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => {
          // Pre-fill Q4 with chapter names from Q3
          const filledChapters = responses.q3_chapters.filter(ch => ch.trim())
          if (filledChapters.length > 0) {
            const prefilled = filledChapters.map(chapter => `${chapter} — `)
            // Pad with empty strings if needed to maintain minimum 5 inputs
            while (prefilled.length < 5) {
              prefilled.push('')
            }
            setResponses(prev => ({
              ...prev,
              q4_struggles: prefilled
            }))
          }
          setCurrentScreen('q4')
        }}
        disabled={!hasMinimumAnswers('q3_chapters')}
        style={{ opacity: hasMinimumAnswers('q3_chapters') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q3" />
    </div>
  )

  const renderQuestion4 = () => {
    // Get chapter names for dynamic placeholders
    const getPlaceholder = (index) => {
      const chapter = responses.q3_chapters[index]?.trim()
      if (chapter) {
        return `${chapter} — describe the struggle...`
      }
      // Default placeholders if no chapter entered
      const defaults = [
        "The Explorer Years — finding a place I felt safe to be myself",
        "The Rebuild — recovering from burnout and redefining success",
        "The Awakening — letting go of others' expectations",
        "Finding My Voice — overcoming fear of visibility",
        "Building My Legacy — balancing ambition with presence"
      ]
      return defaults[index] || "Chapter name — describe the struggle..."
    }

    return (
    <div className="container question-container">
      <div className="question-number">Question 4 of 7</div>
      <h2 className="question-text">For each chapter, what struggle did you face?</h2>
      <p className="question-subtext">We've pre-filled your chapter names — now add the struggle you faced</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q4_struggles.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={getPlaceholder(index)}
              value={value}
              onChange={(e) => updateResponse('q4_struggles', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q4_struggles')}>
        + Add More
      </button>

      {!hasMinimumAnswers('q4_struggles') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q5')}
        disabled={!hasMinimumAnswers('q4_struggles')}
        style={{ opacity: hasMinimumAnswers('q4_struggles') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q4" />
    </div>
  )}

  const renderQuestion5 = () => (
    <div className="container question-container">
      <div className="question-number">Question 5 of 7</div>
      <h2 className="question-text">Who has inspired you the most?</h2>
      <p className="question-subtext">Include both the person and why they're meaningful to you</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q5_rolemodels.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Brené Brown — Her work on vulnerability helped me accept imperfection" :
                           index === 1 ? "My grandmother — Showed me the power of resilience and quiet strength" :
                           index === 2 ? "Seth Godin — Taught me to see marketing as service, not manipulation" :
                           index === 3 ? "Hermione Granger — Demonstrated that being smart is powerful" :
                           "My first manager — Believed in me before I believed in myself"}
              value={value}
              onChange={(e) => updateResponse('q5_rolemodels', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q5_rolemodels')}>
        + Add More
      </button>

      {!hasMinimumAnswers('q5_rolemodels') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={runIntermediateClustering2}
        disabled={!hasMinimumAnswers('q5_rolemodels')}
        style={{ opacity: hasMinimumAnswers('q5_rolemodels') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q5" />
    </div>
  )

  const renderProcessing2 = () => (
    <div className="container processing-container">
      {isProcessing ? (
        <>
          <div className="spinner"></div>
          <div className="processing-text">Deepening the analysis...</div>
          <div className="processing-subtext">
            Adding your life chapters, struggles, and role models to understand the full picture.
            <br /><br />
            This usually takes 10-15 seconds.
          </div>
        </>
      ) : processingError ? (
        <>
          <div className="processing-text" style={{ color: '#fbbf24' }}>{processingError}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
            <button className="primary-button" onClick={runIntermediateClustering2} style={{ background: 'rgba(255,255,255,0.1)' }}>
              Retry
            </button>
            <button className="primary-button" onClick={() => setCurrentScreen('q6')}>
              Continue Anyway
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="processing-text">Your Problem Themes Are Taking Shape</div>
          <div className="processing-subtext" style={{ marginBottom: '24px' }}>
            Your life story adds rich context to what you care about:
          </div>

          <div className="cluster-preview" style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
            {intermediateClusters2.map((cluster, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: '3px solid #fbbf24' }}>
                <strong style={{ color: '#fbbf24' }}>{cluster.label}</strong>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>{cluster.insight}</p>
              </div>
            ))}
          </div>

          <div className="processing-subtext" style={{ marginTop: '24px' }}>
            Almost there! Let's capture your vision for the future.
          </div>

          <button className="primary-button" onClick={() => setCurrentScreen('q6')} style={{ marginTop: '24px' }}>
            Continue
          </button>
        </>
      )}
    </div>
  )

  const renderQuestion6 = () => (
    <div className="container question-container">
      <div className="question-number">Question 6 of 7</div>
      <h2 className="question-text">What do you feel called to create, experience, or change?</h2>
      <p className="question-subtext">What impact do you want to make? What do you want to exist?</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q6_future.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Help people escape toxic work environments and build meaningful careers" :
                           index === 1 ? "Create spaces where vulnerability is celebrated, not punished" :
                           index === 2 ? "Build a community of people doing work that matters" :
                           index === 3 ? "Write a book that helps people find their path" :
                           "Design systems that make growth feel playful instead of painful"}
              value={value}
              onChange={(e) => updateResponse('q6_future', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q6_future')}>
        + Add More
      </button>

      {!hasMinimumAnswers('q6_future') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q7')}
        disabled={!hasMinimumAnswers('q6_future')}
        style={{ opacity: hasMinimumAnswers('q6_future') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q6" />
    </div>
  )

  const renderQuestion7 = () => (
    <div className="container question-container">
      <div className="question-number">Question 7 of 7</div>
      <h2 className="question-text">What are your top 3 future pulls?</h2>
      <p className="question-subtext">From everything you shared, what feels most energizing?</p>

      <div className="input-list">
        {responses.q7_pulls.slice(0, 3).map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Building a coaching practice around career transformation" :
                           index === 1 ? "Creating a course that helps people find their ikigai" :
                           "Starting a podcast interviewing people who've made bold pivots"}
              value={value}
              onChange={(e) => updateResponse('q7_pulls', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button
        className="primary-button"
        onClick={analyzeResponses}
        disabled={!hasMinimumAnswers('q7_pulls', 3)}
        style={{ opacity: hasMinimumAnswers('q7_pulls', 3) ? 1 : 0.5 }}
      >
        Analyze My Answers
      </button>
      <BackButton fromScreen="q7" />
    </div>
  )

  const renderClusterRating = () => {
    const ratedCount = Object.keys(clusterRatings).length
    const totalCount = clusters.length

    return (
      <div className="container question-container">
        <div className="question-number">Rate Your Problem Themes</div>
        <h2 className="question-text">Where are you with each theme?</h2>
        <p className="question-subtext">
          For each problem area you care about, rate your current stage of engagement.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            {PROBLEMS_PROFICIENCY_RINGS.map(ring => (
              <div key={ring.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: ring.color }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{ring.label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '8px' }}>
            <strong>Exploring</strong> = Just learning about this &nbsp;|&nbsp;
            <strong>Pursuing</strong> = Actively working on it &nbsp;|&nbsp;
            <strong>Proven</strong> = Solved it / Helping others
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
            {ratedCount} of {totalCount} rated
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          {clusters.map((cluster, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderLeft: clusterRatings[cluster.label] ? '3px solid #6BCB77' : '3px solid rgba(255,255,255,0.2)'
              }}
            >
              <div style={{ fontWeight: '600', color: '#fbbf24', fontSize: '1.1rem' }}>{cluster.label}</div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                {cluster.insight}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                Based on: {(cluster.items || []).slice(0, 3).map(item =>
                  `"${typeof item === 'string' ? item.substring(0, 30) : item.text?.substring(0, 30)}..."`
                ).join(', ')}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setClusterRating(cluster.label, 'exploring')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    background: clusterRatings[cluster.label] === 'exploring'
                      ? '#fbbf24'
                      : 'rgba(251, 191, 36, 0.15)',
                    color: clusterRatings[cluster.label] === 'exploring'
                      ? '#1a1a2e'
                      : '#fbbf24',
                    transition: 'all 0.2s'
                  }}
                >
                  Exploring
                </button>
                <button
                  onClick={() => setClusterRating(cluster.label, 'pursuing')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    background: clusterRatings[cluster.label] === 'pursuing'
                      ? '#60a5fa'
                      : 'rgba(96, 165, 250, 0.15)',
                    color: clusterRatings[cluster.label] === 'pursuing'
                      ? '#1a1a2e'
                      : '#60a5fa',
                    transition: 'all 0.2s'
                  }}
                >
                  Pursuing
                </button>
                <button
                  onClick={() => setClusterRating(cluster.label, 'proven')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px',
                    background: clusterRatings[cluster.label] === 'proven'
                      ? '#6BCB77'
                      : 'rgba(107, 203, 119, 0.15)',
                    color: clusterRatings[cluster.label] === 'proven'
                      ? '#1a1a2e'
                      : '#6BCB77',
                    transition: 'all 0.2s'
                  }}
                >
                  Proven
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="primary-button"
          onClick={saveWithRatings}
          disabled={!allClustersRated()}
          style={{ opacity: allClustersRated() ? 1 : 0.5 }}
        >
          Save & See My Results
        </button>
        <BackButton fromScreen="cluster_rating" />
      </div>
    )
  }

  const renderSaving = () => (
    <div className="container processing-container">
      <div className="spinner"></div>
      <div className="processing-text">Saving your results...</div>
      <div className="processing-subtext">
        Just a moment while we save your problem themes.
      </div>
    </div>
  )

  const renderProcessing = () => (
    <div className="container processing-container">
      {isProcessing ? (
        <>
          <div className="spinner"></div>
          <div className="processing-text">Creating your final problem themes...</div>
          <div className="processing-subtext">
            Bringing together all your responses to reveal the problems and changes you care about most.
            <br /><br />
            This usually takes 10-15 seconds.
          </div>
        </>
      ) : processingError ? (
        <>
          <div className="processing-text" style={{ color: '#ef4444' }}>{processingError}</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
            <button className="primary-button" onClick={analyzeResponses}>
              Retry
            </button>
            <button
              className="primary-button"
              onClick={() => setCurrentScreen('q7')}
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              Go Back
            </button>
          </div>
        </>
      ) : null}
    </div>
  )

  const renderSuccess = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Here's what we discovered about you</h1>
      <div className="welcome-message">
        <p>Based on your responses, we've identified {clusters.length} problem themes that represent the impact you want to create in the world:</p>
      </div>

      {/* Problems Wheel Visualization */}
      <div className="wheel-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
        <GradientWheel
          segments={problemsWithHue}
          rings={PROBLEMS_PROFICIENCY_RINGS}
          litCells={litCells}
          size={300}
          centerLabel="PROBLEMS"
          interactive={false}
          celebrate={true}
        />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'transparent' }}></span>
            Inner: Exploring
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.3)' }}></span>
            Middle: Pursuing
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }}></span>
            Outer: Proven
          </span>
        </div>
        <div style={{ fontSize: '13px', color: '#6BCB77', marginTop: '12px', fontWeight: '500' }}>
          {litCells.size} problem areas identified
        </div>
      </div>

      {/* All Clusters with Proficiency Badges */}
      <div className="cluster-grid" style={{ margin: '24px 0' }}>
        {clusters.map((cluster, index) => {
          const proficiency = cluster.proficiency || 'pursuing'
          const proficiencyColors = {
            exploring: { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' },
            pursuing: { bg: 'rgba(96, 165, 250, 0.2)', text: '#60a5fa' },
            proven: { bg: 'rgba(107, 203, 119, 0.2)', text: '#6BCB77' }
          }
          const colors = proficiencyColors[proficiency]

          return (
            <div
              key={index}
              className="cluster-card"
              style={{ cursor: 'default', borderColor: 'rgba(251, 191, 36, 0.3)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>{cluster.label}</h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: colors.bg,
                  color: colors.text
                }}>
                  {proficiency}
                </span>
              </div>
              <p>{cluster.insight}</p>
              <div className="cluster-evidence">
                <div className="cluster-evidence-label">Based on your responses:</div>
                <ul className="evidence-list">
                  {(cluster.items || []).map((item, i) => (
                    <li key={i}>"{typeof item === 'string' ? item : item.text || item}"</li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      <h1 className="welcome-greeting" style={{ marginTop: '40px' }}>✓ Problems Discovery Complete!</h1>
      <div className="welcome-message">
        <p>These problem themes represent the impact you want to create in the world—the changes that matter to you.</p>
        <p style={{ marginTop: '24px' }}><strong>Next up:</strong> Let's discover who you're most qualified to serve.</p>
      </div>

      <FlowFeedback flowType="nikigai_problems" userId={user?.id} />

      <Link to="/nikigai/persona" className="primary-button" style={{ marginTop: '24px', display: 'block', textDecoration: 'none', textAlign: 'center' }}>
        Continue to Persona Discovery
      </Link>
      <Link
        to="/me"
        className="primary-button"
        style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none', marginTop: '12px', display: 'block', textDecoration: 'none', textAlign: 'center' }}
      >
        Save & Return to Dashboard
      </Link>
    </div>
  )

  // Get current progress step for dots
  const getCurrentStep = () => {
    const screenToStep = {
      'welcome': 0,
      'q1': 1,
      'q2': 1,
      'processing1': 2,
      'q3': 3,
      'q4': 3,
      'q5': 3,
      'processing2': 4,
      'q6': 5,
      'q7': 5,
      'processing': 6,
      'cluster_rating': 6,
      'saving': 7,
      'success': 7
    }
    return screenToStep[currentScreen] || 0
  }

  // Main render logic
  const screens = {
    welcome: renderWelcome,
    q1: renderQuestion1,
    q2: renderQuestion2,
    processing1: renderProcessing1,
    q3: renderQuestion3,
    q4: renderQuestion4,
    q5: renderQuestion5,
    processing2: renderProcessing2,
    q6: renderQuestion6,
    q7: renderQuestion7,
    processing: renderProcessing,
    cluster_rating: renderClusterRating,
    saving: renderSaving,
    success: renderSuccess
  }

  return (
    <div className="flow-finder-app">
      {/* Progress Dots */}
      <div className="progress-container">
        <div className="progress-dots">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i === getCurrentStep() ? 'active' : ''
              } ${i < getCurrentStep() ? 'completed' : ''}`}
            ></div>
          ))}
        </div>
      </div>

      {screens[currentScreen]?.()}
    </div>
  )
}
