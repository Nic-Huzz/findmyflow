import { useState, useEffect } from 'react'

export const VIBE_THEMES = {
  sunshine: { name: 'Sunshine', color: '#FFD93D', rgb: '255, 217, 61' },
  fire:     { name: 'Fire',     color: '#FF6B6B', rgb: '255, 107, 107' },
  violet:   { name: 'Violet',   color: '#A78BFA', rgb: '167, 139, 250' },
  forest:   { name: 'Forest',   color: '#51CF66', rgb: '81, 207, 102' },
  sky:      { name: 'Sky',      color: '#74C0FC', rgb: '116, 192, 252' },
  rose:     { name: 'Rose',     color: '#FF8CC8', rgb: '255, 140, 200' },
  teal:     { name: 'Teal',     color: '#20C997', rgb: '32, 201, 151' },
  amber:    { name: 'Amber',    color: '#E8A05C', rgb: '232, 160, 92' },
}

const STORAGE_KEY = 'fmf-vibe-theme'

function applyVibeTheme(themeKey) {
  const theme = VIBE_THEMES[themeKey]
  if (!theme) return

  const root = document.documentElement
  const [r, g, b] = theme.rgb.split(', ').map(Number)

  root.style.setProperty('--vibe-color', theme.color)
  root.style.setProperty('--vibe-rgb', theme.rgb)
  root.style.setProperty('--vibe-bg', `rgba(${theme.rgb}, 0.04)`)
  root.style.setProperty('--vibe-soft', `rgba(${theme.rgb}, 0.08)`)
  root.style.setProperty('--vibe-medium', `rgba(${theme.rgb}, 0.15)`)
  root.style.setProperty('--vibe-strong', `rgba(${theme.rgb}, 0.25)`)
  root.style.setProperty('--vibe-glow', `rgba(${theme.rgb}, 0.4)`)

  // Pre-computed opaque body tint (blend vibe at 5% over #f8f9fa)
  const alpha = 0.05
  const bgR = Math.round(248 * (1 - alpha) + r * alpha)
  const bgG = Math.round(249 * (1 - alpha) + g * alpha)
  const bgB = Math.round(250 * (1 - alpha) + b * alpha)
  root.style.setProperty('--vibe-body-bg', `rgb(${bgR}, ${bgG}, ${bgB})`)
}

/**
 * Call once at app startup to restore saved vibe color
 */
export function initVibeColor() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'violet'
  applyVibeTheme(saved)
}

/**
 * Hook for components that render the color picker
 */
export function useVibeColor() {
  const [themeKey, setThemeKey] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'violet'
  )

  useEffect(() => {
    applyVibeTheme(themeKey)
    localStorage.setItem(STORAGE_KEY, themeKey)
  }, [themeKey])

  return {
    themeKey,
    setThemeKey,
    themes: VIBE_THEMES,
    currentTheme: VIBE_THEMES[themeKey],
  }
}
