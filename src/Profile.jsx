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
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    // Only load profile when user is available
    if (user?.email) {
      loadUserProfile()
      checkChallengeStatus()
      loadStageProgress()
      loadStreakData()
      checkFirstTimeUser()
    } else if (user === null) {
      // User is not authenticated
      setLoading(false)
      setError('Please sign in to view your profile')
    }
    // If user is still loading (undefined), keep loading state
  }, [user])

  const checkFirstTimeUser = () => {
    const hasSeenOnboarding = localStorage.getItem(`profile_onboarding_seen_${user?.id}`)
    if (!hasSeenOnboarding) {
      setTimeout(() => {
        setShowOnboarding(true)
      }, 300)
    }
  }

  const handleOpenOnboarding = () => {
    setShowOnboarding(true)
    setCurrentSlide(0)
    setSidebarOpen(false)
  }

  const handleCloseOnboarding = () => {
    localStorage.setItem(`profile_onboarding_seen_${user?.id}`, 'true')
    setShowOnboarding(false)
    setCurrentSlide(0)
  }

  const handleNextSlide = () => {
    setCurrentSlide(prev => prev + 1)
  }

  const handlePrevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1))
  }

  const captureComponentSnapshot = (selector) => {
    // Add a small delay to ensure DOM is fully rendered
    const element = document.querySelector(selector)
    if (!element) {
      // Retry once after a short delay if element not found
      setTimeout(() => {
        const retryElement = document.querySelector(selector)
        if (retryElement) {
          const clone = retryElement.cloneNode(true)
          clone.style.maxWidth = '100%'
          clone.style.transform = 'scale(0.95)'
          clone.style.transformOrigin = 'center'
          clone.style.pointerEvents = 'none'
          return clone.outerHTML
        }
      }, 100)
      return null
    }

    // Clone the element for snapshot
    const clone = element.cloneNode(true)
    clone.style.maxWidth = '100%'
    clone.style.transform = 'scale(0.95)'
    clone.style.transformOrigin = 'center'
    clone.style.pointerEvents = 'none'

    return clone.outerHTML
  }

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

        // If persona switched (Vibe Seeker → Vibe Riser), reload user profile
        if (result.persona_switched) {
          await loadUserProfile()
        }
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

  // Onboarding slides with component snapshots
  const onboardingSlides = [
    {
      title: "Welcome to Your Dashboard! 🎉",
      content: "This is your home for discovering and living your flow.\n\nHere's a quick tour:",
      componentSelector: null
    },
    {
      title: "Your Voices 🎭",
      content: "These are your Essence and Protective archetypes—the two voices inside you.\n\nClick to expand and explore deeper insights about each.",
      componentSelector: ".stats-grid"
    },
    {
      title: "Journey Guide 🗺️",
      content: "Track your progress through different stages.\n\nEach persona has specific stages to complete, with graduation requirements clearly shown.",
      componentSelector: ".stage-progress-section"
    },
    {
      title: "Flow Map 🧭",
      content: "Your Flow Map shows three key sections:\n1. Flow Finder: Opportunities\n2. Nervous System Limitations: Your current limitations\n3. Flow Compass: Tracking your journey",
      componentSelector: ".flow-map"
    },
    {
      title: "Ready to Explore! ✨",
      content: "Keen to take action and start advancing through stages?\n\nStart a 7-day challenge!\n\nWe're excited to support you on this journey.",
      componentSelector: ".cta-banner"
    }
  ]

  const currentSlideData = onboardingSlides[currentSlide]
  const isLastSlide = currentSlide === onboardingSlides.length - 1

  return (
    <div className="dashboard-container">
      {/* Onboarding Modal Overlay */}
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-modal">
            <div className="onboarding-slide">
              <h2 className="onboarding-title">{currentSlideData.title}</h2>
              <p className="onboarding-content">{currentSlideData.content}</p>

              {/* Component Preview */}
              {currentSlideData.componentSelector && (
                <div className="component-preview">
                  <div
                    className="component-snapshot"
                    dangerouslySetInnerHTML={{
                      __html: captureComponentSnapshot(currentSlideData.componentSelector) || '<div class="snapshot-placeholder">Component preview loading...</div>'
                    }}
                  />
                </div>
              )}

              <div className="onboarding-dots">
                {onboardingSlides.map((_, index) => (
                  <div
                    key={index}
                    className={`onboarding-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
                  />
                ))}
              </div>

              <div className="onboarding-buttons">
                {currentSlide > 0 && (
                  <button className="onboarding-btn secondary" onClick={handlePrevSlide}>
                    Previous
                  </button>
                )}
                {!isLastSlide ? (
                  <button className="onboarding-btn primary" onClick={handleNextSlide}>
                    Next
                  </button>
                ) : (
                  <button className="onboarding-btn primary" onClick={handleCloseOnboarding}>
                    Get Started!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
          <li
            className="nav-item"
            onClick={() => {
              navigate('/7-day-challenge')
              setSidebarOpen(false)
            }}
          >
            📈 7-Day Challenge
          </li>
          <li className="nav-item" onClick={() => { navigate('/flow-compass'); setSidebarOpen(false); }}>
            🧭 Flow Compass
          </li>
          <li className="nav-item" onClick={handleOpenOnboarding}>
            📖 Explainer
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
        <FlowMap persona={stageProgress?.persona} />

        {/* Graduation Modal */}
        <GraduationModal
          isOpen={graduationModal.isOpen}
          celebration={graduationModal.celebration}
          onClose={closeGraduationModal}
        />

        {/* Ready To Find Your Flow Section */}
        <h2 className="section-heading">Ready To Find Your Flow?</h2>

        {/* CTA Banner */}
        <div className="cta-banner">
          <div className="cta-content">
            <h3>Live Your Ambitions Faster</h3>
            <p>Start a 7-day-challenge to gamify your ambitions and advance through the persona stages</p>
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
