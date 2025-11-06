import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { protectiveProfiles } from './data/protectiveProfiles'
import './ArchetypeSelection.css'

const ArchetypeSelection = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.email) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setUserData(data[0])
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="archetype-selection-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  // Get archetype names for display
  const essenceArchetype = userData?.essence_archetype || 'Unknown'
  const protectiveArchetype = userData?.protective_archetype || 'Unknown'

  // Format filename (e.g., "Radiant Rebel" -> "radiant-rebel")
  const getImagePath = (archetype, type) => {
    if (type === 'essence') {
      const filename = archetype.toLowerCase().replace(/\s+/g, '-')
      return `/images/archetypes/lead-magnet-essence/${filename}.PNG`
    } else {
      // For protective, use the image property from the data file
      const protectiveData = protectiveProfiles[archetype]
      if (protectiveData?.image) {
        return `/images/archetypes/lead-magnet-protective/${protectiveData.image}`
      }
      const filename = archetype.toLowerCase().replace(/\s+/g, '-')
      return `/images/archetypes/lead-magnet-protective/${filename}.png`
    }
  }

  return (
    <div className="archetype-selection-container">
      {/* Header */}
      <div className="archetype-selection-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/me')}>
            ←
          </button>
          <h1 className="page-title">Your Archetypes</h1>
        </div>
      </div>

      {/* Content */}
      <div className="archetype-selection-content">
        {/* Intro */}
        <div className="intro-section">
          <h2 className="intro-title">Explore Your Archetypes</h2>
          <p className="intro-text">
            Choose which archetype you'd like to explore in depth. Learn about your patterns, powers, and path forward.
          </p>
        </div>

        {/* Archetype Selection Cards */}
        <div className="archetype-cards">
          {/* Essence Archetype */}
          <div
            className="archetype-card essence"
            onClick={() => navigate('/archetypes/essence')}
          >
            <div className="card-header">
              <div className="card-tag">Essence</div>
              <img
                src={getImagePath(essenceArchetype, 'essence')}
                alt={essenceArchetype}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.style.background = 'linear-gradient(135deg, #f0e7ff, #fff9e6)'
                }}
              />
            </div>
            <div className="card-body">
              <h3 className="card-title">{essenceArchetype}</h3>
              <p className="card-subtitle">Your Essence Archetype</p>
              <p className="card-description">
                Discover your true nature, superpowers, and the energy you bring when you're fully aligned. This is who you are at your core.
              </p>
              <button className="card-cta">Explore Your Essence →</button>
            </div>
          </div>

          {/* Protective Archetype */}
          <div
            className="archetype-card protective"
            onClick={() => navigate('/archetypes/protective')}
          >
            <div className="card-header">
              <div className="card-tag">Protective</div>
              <img
                src={getImagePath(protectiveArchetype, 'protective')}
                alt={protectiveArchetype}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.style.background = 'linear-gradient(135deg, #fef5e7, #fdebd0)'
                }}
              />
            </div>
            <div className="card-body">
              <h3 className="card-title">{protectiveArchetype}</h3>
              <p className="card-subtitle">Your Protective Archetype</p>
              <p className="card-description">
                Understand the patterns that developed to keep you safe, and learn how to move beyond them into your essence.
              </p>
              <button className="card-cta">Understand Your Pattern →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArchetypeSelection
