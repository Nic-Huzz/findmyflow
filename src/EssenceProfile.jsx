import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { essenceProfiles } from './data/essenceProfiles'
import { hasActiveChallenge } from './lib/questCompletion'
import './EssenceProfile.css'

const EssenceProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [hasChallenge, setHasChallenge] = useState(false)

  useEffect(() => {
    if (user?.email) {
      loadUserProfile()
      checkChallengeStatus()
    }
  }, [user])

  const checkChallengeStatus = async () => {
    if (user?.id) {
      const active = await hasActiveChallenge(user.id)
      setHasChallenge(active)
    }
  }

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

  const switchTab = (tabName) => {
    setActiveTab(tabName)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="essence-profile-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  // Get the archetype name and find the profile data
  const archetypeName = userData?.essence_archetype || 'Unknown'
  const archetypeData = essenceProfiles.essence_archetypes.find(
    arch => arch.name === archetypeName
  ) || {}

  // Format filename for image path
  const getImagePath = () => {
    const filename = archetypeName.toLowerCase().replace(/\s+/g, '-')
    return `/images/archetypes/lead-magnet-essence/${filename}.PNG`
  }

  return (
    <div className="essence-profile-container">
      {/* Header */}
      <div className="essence-profile-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/archetypes')}>
            ←
          </button>
          <h1 className="archetype-name">{archetypeName}</h1>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => switchTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'powers' ? 'active' : ''}`}
            onClick={() => switchTab('powers')}
          >
            Powers
          </button>
          <button
            className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
            onClick={() => switchTab('patterns')}
          >
            Patterns
          </button>
          <button
            className={`tab ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => switchTab('characters')}
          >
            Characters
          </button>
          <button
            className={`tab ${activeTab === 'vision' ? 'active' : ''}`}
            onClick={() => switchTab('vision')}
          >
            Vision
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Image Section */}
          <section className="magazine-section image-section">
            <img
              src={getImagePath()}
              alt={archetypeName}
              className="archetype-image"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.style.background = 'linear-gradient(135deg, #f0e7ff, #fff9e6)'
              }}
            />
            <div className="image-overlay">
              <span className="archetype-tag-mag">Essence</span>
              <h2 className="section-title">{archetypeName}</h2>
              <p style={{ fontSize: '1.25rem', fontStyle: 'italic', opacity: 0.95 }}>
                {archetypeData.essence}
              </p>
              <div className="scroll-indicator">↓</div>
            </div>
          </section>

          {/* Poetic Line */}
          <section className="magazine-section bg-dark">
            <div className="quote">
              <div className="quote-mark">"</div>
              {archetypeData.poetic_line}
            </div>
            <div className="scroll-indicator">↓</div>
          </section>

          {/* Superpower */}
          <section className="magazine-section bg-deep-purple">
            <div className="section-icon">✨</div>
            <div className="section-label">Your Superpower</div>
            <h2 className="section-title">Your Unique Gift</h2>
            <p className="section-text">{archetypeData.superpower}</p>
            <div className="scroll-indicator">↓</div>
          </section>

          {/* North Star */}
          <section className="magazine-section bg-light">
            <div className="section-icon">🌟</div>
            <div className="section-label">Your North Star</div>
            <h2 className="section-title">Your Guiding Light</h2>
            <p className="section-text">{archetypeData.north_star}</p>
            <div className="scroll-indicator" style={{ color: '#5e17eb' }}>↓</div>
          </section>

          {/* The Wound */}
          <section className="magazine-section bg-wound">
            <div className="section-icon">🩹</div>
            <div className="section-label">The Wound</div>
            <h2 className="section-title">Your Origin Story</h2>
            <p className="section-text">{archetypeData.essence_wound}</p>
          </section>
        </div>
      )}

      {/* Powers Tab */}
      {activeTab === 'powers' && (
        <div className="tab-content">
          <section className="magazine-section bg-purple">
            <div className="section-icon">⚡</div>
            <div className="section-label">Energetic Transmission</div>
            <h2 className="section-title">Your Energy</h2>
            <p className="section-text">{archetypeData.energetic_transmission}</p>
            <div className="scroll-indicator">↓</div>
          </section>

          <section className="magazine-section bg-light">
            <div className="section-icon">🚀</div>
            <div className="section-label">Vision in Action</div>
            <h2 className="section-title">You In Action</h2>
            <p className="section-text">{archetypeData.vision_in_action}</p>
          </section>
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="tab-content">
          <section className="magazine-section bg-dark">
            <div className="section-icon">🎯</div>
            <div className="section-label">Recognition Pattern</div>
            <h2 className="section-title">When People Seek You</h2>
            <p className="section-text">{archetypeData.recognition_pattern}</p>
            <div className="scroll-indicator">↓</div>
          </section>

          <section className="magazine-section bg-yellow">
            <div className="section-icon">🧸</div>
            <div className="section-label">Inner Child Desire</div>
            <h2 className="section-title">Your Childhood Nature</h2>
            <p className="section-text">{archetypeData.inner_child_desire}</p>
          </section>
        </div>
      )}

      {/* Characters Tab */}
      {activeTab === 'characters' && (
        <div className="tab-content">
          <section className="magazine-section bg-light">
            <div className="section-label">Characters Like You</div>
            <h2 className="section-title">Your Essence in Action</h2>
            <div>
              {archetypeData.characters && archetypeData.characters.map((character, index) => (
                <div key={index} className="character-card">
                  <div className="character-icon">✨</div>
                  <div className="character-name">{character}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Vision Tab */}
      {activeTab === 'vision' && (
        <div className="tab-content">
          <section className="magazine-section bg-purple">
            <div className="section-icon">🔮</div>
            <div className="section-label">Poetic Vision</div>
            <h2 className="section-title">Your Future Awaits</h2>
            <p className="section-text">{archetypeData.poetic_vision}</p>
            {userData?.persona === 'Vibe Seeker' ? (
              <div className="locked-challenge-message">
                <p style={{ color: '#fbbf24', marginBottom: '12px', fontWeight: 600 }}>🔒 Complete Flow Finder to unlock</p>
                <button
                  className="cta-button"
                  onClick={() => navigate('/nikigai/skills')}
                  style={{ background: 'linear-gradient(135deg, #D4A017, #F59E0B)' }}
                >
                  Start Flow Finder
                </button>
              </div>
            ) : (
              <button
                className="cta-button"
                onClick={() => navigate('/7-day-challenge')}
              >
                {hasChallenge ? 'Continue Your 7-Day Challenge' : 'Start Your 7-Day Challenge'}
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default EssenceProfile
