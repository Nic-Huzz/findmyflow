import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { syncFlowFinderWithChallenge } from './lib/questCompletionHelpers'
import { STAGES } from './lib/stageConfig'
import './FlowFinder.css'

// ClusterSlider component (extracted from NikigaiTest.jsx)
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
      <div className="slider-section" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div className="slider-label" style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>{title}</div>
        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '20px' }}>No {title.toLowerCase()} available</div>
      </div>
    )
  }

  const currentCluster = clusters[currentIndex]

  const cardStyle = {
    transform: isSwiping ? `translateX(${swipeOffset}px)` : 'translateX(0)',
    transition: isSwiping ? 'none' : 'transform 0.3s ease'
  }

  return (
    <div className="slider-section" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '20px', textAlign: 'left' }}>
      <div className="slider-label" style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>{title}</div>
      <div
        className="slider-content-wrapper"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="slider-content" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '2px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px', padding: '20px', marginBottom: '16px', ...cardStyle }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fbbf24', marginBottom: '8px' }}>{currentCluster.cluster_label}</h4>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.6', margin: '0' }}>
            {currentCluster.insight || 'No insight available yet'}
          </p>
        </div>
      </div>
      <div className="slider-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          className="slider-btn"
          onClick={handlePrevious}
          style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          ← Previous
        </button>
        <div className="slider-indicator" style={{ flex: '1', textAlign: 'center', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
          {currentIndex + 1} of {clusters.length}
        </div>
        <button
          className="slider-btn"
          onClick={handleNext}
          style={{ padding: '8px 16px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default function FlowFinderIntegration() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [sessionId, setSessionId] = useState(null)

  // Cluster data loaded from database
  const [skillsClusters, setSkillsClusters] = useState([])
  const [problemsClusters, setProblemsClusters] = useState([])
  const [personaClusters, setPersonaClusters] = useState([])

  // Selected indices for each slider
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0)
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0)
  const [selectedPersonaIndex, setSelectedPersonaIndex] = useState(0)

  // Post-slider question state
  const [opportunityType, setOpportunityType] = useState(null) // 'existing' or 'new'
  const [addToFlowCompass, setAddToFlowCompass] = useState(null) // true or false
  const [opportunityDetails, setOpportunityDetails] = useState({
    name: '',
    role: '',
    audience: '',
    problem: ''
  })

  // Create flow session on mount and load existing clusters
  useEffect(() => {
    createSession()
    loadClusters()
  }, [])

  const createSession = async () => {
    try {
      const { data, error } = await supabase
        .from('flow_sessions')
        .insert({
          user_id: user.id,
          flow_type: 'nikigai_integration',
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

  const loadClusters = async () => {
    try {
      // Fetch all clusters for current user
      const { data, error } = await supabase
        .from('nikigai_clusters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter by cluster_type
      const skills = data.filter(c => c.cluster_type === 'skills')
      const problems = data.filter(c => c.cluster_type === 'problems')
      const persona = data.filter(c => c.cluster_type === 'persona')

      setSkillsClusters(skills)
      setProblemsClusters(problems)
      setPersonaClusters(persona)
    } catch (err) {
      console.error('Error loading clusters:', err)
    }
  }

  const saveSelectedCombination = async (isExisting = false, shouldAddToCompass = false, details = null) => {
    try {
      if (skillsClusters.length === 0 || problemsClusters.length === 0 || personaClusters.length === 0) {
        console.error('Missing cluster data')
        return
      }

      const selectedSkill = skillsClusters[selectedSkillIndex]
      const selectedProblem = problemsClusters[selectedProblemIndex]
      const selectedPersona = personaClusters[selectedPersonaIndex]

      // Build opportunity data
      const opportunityData = {
        skill: {
          id: selectedSkill.id,
          label: selectedSkill.cluster_label,
          insight: selectedSkill.insight
        },
        problem: {
          id: selectedProblem.id,
          label: selectedProblem.cluster_label,
          insight: selectedProblem.insight
        },
        persona: {
          id: selectedPersona.id,
          label: selectedPersona.cluster_label,
          insight: selectedPersona.insight
        },
        type: isExisting ? 'existing' : 'new',
        added_to_flow_compass: shouldAddToCompass
      }

      // Add custom details if provided
      if (details) {
        opportunityData.custom_details = details
      }

      // Save selected opportunity to nikigai_key_outcomes
      const { error: outcomeError } = await supabase
        .from('nikigai_key_outcomes')
        .upsert({
          user_id: user.id,
          session_id: sessionId,
          selected_opportunity: opportunityData
        })

      if (outcomeError) throw outcomeError

      // If adding to Flow Compass, create a project with project-based stage fields
      if (shouldAddToCompass) {
        const projectName = details?.name || `${selectedProblem.cluster_label} for ${selectedPersona.cluster_label}`
        console.log('📊 Creating Flow Compass project:', projectName)

        // Check if user has existing projects to determine is_primary
        const { data: existingProjects } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')

        const isFirstProject = !existingProjects || existingProjects.length === 0

        const { data: projectData, error: projectError } = await supabase
          .from('user_projects')
          .insert({
            user_id: user.id,
            name: projectName,
            description: `Using ${selectedSkill.cluster_label} to help ${selectedPersona.cluster_label} with ${selectedProblem.cluster_label}`,
            status: 'active',
            source_flow: 'integration',
            source_session_id: sessionId,
            // New project-based stage fields (Dec 2024)
            current_stage: STAGES.VALIDATION,
            total_points: 0,
            is_primary: isFirstProject,
            linked_skill_cluster_id: selectedSkill.id,
            linked_problem_cluster_id: selectedProblem.id,
            linked_persona_cluster_id: selectedPersona.id
          })
          .select()

        if (projectError) {
          console.error('❌ Error creating project:', projectError)
        } else {
          console.log('✅ Project created:', projectData)
        }

        // Mark onboarding as complete since user now has a project
        await supabase
          .from('user_stage_progress')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id)
      }

      // Mark session as completed
      await supabase
        .from('flow_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      // Sync with 7-day challenge if active
      await syncFlowFinderWithChallenge(user.id, 'integration')

      // Navigate to success screen
      setCurrentScreen('success')
    } catch (err) {
      console.error('Error saving combination:', err)
      alert('Error saving your selection. Please try again.')
    }
  }

  const renderWelcome = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Flow Finder: Connecting the Dots</h1>
      <div className="welcome-message">
        <p><strong>Hey {user?.user_metadata?.name || 'there'}!</strong></p>
        <p>You've done incredible work discovering your:</p>
      </div>

      <div className="pillars-box" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', margin: '32px 0', textAlign: 'left' }}>
        <div className="pillar-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="pillar-icon" style={{ fontSize: '20px', marginTop: '2px' }}>🎯</div>
          <div className="pillar-content">
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills</h4>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', margin: '0' }}>What you're naturally good at</p>
          </div>
        </div>
        <div className="pillar-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="pillar-icon" style={{ fontSize: '20px', marginTop: '2px' }}>💡</div>
          <div className="pillar-content">
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Problems</h4>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', margin: '0' }}>The change you want to create</p>
          </div>
        </div>
        <div className="pillar-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '0', paddingBottom: '0', borderBottom: 'none' }}>
          <div className="pillar-icon" style={{ fontSize: '20px', marginTop: '2px' }}>👥</div>
          <div className="pillar-content">
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Persona</h4>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', margin: '0' }}>Who you're most qualified to serve</p>
          </div>
        </div>
      </div>

      <div className="welcome-message">
        <p>Now let's bring it all together into your unique <strong>Nikigai</strong> — the intersection where your gifts meet the world's needs.</p>
      </div>

      <button className="primary-button" onClick={() => setCurrentScreen('processing')}>
        Show me!
      </button>
    </div>
  )

  const renderProcessing = () => (
    <div className="container processing-container">
      <div className="spinner"></div>
      <div className="processing-text">Connecting the dots...</div>
      <div className="processing-subtext">
        Bringing together your skills, problems, and persona discoveries.
      </div>
      <button
        className="primary-button"
        onClick={() => setCurrentScreen('sliders')}
        style={{ marginTop: '48px' }}
      >
        Continue
      </button>
    </div>
  )

  const renderSliders = () => (
    <div className="container question-container">
      <div className="question-number">Find Your Combination</div>
      <h2 className="question-text">Which combination excites you most?</h2>
      <p className="question-subtext">Slide through each to explore different possibilities</p>

      <div style={{ marginTop: '32px' }}>
        <ClusterSlider
          title="Your Skills"
          clusters={skillsClusters}
          selectedIndex={selectedSkillIndex}
          onSelect={setSelectedSkillIndex}
        />

        <ClusterSlider
          title="Your Problem"
          clusters={problemsClusters}
          selectedIndex={selectedProblemIndex}
          onSelect={setSelectedProblemIndex}
        />

        <ClusterSlider
          title="Your Persona"
          clusters={personaClusters}
          selectedIndex={selectedPersonaIndex}
          onSelect={setSelectedPersonaIndex}
        />
      </div>

      <div className="welcome-message" style={{ marginTop: '24px' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          💡 Swipe through each slider to explore different combinations. When you find one that excites you, confirm below!
        </p>
      </div>

      <button
        className="primary-button"
        onClick={() => setCurrentScreen('opportunityType')}
        disabled={skillsClusters.length === 0 || problemsClusters.length === 0 || personaClusters.length === 0}
      >
        This Combination Excites Me!
      </button>
    </div>
  )

  const renderOpportunityType = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Great choice!</h1>
      <div className="welcome-message">
        <p>Is this combination an opportunity you're <strong>already pursuing</strong> or a <strong>new opportunity</strong> you want to explore?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px' }}>
        <button
          className="primary-button compact"
          onClick={() => {
            setOpportunityType('existing')
            setCurrentScreen('addToCompass')
          }}
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          Existing Opportunity
        </button>
        <button
          className="primary-button compact"
          onClick={() => {
            setOpportunityType('new')
            setCurrentScreen('addToCompass')
          }}
        >
          New Opportunity
        </button>
      </div>
    </div>
  )

  const renderAddToCompass = () => (
    <div className="container welcome-container">
      <h1 className="welcome-greeting">Add to Flow Compass?</h1>
      <div className="welcome-message">
        <p>Would you like to start pursuing this opportunity and add it to your <strong>Flow Compass</strong>?</p>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '16px' }}>
          This will create a new project you can track and work on during your 7-day challenges.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '32px' }}>
        <button
          className="primary-button compact"
          onClick={() => {
            setAddToFlowCompass(true)
            saveSelectedCombination(opportunityType === 'existing', true, null)
          }}
        >
          Yes, add to Flow Compass!
        </button>
        <button
          className="primary-button compact"
          onClick={() => {
            setAddToFlowCompass(false)
            setCurrentScreen('details')
          }}
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
        >
          No, I want to define a different opportunity
        </button>
      </div>
    </div>
  )

  const renderDetails = () => (
    <div className="container question-container">
      <div className="question-number">Define Your Opportunity</div>
      <h2 className="question-text">Tell us more about your opportunity</h2>
      <p className="question-subtext">Help us understand what you want to pursue</p>

      <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px' }}>
            What do you call this opportunity?
          </label>
          <input
            type="text"
            className="text-input"
            placeholder="e.g., Burnout Recovery Coaching"
            value={opportunityDetails.name}
            onChange={(e) => setOpportunityDetails({ ...opportunityDetails, name: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', fontSize: '16px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px' }}>
            What's your role in this opportunity?
          </label>
          <input
            type="text"
            className="text-input"
            placeholder="e.g., Coach, Consultant, Creator"
            value={opportunityDetails.role}
            onChange={(e) => setOpportunityDetails({ ...opportunityDetails, role: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', fontSize: '16px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px' }}>
            Who is your target audience?
          </label>
          <input
            type="text"
            className="text-input"
            placeholder="e.g., Corporate professionals in their 30s"
            value={opportunityDetails.audience}
            onChange={(e) => setOpportunityDetails({ ...opportunityDetails, audience: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', fontSize: '16px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px' }}>
            What problem do you solve?
          </label>
          <input
            type="text"
            className="text-input"
            placeholder="e.g., Helping them recover from burnout"
            value={opportunityDetails.problem}
            onChange={(e) => setOpportunityDetails({ ...opportunityDetails, problem: e.target.value })}
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', color: 'white', fontSize: '16px' }}
          />
        </div>
      </div>

      <button
        className="primary-button"
        onClick={() => saveSelectedCombination(false, true, opportunityDetails)}
        disabled={!opportunityDetails.name}
        style={{ marginTop: '32px', opacity: opportunityDetails.name ? 1 : 0.5 }}
      >
        Save & Add to Flow Compass
      </button>
    </div>
  )

  const renderSuccess = () => {
    const selectedSkill = skillsClusters[selectedSkillIndex]
    const selectedProblem = problemsClusters[selectedProblemIndex]
    const selectedPersona = personaClusters[selectedPersonaIndex]

    return (
      <div className="container welcome-container">
        <h1 className="welcome-greeting">Congratulations!</h1>
        <div className="welcome-message">
          <p><strong>You've completed your Flow Finder discovery.</strong></p>
          <p>This is the foundation for meaningful, fulfilling work that only <em>you</em> can do.</p>
        </div>

        <div className="pillars-box" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', margin: '32px 0', textAlign: 'left' }}>
          <div className="pillar-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="pillar-icon" style={{ fontSize: '20px', marginTop: '2px' }}>🎯</div>
            <div className="pillar-content">
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Skills</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', margin: '0' }}>
                {selectedSkill?.cluster_label || 'Not selected'}
              </p>
            </div>
          </div>
          <div className="pillar-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="pillar-icon" style={{ fontSize: '20px', marginTop: '2px' }}>💡</div>
            <div className="pillar-content">
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Problem</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', margin: '0' }}>
                {selectedProblem?.cluster_label || 'Not selected'}
              </p>
            </div>
          </div>
          <div className="pillar-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '0', paddingBottom: '0', borderBottom: 'none' }}>
            <div className="pillar-icon" style={{ fontSize: '20px', marginTop: '2px' }}>👥</div>
            <div className="pillar-content">
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Persona</h4>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: '1.5', margin: '0' }}>
                {selectedPersona?.cluster_label || 'Not selected'}
              </p>
            </div>
          </div>
        </div>

        <div className="welcome-message">
          <p>Your unique combination has been saved to your profile. You can now use this to guide your opportunities, content, and impact.</p>
        </div>

        <Link to="/me" className="primary-button" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Return to /me page
        </Link>
      </div>
    )
  }

  // Main render logic
  const screens = {
    welcome: renderWelcome,
    processing: renderProcessing,
    sliders: renderSliders,
    opportunityType: renderOpportunityType,
    addToCompass: renderAddToCompass,
    details: renderDetails,
    success: renderSuccess
  }

  // Define screen groups for progress tracking
  const postSliderScreens = ['opportunityType', 'addToCompass', 'details']
  const allPostSlider = [...postSliderScreens, 'success']

  return (
    <div className="flow-finder-app">
      {/* Progress Dots */}
      <div className="progress-container">
        <div className="progress-dots">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i === 0 && currentScreen === 'welcome' ? 'active' :
                i === 1 && currentScreen === 'processing' ? 'active' :
                i === 2 && currentScreen === 'sliders' ? 'active' :
                i === 3 && postSliderScreens.includes(currentScreen) ? 'active' :
                i === 4 && currentScreen === 'success' ? 'active' :
                ''
              } ${
                (i === 0 && currentScreen !== 'welcome') ||
                (i === 1 && !['welcome', 'processing'].includes(currentScreen)) ||
                (i === 2 && !['welcome', 'processing', 'sliders'].includes(currentScreen)) ||
                (i === 3 && currentScreen === 'success')
                  ? 'completed'
                  : ''
              }`}
            ></div>
          ))}
        </div>
      </div>

      {screens[currentScreen]?.()}
    </div>
  )
}
