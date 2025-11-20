import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { protectiveProfiles } from './data/protectiveProfiles'
import './ProtectiveProfile.css'

const ProtectiveProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

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

  const switchTab = (tabName) => {
    setActiveTab(tabName)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="protective-profile-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  // Get the archetype name and find the profile data
  const archetypeName = userData?.protective_archetype || 'Unknown'
  const archetypeData = protectiveProfiles[archetypeName] || {}

  // Format filename for image path
  const getImagePath = () => {
    // Use the image property from archetypeData if available, otherwise derive from name
    if (archetypeData.image) {
      return `/images/archetypes/lead-magnet-protective/${archetypeData.image}`
    }
    const filename = archetypeName.toLowerCase().replace(/\s+/g, '-')
    return `/images/archetypes/lead-magnet-protective/${filename}.png`
  }

  return (
    <div className="protective-profile-container">
      {/* Header */}
      <div className="protective-profile-header">
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
            className={`tab ${activeTab === 'pattern' ? 'active' : ''}`}
            onClick={() => switchTab('pattern')}
          >
            The Pattern
          </button>
          <button
            className={`tab ${activeTab === 'freedom' ? 'active' : ''}`}
            onClick={() => switchTab('freedom')}
          >
            Breaking Free
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
                e.target.parentElement.style.background = 'linear-gradient(135deg, #fef5e7, #fdebd0)'
              }}
            />
            <div className="image-overlay">
              <span className="archetype-tag-mag">Protective</span>
              <h2 className="section-title">{archetypeName}</h2>
              <p style={{ fontSize: '1.25rem', fontStyle: 'italic', opacity: 0.95 }}>
                {archetypeData.summary}
              </p>
              <div className="scroll-indicator">↓</div>
            </div>
          </section>

          {/* Summary Quote */}
          <section className="magazine-section bg-dark">
            <div className="quote">
              <div className="quote-mark">"</div>
              {archetypeData.summary}
            </div>
            <div className="scroll-indicator">↓</div>
          </section>

          {/* Purpose */}
          <section className="magazine-section bg-deep-purple">
            <div className="section-icon">🛡️</div>
            <div className="section-label">Your Protection Pattern</div>
            <h2 className="section-title">The Shield You Built</h2>
            <p className="section-text">
              This protective archetype emerged when you needed safety. It kept you safe from criticism, judgment, and failure. It served you once — but it may no longer serve who you're becoming.
            </p>
          </section>
        </div>
      )}

      {/* Pattern Tab */}
      {activeTab === 'pattern' && (
        <div className="tab-content">
          <section className="magazine-section bg-wound">
            <div className="section-icon">🔍</div>
            <div className="section-label">How It Shows Up</div>
            <h2 className="section-title">The Whisper Inside</h2>
            <p className="section-text">
              {archetypeData.detailed?.howItShowsUp}
            </p>
            <div className="scroll-indicator">↓</div>
          </section>

          <section className="magazine-section bg-orange">
            <div className="section-icon">💭</div>
            <div className="section-label">The Hidden Cost</div>
            <h2 className="section-title">What It Really Does</h2>
            <p className="section-text">
              While this pattern promises safety, it often delivers something else: paralysis, disconnection, and the constant sense that you're not living fully. It keeps you protecting instead of thriving.
            </p>
          </section>
        </div>
      )}

      {/* Freedom Tab */}
      {activeTab === 'freedom' && (
        <div className="tab-content">
          <section className="magazine-section bg-light">
            <div className="section-icon">🦋</div>
            <div className="section-label">Breaking Free</div>
            <h2 className="section-title">Your Path Forward</h2>
            <p className="section-text">
              {archetypeData.detailed?.breakingFree}
            </p>
            <div className="scroll-indicator" style={{ color: '#5e17eb' }}>↓</div>
          </section>

          <section className="magazine-section bg-purple">
            <div className="section-icon">✨</div>
            <div className="section-label">Your Invitation</div>
            <h2 className="section-title">Step Into Your Essence</h2>
            <p className="section-text">
              What if this pattern no longer served you? What if you were safe enough to let it go? Your essence doesn't need protection to shine — it just needs permission.
            </p>
            <button
              className="cta-button"
              onClick={() => navigate('/archetypes/essence')}
            >
              Explore Your Essence Archetype
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

export default ProtectiveProfile
