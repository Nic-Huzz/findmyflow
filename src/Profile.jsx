import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { essenceProfiles } from './data/essenceProfiles'
import { protectiveProfiles } from './data/protectiveProfiles'
import { personaProfiles } from './data/personaProfiles'

const Profile = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)

  useEffect(() => {
    // Only load profile when user is available
    if (user?.email) {
      loadUserProfile()
    } else if (user === null) {
      // User is not authenticated
      setLoading(false)
      setError('Please sign in to view your profile')
    }
    // If user is still loading (undefined), keep loading state
  }, [user])

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
    <div className="profile-container">
      <div className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>Your Profile</h1>
            <p>Discover your archetypes and unlock your potential</p>
          </div>
          <div className="header-actions">
            <span className="user-email">{user?.email}</span>
            <button 
              className="logout-button"
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      <div className="content">
        <div className="archetype-cards">
          {/* Essence Archetype Card */}
          <div className="archetype-card essence">
            <div className="archetype-hero">
              <img
                src={`/images/archetypes/lead-magnet-essence/${userData.essence_archetype?.toLowerCase().replace(/\s+/g, '-')}.PNG`}
                alt={userData.essence_archetype}
              />
            </div>
            <div className="archetype-content">
              <div className="archetype-name">{userData.essence_archetype}</div>
              <div className="archetype-summary">
                {essenceData?.poetic_line || 'Your essence archetype'}
              </div>
              <button 
                className="expand-btn" 
                onClick={() => toggleExpand('essence')}
              >
                {expandedCard === 'essence' ? 'Show Less ↑' : 'Learn More ↓'}
              </button>
              {expandedCard === 'essence' && essenceData && (
                <div className="expand-content show">
                  <h4>Your Superpower</h4>
                  <p>{essenceData.superpower}</p>
                  <h4>Your North Star</h4>
                  <p>{essenceData.north_star}</p>
                  <h4>Your Vision</h4>
                  <p>{essenceData.poetic_vision}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Protective Archetype Card */}
          <div className="archetype-card">
            <div className="archetype-hero">
              <img
                src={`/images/archetypes/lead-magnet-protective/${userData.protective_archetype?.toLowerCase().replace(/\s+/g, '-')}.png`}
                alt={userData.protective_archetype}
              />
            </div>
            <div className="archetype-content">
              <div className="archetype-name">{userData.protective_archetype}</div>
              <div className="archetype-summary">
                {protectiveData?.summary || 'Your protective archetype'}
              </div>
              <button 
                className="expand-btn" 
                onClick={() => toggleExpand('protective')}
              >
                {expandedCard === 'protective' ? 'Show Less ↑' : 'Learn More ↓'}
              </button>
              {expandedCard === 'protective' && protectiveData && (
                <div className="expand-content show">
                  <h4>How It Shows Up</h4>
                  <p>{protectiveData.detailed?.howItShowsUp}</p>
                  <h4>Breaking Free</h4>
                  <p>{protectiveData.detailed?.breakingFree}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Persona Section */}
        <div className="persona-section">
          <h3>Your Journey Stage</h3>
          <div className="persona-badge">{userData.persona}</div>
          <p style={{ marginTop: '15px', color: '#666' }}>
            {personaData?.summary || 'Your current journey stage'}
          </p>
        </div>
        
        {/* Continue Section */}
        <div className="continue-section">
          <h3>Continue Your Journey</h3>
          <p>Ready to embark on a 7-day transformation journey?</p>
          <button
            className="continue-btn"
            onClick={() => navigate('/7-day-challenge')}
          >
            Start 7-Day Challenge
          </button>
          <button
            className="continue-btn"
            onClick={() => navigate('/healing-compass')}
            style={{ marginTop: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
          >
            Start Healing Compass
          </button>
          <button className="share-btn">Share Profile</button>
        </div>
      </div>
    </div>
  )
}

export default Profile
