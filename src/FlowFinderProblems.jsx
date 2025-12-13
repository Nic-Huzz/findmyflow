import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import './FlowFinder.css'

export default function FlowFinderProblems() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('welcome')
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
  const [sessionId, setSessionId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Create flow session on mount
  useEffect(() => {
    createSession()
  }, [])

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
        store_as: 'problems_all'
      }]

      // Call Claude API to generate clusters with new format
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

      // Save clusters to database
      const clustersToSave = returnedClusters.map(cluster => ({
        user_id: user.id,
        session_id: sessionId,
        cluster_type: 'problems',
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

      // Navigate to success screen
      setCurrentScreen('success')
    } catch (err) {
      console.error('Error analyzing responses:', err)
      alert('Error generating insights. Please try again.')
      setCurrentScreen('q7')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderWelcome = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Flow Finder: Problems Discovery</h1>
      <div className="welcome-message">
        <p><strong>Hey {user?.user_metadata?.name || 'there'}!</strong></p>
        <p>Now let's discover the <strong>problems and changes you care about</strong> — the things that matter to you and the impact you want to create.</p>
        <p>We'll explore your learning interests, impact you've made, life chapters, role models, and future vision.</p>
        <p><strong>For each question, aim for 5+ bullet points.</strong></p>
      </div>

      <button className="primary-button" onClick={() => setCurrentScreen('q1')}>
        Yep!
      </button>
    </div>
  )

  const renderQuestion1 = () => (
    <div className="container question-container">
      <div className="question-number">Question 1 of 7</div>
      <h2 className="question-text">What topics have you loved learning about?</h2>
      <p className="question-subtext">Through school, courses, or personal curiosity — aim for 5+ topics</p>

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
      <div className="input-hint">What subjects pull you in? What do you read about for fun?</div>

      <button className="primary-button" onClick={() => setCurrentScreen('q2')}>
        Continue
      </button>
    </div>
  )

  const renderQuestion2 = () => (
    <div className="container question-container">
      <div className="question-number">Question 2 of 7</div>
      <h2 className="question-text">What impact have you created for others?</h2>
      <p className="question-subtext">Across your work and projects — big or small, tangible or emotional</p>

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
      <div className="input-hint">What difference have you made? How have you helped others?</div>

      <button className="primary-button" onClick={() => setCurrentScreen('processing1')}>
        Continue
      </button>
    </div>
  )

  const renderProcessing1 = () => (
    <div className="container processing-container">
      <div className="spinner"></div>
      <div className="processing-text">Analyzing patterns...</div>
      <div className="processing-subtext">
        Looking for themes across your learning interests and impact created.
      </div>
      <button className="primary-button" onClick={() => setCurrentScreen('q3')} style={{ marginTop: '48px' }}>
        Continue
      </button>
    </div>
  )

  const renderQuestion3 = () => (
    <div className="container question-container">
      <div className="question-number">Question 3 of 7</div>
      <h2 className="question-text">If you saw your life as a story, what are the chapters?</h2>
      <p className="question-subtext">Major life phases or turning points — aim for 3-5 chapter titles</p>

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
      <div className="input-hint">Think of major phases or turning points in your journey</div>

      <button className="primary-button" onClick={() => setCurrentScreen('q4')}>
        Continue
      </button>
    </div>
  )

  const renderQuestion4 = () => (
    <div className="container question-container">
      <div className="question-number">Question 4 of 7</div>
      <h2 className="question-text">For each chapter, what struggle did you face?</h2>
      <p className="question-subtext">Format: Chapter name — Struggle description</p>

      <div className="input-list">
        {responses.q4_struggles.map((value, index) => (
          <div className="input-item" key={index}>
            <span className="input-number">{index + 1}.</span>
            <input
              type="text"
              className="text-input"
              placeholder={index === 0 ? "The Explorer Years — finding a place I felt safe to be myself" :
                           index === 1 ? "The Rebuild — recovering from burnout and redefining success" :
                           index === 2 ? "The Awakening — letting go of others' expectations" :
                           index === 3 ? "Finding My Voice — overcoming fear of visibility" :
                           "Building My Legacy — balancing ambition with presence"}
              value={value}
              onChange={(e) => updateResponse('q4_struggles', index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="add-more-btn" onClick={() => addInput('q4_struggles')}>
        + Add More
      </button>
      <div className="input-hint">Aim for at least 1 struggle per chapter, up to 3 per chapter</div>

      <button className="primary-button" onClick={() => setCurrentScreen('q5')}>
        Continue
      </button>
    </div>
  )

  const renderQuestion5 = () => (
    <div className="container question-container">
      <div className="question-number">Question 5 of 7</div>
      <h2 className="question-text">Who has inspired you the most?</h2>
      <p className="question-subtext">Real or fictional — share who they are and their impact on you</p>

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
      <div className="input-hint">Include both the person and why they're meaningful to you</div>

      <button className="primary-button" onClick={() => setCurrentScreen('processing2')}>
        Continue
      </button>
    </div>
  )

  const renderProcessing2 = () => (
    <div className="container processing-container">
      <div className="spinner"></div>
      <div className="processing-text">Deepening the analysis...</div>
      <div className="processing-subtext">
        Adding your life chapters and role models to understand the full picture.
      </div>
      <button className="primary-button" onClick={() => setCurrentScreen('q6')} style={{ marginTop: '48px' }}>
        Continue
      </button>
    </div>
  )

  const renderQuestion6 = () => (
    <div className="container question-container">
      <div className="question-number">Question 6 of 7</div>
      <h2 className="question-text">What do you feel called to create, experience, or change?</h2>
      <p className="question-subtext">When you imagine the future — aim for 3-5 ideas</p>

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
      <div className="input-hint">What impact do you want to make? What do you want to exist?</div>

      <button className="primary-button" onClick={() => setCurrentScreen('q7')}>
        Continue
      </button>
    </div>
  )

  const renderQuestion7 = () => (
    <div className="container question-container">
      <div className="question-number">Question 7 of 7</div>
      <h2 className="question-text">What are your top 3 future pulls?</h2>
      <p className="question-subtext">The ideas or dreams that feel most alive RIGHT NOW</p>

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

      <div className="input-hint" style={{ marginTop: '16px' }}>From everything you shared, what feels most energizing?</div>

      <button className="primary-button" onClick={analyzeResponses}>
        Analyze My Answers
      </button>
    </div>
  )

  const renderProcessing = () => (
    <div className="container processing-container">
      <div className="spinner"></div>
      <div className="processing-text">Identifying your problem themes...</div>
      <div className="processing-subtext">
        Bringing together all your responses to reveal the problems and changes you care about most.
        <br /><br />
        This usually takes 10-15 seconds.
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Here's what we discovered about you</h1>
      <div className="welcome-message">
        <p>Based on your responses, we've identified 4 problem themes that represent the impact you want to create in the world:</p>
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

      <h1 className="welcome-greeting" style={{ marginTop: '40px' }}>✓ Problems Discovery Complete!</h1>
      <div className="welcome-message">
        <p>These problem themes represent the impact you want to create in the world—the changes that matter to you.</p>
        <p style={{ marginTop: '24px' }}><strong>Next up:</strong> Let's discover who you're most qualified to serve.</p>
      </div>

      <Link to="/nikigai/persona" className="primary-button">
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
    success: renderSuccess
  }

  return (
    <div className="flow-finder-app">
      {/* Progress Dots */}
      <div className="progress-container">
        <div className="progress-dots">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i === 0 && currentScreen === 'welcome' ? 'active' :
                i === 1 && ['q1', 'q2'].includes(currentScreen) ? 'active' :
                i === 2 && currentScreen === 'processing1' ? 'active' :
                i === 3 && ['q3', 'q4', 'q5'].includes(currentScreen) ? 'active' :
                i === 4 && currentScreen === 'processing2' ? 'active' :
                i === 5 && ['q6', 'q7'].includes(currentScreen) ? 'active' :
                i === 6 && currentScreen === 'processing' ? 'active' :
                i === 7 && currentScreen === 'success' ? 'active' :
                ''
              } ${i < 7 && currentScreen === 'success' ? 'completed' : ''}`}
            ></div>
          ))}
        </div>
      </div>

      {screens[currentScreen]?.()}
    </div>
  )
}
