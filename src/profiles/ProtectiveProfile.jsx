import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { protectiveProfiles } from '../data/protectiveProfiles'
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
      // Use ilike for case-insensitive email matching
      const { data, error } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .ilike('email', user.email)
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
            className={`tab ${activeTab === 'mind' ? 'active' : ''}`}
            onClick={() => switchTab('mind')}
          >
            The Mind
          </button>
          <button
            className={`tab ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => switchTab('body')}
          >
            The Body
          </button>
          <button
            className={`tab ${activeTab === 'invitation' ? 'active' : ''}`}
            onClick={() => switchTab('invitation')}
          >
            Invitation
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

          {/* Emotional Wound */}
          {archetypeData.emotionalWound && (
            <section className="magazine-section bg-wound">
              <div className="section-icon">💔</div>
              <div className="section-label">{archetypeData.emotionalWound.title}</div>
              <h2 className="section-title">The Fear</h2>
              <p className="section-text">{archetypeData.emotionalWound.fear}</p>
              <p className="section-text" style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
                What You Learned: {archetypeData.emotionalWound.learned}
              </p>
              <div className="scroll-indicator">↓</div>
            </section>
          )}

          {/* Splinter Moment (from Origins) */}
          {archetypeData.splinterMomentType && (
            <section className="magazine-section bg-origins">
              <div className="section-icon">🔮</div>
              <div className="section-label">{archetypeData.splinterMomentType.title}</div>
              <h2 className="section-title">Where This Pattern Began</h2>
              <p className="section-text">{archetypeData.splinterMomentType.description}</p>
              <div className="scroll-indicator">↓</div>
            </section>
          )}

          {/* Understanding Context (from Origins) */}
          <section className="magazine-section bg-dark">
            <div className="section-icon">🌱</div>
            <div className="section-label">Understanding</div>
            <h2 className="section-title">This Pattern Protected You</h2>
            <p className="section-text">
              At some point in your life, this protective pattern made sense. It kept you safe from pain, rejection, or overwhelm. Honor that it served you — and recognize you now have the choice to outgrow it.
            </p>
          </section>
        </div>
      )}

      {/* The Mind Tab */}
      {activeTab === 'mind' && (
        <div className="tab-content">
          {/* Core Narrative */}
          {archetypeData.coreNarrative && (
            <section className="magazine-section bg-deep-purple">
              <div className="section-icon">💭</div>
              <div className="section-label">{archetypeData.coreNarrative.title}</div>
              <h2 className="section-title">The Story You Tell Yourself</h2>
              <p className="section-text">{archetypeData.coreNarrative.belief}</p>
              <div className="scroll-indicator">↓</div>
            </section>
          )}

          {/* Avoidance Pattern */}
          {archetypeData.avoidancePattern && (
            <section className="magazine-section bg-orange">
              <div className="section-icon">🚫</div>
              <div className="section-label">{archetypeData.avoidancePattern.title}</div>
              <h2 className="section-title">What You Avoid</h2>
              <p className="section-text">{archetypeData.avoidancePattern.description}</p>
            </section>
          )}

          {/* Behavioral Strategy */}
          {archetypeData.behavioralStrategy && (
            <section className="magazine-section bg-light">
              <div className="section-icon">🎭</div>
              <div className="section-label">{archetypeData.behavioralStrategy.title}</div>
              <h2 className="section-title">How You Cope</h2>
              <p className="section-text" style={{ color: '#333' }}>{archetypeData.behavioralStrategy.description}</p>
            </section>
          )}

          {/* Rewiring Opportunity */}
          {archetypeData.rewiringOpportunity && (
            <section className="magazine-section bg-rewiring">
              <div className="section-icon">✨</div>
              <div className="section-label">{archetypeData.rewiringOpportunity.title}</div>
              <h2 className="section-title">New Beliefs To Practice</h2>
              <div className="affirmations-list">
                {archetypeData.rewiringOpportunity.affirmations.map((affirmation, index) => (
                  <div key={index} className="affirmation-card">
                    <span className="affirmation-number">{index + 1}</span>
                    <p className="affirmation-text">{affirmation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* The Body Tab */}
      {activeTab === 'body' && (
        <div className="tab-content">
          {/* Nervous System Pattern */}
          {archetypeData.nervousSystemPattern && (
            <section className="magazine-section bg-nervous-system">
              <div className="section-icon">⚡</div>
              <div className="section-label">{archetypeData.nervousSystemPattern.title}</div>
              <h2 className="section-title">Your Nervous System Response</h2>
              <div className="pattern-badge">
                {archetypeData.nervousSystemPattern.pattern}
              </div>
              <p className="section-text">{archetypeData.nervousSystemPattern.description}</p>
              <div className="scroll-indicator">↓</div>
            </section>
          )}

          {/* Somatic Expression */}
          {archetypeData.somaticExpression && (
            <section className="magazine-section bg-somatic">
              <div className="section-icon">🫀</div>
              <div className="section-label">{archetypeData.somaticExpression.title}</div>
              <h2 className="section-title">How It Shows In Your Body</h2>
              <p className="section-text">{archetypeData.somaticExpression.description}</p>
            </section>
          )}

          {/* Discharge Pattern Needed */}
          {archetypeData.dischargePatternNeeded && (
            <section className="magazine-section bg-discharge">
              <div className="section-icon">🌊</div>
              <div className="section-label">{archetypeData.dischargePatternNeeded.title}</div>
              <h2 className="section-title">Release Practice</h2>
              <p className="section-text">{archetypeData.dischargePatternNeeded.description}</p>
            </section>
          )}
        </div>
      )}

      {/* Invitation Tab */}
      {activeTab === 'invitation' && (
        <div className="tab-content">
          {/* Your Invitation - CTA */}
          <section className="magazine-section bg-purple">
            <div className="section-icon">🦋</div>
            <div className="section-label">Your Invitation</div>
            <h2 className="section-title">Step Into Your Essence</h2>
            <p className="section-text">
              {archetypeData.detailed?.breakingFree || "What if this pattern no longer served you? What if you were safe enough to let it go? Your essence doesn't need protection to shine — it just needs permission."}
            </p>
            <button
              className="cta-button"
              onClick={() => navigate('/archetypes/essence')}
            >
              Explore Your Essence Voice
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

export default ProtectiveProfile
