import React, { useRef, useEffect, useState } from 'react'

const CARD_WIDTH = 600
const CARD_HEIGHT = 800

/**
 * ShareableArchetypeCard - Renders archetype as a shareable image card
 * Uses canvas for consistent rendering across devices
 */
function ShareableArchetypeCard({ essence, protective, imagePath, onClose }) {
  const canvasRef = useRef(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    renderCard()
  }, [essence, protective, imagePath])

  const renderCard = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT

    // Background gradient (purple to gold)
    const bgGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    bgGrad.addColorStop(0, '#5e17eb')
    bgGrad.addColorStop(0.6, '#7c3aed')
    bgGrad.addColorStop(1, '#E9A23B')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Subtle overlay pattern
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Avatar circle
    const avatarSize = 160
    const avatarX = CARD_WIDTH / 2
    const avatarY = 160

    if (imagePath) {
      try {
        const img = await loadImage(imagePath)
        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()

        // Cover fit
        const scale = Math.max(avatarSize / img.width, avatarSize / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, avatarX - w / 2, avatarY - h / 2, w, h)
        ctx.restore()
      } catch {
        // Draw fallback circle
        drawFallbackAvatar(ctx, avatarX, avatarY, avatarSize, essence?.name)
      }
    } else {
      drawFallbackAvatar(ctx, avatarX, avatarY, avatarSize, essence?.name)
    }

    // Avatar ring
    ctx.beginPath()
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 3
    ctx.stroke()

    // Essence name
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(essence?.name || 'Unknown', CARD_WIDTH / 2, 290)

    // Group badge
    if (essence?.group) {
      ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(essence.group, CARD_WIDTH / 2, 320)
    }

    // Divider line
    ctx.beginPath()
    ctx.moveTo(CARD_WIDTH * 0.2, 350)
    ctx.lineTo(CARD_WIDTH * 0.8, 350)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Poetic line
    if (essence?.poeticLine) {
      ctx.font = 'italic 16px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      wrapText(ctx, `"${essence.poeticLine}"`, CARD_WIDTH / 2, 390, CARD_WIDTH - 80, 24)
    }

    // Superpower section
    const spY = 470
    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = '#E9A23B'
    ctx.fillText('SUPERPOWER', CARD_WIDTH / 2, spY)

    if (essence?.superpower) {
      ctx.font = '15px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = '#fff'
      wrapText(ctx, essence.superpower, CARD_WIDTH / 2, spY + 28, CARD_WIDTH - 80, 22)
    }

    // Shadow section
    if (protective?.name) {
      const shY = 580
      ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText('SHADOW', CARD_WIDTH / 2, shY)

      ctx.font = '15px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(protective.name, CARD_WIDTH / 2, shY + 25)
    }

    // Footer branding
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillText('findmyflow.nichuzz.com', CARD_WIDTH / 2, CARD_HEIGHT - 30)

    try {
      setImageDataUrl(canvas.toDataURL('image/png'))
    } catch {
      // Canvas may be tainted by CORS — retry without the avatar image
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
      drawFallbackAvatar(ctx, avatarX, avatarY, avatarSize, essence?.name)
      // Re-render text (simplified)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText(essence?.name || 'Unknown', CARD_WIDTH / 2, 290)
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillText('findmyflow.nichuzz.com', CARD_WIDTH / 2, CARD_HEIGHT - 30)
      setImageDataUrl(canvas.toDataURL('image/png'))
    }
  }

  const handleShare = async () => {
    if (!imageDataUrl) return
    setSharing(true)

    try {
      const blob = await (await fetch(imageDataUrl)).blob()
      const file = new File([blob], 'my-archetype.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `I'm a ${essence?.name || 'Hero'}`,
          text: essence?.poeticLine || 'Discover your archetype at FindMyFlow',
          files: [file]
        })
      } else {
        // Fallback: download
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

  const downloadImage = () => {
    if (!imageDataUrl) return
    const link = document.createElement('a')
    link.download = 'my-archetype.png'
    link.href = imageDataUrl
    link.click()
  }

  return (
    <div className="edit-essence-overlay" onClick={onClose}>
      <div className="share-card-modal" onClick={e => e.stopPropagation()}>
        <div className="share-card-header">
          <h3>Your Archetype Card</h3>
          <button className="edit-essence-close" onClick={onClose}>×</button>
        </div>

        <div className="share-card-preview">
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {imageDataUrl && (
            <img src={imageDataUrl} alt="Archetype card" className="share-card-image" />
          )}
        </div>

        <div className="share-card-actions">
          <button className="share-card-btn share-btn" onClick={handleShare} disabled={sharing || !imageDataUrl}>
            {sharing ? 'Sharing...' : 'Share'}
          </button>
          <button className="share-card-btn download-btn" onClick={downloadImage} disabled={!imageDataUrl}>
            Download
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper: load image as promise
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Helper: draw fallback avatar circle with initial
function drawFallbackAvatar(ctx, x, y, size, name) {
  ctx.beginPath()
  ctx.arc(x, y, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fill()

  ctx.font = `bold ${size * 0.4}px -apple-system, BlinkMacSystemFont, sans-serif`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name?.charAt(0) || '?', x, y)
  ctx.textBaseline = 'alphabetic'
}

// Helper: wrap text on canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (const word of words) {
    const testLine = line + word + ' '
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY)
      line = word + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
}

export default ShareableArchetypeCard
