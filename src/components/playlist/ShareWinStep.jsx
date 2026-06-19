/**
 * ShareWinStep — final step in GroanCompletionModal flow.
 *
 * Asks the user to optionally attach a photo + caption and share their
 * win to the public Play-List feed. Skipping fires the existing onComplete
 * callback unchanged. Sharing uploads media, creates a feed post, then
 * fires onComplete.
 */
import { useEffect, useRef, useState } from 'react'
import {
  uploadFeedMedia,
  createFeedPost,
  fetchPostEnrichment,
} from '../../lib/playlistFeedService'
import './ShareWinStep.css'

const MAX_CAPTION = 140

export default function ShareWinStep({
  userId,
  challenge,
  beforeState,
  afterState,
  onDone, // called whether shared or skipped
}) {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dimensions, setDimensions] = useState({ w: null, h: null })
  const [caption, setCaption] = useState('')
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)

  // Revoke blob URLs on unmount or when replaced
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFilePick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setError(null)
    setFile(f)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    const img = new Image()
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }

  const handleShare = async () => {
    if (!file) return
    setSharing(true)
    setError(null)
    try {
      const enrichment = await fetchPostEnrichment(userId)
      const { publicUrl } = await uploadFeedMedia(userId, file)
      await createFeedPost({
        userId,
        groanChallengeId: challenge?.id,
        challengeTitle: challenge?.title || challenge?.source_label || null,
        visibilityLayer: challenge?.visibility_layer || null,
        beforeState,
        afterState,
        mediaUrl: publicUrl,
        mediaWidth: dimensions.w,
        mediaHeight: dimensions.h,
        caption,
        enrichment,
      })
      setSharing(false)
      onDone?.({ shared: true })
    } catch (err) {
      console.error('Share error:', err)
      setError(err.message || 'Something went wrong sharing your win')
      setSharing(false)
    }
  }

  const handleSkip = () => onDone?.({ shared: false })

  return (
    <div className="sws-container">
      <h2 className="sws-title">Share your win?</h2>
      <p className="sws-subtitle">
        Everyone loves seeing other people's Wahoo's, share what you did!
      </p>

      {!previewUrl && (
        <button
          type="button"
          className="sws-picker"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="sws-picker-icon">📷</span>
          <span className="sws-picker-label">Add a photo</span>
          <span className="sws-picker-hint">(or skip below)</span>
        </button>
      )}

      {previewUrl && (
        <div className="sws-preview-wrap">
          <img src={previewUrl} alt="Preview" className="sws-preview" />
          <button
            type="button"
            className="sws-replace-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Replace
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFilePick}
        style={{ display: 'none' }}
      />

      {previewUrl && (
        <div className="sws-caption-wrap">
          <textarea
            className="sws-caption"
            placeholder="Say a few words about it..."
            maxLength={MAX_CAPTION}
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="sws-char-count">
            {caption.length}/{MAX_CAPTION}
          </div>
        </div>
      )}

      {error && <p className="sws-error">{error}</p>}

      <div className="sws-actions">
        {file && (
          <button
            type="button"
            className="sws-share-btn"
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing ? 'Sharing...' : 'Share Win'}
          </button>
        )}
        <button
          type="button"
          className="sws-done-btn"
          onClick={handleSkip}
          disabled={sharing}
        >
          {file ? 'Skip sharing' : 'Complete without photo'}
        </button>
      </div>
    </div>
  )
}
