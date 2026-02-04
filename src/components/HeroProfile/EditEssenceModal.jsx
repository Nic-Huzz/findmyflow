import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  uploadEssenceAvatar,
  updateEssencePreferences,
  compressImage,
  buildAvatarPrompt
} from '../../lib/essencePreferences'

const MAX_NAME_LENGTH = 40
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function EditEssenceModal({
  userId, userEmail, currentName, originalName, currentImage, originalImage,
  // Extra archetype data for prompt generator
  group, superpower, poeticLine, skills, problems, persona,
  onClose, onSaved
}) {
  const [customName, setCustomName] = useState(currentName !== originalName ? currentName : '')
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const [selectedFile, setSelectedFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const fileInputRef = useRef(null)
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

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const isCustomName = customName.trim() !== ''

  // Detect if anything has actually changed from current state
  const hasChanges = useMemo(() => {
    const nameChanged = customName.trim() !== '' || (currentName !== originalName && customName.trim() === '')
    const imageChanged = selectedFile !== null || (previewUrl === originalImage && currentImage !== originalImage)
    // Only if name input differs from what's already saved, or image changed
    const currentCustom = currentName !== originalName ? currentName : ''
    const nameActuallyDifferent = customName.trim() !== (currentCustom || '')
    return nameActuallyDifferent || imageChanged
  }, [customName, currentName, originalName, selectedFile, previewUrl, originalImage, currentImage])

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

    // Compress before previewing
    const compressed = await compressImage(file)
    setSelectedFile(compressed)
    setPreviewUrl(URL.createObjectURL(compressed))
  }

  const handleResetName = () => {
    setCustomName('')
  }

  const handleResetImage = () => {
    setSelectedFile(null)
    setPreviewUrl(originalImage)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Generate AI prompt for external tools
  const avatarPrompt = useMemo(() => {
    return buildAvatarPrompt({
      essenceName: customName.trim() || originalName,
      group, superpower, poeticLine, skills, problems, persona
    })
  }, [customName, originalName, group, superpower, poeticLine, skills, problems, persona])

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(avatarPrompt)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = avatarPrompt
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    }
  }

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    setError(null)

    try {
      let imageUrl = undefined

      // Upload new image if selected
      if (selectedFile) {
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

      // Optimistic: call onSaved immediately so parent refreshes
      onSaved()
      setToast('Saved!')

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
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photo
              </button>
              <button
                className="edit-essence-prompt-btn"
                onClick={() => setShowPrompt(!showPrompt)}
                title="Generate an AI prompt for your avatar"
              >
                AI Prompt
              </button>
              {(selectedFile || (currentImage && currentImage !== originalImage)) && (
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
            <span className="edit-essence-hint">JPG, PNG, or WebP — auto-compressed for upload</span>
          </div>
        </div>

        {/* AI Prompt Section */}
        {showPrompt && (
          <div className="edit-essence-prompt-section">
            <label className="edit-essence-label">Your Avatar Prompt</label>
            <p className="edit-essence-prompt-desc">
              Copy this prompt into ChatGPT, Midjourney, or any AI image tool to generate your custom avatar.
            </p>
            <div className="edit-essence-prompt-box">
              {avatarPrompt}
            </div>
            <button className="edit-essence-copy-btn" onClick={handleCopyPrompt}>
              {promptCopied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
        )}

        {error && <div className="edit-essence-error">{error}</div>}

        <div className="edit-essence-buttons">
          <button className="edit-essence-cancel" onClick={onClose}>Cancel</button>
          <button
            className="edit-essence-save"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditEssenceModal
