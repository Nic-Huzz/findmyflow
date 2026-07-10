/**
 * CreatorShareCard.jsx — Shareable Creator Card modal (light foil border).
 * Shows a foil-bordered card (avatar + archetype + name + rule break + brand footer),
 * renders a 600x800 canvas version for navigator.share with download fallback.
 * Pattern copied from WeeklyReviewCard.jsx.
 */

import { useRef, useEffect, useState } from 'react'

const CARD_WIDTH = 600
const CARD_HEIGHT = 800
const FONT = '-apple-system, BlinkMacSystemFont, sans-serif'

// Word-wrap helper for canvas text
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export default function CreatorShareCard({ essenceName, archetypeLabel, ruleBreak, avatarUrl, onClose }) {
  const canvasRef = useRef(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Try to load the avatar image (CORS-safe); render with or without it
    if (avatarUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { if (!cancelled) renderCard(img) }
      img.onerror = () => { if (!cancelled) renderCard(null) }
      img.src = avatarUrl
    } else {
      renderCard(null)
    }

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarUrl, essenceName, archetypeLabel, ruleBreak])

  function renderCard(avatarImg) {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT

    // Foil border: gradient background frame
    const frameGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    frameGrad.addColorStop(0, '#5e17eb')
    frameGrad.addColorStop(0.5, '#E9A23B')
    frameGrad.addColorStop(1, '#5e17eb')
    ctx.fillStyle = frameGrad
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Light inner card
    const inset = 12
    const innerGrad = ctx.createLinearGradient(0, inset, 0, CARD_HEIGHT - inset)
    innerGrad.addColorStop(0, '#ffffff')
    innerGrad.addColorStop(1, '#f6f3fc')
    ctx.fillStyle = innerGrad
    roundRect(ctx, inset, inset, CARD_WIDTH - inset * 2, CARD_HEIGHT - inset * 2, 28)
    ctx.fill()

    // Soft gold glow top-right
    const glow = ctx.createRadialGradient(CARD_WIDTH - 80, 60, 10, CARD_WIDTH - 80, 60, 220)
    glow.addColorStop(0, 'rgba(233,162,59,0.14)')
    glow.addColorStop(1, 'rgba(233,162,59,0)')
    ctx.fillStyle = glow
    roundRect(ctx, inset, inset, CARD_WIDTH - inset * 2, CARD_HEIGHT - inset * 2, 28)
    ctx.fill()

    // Avatar block (image or gradient placeholder)
    const avSize = 200
    const avX = (CARD_WIDTH - avSize) / 2
    const avY = 100

    // Avatar gradient frame
    const avFrame = ctx.createLinearGradient(avX, avY, avX + avSize, avY + avSize)
    avFrame.addColorStop(0, '#E9A23B')
    avFrame.addColorStop(1, '#5e17eb')
    ctx.fillStyle = avFrame
    roundRect(ctx, avX - 6, avY - 6, avSize + 12, avSize + 12, 44)
    ctx.fill()

    if (avatarImg) {
      ctx.save()
      roundRect(ctx, avX, avY, avSize, avSize, 40)
      ctx.clip()
      // Cover-fit the image
      const scale = Math.max(avSize / avatarImg.width, avSize / avatarImg.height)
      const dw = avatarImg.width * scale
      const dh = avatarImg.height * scale
      ctx.drawImage(avatarImg, avX + (avSize - dw) / 2, avY + (avSize - dh) / 2, dw, dh)
      ctx.restore()
    } else {
      const avBg = ctx.createLinearGradient(avX, avY, avX, avY + avSize)
      avBg.addColorStop(0, '#7c3aed')
      avBg.addColorStop(1, '#4c1d95')
      ctx.fillStyle = avBg
      roundRect(ctx, avX, avY, avSize, avSize, 40)
      ctx.fill()
      ctx.font = `100px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('✨', CARD_WIDTH / 2, avY + avSize / 2 + 8)
      ctx.textBaseline = 'alphabetic'
    }

    ctx.textAlign = 'center'

    // Archetype label
    ctx.font = `bold 20px ${FONT}`
    ctx.fillStyle = '#c88520'
    ctx.fillText((archetypeLabel || 'Creator').toUpperCase(), CARD_WIDTH / 2, avY + avSize + 64)

    // Name
    ctx.font = `900 52px ${FONT}`
    ctx.fillStyle = '#1a1a2e'
    ctx.fillText(essenceName || 'Creator', CARD_WIDTH / 2, avY + avSize + 122)

    // Rule break (wrapped, max 4 lines), between divider lines
    if (ruleBreak) {
      ctx.font = `bold 28px ${FONT}`
      let lines = wrapText(ctx, ruleBreak, CARD_WIDTH - 140)
      if (lines.length > 4) {
        lines = lines.slice(0, 4)
        lines[3] = `${lines[3]}…`
      }
      const lineHeight = 40
      const blockTop = avY + avSize + 168
      const blockHeight = lines.length * lineHeight + 44

      ctx.strokeStyle = 'rgba(94,23,235,0.12)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(70, blockTop)
      ctx.lineTo(CARD_WIDTH - 70, blockTop)
      ctx.stroke()

      ctx.fillStyle = '#343a50'
      lines.forEach((line, i) => {
        ctx.fillText(line, CARD_WIDTH / 2, blockTop + 52 + i * lineHeight)
      })

      ctx.beginPath()
      ctx.moveTo(70, blockTop + blockHeight)
      ctx.lineTo(CARD_WIDTH - 70, blockTop + blockHeight)
      ctx.stroke()
    }

    // Brand footer
    const footGrad = ctx.createLinearGradient(180, 0, CARD_WIDTH - 180, 0)
    footGrad.addColorStop(0, '#5e17eb')
    footGrad.addColorStop(1, '#E9A23B')
    ctx.font = `bold 18px ${FONT}`
    ctx.fillStyle = footGrad
    ctx.fillText('VIBE RISE · CREATE.NICHUZZ.COM', CARD_WIDTH / 2, CARD_HEIGHT - 50)

    setImageDataUrl(canvas.toDataURL('image/png'))
  }

  async function handleShare() {
    if (!imageDataUrl) return
    setSharing(true)

    try {
      const blob = await (await fetch(imageDataUrl)).blob()
      const file = new File([blob], 'creator-card.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My Creator Card',
          files: [file],
        })
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
    link.download = 'creator-card.png'
    link.href = imageDataUrl
    link.click()
  }

  return (
    <div className="ch2-share-overlay" onClick={onClose}>
      <div className="ch2-share-wrap" onClick={e => e.stopPropagation()}>
        <div className="ch2-foil">
          <div className="ch2-foil-inner">
            <div className="ch2-foil-avatar">
              <div className="ch2-foil-avatar-inner">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" onError={e => { e.target.style.display = 'none' }} />
                  : '✨'}
              </div>
            </div>
            <div className="ch2-foil-type">{archetypeLabel || 'Creator'}</div>
            <div className="ch2-foil-name">{essenceName || 'Creator'}</div>
            {ruleBreak && <div className="ch2-foil-break">{ruleBreak}</div>}
            <div className="ch2-foil-footer">Vibe Rise · create.nichuzz.com</div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="ch2-share-actions">
          <button className="ch2-share-btn ghost" onClick={onClose}>Close</button>
          <button className="ch2-share-btn primary" onClick={handleShare} disabled={sharing || !imageDataUrl}>
            {sharing ? 'Sharing...' : 'Share ⤴'}
          </button>
        </div>
      </div>
    </div>
  )
}
