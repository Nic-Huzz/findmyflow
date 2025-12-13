import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import './FlowFinder.css'

export default function FlowFinderSkills() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('welcome')
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
      <h1 className="welcome-greeting">Flow Finder: Skills Discovery</h1>
      <div className="welcome-message">
        <p><strong>Hey {user?.user_metadata?.name || 'there'}!</strong></p>
        <p>What does a business do? It solves a problem, for a person, using a set of skills.</p>
        <p>By identifying skills we're passionate about using, people we're passionate about serving and problems we're passionate about solving - I believe we can identify our dream business opportunities and jobs.</p>
        <p>The whole process is inspired by a Steve Jobs quote: <em>"you can't connect the dots looking forward, you can only connect them looking back".</em></p>
        <p>This question flow will focus on identifying skills you're passionate about by reviewing different periods of your life.</p>
        <p><strong>For each question, aim for 5+ bullet points.</strong> See each bullet point as a dot - the more dots we have, the better.</p>
      </div>

      <button className="primary-button" onClick={() => setCurrentScreen('q1')}>
        Yep!
      </button>
    </div>
  )

  const renderQuestion1 = () => (
    <div className="container question-container">
      <div className="question-number">Question 1 of 5</div>
      <h2 className="question-text">Let's start with Childhood</h2>
      <p className="question-subtext">Thinking back to Pre-school & Primary: What did you love doing most? What activities did you gravitate towards during free-time? The weekend? Holidays?</p>

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
      <div className="input-hint">💡 Aim for 5+ bullet points</div>
      {!hasMinimumResponses('q1_childhood') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '16px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q2')}
        disabled={!hasMinimumResponses('q1_childhood')}
      >
        Continue
      </button>
    </div>
  )

  const renderQuestion2 = () => (
    <div className="container question-container">
      <div className="question-number">Question 2 of 5</div>
      <h2 className="question-text">Now think of your teenage years throughout High School</h2>
      <p className="question-subtext">What did you enjoy doing most? What extra-curricular activities did you do? Any subjects or assignments that you loved? What did you do on weekends and after school for fun?</p>

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
      <div className="input-hint">💡 Aim for 5+, the more the better</div>
      {!hasMinimumResponses('q2_highschool') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '16px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q3')}
        disabled={!hasMinimumResponses('q2_highschool')}
      >
        Continue
      </button>
    </div>
  )

  const renderQuestion3 = () => (
    <div className="container question-container">
      <div className="question-number">Question 3 of 5</div>
      <h2 className="question-text">After school and before full-time work life</h2>
      <p className="question-subtext">What activities, projects or creative outlets do you enjoy the most?</p>

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
      <div className="input-hint">💡 Aim for 5+, the more the better</div>
      {!hasMinimumResponses('q3_postschool') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '16px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('processing1')}
        disabled={!hasMinimumResponses('q3_postschool')}
      >
        Continue
      </button>
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
      <div className="input-hint">💡 Aim for 5+ bullets</div>
      {!hasMinimumResponses('q4_work') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '16px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('q5')}
        disabled={!hasMinimumResponses('q4_work')}
      >
        Continue
      </button>
    </div>
  )

  const renderQuestion5 = () => (
    <div className="container question-container">
      <div className="question-number">Question 5 of 5</div>
      <h2 className="question-text">What skills have you loved to develop?</h2>
      <p className="question-subtext">Think about skills you've intentionally worked on — through courses, practice, or personal curiosity.</p>

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
      <div className="input-hint">💡 Aim for 5+ bullet points</div>
      {!hasMinimumResponses('q5_skills') && (
        <div className="input-hint" style={{ color: '#fbbf24', marginTop: '16px', textAlign: 'center' }}>
          Please provide at least 3 answers to continue
        </div>
      )}

      <button
        className="primary-button"
        onClick={analyzeResponses}
        disabled={!hasMinimumResponses('q5_skills')}
      >
        Analyze My Answers
      </button>
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
    welcome: renderWelcome,
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
                i === 0 && currentScreen === 'welcome' ? 'active' :
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
