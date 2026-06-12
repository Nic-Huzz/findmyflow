import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  uploadEssenceAvatar,
  updateEssencePreferences,
  updateEssenceField,
  resetEssenceField,
  compressImage,
  buildAvatarPrompt
} from '../../lib/essencePreferences'
import { supabase } from '../../lib/supabaseClient'
import { syncScoreToLeaderboard } from '../../lib/scoringCategories'

const MAX_NAME_LENGTH = 40
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function EditEssenceModal({
  userId, userEmail, currentName, originalName, currentImage, originalImage,
  currentTagline, originalTagline,
  // Extra archetype data for prompt generator
  group, superpower, poeticLine, skills, problems, persona,
  onClose, onSaved
}) {
  const [customName, setCustomName] = useState(currentName !== originalName ? currentName : '')
  const [customTagline, setCustomTagline] = useState(currentTagline !== originalTagline ? currentTagline : '')
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const [selectedFile, setSelectedFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [selfieFile, setSelfieFile] = useState(null)
  const [selfieStorageUrl, setSelfieStorageUrl] = useState(null)
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState(null)
  const fileInputRef = useRef(null)
  const selfieInputRef = useRef(null)
  const closeTimeoutRef = useRef(null)
  const prevBlobRef = useRef(null)

  // Clean up blob URLs to prevent memory leaks (track previous to catch reset transitions)
  useEffect(() => {
    if (prevBlobRef.current && prevBlobRef.current !== previewUrl && prevBlobRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevBlobRef.current)
    }
    prevBlobRef.current = previewUrl
  }, [previewUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevBlobRef.current && prevBlobRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevBlobRef.current)
      }
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  // Hide bottom toolbar when modal is open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => {
      document.body.classList.remove('modal-active')
    }
  }, [])

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const isCustomName = customName.trim() !== ''

  // Detect if anything has actually changed from current state
  const hasChanges = useMemo(() => {
    const imageChanged = selectedFile !== null || aiGeneratedUrl !== null || (previewUrl === originalImage && currentImage !== originalImage)
    const currentCustom = currentName !== originalName ? currentName : ''
    const nameActuallyDifferent = customName.trim() !== (currentCustom || '')
    const currentCustomTagline = currentTagline !== originalTagline ? currentTagline : ''
    const taglineActuallyDifferent = customTagline.trim() !== (currentCustomTagline || '')
    return nameActuallyDifferent || imageChanged || taglineActuallyDifferent
  }, [customName, currentName, originalName, selectedFile, aiGeneratedUrl, previewUrl, originalImage, currentImage, customTagline, currentTagline, originalTagline])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 5MB')
      return
    }

    setError(null)
    setAiGeneratedUrl(null)

    // Compress before previewing
    const compressed = await compressImage(file)
    setSelectedFile(compressed)
    setPreviewUrl(URL.createObjectURL(compressed))
  }

  const handleSelfieSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 5MB')
      return
    }
    setError(null)
    const compressed = await compressImage(file)
    setSelfieFile(compressed)
    handleGenerate(compressed)
  }

  // Generate AI prompt from archetype data (used by handleGenerate)
  const avatarPrompt = useMemo(() => {
    return buildAvatarPrompt({
      essenceName: customName.trim() || originalName,
      superpower, poeticLine, skills, problems, persona
    })
  }, [customName, originalName, superpower, poeticLine, skills, problems, persona])

  const handleGenerate = async (selfieOverride) => {
    const file = selfieOverride || selfieFile
    if (!file) {
      try { selfieInputRef.current?.click() } catch (e) {
        setError('Could not open photo picker. Please check your permissions.')
      }
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // Upload selfie once, reuse URL for retries
      let url = selfieStorageUrl
      if (!url) {
        url = await uploadEssenceAvatar(userId, file)
        if (!url) {
          setError('Failed to upload photo. Please try again.')
          return
        }
        setSelfieStorageUrl(url)
      }

      // Call edge function
      const { data, error: fnError } = await supabase.functions.invoke('generate-avatar', {
        body: {
          selfie_url: url,
          prompt: avatarPrompt,
        },
      })

      if (fnError) {
        throw new Error(fnError.message || 'Generation failed')
      }

      if (data?.error === 'content_policy') {
        setError(data.message || "Generation couldn't complete. Try a different photo.")
        return
      }

      if (data?.error) {
        setError(data.error)
        return
      }

      if (!data?.url) {
        setError('No image was returned. Please try again.')
        return
      }

      // Success
      setAiGeneratedUrl(data.url)
      setPreviewUrl(data.url)
      setSelectedFile(null)
      setAttemptsUsed(prev => prev + 1)
    } catch (err) {
      console.error('Avatar generation error:', err)
      setError('Something went wrong generating your avatar. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleResetName = () => {
    setCustomName('')
  }

  const handleResetImage = () => {
    setSelectedFile(null)
    setAiGeneratedUrl(null)
    setSelfieFile(null)
    setSelfieStorageUrl(null)
    setPreviewUrl(originalImage)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (selfieInputRef.current) selfieInputRef.current.value = ''
  }

  const autoCompleteHeroQuest = async () => {
    try {
      const { data: progressData } = await supabase
        .from('challenge_progress')
        .select('challenge_instance_id, total_points')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      if (!progressData?.challenge_instance_id) return

      const { data: existingCompletion } = await supabase
        .from('quest_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_instance_id', progressData.challenge_instance_id)
        .eq('quest_id', 'bonus_customize_hero')
        .maybeSingle()

      if (!existingCompletion) {
        await supabase
          .from('quest_completions')
          .insert([{
            user_id: userId,
            challenge_instance_id: progressData.challenge_instance_id,
            quest_id: 'bonus_customize_hero',
            quest_category: 'Bonus',
            quest_type: 'anytime',
            points_earned: 5,
            reflection_text: 'Customized hero avatar image',
            challenge_day: 0
          }])

        await supabase
          .from('challenge_progress')
          .update({
            total_points: (progressData.total_points || 0) + 5,
            last_active_date: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('challenge_instance_id', progressData.challenge_instance_id)
          .eq('status', 'active')

        syncScoreToLeaderboard(supabase, {
          userId,
          questCategory: 'Bonus',
          points: 5,
          projectId: null,
          source: 'hero_image_bonus'
        }).catch(() => {})
      }
    } catch (err) {
      console.warn('Could not auto-complete hero image quest:', err)
    }
  }

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    setError(null)

    try {
      let imageUrl = undefined

      // Upload new image if selected
      if (aiGeneratedUrl && aiGeneratedUrl !== currentImage) {
        imageUrl = aiGeneratedUrl
      } else if (selectedFile) {
        const url = await uploadEssenceAvatar(userId, selectedFile)
        if (!url) {
          setError('Failed to upload image. Please try again.')
          setSaving(false)
          return
        }
        imageUrl = url
      } else if (previewUrl === originalImage && currentImage !== originalImage) {
        // User reset image back to default
        imageUrl = null
      }

      const updates = {}
      if (customName.trim()) {
        updates.customName = customName.trim()
      } else if (currentName !== originalName) {
        // User cleared custom name — reset to default
        updates.customName = null
      }
      if (imageUrl !== undefined) {
        updates.customImage = imageUrl
      }

      // Only save if there are actual changes
      if (Object.keys(updates).length > 0) {
        const result = await updateEssencePreferences(userId, userEmail, updates)
        if (result.error) {
          setError('Failed to save. Please try again.')
          setSaving(false)
          return
        }
      }

      // Save tagline if changed
      if (originalTagline) {
        const currentCustomTagline = currentTagline !== originalTagline ? currentTagline : ''
        if (customTagline.trim() !== (currentCustomTagline || '')) {
          if (customTagline.trim() === '') {
            await resetEssenceField(userId, userEmail, 'tagline')
          } else {
            await updateEssenceField(userId, userEmail, 'tagline', { value: customTagline.trim(), mode: 'manual' })
          }
        }
      }

      // Optimistic: call onSaved immediately so parent refreshes
      onSaved()
      setToast('Saved!')

      // Auto-complete bonus quest if image was updated
      if (selectedFile || aiGeneratedUrl) {
        autoCompleteHeroQuest()
      }

      // Brief delay so toast is visible before closing
      closeTimeoutRef.current = setTimeout(() => onClose(), 600)
    } catch (err) {
      console.error('Error saving essence preferences:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Character count bar width (only visible near limit)
  const nameRatio = customName.length / MAX_NAME_LENGTH
  const showCharBar = nameRatio > 0.6

  return (
    <div className="edit-essence-overlay" onClick={onClose}>
      <div className="edit-essence-modal" onClick={e => e.stopPropagation()}>
        {/* Toast */}
        {toast && <div className="edit-essence-toast">{toast}</div>}

        <div className="edit-essence-header">
          <h3>Customize Your Archetype</h3>
          <button className="edit-essence-close" onClick={onClose}>×</button>
        </div>

        {/* Name Input */}
        <div className="edit-essence-field">
          <label className="edit-essence-label">Display Name</label>
          <div className="edit-essence-input-row">
            <input
              type="text"
              className="edit-essence-input"
              value={customName}
              onChange={e => setCustomName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              placeholder={originalName}
              maxLength={MAX_NAME_LENGTH}
            />
            {isCustomName && (
              <button className="edit-essence-reset" onClick={handleResetName} title="Reset to default">
                ↩
              </button>
            )}
          </div>
          <div className="edit-essence-char-row">
            <span className="edit-essence-hint">
              Original: {originalName}
            </span>
            {showCharBar && (
              <div className="edit-essence-char-bar">
                <div
                  className={`edit-essence-char-fill ${nameRatio > 0.9 ? 'near-limit' : ''}`}
                  style={{ width: `${nameRatio * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tagline Input */}
        {originalTagline && (
          <div className="edit-essence-field">
            <label className="edit-essence-label">Tagline</label>
            <div className="edit-essence-input-row">
              <input
                type="text"
                className="edit-essence-input"
                value={customTagline}
                onChange={e => setCustomTagline(e.target.value.slice(0, 80))}
                placeholder={originalTagline}
                maxLength={80}
              />
              {customTagline.trim() !== '' && (
                <button className="edit-essence-reset" onClick={() => setCustomTagline('')} title="Reset to default">
                  ↩
                </button>
              )}
            </div>
            <span className="edit-essence-hint">
              Original: {originalTagline}
            </span>
          </div>
        )}

        {/* Image Upload */}
        <div className="edit-essence-field">
          <label className="edit-essence-label">Avatar Photo</label>
          <div className="edit-essence-upload-area">
            {previewUrl && (
              <div className="edit-essence-preview-circle">
                <img src={previewUrl} alt="Preview" />
              </div>
            )}
            <div className="edit-essence-upload-actions">
              <button
                className="edit-essence-upload-btn"
                onClick={() => {
                  try { fileInputRef.current?.click() } catch (e) {
                    setError('Could not open photo picker. Please check your permissions.')
                  }
                }}
                disabled={generating}
              >
                Choose Photo
              </button>
              <button
                className="edit-essence-generate-btn"
                onClick={() => handleGenerate()}
                disabled={generating || attemptsUsed >= 3}
                title={attemptsUsed >= 3 ? 'Maximum attempts reached' : 'Generate a Pixar-style avatar from your photo'}
              >
                {generating ? 'Generating...' : attemptsUsed > 0 ? `Try Again (${3 - attemptsUsed} left)` : 'Generate with AI'}
              </button>
              {(selectedFile || aiGeneratedUrl || (currentImage && currentImage !== originalImage)) && (
                <button className="edit-essence-reset" onClick={handleResetImage} title="Reset to default">
                  ↩
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleSelfieSelect}
              style={{ display: 'none' }}
            />
            <span className="edit-essence-hint">
              {generating
                ? 'Creating your avatar... this takes about 15 seconds'
                : 'Upload your own photo, or generate a Pixar-style avatar from a selfie'}
            </span>
          </div>
        </div>

        {error && <div className="edit-essence-error">{error}</div>}

        <div className="edit-essence-buttons">
          <button className="edit-essence-cancel" onClick={onClose}>Cancel</button>
          <button
            className="edit-essence-save"
            onClick={handleSave}
            disabled={saving || generating || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditEssenceModal
