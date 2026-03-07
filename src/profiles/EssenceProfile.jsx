import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { essenceProfiles } from '../data/essenceProfiles'
import { protectiveProfiles } from '../data/protectiveProfiles'
import { hasActiveChallenge } from '../lib/questCompletion'
import {
  getEssenceDisplayName,
  getEssenceImagePath,
  getEssenceFieldValue,
  getEssenceFieldMeta,
  isEssenceFieldCustomized
} from '../lib/essencePreferences'
import EditEssenceModal from '../components/HeroProfile/EditEssenceModal'
import EditEssenceFieldModal from '../components/EditEssenceFieldModal'
import ProtectiveArchetypeIcon from '../components/ProtectiveArchetypeIcon'
import './EssenceProfile.css'

const EssenceProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasChallenge, setHasChallenge] = useState(false)
  const [deeperInsightsOpen, setDeeperInsightsOpen] = useState(true)

  // Determine active tab from URL
  const activeTab = location.pathname.includes('/protective') ? 'protective' : 'essence'

  // Modal states
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [imageError, setImageError] = useState(false)

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

  const handleAvatarSaved = async () => {
    setShowAvatarModal(false)
    setImageError(false)
    setLoading(true)
    await loadUserProfile()
  }

  const handleFieldSaved = async () => {
    setLoading(true)
    await loadUserProfile()
    setEditingField(null)
  }

  const switchTab = (tab) => {
    setImageError(false)
    if (tab === 'essence') {
      navigate('/archetypes/essence', { replace: true })
    } else {
      navigate('/archetypes/protective', { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="essence-profile-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  // Get archetype data
  const archetypeName = getEssenceDisplayName(userData)
  const originalName = userData?.essence_archetype || 'Unknown'
  const archetypeData = essenceProfiles.essence_archetypes.find(
    arch => arch.name === originalName
  ) || {}
  const allArchetypes = essenceProfiles.essence_archetypes

  // Get protective archetype data
  const protectiveArchetypeName = userData?.protective_archetype
  const protectiveArchetype = protectiveArchetypeName ? protectiveProfiles[protectiveArchetypeName] : null
  const allProtectiveArchetypes = Object.entries(protectiveProfiles).map(([name, data]) => ({
    name,
    ...data
  }))

  // Get essence field values (custom or default)
  const taglineValue = getEssenceFieldValue(userData, 'tagline', archetypeData)
  const essenceValue = getEssenceFieldValue(userData, 'essence', archetypeData)
  const superpowerValue = getEssenceFieldValue(userData, 'superpower', archetypeData)
  const visionValue = getEssenceFieldValue(userData, 'vision', archetypeData)
  const northStarValue = getEssenceFieldValue(userData, 'north_star', archetypeData)
  const innerChildValue = getEssenceFieldValue(userData, 'inner_child', archetypeData)
  const woundValue = getEssenceFieldValue(userData, 'wound', archetypeData)
  const charactersValue = getEssenceFieldValue(userData, 'characters', archetypeData)
  const energeticValue = getEssenceFieldValue(userData, 'energetic_transmission', archetypeData)
  const recognitionValue = getEssenceFieldValue(userData, 'recognition_pattern', archetypeData)
  const visionInActionValue = getEssenceFieldValue(userData, 'vision_in_action', archetypeData)

  // Protective archetype values come directly from the profile data (not customizable for now)

  // Check if essence fields are customized
  const taglineCustomized = isEssenceFieldCustomized(userData, 'tagline')
  const essenceCustomized = isEssenceFieldCustomized(userData, 'essence')
  const superpowerCustomized = isEssenceFieldCustomized(userData, 'superpower')
  const visionCustomized = isEssenceFieldCustomized(userData, 'vision')
  const northStarCustomized = isEssenceFieldCustomized(userData, 'north_star')
  const innerChildCustomized = isEssenceFieldCustomized(userData, 'inner_child')
  const woundCustomized = isEssenceFieldCustomized(userData, 'wound')
  const charactersCustomized = isEssenceFieldCustomized(userData, 'characters')
  const energeticCustomized = isEssenceFieldCustomized(userData, 'energetic_transmission')
  const recognitionCustomized = isEssenceFieldCustomized(userData, 'recognition_pattern')
  const visionInActionCustomized = isEssenceFieldCustomized(userData, 'vision_in_action')


  const imagePath = getEssenceImagePath(userData)

  return (
    <div className="essence-profile-container essence-single-page">
      {/* Header */}
      <div className="essence-profile-header essence-header-compact">
        <button className="back-btn" onClick={() => navigate('/hero-profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="header-center">
          <span className="header-icon">✦</span>
          <h1 className="header-title">{activeTab === 'essence' ? 'Essence Deep Dive' : 'Protective Deep Dive'}</h1>
          <span className="header-icon">✦</span>
        </div>
        <div className="header-spacer" />
      </div>

      {/* Content */}
      <div className="essence-scroll-content">
        {/* Avatar Section */}
        <section className="essence-section essence-avatar-section">
          <div className="avatar-wrapper">
            {activeTab === 'essence' && !imageError && imagePath && (
              <img
                key={imagePath}
                src={imagePath}
                alt={archetypeName}
                className="essence-avatar-image"
                onError={() => setImageError(true)}
              />
            )}
            {activeTab === 'essence' && (imageError || !imagePath) && (
              <div className="essence-avatar-image avatar-fallback">
                {archetypeName?.charAt(0) || '?'}
              </div>
            )}
            {activeTab === 'protective' && protectiveArchetypeName && (
              <div className="essence-avatar-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ProtectiveArchetypeIcon archetype={protectiveArchetypeName} size={100} />
              </div>
            )}
            {activeTab === 'protective' && !protectiveArchetypeName && (
              <div className="essence-avatar-image avatar-fallback" style={{ background: 'linear-gradient(135deg, #212529 0%, #343a40 100%)' }}>
                🛡️
              </div>
            )}
            {activeTab === 'essence' && (
              <button
                className="avatar-edit-btn"
                onClick={() => setShowAvatarModal(true)}
                aria-label="Edit avatar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
          <div className="avatar-info">
            <h2 className="avatar-name">
              {activeTab === 'essence' ? archetypeName : (protectiveArchetypeName || 'Unknown')}
            </h2>
            {activeTab === 'essence' && (
              <div className="avatar-tagline-wrapper">
                <p className="avatar-tagline">{taglineValue}</p>
              </div>
            )}
            {activeTab === 'protective' && protectiveArchetype && (
              <p className="avatar-tagline shadow-tagline">{protectiveArchetype.summary}</p>
            )}
          </div>
        </section>

        {/* Tab Switcher */}
        <section className="essence-section essence-tabs-section">
          <div className="archetype-tabs">
            <button
              className={`archetype-tab ${activeTab === 'essence' ? 'active' : ''}`}
              onClick={() => switchTab('essence')}
            >
              <span className="tab-icon">✨</span>
              <span>Essence</span>
            </button>
            <button
              className={`archetype-tab ${activeTab === 'protective' ? 'active' : ''}`}
              onClick={() => switchTab('protective')}
            >
              <span className="tab-icon">🛡️</span>
              <span>Protective</span>
            </button>
          </div>
        </section>

        {/* ========== ESSENCE CONTENT ========== */}
        {activeTab === 'essence' && (
          <>
            {/* Your Essence (poetic_line) */}
            <section className="essence-section essence-editable-section">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">✨</span>
                  <span className="section-label">Your Essence</span>
                </div>
              </div>
              <div className="quote essence-quote">
                <div className="quote-mark">"</div>
                {essenceValue}
              </div>
              <div className="section-footer-row">
                {essenceCustomized && <span className="customized-badge">Customized</span>}
                <button
                  className="section-edit-btn"
                  onClick={() => setEditingField('essence')}
                  aria-label="Edit essence"
                >
                  Edit
                </button>
              </div>
            </section>

            {/* Your Superpower */}
            <section className="essence-section essence-editable-section bg-purple-soft">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">⚡</span>
                  <span className="section-label">Your Superpower</span>
                </div>
              </div>
              <p className="section-text">{superpowerValue}</p>
              <div className="section-footer-row">
                {superpowerCustomized && <span className="customized-badge">Customized</span>}
                <button
                  className="section-edit-btn"
                  onClick={() => setEditingField('superpower')}
                  aria-label="Edit superpower"
                >
                  Edit
                </button>
              </div>
            </section>

            {/* Your Vision */}
            <section className="essence-section essence-editable-section">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">🔮</span>
                  <span className="section-label">Your Vision</span>
                </div>
              </div>
              <p className="section-text">{visionValue}</p>
              <div className="section-footer-row">
                {visionCustomized && <span className="customized-badge">Customized</span>}
                <button
                  className="section-edit-btn"
                  onClick={() => setEditingField('vision')}
                  aria-label="Edit vision"
                >
                  Edit
                </button>
              </div>
            </section>

            {/* Your North Star */}
            <section className="essence-section essence-editable-section bg-gold-soft">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">🌟</span>
                  <span className="section-label">Your North Star</span>
                </div>
              </div>
              <p className="section-text">{northStarValue}</p>
              <div className="section-footer-row">
                {northStarCustomized && <span className="customized-badge">Customized</span>}
                <button
                  className="section-edit-btn"
                  onClick={() => setEditingField('north_star')}
                  aria-label="Edit north star"
                >
                  Edit
                </button>
              </div>
            </section>

            {/* Your Origin */}
            <section className="essence-section essence-origin-section">
              <h3 className="origin-title">Your Origin</h3>
              <div className="origin-cards">
                <div className="origin-card">
                  <div className="origin-card-header">
                    <span className="origin-icon">🧒</span>
                  </div>
                  <div className="origin-label-row">
                    <span className="origin-label">Inner Child Desire</span>
                  </div>
                  <p>{innerChildValue}</p>
                  <div className="section-footer-row">
                    {innerChildCustomized && <span className="customized-badge-small">Customized</span>}
                    <button
                      className="origin-edit-btn"
                      onClick={() => setEditingField('inner_child')}
                      aria-label="Edit inner child desire"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <div className="origin-card wound-card">
                  <div className="origin-card-header">
                    <span className="origin-icon">🩹</span>
                  </div>
                  <div className="origin-label-row">
                    <span className="origin-label">Essence Wound</span>
                  </div>
                  <p>{woundValue}</p>
                  <div className="section-footer-row">
                    {woundCustomized && <span className="customized-badge-small">Customized</span>}
                    <button
                      className="origin-edit-btn wound-edit-btn"
                      onClick={() => setEditingField('wound')}
                      aria-label="Edit essence wound"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Heroes Like You */}
            <section className="essence-section essence-characters-section">
              <div className="characters-header">
                <div className="characters-title-row">
                  <h3 className="characters-title">Heroes Like You</h3>
                </div>
              </div>
              <div className="characters-list">
                {(Array.isArray(charactersValue) ? charactersValue : (charactersValue || '').split(',').map(s => s.trim()).filter(Boolean)).map((character, index) => (
                  <div key={index} className="character-chip">
                    <span className="character-icon">✨</span>
                    <span>{character}</span>
                  </div>
                ))}
              </div>
              <div className="section-footer-row">
                {charactersCustomized && <span className="customized-badge-small">Customized</span>}
                <button
                  className="section-edit-btn"
                  onClick={() => setEditingField('characters')}
                  aria-label="Edit heroes"
                >
                  Edit
                </button>
              </div>
            </section>

            {/* Deeper Insights (Collapsible) */}
            <section className="essence-section essence-deeper-section">
              <button
                className="deeper-toggle"
                onClick={() => setDeeperInsightsOpen(!deeperInsightsOpen)}
                aria-expanded={deeperInsightsOpen}
              >
                <span>Deeper Insights</span>
                <span className={`deeper-chevron ${deeperInsightsOpen ? 'rotated' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {deeperInsightsOpen && (
                <div className="deeper-content">
                  <div className="deeper-item">
                    <div className="deeper-item-header">
                      <div className="deeper-item-icon">⚡</div>
                    </div>
                    <div className="deeper-label-row">
                      <div className="deeper-item-label">Energetic Transmission</div>
                    </div>
                    <p>{energeticValue}</p>
                    <div className="section-footer-row">
                      {energeticCustomized && <span className="customized-badge-small">Customized</span>}
                      <button
                        className="deeper-edit-btn"
                        onClick={() => setEditingField('energetic_transmission')}
                        aria-label="Edit energetic transmission"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="deeper-item">
                    <div className="deeper-item-header">
                      <div className="deeper-item-icon">🎯</div>
                    </div>
                    <div className="deeper-label-row">
                      <div className="deeper-item-label">Recognition Pattern</div>
                    </div>
                    <p>{recognitionValue}</p>
                    <div className="section-footer-row">
                      {recognitionCustomized && <span className="customized-badge-small">Customized</span>}
                      <button
                        className="deeper-edit-btn"
                        onClick={() => setEditingField('recognition_pattern')}
                        aria-label="Edit recognition pattern"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="deeper-item">
                    <div className="deeper-item-header">
                      <div className="deeper-item-icon">🚀</div>
                    </div>
                    <div className="deeper-label-row">
                      <div className="deeper-item-label">Vision in Action</div>
                    </div>
                    <p>{visionInActionValue}</p>
                    <div className="section-footer-row">
                      {visionInActionCustomized && <span className="customized-badge-small">Customized</span>}
                      <button
                        className="deeper-edit-btn"
                        onClick={() => setEditingField('vision_in_action')}
                        aria-label="Edit vision in action"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* ========== PROTECTIVE CONTENT ========== */}
        {activeTab === 'protective' && protectiveArchetype && (
          <div className="protective-content">
            {/* Core Narrative */}
            <section className="essence-section essence-editable-section">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">🎭</span>
                  <span className="section-label">Core Narrative</span>
                </div>
              </div>
              <div className="quote essence-quote">
                <div className="quote-mark">"</div>
                {protectiveArchetype.coreNarrative?.belief}
              </div>
            </section>

            {/* The Fear */}
            <section className="essence-section essence-editable-section bg-purple-soft">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">😰</span>
                  <span className="section-label">The Fear</span>
                </div>
              </div>
              <p className="section-text">{protectiveArchetype.emotionalWound?.fear}</p>
            </section>

            {/* What You Learned */}
            <section className="essence-section essence-editable-section">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">📖</span>
                  <span className="section-label">What You Learned</span>
                </div>
              </div>
              <p className="section-text">{protectiveArchetype.emotionalWound?.learned}</p>
            </section>

            {/* Behavioral Strategy */}
            <section className="essence-section essence-editable-section bg-purple-soft">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">🎯</span>
                  <span className="section-label">Behavioral Strategy</span>
                </div>
              </div>
              <p className="section-text">{protectiveArchetype.behavioralStrategy?.description}</p>
            </section>

            {/* Avoidance Pattern */}
            <section className="essence-section essence-editable-section">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">🚫</span>
                  <span className="section-label">Avoidance Pattern</span>
                </div>
              </div>
              <p className="section-text">{protectiveArchetype.avoidancePattern?.description}</p>
            </section>

            {/* Nervous System Pattern */}
            <section className="essence-section essence-editable-section bg-purple-soft">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">⚡</span>
                  <span className="section-label">Nervous System Pattern</span>
                </div>
              </div>
              <p className="section-text">
                <strong>{protectiveArchetype.nervousSystemPattern?.pattern}</strong>
                {' — '}
                {protectiveArchetype.nervousSystemPattern?.description}
              </p>
            </section>

            {/* Somatic Expression */}
            <section className="essence-section essence-editable-section">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">🧘</span>
                  <span className="section-label">Somatic Expression</span>
                </div>
              </div>
              <p className="section-text">{protectiveArchetype.somaticExpression?.description}</p>
            </section>

            {/* Splinter Moment */}
            <section className="essence-section essence-editable-section bg-purple-soft">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">💔</span>
                  <span className="section-label">Splinter Moment Type</span>
                </div>
              </div>
              <p className="section-text">{protectiveArchetype.splinterMomentType?.description}</p>
            </section>

            {/* Discharge Pattern */}
            <section className="essence-section essence-editable-section">
              <div className="section-header">
                <div className="section-label-row">
                  <span className="section-icon-small">🌊</span>
                  <span className="section-label">Discharge Pattern Needed</span>
                </div>
              </div>
              <p className="section-text">{protectiveArchetype.dischargePatternNeeded?.description}</p>
            </section>

            {/* Rewiring Affirmations */}
            {protectiveArchetype.rewiringOpportunity?.affirmations?.length > 0 && (
              <section className="essence-section essence-editable-section bg-gold-soft">
                <div className="section-header">
                  <div className="section-label-row">
                    <span className="section-icon-small">💛</span>
                    <span className="section-label">Rewiring Affirmations</span>
                  </div>
                </div>
                <div className="affirmations-list">
                  {protectiveArchetype.rewiringOpportunity.affirmations.map((affirmation, index) => (
                    <div key={index} className="quote essence-quote" style={{ marginBottom: index < protectiveArchetype.rewiringOpportunity.affirmations.length - 1 ? '1rem' : 0 }}>
                      <div className="quote-mark">"</div>
                      {affirmation}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* How It Shows Up + Breaking Free */}
            {protectiveArchetype.detailed && (
              <section className="essence-section essence-deeper-section">
                <h3 className="origin-title">Understanding & Healing</h3>
                <div className="deeper-content" style={{ marginTop: 0 }}>
                  <div className="deeper-item">
                    <div className="deeper-item-header">
                      <div className="deeper-item-icon">👁️</div>
                    </div>
                    <div className="deeper-label-row">
                      <div className="deeper-item-label">How It Shows Up</div>
                    </div>
                    <p>{protectiveArchetype.detailed.howItShowsUp}</p>
                  </div>

                  <div className="deeper-item" style={{ background: 'linear-gradient(135deg, rgba(255, 221, 39, 0.08) 0%, rgba(255, 193, 7, 0.04) 100%)' }}>
                    <div className="deeper-item-header">
                      <div className="deeper-item-icon">🦋</div>
                    </div>
                    <div className="deeper-label-row">
                      <div className="deeper-item-label">Breaking Free</div>
                    </div>
                    <p>{protectiveArchetype.detailed.breakingFree}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'protective' && !protectiveArchetype && (
          <section className="essence-section">
            <div className="no-shadow-message">
              <p>No protective archetype assigned yet.</p>
              <p>Complete the assessment to discover your protective pattern.</p>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="essence-section essence-cta-section">
          {activeTab === 'essence' ? (
            <>
              <div className="cta-icon">🔮</div>
              <div className="cta-label">POETIC VISION</div>
              <h2 className="cta-title">Your Future Awaits</h2>
              <p className="cta-description">
                What if your joy was the funnel? What if your weirdness was the strategy?
                You weren't born to fit into boxes — you were born to make confetti out of them.
              </p>
            </>
          ) : (
            <>
              <div className="cta-icon">🦋</div>
              <div className="cta-label">YOUR INVITATION</div>
              <h2 className="cta-title">Step Into Your Essence</h2>
              <p className="cta-description">
                {protectiveArchetype?.detailed?.breakingFree ||
                  "Showing up is brave. Your presence matters, even when it feels risky."}
              </p>
            </>
          )}
          <button
            className="essence-cta-button"
            onClick={() => navigate('/7-day-challenge')}
          >
            {activeTab === 'essence'
              ? (hasChallenge ? 'Continue Your 7-Day Challenge' : 'Start Your 7-Day Challenge')
              : 'Explore Your Essence Voice'
            }
          </button>
        </section>
      </div>

      {/* Avatar Edit Modal */}
      {showAvatarModal && (
        <EditEssenceModal
          userId={user?.id}
          userEmail={user?.email}
          currentName={archetypeName}
          originalName={originalName}
          currentImage={imagePath}
          originalImage={getEssenceImagePath({ essence_archetype: originalName })}
          currentTagline={taglineValue}
          originalTagline={archetypeData.essence || ''}
          group={archetypeData.group}
          superpower={archetypeData.superpower}
          poeticLine={archetypeData.poetic_line}
          onClose={() => setShowAvatarModal(false)}
          onSaved={handleAvatarSaved}
        />
      )}

      {/* Field Edit Modal (Essence fields only) */}
      {editingField && (
        <EditEssenceFieldModal
          field={editingField}
          currentValue={
            editingField === 'tagline' ? taglineValue :
            editingField === 'essence' ? essenceValue :
            editingField === 'superpower' ? superpowerValue :
            editingField === 'vision' ? visionValue :
            editingField === 'north_star' ? northStarValue :
            editingField === 'inner_child' ? innerChildValue :
            editingField === 'wound' ? woundValue :
            editingField === 'characters' ? charactersValue :
            editingField === 'energetic_transmission' ? energeticValue :
            editingField === 'recognition_pattern' ? recognitionValue :
            editingField === 'vision_in_action' ? visionInActionValue :
            ''
          }
          currentMeta={getEssenceFieldMeta(userData, editingField)}
          archetypes={allArchetypes}
          userArchetype={originalName}
          userId={user?.id}
          userEmail={user?.email}
          onClose={() => setEditingField(null)}
          onSaved={handleFieldSaved}
        />
      )}
    </div>
  )
}

export default EssenceProfile
