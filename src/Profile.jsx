import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { essenceProfiles } from './data/essenceProfiles'
import { protectiveProfiles } from './data/protectiveProfiles'
import { personaProfiles, getPersonaWithFlow, normalizePersona } from './data/personaProfiles'
import { hasActiveChallenge } from './lib/questCompletion'
import { graduateUser } from './lib/graduationChecker'
import { getCurrentStreak } from './lib/streakTracking'
import StageProgressCard from './components/StageProgressCard'
import GraduationModal from './components/GraduationModal'
import FlowMap from './components/FlowMap'

const Profile = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [expandedArchetypes, setExpandedArchetypes] = useState({ essence: false, protective: false })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasChallenge, setHasChallenge] = useState(false)
  const [stageProgress, setStageProgress] = useState(null)
  const [streakData, setStreakData] = useState(null)
  const [graduationModal, setGraduationModal] = useState({ isOpen: false, celebration: null })

  useEffect(() => {
    // Only load profile when user is available
    if (user?.email) {
      loadUserProfile()
      checkChallengeStatus()
      loadStageProgress()
      loadStreakData()
    } else if (user === null) {
      // User is not authenticated
      setLoading(false)
      setError('Please sign in to view your profile')
    }
    // If user is still loading (undefined), keep loading state
  }, [user])

  const checkChallengeStatus = async () => {
    if (user?.id) {
      const active = await hasActiveChallenge(user.id)
      setHasChallenge(active)
    }
  }

  const loadUserProfile = async () => {
    if (!user?.email) {
      setError('No user email available')
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Loading user profile for:', user.email)

      // Get the most recent profile for this authenticated user
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .eq('email', user.email) // Filter by authenticated user's email
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error loading profile:', error)
        setError(`Failed to load profile: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No profile found for email:', user.email)
        setError(null) // Clear error, will show "No profile data found" message
        setUserData(null)
        setLoading(false)
        return
      }

      console.log('✅ Profile loaded:', data[0])
      setUserData(data[0])
    } catch (err) {
      console.error('Error:', err)
      setError(`Failed to load profile: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadStageProgress = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('user_stage_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.warn('Error loading stage progress (this is OK if flows not set up yet):', error)
        return
      }

      setStageProgress(data)
    } catch (err) {
      console.warn('Error loading stage progress:', err)
    }
  }

  const loadStreakData = async () => {
    if (!user?.id) return

    try {
      const result = await getCurrentStreak(user.id)
      if (result.success) {
        setStreakData(result)
      }
    } catch (err) {
      console.error('Error loading streak data:', err)
    }
  }

  const handleGraduation = async (fromStage, toStage) => {
    if (!user?.id || !stageProgress?.persona) return

    try {
      const result = await graduateUser(
        user.id,
        fromStage,
        toStage,
        stageProgress.persona,
        { timestamp: new Date().toISOString() }
      )

      if (result.graduated) {
        // Show celebration modal
        setGraduationModal({
          isOpen: true,
          celebration: result.celebration_message
        })

        // Reload stage progress
        await loadStageProgress()
      }
    } catch (err) {
      console.error('Error graduating user:', err)
    }
  }

  const closeGraduationModal = () => {
    setGraduationModal({ isOpen: false, celebration: null })
  }

  const toggleExpand = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const getUserInitials = (email) => {
    if (!email) return '?'
    const parts = email.split('@')[0].split(/[._-]/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  if (loading) {
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

  if (error) {
    return (
      <div className="app">
        <div className="error">
          {error}
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="app">
        <div className="error">
          No profile data found. Please complete the lead magnet flow first.
        </div>
      </div>
    )
  }

  // Get archetype data
  const essenceData = essenceProfiles.essence_archetypes.find(
    archetype => archetype.name === userData.essence_archetype
  )
  
  const protectiveData = protectiveProfiles[userData.protective_archetype]
  const personaData = personaProfiles[userData.persona]
  const personaFlowData = getPersonaWithFlow(userData.persona)

  return (
    <div className="dashboard-container">
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div className="topbar-content">
          <div className="topbar-logo">FindMyFlow</div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            ☰
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'mobile-hidden'}`}>
        <div className="logo">FindMyFlow</div>

        <div className="user-profile">
          <div className="user-avatar">{userData?.user_name?.substring(0, 2).toUpperCase() || getUserInitials(user?.email)}</div>
          <div className="user-name">{userData?.user_name || user?.email?.split('@')[0] || 'User'}</div>
          <div className="user-email">{user?.email}</div>
        </div>

        <ul className="nav-menu">
          <li className="nav-item active" onClick={() => setSidebarOpen(false)}>
            📊 Dashboard
          </li>
          <li className="nav-item" onClick={() => { navigate('/archetypes'); setSidebarOpen(false); }}>
            ✨ Archetypes
          </li>
          <li className="nav-item" onClick={() => { navigate('/7-day-challenge'); setSidebarOpen(false); }}>
            📈 7-Day Challenge
          </li>
          <li className="nav-item" onClick={() => { navigate('/flow-tracker'); setSidebarOpen(false); }}>
            🧭 Flow Tracker
          </li>
          <li className="nav-item" onClick={() => { navigate('/feedback'); setSidebarOpen(false); }}>
            💬 Give Feedback
          </li>
        </ul>

        <div className="signout-link" onClick={signOut}>
          Sign Out
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Welcome Back, {userData?.user_name || user?.email?.split('@')[0] || 'User'}</h1>
          <p className="page-subtitle">Here's Your Profile:</p>
        </div>

        {/* Your Voices Section */}
        <h2 className="section-heading">Your Voices</h2>

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Essence Archetype - Expandable */}
          <div className="stat-card-wrapper">
            <div
              className={`stat-card purple clickable ${expandedArchetypes.essence ? 'expanded' : ''}`}
              onClick={() => setExpandedArchetypes(prev => ({ ...prev, essence: !prev.essence }))}
              style={{ cursor: 'pointer' }}
            >
              {!expandedArchetypes.essence && (
                <>
                  <div className="stat-icon">
                    <img
                      src={`/images/archetypes/lead-magnet-essence/${userData.essence_archetype?.toLowerCase().replace(/\s+/g, '-')}.PNG`}
                      alt={userData.essence_archetype}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = '✨'
                      }}
                    />
                  </div>
                  <div className="stat-label">Essence</div>
                  <div className="stat-value">{userData.essence_archetype}</div>
                </>
              )}
              <div className={`expand-arrow ${expandedArchetypes.essence ? 'expanded' : ''}`}>
                ↓
              </div>
            </div>

            {/* Expanded Content */}
            {expandedArchetypes.essence && (
              <div className="archetype-expanded">
                <div className="archetype-expanded-header">
                  <img
                    src={`/images/archetypes/lead-magnet-essence/${userData.essence_archetype?.toLowerCase().replace(/\s+/g, '-')}.PNG`}
                    alt={userData.essence_archetype}
                  />
                  <div className="archetype-tag">Your Essence</div>
                </div>
                <div className="archetype-expanded-body">
                  <h3 className="archetype-name">{userData.essence_archetype}</h3>
                  <p className="archetype-description">
                    {essenceData?.poetic_line || 'Your essence voice'}
                  </p>
                  <button
                    className="explore-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/archetypes/essence');
                    }}
                  >
                    Explore Deeper →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Protective Archetype - Expandable */}
          <div className="stat-card-wrapper">
            <div
              className={`stat-card yellow clickable ${expandedArchetypes.protective ? 'expanded' : ''}`}
              onClick={() => setExpandedArchetypes(prev => ({ ...prev, protective: !prev.protective }))}
              style={{ cursor: 'pointer' }}
            >
              {!expandedArchetypes.protective && (
                <>
                  <div className="stat-icon">
                    <img
                      src={`/images/archetypes/lead-magnet-protective/${protectiveData?.image || userData.protective_archetype?.toLowerCase().replace(/\s+/g, '-') + '.png'}`}
                      alt={userData.protective_archetype}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = '🛡️'
                      }}
                    />
                  </div>
                  <div className="stat-label">Protective</div>
                  <div className="stat-value">{userData.protective_archetype}</div>
                </>
              )}
              <div className={`expand-arrow ${expandedArchetypes.protective ? 'expanded' : ''}`}>
                ↓
              </div>
            </div>

            {/* Expanded Content */}
            {expandedArchetypes.protective && (
              <div className="archetype-expanded">
                <div className="archetype-expanded-header">
                  <img
                    src={`/images/archetypes/lead-magnet-protective/${protectiveData?.image || userData.protective_archetype?.toLowerCase().replace(/\s+/g, '-') + '.png'}`}
                    alt={userData.protective_archetype}
                  />
                  <div className="archetype-tag">Protective</div>
                </div>
                <div className="archetype-expanded-body">
                  <h3 className="archetype-name">{userData.protective_archetype}</h3>
                  <p className="archetype-description">
                    {protectiveData?.summary || 'Your protective voice'}
                  </p>
                  <button
                    className="explore-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/archetypes/protective');
                    }}
                  >
                    Learn More →
                  </button>
                </div>
              </div>
            )}
          </div>
          {streakData && streakData.streak_days > 0 && (
            <div className="stat-card orange">
              <div className="stat-icon">🔥</div>
              <div className="stat-label">Current Streak</div>
              <div className="stat-value">{streakData.streak_days} days</div>
            </div>
          )}
          {stageProgress && stageProgress.conversations_logged > 0 && (
            <div className="stat-card blue">
              <div className="stat-icon">💬</div>
              <div className="stat-label">Conversations</div>
              <div className="stat-value">{stageProgress.conversations_logged} logged</div>
            </div>
          )}
        </div>

        {/* Journey Guide Section */}
        <h2 className="section-heading">Journey Guide</h2>

        {/* Stage Progress Section */}
        {stageProgress && (
          <div className="stage-progress-section">
            <StageProgressCard
              persona={stageProgress.persona}
              currentStage={stageProgress.current_stage}
              onGraduate={handleGraduation}
            />
          </div>
        )}

        {/* Flow Map - Shows user's journey data for all users */}
        <FlowMap />

        {/* Graduation Modal */}
        <GraduationModal
          isOpen={graduationModal.isOpen}
          celebration={graduationModal.celebration}
          onClose={closeGraduationModal}
        />

        {/* Persona Flow CTA */}
        {personaFlowData?.flow && (
          <div className="persona-flow-section">
            <div className="section-header">
              <h2 className="section-title">Your Next Step</h2>
            </div>
            <div
              className="persona-flow-card"
              style={{ borderColor: personaFlowData.color }}
            >
              <div className="persona-flow-header">
                <span
                  className="persona-badge-small"
                  style={{ backgroundColor: personaFlowData.color }}
                >
                  {personaFlowData.name}
                </span>
                <span className="persona-tagline">{personaFlowData.tagline}</span>
              </div>
              <h3 className="persona-flow-name">{personaFlowData.flow.name}</h3>
              <p className="persona-flow-description">{personaFlowData.flow.description}</p>
              <button
                className="persona-flow-button"
                style={{ backgroundColor: personaFlowData.color }}
                onClick={() => navigate(personaFlowData.flow.path)}
              >
                Start {personaFlowData.flow.name}
              </button>
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div className="cta-banner">
          <div className="cta-content">
            <h3>Ready to Find Your Flow?</h3>
            <p>Live Your Ambitions Quicker</p>
            <div className="cta-buttons">
              <button
                className="btn-white"
                onClick={() => navigate('/7-day-challenge')}
              >
                {hasChallenge ? 'Continue 7-Day Challenge 🔥' : 'Join 7-Day Challenge 🔥'}
              </button>
              <button className="btn-outline" onClick={() => navigate('/feedback')}>
                Give Feedback 💬
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Profile
