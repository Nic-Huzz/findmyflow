/**
 * WeeklyReviewCard.jsx
 *
 * Canvas-based shareable card for the Weekly Review.
 * Purple-to-gold gradient, 7 multiplier rows, brand footer.
 * Uses Web Share API with download fallback.
 *
 * CSS prefix: wr- (shared with WeeklyReview.css)
 * Created: 2026-06-14
 */

import { useRef, useEffect, useState } from 'react'

const CARD_WIDTH = 600
const CARD_HEIGHT = 800
const FONT = '-apple-system, BlinkMacSystemFont, sans-serif'

const MULTIPLIER_ROWS = [
  { icon: '🏠', label: 'Environment', key: 'environment' },
  { icon: '🤝', label: 'Network', key: 'network_text' },
  { icon: '🚀', label: 'Bet-Sizing', key: 'bet_sizing_text' },
  { icon: '🪞', label: 'Identity', key: 'identity' },
  { icon: '📈', label: 'Compounding', key: 'compounding' },
  { icon: '🧠', label: 'Learning', key: 'learning_text' },
  { icon: '⏱', label: 'Deep Work', key: 'attention_hours' },
]

function getValueText(review, key) {
  switch (key) {
    case 'environment': {
      const map = { yes: 'Yes', mostly: 'Mostly', no: 'No' }
      return map[review.environment] || '-'
    }
    case 'identity':
      return review.identity_did ? 'Slipped' : 'Aligned'
    case 'compounding':
      return review.compounding_did ? 'Consistent' : 'Missed'
    case 'attention_hours':
      return review.attention_hours ? `${review.attention_hours}h` : '-'
    default: {
      const val = review[key]
      return typeof val === 'string' ? val.slice(0, 35) : '-'
    }
  }
}

export default function WeeklyReviewCard({ review, weekLabel, onShare, onClose }) {
  const canvasRef = useRef(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    renderCard()
  }, [review])

  function renderCard() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT

    // Background gradient (purple → gold)
    const bgGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    bgGrad.addColorStop(0, '#5e17eb')
    bgGrad.addColorStop(0.6, '#7c3aed')
    bgGrad.addColorStop(1, '#E9A23B')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Subtle overlay
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    ctx.textAlign = 'center'

    // Header
    ctx.font = `bold 13px ${FONT}`
    ctx.fillStyle = '#E9A23B'
    ctx.fillText('WEEKLY MULTIPLIERS', CARD_WIDTH / 2, 60)

    ctx.font = `16px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText(`Week of ${weekLabel}`, CARD_WIDTH / 2, 85)

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(60, 110)
    ctx.lineTo(CARD_WIDTH - 60, 110)
    ctx.stroke()

    // Rows
    const startY = 155
    const rowHeight = 75
    ctx.textAlign = 'left'

    MULTIPLIER_ROWS.forEach((row, i) => {
      const y = startY + i * rowHeight

      // Icon + label
      ctx.font = `24px ${FONT}`
      ctx.fillStyle = '#fff'
      ctx.fillText(row.icon, 50, y)

      ctx.font = `bold 14px ${FONT}`
      ctx.fillStyle = '#E9A23B'
      ctx.fillText(row.label.toUpperCase(), 90, y - 8)

      // Value
      const value = getValueText(review, row.key)
      ctx.font = `15px ${FONT}`

      // Color coding for boolean fields
      if (row.key === 'identity') {
        ctx.fillStyle = review.identity_did ? 'rgba(255,150,150,0.9)' : 'rgba(150,255,180,0.9)'
      } else if (row.key === 'compounding') {
        ctx.fillStyle = review.compounding_did ? 'rgba(150,255,180,0.9)' : 'rgba(255,150,150,0.9)'
      } else if (row.key === 'environment') {
        const colors = { yes: 'rgba(150,255,180,0.9)', mostly: 'rgba(255,230,150,0.9)', no: 'rgba(255,150,150,0.9)' }
        ctx.fillStyle = colors[review.environment] || 'rgba(255,255,255,0.7)'
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
      }
      ctx.fillText(value, 90, y + 14)
    })

    // Footer divider
    const footerY = CARD_HEIGHT - 80
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.moveTo(60, footerY)
    ctx.lineTo(CARD_WIDTH - 60, footerY)
    ctx.stroke()

    // Footer branding
    ctx.textAlign = 'center'
    ctx.font = `12px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillText('viberise.nichuzz.com', CARD_WIDTH / 2, CARD_HEIGHT - 30)

    setImageDataUrl(canvas.toDataURL('image/png'))
  }

  async function handleShare() {
    if (!imageDataUrl) return
    setSharing(true)

    try {
      const blob = await (await fetch(imageDataUrl)).blob()
      const file = new File([blob], 'weekly-review.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My Weekly Multipliers',
          text: `Week of ${weekLabel}`,
          files: [file],
        })
        onShare?.()
      } else {
        downloadImage()
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        downloadImage()
      }
    } finally {
      setSharing(false)
    }
  }

  function downloadImage() {
    if (!imageDataUrl) return
    const link = document.createElement('a')
    link.download = 'weekly-review.png'
    link.href = imageDataUrl
    link.click()
    onShare?.()
  }

  return (
    <div className="wr-share-container">
      <h3 className="wr-share-title">Your Week in Review</h3>
      <p className="wr-share-sub">Share to earn +5 RP</p>

      <div className="wr-share-preview">
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {imageDataUrl && (
          <img src={imageDataUrl} alt="Weekly review card" className="wr-share-image" />
        )}
      </div>

      <div className="wr-share-actions">
        <button
          className="wr-share-btn"
          onClick={handleShare}
          disabled={sharing || !imageDataUrl}
        >
          {sharing ? 'Sharing...' : 'Share your week (+5 RP)'}
        </button>
        <button className="wr-share-done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
