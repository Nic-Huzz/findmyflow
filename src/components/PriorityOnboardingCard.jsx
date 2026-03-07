/**
 * PriorityOnboardingCard.jsx
 *
 * Guided onboarding card for the Priority tab.
 * Shows 8 sequential steps; users must complete all before
 * the weekly planner unlocks.
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  uploadEssenceAvatar,
  updateEssencePreferences,
  compressImage,
  buildAvatarPrompt,
} from '../lib/essencePreferences'
import { essenceProfiles } from '../data/essenceProfiles'
import { supabase } from '../lib/supabaseClient'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const ONBOARDING_STEPS = [
  {
    name: 'Create Your Character',
    desc: 'Every player needs an avatar. Upload your photo to bring your archetype to life.',
    route: null, // inline
  },
  {
    name: 'Mind Space',
    desc: 'Extract your skills, problems, and people from an AI conversation.',
    route: '/mind-space',
  },
  {
    name: 'What is Healing?',
    desc: 'Understand what healing really means and why emotional splinters keep us stuck.',
    route: '/what-is-healing-explainer',
  },
  {
    name: 'Healing Compass',
    desc: 'Identify the wound causing your protective voice to protect you.',
    route: '/healing-compass',
  },
  {
    name: 'Play-List Finder',
    desc: 'Discover your skills through play, role models, and what feels fun.',
    route: '/play-list-finder',
  },
  {
    name: 'Map Your Nervous System',
    desc: 'Identify how much your nervous system feels safe earning before it self-sabotages.',
    route: '/nervous-system',
  },
  {
    name: 'Check Alignment',
    desc: 'Confirm you feel aligned with your discovered skills, problems, and personas.',
    route: null, // inline
  },
  {
    name: 'Set Play-list Task',
    desc: 'Accept your first courage challenge from the Play-list Matrix.',
    route: null, // navigate to tab
  },
]

export default function PriorityOnboardingCard({
  userId,
  onboardingStatus,
  onNavigateToPlaylist,
  hasAcceptedChallenge,
  onAlignmentChange,
  onPhotoUploaded,
  essenceProfile,
  skills,
}) {
  // Alignment local state
  const [alignSkills, setAlignSkills] = useState(
    () => localStorage.getItem('priority_align_skills') === 'true'
  )
  const [alignProblems, setAlignProblems] = useState(
    () => localStorage.getItem('priority_align_problems') === 'true'
  )
  const [alignPersona, setAlignPersona] = useState(
    () => localStorage.getItem('priority_align_persona') === 'true'
  )

  // Photo step state
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  // Revoke blob URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Build avatar prompt from archetype + skills data
  const avatarPrompt = useMemo(() => {
    const archName = essenceProfile?.essence_archetype
    if (!archName) return null
    const archetypeData = essenceProfiles.essence_archetypes?.find(
      a => a.name.toLowerCase() === archName.toLowerCase()
    )
    const skillLabels = skills?.map(s => s.cluster_label) || []
    return buildAvatarPrompt({
      essenceName: archName,
      superpower: archetypeData?.superpower || '',
      poeticLine: archetypeData?.poetic_line || '',
      skills: skillLabels,
    })
  }, [essenceProfile, skills])

  // Recurring skip: stored as the completedCount at time of skip.
  // If completedCount has advanced past that number, the skip is stale and step 1 resurfaces.
  const completedCountExcludingPhoto = onboardingStatus.slice(1).filter(Boolean).length
  const skipCount = parseInt(localStorage.getItem('priority_photo_skip_at') || '-1', 10)
  const isPhotoSkipped = skipCount >= 0 && completedCountExcludingPhoto <= skipCount

  // Determine current step, factoring in the recurring skip
  let currentStepIndex = onboardingStatus.findIndex(done => !done)
  if (currentStepIndex === 0 && isPhotoSkipped) {
    const nextIncomplete = onboardingStatus.findIndex((done, i) => i > 0 && !done)
    currentStepIndex = nextIncomplete === -1 ? -1 : nextIncomplete
  }
  if (currentStepIndex === -1) return null // all done

  const step = ONBOARDING_STEPS[currentStepIndex]
  const completedCount = onboardingStatus.filter(Boolean).length

  const handleAlign = (key, setter) => {
    localStorage.setItem(key, 'true')
    setter(true)
    onAlignmentChange?.()
  }

  const handleSkipPhoto = () => {
    localStorage.setItem('priority_photo_skip_at', String(completedCountExcludingPhoto))
    setShowPromptModal(false)
    onAlignmentChange?.()
  }

  const promptText = avatarPrompt || 'Upload a selfie with your prompt to ChatGPT and ask it to create a Pixar-style avatar of you in purple and gold tones.'

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = promptText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  // Photo upload handlers
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WebP image')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image must be under 5MB')
      return
    }

    setUploadError(null)
    const compressed = await compressImage(file)
    setSelectedFile(compressed)
    setPreviewUrl(URL.createObjectURL(compressed))
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile || !userId) return
    setUploading(true)
    setUploadError(null)

    const url = await uploadEssenceAvatar(userId, selectedFile)
    if (!url) {
      setUploadError('Upload failed. Please try again.')
      setUploading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await updateEssencePreferences(userId, user?.email, { customImage: url })
    setUploading(false)
    setPreviewUrl(null)
    setSelectedFile(null)
    setShowPromptModal(false)
    localStorage.removeItem('priority_photo_skip_at')
    onPhotoUploaded?.()
  }

  // Step 1: Create Your Character
  const renderCharacterStep = () => (
    <div className="pt-photo-upload">
      <button
        className="pt-onboarding-cta"
        onClick={() => setShowPromptModal(true)}
      >
        Create Character
      </button>
      <button className="pt-onboarding-skip" onClick={handleSkipPhoto}>
        Skip for now
      </button>

      {showPromptModal && (
        <div className="pt-prompt-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="pt-prompt-modal" onClick={e => e.stopPropagation()}>
            {/* Prompt section */}
            {!previewUrl ? (
              <>
                <h3 className="pt-prompt-title">YOUR AVATAR PROMPT</h3>
                <p className="pt-prompt-intro">
                  Copy this prompt into ChatGPT, Midjourney, or any AI image tool to generate your custom avatar.
                </p>
                <div className="pt-prompt-box">{promptText}</div>
                <div className="pt-prompt-actions">
                  <button className="pt-prompt-copy-btn" onClick={handleCopyPrompt}>
                    {promptCopied ? 'Copied!' : 'Copy Prompt'}
                  </button>
                  <a
                    href="https://chat.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pt-prompt-chatgpt-btn"
                  >
                    Open ChatGPT
                  </a>
                </div>
                <div className="pt-prompt-divider" />
                <p className="pt-prompt-upload-label">Got your image? Upload it here:</p>
                <button
                  className="pt-prompt-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Avatar
                </button>
              </>
            ) : (
              <>
                <h3 className="pt-prompt-title">LOOKING GOOD</h3>
                <img src={previewUrl} alt="Preview" className="pt-photo-preview" />
                <div className="pt-prompt-actions">
                  <button
                    className="pt-prompt-copy-btn"
                    onClick={handleUploadPhoto}
                    disabled={uploading}
                  >
                    {uploading ? 'Saving...' : 'Save Avatar'}
                  </button>
                  <button
                    className="pt-prompt-chatgpt-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    Choose Different
                  </button>
                </div>
              </>
            )}
            {uploadError && <p className="pt-photo-error">{uploadError}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  )

  // Step 7: alignment check
  const renderAlignment = () => (
    <div className="pt-alignment-section">
      <p className="pt-alignment-intro">Do you feel aligned with your discovered categories?</p>

      <div className="pt-alignment-row">
        <span className="pt-alignment-label">Skills</span>
        {alignSkills ? (
          <span className="pt-alignment-confirmed">Aligned</span>
        ) : (
          <div className="pt-alignment-actions">
            <button className="pt-align-yes" onClick={() => handleAlign('priority_align_skills', setAlignSkills)}>Yes</button>
            <a href="/nikigai/skills?returnTo=/7-day-challenge" className="pt-align-no">Redo Flow</a>
          </div>
        )}
      </div>

      <div className="pt-alignment-row">
        <span className="pt-alignment-label">Problems</span>
        {alignProblems ? (
          <span className="pt-alignment-confirmed">Aligned</span>
        ) : (
          <div className="pt-alignment-actions">
            <button className="pt-align-yes" onClick={() => handleAlign('priority_align_problems', setAlignProblems)}>Yes</button>
            <a href="/nikigai/problems?returnTo=/7-day-challenge" className="pt-align-no">Redo Flow</a>
          </div>
        )}
      </div>

      <div className="pt-alignment-row">
        <span className="pt-alignment-label">Personas</span>
        {alignPersona ? (
          <span className="pt-alignment-confirmed">Aligned</span>
        ) : (
          <div className="pt-alignment-actions">
            <button className="pt-align-yes" onClick={() => handleAlign('priority_align_persona', setAlignPersona)}>Yes</button>
            <a href="/nikigai/persona?returnTo=/7-day-challenge" className="pt-align-no">Redo Flow</a>
          </div>
        )}
      </div>
    </div>
  )

  // Step 8: set play-list task
  const renderPlaylistStep = () => (
    <div className="pt-onboarding-step-content">
      {hasAcceptedChallenge ? (
        <span className="pt-alignment-confirmed">Challenge accepted! Refreshing...</span>
      ) : (
        <button className="pt-onboarding-cta" onClick={onNavigateToPlaylist}>
          Go to Play-list
        </button>
      )}
    </div>
  )

  return (
    <div className="pt-onboarding-card">
      <div className="pt-onboarding-header">
        <span className="pt-onboarding-eyebrow">Onboarding</span>
        <span className="pt-onboarding-counter">{completedCount}/8</span>
      </div>

      {/* Progress dots */}
      <div className="pt-onboarding-dots">
        {ONBOARDING_STEPS.map((s, i) => (
          <div
            key={i}
            className={`pt-onboarding-dot ${onboardingStatus[i] ? 'done' : i === currentStepIndex ? 'current' : 'locked'}`}
          >
            {onboardingStatus[i] ? '✓' : i + 1}
          </div>
        ))}
      </div>

      {/* Current step */}
      <div className="pt-onboarding-step">
        <div className="pt-onboarding-step-name">
          Step {currentStepIndex + 1}: {step.name}
        </div>
        <div className="pt-onboarding-step-desc">{step.desc}</div>

        {currentStepIndex === 0 && renderCharacterStep()}

        {currentStepIndex >= 1 && currentStepIndex <= 5 && step.route && (
          <a
            href={`${step.route}?returnTo=/7-day-challenge`}
            className="pt-onboarding-cta"
          >
            Start
          </a>
        )}

        {currentStepIndex === 6 && renderAlignment()}
        {currentStepIndex === 7 && renderPlaylistStep()}
      </div>
    </div>
  )
}
