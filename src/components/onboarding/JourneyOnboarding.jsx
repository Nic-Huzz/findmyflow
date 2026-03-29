/**
 * JourneyOnboarding.jsx
 *
 * 4-Beat story-driven onboarding flow:
 *   Beat 1 — The Hook (swipeable emotional slides, no interaction)
 *   Beat 2 — The Story (4 wound stages, tap which scene resonates)
 *   Beat 3 — The Reveal (photo upload + hero avatar generation)
 *   Beat 4 — The Promise (sign up CTA)
 *
 * Works BEFORE account creation. State stored in component,
 * persisted to localStorage, saved to DB after sign-up.
 *
 * Created: Mar 2026
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './JourneyOnboarding.css'

// ─── Image compression for localStorage storage ─────────────────────────────

function compressImage(file, maxWidth = 512, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = URL.createObjectURL(file)
  })
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'journey_onboarding_state'

const BEATS = {
  HOOK: 'hook',
  STORY: 'story',
  REVEAL: 'reveal',
  PROMISE: 'promise',
}

// Beat 1: Hook slides
const HOOK_SLIDES = [
  {
    id: 'childhood',
    text: 'Take a moment to think about you as a kid.',
    subtext: 'How playful you were. How full of love. How care-free.',
  },
  {
    id: 'remember',
    text: 'Remember that?',
    subtext: null,
  },
  {
    id: 'question',
    text: 'So where did they go?',
    subtext: null,
  },
]

// Beat 2: The 4 wound stages
const WOUND_STAGES = [
  {
    id: 'stage1',
    title: 'You Arrive',
    subtitle: 'Infancy',
    yAxis: 'Attunement received',
    xAxis: 'Safety present',
    scenes: [
      {
        id: 'overwhelmed_child',
        zone: 'top_left',
        name: 'The Overwhelmed Child',
        description: 'Seen but never settled. Chaotic but present caregiver.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '🌊',
      },
      {
        id: 'secure_base',
        zone: 'diagonal',
        name: 'Secure Base',
        description: 'Attuned and safe. Could explore and be met.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '🏠',
      },
      {
        id: 'invisible_child',
        zone: 'bottom_right',
        name: 'The Invisible Child',
        description: 'Physically safe but unseen. Needs met, self not witnessed.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '👻',
      },
    ],
  },
  {
    id: 'stage2',
    title: 'You Learn What Works',
    subtitle: 'Childhood',
    yAxis: 'Authentic expression',
    xAxis: 'Love received',
    scenes: [
      {
        id: 'rejected_self',
        zone: 'top_left',
        name: 'The Rejected Self',
        description: 'Full expression, love withdrawn. Being yourself costs connection.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '💔',
      },
      {
        id: 'unconditional_belonging',
        zone: 'diagonal',
        name: 'Unconditional Belonging',
        description: 'Authentic expression met with love. No editing required.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '💛',
      },
      {
        id: 'adapted_self',
        zone: 'bottom_right',
        name: 'The Adapted Self',
        description: 'Love present but only for the edited version. Suppress self to stay connected.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '🎭',
      },
    ],
  },
  {
    id: 'stage3',
    title: 'School Installs the OS',
    subtitle: 'Adolescence',
    yAxis: 'Conformity required',
    xAxis: 'Authentic self suppressed',
    scenes: [
      {
        id: 'the_rebel',
        zone: 'top_left',
        name: 'The Rebel',
        description: 'Fights back. Authentic self survives at social cost. Labelled difficult.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '🔥',
      },
      {
        id: 'grounded_student',
        zone: 'diagonal',
        name: 'The Grounded Student',
        description: 'Navigates without disappearing. Rare.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '🌿',
      },
      {
        id: 'good_student',
        zone: 'bottom_right',
        name: 'The Good Student',
        description: 'Conforms completely, gets praised, loses themselves gradually.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '📚',
      },
    ],
  },
  {
    id: 'stage3_5',
    title: 'Your Friend Group Decides',
    subtitle: 'Teens',
    yAxis: 'Social belonging',
    xAxis: 'Authentic self maintained',
    scenes: [
      {
        id: 'the_chameleon',
        zone: 'top_left',
        name: 'The Chameleon',
        description: 'High belonging, low authentic self. Absorbed group identity. Popular but lost.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '🦎',
      },
      {
        id: 'found_their_tribe',
        zone: 'diagonal',
        name: 'Found Their Tribe',
        description: 'Belonging and authentic self move together. Group accepted who they were.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '🤝',
      },
      {
        id: 'the_withdrawn',
        zone: 'bottom_right',
        name: 'The Withdrawn',
        description: 'Low belonging, high authentic self. Retreated entirely. Authentic but isolated.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '🏔️',
      },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

function JourneyOnboarding({ onComplete, onSignUp }) {
  // Beat state
  const [currentBeat, setCurrentBeat] = useState(BEATS.HOOK)

  // Beat 1: Hook
  const [hookSlideIndex, setHookSlideIndex] = useState(0)

  // Beat 2: Story
  const [storyStageIndex, setStoryStageIndex] = useState(0)
  const [stageSelections, setStageSelections] = useState({})
  // { stage1: 'overwhelmed_child', stage2: 'adapted_self', ... }

  // Beat 3: Reveal
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)

  // Transition animation
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [slideDirection, setSlideDirection] = useState('right') // 'left' or 'right'

  // Touch handling for swipe
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const fileInputRef = useRef(null)
  const autoAdvanceRef = useRef(null)

  // Clear entering state after animation
  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isEntering, currentBeat, hookSlideIndex, storyStageIndex])

  // Hide bottom toolbar during onboarding
  useEffect(() => {
    document.body.classList.add('onboarding-active')
    return () => document.body.classList.remove('onboarding-active')
  }, [])

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          if (parsed.currentBeat) setCurrentBeat(parsed.currentBeat)
          if (parsed.hookSlideIndex !== undefined) setHookSlideIndex(parsed.hookSlideIndex)
          if (parsed.storyStageIndex !== undefined) setStoryStageIndex(parsed.storyStageIndex)
          if (parsed.stageSelections) setStageSelections(parsed.stageSelections)
          if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      console.error('Error loading saved onboarding progress:', err)
    }
  }, [])

  // Save progress on state change
  useEffect(() => {
    const state = {
      currentBeat,
      hookSlideIndex,
      storyStageIndex,
      stageSelections,
      avatarUrl,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [currentBeat, hookSlideIndex, storyStageIndex, stageSelections, avatarUrl])

  // ─── Navigation helpers ──────────────────────────────────────────────────

  const transitionTo = useCallback((setter, value, direction = 'right') => {
    if (isTransitioning) return
    setSlideDirection(direction)
    setIsTransitioning(true)
    setTimeout(() => {
      setter(value)
      setIsTransitioning(false)
      setIsEntering(true)
    }, 250)
  }, [isTransitioning])

  // ─── Touch/swipe handlers ────────────────────────────────────────────────

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (currentBeat === BEATS.HOOK) {
      if (diff > threshold && hookSlideIndex < HOOK_SLIDES.length - 1) {
        transitionTo(setHookSlideIndex, hookSlideIndex + 1, 'right')
      } else if (diff < -threshold && hookSlideIndex > 0) {
        transitionTo(setHookSlideIndex, hookSlideIndex - 1, 'left')
      } else if (diff > threshold && hookSlideIndex === HOOK_SLIDES.length - 1) {
        // Swipe forward on last hook slide → go to story
        transitionTo(setCurrentBeat, BEATS.STORY, 'right')
      }
    }
  }

  // ─── Beat 1: Hook ────────────────────────────────────────────────────────

  const handleHookNext = () => {
    if (hookSlideIndex < HOOK_SLIDES.length - 1) {
      transitionTo(setHookSlideIndex, hookSlideIndex + 1, 'right')
    } else {
      transitionTo(setCurrentBeat, BEATS.STORY, 'right')
    }
  }

  // ─── Beat 2: Story ──────────────────────────────────────────────────────

  const handleSceneSelect = (stageId, sceneId) => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)

    const newSelections = { ...stageSelections, [stageId]: sceneId }
    setStageSelections(newSelections)

    // Auto-advance to next stage after brief pause
    autoAdvanceRef.current = setTimeout(() => {
      if (storyStageIndex < WOUND_STAGES.length - 1) {
        transitionTo(setStoryStageIndex, storyStageIndex + 1, 'right')
      } else {
        // All stages done → go to reveal
        transitionTo(setCurrentBeat, BEATS.REVEAL, 'right')
      }
      autoAdvanceRef.current = null
    }, 600)
  }

  const handleStoryBack = () => {
    if (storyStageIndex > 0) {
      transitionTo(setStoryStageIndex, storyStageIndex - 1, 'left')
    } else {
      transitionTo(setCurrentBeat, BEATS.HOOK, 'left')
      setHookSlideIndex(HOOK_SLIDES.length - 1)
    }
  }

  // ─── Beat 3: Reveal ─────────────────────────────────────────────────────

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoFile(file)
    setGenerateError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleGenerateAvatar = async () => {
    if (!photoFile) return

    setIsGenerating(true)
    setGenerateError(null)

    try {
      // Check if user has an active auth session
      const { data: sessionData } = await supabase.auth.getSession()
      const hasAuth = !!sessionData?.session

      if (!hasAuth) {
        // Pre-auth: compress and store photo in localStorage for post-auth generation
        const compressed = await compressImage(photoFile)
        localStorage.setItem('journey_onboarding_photo', compressed)
        setAvatarUrl(null)
        transitionTo(setCurrentBeat, BEATS.PROMISE, 'right')
        return
      }

      // Authenticated: upload and generate avatar
      const timestamp = Date.now()
      const tempPath = `temp/onboarding-${timestamp}.jpg`

      const { error: uploadErr } = await supabase.storage
        .from('deal-screenshots')
        .upload(tempPath, photoFile, {
          contentType: photoFile.type,
          upsert: true,
        })

      if (uploadErr) {
        throw new Error(uploadErr.message || 'Failed to upload photo')
      }

      const { data: urlData } = supabase.storage
        .from('deal-screenshots')
        .getPublicUrl(tempPath)

      // Call the generate-avatar edge function
      const { data, error } = await supabase.functions.invoke('generate-avatar', {
        body: {
          selfie_url: urlData.publicUrl,
          prompt: `Create a Pixar/Disney-style animated hero avatar of this person.
            Make them look vibrant, playful, and full of life, like the best version
            of themselves. Warm lighting, confident posture, a genuine smile that
            shows their inner light. The background should be a soft golden glow.
            This represents who they were before the world told them who to be.`,
        },
      })

      if (error) {
        throw new Error(error.message || 'Failed to generate avatar')
      }

      if (data?.error === 'content_policy') {
        setGenerateError("Generation couldn't complete. Try a different photo or adjust your lighting.")
        return
      }

      if (data?.url) {
        setAvatarUrl(data.url)
      } else {
        throw new Error('No image returned from generation')
      }
    } catch (err) {
      console.error('Avatar generation error:', err)
      setGenerateError('Something went wrong. You can skip this and add a photo later.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSkipPhoto = () => {
    transitionTo(setCurrentBeat, BEATS.PROMISE, 'right')
  }

  const handleRevealContinue = () => {
    transitionTo(setCurrentBeat, BEATS.PROMISE, 'right')
  }

  // ─── Beat 4: Promise ─────────────────────────────────────────────────────

  const handleSignUp = () => {
    // Save all onboarding data to localStorage for post-auth persistence
    const onboardingData = {
      stageSelections,
      avatarUrl,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem('journey_onboarding_result', JSON.stringify(onboardingData))

    // Clear progress key
    localStorage.removeItem(STORAGE_KEY)

    // Call sign-up handler (navigates to auth)
    if (onSignUp) {
      onSignUp(onboardingData)
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const transitionClass = `${isTransitioning ? 'jo-transitioning' : ''} ${isEntering ? 'jo-entering' : ''}`
  const directionClass = slideDirection === 'left' ? 'jo-slide-left' : 'jo-slide-right'

  // Progress indicator for all beats
  const renderBeatProgress = () => {
    const beatOrder = [BEATS.HOOK, BEATS.STORY, BEATS.REVEAL, BEATS.PROMISE]
    const currentIndex = beatOrder.indexOf(currentBeat)

    return (
      <div className="jo-beat-progress">
        {beatOrder.map((beat, i) => (
          <span
            key={beat}
            className={`jo-beat-dot ${i === currentIndex ? 'active' : i < currentIndex ? 'completed' : ''}`}
          />
        ))}
      </div>
    )
  }

  // ─── BEAT 1: The Hook ─────────────────────────────────────────────────────

  if (currentBeat === BEATS.HOOK) {
    const slide = HOOK_SLIDES[hookSlideIndex]
    const isLastSlide = hookSlideIndex === HOOK_SLIDES.length - 1

    return (
      <div
        className={`journey-onboarding jo-hook ${transitionClass} ${directionClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Ambient background */}
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>

        <div className="jo-hook-content">
          <div className="jo-hook-text-container">
            <h1 className="jo-hook-text" key={slide.id}>
              {slide.text}
            </h1>
            {slide.subtext && (
              <p className="jo-hook-subtext">{slide.subtext}</p>
            )}
          </div>
        </div>

        {/* Slide dots */}
        <div className="jo-slide-dots">
          {HOOK_SLIDES.map((_, i) => (
            <span
              key={i}
              className={`jo-slide-dot ${i === hookSlideIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Tap to continue */}
        <button
          className="jo-hook-continue"
          onClick={handleHookNext}
        >
          {isLastSlide ? (
            <>
              <span className="jo-shimmer-layer" />
              Let's find out
              <span className="jo-btn-arrow">&#8594;</span>
            </>
          ) : (
            <span className="jo-tap-hint">Tap to continue</span>
          )}
        </button>
      </div>
    )
  }

  // ─── BEAT 2: The Story ────────────────────────────────────────────────────

  if (currentBeat === BEATS.STORY) {
    const stage = WOUND_STAGES[storyStageIndex]
    const selectedScene = stageSelections[stage.id]

    return (
      <div className={`journey-onboarding jo-story ${transitionClass} ${directionClass}`}>
        {renderBeatProgress()}

        {/* Stage progress */}
        <div className="jo-stage-progress">
          {WOUND_STAGES.map((s, i) => (
            <span
              key={s.id}
              className={`jo-stage-dot ${i === storyStageIndex ? 'active' : i < storyStageIndex ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="jo-story-content">
          <div className="jo-stage-header">
            <span className="jo-stage-label">{stage.subtitle}</span>
            <h2 className="jo-stage-title">{stage.title}</h2>
            <p className="jo-stage-prompt">Which feels most like your experience?</p>
          </div>

          <div className="jo-scenes">
            {stage.scenes.map((scene, sceneIndex) => (
              <button
                key={scene.id}
                className={`jo-scene-card ${selectedScene === scene.id ? 'selected' : ''}`}
                onClick={() => handleSceneSelect(stage.id, scene.id)}
                style={{ animationDelay: `${0.1 + sceneIndex * 0.1}s` }}
              >
                <div
                  className="jo-scene-image"
                  style={{ backgroundColor: `${scene.color}22` }}
                >
                  <span className="jo-scene-icon">{scene.icon}</span>
                </div>
                <div className="jo-scene-info">
                  <h3 className="jo-scene-name">{scene.name}</h3>
                  <p className="jo-scene-desc">{scene.description}</p>
                </div>
                {selectedScene === scene.id && (
                  <div className="jo-scene-check">&#10003;</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Back button */}
        <button className="jo-back-btn" onClick={handleStoryBack}>
          &#8592; Back
        </button>
      </div>
    )
  }

  // ─── BEAT 3: The Reveal ───────────────────────────────────────────────────

  if (currentBeat === BEATS.REVEAL) {
    return (
      <div className={`journey-onboarding jo-reveal ${transitionClass} ${directionClass}`}>
        {renderBeatProgress()}

        <div className="jo-reveal-content">
          {!avatarUrl ? (
            <>
              <h2 className="jo-reveal-heading">
                Ready to meet the loving, care-free, playful version of you again?
              </h2>
              <p className="jo-reveal-subtext">
                Upload a photo and we'll create your hero avatar.
              </p>

              {/* Photo upload area */}
              <div
                className="jo-photo-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Your photo"
                    className="jo-photo-preview"
                  />
                ) : (
                  <div className="jo-photo-placeholder">
                    <span className="jo-photo-icon">📸</span>
                    <span className="jo-photo-label">Tap to upload a photo</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="jo-file-input"
                />
              </div>

              {generateError && (
                <p className="jo-error">{generateError}</p>
              )}

              {photoPreview && !isGenerating && (
                <button
                  className="jo-cta-button"
                  onClick={handleGenerateAvatar}
                >
                  <span className="jo-shimmer-layer" />
                  Create My Hero Avatar
                  <span className="jo-btn-arrow">&#8594;</span>
                </button>
              )}

              {isGenerating && (
                <div className="jo-generating">
                  <div className="jo-spinner" />
                  <p>Creating your hero avatar...</p>
                  <p className="jo-generating-sub">This may take a moment</p>
                </div>
              )}

              <button
                className="jo-skip-link"
                onClick={handleSkipPhoto}
              >
                Skip for now
              </button>
            </>
          ) : (
            <>
              {/* Avatar generated — show the reveal */}
              <div className="jo-avatar-reveal">
                <div className="jo-avatar-glow" />
                <img
                  src={avatarUrl}
                  alt="Your hero avatar"
                  className="jo-avatar-image"
                />
              </div>

              <h2 className="jo-reveal-result-heading">
                This is who's been waiting.
              </h2>
              <p className="jo-reveal-result-sub">
                The playful, loving, care-free version of you. Before the world
                told you who to be.
              </p>

              <button
                className="jo-cta-button"
                onClick={handleRevealContinue}
              >
                <span className="jo-shimmer-layer" />
                Continue
                <span className="jo-btn-arrow">&#8594;</span>
              </button>
            </>
          )}
        </div>

        {/* Back to story */}
        {!avatarUrl && !isGenerating && (
          <button
            className="jo-back-btn"
            onClick={() => {
              transitionTo(setCurrentBeat, BEATS.STORY, 'left')
              setStoryStageIndex(WOUND_STAGES.length - 1)
            }}
          >
            &#8592; Back
          </button>
        )}
      </div>
    )
  }

  // ─── BEAT 4: The Promise ──────────────────────────────────────────────────

  if (currentBeat === BEATS.PROMISE) {
    return (
      <div className={`journey-onboarding jo-promise ${transitionClass} ${directionClass}`}>
        {/* Ambient background */}
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>

        <div className="jo-promise-content">
          {avatarUrl && (
            <div className="jo-promise-avatar">
              <img src={avatarUrl} alt="Your hero" className="jo-promise-avatar-img" />
            </div>
          )}

          <h1 className="jo-promise-heading">
            Ready to become them again?
          </h1>

          <p className="jo-promise-subtext">
            Your journey back to your authentic self starts here.
          </p>

          <button
            className="jo-cta-button jo-cta-large"
            onClick={handleSignUp}
          >
            <span className="jo-shimmer-layer" />
            Start My Journey
            <span className="jo-btn-arrow">&#8594;</span>
          </button>
        </div>

        {/* Back */}
        <button
          className="jo-back-btn"
          onClick={() => transitionTo(setCurrentBeat, BEATS.REVEAL, 'left')}
        >
          &#8592; Back
        </button>
      </div>
    )
  }

  return null
}

export default JourneyOnboarding
