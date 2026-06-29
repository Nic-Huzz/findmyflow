/**
 * EssenceMirrorPrompt.jsx
 *
 * Shown on /7-day-challenge when user hasn't completed the Essence Mirror.
 * Three design options — uncomment the one you want to ship.
 *
 * Props:
 *   onNavigate — called with no args; parent should navigate('/essence-mirror')
 */

import { useState, useEffect } from 'react'
import './EssenceMirrorPrompt.css'

// ═══════════════════════════════════════════════════════════════════════════
// OPTION A — Full-Screen Cinematic Gate
// Blocks the challenge page entirely with a mysterious, premium overlay.
// ═══════════════════════════════════════════════════════════════════════════

export function EssenceMirrorGate({ onNavigate }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div className={`em-gate ${visible ? 'em-gate--visible' : ''}`}>
      {/* Animated orb background */}
      <div className="em-gate__orbs">
        <div className="em-gate__orb em-gate__orb--1" />
        <div className="em-gate__orb em-gate__orb--2" />
        <div className="em-gate__orb em-gate__orb--3" />
      </div>

      <div className="em-gate__content">
        <div className="em-gate__mirror-icon">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="url(#gate-grad)" strokeWidth="2" opacity="0.4" />
            <circle cx="40" cy="40" r="28" stroke="url(#gate-grad)" strokeWidth="1.5" opacity="0.6" />
            <circle cx="40" cy="40" r="16" fill="url(#gate-grad)" opacity="0.3" />
            <circle cx="40" cy="40" r="8" fill="url(#gate-grad)" opacity="0.8" />
            <defs>
              <linearGradient id="gate-grad" x1="0" y1="0" x2="80" y2="80">
                <stop stopColor="#E9A23B" />
                <stop offset="1" stopColor="#5e17eb" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p className="em-gate__kicker">Before you begin</p>
        <h1 className="em-gate__title">
          Discover who you<br />really are
        </h1>
        <p className="em-gate__body">
          The Essence Mirror reveals the superpower you've been hiding.
          12 cards. 3 minutes. One reflection that changes everything.
        </p>

        <button className="em-gate__cta" onClick={onNavigate}>
          <span>Start the Essence Mirror</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <p className="em-gate__footnote">Takes about 3 minutes</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION B — Floating Glass Card (modal over blurred content)
// Challenge page is visible but blurred behind a centered glass card.
// ═══════════════════════════════════════════════════════════════════════════

export function EssenceMirrorCard({ onNavigate }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div className={`em-card-overlay ${visible ? 'em-card-overlay--visible' : ''}`}>
      <div className="em-card">
        <div className="em-card__glow" />

        <div className="em-card__badge">✦ Step 1</div>

        <h2 className="em-card__title">
          Meet your Essence
        </h2>

        <p className="em-card__body">
          Every person has a hidden superpower. The Essence Mirror uses
          12 archetypal cards to uncover yours. It takes 3 minutes and
          unlocks the rest of Vibe Rise.
        </p>

        <div className="em-card__archetypes">
          {['🔥', '🎨', '🃏', '🔮', '⚡', '💛'].map((emoji, i) => (
            <span
              key={i}
              className="em-card__archetype"
              style={{ animationDelay: `${0.6 + i * 0.08}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <button className="em-card__cta" onClick={onNavigate}>
          Discover your archetype
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION C — Inline Hero Banner (sits at top, content visible below)
// Non-blocking but prominent. Pulses gently to draw attention.
// ═══════════════════════════════════════════════════════════════════════════

export function EssenceMirrorBanner({ onNavigate }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div className={`em-banner-wrap ${visible ? 'em-banner-wrap--visible' : ''}`}>
      <h3 className="em-banner__start-here">Start Here:</h3>
    <div className="em-banner">
      <div className="em-banner__shimmer" />

      <div className="em-banner__left">
        <div className="em-banner__icon-wrap">
          <span className="em-banner__icon">✦</span>
        </div>
        <div className="em-banner__text">
          <p className="em-banner__headline">
            Your Essence Mirror is waiting
          </p>
          <p className="em-banner__sub">
            3-minute archetype discovery. Unlocks everything else.
          </p>
        </div>
      </div>

      <button className="em-banner__cta" onClick={onNavigate}>
        Begin
      </button>
    </div>
    </div>
  )
}
