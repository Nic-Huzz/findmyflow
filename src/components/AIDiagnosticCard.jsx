/**
 * AIDiagnosticCard.jsx
 *
 * Canvas-based shareable scorecard for the AI Possibility Diagnostic.
 * Dot grid visual showing GREEN/YELLOW/RED capability breakdown.
 * Uses Web Share API with download fallback.
 *
 * Same pattern as WeeklyReviewCard.jsx.
 */

import { useRef, useEffect, useState } from 'react'

const CARD_WIDTH = 600
const CARD_HEIGHT = 700
const FONT = '-apple-system, BlinkMacSystemFont, sans-serif'

const DOT_SIZE = 16
const DOT_GAP = 8
const DOTS_PER_ROW = 12

const COLORS = {
  green: '#34d399',
  yellow: '#fbbf24',
  setup: '#94a3b8',
  red: '#f87171',
}

export default function AIDiagnosticCard({ results, businessModel, painLabel, onShare, onClose }) {
  const canvasRef = useRef(null)
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [sharing, setSharing] = useState(false)

  const green = results.filter(c => c.level >= 4).length
  const yellow = results.filter(c => c.level >= 2 && c.level < 4).length
  const setup = results.filter(c => c.level === 1).length
  const red = results.filter(c => c.level === 0).length
  const total = results.length

  useEffect(() => {
    renderCard()
  }, [results])

  function renderCard() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT

    // Background gradient (purple to dark)
    const bgGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    bgGrad.addColorStop(0, '#1a0533')
    bgGrad.addColorStop(0.5, '#0d001a')
    bgGrad.addColorStop(1, '#1a0533')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    // Subtle purple glow top-center
    const glow = ctx.createRadialGradient(CARD_WIDTH / 2, 80, 0, CARD_WIDTH / 2, 80, 250)
    glow.addColorStop(0, 'rgba(94, 23, 235, 0.15)')
    glow.addColorStop(1, 'rgba(94, 23, 235, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, CARD_WIDTH, 300)

    ctx.textAlign = 'center'

    // Header label
    ctx.font = `bold 12px ${FONT}`
    ctx.fillStyle = '#E9A23B'
    // letterSpacing is a newer Canvas API — supported in Chrome 99+, Safari 16.4+
    // Falls back gracefully to no spacing on older browsers
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px'
    ctx.fillText('AI POSSIBILITY SCORE', CARD_WIDTH / 2, 50)
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'

    // Business model + pain subtitle
    ctx.font = `14px ${FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    const subtitle = `${businessModel || 'Your Business'}  ·  ${painLabel || ''}`
    ctx.fillText(subtitle, CARD_WIDTH / 2, 75)

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(80, 95)
    ctx.lineTo(CARD_WIDTH - 80, 95)
    ctx.stroke()

    // ── Dot grid ──
    // Build ordered dot array: greens first, then yellows, then setup, then reds
    const dots = []
    for (let i = 0; i < green; i++) dots.push('green')
    for (let i = 0; i < yellow; i++) dots.push('yellow')
    for (let i = 0; i < setup; i++) dots.push('setup')
    for (let i = 0; i < red; i++) dots.push('red')

    const gridWidth = DOTS_PER_ROW * (DOT_SIZE + DOT_GAP) - DOT_GAP
    const gridStartX = (CARD_WIDTH - gridWidth) / 2
    const gridStartY = 130

    dots.forEach((color, i) => {
      const col = i % DOTS_PER_ROW
      const row = Math.floor(i / DOTS_PER_ROW)
      const x = gridStartX + col * (DOT_SIZE + DOT_GAP)
      const y = gridStartY + row * (DOT_SIZE + DOT_GAP)

      // Dot with subtle glow
      ctx.beginPath()
      ctx.arc(x + DOT_SIZE / 2, y + DOT_SIZE / 2, DOT_SIZE / 2, 0, Math.PI * 2)
      ctx.fillStyle = COLORS[color]
      ctx.fill()

      // Soft glow behind
      const dotGlow = ctx.createRadialGradient(
        x + DOT_SIZE / 2, y + DOT_SIZE / 2, DOT_SIZE / 4,
        x + DOT_SIZE / 2, y + DOT_SIZE / 2, DOT_SIZE
      )
      dotGlow.addColorStop(0, COLORS[color] + '40')
      dotGlow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(x + DOT_SIZE / 2, y + DOT_SIZE / 2, DOT_SIZE, 0, Math.PI * 2)
      ctx.fillStyle = dotGlow
      ctx.fill()
    })

    // ── Score breakdown ──
    const rows = Math.ceil(dots.length / DOTS_PER_ROW)
    const scoreStartY = gridStartY + rows * (DOT_SIZE + DOT_GAP) + 40

    // Divider above scores
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.moveTo(80, scoreStartY - 20)
    ctx.lineTo(CARD_WIDTH - 80, scoreStartY - 20)
    ctx.stroke()

    const scoreRows = [
      { color: COLORS.green, count: green, label: 'Fully automated' },
      { color: COLORS.yellow, count: yellow, label: 'AI assists' },
      { color: COLORS.setup, count: setup, label: 'One-time setup' },
      { color: COLORS.red, count: red, label: 'Human only' },
    ].filter(r => r.count > 0)

    scoreRows.forEach((row, i) => {
      const y = scoreStartY + i * 40

      // Colored dot
      ctx.beginPath()
      ctx.arc(140, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = row.color
      ctx.fill()

      // Label
      ctx.textAlign = 'left'
      ctx.font = `15px ${FONT}`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.fillText(row.label, 160, y + 5)

      // Count
      ctx.textAlign = 'right'
      ctx.font = `bold 20px ${FONT}`
      ctx.fillStyle = '#fff'
      ctx.fillText(String(row.count), CARD_WIDTH - 140, y + 7)
    })

    // ── Total ──
    const totalY = scoreStartY + scoreRows.length * 40 + 20
    ctx.textAlign = 'center'
    ctx.font = `bold 36px ${FONT}`
    const totalGrad = ctx.createLinearGradient(200, totalY - 20, 400, totalY + 10)
    totalGrad.addColorStop(0, '#a78bfa')
    totalGrad.addColorStop(1, '#E9A23B')
    ctx.fillStyle = totalGrad
    ctx.fillText(`${total} capabilities scanned`, CARD_WIDTH / 2, totalY)

    // Smaller restatement
    ctx.font = `14px ${FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillText(
      `${green} automated · ${yellow} assisted · ${setup + red} manual`,
      CARD_WIDTH / 2, totalY + 28
    )

    // ── Footer ──
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.beginPath()
    ctx.moveTo(80, CARD_HEIGHT - 60)
    ctx.lineTo(CARD_WIDTH - 80, CARD_HEIGHT - 60)
    ctx.stroke()

    ctx.font = `13px ${FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillText('What can AI do for your business?', CARD_WIDTH / 2, CARD_HEIGHT - 35)

    ctx.font = `bold 13px ${FONT}`
    ctx.fillStyle = '#E9A23B'
    ctx.fillText('viberise.nichuzz.com/try/ai-diagnostic', CARD_WIDTH / 2, CARD_HEIGHT - 15)

    setImageDataUrl(canvas.toDataURL('image/png'))
  }

  async function handleShare() {
    if (!imageDataUrl) return
    setSharing(true)

    try {
      const blob = await (await fetch(imageDataUrl)).blob()
      const file = new File([blob], 'ai-possibility-score.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My AI Possibility Score',
          text: `${green} capabilities I can fully automate, ${yellow} AI-assisted, ${total} scanned`,
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
    link.download = 'ai-possibility-score.png'
    link.href = imageDataUrl
    link.click()
    onShare?.()
  }

  return (
    <div style={{ textAlign: 'center', margin: '32px 0' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {imageDataUrl && (
        <img
          src={imageDataUrl}
          alt="AI Possibility Score"
          style={{ width: '100%', maxWidth: 400, borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <button
          onClick={handleShare}
          disabled={sharing || !imageDataUrl}
          className="cta-button primary"
        >
          {sharing ? 'Sharing...' : 'Share your score'}
        </button>
        {onClose && (
          <button onClick={onClose} className="cta-button secondary">
            Done
          </button>
        )}
      </div>
    </div>
  )
}
