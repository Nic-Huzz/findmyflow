import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { essenceProfiles } from './data/essenceProfiles'
import { protectiveProfiles } from './data/protectiveProfiles'
import { personaProfiles } from './data/personaProfiles'
import { hasActiveChallenge } from './lib/questCompletion'

const Profile = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasChallenge, setHasChallenge] = useState(false)

  useEffect(() => {
    // Only load profile when user is available
    if (user?.email) {
      loadUserProfile()
      checkChallengeStatus()
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

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card purple">
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
          </div>
          <div className="stat-card yellow">
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
          </div>
          <div className="stat-card gradient">
            <div className="stat-icon">🌟</div>
            <div className="stat-label">Journey Stage</div>
            <div className="stat-value">{userData.persona}</div>
          </div>
        </div>

        {/* Archetypes Section */}
        <div className="archetypes-section">
          <div className="section-header">
            <h2 className="section-title">Your Archetypes</h2>
          </div>

          <div className="archetype-cards-grid">
            {/* Essence Card */}
            <div className="archetype-card essence">
              <div className="archetype-header">
                <img
                  src={`/images/archetypes/lead-magnet-essence/${userData.essence_archetype?.toLowerCase().replace(/\s+/g, '-')}.PNG`}
                  alt={userData.essence_archetype}
                />
                <div className="archetype-tag">Your Essence</div>
              </div>
              <div className="archetype-body">
                <h3 className="archetype-name">{userData.essence_archetype}</h3>
                <p className="archetype-description">
                  {essenceData?.poetic_line || 'Your essence archetype'}
                </p>
                <button
                  className="explore-button"
                  onClick={() => navigate('/archetypes/essence')}
                >
                  Explore Deeper →
                </button>
              </div>
            </div>

            {/* Protective Card */}
            <div className="archetype-card">
              <div className="archetype-header">
                <img
                  src={`/images/archetypes/lead-magnet-protective/${protectiveData?.image || userData.protective_archetype?.toLowerCase().replace(/\s+/g, '-') + '.png'}`}
                  alt={userData.protective_archetype}
                />
                <div className="archetype-tag">Protective</div>
              </div>
              <div className="archetype-body">
                <h3 className="archetype-name">{userData.protective_archetype}</h3>
                <p className="archetype-description">
                  {protectiveData?.summary || 'Your protective archetype'}
                </p>
                <button
                  className="explore-button"
                  onClick={() => navigate('/archetypes/protective')}
                >
                  Learn More →
                </button>
              </div>
            </div>
          </div>
        </div>

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
