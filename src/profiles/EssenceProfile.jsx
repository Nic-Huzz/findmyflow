import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { essenceProfiles } from '../data/essenceProfiles'
import { hasActiveChallenge } from '../lib/questCompletion'
import {
  getEssenceDisplayName,
  getEssenceImagePath,
  getEssenceFieldValue,
  getEssenceFieldMeta
} from '../lib/essencePreferences'
import EditEssenceModal from '../components/HeroProfile/EditEssenceModal'
import EditEssenceFieldModal from '../components/EditEssenceFieldModal'
import './EssenceProfile.css'

const EDIT_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const EssenceProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasChallenge, setHasChallenge] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Modal states
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [editingField, setEditingField] = useState(null)

  // Scroll-snap tracking
  const slidesRef = useRef(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visited, setVisited] = useState(new Set([0]))
  const totalSlides = 11

  // Redirect /archetypes/protective to /archetypes/essence
  useEffect(() => {
    if (location.pathname.includes('/protective')) {
      navigate('/archetypes/essence', { replace: true })
    }
  }, [location.pathname, navigate])

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
      if (data && data.length > 0) setUserData(data[0])
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

  // IntersectionObserver for scroll-snap tracking
  useEffect(() => {
    const container = slidesRef.current
    if (!container) return

    const slides = container.querySelectorAll('.ep-slide')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const index = parseInt(entry.target.dataset.index)
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          entry.target.classList.add('in-view')
          setCurrentSlide(index)
          setVisited(prev => new Set([...prev, index]))
        } else if (entry.intersectionRatio < 0.1) {
          entry.target.classList.remove('in-view')
        }
      })
    }, { root: container, threshold: [0.1, 0.5] })

    slides.forEach(s => observer.observe(s))
    // Mark first slide as in-view
    if (slides[0]) slides[0].classList.add('in-view')

    // Hide scroll hint on first scroll
    const onScroll = () => {
      const hint = container.querySelector('.ep-scroll-hint')
      if (hint && container.scrollTop > 50) {
        hint.style.opacity = '0'
      }
    }
    container.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      container.removeEventListener('scroll', onScroll)
    }
  }, [loading])

  const scrollToSlide = useCallback((index) => {
    const container = slidesRef.current
    if (!container) return
    const slide = container.querySelectorAll('.ep-slide')[index]
    if (slide) slide.scrollIntoView({ behavior: 'smooth' })
  }, [])

  if (loading) {
    return (
      <div className="essence-profile-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  // Guard: no essence mirror completed
  if (!userData) {
    return (
      <div className="essence-profile-container">
        <div className="ep-top-bar">
          <button className="ep-top-back" onClick={() => navigate('/profile-hub')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="ep-top-label">Essence</div>
          <div className="ep-top-spacer" />
        </div>
        <div className="ep-slide" style={{ height: '100vh', position: 'relative' }}>
          <div className="ep-slide-inner" style={{ opacity: 1, transform: 'none' }}>
            <div className="ep-insight-icon" style={{ fontSize: 48 }}>&#10024;</div>
            <div className="ep-cover-name" style={{ fontSize: 28 }}>Discover Your Essence</div>
            <div className="ep-text" style={{ marginBottom: 32 }}>
              Complete the Essence Mirror to unlock your archetype profile, strengths, and deeper insights.
            </div>
            <button className="ep-cta-button" onClick={() => navigate('/essence-mirror')}>
              Start Essence Mirror
            </button>
          </div>
        </div>
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

  // Get field values
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

  const imagePath = getEssenceImagePath(userData)
  const progress = (currentSlide / (totalSlides - 1)) * 100

  const editBtn = (field) => (
    <button className="ep-edit-btn" onClick={() => setEditingField(field)}>
      {EDIT_ICON}
      Personalise
    </button>
  )

  // Get the current field value for the edit modal
  const getFieldValue = (field) => {
    const map = {
      tagline: taglineValue, essence: essenceValue, superpower: superpowerValue,
      vision: visionValue, north_star: northStarValue, inner_child: innerChildValue,
      wound: woundValue, characters: charactersValue,
      energetic_transmission: energeticValue, recognition_pattern: recognitionValue,
      vision_in_action: visionInActionValue,
    }
    return map[field] || ''
  }

  return (
    <div className="essence-profile-container">
      {/* Progress line */}
      <div className="ep-progress-line" style={{ width: `${progress}%` }} />

      {/* Ambient glows */}
      <div className="ep-glow ep-glow-purple" />
      <div className="ep-glow ep-glow-gold" />

      {/* Top bar */}
      <div className="ep-top-bar">
        <button className="ep-top-back" onClick={() => navigate('/profile-hub')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="ep-top-label">Essence</div>
        <div className="ep-top-spacer" />
      </div>

      {/* Side dots */}
      <div className="ep-side-dots">
        {Array.from({ length: totalSlides }, (_, i) => (
          <button
            key={i}
            className={`ep-side-dot${i === currentSlide ? ' active' : visited.has(i) ? ' visited' : ''}`}
            onClick={() => scrollToSlide(i)}
          />
        ))}
      </div>

      {/* Slides */}
      <div className="ep-slides" ref={slidesRef}>

        {/* 0: Cover */}
        <div className="ep-slide ep-slide-cover" data-index="0">
          <div className="ep-slide-inner">
            <div className="ep-cover-avatar-ring">
              {!imageError && imagePath ? (
                <img
                  src={imagePath}
                  alt={archetypeName}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="ep-avatar-fallback">
                  {archetypeName?.charAt(0) || '?'}
                </div>
              )}
              <button onClick={() => setShowAvatarModal(true)} aria-label="Edit avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <div className="ep-cover-eyebrow">Your Essence</div>
            <div className="ep-cover-name">{archetypeName}</div>
            <div className="ep-cover-tagline">{taglineValue}</div>
            <div className="ep-cover-divider" />
          </div>
          <div className="ep-scroll-hint">
            <span>scroll to explore</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* 1: Essence */}
        <div className="ep-slide" data-index="1">
          <div className="ep-slide-inner">
            <div className="ep-insight-icon">&#10024;</div>
            <div className="ep-eyebrow">Your Essence</div>
            <div className="ep-quote">"{essenceValue}"</div>
            {editBtn('essence')}
          </div>
        </div>

        {/* 2: Superpower */}
        <div className="ep-slide" data-index="2">
          <div className="ep-slide-inner">
            <div className="ep-insight-icon">&#9889;</div>
            <div className="ep-eyebrow">Your Superpower</div>
            <div className="ep-text">{superpowerValue}</div>
            {editBtn('superpower')}
          </div>
        </div>

        {/* 3: Vision */}
        <div className="ep-slide" data-index="3">
          <div className="ep-slide-inner">
            <div className="ep-insight-icon">&#128302;</div>
            <div className="ep-eyebrow">Your Vision</div>
            <div className="ep-text">{visionValue}</div>
            {editBtn('vision')}
          </div>
        </div>

        {/* 4: North Star */}
        <div className="ep-slide" data-index="4">
          <div className="ep-slide-inner">
            <div className="ep-insight-icon">&#127775;</div>
            <div className="ep-eyebrow gold">Your North Star</div>
            <div className="ep-quote">"{northStarValue}"</div>
            {editBtn('north_star')}
          </div>
        </div>

        {/* 5: Origin */}
        <div className="ep-slide" data-index="5">
          <div className="ep-slide-inner">
            <div className="ep-eyebrow">Your Origin</div>
            <div style={{ height: 16 }} />
            <div className="ep-origin-container">
              <div className="ep-origin-card">
                <div className="ep-origin-card-icon">&#129490;</div>
                <div className="ep-origin-card-label">Inner Child Desire</div>
                <p>{innerChildValue}</p>
              </div>
              <div className="ep-origin-card wound">
                <div className="ep-origin-card-icon">&#129657;</div>
                <div className="ep-origin-card-label">Essence Wound</div>
                <p>{woundValue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 6: Heroes */}
        <div className="ep-slide" data-index="6">
          <div className="ep-slide-inner">
            <div className="ep-insight-icon">&#10024;</div>
            <div className="ep-eyebrow">Heroes Like You</div>
            <div className="ep-text-small" style={{ marginTop: 0, marginBottom: 20 }}>
              You share essence with those who refused to dim their light.
            </div>
            <div className="ep-heroes-grid">
              {(Array.isArray(charactersValue)
                ? charactersValue
                : (charactersValue || '').split(',').map(s => s.trim()).filter(Boolean)
              ).map((character, i) => (
                <div key={i} className="ep-hero-chip">{character}</div>
              ))}
            </div>
            {editBtn('characters')}
          </div>
        </div>

        {/* 7: Energetic Transmission */}
        <div className="ep-slide" data-index="7">
          <div className="ep-slide-inner">
            <div className="ep-deeper-card">
              <div className="ep-deeper-card-icon">&#9889;</div>
              <div className="ep-deeper-card-label">Energetic Transmission</div>
              <p>{energeticValue}</p>
            </div>
            {editBtn('energetic_transmission')}
          </div>
        </div>

        {/* 8: Recognition Pattern */}
        <div className="ep-slide" data-index="8">
          <div className="ep-slide-inner">
            <div className="ep-deeper-card">
              <div className="ep-deeper-card-icon">&#127919;</div>
              <div className="ep-deeper-card-label">Recognition Pattern</div>
              <p>{recognitionValue}</p>
            </div>
            {editBtn('recognition_pattern')}
          </div>
        </div>

        {/* 9: Vision in Action */}
        <div className="ep-slide" data-index="9">
          <div className="ep-slide-inner">
            <div className="ep-deeper-card">
              <div className="ep-deeper-card-icon">&#128640;</div>
              <div className="ep-deeper-card-label">Vision in Action</div>
              <p>{visionInActionValue}</p>
            </div>
            {editBtn('vision_in_action')}
          </div>
        </div>

        {/* 10: CTA */}
        <div className="ep-slide ep-slide-cta" data-index="10">
          <div className="ep-slide-inner">
            <div className="ep-cta-icon">&#128302;</div>
            <div className="ep-cta-eyebrow">Poetic Vision</div>
            <div className="ep-cta-title">Your Future Awaits</div>
            <div className="ep-cta-desc">
              What if your joy was the funnel? What if your weirdness was the strategy?
              You weren't born to fit into boxes. You were born to make confetti out of them.
            </div>
            <button
              className="ep-cta-button"
              onClick={() => navigate('/7-day-challenge')}
            >
              {hasChallenge ? 'Continue Your 7-Day Challenge' : 'Start Your 7-Day Challenge'}
            </button>
          </div>
        </div>
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
          poeticVision={archetypeData.poetic_vision}
          onClose={() => setShowAvatarModal(false)}
          onSaved={handleAvatarSaved}
        />
      )}

      {/* Field Edit Modal */}
      {editingField && (
        <EditEssenceFieldModal
          field={editingField}
          currentValue={getFieldValue(editingField)}
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
