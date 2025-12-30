import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { useAutoSave } from '../hooks/useAutoSave'
import '../FlowFinder.css'

export default function FlowFinderPersona() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [clusters, setClusters] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('flow-finder-persona', user?.id)

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
    if (!user || currentScreen === 'welcome' || currentScreen === 'success' || currentScreen === 'processing') return
    const progressData = { currentScreen }
    saveProgress(progressData)
  }, [currentScreen, user, saveProgress])

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
    } catch (err) {
      console.error('Error creating session:', err)
    }
  }

  // Handle resuming saved progress (auto-save)
  const handleResumeProgress = () => {
    if (savedProgressData) {
      setCurrentScreen(savedProgressData.currentScreen)
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

  const analyzeJourney = async () => {
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

      // Save clusters to database
      const clustersToSave = returnedClusters.map(cluster => ({
        user_id: user.id,
        session_id: sessionId,
        cluster_type: 'persona',
        cluster_stage: 'final',  // Required field: 'preview', 'intermediate', or 'final'
        cluster_label: cluster.label,
        insight: cluster.insight,
        items: Array.isArray(cluster.items) ? cluster.items : []  // Changed from 'evidence' to 'items'
      }))

      console.log('💾 Saving to database:', clustersToSave)

      const { error: insertError } = await supabase
        .from('nikigai_clusters')
        .insert(clustersToSave)

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        throw insertError
      }

      setClusters(data.clusters)

      // Mark session as completed
      await supabase
        .from('flow_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      // Sync with 7-day challenge if active
      await syncFlowFinderWithChallenge(user.id, 'persona')

      // Clear auto-saved progress on success
      clearProgress()

      // Navigate to success screen
      setCurrentScreen('success')
    } catch (err) {
      console.error('Error analyzing journey:', err)
      alert('Error generating insights. Please try again.')
      setCurrentScreen('confirm')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderWelcome = () => {
    // Helper to get readable screen name
    const getScreenDisplayName = (screen) => {
      const screenNames = {
        'confirm': 'Ready to Generate'
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

  const renderSuccess = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Here's what we discovered about you</h1>
      <div className="welcome-message">
        <p>Based on your journey, we've identified 5 personas—former versions of yourself who need what you've learned:</p>
      </div>

      {/* All Clusters (Read-only, no selection) */}
      <div className="cluster-grid" style={{ margin: '32px 0' }}>
        {clusters.map((cluster, index) => (
          <div
            key={index}
            className="cluster-card"
            style={{ cursor: 'default', borderColor: 'rgba(251, 191, 36, 0.3)' }}
          >
            <h3>{cluster.label}</h3>
            <p>{cluster.insight}</p>
            <div className="cluster-evidence">
              <div className="cluster-evidence-label">Why you're qualified to serve them:</div>
              <ul className="evidence-list">
                {cluster.items?.map((item, i) => (
                  <li key={i}>"{item}"</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <h1 className="welcome-greeting" style={{ marginTop: '40px' }}>✓ Persona Discovery Complete!</h1>
      <div className="welcome-message">
        <p>These are former versions of you. You understand their struggles because you've lived them. You know what they need because you needed it too.</p>
        <p style={{ marginTop: '24px' }}><strong>Next up:</strong> Let's bring it all together and find your unique opportunity.</p>
      </div>

      <Link to="/nikigai/integration" className="primary-button">
        Continue to Connecting the Dots
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

  // Main render logic
  const screens = {
    welcome: renderWelcome,
    confirm: renderConfirm,
    processing: renderProcessing,
    success: renderSuccess
  }

  return (
    <div className="flow-finder-app">
      {/* Progress Dots - 4 dots for simpler flow */}
      <div className="progress-container">
        <div className="progress-dots">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i === 0 && currentScreen === 'welcome' ? 'active' :
                i === 1 && currentScreen === 'confirm' ? 'active' :
                i === 2 && currentScreen === 'processing' ? 'active' :
                i === 3 && currentScreen === 'success' ? 'active' :
                ''
              } ${
                (i === 0 && ['confirm', 'processing', 'success'].includes(currentScreen)) ||
                (i === 1 && ['processing', 'success'].includes(currentScreen)) ||
                (i === 2 && currentScreen === 'success')
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
