import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { essenceProfiles } from './data/essenceProfiles'
import { protectiveProfiles } from './data/protectiveProfiles'
import { personaProfiles, getPersonaWithFlow, normalizePersona } from './data/personaProfiles'
import { hasActiveChallenge } from './lib/questCompletion'
import { getStageShortName } from './lib/stageConfig'
import { graduateUser } from './lib/graduationChecker'
import GraduationModal from './components/GraduationModal'
import FlowMap from './components/FlowMap'
import FlowMapRiver from './components/FlowMapRiver'
import SeeYourFlow from './components/SeeYourFlow'
import HomeFirstTime from './components/HomeFirstTime'

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
  const [challengePoints, setChallengePoints] = useState(0)
  const [challengeDay, setChallengeDay] = useState(0)
  const [questProgress, setQuestProgress] = useState({ dailyDone: 0, dailyTotal: 0, weeklyDone: 0, weeklyTotal: 0 })
  const [stageProgress, setStageProgress] = useState(null)
  const [graduationModal, setGraduationModal] = useState({ isOpen: false, celebration: null })
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [primaryProject, setPrimaryProject] = useState(null)
  const [allProjects, setAllProjects] = useState([])
  const [riverRefreshKey, setRiverRefreshKey] = useState(0)
  const [streakData, setStreakData] = useState({ dailyStreak: 0, groanStreak: 0 })

  useEffect(() => {
    // Only load profile when user is available
    if (user?.email) {
      loadUserProfile()
      checkChallengeStatus()
      loadStageProgress()
      loadUserProjects()
      checkFirstTimeUser()
      loadStreakData()
    } else if (user === null) {
      // User is not authenticated
      setLoading(false)
      setError('Please sign in to view your profile')
    }
    // If user is still loading (undefined), keep loading state
  }, [user])

  const loadUserProjects = async () => {
    if (!user?.id) return

    try {
      const { data: projects, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading projects:', error)
        return
      }

      setAllProjects(projects || [])

      // Find primary project
      const primary = projects?.find(p => p.is_primary) || projects?.[0]
      setPrimaryProject(primary || null)
    } catch (err) {
      console.error('Error in loadUserProjects:', err)
    }
  }

  const loadStreakData = async () => {
    if (!user?.id) return

    try {
      // Get daily streak from quest completions
      const { data: completions } = await supabase
        .from('quest_completions')
        .select('completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

      // Calculate daily streak
      let dailyStreak = 0
      if (completions?.length > 0) {
        const daysWithCompletions = new Set(
          completions.map(c => c.completed_at?.split('T')[0])
        )
        const sortedDays = Array.from(daysWithCompletions).sort().reverse()
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        // Check if today or yesterday has completions
        if (sortedDays.includes(today) || sortedDays.includes(yesterday)) {
          let checkDate = new Date(sortedDays[0])
          for (const dayStr of sortedDays) {
            const expected = checkDate.toISOString().split('T')[0]
            if (dayStr === expected) {
              dailyStreak++
              checkDate.setDate(checkDate.getDate() - 1)
            } else {
              break
            }
          }
        }
      }

      // Get groan streak from weekly plans
      const { data: weeklyPlans } = await supabase
        .from('weekly_plans')
        .select('week_start_date, weekly_groan_completed')
        .eq('user_id', user.id)
        .eq('weekly_groan_completed', true)
        .order('week_start_date', { ascending: false })

      // Calculate groan streak (consecutive weeks)
      let groanStreak = 0
      if (weeklyPlans?.length > 0) {
        const today = new Date()
        const currentWeekStart = new Date(today)
        currentWeekStart.setDate(today.getDate() - today.getDay() + 1) // Monday
        currentWeekStart.setHours(0, 0, 0, 0)

        let checkWeek = new Date(currentWeekStart)

        for (const plan of weeklyPlans) {
          const planWeekStart = new Date(plan.week_start_date)
          planWeekStart.setHours(0, 0, 0, 0)

          // Check if this week matches expected week
          const expectedWeekStr = checkWeek.toISOString().split('T')[0]
          const planWeekStr = planWeekStart.toISOString().split('T')[0]

          if (planWeekStr === expectedWeekStr) {
            groanStreak++
            checkWeek.setDate(checkWeek.getDate() - 7) // Previous week
          } else if (planWeekStart < checkWeek) {
            // Gap in weeks, streak broken
            break
          }
        }
      }

      setStreakData({ dailyStreak, groanStreak })
    } catch (err) {
      console.error('Error loading streak data:', err)
    }
  }

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
    const element = document.querySelector(selector)
    if (!element) {
      return null
    }

    // Clone the element for snapshot (CSS handles scaling)
    const clone = element.cloneNode(true)
    clone.style.maxWidth = '100%'
    clone.style.pointerEvents = 'none'

    return clone.outerHTML
  }

  const checkChallengeStatus = async () => {
    if (user?.id) {
      const active = await hasActiveChallenge(user.id)
      setHasChallenge(active)

      // Also fetch challenge points and quest progress
      if (active) {
        const { data: progressData } = await supabase
          .from('challenge_progress')
          .select('total_points, challenge_instance_id, current_day')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('challenge_start_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (progressData) {
          setChallengePoints(progressData.total_points || 0)
          setChallengeDay(progressData.current_day || 0)

          // Fetch quest data and completions to calculate progress
          try {
            const [questsResponse, completionsResponse] = await Promise.all([
              fetch('/challengeQuestsUpdate.json'),
              supabase
                .from('quest_completions')
                .select('quest_id, completed_at')
                .eq('user_id', user.id)
                .eq('challenge_instance_id', progressData.challenge_instance_id)
            ])

            const questData = await questsResponse.json()
            const completions = completionsResponse.data || []

            // Get today's date for daily quest check
            const today = new Date().toISOString().split('T')[0]

            // Filter active quests (not archived, not coming_soon)
            const activeQuests = questData.quests?.filter(q => !q.archived && q.status !== 'coming_soon') || []

            // Count daily quests
            const dailyQuests = activeQuests.filter(q => q.frequency === 'daily')
            const todayCompletions = completions.filter(c => c.completed_at?.startsWith(today))
            const dailyDone = dailyQuests.filter(q =>
              todayCompletions.some(c => c.quest_id === q.id)
            ).length

            // Count weekly quests
            const weeklyQuests = activeQuests.filter(q => q.frequency === 'weekly')
            const weeklyDone = weeklyQuests.filter(q =>
              completions.some(c => c.quest_id === q.id)
            ).length

            setQuestProgress({
              dailyDone,
              dailyTotal: dailyQuests.length,
              weeklyDone,
              weeklyTotal: weeklyQuests.length
            })
          } catch (err) {
            console.error('Error loading quest progress:', err)
          }
        }
      }
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
      // Use ilike for case-insensitive email matching (emails may be stored in mixed case)
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .ilike('email', user.email)
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
        <div className="error" style={{ textAlign: 'center', padding: '2rem' }}>
          {!user ? (
            <>
              <p style={{ marginBottom: '1rem' }}>You're not logged in.</p>
              <Link
                to="/log-in"
                style={{
                  color: '#8B5CF6',
                  textDecoration: 'underline',
                  fontSize: '1.1rem'
                }}
              >
                Click here to log in
              </Link>
            </>
          ) : (
            <>
              <p style={{ marginBottom: '1rem' }}>No profile data found.</p>
              <p style={{ marginBottom: '1rem', opacity: 0.8 }}>
                Complete the onboarding to get started.
              </p>
              <Link
                to="/log-in"
                style={{
                  color: '#8B5CF6',
                  textDecoration: 'underline',
                  fontSize: '1.1rem'
                }}
              >
                Start onboarding
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  // Check if user needs to complete onboarding (first-time experience)
  // Show HomeFirstTime if onboarding_completed is false
  if (stageProgress && stageProgress.onboarding_completed === false) {
    return <HomeFirstTime />
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
      title: "The Voices",
      content: "These are your Essence and Protective archetypes—the two voices inside you.\n\nYour Essence is who you truly are. Your Protective voice developed to keep you safe.\n\nClick to expand and explore deeper insights about each.",
      componentSelector: ".stats-grid"
    },
    {
      title: "Your Flow Map",
      content: "See your journey visualised as a river.\n\nEach dot represents a moment you've logged—flowing, redirecting, resting, or honouring.\n\nSwitch between projects to see different journeys.",
      componentSelector: ".flow-map-river"
    },
    {
      title: "Map Your Journey",
      content: "Log your current state and map your highlights and challenges.\n\nFirst-time users will be guided through mapping their journey so far.\n\nReturning users can quickly log how they're flowing today.",
      componentSelector: ".see-your-flow"
    },
    {
      title: "Ready to find your flow?",
      content: "Start a 7-day challenge to take action and advance through your stages.\n\nComplete quests, track your progress, and discover your natural flow.\n\nWe're excited to support you on this journey.",
      componentSelector: ".home-action-buttons"
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
          <li className="nav-item" onClick={() => { navigate('/library'); setSidebarOpen(false); }}>
            📚 Library of Answers
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
                  <p className="archetype-subtitle">Your Essence Voice</p>
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
                    Explore Your Essence →
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
                  <p className="archetype-subtitle">Your Protective Voice</p>
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
                    Explore Your Protective →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Flow Map River - Shows flow compass entries */}
        <h2 className="section-heading">Your Flow Map</h2>
        {primaryProject ? (
          <>
            <FlowMapRiver
              key={riverRefreshKey}
              projectId={primaryProject.id}
              limit={20}
              onViewAll={() => navigate('/flow-compass')}
              projects={allProjects}
              selectedProjectId={primaryProject.id}
              onProjectSelect={(project) => {
                setPrimaryProject(project)
                setRiverRefreshKey(prev => prev + 1)
              }}
            />
            <SeeYourFlow
              key={`see-flow-${primaryProject.id}`}
              project={primaryProject}
              onUpdate={(updatedProject) => {
                setPrimaryProject(updatedProject)
                setAllProjects(prev =>
                  prev.map(p => p.id === updatedProject.id ? updatedProject : p)
                )
              }}
              onFlowEntryAdded={() => {
                // Refresh the river by changing its key
                setRiverRefreshKey(prev => prev + 1)
              }}
            />
          </>
        ) : (
          <FlowMap persona={stageProgress?.persona} />
        )}

        {/* Graduation Modal */}
        <GraduationModal
          isOpen={graduationModal.isOpen}
          celebration={graduationModal.celebration}
          onClose={closeGraduationModal}
        />

        {/* Ready To Find Your Flow Section */}
        <h2 className="section-heading">Ready To Find Your Flow?</h2>

        {/* Progress Strip - Shows project stage and quick stats */}
        {primaryProject && (
          <div className="progress-strip">
            <div className="progress-strip-header">
              <span className="progress-project-name">{primaryProject.name}</span>
            </div>

            <div className="progress-stats-row">
              <div className="progress-stat-item">
                <span className="progress-stat-icon">☀️</span>
                <span className="progress-stat-value">{questProgress.dailyDone}/{questProgress.dailyTotal}</span>
                <span className="progress-stat-label">Daily</span>
              </div>

              <div className="progress-stat-item">
                <span className="progress-stat-icon">📅</span>
                <span className="progress-stat-value">{questProgress.weeklyDone}/{questProgress.weeklyTotal}</span>
                <span className="progress-stat-label">Weekly</span>
              </div>

              <div className="progress-stat-item">
                <span className="progress-stat-icon">🎯</span>
                <span className="progress-stat-value">{primaryProject.current_stage || 1}/6</span>
                <span className="progress-stat-label">Stage</span>
              </div>
            </div>

            <div className="progress-strip-bottom">
              <div className="progress-stat">
                <span className="progress-stat-value">{challengePoints || 0}</span>
                <span className="progress-stat-label">Points</span>
              </div>

              <div className="progress-stage-tag">
                <span className="progress-stage-label">Stage:</span>
                <span className="progress-stage-name">{getStageShortName(primaryProject.current_stage || 1)}</span>
              </div>

              {hasChallenge && (
                <div className="progress-stat">
                  <span className="progress-stat-value">{Math.max(0, 7 - challengeDay)}</span>
                  <span className="progress-stat-label">Days Left</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Streak Display */}
        <div className="streak-display">
          <div className="streak-item daily">
            <span className={`streak-flame ${streakData.dailyStreak >= 7 ? 'legendary' : streakData.dailyStreak >= 5 ? 'hot' : streakData.dailyStreak >= 3 ? 'warm' : streakData.dailyStreak >= 1 ? '' : 'cold'}`}>
              {streakData.dailyStreak > 0 ? '🔥' : '💤'}
            </span>
            <div className="streak-info">
              <span className="streak-value">{streakData.dailyStreak}</span>
              <span className="streak-label">Day Streak</span>
            </div>
          </div>
          <div className="streak-item groan">
            <span className={`streak-flame ${streakData.groanStreak >= 4 ? 'legendary' : streakData.groanStreak >= 2 ? 'warm' : ''}`}>
              {streakData.groanStreak > 0 ? '💪' : '🌱'}
            </span>
            <div className="streak-info">
              <span className="streak-value">{streakData.groanStreak}</span>
              <span className="streak-label">Week Groan Streak</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="home-action-buttons">
          <button
            className="action-btn primary"
            onClick={() => navigate('/7-day-challenge')}
          >
            🎯 {hasChallenge ? 'Continue 7-Day Challenge' : 'Start 7-Day Challenge'}
          </button>
          <a
            className="action-btn support"
            href="https://wa.me/61423220241?text=Hi%20Nic!%20I%20need%20some%20help%20with%20FindMyFlow"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Need help? Chat with me
          </a>
        </div>


      </div>
    </div>
  )
}

export default Profile
