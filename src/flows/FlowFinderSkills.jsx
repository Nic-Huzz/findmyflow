import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { useAutoSave } from '../hooks/useAutoSave'
import '../FlowFinder.css'

export default function FlowFinderSkills() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('time_check')
  const [responses, setResponses] = useState({
    q1_childhood: ['', '', '', '', ''],
    q2_highschool: ['', '', '', '', ''],
    q3_postschool: ['', '', '', '', ''],
    q4_work: ['', '', '', '', ''],
    q5_skills: ['', '', '', '', '']
  })
  const [clusters, setClusters] = useState([])
  const [preliminaryClusters, setPreliminaryClusters] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Auto-save state
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedProgressData, setSavedProgressData] = useState(null)
  const { saveProgress, loadProgress, clearProgress } = useAutoSave('flow-finder-skills', user?.id)

  // Create flow session on mount
  useEffect(() => {
    createSession()
  }, [])

  // Trigger preliminary analysis when reaching processing1 screen
  useEffect(() => {
    if (currentScreen === 'processing1' && preliminaryClusters.length === 0) {
      analyzePreliminary()
    }
  }, [currentScreen])

  // Check for saved progress on mount (auto-save)
  useEffect(() => {
    if (user) {
      const saved = loadProgress()
      if (saved && saved.currentScreen && saved.currentScreen !== 'time_check' && saved.currentScreen !== 'success') {
        setSavedProgressData(saved)
        setShowResumePrompt(true)
      }
    }
  }, [user, loadProgress])

  // Auto-save progress on state changes
  useEffect(() => {
    if (!user || currentScreen === 'time_check' || currentScreen === 'success' || currentScreen === 'processing' || currentScreen === 'processing1') return
    const progressData = { currentScreen, responses }
    saveProgress(progressData)
  }, [currentScreen, responses, user, saveProgress])

  const createSession = async () => {
    try {
      const { data, error } = await supabase
        .from('flow_sessions')
        .insert({
          user_id: user.id,
          flow_type: 'nikigai_skills',
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

  // Validation: Check if at least 3 non-empty responses exist
  const hasMinimumResponses = (questionKey, minCount = 3) => {
    const filledResponses = responses[questionKey].filter(r => r.trim().length > 0)
    return filledResponses.length >= minCount
  }

  // Back button handler
  const goBack = (fromScreen) => {
    const screenOrder = ['time_check', 'journey', 'welcome', 'steve_jobs', 'q1', 'q2', 'q3', 'processing1', 'q4', 'q5']
    const currentIndex = screenOrder.indexOf(fromScreen)
    if (currentIndex > 0) {
      // Skip processing screens when going back
      let targetIndex = currentIndex - 1
      if (screenOrder[targetIndex] === 'processing1') targetIndex = currentIndex - 2
      setCurrentScreen(screenOrder[Math.max(0, targetIndex)])
    }
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
    setCurrentScreen('journey')
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

  // Analyze Q1-3 responses for preliminary skill clusters
  const analyzePreliminary = async () => {
    try {
      console.log('🔍 Analyzing Q1-3 for preliminary clusters...')

      // Gather responses from Q1-3
      const items = []
      ;['q1_childhood', 'q2_highschool', 'q3_postschool'].forEach(key => {
        responses[key].forEach(val => {
          if (val.trim()) items.push(val.trim())
        })
      })

      const allResponses = [{
        user_id: user.id,
        response_raw: items.join('\n'),
        store_as: 'preliminary_skills'
      }]

      const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'skills_preliminary', assistant_prompt: 'Skills clustering from hobbies' },
          userResponse: 'Ready to see preliminary patterns',
          shouldCluster: true,
          clusterType: 'skills',
          clusterSources: ['preliminary_skills'],
          allResponses: allResponses,
          conversationHistory: []
        }
      })

      if (error) {
        console.error('❌ Preliminary clustering error:', error)
        // Don't throw - just skip to Q4
        return
      }

      console.log('✅ Preliminary clusters:', data)
      setPreliminaryClusters(data.clusters || [])
    } catch (err) {
      console.error('Error in preliminary analysis:', err)
      // Continue even if this fails
    }
  }

  const analyzeResponses = async () => {
    setIsProcessing(true)
    setCurrentScreen('processing')

    try {
      // Transform responses to match edge function format
      const allItems = []
      Object.entries(responses).forEach(([key, values]) => {
        values.forEach(val => {
          if (val.trim()) allItems.push(val.trim())
        })
      })

      // Create allResponses array in the format the edge function expects
      const allResponses = [{
        user_id: user.id,
        response_raw: allItems.join('\n'),
        store_as: 'all_skills'
      }]

      // Debug: Log what we're sending
      console.log('🔍 Sending to API:', {
        currentStep: { id: 'skills_final', assistant_prompt: 'Skills analysis' },
        userResponse: 'Ready to analyze',
        shouldCluster: true,
        clusterType: 'roles',
        clusterSources: ['all_skills'],
        allResponses: allResponses
      })

      // Call Claude API to generate clusters using the format it expects
      const { data, error } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'skills_final', assistant_prompt: 'Skills analysis complete' },
          userResponse: 'Ready to analyze my skills',
          shouldCluster: true,
          clusterType: 'roles',
          clusterSources: ['all_skills'],
          allResponses: allResponses,
          conversationHistory: []
        }
      })

      if (error) {
        console.error('❌ API Error:', error)
        throw error
      }

      console.log('✅ API Response:', data)

      // Extract clusters from the response
      // The edge function returns: { message, clusters: [{label, items, insight}] }
      const returnedClusters = data.clusters || []

      console.log('📦 Clusters to save:', returnedClusters)

      // Save clusters to database
      const clustersToSave = returnedClusters.map(cluster => ({
        user_id: user.id,
        session_id: sessionId,
        cluster_type: 'skills',
        cluster_stage: 'final',  // Required field: 'preview', 'intermediate', or 'final'
        cluster_label: cluster.label,
        insight: cluster.insight,
        items: Array.isArray(cluster.items) ? cluster.items : []  // Changed from 'evidence' to 'items'
      }))

      console.log('💾 Saving to database:', clustersToSave)

      const { data: insertData, error: insertError } = await supabase
        .from('nikigai_clusters')
        .insert(clustersToSave)
        .select()

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        throw insertError
      }

      console.log('✅ Saved to database:', insertData)

      setClusters(returnedClusters)

      // Mark session as completed
      await supabase
        .from('flow_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      // Sync with 7-day challenge if active
      await syncFlowFinderWithChallenge(user.id, 'skills')

      // Clear auto-saved progress on success
      clearProgress()

      // Navigate to success screen
      setCurrentScreen('success')
    } catch (err) {
      console.error('Error analyzing responses:', err)
      alert('Error generating insights. Please try again.')
      setCurrentScreen('q5')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderTimeCheck = () => {
    // Helper to get readable screen name
    const getScreenDisplayName = (screen) => {
      const screenNames = {
        'journey': 'Journey Overview',
        'welcome': 'Welcome',
        'steve_jobs': 'Connecting the Dots',
        'q1': 'Question 1 (Childhood)',
        'q2': 'Question 2 (High School)',
        'q3': 'Question 3 (Post-School)',
        'q4': 'Question 4 (Work)',
        'q5': 'Question 5 (Skills)'
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
        <h1 className="welcome-greeting">Flow Finder: Skills Discovery</h1>

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

        {/* Normal time check content - shown if no resume prompt */}
        {!showResumePrompt && (
          <>
            <div className="welcome-message animated-text" style={{ textAlign: 'center' }}>
              <p><span className="time-icon">⏱️</span></p>
              <p><strong>This flow takes about 15-20 minutes</strong></p>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>5 questions about different periods of your life, with AI analysis between sections.</p>
              <p>Find a quiet moment where you can reflect without rushing.</p>
              <p><strong>Your insights will be more valuable when you're present.</strong></p>
            </div>

            <button className="primary-button glow-button" onClick={() => setCurrentScreen('journey')}>
              I've Got Time, Let's Go
            </button>
            <button
              className="primary-button"
              onClick={() => navigate(-1)}
              style={{ background: 'rgba(255, 255, 255, 0.1)', boxShadow: 'none', marginTop: '12px' }}
            >
              Come Back Later
            </button>
          </>
        )}
      </div>
    )
  }

  const renderJourney = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Where This Fits</h1>
      <div className="welcome-message animated-text">
        <p><strong>In the Find My Flow journey...</strong></p>
        <p className="highlight-box">
          <span className="highlight-word">Flow Finder: Skills</span> is the first step.<br /><br />
          You'll discover the <em>skills and curiosities</em> that make you unique — the dots you've been collecting your whole life.
        </p>
        <p>After this, you'll also explore:</p>
        <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8' }}>
          • <strong>Problems</strong> — issues you naturally want to solve<br />
          • <strong>Persona</strong> — the people you're meant to serve
        </p>
        <p>These three together create <span className="highlight-word">business opportunities that feel like play</span>.</p>
      </div>

      <button className="primary-button" onClick={() => setCurrentScreen('welcome')}>
        Makes Sense!
      </button>
      <BackButton fromScreen="journey" />
    </div>
  )

  const renderWelcome = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">The Foundation of Every Business</h1>
      <div className="welcome-message animated-text">
        <p><strong>Hey {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'}!</strong></p>
        <p>Every business, at its core, does three things:</p>
        <p className="highlight-box">
          It <span className="highlight-word">solves a problem</span>, for a <span className="highlight-word">specific person</span>, using a <span className="highlight-word">set of skills</span>.
        </p>
        <p>Flow Finder helps you discover all three.</p>
        <p>When you find the intersection of skills you love using, problems you're passionate about solving, and people you genuinely want to serve — <strong>you find business opportunities that feel like play</strong>.</p>
      </div>

      <button className="primary-button" onClick={() => setCurrentScreen('steve_jobs')}>
        Makes Sense!
      </button>
      <BackButton fromScreen="welcome" />
    </div>
  )

  const renderSteveJobs = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Connecting the Dots</h1>
      <div className="welcome-message animated-text">
        <p className="quote-box">
          "You can't connect the dots looking forward; you can only connect them looking backward. So you have to trust that the dots will somehow connect in your future."
        </p>
        <p style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', marginTop: '4px', marginBottom: '20px' }}>— Steve Jobs</p>
        <p>The <span className="highlight-word">curiosities</span> you've loved throughout your life aren't random.<br /><strong>They're clues.</strong></p>
        <p>We're about to look back at different periods of your life and collect these "dots" — the things you naturally gravitated toward.</p>
        <p>Then <strong>AI will help us find the patterns</strong> that connect them.</p>
        <p className="hint-text">💡 For each question, aim for 5+ bullet points.<br />The more dots we collect, the clearer the patterns become.</p>
      </div>

      <button className="primary-button glow-button" onClick={() => setCurrentScreen('q1')}>
        Let's Collect Some Dots!
      </button>
      <BackButton fromScreen="steve_jobs" />
    </div>
  )

  const renderQuestion1 = () => (
    <div className="container question-container">
      <div className="question-number">Question 1 of 5</div>
      <h2 className="question-text">Let's start with Childhood</h2>
      <p className="question-subtext">Thinking back to Pre-school & Primary: What did you love doing most? What activities did you gravitate towards during free-time? The weekend? Holidays?</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q1_childhood.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Playing with Legos" :
                           index === 1 ? "Drawing and creating art" :
                           index === 2 ? "Playing sports with friends" :
                           index === 3 ? "Reading adventure books" :
                           "Enter another activity..."}
              value={value}
              onChange={(e) => updateResponse('q1_childhood', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q1_childhood')}>
        + Add More
      </button>

      {!hasMinimumResponses('q1_childhood') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q2')}
        disabled={!hasMinimumResponses('q1_childhood')}
        style={{ opacity: hasMinimumResponses('q1_childhood') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q1" />
    </div>
  )

  const renderQuestion2 = () => (
    <div className="container question-container">
      <div className="question-number">Question 2 of 5</div>
      <h2 className="question-text">Now think of your teenage years throughout High School</h2>
      <p className="question-subtext">What did you enjoy doing most? What extra-curricular activities did you do? Any subjects or assignments that you loved? What did you do on weekends and after school for fun?</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q2_highschool.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Being part of the debate team" :
                           index === 1 ? "Playing in a band" :
                           index === 2 ? "Coding my first website" :
                           index === 3 ? "Organizing school events" :
                           "Enter another activity..."}
              value={value}
              onChange={(e) => updateResponse('q2_highschool', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q2_highschool')}>
        + Add More
      </button>

      {!hasMinimumResponses('q2_highschool') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q3')}
        disabled={!hasMinimumResponses('q2_highschool')}
        style={{ opacity: hasMinimumResponses('q2_highschool') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q2" />
    </div>
  )

  const renderQuestion3 = () => (
    <div className="container question-container">
      <div className="question-number">Question 3 of 5</div>
      <h2 className="question-text">After school and before full-time work life</h2>
      <p className="question-subtext">What activities, projects or creative outlets do you enjoy the most?</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q3_postschool.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Building side projects" :
                           index === 1 ? "Creating content for social media" :
                           index === 2 ? "Learning new skills online" :
                           index === 3 ? "Volunteering in the community" :
                           "Enter another activity..."}
              value={value}
              onChange={(e) => updateResponse('q3_postschool', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q3_postschool')}>
        + Add More
      </button>

      {!hasMinimumResponses('q3_postschool') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('processing1')}
        disabled={!hasMinimumResponses('q3_postschool')}
        style={{ opacity: hasMinimumResponses('q3_postschool') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q3" />
    </div>
  )

  const renderProcessing1 = () => {
    if (preliminaryClusters.length === 0) {
      // Still loading
      return (
        <div className="container processing-container">
          <div className="spinner"></div>
          <div className="processing-text">Analyzing patterns...</div>
          <div className="processing-subtext">
            Looking for skill themes across your childhood, high school, and recent activities.
            <br /><br />
            This usually takes 10-15 seconds.
          </div>
        </div>
      )
    }

    // Show preliminary clusters
    return (
      <div className="container welcome-container">
        <h1 className="welcome-greeting">Here are some early patterns we're seeing</h1>
        <div className="welcome-message">
          <p>Based on your childhood, high school, and recent activities, here are some skill themes emerging:</p>
        </div>

        <div className="cluster-grid" style={{ margin: '32px 0' }}>
          {preliminaryClusters.map((cluster, index) => (
            <div
              key={index}
              className="cluster-card"
              style={{ cursor: 'default', borderColor: 'rgba(251, 191, 36, 0.3)' }}
            >
              <h3>{cluster.label}</h3>
              <p>{cluster.insight}</p>
            </div>
          ))}
        </div>

        <div className="welcome-message">
          <p><strong>Next:</strong> Let's explore your work experience and skills you've deliberately developed to complete the picture.</p>
        </div>

        <button className="primary-button" onClick={() => setCurrentScreen('q4')}>
          Continue to Work & Projects
        </button>
      </div>
    )
  }

  const renderQuestion4 = () => (
    <div className="container question-container">
      <div className="question-number">Question 4 of 5</div>
      <h2 className="question-text">Let's explore your work and projects</h2>
      <p className="question-subtext">Across your jobs, projects, or creative pursuits, what have you enjoyed doing most? Think of times you felt in flow or energized by what you were doing.</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q4_work.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Leading a team to solve a problem" :
                           index === 1 ? "Designing user experiences" :
                           index === 2 ? "Writing and creating content" :
                           index === 3 ? "Analyzing data to find insights" :
                           "Enter another activity..."}
              value={value}
              onChange={(e) => updateResponse('q4_work', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q4_work')}>
        + Add More
      </button>

      {!hasMinimumResponses('q4_work') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q5')}
        disabled={!hasMinimumResponses('q4_work')}
        style={{ opacity: hasMinimumResponses('q4_work') ? 1 : 0.5 }}
      >
        Continue
      </button>
      <BackButton fromScreen="q4" />
    </div>
  )

  const renderQuestion5 = () => (
    <div className="container question-container">
      <div className="question-number">Question 5 of 5</div>
      <h2 className="question-text">What skills have you loved to develop?</h2>
      <p className="question-subtext">Think about skills you've intentionally worked on — through courses, practice, or personal curiosity.</p>
      <div className="input-hint" style={{ textAlign: 'center', marginTop: '-6px', marginBottom: '-24px' }}>💡 Aim for 5+, the more the better</div>

      <div className="input-list">
        {responses.q5_skills.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "Public speaking and presentation" :
                           index === 1 ? "Coding and software development" :
                           index === 2 ? "Marketing and growth" :
                           index === 3 ? "Design and visual communication" :
                           "Enter another skill..."}
              value={value}
              onChange={(e) => updateResponse('q5_skills', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q5_skills')}>
        + Add More
      </button>

      {!hasMinimumResponses('q5_skills') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '40px', marginBottom: '-28px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={analyzeResponses}
        disabled={!hasMinimumResponses('q5_skills')}
        style={{ opacity: hasMinimumResponses('q5_skills') ? 1 : 0.5 }}
      >
        Analyze My Answers
      </button>
      <BackButton fromScreen="q5" />
    </div>
  )

  const renderProcessing = () => (
    <div className="container processing-container">
      <div className="spinner"></div>
      <div className="processing-text">Identifying your role archetypes...</div>
      <div className="processing-subtext">
        Bringing together all your responses to reveal the skills and strengths where you naturally thrive.
        <br /><br />
        This usually takes 10-15 seconds.
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Here's what we discovered about you</h1>
      <div className="welcome-message">
        <p>Based on your responses, we've identified 4 role archetypes where you naturally thrive:</p>
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
              <div className="cluster-evidence-label">Based on your responses:</div>
              <ul className="evidence-list">
                {cluster.items?.map((item, i) => (
                  <li key={i}>"{item}"</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <h1 className="welcome-greeting" style={{ marginTop: '40px' }}>✓ Skills Discovery Complete!</h1>
      <div className="welcome-message">
        <p>These role archetypes represent where you naturally thrive—the intersection of your talents, interests, and energy.</p>
        <p style={{ marginTop: '24px' }}><strong>Next up:</strong> Let's discover the problems you're passionate about solving.</p>
      </div>

      <Link to="/nikigai/problems" className="primary-button">
        Continue to Problems Discovery
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
    time_check: renderTimeCheck,
    journey: renderJourney,
    welcome: renderWelcome,
    steve_jobs: renderSteveJobs,
    q1: renderQuestion1,
    q2: renderQuestion2,
    q3: renderQuestion3,
    processing1: renderProcessing1,
    q4: renderQuestion4,
    q5: renderQuestion5,
    processing: renderProcessing,
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
                i === 0 && ['time_check', 'journey', 'welcome', 'steve_jobs'].includes(currentScreen) ? 'active' :
                i === 1 && ['q1', 'q2', 'q3'].includes(currentScreen) ? 'active' :
                i === 2 && currentScreen === 'processing1' ? 'active' :
                i === 3 && ['q4', 'q5'].includes(currentScreen) ? 'active' :
                i === 4 && currentScreen === 'processing' ? 'active' :
                i === 5 && currentScreen === 'success' ? 'active' :
                ''
              } ${i < 5 && currentScreen === 'success' ? 'completed' : ''}`}
            ></div>
          ))}
        </div>
      </div>

      {screens[currentScreen]?.()}
    </div>
  )
}
