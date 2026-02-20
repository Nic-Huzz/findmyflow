import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { useAutoSave } from '../hooks/useAutoSave'
import { JOURNEY_STAGES } from '../lib/wheelTaxonomy'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
import './FlowFinder.css'

export default function FlowFinderPersona() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [viewingResults, setViewingResults] = useState(false)
  const [clusters, setClusters] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  // Journey stage ratings for each persona: { 'cluster_label': 'awakening' | 'struggling' | 'ready' }
  const [personaRatings, setPersonaRatings] = useState({})

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('flow-finder-persona', user?.id)

  // Create flow session on mount (skip if viewing results)
  useEffect(() => {
    if (searchParams.get('results') !== 'true') {
      createSession()
    }
  }, [])

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      setViewingResults(true)
      try {
        // Load saved clusters from database
        const { data: savedClusters, error } = await supabase
          .from('nikigai_clusters')
          .select('*')
          .eq('user_id', user.id)
          .eq('cluster_type', 'persona')
          .eq('cluster_stage', 'final')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (savedClusters && savedClusters.length > 0) {
          // Get most recent session's clusters
          const mostRecentSessionId = savedClusters[0].session_id
          const sessionClusters = savedClusters.filter(c => c.session_id === mostRecentSessionId)

          // Transform to match expected format
          const formattedClusters = sessionClusters.map(c => ({
            label: c.cluster_label,
            insight: c.insight,
            items: c.items || [],
            journeyStage: c.proficiency || c.items?.[0]?.journeyStage || null // Support both new and legacy format
          }))

          setClusters(formattedClusters)
          setCurrentScreen('success')
        } else {
          // No saved results, show welcome
          setViewingResults(false)
        }
      } catch (err) {
        console.error('Error loading saved results:', err)
        setViewingResults(false)
      }
    }

    loadSavedResults()
  }, [searchParams, user])

  // Check for saved progress on mount (auto-save)
  useEffect(() => {
    if (user && !viewingResults) {
      const saved = loadProgress()
      if (saved && saved.currentScreen && saved.currentScreen !== 'welcome' && saved.currentScreen !== 'success') {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, loadProgress, viewingResults])

  // Auto-save progress on state changes
  useEffect(() => {
    if (!user || currentScreen === 'welcome' || currentScreen === 'success' || currentScreen === 'processing' || viewingResults) return
    const progressData = { currentScreen, personaRatings, clusters }
    saveProgress(progressData)
  }, [currentScreen, personaRatings, clusters, user, saveProgress, viewingResults])

  const createSession = async () => {
    try {
      const { data, error } = await supabase
        .from('flow_sessions')
        .insert({
          user_id: user.id,
          flow_type: 'nikigai_persona',
          status: 'in_progress'
        })
        .select()
        .single()

      if (error) throw error
      setSessionId(data.id)
      return data.id
    } catch (err) {
      console.error('Error creating session:', err)
      return null
    }
  }

  // Handle resuming saved progress (auto-save)
  const handleResumeProgress = () => {
    if (savedProgressData) {
      setCurrentScreen(savedProgressData.currentScreen)
      if (savedProgressData.personaRatings) {
        setPersonaRatings(savedProgressData.personaRatings)
      }
      if (savedProgressData.clusters) {
        setClusters(savedProgressData.clusters)
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
    setCurrentScreen('confirm')
  }

  // Update rating for a persona
  const setPersonaRating = (personaLabel, rating) => {
    setPersonaRatings(prev => ({
      ...prev,
      [personaLabel]: rating
    }))
  }

  // Check if all personas have been rated
  const allPersonasRated = () => {
    return clusters.every(cluster => personaRatings[cluster.label])
  }

  const analyzeJourney = async () => {
    // Safety check for sessionId
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
    setCurrentScreen('processing')

    try {
      // Fetch user's Problems clusters to analyze for personas
      const { data: problemsClusters, error: fetchError } = await supabase
        .from('nikigai_clusters')
        .select('*')
        .eq('user_id', user.id)
        .eq('cluster_type', 'problems')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching problems clusters:', fetchError)
        // Continue anyway with empty data
      }

      // Build context from problems clusters
      const problemsContext = problemsClusters?.map(c =>
        `${c.cluster_label}: ${c.insight}`
      ).join('\n') || 'No problems data available'

      // Create allResponses array in the format the edge function expects
      const allResponses = [{
        user_id: user.id,
        response_raw: problemsContext,
        store_as: 'persona_analysis'
      }]

      // Call Claude API to generate persona clusters with new format
      const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'persona_final', assistant_prompt: 'Persona clustering from user journey' },
          userResponse: 'Ready to discover who I serve',
          shouldCluster: true,
          clusterType: 'persona',
          clusterSources: ['persona_analysis'],
          allResponses: allResponses,
          conversationHistory: []
        }
      })

      if (error) throw error

      console.log('✅ API Response:', data)

      const returnedClusters = data.clusters || []
      setClusters(returnedClusters)

      // Go to rating screen instead of success
      setCurrentScreen('rating')
    } catch (err) {
      console.error('Error analyzing journey:', err)
      alert('Error generating insights. Please try again.')
      setCurrentScreen('confirm')
    } finally {
      setIsProcessing(false)
    }
  }

  // Save clusters with journey stage ratings to database
  const saveWithRatings = async () => {
    let currentSessionId = sessionId
    if (!currentSessionId) {
      currentSessionId = await createSession()
      if (!currentSessionId) {
        alert('Error saving. Please try again.')
        return
      }
    }

    try {
      // Add journey stage to each cluster
      const clustersWithRatings = clusters.map(cluster => ({
        ...cluster,
        journeyStage: personaRatings[cluster.label] || 'struggling'
      }))

      // Save clusters to database with proficiency column
      const clustersToSave = clustersWithRatings.map(cluster => ({
        user_id: user.id,
        session_id: currentSessionId,
        cluster_type: 'persona',
        cluster_stage: 'final',
        cluster_label: cluster.label,
        insight: cluster.insight,
        proficiency: cluster.journeyStage, // awakening, struggling, or ready
        items: (cluster.items || []).map(item => ({
          text: typeof item === 'string' ? item : item.text || item
        }))
      }))

      console.log('💾 Saving to database:', clustersToSave)

      const { error: insertError } = await supabase
        .from('nikigai_clusters')
        .insert(clustersToSave)

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        throw insertError
      }

      // Update local state with ratings
      setClusters(clustersWithRatings)

      // Mark session as completed
      await supabase
        .from('flow_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', currentSessionId)

      // Sync with 7-day challenge if active
      await syncFlowFinderWithChallenge(user.id, 'persona')

      // Clear auto-saved progress on success
      clearProgress()

      // Navigate to success screen
      setCurrentScreen('success')
    } catch (err) {
      console.error('Error saving with ratings:', err)
      alert('Error saving. Please try again.')
    }
  }

  const renderWelcome = () => {
    // Helper to get readable screen name
    const getScreenDisplayName = (screen) => {
      const screenNames = {
        'confirm': 'Ready to Generate',
        'rating': 'Rating Personas'
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
        <h1 className="welcome-greeting">Flow Finder: Persona Discovery</h1>

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
              <p>Now let's discover <strong>who you're most qualified to serve.</strong></p>
            </div>

            <div className="insight-box" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderLeft: '4px solid #fbbf24',
              borderRadius: '8px',
              padding: '20px',
              margin: '32px 0',
              textAlign: 'left'
            }}>
              <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.8' }}><strong>Here's the key insight:</strong></p>
              <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.8' }}>You're most qualified to help <strong>former versions of yourself.</strong></p>
              <p style={{ marginBottom: 0, fontSize: '16px', lineHeight: '1.8' }}>The struggles you've overcome, the growth you've experienced — that's your superpower. You understand those people because you <em>were</em> those people.</p>
            </div>

            <div className="welcome-message">
              <p>I'll analyze your journey across the skills and problems flows to identify the personas you're uniquely qualified to serve.</p>
            </div>

            <button className="primary-button" onClick={() => setCurrentScreen('confirm')}>
              Yes, show me!
            </button>
          </>
        )}
      </div>
    )
  }

  const renderConfirm = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Ready to Discover Your People?</h1>
      <div className="welcome-message">
        <p>I'll analyze:</p>
      </div>

      <div className="insight-box" style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderLeft: '4px solid #fbbf24',
        borderRadius: '8px',
        padding: '20px',
        margin: '32px 0',
        textAlign: 'left'
      }}>
        <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.8' }}>✓ Your life chapters and struggles</p>
        <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.8' }}>✓ Your role models and their impact</p>
        <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.8' }}>✓ Your learning topics and interests</p>
        <p style={{ marginBottom: '12px', fontSize: '16px', lineHeight: '1.8' }}>✓ The impact you've created</p>
        <p style={{ marginBottom: 0, fontSize: '16px', lineHeight: '1.8' }}>✓ Your future vision and desires</p>
      </div>

      <div className="welcome-message">
        <p>From this, I'll identify 3-5 personas — former versions of you at different life stages — who need what you've learned.</p>
      </div>

      <button className="primary-button" onClick={analyzeJourney}>
        Generate Personas
      </button>
    </div>
  )

  const renderProcessing = () => (
    <div className="container processing-container">
      <div className="spinner"></div>
      <div className="processing-text">Analyzing your journey...</div>
      <div className="processing-subtext">
        Looking across your life chapters, struggles, growth, and impact to identify the personas you're most qualified to serve.
        <br /><br />
        This usually takes 10-15 seconds.
      </div>
    </div>
  )

  const renderRating = () => {
    const ratedCount = Object.keys(personaRatings).length
    const totalCount = clusters.length

    return (
      <div className="container question-container">
        <div className="question-number">Final Step</div>
        <h2 className="question-text">Where are they on their journey?</h2>
        <p className="question-subtext">
          For each persona, where are they in becoming aware of their problem?
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
            {JOURNEY_STAGES.map(stage => (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: stage.color }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{stage.label}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
            {ratedCount} of {totalCount} rated
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {clusters.map((cluster, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', color: 'white', marginBottom: '4px' }}>{cluster.label}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{cluster.insight}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPersonaRating(cluster.label, 'awakening')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '13px',
                    background: personaRatings[cluster.label] === 'awakening'
                      ? '#fbbf24'
                      : 'rgba(251, 191, 36, 0.15)',
                    color: personaRatings[cluster.label] === 'awakening'
                      ? '#1a1a2e'
                      : '#fbbf24',
                    transition: 'all 0.2s'
                  }}
                >
                  Awakening
                </button>
                <button
                  onClick={() => setPersonaRating(cluster.label, 'struggling')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '13px',
                    background: personaRatings[cluster.label] === 'struggling'
                      ? '#60a5fa'
                      : 'rgba(96, 165, 250, 0.15)',
                    color: personaRatings[cluster.label] === 'struggling'
                      ? '#1a1a2e'
                      : '#60a5fa',
                    transition: 'all 0.2s'
                  }}
                >
                  Struggling
                </button>
                <button
                  onClick={() => setPersonaRating(cluster.label, 'ready')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '13px',
                    background: personaRatings[cluster.label] === 'ready'
                      ? '#6BCB77'
                      : 'rgba(107, 203, 119, 0.15)',
                    color: personaRatings[cluster.label] === 'ready'
                      ? '#1a1a2e'
                      : '#6BCB77',
                    transition: 'all 0.2s'
                  }}
                >
                  Ready
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="primary-button"
          onClick={saveWithRatings}
          disabled={!allPersonasRated()}
          style={{ opacity: allPersonasRated() ? 1 : 0.5 }}
        >
          Save & See Results
        </button>
      </div>
    )
  }

  const renderSuccess = () => {
    // Get journey stage info for display
    const getJourneyStageInfo = (stage) => {
      return JOURNEY_STAGES.find(s => s.id === stage) || JOURNEY_STAGES[1]
    }

    return (
      <div className="container welcome-container">
        <h1 className="welcome-greeting">Here's what we discovered about you</h1>
        <div className="welcome-message">
          <p>Based on your journey, we've identified {clusters.length} personas—former versions of yourself who need what you've learned:</p>
        </div>

        {/* All Clusters with journey stage badges */}
        <div className="cluster-grid" style={{ margin: '32px 0' }}>
          {clusters.map((cluster, index) => {
            const stageInfo = getJourneyStageInfo(cluster.journeyStage || personaRatings[cluster.label])
            return (
              <div
                key={index}
                className="cluster-card"
                style={{ cursor: 'default', borderColor: 'rgba(251, 191, 36, 0.3)' }}
              >
                {stageInfo && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: `${stageInfo.color}20`,
                    color: stageInfo.color,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stageInfo.color }} />
                    {stageInfo.label}
                  </div>
                )}
                <h3>{cluster.label}</h3>
                <p>{cluster.insight}</p>
                <div className="cluster-evidence">
                  <div className="cluster-evidence-label">Why you're qualified to serve them:</div>
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

        <h1 className="welcome-greeting" style={{ marginTop: '40px' }}>✓ Persona Discovery Complete!</h1>
        <div className="welcome-message">
          <p>These are former versions of you. You understand their struggles because you've lived them. You know what they need because you needed it too.</p>
        </div>

        <div className="welcome-message" style={{ marginTop: '24px' }}>
          <p>These aren't just customer profiles — <strong>they're your audience.</strong> The people whose lives change when they experience your art.</p>
          {clusters.length >= 2 && (
            <p style={{ marginTop: '16px', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.8)' }}>
              {clusters[0].label} is waiting for your message. {clusters[Math.min(1, clusters.length - 1)].label} is waiting for your message. Your art was made for these people.
            </p>
          )}
          <p style={{ marginTop: '24px' }}><strong>Let's bring it all together.</strong></p>
        </div>

        <FlowFeedback flowType="nikigai_persona" userId={user?.id} />

        <a href="/nikigai/integration" className="primary-button" style={{ marginTop: '24px', display: 'block', textDecoration: 'none', textAlign: 'center' }}>
          See Your Art Statement
        </a>
        <a
          href="/me"
          className="primary-button"
          style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none', marginTop: '12px', display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          Save & Return to Dashboard
        </a>
      </div>
    )
  }

  // Main render logic
  const screens = {
    welcome: renderWelcome,
    confirm: renderConfirm,
    processing: renderProcessing,
    rating: renderRating,
    success: renderSuccess
  }

  return (
    <div className="flow-finder-app">
      {/* Progress Dots - 5 dots for flow with rating */}
      <div className="progress-container">
        <div className="progress-dots">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i === 0 && currentScreen === 'welcome' ? 'active' :
                i === 1 && currentScreen === 'confirm' ? 'active' :
                i === 2 && currentScreen === 'processing' ? 'active' :
                i === 3 && currentScreen === 'rating' ? 'active' :
                i === 4 && currentScreen === 'success' ? 'active' :
                ''
              } ${
                (i === 0 && ['confirm', 'processing', 'rating', 'success'].includes(currentScreen)) ||
                (i === 1 && ['processing', 'rating', 'success'].includes(currentScreen)) ||
                (i === 2 && ['rating', 'success'].includes(currentScreen)) ||
                (i === 3 && currentScreen === 'success')
                ? 'completed' : ''
              }`}
            ></div>
          ))}
        </div>
      </div>

      {screens[currentScreen]?.()}
    </div>
  )
}
